# Coinbase International

[Coinbase International Exchange](https://www.coinbase.com/en/international-exchange) 为非美国的机构客户提供加密货币永续合约和现货市场的访问权限。
该交易所面向欧洲及国际交易者，提供在部分地区受限或不可用的加杠杆加密衍生品交易。

Coinbase International 在客户保护、风控框架和高性能交易技术方面达到较高标准，主要特性包括：

- 实时的 24/7/365 风控监控。
- 来自外部做市商的流动性（不进行自营交易）。
- 动态保证金与抵押品评估。
- 符合合规要求的强制平仓（liquidation）机制。
- 充足资本以应对极端市场事件（tail events）。
- 与一流的全球监管机构合作。

:::info
更多细节请参阅 Coinbase 官方博客文章：[Introducing Coinbase International Exchange](https://www.coinbase.com/en-au/blog/introducing-coinbase-international-exchange)。
:::

## 安装

:::note
无需额外安装 `coinbase_intx`；适配器的核心组件以 Rust 编写，会在构建时自动编译并链接。
:::

## 示例

可在此处找到实盘示例脚本：[examples/live/coinbase_intx](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/coinbase_intx)。
这些示例展示了如何为 Coinbase International 配置实盘行情数据源与执行客户端。

## 概览

Coinbase International 支持的产品包括：

- 永续合约（Perpetual Futures）
- 数字货币现货（Spot）

本指南假设使用者希望同时配置实时行情订阅与交易执行。Coinbase International 适配器包含多个组件，可根据使用场景单独或组合使用，这些组件负责连接 Coinbase International 的行情与执行 API：

- `CoinbaseIntxHttpClient`：REST API 连接。
- `CoinbaseIntxWebSocketClient`：WebSocket 连接。
- `CoinbaseIntxInstrumentProvider`：合约/品种解析与加载。
- `CoinbaseIntxDataClient`：行情数据客户端管理器。
- `CoinbaseIntxExecutionClient`：账户管理与交易执行网关。
- `CoinbaseIntxLiveDataClientFactory`：数据客户端工厂。
- `CoinbaseIntxLiveExecClientFactory`：执行客户端工厂。

:::note
大多数用户只需为实盘交易节点定义配置（下文会描述），不必直接操作上述所有组件。
:::

## Coinbase 文档

Coinbase International 提供了详尽的 API 文档，见 Coinbase Developer Platform：[欢迎页面](https://docs.cdp.coinbase.com/intx/docs/welcome)。建议在使用本集成指南时一并参考 Coinbase 的官方文档。

## 数据

### 合约/品种（Instruments）

在启动时，适配器会从 Coinbase International 的 REST API 自动加载所有可用的 instruments，并订阅 `INSTRUMENTS` WebSocket 频道以获取更新。这样可以确保缓存与需要最新定义用于解析的客户端始终保持同步。

可用的 instrument 类型包括：

- `CurrencyPair`（现货货币对）
- `CryptoPerpetual`

:::note
指数类产品（Index products）尚未实现。
:::

可用的数据类型包括：

- `OrderBookDelta`（L2 按价位的订单薄变更）
- `QuoteTick`（L1 顶级买卖价/盘口）
- `TradeTick`
- `Bar`
- `MarkPriceUpdate`
- `IndexPriceUpdate`

:::note
历史数据请求尚未实现。
:::

### WebSocket 行情

数据客户端会连接 Coinbase International 的 WebSocket 流以接收实时行情。WebSocket 客户端负责自动重连并在重连后重新订阅之前的活动订阅项。

## 执行（Execution）

**该适配器的设计为每个执行客户端（execution client）对应一个 Coinbase International 的组合（portfolio）。**

### 选择组合（Selecting a Portfolio）

要查看可用组合及其 ID，请使用 REST 客户端运行下列脚本：

```bash
python nautilus_trader/adapters/coinbase_intx/scripts/list_portfolios.py
```

脚本会输出类似如下的组合详情：

```bash
[{'borrow_disabled': False,
  'cross_collateral_enabled': False,
  'is_default': False,
  'is_lsp': False,
  'maker_fee_rate': '-0.00008',
  'name': 'hrp5587988499',
  'portfolio_id': '3mnk59ap-1-22',  # Your portfolio ID
  'portfolio_uuid': 'dd0958ad-0c9d-4445-a812-1870fe40d0e1',
  'pre_launch_trading_enabled': False,
  'taker_fee_rate': '0.00012',
  'trading_lock': False,
  'user_uuid': 'd4fbf7ea-9515-1068-8d60-4de91702c108'}]
```

### 配置组合（Configuring the Portfolio）

要为交易指定组合，请将环境变量 `COINBASE_INTX_PORTFOLIO_ID` 设置为所需的 `portfolio_id`。若使用多个执行客户端，也可以在每个执行客户端的配置中分别定义 `portfolio_id`。

## 订单能力（Orders capability）

Coinbase International 支持市价、限价和止损类订单，可满足多种策略需要。

### 订单类型（Order Types）

| Order Type             | Derivatives | Spot | Notes                                             |
| ---------------------- | ----------- | ---- | ------------------------------------------------- |
| `MARKET`               | ✓           | ✓    | 必须使用 `IOC` 或 `FOK` 时间策略（time-in-force） |
| `LIMIT`                | ✓           | ✓    |                                                   |
| `STOP_MARKET`          | ✓           | ✓    |                                                   |
| `STOP_LIMIT`           | ✓           | ✓    |                                                   |
| `MARKET_IF_TOUCHED`    | -           | -    | _不支持_                                          |
| `LIMIT_IF_TOUCHED`     | -           | -    | _不支持_                                          |
| `TRAILING_STOP_MARKET` | -           | -    | _不支持_                                          |

### 执行指令（Execution Instructions）

| Instruction   | Derivatives | Spot | Notes                                |
| ------------- | ----------- | ---- | ------------------------------------ |
| `post_only`   | ✓           | ✓    | 确保订单只提供流动性（maker only）。 |
| `reduce_only` | ✓           | ✓    | 确保订单仅用于减少现有头寸。         |

### 有效期（Time in force）选项

| Time in force | Derivatives | Spot | Notes                |
| ------------- | ----------- | ---- | -------------------- |
| `GTC`         | ✓           | ✓    | Good Till Canceled.  |
| `GTD`         | ✓           | ✓    | Good Till Date.      |
| `FOK`         | ✓           | ✓    | Fill or Kill.        |
| `IOC`         | ✓           | ✓    | Immediate or Cancel. |

### 高级订单特性（Advanced Order Features）

| Feature            | Derivatives | Spot | Notes                |
| ------------------ | ----------- | ---- | -------------------- |
| Order Modification | ✓           | ✓    | 支持修改价格和数量。 |
| Bracket/OCO Orders | ?           | ?    | 需进一步确认。       |
| Iceberg Orders     | ✓           | ✓    | 通过 FIX 协议可用。  |

### 批量操作（Batch operations）

| Operation    | Derivatives | Spot | Notes    |
| ------------ | ----------- | ---- | -------- |
| Batch Submit | -           | -    | _不支持_ |
| Batch Modify | -           | -    | _不支持_ |
| Batch Cancel | -           | -    | _不支持_ |

### 持仓管理（Position management）

| Feature          | Derivatives | Spot | Notes                        |
| ---------------- | ----------- | ---- | ---------------------------- |
| Query positions  | ✓           | -    | 衍生品支持实时持仓更新。     |
| Position mode    | -           | -    | 仅支持单一持仓模式。         |
| Leverage control | ✓           | -    | 支持按组合设置杠杆。         |
| Margin mode      | ✓           | -    | 仅支持全仓（cross margin）。 |

### 订单查询（Order querying）

| Feature              | Derivatives | Spot | Notes                                      |
| -------------------- | ----------- | ---- | ------------------------------------------ |
| Query open orders    | ✓           | ✓    | 列出所有活动订单。                         |
| Query order history  | ✓           | ✓    | 历史订单数据。                             |
| Order status updates | ✓           | ✓    | 通过 FIX drop copy 提供实时更新。          |
| Trade history        | ✓           | ✓    | 成交与填充报告（execution/fill reports）。 |

### 或有/条件订单（Contingent orders）

| Feature            | Derivatives | Spot | Notes                          |
| ------------------ | ----------- | ---- | ------------------------------ |
| Order lists        | -           | -    | _不支持_                       |
| OCO orders         | ?           | ?    | 需进一步确认。                 |
| Bracket orders     | ?           | ?    | 需进一步确认。                 |
| Conditional orders | ✓           | ✓    | 支持 stop 与 stop-limit 类型。 |

### FIX drop copy 集成

Coinbase International 适配器包含一个 FIX（Financial Information eXchange）[drop copy](https://docs.cdp.coinbase.com/intx/docs/fix-msg-drop-copy) 客户端，
用于直接从 Coinbase 的撮合引擎获取可靠的低延迟执行更新。

:::note
该方案是必要的，因为执行消息不会通过 WebSocket 频道下发；相比轮询 REST API，FIX drop copy 提供了更快且更可靠的订单执行更新。
:::

FIX 客户端的工作方式：

- 启动时建立安全的 TCP/TLS 连接并自动登录。
- 负责连接监控、断开重连与自动重新登录。
- 在交易节点停止时正确登出并关闭连接。

该客户端会处理多种执行消息类型：

- 订单状态报告（如取消、过期、触发等）。
- 成交回报（部分或全部成交）。

FIX 的凭证使用与 REST/WebSocket 相同的 API 凭证自动管理，除了提供有效的 API 凭证外无需额外配置。

:::note
REST 客户端在提交订单时会处理 `REJECTED` 和 `ACCEPTED` 的执行状态消息。
:::

### 账户与持仓管理（Account and position management）

在启动时，执行客户端会请求并加载当前账户及执行状态，包括：

- 各资产的可用余额。
- 活动订单。
- 当前持仓。

这能让你的交易策略在下单前掌握完整的账户信息。

## 配置

### 策略（Strategies）

:::warning
Coinbase International 对客户端订单 ID（client order IDs）有严格规范。
Nautilus 可通过使用 UUID4 值来满足该规范。
为保证合规，请在策略配置中设置 `use_uuid_client_order_ids=True`（否则提交订单会触发 API 错误）。

详情请参阅 Coinbase International 的 Create order REST 文档：[Create order](https://docs.cdp.coinbase.com/intx/reference/createorder)。
:::

### 数据客户端配置选项（Data client configuration options）

| Option              | Default         | Description                                                                            |
| ------------------- | --------------- | -------------------------------------------------------------------------------------- |
| `venue`             | `COINBASE_INTX` | 为数据客户端注册的 venue 标识。                                                        |
| `api_key`           | `None`          | API key；若未在配置中指定则从环境变量 `COINBASE_INTX_API_KEY`（或 testnet 变体）加载。 |
| `api_secret`        | `None`          | API secret；若未在配置中指定则从环境变量 `COINBASE_INTX_API_SECRET` 加载。             |
| `api_passphrase`    | `None`          | API passphrase；若未在配置中指定则从 `COINBASE_INTX_API_PASSPHRASE` 加载。             |
| `base_url_http`     | `None`          | 覆盖 REST 的基础 URL。                                                                 |
| `base_url_ws`       | `None`          | 覆盖 WebSocket 的基础 URL。                                                            |
| `http_timeout_secs` | `60`            | REST 调用的默认超时时间（秒）。                                                        |

### 执行客户端配置选项（Execution client configuration options）

| Option              | Default         | Description                                                                    |
| ------------------- | --------------- | ------------------------------------------------------------------------------ |
| `venue`             | `COINBASE_INTX` | 为执行客户端注册的 venue 标识。                                                |
| `api_key`           | `None`          | API key；若未在配置中指定则从 `COINBASE_INTX_API_KEY`（或 testnet 变体）加载。 |
| `api_secret`        | `None`          | API secret；若未在配置中指定则从 `COINBASE_INTX_API_SECRET` 加载。             |
| `api_passphrase`    | `None`          | API passphrase；若未在配置中指定则从 `COINBASE_INTX_API_PASSPHRASE` 加载。     |
| `portfolio_id`      | `None`          | 要交易的 portfolio 标识；提交订单时必填。                                      |
| `base_url_http`     | `None`          | 覆盖 REST 的基础 URL。                                                         |
| `base_url_ws`       | `None`          | 覆盖 WebSocket 的基础 URL。                                                    |
| `http_timeout_secs` | `60`            | REST 调用的默认超时时间（秒）。                                                |

示例配置：

```python
from nautilus_trader.adapters.coinbase_intx import COINBASE_INTX, CoinbaseIntxDataClientConfig, CoinbaseIntxExecClientConfig
from nautilus_trader.live.node import TradingNode

config = TradingNodeConfig(
    ...,  # Further config omitted
    data_clients={
        COINBASE_INTX: CoinbaseIntxDataClientConfig(
            instrument_provider=InstrumentProviderConfig(load_all=True),
        ),
    },
    exec_clients={
        COINBASE_INTX: CoinbaseIntxExecClientConfig(
            instrument_provider=InstrumentProviderConfig(load_all=True),
        ),
    },
)

strat_config = TOBQuoterConfig(
    use_uuid_client_order_ids=True,  # <-- Necessary for Coinbase Intx
    instrument_id=instrument_id,
    external_order_claims=[instrument_id],
    ...,  # Further config omitted
)
```

然后，创建 `TradingNode` 并添加客户端工厂：

```python
from nautilus_trader.adapters.coinbase_intx import COINBASE_INTX, CoinbaseIntxLiveDataClientFactory, CoinbaseIntxLiveExecClientFactory
from nautilus_trader.live.node import TradingNode

# 使用配置实例化实盘交易节点
node = TradingNode(config=config)

# 向节点注册客户端工厂
node.add_data_client_factory(COINBASE_INTX, CoinbaseIntxLiveDataClientFactory)
node.add_exec_client_factory(COINBASE_INTX, CoinbaseIntxLiveExecClientFactory)

# 最后构建节点
node.build()
```

### API 凭证（API Credentials）

可通过下述方式之一向客户端提供凭证：

在配置中直接传入以下选项的值：

- `api_key`
- `api_secret`
- `api_passphrase`
- `portfolio_id`

或者，通过环境变量设置：

- `COINBASE_INTX_API_KEY`
- `COINBASE_INTX_API_SECRET`
- `COINBASE_INTX_API_PASSPHRASE`
- `COINBASE_INTX_PORTFOLIO_ID`

:::tip
建议使用环境变量来管理凭证。
:::

启动交易节点时，系统会立即确认凭证是否有效并具有交易权限。

## 实现说明（Implementation notes）

- **心跳（Heartbeats）**：适配器在 WebSocket 与 FIX 连接上维护心跳以保证连通性。
- **速率限制（Rate Limits）**：REST 客户端默认限速为每秒 100 次请求，与 Coinbase International 的限额保持一致。有关详情见官方文档：[rate limits](https://docs.cdp.coinbase.com/intx/docs/rate-limits)。

:::warning
当请求速率超过 100 次/秒时，Coinbase International 会返回 HTTP 429 并可能在数秒内对该 API key 实施限流，请避免短时间内突发大量请求。
:::

- **优雅停机（Graceful Shutdown）**：适配器能在停机时处理未完成的消息并再安全断开连接。
- **线程安全（Thread Safety）**：适配器组件为线程安全，可在多个线程中并行使用。
- **执行模型（Execution Model）**：每个执行客户端可配置一个 Coinbase International 的 portfolio；如需交易多个组合，可创建多个执行客户端。
