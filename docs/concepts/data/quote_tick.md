# QuoteTick

`QuoteTick` 表示某一金融工具的盘口一档买卖价：即特定事件时刻的最优可用价格与数量。

## 字段 {#fields}

| 字段            | Rust 类型      | Python 类型    | 必填/默认值 | 说明                                    |
| --------------- | -------------- | -------------- | ---------------- | ---------------------------------------- |
| `instrument_id` | `InstrumentId` | `InstrumentId` | 必填         | 报价对应的金融工具。                |
| `bid_price`     | `Price`        | `Price`        | 必填         | 最优买价。                          |
| `ask_price`     | `Price`        | `Price`        | 必填         | 最优卖价。                          |
| `bid_size`      | `Quantity`     | `Quantity`     | 必填         | 最优买价处的可成交量。      |
| `ask_size`      | `Quantity`     | `Quantity`     | 必填         | 最优卖价处的可成交量。      |
| `ts_event`      | `UnixNanos`    | `int`          | 必填         | 事件时间戳（纳秒）。          |
| `ts_init`       | `UnixNanos`    | `int`          | 必填         | 初始化时间戳（纳秒）。 |

## 行为 {#behavior}

- 买卖价格必须使用相同精度。
- 买卖数量必须使用相同精度。
- `extract_price(...)` 返回 `BID`、`ASK` 或 `MID` 价格，`extract_size(...)` 返回对应的数量。其他价格类型会报错。
- `MID` 结果多保留一位精度，上限为 `FIXED_PRECISION`。
- 报价 bar 可使用 `BID`、`ASK` 或 `MID` 价格类型。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::QuoteTick,
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let quote = QuoteTick::new(
    InstrumentId::from("AUD/USD.SIM"),
    Price::from("0.65000"),
    Price::from("0.65002"),
    Quantity::from("1000000"),
    Quantity::from("1200000"),
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import QuoteTick

quote = QuoteTick(
    instrument_id=InstrumentId.from_str("AUD/USD.SIM"),
    bid_price=Price.from_str("0.65000"),
    ask_price=Price.from_str("0.65002"),
    bid_size=Quantity.from_int(1_000_000),
    ask_size=Quantity.from_int(1_200_000),
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [OrderBookDepth](./order_book_depth.md) 介绍含顶部档位的可变深度快照。
- [Bar 与聚合](./index.md#bars-and-aggregation) 介绍报价到 bar 的聚合。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
