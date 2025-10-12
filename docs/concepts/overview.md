# 概览

## 简介

NautilusTrader 是一个开源、高性能、面向生产的算法交易平台，旨在使量化交易者能够使用事件驱动的引擎在历史数据上对自动化交易策略组合进行回测，并且能在无需修改策略代码的情况下将相同实现部署到实盘环境。

该平台以 _AI-first_ 为设计理念，目标是在高性能且健壮的 Python 原生环境中开发与部署算法交易策略。这有助于解决研究/回测环境与生产实盘环境之间不一致的问题，保证二者具有最高程度的行为一致性（parity）。

NautilusTrader 在设计、架构与实现时高度重视软件正确性与安全性，旨在支持以 Python 为主的、用于关键任务的交易系统回测与实盘部署工作负载。

此外，该平台具有通用性且与资产类别无关 —— 通过模块化适配器（adapters）可以接入任意 REST API 或 WebSocket 流。它支持面向多种资产类别与合约类型的高频交易，包括 FX（外汇）、股票、期货、期权、加密（Crypto）、去中心化金融（DeFi）以及博彩（Betting），从而能够在多个交易场所并行运行交易策略。

## 特性

- 高速（Fast）：核心使用 Rust 开发，采用 [tokio](https://crates.io/crates/tokio) 实现异步网络。
- 可靠（Reliable）：依托 Rust 的类型与线程安全，同时支持可选的基于 Redis 的状态持久化。
- 可移植（Portable）：与操作系统无关，可运行于 Linux、macOS 和 Windows，并支持通过 Docker 部署。
- 灵活（Flexible）：模块化适配器可接入任意 REST API 或 WebSocket 数据源。
- 高级（Advanced）：支持丰富的 Time-In-Force（如 `IOC`, `FOK`, `GTC`, `GTD`, `DAY`, `AT_THE_OPEN`, `AT_THE_CLOSE`），高级订单类型和条件触发，执行指令（如 `post-only`, `reduce-only`）以及冰山（iceberg）订单。支持联动/应急订单（contingency orders）例如 `OCO`, `OUO`, `OTO`。
- 可定制（Customizable）：允许添加用户自定义组件，或利用 [cache](cache.md) 与 [message bus](message_bus.md) 从头组装完整系统。
- 回测（Backtesting）：支持在多个交易场所、多个品种与策略并行运行，使用历史报价 tick、成交 tick、K 线（bar）、订单簿以及自定义数据，粒度可达纳秒级（nanosecond）。
- 实盘（Live）：回测与实盘可以使用完全相同的策略实现，保证行为一致性。
- 多场所（Multi-venue）：支持多交易场所，便于做市（market-making）与统计套利（statistical arbitrage）策略实现。
- AI 训练（AI Training）：回测引擎速度足够快，可用于训练 AI 交易代理（如强化学习 RL / 进化策略 ES）。

![Nautilus](https://github.com/nautechsystems/nautilus_trader/blob/develop/assets/nautilus-art.png?raw=true "nautilus")

> _nautilus — 源自古希腊语“水手”（sailor）和“船”（naus）。_
>
> _鹦鹉螺（nautilus）壳体由模块化的舱室组成，其增长系数近似于对数螺线。该形态被用于平台在设计与架构上的审美与理念映射。_

## 为什么选择 NautilusTrader？

- 高性能的事件驱动 Python：核心为原生二进制组件。
- 回测与实盘的一致性（parity）：策略代码可在回测与实盘间无缝复用。
- 降低运营风险：增强的风控功能、逻辑准确性以及类型安全性。
- 高度可扩展：内置消息总线（message bus）、自定义组件与 Actor、以及可扩展的适配器体系。

传统上，交易策略研究与回测常在 Python 中使用向量化方法完成，但在把策略移植到事件驱动的生产环境时通常需要用 C++、C#、Java 等静态类型语言重写。原因在于向量化回测无法充分表达实时交易中基于时间与事件的细粒度复杂性，而编译型语言在性能与类型安全上通常更适配生产环境。

NautilusTrader 的一个关键优势是避免了这一步的重复实现：平台的重要核心组件使用 [Rust](https://www.rust-lang.org/) 或 [Cython](https://cython.org/) 完整实现。这意味着我们选对了工具；系统编程语言编译出高性能的二进制，同时通过 CPython 的 C 扩展模块向上暴露出 Python 原生接口，满足专业量化交易员与机构的需求。

## 使用场景

该软件包主要支持三类使用场景：

- 在历史数据上回测交易系统（`backtest`）。
- 使用实时数据与虚拟执行模拟交易系统（`sandbox`）。
- 在真实或模拟账户上部署交易系统并运行实盘（`live`）。

代码库提供了实现上述功能的软件框架。默认的 `backtest` 与 `live` 系统实现位于同名子包中；可以通过 sandbox 适配器构建 `sandbox` 环境。

:::note

- 所有示例均以这些默认系统实现为基础。
- 我们将交易策略视作端到端交易系统（包括应用层与基础设施层）中的子组件。

:::

## 分布式（Distributed）

平台设计便于与更大规模的分布式系统集成。为此，几乎所有配置与领域对象都可以序列化为 JSON、MessagePack 或 Apache Arrow（Feather），用于网络间的高效通信。

## 公共核心（Common core）

公共系统核心被所有节点环境上下文（参见 [environment contexts](/concepts/architecture.md#environment-contexts)：`backtest`、`sandbox` 和 `live`）所使用。用户定义的 `Actor`、`Strategy` 与 `ExecAlgorithm` 等组件在这些环境上下文之间具有一致的管理与生命周期语义。

## 回测（Backtesting）

回测通常先将数据提供给 `BacktestEngine`（可以直接提供，也可通过更高级别的 `BacktestNode` 与 `ParquetDataCatalog`），然后以纳秒精度将数据流通过系统执行回放。

## 实盘交易（Live trading）

`TradingNode` 可以从多个数据源与执行客户端接收数据与事件。实盘部署既可使用模拟/纸面（demo/paper）账户，也可连接真实账户。

在实盘场景中，平台支持在单个事件循环（event loop）上异步运行以获得高性能（参见 Python 的 [event loop](https://docs.python.org/3/library/asyncio-eventloop.html)），在 Linux 与 macOS 上还可以通过 [uvloop](https://github.com/MagicStack/uvloop)（如适用）进一步提升性能。

## 领域模型（Domain model）

平台包含完整的交易领域模型，涵盖基础数值类型（如 `Price`、`Quantity`）以及更复杂的实体（如 `Order` 和 `Position`），这些实体会聚合多个事件以推导出对象状态。

## 时间戳（Timestamps）

平台内所有时间戳均以 UTC 的纳秒精度记录。

时间戳字符串遵循 ISO 8601（RFC 3339）格式，使用 9 位（纳秒）或在某些情况下使用 3 位（毫秒）的小数位表示（主要以纳秒为主），并始终保留所有小数位（包括尾随零）。这些时间戳会出现在日志、调试与对象显示输出中。

时间戳字符串的组成：

- 始终包含完整的日期部分：`YYYY-MM-DD`。
- 使用 `T` 分隔日期与时间部分。
- 通常为纳秒精度（9 位小数），在某些场景（例如 GTD 到期时间）可能使用毫秒精度（3 位小数）。
- 始终以 `Z` 后缀标识 UTC 时区。

示例：`2024-01-05T15:30:45.123456789Z`

完整规范参见 [RFC 3339: Date and Time on the Internet](https://datatracker.ietf.org/doc/html/rfc3339)。

## UUIDs

平台使用符合 RFC 4122 的版本 4 UUID（Universally Unique Identifier）作为唯一标识符。在高性能实现中，我们使用 `uuid` crate 对从字符串解析的 UUID 进行正确性校验，确保输入 UUID 符合规范。

有效的 UUID v4 由以下特征构成：

- 32 个十六进制字符，分为 5 个组显示。
- 各组以连字符分隔，格式为 `8-4-4-4-12`。
- 第三组以 `4` 开头以表示版本 4。
- 第四组以 `8`、`9`、`a` 或 `b` 开头以表示 RFC 4122 变体。

示例：`2d89666b-1a1e-4a75-b193-4eb3b454c757`

完整规范参见 [RFC 4122: A Universally Unique IDentifier (UUID) URN Namespace](https://datatracker.ietf.org/doc/html/rfc4122)。

## 数据类型（Data types）

下列市场数据类型可以历史查询，也可以在交易场所/数据提供方支持时订阅为实时流，并在 integrations 适配器中实现：

- `OrderBookDelta`（L1/L2/L3）
- `OrderBookDeltas`（容器类型）
- `OrderBookDepth10`（每侧固定 10 个档位）
- `QuoteTick`
- `TradeTick`
- `Bar`
- `Instrument`
- `InstrumentStatus`
- `InstrumentClose`

下面的 `PriceType` 可用于构建 K 线（bar）聚合：

- `BID`
- `ASK`
- `MID`
- `LAST`

## K 线（Bar）聚合

以下 `BarAggregation` 方法可用：

- `MILLISECOND`
- `SECOND`
- `MINUTE`
- `HOUR`
- `DAY`
- `WEEK`
- `MONTH`
- `YEAR`
- `TICK`
- `VOLUME`
- `VALUE`（又称 Dollar bars）
- `RENKO`（基于价格的砖形图）
- `TICK_IMBALANCE`
- `TICK_RUNS`
- `VOLUME_IMBALANCE`
- `VOLUME_RUNS`
- `VALUE_IMBALANCE`
- `VALUE_RUNS`

当前已实现的聚合方法：

- `MILLISECOND`
- `SECOND`
- `MINUTE`
- `HOUR`
- `DAY`
- `WEEK`
- `MONTH`
- `YEAR`
- `TICK`
- `VOLUME`
- `VALUE`
- `RENKO`

上文列出但未出现在“已实现”列表中的聚合方法是计划中的功能，尚未实现。

价格类型（PriceType）与 K 线聚合方法（BarAggregation）可以与步长（step sizes）>= 1 组合，通过 `BarSpecification` 灵活配置。这允许在实盘中使用替代 K 线聚合方法。

## 账户类型（Account types）

以下账户类型在实盘与回测环境中均可用：

- `Cash` 单币种（以基础货币为准）
- `Cash` 多币种
- `Margin` 单币种（以基础货币为准）
- `Margin` 多币种
- `Betting` 单币种

## 订单类型（Order types）

下列订单类型在交易所支持时可用：

- `MARKET`
- `LIMIT`
- `STOP_MARKET`
- `STOP_LIMIT`
- `MARKET_TO_LIMIT`
- `MARKET_IF_TOUCHED`
- `LIMIT_IF_TOUCHED`
- `TRAILING_STOP_MARKET`
- `TRAILING_STOP_LIMIT`

## 值类型（Value types）

以下值类型的底层采用 128-bit 或 64-bit 的整数，取决于编译时使用的[精度模式](../getting_started/installation.md#precision-mode)：

- `Price`
- `Quantity`
- `Money`

### 高精度模式（128-bit）

当 `high-precision` feature flag **启用**（默认）时，采用如下规格：

|    类型    | 底层类型 | 最大精度 |       最小值        |       最大值       |
| :--------: | :------: | :------: | :-----------------: | :----------------: |
|  `Price`   |  `i128`  |    16    | -17,014,118,346,046 | 17,014,118,346,046 |
|  `Money`   |  `i128`  |    16    | -17,014,118,346,046 | 17,014,118,346,046 |
| `Quantity` |  `u128`  |    16    |          0          | 34,028,236,692,093 |

### 标准精度模式（64-bit）

当 `high-precision` feature flag **禁用**时，采用如下规格：

|    类型    | 底层类型 | 最大精度 |     最小值     |     最大值     |
| :--------: | :------: | :------: | :------------: | :------------: |
|  `Price`   |  `i64`   |    9     | -9,223,372,036 | 9,223,372,036  |
|  `Money`   |  `i64`   |    9     | -9,223,372,036 | 9,223,372,036  |
| `Quantity` |  `u64`   |    9     |       0        | 18,446,744,073 |
