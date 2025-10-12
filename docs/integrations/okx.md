# OKX

OKX 成立于 2017 年，是一家领先的加密货币交易所，提供现货（spot）、永续合约（perpetual swap）、期货（futures）及期权（options）交易。本集成模块支持 OKX 的实时行情订阅（market data ingest）以及订单执行（order execution）。

## 概览

该适配器以 Rust 实现，并提供可选的 Python 绑定，便于在以 Python 为主的工作流中使用。
无需依赖外部 OKX 客户端库——核心组件在构建时会编译为静态库并自动链接。

## 示例

你可以在此处找到实时的示例脚本：[examples/live/okx](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/okx/)。

### 产品支持

| 产品类型              | 数据流 | 交易 | 说明                                      |
| --------------------- | ------ | ---- | ----------------------------------------- |
| 现货（Spot）          | ✓      | ✓    | 可用于指数类价格（index prices）。        |
| 永续合约（Swap）      | ✓      | ✓    | 支持线性（linear）与反向（inverse）合约。 |
| 期货（Futures）       | ✓      | ✓    | 有明确到期日的合约。                      |
| 融资/保证金（Margin） | -      | -    | _暂不支持。_                              |
| 期权（Options）       | ✓      | -    | _仅支持行情订阅，交易接口尚在开发中。_    |

:::info
**期权支持说明**：当前可订阅期权市场数据并接收行情更新，但期权的下单/执行功能尚未实现。你仍可按上文的符号（symbology）格式订阅期权数据流。
:::

OKX 适配器由多个组件组成，用户可根据需要单独使用或组合使用：

- `OKXHttpClient`：HTTP REST 低层客户端。
- `OKXWebSocketClient`：WebSocket 低层客户端。
- `OKXInstrumentProvider`：合约/标的解析与加载功能。
- `OKXDataClient`：行情数据管理器（market data feed manager）。
- `OKXExecutionClient`：账户与交易执行网关（execution gateway）。
- `OKXLiveDataClientFactory`：OKX 数据客户端工厂（用于 trading node builder）。
- `OKXLiveExecClientFactory`：OKX 执行客户端工厂（用于 trading node builder）。

:::note
大多数使用场景下，用户只需为 live trading node 定义配置（如下示例），通常无需直接与上述低层组件交互。
:::

## 符号约定（Symbology）

OKX 对不同品种使用特定的合约代码约定（symbol conventions）。在引用合约 ID 时，建议带上 `.OKX` 后缀（例如现货 BTC 对 USDT 应使用 `BTC-USDT.OKX`）。

### 按品种的代码格式

#### 现货（SPOT）

格式：`{BaseCurrency}-{QuoteCurrency}`

示例：

- `BTC-USDT` — 比特币对 USDT（Tether）
- `BTC-USDC` — 比特币对 USDC
- `ETH-USDT` — 以太坊对 USDT
- `SOL-USDT` — Solana 对 USDT

在策略中订阅以 USD 计价的比特币现货：

```python
InstrumentId.from_str("BTC-USDT.OKX")  # USDT 报价的现货
InstrumentId.from_str("BTC-USDC.OKX")  # USDC 报价的现货
```

#### 永续合约（SWAP / Perpetual Futures）

格式：`{BaseCurrency}-{QuoteCurrency}-SWAP`

示例：

- `BTC-USDT-SWAP` — BTC 永续合约（线性，USDT 保证金）
- `BTC-USD-SWAP` — BTC 永续合约（反向，币本位）
- `ETH-USDT-SWAP` — ETH 永续合约（线性）
- `ETH-USD-SWAP` — ETH 永续合约（反向）

线性（Linear）与反向（Inverse）合约区别：

- **线性（Linear）**：以 USDT 等稳定币作为保证金。
- **反向（Inverse）**：以基础币（如 BTC）作为保证金。

#### 期货（FUTURES，有到期日）

格式：`{BaseCurrency}-{QuoteCurrency}-{YYMMDD}`

示例：

- `BTC-USD-251226` — 2025-12-26 到期的比特币期货
- `ETH-USD-251226` — 2025-12-26 到期的以太坊期货
- `BTC-USD-250328` — 2025-03-28 到期的比特币期货

注意：期货通常为反向合约（coin-margined）。

#### 期权（OPTIONS）

格式：`{BaseCurrency}-{QuoteCurrency}-{YYMMDD}-{Strike}-{Type}`

示例：

- `BTC-USD-250328-100000-C` — 到期日 2025-03-28，行权价 100,000 美元的 BTC 看涨期权（Call）
- `BTC-USD-250328-100000-P` — 到期日 2025-03-28，行权价 100,000 美元的 BTC 看跌期权（Put）
- `ETH-USD-250328-4000-C` — 到期日 2025-03-28，行权价 4,000 美元的 ETH 看涨期权

其中：

- `C` 表示 Call（看涨期权）
- `P` 表示 Put（看跌期权）

### 常见问题

Q：如何订阅美元计价的比特币现货？

A：对 USDT 报价使用 `BTC-USDT.OKX`，对 USDC 报价使用 `BTC-USDC.OKX`。

Q：`BTC-USDT-SWAP` 与 `BTC-USD-SWAP` 有何区别？

A：`BTC-USDT-SWAP` 为线性永续（USDT 保证金）；`BTC-USD-SWAP` 为反向永续（BTC 保证金）。

Q：如何选择合约类型？

A：查看配置中的 `contract_types` 参数：

- 线性合约（linear）：`OKXContractType.LINEAR`。
- 反向合约（inverse）：`OKXContractType.INVERSE`。

## 订单能力（Orders capability）

下面列出 OKX 对线性永续（Linear Perpetual Swap）产品支持的下单类型、执行指令与时效（time-in-force）选项。

### 客户端 Order ID 要求

:::warning
OKX 对客户端订单 ID（client order ID）有严格要求：

- **禁止使用连字符（hyphen）`-`**：OKX 不接受包含 `-` 的 client order ID。
- 最大长度：32 字符。
- 允许字符：仅限字母数字（alphanumeric）和下划线（underscore）。

在配置策略时，请确保设置：

```python
use_hyphens_in_client_order_ids=False
```

:::

### 订单类型

| 订单类型（Order Type） | 线性永续（Linear Perpetual Swap） | 说明                                                           |
| ---------------------- | --------------------------------- | -------------------------------------------------------------- |
| `MARKET`               | ✓                                 | 市价单，立即以市价成交。支持以报价数量下单（quote quantity）。 |
| `LIMIT`                | ✓                                 | 限价单，在指定价格或更优价格成交。                             |
| `STOP_MARKET`          | ✓                                 | 条件市价单（OKX 的 algo order）。                              |
| `STOP_LIMIT`           | ✓                                 | 条件限价单（OKX 的 algo order）。                              |
| `MARKET_IF_TOUCHED`    | ✓                                 | 条件市价单（OKX 的 algo order）。                              |
| `LIMIT_IF_TOUCHED`     | ✓                                 | 条件限价单（OKX 的 algo order）。                              |
| `TRAILING_STOP`        | -                                 | _暂不支持。_                                                   |

:::info
**条件单说明**：`STOP_MARKET`、`STOP_LIMIT`、`MARKET_IF_TOUCHED` 与 `LIMIT_IF_TOUCHED` 通过 OKX 的 algo order 实现，支持多种触发价来源并提供更丰富的触发策略。
:::

### 执行指令（Execution instructions）

| 指令（Instruction） | 线性永续（Linear Perpetual Swap） | 说明                 |
| ------------------- | --------------------------------- | -------------------- |
| `post_only`         | ✓                                 | 仅适用于 LIMIT 单。  |
| `reduce_only`       | ✓                                 | 仅适用于衍生品合约。 |

### 时效（Time in force）

| Time in force | 线性永续（Linear Perpetual Swap） | 说明                                    |
| ------------- | --------------------------------- | --------------------------------------- |
| `GTC`         | ✓                                 | Good Till Canceled（直到被取消）。      |
| `FOK`         | ✓                                 | Fill or Kill（全部成交或取消）。        |
| `IOC`         | ✓                                 | Immediate or Cancel（立即成交或取消）。 |
| `GTD`         | ✗                                 | _OKX API 不支持原生 GTD。_              |

:::info
**GTD（Good Till Date）说明**：OKX API 不原生支持 GTD。如果你需要按日期过期的订单，请使用 Nautilus 的策略层 GTD 功能，策略会在指定时间到期时取消对应订单以实现等价行为。
:::

### 批量操作（Batch operations）

| 操作                     | 线性永续（Linear Perpetual Swap） | 说明                   |
| ------------------------ | --------------------------------- | ---------------------- |
| 批量提交（Batch Submit） | ✓                                 | 单次请求提交多笔订单。 |
| 批量修改（Batch Modify） | ✓                                 | 单次请求修改多笔订单。 |
| 批量撤单（Batch Cancel） | ✓                                 | 单次请求撤销多笔订单。 |

### 持仓管理（Position management）

| 功能                         | 线性永续（Linear Perpetual Swap） | 说明                                               |
| ---------------------------- | --------------------------------- | -------------------------------------------------- |
| 查询持仓（Query positions）  | ✓                                 | 实时报持仓更新。                                   |
| 持仓模式（Position mode）    | ✓                                 | 支持 Net 与 Long/Short 模式。                      |
| 杠杆控制（Leverage control） | ✓                                 | 支持按合约动态调整杠杆。                           |
| 保证金模式（Margin mode）    | ✓                                 | 支持 cash、isolated、cross、spot_isolated 等模式。 |

### 保证金模式说明（Margin modes）

OKX 的统一账户系统允许在每笔订单层面选择不同的保证金模式。本适配器支持在提交订单时通过 `params` 参数指定交易模式（`td_mode`）。

:::note
**重要**：账户的初始模式必须通过 OKX Web/App 界面配置，API 无法在首次设置时直接更改账户的模式。
:::

有关 OKX 账户模式与保证金体系的详细信息，请参阅 OKX 官方文档：[OKX Account Mode documentation](https://www.okx.com/docs-v5/en/#overview-account-mode)。

#### 可用的保证金模式

- `cash`：现货无杠杆（现货默认模式）。
- `isolated`：逐仓（isolated），风险仅限于特定仓位。
- `cross`：全仓（cross），所有仓位共享保证金池。
- `spot_isolated`：现货逐仓模式。

#### 在订单层面设置保证金模式

可以通过 `params` 参数为单笔订单指定保证金模式：

```python
# 使用逐仓模式提交订单
strategy.submit_order(
    order=order,
    params={"td_mode": "isolated"}
)

# 使用全仓模式提交订单
strategy.submit_order(
    order=order,
    params={"td_mode": "cross"}
)
```

如果 `params` 中未指定 `td_mode`，适配器将使用账户类型的默认模式：

- 现金账户（Cash）默认使用 `cash`。
- 保证金账户（Margin）默认使用 `isolated`。

该灵活性允许你：

- 并行运行多个风险配置不同的策略。
- 对高风险仓位使用逐仓以隔离风险，同时对资本效率更高的仓位使用全仓。
- 在同一账户内混合现货与保证金交易。

### 订单查询（Order querying）

| 功能                      | 线性永续（Linear Perpetual Swap） | 说明                          |
| ------------------------- | --------------------------------- | ----------------------------- |
| 查询未完成订单（open）    | ✓                                 | 列出所有活动订单。            |
| 历史订单查询（history）   | ✓                                 | 返回历史下单记录。            |
| 订单状态更新（status）    | ✓                                 | 实时的订单状态变化通知。      |
| 交易记录（trade history） | ✓                                 | 包含执行与成交回报（fills）。 |

### 条件单（Contingent orders）

| 功能                     | 线性永续（Linear Perpetual Swap） | 说明                               |
| ------------------------ | --------------------------------- | ---------------------------------- |
| 订单列表（Order lists）  | -                                 | _不支持_                           |
| OCO 订单（OCO orders）   | ✓                                 | One-Cancels-Other（互斥）订单。    |
| 括号单（Bracket orders） | ✓                                 | 止损 + 止盈 的组合单。             |
| 条件单（Conditional）    | ✓                                 | 包含 Stop 与 Limit-if-touched 等。 |

#### 条件单架构

条件单（OKX 的 algo orders）采用混合架构以兼顾性能与可靠性：

- **提交**：通过 HTTP REST API（`/api/v5/trade/order-algo`）。
- **状态更新**：通过 WebSocket 的 business 端点（`/ws/v5/business`）上的 `orders-algo` 频道推送。
- **取消**：通过 HTTP REST API 并使用 algo order ID 进行跟踪与管理。

该设计保证了：

- 通过 HTTP 可即时收到提交确认。
- 通过 WebSocket 获取实时状态更新。
- 使用 algo order ID 实现完整的订单生命周期管理。

#### 支持的条件单类型

| 订单类型（Order Type） | 触发价类型（Trigger Types） | 说明               |
| ---------------------- | --------------------------- | ------------------ |
| `STOP_MARKET`          | Last, Mark, Index           | 触发后按市价执行。 |
| `STOP_LIMIT`           | Last, Mark, Index           | 触发后提交限价单。 |
| `MARKET_IF_TOUCHED`    | Last, Mark, Index           | 触发后按市价执行。 |
| `LIMIT_IF_TOUCHED`     | Last, Mark, Index           | 触发后提交限价单。 |

#### 触发价来源（Trigger price types）

条件单支持多种触发价来源：

- **Last Price**（`TriggerType.LAST_PRICE`）：使用最新成交价（默认）。
- **Mark Price**（`TriggerType.MARK_PRICE`）：使用标记价（推荐用于衍生品）。
- **Index Price**（`TriggerType.INDEX_PRICE`）：使用基础指数价格。

```python
# 示例：使用 mark price 作为触发价的止损单
stop_order = order_factory.stop_market(
    instrument_id=instrument_id,
    order_side=OrderSide.SELL,
    quantity=Quantity.from_str("0.1"),
    trigger_price=Price.from_str("45000.0"),
    trigger_type=TriggerType.MARK_PRICE,  # 使用标记价作为触发价
)
strategy.submit_order(stop_order)
```

## 认证（Authentication）

使用 OKX 适配器前，你需要在 OKX 账户中创建 API 凭证：

1. 登录 OKX，进入 API 管理页面。
2. 创建一个具备交易与行情访问权限的 API key。
3. 记录下 API key、secret key 与 passphrase。

可以通过环境变量提供这些凭证：

```bash
export OKX_API_KEY="your_api_key"
export OKX_API_SECRET="your_api_secret"
export OKX_API_PASSPHRASE="your_passphrase"
```

也可以直接在配置中传入（但不推荐在生产环境中这样做）。

## 模拟交易（Demo trading）

OKX 提供了模拟（demo）交易环境，便于在不动用真实资金的情况下测试策略。要启用 demo 模式，在客户端配置中将 `is_demo=True`：

```python
config = TradingNodeConfig(
    data_clients={
        OKX: OKXDataClientConfig(
            is_demo=True,  # 启用 demo 模式
            # ... 其他配置
        ),
    },
    exec_clients={
        OKX: OKXExecClientConfig(
            is_demo=True,  # 启用 demo 模式
            # ... 其他配置
        ),
    },
)
```

启用 demo 模式时：

- REST 请求会带上 `x-simulated-trading: 1` 的 header。
- WebSocket 使用 demo 专用的 endpoint（例如 `wspap.okx.com`）。
- 使用的 API 凭证与生产环境相同，但必须为 demo 专用的 API key（生产 key 无法在 demo 模式下使用）。

:::note
请务必使用为 demo 交易单独创建的 API key，生产环境的 API key 无法用于 demo 模式。
:::

## 速率限制（Rate limiting）

适配器会在客户端层面遵守 OKX 的 endpoint 限额设置，同时为 REST 与 WebSocket 调用提供合理的默认值。

### REST 限额

- 全局上限（Global cap）：250 次请求 / 秒（对应 OKX 的 500 次请求 / 2 秒的 IP 限额）。
- 下表列出了针对常用 endpoint 的较为保守的配额，参考 OKX 官方发布的限制。

### WebSocket 限额

- 订阅操作（subscription）：3 次请求 / 秒。
- 订单相关操作（下单/撤单/修改）：250 次请求 / 秒。

:::warning
OKX 对每个 endpoint 与每个账户均实施限额；超出速率会导致 HTTP 429 返回并暂时对该 API key 进行限流。
:::

| Key / Endpoint                   | 限额（次/秒） | 说明                                       |
| -------------------------------- | ------------- | ------------------------------------------ |
| `okx:global`                     | 250           | 对应 500 req / 2 s 的 IP 限额。            |
| `/api/v5/public/instruments`     | 10            | 与 OKX 文档中 20 req / 2 s 的限制相匹配。  |
| `/api/v5/market/candles`         | 50            | 用于流式 candles 的较高配额。              |
| `/api/v5/market/history-candles` | 20            | 用于大规模历史数据拉取的保守配额。         |
| `/api/v5/market/history-trades`  | 30            | 交易历史查询。                             |
| `/api/v5/account/balance`        | 5             | OKX 建议值：10 req / 2 s。                 |
| `/api/v5/trade/order`            | 30            | 每合约 60 req / 2 s 的限制对应的保守设置。 |
| `/api/v5/trade/orders-pending`   | 20            | 未成交订单查询。                           |
| `/api/v5/trade/orders-history`   | 20            | 订单历史查询。                             |
| `/api/v5/trade/fills`            | 30            | 成交回报查询（fills）。                    |
| `/api/v5/trade/order-algo`       | 10            | 条件单（algo order）提交。                 |
| `/api/v5/trade/cancel-algos`     | 10            | 条件单取消接口。                           |

所有 key 默认都包含 `okx:global` 桶（bucket）。在限流前会对 URL 做归一化处理（移除 query string），因此带不同过滤参数的请求也会共享同一配额。

:::info
更多关于速率限制的细节，请参阅官方文档：[OKX REST API Rate Limit](https://www.okx.com/docs-v5/en/#rest-api-rate-limit)。
:::

## 配置（Configuration）

### 配置选项

OKX 数据客户端提供如下可配置项：

#### 数据客户端（Data client）

| 选项（Option）                              | 默认值                      | 说明                                                                          |
| ------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `instrument_types`                          | `(OKXInstrumentType.SPOT,)` | 控制加载哪些 OKX 的品种族（spot、swap、futures、options）。                   |
| `contract_types`                            | `None`                      | 与 `instrument_types` 配合使用以限制加载特定的合约风格（如 linear/inverse）。 |
| `base_url_http`                             | `None`                      | 覆盖 OKX REST endpoint；默认在运行时解析为生产 URL。                          |
| `base_url_ws`                               | `None`                      | 覆盖行情 WebSocket 的 endpoint。                                              |
| `api_key` / `api_secret` / `api_passphrase` | `None`                      | 为空时会从环境变量 `OKX_API_KEY`、`OKX_API_SECRET`、`OKX_PASSPHRASE` 中读取。 |
| `is_demo`                                   | `False`                     | 设为 `True` 则连接 OKX 的 demo 环境。                                         |
| `http_timeout_secs`                         | `60`                        | REST 行情请求的超时时间（秒）。                                               |
| `update_instruments_interval_mins`          | `60`                        | 后台刷新 instruments 的时间间隔（分钟）。                                     |
| `vip_level`                                 | `None`                      | 设置为匹配的 OKX VIP 等级后可启用更高深度的订单簿频道。                       |

OKX 的执行客户端（execution client）提供如下配置项：

#### 执行客户端（Execution client）

| 选项（Option）                              | 默认值                      | 说明                                                                           |
| ------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `instrument_types`                          | `(OKXInstrumentType.SPOT,)` | 该执行客户端可交易的品种族。                                                   |
| `contract_types`                            | `None`                      | 与 `instrument_types` 配合使用以限制可交易的合约（linear、inverse、options）。 |
| `base_url_http`                             | `None`                      | 覆盖交易 REST endpoint。                                                       |
| `base_url_ws`                               | `None`                      | 覆盖私有 WebSocket 的 endpoint。                                               |
| `api_key` / `api_secret` / `api_passphrase` | `None`                      | 为空时回退到 `OKX_API_KEY`、`OKX_API_SECRET`、`OKX_PASSPHRASE` 环境变量。      |
| `margin_mode`                               | `None`                      | 在指定时强制 OKX 账户使用某一保证金模式（cross 或 isolated）。                 |
| `is_demo`                                   | `False`                     | 连接 OKX 的 demo 交易环境。                                                    |
| `http_timeout_secs`                         | `60`                        | REST 交易请求的超时时间（秒）。                                                |
| `use_fills_channel`                         | `False`                     | 是否订阅专用的 fills 频道（需 VIP5+）以获得更低延迟的成交回报。                |
| `use_mm_mass_cancel`                        | `False`                     | 是否使用做市商的批量撤单接口；不可用时回退到单笔撤单。                         |
| `max_retries`                               | `3`                         | 可恢复性 REST 错误的最大重试次数。                                             |
| `retry_delay_initial_ms`                    | `1,000`                     | 在重试失败请求前使用的初始延迟（毫秒）。                                       |
| `retry_delay_max_ms`                        | `10,000`                    | 指数退避重试时的上限延迟（毫秒）。                                             |

下面示例展示了如何在 live trading node 中配置 OKX 的数据与执行客户端：

```python
from nautilus_trader.adapters.okx import OKX
from nautilus_trader.adapters.okx import OKXDataClientConfig, OKXExecClientConfig
from nautilus_trader.adapters.okx.factories import OKXLiveDataClientFactory, OKXLiveExecClientFactory
from nautilus_trader.config import InstrumentProviderConfig, LiveExecEngineConfig, LoggingConfig, TradingNodeConfig
from nautilus_trader.core.nautilus_pyo3 import OKXContractType
from nautilus_trader.core.nautilus_pyo3 import OKXInstrumentType
from nautilus_trader.live.node import TradingNode

config = TradingNodeConfig(
    ...,
    data_clients={
        OKX: OKXDataClientConfig(
            api_key=None,           # Will use OKX_API_KEY env var
            api_secret=None,        # Will use OKX_API_SECRET env var
            api_passphrase=None,    # Will use OKX_API_PASSPHRASE env var
            base_url_http=None,
            instrument_provider=InstrumentProviderConfig(load_all=True),
            instrument_types=(OKXInstrumentType.SWAP,),
            contract_types=(OKXContractType.LINEAR,),
            is_demo=False,
        ),
    },
    exec_clients={
        OKX: OKXExecClientConfig(
            api_key=None,
            api_secret=None,
            api_passphrase=None,
            base_url_http=None,
            base_url_ws=None,
            instrument_provider=InstrumentProviderConfig(load_all=True),
            instrument_types=(OKXInstrumentType.SWAP,),
            contract_types=(OKXContractType.LINEAR,),
            is_demo=False,
        ),
    },
)
node = TradingNode(config=config)
node.add_data_client_factory(OKX, OKXLiveDataClientFactory)
node.add_exec_client_factory(OKX, OKXLiveExecClientFactory)
node.build()
```

:::info
如需更多功能或参与 OKX 适配器的贡献，请参阅我们的贡献指南：[contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
