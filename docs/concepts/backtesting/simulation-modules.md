# 模拟模块

模拟模块有枚举和共享句柄两种形式，在
[行为模型设计](./../behavioral_models.md)中说明。配置边界决定存储哪种形式：

| 边界                                           | 存储形式                 | 接受的实现                            |
| ---------------------------------------------- | ------------------------ | ------------------------------------- |
| 声明式 `BacktestVenueConfig`              | `SimulationModuleAny`    | 内置模块与语言桥接。       |
| `SimulatedVenueConfig` 与 `SimulatedExchange` | `SimulationModuleHandle` | 任意已链接的 Rust trait 实现。 |

:::warning[模块共享状态]
`SimulationModuleHandle` 持有 `Rc<dyn SimulationModule>`，克隆句柄会共享该模块及其状态。克隆内置枚举值会复制其状态；克隆 Python 桥接则共享同一个 Python 对象。因此需要隔离状态的场所或运行，必须使用各自独立的模块实例，包括**不同的 Python 对象**。
:::

## 生命周期 {#lifecycle}

交易所让每个模块经历如下生命周期：

1. 交易所处理每个支持的市场数据项之前，先运行 `pre_process`。
1. 该时间戳的命令结算完成后，按顺序对同一份只读交易所快照逐个运行每个模块的 `process`。遇到第一个失败即停止处理，交易所不施加该时间戳的任何调整。
1. 按顺序对每个已完成的结果，交易所以其批次作为有序的 `Money` 调整施加，随后对该模块恰好调用一次 `acknowledge` 并传入对应结果——空批次也不例外。

## 失败处理 {#failure-handling}

- **生命周期失败**：`pre_process`、`process`、`acknowledge` 或 `reset` 的失败会让交易所停留在错误状态，直到所有模块成功重置。这防止一次失败的 acknowledge 重放账户可能已包含的调整。
- **诊断失败**：随模块索引和钩子名返回给引擎，不改变交易所的错误状态。

## Python 模块 {#python-modules}

Python `SimulationModule` 子类的 `process` 钩子收到一份拥有的
`SimulationModuleContext` 快照，包含：

- 交易场所。
- 可选的基础货币。
- 金融工具。
- 订单簿。
- 未平持仓。

桥接不暴露可变的缓存或撮合引擎状态。Python 异常在穿过交易所和 `BacktestEngine.run` 传播时保留钩子名。

## 已链接的原生类型 {#linked-native-types}

已链接的原生 PyO3 类型可以为其 Python 类注册提取器（extractor）。提取器为命令式的 `BacktestEngine.add_venue`
配置解析对象。Python 配置按以下方式解析模块：

| 配置路径                   | 接受的对象                                           | 存储形式                 | 原生提取器行为             |
| -------------------------- | ----------------------------------------------------- | ------------------------ | -------------------------- |
| `BacktestEngine.add_venue` | 内置模块、已链接原生类型、Python 子类 | `SimulationModuleHandle` | 匹配确切类型。    |
| `BacktestVenueConfig`      | 内置模块与 Python 子类                       | `SimulationModuleAny`    | 不查询注册表。 |

无关的同名类不会命中已注册的提取器。注册提取器不会在 `cdylib` 边界上为 trait 对象创建运行时 ABI。

## 内置模块 {#built-in-modules}

内置的外汇展期和 CFD swap 模块使用"完成批次后 acknowledge"的流程。

CFD swap 费率按工具配置，是带符号的日 `Decimal` 分数（相对结算名义额），多空各一个值。UTC 展期时刻和三倍展期日（triple-roll weekday）可配置。单币种账户下，模块按缓存的中间价汇率把调整换算为账户基础货币。

以下任一输入缺失时，CFD swap 模块推迟整个批次：

- 匹配的撮合引擎。
- 结算价。
- 汇率。

模块对每个记账日、工具和失败类型先记录一条警告，之后的重试保持更安静。

永续资金费始终属于 `SimulatedExchange` 的一部分，不是模拟模块。
