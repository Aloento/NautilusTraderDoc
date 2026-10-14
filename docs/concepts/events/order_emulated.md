# OrderEmulated

`OrderEmulated` 记录 `OrderEmulator` 已把订单纳入本地模拟。模拟器把该事件应用到订单、更新 `Cache`，并发布到 `MessageBus`。

典型迁移：`INITIALIZED` -> `EMULATED`。处理函数：`on_order_emulated`。

## 字段 {#fields}

`OrderEmulated` 只暴露
[Python 订单事件公共字段](./index.md#common-python-order-event-fields)。

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_emulated(self, event: OrderEmulated) -> None:
    self.log.info(f"Order {event.client_order_id} is now emulated locally")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [模拟订单](./../orders/emulated.md) - 本地模拟的生命周期。
