# 适配器

NautilusTrader 的设计通过适配器（adapter）实现与数据提供者或交易场所（venues）的集成。相关实现位于顶级子包 `adapters` 中。

一个集成适配器通常由下列主要组件组成：

- `HttpClient`
- `WebSocketClient`
- `InstrumentProvider`
- `DataClient`
- `ExecutionClient`

## 合约/品种提供器（Instrument providers）

顾名思义，InstrumentProvider 负责解析发布方或交易所的原始 API，并实例化 Nautilus 的 `Instrument` 对象。

从 `InstrumentProvider` 获取到的 instrument 的使用场景通常为：

- 独立使用以发现某个集成支持的 instruments，用于研究或回测（research/backtesting）
- 在 `sandbox` 或 `live` [environment context](architecture.md#environment-contexts) 中被 actor/strategy 消费

### 研究与回测

下面示例展示如何在 Binance Futures Testnet 上发现当前可用的 instruments：

```python
import asyncio
import os

from nautilus_trader.adapters.binance.common.enums import BinanceAccountType
from nautilus_trader.adapters.binance import get_cached_binance_http_client
from nautilus_trader.adapters.binance.futures.providers import BinanceFuturesInstrumentProvider
from nautilus_trader.common.component import LiveClock


clock = LiveClock()
account_type = BinanceAccountType.USDT_FUTURES

client = get_cached_binance_http_client(
    loop=asyncio.get_event_loop(),
    clock=clock,
    account_type=account_type,
    key=os.getenv("BINANCE_FUTURES_TESTNET_API_KEY"),
    secret=os.getenv("BINANCE_FUTURES_TESTNET_API_SECRET"),
    is_testnet=True,
)
await client.connect()

provider = BinanceFuturesInstrumentProvider(
    client=client,
    account_type=BinanceAccountType.USDT_FUTURES,
)

await provider.load_all_async()
```

### 实盘交易（Live trading）

每个集成的实现细节不同。在 `TradingNode` 中配置 `InstrumentProvider` 用于实盘时，通常有两种行为选项：

- 启动时自动加载所有 instruments：

```python
from nautilus_trader.config import InstrumentProviderConfig

InstrumentProviderConfig(load_all=True)
```

- 或仅加载配置中明确列出的那些 instruments：

```python
InstrumentProviderConfig(load_ids=["BTCUSDT-PERP.BINANCE", "ETHUSDT-PERP.BINANCE"])
```

## 数据客户端（Data clients）

### 请求（Requests）

`Actor` 或 `Strategy` 可以通过发送 `DataRequest` 向 `DataClient` 请求自定义数据。如果接收该 `DataRequest` 的客户端实现了相应的处理器，就会把数据返回给 `Actor` 或 `Strategy`。

#### 示例

一个常见例子是请求某个 `Instrument` 的信息，`Actor` 类实现了相应的方法（下方为摘录）。任意 `Actor` 或 `Strategy` 都可以通过 `InstrumentId` 调用 `request_instrument`，向 `DataClient` 请求该 instrument。

在这个例子中，`Actor` 实现了一个独立的方法 `request_instrument`。类似的 `DataRequest` 也可以在 actor/strategy 的任意位置被创建并调用。

下面是 actor/strategy 中 `request_instrument` 的简化版本：

```python
# nautilus_trader/common/actor.pyx

cpdef void request_instrument(self, InstrumentId instrument_id, ClientId client_id=None):
    """
    请求给定 instrument ID 的 `Instrument` 数据。

    Parameters
    ----------
    instrument_id : InstrumentId
        请求的 instrument ID。
    client_id : ClientId, optional
        指定用于该命令的 client ID。
        如果为 ``None``，则会从 instrument ID 中的 venue 推断出默认 client。
    """
    Condition.not_none(instrument_id, "instrument_id")

    cdef RequestInstrument request = RequestInstrument(
        instrument_id=instrument_id,
        start=None,
        end=None,
        client_id=client_id,
        venue=instrument_id.venue,
        callback=self._handle_instrument_response,
        request_id=UUID4(),
        ts_init=self._clock.timestamp_ns(),
        params=None,
    )

    self._send_data_req(request)
```

下面是一个由 `LiveMarketDataClient` 实现的请求处理器的简化示例，负责获取数据并返回给 actor/strategy：

```python
# nautilus_trader/live/data_client.py

def request_instrument(self, request: RequestInstrument) -> None:
    self.create_task(self._request_instrument(request))

# nautilus_trader/adapters/binance/data.py

async def _request_instrument(self, request: RequestInstrument) -> None:
    instrument: Instrument | None = self._instrument_provider.find(request.instrument_id)

    if instrument is None:
        self._log.error(f"Cannot find instrument for {request.instrument_id}")
        return

    self._handle_instrument(instrument, request.id, request.params)
```

`DataEngine` 是 Nautilus 中的核心组件之一，它把请求与具体的 `DataClient` 关联起来。
下面是处理 instrument 请求的简化示例：

```python
# nautilus_trader/data/engine.pyx

self._msgbus.register(endpoint="DataEngine.request", handler=self.request)

cpdef void request(self, RequestData request):
    self._handle_request(request)

cpdef void _handle_request(self, RequestData request):
    cdef DataClient client = self._clients.get(request.client_id)

    if client is None:
        client = self._routing_map.get(request.venue, self._default_client)

    if isinstance(request, RequestInstrument):
        self._handle_request_instrument(client, request)

cpdef void _handle_request_instrument(self, DataClient client, RequestInstrument request):
    client.request_instrument(request)
```
