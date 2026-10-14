# FundingRateUpdate

`FundingRateUpdate` 表示永续 swap 金融工具的资金费率。若交易场所公开了资金费周期与下次结算时间戳，也会一并包含。

## 字段 {#fields}

| 字段              | Rust 类型           | Python 类型    | 必填/默认值 | 说明                                    |
| ----------------- | ------------------- | -------------- | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`      | `InstrumentId` | 必填         | 该费率对应的永续工具。       |
| `rate`            | `Decimal`           | `Decimal`      | 必填         | 当前资金费率。                    |
| `interval`        | `Option<u16>`       | `int \| None`  | `None`           | 资金费周期（分钟）。             |
| `next_funding_ns` | `Option<UnixNanos>` | `int \| None`  | `None`           | 下次资金费结算时间戳（纳秒）。   |
| `ts_event`        | `UnixNanos`         | `int`          | 必填         | 事件时间戳（纳秒）。          |
| `ts_init`         | `UnixNanos`         | `int`          | 必填         | 初始化时间戳（纳秒）。 |

## 行为 {#behavior}

- 收到资金费率后按金融工具缓存。
- 相等性与哈希使用工具 ID、费率、周期和下次结算时间。
- 资金费率是参考数据，不代表已发生资金费收付。
- 仅当交易场所公开 `interval` 和 `next_funding_ns` 时才使用这两个字段。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{data::FundingRateUpdate, identifiers::InstrumentId};
use rust_decimal::Decimal;

let funding = FundingRateUpdate::new(
    InstrumentId::from("BTCUSDT-PERP.BINANCE"),
    Decimal::new(1, 4),
    Some(480),
    Some(UnixNanos::from(1_000_008_000)),
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from decimal import Decimal

from nautilus_trader.model import FundingRateUpdate
from nautilus_trader.model import InstrumentId

funding = FundingRateUpdate(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    rate=Decimal("0.0001"),
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
    interval=480,
    next_funding_ns=1_000_008_000,
)
```

## 相关指南 {#related-guides}

- [MarkPriceUpdate](./mark_price_update.md) 介绍衍生品的标记价格。
- [IndexPriceUpdate](./index_price_update.md) 介绍指数参考价。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
