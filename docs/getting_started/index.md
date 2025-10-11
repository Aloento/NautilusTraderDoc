# 入门

要开始使用 NautilusTrader，您需要准备以下环境：

- 一个安装了 `nautilus_trader` 包的 Python 3.11–3.13 环境。
- 能够运行 Python 脚本或 Jupyter Notebook，以便进行回测（backtesting）和/或实盘交易（live trading）。

## [安装指南](installation.md)

“安装指南”将帮助您在本机正确安装 NautilusTrader。

## [快速上手](quickstart.md)

“快速上手”提供逐步引导，带您完成第一个回测的全部配置与运行。

## 仓库中的示例

在线文档（[https://nautilustrader.io/docs/latest/](https://nautilustrader.io/docs/latest/)）仅展示了部分示例。完整示例请查看 GitHub 仓库。

下表按推荐的学习顺序列出了示例所在位置：

| 目录                                                                                 | 内容                                                 |
| :----------------------------------------------------------------------------------- | :--------------------------------------------------- |
| [examples/](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples) | 可直接运行的独立 Python 示例。                       |
| [docs/tutorials/](../tutorials/)                                                     | 以 Jupyter notebook 形式展示的教程，演示常见工作流。 |
| [docs/concepts/](../concepts/)                                                       | 概念性指南，包含简洁的代码片段以说明关键特性。       |
| [nautilus_trader/examples/](../nautilus_trader/examples/)                            | 纯 Python 的基础策略、指标和执行算法示例。           |
| [tests/unit_tests/](../../tests/unit_tests/)                                         | 覆盖核心功能和边界情况的单元测试。                   |

## 回测（Backtesting）API 等级

NautilusTrader 为回测提供两种 API 等级：

| API 等级       | 说明                                 | 特点                                                                                   |
| :------------- | :----------------------------------- | :------------------------------------------------------------------------------------- |
| High-Level API | 使用 `BacktestNode` 和 `TradingNode` | 推荐用于生产环境：更容易迁移到实盘交易；需要基于 Parquet 的数据目录（data catalog）。  |
| Low-Level API  | 使用 `BacktestEngine`                | 适用于库级开发：没有直接的实盘路径；可直接访问组件，但可能鼓励产生不适用于实盘的模式。 |

回测是在历史数据上运行模拟交易系统的过程。

在开始使用 NautilusTrader 进行回测之前，您需要先了解这两种 API 等级，以便选择最适合您用例的方式。

:::info
如需了解如何选择合适的 API 等级，请参阅 [Backtesting](../concepts/backtesting.md) 指南。
:::

### [回测（低级 API）](backtest_low_level.md)

本教程演示如何使用数据加载器（data loaders）和数据整理器（wranglers）加载 Nautilus 之外的原始数据，然后使用 `BacktestEngine` 运行一次回测。

### [回测（高级 API）](backtest_high_level.md)

本教程演示如何将 Nautilus 之外的原始数据导入到数据目录（data catalog），然后使用 `BacktestNode` 运行一次回测。

## 使用 Docker 运行

另一种方式是下载一个独立的、已容器化的 Jupyter Notebook 服务镜像，这无需本地环境安装配置，是最快的试用方式。请注意，删除容器会一并删除容器内的数据。

- 开始前请先安装 Docker：
  - 访问 [Docker 安装指南](https://docs.docker.com/get-docker/) 并按说明操作。
- 在终端中拉取最新版镜像：
  - `docker pull ghcr.io/nautechsystems/jupyterlab:nightly --platform linux/amd64`
- 运行容器并映射 Jupyter 端口：
  - `docker run -p 8888:8888 ghcr.io/nautechsystems/jupyterlab:nightly`
- 在浏览器中打开：
  - `http://localhost:8888`

:::info
当前 NautilusTrader 在 Jupyter Notebook 的日志输出（stdout）上会超过限制（rate limit），因此示例中将 `log_level` 设置为 `ERROR`。若将日志级别调低以查看更多日志，可能会导致 notebook 在单元格执行时卡住。我们正在研究两种可能的解决方案：要么提高 Jupyter 的配额限制，要么对 Nautilus 的日志刷新进行限流（throttling）。

[jupyterlab issue #12845](https://github.com/jupyterlab/jupyterlab/issues/12845)  
[deshaw/jupyterlab-limit-output](https://github.com/deshaw/jupyterlab-limit-output)
:::
