# 快速上手

本快速上手教程展示如何使用 NautilusTrader 对外汇（FX）数据进行回测，并快速启动一个示例环境。
为了节省时间，本教程提供了以 Nautilus 标准持久化格式（Parquet）预加载的示例数据。

## 前置条件

- 已安装 Python 3.11+。
- 已安装最新发布的 NautilusTrader（可通过 `pip install -U nautilus_trader` 安装）。
- 已安装 JupyterLab 或类似工具（可通过 `pip install -U jupyterlab` 安装）。

## 1. 获取示例数据

为方便起见，我们已准备好符合 Nautilus 数据格式的示例数据供本例使用。
运行下一个代码单元将下载并设置数据（大约需 1–2 分钟）。

更多关于如何将数据加载到 Nautilus 的细节，请参阅 [Loading External Data](../concepts/data#loading-data) 指南。

```python
import os
import urllib.request
from pathlib import Path

from nautilus_trader.persistence.catalog import ParquetDataCatalog
from nautilus_trader.persistence.wranglers import QuoteTickDataWrangler
from nautilus_trader.test_kit.providers import CSVTickDataLoader
from nautilus_trader.test_kit.providers import TestInstrumentProvider


# 切换到项目根目录
original_cwd = os.getcwd()
project_root = os.path.abspath(os.path.join(os.getcwd(), "..", ".."))
os.chdir(project_root)

print(f"Working directory: {os.getcwd()}")

# 创建 catalog 目录
catalog_path = Path("catalog")
catalog_path.mkdir(exist_ok=True)

print(f"Catalog directory: {catalog_path.absolute()}")

try:
    # 下载 EUR/USD 示例数据
    print("Downloading EUR/USD sample data...")
    url = "https://raw.githubusercontent.com/nautechsystems/nautilus_data/main/raw_data/fx_hist_data/DAT_ASCII_EURUSD_T_202001.csv.gz"
    filename = "EURUSD_202001.csv.gz"

    print(f"Downloading from: {url}")
    urllib.request.urlretrieve(url, filename)  # noqa: S310
    print("Download complete")

    # 使用当前 schema 创建 instrument（包含 multiplier）
    print("Creating EUR/USD instrument...")
    instrument = TestInstrumentProvider.default_fx_ccy("EUR/USD")

    # 加载并处理 tick 数据
    print("Loading tick data...")
    wrangler = QuoteTickDataWrangler(instrument)

    df = CSVTickDataLoader.load(
        filename,
        index_col=0,
        datetime_format="%Y%m%d %H%M%S%f",
    )
    df.columns = ["bid_price", "ask_price", "size"]
    print(f"Loaded {len(df)} ticks")

    # 处理 ticks
    print("Processing ticks...")
    ticks = wrangler.process(df)

    # 写入 catalog
    print("Writing data to catalog...")
    catalog = ParquetDataCatalog(str(catalog_path))

    # 先写入 instrument
    catalog.write_data([instrument])
    print("Instrument written to catalog")

    # 写入 tick 数据
    catalog.write_data(ticks)
    print("Tick data written to catalog")

    # 验证已写入内容
    print("\nVerifying catalog contents...")
    test_catalog = ParquetDataCatalog(str(catalog_path))
    loaded_instruments = test_catalog.instruments()
    print(f"Instruments in catalog: {[str(i.id) for i in loaded_instruments]}")

    # 清理下载文件
    os.unlink(filename)
    print("\nData setup complete!")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    os.chdir(original_cwd)
    print(f"Changed back to: {os.getcwd()}")
```

```python
from nautilus_trader.backtest.node import BacktestDataConfig
from nautilus_trader.backtest.node import BacktestEngineConfig
from nautilus_trader.backtest.node import BacktestNode
from nautilus_trader.backtest.node import BacktestRunConfig
from nautilus_trader.backtest.node import BacktestVenueConfig
from nautilus_trader.config import ImportableStrategyConfig
from nautilus_trader.config import LoggingConfig
from nautilus_trader.model import Quantity
from nautilus_trader.model import QuoteTick
from nautilus_trader.persistence.catalog import ParquetDataCatalog
```

## 2. 设置 Parquet 数据目录

如果前面的步骤执行成功，你应该能在 catalog 中看到单条 EUR/USD instrument。

```python
# 从项目根目录加载 catalog
project_root = os.path.abspath(os.path.join(os.getcwd(), "..", ".."))
catalog_path = os.path.join(project_root, "catalog")

catalog = ParquetDataCatalog(catalog_path)
instruments = catalog.instruments()

print(f"Loaded catalog from: {catalog_path}")
print(f"Available instruments: {[str(i.id) for i in instruments]}")

if instruments:
    print(f"\nUsing instrument: {instruments[0].id}")
else:
    print("\nNo instruments found. Please run the data download cell first.")
```

## 3. 编写交易策略

NautilusTrader 内置了许多常用指标。本例使用 MACD 指标来构建一个简单的交易策略。

可在此处阅读关于 [MACD 的更多说明](https://www.investopedia.com/terms/m/macd.asp)；该指标在本示例中仅用作演示，并非保证有超额收益（alpha）。你也可以注册指标以接收特定数据类型；但在本示例中，我们在 `on_quote_tick` 回调中手动将接收到的 `QuoteTick` 传递给指标。

```python
from nautilus_trader.core.message import Event
from nautilus_trader.indicators import MovingAverageConvergenceDivergence
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import Position
from nautilus_trader.model.enums import OrderSide
from nautilus_trader.model.enums import PositionSide
from nautilus_trader.model.enums import PriceType
from nautilus_trader.model.events import PositionClosed
from nautilus_trader.model.events import PositionOpened
from nautilus_trader.trading.strategy import Strategy
from nautilus_trader.trading.strategy import StrategyConfig


class MACDConfig(StrategyConfig):
    instrument_id: InstrumentId
    fast_period: int = 12
    slow_period: int = 26
    trade_size: int = 1_000_000


class MACDStrategy(Strategy):
    """基于 MACD 的策略，仅在零线交叉时进行交易。"""

    def __init__(self, config: MACDConfig):
        super().__init__(config=config)
        # 我们的“交易信号”
        self.macd = MovingAverageConvergenceDivergence(
            fast_period=config.fast_period, slow_period=config.slow_period, price_type=PriceType.MID
        )

        self.trade_size = Quantity.from_int(config.trade_size)

        # 跟踪持仓与 MACD 状态
        self.position: Position | None = None
        self.last_macd_above_zero = None  # 跟踪上次检查时 MACD 是否在零线上方

    def on_start(self):
        """策略启动时订阅行情数据。"""
        self.subscribe_quote_ticks(instrument_id=self.config.instrument_id)

    def on_stop(self):
        """策略停止时清理资源。"""
        self.close_all_positions(self.config.instrument_id)
        self.unsubscribe_quote_ticks(instrument_id=self.config.instrument_id)

    def on_quote_tick(self, tick: QuoteTick):
        """处理收到的 quote tick。"""
        # 更新指标
        self.macd.handle_quote_tick(tick)

        if not self.macd.initialized:
            return  # 等待指标预热完成

        # 检查交易信号
        self.check_signals()

    def on_event(self, event: Event):
        """处理持仓相关事件。"""
        if isinstance(event, PositionOpened):
            self.position = self.cache.position(event.position_id)
            self._log.info(f"Position opened: {self.position.side} @ {self.position.avg_px_open}")
        elif isinstance(event, PositionClosed):
            if self.position and self.position.id == event.position_id:
                self._log.info(f"Position closed with PnL: {self.position.realized_pnl}")
                self.position = None

    def check_signals(self):
        """仅在发生真正的交叉时才执行交易。"""
        current_macd = self.macd.value
        current_above_zero = current_macd > 0

        # 如果是首次读数则跳过
        if self.last_macd_above_zero is None:
            self.last_macd_above_zero = current_above_zero
            return

        # 仅在发生交叉时才采取行动
        if self.last_macd_above_zero != current_above_zero:
            if current_above_zero:  # 刚刚上穿零线
                # 仅在当前不是多头时才开多
                if not self.is_long:
                    # 如果当前是空头则先平仓
                    if self.is_short:
                        self.close_position(self.position)
                    # 平仓后再开多（仅在无仓位时）
                    self.go_long()

            else:  # 刚刚下穿零线
                # 仅在当前不是空头时才开空
                if not self.is_short:
                    # 如果当前是多头则先平仓
                    if self.is_long:
                        self.close_position(self.position)
                    # 平仓后再开空（仅在无仓位时）
                    self.go_short()

        self.last_macd_above_zero = current_above_zero

    def go_long(self):
        """在无仓位时开多。"""
        if self.is_flat:
            order = self.order_factory.market(
                instrument_id=self.config.instrument_id,
                order_side=OrderSide.BUY,
                quantity=self.trade_size,
            )
            self.submit_order(order)
            self._log.info(f"Going LONG - MACD crossed above zero: {self.macd.value:.6f}")

    def go_short(self):
        """在无仓位时开空。"""
        if self.is_flat:
            order = self.order_factory.market(
                instrument_id=self.config.instrument_id,
                order_side=OrderSide.SELL,
                quantity=self.trade_size,
            )
            self.submit_order(order)
            self._log.info(f"Going SHORT - MACD crossed below zero: {self.macd.value:.6f}")

    @property
    def is_flat(self) -> bool:
        """检查是否无仓位。"""
        return self.position is None

    @property
    def is_long(self) -> bool:
        """检查是否持有多头仓位。"""
        return self.position and self.position.side == PositionSide.LONG

    @property
    def is_short(self) -> bool:
        """检查是否持有空头仓位。"""
        return self.position and self.position.side == PositionSide.SHORT

    def on_dispose(self):
        """策略销毁时清理资源。"""
```

### 带止损/止盈的增强策略

上面的基础 MACD 策略会产生交易。为更好地管理风险，下面提供一个带止损（stop-loss）和止盈（take-profit）的增强版本：

```python
from nautilus_trader.model.objects import Price


class MACDEnhancedConfig(StrategyConfig):
    instrument_id: InstrumentId
    fast_period: int = 12
    slow_period: int = 26
    trade_size: int = 1_000_000
    entry_threshold: float = 0.00005
    exit_threshold: float = 0.00002
    stop_loss_pips: int = 20  # 以 pips 为单位的止损
    take_profit_pips: int = 40  # 以 pips 为单位的止盈


class MACDEnhancedStrategy(Strategy):
    """带止损与止盈的增强 MACD 策略。"""

    def __init__(self, config: MACDEnhancedConfig):
        super().__init__(config=config)
        self.macd = MovingAverageConvergenceDivergence(
            fast_period=config.fast_period, slow_period=config.slow_period, price_type=PriceType.MID
        )

        self.trade_size = Quantity.from_int(config.trade_size)
        self.position: Position | None = None
        self.last_macd_sign = 0

    def on_start(self):
        """策略启动时订阅行情数据。"""
        self.subscribe_quote_ticks(instrument_id=self.config.instrument_id)

    def on_stop(self):
        """策略停止时清理资源。"""
        self.cancel_all_orders(self.config.instrument_id)
        self.close_all_positions(self.config.instrument_id)
        self.unsubscribe_quote_ticks(instrument_id=self.config.instrument_id)

    def on_quote_tick(self, tick: QuoteTick):
        """处理收到的 quote tick。"""
        self.macd.handle_quote_tick(tick)

        if not self.macd.initialized:
            return

        self.check_signals(tick)

    def on_event(self, event: Event):
        """处理持仓相关事件。"""
        if isinstance(event, PositionOpened):
            self.position = self.cache.position(event.position_id)
            self._log.info(f"Position opened: {self.position.side} @ {self.position.avg_px_open}")
            # 下止损与止盈单
            self.place_exit_orders()
        elif isinstance(event, PositionClosed):
            if self.position and self.position.id == event.position_id:
                pnl = self.position.realized_pnl
                self._log.info(f"Position closed with PnL: {pnl}")
                self.position = None
                # 取消剩余的止损/止盈单
                self.cancel_all_orders(self.config.instrument_id)

    def check_signals(self, tick: QuoteTick):
        """检测 MACD 信号并管理持仓。"""
        current_macd = self.macd.value
        current_sign = 1 if current_macd > 0 else -1

        # 如果已有持仓则跳过
        if self.position:
            return

        # 检测 MACD 零线交叉
        if self.last_macd_sign != 0 and self.last_macd_sign != current_sign:
            if current_sign > 0:
                self.go_long(tick)
            else:
                self.go_short(tick)

        # 基于阈值的入场信号
        elif abs(current_macd) > self.config.entry_threshold:
            if current_macd > self.config.entry_threshold:
                self.go_long(tick)
            elif current_macd < -self.config.entry_threshold:
                self.go_short(tick)

        self.last_macd_sign = current_sign

    def go_long(self, tick: QuoteTick):
        """开多仓。"""
        if self.position:
            return  # 已有持仓

        order = self.order_factory.market(
            instrument_id=self.config.instrument_id,
            order_side=OrderSide.BUY,
            quantity=self.trade_size,
        )
        self.submit_order(order)
        self._log.info(f"Going LONG @ {tick.ask_price} - MACD: {self.macd.value:.6f}")

    def go_short(self, tick: QuoteTick):
        """开空仓。"""
        if self.position:
            return  # 已有持仓

        order = self.order_factory.market(
            instrument_id=self.config.instrument_id,
            order_side=OrderSide.SELL,
            quantity=self.trade_size,
        )
        self.submit_order(order)
        self._log.info(f"Going SHORT @ {tick.bid_price} - MACD: {self.macd.value:.6f}")

    def place_exit_orders(self):
        """为当前持仓下止损和止盈单。"""
        if not self.position:
            return

        entry_price = float(self.position.avg_px_open)
        pip_value = 0.0001  # 适用于 FX 货币对（不同品种需调整）

        if self.position.side == PositionSide.LONG:
            # 多头：止损在开仓价下方，目标在开仓价上方
            stop_price = entry_price - (self.config.stop_loss_pips * pip_value)
            target_price = entry_price + (self.config.take_profit_pips * pip_value)

            # 止损单
            stop_loss = self.order_factory.stop_market(
                instrument_id=self.config.instrument_id,
                order_side=OrderSide.SELL,
                quantity=self.trade_size,
                trigger_price=Price.from_str(f"{stop_price:.5f}"),
            )
            self.submit_order(stop_loss)

            # 止盈限价单
            take_profit = self.order_factory.limit(
                instrument_id=self.config.instrument_id,
                order_side=OrderSide.SELL,
                quantity=self.trade_size,
                price=Price.from_str(f"{target_price:.5f}"),
            )
            self.submit_order(take_profit)

            self._log.info(f"Placed LONG exit orders - Stop: {stop_price:.5f}, Target: {target_price:.5f}")

        else:  # 空头
            # 空头：止损在开仓价上方，目标在开仓价下方
            stop_price = entry_price + (self.config.stop_loss_pips * pip_value)
            target_price = entry_price - (self.config.take_profit_pips * pip_value)

            # 止损单
            stop_loss = self.order_factory.stop_market(
                instrument_id=self.config.instrument_id,
                order_side=OrderSide.BUY,
                quantity=self.trade_size,
                trigger_price=Price.from_str(f"{stop_price:.5f}"),
            )
            self.submit_order(stop_loss)

            # 止盈限价单
            take_profit = self.order_factory.limit(
                instrument_id=self.config.instrument_id,
                order_side=OrderSide.BUY,
                quantity=self.trade_size,
                price=Price.from_str(f"{target_price:.5f}"),
            )
            self.submit_order(take_profit)

            self._log.info(f"Placed SHORT exit orders - Stop: {stop_price:.5f}, Target: {target_price:.5f}")

    def on_dispose(self):
        """策略销毁时清理资源。"""
```

## 配置回测

现在我们有了策略与数据，就可以开始配置回测运行了。Nautilus 使用 `BacktestNode` 来协调回测执行，这需要一些配置步骤。初看起来可能有些复杂，但这是为了支持 Nautilus 的强大功能所必需的。

要配置 `BacktestNode`，首先需要创建一个 `BacktestRunConfig` 实例，至少配置以下几项：

- `engine`：表示核心系统的回测引擎，同时包含我们的策略。
- `venues`：回测中模拟的交易场所（交易所或经纪商）。
- `data`：我们希望用于回测的输入数据。

后续文档中描述了更多可配置的功能；当前这些设置足够帮助你快速运行回测。

```python
venue = BacktestVenueConfig(
    name="SIM",
    oms_type="NETTING",
    account_type="MARGIN",
    base_currency="USD",
    starting_balances=["1_000_000 USD"]
)
```

## 5. 配置数据

要加载哪些品种（instruments），可以通过 `ParquetDataCatalog` 查询。

```python
instruments = catalog.instruments()
instruments
```

接下来配置回测使用的数据。Nautilus 为回测提供了灵活的数据加载系统，但这种灵活性需要一定的配置。

对每种 tick 类型（以及每个 instrument），我们都需要添加一个 `BacktestDataConfig`。在本例中，我们仅为 EUR/USD 添加 `QuoteTick`：

```python
from nautilus_trader.model import QuoteTick


data = BacktestDataConfig(
    catalog_path=str(catalog.path),
    data_cls=QuoteTick,
    instrument_id=instruments[0].id,
    end_time="2020-01-10",
)
```

## 6. 配置引擎

创建一个 `BacktestEngineConfig` 来表示我们核心交易系统的配置。
传入交易策略、根据需要调整日志级别，并配置其它组件（默认配置通常已足够）。

通过 `ImportableStrategyConfig` 添加策略，该配置允许从任意文件或包中导入策略。在本例中，我们的 `MACDStrategy` 位于当前模块（Python 中的 `__main__`）。

```python
# NautilusTrader 在 Jupyter 中的日志输出会超过默认速率限制（stdout），
# 因此示例中把 `log_level` 设置为 "ERROR"。若将其调低以查看更多日志，notebook 可能会在执行单元时被挂起。
# 目前正在研究该问题的解决方案，包括提高 Jupyter 的速率限制或对 Nautilus 的日志刷新进行限流。
# https://github.com/jupyterlab/jupyterlab/issues/12845
# https://github.com/deshaw/jupyterlab-limit-output
engine = BacktestEngineConfig(
    strategies=[
        ImportableStrategyConfig(
            strategy_path="__main__:MACDStrategy",
            config_path="__main__:MACDConfig",
            config={
              "instrument_id": instruments[0].id,
              "fast_period": 12,
              "slow_period": 26,
            },
        )
    ],
    logging=LoggingConfig(log_level="ERROR"),
)
```

## 7. 运行回测

将前面准备好的配置项传入 `BacktestRunConfig`。该对象现在包含完整的回测配置。

```python
config = BacktestRunConfig(
    engine=engine,
    venues=[venue],
    data=[data],
)
```

`BacktestNode` 类负责协调回测执行。配置与执行分离使得 `BacktestNode` 能够运行多组配置（例如不同参数组合或多批数据）。现在我们可以运行回测了。

```python
from nautilus_trader.backtest.results import BacktestResult


node = BacktestNode(configs=[config])

 # 同步运行一或多组配置
results: list[BacktestResult] = node.run()
```

### 期望输出

使用上述增强版 MACD 策略回测时，你应能看到：

- 实际订单被执行（BUY/SELL）。
- 按正确的退出逻辑开仓和平仓。
- 盈亏（P&L）计算结果，展示盈亏情况。
- 一系列绩效指标，例如胜率（win rate）、利润因子（profit factor）等。

若未看到任何交易，请检查：

1. 数据时间范围（可能需要更多数据）。
2. 阈值参数（可能设置得过于严格）。
3. 指标的预热时间（MACD 需要时间初始化）。

## 8. 分析结果

回测结束后，你也可以通过运行配置 ID 查询 `BacktestNode` 内部使用的 `BacktestEngine` 实例，
从而获取更多报告与信息。

```python
from nautilus_trader.backtest.engine import BacktestEngine
from nautilus_trader.model import Venue


engine: BacktestEngine = node.get_engine(config.id)

len(engine.trader.generate_order_fills_report())
```

```python
engine.trader.generate_positions_report()
```

```python
engine.trader.generate_account_report(Venue("SIM"))
```

## 9. 绩效指标

我们可以添加一些额外的绩效统计，以更好地理解策略表现：

```python
# 获取绩效统计

# 获取账户与持仓
account = engine.trader.generate_account_report(Venue("SIM"))
positions = engine.trader.generate_positions_report()
orders = engine.trader.generate_order_fills_report()

# 打印总结统计
print("=== STRATEGY PERFORMANCE ===")
print(f"Total Orders: {len(orders)}")
print(f"Total Positions: {len(positions)}")

if len(positions) > 0:
    # 将 P&L 字符串转换为数值
    positions["pnl_numeric"] = positions["realized_pnl"].apply(
        lambda x: float(str(x).replace(" USD", "").replace(",", "")) if isinstance(x, str) else float(x)
    )

    # 计算胜率
    winning_trades = positions[positions["pnl_numeric"] > 0]
    losing_trades = positions[positions["pnl_numeric"] < 0]

    win_rate = len(winning_trades) / len(positions) * 100 if len(positions) > 0 else 0

    print(f"\nWin Rate: {win_rate:.1f}%")
    print(f"Winning Trades: {len(winning_trades)}")
    print(f"Losing Trades: {len(losing_trades)}")

    # 计算收益
    total_pnl = positions["pnl_numeric"].sum()
    avg_pnl = positions["pnl_numeric"].mean()
    max_win = positions["pnl_numeric"].max()
    max_loss = positions["pnl_numeric"].min()

    print(f"\nTotal P&L: {total_pnl:.2f} USD")
    print(f"Average P&L: {avg_pnl:.2f} USD")
    print(f"Best Trade: {max_win:.2f} USD")
    print(f"Worst Trade: {max_loss:.2f} USD")

    # 当存在盈利和亏损交易时计算风险指标
    if len(winning_trades) > 0 and len(losing_trades) > 0:
        avg_win = winning_trades["pnl_numeric"].mean()
        avg_loss = abs(losing_trades["pnl_numeric"].mean())
        profit_factor = winning_trades["pnl_numeric"].sum() / abs(losing_trades["pnl_numeric"].sum())

        print(f"\nAverage Win: {avg_win:.2f} USD")
        print(f"Average Loss: {avg_loss:.2f} USD")
        print(f"Profit Factor: {profit_factor:.2f}")
        print(f"Risk/Reward Ratio: {avg_win/avg_loss:.2f}")
else:
    print("\nNo positions generated. Check strategy parameters.")

print("\n=== FINAL ACCOUNT STATE ===")
print(account.tail(1).to_string())
```
