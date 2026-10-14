# 基于成交的执行

场所设置 `trade_execution=True` 时（默认），trade tick 会触发撮合。一笔成交证明其价位上有流动性成交发生，因此可以成交被动侧的挂单。

设置 `trade_execution=False` 可把 trades 仅作为策略数据，不作为普通挂单的执行流动性：

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
    trade_execution=False,
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

禁用成交执行后，行为取决于场所的簿类型：

- L1 数据下，合法的 trade tick 更新 L1 订单簿，但跳过撮合与维护。这些工作留给后续的 quote tick 或可执行 bar。
- L2 或 L3 数据下，合法的 trade tick 推进 `LastPrice`，并对所有触发类型运行追踪止损维护。它们可以触发以 `LastPrice` 为触发价的止损单，这类成交针对现有簿流动性。该 tick 不撮合挂着的限价单，也不触发其他触发类型的止损单。它同时运行启用后的 GTD 过期与工具到期检查。

## 成交驱动的撮合 {#trade-driven-matching}

引擎把撮合参照临时移动到成交价上：

- `SELL` 成交可以匹配挂着的 BUY 订单。
- `BUY` 成交可以匹配挂着的 SELL 订单。
- `NO_AGGRESSOR` 成交可能影响两侧，因为被动方未知。

L1 成交把模拟盘口两侧档位都更新为成交价与成交量。L2 和 L3 深度簿保持不变。本次遍历中只有撮合核心的瞬时 bid、ask 和 last 价格发生移动。

### 成交的确定 {#fill-determination}

成交触发限价成交时：

- L1 数据下，即使模拟订单簿包含该成交价，引擎也使用成交自身的数量。挂着的 maker 订单按限价成交；taker 订单在成交价满足其限价时用成交价，不满足时保留限价兜底。
- L2 或 L3 数据下，引擎针对穿越的簿价位成交。若订单簿未能体现成交价，可在订单限价处创建成交驱动的成交。
- 成交驱动的成交量上限为 `min(order.leaves_qty, trade.size)`。

成交量消耗的语义取决于 `liquidity_consumption`：

- `False` 时，同笔成交量在一次遍历内可支撑多个订单。
- `True` 时，成交驱动的各笔成交共享同一个消耗计数，合计不超过未消耗的成交量。

**L1 成交预算**：开启消耗后，每笔成交都有独立的新预算，价格与数量相同的连续成交也一样。预算适用于两侧的限价成交，并在撮合与结算遍历之间持续，直到新市场数据将其替换。预算耗尽后，L1 成交不会回退到订单簿流动性。

例如在 L2 或 L3 数据下，100.00 的 `SELL` 成交可以成交 100.05 的 BUY LIMIT。若没有簿价位体现这笔成交，引擎使用 100.05，而不是给出更优的成交价。

### 撮合状态恢复 {#matching-state-restoration}

遍历结束后，引擎从可用的市场基线恢复撮合参照：

- L2 或 L3 数据下，深度簿始终是 bid/ask 状态的独立来源。
- 有 L1 quote 基线时，非主动侧从最新 quote 恢复。
- 只有 L1 trade 数据时，没有 quote 基线可恢复，最新成交继续定义可用的盘口状态。

解读没有 quotes 的成交流时，这一区别很重要。连续成交可以移动模拟的 L1 状态，但有 quote 支撑的 L1 撮合不会逐步丢弃最新 quote 的非主动侧。

## 主动方方向 {#aggressor-sides}

**主动方**（aggressor）是穿越价差的参与者：

- `SELL`：卖方打掉买价。该成交可以成交挂着的 BUY 订单。
- `BUY`：买方吃掉卖价。该成交可以成交挂着的 SELL 订单。
- `NO_AGGRESSOR`：数据未指明主动方。需要方向的功能会同时考虑两侧。

已知主动方方向，不能为同侧的被动订单提供成交证据。

## 组合订单簿与成交数据 {#combining-book-and-trade-data}

订单簿更新建立价差与可见深度，trade tick 在两次更新之间提供执行证据。深度快照被限频、而成交发生在最新快照没有的价位上时，两者组合尤其有用。

同时使用两个数据源要注意：

- 成交的主动方方向必须与待成交挂单相反。
- 订单簿更新可以独立于成交穿越订单。
- 在簿中缺失的成交价位上成交时，使用成交驱动的数量上限。
- 开启消耗后，被触发订单消耗剩余深度之前，引擎先扣除 L2 或 L3 簿中已被成交拿掉的部分。

## 排队位置跟踪 {#queue-position-tracking}

设置 `queue_position=True` 并配合 `trade_execution=True`，可为每个 LIMIT 订单跟踪其前方显示数量：

```python
from decimal import Decimal

from nautilus_trader.execution import MakerTakerFeeModel

venue = BacktestVenueConfig(
    name="SIM",
    oms_type=OmsType.NETTING,
    account_type=AccountType.MARGIN,
    book_type=BookType.L2_MBP,
    starting_balances=["100_000 USD"],
    trade_execution=True,
    queue_position=True,
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

### Sandbox 配置 {#sandbox-configuration}

Sandbox 模拟盘使用同样的撮合引擎标志。在 `SandboxExecutionClientConfig`
上传入（默认保持关闭，与现行 sandbox 行为一致）：

```python
from decimal import Decimal

from nautilus_trader.adapters.sandbox import SandboxExecutionClientConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import BookType
from nautilus_trader.model import Money
from nautilus_trader.model import Venue

config = SandboxExecutionClientConfig(
    venue=Venue("BINANCE"),
    starting_balances=[Money.from_str("10_000 USDT")],
    book_type=BookType.L2_MBP,
    trade_execution=True,
    queue_position=True,
    liquidity_consumption=True,
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0.001"),
        taker_rate=Decimal("0.001"),
    ),
)
```

sandbox 的 `venue` 必须与数据客户端工具的所属场所一致，策略必须订阅 trades（使用深度时还要订阅 L2/L3 deltas）。

### 队列生命周期 {#queue-lifecycle}

1. 订单被受理时，LIMIT 订单快照其价位上同侧的显示数量。
2. 该价位上方向正确的成交削减其前方数量。
3. 前方数量归零后，订单具备成交资格。
4. 该 tick 上可用于成交的，只有越过已清空队列的那部分成交量。

例如：

1. 100.00 的买价档含 100 单位。
2. 一笔 50 单位的 BUY LIMIT 加入，前方有 100 单位。
3. 一笔 80 单位的 `SELL` 成交把前方队列减到 20。
4. 一笔 30 单位的 `SELL` 成交清空队列，余下 10 单位可成交。
5. 下一笔方向正确的成交可以成交订单剩余数量。

### 订单簿变化的影响 {#book-changes}

对 L2 订单簿和聚合的 L3 更新：

- DELETE 清除该价位及其队列。
- UPDATE 把前方数量上限设为该价位新的显示数量。
- 完整的簿快照完成后，按新快照中该价位的可见数量重设每个被跟踪的队列位置。前方数量以快照数量为上限；新增流动性不会让已有模拟订单排得更靠后。快照批次可能以 `F_SNAPSHOT` clear 开始，以较后的 `F_LAST`
  delta 结束。
- `BookDepth` 替换在完整深度替换后应用同样的重设规则。

对 L3 MBO 订单簿：

- 单笔订单的 DELETE 按该订单剩余的被跟踪数量推进队列。
- 数量减少按差额推进队列。
- 数量增加让更大的订单留在前方。
- 价格变动把该订单从被跟踪队列中移除。
- 完整簿快照完成后，前方只保留存活的被跟踪订单 ID，各自以其先前数量为上限。

修改模拟订单的价格会重置其在新价位的队列位置；只改数量则保留已有进度。

### L1 队列跟踪 {#l1-queue-tracking}

`BookType.L1_MBP` 下，trade tick 削减前方数量，quote 提供价格移动与显示数量证据：

- 价格离开订单价位方向移动穿过该价位时，清空队列。
- 价格向订单方向移动时，保留队列。
- 价格回到先前可见的价位时，前方数量以新的显示数量为上限。
- 订单价位上的 quote 把前方数量以同侧显示数量为上限。
- 显示数量增加时，保留队列进度。
- 排在 BBO 后方的订单保持等待，直到 quote 到达其价位或成交穿越它。

### 局限 {#limitations}

- 队列跟踪只适用于 `LIMIT` 订单。
- 每个模拟订单有独立的队列估计。
- 初始估计只限于受理时刻可见的订单簿状态。
- 历史数据无法揭示隐藏订单和场所的全部优先级规则。

:::warning[主动方方向未知]
`NO_AGGRESSOR` 成交会同时削减两侧的队列。这可能让队列比现实更早清空、订单更早成交，从策略执行角度看偏乐观。
:::
