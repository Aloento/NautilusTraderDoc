# 编码规范

## 代码风格 {#code-style}

格式约定以代码库现状为参照，并辅以以下规则。

### 通用格式规则 {#universal-formatting-rules}

以下适用于**所有**源文件（Rust、Python、shell 等）：

- 只用**空格**，绝不用制表符。
- 行通常保持在 **100 字符**以内，必要时斟酌断行。
- 使用美式英语拼写（`color`、`serialize`、`behavior`），由 `.typos.toml` 强制执行。
  外部 API 的拼写通过精确的标识符例外保留。逐字数据与生成文件被排除。
  运行 `prek run typos --all-files` 检查整个仓库。

### Shell 脚本 {#shell-scripts}

仓库脚本默认使用 Bash。只有当调用方无法依赖系统装有 Bash 时，才用 POSIX `sh`。
脚本选型、扩展名、可移植性、结构、测试、格式化与 lint 要求见 [Shell](./shell.md)。

### 注释约定 {#comment-conventions}

1. 通常在每个注释块或文档字符串**上方留一个空行**，让它在视觉上与代码分开。
2. 用*句子式大写*——首字母大写，其余小写，专有名词或首字母缩略词除外。
3. 句号后不要加两个空格。
4. **单行注释**结尾*不得*加句号，以 URL 或行内 Markdown 链接结尾的除外；
   这类例外保留链接本身需要的标点。
5. **多行注释**各句之间用逗号分隔（不是每行一个句号），最后一行*应当*以句号结尾。
6. 注释保持简练。力求清晰，只解释不直观之处——*少即是多*。
7. 文本中避免使用 emoji 符号。

### 文档注释的语气 {#doc-comment-mood}

Rust 文档注释用**陈述语气**书写，例如 *"Returns a cached client."*。
这与 Rust 生态的主流风格一致，生成的文档对最终用户也更自然。

### 术语与措辞 {#terminology-and-phrasing}

1. **错误消息**：避免在错误消息里用 ", got"。按语境改用更有描述性的
   ", was"、", received" 或 ", found"。
   - Bad: `"Expected string, got {type(value)}"`
   - Good: `"Expected string, was {type(value)}"`

2. **拼写**：用 "hardcoded"（一个词），不用 "hard-coded" 或 "hard coded"——
   这是更现代、更被接受的拼法。

3. **错误变量命名**：捕获到的错误/异常用单字母 `e`：
   - Rust：`Err(e)` 而不是 `Err(err)` 或 `Err(error)`；闭包里用 `|e|` 而不是 `|err|`
   - Python：`except SomeError as e:` 而不是 `as err:` 或 `as error:`

### 命名约定 {#naming-conventions}

1. **内部字段**：私有/内部字段可以用缩写（如 `_price_prec`、`_size_prec`），
   让热路径代码保持简练。

2. **面向用户的 API**：公开属性、函数参数、返回类型以及指标名/标签使用完整的
   描述性名称（如 `price_precision`、`size_precision`）。这能防止缩写的术语
   泄漏到仪表盘或告警里。

3. **错误消息与日志**：用完整词以保证清晰（如 "price precision" 而不是
   "price prec"）。用户永远不该看到缩写的术语。

4. **执行相关术语**：在公开的、项目自有的 PascalCase 类型名中使用 `Execution`，
   例如 `BinanceExecutionClientConfig`。内部实现类型可以沿用已有的 `Exec` 名字。
   `Exec` 一词专用于 `ExecAlgorithmId` 与 `ExecTester` 家族、已有的 `exec_*` 名称，
   以及 `OkxExecType` 这类场所或协议术语。协议专属的线上模型按场所概念命名，
   例如 `HyperliquidExchangeAction`。保留既有的公开名称、历史发布条目，
   以及迁移表中的源名称。

5. **运行时限定词**：类型用于选择或配置实时运行语义时用 `Live`。
   例子：`LiveNode` 对应 `BacktestNode`，`LiveClock` 对应 `VirtualClock`。
   `LiveDataEngineConfig`、`LiveRiskEngineConfig`、`LiveExecutionEngineConfig`
   家族与可复用的核心引擎配置之间的差别与此相同。

   常规的适配器客户端族不加 `Live`，因为已连接的客户端就是默认形态。
   替代实现按其行为限定，例如 `SandboxExecutionClient` 或
   `DatabentoHistoricalClient`。显式的实时/历史协议对可以保留 `Live`
   以区分两种实现。

6. **适配器工厂配置**：数据与执行的输入分别命名为 `<Venue>DataClientConfig` 与
   `<Venue>ExecutionClientConfig`。工厂直接消费这些客户端配置，而不是通过单独的
   工厂配置包装。`LiveNodeConfig` 持有 `trader_id`。场所专属的 `account_id`
   取值属于执行客户端配置。

#### 数据加载 API {#data-loading-apis}

无状态的数据摄取用自由函数。只有当实例需要跨调用保留可复用的配置、缓存、
worker、迭代状态或打开的资源时，才用类。不要为了把静态方法或类方法归堆而
造一个零状态的类。

沿用 [Polars I/O API](https://docs.pola.rs/api/python/stable/reference/io.html)
的语义区分，并适配 Nautilus 已确立的 `load_*` 词汇：

- `load_<source>_<data>` 立即读取、归一并物化出完整结果。
- `scan_<source>_<data>` 创建惰性查询或延迟执行计划。
- `stream_<source>_<data>` 增量地产出记录或批次。
- `write_<format>` 立即写出内存中的结果。
- `sink_<format>` 经由惰性或流式执行路径写出。

摄取类命名按从一般到具体排序：动词、来源、逻辑数据，然后是可选的表示形式。
仅当确实存在并列的其他格式时才加入表示形式。例如，
`load_binance_order_book_deltas` 优于无状态的 `BinanceOrderBookDeltaDataLoader.load`
类，也优于笼统的 `load_binance_data` 函数。

#### 适配器包门面 {#adapter-package-facades}

`python/nautilus_trader/adapters/` 下的每个包都是私有 `_libnautilus` 扩展之上的
薄门面。每个适配器的 `__init__.py` 声明一个确定性的 `__all__`，作为其公开 API 的
唯一事实来源。`python/generate_stubs.py` 把该列表照抄进对应的 `.pyi`，
因此运行时导出与存根导出完全一致。

场所适配器暴露其规范身份常量，以及受支持的公开面：

- `<VENUE>`、`<VENUE>_CLIENT_ID`、`<VENUE>_VENUE`，由适配器的 `python/mod.rs`
  经 `m.add` 从 Rust 注册
- 数据类型、`*Config`、`*Factory`、面向用户的枚举（如 `*Environment` 与 `*ProductType`）
- 无状态加载器（`load_*`、`stream_*`、`convert_*`）以及有意保留的工具函数
  （`decode_*`、`get_*_arrow_schema_map`）

门面要保持薄。不要仅仅为了结构上的对称就把内部件塞进 `__all__`，
包括原始 HTTP 或 WebSocket 客户端、线上模型、端点 URL 解析器
（`get_*_url`、`*_HTTP_URL`）与缓存。下列包省略场所常量，因为常量对它们没有意义：

- 数据提供者，如 `databento` 与 `tardis`。
- `blockchain` 数据客户端。
- `sandbox` 执行客户端。
- 多场所的 `interactive_brokers` 券商。

`__all__` 条目的排列要让 `RUF022` 预提交门禁负责排序，不要手工排列。

### 格式化 {#formatting}

1. 较长的代码行以及参数超过两三个的调用，推荐的布局是使用下一个逻辑缩进层级：
   从该缩进处起新行，而不是从起始括号做悬垂的"装饰性"对齐。这样右侧更省空间，
   重要代码也更居中；而且函数或方法名改动后布局依然成立。

2. 收尾的右括号另起一行，对齐到逻辑缩进处。

3. 多个悬垂的参数或实参以行尾逗号结尾：

```python
long_method_with_many_params(
    some_arg1,
    some_arg2,
    some_arg3,  # <-- trailing comma
)
```

## 提交消息 {#commit-messages}

提交消息用大写开头、祈使语气的主题行点明受影响的界面，后面可选地跟一段
解释改动的正文。

### 主题行 {#subject-line}

- 以大写的祈使动词开头，让主题描述这个提交被应用时*做了什么*。
  历史记录中绝大多数用 `Add`、`Fix`、`Improve`、`Refine`、`Update`、`Remove`、
  `Refactor`、`Standardize`。
- 点明受影响的界面（crate、适配器、子系统或类型），保持日志可快速扫读。
- 主题不少于 10 个字符，以便清楚点明受影响的界面。
- 争取控制在 60 个字符以内，便于 GitHub 清晰渲染、文字也更简练。
  超出这一目标时，提交消息钩子只警告不失败；项目计划将来强制执行该限制。
- 主题结尾不加句号。
- 不在主题里写 issue 或 pull request 编号。GitHub 在 squash 合并时自动追加
  PR 编号，其他引用都应放在正文里。主题任何位置出现 `#<number>`，
  提交消息钩子都会拒绝。

```text
Add Decimal constructors to Instrument trait
Fix non-atomic order event application
Refine cross-platform wheel validation
Remove stale security audit exceptions
```

避免下面这些写法：

```text
feat(bybit): add due_post_only flag        # Conventional Commits type and scope
fix: bug                                   # lowercase, unspecific, too short
Fixed the Bybit post-only rejection flag.  # past tense, trailing period
Update stuff                               # says nothing about the surface
Fix the post-only flag (#4544)             # pull request number added by hand
Fix PR #4544 review feedback               # issue or pull request number in the subject
```

### Conventional Commits {#conventional-commits}

提交消息与 pull request 标题*不要*使用
[Conventional Commits](https://www.conventionalcommits.org/) 语法。
许多编辑器和 AI 助手默认输出该格式，但本仓库的历史提交没有一条使用它。
type 与 scope 重复了主题已经给出的信息。PR 标题在这里同样重要，
因为 squash 合并会把 PR 标题变成提交主题。

### 正文 {#body}

正文是可选的，但凡超出微不足道的改动，正文应说明改动*为什么*要做，
而不是复述 diff。

- 正文与主题之间空一行。
- 正文每行不超过 79 个字符，与 PEP 8 和传统 Git 工具保持一致。
- 用散文段落或要点，视改动选择。要点可以沿用主题那样的祈使语气，
  不必以句号结尾。
- 有助于未来读者理解的地方，附上信息性的超链接。

### Issue 引用 {#issue-references}

- 从正文引用 issue，通常放在最后一行：提交会关闭该 issue 时写 `Resolves #4534`，
  只是部分工作时写 `Related to #4547`。
- GitHub 在 squash 合并时把 PR 编号追加到主题之后，形成类似
  `Fix TWAP child-order sizing and interval validation (#4544)` 的主题。
  不要手工加这个后缀，也不要在主题的其他位置引用 PR 或 issue。
  主题装不下正文更擅长承载的细节，手写编号会与追加的编号重复或冲突。
- PR 标题尽量短，让追加后缀之后 squash 合并出的主题仍在 60 个字符以内。
