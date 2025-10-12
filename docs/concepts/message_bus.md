# 消息总线

`MessageBus`（消息总线）是平台的核心组成部分之一，通过消息传递实现系统组件之间的通信。该设计带来松耦合的架构，使组件能够在不直接依赖彼此的情况下进行交互。

消息传递模式（messaging patterns）包括：

- 点对点（Point-to-Point）
- 发布/订阅（Publish/Subscribe）
- 请求/响应（Request/Response）

通过 `MessageBus` 交换的消息大致可分为三类：

- Data（数据）
- Events（事件）
- Commands（命令）

## 数据与信号发布

虽然 `MessageBus` 属于较底层的组件，通常用户并不会直接频繁操作它，但 `Actor` 和 `Strategy` 类在其基础上提供了更便捷的方法：

```python
def publish_data(self, data_type: DataType, data: Data) -> None:
def publish_signal(self, name: str, value, ts_event: int | None = None) -> None:
```

这些方法让你在不直接使用 `MessageBus` 接口的情况下，也能高效地发布自定义数据和信号。

## 直接访问

对于高级用法或特殊场景，可以在 `Actor` 和 `Strategy` 中通过 `self.msgbus` 直接访问消息总线，`self.msgbus` 提供完整的消息总线接口。

若要直接发布自定义消息，可以将主题（topic）指定为 `str`，消息载荷可以是任意 Python 对象，例如：

```python
self.msgbus.publish("MyTopic", "MyMessage")
```

## 消息风格

NautilusTrader 是一个以事件驱动（event-driven）为核心的框架，组件之间通过发送和接收消息进行通信。了解不同的消息风格对构建高质量的交易系统至关重要。

本指南说明 NautilusTrader 中可用的三种主要消息模式：

| **消息风格**                             | **目的**               | **适用场景**                               |
| :--------------------------------------- | :--------------------- | :----------------------------------------- |
| **MessageBus - 按 topic 发布/订阅**      | 低层、直接访问消息总线 | 自定义事件、系统级通信                     |
| **基于 Actor 的数据发布/订阅（Data）**   | 结构化交易数据交换     | 交易指标、需要持久化的数据或需序列化的数据 |
| **基于 Actor 的信号发布/订阅（Signal）** | 轻量级通知             | 简单告警、标志、状态更新                   |

每种方式各有侧重与优势，本指南将帮助你在实际应用中选择合适的消息传递方式。

### 使用 MessageBus 按 topic 发布/订阅

#### 概念

`MessageBus` 是 NautilusTrader 中所有消息的中央枢纽。它实现了发布/订阅（publish/subscribe）模式：组件可以将事件发布到命名的主题（named topics），其他组件订阅这些主题以接收消息。这样组件之间不需要直接引用对方，从而实现解耦。

#### 关键优点与适用场景

当你需要下列功能时，消息总线是一种理想方案：

- 在系统内部进行跨组件通信（cross-component communication）。
- 自由定义任意主题并发送任意类型的载荷（任何 Python 对象）。
- 发布者与订阅者无需相互了解，实现解耦。
- 全局广播，多个订阅者可同时接收消息。
- 处理不适合放入预定义 `Actor` 模型的事件。
- 需要对消息传递有完全控制的高级场景。

#### 注意事项

- 需要手动管理主题名称（拼写错误可能导致消息丢失）。
- 需要手动定义处理函数（handlers）。

#### 快速示例代码

```python
from nautilus_trader.core.message import Event

# 定义自定义事件
class Each10thBarEvent(Event):
    TOPIC = "each_10th_bar"  # 主题名
    def __init__(self, bar):
        self.bar = bar

# 在组件中订阅（例如 Strategy）
self.msgbus.subscribe(Each10thBarEvent.TOPIC, self.on_each_10th_bar)

# 发布事件（例如 Strategy 中）
event = Each10thBarEvent(bar)
self.msgbus.publish(Each10thBarEvent.TOPIC, event)

# 处理函数（例如 Strategy 中）
def on_each_10th_bar(self, event: Each10thBarEvent):
    self.log.info(f"Received 10th bar: {event.bar}")
```

#### 完整示例

[MessageBus Example](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/backtest/example_09_messaging_with_msgbus)

### 基于 Actor 的数据发布/订阅（Data）

#### 概念

该方法用于在系统中的 `Actor` 之间交换交易相关的结构化数据。（注意：每个 `Strategy` 都继承自 `Actor`。）数据类型继承自 `Data`，从而保证事件具有正确的时间戳和顺序，这对回测准确性至关重要。

#### 关键优点与适用场景

当你需要下列场景时，基于 Data 的发布/订阅非常合适：

- 交换结构化的交易数据，例如市场数据、指标、自定义度量或期权希腊值（greeks）。
- 通过内建时间戳（`ts_event`、`ts_init`）保证事件顺序，这对回测正确性非常重要。
- 通过 `@customdataclass` 装饰器支持数据持久化与序列化，能无缝接入 NautilusTrader 的数据目录（data catalog）。
- 在系统组件之间实现标准化的数据交换。

#### 注意事项

- 需要定义继承自 `Data` 的类或使用 `@customdataclass`。

#### 继承自 `Data` 与 使用 `@customdataclass` 的差异

**继承自 `Data` 类：**

- 要求子类实现抽象属性 `ts_event` 和 `ts_init`，以确保回测时基于时间戳进行正确排序。

**`@customdataclass` 装饰器：**

- 如果未提供，装饰器会为类添加 `ts_event` 和 `ts_init` 属性。
- 提供序列化函数：`to_dict()`、`from_dict()`、`to_bytes()`、`to_arrow()` 等。
- 支持数据持久化与外部通信。

#### 快速示例代码

```python
from nautilus_trader.core.data import Data
from nautilus_trader.model.custom import customdataclass

@customdataclass
class GreeksData(Data):
    delta: float
    gamma: float

# 发布数据（在 Actor / Strategy 中）
data = GreeksData(delta=0.75, gamma=0.1, ts_event=1_630_000_000_000_000_000, ts_init=1_630_000_000_000_000_000)
self.publish_data(GreeksData, data)

# 订阅数据（在 Actor / Strategy 中）
self.subscribe_data(GreeksData)

# 处理函数（固定名称的静态回调）
def on_data(self, data: Data):
    if isinstance(data, GreeksData):
        self.log.info(f"Delta: {data.delta}, Gamma: {data.gamma}")
```

#### 完整示例

[Actor-Based Data Example](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/backtest/example_10_messaging_with_actor_data)

### 基于 Actor 的信号发布/订阅（Signal）

#### 概念

Signal（信号）是一个轻量级机制，用于在 Actor 框架内发布与订阅简单通知。这是最简单的消息方式，不需要定义自定义类。

#### 关键优点与适用场景

当你需要下列场景时，Signal 方式非常合适：

- 简单、轻量的通知/报警，例如 "RiskThresholdExceeded" 或 "TrendUp"。
- 免定义类即可快速临时发送消息。
- 以原始类型（`int`、`float`、`str`）广播警报或标志。
- 与已有 API 简单集成，使用 `publish_signal`、`subscribe_signal` 等方法即可。
- 多订阅者场景下，所有订阅者在消息发布时均可收到信号。
- 设置开销极小，不需要类定义。

#### 注意事项

- 每个 signal 的值只能包含单个类型：`int`、`float` 或 `str`，不支持复杂结构或其他 Python 类型。
- 在 `on_signal` 处理器中，无法通过 signal 名称进行区分，只能通过 `signal.value` 来判断信号类型。

#### 快速示例代码

```python
# 建议为信号定义常量（可选，但推荐以便组织）
import types
from nautilus_trader.core.datetime import unix_nanos_to_dt
from nautilus_trader.common.enums import LogColor

signals = types.SimpleNamespace()
signals.NEW_HIGHEST_PRICE = "NewHighestPriceReached"
signals.NEW_LOWEST_PRICE = "NewLowestPriceReached"

# 订阅信号（在 Actor/Strategy 中）
self.subscribe_signal(signals.NEW_HIGHEST_PRICE)
self.subscribe_signal(signals.NEW_LOWEST_PRICE)

# 发布信号（在 Actor/Strategy 中）
self.publish_signal(
    name=signals.NEW_HIGHEST_PRICE,
    value=signals.NEW_HIGHEST_PRICE,  # 为简单起见，value 可以与 name 相同
    ts_event=bar.ts_event,  # 触发事件的时间戳
)

# 处理函数（固定名称的静态回调）
def on_signal(self, signal):
    # 重要：通过 signal.value 匹配，而不是 signal.name
    match signal.value:
        case signals.NEW_HIGHEST_PRICE:
            self.log.info(
                f"New highest price was reached. | "
                f"Signal value: {signal.value} | "
                f"Signal time: {unix_nanos_to_dt(signal.ts_event)}",
                color=LogColor.GREEN
            )
        case signals.NEW_LOWEST_PRICE:
            self.log.info(
                f"New lowest price was reached. | "
                f"Signal value: {signal.value} | "
                f"Signal time: {unix_nanos_to_dt(signal.ts_event)}",
                color=LogColor.RED
            )
```

#### 完整示例

[Actor-Based Signal Example](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/backtest/example_11_messaging_with_actor_signals)

### 总结与决策指南

下面的速查表可帮助你决定应使用哪种消息风格：

#### 决策指南：如何选择？

| **使用场景**           | **推荐方法**                                                             | **所需配置**                                        |
| :--------------------- | :----------------------------------------------------------------------- | :-------------------------------------------------- |
| 自定义事件或系统级通信 | `MessageBus` + 按 topic 的发布/订阅                                      | 管理主题与处理函数                                  |
| 结构化交易数据         | `Actor` + Data 的发布/订阅（必要时使用 `@customdataclass` 来支持序列化） | 新建继承自 `Data` 的类（处理器 `on_data` 为预定义） |
| 简单报警/通知          | `Actor` + Signal 的发布/订阅                                             | 仅需信号名称                                        |

## 外部发布

当消息总线配置了外部 backing（例如某种数据库或消息代理）并提供相应的集成时，便可以将消息发布到外部系统。

:::info
当前对外部可序列化消息的支持实现了 Redis。最低支持的 Redis 版本为 6.2（需要 streams 功能）。更多信息请参见 [https://redis.io/docs/latest/develop/data-types/streams/](https://redis.io/docs/latest/develop/data-types/streams/)。
:::

在内部实现层面，当配置了 backing（或其他兼容技术）后，所有外发消息会先被序列化，然后通过一个多生产单消费者（MPSC）通道发送到一个独立线程（以 Rust 实现）。在该独立线程中，消息被写入最终目标（当前为 Redis streams）。

此设计主要出于性能考虑：将 I/O 操作（例如与数据库或客户端交互）移出主线程，可以保证主线程不被阻塞，继续处理实时任务。

### 序列化

Nautilus 的序列化支持包括：

- 所有 Nautilus 内置类型（序列化为包含可序列化基元的字典：`dict[str, Any]`）。
- Python 原始类型（`str`、`int`、`float`、`bool`、`bytes`）。

你也可以通过 `serialization` 子包为自定义类型添加序列化支持：

```python
def register_serializable_type(
    cls,
    to_dict: Callable[[Any], dict[str, Any]],
    from_dict: Callable[[dict[str, Any]], Any],
):
    ...
```

- `cls`：要注册的类型。
- `to_dict`：将对象转换为仅包含基元类型的字典的函数。
- `from_dict`：从字典恢复对象的函数。

## 配置

可以通过导入 `MessageBusConfig` 并将其传入你的 `TradingNodeConfig` 来配置消息总线的外部 backing。下面将介绍各项配置选项。

```python
...  # 省略其他配置
message_bus=MessageBusConfig(
    database=DatabaseConfig(),
    encoding="json",
    timestamps_as_iso8601=True,
    buffer_interval_ms=100,
    autotrim_mins=30,
    use_trader_prefix=True,
    use_trader_id=True,
    use_instance_id=False,
    streams_prefix="streams",
    types_filter=[QuoteTick, TradeTick],
)
...
```

### 数据库配置

必须提供一个 `DatabaseConfig`。对于本机 loopback 上的默认 Redis 配置，可直接传入 `DatabaseConfig()`，其会使用默认值。

### 编码（Encoding）

内置 `Serializer` 当前支持两种编码：

- JSON（`json`）
- MessagePack（`msgpack`）

通过 `encoding` 配置选项控制消息写入时所用的编码。

:::tip
默认使用 `msgpack` 编码，因为它在序列化和内存性能上更优。如果可读性比性能更重要，建议使用 `json`。
:::

### 时间戳格式

默认情况下，时间戳以 UNIX epoch 纳秒整数表示。也可以将 `timestamps_as_iso8601` 设置为 `True`，以使用 ISO 8601 字符串格式。

### 消息流（stream）键

消息流键用于识别各个交易节点并组织流内消息。键格式可按需定制。在消息流上下文中，一个典型的 trader key 结构如下：

```
trader:{trader_id}:{instance_id}:{streams_prefix}
```

以下是可配置的选项：

#### Trader 前缀

是否在键前添加 `trader` 前缀字符串。

#### Trader ID

是否在键中包含该节点的 trader ID。

#### Instance ID

每个交易节点都分配有一个唯一的 instance ID（UUIDv4），用于区分分布在多条流上的不同实例。通过将 `use_instance_id` 设为 `True` 可以将其包含在 trader key 中，这在多节点系统中跟踪实例时非常有用。

#### Streams 前缀

`streams_prefix` 字符串可以用于将某一实例的所有流分组或对多个实例的流进行组织。通过配置 `streams_prefix` 并关闭其他前缀选项，可获得更一致的键名空间。

#### 每主题单独流（Stream per topic）

指示生产者是否为每个主题写入独立的流。对于 Redis backing 特别有用，因为 Redis 在监听 streams 时不支持通配符主题。如果设为 False，则所有消息写入同一条流。

:::info
Redis 不支持通配符 stream topics。为兼容 Redis，建议将此选项设为 False。
:::

### 类型过滤（Types filtering）

当消息在消息总线上发布且配置了外部 backing 时，消息会被序列化并写入流。为避免高频报价等数据淹没流，你可以在外部发布时过滤掉某些类型的消息。

要启用此过滤机制，请在 message bus 配置的 `types_filter` 参数中传入要排除的类型列表（`type` 对象）。

```python
from nautilus_trader.config import MessageBusConfig
from nautilus_trader.data import TradeTick
from nautilus_trader.data import QuoteTick

# 使用 types_filter 创建 MessageBusConfig 实例
message_bus = MessageBusConfig(
    types_filter=[QuoteTick, TradeTick]
)

```

### 自动裁剪（Stream auto-trimming）

配置项 `autotrim_mins` 用于指定对消息流执行自动裁剪（自动删除较旧消息）的回溯窗口（以分钟为单位）。自动裁剪有助于控制流的大小，防止存储与性能问题。

:::info
当前 Redis 实现将 `autotrim_mins` 当作最大宽度来维护（外加大约一分钟的余量，因为流的裁剪操作不会每分钟执行多次）。这并非基于当前墙钟时间的最大回溯窗口。
:::

## 外部流（External streams）

`TradingNode`（节点）内部使用的消息总线称为“内部消息总线（internal message bus）”。
生产者节点（producer node）会将消息发布到外部流（参见上文“外部发布”）。
消费者节点（consumer node）监听外部流，接收并反序列化消息后再在其内部消息总线上发布这些消息。

```txt
                  ┌───────────────────────────┐
                  │                           │
                  │                           │
                  │                           │
                  │      Producer Node        │
                  │                           │
                  │                           │
                  │                           │
                  │                           │
                  │                           │
                  │                           │
                  └─────────────┬─────────────┘
                                │
                                │
┌───────────────────────────────▼──────────────────────────────┐
│                                                              │
│                            Stream                            │
│                                                              │
└─────────────┬────────────────────────────────────┬───────────┘
              │                                    │
              │                                    │
┌─────────────▼───────────┐          ┌─────────────▼───────────┐
│                         │          │                         │
│                         │          │                         │
│     Consumer Node 1     │          │     Consumer Node 2     │
│                         │          │                         │
│                         │          │                         │
│                         │          │                         │
│                         │          │                         │
│                         │          │                         │
│                         │          │                         │
└─────────────────────────┘          └─────────────────────────┘
```

:::tip
在 `LiveDataEngineConfig.external_clients` 中列出那些代表外部流客户端的 `client_id`。
`DataEngine` 会为这些外部客户端过滤掉相应的订阅命令，保证外部流提供所需的数据订阅。
:::

### 示例配置

下面示例展示了生产者节点将 Binance 数据发布到外部流，随后下游的消费者节点将这些数据发布到其内部消息总线的配置方法。

#### 生产者节点

将生产者节点的 `MessageBus` 配置为发布到名为 `"binance"` 的流。将 `use_trader_id`、`use_trader_prefix` 和 `use_instance_id` 全部设为 `False`，以确保生成一个简单且可预测的流键，方便消费者节点进行注册。

```python
message_bus=MessageBusConfig(
    database=DatabaseConfig(timeout=2),
    use_trader_id=False,
    use_trader_prefix=False,
    use_instance_id=False,
    streams_prefix="binance",  # <---
    stream_per_topic=False,
    autotrim_mins=30,
),
```

#### 消费者节点

将消费者节点的 `MessageBus` 配置为接收相同的 `"binance"` 流。节点将监听外部流键，并将接收到的消息发布到其内部消息总线。此外，我们把客户端 ID `"BINANCE_EXT"` 声明为外部客户端，这样 `DataEngine` 就不会向该客户端发送数据命令，因为我们期望这些消息由外部流推送并由节点内部总线分发。

```python
data_engine=LiveDataEngineConfig(
    external_clients=[ClientId("BINANCE_EXT")],
),
message_bus=MessageBusConfig(
    database=DatabaseConfig(timeout=2),
    external_streams=["binance"],  # <---
),
```
