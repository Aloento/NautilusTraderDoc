# OrderModifyRejected

`OrderModifyRejected` 记录 `ModifyOrder` 命令被拒绝。`ExecutionEngine` 把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。拒绝请求的可能是交易场所、模拟撮合引擎或本地风控。

典型迁移：`PENDING_UPDATE` -> 原状态（例如 `ACCEPTED`）。处理函数：
`on_order_modify_rejected`。

在 `SUBMITTED`、`ACCEPTED`、`TRIGGERED` 和 `PARTIALLY_FILLED` 状态下，拒绝会保留订单的状态与条款，包括 `OrderUpdated` 已应用的任何修改。在 `PENDING_CANCEL` 状态下，保留待撤状态。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderModifyRejected` 还携带：

| 字段             | Python 类型              | 必填/默认值 | 说明                                          |
| ---------------- | ------------------------ | ---------------- | ------------------------------------------------ |
| `reason`         | `str`                    | 必填         | 订单更新被拒绝的原因。               |
| `venue_order_id` | `VenueOrderId` 或 `None` | `None`           | 交易场所分配的订单标识（若已知）。   |
| `account_id`     | `AccountId` 或 `None`    | `None`           | 订单关联的账户（若已知）。 |
| `reconciliation` | `bool`                   | 必填         | 是否在一致性对账期间生成。              |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_modify_rejected(self, event: OrderModifyRejected) -> None:
    self.log.warning(
        f"Modify rejected for {event.client_order_id}: {event.reason}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
