# TradeTick

`TradeTick` 表示来自交易场所的一笔成交或撮合事件，携带成交价、成交量、主动方方向和交易场所的成交标识。

## 字段 {#fields}

| 字段             | Rust 类型       | Python 类型     | 必填/默认值 | 说明                                    |
| ---------------- | --------------- | --------------- | ---------------- | ---------------------------------------- |
| `instrument_id`  | `InstrumentId`  | `InstrumentId`  | 必填         | 成交对应的金融工具。                |
| `price`          | `Price`         | `Price`         | 必填         | 成交价格。                          |
| `size`           | `Quantity`      | `Quantity`      | 必填         | 成交数量。                       |
| `aggressor_side` | `AggressorSide` | `AggressorSide` | 必填         | `BUY`、`SELL` 或 `NO_AGGRESSOR`。        |
| `trade_id`       | `TradeId`       | `TradeId`       | 必填         | 交易场所分配的撮合 ID。                 |
| `ts_event`       | `UnixNanos`     | `int`           | 必填         | 事件时间戳（纳秒）。          |
| `ts_init`        | `UnixNanos`     | `int`           | 必填         | 初始化时间戳（纳秒）。 |

## 行为 {#behavior}

- `size` 必须为正。
- 信息驱动 bar 需要 `TradeTick` 数据，因为它们使用 `aggressor_side`。
- 成交 bar 使用 `LAST` 价格类型。
- 交易场所提供成交 ID 时，`trade_id` 对同一场所事件应保持固定。
- 解析和反序列化接受已废弃的 `BUYER`/`SELLER` 值；字符串输出始终是规范的 `BUY`/`SELL`。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::TradeTick,
    enums::AggressorSide,
    identifiers::{InstrumentId, TradeId},
    types::{Price, Quantity},
};

let trade = TradeTick::new(
    InstrumentId::from("BTCUSDT.BINANCE"),
    Price::from("65000.10"),
    Quantity::from("0.25"),
    AggressorSide::Buy,
    TradeId::from("123456789"),
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import TradeId
from nautilus_trader.model import TradeTick
from nautilus_trader.model import AggressorSide

trade = TradeTick(
    instrument_id=InstrumentId.from_str("BTCUSDT.BINANCE"),
    price=Price.from_str("65000.10"),
    size=Quantity.from_str("0.25"),
    aggressor_side=AggressorSide.BUY,
    trade_id=TradeId("123456789"),
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [Bar](./bar.md) 介绍成交到 bar 的聚合。
- [信息驱动 bar](./index.md#information-driven-bars) 讲解主动方方向的用法。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
