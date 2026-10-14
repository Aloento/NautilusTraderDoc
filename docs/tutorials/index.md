# 教程 {#tutorials}

这些教程按步骤讲解 NautilusTrader 的功能与工作流。

:::info
多数 Python 教程是 Jupytext percent 格式文件，位于文档仓库的
[tutorials 目录](https://github.com/nautechsystems/nautilus_trader/tree/develop/docs/tutorials)。
这些文件既可以直接当脚本运行，也可以通过 Jupytext 作为 notebook 打开。
Rust 教程按其页面上给出的命令运行。
:::

:::note

- **Latest**：基于 `master` 分支构建的文档，对应稳定版本。
  见 <https://nautilustrader.io/docs/latest/tutorials/>。
- **Nightly**：基于 `develop` 分支构建的文档，包含实验性功能。
  见 <https://nautilustrader.io/docs/nightly/tutorials/>。

:::

## 推荐顺序 {#recommended-order}

刚接触 NautilusTrader 的话，按以下顺序完成教程：

1. [Quickstart](./../getting_started/quickstart.md)：用合成数据在五分钟内跑通第一个回测。
1. [回测（低层 API）](./../getting_started/backtest_low_level.md)：直接使用 `BacktestEngine`，
   配合真实行情数据与执行算法。
1. [回测（高层 API）](./../getting_started/backtest_high_level.md)：用 `BacktestNode` 和 Parquet 数据目录
   运行配置驱动的回测。
1. [加载外部数据][loading_external_data]：把 CSV 或其他外部数据加载到
   `ParquetDataCatalog`（操作指南）。
1. [使用 FX K 线数据回测][backtest_fx_bars]：对 FX K 线回测，并模拟隔夜利息。
1. 再从下面的列表中挑选感兴趣的专题教程。

## 回测 {#backtesting}

| 教程                                                                        | 说明                                           | 数据                    |
| :-------------------------------------------------------------------------- | :--------------------------------------------- | :---------------------- |
| [使用 FX K 线数据回测][backtest_fx_bars]                                     | FX K 线上的 EMA 交叉，含隔夜利息模拟。           | 示例数据                |
| [使用订单簿深度数据回测（Binance）][backtest_orderbook_binance]              | 深度数据上的订单簿失衡策略。                     | 示例数据或用户自备      |
| [使用订单簿深度数据回测（Bybit）][backtest_orderbook_bybit]                  | 深度数据上的订单簿失衡策略。                     | 示例数据或用户自备      |

## 数据工作流 {#data-workflows}

面向具体任务的数据配方见 [操作指南](./../how_to/index.md)：

| 指南                                                  | 说明                                          | 数据              |
| :---------------------------------------------------- | :--------------------------------------------- | :---------------- |
| [加载外部数据][loading_external_data]                  | 把外部数据加载到 `ParquetDataCatalog`。         | 用户自备          |
| [用 Databento 建数据目录][data_catalog_databento]      | 用 Databento 的各种 schema 搭建数据目录。       | Databento API key |

## 策略范式 {#strategy-patterns}

| 教程                                                                                | 说明                                          | 数据              |
| :---------------------------------------------------------------------------------- | :--------------------------------------------- | :---------------- |
| [代理 FX 数据均值回归（AX Exchange）](./fx_mean_reversion_ax.md)                     | EURUSD-PERP 上的布林带均值回归。               | TrueFX 代理       |
| [黄金永续合约订单簿失衡（AX Exchange）](./gold_book_imbalance_ax.md)                 | XAU-PERP 上的订单簿失衡。                      | Databento API key |
| [链上短周期挂单网格做市（dYdX）](./grid_market_maker_dydx.md)                        | dYdX v4 永续合约上的网格做市。                 | 实时 API          |

## 期权 {#options}

| 教程                                                                    | 说明                                           | 数据     |
| :---------------------------------------------------------------------- | :--------------------------------------------- | :------- |
| [期权数据与 Greeks（Bybit）](./options_data_bybit.md)                   | 流式获取 Greeks 和期权链快照。                 | 实时 API |
| [Delta 中性期权策略（Bybit）](./delta_neutral_options_bybit.md)         | 卖出宽跨式，用永续合约做 delta 对冲。          | 实时 API |
| [Delta 中性期权策略（Derive）](./delta_neutral_options_derive.md)       | Derive ETH 宽跨式对冲，按权利金择时入场。      | 实时 API |

## Rust {#rust}

| 教程                                                                                      | 说明                                                | 数据                |
| :---------------------------------------------------------------------------------------- | :--------------------------------------------------- | :------------------ |
| [订单簿失衡回测（Betfair）](./backtest_book_imbalance_betfair.md)                          | Betfair L2 数据上的订单簿失衡 Actor。                | 用户自备            |
| [Lighter RWA 组合做市（配合 Databento EQUS NVDA）](./lighter_rwa_composite_mm.md)          | NVDA-PERP 上信号偏斜的做市。                         | Databento + Lighter |
| [Hurst/VPIN 方向性策略（Kraken Futures）](./hurst_vpin_kraken.md)                          | PF_XBTUSD 上经市场状态过滤的知情流策略。             | Tardis.dev          |

[backtest_fx_bars]: ./backtest_fx_bars.md
[backtest_orderbook_binance]: ./backtest_orderbook_binance.md
[backtest_orderbook_bybit]: ./backtest_orderbook_bybit.md
[loading_external_data]: https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/how_to/loading_external_data.md
[data_catalog_databento]: https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/how_to/data_catalog_databento.md
