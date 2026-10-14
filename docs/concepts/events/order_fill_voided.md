# OrderFillVoided

`OrderFillVoided` 记录先前上报的成交已全部或部分失去经济效力。`ExecutionEngine` 把每次成功的更正应用到订单。

若所引用的成交在本地存在，引擎还会重建每个受影响的持仓，并在发布更正前刷新组合的持仓与盈亏缓存。场所适配器从其权威账户接口刷新账户余额。

更正后的缓存状态就绪后，策略才收到 `OrderFillVoided`。若缓存持仓发生变化，引擎随后发布 `PositionChanged`（仍持有）或 `PositionClosed`（已平掉）。仅涉及订单的成功更正不产生持仓事件。

**更正**（correction）不是反向成交。它保留原始成交标识，使回放、对账和策略审计历史直接描述场所的操作。

处理函数：`on_order_fill_voided`。

## 约定 {#contract}

`voided_qty` 和 `commission_voided` 针对所引用的 `trade_id` 累计。数量更正不可回退。对已本地应用的成交，手续费更正也不可回退；后续修订可以在数量不变的情况下增大任一数值或改变 `is_reopened`。重复、过时和超量的更正会被拒绝。

所引用的 `OrderFilled` 是否已在本地订单历史中，决定了 Nautilus 如何解释这条更正：

| 成交在本地 | `is_reopened` | 结果                                                                  |
| ------------- | ------------- | --------------------------------------------------------------------- |
| 是           | `false`       | 应用。更正的数量不恢复为挂单量。                    |
| 是           | `true`        | 应用。更正的数量恢复为挂单量，受终态规则约束。 |
| 否            | `false`       | 应用。整个订单成为零剩余量的终态。                 |
| 否            | `true`        | 拒绝。                                                               |

未应用（unapplied）的非重开更正是一条**订单级终态断言**。即使 `voided_qty` 小于订单数量也是如此：该数值记录的是失效成交量，不是挂单剩余量。

对未应用的非重开更正：

- 事件必须与订单标识匹配。
- `voided_qty` 不能超过订单数量。
- 事件不能作废非零手续费。
- 没有本地成交时，Nautilus 不会逆转持仓或账户敞口。

### 适配器要求 {#adapter-requirements}

- 对于重开的更正，或希望订单保持可执行的任何部分更正，先发布并持久化所引用的 `OrderFilled`。回放执行的顺序约束与实时处理一致。
- 只有当整个订单权威地处于终态时，才可以在缺少所引用成交的情况下发出更正。
- 不要指望后续挂单状态的 `OrderUpdated`/status report 来修复事件顺序。持续对账会忽略挂单报告中无明确作废证据的成交数量减少；
  `VOIDED` 不会被重开；快照对账只从保留的成交推导更正。
- `OrderUpdated.quantity` 按毛值上报（见 [OrderUpdated](./order_updated.md#contract)）：包含已成交量和未重开的作废量。Nautilus 在计算剩余量时已经扣除未重开的作废量。若适配器又在 `quantity` 中扣掉它，就会重复扣减。例外是对账中把订单以 `FILLED` 关闭的更新，其 `quantity` 取有效的 `filled_qty`。

### 有本地成交时的状态行为 {#status-behavior-with-a-local-fill}

更正的数量默认不会恢复为可执行量：

- 已完全成交的订单进入终态 `VOIDED`，即使仍有一部分有效成交量。
- 部分成交的订单保留原本已在挂单的部分。其状态由存留的有效成交推导，剩余量不含未重开的作废量。该扣除在后续
  [`OrderUpdated`](./order_updated.md) 事件中持续生效。Nautilus 始终按
  `max(quantity - filled_qty - non_reopened_voided_qty, 0)` 推导剩余量，因此之后修改数量也不会把作废部分放回剩余量。
- 已取消或已过期的订单保持其终态。
- `is_reopened=true` 的更正会把更正的数量重新放回挂单剩余量。有效成交量为零时订单推导为 `ACCEPTED`，仍有存留量时为 `PARTIALLY_FILLED`。

无论经由哪条更正路径，`VOIDED` 都是终态。后续的成交、撤单、更新、更正和挂单状态报告都不会重开它。

:::warning[先升级消费端，再读取更正后的数据]
schema 只是追加了该事件与状态，不改动已有记录。旧版 v2 读取器不认识新值，因此让消费端读取含更正的流或目录数据之前，先完成升级。
:::

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderFillVoided` 还携带：

| 字段                | Python 类型                | 必填/默认值 | 说明                                            |
| ------------------- | -------------------------- | ---------------- | ------------------------------------------------------- |
| `venue_order_id`    | `VenueOrderId`             | 必填         | 交易场所分配的订单标识。                        |
| `account_id`        | `AccountId`                | 必填         | 原始成交关联的账户。              |
| `correction_id`     | `str`                      | 必填         | 本次更正修订的标识。                  |
| `trade_id`          | `TradeId`                  | 必填         | 原始场所成交 ID。                                |
| `voided_qty`        | `Quantity`                 | 必填         | 该笔成交累计失效的数量。          |
| `commission_voided` | `Money` 或 `None`          | `None`           | 该笔成交累计的手续费更正。                |
| `order_side`        | `OrderSide`                | 必填         | 原始成交的方向。                              |
| `order_type`        | `OrderType`                | 必填         | 原始订单的类型。                             |
| `last_px`           | `Price`                    | 必填         | 原始成交的价格。                             |
| `currency`          | `Currency`                 | 必填         | 原始成交价格的货币。                    |
| `liquidity_side`    | `LiquiditySide`            | 必填         | 原始成交的流动性方向。                    |
| `position_id`       | `PositionId` 或 `None`     | `None`           | 原始成交关联的持仓 ID。          |
| `reason`            | `str` 或 `None`            | `None`           | 场所或对账给出的更正原因。      |
| `info`              | `dict[str, str]` 或 `None` | `None`           | 额外的场所更正元数据。                   |
| `is_reopened`       | `bool`                     | `False`          | 场所是否证明订单重新可执行。 |
| `reconciliation`    | `bool`                     | 必填         | 是否在一致性对账期间生成。                     |

## 示例 {#example}

```python
def on_order_fill_voided(self, event: OrderFillVoided) -> None:
    self.log.warning(
        f"Corrected {event.trade_id}: voided={event.voided_qty} reopened={event.is_reopened}",
    )
```

## 相关指南 {#related-guides}

- [执行](./../execution/index.md) - 更正的应用与发布顺序。
- [OrderFilled](./order_filled.md) - 原始成交事件。
- [订单](./../orders/index.md) - 订单状态与状态流。
