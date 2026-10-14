# OrderInitialized

`OrderInitialized` 是新订单的种子事件，携带的信息足以把订单发送上线，并以相同属性重建它。执行流水线把订单存入 `Cache`，并把该事件发布到 `MessageBus`。

该事件既用于本地创建的订单，也用于对账期间实化（materialize）的外部订单。处理函数：`on_order_initialized`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderInitialized` 还携带：

| 字段                    | Python 类型                     | 必填/默认值 | 说明                                                |
| ----------------------- | ------------------------------- | ---------------- | --------------------------------------------------- |
| `order_side`            | `OrderSide`                     | 必填         | 订单方向。                                     |
| `order_type`            | `OrderType`                     | 必填         | 订单类型。                                     |
| `quantity`              | `Quantity`                      | 必填         | 订单数量。                                 |
| `time_in_force`         | `TimeInForce`                   | 必填         | 订单有效期类型。                            |
| `post_only`             | `bool`                          | 必填         | 是否只做提供流动性。               |
| `reduce_only`           | `bool`                          | 必填         | 是否携带只减仓指令。   |
| `quote_quantity`        | `bool`                          | 必填         | 数量是否以计价货币计价。   |
| `reconciliation`        | `bool`                          | 必填         | 事件是否在一致性对账期间生成。   |
| `price`                 | `Price` 或 `None`               | `None`           | 限价。                                    |
| `activation_price`      | `Price` 或 `None`               | `None`           | 追踪止损订单的激活价格。     |
| `trigger_price`         | `Price` 或 `None`               | `None`           | 止损触发价。                             |
| `trigger_type`          | `TriggerType` 或 `None`         | `None`           | 触发类型。                                   |
| `limit_offset`          | `Decimal` 或 `None`             | `None`           | 限价的追踪偏移。            |
| `trailing_offset`       | `Decimal` 或 `None`             | `None`           | 触发价的追踪偏移。          |
| `trailing_offset_type`  | `TrailingOffsetType` 或 `None`  | `None`           | 追踪偏移类型。                           |
| `expire_time`           | `int` 或 `None`                 | `None`           | UNIX 过期时间戳（纳秒）。       |
| `display_qty`           | `Quantity` 或 `None`            | `None`           | 在公开订单簿上展示的数量。          |
| `emulation_trigger`     | `TriggerType` 或 `None`         | `None`           | 本地模拟的市场价触发条件。       |
| `trigger_instrument_id` | `InstrumentId` 或 `None`        | `None`           | 为模拟触发提供价格的金融工具。 |
| `contingency_type`      | `ContingencyType` 或 `None`     | `None`           | 订单或有条件类型。                         |
| `order_list_id`         | `OrderListId` 或 `None`         | `None`           | 关联的订单列表 ID。                       |
| `linked_order_ids`      | `list[ClientOrderId]` 或 `None` | `None`           | 关联（linked）的客户端订单 ID 列表。                        |
| `parent_order_id`       | `ClientOrderId` 或 `None`       | `None`           | 父级客户端订单 ID。                         |
| `exec_algorithm_id`     | `ExecAlgorithmId` 或 `None`     | `None`           | 执行算法 ID。                         |
| `exec_algorithm_params` | `dict[str, str]` 或 `None`      | `None`           | 执行算法参数。                 |
| `exec_spawn_id`         | `ClientOrderId` 或 `None`       | `None`           | 派生该订单的主订单客户端 ID。               |
| `tags`                  | `list[str]` 或 `None`           | `None`           | 用户自定义标签。                                   |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_initialized(self, event: OrderInitialized) -> None:
    self.log.info(
        f"Initialized {event.order_type} {event.order_side} {event.quantity} {event.instrument_id}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
