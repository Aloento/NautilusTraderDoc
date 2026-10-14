# IndexPriceUpdate

`IndexPriceUpdate` 表示衍生品市场使用的外部指数价格。交易场所常用指数价格计算标记价格、资金费或结算价值。

## 字段 {#fields}

| 字段            | Rust 类型      | Python 类型    | 必填/默认值 | 说明                                    |
| --------------- | -------------- | -------------- | ---------------- | ---------------------------------------- |
| `instrument_id` | `InstrumentId` | `InstrumentId` | 必填         | 指数价格对应的金融工具。          |
| `value`         | `Price`        | `Price`        | 必填         | 当前指数价格。                     |
| `ts_event`      | `UnixNanos`    | `int`          | 必填         | 事件时间戳（纳秒）。          |
| `ts_init`       | `UnixNanos`    | `int`          | 必填         | 初始化时间戳（纳秒）。 |

## 行为 {#behavior}

- 收到指数价格后按金融工具缓存。
- 指数价格是参考数据，不代表发生了成交。
- 永续和期货场所可能同时发布标记价格和指数价格。
- 数据目录存储指数价格时附带工具 ID 与价格精度元数据。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::IndexPriceUpdate,
    identifiers::InstrumentId,
    types::Price,
};

let index = IndexPriceUpdate::new(
    InstrumentId::from("BTCUSDT-PERP.BINANCE"),
    Price::from("64995.50"),
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import IndexPriceUpdate
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price

index = IndexPriceUpdate(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    value=Price.from_str("64995.50"),
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [MarkPriceUpdate](./mark_price_update.md) 介绍标记价格。
- [FundingRateUpdate](./funding_rate_update.md) 介绍永续资金费元数据。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
