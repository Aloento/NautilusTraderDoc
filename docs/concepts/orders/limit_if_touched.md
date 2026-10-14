# Limit-If-Touched

`FIX OrdType <40>` 无专用值（通常以 `4` Stop Limit 配合有利触发价发送）

*Limit-If-Touched* 订单在到达触发价时，以指定价格释放一个 *Limit* 订单。

## 使用场景 {#use-cases}

用 *Limit-If-Touched* 订单在触发价被触及后才激活一个带价格保护的订单。例如，等价格接近目标位时
再挂出止盈 *Limit* 订单，而不是一开始就挂着。与 *Stop-Limit* 一样，若触发后市场穿过限价，订单
可能不成交。

## 示例 {#example}

**示例**：在 Binance Futures 创建一个 *Limit-If-Touched* 订单，买入 5 手 BTCUSDT-PERP 永续期货合约。
限价设为 30,100 USDT，触发价设为 30,150 USDT。订单在创建一小时后到期。

```rust tab="Rust"
use nautilus_core::DurationNanos;
use nautilus_model::{
    enums::{OrderSide, TimeInForce, TriggerType},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};
use ustr::Ustr;

let expire_time = self.clock().timestamp_ns() + DurationNanos::from_mins(60);
let order = self.order().limit_if_touched(
    InstrumentId::from("BTCUSDT-PERP.BINANCE"),
    OrderSide::Buy,
    Quantity::from(5),
    Price::from("30100"),
    Price::from("30150"),
    Some(TriggerType::LastPrice), // optional (default DEFAULT)
    Some(TimeInForce::Gtd),       // optional (default GTC)
    Some(expire_time),            // one hour from now
    Some(true),                   // post_only (default false)
    Some(false),                  // reduce_only (default false)
    None,                         // quote_quantity (default false)
    None,                         // display_qty
    None,                         // emulation_trigger
    None,                         // trigger_instrument_id
    None,                         // exec_algorithm_id
    None,                         // exec_algorithm_params
    Some(vec![Ustr::from("TAKE_PROFIT")]), // tags
    None,                         // client_order_id
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import LimitIfTouchedOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import TimeInForce
from nautilus_trader.model import TriggerType

order: LimitIfTouchedOrder = self.order_factory.limit_if_touched(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(5),
    price=Price.from_str("30_100"),
    trigger_price=Price.from_str("30_150"),
    trigger_type=TriggerType.LAST_PRICE,  # <-- optional (default DEFAULT)
    time_in_force=TimeInForce.GTD,  # <-- optional (default GTC)
    expire_time=self.clock.timestamp_ns() + 3_600_000_000_000,
    post_only=True,  # <-- optional (default False)
    reduce_only=False,  # <-- optional (default False)
    tags=["TAKE_PROFIT"],  # <-- optional (default None)
)
```

更多细节见
[`LimitIfTouchedOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.LimitIfTouchedOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md#trigger-type) - 触发类型与其他执行指令。
- [仿真订单](./emulated.md) - 在不原生支持条件订单的交易场所上进行仿真。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
