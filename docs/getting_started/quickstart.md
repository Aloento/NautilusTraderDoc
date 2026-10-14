# 快速上手 {#quickstart}

五分钟内跑通第一个回测。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/getting_started/quickstart.py)。

## 前置条件 {#prerequisites}

- Python 3.13-3.14
- 已安装 NautilusTrader 2.x（`pip install -U --pre nautilus_trader`）。2.x 目前以
  `2.0.0rcN` 发布，`--pre` 必不可少；不加的话 pip 会装 1.x 版本线，其 Python API
  不同，无法运行本页代码。
- NumPy 与 pandas（`pip install numpy pandas`）。wheel 没有声明运行时依赖，
  不会自动带上它们。

## 编写策略 {#write-a-strategy}

策略继承 `Strategy` 基类，覆写事件处理器来响应行情。这里的策略做 EMA 交叉交易：
快指数移动平均线上穿慢线时买入，下穿时卖出。

策略参数放在 `StrategyConfig` 子类上。自定义字段声明为仅关键字参数，其余交给
`**_kwargs` 吸收：基类配置会从同一次调用中读取自己的字段（`strategy_id`、
`oms_type` 等），并忽略不认识的字段。

```python
from decimal import Decimal

from nautilus_trader.config import StrategyConfig
from nautilus_trader.indicators import ExponentialMovingAverage
from nautilus_trader.model import Bar
from nautilus_trader.model import BarType
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OrderSide
from nautilus_trader.trading import Strategy


class EMACrossConfig(StrategyConfig):
    def __init__(
        self,
        *,
        instrument_id: InstrumentId,
        bar_type: BarType,
        trade_size: Decimal,
        fast_ema_period: int = 10,
        slow_ema_period: int = 20,
        **_kwargs: object,
    ) -> None:
        super().__init__()
        self.instrument_id = instrument_id
        self.bar_type = bar_type
        self.trade_size = trade_size
        self.fast_ema_period = fast_ema_period
        self.slow_ema_period = slow_ema_period


class EMACross(Strategy):
    def __init__(self, config: EMACrossConfig) -> None:
        super().__init__(config)
        self.fast_ema = ExponentialMovingAverage(config.fast_ema_period)
        self.slow_ema = ExponentialMovingAverage(config.slow_ema_period)

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
        instrument = self.cache.instrument(self.config.instrument_id)
        order = self.order_factory.market(
            self.config.instrument_id,
            OrderSide.BUY,
            instrument.make_qty(self.config.trade_size),
        )
        self.submit_order(order)

    def sell(self) -> None:
        instrument = self.cache.instrument(self.config.instrument_id)
        order = self.order_factory.market(
            self.config.instrument_id,
            OrderSide.SELL,
            instrument.make_qty(self.config.trade_size),
        )
        self.submit_order(order)

    def on_stop(self) -> None:
        self.close_all_positions(self.config.instrument_id)
```

`on_start` 注册两个 EMA 指标，引擎会随每根新 bar 自动更新它们。
`on_bar` 先等指标预热完成，再根据交叉信号开仓或反向持仓。

## 生成合成数据 {#generate-synthetic-data}

为了让快速上手不依赖外部数据，这里用随机游走生成 10,000 根合成的 EUR/USD
1 分钟 bar。实际工作中，应从数据商或 Parquet 数据目录加载真实行情。

```python
import numpy as np
import pandas as pd

from nautilus_trader.backtest import BacktestEngine
from nautilus_trader.common import LogLevel
from nautilus_trader.config import BacktestEngineConfig
from nautilus_trader.config import LoggerConfig
from nautilus_trader.execution import MakerTakerFeeModel
from nautilus_trader.model import AccountType
from nautilus_trader.model import Currency
from nautilus_trader.model import CurrencyPair
from nautilus_trader.model import Money
from nautilus_trader.model import OmsType
from nautilus_trader.model import Price
from nautilus_trader.model import Quantity
from nautilus_trader.model import Symbol
from nautilus_trader.model import Venue


# Create a EUR/USD instrument on the SIM venue
EUR = Currency.from_str("EUR")
USD = Currency.from_str("USD")
EURUSD = CurrencyPair(
    instrument_id=InstrumentId.from_str("EUR/USD.SIM"),
    raw_symbol=Symbol("EUR/USD"),
    base_currency=EUR,
    quote_currency=USD,
    price_precision=5,
    size_precision=0,
    price_increment=Price.from_str("0.00001"),
    size_increment=Quantity.from_int(1),
    ts_event=0,
    ts_init=0,
    lot_size=Quantity.from_int(1_000),
    margin_init=Decimal("0.03"),
    margin_maint=Decimal("0.03"),
)

# Generate synthetic 1-minute bars (random walk around 1.10)
rng = np.random.default_rng(42)
n = 10_000
price = 1.10 + np.cumsum(rng.normal(0, 0.0002, n))
spread = np.abs(rng.normal(0, 0.0003, n))
bars_df = pd.DataFrame(
    {
        "open": price,
        "high": price + spread,
        "low": price - spread,
        "close": price + rng.normal(0, 0.00005, n),
    },
    index=pd.date_range("2024-01-01", periods=n, freq="1min", tz="UTC"),
)
bars_df["high"] = bars_df[["open", "high", "close"]].max(axis=1)
bars_df["low"] = bars_df[["open", "low", "close"]].min(axis=1)

bar_type = BarType.from_str("EUR/USD.SIM-1-MINUTE-LAST-EXTERNAL")
bars = [
    Bar(
        bar_type=bar_type,
        open=Price(row.open, precision=EURUSD.price_precision),
        high=Price(row.high, precision=EURUSD.price_precision),
        low=Price(row.low, precision=EURUSD.price_precision),
        close=Price(row.close, precision=EURUSD.price_precision),
        volume=Quantity.from_int(1_000_000),
        ts_event=int(timestamp.value),
        ts_init=int(timestamp.value),
    )
    for timestamp, row in bars_df.iterrows()
]
```

每一行数据变成一根 `Bar`，价格精度取自金融工具的定义。bar 类型字符串
编码了金融工具、聚合周期、价格来源与数据来源。

## 配置并运行引擎 {#configure-and-run-the-engine}

创建 `BacktestEngine`，添加一个带保证金账户的模拟 FX 场所，接入金融工具、
数据和策略，然后运行。引擎按时间戳顺序处理所有 bar，执行语义是确定性的。

```python
engine = BacktestEngine(
    config=BacktestEngineConfig(
        logging=LoggerConfig(stdout_level=LogLevel.ERROR),
    ),
)

# Add a simulated FX venue
SIM = Venue("SIM")
engine.add_venue(
    venue=SIM,
    oms_type=OmsType.NETTING,
    account_type=AccountType.MARGIN,
    starting_balances=[Money(1_000_000, USD)],
    base_currency=USD,
    default_leverage=Decimal(1),
    fee_model=MakerTakerFeeModel(
        maker_rate=Decimal(0),
        taker_rate=Decimal(0),
    ),
)

# Add instrument, data, and strategy
engine.add_instrument(EURUSD)
engine.add_data(bars)

strategy = EMACross(
    EMACrossConfig(
        instrument_id=EURUSD.id,
        bar_type=bar_type,
        trade_size=Decimal(100000),
    ),
)
engine.add_strategy(strategy)

# Run the backtest
engine.run()
```

引擎按时间戳顺序处理全部 10,000 根 bar。每根 bar 先更新已注册的指标，再触发 `on_bar`。模拟交易所按当前价格成交市价单。

## 查看结果 {#review-results}

引擎基于完成的回测生成报告：账户报告展示余额随时间的变化，持仓报告逐条列出每个往返交易及其已实现盈亏，订单成交报告展示每一笔执行。

```python
engine.generate_account_report(venue=SIM)
```

```python
engine.generate_positions_report()
```

```python
engine.generate_order_fills_report()
```

## 下一步 {#next-steps}

- [回测（低层 API）](./backtest_low_level.md)：直接使用 `BacktestEngine`，配合真实行情与执行算法。
- [回测（高层 API）](./backtest_high_level.md)：用 `BacktestNode` 与 Parquet 数据目录做配置驱动的回测。
- [教程](./../tutorials/index.md)：策略模式实战讲解，覆盖做市、均值回归、订单簿失衡等。

```python
engine.dispose()
```
