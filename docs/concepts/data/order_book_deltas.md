# OrderBookDeltas

`OrderBookDeltas` 把来自同一逻辑订单簿事件的多条 `OrderBookDelta` 记录（非空批次）归为一组。当适配器一次收到或产出多条变更时，可减少逐条消息的开销。

## 字段 {#fields}

| 字段            | Rust 类型             | Python 类型            | 必填/默认值 | 说明                                |
| --------------- | --------------------- | ---------------------- | ---------------- | ------------------------------------ |
| `instrument_id` | `InstrumentId`        | `InstrumentId`         | 必填         | 发生变更的订单簿所属工具。   |
| `deltas`        | `Vec<OrderBookDelta>` | `list[OrderBookDelta]` | 必填         | 非空的 delta 批次。           |
| `flags`         | `u8`                  | `int`                  | 取自最后一条 delta  | 最后一条 delta 的标志。                    |
| `sequence`      | `u64`                 | `int`                  | 取自最后一条 delta  | 最后一条 delta 的序列号。          |
| `ts_event`      | `UnixNanos`           | `int`                  | 取自最后一条 delta  | 最后一条 delta 的事件时间戳。          |
| `ts_init`       | `UnixNanos`           | `int`                  | 取自最后一条 delta  | 最后一条 delta 的初始化时间戳。 |

## 行为 {#behavior}

- 批次至少包含一条 delta。
- 每条 delta 的 `instrument_id` 必须与批次的 `instrument_id` 一致。
- 批次元数据镜像最后一条 delta。
- 最后一条 delta 若结束了某个逻辑事件组，应携带 `F_LAST`。参见
  [delta 标志与事件边界](./index.md#delta-flags-and-event-boundaries)。
- 快照批次通常以 `CLEAR` delta 开始，以 `F_SNAPSHOT | F_LAST` 结束。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::{BookOrder, OrderBookDelta, OrderBookDeltas},
    enums::{BookAction, OrderSide, RecordFlag},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let instrument_id = InstrumentId::from("ETHUSDT-PERP.BINANCE");
let bid = OrderBookDelta::new(
    instrument_id,
    BookAction::Add,
    BookOrder::new(OrderSide::Buy, Price::from("2500.10"), Quantity::from("3.5"), 1),
    0,
    41,
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
let ask = OrderBookDelta::new(
    instrument_id,
    BookAction::Add,
    BookOrder::new(OrderSide::Sell, Price::from("2500.20"), Quantity::from("2.0"), 2),
    RecordFlag::F_LAST as u8,
    42,
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);

let deltas = OrderBookDeltas::new(instrument_id, vec![bid, ask]);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import BookAction
from nautilus_trader.model import BookOrder
from nautilus_trader.model import OrderBookDelta
from nautilus_trader.model import OrderBookDeltas
from nautilus_trader.model import OrderSide
from nautilus_trader.model import RecordFlag

instrument_id = InstrumentId.from_str("ETHUSDT-PERP.BINANCE")
bid = OrderBookDelta(
    instrument_id=instrument_id,
    action=BookAction.ADD,
    order=BookOrder(
        OrderSide.BUY,
        Price.from_str("2500.10"),
        Quantity.from_str("3.5"),
        1,
    ),
    flags=0,
    sequence=41,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
ask = OrderBookDelta(
    instrument_id=instrument_id,
    action=BookAction.ADD,
    order=BookOrder(
        OrderSide.SELL,
        Price.from_str("2500.20"),
        Quantity.from_str("2.0"),
        2,
    ),
    flags=RecordFlag.F_LAST,
    sequence=42,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)

deltas = OrderBookDeltas(instrument_id, [bid, ask])
```

## 相关指南 {#related-guides}

- [OrderBookDelta](./order_book_delta.md) 介绍其包含的更新类型。
- [订单簿](./../order_book.md) 讲解支持的订单簿状态。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
