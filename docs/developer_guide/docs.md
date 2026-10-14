# 文档风格

本指南说明 NautilusTrader 文档的风格与写作实践。

[Markdown 风格](./markdown_style.md)指南是 Markdown 语法与格式的共同基线，
`.markdownlint.jsonc` 强制执行其中的机械子集。本指南只讲 NautilusTrader 文档特有的
部分，不重复那份基线。

## 总体原则 {#general-principles}

- Prefer 简单的结构与简洁易读的散文。
- 使用一致的约定、风格与模式。
- 面向技术背景各异的读者写作。

## 文档类型 {#documentation-types}

多数页面应归入四种类型之一
（[Divio documentation system](https://docs.divio.com/documentation-system/)）。
单页混杂多种类型会让阅读与维护都更困难。

| 类型             | 目的                         | 所在目录          |
| ---------------- | ------------------------------- | ---------------- |
| **Tutorial**     | 带读者走一遍任务来教学 | `tutorials/`     |
| **How-to guide** | 解决一个具体问题        | `how_to/`        |
| **Explanation**  | 讲清设计与架构 | `concepts/`      |
| **Reference**    | 描述机制本身          | `api_reference/` |

两个目录是例外：

- `getting_started/` 把教学式的走查与安装步骤结合，用于上手引导。
- `integrations/` 的页面把 reference（能力、符号规则）与 how-to 内容（安装、
  配置）结合，因此每个场所页面自成一体。

非场所专属的独立 how-to 内容归 `how_to/`。

### 选对类型 {#choosing-the-right-type}

- **页面是否带着新手的读者走完一段学习过程？** Tutorial。
- **是否在回答已经熟悉系统的读者的"我该怎么做……"？** How-to guide。
- **是否在解释某事物为何这样运作？** Explanation。
- **是否在罗列类、配置字段、枚举或能力？** Reference。

Tutorial 说"做这个，然后这个，再然后这个"，路径由作者选定。
How-to guide 说"这是达成 X 的方法"，读者本就知道自己要的是 X。
两者要分清：

- Tutorial 不应假设先验知识。
- How-to guide 不应讲授背景概念。

一种类型需要引用另一种时，用链接而不是内联展开。例如配置
`LiveNodeConfig` 的 how-to guide，应链接到 API reference 的字段定义，
而不是把它们再列一遍。

## 语言与语气 {#language-and-tone}

- 尽量用主动语态（"Configure the adapter" 而不是 "The adapter should be configured"）。
- 描述现有功能用现在时。
- 只有规划中的特性用将来时。
- 避免不必要的术语，技术词首次出现时给出定义。
- 直接、简练。避免 "basically"、"simply"、"just" 这类填充词。
- 列表使用平行结构，各项的语法模式保持一致。

## Markdown 表格 {#markdown-tables}

表格语法、管道对齐与分隔行填充遵循
[Markdown 风格](./markdown_style.md#tables)指南。

### 注记与说明 {#notes-and-descriptions}

- 所有注记与说明都以句号结尾。
- 注记保持简练，同时信息完整。
- 用句子式大写（只大写首字母与专有名词）。

### 示例 {#example}

```markdown
| Order Type             | Spot | Margin | USDT Futures | Coin Futures | Notes                   |
| ---------------------- | ---- | ------ | ------------ | ------------ | ----------------------- |
| `MARKET`               | ✓    | ✓      | ✓            | ✓            |                         |
| `STOP_MARKET`          | -    | ✓      | ✓            | ✓            | Not supported for Spot. |
| `MARKET_IF_TOUCHED`    | -    | -      | ✓            | ✓            | Futures only.           |
```

### 支持标记 {#support-indicators}

- 已支持的特性用 `✓`。
- 不支持的特性用 `-`（不用 `✗` 或其他符号）。
- 为不支持的特性加注记时，用斜体强调：`*Not supported*`。
- 原因重要时把不支持的注记写具体：场所欠缺用 `*Not supported by <venue>*`，
  适配器欠缺用 `*Not currently implemented*`。
- 不需要内容的单元格留空。

## 代码引用 {#code-references}

行内代码与围栏代码块遵循 [Markdown 风格](./markdown_style.md#code)指南。

引用代码位置时，用 `file_path::function_name` 或 `file_path::ClassName`，
而不是会随代码改动而过期的行号。

## 标题 {#headings}

标题风格、大小写与层级遵循 [Markdown 风格](./markdown_style.md#headings)指南：
页面标题用标题式大写，其下用句子式大写。

NautilusTrader 对 `index.md` 页面有一处例外：指代具体文档的标题与导航链接，
使用目标文档 H1 的确切标题，包括其大小写。通用小节标题仍用句子式大写。

专有名词（产品名、技术名、公司名、首字母缩略词）无论处于哪级标题都要大写。

## 列表 {#lists}

列表标记、顺序与缩进遵循 [Markdown 风格](./markdown_style.md#lists)指南。

列表项是完整句子时以句号结尾。

## 链接与引用 {#links-and-references}

链接文字、链接样式与图片遵循
[Markdown 风格](./markdown_style.md#links-and-images)指南。

适时引用外部文档。

## 技术术语 {#technical-terminology}

- 能力矩阵以 Nautilus 领域模型为基础，不用交易所专属术语。
- 确有必要澄清时，在括号或注记中提及交易所专属术语。
- 全套文档使用一致的术语。

## 示例与代码片段 {#examples-and-code-samples}

- 提供实际可用的示例。
- 包含必要的 import 与上下文。
- 使用真实的变量名与取值。
- 为示例中不直观的部分加注释。

## 提示块 {#admonitions}

用提示块突出重要信息：

| 提示块   | 目的                                                       |
| ------------ | ------------------------------------------------------------- |
| `:::note`    | 补充性的上下文，有助理解但非必需。    |
| `:::info`    | 读者应当了解的重要信息。          |
| `:::tip`     | 有用的建议或最佳实践。                        |
| `:::warning` | 潜在的坑或重要的告诫事项。                      |
| `:::danger`  | 可能导致数据丢失或系统故障的严重问题。 |

不要滥用提示块，太多会削弱其作用。

## MDX 组件 {#mdx-components}

文档站点（fumadocs）提供内置的 MDX 组件，所有 `.md` 文件都可直接使用，
无需 import。

### Tabs {#tabs}

按语言或变体组织内容时用 tabs。Rust 列在 Python 之前，让 Rust 成为默认
（最左）的标签页。

代码示例在连续的围栏代码块上加 `tab="..."`：

```markdown
\`\`\`rust tab="Rust"
let params = Params::from([("close_position", true.into())]);
\`\`\`

\`\`\`python tab="Python"
strategy.submit_order(order, params={"close_position": True})
\`\`\`
```

表格或其他内容则把每个变体包进 `<Tabs>` 与 `<Tab>`。工具 Fields 表格就是这样，
每种语言只显示一列类型，而不是 Rust 与 Python 两列并排。内层内容上下各留一个空行，
Markdown 才能正常渲染。

```markdown
<Tabs items={["Rust", "Python"]}>
<Tab value="Rust">

| Field           | Type           | Required/default | Notes                   |
| --------------- | -------------- | ---------------- | ----------------------- |
| `instrument_id` | `InstrumentId` | Required         | Stored as `id` in Rust. |

</Tab>
<Tab value="Python">

| Field           | Type           | Required/default | Notes |
| --------------- | -------------- | ---------------- | ----- |
| `instrument_id` | `InstrumentId` | Required         |       |

</Tab>
</Tabs>
```

### Steps {#steps}

顺序流程用 `Steps` 与 `Step`。

```markdown
1. Configure the adapter.

2. Start the trading node.
```

### Accordions {#accordions}

可折叠内容用 `Accordions` 与 `Accordion`。

```markdown
<Accordions>
<Accordion title="Advanced configuration">
Content here.
</Accordion>
</Accordions>
```

### Files {#files}

目录树可视化用 `Files`、`Folder` 与 `File`。

```markdown
<Files>
<Folder name="src" defaultOpen>
<File name="main.rs" />
<File name="lib.rs" />
</Folder>
</Files>
```

### Cards {#cards}

带链接的内容网格用 `Cards` 与 `Card`。

```markdown
<Cards>
<Card title="Getting started" href="/latest/getting_started" />
<Card title="Concepts" href="/latest/concepts" />
</Cards>
```

### TypeTable {#typetable}

参数或类型说明表格用 `TypeTable`。

## API 文档 {#api-documentation}

- 清楚说明参数与返回类型。
- 复杂的 API 附上使用示例。
- 解释副作用与重要行为。
- 参数说明简练而完整。
