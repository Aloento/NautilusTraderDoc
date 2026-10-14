# Market-If-Touched

`FIX OrdType <40>=J` (Market If Touched)

*Market-If-Touched* 订单在到达触发价时释放一个 *Market* 订单。交易者常用它在回调时入场或止盈。
止盈订单对 LONG 持仓下 SELL 订单，或对 SHORT 持仓下 BUY 订单。

## 使用场景 {#use-cases}

当目标价格被触及后要优先保证成交，使用 *Market-If-Touched* 订单。它的触发方向与止损订单相反，
例如在低于当前价处买入，或在高于当前价处卖出。触发价不是保证的成交价格，释放出的 *Market*
订单可能出现滑点、被拒绝或不成交。

## 示例 {#example}

**示例**：在 Binance Futures 交易所创建一个 *Market-If-Touched* 订单，卖出 10 手 ETHUSDT-PERP
永续期货合约。设置触发价 10,000 USDT，订单持续有效直至撤销。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce, TriggerType},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};
use ustr::Ustr;

let order = self.order().market_if_touched(
    InstrumentId::from("ETHUSDT-PERP.BINANCE"),
    OrderSide::Sell,
    Quantity::from(10),
    Price::from("10000.00"),
    Some(TriggerType::LastPrice),    // optional (default DEFAULT)
    Some(TimeInForce::Gtc),          // optional (default GTC)
    None,                            // expire_time
    Some(false),                     // reduce_only (default false)
    None,                            // quote_quantity (default false)
    None,                            // emulation_trigger
    None,                            // trigger_instrument_id
    None,                            // exec_algorithm_id
    None,                            // exec_algorithm_params
    Some(vec![Ustr::from("ENTRY")]), // tags
    None,                            // client_order_id
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import MarketIfTouchedOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import TimeInForce
from nautilus_trader.model import TriggerType

order: MarketIfTouchedOrder = self.order_factory.market_if_touched(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    order_side=OrderSide.SELL,
    quantity=Quantity.from_int(10),
    trigger_price=Price.from_str("10_000.00"),
    trigger_type=TriggerType.LAST_PRICE,  # <-- optional (default DEFAULT)
    time_in_force=TimeInForce.GTC,  # <-- optional (default GTC)
    expire_time=None,  # <-- optional (default None)
    reduce_only=False,  # <-- optional (default False)
    tags=["ENTRY"],  # <-- optional (default None)
)
```

更多细节见
[`MarketIfTouchedOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.MarketIfTouchedOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md#trigger-type) - 触发类型与其他执行指令。
- [仿真订单](./emulated.md) - 在不原生支持条件订单的交易场所上进行仿真。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
