# Coinbase

Coinbase 成立于 2012 年，是美国监管下规模最大的加密货币交易所之一。其 Advanced Trade API
提供现货、永续互换和到期期货交易。本适配器通过共享的执行客户端，支持现货（Cash）账户和
CFM 衍生品（Margin）账户的实时行情接入与订单执行，账户类型由工厂选择（见[执行范围](#execution-scope)）。

## 概览 {#overview}

Coinbase 适配器以 Rust 实现，通过配置、工厂、枚举和常量暴露给 Python。

组件：

- `CoinbaseRawHttpClient`：底层 REST 客户端，负责传输、JWT 签名和速率限制。
- `CoinbaseHttpClient`：领域 REST 客户端，把场所响应解析为 Nautilus 类型。
- `CoinbaseWebSocketClient`：底层 WebSocket 连接，使用 JWT 订阅鉴权。
- `CoinbaseInstrumentProvider`：金融工具解析与加载。
- `CoinbaseDataClient`：行情数据源管理器。
- `CoinbaseDataClientFactory`：数据客户端工厂。
- `CoinbaseExecutionClient`：执行客户端（现货或 CFM 衍生品；REST 下单 + WS 数据流）。
- `CoinbaseExecutionClientFactory`：执行客户端工厂。现货与 CFM 衍生品由配置上的
  `account_type` 选择。

`nautilus_trader.adapters.coinbase` 提供的 Python 接口：

- `CoinbaseDataClientConfig`、`CoinbaseExecutionClientConfig`
- `CoinbaseDataClientFactory`、`CoinbaseExecutionClientFactory`
- `CoinbaseEnvironment`、`CoinbaseMarginType`
- `COINBASE`、`COINBASE_CLIENT_ID` 和 `COINBASE_VENUE`

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/coinbase/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/coinbase/examples/)

## Coinbase 文档 {#coinbase-documentation}

Coinbase 为 Advanced Trade API 提供了文档：

- [REST API 参考](https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/introduction)
- [订单管理指南](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/guides/orders)
- [WebSocket 频道](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-channels)
- [API key 鉴权](https://docs.cdp.coinbase.com/coinbase-app/authentication-authorization/api-key-authentication)
- [速率限制](https://docs.cdp.coinbase.com/coinbase-app/api-architecture/rate-limiting)

请结合本 NautilusTrader 集成指南阅读 Coinbase 文档。

:::info
本适配器面向 Coinbase Advanced Trade API。不覆盖独立的
[Coinbase International Exchange（INTX）](https://international.coinbase.com)场所，其适配器在
NautilusTrader 1.224.0 中已移除。
:::

## 产品 {#products}

产品（product）是一组相关工具类型的统称。

支持以下产品类型：

| 产品类型            | 支持 | 说明                                              |
| ------------------- | --------- | ------------------------------------------------- |
| 现货                | ✓         | 以 USD、USDC、USDT 计价的现货对。                 |
| 永续合约            | ✓         | FCM 场所上以 USD 保证金的永续互换。               |
| 期货合约            | ✓         | 到期交割期货（nano BTC、nano ETH 等）。           |

## 符号体系 {#symbology}

Coinbase 直接把场所原生的 `product_id` 字段用作 Nautilus symbol。金融工具 ID 为
`{product_id}.COINBASE`。

| 产品         | 格式                            | 示例                               |
| ------------ | ------------------------------- | ---------------------------------- |
| 现货         | `{base}-{quote}`                | `BTC-USD`、`ETH-USDC`、`SOL-USDT`。 |
| 永续         | `{contract_code}-{ddMMMyy}-CDE` | `BIP-20DEC30-CDE`（BTC PERP）。    |
| 到期期货     | `{contract_code}-{ddMMMyy}-CDE` | `BIT-24APR26-CDE`（BTC 2026 年 4 月）。 |

`-CDE` 后缀表示 Coinbase Derivatives Exchange（FCM 场所）。永续工具带有交易所指派的远期
到期日（如 `20DEC30`），但依据是否存在持续 funding 费率被归类为 `CryptoPerpetual`。到期期货
归类为 `CryptoFuture`。

适配器从 API 元数据以结构化方式解析产品类型
（`future_product_details.contract_expiry_type`；当其值为 `EXPIRING` 时，以
`future_product_details.funding_rate` 非空作为永续合约的独有结构信号）。回退启发式检查
`display_name` 中是否含有 `PERP` 或 `Perpetual` 子串。

完整 Nautilus 金融工具 ID 示例：

- `BTC-USD.COINBASE`（现货 Bitcoin/USD）。
- `ETH-USDC.COINBASE`（现货 Ether/USDC）。
- `BIP-20DEC30-CDE.COINBASE`（BTC 永续互换）。
- `BIT-24APR26-CDE.COINBASE`（BTC 到期期货，2026 年 4 月）。

### 别名产品（USDC 与 USD） {#aliased-products-usdc-and-usd}

Coinbase 把同一交易对的 USDC 计价版本和 USD 计价版本合并到同一个撮合引擎簿。
`GET /products` 通过 `alias` 和 `alias_to` 暴露这层关系：

```text
BTC-USD :  alias=""        alias_to=["BTC-USDC"]   # canonical
BTC-USDC:  alias="BTC-USD" alias_to=[]             # alias of BTC-USD
```

当调用方使用别名一侧订阅或下单时，场所在线路上把请求改写为规范（canonical）ID。适配器在
工具引导阶段记录 `product_id -> alias` 映射，并在两侧透明地处理改写：

- 数据订阅使用规范 ID 发出。数据 WebSocket 客户端持有反向映射，在解析前把入站消息重新
  键回调用方提供的 ID。
- 订单以调用方的 `product_id` 提交。执行客户端把该 ID 记录在 `client_order_id` 下，并对
  user 频道回显的规范 ID 重新键回。因此，别名一侧的订单永远不会被报告到规范工具上。

因此，只持有 USDC 的策略可以端到端交易 `BTC-USDC.COINBASE`，无需引用规范的 `BTC-USD`。
结算货币由提交的 `product_id` 决定，所以在 `BTC-USDC.COINBASE` 下的订单总是借记或贷记
USDC 钱包。

## 环境 {#environments}

Coinbase 提供两个交易环境。用客户端配置中的 `environment` 字段选择合适的环境。

| 环境      | `environment` 值              | REST 基础 URL                        |
| --------- | ----------------------------- | ---------------------------------- |
| 实盘      | `CoinbaseEnvironment.LIVE`    | `https://api.coinbase.com`         |
| Sandbox   | `CoinbaseEnvironment.SANDBOX` | `https://api-sandbox.coinbase.com` |

### Live（生产） {#live-production}

用真实资金实时交易的默认环境。

```python
config = CoinbaseExecutionClientConfig(
    api_key="YOUR_API_KEY",
    api_secret="YOUR_API_SECRET",
    # environment=CoinbaseEnvironment.LIVE (default)
)
```

环境变量：`COINBASE_API_KEY`、`COINBASE_API_SECRET`。

### Sandbox {#sandbox}

按 [Sandbox 文档](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/sandbox)的
说明，这是一个静态 mock 测试环境，用于打通集成管线。

```python
config = CoinbaseExecutionClientConfig(
    api_key="ANY_NON_EMPTY_STRING",  # required by the adapter constructor
    api_secret="ANY_NON_EMPTY_STRING",
    environment=CoinbaseEnvironment.SANDBOX,
)
```

Sandbox 场所不强制鉴权，但 `CoinbaseExecutionClient::new` 在构造时要求两个字段（或对应的
环境变量）都有值。

:::warning
**Sandbox 不是一个平行的交易场所**：

- 所有响应都是静态预定义的，没有实时行情和动态定价。
- 只有 Accounts 和 Orders 端点可用，其他资源没有。
- 不需要鉴权（也不强制）。
- 自定义 `X-Sandbox` 请求头可以触发预定义的错误场景。

用 sandbox 打通客户端并验证请求/响应形态。任何贴近真实的行为测试都要在生产环境
（用真实资金，谨慎操作）进行。
:::

## 鉴权 {#authentication}

Coinbase Advanced Trade 使用 ES256 JWT 鉴权。每个 REST 请求和每个 WebSocket 订阅都会生成
一个用你的 EC 私钥签名的短时效 JWT。适配器从环境变量或配置字段解析凭据。

### 创建 API key {#creating-an-api-key}

Coinbase 有多种 key 类型。适配器要求使用 **Coinbase App Secret
API key**，签名算法为 **ECDSA**（不是 Ed25519）。

1. 打开 CDP 门户的 API keys 页面：
   [portal.cdp.coinbase.com/projects/api-keys](https://portal.cdp.coinbase.com/projects/api-keys)。

2. 选择 **Secret API Keys** 标签页，点击 **Create API key**。

3. 输入昵称（如 `nautilus-trading`）。

4. 展开 **API restrictions**，把权限设为 **View** 和 **Trade**。

5. 展开 **Advanced Settings**，把签名算法从 Ed25519 改为 **ECDSA**。这一步是必需的：
   Ed25519 key 不能用于 Advanced Trade API。

6. 点击 **Create API key**。在弹窗中保存 key 名称和私钥。key 名称形如
   `organizations/{org_id}/apiKeys/{key_id}`。私钥是 PEM 编码的 EC key（SEC1 格式）。

:::warning
Coinbase 不再自动下载 key 文件。请在关闭创建弹窗前复制其中的值或点击下载按钮。
私钥事后无法再次获取。
:::

:::info
不要使用已过期的旧版 Coinbase App API key。请创建 CDP API key 并选择 ECDSA 算法。适配器
用 ES256 签名请求。见 Coinbase 的
[旧版 key 迁移指南](https://docs.cdp.coinbase.com/coinbase-app/authentication-authorization/legacy-keys)。
:::

完整细节见 Coinbase
[API key 鉴权指南](https://docs.cdp.coinbase.com/coinbase-app/authentication-authorization/api-key-authentication)。

### 环境变量 {#environment-variables}

| 变量                  | 说明                                                  |
| --------------------- | ----------------------------------------------------- |
| `COINBASE_API_KEY`    | key 名称（`organizations/{org_id}/apiKeys/{key_id}`）。 |
| `COINBASE_API_SECRET` | PEM 编码的 EC 私钥（完整多行字符串）。                |

示例：

```bash
export COINBASE_API_KEY="organizations/abc-123/apiKeys/def-456"
export COINBASE_API_SECRET="$(cat ~/path/to/cdp_api_key.pem)"
```

:::tip
推荐用环境变量管理凭据。
:::

### JWT 有效期 {#jwt-lifetime}

Coinbase JWT 在 120 秒后过期。按
[WebSocket 概览](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-overview)
的说明，每条需要鉴权的 WebSocket 消息（即每次订阅）都必须生成不同的 JWT。适配器为每个签名
REST 请求和每条鉴权订阅消息重新生成新鲜 JWT，无需手动轮换。

## 投资组合 {#portfolios}

Coinbase 账户持有一个或多个**投资组合（portfolio）**。每个投资组合有自己的钱包（USD、USDC、
BTC 等）、余额和订单范围。每个账户都有一个 `DEFAULT` 投资组合。用户可以创建额外的 `CONSUMER`
投资组合来隔离策略、风险或税则批次。

CDP API key 在**创建时绑定到单个投资组合**。每个鉴权请求（账户查询、下单、撤单）都作用于
该投资组合，除非显式指定其他组合。

### 查找投资组合 UUID {#finding-your-portfolio-uuids}

运行适配器的鉴权探测二进制：

```bash
cargo run --bin coinbase-http-private --package nautilus-coinbase
```

它会打印：

- 你的 CDP key 可见的投资组合。
- 所绑定投资组合中的账户余额。
- 若干参考 REST 调用。

示例输出：

```text
Found 1 portfolio(s)
  name=Default type=DEFAULT uuid=ca7244bc-21d1-5e4c-bfe5-80f208ac5723 deleted=false
Account has 3 balance(s)
  USDC total=100.00000000 USDC free=100.00000000 USDC locked=0.00000000 USDC
  AUD total=0.00 AUD free=0.00 AUD locked=0.00 AUD
  BTC total=0.00000000 BTC free=0.00000000 BTC locked=0.00000000 BTC
```

等价的 curl（你需要先用自己的 CDP PEM key 签发 ES256 JWT）：

```bash
curl -H "Authorization: Bearer $JWT" \
  https://api.coinbase.com/api/v3/brokerage/portfolios
```

### 何时需要 `retail_portfolio_id` {#when-retail_portfolio_id-is-required}

Coinbase 的 `POST /orders` 端点默认路由到 key 绑定的投资组合，因此单投资组合账户不需要设置
该字段。在 [`CoinbaseExecutionClientConfig`](#execution-client-configuration-options) 上设置它，
当以下任一条件成立时：

- 账户持有多个投资组合，而你想交易的那个不是 key 的默认组合。
- 场所以下列信息拒单 `account is not available`，且已排除下文的钱包诊断。

:::note
Coinbase 的 [Create Order 参考文档](https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/orders/create-order)
把 `retail_portfolio_id` 标记为已弃用、仅适用于旧版 key，并说明 CDP key 默认使用
key 被授权的投资组合。配置后适配器仍会发送该字段，因此当场所的默认路由与你的账户
布局不符时，它依然可用。
:::

### 创建新投资组合 {#creating-a-new-portfolio}

多数用户不需要创建投资组合，账户的默认组合开箱即用。仅当你想做到以下几点时，才在
[coinbase.com/portfolios](https://www.coinbase.com/portfolios) 创建：

- 把 API 驱动的交易与手动零售操作隔离。
- 在策略之间隔离风险或盈亏。
- 绕开受限的默认组合（例如 Vault）。

创建投资组合后，先给它注资（在 coinbase.com 上从默认组合的钱包转入）再发订单，否则场所
会对计价货币返回 `account is not available`。

### 排查 `account is not available` {#troubleshooting-account-is-not-available}

场所因几种不同原因返回该错误。用上面的探测二进制诊断，检查投资组合的钱包列表。

| 症状                                                                 | 可能原因                                                                                                                                                                        | 解决办法                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 仅特定产品被拒（如只有 USDC 却下 `BTC-USD`）                          | 投资组合缺少该产品计价货币的钱包。Coinbase 上 USD 与 USDC 是分开的，场所按提交的 `product_id` 路由订单，而不是按规范别名。   | 改下到你持有其计价货币的产品（USDC 钱包用 `BTC-USDC`）。适配器内部已处理数据侧别名解析，无需改配置。也可以在 coinbase.com 给缺失钱包注资，但只持有一种货币时没有必要。                                                                                                 |
| 所有产品下的每笔订单都被拒                                            | key 绑定到了非默认投资组合，而 `retail_portfolio_id` 未设置。                                                                                                                                  | 把 `CoinbaseExecutionClientConfig` 的 `retail_portfolio_id` 设为目标投资组合 UUID。                                                                                                                                                                                                    |
| 非美国账户在 `*-USD` 产品上被拒                                       | 司法辖区限制（如 AU 账户不能交易 USD 计价对）。                                                                                                                                                | 改用本地可用的计价货币（USDC、AUD、EUR 等），不要用 USD。                                                                                                                                                                                                                              |
| 轮换 key 后立即被拒                                                   | 新 key 创建在与旧 key 不同的投资组合。                                                                                                                                                          | 把 `retail_portfolio_id` 更新为新 key 所在的组合，或转移资金。                                                                                                                                                                                                                          |

## 行情数据 {#market-data}

除衍生品指数价与 funding 数据外，数据客户端的所有内容都来自 WebSocket 频道。Coinbase
Advanced Trade 不在任何 WebSocket 频道上发布指数价或 funding 费率，这两路数据改用 REST 轮询
获取。

| Nautilus 订阅     | 数据源                      | 说明                                                                        |
| ----------------- | --------------------------- | --------------------------------------------------------------------------- |
| 订单簿 delta      | `level2` 频道               | 仅 `L2_MBP`；其他订单簿类型被拒绝。                                         |
| 报价              | `ticker` 频道               | 来自场所 ticker 负载的最优买卖价。                                          |
| 成交              | `market_trades` 频道        | 也可通过 REST 请求获取。                                                    |
| K 线              | `candles` 频道              | 固定五分钟桶；场所不接受粒度参数。                                          |
| 工具状态          | `status` 频道               | 见[工具状态](#instrument-status)。                                          |
| 指数价            | REST `/products/{id}` 轮询  | 仅衍生品，按 `derivatives_poll_interval_secs` 轮询。                        |
| Funding 费率      | REST `/products/{id}` 轮询  | 仅永续；见 [Funding 费率](#funding-rates)。                                 |
| 标记价            | *Coinbase 不支持*           | 订阅会被拒绝，而不是用结算价合成。                                          |

连接时总会发送一个 `heartbeats` 订阅，并在每次重连时重放。它满足场所的五秒订阅时限，并在
已订阅产品频道安静时保持连接活跃。

### K 线 {#bars}

历史 K 线请求接受 EXTERNAL 聚合，粒度以适配器映射的为准：1m、5m、15m、30m、1h、2h、6h 和
1d。其他步长或聚合一律拒绝。Coinbase 的 `/products/{id}/candles` 端点还支持 `FOUR_HOUR`，
适配器目前未映射。

实时 K 线订阅不同：WebSocket 的 `candles` 频道不接受粒度参数，只发布五分钟桶。适配器给每根
收到的 K 线盖上该产品的工具所注册的 `BarType`。因此其他订阅规格得到的都是五分钟 K 线，只是
标签为所请求的类型。实时订阅请请求 `5-MINUTE-LAST-EXTERNAL` K 线类型，其他粒度用历史请求。

### Funding 费率 {#funding-rates}

适配器按 `derivatives_poll_interval_secs`（默认 15 秒）轮询 REST `/products/{id}` 端点，当
FCM `future_product_details` 负载中带有 `funding_rate` 时发出 `FundingRateUpdate`。funding
间隔从 `funding_interval` 字段解析（通常为 `"3600s"`，即每小时 funding），下次 funding 时间戳
取自 `funding_time`。Coinbase Advanced Trade 不在 WebSocket `ticker` 频道上发布
`funding_rate`，因此 REST 轮询是唯一的实时来源。

历史 funding 费率请求尚未实现。

### 工具状态 {#instrument-status}

首次订阅时 `subscribe_instrument_status` 会加入 Coinbase 的 WebSocket `status` 频道（场所对
所有产品只发布一条状态流）。它把入站事件过滤为已订阅的工具，并发出带以下动作的
`InstrumentStatus` 事件：

- `online` 对应 `MarketStatusAction::Trading`。
- `offline` 对应 `Halt`。
- `delisted` 对应 `Close`。

状态未设置（期货）或状态不在适配器建模范围内的产品不携带数据引擎需要的信息，直接跳过。
最后一个工具退订时会释放该频道订阅。

## 订单能力 {#orders-capability}

下表描述 Coinbase **场所**的订单界面。随包发行的
[`CoinbaseExecutionClient`](#execution-scope) 依据配置的 `account_type` 处理现货或 CFM
衍生品。Coinbase 的订单能力在现货与衍生品之间不同（永续与到期期货共享同一 FCM 订单界面）。

### 执行范围 {#execution-scope}

`CoinbaseExecutionClientFactory` 只产出一种 `CoinbaseExecutionClient` 类型。产品族由
`CoinbaseExecutionClientConfig` 的 `account_type` 字段选择：

| `account_type`        | 引导加载的工具                                | 账户状态来源                                                                                             |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `AccountType::Cash`   | 仅 `CoinbaseProductType::Spot`。              | `/accounts` REST 端点。                                                                                  |
| `AccountType::Margin` | `CoinbaseProductType::Future`（永续 + 到期）。 | CFM `balance_summary` REST + `futures_balance_summary` WS，外加来自 `cfm/positions` 的持仓报告。          |

其他账户类型在工厂创建时被拒绝。OMS 永远是 `Netting`，因为场所不提供对冲模式。

为防止跨账户串扰：

1. 连接时的工具引导加载只限于配置的产品族，另一族的产品绝不进入进程内缓存。
2. `submit_order` 拒绝任何工具不在该缓存内的订单。
3. `generate_order_status_report(s)` 与 `generate_fill_reports` 的输出经同一缓存后置过滤。
   因此即使账户同时有现货与衍生品活动，单个客户端也从不暴露另一范围的报告。

每个范围运行一个执行客户端。同一交易者要同时做现货和 CFM 时，创建两个客户端，使用不同的
`account_type` 与 `account_id`。配置显式的 `COINBASE` 场所路由或默认客户端（见
[执行客户端路由](./../concepts/live.md#execution-client-routing)）。提交订单时传入预期的
`client_id`。

### 订单类型 {#order-types}

下表按 Nautilus 模型暴露的形式列出订单类型。右列展示适配器发出的对应
`order_configuration` 键。表中没有的 Coinbase 订单类型（TWAP、Bracket、Scaled、SOR LIMIT
IOC）记录在[高级订单特性](#advanced-order-features)下，并在那里标注为适配器*尚未实现*。

| 订单类型                 | 现货 | 永续 | 期货 | 线格式                                                            |
| ---------------------- | ---- | --------- | ------ | --------------------------------------------------------------- |
| `MARKET`               | ✓    | ✓         | ✓      | `market_market_ioc`（全部产品）；`market_market_fok`（永续）    |
| `LIMIT`                | ✓    | ✓         | ✓      | `limit_limit_gtc` / `limit_limit_gtd` / `limit_limit_fok`       |
| `STOP_LIMIT`           | ✓    | ✓         | ✓      | `stop_limit_stop_limit_gtc` / `stop_limit_stop_limit_gtd`       |
| `STOP_MARKET`          | -    | -         | -      | *Coinbase 不支持*。                                             |
| `MARKET_IF_TOUCHED`    | -    | -         | -      | *Coinbase 不支持*。                                             |
| `LIMIT_IF_TOUCHED`     | -    | -         | -      | *Coinbase 不支持*。                                             |
| `TRAILING_STOP_MARKET` | -    | -         | -      | *Coinbase 不支持*。                                             |

### 执行指示 {#execution-instructions}

| 指示          | 现货 | 永续 | 期货 | 说明                                                                          |
| ------------- | ---- | --------- | ------ | ----------------------------------------------------------------------------- |
| `post_only`   | ✓    | ✓         | ✓      | 仅限 LIMIT GTC 与 LIMIT GTD。                                                 |
| `reduce_only` | -    | -         | -      | *Coinbase 不支持*；见[衍生品交易](#derivatives-trading)。                     |

### 有效期 {#time-in-force}

适配器接受下表中的组合。未列出的组合在提交时以 `"Unsupported TIF {tif} for {order_type}"`
拒绝。

| 订单类型       | GTC | GTD | IOC | FOK | 说明                                                                                                                                            |
| ------------ | --- | --- | --- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `MARKET`     | ✓   | -   | ✓   | (✓) | GTC 映射为 IOC；显式 IOC 被尊重。FOK 构建 `market_market_fok`，Coinbase 文档注明仅限永续，现货上会被拒绝。                                       |
| `LIMIT`      | ✓   | ✓   | -   | ✓   | GTD 需要 `expire_time`。LIMIT IOC *尚未实现*（见 [SOR LIMIT IOC](#advanced-order-features)）。                                                  |
| `STOP_LIMIT` | ✓   | ✓   | -   | -   | 需要 `trigger_price`。                                                                                                                          |

### 高级订单特性 {#advanced-order-features}

| 特性             | 现货 | 永续 | 期货 | 说明                                                                                           |
| ------------------ | ---- | --------- | ------ | ---------------------------------------------------------------------------------------------- |
| 订单修改           | ✓    | -         | -      | 仅限未结的 GTC 变体；Coinbase 以 `CANNOT_EDIT_FUTURES_ORDER` 拒绝期货场所的修改。              |
| 括号订单           | -    | -         | -      | *尚未实现*。场所提供 `trigger_bracket_gtc` / `trigger_bracket_gtd`。                           |
| OCO 订单           | -    | -         | -      | *Coinbase 不支持*将其作为独立订单类型。                                                        |
| 冰山订单           | -    | -         | -      | *Coinbase 不支持*。                                                                            |
| TWAP 订单          | -    | -         | -      | *尚未实现*。场所提供 `twap_limit_gtd`。                                                        |
| 分批订单（Scaled） | -    | -         | -      | *尚未实现*。场所提供 `scaled_limit_gtc`。                                                      |
| SOR LIMIT IOC      | -    | -         | -      | *尚未实现*。场所提供 `sor_limit_ioc` 用于智能路由的 LIMIT IOC。                                |

场所底层规范见
[Create Order 参考](https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/orders/create-order)
和 [Edit Order 参考](https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/orders/edit-order)。

### 持仓控制（衍生品） {#position-controls-derivatives}

| 控制项     | 说明                                        |
| ---------- | ------------------------------------------- |
| 杠杆       | 按订单设置；默认 `1.0`。                    |
| 保证金类型 | 按订单设置：全仓（默认）或逐仓。            |
| 持仓模式   | 仅单向；不开放对冲模式。                    |

### 批量操作 {#batch-operations}

| 操作     | 说明                                                                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 批量下单 | 不支持。每笔订单一个 `Create Order` 请求。                                                                                                    |
| 批量改单 | 不支持。每次修改一个 `Edit Order` 请求。                                                                                                      |
| 批量撤单 | `POST /api/v3/brokerage/orders/batch_cancel` 接受 `order_ids` 数组。最大数量无文档说明；响应中逐单给出成功/失败。                             |

### 订单查询 {#order-querying}

| 特性             | 现货 | 永续 | 期货 | 说明                                        |
| ---------------- | ---- | --------- | ------ | ------------------------------------------- |
| 查询未结订单     | ✓    | ✓         | ✓      | 列出全部活动订单。                          |
| 查询订单历史     | ✓    | ✓         | ✓      | 带游标分页的历史订单数据。                  |
| 订单状态更新     | ✓    | ✓         | ✓      | 通过 `user` 频道的实时状态变化。            |
| 成交历史         | ✓    | ✓         | ✓      | 执行与成交报告。                            |

### 现货交易限制 {#spot-trading-limitations}

- 现货不接受 MARKET FOK。Coinbase 文档注明 `market_market_fok` 仅限永续，现货上以
  `UNSUPPORTED_ORDER_CONFIGURATION` 拒绝。
- 支持以计价货币计量的 MARKET 订单。LIMIT 订单以基础单位计量。

### 衍生品交易 {#derivatives-trading}

Coinbase 衍生品通过 FCM（期货佣金商，Futures Commission Merchant）场所交易。执行客户端
通过现货同用的 `POST /orders` 端点提交订单。逐单的 `leverage` 与 `margin_type`（`CROSS` 或
`ISOLATED`）默认值来自 `CoinbaseExecutionClientConfig.default_leverage` 和
`default_margin_type`。保证金余额从两处更新：REST `cfm/balance_summary` 端点（连接时快照、
`query_account` 以及 WebSocket 重连时），以及鉴权的 `futures_balance_summary` WebSocket
频道。持仓报告来自 REST `cfm/positions` 端点。

Coinbase 的 Advanced Trade API 没有在下单 schema 中文档化 `reduce_only` 字段。执行客户端会在
进入传输前拒绝只减仓订单，而不是不带该指示就提交。

适配器对以下情况记录警告：

- REST 订单状态报告描述的订单属于强平。
- CFM 余额摘要显示的清算缓冲低于清算阈值的 20%。

Coinbase 不单独标记自动减仓（auto-deleveraging），它与强平走同一条警告。user 频道没有对应的
警告，因此强平只能从对账中看出，实时数据流里看不到。

## 执行客户端行为 {#execution-client-behavior}

本节记录 `CoinbaseExecutionClient` 如何把 Nautilus 订单命令和 Coinbase 场所事件翻译为
Nautilus 执行事件。

### 订单提交 {#order-submission}

`submit_order` 直接从 Nautilus 订单字段构建 Coinbase 的 `order_configuration` 形态：

- `MARKET` IOC 与 GTC（Nautilus 默认）-> `market_market_ioc`。FOK -> `market_market_fok`。
  `Day` 与 `Gtd` 在 HTTP 调用之前就被拒绝，以免调用方在不知情的情况下拿到 IOC 语义。用
  `Gtc` 构建的 `MARKET` 订单会在场所按 IOC 执行。要求严格回测/实时一致性的策略应显式用
  `Ioc` 构建 `MarketOrder`。
- `LIMIT` GTC -> `limit_limit_gtc`，GTD -> `limit_limit_gtd`（需要 `expire_time`），
  FOK -> `limit_limit_fok`。
- `STOP_LIMIT` GTC -> `stop_limit_stop_limit_gtc`，GTD ->
  `stop_limit_stop_limit_gtd`。止损方向由订单方向推导（`Buy` -> `STOP_DIRECTION_STOP_UP`，
  `Sell` -> `STOP_DIRECTION_STOP_DOWN`）。
- `STOP_MARKET`、`MARKET_IF_TOUCHED`、`LIMIT_IF_TOUCHED` 及跟踪止损变体 Coinbase 不支持。
  它们表现为 `OrderRejected`，携带派生的提交任务里 `build_order_configuration` 的错误
  （订单会先发出 `OrderSubmitted`）。

HTTP 创建成功时，发出 `OrderAccepted`，携带 `success_response.order_id` 返回的场所订单 ID。
响应 `success=false` 时，发出 `OrderRejected`，携带格式化后的场所失败原因。由于任何提交尝试
都可能已经到达 Coinbase，传输错误、超时、速率限制响应、解码失败或 HTTP 5xx 不能证明订单被
拒绝。适配器让订单保持在途状态并保留其提交元数据，直到 user 频道或对账将其厘清。

### 订单修改 {#order-modification}

`modify_order` 用类型化的 `EditOrderRequest` 向 `/orders/edit` 发 POST。Coinbase 只支持修改
未结的 GTC 变体，并以 `CANNOT_EDIT_FUTURES_ORDER` 拒绝期货场所订单的修改，因此修改实际上
仅限现货。其他订单类型必须用撤单重下。

Coinbase 的 `/orders/edit` 即使只改一项也同时要求 `price` 和 `size`。它把省略的 `size` 读成
0 并以 `INVALID_EDITED_SIZE` 或 `CANNOT_EDIT_TO_BELOW_FILLED_SIZE` 拒绝。执行客户端会从缓存
订单自动补全缺失字段，策略可以只调用 `modify_order(price=X)` 而无需重复当前数量。
`ModifyOrder` 命令中的值优先；否则使用缓存订单当前的 `price` 与 `quantity`。

场所修改失败发出 `OrderModifyRejected`，携带类型化 `EditOrderResponse` 中的原因（优先取
`edit_failure_reason`，回退到 `preview_failure_reason`）。场所结果未知的 HTTP 失败会让订单
停留在 `PENDING_UPDATE`，直到某个更新、查询结果或对账将其厘清。

### 撤单 {#cancellation}

- `cancel_order` 提交只含单个 ID 的 `batch_cancel`。明确的逐单场所失败表现为
  `OrderCancelRejected`。场所结果未知的整请求传输失败让订单停留在 `PENDING_CANCEL`，等待
  对账。
- `cancel_all_orders` 通过 REST 列出未结订单时不带 `OPEN` 过滤（因为 Coinbase 的 `OPEN`
  过滤会排除仍可撤销的 `PENDING` 和 `QUEUED` 订单），然后在本地过滤为
  `{Accepted, Triggered, PendingUpdate, PartiallyFilled}` 与所请求的方向，再把
  `batch_cancel` 按每组 100 笔分块调用。逐单场所失败发出 `OrderCancelRejected`。场所结果
  未知的整请求失败让受影响订单等待对账。
- `batch_cancel_orders` 以相同方式分块，明确的逐单场所失败表现为
  `OrderCancelRejected`。场所结果未知的传输失败让受影响订单等待对账。

### User WebSocket 频道 {#user-websocket-channel}

`CoinbaseExecutionClient` 用全新 JWT 订阅 `user` 频道，不带 `product_ids` 过滤。它把每个
事件解析为 `OrderStatusReport` 并发送到执行事件流。Coinbase 报告的是每单累计状态而非逐笔
成交，因此执行客户端从累计增量合成 `FillReport`。逐笔成交按
`(avg_now * qty_now - avg_prev * qty_prev) / delta_qty` 推导，使多次成交的订单携带正确的
成交价，而不是累计加权均价。在终态更新（`CANCELLED`、`EXPIRED`、`FAILED`）中场所会把
`leaves_quantity` 置零，此时恢复原始数量。

user 频道不回显 `price`、`stop_price`、`trigger_type` 或 maker/taker 分类。执行客户端在提交
时把这些信息缓存在 `client_order_id` 下，并在发出前修补报告，因此对账器不会观察到
`Some(price) -> None` 的分叉，`post_only` 成交也能正确盖上
`liquidity_side = Maker`。订单状态 `PENDING`、`QUEUED` 和 `OPEN` 全部映射为
`OrderStatus::Accepted`，避免 user 频道更新与 REST 的 `OrderAccepted` 事件赛跑时产生虚假的
状态倒退警告。

携带 `INVALID_LIMIT_PRICE_POST_ONLY`（或预览/下单时的等价错误）的 `submit_order` 拒绝会以
`due_post_only = true` 发出，策略可以据此响应 post-only 交叉（通常是按新的最优买卖价重新
报价）。

重连时通过 REST 重新拉取账户状态，断连窗口内的余额变化得以恢复。逐单累计跟踪跨重连保留，
合成成交增量因此保持正确。

### 成交去重 {#fill-deduplication}

user 频道 WebSocket 可能在重连时重放事件。执行客户端维护一个以
`(venue_order_id, trade_id)` 为键、容量 10,000 条的 FIFO 去重表，合成交易 ID 与近期见过的
相同的成交会被丢弃。累计状态映射表以相同容量设界，防止在本客户端生命周期内从未收到终态
事件的订单撑爆内存。极长断连（超出内存去重窗口）之后，重放的成交可能发出重复的
`FillReport` 值。这种情况下策略应依赖 REST 对账恢复规范状态。

### 持仓对账 {#position-reconciliation}

Cash（现货）账户的客户端不返回持仓报告，因为 Coinbase 现货没有持仓。Margin 账户的持仓报告
来自 REST `cfm/positions`（列表）和 `cfm/positions/{product_id}`（单笔）端点，并后置过滤到
引导加载的工具缓存。未结订单与历史成交在连接时以及 `LiveExecutionEngineConfig` 设定的标准
对账周期，通过 `generate_order_status_report(s)` 和 `generate_fill_reports` 从 REST 对账。

## 速率限制 {#rate-limiting}

Coinbase 为 Advanced Trade API 公布以下限制：

| 界面                         | 限制                                                                                | 来源                                 |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| WebSocket 连接               | 每个 IP 每秒 8 个                                                                   | Advanced Trade WebSocket Rate Limits |
| WebSocket 未鉴权消息         | 每个 IP 每秒 8 条                                                                   | Advanced Trade WebSocket Rate Limits |
| WebSocket 订阅时限           | 连接后 5 秒内必须送达首条订阅消息，否则服务器断开                                    | Advanced Trade WebSocket Overview    |
| 鉴权 WebSocket JWT           | 120 秒；每条鉴权订阅消息都必须生成新 JWT                                             | Advanced Trade WebSocket Overview    |
| REST 单 key 配额             | 每个 API key 每小时 10,000 次请求（Coinbase App 通用策略）                           | Coinbase App Rate Limiting           |

超出 REST 限制时，Coinbase 返回 HTTP `429`，响应体为：

```json
{
  "errors": [
    {
      "id": "rate_limit_exceeded",
      "message": "Too many requests"
    }
  ]
}
```

适配器还在客户端把所有 REST 流量节流到每秒 30 次请求，订阅与退订消息限制在每秒 8 条，
在突发到达场所之前就先行整形。

:::info
Coinbase 当前的 Advanced Trade 文档公布了 WebSocket 限制，但没有 Advanced Trade 专属的
REST 配额（每秒上限、按投资组合的限制），因此上面 Coinbase App 的每小时配额是最具体的
有文档数值。参考：
[WebSocket 速率限制](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-rate-limits)、
[WebSocket 概览](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/websocket/websocket-overview)、
[Coinbase App 速率限制](https://docs.cdp.coinbase.com/coinbase-app/api-architecture/rate-limiting)。
:::

## 重连与重新订阅 {#reconnect-and-resubscribe}

WebSocket 客户端重连使用指数退避，基数 250ms、上限 30s。握手完成后自动重放保留的订阅。
Coinbase 会断开连接后 5 秒内不发订阅消息的客户端，因此重放总是包含 `heartbeats`。客户端在
首次重放前标记该主题，并在其生命周期内一直保留。

对鉴权频道（`user`，以及 Margin 客户端上的 `futures_balance_summary`），适配器为每条订阅
消息生成新鲜 JWT，因为 Coinbase 要求每条鉴权 WebSocket 消息使用不同的 JWT。凭据缺失或 JWT
构建失败时，适配器跳过需要鉴权的主题，而不是不签名就发送。该失败会出现在客户端消息流的
错误里。订阅一旦被接受，数据流在 WebSocket 连接的生命周期内继续，无需再次鉴权。

执行客户端重新连接时，若此前的 user WebSocket 仍处于活动或重连中，会先关闭那个连接。它
重建内部客户端，而不是复用既有状态机。这保证即使上一会话的 `Disconnect` 命令与关闭信号
赛跑失败，也能得到全新的命令通道、输出通道和关闭信号。

## 配置 {#configuration}

### 数据客户端配置项 {#data-client-configuration-options}

| 选项                               | 默认值    | 说明                                                                              |
| ---------------------------------- | --------- | --------------------------------------------------------------------------------- |
| `api_key`                          | `None`    | 回退到 `COINBASE_API_KEY` 环境变量。                                              |
| `api_secret`                       | `None`    | 回退到 `COINBASE_API_SECRET` 环境变量。                                           |
| `base_url_rest`                    | `None`    | REST 基础 URL 覆盖。                                                              |
| `base_url_ws`                      | `None`    | WebSocket 行情 URL 覆盖。                                                         |
| `proxy_url`                        | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                            |
| `environment`                      | `Live`    | `Live` 或 `Sandbox`。                                                             |
| `http_timeout_secs`                | `10`      | HTTP 请求超时（秒）。                                                             |
| `ws_timeout_secs`                  | `30`      | WebSocket 超时（秒）。                                                            |
| `update_instruments_interval_mins` | `60`      | 工具目录刷新间隔。                                                                |
| `derivatives_poll_interval_secs`   | `15`      | 发出 `IndexPriceUpdate` 与 `FundingRateUpdate` 的 REST 轮询间隔。                 |
| `transport_backend`                | `Sockudo` | WebSocket 传输后端。                                                              |

### 执行客户端配置项 {#execution-client-configuration-options}

| 选项                     | 默认值    | 说明                                                                                                                                     |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `account_id`             | `Venue`   | Nautilus 账户标识；默认 `COINBASE-001`。                                                                                                 |
| `api_key`                | `None`    | 回退到 `COINBASE_API_KEY` 环境变量。                                                                                                     |
| `api_secret`             | `None`    | 回退到 `COINBASE_API_SECRET` 环境变量。                                                                                                  |
| `base_url_rest`          | `None`    | REST 基础 URL 覆盖。                                                                                                                     |
| `base_url_ws`            | `None`    | user 数据 WebSocket URL 覆盖。                                                                                                           |
| `proxy_url`              | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                                                                                   |
| `environment`            | `Live`    | `Live` 或 `Sandbox`。                                                                                                                    |
| `http_timeout_secs`      | `10`      | HTTP 请求超时（秒）。                                                                                                                    |
| `max_retries`            | `3`       | HTTP 请求最大重试次数。                                                                                                                  |
| `retry_delay_initial_ms` | `100`     | 初始重试延迟（毫秒）。                                                                                                                   |
| `retry_delay_max_ms`     | `5,000`   | 最大重试延迟（毫秒）。                                                                                                                   |
| `account_type`           | `Cash`    | 现货用 `Cash`，CFM 衍生品用 `Margin`。见[执行范围](#execution-scope)。                                                                   |
| `default_margin_type`    | `None`    | 应用于衍生品订单的默认 `CoinbaseMarginType`（`Cross` 或 `Isolated`）。Cash 下忽略。                                                      |
| `default_leverage`       | `None`    | 应用于衍生品订单的默认杠杆。Cash 下忽略。                                                                                                |
| `retail_portfolio_id`    | `None`    | CDP 零售投资组合 UUID，设置后随下单发送。Coinbase 已将该字段对 CDP key 标记为弃用。见[投资组合](#portfolios)。                            |
| `transport_backend`      | `Sockudo` | WebSocket 传输后端。                                                                                                                     |

配置从适配器的公开 Python 模块构造：

```python
from nautilus_trader.adapters.coinbase import CoinbaseDataClientConfig
from nautilus_trader.adapters.coinbase import CoinbaseEnvironment
from nautilus_trader.adapters.coinbase import CoinbaseExecutionClientConfig
from nautilus_trader.model import AccountId

data_config = CoinbaseDataClientConfig(
    api_key="YOUR_COINBASE_API_KEY",
    api_secret="YOUR_COINBASE_API_SECRET",
    environment=CoinbaseEnvironment.LIVE,
)

exec_config = CoinbaseExecutionClientConfig(
    account_id=AccountId("COINBASE-001"),
    api_key="YOUR_COINBASE_API_KEY",
    api_secret="YOUR_COINBASE_API_SECRET",
    environment=CoinbaseEnvironment.LIVE,
)
```

当前的 Python 示例展示了如何在 `LiveNode.builder(...)` 中把这些配置与
`CoinbaseDataClientFactory` 和 `CoinbaseExecutionClientFactory` 配对。

## 已知限制 {#known-limitations}

### 场所侧 {#venue-side}

- 订单修改仅限未结的 GTC 订单，期货场所订单以 `CANNOT_EDIT_FUTURES_ORDER` 拒绝。其余情况
  必须用撤单重下。
- OCO 订单不作为独立订单类型开放。
- 跟踪止损、MARKET_IF_TOUCHED、LIMIT_IF_TOUCHED 和冰山订单 Coinbase 不支持。
- 标记价在 REST 和 WebSocket 上都不发布，标记价订阅会被拒绝。
- 批量下单与批量改单不可用，只有批量撤单可用。
- Sandbox 是静态 mock 环境（只有 Accounts 和 Orders 端点、预定义响应、没有真实行情）。
- user 频道 WebSocket 报告的是每单累计状态，不是逐笔成交。执行客户端从累计增量推导逐笔
  数量、价格与手续费。逐笔 `trade_id` 由 `(venue_order_id, cumulative_quantity)` 合成。

### 适配器侧 {#adapter-side}

- **实时与 REST 路径的成交稳定标识不同。** user 频道不提供 Coinbase 的逐笔 `trade_id`，
  实时 `FillReport` 使用由场所订单 ID 与累计数量合成的 ID。REST 对账使用场所
  `trade_id`，因此实时处理与对账之间的标识符可能不同。
- **每个客户端只服务一个产品族。** 提交、修改、撤销与报告生成都按配置的产品族过滤
  （`AccountType::Cash` 下为现货；`AccountType::Margin` 下为永续 + 到期期货）。工具不在
  引导缓存内的订单会被拒绝。见[执行范围](#execution-scope)。
- **Cash 账户的持仓报告恒为空。** Coinbase 现货没有持仓。衍生品（CFM）持仓报告来自
  `cfm/positions`，只出现在 Margin 客户端上。
- **user 频道更新省略 `price`、`stop_price` 和 `trigger_type`。** 对本客户端提交的订单，
  缺失字段从 `submit_order` 时填充的缓存修补。对外部订单（由其他进程或 Coinbase 界面提交），
  user 频道处理器在首次见到时通过请求 `/orders/historical/{venue_order_id}` 并缓存结果来
  丰富报告。该 REST 调用给外部订单的首条 user 频道更新增加延迟，后续更新使用缓存的丰富结果。
- **cancel-all 与 batch-cancel 的 REST 列表失败只记日志。** 若列出未结订单的 REST 调用失败，
  不会发出逐单 `OrderCancelRejected`。订单停留在 `PendingCancel`，直到下次对账恢复。与 Bybit
  适配器的模式一致。
- **新上市产品必须重连才可交易。** 工具缓存在连接时填充，之后上市的产品不在缓存中，
  `submit_order` 会拒绝它们。
- **MARKET 订单默认 IOC。** 用 Nautilus 默认 `TimeInForce::Gtc` 构建的 `MarketOrder` 在场所
  被映射为 `market_market_ioc`。显式 `TimeInForce::Ioc` 被尊重。`TimeInForce::Fok` 路由到
  `market_market_fok`，Coinbase 文档注明仅限永续，现货上运行时以
  `UNSUPPORTED_ORDER_CONFIGURATION` 拒绝。`Day` 与 `Gtd` 在提交时被拒绝。
- **历史 funding 费率请求未实现。** Funding 费率只能作为衍生品 REST 轮询的实时更新获得。
- **实时 K 线订阅忽略所请求的粒度。** 场所的 `candles` 频道发布五分钟桶且不接受粒度参数，
  `subscribe_bars` 也不拒绝其他 K 线规格。任何其他步长的订阅收到的都是盖着所请求
  `BarType` 标签的五分钟 K 线。见 [K 线](#bars)。

## 诊断二进制 {#diagnostic-binaries}

三个二进制协助连通性检查、实盘验证和账户清理：

- `coinbase-http-public` 无需凭据请求现货工具、某个产品的订单簿和最近成交。用于在配置
  API key 之前确认连通性。
- `coinbase-http-private` 列出投资组合、打印钱包余额、对 `BTC-USD` 和 `BTC-USDC` 运行
  `/orders/preview`，并显示逐产品的准入标志。新账户上线时的推荐首选。
- `coinbase-cancel-all-open` 撤销所鉴权 CDP key 上的全部未结订单。测试轮次之间清空挂单
  很有用。

两个需要鉴权的二进制从环境读取 `COINBASE_API_KEY` 和 `COINBASE_API_SECRET`。

## 参与贡献 {#contributing}

:::info
要获取更多特性或为 Coinbase 适配器做贡献，请见我们的
[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
