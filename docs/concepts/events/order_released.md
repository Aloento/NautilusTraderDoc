# OrderReleased

`OrderReleased` 记录 `OrderEmulator` 在触发条件满足后放行了订单。模拟器把该事件应用到订单、更新 `Cache`，发布到 `MessageBus`，然后再把订单继续路由出去。

典型迁移：`EMULATED` -> `RELEASED`。处理函数：`on_order_released`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderReleased` 还携带：

| 字段             | Python 类型 | 必填/默认值 | 说明                                          |
| ---------------- | ----------- | ---------------- | ----------------------------------------------------- |
| `released_price` | `Price`     | 必填         | 使订单从模拟器放行的价格。 |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_released(self, event: OrderReleased) -> None:
    self.log.info(
        f"Order {event.client_order_id} released at {event.released_price}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [模拟订单](./../orders/emulated.md) - 本地模拟的生命周期。
