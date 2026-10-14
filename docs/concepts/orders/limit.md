# Limit

`FIX OrdType <40>=2`

*Limit* 订单以指定价格挂在限价订单簿上，仅以该价格或更优价格成交。

## 使用场景 {#use-cases}

用 *Limit* 订单控制成交价格，并在合适时提供流动性。常见用途包括做市、在选定价位分批建仓或平仓，以及配合 `post_only` 获取 maker 费率。订单的成交价不会差于限价，但可能不成交或只部分成交。

## 示例 {#example}

**示例**：在 Binance Futures 加密货币交易所创建一个 *Limit* 订单，卖出 20 手 ETHUSDT-PERP 永续期货合约。
设置 5000 USDT 的限价，以做市商身份挂单。

```rust tab="Rust"
use nautilus_model::{
    enums::{OrderSide, TimeInForce},
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

let order = self.order().limit(
    InstrumentId::from("ETHUSDT-PERP.BINANCE"),
    OrderSide::Sell,
    Quantity::from(20),
    Price::from("5000.00"),
    Some(TimeInForce::Gtc), // optional (default GTC)
    None,                   // expire_time
    Some(true),             // post_only (default false)
    Some(false),            // reduce_only (default false)
    None,                   // quote_quantity (default false)
    None,                   // display_qty (default full display)
    None,                   // emulation_trigger
    None,                   // trigger_instrument_id
    None,                   // exec_algorithm_id
    None,                   // exec_algorithm_params
    None,                   // tags
    None,                   // client_order_id
);
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import LimitOrder
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import TimeInForce

order: LimitOrder = self.order_factory.limit(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    order_side=OrderSide.SELL,
    quantity=Quantity.from_int(20),
    price=Price.from_str("5_000.00"),
    time_in_force=TimeInForce.GTC,  # <-- optional (default GTC)
    expire_time=None,  # <-- optional (default None)
    post_only=True,  # <-- optional (default False)
    reduce_only=False,  # <-- optional (default False)
    display_qty=None,  # <-- optional (default None which indicates full display)
    tags=None,  # <-- optional (default None)
)
```

更多细节见 [`LimitOrder` API 参考](https://nautilustrader.io/docs/python-api-latest/model/orders.html#nautilus_trader.model.LimitOrder)。

## 相关指南 {#related-guides}

- [订单](./index.md) - 订单概念、执行指令与订单工厂。
- [仿真订单](./emulated.md) - 仿真 *Limit* 订单，触发后以 *Market* 订单释放。
- [执行](./../execution/index.md) - 订单如何到达交易场所，成交如何处理。
