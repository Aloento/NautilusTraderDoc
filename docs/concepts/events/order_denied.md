# OrderDenied

`OrderDenied` 记录 Nautilus 系统无法提交一笔本身合法的订单，例如触发风控限额或功能不支持。执行流水线把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。

风控引擎、执行引擎、执行算法和执行客户端都可能拒绝订单。

典型迁移：`INITIALIZED` -> `DENIED`。处理函数：`on_order_denied`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderDenied` 还携带：

| 字段     | Python 类型 | 必填/默认值 | 说明                                                          |
| -------- | ----------- | ---------------- | ------------------------------------------------------------------------ |
| `reason` | `str`       | 必填         | 标准化的拒绝原因代码，可带诊断性后缀。 |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_denied(self, event: OrderDenied) -> None:
    self.log.warning(f"Order {event.client_order_id} denied: {event.reason}")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [执行](./../execution/index.md) - 风控检查与交易前流水线。
- [订单拒绝原因](./../execution/index.md#order-denied-reasons) - 标准化代码集与消息形式。
- [订单](./../orders/index.md) - 订单类型与状态机。
