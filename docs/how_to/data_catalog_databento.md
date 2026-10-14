# 用 Databento 建数据目录

用 Databento 的行情数据搭建 Nautilus 的 Parquet 数据目录。数据目录为回测和研究提供高效的
存储与查询。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/how_to/data_catalog_databento.py)。

## 前提条件 {#prerequisites}

- Python 3.13+
- 已安装 [NautilusTrader](https://pypi.org/project/nautilus_trader/) 2.x
  （`pip install -U --pre nautilus_trader`）
- [databento](https://pypi.org/project/databento/) Python 客户端库（`pip install databento`）
- [Databento](https://databento.com) 账户，API key 已设置为 `DATABENTO_API_KEY`

## 请求数据 {#request-data}

初始化 Databento 历史数据客户端。客户端默认从 `DATABENTO_API_KEY` 环境变量读取 API key。

```python
import databento as db


client = db.Historical()  # Uses the DATABENTO_API_KEY environment variable
```

**`timeseries.get_range` 的每次历史流式请求都会产生费用（即使是相同的数据），因此**：
- 请求前先查询费用
- 避免重复请求相同数据
- 把响应以 zstd 压缩的 DBN 文件写到磁盘

每次请求前用元数据 [get_cost endpoint](https://databento.com/docs/api-reference-historical/metadata/metadata-get-cost?historical=python&live=python) 估算费用。只请求磁盘上还没有的数据。

响应的单位是美元，以美分的分数形式显示。

下面的请求数据量很小（取自 Databento 博客文章 [Building high-frequency trading signals in Python with Databento and sklearn](https://databento.com/blog/hft-sklearn-python)），仅用于演示工作流。

```python
from pathlib import Path

from databento import DBNStore
```

先准备一个目录存放原始 Databento DBN 格式数据，教程余下部分都会用到它。

```python
DATABENTO_DATA_DIR = Path("databento")
DATABENTO_DATA_DIR.mkdir(exist_ok=True)
```

```python
# Request cost quote (USD) - this endpoint is 'free'
client.metadata.get_cost(
    dataset="GLBX.MDP3",
    symbols=["ES.n.0"],
    stype_in="continuous",
    schema="mbp-10",
    start="2023-12-06T14:30:00",
    end="2023-12-06T20:30:00",
)
```

用历史 API 请求博客文章中用到的数据。

```python
path = DATABENTO_DATA_DIR / "es-front-glbx-mbp10.dbn.zst"

if not path.exists():
    # Request data
    client.timeseries.get_range(
        dataset="GLBX.MDP3",
        symbols=["ES.n.0"],
        stype_in="continuous",
        schema="mbp-10",
        start="2023-12-06T14:30:00",
        end="2023-12-06T20:30:00",
        path=path,  # <-- Passing a `path` writes the data to disk
    )
```

从磁盘读取数据并转换为 pandas.DataFrame

```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

## 写入数据目录 {#write-to-data-catalog}

本指南把目录写到工作目录下的 `catalog/`，每次运行都会替换该目录。

```python
import shutil
from pathlib import Path

from nautilus_trader.adapters.databento import DatabentoDataLoader
from nautilus_trader.model import InstrumentId
from nautilus_trader.persistence import ParquetDataCatalog
```

```python
CATALOG_PATH = Path.cwd() / "catalog"

# Clear if it already exists
if CATALOG_PATH.exists():
    shutil.rmtree(CATALOG_PATH)
CATALOG_PATH.mkdir()

# Create a catalog instance
catalog = ParquetDataCatalog(str(CATALOG_PATH))
```

用 `DatabentoDataLoader` 把数据解码并加载为 Nautilus 对象。

```python
loader = DatabentoDataLoader()
```

`instrument_id` 参数可选，但传入它可以跳过符号映射、加快加载。若提供，使用 Nautilus 的
`symbol.venue` 格式（例如 "ESZ3.GLBX"）。

```python
path = DATABENTO_DATA_DIR / "es-front-glbx-mbp10.dbn.zst"

# Option 1 (recommended): Let the loader infer the instrument ID from DBN metadata
depth = loader.load_order_book_depth(filepath=path)

# Option 2: Explicitly specify a valid Nautilus instrument ID (symbol.venue format)
# instrument_id = InstrumentId.from_str("ESZ3.GLBX")  # E-mini S&P December 2023 futures on Globex
# depth = loader.load_order_book_depth(
#     filepath=path,
#     instrument_id=instrument_id,
# )
```

```python
# Write data to catalog (this takes ~20 seconds or ~250,000/second for writing MBP-10 at the moment)
catalog.write_order_book_depths(depth)
```

```python
# Test reading from catalog
depths = catalog.query_order_book_depths()
len(depths)
```

## 准备 AAPL 一个月的成交数据 {#preparing-a-month-of-aapl-trades}

接下来扩展这个工作流：用 Databento 的 `trades` schema 准备 Nasdaq 交易所 AAPL 一个月的
成交数据，它们会转换为 Nautilus 的 `TradeTick` 对象。

```python
# Request cost quote (USD) - this endpoint is 'free'
client.metadata.get_cost(
    dataset="XNAS.ITCH",
    symbols=["AAPL"],
    schema="trades",
    start="2024-01",
)
```

请求历史数据时传入 `path` 参数即可写到磁盘。

```python
path = DATABENTO_DATA_DIR / "aapl-xnas-202401.trades.dbn.zst"

if not path.exists():
    # Request data
    client.timeseries.get_range(
        dataset="XNAS.ITCH",
        symbols=["AAPL"],
        schema="trades",
        start="2024-01",
        path=path,  # <-- Passing a `path` parameter
    )
```

从磁盘读取数据并转换为 pandas.DataFrame

```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

使用 `InstrumentId` `"AAPL.XNAS"`，其中 XNAS 是 Nasdaq 场所的 ISO 10383 MIC
（市场识别码）。

传入 `instrument_id` 可以跳过符号映射，加快加载。

```python
instrument_id = InstrumentId.from_str("AAPL.XNAS")

trades = loader.load_trades(
    filepath=path,
    instrument_id=instrument_id,
)
```

这里按月组织数据，每天一个文件同样可行。

```python
# Write data to catalog
catalog.write_trade_ticks(trades)
```

```python
trades = catalog.query_trade_ticks([str(instrument_id)])
```

```python
len(trades)
```
