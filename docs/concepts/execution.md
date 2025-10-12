# 执行

NautilusTrader 能够为多个策略和多个交易场所（每个实例）同时处理交易执行和订单管理。执行流程涉及多个相互作用的组件，理解命令与事件等执行消息的可能流向至关重要。

主要的执行相关组件包括：

- `Strategy`
- `ExecAlgorithm`（执行算法）
- `OrderEmulator`
- `RiskEngine`
- `ExecutionEngine` 或 `LiveExecutionEngine`
- `ExecutionClient` 或 `LiveExecutionClient`

## 执行流程

`Strategy` 基类继承自 `Actor`，因此包含了所有通用的数据相关方法。它还提供了一组用于管理订单和交易执行的方法：

- `submit_order(...)`
- `submit_order_list(...)`
- `modify_order(...)`
- `cancel_order(...)`
- `cancel_orders(...)`
- `cancel_all_orders(...)`
- `close_position(...)`
- `close_all_positions(...)`
- `query_account(...)`
- `query_order(...)`

这些方法在内部会构造必要的执行命令，并通过消息总线（point-to-point）发送到相关组件，同时发布相应的事件（例如新订单初始化事件 `OrderInitialized`）。

一般的执行流如下（箭头表示消息在消息总线上的流向）：

`Strategy` -> `OrderEmulator` -> `ExecAlgorithm` -> `RiskEngine` -> `ExecutionEngine` -> `ExecutionClient`

`OrderEmulator` 与 `ExecAlgorithm` 是可选环节，是否参与取决于具体订单参数（下面会说明）。

下面的示意图展示了 Nautilus 执行组件之间命令与事件的消息流：

````text
                  ┌───────────────────┐
                  │                   │
                  │                   │
                  │                   │
          ┌───────►   OrderEmulator   ├────────────┐
          │       │                   │            │
          │       │                   │            │
          │       │                   │            │
┌─────────┴──┐    └─────▲──────┬──────┘            │
│            │          │      │           ┌───────▼────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│            │          │      │           │                │   │                     │   │                     │
│            ├──────────┼──────┼───────────►                ├───►                     ├───►                     │
│  Strategy  │          │      │           │                │   │                     │   │                     │
│            │          │      │           │   RiskEngine   │   │   ExecutionEngine   │   │   ExecutionClient   │
│            ◄──────────┼──────┼───────────┤                ◄───┤                     ◄───┤                     │
│            │          │      │           │                │   │                     │   │                     │
│            │          │      │           │                │   │                     │   │                     │
└─────────┬──┘    ┌─────┴──────▼──────┐    └───────▲────────┘   └─────────────────────┘   └─────────────────────┘
          │       │                   │            │
          │       │                   │            │
          │       │                   │            │
          └───────►   ExecAlgorithm   ├────────────┘
                  │                   │
                  │                   │
                  │                   │
                  └───────────────────┘

```text

## 订单管理系统（OMS）

订单管理系统（Order Management System，简称 OMS）类型指的是用于为合约分配订单并跟踪该合约有关头寸的方法。OMS 类型适用于策略端和交易场所（无论是模拟还是实盘）。即使某个交易场所没有明确声明使用哪种方式，系统内部总会生效某种 OMS 类型。可以通过 `OmsType` 枚举为组件指定 OMS 类型。

`OmsType` 枚举包含三种取值：

- `UNSPECIFIED`：默认由应用场景决定（详见下文）
- `NETTING`：对每个 instrument ID 合并为单一头寸
- `HEDGING`：对每个 instrument ID 支持多笔头寸（可同时存在多头与空头）

下表描述了策略端与交易场所不同配置组合下的适用场景。当策略与场所的 OMS 类型不一致时，`ExecutionEngine` 会在接收到 `OrderFilled` 事件时覆写或分配 `position_id`。这里的“虚拟头寸（virtual position）”指的是存在于 Nautilus 系统中但并非真实存在于交易场所的头寸 ID。

| Strategy OMS                 | Venue OMS              | 说明                                                                                                                                                |
|:-----------------------------|:-----------------------|:---------------------------------------------------------------------------------------------------------------------------------------------------|
| `NETTING`                    | `NETTING`              | 策略采用场所的原生 OMS 类型，针对每个 instrument ID 使用单一 position ID。                                                                 |
| `HEDGING`                    | `HEDGING`              | 策略采用场所的原生 OMS 类型，针对每个 instrument ID 支持多个 position ID（包括 `LONG` 与 `SHORT`）。                                      |
| `NETTING`                    | `HEDGING`              | 策略覆盖了场所的原生 OMS 类型。场所按 instrument ID 跟踪多个头寸，但 Nautilus 在策略端以单一 position ID 维护头寸。 |
| `HEDGING`                    | `NETTING`              | 策略覆盖了场所的原生 OMS 类型。场所仅按 instrument ID 跟踪单一头寸，但 Nautilus 在策略端维护多个 position ID。 |

:::note
为策略和场所分别配置不同的 OMS 类型会增加平台复杂度，但可以支持更丰富的交易风格与偏好（见上表）。
:::

OMS 配置示例：

- 多数加密货币交易所使用 `NETTING` 模式（每个市场一个头寸）。在策略层仍可能希望跟踪多个“虚拟”头寸。
- 某些外汇 ECN 或经纪商采用 `HEDGING` 模式，允许同时存在多笔多头与空头头寸；而交易者可能只关心货币对的净头寸（NET）。

:::info
目前 Nautilus 尚不支持场所端的某些对冲模式（例如 Binance 的 `BOTH` 与 `LONG/SHORT` 模式中按方向 netting 的情形）。建议将 Binance 账户配置为 `BOTH`，以便采用单一净头寸。
:::

### OMS 配置说明

如果没有在配置中通过 `oms_type` 明确指定策略的 OMS 类型，则其默认为 `UNSPECIFIED`。这意味着 `ExecutionEngine` 不会覆盖场所的 `position_id`，OMS 类型将遵从交易场所的设置。

:::tip
在配置回测时，可以为交易场所指定 `oms_type`。为了提高回测的准确性，建议尽量与该交易场所实际使用的 OMS 类型保持一致。
:::

## 风控引擎（Risk engine）

`RiskEngine` 是 Nautilus 系统（包括回测、沙箱和实盘）中的核心组件。除非在 `RiskEngineConfig` 中显式地绕过，所有订单命令与事件都会经过 `RiskEngine` 的校验。

`RiskEngine` 内置了若干下单前（pre-trade）的风控检查，包括但不限于：

- 价格精度是否符合合约要求。
- 价格是否为正（期权类合约可能例外）。
- 数量精度是否符合合约要求。
- 是否低于合约的最大名义金额（max notional）。
- 是否在合约允许的最小或最大下单量范围内。
- 当订单带有 `reduce_only` 执行指令时，仅允许减仓操作。

若任一风控检查不通过，系统会生成 `OrderDenied` 事件，从而关闭该订单并阻止其继续流转。该事件会包含可供人类阅读的拒单原因说明。

### 交易状态（Trading state）

此外，系统的当前交易状态会影响订单处理流程。

`TradingState` 枚举包含三种状态：

- `ACTIVE`：正常运行。
- `HALTED`：暂停接收/处理新的订单命令，直到状态变化。
- `REDUCING`：仅处理取消或会导致减仓的命令。

:::info
更多细节见 `RiskEngineConfig` 的 [API Reference](../api_reference/config#risk)。
:::

## 执行算法（Execution algorithms）

平台支持自定义执行算法组件，并提供了一些内置算法，例如时间加权平均价格（TWAP, Time-Weighted Average Price）。

### TWAP（时间加权平均价格）

TWAP 执行算法旨在将大额委托的执行均匀分散到指定的时间区间内。算法接收代表总量与方向的主订单（primary order），然后将其拆分为多个子订单（child/secondary orders），在时间区间内以固定间隔下发执行。

这样可以减小主订单对市场的冲击，避免在某一时刻集中成交过大成交量。

算法会立即提交第一笔子订单，最后一笔提交则是在时间窗口结束时的主订单。

下面以位于 ``/examples/algorithms/twap.py`` 的 TWAP 实现为例，演示如何在一个已初始化的 `BacktestEngine` 中初始化并注册一个 TWAP 执行算法：

```python
from nautilus_trader.examples.algorithms.twap import TWAPExecAlgorithm

# `engine` 是一个已初始化的 BacktestEngine 实例
exec_algorithm = TWAPExecAlgorithm()
engine.add_exec_algorithm(exec_algorithm)
````

该算法需要指定两个参数：

- `horizon_secs`
- `interval_secs`

其中 `horizon_secs` 表示执行的总时间（秒），`interval_secs` 表示每次下发子订单之间的时间间隔（秒）。这些参数决定了主订单将如何被拆分为一系列子订单。

```python
from decimal import Decimal
from nautilus_trader.model.data import BarType
from nautilus_trader.test_kit.providers import TestInstrumentProvider
from nautilus_trader.examples.strategies.ema_cross_twap import EMACrossTWAP, EMACrossTWAPConfig

# 配置策略
config = EMACrossTWAPConfig(
    instrument_id=TestInstrumentProvider.ethusdt_binance().id,
    bar_type=BarType.from_str("ETHUSDT.BINANCE-250-TICK-LAST-INTERNAL"),
    trade_size=Decimal("0.05"),
    fast_ema_period=10,
    slow_ema_period=20,
    twap_horizon_secs=10.0,   # 执行算法参数（总时间，秒）
    twap_interval_secs=2.5,    # 执行算法参数（订单间隔，秒）
)

# 实例化策略
strategy = EMACrossTWAP(config=config)
```

也可以在下单时动态指定这些参数，根据实时市场状况计算 horizon 与 interval。在这种情况下，策略配置参数可以提供给某个执行模型，由模型决定具体的时间与间隔。

:::info
执行算法参数数量不限。参数只需为以字符串为键、原始类型值（如 int、float、string）为值的字典（可序列化传输）。
:::

### 编写自定义执行算法

要实现自定义执行算法，需要定义一个继承自 `ExecAlgorithm` 的类。

执行算法本身是一个 `Actor`，因此可以：

- 请求并订阅数据。
- 访问 `Cache`。
- 使用 `Clock` 设置时间提醒或定时器。

此外，执行算法还能：

- 访问中心化的 `Portfolio`。
- 从接收到的主订单（primary/original order）生成并派生二级订单（secondary orders）。

当执行算法被注册并且系统运行时，会通过消息总线接收发送给其 `ExecAlgorithmId` 的订单（通过订单参数 `exec_algorithm_id` 指定）。订单还可能携带 `exec_algorithm_params`，其类型为 `dict[str, Any]`。

:::warning
由于 `exec_algorithm_params` 是一个灵活的字典，务必对字典中的键值对进行充分校验（至少需确认该字典不为 `None` 且所有必要参数存在），以保证算法运行正确。
:::

接收订单会触发执行算法的 `on_order(...)` 方法。此时该订单被视为主订单（primary/original order）：

```python
from nautilus_trader.model.orders.base import Order

def on_order(self, order: Order) -> None:
    # 在此处处理订单
```

当算法准备生成二级订单时，可以调用下列方法之一：

- `spawn_market(...)`（生成 `MARKET` 市价单）
- `spawn_market_to_limit(...)`（生成 `MARKET_TO_LIMIT` 单）
- `spawn_limit(...)`（生成 `LIMIT` 限价单）

:::note
未来版本可能会增加更多的订单类型以满足需求。
:::

上述方法均以主订单（primary/original `Order`）作为第一个参数。生成二级订单时，主订单的剩余数量会被减少相应的 `quantity`（这部分会成为生成订单的数量）。

:::warning
必须确保主订单剩余数量足够（系统会对此进行校验）。
:::

当生成所需数量的二级订单并完成执行逻辑后，算法通常会在最后发送主订单本身（original order）。

### 派生（spawned）订单

所有由执行算法派生出的二级订单都会携带 `exec_spawn_id`，该值即为主订单的 `ClientOrderId`。派生订单的 `client_order_id` 则基于该主订单 ID 按下列约定生成：

- `exec_spawn_id`（主订单的 `client_order_id` 值）
- `spawn_sequence`（派生订单的序号）

```text
{exec_spawn_id}-E{spawn_sequence}
```

例如：`O-20230404-001-000-E1`（表示第一笔派生订单）

:::note
使用“primary / secondary（或 spawn）” 的术语是为了避免与“parent / child（父/子）”等或有（contingent）订单术语产生混淆（执行算法也可能会处理或有订单）。
:::

### 管理执行算法生成的订单

`Cache` 提供了若干方法，帮助跟踪执行算法相关的订单活动。调用下面的方法可以根据过滤条件返回符合条件的执行算法订单列表：

```python
def orders_for_exec_algorithm(
    self,
    exec_algorithm_id: ExecAlgorithmId,
    venue: Venue | None = None,
    instrument_id: InstrumentId | None = None,
    strategy_id: StrategyId | None = None,
    side: OrderSide = OrderSide.NO_ORDER_SIDE,
) -> list[Order]:
```

还可以更细粒度地查询某一执行序列/派生系列的订单。调用下面的方法会返回给定 `exec_spawn_id` 的所有订单（如果存在）：

```python
def orders_for_exec_spawn(self, exec_spawn_id: ClientOrderId) -> list[Order]:
```

:::note
返回结果中也会包含主订单本身（original/primary order）。
:::

## 自有订单簿（Own order books）

自有订单簿是仅跟踪自身（用户）委托、按价位组织的 L3 级别订单簿，独立于交易所的公共订单簿维护。

### 目的

自有订单簿的用途包括：

- 实时监控你的委托在交易所公共订单簿中的状态。
- 在提交前通过检查某个价位的可用流动性来验证下单的合理性。
- 帮助防止自成交（self-trading），识别已存在自身委托的价位。
- 支持依赖队列位置（queue position）的高级订单管理策略。
- 在实盘交易时，支持内部状态与交易所状态的对账。

### 生命周期

自有订单簿按合约维度维护，并会在订单生命周期中自动更新：订单提交或被接受时加入；修改时更新；成交、取消、拒单或过期时移除。

只有带价格的订单才会出现在自有订单簿中。市价单和其它没有显式价格的订单类型无法按价位定位，因此不纳入自有订单簿。

### 安全的取消查询（Safe cancellation queries）

在查询自有订单簿以获取要取消的订单时，应使用一个排除 `PENDING_CANCEL` 状态的 `status` 过滤器，以避免对已在取消中的订单再次发起取消请求。

:::warning
在状态过滤器中包含 `PENDING_CANCEL` 可能导致：

- 对同一笔订单发起重复的取消请求。
- 造成未平仓订单计数虚增（`PENDING_CANCEL` 状态的订单在确认取消前仍被视为“未平仓”）。
- 当多个策略尝试取消同一订单时，可能导致订单状态爆炸（state explosion）。

:::

很多方法暴露了可选参数 `accepted_buffer_ns`，这是一个基于时间的保护窗口，仅返回那些其 `ts_accepted` 至少早于当前时间该缓冲窗口时长（以纳秒计）的订单。尚未被场所接受的订单其 `ts_accepted = 0`，因此在缓冲窗口过去后才会被包含。若需要排除这些在途订单（inflight orders），必须同时配合显式的状态过滤（例如只包含 `ACCEPTED` / `PARTIALLY_FILLED`）。

### 审计

在实盘交易中，可以定期将自有订单簿与 `Cache` 的订单索引进行审计，以确保一致性。审计机制会验证已关闭的订单是否被正确移除，以及在场所延迟窗口期内已提交但尚未被接受的在途订单仍被追踪。

审计周期可以通过实盘交易配置中的 `own_books_audit_interval_secs` 参数进行设置。
