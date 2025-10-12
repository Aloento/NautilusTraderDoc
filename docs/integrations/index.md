# 集成

NautilusTrader 使用模块化的 _adapter_（适配器）来连接交易场所和数据提供方，将各类原始 API 转换为统一的接口和规范化的领域模型。

当前支持的集成如下：

| Name                                                                         | ID                    | Type                    | Status                                                  | Docs                                   |
| :--------------------------------------------------------------------------- | :-------------------- | :---------------------- | :------------------------------------------------------ | :------------------------------------- |
| [Betfair](https://betfair.com)                                               | `BETFAIR`             | Sports Betting Exchange | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/betfair.md)       |
| [Binance](https://binance.com)                                               | `BINANCE`             | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/binance.md)       |
| [BitMEX](https://www.bitmex.com)                                             | `BITMEX`              | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/bitmex.md)        |
| [Bybit](https://www.bybit.com)                                               | `BYBIT`               | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/bybit.md)         |
| [Coinbase International](https://www.coinbase.com/en/international-exchange) | `COINBASE_INTX`       | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/coinbase_intx.md) |
| [Databento](https://databento.com)                                           | `DATABENTO`           | Data Provider           | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/databento.md)     |
| [dYdX](https://dydx.exchange/)                                               | `DYDX`                | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/dydx.md)          |
| [Hyperliquid](https://hyperliquid.xyz)                                       | `HYPERLIQUID`         | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/building-orange) | [Guide](integrations/hyperliquid.md)   |
| [Interactive Brokers](https://www.interactivebrokers.com)                    | `INTERACTIVE_BROKERS` | Brokerage (multi-venue) | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/ib.md)            |
| [OKX](https://okx.com)                                                       | `OKX`                 | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/okx.md)           |
| [Polymarket](https://polymarket.com)                                         | `POLYMARKET`          | Prediction Market (DEX) | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/polymarket.md)    |
| [Tardis](https://tardis.dev)                                                 | `TARDIS`              | Crypto Data Provider    | ![status](https://img.shields.io/badge/stable-green)    | [Guide](integrations/tardis.md)        |

- **ID**：集成适配器客户端的默认 client ID。
- **Type**：集成的类型（通常对应场所类型）。

## 状态（Status）

- `building`：正在开发中，可能尚不可用。
- `beta`：已达到最小可用状态，处于 beta 测试阶段。
- `stable`：功能与 API 已稳定，经过开发者与用户的合理测试（仍可能存在一些缺陷）。

## 实现目标（Implementation goals）

NautilusTrader 的主要目标是为多种集成提供一个统一的交易系统。
为了支持更广泛的交易策略，实现时会优先保证*标准*功能的可用性：

- 请求历史市场数据（requesting historical market data）。
- 实时流式市场数据（streaming live market data）。
- 执行状态的对账（reconciling execution state）。
- 提交常见的订单类型并支持标准的执行指令（submitting standard order types with standard execution instructions）。
- 修改已提交的订单（如果交易所支持）。
- 取消订单（canceling orders）。

每个集成的实现应满足以下准则：

- 底层客户端组件应尽量贴合交易所的原生 API。
- 在适用于 NautilusTrader 的范围内，应*最终*支持交易所的全部功能。
- 会添加交易所特有的数据类型，以支持用户合理期待的功能和返回类型。
- 对于交易所或 NautilusTrader 不支持的操作，调用时应记录为警告或错误。

## API 统一（API unification）

所有集成都必须遵循 NautilusTrader 的系统 API，要求对数据和行为进行规范化：

- Symbol（代码）应使用场所的原生符号格式，除非需要区分（例如 Binance Spot 与 Binance Futures）。
- 时间戳必须使用 UNIX epoch 纳秒（nanoseconds）。如果使用毫秒（milliseconds），字段/属性名应明确以 `_ms` 结尾。
