# 成交模型 {#fill-models}

历史数据无法展示模拟订单会如何与其他市场参与者互动。**成交模型**控制 NautilusTrader 在以下方面的假设：限价单成交资格、一个 tick 的滑点，以及可选的合成流动性。

## 各簿类型下的行为 {#behavior-by-book-type}

有 L2 或 L3 数据时，录制的订单簿提供价位与数量。撮合引擎沿这些价位遍历，`prob_fill_on_limit` 可以建模被触及的限价单是否成交。`prob_slippage` 不起作用，因为价格冲击由订单簿本身决定。

使用 L1 订单簿（包括由 quotes、trades 或 bars 更新的簿）时：

- `prob_fill_on_limit` 控制价格触及时限价单是否成交。
- `prob_slippage` 对每笔成交生效，与订单类型和流动性方向无关。
- 滑点抽样成功时，成交价沿订单方向恶化一个 tick。
- 模型可以提供合成 L2 订单簿，表示最优买卖价之外的流动性。

例如 `prob_slippage=0.5` 时，每笔 BUY 成交有 50% 概率向上移动一个 tick。需要复现模型的随机抽样时，设置 `random_seed`。

场所未指定成交模型时使用 `DefaultFillModel`，参数为：

- `prob_fill_on_limit=1.0`：被触及的限价单具备成交资格。
- `prob_slippage=0.0`：L1 成交不施加概率性的一 tick 滑点。

这些默认值不会禁用撮合引擎对可执行市价类订单单独的剩余量成交规则。

:::warning
成交之后历史订单簿数据保持不变。`liquidity_consumption=False` 时，同一显示数量在一次遍历中可能支撑多笔模拟订单。设置 `liquidity_consumption=True` 可让每个价位记录已消耗数量，直到新数据到来。参见
[订单簿不可变性](./fill-prices-and-matching.md#order-book-immutability)。
:::

## 可用模型 {#available-models}

| 模型                         | 流动性行为                                          |
| ---------------------------- | ------------------------------------------------------- |
| `DefaultFillModel`           | 使用撮合引擎记录的订单簿。               |
| `BestPriceFillModel`         | 在最优买卖价提供无限数量。        |
| `OneTickSlippageFillModel`   | 在最优价再让出一个 tick 处提供无限数量。 |
| `ProbabilisticFillModel`     | 随机选最优价或让出一个 tick 的价位。               |
| `TwoTierFillModel`           | 最优价放 10 单位，其余放在让一个 tick 处。  |
| `ThreeTierFillModel`         | 三个价位分别放 50、30、20 单位。         |
| `LimitOrderPartialFillModel` | 最优价放 5 单位，其余放在让一个 tick 处。   |
| `SizeAwareFillModel`         | 订单量达到 10 单位时改变簿形态。    |
| `CompetitionAwareFillModel`  | 在最优价暴露 1,000 单位中可配置的比例。 |
| `VolumeSensitiveFillModel`   | 在最优价放其内部量的 25%。              |
| `MarketHoursFillModel`       | 使用正常或加宽一个 tick 的合成价差。       |

`BestPriceFillModel` 对价差内或价差上的限价单，按订单自己的价格成交。

**工具量纲**：分档数量是模型常量，以工具数量单位表示。使用分档模型前，确认它与工具的量纲相称。

合成订单簿会省略超出工具 `min_price` 和 `max_price` 的任何价位；工具不允许零价或负价时也会省略。

`CompetitionAwareFillModel` 的 `liquidity_factor` 取值范围为 `[0.0, 1.0]`，默认 `0.3`，计算出的数量至少钳制为 1 个工具数量单位。

**Python 状态**：绑定未暴露 `VolumeSensitiveFillModel` 或
`MarketHoursFillModel` 的状态设置方法。从 Python 使用时，这两个模型分别保持初始值：近期成交量 1,000 单位、正常流动性模式。

## 配置 {#configuration}

把内置模型对象直接传给 `BacktestVenueConfig`：

```python
from decimal import Decimal

from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.execution import DefaultFillModel
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
    fill_model=DefaultFillModel(
        prob_fill_on_limit=0.2,
        prob_slippage=0.5,
        random_seed=42,
    ),
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

合成订单簿模型使用同样的构造参数：

```python
from decimal import Decimal

from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.execution import ThreeTierFillModel

venue = BacktestVenueConfig(
    name="SIM",
    oms_type=OmsType.NETTING,
    account_type=AccountType.CASH,
    book_type=BookType.L1_MBP,
    starting_balances=["100_000 USD"],
    fill_model=ThreeTierFillModel(
        prob_fill_on_limit=1.0,
        prob_slippage=0.0,
        random_seed=42,
    ),
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

高层场所配置只接受内置成交模型，不会从导入路径配置对象加载成交模型。

### 自定义成交模型 {#custom-fill-models}

低层 `BacktestEngine.add_venue()` 也接受自定义 Python 对象，它必须实现：

- `is_limit_filled() -> bool`
- `is_slipped() -> bool`

还可以实现：

- `fill_limit_inside_spread() -> bool`
- `get_orderbook_for_fill_simulation(instrument, order, best_bid, best_ask) -> OrderBook | None`

继承 `nautilus_trader.execution.FillModel` 可获得这些方法的默认实现。该自定义对象协议**只适用于低层引擎**。

流动性钩子在历史买价或卖价缺失时会收到 `None`，自定义模型必须处理这些可选价格。返回值决定成交行为：

- `None` 使用标准成交逻辑。
- 返回 `OrderBook` 时，成交只限于该簿的可用流动性，即使完全没有可成交量也不会补充。部分自定义成交不会用历史流动性或 L1 剩余量成交规则补足。

## 概率参数 {#probabilistic-parameters}

### `prob_fill_on_limit`（默认：`1.0`） {#prob_fill_on_limit-default-10}

该值控制市场价格触及但未穿越限价时，限价单是否成交：

- `0.0`：触及时从不成交。
- `0.5`：平均一半的合格触及成交。
- `1.0`：触及必成交。

穿越限价是另一条独立的撮合条件。要显式跟踪队列数量，见
[排队位置跟踪](./trade-execution.md#queue-position-tracking)。

### `prob_slippage`（默认：`0.0`） {#prob_slippage-default-00}

对 L1 订单簿，该值控制每笔成交是否增加一个 tick 的不利移动：

- `0.0`：从不施加模型滑点。
- `0.5`：平均一半的成交加一个 tick。
- `1.0`：每笔成交都加一个 tick。

抽样对 maker 和 taker 成交都生效，对 L2 或 L3 订单簿不适用。若滑点会越过工具的 `min_price` 或 `max_price`，或到达工具不允许的零价或负价，则保留原成交价。

## 合成订单簿 {#synthetic-order-books}

确定成交前，撮合引擎会向模型索取可选的合成订单簿。模型返回簿时，引擎按其价位成交；返回 `None` 时使用记录的订单簿。

:::warning[合成簿的消耗]
按价位的 `liquidity_consumption` 跟踪不适用于合成模型簿。自定义模型若需要某种消耗行为，必须在返回的簿中自行体现。
:::
