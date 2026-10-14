# 回测 {#backtesting}

回测用历史数据模拟交易，使用的核心组件与实时交易相同，包括内置引擎、`Cache`、[消息总线](./../message_bus.md)、`Portfolio`、[Actor](./../actors.md)、[策略](./../strategies.md)、[执行算法](./../execution/algorithms.md)和用户自定义模块。

`BacktestEngine` 处理一条历史数据流。数据流读完后，引擎产出结果与绩效指标供分析。NautilusTrader 提供两个层级的回测 API：

| API 层级  | 适用场景                                                              |
| ---------- | ----------------------------------------------------------------------- |
| 高层       | 需要使用 `BacktestNode`、配置对象、数据目录和批量运行。 |
| 低层       | 需要直接控制 `BacktestEngine`、手动装配组件。    |

本节介绍 Rust 回测引擎及其 Python 包根层 API。

## 阅读指引 {#reading-guide}

自动生成的侧边栏可能按字母序排列这些页面。端到端阅读时建议按以下顺序：

| 步骤 | 页面                                                      | 用途                                            |
| ---- | ------------------------------------------------------- | ----------------------------------------------- |
| 1    | [API 与重复运行](./apis-and-runs.md)              | 选择 API 层级、加载数据、批量运行。   |
| 2    | [数据与交易场所](./data-and-venues.md)                   | 让数据粒度与场所 `book_type` 匹配。  |
| 3    | [执行流程](./execution-flow.md)                     | 理解事件顺序、定时器与成交 ID。   |
| 4    | [成交价格与撮合](./fill-prices-and-matching.md) | 理解确定性撮合行为。     |
| 5    | [成交执行](./trade-execution.md)                   | 使用 trade tick、主动方方向与排队。   |
| 6    | [Bar 执行](./bar-execution.md)                       | 使用 bar、OHLC 顺序与 bar 定时。      |
| 7    | [成交模型](./fill-models.md)                           | 配置滑点与概率成交。     |
| 8    | [账户与保证金](./accounts-and-margin.md)           | 配置资金、余额与保证金模型。 |

## 模拟模块 {#simulation-modules}

[模拟模块](./simulation-modules.md)介绍模块配置、生命周期、失败处理，以及内置的外汇展期和 CFD swap 行为。

## 相关指南 {#related-guides}

- [策略](./../strategies.md)：开发待回测的策略。
- [可视化](./../visualization.md)：从回测结果生成 tearsheet。
- [报告](./../reports.md)：分析回测绩效数据。
