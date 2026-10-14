# 策略

策略继承 `Strategy` 类并实现其逻辑所需的方法。
`Strategy` 在 `DataActor` 之上增加订单管理。

**能力**：

- 历史数据请求。
- 实时数据流订阅。
- 设置时间提醒或定时器。
- 缓存访问。
- 组合访问。
- 创建并管理订单与持仓。

:::tip
开发策略前先阅读 [Actors](./actors.md) 指南。策略继承的订阅、
请求与回调行为在其中已有说明。
:::

策略可以添加到任意[环境上下文](./architecture.md#environment-contexts)的 Nautilus 系统中。
系统一旦启动，策略就按其逻辑开始发送命令、接收事件。数据摄取、事件处理与
订单管理支持任何策略类型，包括趋势、动量、再平衡、配对与做市策略。

Nautilus 交易策略有两个主要部分：

- 策略实现本身，通过继承 `Strategy` 类定义。
- *可选*的策略配置，通过继承 `StrategyConfig` 类定义。

:::note
同一份策略源码可以运行在回测与实时环境。但实时执行仍会引入场所、传输、
时序、持久化、外部活动与对账等行为，模拟环境未必能复现。见
[回测与实时的差异](./live.md#backtest-and-live-differences)。
:::

全部可用方法见 [`Strategy` API Reference](https://nautilustrader.io/docs/python-api-latest/trading.html)。

:::info Rust 实现
Rust 策略作者实现所需的 `DataActor` 回调，并用 `nautilus_strategy!` 生成
`Strategy` 实现，然后在 `self` 上调用 `clock()`、`cache()`、`order()`、
`portfolio()` 等门面方法。

`DataActorNative` 是对运行时接线与 actor 核心状态的 native-only 访问。
`StrategyNative` 暴露借用的策略状态，如订单工厂、订单管理器与组合访问。
只在同二进制性能路径或内部运行时接线时导入它们。
:::

## 策略实现 {#strategy-implementation}

交易策略继承 `Strategy`，因此必须定义构造函数，至少要初始化基类：

```python
from nautilus_trader.trading import Strategy


class MyStrategy(Strategy):
    def __init__(self) -> None:
        super().__init__()  # <-- the superclass must be called to initialize the strategy
```

在此基础上，按需实现处理器，根据状态变化与事件执行动作。

:::warning
策略注册到 trader 之前，`clock`、`cache`、`portfolio`、`order_factory`
都会抛出 `RuntimeError`，注册发生在 `__init__` 返回之后。
构造函数里只初始化普通状态，系统性的工作在 `on_start()` 中做。
:::

### 处理器 {#handlers}

处理器是 `Strategy` 类中根据事件或状态变化执行动作的方法，
以 `on_*` 为前缀。按策略需要实现其中任意若干个。

同类事件设有多个处理器，以便你控制粒度。可以用专属处理器响应特定事件，
也可以用通用处理器处理一类相关事件（类似 switch 语句的写法）。
系统按**从最具体到最通用**的顺序依次调用处理器。

订阅数据、订单与持仓处理器只在策略处于 `RUNNING` 时分发。
其他状态下到达的消息会被记录日志但不送入处理器。请求响应不受此限制：
响应在策略停止后才到达，其 `on_historical_*` 处理器仍会执行。

#### 状态动作 {#stateful-actions}

生命周期状态变化触发以下处理器。建议：

- 用 `on_start` 初始化策略（例如获取工具、订阅数据）。
- 用 `on_stop` 做清理（例如撤销挂单、平掉持仓、退订数据）。

```python
def on_start(self) -> None:
def on_stop(self) -> None:
def on_resume(self) -> None:
def on_reset(self) -> None:
def on_dispose(self) -> None:
def on_degrade(self) -> None:
def on_fault(self) -> None:
def on_save(self) -> dict[str, bytes]:  # Returns user-defined dictionary of state to be saved
def on_load(self, state: dict[str, bytes]) -> None:
```

#### 数据处理 {#data-handling}

以下处理器接收数据更新，包括内置行情与用户自定义数据。

```python
from collections.abc import Sequence
from typing import Any

from nautilus_trader.common import Signal
from nautilus_trader.model import Bar
from nautilus_trader.model import CustomData
from nautilus_trader.model import FundingRateUpdate
from nautilus_trader.model import IndexPriceUpdate
from nautilus_trader.model import InstrumentClose
from nautilus_trader.model import InstrumentStatus
from nautilus_trader.model import MarkPriceUpdate
from nautilus_trader.model import OptionChainSlice
from nautilus_trader.model import OptionGreeks
from nautilus_trader.model import OrderBook
from nautilus_trader.model import OrderBookDelta
from nautilus_trader.model import OrderBookDeltas
from nautilus_trader.model import OrderBookDepth
from nautilus_trader.model import QuoteTick
from nautilus_trader.model import TradeTick

def on_book_deltas(self, deltas: OrderBookDeltas) -> None:
def on_book_depth(self, depth: OrderBookDepth) -> None:
def on_book(self, order_book: OrderBook) -> None:
def on_quote(self, tick: QuoteTick) -> None:
def on_trade(self, tick: TradeTick) -> None:
def on_bar(self, bar: Bar) -> None:
def on_mark_price(self, mark_price: MarkPriceUpdate) -> None:
def on_index_price(self, index_price: IndexPriceUpdate) -> None:
def on_funding_rate(self, funding_rate: FundingRateUpdate) -> None:
def on_instrument(self, instrument: Any) -> None:
def on_instrument_status(self, data: InstrumentStatus) -> None:
def on_instrument_close(self, data: InstrumentClose) -> None:
def on_option_greeks(self, greeks: OptionGreeks) -> None:
def on_option_chain(self, chain: OptionChainSlice) -> None:
def on_historical_data(self, data: CustomData | Sequence[CustomData]) -> None:
def on_historical_book_deltas(self, deltas: Sequence[OrderBookDelta]) -> None:
def on_historical_book_depth(self, depths: Sequence[OrderBookDepth]) -> None:
def on_historical_quotes(self, quotes: Sequence[QuoteTick]) -> None:
def on_historical_trades(self, trades: Sequence[TradeTick]) -> None:
def on_historical_bars(self, bars: Sequence[Bar]) -> None:
def on_historical_mark_prices(self, mark_prices: Sequence[MarkPriceUpdate]) -> None:
def on_historical_index_prices(self, index_prices: Sequence[IndexPriceUpdate]) -> None:
def on_historical_funding_rates(self, rates: Sequence[FundingRateUpdate]) -> None:
def on_data(self, data: CustomData) -> None:
def on_signal(self, signal: Signal) -> None:
```

订阅更新与请求响应到达不同的处理器，操作与处理器的对应关系见
[Actors：回调处理器](./actors.md#callback-handlers)。

#### 订单管理 {#order-management}

以下处理器接收订单相关事件。`OrderEvent` 类消息按以下顺序传递：

1. 专属处理器（例如 `on_order_accepted`、`on_order_rejected` 等）
2. `on_order_event(...)`

```python
from typing import Any

from nautilus_trader.model import OrderAccepted
from nautilus_trader.model import OrderCanceled
from nautilus_trader.model import OrderCancelRejected
from nautilus_trader.model import OrderDenied
from nautilus_trader.model import OrderEmulated
from nautilus_trader.model import OrderExpired
from nautilus_trader.model import OrderFilled
from nautilus_trader.model import OrderFillVoided
from nautilus_trader.model import OrderInitialized
from nautilus_trader.model import OrderModifyRejected
from nautilus_trader.model import OrderPendingCancel
from nautilus_trader.model import OrderPendingUpdate
from nautilus_trader.model import OrderRejected
from nautilus_trader.model import OrderReleased
from nautilus_trader.model import OrderSubmitted
from nautilus_trader.model import OrderTriggered
from nautilus_trader.model import OrderUpdated

def on_order_initialized(self, event: OrderInitialized) -> None:
def on_order_denied(self, event: OrderDenied) -> None:
def on_order_emulated(self, event: OrderEmulated) -> None:
def on_order_released(self, event: OrderReleased) -> None:
def on_order_submitted(self, event: OrderSubmitted) -> None:
def on_order_rejected(self, event: OrderRejected) -> None:
def on_order_accepted(self, event: OrderAccepted) -> None:
def on_order_canceled(self, event: OrderCanceled) -> None:
def on_order_expired(self, event: OrderExpired) -> None:
def on_order_triggered(self, event: OrderTriggered) -> None:
def on_order_pending_update(self, event: OrderPendingUpdate) -> None:
def on_order_pending_cancel(self, event: OrderPendingCancel) -> None:
def on_order_modify_rejected(self, event: OrderModifyRejected) -> None:
def on_order_cancel_rejected(self, event: OrderCancelRejected) -> None:
def on_order_updated(self, event: OrderUpdated) -> None:
def on_order_filled(self, event: OrderFilled) -> None:
def on_order_fill_voided(self, event: OrderFillVoided) -> None:
def on_order_event(self, event: Any) -> None:  # All order event messages are eventually passed to this handler
```

:::note
Python API 不导出 `OrderEvent` 基类型。`on_order_event(...)` 收到的是
与专属处理器相同的具象事件对象，例如一个 `OrderAccepted`。
:::

#### 持仓管理 {#position-management}

以下处理器接收持仓相关事件。`PositionEvent` 类消息按以下顺序传递：

1. 专属处理器（例如 `on_position_opened`、`on_position_changed` 等）
2. `on_position_event(...)`

```python
from typing import Any

from nautilus_trader.model import PositionChanged
from nautilus_trader.model import PositionClosed
from nautilus_trader.model import PositionOpened

def on_position_opened(self, event: PositionOpened) -> None:
def on_position_changed(self, event: PositionChanged) -> None:
def on_position_closed(self, event: PositionClosed) -> None:
def on_position_event(self, event: Any) -> None:  # All position event messages are eventually passed to this handler
```

与订单事件一样，Python API 不导出 `PositionEvent` 基类型，
`on_position_event(...)` 收到的是具象事件对象。

定时器事件用 `on_time_event()`，订单事件汇总用 `on_order_event()`，
持仓事件汇总用 `on_position_event()`。Python API 不暴露通用的
`on_event()` 钩子。

#### 处理器示例 {#handler-example}

EMA 交叉示例策略的这段 `on_start` 实现展示了：

- 注册指标以接收 bar 更新。
- 请求历史数据（用于填充指标）。
- 订阅实时数据。

缓存检查在实时交易中很关键。直接订阅的前提是工具已由工具提供者配置
或更早的工具请求加载。

```python
def on_start(self) -> None:
    """
    Actions to be performed on strategy start.
    """
    self.instrument = self.cache.instrument(self.instrument_id)
    if self.instrument is None:
        self.log.error(f"Could not find instrument for {self.instrument_id}")
        self.stop()  # Transitions strategy to STOPPED state
        return

    # Register the indicators for updating
    self.register_indicator_for_bars(self.bar_type, self.fast_ema)
    self.register_indicator_for_bars(self.bar_type, self.slow_ema)

    # Get historical data and subscribe to live data
    self.request_bars(self.bar_type)
    self.subscribe_bars(self.bar_type)
    self.subscribe_quotes(self.instrument_id)
```

注册的指标会在 `on_historical_bars()` 运行之前收到请求响应中的 bar，
因此一次请求即可填充指标。依据指标值行动前，先检查 `indicators_initialized()`。

### 时钟与定时器 {#clock-and-timers}

策略使用 `Clock` 生成时间戳，并调度触发 `TimeEvent` 的时间提醒或定时器。

全部可用方法见 [`Clock` API Reference](https://nautilustrader.io/docs/python-api-latest/common.html)。

#### 当前时间戳 {#current-timestamps}

下面演示两种常用的取当前时间戳方式。

取当前 UTC 时间戳（带时区的 `datetime`）：

```python
from datetime import datetime


now: datetime = self.clock.utc_now()
```

取当前 UTC 时间戳（自 UNIX 纪元以来的纳秒数）：

```python
unix_nanos: int = self.clock.timestamp_ns()
```

#### 时间提醒 {#time-alerts}

时间提醒在指定的提醒时刻向 `on_time_event` 处理器派发一个 `TimeEvent`。
实时交易中，调度与排队工作可能推迟投递，提醒时间不是延迟保证。

下例设置一个从现在起一分钟后触发的时间提醒：

```python
from datetime import timedelta

# Fire a TimeEvent one minute from now
self.clock.set_time_alert(
    name="MyTimeAlert1",
    alert_time=self.clock.utc_now() + timedelta(minutes=1),
)
```

#### 定时器 {#timers}

循环定时器按固定间隔持续生成 `TimeEvent`，直到过期或被取消。

下例设置每分钟触发一次的定时器。定时器立即启动，首个事件在一个间隔后
触发。传 `fire_immediately=True` 则在启动时刻立即触发：

```python
from datetime import timedelta

# Fire a TimeEvent every minute
self.clock.set_timer(
    name="MyTimer1",
    interval=timedelta(minutes=1),
)
```

实时环境中的定长定时器会把逾期的首个事件移到当前时刻（落在包含端点的
停止边界上时除外），随后补齐被运行时延误的 tick。

传 `callback` 可把 `TimeEvent` 路由到你自己的方法，而不是 `on_time_event`。
定时器名共享时钟命名空间，请使用组件内唯一的名字。见
[Actors：定时器与提醒](./actors.md#timers-and-alerts)。

#### 日历定时器 {#calendar-timers}

按本地时间重复触发用 `set_timer_zoned()`。传一个正的跨度字符串（如
`"1d"` 或 `"P1M"`）和带时区的起始 datetime。`zoneinfo.ZoneInfo`
会跟随夏令时变化，`datetime.timezone` 保持固定偏移。下例从明天起在
纽约时间 09:30 触发：

```python
from datetime import timedelta
from zoneinfo import ZoneInfo

start = self.clock.utc_now().astimezone(ZoneInfo("America/New_York"))
start = start.replace(hour=9, minute=30, second=0, microsecond=0) + timedelta(days=1)

self.clock.set_timer_zoned(
    name="NewYorkMorning",
    interval="1d",
    start_time=start,
    allow_past=False,
    fire_immediately=True,
)
```

首个事件默认为 `start_time` 之后的一个间隔；`fire_immediately=True`
把起点也算上。`allow_past=False` 时首个事件不得在过去。停止时间含端点。
取消后不再产生后续事件。

日、周、月、年按本地日历计算；小时及更短单位按流逝时间度量。在纽约
09:30，夏令时开始时 `"1d"` 事件相隔 23 小时，结束时相隔 25 小时；
用 `"24h"` 则事件始终相隔 24 小时，但本地时间会漂移一小时。

请选择一个存在的本地起始时刻，起点的夏令时空洞不会被校验。起始时间有歧义时
由 `fold` 选择具体一次。重复始终锚定该起点，月末截断与夏令时调整不会移动
后续期限；后续落入空洞的时刻顺延一个空洞的宽度，落入重叠时取第一次出现。

实时交易中，`set_timer_zoned()` 若有逾期的下一次触发会立即以其排期时间戳补发，
然后从现在之后的第一个期限继续。虚拟时钟在推进期间逐个发出到期事件。
事件时间戳始终是 UTC UNIX 纳秒。

:::info Rust 实现
Rust 策略中使用 `ClockApi::set_timer_zoned()`。使用原始 `Clock` 时，
把 `Arc::new(CalendarSchedule::new(&start_time, span)?)` 传给
`set_timer_schedule()`。该调度实现 `TimerSchedule` 并提供 UTC 期限，
投递与取消由时钟和定时器负责。
:::

### 缓存访问 {#cache-access}

trader 的中心 `Cache` 存储数据与执行对象（订单、持仓等），
提供大量带过滤的方法，下面是一些基本用法。

#### 获取数据 {#fetching-data}

下例从缓存获取数据（假定已分配某个工具 ID 属性）。请求的数据不可用时
这些方法返回 `None`。

```python
last_quote = self.cache.quote(self.instrument_id)
last_trade = self.cache.trade(self.instrument_id)
last_bar = self.cache.bar(bar_type)
```

#### 获取执行对象 {#fetching-execution-objects}

下例演示如何从缓存获取单个订单与持仓对象：

```python
order = self.cache.order(client_order_id)
position = self.cache.position(position_id)
```

全部可用方法见 [`Cache` API Reference](https://nautilustrader.io/docs/python-api-latest/cache.html)。

### 组合访问 {#portfolio-access}

trader 的中心 `Portfolio` 提供账户与持仓信息，下面概览可用方法。

#### 账户与持仓信息 {#account-and-positional-information}

```python
import decimal
import typing

from nautilus_trader.model import AccountId
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Money
from nautilus_trader.model import Price
from nautilus_trader.model import Venue

def account(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
) -> typing.Any | None

def balances_locked(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
) -> dict[Currency, Money] | None
def instrument_initial_margins(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
) -> dict[InstrumentId, Money] | None
def instrument_maintenance_margins(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
) -> dict[InstrumentId, Money] | None
def unrealized_pnls(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> dict[Currency, Money]
def realized_pnls(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> dict[Currency, Money]
def total_pnls(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> dict[Currency, Money]
def net_exposures(
    self,
    venue: Venue | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> dict[Currency, Money] | None

def unrealized_pnl(
    self,
    instrument_id: InstrumentId,
    price: Price | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> Money | None
def realized_pnl(
    self,
    instrument_id: InstrumentId,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> Money | None
def total_pnl(
    self,
    instrument_id: InstrumentId,
    price: Price | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> Money | None
def net_exposure(
    self,
    instrument_id: InstrumentId,
    price: Price | None = None,
    account_id: AccountId | None = None,
    target_currency: Currency | None = None,
) -> Money | None
def net_position(
    self,
    instrument_id: InstrumentId,
    account_id: AccountId | None = None,
) -> decimal.Decimal

def is_net_long(self, instrument_id: InstrumentId, account_id: AccountId | None = None) -> bool
def is_net_short(self, instrument_id: InstrumentId, account_id: AccountId | None = None) -> bool
def is_net_flat(self, instrument_id: InstrumentId, account_id: AccountId | None = None) -> bool
def is_completely_net_flat(self, account_id: AccountId | None = None) -> bool
```

同时提供 `venue` 与 `account_id` 时，两者必须解析到同一账户，否则查询
抛出 `ValueError`。Portfolio 向策略暴露查询；引擎命令保持在 Rust 运行时内部。

全部可用方法见 [`Portfolio` API Reference](https://nautilustrader.io/docs/python-api-latest/portfolio.html)。

#### 报告与分析 {#reports-and-analysis}

绩效分析使用 `Portfolio.statistics()` 与 `Portfolio.snapshots(account_id)`。
见 [Analysis API Reference](https://nautilustrader.io/docs/python-api-latest/analysis.html) 与
[组合统计](./portfolio.md#portfolio-statistics)指南。
[组合](./portfolio.md)指南还涵盖净值、盯市估值与多账户查询范围。

### 交易命令 {#trading-commands}

订单管理可使用以下交易命令。命令在系统中的完整流转见
[执行](./execution/index.md)指南。

#### 提交订单 {#submitting-orders}

每个 `Strategy` 的基类都提供 `OrderFactory`，用于减少创建 `Order`
对象的样板代码，也可以直接用 `Order.__init__(...)` 构造订单。

`SubmitOrder` 或 `SubmitOrderList` 命令首先按以下规则路由：

- 指定了 `emulation_trigger`，命令*首先*发往 `OrderEmulator`。
- 指定了 `exec_algorithm_id`（且无 `emulation_trigger`），命令*首先*发往相应的
  `ExecutionAlgorithm`。
- 否则，命令*首先*发往 `RiskEngine`。

下例提交一个用于模拟的 `LIMIT` BUY 订单（见[模拟订单](./orders/emulated.md)）：

```python
from nautilus_trader.model import LimitOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import TriggerType


def buy(self) -> None:
    """
    Users simple buy method (example).
    """
    order: LimitOrder = self.order_factory.limit(
        instrument_id=self.instrument_id,
        order_side=OrderSide.BUY,
        quantity=self.instrument.make_qty(self.trade_size),
        price=self.instrument.make_price(5000.00),
        emulation_trigger=TriggerType.LAST_PRICE,
    )

    self.submit_order(order)
```

:::info
订单模拟与执行算法可以同时指定。此时订单先送往 `OrderEmulator`，
释放后再路由到 `ExecutionAlgorithm`。
:::

下例提交一个 `MARKET` BUY 订单给 TWAP 执行算法：

```python
from nautilus_trader.model import ExecAlgorithmId
from nautilus_trader.model import MarketOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import TimeInForce


def buy(self) -> None:
    """
    Users simple buy method (example).
    """
    order: MarketOrder = self.order_factory.market(
        instrument_id=self.instrument_id,
        order_side=OrderSide.BUY,
        quantity=self.instrument.make_qty(self.trade_size),
        time_in_force=TimeInForce.FOK,
        exec_algorithm_id=ExecAlgorithmId("TWAP"),
        exec_algorithm_params={"horizon_secs": "20", "interval_secs": "2.5"},
    )

    self.submit_order(order)
```

TWAP 参数规则与派生订单的行为见[执行算法](./execution/algorithms.md)。

#### 撤销订单 {#canceling-orders}

订单可以逐个撤销、批量撤销，或撤销某工具的全部订单（可选按方向过滤）。

订单已*关闭*或已在待撤状态时，会记录一条警告。订单处于*开放*状态时，
其状态变为 `PENDING_CANCEL`。

路由取决于命令与每个订单的状态：

- 模拟订单的 `cancel_order(...)` 先送往 `OrderEmulator`。非模拟订单若带有
  `exec_algorithm_id` 且仍在本地系统中活跃，则送往相应的
  `ExecutionAlgorithm`；否则送往 `ExecutionEngine`。
- `cancel_all_orders(...)` 默认撤销与该策略关联的每个匹配订单，每个订单的
  路由与 `cancel_order(...)` 相同。个别撤销失败时，方法会继续尝试其余订单，
  最后抛出包含全部撤销错误的 `RuntimeError`。
- `cancel_orders(...)` 始终作为单条 `BatchCancelOrders` 命令送往
  `ExecutionEngine`。

:::info
命令离开策略后，受管理的 GTD 定时器也会被撤销。
:::

撤销单个订单：

```python
self.cancel_order(order.client_order_id)
```

批量撤销。批次中的每个订单必须属于同一工具，且不得包含模拟或本地订单：

```python
from nautilus_trader.model import ClientOrderId


client_order_ids: list[ClientOrderId] = [
    order1.client_order_id,
    order2.client_order_id,
    order3.client_order_id,
]
self.cancel_orders(client_order_ids)
```

撤销全部订单：

```python
self.cancel_all_orders(self.instrument_id)
```

:::warning
传 `strategy_only=False` 进入宽撤销路径。即便策略缓存中没有匹配订单，
也会发出一条 `CancelAllOrders` 命令。执行引擎解析出一个执行客户端与账户，
并在该边界内路由场所、模拟与执行算法的撤销。

与其他策略关联的匹配订单可能被撤销，但归属其他执行客户端的订单不受影响。
只在确实需要这种跨策略范围时使用宽模式。完整流程与客户端选择规则见
[全撤路由](./execution/index.md#cancel-all-routing)。
:::

#### 修改订单 {#modifying-orders}

订单可以在模拟状态下逐个修改，或在场所上处于*开放*状态时修改（若场所支持）。

修改请求合法时，已*关闭*或待撤的订单会记录警告。订单处于*开放*状态时，
其状态变为 `PENDING_UPDATE`。

:::warning
传入的值全部缺失或未变化时，`modify_order(...)` 抛出 `RuntimeError`。
订单处于 `PENDING_UPDATE` 期间，策略可以重发相同的数量。
这些检查在关闭订单与待撤检查之前执行。
:::

`ModifyOrder` 命令首先按以下规则路由：

- 订单处于模拟状态时，策略先把命令发往 `OrderEmulator`。
- 否则，若订单带有 `exec_algorithm_id` 且仍在本地系统中活跃，
  命令发往相应的 `ExecutionAlgorithm`。
- 否则，订单*首先*发往 `RiskEngine`。

:::info
主订单在本地仍活跃时，`ExecutionAlgorithm` 会拒绝其 `ModifyOrder`，
记录警告且不发出事件。算法的调度以其算出的数量为键，原地应用修改会破坏该状态。
主订单保持不变。
:::

下例修改在场所上处于*开放*状态的 `LIMIT` BUY 订单的数量：

```python
from nautilus_trader.model import Quantity


new_quantity: Quantity = Quantity.from_int(5)
self.modify_order(order.client_order_id, quantity=new_quantity)
```

:::info
价格与触发价也可以修改（模拟状态下，或场所支持时）。
:::

`modify_orders(...)` 把多个修改作为单条 `BatchModifyOrders` 命令发给
`RiskEngine`。与批量撤销一样，每个订单必须属于同一工具，
批次中不得包含模拟或本地订单。

#### 市场退出 {#market-exit}

`market_exit()` 提供了一种优雅的方式，平掉策略的全部持仓并撤销全部订单。
退出完成后策略仍在运行，之后可以按需重新建仓。

```python
self.market_exit()
```

策略不在 `RUNNING`，或已有退出正在进行时，调用记录警告并直接返回，不产生效果。

市场退出的流程：

1. 调用 `on_market_exit()`。
2. 撤销该策略全部开放与在途订单。
3. 用带 `MARKET_EXIT` 标记的市价单平掉所有未平仓持仓。
1. 按 `market_exit_interval_ms` 周期性检查，直到所有订单终结、持仓平完。
   挂单数量为零时，为仍未平仓的持仓重新提交平仓单。
5. 全部平仓后，或达到 `market_exit_max_attempts` 后调用 `post_market_exit()`，
   并记录仍未终结的订单与持仓。

两个钩子可用于自定义逻辑：

- `on_market_exit()`：退出流程开始时调用。
- `post_market_exit()`：退出流程完成时调用。

```python
class MyStrategy(Strategy):
    def on_market_exit(self) -> None:
        self.log.info("Beginning market exit...")

    def post_market_exit(self) -> None:
        self.log.info("Market exit complete")
```

市场退出期间，非只减仓订单会被自动拒绝，原因为
`MARKET_EXIT_IN_PROGRESS`。退出自身的平仓单因带 `MARKET_EXIT`
标记而放行。对订单列表，只要其中任一订单非只减仓，整个列表都会被拒绝，
以保持列表语义（例如有相互依赖的括号单）。

要检查退出是否进行中（例如跳过下单逻辑），用 `is_exiting()`：

```python
def on_quote(self, tick: QuoteTick) -> None:
    if self.is_exiting():
        return  # Skip order logic during exit
    # ... normal order logic
```

要在策略停止时执行市场退出，设置 `manage_stop=True`：

```python
config = StrategyConfig(manage_stop=True)
```

启用该选项后，`stop()` 会先执行市场退出，待全部平仓或达到
`market_exit_max_attempts` 后再停止策略。达到尝试上限时，
可能仍有订单或持仓未终结。

:::warning
回测中，在运行末尾请求的受管理停止无法完成。`market_exit()`
把首次完成检查排在当前时间之后 `market_exit_interval_ms`，
这已超出请求的结束时刻，而引擎此前已完成最后一次定时器冲刷，
没有回调能观测到退出完成。因此策略以 `RUNNING` 状态结束运行，
即使已经平仓也会被报告为 `ERROR`。
:::

`StrategyConfig` 中的配置项：

- `manage_stop`（默认 `False`）：为 `True` 时，`stop()` 先执行市场退出再停止。
- `market_exit_interval_ms`（默认 `100`）：退出完成检查的间隔。
- `market_exit_max_attempts`（默认 `100`）：完成退出前的最大检查次数。
- `market_exit_time_in_force`（默认 `GTC`）：平仓市价单的有效期。
- `market_exit_reduce_only`（默认 `True`）：平仓市价单是否设为只减仓。

#### 平仓 {#closing-positions}

不想走完整市场退出流程时，用 `close_position(...)` 和
`close_all_positions(...)` 清仓。两者都提交平仓市价单，
且不影响策略继续提交新订单。见[执行](./execution/index.md)指南。

## 策略配置 {#strategy-configuration}

独立的配置类让策略在何处、以何种方式实例化都足够灵活。
配置可序列化传输，从而支持分布式回测与远程实时交易。

这一机制是可选的。你可以跳过配置，直接把参数传给策略构造函数。
需要分布式回测或远程实时交易时，再定义配置。

`StrategyConfig` 用 Rust 实现。其 `__new__` 从构造函数调用中读出基础字段
（`strategy_id`、`order_id_tag`、`oms_type` 等）并校验，忽略无法识别的关键字。
基类没有 `__init__`。

子类因此只需做到三点：

- 把自己的字段声明为仅关键字参数，避免位置参数匹配到基础字段。
- 接受 `**_kwargs`，让基础字段能穿过子类签名。
- 以无参方式调用 `super().__init__()`，再赋值自己的字段。

不要让自定义字段与基础字段同名，两个构造函数都会读取它；
当值与基础字段的类型不符时 `__new__` 抛出 `TypeError`。

下面是一个配置示例：

```python
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.model import Bar
from nautilus_trader.model import BarType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import StrategyId
from nautilus_trader.trading import Strategy


# Configuration definition
class MyStrategyConfig(StrategyConfig):
    def __init__(
        self,
        *,
        instrument_id: InstrumentId,
        bar_type: BarType,
        trade_size: Decimal,
        fast_ema_period: int = 10,
        slow_ema_period: int = 20,
        **_kwargs,
    ) -> None:
        super().__init__()
        self.instrument_id = instrument_id
        self.bar_type = bar_type
        self.trade_size = trade_size
        self.fast_ema_period = fast_ema_period
        self.slow_ema_period = slow_ema_period


# Strategy definition
class MyStrategy(Strategy):
    def __init__(self, config: MyStrategyConfig) -> None:
        # Always initialize the parent Strategy class
        # After this, configuration is stored and available via `self.config`
        super().__init__(config)

        # Custom state variables
        self.time_started = None
        self.count_of_processed_bars: int = 0

    def on_start(self) -> None:
        self.time_started = self.clock.utc_now()  # Remember time, when strategy started
        self.subscribe_bars(
            self.config.bar_type
        )  # See how configuration data are exposed via `self.config`

    def on_bar(self, bar: Bar):
        self.count_of_processed_bars += 1  # Update count of processed bars


# Instantiate configuration with specific values. By setting:
#   - InstrumentId - we parameterize the instrument the strategy will trade.
#   - BarType - we parameterize bar-data, that strategy will trade.
#   - StrategyId - we name this instance, which also fixes its order ID tag.
config = MyStrategyConfig(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    bar_type=BarType.from_str("ETHUSDT-PERP.BINANCE-15-MINUTE-LAST-EXTERNAL"),
    trade_size=Decimal("1"),
    strategy_id=StrategyId("MyStrategy-001"),
)

# Pass configuration to our trading strategy.
strategy = MyStrategy(config=config)
```

配置通过 `self.config` 读取，运行时状态保存为策略的直接属性：

- 配置数据（经 `self.config` 访问）：
  - 存放决定策略如何运行的初始设置。
  - 例如：`self.config.trade_size`、`self.config.instrument_id`

- 策略状态变量（作为直接属性）：
  - 跟踪策略的任意自定义状态。
  - 例如：`self.time_started`、`self.count_of_processed_bars`

这样把初始设置与变化中的状态分开，代码更易读、易维护。

:::note
策略通常只交易一个工具，但能同时处理多少个工具只受机器资源限制。
:::

### 认领外部订单 {#claiming-external-orders}

实时适配器可能报告并非由策略提交、NautilusTrader 也尚未在本地观测到的场所订单。
NautilusTrader 把它们创建为外部订单，归属到 `EXTERNAL` 策略，
除非有活动认领指明另一个策略是其所有者。

用 `external_order_instrument_ids` 列出策略打算为外部订单、成交以及
物化对账活动认领的工具：

```python
from nautilus_trader.config import StrategyConfig
from nautilus_trader.model import InstrumentId


config = StrategyConfig(
    external_order_instrument_ids=[
        InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    ],
)
```

`external_order_instrument_ids` 是可序列化的配置意图。实时节点注册策略时，
运行时把该意图物化为共享缓存中的活动外部订单认领。每条认领把一个
`InstrumentId` 指派给一个 `StrategyId`。

出现以下情况时注册失败，且活动认领保持不变：

- 共享缓存已被借用。
- 列表中重复了某个工具。
- 列出的工具已有认领，包括同一策略已有的认领。

注册之后，调用 `set_external_order_instrument_ids(...)`
可替换该策略完整的活动认领集合。该方法：

- 保留列表中已由该策略拥有的认领。
- 释放被省略的认领。
- 获取列出的、尚无所有者的工具。

传入空列表会释放该策略拥有的每条认领。若某工具出现多次或属于其他策略，
调用失败，活动认领集合保持不变。

变更只影响更新之后的归属判定，不会重新指派缓存中已有的外部订单。

策略必须先注册才能更新活动认领，且共享缓存已被借用时更新会失败。
对 Python 策略，该方法改变的是活动路由状态；原来的
`strategy.config` 对象仍显示构造时的意图。

停止策略会保留其活动认领，以便重启时路由保持稳定。
把策略从其 trader 移除才会释放认领，缓存重置同样保留它们。

:::warning
在策略之间转移一个工具需要两次调用：现有所有者先释放，新所有者再认领。
该转移在策略之间不是原子的。两次调用之间处理的外部报告没有活动认领，
会被归属到 `EXTERNAL` 策略。
:::

执行与对账如何使用活动认领，见[外部订单创建](./execution/reconciliation.md#external-order-creation)。

### 受管理的 GTD 到期 {#managed-gtd-expiry}

策略可以管理 GTD（*Good 'till Date*）订单的到期。交易所或券商不支持该有效期时
用本地管理；你偏好本地到期管理时也可以用。

要使用该选项，向 `StrategyConfig` 传 `manage_gtd_expiry=True`。
提交带 GTD 有效期的订单后，策略会启动一个内部时间提醒；提醒触发时，
若订单尚未*关闭*就将其撤销。

启动时，策略还会为缓存中自己未平仓的 GTD 订单重建提醒，
并撤销其中已过期的订单。

撤单请求被拒绝时，运行中的策略会保留现有提醒。对于缺失到期提醒的
开放或在途 GTD 订单：

- 若已过期，立即重试撤单。
- 否则恢复到期提醒。

这发生在 `on_order_cancel_rejected` 之前，因此立即重试可能让订单在回调
执行前就回到 `PENDING_CANCEL`。已停止的策略在被拒绝时既不恢复提醒也不重试撤单。

有些场所（如 Binance Futures）支持 GTD 有效期，因此使用
`manage_gtd_expiry` 时应把执行客户端配置的 `use_gtd` 设为 `False` 以避免冲突。

### 多策略实例 {#multiple-strategies}

同一策略按不同配置运行多个实例（例如交易不同工具）时，
给每个实例**唯一的策略 ID 与订单 ID 标签**。

系统必须能识别每条命令与事件属于哪个策略。订单 ID 标签还能让
同一 trader 下各策略生成的客户端订单 ID 保持唯一。

#### 订单 ID 标签 {#order-id-tag}

在每份配置上设置 `strategy_id`。运行时取策略 ID 最后一段连字符分隔部分
作为订单 ID 标签，因此 `MyStrategy-001` 与 `MyStrategy-002`
的标签分别是 `001` 和 `002`。

同时提供 `order_id_tag` 时，标签会被追加到运行时策略 ID 之后，
除非该 ID 已以该标签结尾。例如
`strategy_id=StrategyId("MyStrategy-PRIMARY")` 配
`order_id_tag="ABC"` 注册为 `MyStrategy-PRIMARY-ABC`。

未带 `strategy_id` 注册的策略以策略类型名作为基础 ID，`order_id_tag`
成为后缀：`MyStrategy` 配 `order_id_tag="ABC"` 注册为
`MyStrategy-ABC`。没有标签时，注册时分配下一个数字标签，从 `000` 起。

由于运行时是从策略 ID 的最后一段连字符分隔部分读回标签，
`order_id_tag` 不能包含连字符。`StrategyConfig(order_id_tag="A-B")`
抛出 `ValueError`，以该关键字构造的子类同样如此。
不继承 `StrategyConfig` 的配置类会把标签带到注册时，
届时抛出 `RuntimeError`。

trader ID 同样以带标签的方式工作，其最后一段连字符分隔部分进入相同的
生成 ID。跨节点必须保持唯一的要求见
[配置实时交易节点](./../how_to/configure_live_trading.md)。

:::note
平台内置了保护措施。重复的策略 ID 会抛出提示策略 ID 已注册的
`RuntimeError`；两个不同的策略 ID 共用同一订单 ID 标签时，
会抛出报告标签冲突的 `RuntimeError`。
:::

:::info Rust 实现
Rust 把 `StrategyConfig` 视为不可变的构造输入。运行时
`StrategyId` 携带订单 ID 标签，与 Python 行为一致。
这样 actor 注册、客户端订单 ID 生成、订单列表 ID 生成与
持仓 ID 生成都通过 `strategy_id.get_tag()` 保持一致。
:::

更多细节见 [`StrategyId` API Reference](https://nautilustrader.io/docs/python-api-latest/model/identifiers.html)。

## 相关指南 {#related-guides}

- [Actors](./actors.md) - 策略所继承的基类。
- [事件](./events/index.md) - 事件类型与处理器分发。
- [订单](./orders/index.md) - 订单类型与策略侧的订单管理。
- [回测](./backtesting/index.md) - 用历史数据测试策略。
