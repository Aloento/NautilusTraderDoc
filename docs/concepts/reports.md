# 报告

:::info
本指南正在完善中。
:::

本指南介绍 `ReportProvider` 类提供的组合分析与报告功能，说明这些报告如何用于 PnL（盈亏）记账以及回测后的结果分析。

## 概览

NautilusTrader 中的 `ReportProvider` 类可从交易数据生成结构化分析报告，将原始的订单、成交、持仓和账户状态转换为用于分析与可视化的 pandas DataFrame。这些报告对于理解策略表现、评估执行质量以及保证准确的 PnL 记账至关重要。

报告可以通过两种方式生成：

- **通过 Trader 的帮助方法（推荐）**：例如 `trader.generate_orders_report()` 这类便捷方法。
- **直接使用 `ReportProvider`**：当你需要更精细地选择或过滤数据时使用。

这些报告在回测与实盘环境中提供一致的分析结果，便于进行可靠的绩效评估与策略对比。

## 可用报告

`ReportProvider` 类提供了若干静态方法用于从交易数据生成报告。每个报告返回一个 pandas DataFrame，包含特定的列与索引，便于后续分析。

### Orders 报告

生成对所有订单的汇总视图：

```python
# 使用 Trader 的帮助方法（推荐）
orders_report = trader.generate_orders_report()

# 或者直接使用 ReportProvider
from nautilus_trader.analysis.reporter import ReportProvider
orders = cache.orders()
orders_report = ReportProvider.generate_orders_report(orders)
```

**返回 `pd.DataFrame`，包含列：**

| Column            | 说明                           |
| ----------------- | ------------------------------ |
| `client_order_id` | 索引——唯一订单标识。           |
| `instrument_id`   | 交易品种/合约。                |
| `strategy_id`     | 创建该订单的策略标识。         |
| `side`            | BUY 或 SELL。                  |
| `type`            | 订单类型：MARKET、LIMIT 等。   |
| `status`          | 当前订单状态。                 |
| `quantity`        | 原始订单数量（字符串）。       |
| `filled_qty`      | 已成交数量（字符串）。         |
| `price`           | 限价（若设置则为字符串）。     |
| `avg_px`          | 平均成交价（若设置为浮点数）。 |
| `ts_init`         | 订单初始化时间戳（纳秒）。     |
| `ts_last`         | 最近更新时间戳（纳秒）。       |

### Order fills 报告

提供已成交订单的汇总（每个订单一行）：

```python
# 使用 Trader 的帮助方法（推荐）
fills_report = trader.generate_order_fills_report()

# 或者直接使用 ReportProvider
orders = cache.orders()
fills_report = ReportProvider.generate_order_fills_report(orders)
```

该报告仅包含 `filled_qty > 0` 的订单，列与 Orders 报告相同，但仅保留已执行的订单。注意本报告中 `ts_init` 与 `ts_last` 会被转换为 datetime 以便分析。

### Fills 报告

列出每一次成交事件（每次成交一行）：

```python
# 使用 Trader 的帮助方法（推荐）
fills_report = trader.generate_fills_report()

# 或者直接使用 ReportProvider
orders = cache.orders()
fills_report = ReportProvider.generate_fills_report(orders)
```

**返回 `pd.DataFrame`，包含列：**

| Column            | 说明                       |
| ----------------- | -------------------------- |
| `client_order_id` | 索引——订单标识。           |
| `trade_id`        | 唯一的成交/填充标识。      |
| `venue_order_id`  | 交易所/场所分配的订单 ID。 |
| `last_px`         | 成交价格（字符串）。       |
| `last_qty`        | 成交数量（字符串）。       |
| `liquidity_side`  | MAKER 或 TAKER。           |
| `commission`      | 佣金金额与币种。           |
| `ts_event`        | 成交时间（datetime）。     |
| `ts_init`         | 初始化时间戳（datetime）。 |

### Positions 报告

包含快照在内的完整持仓分析：

```python
# 使用 Trader 的帮助方法（推荐）
# 对于 NETTING OMS，会自动包含历史快照
positions_report = trader.generate_positions_report()

# 或者直接使用 ReportProvider
positions = cache.positions()
snapshots = cache.position_snapshots()  # 针对 NETTING OMS
positions_report = ReportProvider.generate_positions_report(
    positions=positions,
    snapshots=snapshots
)
```

**返回 `pd.DataFrame`，包含列：**

| Column            | 说明                              |
| ----------------- | --------------------------------- |
| `position_id`     | 索引——唯一持仓标识。              |
| `instrument_id`   | 交易品种/合约。                   |
| `strategy_id`     | 管理该持仓的策略标识。            |
| `entry`           | 开仓方向（BUY 或 SELL）。         |
| `side`            | 持仓方向（LONG、SHORT 或 FLAT）。 |
| `quantity`        | 持仓数量。                        |
| `peak_qty`        | 达到的最大持仓规模。              |
| `avg_px_open`     | 开仓平均价。                      |
| `avg_px_close`    | 平仓平均价（若已平仓）。          |
| `realized_pnl`    | 已实现盈亏。                      |
| `realized_return` | 已实现收益率（百分比）。          |
| `ts_opened`       | 开仓时间（datetime）。            |
| `ts_closed`       | 平仓时间（datetime 或 NA）。      |
| `duration_ns`     | 持仓持续时长（纳秒）。            |
| `is_snapshot`     | 是否为历史快照。                  |

### Account 报告

跟踪账户余额与保证金随时间的变化：

```python
# 使用 Trader 的帮助方法（推荐）
# 需要传入 venue 参数
from nautilus_trader.model.identifiers import Venue
venue = Venue("BINANCE")
account_report = trader.generate_account_report(venue)

# 或者直接使用 ReportProvider
account = cache.account(account_id)
account_report = ReportProvider.generate_account_report(account)
```

**返回 `pd.DataFrame`，包含列：**

| Column          | 说明                            |
| --------------- | ------------------------------- |
| `ts_event`      | 索引——账户状态变更时间。        |
| `account_id`    | 账户标识。                      |
| `account_type`  | 账户类型（例如 SPOT、MARGIN）。 |
| `base_currency` | 账户基础币种。                  |
| `total`         | 总余额。                        |
| `free`          | 可用余额。                      |
| `locked`        | 被订单锁定的余额。              |
| `currency`      | 余额的币种。                    |
| `reported`      | 是否为交易所上报的余额。        |
| `margins`       | 保证金信息（如适用）。          |
| `info`          | 其他交易所/场所特有的信息。     |

## PnL（盈亏）记账注意事项

准确的 PnL 记账需要对若干因素进行仔细考虑：

### 基于持仓的 PnL

- **已实现 PnL（Realized PnL）**：在持仓部分或全部平仓时计算。
- **未实现 PnL（Unrealized PnL）**：使用当前市价进行标记（mark-to-market）。
- **佣金影响**：仅在以结算币种计量时计入。

:::warning
Pnl 计算依赖于 OMS 类型。在 `NETTING` 模式下，持仓快照会在持仓重新打开时保留历史 PnL。为保证总 PnL 的准确性，务必在报告中包含快照数据。
:::

### 多币种记账

处理多种货币时：

- 每个持仓以其结算币种跟踪 PnL。
- 投资组合汇总需要进行货币转换。
- 佣金的币种可能与结算币种不同。

```python
# 遍历持仓以获取 PnL
for position in positions:
    realized = position.realized_pnl  # 以结算币种计量
    unrealized = position.unrealized_pnl(last_price)

    # 处理多币种合并（示例）
    # 注意：货币转换需要用户提供汇率
    if position.settlement_currency != base_currency:
        # 从你的数据源获取转换率并应用
        # rate = get_exchange_rate(position.settlement_currency, base_currency)
        # realized_converted = realized.as_double() * rate
        pass
```

### 快照（Snapshot）注意事项

对于 `NETTING` OMS 配置：

```python
from nautilus_trader.model.objects import Money

# 按币种汇总完整 PnL（包括快照）
pnl_by_currency = {}

# 累加当前持仓的已实现 PnL
for position in cache.positions(instrument_id=instrument_id):
    if position.realized_pnl:
        currency = position.realized_pnl.currency
        if currency not in pnl_by_currency:
            pnl_by_currency[currency] = 0.0
        pnl_by_currency[currency] += position.realized_pnl.as_double()

# 累加历史快照中的已实现 PnL
for snapshot in cache.position_snapshots(instrument_id=instrument_id):
    if snapshot.realized_pnl:
        currency = snapshot.realized_pnl.currency
        if currency not in pnl_by_currency:
            pnl_by_currency[currency] = 0.0
        pnl_by_currency[currency] += snapshot.realized_pnl.as_double()

# 为每个币种创建 Money 对象
total_pnls = [Money(amount, currency) for currency, amount in pnl_by_currency.items()]
```

## 回测结束后的分析（Backtest post-run analysis）

回测完成后，可以通过多种报告与投资组合分析器对结果进行深入分析。

### 访问回测结果

```python
# 回测完成后
engine.run(start=start_time, end=end_time)

# 使用 Trader 的帮助方法生成报告
orders_report = engine.trader.generate_orders_report()
positions_report = engine.trader.generate_positions_report()
fills_report = engine.trader.generate_fills_report()

# 或者直接访问缓存数据以做自定义分析
orders = engine.cache.orders()
positions = engine.cache.positions()
snapshots = engine.cache.position_snapshots()
```

### 投资组合统计

Portfolio analyzer 提供了全面的绩效指标：

```python
# 获取 portfolio analyzer
portfolio = engine.portfolio

# 获取不同类别的统计数据
stats_pnls = portfolio.analyzer.get_performance_stats_pnls()
stats_returns = portfolio.analyzer.get_performance_stats_returns()
stats_general = portfolio.analyzer.get_performance_stats_general()
```

:::info
如需了解可用统计项与如何创建自定义指标，请参阅 [Portfolio guide](portfolio.md#portfolio-statistics)。该指南覆盖：

- 内置统计类别（PnLs、returns、positions、orders 等）。
- 使用 `PortfolioStatistic` 创建自定义统计项。
- 注册与使用自定义指标。

:::

### 可视化

报告可与常用可视化工具配合使用：

```python
import matplotlib.pyplot as plt

# 绘制累计收益
returns = positions_report["realized_return"].cumsum()
returns.plot(title="Cumulative Returns")
plt.show()

# 分析成交质量（commission 为 Money 字符串，例如 "0.50 USD"）
# 提取数值与币种
fills_report["commission_value"] = fills_report["commission"].str.split().str[0].astype(float)
fills_report["commission_currency"] = fills_report["commission"].str.split().str[1]

# 按流动性方向与币种分组统计佣金
commission_by_side = fills_report.groupby(["liquidity_side", "commission_currency"])["commission_value"].sum()
commission_by_side.plot.bar()
plt.title("Commission by Liquidity Side and Currency")
plt.show()
```

## 报告生成模式

### 实盘（Live trading）

在实盘中建议定期生成报告：

```python
import pandas as pd

class ReportingActor(Actor):
    def on_start(self):
        # 安排定期报告任务
        self.clock.set_timer(
            name="generate_reports",
            interval=pd.Timedelta(minutes=30),
            callback=self.generate_reports
        )

    def generate_reports(self, event):
        # 生成并记录报告
        positions_report = self.trader.generate_positions_report()

        # 保存或传输报告
        positions_report.to_csv(f"positions_{event.ts_event}.csv")
```

### 绩效分析

针对回测的分析示例：

```python
import pandas as pd

# 运行回测
engine.run(start=start_time, end=end_time)

# 汇总结果
positions_closed = engine.cache.positions_closed()
stats_pnls = engine.portfolio.analyzer.get_performance_stats_pnls()
stats_returns = engine.portfolio.analyzer.get_performance_stats_returns()
stats_general = engine.portfolio.analyzer.get_performance_stats_general()

# 创建摘要字典
results = {
    "total_positions": len(positions_closed),
    "pnl_total": stats_pnls.get("PnL (total)"),
    "sharpe_ratio": stats_returns.get("Sharpe Ratio (252 days)"),
    "profit_factor": stats_general.get("Profit Factor"),
    "win_rate": stats_general.get("Win Rate"),
}

# 显示结果
results_df = pd.DataFrame([results])
print(results_df.T)  # 转置用于竖向显示
```

:::info
报告是从内存数据结构生成的。对于大规模分析或长期运行的系统，建议将报告持久化到数据库以便高效查询。有关持久化选项，请参阅 [Cache guide](cache.md)。
:::

## 与其他组件的集成

`ReportProvider` 与若干系统组件协同工作：

- **Cache**：报告的数据来源（订单、持仓、账户等）。
- **Portfolio**：使用报告进行绩效分析与统计计算。
- **BacktestEngine**：在回测结束后使用报告进行分析与可视化。
- **持仓快照（Position snapshots）**：在 `NETTING` OMS 模式下对准确的 PnL 报告至关重要。

## 总结

`ReportProvider` 提供了一整套用于评估交易绩效的分析报告。这些报告将原始交易数据转换为结构化的 DataFrame，便于对订单、成交、持仓和账户状态进行深入分析。理解如何生成与解读这些报告对于策略开发、绩效评估以及在 `NETTING` OMS 下处理持仓快照时确保 PnL 准确性非常重要。
