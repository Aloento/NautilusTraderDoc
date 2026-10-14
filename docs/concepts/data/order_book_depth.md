# OrderBookDepth

`OrderBookDepth` 表示包含不定数量买卖档位的快照。当交易场所发布自包含的深度快照而非增量 delta 时，使用该类型。

## 字段 {#fields}

| 字段            | Rust 类型                   | Python 类型       | 必填/默认值 | 说明                                      |
| --------------- | --------------------------- | ----------------- | ---------------- | ------------------------------------------ |
| `instrument_id` | `InstrumentId`              | `InstrumentId`    | 必填         | 快照所表示的订单簿所属工具。      |
| `bids`          | `SmallVec<[BookOrder; 10]>` | `list[BookOrder]` | 必填         | 按簿内顺序排列的买盘档位。                  |
| `asks`          | `SmallVec<[BookOrder; 10]>` | `list[BookOrder]` | 必填         | 按簿内顺序排列的卖盘档位。                  |
| `bid_counts`    | `SmallVec<[u32; 10]>`       | `list[int]`       | 必填         | 每个买盘档位的订单笔数。        |
| `ask_counts`    | `SmallVec<[u32; 10]>`       | `list[int]`       | 必填         | 每个卖盘档位的订单笔数。        |
| `flags`         | `u8`                        | `int`             | 必填         | `RecordFlag` 位域，承载事件元数据。 |
| `sequence`      | `u64`                       | `int`             | 必填         | 交易场所序列号，无则为 0。  |
| `ts_event`      | `UnixNanos`                 | `int`             | 必填         | 事件时间戳（纳秒）。            |
| `ts_init`       | `UnixNanos`                 | `int`             | 必填         | 初始化时间戳（纳秒）。   |

## 行为 {#behavior}

- Rust 和 PyO3 Python 构造函数接受可变长度的买卖侧。每一侧要求每笔订单对应一个计数。买盘和卖盘长度可以不同。
- 空的一侧使用空序列。内联容量为 10，更大的快照按需分配内存。
- 该类型不能与增量式 `OrderBookDelta` 流互换使用。

**旧版兼容**：

- 原 `OrderBookDepth10` 类型名已移除。名为 `order_book_depth10` 的目录仍会被迁移，schema 元数据中记录了该类型的 Arrow 文件仍可转码。
- 旧版 C FFI 和定深度 SBE 编码要求每侧恰好 10 档。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::{BookOrder, OrderBookDepth},
    enums::OrderSide,
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let bids = vec![BookOrder::new(OrderSide::Buy, Price::from("2500.10"), Quantity::from("3.5"), 1)];
let asks = vec![BookOrder::new(OrderSide::Sell, Price::from("2500.20"), Quantity::from("2.0"), 2)];

let depth = OrderBookDepth::new(
    InstrumentId::from("ETHUSDT-PERP.BINANCE"),
    bids,
    asks,
    vec![1],
    vec![1],
    0,
    42,
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import BookOrder
from nautilus_trader.model import OrderBookDepth
from nautilus_trader.model import OrderSide

bids = [
    BookOrder(
        OrderSide.BUY,
        Price.from_str(f"{2500.10 - i * 0.10:.2f}"),
        Quantity.from_str("3.5"),
        i + 1,
    )
    for i in range(3)
]
asks = [
    BookOrder(
        OrderSide.SELL,
        Price.from_str(f"{2500.20 + i * 0.10:.2f}"),
        Quantity.from_str("2.0"),
        i + 11,
    )
    for i in range(2)
]

depth = OrderBookDepth(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    bids=bids,
    asks=asks,
    bid_counts=[1] * len(bids),
    ask_counts=[1] * len(asks),
    flags=0,
    sequence=42,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [QuoteTick](./quote_tick.md) 介绍由深度数据导出的盘口一档数据。
- [订单簿](./index.md#order-books) 讲解订单簿状态。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
