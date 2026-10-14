# 持仓

本指南说明 NautilusTrader 如何由订单成交创建和更新持仓、如何计算盈亏（PnL），
以及在 `NETTING` 订单管理系统（OMS）下如何保留已结束的周期。

## 概览 {#overview}

持仓记录一个开-平周期内对某工具的敞口。它汇总分配到同一持仓 ID 的成交，
跟踪数量、均价、已实现盈亏、手续费与相关标识。配合市场价调用持仓的方法，
可计算未实现盈亏与名义价值。

执行引擎在订单成交时创建持仓，并从开仓跟踪到平仓。OMS 配置决定成交
是汇入一个净持仓，还是留在各自独立的对冲持仓中。

## 持仓生命周期 {#position-lifecycle}

### 创建 {#creation}

首笔成交开出一个持仓：

- **NETTING OMS**：某工具与策略的首笔成交即开仓，持仓使用确定性 ID
  `{instrument_id}-{strategy_id}`。
- **HEDGING OMS**：新 `position_id` 的首笔成交开仓（同一工具可有多个持仓）。

持仓记录：

- 开仓订单与成交明细。
- 开仓方向（`BUY` 或 `SELL`）。
- 计入开仓成交后的数量与平均开仓价。
- 初始化与开仓时间戳。

:::tip
在 actor/策略内可通过缓存访问持仓：`self.cache.position(position_id)` 或
`self.cache.positions(instrument_id=instrument_id)`。
:::

### 更新 {#updates}

后续成交发生时，持仓会：

- 汇总买卖成交的数量。
- 重算平均开仓价与平仓价。
- 更新当前周期的峰值数量。
- 跟踪当前周期的订单 ID 与成交 ID。
- 按币种累计手续费。

### 平仓 {#closure}

**净数量归零**（`FLAT`）时持仓平仓。平仓时：

- 记录平仓订单 ID；到期结算产生的平仓该字段为空。
- 计算从开仓到平仓的时长。
- 计算最终已实现盈亏。
- 无论哪种 OMS，该持仓日后以同一 ID 重新开仓时，引擎会先快照已平仓状态
  以保留历史盈亏（见[持仓快照](#position-snapshotting)）。

### 到期结算 {#settlement-at-contract-expiration}

实时节点中，`CONTRACT_EXPIRED` 类型的 `InstrumentClose` 只在节点执行客户端
所服务的场所上结算二元期权持仓。满足该条件时，它按收盘价结算该工具的每个
未平仓持仓（获胜结果为 `1`，落败结果为 `0`）。对每个持仓，执行引擎：

- 按收盘价结束当前周期，不创建订单或成交。
- 为结算数量入账已实现盈亏。成交数量与手续费保持成交时的状态，
  因此开仓手续费留在已实现盈亏中。
- 发出不带平仓订单 ID 的一条 `PositionClosed`。

对某工具应用的第一个收盘指令具有权威性。重复或冲突的收盘，或恢复了已结算
持仓的重启，都不会再次结算。结算之后，该工具的成交或成交撤销仍会更新订单，
但不再改变持仓；引擎记录一条警告，不发出持仓事件。

结算不赎回场所资产，也不改变账户余额。现金以场所账户报告为准，
未赎回的派息只有在场所报告赎回资金后才计入账户余额。

回测与沙箱模拟交易沿用模拟场所的到期处理：撮合引擎以到期成交平仓，
这些成交为模拟账户入账。若场所的执行客户端自行结算到期合约（沙箱客户端
即如此），实时节点不会对该场所应用引擎结算。

## 订单成交聚合 {#order-fill-aggregation}

持仓聚合订单成交，以保持准确的市场敞口视图。聚合过程处理交易活动的两侧：

### 买入成交 {#buy-fills}

BUY 订单成交时：

- 增加多头敞口或减少空头敞口。
- 开仓交易更新平均开仓价。
- 平仓交易更新平均平仓价。
- 对已平掉的部分计算已实现盈亏。

### 卖出成交 {#sell-fills}

SELL 订单成交时：

- 增加空头敞口或减少多头敞口。
- 开仓交易更新平均开仓价。
- 平仓交易更新平均平仓价。
- 对已平掉的部分计算已实现盈亏。

### 净持仓计算 {#net-position-calculation}

持仓维护 `signed_qty` 字段表示净敞口：

- 正值表示 `LONG` 持仓。
- 负值表示 `SHORT` 持仓。
- 零表示 `FLAT`（已平仓）持仓。

```python
# Example: Position aggregation
# Initial BUY 100 units at $50
signed_qty = +100  # LONG position

# Subsequent SELL 150 units at $55
signed_qty = -50  # Closes the LONG cycle and opens a SHORT cycle

# Final BUY 50 units at $52
signed_qty = 0  # Position FLAT (closed)
```

### 反手记账 {#reversal-accounting}

反向成交量超过现有持仓数量时，先平掉已有敞口，再以剩余数量朝另一方向开仓。
执行引擎把这笔成交拆为平仓加新开仓，平仓状态的保留规则见
[持仓快照](#position-snapshotting)。

若不拆分、直接把反手成交应用于同一个 `Position`，剩余敞口会开启新的记账段落。
该段落有这些重置（成交撤销重放时同样如此）：

- `avg_px_open` 变为反手成交价。
- `avg_px_close` 变为 `None`，`realized_return` 归零，直到后续出现平仓成交。
- `buy_qty` 与 `sell_qty` 重新开始：新入场侧只计开仓剩余量，另一侧为零，
  因此后续平仓均价不再包含前一方向的数量。

**只有平仓部分**按前一入场价实现盈亏。对象的 `realized_pnl` 与手续费合计
在反手中保持累计，成交的手续费只计一次。重置不清除成交历史、开仓时间戳
或峰值数量。若持仓先到达 `FLAT` 再被后续成交重开，则整个周期完全重置，
包括已实现盈亏与手续费。

这些段落重置只适用于成交驱动的反手。改变持仓方向的数量调整不做同样的重置。

## 持仓调整 {#position-adjustments}

持仓调整记录正常成交之外的数量或盈亏变化，系统以
`PositionAdjusted` 事件表示。

### 基础币种手续费 {#base-currency-commissions}

交易现货货币对（如 BTC/USDT）或外汇现货时，以基础币种支付的手续费
直接影响实收或实付数量：

- **开仓成交**：手续费从成交数量中扣除。买 1.0 BTC、手续费 0.001 BTC，
  净多头持仓为 0.999 BTC。
- **平仓成交**：手续费作用于 `signed_qty`，因为它影响实际库存。卖出
  0.999 BTC 的多头持仓、手续费 0.000999 BTC，结果不是 FLAT，而是空头
  0.000999 BTC——你总共交出了 0.999999 BTC。
- **反手**：手续费影响反手两侧的最终持仓规模。

:::note
基础币种手续费只适用于手续费币种与 `instrument.base_currency` 相同的
现货货币对与外汇现货工具。其他工具的手续费单独跟踪，不影响持仓数量。
:::

### 资金费支付 {#funding-payments}

资金费调整跟踪永续期货的周期性支付，不影响持仓数量。
其 `quantity_change = None`，可包含盈亏变化。

### 调整跟踪 {#adjustment-tracking}

持仓暴露其保留的调整记录：

- `position.adjustments()` 返回全部 `PositionAdjusted` 事件的列表。
- 每条调整包含其类型（`COMMISSION` 或 `FUNDING`）、数量或盈亏变化、
  原因、事件 ID 与时间戳。
- 已平仓持仓重新开仓时，当前调整历史被清空。
- `purge_events_for_order()` 之后，有成交的持仓会从幸存成交重新生成手续费
  调整，并重新应用非手续费调整。没有成交时，持仓变为空的 `FLAT` 外壳，
  清空调整历史。

## OMS 类型与持仓管理 {#oms-types-and-position-management}

NautilusTrader 支持两种持仓管理模式。配置为
`OmsType.UNSPECIFIED` 的策略使用其所属执行客户端的 OMS 类型。
归属解析与持仓 ID 规则见[执行指南](./execution/index.md#order-management-system-oms)。

### `NETTING` {#netting}

`NETTING` 模式下，每个工具与策略的成交聚合为单一持仓：

- 每个工具与策略一个持仓。
- 所有成交汇入同一持仓。
- 穿越零位的成交结束当前周期，并在反方向开启新周期。
- 历史快照保留已平仓状态。

### `HEDGING` {#hedging}

`HEDGING` 模式下，同一工具可有多个持仓：

- 可同时持有多个 `LONG` 与 `SHORT` 持仓。
- 每个持仓有唯一持仓 ID。
- 持仓独立跟踪。
- 持仓之间不自动轧差。
- 带新持仓 ID 的成交创建独立持仓。若后续成交复用了一个已平仓的持仓 ID，
  引擎在替换缓存状态前先归档已平仓周期。
- 虚拟持仓反手会创建新 ID 并在缓存中保留原已平仓持仓，
  因此该路径不需要已平仓周期快照。

虚拟反手后，同一订单的后续成交即使携带原持仓 ID，也归入目标持仓。
引擎从保留的订单与持仓历史推导目标，包括缓存恢复与成交撤销修正之后。
历史不完整或有歧义时，引擎拒绝这些成交。

即使设置 `carry_replay_events_on_reopen=False`，虚拟 `HEDGING` 持仓也总在
重开时保留重放历史，以保证持仓 ID 被复用时上述路由仍然成立。

:::warning
场所独立维护多空持仓时，`HEDGING` 可能提高保证金要求。
`NETTING` OMS 的场所只暴露其净持仓，即便 NautilusTrader 在本地
跟踪多个虚拟持仓。请核对场所的持仓模式与保证金规则。
:::

### 策略 OMS 与场所 OMS {#strategy-vs-venue-oms}

策略与场所的 OMS 类型可以不同：

| 策略 OMS | 场所 OMS | 结果                                                              |
| ------------ | --------- | ------------------------------------------------------------------- |
| `NETTING`    | `NETTING` | 每个工具与策略一个持仓。                           |
| `HEDGING`    | `HEDGING` | 每个工具与策略多个持仓。                     |
| `NETTING`    | `HEDGING` | 跨场所持仓的一个虚拟持仓。                    |
| `HEDGING`    | `NETTING` | 对应场所单一净持仓的多个虚拟持仓。 |

:::tip
除非策略需要虚拟持仓，否则让策略与场所的 OMS 类型保持一致。
场所的持仓模式配置见其集成指南。
:::

## 持仓快照 {#position-snapshotting}

持仓快照在后续成交重开已平仓持仓时，保留已结束周期用于盈亏跟踪与报告。

### 为什么需要快照 {#why-snapshotting-matters}

持仓平仓（`FLAT`）后以同一 ID 因新交易重开时，其对象会重置以跟踪新的敞口。
没有快照，上一周期的历史已实现盈亏就会丢失。

### 工作机制 {#how-it-works}

成交以同一 ID 重开已平仓持仓时，执行引擎先归档已平仓状态，再开启下一周期。
这对 `NETTING` 与 `HEDGING` OMS 均适用。使用非虚拟 ID 的
`HEDGING` 反手走另一条路径：直接复用 ID，不归档已平仓周期。

快照保留：

- 最终数量与价格。
- 已实现盈亏。
- 全部成交事件。
- 手续费合计。

缓存按持仓 ID 存储快照。活动缓存条目表示新周期，此前的快照仍可访问。
Portfolio 在工具合计中计入它们的已实现盈亏。

唯一的例外是修正早期周期成交的成交撤销：修正会移动已存快照描述的周期边界，
因此引擎用修正后历史实际结束的周期替换它们，保证每段只计一次。见
[NETTING 周期跨度的持仓重放](./execution/index.md#position-replay-across-netting-cycles)。

:::note
这种已平仓周期归档不同于可选的持仓状态快照：

- `snapshot_positions=True` 在持仓开仓、变化或平仓时发布状态。
- `snapshot_positions_interval_secs` 周期性发布所有未平仓持仓。

有 Redis 或 Postgres 支撑的缓存还会持久化这些快照。没有缓存支撑时，
两条路径只在进程内消息总线上发布快照而不持久化。这些设置见
[`LiveExecutionEngineConfig`](https://nautilustrader.io/docs/python-api-latest/live.html#nautilus_trader.live.LiveExecutionEngineConfig)。
:::

### 示例场景 {#example-scenario}

```text
# NETTING OMS Example
# Cycle 1: Open LONG position
BUY 100 units at $50   # Position opens
SELL 100 units at $55  # Position closes, PnL = $500
# Snapshot taken preserving $500 realized PnL

# Cycle 2: Open SHORT position
SELL 50 units at $54   # Position reopens (SHORT)
BUY 50 units at $52    # Position closes, PnL = $100
# Snapshot taken preserving $100 realized PnL

# Total realized PnL = $500 + $100 = $600 (from snapshots)
```

## 盈亏计算 {#pnl-calculations}

持仓的盈亏计算考虑工具规格与市场惯例。

### 已实现盈亏 {#realized-pnl}

已实现盈亏的价格部分在成交部分或全部平仓时计算，或在
[到期结算](#settlement-at-contract-expiration)平仓时计算。
持仓成本币种的手续费随每笔成交影响已实现盈亏。

```python
# For standard instruments
# LONG: realized_pnl = (exit_price - entry_price) * closed_quantity * multiplier
# SHORT: realized_pnl = (entry_price - exit_price) * closed_quantity * multiplier

# For inverse instruments (side-aware)
# LONG: realized_pnl = closed_quantity * multiplier * (1/entry_price - 1/exit_price)
# SHORT: realized_pnl = closed_quantity * multiplier * (1/exit_price - 1/entry_price)
```

持仓方向决定公式。期权费计价的反向工具（如币本位期权）的期权费以基础币种报价，
因此使用标准公式，盈亏与名义价值均以基础币种报告。

### 未实现盈亏 {#unrealized-pnl}

`unrealized_pnl()` 用传入的 `price` 为未平仓持仓计算盈亏，
可传买价、卖价、中间价、最新价或 mark 价：

```python
position.unrealized_pnl(last_price)  # Using last traded price
position.unrealized_pnl(bid_price)  # Conservative for LONG positions
position.unrealized_pnl(ask_price)  # Conservative for SHORT positions
```

`FLAT` 持仓无论传入什么价格都返回 `Money(0, cost_currency)`。

### 总盈亏 {#total-pnl}

`total_pnl()` 合并已实现与未实现两部分：

```python
total_pnl = position.total_pnl(current_price)
# Returns realized_pnl + unrealized_pnl
```

### 币种要点 {#currency-considerations}

- 盈亏以工具的成本币种计算：线性合约为计价币种，反向合约为基础币种，
  quanto 合约为结算币种。
- 外汇的成本币种通常是计价币种。
- Portfolio 按工具以成本币种汇总已实现盈亏。
- 多币种合计需要在 Position 类之外完成换算。

## 手续费与成本 {#commissions-and-costs}

持仓跟踪成交手续费：

- 手续费按币种累计。
- 每笔成交的手续费加入运行合计。
- 支持多种手续费币种。
- 已实现盈亏只在手续费与持仓成本币种一致时才将其计入。
- 其他币种的手续费单独跟踪，可能需要换算。

```python
commissions = position.commissions()
# Returns list[Money] with aggregated commission totals per currency

notional = position.notional_value(current_price)
# Returns Money in quote (linear), base (inverse), or settlement currency (quanto)
```

:::warning
Python 中，`notional_value()` 在下列条件下抛出 `ValueError`：

- 反向持仓没有基础币种。
- 非期权费计价的反向持仓传入的价格不为正。
- 结果无法表示为 `Money`。

Rust 调用方可以用 `try_notional_value()` 处理这些计算错误；
`notional_value()` 在计算失败时 panic。
:::

## 持仓属性与状态 {#position-properties-and-state}

### 标识 {#identifiers}

- `id`：持仓唯一标识。
- `instrument_id`：交易的工具。
- `account_id`：持有该持仓的账户。
- `trader_id`：持仓所属的 trader。
- `strategy_id`：管理该持仓的策略。
- `opening_order_id`：开仓的客户端订单 ID。
- `closing_order_id`：由成交平仓时的平仓客户端订单 ID。

### 持仓状态 {#position-state}

- `side`：当前持仓方向（`LONG`、`SHORT` 或 `FLAT`）。
- `entry`：当前周期的开仓方向（`LONG` 对应 `BUY`，`SHORT` 对应 `SELL`），
  持仓反手时更新。
- `quantity`：当前持仓绝对规模。
- `signed_qty`：带符号持仓规模（`LONG` 为正，`SHORT` 为负）。
- `peak_qty`：当前开-平周期中达到的最大数量。
- `is_open`：是否未平仓。
- `is_closed`：是否已平仓（`FLAT`）。
- `is_long`：方向是否为 `LONG`。
- `is_short`：方向是否为 `SHORT`。

### 价格与估值 {#pricing-and-valuation}

- `avg_px_open`：平均开仓价。
- `avg_px_close`：平仓时的平均平仓价。
- `realized_pnl`：已实现盈亏。
- `realized_return`：已实现收益率的小数形式（如 0.05 表示 5%）。
- `quote_currency`：工具的计价币种。
- `base_currency`：基础币种（如适用）。
- `settlement_currency`：盈亏结算币种。

未拆分成交反转单一持仓时，均价与收益率如何重置而已实现盈亏保持累计，
见[反手记账](#reversal-accounting)。

### 工具规格 {#instrument-specifications}

- `multiplier`：合约乘数。
- `price_precision`：价格小数精度。
- `size_precision`：数量小数精度。
- `is_inverse`：工具是否为反向类型。

### 时间戳 {#timestamps}

- `ts_init`：持仓初始化时间。
- `ts_opened`：开仓时间。
- `ts_last`：最后更新时间戳。
- `ts_closed`：平仓时间（若已平仓）。
- `duration_ns`：开仓到平仓的时长（纳秒），未平仓时为零。

### 关联数据 {#associated-data}

- `symbol`：工具的代码。
- `venue`：交易场所。
- `client_order_ids`：当前周期保留成交的去重客户端订单 ID。
- `venue_order_ids`：当前周期保留成交的去重场所订单 ID。
- `trade_ids`：当前周期保留成交的去重成交 ID。
- `events`：当前周期保留的订单成交事件。
- `adjustments`：当前周期保留的持仓调整。
- `event_count`：当前周期保留的成交事件数。
- `last_event`：最近保留的成交事件。
- `last_trade_id`：最近保留成交的成交 ID。

:::info
完整类型信息与详细属性文档见 Position
[API Reference](https://nautilustrader.io/docs/python-api-latest/model/position.html#nautilus_trader.model.Position)。
:::

## 事件与跟踪 {#events-and-tracking}

每个 `Position` 对象记录其当前开-平周期的成交与调整：

- 成交事件保持应用顺序。
- 客户端订单、场所订单与成交 ID 访问器返回排序去重的值。
- `event_count` 报告保留的成交事件数。
- 已平仓的 `NETTING` 周期在缓存快照中保留其事件历史，如上文所述。

这些数据支持：

- 持仓细粒度分析。
- 交易对账。
- 绩效归因。
- 审计线索。

:::tip
用 `position.events()` 访问当前周期保留的成交进行对账。
`position.trade_ids()` 的结果便于与券商账单核对。
对账最佳实践见[执行指南](./execution/index.md)。
:::

## 数值精度 {#numerical-precision}

`Position` 对带符号数量、均价、已实现收益率与盈亏中间值使用 `f64`。
`Price`、`Quantity`、`Money` 在 API 边界保持定点数表示，但这些类型与
`f64` 之间的换算可能引入舍入。

`f64` 只对 `2^53` 以内的整数精确表示，超出后换算会丢失低位。它提供约
15 到 16 位有效十进制数字，而不是固定位数的小数。

这一设计避免了任意精度算术的更高计算开销。均价计算也避免直接相乘原始
定点值，因为那些乘积可能溢出其整数表示。均价复用先前的 `f64` 平均值，
已实现盈亏在成交累积过程中于 `Money` 与 `f64` 之间换算。最终精度取决于
数值、结算币种精度与成交序列。

数值限制影响数量、反向盈亏与高精度成交：

- **数量**：`quantity` 由 `signed_qty` 按工具的 `size_precision` 派生。
  若该换算把残余数量舍入为零，持仓变为 `FLAT`，并把 `signed_qty` 归一为零。
- **反向盈亏**：非期权费计价工具的计算拒绝非正的开仓/平仓价，
  以及小于 `1e-15` 的正价。
- **DeFi 精度**：启用 `defi` feature 时，把超过 16 位小数的 `Price` 或
  `Quantity` 转换为 `f64` 会 panic，因此 `Position` 不支持
  17 或 18 位小数的成交值。

`crates/model/src/position.rs` 中的测试覆盖 0.01 USD 手续费、九位小数价格输入、
100 笔连续成交、`0.00001` 到 `99999.99999` 的价格以及同价往返。
这些用例不构成通用的精度界限。

:::warning
监管报告或审计记录需要精确十进制算术时，请从原始成交与调整另行做一次
十进制计算并保留该结果。把 `Position` 的浮点输出转回十进制（包括通过
`signed_decimal_qty()`）无法恢复已丢弃的精度。`Position`
不提供精确十进制的保证。请针对应用使用的工具、币种、金额范围与成交序列做验证。
:::

## 与其他组件的集成 {#integration-with-other-components}

持仓与若干关键组件交互：

- **Portfolio**：跨工具与策略聚合持仓敞口与盈亏。
- **ExecutionEngine**：由成交创建并更新持仓。
- **Cache**：存储当前持仓状态与已平仓周期快照。
- **RiskEngine**：检查订单是否减仓时读取未平仓持仓。

:::info
价差工具不创建持仓。条件订单仍可为价差触发，但不与持仓关联。
引擎把价差工具与常规持仓分开处理。
:::

## 相关指南 {#related-guides}

- [事件](./events/index.md)：成交如何产生持仓事件。
- [订单](./orders/index.md)：创建与修改持仓的订单。
- [执行](./execution/index.md)：更新持仓的成交处理。
- [组合](./portfolio.md)：组合级的持仓聚合。
