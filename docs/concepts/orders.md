# 订单

本指南详细说明了平台支持的订单类型及每种类型可用的执行指令（execution instructions）。

订单是任何算法交易策略的基础构件之一。NautilusTrader 支持从标准到高级的一整套订单类型与执行指令，尽可能暴露交易场所（venue）的功能，以便交易者可以定义精细的执行指令和应急措施，从而实现几乎任意的交易策略。

## 概述

所有订单类型都源自两个基本类型：Market（市价）与 Limit（限价）订单。从流动性角度来看，它们互为对立：
Market 订单通过以最优可得价格立即成交来消耗流动性；而 Limit 订单则在指定价格挂单，提供流动性，直到被撮合。

平台支持的订单类型如下（使用相应的枚举值表示）：

- `MARKET`
- `LIMIT`
- `STOP_MARKET`
- `STOP_LIMIT`
- `MARKET_TO_LIMIT`
- `MARKET_IF_TOUCHED`
- `LIMIT_IF_TOUCHED`
- `TRAILING_STOP_MARKET`
- `TRAILING_STOP_LIMIT`

:::info
NautilusTrader 为多种订单类型和执行指令提供统一的 API，但并非所有交易场所都支持所有选项。
如果某个订单包含目标场所不支持的指令或选项，系统不会提交该不受支持的部分，而会记录清晰的错误日志（不再提交该指令）。
:::

### 术语

- 如果订单类型为 `MARKET` 或以可被视为市价（marketable）的方式执行，则称该订单为 **aggressive（主动）**（即吃单）。
- 如果订单不可被立刻撮合（即提供流动性），则称为 **passive（被动）**。
- 如果订单在本地系统边界内处于以下三种非终态之一，则称为 **active local（本地活跃）**：
  - `INITIALIZED`
  - `EMULATED`
  - `RELEASED`
- 当订单处于下列状态之一时，称为 **in-flight（在途）**：
  - `SUBMITTED`
  - `PENDING_UPDATE`
  - `PENDING_CANCEL`
- 当订单处于下列（非终态）状态之一时，称为 **open（未结）**：
  - `ACCEPTED`
  - `TRIGGERED`
  - `PENDING_UPDATE`
  - `PENDING_CANCEL`
  - `PARTIALLY_FILLED`
- 当订单处于下列（终态）状态之一时，称为 **closed（已结）**：
  - `DENIED`
  - `REJECTED`
  - `CANCELED`
  - `EXPIRED`
  - `FILLED`

## 执行指令（Execution instructions）

某些交易场所允许交易者在订单中指定处理与执行方式的条件或限制。下面简要汇总了常见的执行指令。

### 有效期（Time in force）

订单的 time in force 指定了订单在多长时间内保持活跃，超出该时间未成交的剩余数量将被取消。

- `GTC`（Good Till Cancel）：订单一直有效，直到被交易者或场所取消。
- `IOC`（Immediate or Cancel / Fill and Kill）：订单立即撮合，未成交部分被取消。
- `FOK`（Fill or Kill）：订单要么立即全部成交，要么全部撤销。
- `GTD`（Good Till Date）：订单在指定到期日期前保持有效。
- `DAY`（Good for session/day）：订单在当前交易日/交易时段结束前有效。
- `AT_THE_OPEN`（OPG）：订单仅在交易时段开盘时段有效。
- `AT_THE_CLOSE`：订单仅在收盘时段有效。

### 到期时间（Expire time）

该指令通常与 `GTD` 一起使用，用于指定订单到期并从场所的订单簿（或订单管理系统）中移除的确切时间。

### 仅挂单（Post-only）

标记为 `post_only` 的订单仅作为流动性提供者出现在限价簿中，不会成为吃单（aggressor）而主动成交。这对于做市商或希望维持 maker 费率档位的交易者尤为重要。

### 仅减仓（Reduce-only）

设置为 `reduce_only` 的订单只会用于减少某合约的持仓，且在目前为平仓状态时不会开仓。不同场所对此指令的具体表现可能有所不同。

在 Nautilus 的 `SimulatedExchange`（模拟交易所）中，表现与真实场所类似：

- 若关联持仓已被平仓（变为 flat），相关订单会被取消；
- 随着关联持仓规模减少，订单数量也会相应减少。

### 可见数量（Display quantity）

`display_qty` 指定在限价簿上可见的限价订单数量（也称 iceberg 订单）。可见数量为 0 等同于将订单标记为 `hidden`（完全隐藏）。

### 触发类型（Trigger type）

又称为触发方法（trigger method），适用于条件触发订单，用来指定止损/触发价格的判定依据。参考 Interactive Brokers 的说明也能帮助理解触发方式的差异。

- `DEFAULT`：场所默认的触发类型（通常为 `LAST` 或 `BID_ASK`）。
- `LAST`：以最近成交价（last price）作为触发基准。
- `BID_ASK`：以买单（BID）价格触发买入指令，以卖单（ASK）价格触发卖出指令。
- `DOUBLE_LAST`：基于最近两次连续的 `LAST` 价格确认触发。
- `DOUBLE_BID_ASK`：基于最近两次连续的 `BID`/`ASK` 价格确认触发。
- `LAST_OR_BID_ASK`：以 `LAST` 或 `BID`/`ASK` 中任一满足条件者触发。
- `MID_POINT`：以 `BID` 与 `ASK` 的中点作为触发价。
- `MARK`：以场所的标记价（mark price）作为触发价（常见于衍生品）。
- `INDEX`：以场所提供的指数价（index price）作为触发价。

### 触发偏移类型（Trigger offset type）

适用于带追踪（trailing）功能的触发订单，指定如何根据市场价格偏移来调整止损价格。

- `DEFAULT`：场所的默认偏移类型（通常为 `PRICE`）。
- `PRICE`：按价格差值计算偏移。
- `BASIS_POINTS`：按基点（basis points）计算百分比偏移（100bp = 1%）。
- `TICKS`：按价格跳动点数（ticks）计算偏移。
- `PRICE_TIER`：基于交易场所特定的价格分级（price tier）。

### 条件/联动订单（Contingent orders）

可以指定更复杂的订单间关系，例如子订单仅在父订单激活或成交后触发，或一个订单被触发时取消/减少另一个订单的数量。详见后文的“高级订单（Advanced orders）”部分。

## 订单工厂（Order factory）

最简单的创建订单方式是使用内置的 `OrderFactory`，它会自动附加到每个 `Strategy` 类中。该工厂负责处理底层细节——例如确保正确的 trader ID 与 strategy ID、生成必要的初始化 ID 与时间戳，并对不适用于某些订单类型或仅用于高级执行指令的参数进行抽象封装。

因此，工厂提供了更简洁的订单创建方法，示例中均在 `Strategy` 上下文中使用 `OrderFactory`。

:::info
更多细节请参阅 `OrderFactory` 的 [API 参考](../api_reference/common.md#class-orderfactory)。
:::

## 订单类型

下面分别描述平台支持的订单类型并给出示例代码。任何可选参数都会在注释中标注默认值。

### 市价订单（Market）

Market（市价）订单是交易者按当前最优价格立即成交指定数量的指令。可以同时指定若干 time in force 选项，并可以指示该订单是否仅用于减仓（reduce-only）。

下面示例在 Interactive Brokers 的 IdealPro 外汇 ECN 上创建一个以 USD 购买 100,000 AUD 的市价买单：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import MarketOrder

order: MarketOrder = self.order_factory.market(
    instrument_id=InstrumentId.from_str("AUD/USD.IDEALPRO"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(100_000),
    time_in_force=TimeInForce.IOC,  # <-- optional (default GTC)
    reduce_only=False,  # <-- optional (default False)
    tags=["ENTRY"],  # <-- optional (default None)
)
```

:::info
更多细节请参阅 `MarketOrder` 的 [API 参考](../api_reference/model/orders.md#class-marketorder)。
:::

### 限价订单（Limit）

Limit（限价）订单在指定价格挂单，只有在该价格或更优价格下才会成交。

下面示例在 Binance Futures（合约）上作为做市商以 5000 USDT 的限价卖出 20 份 ETHUSDT-PERP 永续合约：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import LimitOrder

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

:::info
更多细节请参阅 `LimitOrder` 的 [API 参考](../api_reference/model/orders.md#class-limitorder)。
:::

### 止损市价（Stop-Market）

Stop-Market（止损市价）是条件订单：一旦触发，就会立即提交一个 Market 订单。常用于止损（stop-loss），对多头仓位为卖出止损，对空头仓位为买入止损。

下面示例在 Binance 现货/保证金上创建一个触发价为 100,000 USDT 的卖出止损市价单：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import StopMarketOrder

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

:::info
更多细节请参阅 `StopMarketOrder` 的 [API 参考](../api_reference/model/orders.md#class-stopmarketorder)。
:::

### 止损限价（Stop-Limit）

Stop-Limit（止损限价）是一种条件订单：触发后立即提交一个指定价格的 Limit 订单。

下面示例在 Currenex FX ECN 上创建一个在触发价 1.30010 USD 时以限价 1.30000 USD 买入 50,000 GBP 的订单，有效期至 2022-06-06 UTC 中午：

```python
import pandas as pd
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import StopLimitOrder

order: StopLimitOrder = self.order_factory.stop_limit(
    instrument_id=InstrumentId.from_str("GBP/USD.CURRENEX"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(50_000),
    price=Price.from_str("1.30000"),
    trigger_price=Price.from_str("1.30010"),
    trigger_type=TriggerType.BID_ASK,  # <-- optional (default DEFAULT)
    time_in_force=TimeInForce.GTD,  # <-- optional (default GTC)
    expire_time=pd.Timestamp("2022-06-06T12:00"),
    post_only=True,  # <-- optional (default False)
    reduce_only=False,  # <-- optional (default False)
    tags=None,  # <-- optional (default None)
)
```

:::info
更多细节请参阅 `StopLimitOrder` 的 [API 参考](../api_reference/model/orders.md#class-stoplimitorder)。
:::

### 市价转限价（Market-To-Limit）

Market-To-Limit 订单最初作为市价单提交并以当前最佳价撮合；如果部分成交，系统会取消剩余部分并将其以已成交价格重新提交为 Limit 订单。

下面示例在 Interactive Brokers IdealPro 外汇 ECN 上创建一个以 JPY 买入 200,000 USD 的 Market-To-Limit 订单：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import MarketToLimitOrder

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

:::info
更多细节请参阅 `MarketToLimitOrder` 的 [API 参考](../api_reference/model/orders.md#class-markettolimitorder)。
:::

### 市价触及（Market-If-Touched）

Market-If-Touched（简称 MIT）是一种条件订单：触发时立即提交 Market 订单。常用于在触及某价格时开仓或为已有仓位止盈。

下面示例在 Binance Futures 上创建一个触发价为 10,000 USDT 的卖出 MIT 订单，数量为 10 张 ETHUSDT-PERP：

```python
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import MarketIfTouchedOrder

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

:::info
更多细节请参阅 `MarketIfTouchedOrder` 的 [API 参考](../api_reference/model/orders.md#class-marketiftouchedorder)。
:::

### 限价触及（Limit-If-Touched）

Limit-If-Touched（LIT）是条件订单：触发后立即提交指定价格的 Limit 订单。

下面示例在 Binance Futures 上创建一个触发价 30,150 USDT 时以限价 30,100 USDT 买入 5 张 BTCUSDT-PERP 的订单，有效期至 2022-06-06 UTC 中午：

```python
import pandas as pd
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import LimitIfTouchedOrder

order: LimitIfTouchedOrder = self.order_factory.limit_if_touched(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(5),
    price=Price.from_str("30_100"),
    trigger_price=Price.from_str("30_150"),
    trigger_type=TriggerType.LAST_PRICE,  # <-- optional (default DEFAULT)
    time_in_force=TimeInForce.GTD,  # <-- optional (default GTC)
    expire_time=pd.Timestamp("2022-06-06T12:00"),
    post_only=True,  # <-- optional (default False)
    reduce_only=False,  # <-- optional (default False)
    tags=["TAKE_PROFIT"],  # <-- optional (default None)
)
```

:::info
更多细节请参阅 `LimitIfTouched` 的 [API 参考](../api_reference/model/orders.md#class-limitiftouchedorder-1)。
:::

### 追踪止损（Trailing-Stop-Market）

Trailing-Stop-Market 是一种条件订单，它会将止损触发价按与市场价格的固定偏移量进行追踪。触发后提交 Market 订单。

下面示例在 Binance Futures 上创建一个在激活价 5,000 USD 时生效、并以相对于最近成交价追踪 1%（以基点表示）的卖出追踪止损：

```python
import pandas as pd
from decimal import Decimal
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model.enums import TrailingOffsetType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import TrailingStopMarketOrder

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
更多细节请参阅 `TrailingStopMarketOrder` 的 [API 参考](../api_reference/model/orders.md#class-trailingstopmarketorder-1)。
:::

### 追踪止损限价（Trailing-Stop-Limit）

Trailing-Stop-Limit 在被触发时会提交一个限价单，随着市场移动该限价也会随同更新直至触发。

下面示例在 Currenex FX ECN 上创建一个以 0.71000 USD 为限价、激活价为 0.72000 USD、并以 0.00100 USD 的止损偏移追踪当前卖方价的买入追踪止损限价单：

```python
import pandas as pd
from decimal import Decimal
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import TimeInForce
from nautilus_trader.model.enums import TriggerType
from nautilus_trader.model.enums import TrailingOffsetType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model.orders import TrailingStopLimitOrder

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
更多细节请参阅 `TrailingStopLimitOrder` 的 [API 参考](../api_reference/model/orders.md#class-trailingstoplimitorder-1)。
:::

## 高级订单（Advanced orders）

以下内容应结合具体经纪商或交易场所关于这些订单类型、列表/分组和执行指令的文档一起阅读（例如 Interactive Brokers 的文档）。

### 订单列表（Order lists）

一组有联动关系的订单或较大的订单集合可以被分配到同一个 `order_list_id` 下。这些订单之间是否存在从属/联动关系取决于订单本身的构造方式以及它们所要路由的具体交易场所。

### 联动类型（Contingency types）

- **OTO（One-Triggers-Other）**：父订单在执行后会自动提交一个或多个子订单。

  - 完全触发（Full-trigger）：子订单仅在父订单完全成交后释放。这在多数零售股票/期权经纪商（如 Schwab、Fidelity、TD Ameritrade）以及许多现货加密场所（Binance、Coinbase）中常见。
  - 部分触发（Partial-trigger）：子订单按每次父订单部分成交按比例释放。见诸于专业级平台（如 Interactive Brokers、大多数期货/外汇 OMS 与 Kraken Pro）。

- **OCO（One-Cancels-Other）**：两个或多个联动的在途订单，其中任一订单成交（部分或全部）会触发对其它订单的取消尝试。

- **OUO（One-Updates-Other）**：两个或多个联动的在途订单，其中任一订单成交会触发对其他订单未成交数量的减少更新。

:::info
这些联动类型对应 FIX 标签 ContingencyType [1385](https://www.onixs.biz/fix-dictionary/5.0.sp2/tagnum_1385.html)。
:::

#### One-Triggers-Other (OTO)

一个 OTO 订单包含两部分：

1. **Parent order（父订单）**——立即提交至撮合引擎；
2. **Child order(s)（子订单）**——在触发条件满足前保持为离簿（off-book）状态。

##### 触发模型

| 触发模型            | 子订单何时释放？                                                               |
| ------------------- | ------------------------------------------------------------------------------ |
| **Full trigger**    | 当父订单累积成交量等于原始下单量（即父订单被完全成交）时释放。                 |
| **Partial trigger** | 每次父订单部分成交时立即按成交量释放子订单，且子订单数量随后续成交增加而增加。 |

:::info
NautilusTrader 的默认回测场所采用 OTO 的部分触发（partial-trigger）模型。未来会提供配置项以选择使用完全触发（full-trigger）模型。
:::

> **为什么这个区别重要？** 完全触发会留下风险窗口：在父订单未被完全成交之前，部分已成交的头寸可能没有其保护性退出单；部分触发则可减轻该风险，因为每一笔成交都会即时关联相应的止损/止盈，但代价是产生更多订单流量和更新。

OTO 可应用于任何场所支持的资产类型（例如股票入场附带期权对冲、期货入场并构造 OCO 组合、现货加密入场并附带 TP/SL 等）。

| 场所 / 适配器 ID                            | 支持资产类别           | 子订单触发规则                         | 实务说明                                               |
| ------------------------------------------- | ---------------------- | -------------------------------------- | ------------------------------------------------------ |
| Binance / Binance Futures (`BINANCE`)       | 现货、永续合约         | **Partial or full** – 在首次成交时触发 | OTOCO/TP-SL 子单会即时出现；注意监控保证金占用。       |
| Bybit Spot (`BYBIT`)                        | 现货                   | **Full** – 完成后放置子单              | 仅在限价单完全成交后激活 TP-SL。                       |
| Bybit Perps (`BYBIT`)                       | 永续合约               | **Partial and full** – 可配置          | “Partial-position” 模式按成交到达调整 TP-SL。          |
| Kraken Futures (`KRAKEN`)                   | 期货 & 永续            | **Partial and full** – 自动            | 子订单数量会随每次部分成交而匹配。                     |
| OKX (`OKX`)                                 | 现货、期货、期权       | **Full** – 附加止损需等待成交          | 可单独添加仓位级别的 TP-SL。                           |
| Interactive Brokers (`INTERACTIVE_BROKERS`) | 股票、期权、外汇、期货 | **Configurable** – OCA 可按比例减少    | `OcaType 2/3` 支持减少剩余子单数量。                   |
| Coinbase International (`COINBASE_INTX`)    | 现货 & 永续            | **Full** – 成交后添加档位              | 入场与 bracket（挂单组合）并非同时提交；入场后再添加。 |
| dYdX v4 (`DYDX`)                            | 永续（DEX）            | 链上条件（size exact）                 | TP-SL 由 oracle 价格触发；部分成交不适用。             |
| Polymarket (`POLYMARKET`)                   | 预测市场（DEX）        | N/A                                    | 高级联动由策略层负责处理。                             |
| Betfair (`BETFAIR`)                         | 体育博彩               | N/A                                    | 高级联动由策略层负责处理。                             |

#### One-Cancels-Other (OCO)

OCO 是一组联动订单，其中任意一个订单（无论部分或全部成交）都会触发对其它订单的尽力取消。两个订单同时处于激活状态；一旦其中一个开始成交，场所会尝试取消剩余未成交部分。

#### One-Updates-Other (OUO)

OUO 是一组联动订单，其中一笔成交会立即按比例减少另一笔（或多笔）订单的未成交数量。双方订单并行存在，每次部分成交都会以尽力而为的方式更新其对手订单的剩余量。

### 组合单（Bracket orders）

Bracket（组合）订单是一种高级用法，允许交易者同时为仓位设置止盈（take-profit）和止损（stop-loss）。这通常包括一个父订单（入场）以及两个子订单：一个 LIMIT 型止盈单和一个 STOP_MARKET 型止损单。当父订单成交后，系统会提交这两个子单；若行情朝有利方向移动，止盈会平仓；若行情反向，则止损限制亏损。

可以通过 [OrderFactory](../api_reference/common.md#class-orderfactory) 简便地创建 bracket 订单，该工厂支持多种订单类型、参数及指令。

:::warning
注意保证金要求：对仓位进行 bracket 操作会占用更多的委托保证金。
:::

## 本地模拟订单（Emulated orders）

### 简介

在深入实现细节前，需理解 emulated orders 在 NautilusTrader 中的核心目的：当交易场所本身不支持某些订单类型时，平台可以在本地对这些订单行为进行模拟，使交易者仍可使用这些高级订单类型。

实现方式为：Nautilus 在本地模拟这些订单（例如 `STOP_LIMIT` 或 `TRAILING_STOP`），而对外仅向场所提交基础的 `MARKET` 或 `LIMIT` 订单来执行。

当创建 emulated order 时，Nautilus 会持续跟踪一种特定的市场价格类型（由 `emulation_trigger` 参数指定），并根据订单类型与设置的条件，在触发条件满足时自动提交相应的基础订单（`MARKET` / `LIMIT`）。

例如，创建一个 emulated 的 `STOP_LIMIT` 订单时，Nautilus 会监测市场价格，当达到你设置的止损价后自动向场所提交一个 `LIMIT` 订单。

为了执行模拟，Nautilus 需要知道监测哪种“市场价格”类型。默认情况下使用 bid/ask（买卖挂单价），因此示例中常见 `emulation_trigger=TriggerType.DEFAULT`（等同于 `TriggerType.BID_ASK`）。当然，Nautilus 也支持多种其他价格类型以指导模拟流程。

### 提交用于模拟的订单

要启用订单模拟，只需在订单构造器或 `OrderFactory` 的创建方法中为 `emulation_trigger` 参数传递一个 `TriggerType`。当前支持的 emulation trigger 类型如下：

- `NO_TRIGGER`：完全禁用本地模拟，订单直接提交到场所。
- `DEFAULT`：等同于 `BID_ASK`。
- `BID_ASK`：使用买卖盘（quotes）作为触发依据。
- `LAST`：使用成交价（trades）作为触发依据。

触发类型的选择会影响模拟行为：

- 对于 `STOP` 订单，触发价将与所选触发类型进行比较；
- 对于 `TRAILING_STOP`，追踪偏移将根据所选触发类型进行更新；
- 对于 `LIMIT`，限价将与所选触发类型进行比较。

下面表格列出可用于 `emulation_trigger` 的值及其说明：

| Trigger Type      | 说明                                           | 常见使用场景                                                     |
| :---------------- | :--------------------------------------------- | :--------------------------------------------------------------- |
| `NO_TRIGGER`      | 完全禁用模拟，订单直接发送到场所，无本地处理。 | 想使用场所的原生订单处理，或仅为不需要模拟的简单订单类型时使用。 |
| `DEFAULT`         | 等同于 `BID_ASK`，是大多数模拟订单的默认选择。 | 通用模拟场景，使用“默认”市场价格类型。                           |
| `BID_ASK`         | 使用最优买/卖价（quotes）作为模拟触发依据。    | 适用于应对买卖价差的止损、追踪止损等场景。                       |
| `LAST_PRICE`      | 使用最近成交价（last）作为模拟触发依据。       | 更适合基于实际成交触发的订单。                                   |
| `DOUBLE_LAST`     | 使用两次连续的成交价确认触发条件。             | 需要更多价格确认以避免噪声触发。                                 |
| `DOUBLE_BID_ASK`  | 使用两次连续的买/卖价更新确认触发条件。        | 需要在报价波动中额外确认触发时使用。                             |
| `LAST_OR_BID_ASK` | 以成交价或买卖价的任一满足条件者触发。         | 希望对任意类型价格变动都更敏感时使用。                           |
| `MID_POINT`       | 以买卖价中点作为触发依据。                     | 基于理论公平价触发的订单类型。                                   |
| `MARK_PRICE`      | 使用标记价（mark price，常见于衍生品）触发。   | 对期货与永续合约等衍生品尤为有用。                               |
| `INDEX_PRICE`     | 使用某个指数价作为触发依据。                   | 交易与指数挂钩的衍生品时使用。                                   |

### 技术实现

平台允许在本地模拟大多数订单类型，无论目标场所是否原生支持。订单模拟的逻辑路径在所有环境上下文（[environment contexts](/concepts/architecture.md#environment-contexts)）中是一致的，并由公用的 `OrderEmulator` 组件负责。

:::note
单个运行实例中可存在的 emulated orders 数量没有限制。
:::

### 生命周期

一个 emulated order 的生命周期如下：

1. 由 `Strategy` 通过 `submit_order` 提交；
2. 发往 `RiskEngine` 做事前风险检查（可能在此被拒绝）；
3. 传入 `OrderEmulator`，在本地被“持有/模拟”；
4. 一旦触发，本地 emulated order 会被转换为 `MARKET` 或 `LIMIT` 并释放（提交至场所）；
5. 释放后的订单在提交场所前会再次经过最终风险检查。

:::note
Emulated orders 与普通订单遵循相同的风控约束，且可以像常规订单一样被策略修改或取消；在执行“取消所有订单”操作时也包含在内。
:::

:::info
一个 emulated order 在整个生命周期中会保留其原始的 client order ID，便于通过缓存（cache）查询。
:::

#### 被持有的 emulated orders

当 emulated order 被 `OrderEmulator` 持有时，会发生以下处理：

- 原始的 `SubmitOrder` 命令将被缓存；
- emulated order 会在本地的 `MatchingCore` 中进行处理；
- `OrderEmulator` 会订阅所需的市场数据（如果尚未订阅）以更新匹配模块；
- emulated order 在被释放或取消之前可以被交易者修改，且会随市场更新而变更。

#### 已释放的 emulated orders

一旦有数据到达触发或本地匹配到 emulated order，会发生以下“释放”操作：

- 订单将通过附加的 `OrderInitialized` 事件被转换为 `MARKET` 或 `LIMIT`；
- 该订单的 `emulation_trigger` 会被设置为 `NONE`（不再被视为 emulated order）；
- 原始 `SubmitOrder` 命令中附带的订单会被重新发送至 `RiskEngine` 进行因修改而产生的额外检查；
- 若未被拒绝，命令将继续进入 `ExecutionEngine`，并通过 `ExecutionClient` 发往交易场所。

下表列出哪些订单类型可以被模拟，以及在释放时会转换成何种订单类型并提交至交易场所。

### 可模拟的订单类型

下表列出了可模拟的订单类型以及它们在释放后将转换成的订单类型：

| Order type for emulation | Can emulate | Released type |
| :----------------------- | :---------- | :------------ |
| `MARKET`                 |             | n/a           |
| `MARKET_TO_LIMIT`        |             | n/a           |
| `LIMIT`                  | ✓           | `MARKET`      |
| `STOP_MARKET`            | ✓           | `MARKET`      |
| `STOP_LIMIT`             | ✓           | `LIMIT`       |
| `MARKET_IF_TOUCHED`      | ✓           | `MARKET`      |
| `LIMIT_IF_TOUCHED`       | ✓           | `LIMIT`       |
| `TRAILING_STOP_MARKET`   | ✓           | `MARKET`      |
| `TRAILING_STOP_LIMIT`    | ✓           | `LIMIT`       |

### 查询（Querying）

在编写策略时，可能需要获知系统中 emulated orders 的状态，以下为几种查询方式：

#### 通过 Cache

`Cache` 提供的相关方法包括：

- `self.cache.orders_emulated(...)`：返回当前所有被模拟的订单；
- `self.cache.is_order_emulated(...)`：检查某个特定订单是否为模拟订单；
- `self.cache.orders_emulated_count(...)`：返回被模拟订单的数量。

更多细节请参阅完整的 [API 参考](../api_reference/cache)。

#### 直接查询订单对象

也可以直接在订单对象上查询：

- `order.is_emulated`

若上述任一查询返回 `False`，则说明该订单已从 `OrderEmulator` 中释放，或从未为 emulated order。

:::warning
不建议持有对 emulated order 的本地对象引用，因为该对象在释放时会被转换。应依赖用于查询与跟踪的 `Cache`。
:::

### 持久化与恢复

如果运行中的系统在存在活跃 emulated orders 时崩溃或关闭，这些订单将在重启后从配置的缓存数据库中被重新加载到 `OrderEmulator`，确保持久化与恢复。

### 最佳实践

使用 emulated orders 时建议遵循以下最佳实践：

1. 始终使用 `Cache` 查询或跟踪 emulated orders，而非持有本地引用；
2. 了解 emulated orders 在释放时会转换为不同的订单类型；
3. 记住 emulated orders 在提交与释放时都会经过风控检查。

:::note
订单模拟使你即便在目标场所不支持高级订单类型时，也能使用这些工具，从而提高策略在不同场所之间的可移植性。
:::
