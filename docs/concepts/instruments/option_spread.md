# Option Spread

`OptionSpread` 表示交易所定义的、包含多条腿的期权策略。交易场所将该策略作为单一工具发布，
拥有自己的符号、tick 大小、到期时间和执行规则。

典型例子包括挂牌的垂直价差、日历价差及其他期权策略。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| ----------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 标的策略的资产类别。                      |
| `exchange`        | `Option<Ustr>`     | `str \| None`      | `None`           | 已知时的交易所 MIC 或场所代码。           |
| `underlying`      | `Ustr`             | `str`              | 必填             | 标的资产、期货或指数。                    |
| `strategy_type`   | `Ustr`             | `str`              | 必填             | 交易场所策略类型，如 vertical。           |
| `activation_ns`   | `UnixNanos`        | `int`              | 必填             | 策略激活时间戳。                          |
| `expiration_ns`   | `UnixNanos`        | `int`              | 必填             | 策略到期时间戳。                          |
| `currency`        | `Currency`         | `Currency`         | 必填             | 权利金报价与结算货币。                    |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_precision`  | `u8`               | `int`              | 固定 `0`         | 期权价差以整数合约交易。                  |
| `size_increment`  | `Quantity`         | `Quantity`         | 固定 `1`         | 最小合约数量步长。                        |
| `multiplier`      | `Quantity`         | `Quantity`         | 必填             | 策略乘数。                                |
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

- `OptionSpread` 的工具类别为 `OptionSpread`。
- 交易场所将价差作为单一可交易工具发布。
- 以整数合约交易，数量精度为 `0`，数量步长为 `1`。
- 价差价格可以为零或负数，`RiskEngine` 对该工具类别接受非正价格。
- 适配器提供各腿细节时，将其存入 `info`。

## 示例 {#example}

```rust tab="Rust"
use jiff::Timestamp;
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::AssetClass,
    identifiers::{InstrumentId, Symbol},
    instruments::OptionSpread,
    types::{Currency, Price, Quantity},
};
use ustr::Ustr;

let activation: Timestamp = "2023-11-06T20:54:07Z".parse().unwrap();
let expiration: Timestamp = "2024-02-23T22:59:00Z".parse().unwrap();

let sr3_spread = OptionSpread::builder()
    .instrument_id(InstrumentId::from("UD:U$: GN 2534559.GLBX"))
    .raw_symbol(Symbol::from("UD:U$: GN 2534559"))
    .asset_class(AssetClass::FX)
    .exchange(Ustr::from("XCME"))
    .underlying(Ustr::from("SR3"))
    .strategy_type(Ustr::from("GN"))
    .activation_ns(UnixNanos::from(activation))
    .expiration_ns(UnixNanos::from(expiration))
    .currency(Currency::from("USD"))
    .price_precision(2)
    .price_increment(Price::from("0.01"))
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
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OptionSpread
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

sr3_spread = OptionSpread(
    instrument_id=InstrumentId.from_str("UD:U$: GN 2534559.GLBX"),
    raw_symbol=Symbol("UD:U$: GN 2534559"),
    asset_class=AssetClass.FX,
    underlying="SR3",
    strategy_type="GN",
    activation_ns=pd.Timestamp("2023-11-06T20:54:07", tz="UTC").value,
    expiration_ns=pd.Timestamp("2024-02-23T22:59:00", tz="UTC").value,
    currency=Currency.from_str("USD"),
    price_precision=2,
    price_increment=Price.from_str("0.01"),
    multiplier=Quantity.from_int(1),
    lot_size=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
    exchange="XCME",
)
```

## 适配器 {#adapters}

**创建或使用 `OptionSpread` 金融工具的适配器包括**：

- [Databento](./../../integrations/databento.md)，用于挂牌期权价差市场。
- [Interactive Brokers](./../../integrations/interactive_brokers.md)，用于交易所定义的期权策略。

## 相关指南 {#related-guides}

- [Option Contract](./option_contract.md)介绍单腿期权合约。
- [期权](./../options.md)介绍期权数据、Greeks 与期权链订阅。
