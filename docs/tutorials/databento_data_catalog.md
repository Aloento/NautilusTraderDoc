# Databento data catalog

Tutorial for [NautilusTrader](https://nautilustrader.io/docs/) a high-performance algorithmic trading platform and event driven backtester.

[View source on GitHub](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/tutorials/databento_data_catalog.ipynb).

:::info
We are currently working on this tutorial.
:::

## Overview

This tutorial will walk through how to set up a Nautilus Parquet data catalog with various Databento schemas.

## Prerequisites

- Python 3.11+ installed
- [JupyterLab](https://jupyter.org/) or similar installed (`pip install -U jupyterlab`)
- [NautilusTrader](https://pypi.org/project/nautilus_trader/) latest release installed (`pip install -U nautilus_trader`)
- [databento](https://pypi.org/project/databento/) Python client library installed to make data requests (`pip install -U databento`)
- [Databento](https://databento.com) account

## Requesting data

We'll use a Databento historical client for the rest of this tutorial. You can either initialize one by passing your Databento API key to the constructor, or implicitly use the `DATABENTO_API_KEY` environment variable (as shown).


```python
import databento as db


client = db.Historical()  # This will use the DATABENTO_API_KEY environment variable (recommended best practice)
```

**It's important to note that every historical streaming request from `timeseries.get_range` will incur a cost (even for the same data), therefore we need to**:
- Know and understand the cost prior to making a request
- Not make requests for the same data more than once (not efficient)
- Persist the responses to disk by writing zstd compressed DBN files (so that we don't have to request again)

We can use a metadata [get_cost endpoint](https://databento.com/docs/api-reference-historical/metadata/metadata-get-cost?historical=python&live=python) from the Databento API to get a quote on the cost, prior to each request.
Each request sequence will first request the cost of the data, and then make a request only if the data doesn't already exist on disk.

Note the response returned is in USD, displayed as fractional cents.

The following request is only for a small amount of data (as used in this Medium article [Building high-frequency trading signals in Python with Databento and sklearn](https://databento.com/blog/hft-sklearn-python)), just to demonstrate the basic workflow. 


```python
from pathlib import Path

from databento import DBNStore
```

We'll prepare a directory for the raw Databento DBN format data, which we'll use for the rest of the tutorial.


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

Use the historical API to request for the data used in the Medium article.


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
        path=path,  # <-- Passing a `path` parameter will ensure the data is written to disk
    )
```

Inspect the data by reading from disk and convert to a pandas.DataFrame


```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

## Write to data catalog


```python
import shutil
from pathlib import Path

from nautilus_trader.adapters.databento.loaders import DatabentoDataLoader
from nautilus_trader.model import InstrumentId
from nautilus_trader.persistence.catalog import ParquetDataCatalog
```


```python
CATALOG_PATH = Path.cwd() / "catalog"

# Clear if it already exists
if CATALOG_PATH.exists():
    shutil.rmtree(CATALOG_PATH)
CATALOG_PATH.mkdir()

# Create a catalog instance
catalog = ParquetDataCatalog(CATALOG_PATH)
```

Now that we've prepared the data catalog, we need a `DatabentoDataLoader` which we'll use to decode and load the data into Nautilus objects.


```python
loader = DatabentoDataLoader()
```

Next, we'll load Rust pyo3 objects to write to the catalog (we could use legacy Cython objects, but this is slightly more efficient) by setting `as_legacy_cython=False`.

Passing an `instrument_id` is optional but makes data loading faster as symbology mapping is not required. If provided, it must be in the valid Nautilus format of `symbol.venue` (e.g., "ES.GLBX").


```python
path = DATABENTO_DATA_DIR / "es-front-glbx-mbp10.dbn.zst"

# Option 1 (recommended): Let the loader infer the instrument ID from DBN metadata
depth10 = loader.from_dbn_file(
    path=path,
    as_legacy_cython=False,
)

# Option 2: Explicitly specify a valid Nautilus instrument ID (symbol.venue format)
# instrument_id = InstrumentId.from_str("ESZ3.GLBX")  # E-mini S&P December 2023 futures on Globex
# depth10 = loader.from_dbn_file(
#     path=path,
#     instrument_id=instrument_id,
#     as_legacy_cython=False,
# )
```


```python
# Write data to catalog (this takes ~20 seconds or ~250,000/second for writing MBP-10 at the moment)
catalog.write_data(depth10)
```


```python
# Test reading from catalog
depths = catalog.order_book_depth10()
len(depths)
```

## Preparing a month of AAPL trades

Now we'll expand on this workflow by preparing a month of AAPL trades on the Nasdaq exchange using the Databento `trade` schema, which will translate to Nautilus `TradeTick` objects.


```python
# Request cost quote (USD) - this endpoint is 'free'
client.metadata.get_cost(
    dataset="XNAS.ITCH",
    symbols=["AAPL"],
    schema="trades",
    start="2024-01",
)
```

When requesting historical data with the Databento `Historical` data client, ensure you pass a `path` parameter to write the data to disk.


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

Inspect the data by reading from disk and convert to a pandas.DataFrame


```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

We'll use an `InstrumentId` of `"AAPL.XNAS"`, where XNAS is the ISO 10383 MIC (Market Identifier Code) for the Nasdaq venue.

While passing an `instrument_id` to the loader isn't strictly necessary, it speeds up data loading by eliminating the need for symbology mapping. Additionally, setting the `as_legacy_cython` option to False further optimizes the process since we'll be writing the loaded data to the catalog. Although we could use legacy Cython objects, this method is more efficient for loading.


```python
instrument_id = InstrumentId.from_str("AAPL.XNAS")

trades = loader.from_dbn_file(
    path=path,
    instrument_id=instrument_id,
    as_legacy_cython=False,
)
```

Here we'll organize our data as a file per month, this is an arbitrary choice as a file per day could be just as valid.


```python
# Write data to catalog
catalog.write_data(trades)
```


```python
trades = catalog.trade_ticks([instrument_id])
```


```python
len(trades)
```
