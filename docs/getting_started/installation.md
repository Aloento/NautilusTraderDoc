# 安装

NautilusTrader 官方支持下列 64 位平台上的 Python 3.11–3.13：

| 操作系统       | 支持的版本       | CPU 架构 |
| -------------- | ---------------- | -------- |
| Linux (Ubuntu) | 22.04 及更高版本 | x86_64   |
| Linux (Ubuntu) | 22.04 及更高版本 | ARM64    |
| macOS          | 15.0 及更高版本  | ARM64    |
| Windows Server | 2022 及更高版本  | x86_64   |

:::note
NautilusTrader 可能能在其它平台上运行，但上表列出的平台是开发者常用并在 CI 中经常测试的。
:::

我们在以下 GitHub Actions runner 镜像上维护持续的 CI 覆盖：

- `Linux (Ubuntu)` 的构建目前固定使用 `ubuntu-22.04`，以保持与 glibc 2.35 的兼容性（即便 `ubuntu-latest` 在前进）。
- `macOS (ARM64)` 的构建运行在 `macos-latest`，因此支持会随该 runner 镜像更新而跟进。
- `Windows (x86_64)` 的构建运行在 `windows-latest`，支持同样随该 runner 镜像更新而跟进。

在 Linux 上，请先使用 `ldd --version` 确认你的 glibc 版本为 2.35 或更新的版本，然后再继续安装。

我们建议使用受支持的最新 Python 版本，并在虚拟环境中安装 [nautilus_trader](https://pypi.org/project/nautilus_trader/)，以隔离依赖。

**目前有两种受支持的安装方式**：

1. 从 PyPI 或 Nautech Systems 包索引安装预构建的二进制 wheel。
2. 从源码构建并安装。

:::tip
我们强烈建议使用 [uv](https://docs.astral.sh/uv) 包管理器并配合“原生”CPython（vanilla CPython）进行安装。

Conda 和其它 Python 发行版可能可用，但不在官方支持范围内。
:::

## 从 PyPI 安装

使用 Python 的 pip 包管理器从 PyPI 安装最新的 `nautilus_trader` 二进制 wheel（或 sdist）：

```bash
pip install -U nautilus_trader
```

## 可选扩展（Extras）

为特定集成安装可选依赖（extras）：

- `betfair`：Betfair 适配器相关依赖。
- `docker`：在使用 IB gateway（Interactive Brokers 适配器）且需要 Docker 时使用。
- `dydx`：dYdX 适配器相关依赖。
- `ib`：Interactive Brokers 适配器相关依赖。
- `polymarket`：Polymarket 适配器相关依赖。

使用 pip 安装包含特定 extras 的包示例：

```bash
pip install -U "nautilus_trader[docker,ib]"
```

## 从 Nautech Systems 包索引安装

Nautech Systems 的包索引（`packages.nautechsystems.io`）遵循 [PEP-503](https://peps.python.org/pep-0503/)，托管了 `nautilus_trader` 的稳定与开发二进制 wheel。
用户可以选择安装最新的稳定发布，或安装预发布（development）版本以便测试。

### 稳定版本（Stable wheels）

稳定 wheel 对应 PyPI 上的官方发布，并遵循标准版本规则。

安装最新稳定版本：

```bash
pip install -U nautilus_trader --index-url=https://packages.nautechsystems.io/simple
```

:::tip
如果希望在主索引上回退到 PyPI，请使用 `--extra-index-url` 而不是 `--index-url`：

:::

### 开发版本（Development wheels）

开发版本的 wheels 来自 `nightly` 与 `develop` 分支，允许用户在稳定发布之前测试功能与修复。

这种做法有助于节省构建资源，并能方便地获取 CI 中测试过的二进制文件，同时遵循 [PEP-440](https://peps.python.org/pep-0440/) 的版本规范：

- `develop` 构建以 `dev{date}+{build_number}` 格式发布（例如 `1.208.0.dev20241212+7001`）。
- `nightly` 构建以 `a{date}`（alpha）格式发布（例如 `1.208.0a20241212`）。

| 平台               | Nightly | Develop |
| :----------------- | :------ | :------ |
| `Linux (x86_64)`   | ✓       | ✓       |
| `Linux (ARM64)`    | ✓       | -       |
| `macOS (ARM64)`    | ✓       | ✓       |
| `Windows (x86_64)` | ✓       | ✓       |

**注意**：`develop` 分支的开发构建会为除 Linux ARM64 外的所有受支持平台发布，以加快 CI 反馈并避免不必要的构建资源消耗。

:::warning
我们不建议在生产环境（例如真实资本的实盘交易）中使用开发版本的 wheels。
:::

### 安装命令

默认情况下，pip 会安装最新的稳定发布。若要包含预发布版本（例如开发构建），可以添加 `--pre` 标志。

安装最新可用的预发布版本（包括开发构建）：

```bash
pip install -U nautilus_trader --pre --index-url=https://packages.nautechsystems.io/simple
```

安装指定的开发构建示例（例如 2025-09-12 的 `1.221.0a20250912`）：

```bash
pip install nautilus_trader==1.221.0a20250912 --index-url=https://packages.nautechsystems.io/simple
```

### 可用版本查询

你可以在该 [package index 页面](https://packages.nautechsystems.io/simple/nautilus-trader/index.html) 查看所有可用的 `nautilus_trader` 版本。

通过脚本方式列出可用版本示例：

```bash
curl -s https://packages.nautechsystems.io/simple/nautilus-trader/index.html | grep -oP '(?&lt;=<a href="))[^"]+(?=")' | awk -F'#' '{print $1}' | sort
```

### 分支发布策略

- `develop` 分支构建（`.dev`）：每次合并提交后持续构建并发布。
- `nightly` 分支构建（`a`）：在我们自动将 `develop` 合并（若有变更）时每日发布，发布时间为 **14:00 UTC**。

### 保留策略

- `develop` 分支构建（`.dev`）：仅保留最近一次的 wheel 构建。
- `nightly` 分支构建（`a`）：仅保留最近 30 个 wheel 构建。

## 从源码安装

如果先安装 `pyproject.toml` 中列出的构建依赖，也可以使用 pip 从源码安装。

1. 安装 [rustup](https://rustup.rs/)（Rust 工具链安装器）：
   - Linux 和 macOS：

```bash
curl https://sh.rustup.rs -sSf | sh
```

- Windows：
  - 下载并安装 [`rustup-init.exe`](https://win.rustup.rs/x86_64)
  - 使用 [Visual Studio 2022 的 Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) 安装“Desktop development with C++”组件
- 验证（任意系统）：在终端中运行 `rustc --version`

1. 在当前 shell 中启用 `cargo`：
   - Linux 和 macOS：

```bash
source $HOME/.cargo/env
```

- Windows：

  - 启动一个新的 PowerShell

    1. 安装 [clang](https://clang.llvm.org/)（LLVM 的 C 语言前端）：

- Linux：

```bash
sudo apt-get install clang
```

- Windows：

1. 在 Visual Studio 安装程序中为 Build Tools 添加 Clang：

- 打开：Start | Visual Studio Installer | Modify | 勾选 “C++ Clang tools for Windows (latest)” 并修改安装

1. 在当前 shell 中将 Clang 加入 PATH：

```powershell
[System.Environment]::SetEnvironmentVariable('path', "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\Llvm\x64\bin\;" + $env:Path,"User")
```

- 验证（任意系统）：在终端中运行：

```bash
clang --version
```

1. 安装 uv（详见 [uv 安装指南](https://docs.astral.sh/uv/getting-started/installation)）：

   - Linux 和 macOS：

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

- Windows（PowerShell）：

```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

1. 使用 `git` 克隆源码并在项目根目录安装：

```bash
git clone --branch develop --depth 1 https://github.com/nautechsystems/nautilus_trader
cd nautilus_trader
uv sync --all-extras
```

:::note
`--depth 1` 标志只获取最新的提交，以便快速且精简地克隆仓库。
:::

1. 为 PyO3 编译设置环境变量（仅限 Linux 和 macOS）：

```bash
# 为 Python 解释器设置库路径（此处示例为 Python 3.13.4）
export LD_LIBRARY_PATH="$HOME/.local/share/uv/python/cpython-3.13.4-linux-x86_64-gnu/lib:$LD_LIBRARY_PATH"

# 为 PyO3 指定 Python 可执行文件路径
export PYO3_PYTHON=$(pwd)/.venv/bin/python
```

:::note
根据你的系统调整 `LD_LIBRARY_PATH` 中的 Python 版本与架构。
使用 `uv python list` 来查找你安装的 Python 的精确路径。
:::

## 从 GitHub release 安装

要从 GitHub 安装二进制 wheel，请先打开 [最新发布页面](https://github.com/nautechsystems/nautilus_trader/releases/latest)，
下载与你的操作系统和 Python 版本匹配的 `.whl` 文件，然后运行：

```bash
pip install <file-name>.whl
```

## 版本与发布策略

NautilusTrader 仍在积极开发中。部分功能可能尚未完成，且尽管 API 日益稳定，仍可能在各版本之间发生破坏性变更。
我们会尽最大努力在发布说明中记录变更，但不保证完全覆盖。

我们通常以 **每周发布** 为目标，但大型或实验性功能可能会导致发布时间延后。

请在愿意适应这些变化的前提下使用 NautilusTrader。

## Redis

在 NautilusTrader 中使用 [Redis](https://redis.io) 是 **可选的**，仅在你将其配置为缓存数据库或 [message bus](../concepts/message_bus.md) 的后端时才需要。

:::info
最低支持的 Redis 版本为 6.2（需要支持 [streams](https://redis.io/docs/latest/develop/data-types/streams/) 功能）。
:::

我们建议快速启动时使用 [Redis Docker 镜像](https://hub.docker.com/_/redis/)。仓库中的 `.docker` 目录含有示例配置，或可运行下面命令启动容器：

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

该命令将会：

- 如果本地未下载，则从 Docker Hub 拉取最新版 Redis。
- 以分离模式（`-d`）运行容器。
- 将容器命名为 `redis`，便于管理。
- 暴露默认端口 6379，使 NautilusTrader 可在本机访问 Redis。

管理 Redis 容器示例：

- 启动：`docker start redis`
- 停止：`docker stop redis`

:::tip
我们推荐使用 [Redis Insight](https://redis.io/insight/) 作为 GUI，用于高效可视化和调试 Redis 数据。
:::

## 精度模式（Precision mode）

NautilusTrader 对核心数值类型（`Price`、`Quantity`、`Money`）支持两种精度模式，它们在内部位宽与最大小数位数上有所区别：

- **高精度（High-precision）**：使用 128 位整数，最高支持 16 位小数，且数值范围更大。
- **标准精度（Standard-precision）**：使用 64 位整数，最高支持 9 位小数，且数值范围较小。

:::note
默认情况下，官方的 Python wheel 在 Linux 与 macOS 上以高精度（128-bit）模式发布。
由于 Windows 对原生 128 位整数支持不足，Windows 上仅提供标准精度（64-bit）。

对于 Rust crates，默认使用标准精度，除非你显式启用 `high-precision` 功能标志（feature flag）。
:::

标准精度通常在典型回测中能带来约 3–5% 的性能提升，但会降低小数精度并缩小可表示的数值范围。

:::note
关于不同模式的性能基准测试尚在进行中。
:::

### 构建配置

精度模式由以下方式决定：

- 在编译时设置 `HIGH_PRECISION` 环境变量，**和/或**
- 在 Rust 层显式启用 `high-precision` 功能标志。

#### 高精度模式（128-bit）

```bash
export HIGH_PRECISION=true
make install-debug
```

#### 标准精度模式（64-bit）

```bash
export HIGH_PRECISION=false
make install-debug
```

### Rust 功能标志

要在 Rust 中启用高精度（128-bit）模式，请在 `Cargo.toml` 中为相关依赖添加 `high-precision` 特性：

```toml
[dependencies]
nautilus_core = { version = "*", features = ["high-precision"] }
```

:::info
有关更多细节，请参见 [Value Types](../concepts/overview.md#value-types) 规范。
:::
