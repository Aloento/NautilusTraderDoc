# 基准测试 {#benchmarking}

编写、运行与分析 NautilusTrader 基准测试时使用本指南。内容包括基准的布局、示例、
本地命令，以及对外发布结果时的测量流程。

基准的范围、证据要求与 CI 策略见仓库根目录的
[`/BENCHMARKING.md`](https://github.com/nautechsystems/nautilus_trader/blob/develop/BENCHMARKING.md)。

---

## 工具总览 {#tooling-overview}

按工作内容与所需结果选择工具：

| 工具                                                      | 度量内容                          | 适用场景                                                |
| --------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------- |
| [Criterion](https://docs.rs/criterion/latest/criterion/)  | 带置信区间的墙钟时间 | 约 100 ns 以上的操作与经过时间          |
| [iai](https://docs.rs/iai/latest/iai/)                    | Cachegrind 下的退休 CPU 指令数 | 小型确定性操作与变更检测      |
| [CodSpeed](https://codspeed.io/docs/instruments/cpu)      | 模拟的 CPU 开销与缓存行为     | 确定性 CPU 工作在 pull request 间的稳定对比 |
| [flamegraph](https://github.com/flamegraph-rs/flamegraph) | 采样的调用栈画像                | 在一条有代表性的慢路径中定位工作           |

Criterion 报告用户可见的经过时间。iai 对相同的二进制、工具链与输入给出稳定的计数，
不要求控制宿主噪声。只在相同的代码生成假设下比较 iai 结果；需要经过时间这一结果时
用 Criterion。

---

## 目录布局 {#directory-layout}

每个 crate 把基准放在本地的 `benches/` 目录：

```text
crates/<crate_name>/
└── benches/
    ├── foo_criterion.rs
    └── foo_iai.rs
```

在 crate 的 `Cargo.toml` 中显式注册每个基准，`cargo bench` 才能发现它：

```toml
[[bench]]
name = "foo_criterion"
path = "benches/foo_criterion.rs"
harness = false

[[bench]]
name = "foo_iai"
path = "benches/foo_iai.rs"
harness = false
```

要用夜间的 CI 性能工作流，就得注册基准。若 `CI_BENCH_CRATES` 未包含该 crate，
在 workspace 的 `Makefile` 中加入它。当 CPU 模拟仍能保留基准想度量的内容时，
把确定性的 Criterion 目标加入 `CODSPEED_BENCH_TARGETS`。不要把 iai、
Criterion 的 `iter_custom` 或 `with_filter` API、依赖操作系统的工作，
以及并发的墙钟基准加入 CodSpeed 子集。

---

## 编写 Criterion 基准 {#writing-criterion-benchmarks}

- **准备**：迭代之间保持不变的工作放到外围代码或 `iter_batched_ref` 的 setup
  闭包里，不要放进传给 `iter` 的函数体。
- **输入**：用 `black_box` 包住输入，防止优化器把它们折叠掉。
- **会改状态的基准**：用 `iter_batched_ref` 把输入的 `Drop` 排除在计时区域之外，
  否则释放大对象会主导测量结果。
- **吞吐量**：给按规模参数化的分组加上 `Throughput::Elements(n)`，
  Criterion 才会报告每元素吞吐。
- **意图**：注释说明基准度量的是什么（热路径、最坏情况还是缓存未命中的情况），
  让读者知道性能回归意味着什么。

```rust
use std::hint::black_box;

use criterion::{BatchSize, BenchmarkId, Criterion, Throughput, criterion_group, criterion_main};

const SIZES: &[usize] = &[10, 100, 1_000];

fn bench_my_op(c: &mut Criterion) {
    let mut group = c.benchmark_group("module/my_op");

    for &n in SIZES {
        group.throughput(Throughput::Elements(n as u64));
        group.bench_with_input(BenchmarkId::from_parameter(n), &n, |b, &n| {
            b.iter_batched_ref(
                || populate(n),
                |state| state.run(black_box(n)),
                BatchSize::SmallInput,
            );
        });
    }

    group.finish();
}

criterion_group!(benches, bench_my_op);
criterion_main!(benches);
```

---

## 编写 iai 基准 {#writing-iai-benchmarks}

`iai` 要求函数不接受参数。把它用于小型纯操作，让测得的指令数聚焦于目标工作。

```rust
use std::hint::black_box;

fn bench_add() -> i64 {
    let a = black_box(123);
    let b = black_box(456);
    a + b
}

iai::main!(bench_add);
```

分配、随机性与系统调用会把自己的指令计入结果。可变准备的代码留在被测函数之外，
并且只比较同一工具链与目标产出的计数。

---

## 本地运行基准 {#running-benches-locally}

| 目标                               | 命令                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| 单个 crate 的全部基准           | `cargo bench -p nautilus-execution`                                   |
| 一个核心基准模块              | `cargo bench -p nautilus-execution --bench matching_core`             |
| 一个引擎基准模块            | `cargo bench -p nautilus-execution --bench matching_engine`           |
| 一个核心基准名匹配模式    | `cargo bench -p nautilus-execution --bench matching_core -- iterate`  |
| 一个引擎基准名匹配模式  | `cargo bench -p nautilus-execution --bench matching_engine -- submit` |
| 快速冒烟（低采样数） | `cargo bench ... -- --quick`                                          |
| 夜间全部已注册基准     | `make cargo-ci-benches`                                               |
| 构建 CodSpeed 子集          | `make cargo-codspeed-build`                                           |
| 检查已构建的 CodSpeed 子集    | `make cargo-codspeed-run`                                             |

Criterion 把 HTML 报告写入 `target/criterion/`，打开
`target/criterion/report/index.html` 即可查看。报告包含每个基准的小提琴图、
置信区间，以及与上一次运行保存的基线的对比。

`make install-tools` 安装锁定的 `cargo-codspeed` 版本。本地 CodSpeed 运行只检查
选定的基准目标能构建并注册，不上传测量结果。测量与上传由
`.github/workflows/performance.yml` 中的 `codspeed-benchmarks` 任务完成。

### 规范回测负载 {#canonical-backtest-workloads}

规范回测用例使用签入仓库的 `test_data/btc-perp-20211231-20220201_1m.csv`
文件的前 10,000 行。一个共享测试夹具驱动四种场景：仅重放、定时市价单、
被动限价单与 bar-EMA。正确性测试与两条计时路径使用同一个夹具加载器和
完全一致的结果指纹。

先跑语义检查：

```bash
CARGO_BUILD_JOBS=16 cargo test --locked -p nautilus-backtest \
    --test integration canonical_backtest_workloads::
```

再在 test 模式下运行 Criterion，确认每个受影响的基准用例都能执行而不采集样本：

```bash
CARGO_BUILD_JOBS=16 cargo bench --locked -p nautilus-backtest \
    --bench engine -- canonical --test
```

`run_preloaded` 用例在返回的 `iter_custom` 计时区间之外加载 CSV 并构建引擎。
`load_build_run` 用例则把 CSV 加载、引擎设置、数据注册与 `BacktestEngine::run`
全部计入。两者都把结果投影与指纹校验排除在所报告的耗时之外，
但每次计时迭代之后仍会检查结果。

已发布的基线、测量记录与当前的 profile 目标见
[`crates/backtest/benches/BENCHMARKS.md`](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/backtest/benches/BENCHMARKS.md)。

跨版本的回测比较步骤见 [v2 迁移指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/MIGRATION_V2.md#compare-backtest-performance)。

---

## 为发布做 Criterion 测量 {#measure-criterion-for-publication}

将对外报告或发布的 Criterion 结果，使用 `bench-lto` profile。该 profile 继承自
`release`，保留完整调试符号，启用 fat LTO，并使用单一代码生成单元。
默认的 `bench` profile 保留完整调试符号但不做 LTO，更适合本地反复迭代。

1. 让机器静默。在 Linux 上，若你管理该主机且能恢复其原有状态，
   把 CPU 调频策略设为 `performance`：

   ```bash
   sudo cpupower frequency-set -g performance
   ```

1. 在 Linux 上为基准进程关闭 ASLR，并用 `bench-lto` 运行选定的基准：

   ```bash
   setarch "$(uname -m)" -R cargo bench --profile bench-lto -p <crate> --bench <name>
   ```

1. 运行多个完整会话，并报告每个用例采用的是最佳值还是中位数。

1. 随结果记录 CPU 型号、内核或操作系统、Rust 工具链与构建 profile：

   ```text
   Hardware: <CPU model>, <kernel or operating system>
   Toolchain: <rustc version>
   Profile: bench-lto (release + lto = "fat" + codegen-units = 1, debug = full)
   ```

需要更深入的分析时，在固件中控制超线程与动态调频。若这些设置与主机常态不同，
发布的结果必须记录它们。

iai 运行在 Cachegrind 的虚拟 CPU 模型下，因此宿主静默、动态调频与 ASLR 都不影响
其指令计数。运行 iai 时不需要 Criterion 那套噪声控制。

---

## 生成火焰图 {#generating-a-flamegraph}

`cargo-flamegraph` 为单个基准生成采样的调用栈画像。当某个基准出现回归、
而责任所在的内层调用不明确时，用它来定位。

1. 每台机器安装一次：

   ```bash
   cargo install flamegraph
   ```

2. 用 `bench` profile 运行指定基准：

   ```bash
   cargo flamegraph --bench matching -p nautilus-common --profile bench
   ```

3. 在浏览器中打开 `flamegraph.svg`，放大查看热点路径。

### Linux {#linux}

需要可用的 `perf`。Debian/Ubuntu 上：

```bash
sudo apt install linux-tools-common linux-tools-$(uname -r)
```

若 `perf_event_paranoid` 阻止运行：

```bash
sudo sh -c 'echo 1 > /proc/sys/kernel/perf_event_paranoid'
```

设为 `1` 通常就够。用完后改回 `2`（默认值），或通过 `/etc/sysctl.conf` 持久化。

### macOS {#macos}

`DTrace` 需要 root，因此 `cargo flamegraph` 必须用 `sudo` 运行。

:::warning
用 `sudo` 运行会在 `target/` 中创建属于 root 的文件，导致后续 `cargo` 命令
报权限错误。你可能需要手工删除这些 root 文件，或运行 `sudo cargo clean`。
:::

```bash
sudo cargo flamegraph --bench matching -p nautilus-common --profile bench
```

`bench` profile 保留完整调试符号，因此火焰图能渲染出可读的函数名，
又不会撑大生产二进制（生产构建仍使用 `panic = "abort"`，由
`[profile.release]` 配置）。

> **Note** 基准二进制使用 workspace `Cargo.toml` 中定义的自定义
> `[profile.bench]` 编译。该 profile 继承自 `release` 并设置
> `debug = "full"`，同时保留完整优化*与*调试符号，因此
> `cargo flamegraph` 或 `perf` 这类工具能产出人类可读的堆栈跟踪。

---

## 模板 {#templates}

起步文件位于 [`docs/dev_templates/`](https://github.com/nautechsystems/nautilus_trader/blob/develop/dev_templates)：

- **Criterion**：[`criterion_template.rs`](https://github.com/nautechsystems/nautilus_trader/blob/develop/dev_templates/criterion_template.rs)
- **iai**：[`iai_template.rs`](https://github.com/nautechsystems/nautilus_trader/blob/develop/dev_templates/iai_template.rs)

把模板复制到目标 crate 的 `benches/`，调整 import 与分组名，在 `Cargo.toml`
中注册，就可以开始测量。
