# Python

NautilusTrader 通过 PyO3 在 Rust 核心之上提供 Python 控制面。本指南说明系统的各个部分由哪个运行时负责，以及 Python 代码在哪里执行，并指出哪些 Python 接口构成受支持的公共契约。

原生 Rust 应用请参阅 [Rust](./rust.md)。安装方式与支持的 Python 版本见 [Installation](./../getting_started/installation.md)。

## 运行时模型 {#runtime-model}

Python 包将 `nautilus_trader` 下的 Python 门面（facade）与编译好的 `nautilus_trader._libnautilus` 扩展组合在一起。预编译的 wheel 已包含该扩展，运行时无需 Rust 工具链。

| 层级               | 职责                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Python 应用        | 配置、组装、用户组件、分析，以及与 Python 服务的集成。                                   |
| PyO3 绑定          | 类型转换、参数校验、异常处理，以及 Rust 状态的防所有权问题包装。                         |
| Rust 核心          | 领域类型、引擎、节点、缓存、投资组合、消息总线、适配器和持久化。                         |

`Cache`、`Portfolio` 等 Python 对象是 Rust 所有状态的包装。节点和引擎将内部运行时对象保持私有，只暴露有限的检查与控制方法。这样既保证状态只有一个来源，又允许 Python 代码配置系统并检查结果。

## 用户组件 {#user-components}

Python 用户组件继承公共 PyO3 基类，并重写其文档化的回调：

| 组件                 | 用途                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| `DataActor`          | 订阅数据、处理事件、运行非交易工作流。                                      |
| `Strategy`           | 实现交易决策并提交订单。                                                    |
| `ExecutionAlgorithm` | 通过执行引擎拆分或调度已路由的订单。                                        |
| `Controller`         | 通过 `ImportableControllerConfig` 创建并管理 actor 和策略。                 |

应用代码构造配置、注册官方适配器工厂，并把组件加入 `BacktestNode`、`BacktestEngine` 或 `LiveNode`。路由、引擎状态、订单管理、核算和场所客户端仍由 Rust 负责。

回调在事件处理线程上**同步**执行，必须尽快返回。阻塞 I/O、模型推理或长时计算会拖慢行情数据处理和订单执行。这类工作应卸载到 executor 或其他进程。实时交易的规则见
[配置实时交易节点](./../how_to/configure_live_trading.md)。

## 异步执行 {#async-execution}

Rust 适配器的网络请求运行在 Tokio 上。Python 异步库运行在 asyncio 事件循环上。PyO3 不会把 Python 协程变成 Tokio 任务。

`LiveNode` 支持两种执行模式：

| 方法          | 执行上下文               | 信号归属     | 完成条件                                                    |
| ------------- | ------------------------ | ------------ | ----------------------------------------------------------- |
| `run()`       | 调用线程，阻塞           | `LiveNode`   | 协调关闭（coordinated shutdown）结束后返回。                |
| `run_async()` | Python 宿主事件循环      | 宿主应用     | 同一协调关闭路径结束后 resolve。                            |

`run_async()` 让 asyncio 或 ASGI 应用在现有事件循环上托管节点。它驱动与 `run()` 相同的 Rust 生命周期，并把 `SIGINT` 和 `SIGTERM` 的处理留给宿主。

兼容性已用默认 asyncio 事件循环、uvloop 以及由 Uvicorn 管理的 ASGI lifespan 测试过。Python wheel 不安装 uvloop 或 Uvicorn，应用需自带所选的事件循环和服务器。若 ASGI 应用的 lifespan 会构造节点，必须以单 worker 运行且禁用热重载。

托管运行的步骤：

1. 在启动 `run_async()` 之前保存 `node.cache`、`node.portfolio` 和 `node.handle()`。协程在结束前持有节点的所有权，而保存下来的对象仍可使用。
1. 等 handle 报告 `Running` 后再宣告启动完成。任务存活期间持续监督该运行任务，任务意外结束时将服务置为失败。
1. 通过 `LiveNodeHandle.stop()` 停止，然后 await 运行任务以完成关闭。取消请求会先触发同样的优雅关闭，再向外传播。
1. 任务结束后调用 `node.dispose()`，释放节点资源。

生命周期、取消、公平性和缓存支撑（cache-backing）契约见 [托管事件循环](./live.md#hosted-event-loops)。

## 公共 API 契约 {#public-api-contract}

`python/nautilus_trader/` 下生成的类型存根（type stub）定义了受支持的、绑定 Rust 的 Python 接口面。它们记录了 Rust 绑定源码中的公共类、方法、属性、参数和返回类型。[Python API 参考](./../api_reference/index.md) 渲染的是同一批公共模块及其文档。

若 Rust 绑定类上存在某个运行时属性，但生成的存根中没有，该属性不属于受支持的契约。文档化的 Python 客户端、提供商（provider）和可导入配置类同样构成公共接口。PyO3 在 Rust 代码运行前校验绑定参数，并把可失败操作映射为 Python 异常。代码应处理文档中说明的异常类型，而不是依赖 Rust 内部错误表示。

生成的存根是源码派生产物。绑定变更应修改 Rust 源码并重新生成存根，签入的 `.pyi` 文件不是独立的 API 定义。

:::warning[Side 枚举兼容别名]
`OrderSide.NO_ORDER_SIDE` 和 `PositionSide.NO_POSITION_SIDE` 仍作为 `None` 的兼容别名保留。它们不是枚举成员，未来版本可能移除。可选的方向值请使用 `None`。
:::

## 所有权与生命周期 {#ownership-and-lifecycle}

节点边界处仍能看到 Rust 的所有权语义：

- `BacktestNode` 将引擎保持为内部对象。要在运行后保留引擎，设置 `dispose_on_completion=False`，再通过节点的缓存、投资组合、统计和报告方法检查它。
- `LiveNode.run_async()` 把节点出借给其协程。运行期间通过节点访问状态会抛异常，但 `is_running` 和 `handle()` 仍可用。运行期间调用 `dispose()` 是空操作，不是延迟请求；运行结束后需再次调用。运行前保存的对象在那之前保持可用。
- 同一进程内并发运行多个 `LiveNode` 或 `BacktestNode` 实例不受支持，因为它们的运行时状态没有隔离。先 dispose 一个节点再启动下一个，或使用多个进程并行执行。在同一线程上构造替代的 `LiveNode` 之前，还要释放对旧节点的全部引用。只有一个引用时，在下一次构建前执行 `del node`。直接给变量重新赋值会先构造新节点、后释放旧节点。

这些边界防止 Python 引用暴露可变的引擎内部状态，或为同一份运行时状态制造多个所有者。

## 支持边界 {#support-boundaries}

官方适配器以 Rust 实现，并通过 `nautilus_trader.adapters` 下的 Python 配置、工厂、客户端和数据类型暴露。各自的集成指南定义了受支持的场所能力。

自定义实时适配器继承 Python 客户端基类，并通过 `LiveNodeBuilder` 或 `LiveNode.build` 注册。其异步工作在节点绑定的 Python 事件循环上运行，拿到的是只读缓存视图，并通过队列输出发送类型化数据、事件和报告。

独立的 Rust/PyO3 包可以使用同一套 Python 协议，配合已安装 wheel 中的模型对象。受支持的钩子、工厂/配置契约、生命周期规则和 v1 迁移限制见 [Python 适配器接口](./../developer_guide/python_adapters.md)。

## 选择 Python 还是 Rust {#choosing-python-or-rust}

看重应用组装、策略快速开发、分析工具或与 Python 生态集成时，用 Python。应用必须在没有 Python 运行时的情况下运行，或需要原生 trait 和 crate 级的直接控制时，用 Rust。

两条路径使用同一套 Rust 领域模型和引擎。[Rust 能力矩阵](./rust.md#capability-matrix) 列出各组件和官方适配器分别通过哪条路径暴露。

## 相关指南 {#related-guides}

- [架构](./architecture.md) - 核心组件、线程与依赖流。
- [Rust](./rust.md) - 原生 Rust API 与运行时用法。
- [实时交易](./live.md) - LiveNode 生命周期与托管事件循环。
- [回测](./backtesting/index.md) - 回测引擎、节点、数据与交易场所。
- [适配器](./adapters.md) - 官方适配器配置与路由。
- [Migration from v1](https://github.com/nautechsystems/nautilus_trader/blob/develop/MIGRATION_V2.md) - Python API 变更与迁移边界。
