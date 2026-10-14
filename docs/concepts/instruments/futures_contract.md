# Futures Contract

`FuturesContract` 表示有到期日、在交易所交易的期货合约，具有明确的标的、激活时间、到期时间、
货币、乘数和每手规模。

典型例子包括股指期货、商品期货、利率期货和货币期货。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 标的资产的资产类别。                      |
| `exchange`        | `Option<Ustr>`     | `str \| None`      | `None`           | 已知时的交易所 MIC 或场所代码。           |
| `underlying`      | `Ustr`             | `str`              | 必填             | 标的资产、指数或产品。                    |
| `activation_ns`   | `UnixNanos`        | `int`              | 必填             | 合约激活时间戳。                          |
| `expiration_ns`   | `UnixNanos`        | `int`              | 必填             | 合约到期时间戳。                          |
| `currency`        | `Currency`         | `Currency`         | 必填             | 计价与结算货币。                          |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_precision`  | `u8`               | `int`              | 固定 `0`         | 期货以整数合约交易。                      |
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

- `FuturesContract` 的工具类别为 `Future`。
- 它永远不是反向合约。成本、结算和计价货币都使用 `currency`。
- 价格可以为零或负数。
- 以整数合约交易，数量精度为 `0`，数量步长为 `1`。
- 标的货币与结算货币可能不同的有到期日加密期货，请使用 `CryptoFuture`。

## 示例 {#example}

```rust tab="Rust"
use jiff::Timestamp;
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::AssetClass,
    identifiers::{InstrumentId, Symbol},
    instruments::FuturesContract,
    types::{Currency, Price, Quantity},
};
use ustr::Ustr;

let activation: Timestamp = "2021-09-10T00:00:00Z".parse().unwrap();
let expiration: Timestamp = "2021-12-17T00:00:00Z".parse().unwrap();

let esz21 = FuturesContract::builder()
    .instrument_id(InstrumentId::from("ESZ21.GLBX"))
    .raw_symbol(Symbol::from("ESZ21"))
    .asset_class(AssetClass::Index)
    .exchange(Ustr::from("XCME"))
    .underlying(Ustr::from("ES"))
    .activation_ns(UnixNanos::from(activation))
    .expiration_ns(UnixNanos::from(expiration))
    .currency(Currency::from("USD"))
    .price_precision(2)
    .price_increment(Price::from("0.25"))
    .multiplier(Quantity::from("1"))
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
from nautilus_trader.model import FuturesContract
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

esz21 = FuturesContract(
    instrument_id=InstrumentId.from_str("ESZ21.GLBX"),
    raw_symbol=Symbol("ESZ21"),
    asset_class=AssetClass.INDEX,
    underlying="ES",
    activation_ns=pd.Timestamp("2021-09-10", tz="UTC").value,
    expiration_ns=pd.Timestamp("2021-12-17", tz="UTC").value,
    currency=Currency.from_str("USD"),
    price_precision=2,
    price_increment=Price.from_str("0.25"),
    multiplier=Quantity.from_int(1),
    lot_size=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
    exchange="XCME",
)
```

## 适配器 {#adapters}

**创建或使用 `FuturesContract` 金融工具的适配器包括**：

- [Databento](./../../integrations/databento.md)，用于期货参考数据和行情数据。
- [Interactive Brokers](./../../integrations/interactive_brokers.md)，用于挂牌期货合约。

## 相关指南 {#related-guides}

- [连续期货](./../continuous_futures.md)介绍换月调整的期货序列。
- [Crypto Future](./crypto_future.md)介绍有到期日的加密期货合约。
