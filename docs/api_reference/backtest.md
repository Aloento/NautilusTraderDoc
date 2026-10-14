# Backtest

The backtest subpackage groups components relating to backtesting.

This module provides a data client for backtesting.

### _class_ BacktestDataClient

Bases: [`DataClient`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.DataClient)

BacktestDataClient(ClientId client_id, MessageBus msgbus, Cache cache, Clock clock, config: NautilusConfig | None = None) -> None

Provides an implementation of DataClient for backtesting.

- **Parameters:**
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)) – The data client ID.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the client.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the client.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the client.
  - **config** ([_NautilusConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.NautilusConfig) _,_ ​*optional*​) – The configuration for the instance.

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

#### venue

The clients venue ID (if applicable).

- **Returns:** Venue or `None`

### _class_ BacktestMarketDataClient

Bases: [`MarketDataClient`](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.client.MarketDataClient)

BacktestMarketDataClient(ClientId client_id, MessageBus msgbus, Cache cache, Clock clock)

Provides an implementation of MarketDataClient for backtesting.

- **Parameters:**
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)) – The data client ID.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the client.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the client.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the client.

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

#### request_instrument(self, RequestInstrument request) → void

#### request_instruments(self, RequestInstruments request) → void

#### request_order_book_snapshot(self, RequestOrderBookSnapshot request) → void

#### request_quote_ticks(self, RequestQuoteTicks request) → void

#### request_trade_ticks(self, RequestTradeTicks request) → void

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

#### subscribe_bars(self, SubscribeBars command) → void

#### subscribe_funding_rates(self, SubscribeFundingRates command) → void

#### subscribe_index_prices(self, SubscribeIndexPrices command) → void

#### subscribe_instrument(self, SubscribeInstrument command) → void

#### subscribe_instrument_close(self, SubscribeInstrumentClose command) → void

#### subscribe_instrument_status(self, SubscribeInstrumentStatus command) → void

#### subscribe_instruments(self, SubscribeInstruments command) → void

#### subscribe_mark_prices(self, SubscribeMarkPrices command) → void

#### subscribe_order_book_deltas(self, SubscribeOrderBook command) → void

#### subscribe_order_book_snapshots(self, SubscribeOrderBook command) → void

#### subscribe_quote_ticks(self, SubscribeQuoteTicks command) → void

#### subscribe_trade_ticks(self, SubscribeTradeTicks command) → void

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

#### unsubscribe_bars(self, UnsubscribeBars command) → void

#### unsubscribe_funding_rates(self, UnsubscribeFundingRates command) → void

#### unsubscribe_index_prices(self, UnsubscribeIndexPrices command) → void

#### unsubscribe_instrument(self, UnsubscribeInstrument command) → void

#### unsubscribe_instrument_close(self, UnsubscribeInstrumentClose command) → void

#### unsubscribe_instrument_status(self, UnsubscribeInstrumentStatus command) → void

#### unsubscribe_instruments(self, UnsubscribeInstruments command) → void

#### unsubscribe_mark_prices(self, UnsubscribeMarkPrices command) → void

#### unsubscribe_order_book_deltas(self, UnsubscribeOrderBook command) → void

#### unsubscribe_order_book_snapshots(self, UnsubscribeOrderBook command) → void

#### unsubscribe_quote_ticks(self, UnsubscribeQuoteTicks command) → void

#### unsubscribe_trade_ticks(self, UnsubscribeTradeTicks command) → void

#### venue

The clients venue ID (if applicable).

- **Returns:** Venue or `None`

### _class_ BacktestDataIterator

Bases: `object`

BacktestDataIterator() -> None

Time-ordered multiplexer for historical `Data` streams in backtesting.

The iterator efficiently manages multiple data streams and yields `Data` objects in strict chronological order based on their `ts_init` timestamps. It supports both static data lists and dynamic data generators for streaming large datasets.

**Architecture:**

- ​**Single-stream optimization**​: When exactly one stream is loaded, uses a fast array walk for optimal performance.
- ​**Multi-stream merging**​: With two or more streams, employs a binary min-heap to perform efficient k-way merge sorting.
- ​**Dynamic streaming**​: Supports Python generators that yield data chunks on-demand, enabling processing of datasets larger than available memory.

**Stream Priority:**

Streams can be assigned different priorities using the `append_data` parameter:

- `append_data=True` (default): Lower priority, processed after existing streams
- `append_data=False`: Higher priority, processed before existing streams

When multiple data points have identical timestamps, higher priority streams are yielded first.

**Performance Characteristics:**

- ​**Memory efficient**​: Dynamic generators load data incrementally
- ​**Time complexity**​: O(log n) per item for n streams (heap operations)
- ​**Space complexity**​: O(k) where k is the total number of active data points across all streams at any given time
- **Parameters:** **empty_data_callback** (_Callable_ _[_ \*[\*_str_ _,_ _int_ *]\* _,_ _None_ _]_ _,_ ​*optional*​) – Called once per stream when it is exhausted. Arguments are the stream name and the final `ts_init` timestamp observed.

#### SEE ALSO

[`BacktestEngine.add_data`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.BacktestEngine.add_data) : Add static data to the backtest engine

[`BacktestEngine.add_data_iterator`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.BacktestEngine.add_data_iterator) : Add streaming data generators

#### add_data(self, data_name, list data, bool append_data=True)

Add (or replace) a named, pre-sorted data list for static data loading.

If a stream with the same `data_name` already exists, it will be replaced with the new data.

- **Parameters:**
  - **data_name** (​*str*​) – Unique identifier for the data stream.
  - **data** (_list_ _​[​_[_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data) ​*]*​) – Data instances sorted ascending by ts_init.
  - **append_data** (bool, default `True`) – Controls stream priority for timestamp ties: `True` – lower priority (appended). `False` – higher priority (prepended).
- **Raises:** **ValueError** – If data_name is not a valid string.

#### all_data(self) → dict

Return a _shallow_ mapping of `{stream_name: list[Data]}`.

#### data(self, str data_name) → list

Return the underlying data list for data_name.

- **Return type:** list[[Data](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)]
- **Raises:**
  - **ValueError** – If data_name is not a valid string.
  - **KeyError** – If the stream is unknown.

#### init_data(self, str data_name, data_generator, bool append_data=True)

Add (or replace) a named data generator for streaming large datasets.

This method enables memory-efficient processing of large datasets by using Python generators that yield data chunks on-demand. The generator is called incrementally as data is consumed, allowing datasets larger than available memory to be processed.

The generator should yield lists of `Data` objects, where each list represents a chunk of data. When a chunk is exhausted, the iterator automatically calls `next()` on the generator to fetch the next chunk.

- **Parameters:**
  - **data_name** (​*str*​) – Unique identifier for the data stream.
  - **data_generator** (_Generator_ \*[\*_list_ _​[​_[_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data) _]_ _,_ _None_ _,_ _None_ ​*]*​) – A Python generator that yields lists of `Data` instances sorted ascending by ts_init.
  - **append_data** (bool, default `True`) – Controls stream priority for timestamp ties: `True` – lower priority (appended). `False` – higher priority (prepended).
- **Raises:** **ValueError** – If data_name is not a valid string.

#### is_done(self) → bool

Return `True` when every stream has been fully consumed.

#### next(self) → [Data](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)

Return the next `Data` object in chronological order.

This method implements the core iteration logic, yielding data points from all streams in strict chronological order based on `ts_init` timestamps. When multiple data points have identical timestamps, stream priority determines the order.

The method automatically handles:

- Single-stream optimization for performance
- Multi-stream heap-based merging
- Dynamic data loading from generators
- Stream exhaustion and cleanup
- **Returns:** The next `Data` object in chronological order, or `None` when all streams are exhausted.
- **Return type:** [Data](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data) or None

#### remove_data(self, str data_name, bool complete_remove=False) → void

Remove the data stream identified by `data_name`. The operation is silently ignored if the specified stream does not exist.

- **Parameters:**

  - **data_name** (​*str*​) – The unique identifier of the data stream to remove.
  - **complete_remove** (_bool_ _,_ ​*default False*​) –
    Controls the level of cleanup performed:

    - `False`: Remove stream data but preserve generator function for potential

    > re-initialization (useful for temporary stream removal)

    - `True`: Complete removal including any associated generator function (recommended for permanent stream removal)

- **Raises:** **ValueError** – If data_name is not a valid string.

#### set_index(self, str data_name, int index) → void

Move the cursor of data_name to index and rebuild ordering.

- **Raises:** **ValueError** – If data_name is not a valid string.

### _class_ BacktestEngine

Bases: `object`

BacktestEngine(config: BacktestEngineConfig | None = None) -> None

Provides a backtest engine to run a portfolio of strategies over historical data.

- **Parameters:** **config** ([_BacktestEngineConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestEngineConfig) _,_ ​*optional*​) – The configuration for the instance.
- **Raises:** **TypeError** – If config is not of type BacktestEngineConfig.

#### add_actor(self, Actor actor: Actor) → None

Add the given actor to the backtest engine.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to add.

#### add_actors(self, list actors: list[Actor]) → None

Add the given list of actors to the backtest engine.

- **Parameters:** **actors** (_list_ _​[​_[_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor) ​*]*​) – The actors to add.

#### add_data(self, list data, ClientId client_id=None, bool validate=True, bool sort=True) → None

Add the given data to the backtest engine.

- **Parameters:**
  - **data** (_list_ _​[​_[_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data) ​*]*​) – The data to add.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The client ID to associate with the data.
  - **validate** (_bool_ _,_ ​*default True*​) – If data should be validated (recommended when adding data directly to the engine).
  - **sort** (_bool_ _,_ ​*default True*​) – If data should be sorted by ts_init with the rest of the stream after adding (recommended when adding data directly to the engine).
- **Raises:**
  - **ValueError** – If data is empty.
  - **ValueError** – If data contains objects which are not a type of Data.
  - **ValueError** – If instrument_id for the data is not found in the cache.
  - **ValueError** – If data elements do not have an instrument_id and client_id is `None`.
  - **TypeError** – If data is a Rust PyO3 data type (cannot add directly to engine yet).

#### WARNING

Assumes all data elements are of the same type. Adding lists of varying data types could result in incorrect backtest logic.

Caution if adding data without sort being True, as this could lead to running backtests on a stream which does not have monotonically increasing timestamps.

#### add_data_iterator(self, str data_name, generator: Generator[list[Data], None, None], ClientId client_id=None) → None

Add a single stream generator that yields `list[Data]` objects for the low-level streaming backtest API.

- **Parameters:**
  - **data_name** (​*str*​) – The name identifier for the data stream.
  - **generator** (_Generator_ \*[\*_list_ _​[​_[_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data) _]_ _,_ _None_ _,_ _None_ ​*]*​) – A Python generator that yields lists of `Data` objects.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The client ID to associate with the data.

#### add_exec_algorithm(self, ExecAlgorithm exec_algorithm: ExecAlgorithm) → None

Add the given execution algorithm to the backtest engine.

- **Parameters:** **exec_algorithm** ([_ExecAlgorithm_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.algorithm.ExecAlgorithm)) – The execution algorithm to add.

#### add_exec_algorithms(self, list exec_algorithms: list[ExecAlgorithm]) → None

Add the given list of execution algorithms to the backtest engine.

- **Parameters:** **exec_algorithms** (_list_ _​[​_[_ExecAlgorithm_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.algorithm.ExecAlgorithm) ​*]*​) – The execution algorithms to add.

#### add_instrument(self, Instrument instrument) → None

Add the instrument to the backtest engine.

The instrument must be valid for its associated venue. For instance, derivative instruments which would trade on margin cannot be added to a venue with a `CASH` account.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument to add.
- **Raises:**
  - [**InvalidConfiguration**](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.InvalidConfiguration) – If the venue for the instrument has not been added to the engine.
  - [**InvalidConfiguration**](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.InvalidConfiguration) – If instrument is not valid for its associated venue.

#### add_strategies(self, list strategies: list[Strategy]) → None

Add the given list of strategies to the backtest engine.

- **Parameters:** **strategies** (_list_ _​[​_[_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy) ​*]*​) – The strategies to add.

#### add_strategy(self, Strategy strategy: Strategy) → None

Add the given strategy to the backtest engine.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to add.

#### add_venue(self, Venue venue: Venue, OmsType oms_type: OmsType, AccountType account_type: AccountType, list starting_balances: list[Money], Currency base_currency: Currency | None = None, default_leverage: Decimal | None = None, dict leverages: dict[InstrumentId, Decimal] | None = None, MarginModel margin_model: MarginModel = None, list modules: list[SimulationModule] | None = None, FillModel fill_model: FillModel | None = None, FeeModel fee_model: FeeModel | None = None, LatencyModel latency_model: LatencyModel | None = None, BookType book_type: BookType = BookType.L1_MBP, routing: bool = False, reject_stop_orders: bool = True, support_gtd_orders: bool = True, support_contingent_orders: bool = True, use_position_ids: bool = True, use_random_ids: bool = False, use_reduce_only: bool = True, use_message_queue: bool = True, bar_execution: bool = True, bar_adaptive_high_low_ordering: bool = False, trade_execution: bool = False, allow_cash_borrowing: bool = False, frozen_account: bool = False) → None

Add a SimulatedExchange with the given parameters to the backtest engine.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue ID.
  - **oms_type** (OmsType {`HEDGING`, `NETTING`}) – The order management system type for the exchange. If `HEDGING` will generate new position IDs.
  - **account_type** (​*AccountType*​) – The account type for the exchange.
  - **starting_balances** (_list_ _​[​_[_Money_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money) ​*]*​) – The starting account balances (specify one for a single asset account).
  - **base_currency** ([_Currency_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Currency) _,_ ​*optional*​) – The account base currency for the client. Use `None` for multi-currency accounts.
  - **default_leverage** (_Decimal_ _,_ ​*optional*​) – The account default leverage (for margin accounts).
  - **leverages** (_dict_ _​[​_[_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId) _,_ _Decimal_ _]_ _,_ ​*optional*​) – The instrument specific leverage configuration (for margin accounts).
  - **margin_model** ([_MarginModelConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.MarginModelConfig) _,_ ​*optional*​) – The margin calculation model configuration. Default ‘leveraged’.
  - **modules** (_list_ _​[​_[_SimulationModule_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.modules.SimulationModule) _]_ _,_ ​*optional*​) – The simulation modules to load into the exchange.
  - **fill_model** ([_FillModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel) _,_ ​*optional*​) – The fill model for the exchange.
  - **fee_model** ([_FeeModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel) _,_ ​*optional*​) – The fee model for the venue.
  - **latency_model** ([_LatencyModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.LatencyModel) _,_ ​*optional*​) – The latency model for the exchange.
  - **book_type** (BookType, default `BookType.L1_MBP`) – The default order book type.
  - **routing** (_bool_ _,_ ​*default False*​) – If multi-venue routing should be enabled for the execution client.
  - **reject_stop_orders** (_bool_ _,_ ​*default True*​) – If stop orders are rejected on submission if trigger price is in the market.
  - **support_gtd_orders** (_bool_ _,_ ​*default True*​) – If orders with GTD time in force will be supported by the venue.
  - **support_contingent_orders** (_bool_ _,_ ​*default True*​) – If contingent orders will be supported/respected by the venue. If False, then it’s expected the strategy will be managing any contingent orders.
  - **use_position_ids** (_bool_ _,_ ​*default True*​) – If venue position IDs will be generated on order fills.
  - **use_random_ids** (_bool_ _,_ ​*default False*​) – If all venue generated identifiers will be random UUID4’s.
  - **use_reduce_only** (_bool_ _,_ ​*default True*​) – If the reduce_only execution instruction on orders will be honored.
  - **use_message_queue** (_bool_ _,_ ​*default True*​) – If an internal message queue should be used to process trading commands in sequence after they have initially arrived. Setting this to False would be appropriate for real-time sandbox environments, where we don’t want to introduce additional latency of waiting for the next data event before processing the trading command.
  - **bar_execution** (_bool_ _,_ ​*default True*​) – If bars should be processed by the matching engine(s) (and move the market).
  - **bar_adaptive_high_low_ordering** (_bool_ _,_ ​*default False*​) – Determines whether the processing order of bar prices is adaptive based on a heuristic. This setting is only relevant when bar_execution is True. If False, bar prices are always processed in the fixed order: Open, High, Low, Close. If True, the processing order adapts with the heuristic:
    - If High is closer to Open than Low then the processing order is Open, High, Low, Close.
    - If Low is closer to Open than High then the processing order is Open, Low, High, Close.
  - **trade_execution** (_bool_ _,_ ​*default False*​) – If trades should be processed by the matching engine(s) (and move the market).
  - **allow_cash_borrowing** (_bool_ _,_ ​*default False*​) – If cash accounts should allow borrowing (negative balances).
  - **frozen_account** (_bool_ _,_ ​*default False*​) – If the account for this exchange is frozen (balances will not change).
- **Raises:** **ValueError** – If venue is already registered with the engine.

#### backtest_end

pd.Timestamp | None

Return the last backtest run time range end (if run).

- **Return type:** pd.Timestamp or `None`
- **Type:** BacktestEngine.backtest_end

#### backtest_start

pd.Timestamp | None

Return the last backtest run time range start (if run).

- **Return type:** pd.Timestamp or `None`
- **Type:** BacktestEngine.backtest_start

#### cache

CacheFacade

Return the engines internal read-only cache.

- **Return type:** [CacheFacade](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)
- **Type:** BacktestEngine.cache

#### change_fill_model(self, Venue venue, FillModel model) → None

Change the fill model for the exchange of the given venue.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue of the simulated exchange.
  - **model** ([_FillModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)) – The fill model to change to.

#### clear_actors(self) → None

Clear all actors from the engines internal trader.

#### clear_data(self) → None

Clear the engines internal data stream.

Does not clear added instruments.

#### clear_exec_algorithms(self) → None

Clear all execution algorithms from the engines internal trader.

#### clear_strategies(self) → None

Clear all trading strategies from the engines internal trader.

#### data

list[Data]

Return the engines internal data stream.

- **Return type:** list[[Data](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)]
- **Type:** BacktestEngine.data

#### dispose(self) → None

Dispose of the backtest engine by disposing the trader and releasing system resources.

Calling this method multiple times has the same effect as calling it once (it is idempotent). Once called, it cannot be reversed, and no other methods should be called on this instance.

#### dump_pickled_data(self) → bytes

Return the internal data stream pickled.

- **Return type:** bytes

#### end(self)

Manually end the backtest.

#### get_log_guard(self) → nautilus_pyo3.LogGuard | [LogGuard](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.LogGuard) | None

Return the global logging subsystems log guard.

May return `None` if the logging subsystem was already initialized.

- **Return type:** nautilus_pyo3.LogGuard | [LogGuard](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.LogGuard) | None

#### get_result(self)

Return the backtest result from the last run.

- **Return type:** [BacktestResult](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.results.BacktestResult)

#### instance_id

UUID4

Return the engines instance ID.

This is a unique identifier per initialized engine.

- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Type:** BacktestEngine.instance_id

#### iteration

int

Return the backtest engine iteration count.

- **Return type:** int
- **Type:** BacktestEngine.iteration

#### kernel

NautilusKernel

Return the internal kernel for the engine.

- **Return type:** [NautilusKernel](https://nautilustrader.io/docs/latest/api_reference/system#nautilus_trader.system.kernel.NautilusKernel)
- **Type:** BacktestEngine.kernel

#### list_venues(self) → list[[Venue](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)]

Return the venues contained within the engine.

- **Return type:** list[[Venue](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)]

#### load_pickled_data(self, bytes data) → None

Load the given pickled data directly into the internal data stream.

It is highly advised to only pass data to this method which was obtained through a call to .dump_pickled_data().

#### WARNING

This low-level direct access method makes the following assumptions: : - The data contains valid Nautilus objects only, which inherit from Data.

- The data was successfully pickled from a call to pickle.dumps().
- The data was sorted prior to pickling.
- All required instruments have been added to the engine.

#### logger

Logger

Return the internal logger for the engine.

- **Return type:** [Logger](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Logger)
- **Type:** BacktestEngine.logger

#### machine_id

str

Return the engines machine ID.

- **Return type:** str
- **Type:** BacktestEngine.machine_id

#### portfolio

PortfolioFacade

Return the engines internal read-only portfolio.

- **Return type:** [PortfolioFacade](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)
- **Type:** BacktestEngine.portfolio

#### reset(self) → None

Reset the backtest engine.

All stateful fields are reset to their initial value.

Note: instruments and data are not dropped/reset, this can be done through a separate call to .clear_data() if desired.

#### run(self, start: datetime | str | int | None = None, end: datetime | str | int | None = None, str run_config_id: str | None = None, streaming: bool = False) → None

Run a backtest.

At the end of the run the trader and strategies will be stopped, then post-run analysis performed.

For datasets larger than available memory, use streaming mode with the following sequence:

- 1. Add initial data batch and strategies
- 2. Call run(streaming=True)
- 3. Call clear_data()
- 4. Add next batch of data stream
- 5. Call run(streaming=False) or end() when processing the final batch
- **Parameters:**

  - **start** (_datetime_ _or_ _str_ _or_ _int_ _,_ ​*optional*​) – The start datetime (UTC) for the backtest run. If `None` engine runs from the start of the data.
  - **end** (_datetime_ _or_ _str_ _or_ _int_ _,_ ​*optional*​) – The end datetime (UTC) for the backtest run. If `None` engine runs to the end of the data.
  - **run_config_id** (_str_ _,_ ​*optional*​) – The tokenized BacktestRunConfig ID.
  - **streaming** (_bool_ _,_ ​*default False*​) –
    Controls data loading and processing mode:

    - If False (default): Loads all data at once.

    > This is currently the only supported mode for custom data (e.g., option Greeks).

    - If True, loads data in chunks for memory-efficient processing of large datasets.

- **Raises:**

  - **ValueError** – If no data has been added to the engine.
  - **ValueError** – If the start is >= the end datetime.

#### run_config_id

str

Return the last backtest engine run config ID.

- **Return type:** str or `None`
- **Type:** BacktestEngine.run_config_id

#### run_finished

pd.Timestamp | None

Return when the last backtest run finished (if run).

- **Return type:** pd.Timestamp or `None`
- **Type:** BacktestEngine.run_finished

#### run_id

UUID4

Return the last backtest engine run ID (if run).

- **Return type:** UUID4 or `None`
- **Type:** BacktestEngine.run_id

#### run_started

pd.Timestamp | None

Return when the last backtest run started (if run).

- **Return type:** pd.Timestamp or `None`
- **Type:** BacktestEngine.run_started

#### set_default_market_data_client(self) → None

#### sort_data(self) → None

Sort the engines internal data stream.

#### trader

Trader

Return the engines internal trader.

- **Return type:** [Trader](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Trader)
- **Type:** BacktestEngine.trader

#### trader_id

TraderId

Return the engines trader ID.

- **Return type:** [TraderId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.TraderId)
- **Type:** BacktestEngine.trader_id

### _class_ OrderMatchingEngine

Bases: `object`

OrderMatchingEngine(Instrument instrument, uint32_t raw_id, FillModel fill_model, FeeModel fee_model, BookType book_type, OmsType oms_type, AccountType account_type, MessageBus msgbus, CacheFacade cache, TestClock clock, bool reject_stop_orders=True, bool support_gtd_orders=True, bool support_contingent_orders=True, bool use_position_ids=True, bool use_random_ids=False, bool use_reduce_only=True, bool bar_execution=True, bool bar_adaptive_high_low_ordering=False, bool trade_execution=False) -> None

Provides an order matching engine for a single market.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The market instrument for the matching engine.
  - **raw_id** (​*uint32_t*​) – The raw integer ID for the instrument.
  - **fill_model** ([_FillModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)) – The fill model for the matching engine.
  - **fee_model** ([_FeeModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel)) – The fee model for the matching engine.
  - **book_type** (​*BookType*​) – The order book type for the engine.
  - **oms_type** (​*OmsType*​) – The order management system type for the matching engine. Determines the generation and handling of venue position IDs.
  - **account_type** (​*AccountType*​) – The account type for the matching engine. Determines allowable executions based on the instrument.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the matching engine.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the matching engine.
  - **clock** ([_TestClock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.TestClock)) – The clock for the matching engine.
  - **logger** ([_Logger_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Logger)) – The logger for the matching engine.
  - **bar_execution** (_bool_ _,_ ​*default True*​) – If bars should be processed by the matching engine (and move the market).
  - **trade_execution** (_bool_ _,_ ​*default False*​) – If trades should be processed by the matching engine (and move the market).
  - **reject_stop_orders** (_bool_ _,_ ​*default True*​) – If stop orders are rejected if already in the market on submitting.
  - **support_gtd_orders** (_bool_ _,_ ​*default True*​) – If orders with GTD time in force will be supported by the venue.
  - **support_contingent_orders** (_bool_ _,_ ​*default True*​) – If contingent orders will be supported/respected by the venue. If False, then its expected the strategy will be managing any contingent orders.
  - **use_position_ids** (_bool_ _,_ ​*default True*​) – If venue position IDs will be generated on order fills.
  - **use_random_ids** (_bool_ _,_ ​*default False*​) – If all venue generated identifiers will be random UUID4’s.
  - **use_reduce_only** (_bool_ _,_ ​*default True*​) – If the reduce_only execution instruction on orders will be honored.
  - **auction_match_algo** (_Callable_ _[_ \*[\*_Ladder_ _,_ _Ladder_ *]\* _,_ _Tuple_ \*[\**List*_,_ _List_ *]\* _,_ ​*optional*​) – The auction matching algorithm.
  - **bar_adaptive_high_low_ordering** (_bool_ _,_ ​*default False*​) – Determines whether the processing order of bar prices is adaptive based on a heuristic. This setting is only relevant when bar_execution is True. If False, bar prices are always processed in the fixed order: Open, High, Low, Close. If True, the processing order adapts with the heuristic:
    - If High is closer to Open than Low then the processing order is Open, High, Low, Close.
    - If Low is closer to Open than High then the processing order is Open, Low, High, Close.

#### accept_order(self, Order order) → void

#### account_type

The account type for the matching engine.

- **Returns:** AccountType

#### apply_fills(self, Order order, list fills, LiquiditySide liquidity_side, PositionId venue_position_id: PositionId | None = None, Position position: Position | None = None) → void

Apply the given list of fills to the given order. Optionally provide existing position details.

- If the fills list is empty, an error will be logged.
- Market orders will be rejected if no opposing orders are available to fulfill them.
- **Parameters:**

  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to fill.
  - **fills** (_list_ \*[\*_tuple_ _​[​_[_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price) _,_ [_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity) _]_ ​*]*​) – The fills to apply to the order.
  - **liquidity_side** (​*LiquiditySide*​) – The liquidity side for the fill(s).
  - **venue_position_id** ([_PositionId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.PositionId) _,_ ​*optional*​) – The current venue position ID related to the order (if assigned).
  - **position** ([_Position_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Position) _,_ ​*optional*​) – The current position related to the order (if any).

- **Raises:** **ValueError** – If liquidity_side is `NO_LIQUIDITY_SIDE`.

#### WARNING

The liquidity_side will override anything previously set on the order.

#### best_ask_price(self) → [Price](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)

Return the best ask price for the given instrument ID (if found).

- **Return type:** Price or `None`

#### best_bid_price(self) → [Price](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)

Return the best bid price for the given instrument ID (if found).

- **Return type:** Price or `None`

#### book_type

The order book type for the matching engine.

- **Returns:** BookType

#### cache

The cache for the matching engine.

- **Returns:** CacheFacade

#### cancel_order(self, Order order, bool cancel_contingencies=True) → void

#### determine_limit_price_and_volume(self, Order order) → list

Return the projected fills for the given _limit_ order filling passively from its limit price.

The list may be empty if no fills.

- **Parameters:** **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to determine fills for.
- **Return type:** list[tuple[[Price](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price), [Quantity](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)]]
- **Raises:** **ValueError** – If the order does not have a LIMIT price.

#### determine_market_price_and_volume(self, Order order) → list

Return the projected fills for the given _marketable_ order filling aggressively into the opposite order side.

The list may be empty if no fills.

- **Parameters:** **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to determine fills for.
- **Return type:** list[tuple[[Price](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price), [Quantity](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)]]

#### expire_order(self, Order order) → void

#### fill_limit_order(self, Order order) → void

Fill the given limit order.

- **Parameters:** **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to fill.
- **Raises:** **ValueError** – If the order does not have a LIMIT price.

#### fill_market_order(self, Order order) → void

Fill the given _marketable_ order.

- **Parameters:** **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to fill.

#### fill_order(self, Order order, Price last_px, Quantity last_qty, LiquiditySide liquidity_side, PositionId venue_position_id: PositionId | None = None, Position position: Position | None = None) → void

Apply the given list of fills to the given order. Optionally provide existing position details.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to fill.
  - **last_px** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The fill price for the order.
  - **last_qty** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)) – The fill quantity for the order.
  - **liquidity_side** (​*LiquiditySide*​) – The liquidity side for the fill.
  - **venue_position_id** ([_PositionId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.PositionId) _,_ ​*optional*​) – The current venue position ID related to the order (if assigned).
  - **position** ([_Position_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Position) _,_ ​*optional*​) – The current position related to the order (if any).
- **Raises:** **ValueError** – If liquidity_side is `NO_LIQUIDITY_SIDE`.

#### WARNING

The liquidity_side will override anything previously set on the order.

#### get_book(self) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)

Return the internal order book.

- **Return type:** [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)

#### get_open_ask_orders(self) → list

Return the open ask orders at the exchange.

- **Return type:** list[[Order](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)]

#### get_open_bid_orders(self) → list

Return the open bid orders in the matching engine.

- **Return type:** list[[Order](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)]

#### get_open_orders(self) → list

Return the open orders in the matching engine.

- **Return type:** list[[Order](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)]

#### instrument

The instrument for the matching engine.

- **Returns:** Instrument

#### iterate(self, uint64_t timestamp_ns, AggressorSide aggressor_side=AggressorSide.NO_AGGRESSOR) → void

Iterate the matching engine by processing the bid and ask order sides and advancing time up to the given UNIX timestamp_ns.

- **Parameters:**
  - **timestamp_ns** (​*uint64_t*​) – UNIX timestamp to advance the matching engine time to.
  - **aggressor_side** (_AggressorSide_ _,_ ​*default 'NO_AGGRESSOR'*​) – The aggressor side for trade execution processing.

#### market_status

The market status for the matching engine.

- **Returns:** MarketStatus

#### msgbus

The message bus for the matching engine.

- **Returns:** MessageBus

#### oms_type

The order management system type for the matching engine.

- **Returns:** OmsType

#### order_exists(self, ClientOrderId client_order_id) → bool

#### process_auction_book(self, OrderBook book) → void

#### process_bar(self, Bar bar) → void

Process the exchanges market for the given bar.

Market dynamics are simulated by auctioning open orders.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar to process.
- **Raises:**
  - **RuntimeError** – If a price precision does not match the instrument for the matching engine.
  - **RuntimeError** – If a size precision does not match the instrument for the matching engine.

#### process_batch_cancel(self, BatchCancelOrders command, AccountId account_id) → void

#### process_cancel(self, CancelOrder command, AccountId account_id) → void

#### process_cancel_all(self, CancelAllOrders command, AccountId account_id) → void

#### process_instrument_close(self, InstrumentClose close) → void

Process the instrument close.

- **Parameters:** **close** ([_InstrumentClose_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentClose)) – The close price to process.

#### process_modify(self, ModifyOrder command, AccountId account_id) → void

#### process_order(self, Order order, AccountId account_id) → void

#### process_order_book_delta(self, OrderBookDelta delta) → void

Process the exchanges market for the given order book delta.

- **Parameters:** **delta** ([_OrderBookDelta_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDelta)) – The order book delta to process.

#### process_order_book_deltas(self, OrderBookDeltas deltas) → void

Process the exchanges market for the given order book deltas.

- **Parameters:** **delta** ([_OrderBookDeltas_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDeltas)) – The order book deltas to process.

#### process_order_book_depth10(self, OrderBookDepth10 depth) → void

Process the exchanges market for the given order book depth.

- **Parameters:** **depth** ([_OrderBookDepth10_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDepth10)) – The order book depth to process.

#### process_quote_tick(self, QuoteTick tick) → void

Process the exchanges market for the given quote tick.

The internal order book will only be updated if the venue book_type is ‘L1_MBP’.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick to process.
- **Raises:**
  - **RuntimeError** – If a price precision does not match the instrument for the matching engine.
  - **RuntimeError** – If a size precision does not match the instrument for the matching engine.

#### process_status(self, MarketStatusAction status) → void

Process the exchange status.

- **Parameters:** **status** (​*MarketStatusAction*​) – The status action to process.

#### process_trade_tick(self, TradeTick tick) → void

Process the exchanges market for the given trade tick.

The internal order book will only be updated if the venue book_type is ‘L1_MBP’.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick to process.
- **Raises:**
  - **RuntimeError** – If the trades price precision does not match the instrument for the matching engine.
  - **RuntimeError** – If the trades size precision does not match the instrument for the matching engine.

#### raw_id

The instruments raw integer ID for the exchange.

- **Returns:** int

#### reset(self) → void

#### set_fill_model(self, FillModel fill_model) → void

Set the fill model to the given model.

- **Parameters:** **fill_model** ([_FillModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)) – The fill model to set.

#### trigger_stop_order(self, Order order) → void

#### update_instrument(self, Instrument instrument) → void

Update the matching engines current instrument definition with the given instrument.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument definition to update.

#### update_order(self, Order order, Quantity qty, Price price=None, Price trigger_price=None, bool update_contingencies=True) → void

#### venue

The venue for the matching engine.

- **Returns:** Venue

### _class_ SimulatedExchange

Bases: `object`

SimulatedExchange(Venue venue, OmsType oms_type, AccountType account_type, list starting_balances, Currency base_currency: Currency | None, default_leverage: Decimal, dict leverages: dict[InstrumentId, Decimal], list modules, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, TestClock clock, FillModel fill_model, FeeModel fee_model, LatencyModel latency_model=None, MarginModel margin_model=None, BookType book_type=BookType.L1_MBP, bool frozen_account=False, bool reject_stop_orders=True, bool support_gtd_orders=True, bool support_contingent_orders=True, bool use_position_ids=True, bool use_random_ids=False, bool use_reduce_only=True, bool use_message_queue=True, bool bar_execution=True, bool bar_adaptive_high_low_ordering=False, bool trade_execution=False) -> None

Provides a simulated exchange venue.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue to simulate.
  - **oms_type** (OmsType {`HEDGING`, `NETTING`}) – The order management system type used by the exchange.
  - **account_type** (​*AccountType*​) – The account type for the client.
  - **starting_balances** (_list_ _​[​_[_Money_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money) ​*]*​) – The starting balances for the exchange.
  - **base_currency** ([_Currency_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Currency) _,_ ​*optional*​) – The account base currency for the client. Use `None` for multi-currency accounts.
  - **default_leverage** (​*Decimal*​) – The account default leverage (for margin accounts).
  - **leverages** (_dict_ _​[​_[_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId) _,_ _Decimal_ ​*]*​) – The instrument specific leverage configuration (for margin accounts).
  - **modules** (_list_ _​[​_[_SimulationModule_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.modules.SimulationModule) ​*]*​) – The simulation modules for the exchange.
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the exchange.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the exchange.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the exchange.
  - **clock** ([_TestClock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.TestClock)) – The clock for the exchange.
  - **fill_model** ([_FillModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)) – The fill model for the exchange.
  - **fee_model** ([_FeeModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel)) – The fee model for the exchange.
  - **latency_model** ([_LatencyModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.LatencyModel) _,_ ​*optional*​) – The latency model for the exchange.
  - **book_type** (​*BookType*​) – The order book type for the exchange.
  - **frozen_account** (_bool_ _,_ ​*default False*​) – If the account for this exchange is frozen (balances will not change).
  - **reject_stop_orders** (_bool_ _,_ ​*default True*​) – If stop orders are rejected on submission if in the market.
  - **support_gtd_orders** (_bool_ _,_ ​*default True*​) – If orders with GTD time in force will be supported by the exchange.
  - **support_contingent_orders** (_bool_ _,_ ​*default True*​) – If contingent orders will be supported/respected by the exchange. If False, then its expected the strategy will be managing any contingent orders.
  - **use_position_ids** (_bool_ _,_ ​*default True*​) – If venue position IDs will be generated on order fills.
  - **use_random_ids** (_bool_ _,_ ​*default False*​) – If all exchange generated identifiers will be random UUID4’s.
  - **use_reduce_only** (_bool_ _,_ ​*default True*​) – If the reduce_only execution instruction on orders will be honored.
  - **use_message_queue** (_bool_ _,_ ​*default True*​) – If an internal message queue should be used to process trading commands in sequence after they have initially arrived. Setting this to False would be appropriate for real-time sandbox environments, where we don’t want to introduce additional latency of waiting for the next data event before processing the trading command.
  - **bar_execution** (_bool_ _,_ ​*default True*​) – If bars should be processed by the matching engine(s) (and move the market).
  - **bar_adaptive_high_low_ordering** (_bool_ _,_ ​*default False*​) – Determines whether the processing order of bar prices is adaptive based on a heuristic. This setting is only relevant when bar_execution is True. If False, bar prices are always processed in the fixed order: Open, High, Low, Close. If True, the processing order adapts with the heuristic:
    - If High is closer to Open than Low then the processing order is Open, High, Low, Close.
    - If Low is closer to Open than High then the processing order is Open, Low, High, Close.
  - **trade_execution** (_bool_ _,_ ​*default False*​) – If trades should be processed by the matching engine(s) (and move the market).
- **Raises:**
  - **ValueError** – If instruments is empty.
  - **ValueError** – If instruments contains a type other than Instrument.
  - **ValueError** – If starting_balances is empty.
  - **ValueError** – If starting_balances contains a type other than Money.
  - **ValueError** – If base_currency and multiple starting balances.
  - **ValueError** – If modules contains a type other than SimulationModule.

#### account_type

The account base currency.

- **Returns:** AccountType

#### add_instrument(self, Instrument instrument) → void

Add the given instrument to the exchange.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument to add.
- **Raises:**
  - **ValueError** – If instrument.id.venue is not equal to the venue ID.
  - [**InvalidConfiguration**](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.InvalidConfiguration) – If instrument is invalid for this venue.

#### adjust_account(self, Money adjustment) → void

Adjust the account at the exchange with the given adjustment.

- **Parameters:** **adjustment** ([_Money_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)) – The adjustment for the account.

#### bar_adaptive_high_low_ordering

If the processing order of bar prices is adaptive based on a heuristic.

- **Returns:** bool

#### bar_execution

If bars should be processed by the matching engine(s) (and move the market).

- **Returns:** bool

#### base_currency

The account base currency (None for multi-currency accounts).

- **Returns:** Currency or `None`

#### best_ask_price(self, InstrumentId instrument_id) → [Price](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)

Return the best ask price for the given instrument ID (if found).

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the price.
- **Return type:** Price or `None`

#### best_bid_price(self, InstrumentId instrument_id) → [Price](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)

Return the best bid price for the given instrument ID (if found).

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the price.
- **Return type:** Price or `None`

#### book_type

The exchange default order book type.

- **Returns:** BookType

#### cache

The cache wired to the exchange.

- **Returns:** CacheFacade

#### default_leverage

The accounts default leverage.

- **Returns:** Decimal

#### exec_client

The execution client wired to the exchange.

- **Returns:** BacktestExecClient

#### fee_model

The fee model for the exchange.

- **Returns:** FeeModel

#### fill_model

The fill model for the exchange.

- **Returns:** FillModel

#### get_account(self) → Account

Return the account for the registered client (if registered).

- **Return type:** Account or `None`

#### get_book(self, InstrumentId instrument_id) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)

Return the order book for the given instrument ID.

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the price.
- **Return type:** OrderBook or `None`

#### get_books(self) → dict

Return all order books within the exchange.

- **Return type:** dict[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId), [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)]

#### get_matching_engine(self, InstrumentId instrument_id) → [OrderMatchingEngine](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.OrderMatchingEngine)

Return the matching engine for the given instrument ID (if found).

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the matching engine.
- **Return type:** OrderMatchingEngine or `None`

#### get_matching_engines(self) → dict

Return all matching engines for the exchange (for every instrument).

- **Return type:** dict[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId), [OrderMatchingEngine](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.OrderMatchingEngine)]

#### get_open_ask_orders(self, InstrumentId instrument_id=None) → list

Return the open ask orders at the exchange.

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId) _,_ ​*optional*​) – The instrument_id query filter.
- **Return type:** list[[Order](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)]

#### get_open_bid_orders(self, InstrumentId instrument_id=None) → list

Return the open bid orders at the exchange.

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId) _,_ ​*optional*​) – The instrument_id query filter.
- **Return type:** list[[Order](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)]

#### get_open_orders(self, InstrumentId instrument_id=None) → list

Return the open orders at the exchange.

- **Parameters:** **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId) _,_ ​*optional*​) – The instrument_id query filter.
- **Return type:** list[[Order](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)]

#### id

The exchange ID.

- **Returns:** Venue

#### initialize_account(self) → void

Initialize the account to the starting balances.

#### instruments

The exchange instruments.

- **Returns:** dict[InstrumentId, Instrument]

#### is_frozen_account

If the account for the exchange is frozen.

- **Returns:** bool

#### latency_model

The latency model for the exchange.

- **Returns:** LatencyModel

#### leverages

The accounts instrument specific leverage configuration.

- **Returns:** dict[InstrumentId, Decimal]

#### margin_model

The margin calculation model for the exchange.

- **Returns:** MarginModel

#### modules

The simulation modules registered with the exchange.

- **Returns:** list[SimulationModule]

#### msgbus

The message bus wired to the exchange.

- **Returns:** MessageBus

#### oms_type

The exchange order management system type.

- **Returns:** OmsType

#### process(self, uint64_t ts_now) → void

Process the exchange to the given time.

All pending commands will be processed along with all simulation modules.

- **Parameters:** **ts_now** (​*uint64_t*​) – The current UNIX timestamp (nanoseconds).

#### process_bar(self, Bar bar) → void

Process the exchanges market for the given bar.

Market dynamics are simulated by auctioning open orders.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar to process.

#### process_instrument_close(self, InstrumentClose close) → void

Process the exchanges market for the given instrument close.

- **Parameters:** **close** ([_InstrumentClose_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentClose)) – The instrument close to process.

#### process_instrument_status(self, InstrumentStatus data) → void

Process a specific instrument status.

- **Parameters:** **data** ([_InstrumentStatus_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentStatus)) – The instrument status update to process.

#### process_order_book_delta(self, OrderBookDelta delta) → void

Process the exchanges market for the given order book delta.

- **Parameters:** **data** ([_OrderBookDelta_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDelta)) – The order book delta to process.

#### process_order_book_deltas(self, OrderBookDeltas deltas) → void

Process the exchanges market for the given order book deltas.

- **Parameters:** **data** ([_OrderBookDeltas_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDeltas)) – The order book deltas to process.

#### process_order_book_depth10(self, OrderBookDepth10 depth) → void

Process the exchanges market for the given order book depth.

- **Parameters:** **depth** ([_OrderBookDepth10_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDepth10)) – The order book depth to process.

#### process_quote_tick(self, QuoteTick tick) → void

Process the exchanges market for the given quote tick.

Market dynamics are simulated by auctioning open orders.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick to process.

#### process_trade_tick(self, TradeTick tick) → void

Process the exchanges market for the given trade tick.

Market dynamics are simulated by auctioning open orders.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick to process.

#### register_client(self, BacktestExecClient client) → void

Register the given execution client with the simulated exchange.

- **Parameters:** **client** ([_BacktestExecClient_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.execution_client.BacktestExecClient)) – The client to register

#### reject_stop_orders

If stop orders are rejected on submission if in the market.

- **Returns:** bool

#### reset(self) → void

Reset the simulated exchange.

All stateful fields are reset to their initial value.

#### send(self, TradingCommand command) → void

Send the given trading command into the exchange.

- **Parameters:** **command** ([_TradingCommand_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.messages.TradingCommand)) – The command to send.

#### set_fill_model(self, FillModel fill_model) → void

Set the fill model for all matching engines.

- **Parameters:** **fill_model** ([_FillModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)) – The fill model to set.

#### set_latency_model(self, LatencyModel latency_model) → void

Change the latency model for this exchange.

- **Parameters:** **latency_model** ([_LatencyModel_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.LatencyModel)) – The latency model to set.

#### starting_balances

The account starting balances for each backtest run.

- **Returns:** bool

#### support_contingent_orders

If contingent orders will be supported/respected by the venue.

- **Returns:** bool

#### support_gtd_orders

If orders with GTD time in force will be supported by the venue.

- **Returns:** bool

#### trade_execution

If trades should be processed by the matching engine(s) (and move the market).

- **Returns:** bool

#### update_instrument(self, Instrument instrument) → void

Update the venues current instrument definition with the given instrument.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument definition to update.

#### use_message_queue

If an internal message queue is being used to sequentially process incoming trading commands.

- **Returns:** bool

#### use_position_ids

If venue position IDs will be generated on order fills.

- **Returns:** bool

#### use_random_ids

If venue order and position IDs will be randomly generated UUID4s.

- **Returns:** bool

#### use_reduce_only

If the reduce_only option on orders will be honored.

- **Returns:** bool

### _class_ BacktestExecClient

Bases: [`ExecutionClient`](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.client.ExecutionClient)

BacktestExecClient(SimulatedExchange exchange, MessageBus msgbus, Cache cache, TestClock clock, bool routing=False, bool frozen_account=False, bool allow_cash_borrowing=False) -> None

Provides an execution client for the BacktestEngine.

- **Parameters:**
  - **exchange** ([_SimulatedExchange_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.SimulatedExchange)) – The simulated exchange for the backtest.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the client.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the client.
  - **clock** ([_TestClock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.TestClock)) – The clock for the client.
  - **routing** (​*bool*​) – If multi-venue routing is enabled for the client.
  - **frozen_account** (​*bool*​) – If the backtest run account is frozen.
  - **allow_cash_borrowing** (​*bool*​) – If cash accounts should allow borrowing (negative balances).

#### account_id

The clients account ID.

- **Returns:** AccountId or `None`

#### account_type

The clients account type.

- **Returns:** AccountType

#### base_currency

The clients account base currency (None for multi-currency accounts).

- **Returns:** Currency or `None`

#### batch_cancel_orders(self, BatchCancelOrders command) → void

#### cancel_all_orders(self, CancelAllOrders command) → void

#### cancel_order(self, CancelOrder command) → void

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

#### generate_account_state(self, list balances, list margins, bool reported, uint64_t ts_event, dict info=None) → void

Generate an AccountState event and publish on the message bus.

- **Parameters:**
  - **balances** (_list_ _​[​_[_AccountBalance_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.AccountBalance) ​*]*​) – The account balances.
  - **margins** (_list_ _​[​_[_MarginBalance_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.MarginBalance) ​*]*​) – The margin balances.
  - **reported** (​*bool*​) – If the balances are reported directly from the exchange.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the account state event occurred.
  - **info** (_dict_ \*[\*_str_ _,_ _object_ ​*]\*​) – The additional implementation specific account information.

#### generate_order_accepted(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, uint64_t ts_event) → void

Generate an OrderAccepted event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order accepted event occurred.

#### generate_order_cancel_rejected(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, str reason, uint64_t ts_event) → void

Generate an OrderCancelRejected event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **reason** (​*str*​) – The order cancel rejected reason.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order cancel rejected event occurred.

#### generate_order_canceled(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, uint64_t ts_event) → void

Generate an OrderCanceled event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when order canceled event occurred.

#### generate_order_expired(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, uint64_t ts_event) → void

Generate an OrderExpired event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order expired event occurred.

#### generate_order_filled(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, PositionId venue_position_id: PositionId | None, TradeId trade_id, OrderSide order_side, OrderType order_type, Quantity last_qty, Price last_px, Currency quote_currency, Money commission, LiquiditySide liquidity_side, uint64_t ts_event, dict info=None) → void

Generate an OrderFilled event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **trade_id** ([_TradeId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.TradeId)) – The trade ID.
  - **venue_position_id** (PositionId or `None`) – The venue position ID associated with the order. If the trading venue has assigned a position ID / ticket then pass that here, otherwise pass `None` and the execution engine OMS will handle position ID resolution.
  - **order_side** (OrderSide {`BUY`, `SELL`}) – The execution order side.
  - **order_type** (​*OrderType*​) – The execution order type.
  - **last_qty** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)) – The fill quantity for this execution.
  - **last_px** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The fill price for this execution (not average price).
  - **quote_currency** ([_Currency_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Currency)) – The currency of the price.
  - **commission** ([_Money_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)) – The fill commission.
  - **liquidity_side** (LiquiditySide {`NO_LIQUIDITY_SIDE`, `MAKER`, `TAKER`}) – The execution liquidity side.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order filled event occurred.
  - **info** (_dict_ \*[\*_str_ _,_ _object_ *]\* _,_ ​*optional*​) – The additional fill information.

#### generate_order_modify_rejected(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, str reason, uint64_t ts_event) → void

Generate an OrderModifyRejected event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **reason** (​*str*​) – The order update rejected reason.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order update rejection event occurred.

#### generate_order_rejected(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, str reason, uint64_t ts_event, bool due_post_only=False) → void

Generate an OrderRejected event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **reason** (​*datetime*​) – The order rejected reason.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order rejected event occurred.
  - **due_post_only** (_bool_ _,_ ​*default False*​) – If the order was rejected because it was post-only and would execute immediately as a taker.

#### generate_order_submitted(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, uint64_t ts_event) → void

Generate an OrderSubmitted event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order submitted event occurred.

#### generate_order_triggered(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, uint64_t ts_event) → void

Generate an OrderTriggered event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order triggered event occurred.

#### generate_order_updated(self, StrategyId strategy_id, InstrumentId instrument_id, ClientOrderId client_order_id, VenueOrderId venue_order_id, Quantity quantity, Price price, Price trigger_price, uint64_t ts_event, bool venue_order_id_modified=False) → void

Generate an OrderUpdated event and send it to the ExecutionEngine.

- **Parameters:**
  - **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID associated with the event.
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID.
  - **client_order_id** ([_ClientOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientOrderId)) – The client order ID.
  - **venue_order_id** ([_VenueOrderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.VenueOrderId)) – The venue order ID (assigned by the venue).
  - **quantity** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)) – The orders current quantity.
  - **price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The orders current price.
  - **trigger_price** (Price or `None`) – The orders current trigger price.
  - **ts_event** (​*uint64_t*​) – UNIX timestamp (nanoseconds) when the order update event occurred.
  - **venue_order_id_modified** (​*bool*​) – If the ID was modified for this event.

#### get_account(self) → Account

Return the account for the client (if registered).

- **Return type:** Account or `None`

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

#### modify_order(self, ModifyOrder command) → void

#### oms_type

The venues order management system type.

- **Returns:** OmsType

#### query_account(self, QueryAccount command) → void

Query the account specified by the command which will generate an AccountState event.

- **Parameters:** **command** ([_QueryAccount_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.messages.QueryAccount)) – The command to execute.

#### query_order(self, QueryOrder command) → void

Initiate a reconciliation for the queried order which will generate an OrderStatusReport.

- **Parameters:** **command** ([_QueryOrder_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.messages.QueryOrder)) – The command to execute.

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

#### submit_order(self, SubmitOrder command) → void

#### submit_order_list(self, SubmitOrderList command) → void

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

#### venue

The clients venue ID (if not a routing client).

- **Returns:** Venue or `None`

### _class_ BestPriceFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that executes all orders at the best available price.

This model simulates optimistic market conditions where every order gets filled immediately at the best available price. Ideal for testing basic strategy logic.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with unlimited liquidity at best prices.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ CompetitionAwareFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that simulates market competition effects.

Makes only a percentage of visible liquidity actually available, reflecting realistic conditions where multiple traders compete for the same liquidity.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with competition-adjusted liquidity.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ FeeModel

Bases: `object`

Provides an abstract fee model for trades.

#### get_commission(self, Order order, Quantity fill_qty, Price fill_px, Instrument instrument) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Return the commission for a trade.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to calculate the commission for.
  - **fill_qty** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)) – The fill quantity of the order.
  - **fill_px** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The fill price of the order.
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the order.
- **Return type:** [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

### _class_ FillModel

Bases: `object`

FillModel(double prob_fill_on_limit=1.0, double prob_fill_on_stop=1.0, double prob_slippage=0.0, int random_seed: int | None = None, config=None) -> None

Provides probabilistic modeling for order fill dynamics including probability of fills and slippage by order type.

- **Parameters:**
  - **prob_fill_on_limit** (​*double*​) – The probability of limit order filling if the market rests on its price.
  - **prob_fill_on_stop** (​*double*​) – The probability of stop orders filling if the market rests on its price.
  - **prob_slippage** (​*double*​) – The probability of order fill prices slipping by one tick.
  - **random_seed** (_int_ _,_ ​*optional*​) – The random seed (if None then no random seed).
  - **config** ([_FillModelConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.FillModelConfig) _,_ ​*optional*​) – The configuration for the model.
- **Raises:**
  - **ValueError** – If any probability argument is not within range [0, 1].
  - **TypeError** – If random_seed is not None and not of type int.

#### get_orderbook_for_fill_simulation(self, Instrument instrument, Order order, Price best_bid, Price best_ask) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)

Return a simulated OrderBook for fill simulation.

This method allows custom fill models to provide their own liquidity simulation by returning a custom OrderBook that represents the expected market liquidity. The matching engine will use this simulated OrderBook to determine fills.

The default implementation returns None, which means the matching engine will use its standard fill logic (maintaining backward compatibility).

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument being traded.
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to simulate fills for.
  - **best_bid** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The current best bid price.
  - **best_ask** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The current best ask price.
- **Returns:** The simulated OrderBook for fill simulation, or None to use default logic.
- **Return type:** [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) or None

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ FixedFeeModel

Bases: [`FeeModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel)

FixedFeeModel(Money commission=None, bool charge_commission_once: bool = True, config=None) -> None

Provides a fixed fee model for trades.

- **Parameters:**
  - **commission** ([_Money_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money) _,_ ​*optional*​) – The fixed commission amount for trades.
  - **charge_commission_once** (_bool_ _,_ ​*default True*​) – Whether to charge the commission once per order or per fill.
  - **config** ([_FixedFeeModelConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.FixedFeeModelConfig) _,_ ​*optional*​) – The configuration for the model.
- **Raises:**
  - **ValueError** – If both `commission` **and** `config` are provided, **or** if both are `None` (exactly one must be supplied).
  - **ValueError** – If commission is not a positive amount.

#### get_commission(self, Order order, Quantity fill_qty, Price fill_px, Instrument instrument) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

### _class_ LatencyModel

Bases: `object`

LatencyModel(uint64_t base_latency_nanos=NANOSECONDS_IN_MILLISECOND, uint64_t insert_latency_nanos=0, uint64_t update_latency_nanos=0, uint64_t cancel_latency_nanos=0, config=None) -> None

Provides a latency model for simulated exchange message I/O.

- **Parameters:**
  - **base_latency_nanos** (_int_ _,_ ​*default 1_000_000_000*​) – The base latency (nanoseconds) for the model.
  - **insert_latency_nanos** (_int_ _,_ ​*default 0*​) – The order insert latency (nanoseconds) for the model.
  - **update_latency_nanos** (_int_ _,_ ​*default 0*​) – The order update latency (nanoseconds) for the model.
  - **cancel_latency_nanos** (_int_ _,_ ​*default 0*​) – The order cancel latency (nanoseconds) for the model.
  - **config** ([_FillModelConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.FillModelConfig) _,_ ​*optional*​) – The configuration for the model.
- **Raises:**
  - **ValueError** – If base_latency_nanos is negative (< 0).
  - **ValueError** – If insert_latency_nanos is negative (< 0).
  - **ValueError** – If update_latency_nanos is negative (< 0).
  - **ValueError** – If cancel_latency_nanos is negative (< 0).

#### base_latency_nanos

The default latency to the exchange.

- **Returns:** int

#### cancel_latency_nanos

The latency (nanoseconds) for order cancel messages to reach the exchange.

- **Returns:** int

#### insert_latency_nanos

The latency (nanoseconds) for order insert messages to reach the exchange.

- **Returns:** int

#### update_latency_nanos

The latency (nanoseconds) for order update messages to reach the exchange.

- **Returns:** int

### _class_ LeveragedMarginModel

Bases: [`MarginModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.MarginModel)

Leveraged margin model that divides margin requirements by leverage.

This model represents the current Nautilus behavior and may be appropriate for certain crypto exchanges or specific trading scenarios where leverage directly reduces margin requirements.

Formula:

- Initial Margin = (notional_value / leverage) \* instrument.margin_init
- Maintenance Margin = (notional_value / leverage) \* instrument.margin_maint

#### calculate_margin_init(self, Instrument instrument, Quantity quantity, Price price, leverage: Decimal, bool use_quote_for_inverse=False) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Calculate initial margin with leverage division.

#### calculate_margin_maint(self, Instrument instrument, PositionSide side, Quantity quantity, Price price, leverage: Decimal, bool use_quote_for_inverse=False) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Calculate maintenance margin with leverage division.

### _class_ LimitOrderPartialFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that simulates partial fills for limit orders.

When price touches the limit level, only fills maximum 5 contracts of the order quantity, modeling typical limit order queue behavior.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with limited fills at limit prices.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ MakerTakerFeeModel

Bases: [`FeeModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel)

MakerTakerFeeModel(config=None) -> None

Provide a fee model for trades based on a maker/taker fee schedule and notional value of the trade.

- **Parameters:** **config** ([_MakerTakerFeeModelConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.MakerTakerFeeModelConfig) _,_ ​*optional*​) – The configuration for the fee model.

#### get_commission(self, Order order, Quantity fill_qty, Price fill_px, Instrument instrument) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

### _class_ MarginModel

Bases: `object`

Abstract base class for margin calculation models.

Different venues and instrument types may have varying approaches to calculating margin requirements. This abstraction allows for flexible margin calculation strategies.

#### calculate_margin_init(self, Instrument instrument, Quantity quantity, Price price, leverage: Decimal, bool use_quote_for_inverse=False) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Calculate the initial (order) margin requirement.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the calculation.
  - **quantity** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)) – The order quantity.
  - **price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The order price.
  - **leverage** (​*Decimal*​) – The account leverage for this instrument.
  - **use_quote_for_inverse** (_bool_ _,_ ​*default False*​) – If inverse instrument calculations use quote currency (instead of base).
- **Returns:** The initial margin requirement.
- **Return type:** [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

#### calculate_margin_maint(self, Instrument instrument, PositionSide side, Quantity quantity, Price price, leverage: Decimal, bool use_quote_for_inverse=False) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Calculate the maintenance (position) margin requirement.

- **Parameters:**
  - **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument for the calculation.
  - **side** (​*PositionSide*​) – The position side.
  - **quantity** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity)) – The position quantity.
  - **price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price)) – The current price.
  - **leverage** (​*Decimal*​) – The account leverage for this instrument.
  - **use_quote_for_inverse** (_bool_ _,_ ​*default False*​) – If inverse instrument calculations use quote currency (instead of base).
- **Returns:** The maintenance margin requirement.
- **Return type:** [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

### _class_ MarketHoursFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that simulates varying market conditions based on time.

Implements wider spreads during low liquidity periods (e.g., outside market hours). Essential for strategies that trade across different market sessions.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with time-dependent liquidity.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_low_liquidity_period(self) → bool

Check if current time is during low liquidity period.

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

#### set_low_liquidity_period(self, is_low_liquidity: bool)

Set the liquidity period for testing purposes.

### _class_ OneTickSlippageFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that forces exactly one tick of slippage for all orders.

This model demonstrates how to create deterministic slippage by setting zero volume at best prices and unlimited volume one tick away.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with no volume at best prices, unlimited volume one tick away.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ PerContractFeeModel

Bases: [`FeeModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel)

PerContractFeeModel(Money commission=None, config=None) -> None

Provides a fee model which charges a commission per contract traded.

- **Parameters:**
  - **commission** ([_Money_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money) _,_ ​*optional*​) – The commission amount per contract.
  - **config** ([_PerContractFeeModelConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.PerContractFeeModelConfig) _,_ ​*optional*​) – The configuration for the model.
- **Raises:**
  - **ValueError** – If both `commission` **and** `config` are provided, **or** if both are `None` (exactly one must be supplied).
  - **ValueError** – If commission is negative (< 0).

#### get_commission(self, Order order, Quantity fill_qty, Price fill_px, Instrument instrument) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

### _class_ ProbabilisticFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that replicates the current probabilistic behavior.

This model demonstrates how to implement the existing FillModel’s probabilistic behavior using the new simulation approach: 50% chance of best price fill, 50% chance of one tick slippage.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook based on probabilistic logic.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ SizeAwareFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that applies different execution models based on order size.

Small orders (\<\=10) get good liquidity at best prices. Large orders experience price impact with partial fills at worse prices.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with size-dependent liquidity.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ SpreadQuoteAggregator

Bases: [`Component`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Component)

SpreadQuoteAggregator(InstrumentId spread_instrument_id, handler: Callable[[QuoteTick], None], MessageBus msgbus, CacheFacade cache, Clock clock, int update_interval_seconds=60)

Provides a spread quote generator for creating synthetic quotes from component instruments.

The generator subscribes to quotes from component instruments of a spread and generates averaged quotes for the spread instrument.

- **Parameters:**
  - **spread_instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The spread instrument ID to generate quotes for.
  - **handler** (_Callable_ _[_ _​[​_[_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick) _]_ _,_ _None_ ​*]*​) – The quote handler for the generator.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The cache facade for accessing market data.

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

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

### _class_ StandardMarginModel

Bases: [`MarginModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.MarginModel)

Standard margin model that uses fixed percentages without leverage division.

This model matches traditional broker behavior (e.g., Interactive Brokers) where margin requirements are fixed percentages of notional value regardless of account leverage. Leverage affects buying power but not margin requirements.

Formula:

- Initial Margin = notional_value \* instrument.margin_init
- Maintenance Margin = notional_value \* instrument.margin_maint

#### calculate_margin_init(self, Instrument instrument, Quantity quantity, Price price, leverage: Decimal, bool use_quote_for_inverse=False) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Calculate initial margin using fixed percentage of notional value.

#### calculate_margin_maint(self, Instrument instrument, PositionSide side, Quantity quantity, Price price, leverage: Decimal, bool use_quote_for_inverse=False) → [Money](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Money)

Calculate maintenance margin using fixed percentage of notional value.

### _class_ ThreeTierFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model with three-tier pricing for realistic market depth simulation.

Distributes 100-contract order fills across three price levels:

- 50 contracts at best price
- 30 contracts 1 tick worse
- 20 contracts 2 ticks worse

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with three-tier liquidity structure.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ TwoTierFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model with two-tier pricing: first 10 contracts at best price, remainder one tick worse.

This model simulates basic market depth behavior and provides realistic simulation of basic market impact for small to medium orders.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with two-tier liquidity structure.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

### _class_ VolumeSensitiveFillModel

Bases: [`FillModel`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel)

Fill model that adjusts liquidity based on recent trading volume.

Creates realistic market depth based on actual market activity by using recent bar volume data to determine available liquidity.

#### get_orderbook_for_fill_simulation(self, Instrument instrument: Instrument, Order order: Order, Price best_bid: Price, Price best_ask: Price) → [OrderBook](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook) | None

Return OrderBook with volume-based liquidity.

#### is_limit_filled(self) → bool

Return a value indicating whether a `LIMIT` order filled.

- **Return type:** bool

#### is_slipped(self) → bool

Return a value indicating whether an order fill slipped.

- **Return type:** bool

#### is_stop_filled(self) → bool

Return a value indicating whether a `STOP-MARKET` order filled.

- **Return type:** bool

#### prob_fill_on_limit

The probability of limit orders filling on the limit price.

- **Returns:** bool

#### prob_fill_on_stop

The probability of stop orders filling on the stop price.

- **Returns:** bool

#### prob_slippage

The probability of aggressive order execution slipping.

- **Returns:** bool

#### set_recent_volume(self, double volume: float)

Set recent volume for testing purposes.

### _class_ FXRolloverInterestModule

Bases: [`SimulationModule`](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.modules.SimulationModule)

FXRolloverInterestModule(config: FXRolloverInterestConfig)

Provides an FX rollover interest simulation module.

- **Parameters:** **config** ([_FXRolloverInterestConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.FXRolloverInterestConfig))

#### active_task_ids(self) → list

Return the active task identifiers.

- **Return type:** list[[TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)]

#### add_synthetic(self, SyntheticInstrument synthetic) → void

Add the created synthetic instrument to the cache.

- **Parameters:** **synthetic** ([_SyntheticInstrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.SyntheticInstrument)) – The synthetic instrument to add to the cache.
- **Raises:** **KeyError** – If synthetic is already in the cache.

#### cache

The read-only cache for the actor.

- **Returns:** CacheFacade

#### cancel_all_tasks(self) → void

Cancel all queued and active tasks.

#### cancel_task(self, task_id: [TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)) → void

Cancel the task with the given task_id (if queued or active).

If the task is not found then a warning is logged.

- **Parameters:** **task_id** ([_TaskId_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)) – The task identifier.

#### clock

The actors clock.

- **Returns:** Clock

#### config

The actors configuration.

- **Returns:** NautilusConfig

#### degrade(self) → void

Degrade the component.

While executing on_degrade() any exception will be logged and reraised, then the component will remain in a `DEGRADING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### deregister_warning_event(self, type event) → void

Deregister the given event type from warning log levels.

- **Parameters:** **event** (​*type*​) – The event class to deregister.

#### dispose(self) → void

Dispose of the component.

While executing on_dispose() any exception will be logged and reraised, then the component will remain in a `DISPOSING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### exchange

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

#### greeks

The read-only greeks calculator for the actor.

- **Returns:** GreeksCalculator

#### handle_bar(self, Bar bar) → void

Handle the given bar data.

If state is `RUNNING` then passes to on_bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar received.

#### WARNING

System method (not intended to be called by user code).

#### handle_bars(self, list bars) → void

Handle the given historical bar data by handling each bar individually.

- **Parameters:** **bars** (_list_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) ​*]*​) – The bars to handle.

#### WARNING

System method (not intended to be called by user code).

- **Raises:** **RuntimeError** – If bar data has incorrectly sorted timestamps (not monotonically increasing).

#### handle_data(self, Data data) → void

Handle the given data.

If state is `RUNNING` then passes to on_data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data received.

#### WARNING

System method (not intended to be called by user code).

#### handle_event(self, Event event) → void

Handle the given event.

If state is `RUNNING` then passes to on_event.

- **Parameters:** **event** ([_Event_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Event)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### handle_funding_rate(self, FundingRateUpdate funding_rate) → void

Handle the given funding rate update.

If state is `RUNNING` then passes to on_funding_rate.

- **Parameters:** **funding_rate** ([_FundingRateUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.FundingRateUpdate)) – The funding rate update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_historical_data(self, data) → void

Handle the given historical data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The historical data received.

#### WARNING

System method (not intended to be called by user code).

#### handle_index_price(self, IndexPriceUpdate index_price) → void

Handle the given index price update.

If state is `RUNNING` then passes to on_index_price.

- **Parameters:** **index_price** ([_IndexPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.IndexPriceUpdate)) – The index price update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instrument(self, Instrument instrument) → void

Handle the given instrument.

Passes to on_instrument if state is `RUNNING`.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instrument_close(self, InstrumentClose update) → void

Handle the given instrument close update.

If state is `RUNNING` then passes to on_instrument_close.

- **Parameters:** **update** ([_InstrumentClose_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentClose)) – The update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instrument_status(self, InstrumentStatus data) → void

Handle the given instrument status update.

If state is `RUNNING` then passes to on_instrument_status.

- **Parameters:** **data** ([_InstrumentStatus_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentStatus)) – The status update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instruments(self, list instruments) → void

Handle the given instruments data by handling each instrument individually.

- **Parameters:** **instruments** (_list_ _​[​_[_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument) ​*]*​) – The instruments received.

#### WARNING

System method (not intended to be called by user code).

#### handle_mark_price(self, MarkPriceUpdate mark_price) → void

Handle the given mark price update.

If state is `RUNNING` then passes to on_mark_price.

- **Parameters:** **mark_price** ([_MarkPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.MarkPriceUpdate)) – The mark price update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_order_book(self, OrderBook order_book) → void

Handle the given order book.

Passes to on_order_book if state is `RUNNING`.

- **Parameters:** **order_book** ([_OrderBook_](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)) – The order book received.

#### WARNING

System method (not intended to be called by user code).

#### handle_order_book_deltas(self, deltas) → void

Handle the given order book deltas.

Passes to on_order_book_deltas if state is `RUNNING`. The deltas will be nautilus_pyo3.OrderBookDeltas if the pyo3_conversion flag was set for the subscription.

- **Parameters:** **deltas** ([_OrderBookDeltas_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDeltas) _or_ ​*nautilus_pyo3.OrderBookDeltas*​) – The order book deltas received.

#### WARNING

System method (not intended to be called by user code).

#### handle_order_book_depth(self, OrderBookDepth10 depth) → void

Handle the given order book depth

Passes to on_order_book_depth if state is `RUNNING`.

- **Parameters:** **depth** ([_OrderBookDepth10_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDepth10)) – The order book depth received.

#### WARNING

System method (not intended to be called by user code).

#### handle_quote_tick(self, QuoteTick tick) → void

Handle the given quote tick.

If state is `RUNNING` then passes to on_quote_tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### handle_quote_ticks(self, list ticks) → void

Handle the given historical quote tick data by handling each tick individually.

- **Parameters:** **ticks** (_list_ _​[​_[_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick) ​*]*​) – The ticks received.

#### WARNING

System method (not intended to be called by user code).

#### handle_signal(self, Data signal) → void

Handle the given signal.

If state is `RUNNING` then passes to on_signal.

- **Parameters:** **signal** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The signal received.

#### WARNING

System method (not intended to be called by user code).

#### handle_trade_tick(self, TradeTick tick) → void

Handle the given trade tick.

If state is `RUNNING` then passes to on_trade_tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### handle_trade_ticks(self, list ticks) → void

Handle the given historical trade tick data by handling each tick individually.

- **Parameters:** **ticks** (_list_ _​[​_[_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick) ​*]*​) – The ticks received.

#### WARNING

System method (not intended to be called by user code).

#### has_active_tasks(self) → bool

Return a value indicating whether there are any active tasks.

- **Return type:** bool

#### has_any_tasks(self) → bool

Return a value indicating whether there are any queued OR active tasks.

- **Return type:** bool

#### has_pending_requests(self) → bool

Return whether the actor is pending processing for any requests.

- **Returns:** True if any requests are pending, else False.
- **Return type:** bool

#### has_queued_tasks(self) → bool

Return a value indicating whether there are any queued tasks.

- **Return type:** bool

#### id

The components ID.

- **Returns:** ComponentId

#### indicators_initialized(self) → bool

Return a value indicating whether all indicators are initialized.

- **Returns:** True if all initialized, else False
- **Return type:** bool

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

#### is_pending_request(self, UUID4 request_id) → bool

Return whether the request for the given identifier is pending processing.

- **Parameters:** **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID to check.
- **Returns:** True if request is pending, else False.
- **Return type:** bool

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

#### load(self, dict state) → void

Load the actor/strategy state from the give state dictionary.

Calls on_load and passes the state.

- **Parameters:** **state** (_dict_ \*[\*_str_ _,_ _bytes_ ​*]\*​) – The strategy state to load.

#### WARNING

Exceptions raised will be caught, logged, and reraised.

#### log

The actors logger.

- **Returns:** Logger

#### log_diagnostics(self, Logger logger) → void

Log diagnostics out to the BacktestEngine logger.

- **Parameters:** **logger** ([_Logger_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Logger)) – The logger to log to.

#### msgbus

The message bus for the actor (if registered).

- **Returns:** MessageBus or `None`

#### on_bar(self, Bar bar) → void

Actions to be performed when running and receives a bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar received.

#### WARNING

System method (not intended to be called by user code).

#### on_data(self, data) → void

Actions to be performed when running and receives data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data received.

#### WARNING

System method (not intended to be called by user code).

#### on_degrade(self) → void

Actions to be performed on degrade.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in the actor implementation.

#### on_dispose(self) → void

Actions to be performed on dispose.

Cleanup/release any resources used here.

#### WARNING

System method (not intended to be called by user code).

#### on_event(self, Event event) → void

Actions to be performed running and receives an event.

- **Parameters:** **event** ([_Event_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Event)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_fault(self) → void

Actions to be performed on fault.

Cleanup any resources used by the actor here.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in the actor implementation.

#### on_funding_rate(self, FundingRateUpdate funding_rate) → void

Actions to be performed when running and receives a funding rate update.

- **Parameters:** **funding_rate** ([_FundingRateUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.FundingRateUpdate)) – The funding rate update received.

#### WARNING

System method (not intended to be called by user code).

#### on_historical_data(self, data) → void

Actions to be performed when running and receives historical data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The historical data received.

#### WARNING

System method (not intended to be called by user code).

#### on_index_price(self, IndexPriceUpdate index_price) → void

Actions to be performed when running and receives an index price update.

- **Parameters:** **index_price** ([_IndexPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.IndexPriceUpdate)) – The index price update received.

#### WARNING

System method (not intended to be called by user code).

#### on_instrument(self, Instrument instrument) → void

Actions to be performed when running and receives an instrument.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument received.

#### WARNING

System method (not intended to be called by user code).

#### on_instrument_close(self, InstrumentClose update) → void

Actions to be performed when running and receives an instrument close update.

- **Parameters:** **update** ([_InstrumentClose_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentClose)) – The instrument close received.

#### WARNING

System method (not intended to be called by user code).

#### on_instrument_status(self, InstrumentStatus data) → void

Actions to be performed when running and receives an instrument status update.

- **Parameters:** **data** ([_InstrumentStatus_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentStatus)) – The instrument status update received.

#### WARNING

System method (not intended to be called by user code).

#### on_load(self, dict state) → void

Actions to be performed when the actor state is loaded.

Saved state values will be contained in the give state dictionary.

- **Parameters:** **state** (_dict_ \*[\*_str_ _,_ _bytes_ ​*]\*​) – The strategy state to load.

#### WARNING

System method (not intended to be called by user code).

#### on_mark_price(self, MarkPriceUpdate mark_price) → void

Actions to be performed when running and receives a mark price update.

- **Parameters:** **mark_price** ([_MarkPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.MarkPriceUpdate)) – The mark price update received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_book(self, OrderBook order_book) → void

Actions to be performed when running and receives an order book.

- **Parameters:** **order_book** ([_OrderBook_](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)) – The order book received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_book_deltas(self, deltas) → void

Actions to be performed when running and receives order book deltas.

- **Parameters:** **deltas** ([_OrderBookDeltas_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDeltas) _or_ ​*nautilus_pyo3.OrderBookDeltas*​) – The order book deltas received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_book_depth(self, depth) → void

Actions to be performed when running and receives an order book depth.

- **Parameters:** **depth** ([_OrderBookDepth10_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDepth10)) – The order book depth received.

#### WARNING

System method (not intended to be called by user code).

#### on_quote_tick(self, QuoteTick tick) → void

Actions to be performed when running and receives a quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### on_reset(self) → void

Actions to be performed on reset.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in a user implementation.

#### on_resume(self) → void

Actions to be performed on resume.

#### WARNING

System method (not intended to be called by user code).

#### on_save(self) → dict

Actions to be performed when the actor state is saved.

Create and return a state dictionary of values to be saved.

- **Returns:** The strategy state to save.
- **Return type:** dict[str, bytes]

#### WARNING

System method (not intended to be called by user code).

#### on_signal(self, signal) → void

Actions to be performed when running and receives signal data.

- **Parameters:** **signal** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The signal received.

#### WARNING

System method (not intended to be called by user code).

#### on_start(self) → void

Actions to be performed on start.

The intent is that this method is called once per trading ‘run’, when initially starting.

It is recommended to subscribe/request for data here.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in a user implementation.

#### on_stop(self) → void

Actions to be performed on stop.

The intent is that this method is called to pause, or when done for day.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in a user implementation.

#### on_trade_tick(self, TradeTick tick) → void

Actions to be performed when running and receives a trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### pending_requests(self) → set

Return the request IDs which are currently pending processing.

- **Return type:** set[[UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)]

#### portfolio

The read-only portfolio for the actor.

- **Returns:** PortfolioFacade

#### pre_process(self, Data data) → void

Abstract method pre_process (implement in subclass).

#### process(self, uint64_t ts_now) → void

Process the given tick through the module.

- **Parameters:** **ts_now** (​*uint64_t*​) – The current UNIX timestamp (nanoseconds) in the simulated exchange.

#### publish_data(self, DataType data_type, Data data) → void

Publish the given data to the message bus.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type being published.
  - **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data to publish.

#### publish_signal(self, str name, value, uint64_t ts_event=0) → void

Publish the given value as a signal to the message bus.

- **Parameters:**
  - **name** (​*str*​) – The name of the signal being published. The signal name will be converted to title case, with each word capitalized (e.g., ‘example’ becomes ‘SignalExample’).
  - **value** (​*object*​) – The signal data to publish.
  - **ts_event** (_uint64_t_ _,_ ​*optional*​) – UNIX timestamp (nanoseconds) when the signal event occurred. If `None` then will timestamp current time.

#### queue_for_executor(self, func: Callable[..., Any], tuple args=None, dict kwargs=None)

Queues the callable func to be executed as fn(\*args, \*\*kwargs) sequentially.

- **Parameters:**
  - **func** (​*Callable*​) – The function to be executed.
  - **args** (​*positional arguments*​) – The positional arguments for the call to func.
  - **kwargs** (​*arbitrary keyword arguments*​) – The keyword arguments for the call to func.
- **Raises:** **TypeError** – If func is not of type Callable.

#### queued_task_ids(self) → list

Return the queued task identifiers.

- **Return type:** list[[TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)]

#### register_base(self, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, Clock clock) → void

Register with a trader.

- **Parameters:**
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the actor.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the actor.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the actor.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the actor.

#### WARNING

System method (not intended to be called by user code).

#### register_executor(self, loop: asyncio.AbstractEventLoop, executor: Executor) → void

Register the given Executor for the actor.

- **Parameters:**
  - **loop** (​*asyncio.AbstractEventLoop*​) – The event loop of the application.
  - **executor** (​*concurrent.futures.Executor*​) – The executor to register.
- **Raises:** **TypeError** – If executor is not of type concurrent.futures.Executor

#### register_indicator_for_bars(self, BarType bar_type, Indicator indicator) → void

Register the given indicator with the actor/strategy to receive bar data for the given bar type.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for bar updates.
  - **indicator** ([_Indicator_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)) – The indicator to register.

#### register_indicator_for_quote_ticks(self, InstrumentId instrument_id, Indicator indicator) → void

Register the given indicator with the actor/strategy to receive quote tick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for tick updates.
  - **indicator** ([_Indicator_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)) – The indicator to register.

#### register_indicator_for_trade_ticks(self, InstrumentId instrument_id, Indicator indicator) → void

Register the given indicator with the actor/strategy to receive trade tick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for tick updates.
  - **indicator** (​*indicator*​) – The indicator to register.

#### register_venue(self, SimulatedExchange exchange) → void

Register the given simulated exchange with the module.

- **Parameters:** **exchange** ([_SimulatedExchange_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.SimulatedExchange)) – The exchange to register.

#### register_warning_event(self, type event) → void

Register the given event type for warning log levels.

- **Parameters:** **event** (​*type*​) – The event class to register.

#### registered_indicators

Return the registered indicators for the strategy.

- **Return type:** list[[Indicator](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)]

#### request_aggregated_bars(self, list bar_types, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, bool include_external_data=False, bool update_subscriptions=False, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical aggregated Bar data for multiple bar types. The first bar is used to determine which market data type will be queried. This can either be quotes, trades or bars. If bars are queried, the first bar type needs to have a composite bar that is external (i.e. not internal/aggregated). This external bar type will be queried.

If end is `None` then will request up to the most recent data.

Once the response is received, the bar data is forwarded from the message bus to the on_historical_data handler. Any tick data used for aggregation is also forwarded to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **bar_types** (_list_ _​[​_[_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType) ​*]*​) – The list of bar types for the request. Composite bars can also be used and need to figure in the list after a BarType on which it depends.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of data received (quote ticks, trade ticks or bars).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **include_external_data** (_bool_ _,_ ​*default False*​) – If True, includes the queried external data in the response.
  - **update_subscriptions** (_bool_ _,_ ​*default False*​) – If True, updates the aggregators of any existing or future subscription with the queried external data.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **ValueError** – If bar_types is empty.
  - **TypeError** – If callback is not None and not of type Callable.
  - **TypeError** – If bar_types is empty or contains elements not of type BarType.

#### request_bars(self, BarType bar_type, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical Bar data.

If end is `None` then will request up to the most recent data.

Once the response is received, the bar data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of bars received.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_data(self, DataType data_type, ClientId client_id, InstrumentId instrument_id=None, datetime start=None, datetime end=None, int limit=0, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request custom data for the given data type from the given data client.

Once the response is received, the data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type for the request.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)) – The data client ID.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Cannot be None. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of data points received.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_instrument(self, InstrumentId instrument_id, datetime start=None, datetime end=None, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request Instrument data for the given instrument ID.

If end is `None` then will request up to the most recent data.

Once the response is received, the instrument data is forwarded from the message bus to the on_instrument handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **start** (_datetime_ _,_ ​*optional*​) – The start datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **ValueError** – If start is not None and > current timestamp (now).
  - **ValueError** – If end is not None and > current timestamp (now).
  - **ValueError** – If start and end are not None and start is >= end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_instruments(self, Venue venue, datetime start=None, datetime end=None, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request all Instrument data for the given venue.

If end is `None` then will request up to the most recent data.

Once the response is received, the instrument data is forwarded from the message bus to the on_instrument handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue for the request.
  - **start** (_datetime_ _,_ ​*optional*​) – The start datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client:
    - only_last (default True) retains only the latest instrument record per instrument_id, based on the most recent ts_init.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **ValueError** – If start is not None and > current timestamp (now).
  - **ValueError** – If end is not None and > current timestamp (now).
  - **ValueError** – If start and end are not None and start is >= end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_order_book_snapshot(self, InstrumentId instrument_id, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request an order book snapshot.

Once the response is received, the order book data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the order book snapshot request.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the depth of the order book snapshot.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If None, it will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **ValueError** – If the instrument_id is None.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_quote_ticks(self, InstrumentId instrument_id, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical QuoteTick data.

If end is `None` then will request up to the most recent data.

Once the response is received, the quote tick data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of quote ticks received.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_trade_ticks(self, InstrumentId instrument_id, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical TradeTick data.

If end is `None` then will request up to the most recent data.

Once the response is received, the trade tick data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of trade ticks received.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### reset(self) → void

#### resume(self) → void

Resume the component.

While executing on_resume() any exception will be logged and reraised, then the component will remain in a `RESUMING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### run_in_executor(self, func: Callable[..., Any], tuple args=None, dict kwargs=None)

Schedules the callable func to be executed as fn(\*args, \*\*kwargs).

- **Parameters:**
  - **func** (​*Callable*​) – The function to be executed.
  - **args** (​*positional arguments*​) – The positional arguments for the call to func.
  - **kwargs** (​*arbitrary keyword arguments*​) – The keyword arguments for the call to func.
- **Returns:** The unique task identifier for the execution. This also corresponds to any future objects memory address.
- **Return type:** [TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)
- **Raises:** **TypeError** – If func is not of type Callable.

#### save(self) → dict

Return the actor/strategy state dictionary to be saved.

Calls on_save.

- **Returns:** The strategy state to save.
- **Return type:** dict[str, bytes]

#### WARNING

Exceptions raised will be caught, logged, and reraised.

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

#### subscribe_bars(self, BarType bar_type, ClientId client_id=None, bool await_partial=False, bool update_catalog=False, dict params=None) → void

Subscribe to streaming Bar data for the given bar type.

Once subscribed, any matching bar data published on the message bus is forwarded to the on_bar handler.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **await_partial** (_bool_ _,_ ​*default False*​) – If the bar aggregator should await the arrival of a historical partial bar prior to actively aggregating new bars.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_data(self, DataType data_type, ClientId client_id=None, InstrumentId instrument_id=None, bool update_catalog=False, dict params=None) → void

Subscribe to data of the given data type.

Once subscribed, any matching data published on the message bus is forwarded to the on_data handler.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The data client ID. If supplied then a Subscribe command will be sent to the corresponding data client.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_funding_rates(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to streaming FundingRateUpdate data for the given instrument ID.

Once subscribed, any matching funding rate updates published on the message bus are forwarded to the on_funding_rate handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_index_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to streaming IndexPriceUpdate data for the given instrument ID.

Once subscribed, any matching index price updates published on the message bus are forwarded to the on_index_price handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instrument(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to update Instrument data for the given instrument ID.

Once subscribed, any matching instrument data published on the message bus is forwarded to the on_instrument handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instrument_close(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to close updates for the given instrument ID.

Once subscribed, any matching instrument close data published on the message bus is forwarded to the on_instrument_close handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to status updates for.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instrument_status(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to status updates for the given instrument ID.

Once subscribed, any matching instrument status data published on the message bus is forwarded to the on_instrument_status handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to status updates for.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instruments(self, Venue venue, ClientId client_id=None, dict params=None) → void

Subscribe to update Instrument data for the given venue.

Once subscribed, any matching instrument data published on the message bus is forwarded the on_instrument handler.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue for the subscription.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_mark_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to streaming MarkPriceUpdate data for the given instrument ID.

Once subscribed, any matching mark price updates published on the message bus are forwarded to the on_mark_price handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_order_book_at_interval(self, InstrumentId instrument_id, BookType book_type=BookType.L2_MBP, int depth=0, int interval_ms=1000, ClientId client_id=None, dict params=None) → void

Subscribe to an OrderBook at a specified interval for the given instrument ID.

Once subscribed, any matching order book updates published on the message bus are forwarded to the on_order_book handler.

The DataEngine will only maintain one order book for each instrument. Because of this - the level, depth and params for the stream will be set as per the last subscription request (this will also affect all subscribers).

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument ID to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **depth** (_int_ _,_ ​*optional*​) – The maximum depth for the order book. A depth of 0 is maximum depth.
  - **interval_ms** (_int_ _,_ ​*default 1000*​) – The order book snapshot interval (milliseconds).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:**
  - **ValueError** – If depth is negative (< 0).
  - **ValueError** – If interval_ms is not positive (> 0).

#### WARNING

Consider subscribing to order book deltas if you need intervals less than 100 milliseconds.

#### subscribe_order_book_deltas(self, InstrumentId instrument_id, BookType book_type=BookType.L2_MBP, int depth=0, ClientId client_id=None, bool managed=True, bool pyo3_conversion=False, dict params=None) → void

Subscribe to the order book data stream, being a snapshot then deltas for the given instrument ID.

Once subscribed, any matching order book data published on the message bus is forwarded to the on_order_book_deltas handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument ID to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **depth** (_int_ _,_ ​*optional*​) – The maximum depth for the order book. A depth of 0 is maximum depth.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **managed** (_bool_ _,_ ​*default True*​) – If an order book should be managed by the data engine based on the subscribed feed.
  - **pyo3_conversion** (_bool_ _,_ ​*default False*​) – If received deltas should be converted to nautilus_pyo3.OrderBookDeltas prior to being passed to the on_order_book_deltas handler.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_order_book_depth(self, InstrumentId instrument_id, BookType book_type=BookType.L2_MBP, int depth=0, ClientId client_id=None, bool managed=True, bool pyo3_conversion=False, dict params=None) → void

Subscribe to the order book depth stream for the given instrument ID.

Once subscribed, any matching order book data published on the message bus is forwarded to the on_order_book_depth handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument ID to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **managed** (_bool_ _,_ ​*default True*​) – If an order book should be managed by the data engine based on the subscribed feed.
  - **pyo3_conversion** (_bool_ _,_ ​*default False*​) – If received deltas should be converted to nautilus_pyo3.OrderBookDepth prior to being passed to the on_order_book_depth handler.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_quote_ticks(self, InstrumentId instrument_id, ClientId client_id=None, bool update_catalog=False, dict params=None) → void

Subscribe to streaming QuoteTick data for the given instrument ID.

Once subscribed, any matching quote tick data published on the message bus is forwarded to the on_quote_tick handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_signal(self, str name='') → void

Subscribe to a specific signal by name, or to all signals if no name is provided.

Once subscribed, any matching signal data published on the message bus is forwarded to the on_signal handler.

- **Parameters:** **name** (_str_ _,_ ​*optional*​) – The name of the signal to subscribe to. If not provided or an empty string is passed, the subscription will include all signals. The signal name is case-insensitive and will be capitalized (e.g., ‘example’ becomes ‘SignalExample\*’).

#### subscribe_trade_ticks(self, InstrumentId instrument_id, ClientId client_id=None, bool update_catalog=False, dict params=None) → void

Subscribe to streaming TradeTick data for the given instrument ID.

Once subscribed, any matching trade tick data published on the message bus is forwarded to the on_trade_tick handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### to_importable_config(self) → [ImportableActorConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig)

Returns an importable configuration for this actor.

- **Return type:** [ImportableActorConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig)

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

#### unsubscribe_bars(self, BarType bar_type, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming Bar data for the given bar type.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_data(self, DataType data_type, ClientId client_id=None, InstrumentId instrument_id=None, dict params=None) → void

Unsubscribe from data of the given data type.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The data client ID. If supplied then an Unsubscribe command will be sent to the data client.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_funding_rates(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming FundingRateUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_index_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming IndexPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_instrument(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from update Instrument data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_instrument_status(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe to status updates of the given venue.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe to status updates for.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_instruments(self, Venue venue, ClientId client_id=None, dict params=None) → void

Unsubscribe from update Instrument data for the given venue.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue for the subscription.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_mark_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming MarkPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_order_book_at_interval(self, InstrumentId instrument_id, int interval_ms=1000, ClientId client_id=None, dict params=None) → void

Unsubscribe from an OrderBook at a specified interval for the given instrument ID.

The interval must match the previously subscribed interval.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **interval_ms** (_int_ _,_ ​*default 1000*​) – The order book snapshot interval (milliseconds).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_order_book_deltas(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe the order book deltas stream for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_order_book_depth(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe the order book depth stream for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_quote_ticks(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming QuoteTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_trade_ticks(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming TradeTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument ID to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### update_synthetic(self, SyntheticInstrument synthetic) → void

Update the synthetic instrument in the cache.

- **Parameters:** **synthetic** ([_SyntheticInstrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.SyntheticInstrument)) – The synthetic instrument to update in the cache.
- **Raises:** **KeyError** – If synthetic does not already exist in the cache.

### _class_ SimulationModule

Bases: [`Actor`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)

SimulationModule(config: SimulationModuleConfig)

The base class for all simulation modules.

#### WARNING

This class should not be used directly, but through a concrete subclass.

#### active_task_ids(self) → list

Return the active task identifiers.

- **Return type:** list[[TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)]

#### add_synthetic(self, SyntheticInstrument synthetic) → void

Add the created synthetic instrument to the cache.

- **Parameters:** **synthetic** ([_SyntheticInstrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.SyntheticInstrument)) – The synthetic instrument to add to the cache.
- **Raises:** **KeyError** – If synthetic is already in the cache.

#### cache

The read-only cache for the actor.

- **Returns:** CacheFacade

#### cancel_all_tasks(self) → void

Cancel all queued and active tasks.

#### cancel_task(self, task_id: [TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)) → void

Cancel the task with the given task_id (if queued or active).

If the task is not found then a warning is logged.

- **Parameters:** **task_id** ([_TaskId_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)) – The task identifier.

#### clock

The actors clock.

- **Returns:** Clock

#### config

The actors configuration.

- **Returns:** NautilusConfig

#### degrade(self) → void

Degrade the component.

While executing on_degrade() any exception will be logged and reraised, then the component will remain in a `DEGRADING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### deregister_warning_event(self, type event) → void

Deregister the given event type from warning log levels.

- **Parameters:** **event** (​*type*​) – The event class to deregister.

#### dispose(self) → void

Dispose of the component.

While executing on_dispose() any exception will be logged and reraised, then the component will remain in a `DISPOSING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### exchange

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

#### greeks

The read-only greeks calculator for the actor.

- **Returns:** GreeksCalculator

#### handle_bar(self, Bar bar) → void

Handle the given bar data.

If state is `RUNNING` then passes to on_bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar received.

#### WARNING

System method (not intended to be called by user code).

#### handle_bars(self, list bars) → void

Handle the given historical bar data by handling each bar individually.

- **Parameters:** **bars** (_list_ _​[​_[_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar) ​*]*​) – The bars to handle.

#### WARNING

System method (not intended to be called by user code).

- **Raises:** **RuntimeError** – If bar data has incorrectly sorted timestamps (not monotonically increasing).

#### handle_data(self, Data data) → void

Handle the given data.

If state is `RUNNING` then passes to on_data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data received.

#### WARNING

System method (not intended to be called by user code).

#### handle_event(self, Event event) → void

Handle the given event.

If state is `RUNNING` then passes to on_event.

- **Parameters:** **event** ([_Event_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Event)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### handle_funding_rate(self, FundingRateUpdate funding_rate) → void

Handle the given funding rate update.

If state is `RUNNING` then passes to on_funding_rate.

- **Parameters:** **funding_rate** ([_FundingRateUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.FundingRateUpdate)) – The funding rate update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_historical_data(self, data) → void

Handle the given historical data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The historical data received.

#### WARNING

System method (not intended to be called by user code).

#### handle_index_price(self, IndexPriceUpdate index_price) → void

Handle the given index price update.

If state is `RUNNING` then passes to on_index_price.

- **Parameters:** **index_price** ([_IndexPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.IndexPriceUpdate)) – The index price update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instrument(self, Instrument instrument) → void

Handle the given instrument.

Passes to on_instrument if state is `RUNNING`.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instrument_close(self, InstrumentClose update) → void

Handle the given instrument close update.

If state is `RUNNING` then passes to on_instrument_close.

- **Parameters:** **update** ([_InstrumentClose_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentClose)) – The update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instrument_status(self, InstrumentStatus data) → void

Handle the given instrument status update.

If state is `RUNNING` then passes to on_instrument_status.

- **Parameters:** **data** ([_InstrumentStatus_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentStatus)) – The status update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_instruments(self, list instruments) → void

Handle the given instruments data by handling each instrument individually.

- **Parameters:** **instruments** (_list_ _​[​_[_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument) ​*]*​) – The instruments received.

#### WARNING

System method (not intended to be called by user code).

#### handle_mark_price(self, MarkPriceUpdate mark_price) → void

Handle the given mark price update.

If state is `RUNNING` then passes to on_mark_price.

- **Parameters:** **mark_price** ([_MarkPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.MarkPriceUpdate)) – The mark price update received.

#### WARNING

System method (not intended to be called by user code).

#### handle_order_book(self, OrderBook order_book) → void

Handle the given order book.

Passes to on_order_book if state is `RUNNING`.

- **Parameters:** **order_book** ([_OrderBook_](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)) – The order book received.

#### WARNING

System method (not intended to be called by user code).

#### handle_order_book_deltas(self, deltas) → void

Handle the given order book deltas.

Passes to on_order_book_deltas if state is `RUNNING`. The deltas will be nautilus_pyo3.OrderBookDeltas if the pyo3_conversion flag was set for the subscription.

- **Parameters:** **deltas** ([_OrderBookDeltas_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDeltas) _or_ ​*nautilus_pyo3.OrderBookDeltas*​) – The order book deltas received.

#### WARNING

System method (not intended to be called by user code).

#### handle_order_book_depth(self, OrderBookDepth10 depth) → void

Handle the given order book depth

Passes to on_order_book_depth if state is `RUNNING`.

- **Parameters:** **depth** ([_OrderBookDepth10_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDepth10)) – The order book depth received.

#### WARNING

System method (not intended to be called by user code).

#### handle_quote_tick(self, QuoteTick tick) → void

Handle the given quote tick.

If state is `RUNNING` then passes to on_quote_tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### handle_quote_ticks(self, list ticks) → void

Handle the given historical quote tick data by handling each tick individually.

- **Parameters:** **ticks** (_list_ _​[​_[_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick) ​*]*​) – The ticks received.

#### WARNING

System method (not intended to be called by user code).

#### handle_signal(self, Data signal) → void

Handle the given signal.

If state is `RUNNING` then passes to on_signal.

- **Parameters:** **signal** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The signal received.

#### WARNING

System method (not intended to be called by user code).

#### handle_trade_tick(self, TradeTick tick) → void

Handle the given trade tick.

If state is `RUNNING` then passes to on_trade_tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### handle_trade_ticks(self, list ticks) → void

Handle the given historical trade tick data by handling each tick individually.

- **Parameters:** **ticks** (_list_ _​[​_[_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick) ​*]*​) – The ticks received.

#### WARNING

System method (not intended to be called by user code).

#### has_active_tasks(self) → bool

Return a value indicating whether there are any active tasks.

- **Return type:** bool

#### has_any_tasks(self) → bool

Return a value indicating whether there are any queued OR active tasks.

- **Return type:** bool

#### has_pending_requests(self) → bool

Return whether the actor is pending processing for any requests.

- **Returns:** True if any requests are pending, else False.
- **Return type:** bool

#### has_queued_tasks(self) → bool

Return a value indicating whether there are any queued tasks.

- **Return type:** bool

#### id

The components ID.

- **Returns:** ComponentId

#### indicators_initialized(self) → bool

Return a value indicating whether all indicators are initialized.

- **Returns:** True if all initialized, else False
- **Return type:** bool

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

#### is_pending_request(self, UUID4 request_id) → bool

Return whether the request for the given identifier is pending processing.

- **Parameters:** **request_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The request ID to check.
- **Returns:** True if request is pending, else False.
- **Return type:** bool

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

#### load(self, dict state) → void

Load the actor/strategy state from the give state dictionary.

Calls on_load and passes the state.

- **Parameters:** **state** (_dict_ \*[\*_str_ _,_ _bytes_ ​*]\*​) – The strategy state to load.

#### WARNING

Exceptions raised will be caught, logged, and reraised.

#### log

The actors logger.

- **Returns:** Logger

#### log_diagnostics(self, Logger logger) → void

Abstract method (implement in subclass).

#### msgbus

The message bus for the actor (if registered).

- **Returns:** MessageBus or `None`

#### on_bar(self, Bar bar) → void

Actions to be performed when running and receives a bar.

- **Parameters:** **bar** ([_Bar_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.Bar)) – The bar received.

#### WARNING

System method (not intended to be called by user code).

#### on_data(self, data) → void

Actions to be performed when running and receives data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data received.

#### WARNING

System method (not intended to be called by user code).

#### on_degrade(self) → void

Actions to be performed on degrade.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in the actor implementation.

#### on_dispose(self) → void

Actions to be performed on dispose.

Cleanup/release any resources used here.

#### WARNING

System method (not intended to be called by user code).

#### on_event(self, Event event) → void

Actions to be performed running and receives an event.

- **Parameters:** **event** ([_Event_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Event)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_fault(self) → void

Actions to be performed on fault.

Cleanup any resources used by the actor here.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in the actor implementation.

#### on_funding_rate(self, FundingRateUpdate funding_rate) → void

Actions to be performed when running and receives a funding rate update.

- **Parameters:** **funding_rate** ([_FundingRateUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.FundingRateUpdate)) – The funding rate update received.

#### WARNING

System method (not intended to be called by user code).

#### on_historical_data(self, data) → void

Actions to be performed when running and receives historical data.

- **Parameters:** **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The historical data received.

#### WARNING

System method (not intended to be called by user code).

#### on_index_price(self, IndexPriceUpdate index_price) → void

Actions to be performed when running and receives an index price update.

- **Parameters:** **index_price** ([_IndexPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.IndexPriceUpdate)) – The index price update received.

#### WARNING

System method (not intended to be called by user code).

#### on_instrument(self, Instrument instrument) → void

Actions to be performed when running and receives an instrument.

- **Parameters:** **instrument** ([_Instrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.Instrument)) – The instrument received.

#### WARNING

System method (not intended to be called by user code).

#### on_instrument_close(self, InstrumentClose update) → void

Actions to be performed when running and receives an instrument close update.

- **Parameters:** **update** ([_InstrumentClose_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentClose)) – The instrument close received.

#### WARNING

System method (not intended to be called by user code).

#### on_instrument_status(self, InstrumentStatus data) → void

Actions to be performed when running and receives an instrument status update.

- **Parameters:** **data** ([_InstrumentStatus_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.InstrumentStatus)) – The instrument status update received.

#### WARNING

System method (not intended to be called by user code).

#### on_load(self, dict state) → void

Actions to be performed when the actor state is loaded.

Saved state values will be contained in the give state dictionary.

- **Parameters:** **state** (_dict_ \*[\*_str_ _,_ _bytes_ ​*]\*​) – The strategy state to load.

#### WARNING

System method (not intended to be called by user code).

#### on_mark_price(self, MarkPriceUpdate mark_price) → void

Actions to be performed when running and receives a mark price update.

- **Parameters:** **mark_price** ([_MarkPriceUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.MarkPriceUpdate)) – The mark price update received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_book(self, OrderBook order_book) → void

Actions to be performed when running and receives an order book.

- **Parameters:** **order_book** ([_OrderBook_](https://nautilustrader.io/docs/latest/api_reference/model/book#nautilus_trader.model.book.OrderBook)) – The order book received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_book_deltas(self, deltas) → void

Actions to be performed when running and receives order book deltas.

- **Parameters:** **deltas** ([_OrderBookDeltas_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDeltas) _or_ ​*nautilus_pyo3.OrderBookDeltas*​) – The order book deltas received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_book_depth(self, depth) → void

Actions to be performed when running and receives an order book depth.

- **Parameters:** **depth** ([_OrderBookDepth10_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.OrderBookDepth10)) – The order book depth received.

#### WARNING

System method (not intended to be called by user code).

#### on_quote_tick(self, QuoteTick tick) → void

Actions to be performed when running and receives a quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### on_reset(self) → void

Actions to be performed on reset.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in a user implementation.

#### on_resume(self) → void

Actions to be performed on resume.

#### WARNING

System method (not intended to be called by user code).

#### on_save(self) → dict

Actions to be performed when the actor state is saved.

Create and return a state dictionary of values to be saved.

- **Returns:** The strategy state to save.
- **Return type:** dict[str, bytes]

#### WARNING

System method (not intended to be called by user code).

#### on_signal(self, signal) → void

Actions to be performed when running and receives signal data.

- **Parameters:** **signal** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The signal received.

#### WARNING

System method (not intended to be called by user code).

#### on_start(self) → void

Actions to be performed on start.

The intent is that this method is called once per trading ‘run’, when initially starting.

It is recommended to subscribe/request for data here.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in a user implementation.

#### on_stop(self) → void

Actions to be performed on stop.

The intent is that this method is called to pause, or when done for day.

#### WARNING

System method (not intended to be called by user code).

Should be overridden in a user implementation.

#### on_trade_tick(self, TradeTick tick) → void

Actions to be performed when running and receives a trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### pending_requests(self) → set

Return the request IDs which are currently pending processing.

- **Return type:** set[[UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)]

#### portfolio

The read-only portfolio for the actor.

- **Returns:** PortfolioFacade

#### pre_process(self, Data data) → void

Abstract method pre_process (implement in subclass).

#### process(self, uint64_t ts_now) → void

Abstract method (implement in subclass).

#### publish_data(self, DataType data_type, Data data) → void

Publish the given data to the message bus.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type being published.
  - **data** ([_Data_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)) – The data to publish.

#### publish_signal(self, str name, value, uint64_t ts_event=0) → void

Publish the given value as a signal to the message bus.

- **Parameters:**
  - **name** (​*str*​) – The name of the signal being published. The signal name will be converted to title case, with each word capitalized (e.g., ‘example’ becomes ‘SignalExample’).
  - **value** (​*object*​) – The signal data to publish.
  - **ts_event** (_uint64_t_ _,_ ​*optional*​) – UNIX timestamp (nanoseconds) when the signal event occurred. If `None` then will timestamp current time.

#### queue_for_executor(self, func: Callable[..., Any], tuple args=None, dict kwargs=None)

Queues the callable func to be executed as fn(\*args, \*\*kwargs) sequentially.

- **Parameters:**
  - **func** (​*Callable*​) – The function to be executed.
  - **args** (​*positional arguments*​) – The positional arguments for the call to func.
  - **kwargs** (​*arbitrary keyword arguments*​) – The keyword arguments for the call to func.
- **Raises:** **TypeError** – If func is not of type Callable.

#### queued_task_ids(self) → list

Return the queued task identifiers.

- **Return type:** list[[TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)]

#### register_base(self, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, Clock clock) → void

Register with a trader.

- **Parameters:**
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the actor.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the actor.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the actor.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the actor.

#### WARNING

System method (not intended to be called by user code).

#### register_executor(self, loop: asyncio.AbstractEventLoop, executor: Executor) → void

Register the given Executor for the actor.

- **Parameters:**
  - **loop** (​*asyncio.AbstractEventLoop*​) – The event loop of the application.
  - **executor** (​*concurrent.futures.Executor*​) – The executor to register.
- **Raises:** **TypeError** – If executor is not of type concurrent.futures.Executor

#### register_indicator_for_bars(self, BarType bar_type, Indicator indicator) → void

Register the given indicator with the actor/strategy to receive bar data for the given bar type.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for bar updates.
  - **indicator** ([_Indicator_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)) – The indicator to register.

#### register_indicator_for_quote_ticks(self, InstrumentId instrument_id, Indicator indicator) → void

Register the given indicator with the actor/strategy to receive quote tick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for tick updates.
  - **indicator** ([_Indicator_](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)) – The indicator to register.

#### register_indicator_for_trade_ticks(self, InstrumentId instrument_id, Indicator indicator) → void

Register the given indicator with the actor/strategy to receive trade tick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for tick updates.
  - **indicator** (​*indicator*​) – The indicator to register.

#### register_venue(self, SimulatedExchange exchange) → void

Register the given simulated exchange with the module.

- **Parameters:** **exchange** ([_SimulatedExchange_](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.SimulatedExchange)) – The exchange to register.

#### register_warning_event(self, type event) → void

Register the given event type for warning log levels.

- **Parameters:** **event** (​*type*​) – The event class to register.

#### registered_indicators

Return the registered indicators for the strategy.

- **Return type:** list[[Indicator](https://nautilustrader.io/docs/latest/api_reference/indicators#nautilus_trader.indicators.Indicator)]

#### request_aggregated_bars(self, list bar_types, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, bool include_external_data=False, bool update_subscriptions=False, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical aggregated Bar data for multiple bar types. The first bar is used to determine which market data type will be queried. This can either be quotes, trades or bars. If bars are queried, the first bar type needs to have a composite bar that is external (i.e. not internal/aggregated). This external bar type will be queried.

If end is `None` then will request up to the most recent data.

Once the response is received, the bar data is forwarded from the message bus to the on_historical_data handler. Any tick data used for aggregation is also forwarded to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **bar_types** (_list_ _​[​_[_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType) ​*]*​) – The list of bar types for the request. Composite bars can also be used and need to figure in the list after a BarType on which it depends.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of data received (quote ticks, trade ticks or bars).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **include_external_data** (_bool_ _,_ ​*default False*​) – If True, includes the queried external data in the response.
  - **update_subscriptions** (_bool_ _,_ ​*default False*​) – If True, updates the aggregators of any existing or future subscription with the queried external data.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **ValueError** – If bar_types is empty.
  - **TypeError** – If callback is not None and not of type Callable.
  - **TypeError** – If bar_types is empty or contains elements not of type BarType.

#### request_bars(self, BarType bar_type, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical Bar data.

If end is `None` then will request up to the most recent data.

Once the response is received, the bar data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of bars received.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_data(self, DataType data_type, ClientId client_id, InstrumentId instrument_id=None, datetime start=None, datetime end=None, int limit=0, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request custom data for the given data type from the given data client.

Once the response is received, the data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type for the request.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId)) – The data client ID.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Cannot be None. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of data points received.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_instrument(self, InstrumentId instrument_id, datetime start=None, datetime end=None, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request Instrument data for the given instrument ID.

If end is `None` then will request up to the most recent data.

Once the response is received, the instrument data is forwarded from the message bus to the on_instrument handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the request.
  - **start** (_datetime_ _,_ ​*optional*​) – The start datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **ValueError** – If start is not None and > current timestamp (now).
  - **ValueError** – If end is not None and > current timestamp (now).
  - **ValueError** – If start and end are not None and start is >= end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_instruments(self, Venue venue, datetime start=None, datetime end=None, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request all Instrument data for the given venue.

If end is `None` then will request up to the most recent data.

Once the response is received, the instrument data is forwarded from the message bus to the on_instrument handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue for the request.
  - **start** (_datetime_ _,_ ​*optional*​) – The start datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. The inclusiveness depends on individual data client implementation.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client:
    - only_last (default True) retains only the latest instrument record per instrument_id, based on the most recent ts_init.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **ValueError** – If start is not None and > current timestamp (now).
  - **ValueError** – If end is not None and > current timestamp (now).
  - **ValueError** – If start and end are not None and start is >= end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_order_book_snapshot(self, InstrumentId instrument_id, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request an order book snapshot.

Once the response is received, the order book data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the order book snapshot request.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the depth of the order book snapshot.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If None, it will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **ValueError** – If the instrument_id is None.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_quote_ticks(self, InstrumentId instrument_id, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical QuoteTick data.

If end is `None` then will request up to the most recent data.

Once the response is received, the quote tick data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of quote ticks received.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### request_trade_ticks(self, InstrumentId instrument_id, datetime start, datetime end=None, int limit=0, ClientId client_id=None, callback: Callable[[UUID4], None] | None = None, update_catalog: bool = False, dict params=None) → [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

Request historical TradeTick data.

If end is `None` then will request up to the most recent data.

Once the response is received, the trade tick data is forwarded from the message bus to the on_historical_data handler.

If the request fails, then an error is logged.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument ID for the request.
  - **start** (​*datetime*​) – The start datetime (UTC) of request time range. Should be left-inclusive (start \<\= value), but inclusiveness is not currently guaranteed.
  - **end** (_datetime_ _,_ ​*optional*​) – The end datetime (UTC) of request time range. If None then will be replaced with the current UTC time. Should be right-inclusive (value \<\= end), but inclusiveness is not currently guaranteed.
  - **limit** (_int_ _,_ ​*optional*​) – The limit on the amount of trade ticks received.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **callback** (_Callable_ _[_ _​[​_[_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4) _]_ _,_ _None_ _]_ _,_ ​*optional*​) – The registered callback, to be called with the request ID when the response has completed processing.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Returns:** The request_id for the request.
- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)
- **Raises:**
  - **TypeError** – If start is None.
  - **ValueError** – If start is > current timestamp (now).
  - **ValueError** – If end is > current timestamp (now).
  - **ValueError** – If start is > end.
  - **TypeError** – If callback is not None and not of type Callable.

#### reset(self) → void

Abstract method (implement in subclass).

#### resume(self) → void

Resume the component.

While executing on_resume() any exception will be logged and reraised, then the component will remain in a `RESUMING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### run_in_executor(self, func: Callable[..., Any], tuple args=None, dict kwargs=None)

Schedules the callable func to be executed as fn(\*args, \*\*kwargs).

- **Parameters:**
  - **func** (​*Callable*​) – The function to be executed.
  - **args** (​*positional arguments*​) – The positional arguments for the call to func.
  - **kwargs** (​*arbitrary keyword arguments*​) – The keyword arguments for the call to func.
- **Returns:** The unique task identifier for the execution. This also corresponds to any future objects memory address.
- **Return type:** [TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)
- **Raises:** **TypeError** – If func is not of type Callable.

#### save(self) → dict

Return the actor/strategy state dictionary to be saved.

Calls on_save.

- **Returns:** The strategy state to save.
- **Return type:** dict[str, bytes]

#### WARNING

Exceptions raised will be caught, logged, and reraised.

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

#### subscribe_bars(self, BarType bar_type, ClientId client_id=None, bool await_partial=False, bool update_catalog=False, dict params=None) → void

Subscribe to streaming Bar data for the given bar type.

Once subscribed, any matching bar data published on the message bus is forwarded to the on_bar handler.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **await_partial** (_bool_ _,_ ​*default False*​) – If the bar aggregator should await the arrival of a historical partial bar prior to actively aggregating new bars.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_data(self, DataType data_type, ClientId client_id=None, InstrumentId instrument_id=None, bool update_catalog=False, dict params=None) → void

Subscribe to data of the given data type.

Once subscribed, any matching data published on the message bus is forwarded to the on_data handler.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The data client ID. If supplied then a Subscribe command will be sent to the corresponding data client.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_funding_rates(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to streaming FundingRateUpdate data for the given instrument ID.

Once subscribed, any matching funding rate updates published on the message bus are forwarded to the on_funding_rate handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_index_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to streaming IndexPriceUpdate data for the given instrument ID.

Once subscribed, any matching index price updates published on the message bus are forwarded to the on_index_price handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instrument(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to update Instrument data for the given instrument ID.

Once subscribed, any matching instrument data published on the message bus is forwarded to the on_instrument handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument ID for the subscription.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instrument_close(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to close updates for the given instrument ID.

Once subscribed, any matching instrument close data published on the message bus is forwarded to the on_instrument_close handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to status updates for.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instrument_status(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to status updates for the given instrument ID.

Once subscribed, any matching instrument status data published on the message bus is forwarded to the on_instrument_status handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to status updates for.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_instruments(self, Venue venue, ClientId client_id=None, dict params=None) → void

Subscribe to update Instrument data for the given venue.

Once subscribed, any matching instrument data published on the message bus is forwarded the on_instrument handler.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue for the subscription.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_mark_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Subscribe to streaming MarkPriceUpdate data for the given instrument ID.

Once subscribed, any matching mark price updates published on the message bus are forwarded to the on_mark_price handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_order_book_at_interval(self, InstrumentId instrument_id, BookType book_type=BookType.L2_MBP, int depth=0, int interval_ms=1000, ClientId client_id=None, dict params=None) → void

Subscribe to an OrderBook at a specified interval for the given instrument ID.

Once subscribed, any matching order book updates published on the message bus are forwarded to the on_order_book handler.

The DataEngine will only maintain one order book for each instrument. Because of this - the level, depth and params for the stream will be set as per the last subscription request (this will also affect all subscribers).

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument ID to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **depth** (_int_ _,_ ​*optional*​) – The maximum depth for the order book. A depth of 0 is maximum depth.
  - **interval_ms** (_int_ _,_ ​*default 1000*​) – The order book snapshot interval (milliseconds).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:**
  - **ValueError** – If depth is negative (< 0).
  - **ValueError** – If interval_ms is not positive (> 0).

#### WARNING

Consider subscribing to order book deltas if you need intervals less than 100 milliseconds.

#### subscribe_order_book_deltas(self, InstrumentId instrument_id, BookType book_type=BookType.L2_MBP, int depth=0, ClientId client_id=None, bool managed=True, bool pyo3_conversion=False, dict params=None) → void

Subscribe to the order book data stream, being a snapshot then deltas for the given instrument ID.

Once subscribed, any matching order book data published on the message bus is forwarded to the on_order_book_deltas handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument ID to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **depth** (_int_ _,_ ​*optional*​) – The maximum depth for the order book. A depth of 0 is maximum depth.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **managed** (_bool_ _,_ ​*default True*​) – If an order book should be managed by the data engine based on the subscribed feed.
  - **pyo3_conversion** (_bool_ _,_ ​*default False*​) – If received deltas should be converted to nautilus_pyo3.OrderBookDeltas prior to being passed to the on_order_book_deltas handler.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_order_book_depth(self, InstrumentId instrument_id, BookType book_type=BookType.L2_MBP, int depth=0, ClientId client_id=None, bool managed=True, bool pyo3_conversion=False, dict params=None) → void

Subscribe to the order book depth stream for the given instrument ID.

Once subscribed, any matching order book data published on the message bus is forwarded to the on_order_book_depth handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument ID to subscribe to.
  - **book_type** (BookType {`L1_MBP`, `L2_MBP`, `L3_MBO`}) – The order book type.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **managed** (_bool_ _,_ ​*default True*​) – If an order book should be managed by the data engine based on the subscribed feed.
  - **pyo3_conversion** (_bool_ _,_ ​*default False*​) – If received deltas should be converted to nautilus_pyo3.OrderBookDepth prior to being passed to the on_order_book_depth handler.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_quote_ticks(self, InstrumentId instrument_id, ClientId client_id=None, bool update_catalog=False, dict params=None) → void

Subscribe to streaming QuoteTick data for the given instrument ID.

Once subscribed, any matching quote tick data published on the message bus is forwarded to the on_quote_tick handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### subscribe_signal(self, str name='') → void

Subscribe to a specific signal by name, or to all signals if no name is provided.

Once subscribed, any matching signal data published on the message bus is forwarded to the on_signal handler.

- **Parameters:** **name** (_str_ _,_ ​*optional*​) – The name of the signal to subscribe to. If not provided or an empty string is passed, the subscription will include all signals. The signal name is case-insensitive and will be capitalized (e.g., ‘example’ becomes ‘SignalExample\*’).

#### subscribe_trade_ticks(self, InstrumentId instrument_id, ClientId client_id=None, bool update_catalog=False, dict params=None) → void

Subscribe to streaming TradeTick data for the given instrument ID.

Once subscribed, any matching trade tick data published on the message bus is forwarded to the on_trade_tick handler.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **update_catalog** (_bool_ _,_ ​*optional*​) – Whether to update a catalog with the received data. Only useful when downloading data during a backtest.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### to_importable_config(self) → [ImportableActorConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig)

Returns an importable configuration for this actor.

- **Return type:** [ImportableActorConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig)

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type

#### unsubscribe_bars(self, BarType bar_type, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming Bar data for the given bar type.

- **Parameters:**
  - **bar_type** ([_BarType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.BarType)) – The bar type to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_data(self, DataType data_type, ClientId client_id=None, InstrumentId instrument_id=None, dict params=None) → void

Unsubscribe from data of the given data type.

- **Parameters:**
  - **data_type** ([_DataType_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.DataType)) – The data type to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The data client ID. If supplied then an Unsubscribe command will be sent to the data client.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_funding_rates(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming FundingRateUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_index_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming IndexPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_instrument(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from update Instrument data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_instrument_status(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe to status updates of the given venue.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to unsubscribe to status updates for.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_instruments(self, Venue venue, ClientId client_id=None, dict params=None) → void

Unsubscribe from update Instrument data for the given venue.

- **Parameters:**
  - **venue** ([_Venue_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) – The venue for the subscription.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_mark_prices(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming MarkPriceUpdate data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_order_book_at_interval(self, InstrumentId instrument_id, int interval_ms=1000, ClientId client_id=None, dict params=None) → void

Unsubscribe from an OrderBook at a specified interval for the given instrument ID.

The interval must match the previously subscribed interval.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **interval_ms** (_int_ _,_ ​*default 1000*​) – The order book snapshot interval (milliseconds).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_order_book_deltas(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe the order book deltas stream for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_order_book_depth(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe the order book depth stream for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The order book instrument to subscribe to.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_quote_ticks(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming QuoteTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### unsubscribe_trade_ticks(self, InstrumentId instrument_id, ClientId client_id=None, dict params=None) → void

Unsubscribe from streaming TradeTick data for the given instrument ID.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The tick instrument ID to unsubscribe from.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### update_synthetic(self, SyntheticInstrument synthetic) → void

Update the synthetic instrument in the cache.

- **Parameters:** **synthetic** ([_SyntheticInstrument_](https://nautilustrader.io/docs/latest/api_reference/model/instruments#nautilus_trader.model.instruments.SyntheticInstrument)) – The synthetic instrument to update in the cache.
- **Raises:** **KeyError** – If synthetic does not already exist in the cache.

### _class_ BacktestNode

Bases: `object`

Provides a node for orchestrating groups of backtest runs.

- **Parameters:** **configs** (_list_ _​[​_[_BacktestRunConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestRunConfig) ​*]*​) – The backtest run configurations.
- **Raises:**
  - **ValueError** – If configs is `None` or empty.
  - **ValueError** – If configs contains a type other than BacktestRunConfig.

#### _property_ configs _: list[[BacktestRunConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestRunConfig)]_

Return the loaded backtest run configs for the node.

- **Return type:** list[[BacktestRunConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestRunConfig)]

#### get_log_guard() → LogGuard | [LogGuard](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.LogGuard) | None

Return the global logging subsystems log guard.

May return `None` if no internal engines are initialized yet.

- **Return type:** nautilus_pyo3.LogGuard | [LogGuard](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.LogGuard) | None

#### get_engine(run_config_id: str) → [BacktestEngine](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.BacktestEngine) | None

Return the backtest engine associated with the given run config ID (if found).

- **Parameters:** **run_config_id** (​*str*​) – The run configuration ID for the created engine.
- **Return type:** BacktestEngine or `None`

#### get_engines() → list[[BacktestEngine](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.BacktestEngine)]

Return all backtest engines created by the node.

- **Return type:** list[[BacktestEngine](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.engine.BacktestEngine)]

#### dispose()

#### add_data_client_factory(name: str, factory: type[LiveDataClientFactory]) → None

Add the given data client factory to the node.

- **Parameters:**
  - **name** (​*str*​) – The name of the client factory.
  - **factory** (_type_ \*[\*_LiveDataClientFactory_ ​*]\*​) – The factory class to add.
- **Raises:**
  - **ValueError** – If name is not a valid string.
  - **KeyError** – If name has already been added.

#### build() → None

Can be optionally run before a backtest to build backtest engines for all configured backtest runs.

This can be useful to subscribe to a topic before running a backtest to collect any type of information.

#### setup_download_engine(catalog_config: [DataCatalogConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.persistence.config.DataCatalogConfig), data_clients: dict[str, type[[LiveDataClientConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.live.config.LiveDataClientConfig)]]) → None

Set up a backtest engine for downloading data.

Creates a dedicated backtest engine with an actor for data downloading purposes.

- **Parameters:**
  - **catalog_config** ([_DataCatalogConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.persistence.config.DataCatalogConfig)) – The configuration for the data catalog.
  - **data_clients** (_dict_ \*[\*_str_ _,_ [_LiveDataClientConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.live.config.LiveDataClientConfig) ​*]*​) – The data client configurations.

#### download_data(request_function: str, \*\*kwargs) → None

Download data using the specified request function.

- **Parameters:**
  - **request_function** (​*str*​) – The name of the request function to use. Must be one of: “request_instrument”, “request_data”, “request_bars”, “request_quote_ticks”, or “request_trade_ticks”.
  - **\*\*kwargs** – Additional keyword arguments to pass to the request function.

#### run() → list[[BacktestResult](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.results.BacktestResult)]

Run the backtest node which will synchronously execute the list of loaded backtest run configs.

- **Returns:** The results of the backtest runs.
- **Return type:** list[[BacktestResult](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.results.BacktestResult)]

#### _classmethod_ load_data_config(config: [BacktestDataConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestDataConfig), start: str | int | None = None, end: str | int | None = None) → CatalogDataResult

#### _classmethod_ load_catalog(config: [BacktestDataConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestDataConfig)) → [ParquetDataCatalog](https://nautilustrader.io/docs/latest/api_reference/persistence#nautilus_trader.persistence.catalog.parquet.ParquetDataCatalog)

#### log_backtest_exception(e: Exception, config: [BacktestRunConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestRunConfig)) → None

### get_instrument_ids(config: [BacktestDataConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestDataConfig)) → list[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)]

### get_oms_type(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → OmsType

### get_account_type(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → AccountType

### get_book_type(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → BookType | None

### get_starting_balances(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → list[[Money](https://nautilustrader.io/docs/latest/api_reference/model/objects#nautilus_trader.model.objects.Money)]

### get_base_currency(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → [Currency](https://nautilustrader.io/docs/latest/api_reference/model/objects#nautilus_trader.model.objects.Currency) | None

### get_leverages(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → dict[[InstrumentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId), Decimal]

### get_fill_model(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → [FillModel](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FillModel) | None

Create a FillModel from an ImportableFillModelConfig.

### get_latency_model(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → [LatencyModel](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.LatencyModel) | None

Create a LatencyModel from an ImportableLatencyModelConfig.

### get_fee_model(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig)) → [FeeModel](https://nautilustrader.io/docs/latest/api_reference/backtest#nautilus_trader.backtest.models.FeeModel) | None

Create a FeeModel from an ImportableFeeModelConfig.

### get_margin_model(config: [BacktestVenueConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.backtest.config.BacktestVenueConfig))

Create a MarginModel from the venue configuration.

### _class_ BacktestResult

Bases: `object`

Represents the results of a single complete backtest run.

#### trader*id*: str\_

#### machine*id*: str\_

#### run*config_id*: str | None\_

#### instance*id*: str\_

#### run*id*: str\_

#### run*started*: int | None\_

#### run*finished*: int | None\_

#### backtest*start*: int | None\_

#### backtest*end*: int | None\_

#### elapsed*time*: float\_

#### iterations _: int_

#### total*events*: int\_

#### total*orders*: int\_

#### total*positions*: int\_

#### stats*pnls*: dict[str, dict[str, float]]\_

#### stats*returns*: dict[str, float]\_

### ensure_plotting(func)

Decorate a function that require a plotting library.

Ensures library is installed and providers a better error about how to install if not found.
