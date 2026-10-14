# OrderRejected

`OrderRejected` 记录订单进入终态 `REJECTED`。`ExecutionEngine` 把它应用到订单、更新 `Cache`，并发布到 `MessageBus`。它通常来自场所的明确拒绝。对账也可能基于场所报告，或在本地超时、缺单策略到期后生成该事件。

典型迁移：`SUBMITTED` -> `REJECTED`。外部与对账路径还允许
`INITIALIZED`、`ACCEPTED`、`PENDING_UPDATE`、`PENDING_CANCEL` 或 `TRIGGERED` -> `REJECTED`。
处理函数：`on_order_rejected`。

## 字段 {#fields}

除 [Python 订单事件公共字段](./index.md#common-python-order-event-fields)外，`OrderRejected` 还携带：

| 字段             | Python 类型 | 必填/默认值 | 说明                                                                           |
| ---------------- | ----------- | ---------------- | ------------------------------------------------------------------------------ |
| `account_id`     | `AccountId` | 必填         | 订单关联的账户。                                         |
| `reason`         | `str`       | 必填         | 场所原因，或本地对账策略的原因。                        |
| `due_post_only`  | `bool`      | `False`          | 是否因订单为 post-only 且会立即以 taker 身份成交而被拒绝。 |
| `reconciliation` | `bool`      | 必填         | 事件是否由对账生成。这不代表场所已确认。 |

## 示例 {#example}

在策略处理函数中读取该事件：

```python
def on_order_rejected(self, event: OrderRejected) -> None:
    self.log.warning(f"Order {event.client_order_id} rejected: {event.reason}")
```

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别、分发与订单事件公共字段。
- [订单](./../orders/index.md) - 订单类型与状态机。
- [执行策略](./../execution/policies.md#terminal-reconciliation-provenance) - 场所证据与合成终态策略。
