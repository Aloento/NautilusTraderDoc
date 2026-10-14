# Lighter

[Lighter](https://lighter.xyz) 是面向现货与永续合约的 decentralized central-limit-order-book
交易所（去中心化中央限价订单簿），采用以太坊零知识 rollup 结算，撮合与排序在链下完成。
适配器（adapter）同时支持 Lighter 及其 Robinhood Chain 部署。

`nautilus-lighter` crate 提供 Rust 数据与执行客户端、类型化的 REST 与 WebSocket 模型，以及一个
内置的 L2 签名器，使用 ECgFp5 上的 Schnorr 签名。本页介绍部署配置、能力与运行限制。

L2 签名基准测试与官方 Go SDK 的对比见
[`crates/adapters/lighter/benches/BENCHMARKS.md`](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/lighter/benches/BENCHMARKS.md)。
绝对耗时因机器而异，只有同一台机器上测得的差值才有意义。

## 概览 {#overview}

- `LighterRawHttpClient`：面向公共与账户端点的低层 REST 客户端。
- `LighterHttpClient`：领域 REST 客户端，把金融工具、成交、K 线、资金费与簿解析为 Nautilus
  模型类型，并返回类型化的场所订单与账户负载。
- `LighterWebSocketClient`：可重连的 WebSocket 客户端，负责公共行情与私有账户流。
- `LighterDataClient`：Nautilus 数据客户端，负责金融工具、成交、报价与 L2 market-by-price
  （MBP）订单簿。
- `LighterExecutionClient`：Nautilus 执行客户端，负责账户流、订单提交、修改、撤销与对账报告。
- `LighterDataClientFactory` 与 `LighterExecutionClientFactory`：live-node 工厂接线。

Python 扩展暴露配置、部署与环境选择、工厂，以及集成方吊销。live 节点通过 Rust trait 使用数据
与执行客户端。

## 示例 {#examples}

运行 tester 之前，先编辑其模块级常量，包括 `LIGHTER_DEPLOYMENT` 与 `LIGHTER_ENVIRONMENT`。
Rust 与 Python tester 启动后立即连接，这些选择器不读取环境变量。

:::warning
两个执行 tester 默认都开启下单：Rust 设置 `DRY_RUN = false` 并选择 Lighter Mainnet；Python
设置 `DRY_RUN = False` 并选择 Lighter Testnet。在任一主网部署上，已注资的账户会下真实订单。
运行 tester 前先检查金融工具、数量、部署与环境，或开启 `DRY_RUN` 以只连接不下单。
:::

Python 示例在
[`examples/live/lighter/`](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/lighter/)。

在仓库根目录运行：

```bash
uv run --project python --no-sync python examples/live/lighter/data_tester.py
uv run --project python --no-sync python examples/live/lighter/exec_tester.py
```

Rust 示例在 `crates/adapters/lighter/examples/`：

```bash
cargo run --example lighter-data-tester --package nautilus-lighter --features examples
cargo run --example lighter-exec-tester --package nautilus-lighter --features examples
```

### 紧急账户清理 {#emergency-account-cleanup}

`cargo run --bin lighter-flatten -p nautilus-lighter` 提交一次账户级的立即撤销，读取一份持仓
快照，并为快照中的持仓提交 reduce-only 的 immediate-or-cancel（IOC）平仓单。

:::warning
运行该命令前先停掉该账户的其他写入方。清理作用于整个账户而非单个策略，先看清当前账户与
持仓。
:::

该命令不确认、也不重试请求。成功退出只表示撤销与发现的平仓单已提交且没有已知错误，不代表
账户已平。事后检查账户状态，有残留就重跑。

每次运行最多提交 15 笔平仓：16 个交易的 nonce 窗口中，撤销占用一个槽位。快照不完整、请求
失败或提交失败都会返回错误。平仓流程 15 分钟超时。

把 `LIGHTER_DEPLOYMENT` 设为 `lighter` 或 `robinhood`，`LIGHTER_ENVIRONMENT` 设为 `mainnet`
或 `testnet`。省略选择器时默认 Lighter Mainnet，并选择对应的凭据命名空间。

## 产品支持 {#product-support}

能力矩阵描述的是适配器的支持情况。*Not supported by Lighter* 表示场所 API 的限制；
*Not currently implemented* 表示适配器尚未实现。

| 产品类型     | 数据馈送 | 交易      | 备注                                                      |
| ------------ | -------- | --------- | --------------------------------------------------------- |
| 现货         | ✓        | ✓         | 现货市场；新上市市场使用从 4095 起的 64 位 id。             |
| 永续合约     | ✓        | ✓         | 线性永续；新上市市场使用从 4095 起的 64 位 id。             |
| 到期合约     | -        | -         | *Lighter 不支持*。                                         |
| 期权         | -        | -         | *Lighter 不支持*。                                         |

## 限制 {#limitations}

- 原生的 OTO、OCO 与 OTOCO 组合要求[或有订单](#contingent-orders)一节描述的形态。Nautilus 的
  OUO 关系不受原生组合支持。TWAP 未实现。Lighter 没有移动止损订单类型，也没有冰山显示数量字段。
- 非或有订单列表、批量修改与显式批量撤销，会把支持的子单自动拆分为每批最多 15 个交易的
  WebSocket 批次。原生或有列表使用一个组合交易。
- `CancelAllOrders` 在该客户端账户上跨策略撤销缓存的挂单，保留各订单所属策略，并按金融工具与
  可选的 `order_side` 过滤。它按每批最多 15 笔逐单撤销。适配器的原生 cancel-all 模式是账户级
  的。Lighter 的
  [新版签名器](https://apidocs.lighter.xyz/docs/wasm-signer#signcancelallorders)增加了市场过滤，
  但没有方向过滤。
- 现货交易支持市价单与限价单。条件止损与止盈订单仅限永续市场。
- `query_account` 与持仓报告重放最近缓存的私有 WebSocket 状态。
- 无范围的订单对账被限定在已配置或已观察到的活跃市场内，避免在标准 REST 配额下向全场所扇出。

## 符号体系 {#symbology}

Lighter 使用 64 位 `market_index`。既有市场保留其按区间划分的 ID。
[Lighter Mainnet 2026 年 9 月升级](https://t.me/lighter_api_updates/174)与
[Robinhood 随后的升级](https://t.me/lighter_api_updates/184)之后，新的现货与永续市场取 `4095`
及以上的第一个空闲索引。

产品类型永远取自 `market_type`，绝不从索引推断。适配器从 `GET /api/v1/orderBookDetails` 加载
映射，并把场所符号转换为 Nautilus `InstrumentId`。

| 部署侧产品        | Nautilus 符号格式                       | 示例                               | 备注                     |
| ----------------- | --------------------------------------- | ---------------------------------- | ------------------------ |
| Lighter 永续      | `{BASE}-PERP.LIGHTER`                   | `BTC-PERP.LIGHTER`                 | 场所原始符号 `BTC`。      |
| Lighter 现货      | `{BASE}/{QUOTE}-SPOT.LIGHTER`           | `ETH/USDC-SPOT.LIGHTER`            | 原始符号 `ETH/USDC`。     |
| Robinhood 永续    | `{BASE}-PERP.LIGHTER_ROBINHOOD`         | `SNDK-PERP.LIGHTER_ROBINHOOD`      | 场所原始符号 `SNDK`。     |
| Robinhood 现货    | `{BASE}/{QUOTE}-SPOT.LIGHTER_ROBINHOOD` | `SNDK/USDG-SPOT.LIGHTER_ROBINHOOD` | 原始符号 `SNDK/USDG`。    |

后缀用于区分离现货与永续挂牌。出站请求会去掉后缀并使用缓存的 `market_index`。现货符号保留
场所的交易对。

## 部署与环境 {#deployments-and-environments}

| 部署       | 环境      | REST URL                                | WebSocket URL                              | L2 签名链 ID        | 结算    | 默认场所              |
| ---------- | --------- | --------------------------------------- | ------------------------------------------ | ------------------- | ------- | --------------------- |
| Lighter    | Mainnet   | `https://mainnet.zklighter.elliot.ai`   | `wss://mainnet.zklighter.elliot.ai/stream` | 304                 | USDC    | `LIGHTER`             |
| Lighter    | Testnet   | `https://testnet.zklighter.elliot.ai`   | `wss://testnet.zklighter.elliot.ai/stream` | 300                 | USDC    | `LIGHTER`             |
| Robinhood  | Mainnet   | `https://api.rh.lighter.xyz`            | `wss://api.rh.lighter.xyz/stream`          | 466324              | USDG    | `LIGHTER_ROBINHOOD`   |
| Robinhood  | Testnet   | `https://api.rh-testnet.lighter.xyz`    | `wss://api.rh-testnet.lighter.xyz/stream`  | 300                 | USDG    | `LIGHTER_ROBINHOOD`   |

这些链 ID 是 Lighter L2 签名域取值，不是 EVM 网络的链 ID。

选择 `LighterDeployment::Lighter` 或 `Robinhood`，以及 `LighterEnvironment::Mainnet` 或
`Testnet`。两者一起决定默认 URL、链 ID、结算货币、场所与归因策略。两个测试网都用链 ID 300，
因此适配器从不按数字 ID 推断部署行为。

为私有网关或本地测试 fixture 覆盖 URL 只改变传输端点，部署签名、结算货币与归因保持不变。

数据客户端会往其 WebSocket URL 追加 `readonly=true`，执行客户端保持 URL 不变。

### 自定义场所标识 {#custom-venue-identity}

要在 Lighter 协议端点之间使用不同的 Nautilus 标识，在两个客户端配置上设置 `venue`。它限定
金融工具、缓存条目、消息主题、socket 状态与执行路由，而不改变部署的协议行为。

为兼容起见，工厂名保持 `LIGHTER`。`ClientId` 是客户端注册名。Robinhood 要按 `ClientId` 路由
时，注册为 `LIGHTER_ROBINHOOD`。两种语言的示例都由 `LIGHTER_DEPLOYMENT` 推导它。支持自定义
客户端名。

Nautilus 按 issuer 路由账户命令，因此 `account_id` 的 issuer 必须与解析出的场所一致：
`LIGHTER_RH_ALT` 需要形如 `LIGHTER_RH_ALT-001` 的 ID。自定义场所不会启用自定义链 ID 或归因。

## 账户与 API key 设置 {#account-and-api-key-setup}

公共行情不需要账户。私有流与执行需要来自同一部署与环境的账户索引、API key 索引与私钥。
每行各有独立的命名空间：

| 部署       | 环境      | 账户与 API key 页面                                                     | 账户 issuer           | 凭据前缀                        |
| ---------- | --------- | ------------------------------------------------------------------------ | --------------------- | ------------------------------- |
| Lighter    | Mainnet   | [Lighter Mainnet](https://app.lighter.xyz/apikeys)                       | `LIGHTER`             | `LIGHTER_*`                     |
| Lighter    | Testnet   | [Lighter Testnet](https://testnet.app.lighter.xyz/apikeys)               | `LIGHTER`             | `LIGHTER_TESTNET_*`             |
| Robinhood  | Mainnet   | [Robinhood Mainnet](https://robinhoodchain.lighter.xyz/apikeys)          | `LIGHTER_ROBINHOOD`   | `LIGHTER_ROBINHOOD_*`           |
| Robinhood  | Testnet   | [Robinhood Testnet](https://rhctestnet.lighter.xyz/apikeys)              | `LIGHTER_ROBINHOOD`   | `LIGHTER_ROBINHOOD_TESTNET_*`   |

不要跨行混用账户或 key，即使两个测试网的签名链 ID 同为 300。

1. 打开目标部署的账户页面并登录。生成 API key 之前，先创建或选择交易账户，包括目标子账户。
1. 按 Lighter 的
   [账户索引查询](https://apidocs.lighter.xyz/docs/get-started#find-your-account-index)，
   对着该部署的 REST URL 操作。非 Robinhood Mainnet 的部署，把示例 URL 换成其
   [部署表取值](#deployments-and-environments)：

   ```bash
   LIGHTER_SETUP_API_URL="https://api.rh.lighter.xyz"
   LIGHTER_SETUP_L1_ADDRESS="0xYOUR_ETHEREUM_ADDRESS"

   curl -sS --get \
     "${LIGHTER_SETUP_API_URL}/api/v1/accountsByL1Address" \
     --data-urlencode "l1_address=${LIGHTER_SETUP_L1_ADDRESS}"
   ```

   从 `sub_accounts` 中所需条目读取 `index`。一个钱包可以拥有主账户和若干子账户，每个子账户
   有独立的账户索引与 API key。
1. 在所选账户的 API key 页面选择 **Generate API Key**。使用 `[4, 254]` 中未占用的索引。
   Lighter 的 [API key 文档](https://apidocs.lighter.xyz/docs/api-keys)把 `[0, 3]` 保留给其
   界面，`255` 是 API 查询哨兵。Robinhood 还保留 `157`。见
   [Robinhood API keys](https://apidocs.lighter.xyz/docs/lighter-rh#api-keys)。
1. 关掉弹窗前先保存生成的私钥，Lighter 不会再显示它。
1. 直接配置 `account_index`、`api_key_index` 与 `private_key`，或使用
   [API 凭据](#api-credentials)一表中列出的环境变量。Nautilus 的 `account_id` 与场所账户索引
   是两回事：使用上表中的 issuer，例如 `LIGHTER-001` 或 `LIGHTER_ROBINHOOD-001`。
1. 确认目标部署能识别所选的账户与 key 索引：

   ```bash
   LIGHTER_SETUP_ACCOUNT_INDEX="123456"
   LIGHTER_SETUP_API_KEY_INDEX="4"

   curl -sS --get \
     "${LIGHTER_SETUP_API_URL}/api/v1/apikeys" \
     --data-urlencode "account_index=${LIGHTER_SETUP_ACCOUNT_INDEX}" \
     --data-urlencode "api_key_index=${LIGHTER_SETUP_API_KEY_INDEX}"
   ```

   成功会返回 `"code": 200` 与所选的 key。这次公共查询只确认索引，既不暴露也不校验私钥。

:::warning
Lighter API key 授权交易、私有账户访问以及部分 withdrawal 操作。把私钥存放在 secret manager
或受保护的环境配置中，不要提交到仓库，也不要出现在日志里。
:::

## 集成方归因 {#integrator-attribution}

通过 [Lighter 合作伙伴计划](https://apidocs.lighter.xyz/docs/partner-integration)，执行客户端
会把 Lighter Mainnet 上的创建与修改交易在 `L2TxAttributes` 中归因到 NautilusTrader 的集成方
账户。这适用于所有层级（包括 Standard）以及列表中的每一笔订单。maker 与 taker 的集成方费用
为零。

在 Lighter Mainnet 上，启动时会对非 maker-only 的 key 用 L2 签名提交 `ApproveIntegrator`，
全部最大费用设为零，不需要 L1 签名。

Lighter Testnet 与两个 Robinhood 环境把 `L2TxAttributes` 留空，并在启动时省略
`ApproveIntegrator`。

选择 Robinhood Mainnet 即让账户加入 `NAUTILUS` 推荐码。启动时，客户端用配置的 L2 API key
把该推荐码应用到账户的公共 L1 地址。失败只记 warning，不阻塞交易。Robinhood Testnet 不做
推荐归因。

归因跟随类型化的部署与环境，与自定义场所名无关。

maker-only 的 Lighter Mainnet key 无法提交 `ApproveIntegrator`，会跳过自动批准。这类 key 要
通过适配器交易，同一账户上必须先由一个非 maker-only 的 key 批准该集成方：批准作用于账户
范围。

### 吊销批准 {#revoking-the-approval}

离开该适配器时要吊销 Lighter Mainnet 的批准，用 `approval_expiry = 0` 与零最大费用发送
`ApproveIntegrator`。下次用非 maker-only key 启动执行客户端时，会在所有 Lighter Mainnet 层级
重新续期零费用批准。

```bash
export LIGHTER_API_KEY_INDEX=5
export LIGHTER_API_SECRET=REPLACE_ME
export LIGHTER_ACCOUNT_INDEX=123456
cargo run -p nautilus-lighter --bin lighter-integrator-revoke           # Lighter Mainnet
```

脚本源码：
[`crates/adapters/lighter/bin/integrator_revoke.rs`](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/lighter/bin/integrator_revoke.rs)。

```python
# Python (PyO3 binding) - reads the same env vars as the Rust bin
from nautilus_trader.adapters.lighter import revoke_lighter_integrator

await revoke_lighter_integrator()  # Lighter Mainnet (default)
```

Rust 命令会显示该动作并等待回车后才签名或发送。摘要不对时用 `Ctrl+C` 中止。Python 绑定不
提示，调用前先检查当前生效的环境变量。

## 数据订阅 {#data-subscriptions}

| 数据类型           | 订阅         | 快照     | 历史    | Nautilus 类型         | 备注                                                  |
| ------------------ | ------------ | -------- | ------- | --------------------- | ----------------------------------------------------- |
| 金融工具元数据     | 缓存重放     | ✓        | -       | `InstrumentAny`       | 从 `orderBookDetails` 加载。                           |
| 成交 tick          | ✓            | -        | ✓       | `TradeTick`           | WebSocket 成交；公共 `recentTrades` REST 历史。        |
| 报价 tick          | ✓            | -        | -       | `QuoteTick`           | 实时 BBO；历史 *Lighter 不支持*。                      |
| 订单簿增量         | ✓            | ✓        | -       | `OrderBookDeltas`     | `L2_MBP`；历史 *Lighter 不支持*。                      |
| 订单簿深度         | ✓            | -        | -       | `OrderBookDepth`      | 实时前 10 档；REST *尚未实现*。                        |
| 订单簿快照         | -            | ✓        | -       | `OrderBook`           | REST 快照；每侧最多聚合 250 个订单。                   |
| 标记价             | ✓            | -        | -       | `MarkPriceUpdate`     | 永续市场统计流。                                       |
| 指数价             | ✓            | -        | -       | `IndexPriceUpdate`    | 市场与现货统计流。                                     |
| 资金费率           | ✓            | -        | ✓       | `FundingRateUpdate`   | 当前估计值与 REST 每小时历史。                          |
| K 线               | ✓            | -        | ✓       | `Bar`                 | WebSocket candle 流；REST 历史用于回填。               |
| 金融工具状态       | REST         | ✓        | -       | `InstrumentStatus`    | `active` / `inactive` 快照。                           |

### 订单簿数据 {#order-book-data}

簿增量与深度订阅在订阅前会拒绝 `BookType::L2_MBP` 之外的类型。

只有 `subscribed/order_book` 会初始化 WebSocket 簿。在它到达之前，适配器丢弃
`update/order_book` 帧且不发出簿数据，因为增量消息不含未变化的档位。

深度与增量共用 WebSocket 的 `order_book` 流。每个被接受的快照或增量更新都会刷新一份前 10 档
深度视图。

### K 线 {#bars}

K 线订阅使用 `candle/{market_id}/{resolution}`。Lighter 大约每 500 毫秒批量推送未收盘 K 线的
更新。适配器只在 candle 起始时间戳前进时，为每个已收盘周期发出一个 `Bar`。重连与退订会
清空进行中的缓存。

REST 与 WebSocket 支持 `1m`、`5m`、`15m`、`30m`、`1h`、`4h`、`12h` 与 `1d`。适配器对 REST
请求接受 `1w`，但 Lighter Mainnet 会以 `20001 invalid param` 拒绝该分辨率，
[REST 模式](https://apidocs.lighter.xyz/reference/candles)也未列出它。周 K 线订阅会在本地返回
错误。要得到周数据，请聚合更短的 K 线。

REST 历史会跳过 OHLC 缺失、为 null 或非正的缺口行：它们无法构成有效的 Nautilus K 线。之后
有效的行仍会加载。

### 金融工具状态与成交 {#instrument-status-and-trades}

金融工具状态订阅会重放缓存的 `orderBookDetails` 状态，或拉取一份 REST 快照。Lighter 没有
WebSocket 的状态变更流。

成交订阅使用公共 WebSocket 流。历史使用公共 `/api/v1/recentTrades`，无需凭据。适配器把最多
100 笔成交过滤到请求的时间区间内，不分页。

实时与历史资金费率的语义见[资金费率](#funding-rates)。

### 不支持的数据请求 {#unsupported-data-requests}

`request_quotes` 未实现：适配器用到的 REST 端点没有带时间戳的报价快照或历史，无法安全映射到
`QuoteTick`。要获取实时最优买卖价，请订阅 WebSocket 的 `ticker` 流。

`request_book_depth` 未实现：REST 簿端点没有可用于 `OrderBookDepth.ts_event` 的场所事件时间戳。
实时深度请用 `subscribe_book_depth`，REST 的 `OrderBook` 快照用 `request_book_snapshot`。

## 订单簿恢复 {#order-book-recovery}

### 序列校验 {#sequence-validation}

适配器把每条增量更新的 `begin_nonce` 与上一份簿的 `nonce` 比对。不匹配时抑制簿输出，并启动
一次退订/订阅替换。

场所的 `offset` 不是连续性计数器：它可能跳号，重连后也可能因服务器不同而变化。参见
[Lighter 订单簿契约](https://apidocs.lighter.xyz/docs/websocket-reference#order-book)。

### 快照要求 {#snapshot-requirements}

订阅写操作完成后，初始订阅与替换订阅最多等待 `book_snapshot_timeout_secs`（默认 10 秒）以
取得类型化的 `subscribed/order_book` 快照。设为 `0` 可禁用快照期限。

快照缺失会启动或重试恢复，即使已收到控制确认或 `Already Subscribed` 响应。控制确认只释放
订阅槽位，不算完成簿恢复。

只有在匹配的快照替换掉缓存档位之后，簿输出才恢复。空快照同样会清空簿。

### 重试限制与重连 {#retry-limits-and-reconnects}

每个恢复事件在 180 秒内最多做八次替换尝试，采用指数退避与抖动；之后在 [1 分钟, 15 分钟] 区间
内按指数退避继续重试，直到快照被接受。替换用的退订与订阅写操作指向同一连接。

重连会淘汰过期的订阅代次，同时保留恢复事件及其剩余预算。预算耗尽、正处在尝试间隔中等待的
恢复，会在新连接上立即重试。

### 消费者与持续失败 {#consumers-and-persistent-failures}

同一市场的增量与深度共用一个恢复事件：

- 移除一个消费者时，另一个保持不变。
- 移除最后一个消费者会取消待处理的写操作与快照等待。
- 关闭会取消其持有的全部工作。

恢复不会以失败状态结束。被拒绝的替换，或重连后回放的订阅，会按递增的间隔继续重试。迟到的
快照仍能恢复簿。

除限流以外的场所订阅失败，会让正在等待的初始 subscribe 调用失败，即使恢复已经启动。此后
恢复只在还有其他消费者时继续。后续的 subscribe 会重新开始，其他市场各自独立恢复。

共享的恢复机制与适配器职责见
[订单簿恢复的归属](./../developer_guide/adapters.md#order-book-recovery-ownership)。

### 实时恢复验证 {#live-recovery-validation}

用 `lighter-book-stress` 在六个 Lighter 主网永续簿上验证同步与恢复的改动。它不提交订单，会
检查簿流契约（包括每个快照事件内 nonce 递增），并与馈送最优 20 档的独立重建结果比对。

在仓库根目录运行：

```bash
CARGO_BUILD_JOBS=16 bash scripts/strip-adapter-env.bash \
  cargo test -p nautilus-lighter --features examples --test lighter-book-stress -- --timeout 10 --rounds 12
```

`--scenario` 选择运行方式：

- `churn`（默认）：先验证无重连的恢复，再轮换 nonce 缺口、丢弃与延迟快照、被拒的替换、重连，
  以及恢复期间的重启。
- `initial`：在全新会话中每轮丢弃每个簿的首个快照。
- `boundaries`：让重试预算内的每次尝试都被拒，然后检查重试上限、结束上限等待的重连、恢复期间
  的退订，以及重连期间的关闭。

`--timeout` 设置快照超时秒数（`0` 禁用期限）；`--rounds` 设置轮数（默认 12）。

该工具需要主网 WebSocket 流以及公共 `orderBooks` 与 `orderBookDetails` API。共享参数与输出
格式见[压力测试工具](./../developer_guide/spec_data_testing.md#stress-harnesses)。

## 订单能力 {#order-capabilities}

### 订单标识 {#order-identification}

Lighter 使用数字场所订单索引与调用方提供的 `client_order_index`。适配器从 Nautilus
`ClientOrderId` 派生一个 31 位索引，冲突时向后探测。

探测出的值在重启后无法重新推导。转换订单与成交报告之前，对账会通过核心缓存解析每个场所订单
ID，并恢复其真实的 client 索引：缓存中的活动订单回到活动跟踪，终态订单使用有界回放跟踪。

恢复绝不单凭整数推断 client order ID。对账必须包含该订单，且核心缓存必须保留其场所订单 ID
映射；否则报告用唯一的场所订单 ID 作为其外部 client order ID。

查询对活动与终态历史都使用数字场所订单 ID。在该 ID 已知之前，派生的 client 索引只能查询活动
订单。活动匹配出现重复时按歧义失败。

### 订单类型 {#order-types}

| 订单类型                 | 永续      | 现货      | 备注                                                    |
| ------------------------ | --------- | --------- | ------------------------------------------------------- |
| `MARKET`                 | ✓         | ✓         | 上限由缓存的对侧报价加滑点推导。                          |
| `LIMIT`                  | ✓         | ✓         | 需要限价。                                                |
| `STOP_MARKET`            | ✓         | -         | 仅永续；上限由 `trigger_price` 加滑点推导。               |
| `STOP_LIMIT`             | ✓         | -         | 仅永续；映射到 Lighter 止损限价单。                       |
| `MARKET_IF_TOUCHED`      | ✓         | -         | 仅永续；上限由 `trigger_price` 加滑点推导。               |
| `LIMIT_IF_TOUCHED`       | ✓         | -         | 仅永续；映射到 Lighter 止盈限价单。                       |
| `MARKET_TO_LIMIT`        | -         | -         | *Lighter 不支持*。                                        |
| `TRAILING_STOP_MARKET`   | -         | -         | *Lighter 不支持*。                                        |
| `TRAILING_STOP_LIMIT`    | -         | -         | *Lighter 不支持*。                                        |
| `TWAP`                   | -         | -         | *尚未实现*；没有 Nautilus 映射。                          |

条件订单必须有 `trigger_price`。适配器会拒绝缺失触发价、在金融工具价格精度下截断为 `0` 个
tick 的触发价，以及全部现货条件订单。

Lighter 要求市价类订单给出可接受的最差 `price`。上限从以下起点推导：

- `MARKET`：买单用缓存 ask，卖单用 bid。没有缓存的 `QuoteTick` 时订单被拒。
- `STOP_MARKET` 与 `MARKET_IF_TOUCHED`：`trigger_price`。

随后适配器应用 `market_order_slippage_bps`（默认 50 bps），再按金融工具价格精度取整：买单
向上、卖单向下。用 `SubmitOrder.params["market_order_slippage_bps"]` 覆盖滑点。

### 或有订单 {#contingent-orders}

| 功能                   | 永续      | 现货      | 备注                                                       |
| ---------------------- | --------- | --------- | ---------------------------------------------------------- |
| 止损市价               | ✓         | -         | `STOP_MARKET` 映射到 Lighter `STOP_LOSS`。                  |
| 止损限价               | ✓         | -         | `STOP_LIMIT` 映射到 Lighter `STOP_LOSS_LIMIT`。             |
| 止盈市价               | ✓         | -         | `MARKET_IF_TOUCHED` 映射到 Lighter `TAKE_PROFIT`。          |
| 止盈限价               | ✓         | -         | `LIMIT_IF_TOUCHED` 映射到 `TAKE_PROFIT_LIMIT`。             |
| 触发价                 | ✓         | -         | 每个支持的条件订单都必须有。                                 |
| 触发源选择             | -         | -         | *Lighter 不支持*；仅标记价触发。                             |
| 组合订单列表           | ✓         | -         | 原生 OTO、OCO 与 OTOCO 组合。                                |
| OCO / OTO 订单         | ✓         | -         | 同市场组合，子单为止损/止盈。                                |
| 括号订单               | ✓         | -         | OTO 父单加 OCO 关联的条件退出腿。                            |
| `CreateGroupedOrders`  | ✓         | -         | 组合内每条腿共用一个签名交易与 nonce。                       |

用 `submit_order_list` 提交原生组合。适配器把 Lighter 的
[`CreateGroupedOrders`](https://apidocs.lighter.xyz/docs/trading#stop-loss-and-take-profit)
关系映射为 Nautilus 的父子与兄弟关系：

| Lighter 组合 | 场所代码 | Nautilus 父单 | Nautilus 子单或兄弟                                              |
| ------------ | -------- | ------------- | ---------------------------------------------------------------- |
| OTO          | 1        | `OTO`         | 一个引用父单的子单，其兄弟间没有或有关系。                     |
| OCO          | 2        | 无            | 两个互相关联的 `OCO` 兄弟。                                        |
| OTOCO        | 3        | `OTO`         | 两个引用父单的子单，彼此作为 `OCO` 互相关联。                      |

Nautilus 没有单独的 OTOCO 类型。由于 Lighter 的 OTO 与 OCO 数字代码和 Nautilus 的代码不同，
适配器显式映射这些关系。

#### 组合要求 {#group-requirements}

- 所有腿使用同一个永续金融工具、策略与订单列表 ID，client order ID 各不相同。
- OTO 父单使用 `MARKET` 或 `LIMIT`。其子单方向与父单相反，使用 `reduce_only`，且请求数量与
  父单相同。
- OCO 兄弟使用 `reduce_only`，共享同一方向与数量。这一对包含一个止损（`STOP_MARKET` 或
  `STOP_LIMIT`）与一个止盈（`MARKET_IF_TOUCHED` 或 `LIMIT_IF_TOUCHED`）。

场所有效期按腿决定：

- 子单共享一个非零有效期。
- 市价与 IOC 限价父单使用零有效期。
- 其他限价父单与子单共用同一有效期。

默认有效期使用同一个时间戳。任何腿派发之前，显式的 GTD 有效期必须与组合中其他所有非零有效期
一致。

wire 形态遵循 [Go SDK 的校验](https://github.com/elliottech/lighter-go/blob/9d38261d1a4cc5c7211b383ba07a4d6e41604708/types/txtypes/create_grouped_orders.go)。
适配器额外要求 OTO 子单是 reduce-only 且请求数量相符，以保持 Nautilus 的退出语义。

要做原生括号单，请选择 `OCO` 退出腿与条件止盈。适配器会拒绝默认的
`OrderFactory.bracket`——它使用 `OUO` 退出腿与普通 `LIMIT` 止盈。适配器不会用撤销代替数量
更新，也不会把挂着的限价单转换成触发的止盈。

#### 子单激活与规模 {#child-activation-and-sizing}

Lighter 根据父单的执行来激活 OTO/OTOCO 子单并确定其规模。在此之前，其 wire 基础数量为零。
由 Nautilus 提交、处于挂起状态的子单的报告保留请求数量，场所侧数量变化会产生 `OrderUpdated`。

场所数量为零的挂起子单不能被修改。适配器既不提供了结放量控制，也不提供独立的按比例缩放。

#### 撤销行为 {#cancellation-behavior}

Lighter 的 OCO 在止损/止盈订单**触发**时就撤销兄弟订单，即使尚未成交；而 Nautilus 的 OCO 在
成交或撤销时才请求对端撤销。适配器保留场所的触发即撤销行为，不重建兄弟订单。事件顺序可能
延迟撤销的送达。见
[原生子单成交与持仓对账](#native-child-fills-and-position-reconciliation)。

对活动的 Nautilus OCO 腿调用 `cancel_order`，会同时请求撤销其活动对端，使用两个独立交易：
Lighter 的单订单撤销会让对端留在场上，且两者各自可能成功或失败。

要等目标腿的 `OrderAccepted`。其对端需要已知的场所绑定或保留的组合提交索引。
`batch_cancel_orders` 同样会带上活动的 OCO 对端，每个选中的订单只提交一次。

:::warning
原生组合请保持 `StrategyConfig.manage_contingent_orders = false`（默认值）。开启本地或有管理
可能在场所之外独立改变子单规模，或在场所撤销其 OCO 对端时撤掉一个已触发但未成交的退出单。
:::

#### 触发事件与关系恢复 {#trigger-events-and-relationship-recovery}

条件订单使用
[标记价触发](https://docs.lighter.xyz/trading/order-types-and-matching#trigger-conditions)。
条件限价单发出 `OrderTriggered`；市价类条件单没有中间的 `TRIGGERED` 状态直接成交，遵循
Nautilus 语义。

只要有本地订单上下文或缓存的场所绑定，即使 Lighter 在激活后清掉了父单链接，报告仍保留
Nautilus 的 client、parent 与 linked ID。全新启动的客户端在处理第一条私有流的订单或成交之前，
会先恢复缓存的所有权关系。

已触发的条件限价单保留其 Nautilus 类型与最后已知的触发价。无法恢复触发价的外部订单会报告为
活动中的 `LIMIT` 订单。

触发之后，改价与改量会发送零触发价；再次改变触发价不受支持。独立的事务批次不会获得或有关系。

### 订单选项 {#order-options}

| 选项             | 永续      | 现货      | 备注                                                                      |
| ---------------- | --------- | --------- | ------------------------------------------------------------------------- |
| `post_only`      | ✓         | ✓         | 映射到 Lighter 的 post-only 有效期。                                       |
| `reduce_only`    | ✓         | -         | 透传给 `CreateOrder`；只用于减少已有持仓。                                 |
| `quote_quantity` | -         | -         | *Lighter 不支持*；请提交基础数量。                                         |
| `display_qty`    | -         | -         | *Lighter 不支持*；没有冰山显示数量字段。                                   |

### 适配器订单参数 {#adapter-order-params}

| 参数                                       | 永续      | 现货      | 备注                                                |
| ------------------------------------------ | --------- | --------- | --------------------------------------------------- |
| `market_order_slippage_bps`                | ✓         | ✓         | 覆盖配置默认值，用于市价类上限。                      |
| 经 `SubmitOrder.params` 的 `post_only`     | -         | -         | *尚未实现*；请使用订单标志。                          |
| 经 `SubmitOrder.params` 的 `reduce_only`   | -         | -         | *尚未实现*；请使用订单标志。                          |

### 有效期 {#time-in-force}

| 有效期         | 永续      | 现货      | 备注                                                                          |
| -------------- | --------- | --------- | ----------------------------------------------------------------------------- |
| `GTC`          | ✓         | ✓         | 限价类用 `GoodTillTime`；市价类用 `IOC`。                                      |
| `DAY`          | ✓         | ✓         | 限价类与条件订单使用正的订单有效期。                                            |
| `GTD`          | ✓         | ✓         | 原生有效期为 5 分钟到 30 天；见下文的管理式 GTD 策略。                          |
| `IOC`          | ✓         | ✓         | 普通 `MARKET`/`LIMIT` 用有效期 `0`；条件限价用触发有效期。                      |
| `FOK`          | -         | -         | *Lighter 不支持*。                                                              |
| `AT_THE_OPEN`  | -         | -         | *Lighter 不支持*。                                                              |
| `AT_THE_CLOSE` | -         | -         | *Lighter 不支持*。                                                              |

适配器把 `MARKET`、`STOP_MARKET` 与 `MARKET_IF_TOUCHED` 作为 `ImmediateOrCancel` 发送：
Lighter 拒绝市价类的 `GoodTillTime`。有效期与 Nautilus `IOC` 的支持情况因订单类型而异：

- 普通 `MARKET` 使用 `OrderExpiry = 0`。
- 条件市价单在触发前保持正的有效期。适配器拒绝对其使用 Nautilus `IOC`，因为 Lighter 把
  IOC 保留给触发后的执行。
- 条件限价单接受 Nautilus `IOC`：触发单以正有效期挂着，随后子单以 `ImmediateOrCancel` 执行。

没有显式 GTD 有效期时，限价类的 `GTC`、`DAY` 与 `GTD` 使用当前时间加 28 天。条件单的 `GTC`、
`DAY` 与限价类的 `IOC` 共用这一默认值：在这些路径上场所会以 `21711 invalid expiry` 拒绝 `-1`。

#### GTD 策略 {#gtd-policy}

在默认的 `use_gtd = true` 下，策略的 `expire_time` 成为场所的 `GoodTillTime` 有效期。适配器
接受 [5 分钟 + 1 秒, 30 天] 的生命周期，额外的一秒用于容纳签名与传输。

需要更短的生命周期时，把 `use_gtd = false` 与提交策略上的 `manage_gtd_expiry = true` 同时
设置。本地 GTD 管理器会在策略到期时请求撤销。不设置它，订单可能一直挂到
场所的 28 天回退有效期。

wire 层的有效期仍是 `GoodTillTime`：Lighter 没有 `GoodTillCancel`，所以 `use_gtd = false` 不能
像在 Binance 那样切换它。

本地管理跳过原生的 5 分钟下限，但会拒绝超过 28 天的策略到期时刻——那种情况下场所会先过期。
更长的生命周期请用原生 GTD。场所的撤单延迟仍会推迟订单移除。

### 执行指令 {#execution-instructions}

| 指令          | 永续      | 现货      | 备注                                                      |
| ------------- | --------- | --------- | --------------------------------------------------------- |
| `post_only`   | ✓         | ✓         | 覆盖有效期并发送 Lighter 的 `PostOnly`。                   |
| `reduce_only` | ✓         | -         | 针对已有衍生品持仓的减仓标志。                              |

`post_only` 用于限价类订单。适配器不会合成 maker 专属的市价单。

Lighter 主网测试确认 `reduce_only=true` 能平掉永续持仓。非法的 reduce-only 开仓可能被直接丢弃、
没有场所订单报告，并以 `INFLIGHT_TIMEOUT` 对账，且不附带场所拒绝原因。

### 高级订单特性 {#advanced-order-features}

| 特性           | 永续      | 现货      | 备注                                                       |
| -------------- | --------- | --------- | ---------------------------------------------------------- |
| 订单修改       | ✓         | ✓         | 修改活动订单的数量、价格与触发价。                          |
| 括号订单       | ✓         | -         | 原生 OTO 父单加 OCO 关联的止损/止盈退出腿。                 |
| 冰山订单       | -         | -         | *Lighter 不支持*。                                          |
| 移动止损       | -         | -         | *Lighter 不支持*。                                          |
| 挂钩订单       | -         | -         | *Lighter 不支持*；没有原生挂钩 API 类型。                   |
| TWAP 订单      | -         | -         | *尚未实现*；没有 Nautilus 映射。                            |
| 追踪限价订单   | -         | -         | *尚未实现*。                                                |
| 原子篮子       | -         | -         | *尚未实现*。                                                |
| 杠杆更新       | ✓         | -         | 仅永续；提交签名的 `UpdateLeverage` 交易。                  |
| 原生全部撤销   | -         | -         | 执行客户端中*尚未实现*。                                    |
| 死人开关（dead man's switch） | -        | -         | *尚未实现*；场所有计划撤销。                                |

Lighter 的
[`CancelAllOrders`](https://apidocs.lighter.xyz/docs/wasm-signer#signcancelallorders)
支持立即与计划撤销。执行客户端使用逐单撤销；`lighter-flatten` 使用立即的原生账户级撤销。
适配器不调度、也不续期撤销期限。

场所的
[追踪限价订单与原子篮子](https://docs.lighter.xyz/trading/order-types-and-matching#advanced-orders)
不对外暴露。普通事务批次各自独立执行子单。

### 订单操作 {#order-operations}

| 操作           | 永续      | 现货      | 备注                                                        |
| -------------- | --------- | --------- | ----------------------------------------------------------- |
| 提交订单       | ✓         | ✓         | 通过 WebSocket 发送签名的 `L2CreateOrder` 交易。             |
| 提交订单列表   | ✓         | ✓         | 独立批次；原生或有组合仅限永续。                             |
| 修改订单       | ✓         | ✓         | 发送签名的 `ModifyOrder`；报告可能重述接受。                 |
| 批量修改订单   | ✓         | ✓         | 每批最多 15 个签名修改交易的 WebSocket 批次。                |
| 撤销订单       | ✓         | ✓         | 发送签名的 `L2CancelOrder` 交易。                            |
| 撤销全部订单   | ✓         | ✓         | 按金融工具与可选方向撤销缓存订单。                            |
| 设置杠杆       | ✓         | -         | 仅永续；提交签名的 `UpdateLeverage` 交易。                   |
| 批量撤销订单   | ✓         | ✓         | 每批最多 15 个签名撤销交易的 WebSocket 批次。                |
| 查询订单       | ✓         | ✓         | 需要凭据与 REST 查找。                                        |
| 查询账户       | ✓         | ✓         | 重放最近的私有 WebSocket 账户状态。                           |
| Mass status    | ✓         | ✓         | 限定在 WS 与 REST 报告所显示的账户活跃市场。                  |

#### 订单列表与批量操作 {#order-lists-and-batch-operations}

非或有的 `SubmitOrderList`、`BatchModifyOrders` 与 `BatchCancelOrders` 使用 WebSocket 的
`jsonapi/sendtxbatch`，保留每个子单的签名交易与订单事件归属。它们既不提供原子执行，也不提供
或有关系。

本地校验会拒绝无效的提交子单，或拒绝无效的修改子单，同时让受支持的兄弟订单继续。每批最多
15 个交易：31 个受支持的子单通常拆成 15、15、1 三批。并发的 nonce 分配或恢复可能产生更小的
批次。

每个批次使用独立的限流令牌与确认。拒绝只影响其自身的子单。

签名下一批之前，适配器最多等待 10 秒以收取当前批的确认。超时后继续派发，并保留未确认的
条目供对账。

`CancelAllOrders` 走同一批处理路径，保留任何方向过滤。场所的
[活动与挂起订单上限](#active-and-pending-order-limits)仍然适用：将一条命令拆分并不会增加账户
在某个市场上可持有的订单数。

或有列表必须恰好包含一个受支持的原生组合，由两或三条永续订单组成，共用一个
`CreateGroupedOrders` 交易与 nonce。任何一条腿无效都会让整组被拒。

Lighter 的[交易指南](https://apidocs.lighter.xyz/docs/trading#batch)给出的上限是 50，而其
[WebSocket 参考](https://apidocs.lighter.xyz/docs/websocket-reference#send-batch-tx)写的是 15。
适配器采用较低的那个文档值。

#### Nonce 分配与交易准入 {#nonce-allocation-and-transaction-admission}

每个批次使用同一个账户与 API key，在 Lighter 的
[nonce 契约](https://apidocs.lighter.xyz/docs/core-concepts#nonce)下取连续 nonce。
`skip_nonce=0` 时，适配器必须保持 nonce 顺序。

本地窗口允许每个 key 有 16 个未确认的分配，不是乱序的场所交易。未签名的子单会等待容量或
nonce 恢复，不会被丢弃。关闭会停止派发并丢弃队列中剩余的工作。

批量响应按请求 ID 与签名交易哈希关联。

确认只表示交易被准入，不表示订单被接受、修改或撤销。失败取决于拒绝发生的时点：

- 准入前的拒绝会让整批失败且不消耗 nonce。无效 nonce 的响应还会刷新 nonce 基线。
- 准入后，单个交易可能失败而其他成功。应用阶段的失败会消耗 nonce；应用前被排序者拒绝可能
  使该 nonce 未被消耗，从而让该 key 上后续的 nonce 失效。

参见
[nonce 消耗](https://apidocs.lighter.xyz/docs/core-concepts#when-a-rejected-transaction-consumes-its-nonce)。

投递结果不明确时，适配器保留待处理状态供对账，不重发该批。

#### 修改确认 {#modification-confirmation}

每个订单最多只能有一个未决的修改。要等它的 `OrderUpdated` 或 `OrderModifyRejected` 之后再改
一次。第二次请求会直接收到 `OrderModifyRejected`，且不会裁决第一次。

待处理的撤销会拒绝修改。待处理的修改期间，撤销仍可用，但其结果要等修改裁决之后。

确认需要一次交易查找，并与当前场所订单形态匹配。受影响的 WebSocket 订单帧与成交会一直等待，
直到适配器发出 `OrderUpdated` 或 `OrderModifyRejected`。可能应用该修改或成交的 HTTP 报告，
要等缓存应用该事件之后才处理。

| 请求                       | 修改待处理期间的行为                                     |
| -------------------------- | -------------------------------------------------------- |
| 单订单状态查找             | 可能把未变化的活动报告作为 `PendingUpdate` 返回。          |
| 批量订单报告与 mass status | 暂扣该订单，并把结果标记为不完整。                        |
| `query_order`              | 不发出报告。                                              |

这可能带来几秒的报告延迟。持仓对账会暂扣受影响的金融工具，直到其执行事件进入缓存。

#### 原生子单成交与持仓对账 {#native-child-fills-and-position-reconciliation}

对原生 OTO/OTOCO 子单，真实成交要等到终态场所订单与完整的真实成交覆盖确立有效数量之后才发出。
适配器先发布该数量，再发布成交，随后对账终态状态。

挂起的子单在其修改裁决之后才发布触发事件。

未决的子单成交或修改也会暂扣同一策略与金融工具后续的成交与终态事件。成交按场所事件时间顺序
放行，到达顺序用于打破并列。可能应用这些改动的 HTTP 报告要等缓存追上。

在子单关闭且真实成交覆盖完整之前，缓存的成交与持仓核算可能滞后。

这段延迟期间：

- 包含受影响金融工具的范围，其持仓查询会失败。
- mass status 会省略受影响持仓的报告与合成的平仓报告，并保持不完整。
- 场所持仓快照在私有流上仍然可用。

#### 结果恢复 {#outcome-recovery}

订单更新与交易查找用于裁决创建与撤销子单。恢复在待处理动作仍是当前动作期间，最多做三次查找，
间隔两秒，并校验交易哈希、类型、账户、API key 与原始提交 nonce。

已准入的修改（单批或批量）确定失败时，发出一个 `OrderModifyRejected`，并清除其匹配的待处理
动作，不回滚已消耗的 nonce。

延迟的结果不能清除较新的修改，也不能拒绝一个已被恢复确认的修改。

:::warning
若有界查找无法确认某次修改，它可能在本次会话剩余时间内保持未决，从而暂扣后续订单事件与
成交，并拒绝再次修改。适配器既不假设成功，也不重发。要再次管理该订单，请先重启并对账
场所状态。
:::

修改探测在重连之间保留其原始提交身份。撤销探测在连接变化时停止。

撤销恢复也包括 `PendingCancel` 之外的订单，例如 `CancelAllOrders` 的目标。缓存中的订单只有在
分派时处于 `PendingCancel` 才会收到 `OrderCancelRejected`，否则只记录失败日志。

#### 杠杆更新与签名校验 {#leverage-updates-and-signing-validation}

调用 `LighterExecutionClient::update_leverage(instrument_id, initial_margin_fraction, margin_mode)`。
保证金比例使用场所 tick（1e-4 比例）：`500` 表示 5% 初始保证金（20 倍杠杆），`1000` 表示 10%
（10 倍）。

`UpdateLeverage`、`CancelAllOrders`、带集成方属性的修改订单、条件创建订单与
`CreateGroupedOrders` 都对照官方 `lighter-python` SDK 1.1.4 版本自带的签名器做了字节级钉定。

### 订单查询与对账 {#order-querying-and-reconciliation}

| 功能             | 永续      | 现货      | 备注                                                        |
| ---------------- | --------- | --------- | ----------------------------------------------------------- |
| 查询挂单         | ✓         | ✓         | REST `accountActiveOrders`，按市场限定。                     |
| 查询订单历史     | ✓         | ✓         | REST `accountInactiveOrders`，游标分页。                     |
| 订单状态更新     | ✓         | ✓         | 私有 WebSocket 订单流加状态报告。                            |
| 成交历史         | ✓         | ✓         | REST `trades`；账户历史需要凭据。                             |
| 成交报告         | ✓         | ✓         | REST 与私有 WebSocket 成交负载。                              |
| 持仓报告         | ✓         | -         | 仅永续；重放缓存的持仓流。                                    |
| 账户状态         | ✓         | ✓         | 重放缓存的合并账户状态快照。                                  |
| Mass status      | ✓         | ✓         | 合并订单、成交与缓存持仓。                                    |

已认证的失活订单与成交分页会拒绝重复的游标，并在 1,000 页后停止。成交对账在多次调用间可重复，
抑制实时 WebSocket 流已发出的成交。

历史报告只把映射后的 client 索引绑定到匹配的场所订单 ID，避免被复用的索引把不相关的生命周期
合并到一起。

#### 报告完整性 {#report-completeness}

每次有界的 mass status 对失活订单与成交使用同一个截止时刻。完整性的要求是：所有必需的订单、
成交与持仓来源都成功，且每条历史成交都能映射到其订单。

被暂扣的事件、未决的修改，或尚未应用到缓存的更新，都会让被暂扣的订单、成交与持仓来源变成
不完整。

仅历史失败不会否决可用的活动订单或显式的持仓报告。范围内没有持仓报告的有界历史成交，遵循
引擎的
[仅订单投影](./../concepts/execution/reconciliation.md#order-only-fill-projection)规则。

[`trades` 参考](https://apidocs.lighter.xyz/reference/trades)不保证历史深度，因此回看窗口可能
超出可用的成交。分页从最新的成交往回走。只有找到早于回看起点的成交才能证明覆盖完整：

- 有早于起点的成交：报告集保持完整。
- 先耗尽游标：适配器记录未覆盖的区间，并把报告集标记为不完整。
- 没有保留任何成交：不可能有内容被截断，报告集保持完整。

游标耗尽无法区分"被截断"和"确实没有更早的成交"：新账户可能在什么都没缺的情况下报告不完整。
请选一个场所能够供出数据的回看窗口。

更早的成交可以通过场所的
[历史数据导出](https://apidocs.lighter.xyz/docs/historical-data)获取，最多 12 个月的账户成交。
适配器不读取 `export` 端点。

#### 启动时的持仓检查 {#startup-position-checks}

若 `account_all_positions` 比其对应成交的处理早几毫秒到达，在策略启动时开仓可能出现瞬时的
`cached=0, venue=N` warning。应用该成交后差异自行消解，不会生成对账订单。

## 账户与持仓管理 {#account-and-position-management}

已认证的执行客户端订阅这些私有流：

- `account_all_orders`：订单状态报告。
- `account_all_trades`：成交报告。
- `account_all_positions`：初始持仓快照与实时更新。
- `account_all_assets`：按资产的余额快照（现货余额加永续抵押物）。
- `user_stats`：永续账户的保证金汇总（抵押物与可用余额）。

适配器只在 `account_all_assets` 与 `user_stats` 的首帧都到达之后，才发出二者的合并状态。

构造允许凭据缺失；`connect()` 要求已解析的 `private_key`、`account_index` 与
`api_key_index`。私有账户流与 nonce 刷新是必需的。

### 持仓快照与更新 {#position-snapshots-and-updates}

永续在每个市场使用一个净额持仓，现货余额使用账户资产状态。权威的
`subscribed/account_all_positions` 快照会：

- 把未出现的市场和 `position` 为零的行拍平为平仓。`positions` 映射为空会拍平整个缓存。
- 对未映射或无法解析的行保留缓存持仓，避免出现假的平仓报告。

有界对账会跟踪快照的市场覆盖范围，重连使其失效。被触碰过但缺失的市场，只有在当前快照覆盖下
才产生显式的平仓报告。未映射或畸形的行会让 mass status 保持不完整，而不是证明已平仓。

增量的 `update/account_all_positions` 帧替换非零持仓、把显式的零行拍平，并保留未出现的持仓。
空更新保留全部持仓。

| 功能                  | 永续      | 现货      | 备注                                                        |
| --------------------- | --------- | --------- | ----------------------------------------------------------- |
| 账户余额              | ✓         | ✓         | 合并资产 + `user_stats`，查询时从缓存重放。                  |
| 持仓状态              | ✓         | -         | 仅永续；初始快照加实时更新。                                 |
| 净额持仓              | ✓         | -         | 每个永续市场一个 Nautilus 持仓。                             |
| 全仓保证金            | ✓         | -         | 通过 `LighterPositionMarginMode::Cross` 传递。               |
| 逐仓保证金            | ✓         | -         | 通过 `LighterPositionMarginMode::Isolated` 传递。            |
| 杠杆更新              | ✓         | -         | 签名的 `UpdateLeverage` 交易。                               |
| 现货保证金 / 借币     | -         | -         | *尚未实现*；没有借币流程。                                   |
| 抵押物模式变更        | -         | -         | *尚未实现*；请用场所工具配置。                               |
| 充值 / 提现           | -         | -         | *尚未实现*；请使用场所工具或 API。                           |

Lighter 的
[多资产保证金](https://docs.lighter.xyz/trading/multi-asset-margin)支持非 USDC 的永续抵押物。
其文档描述了现货的用途，但上线时不含现货。适配器既不暴露现货借币，也不提供抵押物模式变更。
现货保证金这一行描述的是适配器的缺口，不是场所的限制。

## 强平与 ADL 处理 {#liquidation-and-adl-handling}

| 事件或字段                | 支持      | 备注                                                          |
| ------------------------- | --------- | ------------------------------------------------------------- |
| 强平成交                  | ✓         | 账户成交行可解析为成交，无专门事件。                            |
| 减仓成交                  | ✓         | 账户成交行可解析为成交，无专门事件。                            |
| 强平价报告                | -         | *尚未实现*；持仓报告省略该字段。                                |
| ADL 事件流                | -         | *尚未实现*；没有通知订阅。                                      |

Lighter 的持仓负载包含 `liquidation_price`。其认证的
[`notification` 流](https://apidocs.lighter.xyz/docs/websocket-reference#notification)会发布
强平与减仓通知。

适配器在原始负载中解析强平价，但不在 Nautilus 持仓报告中暴露它，也不订阅通知。强平与减仓
成交走普通的成交报告路径。

## 资金费率 {#funding-rates}

永续的 `market_stats` 发出 `MarkPriceUpdate`、`IndexPriceUpdate` 与 `FundingRateUpdate`。资金
费率字段各不相同：

- `current_funding_rate`：实时更新中使用的下期估计值。
- `funding_rate` 与 `funding_timestamp`：最近一次已完成的支付。

市场统计不提供未来的结算时刻，因此实时更新把 `interval` 与 `next_funding_ns` 留空。现货的
`spot_market_stats` 发出 `IndexPriceUpdate`。

历史资金费率请求使用公共 `/api/v1/fundings`，不使用账户专属的 `positionFunding`：

- `1h` 分辨率设 `interval=60`。
- `direction=long` 保持正值，`short` 取负。
- 分页覆盖请求的区间，直到适配器的
  [页上限](#historical-request-limits)，并受显式 `limit` 约束。

## 账户层级 {#account-tiers}

账户层级决定延迟、限流与交易费用。客户端会记录来自 `GET /api/v1/account` 的层级，包括无法
识别的 `account_type` 取值。

所有 Lighter Mainnet 层级都使用
[零费用集成方归因](#integrator-attribution)。配额不会自动上升，本地覆盖也不会带来更高的
场所限制。

[Lighter Mainnet](https://apidocs.lighter.xyz/docs/account-types)：

| 层级     | 延迟（maker / taker） | REST 加权限额     | `sendTx` 限额            | 费用（maker / taker）           | 备注                                    |
| -------- | --------------------- | ----------------- | ------------------------ | ------------------------------- | --------------------------------------- |
| Standard | 0 ms / 300 ms         | 60 请求/分钟      | 60 请求/分钟             | 0 / 0                           | 零费用的默认层级。                        |
| Premium  | 0 ms / 140 ms         | 24,000 请求/分钟  | [4,000, 57,600] 请求/分钟 | [0.28, 0.40] / [1.96, 2.80] bps | 延迟最低；随质押的 LIT 提升。             |
| Plus     | 0 ms / 300 ms         | 24,000 请求/分钟  | 4,000 请求/分钟          | 0.5 / 0.5 bps                   | 限额更高，延迟与标准一致。                |
| Builder  | -                     | 240,000 请求/分钟 | -                        | -                               | REST 吞吐最高。                           |

Premium 的限额与费用随质押的 LIT 提升。Robinhood 使用不同的费用与限额，其 Premium 层级按
14 天交易量划分。见
[Robinhood 账户层级](https://apidocs.lighter.xyz/docs/lighter-rh#account-tiers)。调高本地配额前，
先确认你流量所对应的部署限制。见[限流](#rate-limiting)。

## 限流 {#rate-limiting}

Lighter 同时限制 IP 与 L1 地址。数据与执行客户端各有独立的 REST 限流器，默认按 Standard 配额。
请把两者合计的流量规划在场所限制之内。

更高的[层级](#account-tiers)需要显式的本地配额：

- `rest_quota_per_min`：两个客户端上的读请求每分钟；未设置默认 60。
- `sendtx_quota_per_min`：仅执行客户端上的交易请求每分钟；未设置时独立于
  `rest_quota_per_min` 默认 60，位于独立的桶。

这些选项只改变本地限速。公共数据仍不需认证，更高的本地配额不会让它享受账户级的场所限制。

### 请求桶与端点权重 {#request-buckets-and-endpoint-weights}

场所对每个 L1 地址在 HTTP 与 WebSocket 之间共享一个交易桶。一次 WebSocket `sendTxBatch` 计为
一次，最多携带 15 个适配器交易。

Standard 账户的读与交易共享 60 请求/分钟。Plus 与 Premium 使用分开的场所桶。适配器在所有
层级都分开本地的读取与交易限流器，因此 Standard 用户必须把合计流量（包括 nonce 与对账的读取）
一起规划。

REST 限流器每次调用消耗一个令牌，忽略场所权重。请按你的端点组合设置 `rest_quota_per_min`。
Lighter Mainnet 的 Premium 限额是 24,000 加权请求/分钟，在不计入其他请求时，下面两种速率任一
都可承受：

- 40 次 `/api/v1/recentTrades`/分钟（权重 600）。
- 120 次 `/api/v1/trades`/分钟（权重 200）。

请确认你所在部署的权重。

### 交易类型限制 {#transaction-type-limits}

Lighter 的默认交易类型限制是 40 请求/分钟，带有按类型的例外，与层级的
`sendTx`/`sendTxBatch` 限制相互独立。

Lighter 主网测试中，每次报价漂移都改价的报价策略，在一分钟内约 40 次修改后会撞到
`code=23000`（`Too Many Requests`）。修改还要消耗
[交易量配额](#volume-quota-and-no-fill-quoting)。

交易密集的报价请把 `sendtx_quota_per_min` 设为 40 或更低。这个共享限流器同时也为创建与撤销
限速。批次最多 15 个交易只消耗一个令牌，因此该设置不会限制订单列表或批量修改中的子单数量。
批量子单的交易类型限制请按你的部署确认。

本地配额允许突发，不是严格的滚动分钟上限。配额 30 会允许最初 30 次请求的突发，并按 30/分钟
补充，可能超过场所 60 秒 40 次的限制。请为突发和共享同一 L1 地址的其他客户端留出余量。

要是有界地测试 Standard，每分钟 15 次交易请求与 5 次 REST 调用可以给独立的账户检查留出空间。

无法关联的 WebSocket `23000` 响应只记日志，不会判定某一笔交易失败。它可能来自非交易流量，
因此适配器不猜测是哪个订单或批次失败。未决的结果要靠对账解决，不要盲目重发。

### 共享的适配器限流器 {#shared-adapter-limiters}

一个执行限流器在 WebSocket 的 `sendTx` 与 `sendTxBatch`（提交、修改与撤销），以及启动集成方
批准所用的 HTTP `sendTx` 上统一执行 `sendtx_quota_per_min`。原始调用在配置了该值时使用它，
否则回退到原始客户端的 REST 限流器。

WebSocket URL 字符串完全相同的客户端共享一个 200 消息/分钟的限流器，用于非交易的控制帧。
默认数据 URL 的 `readonly=true` 使其拥有与执行分离的限流器。请把合计的控制流量规划在场所的
按 IP 限制之内。

每条连接的订阅闸门允许 35 个未确认请求，这个数目取决于确认延迟而非发送速率。它不执行场所
跨连接的每 IP 50 条消息上限。`sendTx` 与 `sendTxBatch` 既不消耗客户端消息桶，也不消耗场所的
inflight 上限。

下表中的层级限制针对
[Lighter Mainnet](https://apidocs.lighter.xyz/docs/rate-limits)。

| 范围                                   | 场所限制                 | 适配器行为                                           |
| -------------------------------------- | ------------------------ | ------------------------------------------------------ |
| REST，Standard 账户                    | 60 请求/分钟             | 默认；设 `rest_quota_per_min` 覆盖。                    |
| REST，Premium 账户                     | 24,000 加权请求/分钟     | 需要本地覆盖；适用场所归因。                             |
| REST，Plus 账户                        | 24,000 加权请求/分钟     | 需要本地覆盖；适用场所归因。                             |
| REST，Builder 账户                     | 240,000 加权请求/分钟    | 需要本地覆盖；适用场所归因。                             |
| `sendTx` / `sendTxBatch`，standard     | 60 请求/分钟             | 与 REST 读取共享；含 HTTP 与 WebSocket。                |
| `sendTx` / `sendTxBatch`，premium      | [4,000, 57,600] 请求/分钟 | 设 `sendtx_quota_per_min`（随质押 LIT 提升）。          |
| `sendTx` / `sendTxBatch`，plus         | 4,000 请求/分钟          | 设 `sendtx_quota_per_min` 才能用上。                    |
| 默认交易类型限制                       | 40 请求/分钟             | 适用于不在交易量配额内的交易类型。                       |
| `L2UpdateLeverage` 交易限制            | 40 请求/分钟             | 与 `update_leverage` 相关。                             |

### 活动与挂起订单上限 {#active-and-pending-order-limits}

Lighter 的
[层级限制](https://apidocs.lighter.xyz/docs/rate-limits)按账户、以及账户内每个市场分别适用：

| 账户层级   | 每账户活动数 | 每市场活动数 | 每账户挂起数 | 每市场挂起数 |
| ---------- | ------------ | ------------ | ------------ | ------------ |
| Standard   | 250          | 30           | 50           | 10           |
| Plus       | 750          | 250          | 500          | 100          |
| Premium    | 1,500        | 1,000        | 1,000        | 100          |

活动订单指挂在簿上的订单。场所侧的挂起订单包括未触发的止盈、止损与 TWAP，与 Nautilus 的
`PendingCancel` 或未确认请求不同。适配器不会预先统计它们，请为已有订单留出余量。本地配额
不会提高场所上限。

### 端点权重与传输限制 {#endpoint-weights-and-transport-limits}

来自
[Lighter Mainnet 限流](https://apidocs.lighter.xyz/docs/rate-limits)的常见 REST 权重：

| 端点组                                                            | 权重   | 适配器行为                                      |
| ----------------------------------------------------------------- | ------ | ------------------------------------------------- |
| `sendTx`、`sendTxBatch`、`nextNonce`                              | 6      | 交易调用用交易限流器；`nextNonce` 用 REST。        |
| `accountInactiveOrders`、`accountActiveOrders`、`accountOrders`   | 100    | 适配器每次 HTTP 调用计一个 REST 令牌。           |
| `apikeys`                                                         | 150    | 适配器每次 HTTP 调用计一个 REST 令牌。           |
| `trades`                                                          | 200    | 适配器每次 HTTP 调用计一个 REST 令牌。           |
| `recentTrades`                                                    | 600    | 适配器每次 HTTP 调用计一个 REST 令牌。           |
| 没有显式场所权重的端点                                            | 300    | 适配器每次 HTTP 调用计一个 REST 令牌。           |

其他具名端点各有不同权重，规划调用量前先查官方表。Robinhood 的权重可能不同，见
[Robinhood 限流](https://apidocs.lighter.xyz/docs/lighter-rh#rate-limits)。

| 端点或传输                             | 限制                | 备注                                                             |
| -------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `/api/v1/trades`                       | 100 行              | 适配器按该上限分页做对账。                                      |
| `/api/v1/accountInactiveOrders`        | 100 行              | 适配器按该上限跟随 `next_cursor`。                              |
| `/api/v1/orderBookOrders`              | 每侧 250 个订单     | 适配器把这些订单聚合为 L2 价位。                                |
| `/api/v1/candles`                      | 500 行              | 适配器按该场所最大值封顶 REST K 线分页。                        |
| `/api/v1/fundings`                     | 750 行              | 场所上限；适配器每页请求 100 行。                               |
| WebSocket 连接                         | 255 / IP            | 场所限制。                                                        |
| 每连接 WebSocket 订阅数                | 500                 | 场所限制。                                                        |
| 每 IP WebSocket 订阅数                 | 5,000               | 场所限制。                                                        |
| 每连接的唯一账户数                     | 500                 | 场所限制。                                                        |
| 每 IP 的唯一账户数                     | 5,000               | 场所限制。                                                        |
| 每分钟 WebSocket 连接数                | 255                 | 场所限制。                                                        |
| 每分钟 WebSocket 客户端消息            | 200                 | 为非交易帧限速；心跳 ping 不受其约束。                            |
| WebSocket inflight 消息                | 50 / IP             | 订阅闸门允许每条连接 35 个未决请求。                              |
| WebSocket `sendTxBatch` 批量大小       | 15 个交易           | 适配器的单请求上限；更大的命令会拆批。                          |
| WebSocket keepalive                    | 2 分钟              | 适配器每 30 秒发一次心跳。                                      |
| WebSocket 出站命令队列                 | 不封顶              | 写入前限速；无队列深度上限。                                      |

### 历史请求限制 {#historical-request-limits}

K 线与资金费率历史最多 500 个 REST 页：最多 250,000 根 K 线，或 49,500 个每小时资金费率区间。
在最后一页完成算成功；带显式 `start` 且满足其显式 `limit` 的请求也算成功。

未被覆盖的区间返回 `LighterHttpError::HistoryIncomplete`，不返回部分历史、也不重试。数据客户端
记录该错误且不发出响应。缩窄区间即可继续。

## 交易量配额与不成交报价 {#volume-quota-and-no-fill-quoting}

与传输限制不同，[交易量配额](https://apidocs.lighter.xyz/docs/volume-quota-program)只适用于
Plus 与 Premium 账户，在同一 L1 地址下的子账户之间共享：

- `L2CreateOrder`、`L2CancelAllOrders`、`L2ModifyOrder` 与 `L2CreateGroupedOrders` 会消耗它；
  每个符合条件的批量交易分别消耗。单笔订单撤销不消耗。
- 已完成的交易量与免费额度会为其补充。

适配器不检查剩余配额。当前规则与数值见所链接的场所文档。

反复刷新却不成交的报价可能耗尽这一配额，即使 WebSocket 与 `sendTx` 限流器工作正常。实时测试
请优先用更慢的单边报价、更宽的刷新阈值、测试网，或有界的、能通过成交赚回配额的策略。

## 连接管理 {#connection-management}

### 心跳与重连 {#heartbeats-and-reconnects}

WebSocket 客户端每 30 秒发送一次心跳，并按 [250 毫秒, 30 秒] 的指数退避重连。90 秒内没有入站
帧就重连，即使场所还留着那个已停滞的 socket。Pong 会在没有行情的情况下刷新这个窗口。

### 私有认证 {#private-authentication}

私有认证令牌的有效期最长 8 小时。适配器签发 7 小时的令牌，每 6 小时轮换并重新订阅。透明的
重连会签发新令牌，并在被跟踪的订阅开始回放之后重新订阅账户流。

### Nonce 恢复 {#nonce-recovery}

执行端重连时通过 `GET /api/v1/nextNonce` 刷新 nonce 基线。在刷新或其后台重试为新连接装好基线
之前，单笔提交、修改与撤销命令无法签名。批量命令（包括刷新期间收到的）会等待就绪。

同一会话内：

- 场所确认会推进本地 nonce 窗口。
- 确定性拒绝或移交前的失败可能回滚其最新 nonce。
- 过期的状态会触发一次 `GET /api/v1/nextNonce` 重同步。

可能已到达场所的结果会保留其待处理 nonce 与订单身份，交给 WebSocket 或对账恢复。

### 账户流就绪 {#account-stream-readiness}

`LighterExecutionClient::connect()` 会清空旧的持仓与账户缓存，然后最多等待 30 秒，让全部五条
[私有流](#account-and-position-management)就绪。

只有 `subscribed/account_all_positions` 能满足持仓就绪，实时更新不算；REST 账户负载永远不会作为
回退。

透明的重连与认证轮换不会重新进入 `connect()`。它们保留持仓，直到下一次
`subscribed/account_all_positions` 套用快照替换规则。实时更新以合并方式应用，不逐出未出现的
市场。

## API 凭据 {#api-credentials}

签名需要三项凭据：

- 账户索引：Lighter 账户的数字标识。
- API key 索引：API key 槽位的数字。使用 `[4, 254]` 中未被保留的索引。Robinhood 还保留 `157`。
  不要用 `[0, 3]` 或 `255`；`255` 是 `apikeys` 查询的哨兵值，不是签名 key。
- API 私钥：40 字节的十六进制私钥，可带或不带 `0x` 前缀。

配置值优先。字段缺失，或私钥为空、只有空白字符时，回退到由 `deployment` 与 `environment`
选定的环境变量。

| 部署       | 环境      | API key 索引                                | API 私钥                                 | 账户索引                                    |
| ---------- | --------- | ------------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| Lighter    | Mainnet   | `LIGHTER_API_KEY_INDEX`                     | `LIGHTER_API_SECRET`                     | `LIGHTER_ACCOUNT_INDEX`                     |
| Lighter    | Testnet   | `LIGHTER_TESTNET_API_KEY_INDEX`             | `LIGHTER_TESTNET_API_SECRET`             | `LIGHTER_TESTNET_ACCOUNT_INDEX`             |
| Robinhood  | Mainnet   | `LIGHTER_ROBINHOOD_API_KEY_INDEX`           | `LIGHTER_ROBINHOOD_API_SECRET`           | `LIGHTER_ROBINHOOD_ACCOUNT_INDEX`           |
| Robinhood  | Testnet   | `LIGHTER_ROBINHOOD_TESTNET_API_KEY_INDEX`   | `LIGHTER_ROBINHOOD_TESTNET_API_SECRET`   | `LIGHTER_ROBINHOOD_TESTNET_ACCOUNT_INDEX`   |

这四个命名空间让同一进程可以为多个部署目标运行客户端，而不共享凭据。

执行端会拒绝不完整的凭据。全部数据订阅，以及金融工具、簿、成交、K 线与资金费率的 REST 请求
都使用公共端点，不需要凭据。

## 配置 {#configuration}

### 数据客户端配置项 {#data-client-configuration-options}

| 配置项                             | 默认值    | 说明                                                          |
| ---------------------------------- | --------- | ------------------------------------------------------------- |
| `environment`                      | `Mainnet` | `LighterEnvironment::Mainnet` 或 `Testnet`。                  |
| `deployment`                       | `Lighter` | `LighterDeployment::Lighter` 或 `Robinhood`。                 |
| `venue`                            | `None`    | 可选的 Nautilus 场所覆盖；默认由 `deployment` 决定。           |
| `account_index`                    | `None`    | 可选的工厂字段；公共数据调用不使用它。                         |
| `api_key_index`                    | `None`    | 可选的工厂字段；公共数据调用不使用它。                         |
| `private_key`                      | `None`    | 可选的工厂字段；公共数据调用不使用它。                         |
| `base_url_http`                    | `None`    | 可选的 REST URL 覆盖。                                         |
| `base_url_ws`                      | `None`    | 可选的 WebSocket URL 覆盖。                                    |
| `proxy_url`                        | `None`    | HTTP 与 WebSocket 的可选代理 URL。                             |
| `http_timeout_secs`                | `60`      | HTTP 请求超时（秒）。                                          |
| `ws_timeout_secs`                  | `30`      | WebSocket 连接与重连超时。                                     |
| `update_instruments_interval_mins` | `60`      | 金融工具元数据刷新间隔（分钟）。                               |
| `book_snapshot_timeout_secs`       | `10`      | 初始、重连与恢复的快照等待。                                   |
| `rest_quota_per_min`               | `None`    | REST 配额覆盖；未设置保持 60 请求/分钟。                       |
| `transport_backend`                | 默认      | WebSocket 传输后端。                                           |

### 执行客户端配置项 {#execution-client-configuration-options}

| 配置项                      | 默认值          | 说明                                                          |
| --------------------------- | --------------- | ------------------------------------------------------------- |
| `environment`               | `Mainnet`       | `LighterEnvironment::Mainnet` 或 `Testnet`。                  |
| `deployment`                | `Lighter`       | `LighterDeployment::Lighter` 或 `Robinhood`。                 |
| `venue`                     | `None`          | 可选的 Nautilus 场所覆盖；默认由 `deployment` 决定。           |
| `account_id`                | `LIGHTER-001`   | Nautilus 账户 ID；issuer 必须与解析出的场所一致。              |
| `account_index`             | `None`          | Lighter 账户索引。                                             |
| `api_key_index`             | `None`          | Lighter API key 槽位。                                         |
| `private_key`               | `None`          | 用于认证与 L2 交易签名的十六进制私钥。                         |
| `base_url_http`             | `None`          | 可选的 REST URL 覆盖。                                         |
| `base_url_ws`               | `None`          | 可选的 WebSocket URL 覆盖。                                    |
| `proxy_url`                 | `None`          | HTTP 与 WebSocket 的可选代理 URL。                             |
| `http_timeout_secs`         | `60`            | HTTP 请求超时（秒）。                                          |
| `ws_timeout_secs`           | `30`            | WebSocket 连接与重连超时。                                     |
| `market_order_slippage_bps` | `50`            | `MARKET` / `STOP_MARKET` / `MIT` 的滑点上限（bps）。           |
| `rest_quota_per_min`        | `None`          | REST 配额覆盖；未设置保持 60 请求/分钟。                       |
| `sendtx_quota_per_min`      | `None`          | 交易配额覆盖；未设置保持 60 请求/分钟。                        |
| `transport_backend`         | 默认            | WebSocket 传输后端。                                           |
| `use_gtd`                   | `true`          | 使用场所原生 GTD；见 [GTD 策略](#gtd-policy)。                 |

### 配置示例 {#configuration-example}

```rust
use nautilus_lighter::{
    common::enums::{LighterDeployment, LighterEnvironment},
    config::{LighterDataClientConfig, LighterExecutionClientConfig},
};
use nautilus_model::identifiers::AccountId;

let data_config = LighterDataClientConfig::builder()
    .environment(LighterEnvironment::Testnet)
    .deployment(LighterDeployment::Lighter)
    .build();

let exec_config = LighterExecutionClientConfig::builder()
    .environment(LighterEnvironment::Testnet)
    .deployment(LighterDeployment::Lighter)
    .account_id(AccountId::from("LIGHTER-001"))
    .build();

let robinhood_data_config = LighterDataClientConfig::builder()
    .environment(LighterEnvironment::Mainnet)
    .deployment(LighterDeployment::Robinhood)
    .build();

let robinhood_exec_config = LighterExecutionClientConfig::builder()
    .environment(LighterEnvironment::Mainnet)
    .deployment(LighterDeployment::Robinhood)
    .account_id(AccountId::from("LIGHTER_ROBINHOOD-001"))
    .build();
```

这些执行配置使用其部署与环境对应的
[凭据环境变量](#api-credentials)；显式的凭据字段会覆盖它们。

设置 `LiveExecutionEngineConfig.reconciliation_instrument_ids` 可限定对账范围，设置
`reconciliation_lookback_mins` 可为失活订单与成交的重放设定边界。

## 官方文档 {#official-documentation}

- [Get started](https://apidocs.lighter.xyz/docs/get-started)
- [交易与签名](https://apidocs.lighter.xyz/docs/trading)
- [核心概念与 nonce](https://apidocs.lighter.xyz/docs/core-concepts)
- [环境与端点](https://apidocs.lighter.xyz/docs/environments)
- [Robinhood Chain 上的 Lighter](https://apidocs.lighter.xyz/docs/lighter-rh)
- [API keys](https://apidocs.lighter.xyz/docs/api-keys)
- [账户类型](https://apidocs.lighter.xyz/docs/account-types)
- [限流](https://apidocs.lighter.xyz/docs/rate-limits)
- [交易量配额](https://apidocs.lighter.xyz/docs/volume-quota-program)
- [历史数据与导出](https://apidocs.lighter.xyz/docs/historical-data)
- [数据结构、常量与错误](https://apidocs.lighter.xyz/docs/data-structures-constants-and-errors)
- [REST OpenAPI](https://raw.githubusercontent.com/elliottech/lighter-python/main/openapi.json)
- [WebSocket 参考](https://apidocs.lighter.xyz/docs/websocket-reference)

## 贡献 {#contributing}

:::info
想为 Lighter 适配器做贡献或提出特性需求，见
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
