# 策略

NautilusTrader 的核心体验来自于编写并运行交易策略。定义一个策略通常需要继承 `Strategy` 类并实现策略逻辑所需的方法。

**主要功能**：

- 继承自 `Actor` 的所有功能。
- 订单管理。

**与 Actor 的关系**：
`Strategy` 类继承自 `Actor`，这意味着策略可以使用所有 Actor 的功能，同时提供额外的订单管理能力。

:::tip
在开始编写策略之前，建议先阅读 [Actors](actors.md) 指南。
:::

策略可以在任意 [环境上下文](/concepts/architecture.md#environment-contexts) 中添加到 Nautilus 系统中，系统启动后策略会根据其逻辑开始发送命令并接收事件。

利用数据摄取（data ingest）、事件处理（event handling）和订单管理等基本构建块（下文会详细说明），可以实现各种类型的策略，例如方向性（directional）、动量（momentum）、再平衡（re-balancing）、配对交易（pairs）、做市（market making）等。

:::info
有关所有可用方法的完整说明，请参见 `Strategy` 的 [API 参考](../api_reference/trading.md)。
:::

Nautilus 交易策略主要由两部分组成：

- 策略实现本身（通过继承 `Strategy` 类定义）。
- 可选的策略配置（通过继承 `StrategyConfig` 类定义）。

:::tip
一旦策略定义完成，相同的源代码可以用于回测（backtesting）和实盘交易（live trading）。
:::

策略的主要能力包括：

- 请求历史数据（historical data）。
- 订阅实时数据（live data feed）。
- 设置时间提醒或计时器（time alerts / timers）。
- 访问缓存（Cache）。
- 访问投资组合（Portfolio）。
- 创建和管理订单与持仓（orders and positions）。

## 策略实现（Strategy implementation）

由于交易策略是继承自 `Strategy` 的类，你必须定义构造函数来进行初始化。至少需要调用基类的初始化：

```python
from nautilus_trader.trading.strategy import Strategy

class MyStrategy(Strategy):
    def __init__(self) -> None:
        super().__init__()  # <-- 必须调用父类以初始化策略
```

此后，你可以根据需要实现各种 handler 来在状态变更或事件到达时执行相应操作。

:::warning
不要在 `__init__` 构造函数中调用诸如 `clock` 或 `logger` 之类的组件（因为此时尚未完成注册）。这是因为系统的时钟和日志子系统尚未初始化。
:::

### 处理器（Handlers）

Handlers 是 `Strategy` 类中的方法，用于在不同类型的事件或状态变更发生时执行动作。此类方法以 `on_*` 前缀命名。你可以根据策略的具体需求实现其中的部分或全部方法。

为相似类型事件提供多个 handler 的目的是为了在处理粒度上提供灵活性。你可以为特定事件实现专门的 handler，或使用更通用的 handler 处理一系列相关事件（类似 switch 语句的逻辑）。调用顺序是从最具体到最通用。

#### 有状态的操作（Stateful actions）

这些 handler 由策略的生命周期状态变化触发。建议：

- 使用 `on_start` 方法初始化策略（例如：获取 instrument、订阅数据）。
- 使用 `on_stop` 方法执行清理任务（例如：取消未结订单、平掉持仓、取消订阅）。

```python
def on_start(self) -> None:
def on_stop(self) -> None:
def on_resume(self) -> None:
def on_reset(self) -> None:
def on_dispose(self) -> None:
def on_degrade(self) -> None:
def on_fault(self) -> None:
def on_save(self) -> dict[str, bytes]:  # 返回要保存的用户自定义状态字典
def on_load(self, state: dict[str, bytes]) -> None:
```

#### 数据处理（Data handling）

这些 handler 接收数据更新，包括内置的市场数据和用户自定义数据。你可以在接收到相应的数据对象实例时在这些 handler 中定义处理逻辑。

```python
from nautilus_trader.core import Data
from nautilus_trader.model import OrderBook
from nautilus_trader.model import Bar
from nautilus_trader.model import QuoteTick
from nautilus_trader.model import TradeTick
from nautilus_trader.model import OrderBookDeltas
from nautilus_trader.model import InstrumentClose
from nautilus_trader.model import InstrumentStatus
from nautilus_trader.model.instruments import Instrument

def on_order_book_deltas(self, deltas: OrderBookDeltas) -> None:
def on_order_book(self, order_book: OrderBook) -> None:
def on_quote_tick(self, tick: QuoteTick) -> None:
def on_trade_tick(self, tick: TradeTick) -> None:
def on_bar(self, bar: Bar) -> None:
def on_instrument(self, instrument: Instrument) -> None:
def on_instrument_status(self, data: InstrumentStatus) -> None:
def on_instrument_close(self, data: InstrumentClose) -> None:
def on_historical_data(self, data: Data) -> None:
def on_data(self, data: Data) -> None:  # 自定义数据传入该 handler
def on_signal(self, signal: Data) -> None:  # 自定义信号传入该 handler
```

#### 订单管理（Order management）

这些 handler 接收与订单相关的事件。`OrderEvent` 类型的消息按如下顺序传递给 handler：

1. 特定 handler（例如 `on_order_accepted`、`on_order_rejected` 等）
2. `on_order_event(...)`
3. `on_event(...)`

```python
from nautilus_trader.model.events import OrderAccepted
from nautilus_trader.model.events import OrderCanceled
from nautilus_trader.model.events import OrderCancelRejected
from nautilus_trader.model.events import OrderDenied
from nautilus_trader.model.events import OrderEmulated
from nautilus_trader.model.events import OrderEvent
from nautilus_trader.model.events import OrderExpired
from nautilus_trader.model.events import OrderFilled
from nautilus_trader.model.events import OrderInitialized
from nautilus_trader.model.events import OrderModifyRejected
from nautilus_trader.model.events import OrderPendingCancel
from nautilus_trader.model.events import OrderPendingUpdate
from nautilus_trader.model.events import OrderRejected
from nautilus_trader.model.events import OrderReleased
from nautilus_trader.model.events import OrderSubmitted
from nautilus_trader.model.events import OrderTriggered
from nautilus_trader.model.events import OrderUpdated

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
def on_order_event(self, event: OrderEvent) -> None:  # 所有订单事件最终都会传递到该 handler
```

#### 持仓管理（Position management）

这些 handler 接收与持仓相关的事件。`PositionEvent` 类型的消息按如下顺序传递：

1. 特定 handler（例如 `on_position_opened`、`on_position_changed` 等）
2. `on_position_event(...)`
3. `on_event(...)`

```python
from nautilus_trader.model.events import PositionChanged
from nautilus_trader.model.events import PositionClosed
from nautilus_trader.model.events import PositionEvent
from nautilus_trader.model.events import PositionOpened

def on_position_opened(self, event: PositionOpened) -> None:
def on_position_changed(self, event: PositionChanged) -> None:
def on_position_closed(self, event: PositionClosed) -> None:
def on_position_event(self, event: PositionEvent) -> None:  # 所有持仓事件最终都会传递到该 handler
```

#### 通用事件处理（Generic event handling）

该 handler 最终会接收到传入策略的所有事件消息（包括没有对应特定 handler 的事件）。

```python
from nautilus_trader.core.message import Event

def on_event(self, event: Event) -> None:
```

#### Handler 示例

下面的示例展示了一个典型的 `on_start` handler（取自示例 EMA cross 策略）。可以看到：

- 指标被注册以接收 bar 更新。
- 请求历史数据以初始化指标（hydrate indicators）。
- 订阅实时数据。

```python
def on_start(self) -> None:
    """
    策略启动时要执行的操作。
    """
    self.instrument = self.cache.instrument(self.instrument_id)
    if self.instrument is None:
        self.log.error(f"Could not find instrument for {self.instrument_id}")
        self.stop()
        return

    # 注册指标以便接收更新
    self.register_indicator_for_bars(self.bar_type, self.fast_ema)
    self.register_indicator_for_bars(self.bar_type, self.slow_ema)

    # 请求历史数据
    self.request_bars(self.bar_type)

    # 订阅实时数据
    self.subscribe_bars(self.bar_type)
    self.subscribe_quote_ticks(self.instrument_id)
```

### 时钟与计时器（Clock and timers）

策略可以访问 `Clock`，它提供了多种方法来创建时间戳，并可设置时间提醒或计时器以触发 `TimeEvent`。

:::info
有关 `Clock` 的完整方法列表，请参见 [API reference](../api_reference/common.md)。
:::

#### 当前时间戳（Current timestamps）

获取当前时间戳有多种方式，以下给出两个常用示例：

以带时区的 `pd.Timestamp` 获取当前 UTC 时间：

```python
import pandas as pd


now: pd.Timestamp = self.clock.utc_now()
```

以自 UNIX 纪元以来的纳秒数获取当前 UTC 时间：

```python
unix_nanos: int = self.clock.timestamp_ns()
```

#### 时间提醒（Time alerts）

可以设置时间提醒（time alerts），在指定的提醒时间将触发 `TimeEvent` 并派发到 `on_event` handler。在实盘环境中，该事件可能会有几微秒的延迟。

下面的示例设置了一个将在一分钟后触发的时间提醒：

```python
import pandas as pd

# 在一分钟后触发一个 TimeEvent
self.clock.set_time_alert(
    name="MyTimeAlert1",
    alert_time=self.clock.utc_now() + pd.Timedelta(minutes=1),
)
```

#### 计时器（Timers）

可以设置周期性计时器（timers），在到期或被取消前会按设定间隔持续触发 `TimeEvent`。

下面的示例设置了一个立即开始、每分钟触发一次的计时器：

```python
import pandas as pd

# 每分钟触发一次 TimeEvent
self.clock.set_timer(
    name="MyTimer1",
    interval=pd.Timedelta(minutes=1),
)
```

### 缓存访问（Cache access）

策略实例可以访问中央 `Cache` 来获取数据和执行对象（如订单、持仓等）。Cache 提供了很多方法，通常带有过滤功能，下面展示一些常见用法。

#### 获取数据（Fetching data）

下面示例展示了如何从 cache 获取数据（假设已存在 instrument ID 属性）：

```python
last_quote = self.cache.quote_tick(self.instrument_id)
last_trade = self.cache.trade_tick(self.instrument_id)
last_bar = self.cache.bar(bar_type)
```

#### 获取执行对象（Fetching execution objects）

下面示例展示了如何从 cache 获取具体的订单或持仓对象：

```python
order = self.cache.order(client_order_id)
position = self.cache.position(position_id)

```

:::info
有关 `Cache` 的完整 API，请参见 [API Reference](../api_reference/cache.md)。
:::

### 投资组合访问（Portfolio access）

策略可以访问中心化的 `Portfolio` 以获取账户与持仓信息。下面列出了一些常用方法的概览。

#### 账户与持仓信息（Account and positional information）

```python
import decimal

from nautilus_trader.accounting.accounts.base import Account
from nautilus_trader.model import Venue
from nautilus_trader.model import Currency
from nautilus_trader.model import Money
from nautilus_trader.model import InstrumentId

def account(self, venue: Venue) -> Account

def balances_locked(self, venue: Venue) -> dict[Currency, Money]
def margins_init(self, venue: Venue) -> dict[Currency, Money]
def margins_maint(self, venue: Venue) -> dict[Currency, Money]
def unrealized_pnls(self, venue: Venue) -> dict[Currency, Money]
def realized_pnls(self, venue: Venue) -> dict[Currency, Money]
def net_exposures(self, venue: Venue) -> dict[Currency, Money]

def unrealized_pnl(self, instrument_id: InstrumentId) -> Money
def realized_pnl(self, instrument_id: InstrumentId) -> Money
def net_exposure(self, instrument_id: InstrumentId) -> Money
def net_position(self, instrument_id: InstrumentId) -> decimal.Decimal

def is_net_long(self, instrument_id: InstrumentId) -> bool
def is_net_short(self, instrument_id: InstrumentId) -> bool
def is_flat(self, instrument_id: InstrumentId) -> bool
def is_completely_flat(self) -> bool
```

:::info
有关 `Portfolio` 的完整 API，请参见 [API Reference](../api_reference/portfolio.md)。
:::

#### 报告与分析（Reports and analysis）

`Portfolio` 还提供了 `PortfolioAnalyzer`，可向其传入灵活数量的数据以适配不同的回溯窗口（lookback windows），分析器可以用于跟踪并生成各种绩效指标与统计数据。

:::info
有关 `PortfolioAnalyzer` 的完整 API，请参见 [API Reference](../api_reference/analysis.md)。
:::

:::info
参见 [Portfolio statistics](portfolio.md#portfolio-statistics) 指南。
:::

### 交易命令（Trading commands）

NautilusTrader 提供了一套完整的交易命令，以支持细粒度的订单管理，满足算法交易的需求。这些命令对于执行策略、管理风险以及与各类交易场所的交互至关重要。下文将介绍每类命令的细节与使用场景。

:::info
可结合阅读 [Execution](../concepts/execution.md) 指南以理解命令在系统中的流转。
:::

#### 提交订单（Submitting orders）

基类为每个 `Strategy` 提供了一个 `OrderFactory`，以减少创建不同 `Order` 对象时的模板代码（当然你也可以直接使用 `Order.__init__(...)` 构造器初始化订单对象）。

一个 `SubmitOrder` 或 `SubmitOrderList` 命令会先流向哪个组件取决于以下规则：

- 如果指定了 `emulation_trigger`，命令会首先被发送到 `OrderEmulator`。
- 如果指定了 `exec_algorithm_id`（且未指定 `emulation_trigger`），命令会首先被发送到相应的 `ExecAlgorithm`。
- 否则，命令会首先被发送到 `RiskEngine`。

下面的示例提交了一个用于仿真的 `LIMIT` 买单（参见 [Emulated Orders](orders.md#emulated-orders)）：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model.orders import LimitOrder


def buy(self) -> None:
    """
    用户的简单买入方法（示例）。
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
你可以同时指定订单仿真（emulation）和执行算法（execution algorithm）。
:::

下面的示例将一个 `MARKET` 买单提交给 TWAP 执行算法：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model import ExecAlgorithmId


def buy(self) -> None:
    """
    用户的简单买入方法（示例）。
    """
    order: MarketOrder = self.order_factory.market(
        instrument_id=self.instrument_id,
        order_side=OrderSide.BUY,
        quantity=self.instrument.make_qty(self.trade_size),
        time_in_force=TimeInForce.FOK,
        exec_algorithm_id=ExecAlgorithmId("TWAP"),
        exec_algorithm_params={"horizon_secs": 20, "interval_secs": 2.5},
    )

    self.submit_order(order)
```

#### 取消订单（Canceling orders）

可以单独取消订单、批量取消，或取消某一合约的所有订单（可选按方向过滤）。

如果订单已经 _closed_ 或已经处于待取消（pending cancel），系统会记录警告日志。

如果订单当前处于 _open_ 状态，其状态将变为 `PENDING_CANCEL`。

一个 `CancelOrder`、`CancelAllOrders` 或 `BatchCancelOrders` 命令会先流向哪个组件取决于：

- 如果订单当前是仿真订单，命令会首先发送到 `OrderEmulator`。
- 如果指定了 `exec_algorithm_id`（且未指定 `emulation_trigger`），并且订单仍在本地系统中处于活动状态，则命令会首先发送到相应的 `ExecAlgorithm`。
- 否则，命令会首先发送到 `ExecutionEngine`。

:::info
任何由策略管理的 GTD 计时器在命令离开策略后也会被取消。
:::

下面示例展示如何取消单个订单：

```python

self.cancel_order(order)

```

下面示例展示如何批量取消订单：

```python
from nautilus_trader.model import Order


my_order_list: list[Order] = [order1, order2, order3]
self.cancel_orders(my_order_list)

```

下面示例展示如何取消所有订单：

```python

self.cancel_all_orders()

```

#### 修改订单（Modifying orders）

当订单为仿真状态或在交易所/场所仍为 _open_（且该场所支持）时，可以对订单进行修改。

如果订单已经 _closed_ 或已经处于待取消状态，会记录警告日志。如果订单当前为 _open_，其状态将变为 `PENDING_UPDATE`。

:::warning
命令至少应改变原订单的一个字段，否则该修改命令无效。
:::

`ModifyOrder` 命令会先流向哪个组件取决于：

- 如果订单当前为仿真订单，命令会首先发送到 `OrderEmulator`。
- 否则，命令会首先发送到 `RiskEngine`。

:::info
一旦订单由执行算法（execution algorithm）接管，策略无法直接修改该订单（只能取消）。
:::

下面示例展示了如何修改当前在场所上 _open_ 的 `LIMIT` 买单的数量：

```python
from nautilus_trader.model import Quantity


new_quantity: Quantity = Quantity.from_int(5)
self.modify_order(order, new_quantity)

```

:::info
当订单为仿真或场所支持时，价格和触发价也可以被修改。
:::

## 策略配置（Strategy configuration）

单独的配置类的主要目的是提供关于策略如何以及在何处实例化的完全灵活性。这包括能够将策略与其配置序列化并通过网络传输，从而支持分布式回测和远程启动实盘交易。

这种配置灵活性是可选的（opt-in），你也可以仅在构造函数中传入参数而不定义额外的配置类。但如果你希望运行分布式回测或远程启动实盘服务器，就需要定义策略配置类。

下面给出一个示例配置：

```python
from decimal import Decimal
from nautilus_trader.config import StrategyConfig
from nautilus_trader.model import Bar, BarType
from nautilus_trader.model import InstrumentId
from nautilus_trader.trading.strategy import Strategy


# 配置定义
class MyStrategyConfig(StrategyConfig):
    instrument_id: InstrumentId   # 示例值: "ETHUSDT-PERP.BINANCE"
    bar_type: BarType             # 示例值: "ETHUSDT-PERP.BINANCE-15-MINUTE[LAST]-EXTERNAL"
    fast_ema_period: int = 10
    slow_ema_period: int = 20
    trade_size: Decimal
    order_id_tag: str


# 策略定义
class MyStrategy(Strategy):
    def __init__(self, config: MyStrategyConfig) -> None:
        # 始终先初始化父类 Strategy
        # 完成后，配置会存储在 `self.config` 中可供访问
        super().__init__(config)

        # 自定义状态变量
        self.time_started = None
        self.count_of_processed_bars: int = 0

    def on_start(self) -> None:
        self.time_started = self.clock.utc_now()    # 记录策略启动时间
        self.subscribe_bars(self.config.bar_type)   # 通过 self.config 访问配置数据

    def on_bar(self, bar: Bar):
        self.count_of_processed_bars += 1           # 更新已处理的 bar 计数


# 用具体值实例化配置。通过设置:
#   - InstrumentId - 参数化策略要交易的合约。
#   - BarType - 参数化策略要使用的 bar 数据类型。
config = MyStrategyConfig(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    bar_type=BarType.from_str("ETHUSDT-PERP.BINANCE-15-MINUTE[LAST]-EXTERNAL"),
    trade_size=Decimal(1),
    order_id_tag="001",
)

# 将配置传递给我们的策略实例。
strategy = MyStrategy(config=config)
```

在实现策略时，建议通过 `self.config` 直接访问配置值。这有助于清晰地区分：

- 配置数据（通过 `self.config` 访问）：

  - 包含定义策略如何工作的初始设置。
  - 例如：`self.config.trade_size`、`self.config.instrument_id`

- 策略状态变量（作为实例属性）：
  - 用于跟踪策略的自定义运行时状态。
  - 例如：`self.time_started`、`self.count_of_processed_bars`

这种分离使代码更易于理解与维护。

:::note
尽管通常一个策略会交易单个合约，但单个策略可以处理的合约数量仅受限于机器资源。
:::

### 管理 GTD 到期（Managed GTD expiry）

策略可以选择管理具有 GTD（Good 'till Date）时限的订单的到期行为。如果交易所/经纪商不支持该时限，或你希望由策略负责管理，这个功能会很有用。

要启用此选项，请在 `StrategyConfig` 中传入 `manage_gtd_expiry=True`。当以 GTD 时限提交订单时，策略会自动启动一个内部时间提醒。一旦内部 GTD 时间提醒触发，若订单尚未 _closed_，将会被取消。

某些场所（例如 Binance Futures）原生支持 GTD 时限，因此在使用 `managed_gtd_expiry` 时，应在执行客户端配置中将 `use_gtd=False`，以避免冲突。

### 多个策略实例（Multiple strategies）

如果你打算运行同一策略的多个实例（使用不同配置，例如针对不同合约），需要为每个实例定义唯一的 `order_id_tag`（如上示例所示）。

:::note
平台内置了安全检查：如果两个策略共享相同的策略 ID，会抛出异常提示策略 ID 已被注册。
:::

之所以需要唯一标识，是因为系统必须能够识别各条命令和事件属于哪个策略。策略 ID 由策略类名与策略的 `order_id_tag` 用连字符连接组成。例如上面的配置会产生策略 ID `MyStrategy-001`。

:::note
详情请参见 `StrategyId` 的 [API Reference](../api_reference/model/identifiers.md)。
:::
