# Parquet 探索（Explorer）

本教程演示如何对 Nautilus 生成的 Parquet 文件执行一些基本查询操作，示例将同时使用 `datafusion` 和 `pyarrow` 两个库。

在继续之前，请确保已安装 `datafusion`：

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
# 创建 DataFusion 上下文
ctx = datafusion.SessionContext()
```

```python
# 只需运行一次该单元（否则再次注册会报错）
ctx.register_parquet("trade_0", trade_tick_path)
ctx.register_parquet("bar_0", bar_path)
```

## TradeTick 数据

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

### Bar 数据

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
