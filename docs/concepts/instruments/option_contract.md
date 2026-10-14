# Option Contract

`OptionContract` 表示以非加密资产为标的的挂牌看跌或看涨期权。它定义期权类型、行权价、
激活时间、到期时间、货币、乘数和每手规模。

典型例子包括股票期权、指数期权和期货期权。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 标的资产的资产类别。                      |
| `exchange`        | `Option<Ustr>`     | `str \| None`      | `None`           | 已知时的交易所 MIC 或场所代码。           |
| `underlying`      | `Ustr`             | `str`              | 必填             | 标的资产、期货或指数。                    |
| `option_kind`     | `OptionKind`       | `OptionKind`       | 必填             | 看跌或看涨。                              |
| `strike_price`    | `Price`            | `Price`            | 必填             | 期权行权价。                              |
| `activation_ns`   | `UnixNanos`        | `int`              | 必填             | 合约激活时间戳。                          |
| `expiration_ns`   | `UnixNanos`        | `int`              | 必填             | 合约到期时间戳。                          |
| `currency`        | `Currency`         | `Currency`         | 必填             | 权利金报价与结算货币。                    |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_precision`  | `u8`               | `int`              | 固定 `0`         | 期权以整数合约交易。                      |
| `size_increment`  | `Quantity`         | `Quantity`         | 固定 `1`         | 最小合约数量步长。                        |
| `multiplier`      | `Quantity`         | `Quantity`         | 必填             | 合约乘数。                                |
| `lot_size`        | `Quantity`         | `Quantity`         | 必填             | 整手或每手合约规模。                      |
| `margin_init`     | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 初始保证金率。                            |
| `margin_maint`    | `Option<Decimal>`  | `Decimal \| None`  | `0`              | 维持保证金率。                            |
| `max_quantity`    | `Option<Quantity>` | `Quantity \| None` | `None`           | 最大下单数量。                            |
| `min_quantity`    | `Option<Quantity>` | `Quantity \| None` | `1`              | 最小下单数量。                            |
| `max_price`       | `Option<Price>`    | `Price \| None`    | `None`           | 最大有效报价或订单价格。                  |
| `min_price`       | `Option<Price>`    | `Price \| None`    | `None`           | 最小有效报价或订单价格。                  |
| `tick_scheme`     | `Option<Ustr>`     | `str \| None`      | `None`           | 已注册的可变 tick 方案名称。              |
| `info`            | `Option<Params>`   | `dict \| None`     | `None`           | 适配器元数据。                            |
| `ts_event`        | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`         | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `OptionContract` 的工具类别为 `Option`。
- 以整数合约交易，数量精度为 `0`，数量步长为 `1`。
- 期权类型和行权价决定收益形态。
- 标的和结算货币都是加密资产的期权，请使用 `CryptoOption`。

## 示例 {#example}

```rust tab="Rust"
use jiff::Timestamp;
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::{AssetClass, OptionKind},
    identifiers::{InstrumentId, Symbol},
    instruments::OptionContract,
    types::{Currency, Price, Quantity},
};
use ustr::Ustr;

let activation: Timestamp = "2021-09-17T00:00:00Z".parse().unwrap();
let expiration: Timestamp = "2021-12-17T00:00:00Z".parse().unwrap();

let aapl_call = OptionContract::builder()
    .instrument_id(InstrumentId::from("AAPL211217C00150000.OPRA"))
    .raw_symbol(Symbol::from("AAPL211217C00150000"))
    .asset_class(AssetClass::Equity)
    .exchange(Ustr::from("GMNI"))
    .underlying(Ustr::from("AAPL"))
    .option_kind(OptionKind::Call)
    .strike_price(Price::from("150.00"))
    .currency(Currency::from("USD"))
    .activation_ns(UnixNanos::from(activation))
    .expiration_ns(UnixNanos::from(expiration))
    .price_precision(2)
    .price_increment(Price::from("0.01"))
    .multiplier(Quantity::from("100"))
    .lot_size(Quantity::from("1"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
import pandas as pd

from nautilus_trader.model import AssetClass
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OptionContract
from nautilus_trader.model import OptionKind
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

aapl_call = OptionContract(
    instrument_id=InstrumentId.from_str("AAPL211217C00150000.OPRA"),
    raw_symbol=Symbol("AAPL211217C00150000"),
    asset_class=AssetClass.EQUITY,
    underlying="AAPL",
    option_kind=OptionKind.CALL,
    strike_price=Price.from_str("150.00"),
    currency=Currency.from_str("USD"),
    activation_ns=pd.Timestamp("2021-09-17", tz="UTC").value,
    expiration_ns=pd.Timestamp("2021-12-17", tz="UTC").value,
    price_precision=2,
    price_increment=Price.from_str("0.01"),
    multiplier=Quantity.from_int(100),
    lot_size=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
    exchange="GMNI",
)
```

## 适配器 {#adapters}

**创建或使用 `OptionContract` 金融工具的适配器包括**：

- [Databento](./../../integrations/databento.md)，用于挂牌期权数据。
- [Interactive Brokers](./../../integrations/interactive_brokers.md)，用于挂牌期权合约。

## 相关指南 {#related-guides}

- [期权](./../options.md)介绍期权数据、Greeks 与期权链订阅。
- [Crypto Option](./crypto_option.md)介绍加密期权合约。
