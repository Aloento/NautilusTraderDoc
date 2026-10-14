# 回测 API 与重复运行

NautilusTrader 提供**低层**的 `BacktestEngine` API 用于直接控制，以及**高层**的 `BacktestNode` API 用于由数据目录支撑的可配置运行。

## 选择 API 层级 {#choosing-an-api-level}

以下情况适合低层 API：

- 数据能放进内存，或者你打算手动分批流式加载。
- 要从 Nautilus Parquet 目录以外的格式加载数据。
- 需要直接控制场所、金融工具、组件、策略或执行算法。
- 想用同一批已加载的数据，改动部分组件后重跑。

以下情况适合高层 API：

- 数据存放在 `ParquetDataCatalog` 中。
- 数据需要自动分块加载。
- 希望用一个配置对象描述并标识一次目录支撑的运行。
- 希望每次独立运行都使用全新的引擎。

## 低层 API {#low-level-api}

低层 API 以 `BacktestEngine` 为中心。用 `BacktestEngineConfig` 创建引擎，然后依次添加场所、金融工具、组件和数据，最后调用 `run()`：

```python
from nautilus_trader.backtest import BacktestEngine
from nautilus_trader.config import BacktestEngineConfig

engine = BacktestEngine(BacktestEngineConfig())
engine.add_venue(...)
engine.add_instrument(instrument)
engine.add_strategy(strategy)
engine.add_data(data)
engine.run()
```

### 加载数据 {#loading-data}

每次 `add_data()` 调用都会把输入复制为一条独立的流。引擎按回放时间戳为每条流排序，运行时再按时间顺序合并所有流。每个工具各加一批数据，不会反复对整个累积列表排序：

```python
engine.add_data(instrument1_bars)
engine.add_data(instrument2_bars)
engine.add_data(instrument3_bars)
engine.run()
```

**运行就绪**：除非分批工作流刻意自行管理就绪状态，否则保持默认 `sort=True`。一次 `sort=False` 的调用会把引擎标记为未就绪。除非之后某次 `add_data(..., sort=True)` 恢复了就绪状态，否则必须在 `run()` 前调用 `sort_data()`：

```python
engine.add_data(instrument1_bars, sort=False)
engine.add_data(instrument2_bars, sort=False)
engine.sort_data()
engine.run()
```

`sort_data()` 把各自已排序的流标记为可回放，重复调用也无妨。

**输入所有权**：`add_data()` 之后清空或修改原始 Python 列表，不会影响已加载的数据流。

### 手动流式分批 {#streaming-batches-manually}

完整数据集放不进内存时使用**流式模式**：

```python
engine.add_strategy(strategy)

for batch in data_batches:
    engine.add_data(batch)
    engine.run(streaming=True)
    engine.clear_data()

engine.end()
```

`run(streaming=True)` 在当前数据耗尽时暂停，不会终结 trader，也不会把定时器推进到该批之后。最后一批处理完调用 `end()`：它把定时器刷新到最后一次运行边界，调用 stop 处理函数，并产出最终结果。

低层 API 不提供基于生成器的 `add_data_iterator()` 方法。`BacktestNode` 提供自动的目录分块；直接使用引擎的用户用上面的循环流式处理。

## 高层 API {#high-level-api}

高层 API 以 `BacktestNode` 为中心。每个 `BacktestRunConfig` 包含：

- 一个或多个 `BacktestVenueConfig` 对象。
- 一个或多个 `BacktestDataConfig` 对象。
- 可选的 `BacktestEngineConfig`。
- 可选的分块大小、时间边界、异常处理与资源释放设置。

先构建 node，再通过其面向单次运行的方法添加策略：

```python
from decimal import Decimal

from nautilus_trader.config import BacktestDataConfig
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.backtest import BacktestNode
from nautilus_trader.config import BacktestRunConfig
from nautilus_trader.config import BacktestVenueConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import BookType
from nautilus_trader.model import NautilusDataType
from nautilus_trader.model import OmsType

venue = BacktestVenueConfig(
    name="SIM",
    oms_type=OmsType.HEDGING,
    account_type=AccountType.MARGIN,
    book_type=BookType.L1_MBP,
    starting_balances=["1_000_000 USD"],
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0"),
        taker_rate=Decimal("0"),
    ),
)
data = BacktestDataConfig(
    data_type=NautilusDataType.QuoteTick,
    catalog_path="/data/catalog",
    instrument_id=instrument_id,
)
config = BacktestRunConfig(
    venues=[venue],
    data=[data],
    engine=BacktestEngineConfig(),
    chunk_size=100_000,
)

node = BacktestNode([config])
node.build()
node.add_strategy_from_config(config.id, strategy_config)
results = node.run()
```

手续费属于场所配置，不属于金融工具。每个场所都需要显式的 `fee_model`，无摩擦基线也要显式给出零费率模型。两个账户可以用不同费率交易同一工具，无需改动工具定义。

`chunk_size` 设在 `[1, 1_000_000]` 区间内即启用流式加载；保持 `None` 则一次性加载全部数据。

`BacktestNode` 还提供向已构建的运行添加 actor 和内置策略的方法。

### 订单簿 delta 回放 {#order-book-delta-replay}

`BacktestNode` 默认（一次性与流式运行都是）把 `OrderBookDelta` 目录数据按 `OrderBookDeltas` 批次回放。它按目录顺序为每个工具分组 delta，并在 `F_LAST` delta 处收尾每个批次，使每批恰好包含一个完整的订单簿事件。

每批的 flags、sequence 和时间戳取自收尾 delta，并按该 delta 的 `ts_init` 回放。

批量处理改变了回测处理订单簿事件的方式：

- **撮合**：撮合引擎先应用完整个事件再撮合订单。因此，订单不会以只存在于事件中间状态的簿成交。成交结果可能与逐条 delta 回放不同。
- **回调**：即使数据引擎的 `buffer_deltas` 已禁用，策略也是每个事件收到一次 `on_book_deltas` 回调。
- **分块大小**：流式运行中 `chunk_size` 按批次计数，一个 chunk 实际可能包含多于 `chunk_size` 的行。

每个事件必须以 `F_LAST` delta 结尾。若查询结束时某工具的 delta 仍在等待收尾 delta，运行会失败并报错指出该工具。

时间边界和 `filter_expr` 按行筛选。选择它们时要保证事件完整：把事件开头切掉的边界不会被检测到。

设置 `batch_deltas=False` 可逐条回放 delta：

```python
data = BacktestDataConfig(
    data_type=NautilusDataType.OrderBookDelta,
    catalog_path="/data/catalog",
    instrument_id=instrument_id,
    batch_deltas=False,
)
```

## 出错时关闭 {#shutdown-on-error}

设置 `BacktestEngineConfig.shutdown_on_error=True`，让 Rust 日志器发出 error 记录时请求正常关闭：

```python
from nautilus_trader.config import BacktestEngineConfig

config = BacktestEngineConfig(shutdown_on_error=True)
```

回测循环观察到请求后，会停止 trader 和各引擎，并返回已收集到的结果，不会中断进程。

在 `shutdown_on_error=True` 下：

- 即使组件过滤器或 `bypass_logging=True` 抑制了输出，Rust 日志器的 error 记录仍会请求关闭。
- Python 的 `logging.error(...)` 调用不会请求关闭。

新的内核运行启动时触发器会重置。最终的 `on_stop` 与命令结算行为见[关闭语义](./execution-flow.md#shutdown-semantics)。

## 重复运行 {#repeated-runs}

`BacktestEngine.reset()` 把交易状态和已加载组件的状态恢复到初始值。

**被清空的状态**：

- 订单、持仓与账户余额。
- 组件运行时状态。
- 引擎计数器与时间戳。

**保留的数据与注册**：

- 经 `add_data()` 添加的数据。
- 已注册的金融工具与场所（含场所配置）。
- 已注册的 actor、策略和执行算法。

工具会保持加载，因为默认回测缓存配置设置了
`drop_instruments_on_reset=False`。

### 独立运行用新 node {#use-fresh-nodes-for-independent-runs}

`BacktestNode` 接受一份 `BacktestRunConfig`。要运行相互独立的配置，逐个创建并释放 node：

```python
configs = [
    BacktestRunConfig(...),
    BacktestRunConfig(...),
    BacktestRunConfig(...),
]
results = []

for config in configs:
    node = BacktestNode([config])
    try:
        results.extend(node.run())
    finally:
        node.dispose()
```

策略不是由 controller 提供时，先构建每个 node 并在 `run()` 前注册其策略。

### 参数扫描复用已加载数据 {#reuse-loaded-data-for-parameter-runs}

多次运行要共享已加载的数据和场所配置时，使用 `reset()`：

```python
engine = BacktestEngine(BacktestEngineConfig())
engine.add_venue(...)
engine.add_instrument(instrument)
engine.add_data(data)

engine.add_strategy(strategy1)
engine.run()

engine.reset()
engine.run()

engine.reset()
engine.clear_strategies()
engine.add_strategy(strategy2)
engine.run()
```

替换策略实例前先调用 `clear_strategies()`。只有下一次运行要换数据集时才用 `clear_data()`。
