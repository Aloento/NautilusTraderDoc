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
输出并请求恢复。在首个快照之前就到达订单簿的 delta 同样如此——例如快重订阅之前发出的更新
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

### 高级订单特性 {#advanced-order-features}

| 特性               | 现货   | 线性   | 反向   | 期权   | 说明                                   |
| ------------------ | ----   | ------ | ------ | ------ | -------------------------------------- |
| 订单修改           | ✓      | ✓      | ✓      | ✓      | 价格与数量修改。                       |
| 括弧/OCO 订单      | -      | -      | -      | -      | 未实现；请自行提交各腿。               |
| 冰山订单           | -      | -      | -      | -      | 未实现。                               |

### 批量操作 {#batch-operations}

| 操作       | 现货   | 线性   | 反向   | 期权   | 说明                                      |
| ---------- | ----   | ------ | ------ | ------ | ----------------------------------------- |
| 批量提交   | ✓      | ✓      | ✓      | ✓      | 单次请求提交多笔订单。                    |
| 批量修改   | -      | -      | -      | -      | 未接入执行客户端。                        |
| 批量撤销   | ✓      | ✓      | ✓      | ✓      | 单次请求撤销多笔订单。                    |

批量提交与批量撤销在主网和测试网使用 trade WebSocket。demo 模式下适配器回退为逐个 HTTP
请求，因为 demo 环境没有 trade WebSocket。

Bybit 单个批量请求至多接受 10 笔现货订单、20 笔线性或反向订单，或 5 笔期权订单。线性、
反向与现货批量按订单逐笔消耗 UID 配额，而期权批量只消耗一次请求。适配器默认把现货、线性
与反向批量按 10 笔一组拆分，使单个请求不会超出标准的滚动 UID 允许量；期权批量按 5 笔一组
拆分。HTTP 批量撤销方法单次调用至多接受 20 个期权操作。

### 持仓管理 {#position-management}

| 特性             | 现货   | 线性   | 反向   | 期权   | 说明                                                        |
| ---------------- | ----   | ------ | ------ | ------ | ----------------------------------------------------------- |
| 查询持仓         | -      | ✓      | ✓      | ✓      | 实时持仓更新。                                              |
| 持仓模式         | -      | ✓      | ✓      | -      | 期权仅支持单向模式。                                        |
| 杠杆控制         | -      | ✓      | ✓      | -      | 期权不适用。                                                |
| 保证金模式       | -      | ✓      | ✓      | ✓      | `ISOLATED_MARGIN`、`REGULAR_MARGIN` 或 `PORTFOLIO_MARGIN`。  |

在执行客户端配置上设置 `margin_mode`，客户端连接时就会为账户应用一个 `BybitMarginMode`。

#### 对冲模式（BothSides） {#hedge-mode-bothsides}

Bybit 只在 USDT 线性永续上接受双边（Both Sides）模式。请先在 Bybit 配置持仓模式，然后通过
订单 `params` 传入 `position_idx`。多头一侧用 `1`，空头一侧用 `2`。单向模式用 `0` 或省略
该参数。

Bybit 在 V5 的
[切换持仓模式](https://bybit-exchange.github.io/docs/v5/position/position-mode)与
[下单](https://bybit-exchange.github.io/docs/v5/order/create-order#request-parameters)
API 文档中记录了这些取值。

`positionIdx=0`（单向 / Merged Single 模式）的订单与报告不携带场所持仓 ID。对冲模式的索引
`1` 与 `2`，适配器把报告映射到以 `-LONG` 和 `-SHORT` 结尾的场所持仓 ID。若 Bybit 执行消息
省略了 `positionIdx`，成交携带同一个 ID。

对冲模式下，`positionIdx` 标识受影响的持仓，而不是交易方向。因此 reduce-only 的卖出解析为
多头索引，reduce-only 的买入解析为空头索引。

要覆盖默认判断，通过 `params` 传入 `position_idx`：

```python
params = {"position_idx": 1}  # 0 one-way, 1 long, 2 short
```

### 风险事件 {#risk-events}

| 特性             | 现货   | 线性   | 反向   | 期权   | 说明                                                  |
| ---------------- | ----   | ------ | ------ | ------ | ----------------------------------------------------- |
| 强平处理         | -      | ✓      | ✓      | ✓      | 接管成交被标记为交易所生成。                          |
| ADL 处理         | -      | ✓      | ✓      | ✓      | 自动减仓成交被标记并记日志。                          |
| ADL 排名警告     | -      | ✓      | ✓      | ✓      | `adlRankIndicator >= 4` 时记录持仓报告。              |

Bybit 发出场所发起的成交时，`execType` 取以下值：

- `AdlTrade`：自动减仓（auto-deleveraging）执行。保险基金无法覆盖损失后，选择一个对手方
  的盈利持仓来平掉资不抵债的对手。
- `BustTrade`：强平接管。保证金耗尽后，强平引擎没收了该持仓。
- `Delivery`：USDC 期货交割。
- `Settle`：反向期货结算。
- `ForwardSplitSettle`：正向拆股的零碎股份结算。
- `ReverseSplitSettle`：反向并股的零碎股份结算。
- `Dividend`：股息分派。

场所此前对拆股与并股发出 `CorporateAction`。在被上述结算与股息类型取代之前录制的执行历史
里，适配器仍接受它。

适配器把每一笔标记为交易所生成，并记一条警告，包含执行 ID、symbol、方向、数量与价格。
成交经由普通的 `FillReport` 路径流动。由于这些订单的 `orderLinkId` 为空，执行引擎把它们
当作外部订单。它们经由工具的活动外部订单认领来分配——该认领最初用
`external_order_instrument_ids` 配置；没有认领时分配给 `EXTERNAL` 策略。

适配器无法识别的执行类型按 `UNKNOWN` 处理而不是拒绝，因此场所将来新增的类型仍能流经成交
路径，而不会被丢弃。

Funding 结算使用 `execType=Funding`，但它们是余额调整而非成交。适配器在历史成交报告与标准
私有 `execution` 消息中忽略它们，既不发出 `FillReport`，也不发出 `OrderFilled` 事件，也
不改变本地持仓数量。对账期间，funding 记录不计入所请求的成交报告限额。

Bybit 还通过 `adlRankIndicator` 字段在持仓更新上发布 ADL 排名。范围从 0（无持仓）到 5
（下一个被减仓）。只要未结持仓的排名达到 4 或更高，适配器就记一条警告，让你在场所强制
平仓之前有所反应。

上游参考：

- [V5 `execType` 取值](https://bybit-exchange.github.io/docs/v5/enum#exectype)
- [V5 `createType` 取值](https://bybit-exchange.github.io/docs/v5/enum#createtype)
- [强平机制](https://www.bybit.com/en/help-center/article/Liquidation-Process-Derivatives-Trading)
- [自动减仓（ADL）机制](https://www.bybit.com/en/help-center/article/Auto-Deleveraging-ADL-Derivatives-Trading)

### 订单查询 {#order-querying}

| 特性             | 现货   | 线性   | 反向   | 期权   | 说明                           |
| ---------------- | ----   | ------ | ------ | ------ | ------------------------------ |
| 查询未结订单     | ✓      | ✓      | ✓      | ✓      | 列出全部活动订单。             |
| 查询订单历史     | ✓      | ✓      | ✓      | ✓      | 历史订单数据。                 |
| 订单状态更新     | ✓      | ✓      | ✓      | ✓      | 实时订单状态变化。             |
| 成交历史         | ✓      | ✓      | ✓      | ✓      | 执行与成交报告。               |

### 条件关联订单 {#contingent-orders}

| 特性             | 现货   | 线性   | 反向   | 期权   | 说明                                   |
| ---------------- | ----   | ------ | ------ | ------ | -------------------------------------- |
| 订单列表         | ✓      | ✓      | ✓      | ✓      | 通过 WebSocket 作为批量提交。          |
| OCO 订单         | -      | -      | -      | -      | 未实现；请自行提交各腿。               |
| 括弧订单         | -      | -      | -      | -      | 未实现；请自行提交各腿。               |
| 条件订单         | ✓      | ✓      | ✓      | -      | 止损与触价限价订单。                   |

订单列表在任何腿发送之前作为整体校验。某条腿校验失败时，该腿以其具体原因被拒绝，其余腿以
`ORDER_LIST_DENIED` 被拒绝。因此，部分提交的列表不可能到达场所。

### 订单参数 {#order-parameters}

提交订单时可用 `params` 字典自定义单笔订单：

| 参数               | 类型             | 说明                                                               |
| ------------------ | ---------------- | ------------------------------------------------------------------ |
| `is_leverage`      | `bool`           | 仅现货。启用保证金交易（借币）。默认 `False`。                     |
| `take_profit`      | `str` 或 `float` | TP 触发价。为订单挂上原生 TP。                                     |
| `stop_loss`        | `str` 或 `float` | SL 触发价。为订单挂上原生 SL。                                     |
| `tp_trigger_by`    | `str`            | TP 触发类型：`"LastPrice"`、`"IndexPrice"` 或 `"MarkPrice"`。      |
| `sl_trigger_by`    | `str`            | SL 触发类型：`"LastPrice"`、`"IndexPrice"` 或 `"MarkPrice"`。      |
| `tp_order_type`    | `str`            | TP 执行类型：`"Market"` 或 `"Limit"`。                             |
| `sl_order_type`    | `str`            | SL 执行类型：`"Market"` 或 `"Limit"`。                             |
| `tp_limit_price`   | `str` 或 `float` | `tp_order_type` 为 `"Limit"` 时 TP 的限价。                        |
| `sl_limit_price`   | `str` 或 `float` | `sl_order_type` 为 `"Limit"` 时 SL 的限价。                        |
| `tp_trigger_price` | `str` 或 `float` | 与 `take_profit` 一同发送的显式 TP 触发价。                        |
| `sl_trigger_price` | `str` 或 `float` | 与 `stop_loss` 一同发送的显式 SL 触发价。                          |
| `tpsl_mode`        | `str`            | TP/SL 模式：`"Full"` 或 `"Partial"`。                              |
| `close_on_trigger` | `bool`           | TP/SL 触发时平掉仓位。                                             |
| `position_idx`     | `int`            | 对冲模式持仓索引。见[对冲模式](#hedge-mode-bothsides)。            |
| `bbo_side_type`    | `str`            | 线性/反向 BBO 方向：`"Queue"` 或 `"Counterparty"`。                |
| `bbo_level`        | `str` 或 `int`   | 线性/反向 BBO 簿档级别：`"1"` 到 `"5"`。                           |
| `smp_type`         | `str`            | 自成交防止。见[SMP](#self-match-prevention)。                      |

未设置的参数不会出现在请求里，因此 Bybit 自身的默认值生效。

:::warning
Bybit 的 `close_on_trigger` 参数不是风控引擎所用的通用 `close_position` 全仓位退出约定。
适配器发送订单数量，并忽略未知的 `close_position` 参数。不要基于 `close_on_trigger` 把
`BYBIT` 加进 `full_position_exit_venues`。让该场所保持不在列表内，普通的数量与名义额检查
才会生效。
:::

适配器在发出 `OrderSubmitted` 之前校验这些参数，规则被破坏时以 `VALIDATION_FAILED` 原因
拒绝订单：

- 每个 TP 覆盖字段（`tp_trigger_by`、`tp_order_type`、`tp_limit_price`、
  `tp_trigger_price`）都要求 `take_profit`，每个 SL 覆盖字段同样要求 `stop_loss`。
- `tp_order_type="Limit"` 要求 `tp_limit_price`，`tp_limit_price` 也要求
  `tp_order_type="Limit"`。`sl_order_type` 与 `sl_limit_price` 适用同样的配对规则。
- `bbo_side_type` 与 `bbo_level` 必须成对提供。
- `smp_type` 必须是 `"None"`、`"CancelMaker"`、`"CancelTaker"` 或 `"CancelBoth"`，
  匹配时不区分大小写。

设置了 `take_profit` 或 `stop_loss` 但没有 `tpsl_mode` 时，适配器发送 `Full`。设置了 TP 或
SL 价格但没有各自的 `tp_trigger_by` 或 `sl_trigger_by` 时，适配器从订单的触发类型推导触发
类型。

:::note
在 demo 中，原生 TP/SL 参数经由 HTTP 下单端点路由，只有一个例外：该端点无法携带自定义
触发价 `tp_trigger_price` 与 `sl_trigger_price`，因此适配器拒绝设置任一价格的订单。
`is_leverage` 参数仅适用于现货产品。见
[Bybit 的 isLeverage 文档](https://bybit-exchange.github.io/docs/v5/order/create-order#request-parameters)。
:::

设置了 `bbo_side_type` 与 `bbo_level` 时，Nautilus 发送 Bybit 的 `bboSideType` 与 `bboLevel`
字段，并从 API 请求中省略订单价格。BBO 订单对线性与反向的限价、止损限价、触价限价订单
可用。

#### 自成交防止 {#self-match-prevention}

自成交防止（self-match prevention，SMP）告诉 Bybit：当你的某个订单会与你自己另一个订单
成交时该怎么做。Bybit 在订单上接受四个值，下面按其规范的字面拼写展示。适配器匹配时不区分
大小写，发送时始终使用规范拼写。

| 取值          | 行为                           |
| ------------- | ------------------------------ |
| `None`        | 不做自成交防止。               |
| `CancelMaker` | 撤销挂着的 maker 订单。        |
| `CancelTaker` | 撤销进来的 taker 订单。        |
| `CancelBoth`  | 两笔订单都撤销。               |

在执行客户端配置上设置 `smp_type`，该客户端提交的每笔订单都会带上这个值：

```python
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    smp_type="CancelMaker",
)
```

通过订单 `params` 传入 `smp_type`，可为单笔订单覆盖配置的默认值：

```python
params = {"smp_type": "CancelBoth"}
```

订单的 `smp_type` 不是上述四个值之一时，适配器拒绝该订单；客户端配置带其他任何值时也会被
拒绝。配置与参数都未设置时，适配器省略 `smpType`，因此 Bybit 自身的默认值生效。Bybit 在
某些地区会强制覆盖该设置。哈萨克斯坦的衍生品账户强制启用 SMP，无法退出。土耳其、哈萨克斯坦
和格鲁吉亚的现货账户，在 `smpType` 省略、为 `None` 或非法时，Bybit 使用 `CancelMaker`。

Bybit 在 V5 的 [SMP 指南](https://bybit-exchange.github.io/docs/v5/smp)中记录了这些取值与
地区规则。

#### 示例：带原生 TP/SL 的订单 {#example-order-with-native-tpsl}

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

#### 示例：BBO 订单 {#example-bbo-order}

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

#### 示例：现货保证金交易 {#example-spot-margin-trading}

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
params 中不带 `is_leverage=True` 时，现货订单使用你的可用余额且不借入资金，即使你的
Bybit 账户开启了自动借币。
:::

使用订单参数（包括 `is_leverage`）的完整示例见
[Python 执行测试器](https://github.com/nautechsystems/nautilus_trader/blob/develop/examples/live/bybit/exec_tester.py)。

### 现货交易限制 {#spot-trading-limitations}

由于场所侧不跟踪持仓，以下限制适用于现货产品：

- `reduce_only` 订单*不支持*。
- 移动止损订单*不支持*。

### 期权交易 {#options-trading}

Bybit 上架以 USDT 或 USDC 结算的加密货币与美股标的欧式期权，标的包括 BTC、ETH、SOL、
NVDA 等。适配器使用 `CryptoOption` 工具类型与 `-OPTION` symbol 后缀。完整的 symbol 格式见
[符号体系一节](#symbology)。

#### 期权数据 {#options-data}

适配器通过 WebSocket ticker 频道支持实时期权行情：

| 数据类型                   | 说明                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| 报价（bid/ask）            | 每份期权合约的最优买卖价与数量。                                         |
| Greeks                     | Delta、gamma、vega、theta，外加 bid/ask/mark IV。Bybit 不发布 rho。      |
| 标记价                     | 每份期权合约的交易所标记价。                                             |
| 指数价                     | 标的指数价格。                                                           |
| 标的参考价                 | 每个到期日用于判定 ATM 的场所参考价。                                    |
| 未平仓合约量               | 逐合约的未平仓量。                                                       |
| 订单簿 delta               | 来自期权订单簿流的 L2 MBP 更新。                                         |

订阅逐工具的 Greeks，或用 ATM 相对的行权价过滤聚合成期权链快照。订阅模式见
[期权概念指南](./../concepts/options.md)，分步演练见
[期权数据教程](./../tutorials/options_data_bybit.md)。NautilusTrader 在本地由 Bybit 的逐合约
期权行情构建期权链视图。

期权没有 K 线（kline）数据。Bybit 不为该产品类型提供 kline 流。

#### 期权订单参数 {#options-order-parameters}

除标准订单参数外，期权订单还接受：

| 参数       | 类型             | 说明                                                           |
| ---------- | ---------------- | -------------------------------------------------------------- |
| `order_iv` | `str` 或 `float` | 按隐含波动率而非价格下单或改单。                               |
| `mmp`      | `bool`           | 为该订单启用做市商保护（Market Maker Protection）。            |

这些参数通过 `SubmitOrder` 的 `params` 传入。主网上它们经由 WebSocket trade 频道流动；demo
上经由 HTTP 下单端点路由。demo 模式不支持按 `order_iv` 改单。

#### 期权交易限制 {#options-trading-limitations}

- demo 模式不支持按隐含波动率改单（`order_iv`）及其他仅 WS-trade 可用的特性。
- 杠杆不可配置。期权买方支付权利金，卖方缴纳保证金。
- 持仓模式仅单向，不支持对冲模式。
- 不支持条件订单类型（`STOP_MARKET`、`STOP_LIMIT`、`MARKET_IF_TOUCHED`、
  `LIMIT_IF_TOUCHED`）。
- 不支持交易止损（仓位上的 TP/SL）。
- Funding 费率不适用于期权。
- 期权需要统一交易账户（Unified Trading Account，UTA）。

### 移动止损 {#trailing-stops}

适配器不会把 Nautilus 的 `TRAILING_STOP_MARKET` 订单提交给 Bybit。提交此类订单会在本地被
拒绝，原因为 `UNSUPPORTED_ORDER_TYPE`。

Bybit 把移动止损建模为净持仓的一个属性，而不是订单。因此移动止损没有场所侧客户订单 ID，
在它已经开启之前无法查询。确实需要移动止损时，请通过 Bybit 界面挂上，并在 Nautilus 之外
管理由此产生的仓位退出。

## 现货保证金借币与还款 {#spot-margin-borrowing-and-repayment}

NautilusTrader 提供自动的现货保证金借币还款功能，防止在 Bybit 平掉空头仓位之后继续累积
利息。

### 背景 {#background}

启用保证金做现货（`is_leverage=True`）时，Bybit 在你执行空头仓位时会自动借入币。然而，
平掉空头（BUY 订单成交）之后，借入的币**不会自动归还**——它们持续按小时计息，直到手动
还款。放任不管会产生可观的利息成本。

### 自动还款（推荐） {#automatic-repayment-recommended}

执行客户端可以在现货工具上的 BUY 订单完全成交后，自动归还现货保证金借币。该功能默认关闭，
设置 `auto_repay_spot_borrows=True` 才启用。

**工作方式**：

1. 现货 BUY 订单在标准 `execution` 频道上完全成交时，执行客户端尝试归还基础币借币。
1. 还款额以未还借币与该订单各次执行累计获得的基础数量中的较小者为上限。
1. 执行客户端使用 Bybit 的转换式还款（converting repay）端点来覆盖以基础币计的交易费用。
   MNT 被 Bybit 排除在转换式还款之外，对它使用不转换还款（no-convert repay），并从金额中
   扣除以 MNT 计的费用。
1. 请求失败或结果为 `FA` 状态时只记日志，不会让执行客户端崩溃。结果为 `P` 状态记为处理中，
   而非完成。
1. Bybit 处于 UTC 封禁窗口期间，执行客户端会推迟排队的还款。

**示例**：

```python
from nautilus_trader.adapters.bybit import BybitExecutionClientConfig

config = BybitExecutionClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    product_types=[BybitProductType.SPOT],
    auto_repay_spot_borrows=True,  # Opt in; default is False
)
```

### UTC 封禁窗口 {#utc-blackout-window}

Bybit 在**每个 UTC 小时的第 4 分钟到第 5 分 30 秒**之间封锁两个还款端点用于利息计算。
自动还款会把请求留在队列中，并在该小时的第 5 分 31 秒发起。

### 自动还款配置 {#auto-repayment-configuration}

| 选项                      | 类型   | 默认值  | 说明                                                                                                                     |
| ------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `auto_repay_spot_borrows` | `bool` | `False` | 为 `True` 时，BUY 订单完全成交后自动归还现货保证金借币。封禁窗口内还款会被推迟。                                          |

### 自动还款注意事项 {#auto-repayment-notes}

- 自动还款只在**现货 BUY 订单**上触发，衍生品类不会。
- 还款使用转换式还款，MNT 除外——它使用不转换还款。
- Bybit 在
  [Manual Repay](https://bybit-exchange.github.io/docs/v5/account/repay) 与
  [Manual Repay Without Asset Conversion](https://bybit-exchange.github.io/docs/v5/account/no-convert-repay)
  中记录了端点限制与结果状态。
- 除非你的 Bybit 账户启用了自动借币，开空头之前仍需手动借币。

## Funding 费率 {#funding-rates}

适配器从
[Linear Ticker](https://bybit-exchange.github.io/docs/v5/websocket/public/ticker#linear-inverse-perpetual-response)
WebSocket 流接收 funding 费率数据。Bybit 在 ticker 更新中提供 `fundingIntervalHour` 字段，
适配器用它填充 `FundingRateUpdate` 的 `interval` 字段。

适配器按 symbol 缓存最近已知的 `fundingIntervalHour`，因此省略该字段的 ticker 增量更新仍带
正确的间隔。

历史 funding 费率请求中，适配器由相邻的 funding 时间戳计算间隔。响应中最旧的一条没有更早的
时间戳可配对，因此它的间隔未设置。

## Bybit 专属数据 {#bybit-specific-data}

### 强平 {#liquidations}

适配器从 Bybit 公开的
[全量强平](https://bybit-exchange.github.io/docs/v5/websocket/public/all-liquidation)
WebSocket 流（`allLiquidation.{symbol}`）发出 `BybitLiquidation` 自定义数据。Bybit 只为线性
与反向合约发布该流，因此适配器拒绝现货与期权的订阅。Bybit 每 500ms 推送一次更新，一条更新
可能携带多笔强平，适配器为每一笔各发出一个 `BybitLiquidation`。

| 字段               | 类型           | 说明                                                           |
| ------------------ | -------------- | -------------------------------------------------------------- |
| `instrument_id`    | `InstrumentId` | 被强平持仓所属的金融工具。                                     |
| `position_side`    | `PositionSide` | 被强平持仓的方向，Bybit 的 `Buy` 对应 `LONG`。                 |
| `bankruptcy_price` | `Price`        | 被强平持仓的破产价。                                           |
| `quantity`         | `Quantity`     | 已执行的强平数量。                                             |
| `ts_event`         | `int`          | Bybit 更新该强平时刻的 UNIX 纳秒时间戳。                       |
| `ts_init`          | `int`          | 对象构建时刻的 UNIX 纳秒时间戳。                               |

`position_side` 是被强平持仓的方向，不是强平订单的方向。Bybit 对被强平的多头报 `Buy`，对
被强平的空头报 `Sell`。`bankruptcy_price` 是持仓保证金耗尽的价格，不是强平成交的价格。

Actor 或策略用 `DataType(BybitLiquidation.__name__)` 订阅，`instrument_id` 元数据键是必需的：

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
该数据流包含 Bybit 发布的强平事件。把它当作场所上报的信号，而不是经过独立审计、覆盖全所
每一次强平的事实基准。
:::

## 速率限制 {#rate-limiting}

适配器在创建鉴权时间戳或签名之前，就按精确的滚动窗口对请求排队。同一 API key 与环境下，
HTTP 客户端与 trade WebSocket 共享 UID 状态。数据与执行客户端使用同一来源与代理时也共享
IP 状态。

| 范围                          | Bybit 限制                              | 适配器行为                             |
| ----------------------------- | --------------------------------------- | -------------------------------------- |
| HTTP IP                       | 每 5 秒 600 请求                        | 按来源与代理共享                       |
| HTTP 与 trade WebSocket UID   | 因端点与产品而异                        | 按 API key 与环境共享                  |
| Trade WebSocket IP            | 每秒 3,000 请求                         | 按 WebSocket 来源与代理共享            |
| WebSocket 连接尝试            | 每域名每 5 分钟 500 次尝试              | 跨初始连接与重连共享                   |
| 期权订阅                      | 每连接 2,000 个参数                     | 在订阅状态变化之前拒绝                 |

UID 限流器涵盖文档记载的低速率账户与用户路由、50 请求的读取路由、按产品的订单路由、
cancel-all 限制，以及带权重的批量操作。HTTP 与 trade WebSocket 响应会从 `X-Bapi-Limit`
更新配置的 UID 限额，跟踪 `X-Bapi-Limit-Status`，并在剩余额度归零时遵守未来的
`X-Bapi-Limit-Reset-Timestamp`。

执行客户端的 `recv_window_ms` 同时适用于签名 REST 请求与 trade WebSocket 订单命令。排队的
WebSocket 订单在所有适用配额放行发送之后才获得时间戳与接收窗口头。重连重试会用全新头部
重建命令，并使用绑定连接的写入，因此传输层不可能重放过期订单负载。

:::warning
超出 API 速率限制时，Bybit 返回 `retCode` `10006`（"Too many visits"）。突破每 5 秒 600
请求的 IP 上限会返回 HTTP 403，并把该 IP 封禁至少 10 分钟。与之匹配的 403 会丢弃受影响
的池化 HTTP 会话，并启动共享的 10 分钟冷却。其他 403 响应不会触发冷却。
:::

:::warning
协调仅限于进程内。另一个进程或主机使用同一 API key 或公网 IP 时，可能消耗本适配器无法
提前预留的场所配额。响应头能缩小 UID 限额上的这一差距，但独立进程仍需运维层面的协调。
:::

场所明确的速率限制响应，对受影响的订单操作是终局拒绝。传输超时、服务重启与重复请求标识
仍受订单对账约束，因为它们无法证明场所是否接受了订单。

:::info
速率限制的更多细节见官方文档：<https://bybit-exchange.github.io/docs/v5/rate-limit>。
:::

## 账户类型 {#account-types}

执行客户端工厂根据配置的产品类型确定账户类型与 OMS 类型：

- **仅现货**：`CASH` 账户类型，配 `HEDGING` OMS 类型。
- **衍生品或混合产品**：`MARGIN` 账户类型（UTA——统一交易账户），配 `NETTING` OMS 类型。

这让你可以在单个统一交易账户中把现货与衍生品一起交易——对多数 Bybit 用户这就是标准账户
类型。

:::info
**统一交易账户（UTA）与现货保证金交易**

Bybit 正引导新用户转向统一交易账户，多数用户现在持有的都是 UTA。经典账户被视为遗留
类型。

UTA 账户上做现货保证金交易：

- 借币**不会自动启用**——需要显式的 API 配置
- 通过 API 使用现货保证金，下单参数必须带 `is_leverage=True`（见
  [Bybit 文档](https://bybit-exchange.github.io/docs/v5/order/create-order#request-parameters)）
- 若你的 Bybit 账户启用了自动借币/自动还款，场所会为这些保证金订单自动借入/归还资金
- 未启用自动借币时，你需要通过 Bybit 界面手动管理借币

**重要**：Nautilus 的 Bybit 适配器对现货订单默认 `is_leverage=False`，因此除非你显式启用，
它们不会使用保证金。
:::

## 费用货币逻辑 {#fee-currency-logic}

理解 Bybit 如何决定交易费用的货币，对准确的核算与持仓跟踪很重要。费用货币规则在现货与
衍生品类产品之间不同。

适配器直接采用场所 `execFee` 与 `feeCurrency` 字段中的费用金额与货币，因此下面的规则描述
的是 Bybit 报告的行为，不是本地计算。

### 现货交易费用 {#spot-trading-fees}

现货交易中，费用货币取决于订单方向，以及该费用是否为返佣（maker 订单的负费用）：

#### 常规费用（正值） {#normal-fees-positive}

- **BUY 订单**：费用以**基础货币**收取（如 BTCUSDT 收 BTC）
- **SELL 订单**：费用以**报价货币**收取（如 BTCUSDT 收 USDT）

#### Maker 返佣（负费用） {#maker-rebates-negative-fees}

maker 费用为负（返佣）时，货币逻辑**反转**：

- **带 maker 返佣的 BUY 订单**：返佣以**报价货币**支付（如 BTCUSDT 返 USDT）
- **带 maker 返佣的 SELL 订单**：返佣以**基础货币**支付（如 BTCUSDT 返 BTC）

:::note
**Taker 订单永远不会应用反转逻辑**，即使 maker 费率是负的。Taker 费用始终遵循常规的费用
货币规则。
:::

#### 示例：BTCUSDT 现货 {#example-btcusdt-spot}

- **以 taker 买入 1 BTC（0.1% 费率）**：支付 0.001 BTC 作为费用
- **以 taker 卖出 1 BTC（0.1% 费率）**：支付等值的 USDT 作为费用
- **以 maker 买入 1 BTC（-0.01% 返佣）**：收到 USDT 返佣（反转）
- **以 maker 卖出 1 BTC（-0.01% 返佣）**：收到 BTC 返佣（反转）

### 衍生品交易费用 {#derivatives-trading-fees}

所有衍生品类产品（LINEAR、INVERSE、OPTION）的费用一律以**结算货币**收取：

| 产品类型     | 结算货币                           | 费用货币     |
| ------------ | ---------------------------------- | ------------ |
| LINEAR       | USDT（通常）                       | USDT         |
| INVERSE      | 基础币（如 BTCUSD 的 BTC）         | 基础币       |
| OPTION       | USDT 或 USDC                       | 结算币       |

### 费用数据缺失 {#missing-fee-data}

Bybit 的 `execution.fast` 私有频道省略费用与执行类型字段，从该频道解析的成交报告因此携带
零费用。需要精确费用数据时，请订阅标准 `execution` 频道。

### 官方文档 {#official-documentation}

Bybit 费用结构与货币规则的完整细节，参阅：

- [Bybit WebSocket 私有执行](https://bybit-exchange.github.io/docs/v5/websocket/private/execution)
- [Bybit 现货费用货币指令](https://bybit-exchange.github.io/docs/v5/enum#spot-fee-currency-instruction)

## 配置 {#configuration}

每个客户端的产品类型必须在配置中指明。

### 数据客户端配置选项 {#data-client-configuration-options}

| 选项                               | 默认值     | 说明                                                                                                          |
| ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `product_types`                    | `[LINEAR]` | 要启用的 `BybitProductType` 值序列。                                                                          |
| `environment`                      | `MAINNET`  | Bybit 环境枚举。用 `BybitEnvironment.MAINNET`、`BybitEnvironment.DEMO` 或 `BybitEnvironment.TESTNET`。        |
| `api_key`                          | `None`     | API key；省略时从匹配的环境变量加载。                                                                         |
| `api_secret`                       | `None`     | API secret；省略时从匹配的环境变量加载。                                                                      |
| `base_url_http`                    | `None`     | REST 基础 URL 的覆盖值。                                                                                      |
| `base_url_ws_public`               | `None`     | 公开 WebSocket URL 的覆盖值。                                                                                 |
| `base_url_ws_private`              | `None`     | 私有 WebSocket URL 的覆盖值。                                                                                 |
| `proxy_url`                        | `None`     | HTTP 与 WebSocket 传输的可选代理 URL。                                                                        |
| `http_timeout_secs`                | `60`       | REST 请求超时（秒）。                                                                                         |
| `max_retries`                      | `3`        | REST 请求的最大重试次数。                                                                                     |
| `retry_delay_initial_ms`           | `1,000`    | 初始重试延迟（毫秒）。                                                                                        |
| `retry_delay_max_ms`               | `10,000`   | 最大重试延迟（毫秒）。                                                                                        |
| `heartbeat_interval_secs`          | `20`       | WebSocket 客户端心跳间隔（秒）。                                                                              |
| `recv_window_ms`                   | `5,000`    | 签名 REST 请求的接收窗口（毫秒）。                                                                            |
| `update_instruments_interval_mins` | `60`       | 工具目录刷新间隔（分钟）。                                                                                    |
| `instrument_status_poll_secs`      | `60`       | 工具与状态轮询间隔（秒）；`0` 禁用轮询。                                                                      |
| `book_snapshot_timeout_secs`       | `10`       | 初始、重连与恢复快照的等待；`0` 禁用。                                                                        |
| `transport_backend`                | `Sockudo`  | WebSocket 传输后端。                                                                                          |
| `bars_timestamp_on_close`          | `True`     | K 线按区间收盘打时间戳；`False` 按区间开盘打时间戳。                                                          |

### 执行客户端配置选项 {#execution-client-configuration-options}

| 选项                        | 默认值     | 说明                                                                                                          |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `product_types`             | `[LINEAR]` | 要启用的 `BybitProductType` 值序列。                                                                          |
| `environment`               | `MAINNET`  | Bybit 环境枚举。用 `BybitEnvironment.MAINNET`、`BybitEnvironment.DEMO` 或 `BybitEnvironment.TESTNET`。        |
| `api_key`                   | `None`     | API key；省略时从匹配的环境变量加载。                                                                         |
| `api_secret`                | `None`     | API secret；省略时从匹配的环境变量加载。                                                                      |
| `base_url_http`             | `None`     | REST 基础 URL 的覆盖值。                                                                                      |
| `base_url_ws_private`       | `None`     | 私有 WebSocket 基础 URL 的覆盖值。                                                                            |
| `base_url_ws_trade`         | `None`     | trade WebSocket 基础 URL 的覆盖值。                                                                           |
| `proxy_url`                 | `None`     | HTTP 与 WebSocket 传输的可选代理 URL。                                                                        |
| `http_timeout_secs`         | `60`       | REST 请求超时（秒）。                                                                                         |
| `max_retries`               | `3`        | REST 请求的最大重试次数。                                                                                     |
| `retry_delay_initial_ms`    | `1,000`    | 初始重试延迟（毫秒）。                                                                                        |
| `retry_delay_max_ms`        | `10,000`   | 最大重试延迟（毫秒）。                                                                                        |
| `heartbeat_interval_secs`   | `5`        | WebSocket 客户端心跳间隔（秒）。                                                                              |
| `auth_timeout_secs`         | `None`     | 可选的 WebSocket 鉴权超时（秒）。                                                                             |
| `recv_window_ms`            | `5,000`    | 签名 REST 与 trade WebSocket 请求的接收窗口（毫秒）。                                                         |
| `account_id`                | `None`     | 与该客户端关联的可选账户 ID。                                                                                 |
| `use_spot_position_reports` | `False`    | 限定请求时把现货钱包余额报告为持仓；批量报告省略现货（无法归属到交易对）。                                    |
| `auto_repay_spot_borrows`   | `False`    | BUY 订单完全成交后自动归还被跟踪的现货保证金借币。                                                            |
| `margin_mode`               | `None`     | 账户的统一保证金模式设置。                                                                                    |
| `smp_type`                  | `None`     | 在每笔订单上发送的自成交防止。见[SMP](#self-match-prevention)。                                               |
| `transport_backend`         | `Sockudo`  | WebSocket 传输后端。                                                                                          |

编译时的默认值：启用 `transport-sockudo` Cargo feature 时为 Sockudo，否则为 Tungstenite。

`BybitDataClientConfig` 与 `BybitDataClientFactory` 搭配使用，`BybitExecutionClientConfig` 与
`BybitExecutionClientFactory` 搭配使用。当前的 Python 示例展示了数据与执行客户端完整的
`LiveNode.builder(...)` 配置。

### API 凭据 {#api-credentials}

向 Bybit 客户端提供凭据有两种方式：或者把对应的 `api_key` 与 `api_secret` 值传入配置对象，
或者设置以下环境变量：

Bybit 实盘客户端可设置：

- `BYBIT_API_KEY`
- `BYBIT_API_SECRET`

Bybit demo 客户端可设置：

- `BYBIT_DEMO_API_KEY`
- `BYBIT_DEMO_API_SECRET`

Bybit 测试网客户端可设置：

- `BYBIT_TESTNET_API_KEY`
- `BYBIT_TESTNET_API_SECRET`

:::tip
推荐使用环境变量管理凭据。
:::

启动交易节点时，你会立即得到凭据是否有效、是否具有交易权限的确认。

## 参与贡献 {#contributing}

:::info
要获取更多特性或为 Bybit 适配器做贡献，请见我们的
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
