# Bybit

Bybit 成立于 2018 年，是按日交易量和未平仓合约（open interest）计算的加密货币交易所中规模较大的平台之一。本集成旨在支持与 Bybit 的实时行情接入（market data ingest）和订单执行（order execution）。

## 示例

可在仓库中找到 Bybit 的实时示例脚本：[examples/live/bybit](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/bybit/)。

## 概览

本指南假设使用者需要同时配置实时行情订阅与交易执行。Bybit 适配器包含若干可单独使用或组合使用的组件，具体取决于使用场景：

- `BybitHttpClient`：底层 HTTP API 连接。
- `BybitWebSocketClient`：底层 WebSocket API 连接。
- `BybitInstrumentProvider`：合约/标的解析与加载功能。
- `BybitDataClient`：行情数据订阅管理器。
- `BybitExecutionClient`：账户管理与交易执行网关。
- `BybitLiveDataClientFactory`：Bybit 数据客户端的工厂（供 trading node builder 使用）。
- `BybitLiveExecClientFactory`：Bybit 执行客户端的工厂（供 trading node builder 使用）。

:::note
大多数用户只需为实时交易节点（live trading node）定义配置（如下示例），通常无需直接操作这些底层组件。
:::

## Bybit 官方文档

Bybit 提供了详尽的用户文档，详见 Bybit 帮助中心（Bybit help center）。建议结合本集成指南同时参阅 Bybit 官方文档以获得完整细节。

## 产品类型（Products）

在此上下文中，product 指一组相关 instrument 类型的统称。

:::note
在 Bybit v5 API 中，product 也被称为 `category`。
:::

Bybit 支持的 product 类型包括：

| 产品类型                          | 支持 | 备注                                  |
| --------------------------------- | ---- | ------------------------------------- |
| 现货（Spot cryptocurrencies）     | ✓    | 原生现货市场，支持保证金（margin）。  |
| 线性永续合约（Linear perpetual）  | ✓    | 以 USDT/USDC 挂钩的永续合约。         |
| 线性期货（Linear futures）        | ✓    | 交割结算的线性期货。                  |
| 反向永续合约（Inverse perpetual） | ✓    | 以币本位（coin-margined）的永续合约。 |
| 反向期货（Inverse futures）       | ✓    | 以币本位的交割期货。                  |
| 期权（Option contracts）          | ✓    | 以 USDC 结算的期权。                  |

## 符号约定（Symbology）

为区分不同的 product 类型，Nautilus 在 instrument ID 的符号上使用特定的后缀：

- `-SPOT`：现货（Spot）
- `-LINEAR`：线性永续/期货（Perpetual / Futures）
- `-INVERSE`：反向永续/期货（Inverse）
- `-OPTION`：期权（Option）

这些后缀需追加到 Bybit 的原始 symbol 字符串以标识具体的产品类型。例如：

- 以太/泰达现货对可表示为 `ETHUSDT-SPOT`。
- BTCUSDT 永续合约可表示为 `BTCUSDT-LINEAR`。
- BTCUSD 反向永续合约可表示为 `BTCUSD-INVERSE`。

## 订单能力（Orders capability）

Bybit 支持灵活的触发类型组合，从而扩展了 Nautilus 的订单能力。下表中的订单类型既可以用作开仓也可以用作平仓（except trailing stops，因其依赖于与仓位相关的 API）。

### 订单类型

| 订单类型（Order Type） | Spot | Linear | Inverse | 备注                                   |
| ---------------------- | ---- | ------ | ------- | -------------------------------------- |
| `MARKET`               | ✓    | ✓      | ✓       | 支持按报价量（quote quantity）         |
| `LIMIT`                | ✓    | ✓      | ✓       |                                        |
| `STOP_MARKET`          | ✓    | ✓      | ✓       |                                        |
| `STOP_LIMIT`           | ✓    | ✓      | ✓       |                                        |
| `MARKET_IF_TOUCHED`    | ✓    | ✓      | ✓       |                                        |
| `LIMIT_IF_TOUCHED`     | ✓    | ✓      | ✓       |                                        |
| `TRAILING_STOP_MARKET` | -    | ✓      | ✓       | 现货不支持（_Not supported for Spot_） |

### 执行指令（Execution instructions）

| 指令（Instruction） | Spot | Linear | Inverse | 备注                                     |
| ------------------- | ---- | ------ | ------- | ---------------------------------------- |
| `post_only`         | ✓    | ✓      | ✓       | 仅在 `LIMIT` 订单上支持。                |
| `reduce_only`       | -    | ✓      | ✓       | 现货不支持（_Not supported for Spot_）。 |

### 有效期（Time in force）

| 有效期（Time in force） | Spot | Linear | Inverse | 备注                                  |
| ----------------------- | ---- | ------ | ------- | ------------------------------------- |
| `GTC`                   | ✓    | ✓      | ✓       | Good Till Canceled（持续挂单）        |
| `GTD`                   | -    | -      | -       | 不支持（_Not supported_）             |
| `FOK`                   | ✓    | ✓      | ✓       | Fill or Kill（全部成交或取消）        |
| `IOC`                   | ✓    | ✓      | ✓       | Immediate or Cancel（立即成交或取消） |

### 高级订单功能（Advanced order features）

| 功能（Feature）    | Spot | Linear | Inverse | 备注                                          |
| ------------------ | ---- | ------ | ------- | --------------------------------------------- |
| Order Modification | ✓    | ✓      | ✓       | 支持价格与数量修改。                          |
| Bracket/OCO Orders | ✓    | ✓      | ✓       | 仅 UI 支持；API 使用者需自行实现。            |
| Iceberg Orders     | ✓    | ✓      | ✓       | 每个账户最多 10 个，且每个 symbol 最多 1 个。 |

### 批量操作（Batch operations）

| 操作（Operation） | Spot | Linear | Inverse | 备注                       |
| ----------------- | ---- | ------ | ------- | -------------------------- |
| Batch Submit      | ✓    | ✓      | ✓       | 在单次请求中提交多笔订单。 |
| Batch Modify      | ✓    | ✓      | ✓       | 在单次请求中修改多笔订单。 |
| Batch Cancel      | ✓    | ✓      | ✓       | 在单次请求中取消多笔订单。 |

### 仓位管理（Position management）

| 功能（Feature）  | Spot | Linear | Inverse | 备注                                 |
| ---------------- | ---- | ------ | ------- | ------------------------------------ |
| Query positions  | -    | ✓      | ✓       | 实时仓位更新。                       |
| Position mode    | -    | ✓      | ✓       | 单向（One-Way）与对冲（Hedge）模式。 |
| Leverage control | -    | ✓      | ✓       | 支持针对不同 symbol 的杠杆动态调整。 |
| Margin mode      | -    | ✓      | ✓       | Cross 与 Isolated 保证金模式。       |

### 订单查询（Order querying）

| 功能（Feature）      | Spot | Linear | Inverse | 备注                              |
| -------------------- | ---- | ------ | ------- | --------------------------------- |
| Query open orders    | ✓    | ✓      | ✓       | 列出所有未成交/未撤销的活动订单。 |
| Query order history  | ✓    | ✓      | ✓       | 订单历史数据。                    |
| Order status updates | ✓    | ✓      | ✓       | 实时订单状态变更。                |
| Trade history        | ✓    | ✓      | ✓       | 成交与回填（fill）报告。          |

### 或有订单（Contingent orders）

| 功能（Feature）    | Spot | Linear | Inverse | 备注                                 |
| ------------------ | ---- | ------ | ------- | ------------------------------------ |
| Order lists        | -    | -      | -       | 不支持（_Not supported_）。          |
| OCO orders         | ✓    | ✓      | ✓       | 仅 UI 支持；API 使用者需自行实现。   |
| Bracket orders     | ✓    | ✓      | ✓       | 仅 UI 支持；API 使用者需自行实现。   |
| Conditional orders | ✓    | ✓      | ✓       | 包括 stop 与 limit-if-touched 类型。 |

### 订单参数（Order parameters）

提交订单时可通过 `params` 字典自定义单笔订单的额外参数：

| 参数（Parameter） | 类型（Type） | 说明（Description）                                                                                              |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `is_leverage`     | `bool`       | 仅适用于 SPOT 产品。若为 `True` 则为该订单启用保证金交易（借贷），默认：`False`。详见 Bybit 的 isLeverage 文档。 |

#### 示例：SPOT 保证金交易

```python
# Submit a SPOT order with margin enabled
order = strategy.order_factory.market(
    instrument_id=InstrumentId.from_str("BTCUSDT-SPOT.BYBIT"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("0.1"),
    params={"is_leverage": True}  # Enable margin for this order
)
strategy.submit_order(order)
```

:::note
若在 params 中未设置 `is_leverage=True`，SPOT 订单只会使用你的可用余额，不会借入资金（即便你的 Bybit 账号开启了自动借贷）。
:::

完整的参数和示例（包括 `is_leverage`）请参见仓库示例：bybit_exec_tester.py。

### SPOT 交易限制

由于交易所侧不跟踪现货仓位，下列限制适用于 SPOT 产品：

- `reduce_only` 指令不被支持。
- Trailing stop（追踪止损）订单不被支持。

### 追踪止损（Trailing stops）

Bybit 的追踪止损在场内侧并不带有 client order ID（不过存在 `venue_order_id`）。这是因为追踪止损与某个合并后的仓位（netted position）相关联。使用追踪止损时请注意：

- 支持 `reduce_only` 指令。
- 当与追踪止损关联的仓位被平仓时，追踪止损会在场内自动“停用”（close）。
- 无法查询尚未打开的追踪止损订单（`venue_order_id` 在此之前未知）。
- 你可以在 GUI 中手动调整触发价格，调整会同步更新 Nautilus 中对应的订单。

## 速率限制（Rate limiting）

每次 HTTP 调用会消耗全局 token 桶以及任何特定 key 的配额（keyed quota）。当某个桶超出限额时，请求会被自动排队，因此通常无需手动限流。下表列出了常见端点的速率限制：

| Key / Endpoint           | 限制（requests/sec） | 备注                                               |
| ------------------------ | -------------------- | -------------------------------------------------- |
| `bybit:global`           | 120                  | 全交易所维度：600 req / 5 s 的上限。               |
| `/v5/market/kline`       | 20                   | 历史数据查询的速率稍低于全局配额。                 |
| `/v5/market/trades`      | 24                   | 与全局配额匹配。                                   |
| `/v5/order/create`       | 10                   | 标准下单请求。                                     |
| `/v5/order/cancel`       | 10                   | 单笔撤单。                                         |
| `/v5/order/create-batch` | 5                    | 批量下单接口。                                     |
| `/v5/order/cancel-batch` | 5                    | 批量撤单接口。                                     |
| `/v5/order/cancel-all`   | 2                    | 全书（full book）撤单，用于符合 Bybit 指南的场景。 |

:::warning
当触发速率限制时，Bybit 会返回错误码 `10016`，若持续不做退避（back-off）可能会临时封禁该 IP。
:::

:::info
更多关于速率限制的细节，请参阅官方文档：Bybit Rate Limit。
:::

### 数据客户端（Data clients）

如果未指定 product types，则会默认加载并可用所有产品类型。

### 执行客户端（Execution clients）

适配器会根据配置的 product types 自动判定账户类型：

- **仅 SPOT**：使用 `CASH` 账户类型，并启用借贷支持（borrowing support）。
- **衍生品或混合产品**：使用 `MARGIN` 账户类型（UTA — Unified Trading Account）。

这意味着你可以在统一交易账户（UTA）中同时交易现货与衍生品，这也是大多数 Bybit 用户采用的标准账户类型。

:::info
**统一交易账户（Unified Trading Accounts, UTA）与 SPOT 保证金交易**

大多数 Bybit 用户现在使用 UTA，Bybit 也鼓励新用户使用这一账户类型；经典账户视为旧版。关于 UTA 下的 SPOT 保证金交易：

- 借贷并**不会自动开启**，需要在 API 层或账户配置中显式启用。
- 若要通过 API 使用 SPOT 保证金，必须在订单参数中提交 `is_leverage=True`（参见 Bybit 文档）。
- 若你的 Bybit 账户启用了自动借贷/自动还款（auto-borrow/auto-repay），则场内会自动为此类订单进行借还操作。
- 若未启用自动借贷，则需通过 Bybit 的界面手动管理借贷。

**重要提示**：Nautilus 的 Bybit 适配器对 SPOT 订单的默认值为 `is_leverage=False`，即默认不会使用保证金，除非你显式开启。
:::

## 费用货币（Fee currency logic）

了解 Bybit 如何确定交易费用的计价货币对准确记账与仓位追踪非常重要。费用货币的规则在现货与衍生品之间有所不同。

### SPOT 交易费用

对于 SPOT 交易，费用的计价货币取决于订单方向以及该笔费用是否为 maker rebate（负费）：

#### 正常费用（正值）

- **买入（BUY）**：费用以**基础货币（base currency）**计收（例如 BTCUSDT 的买入费用为 BTC）。
- **卖出（SELL）**：费用以**计价货币（quote currency）**计收（例如 BTCUSDT 的卖出费用为 USDT）。

#### Maker rebate（负费）的情况

当 maker 费用为负（即返佣）时，计费货币规则会**反向**：

- **买入且为 maker rebate**：返佣以**计价货币**发放（例如 USDT）。
- **卖出且为 maker rebate**：返佣以**基础货币**发放（例如 BTC）。

:::note
**Taker 订单永远不会采用反向规则**，即便 maker 费率为负。Taker 费用始终遵循正常的计费规则。
:::

#### 示例：BTCUSDT SPOT

- **以 taker 身份买入 1 BTC（费率 0.1%）**：支付 0.001 BTC 的手续费。
- **以 taker 身份卖出 1 BTC（费率 0.1%）**：支付等值的 USDT 手续费。
- **以 maker 身份买入 1 BTC（费率 -0.01%）**：获得 USDT 返佣（规则反向）。
- **以 maker 身份卖出 1 BTC（费率 -0.01%）**：获得 BTC 返佣（规则反向）。

### 衍生品交易费用（Derivatives trading fees）

对于所有衍生品（LINEAR、INVERSE、OPTION），费用始终以**结算货币（settlement currency）**计收：

| 产品类型 | 结算货币（Settlement Currency）         | 费用货币（Fee Currency） |
| -------- | --------------------------------------- | ------------------------ |
| LINEAR   | 通常为 USDT                             | USDT                     |
| INVERSE  | 以基础币为结算（例如 BTCUSD 的 BTC）    | 基础币（Base coin）      |
| OPTION   | 以 USDC（历史）或 USDT（自 2025-02 起） | USDC/USDT                |

### 费用计算

当 WebSocket 的执行消息没有提供精确的费用金额（`execFee`）时，适配器按如下规则计算费用：

#### SPOT 产品

- **BUY 订单**：`fee = base_quantity × fee_rate`
- **SELL 订单**：`fee = notional_value × fee_rate`（其中 `notional_value = quantity × price`）

#### 衍生品

- 所有衍生品：`fee = notional_value × fee_rate`

### 官方文档

关于 Bybit 手续费结构与计费规则的完整细节，请参阅：

- Bybit WebSocket Private Execution 文档
- Bybit Spot Fee Currency Instruction 文档

## 配置

必须在配置中明确指定每个客户端的 product types。

### 数据客户端配置选项（Data client configuration options）

| 选项（Option）                     | 默认值  | 描述                                                                                |
| ---------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `api_key`                          | `None`  | API key；若省略则从环境变量 `BYBIT_API_KEY`/`BYBIT_TESTNET_API_KEY` 加载。          |
| `api_secret`                       | `None`  | API secret；若省略则从环境变量 `BYBIT_API_SECRET`/`BYBIT_TESTNET_API_SECRET` 加载。 |
| `product_types`                    | `None`  | 要启用的 `BybitProductType` 序列；为 `None` 时加载所有产品类型。                    |
| `base_url_http`                    | `None`  | 覆盖 REST 基础 URL。                                                                |
| `demo`                             | `False` | 置为 `True` 则连接 Bybit demo 环境。                                                |
| `testnet`                          | `False` | 置为 `True` 则连接 Bybit testnet。                                                  |
| `update_instruments_interval_mins` | `60`    | instrument 目录刷新的时间间隔（分钟）。                                             |
| `recv_window_ms`                   | `5,000` | 签名 REST 请求的接收窗口（毫秒）。                                                  |
| `bars_timestamp_on_close`          | `True`  | 柱线时间戳使用区间收盘（`True`）或开盘（`False`）。                                 |
| `max_retries`                      | `None`  | REST/WebSocket 恢复时的最大重试次数。                                               |
| `retry_delay_initial_ms`           | `None`  | 重试间的初始延迟（毫秒）。                                                          |
| `retry_delay_max_ms`               | `None`  | 重试间的最大延迟（毫秒）。                                                          |

### 执行客户端配置选项（Execution client configuration options）

| 选项（Option）                          | 默认值  | 描述                                                                                |
| --------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `api_key`                               | `None`  | API key；若省略则从环境变量 `BYBIT_API_KEY`/`BYBIT_TESTNET_API_KEY` 加载。          |
| `api_secret`                            | `None`  | API secret；若省略则从环境变量 `BYBIT_API_SECRET`/`BYBIT_TESTNET_API_SECRET` 加载。 |
| `product_types`                         | `None`  | 要启用的 `BybitProductType` 序列（注意：SPOT 与衍生品不能混合用于执行）。           |
| `base_url_http`                         | `None`  | 覆盖 REST 基础 URL。                                                                |
| `base_url_ws_private`                   | `None`  | 覆盖私有 WebSocket 基础 URL。                                                       |
| `base_url_ws_trade`                     | `None`  | 覆盖 trade WebSocket 基础 URL。                                                     |
| `demo`                                  | `False` | 置为 `True` 则连接 Bybit demo 环境。                                                |
| `testnet`                               | `False` | 置为 `True` 则连接 Bybit testnet。                                                  |
| `use_gtd`                               | `False` | 若为 `True`，将 GTD 订单重映射为 GTC（Bybit 原生不支持 GTD）。                      |
| `use_ws_execution_fast`                 | `False` | 订阅低延迟执行流（low-latency execution stream）。                                  |
| `use_ws_trade_api`                      | `False` | 通过 WebSocket 发送下单请求（而非 HTTP）。                                          |
| `use_http_batch_api`                    | `False` | 使用 Bybit 的 HTTP 批量交易 API（需启用 WebSocket 交易）。                          |
| `use_spot_position_reports`             | `False` | 若为 `True`，将 SPOT 钱包余额报告作为仓位（positions）。                            |
| `ignore_uncached_instrument_executions` | `False` | 忽略针对尚未缓存 instrument 的执行消息。                                            |
| `max_retries`                           | `None`  | 下单/撤单/修改调用的最大重试次数。                                                  |
| `retry_delay_initial_ms`                | `None`  | 重试间的初始延迟（毫秒）。                                                          |
| `retry_delay_max_ms`                    | `None`  | 重试间的最大延迟（毫秒）。                                                          |
| `recv_window_ms`                        | `5,000` | 签名 REST 请求的接收窗口（毫秒）。                                                  |
| `ws_trade_timeout_secs`                 | `5.0`   | 等待 trade WebSocket 确认的超时时间（秒）。                                         |
| `ws_auth_timeout_secs`                  | `5.0`   | 等待 auth WebSocket 确认的超时时间（秒）。                                          |
| `futures_leverages`                     | `None`  | `BybitSymbol` 到杠杆设置的映射。                                                    |
| `position_mode`                         | `None`  | `BybitSymbol` 到持仓模式（单向 vs 对冲）的映射。                                    |
| `margin_mode`                           | `None`  | 账户的保证金模式设置。                                                              |

最常见的用例是把 Bybit 的数据客户端与执行客户端加入到实时 `TradingNode` 中。为此，请在你的客户端配置中添加一个 `BYBIT` 区块：

```python
from nautilus_trader.adapters.bybit import BYBIT
from nautilus_trader.adapters.bybit import BybitProductType
from nautilus_trader.live.node import TradingNode

config = TradingNodeConfig(
    ...,  # Omitted
    data_clients={
        BYBIT: {
            "api_key": "YOUR_BYBIT_API_KEY",
            "api_secret": "YOUR_BYBIT_API_SECRET",
            "base_url_http": None,  # Override with custom endpoint
            "product_types": [BybitProductType.LINEAR]
            "testnet": False,
        },
    },
    exec_clients={
        BYBIT: {
            "api_key": "YOUR_BYBIT_API_KEY",
            "api_secret": "YOUR_BYBIT_API_SECRET",
            "base_url_http": None,  # Override with custom endpoint
            "product_types": [BybitProductType.LINEAR]
            "testnet": False,
        },
    },
)
```

然后创建一个 `TradingNode` 并注册客户端工厂：

```python
from nautilus_trader.adapters.bybit import BYBIT
from nautilus_trader.adapters.bybit import BybitLiveDataClientFactory
from nautilus_trader.adapters.bybit import BybitLiveExecClientFactory
from nautilus_trader.live.node import TradingNode

# Instantiate the live trading node with a configuration
node = TradingNode(config=config)

# Register the client factories with the node
node.add_data_client_factory(BYBIT, BybitLiveDataClientFactory)
node.add_exec_client_factory(BYBIT, BybitLiveExecClientFactory)

# Finally build the node
node.build()
```

### API 凭证（API credentials）

向 Bybit 客户端提供凭证有两种方式：直接在配置中传入 `api_key` 与 `api_secret`，或通过环境变量传递：

对于 Bybit live 客户端，可设置环境变量：

- `BYBIT_API_KEY`
- `BYBIT_API_SECRET`

对于 Bybit demo 客户端，可设置：

- `BYBIT_DEMO_API_KEY`
- `BYBIT_DEMO_API_SECRET`

对于 Bybit testnet 客户端，可设置：

- `BYBIT_TESTNET_API_KEY`
- `BYBIT_TESTNET_API_SECRET`

:::tip
推荐使用环境变量来管理凭证。这样更安全且便于部署。
:::

启动交易节点时，你会立即收到凭证是否有效以及是否具备交易权限的确认信息。

:::info
关于 Bybit 适配器的更多功能或贡献方式，请参阅项目的贡献指南（contributing guide）。
:::
