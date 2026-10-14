# 快速开始

## 1. 安装 {#1-install}

准备一个 Python 3.13-3.14 环境，安装包：

```bash
pip install -U --pre nautilus_trader
```

PyPI 上的 NautilusTrader 2.x 以 `2.0.0rcN` 预发布版本提供。在 `2.0.0`
正式发布前都要加 `--pre`。用下面的命令确认安装结果：

```bash
python -c "import nautilus_trader; print(nautilus_trader.__version__)"
```

平台支持范围与源码构建见[安装](./installation.md)指南。

## 2. 运行快速上手 {#2-run-the-quickstart}

[快速上手](./quickstart.md)用合成数据带你五分钟内跑通第一个回测，
无需下载数据，也不必配置数据目录。

入门教程都使用同一个简单的 EMA 交叉策略，这是有意为之——交易逻辑不是重点，
这些教程要讲的是引擎的运转方式：数据加载、场所模拟、订单生命周期与报告。
引擎机制熟悉之后，[教程](./../tutorials/index.md)会引入别的策略（均值回归、
订单簿失衡、网格做市）。

## 3. 选择路线 {#3-choose-your-path}

- **回测**——先了解下文两种 API 层级，再按[教程](./../tutorials/index.md)
  过一遍策略模式讲解。
- **实时交易**——看[配置实时交易节点](./../how_to/configure_live_trading.md)
  与[集成](./../integrations/index.md)，了解支持的场所。
- **数据工作流**——[操作指南](./../how_to/index.md)讲如何加载外部数据、
  搭建 Parquet 数据目录。
- **编写适配器**——见[开发者指南](./../developer_guide/index.md)。

## 回测 API 层级 {#backtesting-api-levels}

NautilusTrader 提供两种回测 API 层级：

| API 层级                              | 入口             | 适用场景                                                            |
| :------------------------------------ | :--------------- | :-------------------------------------------------------------------- |
| [低层 API](./backtest_low_level.md)   | `BacktestEngine` | 直接操作组件、开发库                          |
| [高层 API](./backtest_high_level.md) | `BacktestNode`   | 生产工作流，便于过渡到实时交易（推荐） |

高层 API 要求基于 Parquet 的数据目录；低层 API 可直接处理内存数据，但没有对应的实时交易路径。

:::warning[一个进程一个节点]
受全局单例状态限制，同一进程内并发运行多个 `BacktestNode` 或 `LiveNode`
实例不受支持。顺序执行、两次运行之间正确释放资源是可以的。
同一线程上构建替代的 `LiveNode` 前，也要先丢弃旧节点，
或在 Python 中释放对它的引用。

细节见[进程与线程](./../concepts/architecture.md#processes-and-threads)。
:::

如何选择 API 层级，见[回测](./../concepts/backtesting/index.md)概念指南。

## 仓库中的示例 {#examples-in-the-repository}

在线文档只展示部分示例，完整示例见 GitHub 仓库：

| 目录                                                                                 | 内容                                                  |
| :----------------------------------------------------------------------------------- | :---------------------------------------------------- |
| [examples/](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples) | 按环境组织的可运行 Python 示例     |
| [docs/tutorials/](./../tutorials/index.md)                                                     | 演示常见工作流的教程              |
| [docs/concepts/](./../concepts/index.md)                                                       | 附带示例代码片段的概念指南        |
| [python/tests/unit/](https://github.com/nautechsystems/nautilus_trader/tree/develop/python/tests/unit)                                       | 覆盖核心功能与边界情况的单元测试 |

## 在 Docker 中运行 {#running-in-docker}

自带 Jupyter notebook 服务器的 Docker 镜像是零本地配置体验
NautilusTrader 最快的方式。删除容器时，其中数据一并删除。

```bash
# Pull the latest image
docker pull ghcr.io/nautechsystems/jupyterlab:nightly --platform linux/amd64

# Run the container
docker run -p 8888:8888 ghcr.io/nautechsystems/jupyterlab:nightly
```

然后在浏览器打开 <http://localhost:8888>。

:::warning
示例中统一使用 `LoggerConfig(stdout_level=LogLevel.ERROR)`：Nautilus 的日志量会超出
Jupyter 的 stdout 速率上限，日志级别更低时 notebook 会卡住。
:::
