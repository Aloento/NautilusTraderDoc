# 基准测试（Benchmarking）

本指南说明 NautilusTrader 如何衡量 Rust 代码性能、何时使用不同的基准工具，以及在新增基准测试（benches）时应遵循的约定。

---

## 工具概览

NautilusTrader 使用两种互补的基准框架：

| Framework                                                    | 是什么？                                                       | 测量内容                                       | 何时优先使用                                                   |
| ------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| [**Criterion**](https://docs.rs/criterion/latest/criterion/) | 基于统计学的基准框架，生成详细的 HTML 报告并能进行离群点检测。 | 以实时时钟（wall-clock）计时，并给出置信区间。 | 端到端场景、运行时间大于约 100 ns 的情况，或需要可视化对比时。 |
| [**iai**](https://docs.rs/iai/latest/iai/)                   | 确定性微基准框架，通过硬件计数器统计已退役的 CPU 指令数。      | 精确的指令计数（无噪声）。                     | 超快函数的微基准；在 CI 中通过指令计数差异进行门控（gating）。 |

大多数热点路径从两种测量中都能受益——Criterion 提供易于理解的时间与置信区间，iai 则带来精确的指令级比较。

---

## 目录布局

每个 crate 的性能测试都放在各自的本地 `benches/` 目录下：

```text
crates/<crate_name>/
└── benches/
    ├── foo_criterion.rs   # Criterion 组
    └── foo_iai.rs         # iai 微基准
```

需要在该 crate 的 `Cargo.toml` 中显式列出每个 benchmark，以便 `cargo bench` 能发现它们：

```toml
[[bench]]
name = "foo_criterion"             # benches/ 下文件名（不含扩展名）
path = "benches/foo_criterion.rs"
harness = false                    # 关闭默认的 libtest harness
```

---

## 编写 Criterion 基准

编写 Criterion 基准时的要点：

1. 将所有耗时的初始化放到计时循环（`b.iter`）之外执行。
2. 使用 `black_box` 包裹输入/输出，防止编译器优化掉待测工作。
3. 用 `benchmark_group!` 将相关用例归为一组，当默认设置不合适时设置 `throughput` 或 `sample_size`。

示例：

```rust
use std::hint::black_box;

use criterion::{Criterion, criterion_group, criterion_main};

fn bench_my_algo(c: &mut Criterion) {
    let data = prepare_data(); // 重量级的准备工作只做一次

    c.bench_function("my_algo", |b| {
        b.iter(|| my_algo(black_box(&data)));
    });
}

criterion_group!(benches, bench_my_algo);
criterion_main!(benches);
```

---

## 编写 iai 基准

`iai` 要求基准函数不接受参数并返回一个值（该返回值可以被忽略）。函数应尽量小巧，以确保测得的指令数有意义。

示例：

```rust
use std::hint::black_box;

fn bench_add() -> i64 {
    let a = black_box(123);
    let b = black_box(456);
    a + b
}

iai::main!(bench_add);
```

---

## 在本地运行基准

- **单个 crate**：`cargo bench -p nautilus-core`。
- **单个 benchmark 模块**：`cargo bench -p nautilus-core --bench time`。
- **CI 性能基准**：`make cargo-ci-benches`（按顺序运行 CI 性能工作流中包含的各个 crate，以避免混合 panic 策略导致的链接器问题）。

Criterion 会把 HTML 报告写入 `target/criterion/`，在浏览器中打开 `target/criterion/report/index.html` 即可查看。

### 生成 flamegraph

`cargo-flamegraph` 可生成基准的采样调用栈（flamegraph），在 Linux 上基于 `perf`，在 macOS 上使用 `DTrace`。

1. 在每台机器上安装一次 `cargo-flamegraph`（该工具会自动安装一个 `cargo flamegraph` 子命令）。

```bash
cargo install flamegraph
```

1. 使用带符号信息的 `bench` profile 运行指定的基准。

```bash
# 示例：nautilus-common 中的 matching 基准
cargo flamegraph --bench matching -p nautilus-common --profile bench
```

1. 在浏览器中打开生成的 `flamegraph.svg`，并放大查看热点路径。

#### Linux

在 Linux 上需要安装 `perf`。在 Debian/Ubuntu 上可以使用：

```bash
sudo apt install linux-tools-common linux-tools-$(uname -r)
```

如果出现与 `perf_event_paranoid` 相关的错误，需要在当前会话中放宽内核的 perf 限制（需要 root）：

```bash
sudo sh -c 'echo 1 > /proc/sys/kernel/perf_event_paranoid'
```

通常设置为 `1` 即足够；如果需要可以恢复为 `2`（默认值），或通过 `/etc/sysctl.conf` 做永久更改。

#### macOS

在 macOS 上，`DTrace` 需要 root 权限，因此必须使用 `sudo` 运行 `cargo flamegraph`：

```bash
# 注意使用了 sudo
sudo cargo flamegraph --bench matching -p nautilus-common --profile bench
```

> **警告**
>
> 使用 `sudo` 运行会在 `target/` 目录中生成由 `root` 用户拥有的文件。这可能会导致后续运行 `cargo` 命令时出现权限错误。
>
> 解决方法是手动删除这些 root 拥有的文件，或运行 `sudo cargo clean` 来清除整个 `target/` 目录。

由于 `[profile.bench]` 保留了完整的调试符号，生成的 SVG 会显示可读的函数名，同时不会让生产构建变得臃肿（生产构建仍通过 `[profile.release]` 使用 `panic = "abort"`）。

> **注意** 基准二进制使用工作区 `Cargo.toml` 中自定义的 `[profile.bench]` 进行编译。该配置继承自 `release-debugging`，在保持完全优化的同时保留调试符号，从而使 `cargo flamegraph` 或 `perf` 等工具生成的人类可读的调用栈。

---

## 模板

可直接复制使用的起始模板文件位于 `docs/dev_templates/`：

- **Criterion**: `criterion_template.rs`
- **iai**: `iai_template.rs`

将模板复制到 `benches/`，根据需要调整导入和名称，然后开始测量！
