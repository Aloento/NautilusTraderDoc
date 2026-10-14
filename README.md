# NautilusTrader 中文文档

[![build](https://github.com/Aloento/NautilusTraderDoc/actions/workflows/web.yaml/badge.svg?branch=main)](https://github.com/Aloento/NautilusTraderDoc/actions/workflows/web.yaml)

本仓库是 [NautilusTrader](https://github.com/nautechsystems/nautilus_trader) 官方文档的中文翻译站点，
基于 [Docusaurus](https://docusaurus.io) 构建，在线地址：<https://nautilus.aloen.to>。

- **中文文档**: <https://nautilus.aloen.to>
- **英文文档**: <https://nautilustrader.io/docs/>
- **上游项目**: <https://github.com/nautechsystems/nautilus_trader>（LGPL-3.0）

内容随上游 `develop` 分支同步更新：正文译为中文，代码示例、类名、配置键与专业英文术语
（`post-only`、`maker/taker` 等）保留英文。全部 226 个文档页覆盖快速开始、核心概念、
交易所与集成、操作指南、教程、开发者指南与 API 参考。

## 本地开发

要求：Node.js ≥ 20，pnpm 12（经 `packageManager` 字段由 corepack 管理）。

```bash
corepack enable
pnpm install
pnpm start        # 本地预览 http://localhost:3000
```

常用命令：

| 命令 | 用途 |
| --- | --- |
| `pnpm build` | 生产构建（断链/断锚即报错退出） |
| `pnpm typecheck` | TypeScript 检查 |
| `pnpm check-anchors` | 校验全部内部链接锚点可解析 |
| `pnpm pin-slugs` | 为中文标题固定英文锚点（同步后运行） |

## 上游同步

上游 docs 树抽取到 `.sync/`（gitignore，可再生），由脚本镜像进 `docs/`：

```powershell
# 需要本地存在 upstream 远端（refs/upstream/develop）
./tools/sync.ps1            # 抽取 + 镜像 + 链接改写 + 侧边栏元数据
pnpm pin-slugs              # 重新固定标题锚点
pnpm check-anchors          # 全量锚点校验
```

同步转换细节（jupytext 转 Markdown、链接重写规则、API 存根生成）见 `tools/sync.mjs` 头部注释。
翻译遵循 `tools/STYLE_GUIDE.md` 的术语表与风格规范。

## 部署

推送到 `main` 触发 GitHub Actions（`.github/workflows/web.yaml`）：
安装依赖 → `pnpm build` → `pnpm typecheck` → 发布 `build/` 到 `gh-pages` 分支，
自定义域名 `nautilus.aloen.to`。PR 只构建不部署。

## 许可与致谢

- 文档内容版权归 [Nautech Systems Pty Ltd](https://nautilustrader.io) 所有，
  上游文档以原始许可发布；本翻译遵循相同的署名与许可约束。
- NautilusTrader™ 为 Nautech Systems 的商标。使用该软件须遵循
  [免责声明](https://nautilustrader.io/legal/disclaimer/)。
- 本站为社区中文镜像，与 Nautech Systems 无隶属关系；内容差异以英文原文为准。
