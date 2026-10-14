# NautilusTrader 中文文档翻译规范

本规范适用于 `docs/` 下所有从上游英文文档同步而来的中文翻译。翻译前先通读本文件。

## 总原则

1. **忠实优先**：准确传达原文技术含义，不增不减。原文没有的话不加，不自行补充"最佳实践"。
2. **像中文**：以中文母语工程师写技术文档的口吻行文。短句优先，主谓宾清晰。译文读不出英文句式的影子是硬性要求。
3. **无 AI 痕迹**：禁止出现下列模式：
   - "值得注意的是 / 需要指出的是 / 总而言之 / 综上所述 / 让我们 / 您"
   - 连续三段以上用相同的起手式（"通过…，您可以…"）
   - 空话连接词堆砌（"从而使得"、"进而实现"、"以便更好地"）
   - 对每个列表项都加粗、每段末尾都补一句总结
4. **人称**：省略主语或使用"你"，不用"您"。命令式语境的"Run …"译为"运行 …"，不译为"请运行"。
5. **语气保留**：warning/note/tip 提示块的标题和内容都要翻译，但保留 `:::warning[...]` 语法结构本身。

## 术语处理

**保留英文、绝不翻译**（首次出现也不必加中文注释）：

- 核心类名/组件名：`Strategy`、`Cache`、`MessageBus`、`LiveNode`、`BacktestNode`、`BacktestEngine`、`ParquetDataCatalog`、`Actor`、`ExecutionPolicy`、`OrderEmulator` 等所有代码实体名
- 类型与枚举值：`OrderSide`、`InstrumentId`、`BarType`、`PriceType`、`AggressorSide` 等
- 订单类型名：`LimitOrder`、`MarketOrder`、`TrailingStopMarketOrder` 等（行文提及"限价单"这类概念时可用中文，但订单类名保持英文）
- 交易所/服务商名：Binance、Bybit、OKX、dYdX、Hyperliquid、Deribit、Kraken、Coinbase、Interactive Brokers、Databento、Tardis、Polymarket、Betfair、Lighter、Architect AX、CoinAPI
- 协议与技术名：WebSocket、REST、gRPC、Parquet、Arrow、SQL、Rust、Python、Cargo、pip、pnpm、Jupyter
- 配置字段与参数名：一律英文原样（`log_level`、`bar_adaptive` 等）

**固定译法**（全库统一）：

| 英文 | 中文 |
| --- | --- |
| backtest / backtesting | 回测 |
| live trading | 实时交易 |
| venue | 交易场所 |
| order book | 订单簿 |
| tick / quotes / trades | 逐笔数据（保留英文 tick、quote、trade 于表型描述中） |
| instrument | 金融工具（类型名如 `Equity` 保留英文） |
| position | 持仓 |
| account | 账户 |
| margin | 保证金 |
| settlement | 结算 |
| counterparty | 对手方 |
| slippage | 滑点 |
| fill | 成交 |
| liquidity | 流动性 |
| market maker | 做市商 |
| mean reversion | 均值回归 |
| data catalog | 数据目录（`ParquetDataCatalog` 保留英文） |
| message bus | 消息总线（`MessageBus` 保留英文） |
| event-driven | 事件驱动 |
| idempotent | 幂等 |
| throughput / latency | 吞吐量 / 延迟 |
| schema | 模式（数据库语境）或保留 schema |
| fixture | 测试夹具（或保留 fixture） |

遇到表中没有又拿不准的词：**保留英文 + 括号中文**，例如"回测节点（backtest node）"，全句内只标一次，后文直接用其一。宁可保留英文，也不要生造译名。

## 结构与链接（硬性约束）

1. **只改正文文字**。以下一律保持原样，一个字符都不能动：
   - 代码围栏（```python、```rust、```bash…）内的全部内容
   - 行内代码 `` `…` `` 内的内容
   - 所有 URL、文件路径、锚点链接的括号部分
   - frontmatter、HTML 注释、图片引用
   - `:::note[...]` / `:::warning[...]` / `:::tip[...]` / `:::danger[...]` 的 `:::` 行（`[Title]` 内文字要译）
2. **标题锚点**：所有二级及更深层级标题（`##` 起）翻译后追加显式锚点，保留原英文 slug：
   ```markdown
   ## 成交模型 {#fill-models}
   ```
   原标题是 "Fill models"，slug 即 "fill-models"。一级标题（`#`）不加。
   标题文字若本身是英文术语（如 `## Rust FFI`、`## EMA 交叉策略` 中的 EMA），保持英文部分不变。
3. **表格**：表头与单元格文字翻译，代码类单元格保留英文。列对齐语法不动。
4. **文件与目录名不动**，不新建、不删除、不重命名任何文件。
5. Mermaid 图（```mermaid 围栏）整体不动。

## 常见句式参考

- "NautilusTrader provides …" → "NautilusTrader 提供 …"
- "To do X, do Y" → "要做 X，先执行 Y" 或 "如需 X，执行 Y"
- "Note that …" → "注意，…"（不要"需要注意的是"）
- "This is important because …" → 直接译原因："…，这会影响 …"
- "You can …" → "可以 …"（省略主语）
- 长英文状语从句拆成两三个短句，顺序按中文时间顺序重排。

## 交付自检（翻译完成后逐文件过一遍）

1. 代码块数量与原文一致（`:::` 提示块数量一致）。
2. 所有链接括号未动；每个 `##` 及更深层标题带 `{#slug}`。
3. 通读一遍译文，确认没有翻译腔长定语（"…的…的…"超过两层就要拆句）。
4. 不运行 `pnpm build`、不执行 git 命令——由 Lead 统一校验提交。
