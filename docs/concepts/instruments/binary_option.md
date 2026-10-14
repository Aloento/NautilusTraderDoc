# Binary Option

`BinaryOption` 表示二元结果工具：当某一条件为真时，按固定赔付结算。它可以建模预测市场、
二元期权，或交易场所特定的 yes/no 合约。

典型例子包括预测市场结果和二元事件合约。

## 字段 {#fields}

| 字段              | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                      |
| ----------------- | ------------------ | ------------------ | ---------------- | ----------------------------------------- |
| `instrument_id`   | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                   |
| `raw_symbol`      | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `asset_class`     | `AssetClass`       | `AssetClass`       | 必填             | 结果市场的资产类别。                      |
| `currency`        | `Currency`         | `Currency`         | 必填             | 计价与结算货币。                          |
| `activation_ns`   | `UnixNanos`        | `int`              | 必填             | 合约激活时间戳。                          |
| `expiration_ns`   | `UnixNanos`        | `int`              | 必填             | 合约到期时间戳。                          |
| `price_precision` | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`  | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment` | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`  | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
| `event_id`        | `Option<Ustr>`     | `str \| None`      | `None`           | 交易场所范围内的父事件标识符。            |
| `outcome`         | `Option<Ustr>`     | `str \| None`      | `None`           | 交易场所提供时的结果标签。                |
| `description`     | `Option<Ustr>`     | `str \| None`      | `None`           | 人类可读的市场描述。                      |
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

- `BinaryOption` 的工具类别为 `BinaryOption`。
- 它永远不是反向合约，乘数和每手规模均为 1。
- 许多交易场所对二元结果的报价介于 0 和 1 之间，但允许的价格范围和 tick 大小由交易场所定义。
- `outcome` 和 `description` 为合约提供人类可读的上下文。
- `event_id` 标识包含该工具市场的父事件，作用范围限于其交易场所。
- 共享同一 `event_id` 的工具属于同一事件。这并不意味着共享抵押品、结果互斥或结算规则相同。

## 示例 {#example}

```rust tab="Rust"
use jiff::Timestamp;
use nautilus_core::UnixNanos;
use nautilus_model::{
    enums::AssetClass,
    identifiers::{InstrumentId, Symbol, Venue},
    instruments::BinaryOption,
    types::{Currency, Price, Quantity},
};
use ustr::Ustr;

let raw_symbol = Symbol::from(
    "0x12a0cb60174abc437bf1178367c72d11f069e1a3add20b148fb0ab4279b772b2-92544998123698303655208967887569360731013655782348975589292031774495159624905",
);
let expiration: Timestamp = "2024-01-01T00:00:00Z".parse().unwrap();

let yes_outcome = BinaryOption::builder()
    .instrument_id(InstrumentId::new(raw_symbol, Venue::from("POLYMARKET")))
    .raw_symbol(raw_symbol)
    .asset_class(AssetClass::Alternative)
    .currency(Currency::from("USDC"))
    .activation_ns(UnixNanos::default())
    .expiration_ns(UnixNanos::from(expiration))
    .price_precision(3)
    .size_precision(2)
    .price_increment(Price::from("0.001"))
    .size_increment(Quantity::from("0.01"))
    .outcome(Ustr::from("Yes"))
    .description(Ustr::from("Will the outcome of this market be 'Yes'?"))
    .min_quantity(Quantity::from("5"))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
import pandas as pd

from nautilus_trader.model import AssetClass
from nautilus_trader.model import BinaryOption
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol
from nautilus_trader.model import Venue

raw_symbol = Symbol(
    "0x12a0cb60174abc437bf1178367c72d11f069e1a3add20b148fb0ab4279b772b2-92544998123698303655208967887569360731013655782348975589292031774495159624905",
)
price_increment = Price.from_str("0.001")
size_increment = Quantity.from_str("0.01")

yes_outcome = BinaryOption(
    instrument_id=InstrumentId(raw_symbol, Venue("POLYMARKET")),
    raw_symbol=raw_symbol,
    asset_class=AssetClass.ALTERNATIVE,
    currency=Currency.from_str("USDC"),
    activation_ns=0,
    expiration_ns=pd.Timestamp("2024-01-01", tz="UTC").value,
    price_precision=price_increment.precision,
    size_precision=size_increment.precision,
    price_increment=price_increment,
    size_increment=size_increment,
    min_quantity=Quantity.from_int(5),
    outcome="Yes",
    description="Will the outcome of this market be 'Yes'?",
    ts_event=0,
    ts_init=0,
)
```

## 适配器 {#adapters}

**创建或使用 `BinaryOption` 金融工具的适配器包括**：

- [Hyperliquid](./../../integrations/hyperliquid.md)，用于二元和预测类市场。
- [OKX](./../../integrations/okx.md)，用于交易场所定义的二元结果产品。
- [Polymarket](./../../integrations/polymarket.md)，用于预测市场结果。

## 相关指南 {#related-guides}

- [订单簿](./../order_book.md)介绍二元市场的订单簿行为。
- [数据](./../data/index.md)讲解引用金融工具的行情数据。
