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

### 订阅参数 {#subscription-parameters}

Nautilus 适配器通过订阅参数支持两类数据源：

| 参数       | 取值                   | 说明                                                                      |
| ---------- | ---------------------- | ------------------------------------------------------------------------- |
| `interval` | `raw`、`100ms`、`agg2` | `agg2` 以约 1 秒间隔批量发出。`raw` 需要鉴权。                            |
| `group`    | `none`、价格分组       | 默认 `none`。只作用于分组的非 raw 订单簿频道。                            |
| `depth`    | `1`、`10`、`20`        | 默认 `10`。分组订单簿频道每边的价格档位数。                               |

数据客户端按如下规则选择订单簿间隔：

1. 提供了 `params["interval"]` 时优先使用它。
2. WebSocket 连接已鉴权且未提供间隔时使用 `raw`。
3. 连接未鉴权时使用 Deribit 公开的 `100ms` 分组数据源。

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
原始订单簿数据源需要已鉴权的 WebSocket 连接。订阅原始数据源之前，请确认已配置 API 凭据。
:::

:::tip
对多数策略而言，100ms 聚合数据源以更低的消息开销提供足够的粒度。已提供凭据但不需要原始
逐笔订单簿更新时，设置 `params={"interval": "100ms"}`。
:::

### 序列缺口恢复 {#sequence-gap-recovery}

适配器记录它应用的每条订单簿消息的 `change_id`，并用每个增量更新的 `prev_change_id` 与之
核对。只有原始频道的更新携带 `prev_change_id`。聚合消息是自包含的快照，无需序列检查。

检测到缺口（漏掉消息），或订单簿消息中某个档位无法转换为 `Price` 或 `Quantity`（例如数值
超出其范围）时，适配器会自动：

1. 丢弃该消息，以及受影响工具的后续所有 delta。
2. 退订该工具的 delta 订单簿频道。
3. 退订得到确认后重新订阅，以获得新快照。
4. 每个重订频道投递出可成功转换的快照后恢复正常处理，并以其重播序列种子。

重同步期间，策略不会收到过期或不完整的订单簿更新。重同步待定时用户主动退订，会取消重订阅
而不是重开频道。

分组订单簿频道（`book.{instrument}.{group}.{depth}.{interval}`）每个间隔都发送完整快照，
因此适配器从不重同步它。转换失败的快照会被丢弃，下一条快照替换整个订单簿。

:::warning[每个工具只订阅一个 delta 订单簿频道]
同一工具的订单簿频道共享一套序列与重同步状态。一个工具可以有多个 delta 订单簿频道（例如
`raw` 与 `100ms`）。若重同步开始时其中一个仍在等初始快照，该频道可能一直处于退订状态，
直到下次重连。
:::

档位格式错误（包括无法解析为小数的值）时，适配器记一条警告并跳过该档位。金额按工具的
数量精度舍入后为零的档位按不存在处理：快照跳过它，增量更新删除它，适配器记一条警告。

## Funding 费率 {#funding-rates}

Deribit 持续结算 funding（每几秒一次），而不是像多数交易所那样按固定间隔。因此 Deribit 的
`FundingRateUpdate` 上 `interval` 字段为 `None`——这种连续模型无法映射为离散周期。

## Deribit 专属数据 {#deribit-specific-data}

### 订单簿汇总 {#book-summaries}

请求 `DeribitBookSummary` 自定义数据，可按货币与产品类别过滤，拉取一份批量快照。响应的每
一项包含 Nautilus 工具 ID、隐含波动率、未平仓合约量、价格、成交量，以及
`public/get_book_summary_by_currency` 返回的其他字段。

Actor 或策略通过一次 `on_historical_data` 回调收到完整响应。每一项是 `CustomData` 包装，
其 `data` 字段内含一个 `DeribitBookSummary`：

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

元数据字段 `currency` 是必需的。可选的 `kind` 字段默认为 `option`。由 Decimal 支撑的场所
字段（如 `mark_iv` 与 `open_interest`）在 Python 侧以字符串或 `None` 暴露。空响应会以空
列表调用一次 `on_historical_data`。场所请求失败时，记完错误后同样以空列表调用该回调。尚未
到达场所就被拒绝的请求（例如缺少 `currency`）不会产生回调。

### 波动率指数 {#volatility-index}

适配器从 Deribit 的 `deribit_volatility_index.{index_name}` WebSocket 频道发出
`DeribitVolatilityIndex` 自定义数据。Deribit 提供 `btc_usd`、`eth_usd` 等波动率指数流。

| 字段         | 类型    | 说明                                                     |
| ------------ | ------- | -------------------------------------------------------- |
| `index_name` | `str`   | Deribit 波动率指数名称，例如 `btc_usd`。                 |
| `volatility` | `float` | 当前波动率指数值。                                       |
| `ts_event`   | `int`   | 更新发生时刻的 UNIX 纳秒时间戳。                         |
| `ts_init`    | `int`   | 对象构建时刻的 UNIX 纳秒时间戳。                         |

Actor 或策略用 `DataType(DeribitVolatilityIndex.__name__)` 订阅，`index_name` 元数据键是
必需的：

```python
from nautilus_trader.adapters.deribit import DeribitVolatilityIndex
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType

self.subscribe_data(
    data_type=DataType(DeribitVolatilityIndex.__name__, metadata={"index_name": "btc_usd"}),
    client_id=ClientId.from_str("DERIBIT"),
)
```

## 订单能力 {#orders-capability}

下面是 Deribit 支持的订单类型、执行指示与有效期选项。

### 订单类型 {#order-types}

| Nautilus 订单类型        | Deribit 订单类型   | 支持      | 说明                                     |
| ------------------------ | ------------------ | --------- | ---------------------------------------- |
| `MARKET`                 | `market`           | ✓         | 按市价立即成交。                         |
| `LIMIT`                  | `limit`            | ✓         | 按指定价或更优价成交。                   |
| `STOP_MARKET`            | `stop_market`      | ✓         | 触发后的条件市价单。                     |
| `STOP_LIMIT`             | `stop_limit`       | ✓         | 触发后的条件限价单。                     |
| `MARKET_IF_TOUCHED`      | `take_market`      | ✓         | 止盈风格的市价单。                       |
| `LIMIT_IF_TOUCHED`       | `take_limit`       | ✓         | 止盈风格的限价单。                       |
| `TRAILING_STOP_MARKET`   | `trailing_stop`    | -         | *目前未实现*。                           |
| `TRAILING_STOP_LIMIT`    | N/A                | -         | *Deribit 不支持*。                       |
| `MARKET_TO_LIMIT`        | `market_limit`     | -         | *目前未实现*。                           |

### 执行指示 {#execution-instructions}

| 指示          | 支持      | 说明                                                                               |
| ------------- | --------- | ---------------------------------------------------------------------------------- |
| `post_only`   | ✓         | 若订单会吃掉流动性则拒绝该订单。使用 `reject_post_only=true`。                     |
| `reduce_only` | ✓         | 订单只能减少已有持仓。                                                             |

### 有效期 {#time-in-force}

| 有效期        | 支持      | 说明                                                   |
| ------------- | --------- | ------------------------------------------------------ |
| `GTC`         | ✓         | 撤销前有效（`good_til_cancelled`）。                   |
| `GTD`         | ✓         | 当日有效。UTC 8:00 到期（`good_til_day`）。            |
| `IOC`         | ✓         | 立即成交否则撤销（`immediate_or_cancel`）。            |
| `FOK`         | ✓         | 全部成交否则撤销（`fill_or_kill`）。                   |

Deribit 只对限价风格的订单应用有效期。适配器对 `MARKET`、`STOP_MARKET` 和
`MARKET_IF_TOUCHED` 订单省略 `time_in_force`，因为 Deribit 在市价风格的订单类型上会拒绝该
参数。

:::note
**Deribit 上的 GTD**：与其他接受任意到期时间的交易所不同，
Deribit 的 `good_til_day` 总是在当日或次日的 UTC 8:00 到期。自定义到期时间会被记为警告，
订单将采用交易所固定的到期行为。
:::

### 触发类型 {#trigger-types}

条件订单（止损单）支持多种触发价来源：

| 触发类型      | 支持      | 说明                                                 |
| ------------- | --------- | ---------------------------------------------------- |
| `last_price`  | ✓         | 使用最新成交价。`DEFAULT` 也用它。                   |
| `mark_price`  | ✓         | 使用标记价格。                                       |
| `index_price` | ✓         | 使用标的指数价格。                                   |

其他任何 Nautilus 触发类型都会从请求中丢弃而不是做映射。Deribit 要求止损与止盈订单必须带
`trigger`，因此条件订单请使用上述三种之一。

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

### 批量操作 {#batch-operations}

| 操作                     | 支持      | 说明                                                                     |
| ------------------------ | --------- | ------------------------------------------------------------------------ |
| 提交订单列表             | ✓         | 每笔订单作为独立的 Deribit 订单发送。场所层没有原子批量。                |
| 按订单 ID 批量撤销       | ✓         | 对每个场所订单 ID 分别发送 `private/cancel` 请求。                       |
| 按工具撤销全部           | ✓         | 未提供方向过滤时使用 `private/cancel_all_by_instrument`。                |
| 按方向过滤的撤销全部     | ✓         | 先在本地过滤缓存的未结订单，再逐一撤销匹配的订单。                       |
| 批量修改                 | -         | *目前未实现*：支持单笔订单修改。                                         |

### Post-only 行为 {#post-only-behavior}

Deribit 提供两种 post-only 模式：

1. **价格调整（Deribit 默认）**：若 post-only 订单会跨过价差成交，Deribit 自动把价格调整到
   价差内一个 tick。
2. **拒绝模式**：订单若会跨过价差则立即拒绝。

Nautilus 适配器使用**拒绝模式**（`reject_post_only=true`）以获得确定性行为。post-only 订单
若会吃掉流动性，会以错误码 `11054` 被拒绝，并发出 `OrderRejected` 事件，其
`due_post_only` 标志置为 `true`。

这让策略可以区分：

- 因违反 post-only（试图吃掉流动性）而被拒的订单。
- 因其他原因（保证金不足、价格无效等）被拒的订单。

### 订单修改 {#order-modification}

适配器使用 Deribit 原生的 `private/edit` 端点，而不是撤销加重下。这带来若干好处：

| 好处                   | 说明                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| 单次请求               | 比撤销 + 新下单更快、延迟更低。                                   |
| 保留队列优先级         | 只减少数量或保持同价时保住队列位置。                              |
| 保持成交历史           | 部分成交仍关联同一个订单 ID。                                     |

**队列优先级规则**：

- **只减少数量**：保留队列位置。
- **价格不变**：保留队列位置。
- **增加数量或改变价格**：失去队列位置（按新订单处理）。

修改命令必须携带场所订单 ID 和一个价格。缺少任一项时，适配器在本地拒绝该命令，不会到达
Deribit。数量是可选的，缺省回退到缓存订单的当前数量。

### 持仓管理 {#position-management}

| 特性             | 支持      | 说明                                                               |
| ---------------- | --------- | ------------------------------------------------------------------ |
| 查询持仓         | ✓         | 为对账从 `private/get_positions` 拉取。                            |
| 持仓模式         | -         | *Deribit 不支持*：仅净持仓模式。                                   |
| 杠杆控制         | -         | *Deribit 不支持*：没有直接的杠杆设置。                             |
| 保证金模式       | -         | *目前未实现*：Deribit 暴露账户保证金模式。                         |

执行客户端订阅 `user.orders`、`user.trades` 和 `user.portfolio`（余额与保证金），而不是
Deribit 的合并频道 `user.changes`，因此没有持仓推送到达适配器。实时持仓状态由 Nautilus 根据
`user.trades` 上的成交维护，`private/get_positions` 提供对账比对用的场所快照。

### 订单查询 {#order-querying}

| 特性             | 支持      | 说明                           |
| ---------------- | --------- | ------------------------------ |
| 查询未结订单     | ✓         | 列出全部活动订单。             |
| 查询订单历史     | ✓         | 历史订单数据。                 |
| 订单状态更新     | ✓         | 实时订单状态变化。             |
| 成交历史         | ✓         | 执行与成交报告。               |

### 条件关联订单 {#contingent-orders}

| 特性                           | 支持      | 说明                                                                           |
| ------------------------------ | --------- | ------------------------------------------------------------------------------ |
| 订单列表                       | ✓         | 作为独立订单依次提交；场所层没有原子列表。                                     |
| 原生关联订单                   | -         | *目前未实现*：Deribit 暴露 `linked_order_type`。                               |
| OCO 订单                       | -         | *目前未实现*：Deribit 暴露 `one_cancels_other`。                               |
| 括弧订单（bracket）            | -         | *目前未实现*：Deribit 暴露 `one_triggers_one_cancels_other`。                  |
| 条件止损单                     | ✓         | 止损市价与止损限价订单。                                                       |
| 条件止盈单                     | ✓         | 触价市价（MARKET_IF_TOUCHED）与触价限价（LIMIT_IF_TOUCHED）订单。              |

### 强平处理 {#liquidation-handling}

Deribit 为任何由强平触发的成交打标签。在 `user.trades` 流和 `private/get_user_trades_*`
端点上，可选的 `liquidation` 字段指出被强平的是哪一边：

| 取值   | 含义                           |
| ------ | ------------------------------ |
| `"M"`  | 挂单方（maker）被强平。        |
| `"T"`  | 吃单方（taker）被强平。        |
| `"MT"` | 双方都被强平。                 |
| 缺失   | 普通非强平成交。               |

对每一笔带强平标签的成交，适配器记一条警告，附上工具、成交 ID、订单 ID 与强平方向，然后
通过正常管线发出 `FillReport`。Deribit 不运营独立于「强平 + 保险基金 / 组合保证金」流程的
ADL 机制，因此没有单独的 ADL 信号需要呈现。

上游参考：

- [`user.trades.{instrument_name}.{interval}` 频道](https://docs.deribit.com/subscriptions/user/usertradesinstrument_nameinterval)
- [强平文档](https://support.deribit.com/hc/en-us/articles/25944769313309-Liquidations)

## 速率限制 {#rate-limiting}

Deribit 使用基于信用（credit）的、按端点区分的速率限制。Deribit 官方的限制是权威的，且会
因端点、账户层级和当前场所策略而异。适配器增加本地令牌桶以减少可避免的限流，但不取代
Deribit 自己的服务端检查。

### HTTP 限制 {#http-limits}

每个 HTTP 请求消耗全局桶，以及一个以 `deribit:{method}` 为键、使用全局限额的按方法桶。若
JSON-RPC 方法属于订单或账户类别，它还会消耗对应的桶。

| 桶 / 键            | 适配器桶              | 说明                                                         |
| ------------------ | --------------------- | ------------------------------------------------------------ |
| `deribit:global`   | 20 请求/秒，突发 100  | 应用于每个 HTTP 请求。                                       |
| `deribit:orders`   | 5 请求/秒，突发 20    | 直接驱动 HTTP 客户端时的撮合引擎方法。                       |
| `deribit:account`  | 5 请求/秒，突发 5     | 账户、持仓、订单状态与用户成交端点。                         |
| `deribit:{method}` | 20 请求/秒，突发 100  | 按方法桶；回退到全局限额。                                   |

### WebSocket 限制 {#websocket-limits}

| 操作                | 适配器桶            | 说明                                                         |
| ------------------- | ------------------- | ------------------------------------------------------------ |
| 订阅/退订           | 3 请求/秒，突发 10  | 也是所有非订单 WebSocket 请求的默认桶。                      |
| 订单操作            | 5 请求/秒，突发 20  | 通过 WebSocket 的买入、卖出、编辑与撤销。                    |

:::note
Nautilus 适配器使用 WebSocket（而非 HTTP）提交订单以降低延迟。订单操作受
`DERIBIT_WS_ORDER_QUOTA`（5 请求/秒，突发 20）限制。
:::

### 信用制体系的细节 {#credit-based-system-details}

Deribit 持续补充非撮合引擎信用。当前公开文档列出的默认非撮合引擎池如下：

**非撮合引擎请求**：

| 参数           | 取值               | 说明                          |
| -------------- | ------------------ | ----------------------------- |
| 每请求成本     | 500 信用           | 每次 API 调用消耗信用。       |
| 池上限         | 50,000 信用        | 允许 100 次请求的突发。       |
| 补充速率       | 10,000 信用/秒     | 约 20 次/秒的持续请求速率。   |

**撮合引擎请求（默认层级）**：

| 参数         | 取值           | 说明                             |
| ------------ | -------------- | -------------------------------- |
| 持续速率     | 5 请求/秒      | 连续速率限制。                   |
| 突发容量     | 20 次请求      | 触发限流前的最大突发。           |

做市商与高交易量交易者可以按 7 天交易量层级获得更高的撮合引擎限额。

Deribit 的某些端点有更严格的方法级限制。例如当前场所文档列出
`public/get_instruments` 为 1 请求/秒、突发 50 次，订阅方法约为 3.3 请求/秒、突发 10 次。
请把 `product_types` 限定在你需要的产品族内，并避免在实盘系统中反复全量重载工具。

Nautilus 适配器实现了覆盖面较广的令牌桶限流器，配置如下：

- `DERIBIT_HTTP_REST_QUOTA`：20 请求/秒，突发 100（全局与按方法的 HTTP）
- `DERIBIT_HTTP_ORDER_QUOTA`：5 请求/秒，突发 20（撮合引擎 HTTP）
- `DERIBIT_HTTP_ACCOUNT_QUOTA`：5 请求/秒，突发 5（账户 HTTP）
- `DERIBIT_WS_ORDER_QUOTA`：5 请求/秒，突发 20（撮合引擎 WebSocket）
- `DERIBIT_WS_SUBSCRIPTION_QUOTA`：3 请求/秒，突发 10（订阅、退订及其他非订单请求）

更多细节见[速率限制文章](https://docs.deribit.com/articles/rate-limits)。

:::warning
超出允许的配额时，Deribit 返回错误码 `10028`（too_many_requests）。反复违规可能导致临时
限流。
:::

## 连接管理 {#connection-management}

### 平台限制 {#platform-limits}

| 限制                                               | Deribit 当前指引 |
| -------------------------------------------------- | ---------------- |
| 每个 API key 或登录的活动会话数                    | 16               |
| 每 IP 的会话与连接级连接数                         | 32               |
| 每个浏览器会话的 Web 应用连接数                    | 2                |

### 基于会话的鉴权 {#session-based-authentication}

适配器为数据与执行客户端使用**相互独立的 WebSocket 会话**，各自带自己的鉴权范围：

| 客户端         | 会话名称             | 用途                                                |
| -------------- | -------------------- | --------------------------------------------------- |
| 数据客户端     | `nautilus-data`      | 行情数据订阅（原始数据源需要鉴权）。                |
| 执行客户端     | `nautilus-execution` | 订单操作（买入、卖出、编辑、撤销）。                |

**鉴权流程**：

1. WebSocket 连接到 Deribit。
2. 客户端使用带会话范围的 `client_signature` 授权类型完成鉴权。
3. 令牌在过期前刷新。
4. 重连时以指数退避重试重新鉴权（至多 3 次）。全部尝试失败时，只恢复公开频道的订阅。

这种基于会话的方式带来：

- 按客户端类型独立管理令牌。
- 隔离故障域（数据侧鉴权失败不影响执行）。
- 在 Deribit 会话日志中有清晰的审计线索。

### 最佳实践 {#best-practices}

适配器遵循 Deribit 的
[推荐连接实践](https://docs.deribit.com/articles/connection-management-best-practices)：

1. **使用 WebSocket 订阅**获取实时数据而非 REST 轮询，请求更少、延迟更低、速率限制消耗
   更少。
2. **对所有连接做鉴权**（在提供了凭据时）。已鉴权用户享有更高速率限制，也更不容易被按 IP
   限流。
3. **实现心跳**（默认 30 秒间隔）以维持连接健康、尽早发现断连。
4. **自动处理重连**，包括重新鉴权与订阅恢复。

:::tip
即使只访问公开数据也请提供 API 凭据。已鉴权连接拥有更高限额，且高负载期间 Deribit 会先
联系已鉴权客户端再施加限制。
:::

:::note
适配器默认使用 30 秒心跳间隔。Deribit 要求 WebSocket 心跳间隔至少 10 秒。
:::

## 鉴权 {#authentication}

Deribit 对私有端点使用带 HMAC-SHA256 签名的 API key 鉴权。

创建 API 凭据的步骤：

1. 登录你的 Deribit 账户：[deribit.com](https://www.deribit.com)
   （testnet 用 [test.deribit.com](https://test.deribit.com)）。
2. 进入 **Account** -> **API**。
3. 点击 **Add new key** 并配置权限：
   - 启用 **read** 以访问行情数据
   - 启用 **trade** 以执行订单
   - 需要访问账户余额时启用 **wallet**
4. 记下你的 **Client ID**（API key）与 **Client Secret**（API secret）。

:::warning
妥善保管 API secret。绝不外传，也绝不提交进版本控制。
:::

### API key 范围 {#api-key-scopes}

Deribit 上每个 API key 都被分配一个默认访问范围，它定义最大权限。
[创建 API key](https://docs.deribit.com/articles/creating-api-key)时请配置合适的权限：

| 范围               | 用于                                 |
| ------------------ | ------------------------------------ |
| `account:read`     | 账户信息、组合数据。                 |
| `trade:read`       | 查看订单与持仓。                     |
| `trade:read_write` | 下单、改单与撤单。                   |
| `wallet:read`      | 查看余额与交易历史。                 |

**交易的建议最小集合**：`account:read`、`trade:read_write`、`wallet:read`

:::tip
遵循最小权限原则。只做数据访问（行情数据、不交易）时，创建不含 `trade:read_write` 的
只读 key。
:::

## 测试网 {#testnet}

Deribit 提供测试网环境，可以在没有真实资金的情况下测试策略。使用测试网时，在客户端配置中
设置 `environment=DeribitEnvironment.TESTNET`：

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

启用测试网模式时：

- HTTP 请求使用 `https://test.deribit.com`。
- WebSocket 连接使用 `wss://test.deribit.com/ws/api/v2`。
- 凭据从 `DERIBIT_TESTNET_API_KEY` 与 `DERIBIT_TESTNET_API_SECRET` 环境变量加载。

:::note
测试网 API key 与生产环境的 key 是分开的。请通过 [test.deribit.com](https://test.deribit.com)
的测试网界面专门为测试网创建 API key。
:::

## 配置 {#configuration}

### 数据客户端配置选项 {#data-client-configuration-options}

| 选项                               | 默认值     | 说明                                                               |
| ---------------------------------- | ---------- | ------------------------------------------------------------------ |
| `api_key`                          | `None`     | Deribit API key。省略时从环境变量加载。                             |
| `api_secret`                       | `None`     | Deribit API secret。省略时从环境变量加载。                          |
| `product_types`                    | `[FUTURE]` | 要加载的产品类型。                                                  |
| `environment`                      | `MAINNET`  | 环境枚举（`MAINNET` 或 `TESTNET`）。                               |
| `base_url_http`                    | `None`     | HTTP JSON-RPC 基础 URL 的覆盖值。                                   |
| `base_url_ws`                      | `None`     | WebSocket 基础 URL 的覆盖值。                                       |
| `proxy_url`                        | `None`     | HTTP 与 WebSocket 传输的可选代理 URL。                              |
| `http_timeout_secs`                | `60`       | HTTP 调用的请求超时（秒）。                                         |
| `max_retries`                      | `3`        | 可恢复错误的最大重试次数。                                          |
| `retry_delay_initial_ms`           | `1,000`    | 重试前的初始延迟（毫秒）。                                          |
| `retry_delay_max_ms`               | `10,000`   | 重试之间的最大延迟（毫秒）。                                        |
| `heartbeat_interval_secs`          | `30`       | WebSocket 心跳间隔。                                                |
| `auth_timeout_secs`                | `None`     | 等待 WebSocket 鉴权结果的秒数；未设置表示 30。                      |
| `update_instruments_interval_mins` | `60`       | 接受该参数但尚未生效；工具只在连接时加载一次。                      |
| `auto_load_missing_instruments`    | `False`    | 订阅时懒加载未缓存的工具。                                          |
| `transport_backend`                | `Sockudo`  | WebSocket 传输后端。                                                |

#### 订阅时懒加载 {#lazy-load-on-subscribe}

`subscribe_*` 命令在发送 WebSocket 订阅之前先查本地缓存中的工具，处理器才能解析入站帧。
`auto_load_missing_instruments = False`（默认值）时，若订阅的工具没有被配置的
`product_types` 预加载，该订阅返回错误。它不会先静默成功、再在处理器处丢弃后续帧。

要在首次订阅时加载缺失的工具，设置 `auto_load_missing_instruments = True`。客户端通过
HTTP 拉取该工具、为 WebSocket 处理器缓存做种子，然后转发订阅。HTTP 失败会被记日志，
WebSocket 订阅会被跳过。

### 执行客户端配置选项 {#execution-client-configuration-options}

| 选项                     | 默认值     | 说明                                                               |
| ------------------------ | ---------- | ------------------------------------------------------------------ |
| `account_id`             | 必需       | 生成报告与事件所用的 Nautilus 账户 ID。                             |
| `api_key`                | `None`     | Deribit API key。省略时从环境变量加载。                             |
| `api_secret`             | `None`     | Deribit API secret。省略时从环境变量加载。                          |
| `product_types`          | `[FUTURE]` | 要加载的产品类型。                                                  |
| `environment`            | `MAINNET`  | 环境枚举（`MAINNET` 或 `TESTNET`）。                               |
| `base_url_http`          | `None`     | HTTP JSON-RPC 基础 URL 的覆盖值。                                   |
| `base_url_ws`            | `None`     | WebSocket 基础 URL 的覆盖值。                                       |
| `proxy_url`              | `None`     | HTTP 与 WebSocket 传输的可选代理 URL。                              |
| `http_timeout_secs`      | `60`       | HTTP 调用的请求超时（秒）。                                         |
| `max_retries`            | `3`        | 可恢复错误的最大重试次数。                                          |
| `retry_delay_initial_ms` | `1,000`    | 重试前的初始延迟（毫秒）。                                          |
| `retry_delay_max_ms`     | `10,000`   | 重试之间的最大延迟（毫秒）。                                        |
| `auth_timeout_secs`      | `None`     | 等待 WebSocket 鉴权结果的秒数；未设置表示 30。                      |
| `transport_backend`      | `Sockudo`  | WebSocket 传输后端。                                                |

`transport_backend` 在 `Sockudo` 与 `Tungstenite` 两种 WebSocket 传输之间选择。启用了
`transport-sockudo` Cargo feature 时默认是 `Sockudo`，已发布的 Python wheel 即如此。没有该
feature 的 Rust 构建默认使用 `Tungstenite`。

### 生产环境配置 {#production-configuration}

下面是一个使用 Deribit 数据与执行客户端的实盘节点示例：

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

### API 凭据 {#api-credentials}

向 Deribit 客户端提供凭据有多种方式。或者把对应值传入配置对象，或者设置以下环境变量：

Deribit 实盘（生产）客户端：

- `DERIBIT_API_KEY`
- `DERIBIT_API_SECRET`

Deribit 测试网客户端：

- `DERIBIT_TESTNET_API_KEY`
- `DERIBIT_TESTNET_API_SECRET`

:::tip
推荐使用环境变量管理凭据。
:::

### 产品类型 {#product-types}

`product_types` 配置项控制加载哪些 Deribit 产品族。`DeribitProductType` 枚举可用的选项：

- `DeribitProductType.FUTURE` —— 永续与到期期货。
- `DeribitProductType.OPTION` —— 买权与卖权期权。
- `DeribitProductType.SPOT` —— 现货交易对。
- `DeribitProductType.FUTURE_COMBO` —— 期货价差工具。
- `DeribitProductType.OPTION_COMBO` —— 期权价差工具。

加载多个产品类型的示例：

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

### 基础 URL {#base-urls}

`environment` 选项选择以下默认值。设置 `base_url_http` 或 `base_url_ws` 可把对应传输指向
别处，例如本地代理或抓包工具。

| 环境       | HTTP URL                   | WebSocket URL                      |
| ---------- | -------------------------- | ---------------------------------- |
| 生产环境   | `https://www.deribit.com`  | `wss://www.deribit.com/ws/api/v2`  |
| 测试网     | `https://test.deribit.com` | `wss://test.deribit.com/ws/api/v2` |

## 服务器基础设施 {#server-infrastructure}

Deribit 的撮合引擎位于**英国斯劳的 Equinix LD4**。对延迟敏感的策略，考虑部署在伦敦或邻近
地区。机构客户可直接从 Deribit 获得托管与交叉连接选项。

对多数通过互联网连接的用户，适配器内置的重试逻辑、心跳监控与自动重连处理足以提供可靠的
连接。

更多细节见[服务器基础设施文章](https://support.deribit.com/hc/en-us/articles/25944617582877-Server-Infrastructure)。

## 参与贡献 {#contributing}

:::info
要获取更多特性或为 Deribit 适配器做贡献，请见我们的
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
