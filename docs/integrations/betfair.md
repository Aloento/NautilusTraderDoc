# Betfair

Betfair 成立于 2000 年，运营着全球最大的在线博彩交易所（betting exchange），总部位于伦敦，并在全球设有分支机构。

NautilusTrader 提供了用于集成 Betfair REST API 与 Exchange Streaming API 的适配器（adapter）。

## 安装

通过 pip 安装带有 Betfair 支持的 NautilusTrader：

```bash
pip install --upgrade "nautilus_trader[betfair]"
```

如果从源码构建并包含 Betfair 的扩展：

```bash
uv sync --all-extras
```

## 示例

可在仓库中的示例脚本查看实时接入示例：[examples/live/betfair](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/betfair/)。

## Betfair 文档

有关 API 细节与故障排查，请参阅官方的 [Betfair Developer Documentation](https://developer.betfair.com/en/get-started/)。

## 应用密钥（Application keys）

Betfair 要求使用 Application Key 来对 API 请求进行认证。完成注册并为账户充值后，可通过 [API-NG Developer AppKeys Tool](https://apps.betfair.com/visualisers/api-ng-account-operations/) 获取你的应用密钥。

:::info
也可参考 [Betfair Getting Started - Application Keys](https://betfair-developer-docs.atlassian.net/wiki/spaces/1smk3cen4v3lu3yomq5qye0ni/pages/2687105/Application+Keys) 指南。
:::

## API 凭证

可以通过环境变量或客户端配置来提供 Betfair 凭证：

```bash
export BETFAIR_USERNAME=<your_username>
export BETFAIR_PASSWORD=<your_password>
export BETFAIR_APP_KEY=<your_app_key>
export BETFAIR_CERTS_DIR=<path_to_certificate_dir>
```

:::tip
建议使用环境变量来管理你的凭证。
:::

## 概述

Betfair 适配器包含三个主要组件：

- `BetfairInstrumentProvider`：加载 Betfair 市场并将其转换为 Nautilus 的 instrument。
- `BetfairDataClient`：通过 Exchange Streaming API 推送实时市场数据。
- `BetfairExecutionClient`：通过 REST API 提交订单（即下注）并跟踪执行状态。

## 订单能力（Orders capability）

作为博彩交易所，Betfair 与传统金融交易所存在一些显著差异，下面列出其支持与不支持的订单特性：

### 订单类型

| Order Type             | Supported | Notes                      |
| ---------------------- | --------- | -------------------------- |
| `MARKET`               | -         | 不适用于博彩交易所。       |
| `LIMIT`                | ✓         | 在指定赔率（odds）下下单。 |
| `STOP_MARKET`          | -         | _不支持_。                 |
| `STOP_LIMIT`           | -         | _不支持_。                 |
| `MARKET_IF_TOUCHED`    | -         | _不支持_。                 |
| `LIMIT_IF_TOUCHED`     | -         | _不支持_。                 |
| `TRAILING_STOP_MARKET` | -         | _不支持_。                 |

### 执行指令（Execution instructions）

| Instruction   | Supported | Notes                |
| ------------- | --------- | -------------------- |
| `post_only`   | -         | 不适用于博彩交易所。 |
| `reduce_only` | -         | 不适用于博彩交易所。 |

### 有效时间选项（Time in force options）

| Time in force | Supported | Notes                          |
| ------------- | --------- | ------------------------------ |
| `GTC`         | -         | 博彩交易所使用不同的订单模型。 |
| `GTD`         | -         | 博彩交易所使用不同的订单模型。 |
| `FOK`         | -         | 博彩交易所使用不同的订单模型。 |
| `IOC`         | -         | 博彩交易所使用不同的订单模型。 |

### 高级订单功能（Advanced order features）

| Feature            | Supported | Notes                          |
| ------------------ | --------- | ------------------------------ |
| Order Modification | ✓         | 仅限于不会改变风险敞口的字段。 |
| Bracket/OCO Orders | -         | _不支持_。                     |
| Iceberg Orders     | -         | _不支持_。                     |

### 批量操作（Batch operations）

| Operation    | Supported | Notes      |
| ------------ | --------- | ---------- |
| Batch Submit | -         | _不支持_。 |
| Batch Modify | -         | _不支持_。 |
| Batch Cancel | -         | _不支持_。 |

### 持仓管理（Position management）

| Feature          | Supported | Notes                                  |
| ---------------- | --------- | -------------------------------------- |
| Query positions  | -         | 博彩交易所的持仓模型不同，通常不适用。 |
| Position mode    | -         | 不适用于博彩交易所。                   |
| Leverage control | -         | 博彩交易所无杠杆。                     |
| Margin mode      | -         | 博彩交易所无保证金模式。               |

### 订单查询（Order querying）

| Feature              | Supported | Notes                             |
| -------------------- | --------- | --------------------------------- |
| Query open orders    | ✓         | 列出所有未结注单（活动的 bets）。 |
| Query order history  | ✓         | 可查询历史下注记录。              |
| Order status updates | ✓         | 实时下注状态更新。                |
| Trade history        | ✓         | 匹配与结算的报表。                |

### 或有订单（Contingent orders）

| Feature            | Supported | Notes                  |
| ------------------ | --------- | ---------------------- |
| Order lists        | -         | _不支持_。             |
| OCO orders         | -         | _不支持_。             |
| Bracket orders     | -         | _不支持_。             |
| Conditional orders | -         | 仅支持基本的下注条件。 |

## 配置

### 数据客户端（Data client）配置选项

| Option                    | Default  | Description                                                      |
| ------------------------- | -------- | ---------------------------------------------------------------- |
| `account_currency`        | Required | Betfair 账户用于数据与价格推送的货币。                           |
| `username`                | `None`   | Betfair 账户用户名；若未指定则从环境变量读取。                   |
| `password`                | `None`   | Betfair 账户密码；若未指定则从环境变量读取。                     |
| `app_key`                 | `None`   | 用于 API 认证的 Betfair 应用密钥。                               |
| `certs_dir`               | `None`   | 存放 Betfair SSL 证书的目录（用于登录）。                        |
| `instrument_config`       | `None`   | 可选的 `BetfairInstrumentProviderConfig`，用于限定可用市场范围。 |
| `subscription_delay_secs` | `3`      | 在首次订阅市场前等待的秒数延迟。                                 |
| `keep_alive_secs`         | `36,000` | Betfair 会话的保活间隔（秒）。                                   |
| `stream_conflate_ms`      | `None`   | 显式的流合并（conflation）间隔，单位毫秒（`0` 表示禁用合并）。   |

### 执行客户端（Execution client）配置选项

| Option                       | Default  | Description                                                                          |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `account_currency`           | Required | Betfair 账户用于下单与余额计算的货币。                                               |
| `username`                   | `None`   | Betfair 账户用户名；若未指定则从环境变量读取。                                       |
| `password`                   | `None`   | Betfair 账户密码；若未指定则从环境变量读取。                                         |
| `app_key`                    | `None`   | 用于 API 认证的 Betfair 应用密钥。                                                   |
| `certs_dir`                  | `None`   | 存放 Betfair SSL 证书的目录（用于登录）。                                            |
| `instrument_config`          | `None`   | 可选的 `BetfairInstrumentProviderConfig`，用于限定对账（reconciliation）的市场范围。 |
| `calculate_account_state`    | `True`   | 为 `True` 时从事件本地计算账户状态。                                                 |
| `request_account_state_secs` | `300`    | 轮询 Betfair 以获取账户状态的时间间隔（秒，`0` 表示禁用）。                          |
| `reconcile_market_ids_only`  | `False`  | 若为 `True`，对账请求仅覆盖配置的 market id 列表。                                   |
| `ignore_external_orders`     | `False`  | 若为 `True`，忽略流中本地缓存不存在的外部订单。                                      |

下面给出一个最小示例，演示如何在实时 `TradingNode` 中配置 Betfair 客户端：

```python
from nautilus_trader.adapters.betfair import BETFAIR
from nautilus_trader.adapters.betfair import BetfairLiveDataClientFactory
from nautilus_trader.adapters.betfair import BetfairLiveExecClientFactory
from nautilus_trader.config import TradingNodeConfig
from nautilus_trader.live.node import TradingNode

# 配置 Betfair 的数据与执行客户端（使用 AUD 作为账户货币）
config = TradingNodeConfig(
    data_clients={BETFAIR: {"account_currency": "AUD"}},
    exec_clients={BETFAIR: {"account_currency": "AUD"}},
)

# 使用 Betfair 适配器工厂构建 TradingNode
node = TradingNode(config)
node.add_data_client_factory(BETFAIR, BetfairLiveDataClientFactory)
node.add_exec_client_factory(BETFAIR, BetfairLiveExecClientFactory)
node.build()
```

:::info
如需更多功能或希望为 Betfair 适配器贡献代码，请参阅我们的
[contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
