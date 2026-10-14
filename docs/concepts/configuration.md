# 配置 {#configuration}

NautilusTrader 为数据客户端、执行客户端、引擎和策略使用强类型配置对象。更高层的配置由这些组件配置组合而成。例如，`LiveNodeConfig` 持有节点核心组件的设置。适配器客户端通过 `LiveNode.builder(...)` 注册。当能力或凭据不同时，适配器会分别维护数据客户端与执行客户端的配置。

## 设计原则 {#design-principles}

### 具体类型字段承载已解析的值 {#concrete-fields-carry-resolved-values}

当组件需要一个已解析的设置项时，Rust 配置字段通常承载具体值。
例如，适配器的超时、重试次数、退避延迟和心跳间隔常用 `u64` 或 `u32` 这类普通类型。构造时这些字段在组件启动前就已解析，下游代码可以直接使用，无需重复默认值逻辑。

### Option 语义由字段决定 {#option-semantics-are-field-specific}

在存储的 Rust 配置中，`Option<T>` 要么是 `Some(value)`，要么是 `None`。存储的值不会记录调用方是否省略了某个输入。组件可以把 `None` 解释为禁用某功能、让回看窗口不设上限、回退到运行时环境，或应用内部默认值。**字段的含义由字段文档定义**。

这一区分让配置语义在类型上可见。普通 `u64` 永远有值，而消费 `Option<u64>` 的代码需要处理缺失的情况。

### 默认值因类型而异 {#defaults-are-type-specific}

Rust 配置类型通过 `#[builder(default = value)]` 注解、自定义 `Default` 实现，或两者兼有来定义默认值。PyO3 构造函数一般从 Rust 的 `Default` 实现解析省略的具体参数，而不是另行维护一套 Python 默认值。

配置结构体上的容器级 `#[serde(default)]` 会用该配置自身的 `Default` 实现填充缺失的序列化字段。字段级 `#[serde(default)]` 则使用字段类型的默认值，除非属性另外指定了函数。

`Type::default()` 与 `Type::builder().build()` 是两条独立的构造路径。自定义 `Default` 实现可能把部分构造委托给 builder，但这因类型而异。除非实现或文档保证，不要认为两条路径可以互换。

### 未知字段的处理取决于构造路径 {#unknown-field-handling-depends-on-the-construction-path}

Rust 反序列化和 Python 构造函数绑定各自独立地强制未知字段检查：

- **Rust**：例如 `BybitDataClientConfig` 使用 `#[serde(deny_unknown_fields)]`，会拒绝多余的序列化键。没有该属性的 Rust 类型可能接受它们。
- **Python**：固定的配置构造函数遇到不支持的关键字会抛出 `TypeError`。`DataActorConfig`、`StrategyConfig` 和 `ExecutionAlgorithmConfig` 接受额外关键字，供 Python 子类使用。

不要用一条构造路径的严格程度推断另一条。

## Python 配置 {#python-configs}

核心配置类型从 `nautilus_trader.config` 导入。适配器配置从适配器的公共模块导入，例如 `nautilus_trader.adapters.bybit`。

多数运行时配置类是 Rust 配置结构体的 PyO3 包装。在 Python 构造函数中，省略签名默认值为 `None` 的参数，与显式传入 `None` 等价。之后包装层视字段而定，要么选用 Rust 默认值，要么保留缺失的可选值。请查阅字段文档，不要从 Python 注解推断行为。

属性会暴露部分配置值。持有密钥的配置可能省略其值，或只暴露存在性检查。在展示或记录配置之前，先查阅该配置的 API。

可变性因类型而异：许多配置只提供只读 getter，可扩展的组件配置和部分适配器配置则提供文档化的 setter。`DataActorConfig`、`StrategyConfig` 和 `ExecutionAlgorithmConfig` 还允许 Python 子类添加额外字段。纯 Python 的分析配置保持其文档化的 dataclass 行为。

```python
from nautilus_trader.adapters.bybit import BybitDataClientConfig

omitted = BybitDataClientConfig()
explicit_none = BybitDataClientConfig(
    http_timeout_secs=None,
    base_url_http=None,
)
assert omitted.http_timeout_secs == explicit_none.http_timeout_secs == 60
assert omitted.base_url_http is explicit_none.base_url_http is None

# Override the timeout
config = BybitDataClientConfig(http_timeout_secs=30)

# Read the resolved value
assert config.http_timeout_secs == 30
```

当包装层把 `None` 映射为非 `None` 的 Rust 默认值时，Python 无法用该参数存储 Rust 的 `None`。例如，给 `BybitDataClientConfig` 传 `instrument_status_poll_secs=None` 会保留其 60 秒默认值。Rust 调用方可以把 `instrument_poll_interval_secs` 设为 `None`，以禁用周期性的工具与状态轮询。

## Rust 配置 {#rust-configs}

许多 Rust 配置结构体派生自 [`bon::Builder`](https://bon-rs.com)，它会生成类型安全的 builder，在编译期检查必填字段。声明了 builder 默认值的字段可以省略。

请使用配置类型文档推荐的构造方式。以 `DataEngineConfig` 为例，下面的 builder 形式和 struct update 形式都能启用 delta 缓冲，并让其他字段保持声明的默认值：

```rust
use nautilus_data::engine::config::DataEngineConfig;

let with_builder = DataEngineConfig::builder()
    .buffer_deltas(true)
    .build();

let with_struct_update = DataEngineConfig {
    buffer_deltas: true,
    ..Default::default()
};
```

无需覆盖任何字段时使用 `DataEngineConfig::default()`。

## 适配器配置字段 {#adapter-config-fields}

这些名字在适配器配置中反复出现，但类型和默认值取决于具体的适配器和客户端。例如 `BybitDataClientConfig` 定义了以下字段，`Default` 列展示 `BybitDataClientConfig::default()` 的取值：

| Rust 字段                       | Rust 类型     | 默认值     | 用途                           |
| ------------------------------- | ------------- | ---------- | ------------------------------ |
| `http_timeout_secs`             | `u64`         | `60`       | REST 请求超时。                |
| `max_retries`                   | `u32`         | `3`        | 最大重试次数。                 |
| `retry_delay_initial_ms`        | `u64`         | `1_000`    | 初始退避延迟。                 |
| `retry_delay_max_ms`            | `u64`         | `10_000`   | 最大退避延迟。                 |
| `heartbeat_interval_secs`       | `u64`         | `20`       | WebSocket 保活间隔。           |
| `recv_window_ms`                | `u64`         | `5_000`    | 签名请求有效窗口。             |
| `instrument_poll_interval_secs` | `Option<u64>` | `Some(60)` | 金融工具与状态轮询。           |

Python 将 `instrument_poll_interval_secs` 暴露为 `instrument_status_poll_secs`。

而 `BybitDataClientConfig::builder().build()` 会让 `instrument_poll_interval_secs` 保持为 `None`，即禁用周期性的工具与状态轮询。这是该类型 **default 路径与 builder 路径不一致** 的一个例子。

限流、轮询间隔、保证金模式等适配器专有字段在[集成指南](./../integrations/index.md)中说明。

## 引擎配置 {#engine-configs}

引擎配置采用同样的强类型字段方式。在 `LiveExecutionEngineConfig` 中，`reconciliation`、`inflight_check_interval_ms`、`open_check_threshold_ms` 等字段有具体的默认值：

| 字段                         | 默认值    | 用途                                                   |
| ---------------------------- | --------- | ------------------------------------------------------ |
| `reconciliation`             | `True`    | 启动时执行对账。                                       |
| `inflight_check_interval_ms` | `2_000`   | 检查在途订单是否超过其阈值。                           |
| `open_check_threshold_ms`    | `5_000`   | 挂单差异持续多久后才采取行动。                         |

`open_check_interval_secs`、`position_check_interval_secs` 等可选字段用于启用或禁用对应的周期检查：

```python
from nautilus_trader.config import LiveExecutionEngineConfig

config = LiveExecutionEngineConfig(
    open_check_interval_secs=30.0,  # Enable open order polling
    open_check_lookback_mins=60,  # Look back 60 minutes
)

assert config.open_check_interval_secs == 30.0
assert config.open_check_lookback_mins == 60
assert config.position_check_interval_secs is None  # Disabled by default
```

启动后，只要有可用的执行客户端，该配置就会每 30 秒调度一次挂单报告请求，每次只覆盖前 60 分钟；不会调度周期性的持仓报告请求。传入的周期间隔必须是正的、有限的、至少一纳秒的值。

单独的 `reconciliation` 字段用于启用启动对账，默认为 `True`。间隔字段独立控制周期检查。启动对账启用时，`reconciliation_startup_delay_secs` 还会推迟启动后第一次周期检查。该延迟必须有限且在 [0, 86400] 秒之间。

实时引擎的完整选项见
[ExecutionEngine 配置](./../how_to/configure_live_trading.md#executionengine-configuration)。
