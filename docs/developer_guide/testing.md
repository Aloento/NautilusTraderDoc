# 测试

自动化测试是交易平台可执行的规格说明。它们记录预期行为、支撑有把握的重构，
并在上线前抓住回归。测试同时也是复杂流程的示例，并通过快速的 CI 反馈让问题
尽早暴露。

测试套件覆盖以下类别：

- 单元测试
- 集成测试
- 验收测试
- 性能测试
- 基于属性的测试
- Fuzzing
- 内存泄漏测试

## 测试策略 {#testing-policy}

测试与运行时契约是同一套设计系统。[契约式设计](./rust.md#design-by-contract)阶梯
尽可能把不变式推进类型系统。下面的测试阶梯通过更大的输入空间与更丰富的执行模型
逐级处理剩余的未知。每一层都覆盖到下一层触及不到的输入或执行状态。

并非每个模块都需要所有技术。在添加测试或 `debug_assert!` 之前，用本节决定
哪些层适用。

### 机制阶梯 {#mechanism-ladder}

运行时契约见 [Rust 指南](./rust.md#design-by-contract)。优先顺序是：

1. 类型系统。
1. API 边界处用 `nautilus_core::correctness` 的 `check_*`。
1. 内部不变式用 `debug_assert!`。
1. 关乎健全性或必须始终生效的检查用 `assert!`。

测试层遵循平行的递进。从能证明关键问题的最低层开始，只有当该层不再能抓住回归，
或输入空间超出手工挑选的案例时，才往上爬。

| 层                    | 触发条件                                                               |
| ------------------------ | ------------------------------------------------------------------------------- |
| 单元测试                | 单个函数或转换有一小套可枚举的用例。           |
| 参数化测试        | 同一形态在离散输入上重复（订单方向、状态、工具）。 |
| 基于属性的测试      | 某不变式必须在一大类无法逐一枚举的输入上成立。   |
| 集成测试         | 多个模块通过真实（非 mock）的引擎或运行时交互。        |
| Fuzz 测试                | 不可信或对抗性字节穿过解析器、解码器或线上格式处理器。 |
| 规格验收测试     | 行为依赖实盘场所契约（见 `spec_exec_testing.md`）。         |
| 确定性模拟 | 正确性依赖任务调度、超时或墙钟时序。       |
| 形式化验证      | 纯函数有清晰不变式，且输入空间有界、值得证明。   |

形式化验证这一级是愿景性质的：workspace 中尚未落地任何 Kani 或 Prusti harness。
该行记录的是将来采用验证器时的升级条件，不是当前义务。

### 投射规则 {#projection-rule}

模块形态决定哪些层有回报，有些模块不需要完整的阶梯。规则要逐模块应用，
而不是逐 crate 应用。适配器 crate 同时包含纯解析器与受 I/O 束缚的客户端循环，
每一行适用于其中不同的部分。

| 模块形态                        | 适用的层                             | 示例                                |
| ----------------------------------- | --------------------------------------------- | -------------------------------------- |
| 纯函数，不变式清晰     | 单元、参数化、属性、fuzz            | 对账内核、组合数学 |
| 纯函数，未声明不变式 | 单元、参数化、属性、fuzz            | 编解码器、适配器解析器、格式化器    |
| 有状态，同步               | 单元、参数化、覆盖转换的属性测试 | 缓存、订单簿                      |
| 有状态，异步                     | 单元、集成、确定性模拟   | 实时引擎、执行管理器         |
| 受 I/O 束缚，场所契约           | 集成、规格验收、边界 fuzz   | 适配器客户端循环                   |

### 不该添加覆盖的情形 {#when-not-to-add-coverage}

- 只在测试能到达的地方加 `debug_assert!`。release 构建会剔除该检查，
  没被触及的断言产生不了任何信号。针对性的单元测试算一种 harness，
  proptest 或 fuzz harness 会放大信号。
- 不变式横跨一整类输入时，优先用 proptest 而不是手写的边界用例测试。
  针对已知场所怪癖与收缩后反例的回归复现，定向单元测试仍然有效。
- 不要把实时规格验收卡复制一份做成集成测试，链接过去即可。
- 不要用只断言语言或框架保证的测试凑覆盖率
  （`Some(..)` 之后断言 `Option::is_some`、`push` 之后断言 `Vec::len`）。

### DST 就绪性 {#dst-readiness}

确定性模拟测试（DST）要求运行时没有环境性的非确定性。把模块提升到 DST 下运行
之前，核对以下各项：

- 时间、任务、运行时与信号原语经由 `nautilus_common::live::dst` 路由，
  而不是直接用 `tokio`。读取墙钟走 `nautilus_core::time` 的接缝，
  而不是在调用点用 `SystemTime::now()`。
- 迭代顺序影响状态的映射使用 `IndexMap` 或 `IndexSet`，不用默认哈希集合。
- 控制面路径上的每个 `tokio::select!` 都设置 `biased`，固定轮询顺序。
- 没有 `Instant::now()`、`SystemTime::now()`、`tokio::signal::ctrl_c`、
  `std::thread::spawn` 或 `tokio::task::spawn_blocking` 调用逃出接缝。
  阻塞线程与 OS 线程原语破坏 madsim 确定性的方式与环境性读时钟相同。
- 影响重放的标识（`trade_id`、`venue_order_id`）是其输入的纯函数，
  见 `crates/execution/src/reconciliation/ids.rs`。其他对账路径上临时的
  事件 UUID 不需要确定。

`crates/common/src/live/dst.rs` 中的 `surface` 探针只固定再导出的形状，
不检查调用方是否真的使用接缝。执行靠评审。每当新的异步模块进入 workspace，
或既有模块新增控制面调度时，运行一次审计。

## 基于属性的测试 {#property-based-testing}

属性测试验证逻辑对*所有*合法输入都成立，而不只是手工挑选的例子。
Rust 中用 [`proptest`](https://altsysrq.github.io/proptest-book/intro.html) 强制不变式。

- **适用场景**：核心领域类型（`Price`、`Quantity`、`UnixNanos`）、核算引擎、撮合引擎与状态机。
- **不变式示例**：
  - 序列化往返：`parse(to_string(value)) == value`
  - 互逆运算：`(A + B) - B == A`
  - 传递性：`If A < B and B < C, then A < C`

## Fuzzing {#fuzzing}

Fuzzing 向系统注入非结构化或恶意数据，验证其失败时表现得当。

- **适用场景**：网络边界、交易所数据解析器（JSON、FIX、WebSocket 数据源）与复杂状态机。
- **目标**：遇到畸形数据时系统返回 `Result::Err`，绝不 panic、挂起或泄漏内存。

适配器 fuzz 二进制在各适配器包的 `fuzz` feature 后注册。从仓库根目录运行
某个适配器的全部已注册目标：

```bash
scripts/fuzz-adapter.sh derive
```

workspace 固定了 `libfuzzer-sys`，`nautilus-live` 持有共享的 libFuzzer 集成。
只有依赖不得进入已发布适配器图的 fuzz 目标，才使用单独的 `publish = false`
包。Lighter 固定到 git 的 Pornin 差分 oracle 就是这样一个依赖。

构建或修改核心类型时，编写属性测试覆盖数学边界。

性能测试有助于演进性能关键组件。

用 [pytest](https://docs.pytest.org)（项目主要的测试运行器）运行测试。
使用参数化测试与 fixture（如 `@pytest.mark.parametrize`）避免重复代码、提升清晰度。

## 运行测试 {#running-tests}

CI 通过 `make test-scripts` 运行 `scripts/ci/check_test_network.py`，标记带非本地
字面地址的直接网络调用、显式的 live 测试开关与 fork-RPC 选项。它检查测试目录，
以及 Rust 文件中从具名测试模块起的内容。回环地址与保留的夹具域名被允许。

**检查限度**：这一启发式不解析变量指向的目标、不跟随对其他代码的调用，
也不强制执行网络隔离。

### Python 测试 {#python-tests}

Python 测试套件位于 `python/tests/`，测试 Rust 支撑的 PyO3 包。它需要已构建的
扩展模块，并使用 `python/` 下的 Python 项目。从仓库根目录运行：

```bash
make pytest
```

Makefile 目标把某些测试模块隔离到独立的 pytest 进程，避免全局 Rust 状态冲突。
用 `make pytest`，不要直接调用 pytest。

`make pytest` 用 pytest-xdist 并行运行测试，每个 CPU 一个 worker，上限 32。
设置 `PYTEST_XDIST_AUTO_NUM_WORKERS` 可改变 worker 数，例如
`make pytest PYTEST_XDIST_AUTO_NUM_WORKERS=8`。

本地 `make pytest` 用的是 `make build-debug` 产出的 debug 扩展，CI 测试的是
release wheel。不要在 `python/tests/` 中用 `pytest.raises(BaseException)`
或类似的宽泛捕获在进程内探测 Rust panic 路径。这类测试在 debug 构建下看似通过，
面对 release wheel 却会中止解释器。

对容易 abort 的 PyO3 或 FFI 方法，要么只校验 Python 签名与参数名，
要么把调用隔离到子进程。

已注册的 Rust 基准集用：

```bash
make cargo-ci-benches
```

没有规范的 Python 性能套件接入 CI。聚焦的 Criterion 与 iai 命令、性能剖析与
测量策略见[基准测试指南](./benchmarking.md)。基准测试与单元测试分开运行，避免互相干扰。

### Rust 测试 {#rust-tests}

跑完整套件之前，先[准备大型测试夹具](./test_datasets.md#dataset-categories)。

```bash
make cargo-test
# or
cargo nextest run --workspace --features "$(bash scripts/cargo-features.bash)" --cargo-profile nextest --lib --tests
```

:::info
`cargo nextest` 是完整 Rust 单元与集成套件受支持的运行器。套件依赖逐测试进程隔离
来处理进程全局与线程局部状态，包括日志、消息总线与确定性的测试状态。

`cargo test --workspace` 在同一进程内运行一个测试二进制的所有用例，因此它不是
受支持的全套件门禁，也不保证能通过。普通 `cargo test` 仍适合 doctest，以及已知
能在 libtest 运行器下工作的聚焦测试。
:::

#### Rust doctest {#rust-doctests}

`cargo nextest` 不能执行 doctest，它们走单独的目标：

```bash
make cargo-test-doc
# or
cargo test --doc --workspace --features "$(bash scripts/cargo-features.bash)" --profile nextest
```

文档示例是需要维护的测试面。定时的 `nightly-tests` 工作流在 Python 3.13 与 3.14
下运行该目标。如何让围栏可编译，见 [Rust 指南](./rust.md#doc-examples)。

#### 用可选 feature 测试 {#testing-with-optional-features}

用 `EXTRA_FEATURES` 引入 `capnp` 或 `hypersync` 等可选 feature：

```bash
# Test with capnp feature
make cargo-test EXTRA_FEATURES="capnp"

# Test with multiple features
make cargo-test EXTRA_FEATURES="capnp hypersync"

# Legacy shorthand for hypersync
make cargo-test HYPERSYNC=true

# Test specific crate with features
make cargo-test-crate-nautilus-serialization FEATURES="capnp"
```

### IDE 集成 {#ide-integration}

- **PyCharm**：右键测试目录或文件 -> "Run pytest"。
- **VS Code**：使用 Python Test Explorer 扩展。

## 测试风格 {#test-style}

### 通用 {#general}

- 测试函数按被测内容命名，不必把预期断言编码进名字。
- 文档字符串能讲清准备、场景或预期时就写。
- 尽可能**把断言归组**：先完成全部 setup/act 步骤，再集中断言，
  避免 act-assert-act 的坏味道。
- 测试内部可以用 `unwrap`、`expect` 或直接 `panic!`/`assert`。
  这里清晰与简练比防御性错误处理更重要。
- 不要捕获日志输出来断言日志消息。测试里的日志捕获很脆弱：logger 是全局状态，
  测试执行顺序不确定，而且措辞一改断言就失效。应当验证日志所反映的可观察行为
  （返回值、状态变化、副作用）。

### Python 测试（`python/tests/`） {#python-tests-python-tests}

使用 **pytest 风格的自由函数与 fixture**，不要用测试类。

- 每个测试写成独立的 `def test_*()` 函数。
- 共享准备（工具、引擎实例、数据）用 `@pytest.fixture`。
  需要清理时（例如 `engine.dispose()`）优先用 `yield` fixture。
- 用 `@pytest.mark.parametrize` 覆盖多个输入，不复制测试体。
- 模型类型从 `nautilus_trader.model` import，不从
  `nautilus_trader._libnautilus` import。
- 测试提供者位于 `python/tests/providers.py`。常用工具与数据用
  `TestInstrumentProvider` 与 `TestDataProvider`。
- 依赖未完成特性的测试用 `@pytest.mark.skip(reason="WIP: <description>")`
  标记，而不是删除。

### Rust {#rust}

Rust 专属的测试约定（模块结构、`#[rstest]`、参数化）见
[Rust 指南](./rust.md#testing-conventions)。

## 等待异步效果 {#waiting-for-asynchronous-effects}

Rust 测试中，优先用通知通道或测试自有的其他事件，而不是反复求值条件：

1. 先订阅，再读取权威状态。
1. 每次收到通知后重新检查，以免错过读取与 await 之间的状态转换。

没有合适信号时，用 `nautilus_common::testing` 的 `wait_until_async(...)`。
条件一成立它立即停止，并施加有界超时。只有当被测对象本身就是时间窗口时，
才用固定 sleep。

## Mock {#mocks}

优先用返回固定值的手写 stub，而不是 mocking 框架。`MagicMock` 只用于断言
调用次数或参数，或模拟复杂的状态变化。避免 mock 你正在测试的对象。

## 代码覆盖率 {#code-coverage}

追求高覆盖率，但不为此牺牲错误处理，也不仅为测试而改动架构。有些分支
不改生产行为就无法测试，例如防御性 if-else 块的最后一个条件可能只对
意外值才触发。这些检查保留原样，将来的改动需要时仍能触发它们。

设计期例外也可能不切实际地难以测试，因此 100% 覆盖率不是目标。

## 排除覆盖率统计 {#excluded-code-coverage}

测试显得多余时，用 `pragma: no cover` 注释[把代码排除在覆盖率之外](https://coverage.readthedocs.io/en/coverage-4.3.3/excluding.html)。典型例子：

- 断言抽象方法被调用时抛出 `NotImplementedError`。
- 断言 if-else 块最后一个无法测试的条件检查（同上）。

这类测试维护成本高——要跟着重构走，价值却很低。抽象方法的具体实现保持全覆盖。
`pragma: no cover` 不再适用时就删除，其使用仅限上述情形。

## 调试 Rust 测试 {#debugging-rust-tests}

调试 Rust 测试使用默认的测试配置。

想为后续调试在全套件中带上调试符号，用 `make cargo-test-debug` 代替
`make cargo-test`。

在 IntelliJ IDEA 中，为参数化的 `#[rstest]` 用例调整运行配置，让它读取
`test --package nautilus-model --lib data::bar::tests::test_get_time_bar_start::case_1`
（去掉 `-- --exact`，并在末尾追加 `::case_n`，`n` 从 1 开始）。这一变通做法对应
[rust-analyzer issue 8964](https://github.com/rust-lang/rust-analyzer/issues/8964#issuecomment-871592851)
解释的行为。

在 VS Code 中可以直接挑选要调试的特定测试用例。

## 同时调试 Python 与 Rust {#debugging-python-and-rust}

原生调试器需要 Rust 符号时，用 workspace 的 `debug-pyo3` Cargo profile
构建 PyO3 扩展：

```bash
make sync
(
  cd python
  CARGO_TARGET_DIR=../target \
    uv run --no-sync maturin develop --profile debug-pyo3
)
```

1. 用 Python 调试器启动 Python 程序或 notebook。
1. 用 LLDB 或 GDB 附加到该 Python 进程来打 Rust 断点。

仓库不生成编辑器启动配置，两个调试会话都要在你使用的编辑器里配置。

## 数据类型测试 {#data-type-testing}

每种数据类型都会流经平台的多个层。下表展示既有类型在哪里被测试，
新类型可以照同样的模式补齐。

### 测试层矩阵 {#test-layer-matrix}

| 层                  | 位置                                    | 覆盖内容                                             |
| ---------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| DataEngine subscribe   | `crates/data/tests/integration/engine/`     | 引擎正确处理 subscribe/unsubscribe 命令。 |
| DataEngine publish     | `crates/data/tests/integration/engine/`     | 引擎把发布的数据路由到消息总线。           |
| DataActor subscribe    | `crates/common/src/actor/tests.rs`          | Actor 订阅并通过类型化发布收到数据。      |
| DataActor unsubscribe  | `crates/common/src/actor/tests.rs`          | Actor 取消订阅后不再收到数据。              |
| PyO3 actor dispatch    | `crates/common/src/python/actor.rs`         | Rust 处理器派发到 Python 的 `on_*` 方法。           |
| Python Actor subscribe | `python/tests/unit/common/test_actor.py`    | Python actor 订阅，命令计数递增。         |
| Python Actor unsub     | `python/tests/unit/common/test_actor.py`    | Python actor 取消订阅，订阅列表清空。       |
| 适配器实时测试     | `docs/developer_guide/spec_data_testing.md` | 实时数据验收测试（DataTester）。                   |

### 各数据类型的覆盖 {#coverage-per-data-type}

下表显示每种数据类型在各层的测试覆盖。添加新类型时把它当检查清单用。

| 数据类型           | 引擎 | Actor (Rust) | PyO3 dispatch | Actor (Python) | 适配器规格 |
| ------------------- | ------ | ------------ | ------------- | -------------- | ------------ |
| `InstrumentAny`     | ✓      | ✓            | ✓             | ✓              | ✓            |
| `OrderBookDeltas`   | ✓      | ✓            | ✓             | ✓              | ✓            |
| `OrderBook`         | ✓      | ✓            | ✓             | ✓              | ✓            |
| `QuoteTick`         | ✓      | ✓            | ✓             | ✓              | ✓            |
| `TradeTick`         | ✓      | ✓            | ✓             | ✓              | ✓            |
| `Bar`               | ✓      | ✓            | ✓             | ✓              | ✓            |
| `MarkPriceUpdate`   | ✓      | ✓            | ✓             | ✓              | ✓            |
| `IndexPriceUpdate`  | ✓      | ✓            | ✓             | ✓              | ✓            |
| `FundingRateUpdate` | ✓      | ✓            | ✓             | ✓              | ✓            |
| `InstrumentStatus`  | ✓      | ✓            | ✓             | ✓              | ✓            |
| `InstrumentClose`   | ✓      | ✓            | ✓             | ✓              | ✓            |
| `OptionGreeks`      | ✓      | ✓            | ✓             | ✓              | ✓            |
| `OptionChainSlice`  | -      | ✓            | ✓             | ✓              | ✓            |
| `CustomData`        | ✓      | ✓            | ✓             | ✓              | -            |

`OptionChainSlice` 由 DataEngine 的 `OptionChainManager` 从逐工具的 greeks 与
报价订阅组装而成，没有自己的引擎 subscribe 命令。

### 添加新的数据类型 {#adding-a-new-data-type}

引入新数据类型时，在每一层添加测试：

1. **DataEngine**（`crates/data/tests/integration/engine/`）：添加
   `test_execute_subscribe_<type>` 与 `test_execute_unsubscribe_<type>` 测试。
   沿用既有 subscribe 测试的模式：注册客户端、构造命令、调用 `engine.execute`、
   断言订阅列表。

1. **DataActor Rust**（`crates/common/src/actor/tests.rs`）：
   - 给 `TestDataActor` 添加 `received_<type>: Vec<Type>` 字段。
   - 在 `DataActor` trait 实现中实现 `on_<type>` 处理器。
   - 添加 `test_subscribe_and_receive_<type>` 与 `test_unsubscribe_<type>` 测试。
   - 使用 `TypedHandler` 路由的类型要用类型化的发布函数
     （`msgbus::publish_<type>`），不要用 `publish_any`。

1. **PyO3 actor dispatch**（`crates/common/src/python/actor.rs`）：
   - 添加调用 `py_self.call_method1("on_<type>", ...)` 的 `dispatch_on_<type>` 方法。
   - 在 `DataActor` trait 实现中添加调用该 dispatch 方法的 `on_<type>`。
   - 在 `#[pymethods]` 块中添加 `#[pyo3(name = "on_<type>")]` 方法。
   - 给 `RustTestDataActor` 包装器与内联的 Python 测试类添加 `on_<type>`。
   - 添加处理器测试与 dispatch 测试。

1. **Python Actor**（`python/tests/unit/common/test_actor.py`）：
   - 添加 `test_subscribe_<type>` 与 `test_unsubscribe_<type>` 测试。
   - 断言订阅后 `actor.subscribed_<type>()` 返回预期条目，
     取消订阅后为空。

1. **文档**：在 `actors.md` 的回调表、`strategies.md` 的处理器签名、
   `adapters.md` 的 subscribe 方法桩与 `spec_data_testing.md` 的测试卡中补充条目。

:::tip
在全部五层中搜索 `instrument_close` 或 `funding_rate` 这类既有类型，
就能找到上述模式的具体示例。
:::
