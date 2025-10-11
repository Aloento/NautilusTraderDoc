# 回测（高级 API）

本教程针对 NautilusTrader（高性能的算法交易平台与事件驱动的回测器），演示如何使用其高级 API 进行回测。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/getting_started/backtest_high_level.ipynb)。

## 概述

本教程将展示如何使用 `BacktestNode`，利用历史报价（quote tick）数据在模拟的 FX ECN 交易场景上回测一个简单的 EMA（指数移动平均）交叉策略。

本教程将涵盖以下内容：

- 将原始数据（外部于 Nautilus）导入数据目录（data catalog）。
- 为 `BacktestNode` 配置所需的配置对象。
- 使用 `BacktestNode` 运行回测并查看结果。

## 前置条件

- 已安装 Python 3.11+。
- 已安装 JupyterLab 或同类工具（可用 `pip install -U jupyterlab` 安装）。
- 已安装最新版本的 NautilusTrader（可用 `pip install -U nautilus_trader` 安装）。

## 导入（Imports）

下面列出本教程余下部分所需的全部 import：

```python
import shutil
from decimal import Decimal
from pathlib import Path

import pandas as pd

from nautilus_trader.backtest.node import BacktestDataConfig
from nautilus_trader.backtest.node import BacktestEngineConfig
from nautilus_trader.backtest.node import BacktestNode
from nautilus_trader.backtest.node import BacktestRunConfig
from nautilus_trader.backtest.node import BacktestVenueConfig
from nautilus_trader.config import ImportableStrategyConfig
from nautilus_trader.core.datetime import dt_to_unix_nanos
from nautilus_trader.model import QuoteTick
from nautilus_trader.persistence.catalog import ParquetDataCatalog
from nautilus_trader.persistence.wranglers import QuoteTickDataWrangler
from nautilus_trader.test_kit.providers import CSVTickDataLoader
from nautilus_trader.test_kit.providers import TestInstrumentProvider
```

在开始 notebook 之前，需要先下载一些示例数据以便用于回测。

在本示例中我们使用来自 histdata.com 的外汇（FX）数据。访问 [histdata 的下载页面](https://www.histdata.com/download-free-forex-historical-data/?/ascii/tick-data-quotes/)，选择一个货币对并下载一个或多个月的数据。

示例下载文件：

- `DAT_ASCII_EURUSD_T_202410.csv`（2024 年 10 月的 EUR/USD 数据）
- `DAT_ASCII_EURUSD_T_202411.csv`（2024 年 11 月的 EUR/USD 数据）

下载数据后：

1. 把上述类似的文件复制到一个文件夹，例如 `~/Downloads/Data/`（默认会使用用户的 `Downloads/Data/` 目录）。
2. 将下面的 `DATA_DIR` 变量设置为包含数据的目录。

```python
DATA_DIR = "~/Downloads/Data/"
```

```python
path = Path(DATA_DIR).expanduser()
raw_files = list(path.iterdir())
assert raw_files, f"Unable to find any histdata files in directory {path}"
raw_files
```

## 将数据加载到 Parquet 数据目录

Histdata 将外汇数据以 CSV/text 格式存储，字段通常为 `timestamp, bid_price, ask_price`。
首先把这些原始数据加载为与 Nautilus 报价兼容的 `pandas.DataFrame`。

随后使用 `QuoteTickDataWrangler` 对 DataFrame 进行处理，生成 Nautilus 的 `QuoteTick` 对象。

```python
# 这里我们只读取找到的第一个数据文件并加载为 pandas DataFrame
df = CSVTickDataLoader.load(
    file_path=raw_files[0],                                   # Input 1st CSV file
    index_col=0,                                              # Use 1st column in data as index for dataframe
    header=None,                                              # There are no column names in CSV files
    names=["timestamp", "bid_price", "ask_price", "volume"],  # Specify names to individual columns
    usecols=["timestamp", "bid_price", "ask_price"],          # Read only these columns from CSV file into dataframe
    parse_dates=["timestamp"],                                # Specify columns containing date/time
    date_format="%Y%m%d %H%M%S%f",                            # Format for parsing datetime
)

# 确保数据按时间戳排序
df = df.sort_index()

# 预览已加载的数据框（前两行）
df.head(2)
```

```python
# 使用 wrangler 处理报价数据
EURUSD = TestInstrumentProvider.default_fx_ccy("EUR/USD")
wrangler = QuoteTickDataWrangler(EURUSD)

ticks = wrangler.process(df)

# 预览：查看前 2 条 tick
ticks[0:2]
```

更多关于数据加载的细节，请参见 [Loading data](../concepts/data) 指南。

接下来，实例化一个 `ParquetDataCatalog`（传入一个目录用来存放数据；默认会使用当前目录）。
然后把 instrument 和 tick 数据写入 catalog。根据你包含的数据月份数量，加载过程通常只需要几分钟。

```python
CATALOG_PATH = Path.cwd() / "catalog"

# 如果目录已存在则先删除，再创建一个新的
if CATALOG_PATH.exists():
    shutil.rmtree(CATALOG_PATH)
CATALOG_PATH.mkdir(parents=True)

# 创建 catalog 实例
catalog = ParquetDataCatalog(CATALOG_PATH)

# 写入 instrument 到 catalog
catalog.write_data([EURUSD])

# 写入 ticks 到 catalog
catalog.write_data(ticks)
```

## 使用数据目录

数据写入 catalog 后，可以使用 `catalog` 实例来为回测或研究加载数据。
它提供了多种方法来从目录中提取数据，例如 `.instruments(...)` 和 `quote_ticks(...)`（示例如下）。

```python
# 获取 catalog 中的所有 instruments 列表
catalog.instruments()
```

```python
# 查看 catalog 的第 1 个 instrument
instrument = catalog.instruments()[0]
instrument
```

```python
# 从 catalog 中查询 quote-ticks
start = dt_to_unix_nanos(pd.Timestamp("2024-10-01", tz="UTC"))
end =  dt_to_unix_nanos(pd.Timestamp("2024-10-15", tz="UTC"))
selected_quote_ticks = catalog.quote_ticks(instrument_ids=[EURUSD.id.value], start=start, end=end)

# 预览前几条
selected_quote_ticks[:2]
```

## 添加交易场所（venues）

```python
venue_configs = [
    BacktestVenueConfig(
        name="SIM",
        oms_type="HEDGING",
        account_type="MARGIN",
        base_currency="USD",
        starting_balances=["1_000_000 USD"],
    ),
]
```

## 添加数据配置

```python
str(CATALOG_PATH)
```

```python
data_configs = [
    BacktestDataConfig(
        catalog_path=str(CATALOG_PATH),
        data_cls=QuoteTick,
        instrument_id=instrument.id,
        start_time=start,
        end_time=end,
    ),
]
```

## 添加策略

```python
strategies = [
    ImportableStrategyConfig(
        strategy_path="nautilus_trader.examples.strategies.ema_cross:EMACross",
        config_path="nautilus_trader.examples.strategies.ema_cross:EMACrossConfig",
        config={
            "instrument_id": instrument.id,
            "bar_type": "EUR/USD.SIM-15-MINUTE-BID-INTERNAL",
            "fast_ema_period": 10,
            "slow_ema_period": 20,
            "trade_size": Decimal(1_000_000),
        },
    ),
]
```

## 配置回测

Nautilus 使用 `BacktestRunConfig` 对象来集中管理回测配置。
`BacktestRunConfig` 支持分阶段配置（Partialable），因此你可以逐步构建配置对象，便于在需要进行参数网格搜索等多次回测时减少样板代码。

```python
config = BacktestRunConfig(
    engine=BacktestEngineConfig(strategies=strategies),
    data=data_configs,
    venues=venue_configs,
)
```

## 运行回测

现在可以运行回测节点（BacktestNode），它会在整个数据流上模拟交易过程。

```python
node = BacktestNode(configs=[config])

results = node.run()
results
```
