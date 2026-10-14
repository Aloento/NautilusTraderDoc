# 数据

NautilusTrader 提供了一组内置的数据类型，用于表示交易领域中的常见数据结构。
这些数据类型包括：

- `OrderBookDelta`（L1/L2/L3）：表示最细粒度的订单簿更新。
- `OrderBookDeltas`（L1/L2/L3）：将多个 `OrderBookDelta` 批量打包以提高处理效率。
- `OrderBookDepth10`：聚合的订单簿快照（每侧最多 10 个档位）。
- `QuoteTick`：顶级盘口（top-of-book）的最优买卖价及其量。
- `TradeTick`：一次成交/匹配事件。
- `Bar`：OHLCV（开、高、低、收、量）K 线，按指定的聚合方法（aggregation method）生成。
- `MarkPriceUpdate`：合约的标记价格（通常用于衍生品交易）。
- `IndexPriceUpdate`：用于计算标记价的指数价格（underlying index price）。
- `FundingRateUpdate`：永续合约的资金费率（多空之间的周期性支付）。
- `InstrumentStatus`：品种级别的状态事件。
- `InstrumentClose`：品种的收盘价。

NautilusTrader 的设计以处理细粒度订单簿数据为主，这能在回测中提供最接近实盘的执行仿真。
当然，根据仿真的需求，也可以使用任何受支持的市场数据类型进行回测，灵活选择模拟精度。

## 订单簿（Order books）

系统内置了一个用 Rust 实现的高性能订单簿，用来根据输入数据维护订单簿状态。

`OrderBook` 实例按合约维护，既可用于回测也可用于实盘，支持以下类型的订单簿：

- `L3_MBO`：Market by order（MBO，L3），使用每一笔按订单 ID 编址的事件，保留每个价格级别的所有订单。
- `L2_MBP`：Market by price（MBP，L2），按价格级别聚合订单簿事件。
- `L1_MBP`：Market by price（MBP，L1），也称为 BBO（best bid and offer），只捕获顶层更新。

:::note
顶层数据（如 `QuoteTick`、`TradeTick` 和 `Bar`）也可用于回测，对于以 `L1_MBP` 为书籍类型的市场尤其常见。
:::

## 合约/品种（Instruments）

支持的合约类型包括：

- `Betting`：博彩市场中的合约。
- `BinaryOption`：二元期权合约。
- `Cfd`：差价合约（CFD）。
- `Commodity`：现货/现金市场的商品合约。
- `CryptoFuture`：可交割的加密货币期货合约（以加密资产为标的并以其结算）。
- `CryptoPerpetual`：加密永续合约（perpetual swap）。
- `CurrencyPair`：现货/现金市场的货币对合约。
- `Equity`：股票类合约。
- `FuturesContract`：可交割期货合约。
- `FuturesSpread`：期货价差合约。
- `Index`：指数类合约。
- `OptionContract`：期权合约。
- `OptionSpread`：期权价差合约。
- `Synthetic`：由若干组件合约按公式合成的合成品种（synthetic）。

## K 线与聚合（Bars and aggregation）

### K 线简介

_Bar_（有时称为 candle、candlestick 或 kline）是一种表示在特定时间段内价格和成交量信息的数据结构，通常包含：

- 开盘价
- 最高价
- 最低价
- 收盘价
- 成交量（或用 ticks 计数作为成交量的近似）

系统通过指定的聚合方法（aggregation method）将底层市场数据分组并生成 K 线。

### 聚合的目的

在 NautilusTrader 中进行数据聚合的原因包括：

- 为技术指标和策略开发提供数据。
- 许多策略对时间聚合数据（如分钟线）已足够，无需使用高频 L1/L2/L3 数据。
- 相比高频原始数据，聚合可以降低存储与处理成本。

### 聚合方法

平台实现了多种聚合方法：

| 名称               | 描述                                                    | 类别        |
| :----------------- | :------------------------------------------------------ | :---------- |
| `TICK`             | 按一定数量的 ticks 进行聚合。                           | Threshold   |
| `TICK_IMBALANCE`   | 按 ticks 的买/卖不平衡进行聚合。                        | Threshold   |
| `TICK_RUNS`        | 按连续的买/卖序列（runs）聚合 ticks。                   | Information |
| `VOLUME`           | 按交易量聚合。                                          | Threshold   |
| `VOLUME_IMBALANCE` | 按成交量的买/卖不平衡聚合。                             | Threshold   |
| `VOLUME_RUNS`      | 按成交量的连续买/卖序列聚合。                           | Information |
| `VALUE`            | 按成交面值（notional value，也称为“Dollar bars”）聚合。 | Threshold   |
| `VALUE_IMBALANCE`  | 按按面值计算的买/卖不平衡聚合。                         | Information |
| `VALUE_RUNS`       | 按按面值计算的连续买/卖序列聚合。                       | Threshold   |
| `RENKO`            | 基于固定价格变动（以 ticks 为砖块大小）的聚合。         | Threshold   |
| `MILLISECOND`      | 以毫秒为粒度的时间窗口聚合。                            | Time        |
| `SECOND`           | 以秒为粒度的时间窗口聚合。                              | Time        |
| `MINUTE`           | 以分钟为粒度的时间窗口聚合。                            | Time        |
| `HOUR`             | 以小时为粒度的时间窗口聚合。                            | Time        |
| `DAY`              | 以日为粒度的时间窗口聚合。                              | Time        |
| `WEEK`             | 以周为粒度的时间窗口聚合。                              | Time        |
| `MONTH`            | 以月为粒度的时间窗口聚合。                              | Time        |
| `YEAR`             | 以年为粒度的时间窗口聚合。                              | Time        |

:::note
以下聚合方法当前尚未实现：

- `VOLUME_IMBALANCE`
- `VOLUME_RUNS`
- `VALUE_IMBALANCE`
- `VALUE_RUNS`

:::

### 聚合类型

NautilusTrader 实现了三类主要的聚合方式：

1. **Trade-to-bar（成交到 K 线）**：由 `TradeTick`（成交数据）生成 K 线。

   - 适用场景：分析成交价格或直接以成交数据为输入的策略。
   - 在 Bar 规范中始终使用 `LAST` 作为 price_type。

2. **Quote-to-bar（盘口到 K 线）**：由 `QuoteTick`（买/卖档）生成 K 线。

   - 适用场景：关注买卖价差或市场深度的策略。
   - 在 Bar 规范中使用 `BID`、`ASK` 或 `MID` 作为 price_type。

3. **Bar-to-bar（K 线到 K 线）**：由较小周期的 `Bar` 生成更大周期的 `Bar`。
   - 适用场景：对已有的小周期 K 线（例如 1 分钟）做重采样得到 5 分钟或小时线等。
   - 这种方式在规范中需要使用 `@` 符号来标注来源。

### Bar 类型

`BarType`（Bar 类型）由以下几个要素组成：

- **Instrument ID**（`InstrumentId`）：指定该 Bar 所属的合约。
- **Bar Specification**（`BarSpecification`）：
  - `step`：定义 Bar 的时间间隔或频率。
  - `aggregation`：指定使用的聚合方法（参见上表）。
  - `price_type`：指定 Bar 的价格基准（如 bid、ask、mid、last）。
- **Aggregation Source**（`AggregationSource`）：标明 Bar 是在本地（INTERNAL）还是由外部（EXTERNAL）聚合得到的。

BarType 还可以分为 _standard_（标准）或 _composite_（复合）：

- **标准（Standard）**：由原始市场数据（quote-ticks、trade-ticks）直接生成。
- **复合（Composite）**：由更高粒度的 Bar 通过子抽样（subsampling）得到（例如 5 分钟 Bar 从 1 分钟 Bar 聚合而来）。

### 聚合来源（Aggregation sources）

聚合来源可为：

- `INTERNAL`：在本地 Nautilus 系统内完成聚合。
- `EXTERNAL`：由场外或数据提供方在系统外完成聚合。

对于 bar-to-bar（K 线到 K 线）聚合，目标 BarType 总是 `INTERNAL`（因为聚合在 Nautilus 内部完成），但来源 Bar 可以是 `INTERNAL` 或 `EXTERNAL`。

### 使用字符串语法定义 BarType

#### 标准 Bar

可用如下格式从字符串定义标准 BarType：

`{instrument_id}-{step}-{aggregation}-{price_type}-{INTERNAL | EXTERNAL}`

例如：在 Nasdaq（XNAS）上为 AAPL 定义一个 5 分钟、基于成交价（LAST）且在本地聚合的 BarType：

```python
bar_type = BarType.from_str("AAPL.XNAS-5-MINUTE-LAST-INTERNAL")
```

#### 复合 Bar

复合 Bar 的定义格式为：

`{instrument_id}-{step}-{aggregation}-{price_type}-INTERNAL@{step}-{aggregation}-{INTERNAL | EXTERNAL}`

注意事项：

- 派生（derived）的 BarType 必须使用 `INTERNAL` 作为聚合来源（因为聚合在本地完成）。
- 被采样的 BarType 必须具有比派生 Bar 更高的粒度。
- 被采样的 instrument_id 会被推断为与派生 BarType 相同。
- 复合 Bar 可从 `INTERNAL` 或 `EXTERNAL` 的来源进行聚合。

例如：从外部提供的 1 分钟 Bar 聚合为在本地生成的 AAPL 5 分钟成交价 Bar：

```python
bar_type = BarType.from_str("AAPL.XNAS-5-MINUTE-LAST-INTERNAL@1-MINUTE-EXTERNAL")
```

### 聚合语法示例

`BarType` 字符串格式同时编码目标 BarType 和可选的来源数据类型：

```txt
{instrument_id}-{step}-{aggregation}-{price_type}-{source}@{step}-{aggregation}-{source}
```

`@` 之后的部分是可选的，仅用于 bar-to-bar 聚合：

- **无 `@`**：当 price_type 为 `LAST` 时从 `TradeTick` 聚合；当 price_type 为 `BID`/`ASK`/`MID` 时从 `QuoteTick` 聚合。
- **有 `@`**：从已有的 `Bar` 对象聚合（指定来源 BarType）。

#### Trade-to-bar 示例

```python
def on_start(self) -> None:
    # 定义一个从 TradeTick 聚合的 BarType
    # 使用 price_type=LAST 表示以 TradeTick 为数据源
    bar_type = BarType.from_str("6EH4.XCME-50-VOLUME-LAST-INTERNAL")

    # 请求历史数据（将在 on_historical_data 回调收到 bars）
    self.request_bars(bar_type)

    # 订阅实时数据（将在 on_bar 回调收到 bars）
    self.subscribe_bars(bar_type)
```

#### Quote-to-bar 示例

```python
def on_start(self) -> None:
    # 从 ASK 价生成 1 分钟 Bar
    bar_type_ask = BarType.from_str("6EH4.XCME-1-MINUTE-ASK-INTERNAL")

    # 从 BID 价生成 1 分钟 Bar
    bar_type_bid = BarType.from_str("6EH4.XCME-1-MINUTE-BID-INTERNAL")

    # 从 MID 价生成 1 分钟 Bar（MID 为 BID 与 ASK 的中间价）
    bar_type_mid = BarType.from_str("6EH4.XCME-1-MINUTE-MID-INTERNAL")

    # 请求历史并订阅实时
    self.request_bars(bar_type_ask)    # 历史数据在 on_historical_data 中处理
    self.subscribe_bars(bar_type_ask)  # 实时数据在 on_bar 中处理
```

#### Bar-to-bar 示例

```python
def on_start(self) -> None:
    # 从 1 分钟 Bar 生成 5 分钟 Bar（格式：target_bar_type@source_bar_type）
    # 注意：左侧目标的 price_type（如 LAST）需要指定，来源侧无需 price_type
    bar_type = BarType.from_str("6EH4.XCME-5-MINUTE-LAST-INTERNAL@1-MINUTE-EXTERNAL")

    # 请求历史数据（将在 on_historical_data(...) 处理）
    self.request_bars(bar_type)

    # 订阅实时更新（将在 on_bar(...) 处理）
    self.subscribe_bars(bar_type)
```

#### 高级 Bar-to-bar 示例

可以构建多级的聚合链条，例如：先从 TradeTick 生成 1 分钟 Bar，再从 1 分钟 Bar 生成 5 分钟 Bar，如下：

```python
# 先从 TradeTick 生成 1 分钟 Bar（LAST 表示 TradeTick 来源）
primary_bar_type = BarType.from_str("6EH4.XCME-1-MINUTE-LAST-INTERNAL")

# 再从 1 分钟 Bar 生成 5 分钟 Bar
# 注意 @1-MINUTE-INTERNAL 指明了来源 Bar
intermediate_bar_type = BarType.from_str("6EH4.XCME-5-MINUTE-LAST-INTERNAL@1-MINUTE-INTERNAL")

# 最后从 5 分钟 Bar 生成小时线
# 注意 @5-MINUTE-INTERNAL 指明了来源 Bar
hourly_bar_type = BarType.from_str("6EH4.XCME-1-HOUR-LAST-INTERNAL@5-MINUTE-INTERNAL")
```

### 使用 Bars：request 与 subscribe 的区别

NautilusTrader 提供两种与 Bar 交互的操作：

- **`request_bars()`**：请求历史数据，由 `on_historical_data()` 回调处理。
- **`subscribe_bars()`**：订阅实时数据流，由 `on_bar()` 回调处理。

典型流程为：

1. 先用 `request_bars()` 加载历史数据以初始化指标或策略状态。
2. 再用 `subscribe_bars()` 保证策略在实时形成新 Bar 时能持续接收更新。

示例（在 `on_start()` 中）：

```python
def on_start(self) -> None:
    # 定义 BarType
    bar_type = BarType.from_str("6EH4.XCME-5-MINUTE-LAST-INTERNAL")

    # 请求历史数据用于初始化指标
    # 这些 Bar 会在策略的 on_historical_data(...) 回调中收到
    self.request_bars(bar_type)

    # 订阅实时更新
    # 新生成的 Bar 会在策略的 on_bar(...) 回调中收到
    self.subscribe_bars(bar_type)

    # 注册指标以接收 Bar 更新（指标会自动用历史数据和后续实时数据进行更新）
    self.register_indicator_for_bars(bar_type, self.my_indicator)
```

策略需要实现的回调以接收数据：

```python
def on_historical_data(self, data):
    # 处理由 request_bars() 返回的历史 Bar 批量
    # 注意：通过 register_indicator_for_bars 注册的指标会自动被历史数据更新
    pass

def on_bar(self, bar):
    # 处理 subscribe_bars() 推送的实时单条 Bar
    # 相关指标会在此回调之前完成更新
    pass
```

### 带聚合的历史数据请求

在请求用于回测或初始化指标的历史 Bar 时，`request_bars()` 支持直接请求或基于更低级别数据的聚合请求：

```python
# 请求原始的 1 分钟 Bar（从 TradeTick 聚合，price_type=LAST）
self.request_bars(BarType.from_str("6EH4.XCME-1-MINUTE-LAST-EXTERNAL"))

# 请求从 1 分钟 Bar 聚合得到的 5 分钟 Bar
self.request_bars(BarType.from_str("6EH4.XCME-5-MINUTE-LAST-INTERNAL@1-MINUTE-EXTERNAL"))
```

如果需要专门请求已聚合的历史 Bar，可使用 `request_aggregated_bars()`：

```python
# 请求从历史成交 ticks 聚合得到的 Bar
self.request_aggregated_bars([BarType.from_str("6EH4.XCME-100-VOLUME-LAST-INTERNAL")])

# 请求从其他 Bar 聚合得到的 Bar
self.request_aggregated_bars([BarType.from_str("6EH4.XCME-5-MINUTE-LAST-INTERNAL@1-MINUTE-EXTERNAL")])
```

### 常见陷阱

**在请求历史数据前先注册指标**：确保在请求历史数据前完成指标注册，否则指标不会用历史数据进行初始化。

```python
# 正确顺序
self.register_indicator_for_bars(bar_type, self.ema)
self.request_bars(bar_type)

# 错误顺序
self.request_bars(bar_type)  # 指标不会收到历史数据
self.register_indicator_for_bars(bar_type, self.ema)
```

## 时间戳（Timestamps）

平台使用两个核心时间戳字段，出现在众多对象（市场数据、订单和事件）中：
这些字段用途不同，有助于在系统中保持精确的时间语义：

- `ts_event`：UNIX 时间戳（纳秒），表示事件在外部真实发生的时间。
- `ts_init`：UNIX 时间戳（纳秒），表示 Nautilus 在内部创建表示该事件对象的时间。

### 示例

| **事件类型**     | **`ts_event`**                    | **`ts_init`**                                                                         |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| `TradeTick`      | 交易在交易所实际发生的时间。      | Nautilus 接收到该成交数据的时间。                                                     |
| `QuoteTick`      | 报价在交易所发生的时间。          | Nautilus 接收到该报价数据的时间。                                                     |
| `OrderBookDelta` | 订单簿更新在交易所发生的时间。    | Nautilus 接收到订单簿更新的时间。                                                     |
| `Bar`            | Bar 的收盘时间（精确到分/小时）。 | Nautilus 在本地生成（针对 INTERNAL 条件）或接收到该 Bar（针对 EXTERNAL 条件）的时间。 |
| `OrderFilled`    | 订单在交易所被成交的时间。        | Nautilus 接收到并处理成交回执的时间。                                                 |
| `OrderCanceled`  | 取消在交易所被处理的时间。        | Nautilus 接收到并处理取消确认的时间。                                                 |
| `NewsEvent`      | 新闻发布的时间。                  | 如果是内部事件则为对象创建时间；如果是外部事件则为接收时间。                          |
| 自定义事件       | 事件条件实际发生的时间。          | 如果是内部事件则为对象创建时间；如果是外部事件则为接收时间。                          |

:::note
`ts_init` 的概念比简单的“接收时间”更广泛。
它表示某个对象（数据点或命令）在 Nautilus 内部被初始化的时间。
因此 `ts_init` 并不限于“接收到的外部事件”，也适用于所有内部初始化的场景。

例如，命令（command）也会使用 `ts_init` 字段，此时“接收”概念并不适用。
这一更广泛的定义可确保不同对象类型在时间戳处理上的一致性。
:::

### 延迟分析（Latency analysis）

采用双时间戳机制后可以方便在平台内进行延迟分析：

- 延迟可按 `ts_init - ts_event` 计算。
- 该差值代表了系统端到端的延迟，包括网络传输、处理开销和排队时间等。
- 注意：生成这些时间戳的时钟可能并未同步，因此直接比较时需谨慎。

### 不同环境下的行为

#### 回测环境

- 数据按 `ts_init` 进行稳定排序（stable sort）。
- 这样可以确保确定性的处理顺序，并在回测中模拟合理的系统延迟行为。

#### 实盘环境

- 系统按数据到达顺序处理，以最小化端到端延迟并支持实时决策。
  - `ts_init` 记录数据被 Nautilus 实时接收的精确时刻。
  - `ts_event` 反映外部事件发生的时间，便于对比外部事件时间与系统接收时间。
- 我们可以用 `ts_init - ts_event` 的差值来检测网络或处理的延迟问题。

### 其他注意事项

- 对于来自外部的数据，`ts_init` 总是等于或晚于 `ts_event`。
- 对于 Nautilus 内部创建的数据，`ts_init` 与 `ts_event` 可能相同，因为对象是在事件发生时立即初始化的。
- 并非所有带有 `ts_init` 字段的类型都必须包含 `ts_event` 字段：
  - 例如对象初始化时间与事件发生时间相同，或根本不存在外部事件时间的概念。

#### 持久化数据

`ts_init` 字段也用来指示消息最初被接收的时间。

## 数据流（Data flow）

平台通过相同的数据通路在所有运行环境（参见 [environment contexts](/concepts/architecture.md#environment-contexts)）中保证一致性（例如 `backtest`、`sandbox`、`live`）。
数据主要通过 `MessageBus` 流向 `DataEngine`，然后分发到已订阅或注册的处理器。

对于需要更多灵活性的用户，平台也支持自定义数据类型的创建。关于如何实现用户自定义数据类型，请参见下文的 [Custom Data](#custom-data) 部分。

## 数据加载（Loading data）

NautilusTrader 支持三类主要的用例下的数据加载和格式转换：

- 为 `BacktestEngine` 提供回测所需的数据。
- 使用 `ParquetDataCatalog.write_data(...)` 将数据以 Nautilus 特定的 Parquet 格式持久化，供 `BacktestNode` 后续使用。
- 用于研究用途，确保研究与回测间的数据一致性。

无论目标为何，流程都是将不同的外部数据格式转换为 Nautilus 所使用的数据结构。

为此通常需要两个组件：

- 一类 DataLoader（通常针对原始来源/格式实现），该组件读取数据并返回符合目标 Nautilus 对象 schema 的 `pd.DataFrame`。
- 一类 DataWrangler（针对具体数据类型实现），它将 `pd.DataFrame` 转换为 Nautilus 对象构成的 `list[Data]`。

### Data loaders

DataLoader 通常针对具体的原始来源/格式实现。例如，Binance 的订单簿原始 CSV 文件与 [Databento Binary Encoding (DBN)](https://databento.com/docs/knowledge-base/new-users/dbn-encoding/getting-started-with-dbn) 的文件格式完全不同，需要不同的 loader。

### Data wranglers

DataWrangler 按 Nautilus 的数据类型实现，可在 `nautilus_trader.persistence.wranglers` 模块中找到。目前包含：

- `OrderBookDeltaDataWrangler`
- `OrderBookDepth10DataWrangler`
- `QuoteTickDataWrangler`
- `TradeTickDataWrangler`
- `BarDataWrangler`

:::warning
存在一些 **DataWrangler v2** 组件，它们接收通常具有不同定宽 Nautilus Arrow v2 schema 的 `pd.DataFrame`，并输出基于 PyO3 的 Nautilus 对象，
这些对象只兼容正在开发中的新版 Nautilus core。

**这些 PyO3 提供的数据对象与当前仍在使用的旧版 Cython 对象不兼容（例如不能直接添加到现有的 `BacktestEngine`）。**
:::

### 转换管线（Transformation pipeline）

流程概览：

1. 原始数据（例如 CSV）作为输入进入管线。
2. DataLoader 处理原始数据并将其转换为 `pd.DataFrame`。
3. DataWrangler 进一步处理 `pd.DataFrame`，输出 Nautilus 对象的列表。
4. Nautilus 的 `list[Data]` 即为数据加载流程的最终输出。

下图示意了原始数据如何被转换为 Nautilus 数据结构：

```graph
  ┌──────────┐    ┌──────────────────────┐                  ┌──────────────────────┐
  │          │    │                      │                  │                      │
  │          │    │                      │                  │                      │
  │ Raw data │    │                      │  `pd.DataFrame`  │                      │
  │ (CSV)    ├───►│      DataLoader      ├─────────────────►│     DataWrangler     ├───► Nautilus `list[Data]`
  │          │    │                      │                  │                      │
  │          │    │                      │                  │                      │
  │          │    │                      │                  │                      │
  └──────────┘    └──────────────────────┘                  └──────────────────────┘

```

具体例子：

- `BinanceOrderBookDeltaDataLoader.load(...)` 读取磁盘上的 Binance CSV 文件并返回 `pd.DataFrame`。
- `OrderBookDeltaDataWrangler.process(...)` 接收该 `pd.DataFrame` 并返回 `list[OrderBookDelta]`。

下面的示例展示了如何在 Python 中完成上述操作：

```python
from nautilus_trader import TEST_DATA_DIR
from nautilus_trader.adapters.binance.loaders import BinanceOrderBookDeltaDataLoader
from nautilus_trader.persistence.wranglers import OrderBookDeltaDataWrangler
from nautilus_trader.test_kit.providers import TestInstrumentProvider


# 加载原始数据
data_path = TEST_DATA_DIR / "binance" / "btcusdt-depth-snap.csv"
df = BinanceOrderBookDeltaDataLoader.load(data_path)

# 设置一个 wrangler
instrument = TestInstrumentProvider.btcusdt_binance()
wrangler = OrderBookDeltaDataWrangler(instrument)

# 处理并得到 Nautilus 的 `OrderBookDelta` 对象列表
deltas = wrangler.process(df)
```

## 数据目录（Data catalog）

数据目录是 Nautilus 数据的集中存储，使用 [Parquet](https://parquet.apache.org) 格式持久化。它是回测和实盘场景下的主要数据管理系统，提供高效的存储、检索和流式能力。

### 概览与架构

NautilusTrader 的数据目录采用双后端架构，兼顾 Rust 的性能和 Python 的灵活性：

**核心组件：**

- **ParquetDataCatalog**：主要的 Python 接口，用于数据操作。
- **Rust backend**：针对核心数据类型（OrderBookDelta、QuoteTick、TradeTick、Bar、MarkPriceUpdate）的高性能查询引擎。
- **PyArrow backend**：用于自定义数据类型和复杂过滤的灵活后备实现。
- **fsspec 集成**：支持本地和云存储（S3、GCS、Azure 等）。

**主要优势：**

- **性能**：Rust 后端为核心市场数据类型提供优化查询性能。
- **灵活性**：PyArrow 后端适配自定义数据类型及复杂过滤场景。
- **可扩展性**：高效的压缩和列式存储降低存储成本并提升 I/O 性能。
- **云原生**：通过 fsspec 内置对云存储的支持。
- **无外部依赖**：自包含的方案，无需额外数据库或服务。

**存储格式优势：**

- 相较于 CSV/JSON/HDF5，Parquet 在压缩率和读取性能上更优。
- 列式存储便于高效过滤与聚合。
- 支持 schema 演化，便于数据模型升级。
- 跨语言兼容（Python、Rust、Java、C++ 等）。

用于 Parquet 的 Arrow schema 主要统一来源于 core 的 `persistence` Rust crate，部分遗留 schema 存在于 `/serialization/arrow/schema.py` 模块中。

:::note
当前计划是逐步淘汰 Python 端的 schema 模块，把 schema 单一来源迁移到 Rust core，以提高一致性和性能。
:::

### 初始化

数据目录可以通过 `NAUTILUS_PATH` 环境变量初始化，或显式传入路径对象进行创建。

:::note NAUTILUS_PATH environment variable
`NAUTILUS_PATH` 应当指向包含 Nautilus 数据的根目录，目录下会自动追加 `/catalog` 作为数据目录。

例如：

- 若 `NAUTILUS_PATH=/home/user/trading_data`。
- 则目录位于 `/home/user/trading_data/catalog`。

使用 `ParquetDataCatalog.from_env()` 时请确保 `NAUTILUS_PATH` 指向父目录而非 catalog 目录本身。
:::

下面示例展示了如何在已有数据的路径上初始化数据目录：

```python
from pathlib import Path
from nautilus_trader.persistence.catalog import ParquetDataCatalog


CATALOG_PATH = Path.cwd() / "catalog"

# 创建一个新的 catalog 实例
catalog = ParquetDataCatalog(CATALOG_PATH)

# 或者：基于环境变量初始化
catalog = ParquetDataCatalog.from_env()  # 使用 NAUTILUS_PATH 环境变量
```

### 文件系统协议与存储选项

目录通过 fsspec 支持多种文件系统协议，便于在本地与云之间无缝切换。

#### 支持的文件系统协议

**本地文件系统（`file`）：**

```python
catalog = ParquetDataCatalog(
    path="/path/to/catalog",
    fs_protocol="file",  # 默认协议
)
```

**Amazon S3（`s3`）：**

```python
catalog = ParquetDataCatalog(
    path="s3://my-bucket/nautilus-data/",
    fs_protocol="s3",
    fs_storage_options={
        "key": "your-access-key-id",
        "secret": "your-secret-access-key",
        "region": "us-east-1",
        "endpoint_url": "https://s3.amazonaws.com",  # 可选自定义 endpoint
    }
)
```

**Google Cloud Storage（`gcs`）：**

```python
catalog = ParquetDataCatalog(
    path="gcs://my-bucket/nautilus-data/",
    fs_protocol="gcs",
    fs_storage_options={
        "project": "my-project-id",
        "token": "/path/to/service-account.json",  # 或使用 "cloud" 以使用默认凭证
    }
)
```

**Azure Blob Storage（`abfs`）：**

```python
catalog = ParquetDataCatalog(
    path="abfs://container@account.dfs.core.windows.net/nautilus-data/",
    fs_protocol="abfs",
    fs_storage_options={
        "account_name": "your-storage-account",
        "account_key": "your-account-key",
        # 或使用 SAS token： "sas_token": "your-sas-token"
    }
)
```

#### 基于 URI 的初始化

为方便起见，可使用 URI 字符串自动解析协议和存储选项：

```python
# 本地文件系统
catalog = ParquetDataCatalog.from_uri("/path/to/catalog")

# S3 存储
catalog = ParquetDataCatalog.from_uri("s3://my-bucket/nautilus-data/")

# 带存储选项的示例
catalog = ParquetDataCatalog.from_uri(
    "s3://my-bucket/nautilus-data/",
    storage_options={
        "region": "us-east-1",
        "access_key_id": "your-key",
        "secret_access_key": "your-secret"
    }
)
```

### 写入数据

使用 `write_data()` 方法将数据写入 catalog。所有 Nautilus 内置的 `Data` 对象以及继承自 `Data` 的对象均受支持。

```python
# 写入一个数据对象列表
catalog.write_data(quote_ticks)

# 指定时间戳范围写入
catalog.write_data(
    trade_ticks,
    start=1704067200000000000,  # 可选的起始时间覆盖（UNIX 纳秒）
    end=1704153600000000000,    # 可选的结束时间覆盖（UNIX 纳秒）
)

# 在覆盖/重叠数据时跳过 disjoint 检查
catalog.write_data(bars, skip_disjoint_check=True)
```

### 文件命名与数据组织

catalog 会根据写入数据的时间范围自动生成文件名，采用 `{start_timestamp}_{end_timestamp}.parquet` 的命名规则，时间戳使用 ISO 格式。

数据按数据类型和 instrument id 分目录存放：

```tree
catalog/
├── data/
│   ├── quote_ticks/
│   │   └── eurusd.sim/
│   │       └── 20240101T000000000000000_20240101T235959999999999.parquet
│   └── trade_ticks/
│       └── btcusd.binance/
│           └── 20240101T000000000000000_20240101T235959999999999.parquet
```

**Rust backend 支持的数据类型（性能增强）：**

下列数据类型在 Rust 端有优化实现：

- `OrderBookDelta`。
- `OrderBookDeltas`。
- `OrderBookDepth10`。
- `QuoteTick`。
- `TradeTick`。
- `Bar`。
- `MarkPriceUpdate`。

:::warning
默认情况下，重叠数据会触发断言错误以保证数据完整性。如需绕过此检查，可在 `write_data()` 中使用 `skip_disjoint_check=True`。
:::

### 读取数据

通过 `query()` 方法从 catalog 中读取数据：

```python
from nautilus_trader.model import QuoteTick, TradeTick

# 查询某合约在时间区间内的 quote ticks
quotes = catalog.query(
    data_cls=QuoteTick,
    identifiers=["EUR/USD.SIM"],
    start="2024-01-01T00:00:00Z",
    end="2024-01-02T00:00:00Z"
)

# 带过滤条件的 trade ticks 查询
trades = catalog.query(
    data_cls=TradeTick,
    identifiers=["BTC/USD.BINANCE"],
    start="2024-01-01",
    end="2024-01-02",
    where="price > 50000"
)
```

### `BacktestDataConfig` —— 回测的数据规范

`BacktestDataConfig` 类是回测启动前指定数据需求的主要方式。它定义了回测执行期间应从 catalog 加载哪些数据，以及如何过滤与处理这些数据。

#### 核心参数

**必需参数：**

- `catalog_path`：数据目录的路径。
- `data_cls`：数据类型类（例如 QuoteTick、TradeTick、OrderBookDelta、Bar）。

**可选参数：**

- `catalog_fs_protocol`：文件系统协议（'file'、's3'、'gcs' 等）。
- `catalog_fs_storage_options`：存储相关选项（凭证、区域等）。
- `instrument_id`：要加载的单个合约。
- `instrument_ids`：合约列表（可替代单一的 instrument_id）。
- `start_time`：数据筛选起始时间（ISO 字符串或 UNIX 纳秒）。
- `end_time`：数据筛选结束时间（ISO 字符串或 UNIX 纳秒）。
- `filter_expr`：额外的 PyArrow 过滤表达式。
- `client_id`：自定义数据类型的客户端 ID。
- `metadata`：查询时附加的元数据。
- `bar_spec`：Bar 数据的规范（例如 "1-MINUTE-LAST"）。
- `bar_types`：BarType 列表（可替代 bar_spec）。

#### 基本使用示例

**加载 quote ticks：**

```python
from nautilus_trader.config import BacktestDataConfig
from nautilus_trader.model import QuoteTick, InstrumentId

data_config = BacktestDataConfig(
    catalog_path="/path/to/catalog",
    data_cls=QuoteTick,
    instrument_id=InstrumentId.from_str("EUR/USD.SIM"),
    start_time="2024-01-01T00:00:00Z",
    end_time="2024-01-02T00:00:00Z",
)
```

**加载多个合约：**

```python
data_config = BacktestDataConfig(
    catalog_path="/path/to/catalog",
    data_cls=TradeTick,
    instrument_ids=["BTC/USD.BINANCE", "ETH/USD.BINANCE"],
    start_time="2024-01-01T00:00:00Z",
    end_time="2024-01-02T00:00:00Z",
)
```

**加载 Bar 数据：**

```python
data_config = BacktestDataConfig(
    catalog_path="/path/to/catalog",
    data_cls=Bar,
    instrument_id=InstrumentId.from_str("AAPL.NASDAQ"),
    bar_spec="5-MINUTE-LAST",
    start_time="2024-01-01",
    end_time="2024-01-31",
)
```

#### 高级配置示例

**带自定义过滤的云存储示例：**

```python
data_config = BacktestDataConfig(
    catalog_path="s3://my-bucket/nautilus-data/",
    catalog_fs_protocol="s3",
    catalog_fs_storage_options={
        "key": "your-access-key",
        "secret": "your-secret-key",
        "region": "us-east-1"
    },
    data_cls=OrderBookDelta,
    instrument_id=InstrumentId.from_str("BTC/USD.COINBASE"),
    start_time="2024-01-01T09:30:00Z",
    end_time="2024-01-01T16:00:00Z",
    filter_expr="side == 'BUY'",  # Only buy-side deltas
)
```

**带 Client ID 的自定义数据示例：**

```python
data_config = BacktestDataConfig(
    catalog_path="/path/to/catalog",
    data_cls="my_package.data.NewsEventData",
    client_id="NewsClient",
    metadata={"source": "reuters", "category": "earnings"},
    start_time="2024-01-01",
    end_time="2024-01-31",
)
```

#### 与 BacktestRunConfig 的集成

`BacktestDataConfig` 对象通过 `BacktestRunConfig` 集成进回测框架：

```python
from nautilus_trader.config import BacktestRunConfig, BacktestVenueConfig

# 定义多个数据配置
data_configs = [
    BacktestDataConfig(
        catalog_path="/path/to/catalog",
        data_cls=QuoteTick,
        instrument_id="EUR/USD.SIM",
        start_time="2024-01-01",
        end_time="2024-01-02",
    ),
    BacktestDataConfig(
        catalog_path="/path/to/catalog",
        data_cls=TradeTick,
        instrument_id="EUR/USD.SIM",
        start_time="2024-01-01",
        end_time="2024-01-02",
    ),
]

# 创建回测运行配置
run_config = BacktestRunConfig(
    venues=[BacktestVenueConfig(name="SIM", oms_type="HEDGING")],
    data=data_configs,  # 数据配置列表
    start="2024-01-01T00:00:00Z",
    end="2024-01-02T00:00:00Z",
)
```

#### 数据加载流程

当回测运行时，`BacktestNode` 会依次处理每个 `BacktestDataConfig`：

1. Catalog 加载：根据配置创建 `ParquetDataCatalog` 实例。
2. 查询构建：从配置属性构建查询参数。
3. 数据检索：使用合适的后端执行 catalog 查询。
4. 合约/合约定义加载（Instrument Loading）：如需则加载标的定义。
5. 引擎集成：按正确顺序将数据加入回测引擎。

系统会自动处理：

- Instrument ID 的解析与验证（保留英文术语 Instrument ID）。
- 数据类型的验证与转换。
- 对大数据集的内存高效流式处理。
- 错误处理与日志记录。

### DataCatalogConfig —— 即时（on-the-fly）数据加载

`DataCatalogConfig` 类用于配置运行时的按需（on-the-fly）数据加载场景，特别适用于标的数量巨大且无法在回测前全部列举的情况。
与事先为回测指定数据的 `BacktestDataConfig` 不同，`DataCatalogConfig` 允许在运行时灵活访问 catalog。
以这种方式定义的 catalog 同样可以用于历史数据请求。

#### 核心参数

必填参数：

- `path`：数据 catalog 的目录路径。

可选参数：

- `fs_protocol`：文件系统协议（如 'file'、's3'、'gcs'、'azure' 等）。
- `fs_storage_options`：协议相关的存储选项。
- `name`：可选的 catalog 配置标识名。

#### 基本使用示例

**本地 catalog 配置：**

```python
from nautilus_trader.persistence.config import DataCatalogConfig

catalog_config = DataCatalogConfig(
    path="/path/to/catalog",
    fs_protocol="file",
    name="local_market_data"
)

# 转换为 catalog 实例
catalog = catalog_config.as_catalog()
```

**云存储配置示例：**

```python
catalog_config = DataCatalogConfig(
    path="s3://my-bucket/market-data/",
    fs_protocol="s3",
    fs_storage_options={
        "key": "your-access-key",
        "secret": "your-secret-key",
        "region": "us-west-2",
        "endpoint_url": "https://s3.us-west-2.amazonaws.com"
    },
    name="cloud_market_data"
)
```

#### 在实盘（live trading）中的集成

`DataCatalogConfig` 常用于实盘系统中以便访问历史数据：

```python
from nautilus_trader.config import TradingNodeConfig
from nautilus_trader.persistence.config import DataCatalogConfig

# 为实盘系统配置 catalog
catalog_config = DataCatalogConfig(
    path="/data/nautilus/catalog",
    fs_protocol="file",
    name="historical_data"
)

# 在交易节点配置中使用
node_config = TradingNodeConfig(
    # ... 其他配置
    catalog=catalog_config,  # 启用历史数据访问
)
```

#### 流式（streaming）配置

在实盘或回测期间将数据流式写入 catalog 时，可使用 `StreamingConfig`：

```python
from nautilus_trader.persistence.config import StreamingConfig, RotationMode
import pandas as pd

streaming_config = StreamingConfig(
    catalog_path="/path/to/streaming/catalog",
    fs_protocol="file",
    flush_interval_ms=1000,  # 每秒 flush
    replace_existing=False,
    rotation_mode=RotationMode.DAILY,
    rotation_interval=pd.Timedelta(hours=1),
    max_file_size=1024 * 1024 * 100,  # 最大 100MB
)
```

#### 常见用例

历史数据分析：

- 在实盘期间加载历史数据以供策略计算。
- 访问参考数据以进行标的查找（instrument lookup）。
- 检索历史表现指标。

动态数据加载：

- 根据运行时条件按需加载数据。
- 实现自定义的数据加载策略。
- 支持多个 catalog 源。

研发与研究：

- 在 Jupyter 笔记本中进行交互式数据探索。
- 即席分析与回测。
- 数据质量验证与监控。

### 查询系统与双后端（dual backend）架构

catalog 的查询系统采用双后端架构，会根据数据类型和查询参数自动选择最合适的查询引擎。

#### 后端选择逻辑

**Rust 后端（高性能）：**

- 支持类型（Supported Types）：OrderBookDelta、OrderBookDeltas、OrderBookDepth10、QuoteTick、TradeTick、Bar、MarkPriceUpdate。
- 使用条件：当 `files` 参数为 None（自动发现文件）时使用。
- 优点：性能与内存效率优化，原生 Arrow 集成。

**PyArrow 后端（灵活）：**

- 支持类型：包含自定义数据类在内的所有数据类型。
- 使用条件：用于自定义数据类型或当指定 `files` 参数时。
- 优点：高级过滤、自定义数据支持、复杂查询表达式。

#### 查询方法与参数

核心查询参数示例：

```python
catalog.query(
    data_cls=QuoteTick,                    # 要查询的数据类型
    identifiers=["EUR/USD.SIM"],         # 标的标识列表
    start="2024-01-01T00:00:00Z",        # 起始时间（支持多种格式）
    end="2024-01-02T00:00:00Z",          # 结束时间
    where="bid > 1.1000",               # PyArrow 过滤表达式
    files=None,                            # 指定文件会强制使用 PyArrow 后端
)
```

时间格式支持：

- ISO 8601 字符串：`"2024-01-01T00:00:00Z"`。
- UNIX 纳秒（UNIX nanoseconds）：`1704067200000000000`（或使用 ISO 字符串）。
- Pandas Timestamp：`pd.Timestamp("2024-01-01", tz="UTC")`。
- Python datetime 对象（建议使用带时区）。

高级过滤示例：

```python
# 复杂的 PyArrow 表达式
catalog.query(
    data_cls=TradeTick,
    identifiers=["BTC/USD.BINANCE"],
    where="price > 50000 AND size > 1.0",
    start="2024-01-01",
    end="2024-01-02",
)

# 多个标的并按 metadata 过滤
catalog.query(
    data_cls=Bar,
    identifiers=["AAPL.NASDAQ", "MSFT.NASDAQ"],
    where="volume > 1000000",
    metadata={"bar_type": "1-MINUTE-LAST"},
)
```

### Catalog 操作

catalog 提供若干维护和组织数据文件的操作函数，这些操作能优化存储、提升查询性能并保证数据完整性。

#### 重设文件名（Reset file names）

将 parquet 文件名重置为匹配实际内容的时间戳，确保基于文件名的过滤正常工作。

**重置 catalog 中的所有文件：**

```python
# 重置 catalog 中所有 parquet 文件的文件名
catalog.reset_all_file_names()
```

**重置特定数据类型的文件名：**

```python
# 重置所有 quote tick 文件名
catalog.reset_data_file_names(QuoteTick)

# 重置特定标的的 trade 文件名
catalog.reset_data_file_names(TradeTick, "BTC/USD.BINANCE")
```

#### 合并（Consolidate catalog）

将多个小的 parquet 文件合并成更大的文件，以提升查询性能并减少存储开销。

**合并整个 catalog：**

```python
# 合并 catalog 中的所有文件
catalog.consolidate_catalog()

# 在指定时间范围内合并文件
catalog.consolidate_catalog(
    start="2024-01-01T00:00:00Z",
    end="2024-01-02T00:00:00Z",
    ensure_contiguous_files=True
)
```

**合并特定数据类型：**

```python
# 合并所有 quote tick 文件
catalog.consolidate_data(QuoteTick)

# 合并特定标的的文件
catalog.consolidate_data(
    TradeTick,
    identifier="BTC/USD.BINANCE",
    start="2024-01-01",
    end="2024-01-31"
)
```

#### 按周期合并（Consolidate by period）

按固定时间周期拆分/合并数据文件，以实现标准化的文件组织。

**按周期合并整个 catalog：**

```python
import pandas as pd

# 将所有文件按天（1-day）合并
catalog.consolidate_catalog_by_period(
    period=pd.Timedelta(days=1)
)

# 在时间范围内按小时（1-hour）合并
catalog.consolidate_catalog_by_period(
    period=pd.Timedelta(hours=1),
    start="2024-01-01T00:00:00Z",
    end="2024-01-02T00:00:00Z"
)
```

**按周期合并特定数据：**

```python
# 将 quote 数据按 4 小时合并
catalog.consolidate_data_by_period(
    data_cls=QuoteTick,
    period=pd.Timedelta(hours=4)
)

# 将特定标的按 30 分钟合并
catalog.consolidate_data_by_period(
    data_cls=TradeTick,
    identifier="EUR/USD.SIM",
    period=pd.Timedelta(minutes=30),
    start="2024-01-01",
    end="2024-01-31"
)
```

#### 删除数据区间（Delete data range）

删除指定时间范围内的某类数据或某个标的的数据。此操作会永久删除数据，并会智能处理与之相交的文件。

**删除整个 catalog 的时间区间：**

```python
# 删除整个 catalog 中某一时间段的数据
catalog.delete_catalog_range(
    start="2024-01-01T00:00:00Z",
    end="2024-01-02T00:00:00Z"
)

# 删除从开始到指定时间点之前的所有数据
catalog.delete_catalog_range(end="2024-01-01T00:00:00Z")
```

**删除特定数据类型：**

```python
# 删除特定标的的所有 quote tick 数据
catalog.delete_data_range(
    data_cls=QuoteTick,
    identifier="BTC/USD.BINANCE"
)

# 删除某时间段内的 trade 数据
catalog.delete_data_range(
    data_cls=TradeTick,
    identifier="EUR/USD.SIM",
    start="2024-01-01T00:00:00Z",
    end="2024-01-31T23:59:59Z"
)
```

:::warning
删除操作会永久移除数据，且不可撤销。与删除区间部分重叠的文件会被拆分以保留区间外的数据。
:::

### Feather 流式与格式转换

catalog 支持在回测期间将数据流式写入临时的 feather 文件，随后再转换为高效查询的 parquet 格式。

**示例：期权 Greeks 的流式处理**

```python
from option_trader.greeks import GreeksData
from nautilus_trader.persistence.config import StreamingConfig

# 1. 为自定义数据配置流式写入
streaming = StreamingConfig(
    catalog_path=catalog.path,
    include_types=[GreeksData],
    flush_interval_ms=1000,
)

# 2. 启用流式写入后运行回测
engine_config = BacktestEngineConfig(streaming=streaming)
results = node.run()

# 3. 将流式数据转换为持久化的 catalog 数据
catalog.convert_stream_to_data(
    results[0].instance_id,
    GreeksData,
)

# 4. 查询已转换的数据
greeks_data = catalog.query(
    data_cls=GreeksData,
    start="2024-01-01",
    end="2024-01-31",
    where="delta > 0.5",
)
```

### Catalog 摘要

NautilusTrader 的数据 catalog 提供了全面的市场数据管理能力：

核心特性：

- 双后端（Dual Backend）：Rust 性能 + Python 的灵活性。
- 多协议支持（Multi-Protocol）：本地、S3、GCS、Azure 等存储。
- 流式处理（Streaming）：Feather → Parquet 的转换管道。
- 运维操作：重置文件名、合并数据、按周期组织文件等。

主要使用场景：

- 回测（Backtesting）：通过 `BacktestDataConfig` 预配置数据加载。
- 实盘（Live Trading）：通过 `DataCatalogConfig` 按需访问历史数据。
- 维护（Maintenance）：文件合并与组织操作。
- 研究（Research）：交互式查询与分析。

## 数据迁移（Data migrations）

NautilusTrader 定义了一个内部数据格式，位于 `nautilus_model` crate 中。
这些模型会序列化为 Arrow record batch，并写入 Parquet 文件。
使用 Nautilus 格式的 Parquet 文件能让 Nautilus 的回测达到最佳效率。

不过，在不同的精度模式（precision modes）或架构（schema）变更之间迁移数据模型可能具有一定挑战性。
本节介绍如何使用我们的工具来处理数据迁移。

### 迁移工具

`nautilus_persistence` crate 提供两个关键的实用工具：

#### `to_json`

将 Parquet 文件转换为 JSON，同时保留元数据：

- 会生成两个文件：

  - `<input>.json`：包含反序列化后的数据
  - `<input>.metadata.json`：包含 schema 元数据和 row group 配置

- 根据文件名自动检测数据类型：

  - `OrderBookDelta`（文件名包含 "deltas" 或 "order_book_delta"）
  - `QuoteTick`（文件名包含 "quotes" 或 "quote_tick"）
  - `TradeTick`（文件名包含 "trades" 或 "trade_tick"）
  - `Bar`（文件名包含 "bars"）

#### `to_parquet`

将 JSON 转换回 Parquet：

- 同时读取数据 JSON 与元数据 JSON 文件。
- 保留原始元数据中的 row group 大小配置。
- 使用 ZSTD 压缩。
- 生成 `<input>.parquet` 文件。

### 迁移流程

下面的迁移示例使用 trade 数据（其他数据类型的迁移方法类似）。
所有命令应在 `persistence` crate 根目录下运行。

#### 从标准精度（64-bit）迁移到高精度（128-bit）

该示例展示如何将标准精度 schema 的 Parquet 转换为高精度 schema 的过程。

:::note
如果你要迁移的 catalog 使用了 Arrow 的 `Int64` 与 `UInt64` 类型来表示价格和数量，请在编译生成初始 JSON 之前，参考提交记录 [e284162](https://github.com/nautechsystems/nautilus_trader/commit/e284162cf27a3222115aeb5d10d599c8cf09cf50)。
:::

**1. 将标准精度 Parquet 转为 JSON：**

```bash
cargo run --bin to_json trades.parquet
```

此操作会生成 `trades.json` 与 `trades.metadata.json` 文件。

**2. 将 JSON 转回高精度 Parquet：**

添加 `--features high-precision` 标志以写入高精度（128-bit）schema 的 Parquet。

```bash
cargo run --features high-precision --bin to_parquet trades.json
```

该命令会生成使用高精度 schema 的 `trades.parquet` 文件。

#### 迁移 schema 版本

该示例演示如何将数据从一个 schema 版本迁移到另一个版本。

**1. 将旧 schema 的 Parquet 转为 JSON：**

如果源数据使用了高精度 schema（128-bit），请添加 `--features high-precision` 标志。

```bash
cargo run --bin to_json trades.parquet
```

此操作会生成 `trades.json` 与 `trades.metadata.json` 文件。

**2. 切换到新的 schema 版本：**

```bash
git checkout <new-version>
```

**3. 将 JSON 转回新 schema 的 Parquet：**

```bash
cargo run --features high-precision --bin to_parquet trades.json
```

此命令会生成使用新 schema 的 `trades.parquet` 文件。

### 最佳实践

- 先用小数据集测试迁移流程。
- 保留原始文件的备份。
- 迁移后验证数据完整性。
- 在将变更应用到生产数据之前，先在预发布（staging）环境中演练迁移。

## 自定义数据（Custom data）

由于 Nautilus 设计的模块化特性，系统可以搭建非常灵活的数据流，包括自定义的用户数据类型。本节讨论几种常见用例。

要在 Nautilus 中创建自定义数据类型，首先需要继承自基类 `Data`。

:::info
由于 `Data` 本身不保存状态，因此并非严格要求在子类中调用 `super().__init__()`。
:::

```python
from nautilus_trader.core import Data


class MyDataPoint(Data):
    """
    这是一个示例的用户自定义数据类，继承自基类 `Data`。

    类中字段 `label`, `x`, `y`, `z` 只是示例，可以根据需要任意扩展。
    """

    def __init__(
        self,
        label: str,
        x: int,
        y: int,
        z: int,
        ts_event: int,
        ts_init: int,
    ) -> None:
        self.label = label
        self.x = x
        self.y = y
        self.z = z
        self._ts_event = ts_event
        self._ts_init = ts_init

    @property
    def ts_event(self) -> int:
        """
        事件发生时的 UNIX 时间戳（纳秒）。

        返回值类型：int
        """
        return self._ts_event

    @property
    def ts_init(self) -> int:
        """
        对象初始化时的 UNIX 时间戳（纳秒）。

        返回值类型：int
        """
        return self._ts_init

```

`Data` 抽象基类在系统内部作为契约（contract），要求所有数据类型提供两个属性：`ts_event` 与 `ts_init`，分别表示事件发生时间和对象初始化时间，均为 UNIX 纳秒时间戳。

推荐的实现方式是将 `ts_event` 与 `ts_init` 存储到私有字段，再通过 `@property` 暴露（如上示例，部分 docstring 从 `Data` 基类中摘抄）。

:::info
这些时间戳能确保 Nautilus 在回测中对数据流按单调递增的 `ts_init`（UNIX 纳秒）正确排序。
:::

有了这个自定义数据类型后，你可以在回测或实盘中使用它。例如，可以实现一个 adapter 将外部数据解析为该类型的对象，并发送回 `DataEngine` 供订阅者消费。

在 actor/strategy 中，你可以通过 message bus 发布自定义数据类型：

```python
self.publish_data(
    DataType(MyDataPoint, metadata={"some_optional_category": 1}),
    MyDataPoint(...),
)
```

`metadata` 字典是可选的，用于在 topic 名称中添加更细粒度的信息以区分数据流。

你也可以将额外的 metadata 信息传入 `BacktestDataConfig`，以便在回测配置中描述自定义数据对象：

```python
from nautilus_trader.config import BacktestDataConfig

data_config = BacktestDataConfig(
    catalog_path=str(catalog.path),
    data_cls=MyDataPoint,
    metadata={"some_optional_category": 1},
)
```

在 actor/strategy 中订阅自定义数据类型的方式示例：

```python
self.subscribe_data(
    data_type=DataType(MyDataPoint,
    metadata={"some_optional_category": 1}),
    client_id=ClientId("MY_ADAPTER"),
)
```

`client_id` 用于将数据订阅路由到特定客户端。

订阅后，actor/strategy 会将接收到的 `MyDataPoint` 对象传入 `on_data` 方法，你需要在方法中做类型判断并处理对应数据：

```python
def on_data(self, data: Data) -> None:
    # 先判断数据类型
    if isinstance(data, MyDataPoint):
        # 对数据执行处理逻辑
```

### 发布与接收信号数据（signals）

下面示例演示如何在 actor 或 strategy 中通过 `MessageBus` 发布与接收信号数据（signal）。
信号是一种自动生成的自定义数据，其名称对应单一的基础类型值（str、float、int、bool 或 bytes）。

```python
self.publish_signal("signal_name", value, ts_event)
self.subscribe_signal("signal_name")

def on_signal(self, signal):
    print("Signal", data)
```

### 期权 Greeks 示例

本示例演示如何为期权 Greeks（例如 delta）创建自定义数据类型。按照示例，你可以创建、订阅、发布并将其存入 `Cache` 或 `ParquetDataCatalog` 以便高效检索。

```python
import msgspec
from nautilus_trader.core import Data
from nautilus_trader.core.datetime import unix_nanos_to_iso8601
from nautilus_trader.model import DataType
from nautilus_trader.serialization.base import register_serializable_type
from nautilus_trader.serialization.arrow.serializer import register_arrow
import pyarrow as pa

from nautilus_trader.model import InstrumentId
from nautilus_trader.core.datetime import dt_to_unix_nanos, unix_nanos_to_dt, format_iso8601


class GreeksData(Data):
    def __init__(
        self, instrument_id: InstrumentId = InstrumentId.from_str("ES.GLBX"),
        ts_event: int = 0,
        ts_init: int = 0,
        delta: float = 0.0,
    ) -> None:
        self.instrument_id = instrument_id
        self._ts_event = ts_event
        self._ts_init = ts_init
        self.delta = delta

    def __repr__(self):
        return (f"GreeksData(ts_init={unix_nanos_to_iso8601(self._ts_init)}, instrument_id={self.instrument_id}, delta={self.delta:.2f})")

    @property
    def ts_event(self):
        return self._ts_event

    @property
    def ts_init(self):
        return self._ts_init

    def to_dict(self):
        return {
            "instrument_id": self.instrument_id.value,
            "ts_event": self._ts_event,
            "ts_init": self._ts_init,
            "delta": self.delta,
        }

    @classmethod
    def from_dict(cls, data: dict):
        return GreeksData(InstrumentId.from_str(data["instrument_id"]), data["ts_event"], data["ts_init"], data["delta"])

    def to_bytes(self):
        return msgspec.msgpack.encode(self.to_dict())

    @classmethod
    def from_bytes(cls, data: bytes):
        return cls.from_dict(msgspec.msgpack.decode(data))

    def to_catalog(self):
        return pa.RecordBatch.from_pylist([self.to_dict()], schema=GreeksData.schema())

    @classmethod
    def from_catalog(cls, table: pa.Table):
        return [GreeksData.from_dict(d) for d in table.to_pylist()]

    @classmethod
    def schema(cls):
        return pa.schema(
            {
                "instrument_id": pa.string(),
                "ts_event": pa.int64(),
                "ts_init": pa.int64(),
                "delta": pa.float64(),
            }
        )
```

#### 发布与接收数据示例

下面示例展示如何在 actor 或 strategy 中使用 `MessageBus` 发布与接收数据：

```python
register_serializable_type(GreeksData, GreeksData.to_dict, GreeksData.from_dict)

def publish_greeks(self, greeks_data: GreeksData):
    self.publish_data(DataType(GreeksData), greeks_data)

def subscribe_to_greeks(self):
    self.subscribe_data(DataType(GreeksData))

def on_data(self, data):
    if isinstance(GreeksData):
        print("Data", data)
```

#### 使用 Cache 写入与读取数据

下面示例展示如何在 actor 或 strategy 中使用 `Cache` 写入和读取数据：

```python
def greeks_key(instrument_id: InstrumentId):
    return f"{instrument_id}_GREEKS"

def cache_greeks(self, greeks_data: GreeksData):
    self.cache.add(greeks_key(greeks_data.instrument_id), greeks_data.to_bytes())

def greeks_from_cache(self, instrument_id: InstrumentId):
    return GreeksData.from_bytes(self.cache.get(greeks_key(instrument_id)))
```

#### 使用 catalog 写入与读取自定义数据

将自定义数据流式写入 feather，或写为 catalog 中的 parquet 文件（需先调用 `register_arrow`）：

```python
register_arrow(GreeksData, GreeksData.schema(), GreeksData.to_catalog, GreeksData.from_catalog)

from nautilus_trader.persistence.catalog import ParquetDataCatalog
catalog = ParquetDataCatalog('.')

catalog.write_data([GreeksData()])
```

### 自动创建自定义数据类

`@customdataclass` 装饰器可用于自动生成自定义数据类，并为上面提到的功能提供默认实现。

方法均可按需重写。下面是一个使用示例：

```python
from nautilus_trader.model.custom import customdataclass


@customdataclass
class GreeksTestData(Data):
    instrument_id: InstrumentId = InstrumentId.from_str("ES.GLBX")
    delta: float = 0.0


GreeksTestData(
    instrument_id=InstrumentId.from_str("CL.GLBX"),
    delta=1000.0,
    ts_event=1,
    ts_init=2,
)
```

#### 自定义数据类型的类型存根（stub）

为提高开发便捷性并改善 IDE 的代码提示，可以为动态生成构造函数的自定义数据类型创建一个 `.pyi` 类型存根文件，提供正确的构造器签名和属性类型提示。
这样可以让 IDE 识别并为类的方法和属性提供补全建议。

例如，若自定义数据类定义在 `greeks.py` 中，可创建对应的 `greeks.pyi` 文件，包含如下构造函数签名：

```python
from nautilus_trader.core import Data
from nautilus_trader.model import InstrumentId


class GreeksData(Data):
    instrument_id: InstrumentId
    delta: float

    def __init__(
        self,
        ts_event: int = 0,
        ts_init: int = 0,
        instrument_id: InstrumentId = InstrumentId.from_str("ES.GLBX"),
        delta: float = 0.0,
  ) -> GreeksData: ...
```
