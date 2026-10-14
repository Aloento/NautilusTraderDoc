# Data Catalog with Databento

Set up a Nautilus Parquet data catalog with market data from Databento. The
catalog provides efficient storage and querying for backtests and research.

[View source on GitHub](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/how_to/data_catalog_databento.py).

## Prerequisites

- Python 3.13+
- [NautilusTrader](https://pypi.org/project/nautilus_trader/) 2.x installed
  (`pip install -U --pre nautilus_trader`)
- [databento](https://pypi.org/project/databento/) Python client library (`pip install databento`)
- [Databento](https://databento.com) account with API key set as `DATABENTO_API_KEY`

## Request data

Initialize a Databento historical client. The client reads your API key from
the `DATABENTO_API_KEY` environment variable by default.

```python
import databento as db


client = db.Historical()  # Uses the DATABENTO_API_KEY environment variable
```

**Every historical streaming request from `timeseries.get_range` incurs a cost (even for the same data), so**:
- Check the cost before making a request
- Avoid requesting the same data twice
- Write responses to disk as zstd compressed DBN files

Use the metadata [get_cost endpoint](https://databento.com/docs/api-reference-historical/metadata/metadata-get-cost?historical=python&live=python) to quote the cost before each request. Only request data that does not already exist on disk.

The response is in USD, displayed as fractional cents.

The following request is for a small amount of data (as used in the Databento blog post [Building high-frequency trading signals in Python with Databento and sklearn](https://databento.com/blog/hft-sklearn-python)) to demonstrate the workflow.

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

Use the historical API to request the data used in the blog post.

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

Read the data from disk and convert to a pandas.DataFrame

```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

## Write to data catalog

The guide writes the catalog to `catalog/` under the working directory and replaces that directory on each run.

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

Use a `DatabentoDataLoader` to decode and load the data into Nautilus objects.

```python
loader = DatabentoDataLoader()
```

Passing an `instrument_id` is optional but speeds up loading by skipping symbology mapping. If provided, use the Nautilus `symbol.venue` format (e.g., "ESZ3.GLBX").

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

## Preparing a month of AAPL trades

Now we'll expand on this workflow by preparing a month of AAPL trades on the Nasdaq exchange using the Databento `trades` schema, which will translate to Nautilus `TradeTick` objects.

```python
# Request cost quote (USD) - this endpoint is 'free'
client.metadata.get_cost(
    dataset="XNAS.ITCH",
    symbols=["AAPL"],
    schema="trades",
    start="2024-01",
)
```

Pass a `path` parameter when requesting historical data to write it to disk.

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

Read the data from disk and convert to a pandas.DataFrame

```python
data = DBNStore.from_file(path)

df = data.to_df()
df
```

We'll use an `InstrumentId` of `"AAPL.XNAS"`, where XNAS is the ISO 10383 MIC (Market Identifier Code) for the Nasdaq venue.

Passing an `instrument_id` speeds up loading by skipping symbology mapping.

```python
instrument_id = InstrumentId.from_str("AAPL.XNAS")

trades = loader.load_trades(
    filepath=path,
    instrument_id=instrument_id,
)
```

Here we organize data as one file per month. A file per day works equally well.

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
