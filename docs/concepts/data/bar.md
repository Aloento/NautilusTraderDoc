# Bar

`Bar` 表示某个 `BarType` 的 OHLCV 价格与成交量数据。Bar 可由交易场所或数据提供商直接供给，也可由 NautilusTrader 从 quote tick、trade tick 或更小周期的 bar 聚合生成。

## 字段 {#fields}

| 字段       | Rust 类型   | Python 类型 | 必填/默认值 | 说明                                       |
| ---------- | ----------- | ----------- | ---------------- | ------------------------------------------------ |
| `bar_type` | `BarType`   | `BarType`   | 必填         | 金融工具、聚合方式、价格类型与来源。 |
| `open`     | `Price`     | `Price`     | 必填         | bar 区间内的第一个价格。                 |
| `high`     | `Price`     | `Price`     | 必填         | bar 区间内的最高价。               |
| `low`      | `Price`     | `Price`     | 必填         | bar 区间内的最低价。                |
| `close`    | `Price`     | `Price`     | 必填         | bar 区间内的最后一个价格。                  |
| `volume`   | `Quantity`  | `Quantity`  | 必填         | 成交量，或以笔数折算的代理值。              |
| `ts_event` | `UnixNanos` | `int`       | 必填         | bar 事件时间戳（纳秒）。              |
| `ts_init`  | `UnixNanos` | `int`       | 必填         | 初始化时间戳（纳秒）。         |

## 行为 {#behavior}

- `high` 必须大于或等于 `open`、`low` 和 `close`。
- `low` 必须小于或等于 `open` 和 `close`。
- `bar_type` 决定 bar 是内部生成还是外部供给。
- 复合 bar 类型用 `@` 语法标识来源 bar 类型。

:::warning[执行模拟的 bar 时间戳]
执行模拟要求 `ts_init` 表示 bar 区间的收盘时刻，防止 bar 尚未成形就提前可见。参见
[bar 时间戳约定](./../backtesting/bar-execution.md#bar-timestamp-convention)。
:::

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::{Bar, BarType},
    types::{Price, Quantity},
};

let bar = Bar::new(
    BarType::from("AUD/USD.SIM-1-MINUTE-LAST-EXTERNAL"),
    Price::from("0.65000"),
    Price::from("0.65010"),
    Price::from("0.64990"),
    Price::from("0.65005"),
    Quantity::from("1000000"),
    UnixNanos::from(1_000_000_000),
    UnixNanos::from(1_000_000_100),
);
```

```python tab="Python"
from nautilus_trader.model import Bar
from nautilus_trader.model import BarType
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity

bar = Bar(
    bar_type=BarType.from_str("AUD/USD.SIM-1-MINUTE-LAST-EXTERNAL"),
    open=Price.from_str("0.65000"),
    high=Price.from_str("0.65010"),
    low=Price.from_str("0.64990"),
    close=Price.from_str("0.65005"),
    volume=Quantity.from_int(1_000_000),
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [Bar 与聚合](./index.md#bars-and-aggregation) 介绍聚合方式。
- [Bar 类型](./index.md#bar-types) 讲解 `BarType` 字符串语法。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
