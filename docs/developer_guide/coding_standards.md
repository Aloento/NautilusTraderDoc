# 编码规范

## 代码风格

当前代码库本身可作为格式约定的参考。下面补充了一些额外的指南。

### 通用格式规则

下列规范适用于**所有**源文件（包括 Rust、Python、Cython、shell 等）：

- 仅使用 **空格**，禁止使用制表符（tab）。
- 行长度通常应保持在 **100 字符以下**；必要时请合理换行。
- 优先使用美式英语拼写（例如 `color`、`serialize`、`behavior`）。

### 注释约定

1. 通常在每个注释块或 docstring 之前保留 **一行空行**，以便在视觉上与代码分隔。
2. 使用 _句子式大小写_（sentence case）——首字母大写，其余保持小写，专有名词或缩略词除外。
3. 句号后不要使用双空格。
4. **单行注释** 不应以句号结尾，**除非**该行以 URL 或内联 Markdown 链接结束——这类情况下按链接要求保留原有标点。
5. **多行注释** 中句子之间使用逗号分隔（而非每行以句号结尾）。多行注释的最后一行应以句号结束。
6. 注释请简明扼要；优先考虑清晰度，只解释不明显的内容——_越简洁越好_。
7. 避免在文本中使用表情符号（emoji）。

### 文档注释 / docstring 的语气

- **Python** 的 docstring 应采用 **祈使语气（imperative mood）**，例如：_"Return a cached client."_（返回一个已缓存的客户端。）
- **Rust** 的文档注释应采用 **陈述语气（indicative mood）**，例如：_"Returns a cached client."_（返回一个已缓存的客户端。）

这些约定与各语言生态的主流风格保持一致，能让生成的文档对最终用户更自然友好。

### 术语与措辞

1. **错误信息**：避免在错误信息中使用 ", got"。可根据上下文使用更清晰的替代词，如 ", was"、", received" 或 ", found"。

   - ❌ `"Expected string, got {type(value)}"`
   - ✅ `"Expected string, was {type(value)}"`

2. **拼写**：使用单词 "hardcoded"（连写），而不是 "hard-coded" 或 "hard coded" —— 这是更现代且被更广泛接受的写法。

### 代码格式化细则

1. 当代码行较长或传入参数较多时，应换行并对齐到下一个逻辑缩进层级（而非尝试将参数按开括号进行“视觉对齐”）。这种做法能节省右侧空间，使重要代码更居中显示，并且对函数/方法名变更更具鲁棒性。

2. 关闭括号应置于新行，并与逻辑缩进对齐。

3. 确保多行挂起的参数或参数列表以尾随逗号结束：

```python
long_method_with_many_params(
    some_arg1,
    some_arg2,
    some_arg3,  # <-- trailing comma
)
```

### PEP-8

代码库总体遵循 PEP-8 风格指南。即便在 Cython 部分利用了 C 类型，我们仍尽量保持 Python 的惯用写法。
一个显著的例外是：在除集合类型之外的场景中，我们并不总是使用 Python 的 truthiness（真值）来判断参数是否为 `None`。

这有两个原因：

1. Cython 在遇到 `is None` 和 `is not None` 时，可以生成更高效的 C 代码，而无需进入 Python 运行时去检查 `PyObject` 的真值性。

2. 根据 [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html) 的建议——当函数或方法可能接收意外类型而导致布尔求值出现异常时，不建议用 truthiness 来判断变量是否为 `None`，因为这可能引入逻辑错误。

> 始终使用 `if foo is None:`（或 `is not None`）来检查 None 值。例如，当判断一个默认值为 None 的变量或参数是否被设置为其他值时，其他值可能在布尔上下文中被判定为 False。

在非性能关键的代码路径中，出于可读性考虑，`if foo is None:` 与 `if not foo:` 的使用仍然是可以接受的。

:::note
对于空集合（例如 `if not my_list:`），应使用 truthiness 检查，而不是显式与 `None` 或空值比较。
:::

我们欢迎对任何在无明显理由下偏离 PEP-8 的地方提供反馈。

## Python 风格指南

### 类型注解（Type hints）

所有函数和方法签名**必须**包含完整的类型注解：

```python
def __init__(self, config: EMACrossConfig) -> None:
def on_bar(self, bar: Bar) -> None:
def on_save(self) -> dict[str, bytes]:
def on_load(self, state: dict[str, bytes]) -> None:
```

**泛型类型（Generic Types）**：对可重用组件使用 `TypeVar`

```python
T = TypeVar("T")
class ThrottledEnqueuer(Generic[T]):
```

### Docstrings

代码库统一采用 [NumPy docstring 规范](https://numpydoc.readthedocs.io/en/latest/format.html)。
必须一致遵守该规范以确保文档能正确构建。

**测试方法命名**：使用描述性名称说明测试场景：

```python
def test_currency_with_negative_precision_raises_overflow_error(self):
def test_sma_with_no_inputs_returns_zero_count(self):
def test_sma_with_single_input_returns_expected_value(self):
```

### Ruff

[ruff](https://astral.sh/ruff) 用于对代码库进行静态检查（lint）。Ruff 的规则位于顶层的 `pyproject.toml` 中，针对被忽略的规则通常会在注释中给出理由。

### 提交信息（Commit messages）

以下为提交信息风格的建议：

1. 提交主题（subject）应限制在 60 字符以内，首字母大写且不以句号结尾。

2. 使用祈使句（imperative voice），即描述应用该提交后将会做什么。

3. 可选：在正文中说明变更，正文与主题之间空一行。正文保持在每行 100 字符以内，可使用带或不带句号的项目符号。

4. 可选：在提交信息中提供相关 issue 或 ticket 的 # 引用。

5. 可选：提供任何有用的链接。
