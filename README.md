# <img src="https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/nautilus-trader-logo.png" alt="NautilusTrader" width="500">

[![rustc](https://img.shields.io/crates/msrv/nautilus-core?color=ea7233&logo=rust&label=rustc)](https://crates.io/crates/nautilus-core)
[![crates.io](https://img.shields.io/crates/v/nautilus-core?logo=rust)](https://crates.io/crates/nautilus-core)
[![codspeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/nautechsystems/nautilus_trader)
![pythons](https://img.shields.io/pypi/pyversions/nautilus_trader)
![pypi-version](https://img.shields.io/pypi/v/nautilus_trader)
[![Downloads](https://img.shields.io/pepy/dt/nautilus-trader?color=blue)](https://pepy.tech/projects/nautilus-trader)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?logo=discord&logoColor=white)](https://discord.gg/NautilusTrader)

| 分支      | 版本                                                                                                                                                                                                                     | 构建状态                                                                                                                                                                                            |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `master`  | [![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnautechsystems%2Fnautilus_trader%2Fmaster%2Fversion.json)](https://packages.nautechsystems.io/simple/nautilus-trader/index.html)  | [![build](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml/badge.svg?branch=master)](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml)  |
| `nightly` | [![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnautechsystems%2Fnautilus_trader%2Fnightly%2Fversion.json)](https://packages.nautechsystems.io/simple/nautilus-trader/index.html) | [![build](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml/badge.svg?branch=nightly)](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml) |
| `develop` | [![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnautechsystems%2Fnautilus_trader%2Fdevelop%2Fversion.json)](https://packages.nautechsystems.io/simple/nautilus-trader/index.html) | [![build](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml/badge.svg?branch=develop)](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml) |

| 平台               | Rust   | Python    |
| :----------------- | :----- | :-------- |
| `Linux (x86_64)`   | 1.99.0 | 3.13-3.14 |
| `Linux (ARM64)`    | 1.99.0 | 3.13-3.14 |
| `macOS (ARM64)`    | 1.99.0 | 3.13-3.14 |
| `Windows (x86_64)` | 1.99.0 | 3.13-3.14 |

> 本仓库是 [NautilusTrader](https://github.com/nautechsystems/nautilus_trader) 官方文档的中文翻译站点，
> 在线地址：<https://nautilus.aloen.to>。内容随上游 `develop` 分支同步更新。

- **中文文档**: <https://nautilus.aloen.to>
- **英文文档**: <https://nautilustrader.io/docs/>
- **官网**: <https://nautilustrader.io>
- **支持**: [support@nautilustrader.io](mailto:support@nautilustrader.io)

## 介绍

NautilusTrader 是一个开源、生产级的 Rust 原生引擎，用于构建多资产、多场所的交易系统。

它把研究、确定性模拟与实盘执行统一到同一套事件驱动架构中，Python 作为控制面，
负责策略逻辑、配置与编排。

这种分层兼顾了编译型交易引擎的性能与安全性，以及 Python 在系统组装和策略开发上的
灵活性。对性能要求苛刻的关键任务系统，也可以完全用 Rust 编写。

同一份策略与执行算法代码可以同时在回测和实盘运行，减少部署差异。实盘执行仍会引入
场所、传输、时序、持久化、外部活动与对账等行为，模拟环境未必能复现。参见
[回测与实盘的差异](https://nautilustrader.io/docs/latest/concepts/live#backtest-and-live-differences)。

NautilusTrader 不绑定资产类别，任何提供 REST API 或 WebSocket 数据的场所都能通过
模块化适配器接入。现有集成覆盖加密交易所（CEX 与 DEX）、传统市场（FX、股票、期货、
期权）以及博彩交易所。

![nautilus-trader](https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/nautilus-trader.png "nautilus-trader")

## 特性

- **Fast（快速）**：Rust 核心，使用 [mimalloc](https://crates.io/crates/mimalloc) 分配器，异步网络基于 [tokio](https://crates.io/crates/tokio)。
- **Reliable（可靠）**：类型安全与线程安全由 Rust 保证，状态可选持久化到 Redis。
- **Portable（可移植）**：支持 Linux、macOS 与 Windows，可用 Docker 部署。
- **Flexible（灵活）**：模块化适配器可接入任意 REST API 或 WebSocket 数据源。
- **Advanced（高级）**：委托时效支持 `IOC`、`FOK`、`GTC`、`GTD`、`DAY`、`AT_THE_OPEN`、`AT_THE_CLOSE`，支持高级订单类型与条件触发、`post-only`、`reduce-only`、冰山委托，以及 `OCO`、`OUO`、`OTO` 连带委托。
- **Customizable（可定制）**：可编写自定义组件，也可基于 [Cache](https://nautilustrader.io/docs/latest/concepts/cache) 与 [MessageBus](https://nautilustrader.io/docs/latest/concepts/message_bus) 从零组装系统。
- **Backtesting（回测）**：多场所、多合约、多策略并行回测，支持历史 quote tick、trade tick、bar、订单簿与自定义数据，时间精度达纳秒。
- **Live（实盘）**：研究与实盘部署使用完全相同的策略实现。
- **Multi-venue（多场所）**：做市与跨场所策略可同时运行在多个场所。
- **AI Training（AI 训练）**：引擎性能足以训练 AI 交易代理（RL/ES）。

![nautilus](https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/nautilus-art.png "nautilus")

> *nautilus——源自古希腊语"水手"，naus 意为"船"。*
>
> *鹦螺壳由一系列腔室组成，其增长因子近似对数螺旋。*
> *我们相信这种结构可以映射到设计与建筑的美学之中。*

## 为什么选择 NautilusTrader？

策略研究通常在 Python 中以向量化方式完成，而生产交易系统则另行用编译语言的
事件驱动架构实现，两套代码互不相通。

NautilusTrader 消除了这种割裂。

Rust 原生核心为研究与实盘提供同一个确定性的事件驱动运行时，Python 充当控制面。
两种环境共享同一套架构、执行语义与时间模型，策略从研究走向生产无需重新实现。

v2 的 Rust 原生运行时通过 [PyO3](https://pyo3.rs) 提供 Python 绑定。v2 过渡期间，
v1 只在 `develop_v1` 分支接收关键安全修复。迁移步骤与兼容性细节见
[v2 迁移指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/MIGRATION_V2.md)。
安装预构建 wheel 不需要本地 Rust 工具链。

本项目作出 [Soundness Pledge](https://raphlinus.github.io/rust/2020-01-18/soundness-pledge.html) 承诺：

> "本项目的目标是不存在 soundness 漏洞。开发者将尽力避免此类问题，
> 也欢迎外界协助分析与修复。"

> [!NOTE]
>
> **MSRV**：NautilusTrader 高度依赖 Rust 语言与编译器的持续改进，
> 因此最低支持的 Rust 版本（MSRV）通常与最新的 Rust 稳定版一致。

## 集成

NautilusTrader 采用模块化设计，通过*适配器*（adapter）连接交易场所与数据提供商，
把各家原始 API 翻译为统一接口和标准化领域模型。

已有或规划中的集成如下，详见[集成文档](https://nautilustrader.io/docs/latest/integrations/)：

| 名称                                                         | ID                    | 类型                    | 状态                                                      | 文档                                                            |
| :--------------------------------------------------------- | :-------------------- | :---------------------- | :-------------------------------------------------------- | :------------------------------------------------ |
| [AX Exchange](https://architect.exchange)                  | `AX`                  | Derivatives Exchange    | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/architect_ax)     |
| [Betfair](https://betfair.com)                             | `BETFAIR`             | Sports Betting Exchange | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/betfair)          |
| [Binance](https://binance.com)                             | `BINANCE`             | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/binance)          |
| [Blockchain](https://nautilus.aloen.to/integrations/blockchain) | `BLOCKCHAIN`     | DeFi Data Provider      | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/blockchain)       |
| [Bybit](https://www.bybit.com)                             | `BYBIT`               | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/bybit)            |
| [CoinAPI](https://www.coinapi.io/?ref=nautilus)            | `COINAPI`             | Data Provider           | ![status](https://img.shields.io/badge/beta-yellow)       | [指南](https://nautilus.aloen.to/integrations/coinapi)          |
| [Coinbase](https://coinbase.com)                           | `COINBASE`            | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/coinbase)         |
| [Databento](https://databento.com)                         | `DATABENTO`           | Data Provider           | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/databento)        |
| [Deribit](https://www.deribit.com)                         | `DERIBIT`             | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/deribit)          |
| [Derive](https://www.derive.xyz)                           | `DERIVE`              | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/derive)           |
| [dYdX](https://dydx.trade)                                 | `DYDX`                | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/dydx)             |
| [FinFeed](https://www.finfeedapi.com/?ref=nautilus)        | `FINFEED`             | Data Provider           | ![status](https://img.shields.io/badge/planned-lightgrey) | -                                                               |
| [Hyperliquid](https://hyperliquid.xyz)                     | `HYPERLIQUID`         | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/hyperliquid)      |
| [Interactive Brokers](https://www.interactivebrokers.com)  | `INTERACTIVE_BROKERS` | Brokerage (multi-venue) | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/interactive_brokers) |
| [Kalshi](https://kalshi.com)                               | `KALSHI`              | Prediction Market (CEX) | ![status](https://img.shields.io/badge/planned-lightgrey) | -                                                               |
| [Kraken](https://kraken.com)                               | `KRAKEN`              | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/kraken)           |
| [Lighter](https://lighter.xyz)                             | `LIGHTER`             | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/lighter)          |
| [Lighter on Robinhood](https://robinhoodchain.lighter.xyz) | `LIGHTER_ROBINHOOD`   | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/lighter)          |
| [OKX](https://okx.com)                                     | `OKX`                 | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/okx)              |
| [Polymarket](https://polymarket.com)                       | `POLYMARKET`          | Prediction Market (DEX) | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/polymarket)       |
| [Tardis](https://tardis.dev)                               | `TARDIS`              | Crypto Data Provider    | ![status](https://img.shields.io/badge/stable-green)      | [指南](https://nautilus.aloen.to/integrations/tardis)           |

- **ID**：集成适配器客户端的默认 client ID。
- **类型**：集成的类别（通常对应场所类型）。

Lighter on Robinhood 使用 `LIGHTER_ROBINHOOD` 作为场所与需显式注册的 client ID；
共享的 Lighter 工厂仍以 `LIGHTER` 作为兼容默认值。

### 状态说明

- `planned`：计划开发。
- `building`：构建中，大概率还不可用。
- `beta`：达到最小可用状态，处于 beta 测试阶段。
- `stable`：功能与 API 已稳定，经过开发者和用户的一定程度测试（仍可能残留缺陷）。

更多细节见[集成](https://nautilustrader.io/docs/latest/integrations/)文档。

## 路线图

[Roadmap](https://github.com/nautechsystems/nautilus_trader/blob/develop/ROADMAP.md) 给出了 NautilusTrader 的战略方向。
当前优先级：稳定 Rust 原生核心、改进文档、提升代码易用性。

开源部分聚焦单节点回测与实时交易，服务个人和小团队量化交易者。UI 面板、分布式编排、
内建 AI/ML 工具不在范围内，以保证对核心引擎与生态可持续性的投入。除
[开源范围](https://github.com/nautechsystems/nautilus_trader/blob/develop/ROADMAP.md#open-source-scope)
中明确列出的内容外，其他外部集成（数据库、云服务、监控工具等）同样不在范围内。

范围内的新集成提案应先开一个 RFC issue 讨论适配性，再提交 PR，
参见[社区贡献的集成](https://github.com/nautechsystems/nautilus_trader/blob/develop/ROADMAP.md#community-contributed-integrations)。

## 安全

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/nautechsystems/nautilus_trader/badge)](https://scorecard.dev/viewer/?uri=github.com/nautechsystems/nautilus_trader)

安全是 NautilusTrader 项目的优先事项。我们在依赖选型、开发、构建与发布各环节实施安全控制：

- Rust 依赖仅来自 crates.io；lock 文件用密码学校验和锁定依赖。
- 新版本的依赖与工具需经过发布冷却期才能采用。
- 第三方 Python 包仅安装 wheel。
- `cargo-vet` 审计 Rust 依赖来源。
- `cargo-deny` 强制与 `LGPL-3.0-only` 兼容的许可证白名单。
- TLS 与大部分运行时加密经由 Rust 的 [aws-lc-rs](https://github.com/aws/aws-lc-rs) 使用 AWS-LC。
- Ed25519 签名使用 [ed25519-dalek](https://github.com/dalek-cryptography/curve25519-dalek)。
- Gitleaks 扫描密钥泄露，Zizmor 在 pre-commit 审计 GitHub Actions。
- CODEOWNERS 要求关键基础设施、依赖清单与 lock 文件须经审查。
- 受保护分支要求签名提交且 CI 通过。
- CodeQL 在合入 `master` 的发布 PR 与 `nightly` 推送上运行。
- 涉及审计的 PR 与每日审计运行 `cargo-audit`、`cargo-deny`、`cargo-vet`。
- OSV Scanner 与 `pip-audit` 同样在涉及审计的 PR 与每日任务中运行。
- `cargo-fuzz` 覆盖部分适配器与签名接口。
- GitHub Actions 固定到 commit SHA；加固后的 CI runner 仅允许白名单网络出口。
- Python 构件带 SLSA 构建来源证明。
- 容器镜像由 Sigstore 签名并附 SPDX SBOM 证明。
- PyPI 与 crates.io 通过受保护的 `release` 环境使用 OIDC Trusted Publishing。
- `release` 环境绝不运行 PR 或 fork 代码。
- 发布 tag 不可变。

OpenSSF Scorecard 在人工审查、CI 加固与安全审计之外，提供仓库健康度的自动化信号。

### 报告漏洞

请通过 [GitHub Security Advisories](https://github.com/nautechsystems/nautilus_trader/security/advisories/new)
私密报告，或发送邮件至 <security@nautechsystems.io>（PGP 密钥可索取）。

- 48 小时内确认报告，严重漏洞 30 天内修复。
- 除非报告者要求匿名，我们会在相应的 advisory 与发布说明中致谢。

详见：

- [安全策略](https://github.com/nautechsystems/nautilus_trader/blob/develop/SECURITY.md)：范围、协同披露与分步的发布验证。
- [安全架构](https://nautilustrader.io/docs/latest/developer_guide/security)：从构建到发布的供应链。
- [负责任披露](https://nautilustrader.io/security/responsible-disclosure/)：完整披露政策。
- [供应链安全](https://nautilustrader.io/security/supply-chain/)：完整供应链政策。
- [CI/CD 安全](https://github.com/nautechsystems/nautilus_trader/blob/develop/.github/OVERVIEW.md#security)：GitHub Actions 安全控制。

## 版本与发布

> [!WARNING]
>
> **NautilusTrader 仍在积极开发**。部分功能可能不完整；API 虽趋于稳定，
> 版本之间仍可能出现破坏性变更。我们会**尽力**在发布说明中记录这些变更。

目标发布节奏为**双周一次**，实验性或较大的功能可能导致延期。

### 分支

各分支都力求保持构建稳定的可用状态。

- `master`：最新正式发布版本的源码，推荐生产环境使用。
- `nightly`：`develop` 分支的每日快照，供提前测试；每天 **14:00 UTC** 合并，也可按需合并。
- `develop`：活跃开发分支，供贡献者与特性开发使用。

> [!NOTE]
>
> v2 候选发布版本线是通往 **2.x 稳定 API** 的过渡。达到该里程碑后，
> 我们计划为所有 API 变更建立正式的废弃流程。在此之前，
> 这一安排让项目可以保持快速开发节奏。

## 精度模式

NautilusTrader 的核心值类型（`Price`、`Quantity`、`Money`）支持两种精度模式，
内部位宽与最大小数精度不同：

- **高精度**：128 位整数，最多 16 位小数，取值范围更大。
- **标准精度**：64 位整数，最多 9 位小数，取值范围更小。

> [!NOTE]
>
> 默认情况下，官方 Python wheel 在所有受支持平台上以高精度（128 位）模式发布。
>
> 纯 Rust crate 在所有平台（包括 Windows）都支持高精度——Rust 通过软件模拟处理
> `i128`/`u128`。默认是标准精度，需显式启用 `high-precision` feature flag。

更多细节见[安装指南](https://nautilustrader.io/docs/latest/getting_started/installation)。

**Rust feature flag**：在 Rust 中启用高精度模式，在 Cargo.toml 加入 `high-precision` feature：

```toml
[dependencies]
nautilus-model = { version = "*", features = ["high-precision"] }
```

## 安装

建议使用最新支持的 Python 版本，并在虚拟环境中安装 [nautilus_trader](https://pypi.org/project/nautilus_trader/)，以隔离依赖。

**官方支持两种安装方式**：

1. 从 PyPI *或* Nautech Systems 软件包索引安装预构建的二进制 wheel。
2. 从源码构建。

> [!TIP]
>
> 强烈建议用 [uv](https://docs.astral.sh/uv) 包管理器配合"原版" CPython 安装。
>
> Conda 及其他 Python 发行版*也许*可用，但不在官方支持范围内。

### 从 PyPI 安装

本仓库与[文档](https://nautilustrader.io/docs/latest)覆盖 v2。用 pip 安装 PyPI 上的
v2 候选版本 wheel：

```bash
pip install -U nautilus_trader --pre
```

v2 候选版本 wheel 的版本号为 `2.0.0rcN`，供 `2.0.0` 正式版发布前的社区测试。
不建议在生产环境（例如动用真实资金的实时交易）使用候选版本。

在 `2.0.0` 发布前 `--pre` 必不可少，否则 pip 安装的是最新的 v1 稳定 wheel，
其 Python API 与 v2 文档不符：

```bash
# Installs the latest stable v1 wheel, which cannot run the v2 documentation
pip install -U nautilus_trader
```

安装 `visualization` extra，获得交互式 tearsheet 与图表：

```bash
pip install -U "nautilus_trader[visualization]" --pre
```

细节见[安装指南](https://nautilustrader.io/docs/latest/getting_started/installation#extras)。

### 从 Nautech Systems 软件包索引安装

Nautech Systems 软件包索引（`packages.nautechsystems.io`）符合 [PEP-503](https://peps.python.org/pep-0503/)，
同时托管 `nautilus_trader` 的稳定版与开发版二进制 wheel，可以安装最新稳定版，
也可以安装预发布版本用于测试。

#### 稳定版 wheel

稳定版 wheel 对应 PyPI 上 `nautilus_trader` 的正式版本，使用标准版本号。

安装最新稳定版：

```bash
pip install -U nautilus_trader --index-url=https://packages.nautechsystems.io/simple
```

> [!TIP]
>
> 想同时检索 PyPI 与 Nautech Systems 软件包索引时，用 `--extra-index-url` 替换
> `--index-url`。pip 在两个索引中选出最匹配的版本，不偏向任何一方。

#### 开发版 wheel

主软件包索引会发布来自 `nightly` 与 `develop` 分支的 v2 开发版 wheel，
便于在稳定版发布前试用新特性与修复。

这一流程还能节省计算资源，并让使用者直接拿到 CI 流水线实际测试过的二进制文件，
版本号遵循 [PEP-440](https://peps.python.org/pep-440/) 标准：

- `develop` 分支 wheel 使用 `.devYYYYMMDD+run` 版本后缀。
- `nightly` 分支 wheel：基础版本已是预发布时用 `.devYYYYMMDD`，否则用 `aYYYYMMDD`。

| 平台               | Develop | Nightly |
| :----------------- | :------ | :------ |
| `Linux (x86_64)`   | ✓       | ✓       |
| `Linux (ARM64)`    | -       | ✓       |
| `macOS (ARM64)`    | -       | ✓       |
| `Windows (x86_64)` | -       | ✓       |

> [!WARNING]
>
> 不建议在生产环境使用开发版 wheel，例如动用真实资金的实时交易。

#### 安装命令

默认情况下 pip 安装最新稳定版。加上 `--pre` 后，预发布版本（含开发版 wheel）
才会进入候选范围。

安装最新可用的预发布版本（含开发版 wheel）：

```bash
pip install -U nautilus_trader --pre --index-url=https://packages.nautechsystems.io/simple
```

#### 可用版本

[软件包索引](https://packages.nautechsystems.io/simple/nautilus-trader/index.html)列出了 `nautilus_trader` 的全部可用版本。

用脚本列出可用版本：

```bash
curl -s https://packages.nautechsystems.io/simple/nautilus-trader/index.html | sed -n 's/.*<a href="\([^"]*\)".*/\1/p' | awk -F'#' '{print $1}' | sort
```

> [!IMPORTANT]
>
> Linux 上安装二进制 wheel 前，用 `ldd --version` 确认 glibc 版本为 **2.35** 或更高。

#### 分支更新

- `develop` 分支 wheel（`.devYYYYMMDD+run`）：每次合并提交都会持续构建并发布。
- `nightly` 分支 wheel（`.devYYYYMMDD` 或 `aYYYYMMDD`）：每天 **14:00 UTC** 自动合并 `develop` 分支时构建并发布（有变更才发）。

#### 保留策略

- `develop` 分支 wheel：只保留最近一次构建。
- `nightly` 分支 wheel：每个平台只保留最近 30 个发布日期。

#### 验证构建来源

项目发布的所有构件都带有 CI/CD 流水线生成的密码学证明：

- Python wheel 与源码分发包（PyPI、GitHub Releases、Nautech Systems 软件包索引）：[SLSA](https://slsa.dev/) 构建来源证明。
- Docker 镜像（`ghcr.io/nautechsystems/nautilus_trader`、`ghcr.io/nautechsystems/jupyterlab`）：无密钥 [cosign](https://github.com/sigstore/cosign) 签名，外加 SPDX SBOM 证明。

两者都经由 [Sigstore](https://www.sigstore.dev/) 签发并绑定到具体 commit SHA。
验证通过即说明构件出自 NautilusTrader 官方 GitHub Actions 工作流，且此后未被篡改。

分步验证命令见 `SECURITY.md` 的
[验证发布版本](https://github.com/nautechsystems/nautilus_trader/blob/develop/SECURITY.md#verifying-releases)。

> [!IMPORTANT]
>
> 验证 Python 构件需要 [GitHub CLI](https://cli.github.com/)（`gh`），
> 验证 Docker 镜像需要 [cosign](https://github.com/sigstore/cosign)。
> `develop` 与 `nightly` 分支的开发版 wheel 同样带有证明。

### 从源码构建

按 `pyproject.toml` 先装好构建依赖，就可以用 pip 从源码安装。

1. 安装 [rustup](https://rustup.rs/)（Rust 工具链安装器）：
   - Linux 与 macOS：

       ```bash
       curl https://sh.rustup.rs -sSf | sh
       ```

   - Windows：
       - 下载并安装 [`rustup-init.exe`](https://win.rustup.rs/x86_64)
       - 用 [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 安装 "Desktop development with C++"
   - 验证（任意系统）：终端运行 `rustc --version`

2. 在当前 shell 中启用 `cargo`：
   - Linux 与 macOS：

       ```bash
       source $HOME/.cargo/env
       ```

   - Windows：
     - 新开一个 PowerShell 会话

3. 安装 [clang](https://clang.llvm.org/)（LLVM 的 C 语言前端）：
   - Linux（会顺带安装 [lld](https://lld.llvm.org/)，作为 Rust 链接器加快构建）：

       ```bash
       sudo apt-get install clang lld
       ```

   - macOS：

       ```bash
       xcode-select --install
       ```

   - Windows：
       1. 在 [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 中添加 Clang：
          - 开始 | Visual Studio Installer | Modify | 勾选 C++ Clang tools for Windows (latest) | Modify
       2. 在当前 shell 中启用 `clang`：

           ```powershell
           [System.Environment]::SetEnvironmentVariable('path', "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\Llvm\x64\bin\;" + $env:Path,"User")
           ```

   - 验证（任意系统）：终端运行 `clang --version`

4. 安装 uv（详见 [uv 安装指南](https://docs.astral.sh/uv/getting-started/installation)）：

    - Linux 与 macOS：

        ```bash
        curl -LsSf https://astral.sh/uv/install.sh | sh
        ```

    - Windows（PowerShell）：

        ```powershell
        irm https://astral.sh/uv/install.ps1 | iex
        ```

5. 用 `git` 克隆源码，在项目根目录同步依赖：

    ```bash
    git clone --branch develop --depth 1 https://github.com/nautechsystems/nautilus_trader
    cd nautilus_trader
    make sync
    ```

> [!NOTE]
>
> `--depth 1` 只拉取最新提交，克隆更快、更轻。

6. 使用 uv 项目环境。

    uv 项目环境位于 `python/.venv`，与 `python/pyproject.toml` 同级。直接的 uv
    项目命令在 `python/` 下运行，或从仓库根目录传 `--project python`。

    Linux 与 macOS 上为 PyO3 编译设置环境变量：完成 `make sync` 后，
    在 Bash 或 Zsh 中从仓库根目录执行下面的命令。Fish 的写法见开发者指南的
    [环境配置](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/developer_guide/environment_setup.md#4-configure-environment-variables)。
    每个 shell 都要把 `PYO3_PYTHON` 指向本次检出的 `python/.venv/bin/python`，
    替换掉仍指向根目录 `.venv/bin/python` 的旧导出。

    ```bash
    # Set the Python executable path for PyO3
    export PYO3_PYTHON="$PWD/python/.venv/bin/python"

    # Linux only: Set the library path for the uv-managed Python runtime
    PYTHON_LIB_DIR="$("$PYO3_PYTHON" -c 'import sysconfig; print(sysconfig.get_config_var("LIBDIR"))')"
    export LD_LIBRARY_PATH="$PYTHON_LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

    # Required for Rust tests when using uv-installed Python
    export PYTHONHOME="$("$PYO3_PYTHON" -c 'import sys; print(sys.base_prefix)')"
    ```

> [!NOTE]
>
> `LD_LIBRARY_PATH` 的导出仅适用于 Linux，macOS 不需要。
>
> 用 `uv` 安装的 Python 运行 `make cargo-test` 时必须设置 `PYTHONHOME`，
> 否则依赖 PyO3 的测试可能找不到 Python 运行时。

7. 以 release 模式构建并安装 NautilusTrader：

    ```bash
    make build
    ```

其他选项与细节见[安装指南](https://nautilustrader.io/docs/latest/getting_started/installation)。

## Redis

在 NautilusTrader 中使用 [Redis](https://redis.io) 是**可选**的，
只有将其配置为 [Cache](https://nautilustrader.io/docs/latest/concepts/cache) 数据库或
[MessageBus](https://nautilustrader.io/docs/latest/concepts/message_bus) 后端时才需要。
详见[安装指南](https://nautilustrader.io/docs/latest/getting_started/installation#redis)的 **Redis** 一节。

## Makefile

`Makefile` 覆盖了开发与构建的大部分安装任务，常用目标：

- `make install`：以 `release` 模式安装，包含全部依赖组与 extras。
- `make install-debug`：同上，改用 `debug` 构建模式。
- `make sync`：只安装 Python 依赖，不构建包。
- `make build`：以 `release` 模式构建并安装包（默认）。
- `make build-debug`：以 `debug` 模式构建并安装包。
- `make build-wheel`：以 `release` 模式构建 wheel。
- `make cargo-test`：用 `cargo-nextest` 运行全部 Rust crate 测试。
- `make clean`：删除构建产物、缓存与构建目录。
- `make distclean`：**谨慎**——带 `FORCE=1` 运行时会删除 git 索引之外的一切构件，
  包括尚未 `git add` 的源文件。
- `make docs`：用 Sphinx 构建 Python 文档，用 Cargo 构建 Rust 文档。
- `make pre-commit`：对全部文件运行 pre-commit 检查。
- `make ruff`：按 `python/pyproject.toml` 对全部文件运行 Ruff（自动修复）。
- `make pytest`：用 `pytest` 运行全部测试。
- `make cargo-ci-benches`：构建 CI 使用的 Rust 基准。
- `make cargo-codspeed-build`：构建 CodSpeed 对比用的 Rust 基准子集。

> [!TIP]
>
> 运行 `make help` 查看全部 make 目标的说明。

> [!TIP]
>
> 基础设施集成测试的运行说明见
> [crates/infrastructure/TESTS.md](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/infrastructure/TESTS.md)。

## 示例

指标与策略可以用 Python 或 Rust 开发。对性能与延迟敏感的场景推荐 Rust。示例：

- 经 PyO3 暴露的[指标](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/indicators/src/)实现。
- 直接使用 `BacktestEngine` 的[回测](https://github.com/nautechsystems/nautilus_trader/tree/develop/examples/backtest/)示例。
- 用 Rust 编写的 [EMA 交叉回测](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/backtest/examples/engine_ema_cross.rs)示例。

## Docker

Docker 镜像提供以下变体标签：

- `nautilus_trader:latest`：安装最新正式版。
- `nautilus_trader:nightly`：安装 `nightly` 分支最新构建。
- `jupyterlab:latest`：安装最新正式版，附带 `jupyterlab` 及示例回测 notebook 与配套数据。
- `jupyterlab:nightly`：安装 `nightly` 分支最新构建，附带 `jupyterlab` 及示例回测 notebook 与配套数据。

拉取镜像：

```bash
docker pull ghcr.io/nautechsystems/<image_variant_tag> --platform linux/amd64
```

启动回测示例容器：

```bash
docker pull ghcr.io/nautechsystems/jupyterlab:nightly --platform linux/amd64
docker run -p 8888:8888 ghcr.io/nautechsystems/jupyterlab:nightly
```

然后在浏览器打开：

```bash
http://127.0.0.1:8888/lab
```

> [!WARNING]
>
> 示例统一使用 `log_level="ERROR"`：Nautilus 的日志量会超出 Jupyter 的 stdout
> 速率上限，日志级别更低时 notebook 会在执行中卡住。

## 开发

我们希望为这个 Rust 与 Python 混合的代码库提供尽可能舒适的开发体验，
实用信息见[开发者指南](https://nautilustrader.io/docs/latest/developer_guide/)。

[Nautilus Engineering](https://github.com/nautechsystems/nautilus_engineering)
维护跨 Nautilus 项目共享的工程标准、lint 配置、pre-commit 定义、工具版本锁定与仓库检查。
本仓库按 `.nautilus-engineering.lock` 记录的版本引入其中部分文件；
项目专属的策略与 CI 接线保留在本地。

> [!TIP]
>
> 改动 Rust 后运行 `make build-debug` 编译，这是开发阶段最高效的编译方式。

改动 PyO3 绑定、stub 注解或被包装的 Rust 文档后，从仓库根目录重新生成
生成的 Python 构件：

```bash
make py-stubs
```

该目标改动生成的 `.pyi` 文件与 PyO3 包装文档注释要一并提交，
详见[生成的 Python 构件](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/developer_guide/rust.md#generated-python-artifacts)。

### Rust 测试

[cargo-nextest](https://nexte.st) 是 NautilusTrader 的标准 Rust 测试运行器。
它的关键优势是每个测试运行在独立进程中，避免相互干扰，保证测试可靠性。
全量测试的支持情况与直接用 `cargo test` 的局限，见
[Rust 测试指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/developer_guide/testing.md#rust-tests)。

安装 cargo-nextest：

```bash
cargo install cargo-nextest
```

> [!TIP]
>
> 用 `make cargo-test` 运行 Rust 测试，`make` 会以高效配置调用 **cargo-nextest**。

## 贡献

感谢考虑为 NautilusTrader 做贡献。我们欢迎能改进项目的高质量工作。
开始较大的改动前，先开一个 [issue](https://github.com/nautechsystems/nautilus_trader/issues)
与团队讨论问题和方案。小而独立自包含的修复无需事先约定。

动手前请阅读项目路线图中的[开源范围](https://github.com/nautechsystems/nautilus_trader/blob/develop/ROADMAP.md#open-source-scope)，
了解哪些在范围内、哪些不在。

准备开工时，请遵循 [CONTRIBUTING.md](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)
的指南，其中包括签署贡献者许可协议（CLA），以确保贡献可以被项目接纳。

> [!NOTE]
>
> Pull request 请以 `develop` 分支（默认分支）为目标。新特性与改进先在该分支集成，随后发布。

再次感谢你对 NautilusTrader 的关注！期待审阅你的贡献，与你一起把项目做得更好。

## 社区

加入 [Discord](https://discord.gg/NautilusTrader) 社区，与用户和贡献者交流，
跟进 NautilusTrader 的最新公告与特性。无论你想贡献代码，还是想深入了解这个平台，
都欢迎来我们的 Discord 服务器。

被[开源范围](https://github.com/nautechsystems/nautilus_trader/blob/develop/ROADMAP.md#out-of-scope)
排除的特性与集成，在 NautilusTrader 官方渠道（包括 GitHub 与 Discord）同样不予讨论，
包括对下游实现"展示分享"性质的帖子——即使没有贡献意向、不请求支持或上游合并。
关于核心交易引擎正确性与性能的反馈依然欢迎，请把这类报告聚焦在核心行为上。

> [!WARNING]
>
> NautilusTrader 不发行、不推广、不背书任何加密货币代币。任何声称相反的说法
> 均属未经授权的虚假信息。
>
> NautilusTrader 的所有官方更新与公告只会通过 <https://nautilustrader.io>、
> [GitHub](https://github.com/nautechsystems)、[Discord 服务器](https://discord.gg/NautilusTrader)
> 或经过认证的 X (Twitter) 账号 [@NautilusTrader](https://x.com/NautilusTrader) 发布。
>
> 发现可疑活动请向所在平台举报，并联系我们：<info@nautechsystems.io>。

## 许可证

NautilusTrader 源码发布于 GitHub，许可证为
[GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html)。
欢迎贡献代码，需完成标准的
[贡献者许可协议（CLA）](https://github.com/nautechsystems/nautilus_trader/blob/develop/CLA.md)。

---

NautilusTrader™ 由 Nautech Systems 开发与维护。Nautech Systems 是一家专注于
高性能交易系统开发的科技公司。更多信息访问 <https://nautilustrader.io>。

使用本软件须遵循[免责声明](https://nautilustrader.io/legal/disclaimer/)。

© 2015-2026 Nautech Systems Pty Ltd. 保留所有权利。

![nautechsystems](https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/ns-logo.png "nautechsystems")
<img src="https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/ferris.png" alt="Ferris" width="128">
