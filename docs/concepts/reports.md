# 报告 {#reports}

本指南说明 `ReportProvider` 报告如何支持组合分析、盈亏核算与回测事后分析。

## 概览 {#overview}

`ReportProvider` 把缓存中的订单、成交、持仓和账户状态转换为 pandas DataFrame，
供分析与可视化使用。这些报告帮助你评估策略表现、分析执行质量、核验盈亏核算。
回测与实时交易提供相同的报告，使两个环境下的绩效评估与策略对比保持一致。

报告有两种生成方式：

- **回测方法**：`BacktestEngine.generate_orders_report()` 及其同类方法读取引擎自身的
  缓存。`BacktestNode` 暴露同样的方法，第一个参数是运行配置 ID。
- **直接使用 `ReportProvider`**：传入任意订单或持仓集合，例如实时节点的
  缓存或经过滤的缓存查询。

没有匹配数据时，各方法返回空 DataFrame。

生成报告需要 pandas，`nautilus_trader.analysis` 对其延迟导入：未安装 pandas 时模块
仍可导入，生成报告时才抛出 `ImportError`。
`visualization` extra 会安装它。

## 可用报告 {#available-reports}

`ReportProvider` 提供若干静态方法，从交易数据返回 pandas DataFrame。
每种报告有自己的列与索引以便分析。

### 订单报告 {#orders-report}

生成所有订单的全貌：

```python
from nautilus_trader.analysis import ReportProvider

# From a completed backtest run
orders_report = engine.generate_orders_report()

# Or from any cache, such as a live node's
orders_report = ReportProvider.generate_orders_report(cache.orders())
```

返回 `pd.DataFrame`。列包括：

| 列            | 说明                                        |
| ----------------- | -------------------------------------------------- |
| `client_order_id` | 索引 - 订单唯一标识。                   |
| `instrument_id`   | 交易工具。                                |
| `strategy_id`     | 创建该订单的策略。                   |
| `trader_id`       | Trader 标识。                                 |
| `account_id`      | 账户标识（若已分配）。                  |
| `venue_order_id`  | 交易场所分配的订单 ID（若已被接受）。             |
| `side`            | BUY 或 SELL。                                       |
| `type`            | MARKET、LIMIT 等。                                |
| `status`          | 当前订单状态。                              |
| `quantity`        | 原始订单数量（字符串）。                  |
| `filled_qty`      | 已成交数量（字符串）。                            |
| `price`           | 限价（字符串，视订单类型而定）。        |
| `avg_px`          | 平均成交价格（字符串，若已成交）。            |
| `time_in_force`   | 有效期指令。                         |
| `ts_init`         | 订单初始化时间戳（Unix 纳秒）。 |
| `ts_last`         | 最后更新时间戳（Unix 纳秒）。          |

不同订单类型会有额外列，如止损订单的 `trigger_price`、GTD 订单的 `expire_time_ns`。
完整字段列表见 `Order.to_dict()`。

### 订单成交报告 {#order-fills-report}

给出已成交订单的摘要（**每笔订单一行**）：

```python
# From a completed backtest run
fills_report = engine.generate_order_fills_report()

# Or from any cache
fills_report = ReportProvider.generate_order_fills_report(cache.orders())
```

此报告只包含 `filled_qty > 0` 的订单。列与订单报告相同，但过滤为已执行的订单，
并把 `ts_init` 和 `ts_last` 转为 datetime 对象以便分析。

### 成交明细报告 {#fills-report}

列出逐笔成交事件（**每笔成交一行**）：

```python
# From a completed backtest run
fills_report = engine.generate_fills_report()

# Or from any cache
fills_report = ReportProvider.generate_fills_report(cache.orders())
```

返回 `pd.DataFrame`。列包括：

| 列            | 说明                              |
| ----------------- | ---------------------------------------- |
| `client_order_id` | 索引 - 订单标识。                |
| `trade_id`        | 成交/交易唯一标识。            |
| `venue_order_id`  | 交易场所分配的订单 ID。                 |
| `instrument_id`   | 交易工具。                      |
| `strategy_id`     | 创建该订单的策略。         |
| `account_id`      | 账户标识。                      |
| `position_id`     | 关联的持仓 ID（如适用）。  |
| `order_side`      | BUY 或 SELL。                             |
| `order_type`      | 订单类型（MARKET、LIMIT 等）。        |
| `last_px`         | 本笔成交价格（字符串）。           |
| `last_qty`        | 本笔成交数量（字符串）。        |
| `currency`        | 成交币种。                    |
| `liquidity_side`  | MAKER 或 TAKER。                          |
| `commission`      | 手续费金额与币种（字符串）。 |
| `ts_event`        | 成交时间戳（datetime）。               |
| `ts_init`         | 初始化时间戳（datetime）。     |

完整字段列表见 `OrderFilled.to_dict()`。报告会去掉 `type` 列。

### 持仓报告 {#positions-report}

持仓分析，含历史快照：

```python
# From a completed backtest run, which includes snapshots automatically
positions_report = engine.generate_positions_report()

# Or from any cache
positions_report = ReportProvider.generate_positions_report(
    positions=cache.positions(),
    snapshots=cache.position_snapshots(),  # Needed for NETTING OMS totals
)
```

返回 `pd.DataFrame`。列包括：

| 列             | 说明                                           |
| ------------------ | ----------------------------------------------------- |
| `position_id`      | 索引 - 持仓唯一标识。                   |
| `instrument_id`    | 交易工具。                                   |
| `strategy_id`      | 管理该持仓的策略。                   |
| `trader_id`        | Trader 标识。                                    |
| `account_id`       | 账户标识。                                   |
| `opening_order_id` | 开仓订单 ID。                    |
| `closing_order_id` | 平仓订单 ID。                    |
| `entry`            | 开仓方向（BUY 或 SELL）。                             |
| `side`             | 持仓方向（LONG、SHORT 或 FLAT）。                 |
| `quantity`         | 当前持仓规模（字符串）。                       |
| `peak_qty`         | 达到的最大规模（字符串）。                        |
| `avg_px_open`      | 平均开仓价（float）。                          |
| `avg_px_close`     | 平均平仓价（float，若已平仓）。                |
| `commissions`      | 已付手续费，每个币种一个条目（列表）。      |
| `realized_pnl`     | 成本币种下的已实现盈亏（字符串）。   |
| `realized_return`  | 已实现收益率（float），`0.05` 即 5%。  |
| `ts_init`          | 持仓初始化时间戳（Unix 纳秒）。 |
| `ts_opened`        | 开仓时间（datetime）。                         |
| `ts_last`          | 最后更新时间戳（Unix 纳秒）。             |
| `ts_closed`        | 平仓时间（datetime 或 NA）。                   |
| `duration_ns`      | 持仓时长（纳秒）。                     |
| `is_snapshot`      | 该行是否为历史快照。                |

快照行以由原持仓 ID 派生的生成 ID 作为索引。区分归档周期与活动持仓时应使用
`is_snapshot`，而非索引。完整字段列表见 `Position.to_dict()`。
报告会去掉 `signed_qty`、`base_currency`、`quote_currency` 和 `settlement_currency`。

### 账户报告 {#account-report}

跟踪账户余额与保证金随时间的变化：

```python
from nautilus_trader.model import Venue

venue = Venue("BINANCE")

# From a completed backtest run
account_report = engine.generate_account_report(venue=venue)

# Or from any cache
account_report = ReportProvider.generate_account_report(cache.account_for_venue(venue))
```

`BacktestEngine.generate_account_report()` 要求 `venue` 或 `account_id`，
两者都缺省时抛出 `ValueError`。两者都提供时 `account_id` 优先；
账户不存在则返回空 DataFrame。

返回 `pd.DataFrame`。列包括：

| 列          | 说明                                  |
| --------------- | -------------------------------------------- |
| `ts_event`      | 索引 - 账户状态变化的时间戳。   |
| `account_id`    | 账户标识。                          |
| `account_type`  | 账户类型（例如 CASH、MARGIN）。 |
| `base_currency` | 账户基础币种。               |
| `total`         | 总余额金额（字符串）。               |
| `free`          | 可用余额（字符串）。                  |
| `locked`        | 被订单锁定的余额（字符串）。           |
| `currency`      | 余额币种。                     |
| `reported`      | 余额是否由交易场所报告。       |
| `margins`       | 保证金信息（列表，如适用）。    |
| `info`          | 场所专属的附加信息。       |

每行代表一个余额条目。多币种账户在每次账户状态事件中产生多行。

## 盈亏核算要点 {#pnl-accounting-considerations}

盈亏核算取决于持仓计算、币种与快照。

### 基于持仓的盈亏 {#position-based-pnl}

- **已实现盈亏**：持仓部分或全部平仓时计算。
- **未实现盈亏**：按当前价格盯市。`Position.unrealized_pnl(last)` 按给定 `Price`
  为未平仓持仓估值。
- **手续费影响**：仅当手续费币种与持仓成本币种一致时才计入。现货对中基础币种
  手续费改为调整持仓规模，见
  [持仓](./positions.md)。

:::warning
无论 `NETTING` 还是 `HEDGING` OMS，已平仓持仓以同一 ID 重新开仓时，持仓快照会
保留历史盈亏。**报告中要包含快照**，总盈亏才准确。重新开仓与反向（flip）行为
见[持仓快照](./positions.md#position-snapshotting)。
:::

### 多币种核算 {#multi-currency-accounting}

涉及多币种时：

- 每个持仓以自身成本币种跟踪盈亏：线性合约为计价币种，反向合约为基础币种，
  quanto 合约为结算币种。
- 组合汇总需要币种转换。`Portfolio.realized_pnls(target_currency=...)`
  用缓存的汇率完成转换，见[支持的转换](./portfolio.md#supported-conversions)。
- 手续费币种可能与持仓成本币种不同。

```python
from decimal import Decimal

# Accessing PnL across positions
for position in cache.positions_closed():
    realized = position.realized_pnl  # Money in the position's cost currency, or None

    if realized is None or realized.currency == base_currency:
        continue

    # Converting by hand: cache.get_xrate() returns a float, so wrap rates as Decimal
    rate = Decimal(str(my_fx_rates[(realized.currency, base_currency)]))
    converted = realized.as_decimal() * rate
```

### 快照要点 {#snapshot-considerations}

在 `NETTING` OMS 下，准确的工具合计要把每个归档周期的已实现盈亏加到活动持仓上。
执行引擎如何归档已平仓周期，见[持仓快照](./positions.md#position-snapshotting)。

```python
from decimal import Decimal

from nautilus_trader.model import Money

pnl_by_currency = {}

for position in cache.positions(instrument_id=instrument_id):
    # Archived cycles are stored under the live position's ID
    snapshots = cache.position_snapshots(position_id=position.id)

    for pnl in (position.realized_pnl, *(s.realized_pnl for s in snapshots)):
        if pnl is None:
            continue

        running = pnl_by_currency.get(pnl.currency, Decimal(0))
        pnl_by_currency[pnl.currency] = running + pnl.as_decimal()

# Create Money objects for each currency
total_pnls = [Money.from_decimal(amount, currency) for currency, amount in pnl_by_currency.items()]
```

## 回测事后分析 {#backtest-post-run-analysis}

回测结束后，可通过结果统计与生成的报告进行分析。

### 获取回测结果 {#accessing-backtest-results}

```python
# After backtest run
engine.run()

# Access result statistics
result = engine.get_result()

# Generate reports from the backtest engine
fills_report = engine.generate_fills_report()
venue = engine.list_venues()[0]
account_report = engine.generate_account_report(venue=venue)

# Or access data directly for custom analysis
orders = engine.cache.orders()
positions = engine.cache.positions()
snapshots = engine.cache.position_snapshots()
```

### 组合统计 {#portfolio-statistics}

回测结果提供绩效指标：

```python
# Access backtest result statistics
result = engine.get_result()

# Get different categories of statistics
stats_pnls = result.stats_pnls  # Keyed by currency code, then statistic name
stats_returns = result.stats_returns  # Keyed by statistic name
stats_general = result.stats_general  # Keyed by statistic name
```

每项统计会参与它实现了计算的类别：已实现盈亏、收益率或持仓。
自定义统计可同时参与多个类别。

:::info
默认统计集、各类别的推导方式，以及持仓收益率与组合收益率的区别，
见[组合指南](./portfolio.md#portfolio-statistics)。
:::

### 可视化 {#visualization}

NautilusTrader 通过 Plotly 提供交互式 tearsheet 与图表：

```python
from nautilus_trader.analysis import create_tearsheet

# After backtest run
engine.run()

# Generate interactive HTML tearsheet
create_tearsheet(engine, output_path="tearsheet.html")
```

生成包含以下内容的交互式 HTML 报告：

- 净值曲线
- 回撤分析
- 月度收益率热力图
- 绩效统计表
- 收益率分布

需要更多控制时，可单独生成图表：

```python
import pandas as pd

from nautilus_trader.analysis import create_equity_curve

returns = pd.Series(
    [0.01, -0.005, 0.002],
    index=pd.date_range("2024-01-01", periods=3, tz="UTC"),
)
fig = create_equity_curve(returns, title="My Strategy Equity")
fig.show()  # Display in browser
fig.write_image("equity.png")  # Export to PNG (requires kaleido)
```

安装可视化依赖：

```bash
uv pip install --pre "nautilus_trader[visualization]"
```

## 报告生成模式 {#report-generation-patterns}

### 实时交易 {#live-trading}

实时交易期间，可周期性生成报告：

```python
from datetime import timedelta

from nautilus_trader.analysis import ReportProvider
from nautilus_trader.common import DataActor
from nautilus_trader.common import TimeEvent


class ReportingActor(DataActor):
    def on_start(self) -> None:
        # Schedule periodic reporting
        self.clock.set_timer(
            name="generate_reports",
            interval=timedelta(minutes=30),
            callback=self.generate_reports,
        )

    def generate_reports(self, event: TimeEvent) -> None:
        # Generate and log reports
        positions_report = ReportProvider.generate_positions_report(
            positions=self.cache.positions(),
            snapshots=self.cache.position_snapshots(),
        )

        # Save or transmit report
        positions_report.to_csv(f"positions_{event.ts_event}.csv")
```

### 绩效分析 {#performance-analysis}

回测分析示例：

```python
import pandas as pd

# Run the backtest
engine.run()

# Collect results
positions_closed = engine.cache.positions_closed()
result = engine.get_result()
stats_pnls = result.stats_pnls
stats_returns = result.stats_returns
stats_general = result.stats_general

# Create summary dictionary
results = {
    "total_positions": len(positions_closed),
    "pnl_total": stats_pnls.get("USD", {}).get("PnL (total)"),
    "win_rate": stats_pnls.get("USD", {}).get("Win Rate"),
    "sharpe_ratio": stats_returns.get("Sharpe Ratio (252 days)"),
    "profit_factor": stats_returns.get("Profit Factor"),
    "long_ratio": stats_general.get("Long Ratio"),
}

# Display results
results_df = pd.DataFrame([results])
print(results_df.T)  # Transpose for vertical display
```

:::info
报告由内存中的数据结构生成。大规模分析或长期运行的系统，应考虑把报告
持久化到数据库以便高效查询。持久化选项见[缓存指南](./cache.md)。
:::

## 与其他组件的集成 {#integration-with-other-components}

`ReportProvider` 与若干系统组件协作：

- **Cache**：报告中所有交易数据（订单、持仓、账户）的来源。
- **Portfolio**：独立地从同一缓存数据计算自身统计，不使用这些报告。
- **BacktestEngine**：暴露事后分析与可视化所用的报告方法。
- **持仓快照**：`NETTING` OMS 下准确的盈亏报告需要它。

## 相关指南 {#related-guides}

- [可视化](./visualization.md) - 从回测结果生成交互式 tearsheet 与图表。
- [组合](./portfolio.md) - 组合统计与绩效指标。
- [回测](./backtesting/index.md) - 运行能生成报告的回测。
- [缓存](./cache.md) - 为报告存储数据的缓存系统。
