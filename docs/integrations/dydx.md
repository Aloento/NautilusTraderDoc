# dYdX

dYdX 是最大的去中心化加密货币交易所之一，主打加密货币衍生品。本集成支持基于 dYdX v4 的实时行情接入与订单执行。dYdX v4 运行在自己的 Cosmos SDK 应用链（dYdX Chain）上，采用 CometBFT 共识。订单簿与撮合引擎作为验证者进程的一部分运行在链上。订单通过 gRPC 以 Cosmos 交易提交，每个区块结算一次。Indexer 服务为行情数据和账户状态提供 REST 与 WebSocket API。

## 安装 {#installation}

:::note
无需额外的安装选项。适配器以 Rust 实现，构建时自动编译进核心 `nautilus_trader` 包。
:::

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/dydx/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/dydx/examples/)

## 概览 {#overview}

适配器以 Rust 实现，通过 PyO3 提供 Python 绑定。它直接对接 dYdX 的 Indexer API（REST/WebSocket）获取行情，通过 gRPC 提交 Cosmos SDK 交易，不依赖外部客户端库。

### 产品支持 {#product-support}

| 产品类型     | 数据源 | 交易 | 说明                                                       |
| ------------ | ------ | ---- | ---------------------------------------------------------- |
| 永续期货     | ✓      | ✓    | 所有永续合约均以 USDC 结算。                               |
| 现货         | -      | -    | dYdX 的现货在 Solana 上；本适配器不支持。                  |
| 期权         | -      | -    | *dYdX 不提供*。                                            |

:::note
本适配器只支持永续期货。所有市场以 USD 计价、以 USDC 结算。
:::

## 链架构 {#chain-architecture}

与暴露单一 REST/WebSocket API 的中心化交易所（CEX）不同，dYdX v4 运行在自己的 **Cosmos SDK 应用链**上。这意味着每笔交易都是走共识的 Cosmos 交易，适配器必须管理序列号（sequence）、gas 和基于区块高度的过期。

### 传输层 {#transport-layers}

适配器通过三个相互独立的传输层通信：

```
                         ┌─────────────────────────────────────────────┐
                         │              dYdX v4 Chain                  │
                         │                                             │
 ┌──────────┐  HTTP      │   ┌──────────────────────┐                  │
 │          │───────────►│   │  Indexer (read-only) │                  │
 │          │  WebSocket │   │  - REST API          │                  │
 │ Nautilus │───────────►│   │  - Streaming API     │                  │
 │ Adapter  │            │   └──────────────────────┘                  │
 │          │  gRPC      │   ┌──────────────────────┐                  │
 │          │───────────►│   │  Validator (write)   │                  │
 └──────────┘            │   │  - Cosmos Tx submit  │                  │
                         │   │  - Sequence mgmt     │                  │
                         │   └──────────────────────┘                  │
                         └─────────────────────────────────────────────┘
```

| 层级      | 目标      | 方向   | 用途                                               |
| --------- | --------- | ------ | -------------------------------------------------- |
| HTTP      | Indexer   | 只读   | 工具元数据、历史数据、账户状态。                   |
| WebSocket | Indexer   | 只读   | 实时行情、订单/成交/持仓更新。                     |
| gRPC      | Validator | 写入   | 下单、撤单与批量操作。                             |

### 按区块结算 {#block-based-settlement}

交易在区块提交时结算，短期订单按区块高度而非挂钟时间过期。适配器在滚动 100 个区块的窗口内跟踪 WebSocket 的区块高度与时间戳，据此估算 `seconds_per_block`，再用该估算把基于时间的订单过期换算为区块高度偏移。

样本不足五个区块时，估算回退到每块 **500 毫秒**。主网实测的出块时间更接近一秒，因此回退值会低估短期窗口——结果是边缘订单被路由到长期路径，而不是相反。

## 架构 {#architecture}

dYdX v4 适配器包含多个组件，可组合使用也可单独使用：

- `DydxHttpClient`：Indexer REST API 查询的 HTTP 客户端。
- `DydxWebSocketClient`：供 Rust 调用方使用的 WebSocket 客户端。
- `DydxGrpcClient`：提交 Cosmos SDK 交易的 gRPC 客户端。
- `InstrumentCache`：工具解析与加载，HTTP、WebSocket 和执行客户端共用。
- `DydxDataClient`：行情数据源管理器。
- `DydxExecutionClient`：账户管理与交易执行网关。
- `DydxDataClientFactory`：dYdX v4 数据客户端工厂（交易节点 builder 使用）。
- `DydxExecutionClientFactory`：dYdX v4 执行客户端工厂（交易节点 builder 使用）。

:::note
多数用户按下文配置实时交易节点即可，不需要直接使用这些底层组件。
:::

:::warning[首次账户激活]
dYdX v4 交易账户（子账户 0）要等钱包首次入金或首笔交易之后才会创建。在此之前，gRPC 和 Indexer 的账户查询都返回 not-found，`DydxExecutionClient.connect()` 会在初始化交易序列号时失败。

启动 `LiveNode` 之前，先用同一网络（主网/测试网）上的同一钱包发送任意正数 USDC 或其他支持的抵押品。交易确认（几个区块）后重启节点，客户端即可正常连接。
:::

## 故障排查 {#troubleshooting}

### 连接时 gRPC `NotFound` {#grpc-notfound-on-connect}

**原因**：钱包/子账户从未入金，链上还不存在。

**解决办法**：

1. 向正确网络的子账户 0 存入任意正数 USDC。
2. 等待确认（主网约 30 秒，测试网更久）。
3. 重启 `LiveNode`，连接应当成功。

:::tip
无人值守的部署中，把 `connect()` 包进指数退避循环，让客户端重试直到入金出现。
:::

## 代码体系 {#symbology}

dYdX 对永续期货合约使用特定代码约定。

### 代码格式 {#symbol-format}

格式：`{Base}-USD-PERP`

dYdX 上所有永续合约都是：

- 以 USD 计价
- 以 USDC 结算
- 在 Nautilus 中使用 `.DYDX` 场所后缀

例如：

- `BTC-USD-PERP.DYDX` - 比特币永续期货
- `ETH-USD-PERP.DYDX` - 以太坊永续期货
- `SOL-USD-PERP.DYDX` - Solana 永续期货

在策略中订阅：

```python
InstrumentId.from_str("BTC-USD-PERP.DYDX")
InstrumentId.from_str("ETH-USD-PERP.DYDX")
```

:::info
dYdX Indexer 对永续合约的 ticker 是 `{Base}-USD`（如 `BTC-USD`）。适配器追加 `-PERP` 后缀，与其他适配器保持一致，也为未来其他产品类型留出空间。
:::

## 订单能力 {#orders-capability}

dYdX 支持一整套订单类型与执行特性。适配器根据订单类型、时效和过期时间，自动把每笔订单归类为短期、长期或有条件（conditional），无需手动标记。

### 订单类型 {#order-types}

| 订单类型               | 永续合约 | 说明                                               |
| ---------------------- | -------- | -------------------------------------------------- |
| `MARKET`               | ✓        | 以当前最优价立即执行。                             |
| `LIMIT`                | ✓        |                                                    |
| `STOP_MARKET`          | ✓        | 止损条件单，始终为 stateful。                      |
| `STOP_LIMIT`           | ✓        | 条件单，始终为 stateful。                          |
| `MARKET_IF_TOUCHED`    | ✓        | 触及价格触发的止盈市价单。                         |
| `LIMIT_IF_TOUCHED`     | ✓        | 触及价格触发的止盈限价单。                         |
| `TRAILING_STOP_MARKET` | -        | *不支持*。                                         |
| `TRAILING_STOP_LIMIT`  | -        | *不支持*。                                         |

### 执行指令 {#execution-instructions}

| 指令          | 永续合约 | 说明                                                                                                                                                                                             |
| ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `post_only`   | ✓        | 支持 LIMIT、STOP_LIMIT 和 LIMIT_IF_TOUCHED 订单。post-only 订单若定价会穿越价差，会被交易场所**先接受再立即撤销**（不是带原因的拒绝）。                                                          |
| `reduce_only` | ✓        | 链上**只接受立即可执行的订单（IOC）**带该标志。其他情况链上以 `code=9003` 拒绝：`Reduce-only is currently disabled for non-IOC orders`。                                                          |

适配器对该标志的处理因订单类型而异：

| 订单类型                                  | `reduce_only` 行为                                                              |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| `MARKET`                                  | 作为 IOC 订单转发。                                                             |
| `LIMIT`、`STOP_LIMIT`、`LIMIT_IF_TOUCHED` | 按你的时效转发。必须用 `IOC`，否则链会拒绝。                                    |
| `STOP_MARKET`、`MARKET_IF_TOUCHED`        | 会转发，但这两类没有时效，链总是拒绝。                                          |

市价单直接设 `reduce_only`；支持的限价类订单要搭配 `IOC` 使用。

### 时效选项 {#time-in-force-options}

| 时效          | 永续合约 | 说明                                                                                                                                                                   |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GTC`         | ✓        | 撤销前有效（Good Till Canceled）。                                                                                                                                     |
| `GTD`         | ✓        | 到期前有效（Good Till Date）。场所把过期上报为撤销事件；订单 `expire_time` 已过时，适配器把它映射为 `OrderExpired`（而非 `OrderCanceled`）。                          |
| `IOC`         | ✓        | 立即成交否则撤销（Immediate or Cancel）。                                                                                                                              |
| `FOK`         | -        | *已被 dYdX v4 弃用*。链以 `code=48` 拒绝 FOK 订单；适配器在本地生成 `OrderDenied`，不广播。                                                                            |
| `DAY`         | -        | *不支持*。适配器在本地生成 `OrderDenied`，不广播。                                                                                                                     |

### 高级订单特性 {#advanced-order-features}

| 特性             | 永续合约 | 说明                                                                                                                                                                                       |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 订单修改         | -        | 不支持。dYdX 支持短期订单[替换](https://docs.dydx.xyz/concepts/trading/limit-orderbook#replacements)（同 ID、更高 GTB）；尚未以 `ModifyOrder` 暴露。                                       |
| 括号/OCO 订单    | -        | *不支持*。                                                                                                                                                                                   |
| 冰山订单         | -        | *不支持*。                                                                                                                                                                                   |

### 批量操作 {#batch-operations}

| 操作     | 永续合约 | 说明                                                                                                                   |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| 批量下单 | ✓        | 支持长期 `LIMIT` 订单。短期订单逐个提交。                                                                              |
| 批量修改 | -        | *不支持*。                                                                                                             |
| 批量撤单 | ✓        | 按生命周期分组：短期订单用 `MsgBatchCancel`（一次 gRPC 调用），长期订单用批量 `MsgCancelOrder`。                       |

### 持仓管理 {#position-management}

| 特性         | 永续合约 | 说明                                                          |
| ------------ | -------- | ------------------------------------------------------------- |
| 查询持仓     | ✓        | 实时持仓更新。                                                |
| 持仓模式     | -        | 仅净额结算（见下）。                                          |
| 杠杆控制     | -        | 由各市场的保证金比例决定，无账户级覆盖。                      |
| 保证金模式   | -        | 仅全仓（cross margin）。                                      |

:::note
dYdX 在场所层面对持仓做净额结算（每个工具一个持仓），因此适配器只以 `NETTING` 模式运行。
:::

### 订单查询 {#order-querying}

| 特性             | 永续合约 | 说明                         |
| ---------------- | -------- | ---------------------------- |
| 查询挂单         | ✓        | 列出全部活动订单。           |
| 查询订单历史     | ✓        | 历史订单数据。               |
| 订单状态更新     | ✓        | 实时订单状态变更。           |
| 成交历史         | ✓        | 执行与成交报告。             |

### 或有订单 {#contingent-orders}

| 特性         | 永续合约 | 说明                                             |
| ------------ | -------- | ------------------------------------------------ |
| 订单列表     | -        | *不支持*。                                       |
| OCO 订单     | -        | *不支持*。                                       |
| 括号订单     | -        | *不支持*。                                       |
| 条件订单     | ✓        | 止损、止盈市价、止盈限价。                       |

### 权益层级限额 {#equity-tier-limit}

dYdX 按子账户净抵押品限额其可持有的**stateful 订单**（长期与条件）数量上限，短期订单不受限。超限提交会被链以 `code=10001` 拒绝，日志形如 `Opening order would exceed equity tier limit of N`。请先撤销已有的 stateful 订单再下单，或把策略拆分到多个子账户。

| 净抵押品            | 最大在持 stateful 订单 |
| ------------------- | ---------------------- |
| 低于 $20            | 0                      |
| $20 至 $100         | 10                     |
| $100 至 $1,000      | 20                     |
| $1,000 至 $10,000   | 40                     |
| $10,000 至 $100,000 | 100                    |
| $100,000 及以上     | 200                    |

层级可由治理调整。实时值可查询节点的 `/dydxprotocol/clob/equity_tier` 端点，或见
[权益层级限额](https://docs.dydx.xyz/concepts/trading/limits/equity-tier-limits)。

### MIT 与 LIT 的往返转换 {#mit-and-lit-round-tripping}

dYdX 协议用单一的 `TAKE_PROFIT` 订单类型，带价格（`subticks`）和触发价。它表现为"触发即市价"还是"触发即限价"隐含在价格里。适配器把 Nautilus 的 `MARKET_IF_TOUCHED` 提交为价格设为 5% 穿透最坏价的止盈单，把 `LIMIT_IF_TOUCHED` 提交为用户限价的止盈单。两种形式在 Indexer 返回时都是 `"type":"TAKE_PROFIT"`。

对账时，适配器按上报价格偏离触发价的幅度还原原始 Nautilus 订单类型：偏差**达到 2% 或以上**说明价格来自 5% 穿透缓冲，订单按 `MARKET_IF_TOUCHED` 对账；更近的按用户自选限价处理，对账为 `LIMIT_IF_TOUCHED`。2% 阈值能把穿透区间与通常的止盈限价偏移（远低于 1%）分开。

### 清算与 ADL（自动减仓）处理 {#liquidation-and-adl-deleveraging-handling}

dYdX v4 按顺序使用两层风险机制：

1. **清算（Liquidation）**：账户跌破维持保证金时启动。持仓在距预言机价格有界价差内与保险基金对敲平仓。
2. **自动减仓（ADL）**：清算无法完全恢复偿付能力，或预言机价格大幅跳空使账户单步穿仓时启动。ADL 让资不抵债的持仓与随机挑选的对手方账户对敲平仓。

Indexer 通过每条 `Fill` 记录的 `type` 字段暴露分类：

| `type`        | 含义                                            |
| ------------- | ----------------------------------------------- |
| `LIMIT`       | 普通成交。                                      |
| `LIQUIDATED`  | 清算的吃单方（资不抵债的一方）。                |
| `LIQUIDATION` | 清算的挂单方（保险基金）。                      |
| `DELEVERAGED` | 自动减仓的吃单方（被减仓平仓）。                |
| `OFFSETTING`  | 自动减仓的挂单方（被选中的对手账户）。          |

场所未来引入的其他取值会解码为未知成交类型并按普通成交处理，新分类不会导致成交被丢弃。

适配器对每笔清算/减仓成交记录一条警告（含工具、方向、数量、价格），然后按常规路径发出 `FillReport`。场所上报为 `LIQUIDATED` 的持仓按已平仓处理，对应的持仓报告就此收尾。

上游参考：

- [清算](https://docs.dydx.xyz/concepts/trading/liquidations)
- [合约损失机制（自动减仓）](https://help.dydx.trade/en/articles/166973-contract-loss-mechanisms-on-dydx-chain)

### 订单分类 {#order-classification}

dYdX 把每笔订单归入三种链上类别之一。适配器根据时效和过期时间自动判定类别，无需手动配置。

| 类别     | 存放位置 | 过期方式        | 典型用途                                          |
| -------- | -------- | --------------- | ------------------------------------------------- |
| 短期     | 内存     | 区块高度        | IOC，或 40 个区块内过期的订单。                   |
| 长期     | 链上     | 时间戳（UTC）   | 过期超出短期窗口的 GTC/GTD。                      |
| 有条件   | 链上     | 时间戳（UTC）   | 止损与止盈触发单。                                |

协议层面，**dYdX 的所有订单都是限价单**。`MARKET` 类型是 Nautilus 的便利抽象，适配器把它实现为定价深度穿透盘口的激进 IOC 限价单。因此市价单与限价单走同样的 `Submitted > Accepted > Filled` 生命周期（成交前会有 `OrderAccepted` 事件）。

短期与 stateful 订单的完整协议机制见
[dYdX 订单文档](https://docs.dydx.xyz/concepts/trading/orders)。

#### 短期订单 {#short-term-orders}

短期订单**只存在于验证者内存**中，按区块高度过期。协议的 `ShortBlockWindow` 把其寿命封顶为当前高度之后的 **40 个区块**。它们跳过链上存储，是 dYdX 上最快的订单类型。

**特性**：

- **IOC（以及弃用的 FOK）永远是短期订单**，不管其他参数如何
- **GTD 订单**过期落在动态短期窗口（`40 blocks × seconds_per_block`）内时自动归为短期
- 防重放用 Good-Til-Block（GTB），不用 Cosmos SDK 序列号
- 可以**并发**广播（无信号量，序列号用缓存值）
- 过期不需要撤销交易。Indexer 把每次过期上报为撤销，适配器发出 `OrderCanceled`
- 不能批量装进一笔交易（每笔交易一个 `MsgPlaceOrder`）

#### 长期订单 {#long-term-orders}

长期（stateful）订单**存储在链上**，按 UTC 时间戳过期。过期或被撤销时会生成显式撤销事件。

**特性**：

- **GTC** 订单默认 90 天过期（协议上限 95 天）
- **GTD** 订单使用用户提供的时间戳
- 需要规范的 Cosmos SDK 序列号管理（信号量串行化）
- 必须以递增序列号**串行**广播
- 可以批量装进一笔交易

#### 有条件订单 {#conditional-orders}

有条件订单（止损、止盈）**始终存储在链上**，由验证者上的价格条件触发。

**特性**：

- 始终使用基于时间戳的过期（GTC 默认 90 天，协议上限 95 天）
- 始终使用长期广播路径（信号量串行）
- 包括 `StopMarket`、`StopLimit`、`TakeProfitMarket` 和 `TakeProfitLimit`

#### 自动路由 {#automatic-routing}

适配器根据估算的出块时间自动决定订单寿命：

```
max_short_term_secs = 40 blocks (ShortBlockWindow) × seconds_per_block
```

订单距过期不足 `max_short_term_secs` 时按短期路由，否则按长期路由。无需手动配置。

#### MARKET 订单的实现 {#market-order-implementation}

dYdX 没有原生市价单类型。适配器把 `MARKET` 订单实现为激进的 **IOC 限价单**，定价为：

- **买入**：`oracle_price × (1 + 0.05)`（高于预言机价 5%）
- **卖出**：`oracle_price × (1 - 0.05)`（低于预言机价 5%）

这 5% 滑点缓冲（`DEFAULT_MARKET_ORDER_SLIPPAGE = 0.05`）设定最坏价格（"穿透价"）。订单是 IOC，未成交的滑点不会被消耗。缓冲有意设宽，以在剧烈行情下最大化成交概率。

### 客户订单 ID 编码 {#client-order-id-encoding}

dYdX 链上要求 `u32` 客户端 ID，而 Nautilus 使用字符串型 `ClientOrderId`（如 `O-20260220-031943-001-000-51`）。适配器做双向编码，让订单在重启后无需持久化状态也能对账。

对标准 O 格式（`O-YYYYMMDD-HHMMSS-TTT-SSS-CCC`），编码是确定性的：

| dYdX 字段       | 位数 | 内容                                               |
| --------------- | ---- | -------------------------------------------------- |
| `client_id`     | 32   | `[trader:10][strategy:10][count:12]`（唯一键）。   |
| `client_metadata` | 32 | 距 2020-01-01 UTC 的秒数（时间戳）。               |

由于编码确定，适配器可以把任何对账回来的订单解码回原始 `ClientOrderId` 字符串，不需要数据库或映射文件。

纯数字的 `ClientOrderId` 同样是确定性的：数字直接作为 `client_id`，`client_metadata` 置固定标记，跨重启也能解码。其他格式退化为顺序分配加内存反向映射，这类 ID 只能在当次会话内解码。
