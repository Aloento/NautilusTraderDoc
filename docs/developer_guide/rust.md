# Rust 风格指南

[Rust](https://www.rust-lang.org/learn) 语言非常适合实现平台和系统的关键核心部分。
它强类型系统、所有权模型与编译期检查在设计上消除了内存错误和数据竞争，
而零成本抽象与无垃圾回收机制则提供了接近 C 的性能，这对高频交易这类对延迟和吞吐敏感的工作负载至关重要。

## Cargo 清单（manifest）约定

- 在 `[dependencies]` 中：先按字母顺序列出内部 crate（例如 `nautilus-*`），插入一个空行，再按字母顺序列出外部必需依赖；随后再插入一个空行，最后按字母顺序列出可选依赖（即带有 `optional = true` 的项）。保留每个依赖行上的内联注释。
- 对于会构建 Python 工件的 `extension-module` 特性列表，请始终把 `"python"` 加入其中，并与 `"pyo3/extension-module"` 相邻，以便一眼看出完整的 Python 栈依赖。
- 当 manifest 将适配器（adapters）单独分组时（例如 `crates/pyo3`），把 `# Adapters` 块放在内部 crate 列表下方，便于下游消费者快速查看适配器覆盖情况。
- 在 `[dev-dependencies]` 和 `[build-dependencies]` 节之前始终保留一个空行。
- 当相关 manifest 的特性或依赖集合发生变化时，保持相同布局以避免各个 crate 之间出现样式漂移。
- 对 `bin/` 下的源文件使用 snake_case 文件名（例如 `bin/ws_data.rs`），并在每个 `[[bin]]` 部分中反映相应路径。
- 保持 `[[bin]] name` 条目使用 kebab-case（例如 `name = "hyperliquid-ws-data"`），以保证编译出的二进制文件拥有预期的 CLI 名称。

## 版本管理建议

- 对于共享依赖使用 workspace 继承（例如 `serde = { workspace = true }`）。
- 仅对不属于 workspace 的 crate 特有依赖直接固定版本（pin）。
- 把 workspace 提供的依赖放在 crate 专属依赖之前，便于审计继承关系。

## 特性（feature）约定

- 优先采用“可叠加”（additive）的特性开关——启用某特性不应破坏现有功能。
- 使用描述性名称来说明特性启用后会带来什么能力。
- 在 crate 级别文档中记录每个特性，方便使用者了解其影响。
- 常见模式：
  - `high-precision`：切换底层数值类型（64 位或 128 位整数），以支持需要更高精度的场景。
  - `default = []`：保持默认集尽可能精简。
  - `python`：启用 Python 绑定。
  - `extension-module`：构建 Python 扩展模块（始终同时包含 `python`）。
  - `ffi`：启用 C 语言 FFI 绑定。
  - `stubs`：暴露用于测试的桩（stubs）。

## 模块组织

- 保持模块聚焦单一职责。
- 在定义子模块时使用 `mod.rs` 作为模块根文件。
- 相较于深度嵌套，更倾向于使用相对扁平的层级，以便路径更易管理。
- 对常用项在 crate 根处进行 re-export，提升使用方便性。

## 代码风格与约定

### 文件头要求

所有 Rust 文件必须包含标准化的版权头：

```rust
// -------------------------------------------------------------------------------------------------
//  Copyright (C) 2015-2025 Nautech Systems Pty Ltd. All rights reserved.
//  https://nautechsystems.io
//
//  Licensed under the GNU Lesser General Public License Version 3.0 (the "License");
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at https://www.gnu.org/licenses/lgpl-3.0.en.html
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// -------------------------------------------------------------------------------------------------
```

### 代码格式化

运行 `make format` 时，`rustfmt` 会自动处理导入（import）的格式化。
该工具会将导入按组（标准库、外部 crate、本地导入）划分，并在每个组内按字母顺序排序。

在本节内，请遵循以下空行规则：

- 在函数之间（包括测试）保留**一行空行**——这有助于可读性，也与 `rustfmt` 的默认行为一致。
- 在每个文档注释（`///` 或 `//!`）上方保留**一行空行**，以便将注释与前面的代码块明显分离。

#### 字符串格式

优先使用带变量名的内联格式字符串，而非位置参数：

```rust
// Preferred - inline format with variable names
anyhow::bail!("Failed to subtract {n} months from {datetime}");

// Instead of - positional arguments
anyhow::bail!("Failed to subtract {} months from {}", n, datetime);
```

这种方式使得错误消息更具可读性与自说明性，尤其在变量较多时更明显。

### 日志（Logging）

- 明确限定日志宏的路径以指明后端：
  - 在同步核心 crate 中使用 `log::…`（如 `log::info!`, `log::warn!` 等）。
  - 在异步运行时、适配器及外围组件中使用 `tracing::…`（如 `tracing::debug!`, `tracing::info!` 等）。
- 日志消息以首字母大写开头，优先使用完整句子，但省略结尾句号（例如使用 "Processing batch" 而不是 "Processing batch."）。

### 错误处理

一致地采用结构化的错误处理模式：

1. **主要模式**：对可能失败的函数使用 `anyhow::Result<T>`：

   ```rust
   pub fn calculate_balance(&mut self) -> anyhow::Result<Money> {
       // Implementation
   }
   ```

2. **自定义错误类型**：对领域特定错误使用 `thiserror`：

   ```rust
   #[derive(Error, Debug)]
   pub enum NetworkError {
       #[error("Connection failed: {0}")]
       ConnectionFailed(String),
       #[error("Timeout occurred")]
       Timeout,
   }
   ```

3. **错误传播**：使用 `?` 运算符实现清晰的错误传播。

4. **构造错误**：偏好用 `anyhow::bail!` 做早期返回：

   ```rust
   // Preferred - using bail! for early returns
   pub fn process_value(value: i32) -> anyhow::Result<i32> {
       if value < 0 {
           anyhow::bail!("Value cannot be negative: {value}");
       }
       Ok(value * 2)
   }

   // Instead of - verbose return statement
   if value < 0 {
       return Err(anyhow::anyhow!("Value cannot be negative: {value}"));
   }
   ```

   注意：在需要闭包上下文（如 `ok_or_else()`）而无法早期返回时，使用 `anyhow::anyhow!`。

### 异步模式（Async patterns）

保持异步/await 的一致使用惯例：

1. **异步函数命名**：无需特殊后缀，使用自然命名即可。
2. **Tokio 使用**：对 fire-and-forget 类型的工作使用 `tokio::spawn`，并在文档中说明该后台任务何时应该完成。
3. **错误处理**：异步函数也返回 `anyhow::Result`，以与同步约定一致。
4. **取消安全（cancellation safety）**：在文档中说明函数是否对取消安全以及被取消后仍保持的不变式。
5. **流处理**：使用 `tokio_stream`（或 `futures::Stream`）实现异步迭代器，从而显式处理背压（back-pressure）。
6. **超时模式**：对网络或长耗时的 await 使用超时封装（`tokio::time::timeout`），并传播或处理超时错误。

### 属性（attribute）使用规范

一致地使用属性并保持固定顺序：

```rust
#[repr(C)]
#[derive(Clone, Copy, Debug, Hash, PartialEq, Eq, PartialOrd, Ord)]
#[cfg_attr(
    feature = "python",
    pyo3::pyclass(module = "nautilus_trader.model")
)]
pub struct Symbol(Ustr);
```

对于带大量 derive 属性的枚举：

```rust
#[repr(C)]
#[derive(
    Copy,
    Clone,
    Debug,
    Display,
    Hash,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    AsRefStr,
    FromRepr,
    EnumIter,
    EnumString,
)
#[strum(ascii_case_insensitive)]
#[strum(serialize_all = "SCREAMING_SNAKE_CASE")]
#[cfg_attr(
    feature = "python",
    pyo3::pyclass(eq, eq_int, module = "nautilus_trader.model")
)]
pub enum AccountType {
    /// An account with unleveraged cash assets only.
    Cash = 1,
    /// An account which facilitates trading on margin, using account assets as collateral.
    Margin = 2,
}
```

### 构造函数模式

在 `new()` 与 `new_checked()` 之间保留一致约定：

```rust
/// Creates a new [`Symbol`] instance with correctness checking.
///
/// # Errors
///
/// Returns an error if `value` is not a valid string.
///
/// # Notes
///
/// PyO3 requires a `Result` type for proper error handling and stacktrace printing in Python.
pub fn new_checked<T: AsRef<str>>(value: T) -> anyhow::Result<Self> {
    // Implementation
}

/// Creates a new [`Symbol`] instance.
///
/// # Panics
///
/// Panics if `value` is not a valid string.
pub fn new<T: AsRef<str>>(value: T) -> Self {
    Self::new_checked(value).expect(FAILED)
}
```

始终在与正确性检查相关的 `.expect()` 信息中使用 `FAILED` 常量：

```rust
use nautilus_core::correctness::FAILED;
```

### 常量与命名约定

对描述性常量使用 SCREAMING_SNAKE_CASE：

```rust
/// Number of nanoseconds in one second.
pub const NANOSECONDS_IN_SECOND: u64 = 1_000_000_000;

/// Bar specification for 1-minute last price bars.
pub const BAR_SPEC_1_MINUTE_LAST: BarSpecification = BarSpecification {
    step: NonZero::new(1).unwrap(),
    aggregation: BarAggregation::Minute,
    price_type: PriceType::Last,
};
```

### 哈希集合（Hash collections）

优先使用 `ahash` crate 提供的 `AHashMap` 和 `AHashSet`，替代标准库的 `HashMap` 和 `HashSet`：

```rust
use ahash::{AHashMap, AHashSet};

// Preferred - using AHashMap/AHashSet
let mut symbols: AHashSet<Symbol> = AHashSet::new();
let mut prices: AHashMap<InstrumentId, Price> = AHashMap::new();

// Instead of - standard library HashMap/HashSet
use std::collections::{HashMap, HashSet};
let mut symbols: HashSet<Symbol> = HashSet::new();
let mut prices: HashMap<InstrumentId, Price> = HashMap::new();
```

**为什么使用 `ahash`？**

- **更优的性能**：AHash 在可用时利用 AES-NI 硬件指令，相较默认的 SipHash 可提供 2-3 倍的哈希速度提升。
- **低碰撞率**：尽管不是加密哈希，但 AHash 在典型数据下仍能提供良好的分布与较低的碰撞概率。
- **无缝替换**：与标准库集合兼容的 API，便于直接替换。

**何时使用标准 `HashMap`/`HashSet`：**

- **需要加密安全**：当哈希泛滥攻击（hash flooding）是关注点（例如处理来自不受信任用户的网络输入）时，请使用标准的 `HashMap`。
- **面向网络的客户端**：对于网络相关组件，目前更倾向于使用标准库的 `HashMap`，因为安全性优先于性能。

### Re-export 约定

按字母顺序组织 re-export，并放在 `lib.rs` 文件末尾：

```rust
// Re-exports
pub use crate::{
    nanos::UnixNanos,
    time::AtomicTime,
    uuid::UUID4,
};

// Module-level re-exports
pub use crate::identifiers::{
    account_id::AccountId,
    actor_id::ActorId,
    client_id::ClientId,
};
```

### 文档标准

#### 模块级文档

所有模块必须有模块级文档，并以简短描述开始：

```rust
//! Functions for correctness checks similar to the *design by contract* philosophy.
//!
//! This module provides validation checking of function or method conditions.
//!
//! A condition is a predicate which must be true just prior to the execution of
//! some section of code - for correct behavior as per the design specification.
```

对于带有特性开关的模块，要清晰地记录这些特性：

```rust
//! # Feature flags
//!
//! This crate provides feature flags to control source code inclusion during compilation,
//! depending on the intended use case:
//!
//! - `ffi`: Enables the C foreign function interface (FFI) from [cbindgen](https://github.com/mozilla/cbindgen).
//! - `python`: Enables Python bindings from [PyO3](https://pyo3.rs).
//! - `extension-module`: Builds as a Python extension module (used with `python`).
//! - `stubs`: Enables type stubs for use in testing scenarios.
```

#### 字段文档

所有结构体和枚举字段必须有以句号结尾的文档注释：

```rust
pub struct Currency {
    /// The currency code as an alpha-3 string (e.g., "USD", "EUR").
    pub code: Ustr,
    /// The currency decimal precision.
    pub precision: u8,
    /// The ISO 4217 currency code.
    pub iso4217: u16,
    /// The full name of the currency.
    pub name: Ustr,
    /// The currency type, indicating its category (e.g. Fiat, Crypto).
    pub currency_type: CurrencyType,
}
```

#### 函数文档

对所有公共函数请记录：

- 目的与行为
- 参数的使用说明
- 可能出现的错误条件（如适用）
- 可能触发的 panic 条件（如适用）

```rust
/// Returns a reference to the `AccountBalance` for the specified currency, or `None` if absent.
///
/// # Panics
///
/// Panics if `currency` is `None` and `self.base_currency` is `None`.
pub fn base_balance(&self, currency: Option<Currency>) -> Option<&AccountBalance> {
    // Implementation
}
```

#### 错误与 panic 的文档格式

针对单行错误与 panic 的文档，使用句子式大小写并遵循下列约定：

```rust
/// Returns a reference to the `AccountBalance` for the specified currency, or `None` if absent.
///
/// # Errors
///
/// Returns an error if the currency conversion fails.
///
/// # Panics
///
/// Panics if `currency` is `None` and `self.base_currency` is `None`.
pub fn base_balance(&self, currency: Option<Currency>) -> anyhow::Result<Option<&AccountBalance>> {
    // Implementation
}
```

对于多行的错误与 panic 文档，使用句子式大小写，并以要点形式列出每项，句尾以句号结束：

```rust
/// Calculates the unrealized profit and loss for the position.
///
/// # Errors
///
/// Returns an error if:
/// - The market price for the instrument cannot be found.
/// - The conversion rate calculation fails.
/// - Invalid position state is encountered.
///
/// # Panics
///
/// This function panics if:
/// - The instrument ID is invalid or uninitialized.
/// - Required market data is missing from the cache.
/// - Internal state consistency checks fail.
pub fn calculate_unrealized_pnl(&self, market_price: Price) -> anyhow::Result<Money> {
    // Implementation
}
```

#### 安全（Safety）文档格式

对于 Safety 文档，使用 `SAFETY:` 前缀，简要说明为何该 unsafe 操作是安全的：

```rust
/// Creates a new instance from raw components without validation.
///
/// # Safety
///
/// The caller must ensure that all input parameters are valid and properly initialized.
pub unsafe fn from_raw_parts(ptr: *const u8, len: usize) -> Self {
    // SAFETY: Caller guarantees ptr is valid and len is correct
    Self {
        data: std::slice::from_raw_parts(ptr, len),
    }
}
```

对于内联的 unsafe 块，在 unsafe 代码上方直接添加 `SAFETY:` 注释：

```rust
impl Send for MessageBus {
    fn send(&self) {
        // SAFETY: Message bus is not meant to be passed between threads
        unsafe {
            // unsafe operation here
        }
    }
}
```

## Python 绑定

通过 Cython 和 [PyO3](https://pyo3.rs) 提供 Python 绑定，使用户无需 Rust 工具链即可在 Python 中直接导入 NautilusTrader 的 crate。

### PyO3 命名约定

在通过 PyO3 向 Python 暴露 Rust 函数时：

1. Rust 符号在代码库内部应以 `py_*` 为前缀以明确其用途。
2. 使用 `#[pyo3(name = "…")]` 属性在 Python 层公开名称（不带 `py_` 前缀），以保持 Python API 的简洁。

```rust
#[pyo3(name = "do_something")]
pub fn py_do_something() -> PyResult<()> {
    // …
}
```

### 测试约定

- 使用 `mod tests` 作为标准测试模块名，除非需要特殊划分。
- 一致使用 `#[rstest]` 属性，降低认知开销。
- 不要在 Rust 测试中使用 Arrange、Act、Assert 分隔注释。

#### 测试组织

使用带节分隔符的一致测试模块结构：

```rust
////////////////////////////////////////////////////////////////////////////////
// Tests
////////////////////////////////////////////////////////////////////////////////

#[cfg(test)]
mod tests {
    use rstest::rstest;
    use super::*;
    use crate::identifiers::{Symbol, stubs::*};

    #[rstest]
    fn test_string_reprs(symbol_eth_perp: Symbol) {
        assert_eq!(symbol_eth_perp.as_str(), "ETH-PERP");
        assert_eq!(format!("{symbol_eth_perp}"), "ETH-PERP");
    }
}
```

#### 参数化测试

对参数化测试一致使用 `rstest`：

```rust
#[rstest]
#[case("AUDUSD", false)]
#[case("AUD/USD", false)]
#[case("CL.FUT", true)]
fn test_symbol_is_composite(#[case] input: &str, #[case] expected: bool) {
    let symbol = Symbol::new(input);
    assert_eq!(symbol.is_composite(), expected);
}
```

#### 测试命名

使用能说明场景的描述性测试名称：

```rust
fn test_sma_with_no_inputs()
fn test_sma_with_single_input()
fn test_symbol_is_composite()
```

## Rust 与 Python 内存管理

在处理 PyO3 绑定时，必须理解并避免 Rust 的 `Arc` 引用计数与 Python 垃圾回收器之间产生的引用环。
本节记录了在持有回调的结构体中处理 Python 对象的最佳实践。

### 引用环问题

**问题**：在持有回调的结构体中使用 `Arc<PyObject>` 会产生循环引用：

1. **Rust 的 `Arc` 持有 Python 对象** → 增加 Python 的引用计数。
2. **Python 对象可能引用 Rust 对象** → 形成循环。
3. **两端都无法被回收** → 导致内存泄漏。

**问题模式示例**：

```rust
// AVOID: This creates reference cycles
struct CallbackHolder {
    handler: Option<Arc<PyObject>>,  // ❌ Arc wrapper causes cycles
}
```

### 解决方案：基于 GIL 的克隆（GIL-based cloning）

**解决思路**：使用普通的 `PyObject` 并通过 `clone_py_object()` 在获取 GIL 的上下文中安全克隆：

```rust
use nautilus_core::python::clone_py_object;

// CORRECT: Use plain PyObject without Arc wrapper
struct CallbackHolder {
    handler: Option<PyObject>,  // ✅ No Arc wrapper
}

// Manual Clone implementation using clone_py_object
impl Clone for CallbackHolder {
    fn clone(&self) -> Self {
        Self {
            handler: self.handler.as_ref().map(clone_py_object),
        }
    }
}
```

### 最佳实践

#### 1. 使用 `clone_py_object()` 进行 Python 对象克隆

```rust
// When cloning Python callbacks
let cloned_callback = clone_py_object(&original_callback);

// In manual Clone implementations
self.py_handler.as_ref().map(clone_py_object)
```

#### 2. 从持有回调的结构体移除 `#[derive(Clone)]`

```rust
// BEFORE: Automatic derive causes issues with PyObject
#[derive(Clone)]  // ❌ Remove this
struct Config {
    handler: Option<PyObject>,
}

// AFTER: Manual implementation with proper cloning
struct Config {
    handler: Option<PyObject>,
}

impl Clone for Config {
    fn clone(&self) -> Self {
        Self {
            // Clone regular fields normally
            url: self.url.clone(),
            // Use clone_py_object for Python objects
            handler: self.handler.as_ref().map(clone_py_object),
        }
    }
}
```

#### 3. 更新函数签名以接受 `PyObject`

```rust
// BEFORE: Arc wrapper in function signatures
fn spawn_task(handler: Arc<PyObject>) { ... }  // ❌

// AFTER: Plain PyObject
fn spawn_task(handler: PyObject) { ... }  // ✅
```

#### 4. 创建 Python 回调时避免使用 `Arc::new()`

```rust
// BEFORE: Wrapping in Arc
let callback = Arc::new(py_function);  // ❌

// AFTER: Use directly
let callback = py_function;  // ✅
```

### 为什么这样可行

`clone_py_object()` 的实现要点：

- **在克隆操作前获取 Python GIL**。
- **使用 Python 的本地引用计数**（例如 `clone_ref()`）。
- **避免使用 Rust 的 Arc 包装**，从而不干扰 Python 的 GC。
- **通过正确的 GIL 管理保持线程安全**。

这种方法允许 Rust 与 Python 的垃圾回收机制协同工作，避免因引用环导致的内存泄漏。

## 常见反模式

1. **在热点路径使用 `.clone()`**——应优先考虑借用或通过 `Arc` 共享所有权。
2. **在生产代码中使用 `.unwrap()`**——通常应使用 `?` 传播错误或将其映射为领域错误，但对锁中毒（lock poisoning）进行 unwrap 是可接受的，因为这通常表明应当快速中止的严重程序状态。
3. **在能使用 `&str` 的地方使用 `String`**——在紧循环中尽量减少分配。
4. **暴露内部可变性（interior mutability）**——尽量通过安全 API 隐藏 `Mutex`/`RefCell`。
5. **在 `Result<T, E>` 中放入大型结构体**——对大型错误载荷使用 boxing（`Box<dyn Error + Send + Sync>`）。

## 不安全的 Rust（Unsafe Rust）

为了在 Cython 与 Rust 之间实现互操作，编写 `unsafe` Rust 代码是必要的。跳出安全 Rust 的边界使我们能实现许多 Rust 语言自身的底层特性，正如 C 和 C++ 用于实现它们自己的标准库一样。

在使用 Rust 的 `unsafe` 功能时务必非常谨慎——`unsafe` 只是启用一小部分额外的语言能力，它改变了接口与调用者之间的契约，将部分正确性保证的责任从编译器转移给我们。目标是在利用 `unsafe` 带来能力的同时，避免任何未定义行为（undefined behavior）。
关于 Rust 语言设计者对未定义行为的定义，请参见[语言参考](https://doc.rust-lang.org/stable/reference/behavior-considered-undefined.html)。

### 安全策略

为保持正确性，任何使用 `unsafe` 的代码都必须遵循我们的策略：

- 如果一个函数在调用上是 `unsafe` 的，文档中**必须**包含 `Safety` 小节，解释为何该函数为 `unsafe`，并说明调用者需要满足的各项不变式以及如何履行这些义务。
  并覆盖所有 `unsafe` 区块的单元测试。
- 在文档注释的 Safety 小节中说明为何函数为 `unsafe`，并为所有 `unsafe` 块提供单元测试覆盖。
- 始终包含 `SAFETY:` 注释说明为何该 unsafe 操作是有效的：

```rust
// SAFETY: Message bus is not meant to be passed between threads
#[allow(unsafe_code)]

unsafe impl Send for MessageBus {}
```

- **Crate 级 lint** ——每个导出 FFI 符号的 crate 都应启用
  `#![deny(unsafe_op_in_unsafe_fn)]`。即便位于 `unsafe fn` 内部，每次指针解除引用或其他危险操作也必须用独立的 `unsafe { … }` 包裹。

- **CVec 合约** ——对于跨 FFI 边界的原始向量，请阅读 [FFI Memory Contract](ffi.md)。外部代码会成为该分配的所有者，**必须**恰好调用一次对应的 `vec_drop_*` 函数。

## 工具链配置

项目使用若干工具来保证代码质量：

- **rustfmt**：自动代码格式化（参见 `rustfmt.toml`）。
- **clippy**：代码 lint 与最佳实践（参见 `clippy.toml`）。
- **cbindgen**：为 FFI 生成 C 头文件。

## 参考资料

- [The Rustonomicon](https://doc.rust-lang.org/nomicon/) – The Dark Arts of Unsafe Rust.
- [The Rust Reference – Unsafety](https://doc.rust-lang.org/stable/reference/unsafety.html).
- [Safe Bindings in Rust – Russell Johnston](https://www.abubalay.com/blog/2020/08/22/safe-bindings-in-rust).
- [Google – Rust and C interoperability](https://www.chromium.org/Home/chromium-security/memory-safety/rust-and-c-interoperability/).
