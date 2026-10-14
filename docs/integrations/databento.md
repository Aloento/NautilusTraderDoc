# Databento

NautilusTrader 内置 [Databento](https://databento.com/) API 的适配器，也支持 [Databento Binary Encoding（DBN）](https://databento.com/docs/standards-and-conventions/databento-binary-encoding)格式的数据。Databento 只是行情数据提供商，因此适配器不包含执行客户端。需要执行或信号用途时，可以：

- 与 sandbox 配对做模拟执行。
- 把执行路由到另一个适配器，例如 Interactive Brokers。
- 用它计算传统资产类别的信号，用于加密货币交易。

适配器支持：

- 从 DBN 文件加载历史数据并解码为 Nautilus 对象，用于回测或写入数据目录。
- 请求历史数据并解码为 Nautilus 对象，用于实时交易和回测。
- 订阅实时数据源并解码为 Nautilus 对象，用于实时交易和 sandbox 环境。

:::tip
[Databento](https://databento.com/signup) 为新注册用户赠送 125 美元数据信用额度。可用于历史数据请求，或抵扣订阅套餐。信用额度团队共享，注册六个月后过期。

合理控制请求的话，足够用于测试和评估。请求数据前先查
[metadata.get_cost](https://databento.com/docs/api-reference-historical/metadata/metadata-get-cost)
端点。
:::

## 概览 {#overview}

适配器使用 [databento-rs](https://crates.io/crates/databento) crate，即 Databento 官方 Rust 客户端库。

:::info
无需单独安装 `databento`。适配器以静态库编译，构建时自动链接。
:::

可用的适配器类：

- `DatabentoDataLoader`：从文件加载 DBN 数据。
- `DatabentoHistoricalClient`：通过 Databento HTTP API 获取历史行情和金融工具定义。
- `DatabentoLiveClient`：通过 Databento 原生 TCP API 订阅实时数据源。
- `DatabentoDataClient`：实时交易节点的数据客户端，包装历史客户端和实时客户端。
- `DatabentoDataClientFactory`：为 `LiveNode` 从 `DatabentoDataClientConfig` 构建数据客户端。

:::note
多数用户只配置实时交易节点（下文介绍），不直接操作这些组件。
:::

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/databento/)

Rust 示例位于
[`crates/adapters/databento/examples/`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/databento/examples/)。
数据测试器运行时订阅所配置工具的实时报价与成交：

```bash
cargo run --example databento-data-tester --package nautilus-databento
```

## Databento 文档 {#databento-documentation}

见 [Databento 新手指南](https://databento.com/docs/quickstart/new-user-guides)，与本集成指南配合阅读。

## Databento Binary Encoding（DBN） {#databento-binary-encoding-dbn}

Databento Binary Encoding（DBN）是面向标准化行情数据的高效消息编码与存储格式。[DBN 规范](https://databento.com/docs/standards-and-conventions/databento-binary-encoding)
包含自描述的元数据头和一组固定的结构体定义，统一了行情数据的标准化方式。

适配器把 DBN 数据解码为 Nautilus 对象。同一个 Rust 解码器同时处理：

- 从磁盘加载并解码 DBN 文件。
- 实时解码历史与实时数据。

## 支持的模式 {#supported-schemas}

NautilusTrader 支持以下 Databento 模式：

| Databento 模式                                                                 | Nautilus 数据类型                | 说明                          |
| :----------------------------------------------------------------------------- | :------------------------------- | :---------------------------- |
| [MBO](https://databento.com/docs/schemas-and-data-formats/mbo)                 | `OrderBookDelta \| TradeTick`    | 逐笔订单（L3）。              |
| [MBP_1](https://databento.com/docs/schemas-and-data-formats/mbp-1)             | `(QuoteTick, TradeTick \| None)` | 按价格档位（L1）。            |
| [MBP_10](https://databento.com/docs/schemas-and-data-formats/mbp-10)           | `OrderBookDepth`                 | 市场深度（L2）。              |
| [BBO_1S](https://databento.com/docs/schemas-and-data-formats/bbo-1s)           | `QuoteTick`                      | 一秒最优买卖价。              |
| [BBO_1M](https://databento.com/docs/schemas-and-data-formats/bbo-1m)           | `QuoteTick`                      | 一分钟最优买卖价。            |
| [CMBP_1](https://databento.com/docs/schemas-and-data-formats/cmbp-1)           | `(QuoteTick, TradeTick \| None)` | 跨场所合并 MBP。              |
| [CBBO_1S](https://databento.com/docs/schemas-and-data-formats/cbbo-1s)         | `QuoteTick`                      | 合并的一秒 BBO。              |
| [CBBO_1M](https://databento.com/docs/schemas-and-data-formats/cbbo-1m)         | `QuoteTick`                      | 合并的一分钟 BBO。            |
| [TCBBO](https://databento.com/docs/schemas-and-data-formats/tcbbo)             | `(QuoteTick, TradeTick)`         | 成交采样的合并 BBO。          |
| [TBBO](https://databento.com/docs/schemas-and-data-formats/tbbo)               | `(QuoteTick, TradeTick)`         | 成交采样的最优买卖价。        |
| [TRADES](https://databento.com/docs/schemas-and-data-formats/trades)           | `TradeTick`                      | 成交 tick。                   |
| [OHLCV_1S](https://databento.com/docs/schemas-and-data-formats/ohlcv-1s)       | `Bar`                            | 一秒 bar。                    |
| [OHLCV_1M](https://databento.com/docs/schemas-and-data-formats/ohlcv-1m)       | `Bar`                            | 一分钟 bar。                  |
| [OHLCV_1H](https://databento.com/docs/schemas-and-data-formats/ohlcv-1h)       | `Bar`                            | 一小时 bar。                  |
| [OHLCV_1D](https://databento.com/docs/schemas-and-data-formats/ohlcv-1d)       | `Bar`                            | 日线 bar。                    |
| [DEFINITION](https://databento.com/docs/schemas-and-data-formats/definition)   | `Instrument`（多种类型）         | 金融工具定义。                |
| [IMBALANCE](https://databento.com/docs/schemas-and-data-formats/imbalance)     | `DatabentoImbalance`             | 集合竞价不平衡数据。          |
| [STATISTICS](https://databento.com/docs/schemas-and-data-formats/statistics)   | `DatabentoStatistics`            | 市场统计。                    |
| [STATUS](https://databento.com/docs/schemas-and-data-formats/status)           | `InstrumentStatus`               | 市场状态更新。                |

:::note
Databento 还记载了参考类模式，包括公司行为、调整因子和证券主档数据。本适配器只把上表所列模式映射为 Nautilus 数据类型。Databento 日线 OHLCV 使用 `ohlcv-1d`，`ohlcv-eod` 记录也解码为日线 bar。官方结算价与未平仓量来自 `statistics` 模式，不在 OHLCV bar 里。
:::

:::info
不支持的 `instrument_class` 值（`'I'` 指数、`'B'` 债券）的定义会跳过并告警，而不是中止整批加载。货币对无法被 Nautilus 映射的外汇现货定义同样跳过。指数定义主要来自 Cboe Global Indices Feed（`MAIN.CGIF`）和 OPRA 期权发布方。`publishers.json` 列出每个发布方 ID 及其数据集与场所。需要为这些类型建 Nautilus 模型请提 issue。

`stat_type` 值超出建模范围（1-20）的统计消息同样跳过并告警，包括场所专有值 `VenueSpecificVolume1`（10001）和 `VenueSpecificPrice1`（10002）——它们超出持久化所用 `u8` Arrow 列的宽度。
:::

### 模式选择要点 {#schema-considerations}

- **TBBO 与 TCBBO**：成交采样数据流，把每笔成交与其*影响订单簿之前*的 BBO 配对。适合需要成交与同期报价对齐、又不想管理两条数据流的场景。
- **MBP-1 与 CMBP-1（L1）**：事件级更新，只在成交事件上发出 trade。要完整的 top-of-book 事件记录带就选它们。要让报价与成交对齐，优先 TBBO 或 TCBBO。
- **MBP-10（L2）**：前 10 档加成交。适合需要深度信息但不需要完整 MBO 数据的策略，含每档订单数。Databento 该模式只提供 10 档，深度请求必须用 `depth=10`。
- **MBO（L3）**：逐笔订单事件，用于队列位置建模和精确重建订单簿。`subscribe_book_deltas()` 不请求快照，因此节点订阅从订阅时刻开始流式，没有初始簿状态。需要完整订单簿的策略必须在交易时段开始前启动、用历史请求预置订单簿，或直接用 `DatabentoLiveClient.subscribe` 并设 `snapshot=True`。
- **BBO_1S/BBO_1M 与 CBBO_1S/CBBO_1M**：按固定间隔（1 秒或 1 分钟）采样的 top-of-book 更新。适配器对这些模式只发出 `QuoteTick`。适合监控、价差和低成本信号，不适合微观结构研究。
- **TRADES**：只有成交。要报价上下文，可订阅 MBP-1（每笔成交事件都发一个 `TradeTick`），或用 TBBO、TCBBO。
- **OHLCV**：由成交聚合的 bar，适合更高周期的分析。bar 默认带收盘时间戳，设 `bars_timestamp_on_close=False` 改用区间开盘时间。日线 bar 用 `ohlcv-1d`。官方结算价与未平仓量用 `statistics`。
- **Imbalance 与 statistics**：场所运营数据，Nautilus 没有内置对应类型。经 `subscribe_data()` 订阅，或经历史客户端、数据加载器、直接使用实时客户端获取（见
  [Imbalance 与 statistics](#imbalance-and-statistics)）。
- **Status**：场所交易状态更新，经 `subscribe_instrument_status` 订阅。

:::tip
合并类模式（CMBP_1、CBBO_1S、CBBO_1M、TCBBO）跨多个场所聚合数据，适合跨场所分析。
:::

:::info
另见 Databento 的
[Schemas and data formats](https://databento.com/docs/schemas-and-data-formats) 指南。
:::

## 数据集可用性与选择 {#dataset-availability-and-selection}

Databento 数据集 ID 与 Nautilus 场所标识相互独立。适配器支持上文列出的模式，但每个 Databento 数据集只暴露其中一个子集。往实时配置里加新数据集或模式前，先查元数据端点：

```bash
databento_auth="$(printf '%s:' "$DATABENTO_API_KEY" | base64 | tr -d '\n')"

curl --header "Authorization: Basic ${databento_auth}" \
  "https://hist.databento.com/v0/metadata.list_schemas?dataset=EQUS.MINI"

curl --header "Authorization: Basic ${databento_auth}" \
  "https://hist.databento.com/v0/metadata.list_unit_prices?dataset=EQUS.MINI"

curl --header "Authorization: Basic ${databento_auth}" \
  "https://hist.databento.com/v0/metadata.get_cost" \
  --data-urlencode "dataset=EQUS.MINI" \
  --data-urlencode "symbols=AAPL" \
  --data-urlencode "stype_in=raw_symbol" \
  --data-urlencode "schema=bbo-1s" \
  --data-urlencode "start=2026-06-24T14:30:00Z" \
  --data-urlencode "end=2026-06-24T14:31:00Z"
```

两个常用评估数据集：

- `GLBX.MDP3` 是 CME Globex MDP 3.0 数据集，覆盖 CME、CBOT、NYMEX、COMEX 的期货、期货期权和价差。支持 MBO、MBP-1、MBP-10、TBBO、trades、BBO 间隔、OHLCV、definition、statistics 和 status。不提供股票合并模式（`cmbp-1`、`cbbo-*`、`tcbbo`）。
- `EQUS.MINI` 是 Databento US Equities Mini，派生的聚合 top-of-book 数据集，成分场所匿名化。支持 MBP-1、TBBO、trades、BBO 间隔、OHLCV 和 definition。不支持 MBO、MBP-10、imbalance、statistics、status 和合并模式。

US Equities Mini 工具的 Nautilus 场所用 `EQUS`：`AAPL.EQUS`、`MSFT.EQUS` 等。内置场所到数据集映射把 `EQUS` 路由到 `EQUS.MINI`。`XNAS`、`XNYS` 这类场所代码指向场所专有数据集，除非用 `venue_dataset_map` 覆盖。

:::warning
把 `XNAS` 之类的场所覆盖为 `EQUS.MINI` 时，下游工具 ID 要保持一致。Mini 记录携带合并的 `EQUS` 发布方，未显式传 `instrument_id` 的文件或历史解码会发出 `*.EQUS` 标识。
:::

成本取决于模式、代码和时间范围。探索阶段先用小范围、`definition`、`bbo-1s`、`bbo-1m` 或 `trades`，拉取历史时间序列前先调用 `metadata.get_cost`。当 `mbp-1` 或 `tbbo` 这类组合模式已携带策略所需数据时，避免重复订阅报价和成交。

## 订阅与请求 {#subscriptions-and-requests}

Nautilus 订阅方法与 Databento 模式的对应关系：

| Nautilus 订阅方法               | 默认模式     | 可用 Databento 模式                                                        | Nautilus 数据类型                           |
| :------------------------------ | :----------- | :------------------------------------------------------------------------- | :------------------------------------------ |
| `subscribe_instrument()`        | `definition` | `definition`                                                               | `Instrument`                                |
| `subscribe_quotes()`            | `mbp-1`      | `mbp-1`、`bbo-1s`、`bbo-1m`、`cmbp-1`、`cbbo-1s`、`cbbo-1m`、`tbbo`、`tcbbo` | `QuoteTick`                                 |
| `subscribe_trades()`            | `trades`     | `trades`、`tbbo`、`tcbbo`、`mbp-1`、`cmbp-1`                               | `TradeTick`                                 |
| `subscribe_book_deltas()`       | `mbo`        | `mbo`                                                                      | `OrderBookDeltas`                           |
| `subscribe_book_depth()`        | `mbp-10`     | `mbp-10`                                                                   | `OrderBookDepth`                            |
| `subscribe_bars()`              | 无           | `ohlcv-1s`、`ohlcv-1m`、`ohlcv-1h`、`ohlcv-1d`                             | `Bar`                                       |
| `subscribe_data()`              | 无           | `statistics`、`imbalance`                                                  | `DatabentoStatistics`、`DatabentoImbalance` |
| `subscribe_instrument_status()` | `status`     | `status`                                                                   | `InstrumentStatus`                          |

非默认模式通过订阅参数 `schema` 传入，见下文示例。只有 `subscribe_quotes()` 和 `subscribe_trades()` 接受选择。`subscribe_bars()` 的模式由 bar 聚合决定，`subscribe_data()` 由数据类型名（`DatabentoStatistics` 或 `DatabentoImbalance`）决定。其余方法始终使用表中唯一的模式。对应的历史请求 `request_quotes()` 和 `request_trades()` 接受相同的 `schema` 取值与默认值。

:::warning
"可用 Databento 模式"一列列出的是该 Nautilus 订阅方法在适配器层面支持的选项，所选数据集还必须支持该模式。例如 `EQUS.MINI` 无法提供 `mbo`、`mbp-10`、`statistics` 或 `status`。
:::

:::note
下文示例假定处于 `Strategy` 或 `DataActor` 上下文，`self` 具备订阅方法。需要导入的类型：

```python
from nautilus_trader.model import BarType
from nautilus_trader.model import BookType
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType
from nautilus_trader.model import InstrumentId


DATABENTO_CLIENT_ID = ClientId.from_str("DATABENTO")
instrument_id = InstrumentId.from_str("ES.c.0.GLBX")
```

:::

### 工具定义订阅 {#instrument-definition-subscriptions}

```python
# Stream definition messages, which also populate the live price precision map
self.subscribe_instrument(
    instrument_id=instrument_id,
    client_id=DATABENTO_CLIENT_ID,
)
```

### 报价订阅（MBP 与 L1） {#quote-subscriptions-mbp-and-l1}

```python
# Default MBP-1 quotes (also emits trades on trade events)
self.subscribe_quotes(instrument_id, client_id=DATABENTO_CLIENT_ID)

# Explicit MBP-1 schema
self.subscribe_quotes(
    instrument_id=instrument_id,
    params={"schema": "mbp-1"},
    client_id=DATABENTO_CLIENT_ID,
)

# 1-second BBO snapshots (adapter emits QuoteTick only)
self.subscribe_quotes(
    instrument_id=instrument_id,
    params={"schema": "bbo-1s"},
    client_id=DATABENTO_CLIENT_ID,
)

# Consolidated quotes across venues
self.subscribe_quotes(
    instrument_id=instrument_id,
    params={"schema": "cbbo-1s"},  # or "cmbp-1" for consolidated MBP
    client_id=DATABENTO_CLIENT_ID,
)

# Trade-sampled BBO (includes quotes and trades)
self.subscribe_quotes(
    instrument_id=instrument_id,
    params={"schema": "tbbo"},  # Receives QuoteTick and TradeTick on the message bus
    client_id=DATABENTO_CLIENT_ID,
)
```

### 成交订阅 {#trade-subscriptions}

```python
# Trade ticks only
self.subscribe_trades(instrument_id, client_id=DATABENTO_CLIENT_ID)

# Trades from MBP-1 feed (only when trade events occur)
self.subscribe_trades(
    instrument_id=instrument_id,
    params={"schema": "mbp-1"},
    client_id=DATABENTO_CLIENT_ID,
)

# Trade-sampled data (includes quotes at trade time)
self.subscribe_trades(
    instrument_id=instrument_id,
    params={"schema": "tbbo"},  # Also provides quotes at trade events
    client_id=DATABENTO_CLIENT_ID,
)
```

### 订单簿 delta 订阅（MBO 与 L3） {#order-book-deltas-subscriptions-mbo-and-l3}

```python
# Subscribe to full order book updates (market by order)
self.subscribe_book_deltas(
    instrument_id=instrument_id,
    book_type=BookType.L3_MBO,  # Uses MBO schema
    client_id=DATABENTO_CLIENT_ID,
)

# Deltas stream from the point of subscription with no initial book snapshot
```

### 工具状态订阅 {#instrument-status-subscriptions}

```python
# Subscribe to venue trading-state updates
self.subscribe_instrument_status(
    instrument_id=instrument_id,
    client_id=DATABENTO_CLIENT_ID,
)
```

### 深度、bar 与自定义数据订阅 {#depth-bar-and-custom-data-subscriptions}

`subscribe_book_depth()` 为单个工具流式发布 `mbp-10` 深度快照。Databento 只提供 10 档深度，显式传入 10 以外的深度会被拒绝。`BarType` 中的 bar 聚合为 `subscribe_bars()` 选择 OHLCV 模式（`ohlcv-1s`、`ohlcv-1m`、`ohlcv-1h` 或 `ohlcv-1d`）。步长必须为 1，价格类型必须是 `LAST`——解码器只发出这一种价格类型。`subscribe_data()` 为数据类型标识中所给工具 ID 流式发布 `DatabentoStatistics` 或 `DatabentoImbalance` 记录，带 metadata 的数据类型会被拒绝。记录以该标识发布，订阅者只收到自己工具的数据。

这三种订阅只接受 `ESM4.GLBX` 这类原始代码。记录会解析到具体合约，因此连续代码（`ES.c.0`）和父级代码（`ES.FUT`）会被拒绝——它们不会发布到订阅者未监听的主题上。示例使用原始代码：

```python
raw_instrument_id = InstrumentId.from_str("ESM4.GLBX")

self.subscribe_book_depth(
    instrument_id=raw_instrument_id,
    book_type=BookType.L2_MBP,
    client_id=DATABENTO_CLIENT_ID,
)

self.subscribe_bars(
    BarType.from_str(f"{raw_instrument_id}-1-MINUTE-LAST-EXTERNAL"),
    client_id=DATABENTO_CLIENT_ID,
)

self.subscribe_data(
    DataType("DatabentoStatistics", identifier=str(raw_instrument_id)),
    client_id=DATABENTO_CLIENT_ID,
)
```

Databento 实时订阅无法逐个移除，因此对应的 `unsubscribe_*` 命令会被忽略。

### 深度与 bar 的历史请求 {#historical-requests-for-depth-and-bars}

MBP-10 深度和 OHLCV bar 支持历史请求。`BarType` 的 bar 聚合选择 OHLCV 模式（`ohlcv-1s`、`ohlcv-1m`、`ohlcv-1h` 或 `ohlcv-1d`），深度请求使用 `mbp-10`：

```python
import pandas as pd


# Request 1-minute bars (uses the ohlcv-1m schema)
self.request_bars(
    bar_type=BarType.from_str(f"{instrument_id}-1-MINUTE-LAST-EXTERNAL"),
    start=pd.Timestamp("2024-03-06", tz="UTC"),
    end=pd.Timestamp("2024-03-07", tz="UTC"),
    client_id=DATABENTO_CLIENT_ID,
)

# Request top 10 levels of market depth (Databento serves depth=10 only)
self.request_book_depth(
    instrument_id=instrument_id,
    depth=10,
    start=pd.Timestamp("2024-03-06T14:30", tz="UTC"),
    end=pd.Timestamp("2024-03-06T14:31", tz="UTC"),
    client_id=DATABENTO_CLIENT_ID,
)
```

## 工具 ID 与代码体系 {#instrument-ids-and-symbology}

Databento 行情数据带有数字 `instrument_id` 字段，通常由发布方分配；发布方不提供时由 Databento 合成一个。Databento 只保证该 ID 在单日内唯一。这与 Nautilus 的 `InstrumentId` 不同——后者是"代码.场所"格式的字符串。

解码器把 Databento 的 `raw_symbol` 映射为 Nautilus 的 `symbol`。发布方 ID 通过 `publishers.json` 映射为默认 Nautilus 场所。行情数据到达之前，订阅 `InstrumentId` 的元数据也可以预置代码到场所的映射。

数据集 ID 遵循 Databento 的
[数据集命名约定](https://databento.com/docs/api-reference-historical/basics/datasets)，与 Nautilus `InstrumentId` 中的场所代码是两回事。

历史请求与实时订阅中，适配器把每个 `InstrumentId` 的 Nautilus 代码部分作为 Databento 代码发送，并从该字符串推断 `stype_in`：

- 以 `.FUT` 或 `.OPT` 结尾的代码使用 Databento 父级代码体系，例如 `ES.FUT.XCME`。
- 三段式且最后一段为数字的代码使用连续合约代码体系，例如 `ES.c.0.GLBX`。
- 纯数字代码使用 Databento `instrument_id` 代码体系。
- 其余代码使用原始代码体系，例如 `ESZ6.XCME` 或 `AAPL.EQUS`。

同一请求或订阅内的全部代码必须使用同一种代码体系。`AAPL.EQUS` 与 `MSFT.EQUS` 可以批量，`ES.FUT.XCME` 与 `NQ.FUT.XCME` 可以批量，但不要在一个 Databento 请求里混用原始代码和父级代码。

对 CME Globex MDP 3.0（`GLBX.MDP3`），发布方默认映射到 `GLBX` 场所。`use_exchange_as_venue=True` 时，定义消息可以用工具的交易所 MIC 覆盖 `GLBX`：

- `CBCM`：XCME-XCBT 交易所间价差
- `NYUM`：XNYM-DUMX 交易所间价差
- `XCBT`：芝加哥期货交易所（CBOT）
- `XCEC`：商品交易所中心（COMEX）
- `XCME`：芝加哥商品交易所（CME）
- `XFXS`：CME FX Link 价差
- `XNYM`：纽约商品交易所（NYMEX）

:::info
其余场所 MIC 见
[metadata.list_publishers](https://databento.com/docs/api-reference-historical/metadata/metadata-list-publishers) 端点响应的 `venue` 字段。
:::

## 时间戳 {#timestamps}

Databento 数据包含以下时间戳字段：

- `ts_event`：撮合引擎收到数据的纳秒级 UNIX 时间戳。
- `ts_in_delta`：撮合引擎发出数据的时间，表示为早于 `ts_recv` 的纳秒数。
- `ts_recv`：采集服务器收到数据的纳秒级 UNIX 时间戳。
- `ts_out`：Databento 发送时间戳（仅实时）。

Nautilus 数据至少需要两个时间戳（`Data` 契约）：

- `ts_event`：数据事件发生的 UNIX 纳秒时间戳。
- `ts_init`：数据实例创建的 UNIX 纳秒时间戳。

报价与成交类模式把 Databento `ts_recv` 映射为 Nautilus `ts_event`，因为它更可靠，且按 Databento 代码单调递增。bar 使用 DBN bar 区间时间戳，`bars_timestamp_on_close` 决定 Nautilus bar 用区间开盘还是收盘时间。`InstrumentStatus` 使用 DBN 记录头的 `ts_event`。`DatabentoImbalance` 和 `DatabentoStatistics` 保留 Databento 的时间戳字段，因为它们是适配器专有类型。

:::info
细节见 Databento 文档：

- [Databento 标准与惯例 - 时间戳](https://databento.com/docs/standards-and-conventions/common-fields-enums-types#timestamps)
- [Databento 时间戳指南](https://databento.com/docs/architecture/timestamping-guide)

:::

## 数据类型 {#data-types}

本节把 Databento 模式映射到 Nautilus 数据类型。

:::info
见 Databento
[schemas and data formats](https://databento.com/docs/schemas-and-data-formats)。
:::

### 工具定义 {#instrument-definitions}

Databento 对所有工具类别使用同一种模式。解码器把每种映射到相应的 Nautilus `Instrument` 类型。

| Databento 工具类别 | 代码 | Nautilus 工具类型      |
| ------------------ | ---- | ---------------------- |
| 股票               | `K`  | `Equity`               |
| 期货               | `F`  | `FuturesContract`      |
| 看涨期权           | `C`  | `OptionContract`       |
| 看跌期权           | `P`  | `OptionContract`       |
| 期货价差           | `S`  | `FuturesSpread`        |
| 期权价差           | `T`  | `OptionSpread`         |
| 混合价差           | `M`  | `OptionSpread`         |
| 外汇现货           | `X`  | `CurrencyPair`         |
| 指数               | `I`  | 暂不可用               |
| 债券               | `B`  | 暂不可用               |

### 期权到期时间修正 {#option-expiration-correction}

OPRA 期权定义（数据集 `OPRA.PILLAR`）的到期时间只精确到日：时分秒被清零为午夜 UTC。于是 16:00（纽约时间）到期的期权，其时间戳在纽约时区会落在前一天晚上，撮合引擎会在最后一个交易日之前就把它当作已到期。默认情况下，加载器把这类午夜 UTC 的 OPRA 到期时间修正为纽约时间 16:00，其他数据集一律不动，带日内时间的到期时间（如 CME Globex）也一律不动。

用 `expiration_overrides` 覆盖默认值或按标的设置时间。它把数据集映射到"标的代码 → 时间"的映射，保留键 `default` 设置整个数据集的时间：

```python
loader.load_instruments(
    filepath=path,
    use_exchange_as_venue=False,
    expiration_overrides={
        "OPRA.PILLAR": {"default": "16:00", "SPX": "09:30"},
    },
)
```

时间用交易所当地时区（OPRA 为纽约）的 `HH:MM` 或 `HH:MM:SS`。只有内置了修正规则的数据集可以调整，目前只有 `OPRA.PILLAR`。未知或无规则的数据集（如 `GLBX.MDP3`）会抛 `ValueError`。修正按期权的标的匹配，无法区分标的相同但结算时间不同的系列（例如 AM 结算的 SPX 与 PM 结算的 SPXW）。请按所加载合约设置对应的时间。

### 价格精度 {#price-precision}

Databento 原始价格是按 1e-9 缩放的定点整数。适配器从定义消息中工具的 tick size 推导价格精度。

实时数据源方面，feed handler 维护一张按工具的精度映射表，随 `InstrumentDefMsg` 记录到达而填充。行情 handler 按以下顺序解析精度：

1. 该 Databento 记录 `instrument_id` 已见过的 `InstrumentDefMsg` 中的精度。
2. 经代码映射消息与记录 `instrument_id` 匹配上的订阅精度。
3. 直接与 Nautilus 代码匹配的订阅精度。
4. USD 默认精度 2。

精度通过 `subscribe_quotes()` 或 `subscribe_trades()` 的 `price_precision` 参数提供，直接使用该实时客户端时用 `price_precisions`。其他订阅方法不读取该参数。第 2、3 步是同一覆盖项的两种匹配方式：代码映射后匹配记录 `instrument_id`，让父级、连续等非原始代码体系的订阅在定义元数据到达之前就能应用覆盖。

**工具定义必须先于行情到达**，否则非标准 tick size 的工具（如 tick 为 1/256 分数的国债期货）精度会出错。请在行情订阅之前或同时订阅工具定义（Databento `definition` 模式）。

历史请求与文件加载中，精度按记录依次解析：

1. 调用时显式传入的 `price_precision` 参数。
2. 由加载定义填充的按代码缓存（文件加载器的 `load_instruments`、历史客户端的 `get_range_instruments`），或显式调用 `set_price_precision(symbol, precision)`。

两个来源都提供不了精度时，数据客户端会获取所请求工具的定义。查找从请求开始日期的 UTC 午夜开始，以包含 Databento 的午夜定义快照。行情请求本身保持原时间范围。

解析不出精度时绝不回退到 USD 精度：历史客户端和加载器调用返回错误，数据客户端请求记录错误并返回空响应。

:::tip
策略启动时为每个工具调用 `subscribe_instrument()`，让定义消息填充实时精度映射。feed handler 为整个数据集会话保留每个代码的 `price_precision` 覆盖。在一路报价或成交订阅上设置的覆盖，同样覆盖该代码的订单簿 delta、深度、bar、statistics 和 imbalance。`InstrumentStatus` 不含价格，无需精度。
:::

### MBO（逐笔订单） {#mbo-market-by-order}

MBO 是 Databento 粒度最高的数据，代表完整订单簿深度。部分消息带成交数据。解码器产出 `OrderBookDelta`，并可能附带一个 `TradeTick`。实时客户端只在工具收到第一个 delta 之后才发出 `TradeTick`。

实时客户端把 MBO 消息缓存起来，直到某条记录带 `F_LAST` 标志结束整个撮合事件，再把一个 `OrderBookDeltas` 容器交给 handler。解码结果不含 delta 的记录（成交归属、状态动作或成交）也可以带 `F_LAST`，客户端按原始标志处理，与解码出的负载无关——否则半个事件会被搁置并与下一个事件错误合并。结束该事件的成交排在被刷出的容器之后。

快照记录（`F_SNAPSHOT`）累积进同一个缓冲，随第一个非快照事件边界刷出。因此快照以一个 `OrderBookDeltas` 容器到达 handler，而不是零散 delta。订阅带重放 `start` 锚点时，客户端把重放的旧数据挡在实时流之外，直到某个事件时间戳超过会话开始时间：重放的 delta 被扣住并随首个实时事件一起刷出，重放的成交直接丢弃。

### MBP-1（按价格档位，top-of-book） {#mbp-1-market-by-price-top-of-book}

MBP-1 表示 top-of-book 的报价与成交，部分消息带成交数据。解码器产出 `QuoteTick`，消息为成交时同时产出 `TradeTick`。

### TBBO 与 TCBBO（带成交的 top-of-book） {#tbbo-and-tcbbo-top-of-book-with-trades}

TBBO 和 TCBBO 每条消息同时提供报价与成交。两种模式每条消息发出一个 `TradeTick` 加一个 `QuoteTick`，比分别订阅报价和成交更高效。买价或卖价未定义时跳过报价。TCBBO 提供跨场所的合并数据。

#### 成交 ID 推导（CMBP-1 与 TCBBO） {#trade-id-derivation-cmbp-1-and-tcbbo}

CMBP-1 和 TCBBO 模式不发布原生成交标识。解码器用 FNV-1a 对工具 ID、`ts_event`、`ts_recv`、价格、数量和主动方做哈希，推导出确定性的 `TradeId`。同一场所事件在多次回放中得到相同成交 ID，下游去重因此不受影响。字段完全相同的两笔逻辑成交会相撞——这与场所有时无法区分它们的事实一致。

### OHLCV（bar 聚合） {#ohlcv-bar-aggregates}

Databento 给 bar 消息打的时间戳是区间的**开盘**时刻。默认情况下，解码器把 bar 的 `ts_event` 归一化为**收盘**：原 `ts_event` 加上区间长度。`ts_init` 使用实时接收时间；历史与文件加载未显式提供 init 时间戳时用收盘时间。设 `bars_timestamp_on_close=False` 让 bar 的 `ts_event` 取区间开盘时刻。

### Imbalance 与 statistics {#imbalance-and-statistics}

`imbalance` 和 `statistics` 模式没有内置的 Nautilus 对应类型。适配器在 Rust 中定义了 `DatabentoImbalance` 和 `DatabentoStatistics`，Python 绑定从 `nautilus_trader.adapters.databento` 暴露这两个类型。

实时记录用 `subscribe_data()` 订阅，`DataType` 名为 `DatabentoStatistics` 或 `DatabentoImbalance`，标识为工具 ID。历史请求与文件使用：

- `DatabentoDataLoader.load_imbalance` 和 `load_statistics` 读取 DBN 文件。
- `DatabentoHistoricalClient.get_range_imbalance` 和 `get_range_statistics` 读取历史区间。

`DatabentoLiveClient.subscribe` 用 `imbalance` 或 `statistics` 模式也能在节点之外流式获取。

下例为父级代码 `ES.FUT`（全部活跃 E-mini 标普 500 期货）请求一段有界区间的 `statistics`。两个 `get_range_*` 方法都是异步的。真正拉取历史前，先用 Databento Historical 的
[`metadata.get_cost`](https://databento.com/docs/api-reference-historical/metadata/metadata-get-cost)
端点估算：

```python
import os

from nautilus_trader.adapters.databento import DatabentoHistoricalClient
from nautilus_trader.core import dt_to_unix_nanos
from nautilus_trader.model import InstrumentId


client = DatabentoHistoricalClient(
    key=os.environ["DATABENTO_API_KEY"],
    publishers_filepath="publishers.json",
    use_exchange_as_venue=False,
)

statistics = await client.get_range_statistics(
    dataset="GLBX.MDP3",
    instrument_ids=[InstrumentId.from_str("ES.FUT.GLBX")],
    start=dt_to_unix_nanos("2024-03-06T00:00:00Z"),
    end=dt_to_unix_nanos("2024-03-07T00:00:00Z"),
    price_precision=2,
)
```

全新的历史客户端没有缓存精度，因此请求必须带 `price_precision`，或先对同一区间调用 `get_range_instruments`，否则第一条解码记录就会中止请求。`ES.FUT` 这类父级代码无法用 `set_price_precision` 预置，因为记录解析到父级背后的具体合约代码。

### Imbalance 与 statistics 的 Arrow 编码 {#arrow-encoding-for-imbalance-and-statistics}

两个类型都实现了 Arrow 记录批次编解码。Rust 中由 `nautilus_databento::arrow` 模块在 `arrow` feature 标志后提供：

```rust
use nautilus_databento::arrow::imbalance::{
    decode_imbalance_batch,
    imbalance_to_arrow_record_batch,
};

let batch = imbalance_to_arrow_record_batch(&imbalances)?;

let metadata = batch.schema().metadata().clone();
let decoded = decode_imbalance_batch(&metadata, &batch)?;
```

`statistics` 模块模式相同，函数为 `decode_statistics_batch` 和 `statistics_to_arrow_record_batch`。从 Python 调用 `get_databento_arrow_schema_map(DatabentoImbalance)` 可查看任一类型的 Arrow 字段映射。

:::info
两个类型都没有注册进 `ParquetDataCatalog` 的自定义数据编码器，因此 `write_custom_data` 和 `query_custom_data` 会报未注册类型错误。两者都不能经 `BacktestNode` 或 `BacktestEngine` 流式加载。要用 imbalance 或 statistics 数据做研究，请加载或请求记录后直接处理。
:::

## 性能考量 {#performance-considerations}

用 DBN 数据回测有两种做法：

- 数据以 DBN（`.dbn.zst`）文件存放，每次运行解码为 Nautilus 对象。
- 把 DBN 文件一次性转换为 Nautilus 对象写入数据目录（Nautilus Parquet 格式）。

DBN 解码器是经优化的 Rust，但写入目录一次、之后反复读取的回测性能最好。

[DataFusion](https://arrow.apache.org/datafusion/) 以高吞吐从磁盘流式读取 Nautilus Parquet 数据，至少比每次运行解码 DBN 快一个数量级。

:::note
本适配器实测的解码与客户端吞吐量记录在
[`crates/adapters/databento/benches/BENCHMARKS.md`](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/databento/benches/BENCHMARKS.md)，附复现命令。绝对数值随机而异，只有同机对比有意义。
:::

实时数据方面，从 feed handler 到 Nautilus 的解码投递有意不设上限，避免慢消费者拖住数据通路。内存吃紧的进程应当失败退出，而不是阻塞实时解码。

## 加载 DBN 数据 {#loading-dbn-data}

`DatabentoDataLoader` 把 DBN 文件直接解码为 Nautilus 对象，为每种输出类型提供对应方法，包括 `load_instruments`、`load_order_book_deltas`、`load_order_book_depth`、`load_quotes`、`load_trades`、`load_bars`、`load_status`、`load_imbalance` 和 `load_statistics`。

发布方元数据文件不在可执行文件旁边时，把路径传入：

```python
from nautilus_trader.adapters.databento import DatabentoDataLoader
from nautilus_trader.model import InstrumentId


loader = DatabentoDataLoader(publishers_filepath="publishers.json")

instruments = loader.load_instruments(
    filepath="equity-definitions.dbn.zst",
    use_exchange_as_venue=True,
)
trades = loader.load_trades(
    filepath="aapl-trades.dbn.zst",
    instrument_id=InstrumentId.from_str("AAPL.XNAS"),
)
```

写入 `ParquetDataCatalog` 时先写定义数据再写行情数据——目录必须先有工具，才能写该工具的记录：

```python
from nautilus_trader.persistence import ParquetDataCatalog


catalog = ParquetDataCatalog(base_path="catalog")
catalog.write_instruments(instruments)
catalog.write_trade_ticks(trades)
```

文件的模式不是该输出类型的默认模式时，用模式专属方法：

- `load_bbo_quotes` 读取 BBO 间隔报价。
- `load_cmbp_quotes` 读取 CMBP-1 报价。
- `load_cbbo_quotes` 读取 CBBO 报价。
- `load_tbbo_trades` 读取 TBBO 成交。
- `load_tcbbo_trades` 读取 TCBBO 成交。

选择加载方法时，可用 `schema_for_file` 从文件的 DBN 元数据头读取模式。

已知符号或精度时，可选参数 `instrument_id` 和 `price_precision` 可跳过代码体系或精度查找。bar 加载器还接受 `timestamp_on_close`。

## 实时客户端架构 {#real-time-client-architecture}

`DatabentoDataClient` 包装其余 Databento 适配器类。它在该数据集的首个订阅时创建该数据集的唯一实时 feed handler，该数据集的所有模式共享这个 handler。handler 运行一个异步任务，让网关的下一条记录与引擎的下一条命令赛跑。因此后续订阅无需重连即可进入运行中的会话。

数据客户端的全部历史请求（包括为预置价格精度而获取的工具定义）共用一个 `DatabentoHistoricalClient`。

:::warning
实时会话开始之后再发送重放 `start` 锚点，Databento 会将其丢弃，因此会话中途的订阅只能从当下开始流式，没有历史。feed handler 对迟到的 `start` 记录错误，并从存储的订阅中剥掉 `start`，确保重连时不会二次重放历史。
:::

## 配置 {#configuration}

从适配器的公共 Python 模块创建 `DatabentoDataClientConfig`。API 密钥和 `publishers.json` 路径必填：

```python
import os
from pathlib import Path

from nautilus_trader.adapters.databento import DatabentoDataClientConfig


config = DatabentoDataClientConfig(
    api_key=os.environ["DATABENTO_API_KEY"],
    publishers_filepath=Path("publishers.json"),
    use_exchange_as_venue=False,
)
```

下载规范
[`publishers.json`](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/databento/publishers.json)
并把 `publishers_filepath` 指向本地副本。

| 选项                      | 默认值   | 说明                                                    |
| ------------------------- | -------- | ------------------------------------------------------- |
| `api_key`                 | 必填     | Databento API 密钥。                                    |
| `publishers_filepath`     | 必填     | Databento 发布方元数据的本地路径。                      |
| `use_exchange_as_venue`   | `False`  | GLBX 工具使用交易所 MIC 场所。                          |
| `bars_timestamp_on_close` | `True`   | bar 用收盘时间戳而非区间开盘时刻。                      |
| `venue_dataset_map`       | `None`   | 覆盖发布方数据推导的场所到数据集映射。                  |
| `historical_base_url`     | `None`   | 覆盖 Historical API 基础 URL。                          |
| `live_gateway_addr`       | `None`   | 覆盖实时网关 socket 地址（`host:port`）。               |

`DatabentoDataClientConfig` 与 `DatabentoDataClientFactory` 配合使用。当前
[Python 示例](https://github.com/nautechsystems/nautilus_trader/blob/develop/examples/live/databento/data_tester.py)
展示了完整的 `LiveNode.builder(...)` 配置。

### 连接稳定性 {#connection-stability}

实时客户端在以下情况自动重连：

- **网络中断**：临时连接问题。
- **网关重启**：Databento 计划内的实时网关重启，见
  [维护时间表](https://databento.com/docs/api-reference-live/basics/maintenance-schedule)。
- **市场休市**：非交易时段结束的会话。

#### 重连策略 {#reconnection-strategy}

工厂创建的实时客户端使用内部 10 分钟重连窗口，指数退避从 1 秒起、上限 60 秒。Python 的 `DatabentoDataClientConfig` 构造函数不暴露重连超时。窗口内没有成功会话时，客户端放弃并报错，不会无限重试。

停滞的连接由上游 Databento 客户端检测：心跳间隔加 5 秒内没有数据即抛心跳超时。feed handler 将其视为连接错误，进入同一退避循环。

所有重连都包含：

- **抖动**：随机延迟（最多 1 秒），防止同时重连风暴。
- **自动重订阅**：重连后恢复全部活动订阅。
- **周期重置**：每次成功会话（超过 60 秒）重置超时时钟与退避延迟。
- **命令缓冲**：退避期间收到的命令应用到下一个会话。

单个退订请求会记录警告并被忽略，因为 Databento 实时会话不支持细粒度退订。要从实时网关移除订阅，请停止会话。

#### 计划维护 {#scheduled-maintenance}

Databento 按下表重启实时网关（所有客户端断连）：

| 数据集           | 重启时间          |
| ---------------- | ----------------- |
| CME Globex       | 周六 02:15 CT     |
| 全部 ICE 场所    | 周日 09:45 UTC    |
| 其他所有数据集   | 周日 10:30 UTC    |

内部 10 分钟超时足以覆盖常规重启。细节见
[Databento 维护时间表](https://databento.com/docs/api-reference-live/basics/maintenance-schedule)。

## 参与贡献 {#contributing}

:::info
参与贡献见
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
