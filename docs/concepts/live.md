# Live 交易

Live 交易功能允许交易者在不修改代码的情况下，将经回测的策略部署到实时交易环境中。这种从回测平滑过渡到实盘的能力是平台的核心特性之一，可确保行为的一致性和结果的可重复性。但需要注意，回测与实盘之间仍存在若干重要差异。

本指南概述了 Live 交易的关键要点。

:::info 平台差异
Windows 与类 Unix 系统在信号（signal）处理方面存在差异。如果你在 Windows 上运行，请阅读关于 [Windows 信号处理](#windows-signal-handling) 的说明，以了解优雅关闭和 Ctrl+C（SIGINT）支持的建议做法。
:::

## 配置

在运行实盘交易系统时，正确配置执行引擎（execution engine）和策略至关重要，这能保证系统的可靠性、准确性与性能。下面概述了用于 Live 配置的关键概念与常用设置。

### `TradingNodeConfig`

Live 交易系统的主要配置类是 `TradingNodeConfig`，它继承自 `NautilusKernelConfig` 并提供了针对实盘的特定配置选项：

```python
from nautilus_trader.config import TradingNodeConfig

config = TradingNodeConfig(
    trader_id="MyTrader-001",

    # 组件配置
    cache: CacheConfig(),
    message_bus: MessageBusConfig(),
    data_engine=LiveDataEngineConfig(),
    risk_engine=LiveRiskEngineConfig(),
    exec_engine=LiveExecEngineConfig(),
    portfolio=PortfolioConfig(),

    # 客户端配置
    data_clients={
        "BINANCE": BinanceDataClientConfig(),
    },
    exec_clients={
        "BINANCE": BinanceExecClientConfig(),
    },
)
```

#### 核心配置参数

| 设置                     | 默认值       | 说明                                   |
| ------------------------ | ------------ | -------------------------------------- |
| `trader_id`              | "TRADER-001" | 唯一的交易者标识（name-tag 格式）。    |
| `instance_id`            | `None`       | 可选的实例唯一标识。                   |
| `timeout_connection`     | 30.0         | 连接超时时间（秒）。                   |
| `timeout_reconciliation` | 10.0         | 对账（reconciliation）超时时间（秒）。 |
| `timeout_portfolio`      | 10.0         | 投资组合初始化超时时间（秒）。         |
| `timeout_disconnection`  | 10.0         | 断开连接超时时间（秒）。               |
| `timeout_post_stop`      | 5.0          | 停止后清理的超时时间（秒）。           |

#### 缓存数据库配置

使用后端数据库配置数据持久化：

```python
from nautilus_trader.config import CacheConfig
from nautilus_trader.config import DatabaseConfig

cache_config = CacheConfig(
    database=DatabaseConfig(
        host="localhost",
        port=6379,
        username="nautilus",
        password="pass",
        timeout=2.0,
    ),
    encoding="msgpack",  # 或 "json"
    timestamps_as_iso8601=True,
    buffer_interval_ms=100,
    flush_on_start=False,
)
```

#### MessageBus 配置

配置消息路由和外部流式传输：

```python
from nautilus_trader.config import MessageBusConfig
from nautilus_trader.config import DatabaseConfig

message_bus_config = MessageBusConfig(
    database=DatabaseConfig(timeout=2),
    timestamps_as_iso8601=True,
    use_instance_id=False,
    types_filter=[QuoteTick, TradeTick],  # 过滤特定消息类型
    stream_per_topic=False,
    autotrim_mins=30,  # 自动裁剪消息（分钟）
    heartbeat_interval_secs=1,
)
```

### 多场所（Multi-venue）配置

实盘系统通常会连接多个交易场所（venues）。下面示例演示如何同时配置 Binance 的现货（spot）与期货（futures）市场：

```python
config = TradingNodeConfig(
    trader_id="MultiVenue-001",

    # 针对不同市场类型的多个数据客户端
    data_clients={
        "BINANCE_SPOT": BinanceDataClientConfig(
            account_type=BinanceAccountType.SPOT,
            testnet=False,
        ),
        "BINANCE_FUTURES": BinanceDataClientConfig(
            account_type=BinanceAccountType.USDT_FUTURES,
            testnet=False,
        ),
    },

    # 对应的执行客户端
    exec_clients={
        "BINANCE_SPOT": BinanceExecClientConfig(
            account_type=BinanceAccountType.SPOT,
            testnet=False,
        ),
        "BINANCE_FUTURES": BinanceExecClientConfig(
            account_type=BinanceAccountType.USDT_FUTURES,
            testnet=False,
        ),
    },
)
```

### ExecutionEngine 配置

`LiveExecEngineConfig` 用于设置实盘执行引擎（execution engine），负责订单处理、执行事件和与交易场所的对账（reconciliation）。下面列出主要的配置选项。

通过合理配置这些参数，可以确保交易系统高效运行、正确处理订单，并在丢失事件或数据冲突等情况下保持弹性。

完整细节请参见 `LiveExecEngineConfig` 的 [API 参考](../api_reference/config#class-liveexecengineconfig)。

#### 对账（Reconciliation）

目的：确保系统状态与交易场所的一致，通过恢复漏掉的事件（例如订单和持仓状态更新）来对齐状态。

| 设置                            | 默认值 | 说明                                                                    |
| ------------------------------- | ------ | ----------------------------------------------------------------------- |
| `reconciliation`                | True   | 启用启动时对账，将系统内部状态与场所状态对齐。                          |
| `reconciliation_lookback_mins`  | None   | 指定在对账时向后查询的分钟数，用于恢复未缓存的历史状态。                |
| `reconciliation_instrument_ids` | None   | 对账时要包含的特定 instrument id 列表。                                 |
| `filtered_client_order_ids`     | None   | 在对账时需要过滤掉的 client order id 列表（当场所保存重复订单时有用）。 |

详见 [Execution reconciliation](../concepts/execution#execution-reconciliation) 获取更多背景信息。

#### 订单过滤（Order filtering）

目的：管理系统应处理哪些订单事件和报告，以避免与其他交易节点冲突并减少不必要的数据处理。

| 设置                               | 默认值 | 说明                                                       |
| ---------------------------------- | ------ | ---------------------------------------------------------- |
| `filter_unclaimed_external_orders` | False  | 过滤未被认领的外部订单，防止无关订单干扰策略。             |
| `filter_position_reports`          | False  | 过滤持仓状态报告，当多个节点使用同一账户交易时可避免冲突。 |

#### 持续对账（Continuous reconciliation）

目的：通过一个在启动对账完成后运行的持续对账循环来维持准确的执行状态，该循环将：

- (1) 监控超时的 in-flight 订单，超过阈值则触发检查。
- (2) 在可配置的间隔内将开放订单与场所对齐。
- (3) 审计内部（own）委托簿与交易场所的公共委托簿。

启动顺序：持续对账循环会等待启动对账完成后才开始周期性检查，避免持续检查与启动对账互相竞态。参数 `reconciliation_startup_delay_secs` 在启动对账完成后再施加额外延迟。

如果在耗尽重试次数后仍无法对齐订单状态，引擎会按如下规则解析订单：

In-flight 订单超时解析（当场所超过最大重试次数仍无响应时）：

| 当前状态         | 解析为     | 说明             |
| ---------------- | ---------- | ---------------- |
| `SUBMITTED`      | `REJECTED` | 未收到场所确认。 |
| `PENDING_UPDATE` | `CANCELED` | 修改未被确认。   |
| `PENDING_CANCEL` | `CANCELED` | 场所未确认取消。 |

订单一致性检查（当缓存状态与场所状态不一致时）：

| 缓存状态           | 场所状态   | 解析结果   | 说明                                         |
| ------------------ | ---------- | ---------- | -------------------------------------------- |
| `ACCEPTED`         | Not found  | `REJECTED` | 订单在场所不存在，可能从未成功下达。         |
| `ACCEPTED`         | `CANCELED` | `CANCELED` | 场所取消了订单（用户或场所发起）。           |
| `ACCEPTED`         | `EXPIRED`  | `EXPIRED`  | 订单在场所到达 GTD（Good-Til-Date）过期。    |
| `ACCEPTED`         | `REJECTED` | `REJECTED` | 场所在初始接受后又拒绝（少见）。             |
| `PARTIALLY_FILLED` | `CANCELED` | `CANCELED` | 订单在场所被取消，但部分成交保留。           |
| `PARTIALLY_FILLED` | Not found  | `CANCELED` | 订单在场所不存在但有成交，用于对齐成交历史。 |

:::note
重要的对账注意事项：

- “Not found” 解析仅在全历史模式下执行（`open_check_open_only=False`）。在 open-only 模式（默认 `open_check_open_only=True`）下，此类检查会被跳过，因为 open-only 模式使用场所特定的“open orders”端点，该端点默认不包含已关闭订单，因而无法区分真正丢失的订单与最近关闭的订单。
- 最近订单保护：对于最后事件时间戳在 `open_check_threshold_ms` 窗口内（默认 5 秒）的订单，引擎会跳过对账操作，防止竞态导致的误判。
- 目标查询保护：在将订单标记为 `REJECTED` 或 `CANCELED`（“not found”）之前，引擎会尝试对单个订单进行目标查询，以防止批量查询的时序问题或漏检。
- `FILLED` 订单：当 `FILLED` 订单在场所“not found” 时，这通常是正常行为（场所通常不跟踪已完成的订单），此类情况会被忽略且不产生警告。

:::

#### 重试协调与回溯行为

执行引擎对 in-flight 循环（由 `inflight_check_retries` 限制）和 open-order 循环（由 `open_check_missing_retries` 限制）复用单一重试计数器（`_recon_check_retries`）。这种共享预算确保更严格的限制生效并避免对同一订单重复查询场所。

当 open-order 循环耗尽重试后，引擎会在应用终态前发出一次目标 `GenerateOrderStatusReport` 探测。如果场所返回订单，对账将继续并自动重置重试计数器。

单订单查询保护：为防止在大量订单需要逐个查询时触发速率限制，引擎在每个对账周期中通过 `max_single_order_queries_per_cycle`（默认 10）限制单订单查询数量。当达到该限制时，剩余订单将延后至下一周期。引擎还会在单订单查询间加入可配置延迟（`single_order_query_delay_ms`，默认 100ms），进一步降低触发速率限制的风险。这能确保在批量查询失败而需要对数百个订单逐个查询时不会压垮场所 API。

对于超出 `open_check_lookback_mins` 的订单，将依赖此目标探测。对历史窗口较短的场所应保留较大的 lookback，并在场所时间戳滞后本地时考虑增加 `open_check_threshold_ms`，以避免将近期更新的订单误判为缺失。

这能确保在不可靠环境中交易节点仍能维持一致的执行状态。

| 设置                                 | 默认值   | 说明                                                                                                     |
| ------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------- |
| `inflight_check_interval_ms`         | 2,000 ms | 确定系统检查 in-flight 订单状态的频率。设置为 0 可禁用。                                                 |
| `inflight_check_threshold_ms`        | 5,000 ms | 超过此时间阈值后，in-flight 订单会触发向场所的状态检查。若系统部署于同机房需根据时序调整以避免竞态。     |
| `inflight_check_retries`             | 5 次重试 | 指定在首次尝试失败后，引擎对 in-flight 订单向场所核实状态的最大重试次数。                                |
| `open_check_interval_secs`           | None     | 确定以何种间隔（秒）查询场所的开放订单。设置为 None 或 0.0 可禁用。建议：结合 API 速率限制选择 5-10 秒。 |
| `open_check_open_only`               | True     | 启用时仅请求 open orders；禁用时会获取完整订单历史（资源开销大）。                                       |
| `open_check_lookback_mins`           | 60 分钟  | 持续对账时用于订单状态轮询的回溯窗口（分钟）。仅考虑在此窗口内被修改过的订单。                           |
| `open_check_threshold_ms`            | 5,000 ms | 自订单最后缓存事件起，open-order 检查生效的最小时间间隔（用于避免竞态）。                                |
| `open_check_missing_retries`         | 5 次重试 | 对于在缓存中处于 open 状态但在场所未找到的订单，应用终态前允许的最大重试次数，防止竞态导致误判。         |
| `max_single_order_queries_per_cycle` | 10       | 每个对账周期允许的单订单查询最大数。用于防止在大量订单需要单独查询时触发速率限制。                       |
| `single_order_query_delay_ms`        | 100 ms   | 单订单查询之间的延迟（毫秒），用于防止速率限制触发。                                                     |
| `reconciliation_startup_delay_secs`  | 10.0 s   | 在启动对账完成后再开始持续对账循环之前施加的额外延迟（秒），用于系统额外稳定化。                         |
| `own_books_audit_interval_secs`      | None     | 审计 own order books 与公共委托簿不同步的间隔（秒）。用于验证同步并记录不一致的情况。                    |

:::warning
重要配置指南：

- **`open_check_lookback_mins`**：不要将其设置得低于 60 分钟。该回溯窗口必须足够大以匹配你所用场所的订单历史保留策略。设置过短可能在内置保护机制下仍触发误判，因为订单可能只是超出了查询窗口而非真的丢失。
- **`reconciliation_startup_delay_secs`**：在生产环境中不要将其设置得低于 10 秒。该延迟是在启动对账完成后再开始持续检查，有助于系统稳定，防止持续检查紧跟启动对账而引起竞态。

:::

#### 附加选项

以下附加选项提供了对执行行为的进一步控制：

| 设置                               | 默认值 | 说明                                                                                                                                   |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_missing_orders`          | True   | 当需要对齐持仓差异时，会在对账期间生成 `LIMIT` 类型的订单。这些订单使用策略 ID `INTERNAL-DIFF`，并通过计算精确价格来达到目标平均持仓。 |
| `snapshot_orders`                  | False  | 是否在订单事件时拍摄订单快照（snapshot）。                                                                                             |
| `snapshot_positions`               | False  | 是否在持仓事件时拍摄持仓快照。                                                                                                         |
| `snapshot_positions_interval_secs` | None   | 启用持仓快照时的间隔（秒）。                                                                                                           |
| `debug`                            | False  | 启用调试模式以输出更多执行日志。                                                                                                       |

#### 内存管理

目的：定期从内存缓存中清理已关闭的订单、已关闭的持仓和账户事件，以优化长时间运行 / 高频（HFT）操作期间的资源使用和性能。

| 设置                                   | 默认值 | 说明                                                                                                       |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| `purge_closed_orders_interval_mins`    | None   | 多久（分钟）清理一次内存中的已关闭订单。建议：10-15 分钟。该设置不会影响数据库中的记录。                   |
| `purge_closed_orders_buffer_mins`      | None   | 一个订单必须在内存中处于已关闭状态多长时间才会被清理（分钟）。建议：60 分钟以确保相关流程完成。            |
| `purge_closed_positions_interval_mins` | None   | 多久（分钟）清理一次内存中的已关闭持仓。建议：10-15 分钟。该设置不会影响数据库中的记录。                   |
| `purge_closed_positions_buffer_mins`   | None   | 一个持仓必须在内存中处于已关闭状态多长时间才会被清理（分钟）。建议：60 分钟以确保相关流程完成。            |
| `purge_account_events_interval_mins`   | None   | 多久（分钟）清理一次内存中的账户事件。建议：10-15 分钟。该设置不会影响数据库中的记录。                     |
| `purge_account_events_lookback_mins`   | None   | 账户事件发生多长时间后才会被清理（分钟）。建议：60 分钟。                                                  |
| `purge_from_database`                  | False  | 如果启用，清理操作也会从后端数据库（Redis/PostgreSQL）中删除数据，而不仅仅是从内存中清理。**请谨慎使用**。 |

通过合理配置这些内存管理设置，你可以防止在长时间运行或高频交易时内存使用无限增长，同时确保近期关闭的订单、持仓和账户事件仍保留在内存中以供正在运行的流程使用。

#### 队列管理

目的：处理订单事件的内部缓冲，保证数据流顺畅，防止系统资源过载。

| 设置                             | 默认值  | 说明                                                                                  |
| -------------------------------- | ------- | ------------------------------------------------------------------------------------- |
| `qsize`                          | 100,000 | 设置内部队列缓冲区的大小，用于管理引擎内部的数据流。                                  |
| `graceful_shutdown_on_exception` | False   | 当消息队列处理期间发生意外异常（不包括用户 actor/策略异常）时，系统是否执行优雅关闭。 |

### 策略配置

`StrategyConfig` 类定义了策略的配置，确保每个策略使用正确参数运行并有效管理订单。完整参数列表见 `StrategyConfig` 的 [API 参考](../api_reference/config#class-strategyconfig)。

#### 标识（Identification）

目的：为每个策略提供唯一标识，避免冲突并确保订单跟踪准确。

| 设置           | 默认值 | 说明                                               |
| -------------- | ------ | -------------------------------------------------- |
| `strategy_id`  | None   | 策略的唯一 ID，用于区分不同策略。                  |
| `order_id_tag` | None   | 策略订单的唯一标签，用于在多个策略间区分订单来源。 |

#### 订单管理

目的：控制策略级别的订单处理，包括 position-id 处理、认领相关外部订单、自动管理 OUO/OCO 等联动订单逻辑，以及追踪 GTD 到期。

| 设置                        | 默认值 | 说明                                                                                            |
| --------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| `oms_type`                  | None   | 指定 [OMS 类型](../concepts/execution#oms-configuration)，用于 position id 处理和订单处理流程。 |
| `use_uuid_client_order_ids` | False  | 是否使用 UUID4 作为 client order id（某些场所例如 Coinbase Intx 需要）。                        |
| `external_order_claims`     | None   | 列出策略应认领的外部订单的 instrument id，帮助准确管理外部订单。                                |
| `manage_contingent_orders`  | False  | 启用时策略会自动管理联动订单（OUO/OCO），减少手动干预。                                         |
| `manage_gtd_expiry`         | False  | 启用时策略会管理 GTD 到期，确保订单按预期保持或过期。                                           |

### Windows 信号处理

:::warning
Windows：asyncio 的事件循环不支持 `loop.add_signal_handler`。因此，在 Windows 上，legacy `TradingNode` 无法通过 asyncio 接收操作系统信号。请使用 Ctrl+C（SIGINT）处理或通过编程方式触发关闭；在 Windows 上不应期望有完整的 SIGTERM 行为。
:::

在 Windows 上，asyncio 事件循环不实现 `loop.add_signal_handler`，因此无法像类 Unix 系统那样接入 OS 信号。结果是 `TradingNode` 无法通过 asyncio 接收操作系统信号，除非你显式介入，否则不会优雅地停止。

推荐的 Windows 做法：

- 用 `try/except KeyboardInterrupt` 包裹 `run`，在捕获到 KeyboardInterrupt 后调用 `node.stop()`，随后调用 `node.dispose()`。在 Windows 上按 Ctrl+C 会在主线程抛出 `KeyboardInterrupt`，这是一个可用的清理路径。
- 或者，以编程方式发布 `ShutdownSystem` 命令（或从 actor/组件中调用 `shutdown_system(...)`）来触发相同的关闭路径。

“inflight check loop task still pending” 的提示常见于 Windows 上，因为缺乏 asyncio 信号处理意味着正常的优雅关闭路径没有被触发。

此问题已作为增强请求在 legacy 路径中跟踪以支持 Windows 的 Ctrl+C（SIGINT）：
[https://github.com/nautechsystems/nautilus_trader/issues/2785](https://github.com/nautechsystems/nautilus_trader/issues/2785)。

对于新的 v2 系统，`LiveNode` 已经通过 `tokio::signal::ctrl_c()` 与 Python SIGINT 桥接支持 Ctrl+C，因此运行器会干净地停止并关闭任务。

Windows 下的示例模式：

```python
try:
    node.run()
except KeyboardInterrupt:
    pass
finally:
    try:
        node.stop()
    finally:
        node.dispose()
```

## 执行对账（Execution reconciliation）

执行对账是将外部“现实”（订单与持仓的实际状态——包括已关闭和未关闭）与系统基于事件构建的内部状态对齐的过程。
该过程主要适用于实盘交易，因此只有 `LiveExecutionEngine` 拥有对账能力。

对账有两种主要场景：

- **已有缓存执行状态**：当存在缓存的执行状态时，系统会使用场所返回的报告来生成缺失事件，以对齐内部状态。
- **无缓存执行状态**：当没有缓存状态时，系统会从头生成场所存在的所有订单与持仓。

:::tip
最佳实践：将所有执行事件持久化到缓存数据库，以减少对场所历史的依赖，确保即使回溯窗口较短也能完整恢复。
:::

### 对账配置

除非将 `reconciliation` 配置参数设置为 false 来禁用对账，否则执行引擎会对每个场所执行对账流程。你也可以通过设置 `reconciliation_lookback_mins` 来指定对账的回溯窗口。

:::tip
建议不要显式设置 `reconciliation_lookback_mins`，这样系统在对场所发起请求时可以使用该场所可提供的最大执行历史来进行对账。
:::

:::warning
如果对账回溯窗口之前发生过执行事件，系统会生成必要的事件来对齐内外状态。这样可能会造成一些信息丢失，这些信息本可通过更长的回溯窗口避免。

另外，一些场所在特定条件下可能会筛选或丢弃执行信息，导致对账时丢失部分信息。如果将所有事件持久化在缓存数据库中，这类问题则不会发生。
:::

每个策略还可以通过 `external_order_claims` 配置参数声明在对账期间要认领的外部订单（按 instrument id）。当系统启动且没有缓存状态时，这对于策略恢复并继续管理已存在的开放订单非常有用。

在持仓对账过程中生成的策略 ID 为 `INTERNAL-DIFF` 的订单是引擎内部生成的，不能通过 `external_order_claims` 被认领。它们仅用于对齐持仓差异，不应由用户策略管理。

完整的 Live 交易可配置项请参见 `LiveExecEngineConfig` 的 [API 参考](../api_reference/config#class-liveexecengineconfig)。

### 对账过程

对账过程在所有 adapter 执行客户端中统一，使用下列方法生成执行的 mass status：

- `generate_order_status_reports`
- `generate_fill_reports`
- `generate_position_status_reports`

系统随后以这些报告（代表外部“现实”）为准进行对齐：

- **重复性检查（Duplicate Check）**：
  - 检查重复的 client order id 与 trade id。
  - 若存在重复的 client order id，会导致对账失败以防止状态损坏。
- **订单对账（Order Reconciliation）**：
  - 生成并应用必要事件以将订单从任意缓存状态更新到当前状态。
  - 如果缺少成交报告（trade reports），会生成推断的 `OrderFilled` 事件。
  - 若某个 client order id 无法识别或某个订单报告缺少 client order id，则会生成外部订单事件。
  - 对成交报告的数据一致性会使用价格与手续费差异的容差比较来验证。
- **持仓对账（Position Reconciliation）**：
  - 使用合约/品种的精度处理，确保每个 instrument 的净持仓与场所返回的持仓报告一致。
  - 若基于订单对账得到的持仓状态与外部状态不一致，会生成外部订单事件以解决差异。
  - 当启用 `generate_missing_orders`（默认 True）时，会生成策略 ID 为 `INTERNAL-DIFF` 的订单来修正对账过程中发现的持仓差异。
  - 层级化的价格确定策略确保即便数据有限也能推进对账：
    1. 计算型对账价格（首选）：使用对账价格函数以达到目标平均持仓价格
    2. 市场中点价（market mid-price）：若无法计算对账价格，则回落到当前买卖价中点
    3. 当前持仓均价：若没有市场数据则使用现有持仓的平均价格
    4. 市价单（MARKET order，最后手段）：当没有任何价格信息可用（无持仓、无市场数据）时，生成市价单
  - 当可以确定价格时优先使用 LIMIT 订单（情形 1-3），以确保 PnL 计算准确
  - 市价单仅在没有任何可用定价数据的新启动场景下作为最后手段
  - 在精度四舍五入后为零的数量差异会被优雅地处理。
- **异常处理**：
  - 单个 adapter 的失败不会导致整个对账流程中止。
  - 当成交报告先到而订单状态报告缺失时，会以容错方式处理。

若对账失败，系统将无法继续启动，并会记录错误日志。

### 常见对账场景

下面场景分为启动对账（mass status）和运行时/持续检查（in-flight 订单检查、open-order 轮询、own-books 审计）。

#### 启动对账

| 场景                       | 描述                                                                  | 系统行为                                                                         |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **订单状态不一致**         | 本地订单状态与场所不同（例如本地为 `SUBMITTED`，场所为 `REJECTED`）。 | 更新本地订单以匹配场所状态并发出缺失事件。                                       |
| **漏掉的成交**             | 场所成交了订单但引擎未接收到成交事件。                                | 生成缺失的 `OrderFilled` 事件。                                                  |
| **多次成交**               | 订单有多次部分成交，引擎丢失了部分成交记录。                          | 从场所报告重构完整的成交历史。                                                   |
| **外部订单**               | 场所存在但本地缓存中没有的订单（由外部或其他系统下达）。              | 根据场所报告创建订单并标记为 `EXTERNAL`。                                        |
| **部分成交后被取消**       | 订单部分成交后被场所取消。                                            | 更新订单为 `CANCELED`，但保留成交历史。                                          |
| **成交数据不一致**         | 场所报告的成交价格/手续费与缓存不同。                                 | 保留缓存中的成交数据，并记录报告与缓存的不一致。                                 |
| **被过滤的订单**           | 通过配置被标记为过滤的订单。                                          | 基于 `filtered_client_order_ids` 或合约过滤规则跳过对账。                        |
| **重复 client order id**   | 场所报告中存在相同 client order id 的多个订单。                       | 为防止状态损坏，对账失败并停止。                                                 |
| **持仓数量不匹配（多头）** | 内部多头持仓与外部不同（例如内部 100，外部 150）。                    | 当 `generate_missing_orders=True` 时，生成 BUY LIMIT 订单并计算对账价格以补差。  |
| **持仓数量不匹配（空头）** | 内部空头持仓与外部不同（例如内部 -100，外部 -150）。                  | 当 `generate_missing_orders=True` 时，生成 SELL LIMIT 订单并计算对账价格以补差。 |
| **持仓减少**               | 外部持仓小于内部持仓（例如内部 150 多头，外部 100 多头）。            | 生成相反方向的 LIMIT 订单并计算价格以减少持仓。                                  |
| **持仓方向反转**           | 内部持仓与外部方向相反（例如内部 100 多头，外部 50 空头）。           | 生成 LIMIT 订单并计算价格以先平内盘并开仓对方方向。                              |
| **INTERNAL-DIFF 订单**     | 持仓对账期间生成的策略 ID 为 `INTERNAL-DIFF` 的订单。                 | 不会被过滤（regardless of `filter_unclaimed_external_orders`）。                 |

#### 运行时/持续检查

| 场景                       | 描述                                          | 系统行为                                                                                        |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **in-flight 订单超时**     | in-flight 订单长时间未确认超过阈值。          | 在 `inflight_check_retries` 后将其解析为 `REJECTED` 以保持一致性状态。                          |
| **open orders 检查不一致** | 周期性 open-orders 轮询发现场所状态变化。     | 在 `open_check_interval_secs` 时确认状态（考虑 `open_check_open_only`）并在状态变化时应用转换。 |
| **own books 审计不匹配**   | 内部 own order books 与场所公开委托簿不一致。 | 在 `own_books_audit_interval_secs` 时执行审计并记录不一致以供调查。                             |

### 常见对账问题

- **缺少成交报告**：某些场所会筛除更早的成交记录，导致对账不完整。请增加 `reconciliation_lookback_mins` 或确保将所有事件缓存到本地。
- **持仓不匹配**：如果外部订单早于回溯窗口发生，持仓可能不会对齐。可在重启系统前平掉账户以重置状态。
- **重复订单 ID**：mass status 报告中存在重复的 client order id 会导致对账失败。请确保场所数据完整性或联系支持。
- **精度差异**：持仓数量的小数差异会按品种精度自动处理，但较大的差异可能意味着存在缺失订单。
- **报告乱序**：成交报告早于订单状态报告到达时，会被延迟处理直到订单状态可用。

:::tip
对于持续性对账问题，考虑在重启系统前清除缓存状态或平掉账户。
:::
