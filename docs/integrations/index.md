# 集成 {#integrations}

NautilusTrader 通过模块化的 *adapter* 连接交易场所和数据提供商。adapter 将原始 API 转换为统一接口和
规范化的领域模型。

目前已提供或计划提供以下集成：

| 名称                                                       | ID                    | 类型                    | 状态                                                    | 文档                            |
| :--------------------------------------------------------- | :-------------------- | :---------------------- | :-------------------------------------------------------- | :------------------------------ |
| [AX Exchange](https://architect.exchange)                  | `AX`                  | 衍生品交易所            | ![status](https://img.shields.io/badge/stable-green)      | [指南](./architect_ax.md)        |
| [Betfair](https://betfair.com)                             | `BETFAIR`             | 体育博彩交易所          | ![status](https://img.shields.io/badge/stable-green)      | [指南](./betfair.md)             |
| [Binance](https://binance.com)                             | `BINANCE`             | 加密货币交易所（CEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./binance.md)             |
| [CoinAPI](https://www.coinapi.io/?ref=nautilus)            | `COINAPI`             | 数据提供商              | ![status](https://img.shields.io/badge/beta-yellow)       | [指南](./coinapi.md)             |
| [Coinbase](https://coinbase.com)                           | `COINBASE`            | 加密货币交易所（CEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./coinbase.md)            |
| [Blockchain](./blockchain.md)                                | `BLOCKCHAIN`          | DeFi 数据提供商         | ![status](https://img.shields.io/badge/stable-green)      | [指南](./blockchain.md)          |
| [Bybit](https://www.bybit.com)                             | `BYBIT`               | 加密货币交易所（CEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./bybit.md)               |
| [Databento](https://databento.com)                         | `DATABENTO`           | 数据提供商              | ![status](https://img.shields.io/badge/stable-green)      | [指南](./databento.md)           |
| [Deribit](https://www.deribit.com)                         | `DERIBIT`             | 加密货币交易所（CEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./deribit.md)             |
| [Derive](https://www.derive.xyz)                           | `DERIVE`              | 加密货币交易所（DEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./derive.md)              |
| [dYdX](https://dydx.trade)                                 | `DYDX`                | 加密货币交易所（DEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./dydx.md)                |
| [FinFeed](https://www.finfeedapi.com/?ref=nautilus)        | `FINFEED`             | 数据提供商              | ![status](https://img.shields.io/badge/planned-lightgrey) | -                               |
| [Hyperliquid](https://hyperliquid.xyz)                     | `HYPERLIQUID`         | 加密货币交易所（DEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./hyperliquid.md)         |
| [Interactive Brokers](https://www.interactivebrokers.com)  | `INTERACTIVE_BROKERS` | 券商（多场所）          | ![status](https://img.shields.io/badge/stable-green)      | [指南](./interactive_brokers.md) |
| [Kalshi](https://kalshi.com)                               | `KALSHI`              | 预测市场（CEX）         | ![status](https://img.shields.io/badge/planned-lightgrey) | -                               |
| [Kraken](https://kraken.com)                               | `KRAKEN`              | 加密货币交易所（CEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./kraken.md)              |
| [Lighter](https://lighter.xyz)                             | `LIGHTER`             | 加密货币交易所（DEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./lighter.md)             |
| [Lighter on Robinhood](https://robinhoodchain.lighter.xyz) | `LIGHTER_ROBINHOOD`   | 加密货币交易所（DEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./lighter.md)             |
| [OKX](https://okx.com)                                     | `OKX`                 | 加密货币交易所（CEX）   | ![status](https://img.shields.io/badge/stable-green)      | [指南](./okx.md)                 |
| [Polymarket](https://polymarket.com)                       | `POLYMARKET`          | 预测市场（DEX）         | ![status](https://img.shields.io/badge/stable-green)      | [指南](./polymarket.md)          |
| [Tardis](https://tardis.dev)                               | `TARDIS`              | 加密数据提供商          | ![status](https://img.shields.io/badge/stable-green)      | [指南](./tardis.md)              |

- **ID**：集成 adapter 客户端的默认客户端 ID。
- **类型**：集成的类型（通常对应交易场所的类型）。

Lighter on Robinhood 使用 `LIGHTER_ROBINHOOD` 作为交易场所，注册时也必须显式使用该客户端 ID。
共用的 Lighter 工厂仍以 `LIGHTER` 作为兼容默认值。

## 状态 {#status}

- `planned`：计划未来开发。
- `building`：正在建设中，大概率不可用。
- `beta`：已达到最低可用状态，处于 beta 测试阶段。
- `stable`：功能集和 API 已稳定。开发者和用户已将其测试到合理程度，但仍可能残留部分 bug。

## 实现目标 {#implementation-goals}

NautilusTrader 的目标是为各种集成提供统一的交易系统。为覆盖尽可能广的交易策略，开发时优先支持*标准*功能：

- 请求历史行情数据。
- 实时推进行情数据。
- 对账执行状态。
- 提交标准订单类型及标准执行指令。
- 修改已有订单（交易所支持时）。
- 撤销订单。

每项集成的实现都要满足以下标准：

- 底层客户端组件尽可能贴合交易所 API。
- 交易所的全部功能（凡是 NautilusTrader 适用的部分）*最终*都应得到支持。
- 交易所专有数据类型应支持用户合理预期的功能和返回类型。
- 交易所或 NautilusTrader 不支持的操作，在被调用时记录为 warning 或 error 日志。

::::warning[TRACE 日志与凭据]

TRACE 日志可能包含原始的外发 WebSocket 报文，其中某些交易场所的数据含认证信息。
TRACE 只用于本地调试，对外分享前先做脱敏处理。

::::

## API 统一 {#api-unification}

所有集成都必须符合 NautilusTrader 的系统 API，为此需要做归一化和标准化：

- 除非需要消歧（如 Binance Spot 与 Binance Futures），合约符号应使用交易场所的原生符号格式。
- 时间戳必须使用 UNIX epoch 纳秒。若使用毫秒，字段/属性名应以 `_ms` 明确结尾。
