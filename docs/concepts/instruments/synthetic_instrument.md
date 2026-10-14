# Synthetic Instrument

`SyntheticInstrument` 表示价格由其他金融工具上的公式计算得出的本地工具。价差、篮子、比率
及其他需要以工具形式出现在系统中的派生价格，都适合用它建模。

典型例子包括 `(BTC.BINANCE + LTC.BINANCE) / 2.0`，以及由成分工具价格构建的比率型配对。

## 字段 {#fields}

| 字段              | Rust 类型           | Python 类型          | 必填/默认值    | 说明                                        |
| ----------------- | ------------------- | -------------------- | ---------------- | ------------------------------------------- |
| `symbol`          | `Symbol`            | `Symbol`             | 必填             | 与场所 `SYNTH` 组合使用的合成符号。         |
| `id`              | `InstrumentId`      | `InstrumentId`       | 派生             | 由 `symbol.SYNTH` 构成的金融工具 ID。       |
| `price_precision` | `u8`                | `int`                | 必填             | 合成价格允许的小数位数。                    |
| `price_increment` | `Price`             | `Price`              | 派生             | 由精度得出的最小价格步长。                  |
| `components`      | `Vec<InstrumentId>` | `list[InstrumentId]` | 必填             | 公式使用的成分金融工具。                    |
| `formula`         | `String`            | `str`                | 必填             | 基于成分 ID 的数值表达式。                  |
| `ts_event`        | `UnixNanos`         | `int`                | 必填             | 纳秒级事件时间戳。                          |
| `ts_init`         | `UnixNanos`         | `int`                | 必填             | 纳秒级初始化时间戳。                        |

**注意**：Python 由 `symbol` 和 `SYNTH` 场所构造金融工具 ID，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `SyntheticInstrument` 只存在于 Nautilus 本地，不代表可在交易场所下单的市场。
- 它始终使用合成场所 `SYNTH`。
- 公式必须能通过所提供的成分标识符编译，对象才有效。
- 它没有交易场所限额、保证金、费用、订单簿或适配器特定的元数据。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::SyntheticInstrument,
};

let synthetic = SyntheticInstrument::builder()
    .symbol(Symbol::from("BTC-LTC"))
    .price_precision(2)
    .components(vec![
        InstrumentId::from("BTC.BINANCE"),
        InstrumentId::from("LTC.BINANCE"),
    ])
    .formula("(BTC.BINANCE + LTC.BINANCE) / 2.0")
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Symbol
from nautilus_trader.model import SyntheticInstrument

synthetic = SyntheticInstrument(
    symbol=Symbol("BTC-LTC"),
    price_precision=2,
    components=[
        InstrumentId.from_str("BTC.BINANCE"),
        InstrumentId.from_str("LTC.BINANCE"),
    ],
    formula="(BTC.BINANCE + LTC.BINANCE) / 2.0",
    ts_event=0,
    ts_init=0,
)
```

## 适配器 {#adapters}

`SyntheticInstrument` 仅限本地使用。它的价格来自成分工具，而这些成分工具可以来自系统中
已加载的任何适配器。

## 相关指南 {#related-guides}

- [合成工具](./../synthetics.md)介绍公式派生工具与合成 Bar。
- [数据](./../data/index.md)讲解引用金融工具的行情数据。
