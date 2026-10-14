# OrderFilled

`OrderFilled` 记录订单的一次部分或全部成交。`ExecutionEngine` 把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。来自实时执行、一致性对账和模拟撮合的成交共同驱动持仓生命周期事件。

典型迁移：`ACCEPTED` -> `FILLED` / `PARTIALLY_FILLED`。处理函数：`on_order_filled`。

携带订单上已有 `trade_id`、但 `last_px` 不同的成交是一次**价格重述**（price restatement）。它只重述该笔成交的记账价格，不产生数量、状态变化或组合层面的经济影响。

跨成交事件累加 `last_qty` 的处理函数必须跳过重述。识别方法：在 `order.events` 中查找更早的、`trade_id` 相同但 `event_id` 不同的 `OrderFilled`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderFilled` 还携带：

| 字段             | Python 类型                | 必填/默认值 | 说明                                                            |
| ---------------- | -------------------------- | ---------------- | ------------------------------------------------------------------------ |
| `venue_order_id` | `VenueOrderId`             | 必填         | 交易场所分配的订单标识。                                     |
| `account_id`     | `AccountId`                | 必填         | 成交关联的账户。                                    |
| `trade_id`       | `TradeId`                  | 必填         | 交易场所分配的撮合 ID。                                |
| `position_id`    | `PositionId` 或 `None`     | `None`           | 成交关联的持仓 ID。                                |
| `order_side`     | `OrderSide`                | 必填         | 本次成交的订单方向。                                                |
| `order_type`     | `OrderType`                | 必填         | 本次成交的订单类型。                                                |
| `last_qty`       | `Quantity`                 | 必填         | 本次成交的数量。                                    |
| `last_px`        | `Price`                    | 必填         | 本次成交的价格，不是均价。                |
| `currency`       | `Currency`                 | 必填         | 成交价格所用货币。                                          |
| `commission`     | `Money` 或 `None`          | `None`           | 成交手续费（若有上报）。                                        |
| `liquidity_side` | `LiquiditySide`            | 必填         | 本次成交的流动性方向（`MAKER`、`TAKER` 或 `NO_LIQUIDITY_SIDE`）。 |
| `info`           | `dict[str, str]` 或 `None` | `None`           | 额外的场所或适配器特有的成交元数据。             |
| `reconciliation` | `bool`                     | 必填         | 事件是否在一致性对账期间生成。                        |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_filled(self, event: OrderFilled) -> None:
    self.log.info(
        f"Filled {event.last_qty} @ {event.last_px} "
        f"({event.liquidity_side}) commission={event.commission}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [持仓](./../positions.md) - 由成交创建和修改的持仓。
- [订单](./../orders/index.md) - 订单类型与状态机。
