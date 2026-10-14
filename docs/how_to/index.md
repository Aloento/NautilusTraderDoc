# 操作指南 {#howto-guides}

面向目标的常用任务配方。每篇指南都默认读者熟悉 Nautilus 的核心概念，聚焦于完成某个具体结果。

刚接触 Nautilus？先走[快速开始](./../getting_started/index.md)和[教程](./../tutorials/index.md)。

## 数据工作流 {#data-workflows}

| 指南                                                    | 说明                                       |
| :---------------------------------------------------- | :------------------------------------------- |
| [加载外部数据][loading_external_data]                   | 把 CSV 数据加载到 Parquet 数据目录。         |
| [用 Databento 建数据目录][data_catalog_databento]       | 用 Databento 行情数据建立目录。              |

## 实时交易 {#live-trading}

| 指南                                                             | 说明                                                 |
| :------------------------------------------------------ | :--------------------------------------------------- |
| [配置实时交易节点](./configure_live_trading.md)              | 设置 LiveNodeConfig、执行引擎与交易场所。            |
| [Lighter 快速上手](./get_started_lighter.md)                   | 用 Rust 或 Python 启动 Lighter。                     |

## Rust {#rust}

| 指南                                                         | 说明                                                |
| :----------------------------------------------- | :-------------------------------------------------- |
| [编写 Actor（Rust）](./write_rust_actor.md)          | 构建带订阅和处理器的数据 Actor。                    |
| [编写策略（Rust）](./write_rust_strategy.md)         | 构建带订单管理的策略。                              |
| [运行回测（Rust）](./run_rust_backtest.md)           | 用 BacktestEngine 或 BacktestNode 搭配数据目录。     |
| [运行实时交易（Rust）](./run_rust_live_trading.md)   | 用 LiveNode 连接交易场所。                          |

[loading_external_data]: ./loading_external_data.md
[data_catalog_databento]: ./data_catalog_databento.md
