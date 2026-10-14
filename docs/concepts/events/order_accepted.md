# OrderAccepted

`OrderAccepted` 记录交易场所确认订单已接收且合法（通常对应 FIX 的 `NEW` OrdStatus）。`ExecutionEngine` 把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。

典型迁移：`SUBMITTED` -> `ACCEPTED`。处理函数：`on_order_accepted`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderAccepted` 还携带：

| 字段             | Python 类型    | 必填/默认值 | 说明                                |
| ---------------- | -------------- | ---------------- | -------------------------------------- |
| `venue_order_id` | `VenueOrderId` | 必填         | 交易场所分配的订单标识。   |
| `account_id`     | `AccountId`    | 必填         | 订单关联的账户。 |
| `reconciliation` | `bool`         | 必填         | 是否在一致性对账（reconciliation）期间生成。    |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_accepted(self, event: OrderAccepted) -> None:
    self.log.info(
        f"Order {event.client_order_id} accepted as {event.venue_order_id}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
