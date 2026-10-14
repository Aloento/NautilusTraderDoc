# 安装 {#installation}

NautilusTrader 官方支持 Python 3.13-3.14，覆盖以下 64 位平台：

| 操作系统 | 支持版本 | CPU 架构 |
| ---------------- | ------------------ | ---------------- |
| Linux (Ubuntu)   | 22.04 及更高版本    | x86_64           |
| Linux (Ubuntu)   | 22.04 及更高版本    | ARM64            |
| macOS            | 15.0 及更高版本     | ARM64            |
| Windows Server   | 2022 及更高版本     | x86_64           |

:::note
NautilusTrader 在其他平台上也可能可用，但只有上表列出的平台被开发者日常使用并在 CI 中测试。
:::

NautilusTrader 遵循
[Scientific Python SPEC 0 的 Python 支持窗口](https://scientific-python.org/specs/spec-0000/)：
每个 Python 次要版本自首发起支持三年。支持通常在该窗口结束、且接替的 Python 版本通过兼容性检查后的
第一个 NautilusTrader 版本中终止。

CI 的持续覆盖来自我们构建所用的 GitHub Actions runner：

- `Linux (Ubuntu)` 构建目前固定在 `ubuntu-22.04`，以保证 glibc 2.35 兼容性，不随 `ubuntu-latest` 前进。
- `macOS (ARM64)` 构建运行在 `macos-latest` 上，支持范围跟随该 runner 镜像更新。
- `Windows (x86_64)` 构建目前固定在 `windows-2022`，保持工具链稳定。

在 Linux 上，用 `ldd --version` 确认 glibc 版本为 2.35 或更高，再继续安装。

建议使用最新支持的 Python 版本，并在虚拟环境中安装 [nautilus_trader](https://pypi.org/project/nautilus_trader/)，以隔离依赖。

**官方支持两种安装方式**：

1. 从 PyPI *或* Nautech Systems 软件包索引安装预构建的二进制 wheel。
2. 从源码构建。

:::tip
强烈建议用 [uv](https://docs.astral.sh/uv) 包管理器配合"原版" CPython 安装。

Conda 及其他 Python 发行版*也许*可用，但不在官方支持范围内。
:::

## 从 PyPI 安装 {#from-pypi}

:::warning[本套文档需要 2.x wheel]
本文档覆盖 NautilusTrader 2.x。PyPI 对普通的 `uv pip install nautilus_trader`
仍解析到 1.x 版本线，其 Python API 不同，因此这些页面上的代码在 1.x 环境会抛出
`ImportError` 和 `TypeError`。在 `2.0.0` 正式发布前都要加 `--pre`，并用
`python -c "import nautilus_trader; print(nautilus_trader.__version__)"`
确认输出为 `2.` 开头的版本。
:::

2.x 的候选发布（release candidate）wheel 以 `2.0.0rcN` 版本号发布到 PyPI，最终验证仍在进行。安装最新的
[nautilus_trader](https://pypi.org/project/nautilus_trader/) 二进制 wheel（或 sdist 包）：

```bash
uv pip install --pre nautilus_trader
```

这些 wheel 属于预发布构建，所以 `--pre` 必不可少。安装后的导入名仍是 `nautilus_trader`。

:::warning
不建议在生产环境使用候选版本，例如动用真实资金的实时交易。
:::

请在 NautilusTrader 源码检出目录之外执行该命令。仓库的
`python/pyproject.toml` 为可复现开发设置了 uv 的 `exclude-newer` 策略，
可能把新发布的 wheel 过滤掉。在源码检出目录内请改用
[从源码构建 Python 包](#8-build-python-from-source)。

当前 wheel 面向 Python 3.13-3.14。需要本地 Rust 改动、调试构建，或所需平台没有对应 wheel 时，
请从源码构建。

### 稳定的 1.x wheel {#stable-1-x-wheels}

省略 `--pre` 会安装最新的稳定 1.x 版本：

```bash
uv pip install nautilus_trader
```

1.x 环境无法运行本文档中的示例。API 差异参见
[从 v1 迁移到 v2](https://github.com/nautechsystems/nautilus_trader/blob/develop/MIGRATION_V2.md)。

## 可选依赖 {#extras}

安装 `visualization` extra，获得基于 Plotly 的交互式 tearsheet 与图表：

```bash
uv pip install --pre "nautilus_trader[visualization]"
```

## 从 Nautech Systems 软件包索引安装 {#from-the-nautech-systems-package-index}

Nautech Systems 软件包索引（`packages.nautechsystems.io`）符合
[PEP-503](https://peps.python.org/pep-0503/)，同时托管 `nautilus_trader` 的稳定版与开发版二进制 wheel，
可以安装最新稳定版，也可以安装预发布版本用于测试。

### 稳定版 wheel {#stable-wheels}

稳定版 wheel 对应 PyPI 上 `nautilus_trader` 的正式版本，使用标准版本号。与 PyPI 相同，
最新稳定版仍在 1.x 版本线。不同之处在于该索引也托管开发版 wheel，因此加 `--pre`
安装的是最新开发版 wheel 而非候选版本。要安装 2.x 候选版本，需锁定版本号
（`nautilus_trader==2.0.0rcN`）。

安装最新稳定版：

```bash
uv pip install nautilus_trader --index-url=https://packages.nautechsystems.io/simple
```

:::tip
希望 uv 自动回退到 PyPI 时，用 `--extra-index-url` 替换 `--index-url`。
:::

### 开发版 wheel {#development-wheels}

主软件包索引会发布来自 `nightly` 与 `develop` 两个分支的开发版 wheel，
便于在稳定版发布前试用新特性与修复。

这一流程还能节省计算资源，并让使用者直接拿到 CI 流水线实际测试过的二进制文件，
版本号遵循 [PEP-440](https://peps.python.org/pep-0440/) 标准：

- `develop` 分支 wheel 使用 `.devYYYYMMDD+run` 版本后缀。
- `nightly` 分支 wheel：基础版本已是预发布时用 `.devYYYYMMDD`，否则用 `aYYYYMMDD`。

| 平台               | Develop | Nightly |
| :----------------- | :------ | :------ |
| `Linux (x86_64)`   | ✓       | ✓       |
| `Linux (ARM64)`    | -       | ✓       |
| `macOS (ARM64)`    | -       | ✓       |
| `Windows (x86_64)` | -       | ✓       |

:::warning
不建议在生产环境使用开发版 wheel，例如动用真实资金的实时交易。
:::

默认情况下 uv 安装最新稳定版。加上 `--pre` 后，预发布版本（含开发版 wheel）才会进入候选范围。

安装最新可用的预发布版本（含开发版 wheel）：

```bash
uv pip install nautilus_trader --pre --index-url=https://packages.nautechsystems.io/simple
```

安装后的导入名仍是 `nautilus_trader`。请在 NautilusTrader 源码检出目录之外执行该命令，
否则仓库的 `exclude-newer` uv 策略会把新发布的 wheel 过滤掉。需要本地 Rust 改动、调试构建，
或所需平台没有对应 wheel 时，请从源码构建。

### 可用版本 {#available-versions}

[软件包索引](https://packages.nautechsystems.io/simple/nautilus-trader/index.html)列出了 `nautilus_trader` 的全部可用版本。

用命令请求并列出版本：

```bash
curl -s https://packages.nautechsystems.io/simple/nautilus-trader/index.html | grep -o '<a href="[^"#]*' | sed 's/<a href="//' | sort
```

### 分支更新 {#branch-updates}

- `develop` 分支 wheel（`.devYYYYMMDD+run`）：每次合并提交都会持续构建并发布。
- `nightly` 分支 wheel（`.devYYYYMMDD` 或 `aYYYYMMDD`）：每天 **14:00 UTC** 自动合并 `develop` 分支时构建并发布（有变更才发）。

### 保留策略 {#retention-policies}

- `develop` 分支 wheel：只保留最近一次构建。
- `nightly` 分支 wheel：每个平台只保留最近 30 个发布日期。

### 验证构建来源 {#verifying-build-provenance}

项目发布的所有构件都带有 CI/CD 流水线生成的密码学证明：

- Python wheel 与源码分发包（PyPI、GitHub Releases、Nautech Systems 软件包索引）：[SLSA](https://slsa.dev/) 构建来源证明。
- Docker 镜像（`ghcr.io/nautechsystems/nautilus_trader`、`ghcr.io/nautechsystems/jupyterlab`）：无密钥 [cosign](https://github.com/sigstore/cosign) 签名，外加 SPDX SBOM 证明。

两者都经由 [Sigstore](https://www.sigstore.dev/) 签发并绑定到具体 commit SHA。
验证通过即说明构件出自 NautilusTrader 官方 GitHub Actions 工作流，且此后未被篡改。

分步验证命令见 `SECURITY.md` 的
[验证发布版本](https://github.com/nautechsystems/nautilus_trader/blob/develop/SECURITY.md#verifying-releases)。

:::info
验证 Python 构件需要 [GitHub CLI](https://cli.github.com/)（`gh`），
验证 Docker 镜像需要 [cosign](https://github.com/sigstore/cosign)。
`develop` 与 `nightly` 分支的开发版 wheel 同样带有证明。
:::

## 从源码构建 {#from-source}

按 `pyproject.toml` 先装好构建依赖，就可以用 pip 从源码安装。

### 1. 安装 rustup {#1-install-rustup}

安装 [rustup](https://rustup.rs/)（Rust 工具链安装器）：

```bash tab="Linux/macOS"
curl https://sh.rustup.rs -sSf | sh
```

```powershell tab="Windows"
# Download and install rustup-init.exe from https://win.rustup.rs/x86_64
# Also install "Desktop development with C++" via Build Tools for Visual Studio 2022
```

验证：`rustc --version`

### 2. 启用 cargo {#2-enable-cargo}

在当前 shell 中启用 `cargo`：

```bash tab="Linux/macOS"
source $HOME/.cargo/env
```

```powershell tab="Windows"
# Start a new PowerShell session
```

### 3. 安装 clang {#3-install-clang}

安装 [clang](https://clang.llvm.org/)（LLVM 的 C 语言前端）。Linux 上这一步会顺带安装
[lld](https://lld.llvm.org/)，它被配置为 Rust 链接器以加快构建：

```bash tab="Linux"
sudo apt-get install clang lld
```

```powershell tab="Windows"
# 1. Add Clang via Visual Studio Installer:
#    Modify > C++ Clang tools for Windows (latest) > Modify
# 2. Add to PATH:
[System.Environment]::SetEnvironmentVariable('path', "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\VC\Tools\Llvm\x64\bin\;" + $env:Path,"User")
```

验证：`clang --version`

### 4. 安装 uv {#4-install-uv}

安装 [uv](https://docs.astral.sh/uv/getting-started/installation)：

```bash tab="Linux/macOS"
curl -LsSf https://astral.sh/uv/install.sh | sh
```

```powershell tab="Windows"
irm https://astral.sh/uv/install.ps1 | iex
```

### 5. 克隆并同步依赖 {#5-clone-and-sync-dependencies}

用 `git` 克隆源码，然后在项目根目录同步依赖：

```bash
git clone --branch develop --depth 1 https://github.com/nautechsystems/nautilus_trader
cd nautilus_trader
make sync
```

安装锁定版本工具前，开发主机与 CI runner 镜像的版本以
[版本单一事实来源](./../developer_guide/environment_setup.md#single-source-of-truth-for-versions)为准。

:::note
`--depth 1` 只拉取最新提交，克隆更快、更轻。
:::

### 6. 安装 Cap'n Proto（开发用） {#6-install-cap-n-proto-for-development}

计划启用 `capnp` Rust feature、重新生成序列化 schema 或改动序列化代码时，
安装 [Cap'n Proto](https://capnproto.org)。Linux 与 macOS 上用仓库脚本安装
`.nautilus-engineering/tools.toml` 中锁定的版本：

```bash
./scripts/install-capnp.sh
```

验证：`capnp --version`

:::note
Cap'n Proto 是开发依赖，安装预构建 wheel 时不需要。
:::

### 7. 设置环境变量 {#7-set-environment-variables}

uv 项目环境位于 `python/.venv`，与 `python/pyproject.toml` 同级。直接的 uv
项目命令要在 `python/` 下运行，或从仓库根目录传 `--project python`。

为 PyO3 编译设置环境变量（仅 Linux 与 macOS）。在 Bash 或 Zsh 中完成 `make sync`
后，从仓库根目录执行下面的命令。Fish 的写法见开发者指南的
[环境配置](./../developer_guide/environment_setup.md#4-configure-environment-variables)。
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

:::note
`LD_LIBRARY_PATH` 的导出仅适用于 Linux，macOS 不需要。

用 `uv` 安装的 Python 运行 `make cargo-test` 时必须设置 `PYTHONHOME`，
否则依赖 PyO3 的测试可能找不到 Python 运行时。
:::

### 8. 从源码构建 Python 包 {#8-build-python-from-source}

这一路径从 `python/` 目录构建 PyO3 包并安装进 `python/.venv`。
在 NautilusTrader 源码检出目录内，若当前平台没有可用的开发版 wheel，
或需要本地 Rust 改动，就走这条路径。

从仓库根目录执行：

```bash
make build-debug
```

该目标会同步 `python/.venv`，用 maturin 构建 Rust 扩展，并重新生成 Python 类型
stub。Cargo 构件放在 `target/`。

用项目环境运行一个 Python 示例：

```bash
uv run --project python --no-sync python examples/live/lighter/data_tester.py
```

脚本会连接 Lighter Testnet 并开始推送行情，Ctrl+C 停止。

直接命令与测试目标见 [Python 包 README][python-readme]。

[python-readme]: https://github.com/nautechsystems/nautilus_trader/blob/develop/python/README.md

## 从 GitHub Release 安装 {#from-github-release}

要从 GitHub 安装二进制 wheel，先到 [releases](https://github.com/nautechsystems/nautilus_trader/releases)
列表打开目标版本，下载与操作系统和 Python 版本匹配的 `.whl`，然后执行：

```bash
uv pip install <file-name>.whl
```

## 故障排查 {#troubleshooting}

### 文档示例导入失败 {#documentation-examples-fail-to-import}

```text
ImportError: cannot import name 'OrderSide' from 'nautilus_trader.model'
ImportError: cannot import name 'BacktestEngine' from 'nautilus_trader.backtest'
TypeError: Struct types cannot define __init__
```

这是拿 1.x 安装去跑 2.x 文档导致的。先看当前版本：

```bash
python -c "import nautilus_trader; print(nautilus_trader.__version__)"
```

输出为 `1.` 说明解析到了稳定版本线。加 `--pre` 重装：

```bash
uv pip install -U --pre nautilus_trader
```

1.x 与 2.x 的 Python API 不能互换。迁移 1.x 应用时参见
[从 v1 迁移到 v2](https://github.com/nautechsystems/nautilus_trader/blob/develop/MIGRATION_V2.md)。

### uv 在仓库内解析到旧版本 {#uv-resolves-an-older-version-inside-the-repository}

仓库 `python/pyproject.toml` 的 `exclude-newer` 策略服务于可复现开发，会屏蔽新发布的
wheel。换到其他目录执行安装命令，或[从源码构建](#from-source)。

### 找不到当前平台的 wheel {#wheel-not-found-for-your-platform}

确认 Python 版本为 3.13-3.14，且平台在页首列表内。Linux 上 `ldd --version`
必须报告 glibc 2.35 或更新。否则请[从源码构建](#from-source)。

## 版本与发布 {#versioning-and-releases}

NautilusTrader 仍在活跃开发中。部分特性尚不完整，API 虽趋于稳定，
但版本之间仍可能出现破坏性变更。
我们会以**尽力而为**的方式把这些变更写进发布说明。

目标发布节奏为**双周一次**，实验性特性或较大的功能可能导致延期。

使用 NautilusTrader 就意味着要准备好跟进这些变更。

## Redis {#redis}

在 NautilusTrader 中使用 [Redis](https://redis.io) 是**可选**的，
只有将其配置为缓存数据库或[消息总线](./../concepts/message_bus.md)后端时才需要。

:::info
最低支持 Redis 6.2（[streams](https://redis.io/docs/latest/develop/data-types/streams/) 功能要求）。
:::

快速部署建议使用 [Redis Docker 容器](https://hub.docker.com/_/redis/)。`.docker`
目录中有示例配置，也可以直接运行下面的命令启动容器：

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

这条命令会：

- 本地没有镜像时从 Docker Hub 拉取最新版 Redis。
- 以 detached 模式（`-d`）运行容器。
- 将容器命名为 `redis`，便于引用。
- 在默认端口 6379 暴露 Redis，让本机上的 NautilusTrader 可以访问。

管理 Redis 容器：

- 启动：`docker start redis`
- 停止：`docker stop redis`

:::tip
推荐用 [Redis Insight](https://redis.io/insight/) 图形界面高效可视化和调试 Redis 数据。
:::

## 精度模式 {#precision-mode}

NautilusTrader 的核心值类型（`Price`、`Quantity`、`Money`）支持两种精度模式，
内部位宽与最大小数精度不同：

- **高精度**：128 位整数，最多 16 位小数，取值范围更大。
- **标准精度**：64 位整数，最多 9 位小数，取值范围更小。

:::note
默认情况下，官方 Python wheel 在所有受支持平台上都以高精度（128 位）模式发布。

纯 Rust crate 在所有平台（包括 Windows）都支持高精度——Rust 通过软件模拟处理
`i128`/`u128`。默认是标准精度，需显式启用 `high-precision` feature flag。
:::

:::note
两种模式的性能基准对比尚未发布。
:::

### 构建配置 {#build-configuration}

精度模式在编译期由 `high-precision` Rust feature flag 决定。
Python 包在 maturin 的 build features 中启用了该 flag（见 `python/pyproject.toml`），
所以源码构建默认高精度。要构建标准精度（64 位）的 Python 包，
从 maturin feature 列表移除 `high-precision`，照常构建即可：

```bash
make build-debug
```

### Rust feature flag {#rust-feature-flag}

在 Rust 中启用高精度（128 位）模式，在 `Cargo.toml` 加入 `high-precision` feature：

```toml
[dependencies]
nautilus-model = { version = "*", features = ["high-precision"] }
```

:::info
更多细节见[值类型](./../concepts/overview.md#value-types)规范。
:::
