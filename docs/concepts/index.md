# 核心概念 {#concepts}

这些指南介绍 NautilusTrader 的核心组件、架构与设计。

## 概览 {#overview}

平台的主要特性和预期使用场景。

## 架构 {#architecture}

[架构](./architecture.md) 介绍组件、运行时边界和数据流。

## Actor {#actors}

`DataActor` 是与交易系统交互的基础组件，涵盖其能力和实现细节。

## 策略 {#strategies}

如何使用 `Strategy` 组件实现交易策略。

## 金融工具 {#instruments}

可交易资产与合约的金融工具定义。

## 合成工具 {#synthetics}

用户自定义的金融工具，其价格通过对成分工具价格求值一个数值表达式计算得出。

## 连续期货 {#continuous-futures}

通过显式的展期表（roll table），将连续的期货合约拼接为一条调整后的 bar 序列。指南涵盖四种调整模式、请求与订阅流程，以及 bar 中间的展期边界策略。

## 值类型 {#value-types}

平台各处使用的不可变数值类型（`Price`、`Quantity`、`Money`），包括其算术行为、精度处理和类型特定的约束。

## 数据 {#data}

交易领域的内置数据类型，以及如何处理自定义数据。

## 事件 {#events}

驱动系统的事件类型：订单事件、持仓事件、账户事件和时间事件。涵盖 handler 分发、从订单成交到持仓事件的因果链，以及订单到持仓的追踪。

## 事件溯源 {#event-sourcing}

面向影响状态的消息的持久事件存储日志，包括捕获边界、关联头部（correlation headers）、回放模式、恢复锚点和校验器行为。

## 期权 {#options}

期权工具类型、交易场所提供的 Greeks 数据流、带行权价区间过滤的期权链订阅，以及快照聚合。

## Greeks {#greeks}

期权 Greeks（delta、gamma、vega、theta）来自两条路径：经由 Rust/PyO3 的 `OptionGreeks` 类型获取交易场所提供的实时 Greeks，以及通过 `GreeksCalculator` 在本地做 Black-Scholes 计算。本地计算支持冲击情景、beta 加权和组合聚合。

## 自定义数据 {#custom-data}

自定义数据系统在 Python 和 Rust 中的工作方式：注册、持久化、Arrow 编码，以及经由 actor 和策略的运行时路由。

## 订单簿 {#order-book}

高性能订单簿、自有订单追踪、用于净流动性的过滤视图，以及二元市场支持。

## 执行 {#execution}

跨多个策略和交易场所的同时交易执行与订单管理（按实例），包括组件与消息流、场所边界策略、执行算法和对账。

## 订单 {#orders}

可用的订单类型、支持的执行指令、高级订单类型和模拟订单（emulated orders）。

## 持仓 {#positions}

持仓生命周期、由订单成交聚合持仓、PnL 计算，以及用于净额结算 OMS 配置的持仓快照。

## 缓存 {#cache}

`Cache` 是所有交易相关数据的中央内存存储，涵盖能力和最佳实践。

## 消息总线 {#message-bus}

`MessageBus` 实现组件间的解耦消息传递，支持点对点、发布/订阅和请求/响应模式。

## 账户核算 {#accounting}

账户类型（现金、保证金、博彩、钱包），`AccountBalance` 与 `MarginBalance` 数据模型，以及按工具与全账户两种保证金范围。指南还介绍策略查询 API、内置保证金模型，以及各实时交易场所适配器的约定。

## 投资组合 {#portfolio}

`Portfolio` 跟踪所有策略和工具的持仓，提供持仓、风险暴露和绩效的统一视图。

## 报告 {#reports}

执行报告、投资组合分析、PnL 核算，以及回测结束后分析。

## 日志 {#logging}

以 Rust 实现的高性能日志，回测与实时交易均可用。

## 回测 {#backtesting}

回测 API、数据与交易场所设置、执行时序、成交模拟、账户、资金和保证金配置。

## 行为模型 {#behavioral-models}

[行为模型](./behavioral_models.md) 说明 Rust 和 Python 的模型实现如何进入运行时。

## 可视化 {#visualization}

用于分析回测结果的交互式 tearsheet，包括图表、主题、自定义选项，以及通过可扩展图表注册表实现的自定义可视化。

## 配置 {#configuration}

配置结构体在 Python 和 Rust 中的工作方式：默认值解析、`T` 与 `Option<T>` 约定、builder 模式，以及适配器和引擎共用的常见字段。

## 实时交易 {#live-trading}

在真实市场运行同一份策略与执行算法代码，同时处理交易场所、传输、时序、持久化、外部活动和对账行为。

## 适配器 {#adapters}

为数据提供商和交易场所开发集成适配器的要求与最佳实践。

## 网络 {#networking}

共享的 HTTP、WebSocket 和原生 TCP socket 客户端的架构、可靠性策略与性能特征。

## Rust {#rust}

直接使用 `crates/` 实现，以纯 Rust 编写 actor、策略，并运行回测和实时交易。

## Python {#python}

Python 应用的组装方式，以及用户组件如何通过 PyO3 运行在 Rust 核心之上，包括所有权、异步执行和公共 API 边界。

## DST {#dst}

确定性模拟测试（DST，deterministic simulation testing）：可按种子重放的执行契约，以及实现该契约的源码级接缝（seam）。指南还介绍强制执行该契约的 pre-commit 钩子和已知的范围边界。

:::note
若这些指南与 API 参考有出入，以 API 参考为准。
:::
