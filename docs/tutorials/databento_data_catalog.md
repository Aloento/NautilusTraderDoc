# Databento 数据目录

本教程面向 NautilusTrader（高性能算法交易与事件驱动回测框架），演示如何使用不同的 Databento schema 来构建 Nautilus 的 Parquet 数据目录。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/tutorials/databento_data_catalog.ipynb)。

:::info
本教程仍在编写中，部分内容可能会更新。
:::

## 概述

本教程将演示如何使用 Databento 提供的多种 schema，把历史市场数据写入 Nautilus 的 Parquet 数据目录（data catalog），便于后续的回测与分析。

## 前置条件

- 已安装 Python 3.11+。
- 已安装 JupyterLab 或同类工具（`pip install -U jupyterlab`）。
- 已安装 NautilusTrader 最新发布版（`pip install -U nautilus_trader`）。
- 已安装 Databento Python 客户端（`pip install -U databento`），用于请求数据。
- 拥有一个 Databento 账户（[Databento](https://databento.com)）。

## 请求数据

在本教程中，我们使用 Databento 的 Historical 客户端。你可以在构造函数中显式传入 Databento API key，或像示例中那样通过 `DATABENTO_API_KEY` 环境变量隐式提供（推荐做法）。

```python
import databento as db


client = db.Historical()  # 如果已设置 DATABENTO_API_KEY 环境变量，构造器将自动使用它（推荐）
```

重要提示：通过 `timeseries.get_range` 发起的每一次历史数据流请求都会产生费用（即使请求的是相同的数据）。因此我们应当：

- 在请求前了解并确认请求的费用
- 避免重复请求同一数据（低效且会产生额外费用）
- 将响应持久化到磁盘（写入 zstd 压缩的 DBN 文件），以便后续重用而无需重复请求

Databento 提供了一个 metadata 的 get_cost 接口（参考文档），可在每次请求前先获取费用报价。
在实际流程中，典型的请求序列会先询价（get_cost），仅在本地不存在相应文件时才发起数据请求。

注意：返回的报价以美元计，显示为分的小数形式（fractional cents）。

下面的示例请求量较小（参见 Databento 的一篇 Medium 文章示例），仅用来演示基本流程：

```python
from pathlib import Path

from databento import DBNStore
```

我们为原始的 Databento DBN 格式数据准备一个目录，后续示例会使用该目录保存文件：

```python
DATABENTO_DATA_DIR = Path("databento")
DATABENTO_DATA_DIR.mkdir(exist_ok=True)
```

```python
# 请求费用报价（USD）——该接口本身不收费
client.metadata.get_cost(
    dataset="GLBX.MDP3",
    symbols=["ES.n.0"],
    stype_in="continuous",
    schema="mbp-10",
    start="2023-12-06T14:30:00",
    end="2023-12-06T20:30:00",
)
```

使用 Historical API 请求示例中使用的数据，并将结果写入磁盘：

```python
path = DATABENTO_DATA_DIR / "es-front-glbx-mbp10.dbn.zst"

if not path.exists():
    # 请求数据并写入到 path
    client.timeseries.get_range(
        dataset="GLBX.MDP3",
        symbols=["ES.n.0"],
        stype_in="continuous",
        schema="mbp-10",
        start="2023-12-06T14:30:00",
        end="2023-12-06T20:30:00",
        path=path,  # <-- 指定 path 参数会把响应写入磁盘
    )
```

从磁盘读取 DBN 文件并将其转换为 pandas.DataFrame 以便检视：

```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

## 写入数据目录（data catalog）

```python
import shutil
from pathlib import Path

from nautilus_trader.adapters.databento.loaders import DatabentoDataLoader
from nautilus_trader.model import InstrumentId
from nautilus_trader.persistence.catalog import ParquetDataCatalog
```

```python
CATALOG_PATH = Path.cwd() / "catalog"

# 如果已存在则先清理
if CATALOG_PATH.exists():
    shutil.rmtree(CATALOG_PATH)
CATALOG_PATH.mkdir()

# 创建 ParquetDataCatalog 实例
catalog = ParquetDataCatalog(CATALOG_PATH)
```

准备好数据目录后，我们使用 `DatabentoDataLoader` 解码 DBN 文件并把数据转换为 Nautilus 的对象，以便写入 catalog：

```python
loader = DatabentoDataLoader()
```

下面示例采用 Rust 的 pyo3 对象写入 catalog（也可以使用 legacy Cython 对象，但 pyo3 对象性能略优），因此设置 `as_legacy_cython=False`。

可选地，你可以传入一个 `instrument_id` 来加速加载（避免 symbology mapping）。如果提供，`instrument_id` 必须符合 Nautilus 的 `symbol.venue` 格式，例如 "ES.GLBX"。

```python
path = DATABENTO_DATA_DIR / "es-front-glbx-mbp10.dbn.zst"

# 方案一（推荐）：让 loader 从 DBN 元数据中推断 instrument ID
depth10 = loader.from_dbn_file(
    path=path,
    as_legacy_cython=False,
)

# 方案二（可选）：显式传入 Nautilus 格式的 instrument ID
# instrument_id = InstrumentId.from_str("ESZ3.GLBX")  # 例如：Globex 上的 E-mini S&P 2023 年 12 月合约
# depth10 = loader.from_dbn_file(
#     path=path,
#     instrument_id=instrument_id,
#     as_legacy_cython=False,
# )
```

```python
# 将数据写入 catalog（写 MBP-10 的速度约为每秒 ~250,000 条，整个过程大约需要 20 秒，视机器而定）
catalog.write_data(depth10)
```

```python
# 从 catalog 读取以验证写入
depths = catalog.order_book_depth10()
len(depths)
```

## 准备一个月的 AAPL 成交数据

接下来扩展该流程，演示如何使用 Databento 的 `trade` schema 准备 Nasdaq 上 AAPL 的一个月成交数据，加载后会映射为 Nautilus 的 `TradeTick` 对象。

```python
# 请求费用报价（USD）——该接口本身不收费
client.metadata.get_cost(
    dataset="XNAS.ITCH",
    symbols=["AAPL"],
    schema="trades",
    start="2024-01",
)
```

使用 Historical 客户端请求历史数据时，请务必传入 `path` 参数以把响应写入磁盘：

```python
path = DATABENTO_DATA_DIR / "aapl-xnas-202401.trades.dbn.zst"

if not path.exists():
    # 请求数据并写入 path
    client.timeseries.get_range(
        dataset="XNAS.ITCH",
        symbols=["AAPL"],
        schema="trades",
        start="2024-01",
        path=path,  # <-- 指定 path 参数
    )
```

从磁盘读取并转换为 pandas.DataFrame 进行检视：

```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

我们将在 Nautilus 中使用 `InstrumentId` 为 `"AAPL.XNAS"`，其中 XNAS 是 Nasdaq 的 ISO 10383 MIC（Market Identifier Code）。

虽然将 `instrument_id` 传给 loader 并非必须，但这样可以加快加载速度（避免符号转换）。同时将 `as_legacy_cython` 设为 False 在将数据写入 catalog 时也更高效。

```python
instrument_id = InstrumentId.from_str("AAPL.XNAS")

trades = loader.from_dbn_file(
    path=path,
    instrument_id=instrument_id,
    as_legacy_cython=False,
)
```

此处我们按月组织数据文件（每月一个文件），当然按日分文件同样是有效的选择。

```python
# 将数据写入 catalog
catalog.write_data(trades)
```

```python
trades = catalog.trade_ticks([instrument_id])
```

```python
len(trades)
```
