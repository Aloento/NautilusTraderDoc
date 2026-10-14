# Stop-Limit

`FIX OrdType <40>=4` (Stop Limit)

*Stop-Limit* 订单在到达触发价时，以指定价格释放一个 *Limit* 订单。

## 使用场景 {#use-cases}

当止损触发还需同时限定最差可接受成交价时，使用 *Stop-Limit* 订单。典型场景包括带价格保护的出场或突破入场。若市场跳空同时越过触发价和限价，订单可能不成交，导致持仓失去保护。

## 示例 {#example}

**示例**：在 Currenex 外汇 ECN 创建一个 *Stop-Limit* 订单，买入 50,000 GBP。限价设为 1.3000 USD，
触发价设为 1.30010 USD。订单在创建一小时后到期。

```rust tab="Rust"
use nautilus_core::DurationNanos;
use nautilus_model::{
    enums::{OrderSide, TimeInForce, TriggerType},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let expire_time = self.clock().timestamp_ns() + DurationNanos::from_mins(60);
let order = self.order().stop_limit(
    InstrumentId::from("GBP/USD.CURRENEX"),
    OrderSide::Buy,
    Quantity::from(50_000),
    Price::from("1.30000"),
    Price::from("1.30010"),
    Some(TriggerType::BidAsk), // optional (default DEFAULT)
    Some(TimeInForce::Gtd),    // optional (default GTC)
    Some(expire_time),         // one hour from now
    Some(true),                // post_only (default false)
    Some(false),               // reduce_only (default false)
    None,                      // quote_quantity (default false)
    None,                      // display_qty
    None,                      // emulation_trigger
    None,                      // trigger_instrument_id
    None,                      // exec_algorithm_id
    None,                      // exec_algorithm_params
    None,                      // tags
    None,                      // client_order_id
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import StopLimitOrder
from nautilus_trader.model import TimeInForce
from nautilus_trader.model import TriggerType

order: StopLimitOrder = self.order_factory.stop_limit(
    instrument_id=InstrumentId.from_str("GBP/USD.CURRENEX"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(50_000),
    price=Price.from_str("1.30000"),
    trigger_price=Price.from_str("1.30010"),
    trigger_type=TriggerType.BID_ASK,  # <-- optional (default DEFAULT)
    time_in_force=TimeInForce.GTD,  # <-- optional (default GTC)
    expire_time=self.clock.timestamp_ns() + 3_600_000_000_000,
    post_only=True,  # <-- optional (default False)
    reduce_only=False,  # <-- optional (default False)
    tags=None,  # <-- optional (default None)
)
```

更多细节见
[`StopLimitOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.StopLimitOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md#trigger-type) - 触发类型与其他执行指令。
- [仿真订单](./emulated.md) - 在不原生支持条件订单的交易场所上进行仿真。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
