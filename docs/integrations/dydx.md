# dYdX

dYdX 是在加密衍生品交易量方面规模较大的去中心化交易所（DEX）之一。dYdX 运行在以太坊链上的智能合约上，允许用户在无需中介的情况下进行交易。本集成支持 dYdX v4 的实时行情数据接入（market data ingestion）和订单执行；dYdX v4 是该协议首个实现完全去中心化、无中心化组件的版本。

## 安装

要安装包含 dYdX 支持的 NautilusTrader：

```bash
pip install --upgrade "nautilus_trader[dydx]"
```

要从源码构建并包含所有可选项（包括 dYdX）：

```bash
uv sync --all-extras
```

## 示例

可在此处找到 dYdX 的实时示例脚本：[examples/live/dydx](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/dydx/)。

## 概览

本指南假设你要同时配置实时行情数据订阅和交易执行。dYdX 适配器由多个组件组成，可根据使用场景单独使用或组合使用：

- `DYDXHttpClient`：低级别 HTTP API 连接。
- `DYDXWebSocketClient`：低级别 WebSocket API 连接。
- `DYDXAccountGRPCAPI`：低级别 gRPC API，用于账户更新。
- `DYDXInstrumentProvider`：合约/品种解析与加载功能。
- `DYDXDataClient`：行情数据订阅管理器（market data feed manager）。
- `DYDXExecutionClient`：账户管理与订单执行网关（execution gateway）。
- `DYDXLiveDataClientFactory`：dYdX 数据客户端的工厂（用于 trading node builder）。
- `DYDXLiveExecClientFactory`：dYdX 执行客户端的工厂（用于 trading node builder）。

:::note
大多数用户只需要为实时交易节点（live trading node）定义配置（如下示例），不必直接使用这些低级组件。
:::

:::warning 首次激活账户
dYdX v4 的交易账户（子账户 sub-account 0）只有在钱包首次入金或发生交易之后才会被链上创建。在此之前，任何 gRPC/Indexer 查询都会返回 `NOT_FOUND`，导致 `DYDXExecutionClient.connect()` 连接失败。

**操作建议 →** 在启动实时 `TradingNode` 之前，请从相同钱包在相同网络（主网或测试网）中存入任意正额 USDC（≥ 1 wei）或其他支持的抵押品。交易在被区块确认后（几块区块后）重启节点，客户端即可正常连接。
:::

## 故障排查（Troubleshooting）

### `StatusCode.NOT_FOUND` — account … /0 not found

原因：该钱包/子账户从未被注资，因此尚未在链上创建。

解决方法：

1. 在正确的网络上向子账户 0 存入任意正额的 USDC。
2. 等待链上最终确认（主网约需 ~30 秒，测试网可能更久）。
3. 重启 `TradingNode`，连接应能成功建立。

:::tip
在无人值守的部署场景中，可将 `connect()` 调用包装在指数退避（exponential-backoff）重试循环中，直到存款确认后重连成功。
:::

## 合约符号（Symbology）

dYdX 目前只提供永续合约（perpetual contracts）。为了与其它适配器保持一致，并在将来若 dYdX 出现其它产品时具备向后兼容性，NautilusTrader 会在所有永续合约的符号后添加 `-PERP`。例如，Bitcoin/USD-C 的永续期货合约标识为 `BTC-USD-PERP`。平台中所有市场的计价货币为 USD-C，因此在显示时常被简写为 USD。

## 短期订单与长期订单

dYdX 区分短期订单（short-term orders）与长期/有状态订单（long-term / stateful orders）。短期订单设计为立即下单，并期望在接收订单的同一区块内被处理。此类订单会在内存中保留最多 20 个区块，只有其成交量（fill amount）与到期区块高度会被提交到链上状态。短期订单主要面向高吞吐量的做市商或市价单场景。

默认情况下，所有订单都会以短期订单发送。若需构建长期订单，可通过在订单上附加标签（tag）来实现，例如：

```python
from nautilus_trader.adapters.dydx import DYDXOrderTags

order: LimitOrder = self.order_factory.limit(
    instrument_id=self.instrument_id,
    order_side=OrderSide.BUY,
    quantity=self.instrument.make_qty(self.trade_size),
    price=self.instrument.make_price(price),
    time_in_force=TimeInForce.GTD,
    expire_time=self.clock.utc_now() + pd.Timedelta(minutes=10),
    post_only=True,
    emulation_trigger=self.emulation_trigger,
    tags=[DYDXOrderTags(is_short_term_order=False).value],
)
```

若要指定订单在链上保持活动的区块数，可以这样设置：

```python
from nautilus_trader.adapters.dydx import DYDXOrderTags

order: LimitOrder = self.order_factory.limit(
    instrument_id=self.instrument_id,
    order_side=OrderSide.BUY,
    quantity=self.instrument.make_qty(self.trade_size),
    price=self.instrument.make_price(price),
    time_in_force=TimeInForce.GTD,
    expire_time=self.clock.utc_now() + pd.Timedelta(seconds=5),
    post_only=True,
    emulation_trigger=self.emulation_trigger,
    tags=[DYDXOrderTags(is_short_term_order=True, num_blocks_open=5).value],
)
```

## 市价单（Market orders）

在 dYdX 中，市价单需要指定一个价格以作为滑点保护（slippage protection），且会使用隐藏单（hidden orders）。通过为市价单设置价格，你可以限制潜在的滑点。例如：如果为买入市价单指定价格 $100，则仅当市场价格小于等于 $100 时该单才可能被成交；若市场价格高于 $100，则不会执行该订单。

包括 dYdX 在内的一些交易所支持隐藏单：隐藏单对其它市场参与者不可见，但仍可被撮合成交。为市价单指定价格，可将其作为隐藏单，只有当市场价格达到指定价格时才会执行。

若未指定市场价格（market_order_price），默认值为 0。

创建市价单并指定价格的示例：

```python
order = self.order_factory.market(
    instrument_id=self.instrument_id,
    order_side=OrderSide.BUY,
    quantity=self.instrument.make_qty(self.trade_size),
    time_in_force=TimeInForce.IOC,
    tags=[DYDXOrderTags(is_short_term_order=True, market_order_price=Price.from_str("10_000")).value],
)
```

## 止损限价与止损市价（Stop limit / Stop market）

支持提交止损限价和止损市价等条件性订单。对于条件性订单，dYdX 仅支持以长期订单（long-term orders）方式提交。

## 订单能力概览

dYdX 对永续合约交易提供了较为完备的订单类型与执行特性，下面按类别列出支持情况：

### 订单类型（Order Types）

| Order Type             | Perpetuals | 说明                                   |
|------------------------|------------|----------------------------------------|
| `MARKET`               | ✓          | 需提供价格以防止滑点；不支持按计价货币下单（quote quantity）。 |
| `LIMIT`                | ✓          |                                        |
| `STOP_MARKET`          | ✓          | 仅支持以长期订单方式提交。             |
| `STOP_LIMIT`           | ✓          | 仅支持以长期订单方式提交。             |
| `MARKET_IF_TOUCHED`    | -          | *不支持*。                             |
| `LIMIT_IF_TOUCHED`     | -          | *不支持*。                             |
| `TRAILING_STOP_MARKET` | -          | *不支持*。                             |

### 执行指令（Execution Instructions）

| Instruction   | Perpetuals | 说明                          |
|---------------|------------|-------------------------------|
| `post_only`   | ✓          | 支持所有订单类型。            |
| `reduce_only` | ✓          | 支持所有订单类型。            |

### 有效期类型（Time in force）

| Time in force| Perpetuals | 说明                |
|--------------|------------|---------------------|
| `GTC`        | ✓          | Good Till Canceled。 |
| `GTD`        | ✓          | Good Till Date。     |
| `FOK`        | ✓          | Fill or Kill。       |
| `IOC`        | ✓          | Immediate or Cancel。|

### 高级订单功能（Advanced Order Features）

| Feature            | Perpetuals | 说明                                         |
|--------------------|------------|----------------------------------------------|
| Order Modification | ✓          | 仅限短期订单；使用取消-替换（cancel-replace）。|
| Bracket/OCO Orders | -          | *不支持*。                                    |
| Iceberg Orders     | -          | *不支持*。                                    |

### 批量操作（Batch operations）

| Operation          | Perpetuals | 说明                                         |
|--------------------|------------|----------------------------------------------|
| Batch Submit       | -          | *不支持*。                                    |
| Batch Modify       | -          | *不支持*。                                    |
| Batch Cancel       | -          | *不支持*。                                    |

### 持仓管理（Position management）

| Feature              | Perpetuals | 说明                                         |
|--------------------|------------|----------------------------------------------|
| Query positions     | ✓          | 实时持仓查询。                               |
| Position mode       | -          | 仅支持净头寸模式（net position）。           |
| Leverage control    | ✓          | 可对每个市场设置杠杆。                       |
| Margin mode         | -          | 仅支持全仓（cross margin）。                 |

### 订单查询（Order querying）

| Feature              | Perpetuals | 说明                                         |
|----------------------|------------|----------------------------------------------|
| Query open orders    | ✓          | 列出所有活动订单。                           |
| Query order history  | ✓          | 历史订单数据。                               |
| Order status updates | ✓          | 实时订单状态变更。                           |
| Trade history        | ✓          | 成交与回执报告。                             |

### 组合/条件性订单（Contingent orders）

| Feature             | Perpetuals | 说明                                         |
|---------------------|------------|----------------------------------------------|
| Order lists         | -          | *不支持*。                                    |
| OCO orders          | -          | *不支持*。                                    |
| Bracket orders      | -          | *不支持*。                                    |
| Conditional orders  | ✓          | 支持止损市价（stop market）与止损限价（stop limit）。 |

### Order classification

dYdX 将订单分为 **短期订单（short-term）** 与 **长期订单（long-term）**：

- **短期订单**：所有订单的默认类型；适用于高频交易和市价单。
- **长期订单**：条件性订单需以长期订单方式提交；可使用 `DYDXOrderTags` 指定。

## 配置（Configuration）

各客户端的产品类型需在配置中明确指定。

### 数据客户端配置选项（Data client configuration options）

| Option                           | Default | 说明 |
|----------------------------------|---------|------|
| `wallet_address`                 | `None`  | 钱包地址；若省略会从环境变量 `DYDX_WALLET_ADDRESS` / `DYDX_TESTNET_WALLET_ADDRESS` 加载。 |
| `is_testnet`                     | `False` | 为 `True` 时连接 dYdX 测试网。 |
| `update_instruments_interval_mins` | `60`  | instrument 目录刷新间隔（分钟）。 |
| `max_retries`                    | `None`  | REST/WebSocket 恢复重试的最大次数。 |
| `retry_delay_initial_ms`         | `None`  | 重试初始延迟（毫秒）。 |
| `retry_delay_max_ms`             | `None`  | 重试最大延迟（毫秒）。 |

### 执行客户端配置选项（Execution client configuration options）

| Option                   | Default | 说明 |
|--------------------------|---------|------|
| `wallet_address`         | `None`  | 钱包地址；若省略会从环境变量 `DYDX_WALLET_ADDRESS` / `DYDX_TESTNET_WALLET_ADDRESS` 加载。 |
| `subaccount`             | `0`     | 子账户编号（dYdX 默认为子账户 `0`）。 |
| `mnemonic`               | `None`  | 用于派生签名密钥的助记词；若省略将从环境中加载。 |
| `base_url_http`          | `None`  | REST 基地址重写。 |
| `base_url_ws`            | `None`  | WebSocket 基地址重写。 |
| `is_testnet`             | `False` | 为 `True` 时连接 dYdX 测试网。 |
| `max_retries`            | `None`  | 订单提交/取消/修改调用的最大重试次数。 |
| `retry_delay_initial_ms` | `None`  | 重试初始延迟（毫秒）。 |
| `retry_delay_max_ms`     | `None`  | 重试最大延迟（毫秒）。 |

### Execution clients

账户类型必须为保证金账户（margin account）才能交易永续合约。

最常见的用例是将 dYdX 的数据客户端与执行客户端一并配置到实时 `TradingNode` 中。为此，请在你的客户端配置中添加一个 `DYDX` 部分，例如：

```python
from nautilus_trader.live.node import TradingNode

config = TradingNodeConfig(
    ...,  # Omitted
    data_clients={
        "DYDX": {
            "wallet_address": "YOUR_DYDX_WALLET_ADDRESS",
            "is_testnet": False,
        },
    },
    exec_clients={
        "DYDX": {
            "wallet_address": "YOUR_DYDX_WALLET_ADDRESS",
            "subaccount": "YOUR_DYDX_SUBACCOUNT_NUMBER"
            "mnemonic": "YOUR_MNEMONIC",
            "is_testnet": False,
        },
    },
)
```

然后创建一个 `TradingNode` 并注册相应的客户端工厂：

```python
from nautilus_trader.adapters.dydx import DYDXLiveDataClientFactory
from nautilus_trader.adapters.dydx import DYDXLiveExecClientFactory
from nautilus_trader.live.node import TradingNode

# 使用配置实例化实时交易节点
node = TradingNode(config=config)

# 向节点注册客户端工厂
node.add_data_client_factory("DYDX", DYDXLiveDataClientFactory)
node.add_exec_client_factory("DYDX", DYDXLiveExecClientFactory)

# 最后构建节点
node.build()
```

### API 凭证（API credentials）

为 dYdX 客户端提供凭证有两种方式：要么在配置对象中直接传入 `wallet_address` 与 `mnemonic`，要么设置相应的环境变量：

对于 dYdX 实盘客户端（live clients），可设置：

- `DYDX_WALLET_ADDRESS`
- `DYDX_MNEMONIC`

对于 dYdX 测试网客户端（testnet clients），可设置：

- `DYDX_TESTNET_WALLET_ADDRESS`
- `DYDX_TESTNET_MNEMONIC`

:::tip
建议使用环境变量来管理凭证。这样更安全，也便于在不同环境间切换。
:::

数据客户端会使用钱包地址来确定交易费用（trading fees），这些费用信息仅在回测时使用。

### 测试网（Testnets）

也可以将数据客户端或执行客户端配置为连接 dYdX 测试网。只需将 `is_testnet` 选项设为 `True`（默认值为 `False`）：

```python
config = TradingNodeConfig(
    ...,  # Omitted
    data_clients={
        "DYDX": {
            "wallet_address": "YOUR_DYDX_WALLET_ADDRESS",
            "is_testnet": True,
        },
    },
    exec_clients={
        "DYDX": {
            "wallet_address": "YOUR_DYDX_WALLET_ADDRESS",
            "subaccount": "YOUR_DYDX_SUBACCOUNT_NUMBER"
            "mnemonic": "YOUR_MNEMONIC",
            "is_testnet": True,
        },
    },
)
```

### 解析器警告（Parser warnings）

某些 dYdX 的合约在解析为 Nautilus 对象时可能因字段值过大而超出平台处理范围。遇到此类情况时，会采用“警告并跳过”（warn and continue）的策略，该合约将不会被加入可用合约列表。

## 市场深度（Order books）

根据订阅类型，order book 可维护为全深度（full depth）或仅顶级盘口（top-of-book）。交易所不直接推送聚合的 quote，适配器会订阅 order book 的增量（deltas），并在顶级盘口价格或数量变动时向 `DataEngine` 发送新的报价。

:::info
如需了解更多功能或贡献 dYdX 适配器，请参阅我们的[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
