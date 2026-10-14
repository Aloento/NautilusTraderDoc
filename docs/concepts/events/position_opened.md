# PositionOpened

`PositionOpened` 记录新持仓的开仓快照。`ExecutionEngine` 在成交创建持仓时发出它（参见
[从成交到持仓](./index.md#from-fill-to-position-the-causal-chain)）。处理函数：
`on_position_opened`。

## 字段 {#fields}

完整字段矩阵见[持仓事件字段](./index.md#position-event-fields)。`PositionOpened`
包含开仓快照；后续事件会暴露额外的汇总与生命周期字段。其主要状态字段：

| 字段             | Python 类型       | 说明                                             |
| -------------- | ----------------- | -------------------------------------------------- |
| `entry`        | `OrderSide`       | 开仓订单的方向。     |
| `side`         | `PositionSide`    | 当前持仓方向（`LONG` 或 `SHORT`）。     |
| `signed_qty`   | `float`           | 带符号持仓数量。                      |
| `quantity`     | `Quantity`        | 当前持仓数量。                         |
| `last_qty`     | `Quantity`        | 开仓成交的数量。 |
| `last_px`      | `Price`           | 开仓成交的价格。    |
| `currency`     | `Currency`        | 持仓的计价货币。                       |
| `avg_px_open`  | `float`           | 平均开仓价。                            |
| `realized_pnl` | `Money` 或 `None` | 当前周期的已实现盈亏（成本货币计）。 |

开仓时，若开仓成交的手续费以该工具的[成本货币](./../positions.md#currency-considerations)计价，已实现盈亏会扣除这笔手续费，否则为零。

`NETTING` 模式的持仓被重新开启时开始新周期。上一周期的已实现盈亏保留在
[已平持仓快照](./../positions.md#position-snapshotting)中。

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_position_opened(self, event: PositionOpened) -> None:
    self.log.info(
        f"Opened {event.side} {event.quantity} {event.instrument_id} @ {event.avg_px_open}",
    )
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与成交到持仓的因果链。
- [持仓](./../positions.md) - 持仓生命周期、聚合与盈亏。
- [订单](./../orders/index.md) - 其成交开平仓的订单。
