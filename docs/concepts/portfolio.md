# 组合 {#portfolio}

Portfolio 为交易节点或回测维护由账户和持仓派生的状态。策略用它查询账户、盈亏、
敞口、保证金、净值与绩效统计。

## 币种转换 {#currency-conversion}

Python 的 `Portfolio` 可以把盈亏与敞口从原生成本币种换算到账户基础币种或显式指定的
目标币种。这支持成本币种各异的工具与基础币种不同的账户。

### 支持的转换 {#supported-conversions}

以下组合查询支持币种转换：

- `realized_pnl()` 与 `realized_pnls()` 转换已实现盈亏。
- `unrealized_pnl()` 与 `unrealized_pnls()` 转换未实现盈亏。
- `total_pnl()` 与 `total_pnls()` 转换总盈亏。
- `net_exposure()` 与 `net_exposures()` 转换净敞口。

这八个方法都接受可选的 `target_currency`。成功的定向查询只包含该币种。
即便账户的基础币种不同，Portfolio 也把每个原生值直接换算到目标币种。

### 单账户行为 {#single-account-behavior}

`PortfolioConfig.convert_to_account_base_currency=true`（默认）时，对单个账户
不带 `target_currency` 的查询，会在账户设有基础币种时把值转换为该币种，
否则结果保持原生成本币种。

```python
# Returns exposure in the account's base currency (e.g., USD)
exposure = portfolio.net_exposures(venue=BINANCE, account_id=account_id)
```

### 多账户行为 {#multi-account-behavior}

查询多个账户且不带 `target_currency` 时，输出取决于方法返回币种映射还是单个
`Money` 值：

- 集合方法可以返回每个输出币种一个条目的字典，有配置基础币种的账户用其基础币种，
  其余用原生成本币种。提供 `target_currency` 可把完整结果聚合为单一币种。
- 单值方法在各账户的值无法归并为一个输出币种时返回 `None`。

若某个工具横跨基础币种不同的账户，其单工具敞口无法归并为单一输出币种，
`net_exposures()` 也返回 `None`。

```python
# Multiple accounts with the same base currency
exposures = portfolio.net_exposures(venue=BINANCE)
# Returns {USD: Money(...)}

# Accounts with different base currencies and separately resolvable instruments
exposures = portfolio.net_exposures(venue=BINANCE)
# Returns {USD: Money(...), EUR: Money(...)}

# Force single currency across accounts
exposures = portfolio.net_exposures(venue=BINANCE, target_currency=USD)
# Returns {USD: Money(...)}
```

### 计算失败 {#calculation-failures}

任何所需价格、汇率或精确算术操作不可用时，盈亏与敞口查询按失败关闭处理。
其 Python 行为随方法类型而异：

- 单值方法（`realized_pnl`、`unrealized_pnl`、`total_pnl`、`net_exposure`）
  返回 `None`。
- `realized_pnls`、`unrealized_pnls`、`total_pnls` 抛出 `RuntimeError`。
- `net_exposures` 返回 `None`。

集合查询**作为一个整体失败**，绝不返回部分结果，也不混用目标与源币种。
例如一个没有价格的工具会使整个 `unrealized_pnls` 或 `total_pnls` 结果失效。
组合为空时，合法的全范围 `net_exposures()` 查询返回 `{}`。

:::warning
使用 `target_currency` 做跨币种汇总时，汇率数据必须可用。
:::

### 转换价格类型 {#conversion-price-types}

- **持仓估值**：启用 `use_mark_prices` 时优先使用当前 `MARK` 价；否则多头先用
  `BID`、空头先用 `ASK`，再尝试其余价格回退。
- **币种转换**：使用缓存中当前的 `MID` 汇率。启用 `use_mark_xrates` 时当前 `MARK`
  汇率优先，`MID` 作为回退。显式的目标币种查询不会复用陈旧的旧汇率。

### 敞口聚合 {#exposure-aggregation}

`net_exposure()` 对单一工具的每个未平仓持仓估值，然后加多头名义值、减空头名义值，
返回该净估值名义值的绝对大小，结果不保留方向。调用方传入 `price` 时，
所选持仓都按同一价格估值。没有覆盖价格或统一 mark 价格时，按方向区分的买卖价
会让等量反向持仓留下估值残差。

`net_exposures()` 按输出币种分组并求和各工具非零的绝对值，
不在不同工具之间轧差方向性敞口。

### 价格覆盖 {#price-overrides}

Python 方法 `unrealized_pnl`、`total_pnl`、`net_exposure` 接受可选的 `price`。
提供时，Portfolio 按该价格对所选工具估值，而不读取缓存市价。计算是即时的：
不会替换缓存中的盈亏、敞口或后续查询使用的市价。

## 净值与盯市 {#equity-and-mark-to-market}

Portfolio 提供拉取式查询，用于持续的组合估值和已记录的快照。
按币种的结果使用相应账户的基础币种或原生成本币种。

| 方法                                         | 返回                                                |
| ---------------------------------------------- | ------------------------------------------------------ |
| `mark_values(venue, account_id)`               | 未平仓持仓的带符号 MTM 合计。                  |
| `equity(venue, account_id)`                    | 余额与持仓估值合并后的总净值。 |
| `build_snapshot(account_id)`                   | 账户级 MTM 合计与估值元数据。        |
| `snapshots(account_id)`                        | 按发布顺序记录的账户快照。          |
| `missing_price_instruments(venue, account_id)` | 被标记为无法估价的工具。                    |

多头贡献其名义值，空头贡献其相反数，空仓持仓跳过。

按账户范围的 `equity()` 查询遇到未知账户时返回 `{}`。账户存在时，若精确快照估值
失败则抛出 `RuntimeError`，而不是把失败呈现为空净值。

### 净值公式 {#equity-formula}

净值以 `balances_total` 起步，按币种加上未平仓持仓的估值：

| 账户类型                            | 加到余额上的估值                              |
| --------------------------------------- | -------------------------------------------------------- |
| 无基础币种的 Cash，或 Wallet | 持仓 mark 值，下述余额例外除外            |
| 有基础币种的 Cash，或 betting   | 全部未平仓持仓 mark 值                                  |
| 计算式保证金                       | 带符号的期权费 mark + 其他持仓的未实现盈亏 |
| 报告式保证金                         | 全部未平仓持仓的未实现盈亏                     |

#### Cash 与 Wallet 估值 {#cash-and-wallet-valuation}

对于由无基础币种的 Cash 账户或 Wallet 账户持有的持仓，满足两个条件时排除非反向基础资产的
mark 值：余额中已持有该资产，且工具的成本币种不同于其基础币种。
反向工具与未入账的资产保留其 mark 值。

`mark_values()` 始终返回未平仓持仓的总值（毛值），包括已入账资产。
`equity()` 和快照对每个非反向基础资产只计一次——通过余额或 mark 值。

#### 保证金估值 {#margin-valuation}

计算式保证金账户（`calculate_account_state=true`）随成交更新现金；
报告式账户使用场所余额。按场所范围的保证金查询对每个持仓所有者应用其所属
账户类型的规则。余额更新见[核算](./accounting.md)。

含期权和二元期权在内的期权费类工具在成交时交割名义现金，
其带符号 mark 值表示资产或负债。期货与永续不交割名义现金，
走未实现盈亏管线。

:::note
场所合计值可能只代表现金，也可能已含持仓价值。Portfolio 不加归一地直接使用，
因此报告式账户的净值可能与场所口径的净值不同。
:::

- 快照对所有持仓单独报告未实现盈亏，包括期权。
- 价差组合不创建组合持仓，也不更新计算式余额，价值由各个腿承载。

### 价格回退 {#price-fallback}

估值按以下顺序向 `Cache` 请求价格，取第一个命中：

1. mark 价格，条件是 `PortfolioConfig` 中 `use_mark_prices=true`（默认）且缓存中有 mark 价。
2. 与方向匹配的报价：多头取 `BID`，空头取 `ASK`。
3. 最近成交价。
4. 最近缓存的 bar 收盘价（`bar_updates=true` 时有值）。

设置 `use_mark_prices=false` 可跳过 mark 层级，从方向匹配的报价开始。

小于等于零的价格只对允许负价的工具算作当前价（期货、期权、期货价差与期权价差工具、
现货商品）。非反向的按面值计价（inverse）工具除外，因为其名义值要除以价格。
某一侧报价小于等于零还需要数量非零，因为空侧可能以零价零量的形式到达。
其余情况下 Portfolio 跳过该价格，转向下一个来源。

若四个来源都给不出当前价，Portfolio 沿用该工具和持仓方向上最后一次有效价格，
下一次快照会把该工具列入 `stale_instruments`。若该持仓从未有过有效价格，
它进入缺失价格跟踪器，列入 `unpriced_instruments`，并从求和中排除。

### 基础币种转换 {#base-currency-conversion}

`convert_to_account_base_currency=true`（默认）且账户设有
`base_currency` 时，成本币种的数值会用 `Cache.get_xrate()` 的 `MID`
汇率换算为基础币种。`use_mark_xrates=true` 时优先使用
`Cache.get_mark_xrate()` 的缓存 mark 汇率，不可用时回退到 `MID`。
输出字典此时只有一个与基础币种对应的键。

`convert_to_account_base_currency=false` 或账户没有 `base_currency` 时，
结果按每个持仓的原生成本币种为键，不做汇率换算。

所需转换没有当前汇率时，Portfolio 沿用最后一次有效汇率，并把源币种列入
`stale_currencies`。从未有过有效汇率时，该持仓无法估价，经缺失价格跟踪器标记，
不会被静默按 1.0 汇率估值。

### 快照估值元数据 {#snapshot-valuation-metadata}

`PortfolioSnapshot.total_equity` 始终给出按币种的 MTM 明细。
启用基础币种转换且账户有基础币种时，`base_currency_equity` 给出该币种下的
汇总标量值；转换关闭或账户没有基础币种时它为 `None`。

快照使用了沿用的价格或汇率，或排除了从未集齐全部估值输入的持仓时，
`is_stale` 为 true。相关字段指明原因：

- `stale_instruments`：按沿用价格估值的工具。
- `stale_currencies`：按沿用汇率换算的源币种。
- `unpriced_instruments`：因从未有完整有效估值而被排除的工具。

调用 `build_snapshot(account_id)` 可得按需样本；调用 `snapshots(account_id)`
读取有界的记录序列。这些方法在 Rust 的 Portfolio 与 Strategy API、以及 Python
Portfolio 绑定上都可用。构建快照不会把它加入记录序列，
只有配置的生命周期发布才会记录快照。

### 自动净值曲线 {#automatic-equity-curve}

`PortfolioConfig.equity_curve=true`（默认）会在以下时点记录并发布盯市快照：

- 每个账户注册时。
- 每个 UTC 午夜，即使账户空仓。
- 回测或实时节点关闭时。

优化器运行等不使用净值曲线的工作负载可设置 `equity_curve=false`。
按需的 `equity()` 与 `build_snapshot()` 计算仍然可用。

独立的 `snapshot_interval_ms` 设置仍是可选的。设置后，只在账户有未平仓持仓时
追加细粒度快照。

### 缺失价格跟踪 {#missing-price-tracking}

跟踪器为每个按账户过滤的查询范围和未过滤的场所范围各保留最新的缺失集合。
`missing_price_instruments(venue)` 返回该场所范围的并集；
传入 `account_id` 则只返回该账户当前的集合。

每个观测结果在相同范围再次运行前一直保持权威。过滤后的结果不会宣告
更早的未过滤结果已恢复。跟踪器有两个可观察行为：

- 某工具首次被至少一个范围报告（此前没有任何范围报告它）时触发一次警告日志，
  后续调用不会重复警告。当每个报告过它的范围都观测到恢复后，再次缺失会重新警告。
- 某场所变为空仓（无未平仓持仓）时，其跟踪器条目被清除，
  避免陈旧工具一直保留标记。

`build_snapshot(account_id)` 会更新该账户的范围。净值曲线或
`snapshot_interval_ms` 记录的快照不更新跟踪器，它们只在
`unpriced_instruments` 中报告无法估价的持仓。

调用 `missing_price_instruments(venue)` 可查看当前集合。

:::tip
若 `equity()` 低于预期，先检查 `missing_price_instruments(venue)`
再去核对计算。没有可用 mark、报价、成交或 bar 价格的工具会被排除在总额之外，
并出现在缺失价格跟踪器中。
:::

### 场所与账户范围 {#venue-and-account-scope}

Python 集合查询接受可选的 `venue` 和 `account_id` 范围。两者都给定时，
账户必须在该场所下签发或在其中有持仓，否则查询抛出 `ValueError`。
`account_id=None` 时，场所查询聚合该场所上的每个账户。

`balances_locked`、`instrument_initial_margins`、`instrument_maintenance_margins`
读取的是单个账户。不给 `account_id` 时，只有在场所下恰好签发一个账户时才能解析，
否则返回 `None`。

按账户过滤的估值只对账该账户的观测，因此同一场所上其他账户触发的标记会保留。

### Python 查询边界 {#python-query-boundary}

Python 的 Portfolio 是组合状态只读查询的门面，不暴露初始化、重置或更新命令，
权威变更仍由 Rust 引擎负责。统计注册是例外，它配置的是分析而非组合状态。
该门面也不暴露内部的已记录已实现盈亏缓存。

`account()` 返回一份脱离的、时点副本。副本**不反映其后的账户更新**，
修改它也不影响 Portfolio。要获取最新账户状态，需再次调用 `account()`。

## 组合统计 {#portfolio-statistics}

`Portfolio.statistics()` 从全部账户、缓存持仓、持仓快照、记录的平仓时盈亏和
组合快照计算出一个新的 `PortfolioStatistics` 值。每次调用都重新计算，
热路径上应少调用。

结果包含：

- 每个币种的盈亏统计。
- 来自下文所述首选收益率序列的收益率统计。
- 由持仓推导的通用统计。

默认集合包含 `WinRate`、`ProfitFactor`、`SharpeRatio` 和 `LongRatio`。
全部内置统计类型见 [Analysis API
Reference](https://nautilustrader.io/docs/python-api-latest/analysis.html)。

把另一个内置类型（如 `MaxDrawdown`）传给 `Portfolio.register_statistic()`，
即可将其加入 `Portfolio.statistics()`、回测结果与运行后日志。
独立的 `PortfolioAnalyzer` 维护自己的注册，不会作用于 Portfolio。

回测后，`engine.get_result()` 通过 `stats_pnls`、`stats_returns`、
`stats_general` 以及选定的 `returns_series` 暴露这些类别。`run_analysis=true`
时，引擎还会在运行结束后把三类统计记入 `PORTFOLIO PERFORMANCE` 日志。

### 自定义统计 {#custom-statistics}

继承 `PortfolioStatistic` 并按统计支持输入哪些类别，覆写对应的计算方法。
每个类别收到与内置统计相同的数据，统计只在自己覆写了匹配方法的地方贡献值。
`Portfolio.statistics()` 供给前三个类别。基准相对结果来自
`PortfolioAnalyzer.get_performance_stats_returns_vs_benchmark()`，
基准序列由调用方传入。

| 方法                                  | 输入                                        | 结果类别          |
| --------------------------------------- | -------------------------------------------- | ------------------------ |
| `calculate_from_returns`                | 以 UNIX 纳秒为键的收益率            | `returns`                |
| `calculate_from_realized_pnls`          | 单一币种的已实现盈亏，由旧到新 | `pnls`                   |
| `calculate_from_positions`              | 持仓与持仓快照             | `general`                |
| `calculate_from_returns_with_benchmark` | 策略收益率与基准收益率       | 仅 `PortfolioAnalyzer` |

```python
from nautilus_trader.analysis import PortfolioStatistic


class TradeCount(PortfolioStatistic):
    def calculate_from_realized_pnls(self, realized_pnls: list[float]) -> float | None:
        return float(len(realized_pnls))


engine.portfolio.register_statistic(TradeCount())
```

名称默认按词边界拆分类名，`TradeCount` 注册为 "Trade Count"。
覆写 `name` 属性可直接指定名称。注册的统计与已有统计重名时会替换它，
`Portfolio.deregister_statistic()` 按名称移除一个。

注册在 `Portfolio.statistics()` 调用与分析器状态重置之间持续有效，
因此整个运行的回测结果与运行后日志都会包含它。要在每次查询中都生效，
需在运行前注册。

返回 `float`，指标对所给数据无定义时返回 `None`。要为空数据或数据不足
定义结果：指标未知时返回 `None`，或使用领域上合适的默认值如 `0.0`。
抛出异常或返回非数值的统计会记录错误，且该类别不贡献值，其余统计照常计算。

每个已注册统计的每个类别都会被调用，包括没有成交的运行——此时
PnL 类别收到空列表。

:::warning
计算方法运行时 Portfolio 以借用方式持有其内部状态，因此在其中调用任何会修改状态的
Portfolio 方法都会 panic。统计应保持为所给数据的纯函数。
:::

## 收益率：持仓与组合之别 {#returns-position-vs-portfolio}

分析器跟踪两条不同的收益率序列：

- **持仓收益率**（`analyzer.position_returns()`）度量每个持仓的已实现收益率，
  是相对平均开仓价、考虑方向的收益率，反映工具从入场到出场的价格变动，
  与账户规模、杠杆无关。
- **组合收益率**（`analyzer.portfolio_returns()`）度量盯市账户净值的每日百分比
  变化。10 万美元的账户某天盈利 900 美元，当天约为 0.9%。

完整的组合快照横跨**至少两个不同的 UTC 日期**时，分析器取每个日期的最后一个
快照自动计算组合收益率，并将其作为统计、tearsheet 与月度收益率热力图的首选序列。

每日采样遵循以下规则：

- 恰在 UTC 午夜发布的快照为前一个日期收尾，使日级层级与细粒度样本保持一致。
- 首个有效注册样本为不完整的首日锚定期初值。
- 每个账户有了首个有效样本后，缺失或无法估价的账户日期用前值填充。
- 同一日期的多个快照只计一天，仅日内交易不会产生组合收益率。

组合收益率不可用时，分析器回退到持仓收益率。Python tearsheet 也可以
回退到账户报告。

便捷访问器 `analyzer.returns()` 按此优先级解析：有组合收益率用组合收益率，
否则用持仓收益率。

### 多币种账户 {#multi-currency-accounts}

组合收益率要求每个账户的快照净值能归并为单一共同币种。基础币种换算通常提供
这个标量值。当快照暴露多个币种、或不同账户归并到不同币种时，分析器回退到
持仓收益率。显式指定 tearsheet 币种时，可以在有数据的地方选取该币种的
按币种净值。

要多币种组合收益率，先把余额换算为共同币种，再在外部计算百分比变化。

### 多账户计算 {#multi-account-calculation}

回测分析先把所有缓存账户归并到共同币种，再作聚合。多场所回测中，
tearsheet 遵循同样的全账户聚合规则。

## 相关指南 {#related-guides}

- [持仓](./positions.md)：组合内的持仓跟踪。
- [报告](./reports.md)：生成组合分析报告。
- [可视化](./visualization.md)：可视化组合绩效。
