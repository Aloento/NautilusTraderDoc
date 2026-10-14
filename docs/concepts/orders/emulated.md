# 仿真订单 {#emulated-orders}

即使交易场所不原生支持某些订单类型，仿真（emulation）机制也能让你使用它们。

`OrderEmulator` 监控 `emulation_trigger` 选定的行情数据。当本地订单满足其释放条件时，仿真器把它
转换成 `MARKET` 或 `LIMIT` 订单，并路由到配置的执行算法或执行引擎。例如，仿真 `STOP_LIMIT`
在止损价触发后会变成一个 `LIMIT` 订单。

## 提交订单进行仿真 {#submitting-an-order-for-emulation}

**支持的触发器**：在订单构造函数或 `OrderFactory` 方法上设置 `emulation_trigger`。
本地仿真器接受以下取值。

| 触发器类型   | 使用的行情数据                             |
| ------------ | -------------------------------------------------- |
| `DEFAULT`    | 报价，本地行为与 `BID_ASK` 相同。                  |
| `BID_ASK`    | 最优买价和卖价报价。                               |
| `LAST_PRICE` | 成交数据。                                         |

`emulation_trigger` 保持 `None` 时不进行本地仿真，订单走常规路径提交。

其他 `TriggerType` 值描述的是某些交易场所支持的触发方法，但本地 `OrderEmulator` 不接受它们作为
`emulation_trigger` 取值。

:::warning
订单以其他任何 `emulation_trigger` 值提交时，仿真器会将其取消，并把不支持的触发器类型记为
错误日志。
:::

**触发行为**：仿真行为取决于所选的触发器类型。

- 对止损订单，仿真器将触发价与选定的行情数据比较。
- 对跟踪止损订单，用该行情数据更新跟踪触发价。
- 对仿真 `LIMIT` 订单，将限价与该行情数据比较，匹配时释放一个 `MARKET` 订单。

**缓存数据**：仿真器会为触发工具创建匹配的撮合核心。第一个订单的 `emulation_trigger` 决定了
用于初始化该核心的缓存行情数据类型。

- `DEFAULT` 和 `BID_ASK` 使用最新缓存报价的买价和卖价。
- `LAST_PRICE` 使用最新缓存成交价。

符合条件的订单若与该数据匹配，会在提交时直接释放，**不会产生 `OrderEmulated` 事件**。若所选
数据源没有缓存数据，订单会保持仿真状态，直到匹配的行情数据到达。

## 技术细节 {#technical-details}

所有[环境上下文](./../architecture.md#environment-contexts)中，受支持的仿真订单类型都由同一个
`OrderEmulator` 组件管理。

:::note
NautilusTrader 不为仿真订单设置固定的数量上限。实际限制来自可用内存和行情数据的处理成本。
:::

## 生命周期 {#lifecycle}

**生命周期**：仿真订单依次经历以下阶段。

1. `Strategy` 通过 `submit_order` 提交订单，订单被路由到 `OrderEmulator`。
1. `OrderEmulator` 检查是否可立即释放。若不匹配，则在本地持有并监控该订单。
1. 对持有的订单，匹配的行情更新会将其转换为 `MARKET` 或 `LIMIT` 订单，并在所需价格可用时释放。
1. 若设置了 `exec_algorithm_id`，仿真器将释放的订单路由到 `ExecutionAlgorithm`，否则路由到
   `ExecutionEngine`。

:::warning[仿真不保证交易前风险检查]
策略提交直接进入 `OrderEmulator`。直接释放的订单不经过 `RiskEngine` 的命令检查就送达
`ExecutionEngine`。风险引擎会收到 `OrderReleased` 事件用于日志记录，但不做校验。执行算法的
`submit_order` 方法会将其提交经风险引擎检查后再执行。不要仅依赖仿真来强制执行交易前风险限额。
:::

:::note
策略可以修改或取消仿真订单，cancel-all 请求也包含它们。
:::

:::info
仿真订单在转换时保留其客户端订单 ID，缓存查询继续使用同一个 ID。
:::

### 持有中的仿真订单 {#held-emulated-orders}

**持有期间**：`OrderEmulator` 持有订单期间执行以下操作。

- 缓存原始的 `SubmitOrder` 命令。
- 在本地撮合核心中处理该订单。
- 若尚无匹配的订阅，订阅所需的报价或成交数据。
- 在释放或取消之前，接受策略修改和行情驱动的更新。

### 已释放的仿真订单 {#released-emulated-orders}

**释放序列**：行情数据与仿真订单匹配时，释放过程依次执行以下操作。

1. 通过再一次 `OrderInitialized` 事件将订单转换为 `MARKET` 或 `LIMIT` 订单。这会把
   `emulation_trigger` 置为 `None`，各组件不再把该订单视为仿真订单。
1. 更新原始的 `SubmitOrder` 命令，使其描述转换后的订单。
1. 将该命令发送到配置的 `ExecutionAlgorithm`，没有配置则发送到 `ExecutionEngine`。执行引擎会把
   合格的订单路由给 `ExecutionClient`。

## 可仿真的订单类型 {#order-types-that-can-be-emulated}

**释放类型**：释放后的类型取决于原始的仿真订单类型。

| 用于仿真的订单类型           | 可否仿真 | 释放类型      |
| ------------------------ | ----------- | ------------- |
| `MARKET`                 | -           | N/A           |
| `MARKET_TO_LIMIT`        | -           | N/A           |
| `LIMIT`                  | ✓           | `MARKET`      |
| `STOP_MARKET`            | ✓           | `MARKET`      |
| `STOP_LIMIT`             | ✓           | `LIMIT`       |
| `MARKET_IF_TOUCHED`      | ✓           | `MARKET`      |
| `LIMIT_IF_TOUCHED`       | ✓           | `LIMIT`       |
| `TRAILING_STOP_MARKET`   | ✓           | `MARKET`      |
| `TRAILING_STOP_LIMIT`    | ✓           | `LIMIT`       |

释放为 `MARKET` 时保留原有效期，唯一的例外是 `GTD` 会变成 `GTC`，因为市价订单不支持 `GTD`。

:::warning
不带限价提交的仿真 `TRAILING_STOP_LIMIT`，其限价来自跟踪计算。若订单在计算成功前就触发，
仿真器记录警告并让订单保持仿真状态。一旦行情更新使计算能得出限价，下一次匹配的更新即释放订单。

例如，`LAST_OR_BID_ASK` 触发类型需要最新成交价。而 `BID_ASK` 仿真触发器只让仿真器订阅报价。
因此订单会一直保持持有，直到成交数据进入缓存（例如来自策略的成交订阅）。
:::

## 查询 {#querying}

用缓存或订单对象查询仿真状态。

### 通过缓存查询 {#through-the-cache}

**缓存方法**：`Cache` 提供以下方法。

- `self.cache.orders_emulated(...)` 返回匹配其过滤条件的所有仿真订单。
- `self.cache.is_order_emulated(...)` 检查单个客户端订单 ID。
- `self.cache.orders_emulated_count(...)` 返回匹配的仿真订单数量。

更多细节见完整的 [API 参考](https://nautilustrader.io/docs/python-api-latest/cache.html)。

### 直接查询订单对象 {#direct-order-queries}

用 `order.is_emulated` 直接查询订单对象。值为 `False` 表示订单已释放，或从未被仿真。

:::warning
不要本地持有仿真订单的引用。仿真订单被*释放*时，订单对象会发生转换。请改用 `Cache`。
:::

## 持久化与恢复 {#persistence-and-recovery}

启动时，`OrderEmulator` 会重新激活配置的目标缓存数据库恢复到缓存中的仿真订单，使其状态跨重启保留。

## 最佳实践 {#best-practices}

**最佳实践**：处理仿真订单时遵循以下规则。

- 查询 `Cache`，不要存储本地订单引用。
- 注意订单类型会在释放时改变。
- 处理已释放订单执行路径上的拒绝与拒单。

## 相关指南 {#related-guides}

- [订单](./index.md) - 订单概念、执行指令与订单工厂。
- [高级订单](./advanced.md) - 订单列表、或有类型与括号订单。
- [策略](./../strategies.md) - 从策略管理订单。
