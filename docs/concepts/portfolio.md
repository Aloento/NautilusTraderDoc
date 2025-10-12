# 投资组合

:::info
本概念指南仍在持续完善中。
:::

投资组合（Portfolio）是管理和跟踪交易节点或回测中所有活跃策略持仓的中心枢纽。
它会汇总来自多个合约/品种的持仓数据，为你提供持仓、风险暴露以及整体绩效的统一视图。
本节介绍 NautilusTrader 如何聚合并维护投资组合状态，以支持有效的交易和风险管理。

## 投资组合统计（Portfolio statistics）

仓库中提供了多种内置的[投资组合统计工具](https://github.com/nautechsystems/nautilus_trader/tree/develop/nautilus_trader/analysis/statistics)，
可以用于回测和实盘的绩效分析。

这些统计指标通常可分为以下几类：

- 基于已实现/未实现 PnL 的统计（按货币）
- 基于收益率（returns）的统计
- 基于持仓（positions）的统计
- 基于订单（orders）的统计

你也可以在任意时点调用交易者的 `PortfolioAnalyzer` 来计算统计指标，包括在回测或实盘运行过程中（_during_）调用。

## 自定义统计（Custom statistics）

通过继承 `PortfolioStatistic` 基类并实现相应的 `calculate_` 方法，可以定义自定义的投资组合统计。

例如，内置统计 `WinRate` 的实现如下：

```python
import pandas as pd
from typing import Any
from nautilus_trader.analysis.statistic import PortfolioStatistic


class WinRate(PortfolioStatistic):
    """
    Calculates the win rate from a realized PnLs series.
    """

    def calculate_from_realized_pnls(self, realized_pnls: pd.Series) -> Any | None:
        # Preconditions
        if realized_pnls is None or realized_pnls.empty:
            return 0.0

        # Calculate statistic
        winners = [x for x in realized_pnls if x > 0.0]
        losers = [x for x in realized_pnls if x &lt;= 0.0]

        return len(winners) / float(max(1, (len(winners) + len(losers))))
```

然后可以将这些统计注册到交易者的 `PortfolioAnalyzer` 中：

```python
stat = WinRate()

# Register with the portfolio analyzer
engine.portfolio.analyzer.register_statistic(stat)
```

:::info
有关可用方法的详细说明，请参阅 `PortfolioAnalyzer` 的 [API 参考](../api_reference/analysis.md#class-portfolioanalyzer)。
:::

:::tip
确保你的统计在面对退化输入时具有健壮性，例如 `None`、空序列或数据不足的情况。

在这些情况下，通常应返回 `None`、NaN 或其他合理的默认值。
:::

## 回测分析（Backtest analysis）

回测结束后，系统会将已实现 PnLs、收益率、持仓和订单数据传给已注册的每个统计计算器（按照默认配置），逐一计算它们的值。
计算结果会在报告（tear sheet）中以 `Portfolio Performance` 为标题展示，按如下分组显示：

- 已实现 PnL 统计（按货币）
- 收益率统计（针对整个投资组合）
- 基于持仓和订单数据的通用统计（针对整个投资组合）
