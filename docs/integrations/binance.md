# Binance

Binance 创立于 2017 年，按日交易量和加密资产及衍生品未平仓合约计，是全球最大的加密货币交易所之一。

NautilusTrader 提供 Binance 集成，用于实时行情数据与实时交易。adapter 以 Rust 实现，并通过相同的
公开配置、工厂和数据类型暴露给 Python。

支持的产品：

- **Binance Spot**（含 Binance US）
- **Binance USDT-Margined Futures**（加密货币与 TradFi 永续；当期与次期的周、月、季交割合约）
- **Binance Coin-Margined Futures**（永续与当期或次季交割合约）

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/binance/)
- [Rust Spot 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/binance/examples/spot/)
- [Rust Futures 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/binance/examples/futures/)

## 概览 {#overview}

adapter 暴露以下公开组件：

- `BinanceDataClientConfig` 与 `BinanceExecutionClientConfig`：实时客户端配置。
- `BinanceInstrumentProviderConfig`：金融工具选择、过滤与警告策略。
- `BinanceDataClientFactory` 与 `BinanceExecutionClientFactory`：交易节点客户端工厂。
- `load_binance_instruments`：独立的配置化金融工具发现。
- `load_binance_order_book_deltas`：Rust 实现的 Binance 深度 CSV 加载器，用于订单簿数据整理。
- `BINANCE`、`BINANCE_CLIENT_ID`、`BINANCE_VENUE` 及 client order ID 解码器：公开标识符与解码工具。

:::note
多数用户只需要配置与工厂，按[实时节点配置](#live-node-configuration)所示装配到实时交易节点即可。
其余组件服务于独立加载与离线解码。
:::

底层 HTTP 与 WebSocket 客户端、它们的缓存，以及产品专有的 instrument provider 对象都不通过
Python API 暴露。请使用实时配置与工厂，或独立的金融工具加载器，不要依赖这些内部实现。

独立发现金融工具时，传入与实时客户端相同的数据客户端配置和 provider 配置：

```python
import asyncio

from nautilus_trader.adapters.binance import BinanceDataClientConfig
from nautilus_trader.adapters.binance import BinanceInstrumentProviderConfig
from nautilus_trader.adapters.binance import BinanceProductType
from nautilus_trader.adapters.binance import load_binance_instruments

config = BinanceDataClientConfig(
    product_type=BinanceProductType.USD_M,
    instrument_provider=BinanceInstrumentProviderConfig(
        load_all=False,
        load_ids=["BTCUSDT-PERP.BINANCE"],
    ),
)
instruments = asyncio.run(load_binance_instruments(config))
```

该函数支持 Spot、USD-M 与 COIN-M，使用配置中的环境、URL、代理、接收窗口、Binance US 模式、
过滤器、警告策略和手续费率策略。Margin 不是 Binance 支持的产品，会被拒绝。

处理 Binance 深度 CSV 数据时，直接调用无状态加载器：

```python
from nautilus_trader.adapters.binance import load_binance_order_book_deltas

df = load_binance_order_book_deltas(path, nrows=1_000_000)
```

加载器保留源数据值与列顺序。文件打开失败、数值或方向值非法都会抛出 `RuntimeError`。

### 产品支持 {#product-support}

| 产品类型                                  | 支持      | 备注                                               |
| --------------------------------------- | --------- | -------------------------------------------------- |
| 现货市场（含 Binance US）                 | ✓         |                                                    |
| 保证金账户（全仓与逐仓）                   | -         | *未实现。*                                          |
| USDT 本位合约（PERP 与交割）              | ✓         | 周、月、季交割合约。                                 |
| 币本位合约（PERP 与交割）                 | ✓         | 季度交割合约。                                       |

:::note
借款、还款、逐仓保证金管理等保证金账户功能尚未实现。
:::

:::info
每个 Binance 客户端实例只处理一种产品类型。配置使用单数的 `product_type` 字段，实时工厂从一份
配置创建一个数据或执行客户端。若要在同一节点同时运行 Spot 与 Futures，需配置不同 ID 的独立客户端，
例如 `BINANCE_SPOT` 与 `BINANCE_FUTURES`。策略订阅或提交订单时，传入匹配的 `client_id`。
同时使用两个执行客户端时，按[执行客户端路由](./../concepts/live.md#execution-client-routing)
配置显式的 `BINANCE` 场所路由或默认客户端。完整的客户端搭建方式见当前的 Python 示例。
:::

## 数据类型 {#data-types}

该集成包含若干自定义数据类型：

- `BinanceSpotTicker`：Spot 24 小时行情数据，含价格、成交量与成交统计。
- `BinanceFuturesTicker`：Futures 24 小时行情数据，含价格与统计信息。
- `BinanceBar`：带附加成交量指标的 bar 数据，适用于历史与实时场景。
- `BinanceFuturesMarkPriceUpdate`：Futures 标记价格数据，含预估结算价。
- `BinanceFuturesLiquidation`：来自 `forceOrder` 流的 Futures 强平事件。
- `BinanceFuturesOpenInterest`：当前 Futures 未平仓合约快照（仅限请求）。
- `BinanceFuturesOpenInterestHist`：某周期内的 Futures 未平仓合约历史（仅限请求）。

完整定义见 Binance [API Reference](https://nautilustrader.io/docs/python-api-latest/adapters/binance.html)。

`BinanceBar`、`BinanceFuturesTicker`、`BinanceFuturesOpenInterest` 和
`BinanceFuturesLiquidation` 支持在 `data/custom/{TypeName}/{identifier}` 路径下做
Arrow/Parquet 数据目录持久化。Rust 构建需启用 `nautilus-binance` 的 `arrow` feature
标志才能持久化。仍使用旧式 Python 写入布局 `data/custom_<snake_case>`
（例如 `data/custom_binance_bar`）的数据目录，可用
[nautilus catalog migrate-parquet](./../how_to/migrate_parquet_catalog.md) 迁移。

## 符号体系 {#symbology}

现货与期货合约尽可能使用 Binance 原生符号。NautilusTrader 支持多场所交易，必须区分
现货交易对 `BTCUSDT` 与永续期货合约 `BTCUSDT`（Binance 对两者使用同一符号）。

Nautilus 在 USD-M 永续符号后追加 `-PERP`。例如 Binance USD-M 的 `BTCUSDT` 永续变为
`BTCUSDT-PERP`。USD-M 的 `TRADIFI_PERPETUAL` 上架合约使用相同后缀，`XAUUSDT` 变为
`XAUUSDT-PERP`。

adapter 将 `TRADIFI_PERPETUAL` 上架合约映射为 `PerpetualContract`，并从 Binance 的
`underlyingType` 推导其资产类别：

| Binance `underlyingType`                                     | Nautilus 资产类别        |
| ------------------------------------------------------------ | -------------------- |
| `EQUITY`、`CN_EQUITY`、`KR_EQUITY`、`HK_EQUITY`、`PREMARKET` | Equity               |
| `COMMODITY`                                                  | Commodity            |

取值为其他值或缺失的上架合约会被跳过，并输出警告。

COIN-M 永续保留 Binance 原生的 `_PERP` 后缀，因此 `BTCUSD_PERP` 保持不变。

交割符号保留 Binance 的 `_YYMMDD` 后缀。例如 `BTCUSDT_270326` 与 `BTCUSD_270326`
在 Nautilus 内原样保留。USD-M 支持文档中的 `CURRENT_MONTH`、`NEXT_MONTH`、
`CURRENT_QUARTER`、`NEXT_QUARTER` 合约类型，另加 Binance 通用定义未列出的周度类型
`CURRENT_WEEK` 与 `NEXT_WEEK`。COIN-M 支持 `CURRENT_QUARTER` 与 `NEXT_QUARTER`。
合约可用性随环境和上架周期变化。

USD-M 交割金融工具为线性，以保证金资产结算。COIN-M 交割金融工具为反向，以保证金资产（基础货币）
结算，并使用 Binance 的 `contractSize` 作为金融工具乘数。两者都用 `onboardDate` 和
`deliveryDate` 表示激活与到期。参见 Binance 官方的
[USD-M 通用定义](https://developers.binance.com/en/docs/products/derivatives-trading-usds-futures/common-definition)
和 [COIN-M 通用定义](https://developers.binance.com/en/docs/products/derivatives-trading-coin-futures/common-definition)。

Rust Futures 数据测试器无需修改源码即可接受交割金融工具：

```bash
BINANCE_FUTURES_INSTRUMENT_ID=BTCUSDT_270326.BINANCE \
  cargo run -p nautilus-binance --example binance-futures-data-tester --features examples
```

## 现货名义价值限制 {#spot-notional-constraints}

通过 SBE 或 JSON 加载的现货金融工具，会从 `MIN_NOTIONAL` 与 `NOTIONAL` 过滤器填充专用的
`min_notional` 和 `max_notional` 字段。两个过滤器同时存在时，解析器采用最严格的边界。
这些字段以对应货币的精度保存计价货币的 `Money` 值。

风险引擎结合自身价格估计检查这些金融工具字段。金融工具的 `info` 是给下游 actor 和策略的
元数据，不影响风险决策。Binance 在交易所侧验证订单时会应用它自己的市价单标志与参考价规则。

PostgreSQL 在恢复金融工具时会保留金融工具元数据。升级现有数据库后，在仓库根目录运行
`nautilus database init --schema "$PWD/schema/sql"` 以添加元数据存储。此前被丢弃的元数据
需要重新加载金融工具定义才能恢复。

## 订单能力 {#order-capability}

下表详列各受支持 Binance 产品的订单类型、执行指令与有效期选项。

### 订单类型 {#order-types}

| 订单类型                 | Spot | USDT 合约  | 币本位合约 | 备注                                    |
| ---------------------- | ---- | ------------ | ------------ | --------------------------------------- |
| `MARKET`               | ✓    | ✓            | ✓            | 报价数量支持：仅 Spot。                  |
| `LIMIT`                | ✓    | ✓            | ✓            |                                         |
| `STOP_MARKET`          | ✓    | ✓            | ✓            | Spot 发送 Binance `STOP_LOSS`。          |
| `STOP_LIMIT`           | ✓    | ✓            | ✓            | Spot 发送 Binance `STOP_LOSS_LIMIT`。    |
| `MARKET_IF_TOUCHED`    | ✓    | ✓            | ✓            | Spot 发送 Binance `TAKE_PROFIT`。        |
| `LIMIT_IF_TOUCHED`     | ✓    | ✓            | ✓            | Spot 发送 Binance `TAKE_PROFIT_LIMIT`。  |
| `TRAILING_STOP_MARKET` | -    | ✓            | ✓            | 仅 Futures。                             |

Binance Spot 在 `exchangeInfo` 中按 symbol 发布受支持的订单类型集合。adapter 不按该集合过滤，
因此带该 symbol 不支持类型的 Spot 条件单会被交易所拒绝，而不是被 adapter 本地拒绝。

### 执行指令 {#execution-instructions}

| 指令          | Spot | USDT 合约  | 币本位合约 | 备注                                                      |
| ------------- | ---- | ------------ | ------------ | --------------------------------------------------------- |
| `post_only`   | ✓    | ✓            | ✓            | 限制见下文。                                               |
| `reduce_only` | -    | ✓            | ✓            | 仅 Futures；对冲模式下转换为 `positionSide`。               |

One-way 模式下 adapter 发送 Binance 的 `reduceOnly` 字段。Binance 在对冲模式下不接受该字段，
因此 adapter 改为选择平仓方向的 `positionSide`。这让订单留在已标识的一侧，防止打开相反方向的
持仓。网络层限制见 Binance 的 [New Order API](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/New-Order)。

#### Post-only 限制 {#post-only-restrictions}

只有*限价*订单类型支持 `post_only`。

| 订单类型     | Spot | USDT 合约  | 币本位合约 | 备注                                                |
| ------------ | ---- | ------------ | ------------ | --------------------------------------------------- |
| `LIMIT`      | ✓    | ✓            | ✓            | Spot 使用 `LIMIT_MAKER`，Futures 使用 `GTX` TIF。    |
| `STOP_LIMIT` | -    | ✓            | ✓            | 仅 Futures。                                         |

### 有效期 {#time-in-force}

| 有效期        | Spot | USDT 合约  | 币本位合约 | 备注                                      |
| ------------- | ---- | ------------ | ------------ | ----------------------------------------- |
| `GTC`         | ✓    | ✓            | ✓            | 撤销前有效。                               |
| `GTD`         | ✓*   | ✓            | ✓*           | *非默认的本地映射，实际发送 `GTC`。         |
| `FOK`         | ✓    | ✓            | ✓            | 全部成交或撤销。                           |
| `IOC`         | ✓    | ✓            | ✓            | 立即成交其余撤销。                         |

#### GTD 策略 {#gtd-policy}

[Binance Spot 的有效期取值](https://github.com/binance/binance-spot-api-docs/blob/master/enums.md)
只有 `GTC`、`IOC` 与 `FOK`。Spot 没有原生 `GTD` 或 `goodTillDate`。

USD-M 对 `LIMIT` 以及 `STOP` 和 `TAKE_PROFIT` 的限价形式支持原生 `GTD`。adapter 将普通订单
经 HTTP 或 WebSocket 交易通道发出，独立批次经 HTTP `batchOrders`，条件 algo 订单经 HTTP
`algoOrder`。Binance 的 WebSocket algo schema 包含 `goodTillDate`，但其 `timeInForce` 枚举
不含 `GTD`，因此 adapter 不通过该端点路由 GTD algo 订单。

COIN-M 文档中的订单 API 没有原生 `GTD` 值或 `goodTillDate` 参数。参见官方
[USD-M 交易 API](https://developers.binance.com/en/docs/catalog/core-trading-derivatives-trading-usd-s-m-futures/api/rest-api/trade)
和
[COIN-M 通用定义](https://developers.binance.com/en/docs/products/derivatives-trading-coin-futures/common-definition)。

USD-M 的 `goodTillDate` 是毫秒级 epoch 时间戳，Binance 会忽略其中的亚秒部分。若过期时间不在
整秒边界上，Nautilus 直接拒绝，而非静默取整。过期时间必须严格大于当前时间加 600 秒，且严格
小于 `253402300799000`。原生 GTD 还会拒绝市价单、post-only 订单，以及任何没有过期时间的订单。

`use_gtd=True` 是默认值：使用原生 USD-M GTD，并在 Spot 和 COIN-M 上拒绝原生 GTD。仅当提交订单
的策略设置了 `manage_gtd_expiry=True` 时才将 `use_gtd` 设为 `False`。此时 adapter 发出警告并
发送 `GTC`，由 Nautilus 在本地过期时刻撤单。

### 高级订单特性 {#advanced-order-features}

| 特性         | Spot | USDT 合约  | 币本位合约 | 备注                                       |
| ------------------ | ---- | ------------ | ------------ | ------------------------------------------- |
| 订单修改           | ✓    | ✓            | ✓            | 仅 `LIMIT` 订单可改价格与数量。              |
| OCO 订单           | ✓    | -            | -            | Spot OCO 经 `orderList/oco` 提交。           |
| 括号订单           | -    | -            | -            | *计划中*。当前提交时会被拒绝。               |
| 冰山订单           | ✓    | -            | -            | Spot 的 `icebergQty` 取自 `display_qty`。    |

### 批量操作 {#batch-operations}

| 操作         | Spot | USDT 合约  | 币本位合约 | 备注                                       |
| ------------ | ---- | ------------ | ------------ | --------------------------------------- |
| 批量提交     | ✓    | ✓            | ✓            | Spot OCO 或 Futures `batchOrders`。      |
| 批量修改     | -    | -            | -            | 未实现。                                  |
| 批量撤销     | -*   | ✓            | ✓            | *Spot 回退为逐笔撤销。                    |

#### 撤销全部订单的行为 {#cancel-all-orders-behavior}

默认情况下，`Strategy.cancel_all_orders()` 对该策略关联的订单逐笔发送撤销。使用
`strategy_only=False` 时，策略向 adapter 发送一条范围更大的 `CancelAllOrders` 命令。adapter
会同时纳入 open 和 inflight（SUBMITTED）状态的订单，因此也会撤销 Binance 尚未确认的订单。

**多策略安全**：多个策略交易同一金融工具时，adapter 将发起策略关联的订单与该金融工具的全部
订单比对。若全部订单都属于该策略，则使用一次 cancel-all API 调用；否则按策略分别发送撤销
（普通订单用批量，algo 订单逐笔），避免影响其他策略。

**方向过滤**：带 `order_side` 的 `CancelAllOrders` 命令只撤销该金融工具指定方向的挂单。
Spot 对每笔匹配的订单各发一笔撤销；Futures 将普通订单批量处理、algo 订单逐笔撤销。带方向的
请求只在挂单中筛选，因此 Binance 尚未确认的 inflight（`SUBMITTED`）订单不会被它撤掉。
要覆盖这类订单，需使用不带方向的 cancel-all。

**Futures algo 订单**：条件订单类型（`STOP_MARKET`、`STOP_LIMIT`、`TAKE_PROFIT`、
`TAKE_PROFIT_MARKET`、`TRAILING_STOP_MARKET`）需要使用不同的撤销端点。adapter 会自动路由到
正确端点。algo 订单触发并转为普通订单后，改用标准撤销端点。

**使用的端点**：

| 产品       | 普通订单                        | Algo 订单（批量）                | Algo 订单（逐笔）             |
| ------------ | ------------------------------- | -------------------------------- | --------------------------- |
| Spot         | `DELETE /api/v3/openOrders`     | N/A                              | N/A                         |
| USDT 合约    | `DELETE /fapi/v1/allOpenOrders` | `DELETE /fapi/v1/algoOpenOrders` | `DELETE /fapi/v1/algoOrder` |
| 币本位合约   | `DELETE /dapi/v1/allOpenOrders` | `DELETE /dapi/v1/algoOpenOrders` | `DELETE /dapi/v1/algoOrder` |

#### 提交、修改与撤销的重试策略 {#submit-modify-and-cancel-retry-policy}

执行客户端对每条提交、修改、撤销命令只发送一次。首次请求可能已到达撮合引擎，因此超时、网络
故障或 Binance 返回未知状态时不会盲目重试。重试可能产生重复订单或重复施加第二次修改。

- 本地提交校验失败在发送前发出 `OrderDenied`。本地修改校验失败发出 `OrderModifyRejected`。
  交易所的明确拒绝发出对应的拒绝事件。
- 传输结果不明确时订单保持 inflight 状态，由私有流或 REST 对账确定结果。交易所结果未知期间，
  adapter 不会发出虚假的拒绝事件。
- Futures algo 撤单可能从触发前的 algo 端点回退到普通订单端点。这是订单触发后的端点切换，
  不会向同一端点重复发送同一条撤单。
- 命令结果不明确期间，策略代码不得重新提交。等待对账，或按 client order ID 查询订单。

`BinanceDataClientConfig` 和 `BinanceExecutionClientConfig` 为 HTTP GET 请求暴露
`max_retries`、`retry_delay_initial_ms` 和 `retry_delay_max_ms`。瞬时读取失败按有界指数退避
重试，并刷新认证字段。交易所的 `Retry-After` 头决定最小延迟，可能超过 `retry_delay_max_ms`。
重试总预算固定为 180 秒。当所需等待超过剩余预算时，请求直接返回交易所错误，不再等待。

这些设置不会重试订单命令，因为重发结果不明确的命令可能重复下单或重复修改。

### 持仓管理 {#position-management}

| 功能           | Spot | USDT 合约  | 币本位合约 | 备注                                       |
| ---------------- | ---- | ------------ | ------------ | --------------------------------------- |
| 查询持仓         | -    | ✓            | ✓            | 实时持仓更新。                            |
| 持仓模式         | -    | ✓            | ✓            | One-Way 与 Hedge 模式（持仓 ID）。         |
| 杠杆控制         | -    | ✓            | ✓            | 按 symbol 动态调整杠杆。                   |
| 保证金模式       | -    | ✓            | ✓            | 按 symbol 选择全仓或逐仓。                 |

Binance Futures 对超出范围的持仓 symbol 记 debug 日志，并在解析前丢弃。其余行对应的功能在
持仓报告生成时，若金额无法解析会发出警告；平掉零持仓后，无法解析的金融工具及其他转换失败同样
警告。只要有任一持仓失败，`generate_position_status_reports` 就返回带失败数量的错误，而非
不完整的数据集。参见[金融工具可用性](./../concepts/execution/reconciliation.md#instrument-availability)。

### 风险事件 {#risk-events}

| 功能           | Spot | USDT 合约  | 币本位合约 | 备注                                     |
| -------------------- | ---- | ------------ | ------------ | ---------------------------------- |
| 强平处理             | -    | ✓            | ✓            | 交易所强制平仓。                     |
| ADL 处理             | -    | ✓            | ✓            | 自动减仓（Auto-Deleveraging）事件。   |

Binance Futures 会针对风险事件生成交易所订单：

- **强平**：保证金不足以维持持仓时，Binance 按破产价强制平仓。这些订单的 client ID 以
  `autoclose-` 开头。
- **ADL（自动减仓）**：保险基金耗尽时，Binance 平掉盈利持仓以覆盖亏损。这些订单的 client ID
  前缀为 `adl_autoclose`。
- **结算（USD-M）**：资金费率与保证金结算订单的 client ID 以 `settlement_autoclose-` 开头。
- **交割（COIN-M）**：到期的交割合约自动平仓，client ID 以 `delivery_autoclose-` 开头。
- **保险基金**：保险基金承接时使用 `NEW_INSURANCE` 状态（公开 changelog 已弃用，但线上流量
  中仍可见）。

adapter 通过 client ID 模式识别这些特殊订单类型（先于执行类型判断），随后：

1. 记录带订单详情的 warning 日志，便于监控。
2. 生成含正确成交明细、流动性方向为 TAKER 的 `FillReport`。
3. 生成用于对账的 `OrderStatusReport`。

上游参考：

- [USDT-M `ORDER_TRADE_UPDATE`](https://developers.binance.com/docs/derivatives/usds-margined-futures/user-data-streams/Event-Order-Update)
- [COIN-M `ORDER_TRADE_UPDATE`](https://developers.binance.com/docs/derivatives/coin-margined-futures/user-data-streams/Event-Order-Update)

订单不在缓存中时，执行引擎根据运行时状态报告创建外部订单。这覆盖首次出现的交易所生成订单
（实时强平或 ADL 事件的典型情形）。引擎通过金融工具的活跃外部订单声明分配该订单，或按
`external_order_instrument_ids` 的初始配置分配，默认分配给 `EXTERNAL` 策略。

:::note
状态报告与成交报告打包为单个 `OrderWithFills` 执行报告发出。引擎依据状态报告创建外部订单，
随后应用真实成交，保留交易所的 `trade_id` 与 `commission`。打包成交未覆盖的剩余数量，按状态
报告的 `avg_px` 以推断成交补足。
:::

#### 手续费估算 {#commission-estimation}

Binance 的成交事件省略手续费字段（`N`/`n`）时，adapter 按计价货币以
`default_taker_fee * qty * price` 估算手续费。这只适用于 USD-M 线性合约。COIN-M 反向合约
以零手续费作为回退，因为线性公式未考虑合约大小。在 `BinanceExecutionClientConfig` 上配置
`default_taker_fee` 以匹配你的费率档位（默认：0.0004 / 0.04%）。

### 订单查询 {#order-querying}

| 功能             | Spot | USDT 合约  | 币本位合约 | 备注                             |
| -------------------- | ---- | ------------ | ------------ | ------------------------------ |
| 查询挂单             | ✓    | ✓            | ✓            | 列出全部活跃订单。               |
| 查询订单历史         | ✓    | ✓            | ✓            | 历史订单数据。                   |
| 订单状态更新         | ✓    | ✓            | ✓            | 实时订单状态变化。               |
| 成交历史             | ✓    | ✓            | ✓            | 执行与成交报告。                 |

#### Futures 成交历史保留期 {#futures-trade-history-retention}

Binance 保留 USD-M 与 COIN-M 最近三个月的账户成交记录，但未说明这是自然月还是固定时长，
因此 adapter 以最近 88 天作为完整的 Futures 成交历史窗口。

`generate_fill_reports` 拒绝早于该窗口的显式起点。边界取命令的 `ts_init`，并限制其最多落后
当前客户端时间 12 小时。指定结束时间时必须同时提供开始时间。

对 mass status，`reconciliation_lookback_mins` 未设置或超过完整窗口时，按完整窗口处理。
返回的 `ExecutionMassStatus` 将 `lookback_start` 设为实际采用的边界，`reports_complete` 设为
`false`。参见[mass-status 历史契约](./../concepts/execution/reconciliation.md#mass-status-history-contract)。
Binance Spot 不受影响。参见 Binance
[Futures 变更日志](https://developers.binance.com/en/docs/products/derivatives-trading-usds-futures/change-log)。

### 或有订单 {#contingent-orders}

| 功能             | Spot | USDT 合约  | 币本位合约 | 备注                                         |
| ------------------ | ---- | ------------ | ------------ | -------------------------------------------- |
| 订单列表           | ✓    | ✓            | ✓            | Spot OCO 列表；Futures 独立批次。             |
| OCO 订单           | ✓    | -            | -            | 仅 Spot，经 `orderList/oco`。                 |
| 括号订单           | -    | -            | -            | *计划中*。当前提交时会被拒绝。                 |
| 条件订单           | ✓    | ✓            | ✓            | 止损与触及即成交订单。                         |

### 订单参数 {#order-parameters}

调用 `Strategy.submit_order`（Python）时传入 `params` 字典，或在 `SubmitOrder` 命令（Rust）
上设置 `Params`，可定制单笔订单。Binance 执行客户端识别：

| 参数             | 类型   | 产品            | 用途                                             | 限制                                                                                    |
| ---------------- | ------ | ----------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `price_match`    | `str`  | USDT/币本位合约   | 将价格选择交给 Binance。                          | 仅 `LIMIT`；不能与 `post_only` 同用。                                                     |
| `close_position` | `bool` | USDT/币本位合约   | 触发时平掉整个持仓。                              | 仅 `StopMarket` 与 `MarketIfTouched`；需 `reduce_only=true`；不能用于订单列表。           |
| `rpi`            | `bool` | USDT 合约         | 提交 RPI（零售价格改进）订单。                    | 仅 `LIMIT`；需 `post_only=true`；仅限单笔订单。                                           |

完整行为见[价格匹配](#price-match)、[RPI](#rpi) 与[平仓](#close-position)。

### 价格匹配 {#price-match}

Binance Futures 通过 `priceMatch` 参数支持 BBO（最优买卖价）价格匹配，把价格选择交给交易所。
限价单无需指定确切价位，即可动态按最优价加入订单簿。

使用 `price_match` 提交限价单时，带上用于本地风险检查的参考价。Binance 根据市场状态与价格匹配
模式确定实际挂单价。

#### 合法的价格匹配值 {#valid-price-match-values}

| 取值          | 行为                                                         |
| ------------- | -------------------------------------------------------------- |
| `OPPONENT`    | 挂到对手侧的最优价。                                           |
| `OPPONENT_5`  | 挂到对手侧价格，但允许最多 5 个 tick 的偏移。                   |
| `OPPONENT_10` | 挂到对手侧价格，但允许最多 10 个 tick 的偏移。                  |
| `OPPONENT_20` | 挂到对手侧价格，但允许最多 20 个 tick 的偏移。                  |
| `QUEUE`       | 挂到同侧最优价排队（保持 maker）。                              |
| `QUEUE_5`     | 排到同侧队列，偏移最多 5 个 tick。                              |
| `QUEUE_10`    | 排到同侧队列，偏移最多 10 个 tick。                             |
| `QUEUE_20`    | 排到同侧队列，偏移最多 20 个 tick。                             |

:::info
更多细节见[官方文档](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api)。
:::

#### 事件序列 {#event-sequence}

订单带 `price_match` 提交时：

1. Nautilus 带 `priceMatch` 参数发送订单，API 请求中省略限价价格。
2. Binance 接受订单并确定实际挂单价格。
3. Nautilus 发出 `OrderAccepted` 事件。
4. 若 Binance 接受的价格与参考价不同，Nautilus 发出 `OrderUpdated` 事件，携带实际挂单价格。
5. Nautilus 缓存中的订单价格与 Binance 接受的价格保持一致。

#### 示例 {#example}

```python
order = strategy.order_factory.limit(
    instrument_id=InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),
    order_side=OrderSide.BUY,
    quantity=Quantity.from_int(1),
    price=Price.from_str("65000"),  # Reference price for local risk checks
)

strategy.submit_order(
    order,
    params={"price_match": "QUEUE"},
)
```

:::note
若 Binance 以不同价格接受订单（例如 64,995.50），你会先收到 `OrderAccepted` 事件，随后收到
带新价格的 `OrderUpdated` 事件。
:::

### RPI {#rpi}

Binance RPI（Retail Price Improvement，零售价格改进）使用 `timeInForce=RPI`。它是 post-only
的，只与来自 Binance App 或 Web 的合资格零售订单撮合。

Nautilus 通过 Binance 专有的 `rpi` 参数暴露该能力。只能用于 `post_only=true` 的 USD-M LIMIT
订单，且只支持单笔 `SubmitOrder` 命令，`SubmitOrderList` 会被拒绝。不带 `rpi` 的普通
post-only 订单仍使用 `GTX`。交易所侧细节见 Binance 的
[USD-M Futures API 定义](https://developers.binance.com/docs/derivatives/usds-margined-futures/common-definition)。

RPI 仅对 `GET /fapi/v1/exchangeInfo` 响应中 `permissionSets` 包含 `RPI` 的 symbol 可用。
提交 RPI 订单前先确认 symbol 资格。参见 Binance 的
[RPI 指南](https://www.binance.com/en/support/faq/detail/92c83c53173947c4a44f9a7277c3b9ce)。

Rust 示例假定 `order` 是合资格 symbol 的 post-only LIMIT 订单。Python 侧需把 `instrument_id`
设为合资格金融工具，并按其交易规则选择 `quantity`（`Quantity`）与 `price`（`Price`）。

```rust tab="Rust"
use nautilus_core::params::Params;

let mut params = Params::new();
params.insert("rpi".to_string(), true.into());
self.submit_order(order, None, None, Some(params))?;
```

```python tab="Python"
order = strategy.order_factory.limit(
    instrument_id=instrument_id,
    order_side=OrderSide.BUY,
    quantity=quantity,
    price=price,
    post_only=True,
)

strategy.submit_order(order, params={"rpi": True})
```

### 平仓 {#close-position}

Binance Futures 的条件订单支持 `closePosition`，触发时平掉整个持仓。触发时 Binance 在服务端
按当前持仓大小确定数量。参见官方
[USD-M Algo Service API](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/New-Algo-Order)
和 [COIN-M Algo Service API](https://developers.binance.com/docs/derivatives/coin-margined-futures/trade/rest-api/New-Algo-Order)。

与 `reduce_only` 不同，`closePosition` 会跟随持仓大小变化；持仓以其他方式关闭时，Binance 会
自动撤销该订单。

在 Nautilus 的 `StopMarket` 或 `MarketIfTouched` 订单上设置 `reduce_only=true`，再在其
`params` 中传入 `close_position=true`。reduce-only 标志记录订单的平仓意图，交易状态为
`REDUCING` 时它是订单通过校验的必要条件。adapter 把这一组合翻译为 Binance 的全平指令，并
拒绝在订单列表中使用 `close_position`。

在风险引擎配置中允许 Binance 的整仓退出：

```python
from nautilus_trader.adapters.binance import BINANCE_VENUE
from nautilus_trader.config import LiveRiskEngineConfig

risk_engine = LiveRiskEngineConfig(
    full_position_exit_venues=[BINANCE_VENUE],
)
```

允许列表默认为空。没有该条目时，占位数量会像普通订单一样接受最小数量、最大数量和名义价值
检查。提交订单时传入持仓 ID，风险引擎才能验证这次退出是在减少该持仓。

```rust tab="Rust"
let params = Params::from([("close_position", true.into())]);
self.submit_order(order, Some(position.id), None, Some(params))?;
```

```python tab="Python"
strategy.submit_order(
    order,
    position_id=position.id,
    params={"close_position": True},
)
```

:::info
Nautilus 订单必须设置 `reduce_only=true`，但 Binance 不允许 `closePosition=true` 与其
`reduceOnly` 字段同时使用。因此 adapter 发送 `closePosition=true`，同时在 Binance 请求中
省略 `quantity` 和 `reduceOnly`。对冲模式下还会发送平仓方向的 `positionSide`。

对已列入允许列表的场所，风险引擎仍会校验数量精度与正数、触发价、订单形态与方向，以及关联的
持仓。它不会把最小/最大数量和名义价值边界应用到占位数量上。
:::

:::warning
只有当场所配置的执行客户端强制执行整仓平仓语义时才添加该场所。不解析 `close_position` 的执行
客户端可能只按标准 reduce-only 路径提交占位数量，而不是平掉整个持仓。
:::

### 移动止损 {#trailing-stops}

在 Binance 上使用移动止损市价单时：

- 用 `activation_price`（可选）指定移动机制的激活时刻。
- 省略时，Binance 以提交时的当前市场价为准。
- 回撤比率用 `trailing_offset`，配 `TrailingOffsetType.BASIS_POINTS`。adapter 拒绝其他偏移
  类型，也拒绝超出 Binance 0.1% 至 10% 范围的回撤比率。

:::warning
移动止损订单不要用 `trigger_price`：会直接报错。改用 `activation_price`。
:::

## Link & Trade {#link--trade}

adapter 为支持的 client order ID 加上 NautilusTrader 集成 ID 前缀，以适配 Binance 的
[Link and Trade](https://www.binance.com/en/support/faq/detail/a78a065d0c4846aaa1af474d8e712ab9)
计划。无需用户做任何配置。

adapter 会压缩外发的 `ClientOrderId` 以适配 Binance 的 36 字符上限，并在事件到达策略前解码
入站事件。支持的格式包括数字工厂 ID、UUID，以及带短字母数字交易者/策略标签的连字符工厂 ID，
例如 `O-20260922-160119-V2-000-8`。

短标签格式中，一个标签支持一到两个 ASCII 字母或数字，另一个标签必须是 `[0, 1023]` 内的数字
值并至少补零到三位。计数支持 `[0, 4194303]` 且不含前导零，时间戳范围为 UTC
`[2020-01-01 00:00:00, 2156-02-07 06:28:15]`。`use_uuid_client_order_ids` 可选项。

不超过 24 字节的自定义 ID 无需压缩。更长且不支持的 ID，adapter 记录 warning 并原样发送不带
前缀的 ID。Binance 的长度与字符限制仍然适用。

### 升级后的存量订单 {#existing-orders-after-an-upgrade}

现有的数字、UUID 和原始前缀编码保持不变。解码器同时接受历史的无前缀 ID。对带短标签 ID 但
没有交易所订单 ID 的存量订单操作，adapter 会同时查询其编码形式与历史无前缀形式。若两者分别
指向不同订单，该操作会被判为歧义并拒绝。

修改与撤单使用找回的交易所订单 ID。Spot 的撤销-替换（cancel-replace）在替换同一逻辑订单时
保留原有网络上的 client order ID，包括以历史无前缀 ID 提交的订单。即使变更通过 WebSocket
传输，这些查找同样生效。

### 解码 client order ID {#decoding-client-order-ids}

直接查询 Binance（REST API、网页 UI 或自写 HTTP 代码）时，`clientOrderId` 字段是编码后的
形式。两个工具函数可还原出原始的 Nautilus `ClientOrderId`：

```python
from nautilus_trader.adapters.binance import (
    decode_binance_futures_client_order_id,
    decode_binance_spot_client_order_id,
)

# Encoded ID from a Binance REST response or the web UI
encoded = "x-TD67BGP9-T0000000000000"
original = decode_binance_spot_client_order_id(encoded)
# Returns "O-20200101-000000-000-000-0"

# Futures equivalent
encoded_futures = "x-aHRE4BCj-T0000000000000"
original_futures = decode_binance_futures_client_order_id(encoded_futures)
# Returns "O-20200101-000000-000-000-0"
```

不带 broker 前缀的字符串原样返回，因此对任意 `clientOrderId` 值调用都是安全的。

:::note
凡返回 `OrderStatusReport` 这类 Nautilus 类型的地方，adapter 都会自动解码。只有在 adapter
之外工作时才需要手动解码：直接 REST 查询、Binance 网页 UI 或原始交易所报文。
:::

## 订单簿 {#order-books}

订单簿可维护全量或局部深度。增量深度流及其更新频率随产品和 Spot 传输方式而异：

| 产品 / 传输方式   | 增量深度流           | 更新频率         |
| ------------------- | -------------------- | ---------------- |
| Spot SBE            | `<symbol>@depth`     | 25ms             |
| Spot JSON           | `<symbol>@depth`     | 1000ms（默认）   |
| Futures             | `<symbol>@depth@0ms` | 不限速           |

簿订阅发出的快照（无论来自 REST 种子还是局部深度帧）都带以下标志：

- 每个快照 delta 都带 `F_SNAPSHOT`，最后一个 delta 带 `F_SNAPSHOT | F_LAST`。
- 无档位的快照表现为单条 `Clear`，清空订单簿。

### Futures L2 订阅 {#futures-l2-subscriptions}

`L2_MBP` 订阅的深度决定使用哪条流：

| 深度                        | 流                           | 簿数据来源                |
| --------------------------- | ------------------------------ | ------------------------- |
| 5、10 或 20                 | `<symbol>@depth<levels>@100ms` | 每条消息自带快照          |
| 缺省、50、100、500 或 1000  | `<symbol>@depth@0ms`           | REST 快照，随后增量       |
| 其他任意值                  | 无                             | 拒绝                      |

- **局部深度**：Binance 仅提供 5、10、20 档的局部深度流。每条消息以 `Clear` delta 加快照档位
  的形式给出双方快照，因此会移除不存在的价位，且每侧最多保留请求的档数。这类订阅从不请求
  REST 快照，重连后也一样。
- **增量深度**：深度参数只限制初始、重连和恢复时的 REST 快照，不限制维护中的订单簿。省略该
  参数时选择 1000 档快照，后续更新可以在该深度之外继续增加档位。

`OrderBook.bids(depth=...)` 与 `OrderBook.asks(depth=...)` 访问器只限制返回结果，不会删除
已存储的档位。变更某金融工具的订阅深度前，先退订。

### Spot L2 订阅 {#spot-l2-subscriptions}

Spot 局部深度订阅下发自包含的 top-N 快照。受支持的深度取决于
[Spot 行情模式](#spot-market-data-mode)：

| 深度                                    | JSON                     | SBE                |
| --------------------------------------- | ------------------------ | ------------------ |
| 5 或 10                                 | `<symbol>@depth<levels>` | 拒绝；改用 JSON    |
| 20                                      | `<symbol>@depth20`       | `<symbol>@depth20` |
| 缺省（增量深度）                        | `<symbol>@depth`         | `<symbol>@depth`   |
| 其他任意值，含 50、100、500、1000       | 拒绝                     | 拒绝               |

- 被拒绝的深度在订阅前就会失败。JSON 模式下错误信息会列出合法深度。
- 增量深度订阅以 5000 档 REST 快照作为种子。
- 变更某金融工具的订阅深度前先退订。新的局部深度订阅不会移除之前的流。

### L1 盘口订阅 {#l1-top-of-book-subscriptions}

`L1_MBP` 订阅要求深度为 1，使用 Spot 的 `bestBidAsk` 或 `bookTicker` 流以及 Futures 的
`bookTicker` 流。每次更新发出常规 `QuoteTick`，以及一个带 `F_MBP` 标志的双边
`OrderBookDeltas` 批次，使托管的 L1 簿获得同样的盘口状态。

盘口与 L1 订阅通过引用计数共用同一场所流。同一金融工具上 L1 与 L2 并发订阅会被客户端拒绝。

### 快照请求 {#snapshot-requests}

显式订单簿快照请求独立于订阅同步：

- **Spot**：深度范围 [1, 5000]。
- **Futures**：深度为 5、10、20、50、100、500 或 1000。

### 快照同步与恢复 {#snapshot-synchronization-and-recovery}

Futures 增量深度订阅，以及未指定显式深度的 Spot `L2_MBP` 订阅，会保持增量深度流处于订阅状态，
并通过[共享簿恢复机制](./../developer_guide/adapters.md#order-book-recovery-ownership)用
REST 快照为簿播种。

#### 同步 {#synchronization}

同步在订阅或数据 WebSocket 重连后的第一条增量处启动：

1. 缓冲增量并请求 REST 快照。
1. 丢弃被快照 `lastUpdateId` 覆盖的缓冲增量。
1. 剩余增量必须紧接快照之后，否则重新请求快照。
1. 先把快照发送到 `DataEngine`，再发送剩余的缓冲增量。
1. 之后每条增量发送前先与上一条校验衔接。

每条增量必须紧接快照或上一条增量：

| 产品    | 快照后的第一条增量            | 后续增量              |
| ------- | ----------------------------- | --------------------- |
| Spot    | `U <= lastUpdateId + 1`       | `U <= previous u + 1` |
| Futures | `U <= lastUpdateId <= u`      | `pu == previous u`    |

违反这些规则的增量即为序列缺口：停止输出簿数据，缓冲增量，并在不重新订阅的情况下请求新快照。
解析失败的增量会在下一条增量处表现为缺口。

#### 恢复限制 {#recovery-limits}

- **快照超时**：`book_snapshot_timeout_secs`（默认 **10 秒**）限定每次快照请求的期限。设为
  `0` 则交由 HTTP 客户端超时控制。
- **重试预算**：每次恢复在 **180 秒内最多尝试 8 次快照**，采用指数退避加抖动。预算耗尽后按
  从 1 分钟翻倍至 15 分钟的间隔继续重试。请求永久失败则直接进入该间隔。
- **重连**：重连后从新流重新同步，仍在进行的恢复保留其剩余预算。预算耗尽后处于等待间隔的
  恢复会立即重试一次。该恢复的下一次快照可以在新流交付增量之前为簿播种，此时第一条增量必须
  紧接该快照。
- **持续失败**：恢复持续进行，直到某个快照能衔接缓冲的增量，或该簿被退订。其他簿各自独立继续。

#### 快照限速 {#snapshot-pacing}

快照请求消耗每个客户端在场所属请求权重预算中的份额。重连后的一波重新同步会等待预算，而不是
超出预算：

| 产品    | 快照预算        | 突发（预算的一半）   | 单次全量快照开销   |
| ------- | ---------------- | ----------------------- | ------------------ |
| Spot    | 3,000 / 分钟     | 1,500                   | 250（5000 档）     |
| Futures | 1,200 / 分钟     | 600                     | 20（1000 档）      |

- 首个快照的排队不消耗恢复的重试次数和 180 秒预算。
- 显式快照请求消耗同一预算。
- HTTP 客户端对失败快照请求的重试不受限速控制。

### 实时恢复验证 {#live-recovery-validation}

`binance-book-stress` 压力测试工具用于验证簿同步与恢复的改动。它连接所选产品的行情数据，不
提交任何订单。它按簿流契约和两个独立基准校验输出的订单簿：

- 场所在匹配更新 ID 处的 `<symbol>@depth20@100ms` 流。
- 由原始增量与转发的 REST 快照重建的参考簿。

该工具通过丢弃增量制造缺口，使 REST 快照失败、延迟、被拒，切断并冻结连接，请求重连，频繁
切换订阅。它的 REST 代理在场所属请求权重接近上限前拒绝快照请求；若被场所限流，本轮运行判为
失败。

在仓库根目录运行：

```bash
CARGO_BUILD_JOBS=16 bash scripts/strip-adapter-env.bash \
  cargo test -p nautilus-binance --features examples --test binance-book-stress -- --product futures
```

`--product` 选择场所：

| 产品             | 场所                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| `spot`（默认）   | Spot 主网 JSON 流。                                                          |
| `spot-sbe`       | Spot 主网 SBE 流；读取 `BINANCE_API_KEY` 与 `BINANCE_API_SECRET`。           |
| `futures`        | USD-M 测试网。                                                               |
| `coinm`          | COIN-M 测试网。                                                              |

运行 `spot-sbe` 时不要带 `strip-adapter-env.bash`，它会清除所需的 API key。

`--scenario` 选择运行方式：

- `churn`（默认）：轮换缺口、重连、订阅切换、切断、冻结等故障。
- `boundaries`：探测快照截止期、重试耗尽进入重试上限，以及永久拒绝。
- `resubscribe`：每轮让一次退订与立即重新订阅竞争。
- `quiet`：观察成交清淡的簿，每分钟一轮。
- `crowd`：订阅流动性好的簿，每轮重连一次，让快照限速生效。

`--timeout` 设置快照超时秒数，`0` 表示禁用快照截止期；`--rounds` 设置轮数（默认 14）；
`--books` 设置 `quiet` 与 `crowd` 按 24 小时成交量选取的簿数量（默认 4）。

该工具需要访问所选产品的 REST API 与 WebSocket 行情流。簿生命周期的自动化测试使用本地 mock
服务器。共享参数与输出格式见[压力测试工具](./../developer_guide/spec_data_testing.md#stress-harnesses)。

## 盘口时间戳 {#quote-timestamps}

`QuoteTick` 的 `ts_event` 字段随传输方式不同。Spot SBE 使用微秒级事件时间戳。Spot 公共 JSON 的
`bookTicker` 消息可能缺少事件时间戳，此时 adapter 使用 `ts_init`。Futures 使用成交时间。

## K 线与历史行情数据 {#bars-and-historical-market-data}

Spot 支持秒级 kline 的订阅与历史请求。实时 Spot kline 订阅要求
`spot_market_data_mode=Json`，因为 Binance 不在 Spot SBE 上发布 kline 或 ticker 流。Binance
Futures 拒绝秒级 kline，因为 Futures API 不提供。

已收市的场所 kline 会发出一个核心 `Bar` 和一个 `BinanceBar` 自定义数据事件。`BinanceBar` 保留
计价成交量、成交笔数、主动买入基础成交量与主动买入计价成交量。历史核心 bar 请求返回 `Bar`。
需要历史响应保留扩展字段时，用 `bar_type` 元数据请求 `BinanceBar` 自定义数据。

实时成交订阅在 Futures 上使用 `<symbol>@aggTrade` 流，因为 Binance 的 Futures WebSocket 只发布
聚合成交；在 Spot 上使用逐笔的 `<symbol>@trade` 流。

无边界的历史成交请求使用 recent-trades 端点。带时间边界的请求使用聚合成交，最多接受 1000 条，
因此数据源跟随请求而非配置项。Spot 把给定边界直接传给 `/api/v3/aggTrades`。Futures 接受任一端
边界落在最近 24 小时内；同时给出两端时，区间必须短于一小时。

历史核心 bar 请求接受外部聚合的时间 bar，并使用对应的场所 kline 端点。内部聚合的 bar 由
`DataEngine` 基于原始成交、盘口或源 bar 响应，通过 `bar_types` 请求参数构建，Binance 数据
客户端不做聚合。

## Binance 专有数据 {#binance-specific-data}

K 线、标记价格、指数价格与资金费率按常规方式订阅。下面的自定义数据类型暴露核心数据类型不携带
的场所专有字段。

Binance Futures 标记价格报文在 `BinanceFuturesMarkPriceUpdate` 中保留场所字段 `P` 预估结算价。
Nautilus 还会从同一条流发出标准的标记价格、指数价格和资金费率更新。USD-M 可选的 `ap` 移动平均
字段在传输层解析，但不作为领域数据或自定义数据暴露。

### `BinanceSpotTicker` {#binancespotticker}

Spot 24 小时 ticker 自定义数据要求公共 JSON 行情模式，并在元数据中给出 `instrument_id`：

```python
from nautilus_trader.adapters.binance import BinanceSpotTicker
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType

self.subscribe_data(
    data_type=DataType(
        BinanceSpotTicker.__name__,
        metadata={"instrument_id": "BTCUSDT.BINANCE"},
    ),
    client_id=ClientId.from_str("BINANCE"),
)
```

adapter 订阅该金融工具的 `@ticker` 流。SBE 模式会拒绝此订阅，因为 Binance Spot SBE 不提供
该流。

### `BinanceFuturesTicker` {#binancefuturesticker}

订阅特定 Futures 金融工具的 24 小时 ticker 统计：

```python
from nautilus_trader.adapters.binance import BinanceFuturesTicker
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType

client_id = ClientId.from_str("BINANCE")

self.subscribe_data(
    data_type=DataType(
        BinanceFuturesTicker.__name__,
        metadata={"instrument_id": "BTCUSDT-PERP.BINANCE"},
    ),
    client_id=client_id,
)
```

adapter 订阅该金融工具的 `@ticker` 流，并发出带
`metadata={"instrument_id": "<instrument_id>"}` 的 `BinanceFuturesTicker` 自定义数据。ticker
自定义数据必须带 `instrument_id`，不支持全市场 ticker 订阅。

### `BinanceFuturesMarkPriceUpdate` {#binancefuturesmarkpriceupdate}

在你的 actor 或策略中订阅 `BinanceFuturesMarkPriceUpdate`（含资金费率信息）：

```python
from nautilus_trader.adapters.binance import BinanceFuturesMarkPriceUpdate
from nautilus_trader.model import DataType
from nautilus_trader.model import ClientId

# In your `on_start` method
self.subscribe_data(
    data_type=DataType(
        BinanceFuturesMarkPriceUpdate.__name__,
        metadata={"instrument_id": str(self.instrument.id)},
    ),
    client_id=ClientId("BINANCE"),
)
```

收到的 `BinanceFuturesMarkPriceUpdate` 对象包装在 `CustomData` 中传入你的 `on_data` 方法。
用 `data.data` 解开负载并判断类型，因为该方法处理所有自定义/通用数据。

```python
from nautilus_trader.adapters.binance import BinanceFuturesMarkPriceUpdate
from nautilus_trader.model import CustomData


def on_data(self, data: CustomData) -> None:
    # Unwrap the payload, then check its type
    payload = data.data
    if isinstance(payload, BinanceFuturesMarkPriceUpdate):
        self.log.info(
            f"{payload.instrument_id} mark_price={payload.mark_price} "
            f"funding_rate={payload.funding_rate}",
        )
```

### `BinanceFuturesLiquidation` {#binancefuturesliquidation}

订阅强平更新，两种范围任选：

- 指定金融工具（`<symbol>@forceOrder`），或
- 全部 symbol（`!forceOrder@arr`），省略 `instrument_id` 即可。

```python
from nautilus_trader.adapters.binance import BinanceFuturesLiquidation
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType

client_id = ClientId.from_str("BINANCE")

# Instrument-specific
self.subscribe_data(
    data_type=DataType(
        BinanceFuturesLiquidation.__name__,
        metadata={"instrument_id": "BTCUSDT-PERP.BINANCE"},
    ),
    client_id=client_id,
)

# All-market (no instrument_id metadata)
self.subscribe_data(
    data_type=DataType(BinanceFuturesLiquidation.__name__),
    client_id=client_id,
)
```

按金融工具订阅时，`CustomData.data_type` 带
`metadata={"instrument_id": "<instrument_id>"}`。全市场订阅的数据类型不带元数据。

两种方式同时订阅时，全市场优先。全市场处于活动状态期间，adapter 暂停按 symbol 的强平流；
退订全市场后再恢复原先活跃的按 symbol 流。

### Futures 未平仓合约 {#futures-open-interest}

未平仓合约数据仅限请求。Futures 数据客户端没有未平仓合约订阅。两种类型都需要
`instrument_id` 元数据，`BinanceFuturesOpenInterestHist` 还需要 Binance 的 `period` 字符串，
例如 `"5m"`：

```python
from nautilus_trader.adapters.binance import BinanceFuturesOpenInterest
from nautilus_trader.adapters.binance import BinanceFuturesOpenInterestHist
from nautilus_trader.model import ClientId
from nautilus_trader.model import DataType

client_id = ClientId.from_str("BINANCE")

# Current open interest snapshot
self.request_data(
    data_type=DataType(
        BinanceFuturesOpenInterest.__name__,
        metadata={"instrument_id": "BTCUSDT-PERP.BINANCE"},
    ),
    client_id=client_id,
)

# Historical open interest series
self.request_data(
    data_type=DataType(
        BinanceFuturesOpenInterestHist.__name__,
        metadata={"instrument_id": "BTCUSDT-PERP.BINANCE", "period": "5m"},
    ),
    client_id=client_id,
)
```

`BinanceFuturesOpenInterestHist` 返回一批数据点，每个点携带一个桶的未平仓合约合计及其名义
价值。COIN-M 历史按 pair 与合约类型为键：永续由 symbol 推导，交割合约取自缓存的金融工具定义。

## 资金费率 {#funding-rates}

adapter 通过 `subscribe_funding_rates` 将 `FundingRateUpdate` 作为一等数据类型发出。数据来自
[Mark Price Stream](https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/Mark-Price-Stream)
WebSocket 端点，它随标记价格与指数价格一并提供当前资金费率和下次结算时间。三个订阅
（`subscribe_mark_prices`、`subscribe_index_prices`、`subscribe_funding_rates`）通过引用计数
共用一条 `@markPrice@1s` 流。

历史资金费率通过 `request_funding_rates` 获取，它查询
[Get Funding Rate History](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-History)
REST 端点（USD-M 为 `GET /fapi/v1/fundingRate`，COIN-M 为 `GET /dapi/v1/fundingRate`）。
每行历史记录映射为一个 `FundingRateUpdate`，`ts_event` 设为资金费结算时间。历史记录行的
`next_funding_ns` 字段为 `None`，因为端点不提供该值。

adapter 还通过 `BinanceFuturesMarkPriceUpdate` 自定义数据订阅暴露场所报文
（见 [Binance 专有数据](#binance-specific-data)）。

对 Binance 而言，`FundingRateUpdate.interval` 为 `None`。Mark Price Stream 与资金费率历史
端点都不包含资金费率周期字段。Binance 通过
[Get Funding Rate Info](https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Get-Funding-Rate-Info)
REST 端点暴露 `fundingIntervalHours`，但 adapter 不消费它。

## 金融工具状态轮询 {#instrument-status-polling}

数据客户端定期轮询 Binance `exchangeInfo`，检测金融工具交易状态的变化。当某个 symbol 在不同
状态间切换（例如从 Trading 到 Halt，或临近到期的期货合约从 Trading 进入 Delivering），adapter
发出 `InstrumentStatus` 事件。

轮询间隔默认 3,600 秒（60 分钟），可在数据客户端配置中用 `instrument_status_poll_secs` 调整。
设为 `0` 可完全禁用轮询。

初次连接时，adapter 用 exchange info 响应为状态缓存播种，不发事件。之后的轮询检测到状态变化
才发出 `InstrumentStatus` 事件。若某 symbol 从 exchange info 中消失（例如退市或合约到期后），
adapter 发出 `NotAvailableForTrading`。

状态轮询不会重新加载金融工具定义。独立的 `instrument_refresh_interval_secs` 任务执行完整的
带过滤目录加载：原子替换数据客户端与 WebSocket 查找表，然后把刷新后的金融工具发给数据引擎
并更新状态快照，同时刷新执行客户端的精度缓存。

完整刷新间隔默认 3,600 秒，设为 `0` 禁用。断开连接会取消该任务，重连时用新的取消令牌启动
一个替换任务。

### 状态映射 {#status-mapping}

#### Spot {#spot}

| Binance 状态     | MarketStatusAction     |
| ---------------- | ---------------------- |
| Trading          | Trading                |
| EndOfDay         | Close                  |
| Halt             | Halt                   |
| Break            | Pause                  |
| CancelOnly       | Halt                   |
| NonRepresentable | NotAvailableForTrading |

Binance US 改为轮询公共 JSON exchange info，其中 `TRADING` 映射为 `Trading`，`BREAK` 映射为
`Pause`，其余所有值映射为 `NotAvailableForTrading`。

#### Futures（USD-M） {#futures-usd-m}

| Binance 状态      | MarketStatusAction |
| ----------------- | ------------------ |
| Trading           | Trading            |
| PendingTrading    | PreOpen            |
| PreTrading        | PreOpen            |
| PostTrading       | PostClose          |
| EndOfDay          | Close              |
| Halt              | Halt               |
| AuctionMatch      | Cross              |
| Break             | Pause              |
| PreDelivering     | PreClose           |
| Delivering        | Close              |
| Delivered         | Close              |
| PreSettle         | PreClose           |
| Settling          | Close              |
| Close             | Close              |
| TradingHalt       | Halt               |
| TradingCancelOnly | Halt               |

#### Futures（COIN-M） {#futures-coin-m}

| Binance 状态      | MarketStatusAction     |
| ----------------- | ---------------------- |
| Trading           | Trading                |
| PendingTrading    | PreOpen                |
| PreDelivering     | PreClose               |
| Delivering        | Close                  |
| Delivered         | Close                  |
| PreSettle         | PreClose               |
| Settling          | Close                  |
| Close             | Close                  |
| PreDelisting      | PreClose               |
| Delisting         | Suspend                |
| Down              | NotAvailableForTrading |
| TradingHalt       | Halt                   |
| TradingCancelOnly | Halt                   |

未知的或未记录的 Futures 状态值映射为 `NotAvailableForTrading`。

:::note
只有连接时处于可交易状态的金融工具会被跟踪。连接时处于非交易状态的 symbol（例如已停牌）不会
出现在金融工具缓存中，因此它们的状态转变不在监控范围内。
:::

## 限流 {#rate-limiting}

Binance 采用基于固定时间窗的限流体系，请求权重按窗口统计（每分钟一个窗口，整点 :00 重置）。
每个 API 端点有对应的权重开销，总权重用量按 IP 地址统计。

### 场所权重上限 {#venue-weight-limits}

Binance 给每个 IP 的权重额度，下列端点开销从中扣减：

| 产品        | 权重上限     | 周期     |
| ----------- | ------------ | -------- |
| Spot/Margin | 6,000        | 1 分钟   |
| Futures     | 2,400        | 1 分钟   |

### 端点权重开销 {#endpoint-weight-costs}

Binance 对每类请求收取的权重：

| 端点                      | 权重   | 备注                                   |
| ------------------------- | ------ | -------------------------------------- |
| `/api/v3/order`           | 1      | Spot 下单。                             |
| `/api/v3/allOrders`       | 20     | Spot 历史订单（开销大）。               |
| `/api/v3/klines`          | 2+     | 随 `limit` 参数增长。                   |
| `/api/v3/depth`           | 5+     | 随 `limit` 增长；5000 档时为 250。      |
| `/fapi/v1/order`          | 1      | Futures 下单。                          |
| `/fapi/v1/algoOrder`      | 0      | 使用订单次数限额。                      |
| `/fapi/v1/allOrders`      | 20     | Futures 历史订单（开销大）。            |
| `/fapi/v1/commissionRate` | 20     | Futures 费率查询。                      |
| `/fapi/v1/klines`         | 5+     | 随 `limit` 参数增长。                   |
| `/fapi/v1/depth`          | 2+     | 随 `limit` 增长；1000 档时为 20。       |

USD-M Futures 的 `POST /fapi/v1/algoOrder` 同时从 `X-MBX-ORDER-COUNT-10S` 与
`X-MBX-ORDER-COUNT-1M` 各扣 `1`，且不消耗 IP 请求权重。adapter 出于本地限速模型的考虑，
仍把它排入全局桶。

### WebSocket API 限额 {#websocket-api-limits}

WebSocket API（用于下单与用户数据流）与 REST API 共享同一权重额度：

| 限额类型       | 取值   | 备注                                   |
| ---------------- | ------ | ------------------------------------- |
| 请求权重         | 共享   | 计入 REST API 权重额度。                |
| 握手             | 5      | 每次连接尝试的权重开销。                |
| Ping/pong 帧     | 5/秒   | ping/pong 最大速率。                    |

### adapter 限速 {#adapter-pacing}

adapter 在场所计量之前运行自己的令牌桶限流器。每个 HTTP 请求从按产品划分的请求桶取一个令牌，
每个订单操作额外从订单计数桶取一个令牌：

| 产品                       | 请求         | 订单操作                       |
| -------------------------- | ------------ | ---------------------------- |
| Spot                       | 1,200/分钟   | 10/秒，100,000/天             |
| Futures（USD-M 与 COIN-M） | 2,400/分钟   | 300/10 秒，1,200/分钟         |

订单计数桶覆盖该产品支持的全部订单操作，不只是下单：提交、OCO 提交、批量提交、algo 提交、
修改（Spot 的修改经撤销-替换实现）、批量修改、撤单、全撤、批量撤单、algo 撤单。撤单
频繁和改单频繁的策略同样受这些桶约束。非订单类认证请求，例如调整杠杆与保证金类型、维持
listen-key 的 keepalive，只消耗请求桶。

请求桶按调用次数计数而非权重，与场所的权重计量并不一致。连续调用高权重或动态权重端点
（权重 20 的 `/api/v3/allOrders`，或随 `limit` 增长的 `/klines`）时，场所权重的消耗快于本地
桶的记账。大规模历史请求可能需要人工控制节奏。实际场所用量可通过响应头
`X-MBX-USED-WEIGHT-*` 监控。订单簿快照请求还会等待权重感知的预算，见[快照限速](#snapshot-pacing)。

:::warning
超出允许的权重时 Binance 返回 HTTP 429。反复超限会触发临时 IP 封禁（屡犯者从 2 分钟逐步
升级到 3 天）。
:::

:::info
最新的限流参数可查询 `/api/v3/exchangeInfo`（Spot）或 `/fapi/v1/exchangeInfo`（Futures），
或参见：

- [Spot API 限额](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/limits)
- [Futures API 限额](https://developers.binance.com/docs/derivatives/usds-margined-futures/general-info)

:::

## 配置 {#configuration}

### 数据客户端 {#data-client}

| 选项                               | 默认值    | 说明                                                                            |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `product_type`                     | `Spot`    | `Spot`、`UsdM` 或 `CoinM` 之一。                                                |
| `environment`                      | `Live`    | `Live`、`Testnet` 或 `Demo` 之一。                                              |
| `base_url_http`                    | `None`    | 可选的 HTTP 端点覆盖。                                                          |
| `base_url_ws`                      | `None`    | 可选的行情 WebSocket 端点覆盖。                                                 |
| `api_key` / `api_secret`           | `None`    | Spot SBE 必需；公共 JSON 与 Futures 数据可选。                                  |
| `spot_market_data_mode`            | `Sbe`     | `Json` 保留无需凭据的 Global Spot 路径。Binance US 必须用 `Json`。               |
| `instrument_provider`              | 默认值    | 加载、过滤、解析警告与手续费率策略。                                            |
| `instrument_refresh_interval_secs` | `3,600`   | 完整目录刷新间隔；`0` 禁用。                                                    |
| `instrument_status_poll_secs`      | `3,600`   | 仅状态的 exchange-info 轮询间隔；`0` 禁用。                                     |
| `book_snapshot_timeout_secs`       | `10`      | 每次增量深度 REST 快照请求的期限；`0` 禁用。                                    |
| `proxy_url`                        | `None`    | 应用于 HTTP 与每条行情 WebSocket 连接的代理。                                   |
| `recv_window_ms`                   | `5,000`   | 签名 HTTP 接收窗口，闭区间 `1..=60000`。                                        |
| `max_retries`                      | `3`       | HTTP GET 请求最大重试次数。                                                     |
| `retry_delay_initial_ms`           | `1,000`   | HTTP 读取重试的初始延迟（毫秒）。                                               |
| `retry_delay_max_ms`               | `10,000`  | 指数退避的最大延迟；场所要求的最小值可能超过它。                                |
| `us`                               | `False`   | 将实时 Spot JSON 客户端路由到 Binance US。                                      |
| `transport_backend`                | `Sockudo` | WebSocket 传输后端。                                                            |

### 执行客户端 {#execution-client}

| 选项                               | 默认值    | 说明                                                                    |
| ---------------------------------- | --------- | ----------------------------------------------------------------------- |
| `account_id`                       | 必填      | Nautilus 账户标识。                                                     |
| `product_type`                     | `Spot`    | `Spot`、`UsdM` 或 `CoinM` 之一。                                        |
| `environment`                      | `Live`    | `Live`、`Testnet` 或 `Demo` 之一。                                      |
| `base_url_http`                    | `None`    | 可选的 HTTP 端点覆盖。                                                  |
| `base_url_ws`                      | `None`    | 可选的私有流覆盖。                                                      |
| `base_url_ws_trading`              | `None`    | 可选的 Global Spot 或 USD-M WebSocket 交易覆盖。                        |
| `use_ws_trading`                   | `True`    | 在支持的场合使用 Global WebSocket 下单；Binance US 使用 HTTP。          |
| `ws_trading_setup_timeout_ms`      | `10,000`  | WebSocket 交易认证与建立超时。                                          |
| `instrument_provider`              | 默认值    | 加载、过滤、解析警告与手续费率策略。                                    |
| `instrument_refresh_interval_secs` | `3,600`   | 执行端精度缓存刷新间隔；`0` 禁用。                                      |
| `proxy_url`                        | `None`    | 应用于 HTTP、私有流与 WebSocket 交易的代理。                            |
| `recv_window_ms`                   | `5,000`   | 签名 HTTP 与 WebSocket 接收窗口，闭区间 `1..=60000`。                   |
| `max_retries`                      | `3`       | HTTP GET 请求最大重试次数。                                             |
| `retry_delay_initial_ms`           | `1,000`   | HTTP 读取重试的初始延迟（毫秒）。                                       |
| `retry_delay_max_ms`               | `10,000`  | 指数退避的最大延迟；场所要求的最小值可能超过它。                        |
| `us`                               | `False`   | 将实时 Spot 执行客户端路由到 Binance US。                               |
| `api_key` / `api_secret`           | `None`    | Global 使用 Ed25519 WebSocket 认证；Binance US 使用 HMAC HTTP 签名。    |
| `use_gtd`                          | `True`    | 使用原生 USD-M GTD；见 [GTD 策略](#gtd-policy)。                        |
| `use_position_ids`                 | `True`    | 在订单、成交与对冲 REST 报告中暴露 Futures 持仓 ID。                    |
| `oms_type`                         | `None`    | `None` 选择 Futures 净额模式；双边模式用 `Hedging`。                    |
| `default_taker_fee`                | `0.0004`  | 交易所生成 Futures 成交的回退费率。                                     |
| `futures_leverages`                | `None`    | 按 Futures symbol 设置初始杠杆。                                        |
| `futures_margin_types`             | `None`    | 按 Futures symbol 设置初始保证金类型。                                  |
| `treat_expired_as_canceled`        | `False`   | 将 `EXPIRED` 执行事件映射为已撤销事件。                                 |
| `use_trade_lite`                   | `False`   | 使用更低延迟的 USD-M trade-lite 成交流。                                |
| `bnfcr_currency`                   | `USDT`    | 解析 `BNFCR` 余额与费用时使用的货币。                                   |
| `transport_backend`                | `Sockudo` | WebSocket 传输后端。                                                    |

### 实时节点配置 {#live-node-configuration}

`BinanceDataClientConfig` 搭配 `BinanceDataClientFactory` 使用，
`BinanceExecutionClientConfig` 搭配 `BinanceExecutionClientFactory` 使用。数据与执行客户端的完整
`LiveNode.builder(...)` 配置方式见当前的 Python 示例。

### Futures Credits Trading Mode（BNFCR） {#futures-credits-trading-mode-bnfcr}

Binance Futures Credits Trading Mode 是面向欧盟监管的模式。USD-M 期货钱包、保证金、盈亏与费用
全部以 `BNFCR` 计价。这种内部记账单位替代稳定币余额，与美元 1:1 锚定。

`BNFCR` 不是可交易资产，因此 adapter 将其映射到执行配置中的 `bnfcr_currency`（默认 `USDT`），
使账户余额与佣金按所交易合约的结算稳定币对账。交易 USDC 本位永续时将 `bnfcr_currency` 设为
`USDC`。其他无法识别的期货资产会注册为通用加密货币，而不是报错。

### Spot 行情模式 {#spot-market-data-mode}

`BinanceDataClientConfig` 上的 `spot_market_data_mode` 选择 Spot 数据传输方式，只影响 Spot，
Futures 不受影响。

| 模式   | 凭据               | 盘口         |
| ------ | ------------------ | ------------ |
| `Sbe`  | Ed25519（必需）    | `bestBidAsk` |
| `Json` | 无（公共）         | `bookTicker` |

`Sbe`（默认）使用 Binance Simple Binary Encoding 流，要求 Ed25519 密钥（见
[密钥类型](#key-types)），缺少密钥时客户端拒绝连接。`Json` 使用公共流，无需凭据。

完整 Spot `BookDeltas` 订阅在所选传输方式使用 `<symbol>@depth` 增量深度流，配合 REST 快照
同步。显式深度订阅使用局部簿快照（见[订单簿](#order-books)）。

:::note
Python 侧以 `nautilus_trader.adapters.binance` 下的 `BinanceSpotMarketDataMode` 暴露。
:::

### 密钥类型 {#key-types}

adapter 使用 **Ed25519** 或 **HMAC-SHA256** 签名，并根据 API secret 的格式自动识别密钥类型，
无需配置。能解析为 PKCS#8 Ed25519 私钥的 secret 用 Ed25519 签名，其余一律按 HMAC secret 处理。

**强烈推荐使用 Ed25519。** Binance 推荐 Ed25519，因其性能与安全性更好。未来版本的
NautilusTrader 将只支持 Ed25519。

| 密钥类型 | 数据客户端 | 执行客户端 | 状态                                           |
| -------- | ------------ | ----------------- | ------------------------------------------------ |
| Ed25519  | ✓            | ✓                 | **推荐**                                         |
| HMAC     | ✓            | ✓                 | 已弃用，将在未来版本移除。                       |
| RSA      | -            | -                 | 不支持；请改为注册 Ed25519 密钥。                |

:::tip
现在就切换到 Ed25519 密钥。生成 Ed25519 密钥对并注册到 Binance，见下文
[生成 Ed25519 密钥](#generating-ed25519-keys)。
:::

:::note
Ed25519 密钥必须以未加密的 PEM 格式提供（base64 编码的 ASN.1/DER）。实现会自动从 DER 结构
中提取 32 字节种子。不支持加密（带密码）的 PEM 密钥。若密钥已加密，先解密：
`openssl pkey -in encrypted.pem -out decrypted.pem`
:::

#### 生成 Ed25519 密钥 {#generating-ed25519-keys}

**方式 1：OpenSSL（推荐）**

```bash
# Generate private key (PKCS#8 PEM format)
openssl genpkey -algorithm ed25519 -out binance_ed25519_private.pem

# Extract public key
openssl pkey -in binance_ed25519_private.pem -pubout -out binance_ed25519_public.pem
```

**方式 2：Binance 密钥生成器**

从发布页下载 [Binance Asymmetric Key Generator](https://github.com/binance/asymmetric-key-generator)
并运行它生成密钥对。

**注册到 Binance**

1. 登录 Binance，进入 **Profile** -> **API Management**。
2. 点击 **Create API**，选择 **Self-generated**。
3. 粘贴公钥文件的全部内容，包括 `-----BEGIN PUBLIC KEY-----` 头尾行。
4. 配置权限（Enable Spot & Margin Trading 等）。

**在 NautilusTrader 中使用**

把私钥设为 API secret：

```bash
export BINANCE_API_KEY="your-api-key-from-binance"
export BINANCE_API_SECRET="$(cat binance_ed25519_private.pem)"
```

或直接在配置中传入 PEM 内容。

:::warning
妥善保管私钥。绝不外传，也不要提交到版本库。
:::

### API 凭据 {#api-credentials}

凭据可以直接传给配置对象，也可以设置对应的环境变量（各环境的变量见
[环境](#environments)）。

:::tip
所有客户端都使用 Ed25519 密钥。HMAC 密钥目前对数据客户端和执行客户端仍然可用，但 Ed25519
性能更好，且将在未来版本成为唯一支持的密钥类型。见[密钥类型](#key-types)。
:::

:::warning
Spot 的 `BINANCE_ED25519_*` 和 `BINANCE_*_ED25519_*` 环境变量已被移除。发现这类变量的客户端
会记录 error 并按凭据缺失处理。Futures 侧它们已被弃用，带警告暂时生效，未来版本会移除。
请改名为 `BINANCE_API_KEY` / `BINANCE_API_SECRET`（Ed25519 密钥现在会自动识别）。
:::

交易节点启动时，你会收到凭据是否有效、是否具备交易权限的确认信息。

### 产品类型 {#product-type}

配置通过 `product_type` 字段与 `BinanceProductType` 枚举选择一种受支持的产品：

- `SPOT`
- `USD_M`（USDT、USDC 或 BNFCR 抵押品）
- `COIN_M`（加密货币抵押品）

:::note
保证金交易尚未实现。其他枚举值会被实时客户端与独立金融工具加载器拒绝。见
[产品支持](#product-support)。
:::

### Base URL 覆盖 {#base-url-overrides}

可覆盖 HTTP REST 与 WebSocket API 的默认 base URL。配置 API 集群，或使用 Binance 专门提供的
定制端点时，这很有用。

### Binance US {#binance-us}

在配置上设置 `us=True` 可获得一等公民的 Binance US Spot 路由。Binance US 不是自定义 URL 的
别名。该开关选择以下端点与传输方式：

- `api.binance.us`。
- 公共 JSON 流。
- HMAC 签名的 HTTP 执行。
- 443 端口带周期性 keepalive 的 listen-key 私有流。

该路由背后的场所约定见 Binance US 官方
[REST API](https://github.com/binance-us/binance-us-api-docs/blob/master/rest-api.md)、
[行情流](https://github.com/binance-us/binance-us-api-docs/blob/master/web-socket-streams.md)
和[用户数据流](https://github.com/binance-us/binance-us-api-docs/blob/master/web-socket-api.md)
文档。

支持的组合是有意为之的：

- 数据：`product_type=Spot`、`environment=Live`、`spot_market_data_mode=Json`。
- 执行：`product_type=Spot`、`environment=Live`。下单使用 HTTP，私有事件走 listen-key 流。
- Futures、Testnet、Demo，以及带 `us=True` 的 Spot SBE 配置都无法通过校验。

Binance US 的公共 JSON 覆盖实时行情、深度快照、近期与聚合成交历史、kline 历史，使用账户级
maker/taker 费率。Global Binance 在 `us=False` 且 `spot_market_data_mode=Json` 时保持现有的
免凭据 Spot JSON 行为。

### 环境 {#environments}

Binance 提供三个交易环境，各有独立的 API 凭据与端点。`environment` 配置项选择使用哪一个。

| 环境        | 配置值                       | 说明                                              |
| ----------- | ---------------------------- | --------------------------------------------------- |
| **Live**    | `BinanceEnvironment.LIVE`    | 用真实资金生产交易（默认）。                      |
| **Demo**    | `BinanceEnvironment.DEMO`    | 在模拟的 Spot 与 Futures 资金上做演示交易。       |
| **Testnet** | `BinanceEnvironment.TESTNET` | 旧版 Spot 与 Futures 测试网。                     |

#### Live（生产） {#live-production}

实时交易默认环境，使用真实资金和 Binance 主账户凭据。

```python
config = BinanceExecutionClientConfig(
    account_id=AccountId.from_str("BINANCE-001"),
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    product_type=BinanceProductType.SPOT,
    # environment=BinanceEnvironment.LIVE (default)
)
```

| 变量                 | 说明           |
| -------------------- | ---------------- |
| `BINANCE_API_KEY`    | 生产 API key。    |
| `BINANCE_API_SECRET` | 生产 API secret。 |

#### Demo 交易 {#demo-trading}

在生产基础设施上用模拟资金练手。Demo 账户与生产账户共用同一个 Binance 登录，但交易的是
虚拟余额。

**如何获取 demo 凭据**：

1. 登录 [binance.com/en/demo-trading](https://www.binance.com/en/demo-trading)。
2. 进入 **API Management** 创建 demo API key。
3. Demo 密钥适用于 Spot 与 Futures 的 demo 端点。

| 端点        | URL                        |
| ----------- | -------------------------- |
| Spot HTTP   | `demo-api.binance.com`     |
| Spot WS     | `demo-stream.binance.com`  |
| USD-M HTTP  | `demo-fapi.binance.com`    |
| USD-M WS    | `demo-fstream.binance.com` |
| COIN-M HTTP | `demo-dapi.binance.com`    |
| COIN-M WS   | `demo-dstream.binance.com` |

```python
config = BinanceExecutionClientConfig(
    account_id=AccountId.from_str("BINANCE-001"),
    api_key="YOUR_DEMO_API_KEY",
    api_secret="YOUR_DEMO_API_SECRET",
    product_type=BinanceProductType.SPOT,
    environment=BinanceEnvironment.DEMO,
)
```

| 变量                      | 说明            |
| ------------------------- | ---------------- |
| `BINANCE_DEMO_API_KEY`    | Demo API key。    |
| `BINANCE_DEMO_API_SECRET` | Demo API secret。 |

#### Testnet {#testnet}

旧版测试网络，有独立的用户账户、余额和订单簿。新的模拟交易环境优先使用
`environment=BinanceEnvironment.DEMO`。Spot 测试网仍在 `testnet.binance.vision`。Futures
测试网端点可能经由 Demo Trading 基础设施路由。

**如何获取 Spot 测试网凭据**：

1. 访问 [testnet.binance.vision](https://testnet.binance.vision/)。
2. 用 GitHub 登录。
3. 生成 Ed25519 或 HMAC API key（adapter 不支持 RSA 密钥）。

**Futures 测试网**：已有 `BinanceEnvironment.TESTNET` 配置仍可工作，但新的 Futures 测试应
改用 `BinanceEnvironment.DEMO`。

```python
config = BinanceExecutionClientConfig(
    account_id=AccountId.from_str("BINANCE-001"),
    api_key="YOUR_TESTNET_API_KEY",
    api_secret="YOUR_TESTNET_API_SECRET",
    product_type=BinanceProductType.SPOT,
    environment=BinanceEnvironment.TESTNET,
)
```

| 变量                                 | 说明                        |
| ------------------------------------ | --------------------------- |
| `BINANCE_TESTNET_API_KEY`            | Spot 测试网 API key。        |
| `BINANCE_TESTNET_API_SECRET`         | Spot 测试网 API secret。     |
| `BINANCE_FUTURES_TESTNET_API_KEY`    | Futures 测试网 API key。     |
| `BINANCE_FUTURES_TESTNET_API_SECRET` | Futures 测试网 API secret。  |

:::note
测试网凭据与生产账户完全分离。行情数据与流动性也与生产环境不同。
:::

### 金融工具加载 {#instrument-loading}

instrument provider 控制选择与过滤：

```python
from nautilus_trader.adapters.binance import BinanceInstrumentProviderConfig

instrument_provider = BinanceInstrumentProviderConfig(
    load_all=False,
    load_ids=["BTCUSDT.BINANCE", "ETHUSDT.BINANCE"],
    filters={"quotes": ["USDT"], "bases": ["BTC", "ETH"]},
    log_warnings=True,
    query_commission_rates=True,
)
```

`load_all=False` 时只选择 `load_ids`，场所过滤器再按交集生效。支持的过滤器有 `symbols`、
`bases`、`quotes`，Futures 另有 `contract_types`。取值为字符串或非空字符串列表，匹配不区分
大小写。adapter 拒绝 `filter_callable`，请使用支持的声明式过滤器。

解析出的金融工具不携带 maker 或 taker 费率。`query_commission_rates` 不会把账户佣金复制到
金融工具上。

### 解析警告 {#parser-warnings}

某些 Binance 金融工具的字段值超出平台处理能力，无法解析为 Nautilus 对象。这些金融工具会被
跳过并发出警告。

批量加载期间，非交易状态的 symbol 以 debug 日志跳过。若通过 `load_ids` 或 `symbols` 过滤器
显式选中，它们仍会发出警告。

要抑制这些警告：

```python
from nautilus_trader.adapters.binance import BinanceInstrumentProviderConfig

instrument_provider = BinanceInstrumentProviderConfig(
    load_all=True,
    log_warnings=False,
)
```

### Futures 对冲模式 {#futures-hedge-mode}

Binance Futures 对冲模式允许同一金融工具同时持有多空两个方向的持仓。

`use_position_ids` 开启时（默认），Futures 订单与成交报告包含由金融工具和 Binance 持仓方向
推导的 `venue_position_id`。对冲模式的 REST 持仓报告使用同样的 ID，例如
`ETHUSDT-PERP.BINANCE-LONG`。该标识在 REST 历史、用户流更新、流恢复、交易所生成成交以及
跟踪的 `TRADE_LITE` 成交中全程保持。

One-way 模式的 `BOTH` 持仓、订单与成交保持无键，使用净额对账。只有为 `OmsType.HEDGING`
的虚拟持仓（持仓标识由引擎管理）才把 `use_position_ids` 设为 false。`use_position_ids=True`
时，若提交的自定义持仓 ID 与 Binance 对冲腿的规范 ID 不同，adapter 会在发送订单前拒绝。

使用对冲模式需先在 Binance 侧开启，然后在 `BinanceExecutionClientConfig` 上设置
`oms_type=OmsType.HEDGING`，并保持 `use_position_ids=True` 以跟踪场所的两侧持仓：

```python
from nautilus_trader.adapters.binance import BinanceExecutionClientConfig
from nautilus_trader.adapters.binance import BinanceProductType
from nautilus_trader.model import AccountId
from nautilus_trader.model import OmsType

config = BinanceExecutionClientConfig(
    account_id=AccountId.from_str("BINANCE-001"),
    product_type=BinanceProductType.USD_M,
    oms_type=OmsType.HEDGING,
    use_position_ids=True,
)
```

启动对账要分别保留 `LONG` 与 `SHORT` 腿，必须使用这一配置。

若缓存中某笔开仓的 Binance 对冲持仓带有不同的本地生成 ID，adapter 会拒绝该持仓行，并同时
报告缓存 ID 与期望 ID。请先修正缓存状态，再重试启动。adapter 不会为旧 ID 做别名，也不会
创建重复的场所持仓。

### COIN-M / USD-M 架构 {#coin-m--usd-m-architecture}

Binance COIN-M Futures（CM / DAPI）与 USD-M Futures（UM / FAPI）共享统一架构。本节说明
这对 adapter 的影响。

完整细节见
[Important CM-UM Integration Notice](https://developers.binance.com/docs/derivatives/coin-margined-futures/Important-CM-UM-Integration-Notice)。

#### WebSocket 流 {#websocket-streams}

行情流的负载在 `<symbol>@aggTrade`、`<symbol>@ticker`、`<symbol>@bookTicker`、
`<symbol>@depth<levels>`、`<symbol>@miniTicker` 及所有 `!*@arr` 流上都带有 `st`（symbol
类型：`1` = UM，`2` = CM）。UM 侧的单 symbol 流在 `<symbol>@bookTicker`、
`<symbol>@depth<levels>`、`<symbol>@miniTicker` 和 `<symbol>@rpiDepth` 上还带 `ps`
（pair symbol）。

adapter 用 `serde` 解码 JSON，默认忽略未知字段，因此这些字段被静默丢弃。

全市场数组流（`!ticker@arr`、`!miniTicker@arr`、`!bookTicker`、`!forceOrder@arr`、
`!contractInfo`）在 `fstream` 和 `dstream` 上传递 UM + CM 合并后的内容。

#### REST 与 WebSocket API {#rest-and-websocket-api}

- 下单与改单的确认响应不包含 `avgPrice` / `cumQuote` / `cumBase`。adapter 从用户数据流获取
  成交。查询端点（`GET /{f,d}api/v1/order`、`userTrades`）仍返回这些字段。
- `PUT /dapi/v1/order`（COIN-M 改单）要求同时提供 `price` 和 `quantity`。adapter 总是两个
  字段都发，修改命令省略的那个回退为缓存订单的值。
- COIN-M 条件订单（STOP、TAKE_PROFIT 等）使用 `/dapi/v1/algoOrder` 端点。adapter 将所有
  futures 条件订单路由到 algo order API。
- `GET /dapi/v1/openOrders` 传入非法 symbol 时返回错误 `-1121`。

#### 限流池 {#rate-limit-pools}

UM 与 CM 共享 Binance 的限流池：每 IP 2400 权重/分钟，每账户 1200 订单/分钟和 300 订单/10 秒。
同一进程内环境或自定义端点作用域相同、出口路径相同的 Rust futures HTTP 客户端，在 UM 与 CM
之间共享请求权重状态；认证使用同一 API key 时，无论出口路径如何，UM 与 CM 共享订单计数状态。

Live、testnet、demo 及无关联的自定义端点作用域保持隔离。不同的配置出口路径有各自独立的
请求权重状态，不同的 API key 有各自独立的订单计数状态。不同进程，以及同一 Binance 账户使用
多个 API key 的情形，仍需外部协调。

#### dualSidePosition {#dualsideposition}

UM 与 CM 共享同一个 `dualSidePosition` 设置，任何一侧的修改都会同时影响两侧。翻转该设置前，
确保 UM 和 CM 都没有挂单和持仓。

## 贡献 {#contributing}

:::info
要为 Binance adapter 做贡献，参见
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
