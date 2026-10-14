# <img src="https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/nautilus-trader-logo.png" width="500">

[![codecov](https://codecov.io/gh/nautechsystems/nautilus_trader/branch/master/graph/badge.svg?token=DXO9QQI40H)](https://codecov.io/gh/nautechsystems/nautilus_trader)
[![codspeed](https://img.shields.io/endpoint?url=https://codspeed.io/badge.json)](https://codspeed.io/nautechsystems/nautilus_trader)
![pythons](https://img.shields.io/pypi/pyversions/nautilus_trader)
![pypi-version](https://img.shields.io/pypi/v/nautilus_trader)
![pypi-format](https://img.shields.io/pypi/format/nautilus_trader?color=blue)
[![Downloads](https://pepy.tech/badge/nautilus-trader)](https://pepy.tech/project/nautilus-trader)
[![Discord](https://img.shields.io/badge/Discord-%235865F2.svg?logo=discord&logoColor=white)](https://discord.gg/NautilusTrader)

| Branch    | Version                                                                                                                                                                                                                     | Status                                                                                                                                                                                            |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `master`  | [![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnautechsystems%2Fnautilus_trader%2Fmaster%2Fversion.json)](https://packages.nautechsystems.io/simple/nautilus-trader/index.html)  | [![build](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml/badge.svg?branch=nightly)](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml) |
| `nightly` | [![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnautechsystems%2Fnautilus_trader%2Fnightly%2Fversion.json)](https://packages.nautechsystems.io/simple/nautilus-trader/index.html) | [![build](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml/badge.svg?branch=nightly)](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml) |
| `develop` | [![version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnautechsystems%2Fnautilus_trader%2Fdevelop%2Fversion.json)](https://packages.nautechsystems.io/simple/nautilus-trader/index.html) | [![build](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml/badge.svg?branch=develop)](https://github.com/nautechsystems/nautilus_trader/actions/workflows/build.yml) |

| Platform           | Rust   | Python    |
| :----------------- | :----- | :-------- |
| `Linux (x86_64)`   | 1.90.0 | 3.11-3.13 |
| `Linux (ARM64)`    | 1.90.0 | 3.11-3.13 |
| `macOS (ARM64)`    | 1.90.0 | 3.11-3.13 |
| `Windows (x86_64)` | 1.90.0 | 3.11-3.13 |

- **文档 (Docs)**: <https://nautilustrader.io/docs/>
- **官网 (Website)**: <https://nautilustrader.io>
- **支持 (Support)**: [support@nautilustrader.io](mailto:support@nautilustrader.io)

## 介绍

NautilusTrader 是一个开源、高性能、面向生产的算法交易平台，为量化交易者提供：

- 在历史数据上使用事件驱动引擎回测一组自动化交易策略（portfolio backtests）；
- 并能在不修改策略代码的情况下，将相同策略直接部署到实盘环境（live deployment）。

该平台以“AI-first”为设计理念，旨在在高性能且健壮的 Python 原生环境中开发与部署算法交易策略。这有助于解决研究/回测阶段的 Python 环境与生产实盘环境之间的不一致问题。

NautilusTrader 的设计、架构与实现哲学高度强调软件正确性与安全性，目标是支持面向生产、任务关键型的 Python 原生回测与实盘交易工作负载。

该平台还具有通用性并不依赖于特定资产类别 —— 任何 REST API 或 WebSocket 数据源都可以通过模块化的 adapters（适配器）接入。它支持多种资产与合约类型的高频交易，包括 FX、股票（Equities）、期货（Futures）、期权（Options）、加密资产（Crypto）、去中心化金融（DeFi）以及博彩（Betting），并支持跨多个交易场所的无缝协同交易。

![nautilus-trader](https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/nautilus-trader.png "nautilus-trader")

## 特性

- **Fast（快速）**: 核心使用 Rust 编写，并采用 [tokio](https://crates.io/crates/tokio) 提供异步网络能力。
- **Reliable（可靠）**: 依赖 Rust 提供的类型与线程安全性，并支持可选的 Redis 状态持久化。
- **Portable（可移植）**: 与操作系统无关，支持在 Linux、macOS 和 Windows 上运行。可通过 Docker 部署。
- **Flexible（灵活）**: 模块化适配器使任意 REST 或 WebSocket 数据源都可集成。
- **Advanced（高级）**: 支持多种 Time-in-Force（委托时效）如 `IOC`, `FOK`, `GTC`, `GTD`, `DAY`, `AT_THE_OPEN`, `AT_THE_CLOSE`，以及高级订单类型和条件触发。执行指令如 `post-only`、`reduce-only`，以及冰山委托（icebergs）。支持连带委托（contingency orders），例如 `OCO`、`OUO`、`OTO`。
- **Customizable（可定制）**: 可添加用户自定义组件，或从头使用 [cache](https://nautilustrader.io/docs/latest/concepts/cache) 与 [message bus](https://nautilustrader.io/docs/latest/concepts/message_bus) 组装完整系统。
- **Backtesting（回测）**: 支持多交易场所、多合约、多策略同时回测，使用历史报价 tick、成交 tick、bar、订单簿以及自定义数据，时间精度可达纳秒级。
- **Live（实盘）**: 回测与实盘使用同一套策略实现，保证一致性。
- **Multi-venue（多场所）**: 支持多场所交易，有利于做市（market-making）与统计套利策略实现。
- **AI Training（AI 训练）**: 回测引擎性能足够用于训练 AI 交易代理（例如强化学习 RL / 进化策略 ES）。

![Alt text](https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/nautilus-art.png "nautilus")

> _nautilus - 源自古希腊语，意为 “水手”，naus 意为“船”。_
>
> _鹦螺壳由一系列模块化的腔室组成，其增长因子近似对数螺旋。本项目的设计美学亦借鉴了这一概念。_

## 为什么选择 NautilusTrader？

- **高性能的事件驱动 Python**：使用原生二进制核心组件。
- **回测与实盘的一致性**：策略代码可在回测与实盘间无差别复用。
- **降低运营风险**：增强的风控功能、更好的逻辑正确性与类型安全。
- **高度可扩展**：支持 message bus、定制组件与 actors、定制数据与适配器。

传统上，交易策略研究与回测常在 Python 中使用向量化方法实现，随后又需用 C++、C#、Java 等静态类型语言以事件驱动方式重新实现，以便在生产环境中运行。原因在于向量化回测难以表达实时交易中对时间与事件的精细依赖，而编译型语言在性能与类型安全上更有优势。

NautilusTrader 的一个核心优势是绕过了这一重复实现步骤：平台的关键核心组件已使用 [Rust](https://www.rust-lang.org/) 或 [Cython](https://cython.org/) 完整实现。
这意味着我们在适合的地方使用系统语言编译高性能二进制，并通过 CPython 的 C 扩展将其暴露为 Python 原生接口，适合专业量化交易团队和交易公司使用。

## 为什么使用 Python？

Python 最初作为一门简洁易用的脚本语言被创造出来。近年来它发展为一门功能完备的面向对象通用语言。根据 TIOBE 指数，Python 是当前最流行的编程语言之一。在数据科学、机器学习与人工智能领域，Python 已成为事实上的通用语言（de facto lingua franca）。

## 为什么使用 Rust？

[Rust](https://www.rust-lang.org/) 是一门多范式编程语言，注重性能与安全性，尤其擅长保证并发安全。Rust 运行速度极快并且内存高效（可比肩 C/C++），且没有垃圾回收器。

Rust 可用于构建任务关键型系统、嵌入式设备，并能与其它语言良好集成。

Rust 的丰富类型系统与所有权（ownership）模型能确定性地保证内存与线程安全，从而在编译期消除许多类别的错误。

本项目在核心的性能敏感部分越来越多地采用 Rust 实现。Python 绑定通过 Cython 与 [PyO3](https://pyo3.rs) 实现 —— 在安装时不需要本地 Rust 工具链。

本项目遵循 [Soundness Pledge](https://raphlinus.github.io/rust/2020/01/18/soundness-pledge.html)：

> “本项目的目标是不存在 soundness（安全性）漏洞。开发者将尽最大努力避免此类问题，并欢迎大家参与分析与修复。”

> [!NOTE]
>
> **MSRV（Minimum Supported Rust Version）**：NautilusTrader 对 Rust 语言和编译器的更新高度依赖。因此，最低受支持的 Rust 版本通常与当前的稳定版一致。

## 集成（Integrations）

NautilusTrader 采用模块化设计，通过 adapters（适配器）连接交易所与数据提供方，将它们的原始 API 转换为统一接口并标准化域模型。

目前支持的集成如下；详情请参阅 [docs/integrations/](https://nautilustrader.io/docs/latest/integrations/)：

| Name                                                                         | ID                    | Type                    | Status                                                  | Docs                                        |
| :--------------------------------------------------------------------------- | :-------------------- | :---------------------- | :------------------------------------------------------ | :------------------------------------------ |
| [Betfair](https://betfair.com)                                               | `BETFAIR`             | Sports Betting Exchange | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/betfair.md)       |
| [Binance](https://binance.com)                                               | `BINANCE`             | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/binance.md)       |
| [BitMEX](https://www.bitmex.com)                                             | `BITMEX`              | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/bitmex.md)        |
| [Bybit](https://www.bybit.com)                                               | `BYBIT`               | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/bybit.md)         |
| [Coinbase International](https://www.coinbase.com/en/international-exchange) | `COINBASE_INTX`       | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/coinbase_intx.md) |
| [Databento](https://databento.com)                                           | `DATABENTO`           | Data Provider           | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/databento.md)     |
| [dYdX](https://dydx.exchange/)                                               | `DYDX`                | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/dydx.md)          |
| [Hyperliquid](https://hyperliquid.xyz)                                       | `HYPERLIQUID`         | Crypto Exchange (DEX)   | ![status](https://img.shields.io/badge/building-orange) | [Guide](docs/integrations/hyperliquid.md)   |
| [Interactive Brokers](https://www.interactivebrokers.com)                    | `INTERACTIVE_BROKERS` | Brokerage (multi-venue) | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/ib.md)            |
| [OKX](https://okx.com)                                                       | `OKX`                 | Crypto Exchange (CEX)   | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/okx.md)           |
| [Polymarket](https://polymarket.com)                                         | `POLYMARKET`          | Prediction Market (DEX) | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/polymarket.md)    |
| [Tardis](https://tardis.dev)                                                 | `TARDIS`              | Crypto Data Provider    | ![status](https://img.shields.io/badge/stable-green)    | [Guide](docs/integrations/tardis.md)        |

- **ID**: integrations 适配器客户端的默认 client ID。
- **Type**: 集成的类型（通常对应场所类型）。

### 状态说明

- `building`：正在构建中，可能尚未可用。
- `beta`：达到最小可用状态，处于测试阶段。
- `stable`：功能与 API 相对稳定，已被开发者与用户在一定程度上测试（仍可能存在部分缺陷）。

详情请参阅 [Integrations 文档](https://nautilustrader.io/docs/latest/integrations/index.html)。

## 版本管理与发布

> [!WARNING]
>
> **NautilusTrader 仍处于积极开发阶段**。部分功能可能尚未完成，API 虽逐步稳定，但发布间仍可能发生破坏性更改。我们会尽力在发行说明中记录这些变更。

我们通常遵循**双周发布**（bi-weekly）节奏，但若遇到较大或实验性功能会有所延迟。

### 分支说明

我们力求在各分支上维持稳定、通过构建的状态。

- `master`：反映最新正式发布版本的源码，推荐用于生产环境。
- `nightly`：`develop` 分支的每日快照，用于早期测试；在需要时于 **14:00 UTC** 合并。
- `develop`：活跃开发分支，用于特性开发与贡献者协作。

> [!NOTE]
>
> 我们的 [roadmap](/ROADMAP.md) 目标是在 Rust 迁移后实现 **2.x 的稳定 API**。达到此里程碑后，我们将实施正式的废弃策略以管理 API 变更。这使我们在当前阶段能够保持较快的开发节奏。

## 精度模式（Precision mode）

NautilusTrader 对核心数值类型（`Price`、`Quantity`、`Money`）支持两种精度模式，区别在于内部位宽与最大小数位数：

- **High-precision（高精度）**：使用 128 位整数，最高支持 16 位小数，数值范围更大。
- **Standard-precision（标准精度）**：使用 64 位整数，最高支持 9 位小数，数值范围较小。

> [!NOTE]
>
> 默认情况下，官方的 Python wheel 在 Linux 与 macOS 上以高精度（128-bit）模式发布；由于 Windows 平台缺少原生 128-bit 整数支持，Windows 下默认仅提供标准精度（64-bit）。Rust crates 默认使用标准精度，除非在 Cargo.toml 中显式启用 `high-precision` feature。

更多细节请参阅 [安装指南](https://nautilustrader.io/docs/latest/getting_started/installation)。

**Rust feature flag**：在 Rust 中启用高精度模式，请在 Cargo.toml 中添加 `high-precision` 特性：

```toml
[dependencies]
nautilus_model = { version = "*", features = ["high-precision"] }
```

## 安装

建议使用受支持的最新 Python 版本，并在虚拟环境中安装 [nautilus_trader](https://pypi.org/project/nautilus_trader/) 以隔离依赖。

**支持的两种安装方式**：

1. 从 PyPI 或 Nautech Systems 包索引安装预构建的二进制 wheel。
2. 从源码构建安装。

> [!TIP]
>
> 我们强烈推荐使用 [uv](https://docs.astral.sh/uv) 包管理器并配合“vanilla” 的 CPython 安装。
>
> Conda 等其它 Python 发行版可能也能工作，但非官方支持。

### 从 PyPI 安装

使用 pip 安装最新的二进制 wheel（或 sdist）：

```bash
pip install -U nautilus_trader
```

### 从 Nautech Systems 包索引安装

Nautech Systems 的包索引（`packages.nautechsystems.io`）符合 [PEP-503](https://peps.python.org/pep-0503/)，并托管 stable 与 development 的二进制 wheel，方便用户安装正式发布或预发布版本进行测试。

#### 稳定版本 wheels

稳定版本的 wheel 对应 PyPI 上的正式发布，使用标准语义版本。

安装最新稳定版本：

```bash
pip install -U nautilus_trader --index-url=https://packages.nautechsystems.io/simple
```

> [!TIP]
>
> 如果想让 pip 在无法从该索引找到包时回退到 PyPI，可使用 `--extra-index-url` 而非 `--index-url`。

#### 开发版 wheels

开发版 wheel 来自 `nightly` 与 `develop` 分支，供用户提前测试新功能与修复。

这同时也有助于节省构建资源，并提供与 CI 中测试的二进制一致的访问途径，同时遵循 [PEP-440](https://peps.python.org/pep-0440/) 的版本规范：

- `develop` 的 wheel 版本格式为 `dev{date}+{build_number}`（例如 `1.208.0.dev20241212+7001`）。
- `nightly` 的 wheel 版本格式为 `a{date}`（alpha，例如 `1.208.0a20241212`）。

| Platform           | Nightly | Develop |
| :----------------- | :------ | :------ |
| `Linux (x86_64)`   | ✓       | ✓       |
| `Linux (ARM64)`    | ✓       | -       |
| `macOS (ARM64)`    | ✓       | ✓       |
| `Windows (x86_64)` | ✓       | ✓       |

**注意**：`develop` 分支的开发版 wheel 会为除 Linux ARM64 外的所有受支持平台发布，以加快 CI 反馈速度并节省构建资源。

> [!WARNING]
>
> 我们不建议在生产环境（例如实际控制真实资金的实盘交易）中使用开发版 wheel。

#### 安装命令

默认情况下，pip 会安装最新的稳定版本；添加 `--pre` 标志会让 pip 考虑预发布版本（包括开发版 wheel）。

安装最新的可用预发布版本（包含开发版）：

```bash
pip install -U nautilus_trader --pre --index-url=https://packages.nautechsystems.io/simple
```

安装指定的开发版 wheel（例如 `1.221.0a20250912`）：

```bash
pip install nautilus_trader==1.221.0a20250912 --index-url=https://packages.nautechsystems.io/simple
```

#### 可用版本查询

可在 [packages.nautechsystems.io/simple/nautilus-trader/index.html](https://packages.nautechsystems.io/simple/nautilus-trader/index.html) 查看所有可用版本。

通过脚本方式列出可用版本：

```bash
curl -s https://packages.nautechsystems.io/simple/nautilus-trader/index.html | grep -oP '(?<=<a href=")[^\"]+(?=")' | awk -F'#' '{print $1}' | sort
```

> [!NOTE]
>
> 在 Linux 上，安装二进制 wheel 前请确认 glibc 版本（`ldd --version`） >= **2.35**。

#### 分支发布策略

- `develop` 分支的 wheel（`.dev`）：每次合并都持续构建并发布最新构建。
- `nightly` 分支的 wheel（`a`）：当我们在 **14:00 UTC** 自动合并 `develop` 分支时每日构建并发布（若有变更）。

#### 保留策略

- `develop` 分支的 wheel（`.dev`）：仅保留最近一次构建。
- `nightly` 分支的 wheel（`a`）：仅保留最近 30 个构建。

## 从源码安装（From Source）

如果要从源码用 pip 安装，需要先按 `pyproject.toml` 中列出的构建依赖安装相应工具。

1. 安装 [rustup](https://rustup.rs/)（Rust 工具链安装器）：

   - Linux 与 macOS：

     ```bash
     curl https://sh.rustup.rs -sSf | sh
     ```

   - Windows：
     - 下载并运行 [`rustup-init.exe`](https://win.rustup.rs/x86_64)
     - 使用 [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 安装 “Desktop development with C++” 工具集
   - 验证（任意系统）：在终端中运行 `rustc --version`

2. 在当前 shell 中启用 `cargo`：

   - Linux 与 macOS：

     ```bash
     source $HOME/.cargo/env
     ```

   - Windows：
     - 重新打开一个新的 PowerShell 会话

3. 安装 [clang](https://clang.llvm.org/)（LLVM 的 C 语言前端）：

   - Linux：

     ```bash
     sudo apt-get install clang
     ```

   - Windows：

     1. 在 [Build Tools for Visual Studio 2022](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 中添加 Clang：
        - 启动 Visual Studio Installer | Modify | 勾选 C++ Clang tools for Windows（latest）| 点击 Modify
     2. 在当前 shell 中将 Clang 路径加入环境变量：

        ```powershell
        [System.Environment]::SetEnvironmentVariable('path', "C:\\Program Files\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\Llvm\\x64\\bin\\;" + $env:Path,"User")
        ```

   - 验证（任意系统）：在终端中运行 `clang --version`

4. 安装 uv（详见 [uv 安装指南](https://docs.astral.sh/uv/getting-started/installation)）：

   - Linux 与 macOS：

     ```bash
     curl -LsSf https://astral.sh/uv/install.sh | sh
     ```

   - Windows（PowerShell）：

     ```powershell
     irm https://astral.sh/uv/install.ps1 | iex
     ```

5. 使用 `git` 克隆源码并在项目根目录中安装：

   ```bash
   git clone --branch develop --depth 1 https://github.com/nautechsystems/nautilus_trader
   cd nautilus_trader
   uv sync --all-extras
   ```

> [!NOTE]
>
> `--depth 1` 参数仅拉取最近一次提交以加快克隆速度。

6. 为 PyO3 编译设置环境变量（仅 Linux 与 macOS）：

   ```bash
   # 设置 Python 解释器的库路径（示例为 Python 3.13.4）
   export LD_LIBRARY_PATH="$HOME/.local/share/uv/python/cpython-3.13.4-linux-x86_64-gnu/lib:$LD_LIBRARY_PATH"

   # 设置 PyO3 使用的 Python 可执行文件路径
   export PYO3_PYTHON=$(pwd)/.venv/bin/python
   ```

> [!NOTE]
>
> 请根据系统调整 `LD_LIBRARY_PATH` 中的 Python 版本与架构。使用 `uv python list` 来查找精确路径。

详情请参阅 [安装指南](https://nautilustrader.io/docs/latest/getting_started/installation)。

## Redis

在 NautilusTrader 中使用 [Redis](https://redis.io) 是可选的，仅在将其配置为 cache（缓存）后端或作为 message bus（消息总线）后端时才需要。
请查看 [安装指南 - Redis 部分](https://nautilustrader.io/docs/latest/getting_started/installation#redis) 获取更多信息。

## Makefile

项目附带一个 `Makefile`，可以自动化大部分开发时的安装与构建任务。部分常用目标如下：

- `make install`：以 `release` 模式安装并包含所有依赖组和可选项。
- `make install-debug`：同 `make install`，但使用 `debug` 模式。
- `make install-just-deps`：仅安装 `main`、`dev` 与 `test` 依赖（不安装包本身）。
- `make build`：以 `release` 模式运行构建脚本（默认）。
- `make build-debug`：以 `debug` 模式运行构建脚本。
- `make build-wheel`：使用 uv 以 wheel 格式进行 release 构建。
- `make build-wheel-debug`：以 wheel 格式进行 debug 构建。
- `make cargo-test`：使用 `cargo-nextest` 运行所有 Rust crate 的测试。
- `make clean`：删除所有构建产物（如 `.so` 或 `.dll`）。
- `make distclean`：**谨慎**，删除 git 索引之外的所有文件与产物（包括未 git add 的源文件）。
- `make docs`：使用 Sphinx 构建文档 HTML。
- `make pre-commit`：对所有文件运行 pre-commit 检查。
- `make ruff`：根据 `pyproject.toml` 的配置运行 ruff（并自动修复）。
- `make pytest`：运行所有 pytest 测试。
- `make test-performance`：运行基于 [codspeed](https://codspeed.io) 的性能测试。

> [!TIP]
>
> 运行 `make help` 查看所有可用的 make 目标说明。

> [!TIP]
>
> 查看 [crates/infrastructure/TESTS.md](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/infrastructure/TESTS.md) 获取运行基础设施集成测试的说明。

## 示例

Indicators（指标）和 strategies（策略）可以用 Python 或 Cython 编写。对于对性能与延迟敏感的场景，我们推荐使用 Cython。示例包括：

- 使用 Python 编写的 indicator 示例：`/nautilus_trader/examples/indicators/ema_python.py`。
- 使用 Cython 编写的 indicators 示例：`/nautilus_trader/indicators/` 下的内容。
- 使用 Python 编写的 strategy 示例：`/nautilus_trader/examples/strategies/`。
- 使用 `BacktestEngine` 直接运行的回测示例：`/examples/backtest/`。

## Docker

Docker 镜像基于 `python:3.12-slim`，并提供以下变体标签：

- `nautilus_trader:latest`：包含最新正式发布版本。
- `nautilus_trader:nightly`：包含 `nightly` 分支的最新构建。
- `jupyterlab:latest`：包含最新正式发布版本，并附带 `jupyterlab` 与示例回测 notebook 与示例数据。
- `jupyterlab:nightly`：包含 `nightly` 分支的最新构建，并附带 `jupyterlab` 与示例回测 notebook。

拉取镜像示例：

```bash
docker pull ghcr.io/nautechsystems/<image_variant_tag> --platform linux/amd64
```

启动示例回测容器：

```bash
docker pull ghcr.io/nautechsystems/jupyterlab:nightly --platform linux/amd64
docker run -p 8888:8888 ghcr.io/nautechsystems/jupyterlab:nightly
```

然后在浏览器中打开：

```bash
http://127.0.0.1:8888/lab
```

> [!WARNING]
>
> NautilusTrader 目前在 Jupyter notebook 日志输出（stdout）方面会超过速率限制。因此在示例中将 `log_level` 设置为 `ERROR`。将日志级别调低以查看更多日志会导致 notebook 在执行期间挂起。我们正在研究可能的修复方案，可能包括提高 Jupyter 的配置速率上限，或对 Nautilus 的日志刷新进行节流。
>
> - <https://github.com/jupyterlab/jupyterlab/issues/12845>
> - <https://github.com/deshaw/jupyterlab-limit-output>

## 开发

我们希望为这个混合代码库（包含 Python、Cython 与 Rust）提供良好的开发体验。更多信息请参阅 [Developer Guide](https://nautilustrader.io/docs/latest/developer_guide/index.html)。

> [!TIP]
>
> 在对 Rust 或 Cython 代码做出改动后，运行 `make build-debug` 以获得更高效的开发编译流程。

### 使用 Rust 的测试

[cargo-nextest](https://nexte.st) 是 NautilusTrader 的推荐 Rust 测试运行器。它的主要优点是将每个测试隔离到独立进程，从而提高测试可靠性并避免相互干扰。

可通过以下命令安装 cargo-nextest：

```bash
cargo install cargo-nextest
```

> [!TIP]
>
> 使用 `make cargo-test` 运行 Rust 测试，`make` 会以高效配置调用 **cargo-nextest**。

## 贡献（Contributing）

感谢你考虑为 NautilusTrader 做贡献！我们欢迎各类改进与修复。如果你有功能建议或 bug 修复，第一步请在 GitHub 上打开一个 [issue](https://github.com/nautechsystems/nautilus_trader/issues) 与团队讨论。这有助于确保你的贡献与项目目标一致并避免重复工作。

在开始贡献前，请务必查看项目路线图中关于开源范围的说明 [open-source scope](/ROADMAP.md#open-source-scope)，以了解哪些内容在当前范围内。

准备开始编码时，请遵循 [CONTRIBUTING.md](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md) 中的指南，其中包含签署贡献者许可协议（CLA）的要求，以确保你的贡献可以被项目接纳。

> [!NOTE]
>
> Pull request 请以 `develop` 分支为目标（默认分支）。新的特性与改进将在该分支汇总后发布。

再次感谢你对 NautilusTrader 的关注与贡献！我们期待审阅并与您一起改进项目。

## 社区

加入我们的用户与贡献者社区：在 [Discord](https://discord.gg/NautilusTrader) 上与大家聊天并获取最新公告与特性信息。无论你是想贡献代码的开发者，还是想更多了解该平台的用户，都欢迎加入我们的 Discord。

> [!WARNING]
>
> NautilusTrader 不发行、推广或认可任何加密货币代币。任何声称与此相符的说法均未经授权且不属实。
>
> 所有官方更新与沟通将仅通过 <https://nautilustrader.io>、我们的 [Discord 服务器](https://discord.gg/NautilusTrader) 或我们的 X（Twitter）账号 [@NautilusTrader](https://x.com/NautilusTrader) 发布。
>
> 如果发现任何可疑活动，请向相关平台报告并通过 <info@nautechsystems.io> 联系我们。

## 许可证

NautilusTrader 的源代码以 [GNU Lesser General Public License v3.0](https://www.gnu.org/licenses/lgpl-3.0.en.html) 许可发布于 GitHub。贡献需完成标准的 [Contributor License Agreement (CLA)](https://github.com/nautechsystems/nautilus_trader/blob/develop/CLA.md)。

---

NautilusTrader™ 由 Nautech Systems 开发与维护，Nautech Systems 是一家专注于高性能交易系统开发的科技公司。更多信息请访问 <https://nautilustrader.io>。

© 2015-2025 Nautech Systems Pty Ltd. 保留所有权利。

![nautechsystems](https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/ns-logo.png "nautechsystems")
<img src="https://github.com/nautechsystems/nautilus_trader/raw/develop/assets/ferris.png" width="128">
