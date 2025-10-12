# Actors

:::info
We are currently working on this concept guide.
:::

`Actor` 是与交易系统交互的基础组件。
它提供了接收市场数据、处理事件以及在交易环境中管理状态的核心功能。
`Strategy` 类继承自 `Actor`，并在此基础上扩展了订单管理相关的方法。

**主要能力**：

- 事件订阅与处理。
- 市场数据接收。
- 状态管理。
- 与系统交互的原语（primitives）。

## 基本示例

与策略类似，actor 也通过类似的配置模式来初始化。

```python
from nautilus_trader.config import ActorConfig
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Bar, BarType
from nautilus_trader.common.actor import Actor


class MyActorConfig(ActorConfig):
    instrument_id: InstrumentId   # example value: "ETHUSDT-PERP.BINANCE"
    bar_type: BarType             # example value: "ETHUSDT-PERP.BINANCE-15-MINUTE[LAST]-INTERNAL"
    lookback_period: int = 10


class MyActor(Actor):
    def __init__(self, config: MyActorConfig) -> None:
        super().__init__(config)

        # 自定义状态变量
        self.count_of_processed_bars: int = 0

    def on_start(self) -> None:
        # 订阅所有传入的 bar
        self.subscribe_bars(self.config.bar_type)   # 可以通过 `self.config` 直接访问配置

    def on_bar(self, bar: Bar):
        self.count_of_processed_bars += 1
```

## 数据处理与回调

在 Nautilus 中处理数据时，需要理解数据的 _请求/订阅_（requests/subscriptions）与相应回调处理器之间的关系。
系统会根据数据是历史数据还是实时数据选择不同的处理 handler。

### 历史数据 vs 实时数据

系统将数据流分为两类：

1. **历史数据**（来自 _requests_）:

   - 通过 `request_bars()`、`request_quote_ticks()` 等方法获取。
   - 由 `on_historical_data()` Handler 处理。
   - 常用于初始数据加载和历史分析。

2. **实时数据**（来自 _subscriptions_）:
   - 通过 `subscribe_bars()`、`subscribe_quote_ticks()` 等方法获取。
   - 由专门的 handler（例如 `on_bar()`、`on_quote_tick()` 等）处理。
   - 用于实时（live）数据处理。

### 回调处理器映射

下面列出了不同数据操作与其对应的 handler：

| Operation                       | Category   | Handler                  | Purpose                                       |
| :------------------------------ | :--------- | :----------------------- | :-------------------------------------------- |
| `subscribe_data()`              | Real‑time  | `on_data()`              | 实时数据更新                                  |
| `subscribe_instrument()`        | Real‑time  | `on_instrument()`        | 实时的 instrument 定义更新                    |
| `subscribe_instruments()`       | Real‑time  | `on_instrument()`        | （针对某个 venue 的）一批 instrument 定义更新 |
| `subscribe_order_book_deltas()` | Real‑time  | `on_order_book_deltas()` | 实时订单薄（order book）更新                  |
| `subscribe_quote_ticks()`       | Real‑time  | `on_quote_tick()`        | 实时报价更新                                  |
| `subscribe_trade_ticks()`       | Real‑time  | `on_trade_tick()`        | 实时成交（trade）更新                         |
| `subscribe_mark_prices()`       | Real‑time  | `on_mark_price()`        | 实时标记价（mark price）更新                  |
| `subscribe_index_prices()`      | Real‑time  | `on_index_price()`       | 实时指数价更新                                |
| `subscribe_funding_rates()`     | Real‑time  | `on_funding_rate()`      | 实时 funding rate 更新                        |
| `subscribe_bars()`              | Real‑time  | `on_bar()`               | 实时 bar 更新                                 |
| `subscribe_instrument_status()` | Real‑time  | `on_instrument_status()` | 实时 instrument 状态更新                      |
| `subscribe_instrument_close()`  | Real‑time  | `on_instrument_close()`  | instrument 收盘（close）事件                  |
| `subscribe_order_fills()`       | Real‑time  | `on_order_filled()`      | 某合约/标的的成交回报事件                     |
| `request_data()`                | Historical | `on_historical_data()`   | 历史数据处理                                  |
| `request_instrument()`          | Historical | `on_instrument()`        | instrument 定义更新                           |
| `request_instruments()`         | Historical | `on_instrument()`        | instrument 定义更新                           |
| `request_quote_ticks()`         | Historical | `on_historical_data()`   | 历史报价处理                                  |
| `request_trade_ticks()`         | Historical | `on_historical_data()`   | 历史成交处理                                  |
| `request_bars()`                | Historical | `on_historical_data()`   | 历史 bar 处理                                 |
| `request_aggregated_bars()`     | Historical | `on_historical_data()`   | 即时聚合的历史 bars（on-the-fly）             |

### 历史与实时数据示例

下面示例同时演示了历史数据请求与实时订阅的处理方式：

```python
from nautilus_trader.common.actor import Actor
from nautilus_trader.config import ActorConfig
from nautilus_trader.core.data import Data
from nautilus_trader.model import Bar, BarType
from nautilus_trader.model import ClientId, InstrumentId


class MyActorConfig(ActorConfig):
    instrument_id: InstrumentId  # example value: "AAPL.XNAS"
    bar_type: BarType            # example value: "AAPL.XNAS-1-MINUTE-LAST-EXTERNAL"


class MyActor(Actor):
    def __init__(self, config: MyActorConfig) -> None:
        super().__init__(config)
        self.bar_type = config.bar_type

    def on_start(self) -> None:
        # 请求历史数据 —— 由 on_historical_data() 处理
        self.request_bars(
            bar_type=self.bar_type,
            # 许多可选参数
            start=None,                # datetime，可选
            end=None,                  # datetime，可选
            callback=None,             # 请求完成时带回 request ID 的回调
            update_catalog_mode=None,  # UpdateCatalogMode | None，默认 None
            params=None,               # dict[str, Any]，可选
        )

        # 订阅实时数据 —— 由 on_bar() 处理
        self.subscribe_bars(
            bar_type=self.bar_type,
            # 许多可选参数
            client_id=None,  # ClientId，可选
            params=None,     # dict[str, Any]，可选
        )

    def on_historical_data(self, data: Data) -> None:
        # 处理历史数据（来自 request）
        if isinstance(data, Bar):
            self.log.info(f"Received historical bar: {data}")

    def on_bar(self, bar: Bar) -> None:
        # 处理实时 bar 更新（来自订阅）
        self.log.info(f"Received real-time bar: {bar}")
```

将历史与实时数据处理器分离有利于根据数据上下文采用不同的处理逻辑。例如，你可能会：

- 使用历史数据来初始化指标或建立基线统计。
- 在实时交易决策中对实时数据采用不同的处理方式。
- 对历史数据和实时数据分别应用不同的校验或日志策略。

:::tip
在调试数据流问题时，先确认你关注的是正确的 handler。如果你在 `on_bar()` 中没有看到数据，但日志显示已接收到 bar，可能是因为数据来自 request（历史数据），应检查 `on_historical_data()`。
:::

## 成交回报（Order fill）订阅

Actors 可以通过 `subscribe_order_fills()` 订阅某个合约/标的的成交回报事件，这对于监控交易活动、实现自定义成交分析或追踪执行质量非常有用。

订阅后，该标的的所有成交回报都会被转发到 `on_order_filled()` 处理器，不论最初的订单由哪个策略或组件发出。

### 示例

```python
from nautilus_trader.common.actor import Actor
from nautilus_trader.config import ActorConfig
from nautilus_trader.model import InstrumentId
from nautilus_trader.model.events import OrderFilled


class MyActorConfig(ActorConfig):
    instrument_id: InstrumentId  # example value: "ETHUSDT-PERP.BINANCE"


class FillMonitorActor(Actor):
    def __init__(self, config: MyActorConfig) -> None:
        super().__init__(config)
        self.fill_count = 0
        self.total_volume = 0.0

    def on_start(self) -> None:
        # 订阅该合约的所有成交回报
        self.subscribe_order_fills(self.config.instrument_id)

    def on_order_filled(self, event: OrderFilled) -> None:
        # 处理成交回报事件
        self.fill_count += 1
        self.total_volume += float(event.last_qty)

        self.log.info(
            f"Fill received: {event.order_side} {event.last_qty} @ {event.last_px}, "
            f"Total fills: {self.fill_count}, Volume: {self.total_volume}"
        )

    def on_stop(self) -> None:
        # 取消订阅成交回报
        self.unsubscribe_order_fills(self.config.instrument_id)
```

:::note
成交回报订阅仅限消息总线（message bus），不通过数据引擎（data engine）。
只有 actor 处于运行（running）状态时，`on_order_filled()` 处理器才会接收事件。
:::
