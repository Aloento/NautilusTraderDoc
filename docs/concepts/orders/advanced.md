# 高级订单 {#advanced-orders}

订单列表（order list）把相关订单归组，或有元数据（contingency metadata）描述成交、取消或更新
应如何影响关联订单。处理列表的组件决定实际行为：回测撮合引擎、本地订单仿真器、实时适配器和交易
场所，或策略代码。

:::warning
`OrderList` 或 `ContingencyType` 并不能保证所有实时适配器或交易场所实现了该关系。依赖原生或有
行为前，先检查目标集成。
:::

## 订单列表 {#order-lists}

订单列表把或有订单或更大的批次归入同一个 `order_list_id`。列表中的订单不必须有或有关系，
是否有关系由订单自身的元数据定义。

生产环境的构造函数要求列表中的每个订单使用同一交易场所。订单可以面向该场所的不同工具，
如配对、日历价差或多腿策略。

列表的代表 `instrument_id` 取自第一个订单。需要真实工具的调用方必须逐个解析每个订单。

**混合工具的注意事项**：

- **交易前检查**：价格精度、数量精度和 GTD 到期使用各订单自己的工具。
- **累计风险检查**：可用余额、名义价值边界、减仓敞口和行情数据使用列表的代表工具。对混合列表，
  这只会得到单一工具的边界，而非按工具的精确结果。
- **缓存查找**：`cache.order_lists(instrument_id=...)` 按代表 `instrument_id` 过滤。包含其他工具
  的列表不会匹配针对那些工具的查询。
- **持仓 ID**：传入 `position_id` 时，执行引擎会拒绝混合工具列表（持仓属于单一工具，与 OMS 无关）。
- **适配器批处理**：`submit_order_list` 的实现各不相同。有的按腿逐个迭代订单，用每个订单自己的
  `instrument_id` 解析交易场所 API；有的仍围绕列表的代表 `instrument_id` 构建批量请求，会把非首位
  订单路由错误。混合工具列表要按适配器区别对待，依赖前先验证目标适配器的行为。回测和策略管理的
  路由不依赖适配器的混合工具批处理行为。

## 或有类型 {#contingency-types}

- **OTO（One-Triggers-Other，一触发他）**：父订单在满足配置的成交条件后释放一个或多个子订单。
- **OCO（One-Cancels-Other，一取消他）**：一个关联订单成交后，请求取消其他订单。
- **OUO（One-Updates-Other，一更新他）**：一个关联订单成交后，请求更新其他订单的数量。

:::info
这些类型对应 FIX
[`ContingencyType <1385>`](https://www.onixs.biz/fix-dictionary/5.0.sp2/tagnum_1385.html)。
:::

### 策略管理的或有关系 {#strategy-managed-contingencies}

启用 `StrategyConfig.manage_contingent_orders` 后，策略会管理非活动本地订单的未完成 OTO、OCO
和 OUO 关系。策略通过常规执行路径发出由此产生的取消和数量更新命令，然后再调用具体的和汇总的
用户订单事件处理器。

活动本地订单始终由 `OrderEmulator` 管理。因此启用策略管理不会让策略和仿真器管理同一个订单。

该选项管理已经处于 open 状态的非活动本地订单。它不会增加交易场所的原生支持，也不会提交
非活动本地的 OTO 子订单。

### One-Triggers-Other (OTO) {#one-triggers-other-oto}

**OTO 时序**：OTO 关系包含两个部分。

1. 父订单进入其执行路径。
1. 一个或多个子订单引用父订单，等待配置的释放条件。

处理器决定子订单在哪里等待。回测引擎可以在本地持有它们。实时适配器可能发送交易场所原生指令、
提交所有腿、拒绝整个列表，或要求策略自行管理该关系。

#### 子订单数量 {#child-sizing}

在父订单首次成交之前，策略管理会把父订单的数量更新传播给处于 open 状态、非活动本地的 OTO
子订单。

开始成交后，每个父订单事件都以父订单的累计成交数量作为子订单目标的起点。对执行派生（execution
spawn），该数量包含派生中每个订单的成交。

**持仓关联的数量计算**：对与持仓关联的父订单，管理器随后按顺序调整目标。

1. 对非价差父订单且子订单为 reduce-only 的情况，将总目标限制在子订单已成交数量加上当前
   [经佣金调整的](./../positions.md#base-currency-commissions)持仓数量之内。这使子订单的剩余数量
   不超过未平仓头寸。
1. 将总目标向下取整到子订单工具数量步长的整数倍。
1. 若配置允许，将舍入后低于子订单工具最小数量的目标按零处理。

**未覆盖的余量**：上述计算不会舍入持仓或账户状态。若剩余持仓太小，无法满足子订单工具的数量步长
和可选最小数量，它将保持未平仓，且没有 reduce-only 子订单覆盖。

价差父订单跳过持仓上限，因为执行引擎不会为它们创建持仓。非 reduce-only 子订单同样跳过该上限。
两者仍会使用子订单工具的数量规则。

#### 数量计算的必要状态 {#required-sizing-state}

**计算前提**：当成交事件、缓存的父订单或已成交的执行派生兄弟订单识别出某个持仓时，数量计算
需要以下条件。

- 缓存中存在父订单和子订单的工具。
- 子订单工具的数量步长为正。
- 对非价差父订单且子订单为 reduce-only 的情况，缓存中存在关联持仓。
- 成交事件与缓存持仓 ID 同时存在时，两者必须一致。

成交事件的持仓 ID 与缓存归属冲突时，该父订单事件停止处理。其他缺失的计算状态会让受影响的子订单
保持不变，处理继续作用于其余关联子订单。

#### 子订单生命周期 {#child-lifecycle}

**目标应用**：父订单事件根据子订单和父订单的状态应用经过校验的目标。

| 条件                                                       | 动作                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------- |
| 被管理子订单有一个不同的正目标                             | 更新其总数量。                                             |
| 目标为零且父订单或执行派生仍处于活动状态                   | 子订单保持不变，等待可执行数量。                           |
| 目标为零且父订单或执行派生关闭                             | 取消子订单。                                               |
| 子订单成交量达到或超过正目标                               | 取消所有剩余数量。                                         |
| 活动本地子订单达到可执行的正目标                           | 活动本地仿真器提交它一次。                                 |

子订单的成交或更新不会立即重算目标，下一次父订单事件才会刷新它。

#### 触发模型 {#trigger-models}

| 触发模型        | 回测释放条件                                                              |
| ------------- | ------------------------------------------------------------------------- |
| **Partial**   | 父订单首次部分成交后释放子订单。                                          |
| **Full**      | 父订单累计成交达到其全部数量后释放子订单。                                |

:::info
`BacktestVenueConfig` 的默认模式是 `OtoTriggerMode.PARTIAL`。把 `oto_trigger_mode` 设为
`OtoTriggerMode.FULL` 可等待完全成交。该设置只控制释放时机，不保证子订单按比例分配数量。
父订单部分成交时，请核对子订单数量。
:::

启用 `support_contingent_orders` 后，回测交易场所在为每个子订单定量时，视其覆盖父订单的全部数量。
父订单被修改或关闭时，每个子订单的剩余数量覆盖父订单仍可持有的部分，不包括各子订单之间已经成交
的部分。

**父订单容量**：

- 工作期间为其数量。
- 被取消、到期或被缩减到已成交数量后，为其已成交数量。

**子订单生命周期**：在同一启用设置下，修改只在提高父订单数量时才会扩大子订单；关闭父订单只会
缩小子订单。

- 已释放的子订单继续为父订单的已成交数量工作。无事可覆盖的子订单会被取消。
- 将父订单缩减到已成交数量即完成它。因此 `OtoTriggerMode.FULL` 会在该数量下释放持有中的子订单。
  某子订单在释放时成交后，其余子订单只需覆盖它未成交的部分。
- 取消或使父订单到期会取消持有中的子订单。因此在 `OtoTriggerMode.FULL` 下，以这种方式关闭的
  部分成交父订单，其已有成交将没有子订单跟随。

**数量单位**：交易场所以父订单的单位比较数量。

- 若父订单数量以基础货币计，仍持计价数量的子订单按基础数量比较。换算先使用其价格，缺失时使用
  触发价；两者都没有时，使用父订单订单簿中卖出对应的最优买价或买入对应的最优卖价。交易场所为其
  定量之后，以及父订单按上述方式关闭时，该基础数量会被保持，后续换算不会使其超过父订单的成交量。
  若没有任何可用的价格，则不为其定量。
- 仍持计价数量的父订单（例如成交时转换为市价的止损单），只对有计价数量的子订单定量。
- 反向工具没有计价换算，数量按原样比较。
- 位于其他工具上的子订单按一比一覆盖父订单数量。一旦其自身工具的引擎撮合它，其仍需覆盖的数量
  会向下取整到该工具的数量精度。此时，计价数量只按该工具自身换算，且仅使用它自己的价格或触发价。

Reduce-only 子订单在这些事件之间也会跟踪持仓，见
[回测 reduce-only 定量](#backtest-reduce-only-resizing)。

Reduce-only 的 OTO 子订单在父订单成交使其释放时定量，后续父订单成交时再次定量。等待缓存投递的
成交计入可用持仓数量。当
[OHLC 价格模拟](./../backtesting/bar-execution.md#ohlc-price-simulation)的后续步骤到达其匹配价格时，
已释放的出场订单可以在同一根 Bar 内成交。

#### 在策略代码中强制全量成交触发 {#enforcing-a-full-fill-trigger-in-strategy-code}

**全量成交回退方案**：若执行环境不提供所需的全量成交行为，按以下步骤处理。

1. 提交不带或有子订单的父订单。
1. 处理父订单的 `OrderFilled` 事件。
1. 确认父订单已达到 `FILLED` 状态。
1. 提交止损、止盈或其他子订单。

:::warning
全量成交释放意味着在父订单完成之前，部分成交的持仓没有其或有出场订单。部分成交释放可缩短这段
延迟。回测中，启用强制跟踪的 reduce-only 子订单会跟踪可用持仓数量，并受父订单上限约束。其他
子订单不会自动跟随每次部分成交。在把子订单当作完整保护之前，先检查数量和适配器行为。
:::

### One-Cancels-Other (OCO) {#one-cancels-other-oco}

**取消的归属**：OCO 的取消行为取决于处理该关系的组件。

- **回测本地撮合**：某个 OCO 订单全部或部分成交后，会尽力发出取消其他 open 兄弟订单的请求。
- **本地订单管理器**：仅在兄弟订单仍处于活动本地时应用该行为。
- **启用策略管理**：策略会为处于 open 状态、非活动本地的兄弟订单请求取消。否则，取消行为由
  适配器或交易场所决定。

另一个兄弟订单可能在取消完成前成交。

### One-Updates-Other (OUO) {#one-updates-other-ouo}

#### 兄弟订单成交后的更新 {#updates-after-a-sibling-fill}

**兄弟目标**：在回测本地撮合中，某个 OUO 订单成交后，以该订单的剩余数量作为每个 open 兄弟订单
的目标。

- 若目标为零，或兄弟订单的已成交数量已达到目标，取消该兄弟订单。
- 否则，在需要时更新兄弟订单的数量。

该行为适合同规模的平级订单，不会在起始数量不等时保持比例。启用策略管理后，策略对处于 open 状态、
非活动本地的兄弟订单应用相同的更新或取消行为。否则，实时行为取决于适配器和交易场所的支持。

#### 回测 reduce-only 定量 {#backtest-reduce-only-resizing}

启用 reduce-only 强制跟踪后，一次成交可以把挂着的 reduce-only 订单调整为可用持仓数量，并受父订单
上限约束。

**合格兄弟订单**：同时启用或有订单支持时，被定量的 OUO 订单会把其剩余数量传播给同时满足两个条件
的兄弟订单。

- 处于 open 状态且非活动本地。
- 挂在同一工具订单簿上的被动订单。

**兄弟数量**：兄弟订单不必是 `reduce_only`。每个兄弟订单的数量更新遵循以下规则。

- 将兄弟订单此前的成交量加上被传播的剩余数量，得到其总数量。
- 应用兄弟订单自己的缓存父订单的已成交数量上限（可用时）。
- 总数量永远不低于兄弟订单此前的成交量。

已在成交中的订单保留其活动成交循环的数量规则。该传播本身不会触发撮合。

定量的结果以基础货币计。仍持计价数量的订单（例如未触发的止损单）以基础货币接受定量结果，
其触发时不会再换算一次。反向工具没有计价换算，订单保留其数量单位。

#### 回测零容量时的取消 {#backtest-cancellation-at-zero-capacity}

**零容量**：同时启用 reduce-only 强制跟踪和或有订单支持时，应用以下规则。

- reduce-only 订单没有剩余容量时，取消它及其合格兄弟订单，不对兄弟订单定量。这也覆盖确认事件
  仍在等待投递的兄弟订单。
- 兄弟订单仅耗尽自己父订单的额度时，将其调整为已成交数量，然后取消。

## 构建或有订单 {#constructing-contingent-orders}

使用 `OrderFactory.bracket` 构建括号订单的或有元数据。

**归组已有订单**：

- **Rust**：`self.order().create_list(...)` 为分组分配一个新的 `order_list_id`。
- **Python**：把普通列表传给 `self.submit_order_list(...)`，需要时它会创建 `OrderList`。

**校验限制**：这些归组路径不会创建父订单或关联关系。模型只校验剩余一致性中的一部分。

- 或有订单必须至少有一个 `linked_order_id`。
- 子订单通过 `parent_order_id` 标识其父订单。
- Rust 的 `create_list` 要求非空列表，且订单使用同一交易场所。
- 策略提交列表时，`OrderList.validate` 检查客户端订单 ID 非空且唯一。
- `OrderList.validate` 不校验共享的 `order_list_id` 值、父订单引用或其他跨字段关系。

修改、取消和拒绝行为取决于管理该或有关系的组件。不要假设父订单的更新或取消在所有实时集成中都会
级联生效。

:::warning
为每一腿处理 `OrderDenied` 和 `OrderRejected` 事件。适配器或交易场所故障可能独立影响各腿，
使持仓失去预期保护。
:::

## 括号订单 {#bracket-orders}

括号订单把入场订单与止盈、止损子订单组合。默认情况下，`OrderFactory.bracket` 创建一个 `MARKET`
入场订单、一个 `LIMIT` 止盈和一个 `STOP_MARKET` 止损。它把入场订单标记为 `OTO` 或有类型，两个
出场订单都标记为 `reduce_only`，出场订单之间以 `OUO` 或有类型关联。默认的 `LIMIT` 止盈同时是
`post_only`。

工厂负责创建订单及其关系元数据。执行环境决定子订单在本地等待、使用交易场所原生指令、与父订单
一起进入交易场所，还是需要策略手工处理。

使用
[`OrderFactory`](https://nautilustrader.io/docs/python-api-latest/common.html#nautilus_trader.common.OrderFactory)
创建括号订单，它还支持不同的入场和出场类型、触发设置与执行指令。

**示例**：为买入 10 手 ETHUSDT-PERP 合约的 *Market* 入场订单加括号。止盈用 3,300 USDT 的
*Limit* 订单，止损用触发价 2,800 USDT 的 *Stop-Market* 订单。

```rust tab="Rust"
use nautilus_model::{
    enums::OrderSide,
    identifiers::InstrumentId,
    types::{Price, Quantity},
};

// `bracket()` returns a `bon` builder; finalize with `.call()`.
// The result is a `Vec<OrderAny>` ordered as [entry, stop-loss, take-profit].
let orders = self
    .order()
    .bracket()
    .instrument_id(InstrumentId::from("ETHUSDT-PERP.BINANCE"))
    .order_side(OrderSide::Buy)
    .quantity(Quantity::from(10))
    .tp_price(Price::from("3300.00"))         // take-profit LIMIT (default)
    .sl_trigger_price(Price::from("2800.00")) // stop-loss STOP_MARKET (default)
    .call();
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity

orders = self.order_factory.bracket(
    instrument_id=InstrumentId.from_str("ETHUSDT-PERP.BINANCE"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(10),
    tp_price=Price.from_str("3300.00"),  # <-- take-profit LIMIT (default)
    sl_trigger_price=Price.from_str("2800.00"),  # <-- stop-loss STOP_MARKET (default)
)
```

:::warning
有些交易场所会为括号订单的各腿预留保证金。检查交易场所的保证金规则，并处理入场订单成交后
子订单被拒绝的情况。
:::

## 相关指南 {#related-guides}

- [订单](./index.md) - 订单概念、执行指令与订单工厂。
- [仿真订单](./emulated.md) - 在不原生支持的交易场所上仿真订单类型。
- [执行](./../execution/index.md) - 订单执行与成交处理。
