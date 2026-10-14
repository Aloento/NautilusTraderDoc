# Indicators

The indicator subpackage provides a set of efficient indicators and analyzers.

These are classes which can be used for signal discovery and filtering. The idea is to use the provided indicators as is, or as inspiration for a trader to implement their own proprietary indicator algorithms with the platform.

### _class_ AdaptiveMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

AdaptiveMovingAverage(int period_er, int period_alpha_fast, int period_alpha_slow, PriceType price_type=PriceType.LAST)

An indicator which calculates an adaptive moving average (AMA) across a rolling window. Developed by Perry Kaufman, the AMA is a moving average designed to account for market noise and volatility. The AMA will closely follow prices when the price swings are relatively small and the noise is low. The AMA will increase lag when the price swings increase.

- **Parameters:**
  - **period_er** (​_int_​) – The period for the internal EfficiencyRatio indicator (> 0).
  - **period_alpha_fast** (​_int_​) – The period for the fast smoothing constant (> 0).
  - **period_alpha_slow** (​_int_​) – The period for the slow smoothing constant (> 0 < alpha_fast).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.

#### alpha_diff

The alpha difference value.

- **Returns:** double

#### alpha_fast

The alpha fast value.

- **Returns:** double

#### alpha_slow

The alpha slow value.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### period_alpha_fast

The period of the fast smoothing constant.

- **Returns:** double

#### period_alpha_slow

The period of the slow smoothing constant.

- **Returns:** double

#### period_er

The period of the internal EfficiencyRatio indicator.

- **Returns:** double

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ ArcherMovingAveragesTrends

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

ArcherMovingAveragesTrends(int fast_period, int slow_period, int signal_period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL)

Archer Moving Averages Trends indicator.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast moving average (> 0).
  - **slow_period** (​_int_​) – The period for the slow moving average (> 0 & > fast_sma).
  - **signal_period** (​_int_​) – The period for lookback price array (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### long_run

#### short_run

#### signal_period

#### slow_period

#### update_raw(self, double close) → void

Update the indicator with the given close price value.

- **Parameters:** **close** (​_double_​) – The close price.

### _class_ AroonOscillator

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

AroonOscillator(int period)

The Aroon (AR) indicator developed by Tushar Chande attempts to determine whether an instrument is trending, and how strong the trend is. AroonUp and AroonDown lines make up the indicator with their formulas below.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (> 0).

#### aroon_down

The current aroon down value.

- **Returns:** double

#### aroon_up

The current aroon up value.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

The window period.

- **Returns:** int

#### update_raw(self, double high, double low) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.

#### value

The current value.

- **Returns:** double

### _class_ AverageTrueRange

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

AverageTrueRange(int period, MovingAverageType ma_type=MovingAverageType.SIMPLE, bool use_previous=True, double value_floor=0)

An indicator which calculates the average true range across a rolling window. Different moving average types can be selected for the inner calculation.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used. (note: only applicable for update(). update_mid() will need to use previous price.
  - **value_floor** (​_double_​) – The floor (minimum) output value for the indicator (>= 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

The window period.

- **Returns:** int

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

The current value.

- **Returns:** double

### _class_ Bias

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Bias(int period, MovingAverageType ma_type=MovingAverageType.SIMPLE)

Rate of change between the source and a moving average.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### update_raw(self, double close) → void

Update the indicator with the given raw values.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ BollingerBands

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

BollingerBands(int period, double k, MovingAverageType ma_type=MovingAverageType.SIMPLE)

A Bollinger Band® is a technical analysis tool defined by a set of trend lines plotted two standard deviations (positively and negatively) away from a simple moving average (SMA) of an instruments price, which can be adjusted to user preferences.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **k** (​_double_​) – The standard deviation multiple for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator.
- **Raises:**
  - **ValueError** – If period is not positive (> 0).
  - **ValueError** – If k is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### k

The standard deviation multiple.

- **Returns:** double

#### lower

The current value of the lower band.

- **Returns:** double

#### middle

The current value of the middle band.

- **Returns:** double

#### period

The period for the moving average.

- **Returns:** int

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given prices.

- **Parameters:**
  - **high** (​_double_​) – The high price for calculations.
  - **low** (​_double_​) – The low price for calculations.
  - **close** (​_double_​) – The closing price for calculations

#### upper

The current value of the upper band.

- **Returns:** double

### _class_ CandleBodySize

Bases: `IntFlag`

#### BODY*NONE*= 0\_

#### BODY*SMALL*= 1\_

#### BODY*MEDIUM*= 2\_

#### BODY*LARGE*= 3\_

#### BODY*TREND*= 4\_

### _class_ CandleDirection

Bases: `IntFlag`

#### DIRECTION*BEAR*= -1\_

#### DIRECTION*NONE*= 0\_

#### DIRECTION*BULL*= 1\_

### _class_ CandleSize

Bases: `IntFlag`

#### SIZE*NONE*= 0\_

#### SIZE*VERY_SMALL*= 1\_

#### SIZE*SMALL*= 2\_

#### SIZE*MEDIUM*= 3\_

#### SIZE*LARGE*= 4\_

#### SIZE*VERY_LARGE*= 5\_

#### SIZE*EXTREMELY_LARGE*= 6\_

### _class_ CandleWickSize

Bases: `IntFlag`

#### WICK*NONE*= 0\_

#### WICK*SMALL*= 1\_

#### WICK*MEDIUM*= 2\_

#### WICK*LARGE*= 3\_

### _class_ ChandeMomentumOscillator

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

ChandeMomentumOscillator(int period, ma_type=None)

Attempts to capture the momentum of an asset with overbought at 50 and oversold at -50.

- **Parameters:**
  - **ma_type** (​_int_​) – The moving average type for average gain/loss.
  - **period** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The rolling window period for the indicator.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

The window period.

- **Returns:** int

#### update_raw(self, double close) → void

Update the indicator with the given value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current value.

- **Returns:** double

### _class_ CommodityChannelIndex

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

CommodityChannelIndex(int period, double scalar=0.015, ma_type=None)

Commodity Channel Index is a momentum oscillator used to primarily identify overbought and oversold levels relative to a mean.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **scalar** (​_double_​) – A positive float to scale the bands
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for prices.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### scalar

The positive float to scale the bands.

- **Returns:** double

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

The current value.

- **Returns:** double

### _class_ DirectionalMovement

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

DirectionalMovement(int period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL)

Two oscillators that capture positive and negative trend movement.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### neg

#### period

#### pos

#### update_raw(self, double high, double low) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.

#### value

### _class_ DonchianChannel

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

DonchianChannel(int period)

Donchian Channels are three lines generated by moving average calculations that comprise an indicator formed by upper and lower bands around a mid-range or median band. The upper band marks the highest price of a instrument_id over N periods while the lower band marks the lowest price of a instrument_id over N periods. The area between the upper and lower bands represents the Donchian Channel.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (> 0).
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given ticks high and low prices.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given ticks price.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### lower

#### middle

#### period

#### update_raw(self, double high, double low) → void

Update the indicator with the given prices.

- **Parameters:**
  - **high** (​_double_​) – The price for the upper channel.
  - **low** (​_double_​) – The price for the lower channel.

#### upper

### _class_ DoubleExponentialMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

DoubleExponentialMovingAverage(int period, PriceType price_type=PriceType.LAST)

The Double Exponential Moving Average attempts to a smoother average with less lag than the normal Exponential Moving Average (EMA).

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ EfficiencyRatio

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

EfficiencyRatio(int period)

An indicator which calculates the efficiency ratio across a rolling window. The Kaufman Efficiency measures the ratio of the relative market speed in relation to the volatility, this could be thought of as a proxy for noise.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (>= 2).
- **Raises:** **ValueError** – If period is not >= 2.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

The window period.

- **Returns:** int

#### update_raw(self, double price) → void

Update the indicator with the given price.

- **Parameters:** **price** (​_double_​) – The update price.

#### value

The current value.

- **Returns:** double

### _class_ ExponentialMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

ExponentialMovingAverage(int period, PriceType price_type=PriceType.LAST)

An indicator which calculates an exponential moving average across a rolling window.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### alpha

The moving average alpha value.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ FuzzyCandle

Bases: `object`

FuzzyCandle(CandleDirection direction, CandleSize size, CandleBodySize body_size, CandleWickSize upper_wick_size, CandleWickSize lower_wick_size)

Represents a fuzzy candle.

- **Parameters:**
  - **direction** ([_CandleDirection_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleDirection)) – The candle direction.
  - **size** ([_CandleSize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleSize)) – The candle fuzzy size.
  - **body_size** ([_CandleBodySize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleBodySize)) – The candle fuzzy body size.
  - **upper_wick_size** ([_CandleWickSize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleWickSize)) – The candle fuzzy upper wick size.
  - **lower_wick_size** ([_CandleWickSize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleWickSize)) – The candle fuzzy lower wick size.

#### body_size

The candles fuzzy body size.

- **Returns:** CandleBodySize

#### direction

The candles close direction.

- **Returns:** CandleDirection

#### lower_wick_size

The candles fuzzy lower wick size.

- **Returns:** CandleWickSize

#### size

The candles fuzzy overall size.

- **Returns:** CandleSize

#### upper_wick_size

The candles fuzzy upper wick size.

- **Returns:** CandleWickSize

### _class_ FuzzyCandlesticks

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

FuzzyCandlesticks(int period, double threshold1=0.5, double threshold2=1.0, double threshold3=2.0, double threshold4=3.0)

An indicator which fuzzifies bar data to produce fuzzy candlesticks. Bar data is dimensionally reduced via fuzzy feature extraction.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **threshold1** (​_float_​) – The membership function x threshold1 (>= 0).
  - **threshold2** (​_float_​) – The membership function x threshold2 (> threshold1).
  - **threshold3** (​_float_​) – The membership function x threshold3 (> threshold2).
  - **threshold4** (​_float_​) – The membership function x threshold4 (> threshold3).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar.** (​_The update_​)

#### period

The window period.

- **Returns:** int

#### update_raw(self, double open, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **open** (​_double_​) – The open price.
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

The last fuzzy candle.

- **Returns:** FuzzyCandle

#### vector

The fuzzy candle represented as a vector of ints.

- **Returns:** list[int]

### _class_ HullMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

HullMovingAverage(int period, PriceType price_type=PriceType.LAST)

An indicator which calculates a Hull Moving Average (HMA) across a rolling window. The HMA, developed by Alan Hull, is an extremely fast and smooth moving average.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ Indicator

Bases: `object`

Indicator(list params)

The base class for all indicators.

- **Parameters:** **params** (​_list_​) – The initialization parameters for the indicator.

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### handle_bar(self, Bar bar) → void

Abstract method (implement in subclass).

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

### _class_ KeltnerChannel

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

KeltnerChannel(int period, double k_multiplier, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, MovingAverageType ma_type_atr=MovingAverageType.SIMPLE, bool use_previous=True, double atr_floor=0)

The Keltner channel is a volatility based envelope set above and below a central moving average. Traditionally the middle band is an EMA based on the typical price (high + low + close) / 3, the upper band is the middle band plus the ATR. The lower band is the middle band minus the ATR.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **k_multiplier** (​_double_​) – The multiplier for the ATR (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the middle band (cannot be None).
  - **ma_type_atr** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the internal ATR (cannot be None).
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used.
  - **atr_floor** (​_double_​) – The ATR floor (minimum) output value for the indicator (>= 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### k_multiplier

#### lower

#### middle

#### period

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### upper

### _class_ KeltnerPosition

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

KeltnerPosition(int period, double k_multiplier, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, MovingAverageType ma_type_atr=MovingAverageType.SIMPLE, bool use_previous=True, double atr_floor=0)

An indicator which calculates the relative position of the given price within a defined Keltner channel. This provides a measure of the relative ‘extension’ of a market from the mean, as a multiple of volatility.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **k_multiplier** (​_double_​) – The multiplier for the ATR (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the middle band (cannot be None).
  - **ma_type_atr** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the internal ATR (cannot be None).
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used.
  - **atr_floor** (​_double_​) – The ATR floor (minimum) output value for the indicator (>= 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### k_multiplier

#### period

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw value.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

### _class_ KlingerVolumeOscillator

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

KlingerVolumeOscillator(int fast_period, int slow_period, int signal_period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL)

This indicator was developed by Stephen J. Klinger. It is designed to predict price reversals in a market by comparing volume to price.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast moving average (> 0).
  - **slow_period** (​_int_​) – The period for the slow moving average (> 0 & > fast_sma).
  - **signal_period** (​_int_​) – The period for the moving average difference’s moving average (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### signal_period

#### slow_period

#### update_raw(self, double high, double low, double close, double volume) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.
  - **volume** (​_double_​) – The volume.

#### value

### _class_ LinearRegression

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

LinearRegression(int period=0)

An indicator that calculates a simple linear regression.

- **Parameters:** **period** (​_int_​) – The period for the indicator.
- **Raises:** **ValueError** – If period is not greater than zero.

#### R2

#### cfo

#### degree

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### intercept

#### period

#### slope

#### update_raw(self, double close) → void

Update the indicator with the given raw values.

- **Parameters:** **close_price** (​_double_​) – The close price.

#### value

### _class_ MovingAverage

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

MovingAverage(int period, list params, PriceType price_type)

The base class for all moving average type indicators.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **params** (​_list_​) – The initialization parameters for the indicator.
  - **price_type** (_PriceType_ _,_ ​_optional_​) – The specified price type for extracting values from quotes.

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ MovingAverageConvergenceDivergence

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

MovingAverageConvergenceDivergence(int fast_period, int slow_period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, PriceType price_type=PriceType.LAST)

An indicator which calculates the difference between two moving averages. Different moving average types can be selected for the inner calculation.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast moving average (> 0).
  - **slow_period** (​_int_​) – The period for the slow moving average (> 0 & > fast_sma).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:**
  - **ValueError** – If fast_period is not positive (> 0).
  - **ValueError** – If slow_period is not positive (> 0).
  - **ValueError** – If fast_period is not < slow_period.

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### slow_period

#### update_raw(self, double close) → void

Update the indicator with the given close price.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ MovingAverageFactory

Bases: `object`

Provides a factory to construct different moving average indicators.

#### _static_ create(int period, MovingAverageType ma_type: MovingAverageType, \*\*kwargs) → [MovingAverage](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverage)

Create a moving average indicator corresponding to the given ma_type.

- **Parameters:**
  - **period** (​_int_​) – The period of the moving average (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type.
- **Return type:** [MovingAverage](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverage)
- **Raises:** **ValueError** – If period is not positive (> 0).

### _class_ MovingAverageType

Bases: `IntFlag`

#### SIMPLE _= 0_

#### EXPONENTIAL _= 1_

#### DOUBLE*EXPONENTIAL*= 2\_

#### WILDER _= 3_

#### HULL _= 4_

#### ADAPTIVE _= 5_

#### WEIGHTED _= 6_

#### VARIABLE*INDEX_DYNAMIC*= 7\_

### _class_ OnBalanceVolume

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

OnBalanceVolume(int period=0)

An indicator which calculates the momentum of relative positive or negative volume.

- **Parameters:** **period** (​_int_​) – The period for the indicator, zero indicates no window (>= 0).
- **Raises:** **ValueError** – If period is negative (< 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### update_raw(self, double open, double close, double volume) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **open** (​_double_​) – The high price.
  - **close** (​_double_​) – The low price.
  - **volume** (​_double_​) – The close price.

#### value

### _class_ Pressure

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Pressure(int period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, double atr_floor=0)

An indicator which calculates the relative volume (multiple of average volume) to move the market across a relative range (multiple of ATR).

- **Parameters:**
  - **period** (​_int_​) – The period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.
  - **atr_floor** (​_double_​) – The ATR floor (minimum) output value for the indicator (>= 0.).
- **Raises:**
  - **ValueError** – If period is not positive (> 0).
  - **ValueError** – If atr_floor is negative (< 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### update_raw(self, double high, double low, double close, double volume) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.
  - **volume** (​_double_​) – The volume.

#### value

#### value_cumulative

### _class_ PsychologicalLine

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

PsychologicalLine(int period, ma_type=None)

The Psychological Line is an oscillator-type indicator that compares the number of the rising periods to the total number of periods. In other words, it is the percentage of bars that close above the previous bar over a given period.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### update_raw(self, double close) → void

Update the indicator with the given raw value.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ RateOfChange

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

RateOfChange(int period, bool use_log=False)

An indicator which calculates the rate of change of price over a defined period. The return output can be simple or log.

- **Parameters:**
  - **period** (​_int_​) – The period for the indicator.
  - **use_log** (​_bool_​) – Use log returns for value calculation.
- **Raises:** **ValueError** – If period is not > 1.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

The window period.

- **Returns:** int

#### update_raw(self, double price) → void

Update the indicator with the given price.

- **Parameters:** **price** (​_double_​) – The update price.

#### value

The current value.

- **Returns:** double

### _class_ RelativeStrengthIndex

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

RelativeStrengthIndex(int period, ma_type=None)

An indicator which calculates a relative strength index (RSI) across a rolling window.

- **Parameters:**
  - **ma_type** (​_int_​) – The moving average type for average gain/loss.
  - **period** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The rolling window period for the indicator.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

The window period.

- **Returns:** int

#### update_raw(self, double value) → void

Update the indicator with the given value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current value.

- **Returns:** double

### _class_ RelativeVolatilityIndex

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

RelativeVolatilityIndex(int period, double scalar=100.0, ma_type=None)

The Relative Volatility Index (RVI) was created in 1993 and revised in 1995. Instead of adding up price changes like RSI based on price direction, the RVI adds up standard deviations based on price direction.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **scalar** (​_double_​) – A positive float to scale the bands.
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the vip and vim (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### scalar

#### update_raw(self, double close) → void

Update the indicator with the given raw values.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ SimpleMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

SimpleMovingAverage(int period, PriceType price_type=PriceType.LAST)

An indicator which calculates a simple moving average across a rolling window.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ SpreadAnalyzer

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

SpreadAnalyzer(InstrumentId instrument_id, int capacity) -> None

Provides various spread analysis metrics.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the tick updates.
  - **capacity** (​_int_​) – The max length for the internal QuoteTick deque (determines averages).
- **Raises:** **ValueError** – If capacity is not positive (> 0).

#### average

The current average spread.

- **Returns:** double

#### capacity

The indicators spread capacity.

- **Returns:** int

#### current

The current spread.

- **Returns:** double

#### handle_quote_tick(self, QuoteTick tick) → void

Update the analyzer with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.
- **Raises:** **ValueError** – If tick.instrument_id does not equal the analyzers instrument ID.

#### instrument_id

The indicators instrument ID.

- **Returns:** InstrumentId

### _class_ Stochastics

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Stochastics(int period_k, int period_d)

An oscillator which can indicate when an asset may be over bought or over sold.

- **Parameters:**
  - **period_k** (​_int_​) – The period for the K line.
  - **period_d** (​_int_​) – The period for the D line.
- **Raises:**
  - **ValueError** – If period_k is not positive (> 0).
  - **ValueError** – If period_d is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period_d

The d period.

- **Returns:** int

#### period_k

The k period.

- **Returns:** int

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value_d

The d value.

- **Returns:** double

#### value_k

The k value.

- **Returns:** double

### _class_ Swings

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Swings(int period)

A swing indicator which calculates and stores various swing metrics.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (> 0).

#### changed

#### direction

#### duration

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### high_datetime

#### high_price

#### length

#### low_datetime

#### low_price

#### period

#### since_high

#### since_low

#### update_raw(self, double high, double low, datetime timestamp) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **timestamp** (​_datetime_​) – The current timestamp.

### _class_ VariableIndexDynamicAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

VariableIndexDynamicAverage(int period, PriceType price_type=PriceType.LAST, MovingAverageType cmo_ma_type=MovingAverageType.SIMPLE)

Variable Index Dynamic Average (VIDYA) was developed by Tushar Chande. It is similar to an Exponential Moving Average, but it has a dynamically adjusted lookback period dependent on relative price volatility as measured by Chande Momentum Oscillator (CMO). When volatility is high, VIDYA reacts faster to price changes. It is often used as moving average or trend identifier.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
  - **cmo_ma_type** (​_int_​) – The moving average type for CMO indicator.
- **Raises:** **ValueError** – If period is not positive (> 0). If cmo_ma_type is `VARIABLE_INDEX_DYNAMIC`.

#### alpha

The moving average alpha value.

- **Returns:** double

#### cmo_pct

The normal cmo value.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ VerticalHorizontalFilter

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

VerticalHorizontalFilter(int period, MovingAverageType ma_type=MovingAverageType.SIMPLE)

The Vertical Horizon Filter (VHF) was created by Adam White to identify trending and ranging markets.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### period

#### update_raw(self, double close) → void

Update the indicator with the given raw value.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ VolatilityRatio

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

VolatilityRatio(int fast_period, int slow_period, MovingAverageType ma_type=MovingAverageType.SIMPLE, bool use_previous=True, double value_floor=0)

An indicator which calculates the ratio of different ranges of volatility. Different moving average types can be selected for the inner ATR calculations.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast ATR (> 0).
  - **slow_period** (​_int_​) – The period for the slow ATR (> 0 & > fast_period).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the ATR calculations.
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used.
  - **value_floor** (​_double_​) – The floor (minimum) output value for the indicator (>= 0).
- **Raises:**
  - **ValueError** – If fast_period is not positive (> 0).
  - **ValueError** – If slow_period is not positive (> 0).
  - **ValueError** – If fast_period is not < slow_period.
  - **ValueError** – If value_floor is negative (< 0).

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### slow_period

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw value.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

### _class_ VolumeWeightedAveragePrice

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

VolumeWeightedAveragePrice()

An indicator which calculates the volume weighted average price for the day.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### update_raw(self, double price, double volume, datetime timestamp) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **price** (​_double_​) – The update price.
  - **volume** (​_double_​) – The update volume.
  - **timestamp** (​_datetime_​) – The current timestamp.

#### value

### _class_ WeightedMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

WeightedMovingAverage(int period, weights=None, PriceType price_type=PriceType.LAST)

An indicator which calculates a weighted moving average across a rolling window.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **weights** (​_iterable_​) – The weights for the moving average calculation (if not `None` then = period).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### weights

### _class_ WilderMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

WilderMovingAverage(int period, PriceType price_type=PriceType.LAST)

The Wilder’s Moving Average is simply an Exponential Moving Average (EMA) with a modified alpha = 1 / period.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### alpha

The moving average alpha value.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

### _class_ AdaptiveMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

AdaptiveMovingAverage(int period_er, int period_alpha_fast, int period_alpha_slow, PriceType price_type=PriceType.LAST)

An indicator which calculates an adaptive moving average (AMA) across a rolling window. Developed by Perry Kaufman, the AMA is a moving average designed to account for market noise and volatility. The AMA will closely follow prices when the price swings are relatively small and the noise is low. The AMA will increase lag when the price swings increase.

- **Parameters:**
  - **period_er** (​_int_​) – The period for the internal EfficiencyRatio indicator (> 0).
  - **period_alpha_fast** (​_int_​) – The period for the fast smoothing constant (> 0).
  - **period_alpha_slow** (​_int_​) – The period for the slow smoothing constant (> 0 < alpha_fast).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.

#### alpha_diff

The alpha difference value.

- **Returns:** double

#### alpha_fast

The alpha fast value.

- **Returns:** double

#### alpha_slow

The alpha slow value.

- **Returns:** double

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### period_alpha_fast

The period of the fast smoothing constant.

- **Returns:** double

#### period_alpha_slow

The period of the slow smoothing constant.

- **Returns:** double

#### period_er

The period of the internal EfficiencyRatio indicator.

- **Returns:** double

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ DoubleExponentialMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

DoubleExponentialMovingAverage(int period, PriceType price_type=PriceType.LAST)

The Double Exponential Moving Average attempts to a smoother average with less lag than the normal Exponential Moving Average (EMA).

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ ExponentialMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

ExponentialMovingAverage(int period, PriceType price_type=PriceType.LAST)

An indicator which calculates an exponential moving average across a rolling window.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### alpha

The moving average alpha value.

- **Returns:** double

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ HullMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

HullMovingAverage(int period, PriceType price_type=PriceType.LAST)

An indicator which calculates a Hull Moving Average (HMA) across a rolling window. The HMA, developed by Alan Hull, is an extremely fast and smooth moving average.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ MovingAverage

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

MovingAverage(int period, list params, PriceType price_type)

The base class for all moving average type indicators.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **params** (​_list_​) – The initialization parameters for the indicator.
  - **price_type** (_PriceType_ _,_ ​_optional_​) – The specified price type for extracting values from quotes.

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Abstract method (implement in subclass).

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ MovingAverageFactory

Bases: `object`

Provides a factory to construct different moving average indicators.

#### _static_ create(int period, MovingAverageType ma_type: MovingAverageType, \*\*kwargs) → [MovingAverage](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

Create a moving average indicator corresponding to the given ma_type.

- **Parameters:**
  - **period** (​_int_​) – The period of the moving average (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverageType)) – The moving average type.
- **Return type:** [MovingAverage](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)
- **Raises:** **ValueError** – If period is not positive (> 0).

### _class_ MovingAverageType

Bases: `IntFlag`

#### conjugate()

Returns self, the complex conjugate of any int.

#### bit_length()

Number of bits necessary to represent self in binary.

```pycon
>>> bin(37)
'0b100101'
>>> (37).bit_length()
6
```

#### bit_count()

Number of ones in the binary representation of the absolute value of self.

Also known as the population count.

```pycon
>>> bin(13)
'0b1101'
>>> (13).bit_count()
3
```

#### to_bytes(length=1, byteorder='big', , signed=False)

Return an array of bytes representing an integer.

length : Length of bytes object to use. An OverflowError is raised if the integer is not representable with the given number of bytes. Default is length 1.

byteorder : The byte order used to represent the integer. If byteorder is ‘big’, the most significant byte is at the beginning of the byte array. If byteorder is ‘little’, the most significant byte is at the end of the byte array. To request the native byte order of the host system, use sys.byteorder as the byte order value. Default is to use ‘big’.

signed : Determines whether two’s complement is used to represent the integer. If signed is False and a negative integer is given, an OverflowError is raised.

#### _classmethod_ from_bytes(bytes, byteorder='big', , signed=False)

Return the integer represented by the given array of bytes.

bytes : Holds the array of bytes to convert. The argument must either support the buffer protocol or be an iterable object producing bytes. Bytes and bytearray are examples of built-in objects that support the buffer protocol.

byteorder : The byte order used to represent the integer. If byteorder is ‘big’, the most significant byte is at the beginning of the byte array. If byteorder is ‘little’, the most significant byte is at the end of the byte array. To request the native byte order of the host system, use sys.byteorder as the byte order value. Default is to use ‘big’.

signed : Indicates whether two’s complement is used to represent the integer.

#### as_integer_ratio()

Return a pair of integers, whose ratio is equal to the original int.

The ratio is in lowest terms and has a positive denominator.

```pycon
>>> (10).as_integer_ratio()
(10, 1)
>>> (-10).as_integer_ratio()
(-10, 1)
>>> (0).as_integer_ratio()
(0, 1)
```

#### is_integer()

Returns True. Exists for duck type compatibility with float.is_integer.

#### real

the real part of a complex number

#### imag

the imaginary part of a complex number

#### numerator

the numerator of a rational number in lowest terms

#### denominator

the denominator of a rational number in lowest terms

#### SIMPLE _= 0_

#### EXPONENTIAL _= 1_

#### DOUBLE*EXPONENTIAL*= 2\_

#### WILDER _= 3_

#### HULL _= 4_

#### ADAPTIVE _= 5_

#### WEIGHTED _= 6_

#### VARIABLE*INDEX_DYNAMIC*= 7\_

### _class_ SimpleMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

SimpleMovingAverage(int period, PriceType price_type=PriceType.LAST)

An indicator which calculates a simple moving average across a rolling window.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ VariableIndexDynamicAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

VariableIndexDynamicAverage(int period, PriceType price_type=PriceType.LAST, MovingAverageType cmo_ma_type=MovingAverageType.SIMPLE)

Variable Index Dynamic Average (VIDYA) was developed by Tushar Chande. It is similar to an Exponential Moving Average, but it has a dynamically adjusted lookback period dependent on relative price volatility as measured by Chande Momentum Oscillator (CMO). When volatility is high, VIDYA reacts faster to price changes. It is often used as moving average or trend identifier.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
  - **cmo_ma_type** (​_int_​) – The moving average type for CMO indicator.
- **Raises:** **ValueError** – If period is not positive (> 0). If cmo_ma_type is `VARIABLE_INDEX_DYNAMIC`.

#### alpha

The moving average alpha value.

- **Returns:** double

#### cmo_pct

The normal cmo value.

- **Returns:** double

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ WeightedMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

WeightedMovingAverage(int period, weights=None, PriceType price_type=PriceType.LAST)

An indicator which calculates a weighted moving average across a rolling window.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **weights** (​_iterable_​) – The weights for the moving average calculation (if not `None` then = period).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

#### weights

### _class_ WilderMovingAverage

Bases: [`MovingAverage`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.averages.MovingAverage)

WilderMovingAverage(int period, PriceType price_type=PriceType.LAST)

The Wilder’s Moving Average is simply an Exponential Moving Average (EMA) with a modified alpha = 1 / period.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### alpha

The moving average alpha value.

- **Returns:** double

#### count

The count of inputs received by the indicator.

- **Returns:** int

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar to handle.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The moving average period.

- **Returns:** PriceType

#### price_type

The specified price type for extracting values from quotes.

- **Returns:** PriceType

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given raw value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current output value.

- **Returns:** double

### _class_ FuzzyCandle

Bases: `object`

FuzzyCandle(CandleDirection direction, CandleSize size, CandleBodySize body_size, CandleWickSize upper_wick_size, CandleWickSize lower_wick_size)

Represents a fuzzy candle.

- **Parameters:**
  - **direction** ([_CandleDirection_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleDirection)) – The candle direction.
  - **size** ([_CandleSize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleSize)) – The candle fuzzy size.
  - **body_size** ([_CandleBodySize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleBodySize)) – The candle fuzzy body size.
  - **upper_wick_size** ([_CandleWickSize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleWickSize)) – The candle fuzzy upper wick size.
  - **lower_wick_size** ([_CandleWickSize_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.CandleWickSize)) – The candle fuzzy lower wick size.

#### body_size

The candles fuzzy body size.

- **Returns:** CandleBodySize

#### direction

The candles close direction.

- **Returns:** CandleDirection

#### lower_wick_size

The candles fuzzy lower wick size.

- **Returns:** CandleWickSize

#### size

The candles fuzzy overall size.

- **Returns:** CandleSize

#### upper_wick_size

The candles fuzzy upper wick size.

- **Returns:** CandleWickSize

### _class_ FuzzyCandlesticks

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

FuzzyCandlesticks(int period, double threshold1=0.5, double threshold2=1.0, double threshold3=2.0, double threshold4=3.0)

An indicator which fuzzifies bar data to produce fuzzy candlesticks. Bar data is dimensionally reduced via fuzzy feature extraction.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **threshold1** (​_float_​) – The membership function x threshold1 (>= 0).
  - **threshold2** (​_float_​) – The membership function x threshold2 (> threshold1).
  - **threshold3** (​_float_​) – The membership function x threshold3 (> threshold2).
  - **threshold4** (​_float_​) – The membership function x threshold4 (> threshold3).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar.** (​_The update_​)

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double open, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **open** (​_double_​) – The open price.
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

The last fuzzy candle.

- **Returns:** FuzzyCandle

#### vector

The fuzzy candle represented as a vector of ints.

- **Returns:** list[int]

### _class_ ChandeMomentumOscillator

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

ChandeMomentumOscillator(int period, ma_type=None)

Attempts to capture the momentum of an asset with overbought at 50 and oversold at -50.

- **Parameters:**
  - **ma_type** (​_int_​) – The moving average type for average gain/loss.
  - **period** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The rolling window period for the indicator.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double close) → void

Update the indicator with the given value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current value.

- **Returns:** double

### _class_ CommodityChannelIndex

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

CommodityChannelIndex(int period, double scalar=0.015, ma_type=None)

Commodity Channel Index is a momentum oscillator used to primarily identify overbought and oversold levels relative to a mean.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **scalar** (​_double_​) – A positive float to scale the bands
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for prices.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### scalar

The positive float to scale the bands.

- **Returns:** double

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

The current value.

- **Returns:** double

### _class_ EfficiencyRatio

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

EfficiencyRatio(int period)

An indicator which calculates the efficiency ratio across a rolling window. The Kaufman Efficiency measures the ratio of the relative market speed in relation to the volatility, this could be thought of as a proxy for noise.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (>= 2).
- **Raises:** **ValueError** – If period is not >= 2.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double price) → void

Update the indicator with the given price.

- **Parameters:** **price** (​_double_​) – The update price.

#### value

The current value.

- **Returns:** double

### _class_ PsychologicalLine

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

PsychologicalLine(int period, ma_type=None)

The Psychological Line is an oscillator-type indicator that compares the number of the rising periods to the total number of periods. In other words, it is the percentage of bars that close above the previous bar over a given period.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double close) → void

Update the indicator with the given raw value.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ RateOfChange

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

RateOfChange(int period, bool use_log=False)

An indicator which calculates the rate of change of price over a defined period. The return output can be simple or log.

- **Parameters:**
  - **period** (​_int_​) – The period for the indicator.
  - **use_log** (​_bool_​) – Use log returns for value calculation.
- **Raises:** **ValueError** – If period is not > 1.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double price) → void

Update the indicator with the given price.

- **Parameters:** **price** (​_double_​) – The update price.

#### value

The current value.

- **Returns:** double

### _class_ RelativeStrengthIndex

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

RelativeStrengthIndex(int period, ma_type=None)

An indicator which calculates a relative strength index (RSI) across a rolling window.

- **Parameters:**
  - **ma_type** (​_int_​) – The moving average type for average gain/loss.
  - **period** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The rolling window period for the indicator.
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double value) → void

Update the indicator with the given value.

- **Parameters:** **value** (​_double_​) – The update value.

#### value

The current value.

- **Returns:** double

### _class_ RelativeVolatilityIndex

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

RelativeVolatilityIndex(int period, double scalar=100.0, ma_type=None)

The Relative Volatility Index (RVI) was created in 1993 and revised in 1995. Instead of adding up price changes like RSI based on price direction, the RVI adds up standard deviations based on price direction.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **scalar** (​_double_​) – A positive float to scale the bands.
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the vip and vim (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### scalar

#### update_raw(self, double close) → void

Update the indicator with the given raw values.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ Stochastics

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Stochastics(int period_k, int period_d)

An oscillator which can indicate when an asset may be over bought or over sold.

- **Parameters:**
  - **period_k** (​_int_​) – The period for the K line.
  - **period_d** (​_int_​) – The period for the D line.
- **Raises:**
  - **ValueError** – If period_k is not positive (> 0).
  - **ValueError** – If period_d is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period_d

The d period.

- **Returns:** int

#### period_k

The k period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value_d

The d value.

- **Returns:** double

#### value_k

The k value.

- **Returns:** double

### _class_ SpreadAnalyzer

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

SpreadAnalyzer(InstrumentId instrument_id, int capacity) -> None

Provides various spread analysis metrics.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the tick updates.
  - **capacity** (​_int_​) – The max length for the internal QuoteTick deque (determines averages).
- **Raises:** **ValueError** – If capacity is not positive (> 0).

#### average

The current average spread.

- **Returns:** double

#### capacity

The indicators spread capacity.

- **Returns:** int

#### current

The current spread.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Abstract method (implement in subclass).

#### handle_quote_tick(self, QuoteTick tick) → void

Update the analyzer with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.
- **Raises:** **ValueError** – If tick.instrument_id does not equal the analyzers instrument ID.

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### instrument_id

The indicators instrument ID.

- **Returns:** InstrumentId

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

### _class_ ArcherMovingAveragesTrends

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

ArcherMovingAveragesTrends(int fast_period, int slow_period, int signal_period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL)

Archer Moving Averages Trends indicator.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast moving average (> 0).
  - **slow_period** (​_int_​) – The period for the slow moving average (> 0 & > fast_sma).
  - **signal_period** (​_int_​) – The period for lookback price array (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### long_run

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### short_run

#### signal_period

#### slow_period

#### update_raw(self, double close) → void

Update the indicator with the given close price value.

- **Parameters:** **close** (​_double_​) – The close price.

### _class_ AroonOscillator

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

AroonOscillator(int period)

The Aroon (AR) indicator developed by Tushar Chande attempts to determine whether an instrument is trending, and how strong the trend is. AroonUp and AroonDown lines make up the indicator with their formulas below.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (> 0).

#### aroon_down

The current aroon down value.

- **Returns:** double

#### aroon_up

The current aroon up value.

- **Returns:** double

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.

#### value

The current value.

- **Returns:** double

### _class_ Bias

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Bias(int period, MovingAverageType ma_type=MovingAverageType.SIMPLE)

Rate of change between the source and a moving average.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double close) → void

Update the indicator with the given raw values.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ DirectionalMovement

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

DirectionalMovement(int period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL)

Two oscillators that capture positive and negative trend movement.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### neg

#### period

#### pos

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.

#### value

### _class_ LinearRegression

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

LinearRegression(int period=0)

An indicator that calculates a simple linear regression.

- **Parameters:** **period** (​_int_​) – The period for the indicator.
- **Raises:** **ValueError** – If period is not greater than zero.

#### R2

#### cfo

#### degree

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### intercept

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### slope

#### update_raw(self, double close) → void

Update the indicator with the given raw values.

- **Parameters:** **close_price** (​_double_​) – The close price.

#### value

### _class_ MovingAverageConvergenceDivergence

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

MovingAverageConvergenceDivergence(int fast_period, int slow_period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, PriceType price_type=PriceType.LAST)

An indicator which calculates the difference between two moving averages. Different moving average types can be selected for the inner calculation.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast moving average (> 0).
  - **slow_period** (​_int_​) – The period for the slow moving average (> 0 & > fast_sma).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.
  - **price_type** (​_PriceType_​) – The specified price type for extracting values from quotes.
- **Raises:**
  - **ValueError** – If fast_period is not positive (> 0).
  - **ValueError** – If slow_period is not positive (> 0).
  - **ValueError** – If fast_period is not < slow_period.

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The update tick to handle.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The update tick to handle.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### slow_period

#### update_raw(self, double close) → void

Update the indicator with the given close price.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ Swings

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Swings(int period)

A swing indicator which calculates and stores various swing metrics.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (> 0).

#### changed

#### direction

#### duration

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### high_datetime

#### high_price

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### length

#### low_datetime

#### low_price

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### since_high

#### since_low

#### update_raw(self, double high, double low, datetime timestamp) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **timestamp** (​_datetime_​) – The current timestamp.

### _class_ AverageTrueRange

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

AverageTrueRange(int period, MovingAverageType ma_type=MovingAverageType.SIMPLE, bool use_previous=True, double value_floor=0)

An indicator which calculates the average true range across a rolling window. Different moving average types can be selected for the inner calculation.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used. (note: only applicable for update(). update_mid() will need to use previous price.
  - **value_floor** (​_double_​) – The floor (minimum) output value for the indicator (>= 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

The window period.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

The current value.

- **Returns:** double

### _class_ BollingerBands

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

BollingerBands(int period, double k, MovingAverageType ma_type=MovingAverageType.SIMPLE)

A Bollinger Band® is a technical analysis tool defined by a set of trend lines plotted two standard deviations (positively and negatively) away from a simple moving average (SMA) of an instruments price, which can be adjusted to user preferences.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **k** (​_double_​) – The standard deviation multiple for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator.
- **Raises:**
  - **ValueError** – If period is not positive (> 0).
  - **ValueError** – If k is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### k

The standard deviation multiple.

- **Returns:** double

#### lower

The current value of the lower band.

- **Returns:** double

#### middle

The current value of the middle band.

- **Returns:** double

#### name

The name of the indicator.

- **Returns:** str

#### period

The period for the moving average.

- **Returns:** int

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given prices.

- **Parameters:**
  - **high** (​_double_​) – The high price for calculations.
  - **low** (​_double_​) – The low price for calculations.
  - **close** (​_double_​) – The closing price for calculations

#### upper

The current value of the upper band.

- **Returns:** double

### _class_ DonchianChannel

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

DonchianChannel(int period)

Donchian Channels are three lines generated by moving average calculations that comprise an indicator formed by upper and lower bands around a mid-range or median band. The upper band marks the highest price of a instrument_id over N periods while the lower band marks the lowest price of a instrument_id over N periods. The area between the upper and lower bands represents the Donchian Channel.

- **Parameters:** **period** (​_int_​) – The rolling window period for the indicator (> 0).
- **Raises:** **ValueError** – If period is not positive (> 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the indicator with the given ticks high and low prices.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the indicator with the given ticks price.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### lower

#### middle

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low) → void

Update the indicator with the given prices.

- **Parameters:**
  - **high** (​_double_​) – The price for the upper channel.
  - **low** (​_double_​) – The price for the lower channel.

#### upper

### _class_ KeltnerChannel

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

KeltnerChannel(int period, double k_multiplier, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, MovingAverageType ma_type_atr=MovingAverageType.SIMPLE, bool use_previous=True, double atr_floor=0)

The Keltner channel is a volatility based envelope set above and below a central moving average. Traditionally the middle band is an EMA based on the typical price (high + low + close) / 3, the upper band is the middle band plus the ATR. The lower band is the middle band minus the ATR.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **k_multiplier** (​_double_​) – The multiplier for the ATR (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the middle band (cannot be None).
  - **ma_type_atr** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the internal ATR (cannot be None).
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used.
  - **atr_floor** (​_double_​) – The ATR floor (minimum) output value for the indicator (>= 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### k_multiplier

#### lower

#### middle

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### upper

### _class_ KeltnerPosition

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

KeltnerPosition(int period, double k_multiplier, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, MovingAverageType ma_type_atr=MovingAverageType.SIMPLE, bool use_previous=True, double atr_floor=0)

An indicator which calculates the relative position of the given price within a defined Keltner channel. This provides a measure of the relative ‘extension’ of a market from the mean, as a multiple of volatility.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **k_multiplier** (​_double_​) – The multiplier for the ATR (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the middle band (cannot be None).
  - **ma_type_atr** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the internal ATR (cannot be None).
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used.
  - **atr_floor** (​_double_​) – The ATR floor (minimum) output value for the indicator (>= 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### k_multiplier

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw value.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

### _class_ VerticalHorizontalFilter

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

VerticalHorizontalFilter(int period, MovingAverageType ma_type=MovingAverageType.SIMPLE)

The Vertical Horizon Filter (VHF) was created by Adam White to identify trending and ranging markets.

- **Parameters:**
  - **period** (​_int_​) – The rolling window period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the indicator (cannot be None).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double close) → void

Update the indicator with the given raw value.

- **Parameters:** **close** (​_double_​) – The close price.

#### value

### _class_ VolatilityRatio

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

VolatilityRatio(int fast_period, int slow_period, MovingAverageType ma_type=MovingAverageType.SIMPLE, bool use_previous=True, double value_floor=0)

An indicator which calculates the ratio of different ranges of volatility. Different moving average types can be selected for the inner ATR calculations.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast ATR (> 0).
  - **slow_period** (​_int_​) – The period for the slow ATR (> 0 & > fast_period).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the ATR calculations.
  - **use_previous** (​_bool_​) – The boolean flag indicating whether previous price values should be used.
  - **value_floor** (​_double_​) – The floor (minimum) output value for the indicator (>= 0).
- **Raises:**
  - **ValueError** – If fast_period is not positive (> 0).
  - **ValueError** – If slow_period is not positive (> 0).
  - **ValueError** – If fast_period is not < slow_period.
  - **ValueError** – If value_floor is negative (< 0).

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### slow_period

#### update_raw(self, double high, double low, double close) → void

Update the indicator with the given raw value.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.

#### value

### _class_ KlingerVolumeOscillator

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

KlingerVolumeOscillator(int fast_period, int slow_period, int signal_period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL)

This indicator was developed by Stephen J. Klinger. It is designed to predict price reversals in a market by comparing volume to price.

- **Parameters:**
  - **fast_period** (​_int_​) – The period for the fast moving average (> 0).
  - **slow_period** (​_int_​) – The period for the slow moving average (> 0 & > fast_sma).
  - **signal_period** (​_int_​) – The period for the moving average difference’s moving average (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.

#### fast_period

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### signal_period

#### slow_period

#### update_raw(self, double high, double low, double close, double volume) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.
  - **volume** (​_double_​) – The volume.

#### value

### _class_ OnBalanceVolume

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

OnBalanceVolume(int period=0)

An indicator which calculates the momentum of relative positive or negative volume.

- **Parameters:** **period** (​_int_​) – The period for the indicator, zero indicates no window (>= 0).
- **Raises:** **ValueError** – If period is negative (< 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double open, double close, double volume) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **open** (​_double_​) – The high price.
  - **close** (​_double_​) – The low price.
  - **volume** (​_double_​) – The close price.

#### value

### _class_ Pressure

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

Pressure(int period, MovingAverageType ma_type=MovingAverageType.EXPONENTIAL, double atr_floor=0)

An indicator which calculates the relative volume (multiple of average volume) to move the market across a relative range (multiple of ATR).

- **Parameters:**
  - **period** (​_int_​) – The period for the indicator (> 0).
  - **ma_type** ([_MovingAverageType_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.MovingAverageType)) – The moving average type for the calculations.
  - **atr_floor** (​_double_​) – The ATR floor (minimum) output value for the indicator (>= 0.).
- **Raises:**
  - **ValueError** – If period is not positive (> 0).
  - **ValueError** – If atr_floor is negative (< 0).

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### period

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double high, double low, double close, double volume) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **high** (​_double_​) – The high price.
  - **low** (​_double_​) – The low price.
  - **close** (​_double_​) – The close price.
  - **volume** (​_double_​) – The volume.

#### value

#### value_cumulative

### _class_ VolumeWeightedAveragePrice

Bases: [`Indicator`](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)

VolumeWeightedAveragePrice()

An indicator which calculates the volume weighted average price for the day.

#### handle_bar(self, Bar bar) → void

Update the indicator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update bar.

#### handle_quote_tick(self, QuoteTick tick) → void

Abstract method (implement in subclass).

#### handle_trade_tick(self, TradeTick tick) → void

Abstract method (implement in subclass).

#### has_inputs

If the indicator has received inputs.

- **Returns:** bool

#### initialized

If the indicator is warmed up and initialized.

- **Returns:** bool

#### name

The name of the indicator.

- **Returns:** str

#### reset(self) → void

Reset the indicator.

All stateful fields are reset to their initial value.

#### update_raw(self, double price, double volume, datetime timestamp) → void

Update the indicator with the given raw values.

- **Parameters:**
  - **price** (​_double_​) – The update price.
  - **volume** (​_double_​) – The update volume.
  - **timestamp** (​_datetime_​) – The current timestamp.

#### value
