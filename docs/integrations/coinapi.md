# CoinAPI

[API Bricks](https://www.apibricks.io/?ref=nautilus) 旗下的 [CoinAPI](https://www.coinapi.io/products/market-data-api?ref=nautilus) 提供跨多家交易所的实时与历史加密货币行情数据。其 REST 和 WebSocket API 以统一的数据格式暴露成交、报价、订单簿和 OHLCV bar。

NautilusTrader 适配器支持实时行情、历史请求，以及加载已下载的扁平文件（flat file）。它没有执行客户端、账户管理或订单路由。

## 概览 {#overview}

适配器以 Rust 实现并提供 Python 绑定，不需要外部 CoinAPI 客户端库。通过实时节点配置，使用以下 Python 组件：

- `CoinApiDataClientConfig`：实时数据客户端配置。
- `CoinApiInstrumentSelection`：要加载的交易所、金融工具和元数据过滤器。
- `CoinApiDataClientFactory`：注册到节点 builder 的工厂。

Rust crate 还暴露 `CoinApiHttpClient` 和 `CoinApiWebSocketClient`，供直接访问 API。

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/coinapi/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/coinapi/examples/)

示例加载 Coinbase 的 BTC/USD，流式接收报价、成交和一分钟 bar，并请求近期 bar。它们使用 10 点信用额度的 REST 预算和精度 3 的价格覆盖。请按你的数据源修改金融工具和订阅设置，更换金融工具时同步更新精度覆盖。历史数据可能落后于实时数据流，因此请求近期 bar 可能返回空记录。

## CoinAPI 文档 {#coinapi-documentation}

- [Market Data REST API](https://www.coinapi.io/products/market-data-api/docs/rest-api?ref=nautilus)。
- [WebSocket V1 API](https://www.coinapi.io/products/market-data-api/docs/websocket?ref=nautilus)。
- [Flat Files](https://www.coinapi.io/products/flat-files?ref=nautilus)。

## 支持的能力 {#supported-capabilities}

| 能力                                       | 接口                          | 状态                                                 |
| ------------------------------------------ | ----------------------------- | ---------------------------------------------------- |
| 现货、永续、期货金融工具                   | REST 元数据                   | 原生«场所金融工具» ID。                                    |
| 订单簿 delta                               | WebSocket                     | L2（`book`）与 L3（`book_l3`），带缺口恢复。         |
| 固定深度订单簿快照                         | WebSocket                     | 最多 50 档的 L2（`book5`、`book20`、`book50`）。     |
| 当前订单簿快照                             | REST                          | L2 快照请求。                                        |
| 历史订单簿快照                             | REST                          | 不支持。                                             |
| 报价 tick                                  | WebSocket 与历史 REST         | 实时数据流与历史请求。                               |
| 成交 tick                                  | WebSocket 与历史 REST         | 实时数据流与历史请求。                               |
| OHLCV bar                                  | WebSocket 与历史 REST         | 实时数据流与历史请求。                               |
| 已下载的扁平文件                           | S3 CSV 导出                   | Rust 与 Python 加载器。                              |
| 执行、订单与账户报告                       | 无                            | 超出范围。                                           |

订单簿类型：

- L2 market-by-price（MBP）：按价格档位聚合数量。
- L3 market-by-order（MBO）：数据源和协议提供时的逐笔订单。

固定深度订阅使用能覆盖请求深度的最小通道。L3 要求逐笔订单 ID：聚合的 `book_l3` 条目若没有 ID，转换失败并启动恢复。对只上报聚合档位的来源，L3 订单簿永远不会同步。

期权、资金费率与未平仓量指标、FIX、扁平文件下载、Hyperliquid L4 数据和代币化股票都在此适配器范围之外。CoinAPI EMS 执行是独立产品。

## 集成方署名 {#integrator-attribution}

REST 请求和 WebSocket 连接都携带固定推荐头 `X-Referrer: nautilus`，重试和重连同样如此。它没有配置覆盖，也不携带任何凭据或账户数据。

要把新账户推荐到 NautilusTrader，请通过
[API Bricks console](https://console.apibricks.io/?ref=nautilus) 注册。注册推荐与 API 请求推荐是两套独立机制，见
[API Bricks 推荐文档](https://www.apibricks.io/platform/docs/general/referral?ref=nautilus)。

## 认证与环境 {#authentication-and-environments}

在数据客户端配置中设置 `api_key`，或不设置以读取 `COINAPI_API_KEY`。构造时拒绝缺失的键，以及含可见 ASCII 之外字符的键。REST 请求与 WebSocket 升级用 `X-CoinAPI-Key` 认证。`hello` 帧不携带凭据。凭据在日志和错误中始终保持脱敏。导入 Python 包既不读取凭据也不发起连接。

生产环境使用加密的 REST 和 WebSocket 端点。Sandbox 访问未经确认。请使用生产环境 Market Data API 密钥。无需配置执行账户。

| 接口         | 生产端点                        | 角色                        |
| ------------ | --------------------------------- | --------------------------- |
| REST         | `https://rest.coinapi.io/v1/`     | 主 GeoDNS 端点。            |
| REST         | `https://api-emea.coinapi.io/v1/` | 可选区域端点。              |
| REST         | `https://api-apac.coinapi.io/v1/` | 可选区域端点。              |
| REST         | `https://api-ncsa.coinapi.io/v1/` | 可选区域端点。              |
| WebSocket V1 | `wss://ws.coinapi.io/v1/`         | 主流式数据端点。            |

REST 默认使用 GeoDNS。设置 `base_url_http` 可选定区域端点。适配器不会自动切换区域。见 CoinAPI 的
[REST 可用性指南](https://www.coinapi.io/products/market-data-api/docs/rest-api/rest-high-availability?ref=nautilus)和
[WebSocket 端点](https://www.coinapi.io/products/market-data-api/docs/websocket/endpoints?ref=nautilus)。

## 与原生适配器共用 CoinAPI {#using-coinapi-with-native-adapters}

CoinAPI 使用原生«场所金融工具» ID，如 `BTCUSDT.BINANCE`，数据客户端 ID 为 `COINAPI`。节点有多个数据客户端时，CoinAPI 的请求与订阅要传 `client_id=COINAPI_CLIENT_ID`。未显式传客户端 ID 的请求走场所或默认路由。CoinAPI 可以作为默认数据客户端。

:::warning
每个金融工具在每个节点只能有一个定义来源。CoinAPI 与原生适配器要配置互不相交的金融工具集合，包括启动加载和刷新。即便定义一致，共享同一金融工具也不受支持。不同的客户端 ID 不能为同一金融工具隔离定义或数据流，适配器也不会自动检测或解决这类冲突。
:::

组合多个提供商前，先检查原生金融工具的加载默认值。例如 Binance 默认 `load_all=True`，要改为 `False` 并提供不重叠的 `load_ids`。原生适配器的场所路由保留给其余金融工具。

CoinAPI 的价格与数量分辨率描述的是它自己的数据，可能与场所的交易增量不同。`0.1` 和 `0.5` 两个 tick 都用一位小数，但允许的价格不同。原生定义还携带交易约束，包括数量与名义金额限制。不要用 CoinAPI 元数据替换这些约束。

## 金融工具与代码体系 {#instruments-and-symbology}

### 支持的金融工具 {#supported-instruments}

数据客户端从下列交易所加载现货、永续和到期期货金融工具。现货金融工具成为 `CurrencyPair`，加密货币永续成为 `CryptoPerpetual`，加密货币期货成为 `CryptoFuture`。Binance USD-M 的商品与股票永续（如 `XAUUSDT`）成为 `PerpetualContract`。

无效、不支持或有歧义的定义会被跳过。多个定义映射到同一原生金融工具 ID 时，全部跳过。选定的金融工具无法加载会导致连接失败。

### 元数据 {#metadata}

CoinAPI 的 `price_precision` 和 `size_precision` 元数据值是价格和数量增量，不是小数位数，也不保证等于场所交易增量。适配器从这些分辨率推导精度，支持可选的[价格精度覆盖](#price-precision-overrides)。

基础与计价货币使用 CoinAPI 规范化的资产代码。乘数来自 `future_contract_unit`，期货到期时间来自 `future_delivery_time`。激活时间用 CoinAPI 的 `data_start` 覆盖日期，那不是场所上架时间。货币代码和金融工具类别可能与原生适配器的定义不同。

### 代码映射 {#symbol-mappings}

配置选择时请使用下面的原生 `InstrumentId` 形式。反向合约以基础货币结算，线性合约以计价货币结算。适配器根据场所的产品惯例判定这些属性，而不是 CoinAPI 的 inverse 标志。

| CoinAPI 交易所   | 代码类型    | 场所代码形式         | 原生 `InstrumentId`            | 合约                         |
| ---------------- | ----------- | -------------------- | ------------------------------ | ---------------------------- |
| `BINANCE`        | `SPOT`      | `BTCUSDT`            | `BTCUSDT.BINANCE`              | 现货                         |
| `BINANCEFTS`     | `PERPETUAL` | `BTCUSDT`            | `BTCUSDT-PERP.BINANCE`         | 线性                         |
| `BINANCEFTS`     | `FUTURES`   | `BTCUSDT_261225`     | `BTCUSDT_261225.BINANCE`       | 线性                         |
| `BYBITSPOT`      | `SPOT`      | `BTCUSDT`            | `BTCUSDT-SPOT.BYBIT`           | 现货                         |
| `BYBIT`          | `PERPETUAL` | `BTCUSDT`            | `BTCUSDT-LINEAR.BYBIT`         | 线性                         |
| `BYBIT`          | `FUTURES`   | `BTCUSDT-30OCT26`    | `BTCUSDT-30OCT26-LINEAR.BYBIT` | 线性                         |
| `BYBITINVERSE`   | `PERPETUAL` | `BTCUSD`             | `BTCUSD-INVERSE.BYBIT`         | 反向                         |
| `BYBITINVERSE`   | `FUTURES`   | `BTCUSDZ26`          | `BTCUSDZ26-INVERSE.BYBIT`      | 反向                         |
| `OKEX`           | `SPOT`      | `BTC-USDT`           | `BTC-USDT.OKX`                 | 现货                         |
| `OKEX`           | `PERPETUAL` | `BTC-USD-SWAP`       | `BTC-USD-SWAP.OKX`             | USD 为反向，其余线性         |
| `OKEX`           | `FUTURES`   | `BTC-USD-261225`     | `BTC-USD-261225.OKX`           | USD 为反向，其余线性         |
| `COINBASE`       | `SPOT`      | `BTC-USD`            | `BTC-USD.COINBASE`             | 现货                         |
| `KRAKEN`         | `SPOT`      | `XBT/USD`            | `BTC/USD.KRAKEN`               | 现货                         |
| `KRAKENFTS`      | `PERPETUAL` | `PI_XBTUSD`          | `PI_XBTUSD.KRAKEN`             | `PI_` 反向，`PF_` 线性       |

仅支持表中列出的交易所与产品形式。原生代码必须与提供商的资产和到期元数据一致。Kraken 现货中，`XBT` 映射为 `BTC`，`XDG` 映射为 `DOGE`。适配器保留完整的 CoinAPI `symbol_id`（含消歧后缀），用于数据请求与订阅。

### 不支持的合约 {#unsupported-contracts}

其他交易所和代码类型不支持，包括 Binance COIN-M（`BINANCEFTSC`）：CoinAPI 把 `BTCUSD_PERP` 报为一张币的合约单位，而原生 Binance 合约是 100 USD。

Kraken 到期期货（`KRAKENFTS` 的 `FUTURES`）同样不支持。CoinAPI 上报交割日午夜 UTC，而 Kraken 的最后交易时间随产品而异：`FF_` 为 08:00 UTC，`FI_` 合约为 15:00 或 16:00 UTC。

其他被拒绝的形式包括 Bybit USDC 合约、OKX 以 USD 保证金的期货（如 `BTC-USD_UM-261225`），以及计价货币为 `USD` 且有歧义的 Binance 交割 ID（如 `BTCUSD_261225.BINANCE`）。代码形似受支持的原生 ID，本身并不能证明该产品受支持。

## 数据订阅 {#data-subscriptions}

订阅要求客户端已连接、金融工具已加载，并使用 `connect` 载入的 `symbol_id`。所有订阅共用[原生 WebSocket 数据流](#raw-websocket-streams)一节描述的单一 WebSocket 连接。

| 订阅         | CoinAPI 类型                  | 事件              | `ts_event`        | `ts_init`                   |
| ------------ | ----------------------------- | ----------------- | ----------------- | --------------------------- |
| L2 簿 delta  | `book`                        | `OrderBookDeltas` | `time_exchange`   | `time_coinapi`              |
| L3 簿 delta  | `book_l3`                     | `OrderBookDeltas` | `time_exchange`   | `time_coinapi`              |
| 簿深度       | `book5`、`book20`、`book50`   | `OrderBookDepth`  | `time_exchange`   | `time_coinapi`              |
| 报价         | `quote`                       | `QuoteTick`       | `time_exchange`   | `time_coinapi`              |
| 成交         | `trade`                       | `TradeTick`       | `time_exchange`   | `time_coinapi`              |
| Bar          | `ohlcv`                       | `Bar`             | `time_period_end` | 发出时用适配器时钟。        |

### 成交主动方 {#trade-aggressor-sides}

只有交易所上报了主动方向时，成交的 aggressor side 才是 `BUY` 或 `SELL`。CoinAPI 的 `BUY_ESTIMATED` 和 `SELL_ESTIMATED` 是它自己的推断，因此与 `UNKNOWN` 和无法识别的值一起映射为 `NoAggressor`。

### Bar {#bars}

Bar 订阅接受外部收盘价 bar 类型，CoinAPI 流式周期支持：

- 1、2、3、4、5、6、10、15、20、30 秒或分钟。
- 1、2、3、4、6、8、12 小时。
- 1 天。

客户端拒绝内部聚合及其他规格。

CoinAPI 在看到一个属于下一周期的时间戳时发送当期累计 OHLCV，且在周期更新期间每五秒发送一次。这些累计值不带收盘标志。客户端为每个周期保留最新一次更新，收到更晚周期的更新时发出该周期的 bar。重连时丢弃保留的周期——错过的更新可能让其不完整——bar 订阅开始时同样丢弃。

### 订阅变更 {#subscription-changes}

订阅变更按调用顺序执行，共用一条 WebSocket 连接。CoinAPI 不确认范围变更。首个匹配的数据到达即确认订阅生效。

变更之间至少间隔两秒，以满足 CoinAPI 的订阅限额。排队变更和订单簿恢复会进一步推迟。退订全部数据流会关闭连接。之后的订阅会新建连接并保留该节奏。

连接失败一秒后重试，间隔翻倍、最多 30 秒，直到成功或断开。后续订阅变更排在待处理批次之后。传输重连会自动恢复订阅。CoinAPI `error` 会终止数据流且不再重订阅，下一次订阅将新建连接。

## 订单簿 {#order-books}

### 通道与深度 {#channels-and-depths}

`L2_MBP` delta 订阅流式接收 CoinAPI `book`，`L3_MBO` 订阅流式接收 `book_l3`。`L1_MBP` 被拒绝。两个通道都发送完整订单簿，因此 delta 订阅忽略 `depth`。

深度订阅只接受 `L2_MBP`，使用 `book5`、`book20`、`book50` 中能覆盖请求深度（默认 10 档）的最小通道。深度超过 50 被拒绝。每条深度消息列出完整的顶部档位、带 `F_SNAPSHOT` 标志，且订单计数为零，因为 CoinAPI 不报告该值。

### 通道冲突 {#channel-conflicts}

CoinAPI 每条连接只允许一种订单簿类型，因此同一客户端上的所有订单簿订阅必须使用同一通道。需要另一通道的第二个订阅会失败，例如 L3 与 L2 delta 并存，或深度 5 与深度 20 并存。同一金融工具的第二个订阅若深度不同也会失败。要切换通道，先退订当前订单簿。

### 快照与 delta 事件 {#snapshot-and-delta-events}

delta 流以快照开始：一个 `Clear` 后每档一个 `Add`，全部带 `F_SNAPSHOT` 标志，最后一个 delta 带 `F_LAST`。每次更新变成一个以 `F_LAST` 结尾的 `OrderBookDeltas` 事件。对 L3 订单簿，CoinAPI 的 `SUBTRACT` 和 `MATCH` 数量表示被移除的量，因此客户端跟踪每笔订单的剩余数量，数量耗尽即删除该订单。

### 序号 {#sequence-numbers}

CoinAPI 每条连接从 1 开始为订单簿数据流编号，每次重启数据流都重新开始编号。数据客户端让对外发出的序号在重启与重连之间保持递增，因此受管 `OrderBook` 可以直接消费该数据流。

### 恢复 {#recovery}

恢复只适用于 delta 订阅。序号缺口、首个快照之前到达的更新、或无效档位，都会停止订单簿输出，直到客户端收到有效的替代快照。等待期间收到的更新被丢弃。

深度订阅收到的都是完整快照。客户端丢弃无效的深度消息并告警，下一条有效消息直接替换，不做恢复尝试，也没有快照期限。

### 快照期限与重试上限 {#snapshot-deadlines-and-retry-limits}

`book_snapshot_timeout_secs` 设置订阅、重连或开始恢复后等待快照的时长，默认 10 秒，`0` 表示禁用期限。快照缺失会启动或重试恢复。退订会取消恢复，CoinAPI `error` 会终止全部订单簿数据流。

订单簿重启至少间隔五秒，重启待处理期间其他订阅变更排队等待。恢复在 180 秒内最多尝试八次，带退避与抖动；此后持续重试直到接受一个快照，重试间隔从一分钟翻倍到十五分钟。重连后等新的订单簿快照到达才恢复输出。

### 对其他数据流的影响 {#effects-on-other-streams}

订阅了其他金融工具时，恢复某个订单簿会把受影响金融工具的所有数据流暂停约两秒。跨越暂停区间的保留 OHLCV 周期会被丢弃，以免发布不完整的 bar。

当受影响金融工具是唯一订阅的金融工具时，其报价、成交和 bar 在订单簿恢复期间继续输出。若订单簿是唯一订阅，恢复保持连接打开，不额外发布成交数据流。

## 历史请求 {#historical-requests}

历史请求需要已连接的客户端和已加载的金融工具，并使用其存储的 `symbol_id`。响应保留 correlation ID、请求的客户端 ID、金融工具或 bar 类型、`start`、`end` 和 `params`。缺省的客户端 ID 取适配器 ID，缺省的 `end` 保持缺省。

| 请求        | CoinAPI 端点                        | 响应           | `ts_event`        | `ts_init`       |
| ----------- | ----------------------------------- | -------------- | ----------------- | --------------- |
| 成交        | `/trades/{symbol_id}/history`       | `TradeTick`    | `time_exchange`   | `time_exchange` |
| 报价        | `/quotes/{symbol_id}/history`       | `QuoteTick`    | `time_exchange`   | `time_exchange` |
| Bar         | `/ohlcv/{symbol_id}/history`        | `Bar`          | `time_period_end` | `time_period_end` |
| 订单簿快照  | `/orderbooks/{symbol_id}/current`   | L2 `OrderBook` | `time_exchange`   | 不适用。        |

历史报价、成交和 bar 的 `ts_init` 与 `ts_event` 都用事件时间，因此响应过滤保留请求的场所时间窗口。

### 时间窗口与限额 {#time-windows-and-limits}

成交、报价和 bar 请求要求 `start`，按 [`start`, `end`) 翻页，`end` 缺省时取当前时间。`limit` 从 `start` 起计数，封顶返回的记录数。翻页规则见
[原生 HTTP 请求](#raw-http-requests)，信用额度预算截断响应时客户端记录警告。

请求边界向上取整到 CoinAPI 的 100 纳秒时间戳分辨率，保持对该时间网格上记录的选取不变。

### 历史延迟 {#history-lag}

CoinAPI 的历史端点落后于实时数据流。即使实时流正常，最近的时间窗口也可能返回空记录或不完整结果。遇到这种情况就请求更早的窗口，例如前一天。适配器只使用历史端点，不回退到最新数据端点。

### 已收盘 bar {#closed-bars}

Bar 请求接受与 bar 订阅相同的 bar 类型。响应只包含在 `end` 之前、且在响应到达时已经收盘的周期。进行中的周期绝不会作为 bar 返回。`limit` 在剔除之前按 CoinAPI 周期计数。

### 当前订单簿快照 {#current-book-snapshots}

订单簿快照请求把 `depth` 作为 `limit_levels` 传入，或省略以使用 CoinAPI 默认深度。比金融工具精度更细的档位会导致整个快照被拒绝，而不是返回残缺订单簿。

### 失败请求 {#failed-requests}

失败的请求记录错误，不发送响应。

## 精度 {#precision}

客户端按金融工具的价格与数量精度转换价格和数量。这些精度来自 CoinAPI 的数据分辨率，可能落后于数据流，因此小数位更多的值会被丢弃并告警，而不是四舍五入。末尾零不计入小数位。历史响应对每条记录应用同样规则，并把丢弃条数汇总为一条警告。

OHLCV 成交量对微小数值尾巴有一个有界例外。仅当调整同时满足以下两条上限时，客户端才按金融工具的数量精度做四舍六入五成双（half to even）：

- 不超过上报成交量的 `1e-15` 倍。
- 不超过该精度下一个最小单位的 `1e-6` 倍。

数量精度为 8 时，绝对上限是 `0.00000000000001`。负成交量和更大的精度失配会被拒绝。价格保持精确转换规则。

绝对上限不随成交量增长而放宽，因此更大的聚合成交量即便尾巴满足相对上限，仍可能被拒绝。

比配置精度更细的订单簿档位会拒绝整条消息。delta 订阅启动恢复，深度订阅丢弃该消息。若 CoinAPI 的价格分辨率对数据流太粗，设置[价格精度覆盖](#price-precision-overrides)。数量精度没有覆盖项。

### 价格精度覆盖 {#price-precision-overrides}

用 `price_precisions` 替换所选金融工具的价格精度。客户端在构建金融工具时应用它，因此定义、数据流和历史响应都使用该精度。为选择范围之外的金融工具、或超过 Nautilus 最大精度设置覆盖，会在构造时报错。数量精度没有覆盖项。

```python
data_config = CoinApiDataClientConfig(
    instruments=[
        CoinApiInstrumentSelection(
            "COINBASE",
            [InstrumentId.from_str("LTC-USD.COINBASE")],
            filter_symbol_id="COINBASE_SPOT_LTC_USD",
        ),
    ],
    price_precisions={InstrumentId.from_str("LTC-USD.COINBASE"): 3},
)
```

Rust 中，把同样的映射传给 `CoinApiDataClientConfig::builder().price_precisions(...)`。

### OHLCV 精度警告 {#ohlcv-precision-warnings}

:::warning
CoinAPI 的 OHLCV 价格可能比金融工具元数据允许的小数位更多，即便成交价格能装下。例如 `84761.955` 这个 BTC/USD OHLCV 价格装不进 `0.01` 分辨率。设置合适的 `price_precisions` 覆盖，避免丢失 bar。

历史 OHLCV 成交量也可能带微小数值尾巴，如 `1.2582318399999999` 对应 `1.25823184`。客户端在[有界容差](#precision)内接受它们，更大的失配仍会丢弃该 bar。
:::

## 连接生命周期 {#connection-lifecycle}

`disconnect` 先取消待处理的订阅与请求，再关闭连接。排队的订阅无法重新打开连接，被取消的请求不发送响应。之后 `connect` 会重新加载金融工具并允许新的订阅与请求。`stop`、`reset` 和 `dispose` 取消待处理工作并直接丢弃连接，不做等待。

## 使用与访问限制 {#usage-and-access-constraints}

### 账户限额 {#account-limits}

REST 用量受并发限制和数据信用额度约束，WebSocket 用量按数据传输量计量。选择数据源前，先确认账户的权益、连接配额和
[当前定价](https://www.coinapi.io/products/market-data-api/pricing?ref=nautilus)。套餐的传输额度不保证能访问每个通道或来源。

下表是截至 2026 年 10 月定价页列出的每日额度，变化与超额费用以链接页面为准。

| 套餐          | REST 信用额度 | Tier 1 传输 | Tier 2 传输 |
| ------------- | ------------- | ----------- | ----------- |
| Pay As You Go | 按量计费      | 按量计费    | 按量计费    |
| Startup       | 1,000         | 32 GiB      | 按量计费    |
| Streamer      | 10,000        | 128 GiB     | 1 GiB       |
| Pro           | 100,000       | 512 GiB     | 64 GiB      |
| Enterprise    | 定制          | 定制        | 定制        |

CoinAPI 把成交、报价和 L2 订单簿归为 Tier 1，OHLCV 归为 Tier 2，见
[用量 FAQ](https://www.coinapi.io/products/market-data-api/faq?ref=nautilus)。其
[L3 定价指南](https://www.coinapi.io/blog/tier-1-vs-tier-2-market-data-level-3-order-book?ref=nautilus)把持续 L3 数据流归为 Tier 2。请针对所选数据源确认计费与访问权限。

每个客户端使用一条 WebSocket 连接。同一账户上的其他节点或客户端可能占用其可用连接槽，导致 HTTP 429。请减少并发连接以适配账户限额。耗尽硬限额的 REST 配额同样返回 HTTP 429。

:::warning
CoinAPI 会把会话内的数据类型、交易代码和 bar 周期做组合。十个金融工具的成交加一个金融工具的订单簿，可能传输全部十个金融工具的订单簿。适配器会过滤掉未请求的组合，但它们的传输仍会计费。在同一客户端上组合数据源时请考虑这一点。
:::

### 本地信用额度预算 {#local-credit-budget}

数据客户端的 `credit_budget` 限制单个客户端实例可消耗的信用额度，默认 100。每次金融工具元数据尝试无论响应大小都消耗 1 点本地信用。用 `filter_symbol_id` 减少传输与解析开销。规划要为全部历史请求留出额度：区间请求到预算上限即停止，返回截断的响应。批量历史请用下载的[扁平文件](#flat-files)避免重复 REST 请求，并比较其传输成本与 REST 信用。

`max_concurrent_requests` 限制并发 REST 请求数。本地信用预算作用于客户端整个生命周期，与 CoinAPI 计费相互独立。每次尝试为历史请求预留 `ceil(limit / 100)` 点信用，无记录上限的请求预留 1 点。

CoinAPI 按每 100 条返回记录对历史请求计费。因此成功的历史页会退回超出 `ceil(records / 100)` 的未用预留。本地最低计费为 1 点。失败、重试和被取消的尝试不予退回。客户端在 HTTP 429 时退避，在 HTTP 403 时快速失败。见
[API 限额与计费参考](https://www.coinapi.io/products/market-data-api/docs/api-limits-and-billing-metrics?ref=nautilus)。

### 历史回填 {#backfills}

历史请求要设置明确的记录上限和时间窗口。没有记录上限时，一个请求的首屏就可能预留剩余的全部信用预算，让其他请求无额度可用。每个历史页都有自己的 REST 重试预算。

批量历史请比较 REST 信用成本与下载的[扁平文件](#flat-files)。HTTP 调用更少未必意味着计费信用更少。文件需另行下载后再加载，适配器不会列出或下载 S3 对象。

## 原生 HTTP 请求 {#raw-http-requests}

直接访问 Rust 时，`CoinApiHttpClient` 接受 `SecretString` API 密钥和 `CoinApiHttpConfig`。基础 URL 含 `/v1/`。认证用 `X-CoinAPI-Key`。拒绝重定向。客户端忽略系统代理环境变量，除非设置 `proxy_url`，否则直连。

原生客户端暴露交易所与活跃金融工具元数据、历史成交/报价/OHLCV，以及单金融工具当前 L2 和 L3 订单簿。金融数值保持精确的十进制表示，超出 `Decimal` 精度的值解析失败而不是舍入。

### 单页与区间 {#single-pages-and-ranges}

`get_trades`、`get_quotes` 和 `get_ohlcv` 对一个明确的时间窗口和 `[1, 100000]` 内的记录上限返回一页。满页不代表窗口已取完。`get_trades_range`、`get_quotes_range` 和 `get_ohlcv_range` 对整个 `HistoryRange` 翻页，其可选上限限制总记录数，可以超过 100,000。

### 时间边界 {#time-boundaries}

成交与报价区间按场所时间选取 `[time_start, time_end)`。OHLCV 区间按周期起始时间选取周期。数据客户端还会剔除未收盘的周期。窗口之外的记录会被过滤。

### 翻页 {#pagination}

#### 页大小与完成条件 {#page-sizes-and-completion}

每页请求剩余请求上限、100,000 条最大值和剩余信用预算中能装下的最大 limit。短页、或达到请求上限的满页都会结束区间。默认 100 点信用预算下每页最多 10,000 条，因此跨页续取需要更大的预算。

#### 共享时间戳的记录 {#records-sharing-a-timestamp}

满页需要续取时，翻页会重读页尾的时间戳分组以避免页边界重复记录。若同一时间戳的记录占满整页导致游标无法推进，或某页不是升序，翻页失败。

#### 窗口之外的记录 {#records-outside-the-window}

窗口之外的记录被丢弃。窗口内没有成交时，CoinAPI 的 OHLCV 会返回同一 UTC 日的邻近周期；只含这类周期的一页即结束区间。

#### 信用耗尽与并发区间 {#credit-exhaustion-and-concurrent-ranges}

信用预算不够支付下一页时，结果携带已收集的记录并置 `is_truncated=true`。失败的尝试保留其预留后，预算可能不足。首屏就没有足够信用时请求失败。同一客户端上的区间请求逐个执行，因此每个请求在先前区间结清信用之后再确定自己的页大小。

## 原生 WebSocket 数据流 {#raw-websocket-streams}

直接访问 Rust 时，`CoinApiWebSocketClient` 接受 API 密钥和 `CoinApiWebSocketConfig`，返回消息接收端。默认端点为 `wss://ws.coinapi.io/v1/`。`Subscription` 指定数据类型、精确完整的 CoinAPI `symbol_id`，以及需要时的 OHLCV 周期。

客户端解码 `trade`、`quote`、`book`、`book5`、`book20`、`book50`、`book_l3` 和 `ohlcv`。它保留十进制值，记录并丢弃畸形帧，忽略元数据流。订阅变更在入队后即返回，收到匹配数据即确认订阅。[订阅节奏](#subscription-changes)、[订单簿通道限制](#channel-conflicts)和[会计费的组合范围](#account-limits)同样适用于该客户端。

### 重连与错误 {#reconnects-and-errors}

五秒没有消息即触发重连。第一次尝试立即进行，之后从一秒退避到 30 秒、逐步翻倍并附加最多 500 毫秒抖动。只有一个连接槽的账户，重连可能持续收到 HTTP 429，直到 CoinAPI 释放旧连接。

重连恢复订阅范围并发出 `CoinApiWsMessage::Reconnected`。原生订单簿序号按连接重新开始编号，重连后要清空订单簿状态。数据客户端会自动处理订单簿状态与序号连续性。

服务端 `reconnect` 通知不打断数据流，客户端在服务端关闭时才重连。CoinAPI `error` 发出 `CoinApiWsMessage::Error`、清空全部订阅并结束连接且不重连，下一次订阅新建连接。认证错误可能在 WebSocket 升级成功之后才到达。关闭或丢弃客户端会关闭其连接。

## 扁平文件 {#flat-files}

CoinAPI [Flat Files](https://www.coinapi.io/products/flat-files?ref=nautilus) 是经 S3 兼容 API 提供的按天或按小时的 `.csv.gz` 导出。适配器把已下载的文件加载为 Nautilus 数据，不负责列出或下载。加载器沿用 Tardis CSV 加载器的模式：每个 `load_*` 函数返回整个文件，每个 `stream_*` 函数分块产出。两者都接受可选的价格与数量精度以及记录 `limit`。

| 模式                          | 加载                         | 流式                    | 输出             |
| ----------------------------- | ---------------------------- | ----------------------- | ---------------- |
| `T-TRADES`                    | `load_coinapi_trades`        | `stream_coinapi_trades` | `TradeTick`      |
| `T-QUOTES`                    | `load_coinapi_quotes`        | `stream_coinapi_quotes` | `QuoteTick`      |
| `T-LIMITBOOK_FULL`            | `load_coinapi_deltas`        | `stream_coinapi_deltas` | `OrderBookDelta` |
| `T-OHLCV_ACTIVE_CONSOLIDATED` | `CoinApiOhlcvLoader.load_bars` | 无                    | `Bar`            |

Rust 中对应 `nautilus_coinapi::csv::{load_trades, stream_trades, ...}` 和 `CoinApiOhlcvLoader::load_bars`。

### 订单簿示例 {#order-book-example}

load 调用从 `D-20250901` 推导日期。stream 读取的是重命名后的文件，所以要显式传 `date`，并为金融工具的增量设置精度而不是推断。这些精度必须容纳每一个值：更细的值会让流失败，而不是被舍入。

```rust tab="Rust"
use jiff::civil::date;
use nautilus_coinapi::csv::{load_deltas, stream_deltas};
use nautilus_model::identifiers::InstrumentId;

let instrument_id = InstrumentId::from("BTC-USD.COINBASE");

let path = "T-LIMITBOOK_FULL/D-20250901/E-COINBASE/IDDI-27576+SC-COINBASE_SPOT_BTC_USD+S-BTC__002DUSD.csv.gz";
let deltas = load_deltas(path, instrument_id, None, None, None, None)?;

let chunks = stream_deltas(
    "coinbase_btc_usd_book.csv.gz",
    instrument_id,
    Some(date(2025, 9, 1)),
    100_000,    // chunk_size
    Some(2),    // price_precision
    Some(8),    // size_precision
    None,       // limit
)?;

for chunk in chunks {
    let deltas = chunk?;
}
```

```python tab="Python"
import datetime

from nautilus_trader.adapters.coinapi import load_coinapi_deltas
from nautilus_trader.adapters.coinapi import stream_coinapi_deltas
from nautilus_trader.model import InstrumentId

instrument_id = InstrumentId.from_str("BTC-USD.COINBASE")

path = "T-LIMITBOOK_FULL/D-20250901/E-COINBASE/IDDI-27576+SC-COINBASE_SPOT_BTC_USD+S-BTC__002DUSD.csv.gz"
deltas = load_coinapi_deltas(path, instrument_id)

for chunk in stream_coinapi_deltas(
    "coinbase_btc_usd_book.csv.gz",
    instrument_id,
    date=datetime.date(2025, 9, 1),
    price_precision=2,
    size_precision=8,
):
    ...
```

### Bar 示例 {#bars-example}

`CoinApiOhlcvLoader` 把数字 `symbol_id` 映射到金融工具。`27576` 是 `COINBASE_SPOT_BTC_USD` 的 REST `symbol_id_int`。它从 `TP-1MIN` 读取周期，跳过未映射的代码。Rust 还提供 `CoinApiOhlcvLoader::from_symbols`，从元数据构建映射。

```rust tab="Rust"
use nautilus_coinapi::csv::CoinApiOhlcvLoader;
use nautilus_model::identifiers::InstrumentId;

let loader = CoinApiOhlcvLoader::new([(27_576, InstrumentId::from("BTC-USD.COINBASE"))]);
let bars = loader.load_bars(
    "T-OHLCV_ACTIVE_CONSOLIDATED/D-20250911/E-COINBASE/TP-1MIN.csv.gz",
    None,   // period_id, read from the file name
    None,   // limit
)?;
```

```python tab="Python"
from nautilus_trader.adapters.coinapi import CoinApiOhlcvLoader
from nautilus_trader.model import InstrumentId

loader = CoinApiOhlcvLoader({27576: InstrumentId.from_str("BTC-USD.COINBASE")})
bars = loader.load_bars("T-OHLCV_ACTIVE_CONSOLIDATED/D-20250911/E-COINBASE/TP-1MIN.csv.gz")
```

### 文件布局 {#file-layout}

#### 金融工具文件 {#symbol-files}

加载器接受带表头的分号分隔文件。成交、报价和订单簿文件每个只含一个金融工具，路径形如
`T-{SCHEMA}/D-{YYYYMMDD|YYYYMMDDHH}/E-{EXCHANGE}/IDDI-{ID}+SC-{SYMBOL_ID}+S-{EXCHANGE_SYMBOL}.csv.gz`。
每个文件要传入显式的 `instrument_id`。

CoinAPI 还记载了逗号分隔、订单簿时间戳为完整日期时间、或订单簿更新类型为数字的导出变体。这些加载器要求分号分隔、订单簿时间戳为时分秒、更新类型为 `SNAPSHOT`、`ADD`、`SET` 这类名称。其他布局请先转换再加载，见
[完整订单簿数据集指南](https://www.coinapi.io/products/flat-files/docs/datasets/limitbook?ref=nautilus)。

#### 存储桶与保留 {#buckets-and-retention}

`coinapi` 桶存放历史数据：2026-06-09 之前按天分区，该日期起成交、报价和完整订单簿按小时分区。`coinapi-daily-tail` 桶只存放前一天的按天成交、报价和完整订单簿文件，保留 24 小时。它不是归档，也不含 OHLCV。见
[文件结构](https://www.coinapi.io/products/flat-files/docs/datasets?ref=nautilus)。

#### OHLCV 文件 {#ohlcv-files}

[OHLCV 数据集指南](https://www.coinapi.io/products/flat-files/docs/datasets/ohlcv?ref=nautilus)记载 `coinapi` 桶中的全交易所按天文件，路径为
`T-OHLCV_ACTIVE_CONSOLIDATED/D-{YYYYMMDD}/E-{EXCHANGE}/TP-{PERIOD}.csv.gz`，每个周期一个文件，周期取 `1SEC`、`1MIN`、`1HRS` 或 `1DAY`。每行的数字 `symbol_id` 就是 REST `symbol_id_int`。加载器把它映射到金融工具、跳过未映射的行，并在未传 `period_id` 时从 `TP-` 读取周期。通用文件结构页还列出按小时的 OHLCV 路径，下载时请确认实际存在的对象。两种布局都由加载器从行内读取时间戳。

### 订单簿数据 {#order-book-data}

含订单 ID 的订单簿文件产出 L3 market-by-order delta，不含的产出 L2 market-by-price delta。例如 Coinbase 现货文件含订单 ID，Binance 现货文件只描述价格档位。应用 delta 时请使用对应的 `BookType`。

初始快照发出一个 `Clear` 后跟一串 `Add` delta，全部带 `F_SNAPSHOT`。同一场所时间戳的后续更新构成一个以 `F_LAST` 结尾的事件。流式分块通常在事件边界结束，可能超过 `chunk_size`。记录 `limit` 可能把最后一个事件截短——其最后一个 delta 仍带 `F_LAST`，因此设了 limit 的加载可能留下不完整的订单簿。

L3 成交更新会削减订单剩余数量，归零即删除。删除后的订单 ID 可能被后续 add 复用。对未知订单的其他更新（删除除外）记录日志并跳过。

### 时间戳 {#timestamps}

成交、报价和 OHLCV 行携带不带时区的 UTC 日期时间，如 `2025-09-01T00:00:00.1780000`。订单簿行只有时分秒，如 `00:00:00.0140000`。因此订单簿加载器用文件的 `D-` 分区为每行定日期；文件不在 `D-` 分区下时用 `date`。快照时间戳晚于首个更新时，它携带的是前一天的收盘时刻，日期要回退一天。`time_coinapi` 比 `time_exchange` 小超过半天时，说明它落在午夜之后，日期要前移一天。

`ts_event` 取 `time_exchange`，`ts_init` 取 `time_coinapi`。bar 两者都取 `time_period_end`。

### 精度 {#precision-1}

价格和数量从文本精确转换。`load_*` 从读取的全部行推断未指定的精度，设了 `limit` 时以它为界。`stream_*` 采样前一万行，后续值需要舍入时抛错。文件精度未知时请显式传入精度。OHLCV 加载器按金融工具推断精度，成交量有下述例外。

CoinAPI 默认使用[高精度模式](./../getting_started/installation.md#precision-mode)：16 位小数而非 9 位，以容纳加密货币数量和 CoinAPI 成交量。OHLCV 的 `sx_sum` 可能带与浮点噪声一致的数值尾巴，如 `689.5507347100003`。加载器按构建版本的最大精度对成交量做四舍六入五成双，只改动超出该精度的值，例如标准精度构建下的本例。它拒绝负的源成交量和舍入后归零的正成交量。源值为零的成交量保持有效。

## 配置 {#configuration}

把 `CoinApiDataClientFactory` 和 `CoinApiDataClientConfig` 注册到节点 builder。默认客户端 ID 是 `COINAPI`，自定义客户端名会用作其客户端 ID。

| 字段                         | 默认值    | 用途                                                        |
| ---------------------------- | --------- | ----------------------------------------------------------- |
| `api_key`                    | `None`    | API 密钥；`None` 读取 `COINAPI_API_KEY`。                   |
| `base_url_http`              | `None`    | REST URL 覆盖，含 `/v1/`。                                  |
| `base_url_ws`                | `None`    | WebSocket URL 覆盖。                                        |
| `proxy_url`                  | `None`    | REST 与 WebSocket 的显式 HTTP(S) 代理。                     |
| `instruments`                | 空        | 连接时加载的金融工具选择。                                      |
| `credit_budget`              | `100`     | 该客户端的本地生命周期 REST 信用额度。                      |
| `max_retries`                | `3`       | 失败 REST 请求的最大重试次数。                              |
| `http_timeout_secs`          | `30`      | 单次尝试的 REST 超时，含并发准入。                          |
| `max_concurrent_requests`    | `1`       | 最大并发 REST 请求数。                                      |
| `retry_delay_initial_ms`     | 1,000     | 初始 REST 重试延迟。                                        |
| `retry_delay_max_ms`         | 10,000    | REST 退避上限；提供商的重试延迟可能超过它。                 |
| `retry_max_elapsed_ms`       | 120,000   | 每次 REST GET 的总预算，含准入与重试。                      |
| `transport_backend`          | `Sockudo` | 共享 WebSocket 后端，也可选 `Tungstenite`。                 |
| `book_snapshot_timeout_secs` | `10`      | 等待订单簿快照的秒数，`0` 禁用。                            |
| `price_precisions`           | 空        | 按金融工具 ID 的价格精度覆盖。                                  |

配置拒绝未知字段。不设置 URL 覆盖时使用生产端点。Sockudo 是默认 WebSocket 后端，设 `transport_backend=TransportBackend.TUNGSTENITE` 改用 Tungstenite，`TransportBackend` 从 `nautilus_trader.network` 导入。

`proxy_url` 让两种传输都走显式 HTTP(S) 代理，系统环境代理仍然禁用。URL 必须包含 `http://` 或 `https://`。SOCKS URL 在客户端构造时报错。代理凭据在 Rust debug 输出中保持脱敏，Python getter 也不暴露它。Python 的 `has_proxy_url` 属性报告是否配置了显式代理。

`credit_budget`、`max_concurrent_requests`、`retry_max_elapsed_ms` 和 `http_timeout_secs` 必须为正。每个历史页有自己的 REST 重试预算。初始重试延迟必须为正，且最大值不得低于初始延迟。无效的退避设置在客户端构造时报错。单次尝试超时包含等待并发准入的时间，但不含重试延迟；总时长预算两者都包含。

### Python 配置 {#python-configuration}

`nautilus_trader.adapters.coinapi` 包导出 `CoinApiDataClientConfig`、`CoinApiInstrumentSelection`、`CoinApiDataClientFactory` 以及 `COINAPI` 和 `COINAPI_CLIENT_ID` 常量。配置以关键字参数接收上述字段，并把除 `api_key` 和 `proxy_url` 外的每个字段暴露为只读属性。其字符串表示省略所有值。金融工具选择接收交易所、金融工具 ID 列表，以及可选的 `filter_symbol_id` 和 `filter_asset_id` 过滤器。

```python
from nautilus_trader.adapters.coinapi import CoinApiDataClientConfig
from nautilus_trader.adapters.coinapi import CoinApiDataClientFactory
from nautilus_trader.adapters.coinapi import CoinApiInstrumentSelection
from nautilus_trader.common import Environment
from nautilus_trader.live import LiveNode
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import TraderId

instrument_id = InstrumentId.from_str("BTC-USD.COINBASE")

data_config = CoinApiDataClientConfig(
    instruments=[
        CoinApiInstrumentSelection(
            "COINBASE",
            [instrument_id],
            filter_symbol_id="COINBASE_SPOT_BTC_USD",
        ),
    ],
    price_precisions={instrument_id: 3},
)

node = (
    LiveNode.builder("COINAPI-001", TraderId("TESTER-001"), Environment.LIVE)
    .add_data_client(None, CoinApiDataClientFactory(), data_config)
    .build()
)
```

工厂在 `build` 期间创建客户端，无效的凭据、端点或代理 URL、零并发数、时长预算或单次超时、无效的退避设置都会在此报错。示例从 `COINAPI_API_KEY` 读取密钥，并把 BTC/USD 价格精度覆盖为 3 以容纳三位小数的 OHLCV 价格，见[精度](#precision)。通用节点搭建见
[配置实时交易](./../how_to/configure_live_trading.md)。

### 金融工具选择 {#instrument-selections}

每个 `CoinApiInstrumentSelection` 指定一个 CoinAPI 交易所、要加载的原生金融工具 ID，以及可选的 `filter_symbol_id` 和 `filter_asset_id` 元数据过滤器。构造时拒绝空 ID 列表、映射到其他 CoinAPI 交易所的 ID，以及被选择多次的 ID。用 `filter_symbol_id` 限制元数据的传输与解析量。每次请求尝试无论响应大小都消耗 1 点本地信用。

连接时每个选择加载一次，任何选定金融工具缺失都会导致失败。只有选定的金融工具会被发布。用显式选择保持 CoinAPI 与原生适配器的[互不相交](#using-coinapi-with-native-adapters)。

金融工具请求始终从 CoinAPI 获取，并刷新用于流转换的定义和用于 REST 请求的 `symbol_id`。订阅沿用 `connect` 加载的 ID，传输重连后也一样。要让订阅使用刷新的 ID，需要断开并重连数据客户端。

- `request_instrument` 只接受配置过的 ID，其他 ID 返回错误。
- `request_instruments` 返回所请求场所的已配置金融工具；请求未指明场所时返回全部已配置金融工具。响应中未被请求的场所带 `COINAPI` 场所。
- 请求没有配置金融工具的场所时，直接返回空响应，不发起 REST 调用。

## 故障排查 {#troubleshooting}

| 症状                                                 | 可能原因                                                                                     | 处理措施                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 构建时报 `CoinAPI API key not configured`            | `api_key` 与 `COINAPI_API_KEY` 都未设置。                                                    | 设置其中之一。                                                                              |
| `subscription change failed, retrying` 伴随 HTTP 429 | 账户唯一连接被其他客户端或节点占用。                                                         | 停掉另一路连接；客户端会重试直到 CoinAPI 释放连接槽。                                       |
| `WsHelloPerIp` 错误后无数据                          | 该 IP 发出的 `hello` 消息过多（含其他客户端）。                                              | 降低该 IP 的订阅变更频率；下一次订阅会重连。                                                |
| `Conflicting CoinAPI book subscription`              | 该金融工具已在流式另一订单簿通道或深度。                                                         | 先退订其订单簿，或改用相同的通道与深度。                                                    |
| `CoinAPI streams one book channel per connection`    | 另一金融工具在流式不同的订单簿通道。                                                             | 改用当前通道，或先退订全部订单簿。                                                          |
| 反复出现 `Invalid book message` 警告                 | 订单簿档位超出金融工具精度，或 L3 条目缺少订单 ID。                                              | 必要时覆盖价格精度；对没有订单 ID 的数据源改用 L2。                                         |
| `Dropping CoinAPI` 报价/成交/bar 警告                | 价格或数量超出金融工具精度；OHLCV 成交量需要的舍入超出容差。                                     | 必要时覆盖价格精度；数量精度与成交量容差没有覆盖项。                                        |
| 请求最近一小时的历史返回空                           | 历史可能落后于实时数据，近期历史可能尚未可用。                                               | 请求更早的窗口。                                                                            |
| `credit budget truncated` 历史警告                   | 区间请求进行到一半时信用预算耗尽。                                                           | 调大 `credit_budget` 或缩小时间窗口。                                                       |

## 局限 {#limitations}

- 不支持历史订单簿快照和自动区域 REST 故障切换。
- Sandbox 访问未经确认。
- 数量精度只来自 CoinAPI 元数据，没有覆盖项。
- 不支持自动金融工具更新、状态事件、指标和期权。
- 适配器加载已下载的扁平文件，但不会列出或下载 S3 对象。

## 参与贡献 {#contributing}

:::info
为 CoinAPI 适配器做贡献，见
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
