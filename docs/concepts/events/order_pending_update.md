# OrderPendingUpdate

`OrderPendingUpdate` 记录系统已向交易场所发出 `ModifyOrder` 请求、正在等待确认。`ExecutionEngine` 把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。

典型迁移：`ACCEPTED` -> `PENDING_UPDATE`。处理函数：`on_order_pending_update`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderPendingUpdate` 还携带：

| 字段             | Python 类型              | 必填/默认值 | 说明                                          |
| ---------------- | ------------------------ | ---------------- | ------------------------------------------------ |
| `venue_order_id` | `VenueOrderId` 或 `None` | `None`           | 交易场所分配的订单标识（若已知）。   |
| `account_id`     | `AccountId` 或 `None`    | 必填         | 订单关联的账户（若已知）。 |
| `reconciliation` | `bool`                   | 必填         | 是否在一致性对账期间生成。              |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_pending_update(self, event: OrderPendingUpdate) -> None:
    self.log.info(f"Modify pending for {event.client_order_id}")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
