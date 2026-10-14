# AccountState

`AccountState` 携带账户余额与保证金的快照。系统在以下时机发布它：

- 交易场所经执行客户端上报账户更新。
- 持仓更新后 `Portfolio` 重新计算账户状态（针对启用了 `calculate_account_state` 的保证金账户）。

`Portfolio` 内部订阅这些事件，以维护敞口和余额跟踪。

`is_reported` 标志用于区分场所上报的快照和系统计算的快照。

## 字段 {#fields}

| 字段            | Python 类型            | 必填/默认值 | 说明                                                            |
| --------------- | ---------------------- | ---------------- | ------------------------------------------------------------------------- |
| `account_id`    | `AccountId`            | 必填         | 账户 ID（在交易场所侧）。                                          |
| `account_type`  | `AccountType`          | 必填         | 账户类型（`CASH`、`MARGIN`、`BETTING` 或 `WALLET`）。              |
| `base_currency` | `Currency` 或 `None`   | `None`           | 账户基础货币（多币种账户为 `None`）。           |
| `is_reported`   | `bool`                 | 必填         | 状态是否来自交易所上报（否则为系统计算）。 |
| `balances`      | `list[AccountBalance]` | 必填         | 账户余额（可能为空）。                                      |
| `margins`       | `list[MarginBalance]`  | 必填         | 保证金余额（可能为空）。                                       |
| `event_id`      | `UUID4`                | 必填         | 事件 ID。                                                             |
| `ts_event`      | `int`                  | 必填         | 事件发生时刻的 UNIX 纳秒时间戳。                     |
| `ts_init`       | `int`                  | 必填         | 对象初始化时刻的 UNIX 纳秒时间戳。             |
| `info`          | `dict`                 | `None`           | 没有对应类型字段的场所特有账户数据（未设置时为空 dict）。  |

## 示例 {#example}

账户状态通常经 `Portfolio` 消费，而不是专门的处理函数：

```python
from nautilus_trader.model import Venue

# Account state is tracked by the portfolio; query it by venue
account = self.portfolio.account(venue=Venue("BINANCE"))
self.log.info(f"Account state: {account}")
```

返回结果与 Portfolio 是分离的。修改返回的账户对象不会改变引擎持有的权威账户数据。

## 相关指南 {#related-guides}

- [事件](./index.md) - 事件类别与分发。
- [记账](./../accounting.md) - 账户类型、余额与保证金模型。
- [Portfolio](./../portfolio.md) - 账户状态如何支撑敞口与余额跟踪。
