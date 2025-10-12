# Interactive Brokers

Interactive Brokers（IB）是一个覆盖广泛金融工具的交易平台，包括股票、期权、期货、外汇、债券、基金和加密货币。NautilusTrader 提供了一个适配器，通过其 Python 库 `ibapi`（[https://github.com/nautechsystems/ibapi](https://github.com/nautechsystems/ibapi)）调用 Trader Workstation（TWS）API（[https://ibkrcampus.com/ibkr-api-page/trader-workstation-api/](https://ibkrcampus.com/ibkr-api-page/trader-workstation-api/)）来与 IB 集成。

TWS API 用于连接 IB 的独立交易应用程序：TWS 和 IB Gateway。两者均可从 IB 官网下载。如果你尚未安装 TWS 或 IB Gateway，请参阅「初始设置」指南（[https://ibkrcampus.com/ibkr-api-page/trader-workstation-api/#tws-download](https://ibkrcampus.com/ibkr-api-page/trader-workstation-api/#tws-download)）。在 NautilusTrader 中，你可以通过 `InteractiveBrokersClient` 与其中任一应用建立连接。

另一种选择是使用 IB Gateway 的 Docker 化版本（[https://github.com/gnzsnz/ib-gateway-docker](https://github.com/gnzsnz/ib-gateway-docker)），这对在云端自动化部署交易策略尤为方便。该方案要求本机安装 Docker（[https://www.docker.com/](https://www.docker.com/)）以及 Python 的 `docker` 包（[https://pypi.org/project/docker/](https://pypi.org/project/docker/)），NautilusTrader 已把该包作为可选 extras 一并提供。

:::note
独立版的 TWS 与 IB Gateway 在启动时需要手动输入用户名、密码及交易模式（live 或 paper）。Docker 化的 IB Gateway 则可通过程序化方式完成这些步骤，无需人工干预。
:::

## 安装

要安装包含 Interactive Brokers（以及 Docker）支持的 NautilusTrader：

```bash
pip install --upgrade "nautilus_trader[ib,docker]"
```

如果从源码构建并希望安装全部可选项（包括 IB 与 Docker）：

```bash
uv sync --all-extras
```

:::note
由于 IB 官方未提供 `ibapi` 的 wheel 包，NautilusTrader 在 PyPI 上对其进行了重打包发布（[https://pypi.org/project/nautilus-ibapi/](https://pypi.org/project/nautilus-ibapi/)）。
:::

## 示例

可在仓库中找到实时示例脚本：[https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/interactive_brokers/](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/interactive_brokers/)

## 快速上手

在实现策略之前，请确保已运行 TWS（Trader Workstation）或 IB Gateway。你可以使用个人凭据登录上述任一独立应用，也可以使用 `DockerizedIBGateway` 以编程方式连接。

### 连接方式

主要有两种连接 IB 的方式：

1. 连接到已有的 TWS 或 IB Gateway 实例
2. 使用 Docker 化的 IB Gateway（推荐用于自动化部署）

### 默认端口

根据运行的应用与交易模式不同，IB 使用不同的默认端口：

| 应用       | 模拟交易（Paper） | 实盘交易（Live） |
| ---------- | ----------------- | ---------------- |
| TWS        | 7497              | 7496             |
| IB Gateway | 4002              | 4001             |

### 连接到已有的 Gateway 或 TWS

连接到已有实例时，需要在 `InteractiveBrokersDataClientConfig` 和 `InteractiveBrokersExecClientConfig` 中分别指定 `ibg_host` 与 `ibg_port`：

```python
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersDataClientConfig
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersExecClientConfig

# 针对 TWS 模拟交易的示例（默认端口 7497）
data_config = InteractiveBrokersDataClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,
    ibg_client_id=1,
)

exec_config = InteractiveBrokersExecClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,
    ibg_client_id=1,
    account_id="DU123456",  # 你的模拟交易账户 ID
)
```

### 使用 Docker 化的 IB Gateway

对于自动化部署，推荐使用 Docker 化的 Gateway。在客户端配置中传入 `dockerized_gateway`（`DockerizedIBGatewayConfig` 的实例），因为主机和端口由容器管理，无需再手动设置 `ibg_host`/`ibg_port`：

```python
from nautilus_trader.adapters.interactive_brokers.config import DockerizedIBGatewayConfig
from nautilus_trader.adapters.interactive_brokers.gateway import DockerizedIBGateway

gateway_config = DockerizedIBGatewayConfig(
    username="your_username",  # 或使用环境变量 TWS_USERNAME
    password="your_password",  # 或使用环境变量 TWS_PASSWORD
    trading_mode="paper",      # "paper" 或 "live"
    read_only_api=True,         # 如需下单则设为 False
    timeout=300,                # 启动超时时间（秒）
)

# 首次启动可能需要一些时间
gateway = DockerizedIBGateway(config=gateway_config)
gateway.start()

# 确认是否已登录
print(gateway.is_logged_in(gateway.container))

# 查看容器日志
print(gateway.container.logs())
```

### 环境变量

可通过向 `DockerizedIBGatewayConfig` 传入 `username` 与 `password`，或者设置下列环境变量来提供凭据：

- `TWS_USERNAME`：IB 账户用户名
- `TWS_PASSWORD`：IB 账户密码
- `TWS_ACCOUNT`：IB 账户 ID（作为 `account_id` 的回退值）

### 连接管理

该适配器提供健壮的连接管理功能：

- 自动重连：可通过环境变量 `IB_MAX_CONNECTION_ATTEMPTS` 配置重试次数。
- 连接超时：可通过 `connection_timeout` 参数调整（默认 300 秒）。
- 连接看门狗：监控连接健康并在需要时触发重连。
- 优雅的错误处理：对各种连接场景进行分类处理并提供友好的错误信息。

## 概览

Interactive Brokers 适配器与 IB 的 TWS API 深度集成，主要包含以下几个核心组件：

### 核心组件

- `InteractiveBrokersClient`：核心客户端，基于 `ibapi` 执行 TWS API 请求，负责连接管理、错误处理与 API 交互协调。
- `InteractiveBrokersDataClient`：连接到 Gateway，用于流式接收行情（Quotes、Trades、Bars）等市场数据。
- `InteractiveBrokersExecutionClient`：负责账户信息、订单管理与交易执行。
- `InteractiveBrokersInstrumentProvider`：检索与管理合约/标的定义，支持期权与期货链的加载。
- `HistoricInteractiveBrokersClient`：用于检索历史数据与合约信息，适合回测与研究使用。

### 支持组件

- `DockerizedIBGateway`：管理 Docker 化的 IB Gateway 实例，便于自动化部署。
- 配置类：为各组件提供详细配置项。
- 工厂类：创建并配置客户端实例所需的依赖。

### 支持的资产类别

该适配器支持通过 IB 提供的主要资产类别进行交易：

- 股票类：股票、ETF、以及股票期权
- 固定收益类：债券与债券基金
- 衍生品：期货、期权与权证
- 外汇：现货外汇与远期
- 加密货币：如比特币、以太坊等
- 商品：实物商品与商品期货
- 指数类：指数产品与指数期权

## Interactive Brokers 客户端

`InteractiveBrokersClient` 是 IB 适配器的核心，负责一系列关键职能，包括建立与维护连接、处理 API 错误、执行交易以及获取行情、合约与账户等多类数据。

为便于管理这些职责，`InteractiveBrokersClient` 采用 mixin（混入）架构，将不同职责拆分到若干专门的 mixin 中，从而提高可维护性与清晰度。

### 客户端架构

客户端采用 mixin 架构，每个 mixin 负责 IB API 的一块功能：

#### 连接管理（`InteractiveBrokersClientConnectionMixin`）

- 建立并维护与 TWS/Gateway 的套接字连接。
- 处理连接超时与重连逻辑。
- 管理连接状态与健康监控。
- 支持通过环境变量 `IB_MAX_CONNECTION_ATTEMPTS` 配置重连尝试次数。

#### 错误处理（`InteractiveBrokersClientErrorMixin`）

- 处理所有 API 错误与警告。
- 将错误按类型分类（客户端错误、连通性问题、请求错误等）。
- 针对订阅与请求的特定错误场景进行处理。
- 提供详尽的错误日志与调试信息。

#### 账户管理（`InteractiveBrokersClientAccountMixin`）

- 检索账户信息与余额。
- 管理持仓数据与投资组合更新。
- 处理多账户场景。
- 处理与账户相关的通知。

#### 合约/标的管理（`InteractiveBrokersClientContractMixin`）

- 检索合约详情与规范。
- 处理标的搜索与查找。
- 管理合约验证与校验。
- 支持复杂的标的类型（期权链、期货链等）。

#### 行情数据管理（`InteractiveBrokersClientMarketDataMixin`）

- 处理实时与历史行情数据订阅。
- 处理报价（quotes）、成交（trades）与 K 线（bars）数据。
- 管理行情数据类型设置（实时、延迟、冻结等）。
- 支持逐笔（tick-by-tick）数据与市场深度（market depth）。

#### 订单管理（`InteractiveBrokersClientOrderMixin`）

- 处理订单下单、修改与撤单。
- 处理订单状态更新与成交回报。
- 管理订单校验与错误处理。
- 支持复杂订单类型与条件。

### 主要特性

- 异步操作：所有操作均基于 Python 的 asyncio 异步实现。
- 健壮的错误处理：全面的错误分类与处理机制。
- 连接弹性：可配重试逻辑的自动重连。
- 消息处理：高吞吐场景下的高效消息队列处理。
- 状态管理：对连接、订阅与请求进行准确跟踪。

:::tip
当排查 TWS API 的入站消息问题时，可以从 `InteractiveBrokersClient._process_message` 方法入手，该方法是处理来自 API 的所有消息的主要入口。
:::

## 标识符（Symbology）

`InteractiveBrokersInstrumentProvider` 支持三种构造 `InstrumentId` 的方法，可通过 `InteractiveBrokersInstrumentProviderConfig` 中的 `symbology_method` 枚举来配置。

### 标识符方法

#### 1. 简化标识法（`IB_SIMPLIFIED`） — 默认

当 `symbology_method` 设为 `IB_SIMPLIFIED`（默认）时，系统使用直观且便于阅读的标识规则：

按资产类别的格式规则：

- 外汇（Forex）：`{symbol}/{currency}.{exchange}`
  - 例子：`EUR/USD.IDEALPRO`
- 股票（Stocks）：`{localSymbol}.{primaryExchange}`
  - localSymbol 中的空格会被替换为连字符
  - 例子：`BF-B.NYSE`、`SPY.ARCA`
- 期货（Futures）：`{localSymbol}.{exchange}`
  - 个别合约使用单数字年份
  - 例子：`ESM4.CME`、`CLZ7.NYMEX`
- 连续期货（Continuous Futures）：`{symbol}.{exchange}`
  - 表示前月合约，自动滚动
  - 例子：`ES.CME`、`CL.NYMEX`
- 期货期权（FOP）：`{localSymbol}.{exchange}`
  - 格式：`{symbol}{month}{year} {right}{strike}`
  - 例子：`ESM4 C4200.CME`
- 期权（Options）：`{localSymbol}.{exchange}`
  - localSymbol 中的空格全部移除
  - 例子：`AAPL230217P00155000.SMART`
- 指数（Indices）：`^{localSymbol}.{exchange}`
  - 例子：`^SPX.CBOE`、`^NDX.NASDAQ`
- 债券（Bonds）：`{localSymbol}.{exchange}`
  - 例子：`912828XE8.SMART`
- 加密货币（Cryptocurrencies）：`{symbol}/{currency}.{exchange}`
  - 例子：`BTC/USD.PAXOS`、`ETH/USD.PAXOS`

#### 2. 原始标识法（`IB_RAW`）

将 `symbology_method` 设为 `IB_RAW` 时，会采用与 IB API 字段直接对应的严格解析规则，适用于各种地区与复杂品种：

格式规则：

- 差价合约（CFDs）：`{localSymbol}={secType}.IBCFD`
- 大宗商品（Commodities）：`{localSymbol}={secType}.IBCMDTY`
- 其他类型默认：`{localSymbol}={secType}.{exchange}`

示例：

- `IBUS30=CFD.IBCFD`
- `XAUUSD=CMDTY.IBCMDTY`
- `AAPL=STK.SMART`

此配置可确保标的标识的明确性，适用于简化规则无法正确解析的国际化或非标准标的。

### MIC 交易所代码转换

适配器支持将 IB 的交易所代码转换为市场标识码（MIC），以便统一表示交易场所：

#### `convert_exchange_to_mic_venue`

将此项设为 `True` 时，适配器会自动把 IB 的交易所代码映射为对应的 MIC：

```python
instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    convert_exchange_to_mic_venue=True,  # 启用 MIC 转换
    symbology_method=SymbologyMethod.IB_SIMPLIFIED,
)
```

MIC 转换示例：

- `CME` → `XCME`（芝加哥商品交易所）
- `NASDAQ` → `XNAS`（纳斯达克交易所）
- `NYSE` → `XNYS`（纽约证券交易所）
- `LSE` → `XLON`（伦敦证券交易所）

#### `symbol_to_mic_venue`

若需自定义映射，可使用 `symbol_to_mic_venue` 字典覆盖默认映射：

```python
instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    convert_exchange_to_mic_venue=True,
    symbol_to_mic_venue={
        "ES": "XCME",  # 所有 ES 期货/期权使用 CME 的 MIC
        "SPY": "ARCX", # 针对 SPY 指定 ARCA
    },
)
```

### 支持的合约格式

适配器支持基于 Interactive Brokers 合约规范的多种合约格式：

#### 期货月份代码

- **F** = 一月，**G** = 二月，**H** = 三月，**J** = 四月
- **K** = 五月，**M** = 六月，**N** = 七月，**Q** = 八月
- **U** = 九月，**V** = 十月，**X** = 十一月，**Z** = 十二月

#### 按资产类别支持的交易所

期货交易所（Futures Exchanges）：

- `CME`, `CBOT`, `NYMEX`, `COMEX`, `KCBT`, `MGE`, `NYBOT`, `SNFE`

期权交易所（Options Exchanges）：

- `SMART`（IB 的智能路由）

外汇交易所（Forex Exchanges）：

- `IDEALPRO`（IB 的外汇平台）

加密货币交易所（Cryptocurrency Exchanges）：

- `PAXOS`（IB 的加密货币平台）

CFD/商品交易所（CFD/Commodity Exchanges）：

- `IBCFD`, `IBCMDTY`（IB 的内部路由）

### 如何选择合适的标识方法

- 对大多数场景使用 `IB_SIMPLIFIED`（默认），它能生成清晰且易读的 InstrumentId
- 在处理复杂的国际化合约或简化规则失效时使用 `IB_RAW`
- 若需合规或数据一致性，请启用 `convert_exchange_to_mic_venue` 以获得标准化的 MIC 代码

## 合约（Instruments）与 Contract

在 Interactive Brokers 中，NautilusTrader 的 `Instrument` 对应于 IB 的 Contract（合约）。该适配器处理两类合约表示：

### 合约类型

#### 基础合约（`IBContract`）

- 包含合约的基本识别字段
- 用于合约搜索与基础操作
- 无法直接转换为 NautilusTrader 的 `Instrument`

#### 合约详情（`IBContractDetails`）

- 包含更全面的合约信息，包括：
  - 支持的订单类型
  - 交易时间与日历
  - 保证金要求
  - 价格刻度与乘数
  - 行情权限
- 可转换为 NautilusTrader 的 `Instrument`
- 交易操作通常需要 `IBContractDetails`

### 合约查询

欲查询合约信息，可使用 IB 的 Contract Information Center（[https://pennies.interactivebrokers.com/cstools/contract_info/](https://pennies.interactivebrokers.com/cstools/contract_info/)）。

### 加载合约

加载合约主要有两种方式：

#### 1. 使用 `load_ids`（推荐）

在大多数场景下，使用 `symbology_method=SymbologyMethod.IB_SIMPLIFIED`（默认）搭配 `load_ids` 能得到清晰且直观的标识：

```python
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersInstrumentProviderConfig
from nautilus_trader.adapters.interactive_brokers.config import SymbologyMethod

instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    symbology_method=SymbologyMethod.IB_SIMPLIFIED,
    load_ids=frozenset([
        "EUR/USD.IDEALPRO",    # 外汇
        "SPY.ARCA",            # 股票
        "ESM24.CME",           # 期货（个别合约）
        "BTC/USD.PAXOS",       # 加密货币
        "^SPX.CBOE",           # 指数
    ]),
)
```

#### 2. 使用 `load_contracts`（处理复杂合约）

对于期权链、期货链等复杂场景，可通过传入 `IBContract` 实例到 `load_contracts` 进行加载：

```python
from nautilus_trader.adapters.interactive_brokers.common import IBContract

# 为指定到期日加载期权链
options_chain_expiry = IBContract(
    secType="IND",
    symbol="SPX",
    exchange="CBOE",
    build_options_chain=True,
    lastTradeDateOrContractMonth='20240718',
)

# 按到期日范围加载期权链
options_chain_range = IBContract(
    secType="IND",
    symbol="SPX",
    exchange="CBOE",
    build_options_chain=True,
    min_expiry_days=0,
    max_expiry_days=30,
)

# 加载期货链
futures_chain = IBContract(
    secType="CONTFUT",
    exchange="CME",
    symbol="ES",
    build_futures_chain=True,
)

instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    load_contracts=frozenset([
        options_chain_expiry,
        options_chain_range,
        futures_chain,
    ]),
)
```

### 按资产类别的 `IBContract` 示例

```python
from nautilus_trader.adapters.interactive_brokers.common import IBContract

# 股票
IBContract(secType='STK', exchange='SMART', primaryExchange='ARCA', symbol='SPY')
IBContract(secType='STK', exchange='SMART', primaryExchange='NASDAQ', symbol='AAPL')

# 债券
IBContract(secType='BOND', secIdType='ISIN', secId='US03076KAA60')
IBContract(secType='BOND', secIdType='CUSIP', secId='912828XE8')

# 单张期权
IBContract(secType='OPT', exchange='SMART', symbol='SPY',
           lastTradeDateOrContractMonth='20251219', strike=500, right='C')

# 期权链（加载所有行权价/到期日）
IBContract(secType='STK', exchange='SMART', primaryExchange='ARCA', symbol='SPY',
           build_options_chain=True, min_expiry_days=10, max_expiry_days=60)

# 差价合约（CFD）
IBContract(secType='CFD', symbol='IBUS30')
IBContract(secType='CFD', symbol='DE40EUR', exchange='SMART')

# 单张期货
IBContract(secType='FUT', exchange='CME', symbol='ES',
           lastTradeDateOrContractMonth='20240315')

# 期货链（加载所有到期日）
IBContract(secType='CONTFUT', exchange='CME', symbol='ES', build_futures_chain=True)

# 期货期权（FOP）- 单张
IBContract(secType='FOP', exchange='CME', symbol='ES',
           lastTradeDateOrContractMonth='20240315', strike=4200, right='C')

# 期货期权链（加载所有行权价/到期日）
IBContract(secType='CONTFUT', exchange='CME', symbol='ES',
           build_options_chain=True, min_expiry_days=7, max_expiry_days=60)

# 外汇
IBContract(secType='CASH', exchange='IDEALPRO', symbol='EUR', currency='USD')
IBContract(secType='CASH', exchange='IDEALPRO', symbol='GBP', currency='JPY')

# 加密货币
IBContract(secType='CRYPTO', symbol='BTC', exchange='PAXOS', currency='USD')
IBContract(secType='CRYPTO', symbol='ETH', exchange='PAXOS', currency='USD')

# 指数
IBContract(secType='IND', symbol='SPX', exchange='CBOE')
IBContract(secType='IND', symbol='NDX', exchange='NASDAQ')

# 商品
IBContract(secType='CMDTY', symbol='XAUUSD', exchange='SMART')
```

### 高级配置选项

```python
# 使用自定义交易所的期权链
IBContract(
    secType="STK",
    symbol="AAPL",
    exchange="SMART",
    primaryExchange="NASDAQ",
    build_options_chain=True,
    options_chain_exchange="CBOE",  # 使用 CBOE 而非 SMART 来加载期权
    min_expiry_days=7,
    max_expiry_days=45,
)

# 指定月份的期货链
IBContract(
    secType="CONTFUT",
    exchange="NYMEX",
    symbol="CL",  # 原油
    build_futures_chain=True,
    min_expiry_days=30,
    max_expiry_days=180,
)
```

### 连续期货（Continuous futures）

对于使用 `secType='CONTFUT'` 的连续期货，适配器只使用符号与交易所来生成 InstrumentId：

```python
# 连续期货示例
IBContract(secType='CONTFUT', exchange='CME', symbol='ES')  # → ES.CME
IBContract(secType='CONTFUT', exchange='NYMEX', symbol='CL') # → CL.NYMEX

# 启用 MIC 转换时
instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    convert_exchange_to_mic_venue=True,
)
# 结果为：
# ES.XCME（代替 ES.CME）
# CL.XNYM（代替 CL.NYMEX）
```

连续期货 vs 单张期货：

- 连续（Continuous）：`ES.CME` — 表示前月合约并自动滚动
- 单张（Individual）：`ESM4.CME` — 指定的 2024 年 3 月合约

:::note
在使用 `build_options_chain=True` 或 `build_futures_chain=True` 时，应为基础合约指定 `secType` 与 `symbol`；适配器会在指定的到期范围内自动发现并加载所有相关的衍生合约。
:::

## 期权价差（Option spreads）

Interactive Brokers 通过 BAG 合约支持期权价差（spreads），将多个期权腿组合成一个可交易合约。NautilusTrader 为创建、加载及交易价差提供了完整支持。

### 创建期权价差的 InstrumentId

期权价差可通过 `InstrumentId.new_spread()` 方法创建，该方法将各腿及其比例组合起来：

```python
from nautilus_trader.model.identifiers import InstrumentId

# 创建单个期权腿的 InstrumentId
call_leg = InstrumentId.from_str("SPY C400.SMART")
put_leg = InstrumentId.from_str("SPY P390.SMART")

# 创建 1:1 的看涨价差（买入看涨，卖出看涨）
call_spread_id = InstrumentId.new_spread([
    (call_leg, 1),   # 多头 1 张
    (put_leg, -1),   # 空头 1 张
])

# 创建 1:2 的比例价差
ratio_spread_id = InstrumentId.new_spread([
    (call_leg, 1),   # 多头 1 张
    (put_leg, 2),    # 多头 2 张
])
```

### 动态加载价差

在交易或订阅行情前，必须先请求加载价差合约。可在策略中调用 `request_instrument()` 动态加载价差：

```python
# 在策略的 on_start 方法中
def on_start(self):
    # 请求加载价差合约
    self.request_instrument(spread_id)

def on_instrument(self, instrument):
    # 处理已加载的价差合约
    self.log.info(f"Loaded spread: {instrument.id}")

    # 现在可以订阅行情
    self.subscribe_quote_ticks(instrument.id)

    # 并下单
    order = self.order_factory.market(
        instrument_id=instrument.id,
        order_side=OrderSide.BUY,
        quantity=instrument.make_qty(1),
        time_in_force=TimeInForce.DAY,
    )
    self.submit_order(order)
```

### 价差交易要求

1. 先加载各个腿（Load individual legs first）：确保价差的组成腿都已可用。
2. 请求加载价差合约（Request the spread instrument）：在交易前调用 `request_instrument()`。
3. 订阅行情（Subscribe to market data）：价差加载后再请求报价逐笔数据。
4. 下单（Place orders）：价差可用后可使用任意订单类型进行交易。

## 历史数据与回测

`HistoricInteractiveBrokersClient` 提供了从 Interactive Brokers 获取历史数据的完整方法，适用于回测与研究。

### 支持的数据类型

- K 线（Bar data）：带时间、逐笔与成交量聚合的 OHLCV 数据
- 逐笔（Tick data）：交易逐笔与报价逐笔数据，精度可达微秒
- 合约数据（Instrument data）：完整的合约规格与交易规则

### 历史数据客户端

```python
from nautilus_trader.adapters.interactive_brokers.historical.client import HistoricInteractiveBrokersClient
from ibapi.common import MarketDataTypeEnum

# 初始化客户端
client = HistoricInteractiveBrokersClient(
    host="127.0.0.1",
    port=7497,
    client_id=1,
    market_data_type=MarketDataTypeEnum.DELAYED_FROZEN,  # 若无订阅则使用延迟冻结数据
    log_level="INFO"
)

# 连接到 TWS/Gateway
await client.connect()
```

### 获取合约信息

#### 基本合约检索

```python
from nautilus_trader.adapters.interactive_brokers.common import IBContract

# 定义合约列表
contracts = [
    IBContract(secType="STK", symbol="AAPL", exchange="SMART", primaryExchange="NASDAQ"),
    IBContract(secType="STK", symbol="MSFT", exchange="SMART", primaryExchange="NASDAQ"),
    IBContract(secType="CASH", symbol="EUR", currency="USD", exchange="IDEALPRO"),
]

# 请求合约定义
instruments = await client.request_instruments(contracts=contracts)
```

#### 下载期权链并保存到 Catalog

你可以在策略中使用 `request_instruments` 下载整条期权链，并通过 `update_catalog=True` 将数据保存到 Catalog：

```python
# 在策略的 on_start 方法中
def on_start(self):
    self.request_instruments(
        venue=IB_VENUE,
        update_catalog=True,
        params={
            "update_catalog": True,
            "ib_contracts": (
                # SPY 期权
                {
                    "secType": "STK",
                    "symbol": "SPY",
                    "exchange": "SMART",
                    "primaryExchange": "ARCA",
                    "build_options_chain": True,
                    "min_expiry_days": 7,
                    "max_expiry_days": 30,
                },
                # QQQ 期权
                {
                    "secType": "STK",
                    "symbol": "QQQ",
                    "exchange": "SMART",
                    "primaryExchange": "NASDAQ",
                    "build_options_chain": True,
                    "min_expiry_days": 7,
                    "max_expiry_days": 30,
                },
                # ES 期货期权
                {
                    "secType": "CONTFUT",
                    "exchange": "CME",
                    "symbol": "ES",
                    "build_options_chain": True,
                    "min_expiry_days": 0,
                    "max_expiry_days": 60,
                },
            ),
        },
    )
```

### 请求历史 K 线

```python
import datetime

# 请求历史 K 线
bars = await client.request_bars(
    bar_specifications=[
        "1-MINUTE-LAST",    # 1 分钟 K 线，使用最新价
        "5-MINUTE-MID",     # 5 分钟 K 线，使用中间价
        "1-HOUR-LAST",      # 1 小时 K 线，使用最新价
        "1-DAY-LAST",       # 日线，使用最新价
    ],
    start_date_time=datetime.datetime(2023, 11, 1, 9, 30),
    end_date_time=datetime.datetime(2023, 11, 6, 16, 30),
    tz_name="America/New_York",
    contracts=contracts,
    use_rth=True,  # 仅常规交易时段
    timeout=120,   # 请求超时（秒）
)
```

### 请求历史逐笔

```python
# 请求历史逐笔数据
ticks = await client.request_ticks(
    tick_types=["TRADES", "BID_ASK"],  # 成交逐笔与买卖价逐笔
    start_date_time=datetime.datetime(2023, 11, 6, 9, 30),
    end_date_time=datetime.datetime(2023, 11, 6, 16, 30),
    tz_name="America/New_York",
    contracts=contracts,
    use_rth=True,
    timeout=120,
)
```

### K 线规格

适配器支持多种 K 线规格：

#### 时间型 K 线

- `"1-SECOND-LAST"`, `"5-SECOND-LAST"`, `"10-SECOND-LAST"`, `"15-SECOND-LAST"`, `"30-SECOND-LAST"`
- `"1-MINUTE-LAST"`, `"2-MINUTE-LAST"`, `"3-MINUTE-LAST"`, `"5-MINUTE-LAST"`, `"10-MINUTE-LAST"`, `"15-MINUTE-LAST"`, `"20-MINUTE-LAST"`, `"30-MINUTE-LAST"`
- `"1-HOUR-LAST"`, `"2-HOUR-LAST"`, `"3-HOUR-LAST"`, `"4-HOUR-LAST"`, `"8-HOUR-LAST"`
- `"1-DAY-LAST"`, `"1-WEEK-LAST"`, `"1-MONTH-LAST"`

#### 价格类型

- `LAST` - 最新成交价
- `MID` - 买卖价中间价
- `BID` - 买价
- `ASK` - 卖价

### 完整示例

```python
import asyncio
import datetime
from nautilus_trader.adapters.interactive_brokers.common import IBContract
from nautilus_trader.adapters.interactive_brokers.historical.client import HistoricInteractiveBrokersClient
from nautilus_trader.persistence.catalog import ParquetDataCatalog


async def download_historical_data():
    # 初始化客户端
    client = HistoricInteractiveBrokersClient(
        host="127.0.0.1",
        port=7497,
        client_id=5,
    )

    # 连接
    await client.connect()
    await asyncio.sleep(2)  # 等待连接稳定

    # 定义合约
    contracts = [
        IBContract(secType="STK", symbol="AAPL", exchange="SMART", primaryExchange="NASDAQ"),
        IBContract(secType="CASH", symbol="EUR", currency="USD", exchange="IDEALPRO"),
    ]

    # 请求合约
    instruments = await client.request_instruments(contracts=contracts)

    # 请求历史 K 线
    bars = await client.request_bars(
        bar_specifications=["1-HOUR-LAST", "1-DAY-LAST"],
        start_date_time=datetime.datetime(2023, 11, 1, 9, 30),
        end_date_time=datetime.datetime(2023, 11, 6, 16, 30),
        tz_name="America/New_York",
        contracts=contracts,
        use_rth=True,
    )

    # 请求逐笔数据
    ticks = await client.request_ticks(
        tick_types=["TRADES"],
        start_date_time=datetime.datetime(2023, 11, 6, 14, 0),
        end_date_time=datetime.datetime(2023, 11, 6, 15, 0),
        tz_name="America/New_York",
        contracts=contracts,
    )

    # 保存到 catalog
    catalog = ParquetDataCatalog("./catalog")
    catalog.write_data(instruments)
    catalog.write_data(bars)
    catalog.write_data(ticks)

    print(f"Downloaded {len(instruments)} instruments")
    print(f"Downloaded {len(bars)} bars")
    print(f"Downloaded {len(ticks)} ticks")

    # 断开连接
    await client.disconnect()

# 运行示例
if __name__ == "__main__":
    asyncio.run(download_historical_data())
```

### 数据限制

请注意 Interactive Brokers 在历史数据使用上的一些限制：

- **速率限制（Rate Limits）**：IB 对历史数据请求会施加速率限制
- **数据可用性（Data Availability）**：历史数据的可用性取决于具体合约类型和订阅权限
- **市场数据权限（Market Data Permissions）**：部分数据需要特定的市场数据订阅才能访问
- **时间范围（Time Ranges）**：不同的 Bar 粒度和合约类型对最大回溯时长有不同限制

### 推荐最佳实践

1. **使用延迟数据（Use Delayed Data）**：用于回测时，`MarketDataTypeEnum.DELAYED_FROZEN` 常常已足够
2. **批量请求（Batch Requests）**：在可能的情况下把多个合约合并为一次请求以降低速率消耗
3. **处理超时（Handle Timeouts）**：对大规模数据请求设置合适的超时值
4. **遵守速率限制（Respect Rate Limits）**：在请求之间加延迟以避免触发速率限制
5. **验证数据（Validate Data）**：回测前务必检查数据质量和完整性

:::warning
IB 会强制执行 pacing 限制；过量的历史数据或下单请求会触发 pacing 违规，IB 可能会暂停 API 会话数分钟。
:::

## 实盘交易

在 Interactive Brokers 上做实盘交易时，需要搭建包含 `InteractiveBrokersDataClient` 与 `InteractiveBrokersExecutionClient` 的 `TradingNode`；两个客户端都依赖 `InteractiveBrokersInstrumentProvider` 来管理合约信息。

### 架构概览

实盘交易部署通常由三部分组成：

1. **InstrumentProvider（合约提供器）**：管理合约定义和 Contract 详情
2. **DataClient（数据客户端）**：处理实时行情订阅
3. **ExecutionClient（执行客户端）**：管理订单、持仓和账户信息

### InstrumentProvider 配置

`InteractiveBrokersInstrumentProvider` 是访问 IB 合约信息的桥梁，支持加载单个合约、期权链和期货链等。

#### 基本配置

```python
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersInstrumentProviderConfig
from nautilus_trader.adapters.interactive_brokers.config import SymbologyMethod
from nautilus_trader.adapters.interactive_brokers.common import IBContract

instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    symbology_method=SymbologyMethod.IB_SIMPLIFIED,
    build_futures_chain=False,  # 若需获取期货链则设为 True
    build_options_chain=False,  # 若需获取期权链则设为 True
    min_expiry_days=10,         # 衍生品最小到期天数
    max_expiry_days=60,         # 衍生品最大到期天数
    convert_exchange_to_mic_venue=False,  # 是否使用 MIC 码进行交易所映射
    cache_validity_days=1,      # 合约缓存有效期（天）
    load_ids=frozenset([
        # 使用简化符号的单个合约示例
        "EUR/USD.IDEALPRO",     # 外汇
        "BTC/USD.PAXOS",        # 加密货币
        "SPY.ARCA",             # 股票 ETF
        "V.NYSE",               # 个股
        "ESM4.CME",             # 期货（年份为一位数字的示例）
        "^SPX.CBOE",            # 指数
    ]),
    load_contracts=frozenset([
        # 使用 IBContract 指定的复杂合约示例
        IBContract(secType='STK', symbol='AAPL', exchange='SMART', primaryExchange='NASDAQ'),
        IBContract(secType='CASH', symbol='GBP', currency='USD', exchange='IDEALPRO'),
    ]),
)
```

#### 衍生品的高级配置

```python
# 配置期权与期货链
advanced_config = InteractiveBrokersInstrumentProviderConfig(
    symbology_method=SymbologyMethod.IB_SIMPLIFIED,
    build_futures_chain=True,   # 启用期货链加载
    build_options_chain=True,   # 启用期权链加载
    min_expiry_days=7,          # 加载 7 天以上到期的合约
    max_expiry_days=90,         # 加载 90 天内到期的合约
    load_contracts=frozenset([
        # 加载 SPY 的期权链
        IBContract(
            secType='STK',
            symbol='SPY',
            exchange='SMART',
            primaryExchange='ARCA',
            build_options_chain=True,
        ),
        # 加载 ES 期货链
        IBContract(
            secType='CONTFUT',
            exchange='CME',
            symbol='ES',
            build_futures_chain=True,
        ),
    ]),
)
```

### 与外部数据提供方集成

Interactive Brokers 适配器可以与其他数据源并用以扩展行情覆盖。使用多数据源时应注意：

- 在各数据源间采用一致的符号方法（symbology method）
- 可考虑设置 `convert_exchange_to_mic_venue=True` 以标准化交易场所标识
- 合理管理合约缓存以避免冲突

### 数据客户端配置

`InteractiveBrokersDataClient` 负责与 IB 建立流式与请求式行情连接。连接后会根据 `InteractiveBrokersInstrumentProviderConfig` 的配置设置行情类型并加载合约。有关市场数据类型的说明可参考链接：[market data type](https://ibkrcampus.com/ibkr-api-page/trader-workstation-api/#delayed-market-data)。

#### 支持的数据类型

- **Quote Ticks（报价 Tick）**：实时买卖价及量
- **Trade Ticks（成交 Tick）**：实时成交价和成交量
- **Bar Data（Bar 数据）**：实时 OHLCV 条（从 1 秒到 1 天粒度）
- **Market Depth（市场深度）**：二级行情（Level 2）订单薄数据（若可用）

#### 市场数据类型（Market data types）

IB 支持多种市场数据类型：

- `REALTIME`：实时行情（需要相应的市场数据订阅）
- `DELAYED`：延迟 15-20 分钟的数据（多数市场免费）
- `DELAYED_FROZEN`：延迟且不更新的数据（适用于测试）
- `FROZEN`：市场收盘时的最后已知实时数据

#### 基本的数据客户端配置

```python
from nautilus_trader.adapters.interactive_brokers.config import IBMarketDataTypeEnum
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersDataClientConfig

data_client_config = InteractiveBrokersDataClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,  # TWS paper trading port
    ibg_client_id=1,
    use_regular_trading_hours=True,  # 仅 RTH（股票）
    market_data_type=IBMarketDataTypeEnum.DELAYED_FROZEN,  # 使用延迟数据
    ignore_quote_tick_size_updates=False,  # 包括仅大小变动的更新
    instrument_provider=instrument_provider_config,
    connection_timeout=300,  # 5 分钟
    request_timeout=60,      # 1 分钟
)
```

#### 生产/实时的高级配置

```python
# 面向生产的实时数据配置
production_data_config = InteractiveBrokersDataClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=4001,  # IB Gateway live trading port
    ibg_client_id=1,
    use_regular_trading_hours=False,  # 包含盘前盘后
    market_data_type=IBMarketDataTypeEnum.REALTIME,  # 实时数据
    ignore_quote_tick_size_updates=True,  # 降低 tick 量
    handle_revised_bars=True,  # 处理 bar 的修正
    instrument_provider=instrument_provider_config,
    dockerized_gateway=dockerized_gateway_config,  # 使用 Docker 时的配置
    connection_timeout=300,
    request_timeout=60,
)
```

### 数据客户端配置选项

| Option                           | Default                                        | Description                                                   |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| `instrument_provider`            | `InteractiveBrokersInstrumentProviderConfig()` | 控制启动时加载哪些合约的提供器配置                            |
| `ibg_host`                       | `127.0.0.1`                                    | TWS/IB Gateway 的主机名或 IP                                  |
| `ibg_port`                       | `None`                                         | TWS/IB Gateway 端口（TWS 常用 7497/7496，IBG 常用 4002/4001） |
| `ibg_client_id`                  | `1`                                            | 连接到 TWS/IB Gateway 时使用的唯一客户端 ID                   |
| `use_regular_trading_hours`      | `True`                                         | 为 True 时请求仅限常规交易时段（主要影响股票的 Bar 数据）     |
| `market_data_type`               | `REALTIME`                                     | 市场数据类型（`REALTIME`, `DELAYED`, `DELAYED_FROZEN` 等）    |
| `ignore_quote_tick_size_updates` | `False`                                        | 为 True 时抑制仅大小变动的报价 Tick，以降低数据量             |
| `dockerized_gateway`             | `None`                                         | 可选的 `DockerizedIBGatewayConfig`，用于容器化部署            |
| `connection_timeout`             | `300`                                          | 等待初始 API 连接的最大秒数                                   |
| `request_timeout`                | `60`                                           | 历史数据请求的超时时间（秒）                                  |

#### 备注

- **`use_regular_trading_hours`**：当为 True 时，数据请求仅覆盖常规交易时段，主要影响股票的 Bar 数据
- **`ignore_quote_tick_size_updates`**：为 True 时会过滤掉仅大小变化（价格未变）的报价 Tick，从而减少数据量
- **`handle_revised_bars`**：为 True 时会处理来自 IB 的 bar 修正（bar 可能在初次发布后被更新）
- **`connection_timeout`**：初始化连接允许的最长等待时间
- **`request_timeout`**：历史数据请求的最大等待时间

### 执行客户端（Execution client）配置选项

| Option                                       | Default                                        | Description                                                         |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| `instrument_provider`                        | `InteractiveBrokersInstrumentProviderConfig()` | 控制启动时加载哪些合约的提供器配置                                  |
| `ibg_host`                                   | `127.0.0.1`                                    | TWS/IB Gateway 的主机名或 IP                                        |
| `ibg_port`                                   | `None`                                         | TWS/IB Gateway 端口（TWS 常用 7497/7496，IBG 常用 4002/4001）       |
| `ibg_client_id`                              | `1`                                            | 连接到 TWS/IB Gateway 时使用的唯一客户端 ID                         |
| `account_id`                                 | `None`                                         | Interactive Brokers 的账户 ID（若为空则使用环境变量 `TWS_ACCOUNT`） |
| `dockerized_gateway`                         | `None`                                         | 可选的 `DockerizedIBGatewayConfig`，用于容器化部署                  |
| `connection_timeout`                         | `300`                                          | 等待初始 API 连接的最大秒数                                         |
| `fetch_all_open_orders`                      | `False`                                        | 为 True 时会拉取所有 API client id 下的未结订单（而非仅当前会话）   |
| `track_option_exercise_from_position_update` | `False`                                        | 为 True 时订阅实时持仓更新以检测期权行权事件                        |

### 执行客户端配置

`InteractiveBrokersExecutionClient` 负责交易执行、订单管理、账户信息和持仓跟踪，提供端到端的订单生命周期管理与实时账户更新。

#### 支持的功能

- **订单管理（Order Management）**：下单、修改与撤单
- **订单类型（Order Types）**：市价、限价、止损、止损限价、跟踪止损等多种类型
- **账户信息（Account Information）**：实时余额与保证金更新
- **持仓跟踪（Position Tracking）**：实时持仓更新与 P&L
- **交易报告（Trade Reporting）**：执行报告与成交回报通知
- **风控（Risk Management）**：下单前风控检查与仓位限制

#### 支持的订单类型

适配器支持大多数 IB 的订单类型：

- **市价单（Market Orders）**：`OrderType.MARKET`
- **限价单（Limit Orders）**：`OrderType.LIMIT`
- **止损单（Stop Orders）**：`OrderType.STOP_MARKET`
- **止损限价单（Stop-Limit Orders）**：`OrderType.STOP_LIMIT`
- **触及成市（Market-If-Touched）**：`OrderType.MARKET_IF_TOUCHED`
- **触及成限（Limit-If-Touched）**：`OrderType.LIMIT_IF_TOUCHED`
- **跟踪止损市价（Trailing Stop Market）**：`OrderType.TRAILING_STOP_MARKET`
- **跟踪止损限价（Trailing Stop Limit）**：`OrderType.TRAILING_STOP_LIMIT`
- **收盘市价（Market-on-Close）**：使用 `OrderType.MARKET` 并配 `TimeInForce.AT_THE_CLOSE`
- **收盘限价（Limit-on-Close）**：使用 `OrderType.LIMIT` 并配 `TimeInForce.AT_THE_CLOSE`

#### 有效期（Time in force）选项

- **日内订单（Day Orders）**：`TimeInForce.DAY`
- **直到撤销（Good-Till-Canceled）**：`TimeInForce.GTC`
- **立即成交或取消（Immediate-or-Cancel）**：`TimeInForce.IOC`
- **全部成交或取消（Fill-or-Kill）**：`TimeInForce.FOK`
- **到期日有效（Good-Till-Date）**：`TimeInForce.GTD`
- **日开盘（At-the-Open）**：`TimeInForce.AT_THE_OPEN`
- **日收盘（At-the-Close）**：`TimeInForce.AT_THE_CLOSE`

#### 批量操作

| Operation    | Supported | Notes                    |
| ------------ | --------- | ------------------------ |
| Batch Submit | ✓         | 在单次请求中提交多笔订单 |
| Batch Modify | ✓         | 在单次请求中修改多笔订单 |
| Batch Cancel | ✓         | 在单次请求中撤销多笔订单 |

#### 持仓管理

| Feature          | Supported | Notes                         |
| ---------------- | --------- | ----------------------------- |
| Query positions  | ✓         | 实时持仓查询                  |
| Position mode    | ✓         | 支持净头寸与多头/空头分离模式 |
| Leverage control | ✓         | 支持账户级别保证金控制        |
| Margin mode      | ✓         | 支持组合与单合约保证金模式    |

#### 订单查询

| Feature              | Supported | Notes            |
| -------------------- | --------- | ---------------- |
| Query open orders    | ✓         | 列出所有活动订单 |
| Query order history  | ✓         | 订单历史数据     |
| Order status updates | ✓         | 实时订单状态变更 |
| Trade history        | ✓         | 执行与成交报告   |

#### 连带/条件订单（Contingent orders）

| Feature            | Supported | Notes                                                  |
| ------------------ | --------- | ------------------------------------------------------ |
| Order lists        | ✓         | 原子化的多单一起提交（Order lists）                    |
| OCO orders         | ✓         | 支持 One-Cancels-Other，且可自定义 OCA 类型（1、2、3） |
| Bracket orders     | ✓         | 支持父子单（止盈/止损）                                |
| Conditional orders | ✓         | 支持高级条件触发与取消                                 |

#### 基本的执行客户端配置

```python
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersExecClientConfig
from nautilus_trader.config import RoutingConfig

exec_client_config = InteractiveBrokersExecClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,  # TWS paper trading port
    ibg_client_id=1,
    account_id="DU123456",  # 你的 IB 账户 ID（测试或实盘）
    instrument_provider=instrument_provider_config,
    connection_timeout=300,
    routing=RoutingConfig(default=True),  # 将所有订单路由到此客户端
)
```

#### 高级执行客户端配置（生产）

```python
# 生产环境下使用 dockerized gateway 的配置示例
production_exec_config = InteractiveBrokersExecClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=4001,  # IB Gateway live trading port
    ibg_client_id=1,
    account_id=None,  # 将使用环境变量 TWS_ACCOUNT
    instrument_provider=instrument_provider_config,
    dockerized_gateway=dockerized_gateway_config,
    connection_timeout=300,
    routing=RoutingConfig(default=True),
)
```

#### 账户 ID（Account ID）配置

`account_id` 参数非常重要，必须与 TWS/Gateway 中登录的账户一致：

```python
# 选项 1：在配置中直接指定
exec_config = InteractiveBrokersExecClientConfig(
    account_id="DU123456",  # Paper trading 账户
    # ... 其它参数
)

# 选项 2：使用环境变量
import os
os.environ["TWS_ACCOUNT"] = "DU123456"
exec_config = InteractiveBrokersExecClientConfig(
    account_id=None,  # 将使用 TWS_ACCOUNT 环境变量
    # ... 其它参数
)
```

#### 订单标签与高级功能

适配器通过订单标签（order tags）支持 IB 特有的订单参数：

```python
from nautilus_trader.adapters.interactive_brokers.common import IBOrderTags

# 创建带有 IB 特定参数的标签
order_tags = IBOrderTags(
    allOrNone=True,           # 全部成交或撤销（AON）
    ocaGroup="MyGroup1",      # OCA 分组
    ocaType=1,                # Block 类型
    activeStartTime="20240315 09:30:00 EST",  # GTC 激活时间
    activeStopTime="20240315 16:00:00 EST",   # GTC 停用时间
    goodAfterTime="20240315 09:35:00 EST",    # Good after 时间
)

# 将标签应用到订单
order = order_factory.limit(
    instrument_id=instrument.id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(100),
    price=instrument.make_price(100.0),
    tags=[order_tags.value],
)
```

#### OCA（one-cancels-all）订单

适配器通过显式配置的 `IBOrderTags` 提供对 OCA 订单的完善支持：

### 基本 OCA 配置

所有 OCA 功能都必须通过 `IBOrderTags` 显式配置：

```python
from nautilus_trader.adapters.interactive_brokers.common import IBOrderTags

# 创建 OCA 配置
oca_tags = IBOrderTags(
    ocaGroup="MY_OCA_GROUP",
    ocaType=1,  # 类型 1：Cancel All with Block（推荐）
)

# 应用于挂单的止盈/止损
bracket_order = order_factory.bracket(
    instrument_id=instrument.id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(100),
    tp_price=instrument.make_price(110.0),
    sl_trigger_price=instrument.make_price(90.0),
    tp_tags=[oca_tags.value],  # 必须显式添加 OCA 标签
    sl_tags=[oca_tags.value],  # 必须显式添加 OCA 标签
)
```

### 高级 OCA 配置

可以通过 `IBOrderTags` 指定不同的 OCA 类型与行为：

```python
from nautilus_trader.adapters.interactive_brokers.common import IBOrderTags

# 创建自定义 OCA 配置
custom_oca_tags = IBOrderTags(
    ocaGroup="MY_CUSTOM_GROUP",
    ocaType=2,  # 使用类型 2：Reduce with Block
)

# 应用于单笔订单
order = order_factory.limit(
    instrument_id=instrument.id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(100),
    price=instrument.make_price(100.0),
    tags=[custom_oca_tags.value],
)
```

### OCA 类型

Interactive Brokers 支持三种 OCA 类型：

| Type  | Name                  | Behavior                              | Use Case                                |
| ----- | --------------------- | ------------------------------------- | --------------------------------------- |
| **1** | Cancel All with Block | 以 block 方式取消所有剩余订单         | **默认** - 最安全的选项，可防止过度成交 |
| **2** | Reduce with Block     | 按比例减少剩余订单（带 block 保护）   | 部分成交时提供过度成交保护              |
| **3** | Reduce without Block  | 按比例减少剩余订单（不带 block 保护） | 执行速度最快，但存在较高的过度成交风险  |

#### 同一 OCA 分组中的多笔订单

```python
# 使用相同 OCA 分组创建多笔订单
oca_tags = IBOrderTags(
    ocaGroup="MULTI_ORDER_GROUP",
    ocaType=3,  # 使用类型 3：Reduce without Block
)

order1 = order_factory.limit(
    instrument_id=instrument.id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(50),
    price=instrument.make_price(99.0),
    tags=[oca_tags.value],
)

order2 = order_factory.limit(
    instrument_id=instrument.id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(50),
    price=instrument.make_price(101.0),
    tags=[oca_tags.value],
)
```

### OCA 配置要求

OCA 功能**仅**通过显式配置可用：

1. **需要 IBOrderTags** - OCA 设置必须在订单标签中明确指定
2. **无自动检测** - `ContingencyType.OCO` 和 `ContingencyType.OUO` 不会自动生成 OCA 分组
3. **手动配置** - 所有 OCA 分组和类型均需手工指定

### 条件订单（Conditional orders）

适配器通过 `IBOrderTags` 的 `conditions` 参数支持 IB 的条件订单。条件订单允许在满足指定条件后再提交或取消订单。

#### 支持的条件类型

- **价格条件（Price Conditions）**：基于某合约价格触发
- **时间条件（Time Conditions）**：在指定日期时间触发
- **成交量条件（Volume Conditions）**：基于成交量阈值触发
- **执行条件（Execution Conditions）**：当指定合约发生成交时触发
- **保证金条件（Margin Conditions）**：基于账户保证金水平触发
- **百分比变化条件（Percent Change Conditions）**：基于价格百分比变动触发

#### 基本条件单示例

```python
from nautilus_trader.adapters.interactive_brokers.common import IBOrderTags

# 创建价格条件：当 SPY 超过 $250 时触发
price_condition = {
    "type": "price",
    "conId": 265598,  # SPY 合约 ID
    "exchange": "SMART",
    "isMore": True,  # 当价格大于阈值时触发
    "price": 250.00,
    "triggerMethod": 0,  # 默认触发方法
    "conjunction": "and",
}

# 创建带条件的订单标签
order_tags = IBOrderTags(
    conditions=[price_condition],
    conditionsCancelOrder=False,  # 条件满足时发送订单
)

# 应用于订单
order = order_factory.limit(
    instrument_id=instrument.id,
    order_side=OrderSide.BUY,
    quantity=instrument.make_qty(100),
    price=instrument.make_price(251.00),
    tags=[order_tags.value],
)
```

#### 带逻辑的多条件示例

```python
# 创建包含 AND/OR 逻辑的多个条件
conditions = [
    {
        "type": "price",
        "conId": 265598,
        "exchange": "SMART",
        "isMore": True,
        "price": 250.00,
        "triggerMethod": 0,
        "conjunction": "and",  # 与下一个条件为 AND
    },
    {
        "type": "time",
        "time": "20250315-09:30:00",
        "isMore": True,
        "conjunction": "or",  # 与下一个条件为 OR
    },
    {
        "type": "volume",
        "conId": 265598,
        "exchange": "SMART",
        "isMore": True,
        "volume": 10000000,
        "conjunction": "and",
    },
]

order_tags = IBOrderTags(
    conditions=conditions,
    conditionsCancelOrder=False,
)
```

#### 条件参数说明

**价格条件（Price Condition）：**

- `conId`：要监控的合约 ID
- `exchange`：要监控的交易所（例如："SMART", "NASDAQ"）
- `isMore`：True 表示 \>=，False 表示 \<=
- `price`：价格阈值
- `triggerMethod`：0=Default, 1=DoubleBidAsk, 2=Last, 3=DoubleLast, 4=BidAsk, 7=LastBidAsk, 8=MidPoint

**时间条件（Time Condition）：**

- `time`：UTC 格式的时间字符串 "YYYYMMDD-HH:MM:SS"（例如："20250315-09:30:00"）
- `isMore`：True 表示在该时间之后触发，False 表示在该时间之前触发

**成交量条件（Volume Condition）：**

- `conId`：要监控的合约 ID
- `exchange`：要监控的交易所
- `isMore`：True 表示 \>=，False 表示 \<=
- `volume`：成交量阈值

**执行条件（Execution Condition）：**

- `symbol`：用于监控成交的标的符号
- `secType`：证券类型（例如："STK", "OPT", "FUT"）
- `exchange`：要监控的交易所

**保证金条件（Margin Condition）：**

- `percent`：保证金余量百分比阈值
- `isMore`：True 表示 \>=，False 表示 \<=

**百分比变化条件（Percent Change Condition）：**

- `conId`：要监控的合约 ID
- `exchange`：要监控的交易所
- `isMore`：True 表示 \>=，False 表示 \<=
- `changePercent`：百分比变化阈值

#### 完整示例：包含所有条件类型

```python
# 演示所有 6 种支持的条件类型
from nautilus_trader.adapters.interactive_brokers.common import IBOrderTags

# 1. 价格条件 - 当 ES 期货 > 6000 时触发
price_condition = {
    "type": "price",
    "conId": 495512563,  # ES 期货合约 ID
    "exchange": "CME",
    "isMore": True,
    "price": 6000.0,
    "triggerMethod": 0,
    "conjunction": "and",
}

# 2. 时间条件 - 在指定时间触发
time_condition = {
    "type": "time",
    "time": "20250315-09:30:00",  # UTC 格式
    "isMore": True,
    "conjunction": "and",
}

# 3. 成交量条件 - 成交量 > 100,000 时触发
volume_condition = {
    "type": "volume",
    "conId": 495512563,
    "exchange": "CME",
    "isMore": True,
    "volume": 100000,
    "conjunction": "and",
}

# 4. 执行条件 - 当 SPY 有成交时触发
execution_condition = {
    "type": "execution",
    "symbol": "SPY",
    "secType": "STK",
    "exchange": "SMART",
    "conjunction": "and",
}

# 5. 保证金条件 - 当保证金余量 > 75% 时触发
margin_condition = {
    "type": "margin",
    "percent": 75,
    "isMore": True,
    "conjunction": "and",
}

# 6. 百分比变化条件 - 当价格变化 > 5% 时触发
percent_change_condition = {
    "type": "percent_change",
    "conId": 495512563,
    "exchange": "CME",
    "changePercent": 5.0,
    "isMore": True,
    "conjunction": "and",
}

# 可任意组合条件
order_tags = IBOrderTags(
    conditions=[price_condition, time_condition],  # 多个条件
    conditionsCancelOrder=False,  # 条件满足时发送订单
)
```

#### 订单行为

设置 `conditionsCancelOrder` 来控制在条件满足时的行为：

- `False`：当条件满足时发送（transmit）订单
- `True`：当条件满足时取消（cancel）订单

#### 实现说明

- **全部 6 种条件类型均被完整支持**，并已用 Interactive Brokers 的实盘订单进行了测试
- **价格条件（Price conditions）** 可以正常工作，尽管 ibapi 库中存在一个已知 bug：`PriceCondition.__str__` 被错误地作为 property 装饰
- **时间条件（Time conditions）** 使用带短横的 UTC 格式（`YYYYMMDD-HH:MM:SS`），以便可靠解析
- **逻辑连接（conjunction logic）** 支持使用 "and"/"or" 运算符组合复杂条件

### 完整交易节点配置

配置完整的交易环境需要创建一个包含所有必要组件的 `TradingNodeConfig`。下面给出不同场景的完整示例。

#### 模拟/纸面交易配置（Paper trading）

```python
import os
from nautilus_trader.adapters.interactive_brokers.common import IB
from nautilus_trader.adapters.interactive_brokers.common import IB_VENUE
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersDataClientConfig
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersExecClientConfig
from nautilus_trader.adapters.interactive_brokers.config import InteractiveBrokersInstrumentProviderConfig
from nautilus_trader.adapters.interactive_brokers.config import IBMarketDataTypeEnum
from nautilus_trader.adapters.interactive_brokers.config import SymbologyMethod
from nautilus_trader.adapters.interactive_brokers.factories import InteractiveBrokersLiveDataClientFactory
from nautilus_trader.adapters.interactive_brokers.factories import InteractiveBrokersLiveExecClientFactory
from nautilus_trader.config import LiveDataEngineConfig
from nautilus_trader.config import LoggingConfig
from nautilus_trader.config import RoutingConfig
from nautilus_trader.config import TradingNodeConfig
from nautilus_trader.live.node import TradingNode

# Instrument provider configuration
instrument_provider_config = InteractiveBrokersInstrumentProviderConfig(
    symbology_method=SymbologyMethod.IB_SIMPLIFIED,
    load_ids=frozenset([
        "EUR/USD.IDEALPRO",
        "GBP/USD.IDEALPRO",
        "SPY.ARCA",
        "QQQ.NASDAQ",
        "AAPL.NASDAQ",
        "MSFT.NASDAQ",
    ]),
)

# Data client configuration
data_client_config = InteractiveBrokersDataClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,  # TWS paper trading
    ibg_client_id=1,
    use_regular_trading_hours=True,
    market_data_type=IBMarketDataTypeEnum.DELAYED_FROZEN,
    instrument_provider=instrument_provider_config,
)

# Execution client configuration
exec_client_config = InteractiveBrokersExecClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,  # TWS paper trading
    ibg_client_id=1,
    account_id="DU123456",  # Your paper trading account
    instrument_provider=instrument_provider_config,
    routing=RoutingConfig(default=True),
)

# Trading node configuration
config_node = TradingNodeConfig(
    trader_id="PAPER-TRADER-001",
    logging=LoggingConfig(log_level="INFO"),
    data_clients={IB: data_client_config},
    exec_clients={IB: exec_client_config},
    data_engine=LiveDataEngineConfig(
        time_bars_timestamp_on_close=False,  # IB standard: use bar open time
        validate_data_sequence=True,         # Discard out-of-sequence bars
    ),
    timeout_connection=90.0,
    timeout_reconciliation=5.0,
    timeout_portfolio=5.0,
    timeout_disconnection=5.0,
    timeout_post_stop=2.0,
)

# Create and configure the trading node
node = TradingNode(config=config_node)
node.add_data_client_factory(IB, InteractiveBrokersLiveDataClientFactory)
node.add_exec_client_factory(IB, InteractiveBrokersLiveExecClientFactory)
node.build()
node.portfolio.set_specific_venue(IB_VENUE)

if __name__ == "__main__":
    try:
        node.run()
    finally:
        node.dispose()
```

## 使用 Dockerized gateway 的实盘交易

```python
from nautilus_trader.adapters.interactive_brokers.config import DockerizedIBGatewayConfig

# Dockerized gateway configuration
dockerized_gateway_config = DockerizedIBGatewayConfig(
    username=os.environ.get("TWS_USERNAME"),
    password=os.environ.get("TWS_PASSWORD"),
    trading_mode="live",  # "paper" or "live"
    read_only_api=False,  # Allow order execution
    timeout=300,
)

# Data client with dockerized gateway
data_client_config = InteractiveBrokersDataClientConfig(
    ibg_client_id=1,
    use_regular_trading_hours=False,  # Include extended hours
    market_data_type=IBMarketDataTypeEnum.REALTIME,
    instrument_provider=instrument_provider_config,
    dockerized_gateway=dockerized_gateway_config,
)

# Execution client with dockerized gateway
exec_client_config = InteractiveBrokersExecClientConfig(
    ibg_client_id=1,
    account_id=os.environ.get("TWS_ACCOUNT"),  # Live account ID
    instrument_provider=instrument_provider_config,
    dockerized_gateway=dockerized_gateway_config,
    routing=RoutingConfig(default=True),
)

# Live trading node configuration
config_node = TradingNodeConfig(
    trader_id="LIVE-TRADER-001",
    logging=LoggingConfig(log_level="INFO"),
    data_clients={IB: data_client_config},
    exec_clients={IB: exec_client_config},
    data_engine=LiveDataEngineConfig(
        time_bars_timestamp_on_close=False,
        validate_data_sequence=True,
    ),
)
```

### 多客户端配置（Multi-client configuration）

对于更高级的部署，可以为不同用途配置多个客户端：

```python
# Separate data and execution clients with different client IDs
data_client_config = InteractiveBrokersDataClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,
    ibg_client_id=1,  # Data client uses ID 1
    market_data_type=IBMarketDataTypeEnum.REALTIME,
    instrument_provider=instrument_provider_config,
)

exec_client_config = InteractiveBrokersExecClientConfig(
    ibg_host="127.0.0.1",
    ibg_port=7497,
    ibg_client_id=2,  # Execution client uses ID 2
    account_id="DU123456",
    instrument_provider=instrument_provider_config,
    routing=RoutingConfig(default=True),
)
```

### 启动交易节点

```python
def run_trading_node():
    """以合适的错误处理方式运行交易节点。"""
    node = None
    try:
        # Create and build node
        node = TradingNode(config=config_node)
        node.add_data_client_factory(IB, InteractiveBrokersLiveDataClientFactory)
        node.add_exec_client_factory(IB, InteractiveBrokersLiveExecClientFactory)
        node.build()

        # Set venue for portfolio
        node.portfolio.set_specific_venue(IB_VENUE)

        # Add your strategies here
        # node.trader.add_strategy(YourStrategy())

        # Run the node
        node.run()

    except KeyboardInterrupt:
        print("Shutting down...")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if node:
            node.dispose()

if __name__ == "__main__":
    run_trading_node()
```

### 其他配置选项

#### 环境变量

为方便配置，可设置下列环境变量：

```bash
# 在 Windows PowerShell 中，使用 $env:TWS_USERNAME = "your_ib_username" 来设置临时环境变量
export TWS_USERNAME="your_ib_username"
export TWS_PASSWORD="your_ib_password"
export TWS_ACCOUNT="your_account_id"
export IB_MAX_CONNECTION_ATTEMPTS="5"  # Optional: limit reconnection attempts
```

#### 日志配置

```python
# Enhanced logging configuration
logging_config = LoggingConfig(
    log_level="INFO",
    log_level_file="DEBUG",
    log_file_format="json",  # JSON format for structured logging
    log_component_levels={
        "InteractiveBrokersClient": "DEBUG",
        "InteractiveBrokersDataClient": "INFO",
        "InteractiveBrokersExecutionClient": "INFO",
    },
)
```

你可以在这里找到更多示例: [https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/interactive_brokers](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/interactive_brokers)

## 故障排查（Troubleshooting）

### 常见连接问题

#### 连接被拒绝（Connection refused）

- **原因**：TWS/Gateway 未运行或端口错误
- **解决办法**：确认 TWS/Gateway 已启动并检查端口配置
- **默认端口**：TWS（7497/7496），IB Gateway（4002/4001）

#### 认证错误（Authentication errors）

- **原因**：凭证错误或账户未登录
- **解决办法**：确认用户名/密码并确保在 TWS/Gateway 中已登录该账户

#### 客户端 ID 冲突（Client ID conflicts）

- **原因**：多个客户端使用相同的 client ID
- **解决办法**：为每个连接使用唯一的 client ID

#### 市场数据权限（Market data permissions）

- **原因**：市场数据订阅不足
- **解决办法**：测试时可使用 `IBMarketDataTypeEnum.DELAYED_FROZEN`，或订阅所需的数据源

### 错误代码

Interactive Brokers 使用特定的错误代码。常见包括：

- **200**：未找到证券定义（No security definition found）
- **201**：订单被拒绝 —— 原因随附（Order rejected - reason follows）
- **202**：订单已取消（Order cancelled）
- **300**：找不到带 ticker ID 的 EId（Can't find EId with ticker ID）
- **354**：未订阅所请求的市场数据（Requested market data is not subscribed）
- **2104**：市场数据 farm 连接正常（Market data farm connection is OK）
- **2106**：HMDS 数据 farm 连接正常（HMDS data farm connection is OK）

### 性能优化

#### 降低数据量

```python
# Reduce quote tick volume by ignoring size-only updates
data_config = InteractiveBrokersDataClientConfig(
    ignore_quote_tick_size_updates=True,
    # ... other config
)
```

#### 连接管理

```python
# Set reasonable timeouts
config = InteractiveBrokersDataClientConfig(
    connection_timeout=300,  # 5 minutes
    request_timeout=60,      # 1 minute
    # ... other config
)
```

#### 内存管理

- 使用适合策略的 bar 大小
- 限制同时订阅的数量
- 对于回测，考虑使用历史数据代替实时数据

### 最佳实践

#### 安全

- 切勿在源码中硬编码凭证
- 使用环境变量存放敏感信息
- 开发与测试优先使用 paper trading
- 对于仅获取数据的应用，设置 `read_only_api=True`

#### 开发流程

1. **从 Paper Trading 开始**：先在纸面账户完成测试
2. **使用延迟数据（Delayed Data）**：开发时使用 `DELAYED_FROZEN` 市场数据
3. **实现良好的错误处理**：优雅处理连接中断与 API 错误
4. **监控日志**：开启合适的日志级别以便调试
5. **测试重连**：检验策略在断线重连时的表现

#### 生产部署

- 使用 dockerized gateway 进行自动化部署
- 实施完备的监控与告警
- 配置日志聚合与分析
- 仅在必要时使用实时数据订阅
- 实施熔断器与持仓限制

#### 订单管理

- 提交订单前务必进行校验
- 实现合理的仓位规模控制
- 根据策略选择合适的订单类型
- 监控订单状态并处理拒单情况
- 对订单操作实现超时处理

### 调试建议

#### 启用调试日志

```python
logging_config = LoggingConfig(
    log_level="DEBUG",
    log_component_levels={
        "InteractiveBrokersClient": "DEBUG",
    },
)
```

#### 监控连接状态

```python
# Check connection status in your strategy
if not self.data_client.is_connected:
    self.log.warning("Data client disconnected")
```

#### 验证合约/品种

```python
# Ensure instruments are loaded before trading
instruments = self.cache.instruments()
if not instruments:
    self.log.error("No instruments loaded")
```

### 支持与资源

- **IB API Documentation**: [TWS API Guide](https://ibkrcampus.com/ibkr-api-page/trader-workstation-api/)
- **NautilusTrader Examples**: [GitHub Examples](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/live/interactive_brokers)
- **IB Contract Search**: [Contract Information Center](https://pennies.interactivebrokers.com/cstools/contract_info/)
- **Market Data Subscriptions**: [IB Market Data](https://www.interactivebrokers.com/en/trading/market-data.php)
