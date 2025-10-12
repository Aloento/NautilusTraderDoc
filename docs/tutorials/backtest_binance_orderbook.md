# 回测：Binance OrderBook 数据

本教程针对 NautilusTrader，展示如何为 OrderBook 数据建立数据目录（data catalog）并用 `BacktestNode` 回测 `OrderBookImbalance` 策略。该示例需要你自行准备 Binance 的 order book 数据（不随仓库提供）。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/tutorials/backtest_binance_orderbook.ipynb)。

:::info
本教程仍在编写中，部分细节可能会更新。
:::

## 概述

本教程演示如何准备数据目录并构建一个 `BacktestNode`，以在 Order Book 数据上回测 `OrderBookImbalance` 策略。示例假定你已经拥有 Binance 的订单簿（order book）快照与更新数据。

## 前置条件

- 已安装 Python 3.11+。
- 已安装 JupyterLab 或同类工具（`pip install -U jupyterlab`）。
- 已安装 NautilusTrader 最新发布版（`pip install -U nautilus_trader`）。

## 导入

下面列出本指南其余部分所需的 import：

```python
import os
import shutil
from decimal import Decimal
from pathlib import Path

import pandas as pd

from nautilus_trader.adapters.binance.loaders import BinanceOrderBookDeltaDataLoader
from nautilus_trader.backtest.node import BacktestDataConfig
from nautilus_trader.backtest.node import BacktestEngineConfig
from nautilus_trader.backtest.node import BacktestNode
from nautilus_trader.backtest.node import BacktestRunConfig
from nautilus_trader.backtest.node import BacktestVenueConfig
from nautilus_trader.config import ImportableStrategyConfig
from nautilus_trader.config import LoggingConfig
from nautilus_trader.core.datetime import dt_to_unix_nanos
from nautilus_trader.model import OrderBookDelta
from nautilus_trader.persistence.catalog import ParquetDataCatalog
from nautilus_trader.persistence.wranglers import OrderBookDeltaDataWrangler
from nautilus_trader.test_kit.providers import TestInstrumentProvider
```

## 加载数据

示例中我们假设数据放在用户的 Downloads 下的一个 Binance 子目录，下面给出示例路径配置：

```python
# 指向你的数据目录，这里以用户的 ~/Downloads 为例
DATA_DIR = "~/Downloads"
```

```python
data_path = Path(DATA_DIR).expanduser() / "Data" / "Binance"
raw_files = list(data_path.iterdir())
assert raw_files, f"Unable to find any histdata files in directory {data_path}"
raw_files
```

首先读取初始的 order book 快照（snapshot）：

```python
# 读取初始快照
path_snap = data_path / "BTCUSDT_T_DEPTH_2022-11-01_depth_snap.csv"
df_snap = BinanceOrderBookDeltaDataLoader.load(path_snap)
df_snap.head()
```

随后读取 order book 的更新（updates）。为节省时间，示例中将读取行数限制为 1 百万行：

```python
# 读取 order book 更新（此处为示例，限制 1M 行）
path_update = data_path / "BTCUSDT_T_DEPTH_2022-11-01_depth_update.csv"
nrows = 1_000_000
df_update = BinanceOrderBookDeltaDataLoader.load(path_update, nrows=nrows)
df_update.head()
```

### 使用 wrangler 处理增量（deltas）

```python
BTCUSDT_BINANCE = TestInstrumentProvider.btcusdt_binance()
wrangler = OrderBookDeltaDataWrangler(BTCUSDT_BINANCE)

deltas = wrangler.process(df_snap)
deltas += wrangler.process(df_update)
deltas.sort(key=lambda x: x.ts_init)  # 确保数据按 `ts_init` 非降序
deltas[:10]
```

### 建立数据目录（data catalog）

```python
CATALOG_PATH = os.getcwd() + "/catalog"

# 若已存在则先删除再创建
if os.path.exists(CATALOG_PATH):
    shutil.rmtree(CATALOG_PATH)
os.mkdir(CATALOG_PATH)

# 创建 ParquetDataCatalog 实例
catalog = ParquetDataCatalog(CATALOG_PATH)
```

```python
# 将 instrument 与 deltas 写入 catalog
catalog.write_data([BTCUSDT_BINANCE])
catalog.write_data(deltas)
```

```python
# 确认 instrument 已写入
catalog.instruments()
```

```python
# 在 catalog 中探查可用数据范围
start = dt_to_unix_nanos(pd.Timestamp("2022-11-01", tz="UTC"))
end =  dt_to_unix_nanos(pd.Timestamp("2022-11-04", tz="UTC"))


print(len(deltas))
deltas[:10]
```

## 配置回测

```python
instrument = catalog.instruments()[0]
book_type = "L2_MBP"  # 确保数据的 book_type 与 venue 的 book_type 匹配

data_configs = [BacktestDataConfig(
        catalog_path=CATALOG_PATH,
        data_cls=OrderBookDelta,
        instrument_id=instrument.id,
        # start_time=start,  # 可按需限定时间范围
        # end_time=end,  # 可按需限定时间范围
    )
]

venues_configs = [
    BacktestVenueConfig(
        name="BINANCE",
        oms_type="NETTING",
        account_type="CASH",
        base_currency=None,
        starting_balances=["20 BTC", "100000 USDT"],
        book_type=book_type,  # <-- venue 的 book_type
    )
]

strategies = [
    ImportableStrategyConfig(
        strategy_path="nautilus_trader.examples.strategies.orderbook_imbalance:OrderBookImbalance",
        config_path="nautilus_trader.examples.strategies.orderbook_imbalance:OrderBookImbalanceConfig",
        config={
            "instrument_id": instrument.id,
            "book_type": book_type,
            "max_trade_size": Decimal("1.000"),
            "min_seconds_between_triggers": 1.0,
        },
    ),
]

# NautilusTrader 在 Jupyter 中的日志输出会超过默认速率限制（stdout），
# 因此示例中将 `log_level` 设置为 "ERROR"。若将其调低以查看更多日志，notebook 可能会在执行时挂起。
# 目前的解决方案方向包括提高 Jupyter 的速率限制或对 Nautilus 的日志刷新进行限流。
# https://github.com/jupyterlab/jupyterlab/issues/12845
# https://github.com/deshaw/jupyterlab-limit-output
config = BacktestRunConfig(
    engine=BacktestEngineConfig(
        strategies=strategies,
        logging=LoggingConfig(log_level="ERROR"),
    ),
    data=data_configs,
    venues=venues_configs,
)

config
```

## 运行回测

```python
node = BacktestNode(configs=[config])

result = node.run()
```

```python
result
```

运行结束后，你可以获取内部的 `BacktestEngine` 实例以便进一步查询报告：

```python
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.model import Venue


engine: BacktestEngine = node.get_engine(config.id)

engine.trader.generate_order_fills_report()
```

```python
engine.trader.generate_positions_report()
```

```python
engine.trader.generate_account_report(Venue("BINANCE"))
```
