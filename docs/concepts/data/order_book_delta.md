# OrderBookDelta

`OrderBookDelta` 表示订单簿的一次变更，是内置的最细粒度订单簿数据类型，支持 NautilusTrader 用于增量更新的簿类型：

- `L3_MBO`：Level 3 逐笔委托（MBO）数据。
- `L2_MBP`：Level 2 按价聚合（MBP）数据。
- `L1_MBP`：Level 1 按价聚合（MBP）盘口一档数据。

具体某条 delta 携带哪种粒度，由来源数据流和目标 `BookType` 决定。

当交易场所或数据提供商发布增量簿变更、需要 NautilusTrader 在本地维护订单簿状态时，使用该类型。

## 字段 {#fields}

| 字段            | Rust 类型      | Python 类型    | 必填/默认值 | 说明                                      |
| --------------- | -------------- | -------------- | ---------------- | ------------------------------------------ |
| `instrument_id` | `InstrumentId` | `InstrumentId` | 必填         | 发生变更的订单簿所属工具。         |
| `action`        | `BookAction`   | `BookAction`   | 必填         | `ADD`、`UPDATE`、`DELETE` 或 `CLEAR`。     |
| `order`         | `BookOrder`    | `BookOrder`    | 必填         | 价格、数量、方向与订单 ID 的数据负载。   |
| `flags`         | `u8`           | `int`          | 必填         | `RecordFlag` 位域，承载事件元数据。 |
| `sequence`      | `u64`          | `int`          | 必填         | 交易场所序列号，无则为 0。  |
| `ts_event`      | `UnixNanos`    | `int`          | 必填         | 事件时间戳（纳秒）。            |
| `ts_init`       | `UnixNanos`    | `int`          | 必填         | 初始化时间戳（纳秒）。   |

## BookOrder 字段 {#bookorder-fields}

`order` 字段包含该 delta 的 `BookOrder` 负载。

| 字段       | Rust 类型           | Python 类型         | 说明                                |
| ---------- | ------------------- | ------------------- | ------------------------------------ |
| `side`     | `Option<OrderSide>` | `OrderSide \| None` | 订单方向。                          |
| `price`    | `Price`             | `Price`             | 订单价格。                         |
| `size`     | `Quantity`          | `Quantity`          | 订单数量。                          |
| `order_id` | `OrderId` (`u64`)   | `int`               | 来源数据流携带的订单 ID。 |

空/默认订单的 side 为 `None`，价格、数量和订单 ID 均为 0。

## BookAction 变体 {#bookaction-variants}

| Rust 变体            | Python 变体 | 值 | 含义                                   |
| -------------------- | -------------- | ----- | -------------------------------------- |
| `BookAction::Add`    | `ADD`          | `1`   | 向订单簿新增一笔订单。             |
| `BookAction::Update` | `UPDATE`       | `2`   | 更新订单簿中已有订单。 |
| `BookAction::Delete` | `DELETE`       | `3`   | 删除订单簿中已有订单。 |
| `BookAction::Clear`  | `CLEAR`        | `4`   | 清空订单簿状态。           |

## 行为 {#behavior}

- `ADD` 和 `UPDATE` delta 要求订单数量为正。
- `CLEAR` delta 重置订单簿状态，使用空订单（null book order）。
- `flags` 承载事件边界与快照元数据，参见
  [delta 标志与事件边界](./index.md#delta-flags-and-event-boundaries)。
- 构造 clear delta 时，Rust 用 `OrderBookDelta::clear(...)`，Python 用 `OrderBookDelta.clear(...)`。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::{BookOrder, OrderBookDelta},
    enums::{BookAction, OrderSide, RecordFlag},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let delta = OrderBookDelta::new(
    InstrumentId::from("ETHUSDT-PERP.BINANCE"),
    BookAction::Add,
    BookOrder::new(
        OrderSide::Buy,
        Price::from("2500.10"),
        Quantity::from("3.5"),
        12_345,
    ),
    RecordFlag::F_LAST as u8,
    42,
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import BookAction
from nautilus_trader.model import BookOrder
from nautilus_trader.model import OrderBookDelta
from nautilus_trader.model import OrderSide
from nautilus_trader.model import RecordFlag

delta = OrderBookDelta(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    action=BookAction.ADD,
    order=BookOrder(
        OrderSide.BUY,
        Price.from_str("2500.10"),
        Quantity.from_str("3.5"),
        12_345,
    ),
    flags=RecordFlag.F_LAST,
    sequence=42,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [OrderBookDeltas](./order_book_deltas.md) 介绍 delta 的批量处理。
- [订单簿](./../order_book.md) 讲解簿类型与本地订单簿状态。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
