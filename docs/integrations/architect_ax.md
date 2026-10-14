# AX Exchange

[AX Exchange](https://architect.exchange) 是一家受监管的中心化衍生品交易所，标的为传统资产类别。Architect Bermuda Ltd. 持有 [Bermuda Monetary Authority（BMA）](https://www.bma.bm)牌照运营 AX。AX 的生产与 sandbox 目录都上架永续和到期期货合约。

本集成支持基于 AX Exchange 的实时行情接入与订单执行。

## 概览 {#overview}

适配器以 Rust 实现，通过 PyO3 绑定暴露给 Python，不需要外部 AX 客户端库。

本指南假定读者要同时配置实时行情与交易执行。AX Exchange 适配器包含多个组件，按用途可组合使用也可单独使用：

- `AxHttpClient`：低层 HTTP API 连接。
- `AxMdWebSocketClient` 与 `AxOrdersWebSocketClient`：供 Rust 调用方使用的低层 WebSocket 连接。
- `AxDataClient`：行情数据源管理器。
- `AxExecutionClient`：账户管理与交易执行网关。
- `AxDataClientFactory`：AX 数据客户端工厂。
- `AxExecutionClientFactory`：AX 执行客户端工厂。

:::note
多数用户按下文配置实时交易节点即可，不需要直接使用这些底层组件。
:::

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/architect_ax/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/architect_ax/examples/)

## AX Exchange 文档 {#ax-exchange-documentation}

AX Exchange 在 [Architect 文档站](https://docs.architect.exchange/) 提供用户文档。请与本 NautilusTrader 集成指南配合阅读。

## 产品 {#products}

生产目录按以下场所类别上架永续和到期期货合约：

| 场所类别   | 示例                         | Nautilus 资产类别 |
| ---------- | ---------------------------- | ----------------- |
| 外汇       | `EURUSD-PERP`、`JPYUSD-PERP` | FX                |
| 股票       | `AAPL-PERP`、`NVDA-PERP`     | Equity            |
| 金属       | `XAU-PERP`、`XAU-2026-DEC`   | Commodity         |
| 能源       | `WTIOIL-PERP`                | Commodity         |
| 国债       | `UST10Y-PERP`                | Debt              |
| 算力       | `NVDA-H100-2027-MAR`         | Alternative       |

sandbox 目录有所不同：它还上架 `energy_etfs` 合约（如 `USO-PERP`、`UNG-PERP`，映射到 Equity 资产类别），以及算力永续（如 `OCPI-H100-PERP`）。

适配器把 `crypto` 场所类别映射为 `CRYPTOCURRENCY` 资产类别，无法识别的类别一律映射为 `ALTERNATIVE`。

### 永续合约 {#perpetual-contracts}

永续合约（永续互换）是跟踪标的资产价格、没有到期日的衍生品。与标准期货不同，它没有结算日，因此没有展期成本，持仓管理也更简单。资金费率机制通过多空持有者之间的周期性支付，使合约价格与标的指数价格保持一致。资金费率机制与合约规格的细节见 [Architect 文档](https://docs.architect.exchange/)。

AX 永续合约的特征：

- **以 USD 现金结算**：无实物交割，全部盈亏以 USD 结算。
- **资金费率**：周期性支付使合约价格与标的一致。
- **乘数为 1**：每张合约代表一单位标的暴露。
- **只支持整数张合约**：不支持小数数量。
- **保证金**：开仓需要初始保证金，维持持仓需要维持保证金。

适配器把无到期日的 AX 金融工具表示为 `PerpetualContract`，有到期日的表示为 `FuturesContract`。场所类别决定 Nautilus 资产类别。适配器使用 `MARGIN` 账户类型和 `NETTING` 订单管理。

## 代码体系 {#symbology}

适配器保留每个 AX 代码原样，并追加 Nautilus 场所标识 `.AX`。永续代码使用 `-PERP` 后缀，到期代码包含年份和合约月份。

| 合约         | AX 代码        | Nautilus InstrumentId |
| ------------ | -------------- | --------------------- |
| EUR/USD 永续 | `EURUSD-PERP`  | `EURUSD-PERP.AX`      |
| 黄金永续     | `XAU-PERP`     | `XAU-PERP.AX`         |
| 黄金到期合约 | `XAU-2026-DEC` | `XAU-2026-DEC.AX`     |

场所标识是 `AX`。构造 Nautilus `InstrumentId`：

```python
from nautilus_trader.model import InstrumentId

instrument_id = InstrumentId.from_str("EURUSD-PERP.AX")
```

## 环境 {#environments}

AX Exchange 提供两种交易环境，用客户端配置中的 `environment` 参数选择。

| 环境         | 配置                                   | 说明                             |
| ------------ | -------------------------------------- | -------------------------------- |
| **Sandbox**  | `environment=AxEnvironment.SANDBOX`    | 模拟资金的测试环境。             |
| **Production** | `environment=AxEnvironment.PRODUCTION` | 真实资金的实盘交易。             |

### Sandbox {#sandbox}

开发与测试的默认环境，使用模拟资金。设置 `environment=AxEnvironment.SANDBOX` 后所有 sandbox 端点自动解析。

#### 1. 创建 sandbox 账户 {#1-create-a-sandbox-account}

按 [Architect 文档](https://docs.architect.exchange/) 创建 sandbox 账户。注册时需要邀请码。

#### 2. 创建 API 密钥并为账户注资 {#2-create-api-keys-and-fund-the-account}

用 AX sandbox UI 生成 API 密钥并向账户存入模拟资金。妥善保存 `api_key` 和 `api_secret`。

#### 3. 设置环境变量 {#3-set-environment-variables}

```bash
export AX_API_KEY="your-sandbox-api-key"
export AX_API_SECRET="your-sandbox-api-secret"
```

#### 4. 配置交易节点 {#4-configure-the-live-node}

在数据与执行客户端配置上设置 `environment=AxEnvironment.SANDBOX`。完整的 `LiveNode` 搭建见
[Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/architect_ax/)。

### 生产环境 {#production}

用于真实资金实盘交易，需要已完成认证的 AX Exchange 账户。

```python
config = AxExecutionClientConfig(
    environment=AxEnvironment.PRODUCTION,
)
```

:::warning
下单前务必确认环境正确。默认是 Sandbox，以防误入实盘。
:::

## 行情数据 {#market-data}

适配器经 WebSocket 订阅提供实时行情，并提供 HTTP 端点做历史数据回填。

### 数据类型 {#data-types}

| AX 数据          | Nautilus 数据类型   | 说明                                                           |
| ---------------- | ------------------- | -------------------------------------------------------------- |
| 订单簿（L1）     | `QuoteTick`         | 来自 L1 簿订阅的最优买卖价 top-of-book。                       |
| 订单簿（L2）     | `OrderBookDelta`    | 按价格档位聚合。                                               |
| 订单簿（L3）     | `OrderBookDelta`    | 每次快照的逐单数量，使用合成 ID。                              |
| 成交             | `TradeTick`         | 仅成交 WebSocket 订阅的实时成交事件。                          |
| Mark 价格        | `MarkPriceUpdate`   | 从 L1 ticker 订阅提取。                                        |
| Bar/candle       | `Bar`               | OHLCV 数据（只有总量，无买卖拆分）。                           |
| 资金费率         | `FundingRateUpdate` | 经 HTTP 轮询；间隔可配置。                                     |
| 金融工具状态         | `InstrumentStatus`  | 来自 L1 ticker 订阅的状态变更。                                |

AX 金融工具状态到 `MarketStatusAction` 的映射：

| AX 状态                          | `MarketStatusAction`          |
| -------------------------------- | ----------------------------- |
| 开盘前                           | `PRE_OPEN`                    |
| 开盘                             | `TRADING`                     |
| 收盘、收盘冻结                   | `CLOSE`                       |
| 暂停交易（halted）               | `HALT`                        |
| 收盘集合竞价                     | `CROSS`                       |
| 停牌（suspended）                | `SUSPEND`                     |
| 退市，或任何无法识别的状态       | `NOT_AVAILABLE_FOR_TRADING`   |

:::note
AX Exchange 不支持历史报价 tick 请求。报价数据只能通过 WebSocket L1 簿订阅实时获取。适配器不暴露 AX 的指数价格和金融工具收盘事件，这两类订阅会记录警告且不产出数据。
:::

:::note
AX 的 L3 快照含逐单数量但没有场所订单 ID，适配器在每次快照内分配合成 ID，无法跨快照跟踪同一笔订单。L2 与 L3 处理要求完整快照（`st: true`），适配器拒绝增量帧（`st: false`），以免清掉未变的簿档位。
:::

:::note
AX 不为行情数据发布成交标识。因此适配器的 `TradeTick.trade_id` 由成交的时间戳、价格、数量和主动方推导。只要 REST 与 WebSocket 都上报该成交的主动方，两者对同一成交给出一致 ID；AX 上报完全相同的成交共享同一 ID。这只影响按 `trade_id` 对行情去重的消费者——成交报告携带的是场所自己的成交 ID。
:::

### WebSocket 订阅行为 {#websocket-subscription-behavior}

AX 行情 WebSocket 订阅每个代码只有一条活动流。适配器选择能覆盖当前 Nautilus 订阅的最小流：

- 仅成交订阅使用 AX `level: "TRADES"`，只投递成交。
- 仅订单簿和仅报价订阅设置 AX `trades: false` 和 `ticker: false`，抑制未请求的成交与 ticker 事件。
- Mark 价格与金融工具状态订阅需要 AX ticker 事件，因此适配器在活动簿流上启用 ticker 投递；没有订单簿订阅时另开一条 L1 流。
- 订单簿 delta 按 Nautilus 簿类型对应的 AX 层级订阅。`L1_MBP` 没有支持 delta 的 AX 等价层级，适配器记录警告后改订 L2。
- 某代码同时有多个 Nautilus 数据类型活动时，只在以下变化发生时重新订阅：

  - 所需的 AX 层级或投递标志发生变化。
  - 订单簿需要新的快照（见[订单簿恢复](#order-book-recovery)）。
- 订阅变更按数据引擎发出的顺序到达 AX，因此"先退订再重订"的结果是流保持订阅。

AX 在 ticker 事件上发布估算资金费率，并在订单 WebSocket 上提供估算资金费率请求。ticker 模型保留估算资金费率元数据。Nautilus 通过 HTTP 轮询暴露已结算的资金费率更新。适配器不单独发布估算资金费率数据类型，也不请求独立估算值。

### 订单簿恢复 {#order-book-recovery}

数据客户端用[共享的订单簿恢复机制](./../developer_guide/adapters.md#order-book-recovery-ownership)管理每个订单簿 delta 订阅。AX 的 L2、L3 消息携带完整快照且没有序号。AX 在每次订阅确认后立即发送一个快照，空簿或无变化的簿也不例外。客户端把每条消息都当作快照接受。订阅写入进行期间会抑制该簿的输出，已退订订单簿的帧直接丢弃。

恢复在同一连接上用"退订 + 订阅"替换该代码的订阅，替换保留当前的层级与成交、ticker 标志。AX 把一个代码的全部行情放在一条流上，替换进行期间该代码的成交、报价、mark 价格和金融工具状态都会暂停。恢复在以下情况启动：

- 初始订阅写入失败。
- 初始订阅写入完成或连接重建后，`book_snapshot_timeout_secs`（默认 10 秒）内没有快照到达。`disconnect` 之后的数据客户端 `connect` 同样适用：客户端保留订单簿，WebSocket 客户端会重放它们的订阅。
- L2 或 L3 帧无法转换，例如增量帧（`st: false`）。订单簿停止输出直到替代快照到达；进行中的恢复当前尝试直接失败，不再等它的快照期限。

被 AX 拒绝的订阅不会送来快照，其快照期限会启动恢复。WebSocket handler 已停止导致无法入队的订阅不启动恢复，其订单簿也不输出任何东西。对已开流的订单簿再订阅 delta 会替换该流，订单簿因此从新快照开始。

每次恢复在 180 秒内最多尝试八次，指数退避；此后持续重试直到接受一个快照，重试间隔从一分钟翻倍到十五分钟。进行中的恢复带着剩余预算跨重连继续，退订或关闭会取消它。预算重试后、正处在尝试间隔等待中的恢复，在新连接上立即重试。恢复永远不会以失败状态结束。

客户端不把订阅确认与恢复尝试做关联。替换写入完成之后，替换前就已入队的快照仍能让恢复成功。订单簿无变化时 AX 不发帧，因此客户端不会把静默的订单簿当作过期。

`book_snapshot_timeout_secs` 设为 `0` 会禁用快照期限，恢复只从失败的初始写入或无效帧启动。在重试预算内，没有送达快照的替换会一直等待，直到以下事件之一：

- 客户端接受了一个快照。
- 无效帧使当前尝试失败。
- 恢复被取消。
- 180 秒初始预算结束。

### 实时恢复验证 {#live-recovery-validation}

`ax-book-stress` «压力金融工具»是订单簿同步与恢复代码变更时的«开发金融工具»。它使用 AX sandbox 行情，不提交任何订单，按订单簿数据流契约和每条转发的原生 L2 帧校验五个永续订单簿。

AX 行情流要求认证，因此该金融工具从 `AX_API_KEY` 和 `AX_API_SECRET` 读取 sandbox API 凭据，不经 `scripts/strip-adapter-env.bash` 运行。在仓库根目录运行：

```bash
CARGO_BUILD_JOBS=16 cargo test -p nautilus-architect-ax --features examples --test ax-book-stress -- --timeout 10 --rounds 14
```

`--scenario` 选择运行内容：

- `churn`（默认）：轮流验证这些情形：

  - 无效帧，每个订单簿无需重连即可恢复。
  - 重连后快照被扣住超过期限。
  - 重连后迟到的快照。
  - 被拒绝的替换。
  - 快照之前被切断的重连。
  - 恢复期间的重启。
  - 不关闭 socket 的 40 秒流量冻结。
- `initial`：在每轮的新会话中丢弃每个订单簿的首个快照并使其数据流静默。`--timeout 0` 时，订单簿保持无数据直到重连重放订阅。
- `turnover`：在恢复刚启动、替换到达场所之后、或被拒替换超期之后，对一个恢复中的订单簿执行退订加重订阅。场所处理稳定后，新订阅必须继续流式且不再有新的替换。
- `boundaries`：让重试预算内的每次尝试都被拒绝，然后校验重试上限、结束上限等待的重连、恢复期间的退订、重连期间的关闭。它要求非零 `--timeout`（每个被拒尝试由快照期限收尾），且 `--symbols` 至少三个。

`--timeout` 设置快照超时秒数（`0` 禁用快照期限），`--rounds` 设置轮数（默认 14）。`--symbols` 接收逗号分隔的代码列表。sandbox 做市商只对部分金融工具报价，而停止流式的订单簿会使运行失败，请挑选会流式的订单簿。

该金融工具需要 sandbox 行情 WebSocket 和 REST API。共享参数与输出格式见
[«压力«测试金融工具»»](./../developer_guide/spec_data_testing.md#stress-harnesses)。

### HTTP API 行为 {#http-api-behavior}

- `GET /tickers` 返回 limit/offset 分页元数据，支持 `limit`、`offset`、`sort` 查询参数。
- `GET /ticker` 在响应顶层 `ticker` 字段下返回 ticker。
- `GET /open-orders` 使用 limit/offset 分页。挂单对账遍历全部分页并校验总数、偏移、重复和完整性，检测到的响应偏差会使请求失败。
- `GET /fills` 和 `GET /funding-rates` 使用游标分页。适配器把每条游标链当作尽力而为的历史读取遍历；遍历期间 AX 侧的更正不构成原子快照。
- `GET /orders` 暴露游标元数据，支持 `order_id`、`order_ids`、`account_id` 和可选时间戳过滤。启动时的全量状态对账遍历其游标链，接受不完整分页，拒绝重复游标和重复订单 ID。
- 挂单、历史订单、成交和持仓报告请求遇到未缓存代码时经 `GET /instrument` 解析并缓存结果。金融工具请求或解析失败会使整个报告请求失败，而不是丢弃场所状态。
- `GET /transactions` 要求 `start_timestamp_ns` 和 `end_timestamp_ns`，跨度不超过 7 天。低层客户端暴露其游标与账户选择器。
- `GET /order-status` 对被拒订单可以带上 `reject_reason` 和 `reject_message`。
- 省略账户选择器时，AX 使用主账户。高层执行客户端只拥有一个主账户。低层请求模型暴露文档化的账户选择器。

### Bar 周期 {#bar-intervals}

| 周期     | 说明       |
| -------- | ---------- |
| `1s`     | 一秒       |
| `5s`     | 五秒       |
| `1m`     | 一分钟     |
| `5m`     | 五分钟     |
| `15m`    | 十五分钟   |
| `1h`     | 一小时     |
| `1d`     | 一天       |

## 订单能力 {#orders-capability}

AX 的下单 API 没有订单类型选项，其唯一的原生订单形态要求价格，适配器把它映射为 Nautilus 的 `LIMIT` 订单。适配器的 Nautilus `MARKET` 订单是模拟的：先预览一个激进价格，再以该价格带 IOC 提交上述形态。

官方
[REST place-order](https://docs.architect.exchange/api-reference/order-management/place-order)
和
[orders WebSocket](https://docs.architect.exchange/api-reference/order-management/orders-ws)
的请求 schema 都不含 `order_type` 或 `trigger_price` 字段。sandbox 中触发价未越过的止损限价提交会以当前限价立即成交。条件执行未获确认，因此适配器在发送前拒绝场所原生的止损限价订单。

Nautilus 仍可在本地模拟止损限价订单：通用订单模拟器等待配置的触发条件，然后向本适配器发送普通限价订单。

### 订单类型 {#order-types}

| 订单类型               | 支持 | 说明                                          |
| ---------------------- | ---- | --------------------------------------------- |
| `MARKET`               | ✓    | 适配器用激进 IOC 价格模拟。                   |
| `LIMIT`                | ✓    | 映射到 AX 原生带价订单形态。                  |
| `STOP_LIMIT`           | -    | *AX Exchange 不支持*。                        |
| `LIMIT_IF_TOUCHED`     | -    | *AX Exchange 不支持*。                        |
| `STOP_MARKET`          | -    | *AX Exchange 不支持*。                        |
| `MARKET_IF_TOUCHED`    | -    | *AX Exchange 不支持*。                        |
| `TRAILING_STOP_MARKET` | -    | *AX Exchange 不支持*。                        |

### 执行指令 {#execution-instructions}

| 指令             | 支持 | 说明                                                          |
| ---------------- | ---- | ------------------------------------------------------------- |
| `post_only`      | ✓    | 仅限挂单方；订单若会成为吃单方则被拒绝。                      |
| `reduce_only`    | -    | 本地拒绝；AX 没有 reduce-only 字段。                          |
| `quote_quantity` | -    | 本地拒绝；适配器传输路径只编码基础货币。                      |
| `display_qty`    | -    | 本地拒绝；适配器传输路径没有显示数量字段。                    |

适配器在下单和替换请求上省略 `rb`，post-only 订单使用 AX 默认的 `rej` 行为。不支持选择 `bo`（从对侧回撤一档）或 `tbl`（本侧最优价）。见
[AX changelog](https://docs.architect.exchange/changelog)。

订单历史、挂单和 WebSocket 订单响应在 `AxOrderDetail`、`AxOpenOrder` 和 `AxWsOrder` 上把 `rb` 保留为可选的类型化适配器元数据。它描述最近一次下单或替换请求，且只在该请求 `po: true` 时生效。缺失或为 null 的值保持缺失，无法识别的字符串映射为 `Unknown` 而不是 `Reject`。`OrderStatusReport` 不暴露该元数据，因此对账报告无法区分外部下单或替换订单所采用的重新定价策略。

reduce-only 边界之所以重要，是因为 AX 没有 reduce-only 字段。sandbox 中，场所曾在 reduce-only 指令被从传输负载中剥掉之后，把订单当普通订单接受并成交——这类订单可能开仓或加仓而不是减仓。生产环境行为未经验证。因此适配器在提交前直接拒绝 reduce-only 订单，而不是发送场所无法兑现的指令。

适配器同样拒绝按计价货币数量和显示数量指令，因为其 AX 传输路径无法编码这些语义。这是适配器边界，不代表 AX Exchange 拒绝场所原生的等价功能。

### 时效 {#time-in-force}

| 时效           | 支持 | 说明                       |
| -------------- | ---- | -------------------------- |
| `GTC`          | ✓    | 撤销前有效。               |
| `GTD`          | -    | 适配器本地拒绝。           |
| `DAY`          | ✓    | 当日有效。                 |
| `IOC`          | ✓    | 立即成交否则撤销。         |
| `FOK`          | -    | 适配器本地拒绝。           |
| `AT_THE_OPEN`  | -    | 适配器本地拒绝。           |
| `AT_THE_CLOSE` | -    | 适配器本地拒绝。           |

场所已弃用 `DAY`，建议改用 `GTC`。

### 高级订单特性 {#advanced-order-features}

| 特性             | 支持 | 说明                                                                 |
| ---------------- | ---- | -------------------------------------------------------------------- |
| 订单修改         | ✓    | 原子替换；AX 返回新的场所订单 ID。                                   |
| 撤销订单         | ✓    | 单笔订单撤销。                                                       |
| 撤销全部订单     | ✓    | 撤销某金融工具的全部挂单。                                               |
| 批量撤单         | -    | 适配器逐个发送撤销。                                                 |
| 订单列表         | ✓    | 顺序提交（订单逐个提交，非原子）。                                   |

已有场所订单 ID 的撤销会被转发，包括对终态订单的第二次撤销。本地订单已关闭或待撤销后，策略不会再发这第二次撤销。适配器只在 AX 发来 `CancelRejected` 时才发出 `OrderCancelRejected`。sandbox 对已撤销订单的重发会以 WebSocket 错误 `404`（`order not found`）回应，适配器记录该错误但不把它转成 `OrderCancelRejected`。

**方向过滤**：AX 的撤销全部没有方向参数。因此带 `order_side` 的 `CancelAllOrders` 命令会改为发送逐个撤销请求，只撤销该金融工具该方向的挂单。按方向过滤的请求只在挂单中选取，尚未被 AX 确认的在途（`SUBMITTED`）订单会在这种操作中存活。

### 持仓管理 {#position-management}

| 特性         | 支持 | 说明                             |
| ------------ | ---- | -------------------------------- |
| 查询持仓     | ✓    | 实时持仓更新。                   |
| 持仓模式     | -    | 仅净额结算模式。                 |
| 全仓保证金   | ✓    | 跨全部金融工具的全仓保证金。         |

### 订单查询 {#order-querying}

| 特性             | 支持 | 说明                                                    |
| ---------------- | ---- | ------------------------------------------------------- |
| 查询挂单         | ✓    | 列出全部活动订单。                                      |
| 查询单个订单     | ✓    | 按场所订单 ID 或客户订单 ID（任意订单状态）。           |
| 订单状态报告     | ✓    | 挂单检查与启动时的历史全量状态。                        |
| 成交报告         | ✓    | 执行与成交历史。                                        |

:::note
挂单批量检查在 `open_check_open_only` 启用（默认）时使用 `/open-orders`，否则使用 `/orders`。启动全量状态对账使用 `/orders`，因此其快照包含已成交、已撤销这类历史终态订单。经 `query_order` 的单订单查询使用专门的 `/order-status` 端点，任意订单状态都适用。

AX 的挂单与历史订单负载不暴露止损订单类型或触发价，因此 REST 来源的对账把每个可见的外部订单都报告为限价订单。适配器不提交场所原生的条件订单。

历史订单报告携带场所拒绝原因（`r`，回退到 `txt`），因此对账出的 `OrderRejected` 事件与实时事件保持同样的原因字符串。实时撤销不带原因时，对账出的 `OrderCanceled` 事件可以带上场所原因。报告保留场所的 post-only 标志和亚秒时间戳。

被替换的历史订单 ID 是终态。当日结束订单过期，未成交 IOC 订单撤销，与 WebSocket 事件路径一致。未知的订单状态会使对账请求失败，而不是从快照中悄悄漏掉订单。兄弟订单状态未知的成交仍会送达执行。

启动全量状态对账用 `reconciliation_lookback_mins` 限定 `/orders` 和 `/fills` 请求范围，持仓始终按当前快照上报。超过七天的回看实际也只取到七天成交，声明的窗口会向下取整到该上限。有界窗口下，对账后为平的金融工具的成交只作用于其订单，不物化出持仓——窗口内完成的往返开平不会在重启后产生幻影持仓。不设界时，启动会拉取并核对账户上的每一笔历史订单。
:::

:::warning
重启后没有缓存的替换历史时，对账可能把旧订单的状态或字段套用到其替换单上，让一笔活动订单在本地显示为已撤销，恢复保持不完整。恢复交易前，请对照 AX 检查被替换的订单。
:::

### 账户状态 {#account-state}

`/balances` 端点不带保证金数据，因此账户状态还要请求 `/risk-snapshot`。其 USD `initial_margin_required_total` 填充 USD 余额的锁定资金，以 USD 余额为上限。USD 的 `MarginBalance` 条目把初始保证金与维持保证金配对。`/risk-snapshot` 失败时，账户状态退回只有余额、锁定保证金为零，并记录警告。

## 认证 {#authentication}

AX Exchange 使用 bearer token 认证：

1. 用 API key 与 secret 经 `/authenticate` 换取会话 token。
2. 会话 token 作为后续 REST 与 WebSocket 请求的 bearer token。
3. 适配器申请一小时有效期的会话 token，每 30 分钟刷新一次。
4. 刷新会更新 REST 认证和下一次 WebSocket 重连使用的 token，不打断当前连接。

## 配置 {#configuration}

### 环境与端点 {#environments-and-endpoints}

| 环境       | HTTP API                                           | HTTP API（订单）                                   | 行情 WS                                            | 订单 WS                                                |
| ---------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Sandbox    | `https://gateway.sandbox.architect.exchange/api`   | `https://gateway.sandbox.architect.exchange/orders`| `wss://gateway.sandbox.architect.exchange/md/ws`   | `wss://gateway.sandbox.architect.exchange/orders/ws`   |
| Production | `https://gateway.architect.exchange/api`           | `https://gateway.architect.exchange/orders`        | `wss://gateway.architect.exchange/md/ws`           | `wss://gateway.architect.exchange/orders/ws`           |

:::info
订单管理端点（下单、撤单、替换、撤销全部、订单状态、挂单、历史订单和初始保证金要求）使用 orders 基础 URL。其余 REST 端点——包括认证、账户状态、成交、交易和行情——使用 API 基础 URL。两个 URL 都由适配器按配置的环境解析。
:::

### 数据客户端配置选项 {#data-client-configuration-options}

| 选项                               | 默认值    | 说明                                                                            |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------- |
| `api_key`                          | `None`    | API 密钥；缺省时从 `AX_API_KEY` 环境变量读取。                                  |
| `api_secret`                       | `None`    | API secret；缺省时从 `AX_API_SECRET` 环境变量读取。                             |
| `environment`                      | `SANDBOX` | 交易环境（`SANDBOX` 或 `PRODUCTION`）。                                         |
| `base_url_http`                    | `None`    | REST 基础 URL 覆盖。                                                            |
| `base_url_ws_public`               | `None`    | 行情 WebSocket URL 覆盖。                                                       |
| `base_url_ws_private`              | `None`    | 私有订单 WebSocket URL 覆盖。                                                   |
| `proxy_url`                        | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                          |
| `http_timeout_secs`                | `60`      | REST 请求超时（秒）。                                                           |
| `max_retries`                      | `3`       | 幂等 REST 请求（`GET`、`HEAD`、`OPTIONS`）的最大重试次数。                      |
| `retry_delay_initial_ms`           | `1,000`   | 重试初始延迟（毫秒）。                                                          |
| `retry_delay_max_ms`               | `10,000`  | 重试最大延迟（毫秒，指数退避）。                                                |
| `heartbeat_interval_secs`          | `20`      | WebSocket 连接心跳间隔（秒）。                                                  |
| `recv_window_ms`                   | `5,000`   | 保留字段；AX 使用 bearer token，适配器不发送窗口。                              |
| `update_instruments_interval_mins` | `60`      | 金融工具目录刷新间隔（分钟）。                                                      |
| `funding_rate_poll_interval_mins`  | `15`      | 资金费率轮询间隔（分钟）。                                                      |
| `book_snapshot_timeout_secs`       | `10`      | 初始、重连与恢复时等待订单簿快照的时长；`0` 禁用。                              |
| `transport_backend`                | `Sockudo` | WebSocket 传输后端。                                                            |

### 执行客户端配置选项 {#execution-client-configuration-options}

| 选项                      | 默认值    | 说明                                                                            |
| ------------------------- | --------- | ------------------------------------------------------------------------------- |
| `account_id`              | `AX-001`  | 执行客户端的账户 ID。                                                           |
| `api_key`                 | `None`    | API 密钥；缺省时从 `AX_API_KEY` 环境变量读取。                                  |
| `api_secret`              | `None`    | API secret；缺省时从 `AX_API_SECRET` 环境变量读取。                             |
| `environment`             | `SANDBOX` | 交易环境（`SANDBOX` 或 `PRODUCTION`）。                                         |
| `base_url_http`           | `None`    | API REST 基础 URL 覆盖。                                                        |
| `base_url_orders`         | `None`    | 订单 REST 基础 URL 覆盖。                                                       |
| `base_url_ws_private`     | `None`    | 订单 WebSocket URL 覆盖。                                                       |
| `proxy_url`               | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                          |
| `http_timeout_secs`       | `60`      | REST 请求超时（秒）。                                                           |
| `max_retries`             | `3`       | 幂等 REST 请求（`GET`、`HEAD`、`OPTIONS`）的最大重试次数。                      |
| `retry_delay_initial_ms`  | `1,000`   | 重试初始延迟（毫秒）。                                                          |
| `retry_delay_max_ms`      | `10,000`  | 重试最大延迟（毫秒，指数退避）。                                                |
| `heartbeat_interval_secs` | `30`      | WebSocket 连接心跳间隔（秒）。                                                  |
| `recv_window_ms`          | `5,000`   | 保留字段；AX 使用 bearer token，适配器不发送窗口。                              |
| `cancel_on_disconnect`    | `False`   | 断开时撤销本 WebSocket 会话的挂单。                                             |
| `transport_backend`       | `Sockudo` | WebSocket 传输后端。                                                            |

`transport_backend=None` 时，编译后的 Rust 默认值在启用 `transport-sockudo` Cargo feature 时选 Sockudo，否则选 Tungstenite。

`AxDataClientConfig` 与 `AxDataClientFactory` 搭配，`AxExecutionClientConfig` 与 `AxExecutionClientFactory` 搭配。数据与执行客户端完整的 `LiveNode.builder(...)` 配置见 Python 示例。

### API 凭据 {#api-credentials}

向 AX Exchange 客户端提供凭据有两种方式：把 `api_key` 和 `api_secret` 传入配置对象，或设置以下环境变量：

- `AX_API_KEY`
- `AX_API_SECRET`

:::tip
建议用环境变量管理凭据。
:::

启动交易节点时，凭据是否有效、有无交易权限会立即得到确认。

## 实现说明 {#implementation-notes}

- **只支持整数张合约**：AX 使用整数合约数量。适配器把每手规模增量和批量大小建模为 1 张，同时强制执行每个金融工具各自的 `minimum_order_size`。小数数量在本地产生 `OrderDenied`。
- **到期期货的激活时间**：AX 发布到期时间但不发布激活时间。适配器对未知的激活时间使用零值，并在金融工具元数据中保留这一限制。
- **限流**：适配器施加保守的 10 请求/秒限流，收到限流响应时自动指数退避。
- **市价单**：AX 不支持原生市价单。适配器用预览端点确定穿透价，然后提交一个激进 IOC 限价单。预览与提交之间盘口可能移动，因此模拟市价单可能只部分成交。
- **止损限价订单**：sandbox 测试未能确认条件语义，适配器拒绝场所原生的止损限价提交。策略需要止损限价订单时使用本地订单模拟。
- **订单修改**：AX 经 `POST /replace-order` 支持原子替换。执行客户端把 `modify_order` 映射到该端点，并记录其返回的新场所订单 ID。修改携带触发价时（AX 没有对应字段）适配器在本地拒绝；订单还没有场所订单 ID 时同样拒绝。
- **资金费率轮询**：数据客户端按 `funding_rate_poll_interval_mins` 对每个订阅金融工具轮询 `GET /funding-rates`，请求七天回看以在周末和假期也能取到费率。仅当最新费率与上次发出的不同时才发出。
- **断开即撤单**：在执行客户端配置中设置 `cancel_on_disconnect=True`，订单 WebSocket 断开时让交易所撤销全部挂单。
- **账户费率**：金融工具不携带挂单/吃单费率。认证客户端从 `GET /whoami` 解析账户费率，查询失败则连接失败。执行客户端把费率按 AX 账户缓存（与金融工具无关），每次连接时刷新；自动 WebSocket 重连沿用缓存的费率。
- **成交佣金**：WebSocket 的实时成交事件不含费用数据。适配器用成交数量、成交价绝对值、合约乘数和账户的挂单/吃单费率，为跟踪的成交事件和未跟踪的成交报告估算佣金。账户归属依次取成交的账户 ID、订单的账户 ID，两者都没有时用 `/whoami` 的第一个账户。计算保持十进制运算，只在最后一步把费用舍入进精度为 2 的 USD `Money`。

  金融工具或完整账户费率表未缓存、或佣金无法表示的成交，会被记录并跳过。被跟踪订单的元数据仍可用于对账，恢复依赖配置的对账检查或显式订单查询。跳过的成交不会触发立即的 REST 请求。

  对账不会替换已应用的佣金，因此流式估算即便与场所 `/fills` 上报的佣金不同也会保留。`/fills` 端点只为未从流中应用的成交提供佣金，适配器用 `Money::from_decimal` 转成 USD，`0.012188` 这类分以下费用会存为 `0.01`。无法表示的 REST 佣金会使成交报告请求与全量状态失败；启动期间该错误会阻止节点启动。
- **成交对账窗口**：`/fills` 端点要求有界时间范围且跨度上限七天。对账请求最近七天的成交，更早的成交不参与对账。
- **成交的订单归属**：AX 对大宗交易和最终结算成交可能省略 `order_id`。适配器对这些被分类的记录用 `trade_id` 推导确定性的对账订单 ID。对有有效 `order_id` 的普通成交，分类字段是可选的。适配器拒绝既无订单 ID 也无显式特殊成交分类的行，也拒绝自相矛盾的分类。
- **未成交的 IOC/FOK**：AX 把未成交的即时订单报告为过期，适配器映射为 `OrderCanceled` 以匹配 NautilusTrader 语义。
- **一档报价**：示例测试器会在 top-of-book 一档之外挂 post-only 限价单，这些报价仍可能成交。残余订单用
  `cargo run --bin ax-flatten -p nautilus-architect-ax` 清掉（`AX_IS_SANDBOX` 默认为 true）。
  该程序先撤销账户上全部挂单，再平掉所有持仓。

## 参与贡献 {#contributing}

:::info
需要更多功能或想为 AX Exchange 适配器做贡献，见我们的
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
