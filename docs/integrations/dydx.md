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
| HTTP      | Indexer   | 只读   | 金融工具元数据、历史数据、账户状态。                   |
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
- `InstrumentCache`：金融工具解析与加载，HTTP、WebSocket 和执行客户端共用。
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
dYdX 在场所层面对持仓做净额结算（每个金融工具一个持仓），因此适配器只以 `NETTING` 模式运行。
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

适配器对每笔清算/减仓成交记录一条警告（含金融工具、方向、数量、价格），然后按常规路径发出 `FillReport`。场所上报为 `LIQUIDATED` 的持仓按已平仓处理，对应的持仓报告就此收尾。

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

#### 重启防冲突 {#restart-collision-prevention}

重启时，Nautilus 按对账回来的订单数量重置内部订单计数器，这个数量可能低于上一次会话用过的最大计数值（例如部分订单已从 API 响应中过期）。这会让新订单产生与上次会话订单相同的 `client_id`，导致场所订单 UUID 重复。

适配器把对账期间见过的每个 `client_id` 都登记下来来防止这一点。新的 O 格式编码若产生已用过的 `client_id`，编码器记录警告并回退到顺序分配，顺序分配也会跳过所有已登记的值。

:::note
该保护是自动的，无需用户配置。警告日志 `[ENCODER] client_id ... collides with reconciled order` 只是提示性的，订单仍会以替代 ID 成功提交。
:::

## 广播与重试策略 {#broadcasting-and-retry-strategy}

### 短期广播 {#short-term-broadcast}

短期订单用 Good-Til-Block（GTB）防重放。链上 `ClobDecorator` 的 ante handler 对短期消息跳过 Cosmos SDK 序列号检查，因此：

- **无信号量**：广播完全并发
- **序列号用缓存值**：无需递增或分配
- **不重试**：广播失败即失败
- 良性的撤销错误按成功处理（见下文）

### 长期广播 {#long-term-broadcast}

长期和条件订单需要规范的 Cosmos SDK 序列号管理：

- **1 个许可的信号量**串行化全部长期广播
- **指数退避**：500ms → 1s → 2s → 4s（最多重试 5 次）
- **总预算 10 秒**，防止无限重试循环
- 序列号不匹配时，先**从链上重新同步**再重试
- 瞬时 gRPC 失败（unavailable、deadline exceeded、resource exhausted）同样先重新同步再重试，反复超时不会让本地序列号跑在链前面

### 序列号不匹配检测 {#sequence-mismatch-detection}

| 错误码      | 来源             | 含义                                          |
| ----------- | ---------------- | --------------------------------------------- |
| `code=32`   | Cosmos SDK       | 账户序列号不匹配                              |
| `code=104`  | dYdX 认证器      | 签名验证失败（与序列号相关）                  |

两者都经 `RetryManager` 触发自动重新同步加重试。

### 良性撤销错误 {#benign-cancel-errors}

短期撤销操作中的这些错误按**成功**处理：

| 错误码      | 含义                                                              |
| ----------- | ----------------------------------------------------------------- |
| `code=19`   | 交易已在 mempool 缓存中（重复交易）                               |
| `code=9`    | memclob 中已存在 GoodTilBlock 大于等于它的撤销                    |
| `code=3006` | 要撤销的订单不存在（已成交/过期/撤销）                            |

### 批量撤单分组 {#batch-cancel-partitioning}

撤销多个订单时，适配器按生命周期分组：

1. **短期订单**：经 `broadcast_short_term()` 发一条 `MsgBatchCancel`
2. **长期订单**：经 `broadcast_with_retry()` 发批量的 `MsgCancelOrder` 消息

确保每组使用各自的广播策略。

## 资金费率 {#funding-rates}

dYdX 永续期货使用固定 1 小时资金费率区间。适配器对所有 `FundingRateUpdate` 对象（无论 WebSocket 还是历史数据）把 `interval` 设为 `60`（分钟）。

## 限流 {#rate-limiting}

### gRPC 限流 {#grpc-rate-limiting}

适配器对 gRPC `broadcast_tx` 调用限流，防止来自验证者节点的 `ResourceExhausted`（429）错误。

| 设置                         | 默认值  | 说明                                                                  |
| ---------------------------- | ------- | --------------------------------------------------------------------- |
| `grpc_rate_limit_per_second` | `4`     | 每秒最大 gRPC 广播请求数，设为 `None` 禁用。                          |

这是配置结构体字段，不是 Python `DydxExecutionClientConfig` 构造函数的参数。

### 提供商限额 {#provider-limits}

公共 gRPC 提供商的已知限额：

| 提供商    | 限额                 |
| --------- | -------------------- |
| Polkachu  | 300 req/min（约 5/s）|
| KingNodes | 250 req/min（约 4.2/s） |
| AutoStake | 4 req/s              |

默认 4 req/s 偏保守，在所有公共提供商上都能用。

### 多 gRPC URL 回退 {#multiple-grpc-url-fallback}

适配器连接 URL 列表中第一个可达的节点，连接失败就换下一个。去中心化交易所上单个公共节点会不打招呼地下线，这一点很重要。执行配置按以下顺序解析该列表：

1. `grpc_urls`，非空时。
2. `grpc_endpoint`，作为单元素列表。只设置这一个字段就放弃了回退能力。
3. 所选网络的默认公共验证者节点。

两个字段都属于配置结构体，但 Python 的 `DydxExecutionClientConfig` 构造函数不暴露它们，因此 Python 配置总是使用内置回退的网络默认值。

## 价格与数量量化 {#price-and-size-quantization}

dYdX 对价格和数量使用整数量化。适配器经 `OrderMessageBuilder` 自动处理全部转换，理解这些参数有助于调试。

### 市场参数 {#market-parameters}

| 参数                          | 说明                                                  |
| ----------------------------- | ----------------------------------------------------- |
| `atomic_resolution`           | 人类可读数量转 quantums 的指数                        |
| `quantum_conversion_exponent` | quantums 转代币的指数                                 |
| `step_base_quantums`          | 最小下单规模的步长（quantums）                        |
| `subticks_per_tick`           | 每个 tick 内部的价格粒度                              |

### 市价单定价 {#market-order-pricing}

未显式定价的订单使用预言机价格加 5% 滑点缓冲（"穿透价"），覆盖 `MARKET`、`STOP_MARKET` 和 `MARKET_IF_TOUCHED`：

- **买入**：`oracle_price × 1.05`
- **卖出**：`oracle_price × 0.95`

订单定价从金融工具缓存读取预言机价格。该缓存由 Indexer 在客户端连接时填充，之后不再刷新，因此穿透区间始终锚定连接时刻的预言机价。执行客户端另行在 markets 通道上跟踪实时预言机价格，用于账户状态和持仓估值，不用于订单定价。

### 自动处理 {#automatic-handling}

全部价格与数量量化由 `OrderMessageBuilder` 自动处理，经 Nautilus 下单无需手动转换。

## 数据订阅 {#data-subscriptions}

适配器支持以下数据订阅：

| 数据类型           | 订阅 | 历史请求 | 说明                                             |
| ------------------ | ---- | -------- | ------------------------------------------------ |
| 成交 tick          | ✓    | ✓        |                                                  |
| 报价 tick          | ✓    | -        | 由订单簿 top-of-book 合成。                      |
| 订单簿 delta       | ✓    | -        | 仅 L2 深度。                                     |
| 订单簿快照         | -    | ✓        | 经 HTTP 请求的一次性快照。                       |
| Bar                | ✓    | ✓        | 支持的周期见下文。                               |
| Mark 价格          | ✓    | -        | 经 markets 通道。                                |
| Index 价格         | ✓    | -        | 经 markets 通道。                                |
| 资金费率           | ✓    | ✓        | 实时经 markets 通道，历史经 HTTP。               |
| 金融工具状态           | ✓    | -        | 经 markets 通道。                                |

### 支持的 bar 周期 {#supported-bar-resolutions}

| 周期       | dYdX candle |
| ---------- | ----------- |
| 1-MINUTE   | `1MIN`      |
| 5-MINUTE   | `5MINS`     |
| 15-MINUTE  | `15MINS`    |
| 30-MINUTE  | `30MINS`    |
| 1-HOUR     | `1HOUR`     |
| 4-HOUR     | `4HOURS`    |
| 1-DAY      | `1DAY`      |

## 子账户 {#subaccounts}

dYdX 支持每个钱包地址多个子账户，便于在单一钱包内隔离交易策略与风险管理。

### 概念 {#concepts}

- 每个钱包地址可有多个编号子账户（0、1、2、…、127）。128 及以上是场所的逐仓隔离保证金子账户，本适配器不支持。
- 子账户 0 是**默认**账户，首次入金时自动创建。
- 每个子账户独立维护：
  - 持仓
  - 挂单
  - 抵押品余额
  - 保证金要求

### 配置 {#configuration}

在执行客户端配置中指定子账户编号：

```python
from nautilus_trader.adapters.dydx import DydxExecutionClientConfig
from nautilus_trader.model import AccountId


exec_config = DydxExecutionClientConfig(
    account_id=AccountId.from_str("DYDX-001"),
    subaccount_number=0,
)
```

:::note
多数用户使用子账户 `0`（默认值）。高级用户可以为不同子账户配置多个执行客户端，实现策略隔离或风险隔离。
:::

## 测试网设置 {#testnet-setup}

dYdX 测试网（`dydx-testnet-4`）是主网的完整副本，用于不冒真实资金风险地测试策略。设置 `network=DydxNetwork.TESTNET` 后，所有默认测试网端点自动解析。

### 1. 创建测试网钱包 {#1-create-a-testnet-wallet}

**方式 A：通过 dYdX 测试网网页应用（最简单）**

1. 打开 [v4.testnet.dydx.exchange](https://v4.testnet.dydx.exchange)
2. 用 MetaMask、Keplr、Phantom 或 WalletConnect 连接
3. dYdX 账户自动生成
4. 导出助记短语：点击右上角地址，选择 "Export secret phrase"

**方式 B：使用已有的 secp256k1 私钥**

任意 32 字节十六进制编码的 secp256k1 私钥都可以。适配器用 Cosmos bech32 编码自动从密钥推导出 `dydx1...` 地址。

### 2. 为测试网账户注资 {#2-fund-the-testnet-account}

适配器连接前子账户必须已入金（见[首次账户激活](#architecture)）。

**通过测试网网页应用**：在 [v4.testnet.dydx.exchange](https://v4.testnet.dydx.exchange) 点击入金/充值按钮，自动获得测试网 USDC。

**直接调用 faucet API**：

```bash
# Fund subaccount 0 with 2000 USDC
curl -X POST https://faucet.v4testnet.dydx.exchange/faucet/tokens \
  -H "Content-Type: application/json" \
  -d '{"address": "dydx1...", "subaccountNumber": 0, "amount": 2000}'

# Fund native tokens (for gas fees)
curl -X POST https://faucet.v4testnet.dydx.exchange/faucet/native-token \
  -H "Content-Type: application/json" \
  -d '{"address": "dydx1..."}'
```

### 3. 设置环境变量 {#3-set-environment-variables}

```bash
export DYDX_TESTNET_WALLET_ADDRESS="dydx1..."
export DYDX_TESTNET_PRIVATE_KEY="0x..."  # hex-encoded, 0x prefix optional
```

### 4. 配置交易节点 {#4-configure-the-trading-node}

数据与执行客户端都设置 `network=DydxNetwork.TESTNET`：

```python
from nautilus_trader.adapters.dydx import DydxDataClientConfig
from nautilus_trader.adapters.dydx import DydxExecutionClientConfig
from nautilus_trader.adapters.dydx import DydxNetwork
from nautilus_trader.model import AccountId


data_config = DydxDataClientConfig(network=DydxNetwork.TESTNET)

exec_config = DydxExecutionClientConfig(
    account_id=AccountId.from_str("DYDX-001"),
    network=DydxNetwork.TESTNET,
    wallet_address=None,  # Falls back to DYDX_TESTNET_WALLET_ADDRESS
    private_key=None,  # Falls back to DYDX_TESTNET_PRIVATE_KEY
    subaccount_number=0,
)
```

### 测试网端点 {#testnet-endpoints}

Python 构造函数自动选择默认测试网端点，不暴露端点覆盖。

| 服务      | 默认 URL                                             |
| --------- | ---------------------------------------------------- |
| HTTP      | `https://indexer.v4testnet.dydx.exchange`            |
| WebSocket | `wss://indexer.v4testnet.dydx.exchange/v4/ws`        |
| gRPC      | `https://test-dydx-grpc.kingnodes.com:443`（主）     |
| Faucet    | `https://faucet.v4testnet.dydx.exchange`             |
| 网页应用  | `https://v4.testnet.dydx.exchange`                   |

### 主网端点 {#mainnet-endpoints}

Python 构造函数自动选择默认主网端点，不暴露端点覆盖。

| 服务      | 默认 URL                                            |
| --------- | --------------------------------------------------- |
| HTTP      | `https://indexer.dydx.trade`                        |
| WebSocket | `wss://indexer.dydx.trade/v4/ws`                    |
| gRPC      | `https://dydx-ops-grpc.kingnodes.com:443`（主）     |

## 配置 {#configuration-1}

通过交易节点配置 dYdX 适配器。执行客户端支持凭据的环境变量回退；数据客户端使用公共端点，不需要钱包凭据。

### 数据客户端配置选项 {#data-client-configuration-options}

| 选项        | 默认值    | 说明                                            |
| ----------- | --------- | ----------------------------------------------- |
| `network`   | `MAINNET` | `DydxNetwork.MAINNET` 或 `DydxNetwork.TESTNET`。|
| `proxy_url` | `None`    | HTTP 与 WebSocket 可选代理 URL。                |

### 执行客户端配置选项 {#execution-client-configuration-options}

| 选项                | 默认值    | 说明                                                                            |
| ------------------- | --------- | ------------------------------------------------------------------------------- |
| `account_id`        | 必填      | 该客户端的 Nautilus 账户 ID。                                                   |
| `network`           | `MAINNET` | `DydxNetwork.MAINNET` 或 `DydxNetwork.TESTNET`。                                |
| `private_key`       | `None`    | 十六进制签名密钥；回退到按网络区分的环境变量。                                  |
| `wallet_address`    | `None`    | dYdX 钱包地址；回退到按网络区分的环境变量。                                     |
| `subaccount_number` | `0`       | 子账户编号，`0` 至 `127`。                                                      |
| `proxy_url`         | `None`    | HTTP 与 WebSocket 可选代理 URL。                                                |

### 基本设置 {#basic-setup}

在节点 builder 上把 `DydxDataClientConfig` 与 `DydxDataClientFactory`、`DydxExecutionClientConfig` 与 `DydxExecutionClientFactory` 一起注册。
[Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/dydx/)
展示了两个客户端完整的 `LiveNode.builder(...)` 接线。

### API 凭据 {#api-credentials}

凭据可以直接通过 Python 配置传入（`wallet_address`、`private_key`），也可以根据配置的 `network` 自动从环境变量解析。

#### 环境变量 {#environment-variables}

| 变量                          | 网络    | 说明                                           |
| ----------------------------- | ------- | ---------------------------------------------- |
| `DYDX_WALLET_ADDRESS`         | 主网    | Bech32 编码的钱包地址（`dydx1...`）。          |
| `DYDX_PRIVATE_KEY`            | 主网    | 十六进制编码的 secp256k1 签名私钥。            |
| `DYDX_TESTNET_WALLET_ADDRESS` | 测试网  | 测试网钱包地址（`dydx1...`）。                 |
| `DYDX_TESTNET_PRIVATE_KEY`    | 测试网  | 测试网私钥。                                   |

#### 解析优先级 {#resolution-priority}

1. Python 配置传入的值（非空时）
2. 按 `network` 选定的环境变量

### 授权密钥交易 {#permissioned-key-trading}

#### 什么是 API Trading Keys {#what-are-api-trading-keys}

API Trading Keys 让你把交易委托给一个独立的签名密钥，不必共享主钱包的助记短语。API 密钥可以使用所有者全仓账户的全部可用保证金交易，但不能提款或划转资产。

#### 创建 API 密钥 {#creating-an-api-key}

1. 在 dYdX 网页应用中进入 **More > API Trading Keys**
2. 点击 **Generate New API Key**
3. 保存 **API Wallet Address** 和 **Private Key**（只显示一次，dYdX 不存储）
4. 点击 **Authorize API Key**（把密钥作为认证器注册到链上）
5. 密钥即刻生效，可用于交易

认证器模型见
[dYdX 授权密钥文档](https://docs.dydx.xyz/interaction/permissioned-keys)，网页应用创建与管理密钥的流程见
[前端操作指南](https://help.dydx.trade/en/articles/267486-api-trading-keys-creating-a-new-key-on-the-front-end)。

#### 适配器配置 {#adapter-configuration}

把 API 密钥的私钥设为 `DYDX_PRIVATE_KEY`，所有者的钱包地址设为 `DYDX_WALLET_ADDRESS`。适配器在连接时检测到二者不一致，自动向链查询匹配的认证器 ID。

```python
from nautilus_trader.adapters.dydx import DydxExecutionClientConfig
from nautilus_trader.model import AccountId


config = DydxExecutionClientConfig(
    account_id=AccountId.from_str("DYDX-001"),
    wallet_address="dydx1owner...",  # Owner account (holds margin)
    private_key="0xapikey...",  # API Trading Key private key
)
```

公共 Python 配置不接受手动指定认证器 ID。

:::note
API Trading Keys 只适用于**全仓**账户和全仓市场，不支持逐仓。
:::

## 订单簿 {#order-books}

按订阅方式，订单簿可以维持完整深度或 top-of-book 报价。场所不直接提供报价：适配器订阅订单簿 delta，在 top-of-book 价格或数量变化时为 `DataEngine` 合成报价。只支持 L2（MBP）簿类型。

## 参与贡献 {#contributing}

:::info
需要更多功能或想为 dYdX 适配器做贡献，见我们的
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
