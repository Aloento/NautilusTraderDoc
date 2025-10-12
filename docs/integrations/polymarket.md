# Polymarket

Polymarket 成立于 2020 年，是全球最大的去中心化预测市场平台，允许交易者通过使用加密货币买卖二元期权合约来对世界事件的结果进行投机。

NautilusTrader 提供了对 Polymarket 的接入（venue integration），可通过 Polymarket 的中央限价撮合簿（Central Limit Order Book，CLOB）API 获取市场数据和执行交易。
该集成基于 [官方的 Python CLOB 客户端库](https://github.com/Polymarket/py-clob-client)，以便更方便地与 Polymarket 平台交互。

NautilusTrader 支持多种 Polymarket 的签名类型以用于订单签名，从而适配不同的钱包配置。
该集成确保交易者可以在不同钱包类型之间安全且高效地执行订单，同时 NautilusTrader 抽象化了签名与订单准备的复杂性，提供无缝执行体验。

## 安装

安装带有 Polymarket 支持的 NautilusTrader：

```bash
pip install --upgrade "nautilus_trader[polymarket]"
```

从源码构建并包含所有可选项（包括 Polymarket）：

```bash
uv sync --all-extras
```

## 示例

可在此处查看实盘示例脚本：[examples/live/polymarket](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/polymarket/)。

## 二元期权（Binary options）

[Binary option](https://en.wikipedia.org/wiki/Binary_option)（二元期权）是一类金融衍生品合约，交易者对某个“是/否”命题的结果进行押注。
若预测正确，交易者会获得固定的支付（payout）；否则将一无所获。

在 Polymarket 上交易的所有资产均以 **USDC.e (PoS)** 报价和结算，更多信息请参见下文 [USDC.e (PoS)](#usdce-pos)。

## Polymarket 文档

Polymarket 为不同用户提供了详尽的资源：

- [Polymarket Learn](https://learn.polymarket.com/)：面向用户的教育内容与使用指南。
- [Polymarket CLOB API](https://docs.polymarket.com/#introduction)：面向开发者的技术文档，介绍如何与 Polymarket CLOB API 交互。

## 概览

本指南假定交易者希望同时接入实时市场数据流和下单执行功能。
Polymarket 适配器包含多个组件，可根据用例单独或组合使用：

- `PolymarketWebSocketClient`：底层 WebSocket API 连接（基于用 Rust 编写的 Nautilus `WebSocketClient`）。
- `PolymarketInstrumentProvider`：用于解析与加载 `BinaryOption` 类型 instrument 的功能。
- `PolymarketDataClient`：市场数据管理器。
- `PolymarketExecutionClient`：交易执行网关。
- `PolymarketLiveDataClientFactory`：Polymarket 数据客户端的工厂（由交易节点构建器使用）。
- `PolymarketLiveExecClientFactory`：Polymarket 执行客户端的工厂（由交易节点构建器使用）。

:::note
大多数用户只需为 live trading node 定义配置（如下），通常不需要直接与这些底层组件交互。
:::

## USDC.e (PoS)

**USDC.e** 是将以太坊（Ethereum）上的 USDC 桥接到 Polygon 网络的代币，运行在 Polygon 的 **Proof of Stake (PoS)** 链上。
这使得在 Polygon 上的交易更快且成本更低，同时仍由以太坊上的 USDC 提供支持。

该代币在 Polygon 链上的合约地址为 [0x2791bca1f2de4661ed88a30c99a7a9449aa84174](https://polygonscan.com/address/0x2791bca1f2de4661ed88a30c99a7a9449aa84174)。
更多信息请参见这篇 [博客](https://polygon.technology/blog/phase-one-of-native-usdc-migration-on-polygon-pos-is-underway)。

## 钱包与账户

要通过 NautilusTrader 与 Polymarket 交互，你需要一个兼容 **Polygon** 的钱包（例如 MetaMask）。

### 签名类型

Polymarket 支持多种用于订单签名与验证的签名类型：

| Signature Type | Wallet Type                    | Description                                                                    | Use Case                                                                |
| -------------- | ------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `0`            | EOA (Externally Owned Account) | 使用私钥直接控制的钱包所产生的标准 EIP712 签名。                               | **默认。** 直接连接的钱包（如 MetaMask、硬件钱包等）。                  |
| `1`            | Email/Magic Wallet Proxy       | 基于智能合约的邮箱账户（Magic Link）钱包代理。仅与该邮箱关联的地址可执行函数。 | 适用于与 Email/Magic 账户关联的 Polymarket Proxy。需要 `funder` 地址。  |
| `2`            | Browser Wallet Proxy           | 为浏览器钱包定制的 Gnosis Safe（1-of-1 multisig）变体。                        | 适用于浏览器钱包的 Polymarket Proxy，支持 UI 验证。需要 `funder` 地址。 |

:::note
详情请参见 Polymarket 文档中的 [Proxy wallet](https://docs.polymarket.com/developers/proxy-wallet)，了解签名类型和代理钱包架构的更多细节。
:::

NautilusTrader 默认使用签名类型 0（EOA），但可以通过配置参数 `signature_type` 切换为任意受支持的签名类型。

当通过环境变量配置时，每个交易实例支持单个钱包地址；也可以为多个钱包创建多个 `PolymarketExecutionClient` 实例。

:::note
确保你的钱包中有 **USDC.e** 余额，否则在提交订单时会遇到 “not enough balance / allowance” 的 API 错误。
:::

### 为 Polymarket 合约设置 allowance

在开始交易之前，你需要为 Polymarket 的智能合约为你的钱包设置相应的 allowance（授权）。
可通过运行项目中提供的脚本来完成，脚本路径为 `/adapters/polymarket/scripts/set_allowances.py`。

该脚本改编自 @poly-rodr 在 gist 上的实现：<https://gist.github.com/poly-rodr/44313920481de58d5a3f6d1f8226bd5e>。

:::note
对于每个你打算在 Polymarket 上交易的 EOA 钱包，该脚本只需运行 **一次**。
:::

该脚本会自动完成为 Polymarket 合约批准所需的操作，包括为 USDC 代币和 Conditional Token Framework (CTF) 合约设置授权，允许 Polymarket CLOB 交易所与资金交互。

在运行脚本之前，请确保满足以下先决条件：

- 安装 web3 Python 包：`pip install --upgrade web3==7.12.1`。
- 拥有一个已注入部分 MATIC（用于支付 gas 费用）的 **Polygon** 兼容钱包。
- 在 shell 中设置如下环境变量：
  - `POLYGON_PRIVATE_KEY`：你的 Polygon 兼容钱包的私钥。
  - `POLYGON_PUBLIC_KEY`：你的 Polygon 兼容钱包的公钥（public key）。

满足以上条件后，脚本将：

- 为 Polymarket USDC 代币合约批准最大可用额度（使用 `MAX_INT`）。
- 为 CTF 合约设置批准，允许其代表你管理 Conditional Tokens。

:::note
你也可以在脚本中调整批准额度，而不使用 `MAX_INT`，以 **USDC.e** 的小数单位（fractional units）指定具体数额；但该方式未经充分测试。
:::

请确保在运行脚本前正确地将私钥与公钥存入环境变量中。下面是一个在终端中设置环境变量的示例：

```bash
export POLYGON_PRIVATE_KEY="YOUR_PRIVATE_KEY"
export POLYGON_PUBLIC_KEY="YOUR_PUBLIC_KEY"
```

运行脚本：

```bash
python nautilus_trader/adapters/polymarket/scripts/set_allowances.py
```

### 脚本功能概览

该脚本会执行下列操作：

- 通过 RPC URL（例如 <https://polygon-rpc.com/）连接到> Polygon 网络。
- 对批准 Polymarket 合约的最大 USDC 授权发起签名并发送交易。
- 为 CTF 合约设置批准，以便其代为管理条件代币（Conditional Tokens）。
- 为特定地址（如 Polymarket CLOB Exchange 与 Neg Risk Adapter）重复批准流程。

这些步骤允许 Polymarket 在执行交易时与您的资金进行交互，从而保证与 CLOB Exchange 的集成顺畅。

## API 密钥

要在 Polymarket 上交易，你需要生成 API 凭证。按以下步骤操作：

1. 确保已设置下列环境变量：

   - `POLYMARKET_PK`：用于签名交易的私钥。
   - `POLYMARKET_FUNDER`：在 **Polygon** 网络上用于资助 Polymarket 交易的钱包地址（公钥）。

2. 运行脚本以生成 API 密钥：

   ```bash
   python nautilus_trader/adapters/polymarket/scripts/create_api_key.py
   ```

脚本将生成并打印 API 凭证，请保存到以下环境变量中：

- `POLYMARKET_API_KEY`
- `POLYMARKET_API_SECRET`
- `POLYMARKET_PASSPHRASE`

这些凭证可用于配置下列 Polymarket 客户端：

- `PolymarketDataClientConfig`
- `PolymarketExecClientConfig`

## 配置

在为 NautilusTrader 配置 Polymarket 时，务必正确设置必要参数，尤其是私钥相关字段。

**关键参数**：

- `private_key`：用于签名订单的钱包私钥。其含义依赖于 `signature_type` 配置。如果配置中没有明确提供，将自动从环境变量 `POLYMARKET_PK` 中获取。
- `funder`：用于为交易提供资金的 **USDC.e** 钱包地址。如果未提供，将从 `POLYMARKET_FUNDER` 环境变量读取。
- API 凭证：与 Polymarket CLOB 交互需要以下凭证：
  - `api_key`：若未提供，则从环境变量 `POLYMARKET_API_KEY` 获取。
  - `api_secret`：若未提供，则从环境变量 `POLYMARKET_API_SECRET` 获取。
  - `passphrase`：若未提供，则从环境变量 `POLYMARKET_PASSPHRASE` 获取。

:::tip
建议使用环境变量来管理这些凭证。
:::

## 订单能力（Orders capability）

Polymarket 作为预测市场，其支持的订单类型与指令集较传统交易所更为有限。

### 订单类型

| Order Type             | Binary Options | Notes                                                                     |
| ---------------------- | -------------- | ------------------------------------------------------------------------- |
| `MARKET`               | ✓              | **BUY orders require quote quantity**, SELL orders require base quantity. |
| `LIMIT`                | ✓              |                                                                           |
| `STOP_MARKET`          | -              | _Not supported by Polymarket_.                                            |
| `STOP_LIMIT`           | -              | _Not supported by Polymarket_.                                            |
| `MARKET_IF_TOUCHED`    | -              | _Not supported by Polymarket_.                                            |
| `LIMIT_IF_TOUCHED`     | -              | _Not supported by Polymarket_.                                            |
| `TRAILING_STOP_MARKET` | -              | _Not supported by Polymarket_.                                            |

### 数量含义（Quantity semantics）

Polymarket 根据订单类型和买卖方向对数量的含义进行不同解释：

- **Limit** 订单将 `quantity` 视为条件代币（conditional tokens，即 base 单位）的数量。
- **Market SELL**（市价卖单）也使用 base 单位数量。
- **Market BUY**（市价买单）则把 `quantity` 解释为以 **USDC.e** 计价的 quote 名义金额（notional）。

因此，如果用 base 单位提交一个市价买单，实际成交量可能远超预期。

:::warning
当提交市价 BUY 单时，请设置 `quote_quantity=True`（或预先计算好以 quote 计价的金额），
并在执行引擎中将 `convert_quote_qty_to_base=False`，以确保 quote 金额不被引擎转换，从而原样发送到适配器。
Polymarket 的执行客户端会拒绝以 base 单位提交的市价买单，以防止意外成交。

**NautilusTrader 现在会将市价单直接转发到 Polymarket 的原生 market-order 终端点，因而你为 BUY 指定的 quote 金额会被直接执行（不再使用合成的最大价格限制）。**
:::

```python
from nautilus_trader.execution.config import ExecEngineConfig
from nautilus_trader.execution.engine import ExecutionEngine

# Temporary: disable automatic conversion until the behaviour is fully removed in a future release
config = ExecEngineConfig(convert_quote_qty_to_base=False)
engine = ExecutionEngine(msgbus=msgbus, cache=cache, clock=clock, config=config)

# Correct: Market BUY with quote quantity (spend $10 USDC)
order = strategy.order_factory.market(
    instrument_id=instrument_id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(10.0),
    quote_quantity=True,  # Interpret as USDC.e notional
)
strategy.submit_order(order)
```

### 执行指令（Execution instructions）

| Instruction   | Binary Options | Notes                          |
| ------------- | -------------- | ------------------------------ |
| `post_only`   | -              | _Not supported by Polymarket_. |
| `reduce_only` | -              | _Not supported by Polymarket_. |

### 有效时间（Time-in-force）选项

| Time in force | Binary Options | Notes                              |
| ------------- | -------------- | ---------------------------------- |
| `GTC`         | ✓              | Good Till Canceled.                |
| `GTD`         | ✓              | Good Till Date.                    |
| `FOK`         | ✓              | Fill or Kill.                      |
| `IOC`         | ✓              | Immediate or Cancel (maps to FAK). |

:::note
FAK (Fill and Kill) 是 Polymarket 对 Immediate or Cancel (IOC) 语义的称呼。
:::

### 高级订单特性

| Feature            | Binary Options | Notes                            |
| ------------------ | -------------- | -------------------------------- |
| Order Modification | -              | Cancellation functionality only. |
| Bracket/OCO Orders | -              | _Not supported by Polymarket_.   |
| Iceberg Orders     | -              | _Not supported by Polymarket_.   |

### 批量操作

| Operation    | Binary Options | Notes                          |
| ------------ | -------------- | ------------------------------ |
| Batch Submit | -              | _Not supported by Polymarket_. |
| Batch Modify | -              | _Not supported by Polymarket_. |
| Batch Cancel | -              | _Not supported by Polymarket_. |

### 仓位管理

| Feature          | Binary Options | Notes                             |
| ---------------- | -------------- | --------------------------------- |
| Query positions  | ✓              | Contract balance-based positions. |
| Position mode    | -              | Binary outcome positions only.    |
| Leverage control | -              | No leverage available.            |
| Margin mode      | -              | No margin trading.                |

### 订单查询

| Feature              | Binary Options | Notes                          |
| -------------------- | -------------- | ------------------------------ |
| Query open orders    | ✓              | Active orders only.            |
| Query order history  | ✓              | Limited historical data.       |
| Order status updates | ✓              | Real-time order state changes. |
| Trade history        | ✓              | Execution and fill reports.    |

### 或有订单（Contingent orders）

| Feature            | Binary Options | Notes                          |
| ------------------ | -------------- | ------------------------------ |
| Order lists        | -              | _Not supported by Polymarket_. |
| OCO orders         | -              | _Not supported by Polymarket_. |
| Bracket orders     | -              | _Not supported by Polymarket_. |
| Conditional orders | -              | _Not supported by Polymarket_. |

### 精度限制（Precision limits）

Polymarket 根据 tick size 与订单类型执行不同的精度约束。

**Binary Option instruments** 通常支持最多 6 位小数（在 0.0001 tick size 情况下），但 **市价单有更严格的精度要求**：

- **FOK（Fill-or-Kill）市价单：**

  - 卖单（Sell orders）：maker 金额限制为 **2 位小数**。
  - taker 金额：限制为 **4 位小数**。
  - `size × price` 的乘积不得超过 **2 位小数**。

- **普通 GTC 订单：** 根据市场 tick size，精度更为宽松。

### Tick size 精度层级

| Tick Size | Price Decimals | Size Decimals | Amount Decimals |
| --------- | -------------- | ------------- | --------------- |
| 0.1       | 1              | 2             | 3               |
| 0.01      | 2              | 2             | 4               |
| 0.001     | 3              | 2             | 5               |
| 0.0001    | 4              | 2             | 6               |

:::note

- Tick size 精度层级定义见 [`py-clob-client` 的 `ROUNDING_CONFIG`](https://github.com/Polymarket/py-clob-client/blob/main/py_clob_client/order_builder/builder.py)。
- FOK 市价单精度限制（maker 金额 2 位小数）基于 API 返回的错误信息，详见 [issue #121](https://github.com/Polymarket/py-clob-client/issues/121)。
- 在极端或单边市场条件下，tick size 可能会动态变化。

:::

## 交易（Trades）

Polymarket 上的交易可能具有以下状态：

- `MATCHED`：交易已被撮合并由 operator 发送到 executor 服务，executor 将交易作为链上交易提交到 Exchange 合约。
- `MINED`：交易已被观察到被打包进区块，但没有达成最终性阈值。
- `CONFIRMED`：交易已达到较强概率上的最终性并成功完成。
- `RETRYING`：交易（因 revert 或 reorg）失败，operator 正在重试/重新提交交易。
- `FAILED`：交易失败且不再重试。

当交易首次被撮合后，后续的交易状态更新将通过 WebSocket 接收。
NautilusTrader 会将初始成交信息记录在 `OrderFilled` 事件的 `info` 字段中，
并把后续的交易事件以 JSON 形式保存在缓存中（使用自定义键）以便保留这些信息。

## 对账（Reconciliation）

Polymarket API 在查询时返回所有 **active**（未完成）订单，或通过 Polymarket 订单 ID（`venue_order_id`）返回指定订单。
针对 Polymarket 的执行对账流程如下：

- 为 Polymarket 报告的所有有未完成订单的 instruments 生成订单报告（order reports）。
- 从 Polymarket 报告的合约余额中生成仓位报告（仅针对缓存中可用的 instruments）。
- 将这些报告与 Nautilus 的执行状态进行比较。
- 生成缺失的订单，以使 Nautilus 的执行状态与 Polymarket 报告的仓位保持一致。

**注意**：Polymarket 不会直接提供已不再活跃（no longer active）的订单数据。

:::warning
一个可选的执行客户端配置 `generate_order_history_from_trades` 目前仍在开发中，
暂不建议在生产环境中使用。
:::

## WebSockets

`PolymarketWebSocketClient` 构建于高性能的 Nautilus `WebSocketClient` 基类之上，该基类使用 Rust 编写。

### 数据（Data）

主数据 WebSocket 在初始连接序列期间处理所有 `market` 频道的订阅，直到达到 `ws_connection_delay_secs`。
对于任何额外的订阅，针对每个新 instrument（资产）会创建一个新的 `PolymarketWebSocketClient`。

### 执行（Execution）

主执行 WebSocket 在初始连接序列期间基于缓存中可用的 Polymarket instruments 管理所有 `user` 频道的订阅。
当对额外的 instruments 发出交易指令时，会为每个新增的 instrument 创建独立的 `PolymarketWebSocketClient`。

:::note
Polymarket 不支持在订阅后取消订阅频道流（unsubscribe）。
:::

## 限制与注意事项

目前已知的限制与注意事项包括：

- 通过 Polymarket 的 Python 客户端进行订单签名较慢，约需一秒钟左右。
- 不支持 post-only 订单。
- 不支持 reduce-only 订单。

## 配置

### Data client configuration options

| Option                             | Default      | Description                                                                      |
| ---------------------------------- | ------------ | -------------------------------------------------------------------------------- |
| `venue`                            | `POLYMARKET` | Venue identifier registered for the data client.                                 |
| `private_key`                      | `None`       | Wallet private key; sourced from `POLYMARKET_PK` when omitted.                   |
| `signature_type`                   | `0`          | Signature scheme (0 = EOA, 1 = email proxy, 2 = browser wallet proxy).           |
| `funder`                           | `None`       | USDC.e funding wallet; sourced from `POLYMARKET_FUNDER` when omitted.            |
| `api_key`                          | `None`       | API key; sourced from `POLYMARKET_API_KEY` when omitted.                         |
| `api_secret`                       | `None`       | API secret; sourced from `POLYMARKET_API_SECRET` when omitted.                   |
| `passphrase`                       | `None`       | API passphrase; sourced from `POLYMARKET_PASSPHRASE` when omitted.               |
| `base_url_http`                    | `None`       | Override for the REST base URL.                                                  |
| `base_url_ws`                      | `None`       | Override for the WebSocket base URL.                                             |
| `ws_connection_initial_delay_secs` | `5`          | Delay (seconds) before the first WebSocket connection to buffer subscriptions.   |
| `ws_connection_delay_secs`         | `0.1`        | Delay (seconds) between subsequent WebSocket connection attempts.                |
| `update_instruments_interval_mins` | `60`         | Interval (minutes) between instrument catalogue refreshes.                       |
| `compute_effective_deltas`         | `False`      | Compute effective order book deltas for bandwidth savings.                       |
| `drop_quotes_missing_side`         | `True`       | Drop quotes with missing bid/ask prices instead of substituting boundary values. |

### Execution client configuration options

| Option                               | Default      | Description                                                                     |
| ------------------------------------ | ------------ | ------------------------------------------------------------------------------- |
| `venue`                              | `POLYMARKET` | Venue identifier registered for the execution client.                           |
| `private_key`                        | `None`       | Wallet private key; sourced from `POLYMARKET_PK` when omitted.                  |
| `signature_type`                     | `0`          | Signature scheme (0 = EOA, 1 = email proxy, 2 = browser wallet proxy).          |
| `funder`                             | `None`       | USDC.e funding wallet; sourced from `POLYMARKET_FUNDER` when omitted.           |
| `api_key`                            | `None`       | API key; sourced from `POLYMARKET_API_KEY` when omitted.                        |
| `api_secret`                         | `None`       | API secret; sourced from `POLYMARKET_API_SECRET` when omitted.                  |
| `passphrase`                         | `None`       | API passphrase; sourced from `POLYMARKET_PASSPHRASE` when omitted.              |
| `base_url_http`                      | `None`       | Override for the REST base URL.                                                 |
| `base_url_ws`                        | `None`       | Override for the WebSocket base URL.                                            |
| `max_retries`                        | `None`       | Maximum retry attempts for submit/cancel requests.                              |
| `retry_delay_initial_ms`             | `None`       | Initial delay (milliseconds) between retries.                                   |
| `retry_delay_max_ms`                 | `None`       | Maximum delay (milliseconds) between retries.                                   |
| `generate_order_history_from_trades` | `False`      | Generate synthetic order history from trade reports when `True` (experimental). |
| `log_raw_ws_messages`                | `False`      | Log raw WebSocket payloads at INFO level when `True`.                           |

:::info
For additional features or to contribute to the Polymarket adapter, please see our
[contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md).
:::
