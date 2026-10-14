# Equity

`Equity` 表示上市股票、ETF 或类似的现金市场证券。Nautilus 对该类型的使用场景是：以整数单位
交易、以单一货币报价、没有合约到期日的金融工具。

典型例子包括 `AAPL.XNAS`、`MSFT.XNAS` 以及交易场所特定的 ETF 符号。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `currency`        | `Currency`         | `Currency`         | 必填             | 计价与结算货币。                          |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `lot_size`        | `Option<Quantity>` | `Quantity \| None` | `None`           | 整手规模或整股规模。                      |
| `ts_event`        | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |
| `isin`            | `Option<Ustr>`     | `str \| None`      | `None`           | 已知时的国际证券识别码。                  |
| `max_quantity`    | `Option<Quantity>` | `Quantity \| None` | `None`           | 最大下单数量。                            |
| `min_quantity`    | `Option<Quantity>` | `Quantity \| None` | `None`           | 最小下单数量。                            |
| `max_price`       | `Option<Price>`    | `Price \| None`    | `None`           | 最大有效报价或订单价格。                  |
| `min_price`       | `Option<Price>`    | `Price \| None`    | `None`           | 最小有效报价或订单价格。                  |
| `margin_init`     | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 初始保证金率。                            |
| `margin_maint`    | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 维持保证金率。                            |
| `tick_scheme`     | `Option<Ustr>`     | `str \| None`      | `None`           | 已注册的可变 tick 方案名称。              |
| `info`            | `Option<Params>`   | `dict \| None`     | `None`           | 适配器元数据。                            |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `Equity` 的资产类别为 `Equity`，工具类别为 `Spot`。
- 数量精度始终为 0，订单只能使用整数股数。
- 乘数和数量步长都是 1。
- 它没有基础货币、到期时间、行权价、期权类型或反向计价标志。
- 仅在交易场所公布价格限额时才使用价格限额。

:::warning
`Equity` 的数量精度固定为 0。`RiskEngine` 会拒绝数量精度超过金融工具数量精度的任何订单，
因此碎股数量会被拒绝。
:::

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::Equity,
    types::{Currency, Price, Quantity},
};
use ustr::Ustr;

let aapl = Equity::builder()
    .instrument_id(InstrumentId::from("AAPL.XNAS"))
    .raw_symbol(Symbol::from("AAPL"))
    .isin(Ustr::from("US0378331005"))
    .currency(Currency::from("USD"))
    .price_precision(2)
    .price_increment(Price::from("0.01"))
    .lot_size(Quantity::from("100"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from nautilus_trader.model import Currency
from nautilus_trader.model import Equity
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

aapl = Equity(
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
    raw_symbol=Symbol("AAPL"),
    currency=Currency.from_str("USD"),
    price_precision=2,
    price_increment=Price.from_str("0.01"),
    ts_event=0,
    ts_init=0,
    isin="US0378331005",
    lot_size=Quantity.from_int(100),
)
```

## 适配器 {#adapters}

**创建或使用 `Equity` 金融工具的适配器包括**：

- [Databento](./../../integrations/databento.md)，用于美国上市股票和 ETF。
- [Interactive Brokers](./../../integrations/interactive_brokers.md)，用于上市股票合约。

## 相关指南 {#related-guides}

- [数据](./../data/index.md)讲解引用金融工具的行情数据。
- [值类型](./../value_types.md)讲解 `Price`、`Quantity` 和 `Money`。
