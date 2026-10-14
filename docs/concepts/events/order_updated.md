# OrderUpdated

`OrderUpdated` 记录订单数量、价格、触发价或计算出的保护价发生变化。执行流水线把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。变化可能来自交易场所、模拟撮合引擎、本地订单模拟器或对账。

典型迁移：`PENDING_UPDATE` -> 原状态（例如 `ACCEPTED`）。处理函数：
`on_order_updated`。

## 约定 {#contract}

`quantity` 是订单的**毛**数量：包含已成交量和任何未重开的作废量（见 [OrderFillVoided](./order_fill_voided.md)）。Nautilus 按下式推导挂单剩余量：

```text
leaves_qty = max(quantity - filled_qty - non_reopened_voided_qty, 0)
```

因此未重开的作废量在后续更新中始终不计入剩余量，适配器无需自行从 `quantity` 中扣除。若适配器上报的 `quantity` 已扣除未重开的作废量，剩余量会被重复扣减。

**终态对账**是例外。对账更新（`reconciliation=True`）的 `quantity` 若等于订单非零的 `filled_qty`，订单将以 `FILLED` 关闭。此时 `quantity` 是扣除作废量后的有效已成交量。也就是说，适配器按其实际成交量关闭订单时，上报 `filled_qty` 而不是毛数量。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderUpdated` 还携带：

| 字段                | Python 类型              | 必填/默认值 | 说明                                                       |
| ------------------- | ------------------------ | ---------------- | ----------------------------------------------------------- |
| `venue_order_id`    | `VenueOrderId` 或 `None` | `None`           | 交易场所分配的订单标识（若已知）。              |
| `account_id`        | `AccountId` 或 `None`    | `None`           | 订单关联的账户（若已知）。            |
| `quantity`          | `Quantity`               | 必填         | 订单当前数量。                               |
| `price`             | `Price` 或 `None`        | `None`           | 订单当前价格。                                  |
| `trigger_price`     | `Price` 或 `None`        | `None`           | 订单当前触发价。                          |
| `protection_price`  | `Price` 或 `None`        | `None`           | 订单计算出的保护价。                    |
| `is_quote_quantity` | `bool`                   | `False`          | 订单数量是否以计价货币计价。 |
| `reconciliation`    | `bool`                   | 必填         | 是否在一致性对账期间生成。                         |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_updated(self, event: OrderUpdated) -> None:
    self.log.info(
        f"Order {event.client_order_id} updated: qty={event.quantity} price={event.price}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
