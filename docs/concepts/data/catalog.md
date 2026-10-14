# 数据目录 {#data-catalog}

数据目录（data catalog）用 [Parquet](https://parquet.apache.org) 文件存储 NautilusTrader 数据，供回测、实时交易和研究使用。

## 概览与架构 {#overview-and-architecture}

`ParquetDataCatalog` 是 Rust 数据目录与 DataFusion 查询引擎的 Python 接口。Rust 的 model 与 persistence crate 为内置数据定义 Arrow schema。注册的自定义数据在运行时提供自己的 schema 及编解码处理器。

时间戳Instant使用 `Timestamp(Nanosecond, Some("UTC"))`，时长保持整数类型。Arrow 读取器和 Nautilus 查询会保留纳秒精度与 UTC 标注。若 SQL 读取器把这些列映射为微秒精度的 `TIMESTAMPTZ`，亚微秒部分会被截断。

Parquet 提供压缩的列式存储和跨语言访问。目录把这些文件存放在同一个根目录下，无需独立的数据库服务。本地路径或对象存储 URI 决定使用哪个存储后端。

## 初始化 {#initializing}

把本地路径或 URI 作为构造函数的第一个参数传入：

```python
from pathlib import Path

from nautilus_trader.persistence import ParquetDataCatalog


CATALOG_PATH = Path.cwd() / "catalog"
catalog = ParquetDataCatalog(str(CATALOG_PATH))
```

## 文件系统协议与存储选项 {#filesystem-protocols-and-storage-options}

目录接受其 Rust object-store 后端支持的存储协议。

### 支持的文件系统协议 {#supported-filesystem-protocols}

| 存储              | URI 方案        | 常用选项键                                                        |
| -------------------- | ------------------ | ------------------------------------------------------------------------- |
| 本地文件系统     | 普通路径、`file` | 无。                                                                     |
| Amazon S3            | `s3`               | `region`、`access_key_id`、`secret_access_key`、`endpoint_url`。           |
| Google Cloud Storage | `gs`、`gcs`        | `service_account_path`、`service_account_key`、`application_credentials`。 |
| Azure Blob Storage   | `az`、`abfs`       | `account_name`、`account_key`、`sas_token`。                               |
| HTTP 或 WebDAV       | `http`、`https`    | `timeout`、`connect_timeout`、`proxy_url`。                                |

选项键是 `object_store` 针对对应 URI 方案的配置键：

- S3、GCS、Azure 的键也支持带前缀的写法，例如 `aws_region`、`google_application_credentials`、`azure_storage_sas_token`。
- `timeout` 等客户端选项对每个远程方案生效。要使用明文 `http://` 连接，需将 `allow_http` 设为 `true`。
- S3 还接受旧名称 `key` 和 `secret`。
- 未知键会报错，错误信息中会指出该键名。

凭据和其他后端设置通过 `storage_options` 传入：

```python
catalog = ParquetDataCatalog(
    "s3://my-bucket/nautilus-data/",
    storage_options={
        "access_key_id": "your-key",
        "secret_access_key": "your-secret",
        "region": "us-east-1",
    },
)

azure_catalog = ParquetDataCatalog(
    "abfs://container@account.dfs.core.windows.net/nautilus-data/",
    storage_options={"account_key": "your-account-key"},
)
```

bucket、容器或主机名之后的远程 URI 基础路径不得包含空格或非 ASCII 字符，也不能包含 object-store 路径会编码的字符，如 `~`、`%`、`#`、`?`、`^`、`|`。打开目录时若发现此类 URI，会报错并指出该 URI。

## 压缩与行组 {#compression-and-row-groups}

`DataCatalogConfig` 决定已配置目录如何读写数据文件：

| 字段                 | 控制内容                          | 默认值          |
| -------------------- | ------------------------------------------- | ---------------- |
| `batch_size`         | 目录每次读写的数据行数 | 10,000           |
| `compression`        | 写入数据文件使用的压缩编解码器名称           | `zstd`（级别 1） |
| `max_row_group_size` | 每个写入行组的最大行数          | 131,072          |

```python
from nautilus_trader.config import DataCatalogConfig


catalog = DataCatalogConfig(path="./catalog", compression="snappy", max_row_group_size=65_536)
```

`ParquetDataCatalog` 接受同样的 `batch_size` 和 `max_row_group_size` 设置，但 `compression` 按数字代码选择。`DataCatalogConfig` 接受下表中的名称，忽略大小写：

| 编解码器        | `DataCatalogConfig` 名称 | `ParquetDataCatalog` 代码 |
| ------------ | ------------------------ | ------------------------- |
| 不压缩 | `uncompressed`           | `0`                       |
| Snappy       | `snappy`                 | `1`                       |
| gzip         | `gzip`                   | `2`                       |
| Brotli       | `brotli`                 | `4`                       |
| LZ4          | `lz4`、`lz4_raw`         | `5`                       |
| zstd         | `zstd`                   | `6`                       |

使用其他压缩名称，或将 `batch_size`、`max_row_group_size` 设为 0，构造都会失败。`params` 只承载外部目录后端的选项，Parquet 目录拒绝任何 `params` 键。

:::info
`lz4` 和 `lz4_raw` 指同一个编解码器：目录写入的是 Parquet `LZ4_RAW`。Parquet 格式已废弃旧的 Hadoop 框架 `LZ4` 编解码器，目录从不写入它。压缩代码 `5` 写入 `LZ4_RAW`，尽管 Parquet 将 `LZ4_RAW` 编号为 `7`。早前用 Hadoop 框架编解码器写入的文件仍然可读。

不支持 LZO，因为 Parquet 写入器无法生成它，所以名称 `lzo` 和代码 `3` 在构造时即失败。
:::

## 写入数据 {#writing-data}

按具体数据类型选用对应的 writer。金融工具定义和自定义数据有各自的 writer。

```python
catalog.write_instruments([instrument])
catalog.write_quote_ticks(quote_ticks)

catalog.write_trade_ticks(
    trade_ticks,
    start=1704067200000000000,
    end=1704153600000000000,
)

catalog.write_bars(bars, skip_disjoint_check=True)
```

内置行情数据 writer 包括：

- `write_quote_ticks`
- `write_trade_ticks`
- `write_order_book_deltas`
- `write_order_book_depths`
- `write_bars`
- `write_mark_price_updates`
- `write_index_price_updates`
- `write_option_greeks`

每个 writer 都接受可选的 `start` 和 `end` 覆盖值（UNIX 纳秒）。单次调用写入的数据必须属于同一标识，例如一个 Instrument ID 或一个 bar 类型，且必须按 `ts_init` 有序。

## 文件命名与数据组织 {#file-naming-and-data-organization}

目录按文件的时间戳范围命名，模式为 `{start_timestamp}_{end_timestamp}.parquet`。文件名由 ISO 8601 时间戳转换而来：把 `:` 和 `.` 替换为 `-`。

内置数据按数据类型和标识符分目录组织。对 Instrument ID 和 bar 类型，创建 URI 安全的目录名时会去掉 `/` 并把 `^` 替换为 `_`：

```text
catalog/
├── data/
│   ├── quotes/
│   │   └── EURUSD.SIM/
│   │       └── 2024-01-01T00-00-00-000000000Z_2024-01-01T23-59-59-999999999Z.parquet
│   └── trades/
│       └── BTCUSD.BINANCE/
│           └── 2024-01-01T00-00-00-000000000Z_2024-01-01T23-59-59-999999999Z.parquet
```

自定义数据放在 `data/custom/<type_name>/` 下，可附带标识符路径段。

金融工具按具体工具类各占一个目录，例如 `data/currency_pair/` 或 `data/equity/`，而不是共用 `instruments` 目录。

目录查询——进而回测——**只读取这些规范目录**。查询不会读取旧式布局，如 `data/trade_tick/`、`data/quote_tick/` 以及 Python 写入的 `data/custom_<snake_case>/`。

若目录仍在使用旧式布局，用
[nautilus catalog migrate-parquet](./../../how_to/migrate_parquet_catalog.md)
完成升级转换。

:::warning[重叠写入]
默认情况下，重叠写入会抛出 `OSError` 以保证数据完整性。
只有确认重叠是有意为之，才设置 `skip_disjoint_check=True`。
:::

## 读取数据 {#reading-data}

已知返回类型时使用带类型的查询。`start` 和 `end` 为 UNIX 纳秒：

```python
quotes = catalog.query_quote_ticks(
    identifiers=["EUR/USD.SIM"],
    start=1704067200000000000,
    end=1704153600000000000,
)

trades = catalog.query_trade_ticks(
    identifiers=["BTC/USD.BINANCE"],
    start=1704067200000000000,
    end=1704153600000000000,
)
```

## `BacktestDataConfig`：回测数据 {#backtestdataconfig-backtest-data}

`BacktestDataConfig` 定义 `BacktestNode` 单次运行要加载的目录数据。

### 核心参数 {#core-parameters}

- `data_type` 是 `NautilusDataType` 值：`QuoteTick`、`TradeTick`、`Bar`、`OrderBookDelta`、
  `OrderBookDepth`、`MarkPriceUpdate`、`IndexPriceUpdate`、`FundingRateUpdate`、`InstrumentStatus`、
  `OptionGreeks`、`InstrumentClose` 或 `Instrument`。选 `Instrument` 时，按所选标识符加载目录中保存的每种工具类。
- `catalog_path` 指定目录根路径。
- `instrument_id`、`instrument_ids`、`bar_types` 三者必须提供一个。
- `start_time` 和 `end_time` 是可选的 UNIX 纳秒边界。
- `filter_expr` 是可选的 DataFusion SQL 谓词。
- `catalog_fs_protocol` 为远程存储给 `catalog_path` 加上协议前缀。
- `catalog_fs_rust_storage_options` 提供 Rust 后端选项。未设置时，
  `BacktestNode` 回退到 `catalog_fs_storage_options`。
- 对 bar，`bar_spec` 与 Instrument ID 组合选出一个 `EXTERNAL` bar 类型。显式指定
  `bar_types` 则可选内部、外部或复合 bar。
- `optimize_file_loading` 在可能时注册整个目录。
- `batch_deltas`（默认 `True`）把 `OrderBookDelta` 数据按 `F_LAST` 收尾的 `OrderBookDeltas` 批次回放。参见[订单簿 delta 回放](./../backtesting/apis-and-runs.md#order-book-delta-replay)。

### 基本用法示例 {#basic-usage-examples}

```python
from nautilus_trader.config import BacktestDataConfig
from nautilus_trader.model import BarAggregation
from nautilus_trader.model import BarSpecification
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import NautilusDataType
from nautilus_trader.model import PriceType

quote_data = BacktestDataConfig(
    data_type=NautilusDataType.QuoteTick,
    catalog_path="/path/to/catalog",
    instrument_id=InstrumentId.from_str("EUR/USD.SIM"),
    start_time=1704067200000000000,
    end_time=1704153600000000000,
)

trade_data = BacktestDataConfig(
    data_type=NautilusDataType.TradeTick,
    catalog_path="/path/to/catalog",
    instrument_ids=[
        InstrumentId.from_str("BTC/USD.BINANCE"),
        InstrumentId.from_str("ETH/USD.BINANCE"),
    ],
)

bar_data = BacktestDataConfig(
    data_type=NautilusDataType.Bar,
    catalog_path="/path/to/catalog",
    instrument_id=InstrumentId.from_str("AAPL.NASDAQ"),
    bar_spec=BarSpecification(5, BarAggregation.MINUTE, PriceType.LAST),
)
```

这段 bar 配置选中 `AAPL.NASDAQ-5-MINUTE-LAST-EXTERNAL`。

### 云存储与过滤 {#cloud-storage-and-filtering}

```python
book_data = BacktestDataConfig(
    data_type=NautilusDataType.OrderBookDelta,
    catalog_path="my-bucket/nautilus-data",
    catalog_fs_protocol="s3",
    catalog_fs_rust_storage_options={
        "access_key_id": "your-access-key",
        "secret_access_key": "your-secret-key",
        "region": "us-east-1",
    },
    instrument_id=InstrumentId.from_str("BTC/USD.COINBASE"),
    filter_expr="ts_init >= 1704067200000000000",
)
```

### 与 BacktestRunConfig 集成 {#integration-with-backtestrunconfig}

把数据配置传入 `BacktestRunConfig`：

```python
from decimal import Decimal

from nautilus_trader.config import BacktestDataConfig
from nautilus_trader.config import BacktestRunConfig
from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import BookType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import NautilusDataType
from nautilus_trader.model import OmsType

data_configs = [
    BacktestDataConfig(
        data_type=NautilusDataType.QuoteTick,
        catalog_path="/path/to/catalog",
        instrument_id=InstrumentId.from_str("EUR/USD.SIM"),
    ),
]

run_config = BacktestRunConfig(
    venues=[
        BacktestVenueConfig(
            name="SIM",
            oms_type=OmsType.HEDGING,
            account_type=AccountType.MARGIN,
            book_type=BookType.L1_MBP,
            starting_balances=["1_000_000 USD"],
            fee_model=MakerTakerFeeModel(
                maker_rate=Decimal("0"),
                taker_rate=Decimal("0"),
            ),
        ),
    ],
    data=data_configs,
    start=1704067200000000000,
    end=1704153600000000000,
)
```

### 数据加载过程 {#data-loading-process}

回测运行时，`BacktestNode` 对每个 `BacktestDataConfig` 依次处理：

1. 按配置创建 `ParquetDataCatalog`。
1. 构建引擎时加载所需的金融工具定义。
1. 根据配置字段构建并执行 DataFusion 查询。
1. 将合并后的数据按 `ts_init` 排序，加入回测引擎。

## 直接访问目录 {#direct-catalog-access}

- 直接用 `ParquetDataCatalog` 查询或写入目录。
- 需要 `BacktestNode` 为某次运行加载目录数据时，使用 `BacktestDataConfig`。
- `LiveNodeConfig` 没有加载目录数据的对应配置。历史数据通过配置好的数据客户端请求，或直接查询目录。其 `streaming` 字段只配置 Feather 写入。

## 查询与过滤 {#querying-and-filtering}

通用 `query` 通过 `NautilusDataType` 选择数据族，该类型映射到 `quotes`、`trades`、`bars` 等目录。需要 `files` 或
`optimize_file_loading` 控制时使用它：

```python
catalog.query(
    data_type=NautilusDataType.QuoteTick,
    identifiers=["EUR/USD.SIM"],
    start=1704067200000000000,
    end=1704153600000000000,
    where_clause="ts_event <= ts_init",
    files=None,
)
```

以下查询方法都使用 UNIX 纳秒时间边界，并接受 DataFusion SQL 的
`where_clause`：

- `query` 提供通用接口。
- `query_quote_ticks`、`query_trade_ticks`、`query_bars` 等带类型的方法返回具体模型类型。
- `query_custom_data` 通过运行时注册表解析自定义解码器。

:::warning[时区数据库不一致]
按当前 `Cargo.lock`，DataFusion 的 SQL 时间函数用传递依赖的 `chrono-tz` 0.10.4 数据库（IANA 2025b）解析具名时区。Rust 核心的时区运算用 Jiff 0.2.38，自带 IANA 2026e 数据库。在 DataFusion 完成迁移之前，若时区规则变更或 2025b 之后的历史数据被修正，两者的时区结果可能出现差异。

若 RustSec 对 `chrono` 或 `chrono-tz` 发布了"停止维护"警告，在 DataFusion 迁移完成前，需在 `.cargo/audit.toml` 和 `deny.toml` 中维护一致的、有文档说明的忽略项。
:::

## 目录操作 {#catalog-operations}

目录操作可对数据文件改名、合并或删除。其类型选择器有：

- `NautilusDataType`：选择数据族。`NautilusDataType.Instrument` 覆盖每种工具类。
- `NautilusRecordType`：选择记录族。
- `NautilusInstrumentType`：针对某一种工具类。

`delete_data_range(...)` 只接受 `NautilusDataType`，因为只有数据族支持按范围删除。

### 重置文件名 {#reset-file-names}

把 Parquet 文件名重置为与其内容时间戳一致，保证基于文件名的过滤始终准确。`reset_all_file_names()` 处理整个目录；`reset_data_file_names(...)` 针对某一数据路径。

对按金融工具分区的数据类型：

- 传入 Instrument ID 可只针对该工具的目录。
- 不传 ID 时，操作会递归读取该类型目录，并在各自所属的工具目录内重命名文件。重命名任何文件前，先检查每个目录的时间区间。

```python
catalog.reset_all_file_names()
catalog.reset_data_file_names(NautilusDataType.QuoteTick, "EUR/USD.SIM")
catalog.reset_data_file_names(NautilusDataType.TradeTick, "BTC/USD.BINANCE")
```

### 从重叠文件名中恢复 {#recover-from-overlapping-file-names}

文件名重叠会阻塞该目录的写入。被拒绝的覆盖扩展不会重命名任何文件，所以重叠只能来自更早的改名、手动移动或并发写入者。

若文件内容仍然互不重叠，用文件名重置恢复该目录：

1. 停止该目录的所有写入者。
1. 备份受影响的目录。重置是逐个文件改名的，中途 I/O 失败可能留下部分已改名的文件。在"先复制再删除"实现改名的对象存储上，失败还可能让同一文件同时以两个名字存在。
1. 对受影响的路径运行 `reset_data_file_names(...)`。自定义数据类型改用 `reset_all_file_names()`，它覆盖包括自定义布局在内的每个叶子目录。
1. 若重置报告某个新名字已被另一文件占用，先给那个文件改名，使用数据范围之外的未占用区间名，然后重新运行重置，直到成功。
1. 确认每个改名后的文件与其内容范围一致，再写入一个更晚的不重叠区间，确认目录恢复可写。

重置逐目录处理。在改名某目录中的任何文件前，先读取每个文件的 `ts_init` 范围。内容范围重叠，或某文件的新名字恰好是另一文件的当前名字时，重置失败。失败时该目录内所有文件名保持不变；先于失败目录完成重置的目录保留新名字。

文件名重置只适用于"仅文件名受损"的情形。文件内容重叠时，重置文件名无法调和数据，重置会失败。此时应从源数据重建受影响范围，并走单独验证过的流程。

### 合并目录 {#consolidate-catalog}

合并小型 Parquet 文件，减少文件数量和查询开销。不带边界参数时，`consolidate_catalog()` 处理目录中每个叶子数据目录。`consolidate_data(...)` 只处理一个目录；对按工具分区的数据类型需传入 Instrument ID。

```python
catalog.consolidate_catalog()

catalog.consolidate_catalog(
    start=1704067200000000000,
    end=1704153600000000000,
    ensure_contiguous_files=True,
)

catalog.consolidate_data(
    NautilusDataType.QuoteTick,
    identifier="EUR/USD.SIM",
    start=1704067200000000000,
    end=1706745600000000000,
)
```

### 按周期合并目录 {#consolidate-catalog-by-period}

把数据文件切分为固定周期。周期时长与时间边界都用纳秒。两个方法都接受可选边界；对按工具分区的数据，向数据类型方法传入标识符。

- **全目录方法**：处理 quotes、trades、order book deltas、order book depths、bars、指数价格、标记价格、instrument closes 及已注册的自定义类型。其他类型记警告并跳过。
- **数据类型方法**：拒绝 instrument 和 record 选择器，它们没有按周期重写的实现。这两类改用
  `consolidate_data(...)`。

```python
DAY_NS = 86_400_000_000_000
HOUR_NS = 3_600_000_000_000

catalog.consolidate_catalog_by_period(period_nanos=DAY_NS)

catalog.consolidate_catalog_by_period(
    period_nanos=HOUR_NS,
    start=1704067200000000000,
    end=1704153600000000000,
)

catalog.consolidate_data_by_period(
    data_type=NautilusDataType.QuoteTick,
    identifier="EUR/USD.SIM",
    period_nanos=HOUR_NS,
)

catalog.consolidate_data_by_period(
    data_type=NautilusDataType.TradeTick,
    identifier="EUR/USD.SIM",
    period_nanos=HOUR_NS,
    start=1704067200000000000,
    end=1706745600000000000,
)
```

### 删除数据范围 {#delete-data-range}

删除某个时间范围内的数据，可选限定到单一数据类型和金融工具。对按工具分区的数据需传入 Instrument ID。时间边界规则如下：

- 省略 `start` 则范围延伸到最早。
- 省略 `end` 则范围延伸到最晚。
- 对 `delete_data_range(...)`，两个边界都省略会删除全部匹配数据。

`delete_data_range(...)` 支持 quotes、trades、bars、order book deltas、order book depth 及已注册的自定义类型。订单簿深度传 `NautilusDataType.OrderBookDepth`，自定义数据类型传
`NautilusDataType.Custom("MarketTickPython")` 这类值。

- `delete_catalog_range(...)` 遇到不支持的目录会继续处理其他目录，记录警告并保持其数据不变。
- 要确认所请求类型是否受支持，使用 `delete_data_range(...)`。
  `NautilusDataType.Instrument` 会被拒绝，因为金融工具定义不支持按范围删除。

```python
catalog.delete_catalog_range(
    start=1704067200000000000,
    end=1704153600000000000,
)

catalog.delete_catalog_range(end=1704067200000000000)

catalog.delete_data_range(
    data_type=NautilusDataType.QuoteTick,
    identifier="BTC/USD.BINANCE",
)

catalog.delete_data_range(
    data_type=NautilusDataType.TradeTick,
    identifier="EUR/USD.SIM",
    start=1704067200000000000,
    end=1706745600000000000,
)
```

:::danger[数据删除不可逆]
删除操作无法撤销。对部分重叠的文件，目录会将其拆分以保留范围外的数据。
:::

## Feather 流式写入与转换 {#feather-streaming-and-conversion}

运行时可先把记录暂存到本地 Feather 文件，再通过
`StreamingConfig(writer_path=..., catalog=DataCatalogConfig(...))`
提升（promote）进数据目录。暂存记录**在提升成功后**才对目录查询可见。暂存刷新与目录提交是两个独立步骤。

流式写入的默认行为是：关闭时提升，不按周期提升，保留已提交的 Feather 源文件。设置正的 `promotion_interval_ms` 后：

- 实时流式使用挂钟调度。
- 回测流式在写入和刷新时检查所用时钟。

默认值、配置、查询可见性与恢复方式见[流式写入 Parquet 数据目录](./../../how_to/stream_parquet_catalog.md)。

`StreamingFeatherWriter` 仍可直接用于暂存。其已完成的会话可用 `ParquetDataCatalog.convert_stream_to_data()` 手动转换。
