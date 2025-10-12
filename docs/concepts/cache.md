# Cache

`Cache` 是一个中央的内存数据库，自动存储并管理所有与交易相关的数据。
可以把它看作交易系统的“记忆”：从市场数据到订单历史，再到自定义计算结果，都会被存放在这里。

Cache 的主要用途包括：

1. **存储市场数据**：

   - 保存最近的市场历史（例如：order books、quotes、trades、bars）。
   - 为策略提供当前及历史市场数据的访问能力。

2. **跟踪交易数据**：

   - 维护完整的 `Order` 历史以及当前执行状态。
   - 跟踪所有 `Position` 和 `Account` 信息。
   - 存储 `Instrument` 定义和 `Currency` 信息。

3. **保存自定义数据**：
   - 任意用户自定义对象或数据都可以存入 `Cache` 以备后用。
   - 便于不同策略之间共享数据。

## 缓存是如何工作的

**内置数据类型**：

- 数据在流经系统时会被自动添加到 `Cache` 中。
- 在实时（live）场景下，更新是异步发生的——这意味着事件发生与其出现在 `Cache` 中之间可能存在短暂延迟。
- 所有数据在到达策略回调之前都会先经过 `Cache`——见下图：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌───────────────────────┐
│                 │     │                 │     │                 │     │                       │
│                 │     │                 │     │                 │     │   Strategy callback:  │
│      Data       ├─────►   DataEngine    ├─────►     Cache       ├─────►                       │
│                 │     │                 │     │                 │     │   on_data(...)        │
│                 │     │                 │     │                 │     │                       │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └───────────────────────┘
```

### 基本示例

在策略内部，你可以通过 `self.cache` 访问 `Cache`。下面是一个常见示例：

:::note
在本文中出现的 `self` 通常指代 `Strategy` 实例本身。
:::

```python
def on_bar(self, bar: Bar) -> None:
    # 当前 bar 由参数 'bar' 提供

    # 从 Cache 获取历史 bars
    last_bar = self.cache.bar(self.bar_type, index=0)        # 最近一根 bar（与参数 'bar' 基本相同）
    previous_bar = self.cache.bar(self.bar_type, index=1)    # 前一根 bar
    third_last_bar = self.cache.bar(self.bar_type, index=2)  # 倒数第三根 bar

    # 获取当前持仓信息
    if self.last_position_opened_id is not None:
        position = self.cache.position(self.last_position_opened_id)
        if position.is_open:
            # 检查持仓详情
            current_pnl = position.unrealized_pnl

    # 获取该标的的所有未平订单
    open_orders = self.cache.orders_open(instrument_id=self.instrument_id)
```

## 配置

`Cache` 的行为与容量可通过 `CacheConfig` 类进行配置。
你可以在 `BacktestEngine` 或 `TradingNode` 上提供该配置，具体取决于你的运行环境（参见架构文档中的 environment contexts）。

下面是一个配置 `Cache` 的基本示例：

```python
from nautilus_trader.config import CacheConfig, BacktestEngineConfig, TradingNodeConfig

# 回测场景
engine_config = BacktestEngineConfig(
    cache=CacheConfig(
        tick_capacity=10_000,  # 每个合约保留最近 10,000 条 tick
        bar_capacity=5_000,    # 每种 bar 类型保留最近 5,000 根 bar
    ),
)

# 实盘场景
node_config = TradingNodeConfig(
    cache=CacheConfig(
        tick_capacity=10_000,
        bar_capacity=5_000,
    ),
)
```

:::tip
默认情况下，`Cache` 为每种 bar 类型保留最近 10,000 根 bar，并为每个合约保留 10,000 条 trade tick。
这些默认值在内存占用与数据可用性之间提供了较好的平衡；如果你的策略需要更多历史数据，可以适当增大。
:::

### 配置选项

`CacheConfig` 支持下列参数：

```python
from nautilus_trader.config import CacheConfig

cache_config = CacheConfig(
    database: DatabaseConfig | None = None,  # 持久化使用的数据库配置
    encoding: str = "msgpack",               # 数据编码格式（'msgpack' 或 'json'）
    timestamps_as_iso8601: bool = False,     # 是否以 ISO8601 字符串存储时间戳
    buffer_interval_ms: int | None = None,   # 批量写入的缓冲时间（毫秒）
    use_trader_prefix: bool = True,          # 在 key 中使用 trader 前缀
    use_instance_id: bool = False,           # 在 key 中包含实例 ID
    flush_on_start: bool = False,            # 启动时是否清空数据库
    drop_instruments_on_reset: bool = True,  # reset 时是否清除 instrument
    tick_capacity: int = 10_000,             # 每个合约最大保存的 ticks 数量
    bar_capacity: int = 10_000,              # 每种 bar type 最大保存的 bars 数量
)
```

:::note
每种 bar 类型维护独立的容量限制。例如同时使用 1 分钟和 5 分钟 bar 时，两者各自最多保存 `bar_capacity` 根 bar。
当达到 `bar_capacity` 时，最旧的数据会被自动移除。
:::

### 数据库配置

若需在系统重启间保持数据持久化，可配置后端数据库。

何时适合使用持久化？

- **长时间运行的系统**：如果希望在重启、升级或意外故障后继续从上次状态恢复，持久化配置能帮你做到这一点。
- **历史分析**：需要保存完整历史数据以便事后分析或审计时很有用。
- **多节点或分布式部署**：当多个服务或节点需要共享同一状态时，持久化存储能保证一致性。

```python
from nautilus_trader.config import DatabaseConfig

config = CacheConfig(
    database=DatabaseConfig(
        type="redis",      # 数据库类型
        host="localhost",  # 数据库主机
        port=6379,         # 数据库端口
        timeout=2,         # 连接超时（秒）
    ),
)
```

## 使用 Cache

### 访问市场数据

`Cache` 提供了全面的接口来访问不同类型的市场数据，包括 order books、quotes、trades、bars。
缓存中的所有市场数据均采用倒序索引——即最新的数据位于 index 0。

#### Bar(s) 访问

```python
# 获取指定 bar type 的所有缓存 bars
bars = self.cache.bars(bar_type)  # 返回 List[Bar] 或在无数据时返回空列表

# 获取最新一根 bar
latest_bar = self.cache.bar(bar_type)  # 返回 Bar 或在不存在时返回 None

# 按索引获取历史某根 bar（0 = 最新）
second_last_bar = self.cache.bar(bar_type, index=1)  # 返回 Bar 或在不存在时返回 None

# 检查 bars 是否存在并获取计数
bar_count = self.cache.bar_count(bar_type)  # 返回缓存中该 bar type 的 bars 数量
has_bars = self.cache.has_bars(bar_type)    # 返回 bool，表示是否存在任何 bars
```

#### Quote ticks

```python
# 获取 quotes
quotes = self.cache.quote_ticks(instrument_id)                     # 返回 List[QuoteTick] 或在无数据时返回空列表
latest_quote = self.cache.quote_tick(instrument_id)                # 返回 QuoteTick 或在不存在时返回 None
second_last_quote = self.cache.quote_tick(instrument_id, index=1)  # 返回 QuoteTick 或在不存在时返回 None

# 检查 quote 可用性
quote_count = self.cache.quote_tick_count(instrument_id)  # 返回该合约在缓存中的 quote 数量
has_quotes = self.cache.has_quote_ticks(instrument_id)    # 返回 bool，表示是否存在任何 quotes
```

#### Trade ticks

```python
# 获取 trades
trades = self.cache.trade_ticks(instrument_id)         # 返回 List[TradeTick] 或在无数据时返回空列表
latest_trade = self.cache.trade_tick(instrument_id)    # 返回 TradeTick 或在不存在时返回 None
second_last_trade = self.cache.trade_tick(instrument_id, index=1)  # 返回 TradeTick 或在不存在时返回 None

# 检查 trade 可用性
trade_count = self.cache.trade_tick_count(instrument_id)  # 返回该合约在缓存中的 trade 数量
has_trades = self.cache.has_trade_ticks(instrument_id)    # 返回 bool，表示是否存在任何 trades
```

#### Order Book

```python
# 获取当前 order book
book = self.cache.order_book(instrument_id)  # 返回 OrderBook 或在不存在时返回 None

# 检查 order book 是否存在
has_book = self.cache.has_order_book(instrument_id)  # 返回 bool，表示是否存在 order book

# 获取 order book 更新次数
update_count = self.cache.book_update_count(instrument_id)  # 返回收到的更新次数
```

#### 价格访问

```python
from nautilus_trader.core.rust.model import PriceType

# 按价格类型获取当前价格；返回 Price 或 None。
price = self.cache.price(
    instrument_id=instrument_id,
    price_type=PriceType.MID,  # 可选：BID, ASK, MID, LAST
)
```

#### Bar types

```python
from nautilus_trader.core.rust.model import PriceType, AggregationSource

# 获取某合约的所有可用 bar types；返回 List[BarType]
bar_types = self.cache.bar_types(
    instrument_id=instrument_id,
    price_type=PriceType.LAST,  # 可选：BID, ASK, MID, LAST
    aggregation_source=AggregationSource.EXTERNAL,
)
```

#### 简单示例

```python
class MarketDataStrategy(Strategy):
    def on_start(self):
        # 订阅 1 分钟 bars
        self.bar_type = BarType.from_str(f"{self.instrument_id}-1-MINUTE-LAST-EXTERNAL")  # 举例：instrument_id = "EUR/USD.FXCM"
        self.subscribe_bars(self.bar_type)

    def on_bar(self, bar: Bar) -> None:
        bars = self.cache.bars(self.bar_type)[:3]
        if len(bars) < 3:   # 等待至少 3 根 bar
            return

        # 访问最近 3 根 bar 进行分析
        current_bar = bars[0]    # 最新的一根
        prev_bar = bars[1]       # 倒数第二根
        prev_prev_bar = bars[2]  # 倒数第三根

        # 获取最新 quote 和 trade
        latest_quote = self.cache.quote_tick(self.instrument_id)
        latest_trade = self.cache.trade_tick(self.instrument_id)

        if latest_quote is not None:
            current_spread = latest_quote.ask_price - latest_quote.bid_price
            self.log.info(f"Current spread: {current_spread}")
```

### 交易对象

`Cache` 提供对系统内所有交易对象的全面访问，包括：

- Orders
- Positions
- Accounts
- Instruments

#### Orders

可以通过多种方法访问和查询订单，并支持按 venue、strategy、instrument、order side 等灵活过滤。

##### 基本订单访问

```python
# 通过 client order ID 获取指定订单
order = self.cache.order(ClientOrderId("O-123"))

# 获取系统内所有订单
orders = self.cache.orders()

# 按条件过滤订单
orders_for_venue = self.cache.orders(venue=venue)                       # 某个 venue 的所有订单
orders_for_strategy = self.cache.orders(strategy_id=strategy_id)        # 某个 strategy 的所有订单
orders_for_instrument = self.cache.orders(instrument_id=instrument_id)  # 某个合约的所有订单
```

##### 订单状态查询

```python
# 按当前状态获取订单
open_orders = self.cache.orders_open()          # 目前在交易所仍然有效的订单
closed_orders = self.cache.orders_closed()      # 已完成生命周期的订单
emulated_orders = self.cache.orders_emulated()  # 系统本地模拟的订单
inflight_orders = self.cache.orders_inflight()  # 已提交（或修改）但尚未确认的订单

# 检查特定订单状态
exists = self.cache.order_exists(client_order_id)            # 检查是否存在给定 ID 的订单
is_open = self.cache.is_order_open(client_order_id)          # 检查订单是否处于打开状态
is_closed = self.cache.is_order_closed(client_order_id)      # 检查订单是否已关闭
is_emulated = self.cache.is_order_emulated(client_order_id)  # 检查订单是否为本地模拟
is_inflight = self.cache.is_order_inflight(client_order_id)  # 检查订单是否已提交但未确认
```

##### 订单统计

```python
# 获取不同状态订单的计数
open_count = self.cache.orders_open_count()          # 当前打开订单数量
closed_count = self.cache.orders_closed_count()      # 已关闭订单数量
emulated_count = self.cache.orders_emulated_count()  # 模拟订单数量
inflight_count = self.cache.orders_inflight_count()  # 在途订单数量
total_count = self.cache.orders_total_count()        # 系统内订单总数

# 获取按条件过滤的订单计数
buy_orders_count = self.cache.orders_open_count(side=OrderSide.BUY)  # 当前打开的 BUY 订单数量
venue_orders_count = self.cache.orders_total_count(venue=venue)      # 特定 venue 的订单总数
```

#### Positions

`Cache` 维护所有持仓的记录，并提供多种查询方式。

##### 持仓访问

```python
# 按 ID 获取指定持仓
position = self.cache.position(PositionId("P-123"))

# 按状态获取持仓
all_positions = self.cache.positions()            # 系统内的所有持仓
open_positions = self.cache.positions_open()      # 当前打开的持仓
closed_positions = self.cache.positions_closed()  # 已平仓的持仓

# 按条件过滤持仓
venue_positions = self.cache.positions(venue=venue)                       # 某个 venue 的持仓
instrument_positions = self.cache.positions(instrument_id=instrument_id)  # 某个合约的持仓
strategy_positions = self.cache.positions(strategy_id=strategy_id)        # 某个 strategy 的持仓
long_positions = self.cache.positions(side=PositionSide.LONG)             # 所有多头持仓
```

##### 持仓状态查询

```python
# 检查持仓状态
exists = self.cache.position_exists(position_id)        # 检查是否存在给定 ID 的持仓
is_open = self.cache.is_position_open(position_id)      # 检查持仓是否为打开状态
is_closed = self.cache.is_position_closed(position_id)  # 检查持仓是否已关闭

# 获取持仓与订单的关联
orders = self.cache.orders_for_position(position_id)       # 与某个持仓关联的所有订单
position = self.cache.position_for_order(client_order_id)  # 查找与某个订单相关的持仓
```

##### 持仓统计

```python
# 获取不同状态持仓的计数
open_count = self.cache.positions_open_count()      # 当前打开持仓数量
closed_count = self.cache.positions_closed_count()  # 已关闭持仓数量
total_count = self.cache.positions_total_count()    # 系统内持仓总数

# 获取按条件过滤的持仓计数
long_positions_count = self.cache.positions_open_count(side=PositionSide.LONG)              # 打开的多头持仓数量
instrument_positions_count = self.cache.positions_total_count(instrument_id=instrument_id)  # 某个合约的持仓数量
```

#### Accounts

```python
# 访问账户信息
account = self.cache.account(account_id)       # 按 ID 获取账户
account = self.cache.account_for_venue(venue)  # 获取特定 venue 对应的账户
account_id = self.cache.account_id(venue)      # 获取某个 venue 的账户 ID
accounts = self.cache.accounts()               # 获取缓存中的所有账户
```

#### Instruments 和 Currencies

##### Instruments

```python
# 获取合约信息
instrument = self.cache.instrument(instrument_id) # 按 ID 获取指定合约
all_instruments = self.cache.instruments()        # 获取缓存中所有合约

# 按条件过滤合约
venue_instruments = self.cache.instruments(venue=venue)              # 某个 venue 的合约
instruments_by_underlying = self.cache.instruments(underlying="ES")  # 按 underlying 过滤合约

# 获取合约标识列表
instrument_ids = self.cache.instrument_ids()                   # 获取所有合约 ID
venue_instrument_ids = self.cache.instrument_ids(venue=venue)  # 获取特定 venue 的合约 ID 列表
```

##### Currencies

```python
# 获取货币信息
currency = self.cache.load_currency("USD")  # 加载 USD 的货币信息
```

---

### 自定义数据

除了内置的市场数据和交易对象外，`Cache` 还能存储和检索自定义数据类型。
你可以把任意需要在系统各组件之间共享的数据存入 Cache（通常在 Actors / Strategies 之间共享）。

#### 基本存取

```python
# 在 Strategy 方法内调用（此处的 `self` 指 Strategy）

# 存储数据
self.cache.add(key="my_key", value=b"some binary data")

# 检索数据
stored_data = self.cache.get("my_key")  # 返回 bytes 或 None
```

对于更复杂的使用场景，`Cache` 还支持存储继承自 `nautilus_trader.core.Data` 基类的自定义数据对象。

:::warning
`Cache` 并非为替代完整数据库而设计。对于海量数据或复杂查询需求，建议使用专业的数据库系统。
:::

## 最佳实践与常见问题

### Cache 与 Portfolio 的区别与用途

`Cache` 与 `Portfolio` 在 NautilusTrader 中扮演不同但互补的角色：

**Cache**：

- 保存系统的历史记录与当前状态。
- 本地状态变更（例如初始化提交订单）会立刻更新 Cache。
- 外部事件发生后（例如订单成交）会以异步方式更新 Cache。
- 提供完整的交易活动和市场数据历史。
- 策略接收到的所有数据（事件/更新）都会被存储在 Cache 中。

  **Portfolio**：

- 提供聚合后的持仓/敞口与账户信息。
- 主要反映当前状态，不保留历史。

  **示例**：

```python
class MyStrategy(Strategy):
    def on_position_changed(self, event: PositionEvent) -> None:
        # 当需要查看历史时使用 Cache
        position_history = self.cache.position_snapshots(event.position_id)

        # 当需要当前实时聚合状态时使用 Portfolio
        current_exposure = self.portfolio.net_exposure(event.instrument_id)
```

### Cache 与 Strategy 变量的选择

在 `Cache` 与策略内部变量之间如何选择，取决于你的具体需求：

**使用 Cache 存储**：

- 适用于需要在多个策略之间共享的数据。
- 适用于需要在系统重启后保留的数据。
- 作为所有组件可访问的中央存储。
- 适合在策略重置后仍需保留的状态。

  **使用策略变量**：

- 适用于仅用于策略内部计算的临时数据。
- 更适合短时值和中间结果。
- 访问更快、封装性更好。
- 适合仅供当前策略使用的数据。

  **示例**：

下例演示如何将数据存入 `Cache`，以便多个策略可以访问同一信息。

```python
import pickle

class MyStrategy(Strategy):
    def on_start(self):
        # 准备要与其它策略共享的数据
        shared_data = {
            "last_reset": self.clock.timestamp_ns(),
            "trading_enabled": True,
            # 包含其它你希望被其他策略读取的字段
        }

        # 使用描述性 key 将其存入 cache
        # 这样，多个策略就可以通过 self.cache.get("shared_strategy_info") 来读取相同的数据
        self.cache.add("shared_strategy_info", pickle.dumps(shared_data))

```

另一个并行运行的策略如何读取上面存入的缓存数据：

```python
import pickle

class AnotherStrategy(Strategy):
    def on_start(self):
        # 从相同 key 读取共享数据
        data_bytes = self.cache.get("shared_strategy_info")
        if data_bytes is not None:
            shared_data = pickle.loads(data_bytes)
            self.log.info(f"Shared data retrieved: {shared_data}")
```
