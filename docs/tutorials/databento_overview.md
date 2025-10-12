# Databento 概览

Databento 官方文档：

- [Databento 文档](https://databento.com/docs)

## 三类服务

Databento 提供三种主要服务：

1. `Historical` — 用于获取 24 小时之前的历史市场数据
2. `Live` — 用于获取最近 24 小时内的实时/近实时市场数据
3. `Reference` — 用于获取证券主数据（security master）和公司行动（corporate actions）等参考数据

## 三种文件格式

Databento 支持三种常用数据格式：

- `DBN` — Databento Binary Encoding（二进制格式）
- `csv` — 逗号分隔值（文本）
- `json` — JavaScript Object Notation（文本）

## Python 库

Databento 提供了一个简洁的 Python 客户端库（本教程用到）：

```bash
pip install -U databento
```

## Schemas（数据模式）

这里的“schema”可理解为你请求的数据“类型”。下面按从最详细到较聚合的顺序列出常用的 schema：

| Schema       | 类型（Type） | 说明                                                                                                                  |
| ------------ | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `mbo`        | L3 数据      | 提供每一次订单簿（order book）在每个价位的事件，按订单 ID 记录。可用于确定订单在队列中的具体位置，粒度最高。          |
| `mbp-10`     | L2 数据      | 提供前十个价位层的订单簿事件，按价格聚合（price keyed）。包含成交与市场深度变化信息，并给出前十价位的总量和订单计数。 |
| `mbp-1`      | L1 数据      | 提供更新顶级价位（BBO）的订单簿事件，包含成交和深度变化，在顶级价位上给出总量与订单计数。                             |
| `bbo-1s`     | L1 采样数据  | 类似 L1，但以 1 秒为采样间隔提供数据，包括最近的 best bid、best offer 与成交（按 1 秒采样）。                         |
| `tbbo`       | L1 交易数据  | 在每次成交发生前提供当时的 BBO（最佳买卖价）以及对应的成交事件，是 `mbp-1` 的一个子集。                               |
| `trades`     | 成交数据     | 提供每一笔成交事件，是 MBO 的一个子集。                                                                               |
| `ohlcv-1s`   | 1 秒 K 线    | 由成交聚合而成的 1 秒 OHLCV（开/高/低/收/量）K 线。                                                                   |
| `ohlcv-1m`   | 1 分钟 K 线  | 由成交聚合而成的 1 分钟 OHLCV K 线。                                                                                  |
| `ohlcv-1h`   | 1 小时 K 线  | 由成交聚合而成的 1 小时 OHLCV K 线。                                                                                  |
| `ohlcv-1d`   | 1 日 K 线    | 由成交聚合而成的 1 日 OHLCV K 线。                                                                                    |
| `definition` | Reference    | 提供有关合约/证券的参考信息，包括代码（symbol）、名称、到期日、上市日期、最小跳价（tick size）、行权价等。            |
| `status`     | 交易所状态   | 提供交易时段内的状态更新，例如停牌、交易暂停、禁空（short-selling）限制、集合竞价开始等撮合引擎状态变更。             |
| `statistics` | 交易所统计   | 提供交易所发布的官方汇总统计数据，如日成交量、未平仓量（open interest）、结算价以及官方的开/高/低价等。               |

Databento 如何生成低分辨率数据（例如从 tick->bar）？

1. Databento 首先从每个数据源采集可用的最详细市场数据（若可用通常为 `mbo`）。
2. 然后从该最高粒度的数据派生出其他所有格式，以保证不同 schema 之间的一致性（100% 一致）。

参考资料：

- 将 tick/trades 数据重采样为 K 线的示例教程：
  - [tick-resampling 示例](https://databento.com/docs/examples/basics-historical/tick-resampling/example)
- 所有 schema 的详细说明：
  - [Schemas 与数据格式详解](https://databento.com/docs/schemas-and-data-formats?historical=python&live=python&reference=python)

## Symbology（代码体系 / 命名规范）

Symbology 在这里指的是对不同合约/证券命名的约定。文档与 API 中常用缩写 `stypes`，即 "symbology types"（命名类型）。

Databento 支持四种主要的命名类型：

| Symbology Type  | 说明                         | 示例/格式示例                | 备注                                                         |
| :-------------- | :--------------------------- | :--------------------------- | :----------------------------------------------------------- |
| `raw_symbol`    | 数据发布方原始的字符串代码   | `AAPL`, `ESH3`               | 适用于直接与交易所/市场连接的场景                            |
| `instrument_id` | 发布方分配的唯一数字 ID      | `12345`, `9876543`           | 更节省空间，但部分发布方可能会按日重映射（remap）            |
| `parent`        | 使用根符号将相关合约分组     | `ES.FUT`, `ES.OPT`           | 便于一次性查询某个根符号下的所有期货/期权合约                |
| `continuous`    | 引用随时间滚动变化的连续合约 | `ES.c.0`, `CL.n.1`, `ZN.v.0` | 滚动规则示例：Calendar (c)、Open Interest (n)、Volume (v) 等 |

此外，Databento 支持一个特殊的符号值：

| Special Value | 说明                                 | 用法          | 备注                                                                     |
| :------------ | :----------------------------------- | :------------ | :----------------------------------------------------------------------- |
| `ALL_SYMBOLS` | 请求数据集中所有可用的符号（通配符） | `ALL_SYMBOLS` | 用于一次性请求该数据集中所有符号（注意：这不是一种命名类型，而是通配符） |

请求数据时可以同时指定输入（input）和输出（output）的命名类型。下面列举了常见的四种组合（不同交易所/发布方支持的组合可能不同）：

| SType in        | SType out       | DBEQ.BASIC | GLBX.MDP3 | IFEU.IMPACT | NDEX.IMPACT | OPRA.PILLAR | XNAS.ITCH |
| :-------------- | :-------------- | :--------- | :-------- | :---------- | :---------- | :---------- | :-------- |
| `parent`        | `instrument_id` |            | ✓         | ✓           | ✓           | ✓           |           |
| `continuous`    | `instrument_id` |            | ✓         |             |             |             |           |
| `raw_symbol`    | `instrument_id` | ✓          | ✓         | ✓           | ✓           | ✓           | ✓         |
| `instrument_id` | `raw_symbol`    | ✓          | ✓         | ✓           | ✓           | ✓           | ✓         |

更多细节见：

- [Symbology 规范](https://databento.com/docs/standards-and-conventions/symbology?historical=python&live=python&reference=python)

## Databento 文件格式（DBN）

Databento 使用其自有的市场数据文件格式，称为 Databento Binary Encoding（简称 `DBN`）。
可以把它理解为更高效、且经过压缩的 CSV/JSON 的替代方案。你可以很容易地加载 DBN 文件并将其转换为 CSV 或 JSON。更多细节：

- [Databento Binary Encoding（DBN）说明](https://databento.com/docs/standards-and-conventions/databento-binary-encoding#getting-started-with-dbn?historical=python&live=python&reference=python)

# Historical API 示例

## 认证并连接 Databento

```python
import databento as db

# 建立连接并进行认证
API_KEY = "db-8VWGBis54s4ewGVciMRakNxLCJKen"   # 在此处填入你的 API key（示例 key 仅作说明）
client = db.Historical(API_KEY)
```

## 元数据（Metadata）

### 列出发布方（List Publishers）

列出所有数据发布方（publishers）。

```python
publishers = client.metadata.list_publishers()

# 若列表很长，这里只显示前五个示例
publishers[:5]
```

示例输出：

```python
[{'publisher_id': 1,
  'dataset': 'GLBX.MDP3',
  'venue': 'GLBX',
  'description': 'CME Globex MDP 3.0'},
 {'publisher_id': 2,
  'dataset': 'XNAS.ITCH',
  'venue': 'XNAS',
  'description': 'Nasdaq TotalView-ITCH'},
 {'publisher_id': 3,
  'dataset': 'XBOS.ITCH',
  'venue': 'XBOS',
  'description': 'Nasdaq BX TotalView-ITCH'},
 {'publisher_id': 4,
  'dataset': 'XPSX.ITCH',
  'venue': 'XPSX',
  'description': 'Nasdaq PSX TotalView-ITCH'},
 {'publisher_id': 5,
  'dataset': 'BATS.PITCH',
  'venue': 'BATS',
  'description': 'Cboe BZX Depth Pitch'}]
```

### 列出数据集（List Datasets）

每个 dataset 的命名格式为 `PUBLISHER.DATASET`。发布方/市场代码参考：

- [ISO20022 市场标识代码（Market Identifier Codes）](https://www.iso20022.org/market-identifier-codes)

```python
datasets = client.metadata.list_datasets()
datasets
```

示例输出：

```python
['ARCX.PILLAR',
 'DBEQ.BASIC',
 'EPRL.DOM',
 'EQUS.SUMMARY',
 'GLBX.MDP3',
 'IEXG.TOPS',
 'IFEU.IMPACT',
 'NDEX.IMPACT',
 'OPRA.PILLAR',
 'XASE.PILLAR',
 'XBOS.ITCH',
 'XCHI.PILLAR',
 'XCIS.TRADESBBO',
 'XNAS.BASIC',
 'XNAS.ITCH',
 'XNYS.PILLAR',
 'XPSX.ITCH']
```

### 列出 Schema（List Schemas）

列出 Databento 支持的所有数据 schema：

```python
schemas = client.metadata.list_schemas(dataset="GLBX.MDP3")
schemas
```

示例输出：

```python
['mbo',
 'mbp-1',
 'mbp-10',
 'tbbo',
 'trades',
 'bbo-1s',
 'bbo-1m',
 'ohlcv-1s',
 'ohlcv-1m',
 'ohlcv-1h',
 'ohlcv-1d',
 'definition',
 'statistics',
 'status']
```

### 数据集情况（Dataset condition）

查询数据可用性与质量信息：

```python
conditions = client.metadata.get_dataset_condition(
    dataset="GLBX.MDP3",
    start_date="2022-06-06",
    end_date="2022-06-10",
)

conditions
```

示例输出：

```python
[{'date': '2022-06-06',
  'condition': 'available',
  'last_modified_date': '2024-05-18'},
 {'date': '2022-06-07',
  'condition': 'available',
  'last_modified_date': '2024-05-21'},
 {'date': '2022-06-08',
  'condition': 'available',
  'last_modified_date': '2024-05-21'},
 {'date': '2022-06-09',
  'condition': 'available',
  'last_modified_date': '2024-05-21'},
 {'date': '2022-06-10',
  'condition': 'available',
  'last_modified_date': '2024-05-22'}]
```

### 数据集时间范围（Dataset range）

显示某个 dataset 的可用时间范围：

- 可用于发现数据的起止可用性。
- 响应中的 start/end 可以直接用于 `timeseries.get_range` 或 `batch.submit_job` 等接口。

```python
available_range = client.metadata.get_dataset_range(dataset="GLBX.MDP3")
available_range
```

示例输出：

```python
{'start': '2010-06-06T00:00:00.000000000Z',
 'end': '2025-01-18T00:00:00.000000000Z'}
```

### 记录计数（Record count）

返回某次查询将产生的记录数：

```python
record_count = client.metadata.get_record_count(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],   # ES（S&P 合约），2022 年 6 月到期
    schema="ohlcv-1h",  # 1 小时 K 线；仅适用于以 10 分钟为倍数的时间段（不能用于 1 分钟）
    start="2022-01-06", # 包含起始日
    end="2022-01-07"    # 不包含结束日
)

# 交易所在某个时段有一小时停盘，因此 23 条小时线是合理的
record_count
```

示例输出：

`23`

### 成本（Costs）

获取数据费用（以美元计）：

```python
cost = client.metadata.get_cost(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],
    schema="ohlcv-1h",  # 1 小时 K 线
    start="2022-01-06", # 包含起始日
    end="2022-01-07"    # 不包含结束日
)

cost
```

示例输出：

`0.00022791326`

## 时间序列数据（Time series data）

### `get_range`

- 向 Databento 发起流式（streaming）的时间序列数据请求。
- 这是将历史市场数据、合约定义以及状态数据直接加载到应用的主要方法。
- 该方法会在所有数据下载完成后才返回，下载时间可能较长。

**警告：**

- 字段 `ts_event` 表示聚合的起始时间（opening time）。因此当下载的是 K 线时，时间戳代表的是每根 K 线的开盘时间，而非收盘时间。

```python
data = client.timeseries.get_range(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],            # ES（S&P 合约），2022 年 6 月到期
    schema="ohlcv-1h",           # 小时线
    start="2022-06-01T00:00:00",
    end="2022-06-03T00:10:00",
    limit=5,                    # 可选：限制返回结果数量
)

# 返回的数据为 DBNStore 格式
data
```

示例输出：

`<DBNStore(schema=ohlcv-1h)>`

```python
# 将 DBN 格式转换为 pandas DataFrame
df = data.to_df()

# 预览
print(len(df))
df
```

示例输出（仅示例格式）：

| ts_event                  | rtype | publisher_id | instrument_id | open    | high    | low     | close   | volume | symbol |
| :------------------------ | :---- | :----------- | :------------ | :------ | :------ | :------ | :------ | :----- | :----- |
| 2022-06-01 00:00:00+00:00 | 34    | 1            | 3403          | 4149.25 | 4153.50 | 4149.00 | 4150.75 | 9281   | ESM2   |
| 2022-06-01 01:00:00+00:00 | 34    | 1            | 3403          | 4151.00 | 4157.75 | 4149.50 | 4154.25 | 11334  | ESM2   |
| 2022-06-01 02:00:00+00:00 | 34    | 1            | 3403          | 4154.25 | 4155.25 | 4146.50 | 4147.00 | 7258   | ESM2   |

说明：

- `rtype` = 1 小时的 K 线类型编码
- 更多关于类型编码的说明见：[rtype 说明](https://databento.com/docs/standards-and-conventions/common-fields-enums-types#rtype?historical=python&live=python&reference=python)

## 符号解析（Symbols）

### `resolve`

将一组符号从一种输入命名类型解析为另一种输出命名类型。

- 例如：从 `raw_symbol` 转为 `instrument_id`：`ESM2` → `3403`

```python
result = client.symbology.resolve(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],
    stype_in="raw_symbol",
    stype_out="instrument_id",
    start_date="2022-06-01",
    end_date="2022-06-30",
)

result
```

示例输出：

```python
{'result': {'ESM2': [{'d0': '2022-06-01', 'd1': '2022-06-26', 's': '3403'}]},
 'symbols': ['ESM2'],
 'stype_in': 'raw_symbol',
 'stype_out': 'instrument_id',
 'start_date': '2022-06-01',
 'end_date': '2022-06-30',
 'partial': [],
 'not_found': [],
 'message': 'OK',
 'status': 0}
```

其中最重要的是 `result` 字段，内含键值对 `'s': '3403'`，即对应的 `instrument_id` 值。

## DBNStore 操作

`DBNStore` 是用于处理 `DBN` 编码数据的辅助类。

### `from_bytes`

从 DBN 字节流中读取数据：

```python
dbn_data = client.timeseries.get_range(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],
    schema="ohlcv-1h",
    start="2022-06-06",
    limit=3
)

dbn_data.to_df()
```

示例输出（仅示例格式）：

| ts_event                  | rtype | publisher_id | instrument_id | open    | high    | low     | close   | volume | symbol |
| :------------------------ | :---- | :----------- | :------------ | :------ | :------ | :------ | :------ | :----- | :----- |
| 2022-06-06 00:00:00+00:00 | 34    | 1            | 3403          | 4109.50 | 4117.00 | 4105.50 | 4115.75 | 8541   | ESM2   |
| 2022-06-06 01:00:00+00:00 | 34    | 1            | 3403          | 4115.75 | 4122.75 | 4113.00 | 4122.25 | 14008  | ESM2   |
| 2022-06-06 02:00:00+00:00 | 34    | 1            | 3403          | 4122.25 | 4127.00 | 4120.75 | 4126.25 | 10150  | ESM2   |

```python
# 将流式接收的数据保存为文件，推荐后缀：`*.dbn.zst`
path = "./GLBX-ESM2-20220606.ohlcv-1h.dbn.zst"
dbn_data.to_file(path)
```

```python
# 从已保存的文件中加载数据并重新创建 DBN 对象
with open(path, "rb") as saved:
    loaded_dbn_data = db.DBNStore.from_bytes(saved)

loaded_dbn_data.to_df()
```

示例输出（仅示例格式）：

| ts_event                  | rtype | publisher_id | instrument_id | open    | high    | low     | close   | volume | symbol |
| :------------------------ | :---- | :----------- | :------------ | :------ | :------ | :------ | :------ | :----- | :----- |
| 2022-06-06 00:00:00+00:00 | 34    | 1            | 3403          | 4109.50 | 4117.00 | 4105.50 | 4115.75 | 8541   | ESM2   |
| 2022-06-06 01:00:00+00:00 | 34    | 1            | 3403          | 4115.75 | 4122.75 | 4113.00 | 4122.25 | 14008  | ESM2   |
| 2022-06-06 02:00:00+00:00 | 34    | 1            | 3403          | 4122.25 | 4127.00 | 4120.75 | 4126.25 | 10150  | ESM2   |

### `from_file`

从 DBN 文件读取数据：

```python
loaded_dbn_data = db.DBNStore.from_file(path)
loaded_dbn_data.to_df()
```

示例输出（仅示例格式）：

| ts_event                  | rtype | publisher_id | instrument_id | open    | high    | low     | close   | volume | symbol |
| :------------------------ | :---- | :----------- | :------------ | :------ | :------ | :------ | :------ | :----- | :----- |
| 2022-06-06 00:00:00+00:00 | 34    | 1            | 3403          | 4109.50 | 4117.00 | 4105.50 | 4115.75 | 8541   | ESM2   |
| 2022-06-06 01:00:00+00:00 | 34    | 1            | 3403          | 4115.75 | 4122.75 | 4113.00 | 4122.25 | 14008  | ESM2   |
| 2022-06-06 02:00:00+00:00 | 34    | 1            | 3403          | 4122.25 | 4127.00 | 4120.75 | 4126.25 | 10150  | ESM2   |

### `to_csv`

将数据写为 CSV 文件：

```python
dbn_data = client.timeseries.get_range(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],
    schema="ohlcv-1h",
    start="2022-06-06",
    limit=3
)

# 导出为 CSV 文件
dbn_data.to_csv("GLBX-ESM2-20220606-ohlcv-1h.csv")
```

### `to_df`

将 DBN 数据转换为 pandas DataFrame：

```python
# 转为 pandas DataFrame
dbn_data.to_df()
```

示例输出（仅示例格式）：

| ts_event                  | rtype | publisher_id | instrument_id | open    | high    | low     | close   | volume | symbol |
| :------------------------ | :---- | :----------- | :------------ | :------ | :------ | :------ | :------ | :----- | :----- |
| 2022-06-06 00:00:00+00:00 | 34    | 1            | 3403          | 4109.50 | 4117.00 | 4105.50 | 4115.75 | 8541   | ESM2   |
| 2022-06-06 01:00:00+00:00 | 34    | 1            | 3403          | 4115.75 | 4122.75 | 4113.00 | 4122.25 | 14008  | ESM2   |
| 2022-06-06 02:00:00+00:00 | 34    | 1            | 3403          | 4122.25 | 4127.00 | 4120.75 | 4126.25 | 10150  | ESM2   |

### `to_json`

将数据写为 JSON 文件：

```python
# 导出为 JSON 文件
dbn_data.to_json("GLBX-ESM2-20220606-ohlcv-1h.json")
```

### `to_file`

将数据写为 DBN 文件：

```python
# 导出为 DBN 文件
dbn_data.to_file("GLBX-ESM2-20220606.ohlcv-1h.dbn.zst")
```

### `to_ndarray`

- 将数据转换为 numpy 的 N 维数组（ndarray）。
- 每个元素包含二进制字段对应的 Python 表示（Tuple）。

```python
# 导出为 numpy 数组
ndarray = dbn_data.to_ndarray()
ndarray
```

### `to_parquet`

- 将数据写为 [Apache Parquet](https://parquet.apache.org/) 文件。

```python
# 导出为 Parquet 文件
dbn_data.to_parquet("GLBX-ESM2-20220606-ohlcv-1h.parquet")
```

### `for` 循环示例

- 可以使用标准的 Python `for` 循环来遍历 DBN 文件内容。

```python
# 先加载一些数据
dbn_data = client.timeseries.get_range(
    dataset="GLBX.MDP3",
    symbols=["ESM2"],
    schema="ohlcv-1h",
    start="2022-06-06",
    limit=3
)

# 包含 3 条小时线
dbn_data.to_df()
```

示例输出（仅示例格式）：

| ts_event                  | rtype | publisher_id | instrument_id | open    | high    | low     | close   | volume | symbol |
| :------------------------ | :---- | :----------- | :------------ | :------ | :------ | :------ | :------ | :----- | :----- |
| 2022-06-06 00:00:00+00:00 | 34    | 1            | 3403          | 4109.50 | 4117.00 | 4105.50 | 4115.75 | 8541   | ESM2   |
| 2022-06-06 01:00:00+00:00 | 34    | 1            | 3403          | 4115.75 | 4122.75 | 4113.00 | 4122.25 | 14008  | ESM2   |
| 2022-06-06 02:00:00+00:00 | 34    | 1            | 3403          | 4122.25 | 4127.00 | 4120.75 | 4126.25 | 10150  | ESM2   |

```python
# 用 for 循环遍历 DBN 数据：
for bar in dbn_data:
    print(bar)   # 打印完整的 bar 数据
    break        # 故意只打印第一条示例
```

示例输出：

```
OhlcvMsg {
    hd: RecordHeader {
        length: 14,
        rtype: Ohlcv1H,
        publisher_id: GlbxMdp3Glbx,
        instrument_id: 3403,
        ts_event: 1654473600000000000
    },
    open: 4109.500000000,
    high: 4117.000000000,
    low: 4105.500000000,
    close: 4115.750000000,
    volume: 4543
}
```

```python
for bar in dbn_data:
    print(f"Bar open: {bar.open}")  # 打印 bar 的开盘价信息
    break                           # 故意只打印第一条示例
```

示例输出：

`Bar open: 4108500000000`

# 示例

## 下载 1 分钟级别的 6E 数据

```python
from datetime import timedelta

import pandas as pd
import pytz


pd.set_option("display.max_columns", None)
pd.set_option("display.max_rows", None)
```

```python
# 设置参数
dataset="GLBX.MDP3"
symbol="6E.v.0"
stype_in="continuous"
schema="ohlcv-1m"
start="2025-01-01"
end="2025-01-05"
```

```python
# 查询美元计价的费用
cost = client.metadata.get_cost(
    dataset=dataset,
    symbols=[symbol],
    stype_in=stype_in,
    schema=schema,
    start=start,
    end=end,
)

print(f"{cost:.2f}$")
```

示例输出：

`0.01$`

```python
# 下载数据
data = client.timeseries.get_range(
    dataset=dataset,
    symbols=[symbol],
    stype_in=stype_in,
    schema=schema,
    start=start,
    end=end,
)

# 导出为 DBNStore 格式（CSV 数据体积约为 DBN 的 10 倍）
data.to_file(f"{dataset}_{symbol}_{start}-{end}.{schema}.dbn.zst")
```

```python
# 清理并以 DataFrame 查看数据
df = (
    data.to_df()
    .reset_index()
    .rename(columns={"ts_event": "datetime"})
    .drop(columns=["rtype", "publisher_id", "instrument_id"])

    # 调整列顺序
    .reindex(columns=["symbol", "datetime", "open", "high", "low", "close", "volume"])

    # 将时间本地化至 Bratislava
    .assign(datetime = lambda df: pd.to_datetime(df["datetime"], utc=True))  # 标记为 UTC 时间
    .assign(datetime = lambda df: df["datetime"].dt.tz_convert(pytz.timezone("Europe/Bratislava")))  # 转换为 Bratislava 时区

    # 加 1 分钟，使 datetime 表示 K 线的收盘时间（而非开盘时间）
    .assign(datetime = lambda df: df["datetime"] + timedelta(minutes=1))
)

# 预览
print(len(df))
df.head(3)
```

示例输出（仅示例格式）：

`2734`

| symbol | datetime                  | open    | high    | low     | close   | volume |
| :----- | :------------------------ | :------ | :------ | :------ | :------ | :----- |
| 6E.v.0 | 2025-01-02 00:01:00+01:00 | 1.03890 | 1.03930 | 1.03845 | 1.03905 | 291    |
| 6E.v.0 | 2025-01-02 00:02:00+01:00 | 1.03900 | 1.03900 | 1.03870 | 1.03880 | 311    |
| 6E.v.0 | 2025-01-02 00:03:00+01:00 | 1.03880 | 1.03890 | 1.03870 | 1.03885 | 140    |
