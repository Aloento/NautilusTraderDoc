# PositionChanged

`PositionChanged` 记录使持仓保持持有的更新。`ExecutionEngine` 在以下时机发出它：成交改变了已有持仓但未将其平掉，或成交更正后被更正的持仓仍然持有。参见[从成交到持仓](./index.md#from-fill-to-position-the-causal-chain)。
处理函数：`on_position_changed`。

## 字段 {#fields}

完整字段矩阵见[持仓事件字段](./index.md#position-event-fields)。除开仓快照字段外，`PositionChanged` 还暴露：

| 字段              | Python 类型       | 说明                                                       |
| ----------------- | ----------------- | ------------------------------------------------------------ |
| `peak_quantity`   | `Quantity`        | 持仓达到的最大同向数量。    |
| `peak_qty`        | `Quantity`        | `peak_quantity` 的兼容别名。                     |
| `avg_px_close`    | `float` 或 `None` | 迄今的平均平仓价（若已有数量平出）。  |
| `realized_return` | `float`           | 持仓的已实现收益率。                        |
| `realized_pnl`    | `Money` 或 `None` | 已实现盈亏（若可用）。                              |
| `unrealized_pnl`  | `Money`           | 引擎置为零，不做盯市计算。 |
| `ts_opened`       | `int`             | 持仓开仓时刻的 UNIX 纳秒时间戳。       |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_position_changed(self, event: PositionChanged) -> None:
    self.log.info(
        f"Changed {event.instrument_id} to {event.signed_qty} (realized={event.realized_pnl})",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与成交到持仓的因果链。
- [持仓](./../positions.md) - 持仓生命周期、聚合与盈亏。
- [订单](./../orders/index.md) - 其成交开平仓的订单。
