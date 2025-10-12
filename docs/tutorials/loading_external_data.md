# 加载外部数据

本教程演示如何将外部数据加载到 `ParquetDataCatalog`，并基于该数据目录使用 `BacktestNode` 运行一次性回测（one-shot backtest）。

**注意**：

> **建议在裸机环境运行（不要在 jupyterlab Docker 容器中执行）**

```python
import os
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
from nautilus_trader.model import BarType
from nautilus_trader.model import QuoteTick
from nautilus_trader.persistence.catalog import ParquetDataCatalog
from nautilus_trader.persistence.wranglers import QuoteTickDataWrangler
from nautilus_trader.test_kit.providers import CSVTickDataLoader
from nautilus_trader.test_kit.providers import TestInstrumentProvider
```

```python
DATA_DIR = "~/Downloads/Data/"
```

```python
path = Path(DATA_DIR).expanduser() / "HISTDATA"
raw_files = list(path.iterdir())
assert raw_files, f"Unable to find any histdata files in directory {path}"
raw_files
```

```python
# 本例取找到的第一个原始数据文件并加载为 pandas DataFrame
df = CSVTickDataLoader.load(raw_files[0], index_col=0, datetime_format="%Y%m%d %H%M%S%f")
df.columns = ["timestamp", "bid_price", "ask_price"]

# 使用 wrangler 处理报价数据，生成 Nautilus 的 QuoteTick 对象
EURUSD = TestInstrumentProvider.default_fx_ccy("EUR/USD")
wrangler = QuoteTickDataWrangler(EURUSD)

ticks = wrangler.process(df)
```

```python
CATALOG_PATH = os.getcwd() + "/catalog"

# 若目录存在则先删除以确保干净的环境
if os.path.exists(CATALOG_PATH):
    shutil.rmtree(CATALOG_PATH)
os.mkdir(CATALOG_PATH)

# 创建 ParquetDataCatalog 实例
catalog = ParquetDataCatalog(CATALOG_PATH)
```

```python
# 将 instrument 与 ticks 写入 catalog
catalog.write_data([EURUSD])
catalog.write_data(ticks)
```

```python
# 从 catalog 中获取所有 instruments（用于校验）
catalog.instruments()
```

```python
start = dt_to_unix_nanos(pd.Timestamp("2020-01-03", tz="UTC"))
end =  dt_to_unix_nanos(pd.Timestamp("2020-01-04", tz="UTC"))

ticks = catalog.quote_ticks(instrument_ids=[EURUSD.id.value], start=start, end=end)
ticks[:10]
```

```python
instrument = catalog.instruments()[0]

venue_configs = [
    BacktestVenueConfig(
        name="SIM",
        oms_type="HEDGING",
        account_type="MARGIN",
        base_currency="USD",
        starting_balances=["1000000 USD"],
    ),
]

data_configs = [
    BacktestDataConfig(
        catalog_path=str(catalog.path),
        data_cls=QuoteTick,
        instrument_id=instrument.id,
        start_time=start,
        end_time=end,
    ),
]

strategies = [
    ImportableStrategyConfig(
        strategy_path="nautilus_trader.examples.strategies.ema_cross:EMACross",
        config_path="nautilus_trader.examples.strategies.ema_cross:EMACrossConfig",
        config={
            "instrument_id": instrument.id,
            "bar_type": BarType.from_str(f"{instrument.id.value}-15-MINUTE-BID-INTERNAL"),
            "fast_ema_period": 10,
            "slow_ema_period": 20,
            "trade_size": Decimal(1_000_000),
        },
    ),
]

config = BacktestRunConfig(
    engine=BacktestEngineConfig(strategies=strategies),
    data=data_configs,
    venues=venue_configs,
)
```

```python
node = BacktestNode(configs=[config])

[result] = node.run()
```

```python
result
```
