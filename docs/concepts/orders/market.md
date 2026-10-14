# Market

`FIX OrdType <40>=1`

*Market* 订单指示交易场所立即以当前最优价格交易指定数量。它还可以携带有效期和只减仓指令。

## 使用场景 {#use-cases}

当成交速度比精确价格更重要时，使用 *Market* 订单。典型场景包括紧急降低风险，或进入流动性好、波动快的市场。

*Market* 订单**没有价格保护**，可能产生点差成本和滑点。当没有可交易的市场时，交易场所仍可能拒单或使其不成交。

## 示例 {#example}

**示例**：在 Interactive Brokers 的
[IdealPro](https://ibkr.info/node/1708) 外汇 ECN 上创建一个 *Market* 订单，用 USD 买入 100,000 AUD。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce},
    identifiers::InstrumentId,
    types::Quantity,
};
use ustr::Ustr;

let order = self.order().market(
    InstrumentId::from("AUD/USD.IDEALPRO"),
    OrderSide::Buy,
    Quantity::from(100_000),
    Some(TimeInForce::Ioc),          // optional (default GTC)
    Some(false),                     // reduce_only (default false)
    None,                            // quote_quantity (default false)
    None,                            // exec_algorithm_id
    None,                            // exec_algorithm_params
    Some(vec![Ustr::from("ENTRY")]), // tags
    None,                            // client_order_id (auto-generated if None)
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import MarketOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Quantity
from nautilus_trader.model import TimeInForce

order: MarketOrder = self.order_factory.market(
    instrument_id=InstrumentId.from_str("AUD/USD.IDEALPRO"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(100_000),
    time_in_force=TimeInForce.IOC,  # <-- optional (default GTC)
    reduce_only=False,  # <-- optional (default False)
    tags=["ENTRY"],  # <-- optional (default None)
)
```

更多细节见 [`MarketOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.MarketOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md) - 订单概念、执行指令与订单工厂。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
