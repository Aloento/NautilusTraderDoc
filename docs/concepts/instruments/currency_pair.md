# Currency Pair

`CurrencyPair` 表示以 `BASE/QUOTE` 形式报价的现货或现金市场。基础货币（base）是被买卖的资产，
计价货币（quote）给出一个单位基础资产的价格。Nautilus 对法币外汇对和加密现货对都使用该类型。

典型例子包括 `EUR/USD.SIM`、`BTCUSDT.BINANCE` 和 `ETH/USD.KRAKEN`。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `base_currency`   | `Currency`         | `Currency`         | 必填             | 被买卖的资产。                            |
| `quote_currency`  | `Currency`         | `Currency`         | 必填             | 为基础资产计价的货币。                    |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`  | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`  | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
| `ts_event`        | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |
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

- `CurrencyPair` 的工具类别为 `Spot`。
- 任一货币具有加密类型时，资产类别为 `Cryptocurrency`；两种货币都不是加密类型时为 `FX`。
- 它没有到期时间、行权价、期权类型或衍生品标的字段。
- 它永远不是反向合约。结算货币和成本货币都是计价货币。
- 法币外汇对和加密现货对都使用该类型。

:::note
有到期日的期货、互换和期权应使用对应的衍生品类型。这样成本货币、结算货币、到期时间和名义价值
计算才能与交易场所保持一致，即使符号看起来像货币对。
:::

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::CurrencyPair,
    types::{Currency, Money, Price, Quantity},
};
use rust_decimal_macros::dec;

let btcusdt = CurrencyPair::builder()
    .instrument_id(InstrumentId::from("BTCUSDT.BINANCE"))
    .raw_symbol(Symbol::from("BTCUSDT"))
    .base_currency(Currency::from("BTC"))
    .quote_currency(Currency::from("USDT"))
    .price_precision(2)
    .size_precision(6)
    .price_increment(Price::from("0.01"))
    .size_increment(Quantity::from("0.000001"))
    .min_quantity(Quantity::from("0.000001"))
    .min_notional(Money::from("10.00 USDT"))
    .max_price(Price::from("1000000.00"))
    .min_price(Price::from("0.01"))
    .margin_init(dec!(0.001))
    .margin_maint(dec!(0.001))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
from decimal import Decimal

from nautilus_trader.model import Currency
from nautilus_trader.model import CurrencyPair
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Money
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

BTC = Currency.from_str("BTC")
USDT = Currency.from_str("USDT")

btcusdt = CurrencyPair(
    instrument_id=InstrumentId.from_str("BTCUSDT.BINANCE"),
    raw_symbol=Symbol("BTCUSDT"),
    base_currency=BTC,
    quote_currency=USDT,
    price_precision=2,
    size_precision=6,
    price_increment=Price.from_str("0.01"),
    size_increment=Quantity.from_str("0.000001"),
    ts_event=0,
    ts_init=0,
    min_quantity=Quantity.from_str("0.000001"),
    min_notional=Money(10.00, USDT),
    max_price=Price.from_str("1000000.00"),
    min_price=Price.from_str("0.01"),
    margin_init=Decimal("0.001"),
    margin_maint=Decimal("0.001"),
)
```

## 适配器 {#adapters}

**创建或使用 `CurrencyPair` 金融工具的适配器包括**：

- [Binance](./../../integrations/binance.md)，用于现货市场。
- [Kraken](./../../integrations/kraken.md)，用于现货市场。
- [OKX](./../../integrations/okx.md)，用于现货市场。
- [Tardis](./../../integrations/tardis.md)，用于现货元数据。
- [Interactive Brokers](./../../integrations/interactive_brokers.md)，用于外汇现金合约。
- [Hyperliquid](./../../integrations/hyperliquid.md)，用于现货资产。

## 相关指南 {#related-guides}

- [数据](./../data/index.md)讲解引用金融工具的行情数据。
- [执行](./../execution/index.md)讲解使用金融工具精度的订单检查。
- [值类型](./../value_types.md)讲解 `Price`、`Quantity` 和 `Money`。
