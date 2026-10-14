# How-to Guides

Goal-oriented recipes for common tasks. Each guide assumes familiarity with
Nautilus concepts and focuses on achieving a specific outcome.

New to Nautilus? Start with the [getting started](./../getting_started/index.md)
path and [tutorials](./../tutorials/index.md) first.

## Data workflows

| Guide                                                 | Description                                  |
| :---------------------------------------------------- | :------------------------------------------- |
| [Loading external data][loading_external_data]        | Load CSV data into the Parquet data catalog. |
| [Data catalog with Databento][data_catalog_databento] | Set up a catalog with Databento market data. |

## Live trading

| Guide                                                   | Description                                          |
| :------------------------------------------------------ | :--------------------------------------------------- |
| [Configure a live trading node](./configure_live_trading.md) | Set up LiveNodeConfig, execution engine, and venues. |
| [Get started with Lighter](./get_started_lighter.md)         | Start Lighter from Rust or Python.                   |

## Rust

| Guide                                            | Description                                         |
| :----------------------------------------------- | :-------------------------------------------------- |
| [Write an Actor (Rust)](./write_rust_actor.md)        | Build a data actor with subscriptions and handlers. |
| [Write a Strategy (Rust)](./write_rust_strategy.md)   | Build a strategy with order management.             |
| [Run a Backtest (Rust)](./run_rust_backtest.md)       | Use BacktestEngine or BacktestNode with a catalog.  |
| [Run Live Trading (Rust)](./run_rust_live_trading.md) | Connect to a venue with LiveNode.                   |

[loading_external_data]: ./loading_external_data.md
[data_catalog_databento]: ./data_catalog_databento.md