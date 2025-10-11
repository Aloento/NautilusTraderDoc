# Parquet Explorer

This tutorial explores some basic query operations on Parquet files written by Nautilus. We'll utilize both the `datafusio`n and `pyarrow` libraries.

Before proceeding, ensure that you have `datafusion` installed. If not, you can install it by running:

```bash
pip install datafusion
```

```python
import datafusion
import pyarrow.parquet as pq
```

```python
trade_tick_path = "../../tests/test_data/nautilus/trades.parquet"
bar_path = "../../tests/test_data/nautilus/bars.parquet"
```

```python
# Create a context
ctx = datafusion.SessionContext()
```

```python
# Run this cell once (otherwise will error)
ctx.register_parquet("trade_0", trade_tick_path)
ctx.register_parquet("bar_0", bar_path)
```

### TradeTick data

```python
query = "SELECT * FROM trade_0 ORDER BY ts_init"
df = ctx.sql(query)
```

```python
df.schema()
```

```python
df
```

```python
table = pq.read_table(trade_tick_path)
```

```python
table.schema
```

### Bar data

```python
query = "SELECT * FROM bar_0 ORDER BY ts_init"
df = ctx.sql(query)
```

```python
df.schema()
```

```python
df
```

```python
table = pq.read_table(bar_path)
table.schema
```

```python

```
