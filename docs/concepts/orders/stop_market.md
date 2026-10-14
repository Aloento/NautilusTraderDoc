# Stop-Market

`FIX OrdType <40>=3` (Stop)

*Stop-Market* 订单在到达触发价时释放一个 *Market* 订单。它常被用作止损：对 LONG 持仓下 SELL 订单，或对 SHORT 持仓下 BUY 订单。

## 使用场景 {#use-cases}

当价格突破某个水平后要优先保证成交，使用 *Stop-Market* 订单。典型场景包括保护性止损或突破入场。

触发价**不是保证的成交价格**。快速波动或跳空的市场可能带来明显滑点。释放出的订单仍可能被拒绝，或在没有可交易市场时不成交。*Stop-Limit* 提供价格保护，但可能不成交。

## 示例 {#example}

**示例**：在 Binance 现货/保证金交易所创建一个 *Stop-Market* 订单，卖出 1 BTC。设置触发价 100,000 USDT，
订单持续有效直至撤销。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce, TriggerType},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let order = self.order().stop_market(
    InstrumentId::from("BTCUSDT.BINANCE"),
    OrderSide::Sell,
    Quantity::from(1),
    Price::from("100000"),
    Some(TriggerType::LastPrice), // optional (default DEFAULT)
    Some(TimeInForce::Gtc),       // optional (default GTC)
    None,                         // expire_time
    Some(false),                  // reduce_only (default false)
    None,                         // quote_quantity (default false)
    None,                         // display_qty
    None,                         // emulation_trigger
    None,                         // trigger_instrument_id
    None,                         // exec_algorithm_id
    None,                         // exec_algorithm_params
    None,                         // tags
    None,                         // client_order_id
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import StopMarketOrder
from nautilus_trader.model import TimeInForce
from nautilus_trader.model import TriggerType

order: StopMarketOrder = self.order_factory.stop_market(
    instrument_id=InstrumentId.from_str("BTCUSDT.BINANCE"),
    order_side=OrderSide.SELL,
    quantity=Quantity.from_int(1),
    trigger_price=Price.from_int(100_000),
    trigger_type=TriggerType.LAST_PRICE,  # <-- optional (default DEFAULT)
    time_in_force=TimeInForce.GTC,  # <-- optional (default GTC)
    expire_time=None,  # <-- optional (default None)
    reduce_only=False,  # <-- optional (default False)
    tags=None,  # <-- optional (default None)
)
```

更多细节见
[`StopMarketOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.StopMarketOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md#trigger-type) - 触发类型与其他执行指令。
- [仿真订单](./emulated.md) - 在不原生支持条件订单的交易场所上进行仿真。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
