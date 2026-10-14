# 合成工具 {#synthetics}

**合成工具（synthetic instrument）** 是本地定义的工具，其价格由其他工具推导而来。
它可以组合来自单一或任意多个交易场所的组件，并把结果作为标准 Nautilus 工具暴露，
交易场所代码为 `SYNTH`。

合成工具适用于：

- 让 `DataActor` 和 `Strategy` 组件订阅报价或成交数据流。
- 用推导出的价格触发模拟订单。
- 用合成报价或合成成交构建 K 线（bar）。

:::info
合成工具不能被直接交易。它们只存在于平台本地，用作分析工具。
未来 Nautilus 可能支持依据合成工具的行为交易其组件工具。
:::

## 公式语言 {#formula-language}

每个合成工具都定义一个推导公式。Nautilus 用内置的数值表达式引擎求值该公式，
并把最终的数值结果转换为合成的 `Price`。

### 支持的语法 {#supported-syntax}

公式可以直接引用组件的 `InstrumentId` 值，包括含 `/` 和 `-` 的 ID。

| 构造           | 示例                                        | 说明                                                                 |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| 组件引用 | `BTCUSDT.BINANCE`                              | 使用 `InstrumentId` 的原始文本。                                      |
| 组件引用 | `AUD/USD.SIM`                                  | 含 `/` 的 ID 合法。                                         |
| 组件引用 | `ETH-USDT-SWAP.OKX`                            | 含 `-` 的 ID 合法。                                         |
| 数值字面量     | `1`、`0.5`、`1.2e-3`                           | 按 `f64` 语义求值。                                       |
| 布尔字面量     | `true`、`false`                                | 用于条件与逻辑表达式。                           |
| 括号         | `(a + b) / 2`                                  | 用括号改变优先级。                               |
| 一元运算符     | `-x`、`!flag`                                  | 一元 `-` 对数值取负，一元 `!` 对布尔值取反。                |
| 二元运算符    | `+ - * / % ^`、`== !=`、`< <= > >=`、`&& \|\|` | 算术运算符作用于数值，逻辑运算符作用于布尔值。                 |
| 局部赋值    | `spread = a - b; spread / 2`                   | 语句从左到右执行，公式必须以值结尾。 |
| 注释            | `// line`、`/* block */`                       | 注释被忽略。                                                 |

:::note
新公式应使用 `InstrumentId` 原始值。为向后兼容，把组件 ID 中的 `-` 替换为 `_`
的旧写法仍然受支持。
:::

### 运算符优先级 {#operator-precedence}

表达式引擎按以下顺序求值，优先级从高到低：

| 级别   | 运算符            | 说明                                                        |
| ------- | -------------------- | ------------------------------------------------------------ |
| 最高 | `^`                  | 幂运算，右结合。                           |
|         | 一元 `-`、一元 `!` | `-2 ^ 2` 按 `-(2 ^ 2)` 求值。                            |
|         | `*`、`/`、`%`        | 乘法、除法、取模。                        |
|         | `+`、`-`             | 加法、减法。                                    |
|         | `<`、`<=`、`>`、`>=` | 数值比较。                                         |
|         | `==`、`!=`           | 相等与不等，两侧类型必须相同。 |
| 最低  | `&&`、`\|\|`         | 布尔运算符。                                           |

赋值不是表达式运算符。用 `;` 分隔语句，并把最后一条语句设为
合成工具要输出的值。

### 内置函数 {#built-in-functions}

| 函数 | 签名                              | 说明                                                                                                     |
| -------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `abs`    | `abs(x)`                               | 绝对值。                                                                                           |
| `ceil`   | `ceil(x)`                              | 向上取整。                                                                                                  |
| `floor`  | `floor(x)`                             | 向下取整。                                                                                                    |
| `round`  | `round(x)`                             | 按 Rust `f64` 规则四舍五入到最近整数。                                                      |
| `min`    | `min(x1, x2, ...)`                     | 接受一个或多个数值参数。                                                                    |
| `max`    | `max(x1, x2, ...)`                     | 接受一个或多个数值参数。                                                                    |
| `if`     | `if(condition, when_true, when_false)` | 条件必须是布尔值，两个分支类型必须相同，只求值被选中的分支。 |

### 类型规则 {#type-rules}

- 组件输入是数值。
- 算术运算符要求数值操作数，返回数值结果。
- `<`、`<=`、`>`、`>=` 要求数值操作数，返回布尔结果。
- `==` 和 `!=` 接受任意匹配的类型（同为数值或同为布尔），返回布尔结果。
- `&&`、`||` 和一元 `!` 要求布尔操作数。
- `&&` 和 `||` 短路求值，仅在必要时计算右侧。
- 局部变量必须先赋值后使用。
- 局部变量名须以 ASCII 字母或 `_` 开头，其后续字符只能是 ASCII 字母、数字或 `_`。
- 公式的最终结果必须是数值。以赋值结尾或结果为布尔值的公式对合成工具无效。

### 限制 {#limits}

表达式引擎强制以下编译期限制，超限的公式在构造时给出明确错误。

| 限制           | 值 | 说明                                                                                     |
| --------------- | ----- | ----------------------------------------------------------------------------------------------- |
| 栈深度     | 32    | 求值栈上中间值的最大数量。                                  |
| 局部变量 | 16    | 不同局部变量名的最大数量。                                                |
| 嵌套深度   | 128   | 语法嵌套与表达式树的最大深度，顶层表达式计为一层。 |

8 个组件的加权和峰值栈深为 3、局部变量为 0。N 个组件的加权和会构建深度为
N + 1 的树，因此嵌套深度限制把加权和的上限压到 127 个组件。

### 示例 {#examples}

```python
# Simple spread
formula = "BTCUSDT.BINANCE - ETHUSDT.BINANCE"

# Average of two FX pairs
formula = "(AUD/USD.SIM + NZD/USD.SIM) / 2"

# Reuse an intermediate value
formula = "spread = BTCUSDT.BINANCE - ETHUSDT.BINANCE; spread / 2"

# Conditional output
formula = "if(BTCUSDT.BINANCE > ETHUSDT.BINANCE, BTCUSDT.BINANCE, ETHUSDT.BINANCE)"
```

## 创建合成工具 {#creating-a-synthetic-instrument}

创建合成工具前，确保所有组件工具已存在于缓存中，并同时订阅每个组件的报价或成交数据流
以及合成工具的数据流。合成报价只由组件报价推导，合成成交只由组件成交推导。

组件的 tick 到达时，引擎将其与其他组件缓存中的最新价格合并，计算合成价格。
在**每个组件都至少产生一个 tick 之前**，合成工具不发布任何数据。

下例在 actor 或策略中创建一个合成工具，表示 Binance 上比特币与以太坊现货价格的简单价差，
假定 `BTCUSDT.BINANCE` 和 `ETHUSDT.BINANCE` 已在缓存中。

```python
from nautilus_trader.model import SyntheticInstrument

btcusdt_binance_id = InstrumentId.from_str("BTCUSDT.BINANCE")
ethusdt_binance_id = InstrumentId.from_str("ETHUSDT.BINANCE")

synthetic = SyntheticInstrument(
    symbol=Symbol("BTC-ETH:BINANCE"),
    price_precision=8,
    components=[
        btcusdt_binance_id,
        ethusdt_binance_id,
    ],
    formula=f"{btcusdt_binance_id} - {ethusdt_binance_id}",
    ts_event=self.clock.timestamp_ns(),
    ts_init=self.clock.timestamp_ns(),
)

self._synthetic_id = synthetic.id
self.add_synthetic(synthetic)
self.subscribe_quotes(self._synthetic_id)
```

:::note
上例中合成工具的 `instrument_id` 为 `{symbol}.SYNTH`，即
`BTC-ETH:BINANCE.SYNTH`。
:::

## 更新公式 {#updating-formulas}

可以随时更新合成工具的公式。

```python
synthetic = self.cache.synthetic(self._synthetic_id)

new_formula = "(BTCUSDT.BINANCE + ETHUSDT.BINANCE) / 2"
synthetic.change_formula(new_formula)

self.update_synthetic(synthetic)
```

## 触发工具 ID {#trigger-instrument-ids}

可以用合成价格触发模拟订单。下例中，合成价格达到触发条件后，
合成工具会释放一个模拟订单。

```python
order = self.order_factory.limit(
    instrument_id=InstrumentId.from_str("ETHUSDT.BINANCE"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("1.5"),
    price=Price.from_str("30000.00000000"),
    emulation_trigger=TriggerType.DEFAULT,
    trigger_instrument_id=self._synthetic_id,
)

self.submit_order(order)
```

## 性能 {#performance}

公式在构造时编译一次，此后每收到一个组件价格 tick 求值一次。表达式引擎求值时使用
零分配的 `f64` 栈，对 tick 处理路径的额外开销可以忽略。

在 Apple M4 Pro、rustc 1.94.1、release profile（opt-level 3）下的实测：

### 求值（热路径） {#evaluation-hot-path}

| 公式模式                         | 耗时  |
| --------------------------------------- | ----- |
| `(A + B) / 2.0`                         | 12 ns |
| `A * 0.4 + B * 0.3 + C * 0.2 + D * 0.1` | 18 ns |
| `if(A > B, A - B, B - A)`               | 12 ns |
| `spread = A - B; mid = ...; mid + ...`  | 19 ns |
| `max(min(A, B * 20), abs(A - B))`       | 15 ns |

### 求值伸缩性（加权和） {#evaluation-scaling-weighted-sum}

| 组件数 | 耗时  |
| ---------- | ----- |
| 2          | 14 ns |
| 4          | 18 ns |
| 8          | 28 ns |

### 编译（冷路径） {#compilation-cold-path}

| 公式模式  | 耗时   |
| ---------------- | ------ |
| 简单平均   | 675 ns |
| 4 输入加权 | 1.4 us |
| 条件表达式      | 1.0 us |
| 含局部变量      | 1.3 us |
| 含连字符 ID   | 755 ns |

## 错误处理 {#error-handling}

Nautilus 在每个边界校验合成工具。公式编译会拒绝未知符号、类型错误和容量溢出；
求值会在输入数量错误或非有限价格（NaN、Infinity）进入公式之前将其拒绝。

输入要求与异常见
[`SyntheticInstrument` API Reference](https://nautilustrader.io/docs/python-api-latest/model/instruments.html#nautilus_trader.model.SyntheticInstrument)。

## 相关指南 {#related-guides}

- [工具](./instruments/index.md) - 工具定义与各交易场所专属的工具类型。
- [数据](./data/index.md) - 引用工具的行情数据类型。
- [订单](./orders/index.md) - 订单可用合成工具 ID 作为模拟触发源。
