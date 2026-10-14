# Market-To-Limit

`FIX OrdType <40>=K` (Market With Left Over as Limit)

*Market-To-Limit* 订单以 *Market* 订单提交。首次成交后，未成交数量以该成交价作为 *Limit* 订单挂出。

## 使用场景 {#use-cases}

用 *Market-To-Limit* 订单以当前最优价格吃掉流动性，而不扫穿更深的档位。它适合订单簿较薄或数量较大、需要控制进一步市场影响的情形。若市场偏离首次成交价，剩余部分可能一直不成交。

## 示例 {#example}

**示例**：在 Interactive Brokers 的
[IdealPro](https://ibkr.info/node/1708) 外汇 ECN 创建一个 *Market-To-Limit* 订单，用 JPY 买入 200,000 USD。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce},
    identifiers::InstrumentId,
    types::Quantity,
};

let order = self.order().market_to_limit(
    InstrumentId::from("USD/JPY.IDEALPRO"),
    OrderSide::Buy,
    Quantity::from(200_000),
    Some(TimeInForce::Gtc), // optional (default GTC)
    None,                   // expire_time
    Some(false),            // reduce_only (default false)
    None,                   // quote_quantity (default false)
    None,                   // display_qty (default full display)
    None,                   // exec_algorithm_id
    None,                   // exec_algorithm_params
    None,                   // tags
    None,                   // client_order_id
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import MarketToLimitOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Quantity
from nautilus_trader.model import TimeInForce

order: MarketToLimitOrder = self.order_factory.market_to_limit(
    instrument_id=InstrumentId.from_str("USD/JPY.IDEALPRO"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(200_000),
    time_in_force=TimeInForce.GTC,  # <-- optional (default GTC)
    reduce_only=False,  # <-- optional (default False)
    display_qty=None,  # <-- optional (default None which indicates full display)
    tags=None,  # <-- optional (default None)
)
```

更多细节见
[`MarketToLimitOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.MarketToLimitOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md) - 订单概念、执行指令与订单工厂。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
