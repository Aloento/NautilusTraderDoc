# PositionClosed

`PositionClosed` 记录持仓的最终快照。`ExecutionEngine` 在以下时机发出它：成交将持仓清零，或成交更正后被更正的持仓已平掉。参见
[从成交到持仓](./index.md#from-fill-to-position-the-causal-chain)。处理函数：
`on_position_closed`。

## 字段 {#fields}

完整字段矩阵见[持仓事件字段](./index.md#position-event-fields)。描述平仓与最终结果的字段：

| 字段               | Python 类型                 | 说明                                                       |
| ------------------ | ------------------------- | ----------------------------------------------------------- |
| `closing_order_id` | `ClientOrderId` 或 `None` | 平仓订单的客户端 ID（若可用）。 |
| `peak_quantity`    | `Quantity`                | 持仓达到的最大同向数量。   |
| `peak_qty`         | `Quantity`                | `peak_quantity` 的兼容别名。                    |
| `avg_px_close`     | `float` 或 `None`         | 平均平仓价（若可用）。                      |
| `realized_return`  | `float`                   | 持仓最终已实现收益率。                 |
| `realized_pnl`     | `Money` 或 `None`         | 最终已实现盈亏（若可用）。                       |
| `unrealized_pnl`   | `Money`                   | 引擎置为零。                                  |
| `duration`         | `int`                     | 总持有时长（纳秒）。                     |
| `ts_opened`        | `int`                     | 持仓开仓时刻的 UNIX 纳秒时间戳。      |
| `ts_closed`        | `int` 或 `None`           | 持仓平仓时刻的 UNIX 纳秒时间戳。      |

平仓时 `side` 为 `FLAT`，`unrealized_pnl` 为零。

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_position_closed(self, event: PositionClosed) -> None:
    self.log.info(
        f"Closed {event.instrument_id}: realized={event.realized_pnl} "
        f"return={event.realized_return}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与成交到持仓的因果链。
- [持仓](./../positions.md) - 持仓生命周期、聚合与盈亏。
- [订单](./../orders/index.md) - 其成交开平仓的订单。
