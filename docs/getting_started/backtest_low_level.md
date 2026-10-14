# 回测（低级 API）

本教程面向 NautilusTrader（高性能算法交易平台与事件驱动回测器），演示如何使用低级 API —— `BacktestEngine` —— 在模拟的 Binance 现货（Spot）交易所上，使用历史成交（trade tick）数据回测一个带有 TWAP 执行算法的简单 EMA（指数移动平均）交叉策略。

[在 GitHub 查看源码](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/getting_started/backtest_low_level.ipynb)。

## 概述

本教程将覆盖以下内容：

- 使用数据加载器（data loaders）和 wranglers 读取原始数据（外部于 Nautilus）。
- 将这些数据添加到 `BacktestEngine`。
- 向 `BacktestEngine` 添加交易场所（venues）、策略（strategies）和执行算法（execution algorithms）。
- 使用 `BacktestEngine` 运行回测。
- 运行后分析（post-run analysis）以及重复运行（repeated runs）。

## 前置条件

- 已安装 Python 3.11+。
- 已安装 JupyterLab 或同类工具（可用 `pip install -U jupyterlab` 安装）。
- 已安装最新版本的 NautilusTrader（可用 `pip install -U nautilus_trader` 安装）。

## 导入（Imports）

下面列出本教程余下部分所需的所有 import：

```python
from decimal import Decimal

from nautilus_trader.backtest.config import BacktestEngineConfig
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.examples.algorithms.twap import TWAPExecAlgorithm
from nautilus_trader.examples.strategies.ema_cross_twap import EMACrossTWAP
from nautilus_trader.examples.strategies.ema_cross_twap import EMACrossTWAPConfig
from nautilus_trader.model import BarType
from nautilus_trader.model import Money
from nautilus_trader.model import TraderId
from nautilus_trader.model import Venue
from nautilus_trader.model.currencies import ETH
from nautilus_trader.model.currencies import USDT
from nautilus_trader.model.enums import AccountType
from nautilus_trader.model.enums import OmsType
from nautilus_trader.persistence.wranglers import TradeTickDataWrangler
from nautilus_trader.test_kit.providers import TestDataProvider
from nautilus_trader.test_kit.providers import TestInstrumentProvider
```

## 加载数据

本教程使用 NautilusTrader 仓库中的示例（stub）测试数据（自动化测试套件也使用这些数据来验证平台功能）。

首先，实例化一个数据提供器（data provider），把原始的 CSV 成交 tick 数据读取到内存中的 `pd.DataFrame`。
然后初始化与数据匹配的 `Instrument`（本例中为 Binance 的现货交易对 `ETHUSDT`），并在整个回测中重复使用该 instrument 对象。

接着使用 wrangler 将数据整理为一系列 Nautilus 的 `TradeTick` 对象，这样就可以把它们添加到 `BacktestEngine` 中。

```python
# Load stub test data
provider = TestDataProvider()
trades_df = provider.read_csv_ticks("binance/ethusdt-trades.csv")

# Initialize the instrument which matches the data
ETHUSDT_BINANCE = TestInstrumentProvider.ethusdt_binance()

# Process into Nautilus objects
wrangler = TradeTickDataWrangler(instrument=ETHUSDT_BINANCE)
ticks = wrangler.process(trades_df)
```

更多关于数据加载和典型处理流程的说明，请参见 [Loading External Data](../concepts/data#loading-data) 指南。

## 初始化 Backtest Engine

创建一个回测引擎（BacktestEngine）。直接调用 `BacktestEngine()` 会用默认配置实例化一个引擎。

这里我们也演示如何初始化 `BacktestEngineConfig`（示例中仅自定义了 `trader_id`），以说明常见的配置模式。

有关所有可用配置选项的详细信息，请参见 [Configuration](https://nautilustrader.io/docs/api_reference/config) API 参考。

```python
# Configure backtest engine
config = BacktestEngineConfig(trader_id=TraderId("BACKTESTER-001"))

# Build the backtest engine
engine = BacktestEngine(config=config)
```

## 添加交易场所（venues）

为要与之匹配的市场数据创建一个交易场所。

本例中我们建立了一个模拟的 Binance 现货交易场所。

```python
# Add a trading venue (multiple venues possible)
BINANCE = Venue("BINANCE")
engine.add_venue(
    venue=BINANCE,
    oms_type=OmsType.NETTING,
    account_type=AccountType.CASH,  # Spot CASH account (not for perpetuals or futures)
    base_currency=None,  # Multi-currency account
    starting_balances=[Money(1_000_000.0, USDT), Money(10.0, ETH)],
)
```

## 添加数据

把数据添加到回测引擎。首先添加之前初始化的 `Instrument` 对象，以便与数据对应。

然后添加我们用 wrangler 处理得到的 trades（ticks）。

```python
# Add instrument(s)
engine.add_instrument(ETHUSDT_BINANCE)

# Add data
engine.add_data(ticks)
```

:::note
可用的数据类型和数量仅受机器资源与你的想象力限制（也可以使用自定义数据类型）。
你也可以在多交易场所上进行回测，同样受限于机器资源。
:::

## 添加策略

把计划运行的交易策略添加到系统中。

:::note
可以同时回测多种策略和多种品种；唯一的限制是机器资源。
:::

先初始化策略配置（strategy config），然后用配置创建策略实例并添加到引擎：

```python
# Configure your strategy
strategy_config = EMACrossTWAPConfig(
    instrument_id=ETHUSDT_BINANCE.id,
    bar_type=BarType.from_str("ETHUSDT.BINANCE-250-TICK-LAST-INTERNAL"),
    trade_size=Decimal("0.10"),
    fast_ema_period=10,
    slow_ema_period=20,
    twap_horizon_secs=10.0,
    twap_interval_secs=2.5,
)

# Instantiate and add your strategy
strategy = EMACrossTWAP(config=strategy_config)
engine.add_strategy(strategy=strategy)
```

你会注意到该策略配置包含了与 TWAP 执行算法相关的参数。
虽然可以在每次下单时灵活使用不同参数，但仍然需要初始化并添加实际负责执行算法的 `ExecAlgorithm` 组件。

## 添加执行算法（execution algorithms）

NautilusTrader 允许你构建由自定义组件组成的复杂系统；这里示例一个内置组件：TWAP 执行算法。使用与添加策略类似的模式配置并加入引擎即可。

:::note
可以回测多种执行算法；限制仍然是机器资源。
:::

```python
# Instantiate and add your execution algorithm
exec_algorithm = TWAPExecAlgorithm()  # Using defaults
engine.add_exec_algorithm(exec_algorithm)
```

## 运行回测

在配置好数据、交易场所和交易系统后，运行回测。默认情况下调用 `.run(...)` 方法会处理所有可用数据。

有关所有方法和选项的完整描述，请参见 [BacktestEngineConfig](https://nautilustrader.io/docs/latest/api_reference/config) API 参考。

```python
# Run the engine (from start to end of data)
engine.run()
```

## 运行后分析（Post-run）

回测完成后，引擎会自动记录一份运行后报告（tearsheet），包含默认统计数据（或你加载的自定义统计；详见高级的 [Portfolio statistics](../concepts/portfolio.md#portfolio-statistics) 指南）。

引擎还会在内存中保留许多数据与执行对象，便于你生成额外的性能分析报告。

```python
engine.trader.generate_account_report(BINANCE)
```

```python
engine.trader.generate_order_fills_report()
```

```python
engine.trader.generate_positions_report()
```

## 重复运行（Repeated runs）

你可以通过重置引擎来进行不同策略或组件配置的重复回测。
调用 `.reset(...)` 方法会保留已加载的数据和组件，同时重置其它有状态的值，就像是一个新的 `BacktestEngine`，这样可以避免重复加载相同的数据。

```python
# For repeated backtest runs make sure to reset the engine
engine.reset()
```

按需移除或添加各类组件（actors、strategies、execution algorithms）。

有关可用方法的详细说明，请参见 [Trader](../api_reference/trading.md) API 参考。

```python
# Once done, good practice to dispose of the object if the script continues
engine.dispose()
```
