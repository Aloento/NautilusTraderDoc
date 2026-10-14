# 持仓

本文档介绍 NautilusTrader 中持仓的工作原理，包括持仓生命周期、从成交（fills）聚合、盈亏（PnL）计算，以及在 NETTING 类型 OMS 配置下用于保留历史状态的重要机制——持仓快照（position snapshotting）。

## 概述

持仓表示在某一交易工具（instrument）上的未平仓暴露。持仓用于汇总该工具的所有成交记录，并持续计算未实现盈亏、平均开仓价与当前敞口等关键指标，因此是追踪交易绩效与风险的核心对象。

系统在订单成交时自动创建持仓并跟踪其从打开到关闭的整个过程。平台通过 OMS（Order Management System）配置支持两种主要的持仓管理方式：NETTING（净额合并）和 HEDGING（对冲/独立持仓）。

## 持仓生命周期

### 创建

在首次成交时创建持仓：

- **NETTING OMS**：对每个交易工具在首次成交时创建一个持仓（每个 instrument 一条持仓）。
- **HEDGING OMS**：在出现新的 `position_id` 时创建持仓（同一 instrument 可存在多条持仓）。

持仓会记录：

- 开仓的订单和成交详情。
- 持仓方向（`LONG` 或 `SHORT`）。
- 初始数量与平均价格。
- 初始化与开仓的时间戳。

提示：在 actor/strategy 内可以通过缓存访问持仓，例如 `self.cache.position(position_id)` 或 `self.cache.positions(instrument_id=instrument_id)`。

### 更新

当后续发生更多成交时，持仓会：

- 聚合买卖成交的数量。
- 重新计算开仓与平仓的平均价格。
- 更新峰值数量（历史上达到的最大敞口）。
- 跟踪所有相关的订单 ID 与成交（trade）ID。
- 按币种累计手续费（commissions）。

### 关闭

当净持仓数量变为零（`FLAT`）时，持仓被视为已关闭。关闭时：

- 记录关闭订单 ID。
- 计算从开仓到关闭的持续时间。
- 计算最终的已实现盈亏（realized PnL）。
- 在 `NETTING` OMS 下，执行引擎会通过快照保留已关闭持仓的状态以维护历史 PnL（见“持仓快照”一节）。

## 成交聚合（Order fill aggregation）

持仓通过聚合成交记录来保持对市场敞口的准确视图。该聚合过程同时处理买卖双方的成交活动：

### 买入成交（Buy fills）

当发生 BUY 成交时：

- 增加多头敞口或减少空头敞口。
- 对开仓部分更新平均开仓价（avg entry price）。
- 对平仓部分更新平均平仓价（avg exit price）。
- 计算任何被平仓部分的已实现盈亏。

### 卖出成交（Sell fills）

当发生 SELL 成交时：

- 增加空头敞口或减少多头敞口。
- 对开仓部分更新平均开仓价。
- 对平仓部分更新平均平仓价。
- 计算任何被平仓部分的已实现盈亏。

### 净持仓计算

持仓维护一个 `signed_qty` 字段来表示净敞口：

- 正值表示 `LONG`（多头）。
- 负值表示 `SHORT`（空头）。
- 零表示 `FLAT`（无持仓，已平仓）。

```python
# 示例：持仓聚合
# 首次 BUY 100 手，价格 $50
signed_qty = +100  # 多头

# 后续 SELL 150 手，价格 $55
signed_qty = -50   # 现在变为空头

# 最后 BUY 50 手，价格 $52
signed_qty = 0     # 持仓平仓（FLAT）
```

## OMS 类型与持仓管理

NautilusTrader 支持两种主要的 OMS 类型，它们显著影响持仓的跟踪与管理方式。另有 `OmsType.UNSPECIFIED` 选项，会采用组件上下文的默认设置。更多细节见 [Execution guide](execution.md#order-management-system-oms)。

### `NETTING`

在 `NETTING` 模式下，同一交易工具的所有成交都会聚合到一个持仓：

- 每个 instrument ID 仅有一条持仓。
- 所有成交都会计入同一持仓。
- 随着净数量变化，持仓可能在 `LONG` 与 `SHORT` 之间反向。
- 已关闭的持仓状态通过历史快照得到保留。

### `HEDGING`

在 `HEDGING` 模式下，同一交易工具可以存在多条持仓：

- 可以同时存在多条 `LONG` 与 `SHORT` 持仓。
- 每条持仓都有唯一的 position ID。
- 各持仓独立跟踪。
- 不会自动在持仓间进行净额合并（netting）。

警告：使用 `HEDGING` 模式时需注意保证金要求会增加，因为每条持仓独立占用保证金。部分交易场所可能并不支持真正的 hedging，会在场内自动进行 netting。

### 策略层 vs 场所（venue） OMS

平台允许策略与场所使用不同的 OMS 配置：

| Strategy OMS | Venue OMS | 行为说明                                                |
| ------------ | --------- | ------------------------------------------------------- |
| `NETTING`    | `NETTING` | 策略和场所层面在每个 instrument 上均为单一持仓          |
| `HEDGING`    | `HEDGING` | 两层均支持多条持仓                                      |
| `NETTING`    | `HEDGING` | 场所层面维护多条持仓，Nautilus 在策略层维持单一虚拟持仓 |
| `HEDGING`    | `NETTING` | 场所层面为单一持仓，Nautilus 在策略层维护虚拟多持仓     |

提示：对于大多数交易场景，策略层与场所层保持 OMS 类型一致会简化持仓管理。只有在做自营交易台（prop desk）或与遗留系统对接时才常见需要覆盖配置。详情见 [Live guide](live.md)。

## 持仓快照（Position snapshotting）

持仓快照是 `NETTING` OMS 配置下的重要机制，用于在持仓关闭后保留其历史状态，从而确保 PnL 汇总与报告的准确性。

### 为什么需要快照

在 `NETTING` 系统中，当持仓关闭（变为 `FLAT`）后如果再次对同一工具开仓，原有的持仓对象会被重置以跟踪新的敞口。若不保存快照，之前周期的已实现 PnL 将丢失。

### 工作原理

当 `NETTING` 持仓关闭并随后对同一 instrument 有新的成交时，执行引擎会在重置持仓前对已关闭的持仓状态进行快照，保留：

- 最终的数量与价格信息。
- 已实现的 PnL。
- 所有的成交事件（fill events）。
- 手续费总额。

这些快照会按 position ID 存入缓存（cache）。随后持仓对象会重置用于记录新一轮周期，但历史快照仍然可访问。Portfolio 会将所有快照的 PnL 汇总，确保总计正确。

注意：此处的历史快照机制不同于可选的周期性持仓状态快照（`snapshot_positions`），后者用于遥测（telemetry）定期记录当前持仓状态。有关 `snapshot_positions` 与 `snapshot_positions_interval_secs` 的设置请参见 [Live guide](live.md)。

### 示例场景

```python
# NETTING OMS 示例
# 第 1 周期：开多头
BUY 100 units at $50   # 持仓打开
SELL 100 units at $55  # 持仓关闭，PnL = $500
# 引擎对该周期做快照，保留 $500 的已实现 PnL

# 第 2 周期：开空头
SELL 50 units at $54   # 持仓重新打开（空头）
BUY 50 units at $52    # 持仓关闭，PnL = $100
# 引擎对该周期做快照，保留 $100 的已实现 PnL

# 总已实现 PnL = $500 + $100 = $600（来自所有快照）
```

若无快照机制，只有最近一轮周期的 PnL 可用，从而导致错误的汇报与分析。

## 盈亏（PnL）计算

NautilusTrader 提供全面的 PnL 计算，兼顾不同合约类型和市场惯例。

### 已实现盈亏（Realized PnL）

在持仓部分或全部被平仓时计算已实现盈亏：

```python
# 对于常规合约
realized_pnl = (exit_price - entry_price) * closed_quantity * multiplier

# 对于反向合约（inverse instruments，需考虑方向）
# 多头（LONG）： realized_pnl = closed_quantity * multiplier * (1/entry_price - 1/exit_price)
# 空头（SHORT）： realized_pnl = closed_quantity * multiplier * (1/exit_price - 1/entry_price)
```

引擎会根据持仓方向自动应用恰当的计算公式。

### 未实现盈亏（Unrealized PnL）

使用当前市场价格计算未实现盈亏。`price` 参数可以是任意参考价（bid、ask、mid、last 或 mark）：

```python
position.unrealized_pnl(last_price)  # 使用最后成交价
position.unrealized_pnl(bid_price)   # 对多头更保守的估值
position.unrealized_pnl(ask_price)   # 对空头更保守的估值
```

### 总盈亏（Total PnL）

总盈亏由已实现和未实现部分相加得到：

```python
total_pnl = position.total_pnl(current_price)
# 返回 realized_pnl + unrealized_pnl
```

### 货币相关注意事项

- PnL 以合约的结算货币（settlement currency）计算。
- 对于外汇（Forex），通常为报价货币（quote currency）。
- 对于反向合约，PnL 可能以基础货币（base currency）计价。
- Portfolio 会按结算货币对各合约的已实现 PnL 进行汇总。
- 多货币的总计需要在 Position 类外部进行货币转换。

## 手续费与成本（Commissions and costs）

持仓会跟踪所有交易成本：

- 手续费按币种累计。
- 每笔成交的手续费会加入运行总额。
- 支持多种手续费币种。
- 仅当手续费以结算货币计价时才会计入已实现 PnL。
- 其它币种的手续费会单独记录，可能需要转换后合并。

```python
commissions = position.commissions()
# 返回一个 list[Money]，按币种汇总的手续费

notional = position.notional_value(current_price)
# 返回以报价货币（standard）或基础货币（inverse）计价的 Money
```

限制：

- 如果反向合约没有设置 `base_currency` 将导致 panic（运行时错误）。
- 不支持 quanto 合约（对于 quanto，函数会返回报价货币而非结算货币）。
- 对于 quanto 合约，建议使用 `instrument.calculate_notional_value()`。

## 持仓属性与状态

### 标识符

- `id`：持仓唯一标识符。
- `instrument_id`：交易工具标识。
- `account_id`：持仓所属账户。
- `trader_id`：持仓所属交易员。
- `strategy_id`：管理该持仓的策略。
- `opening_order_id`：开仓时的客户端订单 ID。
- `closing_order_id`：平仓时的客户端订单 ID。

### 持仓状态

- `side`：当前持仓方向（`LONG`、`SHORT` 或 `FLAT`）。
- `entry`：当前开仓方向（`Buy` 对应 `LONG`，`Sell` 对应 `SHORT`）。在持仓反向时会更新。
- `quantity`：当前绝对持仓数量。
- `signed_qty`：带符号的持仓数量（多头为正、空头为负）。
- `peak_qty`：持仓生命周期内达到的最大数量。
- `is_open`：是否处于打开状态。
- `is_closed`：是否已关闭（`FLAT`）。
- `is_long`：是否为多头。
- `is_short`：是否为空头。

### 估值与定价

- `avg_px_open`：平均开仓价。
- `avg_px_close`：持仓关闭时的平均平仓价。
- `realized_pnl`：已实现盈亏。
- `realized_return`：已实现收益率（小数，例如 0.05 表示 5%）。
- `quote_currency`：报价货币。
- `base_currency`：基础货币（如适用）。
- `settlement_currency`：用于 PnL 结算的货币。

### 合约规格

- `multiplier`：合约乘数。
- `price_precision`：价格的小数位精度。
- `size_precision`：数量的小数位精度。
- `is_inverse`：是否为反向合约。

### 时间戳

- `ts_init`：持仓初始化时间。
- `ts_opened`：持仓开仓时间。
- `ts_last`：最后一次更新的时间戳。
- `ts_closed`：持仓关闭时间。
- `duration_ns`：从开仓到关闭的持续时间（纳秒）。

### 关联数据

- `symbol`：交易工具的代码（ticker）。
- `venue`：交易场所（venue）。
- `client_order_ids`：与持仓相关的所有客户端订单 ID。
- `venue_order_ids`：与持仓相关的所有场所订单 ID。
- `trade_ids`：来自场所的所有成交/交易 ID。
- `events`：应用到持仓的所有成交事件。
- `event_count`：已应用成交事件的总数。
- `last_event`：最近一次成交事件。
- `last_trade_id`：最近一次成交的 trade ID。

信息：有关完整的类型信息与属性文档，请参见 Position 的[API 参考](../api_reference/model/position.md#class-position)。

## 事件与追踪

持仓保留完整的事件历史：

- 所有订单成交事件按时间顺序存储。
- 跟踪关联的客户端订单 ID。
- 保存来自场所的成交 ID。
- `event_count` 表示已应用的成交总数。

这些历史数据支持：

- 详细的持仓分析。
- 交易对账（reconciliation）。
- 绩效归因（performance attribution）。
- 审计追踪。

提示：使用 `position.events` 可以访问完整的成交历史以便对账；`position.trade_ids` 有助于与券商流水进行匹配。更多对账最佳实践见 [Execution guide](execution.md)。

## 数值精度

持仓计算在 PnL 与平均价格计算中使用 64 位浮点（`f64`）。尽管 `Price`、`Quantity`、`Money` 等定点（fixed-point）类型在配置的小数位下能保证精度，但内部计算为提高性能与避免溢出会转换为 `f64`。

### 设计理由

平台在持仓计算中采用 `f64` 平衡性能与精度：

- 浮点运算比任意精度算术（arbitrary-precision）更快。
- 即便是 128 位整数，相乘仍有溢出风险。
- 每次计算都从精确的定点值开始，以避免累计误差。
- IEEE-754 双精度提供大约 15 位十进制有效数字。

### 已验证的精度特性

测试表明 `f64` 在典型交易场景中能保持足够的精度：

- 标准金额：对于 ≥ 0.01 的常规货币金额无精度损失。
- 高精度工具：9 位小数的加密货币价格在 1e-6 范围内保持精度。
- 连续成交：100 次成交无累计漂移（手续费精度保持到 1e-10）。
- 极端价格：可处理从 0.00001 到 99,999.99999 的范围而不发生溢出。
- 来回成交：以相同价格开平仓产生的 PnL 精确（仅手续费造成差异）。

有关实现细节，请参见 `crates/model/src/position.rs` 中的 `test_position_pnl_precision_*` 测试。

注意：若需满足监管合规或审计要求并要求精确十进制运算，可考虑在外部使用 `Decimal` 等库类型。极小金额（低于 `f64` 的机器精度 ~1e-15）可能被舍入为零，但对于现实的交易场景影响甚微。

## 与其它组件的集成

持仓与下列关键组件交互：

- **Portfolio**：汇总来自不同工具与策略的持仓。
- **ExecutionEngine**：由成交事件创建并更新持仓。
- **Cache**：存储持仓状态与快照。
- **RiskEngine**：监控持仓限额与敞口。

注意：对价差（spread）类合约通常不创建持仓。尽管或有联动订单（contingent orders）仍可触发，但这些在逻辑上不与普通持仓关联。引擎会对价差合约采用与常规合约不同的处理方式。

## 总结

持仓是 NautilusTrader 追踪交易活动与绩效的核心。理解持仓如何聚合成交、计算盈亏并应对不同 OMS 配置，对于构建稳健的交易策略至关重要。NETTING 模式下的持仓快照机制确保了历史盈亏的准确保留，而详尽的事件历史则支持深入分析与对账。
