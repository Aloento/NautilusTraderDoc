# Crypto Perpetual

`CryptoPerpetual` 表示加密货币永续期货合约，也称永续互换（perpetual swap）。它没有到期日，
跟踪某一加密基础资产，以加密资产、稳定币或交易场所定义的其他结算货币结算。

典型例子包括 `ETHUSDT-PERP.BINANCE`、`BTCUSD.BYBIT` 和 `BTC-USD-SWAP.OKX`。

## 字段 {#fields}

| 字段                    | Rust 类型          | Python 类型        | 必填/默认值    | 说明                                     |
| --------------------- | ------------------ | ------------------ | ---------------- | ---------------------------------------- |
| `instrument_id`       | `InstrumentId`     | `InstrumentId`     | 必填             | 在 Rust 中存储为 `id`。                  |
| `raw_symbol`          | `Symbol`           | `Symbol`           | 必填             | 交易场所原生符号。                        |
| `base_currency`       | `Currency`         | `Currency`         | 必填             | 基础加密资产。                            |
| `quote_currency`      | `Currency`         | `Currency`         | 必填             | 价格计价货币。                            |
| `settlement_currency` | `Currency`         | `Currency`         | 必填             | 结算盈亏和费用使用的货币。                |
| `is_inverse`          | `bool`             | `bool`             | 必填             | 数量与计价为反向时为 true。            |
| `price_precision`     | `u8`               | `int`              | 必填             | 价格允许的小数位数。                      |
| `size_precision`      | `u8`               | `int`              | 必填             | 订单数量允许的小数位数。                  |
| `price_increment`     | `Price`            | `Price`            | 必填             | 最小有效价格步长。                        |
| `size_increment`      | `Quantity`         | `Quantity`         | 必填             | 最小有效数量步长。                        |
| `ts_event`            | `UnixNanos`        | `int`              | 必填             | 纳秒级事件时间戳。                        |
| `ts_init`             | `UnixNanos`        | `int`              | 必填             | 纳秒级初始化时间戳。                      |
| `multiplier`          | `Quantity`         | `Quantity`         | `1`              | 合约乘数。                                |
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

**注意**：Python 构造函数使用 `instrument_id`，Rust 将同一值存储为 `id`。

## 行为 {#behavior}

- `CryptoPerpetual` 的资产类别为 `Cryptocurrency`，工具类别为 `Swap`。
- 它没有激活或到期时间戳。

**结算风格**：货币组合决定结算风格。

- **线性（Linear）**：通常设置 `is_inverse=False`，以计价货币结算。
- **反向（Inverse）**：设置 `is_inverse=True`，通常以基础货币结算。
- **Quanto**：以不同于基础货币和计价货币的第三种货币结算。

**成本货币**：反向合约为基础货币，quanto 合约为结算货币，其余情况为计价货币。

:::note
资金费用不是金融工具的字段。它以数据形式到达，例如 `FundingRateUpdate`，并引用金融工具 ID。
:::

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    identifiers::{InstrumentId, Symbol},
    instruments::{CryptoPerpetual, InstrumentAny},
    types::{Currency, Money, Price, Quantity},
};
use rust_decimal_macros::dec;

let ethusdt_perp = CryptoPerpetual::builder()
    .instrument_id(InstrumentId::from("ETHUSDT-PERP.BINANCE"))
    .raw_symbol(Symbol::from("ETHUSDT"))
    .base_currency(Currency::from("ETH"))
    .quote_currency(Currency::from("USDT"))
    .settlement_currency(Currency::from("USDT"))
    .is_inverse(false)
    .price_precision(2)
    .size_precision(3)
    .price_increment(Price::from("0.01"))
    .size_increment(Quantity::from("0.001"))
    .max_quantity(Quantity::from("10000.000"))
    .min_quantity(Quantity::from("0.001"))
    .min_notional(Money::from("10.00 USDT"))
    .max_price(Price::from("15000.00"))
    .min_price(Price::from("1.00"))
    .margin_init(dec!(1.0))
    .margin_maint(dec!(0.35))
    .ts_event(UnixNanos::default())
    .ts_init(UnixNanos::default())
    .build()
    .unwrap();

let instrument = InstrumentAny::CryptoPerpetual(ethusdt_perp);
```

```python tab="Python"
from decimal import Decimal

from nautilus_trader.model import CryptoPerpetual
from nautilus_trader.model import Currency
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Money
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol

ETH = Currency.from_str("ETH")
USDT = Currency.from_str("USDT")

ethusdt_perp = CryptoPerpetual(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    raw_symbol=Symbol("ETHUSDT"),
    base_currency=ETH,
    quote_currency=USDT,
    settlement_currency=USDT,
    is_inverse=False,
    price_precision=2,
    size_precision=3,
    price_increment=Price.from_str("0.01"),
    size_increment=Quantity.from_str("0.001"),
    ts_event=0,
    ts_init=0,
    max_quantity=Quantity.from_str("10000.000"),
    min_quantity=Quantity.from_str("0.001"),
    min_notional=Money(10.00, USDT),
    max_price=Price.from_str("15000.00"),
    min_price=Price.from_str("1.00"),
    margin_init=Decimal("1.0"),
    margin_maint=Decimal("0.35"),
)
```

## 适配器 {#adapters}

**创建或使用 `CryptoPerpetual` 金融工具的适配器包括**：

- [Binance](./../../integrations/binance.md)，用于 USD-M 和 COIN-M 永续期货。
- [Bybit](./../../integrations/bybit.md)，用于线性和反向永续产品。
- [dYdX](./../../integrations/dydx.md)，用于永续市场。
- [Hyperliquid](./../../integrations/hyperliquid.md)，用于永续市场。
- [Kraken](./../../integrations/kraken.md)，用于期货场所的永续市场。
- [OKX](./../../integrations/okx.md)，用于互换市场。
- [Tardis](./../../integrations/tardis.md)，用于加密永续合约元数据。

## 相关指南 {#related-guides}

- [数据](./../data/index.md)介绍标记价格、指数价格和资金费率更新。
- [期权](./../options.md)介绍期权专属的金融工具类型。
- [执行](./../execution/index.md)讲解订单到达交易场所前的精度与名义价值检查。
