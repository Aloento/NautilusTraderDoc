# Rust

本页定义 NautilusTrader 在 Rust 源码、Cargo 清单、PyO3 绑定与测试方面的约定。

NautilusTrader 的关键核心使用 Rust，因为这门语言兼具强类型系统、所有权模型与
可预期的性能。安全的 Rust 在编译期阻止数据竞争与许多内存错误。`unsafe` 代码
必须把编译器无法检查的不变式显式写出来。

一般 Rust 风格归 `rustfmt` 与 workspace lint 管，下面的规则是其补充。

## 事实来源 {#sources-of-truth}

| 关注点                    | 来源                                             |
| -------------------------- | -------------------------------------------------- |
| 格式化与 import。    | `rustfmt.toml`。                                    |
| Workspace lint。           | `Cargo.toml` 与 `clippy.toml`。                    |
| Cargo 布局。              | `.pre-commit-hooks/check_cargo_conventions.sh`。    |
| Rust 布局。               | `.pre-commit-hooks/check_formatting_rs.sh`。        |
| Nautilus 类型约定。 | `.pre-commit-hooks/check_nautilus_conventions.sh`。 |
| 异步边界。          | `.pre-commit-hooks/check_tokio_usage.sh`。          |
| DST 边界。            | `.pre-commit-hooks/check_dst_conventions.sh`。      |
| PyO3 绑定。             | `.pre-commit-hooks/check_pyo3_conventions.sh`。     |
| Anyhow。                    | `.pre-commit-hooks/check_anyhow_usage.sh`。         |
| 错误命名。               | `.pre-commit-hooks/check_error_conventions.sh`。    |
| 日志。                   | `.pre-commit-hooks/check_logging_conventions.sh`。  |
| Rustdoc 契约。         | `.pre-commit-hooks/check_docs_conventions.sh`。     |
| 测试风格。                | `.pre-commit-hooks/check_testing_conventions.sh`。  |
| Workspace 测试选择。  | `scripts/ci/check-workspace-test-coverage.sh`。     |

工具定不了的取舍，参照附近的代码。要改生成物，改它的输入并重新生成，
不要直接编辑生成的文件。

## 模块布局 {#module-layout}

每个手写模块的排列，让主要行为出现在其支撑实现细节之前。

### 模块根与声明 {#module-roots-and-declarations}

添加子模块时沿用周边模块根的风格。`mod.rs` 文件中每个连续的声明块内，
外联模块声明按这些小节排序：

1. `#[macro_use]` 模块。
1. 公开模块。
1. 受限模块，如 `pub(crate)`。
1. 非测试的 `#[cfg(...)]` 门控模块。
1. 私有模块。
1. 仅测试模块。

各小节内部按字母序排列，小节之间留一个空行。格式化钩子会在 `mod.rs`
文件中强制这一顺序。

可见性用能满足调用方需求的最窄范围。workspace 禁止不可达的 `pub` 项。

### Import {#imports}

import 放在文件或模块顶部。只有当局部 import 的窄作用域确实显著提升清晰度
时，才使用局部 import。

### 常量与全局状态 {#constants-and-global-state}

模块级的常量与全局状态集中在模块顶部，`const` 项放在 `static` 与
`thread_local!` 声明之前。用途狭窄的常量或静态变量则放在其使用方旁边。

### 主类型及其实现 {#primary-types-and-implementations}

主类型及其内在实现放在模块靠前位置。

### 枚举 {#enums}

枚举按角色放置，不要收进模块级的单一区块：

- 主枚举或公开枚举与模块的主类型放在一起。
- 小型状态枚举紧挨它所表示状态的全局量。
- 私有的辅助枚举放在其首个调用方下方。

### 辅助定义 {#supporting-definitions}

私有函数与类型放在调用方下方。适配器中，私有的路由类型、决策枚举与解析函数
放在主客户端实现下方。

### 方框式横幅注释 {#box-style-banner-comments}

不要用方框式的横幅或分隔注释来切分模块内容。用模块与实现块来表达结构。
标准的版权与许可头部是例外。

## Cargo 清单 {#cargo-manifests}

### 依赖与区段 {#dependencies-and-sections}

- 共享依赖使用 workspace 继承，例如
  `serde = { workspace = true }`。只有非 workspace 管理的依赖才在 crate 中
  固定版本。
- 依赖分组之间用空行分隔，每组内按字母序排列。清单通常把内部 `nautilus-*`
  crate、必需的外部 crate 与可选的外部 crate 分组，但保留清单本地有意义的分组。
- 可选 crate 自成一个空行分隔的组，除非该组内全部是 `nautilus-*` crate。
- 保持标准区段顺序：

  1. Package。
  1. Lints。
  1. Library。
  1. Features。
  1. `cargo-machete` 元数据。
  1. docs.rs 元数据。
  1. Dependencies。
  1. Development dependencies。
  1. Build dependencies。
  1. Benches。
  1. Binaries。
  1. Examples。
  1. Tests。

- 每个带库或二进制目标的 workspace crate 都加 `[lints] workspace = true`。
- 适配器依赖放在 workspace `Cargo.toml` 的 `# Adapter dependencies` 区段。
  核心 crate 不得依赖该区段的条目。
- 保持相关依赖家族相互兼容。Cargo 约定钩子检查已知约束，包括 `capnp` 配
  `capnpc`、`arrow` 配 `parquet`、`dydx-proto` 配 `prost` 与 `tonic`。
- `[package.metadata.cargo-machete] ignored` 下列出的必须是已声明的依赖。
- 没有任何 crate 使用的根 `[workspace.dependencies]` 条目要删除。仅供 CI
  使用的 Cargo 工具豁免此项检查。
- 没有任何 crate 继承的根 `[workspace.package]` 字段要删除。
- `[workspace] members` 的每个条目都写成字面路径。约定钩子直接解析成员清单，
  不展开 Cargo 的 glob 成员。
- 适配器 crate 经 `nautilus-live` 获得 `libfuzzer-sys`，不要直接写进适配器
  清单。

`crates/pyo3/Cargo.toml` 把适配器单独分组时，其 `# Adapters` 块保持在核心
内部 crate 之后。

### Package 字段 {#package-fields}

crate 的 `[package]` 区段使用这个规范前缀。Cargo 会推断清单旁边的
`README.md`，因此省略 `readme`；所示的其他字段均为必需。

```toml
[package]
name = "nautilus-example"
version.workspace = true
edition.workspace = true
rust-version.workspace = true
authors.workspace = true
license.workspace = true
description = "Example crate for NautilusTrader"
categories.workspace = true
keywords.workspace = true
documentation.workspace = true
repository.workspace = true
homepage.workspace = true
```

可选的 `publish`、`build` 与 `include` 字段放在 `homepage.workspace` 之后。

### Features {#features}

- 保持 crate 现有的默认 feature 契约。多数核心 crate 默认为空，许多适配器
  crate 默认启用 `high-precision`。
- 每个构建 Python 产物的 `extension-module` feature 都要包含 `"python"`，
  并把它放在 `"pyo3/extension-module"` 旁边。
- 向存储或构造定点领域值的 Nautilus 依赖 crate 传递 `high-precision`。
- 每个公开的非默认 feature 只记录一次，按字母序放在 crate README 的
  `## Feature flags` 与 crate 级库文档的 `# Feature Flags` 下。

### 目标 {#targets}

- `bin/` 源文件用 snake_case 文件名，可执行名用 kebab-case，例如
  `path = "bin/ws_data.rs"` 与 `name = "hyperliquid-ws-data"`。
- 二进制与示例目标设 `doc = false`；二进制目标还要设 `test = false`。
- 库 crate 产出多种类型时，crate-type 按 `rlib`、`staticlib`、`cdylib` 排序。

## 文件头部要求 {#file-header-requirements}

标准的版权与许可头部从邻近的手写 Rust 文件复制。生成文件保留其生成器头部。
版权钩子检查年份。

要改生成的 Rust、C 头文件、Python stub 或包装的文档注释，改生成器的输入
并重跑生成器。

## 格式化与属性 {#formatting-and-attributes}

`rustfmt` 会把标准库、外部 crate 与本地 import 分组，各组内按字母序排列。
运行格式化工具，不要手工排 import。

以下位置留一个空行：

- 函数之间，包括测试。
- 每个 `///` 或 `//!` 文档注释上方。
- 独立的 `if`、`match`、`for`、`while` 与 `loop` 表达式上方。
- 任务 spawn 调用上方，包括 `spawn_local` 与 `spawn_blocking`。
- 包含多行花括号表达式的 `let` 之前，除非它开启一个块。
- 多行结构体字面量或直接限定的 `Type::new(...)` 调用之前，除非它开启一个块。
- 包含多行花括号表达式的语句之后、同一块中的下一条语句之前。

表达式开启一个块、延续上一个操作、或带有附着的注释或属性时，控制流与
spawn 规则不适用。仅仅是换行的调用或方法链不需要分隔。

构造间距同样适用于赋值、显式 return，以及后面跟着 `?` 或 `.await` 的调用。
按 rustfmt 排版后构造必须是多行的。单行初始化保持紧凑。

插入分隔时让注释与属性继续附着在它们的语句上。跳过宏体与 `rustfmt::skip`
区域。围绕改动的代码应用多行语句规则，无关代码不动。只加 `rustfmt` 会保留
的空行。

格式化钩子：

- 在改动边界检查既有的控制流、spawn 与模块排序规则。
- 把已暂存与未暂存的改动与 `HEAD` 比对；设置了 `CHANGED_BASE_SHA` 时与
  合并基（merge base）比对。
- CI 拿不到基线时回退为检查全部被跟踪的 Rust 文件。
- 读取完整的改动文件作为上下文，挑选诊断信息时纳入豁免检查用到的行。
- 不修改文件。

以下仍是评审约定：

- 多行语句间距。
- 构造间距。
- `spawn_local` 与 `spawn_blocking` 间距。

让改动的代码对人类读者保持易读。如果这些分隔之后某段仍然密得难读，
就加更多空行。

已有的变量用内联格式参数：

```rust
anyhow::bail!("Failed to subtract {n} months from {datetime}");
```

丢弃返回值几乎可以肯定是错误时，给这些函数加 `#[must_use]`：

- 构造函数。
- 访问器。
- 纯转换。
- 消耗自身的 `with_*` 方法。

`Result` 这类返回类型自带 `must_use` 注解。

抑制 `missing_panics_doc` 或 `missing_errors_doc` 时，附上说明该 lint 为何
不适用的理由：

```rust
#[allow(
    clippy::missing_errors_doc,
    reason = "result type is retained for API compatibility but no error is returned",
)]
```

标准原子类型用 `try_update`，不用已废弃的 `fetch_update`。pre-commit 钩子
会拒绝 `fetch_update`。

## 类型限定 {#type-qualification}

| 项                          | 约定                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| `anyhow`。                     | 只 import `anyhow::Context`。宏与 `Result` 写完整限定路径。           |
| Nautilus 领域类型。        | import 类型，然后用短名。                                   |
| Tokio 的 time、sync 与 task。  | 写完整限定路径。用 `std::time::Duration`。                          |
| `Debug` 与 `Display`。        | import trait。                                                           |
| `Formatter` 与 `fmt::Result` | 在实现处用 `std::fmt::Formatter` 与 `std::fmt::Result`。     |
| Nautilus 宏。              | import `nautilus_actor!` 或 `nautilus_strategy!`，调用时不加限定。 |

手写 `Debug` 实现用 `debug_struct(stringify!(TypeName))`。

`// nautilus-import-ok` 只用在宏、生成路径或条件 import 确实要求完整限定
Nautilus 类型的地方。标记放在受影响的行上，或紧贴其上的窄块。

## 错误处理与契约 {#error-handling-and-contracts}

### 契约式设计 {#design-by-contract}

用能表达契约的最窄机制：

| 情形                                          | 机制                                    |
| -------------------------------------------------- | -------------------------------------------- |
| 编译期的状态或所有权规则。              | 类型、生命周期、newtype 与可见性。  |
| 公开输入的先决条件。                         | `nautilus_core::correctness` 的 `check_*`。 |
| 已校验值的构造。                      | `new_checked()` 配 `new()` 包装。      |
| 可恢复的解析、I/O 或网络失败。        | `Result<T, E>`。                              |
| release 构建可省略的内部不变式。 | `debug_assert!`，配针对性测试覆盖。 |
| 关乎健全性或必须始终生效的不变式。                  | `assert!` 或受检的错误路径。           |

断言放在代码第一次依赖该不变式的地方。绝不用 `debug_assert!` 做公开输入
校验或健全性条件，因为 release 构建会把它移除。

调试断言消息以 `Invariant:` 开头并陈述正面规则。共享的
`Condition failed: ...` 前缀标记调用方输入违规；`Invariant: ...` 标记内部
契约缺陷。

### 错误边界 {#error-boundaries}

在 API 边界选择错误类型：

| 边界                              | 返回类型                         |
| ------------------------------------- | ----------------------------------- |
| 可复用的库或领域 API。       | 带类型的 `Result<T, E>`。             |
| 应用或适配器编排。 | `anyhow::Result<T>`。                |
| 公开输入校验。              | 视情况用 `CorrectnessResult<T>`。 |

- 调用方会检查或从失败中恢复时，用 `thiserror` 定义带类型的错误。
- 错误模式与闭包参数绑定为 `e`，不是 `err` 或 `error`。
- 从 `anyhow::Result` 函数提前返回用 `anyhow::bail!`；需要错误值之处
  （例如 `ok_or_else` 内）用 `anyhow::anyhow!`。
- `.context()` 消息以小写开头，链式错误读起来才自然。开头的专有名词或
  首字母缩略词保留大写。
- 错误断言消息中不用 `", got"`。按语境用 `", was"`、`", received"` 或
  `", found"`。

```rust
parse_timestamp(value).context("failed to parse timestamp")?;
connect().context("Bybit websocket did not become active")?;
```

### Panic 策略 {#panic-policy}

调用方无法合理恢复的内部不变式违规，panic 是正当的。返回 `Result` 只会让
调用方去处理编程缺陷时，让 API 保持不可失败。保护健全性、或阻止 unsafe
代码带着非法状态继续运行的不变式，用始终生效的断言。

接受不可信输入的边界返回 `Result`。存在配置、I/O、外部数据、任务取消或
资源生命周期失败的边界也返回 `Result`——即使某个具体调用点预期它们永不
发生，这些仍是运维性失败。

已校验的值遵循 [`new()` 与 `new_checked()` 构造模式](#constructor-patterns)。
不可信的值暴露可失败的路径；只有在调用方契约允许 panic 的地方才用便利包装。
公开 Rust API 要记录可达的 panic，每条 panic 消息点名被违反的不变式。

`make clippy-strict-audit` 对下列 lint 的发现按评审提示处理：

- `clippy::panic`
- `clippy::unwrap_used`
- `clippy::expect_used`

该审计同时报告 `clippy::panic_in_result_fn`，必需的 workspace Clippy 门禁
已经强制执行它。失败可恢复时移除 panic；有理由的不变式 panic 保留，必要时
加作用域受限的 lint reason。审计使用强制警告，因此其总数包含带局部 lint
豁免的刻意位置，以及宏展开产生的诊断。

### 失败契约示例 {#failure-contract-examples}

有文档化 panic 契约的 API 在这些情形用 panic：

- 程序员的错误（逻辑缺陷、错误的 API 用法）。
- 违反根本不变式的数据（负时间戳、NaN 价格）。
- 会静默产生错误结果的算术。

调用方（包括下游 crate）能处理失败或缺失时，API 返回 `Result` 或
`Option`，包括：

- 预期的运行时失败（网络错误、文件 I/O）。
- 业务逻辑校验（订单约束、风险限额）。
- 用户输入校验。

API 决定非法操作如何失败：

```rust
let later = timestamp + duration_ns; // Panics on overflow.

let price = Price::new_checked(f64::NAN, precision); // Returns Err.

let later = timestamp.checked_add(duration_ns); // Returns None on overflow.
```

这一策略贯穿核心类型（`UnixNanos`、`Price`、`Quantity` 等），帮助
NautilusTrader 为生产交易维持强数据正确性。

仓库的 release profile 设置 `panic = "abort"`，因此 panic 会终止进程，
交给 supervisor 或编排系统处理。下游 Rust 二进制自行控制其 release profile。

## 日志 {#logging}

- 日志宏写完整限定路径，例如 `log::debug!` 与 `log::info!`。
- 消息以大写的词开头，结尾不加句号。
- 结尾的句号可能属于被记录的值而非句子标点，这种情况在调用行或其上方
  三行内写 `// log-period-ok`。
- 连接与客户端生命周期、重连、对账与批量状态汇总保持 `INFO`。
- 订阅细节、逐订单确认、工具计数、认证与 WebSocket 内部细节保持 `DEBUG`。
- 意外的、用户可处理的或数据丢失的条件被本地处理时记录 warning 或 error。
  还会经 `?` 或 `anyhow::bail!` 继续传播的错误不要记 error。
- 日志调用上方留一个空行，除非它是函数的第一行。
- 生产库代码不写 stdout/stderr，也不终止进程。二进制、示例、bench、测试、
  适配器、CLI 与 testkit 在职责所在时可以控制自己的进程。

## 异步代码 {#async-code}

同步的核心 crate 不把 Tokio 作为常规依赖。`common` crate 保持 Tokio 可选。
确切的 crate 清单归 Tokio 约定钩子管。

适配器的生产代码使用共享运行时，因为调用可能来自没有线程局部 Tokio 上下文的
Python 线程：

```rust
use nautilus_common::live::get_runtime;

get_runtime().spawn(async move {
    run_client().await;
});
```

- `get_runtime` 经由 `nautilus_common::live` import，不是 `live::runtime`。
- 同步的适配器代码必须调用异步函数时用 `get_runtime().block_on()`。
- 测试中使用 `#[tokio::test]` 提供的运行时，那里的 `tokio::spawn()` 合法。
- 有的位置确实无法使用完整限定形式或共享运行时。只有这种位置，在 import 或
  spawn 行上写 `// tokio-import-ok`。
- 自定义运行时要在 `LiveNode::build()` 或任何适配器使用之前安装。构建启用
  全部 driver 的多线程运行时。
- `set_runtime()` 会绕过默认初始化器，包括 Python 初始化。启用了 `python`
  feature 时，先初始化 Python 再安装自定义运行时，或者保留默认运行时。

确定性模拟路径上的代码遵循
[DST 确定性契约](./../concepts/dst.md#determinism-contract)。时钟、随机值、
任务生成与网络访问都经由项目接缝路由。该路径上的 `tokio::select!` 块使用
`biased;`。

## 运行时所有权与访问 {#runtime-ownership-and-access}

### 订单的缓存顺序访问 {#cache-order-access}

`Cache` 把其 `SharedCell` 订单存储藏在受生命周期约束的访问器之后。使用这些
受生命周期约束的访问器：

- **作用域读**：`order_ref()` 或 `try_order_ref()`。
- **独占写借用**：`order_mut()`。
- **跨边界快照**：`order_owned()` 或 `try_order_owned()`。

订单不存在时，`try_*` 形式返回 `OrderLookupError`。

`order_mut()` 要求 `&mut Cache`，因此面向适配器的 `CacheView` 代码不能修改
订单。在事件派发或可能重入同一订单的借用之前，先 drop 掉 `OrderRef` 或
`OrderRefMut`，然后为事件后的状态重新查找订单。

### 运行时不变式 {#runtime-invariants}

actor 注册表、组件注册表与消息总线使用 `thread_local!` 存储。在一个线程上
注册的对象对另一个线程不可见。跨线程控制面用的就是 `LiveNodeHandle`。

`ActorRef` 保持在单个同步作用域内。不要把它存进结构体、跨 `.await` 持有，
或发送到另一个线程。长生命周期的回调里捕获 actor ID，每次回调运行时重新
查找 actor。

组件注册表用作用域借用守卫拒绝别名化的可变访问。不要让组件生命周期操作
可重入。

## 构造与转换 {#construction-and-conversion}

### 构造模式 {#constructor-patterns}

已校验的值类型把可失败的 `new_checked()` 与便利的 `new()` 配成一对：

```rust
pub fn new_checked<T: AsRef<str>>(value: T) -> CorrectnessResult<Self> {
    let value = value.as_ref();
    check_valid_string_ascii(value, stringify!(value))?;
    Ok(Self(Ustr::from(value)))
}

pub fn new<T: AsRef<str>>(value: T) -> Self {
    Self::new_checked(value).expect_display(FAILED)
}
```

共享的 `FAILED` 常量配合 `CorrectnessResultExt::expect_display` 使用，
panic 消息就会采用标准的 `Condition failed: ...` 前缀。`new_checked()` 要
记录错误，`new()` 要记录 panic。

构造函数参数很多且大多可选时，用 `bon` builder。这类类型不暴露公开的位置
参数 `new()` 与 `new_checked()` 方法。`#[bon::bon]` 加在内在实现上。builder
的收尾方法委托给私有的校验函数或直接执行校验。校验与默认值路径保持一条。

```rust
#[builder(start_fn = builder, finish_fn = build)]
pub fn build_checked(/* same inputs as new_checked */) -> CorrectnessResult<Self> {
    Self::new_checked(/* forward inputs */)
}
```

必填字段在 `bon` 类型状态中仍为必填，可选字段仍可省略，`build()` 返回与
内部校验路径相同的 `CorrectnessResult`。

### 转换模式 {#conversion-patterns}

- 只为不可失败、完整的转换实现 `From`。
- 源可能包含非法或不可表示的值时实现 `TryFrom`。
- 字符串解析实现 `FromStr`。
- 会 panic 的泛型 `From<T: AsRef<str>>` 实现视为兼容面，新 API 不要再复制
  这个模式。
- 场所线上枚举与 Nautilus 领域枚举保持分离。用符合 Rust 习惯的变体名，
  用 `serde` 或 `strum` 属性表达线上拼写，在边界处显式转换。
- 适配器载荷先反序列化为线上模型，再构造领域对象。解析与校验放在转换
  函数里，不把场所线上细节嵌进领域类型。

### 领域数值类型 {#domain-numeric-types}

离散的金融值从摄取开始就保持为 decimal：

| 值                                    | 类型与构造                                    |
| ---------------------------------------- | -------------------------------------------------------- |
| 价格或数量。                       | `Price::from_decimal_dp` 或 `Quantity::from_decimal_dp`。 |
| 金额、手续费、保证金或余额。          | `Decimal`，然后 `Money::from_decimal` 或 `Money::zero`。  |
| 连续信号比率或时间曲线。 | decimal 精度没有领域含义时用 `f64`。      |

不要让线上值经 `f64` 构造函数绕路。测试中用 `.as_decimal()` 与 `dec!(value)`
比较。

## 标识符存储 {#identifier-storage}

### 字符串驻留如何工作 {#how-string-interning-works}

字符串驻留把每个不同的字符串在中央缓存中保存一份共享副本。重复的值指向
同一份缓存字节，不再分配新的副本。小巧的句柄让值的复制与比较都很廉价，
缓存的哈希让哈希时无需再读整个字符串。

NautilusTrader 用 `Ustr` 作为驻留标识符的组成单元。每个 `Ustr` 是一个指针
大小、`Copy` 的句柄，带预计算的哈希与稳定的直接字符串访问。`InstrumentId`
这类复合类型保存这些句柄，从而保持同样廉价的复制语义。

### 回收边界 {#reclamation-boundary}

字符串缓存为进程整个生命周期保留每个唯一值。这份保留让复制出的句柄与
返回的字符串切片始终有效，无需引用计数、访问守卫或标识符类型上的显式
生命周期参数。进程拆除就是常规的回收边界。

这些保证排除了安全回收单个条目的可能。Rust 复制 `Copy` 值不执行任何代码，
因此原子引用计数观察不到每一次复制。加入回收的设计会改变标识符契约：

- 引用计数需要 `Clone` 与 `Drop`，这会把 `Copy` 从标识符及其包含类型上移除。
- 借用式或 epoch 保护的存储要求字符串访问点带生命周期或访问守卫。
- 世代句柄允许回收，但使查找变为可失败，并让过期句柄失效。
- 全局缓存重置只有在证实的静止点才安全：所有句柄、引用与外部指针必须
  先销毁，任何任务或线程在那一刻都不能留有其一。

### 存储边界 {#storage-boundaries}

驻留最适合取自进程作用域内有限全集、且重复足够多以受益于去重的标识符。
不同取值会随每一笔订单、成交或消息增长的标识符，会让缓存随进程生命周期
不断膨胀。

外部协议给定了合适的上限时，固定容量的内联存储可以保留 `Copy`。例如
`TradeId` 使用 36 字符的 `StackStr`。回收比 `Copy` 更重要时，用所有权或
引用计数存储提供动态容量。

领域模型也有兼容性例外。`ClientOrderId`、`VenueOrderId`、`PositionId` 与
`OrderListId` 仍由 `Ustr` 支撑，因而保留每个不同值。标识符存储参与受支持的
按值 C ABI，因此更大范围的重设计取决于用基于转换的绑定取代裸布局共享。

存储边界还包括对每个唯一值以及解析期间驻留的每个中间字符串的事先估算。
进程中所有 `Ustr` 用途共享同一个缓存，因此内存开销来自聚合的集合，
而不是每种标识符类型各有一份预算。

### Polymarket 规模示例 {#polymarket-scale-example}

Polymarket 的工具代码由 66 字节的 condition ID 加 77 或 78 字节的 token ID
组成，驻留后的代码为 144 或 145 字节。按 64 位 `ustr` 1.1.0 的布局，
600,000 个不同的 `InstrumentId` 值约需 150 MiB，覆盖保留的标识符值、缓存
查找表与预留的字符串存储。

Polymarket 的解析路径还会驻留每个原始 token ID 与 condition ID。来自约
300,000 个市场的 600,000 个工具，这些条目会把估算推高到约 300 MiB——
这还未计入工具对象、描述、映射与其他元数据。该估算假设工具与 token ID
互不相同，并包含缓存几何增长分配器预留的容量，因此不是精确的常驻集测量。

NautilusTrader 接受这份有界的开销，以换取整个工具全集上的 `Copy`、稳定的
直接访问与全局去重。无界的唯一外部 ID 流仍留在该存储模型之外。

## 集合 {#collections}

按迭代语义与信任边界选择哈希集合：

| 要求                                    | 集合                |
| ---------------------------------------------- | ------------------------- |
| 可观察的插入序迭代。          | `IndexMap` 或 `IndexSet`。 |
| 热路径查找且迭代顺序不可观察。 | `AHashMap` 或 `AHashSet`。 |
| 键由不受信的第三方选择。       | `HashMap` 或 `HashSet`。   |
| 外部 API 要求标准集合。   | `HashMap` 或 `HashSet`。   |

默认的 `AHashMap` 与 `AHashSet` 会随机化其 hasher 状态，因此迭代顺序不稳定。
迭代顺序影响下列任何一种结果时，把该顺序做成确定性的：

- 发出的事件。
- 发往场所的命令与流量。
- 持久化的输出。
- 随机数的消耗。

没有调用方观察迭代顺序的遍历不需要稳定化。

插入序既确定又是所需序列时，用 `IndexMap` 或 `IndexSet`。否则保留哈希集合，
在使用点排序。有序遍历不频繁、或保序删除是热点时，Prefer 排序。
`shift_remove` 以平均 O(n) 保持相对顺序；`swap_remove` 平均 O(1)，
但可能移动最后一个条目。

`AHash` 不是密码学安全的。不受信的键使抗哈希洪泛成为安全边界的一部分时，
用 `HashMap` 或 `HashSet`。

## 文档 {#documentation}

### 覆盖与语气 {#coverage-and-tone}

- 公开项加文档注释。私有行为只在非直观上下文会引发误读时，用普通注释说明。
- 公开模块与契约不直观的模块加模块文档。私有的末端模块不加模板化文档。
- 用陈述语气："Returns the account ID"，不是 "Return the account ID"。
- 公开字段与枚举变体的文档以句号结尾。
- 文档密度与相邻项匹配。不要为了显得整齐给光秃的代码块加填充注释。
- 私有字段的重要上下文写进类型级文档，而不是逐字段注释。

公开函数的契约无法从类型与名字完全看清时，为其补文档：覆盖可失败条件、
panic 条件、安全义务与不直观输入语义。

### Rustdoc 小节 {#rustdoc-sections}

Rustdoc 小节标题用标题式大写：

- `# Examples`
- `# Errors`
- `# Panics`
- `# Safety`
- `# Notes`
- `# Thread Safety`
- `# Feature Flags`

`# Errors` 的描述以 `Returns an error if` 开头；返回 `Option` 时用
``Returns `None` if``。`# Panics` 的描述以 `Panics if` 开头。描述失败条件，
不重复签名中具体的错误类型。保留影响调用方行为的区分，例如可重试与永久失败。

单个条件用一句以句号结尾的话：

```rust
/// # Errors
///
/// Returns an error if the currency conversion fails.
```

多个条件用同样的引导语紧跟冒号：`Returns an error if:`、
``Returns `None` if:`` 或 `Panics if:`。每个条件一个要点，首字母大写、
句号结尾。换行的要点，句号放在其最后一行的末尾。

```rust
/// # Errors
///
/// Returns an error if:
/// - The market price cannot be found.
/// - The conversion rate calculation fails.
```

```rust
/// # Panics
///
/// Panics if:
/// - The quantity is zero.
/// - The quantity exceeds the supported range.
```

文档钩子会在 `# Errors` 与 `# Panics` 小节检查这些引导语与要点句号。它跳过
围栏代码块，到下一个小节标题或文档块末尾为止。下面的抑制标记只豁免契约
检查，不豁免措辞与标点检查。

`# Errors` 只用于返回 `Result`、`PyResult` 或 `Option` 的函数。`# Panics`
只在函数可能 panic 时使用；不可能 panic 就删掉该小节，不要写"本函数不会
panic"这类说明。

文档钩子能识别返回 `Result` 函数中直接的 panic 位置。所调用的函数提供了
有文档的 panic 时，在文档块正上方写 `// panics-doc-ok`。只有签名检查无法
识别的特殊错误契约，才在同样位置用 `// errors-doc-ok`。

### 文档示例 {#doc-examples}

`make cargo-test-doc` 会编译并运行文档示例。每个围栏都要加注解：

| 围栏          | 行为                  | 用途                                                |
| -------------- | ------------------------- | ------------------------------------------------------ |
| `rust`         | 编译并运行。         | 不依赖外部资源的自包含示例。 |
| `rust,no_run`  | 编译但不运行。        | 需要目录、网络或场所的示例。         |
| `ignore`       | 既不编译也不运行。 | 伪代码。说明为何无法编译。               |
| `compile_fail` | 必须编译失败。     | 演示被拒绝的用法。                        |
| `text`         | 不是代码。                 | 目录树、输出或图。                  |
| `bash`、`json` | 不是 Rust。                 | 命令或载荷。                                  |

只是运行期依赖不可用时，Prefer `no_run` 而不是 `ignore`。准备行必须参与
编译但会让渲染后的示例失焦时，给它们加 `#` 前缀。

示例放在公开项上。Rustdoc 也会收集私有项文档中的围栏，但那些示例无法
import 它们所记录的项。

## Python 绑定 {#python-bindings}

### PyO3 命名与错误 {#pyo3-names-and-errors}

- 用 `#[pyo3(name = "...")]` 改名的 Rust 函数以 `py_` 为前缀。
- 绑定需要仅 Rust 侧的包装类型时，以 `Py` 为前缀，并暴露不带该前缀的
  Python 名。
- 公开适配器的 stub 元数据用 `nautilus_trader.adapters.<adapter_name>`；
  运行时模块路径用 `nautilus_trader._libnautilus.<adapter_name>`。
- 标准 Python 异常经 `nautilus_core::python` 的 `to_pyvalue_err`、
  `to_pytype_err`、`to_pyruntime_err`、`to_pykey_err`、`to_pyexception` 或
  `to_pynotimplemented_err` 转换。

`crates/pyo3/src/lib.rs` 中注册的子模块是公开 API。不要在重构时顺手把内部
crate 加为新的 Python 子模块。有意添加的类注册到既有子模块，以保持公开的
包结构。刻意的子模块变更要同时更新 `check_nautilus_conventions.sh` 中的
允许清单。

每个子模块注册保持 `let n = "<name>"` 后跟一次 `pyo3::wrap_pymodule!(<path>)`
调用，名字必须与目标路径的最后一段一致。

### PyO3 枚举 {#pyo3-enums}

Nautilus 领域整数枚举使用 `frozen`、`eq`、`eq_int`、`from_py_object` 与
`rename_all = "SCREAMING_SNAKE_CASE"`。

不要给 `eq_int` 枚举加 PyO3 的 `hash` 属性。它生成的 hash 与 Python 对相等
整数判别值的 hash 不同，破坏"相等值必须有相等 hash"的规则。直接返回判别值：

```rust
#[pymethods]
impl MyEnum {
    const fn __hash__(&self) -> isize {
        *self as isize
    }
}
```

### 类型 stub 注解 {#type-stub-annotations}

每个暴露给 Python 的类型与函数都需要对应的 `pyo3-stub-gen` 注解：

| PyO3 构造    | Stub 注解                                 |
| ----------------- | ----------------------------------------------- |
| `#[pyclass]`      | `pyo3_stub_gen::derive::gen_stub_pyclass`。      |
| 枚举 `#[pyclass]` | `pyo3_stub_gen::derive::gen_stub_pyclass_enum`。 |
| `#[pymethods]`    | `pyo3_stub_gen::derive::gen_stub_pymethods`。    |
| `#[pyfunction]`   | `pyo3_stub_gen::derive::gen_stub_pyfunction`。   |

- 类与枚举的 stub 注解放在 `#[cfg_attr(feature = "python", ...)]` 中，
  紧贴运行时的 `pyo3::pyclass` 属性下方。
- `gen_stub_pymethods` 放在 `#[pymethods]` 正下方。
- `gen_stub_pyfunction` 放在文档注释之后、`#[pyfunction]` 正上方。
- stub 的 `module` 设为 Python 实际 import 该对象的包。
- `pyo3-stub-gen` 作为可选依赖加入，并包含在 `python` feature 中。

### 生成的 Python 产物 {#generated-python-artifacts}

Python 面提交两类生成物：`python/nautilus_trader/` 下的 `.pyi` 文件，以及
`crates/**/src/python/` 下生成的包装文档注释。两者都用下面命令重新生成：

```bash
make py-stubs
```

改动 Python 暴露的 Rust 项、其 stub 注解、其核心文档注释或适配器 feature
接线之后运行该目标。每个变更的生成物都要与源码改动一起提交。

stub 生成器调用 Cargo 前会移除 `extension-module`。某个 feature 仅通过
`extension-module` 启用时，把它显式加进 `python/generate_stubs.py` 的
`cargo_features`。遗漏它，该 feature 导出的类型会从生成的 stub 中消失。
Interactive Brokers 的 `gateway` feature 就是范例。

Python 目标接受 `python/pyproject.toml` 中 `required-version` 定义的 uv
小版本系列。安装版本超出范围时，`make sync`、`make py-stubs` 与
`make build-debug` 会停止。运行 `make update-uv` 安装
`.nautilus-engineering/tools.toml` 中的项目精确版本。

不要编辑 `crates/**/src/python/` 中包装的 `///` 注释。编辑核心 Rust 项的
文档再重新生成。文档同步会：

- 保留 `# Errors` 与 `# Safety`。
- 丢弃 `# Panics`，让 panic 契约不越过 Python API 边界。
- 移除 Rust 的文档内链接。
- 把 Rust 的 `::` 路径转换为 Python 的 `.` 路径。

### Rust-Python 对象所有权 {#rust-python-object-ownership}

`Py<T>` 拥有一个 Python 对象引用的所有权。附着在解释器上时用
`Py::clone_ref` 复制，或用 `nautilus_core::python::clone_py_object`。
`Py<T>` 本身已提供共享所有权，通常不需要再套一层 `Arc<Py<T>>`。

复制 Python 引用不会打破环。反向引用不应让目标保活时，用 Python 弱引用。

## 测试约定 {#testing-conventions}

- 普通的内联测试用 `mod tests`。
- 用 `#[rstest]` 而不是 `#[test]`，非参数化的测试也不例外。
- 非参数化的异步测试用 `#[tokio::test]`。
- 测试模块与仅测试文件保留 `#[cfg(test)]`。不要往生产代码里加测试行为或
  测试接口。
- JSON 夹具存放在 crate 的 `test_data/` 目录，用 `include_str!` 加载。
- 用互不相同的非默认输入与精确的期望值，断言每个稳定字段。
- 除非测试检查逐步骤的状态变化，断言集中在 setup 与动作之后。
- 不使用 Arrange、Act、Assert 分隔注释。

每个 workspace 成员在 `Makefile` 的 `CORE_CRATES`、`ADAPTER_CRATES` 或
`NO_TEST_CRATES` 中恰好出现一次。同时满足下面两个条件才把 crate 加入
`NO_TEST_CRATES`：

- 它不定义任何 Rust 测试目标。
- 它不含任何 `#[test]`、`#[rstest]` 或 `#[test_case]` 函数。

同一行为适用于多个输入时参数化用例：

```rust
#[rstest]
#[case("AUDUSD", false)]
#[case("CL.FUT", true)]
fn test_symbol_is_composite(#[case] input: &str, #[case] expected: bool) {
    assert_eq!(Symbol::new(input).is_composite(), expected);
}
```

### 测试规格 {#test-specs}

构造函数参数很多的事件，在 `events/order/spec/` 下配一个流式的 `bon` spec，
与事件放在一起。模块用 `#[cfg(any(test, feature = "test-support"))]` 门控，
让下游测试可选择启用，而 spec 不进入生产构建。

- 派生 `bon::Builder`，`finish_fn = into_spec`。
- 必填字段给确定性的合法默认值，可选字段留作 `Option<T>`。
- 事件 ID 默认用 `crate::stubs` 的 `test_uuid()`。
- `build()` 的实现经由生产构造函数转发。
- spec 的默认值按构造即有效，因此直接返回事件。
- 在 spec 模块中用一个测试钉住每个默认值。

只覆盖调用方关心的字段：

```rust
let fill = OrderFilledSpec::builder()
    .last_qty(Quantity::from(50_000))
    .trade_id(TradeId::from("TRADE-1"))
    .build();
```

普通 `cargo test` 下，比较 UUID 序列的测试之前要调用
`reset_test_uuid_rng()`。`cargo nextest` 每个测试都是全新进程，序列自动重置。

### 基于属性的测试 {#property-based-tests}

不变式横跨示例无法覆盖的输入类时用 `proptest`。策略（strategy）与属性套件
放在一起，把取值范围与显式边界用例组合起来。

属性名以 `prop_` 为前缀，`proptest!` 内的测试保留 `#[rstest]`。大型套件
可以用 `property_tests` 模块或专门的文件，但仓库也把聚焦的属性与其单元测试
放在一起。

## Unsafe Rust {#unsafe-rust}

unsafe 代码必须让证明义务可评审：

- 每个 unsafe 函数都有 `# Safety` 小节，写明调用方的完整义务。
- 每个 unsafe 操作正上方一条 `SAFETY:` 注释，解释其先决条件在该位置为何成立。
- 每个 unsafe 操作包在独立的 `unsafe { ... }` 块中。workspace crate 禁止
  `unsafe_op_in_unsafe_fn`。
- 空指针、对齐、出处（provenance）等健全性条件用始终生效的检查。
- 为 unsafe 代码周边的可观察行为补充针对性测试。测试支持证明，但不确立健全性。
- unsafe 的 `Send` 或 `Sync` 实现需要覆盖全部可达行为的论证：

  - 状态。
  - 别名。
  - 回调。
  - 泛型参数。
  - 安全方法。
  - 克隆。
  - 销毁。

跨 FFI 的裸向量遵循 [FFI 内存契约](./ffi.md)。转移之后分配归外部代码所有，
必须恰好调用一次匹配的 `vec_drop_*` 函数。

## 其他生成产物 {#other-generated-artifacts}

### FFI 绑定与精度 {#ffi-bindings-and-precision}

只有 `nautilus-core` 与 `nautilus-model` 暴露 `ffi` feature。改动它们的
C ABI 时直接检查这两个 crate：

```bash
cargo check -q -p nautilus-core --features ffi
cargo check -q -p nautilus-model --features ffi,python,high-precision
```

crate 内的 `cbindgen.toml` 定义面向 native 消费方的头文件布局。不要给
其他 workspace crate 加 `ffi` feature 或 `src/ffi` 模块。

运行 `make check-cbindgen-abi`。它生成两个头文件，检查其公开名与兼容性
枚举值，还会据此编译一个 C11 消费方。定时的夜间测试运行这一检查。

### Cap'n Proto schema {#capnp-proto-schemas}

schema 文件位于 `crates/serialization/schemas/capnp/`，生成的 Rust 位于
`crates/serialization/generated/capnp/`。

- 字段只追加在末尾。
- 不删除字段，不复用字段号。废弃的字段在注释中标为 deprecated。
- 用 `make regen-capnp` 重新生成。
- 评审 `git diff crates/serialization/generated/capnp`。
- 运行 `make check-capnp-schemas` 验证签入的生成输出。
- 用 `make cargo-test-crate-nautilus-serialization` 测试序列化 crate。

按[环境搭建](./environment_setup.md#capn-proto)所述安装固定版本的编译器。
生成的绑定保持签入，docs.rs 无需编译器即可构建。
