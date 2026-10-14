# Betting Instrument

`BettingInstrument` 表示体育或博彩市场中的一个选项（selection）。它携带赛事、比赛、市场和选项
的元数据，使 Nautilus 能将该选项视为具有价格、数量、限额、保证金和费用的金融工具。

典型例子包括 Betfair 的胜平负赔率（match odds）选项和让分市场选项。

## 字段 {#fields}

| 字段                 | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| -------------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`      | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`         | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号或生成的符号。           |
| `event_type_id`      | `u64`              | `int`              | 必填             | 事件类型标识符。                         |
| `event_type_name`    | `Ustr`             | `str`              | 必填             | 事件类型名称，如运动项目。               |
| `competition_id`     | `u64`              | `int`              | 必填             | 比赛标识符。                             |
| `competition_name`   | `Ustr`             | `str`              | 必填             | 比赛名称。                               |
| `event_id`           | `u64`              | `int`              | 必填             | 事件标识符。                             |
| `event_name`         | `Ustr`             | `str`              | 必填             | 事件名称。                               |
| `event_country_code` | `Ustr`             | `str`              | 必填             | 事件国家代码。                           |
| `event_open_date`    | `UnixNanos`        | `int`              | 必填             | 事件开始时间。                           |
| `betting_type`       | `Ustr`             | `str`              | 必填             | 交易场所公布的投注类型。                 |
| `market_id`          | `Ustr`             | `str`              | 必填             | 市场标识符。                             |
| `market_name`        | `Ustr`             | `str`              | 必填             | 市场名称。                               |
| `market_type`        | `Ustr`             | `str`              | 必填             | 市场类型，如 match odds。                |
| `market_start_time`  | `UnixNanos`        | `int`              | 必填             | 市场开始时间。                           |
| `selection_id`       | `u64`              | `int`              | 必填             | 选项或参赛方标识符。                     |
| `selection_name`     | `Ustr`             | `str`              | 必填             | 选项或参赛方名称。                       |
| `selection_handicap` | `f64`              | `float`            | 必填             | 让分市场的让分值。                       |
| `currency`           | `Currency`         | `Currency`         | 必填             | 计价与结算货币。                         |
| `price_precision`    | `u8`               | `int`              | 必填             | 价格允许的小数位数。                     |
| `size_precision`     | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                 |
| `price_increment`    | `Price`            | `Price`            | 必填             | 价格步长，通常由 tick 方案决定。         |
| `size_increment`     | `Quantity`         | `Quantity`         | 必填             | 最小数量步长。                           |
| `max_quantity`       | `Option<Quantity>` | `Quantity \| None` | `None`           | 最大下单数量。                           |
| `min_quantity`       | `Option<Quantity>` | `Quantity \| None` | `None`           | 最小下单数量。                           |
| `max_notional`       | `Option<Money>`    | `Money \| None`    | `None`           | 最大下单名义价值。                       |
| `min_notional`       | `Option<Money>`    | `Money \| None`    | `None`           | 最小下单名义价值。                       |
| `max_price`          | `Option<Price>`    | `Price \| None`    | `None`           | 最大有效报价或订单价格。                 |
| `min_price`          | `Option<Price>`    | `Price \| None`    | `None`           | 最小有效报价或订单价格。                 |
| `margin_init`        | `Option<Decimal>`  | `Decimal \| None`  | `1`              | 初始保证金率。                           |
| `margin_maint`       | `Option<Decimal>`  | `Decimal \| None`  | `1`              | 维持保证金率。                           |
| `tick_scheme`        | `Option<Ustr>`     | `str \| None`      | `None`           | 已注册的可变 tick 方案名称。             |
| `info`               | `Option<Params>`   | `dict \| None`     | `None`           | 适配器元数据。                           |
| `ts_event`           | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                       |
| `ts_init`            | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                     |

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `BettingInstrument` 的资产类别为 `Alternative`，工具类别为 `SportsBetting`。
- 每个选项或参赛方都建模为独立的金融工具。
- 博彩工具通常使用已注册的 tick 方案来确定合法赔率步长。
- 保证金默认为 1，因为下注通常会冻结全部赌注金额。

## 示例 {#example}

```rust tab="Rust"
use jiff::Timestamp;
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::BettingInstrument,
    types::{Currency, Money, Price, Quantity},
};
use rust_decimal_macros::dec;
use ustr::Ustr;

let event_open: Timestamp = "2022-02-07T23:30:00Z".parse().unwrap();
let market_start: Timestamp = "2022-02-07T23:30:00Z".parse().unwrap();

let selection = BettingInstrument::builder()
    .instrument_id(InstrumentId::from("1-123456789-50214.BETFAIR"))
    .raw_symbol(Symbol::from("1-123456789-50214"))
    .event_type_id(6423)
    .event_type_name(Ustr::from("American Football"))
    .competition_id(12_282_733)
    .competition_name(Ustr::from("NFL"))
    .event_id(29_678_534)
    .event_name(Ustr::from("NFL"))
    .event_country_code(Ustr::from("GB"))
    .event_open_date(UnixNanos::from(event_open))
    .betting_type(Ustr::from("ODDS"))
    .market_id(Ustr::from("1-123456789"))
    .market_name(Ustr::from("AFC Conference Winner"))
    .market_type(Ustr::from("SPECIAL"))
    .market_start_time(UnixNanos::from(market_start))
    .selection_id(50214)
    .selection_name(Ustr::from("Kansas City Chiefs"))
    .selection_handicap(0.0)
    .currency(Currency::from("GBP"))
    .price_precision(2)
    .size_precision(2)
    .price_increment(Price::from("0.01"))
    .size_increment(Quantity::from("0.01"))
    .max_quantity(Quantity::from("1000"))
    .min_quantity(Quantity::from("1"))
    .max_notional(Money::from("10000 GBP"))
    .min_notional(Money::from("10 GBP"))
    .max_price(Price::from("100.00"))
    .min_price(Price::from("1.00"))
    .margin_init(dec!(1))
    .margin_maint(dec!(1))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();
```

```python tab="Python"
import pandas as pd

from nautilus_trader.model import BettingInstrument
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Money
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol
from nautilus_trader.model import Venue

GBP = Currency.from_str("GBP")

selection = BettingInstrument(
    instrument_id=InstrumentId(Symbol("1-123456789-50214"), Venue("BETFAIR")),
    raw_symbol=Symbol("1-123456789-50214"),
    event_type_id=6423,
    event_type_name="American Football",
    competition_id=12282733,
    competition_name="NFL",
    event_id=29678534,
    event_name="NFL",
    event_country_code="GB",
    event_open_date=pd.Timestamp("2022-02-07 23:30:00+00:00").value,
    betting_type="ODDS",
    market_id="1-123456789",
    market_name="AFC Conference Winner",
    market_type="SPECIAL",
    market_start_time=pd.Timestamp("2022-02-07 23:30:00+00:00").value,
    selection_id=50214,
    selection_name="Kansas City Chiefs",
    selection_handicap=0.0,
    currency=GBP,
    price_precision=2,
    size_precision=2,
    price_increment=Price.from_str("0.01"),
    size_increment=Quantity.from_str("0.01"),
    min_notional=Money(1, GBP),
    ts_event=0,
    ts_init=0,
)
```

## 适配器 {#adapters}

[Betfair](./../../integrations/betfair.md) 适配器为博彩市场创建或使用
`BettingInstrument` 金融工具。

## 相关指南 {#related-guides}

- [记账](./../accounting.md)介绍博彩账户的行为。
- [数据](./../data/index.md)讲解引用金融工具的行情数据。
