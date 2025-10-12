# 架构

欢迎阅读 NautilusTrader 的架构概览。

本指南深入介绍支撑该平台的基本原则、结构与设计。无论你是开发者、系统架构师，还是对 NautilusTrader 内部实现感兴趣的读者，本章节包含：

- 推动设计决策与系统演进的设计理念。
- 提供全局视角的系统架构总览。
- 为实现模块化与可维护性而组织的框架结构说明。
- 保持可读性与可扩展性的代码结构要点。
- 组件组织与交互的分解，帮助理解各部分如何通信与协作。
- 最后，若干对性能、可靠性与健壮性至关重要的实现技术。

:::note
在整篇文档中，术语 _"Nautilus system boundary"_ 指的是单个 Nautilus 节点（也称为“trader instance”）运行时内部的操作范围。
:::

## 设计理念

NautilusTrader 采用的主要架构技术与设计模式包括：

- [领域驱动设计（Domain driven design, DDD）](https://en.wikipedia.org/wiki/Domain-driven_design)
- [事件驱动架构（Event-driven architecture）](https://en.wikipedia.org/wiki/Event-driven_programming)
- [消息模式（Messaging patterns）](https://en.wikipedia.org/wiki/Messaging_pattern)（Pub/Sub、Req/Rep、点对点）
- [Ports and adapters（六边形架构）](<https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)>)
- [Crash-only design（仅崩溃设计）](#crash-only-design)

这些技术用于在架构决策中实现若干关键质量属性。

### 质量属性

架构决策通常需要在相互竞争的目标间权衡。下面按大致重要性列出在设计与架构决策时会优先考虑的若干质量属性：

- 可靠性（Reliability）
- 性能（Performance）
- 模块化（Modularity）
- 可测试性（Testability）
- 可维护性（Maintainability）
- 可部署性（Deployability）

### 以可证明性为导向的工程实践

NautilusTrader 正在逐步采用高保障（high-assurance）的工程思路：关键代码路径应携带可执行的不变式（executable invariants），以验证行为符合业务需求。具体实践包括：

- 识别失败会带来最大冲击的组件（核心域类型、风控与执行流等），并以自然语言写出它们的不变式。
- 将这些不变式编码为可执行检查（单元测试、属性测试、模糊测试、静态断言），在 CI 中运行以保持快速反馈。
- 优先使用 Rust 内置的“零成本”安全技术（所有权、`Result` 返回类型、`panic = abort` 等），仅在确有必要时引入有成本的形式化工具。
- 将“保障欠债（assurance debt）”与功能工作并行跟踪，确保新集成扩展了安全网而非绕过它。

这一策略在保证持续交付节奏的同时，为关键流程提供额外的审查力度。

进一步阅读：[High Assurance Rust](https://highassurance.rs/)。

### 仅崩溃设计（Crash-only design）

NautilusTrader 倡导[仅崩溃设计（crash-only design）](https://en.wikipedia.org/wiki/Crash-only_software)，该理念可概述为“停止系统的唯一方式是让它崩溃，启动系统的唯一方式是从崩溃中恢复”。此策略通过消除很少被测试的优雅关机路径的复杂性来简化状态管理并提升可靠性。

关键原则：

- **单一路径（Single code path）** — 从崩溃恢复是主要且唯一的初始化路径，确保被充分测试。
- **无优雅关机（No graceful shutdown）** — 系统不尝试那些可能失败或挂起的复杂清理操作。
- **外部化状态（Externalized state）** — 关键状态持久化到外部（数据库、消息总线），以避免崩溃导致数据丢失。
- **快速重启（Fast restart）** — 系统设计为能在崩溃后快速重启，最小化停机时间。
- **幂等操作（Idempotent operations）** — 操作设计为可安全重试。

该设计理念补充了下文的[快速失败（fail-fast）策略](#data-integrity-and-fail-fast-policy)，即在遇到不可恢复的错误（数据损坏、不变式违背）时立即终止进程，而不是在受损状态中继续运行。

**参考资料：**

- [Crash-Only Software](https://www.usenix.org/conference/hotos-ix/crash-only-software) - Candea & Fox, HotOS 2003（原始论文）
- [Microreboot—A Technique for Cheap Recovery](https://www.usenix.org/conference/osdi-04/microreboot—-technique-cheap-recovery) - Candea 等，OSDI 2004
- [The properties of crash-only software](https://brooker.co.za/blog/2012/01/22/crash-only.html) - Marc Brooker 博客
- [Crash-only software: More than meets the eye](https://lwn.net/Articles/191059/) - LWN.net 文章
- [Recovery-Oriented Computing (ROC) Project](http://roc.cs.berkeley.edu/) - 加州大学伯克利/斯坦福研究项目

### 数据完整性与快速失败（fail-fast）策略

在交易系统中，数据完整性优先于可用性。NautilusTrader 实施严格的快速失败策略，用以在算术或数据处理出现异常时阻止静默的数 据损坏，从而避免错误的交易决策。

#### 快速失败原则

当遇到下列情况时，系统会快速失败（panic 或返回错误）：

- 在时间戳、价格或数量等运算中出现算术溢出或下溢，超出有效范围。
- 反序列化过程中遇到无效数据，例如 NaN、Infinity 或超出范围的市场数据或配置值。
- 类型转换失败，例如仅应为正值的字段出现负值（时间戳、数量等）。
- 对价格、时间戳或精度值的解析出现格式错误。

理由：

在交易系统中，损坏的数据比没有数据更危险。单个错误的价格、时间戳或数量可能会在系统中蔓延，导致：

- 仓位规模或风控计算错误。
- 以错误价格下单。
- 回测结果产生误导性结论。
- 无声的财务损失。

通过在发现无效数据时立即崩溃，NautilusTrader 能确保：

1. **无静默损坏** — 无效数据不会在系统中传播。
2. **及时反馈** — 问题在开发和测试阶段被发现，而非生产环境中滞留。
3. **审计线索** — 崩溃日志能清晰地标识无效数据的来源。
4. **确定性行为** — 相同的无效输入总会导致同样的失败。

#### 何时应用快速失败

使用 panic 的场景包括：

- 程序员错误（逻辑缺陷、错误的 API 使用）。
- 违反基本不变式的数据（负时间戳、NaN 价格）。
- 会静默产生不正确结果的算术操作。

而对下列情况使用 Result 或 Option：

- 可预期的运行时失败（网络错误、文件 I/O）。
- 业务逻辑校验（订单约束、风控限制）。
- 用户输入验证。
- 向下游 crate 暴露的库 API——调用方需要显式的错误处理而非依赖 panic 作为控制流。

#### 示例场景

```rust
// 正确：溢出时 panic — 防止数据损坏
let total_ns = timestamp1 + timestamp2; // 如果结果 > u64::MAX 则 panic

// 正确：在反序列化时拒绝 NaN
let price = serde_json::from_str("NaN"); // Error: "must be finite"

// 正确：在需要时显式处理溢出
let total_ns = timestamp1.checked_add(timestamp2)?; // 返回 Option<UnixNanos>
```

该策略在核心类型（`UnixNanos`、`Price`、`Quantity` 等）中得到贯彻，确保 NautilusTrader 在生产交易中维持最高的数据正确性标准。

在生产部署中，通常会在 release 构建中配置 `panic = abort`，以确保任何 panic 都会导致进程干净地终止，从而由进程监控器或编排系统进行处理。这与[仅崩溃设计](#crash-only-design)原则一致：不可恢复的错误应立即触发重启，而非在已受损的状态下继续运行。

## 系统架构

NautilusTrader 代码库既是用于组合交易系统的框架，也是包含一组可在不同[环境上下文（environment contexts）](#environment-contexts)中运行的默认系统实现。

![Architecture](https://github.com/nautechsystems/nautilus_trader/blob/develop/assets/architecture-overview.png?raw=true "architecture")

### 核心组件

平台由若干关键组件构成，它们协同工作以提供一个完整的交易系统：

#### `NautilusKernel`

中央的编排组件，负责：

- 初始化并管理所有系统组件。
- 配置消息传递基础设施（messaging infrastructure）。
- 维护与环境相关的行为。
- 协调共享资源与生命周期管理。
- 为系统操作提供统一的入口点。

#### `MessageBus`

组件间通信的中枢，具有以下能力：

- **发布/订阅（Publish/Subscribe）模式**：用于向多个消费者广播事件和数据。
- **请求/响应（Request/Response）通信**：用于需要确认的操作。
- **命令/事件（Command/Event）消息**：用于触发动作与状态变更通知。
- **可选的状态持久化**：使用 Redis 提供持久化和重启能力。

#### `Cache`

高性能的内存存储系统，负责：

- 存储 instruments、accounts、orders、positions 等实体。
- 为交易组件提供高性能的读取能力。
- 在系统内维护一致的状态（consistent state）。
- 支持优化的读写访问模式。

#### `DataEngine`

处理并路由市场数据到系统各处：

- 处理多种数据类型（行情 quotes、成交 trades、K 线 bars、order books、定制数据等）。
- 根据订阅将数据路由到相应的消费者。
- 管理外部数据源到内部组件之间的数据流。

#### `ExecutionEngine`

管理订单生命周期和执行：

- 将交易命令路由到相应的 adapter clients。
- 跟踪订单与仓位状态。
- 与风控系统进行协调。
- 处理交易所返回的 execution reports 与 fills。
- 处理外部执行状态的对账。

#### `RiskEngine`

提供全面的风控能力：

- 交易前的风控检查与校验。
- 仓位与敞口监控。
- 实时风控计算。
- 可配置的风控规则与限制。

### 环境上下文（Environment contexts）

环境上下文定义了你正在使用的数据类型与交易场所（venue）。理解这些上下文对有效的回测、开发与实盘交易至关重要。

可用的环境包括：

- `Backtest`：历史数据，模拟交易场所。
- `Sandbox`：实时数据，模拟交易场所。
- `Live`：实时数据，真实交易场所（包含纸面交易或真实账户）。

### 公共核心（Common core）

平台在回测、沙盒与实盘系统间尽可能共享大量代码。该思想在 `system` 子包中得到形式化，在那里你会找到 `NautilusKernel` 类，它提供了一个通用的系统“kernel”。

“ports and adapters” 的架构风格使得模块化组件可以被集成到核心系统中，为用户自定义或定制组件实现提供各种钩子。

### 数据与执行流模式

理解数据与执行在系统中的流动对于有效使用平台非常重要：

#### 数据流模式

1. **外部数据摄取（External Data Ingestion）**：市场数据通过特定 venue 的 `DataClient` adapter 进入并被标准化。
2. **数据处理（Data Processing）**：`DataEngine` 负责对内部组件的数据处理。
3. **缓存（Caching）**：处理后的数据被存入高性能的 `Cache` 以便快速访问。
4. **事件发布（Event Publishing）**：数据事件被发布到 `MessageBus`。
5. **消费者分发（Consumer Delivery）**：已订阅的组件（Actors、Strategies）收到相关的数据事件。

#### 执行流模式

1. **命令生成（Command Generation）**：用户策略创建交易命令。
2. **命令发布（Command Publishing）**：通过 `MessageBus` 发送命令。
3. **风控校验（Risk Validation）**：`RiskEngine` 根据配置的风控规则校验交易命令。
4. **执行路由（Execution Routing）**：`ExecutionEngine` 将命令路由到合适的交易场所。
5. **外部提交（External Submission）**：`ExecutionClient` 向外部交易场所提交订单。
6. **事件回流（Event Flow Back）**：订单事件（成交 fills、撤单 cancellations）回流至系统。
7. **状态更新（State Updates）**：组合与仓位状态根据执行事件进行更新。

#### 组件状态管理

所有组件遵循有限状态机模式（finite state machine），并具有明确定义的状态：

- **PRE_INITIALIZED**：组件已创建但尚未与系统连接。
- **READY**：组件已配置并连接，但尚未运行。
- **RUNNING**：组件正在处理消息并执行操作。
- **STOPPED**：组件已被优雅停止，不再处理消息。
- **DEGRADED**：组件可运行但功能受限（由于错误）。
- **FAULTED**：组件遇到严重错误，无法继续运行。
- **DISPOSED**：组件已清理并释放资源。

### 消息传递（Messaging）

为了促进模块化与低耦合，高效的 `MessageBus` 在组件之间传递消息（数据、命令与事件）。

从高层架构角度理解，平台被设计为在单线程下高效运行，适用于回测与实盘。大量研究与测试表明，对于该类系统上下文，线程间上下文切换的开销并不能带来性能提升。

在考虑你的算法交易在系统边界内如何运行时，你可以期望每个组件以确定性的同步方式消费消息（类似于[Actor 模型](https://en.wikipedia.org/wiki/Actor_model)）。

:::note
值得关注的是 LMAX 的交易所架构——他们在单线程上也实现了屡获殊荣的高性能。你可以阅读 Martin Fowler 关于其基于 _disruptor_ 模式的架构的文章：[this interesting article](https://martinfowler.com/articles/lmax.html)。
:::

## 框架组织

代码库按抽象层次组织，并按照概念上内聚的子包进行分组。你可以在左侧导航中访问这些子包的文档。

### Core / 低层

- `core`：在框架中广泛使用的常量、函数和低级组件。
- `common`：用于组装框架各组件的通用部分。
- `network`：网络客户端的低级基类组件。
- `serialization`：序列化基础组件与序列化器实现。
- `model`：定义丰富的交易领域模型。

### 组件

- `accounting`：不同的账户类型和账户管理机制。
- `adapters`：平台的集成适配器（包括经纪商与交易所）。
- `analysis`：与交易绩效统计与分析相关的组件。
- `cache`：提供通用的缓存基础设施。
- `data`：平台的数据栈与数据工具。
- `execution`：平台的执行栈。
- `indicators`：一组高效的指标与分析器。
- `persistence`：数据存储、目录整理与检索，主要支持回测。
- `portfolio`：组合管理功能。
- `risk`：风控相关组件与工具。
- `trading`：交易域相关的组件与工具。

### 系统实现

- `backtest`：回测组件、回测引擎以及节点实现。
- `live`：实盘引擎与客户端实现，以及用于实盘交易的节点。
- `system`：`backtest`、`sandbox`、`live` 等[环境上下文](#environment-contexts)之间共享的核心系统 kernel。

## 代码结构

代码库的基础是 `crates` 目录，包含若干 Rust crate，其中包括由 `cbindgen` 生成的 C 外部函数接口（FFI）。

生产代码的大部分位于 `nautilus_trader` 目录，包含一系列 Python/Cython 子包与模块。

Rust 核心的 Python 绑定通过在编译时将 Rust 库静态链接到 Cython 生成的 C 扩展模块来提供（等同于扩展 CPython API）。

### 依赖流向

```graph
┌─────────────────────────┐
│                         │
│                         │
│     nautilus_trader     │
│                         │
│     Python / Cython     │
│                         │
│                         │
└────────────┬────────────┘
 C API       │
             │
             │
             │
 C API       ▼
┌─────────────────────────┐
│                         │
│                         │
│      nautilus_core      │
│                         │
│          Rust           │
│                         │
│                         │
└─────────────────────────┘
```

:::note
Rust 与 Cython 都是构建时的依赖。构建产出的二进制 wheel 在运行时并不需要 Rust 或 Cython。
:::

### 类型安全

平台设计在最高层面优先考虑软件的正确性与安全性。

`nautilus_core` 中的 Rust 代码由 `rustc` 编译器保证类型与内存安全，因此在默认情况下是“按构造正确”的（除非显式使用 `unsafe`，详见[开发者指南的 Rust 一节](../developer_guide/rust.md)）。

Cython 在 C 层面提供编译期和运行期的类型安全：

:::info
向具有类型化参数的 Cython 实现模块传入错误类型的参数时，运行时会抛出 `TypeError`。
:::

如果函数或方法的参数未显式声明接受 `None`，则传入 `None` 会在运行时引发 `ValueError`。

:::warning
为避免文档冗长，上述异常可能并未在文档中逐一列出。
:::

### 错误与异常

我们尽力准确记录 NautilusTrader 代码可能抛出的异常及其触发条件。

:::warning
仍可能存在未记录的异常，这些异常可能来自 Python 标准库或第三方依赖库。
:::

### 进程与线程

:::tip
为获得最佳性能并避免与 Python 内存模型及相等性相关的潜在问题，强烈建议将每个 trader 实例放在独立进程中运行。
:::
