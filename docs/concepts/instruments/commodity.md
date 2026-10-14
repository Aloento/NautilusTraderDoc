# Commodity

`Commodity` 表示以货币计价的现货商品市场，如黄金、白银、原油或其他实物资产。它建模的是
现货市场，不是有到期日的期货合约。

典型例子包括 `XAUUSD.IDEALPRO` 和交易场所特定的商品现货符号。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 商品的资产类别。                          |
| `quote_currency`  | `Currency`         | `Currency`         | 必填             | 为商品计价的货币。                        |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`  | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`  | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
| `ts_event`        | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |
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

- `Commodity` 的工具类别为 `Spot`。
- 它允许负价格：电力、原油等现货市场可能跌破零。`RiskEngine` 在订单提交和修改时都接受负价格。
- 它永远不是反向合约，成本货币即计价货币。
- 没有激活时间戳、到期时间、行权价、期权类型或结算货币字段。
- 有到期日的交易所商品期货请使用 `FuturesContract`。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::AssetClass,
    identifiers::{InstrumentId, Symbol},
    instruments::Commodity,
    types::{Currency, Price, Quantity},
};

let gold = Commodity::builder()
    .instrument_id(InstrumentId::from("GOLD.COMEX"))
    .raw_symbol(Symbol::from("GOLD"))
    .asset_class(AssetClass::Commodity)
    .quote_currency(Currency::from("USD"))
    .price_precision(2)
    .size_precision(0)
    .price_increment(Price::from("0.01"))
    .size_increment(Quantity::from("1"))
    .lot_size(Quantity::from("1"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from nautilus_trader.model import AssetClass
from nautilus_trader.model import Commodity
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

gold = Commodity(
    instrument_id=InstrumentId.from_str("GOLD.COMEX"),
    raw_symbol=Symbol("GOLD"),
    asset_class=AssetClass.COMMODITY,
    quote_currency=Currency.from_str("USD"),
    price_precision=2,
    price_increment=Price.from_str("0.01"),
    size_precision=0,
    size_increment=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
    lot_size=Quantity.from_int(1),
)
```

## 适配器 {#adapters}

[Interactive Brokers](./../../integrations/interactive_brokers.md) 适配器为现货商品和金属合约
创建或使用 `Commodity` 金融工具。

## 相关指南 {#related-guides}

- [Futures Contract](./futures_contract.md)介绍以商品为标的、有到期日的期货。
- [数据](./../data/index.md)讲解引用金融工具的行情数据。
