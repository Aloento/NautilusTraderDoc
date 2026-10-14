# Trailing-Stop-Limit

`FIX OrdType <40>=4` (Stop Limit) + trailing peg

*Trailing-Stop-Limit* 订单在行情向有利方向移动时，让止损触发价与指定市场价格保持固定偏移。
触发时释放一个 *Limit* 订单，在此之前限价也随市场同步更新。

## 使用场景 {#use-cases}

用 *Trailing-Stop-Limit* 订单实现动态跟踪保护，同时限定最差可接受成交价。与 *Stop-Limit* 一样，
快速反转行情中释放出的 *Limit* 订单可能不成交，导致持仓未能了结。

## 示例 {#example}

**示例**：在 Currenex 外汇 ECN 创建一个 *Trailing-Stop-Limit* 订单，用 USD 买入 1,250,000 AUD。
初始限价 0.71000 USD，在 0.72000 USD 激活，随后以当前卖价为基准按 0.00100 USD 的止损偏移跟踪。
订单持续有效直至撤销。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce, TrailingOffsetType, TriggerType},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};
use rust_decimal_macros::dec;
use ustr::Ustr;

let order = self.order().trailing_stop_limit(
    InstrumentId::from("AUD/USD.CURRENEX"),
    OrderSide::Buy,
    Quantity::from(1_250_000),
    Price::from("0.71000"),          // limit price
    dec!(0.00050),                   // limit_offset
    dec!(0.00100),                   // trailing_offset
    Some(TrailingOffsetType::Price), // optional (default PRICE)
    Some(Price::from("0.72000")),    // activation_price
    None,                            // trigger_price (materializes from the offset on the first trail)
    Some(TriggerType::BidAsk),       // optional (default DEFAULT)
    Some(TimeInForce::Gtc),          // optional (default GTC)
    None,                            // expire_time
    Some(false),                     // post_only (default false)
    Some(true),                      // reduce_only (default false)
    None,                            // quote_quantity (default false)
    None,                            // display_qty
    None,                            // emulation_trigger
    None,                            // trigger_instrument_id
    None,                            // exec_algorithm_id
    None,                            // exec_algorithm_params
    Some(vec![Ustr::from("TRAILING_STOP")]), // tags
    None,                            // client_order_id
);
```

```python tab="Python"
from decimal import Decimal

from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import TimeInForce
from nautilus_trader.model import TrailingOffsetType
from nautilus_trader.model import TrailingStopLimitOrder
from nautilus_trader.model import TriggerType

order: TrailingStopLimitOrder = self.order_factory.trailing_stop_limit(
    instrument_id=InstrumentId.from_str("AUD/USD.CURRENEX"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(1_250_000),
    price=Price.from_str("0.71000"),
    activation_price=Price.from_str("0.72000"),
    trigger_type=TriggerType.BID_ASK,  # <-- optional (default DEFAULT)
    limit_offset=Decimal("0.00050"),
    trailing_offset=Decimal("0.00100"),
    trailing_offset_type=TrailingOffsetType.PRICE,
    time_in_force=TimeInForce.GTC,  # <-- optional (default GTC)
    expire_time=None,  # <-- optional (default None)
    reduce_only=True,  # <-- optional (default False)
    tags=["TRAILING_STOP"],  # <-- optional (default None)
)
```

:::info
若 `activation_price` 和 `trigger_price` 都省略，订单立即以当前市场激活。首次更新时，其触发价
由 `trailing_offset` 计算得出。
:::

更多细节见
[`TrailingStopLimitOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.TrailingStopLimitOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md#trailing-offset-type) - 触发类型与跟踪偏移类型。
- [仿真订单](./emulated.md) - 在不原生支持跟踪止损的交易场所上进行仿真。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
