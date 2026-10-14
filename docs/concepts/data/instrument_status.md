# InstrumentStatus

`InstrumentStatus` 表示金融工具交易状态的变化，用于承载交易场所的状态事件，例如预开盘、开盘交易、停牌、暂停、收盘以及卖空限制变更。

## 字段 {#fields}

| 字段                       | Rust 类型            | Python 类型          | 必填/默认值 | 说明                                     |
| -------------------------- | -------------------- | -------------------- | ---------------- | ----------------------------------------- |
| `instrument_id`            | `InstrumentId`       | `InstrumentId`       | 必填         | 状态变化的金融工具。          |
| `action`                   | `MarketStatusAction` | `MarketStatusAction` | 必填         | 交易场所的状态动作。                      |
| `ts_event`                 | `UnixNanos`          | `int`                | 必填         | 事件时间戳（纳秒）。           |
| `ts_init`                  | `UnixNanos`          | `int`                | 必填         | 初始化时间戳（纳秒）。  |
| `reason`                   | `Option<Ustr>`       | `str \| None`        | `None`           | 状态变化原因（若交易场所有提供）。 |
| `trading_event`            | `Option<Ustr>`       | `str \| None`        | `None`           | 交易场所事件标签（若提供）。          |
| `is_trading`               | `Option<bool>`       | `bool \| None`       | `None`           | 是否允许交易（若已知）。    |
| `is_quoting`               | `Option<bool>`       | `bool \| None`       | `None`           | 是否允许报价（若已知）。    |
| `is_short_sell_restricted` | `Option<bool>`       | `bool \| None`       | `None`           | 卖空限制状态（若已知）。  |

## 行为 {#behavior}

- 可选布尔值让适配器原样保留交易场所提供的状态，不必猜测。
- `action` 给出归一化后的高层状态；交易场所特有的细节可另存于 `reason` 或 `trading_event`。
- 策略可通过 `on_instrument_status(...)` 处理状态更新。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::InstrumentStatus,
    enums::MarketStatusAction,
    identifiers::InstrumentId,
};
use ustr::Ustr;

let status = InstrumentStatus::new(
    InstrumentId::from("AAPL.XNAS"),
    MarketStatusAction::Trading,
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
    Some(Ustr::from("Normal trading")),
    Some(Ustr::from("MARKET_OPEN")),
    Some(true),
    Some(true),
    Some(false),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import InstrumentStatus
from nautilus_trader.model import MarketStatusAction

status = InstrumentStatus(
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
    action=MarketStatusAction.TRADING,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
    reason="Normal trading",
    trading_event="MARKET_OPEN",
    is_trading=True,
    is_quoting=True,
    is_short_sell_restricted=False,
)
```

## 相关指南 {#related-guides}

- [InstrumentClose](./instrument_close.md) 介绍金融工具收盘价事件。
- [金融工具](./../instruments/index.md) 介绍工具定义。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
