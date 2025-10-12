# 概念

概念指南介绍并阐明了构成 NautilusTrader 平台基础的核心理念、组件与最佳实践。
这些指南旨在提供概念性与实务性的双重洞察，帮助你理解系统架构、策略设计、数据管理、执行流程等关键要素。
阅读下面各章可加深对平台的理解，充分发挥 NautilusTrader 的功能。

## [概览](overview.md)

**概览（Overview）** 一章介绍了平台的主要功能与典型使用场景。

## [架构](architecture.md)

**架构（Architecture）** 一章深入探讨构成平台的基本原理、结构与设计思路，适合开发者、系统架构师或对 NautilusTrader 内部实现感兴趣的读者。

## [Actor（参与者）](actors.md)

`Actor` 是与交易系统交互的基础组件。
**Actor（参与者）** 指南介绍其能力范围与实现细节。

## [策略](strategies.md)

`Strategy` 在编写与运行交易策略时处于用户体验的核心位置。
**策略（Strategies）** 指南讲解如何为平台实现策略。

## [品种/合约（Instruments）](instruments.md)

**品种/合约（Instruments）** 指南说明了可交易资产与合约的各种定义规范。

## [数据](data.md)

NautilusTrader 平台定义了一系列用于交易领域的内置数据类型。
**数据（Data）** 指南涵盖如何使用内置数据与自定义数据类型。

## [执行](execution.md)

NautilusTrader 能够在同一实例中为多个策略和交易场所同时处理交易执行与订单管理。
**执行（Execution）** 指南介绍执行相关组件以及执行消息（命令与事件）的流转。

## [订单](orders.md)

**订单（Orders）** 指南详述平台支持的订单类型以及每种类型的执行指令。还包含高级订单类型和模拟订单的相关说明。

## [持仓](positions.md)

**持仓（Positions）** 指南解释了 NautilusTrader 中持仓的工作方式，包括持仓生命周期、由成交回填聚合产生的持仓、盈亏计算，以及在净额清算（netting）OMS 配置下重要的持仓快照（position snapshot）概念。

## [缓存（Cache）](cache.md)

`Cache` 是用于管理所有交易相关数据的中心内存数据存储。
**缓存（Cache）** 指南介绍了缓存的能力与最佳实践。

## [消息总线（Message Bus）](message_bus.md)

`MessageBus` 是支持组件间解耦消息通信的核心系统，包含点对点（point-to-point）、发布/订阅（publish/subscribe）和请求/响应（request/response）等模式。
**消息总线（Message Bus）** 指南介绍 `MessageBus` 的能力与最佳实践。

## [组合/投资组合（Portfolio）](portfolio.md)

`Portfolio` 是用于管理与跟踪交易节点或回测中各活跃策略持仓的中央枢纽。
它会整合来自多个品种的持仓数据，提供对资产、风险暴露与整体表现的统一视图。
通过本节可以了解 NautilusTrader 如何汇总并更新组合状态以支持有效的交易与风险管理。

## [报告](reports.md)

**报告（Reports）** 指南涵盖平台的报告能力，包括执行报告、组合分析报告、盈亏（P&L）与会计考虑，以及报告在回测后期分析中的使用方式。

## [日志记录](logging.md)

平台为回测与实盘交易提供日志记录，使用 Rust 实现的高性能记录器。

## [回测](backtesting.md)

使用 NautilusTrader 进行回测是通过特定系统实现对交易活动进行有条理的模拟过程。

## [实盘交易（Live Trading）](live.md)

在 NautilusTrader 中，实盘交易允许交易者将回测过的策略直接在实时环境中运行，而无需更改代码。这种无缝转换保证了一致性与可靠性，但回测与实盘在若干方面仍存在关键差异。

## [适配器（Adapters）](adapters.md)

NautilusTrader 的设计支持通过适配器（adapter）集成数据提供商或交易场所。
**适配器（Adapters）** 指南介绍了开发新集成适配器时的要求与最佳实践。

:::note
应将 [API Reference](../api_reference/index.md) 文档视为平台的权威来源。如果此处概念性说明与 API Reference 存在差异，以 API Reference 为准。我们正致力于让概念文档与 API Reference 保持同步，并将在不久的将来引入文档测试（doc tests）以协助完成此目标。
:::
