# Data

The data subpackage groups components relating to the data stack and data tooling for the platform.

The layered architecture of the data stack somewhat mirrors the execution stack with a central engine, cache layer beneath, database layer beneath, with alternative implementations able to be written on top.

Due to the high-performance, the core components are reusable between both backtest and live implementations - helping to ensure consistent logic for trading operations.

## Aggregation

### _class_ BarAggregator

Bases: `object`

BarAggregator(Instrument instrument, BarType bar_type, handler: Callable[[Bar], None], bool await_partial=False) -> None

Provides a means of aggregating specified bars and sending to a registered handler.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the aggregator.
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the aggregator.
  - **handler** (_Callable_ _[_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) _]_ _,_ _None_ ​*]*​) – The bar handler for the aggregator.
  - **await_partial** (_bool_ _,_ ​*default False*​) – If the aggregator should await an initial partial bar prior to aggregating.
- **Raises:** **ValueError** – If instrument.id != bar_type.instrument_id.

#### bar_type

The aggregators bar type.

- **Returns:** BarType

#### handle_bar(self, Bar bar) → void

Update the aggregator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar for the update.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### is_running

‘bool’

- **Type:** is_running

#### set_await_partial(self, bool value)

#### set_partial(self, Bar partial_bar) → void

Set the initial values for a partially completed bar.

This method can only be called once per instance.

- **Parameters:** **partial_bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The partial bar with values to set.

#### start_batch_update(self, handler: Callable[[Bar], None], uint64_t time_ns) → None

#### stop_batch_update(self) → None

### _class_ BarBuilder

Bases: `object`

BarBuilder(Instrument instrument, BarType bar_type) -> None

Provides a generic bar builder for aggregation.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the builder.
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the builder.
- **Raises:** **ValueError** – If instrument.id != bar_type.instrument_id.

#### build(self, uint64_t ts_event, uint64_t ts_init) → [Bar](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)

Return the aggregated bar with the given closing timestamp, and reset.

- **Parameters:**
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) for the bar event.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) for the bar initialization.
- **Return type:** [Bar](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)

#### build_now(self) → [Bar](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)

Return the aggregated bar and reset.

- **Return type:** [Bar](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)

#### count

The builders current update count.

- **Returns:** int

#### initialized

If the builder is initialized.

- **Returns:** bool

#### price_precision

The price precision for the builders instrument.

- **Returns:** uint8

#### reset(self) → void

Reset the bar builder.

All stateful fields are reset to their initial value.

#### set_partial(self, Bar partial_bar) → void

Set the initial values for a partially completed bar.

This method can only be called once per instance.

- **Parameters:** **partial_bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The partial bar with values to set.

#### size_precision

The size precision for the builders instrument.

- **Returns:** uint8

#### ts_last

UNIX timestamp (nanoseconds) when the builder last updated.

- **Returns:** uint64_t

#### update(self, Price price, Quantity size, uint64_t ts_init) → void

Update the bar builder.

- **Parameters:**
  - **price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The update price.
  - **size** (​*Decimal*​) – The update size.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) of the update.

#### update_bar(self, Bar bar, Quantity volume, uint64_t ts_init) → void

Update the bar builder.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The update Bar.

### _class_ TickBarAggregator

Bases: [`BarAggregator`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.aggregation.BarAggregator)

TickBarAggregator(Instrument instrument, BarType bar_type, handler: Callable[[Bar], None]) -> None

Provides a means of building tick bars from ticks.

When received tick count reaches the step threshold of the bar specification, then a bar is created and sent to the handler.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the aggregator.
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the aggregator.
  - **handler** (_Callable_ _[_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) _]_ _,_ _None_ ​*]*​) – The bar handler for the aggregator.
- **Raises:** **ValueError** – If instrument.id != bar_type.instrument_id.

#### bar_type

The aggregators bar type.

- **Returns:** BarType

#### handle_bar(self, Bar bar) → void

Update the aggregator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar for the update.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### is_running

‘bool’

- **Type:** is_running

#### set_await_partial(self, bool value)

#### set_partial(self, Bar partial_bar) → void

Set the initial values for a partially completed bar.

This method can only be called once per instance.

- **Parameters:** **partial_bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The partial bar with values to set.

#### start_batch_update(self, handler: Callable[[Bar], None], uint64_t time_ns) → None

#### stop_batch_update(self) → None

### _class_ TimeBarAggregator

Bases: [`BarAggregator`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.aggregation.BarAggregator)

TimeBarAggregator(Instrument instrument, BarType bar_type, handler: Callable[[Bar], None], Clock clock, str interval_type=’left-open’, bool timestamp_on_close=True, bool skip_first_non_full_bar=False, bool build_with_no_updates=True, time_bars_origin_offset: pd.Timedelta | pd.DateOffset = None, int bar_build_delay=0) -> None

Provides a means of building time bars from ticks with an internal timer.

When the time reaches the next time interval of the bar specification, then a bar is created and sent to the handler.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the aggregator.
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the aggregator.
  - **handler** (_Callable_ _[_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) _]_ _,_ _None_ ​*]*​) – The bar handler for the aggregator.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the aggregator.
  - **interval_type** (_str_ _,_ ​*default 'left-open'*​) – Determines the type of interval used for time aggregation.
    - ‘left-open’: start time is excluded and end time is included (default).
    - ‘right-open’: start time is included and end time is excluded.
  - **timestamp_on_close** (_bool_ _,_ ​*default True*​) – If True, then timestamp will be the bar close time. If False, then timestamp will be the bar open time.
  - **skip_first_non_full_bar** (_bool_ _,_ ​*default False*​) – If will skip emitting a bar if the aggregation starts mid-interval.
  - **build_with_no_updates** (_bool_ _,_ ​*default True*​) – If build and emit bars with no new market updates.
  - **time_bars_origin_offset** (_pd.Timedelta_ _or_ _pd.DateOffset_ _,_ ​*optional*​) – The origin time offset.
  - **bar_build_delay** (_int_ _,_ ​*default 0*​) – The time delay (microseconds) before building and emitting a composite bar type. 15 microseconds can be useful in a backtest context, when aggregating internal bars from internal bars several times so all messages are processed before a timer triggers.
- **Raises:** **ValueError** – If instrument.id != bar_type.instrument_id.

#### bar_type

The aggregators bar type.

- **Returns:** BarType

#### get_start_time(self, datetime now: datetime) → datetime

Return the start time for the aggregators next bar.

- **Returns:** The timestamp (UTC).
- **Return type:** datetime

#### handle_bar(self, Bar bar) → void

Update the aggregator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar for the update.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### interval

The aggregators time interval.

- **Returns:** timedelta

#### interval_ns

The aggregators time interval.

- **Returns:** uint64_t

#### is_running

‘bool’

- **Type:** is_running

#### next_close_ns

The aggregators next closing time.

- **Returns:** uint64_t

#### set_await_partial(self, bool value)

#### set_partial(self, Bar partial_bar) → void

Set the initial values for a partially completed bar.

This method can only be called once per instance.

- **Parameters:** **partial_bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The partial bar with values to set.

#### start_batch_update(self, handler: Callable[[Bar], None], uint64_t time_ns) → None

#### stop(self) → void

Stop the bar aggregator.

#### stop_batch_update(self) → None

### _class_ ValueBarAggregator

Bases: [`BarAggregator`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.aggregation.BarAggregator)

ValueBarAggregator(Instrument instrument, BarType bar_type, handler: Callable[[Bar], None]) -> None

Provides a means of building value bars from ticks.

When received value reaches the step threshold of the bar specification, then a bar is created and sent to the handler.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the aggregator.
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the aggregator.
  - **handler** (_Callable_ _[_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) _]_ _,_ _None_ ​*]*​) – The bar handler for the aggregator.
- **Raises:** **ValueError** – If instrument.id != bar_type.instrument_id.

#### bar_type

The aggregators bar type.

- **Returns:** BarType

#### get_cumulative_value(self)

Return the current cumulative value of the aggregator.

- **Return type:** Decimal

#### handle_bar(self, Bar bar) → void

Update the aggregator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar for the update.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### is_running

‘bool’

- **Type:** is_running

#### set_await_partial(self, bool value)

#### set_partial(self, Bar partial_bar) → void

Set the initial values for a partially completed bar.

This method can only be called once per instance.

- **Parameters:** **partial_bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The partial bar with values to set.

#### start_batch_update(self, handler: Callable[[Bar], None], uint64_t time_ns) → None

#### stop_batch_update(self) → None

### _class_ VolumeBarAggregator

Bases: [`BarAggregator`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.aggregation.BarAggregator)

VolumeBarAggregator(Instrument instrument, BarType bar_type, handler: Callable[[Bar], None]) -> None

Provides a means of building volume bars from ticks.

When received volume reaches the step threshold of the bar specification, then a bar is created and sent to the handler.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the aggregator.
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the aggregator.
  - **handler** (_Callable_ _[_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) _]_ _,_ _None_ ​*]*​) – The bar handler for the aggregator.
- **Raises:** **ValueError** – If instrument.id != bar_type.instrument_id.

#### bar_type

The aggregators bar type.

- **Returns:** BarType

#### handle_bar(self, Bar bar) → void

Update the aggregator with the given bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar for the update.

#### handle_quote_tick(self, QuoteTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick for the update.

#### handle_trade_tick(self, TradeTick tick) → void

Update the aggregator with the given tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick for the update.

#### is_running

‘bool’

- **Type:** is_running

#### set_await_partial(self, bool value)

#### set_partial(self, Bar partial_bar) → void

Set the initial values for a partially completed bar.

This method can only be called once per instance.

- **Parameters:** **partial_bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The partial bar with values to set.

#### start_batch_update(self, handler: Callable[[Bar], None], uint64_t time_ns) → None

#### stop_batch_update(self) → None

### find_closest_smaller_time(now: pd.Timestamp, daily_time_origin: pd.Timedelta, period: pd.Timedelta) → pd.Timestamp

## Client

### _class_ DataClient

Bases: [`Component`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Component)

DataClient(ClientId client_id, MessageBus msgbus, Cache cache, Clock clock, Venue venue: Venue | None = None, config: NautilusConfig | None = None)

The base class for all data clients.

- **Parameters:**
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)) – The data client ID.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the client.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the client.
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue) _,_ ​*optional*​) – The client venue. If multi-venue then can be `None`.
  - **config** ([_NautilusConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.NautilusConfig) _,_ ​*optional*​) – The configuration for the instance.

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### degrade(self) → void

Degrade the component.

While executing on_degrade() any exception will be logged and reraised, then the component will remain in a `DEGRADING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### dispose(self) → void

Dispose of the component.

While executing on_dispose() any exception will be logged and reraised, then the component will remain in a `DISPOSING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### fault(self) → void

Fault the component.

Calling this method multiple times has the same effect as calling it once (it is idempotent). Once called, it cannot be reversed, and no other methods should be called on this instance.

While executing on_fault() any exception will be logged and reraised, then the component will remain in a `FAULTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### _classmethod_ fully_qualified_name(cls) → str

Return the fully qualified name for the components class.

- **Return type:** str

#### id

The components ID.

- **Returns:** ComponentId

#### is_connected

If the client is connected.

- **Returns:** bool

#### is_degraded

bool

Return whether the current component state is `DEGRADED`.

- **Return type:** bool
- **Type:** Component.is_degraded

#### is_disposed

bool

Return whether the current component state is `DISPOSED`.

- **Return type:** bool
- **Type:** Component.is_disposed

#### is_faulted

bool

Return whether the current component state is `FAULTED`.

- **Return type:** bool
- **Type:** Component.is_faulted

#### is_initialized

bool

Return whether the component has been initialized (component.state >= `INITIALIZED`).

- **Return type:** bool
- **Type:** Component.is_initialized

#### is_running

bool

Return whether the current component state is `RUNNING`.

- **Return type:** bool
- **Type:** Component.is_running

#### is_stopped

bool

Return whether the current component state is `STOPPED`.

- **Return type:** bool
- **Type:** Component.is_stopped

#### request(self, RequestData request) → void

Request data for the given data type.

- **Parameters:** **request** ([_RequestData_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)) – The message for the data request.

#### reset(self) → void

Reset the component.

All stateful fields are reset to their initial value.

While executing on_reset() any exception will be logged and reraised, then the component will remain in a `RESETTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### resume(self) → void

Resume the component.

While executing on_resume() any exception will be logged and reraised, then the component will remain in a `RESUMING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### shutdown_system(self, str reason=None) → void

Initiate a system-wide shutdown by generating and publishing a ShutdownSystem command.

The command is handled by the system’s NautilusKernel, which will invoke either stop (synchronously) or stop_async (asynchronously) depending on the execution context and the presence of an active event loop.

- **Parameters:** **reason** (_str_ _,_ ​*optional*​) – The reason for issuing the shutdown command.

#### start(self) → void

Start the component.

While executing on_start() any exception will be logged and reraised, then the component will remain in a `STARTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### state

ComponentState

Return the components current state.

- **Return type:** ComponentState
- **Type:** Component.state

#### stop(self) → void

Stop the component.

While executing on_stop() any exception will be logged and reraised, then the component will remain in a `STOPPING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### subscribe(self, SubscribeData command) → void

Subscribe to data for the given data type.

- **Parameters:** **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type for the subscription.

#### subscribed_custom_data(self) → list

Return the custom data types subscribed to.

- **Return type:** list[[DataType](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)]

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

#### unsubscribe(self, UnsubscribeData command) → void

Unsubscribe from data for the given data type.

- **Parameters:** **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type for the subscription.

#### venue

The clients venue ID (if applicable).

- **Returns:** Venue or `None`

### _class_ MarketDataClient

Bases: [`DataClient`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.DataClient)

MarketDataClient(ClientId client_id, MessageBus msgbus, Cache cache, Clock clock, Venue venue: Venue | None = None, config: NautilusConfig | None = None)

The base class for all market data clients.

- **Parameters:**
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)) – The data client ID.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the client.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the client.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the client.
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue) _,_ ​*optional*​) – The client venue. If multi-venue then can be `None`.
  - **config** ([_NautilusConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.NautilusConfig) _,_ ​*optional*​) – The configuration for the instance.

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### degrade(self) → void

Degrade the component.

While executing on_degrade() any exception will be logged and reraised, then the component will remain in a `DEGRADING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### dispose(self) → void

Dispose of the component.

While executing on_dispose() any exception will be logged and reraised, then the component will remain in a `DISPOSING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### fault(self) → void

Fault the component.

Calling this method multiple times has the same effect as calling it once (it is idempotent). Once called, it cannot be reversed, and no other methods should be called on this instance.

While executing on_fault() any exception will be logged and reraised, then the component will remain in a `FAULTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### _classmethod_ fully_qualified_name(cls) → str

Return the fully qualified name for the components class.

- **Return type:** str

#### id

The components ID.

- **Returns:** ComponentId

#### is_connected

If the client is connected.

- **Returns:** bool

#### is_degraded

bool

Return whether the current component state is `DEGRADED`.

- **Return type:** bool
- **Type:** Component.is_degraded

#### is_disposed

bool

Return whether the current component state is `DISPOSED`.

- **Return type:** bool
- **Type:** Component.is_disposed

#### is_faulted

bool

Return whether the current component state is `FAULTED`.

- **Return type:** bool
- **Type:** Component.is_faulted

#### is_initialized

bool

Return whether the component has been initialized (component.state >= `INITIALIZED`).

- **Return type:** bool
- **Type:** Component.is_initialized

#### is_running

bool

Return whether the current component state is `RUNNING`.

- **Return type:** bool
- **Type:** Component.is_running

#### is_stopped

bool

Return whether the current component state is `STOPPED`.

- **Return type:** bool
- **Type:** Component.is_stopped

#### request(self, RequestData request) → void

Request data for the given data type.

- **Parameters:** **request** ([_RequestData_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)) – The message for the data request.

#### request_bars(self, RequestBars request) → void

Request historical Bar data. To load historical data from a catalog, you can pass a list[DataCatalogConfig] to the TradingNodeConfig or the BacktestEngineConfig.

- **Parameters:** **request** ([_RequestBars_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestBars)) – The message for the data request.

#### request_instrument(self, RequestInstrument request) → void

Request Instrument data for the given instrument ID.

- **Parameters:** **request** ([_RequestInstrument_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestInstrument)) – The message for the data request.

#### request_instruments(self, RequestInstruments request) → void

Request all Instrument data for the given venue.

- **Parameters:** **request** ([_RequestInstruments_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestInstruments)) – The message for the data request.

#### request_order_book_snapshot(self, RequestOrderBookSnapshot request) → void

Request order book snapshot data.

- **Parameters:** **request** ([_RequestOrderBookSnapshot_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestOrderBookSnapshot)) – The message for the data request.

#### request_quote_ticks(self, RequestQuoteTicks request) → void

Request historical QuoteTick data.

- **Parameters:** **request** ([_RequestQuoteTicks_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)) – The message for the data request.

#### request_trade_ticks(self, RequestTradeTicks request) → void

Request historical TradeTick data.

- **Parameters:** **request** ([_RequestTradeTicks_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestTradeTicks)) – The message for the data request.

#### reset(self) → void

Reset the component.

All stateful fields are reset to their initial value.

While executing on_reset() any exception will be logged and reraised, then the component will remain in a `RESETTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### resume(self) → void

Resume the component.

While executing on_resume() any exception will be logged and reraised, then the component will remain in a `RESUMING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### shutdown_system(self, str reason=None) → void

Initiate a system-wide shutdown by generating and publishing a ShutdownSystem command.

The command is handled by the system’s NautilusKernel, which will invoke either stop (synchronously) or stop_async (asynchronously) depending on the execution context and the presence of an active event loop.

- **Parameters:** **reason** (_str_ _,_ ​*optional*​) – The reason for issuing the shutdown command.

#### start(self) → void

Start the component.

While executing on_start() any exception will be logged and reraised, then the component will remain in a `STARTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### state

ComponentState

Return the components current state.

- **Return type:** ComponentState
- **Type:** Component.state

#### stop(self) → void

Stop the component.

While executing on_stop() any exception will be logged and reraised, then the component will remain in a `STOPPING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### subscribe(self, SubscribeData command) → void

Subscribe to data for the given data type.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type for the subscription.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_bars(self, SubscribeBars command) → void

Subscribe to Bar data for the given bar type.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_funding_rates(self, SubscribeFundingRates command) → void

Subscribe to FundingRateUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_index_prices(self, SubscribeIndexPrices command) → void

Subscribe to IndexPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_instrument(self, SubscribeInstrument command) → void

Subscribe to the Instrument with the given instrument ID.

- **Parameters:** **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_instrument_close(self, SubscribeInstrumentClose command) → void

Subscribe to InstrumentClose updates for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_instrument_status(self, SubscribeInstrumentStatus command) → void

Subscribe to InstrumentStatus data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_instruments(self, SubscribeInstruments command) → void

Subscribe to all Instrument data.

- **Parameters:** **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_mark_prices(self, SubscribeMarkPrices command) → void

Subscribe to MarkPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_order_book_deltas(self, SubscribeOrderBook command) → void

Subscribe to OrderBookDeltas data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **depth** (_int_ _,_ _optional_ _,_ ​*default None*​) – The maximum depth for the subscription.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_order_book_snapshots(self, SubscribeOrderBook command) → void

Subscribe to OrderBook snapshots data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book level.
  - **depth** (_int_ _,_ ​*optional*​) – The maximum depth for the order book. A depth of 0 is maximum depth.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_quote_ticks(self, SubscribeQuoteTicks command) → void

Subscribe to QuoteTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribe_trade_ticks(self, SubscribeTradeTicks command) → void

Subscribe to TradeTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### subscribed_bars(self) → list

Return the bar types subscribed to.

- **Return type:** list[[BarType](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)]

#### subscribed_custom_data(self) → list

Return the custom data types subscribed to.

- **Return type:** list[[DataType](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)]

#### subscribed_funding_rates(self) → list

Return the funding rate update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_index_prices(self) → list

Return the index price update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_instrument_close(self) → list

Return the instrument closes subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_instrument_status(self) → list

Return the status update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_instruments(self) → list

Return the instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_mark_prices(self) → list

Return the mark price update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_order_book_deltas(self) → list

Return the order book delta instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_order_book_snapshots(self) → list

Return the order book snapshot instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_quote_ticks(self) → list

Return the quote tick instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_trade_ticks(self) → list

Return the trade tick instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

#### unsubscribe(self, UnsubscribeData command) → void

Unsubscribe from data for the given data type.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type for the subscription.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_bars(self, UnsubscribeBars command) → void

Unsubscribe from Bar data for the given bar type.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_funding_rates(self, UnsubscribeFundingRates command) → void

Unsubscribe from FundingRateUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_index_prices(self, UnsubscribeIndexPrices command) → void

Unsubscribe from IndexPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_instrument(self, UnsubscribeInstrument command) → void

Unsubscribe from Instrument data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_instrument_close(self, UnsubscribeInstrumentClose command) → void

Unsubscribe from InstrumentClose data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_instrument_status(self, UnsubscribeInstrumentStatus command) → void

Unsubscribe from InstrumentStatus data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument status updates to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_instruments(self, UnsubscribeInstruments command) → void

Unsubscribe from all Instrument data.

- **Parameters:** **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_mark_prices(self, UnsubscribeMarkPrices command) → void

Unsubscribe from MarkPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_order_book_deltas(self, UnsubscribeOrderBook command) → void

Unsubscribe from OrderBookDeltas data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_order_book_snapshots(self, UnsubscribeOrderBook command) → void

Unsubscribe from OrderBook snapshots data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_quote_ticks(self, UnsubscribeQuoteTicks command) → void

Unsubscribe from QuoteTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### unsubscribe_trade_ticks(self, UnsubscribeTradeTicks command) → void

Unsubscribe from TradeTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to unsubscribe from.
  - **params** (_dict_ \*[\**str* *,* *Any* *]\* _,_ ​*optional*​) – Additional params for the subscription.

#### venue

The clients venue ID (if applicable).

- **Returns:** Venue or `None`

## Engine

The DataEngine is the central component of the entire data stack.

The data engines primary responsibility is to orchestrate interactions between the DataClient instances, and the rest of the platform. This includes sending requests to, and receiving responses from, data endpoints via its registered data clients.

The engine employs a simple fan-in fan-out messaging pattern to execute DataCommand type messages, and process DataResponse messages or market data objects.

Alternative implementations can be written on top of the generic engine - which just need to override the execute, process, send and receive methods.

### _class_ DataEngine

Bases: [`Component`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Component)

DataEngine(MessageBus msgbus, Cache cache, Clock clock, config: DataEngineConfig | None = None) -> None

Provides a high-performance data engine for managing many DataClient instances, for the asynchronous ingest of data.

- **Parameters:**
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the engine.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the engine.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the engine.
  - **config** ([_DataEngineConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.data.config.DataEngineConfig) _,_ ​*optional*​) – The configuration for the instance.

#### check_connected(self) → bool

Check all of the engines clients are connected.

- **Returns:** True if all clients connected, else False.
- **Return type:** bool

#### check_disconnected(self) → bool

Check all of the engines clients are disconnected.

- **Returns:** True if all clients disconnected, else False.
- **Return type:** bool

#### command_count

The total count of data commands received by the engine.

- **Returns:** int

#### connect(self) → None

Connect the engine by calling connect on all registered clients.

#### data_count

The total count of data stream objects received by the engine.

- **Returns:** int

#### debug

If debug mode is active (will provide extra debug logging).

- **Returns:** bool

#### default_client

ClientId | None

Return the default data client registered with the engine.

- **Return type:** ClientId or `None`
- **Type:** DataEngine.default_client

#### degrade(self) → void

Degrade the component.

While executing on_degrade() any exception will be logged and reraised, then the component will remain in a `DEGRADING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### deregister_client(self, DataClient client) → void

Deregister the given data client from the data engine.

- **Parameters:** **client** ([_DataClient_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.DataClient)) – The data client to deregister.

#### disconnect(self) → None

Disconnect the engine by calling disconnect on all registered clients.

#### dispose(self) → void

Dispose of the component.

While executing on_dispose() any exception will be logged and reraised, then the component will remain in a `DISPOSING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### execute(self, DataCommand command) → void

Execute the given data command.

- **Parameters:** **command** ([_DataCommand_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.DataCommand)) – The command to execute.

#### fault(self) → void

Fault the component.

Calling this method multiple times has the same effect as calling it once (it is idempotent). Once called, it cannot be reversed, and no other methods should be called on this instance.

While executing on_fault() any exception will be logged and reraised, then the component will remain in a `FAULTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### _classmethod_ fully_qualified_name(cls) → str

Return the fully qualified name for the components class.

- **Return type:** str

#### get_external_client_ids(self) → set

Returns the configured external client order IDs.

- **Return type:** set[[ClientId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)]

#### id

The components ID.

- **Returns:** ComponentId

#### is_degraded

bool

Return whether the current component state is `DEGRADED`.

- **Return type:** bool
- **Type:** Component.is_degraded

#### is_disposed

bool

Return whether the current component state is `DISPOSED`.

- **Return type:** bool
- **Type:** Component.is_disposed

#### is_faulted

bool

Return whether the current component state is `FAULTED`.

- **Return type:** bool
- **Type:** Component.is_faulted

#### is_initialized

bool

Return whether the component has been initialized (component.state >= `INITIALIZED`).

- **Return type:** bool
- **Type:** Component.is_initialized

#### is_running

bool

Return whether the current component state is `RUNNING`.

- **Return type:** bool
- **Type:** Component.is_running

#### is_stopped

bool

Return whether the current component state is `STOPPED`.

- **Return type:** bool
- **Type:** Component.is_stopped

#### process(self, Data data) → void

Process the given data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data to process.

#### register_catalog(self, catalog: ParquetDataCatalog, str name: str = 'catalog_0') → None

Register the given data catalog with the engine.

- **Parameters:**
  - **catalog** ([_ParquetDataCatalog_](https://nautilustrader.io/docs/latest/api_reference/persistence#nautilus_trader.persistence.catalog.parquet.ParquetDataCatalog)) – The data catalog to register.
  - **name** (_str_ _,_ ​*default 'catalog_0'*​) – The name of the catalog to register.

#### register_client(self, DataClient client) → void

Register the given data client with the data engine.

- **Parameters:** **client** ([_DataClient_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.DataClient)) – The client to register.
- **Raises:** **ValueError** – If client is already registered.

#### register_default_client(self, DataClient client) → void

Register the given client as the default routing client (when a specific venue routing cannot be found).

Any existing default routing client will be overwritten.

- **Parameters:** **client** ([_DataClient_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.DataClient)) – The client to register.

#### register_venue_routing(self, DataClient client, Venue venue) → void

Register the given client to route messages to the given venue.

Any existing client in the routing map for the given venue will be overwritten.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue to route messages to.
  - **client** ([_DataClient_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.DataClient)) – The client for the venue routing.

#### registered_clients

list[ClientId]

Return the execution clients registered with the engine.

- **Return type:** list[[ClientId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)]
- **Type:** DataEngine.registered_clients

#### request(self, RequestData request) → void

Handle the given request.

- **Parameters:** **request** ([_RequestData_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)) – The request to handle.

#### request_count

The total count of data requests received by the engine.

- **Returns:** int

#### reset(self) → void

Reset the component.

All stateful fields are reset to their initial value.

While executing on_reset() any exception will be logged and reraised, then the component will remain in a `RESETTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### response(self, DataResponse response) → void

Handle the given response.

- **Parameters:** **response** ([_DataResponse_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.DataResponse)) – The response to handle.

#### response_count

The total count of data responses received by the engine.

- **Returns:** int

#### resume(self) → void

Resume the component.

While executing on_resume() any exception will be logged and reraised, then the component will remain in a `RESUMING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### routing_map

dict[Venue, DataClient]

Return the default data client registered with the engine.

- **Return type:** ClientId or `None`
- **Type:** DataEngine.routing_map

#### shutdown_system(self, str reason=None) → void

Initiate a system-wide shutdown by generating and publishing a ShutdownSystem command.

The command is handled by the system’s NautilusKernel, which will invoke either stop (synchronously) or stop_async (asynchronously) depending on the execution context and the presence of an active event loop.

- **Parameters:** **reason** (_str_ _,_ ​*optional*​) – The reason for issuing the shutdown command.

#### start(self) → void

Start the component.

While executing on_start() any exception will be logged and reraised, then the component will remain in a `STARTING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### state

ComponentState

Return the components current state.

- **Return type:** ComponentState
- **Type:** Component.state

#### stop(self) → void

Stop the component.

While executing on_stop() any exception will be logged and reraised, then the component will remain in a `STOPPING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### stop_clients(self) → void

Stop the registered clients.

#### subscribed_bars(self) → list

Return the bar types subscribed to.

- **Return type:** list[[BarType](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)]

#### subscribed_custom_data(self) → list

Return the custom data types subscribed to.

- **Return type:** list[[DataType](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)]

#### subscribed_funding_rates(self) → list

Return the funding rate update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_index_prices(self) → list

Return the index price update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_instrument_close(self) → list

Return the close price instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_instrument_status(self) → list

Return the status update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_instruments(self) → list

Return the instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_mark_prices(self) → list

Return the mark price update instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_order_book_deltas(self) → list

Return the order book delta instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_order_book_snapshots(self) → list

Return the order book snapshot instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_quote_ticks(self) → list

Return the quote tick instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_synthetic_quotes(self) → list

Return the synthetic instrument quotes subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_synthetic_trades(self) → list

Return the synthetic instrument trades subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### subscribed_trade_ticks(self) → list

Return the trade tick instruments subscribed to.

- **Return type:** list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

### _class_ SnapshotInfo

Bases: `object`

## Messages

### _class_ DataCommand

Bases: [`Command`](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.message.Command)

DataCommand(DataType data_type, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

The base class for all data commands.

- **Parameters:**
  - **data_type** (​*type*​) – The data type for the command.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the command.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ DataResponse

Bases: [`Response`](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.message.Response)

DataResponse(ClientId client_id: ClientId | None, Venue venue: Venue | None, DataType data_type, data, UUID4 correlation_id, UUID4 response_id, uint64_t ts_init, datetime start, datetime end, dict params: dict | None = None) -> None

Represents a response with data.

- **Parameters:**
  - **client_id** (ClientId or `None`) – The data client ID of the response.
  - **venue** (Venue or `None`) – The venue for the response.
  - **data_type** (​*type*​) – The data type of the response.
  - **data** (​*object*​) – The data of the response.
  - **correlation_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The correlation ID.
  - **response_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The response ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **start** (​*datetime*​) – The start datetime (UTC) of response time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of response time range (inclusive).
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the response.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the response.

- **Returns:** ClientId or `None`

#### correlation_id

The response correlation ID.

- **Returns:** UUID4

#### data

The response data.

- **Returns:** object

#### data_type

The response data type.

- **Returns:** type

#### end

The end datetime (UTC) of response time range.

#### id

The response message ID.

- **Returns:** UUID4

#### params

Additional specific parameters for the response.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of response time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the response.

- **Returns:** Venue or `None`

### _class_ RequestBars

Bases: [`RequestData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

RequestBars(BarType bar_type, datetime start: datetime | None, datetime end: datetime | None, int limit, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for bars.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **limit** (​*int*​) – The limit on the amount of bars received.
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### bar_type

The bar type for the request.

- **Returns:** BarType

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ RequestData

Bases: [`Request`](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.message.Request)

RequestData(DataType data_type, InstrumentId instrument_id: InstrumentId | None, datetime start: datetime | None, datetime end: datetime | None, int limit, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for data.

- **Parameters:**
  - **data_type** (​*type*​) – The data type for the request.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **limit** (​*int*​) – The limit on the amount of data to return for the request.
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ RequestInstrument

Bases: [`RequestData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

RequestInstrument(InstrumentId instrument_id, datetime start: datetime | None, datetime end: datetime | None, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ RequestInstruments

Bases: [`RequestData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

RequestInstruments(datetime start: datetime | None, datetime end: datetime | None, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for instruments.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ RequestOrderBookSnapshot

Bases: [`RequestData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

RequestOrderBookSnapshot(InstrumentId instrument_id, int limit, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for an order book snapshot.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **limit** (​*int*​) – The limit on the depth of the order book snapshot (default is None).
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ RequestQuoteTicks

Bases: [`RequestData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

RequestQuoteTicks(InstrumentId instrument_id, datetime start: datetime | None, datetime end: datetime | None, int limit, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for quote ticks.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **limit** (​*int*​) – The limit on the amount of quote ticks received.
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ RequestTradeTicks

Bases: [`RequestData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

RequestTradeTicks(InstrumentId instrument_id, datetime start: datetime | None, datetime end: datetime | None, int limit, ClientId client_id: ClientId | None, Venue venue: Venue | None, callback: Callable[[Any], None], UUID4 request_id, uint64_t ts_init, dict params: dict | None) -> None

Represents a request for trade ticks.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **limit** (​*int*​) – The limit on the amount of trade ticks received.
  - **client_id** (ClientId or `None`) – The data client ID for the request.
  - **venue** (Venue or `None`) – The venue for the request.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
  - **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* ​*]\*​) – Additional parameters for the request.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### callback

The callback for the response.

- **Returns:** Callable

#### client_id

The data client ID for the request.

- **Returns:** ClientId or `None`

#### data_type

The request data type.

- **Returns:** type

#### end

The end datetime (UTC) of request time range.

#### id

The request message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the request.

- **Returns:** InstrumentId

#### limit

The limit on the amount of data to return for the request.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### start

The start datetime (UTC) of request time range (inclusive).

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the request.

- **Returns:** Venue or `None`

#### with_dates(self, datetime start, datetime end, uint64_t ts_init)

### _class_ SubscribeBars

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeBars(BarType bar_type, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, bool await_partial=False, dict params: dict | None = None) -> None

Represents a command to subscribe to bars for an instrument.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **await_partial** (​*bool*​) – If the bar aggregator should await the arrival of a historical partial bar prior to actively aggregating new bars.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### await_partial

If the bar aggregator should await the arrival of a historical partial bar prior to actively aggregating new bars.

#### bar_type

The bar type for the subscription.

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestBars](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestBars)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestBars](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestBars)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeData

Bases: [`DataCommand`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.DataCommand)

SubscribeData(DataType data_type, InstrumentId instrument_id: InstrumentId | None, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to data.

- **Parameters:**
  - **data_type** (​*type*​) – The data type for the subscription.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeFundingRates

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeFundingRates(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to funding rates.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeIndexPrices

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeIndexPrices(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to index prices.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeInstrument

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeInstrument(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeInstrumentClose

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeInstrumentClose(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to the close of an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeInstrumentStatus

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeInstrumentStatus(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to the status of an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeInstruments

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeInstruments(ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to all instruments of a venue.

- **Parameters:**
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestInstruments](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestInstruments)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestInstruments](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestInstruments)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeMarkPrices

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeMarkPrices(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to mark prices.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeOrderBook

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeOrderBook(InstrumentId instrument_id, type book_data_type, BookType book_type, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, int depth=0, bool managed=True, int interval_ms=0, dict params: dict | None = None) -> None

Represents a command to subscribe to order book deltas for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **data_type** (DataType, {`OrderBookDeltas`, `OrderBookDepth10`}) – The data type for book updates.
  - **book_type** (​*BookType*​) – The order book type.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **depth** (_int_ _,_ _optional_ _,_ ​*default 0*​) – The maximum depth for the subscription.
  - **managed** (_bool_ _,_ _optional_ _,_ ​*default True*​) – If an order book should be managed by the data engine based on the subscribed feed.
  - **interval_ms** (_int_ _,_ _default 0_ \*(\*_no interval snapshots_ ​*)*​) – The interval (milliseconds) between snapshots.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:**
  - **ValueError** – If both client_id and venue are both `None` (not enough routing info).
  - **ValueError** – If interval_ms is negative (< 0).

#### book_type

The order book type.

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### depth

The maximum depth for the subscription.

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### interval_ms

The order book snapshot interval in milliseconds (must be positive for snapshots).

#### managed

If an order book should be managed by the data engine based on the subscribed feed.

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestData](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestData)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeQuoteTicks

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeQuoteTicks(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to quote ticks.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestQuoteTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestQuoteTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ SubscribeTradeTicks

Bases: [`SubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.SubscribeData)

SubscribeTradeTicks(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to subscribe to trade ticks.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### to_request(self, datetime start: datetime | None, datetime end: datetime | None, callback: Callable[[Any], None]) → [RequestTradeTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestTradeTicks)

Convert this subscribe message to a request message.

- **Parameters:**
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range (inclusive).
  - **end** (​*datetime*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **callback** (_Callable_ _[_ \*[\**Any* *]\* _,_ _None_ ​*]*​) – The delegate to call with the data.
- **Returns:** The converted request message.
- **Return type:** [RequestTradeTicks](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.RequestTradeTicks)

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeBars

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeBars(BarType bar_type, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from bars for an instrument.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### bar_type

The bar type for the subscription.

- **Returns:** BarType

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeData

Bases: [`DataCommand`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.DataCommand)

UnsubscribeData(DataType data_type, InstrumentId instrument_id: InstrumentId | None, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe to data.

- **Parameters:**
  - **data_type** (​*type*​) – The data type for the subscription.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeFundingRates

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeFundingRates(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from funding rates for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeIndexPrices

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeIndexPrices(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from index prices for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeInstrument

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeInstrument(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe to an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeInstrumentClose

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeInstrumentClose(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from instrument close for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeInstrumentStatus

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeInstrumentStatus(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from instrument status.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeInstruments

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeInstruments(ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe to all instruments.

- **Parameters:**
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeMarkPrices

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeMarkPrices(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from mark prices for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeOrderBook

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeOrderBook(InstrumentId instrument_id, type book_data_type, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from order book updates for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **book_data_type** (type, {`OrderBookDelta`, `OrderBookDepth10`}) – The data type for book updates.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeQuoteTicks

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeQuoteTicks(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from quote ticks for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`

### _class_ UnsubscribeTradeTicks

Bases: [`UnsubscribeData`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.messages.UnsubscribeData)

UnsubscribeTradeTicks(InstrumentId instrument_id, ClientId client_id: ClientId | None, Venue venue: Venue | None, UUID4 command_id, uint64_t ts_init, dict params: dict | None = None) -> None

Represents a command to unsubscribe from trade ticks for an instrument.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** (ClientId or `None`) – The data client ID for the command.
  - **venue** (Venue or `None`) – The venue for the command.
  - **command_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The command ID.
  - **ts_init** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the object was initialized.
  - **params** (_dict_ \*[\**str* *,* *object* *]\* _,_ ​*optional*​) – Additional parameters for the subscription.
- **Raises:** **ValueError** – If both client_id and venue are both `None` (not enough routing info).

#### client_id

The data client ID for the command.

- **Returns:** ClientId or `None`

#### data_type

The command data type.

- **Returns:** type

#### id

The command message ID.

- **Returns:** UUID4

#### instrument_id

The instrument ID for the subscription.

- **Returns:** InstrumentId or `None`

#### params

Additional specific parameters for the command.

- **Returns:** dict[str, object] or `None`

#### ts_init

UNIX timestamp (nanoseconds) when the object was initialized.

- **Returns:** uint64_t

#### venue

The venue for the command.

- **Returns:** Venue or `None`
