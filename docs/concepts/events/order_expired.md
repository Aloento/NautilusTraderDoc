# OrderExpired

`OrderExpired` 记录订单已过期。执行流水线把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。它可能来自交易场所、模拟撮合引擎或一致性对账，例如 GTD 订单到达有效期终点。

典型迁移：`ACCEPTED` -> `EXPIRED`。处理函数：`on_order_expired`。

过期之后收到的成交仍会更新订单和持仓：

- 部分成交时订单保持 `EXPIRED`。
- 使数量全部成交的成交把状态改为 `FILLED`。

若成交在最近一次过期之后到达、且订单仍处于 `EXPIRED` 或 `FILLED`，Nautilus 会记录并发布下一条 `OrderExpired`。该事件不改变订单状态和时间戳。在再有成交到来之前，后续过期事件会被拒绝。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderExpired` 还携带：

| 字段             | Python 类型              | 必填/默认值 | 说明                                          |
| ---------------- | ------------------------ | ---------------- | ------------------------------------------------ |
| `venue_order_id` | `VenueOrderId` 或 `None` | `None`           | 交易场所分配的订单标识（若已知）。   |
| `account_id`     | `AccountId` 或 `None`    | `None`           | 订单关联的账户（若已知）。 |
| `reconciliation` | `bool`                   | 必填         | 是否在一致性对账期间生成。              |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_expired(self, event: OrderExpired) -> None:
    self.log.info(f"Order {event.client_order_id} expired")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
