# OrderTriggered

`OrderTriggered` 记录限价类条件订单已被触发。执行流水线把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。`StopLimit`、`LimitIfTouched` 或 `TrailingStopLimit` 订单的触发可由交易场所、模拟撮合引擎或对账报告。

典型迁移：`ACCEPTED` -> `TRIGGERED`。处理函数：`on_order_triggered`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderTriggered` 还携带：

| 字段             | Python 类型              | 必填/默认值 | 说明                                          |
| ---------------- | ------------------------ | ---------------- | ------------------------------------------------ |
| `venue_order_id` | `VenueOrderId` 或 `None` | `None`           | 交易场所分配的订单标识（若已知）。   |
| `account_id`     | `AccountId` 或 `None`    | `None`           | 订单关联的账户（若已知）。 |
| `reconciliation` | `bool`                   | 必填         | 是否在一致性对账期间生成。              |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_triggered(self, event: OrderTriggered) -> None:
    self.log.info(f"Order {event.client_order_id} triggered")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
