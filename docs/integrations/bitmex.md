
# BitMEX

BitMEX（Bitcoin Mercantile Exchange）成立于 2014 年，是一家提供现货、永续合约、传统期货、预测市场及其他高级交易产品的加密衍生品交易平台。本篇集成指南介绍如何在 NautilusTrader 中接入 BitMEX 的实时行情（market data）与下单执行功能。

## 概述

该适配器以 Rust 实现，并提供可选的 Python 绑定，方便在以 Python 为主的工作流中使用。
适配器不依赖外部的 BitMEX 客户端库：核心组件被编译为静态库并在构建时自动链接。

## 示例

可在仓库中找到实时示例脚本：[examples/live/bitmex](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/bitmex/)。

## 组件

本指南假设用户同时需要接入实时行情和交易执行。BitMEX 适配器由多个组件构成，可根据使用场景组合或单独使用：

- `BitmexHttpClient`：用于低级别的 HTTP API 连接。
- `BitmexWebSocketClient`：用于低级别的 WebSocket 连接。
- `BitmexInstrumentProvider`：合约/标的解析与加载功能。
- `BitmexDataClient`：行情数据管理器。
- `BitmexExecutionClient`：账户管理与交易执行网关。
- `BitmexLiveDataClientFactory`：用于交易节点构建器的数据客户端工厂。
- `BitmexLiveExecClientFactory`：用于交易节点构建器的执行客户端工厂。

:::note
大多数用户只需为实时交易节点定义配置（见下文示例），通常无需直接操作这些低级组件。
:::

## BitMEX 文档

BitMEX 提供了详尽的官方文档：

- [BitMEX API Explorer](https://www.bitmex.com/app/restAPI) — 交互式 API 文档。
- [BitMEX API Documentation](https://www.bitmex.com/app/apiOverview) — 完整的 API 参考。
- [BitMEX Exchange Rules](https://www.bitmex.com/exchange-rules) — 官方交易所规则与规范。
- [Contract Guides](https://www.bitmex.com/app/contract) — 合约规格说明。
- [Spot Trading Guide](https://www.bitmex.com/app/spotGuide) — 现货交易指南。
- [Perpetual Contracts Guide](https://www.bitmex.com/app/perpetualContractsGuide) — 永续合约说明。
- [Futures Contracts Guide](https://www.bitmex.com/app/futuresGuide) — 期货合约说明。

建议在阅读本集成指南的同时参考 BitMEX 的官方文档以获得更完整的信息。

## 支持的产品

| 产品类型             | 数据源    | 交易支持 | 说明                                                    |
| -------------------- | --------- | -------- | ------------------------------------------------------- |
| 现货（Spot）         | ✓         | ✓        | 支持受限交易对，与衍生品共用钱包。                        |
| 永续合约（Perpetual）| ✓         | ✓        | 支持反向与线性永续合约。                                 |
| 期货（Futures）      | ✓         | ✓        | 传统的有到期日的合约。                                   |
| Quanto 期货          | ✓         | ✓        | 结算货币与标的不同的合约。                               |
| 预测市场（Prediction）| ✓        | ✓        | 基于事件的合约，价格区间 0-100，以 USDT 结算。             |
| 期权（Options）      | -         | -        | _BitMEX 不再提供期权产品。_                              |

:::note
BitMEX 已停止其期权产品，以聚焦其核心的衍生品与现货业务。
:::

### 现货交易

- 直接的代币/币种现货交易，实时交割。
- 常见主流交易对包括 XBT/USDT、ETH/USDT、ETH/XBT。
- 也支持部分山寨币对（如 LINK、SOL、UNI、APE、AXS、BMEX 对 USDT）。

### 衍生品

- 永续合约：包含反向合约（例如 XBTUSD）和线性合约（例如 ETHUSDT）。
- 传统期货：具有固定到期日的合约。
- Quanto 期货：以与标的不同货币结算的合约。
- 预测市场：基于事件的衍生品（例如 P_FTXZ26、P_SBFJAILZ26），无杠杆，价格 0–100，以 USDT 结算。

## 符号约定（Symbology）

BitMEX 使用特定的合约/交易符号命名规则。理解这些规则有助于正确识别和交易标的。

### 符号格式

常见格式如下：

- **现货对**：基础货币 + 报价货币（例如 `XBT/USDT`、`ETH/USDT`）。
- **永续合约**：基础货币 + 报价货币（例如 `XBTUSD`、`ETHUSD`）。
- **期货合约**：基础货币 + 到期代码（例如 `XBTM24`、`ETHH25`）。
- **Quanto 合约**：用于非 USD 结算合约的特殊命名。
- **预测市场**：以 `P_` 前缀 + 事件标识 + 到期代码（例如 `P_POWELLK26`、`P_FTXZ26`）。

:::info
BitMEX 使用 `XBT` 作为比特币的代码而非 `BTC`，遵循 ISO 4217 中以 "X" 开头表示非国家法币的惯例。XBT 与 BTC 指代同一资产（Bitcoin）。
:::

### 到期代码

期货合约使用标准的期货月份代码：

- `F` = 一月
- `G` = 二月
- `H` = 三月
- `J` = 四月
- `K` = 五月
- `M` = 六月
- `N` = 七月
- `Q` = 八月
- `U` = 九月
- `V` = 十月
- `X` = 十一月
- `Z` = 十二月

后接年份（例如 `24` 表示 2024 年，`25` 表示 2025 年）。

### NautilusTrader 中的 Instrument ID

在 NautilusTrader 中，BitMEX 的标的使用原生 BitMEX 符号直接标识，并与场馆（venue）标识符组合：

```python
from nautilus_trader.model.identifiers import InstrumentId

# 现货（注意：符号中不带斜杠）
spot_id = InstrumentId.from_str("XBTUSDT.BITMEX")  # XBT/USDT 现货
eth_spot_id = InstrumentId.from_str("ETHUSDT.BITMEX")  # ETH/USDT 现货

# 永续合约
perp_id = InstrumentId.from_str("XBTUSD.BITMEX")  # 比特币永续（反向）
linear_perp_id = InstrumentId.from_str("ETHUSDT.BITMEX")  # 以太坊永续（线性）

# 期货合约（例如 2024 年 6 月到期）
futures_id = InstrumentId.from_str("XBTM24.BITMEX")  # 比特币 2024-06 到期的期货

# 预测市场合约
prediction_id = InstrumentId.from_str("P_XBTETFV23.BITMEX")  # 关于比特币 ETF SEC 批准的预测合约（2023-10 到期）
```

:::note
在 NautilusTrader 中，BitMEX 的现货符号不包含 UI 中常见的斜杠（/）。请使用 `XBTUSDT` 而非 `XBT/USDT`。
:::

### 数量缩放（Quantity scaling）

BitMEX 在现货与衍生品中以「合约（contract）」为单位上报数量。每份合约对应的实际基础资产大小由交易所发布在合约定义中：

- `lotSize` — 可交易的最小合约数量。
- `underlyingToPositionMultiplier` — 每一单位标的对应的合约数。

例如，SOL/USDT 现货（`SOLUSDT`）可能返回 `lotSize = 1000` 和 `underlyingToPositionMultiplier = 10000`，表示一份合约代表 `1 / 10000 = 0.0001` SOL，而最小下单量（`lotSize * contract_size`）为 `0.1` SOL。适配器会根据这些字段推导合约大小，并对入站行情与出站订单做相应缩放，使 Nautilus 中的数量总以基础单位（SOL、ETH 等）表示。

详情请参见 BitMEX 的合约属性文档： [Instrument Properties (BitMEX API)](https://www.bitmex.com/app/apiOverview#Instrument-Properties)。

## 订单能力（Orders capability）

BitMEX 集成支持下列订单类型与执行特性。

### 订单类型

| 订单类型                | 支持   | 说明                                                                          |
| ---------------------- | ------ | ----------------------------------------------------------------------------- |
| `MARKET`               | ✓      | 以市价立即成交。不支持按报价数量（quote quantity）。                           |
| `LIMIT`                | ✓      | 仅在指定价格或更优价格成交。                                                  |
| `STOP_MARKET`          | ✓      | 支持（设置 `trigger_price`）。                                                 |
| `STOP_LIMIT`           | ✓      | 支持（设置 `price` 与 `trigger_price`）。                                      |
| `MARKET_IF_TOUCHED`    | ✓      | 支持（设置 `trigger_price`）。                                                 |
| `LIMIT_IF_TOUCHED`     | ✓      | 支持（设置 `price` 与 `trigger_price`）。                                      |
| `TRAILING_STOP_MARKET` | -      | _未实现_（BitMEX 原生支持）。                                                  |

### 执行指令（Execution instructions）

| 指令            | 支持   | 说明                                                                                  |
| --------------- | ------ | ------------------------------------------------------------------------------------- |
| `post_only`     | ✓      | 通过 `ParticipateDoNotInitiate` 执行指令在 `LIMIT` 订单上实现。                        |
| `reduce_only`   | ✓      | 通过 `ReduceOnly` 执行指令实现。                                                       |

:::note
会导致跨价（cross the spread）的 post-only 订单会被 BitMEX 取消而非拒绝。该集成会将此类取消作为带 `due_post_only=True` 的拒单上报，便于策略统一处理。
:::

### 触发类型（Trigger types）

BitMEX 支持多种参考价格作为止损/条件单的触发依据：

- `STOP_MARKET`
- `STOP_LIMIT`
- `MARKET_IF_TOUCHED`
- `LIMIT_IF_TOUCHED`

根据策略或风险偏好选择合适的触发类型。

| 参考价        | Nautilus `TriggerType` | BitMEX 值    | 说明                                                                 |
| ------------- | ---------------------- | ------------ | -------------------------------------------------------------------- |
| 最近成交价     | `LAST_PRICE`           | `LastPrice`  | BitMEX 默认；基于最后成交价触发。                                     |
| 标记价         | `MARK_PRICE`           | `MarkPrice`  | 建议用于止损以减少被价格尖峰触发的风险（推荐）。                     |
| 指数价         | `INDEX_PRICE`          | `IndexPrice` | 跟踪外部指数；对某些合约有用。                                       |

- 若未提供 `trigger_type`，BitMEX 将使用场馆默认（`LastPrice`）。
- 这些触发参考由交易所在场内评估；订单在被触发前会一直驻留在交易所。

示例：

```python
from nautilus_trader.model.enums import TriggerType

order = self.order_factory.stop_market(
    instrument_id=instrument_id,
    order_side=order_side,
    quantity=qty,
    trigger_price=trigger,
    trigger_type=TriggerType.MARK_PRICE,  # 使用 BitMEX 的 Mark Price 作为触发参考
)
```

`ExecTester` 的示例配置也展示了如何在 `examples/live/bitmex/bitmex_exec_tester.py` 中将 `stop_trigger_type=TriggerType.MARK_PRICE`。

### 有效期（Time in force）

| 有效期        | 支持   | 说明                                                    |
| ------------- | ------ | ------------------------------------------------------- |
| `GTC`         | ✓      | Good Till Canceled（默认）。                             |
| `GTD`         | -      | _BitMEX 不支持。_                                       |
| `FOK`         | ✓      | Fill or Kill — 要么全部成交要么取消。                   |
| `IOC`         | ✓      | Immediate or Cancel — 允许部分成交并取消剩余。          |
| `DAY`         | ✓      | 在 UTC 00:00 过期（BitMEX 的交易日界限）。               |

:::note
`DAY` 订单在 UTC 时间的 00:00 到期，这对应 BitMEX 的交易日边界（当日交易结束）。更多细节请参阅 [BitMEX Exchange Rules](https://www.bitmex.com/exchange-rules) 与 [API 文档](https://www.bitmex.com/api/explorer/)。
:::

### 高级订单功能

| 功能               | 支持   | 说明                                               |
| ------------------ | ------ | -------------------------------------------------- |
| 订单修改（Modify） | ✓      | 可修改价格、数量和触发价。                          |
| Bracket Orders     | -      | 使用 `contingency_type` 与 `linked_order_ids`。     |
| 冰山订单（Iceberg） | ✓      | 使用 `display_qty` 支持。                           |
| 跟踪止损（Trailing）| -      | _未实现_（BitMEX 原生支持）。                       |
| 钉住订单（Pegged）  | -      | _未实现_（BitMEX 原生支持）。                       |

### 批量操作

| 操作           | 支持   | 说明                                               |
| -------------- | ------ | -------------------------------------------------- |
| 批量提交       | -      | _BitMEX 不支持。_                                  |
| 批量修改       | -      | _BitMEX 不支持。_                                  |
| 批量取消       | ✓      | 支持一次请求取消多个订单。                         |

### 持仓管理

| 功能             | 支持   | 说明                                                       |
| ---------------- | ------ | ---------------------------------------------------------- |
| 查询持仓         | ✓      | 支持通过 REST 查询与 WebSocket 实时持仓更新。              |
| Cross margin     | ✓      | 默认为交叉保证金模式。                                     |
| Isolated margin  | ✓      | 支持逐仓模式。                                              |

### 订单查询

| 功能                  | 支持   | 说明                                           |
| --------------------- | ------ | ---------------------------------------------- |
| 查询未成交订单        | ✓      | 列出所有活动订单。                              |
| 查询订单历史          | ✓      | 历史订单数据。                                  |
| 订单状态更新          | ✓      | 通过 WebSocket 获取实时订单状态变更。           |
| 交易历史              | ✓      | 执行和成交报告。                                |

## 行情数据（Market data）

- 订单薄增量：仅 `L2_MBP`；支持 `depth` 为 0（全量）或 25。
- 订单薄快照：仅 `L2_MBP`；支持 `depth` 为 0（默认 10）或 10。
- 通过 WebSocket 支持盘口报价、成交以及合约更新。
- 支持 funding rate、mark price 与 index price（视合约而定）。
- 通过 REST 支持历史数据请求：
  - 成交 ticks，支持可选的 `start`、`end` 与 `limit`（单次调用上限 1,000 条）。
  - 时间 K 线（`1m`, `5m`, `1h`, `1d`），基于外部聚合的 LAST 价并支持可选的部分区间。

:::note
BitMEX 将每次 REST 响应限制为最多 1,000 行，并需使用 `start`/`startTime` 手动翻页。目前适配器仅返回第一页，后续版本计划增加更完整的翻页支持。
:::

## 连接管理

### HTTP Keep-Alive

BitMEX 适配器使用 HTTP keep-alive 以获得最佳性能：

- 连接池：连接会被自动复用与池化。
- keep-alive 超时：90 秒（与 BitMEX 服务器端超时一致）。
- 自动重连：连接失败时会自动重建。
- SSL 会话缓存：减少后续请求的握手开销。

该配置通过维持持久连接，避免为每次请求建立新连接，从而降低延迟。

### 请求鉴权与过期

BitMEX 使用 `api-expires` 头部进行请求鉴权以防重放攻击：

- 签名请求需包含一个比当前时间提前 `recv_window_ms / 1000` 秒的 `api-expires` Unix 时间戳（默认 10 秒）。
- 一旦该时间戳过期，BitMEX 会拒绝请求，因此请确保延迟在配置窗口内。

## 速率限制（Rate limiting）

BitMEX 实施双层速率限制机制：

### REST 限制

- **突发限制（Burst）**：认证用户每秒 10 次请求（适用于下单、修改、取消等端点）。
- **滚动分钟限制**：认证用户每分钟 120 次请求（未认证用户为每分钟 30 次）。
- **订单上限**：每个标的最多 200 个未平仓订单和 10 个止损订单；超出交易所限制会被拒单。

适配器会自动执行这些配额并将 BitMEX 返回的速率限制头部信息暴露出来。

### WebSocket 限制

- 连接请求请遵循交易所指引（当前为每个 IP 每秒 3 次连接）。
- 私有流需要认证；如果超限，适配器会自动重连。

:::warning
超过 BitMEX 的速率限制将返回 HTTP 429，并可能导致临时 IP 封禁；持续的 4xx/5xx 错误会延长封禁时长。
:::

### 可配置的速率限制

若你的账户有不同的配额，可以通过配置调整速率限制：

| 参数                       | 默认（已认证） | 默认（未认证） | 说明                                         |
| -------------------------- | -------------- | -------------- | -------------------------------------------- |
| `max_requests_per_second`  | 10             | 10             | 每秒最大请求数（突发限制）。                  |
| `max_requests_per_minute`  | 120            | 30             | 每分钟最大请求数（滚动窗口）。                |

:::info
更多关于速率限制的详情请参见 BitMEX 的速率限制文档： [BitMEX API - Limits](https://www.bitmex.com/app/restAPI#Limits).
:::

:::warning
**Cancel Broadcaster 的速率限制注意事项**

当 `canceller_pool_size > 1` 时，cancel broadcaster 会并行将每次取消请求分发到多个独立的 HTTP 客户端实例。每个客户端都有自己的速率限制器，这意味着总体请求速率会随池大小成比例放大。

例如：在 `canceller_pool_size=3`（默认）且 `max_requests_per_second=10` 的配置下，一次取消操作会消耗 **3 次请求**（每个客户端各一次），在快速取消时可能达到 **30 次/秒**。

由于 BitMEX 在账户级别（而非连接级别）实施速率限制，广播器可能导致超过默认的 10 req/s 突发限制和 120 req/min 的滚动限制。

**缓解办法**：根据 `canceller_pool_size` 成比例降低 `max_requests_per_second` 和 `max_requests_per_minute`（即除以池大小），或调整池大小本身（参见 Cancel Broadcaster（取消请求广播器）配置小节）。未来版本可能支持跨池的共享速率限制器。
:::

### 速率限制头部

BitMEX 会通过响应头暴露当前配额信息：

- `x-ratelimit-limit`：当前窗口内允许的总请求数。
- `x-ratelimit-remaining`：剩余可用请求数。
- `x-ratelimit-reset`：配额重置的 UNIX 时间戳。
- `retry-after`：在收到 429 响应后应等待的秒数。

## Cancel Broadcaster（取消请求广播器）

BitMEX 执行客户端包含一个 cancel broadcaster，用于通过并行请求扇出实现容错的订单取消。

### 概念

订单取消是时间敏感的操作——当策略决定取消订单时，任何延迟或失败都可能导致非预期成交、滑点或未受控的仓位暴露。cancel broadcaster 通过以下方式解决这一问题：

- **并行扇出**：把取消请求同时广播到多个独立的 HTTP 客户端实例。
- **先成功短路**：第一个成功响应即为最终结果，其他正在进行的请求会被立刻中止。
- **容错性**：当某个 HTTP 客户端出现网络、DNS 或超时问题，池中其他客户端仍可继续处理请求。
- **幂等成功处理**：对于已被取消或不存在的订单（例如返回 "orderID not found"）会被视为成功而非错误，避免不必要的错误传播。

该架构可确保单一路径故障或慢连接不会阻塞关键的取消操作，从而提升实盘交易中风险管理与仓位控制的可靠性。

### 健康监测

池中每个 HTTP 客户端维护健康指标：

- 成功取消会将客户端标记为健康。
- 失败请求会增加错误计数。
- 后台健康检查会定期验证客户端连通性。
- 状态降级的客户端仍保留在池中以维持容错。

广播器会暴露包括总取消次数、成功取消数、失败取消数、预期拒单数（已被取消的订单）和幂等成功数等指标，便于运维监控与故障排查。

#### 跟踪指标

| 指标                   | 类型    | 说明                                                                                                           |
| ---------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `total_cancels`        | `u64`   | 发起的取消操作总数（包含单次、批量与取消所有请求）。                                                           |
| `successful_cancels`   | `u64`   | 成功收到 BitMEX 确认的取消操作数量。                                                                           |
| `failed_cancels`       | `u64`   | 池中所有 HTTP 客户端均失败的取消次数（无健康客户端或全部请求失败）。                                           |
| `expected_rejects`     | `u64`   | 检测到的预期拒单模式数量（例如 post-only 拒单）。                                                             |
| `idempotent_successes` | `u64`   | 幂等成功响应次数（例如订单已取消、找不到订单、因状态无法取消等）。                                            |
| `healthy_clients`      | `usize` | 当前池中健康 HTTP 客户端数（通过近期健康检查的客户端）。                                                      |
| `total_clients`        | `usize` | 池中配置的 HTTP 客户端总数（`canceller_pool_size`）。                                                          |

这些指标可以通过 `CancelBroadcaster` 实例的 `get_metrics()` 和 `get_metrics_async()` 方法以编程方式获取。

### 配置

cancel broadcaster 通过执行客户端的配置项进行设置：

| 选项                   | 默认 | 说明                                                                                                                   |
| --------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| `canceller_pool_size` | `3`  | 广播器中 HTTP 客户端池的大小。更高的值提升容错性但也消耗更多资源。                                                    |

示例配置：

```python
from nautilus_trader.adapters.bitmex.config import BitmexExecClientConfig

exec_config = BitmexExecClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    canceller_pool_size=3,  # 默认池大小
)
```

:::tip
对于没有更高速率限制的 HFT 策略，可考虑将 `canceller_pool_size=1` 以降低速率限制消耗。
默认的池大小 3 会把每次取消请求广播到 3 个并行 HTTP 客户端，从而每次取消操作消耗 3 倍的配额。
单客户端模式仍然受益于广播器的幂等成功处理，但仅使用标准速率限制。
:::

当执行客户端连接时，广播器会自动启动；断开连接时自动停止。所有取消操作（`cancel_order`、`cancel_all_orders`、`batch_cancel_orders`）都会自动通过广播器路由，无需修改策略代码。

## 配置

### API 凭证

BitMEX 的 API 凭证可以直接在配置中提供，也可以通过环境变量传入：

- `BITMEX_API_KEY`：生产环境的 API Key。
- `BITMEX_API_SECRET`：生产环境的 API Secret。
- `BITMEX_TESTNET_API_KEY`：测试网的 API Key（当 `testnet=True` 时）。
- `BITMEX_TESTNET_API_SECRET`：测试网的 API Secret（当 `testnet=True` 时）。

生成 API Key 的步骤：

1. 登录 BitMEX 账号。
2. 前往 Account & Security → API Keys。
3. 创建一个具有合适权限的新 API Key。
4. 测试网请使用 [testnet.bitmex.com](https://testnet.bitmex.com)。

:::note
**Testnet API 端点**：

- REST API：`https://testnet.bitmex.com/api/v1`
- WebSocket：`wss://ws.testnet.bitmex.com/realtime`

当配置 `testnet=True` 时，适配器会自动将请求路由到相应的测试网端点。
:::

### 数据客户端配置选项

BitMEX 数据客户端提供以下配置项：

| 选项                             | 默认    | 说明                                                                                                                       |
| -------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `api_key`                         | `None`  | 可选的 API Key；若为 `None`，从 `BITMEX_API_KEY` 加载。                                                                     |
| `api_secret`                      | `None`  | 可选的 API Secret；若为 `None`，从 `BITMEX_API_SECRET` 加载。                                                               |
| `base_url_http`                   | `None`  | 覆盖 REST 基础 URL（默认为生产环境）。                                                                                     |
| `base_url_ws`                     | `None`  | 覆盖 WebSocket 基础 URL（默认为生产环境）。                                                                                 |
| `testnet`                         | `False` | 为 `True` 时将请求路由到 BitMEX 测试网。                                                                                   |
| `http_timeout_secs`               | `60`    | HTTP 请求的超时时间（秒）。                                                                                                 |
| `max_retries`                     | `None`  | HTTP 重试最大次数（为 `None` 时禁用重试）。                                                                                 |
| `retry_delay_initial_ms`          | `1,000` | 重试间的初始退避延迟（毫秒）。                                                                                             |
| `retry_delay_max_ms`              | `5,000` | 重试间的最大退避延迟（毫秒）。                                                                                             |
| `recv_window_ms`                  | `10,000`| 签名请求的过期窗口（毫秒）。详见 [请求鉴权](#请求鉴权与过期)。                                                             |
| `update_instruments_interval_mins`| `60`    | 合约目录刷新间隔（分钟）。                                                                                                 |
| `max_requests_per_second`         | `10`    | 适配器对 REST 调用施加的突发速率限制。                                                                                     |
| `max_requests_per_minute`         | `120`   | 适配器对 REST 调用施加的滚动分钟速率限制。                                                                                 |

### 执行客户端配置选项

| 选项                      | 默认    | 说明                                                                                                                       |
| ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `api_key`                 | `None`  | 可选的 API Key；若为 `None`，从 `BITMEX_API_KEY` 加载。                                                                     |
| `api_secret`              | `None`  | 可选的 API Secret；若为 `None`，从 `BITMEX_API_SECRET` 加载。                                                               |
| `base_url_http`           | `None`  | 覆盖 REST 基础 URL（默认为生产环境）。                                                                                     |
| `base_url_ws`             | `None`  | 覆盖 WebSocket 基础 URL（默认为生产环境）。                                                                                 |
| `testnet`                 | `False` | 为 `True` 时将订单路由到 BitMEX 测试网。                                                                                   |
| `http_timeout_secs`       | `60`    | HTTP 请求的超时时间（秒）。                                                                                                 |
| `max_retries`             | `None`  | HTTP 重试最大次数（为 `None` 时禁用重试）。                                                                                 |
| `retry_delay_initial_ms`  | `1,000` | 重试间的初始退避延迟（毫秒）。                                                                                             |
| `retry_delay_max_ms`      | `5,000` | 重试间的最大退避延迟（毫秒）。                                                                                             |
| `recv_window_ms`          | `10,000`| 签名请求的过期窗口（毫秒）。详见 [请求鉴权](#请求鉴权与过期)。                                                             |
| `max_requests_per_second` | `10`    | 适配器对 REST 调用施加的突发速率限制。                                                                                     |
| `max_requests_per_minute` | `120`   | 适配器对 REST 调用施加的滚动分钟速率限制。                                                                                 |
| `canceller_pool_size`     | `3`     | 取消广播器中冗余 HTTP 客户端的数量。详见 Cancel Broadcaster（取消请求广播器）部分。                                       |

### 配置示例

以下为一个典型的 BitMEX 实盘配置示例，包含 testnet 与 mainnet：

```python
from nautilus_trader.adapters.bitmex.config import BitmexDataClientConfig
from nautilus_trader.adapters.bitmex.config import BitmexExecClientConfig

# 使用环境变量（推荐）
testnet_data_config = BitmexDataClientConfig(
    testnet=True,  # API 凭证从 BITMEX_API_KEY 与 BITMEX_API_SECRET 加载
)

# 使用显式凭证
mainnet_data_config = BitmexDataClientConfig(
    api_key="YOUR_API_KEY",  # 或使用 os.getenv("BITMEX_API_KEY")
    api_secret="YOUR_API_SECRET",  # 或使用 os.getenv("BITMEX_API_SECRET")
    testnet=False,
)

mainnet_exec_config = BitmexExecClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    testnet=False,
)
```

## 交易注意事项

### 联动订单（Contingent orders）

BitMEX 执行适配器现在将 Nautilus 的联动订单列表映射到交易所原生的 `clOrdLinkID`/`contingencyType` 机制。当引擎提交 `ContingencyType::Oco` 或 `ContingencyType::Oto` 订单时，适配器会执行：

- 在 BitMEX 上创建/维护联动订单组，使得子止损与目标单继承父单状态。
- 传播订单列表的更新与取消，以确保联动订单在当前仓位状态下保持一致。
- 以合适的联动元数据（contingency metadata）回传执行报告，便于策略层追踪而无需额外手动接线。

这意味着常见的 bracket 流（入场 + 止损 + 止盈）与多腿止损结构可以直接交由 BitMEX 管理，而无需客户端模拟。在定义策略时继续使用 Nautilus 的 `OrderList`/`ContingencyType` 抽象——适配器会自动完成必要的 BitMEX 端联动。

### 合约规格

- **反向合约（Inverse）**：以加密货币结算（例如 XBTUSD 以 XBT 结算）。
- **线性合约（Linear）**：以稳定币结算（例如 ETHUSDT 以 USDT 结算）。
- **合约大小**：因合约而异，请仔细查阅合约规格。
- **最小变动价位（Tick size）**：不同合约的最小价格步长不同。

### 保证金要求

- 初始保证金要求随合约与市场状况变化而不同。
- 维持保证金通常低于初始保证金。
- 当维持保证金不足时会触发强平（liquidation）。
- BitMEX 支持逐仓（isolated）与全仓（cross）两种保证金模式。
- 风险限额可根据持仓规模进行调整，详见 [Exchange Rules](https://www.bitmex.com/exchange-rules)。

### 手续费

- **Maker 费用**：通常为负（即返佣），用于提供流动性。
- **Taker 费用**：作为吃单方需支付的费用。
- **资金费率**：适用于永续合约，每 8 小时结算一次。
- **预测市场费用**：Maker 0.00%，Taker 0.25%（不允许杠杆）。

:::info
如需更多功能或希望为 BitMEX 适配器贡献代码，请参阅我们的 [贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
