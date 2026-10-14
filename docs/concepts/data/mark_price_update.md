# MarkPriceUpdate

`MarkPriceUpdate` 表示金融工具的标记价格。衍生品交易场所通常用标记价格计算保证金、检查强平并计算未实现盈亏。

## 字段 {#fields}

| 字段            | Rust 类型      | Python 类型    | 必填/默认值 | 说明                                    |
| --------------- | -------------- | -------------- | ---------------- | ---------------------------------------- |
| `instrument_id` | `InstrumentId` | `InstrumentId` | 必填         | 标记价格对应的金融工具。           |
| `value`         | `Price`        | `Price`        | 必填         | 当前标记价格。                      |
| `ts_event`      | `UnixNanos`    | `int`          | 必填         | 事件时间戳（纳秒）。          |
| `ts_init`       | `UnixNanos`    | `int`          | 必填         | 初始化时间戳（纳秒）。 |

## 行为 {#behavior}

- 收到标记价格后按金融工具缓存。
- 回测可喂入标记价格，使保证金与盈亏行为对齐那些将参考价与成交分开发布的交易场所。
- 数据目录存储标记价格时附带工具 ID 与价格精度元数据。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::MarkPriceUpdate,
    identifiers::InstrumentId,
    types::Price,
};

let mark = MarkPriceUpdate::new(
    InstrumentId::from("BTCUSDT-PERP.BINANCE"),
    Price::from("65000.10"),
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import MarkPriceUpdate
from nautilus_trader.model import Price

mark = MarkPriceUpdate(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    value=Price.from_str("65000.10"),
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [IndexPriceUpdate](./index_price_update.md) 介绍指数参考价。
- [FundingRateUpdate](./funding_rate_update.md) 介绍永续资金费元数据。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
