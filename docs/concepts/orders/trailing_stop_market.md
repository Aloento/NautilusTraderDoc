# Trailing-Stop-Market

`FIX OrdType <40>=3` (Stop) + trailing peg

*Trailing-Stop-Market* 订单在行情向有利方向移动时，让止损触发价与指定市场价格保持固定偏移。
触发时释放一个 *Market* 订单。

## 使用场景 {#use-cases}

用 *Trailing-Stop-Market* 订单锁定浮盈，同时让持仓在有利行情中继续持有。偏移太紧可能被正常波动
触发，偏移太宽又会回吐更多利润。释放出的 *Market* 订单在急转行情中同样可能滑点、被拒绝或不成交。

## 示例 {#example}

**示例**：在 Binance Futures 交易所创建一个 *Trailing-Stop-Market* 订单，卖出 10 手 ETHUSD-PERP
COIN_M 保证金永续期货合约。订单在 5,000 USD 激活，随后以最新成交价为基准按 1%（基点）偏移跟踪。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce, TrailingOffsetType, TriggerType},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};
use rust_decimal::Decimal;
use ustr::Ustr;

let order = self.order().trailing_stop_market(
    InstrumentId::from("ETHUSD-PERP.BINANCE"),
    OrderSide::Sell,
    Quantity::from(10),
    Decimal::from(100),                    // trailing_offset
    Some(TrailingOffsetType::BasisPoints), // optional (default PRICE)
    Some(Price::from("5000")),             // activation_price
    None,                                  // trigger_price (materializes from the offset on the first trail)
    Some(TriggerType::LastPrice),          // optional (default DEFAULT)
    Some(TimeInForce::Gtc),                // optional (default GTC)
    None,                                  // expire_time
    Some(true),                            // reduce_only (default false)
    None,                                  // quote_quantity (default false)
    None,                                  // display_qty
    None,                                  // emulation_trigger
    None,                                  // trigger_instrument_id
    None,                                  // exec_algorithm_id
    None,                                  // exec_algorithm_params
    Some(vec![Ustr::from("TRAILING_STOP-1")]), // tags
    None,                                  // client_order_id
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
from nautilus_trader.model import TrailingStopMarketOrder
from nautilus_trader.model import TriggerType

order: TrailingStopMarketOrder = self.order_factory.trailing_stop_market(
    instrument_id=InstrumentId.from_str("ETHUSD-PERP.BINANCE"),
    order_side=OrderSide.SELL,
    quantity=Quantity.from_int(10),
    activation_price=Price.from_str("5_000"),
    trigger_type=TriggerType.LAST_PRICE,  # <-- optional (default DEFAULT)
    trailing_offset=Decimal(100),
    trailing_offset_type=TrailingOffsetType.BASIS_POINTS,
    time_in_force=TimeInForce.GTC,  # <-- optional (default GTC)
    expire_time=None,  # <-- optional (default None)
    reduce_only=True,  # <-- optional (default False)
    tags=["TRAILING_STOP-1"],  # <-- optional (default None)
)
```

:::info
若 `activation_price` 和 `trigger_price` 都省略，订单立即以当前市场激活。首次更新时，其触发价
由 `trailing_offset` 计算得出。
:::

更多细节见
[`TrailingStopMarketOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.TrailingStopMarketOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md#trailing-offset-type) - 触发类型与跟踪偏移类型。
- [仿真订单](./emulated.md) - 在不原生支持跟踪止损的交易场所上进行仿真。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
