# Index Instrument

`IndexInstrument` 表示参考指数，如股票指数、波动率指数或基准价格序列。它携带精度和步长
元数据，使 Nautilus 能一致地存储和路由价格，但它不是可直接交易的合约。

典型例子包括 `SPX.XCBO`、`VIX.XCBO` 以及交易场所特定的参考指数。

## 字段 {#fields}

| 字段              | Rust 类型        | Python 类型    | 必填/默认值    | 说明                                     |
| ----------------- | ---------------- | -------------- | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`   | `InstrumentId` | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`         | `Symbol`       | 必填             | 交易场所原生符号。                        |
| `currency`        | `Currency`       | `Currency`     | 必填             | 报价数值的参考货币。                      |
| `price_precision` | `u8`             | `int`          | 必填             | 价格允许的小数位数。                      |
| `size_precision`  | `u8`             | `int`          | 必填             | 数量允许的小数位数。                      |
| `price_increment` | `Price`          | `Price`        | 必填             | 最小有效价格步长。                        |
| `size_increment`  | `Quantity`       | `Quantity`     | 必填             | 最小有效数量步长。                        |
| `ts_event`        | `UnixNanos`      | `int`          | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`      | `int`          | 必填             | 纳秒级初始化时间戳。                      |
| `tick_scheme`     | `Option<Ustr>`   | `str \| None`  | `None`           | 已注册的可变 tick 方案名称。              |
| `info`            | `Option<Params>` | `dict \| None` | `None`           | 适配器元数据。                            |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `IndexInstrument` 的资产类别为 `Index`，工具类别为 `Spot`。
- 它没有限额、保证金、费用、合约乘数、到期时间或结算货币。
- 标的为指数的可交易衍生品，请使用期权或期货类型。

:::warning
`IndexInstrument` 是参考工具，不是可交易合约。不要针对它提交订单，请交易对应的期货或期权工具。
:::

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::IndexInstrument,
    types::{Currency, Price, Quantity},
};

let spx = IndexInstrument::builder()
    .instrument_id(InstrumentId::from("SPX.XCBO"))
    .raw_symbol(Symbol::from("SPX"))
    .currency(Currency::from("USD"))
    .price_precision(2)
    .size_precision(0)
    .price_increment(Price::from("0.01"))
    .size_increment(Quantity::from("1"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from nautilus_trader.model import Currency
from nautilus_trader.model import IndexInstrument
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

spx = IndexInstrument(
    instrument_id=InstrumentId.from_str("SPX.XCBO"),
    raw_symbol=Symbol("SPX"),
    currency=Currency.from_str("USD"),
    price_precision=2,
    size_precision=0,
    price_increment=Price.from_str("0.01"),
    size_increment=Quantity.from_str("1"),
    ts_event=0,
    ts_init=0,
)
```

## 适配器 {#adapters}

[Interactive Brokers](./../../integrations/interactive_brokers.md) 适配器为参考指数创建
`IndexInstrument` 定义。

## 相关指南 {#related-guides}

- [Option Contract](./option_contract.md)介绍以指数为标的的挂牌期权。
- [Futures Contract](./futures_contract.md)介绍股指期货。
