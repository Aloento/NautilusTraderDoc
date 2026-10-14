# Python

[Python](https://www.python.org/) 承载了 NautilusTrader 大部分面向用户的代码。
其库与框架生态支撑着策略开发、数据分析与系统集成。

## 代码风格 {#code-style}

### PEP-8 {#pep-8}

代码库总体遵循 PEP-8，但检查非集合类型的值是否为 `None` 时，并不总是使用 truthiness。

[Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
不鼓励在函数或方法可能收到意外对象时用 truthiness 判 `None`。
这种写法可能产生非预期结果，导致逻辑错误：

*"Always use if foo is None: (or is not None) to check for a None value. E.g., when testing whether a variable or argument that defaults to None was set to some other value. The other value might be a value that's false in a boolean context!"*

:::note
判空集合用 truthiness（例如 `if not my_list:`），不要与 `None` 或空值显式比较。
:::

代码库中若无明显理由偏离 PEP-8，欢迎指出。

### 类型注解 {#type-hints}

所有函数与方法签名*必须*带类型注解：

```python
def __init__(self, config: EMACrossConfig) -> None:
def on_bar(self, bar: Bar) -> None:
def on_save(self) -> dict[str, bytes]:
def on_load(self, state: dict[str, bytes]) -> None:
```

**联合类型语法**：可选类型使用 PEP 604 的联合语法：

```python
# Preferred
def get_instrument(self, id: InstrumentId) -> Instrument | None:

# Avoid
def get_instrument(self, id: InstrumentId) -> Optional[Instrument]:
```

**泛型类型**：可复用的函数与类使用 Python 3.12 的类型参数语法：

```python
def first[T](values: list[T]) -> T:
    return values[0]
```

### 文档字符串 {#docstrings}

一致地遵循 [NumPy docstring spec](https://numpydoc.readthedocs.io/en/latest/format.html)，
文档才能正确构建。

Python 文档字符串用**祈使语气**书写，例如 *"Return a cached client."*。
这与 Python 生态的主流风格一致，生成的文档对最终用户也更自然。

#### 私有方法 {#private-methods}

不要给私有方法（以 `_` 为前缀）加文档字符串。文档字符串会生成公开的 API 文档，
让人误以为这些实现细节属于面向最终用户的公开 API。

可以加文档字符串的例外：

- 逻辑非平凡、步骤繁多或存在重要边界情况的复杂方法。
- 因复杂而需要详述参数或返回值的方法。

私有方法确需补充上下文（例如棘手的先决条件或副作用）时，优先用简短的行内注释
（`#`），放在相关逻辑附近，而不是写文档字符串。

### 属性还是方法（PyO3 绑定） {#properties-vs-methods-pyo3-bindings}

通过 PyO3 把 Rust 类型暴露给 Python 时，要在 `#[getter]`（属性）与普通方法之间
做选择。判断依据是调用点传达的语义，而不是值会不会变：

- **属性（`#[getter]`）**：廉价、无副作用、像属性一样反映当前状态。
  标量字段、谓词与轻量派生值都归此类，即便它们在对象生命周期内会变化。
  例：`status`、`side`、`quantity`、`price`、`is_open`、`has_inputs`、
  `realized_pnl`、`venue_order_id`。
- **方法（不用 `#[getter]`）**：动作、变更、非平凡计算、分配/复制、I/O，
  或任何带参数的操作。
  例：`apply(fill)`、`unrealized_pnl(price)`、`calculate_pnl(...)`。
- **灰色地带（倾向方法）**：每次调用都克隆或分配集合的 getter。
  用方法向调用方提示这份开销。
  例：`events()`、`adjustments()`、`client_order_ids()`、`trade_ids()`。

## Python 实时回调路由 {#python-live-callback-routing}

Python 实时节点保持一条运行时不变式：实时交易期间，Tokio worker 线程不执行
Python 代码。

`LiveNode::py_run` 在 Rust 异步运行时工作期间释放 GIL。worker 侧必须触发 Python
的工作，走现有的 live runner 事件通道，而不是在 worker 上调用 `Python::attach`。
定时器回调使用时间事件通道。runner 在启动缓冲阶段与主 select 循环中排空该通道，
随后在 live 事件循环线程上执行回调。

这条路径处理的是无法避免的用户 Python 回调。不要为了用它而把适配器、提供者、
数据或执行逻辑挪到 Python 里。Python 适配器模块的职责是配置 Rust 适配器并注册
工厂，适配器操作由 Rust 掌控。

worker 侧的 Rust 工作确需 Python 回调时，经由某个具体的 live runner 事件类型路由。

编写需要感知 Python 的实时代码时：

- 优先使用现有的 runner 事件通道。
- 回调体保持简短，因为它们同步运行在 live 事件循环上。
- Python 实时交易中，不要从 Tokio worker 任务调用 `Python::attach`。
- 不要为了迁就回调路由而在 Python 里添加适配器业务逻辑。

### 测试命名 {#test-naming}

用能说明场景的描述性名字。测试保持为带注解的 pytest 自由函数：

```python
def test_write_and_query_option_greeks_round_trip() -> None: ...


def test_catalog_loaded_greeks_reach_on_option_greeks() -> None: ...


def test_streaming_feather_writer_rejects_unregistered_custom_data() -> None: ...
```

### Ruff {#ruff}

代码库用 [Ruff](https://astral.sh/ruff) 做 lint。规则配置在
`python/pyproject.toml`，ignore 的理由通常写在注释里。
