# 日志

该平台为回测（backtesting）和实盘（live trading）都提供日志功能，采用用 Rust 实现的高性能日志子系统，
并通过 `log` crate 提供统一的门面（facade）。

核心记录器在独立线程中运行，使用多生产者单消费者（MPSC）通道接收日志消息。
这种设计保证了主线程的高性能，避免了因日志字符串格式化或文件 I/O 导致的性能瓶颈。

日志输出可配置，支持：

- 用于控制台输出的 **stdout/stderr 写入器**
- 用于持久化存储的 **文件写入器**

:::info
可以集成像 [Vector](https://github.com/vectordotdev/vector) 这样的基础设施来收集并汇总系统中的事件。
:::

## 配置

可通过导入 `LoggingConfig` 对象来配置日志。默认情况下，级别为 `INFO` 及以上的日志事件会写入 stdout/stderr。

日志级别（`LogLevel`）的取值包括（大致与 Rust 的 `tracing` 级别过滤器一致）：

Python 端可使用的日志级别如下：

- `OFF`
- `TRACE`（可作为过滤级别设置，但不能直接由 Python 生成）
- `DEBUG`
- `INFO`
- `WARNING`
- `ERROR`

:::warning
Python 的 `Logger` 并不提供 `trace()` 方法；`TRACE` 级别的日志仅由底层的 Rust 组件输出，无法直接从 Python 代码生成。不过可以将 `TRACE` 设为过滤级别，以便看到来自 Rust 组件的 trace 日志。

更多细节请参见 `LoggingConfig` 的 [API 参考](../api_reference/config.md#class-loggingconfig)。
:::

日志可以通过下列方式进行配置：

- stdout/stderr 的最小 `LogLevel`
- 日志文件的最小 `LogLevel`
- 触发日志文件切分（rotation）的最大文件大小
- 切分时要保留的备份文件数量上限
- 基于日期或时间戳的自动日志文件命名，或自定义文件名
- 写入日志的目录
- 纯文本或 JSON 格式的日志文件
- 按组件按级别过滤日志
- 日志行中的 ANSI 颜色
- 完全绕过（禁用）日志子系统
- 在初始化时将 Rust 的配置打印到 stdout
- 可选通过 PyO3 桥（`use_pyo3`）初始化日志以捕获 Rust 组件发出的日志事件
- 启动时截断已存在的日志文件（`clear_log_file`）

### 控制台（stdout/stderr）日志

日志消息通过 stdout/stderr 写入控制台。最小输出级别由 `log_level` 参数控制。

### 文件日志

默认情况下，日志文件写入当前工作目录。文件命名规则和切分行为可配置，并根据设定采用不同的命名/轮转策略。

可以通过 `log_directory` 指定自定义目录，或通过 `log_file_name` 指定基础文件名。日志文件总是以 `.log`（纯文本）或 `.json`（JSON）作为后缀。

关于文件命名与轮转的详细信息，请参见下文的 [日志文件轮转](#log-file-rotation) 和 [日志文件命名规则](#log-file-naming-convention) 小节。

#### 日志文件轮转（Log file rotation）

轮转行为依赖于是否设置了大小限制以及是否提供自定义文件名：

- **基于大小的轮转（Size-based rotation）**：
  - 通过设置 `log_file_max_size` 参数启用（例如 `100_000_000` 表示 100 MB）。
  - 当写入某条日志会使当前文件超过该大小时，当前文件被关闭并新建一个文件。
- **基于日期的轮转（仅在默认命名时启用，Date-based rotation）**：
  - 在未指定 `log_file_max_size` 且未提供自定义 `log_file_name` 时适用。
  - 在每个 UTC 日期变更（零时）时关闭当前日志文件并创建新文件，按 UTC 每天生成一个文件。
- **不轮转（No rotation）**：
  - 当提供了自定义 `log_file_name` 且未设置 `log_file_max_size` 时，日志持续写入同一文件（追加）。
- **备份文件管理**：
  - 由 `log_file_max_backup_count` 参数控制（默认：5），限制保留的轮转文件总数。
  - 超出限制时，将自动删除最旧的备份文件。

#### 日志文件命名规则（Log file naming convention）

默认命名规则确保日志文件具有可识别且带时间戳的名称。具体格式取决于是否启用了文件轮转：

**启用文件轮转时**：

- **格式**：`{trader_id}_{%Y-%m-%d_%H%M%S:%3f}_{instance_id}.{log|json}`
- **示例**：`TESTER-001_2025-04-09_210721:521_d7dc12c8-7008-4042-8ac4-017c3db0fc38.log`
- **组成部分**：
  - `{trader_id}`：交易者标识（例如 `TESTER-001`）。
  - `{%Y-%m-%d_%H%M%S:%3f}`：完整的 ISO 8601 风格日期时间，精确到毫秒。
  - `{instance_id}`：唯一的实例 ID。
  - `{log|json}`：根据格式设置选择的文件后缀。

**未启用大小轮转（使用默认命名）**：

- **格式**：`{trader_id}_{%Y-%m-%d}_{instance_id}.{log|json}`
- **示例**：`TESTER-001_2025-04-09_d7dc12c8-7008-4042-8ac4-017c3db0fc38.log`
- **组成部分**：
  - `{trader_id}`：交易者标识。
  - `{%Y-%m-%d}`：仅日期（YYYY-MM-DD）。
  - `{instance_id}`：唯一的实例 ID。
  - `{log|json}`：根据格式设置选择的文件后缀。
- **注意**：在默认命名且未设置大小限制时，日志会在 UTC 零时按日轮转。

**自定义命名**：

如果设置了 `log_file_name`（例如 `my_custom_log`）：

- 在禁用轮转时：文件名将与提供的名称完全一致（例如 `my_custom_log.log`）。
- 在启用轮转时：文件名会包含自定义名称与时间戳（例如 `my_custom_log_2025-04-09_210721:521.log`）。

### 组件级别过滤（Component log filtering）

可以使用 `log_component_levels` 参数为单个组件设置日志级别。
该参数应为一个组件 ID 到日志级别字符串的字典：`dict[str, str]`。

下面是一个包含部分配置选项的 trading node 日志配置示例：

```python
from nautilus_trader.config import LoggingConfig
from nautilus_trader.config import TradingNodeConfig

config_node = TradingNodeConfig(
    trader_id="TESTER-001",
    logging=LoggingConfig(
        log_level="INFO",
        log_level_file="DEBUG",
        log_file_format="json",
        log_component_levels={ "Portfolio": "INFO" },
    ),
    ... # Omitted
)
```

用于回测时，可以使用 `BacktestEngineConfig` 类替代 `TradingNodeConfig`，两者具有相同的选项。

### 仅记录指定组件（Components-only logging）

当只关注若干噪声较大的子系统时，可启用 `log_components_only`，此时仅记录在 `log_component_levels` 中显式列出的组件。所有其他组件将被抑制，**即使** 全局 `log_level` 或文件级别更高也无效。

示例（Python 配置）：

```python
logging = LoggingConfig(
    log_level="INFO",
    log_component_levels={
        "RiskEngine": "DEBUG",
        "Portfolio": "INFO",
    },
    log_components_only=True,
)
```

如果通过环境变量并使用 Rust 的 spec 字符串进行配置，可在过滤字符串中包含 `log_components_only`，例如：

```powershell
$env:NAUTILUS_LOG = "stdout=Info;log_components_only;RiskEngine=Debug;Portfolio=Info"
```

:::warning
如果 `log_components_only=True`（或 spec 字符串中包含 `log_components_only`），但 `log_component_levels` 为空，则不会向 stdout/stderr 或文件输出任何日志。请至少添加一个组件过滤，或禁用 components-only 模式。
:::

### 日志颜色（Log Colors）

为了增强终端中日志的可读性，使用了 ANSI 颜色码。这些颜色可以帮助区分日志消息的不同部分。
在不支持 ANSI 渲染的环境中（例如某些云环境或文本编辑器），颜色码可能会以原始文本形式出现，影响可读性。

为适配此类环境，可将 `LoggingConfig.log_colors` 选项设置为 `false`。
禁用 `log_colors` 后，日志消息中将不会添加 ANSI 颜色码，从而保证在不支持颜色的环境中也能正常阅读日志。

## 直接使用 Logger

可以直接使用 `Logger` 对象，它们可以在任意位置初始化（用法与 Python 内置 `logging` API 类似）。

如果你**没有**使用已经初始化 `NautilusKernel`（及其日志）的对象，例如 `BacktestEngine` 或 `TradingNode`，可以按如下方式激活日志：

```python
from nautilus_trader.common.component import init_logging
from nautilus_trader.common.component import Logger

log_guard = init_logging()
logger = Logger("MyLogger")
```

:::info
更多细节请参见 `init_logging` 的 [API 参考](../api_reference/common)。
:::

:::warning
每个进程只能通过一次 `init_logging` 调用初始化一个日志子系统。可以同时存在多个 `LogGuard`（最多 255 个），只要仍有 `LogGuard` 未被释放，日志线程会保持活动状态。
:::

## LogGuard：管理日志生命周期

`LogGuard` 确保日志子系统在进程生命周期内保持活动并可用。
当在同一进程中运行多个引擎时，它可防止日志子系统被过早关闭。

### 引用计数实现（Reference Counting Implementation）

日志系统使用引用计数来跟踪活动的 `LogGuard` 实例：

- **计数增加**：创建新的 `LogGuard` 时，原子计数器会增加。
- **计数减少**：当 `LogGuard` 被释放（dropped）时，计数器会减少。
- **日志线程终止**：当计数降到零（最后一个 `LogGuard` 被释放）时，日志线程会被正确 join，以确保所有待写日志在进程退出前写入完毕。
- **最大 guard 数量**：系统支持最多 255 个并发的 `LogGuard` 实例，超过该数量会导致 panic。

该机制保证：

1. 日志不会因线程过早终止而丢失。
2. 只要存在任何 `LogGuard`，日志线程就会保持活动。
3. 程序结束时，所有缓冲的日志会正确刷新到目标位置。

### 为什么要使用 LogGuard？

如果没有 `LogGuard`，在同一进程中顺序运行多个引擎可能会出现如下错误：

```
Error sending log event: [INFO] ...
```

这是因为在第一个引擎被释放后，日志子系统的通道和 Rust 端的 `Logger` 会被关闭，导致后续引擎无法访问日志子系统。

通过使用 `LogGuard`，可以在多次回测或多次引擎运行中保证日志的稳定性。
`LogGuard` 会保留日志子系统的资源，确保在引擎释放和重新初始化期间日志功能保持可用。

:::note
在有多个引擎的进程中，使用 `LogGuard` 对保持一致的日志行为至关重要。
:::

## 运行多个引擎

下面示例展示了如何在同一进程中顺序运行多个引擎时使用 `LogGuard`：

```python
log_guard = None  # Initialize LogGuard reference

for i in range(number_of_backtests):
    engine = setup_engine(...)

    # Assign reference to LogGuard
    if log_guard is None:
        log_guard = engine.get_log_guard()

    # Add actors and execute the engine
    actors = setup_actors(...)
    engine.add_actors(actors)
    engine.run()
    engine.dispose()  # Dispose safely
```

### 步骤

- **只初始化一次 LogGuard**：从第一个引擎获取 `LogGuard`（`engine.get_log_guard()`）并在整个进程中保留，以保证日志子系统持续活动。
- **安全释放引擎**：每次回测完成后安全地释放引擎，而不会影响日志子系统。
- **重用 LogGuard**：为后续引擎复用同一个 `LogGuard` 实例，防止日志子系统被提前关闭。

### 注意事项

- **每个进程的多个 LogGuard**：系统支持最多 255 个并发 `LogGuard` 实例。每个 guard 在创建时会使计数器增加，释放时减小。
- **线程安全性**：日志子系统（包括 `LogGuard`）是线程安全的，即使在多线程环境中也能保证一致性。
- **自动清理**：当最后一个 `LogGuard` 被释放（引用计数归零）时，日志线程会被正确 join，确保所有待写日志在进程结束前完成写入。

## 平台相关注意事项

### Windows 关闭行为

在 Windows 平台上，解释器关闭期间的不确定性垃圾回收可能会偶尔导致日志线程无法正常 join。
当最后一个 `LogGuard` 被释放时，日志子系统会向后台线程发送关闭信号并尝试 join，以确保所有待写消息被写入。如果 Python 的垃圾回收在解释器开始关闭后才释放 guard，join 可能无法完成，从而造成日志被截断。

该问题在 GitHub 上以 issue #3027 跟踪： <https://github.com/nautechsystems/nautilus_trader/issues/3027> 。
目前正在评估一种更确定性的关闭机制。
