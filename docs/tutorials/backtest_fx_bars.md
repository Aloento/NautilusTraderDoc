# 回测：FX bar 数据

本教程面向 NautilusTrader（高性能算法交易与事件驱动回测框架），演示如何使用 FX bar 数据设置一个单次（one-shot）回测，使用低阶 API 的 `BacktestEngine` 进行运行。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/tutorials/backtest_fx_bars.ipynb)。

:::info
本教程仍在编写中，部分内容可能会更新。
:::

## 概述

本教程展示如何用 FX bar 数据为 `BacktestEngine` 配置并执行一次性回测（one-shot backtest），适合对单个时间区间或样本数据做离线策略验证。

## 前置条件

- 已安装 Python 3.11+。
- 已安装 JupyterLab 或同类工具（`pip install -U jupyterlab`）。
- 已安装 NautilusTrader 最新发布版（`pip install -U nautilus_trader`）。

## 导入

下面是本教程余下部分所需的 import 列表：

```python
from decimal import Decimal

from nautilus_trader.backtest.config import BacktestEngineConfig
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.backtest.models import FillModel
from nautilus_trader.backtest.modules import FXRolloverInterestConfig
from nautilus_trader.backtest.modules import FXRolloverInterestModule
from nautilus_trader.config import LoggingConfig
from nautilus_trader.config import RiskEngineConfig
from nautilus_trader.examples.strategies.ema_cross import EMACross
from nautilus_trader.examples.strategies.ema_cross import EMACrossConfig
from nautilus_trader.model import BarType
from nautilus_trader.model import Money
from nautilus_trader.model import Venue
from nautilus_trader.model.currencies import JPY
from nautilus_trader.model.currencies import USD
from nautilus_trader.model.enums import AccountType
from nautilus_trader.model.enums import OmsType
from nautilus_trader.persistence.wranglers import QuoteTickDataWrangler
from nautilus_trader.test_kit.providers import TestDataProvider
from nautilus_trader.test_kit.providers import TestInstrumentProvider
```

## 创建 BacktestEngine 配置

```python
# 初始化回测配置
config = BacktestEngineConfig(
    trader_id="BACKTESTER-001",
    logging=LoggingConfig(log_level="ERROR"),
    risk_engine=RiskEngineConfig(
        bypass=True,  # 在回测中示例性地绕过 pre-trade 风控检查
    ),
)

# 构建 BacktestEngine
engine = BacktestEngine(config=config)
```

## 添加仿真模块（可选）

可选地，我们可以插入一个模块来模拟 rollover interest（隔夜利息）。示例数据可从预打包的测试数据中读取。

```python
provider = TestDataProvider()
interest_rate_data = provider.read_csv("short-term-interest.csv")
config = FXRolloverInterestConfig(interest_rate_data)
fx_rollover_interest = FXRolloverInterestModule(config=config)
```

## 添加 fill model

本示例使用一个简单的概率型 fill model。

```python
fill_model = FillModel(
    prob_fill_on_limit=0.2,
    prob_fill_on_stop=0.95,
    prob_slippage=0.5,
    random_seed=42,
)
```

## 添加交易场所（venue）

示例中我们只需要一个模拟的 FX ECN 作为交易场所。

```python
SIM = Venue("SIM")
engine.add_venue(
    venue=SIM,
    oms_type=OmsType.HEDGING,  # venue 将生成 position IDs
    account_type=AccountType.MARGIN,
    base_currency=None,  # 多币种账户
    starting_balances=[Money(1_000_000, USD), Money(10_000_000, JPY)],
    fill_model=fill_model,
    modules=[fx_rollover_interest],
)
```

## 添加合约与数据

接下来添加合约与数据。本回测示例将把 bid / ask 的 bar 数据预处理为 quotes，使用 `QuoteTickDataWrangler`。

```python
# 添加合约
USDJPY_SIM = TestInstrumentProvider.default_fx_ccy("USD/JPY", SIM)
engine.add_instrument(USDJPY_SIM)

# 添加数据
wrangler = QuoteTickDataWrangler(instrument=USDJPY_SIM)
ticks = wrangler.process_bar_data(
    bid_data=provider.read_csv_bars("fxcm/usdjpy-m1-bid-2013.csv"),
    ask_data=provider.read_csv_bars("fxcm/usdjpy-m1-ask-2013.csv"),
)
engine.add_data(ticks)
```

## 配置策略

然后配置并初始化一个简单的 `EMACross` 策略，用于本次回测。

```python
# 策略配置
config = EMACrossConfig(
    instrument_id=USDJPY_SIM.id,
    bar_type=BarType.from_str("USD/JPY.SIM-5-MINUTE-BID-INTERNAL"),
    fast_ema_period=10,
    slow_ema_period=20,
    trade_size=Decimal(1_000_000),
)

# 实例化并添加策略
strategy = EMACross(config=config)
engine.add_strategy(strategy=strategy)
```

## 运行回测

现在已准备好运行回测。引擎跑完所有数据并完成后，会记录一份事后分析报告。

```python
engine.run()
```

## 生成报告

还可以生成多种报告以便进一步分析回测结果：

```python
engine.trader.generate_account_report(SIM)
```

```python
engine.trader.generate_order_fills_report()
```

```python
engine.trader.generate_positions_report()
```
