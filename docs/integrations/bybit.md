# Bybit

Bybit 成立于 2018 年，是按日交易量与加密资产及加密衍生品未平仓合约量计最大的加密货币
交易所之一。

NautilusTrader 提供 Bybit 集成，用于实时行情数据与执行。适配器以 Rust 实现，通过相同的
公开配置、工厂与数据类型暴露给 Python。

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/bybit/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/bybit/examples/)

## 概览 {#overview}

本指南假设交易者同时配置实时行情数据源与交易执行。Bybit 适配器包含多个组件，按用例不同
可以一起用，也可以单独用。

- `BybitDataClientConfig` 与 `BybitExecutionClientConfig`：实盘客户端配置。
- `BybitDataClientFactory` 与 `BybitExecutionClientFactory`：交易节点客户端工厂。
- `BybitDataClient`：行情数据源管理器，由数据客户端工厂构建。
- `BybitExecutionClient`：账户管理与交易执行网关，由执行客户端工厂构建。
- `BybitHttpClient`：底层 HTTP API 连接。
- `BybitWebSocketClient`：面向 Rust 调用方的底层 WebSocket API 连接。
- `BybitLiquidation`：线性与反向合约公开强平的自定义数据，见[强平](#liquidations)。
- `BYBIT`、`BYBIT_CLIENT_ID`、`BYBIT_VENUE`：公开标识符。
- `BybitEnvironment`、`BybitProductType`、`BybitMarginMode`、`BybitPositionIdx`、
  `BybitPositionMode`：配置与订单参数使用的公开枚举。

:::note
多数用户按下面的方式配置实盘交易节点即可，无需直接使用底层组件。
:::

## Bybit 文档 {#bybit-documentation}

请结合本 NautilusTrader 集成指南阅读
[Bybit 帮助中心](https://www.bybit.com/en/help-center)。

## 产品 {#products}

产品（product）是一组相关工具类型的统称。

:::note
产品在 Bybit v5 API 中也被称为 `category`。
:::

Bybit 支持以下产品类型：

| 产品类型                  | 支持      | 说明                                      |
| ------------------------- | --------- | ----------------------------------------- |
| 现货加密货币              | ✓         | 支持保证金的原生现货市场。                |
| 线性永续合约              | ✓         | USDT/USDC 保证金的永续互换。              |
| 线性期货合约              | ✓         | 实物交割结算的线性期货。                  |
| 反向永续合约              | ✓         | 币本位保证金的永续互换。                  |
| 反向期货合约              | ✓         | 币本位保证金的交割期货。                  |
| 期权合约                  | ✓         | 以 USDT 或 USDC 结算的欧式期权。          |

## 符号体系 {#symbology}

为区分 Bybit 上不同的产品类型，Nautilus 为 symbol 使用特定的产品类别后缀：

- `-SPOT`：现货加密货币
- `-LINEAR`：永续与期货合约
- `-INVERSE`：反向永续与反向期货合约
- `-OPTION`：期权合约

这些后缀必须拼接到 Bybit 原始 symbol 字符串之后，才能确定工具 ID 对应的具体产品类型。
例如：

- Ether/Tether 现货货币对用 `-SPOT` 标识，如 `ETHUSDT-SPOT`。
- BTCUSDT 永续期货合约用 `-LINEAR` 标识，如 `BTCUSDT-LINEAR`。
- BTCUSD 反向永续期货合约用 `-INVERSE` 标识，如 `BTCUSD-INVERSE`。
- 一只 BTC USDT 结算的卖权期权：`BTC-27MAR26-70000-P-USDT-OPTION`。
- 一只 ETH USDC 结算的买权期权：`ETH-28FEB25-2800-C-OPTION`。

Bybit 的期权 symbol 对 USDT 结算合约包含结算货币（例如
`BTC-27MAR26-70000-P-USDT`），但对 USDC 结算合约省略它（例如
`ETH-28FEB25-2800-C`）。适配器在 API 返回的任何 symbol 后追加 `-OPTION`。

## 工具加载 {#instrument-loading}

数据与执行客户端在连接时加载其配置 `product_types` 的全部工具。默认是 `LINEAR`。请把订阅
或订单需要的每个产品类型都包含进去。

## 环境 {#environments}

Bybit 提供三种交易环境。用客户端配置上的 `environment` 枚举选择合适的
环境。

| 环境        | 配置                       | 说明                                                             |
| ----------- | -------------------------- | ---------------------------------------------------------------- |
| **主网**    | `BybitEnvironment.MAINNET` | 用真实资金的生产交易。                                           |
| **Demo**    | `BybitEnvironment.DEMO`    | 在主网基础设施上用模拟资金练习交易。                             |
| **测试网**  | `BybitEnvironment.TESTNET` | 用于开发与集成测试的独立测试网络。                               |

### 主网（生产环境） {#mainnet-production}

用真实资金做实盘交易时的默认环境。

```python
from nautilus_trader.adapters.bybit import BybitEnvironment
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    environment=BybitEnvironment.MAINNET,
)
```

环境变量：`BYBIT_API_KEY`、`BYBIT_API_SECRET`

### Demo 交易 {#demo-trading}

Demo 交易在 Bybit 的主网基础设施上使用模拟资金。请在
[Bybit demo 交易页面](https://www.bybit.com/en/demo-trading)创建 demo API key。

```python
from nautilus_trader.adapters.bybit import BybitEnvironment
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_DEMO_API_KEY",
    api_secret="YOUR_DEMO_API_SECRET",
    environment=BybitEnvironment.DEMO,
)
```

环境变量：`BYBIT_DEMO_API_KEY`、`BYBIT_DEMO_API_SECRET`

:::warning
**Demo 环境的限制**：

- Demo 交易**不支持** WebSocket Trade API。NautilusTrader 在 demo 模式自动改用 HTTP REST
  API 做订单操作，包括订单列表与批量撤销——它们以独立请求发送。
- 新订单上的原生 TP/SL 与期权参数（`order_iv`、`mmp`）在 demo 中经由 HTTP 下单端点可用。
- 自定义 TP/SL 触发价 `tp_trigger_price` 与 `sl_trigger_price` 在 demo 中不支持（设置了
  它们的订单会被拒绝）。下单端点无法携带它们。
- Demo 私有流使用 `wss://stream-demo.bybit.com`，但公开行情使用 Bybit 主网的公开流
  `wss://stream.bybit.com`。

:::

### 测试网 {#testnet}

用于开发与集成测试的独立测试网络。

```python
from nautilus_trader.adapters.bybit import BybitEnvironment
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_TESTNET_API_KEY",
    api_secret="YOUR_TESTNET_API_SECRET",
    environment=BybitEnvironment.TESTNET,
)
```

环境变量：`BYBIT_TESTNET_API_KEY`、`BYBIT_TESTNET_API_SECRET`

:::note
测试网支持全部交易特性，包括 WebSocket Trade API。它与主网使用完全独立的基础设施，
因此行情数据与流动性与生产环境差异很大。
:::

设置 `environment=BybitEnvironment.TESTNET` 时，适配器自动解析 Bybit 文档中的测试网端点：

- REST API：`https://api-testnet.bybit.com`
- 公开 WebSocket：`wss://stream-testnet.bybit.com/v5/public/{spot|linear|inverse|option}`
- 私有 WebSocket：`wss://stream-testnet.bybit.com/v5/private`
- Trade WebSocket：`wss://stream-testnet.bybit.com/v5/trade`

### 测试网设置 {#testnet-setup}

设置 Bybit 测试网账户与凭据的步骤：

1. 在桌面浏览器中打开 [testnet.bybit.com](https://testnet.bybit.com)。
2. 新建一个测试网账户，或登录你已有的测试网账户。
3. 从 **Assets -> Assets Overview -> Request Test Coins** 申领测试币，让账户有余额可测。
4. 打开 [testnet.bybit.com/app/user/api-management](https://testnet.bybit.com/app/user/api-management)
   的 **API Management**。
5. 点击 **Create New Key**。
6. 按你的用例勾选所需权限。
7. 完成 2FA 提示并复制 API key 与 secret。
8. 在 shell 中导出凭据：

   ```bash
   export BYBIT_TESTNET_API_KEY="YOUR_TESTNET_API_KEY"
   export BYBIT_TESTNET_API_SECRET="YOUR_TESTNET_API_SECRET"
   ```

Bybit 当前的测试网指引还说明：

- API key 在网站上创建，不能在移动应用里创建。
- 新用户在注册后的头 48 小时内可能无法创建 API key。
- 测试网与主网是分离的，不要向测试网账户存入真实资金。
- Bybit 目前只文档化了通过桌面浏览器进行的测试网账户设置。

## 报价与订单簿 {#quotes-and-order-books}

对 SPOT、LINEAR 和 INVERSE 产品，报价订阅使用 Bybit 深度为 1 的订单簿快照。该数据源以
文档记载的 10ms 推送频率提供最优买卖价与数量。见
[Bybit 订单簿规范](https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook)。
OPTION 报价使用 ticker 流。

报价与深度 1 订单簿订阅共用同一个 WebSocket 主题。退订其中一个时，只要另一个仍订阅着，
主题就保持活跃。更深度的订单簿订阅使用自己的主题，与深度 1 报价流并存，因此增加订单簿
delta 不会改变报价来源。订单簿 delta 只来自所请求的深度。每个工具只订阅一个订单簿深度，
换选另一个深度之前先退订现有订单簿。

## 订单簿恢复 {#order-book-recovery}

### 序列校验 {#sequence-validation}

每个 delta 必须携带紧跟订单簿最后接受帧之后的更新 ID `u`。任何其他 delta 都会抑制订单簿
输出并请求恢复。在首个快照之前就到达产销簿的 delta 同样如此——例如快重订阅之前发出的更新
可能先到达新订阅。只有当既没有进行中的恢复、也没有快照死线占用该订单簿时，请求才会启动
恢复。

每个快照都替换整个订单簿，这是
[Bybit 订单簿约定](https://bybit-exchange.github.io/docs/v5/websocket/public/orderbook)
要求的。场所会在每次订阅后和服务重启后各发送一个快照——服务重启可能把 `u` 重置为 1——
而深度 1 只推送快照。替换快照携带的更新 ID 可能低于订单簿最后一个 delta，因为场所从更早
的状态服务它。之后 delta 从该快照继续。在订单簿的订阅或替换写入仍在途时到达的快照会被
丢弃。

### 快照死线 {#snapshot-deadlines}

初始与恢复订阅在订阅写入完成后，最多等待 `book_snapshot_timeout_secs`（默认 **10 秒**）
获取快照。重连 socket 上的订单簿从重连时刻起等待同样时长。快照缺失会启动或重试恢复。

把 `book_snapshot_timeout_secs` 设为 `0` 可禁用快照死线。缺口仍会启动恢复，但若某次恢复
尝试的快照始终不到，它会一直等到 180 秒重试预算耗尽。

深度 1 订单簿与报价共享主题。报价已占用该主题时，订阅订单簿什么都不发送，下一次深度 1
快照会把它同步。

### 重试上限与重连 {#retry-limits-and-reconnects}

恢复在同一连接上退订并重新订阅订单簿的主题，场所会以新快照回应。每个恢复事件在 **180 秒
内至多八次尝试**，带指数退避与抖动。之后它会一直重试直到接受一个快照。重试间隔从 1 分钟
翻倍到 15 分钟。恢复不会以失败状态结束。退订与关闭会取消它。

恢复深度 1 订单簿还会暂停共享主题上的报价，直到替换快照到达。替换订阅被场所拒绝时会记
日志，并在其快照死线过后重试该次尝试。

重连会从重放订阅的快照出发，重新同步重连的 product type 的 socket 上的每个订单簿。进行
中的恢复连同剩余预算一起保留。预算耗尽后正在间隔等待的恢复会在新连接上立即重试。

客户端无法把初始订阅排队时，会记录错误并释放该订单簿，而不是恢复它。例如订阅可能超出
期权连接的 topic 上限。已排队的初始订阅写入失败时，立即启动恢复。

共享的恢复机制与适配器职责见
[订单簿恢复归属](./../developer_guide/adapters.md#order-book-recovery-ownership)。

### 实盘恢复验证 {#live-recovery-validation}

`bybit-book-stress` 工具是订单簿同步与恢复改动用的开发工具。它连接 Bybit 主网公开行情，
不提交任何订单。它以默认深度 50 对照订单簿流约定检查六个 linear 订单簿，这些检查包括每个
快照事件内序列递增。它还与场所流前 50 档的独立重建结果做比对。

在仓库根目录运行：

```bash
CARGO_BUILD_JOBS=16 bash scripts/strip-adapter-env.bash \
  cargo test -p nautilus-bybit --features examples --test bybit-book-stress -- --timeout 10 --rounds 21
```

`--scenario` 选择运行内容：

- `churn`（默认）：先检查无重连的恢复，然后轮换更新 ID 缺口、丢弃与延迟的快照、在快照前
  切断的重连、恢复期间退订、恢复期间重启，以及 40 秒的流量冻结。
- `initial`：丢弃每个订单簿的首个快照，在全新会话中每轮一次。
- `turnover`：在恢复期间退订并重新订阅订单簿。
- `boundaries`：探测替换切断、重试耗尽进入重试上限，以及重连期间的关闭。超时非零时，还
  会拒绝一次替换与一次重放订阅。

`--timeout` 设置快照超时秒数，`0` 表示禁用快照死线。`--rounds` 设置 `churn`、`initial`
和 `turnover` 的轮数（默认 21）。`boundaries` 只跑一遍它的序列。

该工具需要主网 linear WebSocket 流与公开的 `instruments-info` REST API。共享的旗标与输出
格式见[压力测试工具](./../developer_guide/spec_data_testing.md#stress-harnesses)。

## 订单能力 {#orders-capability}

Bybit 提供触发类型的灵活组合，能覆盖更多样的 Nautilus 订单。下面列出的所有订单类型
*既可以*用作开仓*也可以*用作平仓。

### 订单类型 {#order-types}

| 订单类型               | 现货   | 线性   | 反向   | 期权   | 说明                                   |
| ---------------------- | ----   | ------ | ------ | ------ | -------------------------------------- |
| `MARKET`               | ✓      | ✓      | ✓      | ✓      | 报价数量：仅现货。                     |
| `LIMIT`                | ✓      | ✓      | ✓      | ✓      |                                        |
| `STOP_MARKET`          | ✓      | ✓      | ✓      | -      | *期权不支持*。                         |
| `STOP_LIMIT`           | ✓      | ✓      | ✓      | -      | *期权不支持*。                         |
| `MARKET_IF_TOUCHED`    | ✓      | ✓      | ✓      | -      | *期权不支持*。                         |
| `LIMIT_IF_TOUCHED`     | ✓      | ✓      | ✓      | -      | *期权不支持*。                         |
| `TRAILING_STOP_MARKET` | -      | -      | -      | -      | 见[移动止损](#trailing-stops)。        |

提交时，适配器会在本地以 `UNSUPPORTED_ORDER_TYPE` 原因拒绝不受支持的订单类型，不会把订单
发往场所。

### 执行指示 {#execution-instructions}

| 指示          | 现货   | 线性   | 反向   | 期权   | 说明                                                               |
| ------------- | ----   | ------ | ------ | ------ | ------------------------------------------------------------------ |
| `post_only`   | ✓      | ✓      | ✓      | ✓      | 仅限限价类订单；以 Bybit 的 `PostOnly` 有效期发送。                |
| `reduce_only` | -      | ✓      | ✓      | ✓      | *现货不支持*。                                                     |

### 有效期 {#time-in-force}

| 有效期        | 现货   | 线性   | 反向   | 期权   | 说明                              |
| ------------- | ----   | ------ | ------ | ------ | --------------------------------- |
| `GTC`         | ✓      | ✓      | ✓      | ✓      | 撤销前有效（Good Till Canceled）。  |
| `GTD`         | -      | -      | -      | -      | *不支持*；按 `GTC` 发送。         |
| `FOK`         | ✓      | ✓      | ✓      | ✓      | 全部成交否则撤销（Fill or Kill）。  |
| `IOC`         | ✓      | ✓      | ✓      | ✓      | 立即成交否则撤销（Immediate or Cancel）。 |

### Advanced order features

| Feature            | Spot | Linear | Inverse | Option | Notes                                  |
| ------------------ | ---- | ------ | ------- | ------ | -------------------------------------- |
| Order Modification | ✓    | ✓      | ✓       | ✓      | Price and quantity modification.       |
| Bracket/OCO Orders | -    | -      | -       | -      | Not implemented; submit legs yourself. |
| Iceberg Orders     | -    | -      | -       | -      | Not implemented.                       |

### Batch operations

| Operation    | Spot | Linear | Inverse | Option | Notes                                     |
| ------------ | ---- | ------ | ------- | ------ | ----------------------------------------- |
| Batch Submit | ✓    | ✓      | ✓       | ✓      | Submit multiple orders in single request. |
| Batch Modify | -    | -      | -       | -      | Not wired into the execution client.      |
| Batch Cancel | ✓    | ✓      | ✓       | ✓      | Cancel multiple orders in single request. |

Batch submit and batch cancel use the trade WebSocket on mainnet and testnet. In demo mode the
adapter falls back to individual HTTP requests, because the demo environment has no trade
WebSocket.

Bybit accepts at most 10 Spot orders, 20 Linear or Inverse orders, or 5 Option orders in one batch
request. Linear, Inverse, and Spot batches consume UID quota per order, while an Option batch
consumes one request. The adapter splits Spot, Linear, and Inverse batches into groups of 10 by
default so one request cannot exceed the standard rolling UID allowance. It splits Option batches
into groups of five. The HTTP batch-cancel method accepts up to 20 Option operations in one call.

### Position management

| Feature          | Spot | Linear | Inverse | Option | Notes                                                       |
| ---------------- | ---- | ------ | ------- | ------ | ----------------------------------------------------------- |
| Query positions  | -    | ✓      | ✓       | ✓      | Real-time position updates.                                 |
| Position mode    | -    | ✓      | ✓       | -      | One-Way only for Options.                                   |
| Leverage control | -    | ✓      | ✓       | -      | Not applicable for Options.                                 |
| Margin mode      | -    | ✓      | ✓       | ✓      | `ISOLATED_MARGIN`, `REGULAR_MARGIN`, or `PORTFOLIO_MARGIN`. |

Set `margin_mode` on the execution client config to apply a `BybitMarginMode` to the account when
the client connects.

#### Hedge mode (BothSides)

Bybit only accepts Both Sides mode on USDT linear perpetuals. Configure the position mode at Bybit. Then pass
`position_idx` through the order `params`. Use `1` for the long side or `2` for the short side. Use `0` or
omit the parameter for one-way mode.

Bybit documents these values in the V5 [switch position mode](https://bybit-exchange.github.io/docs/v5/position/position-mode)
and [place order](https://bybit-exchange.github.io/docs/v5/order/create-order#request-parameters)
APIs.

Orders and reports with `positionIdx=0` (one-way / Merged Single mode) carry no venue position ID. For
hedge-mode indexes `1` and `2`, the adapter maps reports to venue position IDs ending in `-LONG` and `-SHORT`.
If Bybit execution messages omit `positionIdx`, fills carry the same ID.

In hedge mode, `positionIdx` identifies the affected position, not the trade direction. Thus, a reduce-only
sell resolves to the long index. A reduce-only buy resolves to the short index.

To override, pass `position_idx` via `params`:

```python
params = {"position_idx": 1}  # 0 one-way, 1 long, 2 short
```

### Risk events

| Feature              | Spot | Linear | Inverse | Option | Notes                                                 |
| -------------------- | ---- | ------ | ------- | ------ | ----------------------------------------------------- |
| Liquidation handling | -    | ✓      | ✓       | ✓      | Takeover fills flagged as exchange-generated.         |
| ADL handling         | -    | ✓      | ✓       | ✓      | Auto-deleveraging fills flagged and logged.           |
| ADL rank warnings    | -    | ✓      | ✓       | ✓      | Position reports logged when `adlRankIndicator >= 4`. |

Bybit emits venue-initiated fills with `execType` set to:

- `AdlTrade`: Auto-deleveraging execution. An opposing profitable position was
  selected to close the undercollateralised counterparty after the insurance
  fund could not cover the loss.
- `BustTrade`: Liquidation takeover. The liquidation engine seized the
  position after margin was exhausted.
- `Delivery`: USDC futures delivery.
- `Settle`: Inverse futures settlement.
- `ForwardSplitSettle`: Forward stock split fractional share settlement.
- `ReverseSplitSettle`: Reverse stock split fractional share settlement.
- `Dividend`: Dividend distribution.

The venue previously issued `CorporateAction` for stock splits and reverse splits. The adapter
still accepts it in execution history recorded before its replacement by the settle and dividend
types above.

The adapter flags each as exchange-generated and logs a warning containing the execution ID, symbol, side,
quantity, and price. Fills flow through the normal `FillReport` path. Because these orders carry an empty
`orderLinkId`, the execution engine treats them as external. It assigns them through the instrument's active
external order claim, configured initially with `external_order_instrument_ids`. Without a claim, it assigns
them to the `EXTERNAL` strategy.

Execution types the adapter does not recognize are handled as `UNKNOWN` rather than rejected, so
future venue additions still flow through the fill path instead of being dropped.

Funding settlements use `execType=Funding`, but they are balance adjustments rather than fills. The adapter
ignores them in historical fill reports and standard private `execution` messages. Thus, it emits neither a
`FillReport` nor an `OrderFilled` event. It does not change local position quantity. During reconciliation,
funding records do not count toward the requested fill-report limit.

Bybit also publishes an ADL ranking on position updates via the
`adlRankIndicator` field. The range is 0 (flat / no position) to 5 (next to
deleverage). The adapter logs a warning whenever an open position carries a
rank of 4 or higher so you can react before the venue force-closes.

Upstream references:

- [V5 `execType` values](https://bybit-exchange.github.io/docs/v5/enum#exectype)
- [V5 `createType` values](https://bybit-exchange.github.io/docs/v5/enum#createtype)
- [Liquidation mechanism](https://www.bybit.com/en/help-center/article/Liquidation-Process-Derivatives-Trading)
- [Auto-Deleveraging mechanism](https://www.bybit.com/en/help-center/article/Auto-Deleveraging-ADL-Derivatives-Trading)

### Order querying

| Feature              | Spot | Linear | Inverse | Option | Notes                          |
| -------------------- | ---- | ------ | ------- | ------ | ------------------------------ |
| Query open orders    | ✓    | ✓      | ✓       | ✓      | List all active orders.        |
| Query order history  | ✓    | ✓      | ✓       | ✓      | Historical order data.         |
| Order status updates | ✓    | ✓      | ✓       | ✓      | Real-time order state changes. |
| Trade history        | ✓    | ✓      | ✓       | ✓      | Execution and fill reports.    |

### Contingent orders

| Feature            | Spot | Linear | Inverse | Option | Notes                                  |
| ------------------ | ---- | ------ | ------- | ------ | -------------------------------------- |
| Order lists        | ✓    | ✓      | ✓       | ✓      | Submitted as a batch via WebSocket.    |
| OCO orders         | -    | -      | -       | -      | Not implemented; submit legs yourself. |
| Bracket orders     | -    | -      | -       | -      | Not implemented; submit legs yourself. |
| Conditional orders | ✓    | ✓      | ✓       | -      | Stop and limit-if-touched orders.      |

An order list is validated as a unit before any leg is sent. When one leg fails validation, that leg is denied
with its specific reason. The remaining legs are denied with `ORDER_LIST_DENIED`. Thus, a partially submitted
list cannot reach the venue.

### Order parameters

Individual orders can be customized using the `params` dictionary when submitting orders:

| Parameter          | Type             | Description                                                         |
| ------------------ | ---------------- | ------------------------------------------------------------------- |
| `is_leverage`      | `bool`           | Spot only. Enables margin trading (borrowing). Default: `False`.    |
| `take_profit`      | `str` or `float` | TP trigger price. Attaches a native TP to the order.                |
| `stop_loss`        | `str` or `float` | SL trigger price. Attaches a native SL to the order.                |
| `tp_trigger_by`    | `str`            | TP trigger type: `"LastPrice"`, `"IndexPrice"`, or `"MarkPrice"`.   |
| `sl_trigger_by`    | `str`            | SL trigger type: `"LastPrice"`, `"IndexPrice"`, or `"MarkPrice"`.   |
| `tp_order_type`    | `str`            | TP execution type: `"Market"` or `"Limit"`.                         |
| `sl_order_type`    | `str`            | SL execution type: `"Market"` or `"Limit"`.                         |
| `tp_limit_price`   | `str` or `float` | Limit price for TP when `tp_order_type` is `"Limit"`.               |
| `sl_limit_price`   | `str` or `float` | Limit price for SL when `sl_order_type` is `"Limit"`.               |
| `tp_trigger_price` | `str` or `float` | Explicit TP trigger price sent alongside `take_profit`.             |
| `sl_trigger_price` | `str` or `float` | Explicit SL trigger price sent alongside `stop_loss`.               |
| `tpsl_mode`        | `str`            | TP/SL mode: `"Full"` or `"Partial"`.                                |
| `close_on_trigger` | `bool`           | Close the position when TP/SL triggers.                             |
| `position_idx`     | `int`            | Hedge-mode position index. See [Hedge mode](#hedge-mode-bothsides). |
| `bbo_side_type`    | `str`            | Linear/inverse BBO side: `"Queue"` or `"Counterparty"`.             |
| `bbo_level`        | `str` or `int`   | Linear/inverse BBO book level: `"1"` through `"5"`.                 |
| `smp_type`         | `str`            | Self-match prevention. See [SMP](#self-match-prevention).           |

Parameters left unset are omitted from the request, so Bybit's own defaults apply.

:::warning
Bybit's `close_on_trigger` parameter is not the generic `close_position` whole-position exit contract used by
the risk engine. The adapter sends the order quantity, and it ignores an unknown `close_position` parameter.
Do not add `BYBIT` to `full_position_exit_venues` based on `close_on_trigger`. Leave the venue unlisted so
ordinary quantity and notional checks apply.
:::

The adapter validates these params before emitting `OrderSubmitted` and denies the order with a
`VALIDATION_FAILED` reason when a rule is broken:

- Every TP override field (`tp_trigger_by`, `tp_order_type`, `tp_limit_price`, `tp_trigger_price`)
  requires `take_profit`, and every SL override field likewise requires `stop_loss`.
- `tp_order_type="Limit"` requires `tp_limit_price`, and `tp_limit_price` requires
  `tp_order_type="Limit"`. The same pairing applies to `sl_order_type` and `sl_limit_price`.
- `bbo_side_type` and `bbo_level` must be provided together.
- `smp_type` must be `"None"`, `"CancelMaker"`, `"CancelTaker"`, or `"CancelBoth"`, matched
  case-insensitively.

When `take_profit` or `stop_loss` is set without `tpsl_mode`, the adapter sends `Full`. When a TP or
SL price is set without its own `tp_trigger_by` or `sl_trigger_by`, the adapter derives the trigger
type from the order's trigger type.

:::note
On demo, native TP/SL params route through the HTTP create-order endpoint, with one exception. The endpoint
cannot carry the custom trigger prices `tp_trigger_price` and `sl_trigger_price`. Thus, the adapter denies
orders that set either price. The `is_leverage` param applies to Spot products only. See
[Bybit's isLeverage documentation](https://bybit-exchange.github.io/docs/v5/order/create-order#request-parameters).
:::

When `bbo_side_type` and `bbo_level` are set, Nautilus sends Bybit's
`bboSideType` and `bboLevel` fields and omits the order price from the API
request. BBO orders are supported for linear and inverse limit, stop-limit, and
limit-if-touched orders.

#### Self-match prevention

Self-match prevention (SMP) tells Bybit what to do when one of your orders would trade against
another of your own orders. Bybit accepts four values on an order, shown below in their canonical
wire spellings. The adapter matches them case-insensitively and always sends the canonical spelling.

| Value         | Behavior                         |
| ------------- | -------------------------------- |
| `None`        | No self-match prevention.        |
| `CancelMaker` | Cancel the resting maker order.  |
| `CancelTaker` | Cancel the incoming taker order. |
| `CancelBoth`  | Cancel both orders.              |

Set `smp_type` on the execution client config to send that value on every order the client submits:

```python
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    smp_type="CancelMaker",
)
```

Pass `smp_type` through the order `params` to override the configured default for a single order:

```python
params = {"smp_type": "CancelBoth"}
```

The adapter denies an order whose `smp_type` is not one of the four values above, and it rejects a client
config carrying any other value. With neither the config nor the param set, the adapter omits `smpType`, so
Bybit's own default applies. Bybit overrides the setting in some regions. Derivatives accounts in Kazakhstan
have SMP force-enabled and cannot opt out. For spot accounts in Turkey, Kazakhstan, and Georgia, Bybit uses
`CancelMaker` when `smpType` is omitted, `None`, or invalid.

Bybit documents the values and the regional rules in the V5
[SMP guide](https://bybit-exchange.github.io/docs/v5/smp).

#### Example: Order with native TP/SL

```python
order = strategy.order_factory.limit(
    instrument_id=InstrumentId.from_str("BTCUSDT-LINEAR.BYBIT"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("0.01"),
    price=Price.from_str("60000.0"),
    params={
        "take_profit": "65000.0",
        "stop_loss": "58000.0",
        "tp_trigger_by": "LastPrice",
        "sl_trigger_by": "LastPrice",
    },
)
strategy.submit_order(order)
```

#### Example: BBO order

```python
order = strategy.order_factory.limit(
    instrument_id=InstrumentId.from_str("BTCUSDT-LINEAR.BYBIT"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("0.01"),
    price=Price.from_str("60000.0"),
    params={"bbo_side_type": "Queue", "bbo_level": 1},
)
strategy.submit_order(order)
```

#### Example: Spot margin trading

```python
# Submit a Spot order with margin enabled
order = strategy.order_factory.market(
    instrument_id=InstrumentId.from_str("BTCUSDT-SPOT.BYBIT"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("0.1"),
    params={"is_leverage": True},  # Enable margin for this order
)
strategy.submit_order(order)
```

:::note
Without `is_leverage=True` in the params, Spot orders use your available balance
and do not borrow funds, even if you have auto-borrow enabled on your Bybit account.
:::

For a complete example of using order parameters including `is_leverage`, see the
[Python execution tester](https://github.com/nautechsystems/nautilus_trader/blob/develop/examples/live/bybit/exec_tester.py).

### Spot trading limitations

The following limitations apply to Spot products, as positions are not tracked on the venue side:

- `reduce_only` orders are *not supported*.
- Trailing stop orders are *not supported*.

### Options trading

Bybit lists European-style options on crypto and US equity underlyings, such as BTC, ETH, SOL,
and NVDA, settled in USDT or USDC.
The adapter uses the `CryptoOption` instrument type and the `-OPTION` symbol
suffix. See the [symbology section](#symbology) for the full symbol format.

#### Options data

The adapter supports real-time options market data through the WebSocket ticker
channel:

| Data type                  | Description                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| Quotes (bid/ask)           | Top-of-book prices and sizes for each option contract.                   |
| Greeks                     | Delta, gamma, vega, theta, plus bid/ask/mark IV. Bybit publishes no rho. |
| Mark price                 | Exchange mark price for each option contract.                            |
| Index price                | Underlying index price.                                                  |
| Underlying reference price | Per-expiry venue reference used for ATM determination.                   |
| Open interest              | Per-contract open interest.                                              |
| Order book deltas          | L2 MBP updates from the option orderbook stream.                         |

Subscribe to per-instrument Greeks or aggregate them into option chain
snapshots with ATM-relative strike filtering. See the
[options concept guide](./../concepts/options.md) for subscription patterns and
the [options data tutorial](./../tutorials/options_data_bybit.md) for a
step-by-step walkthrough. NautilusTrader builds the option chain view locally
from Bybit's per-contract option market data.

Bar (kline) data is not available for options. Bybit does not provide kline
streams for this product type.

#### Options order parameters

In addition to the standard order parameters, option orders accept:

| Parameter  | Type             | Description                                                      |
| ---------- | ---------------- | ---------------------------------------------------------------- |
| `order_iv` | `str` or `float` | Place or amend the order by implied volatility instead of price. |
| `mmp`      | `bool`           | Enable Market Maker Protection for the order.                    |

These parameters are passed through `params` on `SubmitOrder`. On mainnet they flow through the WebSocket
trade channel. On demo they route through the HTTP create-order endpoint. Amending an existing order by
`order_iv` is not supported in demo mode.

#### Options trading limitations

- Amending an order by implied volatility (`order_iv`) and other WS-trade-only features are not supported in demo mode.
- Leverage is not configurable. Option buyers pay premium. Sellers post margin.
- Position mode is one-way only. Hedge mode is not supported.
- Conditional order types (`STOP_MARKET`, `STOP_LIMIT`, `MARKET_IF_TOUCHED`,
  `LIMIT_IF_TOUCHED`) are not supported.
- Trading stops (TP/SL on positions) are not supported.
- Funding rates do not apply to options.
- Options require a Unified Trading Account (UTA).

### Trailing stops

The adapter does not submit Nautilus `TRAILING_STOP_MARKET` orders to Bybit. Submitting one denies
the order locally with an `UNSUPPORTED_ORDER_TYPE` reason.

Bybit models trailing stops as an attribute of a netted position rather than as an order. Thus, a trailing
stop has no venue-side client order ID. It cannot be queried until it is already open. Attach a trailing stop
through the Bybit interface if you need one, and manage the resulting position exit outside Nautilus.

## Spot margin borrowing and repayment

NautilusTrader provides automated spot margin borrow repayment functionality to prevent interest accrual after closing short positions on Bybit.

### Background

When trading Spot with margin enabled (`is_leverage=True`), Bybit automatically borrows coins when you execute short positions.
However, after you close the short position (BUY order fills), the borrowed coins are **NOT automatically repaid** - they continue accruing hourly interest charges until manually repaid.
This can result in significant interest costs if left unattended.

### Automatic repayment (recommended)

The execution client can automatically repay spot margin borrows after BUY orders fully fill
on Spot instruments. This feature is disabled by default, so set
`auto_repay_spot_borrows=True` to opt in.

**How it works**:

1. When a Spot BUY order fully fills on the standard `execution` channel, the execution client
   attempts to repay the base coin borrow.
1. The repayment is capped at the lesser of the outstanding borrow and the base quantity acquired
   across the order's executions.
1. The execution client uses Bybit's converting repay endpoint to cover base-denominated trading
   fees. For MNT, which Bybit excludes from converting repayment, it uses no-convert repay and
   subtracts MNT-denominated fees from the amount.
1. A failed request or `FA` result status is logged without crashing the execution client. A `P`
   result status is logged as processing, not complete.
1. The execution client defers queued repayments during Bybit's UTC blackout window.

**Example**:

```python
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    product_types=[BybitProductType.SPOT],
    auto_repay_spot_borrows=True,  # Opt in; default is False
)
```

### UTC blackout window

Bybit blocks both repayment endpoints from **4 minutes through 5 minutes 30 seconds past every UTC
hour** for interest calculation. Auto-repayment keeps the request queued and attempts it at 5
minutes 31 seconds past the hour.

### Auto-repayment configuration

| Option                    | Type   | Default | Description                                                                                                                |
| ------------------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `auto_repay_spot_borrows` | `bool` | `False` | If `True`, automatically repay Spot margin borrows after BUY orders fully fill. Repayment is deferred during the blackout. |

### Auto-repayment notes

- Auto-repayment only triggers on **Spot BUY orders**, not derivatives.
- Repayment uses converting repayment except for MNT, which uses no-convert repayment.
- Bybit documents the endpoint restrictions and result statuses in
  [Manual Repay](https://bybit-exchange.github.io/docs/v5/account/repay) and
  [Manual Repay Without Asset Conversion](https://bybit-exchange.github.io/docs/v5/account/no-convert-repay).
- Manual borrowing is still required before opening short positions unless auto-borrow is enabled
  on your Bybit account.

## Funding rates

The adapter receives funding rate data from the
[Linear Ticker](https://bybit-exchange.github.io/docs/v5/websocket/public/ticker#linear-inverse-perpetual-response)
WebSocket stream. Bybit provides the `fundingIntervalHour` field in ticker updates,
which the adapter uses to populate the `interval` field on `FundingRateUpdate`.

The adapter caches the last known `fundingIntervalHour` per symbol so that partial
ticker updates (which may omit the field) still carry the correct interval.

For historical funding rate requests, the adapter computes the interval from consecutive
funding timestamps. The oldest record in a response has no earlier timestamp to pair with,
so its interval is unset.

## Bybit specific data

### Liquidations

The adapter emits `BybitLiquidation` custom data from Bybit's public
[all liquidation](https://bybit-exchange.github.io/docs/v5/websocket/public/all-liquidation) WebSocket stream
(`allLiquidation.{symbol}`). Bybit publishes this stream for linear and inverse contracts only, so the adapter
rejects Spot and Option subscriptions. Bybit pushes updates every 500 ms, and one update can carry several
liquidations. The adapter emits one `BybitLiquidation` for each of them.

| Field              | Type           | Description                                                       |
| ------------------ | -------------- | ----------------------------------------------------------------- |
| `instrument_id`    | `InstrumentId` | Instrument of the liquidated position.                            |
| `position_side`    | `PositionSide` | Side of the liquidated position, `LONG` for Bybit `Buy`.          |
| `bankruptcy_price` | `Price`        | Bankruptcy price of the liquidated position.                      |
| `quantity`         | `Quantity`     | Executed liquidation size.                                        |
| `ts_event`         | `int`          | UNIX timestamp in nanoseconds when Bybit updated the liquidation. |
| `ts_init`          | `int`          | UNIX timestamp in nanoseconds when the object was built.          |

`position_side` is the side of the liquidated position, not the liquidation order. Bybit reports `Buy` for a
liquidated long position and `Sell` for a liquidated short position. `bankruptcy_price` is the price at which
the position's margin is exhausted, not the price at which the liquidation executed.

Subscribe from an actor or strategy with `DataType(BybitLiquidation.__name__)`. The
`instrument_id` metadata key is required:

```python
from nautilus_trader.adapters.bybit import BybitLiquidation
from nautilus_trader.model import ClientId
from nautilus_trader.model import CustomData
from nautilus_trader.model import DataType

self.subscribe_data(
    data_type=DataType(
        BybitLiquidation.__name__,
        metadata={"instrument_id": "BTCUSDT-LINEAR.BYBIT"},
    ),
    client_id=ClientId("BYBIT"),
)


def on_data(self, data: CustomData) -> None:
    liquidation = data.data
    if isinstance(liquidation, BybitLiquidation):
        self.log.info(
            f"{liquidation.instrument_id} {liquidation.position_side} liquidated: "
            f"{liquidation.quantity} @ {liquidation.bankruptcy_price}",
        )
```

Each emitted `CustomData` carries the `DataType` the subscription used, so events reach the
subscribing actor's `on_data`. The adapter holds one data type per instrument and rejects a
subscription to the same instrument with a different data type until the first is unsubscribed.

`BybitLiquidation` supports Arrow/Parquet catalog persistence under
`data/custom/BybitLiquidation/{identifier}`. Rust builds need the `nautilus-bybit` `arrow` feature
flag for this persistence.

:::warning
The feed contains the liquidation events Bybit publishes. Treat it as a venue-reported signal, not
as independently audited, exchange-wide ground truth of every liquidation.
:::

## Rate limiting

The adapter queues requests against exact rolling windows before it creates an authentication
timestamp or signature. HTTP clients and the trade WebSocket share UID state for the same API key
and environment. Data and execution clients also share IP state when they use the same origin and
proxy.

| Scope                         | Bybit limit                           | Adapter behavior                              |
| ----------------------------- | ------------------------------------- | --------------------------------------------- |
| HTTP IP                       | 600 requests per 5 seconds            | Shared by origin and proxy                    |
| HTTP and trade WebSocket UID  | Varies by endpoint and product        | Shared by API key and environment             |
| Trade WebSocket IP            | 3,000 requests per second             | Shared by WebSocket origin and proxy          |
| WebSocket connection attempts | 500 attempts per 5 minutes per domain | Shared across initial connects and reconnects |
| Option subscriptions          | 2,000 arguments per connection        | Rejected before subscription state changes    |

The UID limiter includes the documented lower-rate account and user routes, 50-request read
routes, product-specific order routes, cancel-all limits, and weighted batch operations. HTTP and
trade WebSocket responses update the configured UID limit from `X-Bapi-Limit`, track
`X-Bapi-Limit-Status`, and honor a future `X-Bapi-Limit-Reset-Timestamp` when the remaining count
reaches zero.

The execution client's `recv_window_ms` applies to signed REST requests and trade WebSocket order
commands. A queued WebSocket order gets its timestamp and receive-window header only after all
applicable quotas allow the send. A reconnect retry rebuilds the command with a fresh header and
uses a connection-bound write, so the transport cannot replay a stale order payload.

:::warning
Bybit returns `retCode` `10006` ("Too many visits") when the API rate limit is exceeded.
Exceeding the IP ceiling of 600 requests per 5 seconds returns HTTP 403 and bans the IP for at
least 10 minutes. A matching 403 discards the affected pooled HTTP session and starts a shared
10-minute cooldown. Other 403 responses do not activate the cooldown.
:::

:::warning
Coordination is process-local. Another process or host using the same API key or public IP can
consume venue quota that this adapter cannot reserve in advance. Response headers reduce this
gap for UID limits, but separate processes still require operational coordination.
:::

Explicit venue rate-limit responses are terminal rejections for the affected order operation.
Transport timeouts, service restarts, and duplicate request identifiers remain subject to order
reconciliation because they do not prove whether the venue accepted the order.

:::info
For more details on rate limiting, see the official documentation: <https://bybit-exchange.github.io/docs/v5/rate-limit>.
:::

## Account types

The execution client factory determines the account type and OMS type from the configured product
types:

- **Spot only**: `CASH` account type with a `HEDGING` OMS type.
- **Derivatives or mixed products**: `MARGIN` account type (UTA - Unified Trading Account) with a
  `NETTING` OMS type.

This allows you to trade Spot alongside derivatives in a single Unified Trading Account, which is the standard account type for most Bybit users.

:::info
**Unified Trading Accounts (UTA) and Spot margin trading**

Most Bybit users now have Unified Trading Accounts (UTA) as Bybit steers new users to this account type.
Classic accounts are considered legacy.

For Spot margin trading on UTA accounts:

- Borrowing is **NOT automatically enabled** - it requires explicit API configuration
- To use Spot margin via API, you must submit orders with `is_leverage=True` in the parameters (see [Bybit docs](https://bybit-exchange.github.io/docs/v5/order/create-order#request-parameters))
- If auto-borrow/auto-repay is enabled on your Bybit account, the venue will automatically borrow/repay funds for those margin orders
- Without auto-borrow enabled, you'll need to manually manage borrowing through Bybit's interface

**Important**: The Nautilus Bybit adapter defaults to `is_leverage=False` for Spot orders, so they do not use
margin unless you explicitly enable it.
:::

## Fee currency logic

Understanding how Bybit determines the currency for trading fees is important for accurate accounting and position tracking. The fee currency rules vary between Spot and derivatives products.

The adapter takes the commission amount and currency directly from the venue's `execFee` and `feeCurrency`
fields. Thus, the rules below describe Bybit's reports, not a local calculation.

### Spot trading fees

For Spot trading, the fee currency depends on the order side and whether the fee is a rebate (negative fee for maker orders):

#### Normal fees (positive)

- **BUY orders**: Fee is charged in the **base currency** (e.g., BTC for BTCUSDT)
- **SELL orders**: Fee is charged in the **quote currency** (e.g., USDT for BTCUSDT)

#### Maker rebates (negative fees)

When maker fees are negative (rebates), the currency logic is **inverted**:

- **BUY orders with maker rebate**: Rebate is paid in the **quote currency** (e.g., USDT for BTCUSDT)
- **SELL orders with maker rebate**: Rebate is paid in the **base currency** (e.g., BTC for BTCUSDT)

:::note
**Taker orders never have inverted logic**, even if the maker fee rate is negative. Taker fees always follow the normal fee currency rules.
:::

#### Example: BTCUSDT Spot

- **Buy 1 BTC as taker (0.1% fee)**: Pay 0.001 BTC in fees
- **Sell 1 BTC as taker (0.1% fee)**: Pay equivalent USDT in fees
- **Buy 1 BTC as maker (-0.01% rebate)**: Receive USDT rebate (inverted)
- **Sell 1 BTC as maker (-0.01% rebate)**: Receive BTC rebate (inverted)

### Derivatives trading fees

For all derivatives products (LINEAR, INVERSE, OPTION), fees are always charged in the **settlement currency**:

| Product Type | Settlement Currency              | Fee Currency |
| ------------ | -------------------------------- | ------------ |
| LINEAR       | USDT (typically)                 | USDT         |
| INVERSE      | Base coin (e.g., BTC for BTCUSD) | Base coin    |
| OPTION       | USDT or USDC                     | Settle coin  |

### Missing fee data

Bybit's `execution.fast` private channel omits the fee and execution type fields. Fill reports
parsed from that channel therefore carry zero commission. Subscribe to the standard `execution`
channel when exact fee data is required.

### Official documentation

For complete details on Bybit's fee structure and currency rules, refer to:

- [Bybit WebSocket Private Execution](https://bybit-exchange.github.io/docs/v5/websocket/private/execution)
- [Bybit Spot Fee Currency Instruction](https://bybit-exchange.github.io/docs/v5/enum#spot-fee-currency-instruction)

## Configuration

The product types for each client must be specified in the configurations.

### Data client configuration options

| Option                             | Default    | Description                                                                                                     |
| ---------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `product_types`                    | `[LINEAR]` | Sequence of `BybitProductType` values to enable.                                                                |
| `environment`                      | `MAINNET`  | Bybit environment enum. Use `BybitEnvironment.MAINNET`, `BybitEnvironment.DEMO`, or `BybitEnvironment.TESTNET`. |
| `api_key`                          | `None`     | API key; loaded from the matching environment variable when omitted.                                            |
| `api_secret`                       | `None`     | API secret; loaded from the matching environment variable when omitted.                                         |
| `base_url_http`                    | `None`     | Override for the REST base URL.                                                                                 |
| `base_url_ws_public`               | `None`     | Override for the public WebSocket URL.                                                                          |
| `base_url_ws_private`              | `None`     | Override for the private WebSocket URL.                                                                         |
| `proxy_url`                        | `None`     | Optional proxy URL for HTTP and WebSocket transports.                                                           |
| `http_timeout_secs`                | `60`       | Timeout (seconds) for REST requests.                                                                            |
| `max_retries`                      | `3`        | Maximum retry attempts for REST requests.                                                                       |
| `retry_delay_initial_ms`           | `1,000`    | Initial retry delay (milliseconds).                                                                             |
| `retry_delay_max_ms`               | `10,000`   | Maximum retry delay (milliseconds).                                                                             |
| `heartbeat_interval_secs`          | `20`       | Heartbeat interval (seconds) for WebSocket clients.                                                             |
| `recv_window_ms`                   | `5,000`    | Receive window (milliseconds) for signed REST requests.                                                         |
| `update_instruments_interval_mins` | `60`       | Interval (minutes) between instrument catalog refreshes.                                                        |
| `instrument_status_poll_secs`      | `60`       | Interval (seconds) between instrument and status polls; `0` disables polling.                                   |
| `book_snapshot_timeout_secs`       | `10`       | Initial, reconnect, and recovery snapshot wait; `0` disables it.                                                |
| `transport_backend`                | `Sockudo`  | WebSocket transport backend.                                                                                    |
| `bars_timestamp_on_close`          | `True`     | Timestamp bars on the interval close; `False` timestamps them on the interval open.                             |

### Execution client configuration options

| Option                      | Default    | Description                                                                                                     |
| --------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `product_types`             | `[LINEAR]` | Sequence of `BybitProductType` values to enable.                                                                |
| `environment`               | `MAINNET`  | Bybit environment enum. Use `BybitEnvironment.MAINNET`, `BybitEnvironment.DEMO`, or `BybitEnvironment.TESTNET`. |
| `api_key`                   | `None`     | API key; loaded from the matching environment variable when omitted.                                            |
| `api_secret`                | `None`     | API secret; loaded from the matching environment variable when omitted.                                         |
| `base_url_http`             | `None`     | Override for the REST base URL.                                                                                 |
| `base_url_ws_private`       | `None`     | Override for the private WebSocket base URL.                                                                    |
| `base_url_ws_trade`         | `None`     | Override for the trade WebSocket base URL.                                                                      |
| `proxy_url`                 | `None`     | Optional proxy URL for HTTP and WebSocket transports.                                                           |
| `http_timeout_secs`         | `60`       | Timeout (seconds) for REST requests.                                                                            |
| `max_retries`               | `3`        | Maximum retry attempts for REST requests.                                                                       |
| `retry_delay_initial_ms`    | `1,000`    | Initial retry delay (milliseconds).                                                                             |
| `retry_delay_max_ms`        | `10,000`   | Maximum retry delay (milliseconds).                                                                             |
| `heartbeat_interval_secs`   | `5`        | Heartbeat interval (seconds) for WebSocket clients.                                                             |
| `auth_timeout_secs`         | `None`     | Optional WebSocket authentication timeout (seconds).                                                            |
| `recv_window_ms`            | `5,000`    | Receive window (milliseconds) for signed REST and trade WebSocket requests.                                     |
| `account_id`                | `None`     | Optional account ID associated with this client.                                                                |
| `use_spot_position_reports` | `False`    | Report Spot wallet balances as positions for scoped requests; bulk reports omit Spot (no pair attribution).     |
| `auto_repay_spot_borrows`   | `False`    | Automatically repay tracked Spot margin borrows after BUY orders fully fill.                                    |
| `margin_mode`               | `None`     | Unified margin mode setting for the account.                                                                    |
| `smp_type`                  | `None`     | Self-match prevention sent on every order. See [SMP](#self-match-prevention).                                   |
| `transport_backend`         | `Sockudo`  | WebSocket transport backend.                                                                                    |

The compiled default is Sockudo when the `transport-sockudo` Cargo feature is enabled and
Tungstenite otherwise.

Use `BybitDataClientConfig` with `BybitDataClientFactory` and `BybitExecutionClientConfig` with
`BybitExecutionClientFactory`. The current Python examples show the complete
`LiveNode.builder(...)` configuration for data and execution clients.

### API credentials

There are two options for supplying your credentials to the Bybit clients.
Either pass the corresponding `api_key` and `api_secret` values to the configuration objects, or
set the following environment variables:

For Bybit live clients, you can set:

- `BYBIT_API_KEY`
- `BYBIT_API_SECRET`

For Bybit demo clients, you can set:

- `BYBIT_DEMO_API_KEY`
- `BYBIT_DEMO_API_SECRET`

For Bybit testnet clients, you can set:

- `BYBIT_TESTNET_API_KEY`
- `BYBIT_TESTNET_API_SECRET`

:::tip
We recommend using environment variables to manage your credentials.
:::

When starting the trading node, you'll receive immediate confirmation of whether your
credentials are valid and have trading permissions.

## Contributing

:::info
For additional features or to contribute to the Bybit adapter, please see our
[contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md).
:::
