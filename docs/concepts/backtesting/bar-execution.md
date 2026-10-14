# 基于 Bar 的执行 {#barbased-execution}

bar 数据记录一个区间的开、高、低、收和成交量，但不记录每个价格在区间内出现的时刻，也不记录 high 是否先于 low。因此基于 bar 的执行模拟的是一条**合理的区间内路径**，而非重建原始成交。

NautilusTrader 把每根执行 bar 转换为 L1 订单簿的合成市场更新。挂单随着这些更新穿过 bar 的各个价位而撮合。

## Bar 时间戳约定 {#bar-timestamp-convention}

:::warning
执行模拟要求每根 bar 的初始化时间戳（`ts_init`）表示
**区间收盘时刻**。这防止 bar 尚未成形就提前完整可见。
:::

事件时间戳（`ts_event`）可以表示开盘或收盘，取决于数据来源：

- 按收盘打时间戳的 bar，把 `ts_init` 设为同一时间戳。
- 按开盘打时间戳的 bar，设置 `ts_init = ts_event + interval_ns`。例如一分钟 bar 加上
  `60_000_000_000` 纳秒。

适配器提供 `bars_timestamp_on_close=True` 这类设置时优先启用它，让存储的数据符合预期约定。

自定义数据在构造 `Bar` 对象、编码 Arrow record batch、写入数据目录或调用 `add_data()` 之前，就要填好 `ts_event` 和 `ts_init`。`BarDataWrangler` 消费显式的时间戳字段，不提供 `ts_init_delta` 参数。跑回测前先用小样本验证结果。

## 处理 bar 数据 {#processing-bar-data}

bar 执行只在满足以下条件时生效：

- 场所设置了 `bar_execution=True`。
- 场所使用 `BookType.L1_MBP`。
- bar 的聚合来源是外部（external）。

内部聚合的 bar，以及发给 L2 或 L3 场所的 bar，仍会送达订阅的策略，但不会更新撮合引擎的订单簿，也不触发撮合。

对每根适用的 bar，引擎依次：

1. 为该工具选出配置中最细粒度的 bar 类型。
1. 把 bar 成交量拆分到四次合成更新上。
1. 按配置顺序处理 open、high、low，然后处理 close。
1. 每次合成更新后撮合订单。
1. 把完整的 bar 分发给 actor 和策略。

因此，bar 开始时就已挂着的订单可以在某个中间 OHLC 点成交。从 `on_bar` 提交的订单，要等该 bar 的四个点全部处理完才到达。

## OHLC 价格模拟 {#ohlc-price-simulation}

引擎把 bar 成交量均分到四个价格点上，余数归到 close，使合成更新保持总量不变。若四分之一成交量低于工具的最小 `size_increment`，每个点都改用最小变动数量。

场所的 `bar_adaptive_high_low_ordering` 选项控制区间内路径：

- `False`（默认）时，每根 bar 使用 `Open -> High -> Low -> Close`。
- `True` 时，引擎先访问离开盘更近的那个极值：
  - 开盘更接近 high 时，使用 `Open -> High -> Low -> Close`。
  - 开盘更接近 low 时，使用 `Open -> Low -> High -> Close`。

自适应路径是一条**确定性启发式**，不是对实际成交顺序的重建。
它的准确度取决于市场、周期和数据来源。
一份[探索性的 EUR/USD 分析](https://gist.github.com/stefansimik/d387e1d9ff784a8973feca0cde51e363)
提出了这个距离启发式，但并未确立普适的准确率。

先访问的价位决定哪个订单先成交。因此保护性止损和止盈目标落在同一根 bar 内时，路径顺序就有影响。

在场所上配置自适应顺序：

```python
from decimal import Decimal

from nautilus_trader.backtest import BacktestEngine
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import Money
from nautilus_trader.model import OmsType
from nautilus_trader.model import Venue

engine = BacktestEngine(BacktestEngineConfig())
engine.add_venue(
    venue=Venue("SIM"),
    oms_type=OmsType.NETTING,
    account_type=AccountType.CASH,
    starting_balances=[Money.from_str("10_000 USDT")],
    bar_adaptive_high_low_ordering=True,
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

## 订单提交时机 {#order-submission-timing}

bar N 的 OHLC 序列先于 `on_bar(N)` 执行。没有延迟模型时，从 `on_bar` 提交的订单立即针对 bar N 收盘时留下的订单簿结算。

延迟模型会推迟订单的实际到达。命令到达其到达时间戳后，引擎通过两种方式把它从场所的延迟队列放行：

- **工具的市场数据**：该订单所属工具的发往交易所的数据会放行命令。只有 bar 数据、中间没有定时器事件时，到达时刻或之后的第一根 bar 会先跑完它的 OHLC 扫描，订单才结算——于是订单看到的是那根 bar 的收盘价。quote 或 trade tick 可以更早放行它，针对它们建立的簿状态结算。
- **不受限的结算点**：actor 或策略定时器、资金费结算、关闭排空等节点，会放行当时到期的所有命令。

其他工具的市场数据不会让延迟命令基于过时的簿状态被放行。日线权益曲线的组合快照定时器，以及 `PortfolioConfig.snapshot_interval_ms` 的采样，不释放更早的延迟命令。

```python
from decimal import Decimal

from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.execution import StaticLatencyModel

engine.add_venue(
    venue=Venue("SIM"),
    oms_type=OmsType.NETTING,
    account_type=AccountType.CASH,
    starting_balances=[Money.from_str("10_000 USDT")],
    latency_model=StaticLatencyModel(base_latency_nanos=1_000_000_000),
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
```

:::warning[下一根 bar 开盘成交与未来函数]
引擎不提供原生的"下一根 bar 开盘成交"模式。策略基于一根已完成的先前 bar 形成信号不构成未来函数。但引擎在分发某根 bar 之前，先处理了它的 open。若策略在 `on_bar` 回调中使用当前 bar 的 open，就引入了未来函数。只有 bar 数据时，延迟通常导致针对更晚的簿状态结算，而不是下一根的 open。
:::

## 内部 bar 聚合定时 {#internal-bar-aggregation-timing}

数据引擎从 tick 聚合时间 bar 时，由定时器在区间边界收线。时间戳完全相同的数据否则可能在该收线定时器之后才处理。

在 `DataEngineConfig` 中设置 `time_bars_build_delay` 延迟该定时器：

```python
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import DataEngineConfig

config = BacktestEngineConfig(
    data_engine=DataEngineConfig(
        time_bars_build_delay=1,
    ),
)
```

单位为微秒。一个很小的延迟，例如一微秒，就能让边界数据在 bar 收线前到达。它**只影响内部聚合的 bar**。
