# 适配器（Adapters）

## 介绍

本开发者指南说明如何为 NautilusTrader 平台开发集成适配器（adapter）。适配器负责连接交易所或数据提供方，将各类原始场馆 API 翻译为 Nautilus 的统一接口与归一化的领域模型。

## 适配器的结构

NautilusTrader 的适配器遵循分层架构，通常包含：

- Rust 核心（Rust core）：用于网络客户端与性能关键路径的实现。
- Python 层（可选）：用于与现有 Python 系统或更高层集成。

目前几个实现模式一致、可作为参考的适配器有：

- BitMEX
- Bybit
- OKX

### Rust 核心（`crates/adapters/your_adapter/`）

Rust 层负责：

- HTTP 客户端：原始 API 通信、请求签名、流控（rate limiting）。
- WebSocket 客户端：低延迟流式连接与消息解析。
- 解析（Parsing）：高效地将场馆数据转换为 Nautilus 的领域对象。
- Python 绑定：通过 PyO3 导出，使 Rust 功能可以被 Python 调用。

典型的 Rust 项目结构：

```tree
crates/adapters/your_adapter/
├── src/
│   ├── common/           # 共享类型与工具函数
│   │   ├── consts.rs     # 场馆常量 / broker ID
│   │   ├── credential.rs # API key 存储与签名辅助
│   │   ├── enums.rs      # 与 REST/WS 负载对应的枚举
│   │   ├── urls.rs       # 与环境/产品相关的 base-url 解析器
│   │   ├── parse.rs      # 共享解析辅助函数
│   │   └── testing.rs    # 单元测试复用的 fixtures
│   ├── http/             # HTTP 客户端实现
│   │   ├── client.rs     # 带认证的 HTTP 客户端
│   │   ├── models.rs     # REST 负载对应的结构体
│   │   ├── query.rs      # 请求 / 查询构造器
│   │   └── parse.rs      # 响应解析函数
│   ├── websocket/        # WebSocket 实现
│   │   ├── client.rs     # WebSocket 客户端
│   │   ├── messages.rs   # 流式消息的结构体
│   │   └── parse.rs      # 消息解析函数
│   ├── python/           # PyO3 对 Python 的导出
│   ├── config.rs         # 配置结构体
│   └── lib.rs            # 库入口
└── tests/                # 使用 mock server 的集成测试
```

### Python 层（`nautilus_trader/adapters/your_adapter`）

Python 层向平台暴露集成接口，通常包含：

1. Instrument Provider：通过 `InstrumentProvider` 提供 instrument 定义。
2. Data Client：通过 `LiveDataClient` / `LiveMarketDataClient` 处理行情与历史数据请求。
3. Execution Client：通过 `LiveExecutionClient` 管理委托执行。
4. Factories：把场馆特定的数据转换为 Nautilus 的领域模型。
5. Configuration：面向用户的客户端配置类。

典型的 Python 包结构：

```tree
nautilus_trader/adapters/your_adapter/
├── config.py     # 配置类
├── constants.py  # 适配器常量
├── data.py       # LiveDataClient / LiveMarketDataClient
├── execution.py  # LiveExecutionClient
├── factories.py  # instrument factory
├── providers.py  # InstrumentProvider
└── __init__.py   # 包初始化
```

## 适配器实现步骤（概览）

1. 为你的适配器创建一个新的 Python 子包。
2. 实现 Instrument Provider：继承 `InstrumentProvider` 并实现加载 instruments 的方法。
3. 实现 Data Client：根据需要继承 `LiveDataClient` 或 `LiveMarketDataClient`，实现抽象方法。
4. 实现 Execution Client：继承 `LiveExecutionClient` 并实现相关方法。
5. 编写配置类以保存适配器设置（API key、URL 等）。
6. 充分测试适配器，确保各方法按预期工作（见 [Testing Guide](testing.md)）。

---

## Rust 端的设计模式建议

- Common code (`common/`)：把场馆常量、凭证辅助、枚举与可复用解析器放在 `src/common`。当适配器支持多个环境或产品线时，在 `common::urls` 中集中管理 URL 选择，保证 REST 与 WebSocket 的 base URL 与 Python 层一致。
- Configurations (`config.rs`)：在 `src/config.rs` 中暴露类型化的配置结构，便于 Python 层切换场馆特有行为（例如 OKX 如何配置 demo URL、重试与通道标志）。保持默认值最小化，并把 URL 选择委托给 `common::urls`。
- Error taxonomy (`error.rs`)：把 HTTP/WebSocket 的错误集中到适配器特定的错误枚举。参考 BitMEX 做法：区分可重试（retryable）、不可重试（non-retryable）和致命（fatal）错误，同时保留底层传输错误，方便运维工具做一致处理。
- Python exports (`python/mod.rs`)：通过 PyO3 模块重导出客户端、枚举与辅助函数，保持 Rust 与 Python 接口同步（OKX 适配器是好的参考）。
- Python bindings（`python/`）：用 PyO3 暴露 Rust 功能，使用 `#[pyclass]` 标记需在 Python 可见的结构体，并在 `#[pymethods]` 中用 `#[getter]` 提供字段访问。对于 HTTP 客户端中异步方法，可用 `pyo3_async_runtimes::tokio::future_into_py` 将 Rust future 转为 Python awaitable。返回自定义类型列表时，先用 `Py::new(py, item)` 映射每个项再构造 Python 列表。把所有导出类/枚举在 `python/mod.rs` 中注册（`m.add_class::<YourType>()`）。建议在 Rust 代码中给面向 Python 的方法以 `py_*` 前缀，同时通过 `#[pyo3(name = "method_name")]` 将其暴露为没有前缀的名字。
- 字符串驻留（String interning）：对频繁重复存储的非唯一字符串（场馆、symbol、instrument ID）使用 `ustr::Ustr` 以减少内存与比较成本。
- Testing helpers (`common/testing.rs`)：把共享的 fixtures 和样本 payload 放到 `src/common/testing.rs`，将 `#[cfg(test)]` 相关辅助从生产模块中剥离，方便复用。

## HTTP 客户端设计要点

为了方便 Python 绑定的高效克隆，HTTP 客户端采用内层/外层（inner/outer）结构，并用 `Arc` 包裹：

```rust
use std::sync::Arc;
use nautilus_network::http::HttpClient;

// Inner client - contains actual HTTP logic
pub struct MyHttpInnerClient {
    base_url: String,
    client: HttpClient,  // Use nautilus_network::http::HttpClient, not reqwest directly
    credential: Option<Credential>,
    retry_manager: RetryManager<MyHttpError>,
    cancellation_token: CancellationToken,
}

// Outer client - wraps inner with Arc for cheap cloning (needed for Python)
pub struct MyHttpClient {
    pub(crate) inner: Arc<MyHttpInnerClient>,
}
```

要点：

- 内层 client（`*HttpInnerClient`）包含所有 HTTP 的逻辑与状态。
- 外层 client（`*HttpClient`）用 `Arc` 包裹内层以支持高效克隆。
- 优先使用 `nautilus_network::http::HttpClient` 而不是直接使用 `reqwest::Client` ——前者提供了内置的流控、重试与统一的错误处理。
- 外层 client 的方法只是简单委托给内层。

### 解析（Parser）函数

解析函数把场馆特定的数据结构转为 Nautilus 的领域对象。公共转换放在 `common/parse.rs`，REST 特定的放在 `http/parse.rs`。每个解析函数接收场馆数据与上下文（账号 ID、时间戳、instrument 引用等），并返回包裹在 `Result` 中的 Nautilus 类型。

常见做法：

- 使用 `.parse::<f64>()` 并结合 `anyhow::Context` 提供充足的错误上下文来处理字符串到数值的转换。
- 在解析可选字段前先检查空字符串，因为很多场馆会返回 `""` 而不是直接省略字段。
- 使用 `match` 明确地把场馆枚举映射到 Nautilus 枚举，避免自动转换掩盖映射错误。
- 在需要精度或其它元数据构建 Nautilus 类型（数量、价格）时接受 instrument 引用。
- 使用描述性的函数名，例如 `parse_position_status_report`、`parse_order_status_report`、`parse_trade_tick`。

把复用的解析辅助（如 `parse_price_with_precision`, `parse_timestamp`）放在相同模块中作为私有函数。

### 方法命名与组织

把 HTTP 方法分为两类：低级直接 API 调用和高级领域方法。

命名约定：

- 低级 API 方法：以 `http_` 为前缀，并放在 impl 块的顶部（例如 `http_get_instruments`, `http_place_order`）。
- 高级领域方法：无前缀，放在单独的段落（例如 `submit_order`, `cancel_order`）。
- 低级方法接收场馆特定类型（builder、JSON 值）。
- 高级方法接收 Nautilus 的领域对象（InstrumentId、ClientOrderId、OrderSide 等）。

高级方法的典型流程：

在内层 client 中，高级方法通常遵循三步：从 Nautilus 类型构建场馆参数 -> 调用对应的 `http_*` 低级方法 -> 解析或抽取响应。对于返回领域对象的端点（positions、orders、trades），使用 `common/parse` 中的解析函数；对于返回原始场馆数据的端点（费率、余额），直接从响应包中抽取结果。以 `request_*` 前缀的方法表示返回领域数据，而 `submit_*`、`cancel_*`、`modify_*` 等方法用于执行动作并返回确认信息。

外层 client 仅把方法委托给内层，目的仅为通过 `Arc` 支持 Python 端的廉价克隆。

### 查询参数构造器（Query builders）

使用 `derive_builder` crate 并提供合理的默认值与友好的 Option 处理：

```rust
use derive_builder::Builder;

#[derive(Clone, Debug, Deserialize, Serialize, Builder)]
#[serde(rename_all = "camelCase")]
#[builder(setter(into, strip_option), default)]
pub struct InstrumentsInfoParams {
    pub category: ProductType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symbol: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<u32>,
}

impl Default for InstrumentsInfoParams {
    fn default() -> Self {
        Self {
            category: ProductType::Linear,
            symbol: None,
            limit: None,
        }
    }
}
```

关键属性说明：

- `#[builder(setter(into, strip_option), default)]`：用户可直接写 `.symbol("BTCUSDT")` 而不是 `.symbol(Some("BTCUSDT".to_string()))`。
- `#[serde(skip_serializing_if = "Option::is_none")]`：在序列化查询字符串时省略 None 字段。
- 对 builder 参数始终实现 `Default`。

### 签名与认证

把签名逻辑放在内层 client 中。

### 错误处理与重试

使用 `nautilus_network` 提供的 `RetryManager` 实现一致的重试策略。

### 速率限制（Rate limiting）

通过 `HttpClient` 配置速率限制。

## WebSocket 客户端模式

WebSocket 客户端用于实时流数据，需仔细管理连接状态、认证、订阅与重连逻辑。

### 客户端结构

WebSocket 客户端通常不需要内/外层模式，因为它们不常被克隆。使用单个结构体并清晰地管理状态。

### 认证

把认证逻辑与订阅管理分离。

### 订阅管理

#### 订阅生命周期

一个订阅（subscription）通常处于两种状态之一：

| State         | Description                    |
| ------------- | ------------------------------ |
| **Pending**   | 已向场馆发送订阅请求，等待确认 |
| **Confirmed** | 场馆已确认订阅并开始推送数据   |

状态转换示例：

| Trigger           | Method Called        | From State | To State  | 说明                        |
| ----------------- | -------------------- | ---------- | --------- | --------------------------- |
| User subscribes   | `mark_subscribe()`   | —          | Pending   | 将 topic 加入 pending 集合  |
| Venue confirms    | `confirm()`          | Pending    | Confirmed | 从 pending 移至 confirmed   |
| Venue rejects     | `mark_failure()`     | Pending    | Pending   | 保持 pending，重连后重试    |
| User unsubscribes | `mark_unsubscribe()` | Confirmed  | Pending   | 直到收到 ack 前暂为 pending |
| Unsubscribe ack   | `clear_pending()`    | Pending    | Removed   | 从集合中移除                |

关键原则：

- `subscription_count()` 只统计 confirmed 状态的订阅，不包括 pending。
- 失败的订阅保持 pending 状态，并在重连时自动重试。
- 重连后需恢复 confirmed 与 pending 两类订阅。
- 取消订阅时需检查 ack 中的 `op` 字段以避免重复确认。

#### 主题（topic）格式模式

适配器使用场馆特定的分隔符来构造订阅主题：

| Adapter    | Delimiter | Example                | Pattern                      |
| ---------- | --------- | ---------------------- | ---------------------------- |
| **BitMEX** | `:`       | `trade:XBTUSD`         | `{channel}:{symbol}`         |
| **OKX**    | `:`       | `trades:BTC-USDT-SWAP` | `{channel}:{symbol}`         |
| **Bybit**  | `.`       | `orderbook.50.BTCUSDT` | `{channel}.{depth}.{symbol}` |

用 `split_once()` 按相应分隔符拆分以提取 channel 与 symbol。

### 重连逻辑

重连时恢复认证与公共订阅，但跳过那些在断开前显式取消的私有通道。

### Ping/Pong 处理

既要支持控制帧（control-frame）级别的 ping，也要支持应用层的 ping。

### 消息路由

将不同类型的消息路由到对应的处理器。

### 错误处理

对错误进行分类以决定是否重连或重试：

```rust
#[derive(Debug, thiserror::Error)]
pub enum WebSocketError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),

    #[error("Subscription failed: {0}")]
    SubscriptionFailed(String),

    #[error("Message parse error: {0}")]
    ParseError(String),
}

impl MyWebSocketClient {
    fn should_reconnect(&self, error: &WebSocketError) -> bool {
        matches!(
            error,
            WebSocketError::ConnectionFailed(_)
        )
    }
}
```

## 场馆负载建模（Modeling venue payloads）

在将上游架构映射到 Rust 时建议遵循以下约定。

### REST 模型（`http::models` 和 `http::query`）

- 把请求与响应的表示放在 `src/http/models.rs` 并派生 `serde::Deserialize`（当适配器需要向场馆发送数据时再添加 `serde::Serialize`）。
- 使用整体的大小写重命名属性（如 `#[serde(rename_all = "camelCase")]` 或 `#[serde(rename_all = "snake_case")]`）以匹配上游字段名；只有在上游键为非法 Rust 标识符或与关键字冲突时才对单个字段重命名（例如 `#[serde(rename = "type")] pub order_type: String`）。
- 把查询参数的辅助结构放在 `src/http/query.rs` 并派生 `serde::Serialize`，复用 `common::consts` 中的常量以避免重复字面量。

### WebSocket 消息（`websocket::messages`）

- 在 `src/websocket/messages.rs` 中为流式负载定义类型，为每个场馆主题创建与上游 JSON 对应的 struct 或 enum。
- 对命名的处理沿用 REST 的指导：尽量使用整体重命名规则并保持字段名与上游一致，必要时使用 serde 的 `#[serde(tag = "op")]` 或 `#[serde(flatten)]` 等辅助注解，并在文档中说明选择理由。
- 对有意偏离上游模式的映射，在代码注释与模块文档中说明，以便贡献者快速理解映射规则。

---

## 测试

适配器应提供两层测试覆盖：Rust 端与暴露给平台的 Python glue。保证测试套件确定性并与被保护的生产代码紧密放置。

### Rust 测试

#### 项目布局示例

```tree
crates/adapters/your_adapter/
├── src/
│   ├── http/
│   │   ├── client.rs      # HTTP client + unit tests
│   │   └── parse.rs       # REST payload parsers + unit tests
│   └── websocket/
│       ├── client.rs      # WebSocket client + unit tests
│       └── parse.rs       # Streaming parsers + unit tests
├── tests/
│   ├── http.rs            # Mock HTTP integration tests
│   └── websocket.rs       # Mock WebSocket integration tests
└── test_data/             # 用于测试套件的上游负载样本
    ├── http_get_{endpoint}.json  # 含 retCode/result/time 的完整场馆响应
    └── ws_{message_type}.json    # WebSocket 消息样本
```

- 把单元测试放在其所在模块旁（`#[cfg(test)]` 块）。对于共享 fixtures，使用 `src/common/testing.rs`（或等效模块），保持生产代码清爽。
- 把基于 Axum 的集成测试放在 `crates/adapters/<adapter>/tests/`，覆盖公共 API（HTTP client、WebSocket client、缓存、重连流）。
- 将上游负载样本存放在 `test_data/` 并在单元和集成测试中复用。测试数据命名应一致：REST 响应用 `http_get_{endpoint_name}.json`，WebSocket 用 `ws_{message_type}.json`。样本应包含完整的响应包（状态码、时间戳、结果包装），并提供多个现实例子以覆盖解析分支，例如 position 数据应包含 long、short 与 flat 的案例。

#### 单元测试

- 关注纯逻辑：解析器、签名辅助、规范化器与不依赖实时传输的业务规则。
- 避免重复覆盖那些已由集成测试保证的行为。

#### 集成测试

使用 Axum mock server 验证对外公共 API。至少参考 BitMEX 的测试覆盖（见 `crates/adapters/bitmex/tests/`），确保每个适配器验证相同的行为集。

##### HTTP 客户端集成测试要点

- Happy paths（正常路径）— 获取代表性公开资源（如 instruments 或 mark price），并断言其被正确转换为 Nautilus 的领域模型。
- Credential guard（凭证保护）— 无凭证调用私有端点并断言返回结构化错误；再带凭证调用以证明成功。
- 速率限制 / 重试映射 — 模拟场馆的速率限制响应并断言适配器映射为正确的错误变体（如 `OkxError` / `BitmexHttpError`），以便重试策略做出响应。
- Query builders — 测试分页 / 按时间查询的构造器（历史成交、K 线），断言生成的查询字符串符合场馆规范（`after`、`before`、`limit` 等）。
- Error translation — 验证非 2xx 的上游响应被映射为适配器错误枚举并附带原始 code/message。

##### WebSocket 客户端集成测试要点

- Login handshake — 断言成功登录会切换内部认证状态，并测试服务器返回非零 code 的失败场景；客户端应抛出错误并避免将自己标记为已认证。
- Ping/Pong — 验证文本型与控制帧 ping 都能触发即时 pong。
- Subscription lifecycle — 断言 public/private 通道的订阅请求/ack 被正确发送与接收，且取消订阅会从缓存集合中移除条目。
- Reconnect behaviour — 模拟断连并验证客户端能重新认证、恢复公共通道，并跳过在断开前已显式取消的私有通道。
- Message routing — 向 socket 注入代表性的数据/ack/error 负载，并断言其在 public stream 上以正确的 `NautilusWsMessage` 变体出现。
- Quota tagging — （可选）验证订单/撤单/改单等操作带上合适的配额标签，以便在订阅流量之外对速率限制进行独立管控。

- 优先使用事件驱动的断言与共享状态（例如收集 `subscription_events`、跟踪 pending/confirmed 话题、等待 `connection_count` 的状态变化），而不是任意的 sleep 调用。
- 使用适配器特有的辅助工具来等待显式信号（如 "auth confirmed" 或 "reconnection finished"），以保持测试在高并发下的确定性。

### Python 层测试

- 在 `tests/integration_tests/adapters/<adapter>/` 中对适配器的 Python 表面（instrument providers、data/execution clients、factories）进行测试。
- 在测试中 mock PyO3 边界（`nautilus_pyo3` shim、stubbed Rust clients），以保证测试速度同时验证配置、factory 连接与错误处理与导出的 Rust API 一致。
- 对标 Rust 的集成覆盖：当 Rust 端引入新行为（例如重连回放、错误传播）时，断言 Python 层执行相同的序列（连接/断开、提交/改/撤单的翻译、场馆 ID 的传递、失败处理）。BitMEX 的 Python 测试是可参考的目标级别。

---

## Python 适配器层实现指南（模板）

下面给出使用模板为新数据提供方构建适配器的分步指南。

### InstrumentProvider

`InstrumentProvider` 负责提供场馆可用的 instrument 定义，包括加载全部 instrument、按 ID 加载特定 instrument，以及对 instrument 列表应用过滤器。

```python
from nautilus_trader.common.providers import InstrumentProvider
from nautilus_trader.model import InstrumentId


class TemplateInstrumentProvider(InstrumentProvider):
    """示例 `InstrumentProvider`，展示完成集成所需的最小覆盖方法。"""

    async def load_all_async(self, filters: dict | None = None) -> None:
        raise NotImplementedError("implement `load_all_async` in your adapter subclass")

    async def load_ids_async(self, instrument_ids: list[InstrumentId], filters: dict | None = None) -> None:
        raise NotImplementedError("implement `load_ids_async` in your adapter subclass")

    async def load_async(self, instrument_id: InstrumentId, filters: dict | None = None) -> None:
        raise NotImplementedError("implement `load_async` in your adapter subclass")
```

关键方法：

- `load_all_async`：异步加载全部 instruments，可选地应用过滤条件。
- `load_ids_async`：按 ID 加载指定的 instruments。
- `load_async`：按 ID 加载单个 instrument。

### DataClient

`LiveDataClient` 处理与市场数据非直接相关的数据订阅与管理，例如新闻流、定制数据流或其它能增强策略但不直接代表市场活动的数据源。

```python
from nautilus_trader.data.messages import RequestData
from nautilus_trader.data.messages import SubscribeData
from nautilus_trader.data.messages import UnsubscribeData
from nautilus_trader.live.data_client import LiveDataClient
from nautilus_trader.model import DataType


class TemplateLiveDataClient(LiveDataClient):
    """示例 `LiveDataClient`，展示可覆盖的抽象方法。"""

    async def _connect(self) -> None:
        raise NotImplementedError("implement `_connect` in your adapter subclass")

    async def _disconnect(self) -> None:
        raise NotImplementedError("implement `_disconnect` in your adapter subclass")

    async def _subscribe(self, command: SubscribeData) -> None:
        raise NotImplementedError("implement `_subscribe` in your adapter subclass")

    async def _unsubscribe(self, command: UnsubscribeData) -> None:
        raise NotImplementedError("implement `_unsubscribe` in your adapter subclass")

    async def _request(self, request: RequestData) -> None:
        raise NotImplementedError("implement `_request` in your adapter subclass")
```

关键方法：

- `_connect`：建立与数据提供方的连接。
- `_disconnect`：关闭连接。
- `_subscribe`：订阅特定数据类型。
- `_unsubscribe`：取消订阅。
- `_request`：向提供方请求数据。

### MarketDataClient

`MarketDataClient` 处理市场相关的数据，如 order book、top-of-book 报价与成交、以及 instrument 的状态更新，关注历史与实时数据供交易所需。

```python
from nautilus_trader.data.messages import RequestBars
from nautilus_trader.data.messages import RequestData
from nautilus_trader.data.messages import RequestInstrument
from nautilus_trader.data.messages import RequestInstruments
from nautilus_trader.data.messages import RequestOrderBookSnapshot
from nautilus_trader.data.messages import RequestQuoteTicks
from nautilus_trader.data.messages import RequestTradeTicks
from nautilus_trader.data.messages import SubscribeBars
from nautilus_trader.data.messages import SubscribeData
from nautilus_trader.data.messages import SubscribeFundingRates
from nautilus_trader.data.messages import SubscribeIndexPrices
from nautilus_trader.data.messages import SubscribeInstrument
from nautilus_trader.data.messages import SubscribeInstrumentClose
from nautilus_trader.data.messages import SubscribeInstruments
from nautilus_trader.data.messages import SubscribeInstrumentStatus
from nautilus_trader.data.messages import SubscribeMarkPrices
from nautilus_trader.data.messages import SubscribeOrderBook
from nautilus_trader.data.messages import SubscribeQuoteTicks
from nautilus_trader.data.messages import SubscribeTradeTicks
from nautilus_trader.data.messages import UnsubscribeBars
from nautilus_trader.data.messages import UnsubscribeData
from nautilus_trader.data.messages import UnsubscribeFundingRates
from nautilus_trader.data.messages import UnsubscribeIndexPrices
from nautilus_trader.data.messages import UnsubscribeInstrument
from nautilus_trader.data.messages import UnsubscribeInstrumentClose
from nautilus_trader.data.messages import UnsubscribeInstruments
from nautilus_trader.data.messages import UnsubscribeInstrumentStatus
from nautilus_trader.data.messages import UnsubscribeMarkPrices
from nautilus_trader.data.messages import UnsubscribeOrderBook
from nautilus_trader.data.messages import UnsubscribeQuoteTicks
from nautilus_trader.data.messages import UnsubscribeTradeTicks
from nautilus_trader.live.data_client import LiveMarketDataClient


class TemplateLiveMarketDataClient(LiveMarketDataClient):
    """示例 `LiveMarketDataClient`，展示可覆盖的抽象方法。"""

    async def _connect(self) -> None:
        raise NotImplementedError("implement `_connect` in your adapter subclass")

    async def _disconnect(self) -> None:
        raise NotImplementedError("implement `_disconnect` in your adapter subclass")

    async def _subscribe(self, command: SubscribeData) -> None:
        raise NotImplementedError("implement `_subscribe` in your adapter subclass")

    async def _unsubscribe(self, command: UnsubscribeData) -> None:
        raise NotImplementedError("implement `_unsubscribe` in your adapter subclass")

    async def _request(self, request: RequestData) -> None:
        raise NotImplementedError("implement `_request` in your adapter subclass")

    async def _subscribe_instruments(self, command: SubscribeInstruments) -> None:
        raise NotImplementedError("implement `_subscribe_instruments` in your adapter subclass")

    async def _unsubscribe_instruments(self, command: UnsubscribeInstruments) -> None:
        raise NotImplementedError("implement `_unsubscribe_instruments` in your adapter subclass")

    async def _subscribe_instrument(self, command: SubscribeInstrument) -> None:
        raise NotImplementedError("implement `_subscribe_instrument` in your adapter subclass")

    async def _unsubscribe_instrument(self, command: UnsubscribeInstrument) -> None:
        raise NotImplementedError("implement `_unsubscribe_instrument` in your adapter subclass")

    async def _subscribe_order_book_deltas(self, command: SubscribeOrderBook) -> None:
        raise NotImplementedError("implement `_subscribe_order_book_deltas` in your adapter subclass")

    async def _unsubscribe_order_book_deltas(self, command: UnsubscribeOrderBook) -> None:
        raise NotImplementedError("implement `_unsubscribe_order_book_deltas` in your adapter subclass")

    async def _subscribe_order_book_snapshots(self, command: SubscribeOrderBook) -> None:
        raise NotImplementedError("implement `_subscribe_order_book_snapshots` in your adapter subclass")

    async def _unsubscribe_order_book_snapshots(self, command: UnsubscribeOrderBook) -> None:
        raise NotImplementedError("implement `_unsubscribe_order_book_snapshots` in your adapter subclass")

    async def _subscribe_quote_ticks(self, command: SubscribeQuoteTicks) -> None:
        raise NotImplementedError("implement `_subscribe_quote_ticks` in your adapter subclass")

    async def _unsubscribe_quote_ticks(self, command: UnsubscribeQuoteTicks) -> None:
        raise NotImplementedError("implement `_unsubscribe_quote_ticks` in your adapter subclass")

    async def _subscribe_trade_ticks(self, command: SubscribeTradeTicks) -> None:
        raise NotImplementedError("implement `_subscribe_trade_ticks` in your adapter subclass")

    async def _unsubscribe_trade_ticks(self, command: UnsubscribeTradeTicks) -> None:
        raise NotImplementedError("implement `_unsubscribe_trade_ticks` in your adapter subclass")

    async def _subscribe_mark_prices(self, command: SubscribeMarkPrices) -> None:
        raise NotImplementedError("implement `_subscribe_mark_prices` in your adapter subclass")

    async def _unsubscribe_mark_prices(self, command: UnsubscribeMarkPrices) -> None:
        raise NotImplementedError("implement `_unsubscribe_mark_prices` in your adapter subclass")

    async def _subscribe_index_prices(self, command: SubscribeIndexPrices) -> None:
        raise NotImplementedError("implement `_subscribe_index_prices` in your adapter subclass")

    async def _unsubscribe_index_prices(self, command: UnsubscribeIndexPrices) -> None:
        raise NotImplementedError("implement `_unsubscribe_index_prices` in your adapter subclass")

    async def _subscribe_funding_rates(self, command: SubscribeFundingRates) -> None:
        raise NotImplementedError("implement `_subscribe_funding_rates` in your adapter subclass")

    async def _unsubscribe_funding_rates(self, command: UnsubscribeFundingRates) -> None:
        raise NotImplementedError("implement `_unsubscribe_funding_rates` in your adapter subclass")

    async def _subscribe_bars(self, command: SubscribeBars) -> None:
        raise NotImplementedError("implement `_subscribe_bars` in your adapter subclass")

    async def _unsubscribe_bars(self, command: UnsubscribeBars) -> None:
        raise NotImplementedError("implement `_unsubscribe_bars` in your adapter subclass")

    async def _subscribe_instrument_status(self, command: SubscribeInstrumentStatus) -> None:
        raise NotImplementedError("implement `_subscribe_instrument_status` in your adapter subclass")

    async def _unsubscribe_instrument_status(self, command: UnsubscribeInstrumentStatus) -> None:
        raise NotImplementedError("implement `_unsubscribe_instrument_status` in your adapter subclass")

    async def _subscribe_instrument_close(self, command: SubscribeInstrumentClose) -> None:
        raise NotImplementedError("implement `_subscribe_instrument_close` in your adapter subclass")

    async def _unsubscribe_instrument_close(self, command: UnsubscribeInstrumentClose) -> None:
        raise NotImplementedError("implement `_unsubscribe_instrument_close` in your adapter subclass")

    async def _request_instrument(self, request: RequestInstrument) -> None:
        raise NotImplementedError("implement `_request_instrument` in your adapter subclass")

    async def _request_instruments(self, request: RequestInstruments) -> None:
        raise NotImplementedError("implement `_request_instruments` in your adapter subclass")

    async def _request_quote_ticks(self, request: RequestQuoteTicks) -> None:
        raise NotImplementedError("implement `_request_quote_ticks` in your adapter subclass")

    async def _request_trade_ticks(self, request: RequestTradeTicks) -> None:
        raise NotImplementedError("implement `_request_trade_ticks` in your adapter subclass")

    async def _request_bars(self, request: RequestBars) -> None:
        raise NotImplementedError("implement `_request_bars` in your adapter subclass")

    async def _request_order_book_snapshot(self, request: RequestOrderBookSnapshot) -> None:
        raise NotImplementedError("implement `_request_order_book_snapshot` in your adapter subclass")
```

关键方法：

- `_connect`：建立与场馆 API 的连接。
- `_disconnect`：关闭连接。
- `_subscribe`：订阅通用数据（为自定义数据类型提供基类）。
- `_unsubscribe`：取消订阅通用数据。
- `_request`：请求通用数据。
- `_subscribe_instruments`：订阅多 instrument 的市场数据。
- `_unsubscribe_instruments`：取消订阅多 instrument 的市场数据。
- `_subscribe_instrument`：订阅单个 instrument 的市场数据。
- `_unsubscribe_instrument`：取消订阅单个 instrument 的市场数据。
- `_subscribe_order_book_deltas`：订阅 order book 差分更新。
- `_unsubscribe_order_book_deltas`：取消订阅 order book 差分更新。
- `_subscribe_order_book_snapshots`：订阅 order book 快照。
- `_unsubscribe_order_book_snapshots`：取消订阅 order book 快照。
- `_subscribe_quote_ticks`：订阅 top-of-book 报价更新。
- `_unsubscribe_quote_ticks`：取消订阅 quote tick 更新。
- `_subscribe_trade_ticks`：订阅 trade tick 更新。
- `_unsubscribe_trade_ticks`：取消订阅 trade tick 更新。
- `_subscribe_mark_prices`：订阅 mark price 更新。
- `_unsubscribe_mark_prices`：取消订阅 mark price 更新。
- `_subscribe_index_prices`：订阅 index price 更新。
- `_unsubscribe_index_prices`：取消订阅 index price 更新。
- `_subscribe_funding_rates`：订阅 funding rate 更新。
- `_unsubscribe_funding_rates`：取消订阅 funding rate 更新。
- `_subscribe_bars`：订阅 K 线 / bars 更新。
- `_unsubscribe_bars`：取消订阅 bars 更新。
- `_subscribe_instrument_status`：订阅 instrument 状态更新。
- `_unsubscribe_instrument_status`：取消订阅 instrument 状态更新。
- `_subscribe_instrument_close`：订阅 instrument 收盘价更新。
- `_unsubscribe_instrument_close`：取消订阅 instrument 收盘价更新。
- `_request_instrument`：请求单个 instrument 的历史数据。
- `_request_instruments`：请求多个 instrument 的历史数据。
- `_request_quote_ticks`：请求历史 quote tick 数据。
- `_request_trade_ticks`：请求历史 trade tick 数据。
- `_request_bars`：请求历史 K 线 数据。
- `_request_order_book_snapshot`：请求 order book 快照。

### ExecutionClient

`ExecutionClient` 负责订单管理，包括提交、修改与撤单。它与场馆交易系统交互以管理并执行交易。

```python
from nautilus_trader.execution.messages import BatchCancelOrders
from nautilus_trader.execution.messages import CancelAllOrders
from nautilus_trader.execution.messages import CancelOrder
from nautilus_trader.execution.messages import GenerateFillReports
from nautilus_trader.execution.messages import GenerateOrderStatusReport
from nautilus_trader.execution.messages import GenerateOrderStatusReports
from nautilus_trader.execution.messages import GeneratePositionStatusReports
from nautilus_trader.execution.messages import ModifyOrder
from nautilus_trader.execution.messages import SubmitOrder
from nautilus_trader.execution.messages import SubmitOrderList
from nautilus_trader.execution.reports import FillReport
from nautilus_trader.execution.reports import OrderStatusReport
from nautilus_trader.execution.reports import PositionStatusReport
from nautilus_trader.live.execution_client import LiveExecutionClient


class TemplateLiveExecutionClient(LiveExecutionClient):
    """示例 `LiveExecutionClient`，概述所需覆盖的方法。"""

    async def _connect(self) -> None:
        raise NotImplementedError("implement `_connect` in your adapter subclass")

    async def _disconnect(self) -> None:
        raise NotImplementedError("implement `_disconnect` in your adapter subclass")

    async def _submit_order(self, command: SubmitOrder) -> None:
        raise NotImplementedError("implement `_submit_order` in your adapter subclass")

    async def _submit_order_list(self, command: SubmitOrderList) -> None:
        raise NotImplementedError("implement `_submit_order_list` in your adapter subclass")

    async def _modify_order(self, command: ModifyOrder) -> None:
        raise NotImplementedError("implement `_modify_order` in your adapter subclass")

    async def _cancel_order(self, command: CancelOrder) -> None:
        raise NotImplementedError("implement `_cancel_order` in your adapter subclass")

    async def _cancel_all_orders(self, command: CancelAllOrders) -> None:
        raise NotImplementedError("implement `_cancel_all_orders` in your adapter subclass")

    async def _batch_cancel_orders(self, command: BatchCancelOrders) -> None:
        raise NotImplementedError("implement `_batch_cancel_orders` in your adapter subclass")

    async def generate_order_status_report(
        self,
        command: GenerateOrderStatusReport,
    ) -> OrderStatusReport | None:
        raise NotImplementedError("method `generate_order_status_report` must be implemented in the subclass")

    async def generate_order_status_reports(
        self,
        command: GenerateOrderStatusReports,
    ) -> list[OrderStatusReport]:
        raise NotImplementedError("method `generate_order_status_reports` must be implemented in the subclass")

    async def generate_fill_reports(
        self,
        command: GenerateFillReports,
    ) -> list[FillReport]:
        raise NotImplementedError("method `generate_fill_reports` must be implemented in the subclass")

    async def generate_position_status_reports(
        self,
        command: GeneratePositionStatusReports,
    ) -> list[PositionStatusReport]:
        raise NotImplementedError("method `generate_position_status_reports` must be implemented in the subclass")
```

关键方法：

- `_connect`：建立与场馆 API 的连接。
- `_disconnect`：关闭连接。
- `_submit_order`：向场馆提交新订单。
- `_submit_order_list`：提交订单列表。
- `_modify_order`：修改已存在订单。
- `_cancel_order`：撤销指定订单。
- `_cancel_all_orders`：撤销场馆上某 instrument 的所有订单。
- `_batch_cancel_orders`：批量撤单。
- `generate_order_status_report`：为指定订单生成状态报告。
- `generate_order_status_reports`：为所有订单生成状态报告。
- `generate_fill_reports`：为已成交订单生成成交报告。
- `generate_position_status_reports`：生成头寸状态报告。

### 配置

配置文件定义适配器相关设置，例如 API key 与连接信息。此类设置对初始化与管理适配器连接至数据提供方至关重要。

```python
from nautilus_trader.config import LiveDataClientConfig
from nautilus_trader.config import LiveExecClientConfig


class TemplateDataClientConfig(LiveDataClientConfig):
    """`TemplateDataClient` 的配置类。"""

    api_key: str
    api_secret: str
    base_url: str


class TemplateExecClientConfig(LiveExecClientConfig):
    """`TemplateExecClient` 的配置类。"""

    api_key: str
    api_secret: str
    base_url: str
```

关键属性：

- `api_key`：用于与数据提供方认证的 API key。
- `api_secret`：用于认证的 API secret。
- `base_url`：连接到数据提供方 API 的 base URL。

## 常见测试场景

针对适配器说明书中声称支持的每一种场馆行为都应该有测试用例。把下列场景纳入 Rust 与 Python 的测试套件。

### 产品覆盖

确保每个支持的产品类别都有测试覆盖：

- 现货（Spot）
- 衍生品（永续、期货、掉期）
- 期权与结构化产品

### 订单流

- 覆盖每种支持的订单类型（限价、市价、止损、条件单等），在各类场馆的 time-in-force、到期与拒单处理下都应验证行为。
- 提交买/卖市价单，并断言余额、头寸与平均价更新与场馆响应一致。
- 提交代表性的买/卖限价单，验证确认、执行报告、完整/部分成交与撤单流程。

### 状态管理

- 在启动会话时带有未完成订单，以确保适配器在连接时能与场馆对齐状态后再发出新命令。
- 预置头寸并确认头寸快照、估值与 PnL 在交易前与场馆一致。
