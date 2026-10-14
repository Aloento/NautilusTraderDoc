# Greeks

Nautilus 提供两条处理期权 Greeks 的路径。Greeks 度量期权价格对市场变量变化的响应：

1. **场所提供的 Greeks**：由支持的场所实时流式推送，经
   `OptionGreeks` 数据类型与期权链聚合系统接入。
1. **本地 Greeks 计算器**：`GreeksCalculator` 从缓存行情计算 Black-Scholes Greeks，
   支持组合聚合、冲击情景与 beta 加权。

两条路径可独立使用也可组合。场所 Greeks 经数据订阅系统到达，无需本地计算。
本地计算器覆盖不流式推送 Greeks 的场所、回测，以及冲击、beta 加权、
百分比 Greeks 等自定义调整。

## 场所提供的 Greeks {#venue-provided-greeks}

### OptionGreeks {#optiongreeks}

`OptionGreeks` 类型表示场所提供的单个期权合约的敏感度。它是 Rust 原生类型，
经 PyO3 暴露给 Python。

| 字段              | 类型               | 说明                                         |
| ------------------ | ------------------ | --------------------------------------------------- |
| `instrument_id`    | `InstrumentId`     | 这组 Greeks 所属的期权合约。          |
| `convention`       | `GreeksConvention` | Greeks 的计价基准（numeraire）约定。                |
| `delta`            | `float`            | 标的每变动一单位期权价格的变化率。 |
| `gamma`            | `float`            | 标的每变动一单位 delta 的变化率。        |
| `vega`             | `float`            | 场所报告的 vega。                                |
| `theta`            | `float`            | 场所报告的 theta。                               |
| `rho`              | `float`            | 场所报告的 rho，默认为零。       |
| `mark_iv`          | `float` 或 None    | mark 隐含波动率。                            |
| `bid_iv`           | `float` 或 None    | 买价隐含波动率。                             |
| `ask_iv`           | `float` 或 None    | 卖价隐含波动率。                             |
| `underlying_price` | `float` 或 None    | 计算时的标的价格。            |
| `open_interest`    | `float` 或 None    | 该合约的未平仓合约量。                     |
| `ts_event`         | `int`              | 事件时间戳（UNIX 纳秒）。          |
| `ts_init`          | `int`              | 初始化时间戳（UNIX 纳秒）。      |

在 actor 或策略中订阅：

```python
self.subscribe_option_greeks(instrument_id, client_id=ClientId("DERIBIT"))
```

处理更新：

```python
def on_option_greeks(self, greeks: OptionGreeks) -> None:
    self.log.info(f"delta={greeks.delta:.4f} gamma={greeks.gamma:.6f}")
```

完整订阅 API（含期权链聚合、行权价范围过滤与快照模式）见
[期权](./options.md)指南。

### 持久化与重放 {#persistence-and-replay}

`OptionGreeks` 是 `Data` 枚举的原生成员，因此像内置行情一样持久化到数据目录、
在回测中重放，而不是作为自定义数据。使用按类型的目录方法写入与查询：

```python
catalog.write_option_greeks(greeks)  # greeks: list[OptionGreeks]
greeks = catalog.query_option_greeks()
```

重放期间，持久化的 Greeks 经与实时数据相同的 `on_option_greeks` 处理器
到达订阅的 actor 或策略，同时也供给期权链聚合。

策略订阅 `OptionChainSlice` 时，回测数据引擎为每个期权工具把重放的
`OptionGreeks` 与重放的 `QuoteTick` BBO 更新相连接。`underlying_price`
字段为 ATM 选择提供种子，`delta` 通过 `StrikeRange.delta(target, tolerance)`
支持按 delta 选择行权价。

### 核心模式与自定义数据 {#core-schema-versus-custom-data}

原生 `OptionGreeks` 字段构成核心模式：五个标准 Greeks（`delta`、`gamma`、
`vega`、`theta`、`rho`）加上隐含波动率、标的价格、未平仓合约量与 convention。
这些字段名保持稳定。

没有哪个单一模式能覆盖所有 Greeks 用途。`vanna`、`volga`、`charm`、
校准输入或曲面元数据等场所专属或模型专属的值应放入
[自定义数据](./custom_data.md)，而不是原生类型。可选的场所字段可为空。
`convention` 不可为空，Python 中默认为
`GreeksConvention.BLACK_SCHOLES`。

### 核心 Rust 类型 {#underlying-rust-types}

核心 Rust 实现位于 `crates/model/src/data/greeks.rs` 与
`crates/model/src/data/option_chain.rs`：

- `OptionGreekValues`：含 `delta`、`gamma`、`vega`、`theta`、`rho`
  字段的普通结构体。实现 `Add` 与 `Mul<f64>` 用于聚合。
- `OptionGreeks`：包装 `OptionGreekValues`，加上 `instrument_id`、`convention`、
  隐含波动率字段与时间戳。实现 `Deref<Target = OptionGreekValues>`，
  Rust 调用方可直接访问各 Greek 字段。
- `HasGreeks` trait：提供返回 `OptionGreekValues` 的 `greeks()` 方法，
  由 `OptionGreeks`、`GreeksData`、`PortfolioGreeks` 和
  `BlackScholesGreeksResult` 实现。

### Black-Scholes 函数 {#black-scholes-functions}

`crates/model/src/data/greeks.rs` 中的底层定价函数也暴露给 Python：

```python
from nautilus_trader.model import (
    black_scholes_greeks,
    imply_vol,
    imply_vol_and_greeks,
    refine_vol_and_greeks,
)

# Compute Greeks given known volatility
result = black_scholes_greeks(s=100.0, r=0.05, b=0.0, vol=0.20, is_call=True, k=100.0, t=0.25)
# result.delta, result.gamma, result.vega, result.theta, result.rho, result.price, result.vol

# Imply volatility from market price, then compute Greeks
result = imply_vol_and_greeks(s=100.0, r=0.05, b=0.0, is_call=True, k=100.0, t=0.25, price=5.0)

# Refine volatility from a starting estimate, with a full-solver fallback
result = refine_vol_and_greeks(
    s=100.0, r=0.05, b=0.0, is_call=True, k=100.0, t=0.25, target_price=5.0, initial_vol=0.18
)
```

`refine_vol_and_greeks()` 先执行一步 Halley 迭代精化；只有波动率保持在
精化边界内、且模型价格与权利金的偏差不超过 0.01% 时才接受该结果，
否则执行完整的隐含波动率求解。

Python 定价函数对无效输入或结果抛出 `ValueError`。IV 函数还会拒绝
不存在有限正隐含波动率的权利金。`imply_vol()` 直接返回标量解，
不再重新定价；解 IV 并返回 Greeks 的函数要求重新定价误差不超过 0.01%，
fast-kernel 精度不足时改用精确实现。已知波动率定价在 fast 结果非有限或
不一致时也使用精确实现；精确结果仍未通过校验时，函数抛出 `ValueError`。

这些函数返回的 `BlackScholesGreeksResult` 包含：`price`、`vol`、
`delta`、`gamma`、`vega`、`theta`、`itm_prob` 和 `rho`。

约定：

- vega 按 0.01 缩放（对 1 个百分点波动率变化的敏感度）。
- theta 按 1/365.25 缩放（日衰减）。
- rho 按 0.01 缩放（对 1 个百分点利率变化的敏感度）。
- 美式期权在计算 Greeks 时按欧式定价。

Python 定价函数中，`db_dr=0.0` 表示利率变化时持有成本（carry）保持不变；
carry 为 `r - q` 且股息率 `q` 保持不变时用 `db_dr=1.0`，包括 `r == q` 的情形。
这个可选的末位参数用于兼容现有的位置调用。

## 本地 Greeks 计算器 {#local-greeks-calculator}

### GreeksCalculator {#greekscalculator}

`GreeksCalculator` 从缓存行情计算 Black-Scholes Greeks。它从
`nautilus_trader.common` 暴露，使用缓存与时钟，actor 与策略均可访问。

```python
from nautilus_trader.common import GreeksCalculator

# Typically created in on_start()
calculator = GreeksCalculator(cache=self.cache, clock=self.clock)
```

#### 单工具 Greeks {#instrument-greeks}

以数量 1 计算单个工具（期权或标的）的 Greeks：

```python
greeks = calculator.instrument_greeks(
    instrument_id=option_id,
    flat_interest_rate=0.0425,  # used if no yield curve in cache
)
# Returns GreeksData or None while market data is warming up.
```

对期权工具，计算器执行以下步骤：

1. 查找工具；在利用缓存 Greeks 之前先拒绝已到期期权与不支持的期权价差。
1. 需要全新或冲击后的估值时解析标的。
1. 从缓存取价格。标准工具优先 `MID`，回退 `LAST`；真正的指数工具
   优先缓存的指数价格。
1. 从缓存查找收益率曲线，找不到则回退 `flat_interest_rate`。
1. 由合法的市场权利金解出隐含波动率，计算并校验 Greeks。
1. 返回带计算值的 `GreeksData` 对象。

缺价格返回 `None`，让策略把预热期当作正常的空操作路径。
缺少工具定义、期权已到期、期权价差、无效的冲击输入或结果、
隐含波动率求解失败会抛出 `ValueError`。返回缓存期权 Greeks 之前会先检查到期。

有股息率或曲线时，计算器按 `r - q` 推导 carry，否则 carry 固定为零。
对缓存估值施加冲击时沿用其缓存数值输入，carry 的利率敏感度取决于本次调用的
股息率或可用的股息曲线。

对期货、股票等非期权工具，计算器返回 `delta=1`（或 beta 加权 delta）、
gamma/vega/theta/rho 为零的 `GreeksData`，期权专属字段保持默认值。

#### 冲击情景 {#shock-scenarios}

对现货、波动率或时间施加假设性变化：

```python
greeks = calculator.instrument_greeks(
    instrument_id=option_id,
    spot_shock=10.0,  # +10 points on underlying
    vol_shock=0.02,  # +2 percentage points of volatility
    time_to_expiry_shock=1 / 365.25,  # roll forward one calendar day
)
```

#### 波动率更新 {#volatility-update}

以缓存值为起点精化隐含波动率：

```python
greeks = calculator.instrument_greeks(
    instrument_id=option_id,
    update_vol=True,  # use cached vol as starting point
    cache_greeks=True,  # store result for next iteration
)
```

已有缓存 Greeks 时，`update_vol=True` 用缓存的波动率作为精化种子，
配合上文所述的校验与完整求解回退。缓存中没有该工具先前的 Greeks 时，
计算器执行完整的隐含波动率求解。

#### Beta 加权 Greeks {#beta-weighted-greeks}

以某个指数为基准表达 delta 与 gamma：

```python
greeks = calculator.instrument_greeks(
    instrument_id=option_id,
    index_instrument_id=InstrumentId.from_str("SPX.CBOE"),
    beta_weights={underlying_id: 1.15},
    percent_greeks=True,
)
```

#### 时间加权 vega {#time-weighted-vega}

对不同到期日的 vega 做归一化：

```python
greeks = calculator.instrument_greeks(
    instrument_id=option_id,
    vega_time_weight_base=30,  # normalize to 30-day vega
)
```

#### 组合 Greeks {#portfolio-greeks}

聚合所有匹配筛选条件的未平仓持仓的 Greeks：

```python
portfolio = calculator.portfolio_greeks(
    underlyings=["AAPL", "MSFT"],
    venue=Venue("CBOE"),
    strategy_id=StrategyId("DELTA_HEDGE-001"),
    flat_interest_rate=0.0425,
    index_instrument_id=InstrumentId.from_str("SPX.CBOE"),
    beta_weights=beta_dict,
    percent_greeks=True,
)
# Returns PortfolioGreeks.
```

过滤器：

- `underlyings`：符号前缀列表。例如 `["AAPL"]` 匹配 AAPL 股票及全部 AAPL 期权。
- `venue`：限定单一场所。
- `instrument_id`：限定单一工具。
- `strategy_id`：限定单一策略。
- `side`：按持仓方向过滤，如 `LONG` 或 `SHORT`。
- `greeks_filter`：可调用对象。每个持仓的 `GreeksData` 先按合约乘数、
  再按带符号持仓数量缩放 `pnl`、`price` 和各 Greek 值后传入；返回 `True`
  则纳入。工具上下文（包括 `multiplier` 与 `quantity`）保持不变，直接取用即可：
  `to_portfolio_greeks()` 或 Python 的标量乘法会再次施加乘数。

单工具估值失败或聚合结果非有限会抛出 `ValueError`，
计算不会返回部分组合结果。

### GreeksData {#greeksdata}

`GreeksData` 承载单工具 Greeks 计算的上下文，从 `nautilus_trader.model`
暴露。所请求的缓存与发布只在校验成功后针对未施加冲击的期权估值进行；
使用缓存估值时跳过这些操作，即使施加了冲击。Rust 的
`GreeksCalculator` 可向 `data.GreeksData.instrument_id={symbol}` 主题发布，
Python 接口不暴露该开关。

| 字段              | 类型           | 说明                                                             |
| ------------------ | -------------- | ----------------------------------------------------------------------- |
| `ts_init`          | `int`          | 初始化时间戳（纳秒）。                                |
| `ts_event`         | `int`          | 事件时间戳（纳秒）。                                         |
| `instrument_id`    | `InstrumentId` | 计算对应的工具。                                         |
| `is_call`          | `bool`         | 看涨或非期权结果为 `True`，看跌为 `False`。              |
| `strike`           | `float`        | 行权价。                                                           |
| `expiry`           | `int`          | 到期日，`YYYYMMDD` 整数。                                    |
| `expiry_in_days`   | `int`          | 距到期天数。                                                         |
| `expiry_in_years`  | `float`        | 距到期年数（`expiry_in_days / 365.25`）。                            |
| `multiplier`       | `float`        | 合约乘数。                                                    |
| `quantity`         | `float`        | 数量，`instrument_greeks()` 设为 1。                            |
| `underlying_price` | `float`        | 计算使用的标的价格。                               |
| `interest_rate`    | `float`        | 计算使用的利率。                                  |
| `cost_of_carry`    | `float`        | 持有成本（提供时用 `r - 股息率`，否则为零）。 |
| `vol`              | `float`        | 隐含波动率。                                                     |
| `pnl`              | `float`        | 提供持仓时相对持仓入场价的盈亏。        |
| `price`            | `float`        | 期权模型价格；非期权工具提供持仓时为该持仓盈亏。           |
| `delta`            | `float`        | Delta。                                                                  |
| `gamma`            | `float`        | Gamma。                                                                  |
| `vega`             | `float`        | 每 1 个百分点波动率的 vega。                            |
| `theta`            | `float`        | 日 theta。                                                            |
| `rho`              | `float`        | 每 1 个百分点利率的 rho。                          |
| `itm_prob`         | `float`        | 价内概率。                                               |

`GreeksData.to_portfolio_greeks()` 对 `pnl`、`price` 和五个 Greek 值
（包括 `rho`）施加一次合约乘数，返回带相同时间戳的 `PortfolioGreeks`。
持仓数量的缩放留给调用方，原始的按单位 `GreeksData` 保持不变。
Python 中 `scalar * greeks_data` 会转换并缩放结果，返回 `PortfolioGreeks`。

`portfolio_greeks()` 在过滤与聚合前采用这种先乘数、后数量的缩放。
中间 `quantity` 字段保持 `1`，不属于 `PortfolioGreeks`。Rust 调用方用
`quantity * &greeks_data.to_portfolio_greeks()` 得到同样结果；
Rust 表达式 `quantity * &greeks_data` 只做数量缩放，返回 `GreeksData`。

### PortfolioGreeks {#portfoliogreeks}

`PortfolioGreeks` 是转换与组合聚合的结果。

Rust 与 Python 支持组合结果相加，保留左操作数的时间戳。
左侧标量乘法缩放 `pnl`、`price` 和五个 Greek 值，时间戳保持不变：
Rust 用 `scalar * &portfolio_greeks`，Python 用 `scalar * portfolio_greeks`。
Python 的 `GreeksData` 与 `PortfolioGreeks` 只支持左侧标量乘法。

| 字段      | 类型    | 说明                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| `ts_init`  | `int`   | 初始化时间戳（纳秒）。                            |
| `ts_event` | `int`   | 事件时间戳（纳秒）。                                     |
| `pnl`      | `float` | 经乘数与带符号数量缩放后的合计盈亏。         |
| `price`    | `float` | 经乘数与带符号数量缩放后的合计模型价值。 |
| `delta`    | `float` | 组合 delta。                                                    |
| `gamma`    | `float` | 组合 gamma。                                                    |
| `vega`     | `float` | 组合 vega。                                                     |
| `theta`    | `float` | 组合 theta。                                                    |
| `rho`      | `float` | 组合 rho（每 1 个百分点利率）。            |

### 收益率曲线 {#yield-curves}

`YieldCurve` 按年限期限（tenor）存储利率或股息收益率。单点曲线是平坦的，
三个及以上点的曲线做插值。计算器按 `curve_name` 查找缓存曲线：
利率用期权的计价币种代码（如 `USD`），股息收益率用标的工具 ID。
没有匹配曲线时使用 `flat_interest_rate` 与 `flat_dividend_yield`。

`YieldCurve` 是自定义数据。要写入目录、在回测中重放或发布给订阅的 actor，
需把每条曲线包进 `CustomData`。数据引擎不缓存曲线，因此收到曲线的 actor
必须先调用 `cache.add_yield_curve()`，计算器才能使用它：

```python
from nautilus_trader.model import CustomData
from nautilus_trader.model import DataType

YIELD_CURVES = DataType("YieldCurve", {"curve_name": "USD"})


def on_start(self) -> None:
    self.subscribe_data(YIELD_CURVES)


def on_data(self, data: CustomData) -> None:
    self.cache.add_yield_curve(data.data)
```

Python 构造函数为 `YieldCurve(curve_name, tenors, interest_rates, ts_event, ts_init)`。
`tenors` 与 `interest_rates` 长度不一致、点数为二或为零、含非有限值，
或 `tenors` 不严格递增时抛出 `ValueError`。`cache.add_yield_curve()`
拒绝同样的曲线（包括从目录或 JSON 解码得到的），计算器因此永远不会对它们求值。
Python 在导入时注册该类型。Rust 中，在目录或流式写入、查询之前先调用
`nautilus_serialization::ensure_custom_data_registered::<YieldCurve>()`。

### 记录计算结果 {#recording-calculated-values}

`GreeksData` 与 `PortfolioGreeks` 支持在各自匹配的
`NautilusRecordType` 选择器下做原生 Arrow 记录。Rust 流式写入器直接接受这些记录，
订阅的写入器也能捕获 Rust 计算器类型化的 `GreeksData` 发布。

Python 中 `StreamingFeatherWriter.write()` 接受 `GreeksData` 与
`PortfolioGreeks`。用
`nautilus_trader.serialization.pyobjects_to_arrow_record_batch_bytes()`
编码这些对象，再用 `ParquetDataCatalog.write_record_arrow_bytes()`
配合匹配的记录选择器存储。

用 `query_record_arrow_bytes()` 或 `query_record_arrow_stream()`
读回记录的值，返回的是 Arrow 数据。计算记录不参与 `OptionGreeks`
行情重放，也不会填充计算器的缓存。收益率曲线是自定义数据而非记录，
见[收益率曲线](#yield-curves)。

## 两条路径的选择 {#choosing-between-the-two-paths}

| 判据             | 场所提供（`OptionGreeks`）                       | 本地计算器（`GreeksCalculator`）             |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------- |
| 计算           | 由场所或券商完成                           | 本地 Black-Scholes                               |
| 延迟               | 随行情到达                              | 按需计算                                |
| 适用场所                | Bybit、Deribit、Derive、Interactive Brokers、OKX  | 任何价格齐备、已缓存期权的场所            |
| 冲击情景       | 不支持                                         | 现货、波动率、时间冲击                        |
| 组合聚合 | 手动，如遍历 `OptionChainSlice`       | `portfolio_greeks()` 内置             |
| Beta 加权        | 不支持                                         | 内置                                          |
| 回测支持      | 基于记录的 `OptionGreeks` 数据                     | 基于任意时点的缓存价格           |
| 数值                | delta、gamma、vega、theta、rho、IV 与未平仓合约量 | delta、gamma、vega、theta、rho、itm_prob 与 vol |
| 数据类型             | `OptionGreeks`                                        | `GreeksData` 与 `PortfolioGreeks`                |

## Greek 定义 {#greek-definitions}

以下术语贯穿两条路径。本地 Black-Scholes 函数按上文所述缩放 vega 与 theta；
`OptionGreeks` 保留各场所或券商报告的数值并记录其 `convention`。

| Greek    | 字段      | 定义                                                                                                        |
| -------- | ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Delta    | `delta`    | 期权价格对标的价格的一阶导数（`dV/dS`）。                                      |
| Gamma    | `gamma`    | 期权价格对标的价格的二阶导数（`d²V/dS²`）。                                   |
| Vega     | `vega`     | 对隐含波动率变化的敏感度（`dV/dVol`）。                                                        |
| Theta    | `theta`    | 对时间流逝的敏感度（`dV/dt`）。                                                                     |
| Rho      | `rho`      | 对无风险利率变化的敏感度（`dV/dr`）。                                                 |
| ITM prob | `itm_prob` | 期权到期价内的概率：`P(ϕS_T > ϕK)`，看涨时 `ϕ = 1`，看跌时 `ϕ = -1`。 |

## 示例 {#examples}

仓库中有完整可运行的示例：

- `examples/live/bybit/bybit_option_greeks.py`：订阅 Bybit 场所提供的 Greeks。
- `examples/live/deribit/deribit_option_greeks.py`：订阅 Deribit 场所提供的 Greeks。
- `examples/live/okx/okx_option_greeks.py`：订阅 OKX 场所提供的 Greeks。

## 相关指南 {#related-guides}

- [期权](./options.md)：期权工具、链订阅与行权价过滤。
- [数据](./data/index.md)：内置数据类型、自定义数据与订阅模型。
- [Actors](./actors.md)：订阅与处理器参考。
- [策略](./strategies.md)：策略实现与处理方法。
