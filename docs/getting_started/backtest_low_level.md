# 回测（低层 API） {#backtest-lowlevel-api}

`BacktestEngine` 提供对组件的直接访问：加载行情、接入策略与执行算法，
每一步都完全可控。本教程在模拟的 Binance Spot 交易所上，用历史逐笔成交数据
回测一个带 TWAP 执行算法的 EMA 交叉策略。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/getting_started/backtest_low_level.py)。

## 前置条件 {#prerequisites}
- Python 3.13-3.14
- 已安装 [NautilusTrader](https://pypi.org/project/nautilus_trader/) 2.x
  （`pip install -U --pre nautilus_trader`）。2.x 目前以 `2.0.0rcN` 发布，
  `--pre` 必不可少。
- pandas（`pip install pandas`），文末的报告会用到。wheel 没有声明运行时依赖。

```python
from decimal import Decimal

from nautilus_trader.backtest import BacktestEngine
from nautilus_trader.common import LogLevel
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import ExecutionAlgorithmConfig
from nautilus_trader.config import LoggerConfig
from nautilus_trader.config import StrategyConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.indicators import ExponentialMovingAverage
from nautilus_trader.model import AccountType
from nautilus_trader.model import Bar
from nautilus_trader.model import BarType
from nautilus_trader.model import Currency
from nautilus_trader.model import ExecAlgorithmId
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Money
from nautilus_trader.model import OmsType
from nautilus_trader.model import OrderSide
from nautilus_trader.model import TraderId
from nautilus_trader.model import Venue
from nautilus_trader.testkit.providers import TestDataProvider
from nautilus_trader.testkit.providers import TestInstrumentProvider
from nautilus_trader.trading import Strategy
```

## 加载数据 {#load-data}

加载示例测试数据（Binance 的 ETHUSDT 成交），初始化与之匹配的金融工具，
并从 CSV 构建 Nautilus 的 `TradeTick` 对象。`TestDataProvider` 在源码检出目录下
会读取本地 `test_data/` 中的 CSV，其他情况则从 GitHub 下载，因此 wheel 安装
需要联网。

```python
# Initialize the instrument which matches the data
ETHUSDT_BINANCE = TestInstrumentProvider.ethusdt_binance()

# Build Nautilus trade ticks from the sample Binance CSV
ticks = TestDataProvider.trades_from_binance_csv(
    ETHUSDT_BINANCE,
    "binance/ethusdt-trades.csv",
)
```

数据处理管道的细节见[数据](./../concepts/data/index.md)概念指南。

## 初始化引擎 {#initialize-the-engine}

传入 `BacktestEngineConfig` 配置引擎。这里设置了自定义 `trader_id` 来演示这一模式。

```python
# Configure backtest engine
config = BacktestEngineConfig(
    trader_id=TraderId("BACKTESTER-001"),
    logging=LoggerConfig(stdout_level=LogLevel.ERROR),
)

# Build the backtest engine
engine = BacktestEngine(config=config)
```

## 添加场所 {#add-a-venue}

配置一个与行情数据匹配的模拟场所。这里配置带现金账户的 Binance Spot 交易所。

```python
# Add a trading venue (multiple venues possible)
BINANCE = Venue("BINANCE")
engine.add_venue(
    venue=BINANCE,
    oms_type=OmsType.NETTING,
    account_type=AccountType.CASH,  # Spot CASH account (not for perpetuals or futures)
    base_currency=None,  # Multi-currency account
    starting_balances=[
        Money(1_000_000.0, Currency.from_str("USDT")),
        Money(10.0, Currency.from_str("ETH")),
    ],
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal("0.0001"),
        taker_rate=Decimal("0.0001"),
    ),
)
```

## 添加数据 {#add-data}

把工具与逐笔成交数据加入引擎。

```python
# Add instrument(s)
engine.add_instrument(ETHUSDT_BINANCE)

# Add data
engine.add_data(ticks)
```

:::note
可以添加多种数据类型（包括自定义类型），也可以跨多个场所回测。
:::

## 添加策略 {#add-strategies}

策略继承 `Strategy`，在 250-tick bar 上做 EMA 交叉交易，这些 bar 由引擎
从逐笔成交数据内部聚合而成。下单时带上 `exec_algorithm_id`，
引擎会把订单交给 TWAP 执行算法拆分。

```python
class EMACrossTWAPConfig(StrategyConfig):
    def __init__(
        self,
        *,
        instrument_id: InstrumentId,
        bar_type: BarType,
        trade_size: Decimal,
        fast_ema_period: int = 10,
        slow_ema_period: int = 20,
        twap_horizon_secs: float = 10.0,
        twap_interval_secs: float = 2.5,
        **_kwargs: object,
    ) -> None:
        super().__init__()
        self.instrument_id = instrument_id
        self.bar_type = bar_type
        self.trade_size = trade_size
        self.fast_ema_period = fast_ema_period
        self.slow_ema_period = slow_ema_period
        self.twap_horizon_secs = twap_horizon_secs
        self.twap_interval_secs = twap_interval_secs


class EMACrossTWAP(Strategy):
    def __init__(self, config: EMACrossTWAPConfig) -> None:
        super().__init__(config)
        self.fast_ema = ExponentialMovingAverage(config.fast_ema_period)
        self.slow_ema = ExponentialMovingAverage(config.slow_ema_period)
        self.exec_algorithm_id = ExecAlgorithmId("TWAP")
        self.exec_algorithm_params = {
            "horizon_secs": str(config.twap_horizon_secs),
            "interval_secs": str(config.twap_interval_secs),
        }

    def on_start(self) -> None:
        self.register_indicator_for_bars(self.config.bar_type, self.fast_ema)
        self.register_indicator_for_bars(self.config.bar_type, self.slow_ema)
        self.subscribe_bars(self.config.bar_type)

    def on_bar(self, _bar: Bar) -> None:
        if not self.indicators_initialized():
            return

        if self.fast_ema.value >= self.slow_ema.value:
            if self.portfolio.is_net_flat(self.config.instrument_id):
                self.buy()
            elif self.portfolio.is_net_short(self.config.instrument_id):
                self.close_all_positions(self.config.instrument_id)
                self.buy()
        elif self.fast_ema.value < self.slow_ema.value:
            if self.portfolio.is_net_flat(self.config.instrument_id):
                self.sell()
            elif self.portfolio.is_net_long(self.config.instrument_id):
                self.close_all_positions(self.config.instrument_id)
                self.sell()

    def buy(self) -> None:
        self.submit_twap_order(OrderSide.BUY)

    def sell(self) -> None:
        self.submit_twap_order(OrderSide.SELL)

    def submit_twap_order(self, side: OrderSide) -> None:
        instrument = self.cache.instrument(self.config.instrument_id)
        order = self.order_factory.market(
            self.config.instrument_id,
            side,
            instrument.make_qty(self.config.trade_size),
            exec_algorithm_id=self.exec_algorithm_id,
            exec_algorithm_params=self.exec_algorithm_params,
        )
        self.submit_order(order)

    def on_stop(self) -> None:
        self.close_all_positions(self.config.instrument_id)
```

```python
# Configure and add the strategy
strategy_config = EMACrossTWAPConfig(
    instrument_id=ETHUSDT_BINANCE.id,
    bar_type=BarType.from_str("ETHUSDT.BINANCE-250-TICK-LAST-INTERNAL"),
    trade_size=Decimal("0.10"),
    fast_ema_period=10,
    slow_ema_period=20,
    twap_horizon_secs=10.0,
    twap_interval_secs=2.5,
)

strategy = EMACrossTWAP(config=strategy_config)
engine.add_strategy(strategy=strategy)
```

策略配置里带了 TWAP 参数，但执行算法本身是独立的组件。

## 添加执行算法 {#add-execution-algorithms}

注册内置的 TWAP 执行算法，标识符为策略引用的 `TWAP`。

```python
# Add the native TWAP execution algorithm
engine.add_native_exec_algorithm(
    "TwapAlgorithm",
    ExecutionAlgorithmConfig(exec_algorithm_id=ExecAlgorithmId("TWAP")),
)
```

## 运行回测 {#run-the-backtest}

调用 `.run()` 处理全部数据。引擎按时间戳顺序重放事件，执行语义是确定性的。

```python
# Run the engine (from start to end of data)
engine.run()
```

## 运行后分析 {#post-run-analysis}

引擎在内存中保留数据与执行对象用于生成报告，同时输出带默认统计的
tearsheet；自定义统计见[组合统计](./../concepts/portfolio.md#portfolio-statistics)指南。

```python
engine.generate_account_report(BINANCE)
```

```python
engine.generate_order_fills_report()
```

```python
engine.generate_positions_report()
```

## 重复运行 {#repeated-runs}

重复运行时重置引擎。金融工具、数据与已加载的组件跨重置保留，
已加载组件的内部状态会被重置。

```python
# For repeated backtest runs, reset the engine
engine.reset()

# Clear loaded components before adding replacements.
```

按需清除并添加组件（actors、策略、执行算法）。

add 与 clear 方法见 [BacktestEngine](./../api_reference/backtest.md) API 参考。

```python
# Once done, good practice to dispose of the object if the script continues
engine.dispose()
```
