# 数据测试规范 {#data-testing-spec}

使用这份测试矩阵，配合 Rust 的 `DataTester` actor 验证适配器的数据功能。Python 将其作为内置 actor 暴露，通过
`nautilus_trader.testkit.DataTesterConfig` 配置；Rust 代码从 `nautilus_testkit::testers` 导入。用例使用带前缀的
ID（例如 TC-D01），按功能分组。

**每个适配器必须通过与其支持的数据类型相对应的那部分测试。**

测试组按数据派生程度从低到高排列：先金融工具和原始订单簿数据，再报价、成交、K 线和衍生品数据。
通过第 1-4 组的适配器即视为达到基线数据合规。

适配器特有的数据行为（自定义通道、限流、快照语义等）写在各适配器自己的指南里，不写在这里。

## 前置条件 {#prerequisites}

运行数据测试前：

- 目标金融工具可用，且能通过 instrument provider 加载。
- 被测数据在交易场所需要鉴权时，通过环境变量设置 API 凭证（`{VENUE}_API_KEY`、`{VENUE}_API_SECRET`）。
- 交易场所若提供 demo/testnet 模式，使用该环境下创建的凭证。演示环境与生产环境的 API key 通常相互独立、
  不可互换。用错凭证会导致鉴权错误（如 HTTP 401）。

**Python 节点搭建**：

使用 `nautilus_trader.live.LiveNode`。若需在节点构建前注册适配器客户端工厂，调用 `LiveNode.builder(...)`。

```python
from nautilus_trader.common import Environment
from nautilus_trader.config import LiveDataEngineConfig
from nautilus_trader.live import LiveNode
from nautilus_trader.model import TraderId
from nautilus_trader.testkit import DataTesterConfig

node = (
    LiveNode.builder("TESTER-001", TraderId("TESTER-001"), Environment.SANDBOX)
    .with_data_engine_config(LiveDataEngineConfig(time_bars_build_with_no_updates=False))
    .add_data_client(None, adapter_data_client_factory, data_client_config)
    .build()
)

tester_config = DataTesterConfig(
    client_id=client_id,
    instrument_ids=[instrument_id],
    subscribe_quotes=True,
)
node.add_builtin_actor("DataTester", tester_config)
# Register remaining components, then start or run
```

**Rust 节点搭建**（参考：`crates/adapters/{adapter}/examples/node_data_tester.rs`）：

```rust
use nautilus_testkit::testers::{DataTester, DataTesterConfig};

let tester_config = DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_quotes(true)
    .build()?;
let tester = DataTester::new(tester_config);
node.add_actor(tester)?;
node.run().await?;
```

## 时间戳量纲 {#timestamp-scale}

Nautilus 以 Unix 纳秒（`UnixNanos`）存储 `ts_event` 和 `ts_init`。凡是携带这两个字段的数据消息都必须使用该
量纲，不能残留秒、毫秒或微秒。

- 小于 `10^16` 的值不可能是合法的 Unix 纳秒时间戳（`10^16` ns 约为 1970-01-01 之后 116 天），通常说明适配器
  没有把交易场所的量纲转换过来。
- 转换正确的秒级交易场所时间以 `000000000` 结尾，仍然算通过：那是精度粗，不是量纲错误。
- 实时流的 `ts_event` 应接近会话的挂钟时间。历史请求的结果可以更久远，只要量纲是纳秒就仍然有效。
- `ts_init` 是 Nautilus 创建对象时的本地时钟。交易场所时钟超前时，`ts_event` 略大于 `ts_init` 是可能的。

以下数据类型（含各自的历史批量数据）的 `ts_event` 或 `ts_init` 未通过量纲检查时，`DataTester` 会发出警告：

- 金融工具、instrument status 和 instrument close。
- 订单簿增量和订单簿深度。
- 报价、成交和 K 线。
- 标记价格、指数价格和资金费率。
- 期权希腊值。

`on_book` 中重建出的订单簿不做检查。产生警告的用例一律按失败处理。

---

## 订单簿同步合规 {#order-book-sync-conformance}

从交易场所数据流维护订单簿的适配器，必须在交易场所和网络故障下保持输出合法。单元测试和集成测试无法复现
交易场所的时序，因此改动订单簿同步与恢复机制时，既要通过确定性的模型检查，也要针对真实交易场所做实时验证。

此处的**实时验证**指只观察行情：订阅、请求、注入故障。验证期间不要下单。**暗簿（dark book）**指订阅后
始终收不到数据的订单簿。

### 订单簿数据流契约 {#book-stream-contract}

`nautilus_live::book::conformance` 中的 `BookStreamChecker`（由 `nautilus-live` 的 `test-support` feature
启用）对每个发出的 `OrderBookDeltas` 批次应用该契约：

- 批次以 `F_LAST` 结束。每个 `F_LAST` 闭合一个事件组，且每组结束后订单簿都必须通过完整性检查，因为消费者
  在这些边界处观察订单簿。
- 快照组是一个 `Clear` 后接若干 `Add` 增量，全部带 `F_SNAPSHOT` 标志。单独的 `Clear` 是空快照。
- 增量组既不带 `F_SNAPSHOT` 也不带 `Clear`，且位于快照之后。
- 当交易场所序列号在单个快照 episode 内单调递增时，每个增量组的序列号应大于前一组。OKX 的 `seqId` 可能重置；
  Polymarket、Hyperliquid、Betfair 和 AX Exchange 的订单簿不带交易场所序列号。因此这些交易场所的检查器
  跳过该规则，依赖 oracle。
- 订单簿退订完成后不再发出任何内容。

### 验证级别 {#validation-levels}

按改动中风险最高的方面选择级别。级别越高，包含以下各级的全部要求。

| 级别 | 触发条件 | 方法 | 验收标准 |
| ------------------ | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| L0 模型 | 任何对 `BookSync`、`BookRecovery` 或适配器对其使用的改动 | 针对参考模型做单簿状态机的属性测试，外加植入的回归用例 | 属性测试通过；回退已知修复（如 gap 所有权规则）时会失败 |
| L1 合规 | 任何对已验证过的同步/恢复代码的改动 | 重跑该交易场所的压力测试装置或既有 oracle | 在既定标准上 PASS，零检查器违规、零暗簿、零无法解释的错误 |
| L2 边界探测 | 边界行为变化（超时、禁用路径、预算耗尽、重试上限） | 定向边界场景，覆盖每个新的调参极端值 | 所有场景通过；禁用路径保持静默；预算耗尽后到达上限，迟到快照仍能恢复订单簿 |
| L3 竞态探测 | 并发或顺序变化（门控、epoch、重连交互），或任何实时发现的竞态修复 | 独立 oracle 下做故障注入加订阅抖动 | 数十次强制恢复全部完成且零暗簿；上报的竞态场景通过且不再复发 |
| L4 完整验证 | 新的同步/恢复实现 | L1-L3 加上持续的抖动与重连故障浸泡 | 浸泡全程保持各级标准；恢复延迟有界 |

L0 属性测试是 `crates/live/src/book/sync.rs` 中的 `schedule_keeps_sync_contract`。随改动记录级别、交易场所、
oracle 和结果。实时验证发现的修复从发现它的级别重新开始：重跑必须达到同一标准，不能降低。

### 故障目录 {#fault-catalog}

无论属于哪个[恢复家族](./adapters.md#order-book-recovery-ownership)，每个适配器都必须产生下列结果：

| 故障 | 要求的结果 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 序列号缺口 | 输出在缺口处停止，仅在新鲜快照替换订单簿后恢复。 |
| 快照缺失或迟到 | 快照截止时间触发或重试恢复。两次尝试之间接受了快照则结束恢复。 |
| 恢复无法启动 | 订单簿保持无主状态，在下一帧再次请求恢复。被拒绝的任务会取消其已认领的 episode。 |
| 替换被拒绝 | 恢复重试。分类器判定为永久性的错误跳过预算、直接按上限重试。 |
| 重试预算耗尽 | 记录一次错误日志，然后按上限重试直到快照被接受。 |
| 恢复中途重连 | 进行中的恢复保留其预算、所有权和写入中的操作，其下一次上限等待立即结束。其他订单簿从新鲜快照重新同步。 |
| 恢复期间退订 | 恢复及其挂起写入停止，订单簿不再发出任何内容。 |

### 构造手段 {#forcing-techniques}

优先构造不同的时序组合，而不是单纯堆消息量。只有当探测能强制出测试套件无法产生的时序（恢复中途重连、快照与
门控开启赛跑、退订与进行中的订阅赛跑）时，它才值得保留。仅靠消息数量不足以支撑一个探测。

| 手段 | 施压点 | 被证明有效的数字 | 实际捕获的问题 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 订阅抖动（轮换退订/重订阅，周期性全量切换） | 恢复发起、门控/epoch 轮换、写入中取消的竞态 | 10-15 分钟运行配 20 秒 tick。数十次（40+）强制恢复且零暗簿 | 无法恢复的重复订阅缺陷（迫使重新设计） |
| 流量冻结（切断隧道约 40 秒） | 死连接检测、重连重放、重连后恢复 | 每次运行 2-3 次冻结，间隔数分钟 | 验证完全丢包下的重连恢复。尚未捕获缺陷 |
| 代理故障注入（按规则丢弃/扣留/切断帧） | 缺口处理、扣留帧释放、oracle 合规 | 每次运行数千个 oracle 批次（6k+）、逐轮缺口计数 | 超时缩放导致的装置竞态（观测窗口 vs 新默认值） |
| 调参极端值（0 加一个较短的非默认值） | 禁用截止时间的分支、参数端到端传递 | 每个极端值一次短运行（4-5 分钟）并叠加抖动 | 在线确认了评审发现的零超时修复；验证参数传递 |
| 客户端主动重连（公共重连命令，随后继续施压） | 不动宿主机网络的重连恢复 | 5+ 次连续重连/对账通过 | 验证无宿主机故障下的恢复。尚未捕获缺陷 |
| 竞态场景串行重复 | 调度敏感性 | 5+ 次连续通过；确定性装置重复 100 次 | 偶发失败、单次通过掩盖的flake |

每个交易场所都要经由其服务的网络位置接入。Polymarket 按地区限制访问；OKX、Lighter、Binance、Hyperliquid 和
AX Exchange 校验直连。长时间运行前先确认该路由能送达交易场所数据：socket 能连上但交易场所可能一直沉默。
交易场所线上永远不产生的分支应放进捕获报文的确定性装置，而不是实时运行。

### Oracle {#oracles}

oracle 是对交易场所真实状态的独立重建，通过 `BookStreamChecker::verify` 与发出的订单簿比对：

- 从独立连接或 REST 快照构建，绝不使用适配器自身的状态。
- 在已对齐的交易场所序列号处比对。无法对齐的样本跳过，不算通过。
- 快照 episode 在其快照之后的某次比对成功时计为已验证。带 `Coverage::Episodes` 的装置（如 OKX）在每批到达时
  即验证，任一 episode 未验证则整个会话失败。带 `Coverage::Samples` 的装置（如 Binance）事后按 update ID
  匹配 oracle 样本，因此它报告的是 oracle 检查和未匹配样本，而非 episode 覆盖率。

### 压力测试装置 {#stress-harnesses}

压力测试装置是修改订单簿同步与恢复代码时使用的开发工具。它们不属于发布的 crate，也不在 CI 中运行。装置使用的
`BookStreamChecker` 随 `nautilus-live` 的 `test-support` feature 发布，其他测试可以套用同一契约。

使用共享订单簿机制的适配器，其实时装置放在 `crates/adapters/<venue>/tests/stress/book_stress.rs`，注册为名为
`<venue>-book-stress` 的测试 target：

```toml
[[test]]
name = "okx-book-stress"
path = "tests/stress/book_stress.rs"
harness = false
test = false
required-features = ["examples"]
```

`harness = false` 让该 target 自己掌控 runtime 和参数，`test = false` 使其不进入默认的 `cargo test` 和 nextest
运行。在 crate 的 dev-dependencies 中加入带 `test-support` feature 的 `nautilus-live`。

共享机制是 `crates/live/tests/book/stress/` 下的测试源码，各装置通过 path include 将其编译进来：

```rust
#[path = "../../../../live/tests/book/stress/mod.rs"]
mod stress;
```

共享模块负责运行装置，交易场所只需实现 `StressVenue` 提供自己的部件：

- 一个 `WireCodec`，把每个交易场所帧分类为订单簿快照、订单簿更新或退订确认。它在应用任何故障之前先把帧记入
  oracle。它还能改写帧以植入序列缺口或带内不匹配，并对适配器的订阅返回交易场所拒绝。
- 代理路由、数据客户端配置，以及任何额外代理路由（如 REST 快照代理）。
- 每个发出批次的 oracle 比对、订单簿健康的判定条件，以及启动自检。
- 针对 `Session` 编写的场景。

`FaultProxy` 将适配器的 WebSocket 流量转发给交易场所。若某路由的上游 URL 不是 WebSocket URL，它以裸 TCP 转发
CRLF 分隔的行。行路由只提供代理地址，交易场所的 `WireCodec::connect` 自行打开上游连接（例如经 TLS）。

代理按订单簿应用 `Fault` 规则（丢弃快照或更新、篡改、扣留、静默、退订时切断、拒绝订阅），并支持连接级的切断
与冻结。`Session` 让每个发出的批次经过 `BookStreamChecker` 和 oracle，等待订单簿自愈。关闭时检查所有 socket
和重连句柄均已释放。

各装置接受同一组参数，交易场所可另加自己的参数。`--help` 会列出：

| 参数 | 含义 | 默认值 |
| ----------------- | -------------------------------------------------------------- | ------------- |
| `--scenario NAME` | 要运行的场景。 | `churn` |
| `--timeout SECS`  | `book_snapshot_timeout_secs`。`0` 禁用快照截止时间。 | `10`          |
| `--rounds N`      | 压力轮数。 | 交易场所默认值 |

显式运行装置，并剥离适配器环境变量：

```bash
CARGO_BUILD_JOBS=16 bash scripts/strip-adapter-env.bash \
  cargo test -p nautilus-okx --features examples --test okx-book-stress -- --timeout 10 --rounds 18
```

Betfair 只向已登录账户推送行情，因此其装置需在设置 Betfair 凭证后运行。参见
[Live recovery validation](./../integrations/betfair.md#live-recovery-validation)。AX Exchange 的行情同样需要
鉴权，因此其装置从环境读取 sandbox 凭证，且不经包装脚本直接运行。

装置向 stderr 每个事件写一行，行首是固定单词：

| 行首 | 含义 |
| ---------- | ----------------------------------------------------------------------- |
| `START`    | 交易场所和参数。 |
| `CHECK`    | 启动自检或场景探测通过。 |
| `ROUND`    | 一个压力轮结束，附计数器。 |
| `SHUTDOWN` | 会话干净停止，附计数器和 oracle 覆盖率。 |
| `PASS`     | 运行完成。永远是成功运行的最后一行。 |
| `FAIL`     | 某检查失败或任一线程 panic。进程以状态码 1 退出。 |

截止时间失败时会报告每个代理路由收到的交易场所帧，以区分路由静默与适配器故障。

**自检**：`harness = false` 的 target 无法运行 `#[test]` 函数，因此交易场所要在任何交易场所流量发生前，于
`StressVenue::self_check` 中证明自己的报文解析和 oracle。共享代理、参数解析和裸订单簿在 `nautilus-live` 的
`book` 测试 target 中带有单元测试，用
`cargo nextest run -p nautilus-live --features test-support --test book` 运行。

**装置文档**：在适配器的集成指南中添加 `Live recovery validation` 标题，写明其检查项、注入的故障、运行命令、
场景、参数和所需端点。OKX、Binance、Lighter、Polymarket、Hyperliquid、Bybit、Betfair 和 AX Exchange 提供装置。

### 带内验证 {#in-band-verification}

交易场所若发布订单簿校验和或哈希，就对其进行验证，不匹配按缺口处理。无需外部 oracle，即可发现序列检查漏掉的
覆盖数据中的损坏。

- **Kraken**：启用 `validate_l2_checksum` 和 `validate_l3_checksum` 时（两者均为默认），验证每条现货 L2
  `book` 和 L3 消息的 CRC32 校验和。
- **Polymarket**：验证携带哈希及其完整原像的每个订单簿快照上的哈希。参见
  [book snapshot validation](./../integrations/polymarket.md#book-snapshot-validation)。
- **OKX**：`books` 帧的 `checksum` 为零，验证因此改为依赖 oracle。

---

下面每组先给汇总表格，随后是详细测试卡片。
测试 ID 采用间隔编号，便于插入新用例而无需重排。

---

## 第 1 组：金融工具 {#group-1-instruments}

先验证金融工具的加载与订阅，再测试行情数据流。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ------------------------ | --------------------------------- | ------------------ |
| TC-D01 | 请求金融工具 | 加载某交易场所的全部金融工具。 | 从不 |
| TC-D02 | 订阅金融工具 | 订阅金融工具更新。 | 不支持工具订阅 |
| TC-D03 | 加载指定金融工具 | 按 ID 加载单个金融工具。 | 从不 |

### TC-D01：请求金融工具 {#tc-d01-request-instruments}

| 字段 | 值 |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接。 |
| **操作** | DataTester 启动时请求该交易场所的全部金融工具。 |
| **事件序列** | `on_instruments` 回调收到金融工具列表。 |
| **通过标准** | 至少收到一个金融工具。每个都有合法 symbol、价格精度和数量增量。 |
| **跳过条件** | 从不。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    request_instruments=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .request_instruments(true)
    .build()?
```

### TC-D02：订阅金融工具 {#tc-d02-subscribe-instrument}

| 字段 | 值 |
| ------------------ | --------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 订阅金融工具更新。 |
| **事件序列** | `on_instrument` 回调收到金融工具。 |
| **通过标准** | 收到的金融工具 `instrument_id` 正确、字段合法。 |
| **跳过条件** | 适配器不支持金融工具订阅。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_instrument=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_instrument(true)
    .build()?
```

### TC-D03：加载指定金融工具 {#tc-d03-load-specific-instrument}

| 字段 | 值 |
| ------------------ | -------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接。 |
| **操作** | 通过 instrument provider 按 `InstrumentId` 加载指定金融工具。 |
| **事件序列** | 加载后金融工具在 cache 中可用。 |
| **通过标准** | 加载的金融工具 ID、价格精度、数量增量和交易规则均正确。 |
| **跳过条件** | 从不。 |

**注意事项**：

- 该用例直接测试 instrument provider 的 `load` / `load_async` 方法。
- 用 `self.cache.instrument(instrument_id)` 确认金融工具已缓存且可取。

---

## 第 2 组：订单簿 {#group-2-order-book}

测试订单簿订阅模式与快照请求。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | -------------------------- | ----------------------------------- | ----------------- |
| TC-D10 | 订阅订单簿增量 | 以流式接收 `OrderBookDeltas` 更新。 | 不支持订单簿 |
| TC-D11 | 按间隔订阅订单簿 | 周期性 `OrderBook` 快照。 | 不支持订单簿 |
| TC-D12 | 订阅订单簿深度 | `OrderBookDepth` 快照。 | 不支持订单簿深度 |
| TC-D13 | 请求订单簿快照 | 一次性订单簿快照请求。 | 不支持快照请求 |
| TC-D14 | 由增量维护本地订单簿 | 从增量流构建本地订单簿。 | 不支持订单簿 |

Python 在这些场景使用 `BookType.L2_MBP`。适配器需要其他订单簿表示时，Rust builder 可覆盖 `book_type`。

### TC-D10：订阅订单簿增量 {#tc-d10-subscribe-book-deltas}

| 字段 | 值 |
| ------------------ | -------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 订阅订单簿增量。 |
| **事件序列** | `on_book_deltas` 中收到 `OrderBookDeltas` 事件。 |
| **通过标准** | 收到的增量 instrument ID 合法，且至少一条增量包含 bid/ask 更新。 |
| **跳过条件** | 适配器不支持订单簿数据。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_book_deltas=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_book_deltas(true)
    .book_type(BookType::L2_MBP)
    .build()?
```

### TC-D11：按间隔订阅订单簿 {#tc-d11-subscribe-book-at-interval}

| 字段 | 值 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 订阅周期性订单簿快照。 |
| **事件序列** | 按配置间隔在 `on_book` 中收到 `OrderBook` 事件。 |
| **通过标准** | 收到含 bid/ask 档位的订单簿快照。更新大致按配置间隔到达。 |
| **跳过条件** | 适配器不支持订单簿数据。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_book_at_interval=True,
    book_depth=10,
    book_interval_ms=1000,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_book_at_interval(true)
    .book_type(BookType::L2_MBP)
    .book_depth(10)
    .book_interval_ms(1000)
    .build()?
```

### TC-D12：订阅订单簿深度 {#tc-d12-subscribe-book-depth}

| 字段 | 值 |
| ------------------ | -------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 订阅 `OrderBookDepth` 快照。 |
| **事件序列** | `on_book_depth` 中收到 `OrderBookDepth` 事件。 |
| **通过标准** | 深度快照遵守请求的档位上限，价格排序正确。 |
| **跳过条件** | 适配器不支持订单簿深度订阅。 |

选择交易场所支持的深度，其上限见适配器指南。`book_depth` 作用于全部已启用的订单簿订阅和订单簿快照请求；
省略时使用适配器默认值。

- 深度与增量或间隔订单簿同时运行时，DataTester 以 `managed=False` 订阅深度，避免覆盖由增量维护的订单簿。
- 只启用深度时，其 managed 设置跟随 `manage_book`。

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_book_depth=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_book_depth(true)
    .book_type(BookType::L2_MBP)
    .build()?
```

### TC-D13：请求订单簿快照 {#tc-d13-request-book-snapshot}

| 字段 | 值 |
| ------------------ | ------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 请求一次性订单簿快照。 |
| **事件序列** | 通过历史数据回调收到订单簿快照。 |
| **通过标准** | 快照包含价格与数量均合法的 bid/ask 档位。 |
| **跳过条件** | 适配器不支持订单簿快照请求。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    request_book_snapshot=True,
    book_depth=10,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .request_book_snapshot(true)
    .book_depth(10)
    .build()?
```

### TC-D14：由增量维护本地订单簿 {#tc-d14-managed-book-from-deltas}

| 字段 | 值 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，订单簿增量正在流入。 |
| **操作** | DataTester 以 `manage_book=True` 订阅增量，从增量流构建本地订单簿。 |
| **事件序列** | `OrderBookDeltas` 应用到本地 `OrderBook`，按配置深度记录订单簿日志。 |
| **通过标准** | 本地订单簿由增量正确构建。bid 档位递减，ask 档位递增；初始快照后订单簿非空。 |
| **跳过条件** | 适配器不支持订单簿数据。 |

**注意事项**：

- 受管订单簿会把每条增量应用到 actor 维护的 `OrderBook` 实例上。
- 用 `book_levels_to_print` 控制日志详细程度。

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_book_deltas=True,
    manage_book=True,
    book_levels_to_print=10,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_book_deltas(true)
    .manage_book(true)
    .book_type(BookType::L2_MBP)
    .build()?
```

`DataTesterConfig` 暴露了 `request_book_deltas`，但 `DataTester` 尚未发出该历史请求。在测试器实现该请求路径
之前，通过自定义 actor 测试适配器的历史订单簿增量支持。

---

## 第 3 组：报价 {#group-3-quotes}

测试报价逐笔（tick）订阅与历史请求。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ------------------------- | ------------------------------------------- | --------------------- |
| TC-D20 | 订阅报价 | 验证启动后有 `QuoteTick` 事件流入。 | 从不 |
| TC-D21 | 请求历史报价 | 请求历史报价逐笔数据。 | 无历史报价 |

### TC-D20：订阅报价 {#tc-d20-subscribe-quotes}

| 字段 | 值 |
| ------------------ | --------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 启动时订阅报价。 |
| **事件序列** | `on_quote` 中收到 `QuoteTick` 事件。 |
| **通过标准** | 至少收到一个 `QuoteTick`，bid/ask 价格与数量合法，且 bid < ask。 |
| **跳过条件** | 从不。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_quotes=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_quotes(true)
    .build()?
```

### TC-D21：请求历史报价 {#tc-d21-request-historical-quotes}

| 字段 | 值 |
| ------------------ | ----------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 请求历史报价逐笔数据。 |
| **事件序列** | 通过 `on_historical_quotes` 收到历史报价批次。 |
| **通过标准** | 收到的报价时间戳、bid/ask 价格和数量均合法。 |
| **跳过条件** | 适配器不支持历史报价请求。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    request_quotes=True,
)
```

---

## 第 4 组：成交 {#group-4-trades}

测试成交逐笔（tick）订阅与历史请求。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ------------------------- | ------------------------------------------- | --------------------- |
| TC-D30 | 订阅成交 | 验证启动后有 `TradeTick` 事件流入。 | 从不 |
| TC-D31 | 请求历史成交 | 请求历史成交逐笔数据。 | 无历史成交 |

### TC-D30：订阅成交 {#tc-d30-subscribe-trades}

| 字段 | 值 |
| ------------------ | ----------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 启动时订阅成交。 |
| **事件序列** | `on_trade` 中收到 `TradeTick` 事件。 |
| **通过标准** | 至少收到一个 `TradeTick`，价格、数量和主动成交方向均合法。 |
| **跳过条件** | 从不。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_trades=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_trades(true)
    .build()?
```

### TC-D31：请求历史成交 {#tc-d31-request-historical-trades}

| 字段 | 值 |
| ------------------ | -------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载。 |
| **操作** | DataTester 请求历史成交逐笔数据。 |
| **事件序列** | 通过 `on_historical_trades` 收到历史成交批次。 |
| **通过标准** | 收到的成交时间戳、价格、数量和成交 ID 均合法。 |
| **跳过条件** | 适配器不支持历史成交请求。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    request_trades=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .request_trades(true)
    .build()?
```

---

## 第 5 组：K 线 {#group-5-bars}

测试 K 线订阅与历史请求。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ----------------------- | ------------------------------------- | ------------------- |
| TC-D40 | 订阅 K 线 | 验证启动后有 `Bar` 事件流入。 | 不支持 K 线 |
| TC-D41 | 请求历史 K 线 | 请求历史 OHLCV K 线。 | 无历史 K 线 |

### TC-D40：订阅 K 线 {#tc-d40-subscribe-bars}

| 字段 | 值 |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，K 线类型已配置。 |
| **操作** | DataTester 订阅已配置 `BarType` 的 K 线。 |
| **事件序列** | `on_bar` 中收到 `Bar` 事件。 |
| **通过标准** | 至少收到一个 `Bar`，OHLCV 值合法：high >= low、high >= open、high >= close。 |
| **跳过条件** | 适配器不支持 K 线订阅。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    bar_types=[BarType.from_str("BTCUSDT-PERP.VENUE-1-MINUTE-LAST-EXTERNAL")],
    subscribe_bars=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .bar_types(vec![bar_type])
    .subscribe_bars(true)
    .build()?
```

### TC-D41：请求历史 K 线 {#tc-d41-request-historical-bars}

| 字段 | 值 |
| ------------------ | --------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，K 线类型已配置。 |
| **操作** | DataTester 请求已配置 `BarType` 的历史 K 线。 |
| **事件序列** | 通过回调收到历史 K 线。 |
| **通过标准** | 收到的 K 线 OHLCV 值合法，时间戳递增。 |
| **跳过条件** | 适配器不支持历史 K 线请求。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    bar_types=[BarType.from_str("BTCUSDT-PERP.VENUE-1-MINUTE-LAST-EXTERNAL")],
    request_bars=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .bar_types(vec![bar_type])
    .request_bars(true)
    .build()?
```

---

## 第 6 组：衍生品数据 {#group-6-derivatives-data}

测试衍生品专属数据流：标记价格、指数价格和资金费率。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | -------------------------------- | ----------------------------- | ----------------- |
| TC-D50 | 订阅标记价格 | `MarkPriceUpdate` 事件。 | 非衍生品 |
| TC-D51 | 订阅指数价格 | `IndexPriceUpdate` 事件。 | 非衍生品 |
| TC-D52 | 订阅资金费率 | `FundingRateUpdate` 事件。 | 非永续合约 |
| TC-D53 | 请求历史资金费率 | 历史资金费率数据。 | 非永续合约 |

### TC-D50：订阅标记价格 {#tc-d50-subscribe-mark-prices}

| 字段 | 值 |
| ------------------ | -------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，衍生品金融工具已加载。 |
| **操作** | DataTester 订阅标记价格更新。 |
| **事件序列** | `on_mark_price` 中收到 `MarkPriceUpdate` 事件。 |
| **通过标准** | 至少收到一个 `MarkPriceUpdate`，instrument ID 和标记价格合法。 |
| **跳过条件** | 金融工具不是衍生品，或适配器不提供标记价格。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_mark_prices=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_mark_prices(true)
    .build()?
```

### TC-D51：订阅指数价格 {#tc-d51-subscribe-index-prices}

| 字段 | 值 |
| ------------------ | ---------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，衍生品金融工具已加载。 |
| **操作** | DataTester 订阅指数价格更新。 |
| **事件序列** | `on_index_price` 中收到 `IndexPriceUpdate` 事件。 |
| **通过标准** | 至少收到一个 `IndexPriceUpdate`，instrument ID 和指数价格合法。 |
| **跳过条件** | 金融工具不是衍生品，或适配器不提供指数价格。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_index_prices=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_index_prices(true)
    .build()?
```

### TC-D52：订阅资金费率 {#tc-d52-subscribe-funding-rates}

| 字段 | 值 |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，永续合约金融工具已加载。 |
| **操作** | DataTester 订阅资金费率更新。 |
| **事件序列** | `on_funding_rate` 中收到 `FundingRateUpdate` 事件。 |
| **通过标准** | 至少收到一个 `FundingRateUpdate`，instrument ID 和费率合法。 |
| **跳过条件** | 金融工具不是永续合约，或适配器不提供资金费率。 |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_funding_rates=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_funding_rates(true)
    .build()?
```

### TC-D53: Request historical funding rates

| Field              | Value                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------- |
| **Prerequisite**   | Adapter connected, perpetual instrument loaded.                                              |
| **Action**         | DataTester requests historical funding rates (default 7-day lookback).                       |
| **Event sequence** | Historical funding rates received via callback.                                              |
| **Pass criteria**  | Funding rates received with valid timestamps and rate values.                                |
| **Skip when**      | Instrument is not a perpetual, or adapter does not support historical funding rate requests. |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    request_funding_rates=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .request_funding_rates(true)
    .build()?
```

---

## Group 7: Instrument status

Test instrument status and close event subscriptions.

| TC     | Name                        | Description                | Skip when          |
| ------ | --------------------------- | -------------------------- | ------------------ |
| TC-D60 | Subscribe instrument status | `InstrumentStatus` events. | No status support. |
| TC-D61 | Subscribe instrument close  | `InstrumentClose` events.  | No close support.  |

### TC-D60: Subscribe instrument status

| Field              | Value                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| **前置条件**   | 适配器已连接，金融工具已加载。                                    |
| **Action**         | DataTester subscribes to instrument status updates.                      |
| **Event sequence** | `InstrumentStatus` events received in `on_instrument_status`.            |
| **Pass criteria**  | Status events received with valid `MarketStatusAction` (e.g. `Trading`). |
| **Skip when**      | Adapter does not support instrument status subscriptions.                |

**Considerations**:

- Status events may only fire on state changes (e.g. trading halt -> resume).
- During normal trading hours, a `Trading` status may be received on subscribe.

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_instrument_status=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_instrument_status(true)
    .build()?
```

### TC-D61: Subscribe instrument close

| Field              | Value                                                       |
| ------------------ | ----------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载。                       |
| **Action**         | DataTester subscribes to instrument close events.           |
| **Event sequence** | `InstrumentClose` events received in `on_instrument_close`. |
| **Pass criteria**  | Close event received with valid close price and close type. |
| **Skip when**      | Adapter does not support instrument close subscriptions.    |

**Considerations**:

- Close events typically fire at end-of-session for traditional markets.
- May not fire for 24/7 crypto venues unless the adapter synthesizes a daily close.

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_instrument_close=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_instrument_close(true)
    .build()?
```

---

## Group 8: Option greeks

Test option greeks and option chain subscriptions.

| TC     | Name                    | Description                                  | Skip when          |
| ------ | ----------------------- | -------------------------------------------- | ------------------ |
| TC-D62 | Subscribe option greeks | `OptionGreeks` data for a single instrument. | No greeks support. |
| TC-D63 | Subscribe option chain  | `OptionChainSlice` snapshots for a series.   | No chain support.  |

### TC-D62: Subscribe option greeks

| Field              | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| **Prerequisite**   | Adapter connected, option instrument loaded.                 |
| **Action**         | DataTester subscribes to option greeks updates.              |
| **Event sequence** | `OptionGreeks` events received in `on_option_greeks`.        |
| **Pass criteria**  | Greeks received with valid delta, gamma, vega, theta values. |
| **Skip when**      | Adapter does not support option greeks subscriptions.        |

**Considerations**:

- Greeks are only available for option instruments.
- Values depend on the venue's pricing model and may update on every quote change.
- Some venues (Bybit, Deribit) subscribe per instrument. OKX subscribes per instrument family and filters to
  the requested instruments.
- `rho` may be zero when the venue does not provide it (Bybit, OKX).
- `underlying_price` and `open_interest` may be `None` depending on the venue channel.

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_option_greeks=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_option_greeks(true)
    .build()?
```

### TC-D63: Subscribe option chain

| Field              | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **Prerequisite**   | Adapter connected, option instruments loaded for the series.        |
| **Action**         | DataTester subscribes to option chain snapshots for a series.       |
| **Event sequence** | `OptionChainSlice` snapshots received in `on_option_chain`.         |
| **Pass criteria**  | Chain snapshot contains greeks for instruments matching the series. |
| **Skip when**      | Adapter does not support option chain subscriptions.                |

**Considerations**:

- Option chain subscriptions are managed by the DataEngine, which creates per-instrument
  quote and greeks subscriptions internally.
- Dynamic strike ranges require an ATM price before instrument subscriptions begin. The
  DataEngine requests an initial reference price and otherwise waits for live option Greeks.
- Not yet configurable via `DataTesterConfig`. Requires manual actor setup with `subscribe_option_chain` and
  an `OptionSeriesId`.

---

## Group 9: Lifecycle

Test actor lifecycle behavior: unsubscribe handling, retirement cleanup, and custom parameters.

| TC     | Name                    | Description                                     | Skip when         |
| ------ | ----------------------- | ----------------------------------------------- | ----------------- |
| TC-D70 | Unsubscribe on stop     | Unsubscribe from data feeds on actor stop.      | No unsub support. |
| TC-D71 | Custom subscribe params | Adapter-specific subscription parameters.       | N/A.              |
| TC-D72 | Custom request params   | Adapter-specific request parameters.            | N/A.              |
| TC-D73 | Retirement cleanup      | Release an actor's retained data subscriptions. | N/A.              |
| TC-D74 | DeFi shared pool demand | Keep shared pool feeds until the final owner.   | No DeFi support.  |
| TC-D75 | DeFi bootstrap cancel   | Discard snapshots for canceled pool bootstraps. | No DeFi support.  |

### TC-D70: Unsubscribe on stop

| Field              | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| **Prerequisite**   | Active data subscriptions (quotes, trades, book).                |
| **Action**         | Stop the actor with `can_unsubscribe=True` (default).            |
| **Event sequence** | Data subscriptions removed. No further data events received.     |
| **Pass criteria**  | Clean unsubscribe. No errors in logs. No data events after stop. |
| **Skip when**      | Adapter does not support unsubscribe.                            |

**Python 配置**：

```python
DataTesterConfig(
    instrument_ids=[instrument_id],
    subscribe_quotes=True,
    subscribe_trades=True,
    can_unsubscribe=True,
)
```

**Rust 配置**：

```rust
DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_quotes(true)
    .subscribe_trades(true)
    .can_unsubscribe(true)
    .build()?
```

### TC-D71: Custom subscribe params

| Field              | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Prerequisite**   | Adapter connected, adapter accepts additional subscription parameters. |
| **Action**         | Subscribe with adapter-specific `subscribe_params`.                    |
| **Event sequence** | Subscription established with custom parameters applied.               |
| **Pass criteria**  | Data flows with adapter-specific parameters in effect.                 |
| **Skip when**      | N/A (adapter-specific).                                                |

**Rust 配置**：

```rust
use nautilus_core::Params;
use serde_json::json;

let mut subscribe_params = Params::new();
subscribe_params.insert("key".to_string(), json!("value"));

DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .subscribe_quotes(true)
    .subscribe_params(subscribe_params)
    .build()?
```

**Considerations**:

- `subscribe_params` is opaque to the DataTester and passed through to the adapter.
- The Python `DataTesterConfig` constructor does not expose this Rust-only field.
- Consult the adapter's guide for supported parameters.

### TC-D72: Custom request params

| Field              | Value                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **Prerequisite**   | Adapter connected, adapter accepts additional request parameters.    |
| **Action**         | Request data with adapter-specific `request_params`.                 |
| **Event sequence** | Request fulfilled with custom parameters applied.                    |
| **Pass criteria**  | Historical data received with adapter-specific parameters in effect. |
| **Skip when**      | N/A (adapter-specific).                                              |

**Rust 配置**：

```rust
use nautilus_core::Params;
use serde_json::json;

let mut request_params = Params::new();
request_params.insert("key".to_string(), json!("value"));

DataTesterConfig::builder()
    .client_id(client_id)
    .instrument_ids(vec![instrument_id])
    .request_quotes(true)
    .request_params(request_params)
    .build()?
```

**Considerations**:

- `request_params` is opaque to the DataTester and passed through to the adapter.
- The Python `DataTesterConfig` constructor does not expose this Rust-only field.
- Consult the adapter's guide for supported parameters.

### TC-D73: Retirement cleanup

| Field              | Value                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Prerequisite**   | An actor has venue-backed subscriptions. Two actors share an internally aggregated bar.                                               |
| **Action**         | Retire the first actor, then retire the second actor through the trader.                                                              |
| **Event sequence** | `on_dispose` completes. Unsubscribe commands are sent. The actor is deregistered.                                                     |
| **Pass criteria**  | The first retirement keeps shared data active. The final retirement releases the retained route and leaves no retired actor handlers. |
| **Skip when**      | N/A.                                                                                                                                  |

The shared bar must remain active after the first actor retires and stop after the final actor
retires.

**Considerations**:

- `DataTesterConfig` does not cover multi-actor retirement. Create two actors manually, then remove
  them through Python `Controller.remove_actor` or Rust `Trader::remove_actor`.
- If `on_dispose` fails, the actor must remain registered with its subscriptions intact so a later
  retirement can release them without invoking the failed hook again.
- A failed `on_stop` or `on_fault` must not block retirement: disposal and deregistration must still
  complete from the corresponding transitional state.

### TC-D74: DeFi shared pool demand

| Field              | Value                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Prerequisite**   | A DeFi data client. Two actors subscribe to the same pool, through the same or overlapping subscription types.             |
| **Action**         | Retire or unsubscribe one actor, then the other, in each order.                                                            |
| **Event sequence** | The first release sends no client unsubscribe for shared types. The final release unsubscribes and stops the pool updater. |
| **Pass criteria**  | Pool events keep reaching the remaining actor and the profiler until the final release. None flow afterwards.              |
| **Skip when**      | Adapter does not provide DeFi pool subscriptions.                                                                          |

Cover these overlaps:

- Two actors with the same subscription type, retired in either order.
- `SubscribePool` with each narrower type (swaps, liquidity updates, fee collects, flash events),
  unsubscribed in both orders. The narrower event filters must stay active while either
  subscription remains.
- The same pool on two data clients. Each client keeps its own demand, and the pool updater stays
  active until both release.

**Considerations**:

- `DataTesterConfig` does not cover DeFi pool subscriptions. Create the actors manually.
- A duplicate unsubscribe from one actor must not release another actor's demand.

### TC-D75: DeFi bootstrap cancel

| Field              | Value                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Prerequisite**   | A DeFi data client. The pool is absent from the cache, so a subscription requests a pool snapshot.    |
| **Action**         | Subscribe, release the final owner before the pool definition arrives, then subscribe again.          |
| **Event sequence** | Two snapshot requests are sent. The response to the first arrives after the second subscription.      |
| **Pass criteria**  | The engine discards the first response. Only the response to the current request installs a profiler. |
| **Skip when**      | Adapter does not provide pool snapshots.                                                              |

**Considerations**:

- The second subscription requests a new snapshot only while the pool is absent from the cache. Once
  the first request's pool definition arrives, a later subscription builds the profiler from the
  cached pool instead, so the case needs a delayed response.
- An engine reset or disconnect also cancels pending bootstraps. A response that arrives afterwards
  must not install a profiler.

---

## DataTester configuration reference

The Python constructor accepts the parameters below. Defaults are resolved values after construction.
Historical quote, trade, and bar requests use a one-hour lookback. Funding rate requests use seven days. The
lookback is not configurable through `DataTesterConfig`.

| Parameter                     | Type                 | Default | Affects groups  |
| ----------------------------- | -------------------- | ------- | --------------- |
| `actor_id`                    | `ActorId?`           | `None`  | All             |
| `client_id`                   | `ClientId?`          | `None`  | All             |
| `instrument_ids`              | `list[InstrumentId]` | `[]`    | All             |
| `bar_types`                   | `list[BarType]?`     | `None`  | 5               |
| `subscribe_book_deltas`       | `bool`               | `False` | 2               |
| `subscribe_book_depth`        | `bool`               | `False` | 2               |
| `subscribe_book_at_interval`  | `bool`               | `False` | 2               |
| `subscribe_quotes`            | `bool`               | `False` | 3               |
| `subscribe_trades`            | `bool`               | `False` | 4               |
| `subscribe_mark_prices`       | `bool`               | `False` | 6               |
| `subscribe_index_prices`      | `bool`               | `False` | 6               |
| `subscribe_funding_rates`     | `bool`               | `False` | 6               |
| `subscribe_bars`              | `bool`               | `False` | 5               |
| `subscribe_instrument`        | `bool`               | `False` | 1               |
| `subscribe_instrument_status` | `bool`               | `False` | 7               |
| `subscribe_instrument_close`  | `bool`               | `False` | 7               |
| `subscribe_option_greeks`     | `bool`               | `False` | 8               |
| `can_unsubscribe`             | `bool`               | `True`  | 9               |
| `request_instruments`         | `bool`               | `False` | 1               |
| `request_book_snapshot`       | `bool`               | `False` | 2               |
| `request_book_deltas`         | `bool`               | `False` | Not implemented |
| `request_quotes`              | `bool`               | `False` | 3               |
| `request_trades`              | `bool`               | `False` | 4               |
| `request_bars`                | `bool`               | `False` | 5               |
| `request_funding_rates`       | `bool`               | `False` | 6               |
| `book_depth`                  | `PositiveInt?`       | `None`  | 2               |
| `book_interval_ms`            | `PositiveInt`        | `1000`  | 2               |
| `book_levels_to_print`        | `PositiveInt`        | `10`    | 2               |
| `manage_book`                 | `bool`               | `True`  | 2               |
| `log_data`                    | `bool`               | `True`  | All             |
| `stats_interval_secs`         | `int`                | `5`     | All             |
| `log_events`                  | `bool`               | `True`  | All             |
| `log_commands`                | `bool`               | `True`  | All             |

The Rust builder also exposes these parameters:

| Parameter          | Type       | Default  | Affects groups |
| ------------------ | ---------- | -------- | -------------- |
| `book_type`        | `BookType` | `L2_MBP` | 2              |
| `subscribe_params` | `Params?`  | `None`   | 9              |
| `request_params`   | `Params?`  | `None`   | 9              |
