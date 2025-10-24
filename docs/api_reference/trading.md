# Trading

The trading subpackage groups all trading domain specific components and tooling.

This is a top-level package where the majority of users will interface with the framework. Custom trading strategies can be implemented by inheriting from the Strategy base class.

### _class_ Controller

Bases: [`Actor`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)

The base class for all trader controllers.

- **Parameters:**
  - **trader** ([_Trader_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Trader)) – The reference to the trader instance to control.
  - **config** ([_ActorConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ActorConfig) _,_ ​*optional*​) – The configuration for the controller
- **Raises:** **TypeError** – If config is not of type ActorConfig.

#### create_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor), start: bool = True) → None

Add the given actor to the controlled trader.

- **Parameters:**
  - **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the actor should be started immediately.
- **Raises:**
  - **ValueError** – If actor.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If actor is already registered with the trader.

#### create_actor_from_config(actor_config: [ImportableActorConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig), start: bool = True) → None

Create the actor corresponding to actor_config.

- **Parameters:**
  - **actor_config** ([_ImportableActorConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig)) – The actor config of the actor to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the actor should be started immediately.
- **Raises:**
  - **ValueError** – If actor.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If actor is already registered with the trader.

#### create_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy), start: bool = True) → None

Add the given strategy to the controlled trader.

- **Parameters:**
  - **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the strategy should be started immediately.
- **Raises:**
  - **ValueError** – If strategy.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If strategy is already registered with the trader.

#### create_strategy_from_config(strategy_config: [ImportableStrategyConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig), start: bool = True) → None

Create the strategy corresponding to strategy_config.

- **Parameters:**
  - **strategy_config** ([_ImportableStrategyConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig)) – The strategy config of the strategy to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the strategy should be started immediately.
- **Raises:**
  - **ValueError** – If strategy.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If strategy is already registered with the trader.

#### execute(command: [Command](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.message.Command)) → None

#### register_base(self, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, Clock clock) → void

Register with a trader.

- **Parameters:**
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the actor.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the actor.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the actor.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the actor.

#### WARNING

System method (not intended to be called by user code).

#### remove_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Remove the given actor.

Will stop the actor first if state is `RUNNING`.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to remove.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### remove_actor_from_id(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Remove the actor corresponding to actor_id.

Will stop the actor first if state is `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The ID of the actor to remove.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### remove_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Remove the given strategy.

Will stop the strategy first if state is `RUNNING`.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to remove.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### remove_strategy_from_id(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Remove the strategy corresponding to strategy_id.

Will stop the strategy first if state is `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The ID of the strategy to remove.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### start_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Start the given actor.

Will log a warning if the actor is already `RUNNING`.

- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### start_actor_from_id(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Start the actor corresponding to actor_id.

Will log a warning if the actor is already `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The ID of the actor to start.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### start_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Start the given strategy.

Will log a warning if the strategy is already `RUNNING`.

- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### start_strategy_from_id(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Start the strategy corresponding to strategy_id.

Will log a warning if the strategy is already `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The ID of the strategy to start.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### stop_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Stop the given actor.

Will log a warning if the actor is not `RUNNING`.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to stop.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### stop_actor_from_id(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Stop the actor corresponding to actor_id.

Will log a warning if the actor is not `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The ID of the actor to stop.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### stop_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Stop the given strategy.

Will log a warning if the strategy is not `RUNNING`.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to stop.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### stop_strategy_from_id(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Stop the strategy corresponding to strategy_id.

Will log a warning if the strategy is not `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The ID of the strategy to stop.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

### _class_ Strategy

Bases: [`Actor`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)

Strategy(config: StrategyConfig | None = None)

The base class for all trading strategies.

This class allows traders to implement their own customized trading strategies. A trading strategy can configure its own order management system type, which determines how positions are handled by the ExecutionEngine.

Strategy OMS (Order Management System) types: : - `UNSPECIFIED`: No specific type has been configured, will therefore default to the native OMS type for each venue.

- `HEDGING`: A position ID will be assigned for each new position which is opened per instrument.
- `NETTING`: There will only be a single position for the strategy per instrument. The position ID naming convention is {instrument_id}-{strategy_id}.
- **Parameters:** **config** ([_StrategyConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.StrategyConfig) _,_ ​*optional*​) – The trading strategy configuration.
- **Raises:** **TypeError** – If config is not of type StrategyConfig.

#### WARNING

- This class should not be used directly, but through a concrete subclass.
- Do not call components such as clock and logger in the \_\_init\_\_ prior to registration.

#### cancel_all_orders(self, InstrumentId instrument_id, OrderSide order_side=OrderSide.NO_ORDER_SIDE, ClientId client_id=None, dict params=None) → void

Cancel all orders for this strategy for the given instrument ID.

A CancelAllOrders command will be created and then sent to **both** the OrderEmulator and the ExecutionEngine.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument for the orders to cancel.
  - **order_side** (OrderSide, default `NO_ORDER_SIDE` (both sides)) – The side of the orders to cancel.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### cancel_gtd_expiry(self, Order order) → void

Cancel the managed GTD expiry for the given order.

If there is no current GTD expiry timer, then an error will be logged.

- **Parameters:** **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to cancel the GTD expiry for.

#### cancel_order(self, Order order, ClientId client_id=None, dict params=None) → void

Cancel the given order with optional routing instructions.

A CancelOrder command will be created and then sent to **either** the OrderEmulator or the ExecutionEngine (depending on whether the order is emulated).

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to cancel.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### cancel_orders(self, list orders, ClientId client_id=None, dict params=None) → void

Batch cancel the given list of orders with optional routing instructions.

For each order in the list, a CancelOrder command will be created and added to a BatchCancelOrders command. This command is then sent to the ExecutionEngine.

Logs an error if the orders list contains local/emulated orders.

- **Parameters:**
  - **orders** (_list_ _​[​_[_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order) ​*]*​) – The orders to cancel.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:**
  - **ValueError** – If orders is empty.
  - **TypeError** – If orders contains a type other than Order.

#### change_id(self, StrategyId strategy_id) → void

Change the strategies identifier to the given strategy_id.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The new strategy ID to change to.

#### change_order_id_tag(self, str order_id_tag) → void

Change the order identifier tag to the given order_id_tag.

- **Parameters:** **order_id_tag** (​*str*​) – The new order ID tag to change to.

#### close_all_positions(self, InstrumentId instrument_id, PositionSide position_side=PositionSide.NO_POSITION_SIDE, ClientId client_id=None, list tags=None, TimeInForce time_in_force=TimeInForce.GTC, bool reduce_only=True, dict params=None) → void

Close all positions for the given instrument ID for this strategy.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument for the positions to close.
  - **position_side** (PositionSide, default `NO_POSITION_SIDE` (both sides)) – The side of the positions to close.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **tags** (_list_ \*[\*_str_ *]\* _,_ ​*optional*​) – The tags for the market orders closing the positions.
  - **time_in_force** (TimeInForce, default `GTC`) – The time in force for the market orders closing the positions.
  - **reduce_only** (_bool_ _,_ ​*default True*​) – If the market orders to close positions should carry the ‘reduce-only’ execution instruction. Optional, as not all venues support this feature.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### close_position(self, Position position, ClientId client_id=None, list tags=None, TimeInForce time_in_force=TimeInForce.GTC, bool reduce_only=True, dict params=None) → void

Close the given position.

A closing MarketOrder for the position will be created, and then sent to the ExecutionEngine via a SubmitOrder command.

- **Parameters:**
  - **position** ([_Position_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Position)) – The position to close.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **tags** (_list_ \*[\*_str_ *]\* _,_ ​*optional*​) – The tags for the market order closing the position.
  - **time_in_force** (TimeInForce, default `GTC`) – The time in force for the market order closing the position.
  - **reduce_only** (_bool_ _,_ ​*default True*​) – If the market order to close the position should carry the ‘reduce-only’ execution instruction. Optional, as not all venues support this feature.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### external_order_claims

The external order claims instrument IDs for the strategy.

- **Returns:** list[InstrumentId]

#### handle_event(self, Event event) → void

Handle the given event.

If state is `RUNNING` then passes to on_event.

- **Parameters:** **event** ([_Event_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Event)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### manage_contingent_orders

If contingent orders should be managed automatically by the strategy.

- **Returns:** bool

#### manage_gtd_expiry

If all order GTD time in force expirations should be managed automatically by the strategy.

- **Returns:** bool

#### modify_order(self, Order order, Quantity quantity=None, Price price=None, Price trigger_price=None, ClientId client_id=None, dict params=None) → void

Modify the given order with optional parameters and routing instructions.

An ModifyOrder command will be created and then sent to **either** the OrderEmulator or the RiskEngine (depending on whether the order is emulated).

At least one value must differ from the original order for the command to be valid.

Will use an Order Cancel/Replace Request (a.k.a Order Modification) for FIX protocols, otherwise if order update is not available for the API, then will cancel and replace with a new order using the original ClientOrderId.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to update.
  - **quantity** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity) _,_ ​*optional*​) – The updated quantity for the given order.
  - **price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price) _,_ ​*optional*​) – The updated price for the given order (if applicable).
  - **trigger_price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price) _,_ ​*optional*​) – The updated trigger price for the given order (if applicable).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:**
  - **ValueError** – If price is not `None` and order does not have a price.
  - **ValueError** – If trigger is not `None` and order does not have a trigger_price.

#### WARNING

If the order is already closed or at PENDING_CANCEL status then the command will not be generated, and a warning will be logged.

#### oms_type

The order management system for the strategy.

- **Returns:** OmsType

#### on_order_accepted(self, OrderAccepted event) → void

Actions to be performed when running and receives an order accepted event.

- **Parameters:** **event** ([_OrderAccepted_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderAccepted)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_cancel_rejected(self, OrderCancelRejected event) → void

Actions to be performed when running and receives an order cancel rejected event.

- **Parameters:** **event** ([_OrderCancelRejected_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderCancelRejected)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_canceled(self, OrderCanceled event) → void

Actions to be performed when running and receives an order canceled event.

- **Parameters:** **event** ([_OrderCanceled_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderCanceled)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_denied(self, OrderDenied event) → void

Actions to be performed when running and receives an order denied event.

- **Parameters:** **event** ([_OrderDenied_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderDenied)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_emulated(self, OrderEmulated event) → void

Actions to be performed when running and receives an order emulated event.

- **Parameters:** **event** ([_OrderEmulated_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderEmulated)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_event(self, OrderEvent event) → void

Actions to be performed when running and receives an order event.

- **Parameters:** **event** ([_OrderEvent_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderEvent)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_expired(self, OrderExpired event) → void

Actions to be performed when running and receives an order expired event.

- **Parameters:** **event** ([_OrderExpired_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderExpired)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_filled(self, OrderFilled event) → void

Actions to be performed when running and receives an order filled event.

- **Parameters:** **event** ([_OrderFilled_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderFilled)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_initialized(self, OrderInitialized event) → void

Actions to be performed when running and receives an order initialized event.

- **Parameters:** **event** ([_OrderInitialized_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderInitialized)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_modify_rejected(self, OrderModifyRejected event) → void

Actions to be performed when running and receives an order modify rejected event.

- **Parameters:** **event** ([_OrderModifyRejected_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderModifyRejected)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_pending_cancel(self, OrderPendingCancel event) → void

Actions to be performed when running and receives an order pending cancel event.

- **Parameters:** **event** ([_OrderPendingCancel_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderPendingCancel)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_pending_update(self, OrderPendingUpdate event) → void

Actions to be performed when running and receives an order pending update event.

- **Parameters:** **event** ([_OrderPendingUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderPendingUpdate)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_rejected(self, OrderRejected event) → void

Actions to be performed when running and receives an order rejected event.

- **Parameters:** **event** ([_OrderRejected_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderRejected)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_released(self, OrderReleased event) → void

Actions to be performed when running and receives an order released event.

- **Parameters:** **event** ([_OrderReleased_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderReleased)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_submitted(self, OrderSubmitted event) → void

Actions to be performed when running and receives an order submitted event.

- **Parameters:** **event** ([_OrderSubmitted_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderSubmitted)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_triggered(self, OrderTriggered event) → void

Actions to be performed when running and receives an order triggered event.

- **Parameters:** **event** ([_OrderTriggered_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderTriggered)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_updated(self, OrderUpdated event) → void

Actions to be performed when running and receives an order updated event.

- **Parameters:** **event** ([_OrderUpdated_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderUpdated)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_changed(self, PositionChanged event) → void

Actions to be performed when running and receives a position changed event.

- **Parameters:** **event** ([_PositionChanged_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionChanged)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_closed(self, PositionClosed event) → void

Actions to be performed when running and receives a position closed event.

- **Parameters:** **event** ([_PositionClosed_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionClosed)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_event(self, PositionEvent event) → void

Actions to be performed when running and receives a position event.

- **Parameters:** **event** ([_PositionEvent_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionEvent)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_opened(self, PositionOpened event) → void

Actions to be performed when running and receives a position opened event.

- **Parameters:** **event** ([_PositionOpened_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionOpened)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_reset(self) → void

#### on_resume(self) → void

#### on_start(self) → void

#### on_stop(self) → void

#### order_factory

The order factory for the strategy.

- **Returns:** OrderFactory

#### order_id_tag

The order ID tag for the strategy.

- **Returns:** str

#### query_account(self, AccountId account_id, ClientId client_id=None, dict params=None) → void

Query the account with optional routing instructions.

A QueryAccount command will be created and then sent to the ExecutionEngine.

- **Parameters:**
  - **account_id** ([_AccountId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.AccountId)) – The account to query.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### query_order(self, Order order, ClientId client_id=None, dict params=None) → void

Query the given order with optional routing instructions.

A QueryOrder command will be created and then sent to the ExecutionEngine.

Logs an error if no VenueOrderId has been assigned to the order.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to query.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### register(self, TraderId trader_id, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, Clock clock) → void

Register the strategy with a trader.

- **Parameters:**
  - **trader_id** ([_TraderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.TraderId)) – The trader ID for the strategy.
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the strategy.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the strategy.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the strategy.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the strategy.

#### WARNING

System method (not intended to be called by user code).

#### submit_order(self, Order order, PositionId position_id=None, ClientId client_id=None, dict params=None) → void

Submit the given order with optional position ID, execution algorithm and routing instructions.

A SubmitOrder command will be created and sent to **either** an ExecAlgorithm, the OrderEmulator or the RiskEngine (depending whether the order is emulated and/or has an exec_algorithm_id specified).

If the client order ID is duplicate, then the order will be denied.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to submit.
  - **position_id** ([_PositionId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.PositionId) _,_ ​*optional*​) – The position ID to submit the order against. If a position does not yet exist, then any position opened will have this identifier assigned.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific execution client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:** **ValueError** – If order.status is not `INITIALIZED`.

#### WARNING

If a position_id is passed and a position does not yet exist, then any position opened by the order will have this position ID assigned. This may not be what you intended.

#### submit_order_list(self, OrderList order_list, PositionId position_id=None, ClientId client_id=None, dict params=None) → void

Submit the given order list with optional position ID, execution algorithm and routing instructions.

A SubmitOrderList command will be created and sent to **either** the OrderEmulator, or the RiskEngine (depending whether an order is emulated).

If the order list ID is duplicate, or any client order ID is duplicate, then all orders will be denied.

- **Parameters:**
  - **order_list** ([_OrderList_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.OrderList)) – The order list to submit.
  - **position_id** ([_PositionId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.PositionId) _,_ ​*optional*​) – The position ID to submit the order against. If a position does not yet exist, then any position opened will have this identifier assigned.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific execution client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:** **ValueError** – If any order.status is not `INITIALIZED`.

#### WARNING

If a position_id is passed and a position does not yet exist, then any position opened by an order will have this position ID assigned. This may not be what you intended.

#### to_importable_config(self) → [ImportableStrategyConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig)

Returns an importable configuration for this strategy.

- **Return type:** [ImportableStrategyConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig)

#### use_hyphens_in_client_order_ids

If hyphens should be used in generated client order ID values.

- **Returns:** bool

#### use_uuid_client_order_ids

If UUID4’s should be used for client order ID values.

- **Returns:** bool

### _class_ Trader

Bases: [`Component`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Component)

Provides a trader for managing a fleet of actors, execution algorithms and trading strategies.

- **Parameters:**
  - **trader_id** ([_TraderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.TraderId)) – The ID for the trader.
  - **instance_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The instance ID for the trader.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the trader.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the trader.
  - **portfolio** ([_Portfolio_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.Portfolio)) – The portfolio for the trader.
  - **data_engine** ([_DataEngine_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.engine.DataEngine)) – The data engine for the trader.
  - **risk_engine** ([_RiskEngine_](https://nautilustrader.io/docs/latest/api_reference/risk#nautilus_trader.risk.engine.RiskEngine)) – The risk engine for the trader.
  - **exec_engine** ([_ExecutionEngine_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.engine.ExecutionEngine)) – The execution engine for the trader.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the trader.
  - **environment** (Environment { `BACKTEST`, `SANDBOX`, `LIVE` }) – The environment context.
  - **has_controller** (_bool_ _,_ ​*default False*​) – If the trader has a controller.
  - **loop** (_asyncio.AbstractEventLoop_ _,_ ​*optional*​) – The event loop for the trader.
- **Raises:**
  - **ValueError** – If portfolio is not equal to the exec_engine portfolio.
  - **ValueError** – If strategies is `None`.
  - **ValueError** – If strategies is empty.
  - **TypeError** – If strategies contains a type other than Strategy.

#### actor_ids() → list[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)]

Return the actor IDs loaded in the trader.

- **Return type:** list[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)]

#### actor_states() → dict[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId), str]

Return the traders actor states.

- **Return type:** dict[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId), str]

#### actors() → list[[Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)]

Return the actors loaded in the trader.

- **Return type:** list[[Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)]

#### add_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Add the given custom component to the trader.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to add and register.
- **Raises:**
  - **ValueError** – If actor.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If actor.id already exists in the trader.

#### add_actors(actors: list[[Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)]) → None

Add the given actors to the trader.

- **Parameters:** **actors** (_list_ \*[\*_TradingStrategies_ ​*]\*​) – The actors to add and register.
- **Raises:** **ValueError** – If actors is `None` or empty.

#### add_exec_algorithm(exec_algorithm: Any) → None

Add the given execution algorithm to the trader.

- **Parameters:** **exec_algorithm** ([_ExecAlgorithm_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.algorithm.ExecAlgorithm)) – The execution algorithm to add and register.
- **Raises:**
  - **KeyError** – If exec_algorithm.id already exists in the trader.
  - **ValueError** – If exec_algorithm.state is `RUNNING` or `DISPOSED`.

#### add_exec_algorithms(exec_algorithms: list[Any]) → None

Add the given execution algorithms to the trader.

- **Parameters:** **exec_algorithms** (_list_ _​[​_[_ExecAlgorithm_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.algorithm.ExecAlgorithm) ​*]*​) – The execution algorithms to add and register.
- **Raises:** **ValueError** – If exec_algorithms is `None` or empty.

#### add_strategies(strategies: list[[Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)]) → None

Add the given trading strategies to the trader.

- **Parameters:** **strategies** (_list_ \*[\*_TradingStrategies_ ​*]\*​) – The trading strategies to add and register.
- **Raises:** **ValueError** – If strategies is `None` or empty.

#### add_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Add the given trading strategy to the trader.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The trading strategy to add and register.
- **Raises:**
  - **ValueError** – If strategy.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If strategy.id already exists in the trader.

#### check_residuals() → None

Check for residual open state such as open orders or open positions.

#### clear_actors() → None

Dispose and clear all actors held by the trader.

- **Raises:** **ValueError** – If state is `RUNNING`.

#### clear_exec_algorithms() → None

Dispose and clear all execution algorithms held by the trader.

- **Raises:** **ValueError** – If state is `RUNNING`.

#### clear_strategies() → None

Dispose and clear all strategies held by the trader.

- **Raises:** **ValueError** – If state is `RUNNING`.

#### exec_algorithm_ids() → list[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId)]

Return the execution algorithm IDs loaded in the trader.

- **Return type:** list[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId)]

#### exec_algorithm_states() → dict[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId), str]

Return the traders execution algorithm states.

- **Return type:** dict[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId), str]

#### exec_algorithms() → list[Any]

Return the execution algorithms loaded in the trader.

- **Return type:** list[ExecAlgorithms]

#### generate_account_report(venue: [Venue](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) → DataFrame

Generate an account report.

- **Return type:** pd.DataFrame

#### generate_fills_report() → DataFrame

Generate a fills report.

- **Return type:** pd.DataFrame

#### generate_order_fills_report() → DataFrame

Generate an order fills report.

- **Return type:** pd.DataFrame

#### generate_orders_report() → DataFrame

Generate an orders report.

- **Return type:** pd.DataFrame

#### generate_positions_report() → DataFrame

Generate a positions report.

- **Return type:** pd.DataFrame

#### _property_ instance*id *: [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.uuid.UUID4)\_

Return the traders instance ID.

- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

#### load() → None

Load all actor and strategy states from the cache.

#### remove_actor(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Remove the actor with the given actor_id.

Will stop the actor first if state is `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The actor ID to remove.
- **Raises:** **ValueError** – If an actor with the given actor_id is not found.

#### remove_strategy(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Remove the strategy with the given strategy_id.

Will stop the strategy first if state is `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID to remove.
- **Raises:** **ValueError** – If a strategy with the given strategy_id is not found.

#### save() → None

Save all actor and strategy states to the cache.

#### start_actor(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Start the actor with the given actor_id.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The component ID to start.
- **Raises:** **ValueError** – If an actor with the given actor_id is not found.

#### start_strategy(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Start the strategy with the given strategy_id.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID to start.
- **Raises:** **ValueError** – If a strategy with the given strategy_id is not found.

#### stop_actor(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Stop the actor with the given actor_id.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The actor ID to stop.
- **Raises:** **ValueError** – If an actor with the given actor_id is not found.

#### stop_strategy(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Stop the strategy with the given strategy_id.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID to stop.
- **Raises:** **ValueError** – If a strategy with the given strategy_id is not found.

#### strategies() → list[[Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)]

Return the strategies loaded in the trader.

- **Return type:** list[[Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)]

#### strategy_ids() → list[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)]

Return the strategy IDs loaded in the trader.

- **Return type:** list[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)]

#### strategy_states() → dict[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId), str]

Return the traders strategy states.

- **Return type:** dict[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId), str]

#### subscribe(topic: str, handler: Callable[[Any], None]) → None

Subscribe to the given message topic with the given callback handler.

- **Parameters:**
  - **topic** (​*str*​) – The topic for the subscription. May include wildcard glob patterns.
  - **handler** (_Callable_ _[_ \*[\*_Any_ _]\* _,_ _None_ ​\_]\*​) – The handler for the subscription.

#### unsubscribe(topic: str, handler: Callable[[Any], None]) → None

Unsubscribe the given handler from the given message topic.

- **Parameters:**
  - **topic** (_str_ _,_ ​*optional*​) – The topic to unsubscribe from. May include wildcard glob patterns.
  - **handler** (_Callable_ _[_ \*[\*_Any_ _]\* _,_ _None_ ​\_]\*​) – The handler for the subscription.

### _class_ Controller

Bases: [`Actor`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)

The base class for all trader controllers.

- **Parameters:**
  - **trader** ([_Trader_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Trader)) – The reference to the trader instance to control.
  - **config** ([_ActorConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ActorConfig) _,_ ​*optional*​) – The configuration for the controller
- **Raises:** **TypeError** – If config is not of type ActorConfig.

#### register_base(self, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, Clock clock) → void

Register with a trader.

- **Parameters:**
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the actor.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the actor.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the actor.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the actor.

#### WARNING

System method (not intended to be called by user code).

#### execute(command: [Command](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.message.Command)) → None

#### create_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor), start: bool = True) → None

Add the given actor to the controlled trader.

- **Parameters:**
  - **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the actor should be started immediately.
- **Raises:**
  - **ValueError** – If actor.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If actor is already registered with the trader.

#### create_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy), start: bool = True) → None

Add the given strategy to the controlled trader.

- **Parameters:**
  - **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the strategy should be started immediately.
- **Raises:**
  - **ValueError** – If strategy.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If strategy is already registered with the trader.

#### start_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Start the given actor.

Will log a warning if the actor is already `RUNNING`.

- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### start_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Start the given strategy.

Will log a warning if the strategy is already `RUNNING`.

- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### stop_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Stop the given actor.

Will log a warning if the actor is not `RUNNING`.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to stop.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### stop_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Stop the given strategy.

Will log a warning if the strategy is not `RUNNING`.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to stop.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### remove_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Remove the given actor.

Will stop the actor first if state is `RUNNING`.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to remove.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### remove_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Remove the given strategy.

Will stop the strategy first if state is `RUNNING`.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The strategy to remove.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### create_actor_from_config(actor_config: [ImportableActorConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig), start: bool = True) → None

Create the actor corresponding to actor_config.

- **Parameters:**
  - **actor_config** ([_ImportableActorConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.common.config.ImportableActorConfig)) – The actor config of the actor to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the actor should be started immediately.
- **Raises:**
  - **ValueError** – If actor.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If actor is already registered with the trader.

#### create_strategy_from_config(strategy_config: [ImportableStrategyConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig), start: bool = True) → None

Create the strategy corresponding to strategy_config.

- **Parameters:**
  - **strategy_config** ([_ImportableStrategyConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig)) – The strategy config of the strategy to add.
  - **start** (_bool_ _,_ ​*default True*​) – If the strategy should be started immediately.
- **Raises:**
  - **ValueError** – If strategy.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If strategy is already registered with the trader.

#### start_actor_from_id(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Start the actor corresponding to actor_id.

Will log a warning if the actor is already `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The ID of the actor to start.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### start_strategy_from_id(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Start the strategy corresponding to strategy_id.

Will log a warning if the strategy is already `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The ID of the strategy to start.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### stop_actor_from_id(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Stop the actor corresponding to actor_id.

Will log a warning if the actor is not `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The ID of the actor to stop.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### stop_strategy_from_id(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Stop the strategy corresponding to strategy_id.

Will log a warning if the strategy is not `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The ID of the strategy to stop.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

#### remove_actor_from_id(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Remove the actor corresponding to actor_id.

Will stop the actor first if state is `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The ID of the actor to remove.
- **Raises:** **ValueError** – If actor is not already registered with the trader.

#### remove_strategy_from_id(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Remove the strategy corresponding to strategy_id.

Will stop the strategy first if state is `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The ID of the strategy to remove.
- **Raises:** **ValueError** – If strategy is not already registered with the trader.

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

### _class_ NewsImpact

Bases: `Enum`

#### NONE _= 1_

#### LOW _= 2_

#### MEDIUM _= 3_

#### HIGH _= 4_

### _class_ NewsEvent

Bases: [`Data`](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.Data)

Represents an economic news event.

- **Parameters:**
  - **impact** ([_NewsImpact_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.filters.NewsImpact)) – The expected impact for the economic news event.
  - **name** (​*str*​) – The name of the economic news event.
  - **currency** ([_Currency_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Currency)) – The currency the economic news event is expected to affect.
  - **ts_event** (​*int*​) – UNIX timestamp (nanoseconds) when the news event occurred.
  - **ts_init** (​*int*​) – UNIX timestamp (nanoseconds) when the data object was initialized.

#### _property_ impact _: [NewsImpact](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.filters.NewsImpact)_

#### _property_ name _: str_

#### _property_ currency _: [Currency](https://nautilustrader.io/docs/latest/api_reference/model/objects#nautilus_trader.model.objects.Currency)_

#### _property_ ts*event *: int\_

int

UNIX timestamp (nanoseconds) when the data event occurred.

- **Return type:** int
- **Type:** Data.ts_event

#### _property_ ts*init *: int\_

int

UNIX timestamp (nanoseconds) when the instance was created.

- **Return type:** int
- **Type:** Data.ts_init

#### _classmethod_ fully_qualified_name(cls) → str

Return the fully qualified name for the Data class.

- **Return type:** str

#### _classmethod_ is_signal(cls, str name='') → bool

Determine if the current class is a signal type, optionally checking for a specific signal name.

- **Parameters:** **name** (_str_ _,_ ​*optional*​) – The specific signal name to check. If name not provided or if an empty string is passed, the method checks whether the class name indicates a general signal type. If name is provided, the method checks if the class name corresponds to that specific signal.
- **Returns:** True if the class name matches the signal type or the specific signal name, otherwise False.
- **Return type:** bool

### _class_ EconomicNewsEventFilter

Bases: `object`

Provides methods to help filter trading strategy rules based on economic news events.

- **Parameters:**
  - **currencies** (_list_ \*[\*_str_ ​*]\*​) – The list of three letter currency codes to filter.
  - **impacts** (_list_ \*[\*_str_ ​*]\*​) – The list of impact levels to filter (‘LOW’, ‘MEDIUM’, ‘HIGH’).
  - **news_data** (​*pd.DataFrame*​) – The economic news data.

#### _property_ unfiltered_data_start

Return the start of the raw data.

- **Return type:** datetime

#### _property_ unfiltered_data_end

Return the end of the raw data.

- **Return type:** datetime

#### _property_ currencies

Return the currencies the data is filtered on.

- **Return type:** list[str]

#### _property_ impacts

Return the news impacts the data is filtered on.

- **Return type:** list[str]

#### next_event(time_now: datetime) → [NewsEvent](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.filters.NewsEvent) | None

Return the next news event matching the filter conditions. Will return None if no news events match the filter conditions.

- **Parameters:** **time_now** (​*datetime*​) – The current time.
- **Returns:** The next news event in the filtered data if any.
- **Return type:** NewsEvent or `None`
- **Raises:**
  - **ValueError** – The time_now < self.unfiltered_data_start.
  - **ValueError** – The time_now > self.unfiltered_data_end.
  - **ValueError** – If time_now is not tz aware UTC.

#### prev_event(time_now: datetime) → [NewsEvent](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.filters.NewsEvent) | None

Return the previous news event matching the initial filter conditions. Will return None if no news events match the filter conditions.

- **Parameters:** **time_now** (​*datetime*​) – The current time.
- **Returns:** The previous news event in the filtered data if any.
- **Return type:** NewsEvent or `None`
- **Raises:**
  - **ValueError** – The time_now < self.unfiltered_data_start.
  - **ValueError** – The time_now > self.unfiltered_data_end.
  - **ValueError** – If time_now is not tz aware UTC.

This module defines a trading strategy class which allows users to implement their own customized trading strategies

A user can inherit from Strategy and optionally override any of the “on” named event methods. The class is not entirely initialized in a stand-alone way, the intended usage is to pass strategies to a Trader so that they can be fully “wired” into the platform. Exceptions will be raised if a Strategy attempts to operate without a managing Trader instance.

### _class_ Strategy

Bases: [`Actor`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)

Strategy(config: StrategyConfig | None = None)

The base class for all trading strategies.

This class allows traders to implement their own customized trading strategies. A trading strategy can configure its own order management system type, which determines how positions are handled by the ExecutionEngine.

Strategy OMS (Order Management System) types: : - `UNSPECIFIED`: No specific type has been configured, will therefore default to the native OMS type for each venue.

- `HEDGING`: A position ID will be assigned for each new position which is opened per instrument.
- `NETTING`: There will only be a single position for the strategy per instrument. The position ID naming convention is {instrument_id}-{strategy_id}.
- **Parameters:** **config** ([_StrategyConfig_](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.StrategyConfig) _,_ ​*optional*​) – The trading strategy configuration.
- **Raises:** **TypeError** – If config is not of type StrategyConfig.

#### WARNING

- This class should not be used directly, but through a concrete subclass.
- Do not call components such as clock and logger in the \_\_init\_\_ prior to registration.

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

#### cancel_all_orders(self, InstrumentId instrument_id, OrderSide order_side=OrderSide.NO_ORDER_SIDE, ClientId client_id=None, dict params=None) → void

Cancel all orders for this strategy for the given instrument ID.

A CancelAllOrders command will be created and then sent to **both** the OrderEmulator and the ExecutionEngine.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument for the orders to cancel.
  - **order_side** (OrderSide, default `NO_ORDER_SIDE` (both sides)) – The side of the orders to cancel.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### cancel_all_tasks(self) → void

Cancel all queued and active tasks.

#### cancel_gtd_expiry(self, Order order) → void

Cancel the managed GTD expiry for the given order.

If there is no current GTD expiry timer, then an error will be logged.

- **Parameters:** **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to cancel the GTD expiry for.

#### cancel_order(self, Order order, ClientId client_id=None, dict params=None) → void

Cancel the given order with optional routing instructions.

A CancelOrder command will be created and then sent to **either** the OrderEmulator or the ExecutionEngine (depending on whether the order is emulated).

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to cancel.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### cancel_orders(self, list orders, ClientId client_id=None, dict params=None) → void

Batch cancel the given list of orders with optional routing instructions.

For each order in the list, a CancelOrder command will be created and added to a BatchCancelOrders command. This command is then sent to the ExecutionEngine.

Logs an error if the orders list contains local/emulated orders.

- **Parameters:**
  - **orders** (_list_ _​[​_[_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order) ​*]*​) – The orders to cancel.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:**
  - **ValueError** – If orders is empty.
  - **TypeError** – If orders contains a type other than Order.

#### cancel_task(self, task_id: [TaskId](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)) → void

Cancel the task with the given task_id (if queued or active).

If the task is not found then a warning is logged.

- **Parameters:** **task_id** ([_TaskId_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.executor.TaskId)) – The task identifier.

#### change_id(self, StrategyId strategy_id) → void

Change the strategies identifier to the given strategy_id.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The new strategy ID to change to.

#### change_order_id_tag(self, str order_id_tag) → void

Change the order identifier tag to the given order_id_tag.

- **Parameters:** **order_id_tag** (​*str*​) – The new order ID tag to change to.

#### clock

The actors clock.

- **Returns:** Clock

#### close_all_positions(self, InstrumentId instrument_id, PositionSide position_side=PositionSide.NO_POSITION_SIDE, ClientId client_id=None, list tags=None, TimeInForce time_in_force=TimeInForce.GTC, bool reduce_only=True, dict params=None) → void

Close all positions for the given instrument ID for this strategy.

- **Parameters:**
  - **instrument_id** ([_InstrumentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.InstrumentId)) – The instrument for the positions to close.
  - **position_side** (PositionSide, default `NO_POSITION_SIDE` (both sides)) – The side of the positions to close.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **tags** (_list_ \*[\*_str_ *]\* _,_ ​*optional*​) – The tags for the market orders closing the positions.
  - **time_in_force** (TimeInForce, default `GTC`) – The time in force for the market orders closing the positions.
  - **reduce_only** (_bool_ _,_ ​*default True*​) – If the market orders to close positions should carry the ‘reduce-only’ execution instruction. Optional, as not all venues support this feature.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### close_position(self, Position position, ClientId client_id=None, list tags=None, TimeInForce time_in_force=TimeInForce.GTC, bool reduce_only=True, dict params=None) → void

Close the given position.

A closing MarketOrder for the position will be created, and then sent to the ExecutionEngine via a SubmitOrder command.

- **Parameters:**
  - **position** ([_Position_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Position)) – The position to close.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **tags** (_list_ \*[\*_str_ *]\* _,_ ​*optional*​) – The tags for the market order closing the position.
  - **time_in_force** (TimeInForce, default `GTC`) – The time in force for the market order closing the position.
  - **reduce_only** (_bool_ _,_ ​*default True*​) – If the market order to close the position should carry the ‘reduce-only’ execution instruction. Optional, as not all venues support this feature.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

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

#### external_order_claims

The external order claims instrument IDs for the strategy.

- **Returns:** list[InstrumentId]

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

#### manage_contingent_orders

If contingent orders should be managed automatically by the strategy.

- **Returns:** bool

#### manage_gtd_expiry

If all order GTD time in force expirations should be managed automatically by the strategy.

- **Returns:** bool

#### modify_order(self, Order order, Quantity quantity=None, Price price=None, Price trigger_price=None, ClientId client_id=None, dict params=None) → void

Modify the given order with optional parameters and routing instructions.

An ModifyOrder command will be created and then sent to **either** the OrderEmulator or the RiskEngine (depending on whether the order is emulated).

At least one value must differ from the original order for the command to be valid.

Will use an Order Cancel/Replace Request (a.k.a Order Modification) for FIX protocols, otherwise if order update is not available for the API, then will cancel and replace with a new order using the original ClientOrderId.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to update.
  - **quantity** ([_Quantity_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Quantity) _,_ ​*optional*​) – The updated quantity for the given order.
  - **price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price) _,_ ​*optional*​) – The updated price for the given order (if applicable).
  - **trigger_price** ([_Price_](https://nautilustrader.io/docs/latest/api_reference/model/#nautilus_trader.model.Price) _,_ ​*optional*​) – The updated trigger price for the given order (if applicable).
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:**
  - **ValueError** – If price is not `None` and order does not have a price.
  - **ValueError** – If trigger is not `None` and order does not have a trigger_price.

#### WARNING

If the order is already closed or at PENDING_CANCEL status then the command will not be generated, and a warning will be logged.

#### msgbus

The message bus for the actor (if registered).

- **Returns:** MessageBus or `None`

#### oms_type

The order management system for the strategy.

- **Returns:** OmsType

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

#### on_order_accepted(self, OrderAccepted event) → void

Actions to be performed when running and receives an order accepted event.

- **Parameters:** **event** ([_OrderAccepted_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderAccepted)) – The event received.

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

#### on_order_cancel_rejected(self, OrderCancelRejected event) → void

Actions to be performed when running and receives an order cancel rejected event.

- **Parameters:** **event** ([_OrderCancelRejected_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderCancelRejected)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_canceled(self, OrderCanceled event) → void

Actions to be performed when running and receives an order canceled event.

- **Parameters:** **event** ([_OrderCanceled_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderCanceled)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_denied(self, OrderDenied event) → void

Actions to be performed when running and receives an order denied event.

- **Parameters:** **event** ([_OrderDenied_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderDenied)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_emulated(self, OrderEmulated event) → void

Actions to be performed when running and receives an order emulated event.

- **Parameters:** **event** ([_OrderEmulated_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderEmulated)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_event(self, OrderEvent event) → void

Actions to be performed when running and receives an order event.

- **Parameters:** **event** ([_OrderEvent_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderEvent)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_expired(self, OrderExpired event) → void

Actions to be performed when running and receives an order expired event.

- **Parameters:** **event** ([_OrderExpired_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderExpired)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_filled(self, OrderFilled event) → void

Actions to be performed when running and receives an order filled event.

- **Parameters:** **event** ([_OrderFilled_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderFilled)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_initialized(self, OrderInitialized event) → void

Actions to be performed when running and receives an order initialized event.

- **Parameters:** **event** ([_OrderInitialized_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderInitialized)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_modify_rejected(self, OrderModifyRejected event) → void

Actions to be performed when running and receives an order modify rejected event.

- **Parameters:** **event** ([_OrderModifyRejected_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderModifyRejected)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_pending_cancel(self, OrderPendingCancel event) → void

Actions to be performed when running and receives an order pending cancel event.

- **Parameters:** **event** ([_OrderPendingCancel_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderPendingCancel)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_pending_update(self, OrderPendingUpdate event) → void

Actions to be performed when running and receives an order pending update event.

- **Parameters:** **event** ([_OrderPendingUpdate_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderPendingUpdate)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_rejected(self, OrderRejected event) → void

Actions to be performed when running and receives an order rejected event.

- **Parameters:** **event** ([_OrderRejected_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderRejected)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_released(self, OrderReleased event) → void

Actions to be performed when running and receives an order released event.

- **Parameters:** **event** ([_OrderReleased_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderReleased)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_submitted(self, OrderSubmitted event) → void

Actions to be performed when running and receives an order submitted event.

- **Parameters:** **event** ([_OrderSubmitted_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderSubmitted)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_triggered(self, OrderTriggered event) → void

Actions to be performed when running and receives an order triggered event.

- **Parameters:** **event** ([_OrderTriggered_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderTriggered)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_order_updated(self, OrderUpdated event) → void

Actions to be performed when running and receives an order updated event.

- **Parameters:** **event** ([_OrderUpdated_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.OrderUpdated)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_changed(self, PositionChanged event) → void

Actions to be performed when running and receives a position changed event.

- **Parameters:** **event** ([_PositionChanged_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionChanged)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_closed(self, PositionClosed event) → void

Actions to be performed when running and receives a position closed event.

- **Parameters:** **event** ([_PositionClosed_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionClosed)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_event(self, PositionEvent event) → void

Actions to be performed when running and receives a position event.

- **Parameters:** **event** ([_PositionEvent_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionEvent)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_position_opened(self, PositionOpened event) → void

Actions to be performed when running and receives a position opened event.

- **Parameters:** **event** ([_PositionOpened_](https://nautilustrader.io/docs/latest/api_reference/model/events#nautilus_trader.model.events.PositionOpened)) – The event received.

#### WARNING

System method (not intended to be called by user code).

#### on_quote_tick(self, QuoteTick tick) → void

Actions to be performed when running and receives a quote tick.

- **Parameters:** **tick** ([_QuoteTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.QuoteTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### on_reset(self) → void

#### on_resume(self) → void

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

#### on_stop(self) → void

#### on_trade_tick(self, TradeTick tick) → void

Actions to be performed when running and receives a trade tick.

- **Parameters:** **tick** ([_TradeTick_](https://nautilustrader.io/docs/latest/api_reference/model/data#nautilus_trader.model.data.TradeTick)) – The tick received.

#### WARNING

System method (not intended to be called by user code).

#### order_factory

The order factory for the strategy.

- **Returns:** OrderFactory

#### order_id_tag

The order ID tag for the strategy.

- **Returns:** str

#### pending_requests(self) → set

Return the request IDs which are currently pending processing.

- **Return type:** set[[UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)]

#### portfolio

The read-only portfolio for the actor.

- **Returns:** PortfolioFacade

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

#### query_account(self, AccountId account_id, ClientId client_id=None, dict params=None) → void

Query the account with optional routing instructions.

A QueryAccount command will be created and then sent to the ExecutionEngine.

- **Parameters:**
  - **account_id** ([_AccountId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.AccountId)) – The account to query.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

#### query_order(self, Order order, ClientId client_id=None, dict params=None) → void

Query the given order with optional routing instructions.

A QueryOrder command will be created and then sent to the ExecutionEngine.

Logs an error if no VenueOrderId has been assigned to the order.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to query.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.

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

#### register(self, TraderId trader_id, PortfolioFacade portfolio, MessageBus msgbus, CacheFacade cache, Clock clock) → void

Register the strategy with a trader.

- **Parameters:**
  - **trader_id** ([_TraderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.TraderId)) – The trader ID for the strategy.
  - **portfolio** ([_PortfolioFacade_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.PortfolioFacade)) – The read-only portfolio for the strategy.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the strategy.
  - **cache** ([_CacheFacade_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.base.CacheFacade)) – The read-only cache for the strategy.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the strategy.

#### WARNING

System method (not intended to be called by user code).

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

#### submit_order(self, Order order, PositionId position_id=None, ClientId client_id=None, dict params=None) → void

Submit the given order with optional position ID, execution algorithm and routing instructions.

A SubmitOrder command will be created and sent to **either** an ExecAlgorithm, the OrderEmulator or the RiskEngine (depending whether the order is emulated and/or has an exec_algorithm_id specified).

If the client order ID is duplicate, then the order will be denied.

- **Parameters:**
  - **order** ([_Order_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.Order)) – The order to submit.
  - **position_id** ([_PositionId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.PositionId) _,_ ​*optional*​) – The position ID to submit the order against. If a position does not yet exist, then any position opened will have this identifier assigned.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific execution client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:** **ValueError** – If order.status is not `INITIALIZED`.

#### WARNING

If a position_id is passed and a position does not yet exist, then any position opened by the order will have this position ID assigned. This may not be what you intended.

#### submit_order_list(self, OrderList order_list, PositionId position_id=None, ClientId client_id=None, dict params=None) → void

Submit the given order list with optional position ID, execution algorithm and routing instructions.

A SubmitOrderList command will be created and sent to **either** the OrderEmulator, or the RiskEngine (depending whether an order is emulated).

If the order list ID is duplicate, or any client order ID is duplicate, then all orders will be denied.

- **Parameters:**
  - **order_list** ([_OrderList_](https://nautilustrader.io/docs/latest/api_reference/model/orders#nautilus_trader.model.orders.OrderList)) – The order list to submit.
  - **position_id** ([_PositionId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.PositionId) _,_ ​*optional*​) – The position ID to submit the order against. If a position does not yet exist, then any position opened will have this identifier assigned.
  - **client_id** ([_ClientId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ClientId) _,_ ​*optional*​) – The specific execution client ID for the command. If `None` then will be inferred from the venue in the instrument ID.
  - **params** (_dict_ \*[\*_str_ _,_ _Any_ *]\* _,_ ​*optional*​) – Additional parameters potentially used by a specific client.
- **Raises:** **ValueError** – If any order.status is not `INITIALIZED`.

#### WARNING

If a position_id is passed and a position does not yet exist, then any position opened by an order will have this position ID assigned. This may not be what you intended.

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

#### to_importable_config(self) → [ImportableStrategyConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig)

Returns an importable configuration for this strategy.

- **Return type:** [ImportableStrategyConfig](https://nautilustrader.io/docs/latest/api_reference/config#nautilus_trader.trading.config.ImportableStrategyConfig)

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

#### use_hyphens_in_client_order_ids

If hyphens should be used in generated client order ID values.

- **Returns:** bool

#### use_uuid_client_order_ids

If UUID4’s should be used for client order ID values.

- **Returns:** bool

The Trader class is intended to manage a fleet of trading strategies within a running instance of the platform.

A running instance could be either a test/backtest or live implementation - the Trader will operate in the same way.

### _class_ Trader

Bases: [`Component`](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Component)

Provides a trader for managing a fleet of actors, execution algorithms and trading strategies.

- **Parameters:**
  - **trader_id** ([_TraderId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.TraderId)) – The ID for the trader.
  - **instance_id** ([_UUID4_](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)) – The instance ID for the trader.
  - **msgbus** ([_MessageBus_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.MessageBus)) – The message bus for the trader.
  - **cache** ([_Cache_](https://nautilustrader.io/docs/latest/api_reference/cache#nautilus_trader.cache.Cache)) – The cache for the trader.
  - **portfolio** ([_Portfolio_](https://nautilustrader.io/docs/latest/api_reference/portfolio#nautilus_trader.portfolio.Portfolio)) – The portfolio for the trader.
  - **data_engine** ([_DataEngine_](https://nautilustrader.io/docs/latest/api_reference/data#nautilus_trader.data.engine.DataEngine)) – The data engine for the trader.
  - **risk_engine** ([_RiskEngine_](https://nautilustrader.io/docs/latest/api_reference/risk#nautilus_trader.risk.engine.RiskEngine)) – The risk engine for the trader.
  - **exec_engine** ([_ExecutionEngine_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.engine.ExecutionEngine)) – The execution engine for the trader.
  - **clock** ([_Clock_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.component.Clock)) – The clock for the trader.
  - **environment** (Environment { `BACKTEST`, `SANDBOX`, `LIVE` }) – The environment context.
  - **has_controller** (_bool_ _,_ ​*default False*​) – If the trader has a controller.
  - **loop** (_asyncio.AbstractEventLoop_ _,_ ​*optional*​) – The event loop for the trader.
- **Raises:**
  - **ValueError** – If portfolio is not equal to the exec_engine portfolio.
  - **ValueError** – If strategies is `None`.
  - **ValueError** – If strategies is empty.
  - **TypeError** – If strategies contains a type other than Strategy.

#### _property_ instance*id *: [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.uuid.UUID4)\_

Return the traders instance ID.

- **Return type:** [UUID4](https://nautilustrader.io/docs/latest/api_reference/core#nautilus_trader.core.UUID4)

#### actors() → list[[Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)]

Return the actors loaded in the trader.

- **Return type:** list[[Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)]

#### strategies() → list[[Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)]

Return the strategies loaded in the trader.

- **Return type:** list[[Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)]

#### exec_algorithms() → list[Any]

Return the execution algorithms loaded in the trader.

- **Return type:** list[ExecAlgorithms]

#### actor_ids() → list[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)]

Return the actor IDs loaded in the trader.

- **Return type:** list[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)]

#### strategy_ids() → list[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)]

Return the strategy IDs loaded in the trader.

- **Return type:** list[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)]

#### exec_algorithm_ids() → list[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId)]

Return the execution algorithm IDs loaded in the trader.

- **Return type:** list[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId)]

#### actor_states() → dict[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId), str]

Return the traders actor states.

- **Return type:** dict[[ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId), str]

#### strategy_states() → dict[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId), str]

Return the traders strategy states.

- **Return type:** dict[[StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId), str]

#### exec_algorithm_states() → dict[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId), str]

Return the traders execution algorithm states.

- **Return type:** dict[[ExecAlgorithmId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ExecAlgorithmId), str]

#### add_actor(actor: [Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) → None

Add the given custom component to the trader.

- **Parameters:** **actor** ([_Actor_](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)) – The actor to add and register.
- **Raises:**
  - **ValueError** – If actor.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If actor.id already exists in the trader.

#### add_actors(actors: list[[Actor](https://nautilustrader.io/docs/latest/api_reference/common#nautilus_trader.common.actor.Actor)]) → None

Add the given actors to the trader.

- **Parameters:** **actors** (_list_ \*[\*_TradingStrategies_ ​*]\*​) – The actors to add and register.
- **Raises:** **ValueError** – If actors is `None` or empty.

#### add_strategy(strategy: [Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)) → None

Add the given trading strategy to the trader.

- **Parameters:** **strategy** ([_Strategy_](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.Strategy)) – The trading strategy to add and register.
- **Raises:**
  - **ValueError** – If strategy.state is `RUNNING` or `DISPOSED`.
  - **RuntimeError** – If strategy.id already exists in the trader.

#### add_strategies(strategies: list[[Strategy](https://nautilustrader.io/docs/latest/api_reference/trading#nautilus_trader.trading.strategy.Strategy)]) → None

Add the given trading strategies to the trader.

- **Parameters:** **strategies** (_list_ \*[\*_TradingStrategies_ ​*]\*​) – The trading strategies to add and register.
- **Raises:** **ValueError** – If strategies is `None` or empty.

#### add_exec_algorithm(exec_algorithm: Any) → None

Add the given execution algorithm to the trader.

- **Parameters:** **exec_algorithm** ([_ExecAlgorithm_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.algorithm.ExecAlgorithm)) – The execution algorithm to add and register.
- **Raises:**
  - **KeyError** – If exec_algorithm.id already exists in the trader.
  - **ValueError** – If exec_algorithm.state is `RUNNING` or `DISPOSED`.

#### add_exec_algorithms(exec_algorithms: list[Any]) → None

Add the given execution algorithms to the trader.

- **Parameters:** **exec_algorithms** (_list_ _​[​_[_ExecAlgorithm_](https://nautilustrader.io/docs/latest/api_reference/execution#nautilus_trader.execution.algorithm.ExecAlgorithm) ​*]*​) – The execution algorithms to add and register.
- **Raises:** **ValueError** – If exec_algorithms is `None` or empty.

#### start_actor(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Start the actor with the given actor_id.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The component ID to start.
- **Raises:** **ValueError** – If an actor with the given actor_id is not found.

#### start_strategy(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Start the strategy with the given strategy_id.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID to start.
- **Raises:** **ValueError** – If a strategy with the given strategy_id is not found.

#### stop_actor(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Stop the actor with the given actor_id.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The actor ID to stop.
- **Raises:** **ValueError** – If an actor with the given actor_id is not found.

#### stop_strategy(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Stop the strategy with the given strategy_id.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID to stop.
- **Raises:** **ValueError** – If a strategy with the given strategy_id is not found.

#### remove_actor(actor_id: [ComponentId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) → None

Remove the actor with the given actor_id.

Will stop the actor first if state is `RUNNING`.

- **Parameters:** **actor_id** ([_ComponentId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.ComponentId)) – The actor ID to remove.
- **Raises:** **ValueError** – If an actor with the given actor_id is not found.

#### remove_strategy(strategy_id: [StrategyId](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) → None

Remove the strategy with the given strategy_id.

Will stop the strategy first if state is `RUNNING`.

- **Parameters:** **strategy_id** ([_StrategyId_](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.StrategyId)) – The strategy ID to remove.
- **Raises:** **ValueError** – If a strategy with the given strategy_id is not found.

#### clear_actors() → None

Dispose and clear all actors held by the trader.

- **Raises:** **ValueError** – If state is `RUNNING`.

#### clear_strategies() → None

Dispose and clear all strategies held by the trader.

- **Raises:** **ValueError** – If state is `RUNNING`.

#### clear_exec_algorithms() → None

Dispose and clear all execution algorithms held by the trader.

- **Raises:** **ValueError** – If state is `RUNNING`.

#### subscribe(topic: str, handler: Callable[[Any], None]) → None

Subscribe to the given message topic with the given callback handler.

- **Parameters:**
  - **topic** (​*str*​) – The topic for the subscription. May include wildcard glob patterns.
  - **handler** (_Callable_ _[_ \*[\*_Any_ _]\* _,_ _None_ ​\_]\*​) – The handler for the subscription.

#### unsubscribe(topic: str, handler: Callable[[Any], None]) → None

Unsubscribe the given handler from the given message topic.

- **Parameters:**
  - **topic** (_str_ _,_ ​*optional*​) – The topic to unsubscribe from. May include wildcard glob patterns.
  - **handler** (_Callable_ _[_ \*[\*_Any_ _]\* _,_ _None_ ​\_]\*​) – The handler for the subscription.

#### save() → None

Save all actor and strategy states to the cache.

#### load() → None

Load all actor and strategy states from the cache.

#### check_residuals() → None

Check for residual open state such as open orders or open positions.

#### generate_orders_report() → DataFrame

Generate an orders report.

- **Return type:** pd.DataFrame

#### generate_order_fills_report() → DataFrame

Generate an order fills report.

- **Return type:** pd.DataFrame

#### generate_fills_report() → DataFrame

Generate a fills report.

- **Return type:** pd.DataFrame

#### generate_positions_report() → DataFrame

Generate a positions report.

- **Return type:** pd.DataFrame

#### generate_account_report(venue: [Venue](https://nautilustrader.io/docs/latest/api_reference/model/identifiers#nautilus_trader.model.identifiers.Venue)) → DataFrame

Generate an account report.

- **Return type:** pd.DataFrame

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

Stop the component.

While executing on_stop() any exception will be logged and reraised, then the component will remain in a `STOPPING` state.

#### WARNING

Do not override.

If the component is not in a valid state from which to execute this method, then the component state will not change, and an error will be logged.

#### trader_id

The trader ID associated with the component.

- **Returns:** TraderId

#### type

The components type.

- **Returns:** type
