# Kraken

Kraken 适配器支持 Kraken 现货（Spot）与 Kraken 衍生品（Futures）的实时行情数据与订单
执行。

## 概览 {#overview}

适配器以 Rust 实现并带 Python 绑定，不需要外部的 Kraken 客户端库。每个数据或执行配置通过
其 `product_type` 选择 Spot 或 Futures 客户端。

主要的 Python 组件：

- `KrakenDataClientConfig` 与 `KrakenExecutionClientConfig`：实盘客户端配置。
- `KrakenDataClientFactory` 与 `KrakenExecutionClientFactory`：交易节点构建器使用的工厂。
- `KrakenSpotHttpClient` 与 `KrakenFuturesHttpClient`：供直接发请求的较低层 HTTP 访问。

Rust crate 还暴露 `KrakenSpotWebSocketClient` 与 `KrakenFuturesWebSocketClient`，供更低层的
WebSocket 访问。

通过实盘交易节点配置适配器，或者用低层客户端做直接的 API 访问。

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/kraken/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/kraken/examples/)

## Kraken 文档 {#kraken-documentation}

- [Kraken API 文档](https://docs.kraken.com/)
- [Kraken 现货 REST API](https://docs.kraken.com/exchange/guides/rest/introduction)
- [Kraken 衍生品 API](https://docs.kraken.com/exchange/guides/futures/introduction)

## 产品 {#products}

适配器支持这些产品类别：

| 产品类型                | 支持      | 说明                                                  |
| ----------------------- | --------- | ----------------------------------------------------- |
| 现货货币对              | ✓         | 现金交易，合格对支持保证金。                          |
| 现货代币化资产          | ✓         | 从 Kraken 的 `tokenized_asset` 资产类加载。           |
| 期货                    | ✓         | Kraken 期货 API 返回的工具。                          |

:::warning
Kraken 期货可能返回需要超过标准精度模式九位小数的工具定义。Futures 请保持启用
[高精度模式](./../getting_started/installation.md#precision-mode)。标准精度模式仍支持
Spot，但只要有定义无法解析，Futures 客户端就无法启动或返回工具。Futures 目录请求不会返回
部分结果，也从不四舍五入、钳制或省略不受支持的定义。
:::

:::note
**每个客户端单一产品类型**：每个 Kraken 数据或执行客户端只配置一个 `product_type`
（`SPOT` 或 `FUTURES`）。单个客户端不会横跨两个市场。
:::

## 现货工具费率 {#spot-instrument-fees}

现货工具加载不会填充场所的 maker 或 taker 费率，也不会调用 Kraken 的 `TradeVolume` 端点。

缺少 `Funds permissions - Query`（**Query Funds**）权限的现货 API key，在执行客户端请求
账户状态时会失败。

## K 线流 {#bar-streaming}

### 支持的间隔 {#supported-intervals}

现货订阅 `EXTERNAL` K 线即可接收 Kraken 的 WebSocket OHLC 数据。可用间隔如下：

| 间隔       | BarType 规格          |
| ---------- | --------------------- |
| 1 分钟     | `1-MINUTE-LAST`       |
| 5 分钟     | `5-MINUTE-LAST`       |
| 15 分钟    | `15-MINUTE-LAST`      |
| 30 分钟    | `30-MINUTE-LAST`      |
| 1 小时     | `1-HOUR-LAST`         |
| 4 小时     | `4-HOUR-LAST`         |
| 1 天       | `1-DAY-LAST`          |
| 1 周       | `1-WEEK-LAST`         |
| 15 天      | `15-DAY-LAST`         |

:::note
**Futures 限制**：Kraken 期货不支持通过 WebSocket 的 K 线流。历史 K 线数据请改用
`request_bars()`。
:::

### K 线发出延迟 {#bar-emission-latency}

Kraken 的
[现货 WebSocket OHLC 频道](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/ohlc)
在成交事件上更新当前未完成的 K 线。它不提供标记 K 线已收盘的字段。

正常流式传输期间，适配器缓冲当前 K 线，并在收到带新 `interval_begin` 的更新后发出它。
因此延迟取决于下一个区间的首笔成交；对没有成交的市场，它不以一个 K 线周期为界。WebSocket
消息处理器停止时，适配器会刷出其缓冲的 K 线，包括可能仍不完整的当前 K 线。

适配器使用缓冲而非基于定时器的发出，原因是：

- 基于定时器的发出可能漏掉 K 线收盘前的最后一次更新。
- Kraken 的更新不保证恰好在区间边界到达。

:::tip
要降低 K 线延迟，请订阅成交 tick 并用 `BarAggregator` 做 `INTERNAL` 聚合。时间 K 线使用
本地定时器，无需等待 Kraken 下一区间的首笔成交，并在各场所间使用一致的聚合行为。
:::

## 符号体系 {#symbology}

### 现货 symbol 规范化 {#spot-symbol-normalization}

适配器对现货与期货使用不同的比特币 symbol 约定：

| 市场    | Symbol 格式 | 示例               | 说明                                         |
| ------- | ----------- | ------------------ | -------------------------------------------- |
| 现货    | `BTC`       | `BTC/USD.KRAKEN`   | 适配器在加载时把 XBT 规范化为 BTC。          |
| 期货    | `XBT`       | `PI_XBTUSD.KRAKEN` | 工具 symbol 保留 Kraken 原生的 XBT。         |

:::note
Kraken 的 REST API 对比特币可能返回 `XBT`，而其 WebSocket v2 API 要求 `BTC`。适配器加载工具
时把现货 symbol 规范化为 `BTC`——无论 `XBT` 出现在基础货币（如 `XBT/USD` 变 `BTC/USD`）还是
报价货币（如 `ETH/XBT` 变 `ETH/BTC`）。期货工具 symbol 保留 Kraken 原生的 `XBT` 格式。期货
货币代码则不然，遵循与现货相同的[货币代码映射](#currency-codes)。
:::

Kraken 在部分现货响应中还用 `XDG` 表示狗狗币。适配器把它规范化为 `DOGE`，报价货币 symbol
也不例外。

### 货币代码 {#currency-codes}

适配器把 Kraken 的遗留资产代码按一致的映射用于工具、余额、费用与货币配置：

- `XXBT` 与 `XBT` 变为 `BTC`。
- `XXDG` 与 `XDG` 变为 `DOGE`。
- `ZEUR` 变为 `EUR`，`ZUSD` 变为 `USD`。

映射使用显式表（与 Kraken 自己的 CLI 一样），而不是剥前缀。`XTZ`、`XRP`、`XLM`、`XAUT`、
`ZRX` 与 `ZEC` 都是合法代码。未列入表的代码原样通过。

配置接受任一拼写。例如 `spot_positions_quote_currency="ZEUR"` 与 `"EUR"` 都匹配欧元计价的
工具。

费用在可用时使用场所上报的货币。期货成交可以携带费用货币，在反向合约上那是基础货币而不是
报价货币。现货 `TradesHistory` 只报告费用金额，因此这些佣金使用工具的报价货币。

#### 从早先的货币代码迁移 {#migration-from-earlier-currency-codes}

:::warning
请迁移或重建在货币规范化之前写入的缓存与数据库。已存储的工具、成交、持仓与余额可能使用
下面列出的早先代码。
:::

早先的映射因来源而异：

- 工具保留 `XXBT`、`XETH`、`XXDG`、`ZUSD` 与 `ZEUR`，其成交与持仓同样如此。它们现在变为
  `BTC`、`ETH`、`DOGE`、`USD` 与 `EUR`。
- 现货余额与保证金汇总的资产会丢失一个前导 `X` 或 `Z`，留下 `XBT` 与 `XDG` 而不是 `BTC`
  与 `DOGE`，以及 `TZ`、`RX`、`AUT` 而不是 `XTZ`、`ZRX`、`XAUT`。在显式映射下 `KFEE` 变为
  `FEE`。
- 期货余额保留钱包的字面拼写：现金与保证金钱包用 `xbt`，弹性（flex）钱包用 `XBT`。两者都
  变为 `BTC`。`usd` 变为 `USD`。

#### 期货钱包聚合 {#futures-wallet-aggregation}

规范化代码相同的期货余额合并为一个条目。总额与锁定金额跨钱包求和。总额非负时，每个钱包的
锁定金额被限定在 `[0, total]` 内。总额为负时保留其上报的锁定金额。聚合结果本身不做钳制。
因此预留超过合计持有量时，可用余额可以为负，以保留实际的缺口。

此前，相互独立的钱包条目会在账户中彼此覆盖，只剩最后读到的那个条目。

#### 金额精度 {#money-precision}

规范化后的代码可能解析为精度不同的内置货币。此前 `ZEUR`、`ZUSD` 等未知代码注册为八位小数
的加密货币。内置的 `EUR` 与 `USD` 用两位，`JPY` 用零位。这影响工具报价货币、REST 成交佣金
与推导的盈亏。

账户余额保留八位小数，因为其解析器直接构建货币而不经过注册表。期货弹性 `portfolioValue`
条目与全账户 USD 保证金条目也使用这个八位小数的货币。它们此前使用两位小数的 `USD`，因此
精度只升不降。

### 现货市场 {#spot-markets}

NautilusTrader 对 Kraken 现货工具使用规范化、斜杠分隔的 symbol。适配器在内部把它们翻译成
Kraken 的原生格式。

**工具 ID 格式**：

```python
from nautilus_trader.model import InstrumentId


InstrumentId.from_str("BTC/USD.KRAKEN")  # Spot BTC/USD
InstrumentId.from_str("ETH/USD.KRAKEN")  # Spot ETH/USD
InstrumentId.from_str("SOL/USD.KRAKEN")  # Spot SOL/USD
InstrumentId.from_str("BTC/USDT.KRAKEN")  # Spot BTC/USDT
InstrumentId.from_str("ETH/BTC.KRAKEN")  # Spot ETH/BTC (normalized from ETH/XBT)
```

### 期货市场 {#futures-markets}

Kraken 期货 symbol 使用合约前缀：

- `PI_`：反向永续合约（例如 `PI_XBTUSD`）。
- `PF_`：线性多保证金永续合约（例如 `PF_XBTUSD`）。
- `PV_`：香草（vanilla）永续合约（例如 `PV_XRPXBT`）。
- `FI_`：反向固定到期合约（例如 `FI_XBTUSD_230929`）。
- `FF_`：线性固定到期合约。

Kraken 的
[ticker symbol 参考](https://support.kraken.com/articles/360022835891-ticker-symbols-derivatives)列出了
主要合约前缀。请通过返回的工具目录确定哪些合约可用，示例 symbol 可能指向已过期或未上架的
合约。

**工具 ID 格式**：

```python
from nautilus_trader.model import InstrumentId


InstrumentId.from_str("PI_XBTUSD.KRAKEN")  # Perpetual inverse BTC
InstrumentId.from_str("PI_ETHUSD.KRAKEN")  # Perpetual inverse ETH
InstrumentId.from_str("PF_XBTUSD.KRAKEN")  # Perpetual linear multi-collateral BTC
```

## 数据能力 {#data-capabilities}

### 订阅（实时） {#subscriptions-real-time}

| 数据类型            | 现货   | 期货   | 说明                                     |
| ------------------- | ----   | ------ | ---------------------------------------- |
| `QuoteTick`         | ✓      | ✓      | 现货 ticker；期货 L2 订单簿。            |
| `TradeTick`         | ✓      | ✓      |                                          |
| `OrderBookDeltas`   | ✓      | ✓      | 现货 L2/L3 与期货 L2 更新。              |
| `OrderBookDepth`    | -      | -      | 请用深度 `10` 的 `OrderBookDeltas`。     |
| `Bar`               | ✓      | -      | 现货 WS OHLC 频道。见 K 线一节。         |
| `MarkPriceUpdate`   | -      | ✓      | 来自期货 ticker 流。                     |
| `IndexPriceUpdate`  | -      | ✓      | 来自期货 ticker 流。                     |
| `FundingRateUpdate` | -      | ✓      | 仅永续合约。                             |
| `InstrumentStatus`  | -      | -      | 实盘客户端不发状态更新。                 |

### 请求（历史） {#requests-historical}

| 数据类型               | 现货   | 期货   | 说明                                   |
| ---------------------- | ----   | ------ | -------------------------------------- |
| `TradeTick`            | ✓      | ✓      |                                        |
| `Bar`                  | ✓      | ✓      |                                        |
| `OrderBook`（快照）    | ✓      | ✓      | 经由 HTTP 深度端点。                   |
| `FundingRateUpdate`    | -      | ✓      | 客户端侧起止/limit 过滤。              |

### L2 订单簿校验和验证 {#l2-book-checksum-validation}

Kraken 的
[现货 L2 `book` 频道](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/book)
在快照与更新中为两侧的前十档携带一个 CRC32 校验和。适配器默认针对本地影子订单簿验证它，
价格用 `AssetPairs` 的 `pair_decimals`，数量用 `lot_decimals`。某些对的线上价格刻度比其
tick 大小细一位。工具在其元数据中保留那个更细的刻度，使校验和渲染不会截断价格位数。
Kraken 期货的 `book` 消息不携带校验和。

#### 恢复与流身份 {#recovery-and-stream-identity}

校验和不匹配时，适配器发出一个 `Clear` delta，丢弃影子订单簿，并按配置的深度带快照退订再
重新订阅该 symbol。在该快照到达之前它忽略更新。每次 `book` 退订都带上其深度：Kraken 按
symbol 与深度为订阅建键，省略的退订深度默认为 `10`。

恢复与用户的订阅变更串行执行，因此过期的恢复绝不会取消一个替换订阅。订阅请求会标识每条流。
Kraken 确认该请求之后，适配器只接受该 symbol 最新流的帧，丢弃来自被替换订阅与被取代恢复的
帧。快照只有在成功解析并应用之后才改变订单簿。在已接受的快照或重连之前发出的恢复请求，在该
事件之后什么都不发送。

在帧处理之外丢弃影子订单簿时，适配器同样发出 `Clear` delta。这发生在这些事件上：

- 重连。
- 新流得到确认。
- 最新订阅请求被拒绝。
- 快照看门狗检测到未获确认的最新请求。

#### 快照缺失与订阅被拒 {#missing-snapshots-and-rejected-subscriptions}

快照看门狗是 `book` 恢复唯一的重试机制。即使禁用校验和验证它也会运行，因为它还恢复从未收到
快照的流。每个替换订阅都重新开始一次全新等待，而不继承其前身的重试计数。

10 秒内没有快照到达时，数据客户端再次请求它。请求之间的等待逐次翻倍（`10`、`20`、`40`、
`80`、`160` 秒），至多五次请求。到达上限时记一条错误并停止重试。订单簿保持清空、更新被丢弃，
直到快照到达。订阅变更或重连会重新开始恢复。

Kraken 拒绝最新订阅请求时，会清空持有的订单簿，并以 error 级别记录场所原因与下次请求时间。
该拒绝计为一次失败请求，因此下一次尝试在 20 秒之后。再四次拒绝大约在五分钟内耗尽配额。因此
瞬时拒绝可以在 20 秒后的下一次尝试恢复。对被取代请求的拒绝会被忽略。

重连时，适配器作废其记录的订阅，并以原请求 ID 重放每个订阅。重放的响应匹配不到任何活动请求。
若 Kraken 拒绝重放，看门狗会在其 10 秒基础等待之内检测到快照缺失。

#### 反复的校验和不匹配 {#repeated-checksum-mismatches}

同一工具上三次不匹配、其间没有有效更新时，该工具的验证被禁用并记录错误。适配器按收到的样子
保留其订单簿，避免 Kraken 以不同方式哈希时陷入重订阅循环。有效快照不会重置不匹配计数。

要禁用 L2 校验和验证：

```python
config = KrakenDataClientConfig(
    validate_l2_checksum=False,
)
```

## L3 订单簿（按单，market-by-order） {#l3-order-book-market-by-order}

Kraken 通过 WebSocket v2 的
[`level3` 频道](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/level3)
（地址 `wss://ws-l3.kraken.com/v2`）暴露现货的逐单订单簿数据。它提供场所订单 ID、逐单数量
与真正的增量事件（`add`、`modify`、`delete`）。适配器把每个场所订单 ID 哈希进
NautilusTrader 使用的 `u64` 型 `BookOrder.order_id` 字段。

### 前置条件 {#prerequisites}

L3 订阅需要带 `WebSocket interface - On` 权限的现货 API 凭据，适配器用它获取
[鉴权令牌](https://docs.kraken.com/api-reference/trading/get-websockets-token)。把凭据传入
`KrakenDataClientConfig`：

```python
from nautilus_trader.adapters.kraken import KrakenDataClientConfig

config = KrakenDataClientConfig(
    api_key="YOUR_KEY",
    api_secret="YOUR_SECRET",
)
```

然后用 `book_type=BookType.L3_MBO` 订阅：

```python
from nautilus_trader.model import BookType

# Inside a registered strategy or data actor:
self.subscribe_book_deltas(
    instrument_id=instrument_id,
    book_type=BookType.L3_MBO,
    depth=1000,  # valid: 10, 100, 1000
)
```

合法深度为 `10`、`100` 与 `1000`。`depth` 为 `0` 时使用 `1000`。

### CRC32 校验和验证 {#crc32-checksum-validation}

默认情况下，只要 Kraken 提供，适配器就会验证每个 L3 快照与更新的 CRC32 校验和。不匹配时，
它发出 `Clear` delta、清除本地 L3 状态、刷新鉴权令牌并重新订阅，让 Kraken 发来新快照。
要做基准测试而禁用验证：

```python
config = KrakenDataClientConfig(
    api_key="...",
    api_secret="...",
    validate_l3_checksum=False,
)
```

### 存储建议 {#storage-recommendations}

`OrderBookDelta` 的 Arrow schema 携带 `order_id: u64`，因此 `ParquetDataCatalog` 用与 L2
相同的 schema 存储 L3 数据。L3 每个工具产生的事件更多。

- 使用更小的查询会话 `chunk_size`（例如 `50_000`）以瞄准更小的流式批次。按时间戳对齐的
  批次可能超过该目标。该设置不控制文件大小或并行读取。
- 在 `DataCatalogConfig` 中设置 `compression="zstd"` 以压缩存储数据。
- Parquet 数据目录默认按工具对数据分区。

## 订单能力 {#order-capabilities}

### 订单类型 {#order-types}

| 订单类型               | 现货   | 期货   | 说明                                                                  |
| ---------------------- | ----   | ------ | --------------------------------------------------------------------- |
| `MARKET`               | ✓      | ✓      | 按市价立即成交。                                                      |
| `LIMIT`                | ✓      | ✓      | 按指定价或更优价成交。                                                |
| `STOP_MARKET`          | ✓      | ✓      | 条件市价单（止损）。                                                  |
| `MARKET_IF_TOUCHED`    | ✓      | ✓      | 条件市价单（止盈）。                                                  |
| `STOP_LIMIT`           | ✓      | ✓      | 条件限价单（止损限价）。                                              |
| `LIMIT_IF_TOUCHED`     | ✓      | ✓      | 现货：`take-profit-limit`；期货：带 `limit_price` 的 `take_profit`。  |
| `TRAILING_STOP_MARKET` | ✓      | -      | 带 `trailing_offset` 的移动止损。                                     |
| `TRAILING_STOP_LIMIT`  | ✓      | -      | 带 `limit_offset` 的移动止损限价。                                    |

### 有效期 {#time-in-force}

| 有效期        | 现货   | 期货   | 说明                                                |
| ------------- | ----   | ------ | --------------------------------------------------- |
| `GTC`         | ✓      | ✓      | 撤销前有效（Good Till Canceled）。                    |
| `GTD`         | ✓      | -      | 到期前有效（仅现货，需要 `expire_time`）。          |
| `IOC`         | ✓      | ✓      | 立即成交否则撤销（Immediate or Cancel）。             |
| `FOK`         | ✓      | -      | 仅限现货限价订单。                                  |

:::note
**市价订单**天生是立即执行的，不支持有效期。`IOC` 只适用于限价类订单。
:::

### 执行指示 {#execution-instructions}

| 指示             | 现货   | 期货   | 说明                                                       |
| ---------------- | ----   | ------ | ---------------------------------------------------------- |
| `post_only`      | ✓      | ✓      | 限价订单可用。                                             |
| `reduce_only`    | ✓      | ✓      | 现货需要保证金账户与已解析的杠杆。                         |
| `quote_quantity` | ✓      | -      | 仅现货。以报价货币计的量（`viqc`）；走 REST。              |
| `display_qty`    | ✓      | -      | 仅现货。冰山订单（`displayvol`）。                         |

### 触发类型 {#trigger-types}

条件订单支持这些触发价参照：

| 触发类型      | 现货   | 期货   | 说明                        |
| ------------- | ----   | ------ | --------------------------- |
| `LAST_PRICE`  | ✓      | ✓      | 默认。最新成交价。          |
| `INDEX_PRICE` | ✓      | ✓      | 更广泛市场的指数价。        |
| `MARK_PRICE`  | -      | ✓      | 仅期货。                    |

:::note
适配器在提交时拒绝不受支持的触发类型（例如 `BID_ASK`），而不是静默强转。
:::

### 批量操作 {#batch-operations}

| 操作       | 现货   | 期货   | 说明                                                  |
| ---------- | ----   | ------ | ----------------------------------------------------- |
| 批量提交   | ✓      | ✓      | 现货按 15 笔分块；期货按 10 笔分块。                  |
| 批量修改   | -      | ✓      | 仅期货 HTTP 方法。执行侧只发送一条命令。              |
| 批量撤销   | ✓      | ✓      | 自动按 50 笔一批分块。                                |

:::note
**撤销全部订单**：

- 现货为所请求的工具挑选匹配的未结与在途订单（无论是否带方向过滤），再按显式订单 ID 撤销
  它们。因此请求永远不会波及另一个工具。之所以包含在途订单，是因为场所可能已经接受了缓存
  仍记为已提交的订单。
- 期货在未给方向过滤时使用场所按 symbol 限定的批量撤销；给了过滤时，按显式订单 ID 挑选
  匹配的缓存未结与在途订单。
- 选出的 ID 经由批量撤销端点发送，并自动按 50 笔一批分块。Kraken 对两类标识分开建键，因此
  场所订单 ID 以 `orders` 发送、客户订单 ID 以 `cl_ord_ids` 发送，批量限额对两者合并计数。
  每笔撤销保留其目标订单所属的策略；聚合或含糊的响应交给对账处理，而不是产生逐单结果。

:::

### 订单修改 {#order-modification}

A modify's quantity 是订单新的总量（含已成交部分），这正是 Kraken
现货改单接受 `order_qty` 的语义。Kraken 期货把裸改单的 `size` 读作未结数量，因此凡是改变
订单大小的期货改单（无论单笔还是批量），适配器都发送 `qtyMode=ABSOLUTE`。Kraken 没有文档
说明总量小于等于已成交数量时它的答复。

### 持仓管理 {#position-management}

| 特性             | 现货   | 期货   | 说明                                                |
| ---------------- | ----   | ------ | --------------------------------------------------- |
| 查询持仓         | ✓      | ✓      | 现货保证金经 `OpenPositions`；现货现金需选择加入。  |
| 持仓模式         | -      | -      | 每个工具单一持仓。                                  |
| 杠杆控制         | ✓      | -      | 现货 REST 层级；逐单 `params={"leverage": N}`。     |
| 保证金模式       | ✓      | ✓      | 现货/期货全仓保证金；没有逐仓现货保证金。           |

### 订单查询 {#order-querying}

| 特性             | 现货   | 期货   | 说明                                           |
| ---------------- | ----   | ------ | ---------------------------------------------- |
| 查询未结订单     | ✓      | ✓      | 列出全部活动订单。                             |
| 查询订单历史     | ✓      | ✓      | 现货分页；期货读取一页历史。                   |
| 订单状态更新     | ✓      | ✓      | 经 WebSocket 的实时订单状态变化。              |
| 成交历史         | ✓      | ✓      | 执行与成交报告。                               |

### 条件关联订单 {#contingent-orders}

| 特性             | 现货   | 期货   | 说明                                       |
| ---------------- | ----   | ------ | ------------------------------------------ |
| 关联订单列表     | -      | -      | 提交的列表只包含独立订单。                 |
| OCO 订单         | -      | -      | *不支持*。                                 |
| 括弧订单         | -      | -      | *不支持*。                                 |
| 条件订单         | ✓      | ✓      | 止损与止盈订单。                           |

### Maker 保护（期货） {#maker-protection-futures}

Kraken 期货在选定市场启用
[Maker 保护](https://docs.kraken.com/exchange/guides/futures/maker-protection)：
可能吃掉流动性的下单与改单，在进入撮合引擎之前会被扣留市场的配置窗口。分类按订单类型进行，
因此非 post-only 的限价下单即使本会挂着也会被扣留。止损与止盈的触发放置不被扣留；它们触发
的订单除 post-only 外同样被扣留。Post-only 的放置与所有撤销从不被扣留，任何 API 也不暴露被
扣留订单的状态。

场所按市场把该扣留应用于每个客户端。适配器在原始场所工具模型上解码逐市场的时间窗
（`makerProtectionMillis`），不对外暴露其配置。

订单状态处理考虑了被扣留订单的语义：

- 对被扣留限价放置确认的撤销不是终态。订单会以 IOC 释放，仍可能成交。被扣留的市价与 IOC
  订单无法撤回：撤销返回 `ORDER_NOT_FOUND`，订单在释放时仍会进入撮合。成交与终态由场所的
  订单更新驱动，绝不以撤销确认本身为准。
- 释放后无法交易的订单，在 REST 上以场所状态 `iocWouldNotExecute`（行情侧为
  `IOC_WOULD_ENTER_BOOK`）上报，适配器把它当作终局拒绝。在订单更新流上，同样的结果以终局
  撤销到来，适配器保留其场所原因。
- 释放后的订单会撤销同一账户中它会成交的挂单，覆盖配置的自成交策略。被撤销的挂单以原因
  `CANCELLED_BY_SELF_TRADE` 报告为已撤销。

#### 订单更新流 {#order-update-feed}

`is_cancel=true` 且原因为 `partial_fill` 的移除表示丢弃剩余量，属于终态（转换后的扣留，或
任何 IOC 风格订单）。该 delta 携带场所的累计已成交量。

- 对被跟踪的订单，成交量流记完该数量后，适配器就从流上关闭它。仍在途的成交绝不会成为孤儿，
  成交记完之后被跟踪的订单也不会停留在未结状态。
- 对匹配不上的移除，适配器跳过它，经由对账收敛。

| 匹配不上的移除           | 原因                          |
| ------------------------ | ----------------------------- |
| 仅撤销消息               | 不携带累计已成交量。          |
| 无法解析的客户订单 ID    | 匹配不到被跟踪的订单。        |

#### 对账 {#reconciliation}

被扣留的订单从未进入订单簿，因此不出现在 `/openorders` 中。批量状态、仅未结报告运行与定向
的单订单查询在把订单当作缺失之前，会先查询
[`POST /orders/status`](https://docs.kraken.com/api-reference/order-management/get-specific-orders-status)。
该窗口报告处于未结、或最近 5 秒内已成交或已撤销的订单。

场所会回显提交的客户订单 ID。除非它本就够短或已是 UUID（带连字符或 32 位十六进制），适配器
会把它缩短到 18 个字符。批量状态与仅未结报告运行把窗口内的每份报告映射到缓存订单：

- 缓存的场所订单 ID 直接标识订单。
- 否则，按客户订单 ID 查询的订单中必须恰好有一笔持有缩短后的 ID，且必须恰好有一份场所订单
  ID 未知的报告携带它。工具与方向必须匹配，且场所下单时间不得早于订单创建时间五秒以上，以
  容纳时钟偏差。

对其他任何窗口报告，适配器记警告说明原因并将其扣留，因为它无法把该报告恰好绑定到一笔缓存
订单。

场所订单 ID 与客户订单 ID 两种请求先后执行。缩短后的客户订单 ID 会匹配所有缩短结果相同的
订单，因此按场所订单 ID 查询的订单也可能从客户订单 ID 请求中返回，且状态不同。适配器不论
哪个请求后运行都选择最新状态：已关闭状态优先于未结，然后是较晚的场所更新，再然后是较大的
已成交量。上述命名规则与下面的成交价格规则都适用于保留下来的那份报告。

这些运行中，窗口不携带成交价格。因此完全执行的订单会被留下并记警告，不会按订单价推断其执行。
定向的单订单查询改为根据近期成交为其定价，否则失败、由对账推迟。批量状态在漏掉某份窗口报告
时把整个集合标记为不完整。有执行的已撤销订单会被报告，因为对账会等它的成交而不是推断。

撤销确认之后才成交的扣留，会按场所累计已成交量对账到其真实的终态，而不是过早的撤销。

## 订单路由（现货） {#order-routing-spot}

现货执行客户端默认把订单提交、修改、撤销与批量撤销经由 Kraken 鉴权 WebSocket v2 trade 频道
路由。WebSocket 不活跃时回退到 REST。在 `KrakenExecutionClientConfig` 上设置
`use_ws_trade=False` 可让这些操作改走 REST。

### 改走 REST 的订单形态 {#order-shapes-routed-via-rest}

Kraken 的
[现货 WebSocket v2 `add_order` 方法](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/add_order)
支持这些形态，但适配器把它们改由 REST 路由：

| 形态                       | 适配器行为                                                          |
| -------------------------- | ------------------------------------------------------------------- |
| `FOK` 有效期               | WebSocket 参数构建器不编码 `FOK`。                                  |
| 移动止损 / 移动止损限价    | WebSocket 参数构建器不编码移动偏移量。                              |
| 冰山订单（`display_qty`）  | WebSocket 参数构建器不编码冰山订单。                                |
| 报价数量订单               | WS 支持非保证金的买入市价单；适配器使用 REST。                      |

混合 symbol 的订单列表也使用 REST，因为 Kraken 的 WebSocket `batch_add` 请求要求共享单一
symbol。不受支持的触发参照回退到 REST 路径——它会在向 Kraken 发送请求之前本地拒绝它们。
现货保证金订单请按[现货保证金交易](#spot-margin-trading)所述使用 REST。

逐调用的 `params={"use_ws_trade": False}` 覆盖会无视配置的默认值，把单条命令强制走 REST。
可设置在 `SubmitOrder`、`ModifyOrder`、`CancelOrder`、`SubmitOrderList` 或
`BatchCancelOrders` 上。

### WebSocket 请求超时 {#websocket-request-timeout}

WebSocket 往返超过 `ws_request_timeout_secs`（默认 `5`）时，场所结果仍属未知。提交、修改、
撤销与批量添加请求保持在途，不做终局拒绝。调度器保留请求 ID，因此迟到的匹配响应仍能应用
正常的成功或确定性拒绝处理。

提交与批量添加超时还会在同一 WebSocket 上为每个受影响的客户订单 ID 发送一次尽力的补偿性
撤销。若 Kraken 已接受订单但延迟了响应，这一撤销能限制敞口。它不会用本地终态替换未知结果。

没有匹配响应到达时，由流更新与实盘执行对账引擎厘清订单。定向的状态查询可以厘清已有场所订单
ID 的修改或撤销请求。匹配响应到达或执行客户端关闭时，作废保留的请求关联。

:::tip
Set `ws_request_timeout_secs` comfortably above your observed round-trip
latency. A premature timeout can send a compensating cancel for a submit or
batch add that Kraken accepted.
:::

### WebSocket 订单路由选项 {#websocket-order-routing-options}

`KrakenExecutionClientConfig` 暴露：

| 选项                      | 默认值  | 说明                                                  |
| ------------------------- | ------- | ----------------------------------------------------- |
| `use_ws_trade`            | `True`  | trade 频道活跃时经 WS 路由订单。                      |
| `ws_request_timeout_secs` | `5`     | 等待现货 WS 订单响应的秒数。                          |

## 对账 {#reconciliation}

两个执行客户端都在启动时与运行期间，把本地订单、成交、持仓与账户状态和 Kraken 对账。

### 有界报告 {#bounded-reports}

对账提供回看窗口时，两个执行客户端为每个历史查询推导同一个截止点，并通过
`set_report_window` 把它记录在批量状态上。移动的截止点可能把在场所从未同时存在过的报告
拼在一起。

声明截止点会启用引擎的有界历史规则。不完整的集合仍会对账已收到的报告，并记警告。完整性
标志是限定该集合，而不是阻断对账。

#### 范围与读取失败 {#scope-and-read-failures}

范围内某个解析不到工具或无法解析的未结订单或持仓，会让两个客户端的读取都失败。省略它就
等于告诉对账场所从未持有那笔订单或持仓。

期货有一个例外：一笔从未触发的 reduce-only 止损或止盈，在触发之前可能没有未成交数量。若
其合约没有可据以定尺寸的未结持仓，读取会带着警告跳过该订单及其历史行，并把集合标记为不
完整。未结持仓读取失败也会让订单读取失败。该触发器被跳过期间，针对它的单订单状态查询会
失败，因此对账会推迟它。

两个客户端对限定在自身不持有的工具的查询都返回空行。现货与期货共享 `KRAKEN` 场所，因此
任一客户端都可能收到不属于自己路由的订单查询。单订单状态查询与 `query_order` 只检查命令
所属的工具。另一个工具上无法厘清或无法解析的记录不能使该限定读取失败，尽管查询无法排除
这类记录可能指名的订单。

其他缺口会把集合标记为不完整：已关闭或历史订单与成交无法解析，或其工具无法解析。持仓记录
不影响完整性标志。范围内持仓的失败会让读取失败。

#### 单订单查询 {#single-order-lookups}

没找到报告的单订单状态查询，是在告诉对账场所没有这笔订单，对账据此答案厘清该订单。查询
只有从能排除该订单的读取中才给出这个答案，否则就失败，让对账推迟该订单：

- 完整的读取排除它本可以返回的任何订单。被扣留的期货订单只显示在 orders-status 窗口中，
  期货的查询在作答前会为一个缓存订单读取该窗口。
- 跳过过某行的读取——包括某行的工具客户端无法解析——排除的是场所订单 ID 未被任何被跳过
  行携带的订单。不指名任何订单的被跳过行（例如未文档化的历史事件种类）什么都排除不了。
- 在另一产品类的工具上查询按完整读取对待，因为另一个客户端会为其订单作答。在本客户端自己
  产品类但它不持有的工具上查询，什么都读不到，也什么都排除不了。
- 被中途截断的读取，排除在其持有的最旧事件之后（超过 60 秒时钟偏差容限）下单的订单，取
  订单创建与接受时间中较早者。期货历史页按从新到旧排列，因此返回续传 token 的页面能追溯
  到其最旧事件。到达页数上限而停止的现货已关闭订单读取什么都排除不了。

读取无法排除的订单，会在每次未结订单检查时被再次推迟。期货上每次这样的查询消耗一个订单
历史 token。

#### 现货分页上限 {#spot-pagination-limits}

现货已关闭订单与成交读取推进 offset，直到 Kraken 返回空页，每次读取至多 500 页。到达上限
会记一条警告：

- 启动批量状态把订单与成交读取的完整性记录在其报告窗口里，因此引擎把被截断的集合视为不
  完整。
- `generate_order_status_reports` 与 `generate_fill_reports` 返回读到上限为止的记录，
  不暴露完整性标志。
- 在被上限截断的已关闭订单读取中什么都没找到的单订单状态查询会失败，因此对账推迟该订单。

### 现货对账 {#spot-reconciliation}

#### 订单状态报告 {#order-status-reports}

- 未结订单：拉取当前全部活动订单。
- 已关闭订单：带分页支持地拉取历史订单。
- 限定时间的查询：支持按起止时间戳过滤。
- 启动批量状态在未结订单之外一并读取已关闭订单，因此节点停机期间到达终态的订单能被对账。
  对账回看窗口限定读取范围，被页数上限截断的已关闭订单读取会让批量状态不完整。
- 报告携带订单自身的价格，而不是行顶层的 `price`。那个字段是平均成交价，未成交订单上读作
  零。报告的 `avg_px` 来自 `cost` 与 `vol_exec`。

  限价对限价订单取自 `descr.price`，对止损限价或止盈限价订单、以及 `misc` 标记为 `stopped`
  之后的移动止损限价订单，取自 `descr.price2`。移动止损限价的 `limitprice` 保存的是峰值
  价格，不是其限价。市价、结算仓位（settle-position）、止损、止盈或移动止损订单不携带限价。

  触发价取自 `stopprice`——止损、止盈、止损限价或止盈限价订单只在触发后才会填入它，因此
  在此之前由 `descr.price`（即 AddOrder 接受的那个值）代替。零值或相对价格读作无。
- 未触发的移动止损限价订单没有绝对限价，因此其报告不携带价格；缓存中没有的订单在触发之前
  也无法从报告重建。
- 执行帧只有在携带 `limit_price` 时才陈述订单价格，绝不按成交价陈述。

#### 成交报告 {#fill-reports}

- 交易历史：带分页地拉取执行历史。
- 限定时间的查询：支持按起止时间戳过滤。
- 全部成交类型：市价、限价与条件订单的成交。

#### 交易对拼写 {#pair-spelling}

- Kraken 对交易对有两种拼法：`AssetPairs` 的键（`XXBTZEUR`），用作工具的 `raw_symbol`；
  以及 altname（`XBTEUR`）。`OpenPositions` 返回键，而 `OpenOrders` 与 `TradesHistory`
  返回 altname。
- 适配器两种拼法都能解析，因此遗留命名交易对上的订单或成交会被报告。
- 限定在单一工具的读取会解析每一行并比较工具 ID，而不是缓存的 `raw_symbol` 与场所拼法。
  因此无论 Kraken 怎么拼，它返回的都是该对自己的记录。
- 限定在客户端不持有工具的读取什么都不返回。现货与期货 ID 共享 `KRAKEN` 场所，因此期货 ID
  可能到达现货客户端，反之亦然。两者都不会回退为返回所有工具的记录。在客户端自身产品类但
  不持有的工具上做单订单查询，排除不了任何订单。
- altname 与 `AssetPairs` 键不同的现货工具，把 altname 携带在其 `info` 映射中，因此工具经
  由 `cache_instrument` 或 `cache_instruments` 到达的客户端，无需重新拉取 `AssetPairs`
  就能解析 altname 拼法的记录。
- 在非限定读取上，交易对解析不到缓存工具的未结订单会让整个读取失败，而不是在一次否则
  会成功的读取中被省略。限定读取跳过它无法解析的记录——那可能是别的工具的记录——而单订单
  查询无法排除该记录指名的订单。
- 无法解析的已关闭订单或成交记为警告并跳过，保住能解析的记录。历史记录常常比已加载的工具
  集活得更久。

#### 账户余额 {#account-balances}

- 钱包余额：从
  [`POST /0/private/BalanceEx`](https://docs.kraken.com/api-reference/account-data/get-extended-balance)
  拉取，它按资产报告总量与冻结（`hold_trade`）数量。冻结数量填充 `AccountBalance.locked`，
  因此 `free` 排除了 Kraken 为挂着的非保证金现货订单预留的资金。对有信用额度的账户，净
  信用（`credit - credit_used`）计入 `AccountBalance.total`，因此 `free` 与 Kraken 的
  可用余额 `balance + credit - credit_used - hold_trade` 一致。
- 零余额：Kraken 列为零的资产按零报告而不是省略，现货与期货都如此。引擎只做余额插入，因此
  快照中漏掉的一种货币会保留旧值。期货上零会计入逐货币求和，因此同一资产有资金的钱包与
  空钱包并存的，报告有资金的金额。Kraken 从响应中整个删掉的资产仍保留其最近报告的值。

#### 保证金持仓报告 {#margin-position-reports}

`spot_account_type=AccountType.MARGIN` 时：

- 未结持仓：从 `POST /0/private/OpenPositions` 拉取，按交易对聚合为
  `PositionStatusReport` 条目。Kraken 每个批次（lot）返回一个条目，因此同一对上方向相反的
  批次轧差进单一报告。
- 开仓均价：每份报告携带 `avg_px_open`，由批次的 `cost` 与 `vol` 字段推导、按仍未平的量加权
  平均。多头与空头批次分别平均，因此报告的平均值描述轧差后幸存的一侧。对账需要这个值，
  才能在缓存没有该订单或成交历史时从报告开出一个持仓。
- 该平均值标记为 `AvgPxReconciliation::OpeningOnly`，因为 Kraken 按 FIFO 平保证金批次，并
  把完全平掉的批次从 `OpenPositions` 移除。部分平仓之后，平均值描述的是仍开的批次而非开仓
  成交，与净持仓的均价对不上。对账只用它从空仓开仓，从不比较它。期货保持默认，因为那个
  端点报告一个净额持仓，其价格被 Kraken 文档定为平均开仓价。
- 没有合成的 FLAT 清理：`OpenPositions` 只报告带杠杆的持仓，因此不带杠杆的现货持有永远不出
  现在那里，它的缺席不是仓位已平掉的证据。批量读取只报告场所返回的内容。
- 保证金余额：`POST /0/private/TradeBalance` 与账户状态刷新一并调用。已用保证金填充
  `MarginBalance.initial`，净值与可用保证金填充汇总余额（见现货保证金交易）。

:::warning
设置了 `reconciliation_lookback_mins` 时，节点停机期间平掉的杠杆仓位不会从其平仓成交中
恢复。完全平掉的批次不在 `OpenPositions` 中，因此该工具没有持仓报告。于是引擎把该订单的
成交投影为仅订单。订单到达 `FILLED`，但缓存仓位保留其数量与已实现盈亏。平仓盈亏永远不会
被记录。

这是共享引擎对没有范围内持仓报告的工具的既定行为，不是 Kraken 的规则。见
[仅订单成交投影](./../concepts/execution/reconciliation.md#order-only-fill-projection)。移除合成的 FLAT 正是让 Kraken 现货保证金暴露于此的原因，因为之前的扫描会提供一个显式的 FLAT。

周期性持仓检查也无法恢复它，因为保证金模式没有声明批量持仓覆盖，而这一跳过只在 debug 级别
记录。这一状况也跨重启持续：此时平仓订单已缓存为 `FILLED` 且与场所完全一致，因此对账认为
它已同步。

不设置 `reconciliation_lookback_mins` 可以避免该投影。已在缓存中的平仓订单——比如故障前
提交的策略退出——随后会恢复到其仓位中：成交应用到缓存订单并平掉其仓位。

它不是通用的解法，因为缓存中不存在的平仓订单会被归到 `EXTERNAL` 策略，并按工具与策略为净仓
持仓建键。除非缓存仓位归 `EXTERNAL` 所有，或该工具通过 `external_order_claim` 被认领，这
样恢复的成交会开出第二个方向相反的仓位，而不是平掉缓存的那个。净敞口归零，但过期仓位及其
已实现盈亏仍然存在。

在此之前，停机期间平掉的保证金仓位请手动对账；或使用 `use_spot_position_reports=True` 的
`spot_account_type=AccountType.CASH` 运行——钱包读取会枚举它覆盖的每项持有，缺席的报告是
空仓的真实证据。
:::

### 期货对账 {#futures-reconciliation}

#### 订单状态报告 {#order-status-reports-1}

适配器返回未结订单，`open_only=False` 时还返回历史已关闭与已成交订单。历史读取有下述限制。

#### 订单历史与定价 {#order-history-and-pricing}

适配器从
[`/api/history/v3/orders`](https://docs.kraken.com/api-reference/account-history/get-order-events)
读取订单生命周期事件。每次读取取一页：Kraken 的 `/history` 端点共享一个 100 token 的池，
每 10 分钟补充 100 个。一页订单历史消耗一个 token，因此返回续传 token（在 body 或
`Next-Continuation-Token` 头中）的页面会记一条警告，并把集合标记为不完整，而不再继续读取。
被放置时间晚于该页最旧事件超过时钟偏差容限的缓存订单，单订单状态查询仍可能报告其缺席。见
[单订单查询](#single-order-lookups)。

历史列出每个生命周期事件。读取每笔订单返回一份报告：场所仍列出的用未结订单快照，否则返回
最新的历史状态。已关闭订单不会被盖了较晚时间戳的未结状态重新打开，例如撤销之后记录的被拒
改单。

合约名按场所的拼法解析：先精确匹配，再不区分大小写。历史不携带触发价，因此止损订单一旦
触发执行，就按其执行成的限价或市价订单报告。场所发起的订单（强平、行权指派、对冲指派、
unwind、大宗、RFQ）按市价订单报告。

适配器带着警告跳过无法表示的行，并把集合标记为不完整：

- 未知事件种类。
- 报告为 `Unknown` 或缺失的订单类型。
- 未知方向。
- 早于 epoch 的时间戳。

`OrderNotFound` 不携带订单状态，被跳过且不影响完整性。在 HTTP 成功状态之下返回的场所错误
会让读取失败。

带执行的终态历史行不携带平均价。适配器用恰好覆盖其已成交数量的当页成交，或用当页成交加上
缓存订单记录的成交为其定价，同样要求精确覆盖。失败的成交读取按空页计。没有精确覆盖时，
单订单查询失败，批量读取则扣留该订单，让对账推迟它，而不是按限价推断执行。

#### 启动历史回退 {#startup-history-fallback}

启动批量状态在未结订单之外读取一页历史。停机期间到达终态的订单若被这一页包含，就能恢复。
HTTP 成功状态下的场所错误 body（无论其 code），或 HTTP 429，会触发警告并回退为只读未结
订单，集合标记为不完整。其他 HTTP 错误、传输失败、无法解析的 body 都会让批量状态失败，
未结订单读取失败也一样。

#### 启动定价保护 {#startup-pricing-safeguard}

批量状态对带执行的终态历史订单施加同样的精确成交覆盖要求。它会扣留未覆盖的订单并记警告
点名，把集合标记为不完整。后续的读取仍只请求最新的成交页，无法回翻找回更早缺失的执行。

缓存持有该订单时，被扣留订单的当页成交会被保留，因为引擎无需报告就能把这些成交与该订单
对账。未缓存订单的成交随订单一并被扣留。

#### 空仓工具 {#flat-instruments}

持仓读取只返回未结持仓，因此没有持仓报告的工具在场所是空仓的。成交读取是一页。开仓成交
老于该页的一来一回只会留下其平仓一侧。没有 `reconciliation_lookback_mins` 时，引擎把每个
保留的成交应用到持仓，这可能开出场所并不持有的仓位。

作为补偿，不限界的启动读取会在空仓工具上，对读取页上缓存不持有的每笔订单（含未结订单）的
成交做净额。当净额不为零且其中有终态历史订单时，终态订单连同其成交被扣留并记警告，集合
标记为不完整。

未结订单保留，因此未结订单的成交仍能开出仓位。场所仍有未结持仓的工具交给其持仓报告。有界
回看把终态订单留给引擎，引擎会把没有持仓报告的成交仅投影到订单状态。

#### 成交报告 {#fill-reports-1}

- 成交历史：读取最新的
  [`/fills` 页](https://docs.kraken.com/api-reference/historical-data/get-your-fills)，
  即所有期货合约最近的 100 笔成交。更早的执行不会返回。
- 时间过滤：按起止时间戳做客户端侧过滤（解析 RFC3339 时间戳）。
- 全部成交类型：带费用信息的 maker 与 taker 成交。

#### 持仓状态报告 {#position-status-reports}

- 未结持仓：拉取全部活动期货持仓。
- 报告字段：来自 REST 快照的方向、平均开仓价与仓位规模。Kraken 还返回未实现 funding，但
  `PositionStatusReport` 不暴露它。

#### 账户状态 {#account-state}

- 余额：跨钱包每资产一个条目，如货币代码一节所述。
- 保证金：每币种一个条目，跨钱包求和（与余额相同），八位小数。弹性钱包的要求额以 USD 计，
  来自其 `initialMargin` 与 `maintenanceMargin`。单保证金钱包的要求额以其 `currency` 计，
  因此 `fi_xbtusd` 的要求额以 BTC 报告，其可用资金只约束该币种的余额。没有可用 `currency`
  的钱包不贡献保证金条目、不上报任何资产的冻结额，并记一条警告。

:::note
**期货时间过滤**：Kraken 期货的成交端点不支持服务端时间范围过滤。适配器通过解析 `fillTime`
字段并与请求的起止时间戳比较，实现客户端侧过滤。
:::

### 现货持仓报告（现金模式） {#spot-position-reports-cash-mode}

现金模式下设置 `use_spot_position_reports=True`，把钱包余额报告为现货持仓。默认
`False`。保证金账户独立于该选项使用 `OpenPositions`（见[现货保证金交易](#spot-margin-trading)）。

**工作方式**：

- 启用后，钱包余额被转换为 `PositionStatusReport` 对象。
- 正余额报告为 `LONG` 持仓。
- 只报告匹配所配置报价货币的工具（默认 `USDT`）。同一个过滤器决定客户端为哪些工具声明批量
  持仓覆盖，因此其他货币计价的工具绝不会因报告缺席而被对账成空仓。
- 这可以避免同一资产有多种报价货币（如 BTC/USD、BTC/USDT、BTC/EUR）时的重复报告。

**配置**：

```python
from nautilus_trader.adapters.kraken import KrakenExecutionClientConfig
from nautilus_trader.model import AccountId


exec_config = KrakenExecutionClientConfig(
    account_id=AccountId.from_str("KRAKEN-001"),
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    use_spot_position_reports=True,
    spot_positions_quote_currency="USDT",  # Default
)
```

:::warning
平掉所报告现货持仓的策略可能会卖掉你的钱包持有。只有在你的策略确实管理这些持有时才启用
钱包派生的持仓报告。
:::

## 现货保证金交易 {#spot-margin-trading}

Kraken 现货在选定交易对上支持杠杆交易。`AssetPairs` 会在 `leverage_buy` 与
`leverage_sell` 中声明每对的杠杆层级。适配器在工具加载时缓存这些层级，并在提交前据此校验
REST 订单。用 `spot_account_type=AccountType.MARGIN` 启用保证金交易，并通过
`default_leverage` 或逐单提交参数设置杠杆。

:::warning
现货保证金订单请使用 `use_ws_trade=False`。适配器的 WebSocket 路径会原样转发数字 `leverage`，
不检查该对缓存的层级。Kraken 的
[WebSocket `add_order` 模式](https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/add_order)
指定的是一个布尔 `margin` 字段，选中该对的最大杠杆。REST 支持显式的
[杠杆参数](https://docs.kraken.com/api-reference/trading/add-order)，也有适配器的本地层级
检查。
:::

### 配置 {#configuration-1}

```python
from nautilus_trader.adapters.kraken import KrakenExecutionClientConfig
from nautilus_trader.model import AccountId
from nautilus_trader.model import AccountType


exec_config = KrakenExecutionClientConfig(
    account_id=AccountId.from_str("KRAKEN-001"),
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    spot_account_type=AccountType.MARGIN,
    use_ws_trade=False,
    default_leverage=3,  # Optional config-level default
    margin_balance_asset="ZGBP",  # Optional summary-display asset
)
```

`margin_balance_asset` 只控制 Kraken `TradeBalance` 端点返回的账户汇总指标（净值、可用
保证金、已用保证金等）的计价货币。`OpenPositions` 的逐仓位数字始终以交易对的报价货币计。

### 逐单杠杆 {#per-order-leverage}

对单笔订单，通过 `params` 覆盖配置的默认值：

```python
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OrderSide
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity


order = strategy.order_factory.limit(
    instrument_id=InstrumentId.from_str("BTC/USD.KRAKEN"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("0.01"),
    price=Price.from_str("50000.00"),
)
strategy.submit_order(order, params={"leverage": 5})
```

在 REST 上，适配器在发送订单之前，会针对该对的 `leverage_buy` 或 `leverage_sell` 校验层级。
层级不受支持时，单笔订单提交会在不触及 Kraken 的情况下发出 `OrderRejected` 事件。格式错误
的逐单杠杆参数（例如字符串，或超出 `[0, 65535]` 的值），在任何一条路由上都会在提交前产生
`OrderDenied`。

### Reduce-only {#reduce-only}

保证金订单可以携带 `reduce_only=True`，从而在减少既有持仓的同时不会开出更大的反向仓位。
设置 `spot_account_type=AccountType.MARGIN`，并提供 `default_leverage` 或逐单
`params={"leverage": N}`。适配器会在把现金订单发往 Kraken 之前拒绝带 `reduce_only` 的现金
订单。

### 账户状态 {#account-state-1}

`spot_account_type=AccountType.MARGIN` 时，执行客户端在账户刷新期间调用 Kraken 的
`TradeBalance` 端点。实盘账户状态使用：

- 净值（`e`）与可用保证金（`mf`），用于 `margin_balance_asset` 计价的余额。
- 已用保证金（`m`）用于 `MarginBalance.initial`。维持保证金为零，因为 Kraken 不返回单独的
  维持保证金金额。

低层的 `KrakenSpotHttpClient` 方法 `request_margin_metrics()` 与
`request_account_state_with_metrics()` 为直接调用方返回完整的 `TradeBalance` 指标字典。
实盘执行客户端不会把该字典挂到 `AccountState.info` 上。

### 持仓对账 {#position-reconciliation}

未结的现货保证金持仓在每个 `position_check_interval_secs` 滴答时经由
`POST /0/private/OpenPositions` 呈现。这条路径独立于 `use_spot_position_reports`（后者由
钱包派生、仅限现金模式）。

现货客户端按工具声明批量持仓覆盖，且只针对读取实际会枚举的工具：现金模式且
`use_spot_position_reports=True`，并且工具以 `spot_positions_quote_currency` 计价（见现货
持仓报告，用的是同一个过滤器）。`spot_account_type=AccountType.MARGIN` 下来源是
`OpenPositions`，它省略不带杠杆的批次；而不开钱包派生报告的现金模式什么都不返回。凡未声明
覆盖之处，报告缺席就让缓存持仓保持原样，而不是把它平掉。

## Funding 费率 {#funding-rates}

适配器从
[Futures ticker](https://docs.kraken.com/exchange/api-reference/futures-websocket/ticker)
WebSocket 流接收 funding 费率数据，它为永续期货提供 `relative_funding_rate` 与
`next_funding_rate_time`。

适配器把 `FundingRateUpdate.interval` 留为 `None`，因为 ticker 流不包含 funding 间隔字段。
这并不意味着合约没有定义的 funding 周期。Kraken 的
[线性多保证金合约规格](https://support.kraken.com/articles/4844359082772-linear-multi-collateral-derivatives-contract-specifications)
定义了按小时的 funding 周期。已累计的 funding 在整点结束时或净持仓变化时结算。

## 速率限制 {#rate-limiting}

每个 Kraken HTTP 客户端都应用适配器侧的请求限流。默认为每秒五个请求，可用
`max_requests_per_second` 覆盖。这是按请求计数限流，不是 Kraken 端点成本或账户层级预算的
完整模型。

Kraken 对现货与期货适用不同的场所限制：

- [现货 REST 速率限制](https://docs.kraken.com/exchange/guides/rest/ratelimits)使用随层级
  变化的调用计数器。Ledger 与交易历史调用加 `2`，多数其他 REST 调用加 `1`，订单管理使用
  独立的交易限流器。
- [衍生品速率限制](https://docs.kraken.com/exchange/guides/futures/ratelimits)使用端点
  成本，并为 `/derivatives` 与 `/history` 路径设置分开的预算。

Kraken 文档记载的这些现货 REST 调用计数器限制：

| 现货层级       | 计数器上限        | 计数器衰减    |
| -------------- | ----------------- | ------------- |
| Starter        | 15                | 0.33/秒       |
| Intermediate   | 20                | 0.5/秒        |
| Pro            | 20                | 1/秒          |

适配器固定请求速率对端点组合与账户层级而言过高时，Kraken 仍可能拒绝或限流请求。

### 对账间隔建议 {#reconciliation-interval-guidance}

执行引擎的 `open_check_interval_secs` 与 `position_check_interval_secs` 设置会产生持续的
私有 REST API 负载。即便适配器保持在其配置的每秒请求限流之下，过短的间隔也可能耗尽 Kraken
的场所预算。

从保守的间隔起步，尤其是对 Spot Starter 账户：

```python
from nautilus_trader.config import LiveExecutionEngineConfig


exec_engine = LiveExecutionEngineConfig(
    reconciliation=True,
    open_check_interval_secs=30.0,  # Conservative Spot Starter-tier starting point
    position_check_interval_secs=120.0,
)
```

按账户层级、启用的对账检查，以及使用同一 API key 的其他客户端调校这些值。Kraken 返回
`EAPI:Rate limit exceeded` 时，增大间隔或调低 `max_requests_per_second`。

## 配置 {#configuration}

### 数据客户端配置选项 {#data-client-configuration-options}

| 选项                      | 默认值    | 说明                                                           |
| ------------------------- | --------- | -------------------------------------------------------------- |
| `product_type`            | `SPOT`    | 本客户端的产品类型（`SPOT` 或 `FUTURES`）。                    |
| `environment`             | `LIVE`    | 交易环境（`LIVE` 或 `DEMO`）；demo 仅期货可用。                |
| `api_key`                 | `None`    | 现货 L3 数据的 API key。                                       |
| `api_secret`              | `None`    | 现货 L3 数据的 API secret。                                    |
| `base_url`                | `None`    | Kraken REST 基础 URL 的覆盖值。                                |
| `ws_public_url`           | `None`    | 公开 WebSocket URL 的覆盖值。                                  |
| `ws_private_url`          | `None`    | 私有 WebSocket URL 的覆盖值。                                  |
| `ws_l3_url`               | `None`    | 现货 L3 WebSocket URL 的覆盖值。                               |
| `validate_l3_checksum`    | `True`    | 验证 Kraken 现货 L3 校验和，不匹配时重同步。                   |
| `validate_l2_checksum`    | `True`    | 验证 Kraken 现货 L2 `book` 校验和，不匹配时重同步。            |
| `proxy_url`               | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                         |
| `timeout_secs`            | `30`      | HTTP 请求超时（秒）。                                          |
| `heartbeat_interval_secs` | `30`      | WebSocket 心跳间隔（秒）。                                     |
| `ws_idle_timeout_ms`      | `10,000`  | 现货 v2 WebSocket 的数据静默超时；`0` 禁用。                   |
| `max_requests_per_second` | `None`    | 每客户端请求限流；默认 5 请求/秒。                             |
| `transport_backend`       | `Sockudo` | WebSocket 传输后端。                                           |

### 执行客户端配置选项 {#execution-client-configuration-options}

| 选项                            | 默认值    | 说明                                                                  |
| ------------------------------- | --------- | --------------------------------------------------------------------- |
| `account_id`                    | 必需      | Kraken 账户的账户 ID。                                                |
| `api_key`                       | 必需      | Kraken API key。                                                      |
| `api_secret`                    | 必需      | Kraken API secret。                                                   |
| `product_type`                  | `SPOT`    | 本客户端的产品类型（`SPOT` 或 `FUTURES`）。                           |
| `environment`                   | `LIVE`    | 交易环境（`LIVE` 或 `DEMO`）；demo 仅期货可用。                       |
| `base_url`                      | `None`    | Kraken REST 基础 URL 的覆盖值。                                       |
| `ws_url`                        | `None`    | Kraken WebSocket URL 的覆盖值。                                       |
| `proxy_url`                     | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                |
| `timeout_secs`                  | `30`      | HTTP 请求超时（秒）。                                                 |
| `heartbeat_interval_secs`       | `30`      | WebSocket 心跳间隔（秒）。                                            |
| `auth_timeout_secs`             | `None`    | 期货 WebSocket 鉴权超时；`None` 使用客户端默认值。                    |
| `max_requests_per_second`       | `None`    | 每客户端请求限流；默认 5 请求/秒。                                    |
| `max_retries`                   | `3`       | 可重试 REST 请求的最大重试次数。                                      |
| `spot_account_type`             | `CASH`    | 现货交易的账户类型；`MARGIN` 启用杠杆与报告。                         |
| `default_leverage`              | `None`    | 现货保证金默认杠杆；设置时 REST 发送 `"N:1"`。                        |
| `use_spot_position_reports`     | `False`   | 把钱包余额报告为持仓；仅现金模式。                                    |
| `spot_positions_quote_currency` | `"USDT"`  | 现货钱包持仓报告及其覆盖的报价货币过滤。                              |
| `margin_balance_asset`          | `None`    | `TradeBalance` 的汇总资产；`None` 默认 `ZUSD`。                       |
| `use_ws_trade`                  | `True`    | 活跃时使用现货 WebSocket v2 做订单操作。                              |
| `ws_request_timeout_secs`       | `5`       | 现货 WebSocket 订单响应超时。                                         |
| `transport_backend`             | `Sockudo` | WebSocket 传输后端。                                                  |

现货保证金方面，订单没有逐单杠杆参数时应用 `default_leverage`。提交与账户状态示例见
[现货保证金交易](#spot-margin-trading)。

### Demo 环境设置 {#demo-environment-setup}

用 Kraken Futures demo（纸面交易）测试：

1. 在 [Kraken Futures demo](https://demo-futures.kraken.com) 注册并生成 API 凭据。
1. 用你的 demo 凭据设置环境变量：
   - `KRAKEN_FUTURES_DEMO_API_KEY`
   - `KRAKEN_FUTURES_DEMO_API_SECRET`
1. 读取凭据并传入 `KrakenExecutionClientConfig`，然后设置
   `environment=KrakenEnvironment.DEMO` 与 `product_type=KrakenProductType.FUTURES`。

[Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/kraken/)
展示了完整的 demo 与实盘 `LiveNode` 配置。

### 生产环境配置 {#production-configuration}

`KrakenDataClientConfig` 与 `KrakenDataClientFactory` 搭配，
`KrakenExecutionClientConfig` 与 `KrakenExecutionClientFactory` 搭配。Python 示例展示了数据
与执行客户端完整的 `LiveNode.builder(...)` 配置。

### API 凭据 {#api-credentials}

实盘节点的配置对象不会自动读取凭据环境变量。请把 `api_key` 与 `api_secret` 显式传入
`KrakenExecutionClientConfig`，现货 L3 数据还要传入 `KrakenDataClientConfig`。除现货 L3
之外的行情数据不需要凭据。

省略凭据参数时，低层的 Python HTTP 客户端会加载以下变量。Rust 应用可以先用
`KrakenCredential::from_env_spot()` 或 `KrakenCredential::from_env_futures(demo)` 加载
它们，再构建实盘节点配置。

| 环境变量                         | 说明                                     |
| -------------------------------- | ---------------------------------------- |
| `KRAKEN_SPOT_API_KEY`            | Kraken 现货实盘交易的 API key。          |
| `KRAKEN_SPOT_API_SECRET`         | Kraken 现货实盘交易的 API secret。       |
| `KRAKEN_FUTURES_API_KEY`         | Kraken 期货实盘 API key。                |
| `KRAKEN_FUTURES_API_SECRET`      | Kraken 期货实盘 API secret。             |
| `KRAKEN_FUTURES_DEMO_API_KEY`    | Kraken 期货（demo）的 API key。          |
| `KRAKEN_FUTURES_DEMO_API_SECRET` | Kraken 期货（demo）的 API secret。       |

:::note
**Demo 环境**：只有 Kraken 期货提供 demo 环境
（`https://demo-futures.kraken.com`）用于无真实资金的测试。Kraken 现货没有 demo 或测试网
环境。
:::

:::tip
用环境变量存放凭据，然后在应用边界把它们的值传入实盘节点配置。
:::

鉴权错误会在私有客户端连接或执行私有操作时上报。所需权限取决于请求的数据或交易操作。

## 参与贡献 {#contributing}

:::info
要为 Kraken 适配器做贡献，见
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
