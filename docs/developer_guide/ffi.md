# FFI 内存契约

NautilusTrader 只从 `nautilus-core` 与 `nautilus-model` 暴露 C 外部函数接口（FFI）。
两个 crate 都用各自的 `ffi` Cargo feature 门控该接口，导出模块分别位于
`crates/core/src/ffi/` 与 `crates/model/src/ffi/`。

其他 workspace crate 使用 Rust API 或 PyO3 绑定。独立的 `nautilus-plugin` crate
定义公开的 guest 插件 ABI，不共用本内存契约。

下面的规则是强制性的。违反会导致未定义行为，包括重复释放、内存泄漏与非法指针访问。

## Panic 处理 {#panic-handling}

Rust panic 绝不允许跨 `extern "C"` 函数展开。可能 panic 的导出函数，其实现必须
经 `nautilus_core::ffi::abort_on_panic` 转接：它记录 panic 并在展开越过 C 边界前
终止进程。

## `CVec` 所有权 {#cvec-ownership}

`CVec` 以 C 兼容形式表示 Rust 向量分配的元数据。由 `Vec<T>` 创建的 `CVec`
把该分配的唯一所有权转移给外部调用方。在 Rust 侧它有意既不实现 `Copy` 也不实现
`Clone`，但 C 仍能复制它的字段，因此调用方必须自行执行同样的"恰好一次"所有权规则。

| 步骤 | 持有方   | 动作                                                                                        |
| ---- | ------- | --------------------------------------------------------------------------------------------- |
| 1    | Rust    | 把 `Vec<T>` 转换为 `CVec`，将分配转移给调用方。                      |
| 2    | Foreign | 读取元素，不改动 `ptr`、`len` 或 `cap`。                                    |
| 3    | Foreign | 恰好调用一次匹配类型的 `vec_drop_*` 函数，释放该分配。 |

漏掉 drop 会泄漏分配；同一分配释放多次会破坏分配器并导致进程崩溃。

空的 `CVec` 满足 `len == 0` 且 `cap == 0`，其指针是不透明的哨兵值，不得解引用。
Rust 消费方必须使用 `CVec::into_vec`，它在检查指针之前先处理空的情况；
借用的消费方出于同样原因必须使用 `CVec::as_slice`。

这两个方法都是 unsafe 的，因为公开的元数据无法证明分配的来源、对齐、初始化状态
或独占所有权。任何接受调用方提供 `CVec` 并调用这两个方法之一的导出函数必须：

- 声明为 `unsafe extern "C" fn`。
- 在 `# Safety` 小节写明调用方义务。
- 在重建或借用数据之前校验 `len`、`cap` 与空指针不变式。
- 使用与原 `Vec<T>` 分配一致的具体元素类型。

## 按类型的 drop 函数 {#type-specific-drop-functions}

没有通用的 `cvec_drop`。把所有分配都按 `Vec<u8>` 重建，会让分配器拿到与其他类型
不符的元素布局。每个跨边界的 owned 向量都需要一个针对其精确元素类型的 drop 函数，
例如 `vec_drop_book_levels`、`vec_drop_book_orders` 或 `vec_drop_fills`。

drop 函数应加在生产者旁边，便于评审时一并核对这对函数。测试必须覆盖空哨兵值，
以及消费方实现的所有元数据检查。

## 借用外部缓冲区 {#borrowed-foreign-buffers}

Rust 之外分配的内存不得按 `Vec<T>` 重建。用 `CVec::as_slice` 借用，
Rust 需要 owned 存储时用 `to_vec()` 复制。所有权仍归外部调用方，
原始缓冲区必须由创建它的分配器释放。

## 不透明指针 {#opaque-pointers}

布局不是 `repr(C)` 的模型对象，以不透明 owned 指针的形式跨越 ABI。
生成的头文件对该类型前向声明，外部调用方只能通过导出函数操作它：

- 构造函数返回由 `Box::into_raw` 得到的 owned `*mut T`。
- 纯访问器接受 `&T` 或 `&mut T` 引用。
- 每个构造函数都必须有配套的 drop 函数。

例如：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn orderbook_new(id: InstrumentId, book_type: BookType) -> *mut OrderBook {
    Box::into_raw(Box::new(OrderBook::new(id, book_type)))
}

/// # Safety
///
/// `book` must be a live owning pointer returned by [`orderbook_new`], and must not
/// be used after this call.
///
/// # Panics
///
/// Panics if `book` is null.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn orderbook_drop(book: *mut OrderBook) {
    abort_on_panic(|| {
        assert!(!book.is_null(), "`book` was NULL");
        // SAFETY: Caller guarantees `book` was allocated by `orderbook_new`
        drop(unsafe { Box::from_raw(book) });
    });
}
```

外部持有者必须恰好调用一次 drop 函数，不得复制该指针、不得消费两份副本，
也不得在 drop 之后继续使用该指针。

## 评审清单 {#review-checklist}

每个新增或修改的 FFI 导出，逐条核对：

- 实现留在 `nautilus-core` 或 `nautilus-model` 中。
- 布局跨边界的每个类型都使用 `repr(C)`。
- 阻止 panic 跨边界展开。
- 每个 owned 分配配一条按类型的释放路径。
- 在 `# Safety` 文档中写明完整的指针与所有权义务。
- 为所有权与校验规则补充针对性测试。
