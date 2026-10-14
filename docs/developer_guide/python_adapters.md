# Python 适配器接口 {#python-adapter-interface}

要在独立的 Python 包中实现自定义实时适配器，使用本指南。该包可以拥有自己的
Rust/PyO3 扩展。本指南涵盖客户端接口、注册与运行时契约。平台总览见
[适配器](./../concepts/adapters.md)；树内 Rust 适配器见
[Rust 适配器指南](./adapters.md)。

自定义客户端运行在节点的 Python 事件循环上，通过 PyO3 与 Rust 引擎交换类型化对象。
客户端从 `nautilus_trader.live.clients` 派生：

| 基类         | 职责                                                       |
| ------------------ | -------------------------------------------------------------------- |
| `DataClient`       | 数据订阅与历史请求。                          |
| `MarketDataClient` | `DataClient` 的命名特化。钩子与行为完全相同。 |
| `ExecutionClient`  | 订单命令、账户更新与对账报告。         |

从[确定性适配器模板](https://github.com/nautechsystems/nautilus_trader/blob/develop/examples/live/_template/README.md)起步。
[独立 Rust/PyO3 包](#independent-rustpyo3-packages)一节展示扩展如何使用同一接口。

## 注册与配置 {#registration-and-configuration}

### 定义工厂 {#define-a-factory}

从 `nautilus_trader.live.clients` 派生 `DataClientFactory` 或
`ExecutionClientFactory`。注册其子类（带静态 `create` 方法）或其实例均可。

数据工厂实现 `create(*, name, config, cache, clock)`。执行工厂还会收到
`trader_id`。工厂**同步**返回相应的客户端子类。客户端持有传入的 config 与
cache 对象。节点在接受客户端之前校验其注册名与执行身份。

从仓库根目录运行下面的示例，注册模板的数据客户端：

```python
from nautilus_trader.config import DataClientConfig
from nautilus_trader.live import LiveNodeBuilder
from nautilus_trader.live.clients import DataClientFactory
from examples.live._template.constants import VENUE
from examples.live._template.data import TemplateDataClient
from examples.live._template.providers import TemplateInstrumentProvider


class ExampleFactory(DataClientFactory):
    @staticmethod
    def create(*, name, config, cache, clock):
        return TemplateDataClient(
            name=name,
            config=config,
            cache=cache,
            clock=clock,
            venue=VENUE,
            instrument_provider=TemplateInstrumentProvider(config.instrument_provider),
        )


builder = LiveNodeBuilder.from_config("example")
builder = builder.add_data_client("TEMPLATE", ExampleFactory, DataClientConfig())
```

模板同时提供执行客户端及其工厂。节点配置与策略保持在适配器包之外。

### 向节点注册客户端 {#register-clients-with-the-node}

**直接注册**用 `LiveNodeBuilder.add_data_client(name, factory, config)` 或
`add_exec_client(...)`。显式的第四个参数 `routing` 会覆盖 `config.routing`。

**基于配置的注册**：

1. 把名称到配置的映射放进 `LiveNodeConfig(data_clients=..., exec_clients=...)`。
1. 向 `LiveNode.build(name, config, ...)` 或
   `LiveNodeBuilder.from_config(name, config, ...)` 提供 `data_factories`
   与 `exec_factories`。

工厂查找先查完整客户端名，再查第一个连字符之前的前缀。提供的工厂优先于
可 import 配置自带的工厂描述符。场所与默认路由经由与直接注册相同的 builder
路径，使用各配置的 `RoutingConfig`。

两条注册路径都保持这些规则：

- **native 与自定义客户端可以共享一个节点。** 注册区分 native 工厂与 Python
  工厂，自定义 config 不经过 native config 的向下转型。
- **重名即失败。** 每个注册的客户端需要独立的名字。
- **构建失败保留 Python 客户端注册。** 节点处置失败尝试的客户端，
  重试时创建全新的客户端实例。

### 定义适配器配置 {#define-adapter-configuration}

适配器字段从 `DataClientConfig` 或 `ExecutionClientConfig` 派生。继承来的
native 构造函数处理公共字段。适配器的字段在 Python `__init__` 中声明为关键字
参数，并用 `**kwargs` 接收公共字段。工厂收到的是原始子类的实例。

配置或工厂需要按 import 路径加载时，从 `nautilus_trader.config` import
`ImportableConfig` 与 `ImportableFactoryConfig`。

| 操作                                | 结果                                                  |
| ---------------------------------------- | ------------------------------------------------------- |
| `config.dict()`                          | 保留 Python 值的配置字段。        |
| `config.json()`                          | JSON 字节。                                             |
| `config.to_importable(factory)`          | 带 `module:qualified_name` 路径的 `ImportableConfig`。 |
| `ImportableFactoryConfig(path).create()` | import 工厂并无参构造。     |

`ImportableConfig.json()`、`parse()` 与 `create()` 提供可 import 的往返。
函数内定义的类不可 import。

### 序列化配置 {#serialize-configuration}

运行时资源不要放进配置对象。实例字段（包括下划线前缀的字段）都参与序列化，
`ClassVar` 元数据不参与。

JSON 序列化支持：

- 原生 JSON 值。
- 常见的路由与工具提供者配置。
- 以字符串编码的 `Decimal` 值。
- 带 `from_str` 的领域值。

给适配器字段加注解，以还原领域值与 decimal，包括列表、字典与可选类型内部的值。
`Any` 保留解码后的 JSON 值。不支持的值抛出 `TypeError`。

:::warning[Serialized credentials]
序列化配置也会序列化其中包含的凭据，要保护好序列化结果。
:::

## 启动、调度与关停 {#startup-scheduling-and-shutdown}

### 启动时绑定资源 {#bind-resources-at-startup}

构造函数与工厂**不得启动任务、捕获事件循环或打开网络资源**。
构造期间 `client.loop` 为 `None`。声明了 `loop` 参数的 v1 风格工厂会收到 `None`。

启动会在 `_connect` 之前把每个自定义客户端绑定到实际运行的循环。依赖循环的
会话、锁与网络客户端，在该异步钩子内创建。

### 选择启动模式 {#choose-a-launch-mode}

| 启动模式                      | 事件循环                                        | 信号所有权                           |
| -------------------------------- | ------------------------------------------------- | ------------------------------------------ |
| 带自定义客户端的 `node.run()` | 在调用线程上创建并驱动 asyncio。 | 完成后恢复信号处理器。 |
| `await node.run_async()`         | 使用宿主的运行循环。                     | 宿主应用掌管自己的信号。         |

两种模式都保持 Rust 节点的启动、对账、维护与关停路径不变。纯 native 的
`run()` 保留其 native 执行路径。

在活动的事件循环里调用阻塞的 `run()` 会在消耗节点之前抛出。已有循环内用
`run_async()`。

:::warning[Database cache backing]
自定义 Python 客户端在两种启动模式下都不支持 Redis/PostgreSQL 缓存后备。
两种模式都驱动 asyncio，后备的阻塞 worker 调用会拖住事件循环。
纯 native 节点可以在 `run()` 下使用数据库后备。
:::

### 调度后台工作 {#schedule-background-work}

适配器的后台工作用 `self.create_task(coroutine, name)`。运行时：

- 保留客户端与每个任务，直到取到终态结果。
- 推迟首次对协程的轮询，即使使用了 eager 任务工厂。
- 未被 await 的操作失败会连同客户端与操作名记录日志。

直接经 asyncio 或外部库创建的任务仍由那段代码负责，在 `_disconnect` 中
把它们 join 掉。

### 按序处理命令 {#process-commands-in-order}

命令与订阅变更共享一个 **FIFO 队列**，每个客户端最多容纳 **1,024 个等待中的
操作**。队列满时拒绝继续准入。操作失败会先记录日志，再运行队列中的下一个操作。

历史请求与被 await 的对账操作独立运行，因此网络等待不会阻塞命令准入。
每个命令钩子保持有界：它会拖延该客户端后面的命令。

### 断开连接并排空任务 {#disconnect-and-drain-tasks}

节点在停止后有一段宽限期，先于断开连接，让策略关停期间的撤单能进入正常命令
路径。随后断开连接时：

1. 关闭准入，带着诊断信息丢弃队列中的命令。
1. 取消当前活动命令。
1. 调用 `_disconnect`，适配器在此关闭网络资源并 join 自己拥有的工作。

节点以其配置的超时约束断开连接的时长。运行时的取消请求**每个任务至多一次**，
并在排空期间对任务加 shield，因此 supervisor 反复取消不会打断异步清理。
截止期到了只报告清理未完成，不再发出下一次取消。

被独立取消的命令允许队列中的下一个操作运行，准入保持开启。

:::warning[Cancellation is not completion]
抗拒取消的任务仍处于监管之下，清理未完成会被报告——包括宿主过早关闭循环的
情形。先 await 完节点，再关闭宿主循环。
:::

处置会使输出与缓存视图失效，因此迟到的工作无法向后续节点发数据。
一个客户端实例及其绑定的提供者只属于**一次节点运行**。

## 只读缓存与类型化输出 {#read-only-cache-and-typed-output}

### 查看核心状态 {#inspect-core-state}

工厂收到的是 `ClientCache`——所属核心缓存的**只读视图**。工具、订单、账户、
持仓、订单簿与查询集合都是所有权的快照。改动返回的对象不会改变核心状态。
适配器不会拿到可变的缓存、引擎或原始 dispatch 句柄。

缓存访问发生在以下情形时抛出 Python 异常：

- 在另一个线程上。
- 处置之后。
- 与核心的不兼容借用期间。

读取方法包括：

| 状态                  | 方法                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| 工具            | `instrument`、`instruments`、`instrument_ids`                         |
| 报价与订单簿       | `quote`、`order_book`                                                 |
| 账户与持仓 | `account`、`position`、`positions_open`                               |
| 订单                 | `order`、`order_list`、`orders`、`orders_open`、`orders_inflight`     |
| 订单查询          | `orders_open_count`、`client_order_ids_open`、订单标识映射 |
| 存储字节           | `get`                                                                 |

读取历史报价用 `quote(instrument_id, index=0)`。`get` 返回字节值列表，
与 v2 缓存绑定一致。

### 发送类型化输出 {#send-typed-output}

客户端的输出方法**把类型化值排入队列等待核心处理**。核心始终是交易状态的
唯一写入者。

| 输出                 | 客户端方法                                                |
| ---------------------- | ------------------------------------------------------------- |
| 工具定义 | `_handle_instrument`                                          |
| 流式数据         | `_handle_data`                                                |
| 历史响应   | `_handle_response`                                            |
| 执行事件       | `generate_account_state`、`generate_order_*`、`_handle_event` |
| 对账报告 | `_handle_report`                                              |

`_handle_data` 接受来自 `nautilus_trader.model` 的这些类型：

- **报价、成交与 bar**：`QuoteTick`、`TradeTick`、`Bar`。
- **订单簿**：`OrderBookDelta`、`OrderBookDeltas`、`OrderBookDepth`。
- **价格与资金费率**：`MarkPriceUpdate`、`IndexPriceUpdate`、`FundingRateUpdate`。
- **期权与工具事件**：`OptionGreeks`、`InstrumentStatus`、`InstrumentClose`。
- **自定义数据**：`CustomData`。

`_handle_report` 接受来自 `nautilus_trader.model` 的 `OrderStatusReport`、
`FillReport`、`PositionStatusReport` 或 `ExecutionMassStatus`。其可选的
`fills` 列表只能伴随 `OrderStatusReport`。报告的账户身份、批量报告的
客户端/场所身份，以及嵌套报告的归属，都必须与注册的客户端一致。

## 数据客户端钩子 {#data-client-hooks}

### 订阅与请求 {#subscriptions-and-requests}

每个钩子都是 async 的，接收来自 `nautilus_trader.live` 的所有权独占、不可变的
命令或请求。嵌套的参数会被复制。为场所支持的能力重写对应钩子，未实现的钩子
抛出 `NotImplementedError`。场所订阅的确认与重连后的重放记录在适配器本地状态中。

| 家族            | Subscribe/unsubscribe 后缀            | 历史请求后缀                    |
| ----------------- | --------------------------------------- | -------------------------------------------- |
| 自定义数据       | 无后缀                               | `data`                                       |
| 工具       | `instruments`、`instrument`             | `instruments`、`instrument`                  |
| 订单簿       | `book_deltas`、`book_depth`             | `book_snapshot`、`book_deltas`、`book_depth` |
| 报价与成交 | `quotes`、`trades`                      | `quotes`、`trades`                           |
| 基准价  | `mark_prices`、`index_prices`           | *不支持*                              |
| 资金费率           | `funding_rates`                         | `funding_rates`                              |
| Bar              | `bars`                                  | `bars`                                       |
| 工具事件 | `instrument_status`、`instrument_close` | *不支持*                              |
| 期权           | `option_greeks`                         | `option_chain_reference_price`               |

例如，报价订阅调用 `_subscribe_quotes(command)` 与
`_unsubscribe_quotes(command)`；报价历史调用 `_request_quotes(request)`。

### 历史响应 {#historical-responses}

构造匹配的类型化响应时，保留请求 ID、参数、时间边界与载荷身份。
`nautilus_trader.live` 中的响应类有：

- **自定义数据与工具**：`CustomDataResponse`、`InstrumentResponse`、`InstrumentsResponse`。
- **订单簿**：`BookResponse`、`BookDeltasResponse`、`BookDepthResponse`。
- **报价与成交**：`QuotesResponse`、`TradesResponse`。
- **资金费率与 bar**：`FundingRatesResponse`、`BarsResponse`。
- **期权**：`OptionChainReferencePriceResponse`。

**空响应同样会走完适配器的响应路径**。带时间窗的请求暴露 UTC 的 `start`/`end`
datetime 与精确的 `start_ns`/`end_ns`；响应边界使用整数纳秒。
`RequestBookSnapshot` 与 `RequestOptionChainReferencePrice` 没有时间窗字段。

### 工具提供者 {#instrument-providers}

`InstrumentProvider` 存储适配器本地的工具与货币。重写 `load_all_async`、
`load_ids_async` 或 `load_async`。`initialize(reload=False)` 使用
`InstrumentProviderConfig`，并在加载失败后重试。

同步加载方法的行为取决于提供者的绑定：

- **绑定了客户端**：调度受监管的工作。
- **未绑定、且不在活动事件循环内**：同步执行加载。
- **未绑定、且处于活动事件循环内**：改为 await 异步方法。

加载出的工具经由客户端输出发送，以填充核心缓存。

## 执行客户端钩子 {#execution-client-hooks}

### 构造客户端 {#construct-the-client}

把工厂的 `name`、`config`、`cache`、`clock` 与 `trader_id` 传给
`ExecutionClient`。执行客户端还需要来自 `nautilus_trader.model` 的这些必填值：

| 参数       | 类型          |
| -------------- | ------------- |
| `venue`        | `Venue`       |
| `account_id`   | `AccountId`   |
| `account_type` | `AccountType` |
| `oms_type`     | `OmsType`     |

`base_currency` 与 `instrument_provider` 可选。数据客户端可以使用
`venue=None`。

### 生成对账报告 {#generate-reconciliation-reports}

实现这些对账钩子：

- `_generate_order_status_report`
- `_generate_order_status_reports`
- `_generate_fill_reports`
- `_generate_position_status_reports`

返回类型化的报告、列表，或方法规定的可选结果。
`_generate_mass_status(lookback_mins)` 默认用所属节点的时钟组合各批量方法，
模拟 native 行为；重写时返回 `ExecutionMassStatus`。
**传播出来的报告失败会使启动对账失败。**

### 处理订单命令 {#handle-order-commands}

重写场所支持的钩子：

- **提交**：`_submit_order`、`_submit_order_list`。
- **修改**：`_modify_order`。
- **撤销**：`_cancel_order`、`_cancel_all_orders`。
- **查询**：`_query_account`、`_query_order`。

`_batch_modify_orders` 与 `_batch_cancel_orders` 默认按序调用对应的单笔订单
钩子。场所有批量端点时重写它们。

命令保留 native 的标识与参数、correlation/causation ID、时间戳，以及嵌套订单
或批量成员。

### 同步决策与接收通知 {#make-synchronous-decisions-and-receive-notifications}

`_handles_order_venue`、`_provides_bulk_position_coverage` 与
`_calculate_commission` 是同步决策钩子，**必须不做 I/O、迅速返回**。
佣金返回 `Money`，或返回 `None` 使用核心回退逻辑。
`position_reconciliation_tolerance` 在构造时接受非负 `Decimal`。

`_on_instrument` 与 `_register_external_order` 是异步通知，经命令队列准入。
注册时间来自对账元数据，不一定等于订单的初始化事件时间。

## 从 v1 迁移 {#migration-from-v1}

该接口用 v2 的名称与所有权规则恢复了实时适配器能力，但不能让未改动的
Cython 适配器保持源码兼容。

| V1 界面                          | V2 替代                      | 迁移细节                            |
| ----------------------------------- | ----------------------------------- | ------------------------------------------- |
| `LiveDataClient`                    | `DataClient`                        | 从 `nautilus_trader.live.clients` import。 |
| `LiveMarketDataClient`              | `MarketDataClient`                  | 同一模块。                                |
| `LiveExecutionClient`               | `ExecutionClient`                   | 同一模块。                                |
| `quote_ticks` / `trade_ticks` 钩子 | `quotes` / `trades` 钩子           | 类型化的 v2 命令。                          |
| `order_book_*` 钩子                | `book_*` 钩子                      | 深度订阅用 `book_depth`。       |
| `_request`                          | `_request_data`                     | 自定义数据请求。                        |
| `_handle_*` 历史方法         | `_handle_response(typed_response)`  | 保留 correlation 与边界。            |
| `_send_*` 执行方法         | `_handle_event` / `_handle_report`  | 校验所有者身份。                   |
| 缓存写入                        | 排队的工具与事件       | 变更由核心应用。                       |
| 订阅跟踪方法       | 适配器本地订阅状态    | 依场所确认更新。          |
| 构造函数的事件循环              | 启动绑定之后的 `client.loop` | 资源在 `_connect` 中创建。             |
| `cancel_pending_tasks`              | 受监管的节点断开       | 取消不是终态完成。    |
| `run_after_delay`                   | 带 `asyncio.sleep` 的协程      | 通过 `create_task` 调度。             |

### 剩余差异与限制 {#remaining-differences-and-limitations}

- **远期价格**：v2 期权系列用 `RequestOptionChainReferencePrice` 及其匹配响应。
- **DeFi**：native 的区块/池订阅与池快照不在本 Python 接口之内。
- **历史请求**：[已知迁移限制](https://github.com/nautechsystems/nautilus_trader/blob/develop/MIGRATION_V2.md#known-limitations)
  中关于请求合并/完成的限制仍然适用。
- **自定义发布与订阅**：同样受上述迁移限制。客户端通过类型化数据输出发送
  `CustomData`，不暴露组件的 `publish_message` 或 topic 订阅方法。
- **数据库缓存后备**：自定义 Python 客户端在两种启动模式下都不支持。见
  [启动](#startup-scheduling-and-shutdown)与[宿主事件循环](./../concepts/live.md#hosted-event-loops)。
- **修订 bar**：Config 保留了 `handle_revised_bars`。若后续时间条的 `ts_event`
  相同，v2 核心缓存会替换缓存中的 bar，更旧的 bar 被跳过。v1 的
  `Bar.is_revision` 标记仍然不存在。修订 bar 是否会发出，仍由适配器层的过滤决定。
- **网络**：本接口不恢复已移除的 HTTP/WebSocket 绑定。

## 独立 Rust/PyO3 包 {#independent-rustpyo3-packages}

适配器可以把场所实现放在独立的 Rust/PyO3 扩展中。其 Python 门面派生相同的
客户端基类，通过与纯 Python 适配器相同的工厂注册。扩展针对 PyO3 编译，
并从已安装的 wheel import NautilusTrader 的模型类。

:::warning[Use the installed wheel's model classes]
所有交换的领域值必须是这些类的实例。不要链接第二套 Nautilus 模型
pyclass，也不要在扩展模块之间传递 native Rust trait 对象。集成边界是
Python 协议，不是共享的 Rust ABI。
:::

### 包布局与依赖 {#package-layout-and-dependencies}

适配器保留在自己的项目中，布局如下：

```text
external-adapter/
  Cargo.toml
  pyproject.toml
  src/lib.rs
  external_adapter/__init__.py
```

把库配置为 Python 扩展。例如 `Cargo.toml` 可以包含：

```toml
[package]
name = "external-adapter"
version = "0.1.0"
edition = "2024"
publish = false

[lib]
name = "_backend"
crate-type = ["cdylib"]

[dependencies]
pyo3 = { version = "=0.29.2", features = ["extension-module"] }

[workspace]
```

空的 workspace 让 Cargo 解析保持独立，即便本项目位于另一个 Cargo workspace
之下。适配器的依赖锁文件与审计策略也留在自己的项目里。

在 `pyproject.toml` 中配置 Python 包：

```toml
[build-system]
requires = ["maturin==1.15.0"]
build-backend = "maturin"

[project]
name = "external-adapter"
version = "0.1.0"
requires-python = ">=3.13,<3.15"
dependencies = ["nautilus-trader"]

[tool.maturin]
module-name = "external_adapter._backend"
python-source = "."
```

这些构建版本与被演示的 PyO3 边界匹配。NautilusTrader 的依赖范围按你的适配器
测试所覆盖的发布版本设定。

### 交换 wheel 所有的对象 {#exchange-wheel-owned-objects}

传入的命令用 `Bound<'_, PyAny>`，返回给 Python 的对象用 `Py<PyAny>`。
在附着到 Python 的状态下 import 类、读取类型化的命令属性，并用这些 import
来的类构造输出。下面的方法演示 `#[pymethods]` 实现内部的转换：

```rust
fn quote(&self, py: Python<'_>, command: &Bound<'_, PyAny>) -> PyResult<Py<PyAny>> {
    let model = py.import("nautilus_trader.model")?;
    let values = PyDict::new(py);
    values.set_item("instrument_id", command.getattr("instrument_id")?)?;
    for (name, value) in [("bid_price", "1.12345"), ("ask_price", "1.12349")] {
        values.set_item(
            name,
            model.getattr("Price")?.call_method1("from_str", (value,))?,
        )?;
    }
    for (name, value) in [("bid_size", "17000"), ("ask_size", "23000")] {
        values.set_item(
            name,
            model.getattr("Quantity")?.call_method1("from_str", (value,))?,
        )?;
    }
    values.set_item("ts_event", 19)?;
    values.set_item("ts_init", 29)?;
    Ok(model.getattr("QuoteTick")?.call((), Some(&values))?.unbind())
}
```

import `pyo3::{prelude::*, types::PyDict}`，并在名为 `_backend` 的
`#[pymodule]` 函数中导出所在的类。示例值是确定性的；场所实现填入自己收到的
价格、数量与纳秒时间戳。价格、数量与金额要用精确的 decimal 值或字符串构造，
不经过浮点往返。

### 从 Python 客户端钩子委托 {#delegate-from-python-client-hooks}

Python 门面 import 后端，并在客户端钩子中委托给它。对于带上述方法的
`Backend` 类，报价钩子是：

```python
from external_adapter._backend import Backend


async def _subscribe_quotes(self, command):
    self._handle_data(Backend().quote(command))
```

该钩子挂在 `MarketDataClient` 子类上：

- 先发布工具定义，再发布其行情数据。
- 实现连接与断开钩子。
- 提供用节点给出的 name、config、cache、clock 构造子类的
  `DataClientFactory`。
- 客户端保留持有场所持久状态的后端。

[Python 模板](https://github.com/nautechsystems/nautilus_trader/blob/develop/examples/live/_template/README.md)
演示了钩子与工厂注册。

执行适配器对 `ExecutionClient` 与 `ExecutionClientFactory` 用同样的模式。
读取 `command.order`，通过客户端的 `generate_*` 方法发出提交、接受、拒绝与
成交事件。对账钩子返回文档规定的报告类型。保留客户端/账户身份、请求
correlation、精确的佣金值与事件顺序。从 Rust 调用并不改变这些契约。

### 生命周期与缓存所有权 {#lifecycle-and-cache-ownership}

Python 调用与缓存访问都留在节点的所有者线程与事件循环上。GIL 允许访问
Python 对象，但并不授权另一个线程使用节点的缓存或输出能力。传入的缓存是
只读的，返回的可变快照也不会改动核心。类型化输出经由客户端发送，由同步
核心应用状态变更。

扩展遵循与 Python 适配器相同的生命周期：

- **构造**：只保留配置，不启动网络工作。
- **连接**：在 `_connect` 中创建绑定循环的资源。
- **后台工作**：Python 任务通过 `self.create_task` 调度。
- **断开**：在 `_disconnect` 中关闭资源；停止扩展拥有的 Rust worker 或网络
  任务，并取回其终态结果。

不要把可用的缓存/输出能力保留到节点拆除之后。失败以 Python 异常传播，
让客户端运行时能够监管它们。

### 构建并验证已安装的 wheel {#build-and-verify-installed-wheels}

先把 maturin 装进兼容的 CPython 构建解释器。若 Cargo 会发现另一个解释器，
用 `PYO3_PYTHON` 指定构建解释器。在适配器自己的项目中，以有界的 Cargo
并发构建 wheel：

```bash
CARGO_BUILD_JOBS=4 python -m maturin build --out dist
```

在全新环境中安装适配器 wheel 与标准（非 editable）的 NautilusTrader wheel。
从两棵源码树之外运行这些命令时使用绝对 wheel 路径：

```bash
python -m venv /tmp/adapter-check
/tmp/adapter-check/bin/python -m pip install /absolute/path/nautilus_trader.whl /absolute/path/adapter.whl
/tmp/adapter-check/bin/python -I /absolute/path/verify_adapter.py
```

把 wheel 占位符替换为生成的完整 wheel 文件名。Windows 上使用虚拟环境的
`Scripts/python.exe` 路径。

验证脚本应当检查：

- **import 隔离**：`nautilus_trader`、适配器包及其后端都解析到
  `sys.prefix` 之下。editable 安装会掩盖打包或扩展身份缺陷。
- **启动模式**：`node.run()` 与宿主式 `run_async()` 都能工作。
- **数据送达**：报价能到达策略与核心缓存。
- **对账**：对账能完成。
- **执行**：提交的订单产生预期的成交数量、价格、佣金与最终缓存订单状态。
- **关停**：资源关闭，且之后的适配器输出被阻止。

改动适配器协议或扩展支持的 NautilusTrader 版本时，运行这项已安装 wheel 检查。
