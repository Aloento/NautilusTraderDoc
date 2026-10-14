# Deribit

Deribit 成立于 2016 年，是一家覆盖期权、期货、永续、现货与组合工具的加密货币衍生品交易所。
按成交量计它是最大的加密货币期权交易所之一，也是加密货币衍生品交易的领先平台。

本集成支持与 Deribit 的实时行情接入与订单执行。

## 概览 {#overview}

Deribit 适配器以 Rust 实现，通过配置、工厂、客户端、枚举和常量暴露给 Python。Deribit 在
HTTP 与 WebSocket 两种传输上都使用 JSON-RPC 2.0。适配器优先用 WebSocket 做订阅、实时数据
和订单操作，用 HTTP 做工具加载、历史请求与对账。

组件：

- `DeribitRawHttpClient`：底层 HTTP 客户端，负责 JSON-RPC 成帧、签名、速率限制与重试。
- `DeribitHttpClient`：领域 HTTP 客户端，把场所响应解析为 Nautilus 类型。通过 `inner()`
  可触达底层客户端。
- `DeribitWebSocketClient`：面向 Rust 调用方的底层 WebSocket 连接。
- `DeribitDataClient`：行情数据源管理器。
- `DeribitDataClientFactory`：数据客户端工厂。
- `DeribitExecutionClient`：账户管理与交易执行网关。
- `DeribitExecutionClientFactory`：执行客户端工厂。

`nautilus_trader.adapters.deribit` 提供的 Python 接口：

- `DeribitDataClientConfig`、`DeribitExecutionClientConfig`
- `DeribitDataClientFactory`、`DeribitExecutionClientFactory`
- `DeribitHttpClient`
- `DeribitCurrency`、`DeribitEnvironment`、`DeribitProductType`
- `DeribitBookSummary`、`DeribitVolatilityIndex`
- `get_deribit_http_base_url`、`get_deribit_ws_url`
- `DERIBIT`、`DERIBIT_CLIENT_ID` 和 `DERIBIT_VENUE`

:::note
多数用户如下方所示配置实时交易节点即可，无需直接使用这些底层组件。
:::

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/deribit/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/deribit/examples/)

## Deribit 文档 {#deribit-documentation}

- [API 参考](https://docs.deribit.com/)
- [速率限制](https://docs.deribit.com/articles/rate-limits)
- [连接管理](https://docs.deribit.com/articles/connection-management-best-practices)
- [行情数据采集](https://docs.deribit.com/articles/market-data-collection-best-practices)
- [订单管理](https://docs.deribit.com/articles/order-management-best-practices)
- [访问范围](https://docs.deribit.com/articles/access-scope)

请结合本 NautilusTrader 集成指南阅读 Deribit 文档。

## 产品支持 {#product-support}

每个客户端只在连接时加载一次其 `product_types` 配置中列出的产品族。两个客户端之后都不会
刷新工具集，因此新上市的工具需要重启节点才能加载。数据客户端上的
`auto_load_missing_instruments` 则改为在首次订阅时拉取未缓存的工具，见
[订阅时懒加载](#lazy-load-on-subscribe)。

| 产品类型        | 行情数据 | 交易    | 说明                                           |
| --------------- | -------- | ------- | ---------------------------------------------- |
| 永续期货        | ✓        | ✓       | 用 `DeribitProductType.FUTURE` 加载。          |
| 到期期货        | ✓        | ✓       | 用 `DeribitProductType.FUTURE` 加载。          |
| 期权            | ✓        | ✓       | 用 `DeribitProductType.OPTION` 加载。          |
| 现货            | ✓        | ✓       | 用 `DeribitProductType.SPOT` 加载。            |
| 期货组合        | ✓        | ✓       | 用 `DeribitProductType.FUTURE_COMBO` 加载。    |
| 期权组合        | ✓        | ✓       | 用 `DeribitProductType.OPTION_COMBO` 加载。    |

## 符号体系 {#symbology}

Deribit 对不同工具类型使用特定的 symbol 约定。引用工具 ID 时应始终带上 `.DERIBIT` 后缀
（例如 BTC 永最为 `BTC-PERPETUAL.DERIBIT`）。

### 数量单位 {#quantity-units}

Nautilus 数量映射到 Deribit 的 `amount` 字段，而不是可选的 `contracts` 字段。Deribit 对永续
与反向期货以 USD 单位报数量，对期权与线性期货以标的基础货币报数量。Deribit 的
`contract_size` 字段用于在 `amount` 与合约张数之间换算。适配器不会再把它当作 Nautilus 的
乘数应用一遍。

### 永续期货 {#perpetual-futures}

格式：`{Currency}-PERPETUAL`

示例：

- `BTC-PERPETUAL` —— 比特币永续互换。
- `ETH-PERPETUAL` —— 以太坊永续互换。

在策略中订阅 BTC 永续：

```python
InstrumentId.from_str("BTC-PERPETUAL.DERIBIT")
```

### 到期期货 {#dated-futures}

格式：`{Currency}-{DDMMMYY}`

示例：

- `BTC-25DEC26` —— 2026 年 12 月 25 日到期的比特币期货。
- `ETH-26MAR27` —— 2027 年 3 月 26 日到期的以太坊期货。

```python
InstrumentId.from_str("BTC-25DEC26.DERIBIT")
```

### 期权 {#options}

格式：`{Currency}-{DDMMMYY}-{Strike}-{Type}`

示例：

- `BTC-25DEC26-100000-C` —— 行权价 100,000 美元、2026 年 12 月 25 日到期的比特币买权。
- `BTC-25DEC26-80000-P` —— 行权价 80,000 美元、2026 年 12 月 25 日到期的比特币卖权。
- `ETH-26MAR27-4000-C` —— 行权价 4,000 美元、2027 年 3 月 26 日到期的以太坊买权。

其中：

- `C` = 买权（call option）。
- `P` = 卖权（put option）。

```python
InstrumentId.from_str("BTC-25DEC26-100000-C.DERIBIT")
```

### 现货 {#spot}

格式：`{BaseCurrency}_{QuoteCurrency}`

示例：

- `BTC_USDC` —— 比特币对 USDC。
- `ETH_USDC` —— 以太坊对 USDC。

```python
InstrumentId.from_str("BTC_USDC.DERIBIT")
```

### 期货组合 {#future-combos}

格式：`{Currency}-FS-{LegA}_{LegB}`

腿是到期期货或永续（在组合名内记作 `PERP`，尽管独立工具是 `BTC-PERPETUAL`）。组合随其
最早的腿到期。

示例：

- `BTC-FS-25DEC26_PERP` —— 2026 年 12 月期货与永续之间的日历价差。
- `BTC-FS-26MAR27_25DEC26` —— 两个到期期货之间的跨月价差。

```python
InstrumentId.from_str("BTC-FS-25DEC26_PERP.DERIBIT")
```

适配器把期货组合建模为 `CryptoFuturesSpread`，以 USD 计价（腿间价差），结算货币为加密货币，
`is_inverse` 按上游 `instrument_type` 设置。

### 期权组合 {#option-combos}

格式：`{Currency}-{Strategy}-{DDMMMYY}-{Strikes}`

策略代码包括 CS（买权价差）、PS（卖权价差）、STRG（宽跨式）、STRD（跨式）、BOX（盒式）
和 RR（风险逆转）。行权价段用 `_` 分隔多个行权价。

示例：

- `BTC-CS-25DEC26-70000_75000` —— 70k / 75k 买权价差，2026 年 12 月 25 日到期。
- `BTC-STRG-26MAR27-72000_80000` —— 72k / 80k 宽跨式，2027 年 3 月 26 日到期。
- `BTC-STRD-26MAR27-77000` —— 77k 跨式，2027 年 3 月 26 日到期。
- `BTC-BOX-26MAR27-58000_60000` —— 58k / 60k 盒式，2027 年 3 月 26 日到期。

```python
InstrumentId.from_str("BTC-STRG-26MAR27-72000_80000.DERIBIT")
```

适配器把期权组合建模为 `CryptoOptionSpread`，按 Deribit 反向期权约定以基础货币计价。小数
`size_increment`（如 `0.1`）端到端保留。

## 可交易到期日 {#traded-expirations}

Deribit 通过 `public/get_expirations` HTTP 端点暴露当前可交易的到期日。期权链加载器可以用
高层 HTTP 客户端刷新有效的期权系列，而无需扫描每个工具。

```rust tab="Rust"
use nautilus_deribit::http::models::DeribitCurrency;

let expirations = client
    .request_option_expirations(DeribitCurrency::BTC)
    .await?;
```

```python tab="Python"
from nautilus_trader.adapters.deribit import DeribitCurrency
from nautilus_trader.adapters.deribit import DeribitHttpClient

client = DeribitHttpClient()
expirations = await client.request_option_expirations(DeribitCurrency.BTC)
```

该高层方法只返回期权到期日。底层 Rust 请求请用 `GetExpirationsParams` 调用
`client.inner().get_expirations(...)`。对 `BTC` 这类具体货币，Deribit 返回按货币建键的结果；
对 `currency=any` 返回按 kind 直接建键的结果。适配器两种形态都能处理。

## 组合工具 {#combo-instruments}

当 `product_types` 含有期货组合或期权组合变体时，工具加载会包含组合。Python 中使用
`DeribitProductType.FUTURE_COMBO` 或 `DeribitProductType.OPTION_COMBO`。Deribit 在
`/public/get_combos` 上暴露每个有效组合的腿构成，并在标准的
`/public/get_instruments?kind=option_combo|future_combo` 响应上给出组合的交易元数据
（tick 大小、合约大小、到期、最小交易量）。适配器把两者合并，把 `deribit_combo_id`、
`deribit_combo_state` 和 `deribit_combo_legs` 挂到已加载工具的 `info` 映射上，策略无需第二次
场所调用即可解析各腿。

### 成交发布 {#trade-publishing}

Deribit 把每笔组合成交发布两次：

- 在组合的成交频道（`trades.{combo_name}.{interval}`）：父成交加一个 `legs[]` 数组，描述
  每条腿的成交。
- 在每条腿的成交频道（`trades.{leg_instrument}.{interval}`）：该腿的独立成交，带
  `combo_id` 和 `combo_trade_id` 指回父成交。

因此，订阅普通期权或期货的调用方会在其现有成交流上看到组合来源的成交；订阅组合本身的
调用方看到组合级成交。适配器不会把组合父消息扩散成额外的腿 tick。它把上游的父消息与
逐腿消息作为不同的 `TradeTick` 转发到各自的 `InstrumentId` 上。因此，同时订阅组合和某条
标的腿的调用方，对同一笔组合成交会收到一个组合 tick 加一个腿 tick，不会在同一工具上收到
重复 tick。

要让 Deribit 数据客户端在组合成交订阅之外打开真实的腿成交频道，给 `subscribe_trades` 传
`params={"subscribe_combo_legs": True}`。退订该组合成交流时，Nautilus 也会关闭由这一选择
开启的腿订阅。

Deribit 已经按腿发布大宗成交与 Block RFQ，因此适配器通过标准的 1:1 成交路径转发它们。
大宗与 RFQ 来源的成交在生成的 `TradeTick` 上如何打标签，见
[成交 ID 溯源](#trade-id-provenance)。

### 历史组合成交 {#historical-combo-trades}

标准的逐工具成交端点接受组合工具名。要一次调用扫完某种产品类的全部组合，通过
`DeribitHttpClient::inner()` 使用 `get_last_trades_by_currency`：

```rust
use nautilus_deribit::http::{
    models::{DeribitCurrency, DeribitProductType},
    query::GetLastTradesByCurrencyParams,
};

let params = GetLastTradesByCurrencyParams::builder()
    .currency(DeribitCurrency::BTC)
    .kind(DeribitProductType::FutureCombo)
    .count(50_u32)
    .include_old(true)
    .build()?;
let resp = client.inner().get_last_trades_by_currency(params).await?;
```

每个返回的 `DeribitPublicTrade` 携带 `legs: Option<Vec<DeribitTradeLeg>>`，以及用于关联逐腿
成交的 `combo_id` 与 `combo_trade_id` 字段。

## 成交 ID 溯源 {#trade-id-provenance}

适配器发出的公共 `TradeTick`，若成交来自 Block RFQ、大宗交易或组合，会在场所成交 ID 前
加前缀。需要把它们与普通成交区分的策略，可以对 `TradeTick.trade_id` 的前缀做模式匹配。
Deribit 原始 `trade_id` 在前缀之后原样保留，因此与 Deribit 自己的 ID 对账只需去掉前缀。

| 前缀         | 来源字段         | 含义                                                         |
| ------------ | ---------------- | ------------------------------------------------------------ |
| `RFQ-`       | `block_rfq_id`   | 成交来自 Block RFQ。                                         |
| `BLK-`       | `block_trade_id` | 成交是非 RFQ 的大宗交易。                                    |
| `COMBO-`     | `combo_id`       | 父单来自组合工具的逐腿成交。                                 |
| *无前缀*     | （以上皆无）     | 标准成交。                                                   |

多个标签同时存在时的优先级：`RFQ-` > `BLK-` > `COMBO-`。Block RFQ 在 Deribit 上本身就是
大宗交易，因此 RFQ 标签优先。以大宗交易执行的组合打 `BLK-` 标签，因为大宗流程是更重要的
对账信号。

这只适用于公共成交（`TradeTick`）。`FillReport.trade_id` 保持不变，与
`get_user_trades_*` 的对账照常工作。

:::note
这是 NautilusTrader 1.228.0 引入的单向约定。该版本之前录制的回放数据没有前缀。若你跨版本
存储并比较 `trade_id` 字符串，请在新数据一侧去掉前缀；或者只在升级后捕获的数据上按前缀
过滤。
:::

## 行情数据 {#market-data}

实时订阅由 WebSocket 频道提供，历史请求走 HTTP。每个带 `{interval}` 的频道都通过 `interval`
订阅参数与[订单簿订阅](#order-book-subscriptions)下描述的默认选择规则来解析它。

| Nautilus 订阅     | Deribit 频道                                                                | 说明                                                                       |
| ----------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 金融工具          | `instrument.state.{kind}.{currency}`                                        | `kind` 与 `currency` 参数都默认为 `any`。                                   |
| 工具状态          | `instrument.state.{kind}.{currency}`                                        | 频道由工具 ID 推导；频道上每个工具都会发出。                               |
| 订单簿 delta      | `book.{instrument}.raw` 或 `book.{instrument}.{group}.{depth}.{interval}`   | 仅 `L2_MBP`；见[订单簿订阅](#order-book-subscriptions)。                    |
| 订单簿深度        | `book.{instrument}.{group}.10.{interval}`                                   | 始终用分组频道，深度固定为 10。                                            |
| 报价              | `quote.{instrument}`                                                        | 最优买卖价；该频道不带 interval。                                          |
| 成交              | `trades.{instrument}.{interval}`                                            | 组合行为见[成交发布](#trade-publishing)。                                  |
| K 线              | `chart.trades.{instrument}.{resolution}`                                    | 见 [K 线](#bars)。                                                         |
| 标记价            | `ticker.{instrument}.{interval}`                                            | 从 ticker 负载解析。                                                       |
| 指数价            | `ticker.{instrument}.{interval}`                                            | 从 ticker 负载解析。                                                       |
| 期权 Greeks       | `ticker.{instrument}.{interval}`                                            | 仅限期权。                                                                 |
| Funding 费率      | `perpetual.{instrument}.{interval}`                                         | 仅限永续；其他工具会被拒绝。                                               |
| 波动率指数        | `deribit_volatility_index.{index_name}`                                     | 自定义数据；见[波动率指数](#volatility-index)。                            |

| Nautilus 请求              | Deribit 端点                                      | 说明                                                |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------- |
| 金融工具                   | `public/get_instruments`                          | 限定在配置的 `product_types` 内。                    |
| 成交                       | `public/get_last_trades_by_instrument_and_time`   | 接受组合工具名。                                     |
| K 线                       | `public/get_tradingview_chart_data`               | 见 [K 线](#bars)。                                   |
| 订单簿快照                 | `public/get_order_book`                           | 要求客户端缓存中有该工具。                           |
| 期权链参考价               | `public/ticker`                                   | 内部用于引导动态行权价区间。                         |
| `DeribitBookSummary`       | `public/get_book_summary_by_currency`             | 自定义数据；见[订单簿汇总](#book-summaries)。        |

### K 线 {#bars}

Deribit 的 chart 分辨率有 `1`、`3`、`5`、`10`、`15`、`30`、`60`、`120`、`180`、`360`、`720`
分钟，外加 `1D`。实时与历史两条路径都要求 `EXTERNAL` 聚合。

历史请求是严格的：映射不到上述分辨率的 K 线类型会被拒绝，分钟、小时、日之外的聚合也一样。

实时订阅则向上取整。所请求的步长会**向上**舍入到下一个受支持的分辨率，因此 2 分钟步长会
打开 Deribit 的 3 分钟频道，6 分钟步长会打开 10 分钟频道。超过 720 分钟的一律变为 `1D`。
分钟、小时、日之外的聚合回退为 1 分钟并发出警告。

每根收到的 K 线都盖上由场所分辨率推导的 `BarType`，价格类型永远是 `LAST`。订阅时请使用
名为受支持分辨率且带 `LAST` 的 K 线类型，否则 K 线会以与你订阅不同的 `BarType` 发布，永远
到不了你的处理器。

`Bar.volume` 对反向永续和反向期货取自 chart 的 `cost` 字段（USD），对其余一切（包括标记为
反向的期权与期权价差）取自 `volume` 字段（基础货币）。这使每只工具的 `Bar.volume` 与
`TradeTick.size` 保持同一单位。

## 订单簿订阅 {#order-book-subscriptions}

Deribit 只发布 L2（market-by-price）订单簿数据，因此 `subscribe_book_deltas` 与
`subscribe_book_depth` 会拒绝 `BookType.L2_MBP` 之外的任何订单簿类型。可用的频道有两族，
各适合不同场景。

### 原始频道（逐笔） {#raw-feeds-tick-by-tick}

原始频道把每一次更新作为单独消息发出。订阅原始订单簿，簿内每一笔挂单插入、更新或删除
都会收到通知。

- 要求鉴权连接（防滥用的保护措施）。
- 需要捕捉每个价格档位变化的高频交易或做市场景用它。
- 消息量更高。
- 先给出完整订单簿的一个初始快照，之后是增量 delta。

### 聚合频道（批量） {#aggregated-feeds-batched}

聚合频道按固定间隔（如每 100ms）批量发出更新，把多次订单簿变化合并到一条消息。

- 无需鉴权即可使用。
- 多数场景的推荐选择。
- 消息量更低，更易处理。
- 未鉴权的默认间隔：100ms。
- 每条消息都是完整的、限定深度的快照，因此每次更新替换整个订单簿，而不是打补丁。

### Subscription parameters

The Nautilus adapter supports both feed types via subscription parameters:

| Parameter  | Values                 | Notes                                                                     |
| ---------- | ---------------------- | ------------------------------------------------------------------------- |
| `interval` | `raw`, `100ms`, `agg2` | `agg2` batches at about 1 second intervals. `raw` requires auth.          |
| `group`    | `none`, price group    | Default: `none`. Applies only to grouped non-raw book channels.           |
| `depth`    | `1`, `10`, `20`        | Default: `10`. Number of price levels per side for grouped book channels. |

The data client chooses the order book interval as follows:

1. Uses `params["interval"]` when supplied.
2. Uses `raw` when the WebSocket connection is authenticated and no interval is supplied.
3. Uses Deribit's public `100ms` grouped feed when the connection is not authenticated.

```python
from nautilus_trader.model import BookType
from nautilus_trader.model import InstrumentId

instrument_id = InstrumentId.from_str("BTC-PERPETUAL.DERIBIT")

# Public 100ms aggregated feed when no API credentials are configured.
strategy.subscribe_book_deltas(instrument_id, BookType.L2_MBP)

# Raw feed. This is also the authenticated default when no interval is supplied.
strategy.subscribe_book_deltas(
    instrument_id,
    BookType.L2_MBP,
    params={"interval": "raw"},
)

# Force an aggregated feed on an authenticated connection.
strategy.subscribe_book_deltas(
    instrument_id,
    BookType.L2_MBP,
    params={"interval": "100ms", "depth": 10},
)
```

:::note
Raw order book feeds require an authenticated WebSocket connection. Ensure API credentials are
configured before subscribing to raw feeds.
:::

:::tip
For most strategies, the 100ms aggregated feed provides sufficient granularity with lower message
overhead. Set `params={"interval": "100ms"}` when you provide credentials but do not need raw
tick-by-tick book updates.
:::

### Sequence gap recovery

The adapter records the `change_id` of every book message it applies and checks the `prev_change_id` of each
incremental update against it. Only raw-channel updates carry `prev_change_id`. Aggregated messages are
self-contained snapshots and need no sequence check.

When a gap is detected (a missed message), or a level in a book message fails conversion to `Price`
or `Quantity` (for example, a value beyond their range), the adapter automatically:

1. Drops that message, and every further delta for the affected instrument.
2. Unsubscribes from that instrument's delta book channels.
3. Resubscribes once the unsubscribe is acknowledged, to obtain a fresh snapshot.
4. Resumes normal processing once each resubscribed channel delivers a snapshot that converts,
   reseeding the sequence from it.

During resync, the strategy will not receive stale or incomplete book updates. A user-initiated
unsubscribe while a resync is pending cancels the resubscribe instead of reopening the channel.

A grouped book channel (`book.{instrument}.{group}.{depth}.{interval}`) sends a full snapshot every interval,
so the adapter never resyncs it. It drops a snapshot that fails conversion. The next snapshot replaces the
book.

:::warning[Subscribe each instrument to one delta book channel]
Book channels for the same instrument share one sequence and resync state. An instrument can have multiple
delta book channels (for example `raw` and `100ms`). If a resync starts while one still awaits its initial
snapshot, that channel can stay unsubscribed until the next reconnect.
:::

The adapter logs a warning and skips a malformed level, including a value that does not parse as a
decimal. A level whose amount rounds to zero at the instrument's size precision is treated as
absent: snapshots skip it, incremental updates delete it, and the adapter logs a warning.

## Funding rates

Deribit exchanges funding continuously (every few seconds) rather than at fixed intervals
like most other exchanges. The `interval` field on `FundingRateUpdate` is `None` for
Deribit because this continuous model does not map to a discrete period.

## Deribit specific data

### Book summaries

Request `DeribitBookSummary` custom data to fetch one bulk snapshot filtered by currency and product
kind. Each response item includes the Nautilus instrument ID, implied volatility, open interest,
prices, volume, and other fields returned by `public/get_book_summary_by_currency`.

The actor or strategy receives the complete response through one `on_historical_data` callback.
Each item is a `CustomData` wrapper containing a `DeribitBookSummary` in its `data` field:

```python
from nautilus_trader.adapters.deribit import DERIBIT_CLIENT_ID
from nautilus_trader.adapters.deribit import DeribitBookSummary
from nautilus_trader.model import CustomData
from nautilus_trader.model import DataType


def on_start(self) -> None:
    self.request_data(
        DataType(
            DeribitBookSummary.__name__,
            metadata={"currency": "BTC", "kind": "option"},
        ),
        DERIBIT_CLIENT_ID,
    )


def on_historical_data(self, data: list[CustomData]) -> None:
    for item in data:
        summary = item.data
        if isinstance(summary, DeribitBookSummary):
            self.log.info(
                f"{summary.instrument_id}: mark_iv={summary.mark_iv}, "
                f"open_interest={summary.open_interest}",
            )
```

The `currency` metadata field is required. The optional `kind` field defaults to `option`.
Decimal-backed venue fields, such as `mark_iv` and `open_interest`, are exposed to Python as strings
or `None`. An empty response invokes `on_historical_data` once with an empty list. A failed venue
request also invokes the callback with an empty list after logging an error. A request rejected
before it reaches the venue, such as one missing `currency`, produces no callback.

### Volatility index

The adapter emits `DeribitVolatilityIndex` custom data from Deribit's
`deribit_volatility_index.{index_name}` WebSocket channel. Deribit provides
volatility index streams such as `btc_usd` and `eth_usd`.

| Field        | Type    | Description                                              |
| ------------ | ------- | -------------------------------------------------------- |
| `index_name` | `str`   | Deribit volatility index name, for example `btc_usd`.    |
| `volatility` | `float` | Current volatility index value.                          |
| `ts_event`   | `int`   | UNIX timestamp in nanoseconds when the update occurred.  |
| `ts_init`    | `int`   | UNIX timestamp in nanoseconds when the object was built. |

Subscribe from an actor or strategy with `DataType(DeribitVolatilityIndex.__name__)`.
The `index_name` metadata key is required:

```python
from nautilus_trader.adapters.deribit import DeribitVolatilityIndex
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType

self.subscribe_data(
    data_type=DataType(DeribitVolatilityIndex.__name__, metadata={"index_name": "btc_usd"}),
    client_id=ClientId.from_str("DERIBIT"),
)
```

## Orders capability

Below are the order types, execution instructions, and time-in-force options supported on Deribit.

### Order types

| Nautilus order type    | Deribit order type | Supported | Notes                                   |
| ---------------------- | ------------------ | --------- | --------------------------------------- |
| `MARKET`               | `market`           | ✓         | Immediate execution at market price.    |
| `LIMIT`                | `limit`            | ✓         | Execution at specified price or better. |
| `STOP_MARKET`          | `stop_market`      | ✓         | Conditional market order on trigger.    |
| `STOP_LIMIT`           | `stop_limit`       | ✓         | Conditional limit order on trigger.     |
| `MARKET_IF_TOUCHED`    | `take_market`      | ✓         | Take-profit style market order.         |
| `LIMIT_IF_TOUCHED`     | `take_limit`       | ✓         | Take-profit style limit order.          |
| `TRAILING_STOP_MARKET` | `trailing_stop`    | -         | *Not currently implemented*.            |
| `TRAILING_STOP_LIMIT`  | N/A                | -         | *Not supported by Deribit*.             |
| `MARKET_TO_LIMIT`      | `market_limit`     | -         | *Not currently implemented*.            |

### Execution instructions

| Instruction   | Supported | Notes                                                                            |
| ------------- | --------- | -------------------------------------------------------------------------------- |
| `post_only`   | ✓         | Order will be rejected if it would take liquidity. Uses `reject_post_only=true`. |
| `reduce_only` | ✓         | Order can only reduce an existing position.                                      |

### Time in force

| Time in force | Supported | Notes                                                |
| ------------- | --------- | ---------------------------------------------------- |
| `GTC`         | ✓         | Good till canceled (`good_til_cancelled`).           |
| `GTD`         | ✓         | Good till day. Expires at 8:00 UTC (`good_til_day`). |
| `IOC`         | ✓         | Immediate or cancel (`immediate_or_cancel`).         |
| `FOK`         | ✓         | Fill or kill (`fill_or_kill`).                       |

Deribit applies time in force to limit-style orders. The adapter omits `time_in_force`
for `MARKET`, `STOP_MARKET`, and `MARKET_IF_TOUCHED` orders because Deribit rejects that
parameter on market-style order types.

:::note
**GTD on Deribit**: Unlike other exchanges where GTD accepts an arbitrary expiry time,
Deribit's `good_til_day` always expires at 8:00 UTC the same or next day. Custom expiry times
will be logged as warnings and the order will use the exchange's fixed expiry behavior.
:::

### Trigger types

Conditional orders (stop orders) support different trigger price sources:

| Trigger type  | Supported | Notes                                                |
| ------------- | --------- | ---------------------------------------------------- |
| `last_price`  | ✓         | Uses the last traded price. Also used for `DEFAULT`. |
| `mark_price`  | ✓         | Uses the mark price.                                 |
| `index_price` | ✓         | Uses the underlying index price.                     |

Any other Nautilus trigger type is dropped from the request rather than mapped. Deribit requires
`trigger` on stop-loss and take-profit orders, so use one of the three above for conditional
orders.

```python
# Example: Stop loss using mark price trigger
stop_order = order_factory.stop_market(
    instrument_id=instrument_id,
    order_side=OrderSide.SELL,
    quantity=Quantity.from_str("0.1"),
    trigger_price=Price.from_str("45000.0"),
    trigger_type=TriggerType.MARK_PRICE,  # Use mark price for trigger
)
strategy.submit_order(stop_order)
```

### Batch operations

| Operation                | Supported | Notes                                                                    |
| ------------------------ | --------- | ------------------------------------------------------------------------ |
| Submit order list        | ✓         | Sends each order as an individual Deribit order. No atomic venue batch.  |
| Batch cancel by order ID | ✓         | Sends individual `private/cancel` requests for each venue order ID.      |
| Cancel all by instrument | ✓         | Uses `private/cancel_all_by_instrument` when no side filter is supplied. |
| Side-filtered cancel all | ✓         | Filters cached open orders locally, then cancels each matching order.    |
| Batch modify             | -         | *Not currently implemented*: single order modify is supported.           |

### Post-only behavior

Deribit offers two post-only modes:

1. **Price adjustment (Deribit default)**: If a post-only order would cross the spread and execute,
   Deribit automatically adjusts the price to one tick inside the spread.
2. **Reject mode**: Order is immediately rejected if it would cross the spread.

The Nautilus adapter uses **reject mode** (`reject_post_only=true`) for deterministic behavior.
If a post-only order would take liquidity, it is rejected with error code `11054`, and an `OrderRejected`
event is emitted with the `due_post_only` flag set to `true`.

This allows strategies to differentiate between:

- Orders rejected due to post-only violation (attempted to take liquidity).
- Orders rejected for other reasons (insufficient margin, invalid price, etc.).

### Order modification

The adapter uses Deribit's native `private/edit` endpoint rather than cancel-and-replace.
This provides several advantages:

| Benefit                     | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| Single request              | Faster execution, lower latency than cancel + new order.          |
| Queue priority preservation | Keeps position when only reducing quantity or keeping same price. |
| Fill history maintained     | Partial fills remain linked to the same order ID.                 |

**Queue priority rules**:

- **Decreasing quantity only**: Keeps queue position.
- **Same price**: Keeps queue position.
- **Increasing quantity or changing price**: Loses queue position (treated as new order).

A modify command must carry the venue order ID and a price. If either is missing, the adapter rejects the
command locally without reaching Deribit. Quantity is optional and falls back to the cached order's current
quantity.

### Position management

| Feature          | Supported | Notes                                                              |
| ---------------- | --------- | ------------------------------------------------------------------ |
| Query positions  | ✓         | Fetched from `private/get_positions` for reconciliation.           |
| Position mode    | -         | *Not supported by Deribit*: net position mode only.                |
| Leverage control | -         | *Not supported by Deribit*: no direct leverage setting.            |
| Margin mode      | -         | *Not currently implemented*: Deribit exposes account margin modes. |

The execution client subscribes to `user.orders`, `user.trades`, and `user.portfolio` (balance and
margin), not to Deribit's combined `user.changes` channel, so no position push reaches the adapter.
Live position state is maintained by Nautilus from the fills on `user.trades`, and
`private/get_positions` supplies the venue snapshot that reconciliation compares against.

### Order querying

| Feature              | Supported | Notes                          |
| -------------------- | --------- | ------------------------------ |
| Query open orders    | ✓         | List all active orders.        |
| Query order history  | ✓         | Historical order data.         |
| Order status updates | ✓         | Real-time order state changes. |
| Trade history        | ✓         | Execution and fill reports.    |

### Contingent orders

| Feature                        | Supported | Notes                                                                          |
| ------------------------------ | --------- | ------------------------------------------------------------------------------ |
| Order lists                    | ✓         | Submitted sequentially as independent orders; there is no atomic venue list.   |
| Native linked orders           | -         | *Not currently implemented*: Deribit exposes `linked_order_type`.              |
| OCO orders                     | -         | *Not currently implemented*: Deribit exposes `one_cancels_other`.              |
| Bracket orders                 | -         | *Not currently implemented*: Deribit exposes `one_triggers_one_cancels_other`. |
| Conditional stop orders        | ✓         | Stop market and stop limit orders.                                             |
| Conditional take-profit orders | ✓         | Market-if-touched and limit-if-touched orders.                                 |

### Liquidation handling

Deribit tags any trade that was triggered by a liquidation. On the
`user.trades` stream and `private/get_user_trades_*` endpoints, the optional
`liquidation` field indicates which side was being liquidated:

| Value  | Meaning                       |
| ------ | ----------------------------- |
| `"M"`  | Maker side was liquidated.    |
| `"T"`  | Taker side was liquidated.    |
| `"MT"` | Both sides were liquidated.   |
| absent | Normal non-liquidation trade. |

For each liquidation-tagged fill, the adapter logs a warning with the instrument, trade ID, order ID, and
liquidation side. Then it emits the `FillReport` through the normal pipeline. Deribit does not operate an ADL
mechanism distinct from the liquidation + insurance-fund / portfolio margin process, so there is no separate
ADL signal to surface.

Upstream references:

- [`user.trades.{instrument_name}.{interval}` channel](https://docs.deribit.com/subscriptions/user/usertradesinstrument_nameinterval)
- [Liquidation documentation](https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations)

## Rate limiting

Deribit uses credit-based and endpoint-specific rate limits. The official Deribit limits are
authoritative, and they can vary by endpoint, account tier, and current venue policy. The adapter
adds local token buckets to reduce avoidable throttling, but it does not replace Deribit's own
server-side checks.

### HTTP limits

Every HTTP request consumes the global bucket and a per-method bucket keyed `deribit:{method}` that uses the
global quota. If the JSON-RPC method belongs to the order or account category, it also consumes that bucket.

| Bucket / key       | Adapter bucket        | Notes                                                          |
| ------------------ | --------------------- | -------------------------------------------------------------- |
| `deribit:global`   | 20 req/sec, 100 burst | Applied to every HTTP request.                                 |
| `deribit:orders`   | 5 req/sec, 20 burst   | Matching-engine methods when driving the HTTP client directly. |
| `deribit:account`  | 5 req/sec, 5 burst    | Account, position, order state, and user trade endpoints.      |
| `deribit:{method}` | 20 req/sec, 100 burst | Per-method bucket; falls back to the global quota.             |

### WebSocket limits

| Operation             | Adapter bucket      | Notes                                                          |
| --------------------- | ------------------- | -------------------------------------------------------------- |
| Subscribe/unsubscribe | 3 req/sec, 10 burst | Also the default bucket for every non-order WebSocket request. |
| Order operations      | 5 req/sec, 20 burst | Buy, sell, edit, and cancel via WebSocket.                     |

:::note
The Nautilus adapter uses WebSocket for order submission (not HTTP) for lower latency.
Order operations are rate-limited by `DERIBIT_WS_ORDER_QUOTA` (5 req/sec, 20 burst).
:::

### Credit-based system details

Deribit replenishes non-matching-engine credits continuously. Current public documentation lists
the default non-matching-engine pool as follows:

**Non-matching engine requests**:

| Parameter        | Value              | Notes                           |
| ---------------- | ------------------ | ------------------------------- |
| Cost per request | 500 credits        | Each API call consumes credits. |
| Maximum pool     | 50,000 credits     | Allows 100 request burst.       |
| Refill rate      | 10,000 credits/sec | ~20 sustained requests/second.  |

**Matching engine requests (default tier)**:

| Parameter      | Value          | Notes                            |
| -------------- | -------------- | -------------------------------- |
| Sustained rate | 5 requests/sec | Continuous rate limit.           |
| Burst capacity | 20 requests    | Maximum burst before throttling. |

Higher matching-engine limits are available for market makers and high-volume traders based on
7-day trading volume tiers.

Some Deribit endpoints have stricter method-specific limits. For example, current venue docs list
`public/get_instruments` at 1 request per second with a 50 request burst, and subscription methods
at about 3.3 requests per second with a 10 request burst. Keep `product_types` scoped to the
families you need and avoid repeated full instrument reloads in live systems.

The Nautilus adapter implements broad token bucket rate limiters configured as:

- `DERIBIT_HTTP_REST_QUOTA`: 20 req/sec with 100 burst (global and per-method HTTP)
- `DERIBIT_HTTP_ORDER_QUOTA`: 5 req/sec with 20 burst (matching-engine HTTP)
- `DERIBIT_HTTP_ACCOUNT_QUOTA`: 5 req/sec with 5 burst (account HTTP)
- `DERIBIT_WS_ORDER_QUOTA`: 5 req/sec with 20 burst (matching-engine WebSocket)
- `DERIBIT_WS_SUBSCRIPTION_QUOTA`: 3 req/sec with 10 burst (subscribe, unsubscribe, and other non-order requests)

For more details, see the
[Rate limits article](https://docs.deribit.com/articles/rate-limits).

:::warning
Deribit returns error code `10028` (too_many_requests) when you exceed the allowed quota.
Repeated violations may result in temporary throttling.
:::

## Connection management

### Platform limits

| Limit                                            | Current Deribit guidance |
| ------------------------------------------------ | ------------------------ |
| Active sessions per API key or login             | 16                       |
| Session and connection-scoped connections per IP | 32                       |
| Web app connections per browser session          | 2                        |

### Session-based authentication

The adapter uses **separate WebSocket sessions** for data and execution clients, each with its own
authentication scope:

| Client           | Session Name         | Purpose                                             |
| ---------------- | -------------------- | --------------------------------------------------- |
| Data client      | `nautilus-data`      | Market data subscriptions (raw feeds require auth). |
| Execution client | `nautilus-execution` | Order operations (buy, sell, edit, cancel).         |

**Authentication flow**:

1. WebSocket connects to Deribit.
2. Client authenticates using `client_signature` grant type with session scope.
3. Tokens are refreshed before expiry.
4. On reconnection, re-authentication is retried with exponential backoff (up to 3 attempts).
   If all attempts fail, only public channel subscriptions are restored.

This session-based approach allows:

- Independent token management per client type.
- Isolated failure domains (data auth failure does not affect execution).
- Clear audit trail in Deribit's session logs.

### Best practices

The adapter follows Deribit's
[recommended connection practices](https://docs.deribit.com/articles/connection-management-best-practices):

1. **Uses WebSocket subscriptions** for real-time data instead of REST polling, resulting in fewer requests,
   lower latency, and reduced rate limit consumption.
2. **Authenticates all connections** when credentials are provided. Authenticated users benefit
   from higher rate limits and are less likely to be IP rate-limited.
3. **Implements heartbeats** (30 second interval by default) to maintain connection health and detect
   disconnections early.
4. **Handles reconnection** automatically with re-authentication and subscription recovery.

:::tip
Always provide API credentials even for public data access. Authenticated connections have higher
rate limits, and Deribit contacts authenticated clients before applying restrictions during
high-load periods.
:::

:::note
The adapter uses a 30 second heartbeat interval by default. Deribit requires WebSocket heartbeat
intervals to be at least 10 seconds.
:::

## Authentication

Deribit uses API key authentication with HMAC-SHA256 signatures for private endpoints.

To create API credentials:

1. Log into your Deribit account at [deribit.com](https://www.deribit.com)
   (or [test.deribit.com](https://test.deribit.com) for testnet).
2. Navigate to **Account** -> **API**.
3. Click **Add new key** and configure permissions:
   - Enable **read** for market data access
   - Enable **trade** for order execution
   - Enable **wallet** if you need account balance access
4. Note down your **Client ID** (API key) and **Client Secret** (API secret).

:::warning
Keep your API secret secure. Never share it or commit it to version control.
:::

### API key scopes

Each API key on Deribit is assigned a default access scope, which defines the maximum permissions.
Configure appropriate permissions when
[creating your API key](https://docs.deribit.com/articles/creating-api-key):

| Scope              | Required For                           |
| ------------------ | -------------------------------------- |
| `account:read`     | Account information, portfolio data.   |
| `trade:read`       | View orders and positions.             |
| `trade:read_write` | Place, modify, and cancel orders.      |
| `wallet:read`      | View balances and transaction history. |

**Recommended minimum for trading**: `account:read`, `trade:read_write`, `wallet:read`

:::tip
Follow the principle of least privilege. For data-only access (market data, no trading),
create a read-only key without `trade:read_write`.
:::

## Testnet

Deribit provides a testnet environment for testing strategies without real funds.
To use the testnet, set `environment=DeribitEnvironment.TESTNET` in your client configuration:

```python
from nautilus_trader.adapters.deribit import DeribitDataClientConfig
from nautilus_trader.adapters.deribit import DeribitEnvironment
from nautilus_trader.adapters.deribit import DeribitExecutionClientConfig
from nautilus_trader.adapters.deribit import DeribitProductType
from nautilus_trader.model import AccountId

product_types = [DeribitProductType.FUTURE]
account_id = AccountId.from_str("DERIBIT-001")

data_config = DeribitDataClientConfig(
    product_types=product_types,
    environment=DeribitEnvironment.TESTNET,
)

exec_config = DeribitExecutionClientConfig(
    account_id=account_id,
    product_types=product_types,
    environment=DeribitEnvironment.TESTNET,
)
```

When testnet mode is enabled:

- HTTP requests use `https://test.deribit.com`.
- WebSocket connections use `wss://test.deribit.com/ws/api/v2`.
- Loads credentials from `DERIBIT_TESTNET_API_KEY` and `DERIBIT_TESTNET_API_SECRET` environment variables.

:::note
Testnet API keys are separate from production keys. Create API keys specifically
for the testnet through the testnet interface at [test.deribit.com](https://test.deribit.com).
:::

## Configuration

### Data client configuration options

| Option                             | Default    | Description                                                        |
| ---------------------------------- | ---------- | ------------------------------------------------------------------ |
| `api_key`                          | `None`     | Deribit API key. Loads from environment variables when omitted.    |
| `api_secret`                       | `None`     | Deribit API secret. Loads from environment variables when omitted. |
| `product_types`                    | `[FUTURE]` | Product types to load.                                             |
| `environment`                      | `MAINNET`  | Environment enum (`MAINNET` or `TESTNET`).                         |
| `base_url_http`                    | `None`     | Override for the HTTP JSON-RPC base URL.                           |
| `base_url_ws`                      | `None`     | Override for the WebSocket base URL.                               |
| `proxy_url`                        | `None`     | Optional proxy URL for HTTP and WebSocket transports.              |
| `http_timeout_secs`                | `60`       | Request timeout in seconds for HTTP calls.                         |
| `max_retries`                      | `3`        | Maximum retry attempts for recoverable errors.                     |
| `retry_delay_initial_ms`           | `1,000`    | Initial delay in milliseconds before retrying.                     |
| `retry_delay_max_ms`               | `10,000`   | Maximum delay in milliseconds between retries.                     |
| `heartbeat_interval_secs`          | `30`       | WebSocket heartbeat interval.                                      |
| `auth_timeout_secs`                | `None`     | Seconds to await the WebSocket auth result; unset means 30.        |
| `update_instruments_interval_mins` | `60`       | Accepted but not yet acted on; instruments load once on connect.   |
| `auto_load_missing_instruments`    | `False`    | Lazy-load uncached instruments on subscribe.                       |
| `transport_backend`                | `Sockudo`  | WebSocket transport backend.                                       |

#### Lazy-load on subscribe

`subscribe_*` commands look up the instrument in the local cache before sending the WebSocket subscribe so the
handler can parse the inbound frames. With `auto_load_missing_instruments = False` (the default), a
subscription returns an error if its instrument was not preloaded by the configured `product_types`. It does
not silently succeed and then drop subsequent frames at the handler.

To load missing instruments on first subscribe, set `auto_load_missing_instruments = True`. The client fetches
the instrument over HTTP, seeds the WebSocket handler cache, and then forwards the subscribe. HTTP failures
are logged and the WebSocket subscribe is skipped.

### Execution client configuration options

| Option                   | Default    | Description                                                        |
| ------------------------ | ---------- | ------------------------------------------------------------------ |
| `account_id`             | Required   | Nautilus account ID for generated reports and events.              |
| `api_key`                | `None`     | Deribit API key. Loads from environment variables when omitted.    |
| `api_secret`             | `None`     | Deribit API secret. Loads from environment variables when omitted. |
| `product_types`          | `[FUTURE]` | Product types to load.                                             |
| `environment`            | `MAINNET`  | Environment enum (`MAINNET` or `TESTNET`).                         |
| `base_url_http`          | `None`     | Override for the HTTP JSON-RPC base URL.                           |
| `base_url_ws`            | `None`     | Override for the WebSocket base URL.                               |
| `proxy_url`              | `None`     | Optional proxy URL for HTTP and WebSocket transports.              |
| `http_timeout_secs`      | `60`       | Request timeout in seconds for HTTP calls.                         |
| `max_retries`            | `3`        | Maximum retry attempts for recoverable errors.                     |
| `retry_delay_initial_ms` | `1,000`    | Initial delay in milliseconds before retrying.                     |
| `retry_delay_max_ms`     | `10,000`   | Maximum delay in milliseconds between retries.                     |
| `auth_timeout_secs`      | `None`     | Seconds to await the WebSocket auth result; unset means 30.        |
| `transport_backend`      | `Sockudo`  | WebSocket transport backend.                                       |

`transport_backend` selects between the `Sockudo` and `Tungstenite` WebSocket transports. The default is
`Sockudo` when the `transport-sockudo` Cargo feature is enabled, as in published Python wheels. A Rust build
without that feature defaults to `Tungstenite`.

### Production configuration

Below is an example live node using Deribit data and execution clients:

```python
from nautilus_trader.adapters.deribit import DeribitDataClientConfig
from nautilus_trader.adapters.deribit import DeribitDataClientFactory
from nautilus_trader.adapters.deribit import DeribitEnvironment
from nautilus_trader.adapters.deribit import DeribitExecutionClientConfig
from nautilus_trader.adapters.deribit import DeribitExecutionClientFactory
from nautilus_trader.adapters.deribit import DeribitProductType
from nautilus_trader.common import Environment
from nautilus_trader.live import LiveNode
from nautilus_trader.model import AccountId
from nautilus_trader.model import TraderId

product_types = [DeribitProductType.FUTURE]
trader_id = TraderId.from_str("TRADER-001")
account_id = AccountId.from_str("DERIBIT-001")

node = (
    LiveNode.builder("DERIBIT-NODE-001", trader_id, Environment.LIVE)
    .add_data_client(
        None,
        DeribitDataClientFactory(),
        DeribitDataClientConfig(
            product_types=product_types,
            environment=DeribitEnvironment.MAINNET,
            api_key=None,
            api_secret=None,
        ),
    )
    .add_exec_client(
        None,
        DeribitExecutionClientFactory(),
        DeribitExecutionClientConfig(
            account_id=account_id,
            product_types=product_types,
            environment=DeribitEnvironment.MAINNET,
            api_key=None,
            api_secret=None,
        ),
    )
    .build()
)
```

### API credentials

There are multiple options for supplying your credentials to the Deribit clients.
Either pass the corresponding values to the configuration objects, or
set the following environment variables:

For Deribit live (production) clients:

- `DERIBIT_API_KEY`
- `DERIBIT_API_SECRET`

For Deribit testnet clients:

- `DERIBIT_TESTNET_API_KEY`
- `DERIBIT_TESTNET_API_SECRET`

:::tip
We recommend using environment variables to manage your credentials.
:::

### Product types

The `product_types` configuration option controls which Deribit product families are loaded.
Available options via the `DeribitProductType` enum:

- `DeribitProductType.FUTURE` - Perpetual and dated futures.
- `DeribitProductType.OPTION` - Call and put options.
- `DeribitProductType.SPOT` - Spot trading pairs.
- `DeribitProductType.FUTURE_COMBO` - Future spread instruments.
- `DeribitProductType.OPTION_COMBO` - Option spread instruments.

Example loading multiple product types:

```python
from nautilus_trader.adapters.deribit import DeribitDataClientConfig
from nautilus_trader.adapters.deribit import DeribitProductType

config = DeribitDataClientConfig(
    product_types=[
        DeribitProductType.FUTURE,
        DeribitProductType.OPTION,
    ],
    # ... other config
)
```

### Base URLs

The `environment` option selects these defaults. Set `base_url_http` or `base_url_ws` to point
either transport somewhere else, such as a local proxy or a capture harness.

| Environment | HTTP URL                   | WebSocket URL                      |
| ----------- | -------------------------- | ---------------------------------- |
| Production  | `https://www.deribit.com`  | `wss://www.deribit.com/ws/api/v2`  |
| Testnet     | `https://test.deribit.com` | `wss://test.deribit.com/ws/api/v2` |

## Server infrastructure

Deribit's matching engine is located in **Equinix LD4, Slough, UK**. For latency-sensitive strategies,
consider hosting in or near London. Colocation and cross-connect options are available directly
from Deribit for institutional clients.

For most users connecting via internet, the adapter's built-in retry logic, heartbeat monitoring,
and automatic reconnection handling provide reliable connectivity.

For more details, see the [Server Infrastructure article](https://support.deribit.com/hc/en-us/articles/25944617582877-Server-Infrastructure).

## Contributing

:::info
For additional features or to contribute to the Deribit adapter, please see our
[contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md).
:::
