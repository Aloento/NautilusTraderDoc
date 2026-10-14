# 加载外部数据 {#loading-external-data}

把 CSV 行情数据加载到 Parquet 数据目录，然后用 `BacktestNode` 跑一次回测。当你手头有外部
数据供应商的历史数据、而 NautilusTrader 适配器不直接支持时，这是常见的工作流。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/how_to/loading_external_data.py)。

## 前提条件 {#prerequisites}

- Python 3.13+
- 已安装 [NautilusTrader](https://pypi.org/project/nautilus_trader/) 2.x
  （`pip install -U --pre nautilus_trader`）
- pandas（`pip install pandas`），仅下文的 histdata 路径需要

```python
import os
import shutil
from decimal import Decimal
from pathlib import Path

from nautilus_trader.backtest import BacktestNode
from nautilus_trader.common import LogLevel
from nautilus_trader.config import BacktestDataConfig
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import BacktestRunConfig
from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.config import LoggerConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import Currency
from nautilus_trader.model import OmsType
from nautilus_trader.model import Quantity
from nautilus_trader.model import NautilusDataType
from nautilus_trader.persistence import ParquetDataCatalog
from nautilus_trader.testkit.providers import TestDataProvider
from nautilus_trader.testkit.providers import TestInstrumentProvider
from nautilus_trader.trading import EmaCrossConfig
```

## 加载并整理数据 {#load-and-wrangle-the-data}

把 CSV 逐笔文件（例如来自 [histdata.com](https://www.histdata.com/)）放入
`~/Downloads/Data/HISTDATA/`。若数据在别处，把 `NAUTILUS_DATA_DIR` 环境变量设置为父目录。
`TestDataProvider.quotes_from_histdata_csv` 会把行转换为 Nautilus 的 `QuoteTick` 对象。
它接受从下载的 ZIP 中解出的 histdata ASCII 逐笔格式（`.csv` 或 `.csv.gz`）。本指南只加载
排序后的第一个文件并将其标为 EUR/USD，因此请使用 EUR/USD 文件，或改用其他工具。

没有下载数据时，本指南回退到 20,000 条 AUD/USD 示例报价逐笔，保证端到端仍然可运行。

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
```

## 写入数据目录 {#write-to-the-data-catalog}

创建 `ParquetDataCatalog`，写入金融工具定义和逐笔数据。目录以 Parquet 格式存储数据，
便于跨多次回测高效查询。本指南把目录写到工作目录下的 `catalog/`，每次运行都会替换该目录。

```python
CATALOG_PATH = Path.cwd() / "catalog"

# Clear if it already exists, then create fresh
if CATALOG_PATH.exists():
    shutil.rmtree(CATALOG_PATH)
CATALOG_PATH.mkdir(parents=True)

catalog = ParquetDataCatalog(str(CATALOG_PATH))
```

```python
catalog.write_instruments([instrument])
catalog.write_quote_ticks(ticks)
```

```python
# Verify instruments written to catalog
catalog.instruments()
```

```python
start = ticks[0].ts_event
end = ticks[-1].ts_event + 1

ticks = catalog.query_quote_ticks(identifiers=[instrument.id.value], start=start, end=end)
ticks[:10]
```

## 配置并运行回测 {#configure-and-run-the-backtest}

设置场所与数据配置，构建节点，然后注册内置的 `EmaCross` 策略。同样的节点与策略模式可以
平移到用 `LiveNode` 进行的实时交易。

```python
instrument = catalog.instruments()[0]

venue_configs = [
    BacktestVenueConfig(
        name="SIM",
        oms_type=OmsType.HEDGING,
        account_type=AccountType.MARGIN,
        base_currency=Currency.from_str("USD"),
        starting_balances=["1000000 USD"],
        fee_model=MakerTakerFeeModel(
            maker_rate=Decimal("0.00002"),
            taker_rate=Decimal("0.00002"),
        ),
    ),
]

data_configs = [
    BacktestDataConfig(
        catalog_path=str(CATALOG_PATH),
        data_type=NautilusDataType.QuoteTick,
        instrument_id=instrument.id,
        start_time=start,
        end_time=end,
    ),
]

config = BacktestRunConfig(
    engine=BacktestEngineConfig(
        logging=LoggerConfig(stdout_level=LogLevel.ERROR),
    ),
    data=data_configs,
    venues=venue_configs,
)
```

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

[result] = node.run()
```

```python
result
```
