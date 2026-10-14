# 成交价格与撮合 {#fill-prices-and-matching}

回测撮合引擎把记录的订单簿和成交数据视为**不可变的**：模拟成交不会修改历史订单簿。这既保护了回放的市场原貌，也要求对"同一显示流动性能否成交多笔模拟订单"作出显式假设。

引擎为这些假设提供两个控制：

- `liquidity_consumption=True` 跟踪每个价位已消耗的显示数量。
- 为成交模型固定 `random_seed` 可让该模型的概率决策可复现。
  它不控制模型之外的随机性或执行顺序。

## 成交价的确定 {#fill-price-determination}

成交价取决于订单类型、流动性方向、簿类型以及触发撮合的市场状态。

### L2 与 L3 订单簿 {#l2-and-l3-books}

有深度数据时，市价类订单沿已穿越的簿价位逐档吃掉。限价类订单作为 taker 时使用穿越的簿价格，作为 maker 时使用限价。

| 订单类型               | 成交行为                                                          |
| ---------------------- | ----------------------------------------------------------------- |
| `MARKET`               | 作为 taker 沿已穿越的簿价位逐档成交。                             |
| `MARKET_TO_LIMIT`      | 沿簿成交，剩余部分以其首笔成交价挂出。 |
| `LIMIT`                | 作为 taker 用穿越价位，作为 maker 用限价。     |
| `STOP_MARKET`          | 触发后沿穿越价位成交。                            |
| `STOP_LIMIT`           | 触发后按限价类规则处理。                       |
| `MARKET_IF_TOUCHED`    | 触发后沿穿越价位成交。                            |
| `LIMIT_IF_TOUCHED`     | 触发后按限价类规则处理。                       |
| `TRAILING_STOP_MARKET` | 激活并触发后沿穿越价位成交。             |
| `TRAILING_STOP_LIMIT`  | 激活并触发后按限价类规则处理。        |

可穿越数量小于订单剩余量时，深度单可以部分成交。

### L1 订单簿 {#l1-books}

L1 订单簿下，记录的市场只暴露最优买卖价：

| 订单类别                                                                 | 成交行为                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `MARKET`、`MARKET_IF_TOUCHED`、`STOP_MARKET`、`TRAILING_STOP_MARKET` | 按市场价或触发价规则处理，剩余部分在让一个 tick 处成交。    |
| `MARKET_TO_LIMIT`                                                        | 用最优对手价成交，剩余部分以首笔成交价挂出。 |
| 限价类 taker                                                        | 用最优穿越价成交，以限价为界。                        |
| 限价类 maker                                                        | 被成交或市场移动匹配时使用限价。                    |

可执行的市价类订单耗尽 L1 显示数量后，引擎在让一个 tick 处成交剩余部分，除非该价格会：

- 越过配置的价格保护边界。
- 越过工具的 `min_price` 或 `max_price`。
- 到达工具不允许的零价或负价。

这条**确定性剩余量规则**与成交模型的概率滑点是两回事。

成交驱动的撮合还有一条附加规则：若某笔成交在订单簿没有记录的价位上提供了成交证据，引擎按订单限价成交，且成交量以该笔成交的大小为上限。参见
[基于成交的执行](./trade-execution.md#trade-driven-matching)。

成交模型可以改变价格或提供合成深度簿，见
[成交模型](./fill-models.md)。

### bar 下触发式市价单的成交 {#triggered-market-order-fills-with-bars}

bar 执行会区分 `STOP_MARKET`、`MARKET_IF_TOUCHED` 和 `TRAILING_STOP_MARKET` 订单遇到的是跳空还是区间内移动。

bar 开盘价已越过触发价时，订单按模拟市场价成交。例如触发价 100 的 SELL 止损单，在下一根 bar 开盘 90 时可能以 90 成交。

bar 开盘价尚未到触发价、随后 high、low 或 close 穿越触发价时，引擎使用触发价。例如：

1. SELL 止损单触发价为 100。
1. bar 开盘 102。
1. low 到达 98。
1. 订单以 100 成交。

该规则假设价格连续穿过触发价。策略需要更精确的跳空与路径行为时，请改用 quote、trade 或订单簿数据。

## 价格保护 {#price-protection}

**价格保护**限制 `MARKET` 和 `STOP_MARKET` 订单沿簿成交的最远距离。偏移量按工具价格最小变动单位的个数配置：

```python
from decimal import Decimal

from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import BookType
from nautilus_trader.model import OmsType

venue = BacktestVenueConfig(
    name="SIM",
    oms_type=OmsType.NETTING,
    account_type=AccountType.MARGIN,
    book_type=BookType.L2_MBP,
    starting_balances=["100_000 USDT"],
    price_protection_points=100,
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

引擎在成交时计算边界：

- BUY：`ask + (points * price_increment)`
- SELL：`bid - (points * price_increment)`

对价格最小变动单位为 0.01 的工具，100 点允许 BUY 最高以当前 ask 之上 1.00 成交。边界之外的价位被排除，订单可能停留在部分成交状态。

- 市价单在处理时确定边界。
- 止损市价单在触发时确定边界，使用当时的买价或卖价。

设置 `price_protection_points=0` 可关闭保护。

## 订单簿不可变性 {#order-book-immutability}

模拟成交从不扣减历史订单簿。默认情况下，每次撮合遍历都可以使用完整的记录数量：

```python
from decimal import Decimal

from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import BookType
from nautilus_trader.model import OmsType

venue = BacktestVenueConfig(
    name="SIM",
    oms_type=OmsType.NETTING,
    account_type=AccountType.CASH,
    book_type=BookType.L1_MBP,
    starting_balances=["100_000 USD"],
    liquidity_consumption=True,
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

`liquidity_consumption=True` 时，引擎为每个价位记录原始数量与已消耗数量。可用数量为 `original_size - consumed`。该价位收到新的簿更新时，记录重置为新的显示数量。

### L1 被动成交 {#l1-passive-fills}

L1 市场移动穿过被动限价单时：

| `liquidity_consumption` | 剩余数量行为                                                    |
| ----------------------- | --------------------------------------------------------------------- |
| `False`                 | 按限价成交订单全部剩余数量。                 |
| `True`                  | 只成交未被消耗的显示数量，其余保持挂单。 |

例如：

1. ask 为 100.10，数量 50。
1. 1,000 单位的 BUY LIMIT 挂在 100.05。
1. 下一个 ask 为 100.00，数量 30。
1. 开启消耗跟踪后，成交 30 单位，剩余 970 保持挂单。
1. 后续更新可以提供新的可用数量。

### 成交消耗 {#trade-consumption}

成交可以在当前簿没有的价位上提供可执行数量。开启消耗跟踪后，成交驱动的各笔订单共享这份数量，而不是各自消耗整笔成交量。

对 L2 和 L3 订单簿，触发它的成交可能已消耗了显示深度。引擎在被触发订单使用剩余档位前先扣掉这部分量。若更新的簿更新已体现该笔成交，则跳过该调整。

成交模型返回的合成簿不使用按价位的消耗跟踪，模型必须自行体现其流动性假设。

### 局限 {#limitations}

消耗跟踪估计的是**可用数量**，不是**订单优先级**。要跟踪显示队列，请在有簿和成交数据时设置 `queue_position=True`；要近似处理，可用 `prob_fill_on_limit` 做概率近似。

成交驱动的成交也是机会主义的：一笔成交（print）只能证明流动性曾短暂存在，不能证明记录成交之后它仍然可用。

## 精度要求 {#precision-requirements}

工具配置的精度不超过构建的 `FIXED_PRECISION` 时，撮合引擎接受新订单和订单更新使用等于或低于它的精度。例如数量 `1` 对数量精度 3 合法，价格 `100` 对价格精度 2 合法。

对这类工具，更高的精度会被拒绝，即使多余的小数位全是零：
`1.0000` 对数量精度 3 非法。

分数成交与数量削减保持精确值。数量为 `1` 的订单成交 `0.500` 时，报告已成交 `0.500`、剩余 `0.500`。

DeFi 构建允许工具精度高于 `FIXED_PRECISION`。对这类工具，下表列出的受校验订单字段要求**精确精度**：工具要求 18 时，精度 17 和精度 0 都会被拒绝。列出的行情字段必须与工具配置的 `price_precision` 和 `size_precision` 完全一致。

非法精度的后果取决于它从何处进入撮合引擎：

| 输入             | 受校验字段                                           | 非法精度的后果                                               |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------ |
| `QuoteTick`      | 买卖价格与数量                         | 记录警告并跳过该 tick。                             |
| `TradeTick`      | 价格与数量                                       | 记录警告并跳过该 tick。                             |
| 可执行 `Bar` | 开、高、低、收与成交量                   | 记录警告并跳过该 bar。                              |
| 新订单        | 数量、显示数量、价格与触发价 | 拒绝订单。                                            |
| 订单更新     | 数量、价格与触发价                   | 拒绝修改。                                     |
| 生成的成交   | 成交价与数量                              | 兼容时归一化处理；否则警告并跳过该成交。 |

行情数据精度**连续 20 次**不匹配后，引擎记录一条 error。配合 `shutdown_on_error=True`，该错误可以请求回测正常关闭。一条合法的 quote、trade 或可执行 bar 会重置连续不匹配计数。

**bar 成交量**：`Bar.volume` 必须使用工具的数量单位和数量精度。来自提供商的按计价货币计的成交量字段，要先转换再构造 bar。

用工具工厂方法构造兼容的值：

```python
price = instrument.make_price(raw_price)
quantity = instrument.make_qty(raw_quantity)
```

同时确认工具定义与数据源匹配，并确认自定义 loader 保留了源数据的精度。
