# 可视化 {#visualization}

NautilusTrader 基于 Plotly 构建了可扩展的可视化系统，为回测结果生成交互式 HTML
tearsheet。只需少量代码即可生成报告，也可以添加自定义图表与主题。

## 概览 {#overview}

可视化系统分三部分：

- **图表注册表**：彼此解耦的图表定义，可扩展自定义可视化。
- **主题系统**：风格统一，内置主题并支持自定义主题。
- **配置**：以声明式方式指定渲染什么、如何展示。

tearsheet 写为**自包含的 HTML 文件**，可在任何现代浏览器中查看、分享给相关方，
或存档备查。输出路径使用静态图片扩展名（如 `.png`、`.pdf`）时，经 Kaleido 导出静态图片。

:::note
可视化系统需要 `visualization` extra。它安装用于 DataFrame 处理的 Pandas、
用于交互式图形的 Plotly，以及用于静态图片导出的 Kaleido：

```bash
uv pip install --pre "nautilus_trader[visualization]"
```

:::

## Tearsheet {#tearsheets}

tearsheet 是绩效报告，把多个图表与统计合并为一个交互式可视化。
它在回测运行完成后生成，对策略表现给出直观的视觉反馈。

### 快速上手 {#quick-start}

用默认设置生成 tearsheet：

```python
from nautilus_trader.analysis import create_tearsheet
from nautilus_trader.backtest import BacktestEngine

# After running your backtest
engine.run()

# Generate tearsheet
create_tearsheet(
    engine=engine,
    output_path="backtest_results.html",
)
```

生成包含全部默认图表的 HTML 文件，使用浅色主题与自动布局。
在浏览器中打开 `backtest_results.html` 查看交互式 tearsheet。

### 回测结果输入 {#backtest-result-input}

设 `result` 是已完成的回测返回的 `BacktestResult`。不传 node 即生成仅结果的
tearsheet：

```python
create_tearsheet(
    engine=result,
    output_path="backtest_results.html",
)
```

要在报告中包含来自 node 报告的初始账户余额，就保留节点状态。配置的 tearsheet
含 `bars_with_fills` 这类依赖缓存的图表时，也必须提供 node。

按完整的 [`BacktestNode` 设置](./backtesting/apis-and-runs.md#high-level-api)操作，
并在其 `BacktestRunConfig` 上设置 `dispose_on_completion=False`，
然后传入完成的结果与保留的节点：

```python
create_tearsheet(
    engine=result,
    node=node,
    output_path="backtest_results.html",
)
```

:::warning
传入的 node 若其匹配的运行配置启用了处置（dispose），会抛出 `ValueError`，
因为它的缓存与报告已不可用。
:::

### 定制 {#customization}

控制出现哪些图表、采用什么风格：

```python
from nautilus_trader.config import TearsheetConfig
from nautilus_trader.analysis import TearsheetDrawdownChart
from nautilus_trader.analysis import TearsheetEquityChart
from nautilus_trader.analysis import TearsheetRunInfoChart
from nautilus_trader.analysis import TearsheetStatsTableChart

config = TearsheetConfig(
    charts=[
        TearsheetRunInfoChart(),
        TearsheetStatsTableChart(),
        TearsheetEquityChart(),
        TearsheetDrawdownChart(),
    ],
    theme="nautilus_dark",
    height=2000,
)

create_tearsheet(
    engine=engine,
    output_path="custom_tearsheet.html",
    config=config,
)
```

### 币种过滤 {#currency-filtering}

多币种回测中，可把统计过滤到特定币种：

```python
from nautilus_trader.model import Currency

create_tearsheet(
    engine=engine,
    output_path="usd_only.html",
    currency=Currency.from_str("USD"),  # Shows only USD statistics
)
```

`currency` 为 `None`（默认）时，tearsheet 分币种分别展示全部统计。

`BacktestEngine` 输入时，收益率类图表要求单一币种。它们由组合净值快照推导，
回退到账户报告，混合币种账户不加过滤无法构建。多币种回测请传 `currency`，
收益率图表即使用所选币种。

`BacktestResult` 输入时，`currency` 过滤 PnL 统计与账户余额。
结果中**已存储的收益率序列保持不变**。

## 可用图表 {#available-charts}

tearsheet 可包含以下任意图表的组合：

| 图表名称        | 类型        | 说明                                             |
| ----------------- | ----------- | ------------------------------------------------------- |
| `run_info`        | 表格       | 运行元数据与账户余额。                      |
| `stats_table`     | 表格       | 绩效统计（PnL、收益率、通用指标）。 |
| `equity`          | 折线        | 累计收益率随时间的变化，可叠加基准。   |
| `drawdown`        | 面积        | 相对净值峰值的回撤百分比。                   |
| `monthly_returns` | 热力图     | 按月组织的月度组合收益率，按年排列。 |
| `distribution`    | 直方图   | 单笔收益率数值的分布。               |
| `rolling_sharpe`  | 折线        | 60 日滚动 Sharpe 比率。                            |
| `yearly_returns`  | 柱状         | 年度收益率百分比。                              |
| `bars_with_fills` | K 线 | 价格 K 线（OHLC），订单成交以标记叠加。 |

图表注册表包含全部图表，`TearsheetConfig.charts` 中的图表对象负责配置它们
（每个图表对象对应一个内置图表名）。

### 运行信息表 {#run-information-table}

`run_info` 图表展示回测运行的关键元数据：

- 运行 ID、开始时间、结束时间
- 回测区间（起止日期）
- 处理的迭代总数
- 事件、订单与持仓计数
- 各币种的账户期初与期末余额

该表默认出现在左上角。

### 绩效统计表 {#performance-statistics-table}

`stats_table` 图表按分区展示绩效指标：

- **PnL 统计**（按币种）：总 PnL、胜率、盈亏比等。
- **收益率统计**：Sharpe 比率、Sortino 比率、最大回撤等。
- **通用统计**：总交易数、平均交易时长等。

该表默认出现在右上角。

### 净值曲线 {#equity-curve}

`equity` 图表绘制回测期间的累计收益率。向 `create_tearsheet()` 提供
`benchmark_returns` 时，会叠加基准以便对比。

```python
import pandas as pd

# Load benchmark returns (e.g., from a market index)
# Index should be datetime, aligned with strategy returns timeframe
benchmark_returns = pd.read_csv("sp500_returns.csv", index_col=0, parse_dates=True)["return"]

create_tearsheet(
    engine=engine,
    output_path="with_benchmark.html",
    benchmark_returns=benchmark_returns,
    benchmark_name="S&P 500",
)
```

基准序列按原样绘制。要保证对比准确，其索引需与策略的收益日期对齐。

### 月度与年度收益率 {#monthly-and-yearly-returns}

`monthly_returns` 和 `yearly_returns` 图表默认使用复利（时间加权）收益率。
每个单元格度量该期相对期初滚动余额的涨幅，各期复利累计为总收益率。

设置 `compounding=False` 则报告相对固定初始本金的单利收益率：每个单元格度量
该期收益占初始本金的百分比，各期求和等于总收益而非复利累计。即名义收益率，
适用于固定规模交易并提取利润的等资本策略。

```python
config = TearsheetConfig(
    charts=[
        TearsheetMonthlyReturnsChart(compounding=False),
        TearsheetYearlyReturnsChart(compounding=False),
    ],
)
create_tearsheet(engine=engine, config=config)
```

独立的 `create_monthly_returns_heatmap()` 与 `create_yearly_returns()`
函数接受同样的 `compounding` 参数。要让非复利图形如实反映等资本，
仓位应以固定数量而非当前净值的比例来定，否则随着滚动余额增长，后期数值会虚高。

## 主题 {#themes}

主题控制图表的视觉风格，包括颜色、字体与背景。NautilusTrader 提供四个内置主题：

| 主题名      | 说明                                   | 使用场景                       |
| --------------- | --------------------------------------------- | ------------------------------ |
| `plotly_white`  | 干净浅色主题，深灰标题。     | 默认，专业报告。 |
| `plotly_dark`   | 深色背景，标准 Plotly 配色。  | 弱光环境。        |
| `nautilus`      | 浅色主题，NautilusTrader 品牌色。 | 官方浅色模式。           |
| `nautilus_dark` | 深色主题，青/蓝绿标志色。   | 官方深色模式。            |

### 选择主题 {#selecting-a-theme}

在 `TearsheetConfig` 中指定主题：

```python
config = TearsheetConfig(theme="nautilus_dark")
create_tearsheet(engine=engine, config=config)
```

### 自定义主题 {#custom-themes}

注册自定义主题，让所有可视化保持统一品牌风格：

```python
from nautilus_trader.analysis import register_theme

register_theme(
    name="corporate",
    template="plotly_white",  # Base Plotly template
    colors={
        "primary": "#003366",  # Navy blue
        "positive": "#2e8b57",  # Sea green
        "negative": "#c41e3a",  # Cardinal red
        "neutral": "#808080",  # Gray
        "background": "#ffffff",  # White
        "grid": "#e5e5e5",  # Light gray
        # Optional table colors (defaults will be provided if omitted)
        "table_section": "#e5e5e5",
        "table_row_odd": "#f8f8f8",
        "table_row_even": "#ffffff",
        "table_text": "#000000",
    },
)

# Use the custom theme
config = TearsheetConfig(theme="corporate")
```

主题系统从 `background` 与 `grid` 颜色推导出默认的 `table_*`
颜色。这些默认值兼容在表格专属颜色出现之前注册的主题。

## 配置 {#configuration}

`TearsheetConfig` 类以声明式方式控制 tearsheet 生成：

```python
from nautilus_trader.analysis import GridLayout
from nautilus_trader.config import TearsheetConfig
from nautilus_trader.analysis import TearsheetDrawdownChart
from nautilus_trader.analysis import TearsheetEquityChart
from nautilus_trader.analysis import TearsheetStatsTableChart

config = TearsheetConfig(
    charts=[
        TearsheetEquityChart(),
        TearsheetDrawdownChart(),
        TearsheetStatsTableChart(),
    ],
    theme="nautilus_dark",
    title="Q4 2024 Strategy Performance",
    height=1800,
    include_benchmark=True,
    benchmark_name="SPY",
    layout=GridLayout(
        rows=2,
        cols=2,
        heights=[0.60, 0.40],
        vertical_spacing=0.08,
        horizontal_spacing=0.12,
    ),
)
```

### 配置参数 {#configuration-parameters}

| 参数           | 类型                   | 默认值          | 说明                         |
| ------------------- | ---------------------- | ---------------- | ----------------------------------- |
| `charts`            | `list[TearsheetChart]` | 内置图表        | 要包含的图表，按顺序。        |
| `theme`             | `str`                  | `"plotly_white"` | 用于风格的主题名。             |
| `layout`            | `GridLayout`           | `None`           | 自定义子图网格布局。         |
| `title`             | `str`                  | 自动生成   | Tearsheet 标题。                    |
| `include_benchmark` | `bool`                 | `True`           | 提供基准时显示基准。       |
| `benchmark_name`    | `str`                  | `"Benchmark"`    | 基准的显示名。         |
| `height`            | `int`                  | `1500`           | 总高度（像素）。             |
| `show_logo`         | `bool`                 | `True`           | 为将来的 logo 渲染预留。 |

`layout` 为 `None` 时，图表数量决定网格行列与行高。默认 8 张图表使用
4x2 网格，行高 `[0.50, 0.22, 0.16, 0.12]`，给顶行表格留出更多空间。

## 自定义图表 {#custom-charts}

注册表模式支持添加自定义图表。图表是把 trace 渲染到 Plotly figure 对象上的函数。

### 注册自定义图表 {#registering-a-custom-chart}

```python
from nautilus_trader.analysis import register_chart
import plotly.graph_objects as go


def my_custom_chart(returns, output_path=None, title="Custom Chart", theme="plotly_white"):
    """
    Create a custom visualization.

    This function signature matches the built-in chart functions for consistency.
    """
    from nautilus_trader.analysis import get_theme

    theme_config = get_theme(theme)

    # Create your visualization
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=returns.index,
            y=returns.cumsum(),
            mode="lines",
            name="Custom Metric",
            line={"color": theme_config["colors"]["primary"]},
        )
    )

    fig.update_layout(
        title=title,
        template=theme_config["template"],
        xaxis_title="Date",
        yaxis_title="Value",
    )

    if output_path:
        fig.write_html(output_path)

    return fig


# Register the chart for standalone use (via `get_chart()` / `list_charts()`)
register_chart("my_custom", my_custom_chart)
```

### 集成到 tearsheet {#tearsheet-integration}

要在 tearsheet 中正确占格，使用 `register_tearsheet_chart`。与
`register_chart`（注册返回自身 figure 的独立函数）不同，tearsheet 渲染器
把 trace 直接画进共享的子图网格单元，因此签名接收目标 `fig` 以及要渲染到的
`row` 和 `col`。

```python
from nautilus_trader.config import TearsheetConfig
from nautilus_trader.analysis import TearsheetCustomChart
from nautilus_trader.analysis import TearsheetEquityChart
from nautilus_trader.analysis import TearsheetStatsTableChart
from nautilus_trader.analysis import register_tearsheet_chart


def _render_my_metric(fig, row, col, returns, theme_config, **kwargs):
    """
    Render custom metric directly onto a subplot.

    Parameters
    ----------
    fig : go.Figure
        The figure to add traces to.
    row : int
        Subplot row position.
    col : int
        Subplot column position.
    returns : pd.Series
        Strategy returns series supplied to the renderer.
    theme_config : dict
        Theme configuration dictionary.
    **kwargs : dict
        Additional parameters (stats_pnls, stats_returns, benchmark_returns, etc.).
    """
    metric_values = returns.rolling(30).std() * 100  # Example metric

    fig.add_trace(
        go.Scatter(
            x=returns.index,
            y=metric_values,
            mode="lines",
            name="30-Day Volatility",
            line={"color": theme_config["colors"]["neutral"]},
        ),
        row=row,
        col=col,
    )

    fig.update_xaxes(title_text="Date", row=row, col=col)
    fig.update_yaxes(title_text="Volatility (%)", row=row, col=col)


# Register for tearsheet use
register_tearsheet_chart(
    name="volatility",
    subplot_type="scatter",
    title="Rolling Volatility (30-day)",
    renderer=_render_my_metric,
)

# Now "volatility" can be used in TearsheetConfig.charts:
config = TearsheetConfig(
    charts=[
        TearsheetStatsTableChart(),
        TearsheetEquityChart(),
        TearsheetCustomChart(chart="volatility"),
    ],
)
```

渲染器函数收到所需的全部数据（收益率、统计、主题配置），
直接渲染到指定子图位置。

## 离线分析 {#offline-analysis}

已有预计算统计、但没有 `BacktestEngine` 实例时，使用底层 API：

```python
import pandas as pd

from nautilus_trader.analysis import create_tearsheet_from_stats

# Load precomputed data. The structure matches BacktestResult stats fields.
stats_pnls = {"USD": {"PnL (total)": 1500.0, "Win Rate": 0.55, ...}}  # Per-currency
stats_returns = {"Sharpe Ratio (252 days)": 1.2, "Max Drawdown": -0.15, ...}
stats_general = {"Avg Winner": 100.0, "Avg Loser": -50.0, ...}
returns = pd.Series(...)  # Daily returns with datetime index

create_tearsheet_from_stats(
    stats_pnls=stats_pnls,
    stats_returns=stats_returns,
    stats_general=stats_general,
    returns=returns,
    output_path="offline_analysis.html",
)
```

字典的键应与 `engine.get_result().stats_pnls`、
`engine.get_result().stats_returns`、`engine.get_result().stats_general`
返回的一致。

这种方式适合：

- 分析分开存放的多次回测运行结果。
- 用预计算指标对比策略。
- 集成到外部分析管线。

## 最佳实践 {#best-practices}

### 图表选择 {#chart-selection}

- 探索性分析用默认图表，一次看全可用指标。
- 明确策略关注哪些指标后再定制图表。
- 删掉无关图表，减少视觉噪音与文件体积。

### 主题使用 {#theme-usage}

- 专业报告与演示用 `plotly_white`。
- 官方材料或弱光阅读用 `nautilus_dark`。
- 内部规范或个人偏好通过自定义主题满足。

### 性能考量 {#performance-considerations}

- Tearsheet HTML 内联全部数据，长回测可达数兆字节。
- 不同分析时间窗考虑分别生成 tearsheet。
- 数据集非常大时，用单图函数代替完整 tearsheet。

### 自定义统计集成 {#custom-statistics-integration}

自定义图表与内置 tearsheet 图表共用同一组 `stats_pnls`、`stats_returns`、
`stats_general` 字典提供统计。

`BacktestEngine` 输入时，这些值来自 `engine.get_result()`，
因此经 `Portfolio.register_statistic()` 注册的统计无需额外接线即可进入
tearsheet。见[自定义统计](./portfolio.md#custom-statistics)。

离线分析时，把兼容的字典直接传给 `create_tearsheet_from_stats()`：

```python
stats_returns = {
    "Sharpe Ratio (252 days)": 1.2,
    "Custom Volatility Score": 0.42,
}
```

## API 层级 {#api-levels}

可视化系统提供两个 API 层级，外加独立的图表函数：

### 高层 API {#high-level-api}

推荐多数场景使用：

```python
create_tearsheet(engine=engine, config=config)
```

自动从 `BacktestEngine` 或 `BacktestResult` 提取数据，生成所有配置的图表，
产出完整 HTML tearsheet。

### 底层 API {#low-level-api}

用于高级定制或离线分析：

```python
create_tearsheet_from_stats(
    stats_pnls=stats_pnls,
    stats_returns=stats_returns,
    stats_general=stats_general,
    returns=returns,
    run_info=run_info,
    account_info=account_info,
    config=config,
)
```

对数据输入细粒度控制，可分析预计算的统计。

### 独立图表函数 {#standalone-chart-functions}

各个图表函数可独立使用，生成单一用途的 HTML 可视化，或返回 Plotly figure
供自定义分析流程使用。

#### 带成交标记的价格 K 线 {#price-bars-with-fills}

`create_bars_with_fills` 生成叠加订单成交标记的 K 线图，适合在价格走势中
直观分析策略执行。它可独立使用，也可纳入 tearsheet：

```python
from nautilus_trader.analysis import create_bars_with_fills
from nautilus_trader.analysis import create_tearsheet
from nautilus_trader.analysis import TearsheetBarsWithFillsChart
from nautilus_trader.config import TearsheetConfig
from nautilus_trader.analysis import TearsheetEquityChart
from nautilus_trader.analysis import TearsheetStatsTableChart
from nautilus_trader.model import BarType

# Standalone usage
bar_type = BarType.from_str("ESM4.XCME-1-MINUTE-LAST-EXTERNAL")
fig = create_bars_with_fills(
    engine=engine,
    bar_type=bar_type,
    title="ES Futures - Entry/Exit Analysis",
)
fig.show()  # Display in Jupyter
fig.write_html("bars_with_fills.html")  # Or save to file

# Include in tearsheet
config = TearsheetConfig(
    charts=[
        TearsheetStatsTableChart(),
        TearsheetEquityChart(),
        TearsheetBarsWithFillsChart(
            bar_type="ESM4.XCME-1-MINUTE-LAST-EXTERNAL",
            title="Bars with Fills",
        ),
    ],
)
create_tearsheet(engine=engine, config=config)

# Multiple bars-with-fills charts in one tearsheet
config = TearsheetConfig(
    charts=[
        TearsheetStatsTableChart(),
        TearsheetEquityChart(),
        TearsheetBarsWithFillsChart(
            bar_type=f"{instrument.id}-5-MINUTE-MID-INTERNAL",
            title=f"Bars with Order Fills - {instrument.id}",
        ),
        TearsheetBarsWithFillsChart(
            bar_type=f"{other_instrument.id}-5-MINUTE-MID-INTERNAL",
            title=f"Bars with Order Fills - {other_instrument.id}",
        ),
    ],
)
create_tearsheet(engine=engine, config=config)
```

图中以 K 线展示 OHLC 走势，三角形标记表示订单成交（买入为正三角、卖出为倒三角，
颜色取主题的 positive 与 negative 色）。需要额外配置的图表（如
`bar_type`）直接在图表对象上给出参数（如
`TearsheetBarsWithFillsChart(bar_type=...)`）。

其他单图函数包括 `create_equity_curve`、`create_drawdown_chart`、
`create_monthly_returns_heatmap` 等，完整列表见 API 参考。

## 相关指南 {#related-guides}

- [回测](./backtesting/index.md) - 学习运行能生成 tearsheet 的回测。
- [报告](./reports.md) - 理解 tearsheet 展示的底层统计。
- [组合](./portfolio.md) - 探索组合跟踪与绩效指标。
