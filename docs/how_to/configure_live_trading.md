# 配置实时交易节点

设置 `LiveNode` 以建立实时市场连接。节点生命周期见[实时交易](./../concepts/live.md)。
命令结果见[执行政策](./../concepts/execution/policies.md#command-outcomes)。状态恢复见
[执行对账](./../concepts/execution/reconciliation.md)。

:::danger[不建议用 Jupyter notebook 做实时交易]
不要在 Jupyter notebook 里运行实时交易节点。节点在调用线程上拥有一个长运行循环，notebook 的
生命周期控制会让生产环境运行不安全：

- 单元格可能乱序执行，内核可能崩溃，状态可能丢失。
- notebook 缺乏生产交易所需的日志、监控和优雅关闭。

Jupyter 适合回测、分析和实验。实时交易请把节点作为独立的 Python 脚本或服务运行。
:::

:::warning[每个进程只运行一个 LiveNode]
不支持在同一进程中并发运行多个 `LiveNode` 实例，因为运行时状态没有隔离。`run_async()` 也会
拒绝在同一事件循环上托管第二个节点。请给单个节点添加多个策略，或在独立进程中运行额外节点。

细节见[进程与线程](./../concepts/architecture.md#processes-and-threads)。
:::

:::warning[不要阻塞事件循环]
事件循环线程上的用户代码（策略回调、Actor 处理器和时间事件回调）必须快速返回，Python 和 Rust
都一样。模型推理、重计算或同步 I/O 这类阻塞操作会导致漏掉成交、数据过期和订单提交延迟。
长时任务请交给执行器或单独的线程/进程。
:::

:::info[平台差异]
Windows 的信号处理与类 Unix 系统不同。若在 Windows 上运行，请阅读
[Windows 信号处理](#windows-signal-handling)一节，了解优雅关闭行为和 Ctrl+C（SIGINT）支持。
:::

## LiveNodeConfig {#livenodeconfig}

`LiveNodeConfig` 持有节点核心组件的设置。数据客户端和执行客户端通过 `LiveNode.builder(...)`
注册，而不是通过该配置中的客户端字典。配置默认值和 `Option<T>` 语义的背景见
[配置](./../concepts/configuration.md)概念指南。

```python
from nautilus_trader.common import Environment
from nautilus_trader.common import LogLevel
from nautilus_trader.config import CacheConfig
from nautilus_trader.config import LiveDataEngineConfig
from nautilus_trader.config import LiveExecutionEngineConfig
from nautilus_trader.config import LiveNodeConfig
from nautilus_trader.config import LiveRiskEngineConfig
from nautilus_trader.config import LoggerConfig
from nautilus_trader.config import MessageBusConfig
from nautilus_trader.config import PortfolioConfig
from nautilus_trader.model import TraderId

config = LiveNodeConfig(
    environment=Environment.LIVE,
    trader_id=TraderId.from_str("MY-TRADER-001"),
    logging=LoggerConfig(stdout_level=LogLevel.INFO),
    cache=CacheConfig(),
    msgbus=MessageBusConfig(),
    data_engine=LiveDataEngineConfig(),
    risk_engine=LiveRiskEngineConfig(),
    exec_engine=LiveExecutionEngineConfig(),
    portfolio=PortfolioConfig(),
)
```

### 核心配置参数 {#core-configuration-parameters}

| 设置                          | 默认值       | 说明                                                                             |
| ----------------------------- | ------------ | -------------------------------------------------------------------------------- |
| `trader_id`                   | "TRADER-001" | 唯一交易者标识（name-tag 格式）；tag 必须跨节点唯一。                            |
| `instance_id`                 | `None`       | 可选的唯一实例标识。                                                             |
| `timeout_connection_secs`     | 60.0         | 连接超时（秒）。                                                                 |
| `timeout_reconciliation_secs` | 30.0         | 对账超时（秒）。                                                                 |
| `timeout_portfolio_secs`      | 10.0         | 组合初始化超时。                                                                 |
| `timeout_disconnection_secs`  | 10.0         | 断开连接超时。                                                                   |
| `delay_post_stop_secs`        | 10.0         | 停止后处理残留事件的延迟。                                                       |
| `timeout_shutdown_secs`       | 5.0          | 待办任务关闭超时（秒）。                                                         |

:::warning[Trader ID tag 的唯一性]
最后一个连字符之后的 tag 会进入生成的客户端订单 ID、订单列表 ID 和持仓 ID，前面的名字不会。
因此交易同一场所账户的两个节点必须使用不同的 tag：`MY-TRADER-001` 和 `OTHER-TRADER-001` 共享
tag `001`，可能产生完全相同的 ID。在策略上设置 `use_uuid_client_order_ids` 只能消除客户端订单
ID 的这部分风险：订单列表 ID 和持仓 ID 无论如何都带 tag，所以仍必须使用唯一 tag。
:::

### 缓存数据库配置 {#cache-database-configuration}

Rust 原生实时系统把缓存行为放在 `CacheConfig`，Redis 连接设置放在 `RedisCacheConfig`。

```rust
use nautilus_common::{
    cache::{CacheConfig, database::CacheDatabaseFactory},
    enums::SerializationEncoding,
};
use nautilus_infrastructure::redis::cache::RedisCacheConfig;

let config = CacheConfig {
    encoding: SerializationEncoding::MsgPack,
    timestamps_as_iso8601: true,
    buffer_interval_ms: Some(100),
    flush_on_start: false,
    ..Default::default()
};

let database = RedisCacheConfig {
    host: Some("localhost".to_string()),
    port: Some(6379),
    username: Some("nautilus".to_string()),
    password: Some("pass".to_string()),
    connection_timeout: 2,
    response_timeout: 2,
    ..Default::default()
};

let cache_database = database
    .create(trader_id, instance_id, config.clone())
    .await?;
```

在构建 Rust 原生节点之后、启动之前挂上该适配器。当 `exec_engine.load_cache` 启用（默认如此）时，
节点会在对账前恢复数据库。

```rust
let node_config = LiveNodeConfig {
    trader_id,
    ..Default::default()
};
let mut node = LiveNode::build("LiveNode".to_string(), Some(node_config))?;
node.set_cache_database(cache_database)?;
node.run().await?;
```

设置 `CacheConfig.flush_on_start = true` 会清空所挂载的支撑，而不是恢复它。Postgres 支撑
只清除该节点的 trader 行。

Python 通过 `LiveNodeBuilder` 注入相同的数据库配置。节点启动时构造并持有适配器：

```python
from nautilus_trader.common import Environment
from nautilus_trader.infrastructure import RedisCacheConfig
from nautilus_trader.config import LiveExecutionEngineConfig
from nautilus_trader.live import LiveNode
from nautilus_trader.model import TraderId

node = (
    LiveNode.builder("LiveNode", TraderId("TRADER-001"), Environment.LIVE)
    .with_cache_database_factory(RedisCacheConfig(host="localhost", port=6379))
    .with_exec_engine_config(
        LiveExecutionEngineConfig(
            snapshot_orders=True,
            snapshot_positions=True,
        ),
    )
    .with_load_state(True)
    .with_save_state(True)
    .build()
)

try:
    node.run()
finally:
    node.dispose()
```

要改用 Postgres 作为缓存支撑，传入 `PostgresCacheConfig`。传入其他任意对象时
`with_cache_database_factory` 抛出 `NotImplementedError`，数据库连接失败会让 `run()` 失败。
带数据库支撑的节点必须用 `run()`，因为 `run_async()` 拒绝会阻塞宿主事件循环的缓存数据库
支撑。

Postgres 支撑只加载、写入和刷新该节点 trader 的数据，因此不同 trader ID 的节点可以共享一个
数据库。作用域内 flush 保留什么、以及如何归属 trader 作用域之前持久化的账户事件，见
[缓存](./../concepts/cache.md)。

`snapshot_orders=True` 时，执行引擎在提交处理期间和每次状态变化后持久化订单快照。订单快照需要
Redis 或 Postgres 缓存支撑。

`snapshot_positions=True` 时，执行引擎在持仓开仓、变化或平仓时发布快照。单独设置
`snapshot_positions_interval_secs` 可对所有未平仓头寸追加周期性快照。Redis 和 Postgres 缓存
支撑会持久化这两条路径。没有支撑时，快照在进程内消息总线上仍可用，但不会被持久化。

`with_load_state` 和 `with_save_state` 控制 Actor 和策略状态的持久化，这需要 Redis 支撑。
Postgres 适配器只支撑缓存状态：注册了 Actor 或策略时，`with_load_state(True)` 会在交易者启动时
失败，`with_save_state(True)` 会在节点停止或 dispose 时失败。启动时内核把非空的已持久化状态传给
`on_load`；停止或 dispose 节点时持久化 `on_save` 的返回值。

:::warning
状态持久化不是连续检查点。内核每次运行最多保存一次状态，因此 `SIGKILL` 或崩溃会丢失上次保存
之后的所有变更。请 dispose 节点，让 `dispose()` 关闭支撑并刷新缓冲写入；直接从 `run()`
返回可能丢掉最后一次保存。
:::

### MessageBus 配置 {#messagebus-configuration}

消息总线行为留在 `MessageBusConfig`。Redis 连接设置放在 `RedisMessageBusConfig`，它实现了
`MessageBusBackingFactory`，用这些设置构造支撑。

```rust
use nautilus_common::{
    enums::SerializationEncoding,
    msgbus::{MessageBusBackingFactory, MessageBusConfig},
};
use nautilus_infrastructure::redis::msgbus::RedisMessageBusConfig;

let config = MessageBusConfig {
    encoding: SerializationEncoding::Json,
    timestamps_as_iso8601: true,
    use_instance_id: false,
    types_filter: Some(vec!["QuoteTick".to_string(), "TradeTick".to_string()]),
    stream_per_topic: false,
    autotrim_mins: Some(30),
    heartbeat_interval_secs: Some(1),
    ..Default::default()
};

let redis_config = RedisMessageBusConfig {
    connection_timeout: 2,
    response_timeout: 2,
    ..Default::default()
};

let backing = redis_config.create(trader_id, instance_id, config.clone())?;
```

Python 通过 `LiveNodeBuilder` 注入 Redis 配置：

```python
from nautilus_trader.common import Environment
from nautilus_trader.common import MessageBusConfig
from nautilus_trader.infrastructure import RedisMessageBusConfig
from nautilus_trader.live import LiveNode
from nautilus_trader.model import TraderId

trader_id = TraderId("TRADER-001")
message_bus = MessageBusConfig(
    external_streams=["external-stream"],
    stream_per_topic=False,
)
redis_config = RedisMessageBusConfig(
    host="localhost",
    port=6379,
)
node = (
    LiveNode.builder("LiveNode", trader_id, Environment.LIVE)
    .with_msgbus_config(message_bus)
    .with_external_msgbus_factory(redis_config)
    .build()
)
node.run()
```

已有代码可以继续向 `with_external_msgbus_factory` 传 `RedisMessageBusFactory(redis_config)`。

单独的 `MessageBusConfig` 不会安装支撑，要像上面那样配合工厂使用。工厂总是安装外部出口
（egress），调用 `run()` 同时会消费配置的外部流。节点启动前已在流中的条目不会被重放。
`run_async()` 与 `run()` 走相同的生命周期，因此托管在调用方事件循环上的节点同样处理外部消息总线
入口（ingress）。生命周期与入口细节见
[消息总线支撑配置](./../concepts/message_bus.md#backing-config)。直接写 Redis 的外部生产者
必须提供必需的 `type` 字段。线协议字段与 Python 自定义数据注册见
[外部出口与入口](./../concepts/message_bus.md#external-egress-and-ingress)。

## 多场所配置 {#multi-venue-configuration}

一个节点可以连接多个客户端。下面的示例在构建节点前注册 Binance 现货和 USD-M 期货数据客户端：

```python
from nautilus_trader.adapters.binance import BinanceDataClientConfig
from nautilus_trader.adapters.binance import BinanceDataClientFactory
from nautilus_trader.adapters.binance import BinanceEnvironment
from nautilus_trader.adapters.binance import BinanceProductType
from nautilus_trader.common import Environment
from nautilus_trader.live import LiveNode
from nautilus_trader.model import TraderId

node = (
    LiveNode.builder(
        "BINANCE-MULTI-CLIENT-001",
        TraderId.from_str("MULTI-VENUE-001"),
        Environment.LIVE,
    )
    .add_data_client(
        "BINANCE_SPOT",
        BinanceDataClientFactory(),
        BinanceDataClientConfig(
            product_type=BinanceProductType.SPOT,
            environment=BinanceEnvironment.LIVE,
        ),
    )
    .add_data_client(
        "BINANCE_FUTURES",
        BinanceDataClientFactory(),
        BinanceDataClientConfig(
            product_type=BinanceProductType.USD_M,
            environment=BinanceEnvironment.LIVE,
        ),
    )
    .build()
)
```

## ExecutionEngine 配置 {#executionengine-configuration}

`LiveExecutionEngineConfig` 控制订单处理、执行事件和场所对账。完整细节见
[API 参考](https://nautilustrader.io/docs/python-api-latest/live.html#nautilus_trader.live.LiveExecutionEngineConfig)。

### 对账 {#reconciliation}

恢复错过的订单和持仓事件，使系统状态与交易场所保持一致。

| 设置                            | 默认值 | 说明                                                                            |
| ------------------------------- | ------- | ----------------------------------------------------------------------------- |
| `reconciliation`                | True    | 启动时启用对账，使内部状态与场对齐。                                          |
| `reconciliation_lookback_mins`  | None    | 为未缓存状态请求历史事件的回看时长（分钟）。                                    |
| `reconciliation_instrument_ids` | None    | 要对账的金融工具 ID 包含列表。                                                  |
| `filtered_client_order_ids`     | None    | 对账时跳过的客户端订单 ID（应对场所侧重复）。                                   |

细节见[执行对账](./../concepts/execution/reconciliation.md)。

### 订单过滤 {#order-filtering}

控制系统处理哪些订单事件和报告，避免多个交易节点之间冲突。

| 设置                               | 默认值 | 说明                                                                          |
| ---------------------------------- | ------- | --------------------------------------------------------------------------- |
| `filter_unclaimed_external_orders` | False   | 丢弃未认领的外部订单，使其不影响策略。                                        |
| `filter_position_reports`          | False   | 丢弃持仓状态报告。多个节点交易同一账户时有用。                                |

:::note[订单打标签行为]
对账按来源给订单打标签：

- **`VENUE` 标签**：在场所发现的外部订单（本系统之外下的单）。
- **`RECONCILIATION` 标签**：为对齐持仓差异而生成的合成订单。

启用 `filter_unclaimed_external_orders` 时只过滤 `VENUE` 标签的订单。`RECONCILIATION` 标签的
订单永不被过滤，因此持仓对齐总能成功。
:::

### 持续对账 {#continuous-reconciliation}

持续对账在启动后保持运行时执行状态对齐，手段包括检查在途订单、轮询未结订单、检查持仓状态和
审计自有订单簿。用以下设置配置该循环。运行时状态转换规则、重试协调与注意事项见
[运行时检查](./../concepts/execution/reconciliation.md#runtime-checks)。

| 设置                                 | 默认值           | 说明                                                                                                                                                                                       |
| ------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inflight_check_interval_ms`         | 2,000&nbsp;ms  | 检查在途订单状态的频率。设为 0 禁用。                                                                                                                                                        |
| `inflight_check_threshold_ms`        | 5,000&nbsp;ms  | 在途订单等待多久后触发场所状态检查。同机房部署可调低。                                                                                                                                       |
| `inflight_check_retries`             | 5&nbsp;retries | 与场所核验在途订单的重试次数。                                                                                                                                                               |
| `open_check_interval_secs`           | None           | 检查场所未结订单的频率（秒）。None 或 0.0 禁用。建议 5-10 秒。                                                                                                                               |
| `open_check_open_only`               | True           | true 时只查询未结订单；false 时拉取完整历史（消耗大）。                                                                                                                                      |
| `open_check_lookback_mins`           | 60&nbsp;min    | 订单状态轮询的回看窗口（分钟），只处理该窗口内变更过的订单。                                                                                                                                 |
| `open_check_threshold_ms`            | 5,000&nbsp;ms  | 依据场所差异采取行动前，距最近缓存事件的最短时间。                                                                                                                                           |
| `open_check_missing_retries`         | 5&nbsp;retries | 对合格订单做定向"未找到"处理前的最大重试次数。                                                                                                                                               |
| `max_single_order_queries_per_cycle` | 10             | 每轮单订单查询数量上限，防止耗尽速率限制。                                                                                                                                                   |
| `single_order_query_delay_ms`        | 100&nbsp;ms    | 单订单查询之间的间隔（毫秒），避免触发速率限制。                                                                                                                                             |
| `reconciliation_startup_delay_secs`  | 10.0&nbsp;s    | 启动对账*之后*、持续检查开始前的延迟（秒）。                                                                                                                                                 |
| `own_books_audit_interval_secs`      | None           | 审计间隔（秒）：清除缓存不再视为活动的自有订单簿订单。None 禁用。                                                                                                                            |
| `position_check_interval_secs`       | None           | 持仓一致性检查间隔（秒）。发现差异时查询缺失成交。None 禁用。建议 30-60 秒。                                                                                                                 |
| `position_check_lookback_mins`       | 60&nbsp;min    | 持仓差异时查询成交报告的回看窗口（分钟）。                                                                                                                                                   |
| `position_check_threshold_ms`        | 5,000&nbsp;ms  | 依据持仓差异采取行动前，距本地最后活动时间的最短间隔；也决定应用失败的成交将合成对账推迟多久。                                                                                               |
| `position_check_retries`             | 3&nbsp;retries | 引擎在停止重试某一差异前，每工具/账户的最大尝试次数。超限后记录错误，该差异在自行消除前不再主动对账。                                                                                        |

:::warning

- **`open_check_lookback_mins`**：不要调到 60 分钟以下。窗口太短会把订单排除在查询范围外，
  触发虚假的"订单缺失"处理。
- **`open_check_threshold_ms`**：场所时间戳落后本地时钟时调大它，避免刚更新的订单被过早标记为
  缺失。
- **`reconciliation_startup_delay_secs`**：生产环境不要低于 10 秒。启动对账后系统需要这段延迟
  稳定下来，然后才开始持续检查。

:::

### 其他选项 {#additional-options}

| 设置                               | 默认值 | 说明                                                                                                             |
| ---------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `allow_overfills`                  | False   | 允许成交量超过订单数量（记录警告）。对账与成交竞争时有用。                                                       |
| `generate_missing_orders`          | True    | 依据未匹配的成交与持仓报告生成对账订单。                                                                         |
| `snapshot_orders`                  | False   | 配置缓存支撑后，在提交处理期间和每次状态变化后持久化订单快照。                                              |
| `snapshot_positions`               | False   | 在持仓开仓、变化、平仓时发布快照，配置缓存支撑后持久化。                                                    |
| `snapshot_positions_interval_secs` | None    | 持仓快照间隔（秒）。                                                                                             |
| `debug`                            | False   | 启用执行调试日志。                                                                                               |

### 内存管理 {#memory-management}

周期性清除内存缓存中的已关闭订单、已关闭持仓和账户事件，使长时间运行或 HFT 会话的内存保持有界。

| 设置                                     | 默认值 | 说明                                                                             |
| ---------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `purge_closed_orders_interval_mins`      | None    | 从内存清除已关闭订单的频率（分钟）。建议 10-15 分钟。                              |
| `purge_closed_orders_buffer_mins`        | None    | 订单关闭后需等待多久才可清除（分钟）。建议 60 分钟。                               |
| `purge_closed_positions_interval_mins`   | None    | 从内存清除已关闭持仓的频率（分钟）。建议 10-15 分钟。                              |
| `purge_closed_positions_buffer_mins`     | None    | 持仓关闭后需等待多久才可清除（分钟）。建议 60 分钟。                               |
| `purge_account_events_interval_mins`     | None    | 从内存清除账户事件的频率（分钟）。建议 10-15 分钟。                                |
| `purge_account_events_lookback_mins`     | None    | 账户事件需存在多久才可清除（分钟）。建议 60 分钟。                                 |

设置 interval 即启用清除循环；不设置则不调度、不删除。每轮循环调用
[缓存](./../concepts/cache.md)中描述的缓存 API。

## 策略配置 {#strategy-configuration}

完整参数列表见 `StrategyConfig` 的
[API 参考](https://nautilustrader.io/docs/python-api-latest/trading.html#nautilus_trader.trading.StrategyConfig)。

### 标识 {#identification}

| 设置           | 默认值 | 说明                                                                       |
| -------------- | ------- | -------------------------------------------------------------------------- |
| `strategy_id`  | None    | 唯一策略标识。                                                             |
| `order_id_tag` | None    | 追加到该策略订单 ID 的唯一 tag；不能包含连字符。                           |

### 订单管理 {#order-management}

| 设置                            | 默认值 | 说明                                                                                                   |
| ------------------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `oms_type`                      | None    | 用于持仓 ID 与订单处理的 [OMS 类型](./../concepts/execution/index.md#oms-configuration)。              |
| `use_uuid_client_order_ids`     | False   | 客户端订单 ID 使用 UUID4 值。                                                                        |
| `external_order_instrument_ids` | None    | 按工具认领外部订单与对账活动的可序列化意图。                                                         |
| `manage_contingent_orders`      | False   | 管理未完成、非活动本地的 OTO、OCO 和 OUO 关系。                                                      |
| `manage_gtd_expiry`             | False   | 管理订单的 GTD 到期。                                                                                |

活动认领的生命周期与运行时更新见[认领外部订单](./../concepts/strategies.md#claiming-external-orders)。

`OrderEmulator` 保留活动本地的或有订单。所有权与场所支持边界见
[高级订单](./../concepts/orders/advanced.md#strategy-managed-contingencies)。

这些运行时设置通过 `strategy.config` 读取；策略对象本身不会把它们复制为直接属性。

## Windows 信号处理 {#windows-signal-handling}

`LiveNode` 在 Rust 运行循环中处理 Ctrl+C（SIGINT），并在 Unix 上处理 SIGTERM。
Python 桥接层也会把 SIGINT 路由到同一关闭路径，因此 runner 和任务都能干净地关闭。
