# 订单簿 {#order-book}

NautilusTrader 的订单簿用 Rust 实现。`OrderBook` 维护某个金融工具的公开市场深度。
`OwnOrderBook` 单独跟踪你自己的订单，以便过滤视图能从公开流动性中扣除它们。

:::note
本指南中的簿操作使用 Rust 模型 API，订阅与处理器示例使用 Python 的策略和 actor API。
Python 把簿类型暴露为 `nautilus_trader.model.OrderBook` 和
`nautilus_trader.model.OwnOrderBook`。Python 接口见
[model API reference](https://nautilustrader.io/docs/python-api-latest/model/book.html)。
:::

## 簿类型 {#book-types}

无论回测还是实时交易，`OrderBook` 实例都按工具分别维护：

- `L3_MBO`：Level 3 逐单（market-by-order，MBO）数据。按订单 ID 跟踪每个价位上的每一笔订单。
  在簿的每一侧，一个订单 ID 恰好映射到一个价位。同一 ID 重复出现在不同价格，表示订单移动到了新价位。
  MBP 风格的输入使用由价格派生的 ID；订单 ID 为零同样表示身份缺失，
  只是最优报价（top-of-book）输入以订单方向作为其 ID。
- `L2_MBP`：Level 2 逐价（market-by-price，MBP）数据，按价位聚合订单
  （每个价格一个条目）。
- `L1_MBP`：Level 1 逐价（MBP）最优报价数据，即最优买卖价（BBO），只捕捉最优价格。

:::note
报价、成交和 bar 数据（`QuoteTick`、`TradeTick`、`Bar`）同样可以驱动
`L1_MBP` 簿。
:::

## 订阅簿数据 {#subscribing-to-book-data}

策略与 actor 通过以下方法订阅订单簿更新。订阅和处理器属于 Python 的策略/actor 层：

```python
from nautilus_trader.model import BookType
from nautilus_trader.model import OrderBook
from nautilus_trader.model import OrderBookDeltas
from nautilus_trader.model import OrderBookDepth


# Incremental book deltas
self.subscribe_book_deltas(instrument_id, BookType.L2_MBP)

# Depth snapshots (adapter default; venue limits apply)
self.subscribe_book_depth(instrument_id, BookType.L2_MBP, managed=False)

# Full book snapshots at a timed interval
self.subscribe_book_at_interval(instrument_id, BookType.L2_MBP, interval_ms=1000)
```

每种订阅类型把数据投递给对应的处理器：

```python
def on_book_deltas(self, deltas: OrderBookDeltas) -> None: ...


def on_book_depth(self, depth: OrderBookDepth) -> None: ...


def on_book(self, order_book: OrderBook) -> None: ...
```

### 托管簿与共享订阅 {#managed-books-and-shared-subscriptions}

数据引擎为每个工具维护一个缓存的 `OrderBook`。托管订阅决定其更新来源：
`OrderBookDeltas` 或 `OrderBookDepth`。增量订阅与定时订阅可以共享一个增量托管簿；
托管深度订阅不能与同一工具的托管增量或定时订阅共存，引擎会拒绝冲突请求。

若要在托管增量或定时簿之外收到深度回调，如上文所示在深度订阅上设置 `managed=False`。
这些回调不会更新缓存的簿。只做深度订阅时，用 `managed=True` 让深度快照维护缓存簿。

共享同一数据源的消费者必须在客户端、簿类型、深度和订阅参数上达成一致。`depth=None`
选择适配器默认值，它不会把某个显式深度当作通配符来匹配。当该数据源的所有消费者都是
非托管的，不同客户端可以使用不同配置。退订一个消费者时，只要其他消费者仍需要该数据源，
数据源就保持不变。

定时投递会订阅增量，并按定时器发布缓存的簿。`OrderBookDepth` 事件不会更新该增量托管簿，
回测中也不例外。

- **仅深度重放**：使用 `subscribe_book_depth` 和 `on_book_depth`。
- **定时投递**：提供 `OrderBookDeltas`，必要时在重放前把深度快照转换为带快照标记的增量。

数据源中断或恢复期间，定时器可能持续发布最后一次缓存的簿。

## 访问订单簿 {#accessing-the-book}

`OrderBook` 提供最优报价访问器：

```rust
let best_bid: Option<Price> = book.best_bid_price();
let best_ask: Option<Price> = book.best_ask_price();
let spread: Option<f64> = book.spread();
let midpoint: Option<f64> = book.midpoint();
```

## 分析方法 {#analysis-methods}

`OrderBook` 支持市场深度分析与成交模拟：

```rust
// Average fill price for a given quantity
let avg_fill_px = book.get_avg_px_for_quantity(quantity, OrderSide::Buy);

// Average price, filled quantity, and worst price for a target exposure
let (avg_px, filled_qty, worst_px) =
    book.get_avg_px_qty_for_exposure(target_exposure, OrderSide::Buy);

// Cumulative quantity available at or better than a price
let qty = book.get_quantity_for_price(price, OrderSide::Buy);

// Quantity at a specific price level only
let qty = book.get_quantity_at_level(price, OrderSide::Buy, 2);

// Simulate fills against the book
let fills: Vec<(Price, Quantity)> = book.simulate_fills(&order);

// All crossed levels regardless of order quantity
let levels = book.get_all_crossed_levels(OrderSide::Buy, price, 2);
```

## 完整性检查 {#integrity-checks}

调用 `book_check_integrity` 校验簿状态与其类型是否一致：

- **L1_MBP**：每侧不超过一个价位。
- **L2_MBP**：每个价位不超过一笔订单。
- **L3_MBO**：没有额外的每价位约束，多笔订单可共享同一价格。
- **所有类型**：最优买价不得高于最优卖价（交叉簿）。锁市（bid == ask）视为有效。

这是一次**显式检查**：应用增量不会触发它。Rust 的 `apply_delta` 和
`apply_deltas` 方法会各自校验传入的工具 ID 是否与簿匹配，不匹配时返回
`BookIntegrityError::InstrumentMismatch`。

对于非零订单 ID，方向为 `None` 的增量会先尝试从 ladder 缓存解析方向。若无缓存方向，
`Add` 返回 `BookIntegrityError::NoOrderSide`，而 `Update` 或 `Delete` 被跳过。
若该 ID 同时存在于两侧，`Add` 返回
`BookIntegrityError::AmbiguousOrderSide`，`Update` 或 `Delete` 则跳过并记录警告。

乱序的增量和深度快照会被**应用而非拒绝**，因此重放或重排事件的交易场所仍能到达
这些事件所描述的状态。只有簿的元数据受到保护：`ts_last` 不会回退；
`sequence` 除了下述完全清空的情形外也不会回退。

过期更新中每个回退的字段各记录一条警告，`sequence` 与 `ts_event` 相互独立。
警告频率取决于更新的到达方式：

- **增量 delta**：每个过期 delta 一次。
- **快照 delta**：每个快照一次，无论是 `F_SNAPSHOT` 批次还是单个
  `F_SNAPSHOT` delta。重建中的每个 delta 共享快照的 sequence 与时间戳。
- **深度快照**：一次，因为 `OrderBookDepth` 在单次更新中整体替换簿。

有些场所数据源在清空簿时会重置其 sequence 计数器：

- **不带 `F_SNAPSHOT` 的完全清空**：先对照旧的 sequence 高水位检查这次清空，随后它的
  sequence 成为新高水位。后续 delta 从该值起比较，而不是从清空前收到的值。
  公开的 `clear()` 方法采用此行为。
- **带快照标记的清空**：保留当前高水位。
- **单侧清空**：`clear_bids()` 和 `clear_asks()` 保留当前高水位。

快照报告描述的是传入的快照，因此不取决于它的每个 delta 是否到达了簿。
由报价或成交驱动的 `L1_MBP` 簿是上述一切的例外：过期的 `QuoteTick` 或
`TradeTick` 会被跳过并记录警告，簿保持不变。

## 格式化打印 {#pretty-printing}

`OrderBook` 和 `OwnOrderBook` 都提供 `pprint` 方法，以可读表格形式返回簿内容：

```rust
println!("{}", book.pprint(5, None));
println!("{}", book.pprint(5, Some(Decimal::new(1, 2)))); // group_size = 0.01
```

对 tick size 很细的工具，`group_size` 参数把价位分桶为更粗的组。
输出是格式化表格：左侧买盘，中间价格，右侧卖盘。

## 自有订单簿 {#own-order-book}

`OwnOrderBook` 把你自己挂着的订单与公开簿分开跟踪。做市及其他报价策略用它估算
扣除自身订单后每个价位的可用流动性。

启用 `manage_own_order_books` 后，执行引擎会维护自有簿。订单事件改变状态时，
缓存随之更新已有的自有簿。符合条件的订单须有价格、不使用 `IOC` 或 `FOK`
有效期，且未被订单模拟器挂起。

- **模拟订单**：从不在公开簿中挂出，只有释放时才加入。
- **按报价数量的订单**：待其数量被更新为基础单位后才加入。
- **终态事件**：即便该订单原本不符合跟踪条件，也仍可能清理已有的自有簿条目。

### 订单生命周期 {#order-lifecycle}

`OwnOrderBook` 在订单生命周期内跟踪订单：

- **加入**：订单在提交时加入，或由对账物化而来。发往外部执行客户端的订单在首个
  订单事件时加入。
- **更新**：`OrderStatus::Accepted`、`OrderStatus::PendingUpdate`、
  `OrderStatus::PendingCancel`、`OrderStatus::PartiallyFilled` 等非终态会更新条目。
- **移除**：`OrderStatus::Denied`、`OrderStatus::Rejected`、`OrderStatus::Canceled`、
  `OrderStatus::Expired`、`OrderStatus::Filled`、`OrderStatus::Voided` 等关闭态会移除条目。

每个 `OwnBookOrder` 携带：

- `trader_id`：拥有该订单的 Trader ID。
- `client_order_id`：用于对账自有簿与缓存状态的客户端订单 ID。
- `venue_order_id`：已分配时的交易场所订单 ID。
- `side`、`price`、`size`：订单方向、价格与剩余（leaves）数量。
- `order_type` 和 `time_in_force`：保留供查看的订单元数据。
- `status`：当前订单状态，如 `SUBMITTED`、`ACCEPTED` 或 `PENDING_CANCEL`。
- `ts_last`：应用于该自有簿订单的最新订单事件时间戳。
- `ts_accepted`：场所接受订单的时间戳，接受前为零。
- `ts_submitted`：订单提交的时间戳，提交前为零。
- `ts_init`：订单初始化的时间戳。

`status` 与 `ts_accepted` 字段驱动
[状态与时间过滤](#status-and-time-filtering)中描述的可选过滤。

### 审计 {#auditing}

`audit_open_orders` 方法把自有簿与一组有效客户端订单 ID 对账。不在这组 ID 中的
自有簿订单会被移除并记录警告。`Cache::audit_own_order_books` 从开仓、在途和
活动本地订单构建这组 ID，使非终态条目在正常的事件处理与场所延迟窗口内得以保留。
实时系统可以通过自有簿审计间隔周期运行此审计。

### 查询 {#querying}

```rust
// Check if a specific order is tracked
let in_book = own_book.is_order_in_book(&client_order_id);

// Get all tracked order IDs per side
let bid_ids = own_book.bid_client_order_ids();
let ask_ids = own_book.ask_client_order_ids();

// Aggregated quantities per price level
let bid_qty = own_book.bid_quantity(None, None, None, None, None);
let ask_qty = own_book.ask_quantity(None, None, None, None, None);

// Pretty print
println!("{}", own_book.pprint(5, None));
```

### 过滤视图 {#filtered-views}

从公开簿中扣除你自己的订单，得到净可用流动性：

```rust
// Filtered maps of price -> quantity (own orders subtracted)
let net_bids = book.bids_filtered_as_map(Some(10), Some(&own_book), None, None, None);
let net_asks = book.asks_filtered_as_map(Some(10), Some(&own_book), None, None, None);

// Full filtered OrderBook with all analysis methods available
let filtered = book.filtered_view(Some(&own_book), Some(10), None, None, None);
let avg_px = filtered.get_avg_px_for_quantity(quantity, OrderSide::Buy);
```

`filtered_view` 返回扣除了自身数量的新 `OrderBook`。净簿支持完整的分析方法集合
（`spread`、`midpoint`、`get_avg_px_for_quantity` 等）。

### 状态与时间过滤 {#status-and-time-filtering}

过滤视图对自有订单支持可选的状态与时间过滤：

```rust
let statuses = AHashSet::from([OrderStatus::Accepted]);

// Only subtract ACCEPTED orders (ignore SUBMITTED, PENDING_CANCEL, etc.)
let filtered = book.filtered_view(Some(&own_book), None, Some(&statuses), None, None);
```

`accepted_buffer_ns` 参数提供宽限期。设置了 `ts_now` 时，视图只在
`ts_accepted + accepted_buffer_ns <= ts_now` 时才纳入某个自有订单，
从而排除可能尚未出现在公开簿数据流中的刚被接受的订单。

时间检查与订单状态无关，因此要与状态过滤配合使用，以排除未接受的订单。
省略 `ts_now` 会关闭接受时间过滤，而正的 `accepted_buffer_ns` 要求提供 `ts_now`。

```rust
// Only subtract orders accepted at least 500ms ago
let filtered = book.filtered_view(
    Some(&own_book),
    None,
    None,
    Some(500_000_000),
    Some(clock.timestamp_ns().as_u64()),
);
```

## 二元市场 {#binary-markets}

二元市场可能提供互补的结果工具，例如 Polymarket 的 YES 和 NO 代币。
对已知的互补配对，平价变换把一侧结果上的价格 `p` 映射为另一侧的 `1 - p`。
按此变换，NO 上 0.40 的买价等价于 YES 上 0.60 的卖价。

`OwnOrderBook::combined_with_opposite` 方法负责这一变换，
把两个结果工具的订单合并进第一个簿的视图：

```rust
let yes_own = own_yes_book
    .cloned()
    .unwrap_or_else(|| OwnOrderBook::new(yes_instrument_id));

let no_own = own_no_book
    .cloned()
    .unwrap_or_else(|| OwnOrderBook::new(no_instrument_id));

// Merge NO orders with the parity price transform (1 - price)
let combined = yes_own.combined_with_opposite(&no_own).unwrap();

// Filter the public YES book using the combined own book
let filtered = book.filtered_view(Some(&combined), None, None, None, None);
```

变换规则如下：

- NO 上价格 `p` 的卖单，在合并簿中变为价格 `1 - p` 的买单。
- NO 上价格 `p` 的买单，在合并簿中变为价格 `1 - p` 的卖单。

:::warning
该方法会拒绝相同的工具 ID，但无法验证两个工具确实互补。调用方必须提供真正的
反向工具。得到的自有簿可用你在任一结果工具上的订单，去过滤公开的 YES 簿。
:::
