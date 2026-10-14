# Tokenized Asset

`TokenizedAsset` 表示在加密交易场所上跟踪另一种资产的现货型代币。代币化股票、代币化基金
或类似工具都适用。在这类工具中，交易场所提供的是代币，其经济参考是外部资产。

典型例子包括加密交易场所上的代币化股票或 ETF 符号。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 经济资产的资产类别。                      |
| `base_currency`   | `Currency`         | `Currency`         | 必填             | 代币化资产或基础代币。                    |
| `quote_currency`  | `Currency`         | `Currency`         | 必填             | 为代币计价的货币。                        |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`  | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`  | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
| `ts_event`        | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |
| `isin`            | `Option<Ustr>`     | `str \| None`      | `None`           | 已知时的国际证券识别码。                  |
| `multiplier`      | `Quantity`         | `Quantity`         | `1`              | 合约乘数。                                |
| `lot_size`        | `Option<Quantity>` | `Quantity \| None` | `None`           | 整手或每手规模。                          |
| `max_quantity`    | `Option<Quantity>` | `Quantity \| None` | `None`           | 最大下单数量。                            |
| `min_quantity`    | `Option<Quantity>` | `Quantity \| None` | `None`           | 最小下单数量。                            |
| `max_notional`    | `Option<Money>`    | `Money \| None`    | `None`           | 最大下单名义价值。                        |
| `min_notional`    | `Option<Money>`    | `Money \| None`    | `None`           | 最小下单名义价值。                        |
| `max_price`       | `Option<Price>`    | `Price \| None`    | `None`           | 最大有效报价或订单价格。                  |
| `min_price`       | `Option<Price>`    | `Price \| None`    | `None`           | 最小有效报价或订单价格。                  |
| `margin_init`     | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 初始保证金率。                            |
| `margin_maint`    | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 维持保证金率。                            |
| `tick_scheme`     | `Option<Ustr>`     | `str \| None`      | `None`           | 已注册的可变 tick 方案名称。              |
| `info`            | `Option<Params>`   | `dict \| None`     | `None`           | 适配器元数据。                            |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `TokenizedAsset` 的工具类别为 `Spot`。
- 它永远不是反向合约，成本货币是计价货币。
- 代币引用上市证券时可以携带 `isin`。
- 它没有激活时间戳、到期时间、行权价或期权类型。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::AssetClass,
    identifiers::{InstrumentId, Symbol},
    instruments::TokenizedAsset,
    types::{Currency, Price, Quantity},
};

let aaplx = TokenizedAsset::builder()
    .instrument_id(InstrumentId::from("AAPLx/USD.KRAKEN"))
    .raw_symbol(Symbol::from("AAPLxUSD"))
    .asset_class(AssetClass::Equity)
    .base_currency(Currency::get_or_create_crypto("AAPLx"))
    .quote_currency(Currency::from("USD"))
    .price_precision(2)
    .size_precision(4)
    .price_increment(Price::from("0.01"))
    .size_increment(Quantity::from("0.0001"))
    .min_quantity(Quantity::from("0.0001"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from nautilus_trader.model import AssetClass
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol
from nautilus_trader.model import TokenizedAsset

aaplx = TokenizedAsset(
    instrument_id=InstrumentId.from_str("AAPLx/USD.KRAKEN"),
    raw_symbol=Symbol("AAPLxUSD"),
    asset_class=AssetClass.EQUITY,
    base_currency=Currency.from_str("AAPLx"),
    quote_currency=Currency.from_str("USD"),
    price_precision=2,
    size_precision=4,
    price_increment=Price.from_str("0.01"),
    size_increment=Quantity.from_str("0.0001"),
    ts_event=0,
    ts_init=0,
    min_quantity=Quantity.from_str("0.0001"),
)
```

## 适配器 {#adapters}

[Kraken](./../../integrations/kraken.md) 适配器在交易场所提供代币化资产时，为其创建或使用
`TokenizedAsset` 金融工具。

## 相关指南 {#related-guides}

- [Currency Pair](./currency_pair.md)介绍普通加密现货对。
- [Equity](./equity.md)介绍上市现金股票。
