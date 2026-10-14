# Markdown 风格 {#markdown-style}

Standard revision: 1

本文档为采用其本地副本的仓库定义统一的 Markdown 基线。各副本须与维护源逐字节一致；
仓库专属的补充内容写进单独的本指南。

## 要求级别 {#requirement-levels}

每条规则属于三个级别之一：

- **Required：** 适用于范围内每个文件。以无限定祈使句表述（如 "Use"、"Do not"）
  或含 "must" 的规则都是 Required。
- **Preferred：** 当存在多个合法写法时指明默认选择。Preferred 规则用 "Prefer"
  表述，不影响一致性判定。
- **Transitional：** 在指明的构造被新增或大幅修改时适用，并标注 **Transitional**
  或被描述为过渡性。既有实例可保留到单独的迁移。

含 "may" 或 "allowed" 的陈述授予的是有边界的许可，而非义务。任何限制该许可的条件
都是 Required。当仓库的渲染器、生成内容或引入材料确有需要时，仓库可以记录
更窄的本地例外。

## 语言与扩展 {#language-and-extensions}

- 以 [CommonMark](https://spec.commonmark.org/current/) 为基础规范。
- 表格、任务列表、删除线与自动链接使用
  [GitHub Flavored Markdown](https://github.github.com/gfm/)。
- 仅在仓库已记录并支持时，才使用额外的 front matter、Markdown 扩展或渲染器组件。
- 不要引入依赖未记录渲染器扩展的语法。

所链接的规范是参考资料，不是常规前置读物。只有当本地指南、上下文内容与
markdownlint 都解答不了某个具体的解析或渲染歧义时，才去查阅它们。

## 强制执行 {#enforcement}

- 遵循仓库的 `.markdownlint.jsonc` 或等价的本地配置。
- 把本标准视为目标风格，把 markdownlint 视为其机械子集的自动执行手段。
- 本标准与本地配置出现未记录的冲突时，按待解决的漂移处理，而不是当作隐含例外。
- 确保仓库 lint 范围内所有手写的 Markdown 通过其配置的 Markdown 检查。
- 不要手工编辑生成的 Markdown。改它的源，然后运行生成器。

生成的文件、引入的第三方文档与渲染器测试数据可以使用已记录的仓库级豁免。

## 标题 {#headings}

- 使用 ATX 标题（`#`、`##`、`###` 等）。
- 第一个 Markdown 标题是唯一的一个 H1。
- H1 用标题式大写（title case）。
- H2 及以下用句子式大写（sentence case）。
- 保持层级合逻辑，不跳级。
- 每个标题上下各留一个空行。

## 段落与换行 {#paragraphs-and-wrapping}

- 段落之间用一个空行分隔。
- 不要出现连续空行。
- 散文的行宽目标 Prefer 100-120 字符。
- Prefer 自然的断点与较长的行，而不是把一三个词甩到下一行。
- 代码块、表格与很长的链接目标必要时可超出该目标。

## 列表 {#lists}

- 无序列表项用 `-`。
- 仅在顺序有意义时使用有序列表。
- **Transitional：** 有序列表中每个源条目都写 `1.`，由渲染器提供显示编号。
- 列表缩进与间距与本地 markdownlint 配置保持一致。
- 列表上下各留一个空行。

示例：

```markdown
- First item
- Second item

1. First step
1. Second step
```

## 提示块 {#admonitions}

- 只使用仓库已记录并能渲染的提示块语法。
- 仓库已记录并渲染 GitHub alert、且没有更严格的本地语法时，使用 GitHub 引用块
  alert 形式，类型取 `NOTE`、`TIP`、`IMPORTANT`、`WARNING`、`CAUTION` 之一。
- 该扩展不支持或支持情况未确认时，使用可移植的引用块加粗体文字标签。
- 多段提示块中，每个内容行与空白的续行都要以 `>` 开头。裸露的空行会结束提示块。
- 类型标签要同时保留在源文件与渲染输出中。不要只靠颜色或图标传达含义。
- 小范围编辑时保留既有且受支持的提示块语法，不要仅仅为了强加这个回退形式而转换它。

GitHub alert：

```markdown
> [!WARNING]
> Back up the database before running the migration.
```

可移植回退：

```markdown
> **Warning:** Back up the database before running the migration.
```

## 表格 {#tables}

- 表格内容使用 GFM 管道表格。
- 带上首尾管道符。
- 管道符纵向对齐。
- 每列填充到最宽单元格加左右各一个空格，这与 Prettier 的默认表格输出一致。
  MD060 只检查管道是否对齐，不看单元格内容，因此它也会接受远比内容宽的列。
- 分隔行的单元格要留空格填充（`| ----- |`，而不是 `|-----|`）；MD060 同样不检查这点。
- `normalize markdown table padding` 预提交钩子会把表格重写为这种形式，
  无需手工数字符。
- 视情况 Prefer 文本列左对齐、数字列右对齐。
- 分隔行的写法要与预期的渲染对齐方式一致。
- 除非 Markdown 无法表达所需结构，或仓库已记录该需要，否则避免 HTML 表格。

示例：

```markdown
| Name  | Value |
| ----- | ----: |
| Alpha |    42 |
| Beta  |    17 |
```

## 代码 {#code}

- 用反引号围栏代码块，不用缩进式代码块。
- **Transitional：** 每个起始围栏都指明语言。纯文本或没有更具体语法的输出用
  `text`。
- 文档中要展示围栏 Markdown 时，外层用更长的围栏。
- 命令、文件名、函数、类型、环境变量、配置键与标识符使用行内代码。

示例：

````markdown
```rust
fn main() {
    println!("Hello");
}
```
````

Run `cargo test` and edit `.markdownlint.jsonc`.

## 强调 {#emphasis}

- 一般强调用 `*italic*`。
- 强强调用 `**bold**`。
- 避免不增加含义的强调。

## 分隔线 {#thematic-breaks}

用三个连字符：

```markdown
---
```

## 链接与图片 {#links-and-images}

- 链接文字要有描述性。
- Prefer 内联链接；同一目标在文档中出现多次时 Prefer 引用式链接。
- 避免裸露的 URL。
- 仓库渲染器支持时，内部链接保持相对路径。
- 图片要给出有意义的替代文字。仅对刻意作装饰的图片使用空的替代文字。

## HTML {#html}

- Prefer 可移植的 Markdown 语法，而非原始 HTML。
- 仅当 Markdown 无法表达所需结果，或仓库已记录该元素或组件时才使用原始 HTML。
- 编辑周边内容时，保留受支持的 front matter、MDX 组件、围栏属性及其他仓库扩展。

## 文件 {#files}

- 使用 UTF-8 编码。
- 使用 LF 行尾。
- 每个文件以一个换行符结尾。
- 不留行尾空白，也不用行尾空格制造 Markdown 硬换行。

## 编辑指引 {#editing-guidance}

创建或修改 Markdown 时：

- 小范围编辑时保留周边风格，按 markdownlint 处理；除非两者都留下具体的疑问未解，
  否则不必通读整份指南。
- 创建或大幅重组文档之前，只查阅仓库本地 Markdown 指南的相关小节。
- 除非任务要求改动，否则保留既有文档结构。
- 格式与周边内容及受支持的渲染器扩展保持一致。
- 不要重排无关小节。
- 有仓库专用的 Markdown 检查时就运行它。

## 过渡性采用 {#transitional-adoption}

ATX 标题由 `MD003` 强制执行。有序列表重复写 `1.`、起始代码围栏标明语言，
这两条是过渡性规则；在既有文档完成单独的机械迁移之前，`MD029` 与 `MD040`
保持禁用。不要仅仅为了迁移这些既有构造而扩大一个小范围的文档改动。
