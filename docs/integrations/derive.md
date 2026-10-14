# Derive

Derive（前身是 Lyra）是一个去中心化衍生品场所，提供欧式期权与现金结算（以 USDC）的永续互换，也是最大的链上期权市场之一。交易运行在由用户 EOA 或多签账户拥有的子账户上，抵押物留在用户自托管中，订单则通过场所的订单簿撮合。

v3 API 把操作打包成批，以便在以太坊上结算。订单链下撮合、链上结算，把订单簿执行与自托管结合在一起。订单使用 EIP-712 typed-data 签名，签名密钥是限定到某个子账户的 session key。这样签名密钥与钱包所有者保持分离，用户可以轮换或吊销访问权限而无需转移资金。

## 概览 {#overview}

Derive adapter 用 Rust 实现，位于 `crates/adapters/derive`。它提供：

- `DeriveHttpClient`：到 `api.derive.xyz/v3`（主网）或 `testnet.api.derive.xyz/v3`（测试网）的低层 REST 连接。
- `DeriveWebSocketClient`：带订阅跟踪、重连与签名下单的 JSON-RPC WebSocket 传输。
- `DeriveInstrumentProvider`：按币种拉取并缓存金融工具。
- `DeriveDataClient`：实时行情客户端。
- `DeriveDataClientFactory`：供 live node builder 使用的数据客户端工厂。
- `DeriveExecutionClient`：负责签名下单、撤单、查询与报告流程的实时执行客户端。
- `DeriveExecutionClientFactory`：供 live node builder 使用的执行客户端工厂。

执行流程针对场所的按动作模块合约（per-action module contracts）使用 EIP-712 typed-data 签名。

`nautilus_trader.adapters.derive` 提供的 Python 接口：

- `DeriveDataClientConfig`、`DeriveExecutionClientConfig`
- `DeriveDataClientFactory`、`DeriveExecutionClientFactory`
- `DeriveEnvironment`
- `DERIVE`、`DERIVE_CLIENT_ID` 与 `DERIVE_VENUE`

## 示例 {#examples}

- [Python 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/derive/)
- [Rust 示例](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/adapters/derive/examples/)

## Derive 文档 {#derive-documentation}

Derive 在 [docs.derive.xyz](https://docs.derive.xyz) 发布 API 文档。除本指南外，细节以它为准。

### V3 部署与迁移 {#v3-deployment-and-migration}

Derive 的[迁移完成公告](https://x.com/DeriveXYZ/status/2107605164131852434)宣布 v3 迁移已于 2026 年 10 月 6 日完成。
[迁移提案](https://forums.derive.xyz/t/dip-launch-derive-v3/322)描述了此后关停 Derive Chain 的安排。这些来源没有给出 v2 API 的确切退役日期，也没有说明 v2 仍可作为回退。

启动执行前，先确认迁移后的 owner、已注资的子账户与 session key 权限。V3 使用最终 owner 的 EOA 或以太坊多签作为 `wallet_address`，取代中间的 Derive Wallet。迁移提案按风险 universe 拆分标准保证金子账户，因此要确认 v3 的 `subaccount_id`：不要假设 v2 的 ID 选中的就是预期的余额与持仓。组合保证金子账户一对一迁移。

迁移过来的 v2 admin key 获得 trading、同 owner 转账、withdrawal 与 liquidation 范围，有效期上限为 genesis（即 v3 启动状态）之后 28 天；它们不会获得 `admin`、`set_session_key` 或跨 owner 转账权限。V2 只读与账户 key 迁移时不带协议范围，无法交易。通过 `private/session_keys` 检查 key 当前的有效期、范围与被许可的子账户。迁移的 key 不满足执行要求时，owner 要自行签发带范围的 v3 key：EOA 调用 `private/set_session_key`，合约 owner 提交链上的 Set Session Key 动作。见 [Testnet 接入](#testnet-onboarding) 与 [Mainnet 接入](#mainnet-onboarding)。

## 产品 {#products}

| 产品类型               | 支持      | 备注                                                                                     |
| ---------------------- | --------- | ---------------------------------------------------------------------------------------- |
| ERC-20 现货            | ✓         | USDC 计价的 `CurrencyPair`；实时 v3 限制见[现货行为](#spot-behavior)。                    |
| 永续互换               | ✓         | 以 USDC 现金结算，按币种上市，例如 `ETH-PERP`。                                           |
| 期权（看涨 / 看跌）    | ✓         | 欧式期权，符号形如 `{CURRENCY}-{EXPIRY}-{STRIKE}-{C\|P}`。                                |

## 符号体系 {#symbology}

Derive 金融工具使用场所原生符号加 `.DERIVE` 后缀：

- 现货：`ETH-USDC.DERIVE`（基础货币，计价货币）。
- 永续：`ETH-PERP.DERIVE`、`BTC-PERP.DERIVE`。
- 期权：`ETH-20260626-3000-C.DERIVE`（币种、到期日、行权价、类型）。

符号中第一个连字符分隔的段是基础货币。provider 会为每种产品类型和配置的币种翻完
`public/get_all_instruments` 的每一页。启用 `auto_load_missing_instruments`（默认）时，订阅
新币种会触发一次惰性 REST 拉取。

设置 `include_expired` 后，provider 按金融工具名称合并期权的活动与过期挂牌，同一期权在两种
挂牌中都存在（临近到期）时保留活动定义。永续与现货挂牌忽略该设置。

adapter 按场所的 `instrument_type`（`perp`、`option`、`erc20`）路由，而不是按符号后缀，因此
现货对没有特殊的符号解析。现货复用与永续、期权相同的 Trade 模块签名路径。
`crates/adapters/derive/test_data/spot/` 下的 fixture 记录了现货金融工具、订单簿、ticker 与
成交的字段形态，把解析器与执行路径钉在这些形态上。

### 现货行为 {#spot-behavior}

:::warning
V3 测试网可以接受并撤销被动挂单的 `ETH-USDC` 限价单。公共现货成交帧、被跟踪的成交手续费，
以及现货重启后的对账在 v3 上仍未验证。主网的下单/撤单在 v3 迁移前做过手工验证。当前
`ETH-USDC` 的最小数量是 `0.1 ETH`。空的现货簿无法有界地成交最小数量。
:::

- **成交稀疏**：公共现货成交频道（`trades.erc20.ETH`、`trades.ETH-USDC`）能成功订阅，但
  成交量可能很低，成交帧会稀疏。
- **簿为空**：场所仍会广播 ticker 与订单簿帧，但最优档为零。任一侧价格或数量为零时，adapter
  不发报价。见[报价](#quotes)。成交帧由撮合驱动、与簿状态无关，因此把簿打空的成交仍会发事件。
- **Standard Margin**：现货订单按初始保证金比例计保证金，不是全额名义价值。

## 环境 {#environments}

在任一客户端配置上用 `DeriveEnvironment` 枚举设置环境。

| 环境   | 配置                           | REST                                | WebSocket                            |
| ------ | ------------------------------ | ----------------------------------- | ------------------------------------ |
| 主网   | `DeriveEnvironment::Mainnet`   | `https://api.derive.xyz/v3`         | `wss://api.derive.xyz/v3/ws`         |
| 测试网 | `DeriveEnvironment::Testnet`   | `https://testnet.api.derive.xyz/v3` | `wss://testnet.api.derive.xyz/v3/ws` |

:::important
测试网使用以太坊 Sepolia，有独立的 session key 和余额。**主网与测试网的 API key 不能互换。**
:::

公共行情数据（簿、ticker、成交）不需要凭据。

从 v2 升级时，把 `wallet_address` 或钱包环境变量里旧的 Derive Wallet 地址换成 owner 的 EOA
或多签地址。见 [V3 部署与迁移](#v3-deployment-and-migration)。

两条网络的 EIP-712 domain separator、Action typehash 与 Trade 模块地址都内置在
`crates/adapters/derive/src/common/consts.rs`，并对照 Derive 的
[v3 动作签名参考](https://docs.derive.xyz/authentication/action-signing)跟踪更新。主网用以太坊
chain 1，测试网用 Sepolia chain 11155111，两者共用同一 Trade 模块地址。owner 是 EOA 或多签，
session key 提供签名者地址。`DeriveExecutionClientConfig::domain_separator`、`action_typehash`
与 `trade_module_address` 接受按实例的覆盖，优先于内置值。

订单、触发订单与替换请求按 1e18 定点缩放对七个词的 Trade ABI 签名。金融输入（含末尾的零）
必须不超过 12 位小数。超出精度会报错，而不是截断被签名的值。请求发送的就是构造签名时使用的
同一组十进制值。

动作 nonce 使用 UNIX 纳秒，在请求与响应中以十进制字符串传输。分配器在同一进程内按钱包与
子账户共享一条单调递增流，跨客户端实例生效，与钱包大小写无关。时钟回拨时，只要最后一个 nonce
仍在本地时间一小时之内，就把它前移。adapter 采用闭区间订单窗口
[本地时间减 90 天，本地时间加 1 小时]，这是场所文档化 120 天窗口内保守的回看幅度。本地时间
近似服务器时钟，因此时钟偏差仍可能导致场所拒绝。登录时间戳用毫秒，签名有效期用秒。

### 把现有部署切换到 v3 {#switch-an-existing-deployment-to-v3}

1. 停止提交订单，对账现有订单、成交、余额与持仓。
1. 确认 v3 的 owner 地址、已注资的子账户、session key 的有效期与范围，以及环境。
1. 用 v3 默认值连接，确认公共行情与认证后的账户读取正常。
1. 在启用策略前，于测试网与主网用显式的价格、手续费与敞口边界验证最小数量执行。

账户读取或签名失败时，停止执行，对照所选环境检查 owner、子账户、key 权限与签名常量。重连后
先对账场所状态，再恢复下单。只把 URL 改回 v2 不是恢复手段：本 adapter 使用 v3 请求模式、
纳秒 nonce 与 v3 签名，不支持 v2 API。

V2 的触发订单与 TWAP 订单不会延续到 v3。重建预期的触发订单前先检查场所状态。本 adapter
不提交 TWAP 订单。

## Testnet 接入 {#testnet-onboarding}

达到执行客户端可提交签名订单这一步所需的步骤：

1. **登录测试网控制台。** 打开
   [testnet.app.derive.xyz](https://testnet.app.derive.xyz/) 并连接 owner 的 EOA 或多签。
1. **复制 owner 钱包地址。** 用你的 EOA 或多签地址作为 `wallet_address`，客户端通过
   `X-DeriveWallet` 头发送它。V3 没有单独的 Derive Wallet 地址。
1. **为子账户注资。** 按 Derive 的
   [充值指南](https://docs.derive.xyz/getting-started/depositing)在 Sepolia 上铸造测试抵押物并
   充值。首笔充值会创建账户与子账户。把已注资子账户的整数 ID 复制为 `subaccount_id`。订单
   需要足够的抵押物覆盖其保证金。
1. **生成 session key。** 按 Derive 的
   [session key 指南](https://docs.derive.xyz/authentication/session-keys)注册一个协议范围为
   `trade:orderbook:all`（或更窄的产品范围）、限定到该已注资子账户的 key。单独的链下
   `account_info` 能力不授予交易权限。选择有效期并通过 `private/session_keys` 核对记录。
   把原始 secp256k1 私钥复制为 `session_key`。它只留在本地，并在 `Debug` 输出中被打码。

   要吊销一个 key，用过去或零有效期重新注册它。吊销有 [5, 15] 分钟的最小冷却期，不会立即
   生效。
1. **设置环境变量。** 导出测试网模式下客户端读取的三个值（或直接在
   `DeriveExecutionClientConfig` 上传入，此时配置字段优先）：

   ```bash
   export DERIVE_TESTNET_WALLET_ADDRESS="0x..."  # owner EOA or multisig
   export DERIVE_TESTNET_SESSION_PRIVATE_KEY="0x..."  # secp256k1 session-key private key
   export DERIVE_TESTNET_SUBACCOUNT_ID="12345"  # integer subaccount id
   ```

EOA owner 通过 `private/set_session_key` 注册 key。多签或合约 owner 必须先给账户注资，再从
owner 合约在 Sepolia 或以太坊上提交 Set Session Key 动作。账户不存在时，链上注册会被忽略。
按场所的[多签指南](https://docs.derive.xyz/authentication/contract-owned-accounts)操作。

### 最小注资 {#minimum-funding}

注资必须覆盖场所的初始保证金要求与挂单占用。订单能否被接受还取决于场所的价格、数量与执行
规则。按场所的保证金数值来估算最小可行测试所需的注资：

- **冒烟测试（提交并撤销，不成交）**：注资至少要覆盖按金融工具 `minimum_amount` 挂被动单
  所需的保证金。
- **期权**：按场所对该被动单的保证金要求估算充值额度。`public/get_instrument` 提供合约细节
  但不报告初始保证金要求。

要做成交往返，需覆盖场所的保证金要求、手续费和一段有界的价格波动。使用当前可成交报价、最小
可行数量、`max_fee_per_contract`，以及限价或有界的 `market_order_slippage_bps`。用
reduce-only 市价单或 `IOC`/`FOK` 订单平掉观察到的永续或期权敞口，现货敞口用反向订单平掉，
并确认没有留下挂单或持仓。

订单规模上限与 taker 例外见[金融工具加载](#instrument-loading)。

### 检查账户健康 {#check-account-health}

注资后用 `private/get_subaccount` 确认：计入目标敞口的初始保证金后，`initial_margin` 仍为
正。两个健康字段都在场所的风险扣减之后计入抵押物授信与持仓盯市价值：

| 场所字段             | 含义                             | 为负的后果                                                                   |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `initial_margin`     | 带符号的净初始保证金健康度       | 场所会拒绝会让该值变负的增加风险的订单。                                      |
| `maintenance_margin` | 带符号的净维持保证金健康度       | 子账户面临强平风险。                                                          |

adapter 的 `query_account` 命令把这份快照作为 `AccountState` 事件发出，策略层可据此检查当前
健康度。这些净健康度数值不含挂单占用，为正并不能证明还能接受另一笔订单。场所的
`private/order_quote` 会对拟定订单返回前后初始保证金健康度；实际的订单接受仍是权威。映射见
[账户状态](#account-state)。

## Mainnet 接入 {#mainnet-onboarding}

主网接入与测试网步骤相同，只是换成生产控制台，并使用真实资金。

1. **登录主网控制台。** 打开 [app.derive.xyz](https://app.derive.xyz/) 并连接 owner 的 EOA
   或多签钱包。
1. **复制 owner 钱包地址。** 用 EOA 或多签地址作为 `wallet_address`，客户端用它认证，它也
   是签名动作的 owner。
1. **注资或选择子账户。** 按 Derive 的
   [充值指南](https://docs.derive.xyz/getting-started/depositing)在以太坊上充值 USDC 或受支持
   的抵押物。首笔充值会创建账户与子账户。把已注资子账户的整数 ID 复制为 `subaccount_id`，
   并通过 `private/get_subaccount` 确认充值已计入抵押物余额。adapter 的 `query_account` 会在
   `AccountState.info.collaterals` 中暴露建模后的行。

   按[检查账户健康](#check-account-health)所述，检查发出元数据中的 `net_initial_margin` 与
   `net_maintenance_margin`。净健康度为正并不能证明订单会被接受。
1. **生成主网 session key。** 按 Derive 的
   [session key 指南](https://docs.derive.xyz/authentication/session-keys)注册一个协议范围为
   `trade:orderbook:all`（或更窄的产品范围）、限定到该子账户的 key，并通过
   `private/session_keys` 核对其范围与有效期。合约 owner 使用
   [Testnet 接入](#testnet-onboarding)描述的链上注册（主网在以太坊上）。复制原始 secp256k1
   私钥。探索性测试运行优先用短有效期 key。

   要吊销一个 key，用过去或零有效期重新注册它。吊销有 [5, 15] 分钟的最小冷却期，不会立即
   生效。
1. **设置环境变量。** 导出三个主网值（或直接在 `DeriveExecutionClientConfig` 上传入，此时
   配置字段优先）：

   ```bash
   export DERIVE_WALLET_ADDRESS="0x..."  # owner EOA or multisig
   export DERIVE_SESSION_PRIVATE_KEY="0x..."  # secp256k1 session-key private key
   export DERIVE_SUBACCOUNT_ID="12345"  # integer subaccount id
   ```

### 选择示例网络 {#select-the-example-network}

:::warning
每个 Rust 示例（`node_data_tester`、`node_exec_tester`、`node_delta_neutral`）都在文件开头附近
用 `const DERIVE_ENVIRONMENT: DeriveEnvironment` 字面量固定网络。**每次运行前都要检查这个
常量**，切换网络时要改它。示例不从环境读取网络。
:::

生产部署通过 `DeriveDataClientConfig::environment` / `DeriveExecutionClientConfig::environment`
选择网络。

## 推荐码归因 {#referral-code-attribution}

每笔签名的订单、替换与触发订单都携带硬编码的 NautilusTrader 推荐码。Derive 用自身收入为推荐
计划出资，因此归因不增加交易成本、无需审批、也不可配置。这帮助我们了解该集成的真实用量，
并安排后续维护的优先级。

## 能力 {#capabilities}

### 行情数据 {#market-data}

| 能力                         | 支持      | 备注                                                                     |
| ---------------------------- | --------- | ------------------------------------------------------------------------ |
| 请求金融工具（REST）         | ✓         | `public/get_instrument`；加载单个金融工具到本地缓存。                     |
| 请求全部金融工具（REST）     | ✓         | 按币种分页调用 `public/get_all_instruments`。                             |
| 金融工具订阅                 | -         | *不支持。*使用配置的 REST 刷新间隔。                                      |
| 订单簿增量（L2_MBP）         | ✓         | 频道：`orderbook.{instrument}.{group}.{depth}`。                          |
| 订单簿深度（L2_MBP）         | ✓         | 同一订单簿频道，`depth=10`。                                              |
| 定时订单簿                   | -         | *不支持。*在本地由增量维护定时簿。                                        |
| 订单簿快照（REST）           | -         | *不支持。*场所没有簿快照端点。                                            |
| 历史簿增量（REST）           | -         | *不支持。*场所没有历史簿端点。                                            |
| 报价（`ticker_slim`）        | ✓         | 频道：`ticker_slim.{instrument}.{interval}`。                             |
| 报价快照（REST）             | ✓         | 一次性 `public/get_tickers`；发出单个 `QuoteTick`。                       |
| 历史报价（REST）             | -         | *不支持。*场所只提供 ticker 快照。                                        |
| 成交                         | ✓         | 频道：`trades.{instrument_type}.{currency}`。                             |
| 历史成交（REST）             | ✓         | 按时间顺序并去重；`limit` 保留最新的成交。                                |
| K 线 / OHLC（REST）          | ✓         | 已收盘的分钟、小时、日、周 K 线，时间戳为桶收盘时刻。                     |
| K 线 / OHLC（WS）            | -         | *不支持。*场所没有 candle 订阅频道。                                      |
| 标记价流                     | ✓         | 由 `ticker_slim` 派生；与报价共用订阅。                                   |
| 指数价流                     | ✓         | 由 `ticker_slim` 派生；与报价共用订阅。                                   |
| 资金费率流                   | ✓         | 由永续 ticker 的资金费率字段派生。                                        |
| 资金费率历史（REST）         | ✓         | 按永续的时间顺序；`limit` 保留最新的有效行。                              |
| 金融工具状态                 | -         | *不支持。*金融工具定义携带 `is_active`。                                  |
| 金融工具收市                 | -         | *不支持。*场所仅通过 REST 发布期权结算。                                  |
| 期权 Greeks                  | ✓         | 由期权 ticker 的 `option_pricing` 派生。                                  |
| 期权链                       | ✓         | 由报价与 Greeks 聚合；`public/get_tickers` 用于 ATM 引导。                |

#### 报价 {#quotes}

WebSocket ticker 为永续、期权与现货报告完整快照。任一侧价格或数量为零时，adapter 清空该
金融工具的内部报价状态，不发 `QuoteTick`（以 DEBUG 记录）。快照两侧都给出非零价格与数量时
恢复报价。

最后发出的报价仍以原时间戳留在 Nautilus 缓存中。抑制报价输出不会撤回缓存中的那份报价。其他
已订阅的 ticker 字段——包括标记价与指数价、资金费率与期权 Greeks——继续独立发出。

#### 金融工具加载 {#instrument-loading}

`request_instrument` 对所请求的 `InstrumentId` 调用 `public/get_instrument`，在发出响应前先
缓存返回的定义。缓存的金融工具携带后续报价、成交、簿与 K 线解析所用的精度与增量字段。

永续、期权与现货的数量字段映射如下：

| Derive 字段        | Nautilus 字段              | 处理方式                                                  |
| ------------------ | -------------------------- | --------------------------------------------------------- |
| `minimum_amount`   | `info["minimum_amount"]`   | 作为场所元数据保留；`min_quantity` 保持未设置。             |
| `amount_step`      | `size_increment`           | 订单数量增量。                                              |
| `maximum_amount`   | `max_quantity`             | 最大订单数量。                                              |

:::important
Derive 可以让 taker 订单以低于 `minimum_amount` 的数量成交，而会挂在簿上的订单可能被
`11012: Invalid amount` 拒绝。**低于最小数量的订单是否有效由 Derive 判定。**
:::

金融工具加载把场所错误码 `12001` 视为该产品类型的空结果，因此某个币种缺少永续、期权或现货
挂牌不会阻塞它的其他产品。无法解析为领域金融工具的行会记日志并跳过，有效的行继续加载。响应
字段畸形会让该币种的拉取整体失败。初始加载期间的拉取错误也会导致连接失败。

#### 历史数据 {#historical-data}

| 数据       | REST 端点                             |
| ---------- | ------------------------------------- |
| 成交       | `public/get_trade_history`            |
| K 线       | `public/get_tradingview_chart_data`   |
| 资金费率   | `public/get_funding_rate_history`     |

##### 成交方向与去重 {#trade-direction-and-deduplication}

公共 REST 历史与 WebSocket 成交可能在同一 `trade_id` 下返回 maker 行与 taker 行，每行的
`direction` 是该参与方的方向。adapter 取 taker 的方向作为主动方方向，并把 maker 行的方向
取反，与行的先后无关。实时 v3 maker WebSocket 行的映射仍未验证。`liquidity_role` 缺失或
无法识别时，adapter 把 `direction` 当作 taker 的方向。

历史成交请求在单次请求内按成交 ID 各发出一个 `TradeTick`。实时馈送会在 ID 仍留在最近 4,096
笔成交缓存内时抑制成对的行与重连回放。自动重连保留这份缓存；显式断开或重置会清空它。

##### K 线要求与时间边界 {#bar-requirements-and-time-bounds}

- **聚合与价格**：K 线要求 `EXTERNAL` 聚合与 `PriceType::Last`，因为 Derive 的 candle 基于
  成交。
- **周期**：场所支持 1、5、15、30 分钟，1、4、8 小时，1 天与 1 周的步长。其他 K 线规格在
  请求发出前就被拒绝。
- **时间边界**：K 线的 `end` 边界在场所侧按桶的起始时间筛选。响应会省略收盘时刻晚于请求时刻
  的桶，包括场所返回的尚未收盘的那个桶。

#### 订单簿馈送 {#order-book-feeds}

Derive 通过同一个 `orderbook.{instrument}.{group}.{depth}` 频道家族提供簿增量与深度快照。
`subscribe_book_deltas` 把快照 delta 作为 `OrderBookDeltas` 发出，`subscribe_book_depth` 固定
`depth=10` 并发出 `OrderBookDepth` 快照。

每个分组的[簿更新](https://docs.derive.xyz/subscriptions)都是完整快照。频道参数一致的 delta
与 depth 消费者共享订阅与恢复状态，频道保持活跃直到最后一个消费者退订。

该馈送没有变更 ID，因此 adapter 用其毫秒时间戳作为输出序列：

- adapter 只接受严格新于最后接受时间戳的时间戳，跨重连同样如此。
- 递进的空快照会清空簿，并计为一次更新。

Derive 文档没有承诺时间戳有序。`publish_id` 在重新订阅后可能重新开始。

### 执行 {#execution}

Derive 使用配置的 session key 做认证执行：

- 订单提交与替换请求携带本地生成的 EIP-712 签名。
- 实时执行客户端通过认证 WebSocket 发送订单写操作，并通过私有频道接收账户、订单、成交与
  余额更新。
- 报告生成、账户刷新与金融工具查询使用 REST。

#### 成交与结算 {#fills-and-settlement}

adapter 以 `trade_id` 与 `order_id` 作为执行身份吸收实时与历史成交。数量、价格与手续费按
`Decimal` 解码。手续费按 USDC 的 Nautilus 精度取整。

订单状态与私有成交报告在订单标签是有效的 Nautilus 标识时把它用作 `client_order_id`。无法
表示的标签会被 adapter 连同 warning 一起省略，保留场所身份与金融数值。对账可以按场所订单
ID 解析这些成交。

必需金融数值为 null、空或缺失时解码失败。私有成交数组跳过畸形行并记 warning。非法的金融
wire 值会让整条公共 WebSocket 帧或整个公共 REST 页被拒。无法表示的必需成交或订单 ID 会让
该行解析失败，adapter 记 warning 并继续处理其余行。

结算元数据不会阻止成交生效。执行首次到达时，`batch_status` 与以太坊 L1 batch 的 `tx_hash`
可能为 null。私有成交模式要求 `op_uuid`，adapter 也接受它缺失。已发布的 batch 阶段及其
对应的 `Error` 状态描述的是某个 batch 阶段的结算进展或失败。batch 阶段报错时，adapter
不会冲销或作废成交。参见场所的 [API changelog](https://docs.derive.xyz/changelog)。

私有自成交 ID 的唯一性，以及 `trade_fee` 是否包含非零的外部订单 `extra_fee`，都未经验证。
私有成交按 `trade_id` 去重，因此完整的自成交核算依赖场所给两条腿分配不同的 ID。adapter 不
提交 `extra_fee`。

成交频道没有结算状态过滤：adapter 订阅 `trades.{instrument_type}.{currency}` 与
`{subaccount_id}.trades`。成交报告查询会跳过实时已发出成交缓存中的 ID，并在同一查询的页内
与页间对重复 ID 去重。查询某笔成交不会把它记为已发出。核心对账使用持久化的订单成交 ID，
以拒绝回放或重启后重复应用成交。

实时分派在改变订单状态之前先构造成交报告与手续费。手续费转换失败会让该成交保持未处理，以便
回放重试。只有在投递成功后，adapter 才把该成交 ID 记为已发出。投递失败会保留原生成交记录。

对被跟踪的订单，原生成交可能先于确认到达，从而建立其首个场所绑定。adapter 会先发
`OrderAccepted` 再发 `OrderFilled`。方向与被跟踪订单冲突的成交会一直保持待定，即使该订单
之后进入终态。

私有成交更新可能早于 REST 历史或持仓读取反映的时间到达。结算进展不会在 adapter 中触发额外
的历史轮询。

:::note
`DeriveHttpClient` 也暴露用于工具与测试的 HTTP 下单方法。
:::

永续、期权与 ERC-20 现货对都使用 Derive Trade 模块。现货没有单独的签名路径，除下文的
reduce-only 保护外，对账把现货金融工具与其他金融工具类别同等对待。

adapter 支持常规的 `private/order` 请求：`GTC`、`IOC` 或 `FOK` 有效期的 `LIMIT` 与
`MARKET` 订单；也支持把 Derive 触发订单用于下述 Nautilus 原生的止损与 if-touched 订单类型。
不支持的 Nautilus 订单类型会在提交前于本地以 `OrderDenied` 拒绝，因此不可能在场所成交。

:::important
**市价单提交前必须有缓存的报价。**没有报价时 adapter 发出 `OrderDenied`，绝不做签名。
:::

异步提交任务解析出金融工具后，会刷新当前 ticker 快照，并从刷新后的报价推导出带滑点边界的
签名 `limit_price`。

#### 替换普通订单 {#replacing-regular-orders}

Derive 把普通订单的修改实现为撤销-替换（cancel-replace）。adapter 在多个原生场所订单 ID
之间保持同一个 client order 身份，并在路由子成交之前发出 `OrderUpdated`。命令使用当前的
场所绑定，而延迟到达的成交保留其原本的场所订单 ID。

替换数量是请求的毛数量减去全部已证实的先前成交。例如，替换一笔已成交 `0.3`、毛目标为 `1.5`
的订单，子单签名数量为 `1.2`。请求还会把 `expected_filled_amount` 设为观察到的当前腿成交
上限。若目标的已成交量超过该值，Derive 的
[replace 保护](https://docs.derive.xyz/trading/order-types#replace-atomic-cancel-+-replace)
会拒绝该 replace。逻辑订单报告包含累计成交、全部所需原生平均值齐备时的数量加权均价，以及
最早的原生创建时间戳作为接受时刻。

#### 启动对账 {#startup-reconciliation}

私有流开始之前，执行客户端先发布账户状态；加载原生组合与缓存活动订单所需的金融工具定义；
等待引擎缓存观察到这些定义后才开始私有流；从缓存的订单事件恢复所持有的活动订单上下文
（包括已知的场所 ID 与已处理的成交 ID）；再针对这些金融工具的原生挂单与历史校验活动订单。
历史元数据的缺口不会妨碍这一绑定检查。

私有订阅确认后，处理流更新之前，它会再次刷新账户状态与所需金融工具定义，以闭合初始组合
快照与订阅确认之间的时间窗。

`private/get_order` 对已知场所 ID 返回 `11006` 时，adapter 会在分页的
`private/get_order_history` 中查找该确切 ID，不会从订单标签推断未经证实的替换绑定。未决的
后继订单会阻塞启动或报告生成；也会拒绝单笔撤销与修改命令，并在发送前让批量撤销与
`cancel_all_orders` 返回错误。状态变更类的歧义请求保持不重放。

进程仍保留替换所用的 nonce 与目标时，原生 REST 行可以用与 WebSocket 行相同的父 ID 与 nonce
检查来解析它。替换历史读取从保留 nonce 时间戳前一小时开始，以容纳场所接受的未来 nonce
窗口。后继订单缺失并不能证明替换失败。进程重启后，缓存的 `PendingUpdate` 事件不含足够
证据来自动解析有歧义的替换。

若未决的替换阻止了启动：

1. 停止交易节点，保留其缓存与订单事件历史。
1. 通过场所的账户工具检查该子账户的原生订单、成交与持仓，按原生 ID 与替换谱系匹配自有订单。
   标签匹配本身不能确立对后继订单的所有权。
1. 处理掉未决的场所订单，并在恢复交易前把缓存订单状态与已确认的原生记录对账。adapter 不为
   这种情况提供自动缓存修复。只清掉 `PendingUpdate` 不能确立替换的结果。

Mass status 保留原生替换腿与成交。对未缓存的替换链，启动对账会恢复已证实的实时后继订单，
连同累计成交与原生场所订单 ID。恢复出的替换后继订单支持查询、修改与撤销。重连快照让未缓存的
替换报告保持原生形态，不重建这些链。

若未缓存的替换链开始在有界回看起点之前，mass status 会把完整历史窗口延伸到其首腿。mass
status 会按确切场所 ID 拉取历史与挂单中缺失的成交伴生记录（包括未缓存订单），并把它们保留在
回看窗口之外。

已缓存的腿保留身份与替换检查。历史与挂单谱系显示标签在一条替换链之外被复用的未缓存订单与
成交会省略 client order ID。该检查使用历史与挂单的谱系。活动挂单保留其 ID。

**恢复限制**：

- 启动会校验子账户上全部带标签的未缓存替换链（在引擎过滤器生效之前），包括其他机器人的
  链。无效的链可能阻止启动。长链会拉长历史读取，可能超出对账超时。
- 不要让其他进程替换本节点已收养的订单。启动会为跟踪登记所有已收养的挂单。没有本地待处理
  修改的外部替换会让绑定保持未决，阻塞报告与命令，直到原生状态对账完毕且节点重启。
- 有界快照在历史失败、或回退后仍缺少未缓存伴生记录时，把覆盖范围标记为不完整。历史失败会
  跳过伴生查找。
- 启动恢复未缓存的替换链需要完整的订单、成交与持仓来源，且原生成交须与每条前腿及累计成交
  数量相符，否则请求失败。
- 身份矛盾或替换谱系非法会使请求失败，包括有界快照。历史可用时，缓存伴生记录不可用、或
  除 `11006` 以外的查找错误同样会使请求失败。

只查活动订单的请求返回活动订单。对已知被替换腿的请求返回当前逻辑订单。单笔与批量查询对未缓存
的替换链返回原生报告，启动对账会恢复该链。

无界重连快照在某个来源失败、记录丢失、或成交没有匹配的订单报告时失败。带推断精度的保留历史
行不会让快照失败。有界快照保留有效的报告，把元数据缺口或丢失记录标记为覆盖不完整。若场所
在分页期间改变私有历史的记录数或页数，adapter 丢弃本次扫描并最多重启两次；再次出现数量变化
则请求失败。

#### 保证金模型选择 {#margin-model-selection}

把 `DeriveExecutionClientConfig.subaccount_id` 设为现有的 Standard Margin（`SM`）或 Portfolio
Margin（`PM2`）子账户。每个子账户绑定其创建时选定的 manager 与风险 universe，adapter 从
`private/get_subaccount` 读取这些标识。同一套账户查询、订单、持仓报告与重连路径服务于两种
模型。按该 manager 支持的产品配置数据客户端的币种。

连接前先通过场所的账户工具创建或注资子账户。adapter 不改变它们的保证金模型，也不复刻场所的
组合风险引擎。受支持的抵押物与金融工具见 Derive 的
[manager 与风险 universe](https://docs.derive.xyz/trading/managers-and-risk-universes)。

默认的原生风险引擎按金融工具用所需货币对照可用余额检查初始保证金，不使用 Derive 的 PM2
净健康度元数据做订单准入或组合规模计算。因此场所 PM2 健康度为正，并不能确立用另一种货币
的抵押物可做原生准入。跨货币抵押物与非零维持保证金授信（`mm_credits`）下的实时行为仍未
验证。

#### 账户状态 {#account-state}

Derive 在子账户层面持有保证金。`AccountState` 把抵押物余额、保证金要求与净账户健康度分
开设：

##### 抵押物余额 {#collateral-balances}

- `total` 是抵押物 `amount`（例如 USDC 或 ETH），按注册货币的精度取整。
- `locked` 为零。待处理的 vault 存款冻结由 adapter 保留在元数据中。
- `free` 等于取整后的 `total`。
- `AccountState.info.collaterals` 保留每条抵押物行的子集，以精确小数字符串表示。
- `collaterals[].initial_margin` 是该抵押物贡献的美元授信，不是锁定资金。

##### 保证金要求 {#margin-requirements}

adapter 发出一个账户级的 `MarginBalance`：

| Nautilus 字段   | 派生的美元需求                                                        |
| --------------- | --------------------------------------------------------------------- |
| `initial`       | `positions_value - positions_initial_margin - open_orders_margin`     |
| `maintenance`   | `positions_value - positions_maintenance_margin`                      |

来源的 `positions_*_margin` 字段是带符号的健康度贡献，已含持仓盯市价值；从 `positions_value`
中减去它们即得到对应的风险需求。`open_orders_margin` 是挂单占用的带符号扣减，因此会增大
提取出的初始需求。adapter 使用子账户聚合值（保留场所的组合抵消），不发出按金融工具的保证金
余额。

发出的需求按原生 USD 精度取整（两位小数，逢半向偶数取整）。子账户的 `currency` 数组不决定
其计价单位。建模的来源值保留在 `AccountState.info` 中。adapter 不计算抵押物折扣，也不对
`mm_credits` 另做调整。

:::warning
`AccountState.info` 中的 `net_initial_margin` 与 `net_maintenance_margin` 报告当前净健康度
（含持仓盯市价值），不含挂单占用。前后初始保证金健康度要用场所的订单报价查询。额外订单能否
执行，以实际的订单接受结果为准。
:::

##### 账户元数据 {#account-metadata}

`AccountState.info` 携带账户标识、带符号的净健康度与精确风险值：

- `net_initial_margin` 与 `net_maintenance_margin` 是净健康度。
- `positions_value` 是持仓盯市总值。
- `positions_initial_margin` 与 `positions_maintenance_margin` 是带符号的持仓健康度贡献。
- `open_orders_margin` 是挂单占用对初始健康度的带符号扣减。
- `margin_type` 与 `manager_id` 标识保证金模型；`risk_universe_id` 标识其风险 universe。
- `currency` 保留场所的货币数组。
- `collaterals` 保留每条抵押物行的子集，以精确小数字符串表示。
- `mm_credits` 是风险 universe 损失社会化带来的维持保证金授信。
- `projected_margin_change` 保留下一次期权到期一分钟后 `net_maintenance_margin` 的预计变化。
- `vault_deposit_holds` 保留待处理的冻结，包括原生数量与目标 vault ID。
- `is_under_liquidation` 是强平状态。

建模的小数以 JSON 字符串表示，在 `Decimal` 范围与其 28 位最大标度内精确；超出该标度的来源
值在解码时取整。原生余额也会把小于其货币精度的数量取整为零。在意这种精度时使用抵押物
元数据。场所没有说明待处理的 vault 冻结是否计入抵押物数量，因此 adapter 既不从中扣除，也
不额外加上。

快照被标记为 `failed_to_fetch` 或缺少必需字段时，不发 `AccountState`、初始连接失败，并跳过
重连后的 mass status。畸形的嵌套行——包括超出原生 `Quantity` 精度或范围的持仓——会让整个
账户快照失败。持仓报告请求还要求数量适配缓存金融工具的数量精度。单个持仓转换失败会拒掉整个
mass status，包括其中的订单与成交报告，以保留缓存持仓，避免把缺失的持仓报告当成平仓。

持仓报告保留场所的均价开仓价。对永续，该价格包含开仓手续费，可能与按真实成交价重建的均价
不同。adapter 对永续使用
[`AvgPxReconciliation::OpeningOnly`](./../concepts/execution/reconciliation.md#reported-entry-averages)：
持仓数量相符时，不要求成交推导的均价等于报告的均价。真实成交价、数量与手续费保持不变。
Nautilus 不把手续费计入持仓均价，而是从已实现盈亏中扣除。其他金融工具类型保持默认的均价
对账。

成交历史缺失时，恢复流程按报告的均价开一个合成持仓，按金融工具价格精度取整。历史不完整时，
合成恢复可能给出近似的成本基础。需要精确的按成交核算时，把对账回看设置得足以覆盖当前持仓的
开仓成交。

#### 条件订单 {#conditional-orders}

Derive 触发订单使用带触发字段的 `private/order`。场所为其分配订单 id 并以
`order_status=untriggered` 保存，直到其触发工作进程提交签名的子订单。因此对账同时读取
`private/get_open_orders` 与 `private/get_trigger_orders`。

实时 v3 触发器的执行、以及历史或持仓视图滞后时的漏更新恢复仍未验证。重连或重启成功并不能
证明这些场景。

##### 签名有效期 {#signature-expiry}

API v3 接受生命周期在 [10 秒, 120 天] 内的订单签名。MMP 订单最长 15 分钟。adapter 保持
MMP 关闭，触发订单用固定 31 天有效期签名。`signature_expiry_secs` 控制普通订单与替换，
必须大于 10 秒以容纳签名延迟，上限 120 天。参见
[动作签名](https://docs.derive.xyz/authentication/action-signing)。

##### 支持的类型 {#supported-types}

| Nautilus 订单类型     | 支持      | Derive `order_type` | Derive `trigger_type` | 备注                           |
| --------------------- | --------- | ------------------- | --------------------- | ------------------------------ |
| `StopMarket`          | ✓         | `market`            | `stoploss`            | 以触发价作为边界。              |
| `StopLimit`           | ✓         | `limit`             | `stoploss`            | 发送限价与触发价。              |
| `MarketIfTouched`     | ✓         | `market`            | `takeprofit`          | 以触发价作为边界。              |
| `LimitIfTouched`      | ✓         | `limit`             | `takeprofit`          | 发送限价与触发价。              |
| `MarketToLimit`       | -         | -                   | -                     | *Derive 不支持*。               |
| 移动止损              | -         | -                   | -                     | *Derive 不支持*。               |
| TWAP / algo / RFQ     | -         | -                   | -                     | *本 adapter 不暴露*。           |

adapter 把 Nautilus 的 `TriggerType::Default` 与 `TriggerType::MarkPrice` 映射到 Derive 的
`trigger_price_type=mark`。Derive 的错误码文档说明指数价与最新成交价触发类型不受支持，因此
adapter 对 `IndexPrice`、`LastPrice`、`BidAsk` 及其他触发价类型在提交前本地以
`OrderDenied` 拒绝。

##### 更新触发单 {#updating-a-trigger}

Derive 错误码 `11054` 说明触发订单不能替换别的订单、也不能被替换。因此 adapter 以
`OrderModifyRejected` 事件拒绝针对触发订单的 Nautilus 修改请求。要更新触发单，请撤销后
重新提交。

##### 触发价偏移 {#trigger-price-offsets}

Derive 会校验触发价的方向：触发价没有按预期方向位于当前价格之外时，以错误码 `11051` 拒绝。
触发价在订单签名时即固定，因此快市或高价金融工具上过小的偏移，可能在场所收到前漂移到错误的
一侧。

:::warning
触发偏移要留出足以覆盖提交期间预期价格波动的幅度（对 `ETH-PERP` 而言是几十美元，而不是
几美分）。偏移过小会产生无谓的 `11051` 拒绝。
:::

#### 批量撤单 {#bulk-cancellation}

##### 选择与路由 {#selection-and-routing}

Derive 支持 `Strategy` 暴露的两种多订单撤销方式。

| Strategy 方法          | 支持      | 参数                                                                  | 备注                                       |
| ------------------------ | --------- | --------------------------------------------------------------------- | ------------------------------------------ |
| `cancel_orders(...)`     | ✓         | `client_order_ids`、`client_id`、`params`                              | 所有订单必须使用同一金融工具。               |
| `cancel_all_orders(...)` | ✓         | `instrument_id`、`order_side`、`client_id`、`strategy_only`、`params`  | 默认只作用于调用策略的订单。                  |

Derive 执行客户端按如下方式应用这些方法：

- **显式订单**：`cancel_orders` 逐个撤销请求的普通或触发订单。
- **仅本策略**：`strategy_only=True` 的 `cancel_all_orders` 把缓存中匹配的结果展开为逐个撤销。
- **按方向过滤**：`strategy_only=False` 且带 Buy 或 Sell 过滤时，`cancel_all_orders` 从缓存中
  选出配置的执行客户端、账户、精确金融工具与该方向的普通与触发挂单，然后逐个撤销。它从不扩大
  到双向。
- **双向**：`strategy_only=False` 且无方向过滤时，`cancel_all_orders` 从同一执行客户端、账户与
  金融工具范围选出匹配的挂起触发单并逐个撤销，再对普通订单发送 `private/cancel_by_instrument`。
  它从不发送 `private/cancel_all`。

`cancel_all_orders` 直接从缓存选取符合条件的订单，不刷新场所状态。对每个选中的订单，执行
客户端当前的场所绑定优先于缓存的 ID。待触发的触发单使用 `private/cancel_trigger_order`；
已激活触发单的逐个撤销使用 `private/cancel`。双向模式把已激活的触发单留给
`private/cancel_by_instrument`。客户端在限速之后再次检查激活状态，把等待期间才激活的触发单
先经 `private/cancel` 路由，再入队请求。

##### 失败处理 {#failure-handling}

`strategy_only=False` 时，若选中的订单既没有当前绑定也没有缓存的场所订单 ID，
`cancel_all_orders` 保守失败：整条命令记 warning，不发送任何撤销请求，也不发出订单事件。

`private/cancel_by_instrument` 只撤销普通挂单。成功响应且 `cancelled_orders == 0` 是预期的
空操作，以 debug 级别记录。

触发单撤销失败会记 warning，但不妨碍随后的按金融工具普通撤单。批量请求失败时没有可发出的
逐单结果，观测到的订单状态仍由私有频道更新与后续对账负责。

#### 执行指令 {#execution-instructions}

| 指令          | 支持      | Derive 取值     | 备注                                                          |
| ------------- | --------- | --------------- | ------------------------------------------------------------- |
| `post_only`   | ✓         | `post_only`     | 要求 `GTC`；会吃流动性时被拒。                                 |
| `reduce_only` | ✓         | `reduce_only`   | 永续与期权，仅限市价或 `IOC`/`FOK`；现货拒绝。                 |

#### 有效期 {#time-in-force}

Derive 文档把 `gtc`、`post_only`、`fok` 与 `ioc` 列为其 `time_in_force` 取值。没有 Derive 对应
项的 Nautilus 取值在提交前本地以 `OrderDenied` 拒绝。Derive 把 post-only 作为一种
`time_in_force` 取值暴露，因此 `post_only` 不能与 `IOC` 或 `FOK` 组合。

| 有效期         | 支持      | Derive 取值    | 备注                         |
| -------------- | --------- | -------------- | ---------------------------- |
| `GTC`          | ✓         | `gtc`          | 撤销前有效。                  |
| `IOC`          | ✓         | `ioc`          | 立即成交其余撤销。            |
| `FOK`          | ✓         | `fok`          | 全部成交或撤销。              |
| `GTD`          | -         | -              | *Derive 不支持*。             |
| `DAY`          | -         | -              | *Derive 不支持*。             |
| `AT_THE_OPEN`  | -         | -              | *Derive 不支持*。             |
| `AT_THE_CLOSE` | -         | -              | *Derive 不支持*。             |

#### 现货 reduce-only 订单 {#spot-reduce-only-orders}

Derive 现货没有持仓概念，因此 reduce-only 的现货订单永远减不了任何东西。场所总会以错误码
`11025` 拒绝它。adapter 在已知金融工具是现货时会避免这次往返：已缓存的现货金融工具以
`OrderDenied` 拒绝；惰性解析出的现货金融工具在提交时以 `OrderRejected` 拒绝。

永续与期权的 reduce-only 订单仍会送到场所，其结果取决于子账户的持仓状态。`derive-flatten`
可执行程序只平衍生品持仓、绝不碰现货，因为平掉现货余额会把基础资产倒进另一种计价货币。

##### reduce-only 的有效期限制 {#reduce-only-time-in-force-limits}

Derive 只在市价单或不挂簿的限价单（`IOC`/`FOK`）上遵守 `reduce_only`。带 `reduce_only` 的
`GTC` 或 post-only 挂单会在提交前本地拒绝。直接对场所提交则以
`11024 Reduce only not supported with this time in force` 失败。

:::warning
止盈腿是 reduce-only `GTC` 限价单的 Nautilus 括号单无法挂在 Derive 上：入场腿与止损腿能提交，
但 adapter 会在本地拒绝止盈腿。目标是 Derive 时，请改用 reduce-only 的 `IOC`/`FOK` 平仓单或
非 reduce-only 的止盈单。
:::

#### 订单拒绝语义 {#order-rejection-semantics}

状态变更类写操作（`submit_order`、`modify_order`、`cancel_order`）通过 WebSocket 发送一次，
**不会重放**。WebSocket 请求的结果决定 adapter 是发出终态拒绝，还是等待对账。

##### 确定性失败 {#definitive-failures}

对确定性的场所失败，adapter 发出终态拒绝事件（`OrderRejected`、`OrderModifyRejected`、
`OrderCancelRejected`）：

- 签名动作类拒绝，例如参数非法、保证金不足或订单未知。
- 场所业务码，例如 `11009 Zero liquidity`。
- post-only 穿越拒绝（`11008 Post only order cannot cross the market`），以
  `due_post_only=true` 的 `OrderRejected` 报告。
- 限流响应（`-32000 Rate limit exceeded`）：网关在撮合引擎看到之前就拒绝请求。
- `private/cancel_by_label` 成功响应且 `cancelled_orders == 0`，表示没有挂单匹配该 client
  order ID 标签。

`cancelled_orders == -1` 的无范围 `private/cancel_by_label` 响应表示请求已被确认。计数为正
时同样要等待私有订单更新。两种响应在没有确认订单状态前都不产生 `OrderCanceled` 事件。
`query_order` 使用共享的订单状态查找做对账。

##### post-only 分类 {#post-only-classification}

对已到达场所的 post-only 订单，Derive 以 JSON-RPC `11008`、消息
`Post only order cannot cross the market` 拒绝穿越的订单。adapter 给该终态拒绝标记
`due_post_only=true`。若 WebSocket/订单报告的拒绝携带相同原因，被跟踪订单的路径套用同一
分类。不支持的 post-only IOC/FOK 组合在本地产生的 `OrderDenied` 事件不带 `due_post_only`，
因为它们不是场所的穿越拒绝。

面向策略的拒绝原因会剥掉标记与控制字符、归一化空白，并最多保留 256 个字符。JSON-RPC 原因
保留原生错误码与消息，但不含异常前缀与结构化诊断负载。日志保留原始错误。

##### 结果不明确的情况 {#ambiguous-outcomes}

写操作结果不明确时，adapter 不发终态事件，交由 WebSocket 对账或后续状态报告定论。不明确
集合刻意保持很窄：

- `-32603`，通用的 JSON-RPC 内部错误。
- `9000` 与 `9001`，确认超时，需先查询订单状态再重新提交。
- 无法解码的响应（动作可能已被处理）。
- 响应成功但其场所订单 ID 无法表示。adapter 保留已知的命令身份与待处理替换状态供对账使用；
  若该 ID 始终无法表示，状态与成交报告就无法跟踪该场所订单，请用日志中记录的命令身份去检查
  场所状态。
- 请求超时、重连时丢失的响应，以及传输错误。

这一区分保护订单生命周期的两侧：错误的终态拒绝会让引擎把活动订单当成已拒绝；错误地判为不明
确，则会让从未挂出的订单永远停在 `Submitted`，因为不会再有 WebSocket 帧到达。

## 限流 {#rate-limiting}

### 配额范围与补充 {#budget-scopes-and-refill}

Derive v3 应用[两层限流](https://docs.derive.xyz/rate-limits)。请求配额使用固定的五秒窗口。
金融工具订单配额持续补充，容量等于其配置的补充速率五秒的量。耗尽的金融工具桶在默认速率下
一秒获得一个令牌。窗口边界不会把整个容量补满。

同一 API 主机上认证的 HTTP 与 WebSocket 客户端，在多个 session key 与子账户之间共享钱包
配额。公共请求（包括 WebSocket 登录）按 API 主机共享一份独立的进程内配额，这里保守地假设
只有一个源 IP。走不同代理的客户端仍共享该额度，不同进程中的客户端必须自行协调总流量。
API 主机不同的自定义 URL 使用独立的限流状态。

请求窗口对齐到共享限流器的创建时刻，因为场所的窗口相位不可观测。本地边界两侧的突发可能落进
同一个场所窗口，传输队列延迟发出时尤其如此。超出配额的流量会被场所以
`-32000 Rate limit exceeded` 拒绝，adapter 把它呈现为确定性拒绝（见
[订单拒绝语义](#order-rejection-semantics)）。

### 请求桶 {#request-buckets}

下表给出参考默认值与 adapter 的按标签撤销额度。部署取值与协商后的额度可能不同。实时请求
配额可用 `public/getRateLimits` 读取，该端点不报告金融工具配额。测试网上，HTTP 端点即使带
认证头也报告公共 IP 额度，而认证的 WebSocket 报告钱包额度。

| 桶                                 | 范围                  | 参考额度                        |
| ---------------------------------- | --------------------- | ------------------------------- |
| 撮合类                             | 钱包                  | 5 秒窗口 5 次请求               |
| 非撮合类（已认证）                 | 钱包                  | 5 秒窗口 25 次请求              |
| 公共请求                           | IP                    | 5 秒窗口 25 次请求              |
| `private/cancel_all`               | 钱包与方法            | 5 秒窗口 5 次请求               |
| `private/cancel_by_label` 端点     | 钱包与方法            | adapter：每窗口 50 次请求       |
| 金融工具订单（永续/现货）          | 钱包与金融工具        | 1 令牌/秒，容量 5               |
| 金融工具订单（期权）               | 钱包与金融工具        | 1 令牌/秒，容量 5               |

场所还限制每个 IP 的并发 WebSocket 连接数，公布的参考值是四条连接，但部署取值各有不同。

[集成方参考](https://docs.derive.xyz/integrators/trading/rate-limits)给无范围标签撤销公布的是
10 TPS，规范参考文档没有给出该端点的数字额度，adapter 为其标签撤销端点预算保留 10 TPS。

#### 撮合类写操作的配额 {#matching-write-allocation}

订单、替换、撤销、按 nonce 撤销与按金融工具撤销请求同时消耗撮合类请求配额与所给金融工具的
令牌桶。按金融工具的配置适用于永续、现货与期权，与钱包的撮合额度相互独立。

adapter 按规范限流参考，对 `cancel_by_label` 同时按撮合与端点两种配额限速。请求体包含
`instrument_name` 的原始 HTTP 请求同样消耗金融工具额度。类型化的标签撤销参数目前只支持无
范围调用。测试网当前只对带范围的标签撤销收取撮合配额，adapter 对无范围调用保留更严格的
文档规则。`cancel_all` 只使用它的端点配额。

`cancel_trigger_order` 与触发单读取使用非撮合配额。触发单创建走 `private/order`，并在签名
之前预约撮合配额。

首次显式给出的钱包与金融工具设置作用于共享限流器，之后构造时未设置的选项会沿用它们；冲突的
显式设置会被限流器忽略并记 warning。共享配额的欠账跨重连与客户端重建保留。

### 签名与场所响应 {#signing-and-venue-responses}

HTTP 认证头与 WebSocket 登录时间戳在限速等待之后才签名。执行客户端在生成 nonce 与 EIP-712
签名之前，先预约 WebSocket 的订单创建与替换配额。持有中的预约占用金融工具容量直到实际发送，
被放弃的预约会退回其未使用的请求与金融工具额度。

已预约的 WebSocket 发送在签名后不再二次等待。若一次预约跨越了请求窗口边界，adapter 立即
从当前请求窗口扣减；该窗口已满时，在把写操作入队之前返回确定性的本地限流错误。金融工具额度
只扣减一次。

HTTP 下单方法与直接的 WebSocket 签名下单方法接受已签名的请求体。调用方必须把限速延迟计入
这些签名的有效期内。

场所限流仍是确定性拒绝。传输失败、超时与结果不明确的写操作要靠对账解决。adapter 不会盲目
重试签名写操作。

## WebSocket 恢复 {#websocket-recovery}

数据与执行客户端在对端关闭、传输错误或心跳超时后自动重连。adapter 每 30 秒发送一次协议
Ping 帧，并把 60 秒内没有任何入站帧视为连接已死。所选传输可能更早报告 Pong 丢失。传输层
以指数退避加抖动重试连接。

恢复按这个顺序完成：

1. 传输重连。若再次断开，恢复跟随最新的连接。
1. 带凭据的会话重新登录，然后每个会话按频道顺序回放其已确认与待处理的订阅；待处理与已确认
   的退订不回放。
1. 执行客户端在 runner 线程上捕获当前自有订单上下文，刷新账户状态，然后为订单、成交与持仓
   生成 mass status。账户快照被拒时跳过 mass status；持仓转换失败会拒掉整个 mass status。

自定义主机必须处理 runner 的时间事件消息，以便在重连时刷新缓存的订单上下文。刷新使用配置的
`ws_timeout_secs` 期限。没有时间事件发送器时，客户端保留其初始上下文，并在终态绑定被逐出后
拒绝做对账。

状态变更请求遵循[订单拒绝语义](#order-rejection-semantics)：adapter 只发送一次，从不重放。
登录或订阅恢复连续三次失败后，客户端记录错误、把自己标记为已断开，并停止该 WebSocket 会话。

`ws_timeout_secs` 作用于单个 WebSocket 操作与重连后的缓存刷新，不作用于心跳检测与重连退避。

### 订单簿恢复 {#order-book-recovery}

订单簿的恢复独立于会话恢复。以下情形之后恢复启动：

- `book_snapshot_timeout_secs`（默认 `10` 秒）内没有初始或重连后的快照。
- `book_stale_threshold_secs`（默认 `120` 秒）内没有收到递进的快照。

把任一选项设为 `0` 即禁用对应计时器。按预期的更新频率选择陈旧阈值：重复的时间戳不会刷新
新鲜度，递进的空快照会。

必需的价格或数量字段为 null 或空时解码失败并启动恢复。这类快照不发布 delta 也不发布深度，
不刷新新鲜度也不推进已接受的时间戳，无法完成恢复。

恢复会退订并重新订阅受影响的频道，只在收到其订阅确认之后才接受快照。它遵循
[共享重试预算与上限](./../developer_guide/adapters.md#recovery-state-and-retry-budgets)，
直到快照被接受或频道被移除。

- 重连保留恢复事件及其预算。
- 最后一个消费者退订或客户端关闭会取消恢复与待处理写操作。
- 禁用快照期限时，初始重试预算仍封顶在 180 秒，后续每次尝试封顶 60 秒。`ws_timeout_secs`
  仍然约束每次 RPC。

:::warning
Derive 的通知没有订阅代次。adapter 会拒绝本地队列中已过期的帧与非递增时间戳，但无法识别
时间戳超过最后接受时间戳的旧订阅的延迟通知。
:::

### 实时恢复验证 {#live-recovery-validation}

`derive-book-stress` 检查 Derive 测试网的公共数据，不提交订单。它按簿流契约校验 depth-10 的
`ETH-PERP` 与 `ETH-USDC` 簿，并与每份中继场所快照的独立重建结果比对，包括空的现货快照。

测试网 WebSocket 流与公共金融工具 REST API 必须可达。在仓库根目录运行：

```bash
CARGO_BUILD_JOBS=4 bash scripts/strip-adapter-env.bash \
  cargo test -p nautilus-derive --features examples --test derive-book-stress -- \
  --scenario initial --timeout 2 --rounds 60
```

| `--scenario` | 参数          | 检查内容                                                                                              |
| ------------ | ------------- | ----------------------------------------------------------------------------------------------------- |
| `churn`      | 默认          | 陈旧簿、延迟帧、恢复期间重连、退订/重订，以及非法时间戳。                                              |
| `initial`    | `--timeout 2` | 丢弃两个初始快照，然后运行 `churn`。                                                                   |
| `disabled`   | `--timeout 0` | 两个计时器都禁用时，安静簿跨强制重连的表现。                                                           |
| `edges`      | `--timeout 1` | 耗尽八次尝试预算、迟到快照的接受，以及永久拒绝后的重试。                                               |

- `--timeout` 设置快照超时秒数，`0` 禁用期限。除 `disabled`（两个计时器都禁用）外，陈旧
  阈值都是四秒。
- `--rounds` 设置 churn 或 disabled 的轮数（默认 `20`）；`edges` 只运行一次。

每个场景都检查有界关闭；除 `disabled` 外，所有场景都会在恢复期间启动关闭。共享参数与输出见
[压力测试工具](./../developer_guide/spec_data_testing.md#stress-harnesses)。

## 确定性仿真测试 {#deterministic-simulation-testing}

Rust adapter 通过共享的时钟、任务、重试与传输缝，以 `cfg(madsim)` 支持 `simulation`。配置
受控的 `http://` 与 `ws://` 端点，并选择 `TransportBackend::Tungstenite`。固定的合成凭据支持
私有本地 peer 测试。

受审的运行时切片覆盖这些路径：

- 公共单金融工具查询（`public/get_instrument`）到领域构造。
- 公共 ticker 订阅到完整的报价构造。
- 簿与成交的订阅请求。
- 私有登录与撤销请求。
- 重连时的订阅回放、命令/帧调度与关闭。

`crates/adapters/derive/tests/integration/dst.rs` 中的集成测试钉住 wire 字节、登录签名与领域
字段（含 ticker 间隔），并输出 `DST_TRACE` 与 `DST_DOMAIN` 记录，供下游在相同种子、配置与
peer 脚本下跨新鲜进程比对。`cargo-test-sim` 运行仓库内的断言；新鲜进程比对留在下游 DST
工具链，按[适配器 DST 契约](./../concepts/dst.md#adapter-dst-contract)的规定。

静态闸门覆盖 `crates/adapters/derive/src/` 下这些生产路径：

- `book/recovery.rs` 与 `book/sync.rs`。
- `common/parse.rs`、`common/rate_limit.rs`、`config.rs`、`data.rs`、`execution.rs` 与
  `providers.rs`。
- `http/client.rs`、`http/models.rs`、`http/query.rs` 与 `http/parse.rs`。
- `signing/encoding.rs`、`signing/nonce.rs`、`signing/auth.rs`、`signing/eip712.rs` 与
  `signing/modules/trade.rs`。
- `websocket/client.rs`、`websocket/dispatch.rs`、`websocket/handler.rs`、`websocket/messages.rs`
  与 `websocket/parse.rs`。

常量、枚举、错误、端点默认值、模块声明、仅做构造的工厂、重试分类器、凭据与签名上下文解析，
以及 WebSocket 上下文容器保持在静态路径清单之外。这些文件不引入独立的异步、时钟或随机性
边界。凭据解析只使用传入的配置或声明的环境输入。Python 与 FFI、TLS、实盘场所状态、完整的
数据/执行客户端生命周期、签名下单与替换、触发执行，以及其他未审计的运行时切片，都在这份
仿真声明之外。静态覆盖不为这些切片确立运行时证明。

## 订阅参数 {#subscription-parameters}

`subscribe_book_deltas` 与 `subscribe_book_depth` 接受这些 `subscribe_params` 键：

| 键      | 类型   | 默认值  | 允许取值                       |
| ------- | ------ | ------- | ------------------------------ |
| `group` | string | `"1"`   | `"1"`、`"10"`、`"100"`         |
| `depth` | string | `"10"`  | `"1"`、`"10"`、`"20"`、`"100"` |

`subscribe_quotes` 接受：

| 键         | 类型   | 默认值   | 允许取值            |
| ---------- | ------ | -------- | ------------------- |
| `interval` | string | `"1000"` | `"100"`、`"1000"`   |

未知取值在订阅时即被拒绝。

### 共享 ticker 订阅 {#shared-ticker-subscription}

报价、标记价、指数价、资金费率与期权 Greeks 都派生自同一个
`ticker_slim.{instrument}.{interval}` WebSocket 订阅。adapter 对底层 WS 订阅调用做引用计数：

- 该金融工具第一个订阅的馈送打开频道。
- 最后一个退订关闭它。

:::note
**以第一个订阅的 `interval` 为准。**之后用不同 interval 订阅的馈送共用已存在的频道。
:::

#### ticker 字段 {#ticker-fields}

标记价、指数价、资金费率与期权 Greeks 都读取 ticker 负载中的字段。完整 ticker 形态与紧凑的
`ticker_slim` 形态都携带这些字段，因此派生馈送在两种形态上都能工作：

| 字段                        | 存在性                    | 馈送行为                                                                    |
| --------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| `mark_price`、`index_price` | 必需                      | 字段缺失会使反序列化失败并记日志，不会静默丢弃。                             |
| `funding_rate`              | 可选；仅永续              | 为资金费率事件提供数据。                                                     |
| `option_pricing`            | 可选；仅期权              | 为期权 Greeks 提供数据。                                                     |
| 买价/卖价                   | 两种形态都有              | 报价馈送两种形态都能工作。                                                   |

#### 金融工具类别限制 {#instrument-class-restrictions}

资金费率只对永续有意义，期权 Greeks 只对期权有意义。订阅与金融工具类别不匹配的馈送（例如给
期权订阅资金费率）时，adapter 接受该订阅：WebSocket 订阅会打开，但解析器对该馈送不返回任何
事件。场所负载对非永续省略资金费率字段，对非期权省略 `option_pricing`。订阅衍生品专属馈送前
先确认金融工具类别。

## 配置 {#configuration}

### 数据客户端配置项 {#data-client-configuration-options}

类/结构体：`DeriveDataClientConfig`。

| 配置项                             | 默认值    | 说明                                                                                          |
| ---------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `base_url_rest`                    | `None`    | REST 基准 URL 覆盖。                                                                           |
| `base_url_ws`                      | `None`    | WebSocket 基准 URL 覆盖。                                                                      |
| `proxy_url`                        | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                                          |
| `environment`                      | `Mainnet` | 网络选择（Python 中为 `MAINNET` 或 `TESTNET`）。                                                |
| `http_timeout_secs`                | `10`      | REST 请求超时（秒）。                                                                           |
| `ws_timeout_secs`                  | `None`    | 按操作的 WebSocket 超时（登录、订阅、读、写），单位秒；未设置时用 10 秒。                        |
| `book_snapshot_timeout_secs`       | `10`      | 快照等待（秒）；`0` 禁用期限。                                                                  |
| `book_stale_threshold_secs`        | `120`     | 多久没有递进快照就启动恢复（秒）；`0` 禁用该计时器。                                            |
| `update_instruments_interval_mins` | `60`      | 金融工具刷新间隔（分钟）。                                                                       |
| `currencies`                       | `[]`      | 连接时批量加载的币种；为空表示按需惰性加载。                                                     |
| `include_expired`                  | `false`   | 从 `public/get_all_instruments` 合并期权的活动与过期挂牌。                                       |
| `auto_load_missing_instruments`    | `true`    | 发送订阅请求前惰性加载未知的金融工具。                                                           |
| `transport_backend`                | `Sockudo` | 启用 `transport-sockudo` 时使用的 WebSocket 传输。                                               |

:::important
**`auto_load_missing_instruments` 只覆盖订阅命令。**请求报价、成交、K 线或资金费率之前，
先批量加载该金融工具的币种，或先订阅。
:::

- 金融工具尚未缓存时，`request_quotes`、`request_trades`、`request_bars` 与
  `request_funding_rates` 会失败。
- `request_instrument` 是例外：它总会拉取 `public/get_instrument`。
- 期权链订阅需要该系列中已缓存的期权，用来获取初始参考价。

### 执行客户端配置项 {#execution-client-configuration-options}

类/结构体：`DeriveExecutionClientConfig`。

#### 账户与凭据 {#account-and-credentials}

| 配置项           | 默认值        | 说明                                                              |
| ---------------- | ------------- | ----------------------------------------------------------------- |
| `account_id`     | `DERIVE-001`  | Nautilus 账户标识。                                                 |
| `wallet_address` | `None`        | owner 的 EOA 或多签地址；未设置时回退到下列环境变量。                |
| `session_key`    | `None`        | secp256k1 session key 私钥；未设置时回退到下列环境变量。             |
| `subaccount_id`  | `None`        | Derive 子账户 id；未设置时回退到下列环境变量。                       |

#### 连接与重试 {#connectivity-and-retries}

| 配置项                   | 默认值    | 说明                                                                                          |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------- |
| `base_url_rest`          | `None`    | REST 基准 URL 覆盖。                                                                           |
| `base_url_ws`            | `None`    | WebSocket 基准 URL 覆盖。                                                                      |
| `proxy_url`              | `None`    | HTTP 与 WebSocket 传输的可选代理 URL。                                                          |
| `environment`            | `Mainnet` | 网络选择（Python 中为 `MAINNET` 或 `TESTNET`）。                                                |
| `http_timeout_secs`      | `10`      | REST 请求超时（秒）。                                                                           |
| `ws_timeout_secs`        | `None`    | 按操作的 WebSocket 超时（登录、订阅、读、写），单位秒；未设置时用 10 秒。                        |
| `transport_backend`      | `Sockudo` | 启用 `transport-sockudo` 时使用的 WebSocket 传输。                                              |
| `max_retries`            | `3`       | 幂等 REST 读取的重试次数。订单写操作只发一次，永不重放。                                        |
| `retry_delay_initial_ms` | `100`     | 初始重试延迟（毫秒）。                                                                          |
| `retry_delay_max_ms`     | `5,000`   | 退避的最大延迟（毫秒）。                                                                        |

构建禁用了 `transport-sockudo` feature 时，默认传输回退到 `Tungstenite`。

HTTP 读取时，`Retry-After` 设定的最小延迟可能超过 `retry_delay_max_ms`。若该延迟放不进剩余
的 180 秒重试预算，客户端不重试，直接返回原始错误。

#### 订单签名与定价 {#order-signing-and-pricing}

:::important
`max_fee_per_contract` 必填且必须大于零。该字段缺失或非正时，执行客户端的构造在创建场所
客户端之前就会失败。
:::

| 配置项                        | 默认值   | 说明                                                                          |
| ----------------------------- | -------- | ----------------------------------------------------------------------------- |
| `max_fee_per_contract`        | 必填     | 签入每笔订单的正值单合约 USDC 手续费上限。                                      |
| `domain_separator`            | `None`   | 可选的 EIP-712 domain separator 覆盖。                                          |
| `action_typehash`             | `None`   | 可选的 EIP-712 action typehash 覆盖。                                           |
| `trade_module_address`        | `None`   | 可选的 Trade 模块合约地址覆盖。                                                 |
| `signature_expiry_secs`       | `600`    | 订单/替换的 TTL；必须大于 10 秒且不超过 120 天。触发单固定用 31 天。            |
| `market_order_slippage_bps`   | `50`     | 市价单限价价的滑点边界。                                                        |

#### 撮合类请求限制 {#matching-request-limits}

两个限制未设置时默认为**每秒 1 次请求**。协商到的取值要分别设置：钱包额度用固定窗口，金融
工具额度持续补充。同一 API 主机上同一钱包的客户端共享首次显式设置的值。调高钱包额度前先
核实实时请求配额；金融工具配额无法通过 `public/getRateLimits` 查到。

| 配置项                                            | 默认值  | 说明                                                |
| ------------------------------------------------- | ------- | --------------------------------------------------- |
| `max_matching_requests_per_second`                | `None`  | 钱包撮合类请求每秒次数。                             |
| `max_per_instrument_matching_requests_per_second` | `None`  | 每钱包/金融工具的令牌补充速率（每秒）。              |

#### 凭据环境变量 {#credential-environment-variables}

`wallet_address`、`session_key` 与 `subaccount_id` 未设置时回退到环境变量：

| 字段             | 主网变量                       | 测试网变量                             |
| ---------------- | ------------------------------ | -------------------------------------- |
| `wallet_address` | `DERIVE_WALLET_ADDRESS`        | `DERIVE_TESTNET_WALLET_ADDRESS`        |
| `session_key`    | `DERIVE_SESSION_PRIVATE_KEY`   | `DERIVE_TESTNET_SESSION_PRIVATE_KEY`   |
| `subaccount_id`  | `DERIVE_SUBACCOUNT_ID`         | `DERIVE_TESTNET_SUBACCOUNT_ID`         |

session key 是注册到钱包上用于 API 签名的 secp256k1 私钥。`session_key` 字段在 `Debug` 输出
与 Python `repr` 中被打码。

### Python 实时节点 {#python-live-node}

Python 节点使用 `LiveNode.builder(...)` 并传入具体的工厂实例。节点提供 trader 标识，
`DeriveExecutionClientConfig` 提供账户标识。

```python
from decimal import Decimal

from nautilus_trader.adapters.derive import DeriveDataClientConfig
from nautilus_trader.adapters.derive import DeriveDataClientFactory
from nautilus_trader.adapters.derive import DeriveEnvironment
from nautilus_trader.adapters.derive import DeriveExecutionClientConfig
from nautilus_trader.adapters.derive import DeriveExecutionClientFactory
from nautilus_trader.common import Environment
from nautilus_trader.live import LiveNode
from nautilus_trader.model import AccountId
from nautilus_trader.model import TraderId

trader_id = TraderId("TESTER-001")

data_config = DeriveDataClientConfig(
    environment=DeriveEnvironment.TESTNET,
    currencies=["ETH", "BTC"],
)

exec_config = DeriveExecutionClientConfig(
    account_id=AccountId("DERIVE-001"),
    environment=DeriveEnvironment.TESTNET,
    max_fee_per_contract=Decimal("1000"),
)

node = (
    LiveNode.builder("DERIVE-001", trader_id, Environment.LIVE)
    .add_data_client(None, DeriveDataClientFactory(), data_config)
    .add_exec_client(None, DeriveExecutionClientFactory(), exec_config)
    .build()
)
```

### Rust 数据客户端 {#rust-data-client}

```rust
use nautilus_derive::{
    common::enums::DeriveEnvironment,
    config::DeriveDataClientConfig,
};

let config = DeriveDataClientConfig {
    environment: DeriveEnvironment::Testnet,
    currencies: vec!["ETH".to_string(), "BTC".to_string()],
    ..Default::default()
};
```

### Rust 执行客户端 {#rust-execution-client}

```rust
use nautilus_derive::{
    common::enums::DeriveEnvironment,
    config::DeriveExecutionClientConfig,
};
use rust_decimal::Decimal;

let config = DeriveExecutionClientConfig {
    wallet_address: Some("0x...".to_string()),
    session_key: Some("0x...".into()),
    subaccount_id: Some(1),
    environment: DeriveEnvironment::Testnet,
    max_fee_per_contract: Some(Decimal::from(1000)),
    ..Default::default()
};
```

## 已知限制 {#known-limitations}

- `request_instruments` 要求 `DeriveDataClientConfig::currencies` 中至少配置一个币种。adapter
  按每个配置的币种过滤 `public/get_all_instruments`，不枚举币种全集。
- 场所不推送金融工具状态、金融工具收市或 candle 订阅。金融工具定义携带 `is_active` 与计划的
  启用/停用时间戳，K 线只能通过 REST 获取。
- 场所没有暴露簿快照 REST 端点，也没有历史簿增量与历史报价端点。见上文能力表。
- Derive 官方 REST 文档自 2025 年 12 月 1 日起把 `public/get_ticker` 标记为废弃，改用
  `public/get_tickers`。adapter 用 `public/get_tickers` 做报价快照与期权链参考价引导。
