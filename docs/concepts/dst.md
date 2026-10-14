# DST

<!-- Keep this title as "DST"; longer titles do not render well in the left navigation. -->

确定性模拟测试（deterministic simulation testing，DST）在受种子控制的运行时下运行
NautilusTrader。本指南界定：

- 种子控制执行的可复现性保证。
- 这些保证成立所需的条件。
- 强制该契约的源代码接缝与检查。
- 确定性执行止步的路径。

每项论断都附源码位置，用户与审计者可以对照代码核验契约。

:::note
依赖 NautilusTrader 确定性的下游测试框架，消费的是其锁定的 NautilusTrader
提交处对应的本文档版本。对本文档的修改对这些消费者而言是契约变更，
应按契约变更来评审。
:::

## DST 是什么 {#what-dst-is}

DST 控制并发系统中的不确定性来源。在下文定义的契约范围内，一个种子决定
任务调度、定时器触发与随机值。种子、二进制、配置与平台都相同的两次运行
产生完全一致的可观测行为。记录失败的种子，即可重放同一次执行。

常规异步运行时的调度决策取自进程的环境状态，包括：

- 任务唤醒顺序。
- 定时器分辨率。
- 操作系统线程调度。
- 随机化的哈希种子。

常规测试框架不控制这些来源，因此 CI 中偶然出现一次的竞态可能难以复现。
DST 用带种子的伪随机序列替代它们。不同的种子探索不同的交织，
相同的种子选出相同的交织。

[FoundationDB](https://apple.github.io/foundationdb/testing.html) 用这一模式测试生产级
分布式数据库。Rust 生态中，[madsim](https://crates.io/crates/madsim) 拦截
`tokio` 原语以提供确定性调度器。

DST 针对的是并发缺陷，例如：

- 通道唤醒顺序。
- 关停期间的排空竞态。
- 启动时序。
- 对账顺序。
- 恢复路径的正确性。

其他测试层无法穷尽这些交织。确定性调度器可以跨种子探索它们，
并重放失败的调度。

## 目标 {#goals}

| 目标                          | 要求                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 种子可复现的执行   | 范围内的运行时对相同种子与输入产生相同的可观测行为。                    |
| 范围显式                | 每一次退回真实时间、未播种随机性或其他不确定性都有文档记录。                     |
| 源码层强制         | 静态检查在依赖评审者注意力之前，就拒绝 DST 路径上的禁用模式。                |
| 最小必要拦截 | 只在契约需要的地方，让时间、任务调度与随机性经由确定性来源。 |

## 方法 {#approach}

实现分两层。第一层用 `madsim` 替换选定的 `tokio` 原语；
第二层控制这些原语之外的不确定性来源。

### 第 1 层：运行时替换 {#layer-1-runtime-swap}

在 `nautilus-common` 的 `simulation` Cargo feature 下，设置
`RUSTFLAGS="--cfg madsim"` 时，四个门面子模块选择模拟行为：

| 子模块 | 覆盖内容                                          | 常规构建  | 模拟构建                                                 | 采用程度                                          |
| --------- | ----------------------------------------------- | ------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| `time`    | 定时器、interval 与单调 `Instant`。     | `tokio`       | `madsim`                                                         | 完整。                                         |
| `task`    | 异步任务的生成与等待。               | `tokio`       | `madsim`                                                         | 完整。                                         |
| `runtime` | 运行时构建器与句柄。                     | `tokio`       | `madsim`                                                         | 完整。                                         |
| `signal`  | 进程信号，如 `ctrl_c` 与 `SIGTERM`。 | `tokio` 或 OS | `ctrl_c` 用 `madsim`，`terminate` 用永不完成的 future | 部分。见[信号处理](#signal-handling)。 |

这些再导出位于 `nautilus_common::live::dst`。DST 路径上 `time`、`task`、
`runtime` 的调用点都从该模块导入。常规构建把导入解析为 `tokio`，
`simulation` 加 `cfg(madsim)` 时解析为 `madsim`。

`sync`、`io`、`fs`、`net` 子模块以及 `select!` 宏继续使用真实的 `tokio`。
网络 crate 为明文 HTTP 与 Tungstenite WebSocket 连接提供单独的
[传输边界](#simulated-http-and-websocket-transport)，不替换依赖内部的 Tokio。

### 第 2 层：不确定性替换 {#layer-2-nondeterminism-substitution}

别名运行时之外的不确定性需要显式接缝。

#### 墙上时钟时间 {#wall-clock-time}

墙上时钟读取经由 `nautilus_core::time::duration_since_unix_epoch`。
模拟下该接缝调用 `madsim::time::TimeHandle::try_current()`，
为订单与成交时间戳保留 Unix 纪元语义。

普通的 `#[rstest]` 函数体在 madsim 运行时之外执行，此时接缝回退到
`SystemTime::now()`，与常规构建使用相同的真实系统调用。模拟下的生产路径
都在 madsim 运行时内执行，获得虚拟时间。

#### 单调时间 {#monotonic-time}

单调时间读取经由 `nautilus_common::live::dst::time::Instant`。常规构建把
该类型解析为 `tokio::time::Instant`，保持与
`#[tokio::test(start_paused = true)]` 的兼容；模拟构建解析为
`madsim::time::Instant`。

#### 网络层本地单调时间 {#network-local-monotonic-time}

网络代码的单调读取经由 `nautilus_network::dst::time`。`nautilus-network`
在依赖图中位于 `nautilus-common` 之下，因此它提供一个行为相同的本地
再导出模块。

#### 迭代顺序 {#iteration-order}

可观测的迭代顺序使用 `IndexMap`、`IndexSet` 或显式排序，不依赖
`AHashMap` 或 `AHashSet`。`AHash` 按进程随机化其 hasher。
当迭代控制事件发布、或控制从带种子 `FillModel` 抽取的顺序时，
必须保证顺序稳定。

#### Select 轮询顺序 {#select-polling-order}

DST 路径上每个生产环境的 `tokio::select!` 站点都以 `biased;` 开头。
否则分支轮询顺序将由未被拦截的 RNG 决定。

## 确定性契约 {#determinism-contract}

在下列条件下，同一平台上由 `(seed, binary hash, configuration hash)` 标识的运行
产生逐位一致的：

- 异步任务的调度顺序。
- 定时器触发（虚拟单调时间与虚拟墙上时间）。
- `madsim::rand` 的随机输出。
- `tokio::sync` 通道上的投递顺序。

### 必需条件 {#required-conditions}

契约**只在下面每一行都满足时**成立：

| 不确定性来源 | 必需条件                                                       | 绕过时的失败表现                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 构建选择          | 启用 `simulation` feature 并设置 `RUSTFLAGS="--cfg madsim"`。      | 只设其一会在无报错的情况下退回真实 `tokio`。该 cfg 同时激活 madsim 对 `clock_gettime` 与 `getrandom` 的 libc 拦截。 |
| `tokio::select!`         | DST 路径上每个生产块首行放 `biased;`。            | 未拦截的 RNG 决定轮询顺序。                                                                                                        |
| 单调时间           | 使用 `nautilus_common::live::dst::time` 或 `nautilus_network::dst::time`。 | 直接用 `std::time::Instant::now` 会读取宿主机时钟。                                                                                                 |
| 墙上时钟时间          | 使用 `nautilus_core::time::duration_since_unix_epoch`。                    | 直接读时钟绕过虚拟时间。                                                                                                                |
| 随机性               | 使用 `madsim::rand`。                                                      | `rand::thread_rng`、`rand::rng()`、`fastrand`、`getrandom` 与 `OsRng` 不被拦截。                                                           |
| 迭代顺序          | 在使用处用 `IndexMap`、`IndexSet` 或排序。                 | 随机化的哈希迭代会改变可观测顺序。                                                                                                 |
| 本地任务              | 模拟下排除 `tokio::task::LocalSet`。                       | `madsim` 没有 `LocalSet`，直接配合 `spawn_local` 使用。                                                                                              |
| 阻塞任务           | 排除或移除 `tokio::task::spawn_blocking`。                        | 阻塞调用会逃出确定性调度器。                                                                                                 |

### 适配器 DST 契约 {#adapter-dst-contract}

适配器只有在每条**声明路径**都满足下列要求时才算符合 DST。
[适配器开发者指南](./../developer_guide/adapters.md#deterministic-simulation)指明参考实现
与受维护适配器的要求，本节陈述契约本身。

| 要求          | 规则                                                                                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 构建边界       | 暴露并传播 `simulation` feature。声明的路径在 `cfg(madsim)` 下构建与运行，没有仅测试用的生产行为。                                                                                                                                |
| 静态门禁          | 每个声明路径的生产文件都被 `check-dst-conventions` 覆盖，或记录了排除理由。                                                                                                                                                               |
| 确定性输入 | 墙上时间、单调时间、定时器、随机性与生成的标识符来自 `nautilus_common::live::dst` 门面、`nautilus_core::time` 墙上时钟接缝，或注入的声明输入。认证输入来自确定性来源。                                 |
| 异步控制        | 任务、定时器与运行时控制经 DST 门面；每个生产 `select!` 带 `biased;`；连接、重连、重试、退订与关停均可确定性复现。                                                                                             |
| 线上身份        | 在每个线上与领域输出边界使用有序集合或显式排序。重试与重连保留协议标识符，并从相同声明输入复现逐字节相同的请求。不确定的结果使用共享的命令失败分类。 |
| 受控传输 | 每条声明路径的端点通过受支持的生产配置指向受控的本地对端。没有硬编码的场所主机、凭据或真实场所状态。私有路径允许固定的合成凭据。                                                |
| 新进程证明  | 相同种子、配置与对端脚本在新进程中产生完全一致的线上记录与领域输出。至少一个校准过的变异被拒绝。上游固定订阅字节与线上字段。完整比对在下游进行。                     |

适配器未声明的能力，在某个切片证明它之前留在契约之外。切片扩大已证明的
集合，门禁防止回归。

## 静态强制 {#static-enforcement}

静态强制分两层：

| 层                   | 强制内容                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Clippy 策略           | `clippy.toml` 与 `[workspace.lints.clippy]` 拒绝直接的 `getrandom::{fill,u32,u64}` 调用和 `tokio::task::LocalSet`。 |
| `check-dst-conventions` | 预提交钩子执行 Clippy 无法干净表达的、与路径和 cfg 相关的结构检查。                |

钩子位于 `.pre-commit-hooks/check_dst_conventions.sh`，在标准预提交套件与 CI 中运行。
其作用范围随规则而异：

- **规则 1 至 4 和 6**：17 个范围内的 workspace crate，以及钩子
  `ADAPTER_PATHS` 列表中经过审计的适配器文件。
- **规则 5**：其两个经过审计的文件。
- **规则 7**：madsim 构建路径上的九个 crate、那些适配器文件，以及
  `crates/network/src/websocket/client.rs`。

| 规则 | 拒绝内容                                                                                                                                        | 范围或例外                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1    | 原始的 `std::time::Instant::now()`、`SystemTime::now()`、`jiff::Timestamp::now()`、`jiff::Zoned::now()` 读取，含导入后的裸形式。 | 允许墙上时钟接缝、经审计的日志或进度计时，以及带标记的行。                               |
| 2    | 原始的 `rand::thread_rng`、`rand::rng()`、`fastrand::`、`getrandom::`、`OsRng` 与 `Uuid::new_v4()` 用法。                                       | 允许 cfg 门控与带标记的行。                                                                          |
| 3    | 生产环境 `tokio::select!` 块前三行没有 `biased;`。                                                                 | 排除测试与带标记的行。                                                                            |
| 4    | `std::thread::spawn`、`std::thread::Builder::new` 与 `tokio::task::spawn_blocking`。                                                          | 允许仅测试、非 madsim 与带标记的站点。                                                             |
| 5    | 对账管理器与撮合引擎中的 `AHashMap` 或 `AHashSet`。                                                                    | 覆盖两个经审计的文件。其余文件在审计完成前不受该静态规则约束。          |
| 6    | 直接的 `tokio::net::TcpStream::connect` 与 `tokio::net::TcpListener::bind` 调用。                                                             | 调用方必须使用 `nautilus_network::net`，它在 `turmoil` feature 下换成 `turmoil::net`。        |
| 7    | madsim 构建路径上生产代码中的原始 `tokio::{time,task,runtime,signal}` 路径。                                                     | 允许门面、进程级真实 Tokio 运行时、测试基础设施、cfg 门控站点与带标记的行。 |

受支持的 Madsim HTTP 与 WebSocket 路径使用 `nautilus_network::dst::net`：
选择模拟字节流，常规构建中再导出 `nautilus_network::net`。

钩子支持两种例外形式：

- 在具体行上加行内 `// dst-ok` 标记，通常附简短理由
  （例如不影响状态的仅日志墙上时钟计时）。
- 钩子脚本内维护一个很小的文件级允许名单，用于代码库审计中被归为
  保留不动的站点（缓存模块的日志计时、日志桥接与写入器的
  日志记录加时间戳、DeFi 模块的进度上报）。

钩子排除：

- `tests/`、`python/`、`ffi/` 目录下的文件。
- 名为 `tests.rs`、`*_test.rs`、`*_tests.rs` 的文件。
- 行内 `#[cfg(test)]` 模块中的行。

这些路径不属于生产 DST 契约。

### 范围内的 crate {#in-scope-crates}

`nautilus-live` 的传递闭包包含 16 个范围内的 crate：

- `analysis`
- `common`
- `core`
- `cryptography`
- `data`
- `execution`
- `indicators`
- `live`
- `model`
- `network`
- `persistence`
- `portfolio`
- `risk`
- `serialization`
- `system`
- `trading`

钩子还覆盖 `backtest`，共 17 个 crate。

适配器 crate 与基础设施 crate（Redis、Postgres）在范围之外，除非适配器的
集成指南中记录了经审计的切片。经审计的切片指明静态门禁覆盖的 DST 路径
文件、其余部分的排除理由，以及适配器 `dst` 测试证明的运行时切片。

:::warning
仅静态覆盖不能确立运行时资格：被覆盖的文件也可能服务于已证明运行时
切片之外的路径。
:::

## 模拟 HTTP 与 WebSocket 传输 {#simulated-http-and-websocket-transport}

在 `simulation` 与 `cfg(madsim)` 下，`nautilus-network` 在 Madsim 字节流上
执行明文 HTTP/1.1 请求与 Tungstenite WebSocket 连接。

- **HTTP**：生产与模拟路径共享请求默认值、URL 与查询编码、响应校验。
  共享的响应校验包括缓冲体上限与覆盖 body 读取的截止时间。
  `crates/network/src/http/simulation.rs` 中的模拟分支用 Hyper 完成
  HTTP/1.1 交换，并持有自己的 Madsim 连接任务。
- **WebSocket**：流量使用 Tungstenite 编解码器。`crates/network/src/dst.rs`
  把其拥有的任务与传输流路由到 Madsim。

常规构建使用池化的 Hyper HTTP 连接与 Tokio 任务。

配置受控的 `http://` 与 `ws://` 端点，并选择
`TransportBackend::Tungstenite`。模拟在打开连接前拒绝 HTTPS/WSS、显式代理
与 Sockudo。Sockudo 的内部定时器需要 Tokio 运行时。环境中的 HTTP 代理设置
不影响模拟交换。

重定向行为取决于 `HttpRedirectPolicy`：

- `Follow`（默认）：带 `Location` 的重定向响应返回错误，而不是跟随。
- `Reject`：把重定向响应原样返回调用方。

该模型覆盖 HTTP 请求字节、WebSocket 消息载荷与领域事件，
不承诺可复现的 WebSocket 握手 key 或帧掩码、TLS 记录、操作系统 TCP 调度、
部分写入、socket 选项或 TCP 半关闭。

`crates/network/src/dst/stream.rs` 中，流关闭（shutdown）会刷出字节，
丢弃流则断开连接。同时组合 `simulation`、`cfg(madsim)` 与 `turmoil`
是编译错误，两个模拟器要分别在各自的构建中运行。

模拟会按名称对请求头排序，以产生可复现的 HTTP 字节。这一规范化顺序
不承诺与真实请求头顺序逐字节相等。每个 HTTP 请求都新建连接，
不建模连接池与 keep-alive 复用。

网络测试覆盖传输行为，但不为某个适配器、产品或通道确立端到端的一致性。

## 网络种子冲刷 {#network-seed-soaks}

[Turmoil](https://crates.io/crates/turmoil) 在带种子的调度器下模拟网络。
`nautilus-network` 的传输测试用它触及 madsim 运行时替换之外的链路与
重连顺序。

### 固定种子的夜间测试 {#fixed-seed-nightly-tests}

夜间套件为以下场景运行可复现的用例：

- 初次连接。
- 重连。
- 网络分区。
- 重连期间关闭。
- 退避期间关闭。
- 反复丢弃服务端并断言精确消息顺序。

### 重连种子冲刷 {#reconnect-seed-soak}

一个被忽略的重连测试扫描 Turmoil 种子，直到手动停止或达到配置上限。
每个种子先运行 Tungstenite WebSocket 后端；启用 `transport-sockudo`
feature 时再运行 Sockudo，让两个后端拥有相同的调度搜索路径。

| 变量                                  | 默认值   | 作用                                              |
| ----------------------------------------- | --------- | --------------------------------------------------- |
| `NAUTILUS_TURMOIL_SOAK_START`             | `0`       | 选择首个种子，使扫描可以续跑。 |
| `NAUTILUS_TURMOIL_SOAK_COUNT`             | 无上限 | 达到指定种子数后停止。          |
| `NAUTILUS_TURMOIL_SOAK_PROGRESS_INTERVAL` | `100`     | 每个后端经过这么多种子记录一次进度。    |

### 运行冲刷 {#run-the-soak}

持续冲刷：

```bash
scripts/soak-network-turmoil.sh
```

有界冲刷：

```bash
env NAUTILUS_TURMOIL_SOAK_COUNT=100 scripts/soak-network-turmoil.sh
```

每个种子启用随机节点顺序与 1 ms 到 25 ms 的链路延迟。场景反复丢弃
服务端，让客户端在重连状态间循环，并断言精确的应用消息顺序。

冲刷不启用 Turmoil 的 `fail_rate`。对 TCP 而言，没有重传模型的丢包会在
保序测试中夸大客户端的投递契约。

### 平台覆盖 {#platform-coverage}

Turmoil 测试使用模拟网络，未限定 Linux，因此种子扫描也会跑在 macOS 上。
若干使用真实本地回环 socket 与 WebSocket 的单元测试为 CI 稳定性限定
`target_os = "linux"`，macOS 上的运行因此不覆盖那部分宿主 TCP 测试。
只有在 Linux CI 或 Linux 工作站上跑过，才可视为完整网络测试集已覆盖。

## 实现说明 {#implementation-notes}

以下小节把每个确定性接缝对应到其源码、用途与例外。

### 迭代顺序接缝 {#iteration-order-seams}

迭代在 DST 路径上可观测的生产位置，使用有序集合或显式排序。

#### 撮合引擎 {#matching-engine}

`crates/execution/src/matching_engine/mod.rs` 使用十一个有序集合：

- `execution_bar_types`
- `execution_bar_deltas`
- `account_ids`
- `cached_filled_qty`
- `post_match_order_ids`
- `bid_consumption`
- `ask_consumption`
- `queue_pending`
- `queue_ahead_orders`
- `queue_ahead_total`
- `queue_excess`

`queue_pending`、`queue_ahead_orders`、`queue_ahead_total` 的删除使用
`.shift_remove()`，删除条目不会重排剩余部分。

#### 对账管理器 {#reconciliation-manager}

规则 5 覆盖 `crates/live/src/execution/manager.rs`。
`ReconciliationResult` 的 `orders` 与 `fills` 映射在
`crates/execution/src/reconciliation/types.rs` 中使用 `IndexMap`。

#### 账户余额 {#account-balances}

账户 trait 从以下方法返回 `IndexMap`：

- `balances`
- `balances_total`
- `balances_free`
- `balances_locked`
- `starting_balances`

`BaseAccount` 与 `MarginAccount` 上的余额与保证金存储也使用 `IndexMap`。
`commissions` 与 `leverages` 字段保持 `AHashMap`。

#### 持仓手续费 {#position-commissions}

`crates/model/src/position.rs` 中的 `Position::commissions` 使用 `IndexMap`。
持仓快照在 `crates/model/src/events/position/snapshot.rs` 中经 `.values()`
消费该映射，使其顺序可观测。

#### 组合聚合 {#portfolio-aggregation}

`crates/portfolio/src/portfolio.rs` 用 `IndexMap` 存储 `unrealized_pnls`、
`realized_pnls` 与 `net_positions`。`accumulate_mark_values` 构建
`IndexMap<Currency, Decimal>`。

#### 数据引擎 {#data-engine}

`crates/data/src/engine/` 对 `book_snapshot_counts`、`bar_aggregators` 与
`BookSnapshotInfos` 使用有序存储。迭代式删除使用 `.shift_remove()`。

#### 执行引擎 {#execution-engine}

`ExecutionEngine.clients` 使用 `IndexMap`。`get_clients_for_orders()` 中的
`client_ids` 与 `venues` 累加器使用 `IndexSet`。

#### 回测引擎与模拟场所 {#backtest-engine-and-exchange}

`BacktestEngine.venues` 与 `SimulatedExchange.matching_engines` 保留场所与工具的
迭代顺序，用于：

- 结算。
- 到期。
- 清算。
- 带种子的 `FillModel` 抽取。

源码位置为 `crates/backtest/src/engine.rs` 与 `crates/backtest/src/exchange.rs`。

#### 交易算法 {#trading-algorithm}

`crates/trading/src/algorithm/core.rs` 中的 `strategy_event_handlers` 使用
`IndexMap`，驱动有序的 `msgbus::unsubscribe_*` 扇出。

#### 分析器 {#analyzer}

`crates/analysis/src/analyzer.rs` 中的 `account_balances` 与
`account_balances_starting` 使用 `IndexMap`。

#### 缓存 API {#cache-api}

`crates/common/src/cache/mod.rs` 中的 `get_orders_for_ids` 与
`get_positions_for_ids` 按 `client_order_id` 与 `position_id` 对返回的向量排序。
底层存储保留 `AHashSet`，因为它具有集合语义。

#### 工具存储 {#instrument-store}

`crates/common/src/providers.rs` 中的 `InstrumentStore.instruments` 使用带
`ahash` hasher 的 `IndexMap`。适配器从 `get_all()` 或 `list_all()` 为每个条目
发布一条 `DataEvent::Instrument` 时，该顺序可观测。

#### 订单模拟器 {#order-emulator}

`crates/execution/src/order_emulator/emulator.rs` 中的 `on_reset` 在有序的
`msgbus::unsubscribe_*` 扇出之前，对三个排空集合排序：

- `subscribed_quotes`
- `subscribed_trades`
- `subscribed_strategies`

报价与成交路径还会推进带种子的 `UUID4::new` 抽取序列。存储保持 `AHashSet`。

#### WebSocket 订阅 {#websocket-subscriptions}

`crates/network/src/websocket/subscription.rs` 中的 `topics_from_map` 对返回的
向量排序，在 `all_topics()` 之后保留重连重放顺序；存储仍是值为 `AHashSet`
的 `DashMap`。

#### 无序集合的界限 {#unordered-collection-limits}

`nautilus-live` 闭包中的 `AHashMap` / `AHashSet` 位置只用于查找、位于并发
共享所有权包装（`Arc<DashMap>`、`AtomicMap`）之后，或汇入可交换的聚合。
`backtest` 中还有规则 5 两文件强制范围之外的哈希集合，包括运行前校验与
结果映射。在相应路径完成审计前，其迭代顺序视为不受静态保证覆盖。

### 时间接缝 {#time-seams}

剩余的 `Instant::now` 与 `SystemTime::now` 位置属于测试、文件白名单位置或
带标记的例外：

| 位置                               | 用途                                                     | 处理方式                                                  |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------- |
| `crates/common/src/testing.rs`       | `wait_until` 与 `wait_until_async` 的计时。              | 行内 `// dst-ok`：测试控制按设计使用真实时间。 |
| `crates/execution/src/engine/mod.rs` | `load_cache` 的初始化日志计时。               | 行内 `// dst-ok`：计时不影响 DST 状态。      |
| `crates/common/src/cache/mod.rs`     | `check_integrity` 与 `audit_own_order_books` 的计时。 | 文件白名单。                                            |
| `crates/model/src/defi/reporting.rs` | 进度日志。                                        | 文件白名单。                                            |
| `crates/core/src/time.rs`            | 墙上时钟接缝定义。                              | 显式接缝例外。                                   |

`jiff::Timestamp::now` 与 `jiff::Zoned::now` 在范围内 crate 中被钩子禁用。
其余时间戳调用点是日志桥接与写入器，在
[日志运行在真实 OS 线程上](#logging-runs-on-real-os-threads)一节中被划出范围。
`crates/core/src/datetime.rs::is_within_last_24_hours` 经
`nautilus_core::time::nanos_since_unix_epoch()` 取时，并直接用 `u64` 纳秒比较。

### 随机性接缝 {#randomness-seams}

DST 路径上的生产随机性使用以下接缝。

#### UUID 生成 {#uuid-generation}

`crates/core/src/uuid.rs::UUID4::new()` 在模拟的 madsim 运行时内使用
`madsim::rand::thread_rng()`。常规构建，以及 madsim 运行时之外的普通
`#[rstest]` 函数体，使用 `rand::rng()`。

生产模拟路径在运行时内执行并消费带种子的字节。`nautilus-common` 与
`nautilus-risk` 中的订单与事件工厂经由该接缝。

#### 成交模型随机性 {#fill-model-randomness}

`crates/execution/src/models/fill.rs::default_std_rng()` 遵循同样的运行时分流。
未提供种子时 `ProbabilisticFillState::new()` 调用它。调用方提供种子时，
`StdRng::seed_from_u64` 本身就是确定性的，无需接缝。

#### 随机撮合引擎 ID {#random-matching-engine-ids}

`crates/execution/src/matching_engine/ids_generator.rs` 中的 `use_random_ids`
路径为持仓 ID 与场所订单 ID 调用 `nautilus_core::UUID4::new()`。
默认 ID 方案 `{venue}-{raw_id}-{count}` 不使用随机字节，本身确定性。

#### 重连抖动 {#reconnect-jitter}

`crates/network/src/backoff.rs` 在模拟运行时内采样
`madsim::rand::thread_rng()`。常规构建以及 Madsim 运行时之外的调用使用
`rand::rng()`。以相同种子重启运行时，会重启模拟的抖动序列。

### Tokio 子模块划分 {#tokio-submodule-split}

common 门面把 `time`、`task`、`runtime`、`signal` 路由到 `madsim`。
`tokio` 的 `sync`、`io`、`fs`、`net` 子模块以及 `select!` 的直接使用在模拟下
仍走真实 `tokio`。网络层本地的 `dst::net` 边界单独为受支持的 HTTP 与
WebSocket 路径选择 Madsim 字节流。

全局替换 Tokio 网络会连带影响这些依赖：

- `tokio-tungstenite`
- `tokio-rustls`
- `hyper-util`
- `hyper-rustls`

网络层本地边界通过向 Hyper 与 Tungstenite 提供流，避免全局替换。
TLS 留在其模拟范围之外。

范围内的直接使用点：

| 位置                              | 真实 Tokio 面                         | 边界                                                                 |
| ------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| `crates/network/src/net.rs`           | `tokio::net::{TcpListener, TcpStream}`     | 在 `crate::net` 接缝后再导出常规传输。            |
| `crates/network/src/socket/client.rs` | `tokio::io::{AsyncReadExt, AsyncWriteExt}` | 在选定的传输上执行 I/O。                                  |
| `crates/network/src/tls.rs`           | `tokio::io::{AsyncRead, AsyncWrite}`       | 定义 TLS I/O 约束。                                                  |
| `crates/network/src/socket/types.rs`  | `tokio::io::{ReadHalf, WriteHalf}`         | 拆分 `MaybeTlsStream<TcpStream>`。`TcpStream` 来自 `crate::net`。 |

这些路径即使在模拟下也使用真实 socket。`tokio::sync` 通道实现同样保持真实，
但 madsim 会调度其发送端与接收端任务，因此通道投递顺序仍属于确定性调度契约。

### 原生线程逃逸规则 {#raw-thread-escape-rules}

钩子的规则 4 禁止在三种逃逸情形之外原生创建线程：

- `#[cfg(test)]` 测试模块。
- `#[cfg(not(madsim))]` 或 `#[cfg(not(all(feature = "simulation", madsim)))]`
  的生产位置（例如日志写入器线程）。
- 行内 `// dst-ok` 标记。

`tokio::task::LocalSet` 与 `tokio::task::spawn_blocking` 在 `madsim` 下不受支持。
代码库审计在范围内 crate 中未发现任何生产使用点。新增使用点必须带 cfg 门控或
`// dst-ok` 标记。

### 模拟下的日志测试 {#logging-tests-under-simulation}

日志写入器线程在模拟下被 cfg 门控排除。`cfg(madsim)` 时日志事件被丢弃。
初始化文件日志写入器的测试要么挂起，要么对空日志文件断言失败。
因此受影响的子模块在模块边界被门控排除：

- `crates/common/src/logging/logger.rs::tests::serial_tests`。
- `crates/common/src/logging/macros.rs::tests`。

`logger.rs::tests::sim_tests::test_init_under_madsim_skips_writer_thread_and_forces_bypass`
在模拟下运行，锁定被门控的行为。

## 范围边界 {#scope-boundaries}

契约受以下边界限制。每个小节指出可能在两次运行间变化、或留在受审计 DST
路径之外的行为。

### Python 与 FFI 不在 DST 范围内 {#python-and-ffi-are-not-in-dst-scope}

DST 在原生 Rust 测试框架下运行，不启动 Python 解释器。契约不包括：

- `crates/*/src/python/` 下的 PyO3 绑定。
- `crates/core/src/ffi/` 与 `crates/model/src/ffi/` 下的 Rust FFI 模块。
- `python/nautilus_trader/` 下的 Python 包。

仅经这些绑定可达的代码在范围之外。原生 DST 框架可达的任意 Rust 路径都必须
满足契约，即便同一类型也通过某个绑定导出。

`check-dst-conventions` 钩子按此策略跳过范围内 crate 的 `/python/` 与 `/ffi/`
路径。那些路径背后的时钟、RNG 与线程调用不适用本契约。

DST 主要覆盖 Rust 引擎中的订单生命周期、对账、撮合、风控与执行状态机。
只有用 Rust 编写、或用 Rust 原生测试框架驱动的用户策略才可重放。

Python 策略可以通过以下方式改变其命令流：

- 调用 `time.time()`。
- 发出任意网络请求。
- 依赖操作系统线程调度。

Rust 内核按其确定性契约处理该命令流，但 DST 不保证从 Python 入口点的
端到端重放。

### 限定平台 {#platform-scoped}

`madsim` 对 `clock_gettime` 与 `getrandom` 的 libc 覆盖是平台特定的。
契约不主张跨平台的逐位可复现。在 Linux x86_64 上复现某失败的种子，
在 macOS aarch64 上可能无法复现。

### 未替换的依赖静默逃逸 {#non-aliased-dependencies-escape-silently}

依赖通过以下途径直达操作系统时，会无声地逃出模拟器：

- 直接 `libc` 调用。
- `std::net` 旁路。
- 未路由的随机性，如 `fastrand` 或 `OsRng`。

范围内的 crate 已完成审计。适配器与基础设施 crate 进入 DST 路径前需要
单独审计。

### 传输范围限制 {#transport-scope-limits}

以下依赖内部使用真实 `tokio`：

- `tokio-tungstenite`
- `tokio-rustls`
- `hyper-util`
- `hyper-rustls`
- `redis`
- `sqlx`

[模拟 HTTP 与 WebSocket 传输](#simulated-http-and-websocket-transport)为受支持的
明文路径提供 Madsim 流。原始 socket 客户端、TLS、Redis 与 SQL 留在该边界之外。
Turmoil 提供[网络种子冲刷](#network-seed-soaks)所述的另一套网络模拟。

以下测试模块驱动真实的本地回环 socket，在
`all(feature = "simulation", madsim)` 下被 cfg 门控排除：

- `crates/network/src/http/client.rs::tests`
- `crates/network/src/http/tests.rs`
- `crates/network/src/socket/client.rs::tests`
- `crates/network/src/socket/client.rs::rust_tests`
- `crates/network/src/websocket/client.rs::tests`
- `crates/network/src/websocket/client.rs::rust_tests`
- `crates/network/tests/integration/websocket_proxy.rs`

它们的生产路径经 `dst::time::*` 触及 madsim 时间原语，而这些原语在
`#[tokio::test]` 运行时中调用会 panic。

`crates/network/src/retry.rs` 中的重试模块在两种运行时下都运行。其测试属性在
`#[tokio::test(start_paused = true)]` 与 `#[madsim::test]` 之间切换。
时间读取与 sleep 使用 `crate::dst::time`；显式的虚拟时间推进使用 cfg 门控的
`advance_clock` 函数。同一份测试体因此覆盖常规与模拟两种构建。

### 信号处理 {#signal-handling}

`nautilus_common::live::dst::signal` 暴露经路由的 `ctrl_c` 与 `terminate`
再导出，`crates/live/src/node/mod.rs` 的运行循环使用它们。
`cfg(madsim)` 下，测试可以用 `madsim::runtime::Handle::send_ctrl_c`
注入节点关停。适配器二进制的入口点仍直接调用 `tokio::signal::ctrl_c`，
留在范围之外。

### 日志运行在真实 OS 线程上 {#logging-runs-on-real-os-threads}

日志子系统通过 `std::thread::Builder` 创建写入器线程，并使用
`std::sync::mpsc`。模拟下该线程不会创建，日志事件被丢弃。
日志输出在确定性契约之外：写入器只写，从不读取或修改模拟状态。

### 适配器 {#adapters}

端到端的适配器行为留在上游模拟测试范围之外。视适配器而定，未审计路径中可能包含：

- 直接的 `jiff::Timestamp::now` 或 `jiff::Zoned::now` 调用。
- 直接的 `SystemTime::now` 调用。
- 未路由的 RNG 调用。
- 原始传输客户端。

DST 契约要覆盖适配器的行为，必须先审计这些位置。

## 与其他测试层的关系 {#relationship-to-other-testing-layers}

DST 与现有测试互补，不取代任何一层。

| 测试层                   | 覆盖内容                                               | 与 DST 的关系                                |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| 单元测试              | 纯逻辑、计算、解析器、转换器。     | 不变。                                      |
| 集成测试       | 组件交互、I/O 边界。               | 不变。DST 与其并行运行，而非取而代之。 |
| 基于属性的测试    | 输入域上的不变式（解析器、往返）。 | 不变。                                      |
| 验收测试        | 端到端回测与实时场景。              | 不变。                                      |
| 确定性模拟（DST） | 异步时序、调度、恢复正确性。      | 增加可种子重放的探索。               |

DST 覆盖异步并发与状态机正确性。典型的失败包括：

- 某种任务唤醒顺序下丢失一条关停消息。
- 迭代顺序改变时丢失一个对账事件。

其他测试层继续负责各自原有的范围。

## 状态 {#status}

### 运行时替换 {#runtime-swap-status}

第 1 层已实现。`nautilus_common::live::dst` 暴露 `time`、`task`、`runtime`、
`signal` 的路由再导出。`time`、`task`、`runtime` 的生产调用点已使用该接缝。
信号的采用仍是部分的，见[信号处理](#signal-handling)。

### 不确定性替换 {#nondeterminism-substitution-status}

第 2 层已在 17 个范围内 crate 中实现。接缝覆盖墙上时间、单调时间、随机性与
可观测迭代顺序。[实现说明](#implementation-notes)列出已审计的路径与剩余例外。

### 静态强制状态 {#static-enforcement-status}

`check-dst-conventions` 在预提交与 CI 中运行，覆盖承载性的结构条件，
并通过 `// dst-ok` 允许经评审的逐行例外。

### 运行时验证限度 {#runtime-verification-limit}

验证覆盖接缝测试与静态检查。本仓库不跨新进程比较完整的适配器运行。

### 模拟冒烟门禁 {#simulation-smoke-gate}

夜间工作流与本地 pre-flight 使用同一组 DST 目标：

| 入口点                           | 相关顺序                                            | 目的                                                  |
| ------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| `.github/workflows/nightly-tests.yml` | `check-code-sim` > `cargo-test-sim`                       | 运行夜间及手动派发的 DST 冒烟门禁。 |
| `make pre-flight`                     | `check-code-sim` > `cargo-test-sim` > `cargo-test-extras` | 在 Rust 测试套件之前尽早失败于 DST lint。     |

`check-code-sim` 在 `nautilus-common`、`nautilus-core`、`nautilus-event-store`、
`nautilus-network`、`nautilus-execution`、`nautilus-live` 上，以
`--features simulation` 加 `cfg(madsim)` 运行锁定的稳定版 Clippy。
另有单独的 `--no-default-features` 分支，在标准精度核心分支中不带默认
feature 地编译并 lint 每个受审计的适配器。

`cargo-test-sim` 使用三次 feature 自洽的 nextest 调用：

| 精度 | 包                                                                                                              | Features                    | 选择                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| 标准  | `nautilus-common`、`nautilus-core`、`nautilus-event-store`、`nautilus-network`、`nautilus-execution`、`nautilus-live` | `simulation`                | 全部兼容的 common、event-store、network、execution 测试，外加聚焦的 live 与 core 测试。 |
| 标准  | 每个受审计的适配器                                                                                                  | `simulation`                | 仅集成 `dst` 测试，不带适配器默认 feature。                                     |
| 高      | `nautilus-common`、`nautilus-execution`                                                                               | `simulation,high-precision` | 两个包的全部测试。                                                                         |

Nextest 会编译选定的库与测试目标，因此门禁不另跑一次 Cargo build。
这几次调用在各自包集上各解析一次 feature 集。合起来在两种定点数宽度下
都演练经接缝路由的 `QuantityRaw`（`u64` / `u128`）与 `PriceRaw`（`i64` / `i128`）路径。

#### Common 测试 {#common-tests}

标准精度运行执行全部模拟兼容的 `nautilus-common` 测试。其 feature 图传播
`nautilus-core/simulation`，在整个套件中选择 `wall_clock_now` 的 cfg 分支。

普通 `#[rstest]` 函数体在 madsim 运行时之外执行，使用接缝的
`SystemTime::now()` 回退。这与 madsim 的 libc shim 在运行时之外的路径相同。

`LiveClock` 测试模块被 cfg 门控排除：其普通 `#[rstest]` 用例在没有 madsim
运行时的情况下启动 `LiveTimer` 任务，且多数在等待墙上时钟推进。

`live::dst::tests::test_dst_wall_clock_advances_with_virtual_time` 在
`#[madsim::test]` 下运行，断言 `nanos_since_unix_epoch` 随
`madsim::time::sleep` 推进，锁定运行时内的虚拟墙上时钟行为。

#### Event store 测试 {#event-store-tests}

标准精度运行执行全部模拟兼容的 `nautilus-event-store` 测试，在
`cfg(madsim)` 下演练同步的事件与标记写入器，包括确定性的序列排序。
依赖阻塞 OS 线程的测试保留原生覆盖并被门控排除，因为那些线程运行在
madsim 调度控制之外。

event-store 冒烟分支在不把静态约定钩子扩展到 event-store 生产代码的前提下，
编译并测试其现有的模拟实现。

#### Live 启动对账 {#live-startup-reconciliation}

聚焦的 `nautilus-live` 回归在 madsim 下运行，验证待处理的 mass-status 请求
达到其配置的超时并报告预期错误，同时验证节点清理。
完整的超时与清理流程从不进入真实的 Tokio 定时器。

#### 网络测试 {#network-tests}

该运行执行除源头被 cfg 门控排除的传输绑定模块之外的全部 `nautilus-network`
测试。覆盖包括 sleep、超时与限流器的虚拟时间接缝测试，以及演练退避时序的
重试套件。`crates/network/tests/simulation.rs` 增加 WebSocket 重连、
不支持端点与 Sockudo 拒绝、抖动重置检查。
`crates/network/src/http/simulation.rs` 中的单元测试覆盖请求字节、响应上限、
body 截止时间、取消、重定向策略与 HTTPS/代理拒绝。

`#[madsim::test]` 默认使用变化的种子，并在失败时报告它。设置
`MADSIM_TEST_SEED` 可重放某个调度。`.github/workflows/nightly-tests.yml` 中的
`dst smoke (cfg madsim)` 任务从 `GITHUB_RUN_NUMBER * MADSIM_TEST_NUM` 起选取
五个连续种子。抖动运行时重置测试固定自己的种子，与跨种子的网络检查互补。

#### Execution 测试 {#execution-tests}

该运行执行全部 `nautilus-execution` 测试。这些普通 `#[rstest]` 用例在不进入
madsim 运行时的情况下，演练撮合引擎、成交模型与执行引擎中的 cfg 门控分支，
因此 `default_std_rng()` 在这些测试中走宿主 RNG 回退。

#### Core 接缝测试 {#core-seam-tests}

聚焦的 `nautilus-core` 选择把 `wall_clock_now` 对虚拟时间做锁定验证。

#### 适配器测试 {#adapter-tests}

每个受审计的适配器在不带该 crate 默认 feature 的 `simulation` 下运行其集成
`dst` 测试。那些 `#[madsim::test]` 用例锁定适配器集成指南所记录的切片：
订阅字节、重连行为、认证帧，以及逐操作的线上字段。

#### 门禁总体覆盖 {#overall-gate-coverage}

`nautilus-common`、`nautilus-core`、`nautilus-network`、`nautilus-live` 以及受审计
适配器中的 `#[madsim::test]` 用例提供确定性调度器覆盖。完整门禁能捕捉
cfg 门控接缝的漂移，但不验证端到端的适配器确定性。

## 延伸阅读 {#further-reading}

- `.pre-commit-hooks/check_dst_conventions.sh` 完整定义了七条强制规则，
  并说明 `// dst-ok` 标记的约定。
- [FoundationDB 测试哲学](https://apple.github.io/foundationdb/testing.html)。
- [TigerBeetle 模拟测试博客](https://tigerbeetle.com/blog/)。
- [madsim 仓库](https://github.com/madsim-rs/madsim)，确定性运行时。
- [Turmoil 仓库](https://github.com/tokio-rs/turmoil)，确定性网络模拟器。
