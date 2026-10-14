# InstrumentClose

`InstrumentClose` 表示某金融工具在某交易场所的收盘价事件，涵盖时段结束收盘和合约到期收盘。

## 字段 {#fields}

| 字段            | Rust 类型             | Python 类型           | 必填/默认值 | 说明                                    |
| --------------- | --------------------- | --------------------- | ---------------- | ---------------------------------------- |
| `instrument_id` | `InstrumentId`        | `InstrumentId`        | 必填         | 被收盘的金融工具。                 |
| `close_price`   | `Price`               | `Price`               | 必填         | 收盘价或结算价。             |
| `close_type`    | `InstrumentCloseType` | `InstrumentCloseType` | 必填         | `END_OF_SESSION` 或 `CONTRACT_EXPIRED`。  |
| `ts_event`      | `UnixNanos`           | `int`                 | 必填         | 事件时间戳（纳秒）。          |
| `ts_init`       | `UnixNanos`           | `int`                 | 必填         | 初始化时间戳（纳秒）。 |

## 行为 {#behavior}

- 时段结束收盘提供时段级别的收盘价。
- 合约到期收盘标记有到期日合约的到期事件。
- 收盘价是参考数据，不代表以该价格发生过成交。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::InstrumentClose,
    enums::InstrumentCloseType,
    identifiers::InstrumentId,
    types::Price,
};

let close = InstrumentClose::new(
    InstrumentId::from("ESM4.XCME"),
    Price::from("5325.25"),
    InstrumentCloseType::EndOfSession,
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentClose
from nautilus_trader.model import InstrumentCloseType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price

close = InstrumentClose(
    instrument_id=InstrumentId.from_str("ESM4.XCME"),
    close_price=Price.from_str("5325.25"),
    close_type=InstrumentCloseType.END_OF_SESSION,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [InstrumentStatus](./instrument_status.md) 介绍金融工具状态事件。
- [金融工具](./../instruments/index.md) 介绍工具定义。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
