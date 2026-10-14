# 行为模型 {#behavioral-models}

本页介绍可插拔模型，它们用于修改或扩展 NautilusTrader 的行为。

**行为模型**为系统做出的某项具体计算或决策提供规则。例如，成交模型决定模拟成交的资格与流动性，
费用模型计算成交的手续费。引擎通过既定接口调用所配置的模型，
因此用户无需修改引擎或策略即可更换这些规则。

模型以对象形式在配置中提供，或通过运行时 API 提供。用户可以选择内置实现并配置其参数；
若模型族与 API 支持，也可以提供自定义实现。这里的可插拔，指用户通过这些接口替换行为。
[native 库的运行时加载](#native-extension-boundary)则是另一种独立能力。

## 模型族 {#model-families}

| 模型族  | 控制内容                                                                             | 内置示例                                             |
| ------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| 成交    | 模拟限价成交资格、滑点，以及可选的合成流动性。        | `DefaultFillModel`、`BestPriceFillModel`、`TwoTierFillModel`。 |
| 费用    | 基于订单、成交、金融工具及可选定价上下文计算的手续费。 | `MakerTakerFeeModel`、`FixedFeeModel`、`PerContractFeeModel`。 |
| 延迟    | 模拟订单提交、修改、撤单的延迟。               | `StaticLatencyModel`。                                         |
| 保证金  | 订单初始保证金与持仓维持保证金。                                | `StandardMarginModel`、`LeveragedMarginModel`。                |

成交模型的范围从使用记录的订单簿，到提供具备分层、部分成交、规模感知、竞争感知、成交量敏感或交易时段特性的合成流动性。
完整的内置列表以及订单簿类型对成交模拟的影响，见[成交模型](./backtesting/fill-models.md)。

费用模型还包含 `ProbabilityPriceFeeModel`、`CappedOptionFeeModel` 和 `TieredNotionalOptionFeeModel`，
用于概率定价工具与期权费率表。

`StaticLatencyModel` 会在分别配置的插入、更新、撤单延迟之上叠加一个基础延迟。[保证金模型](./backtesting/accounts-and-margin.md#margin-models)
决定工具的保证金要求是否按账户杠杆折算。

成交模型与延迟模型控制的是模拟执行，它们不决定实时交易场所是否会成交订单、何时成交。
模型行为作用于消费它的引擎或账户边界。更换模型不会取代订单状态校验、执行路由或运行时的其余部分。

## 模拟模块 {#simulation-modules}

[模拟模块](./backtesting/simulation-modules.md)为模拟交易所整个生命周期的行为提供了相关的扩展点。
模块不回答成交、费用、延迟或保证金的计算问题，而是处理交易所状态并返回账户调整。
内置的外汇隔夜利息展期（rollover）模块和 CFD swap 模块都使用了这一接口。
自定义模块可以沿用同一套生命周期与确认（acknowledgement）约定来扩展模拟行为。

## 提供实现 {#supplying-implementations}

Rust 调用方可以实现模型族的 trait，并通过对应的运行时句柄（handle）传入实现。
Python 的支持情况**同时取决于模型族和配置 API**：

| 模型族  | 从 Python 经 `BacktestVenueConfig` 使用                    | 从 Python 经 `BacktestEngine.add_venue()` 使用             |
| ------- | ---------------------------------------------------- | ---------------------------------------------------- |
| 成交    | 内置模型对象。                              | 内置模型或自定义 Python 成交模型对象。 |
| 费用    | 内置模型或自定义 Python 手续费对象。 | 内置模型或自定义 Python 手续费对象。 |
| 延迟    | `StaticLatencyModel`。                                | `StaticLatencyModel`。                                |
| 保证金  | `StandardMarginModel` 或 `LeveragedMarginModel`。     | `StandardMarginModel` 或 `LeveragedMarginModel`。     |

自定义 Python 成交模型实现 [fill-model 协议](./backtesting/fill-models.md#configuration)。
自定义 Python 费用模型需提供 `get_commission`；当计算需要标的价格时，
还可以提供 `get_commission_with_context`。引擎在需要相应决策或计算时调用这些方法。

## 模型族结构 {#model-family-structure}

行为模型族在模拟与执行中使用统一的表示方式：

- Rust 的 `<Family>Model` trait 定义行为契约。
- 具体 Rust 类型实现内置模型。
- `<Family>ModelAny` 枚举列出核心内置模型及需要枚举存储的语言桥接变体，再通过显式的枚举分发实现该 trait。
- `<Family>ModelHandle` 保存一个共享 trait object，供运行时组件接收枚举变体之外的、已链接的 Rust 实现。

受支持的内置具体类型以 PyO3 类暴露，其
[类型存根注解](./../developer_guide/rust.md#type-stub-annotations)为
[生成的 Python 产物](./../developer_guide/rust.md#generated-python-artifacts)提供支撑。回测配置直接接收
这些具体模型对象，而不使用单独的模型配置与工厂包装。

当核心枚举变体会造成反向依赖时，适配器专属的模型放在其适配器 crate 中。
底层 Rust 代码通过对应句柄传递这些模型。

Python 侧对模型族的使用采用显式桥接。依存储边界不同，桥接形式是枚举变体，或经句柄传入的 trait 实现。
延迟与保证金配置从 Python 只能接受内置模型。

## 分发边界 {#dispatch-boundary}

| 形式                     | 接受的实现               | 分发方式     | 角色                                          |
| ------------------------ | -------------------------------------- | ------------ | --------------------------------------------- |
| 具体类型或泛型 | 单一具体实现            | 静态       | 模型内部与特化调用方。      |
| `<Family>ModelAny`       | 已声明的内置模型与桥接变体 | 枚举匹配   | 内置与桥接的配置或存储。 |
| `<Family>ModelHandle`    | 任意受接受的 Rust trait 实现 | trait object | 共享运行时存储与自定义类型。      |

`<Family>ModelAny` 使用枚举分发。`<Family>ModelHandle` 通过 trait object 动态分发，
因此内置模型从枚举转换为句柄后，其枚举匹配之前会先经过一次 vtable。
在需要避免 trait object 分发的地方，仅存内置模型的存储仍保持 `<Family>ModelAny` 类型。

句柄没有单独的内置快速路径。句柄采用这种更单一的表示，是因为没有任何实测性能场景
值得为此增加额外的变体和分发复杂度。

## 原生扩展边界 {#native-extension-boundary}

开源的[插件 crate](./../developer_guide/plugins.md)定义了产物 ABI，但模型注册与加载宿主并不在本仓库内。
开源发行版不提供运行时的原生模型插件。原生模型在编译期组合，并通过对应的枚举或句柄传入。

[模拟模块](./backtesting/simulation-modules.md)在回测配置与运行时边界上使用这些表示方式。
