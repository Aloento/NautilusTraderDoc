# 回测

使用 NautilusTrader 进行回测是一种有步骤的模拟流程，它通过特定系统实现来重现交易活动。该系统由多个组件组成，
包括内置引擎、`Cache`、[MessageBus](message_bus.md)、`Portfolio`、[Actors](actors.md)、[Strategies](strategies.md)、[Execution Algorithms](execution.md)
以及其他用户自定义模块。整个交易模拟以由 `BacktestEngine` 处理的一条历史数据流为基础。当数据流耗尽时，引擎结束运行并产出
详尽的结果与绩效指标，供进一步分析使用。

NautilusTrader 提供两种不同层次的 API 用于配置和运行回测：

- **High-level API（高层 API）**：使用 `BacktestNode` 和配置对象（内部会创建 `BacktestEngine`）。
- **Low-level API（底层 API）**：直接使用 `BacktestEngine`，需要更多手工配置。

## 选择哪个 API 层级

在以下情况下考虑使用 **Low-level API**：

- 整个数据流能在可用机器资源内处理（例如内存足够）。
- 你不想把数据存为 Nautilus 特定的 Parquet 格式。
- 希望保留原始数据的原始格式（例如 CSV、二进制等）。
- 需要对 `BacktestEngine` 进行精细控制，例如在相同数据集上重复回测但替换组件（actor、strategy）或调整参数。

在以下情况下考虑使用 **High-level API**：

- 数据流超出可用内存，需要分批流式处理数据。
- 想利用 `ParquetDataCatalog` 在 Nautilus 特定的 Parquet 格式下带来的性能与便利。
- 希望通过配置对象在多个引擎上并行或批量管理多个回测运行。

## 底层 API（Low-level API）

底层 API 以 `BacktestEngine` 为中心，输入通过 Python 脚本手动初始化并添加。一个实例化的 `BacktestEngine` 可以接收：

- `Data` 对象的列表（会基于 `ts_init` 自动按单调顺序排序）。
- 多个手动初始化的 venue。
- 多个手动初始化并添加的 actor。
- 多个手动初始化并添加的 execution algorithm。

这种方式适合需要对回测过程进行逐项精细控制的场景。

## 高层 API（High-level API）

高层 API 以 `BacktestNode` 为核心，负责协调多个 `BacktestEngine` 实例的管理，
每个实例由一个 `BacktestRunConfig` 定义。多个配置可以打包成列表，由节点在一次运行中处理。

每个 `BacktestRunConfig` 通常包含：

- 一组 `BacktestDataConfig`。
- 一组 `BacktestVenueConfig`。
- 一组 `ImportableActorConfig`。
- 一组 `ImportableStrategyConfig`。
- 一组 `ImportableExecAlgorithmConfig`。
- 一个可选的 `ImportableControllerConfig`。
- 一个可选的 `BacktestEngineConfig`（如果未指定则使用默认配置）。

## 数据（Data）

用于回测的数据驱动了执行流程。由于可用的数据类型多样，务必确保你的 venue 配置与提供的数据相匹配，
否则配置与数据不一致会导致执行时出现意外行为。

NautilusTrader 主要针对订单簿数据（order book）进行设计与优化，因为它能完整表示市场的每个价格档或订单，
最接近真实交易场所的行为，能够提供最高精度的执行模拟。但若高精度的订单簿数据不可用或不是必须，平台也能按下列由精细到粗糙的顺序处理市况数据：

1. **Order Book Data/Deltas（L3 market-by-order）**：提供最完整的市场深度和逐笔订单流，可见所有单个订单。
2. **Order Book Data/Deltas（L2 market-by-price）**：按价格档聚合订单，保留多档市场深度。
3. **Quote Ticks（L1 market-by-price）**：仅包含最优买卖价及对应量，表示“top of the book”。
4. **Trade Ticks**：反映实际成交，提供交易发生的精确信息。
5. **Bars**：按固定时间区间（如 1 分钟、1 小时或 1 天）聚合的 OHLC 数据。

### 数据选择：成本与准确度的权衡

对于许多策略来说，Bar 数据（例如 1 分钟 K 线）已足够用于回测与策略开发。Bar 数据通常比逐笔或订单簿数据更易获取且成本更低。

考虑到这一现实，Nautilus 支持基于 bar 的回测，并提供若干增强特性以在较低粒度数据下尽可能提升模拟精度。

提示：

> 对于部分策略，使用 bar 数据作为初期验证快速且经济。若策略对执行时点非常敏感（例如需要在 OHLC 范围内的精确价格完成成交，或止盈/止损区间非常紧），建议升级到更高粒度的数据以做更精确的验证。

## 交易场所（Venues）

为回测初始化 venue 时，必须指定其内部订单 `book_type`，以决定执行处理使用哪种订单簿模型：

- `L1_MBP`：Level 1 market-by-price（默认）。仅维护顶级档位。
- `L2_MBP`：Level 2 market-by-price。维护多档深度，每个价格档汇总为单个聚合订单。
- `L3_MBO`：Level 3 market-by-order。按订单逐笔维护深度，保留数据提供的每一张订单记录。

注意：

> 数据的粒度必须与指定的 `book_type` 一致。Nautilus 无法从低粒度数据（如 quotes、trades、bars）合成出更高粒度的 L2 或 L3 数据。

警告：

> 如果将 venue 的 `book_type` 设置为 `L2_MBP` 或 `L3_MBO`，所有非订单簿的数据（如 quotes、trades、bars）在执行处理时将被忽略，
> 这可能导致订单看似永远无法被成交。我们正在改进验证逻辑以减少这种配置与数据不匹配的问题。

警告：

> 提供 L2 或更高粒度的订单簿数据时，请确保同步更新 `book_type` 来反映数据的真实粒度；否则会发生聚合或降级：L2 数据会被降为每档单个订单，L1 则只能反映顶级档位。

## 执行（Execution）

### 数据与消息的时序

在主回测循环中，新到的市场数据会先用于已存在订单的执行逻辑，然后再由数据引擎传递给策略处理。这保证了在同一时间戳下先处理执行相关事件，随后触发策略逻辑。

### 基于 Bar 的执行

Bar 数据为每个时间段提供四个关键价格（假设 bar 基于成交汇总）：

- **Open**：开盘价（第一笔成交）
- **High**：最高成交价
- **Low**：最低成交价
- **Close**：收盘价（最后一笔成交）

虽然 Bar 给出价格走势的概览，但相对于更细粒度的数据我们会丢失一些重要信息：

- 无法得知最高价与最低价在时间上的先后顺序；
- 无法精确看到区间内具体的价格变化时刻；
- 无法还原真实成交的时间序列。

因此，Nautilus 在处理 bar 数据时采用一套尽量真实且偏保守的市场行为模拟机制。即便输入的是 quotes、trades 或 bars（较低粒度），平台内部仍然维护订单簿模拟——不过此时订单簿通常仅有顶级档位。

警告：

> 使用 bar 进行执行模拟（在 venue 配置中默认为 `bar_execution=True`）时，Nautilus 严格要求每个 bar 的时间戳（`ts_init`）表示该 bar 的**收盘时间**，以保证时间顺序正确并避免前瞻性偏差（look-ahead bias）。

#### Bar 的时间戳约定

如果你的数据源将 bar 的时间戳记录为**开盘时间**（某些供应商常见），则在导入到 Nautilus 之前必须将其转换为收盘时间。未做转换可能导致错误的订单成交、事件顺序错乱或不真实的回测结果。

- 对于支持的适配器，可使用类似 `bars_timestamp_on_close=True` 的配置（如 Bybit 或 Databento 适配器）在数据引入时自动处理。
- 对于自定义数据，需要手动将时间戳向后平移一个 bar 周期（例如对 1 分钟 bar 加 1 分钟）。
- 在导入前用小样本验证时间戳约定，避免模拟偏差。

#### 处理 Bar 数据的流程

即便输入的是 bar 数据，Nautilus 也会为每个合约维护一个内部订单簿，与真实交易场所一致：

1. 时间处理：

   - Nautilus 对用于执行的 bar 时间有特定处理要求；`ts_event` 应表示 bar 的收盘时间，这是最合乎逻辑的时间点，因为此时 bar 聚合完成。
   - 可通过 `BarDataWrangler` 的 `ts_init_delta` 参数控制 `ts_init` 的偏移，通常设置为 bar 的步长（以纳秒为单位）。
   - 平台会基于这些时间戳确保事件按正确顺序发生，防止前瞻性偏差。

2. 价格处理：

   - 平台将每根 bar 的 OHLC 价格转换为一系列市场更新事件。
   - 更新顺序默认为：Open → High → Low → Close。
   - 若同时提供多个时间框架（如 1 分钟与 5 分钟），将优先使用更高粒度的数据以提高准确性。

3. 成交（Executions）：
   - 下单后，订单与模拟订单簿进行交互，行为类似真实场所。
   - 对于 MARKET 订单，按当前模拟市场价执行并考虑配置的延迟。
   - 对于在市的 LIMIT 订单，只要任一 bar 的价格触及或穿越限价即会触发执行（下文有更详细描述）。
   - 匹配引擎会随着 OHLC 价格的移动持续处理订单，而不是等到整根 bar 结束再统一处理。

#### OHLC 价格的模拟

在回测执行过程中，每根 bar 会被拆分为四个价格点按序处理：

1. 开盘价（Opening price）
2. 最高价（High price）_(High/Low 的先后顺序可配置，见下文 `bar_adaptive_high_low_ordering`)_
3. 最低价（Low price）
4. 收盘价（Closing price）

该 bar 的成交量在四个价格点间**平均分配**（每点 25%）。在极端情况下，若原始 bar 的量除以 4 小于该合约的最小 `size_increment`，仍会以最小 `size_increment` 作为每个价格点的成交量，以确保市场活动有效（例如 CME 交易所的合约单位为 1）。

价格点的具体顺序可通过 venue 配置的 `bar_adaptive_high_low_ordering` 参数控制。

Nautilus 支持两种 bar 处理模式：

1. 固定顺序（Fixed ordering，`bar_adaptive_high_low_ordering=False`，默认）

   - 按固定顺序处理每根 bar：`Open → High → Low → Close`。
   - 简单且确定性强。

2. 自适应顺序（Adaptive ordering，`bar_adaptive_high_low_ordering=True`）
   - 基于 bar 的结构估算更可能的价格路径：
   - 若 Open 更接近 High，则按 `Open → High → Low → Close` 处理；
   - 若 Open 更接近 Low，则按 `Open → Low → High → Close` 处理；
   - 研究显示（见链接）该方法在预测 High/Low 顺序上能达到约 75–85% 的准确率，远高于固定顺序的约 50%。
   - 当止盈与止损都发生在同一根 bar 内时，此顺序对于先成交哪个单具有决定性影响。

下面示例展示如何为 venue 配置自适应 bar 顺序并设置账户：

```python
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.model.enums import OmsType, AccountType
from nautilus_trader.model import Money, Currency

# Initialize the backtest engine
engine = BacktestEngine()

# Add a venue with adaptive bar ordering and required account settings
engine.add_venue(
  venue=venue,  # Your Venue identifier, e.g., Venue("BINANCE")
  oms_type=OmsType.NETTING,
  account_type=AccountType.CASH,
  starting_balances=[Money(10_000, Currency.from_str("USDT"))],
  bar_adaptive_high_low_ordering=True,  # Enable adaptive ordering of High/Low bar prices
)
```

### 滑点（Slippage）与点差（Spread）处理

在使用不同数据类型回测时，Nautilus 会针对滑点与点差采取不同的模拟策略：

对于 L2（market-by-price）或 L3（market-by-order）数据，滑点可通过订单簿真实深度高精度模拟：

- 按真实订单簿档位逐档成交；
- 按每档可用量依次匹配；
- 保留真实的订单簿深度对每次成交的影响。

对于 L1 数据类型（如 L1 订单簿、trades、quotes、bars），滑点通过参数化机制处理：

初始成交滑点（`prob_slippage`）：

- 由 `FillModel` 的 `prob_slippage` 参数控制；
- 决定初始成交是否会发生 1 tick 的价差；
- 例如 `prob_slippage=0.5` 表示买入市价单有 50% 概率以高 1 tick 的价格成交。

提示：

> 使用 bar 数据回测时，价格粒度较低会影响滑点模拟。若需尽可能真实的回测结果，应优先考虑 L2 或 L3 级别的订单簿数据。

### Fill 模型（Fill model）

`FillModel` 用于在回测中以概率方式模拟订单队列位置与执行，解决一个根本性的问题：即便拥有完备的历史市场数据，也无法精确重现订单在实时市场中与其他参与者交互的所有细节。

`FillModel` 模拟交易中的两个关键方面：

1. 限价单的队列位置（Queue position）：

   - 当多个交易者在相同价格档下单时，队列中的先后顺序决定了是否以及何时被成交。

2. 市场影响与竞争（Market impact and competition）：
   - 使用市价单吃入流动性时，你会与其他交易者竞争可用的流动性，进而影响最终成交价。

#### 配置与参数

```python
from nautilus_trader.backtest.models import FillModel
from nautilus_trader.backtest.config import BacktestEngineConfig
from nautilus_trader.backtest.engine import BacktestEngine

# Create a custom fill model with your desired probabilities
fill_model = FillModel(
  prob_fill_on_limit=0.2,    # Chance a limit order fills when price matches (applied to bars/trades/quotes + L1/L2/L3 order book)
  prob_fill_on_stop=0.95,    # [DEPRECATED] Will be removed in a future version, use `prob_slippage` instead
  prob_slippage=0.5,         # Chance of 1-tick slippage (applied to bars/trades/quotes + L1 order book only)
  random_seed=None,          # Optional: Set for reproducible results
)

# Add the fill model to your engine configuration
engine = BacktestEngine(
  config=BacktestEngineConfig(
    trader_id="TESTER-001",
    fill_model=fill_model,  # Inject your custom fill model here
  )
)
```

`prob_fill_on_limit`（默认：`1.0`）

- 目的：模拟当价格触及限价位时，限价单被成交的概率。
- 细节：
  - 模拟订单在该价格档的队列位置。
  - 适用于所有数据类型（L1/L2/L3 订单簿、quotes、trades、bars）。
  - 每当市场价格触及但未穿越你的委托价时，会进行一次新的随机概率检验。
  - 若检验通过，则填充剩余全部委托量。

示例：

- `prob_fill_on_limit=0.0`：限价买单在最佳卖价到达限价时从不成交；限价卖单在最佳买价到达限价时从不成交（模拟排在队尾）。
- `prob_fill_on_limit=0.5`：在价格触及时有 50% 概率成交（模拟处于队列中间）。
- `prob_fill_on_limit=1.0`（默认）：在价格触及时必然成交（模拟处于队列最前端）。

`prob_slippage`（默认：`0.0`）

- 目的：模拟市价单执行时发生价格滑点的概率。
- 细节：
  - 仅适用于 L1 数据类型（quotes、trades、bars）。
  - 触发时，会将成交价按一个 tick 向不利方向移动。
  - 影响所有市价类订单（例如 `MARKET`、`MARKET_TO_LIMIT`、`MARKET_IF_TOUCHED`、`STOP_MARKET`）。
  - 在 L2/L3 数据下不启用，因为订单簿深度可用于自然决定滑点。

示例：

- `prob_slippage=0.0`（默认）：不施加额外滑点，理想化地以当前市场价成交。
- `prob_slippage=0.5`：买入市价单有 50% 概率以高 1 tick 的价格成交；卖出市价单有 50% 概率以低 1 tick 的价格成交。
- `prob_slippage=1.0`：买单始终以高 1 tick 成交，卖单始终以低 1 tick 成交（始终存在不利价格移动的情形）。

`prob_fill_on_stop`（默认：`1.0`）

- Stop 单本质上是 stop-market，当市价触及 stop 价时转为市价单。
- 因此 stop 单的成交机制等同于市价单，由 `prob_slippage` 控制。

警告：

> `prob_fill_on_stop` 参数已弃用，将在未来版本移除，请使用 `prob_slippage`。

#### 不同数据类型下模拟行为的差异

`FillModel` 的行为会根据使用的订单簿类型而调整：

**L2 / L3 订单簿数据**

在存在完整订单簿深度的情况下，`FillModel` 主要通过 `prob_fill_on_limit` 模拟限价单的队列位置；滑点由订单簿深度自然决定。

- `prob_fill_on_limit` 生效；
- `prob_slippage` 不生效（订单簿深度决定价格冲击）。

**L1 订单簿数据**

只有最佳买卖价时，`FillModel` 会提供额外模拟：

- `prob_fill_on_limit` 生效；
- `prob_slippage` 生效，用以补偿缺失的深度信息。

**Bar / Quote / Trade 数据**

与 L1 类似：

- `prob_fill_on_limit` 生效；
- `prob_slippage` 生效。

#### 重要注意事项

- **支持部分成交（Partial fills）**：在 L2/L3 数据下，当订单簿中可用量不足时，可能产生部分成交，剩余挂单将保留，直到后续有可用流动性或被取消。
- 在 L1 数据下，滑点被限制为固定的 1 tick，且会以该价位填充整个订单量。

注意：

> 随着 `FillModel` 的持续演进，未来版本可能会引入更复杂的执行动力学模拟，例如基于订单规模的可变滑点、更加精细的部分成交模拟以及更复杂的队列位置建模。

## 账户类型（Account types）

当你将 venue 添加到引擎——无论用于实盘还是回测——都必须通过 `account_type` 参数选择三种会计模式之一：

| Account type | Typical use-case                                | What the engine locks                                                     |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------- |
| Cash         | Spot trading (e.g. BTC/USDT, stocks)            | Notional value for every position a pending order would open.             |
| Margin       | Derivatives or any product that allows leverage | Initial margin for each order plus maintenance margin for open positions. |
| Betting      | Sports betting, book‑making                     | Stake required by the venue; no leverage.                                 |

向回测 venue 添加 `CASH` 账户的示例：

```python
from nautilus_trader.adapters.binance import BINANCE_VENUE
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.model.currencies import USDT
from nautilus_trader.model.enums import OmsType, AccountType
from nautilus_trader.model import Money, Currency

# Initialize the backtest engine
engine = BacktestEngine()

# Add a CASH account for the venue
engine.add_venue(
  venue=BINANCE_VENUE,  # Create or reference a Venue identifier
  oms_type=OmsType.NETTING,
  account_type=AccountType.CASH,
  starting_balances=[Money(10_000, USDT)],
)
```

### 现金账户（Cash accounts）

现金账户以全额结算交易；不存在杠杆概念，因此也没有保证金的概念。

### 保证金账户（Margin accounts）

保证金账户用于交易需要保证金的品种，如期货或带杠杆的产品。它追踪账户余额、计算所需保证金并管理杠杆，确保持仓与委托拥有足够的抵押品。

关键概念：

- **Leverage（杠杆）**：放大相对于账户权益的交易敞口，杠杆越高，潜在收益与风险越大。
- **Initial Margin（初始保证金）**：开仓时提交订单所需的抵押。
- **Maintenance Margin（维持保证金）**：维持持仓所需的最小抵押。
- **Locked Balance（冻结余额）**：作为抵押被保留、不可用于新订单或提款的资金。

注意：

> Reduce-only 订单在现金账户中不会增加 `balance_locked`，在保证金账户中也不会增加初始保证金，因为它们只能减少已有敞口。

### 投注账户（Betting accounts）

投注账户用于需要押注金额以换取可能固定赔率回报的场景（例如某些预测市场或体育博彩）。引擎仅冻结场所要求的押注金额；杠杆与保证金概念不适用。

## 保证金模型（Margin models）

NautilusTrader 提供灵活的保证金计算模型，以适应不同场所与交易场景的需求。

### 概览

不同交易场所与经纪商在保证金计算上存在差异：

- **传统经纪商**（如 Interactive Brokers、TD Ameritrade）：通常使用固定百分比，不随杠杆变化。
- **加密货币交易所**（如 Binance 等）：杠杆可能会降低保证金要求。
- **期货交易所**（如 CME、ICE）：按合约固定保证金金额。

### 可用模型

#### StandardMarginModel

使用固定百分比（不随杠杆除法），符合传统经纪商的做法。

公式：

```python
# Fixed percentages - leverage ignored
margin = notional * instrument.margin_init
```

- 初始保证金 = `notional_value * instrument.margin_init`
- 维持保证金 = `notional_value * instrument.margin_maint`

- 适用场景：传统经纪商、期货交易所，以及使用固定保证金要求的外汇经纪商。

#### LeveragedMarginModel

通过杠杆对保证金要求进行除法处理。

公式：

```python
# Leverage reduces margin requirements
adjusted_notional = notional / leverage
margin = adjusted_notional * instrument.margin_init
```

- 初始保证金 = `(notional_value / leverage) * instrument.margin_init`
- 维持保证金 = `(notional_value / leverage) * instrument.margin_maint`

- 适用场景：加密交易所或杠杆会影响保证金要求的场所。

### 使用方法

#### 编程配置

```python
from nautilus_trader.backtest.models import LeveragedMarginModel
from nautilus_trader.backtest.models import StandardMarginModel
from nautilus_trader.test_kit.stubs.execution import TestExecStubs

# Create account
account = TestExecStubs.margin_account()

# Set standard model for traditional brokers
standard_model = StandardMarginModel()
account.set_margin_model(standard_model)

# Or use leveraged model for crypto exchanges
leveraged_model = LeveragedMarginModel()
account.set_margin_model(leveraged_model)
```

#### 回测配置

```python
from nautilus_trader.backtest.config import BacktestVenueConfig
from nautilus_trader.backtest.config import MarginModelConfig

venue_config = BacktestVenueConfig(
  name="SIM",
  oms_type="NETTING",
  account_type="MARGIN",
  starting_balances=["1_000_000 USD"],
  margin_model=MarginModelConfig(model_type="standard"),  # Options: 'standard', 'leveraged'
)
```

#### 可用模型类型

- `"leveraged"`：按杠杆降低保证金（默认）。
- `"standard"`：固定百分比（传统经纪商）。
- 自定义类路径：`"my_package.my_module.MyMarginModel"`。

#### 默认行为

默认情况下，`MarginAccount` 使用 `LeveragedMarginModel`。

#### 现实场景示例

**EUR/USD 交易示例：**

- **合约**：EUR/USD
- **数量**：100,000 EUR
- **价格**：1.10000
- **名义价值**：$110,000
- **杠杆**：50x
- **合约初始保证金比率**：3%

保证金计算：

| Model     | Calculation            | Result | Percentage |
| --------- | ---------------------- | ------ | ---------- |
| Standard  | $110,000 × 0.03        | $3,300 | 3.00%      |
| Leveraged | ($110,000 ÷ 50) × 0.03 | $66    | 0.06%      |

账户余额影响：

- **账户余额**：$10,000
- **Standard Model**：无法下单 (需 $3,300)
- **Leveraged Model**：可下单 (仅需 $66)

### 真实场景示例

#### Interactive Brokers 的 EUR/USD 期货

```python
# IB requires fixed margin regardless of leverage
account.set_margin_model(StandardMarginModel())
margin = account.calculate_margin_init(instrument, quantity, price)
# Result: Fixed percentage of notional value
```

#### Binance 加密交易

```python
# Binance may reduce margin with leverage
account.set_margin_model(LeveragedMarginModel())
margin = account.calculate_margin_init(instrument, quantity, price)
# Result: Margin reduced by leverage factor
```

### 模型选择

#### 使用默认模型

默认的 `LeveragedMarginModel` 可直接使用：

```python
account = TestExecStubs.margin_account()
margin = account.calculate_margin_init(instrument, quantity, price)
```

#### 使用标准模型

若需模拟传统经纪商行为：

```python
account.set_margin_model(StandardMarginModel())
margin = account.calculate_margin_init(instrument, quantity, price)
```

### 自定义模型

你可以通过继承 `MarginModel` 来创建自定义保证金模型。自定义模型通过 `MarginModelConfig` 接收配置：

```python
from nautilus_trader.backtest.models import MarginModel
from nautilus_trader.backtest.config import MarginModelConfig

class RiskAdjustedMarginModel(MarginModel):
  def __init__(self, config: MarginModelConfig):
    """Initialize with configuration parameters."""
    self.risk_multiplier = Decimal(str(config.config.get("risk_multiplier", 1.0)))
    self.use_leverage = config.config.get("use_leverage", False)

  def calculate_margin_init(self, instrument, quantity, price, leverage, use_quote_for_inverse=False):
    notional = instrument.notional_value(quantity, price, use_quote_for_inverse)
    if self.use_leverage:
      adjusted_notional = notional.as_decimal() / leverage
    else:
      adjusted_notional = notional.as_decimal()
    margin = adjusted_notional * instrument.margin_init * self.risk_multiplier
    return Money(margin, instrument.quote_currency)

  def calculate_margin_maint(self, instrument, side, quantity, price, leverage, use_quote_for_inverse=False):
    return self.calculate_margin_init(instrument, quantity, price, leverage, use_quote_for_inverse)
```

#### 使用自定义模型

**编程方式：**

```python
from nautilus_trader.backtest.config import MarginModelConfig
from nautilus_trader.backtest.config import MarginModelFactory

config = MarginModelConfig(
  model_type="my_package.my_module:RiskAdjustedMarginModel",
  config={"risk_multiplier": 1.5, "use_leverage": False}
)

custom_model = MarginModelFactory.create(config)
account.set_margin_model(custom_model)
```

### 高层回测 API 配置

在使用高层回测 API 时，你可以在 venue 配置中通过 `MarginModelConfig` 指定保证金模型：

```python
from nautilus_trader.backtest.config import MarginModelConfig
from nautilus_trader.backtest.config import BacktestVenueConfig
from nautilus_trader.config import BacktestRunConfig

# Configure venue with specific margin model
venue_config = BacktestVenueConfig(
  name="SIM",
  oms_type="NETTING",
  account_type="MARGIN",
  starting_balances=["1_000_000 USD"],
  margin_model=MarginModelConfig(
    model_type="standard"  # Use standard model for traditional broker simulation
  ),
)

# Use in backtest configuration
config = BacktestRunConfig(
  venues=[venue_config],
  # ... other config
)
```

#### 配置示例

**Standard 模型（传统经纪商）：**

```python
margin_model=MarginModelConfig(model_type="standard")
```

**Leveraged 模型（默认）：**

```python
margin_model=MarginModelConfig(model_type="leveraged")  # Default
```

**带配置的自定义模型：**

```python
margin_model=MarginModelConfig(
  model_type="my_package.my_module:CustomMarginModel",
  config={
    "risk_multiplier": 1.5,
    "use_leverage": False,
    "volatility_threshold": 0.02,
  }
)
```

回测执行时，系统会自动将所选保证金模型应用到模拟的交易所中。
