# 合约与交易品种

`Instrument` 基类定义了任何可交易资产/合约的核心规范。平台目前包含多个子类，用于表示不同的*资产类别*和*合约类型*：

- `Equity`：在现金市场交易的上市股票或 ETF
- `FuturesContract`：有实物/现金交割的期货合约，具有明确的标的、到期日和乘数
- `FuturesSpread`：交易所定义的多腿期货策略（例如日历展期或跨品种），作为单一工具报价
- `OptionContract`：交易所上市的期权（看涨或看跌），具有行权价和到期日
- `OptionSpread`：交易所定义的多腿期权策略（例如垂直价差、日历、跨式），作为单一工具报价
- `BinaryOption`：按二元结果结算为 0 或 1 的固定收益期权
- `Cfd`：场外交易的差价合约（Contract for Difference），跟踪标的并以现金结算
- `Commodity`：现货商品（例如黄金或原油），在现货/现金市场交易
- `CurrencyPair`：以 BASE/QUOTE 格式表示的现货外汇或加密货币交易对
- `CryptoOption`：以加密货币为标的且以加密货币计价/结算的期权，支持 inverse 或 quanto 风格
- `CryptoPerpetual`：无到期日的加密永续合约（perpetual swap），可为 inverse 或 quanto 结算
- `CryptoFuture`：有固定到期日、以加密货币为标的并以某种结算货币结算的加密期货合约
- `IndexInstrument`：由成分计算得出的现货指数，用作参考价，通常不可直接交易
- `BettingInstrument`：体育或博彩市场的一个选择（例如某队或某名选手），可在博彩场所交易

## 记号与标识（Symbology）

所有合约都应具有唯一的 `InstrumentId`，由本地符号（native symbol）和市场/交易所 ID（venue ID）通过小数点分隔组成。
例如，在 Binance Futures（加密）上，以太坊永续合约的 InstrumentId 为 `ETHUSDT-PERP.BINANCE`。

通常每个交易场所的本地符号应当是唯一的（但并非在所有场景都成立，例如 Binance 在现货与期货间可能复用相同符号），
而 `{symbol.venue}` 的组合在整个 Nautilus 系统中**必须**唯一。

:::warning
必须将合约与对应的市场数据集（如 tick 或 order book 数据）正确匹配，才能保证逻辑上的正确性。
错误的合约定义可能导致数据被截断或出现意外结果。
:::

## 回测（Backtesting）

通用的测试合约可以通过 `TestInstrumentProvider` 实例化：

```python
from nautilus_trader.test_kit.providers import TestInstrumentProvider

audusd = TestInstrumentProvider.default_fx_ccy("AUD/USD")
```

针对特定交易所的合约可以通过适配器提供的 `InstrumentProvider` 从实时交易所数据中发现：

```python
from nautilus_trader.adapters.binance.spot.providers import BinanceSpotInstrumentProvider
from nautilus_trader.model import InstrumentId

provider = BinanceSpotInstrumentProvider(client=binance_http_client)
await provider.load_all_async()

btcusdt = InstrumentId.from_str("BTCUSDT.BINANCE")
instrument = provider.find(btcusdt)
```

或者用户也可以直接通过 `Instrument` 构造函数或其更具体的子类灵活地定义合约：

```python
from nautilus_trader.model.instruments import Instrument

instrument = Instrument(...)  # <-- 提供所有必要参数
```

完整的合约 API 参考见：[API Reference](../api_reference/model/instruments.md)。

## 实盘交易（Live trading）

实盘集成适配器提供了 `InstrumentProvider` 类，用于自动缓存交易所的最新合约定义。需要在数据或执行相关方法中引用某个 `Instrument` 时，
使用对应的 `InstrumentId` 来进行识别与传参。

## 查找合约（Finding instruments）

由于同一套 actor/strategy 类可以用于回测与实盘，你可以通过中央缓存以完全相同的方式获取合约：

```python
from nautilus_trader.model import InstrumentId

instrument_id = InstrumentId.from_str("ETHUSDT-PERP.BINANCE")
instrument = self.cache.instrument(instrument_id)
```

你也可以订阅某个合约的变更：

```python
self.subscribe_instrument(instrument_id)
```

或者订阅整个交易场所（venue）上所有合约的变更：

```python
from nautilus_trader.model import Venue

binance = Venue("BINANCE")
self.subscribe_instruments(binance)
```

当 `DataEngine` 收到合约更新时，该对象会传入 actor/strategy 的 `on_instrument()` 方法。用户可以重写此方法以对合约更新执行自定义操作：

```python
from nautilus_trader.model.instruments import Instrument

def on_instrument(self, instrument: Instrument) -> None:
    # 在合约更新时执行某些操作
    pass
```

## 精度与增量（Precisions and increments）

合约对象以*只读*属性的形式组织合约规范，提供了正确的价格与数量精度、最小价格与数量增量、乘数和标准手数等信息。

:::note
大多数这些限制项会由 Nautilus 的 `RiskEngine` 进行校验，否则价格或数量的不合法值可能导致交易所拒单。
:::

## 限制（Limits）

某些限制字段在合约中是可选的（可能为 `None`），这取决于交易所，常见的包括：

- `max_quantity`（单笔订单允许的最大数量）
- `min_quantity`（单笔订单允许的最小数量）
- `max_notional`（单笔订单允许的最大名义价值）
- `min_notional`（单笔订单允许的最小名义价值）
- `max_price`（允许的最大报价或订单价格）
- `min_price`（允许的最小报价或订单价格）

:::note
大多数这些限制也会由 Nautilus 的 `RiskEngine` 进行校验，超出交易所发布的限制可能导致交易所拒单。
:::

## 价格与数量的创建（Prices and quantities）

合约对象还提供便捷方法，用于根据给定值创建合法的价格和数量：

```python
instrument = self.cache.instrument(instrument_id)

price = instrument.make_price(0.90500)
quantity = instrument.make_qty(150)
```

:::tip
以上方法是创建合法价格与数量的推荐方式，例如在将其传递给订单工厂（order factory）时使用。
:::

## 保证金与费用（Margins and fees）

保证金计算由 `MarginAccount` 类负责。下文说明了保证金的工作方式并介绍了关键概念。

### 何时适用保证金？

不同交易所（例如 CME 或 Binance）采用特定的账户类型来决定是否需要进行保证金计算。
在设置交易场所时，你需要指定以下账户类型之一：

- `AccountType.MARGIN`：适用保证金计算的账户类型
- `AccountType.CASH`：不适用保证金计算的现金账户
- `AccountType.BETTING`：用于博彩类型的账户，也不涉及保证金计算

### 术语说明（Vocabulary）

为便于理解保证金交易，先介绍若干关键术语：

**名义价值（Notional Value）**：以计价货币表示的合约总价值，代表你持仓的市场总价值。例如在 CME 的 EUR/USD 期货（代码 6E）：

- 每份合约代表 125,000 EUR（EUR 为 base，USD 为 quote）
- 若当前市场价为 1.1000，则名义价值为 125,000 EUR × 1.1000（EUR/USD 价格）= 137,500 USD

**杠杆（Leverage）**：决定相对于账户保证金你可以控制多少市值敞口的比率。例如 10× 杠杆意味着用 1,000 USD 的保证金可以控制 10,000 USD 的头寸。

**初始保证金（Initial Margin，`margin_init`）**：开仓所需的保证金率，表示在开仓前账户中需要满足的最低可用资金（这通常是一个预检，资金并非真正冻结）。

**维持保证金（Maintenance Margin，`margin_maint`）**：维持仓位所需的保证金率，此金额会在账户中被锁定以维持仓位，通常低于初始保证金。你可以在策略中通过以下接口查看被锁定的总保证金（对所有未平仓位的维持保证金求和）：

```python
self.portfolio.balances_locked(venue)
```

**Maker/Taker 费用**：交易所基于订单对市场的贡献类型收取的费用：

- Maker 费（`maker_fee`）：当你的挂单为订单簿提供流动性并最终成交时收取（通常较低）
- Taker 费（`taker_fee`）：当你的订单立即成交、移除流动性时收取（通常较高）

:::tip
并非所有交易所或合约都实现 maker/taker 费率。若不存在该机制，请在 `Instrument` 中将 `maker_fee` 与 `taker_fee` 都设为 0（例如对 `FuturesContract`、`Equity`、`CurrencyPair`、`Commodity`、`Cfd`、`BinaryOption`、`BettingInstrument`）。
:::

### 保证金计算公式

`MarginAccount` 使用如下公式计算保证金：

```python
# Initial margin calculation
margin_init = (notional_value / leverage * margin_init) + (notional_value / leverage * taker_fee)

# Maintenance margin calculation
margin_maint = (notional_value / leverage * margin_maint) + (notional_value / leverage * taker_fee)
```

要点说明：

- 两个公式结构相同，但分别使用对应的保证金率（`margin_init` 与 `margin_maint`）。
- 每个公式包括两部分：
  - **基础保证金计算**：基于名义价值、杠杆与保证金率
  - **费用调整**：将 maker/taker 费用纳入考虑

### 实现细节

若需查看具体实现，请参考：

- [nautilus_trader/accounting/accounts/margin.pyx](https://github.com/nautechsystems/nautilus_trader/blob/develop/nautilus_trader/accounting/accounts/margin.pyx)
- 关键方法：`calculate_margin_init(self, ...)` 与 `calculate_margin_maint(self, ...)`

## 佣金（Commissions）

交易佣金是交易所或经纪商为执行交易收取的费用。在加密市场常见 maker/taker 结构，而传统交易所（如 CME）常采用按合约计费的结构。
NautilusTrader 支持多种佣金模型以适配不同市场的费率结构。

### 内置费率模型

框架内提供两种常见的内置费率模型实现：

1. `MakerTakerFeeModel`：实现加密货币交易所常见的 maker/taker 费率结构，费用按成交金额的一定比例计算。
2. `FixedFeeModel`：按单笔交易收取固定费用，与交易规模无关。

### 自定义费率模型

尽管内置模型覆盖大多数场景，但某些交易所可能需要按合约收费等特殊结构。NautilusTrader 的可扩展架构允许通过继承基类 `FeeModel` 实现自定义费率模型。

例如，在如 CME 这类按合约收费的场景中，可以实现按合约计费的模型。注意 `FeeModel` 在内部为 Cython 实现，为了性能其方法参数命名采用了带类型前缀的命名约定（例如 `Order_order` 或 `Quantity_fill_qty`）。

下面示例展示了如何实现一个按合约计费的自定义模型（代码保持原样）：

```python
class PerContractFeeModel(FeeModel):
    def __init__(self, commission: Money):
        super().__init__()
        self.commission = commission

    def get_commission(self, Order_order, Quantity_fill_qty, Price_fill_px, Instrument_instrument):
        total_commission = Money(self.commission * Quantity_fill_qty, self.commission.currency)
        return total_commission
```

该实现通过将“每份合约的固定费用”乘以成交合约数量来计算总佣金。`get_commission(...)` 方法接收订单、成交数量、成交价格和合约等信息，从而支持灵活的佣金计算。

由于 `PerContractFeeModel` 继承自用 Cython 实现的 `FeeModel`，方法签名中会出现 Cython 风格的参数命名：

- `Order_order`：订单对象，带有类型前缀 `Order_`
- `Quantity_fill_qty`：成交数量，带有类型前缀 `Quantity_`
- `Price_fill_px`：成交价格，带有类型前缀 `Price_`
- `Instrument_instrument`：合约对象，带有类型前缀 `Instrument_`

这种命名约定虽然相比常规 Python 命名显得冗长，但有助于与框架中 Cython 代码保持一致性和类型清晰性。

### 在实际中使用费率模型

在设置交易场所（venue）时指定想要的费率模型（内置或自定义）。例如使用前述的按合约计费模型：

```python
from nautilus_trader.model.currencies import USD
from nautilus_trader.model.objects import Money, Currency

engine.add_venue(
    venue=venue,
    oms_type=OmsType.NETTING,
    account_type=AccountType.MARGIN,
    base_currency=USD,
    fee_model=PerContractFeeModel(Money(2.50, USD)),  # 2.50 USD per contract
    starting_balances=[Money(1_000_000, USD)],  # Starting with 1,000,000 USD balance
)
```

:::tip
实现自定义费率模型时，请确保模型与目标交易所的费率结构一致。即便是小幅差异，也可能在回测结果中对绩效度量产生显著影响。
:::

### 额外信息

交易所提供的原始合约定义（通常为 JSON 序列化数据）也会以通用的 Python 字典形式保留在合约对象中，便于在运行时通过 `.info` 属性访问那些并非统一 Nautilus API 一部分的额外信息。

## 合成（Synthetic）合约

平台支持创建自定义的合成合约（synthetic instruments），它们可以生成合成报价和成交，用途包括：

- 允许 `Actor` 与 `Strategy` 组件订阅合成的报价或成交流
- 触发仿真（emulated）订单
- 用合成报价/成交构建 K 线/Bar

合成合约不能被直接交易（它们仅在平台本地存在），主要作为分析工具，用来基于其组成合约计算有用的指标。

未来计划支持基于合成合约行为的订单管理——即根据合成合约的变化去交易其组成合约。

:::info
合成合约的 venue 恒定标记为 `'SYNTH'`。
:::

### 公式（Formula）

一个合成合约由两个或更多组成合约（可跨多个交易场所）以及一个“派生公式（derivation formula）”构成。
平台通过内嵌的动态表达式引擎（基于 Rust 的 [evalexpr](https://github.com/ISibboI/evalexpr) crate）来评估公式，从而根据各组成合约的最新价格计算出合成的最新价格 tick。

有关可用操作符与优先级的完整说明，请参阅 `evalexpr` 文档。

:::tip
在定义新的合成合约前，请确保所有组成合约已定义并存在于缓存中。
:::

### 订阅（Subscribing）

下面示例演示如何在 actor/strategy 中创建一个新的合成合约。该例子表示在 Binance 上 BTC 与 ETH 现货价之间的简单价差，假设 `BTCUSDT.BINANCE` 与 `ETHUSDT.BINANCE` 已存在缓存中。

```python
from nautilus_trader.model.instruments import SyntheticInstrument

btcusdt_binance_id = InstrumentId.from_str("BTCUSDT.BINANCE")
ethusdt_binance_id = InstrumentId.from_str("ETHUSDT.BINANCE")

# Define the synthetic instrument
synthetic = SyntheticInstrument(
    symbol=Symbol("BTC-ETH:BINANCE"),
    price_precision=8,
    components=[
        btcusdt_binance_id,
        ethusdt_binance_id,
    ],
    formula=f"{btcusdt_binance_id} - {ethusdt_binance_id}",
    ts_event=self.clock.timestamp_ns(),
    ts_init=self.clock.timestamp_ns(),
)

# Recommended to store the synthetic instruments ID somewhere
self._synthetic_id = synthetic.id

# Add the synthetic instrument for use by other components
self.add_synthetic(synthetic)

# Subscribe to quotes for the synthetic instrument
self.subscribe_quote_ticks(self._synthetic_id)
```

:::note
上例中合成合约的 `instrument_id` 将以 `{symbol}.{SYNTH}` 的格式生成，例如 `'BTC-ETH:BINANCE.SYNTH'`。
:::

### 更新公式（Updating formulas）

合成合约的公式可以随时更新。下面示例展示如何在 actor/strategy 中更新公式：

```
# 从缓存中取回合成合约（假设已保存 synthetic_id）
synthetic = self.cache.synthetic(self._synthetic_id)

# 更新公式，这里以计算平均值为例
new_formula = "(BTCUSDT.BINANCE + ETHUSDT.BINANCE) / 2"
synthetic.change_formula(new_formula)

# 提交合成合约的更新
self.update_synthetic(synthetic)
```

### 触发合约 ID（Trigger instrument IDs）

平台允许根据合成合约价格触发仿真订单。下面基于此前例子演示如何提交一个仿真订单：该订单将在仿真器中被保留，直到合成报价触发器释放它，然后以 MARKET 订单发送到 Binance。

```python
order = self.strategy.order_factory.limit(
    instrument_id=ETHUSDT_BINANCE.id,
    order_side=OrderSide.BUY,
    quantity=Quantity.from_str("1.5"),
    price=Price.from_str("30000.00000000"),  # <-- Synthetic instrument price
    emulation_trigger=TriggerType.DEFAULT,
    trigger_instrument_id=self._synthetic_id,  # <-- Synthetic instrument identifier
)

self.strategy.submit_order(order)
```

### 错误处理（Error handling）

对合成合约的输入（包括派生公式）已做了大量验证工作，但仍需谨慎。无效或错误的输入可能导致未定义行为。

:::info
详见 `SyntheticInstrument` 的 [API 参考](../api_reference/model/instruments.md#class-syntheticinstrument-1)，了解输入要求与可能抛出的异常。
:::
