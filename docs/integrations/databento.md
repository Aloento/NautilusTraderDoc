# Databento

NautilusTrader 提供了一个用于集成 Databento API 以及 Databento Binary Encoding (DBN) 数据格式的适配器。
由于 Databento 仅提供行情数据（market data），适配器本身不包含执行客户端（execution client），但仍然可以在沙盒环境中搭建模拟执行。
同时也可以将 Databento 的行情与 Interactive Brokers 的执行对接，或将其用于计算加密资产的传统资产类别信号。

该适配器的功能包括：

- 从 DBN 文件加载历史数据并解码为 Nautilus 对象，以便用于回测或写入数据目录（data catalog）。
- 请求历史数据并将其解码为 Nautilus 对象，以支持实时交易和回测。
- 订阅实时数据流并将其解码为 Nautilus 对象，以支持实盘（live trading）或沙盒（sandbox）环境。

:::tip
[Databento](https://databento.com/signup) 目前对新用户提供 125 美元的免费数据额度（仅限历史数据）。

通过合理的请求策略，这通常足够用于测试和评估。建议使用 [/metadata.get_cost](https://databento.com/docs/api-reference-historical/metadata/metadata-get-cost) 端点来估算费用。
:::

## 概述

此适配器在实现上依赖官方的 Rust 客户端库 [databento-rs](https://crates.io/crates/databento)。

:::info
不需要额外单独安装 `databento` 包，适配器的核心组件在构建时会被编译为静态库并自动链接。
:::

可用的适配器类包括：

- `DatabentoDataLoader`：从文件加载 Databento Binary Encoding (DBN) 数据。
- `DatabentoInstrumentProvider`：通过 Databento HTTP API 获取最新或历史的 instrument 定义。
- `DatabentoHistoricalClient`：通过 Databento HTTP API 请求历史行情数据。
- `DatabentoLiveClient`：通过 Databento 原生 TCP 接口订阅实时数据。
- `DatabentoDataClient`：为运行实时交易节点提供 `LiveMarketDataClient` 实现。

:::info
与其他集成适配器类似，大多数用户只需在 live trading node 的配置中定义 Databento 客户端（见下文），通常无需直接操作这些底层组件。
:::

## 示例

可在此处找到实时示例脚本：[examples/live/databento](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/databento/)。

## Databento 文档

Databento 为新用户提供了详细文档，参见其新手指南：[Databento new users guide](https://databento.com/docs/quickstart/new-user-guides)。
建议在使用本集成指南时一并参考 Databento 官方文档。

## Databento 二进制编码（DBN）

Databento Binary Encoding (DBN) 是一种面向标准化行情数据的高性能消息编码与存储格式。
[DBN 规范](https://databento.com/docs/standards-and-conventions/databento-binary-encoding) 包含自描述的元数据头和一组固定的 struct 定义，用于在数据层面强制执行标准化。

该集成提供了一个解码器，用于将 DBN 格式的数据转换为 Nautilus 对象。

相同的 Rust 实现解码器可用于：

- 从磁盘加载并解码 DBN 文件。
- 实时解码历史与实时数据。

## 支持的 schema

以下 Databento schema 得到 NautilusTrader 的支持：

| Databento schema                                                             | Nautilus data type               | Description                     |
| :--------------------------------------------------------------------------- | :------------------------------- | :------------------------------ |
| [MBO](https://databento.com/docs/schemas-and-data-formats/mbo)               | `OrderBookDelta`                 | Market by order (L3).           |
| [MBP_1](https://databento.com/docs/schemas-and-data-formats/mbp-1)           | `(QuoteTick, TradeTick \| None)` | Market by price (L1).           |
| [MBP_10](https://databento.com/docs/schemas-and-data-formats/mbp-10)         | `OrderBookDepth10`               | Market depth (L2).              |
| [BBO_1S](https://databento.com/docs/schemas-and-data-formats/bbo-1s)         | `QuoteTick`                      | 1-second best bid/offer.        |
| [BBO_1M](https://databento.com/docs/schemas-and-data-formats/bbo-1m)         | `QuoteTick`                      | 1-minute best bid/offer.        |
| [CMBP_1](https://databento.com/docs/schemas-and-data-formats/cmbp-1)         | `(QuoteTick, TradeTick \| None)` | Consolidated MBP across venues. |
| [CBBO_1S](https://databento.com/docs/schemas-and-data-formats/cbbo-1s)       | `QuoteTick`                      | Consolidated 1-second BBO.      |
| [CBBO_1M](https://databento.com/docs/schemas-and-data-formats/cbbo-1m)       | `QuoteTick`                      | Consolidated 1-minute BBO.      |
| [TCBBO](https://databento.com/docs/schemas-and-data-formats/tcbbo)           | `(QuoteTick, TradeTick)`         | Trade-sampled consolidated BBO. |
| [TBBO](https://databento.com/docs/schemas-and-data-formats/tbbo)             | `(QuoteTick, TradeTick)`         | Trade-sampled best bid/offer.   |
| [TRADES](https://databento.com/docs/schemas-and-data-formats/trades)         | `TradeTick`                      | Trade ticks.                    |
| [OHLCV_1S](https://databento.com/docs/schemas-and-data-formats/ohlcv-1s)     | `Bar`                            | 1-second bars.                  |
| [OHLCV_1M](https://databento.com/docs/schemas-and-data-formats/ohlcv-1m)     | `Bar`                            | 1-minute bars.                  |
| [OHLCV_1H](https://databento.com/docs/schemas-and-data-formats/ohlcv-1h)     | `Bar`                            | 1-hour bars.                    |
| [OHLCV_1D](https://databento.com/docs/schemas-and-data-formats/ohlcv-1d)     | `Bar`                            | Daily bars.                     |
| [OHLCV_EOD](https://databento.com/docs/schemas-and-data-formats/ohlcv-eod)   | `Bar`                            | End-of-day bars.                |
| [DEFINITION](https://databento.com/docs/schemas-and-data-formats/definition) | `Instrument` (various types)     | Instrument definitions.         |
| [IMBALANCE](https://databento.com/docs/schemas-and-data-formats/imbalance)   | `DatabentoImbalance`             | Auction imbalance data.         |
| [STATISTICS](https://databento.com/docs/schemas-and-data-formats/statistics) | `DatabentoStatistics`            | Market statistics.              |
| [STATUS](https://databento.com/docs/schemas-and-data-formats/status)         | `InstrumentStatus`               | Market status updates.          |

### Schema 注意事项

- **TBBO 和 TCBBO**：按交易采样（trade-sampled）的数据流，会将每笔交易与交易发生前的顶层盘口（BBO）配对（TBBO 为单一场所，TCBBO 为跨场所汇总）。当你需要成交与同时刻的报价对齐但不想管理两条流时，请使用这些 schema。
- **MBP-1 与 CMBP-1（L1）**：事件级别的 top-of-book 更新；仅在发生 trade 事件时发出 trade。若需要同时对齐 quote 与 trade，优先选择 TBBO/TCBBO；否则可仅使用 TRADES。
- **MBP-10（L2）**：包含前 10 个价位及成交信息，适用于需要深度信息但不需要逐单等级别（per-order）细节的策略；相比 MBO 更轻量且包含每一层的订单数量等结构信息。
- **MBO（L3）**：逐单事件，可用于队列位置建模和精确的订单簿重构。数据量/费用最高；建议在节点初始化阶段就订阅以确保回放上下文完整。
- **BBO_1S/BBO_1M 与 CBBO_1S/CBBO_1M**：固定间隔（1s/1m）采样的顶层盘口快照（不包含 trades），适用于监控、价差计算或低成本信号生成；不适合微观结构级别的细粒度分析。
- **TRADES**：仅成交数据。若需要成交上下文的 quote，可与 MBP-1（设置 `include_trades=True`）配合，或使用 TBBO/TCBBO。
- **OHLCV\_（含 OHLCV_EOD）**：由成交聚合生成的 K 线条（bars），适合更高时间框架的分析/回测；确保 bar 的时间戳表示收盘时间（设置 `bars_timestamp_on_close=True`）。
- **Imbalance / Statistics / Status**：场所（venue）的运营类数据；通过 `subscribe_data` 并携带 `instrument_id` 的 `DataType` 元数据来订阅。

:::tip
**汇总（Consolidated）schema**（如 CMBP_1、CBBO_1S、CBBO_1M、TCBBO）会跨多个场所聚合数据，提供统一的市场视图，适用于跨场所分析或需要全市场视角的场景。
:::

:::info
另见 Databento 的 [Schemas and data formats](https://databento.com/docs/schemas-and-data-formats) 指南。
:::

## 实时订阅的 schema 选择

下表展示了 Nautilus 的订阅方法如何映射到 Databento 的 schema：

| Nautilus Subscription Method    | Default Schema | Available Databento Schemas                                                  | Nautilus Data Type |
| :------------------------------ | :------------- | :--------------------------------------------------------------------------- | :----------------- |
| `subscribe_quote_ticks()`       | `mbp-1`        | `mbp-1`, `bbo-1s`, `bbo-1m`, `cmbp-1`, `cbbo-1s`, `cbbo-1m`, `tbbo`, `tcbbo` | `QuoteTick`        |
| `subscribe_trade_ticks()`       | `trades`       | `trades`, `tbbo`, `tcbbo`, `mbp-1`, `cmbp-1`                                 | `TradeTick`        |
| `subscribe_order_book_depth()`  | `mbp-10`       | `mbp-10`                                                                     | `OrderBookDepth10` |
| `subscribe_order_book_deltas()` | `mbo`          | `mbo`                                                                        | `OrderBookDeltas`  |
| `subscribe_bars()`              | varies         | `ohlcv-1s`, `ohlcv-1m`, `ohlcv-1h`, `ohlcv-1d`                               | `Bar`              |

:::note
下列示例假定你在 `Strategy` 或 `Actor` 类上下文中（`self` 可访问订阅方法）。请记得导入下列类型：

```python
from nautilus_trader.adapters.databento import DATABENTO_CLIENT_ID
from nautilus_trader.model import BarType
from nautilus_trader.model.enums import BookType
from nautilus_trader.model.identifiers import InstrumentId
```

:::

### Quote 订阅（MBP / L1）

```python
# 默认 MBP-1 报价（可能包含 trades）
self.subscribe_quote_ticks(instrument_id, client_id=DATABENTO_CLIENT_ID)

# 指定 MBP-1 schema
self.subscribe_quote_ticks(
    instrument_id=instrument_id,
    params={"schema": "mbp-1"},
    client_id=DATABENTO_CLIENT_ID,
)

# 1 秒 BBO 快照（仅报价，不含 trades）
self.subscribe_quote_ticks(
    instrument_id=instrument_id,
    params={"schema": "bbo-1s"},
    client_id=DATABENTO_CLIENT_ID,
)

# 跨场所汇总的报价
self.subscribe_quote_ticks(
    instrument_id=instrument_id,
    params={"schema": "cbbo-1s"},  # 或使用 "cmbp-1" 获取汇总 MBP
    client_id=DATABENTO_CLIENT_ID,
)

# 以 trade 采样的 BBO（同时包含 quotes 和 trades）
self.subscribe_quote_ticks(
    instrument_id=instrument_id,
    params={"schema": "tbbo"},  # 会把 QuoteTick 与 TradeTick 一并发送到消息总线
    client_id=DATABENTO_CLIENT_ID,
)
```

### Trade 订阅

```python
# 仅 trades
self.subscribe_trade_ticks(instrument_id, client_id=DATABENTO_CLIENT_ID)

# 来自 MBP-1 的 trades（仅在存在 trade 事件时）
self.subscribe_trade_ticks(
    instrument_id=instrument_id,
    params={"schema": "mbp-1"},
    client_id=DATABENTO_CLIENT_ID,
)

# 以 trade 采样的数据（在 trade 时间点同时提供 quote）
self.subscribe_trade_ticks(
    instrument_id=instrument_id,
    params={"schema": "tbbo"},  # 也会在 trade 事件上提供 quotes
    client_id=DATABENTO_CLIENT_ID,
)
```

### Order book depth 订阅（MBP / L2）

```python
# 订阅市场深度前 10 个价位
self.subscribe_order_book_depth(
    instrument_id=instrument_id,
    depth=10  # Databento 会自动选择 MBP-10 schema
)

# 注意：Databento 的 depth 参数必须为 10
# 这将接收 OrderBookDepth10 更新
```

### Order book deltas 订阅（MBO / L3）

```python
# 订阅逐单更新（market by order）
self.subscribe_order_book_deltas(
    instrument_id=instrument_id,
    book_type=BookType.L3_MBO  # 使用 MBO schema
)

# 注意：MBO 订阅必须在节点启动时进行，以确保能从会话开始处正确回放
```

### Bar 订阅

```python
# 订阅 1 分钟 K 线（会自动使用 ohlcv-1m schema）
self.subscribe_bars(
    bar_type=BarType.from_str(f"{instrument_id}-1-MINUTE-LAST-EXTERNAL")
)

# 订阅 1 秒 K 线（会自动使用 ohlcv-1s schema）
self.subscribe_bars(
    bar_type=BarType.from_str(f"{instrument_id}-1-SECOND-LAST-EXTERNAL")
)

# 订阅 1 小时 K 线（会自动使用 ohlcv-1h schema）
self.subscribe_bars(
    bar_type=BarType.from_str(f"{instrument_id}-1-HOUR-LAST-EXTERNAL")
)

# 订阅日线（会自动使用 ohlcv-1d schema）
self.subscribe_bars(
    bar_type=BarType.from_str(f"{instrument_id}-1-DAY-LAST-EXTERNAL")
)

# 使用 end-of-day schema 的日线订阅（仅对 DAY 聚合有效）
self.subscribe_bars(
    bar_type=BarType.from_str(f"{instrument_id}-1-DAY-LAST-EXTERNAL"),
    params={"schema": "ohlcv-eod"},  # 覆盖为使用 end-of-day K 线
)
```

### 自定义数据类型订阅

对于像 imbalance 与 statistics 这类 Databento 的专用数据类型，可以使用通用的 `subscribe_data` 方法：

```python
from nautilus_trader.adapters.databento import DATABENTO_CLIENT_ID
from nautilus_trader.adapters.databento import DatabentoImbalance
from nautilus_trader.adapters.databento import DatabentoStatistics
from nautilus_trader.model import DataType

# 订阅 imbalance 数据
self.subscribe_data(
    data_type=DataType(DatabentoImbalance, metadata={"instrument_id": instrument_id}),
    client_id=DATABENTO_CLIENT_ID,
)

# 订阅 statistics 数据
self.subscribe_data(
    data_type=DataType(DatabentoStatistics, metadata={"instrument_id": instrument_id}),
    client_id=DATABENTO_CLIENT_ID,
)

# 订阅 instrument 状态更新
from nautilus_trader.model.data import InstrumentStatus
self.subscribe_data(
    data_type=DataType(InstrumentStatus, metadata={"instrument_id": instrument_id}),
    client_id=DATABENTO_CLIENT_ID,
)
```

## Instrument ID 与符号体系（symbology）

Databento 的行情数据包含一个 `instrument_id` 字段，该字段为整数，由原始来源场所或 Databento 在规范化过程中分配。

需要注意的是，这与 Nautilus 中的 `InstrumentId` 不同，后者是由符号与场所拼接并以句点分隔的字符串形式，例如 `"{symbol}.{venue}"`。

Nautilus 的解码器会使用 Databento 的 `raw_symbol` 作为 Nautilus 的 `symbol`，并从 Databento 的 instrument 定义消息中读取 [ISO 10383 MIC](https://www.iso20022.org/market-identifier-codes)（Market Identifier Code）作为 Nautilus 的 `venue` 字段。

Databento 的数据集由 _dataset ID_ 标识，這不同于 venue 标识符。可在此了解更多 Databento 数据集命名规则：[datasets](https://databento.com/docs/api-reference-historical/basics/datasets)。

尤其需要注意的是，对于 CME Globex MDP 3.0 数据集（`GLBX.MDP3` dataset ID），下列交易所都会被归入 `GLBX` venue：这些映射可通过 instruments 的 `exchange` 字段判断：

- `CBCM`: XCME-XCBT 跨交易所价差
- `NYUM`: XNYM-DUMX 跨交易所价差
- `XCBT`: Chicago Board of Trade (CBOT)
- `XCEC`: Commodities Exchange Center (COMEX)
- `XCME`: Chicago Mercantile Exchange (CME)
- `XFXS`: CME FX Link spread
- `XNYM`: New York Mercantile Exchange (NYMEX)

:::info
其他 venue 的 MIC 可在 [metadata.list_publishers](https://databento.com/docs/api-reference-historical/metadata/metadata-list-publishers) 端点的 `venue` 字段中找到。
:::

## 时间戳（Timestamps）

Databento 数据包含多种时间戳字段，包括但不限于：

- `ts_event`: 成交撮合引擎接收时间，单位为自 UNIX 纪元以来的纳秒数。
- `ts_in_delta`: 成交撮合引擎发送时间，相对于 `ts_recv` 的纳秒差值。
- `ts_recv`: 抓取服务器接收时间，单位为自 UNIX 纪元以来的纳秒数。
- `ts_out`: Databento 发送时间戳。

Nautilus 数据至少包含两个时间戳（由 `Data` contract 要求）：

- `ts_event`: 事件发生时的 UNIX 时间戳（纳秒）。
- `ts_init`: 数据实例创建时的 UNIX 时间戳（纳秒）。

在将 Databento 数据解码并标准化为 Nautilus 时，我们通常将 Databento 的 `ts_recv` 映射到 Nautilus 的 `ts_event` 字段，因为 `ts_recv` 更可靠且对每个 instrument 保证单调递增。
例外情况为 `DatabentoImbalance` 与 `DatabentoStatistics` 类型，它们会保留所有相关时间戳字段，因为这些类型是为适配器专门定义的。

:::info
更多细节请参阅 Databento 文档：

- [Databento standards and conventions - timestamps](https://databento.com/docs/standards-and-conventions/common-fields-enums-types#timestamps)
- [Databento timestamping guide](https://databento.com/docs/architecture/timestamping-guide)

:::

## 数据类型

下面章节讨论 Databento schema 与 Nautilus 数据类型之间的对应关系及注意事项。

:::info
参见 Databento 的 [schemas and data formats](https://databento.com/docs/schemas-and-data-formats)。
:::

### Instrument 定义

Databento 使用单一 schema 覆盖所有 instrument 类别，解码后会映射到相应的 Nautilus `Instrument` 类型。

下列 Databento 的 instrument 类别被 NautilusTrader 支持：

| Databento instrument class | Code | Nautilus instrument type |
| -------------------------- | ---- | ------------------------ |
| Stock                      | `K`  | `Equity`                 |
| Future                     | `F`  | `FuturesContract`        |
| Call                       | `C`  | `OptionContract`         |
| Put                        | `P`  | `OptionContract`         |
| Future spread              | `S`  | `FuturesSpread`          |
| Option spread              | `T`  | `OptionSpread`           |
| Mixed spread               | `M`  | `OptionSpread`           |
| FX spot                    | `X`  | `CurrencyPair`           |
| Bond                       | `B`  | Not yet available        |

### MBO（market by order）

该 schema 提供 Databento 中最高粒度的数据，表示完整的订单簿深度。有些消息也携带成交信息，因此解码 MBO 消息时，Nautilus 会生成 `OrderBookDelta`，并在适用情况下同时生成 `TradeTick`。

Nautilus 的实时数据客户端会缓冲 MBO 消息，直到检测到 `F_LAST` 标志，然后以离散的 `OrderBookDeltas` 容器对象传递给注册的处理器。

订单簿快照也会被缓冲为 `OrderBookDeltas` 容器，这在回放（replay）启动序列中会被使用。

### MBP-1（market by price，顶层盘口）

该 schema 仅表示顶层盘口（包含 quotes 与 trades）。与 MBO 类似，部分消息会包含成交信息，解码 MBP-1 消息时 Nautilus 会生成 `QuoteTick`，若为成交事件则也会生成 `TradeTick`。

### TBBO 与 TCBBO（含成交的顶层盘口）

TBBO（Top Book with Trades）与 TCBBO（Top Consolidated Book with Trades）在每条消息中同时提供报价与成交数据。订阅这些 schema 时，你会同时收到 `QuoteTick` 与 `TradeTick`，比分别订阅报价与成交更高效。TCBBO 为跨场所的汇总数据。

### OHLCV（K 线聚合）

Databento 的 K 线聚合消息在条的“开盘”时打时间戳。Nautilus 的解码器会将 `ts_event` 时间戳标准化为条的“收盘”时间（原始 `ts_event` + 条的时间间隔）。

### Imbalance 与 Statistics

Databento 的 `imbalance` 与 `statistics` schema 无法简单地映射为内置的 Nautilus 数据类型，因此在 Rust 侧定义了 `DatabentoImbalance` 与 `DatabentoStatistics` 两种特定类型。
通过 PyO3（Rust）提供的 Python 绑定，这些类型在 Python 侧表现得与内置类型有所不同：其属性由 PyO3 提供，并且可能无法直接与期望 Cython 类型的方法兼容。API 参考中提供了 PyO3 到传统 Cython 对象的转换方法。

下面是将 PyO3 `Price` 转换为 Cython `Price` 的通用示例：

```python
price = Price.from_raw(pyo3_price.raw, pyo3_price.precision)
```

此外，订阅或请求这些数据类型需要使用底层的通用方法。下面示例展示了如何订阅 `AAPL.XNAS` 的 `imbalance` schema：

```python
from nautilus_trader.adapters.databento import DATABENTO_CLIENT_ID
from nautilus_trader.adapters.databento import DatabentoImbalance
from nautilus_trader.model import DataType

instrument_id = InstrumentId.from_str("AAPL.XNAS")
self.subscribe_data(
    data_type=DataType(DatabentoImbalance, metadata={"instrument_id": instrument_id}),
    client_id=DATABENTO_CLIENT_ID,
)
```

或者请求前一日的 `statistics` schema，例如对 CME Globex 上所有活动的 E-mini S&P 500 期货合约（父合约 `ES.FUT.GLBX`）：

```python
from nautilus_trader.adapters.databento import DATABENTO_CLIENT_ID
from nautilus_trader.adapters.databento import DatabentoStatistics
from nautilus_trader.model import DataType

instrument_id = InstrumentId.from_str("ES.FUT.GLBX")
metadata = {
    "instrument_id": instrument_id,
    "start": "2024-03-06",
}
self.request_data(
    data_type=DataType(DatabentoStatistics, metadata=metadata),
    client_id=DATABENTO_CLIENT_ID,
)
```

## 性能注意事项

使用 Databento DBN 数据进行回测时有两种策略：

- 将数据保留为 DBN（`.dbn.zst`）文件并在每次运行时实时解码为 Nautilus 对象；
- 将 DBN 文件转换为 Nautilus 对象后写入数据目录（Parquet 格式），只解码一次以供后续重用。

虽然 DBN -> Nautilus 的解码器采用 Rust 实现并已优化，但最高的回测性能通常来自于将 Nautilus 对象写入数据目录，从而避免每次回测都重复解码。

[DataFusion](https://arrow.apache.org/datafusion/) 可作为查询引擎后端，用于高效加载并流式读取磁盘上的 Nautilus Parquet 数据，其吞吐量通常比每次回放时实时将 DBN 转换为 Nautilus 的方式高一个数量级以上。

:::note
性能基准测试仍在开发中。
:::

## 加载 DBN 数据

你可以使用 `DatabentoDataLoader` 将 DBN 文件解码为 Nautilus 对象。这样做主要有两个用途：

- 直接将转换后的数据传给 `BacktestEngine.add_data` 用于回测；
- 将转换后的数据传给 `ParquetDataCatalog.write_data`，以便后续通过 `BacktestNode` 流式读取使用。

### 将 DBN 数据加载到 BacktestEngine

下面示例展示如何加载 DBN 数据并传递给 `BacktestEngine`。由于 `BacktestEngine` 需要先添加 instrument，本示例使用 `TestInstrumentProvider` 提供的测试 instrument（当然也可以传入从 DBN 文件解析得到的 instrument 对象）。示例数据为 Nasdaq 上 TSLA（Tesla Inc）一个月的成交数据：

```python
# Add instrument
TSLA_NASDAQ = TestInstrumentProvider.equity(symbol="TSLA")
engine.add_instrument(TSLA_NASDAQ)

# Decode data to legacy Cython objects
loader = DatabentoDataLoader()
trades = loader.from_dbn_file(
    path=TEST_DATA_DIR / "databento" / "temp" / "tsla-xnas-20240107-20240206.trades.dbn.zst",
    instrument_id=TSLA_NASDAQ.id,
)

# Add data
engine.add_data(trades)
```

### 将 DBN 数据写入 ParquetDataCatalog

下面示例展示如何将 DBN 数据解码并写入 `ParquetDataCatalog`。示例中将 `as_legacy_cython` 设为 `False`，以确保解码为 PyO3（Rust）对象。需要注意的是，虽然也可以将传统的 Cython 对象传入 `write_data`，但在内部这些对象会被转换回 PyO3；直接传入 PyO3 对象可以获得性能优化。

```python
# Initialize the catalog interface
# (will use the `NAUTILUS_PATH` env var as the path)
catalog = ParquetDataCatalog.from_env()

instrument_id = InstrumentId.from_str("TSLA.XNAS")

# Decode data to pyo3 objects
loader = DatabentoDataLoader()
trades = loader.from_dbn_file(
    path=TEST_DATA_DIR / "databento" / "temp" / "tsla-xnas-20240107-20240206.trades.dbn.zst",
    instrument_id=instrument_id,
    as_legacy_cython=False,  # This is an optimization for writing to the catalog
)

# Write data
catalog.write_data(trades)
```

:::info
另见 [Data concepts guide](../concepts/data.md)。
:::

### 历史加载器选项

`from_dbn_file` 方法支持若干重要参数：

- `instrument_id`：传入可加速解码，避免符号映射查找开销。
- `price_precision`：覆盖 instrument 的默认价格精度。
- `include_trades`：对于 MBP-1/CMBP-1 schema，将其置为 `True` 会在存在成交数据时同时产出 `QuoteTick` 和 `TradeTick` 对象。
- `as_legacy_cython`：当加载 IMBALANCE 或 STATISTICS schema（必须）或在写入 catalog 时为提升性能，应设置为 `False`。

:::warning
IMBALANCE 与 STATISTICS schema 要求 `as_legacy_cython=False`，因为这些类型仅以 PyO3 形式存在。若设置 `as_legacy_cython=True` 将抛出 `ValueError`。
:::

### 加载汇总（consolidated）数据

汇总 schema 会跨多个场所聚合数据：

```python
# Load consolidated MBP-1 quotes
loader = DatabentoDataLoader()
cmbp_quotes = loader.from_dbn_file(
    path="consolidated.cmbp-1.dbn.zst",
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
    include_trades=True,  # Get both quotes and trades if available
    as_legacy_cython=True,
)

# Load consolidated BBO quotes
cbbo_quotes = loader.from_dbn_file(
    path="consolidated.cbbo-1s.dbn.zst",
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
    as_legacy_cython=False,  # Use PyO3 for better performance
)

# Load TCBBO (trade-sampled consolidated BBO) - provides both quotes and trades
# Note: include_trades=True loads quotes, include_trades=False loads trades
tcbbo_quotes = loader.from_dbn_file(
    path="consolidated.tcbbo.dbn.zst",
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
    include_trades=True,  # Loads quotes
    as_legacy_cython=True,
)

tcbbo_trades = loader.from_dbn_file(
    path="consolidated.tcbbo.dbn.zst",
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
    include_trades=False,  # Loads trades
    as_legacy_cython=True,
)
```

:::tip
**成本优化**：避免同时订阅 TBBO/TCBBO 与单独的 trades 订阅，因为这些 schema 已经包含成交数据，这样可避免重复并降低费用。
:::

## 实时客户端架构

`DatabentoDataClient` 是一个汇聚了其它 Databento 适配器类的 Python 类。每个 Databento 数据集会有两个 `DatabentoLiveClient` 实例：

- 一个用于 MBO（逐单盘口增量）实时流
- 一个用于所有其它实时流

:::warning
目前存在一个限制：对于某个数据集的所有 MBO（逐单盘口）订阅必须在节点启动时完成，以便能够从会话开始处回放数据。如果在启动后再发起 MBO 订阅，将记录错误并忽略该订阅。

其它 Databento schema 不受此限制。
:::

`DatabentoInstrumentProvider` 与 `DatabentoDataClient` 之间会复用单个 `DatabentoHistoricalClient` 实例，用于获取历史的 instrument 定义与数据请求。

## 配置

最常见的用例是将 Databento 数据客户端加入到 live `TradingNode` 的配置中。为此，请在客户端配置中添加 `DATABENTO` 部分：

```python
from nautilus_trader.adapters.databento import DATABENTO
from nautilus_trader.live.node import TradingNode

config = TradingNodeConfig(
    ...,  # Omitted
    data_clients={
        DATABENTO: {
            "api_key": None,  # 'DATABENTO_API_KEY' env var
            "http_gateway": None,  # Override for the default HTTP historical gateway
            "live_gateway": None,  # Override for the default raw TCP real-time gateway
            "instrument_provider": InstrumentProviderConfig(load_all=True),
            "instrument_ids": None,  # Nautilus instrument IDs to load on start
            "parent_symbols": None,  # Databento parent symbols to load on start
        },
    },
    ..., # Omitted
)
```

然后，创建 `TradingNode` 并注册客户端工厂：

```python
from nautilus_trader.adapters.databento.factories import DatabentoLiveDataClientFactory
from nautilus_trader.live.node import TradingNode

# Instantiate the live trading node with a configuration
node = TradingNode(config=config)

# Register the client factory with the node
node.add_data_client_factory(DATABENTO, DatabentoLiveDataClientFactory)

# Finally build the node
node.build()
```

### 配置参数

Databento 数据客户端提供以下配置选项：

| Option                    | Default | Description                                                                                                               |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `api_key`                 | `None`  | Databento API secret. When `None`, falls back to the `DATABENTO_API_KEY` environment variable.                            |
| `http_gateway`            | `None`  | Historical HTTP gateway override, useful for testing custom endpoints.                                                    |
| `live_gateway`            | `None`  | Raw TCP real-time gateway override, typically only used for testing.                                                      |
| `use_exchange_as_venue`   | `True`  | If `True`, uses the exchange MIC for Nautilus venues (e.g., `XCME`). When `False`, retains the default GLBX mapping.      |
| `timeout_initial_load`    | `15.0`  | Seconds to wait for instrument definitions to load per dataset before proceeding.                                         |
| `mbo_subscriptions_delay` | `3.0`   | Seconds to buffer before enabling MBO/L3 streams so initial snapshots can replay in order.                                |
| `bars_timestamp_on_close` | `True`  | Timestamp bars on the close (`ts_event`/`ts_init`). Set `False` to timestamp on the open.                                 |
| `venue_dataset_map`       | `None`  | Optional mapping of Nautilus venues to Databento dataset codes.                                                           |
| `parent_symbols`          | `None`  | Optional mapping `{dataset: {parent symbols}}` to preload definition trees (e.g., `{"GLBX.MDP3": {"ES.FUT", "ES.OPT"}}`). |
| `instrument_ids`          | `None`  | Sequence of Nautilus `InstrumentId` values to preload definitions for at startup.                                         |

:::tip
建议使用环境变量管理凭证。
:::

:::info
如需更多功能或贡献 Databento 适配器，请参见我们的 [contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
