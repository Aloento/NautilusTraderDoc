# CFD

`Cfd` 表示差价合约：跟踪标的资产但不转移标的的所有权。计价货币、精度、步长、限额、保证金
和费用由交易场所定义。

典型例子包括外汇、股票、指数和商品的差价合约。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 标的资产的资产类别。                      |
| `base_currency`   | `Option<Currency>` | `Currency \| None` | `None`           | CFD 跟踪某一货币时的基础货币。            |
| `quote_currency`  | `Currency`         | `Currency`         | 必填             | 报价和估值使用的货币。                    |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`  | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`  | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
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
| `ts_event`        | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `Cfd` 的工具类别为 `Cfd`。
- 它永远不是反向合约，乘数为 1。
- 没有激活时间戳、到期时间戳、行权价或期权类型。
- 若交易场所对同标的同时提供现货和 CFD 工具，只在 CFD 上使用 `Cfd`，标的的现货市场使用对应的
  现货类型。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::AssetClass,
    identifiers::{InstrumentId, Symbol},
    instruments::Cfd,
    types::{Currency, Price, Quantity},
};
use rust_decimal_macros::dec;

let audusd = Cfd::builder()
    .instrument_id(InstrumentId::from("AUDUSD.OANDA"))
    .raw_symbol(Symbol::from("AUD/USD"))
    .asset_class(AssetClass::FX)
    .base_currency(Currency::from("AUD"))
    .quote_currency(Currency::from("USD"))
    .price_precision(5)
    .size_precision(0)
    .price_increment(Price::from("0.00001"))
    .size_increment(Quantity::from("1"))
    .lot_size(Quantity::from("1000"))
    .margin_init(dec!(0.03))
    .margin_maint(dec!(0.03))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from decimal import Decimal

from nautilus_trader.model import AssetClass
from nautilus_trader.model import Cfd
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

audusd = Cfd(
    instrument_id=InstrumentId.from_str("AUDUSD.OANDA"),
    raw_symbol=Symbol("AUD/USD"),
    asset_class=AssetClass.FX,
    quote_currency=Currency.from_str("USD"),
    price_precision=5,
    price_increment=Price.from_str("0.00001"),
    size_precision=0,
    size_increment=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
    base_currency=Currency.from_str("AUD"),
    lot_size=Quantity.from_int(1000),
    margin_init=Decimal("0.03"),
    margin_maint=Decimal("0.03"),
)
```

## 适配器 {#adapters}

[Interactive Brokers](./../../integrations/interactive_brokers.md) 适配器为差价合约创建或使用
`Cfd` 金融工具。

## 相关指南 {#related-guides}

- [Currency Pair](./currency_pair.md)介绍现货外汇和加密货币现货对。
- [Commodity](./commodity.md)介绍现货商品金融工具。
