# Binance

Binance 成立于 2017 年，按日交易量和加密资产/衍生品的未平仓合约 (open interest) 计算，是规模最大的加密货币交易所之一。

本集成支持实时行情（market data）接入与下单执行，覆盖以下产品：

- **Binance Spot**（包含 Binance US）
- **Binance USDT 计价期货**（包含永续合约和交割合约）
- **Binance 币本位期货（Coin-Margined Futures）**

## 示例

实时接入示例脚本位于仓库： [examples/live/binance](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/binance/)。

## 概述

本指南假设你正在同时配置实时行情订阅与交易执行。Binance 适配器包含若干组件，可按需组合使用：

- `BinanceHttpClient`：底层 HTTP API 连接。
- `BinanceWebSocketClient`：底层 WebSocket 连接。
- `BinanceInstrumentProvider`：合约/交易对解析与加载功能。
- `BinanceSpotDataClient` / `BinanceFuturesDataClient`：行情数据管理。
- `BinanceSpotExecutionClient` / `BinanceFuturesExecutionClient`：账户管理与交易执行网关。
- `BinanceLiveDataClientFactory`：用于 TradingNode 的数据客户端工厂。
- `BinanceLiveExecClientFactory`：用于 TradingNode 的执行客户端工厂。

:::note
大多数用户只需为实时 TradingNode 定义配置（如下所示），通常无需直接操作这些底层组件。
:::

### 产品支持范围

| Product Type                            | Supported | 说明                 |
| --------------------------------------- | --------- | -------------------- |
| Spot Markets (incl. Binance US)         | ✓         |                      |
| Margin Accounts (Cross & Isolated)      | -         | 保证金交易尚未实现。 |
| USDT-Margined Futures (PERP & Delivery) | ✓         |                      |
| Coin-Margined Futures                   | ✓         |                      |

:::note
目前尚未实现保证金交易（cross & isolated）。欢迎通过提交 [GitHub issue #2631](https://github.com/nautechsystems/nautilus_trader/issues/#2631) 或 pull request 来贡献此功能。
:::

## 数据类型

该集成提供若干自定义数据类型以满足交易者的需求：

- `BinanceTicker`：用于 24 小时 ticker 订阅，包含价格与统计信息。
- `BinanceBar`：用于历史或实时 bar（K 线）订阅，包含扩展的成交量指标。
- `BinanceFuturesMarkPriceUpdate`：期货的 mark price（标记价格）更新。

完整定义见 Binance 的 [API Reference](../api_reference/adapters/binance.md)。

## 符号（Symbology）

根据 Nautilus 的符号统一策略，优先使用 Binance 的原生符号（包括现货与期货）。由于 NautilusTrader 支持跨场所与多账户交易，需要明确区分同名但语义不同的合约，例如 `BTCUSDT` 既可表示现货/保证金交易对，也可表示永续期货合约（在 Binance 中这两个都使用相同的原生符号）。

因此，Nautilus 会在所有永续合约符号后加上后缀 `-PERP`。例如在 Nautilus 系统中，Binance 的 `BTCUSDT` 永续合约会被表示为 `BTCUSDT-PERP`。

## 订单能力（Order capability）

下面的表格列出了在不同 Binance 账户类型下支持的订单类型、执行指令与有效时间（time-in-force）选项：

### 订单类型（Order types）

| Order Type             | Spot | Margin | USDT Futures | Coin Futures | 备注                               |
| ---------------------- | ---- | ------ | ------------ | ------------ | ---------------------------------- |
| `MARKET`               | ✓    | ✓      | ✓            | ✓            | Quote 数量下单仅支持 Spot/Margin。 |
| `LIMIT`                | ✓    | ✓      | ✓            | ✓            |                                    |
| `STOP_MARKET`          | -    | ✓      | ✓            | ✓            | Spot 不支持。                      |
| `STOP_LIMIT`           | ✓    | ✓      | ✓            | ✓            |                                    |
| `MARKET_IF_TOUCHED`    | -    | -      | ✓            | ✓            | 仅适用于期货。                     |
| `LIMIT_IF_TOUCHED`     | ✓    | ✓      | ✓            | ✓            |                                    |
| `TRAILING_STOP_MARKET` | -    | -      | ✓            | ✓            | 仅适用于期货。                     |

### 执行指令（Execution instructions）

| Instruction   | Spot | Margin | USDT Futures | Coin Futures | 备注                                |
| ------------- | ---- | ------ | ------------ | ------------ | ----------------------------------- |
| `post_only`   | ✓    | ✓      | ✓            | ✓            | 见下文限制。                        |
| `reduce_only` | -    | -      | ✓            | ✓            | 仅期货支持；在 Hedge 模式下不可用。 |

#### Post-only 限制

只有 LIMIT 类订单支持 `post_only`：

| Order Type   | Spot | Margin | USDT Futures | Coin Futures | 备注                                                 |
| ------------ | ---- | ------ | ------------ | ------------ | ---------------------------------------------------- |
| `LIMIT`      | ✓    | ✓      | ✓            | ✓            | Spot/Margin 使用 `LIMIT_MAKER`，期货使用 `GTX` TIF。 |
| `STOP_LIMIT` | -    | -      | ✓            | ✓            | Spot/Margin 不支持。                                 |

### 有效时间（Time in force）

| Time in force | Spot | Margin | USDT Futures | Coin Futures | 说明                                            |
| ------------- | ---- | ------ | ------------ | ------------ | ----------------------------------------------- |
| `GTC`         | ✓    | ✓      | ✓            | ✓            | Good Till Canceled（直到手动取消）。            |
| `GTD`         | ✓\*  | ✓\*    | ✓            | ✓            | \*对 Spot/Margin 会转换为 GTC 并给出警告。      |
| `FOK`         | ✓    | ✓      | ✓            | ✓            | Fill or Kill（全部成交或立即取消）。            |
| `IOC`         | ✓    | ✓      | ✓            | ✓            | Immediate or Cancel（立即部分成交并取消剩余）。 |

### 高级订单功能（Advanced order features）

| Feature            | Spot | Margin | USDT Futures | Coin Futures | 说明                                       |
| ------------------ | ---- | ------ | ------------ | ------------ | ------------------------------------------ |
| Order Modification | ✓    | ✓      | ✓            | ✓            | 仅限对 LIMIT 订单修改价格与数量。          |
| Bracket/OCO Orders | ✓    | ✓      | ✓            | ✓            | 止损/止盈的 OCO（One-Cancels-Other）组合。 |
| Iceberg Orders     | ✓    | ✓      | ✓            | ✓            | 大订单分拆为若干可见部分（Iceberg）。      |

### 批量操作（Batch operations）

| Operation    | Spot | Margin | USDT Futures | Coin Futures | 说明                                 |
| ------------ | ---- | ------ | ------------ | ------------ | ------------------------------------ |
| Batch Submit | ✓    | ✓      | ✓            | ✓            | 在单次请求中提交多笔订单。           |
| Batch Modify | -    | -      | ✓            | ✓            | 在单次请求中修改多笔订单（仅期货）。 |
| Batch Cancel | ✓    | ✓      | ✓            | ✓            | 在单次请求中取消多笔订单。           |

### 持仓管理（Position management）

| Feature          | Spot | Margin | USDT Futures | Coin Futures | 说明                                    |
| ---------------- | ---- | ------ | ------------ | ------------ | --------------------------------------- |
| Query positions  | -    | ✓      | ✓            | ✓            | 实时持仓更新。                          |
| Position mode    | -    | -      | ✓            | ✓            | 单向（One-Way）或对冲（Hedge）模式。    |
| Leverage control | -    | ✓      | ✓            | ✓            | 每个合约支持动态调整杠杆。              |
| Margin mode      | -    | ✓      | ✓            | ✓            | 每合约的 Cross vs Isolated 保证金模式。 |

### 订单查询（Order querying）

| Feature              | Spot | Margin | USDT Futures | Coin Futures | 说明               |
| -------------------- | ---- | ------ | ------------ | ------------ | ------------------ |
| Query open orders    | ✓    | ✓      | ✓            | ✓            | 列出所有未结订单。 |
| Query order history  | ✓    | ✓      | ✓            | ✓            | 历史订单数据。     |
| Order status updates | ✓    | ✓      | ✓            | ✓            | 实时订单状态变更。 |
| Trade history        | ✓    | ✓      | ✓            | ✓            | 成交与填单的报表。 |

### 或有订单（Contingent orders）

| Feature            | Spot | Margin | USDT Futures | Coin Futures | 说明                                    |
| ------------------ | ---- | ------ | ------------ | ------------ | --------------------------------------- |
| Order lists        | -    | -      | -            | -            | _不支持_                                |
| OCO orders         | ✓    | ✓      | ✓            | ✓            | 止损/止盈的 OCO 组合。                  |
| Bracket orders     | ✓    | ✓      | ✓            | ✓            | 止损 + 止盈 的组合单。                  |
| Conditional orders | ✓    | ✓      | ✓            | ✓            | 条件触发、和 market-if-touched 等类型。 |

### 订单参数（Order parameters）

在调用 `Strategy.submit_order` 时，可以通过 `params` 字典为单笔订单添加自定义参数。当前 Binance 执行客户端支持：

| Parameter     | Type  | Account types     | Description                                                                                                                                                                                                     |
| ------------- | ----- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `price_match` | `str` | USDT/COIN Futures | 将价格选择权委托给交易所的 `priceMatch` 模式（见下表）。当提供该参数时，Nautilus 在 API 调用中不会传 limit price，而由 Binance 计算实际工作价格。该参数不能与 `post_only` 或 iceberg（`display_qty`）同时使用。 |

Binance 期货支持的 `priceMatch` 值：

| Value         | Behaviour                                                    |
| ------------- | ------------------------------------------------------------ |
| `OPPONENT`    | 抢对手方最优价（join the best price on the opposing side）。 |
| `OPPONENT_5`  | 抢对手方价格，但允许最多 5 tick 的偏移。                     |
| `OPPONENT_10` | 抢对手方价格，但允许最多 10 tick 的偏移。                    |
| `OPPONENT_20` | 抢对手方价格，但允许最多 20 tick 的偏移。                    |
| `QUEUE`       | 按同一方向队列加入（保持 maker 身份）。                      |
| `QUEUE_5`     | 在同向队列中加入，但允许最多 5 tick 的偏移。                 |
| `QUEUE_10`    | 在同向队列中加入，但允许最多 10 tick 的偏移。                |
| `QUEUE_20`    | 在同向队列中加入，但允许最多 20 tick 的偏移。                |

:::info
更多细节请参阅官方文档： [Derivatives REST API](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api)。
:::

#### 示例：期货最优价（BBO）限价单

```python
order = strategy.order_factory.limit(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(1),
    price=Price.from_str("65000"),  # 本地保留用于风控校验
)

strategy.submit_order(
    order,
    params={"price_match": "QUEUE"},
)
```

:::note
`price_match` 不能与 `price` 一并发送到 Binance API。Nautilus 会在本地保留 limit price 以做验证，但发送到交易所的将仅包含 price match 模式参数。
:::

### 跟踪止损（Trailing stops）

Binance 使用 activation price（激活价）来处理 trailing stop，详见其官方说明： [什么是 trailing stop order](https://www.binance.com/en/support/faq/what-is-a-trailing-stop-order-360042299292)。
这与一些交易平台的用法有所不同：在 Binance 上，为了使 trailing stop 生效，应使用 `activation_price` 参数来设置激活价。

注意：activation price 并非触发价（trigger/STOP price）。Binance 会基于当前市场价与 `trailing_offset` 的回调率计算触发价；而 activation price 用来指示订单何时开始根据回调率进行跟踪。

:::warning
对于 Binance 的 trailing stop，请务必使用 `activation_price` 而非 `trigger_price`，否则订单会被拒绝。
:::

从策略提交 trailing stop 时，你有两种选择：

1. 显式提供 `activation_price` 来手动设置激活价；
2. 将 `activation_price` 设为 `None`，立即启用跟踪机制（从当前市场价开始计算）。

同时你至少需要满足以下任一条件：

- 订单设置了 `activation_price`。 -（或）你已订阅该合约的 quotes，用于推断激活价。 -（或）你已订阅该合约的 trades，用于推断激活价。

## 订单簿（Order books）

订单簿可根据订阅设置维持全深度或部分深度。Spot 与 Futures 的 WebSocket 更新节流策略不同，Nautilus 会采用可用的最高流速：

- **Spot**：100ms
- **Futures**：0ms（不节流 / unthrottled）

每个交易实例对每个合约只维护一个订单簿；由于流订阅可能变化，Binance 数据客户端会使用最新的订单簿数据订阅（delta 或 snapshot）。

在以下情况会触发订单簿快照（snapshot）重建：

- 初次订阅订单簿数据时。
- 数据 websocket 重连时。

事件序列大致如下：

- 开始对 deltas 进行缓存。
- 请求 snapshot 并等待响应。
- 将 snapshot 响应解析为 `OrderBookDeltas`。
- 将 snapshot 的 deltas 发送到 `DataEngine`。
- 遍历缓存的 deltas，丢弃那些序列号不大于 snapshot 中最后一条 delta 的条目。
- 停止缓存 deltas。
- 将剩余的 deltas 发送到 `DataEngine`。

## Binance 数据差异（Binance data differences）

`QuoteTick` 对象的 `ts_event` 字段在 Spot 与 Futures 间有所不同：Spot 常常不提供事件时间戳，因此会使用 `ts_init`（即 `ts_event` 与 `ts_init` 相同）。

## Binance 特定数据（Binance specific data）

适配器会随时间支持更多 Binance 特定的数据流，用户可以按需订阅这些自定义流。

:::note
Bars（K 线）并不被视为“Binance 特定”数据，可以像常规数据一样订阅。随着更多适配器功能完善，例如标记价（mark price）和资金费率（funding rate）更新，这类流可能会成为一等公民（first-class），无需通过通用/自定义订阅。
:::

### `BinanceFuturesMarkPriceUpdate`

可通过在 actor 或 strategy 中订阅以下数据类型来接收 `BinanceFuturesMarkPriceUpdate`（包含 funding rate 信息）：

```python
from nautilus_trader.adapters.binance import BinanceFuturesMarkPriceUpdate
from nautilus_trader.model import DataType
from nautilus_trader.model import ClientId

# 在你的 `on_start` 方法中
self.subscribe_data(
    data_type=DataType(BinanceFuturesMarkPriceUpdate, metadata={"instrument_id": self.instrument.id}),
    client_id=ClientId("BINANCE"),
)
```

订阅后，这些 `BinanceFuturesMarkPriceUpdate` 对象会被传递到你的 `on_data` 方法。由于 `on_data` 会处理多种自定义/通用数据，你需要先检查数据类型：

```python
from nautilus_trader.core import Data

def on_data(self, data: Data):
    # 先判断数据类型
    if isinstance(data, BinanceFuturesMarkPriceUpdate):
        # 处理该数据
```

## 速率限制（Rate limiting）

Binance 使用基于固定时间窗口的权重限流（例如每分钟在 :00 秒重置）。适配器通过令牌桶（token bucket）限流器近似这一行为，降低超额请求的风险，同时在正常交易场景下保持高吞吐。

| Key / Endpoint       | Limit (weight/min)              | 说明                                   |
| -------------------- | ------------------------------- | -------------------------------------- |
| `binance:global`     | Spot: 6,000<br />Futures: 2,400 | 默认的请求桶，适用于所有请求。         |
| `/api/v3/order`      | 3,000                           | Spot 下单接口。                        |
| `/api/v3/allOrders`  | 150                             | Spot all-orders 接口（权重乘数 20×）。 |
| `/api/v3/klines`     | 600                             | Spot 历史 K 线。                       |
| `/fapi/v1/order`     | 1,200                           | 期货下单接口。                         |
| `/fapi/v1/allOrders` | 60                              | 期货历史订单（权重乘数 20×）。         |
| `/fapi/v1/klines`    | 600                             | 期货历史 K 线。                        |

Binance 会动态分配请求权重（例如 `/klines` 根据 `limit` 缩放）。上表为静态近似值，客户端仍会为每次调用消耗令牌，因此在拉取超长历史时可能需要手动限速以遵守返回的 `X-MBX-USED-WEIGHT-*` 头信息。

:::warning
当超过允许的权重时，Binance 会返回 HTTP 429，连续的突发可能导致临时 IP 封禁，请在批量请求间留有余量。
:::

:::info
有关限流的更多细节，请参见官方文档： [Limits](https://binance-docs.github.io/apidocs/futures/en/#limits)。
:::

## 配置

### 数据客户端（Data client）配置选项

| Option                             | Default   | Description                                                          |
| ---------------------------------- | --------- | -------------------------------------------------------------------- |
| `venue`                            | `BINANCE` | 注册客户端时使用的场所标识。                                         |
| `api_key`                          | `None`    | Binance API key；未指定时从环境变量加载。                            |
| `api_secret`                       | `None`    | Binance API secret；未指定时从环境变量加载。                         |
| `key_type`                         | `HMAC`    | 密钥类型（`HMAC`、`RSA` 或 `ED25519`）。                             |
| `account_type`                     | `SPOT`    | 数据端点使用的账户类型（spot、margin、usdt_futures、coin_futures）。 |
| `base_url_http`                    | `None`    | 覆盖默认 HTTP REST 基址。                                            |
| `base_url_ws`                      | `None`    | 覆盖默认 WebSocket 基址。                                            |
| `us`                               | `False`   | 若为 `True` 则使用 Binance US 的端点。                               |
| `testnet`                          | `False`   | 若为 `True` 则使用 Binance testnet。                                 |
| `update_instruments_interval_mins` | `60`      | 刷新合约目录的间隔（分钟）。                                         |
| `use_agg_trade_ticks`              | `False`   | 若为 `True` 则订阅聚合成交（agg trade ticks）而非原始 trades。       |

### 执行客户端（Execution client）配置选项

| Option                                  | Default   | Description                                                              |
| --------------------------------------- | --------- | ------------------------------------------------------------------------ |
| `venue`                                 | `BINANCE` | 注册客户端时使用的场所标识。                                             |
| `api_key`                               | `None`    | Binance API key；未指定时从环境变量加载。                                |
| `api_secret`                            | `None`    | Binance API secret；未指定时从环境变量加载。                             |
| `key_type`                              | `HMAC`    | 密钥类型（`HMAC`、`RSA` 或 `ED25519`）。                                 |
| `account_type`                          | `SPOT`    | 下单使用的账户类型（spot、margin、usdt_futures、coin_futures）。         |
| `base_url_http`                         | `None`    | 覆盖默认 HTTP REST 基址。                                                |
| `base_url_ws`                           | `None`    | � 覆盖默认 WebSocket 基址。                                              |
| `us`                                    | `False`   | 若为 `True` 则使用 Binance US 的端点。                                   |
| `testnet`                               | `False`   | 若为 `True` 则使用 Binance testnet。                                     |
| `use_gtd`                               | `True`    | 若为 `False`，则将 GTD 订单重映射为本地的 GTC。                          |
| `use_reduce_only`                       | `True`    | 若为 `True`，则向 Binance 透传 `reduce_only` 指令。                      |
| `use_position_ids`                      | `True`    | 启用 Binance 的对冲（hedging）position id；设为 `False` 则使用虚拟对冲。 |
| `use_trade_lite`                        | `False`   | 使用包含派生手续费信息的 TRADE_LITE 执行事件。                           |
| `treat_expired_as_canceled`             | `False`   | 若为 `True`，则将 `EXPIRED` 类型视为 `CANCELED`。                        |
| `recv_window_ms`                        | `5,000`   | 签名 REST 请求的接收窗口（毫秒）。                                       |
| `max_retries`                           | `None`    | 下单/取消/修改调用的最大重试次数。                                       |
| `retry_delay_initial_ms`                | `None`    | 重试间的初始延迟（毫秒）。                                               |
| `retry_delay_max_ms`                    | `None`    | 重试间的最大延迟（毫秒）。                                               |
| `futures_leverages`                     | `None`    | 映射 `BinanceSymbol` 到期货账户初始杠杆。                                |
| `futures_margin_types`                  | `None`    | 映射 `BinanceSymbol` 到期货保证金类型（isolated/cross）。                |
| `listen_key_ping_max_failures`          | `3`       | listen key 连续 ping 失败允许的次数，超过触发恢复。                      |
| `log_rejected_due_post_only_as_warning` | `True`    | 若为 `True`，则将 post-only 被拒记录为警告，否则作为错误记录。           |

最常见的用例是为实时 `TradingNode` 增加 Binance 的数据与执行客户端。为此请在你的客户端配置中添加 `BINANCE` 段：

```python
from nautilus_trader.adapters.binance import BINANCE
from nautilus_trader.live.node import TradingNode

config = TradingNodeConfig(
    ...,  # 省略其余配置
    data_clients={
        BINANCE: {
            "api_key": "YOUR_BINANCE_API_KEY",
            "api_secret": "YOUR_BINANCE_API_SECRET",
            "account_type": "spot",  # {spot, margin, usdt_future, coin_future}
            "base_url_http": None,  # 覆盖默认端点
            "base_url_ws": None,  # 覆盖默认端点
            "us": False,  # 若为 Binance US
        },
    },
    exec_clients={
        BINANCE: {
            "api_key": "YOUR_BINANCE_API_KEY",
            "api_secret": "YOUR_BINANCE_API_SECRET",
            "account_type": "spot",  # {spot, margin, usdt_future, coin_future}
            "base_url_http": None,
            "base_url_ws": None,
            "us": False,
        },
    },
)
```

然后创建 `TradingNode` 并注册客户端工厂：

```python
from nautilus_trader.adapters.binance import BINANCE
from nautilus_trader.adapters.binance import BinanceLiveDataClientFactory
from nautilus_trader.adapters.binance import BinanceLiveExecClientFactory
from nautilus_trader.live.node import TradingNode

# 使用配置实例化实时交易节点
node = TradingNode(config=config)

# 注册客户端工厂
node.add_data_client_factory(BINANCE, BinanceLiveDataClientFactory)
node.add_exec_client_factory(BINANCE, BinanceLiveExecClientFactory)

# 构建节点
node.build()
```

### 密钥类型（Key types）

Binance 支持多种加密签名方式用于 API 认证：

- **HMAC**（默认）：使用 HMAC-SHA256 与你的 API secret。
- **RSA**：使用 RSA 私钥签名。
- **Ed25519**：使用 Ed25519 私钥签名。

可以在配置中指定密钥类型：

```python
from nautilus_trader.adapters.binance import BinanceKeyType

config = TradingNodeConfig(
    data_clients={
        BINANCE: {
            "api_key": "YOUR_BINANCE_API_KEY",
            "api_secret": "YOUR_BINANCE_API_SECRET",  # HMAC 使用
            "key_type": BinanceKeyType.ED25519,  # 可选 RSA、HMAC（默认）
            "account_type": "spot",
        },
    },
)
```

:::note
Ed25519 密钥必须为 base64 编码的 ASN.1/DER 格式。实现会自动从 DER 结构中提取 32 字节的 seed。
:::

### API 凭证

你可以通过配置对象传入凭证，也可以通过环境变量传递。常用的环境变量包括：

针对 Binance 实盘客户端（用于 Spot/Margin 与 Futures）：

- `BINANCE_API_KEY`
- `BINANCE_API_SECRET`（适用于所有密钥类型）

针对 Binance Spot/Margin testnet 客户端：

- `BINANCE_TESTNET_API_KEY`
- `BINANCE_TESTNET_API_SECRET`（适用于所有密钥类型）

针对 Binance Futures testnet 客户端：

- `BINANCE_FUTURES_TESTNET_API_KEY`
- `BINANCE_FUTURES_TESTNET_API_SECRET`（适用于所有密钥类型）

在启动交易节点时，系统会立即告知你的凭证是否有效以及是否具备交易权限。

### 账户类型（Account type）

所有 Binance 的账户类型都可用于实盘交易。通过 `BinanceAccountType` 枚举设置 `account_type`，可选项包括：

- `SPOT`
- `MARGIN`（共享保证金于未平仓头寸）
- `ISOLATED_MARGIN`（保证金仅指定给单个头寸）
- `USDT_FUTURES`（以 USDT 或 BUSD 作为抵押物）
- `COIN_FUTURES`（以其他加密货币作为抵押物）

:::tip
建议使用环境变量来管理凭证。
:::

### 基址（Base URL）覆盖

可以覆盖 HTTP REST 与 WebSocket 的默认基址，这在配置 API 集群、性能优化或交易所提供专用端点时很有用。

### Binance US

通过在配置中将 `us` 设置为 `True` 可以启用 Binance US。默认值为 `False`。对 US 账户的支持应与标准 Binance 行为一致。

### 测试网（Testnets）

可以将数据或执行客户端指向 Binance 的 testnet，设置 `testnet` 为 `True` 即可（默认 `False`）：

```python
from nautilus_trader.adapters.binance import BINANCE

config = TradingNodeConfig(
    ...,  # 省略
    data_clients={
        BINANCE: {
            "api_key": "YOUR_BINANCE_TESTNET_API_KEY",
            "api_secret": "YOUR_BINANCE_TESTNET_API_SECRET",
            "account_type": "spot",
            "testnet": True,
        },
    },
    exec_clients={
        BINANCE: {
            "api_key": "YOUR_BINANCE_TESTNET_API_KEY",
            "api_secret": "YOUR_BINANCE_TESTNET_API_SECRET",
            "account_type": "spot",
            "testnet": True,
        },
    },
)
```

### 聚合成交（Aggregated trades）

Binance 提供聚合成交数据端点，作为原始 trades 的替代来源。与默认 trade 端点相比，聚合端点可返回 `start_time` 到 `end_time` 之间的所有 ticks。

若要使用聚合成交，请将 `use_agg_trade_ticks` 选项设为 `True`（默认 `False`）。

### 解析器警告（Parser warnings）

某些 Binance 合约字段值过大，可能无法解析为 Nautilus 的对象。在这种情况下采取 "warn and continue" 的策略（该合约将不会被加载为可用对象）。

这些警告可能导致日志噪音，你可以通过配置禁用此类警告，示例如下：

```python
from nautilus_trader.config import InstrumentProviderConfig

instrument_provider=InstrumentProviderConfig(
    load_all=True,
    log_warnings=False,
)
```

### 期货对冲模式（Futures hedge mode）

Binance Futures 的 Hedge 模式允许交易者同时开多头与空头来对冲风险并从波动中获利。

启用 Binance Futures Hedge 模式需完成以下三步：

- 1. 在 Binance 端启用 Hedge 模式。
- 2. 在 `BinanceExecClientConfig` 中将 `use_reduce_only` 设为 `False`（默认 `True`）。

  ```python
  from nautilus_trader.adapters.binance import BINANCE

  config = TradingNodeConfig(
      ...,  # 省略
      data_clients={
          BINANCE: BinanceDataClientConfig(
              api_key=None,  # 使用 'BINANCE_API_KEY' 环境变量
              api_secret=None,  # 使用 'BINANCE_API_SECRET' 环境变量
              account_type=BinanceAccountType.USDT_FUTURES,
              base_url_http=None,
              base_url_ws=None,
          ),
      },
      exec_clients={
          BINANCE: BinanceExecClientConfig(
              api_key=None,
              api_secret=None,
              account_type=BinanceAccountType.USDT_FUTURES,
              base_url_http=None,
              base_url_ws=None,
              use_reduce_only=False,  # Hedge 模式下必须禁用
          ),
      }
  )
  ```

- 3. 提交订单时，在 `position_id` 中使用后缀（`LONG` 或 `SHORT`）指明仓位方向。

  ```python
  class EMACrossHedgeMode(Strategy):
      ...,  # 省略
      def buy(self) -> None:
          """
          示例：买入方法
          """
          order: MarketOrder = self.order_factory.market(
              instrument_id=self.instrument_id,
              order_side=OrderSide.BUY,
              quantity=self.instrument.make_qty(self.trade_size),
          )

          # LONG 后缀会被 Binance 适配器识别为多头仓位
          position_id = PositionId(f"{self.instrument_id}-LONG")
          self.submit_order(order, position_id)

      def sell(self) -> None:
          """
          示例：卖出方法
          """
          order: MarketOrder = self.order_factory.market(
              instrument_id=self.instrument_id,
              order_side=OrderSide.SELL,
              quantity=self.instrument.make_qty(self.trade_size),
          )
          # SHORT 后缀会被 Binance 适配器识别为空头仓位
          position_id = PositionId(f"{self.instrument_id}-SHORT")
          self.submit_order(order, position_id)
  ```

:::info
如需更多功能或为 Binance 适配器贡献代码，请参阅我们的贡献指南： [contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
