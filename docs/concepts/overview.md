# 概览 {#overview}

## 简介 {#introduction}

NautilusTrader 是一个开源、生产级、Rust 原生的引擎，用于构建多资产、多交易场所的交易系统。

系统覆盖研究、确定性模拟和实时执行，全部运行在同一套事件驱动架构内。Python 作为控制面，负责策略逻辑、配置和编排。

这种分层兼顾了编译型交易引擎的性能与安全性，以及 Python 在系统组装和策略开发上的灵活性。关键任务负载也可以完全用 Rust 编写交易系统。

同一份策略与执行算法代码可以跨回测和实时系统运行，减少部署差异。实时执行仍会引入模拟未必能复现的交易场所、传输、时序、持久化、外部活动和对账行为。见
[回测与实时的差异](./live.md#backtest-and-live-differences)。

NautilusTrader 不绑定资产类别。任何提供 REST API 或 WebSocket 数据源的场所都可以通过模块化适配器接入。已有集成覆盖中心化和去中心化加密货币交易所（CEX 与 DEX）、外汇（FX）、股票、期货、期权和博彩交易所。

## 特性 {#features}

- **快速**：Rust 核心，使用 [tokio](https://crates.io/crates/tokio) 做异步网络。
- **可靠**：Rust 提供类型安全与线程安全，状态可选持久化到 Redis 或 PostgreSQL。
- **可移植**：支持 Linux、macOS 和 Windows，可用 Docker 部署。
- **灵活**：模块化适配器可接入任意 REST API 或 WebSocket 数据源。
- **高级订单**：时效（Time-in-force）选项包括 `IOC`、`FOK`、`GTC`、`GTD`、`DAY`、`AT_THE_OPEN` 和 `AT_THE_CLOSE`。领域模型还支持条件触发、`post-only`、`reduce-only`、冰山单（iceberg），以及 `OCO`、`OUO`、`OTO` 或有订单。各交易场所的支持取决于适配器。
- **可定制**：使用用户自定义组件，或基于[缓存](./cache.md)和[消息总线](./message_bus.md)从零组装整个系统。
- **回测**：以纳秒级精度，用历史报价、成交、bar、订单簿和自定义数据同时运行多个交易场所、金融工具和策略。
- **实时**：研究与实时部署使用完全相同的策略实现。
- **多场所**：同时跨多个交易场所运行做市和跨场所策略。
- **AI 训练**：高吞吐模拟可支撑训练 AI 交易智能体等负载，如强化学习（RL）或进化策略（ES）。

## 为什么选择 NautilusTrader？ {#why-nautilustrader}

交易策略研究通常在 Python 中用向量化方式完成，而生产交易系统则另行用编译型语言以事件驱动架构搭建。

NautilusTrader 消除了这种割裂。

Rust 原生核心为研究和实时执行提供同一个确定性事件驱动运行时，Python 充当控制面。两个环境使用同一套架构、执行语义和时间模型，策略从研究走到生产无需重写。

Rust 原生运行时通过 [PyO3](https://pyo3.rs) 暴露 Python 绑定。安装官方预编译 Python wheel 不需要 Rust 工具链。

## 使用场景 {#use-cases}

NautilusTrader 支持三类主要场景：

- 在历史数据上回测交易系统（`backtest`）。
- 用实时数据和虚拟执行模拟交易系统（`sandbox`）。
- 在真实或模拟盘账户上实时部署交易系统（`live`）。

NautilusTrader 为 Python 和 Rust 都提供回测与实时节点实现。
sandbox 适配器为 `sandbox` 环境提供模拟执行。

:::note

- 除非另有说明，示例均使用这些节点实现。
- 交易策略只是端到端交易系统的一个组件，系统还包括应用层和基础设施层。

:::

## 分布式 {#distributed}

平台可集成到更大的分布式系统中：

- [外部消息总线](./message_bus.md#encoding)支持 JSON 和 MessagePack 负载，模式（schema）覆盖的行情数据还支持 Cap'n Proto 和 Simple Binary Encoding (SBE)。
- Apache Arrow 和 Parquet 通过[数据目录](./data/catalog.md)提供列式交换与持久化。

各负载类型支持的格式不同。

## 通用核心 {#common-core}

所有节点[环境上下文](./architecture.md#environment-contexts)——`backtest`、`sandbox`、`live`——都使用同一套系统核心。用户定义的 actor、策略和执行算法在这些上下文中使用相同的生命周期。

## 回测 {#backtesting}

数据可直接喂给 `BacktestEngine`，也可经由更上层的 `BacktestNode` 和 `ParquetDataCatalog` 送入，然后以纳秒级精度让数据流经系统。API 与执行模型见 [回测](./backtesting/index.md)。

## 实时交易 {#live-trading}

`LiveNode` 从多个数据客户端和执行客户端摄取数据与事件，支持演示、模拟盘和真实账户。Rust 原生节点（含其 PyO3 接口）在调用线程上运行内核事件循环。异步 I/O 与后台任务使用共享的多线程 Tokio 运行时。

节点生命周期与风险注意事项见 [实时交易](./live.md)，状态恢复见 [执行对账](./execution/reconciliation.md)。

## 领域模型 {#domain-model}

交易领域模型包含 `Price`、`Quantity` 等[值类型](./value_types.md)，以及通过聚合事件来确定状态的[订单](./orders/index.md)和[持仓](./positions.md)。

## 时间戳 {#timestamps}

NautilusTrader 以 **UNIX 纳秒**表示系统时间戳。其标准 ISO 8601（RFC 3339）格式化器使用 UTC，并保留全部九位小数。毫秒格式化器为部分展示场景保留三位小数，例如 good-till-date（GTD）到期时间。

时间戳字符串由以下部分组成：

- 始终包含完整日期部分：`YYYY-MM-DD`。
- 日期与时间之间用 `T` 分隔。
- 纳秒输出保留九位小数，毫秒输出保留三位。
- `Z` 后缀表示 UTC 时区。

示例：`2024-01-05T15:30:45.123456789Z`

完整规范见
[RFC 3339: Date and Time on the Internet](https://datatracker.ietf.org/doc/html/rfc3339)。

## UUID {#uuids}

`UUID4` 值类型为事件、命令、报告及其他内部消息提供随机的通用唯一标识符（UUID）版本 4 值。解析字符串时，它使用 `uuid` crate 校验版本位和变体位。

按 RFC 9562，合法的 UUID v4 满足：

- 32 个十六进制数字，分为 5 组显示。
- 组间用连字符分隔：`8-4-4-4-12` 格式。
- 版本 4 标识（第三组以 "4" 开头）。
- IETF 变体标识（第四组以 "8"、"9"、"a" 或 "b" 开头）。

示例：`2d89666b-1a1e-4a75-b193-4eb3b454c757`

完整规范见
[RFC 9562: Universally Unique Identifiers (UUIDs)](https://www.rfc-editor.org/rfc/rfc9562.html)。

## 数据类型 {#data-types}

NautilusTrader 定义了以下内置行情与参考数据类型。历史请求和实时订阅的可用性取决于提供商和适配器。字段与行为见 [数据](./data/index.md)。

- `OrderBookDelta`（单笔订单簿变更）
- `OrderBookDeltas`（容器类型）
- `OrderBookDepth`（可变深度快照，内联容量为十档）
- `QuoteTick`
- `TradeTick`
- `Bar`
- `MarkPriceUpdate`
- `IndexPriceUpdate`
- `FundingRateUpdate`
- `OptionGreeks`
- `Instrument`
- `InstrumentStatus`
- `InstrumentClose`

应用自定义类型请使用[自定义数据](./custom_data.md)。

以下 `PriceType` 选项为内部 bar 聚合选择细粒度数据：

- `BID`
- `ASK`
- `MID`
- `LAST`

`BID`、`ASK`、`MID` 使用 `QuoteTick` 数据，`LAST` 使用 `TradeTick` 数据。
复合 bar 类型则聚合更小的 bar。

## Bar 聚合 {#bar-aggregations}

可用的 `BarAggregation` 方法如下：

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
- `VALUE`（即 dollar bars）
- `RENKO`（基于价格的砖块）
- `TICK_IMBALANCE`
- `TICK_RUNS`
- `VOLUME_IMBALANCE`
- `VOLUME_RUNS`
- `VALUE_IMBALANCE`
- `VALUE_RUNS`

上述聚合均已实现内部聚合。信息驱动型聚合需要 `TradeTick` 数据。

`BarSpecification` 组合了价格类型、聚合方法和正数步长。固定子单位的时间 bar 有整除性限制。校验规则见 [Bar 类型](./data/index.md#bar-types)。实时交易期间，只要所需的输入数据可用，即可运行内部聚合。

## 账户类型 {#account-types}

[核算引擎](./accounting.md#account-types)在实时和回测环境中都支持以下配置：

- `Cash` 单币种（基础货币）
- `Cash` 多币种
- `Margin` 单币种（基础货币）
- `Margin` 多币种
- `Betting` 单币种
- `Wallet` 多币种（区块链钱包，执行客户端尚在开发中）

## 订单类型 {#order-types}

[订单模型](./orders/index.md)支持以下类型，具体取决于交易场所适配器的支持情况：

- `MARKET`
- `LIMIT`
- `STOP_MARKET`
- `STOP_LIMIT`
- `MARKET_TO_LIMIT`
- `MARKET_IF_TOUCHED`
- `LIMIT_IF_TOUCHED`
- `TRAILING_STOP_MARKET`
- `TRAILING_STOP_LIMIT`

## 值类型 {#value-types}

以下定点值类型以 128 位或 64 位原始整数为底层，取决于编译时使用的[精度模式](./../getting_started/installation.md#precision-mode)。

- `Price`
- `Quantity`
- `Money`

官方 Python wheel 在所有受支持平台上使用高精度模式。纯 Rust 构建默认使用标准精度，除非启用 `high-precision` feature。

### 高精度模式（128 位） {#high-precision-mode-128-bit}

启用 `high-precision` feature 标志时（**enabled**），值采用以下规格：

| 类型       | 底层存储  | 最大精度 | 最小值              | 最大值             |
| :--------- | :-------- | :------- | :------------------ | :----------------- |
| `Price`    | `i128`    | 16       | -17,014,118,346,046 | 17,014,118,346,046 |
| `Money`    | `i128`    | 16       | -17,014,118,346,046 | 17,014,118,346,046 |
| `Quantity` | `u128`    | 16       | 0                   | 34,028,236,692,093 |

### 标准精度模式（64 位） {#standard-precision-mode-64-bit}

**禁用** `high-precision` feature 标志时，值采用以下规格：

| 类型       | 底层存储 | 最大精度 | 最小值         | 最大值         |
| :--------- | :------- | :------- | :------------- | :------------- |
| `Price`    | `i64`    | 9        | -9,223,372,036 | 9,223,372,036  |
| `Money`    | `i64`    | 9        | -9,223,372,036 | 9,223,372,036  |
| `Quantity` | `u64`    | 9        | 0              | 18,446,744,073 |
