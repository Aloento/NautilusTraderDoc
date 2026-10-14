# 回测（高层 API）

`BacktestNode` 配合 Parquet 数据目录实现配置驱动的回测。这是生产工作流的
推荐路径：在这里编写的策略、Actor 与执行算法，之后用 `LiveNode` 上实时交易
时可以原样沿用。

本教程加载 FX 逐笔报价数据，写入数据目录，然后在模拟的 FX ECN 场所上
回测一个 EMA 交叉策略。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/getting_started/backtest_high_level.py)。

## 前置条件 {#prerequisites}
- Python 3.13-3.14
- 已安装 [NautilusTrader](https://pypi.org/project/nautilus_trader/) 2.x
  （`pip install -U --pre nautilus_trader`）。2.x 目前以 `2.0.0rcN` 发布，
  `--pre` 必不可少。
- pandas（`pip install pandas`）。wheel 没有声明运行时依赖。

```python
import os
import shutil
from decimal import Decimal
from pathlib import Path

import pandas as pd

from nautilus_trader.backtest import BacktestNode
from nautilus_trader.common import LogLevel
from nautilus_trader.config import BacktestDataConfig
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import BacktestRunConfig
from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.config import LoggerConfig
from nautilus_trader.core.datetime import dt_to_unix_nanos
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import BookType
from nautilus_trader.model import Currency
from nautilus_trader.model import OmsType
from nautilus_trader.model import Quantity
from nautilus_trader.model import NautilusDataType
from nautilus_trader.persistence import ParquetDataCatalog
from nautilus_trader.testkit.providers import TestDataProvider
from nautilus_trader.testkit.providers import TestInstrumentProvider
from nautilus_trader.trading import EmaCrossConfig
```

## 加载示例数据 {#load-the-sample-data}

教程不需要手动下载：`TestDataProvider` 提供 AUD/USD 逐笔报价，
源码检出目录下读取本地 `test_data/`，其他情况从 GitHub 下载，因此 wheel 安装
需要联网。这里取前 20,000 条以保持运行时间短。

想重放更长的历史，从
[histdata.com](https://www.histdata.com/download-free-forex-historical-data/?/ascii/tick-data-quotes/)
下载 FX 逐笔数据，把 CSV 解压到 `~/Downloads/Data/HISTDATA/`
（或将 `NAUTILUS_DATA_DIR` 环境变量设为包含 `HISTDATA` 子目录的父目录）。
下载的文件形如 `DAT_ASCII_EURUSD_T_202410.csv`（2024 年 10 月的 EUR/USD）。
下面这个单元格会自动识别它们。一整月的逐笔数据有数百万行，
写入数据目录预计需要几分钟。

```python
DATA_DIR = Path(os.environ.get("NAUTILUS_DATA_DIR", "~/Downloads/Data")).expanduser() / "HISTDATA"

raw_files = (
    sorted(
        f
        for f in DATA_DIR.iterdir()
        if f.is_file() and (f.suffix == ".csv" or f.name.endswith(".csv.gz"))
    )
    if DATA_DIR.is_dir()
    else []
)
raw_files
```

## 将数据加载到数据目录 {#load-data-into-the-catalog}

两个加载器都会把数据商的原始行解析为 Nautilus 的 `QuoteTick` 对象，
并赋予默认的名义数量。Histdata 的 CSV 包含
`timestamp, bid_price, ask_price` 字段；TrueFX 示例包含
`timestamp, bid, ask`。

```python
if raw_files:
    instrument = TestInstrumentProvider.default_fx_ccy("EUR/USD")
    ticks = TestDataProvider.quotes_from_histdata_csv(instrument, raw_files[0])
else:
    instrument = TestInstrumentProvider.default_fx_ccy("AUD/USD")
    ticks = TestDataProvider.quotes_from_truefx_csv(
        instrument,
        "truefx/audusd-ticks.csv",
        max_rows=20_000,
    )

# Vendor exports are not always monotonic; the catalog requires ascending timestamps
ticks.sort(key=lambda tick: tick.ts_init)

print(f"Loaded {len(ticks)} quote ticks for {instrument.id}")

# Preview: see first 2 ticks
ticks[0:2]
```

更多细节见[加载数据](./../concepts/data/index.md)指南。

用存储目录实例化 `ParquetDataCatalog`（这里是当前目录下的 `catalog/`，
教程每次运行都会重建它），然后把金融工具和逐笔数据写入数据目录。

```python
CATALOG_PATH = Path.cwd() / "catalog"

# Clear if it already exists, then create fresh
if CATALOG_PATH.exists():
    shutil.rmtree(CATALOG_PATH)
CATALOG_PATH.mkdir(parents=True)

# Create a catalog instance
catalog = ParquetDataCatalog(str(CATALOG_PATH))

# Write instrument to the catalog
catalog.write_instruments([instrument])

# Write ticks to the catalog
catalog.write_quote_ticks(ticks)
```

## 查询数据目录 {#query-the-catalog}

数据目录提供 `.instruments()`、`.query_quote_ticks()` 等方法，
用于查询已存储的数据并确定可用的时间范围。

```python
# Get list of all instruments in catalog
catalog.instruments()
```

```python
# See 1st instrument from catalog
catalog.instruments()[0]
```

```python
# Query quote ticks from catalog to determine the data range
all_ticks = catalog.query_quote_ticks(identifiers=[instrument.id.value])
print(f"Total ticks in catalog: {len(all_ticks)}")

if all_ticks:
    # Get timestamps from the data
    first_tick_time = pd.Timestamp(all_ticks[0].ts_init, unit="ns", tz="UTC")
    last_tick_time = pd.Timestamp(all_ticks[-1].ts_init, unit="ns", tz="UTC")
    print(f"Data range: {first_tick_time} to {last_tick_time}")

    # Cap the backtest range at 2 weeks from the first tick (as UNIX nanoseconds);
    # the AUD/USD sample spans about 5 hours, so it runs in full
    start_ns = all_ticks[0].ts_init
    end_ns = dt_to_unix_nanos(first_tick_time + pd.Timedelta(days=14))
    print(f"Backtest range: {first_tick_time} to {first_tick_time + pd.Timedelta(days=14)}")

    # Preview selected data
    selected_quote_ticks = catalog.query_quote_ticks(
        identifiers=[instrument.id.value],
        start=start_ns,
        end=end_ns,
    )
    print(f"Selected ticks for backtest: {len(selected_quote_ticks)}")
    selected_quote_ticks[:2]
else:
    raise ValueError("No ticks found in catalog")
```

## 添加场所 {#add-venues}

```python
venue_configs = [
    BacktestVenueConfig(
        name="SIM",
        oms_type=OmsType.HEDGING,
        account_type=AccountType.MARGIN,
        book_type=BookType.L1_MBP,
        base_currency=Currency.from_str("USD"),
        starting_balances=["1_000_000 USD"],
        fee_model=MakerTakerFeeModel(
            maker_rate=Decimal("0.00002"),
            taker_rate=Decimal("0.00002"),
        ),
    ),
]
```

## 添加数据 {#add-data}

```python
str(CATALOG_PATH)
```

```python
data_configs = [
    BacktestDataConfig(
        data_type=NautilusDataType.QuoteTick,
        catalog_path=str(CATALOG_PATH),
        instrument_id=instrument.id,
        start_time=start_ns,
        end_time=end_ns,
    ),
]
```

## 配置回测 {#configure-the-backtest}

`BacktestRunConfig` 把场所与数据配置集中到一个对象里。

```python
config = BacktestRunConfig(
    venues=venue_configs,
    data=data_configs,
    engine=BacktestEngineConfig(
        logging=LoggerConfig(stdout_level=LogLevel.ERROR),
    ),
)
```

## 添加策略 {#add-the-strategy}

先构建节点，再把策略挂到运行配置上。这里用的是内置的 `EmaCross`
示例策略，它订阅逐笔报价，交易中间价上快慢 EMA 的交叉。要运行自己的策略，
让它可导入，然后改用 `node.add_strategy_from_config()` 配合
`ImportableStrategyConfig`。

```python
node = BacktestNode(configs=[config])
node.build()

node.add_builtin_strategy(
    config.id,
    "EmaCross",
    EmaCrossConfig(
        instrument_id=instrument.id,
        trade_size=Quantity.from_int(1_000_000),
        fast_period=10,
        slow_period=20,
    ),
)
```

## 运行回测 {#run-the-backtest}

`BacktestNode` 按时间戳顺序处理所有数据，执行语义是确定性的。
这里用到的架构模式（策略、Actor、执行算法）在 `LiveNode` 实时交易中
同样适用。

```python
results = node.run()
results
```
