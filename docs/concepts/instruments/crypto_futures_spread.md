# Crypto Futures Spread

`CryptoFuturesSpread` 表示交易所定义的加密期货价差策略。交易场所将该策略作为单一工具发布，
拥有自己的符号、策略类型、精度、步长和到期时间。

典型例子包括挂牌的加密期货日历价差。

## 字段 {#fields}

| 字段                    | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| --------------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`       | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`          | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `underlying`          | `Currency`         | `Currency`         | 必填             | 策略跟踪的加密资产。                      |
| `quote_currency`      | `Currency`         | `Currency`         | 必填             | 报价使用的货币。                          |
| `settlement_currency` | `Currency`         | `Currency`         | 必填             | 结算盈亏和费用使用的货币。                |
| `is_inverse`          | `bool`             | `bool`             | 必填             | 数量与计价为反向时为 true。            |
| `strategy_type`       | `Ustr`             | `str`              | 必填             | 交易场所策略类型，如 calendar。           |
| `activation_ns`       | `UnixNanos`        | `int`              | 必填             | 策略激活时间戳。                          |
| `expiration_ns`       | `UnixNanos`        | `int`              | 必填             | 策略到期时间戳。                          |
| `price_precision`     | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`      | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment`     | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`      | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
| `multiplier`          | `Quantity`         | `Quantity`         | `1`              | 策略乘数。                                |
| `lot_size`            | `Quantity`         | `Quantity`         | `1`              | 整手或每手规模。                          |
| `max_quantity`        | `Option<Quantity>` | `Quantity \| None` | `None`           | 最大下单数量。                            |
| `min_quantity`        | `Option<Quantity>` | `Quantity \| None` | `None`           | 最小下单数量。                            |
| `max_notional`        | `Option<Money>`    | `Money \| None`    | `None`           | 最大下单名义价值。                        |
| `min_notional`        | `Option<Money>`    | `Money \| None`    | `None`           | 最小下单名义价值。                        |
| `max_price`           | `Option<Price>`    | `Price \| None`    | `None`           | 最大有效报价或订单价格。                  |
| `min_price`           | `Option<Price>`    | `Price \| None`    | `None`           | 最小有效报价或订单价格。                  |
| `margin_init`         | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 初始保证金率。                            |
| `margin_maint`        | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 维持保证金率。                            |
| `tick_scheme`         | `Option<Ustr>`     | `str \| None`      | `None`           | 已注册的可变 tick 方案名称。              |
| `info`                | `Option<Params>`   | `dict \| None`     | `None`           | 适配器元数据。                            |
| `ts_event`            | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`             | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `CryptoFuturesSpread` 的资产类别为 `Cryptocurrency`，工具类别为 `FuturesSpread`。
- 交易场所将价差作为单一可交易工具发布。
- 视货币组合不同，策略可以是线性、反向或 quanto。
- 价差价格可以为零或负数，`RiskEngine` 对该工具类别接受非正价格，反向价差除外。
- 适配器提供各腿细节时，将其存入 `info`。

## 示例 {#example}

```rust tab="Rust"
use jiff::Timestamp;
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::CryptoFuturesSpread,
    types::{Currency, Price, Quantity},
};
use ustr::Ustr;

let activation: Timestamp = "2026-05-12T00:00:00Z".parse().unwrap();
let expiration: Timestamp = "2026-05-19T08:00:00Z".parse().unwrap();

let btc_spread = CryptoFuturesSpread::builder()
    .instrument_id(InstrumentId::from("BTC-FS-19MAY26_PERP.DERIBIT"))
    .raw_symbol(Symbol::from("BTC-FS-19MAY26_PERP"))
    .underlying(Currency::from("BTC"))
    .quote_currency(Currency::from("USD"))
    .settlement_currency(Currency::from("BTC"))
    .is_inverse(false)
    .strategy_type(Ustr::from("FS"))
    .activation_ns(UnixNanos::from(activation))
    .expiration_ns(UnixNanos::from(expiration))
    .price_precision(1)
    .size_precision(0)
    .price_increment(Price::from("0.5"))
    .size_increment(Quantity::from("1"))
    .multiplier(Quantity::from("10"))
    .lot_size(Quantity::from("1"))
    .min_quantity(Quantity::from("1"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
import pandas as pd

from nautilus_trader.model import CryptoFuturesSpread
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

BTC = Currency.from_str("BTC")
USD = Currency.from_str("USD")

btc_spread = CryptoFuturesSpread(
    instrument_id=InstrumentId.from_str("BTC-FS-19MAY26_PERP.DERIBIT"),
    raw_symbol=Symbol("BTC-FS-19MAY26_PERP"),
    underlying=BTC,
    quote_currency=USD,
    settlement_currency=BTC,
    is_inverse=False,
    strategy_type="FS",
    activation_ns=pd.Timestamp("2026-05-12T00:00:00", tz="UTC").value,
    expiration_ns=pd.Timestamp("2026-05-19T08:00:00", tz="UTC").value,
    price_precision=1,
    size_precision=0,
    price_increment=Price.from_str("0.5"),
    size_increment=Quantity.from_int(1),
    multiplier=Quantity.from_int(10),
    lot_size=Quantity.from_int(1),
    min_quantity=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
)
```

## 适配器 {#adapters}

**创建或使用 `CryptoFuturesSpread` 金融工具的适配器包括**：

- [Deribit](./../../integrations/deribit.md)，用于加密期货组合。
- [OKX](./../../integrations/okx.md)，用于加密期货价差市场。

## 相关指南 {#related-guides}

- [Crypto Future](./crypto_future.md)介绍单腿有到期日的加密期货。
- [Futures Spread](./futures_spread.md)介绍非加密期货价差。
