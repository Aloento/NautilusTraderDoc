# OrderSubmitted

`OrderSubmitted` 记录系统已向交易场所发送订单、正在等待确认。`ExecutionEngine` 把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。

典型迁移：`INITIALIZED` / `RELEASED` -> `SUBMITTED`。处理函数：`on_order_submitted`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderSubmitted` 还携带：

| 字段         | Python 类型 | 必填/默认值 | 说明                           |
| ------------ | ----------- | ---------------- | -------------------------------------- |
| `account_id` | `AccountId` | 必填         | 订单关联的账户。 |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_submitted(self, event: OrderSubmitted) -> None:
    self.log.info(f"Order {event.client_order_id} submitted ({event.account_id})")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
