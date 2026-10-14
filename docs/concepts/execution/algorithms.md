# 执行算法

`ExecutionAlgorithm` 接收按 `exec_algorithm_id` 选中的主订单，并可将其拆分为更小的派生订单。NautilusTrader 支持自定义算法，并内置原生 Rust 实现的 TWAP。本页介绍如何配置 TWAP、编写算法以及管理派生订单。

组件与路由模型见[执行](./index.md#execution-flow)。

## TWAP（时间加权平均价格） {#twap-time-weighted-average-price}

TWAP 把主订单摊到固定间隔上，减少一次性提交全部数量的市场冲击。向已初始化的 `BacktestEngine` 注册原生算法：

```python
from nautilus_trader.model import ExecAlgorithmId
from nautilus_trader.config import ExecutionAlgorithmConfig

engine.add_native_exec_algorithm(
    "TwapAlgorithm",
    ExecutionAlgorithmConfig(exec_algorithm_id=ExecAlgorithmId("TWAP")),
)
```

路由到 TWAP 的订单需要以下字符串值的 `exec_algorithm_params`：

| 键              | 含义                                                    |
| --------------- | ------------------------------------------------------- |
| `horizon_secs`  | 与 interval 配合确定拆分片数的执行期限。 |
| `interval_secs` | 各片之间的时间间隔。                                    |

两个值都必须能解析为正数，且 `horizon_secs` 不小于 `interval_secs`。算法立即提交第一片，其余各片按配置的间隔提交。

订单类型、金融工具或时间表不受支持或非法时，TWAP 在提交前拒绝主订单。

## 自定义执行算法 {#custom-execution-algorithms}

定义 Python 执行算法：继承 `ExecutionAlgorithm` 并实现
`on_order(...)`：

```python
from nautilus_trader.model import ExecAlgorithmId
from nautilus_trader.trading import ExecutionAlgorithm
from nautilus_trader.config import ExecutionAlgorithmConfig


class MyExecutionAlgorithm(ExecutionAlgorithm):
    def __init__(self) -> None:
        super().__init__(
            ExecutionAlgorithmConfig(exec_algorithm_id=ExecAlgorithmId("MY-ALGO")),
        )

    def on_order(self, order) -> None: ...
```

Python 执行算法可以访问 cache 和 portfolio，有用于定时器的时钟、信号，以及派生订单的方法。

注册之后，消息总线把订单路由给 `ExecAlgorithmId` 与订单 `exec_algorithm_id` 匹配的算法。可选的 `exec_algorithm_params` 字段是 `Mapping[str, str]`。要按整体处理订单列表，覆写
`on_order_list(...)`；其默认实现把每个订单分别传给 `on_order(...)`。

执行订单前，先校验 `exec_algorithm_params` 中必需的键并解析其字符串值。订单无法执行时，调用 `deny_order(...)` 并传入标准化的
[原因代码](./index.md#order-denied-reasons)，例如
`VALIDATION_FAILED: horizon_secs not found in exec_algorithm_params`。

执行算法收到的订单称为**主订单**（primary order）。用这些方法创建**派生订单**（spawned orders）：

- `spawn_market(...)`：创建 `MARKET` 订单。
- `spawn_market_to_limit(...)`：创建 `MARKET_TO_LIMIT` 订单。
- `spawn_limit(...)`：创建 `LIMIT` 订单。

每个方法都以主订单为第一个参数。默认会把主订单数量减去派生的 `quantity`。传入 `reduce_primary=False` 可保持主订单数量不变。

:::warning
`reduce_primary=True` 时，派生数量不得超过主订单的 `leaves_qty`
（剩余未成交量）。
:::

主订单仍在本地期间，派生订单的结果按如下方式影响其数量：

- **未成交部分**：派生订单可能在提交前被拒绝、驳回、撤销、过期或不受理。这些情况下，其未成交部分按主订单的数量单位返还到主订单数量中。场所把按计价货币的派生单换算为基础货币数量时同样适用。
- **迟到成交**：已撤销派生单上迟到的成交，会在主订单仍可本地修改时重新扣除相应已返还的数量。若该数量已被后来的派生单复用，超出部分改从那次派生单自身的返还额中净额扣除。

主订单一旦交接提交，其数量即已定，不再因后续派生结果而改变。

换算过计价货币的派生单，其剩余未成交量由累计成交推算，并向下去整到主订单的数量精度。总扣减额不依赖于已成交量由多少笔成交事件上报。

若任何派生单的未成交量已返还之后其[成交被作废](./../events/order_fill_voided.md)，且主订单仍在本地，更正会把额外的未成交量返还回来，并优先抵扣此前迟到成交无法从主订单扣除的部分。

执行算法可以持续派生订单、提交剩余的主订单，或两者兼做。内置 TWAP 在最后一个间隔提交剩余的主订单。

## 派生订单 {#spawned-orders}

每个派生订单把 `exec_spawn_id` 设为主订单的 `client_order_id`。其自身的 `client_order_id`
遵循此格式：

```text
{exec_spawn_id}-E{spawn_sequence}
```

例如，从 `O-20230404-001-000` 派生的第一个订单 ID 为
`O-20230404-001-000-E1`。

:::note
primary（主订单）与 spawned（派生订单）这组术语，用于把执行拆分与父子或有订单关系区分开。
:::

## 执行算法的订单查询 {#execution-algorithm-order-queries}

`Cache` 提供两个主要查询：

- `orders_for_exec_algorithm(...)`：返回某算法的订单，可按场所、工具、策略、账户与方向过滤。
- `orders_for_exec_spawn(...)`：按主订单 `ClientOrderId` 返回主订单及其全部派生订单。

## 相关指南 {#related-guides}

- [执行](./index.md)：组件路由、OMS 行为、风控检查与命令结果。
- [执行策略](./policies.md)：订单状态与命令投递边界。
- [订单](./../orders/index.md)：订单类型、指令与状态迁移。
