# 环境搭建

使用对 Rust 与 Python 都有良好语言支持的编辑器，例如 PyCharm 或 Visual Studio Code。

[uv](https://docs.astral.sh/uv) 是处理所有 Python 虚拟环境与依赖的首选工具。

[prek](https://github.com/j178/prek) 用于在提交时自动运行各类 pre-commit 检查、
自动格式化与 lint 工具。

源码构建与 Rust crate 需要 [Rust](https://www.rust-lang.org)
（[安装指南](https://www.rust-lang.org/tools/install)）。

序列化 schema 编译需要 [Cap'n Proto](https://capnproto.org)。所需版本写在
`.nautilus-engineering/tools.toml`。Ubuntu 默认源里的包通常太旧，可能需要从源码
安装（见下文）。

:::info
NautilusTrader *必须*能在 **Linux、macOS 与 Windows** 上编译和运行。请时刻考虑
可移植性：代码中使用 `std::path::Path`，脚本遵循
[shell 可移植性策略](./shell.md#define-the-portability-target)。
:::

## 搭建 {#setup}

以下步骤面向类 UNIX 系统，只需完成一次。

### 快速搭建 {#quick-setup}

在新的 Linux 或 macOS 开发机上，用这一小节作为紧凑的搭建路径。下文的详细小节
解释每个步骤并涵盖替代方案。

先安装平台工具：

```bash tab="Ubuntu"
sudo apt-get update
sudo apt-get install -y build-essential clang lld curl git make pkg-config
```

```bash tab="macOS"
xcode-select --install
```

然后克隆仓库并安装固定版本的项目工具：

```bash
git clone --branch develop https://github.com/nautechsystems/nautilus_trader
cd nautilus_trader

curl https://sh.rustup.rs -sSf | sh
source "$HOME/.cargo/env"

curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

cargo install cargo-binstall --locked
make install-tools
./scripts/install-capnp.sh

make sync
source python/.venv/bin/activate

export PYO3_PYTHON="$PWD/python/.venv/bin/python"

if [ "$(uname -s)" = "Linux" ]; then
  PYTHON_LIB_DIR="$("$PYO3_PYTHON" -c 'import sysconfig; print(sysconfig.get_config_var("LIBDIR"))')"
  export LD_LIBRARY_PATH="$PYTHON_LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
fi

export PYTHONHOME="$("$PYO3_PYTHON" -c 'import sys; print(sys.base_prefix)')"

prek install
make build-debug
```

Windows 用户先按[安装指南](./../getting_started/installation.md#from-source)的源码安装步骤操作，
再使用本指南中相应的命令。

### 1. 安装依赖 {#1-install-dependencies}

按[安装指南](./../getting_started/installation.md)操作，然后从仓库根目录同步
开发与测试依赖：

```bash
make sync
```

频繁开发时，把 debug 构建的包安装进 `python/.venv`：

```bash
make install-debug
```

### 2. 安装开发工具 {#2-install-development-tools}

NautilusTrader 固定了每个开发工具，让所有贡献者与 CI 运行完全相同的版本。
一个 Makefile 目标安装全套：

```bash
make install-tools
```

这会安装：

- **共享 Cargo CLI**，固定于 `.nautilus-engineering/tools.toml`：`cargo-audit`、
  `cargo-deny`、`cargo-edit`、`cargo-llvm-cov`、`cargo-nextest` 与 `cargo-vet`。
- **NautilusTrader Cargo CLI**，固定于 `Cargo.toml` 的
  `[workspace.metadata.tools]`：`cargo-codspeed`、`cargo-fuzz`、`cargo-hawk`、
  `cargo-machete`、`cbindgen`、`flamegraph` 与 `lychee`。
- **NautilusTrader Cargo CLI**，固定于 `tools.toml`：`tokei`（行数统计）。
- **预构建二进制**，固定于 `.nautilus-engineering/tools.toml`：`prek`
  （pre-commit 运行器）与 `osv-scanner`（漏洞扫描器）。
- **uv**，按共享的固定版本安装。受支持的本地 uv 小版本系列定义在
  `python/pyproject.toml`。

Cap'n Proto 同样固定于 `.nautilus-engineering/tools.toml`，但单独安装，
见下文的 [Cap'n Proto](#capn-proto) 小节。

fuzz 目标运行时还需要 Rust nightly 工具链，因为 `cargo-fuzz` 使用
`libfuzzer-sys` 和不稳定的编译标志：

```bash
rustup toolchain install nightly
```

docs.rs 兼容性检查使用 `tools.toml` 中固定的带日期 nightly：

```bash
rustup toolchain install "$(bash scripts/tool-version.sh nightly)" --profile minimal
```

#### 一次性前置：cargo-binstall {#one-off-prerequisite-cargo-binstall}

`make install-tools` 用 [`cargo-binstall`](https://github.com/cargo-bins/cargo-binstall)
以预构建二进制获取 `prek`，而不是从源码编译。每台机器安装一次
`cargo-binstall`：

```bash
cargo install cargo-binstall --locked
```

这是一次性步骤，之后运行 `make install-tools` 会复用已装的 `cargo-binstall`。

#### 版本的单一事实来源 {#single-source-of-truth-for-versions}

仓库清单是依赖与工具版本的规范来源。只要存在读取当前版本号的清单途径，
就不要把版本号抄进文档、runner 镜像或脚本。

| 源文件或区段                    | 定义内容                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `rust-toolchain.toml`                     | Rust 工具链。                                          |
| `Cargo.toml` 与 `Cargo.lock`             | Rust workspace 依赖与精确解析结果。        |
| `Cargo.toml` `[workspace.metadata.tools]` | NautilusTrader 专属的 Cargo 工具。                     |
| `python/pyproject.toml`                   | Python 依赖，以及受支持的 Python 与 uv 版本范围。  |
| `python/uv.lock`                          | 精确的 Python 依赖解析结果。                      |
| `.nautilus-engineering/tools.toml`        | 共享的工程工具。                                |
| `tools.toml`                              | 没有原生清单的 NautilusTrader 专属工具。 |

共享目录包含 uv、`prek`、`pip-audit`、`osv-scanner`、Cap'n Proto 与常用 Cargo
工具。本地目录保留 docs.rs nightly、Miri 工具链与 `pypi-attestations` 的固定版本。

Makefile 经由 `scripts/cargo-tool-version.sh`、`scripts/tool-version.sh` 与
`scripts/uv-version.sh` 读取这些版本，因此升级版本时只需改源文件。要对账
固定的 cargo 工具版本与 crates.io，运行：

```bash
make outdated
```

### 3. 配置 Git 钩子 {#3-set-up-git-hooks}

配置文件与提交消息钩子，它们在提交时自动运行：

```bash
prek install
```

配置的钩子类型发生变更并拉取后，重新运行 `prek install`。

开 pull request 之前在本地跑一遍格式化与 lint 套件，让 CI 一次通过：

```bash
make format
make pre-commit
```

确保 Rust 编译器报告**零错误**——构建坏了会拖慢所有人。

### 4. 配置环境变量 {#4-configure-environment-variables}

NautilusTrader 的 uv 管理环境放在 `python/.venv`，与 `python/pyproject.toml`
同级。这遵循 [uv 默认的项目环境布局](https://docs.astral.sh/uv/concepts/projects/layout/#the-project-environment)，
uv 与 Python 编辑器都会到这里发现环境。

直接运行 uv 项目命令时，在 `python/` 下执行，或从仓库根目录传
`--project python`。Make 目标与 CI 会自行选择项目。

:::warning
如果这份检出之前用的是根目录的 `.venv`，先更新 shell 启动文件和当前 shell。
这些改动必须在运行 Make 或 uv 之前完成：

- 删除任何 `UV_PROJECT_ENVIRONMENT` 导出。这一覆盖优先于 uv 的项目发现。
- 把指向根目录 `.venv/bin/python` 的 `PYO3_PYTHON` 导出，替换为本检出的
  `python/.venv/bin/python`。

编辑启动文件不会更新已打开的 shell 或正在运行的应用。每个 shell 都要重新
执行导出，继承了旧环境的应用要重启。
:::

**Rust/PyO3 必需（Linux 与 macOS）**：

Linux 或 macOS 上的 Python 若是 `uv` 安装的，先运行 `make sync`，然后从仓库
根目录设置这些环境变量：

按你的 shell 选择对应命令。Bash 与 Zsh 用 `export` 和 `activate`；Fish 用
`set -gx` 和 `activate.fish`。Fish 脚本只能在 Fish 中 source。

```bash tab="Bash / Zsh"
# Set the Python executable path for PyO3
export PYO3_PYTHON="$PWD/python/.venv/bin/python"

# Linux only: Set the library path for the uv-managed Python runtime
PYTHON_LIB_DIR="$("$PYO3_PYTHON" -c 'import sysconfig; print(sysconfig.get_config_var("LIBDIR"))')"
export LD_LIBRARY_PATH="$PYTHON_LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

# Set the Python home path (required for Rust tests)
export PYTHONHOME="$("$PYO3_PYTHON" -c 'import sys; print(sys.base_prefix)')"
```

```fish tab="Fish"
set -gx PYO3_PYTHON "$PWD/python/.venv/bin/python"

if test (uname -s) = Linux
    set -l python_lib_dir ("$PYO3_PYTHON" -c 'import sysconfig; print(sysconfig.get_config_var("LIBDIR"))')
    set -gx LD_LIBRARY_PATH "$python_lib_dir" (string match -v "" -- $LD_LIBRARY_PATH)
end

set -gx PYTHONHOME ("$PYO3_PYTHON" -c 'import sys; print(sys.base_prefix)')
```

:::note
`LD_LIBRARY_PATH` 的导出仅用于 Linux，macOS 与 Windows 不需要。

- `PYO3_PYTHON` 告诉 PyO3 使用哪个 Python 解释器，减少不必要的重新编译。
- 用 `uv` 安装的 Python 运行 `make cargo-test` 时需要 `PYTHONHOME`。
  缺少它，依赖 PyO3 的测试可能找不到 Python 运行时。

:::

验证环境配置是否正确：

```bash
python -c "import sys; print('Python:', sys.executable, sys.version)"
echo "PYO3_PYTHON: $PYO3_PYTHON"
echo "PYTHONHOME: $PYTHONHOME"
```

## 依赖管理 {#dependency-management}

Python 依赖由 [uv](https://docs.astral.sh/uv) 管理。`python/pyproject.toml` 的
`[tool.uv]` 区段强制三项供应链安全设置：

- **`required-version`**：本地 uv 命令接受受支持小版本系列内的任意补丁版本。
  本地 uv 超出该范围时，`uv lock` 与 `uv sync` 会因版本不匹配而失败。
  `.nautilus-engineering/tools.toml` 另行固定 CI、Docker、pre-commit 与
  `make update-uv` 使用的精确版本。stub 目标经由 `make sync` 运行，因此执行
  同样的受支持范围。见[生成的 Python 产物](./rust.md#generated-python-artifacts)。
- **`exclude-newer = "7 days"`**：`uv lock` 忽略最近 7 天内发布的包版本。
  这给社区留出时间，在被污染的版本进入锁文件之前发现并隔离它。
  该值接受以下形式：

  - RFC 3339 时间戳（`"2026-03-30T00:00:00Z"`）。
  - 友好时长（`"7 days"`、`"1 week"`、`"24 hours"`）。
  - ISO 8601 时长（`"P7D"`、`"P1W"`、`"PT24H"`）。

  uv 0.11.8+ 会把友好/ISO 形式以 `exclude-newer-span` 存入 `python/uv.lock`，
  并出于向后兼容在该字段旁发出一个哨兵 `exclude-newer` 时间戳。
  `python/uv.lock` 使用的就是该格式。
- **`no-build-package`**：显式列出 `python/uv.lock` 中锁定的全部第三方包。
  `uv` 拒绝从源码构建其中任何一个。正常运作下 uv 优先使用 wheel，该设置是
  空操作；只有当某个被列出的包停止为目标平台发布 wheel 时才会触发——此时
  `uv lock` 失败，而不是悄悄从 sdist 构建。

  本地 workspace 包有意不在列表中，因为它必须由 workspace 自己的构建后端
  构建。列表由 `scripts/check-no-build-packages.sh` 与 `python/uv.lock` 保持同步，
  该脚本也作为 pre-commit 钩子在锁文件或清单变更时运行。

### 绕过冷静期 {#bypassing-the-cooldown}

安全补丁或关键缺陷修复可能需要立即更新。遇到这种情况，先评审该发布，
再为这一次 lock 操作覆盖 `exclude-newer`。Prefer 按包粒度的覆盖，让无关的包
仍受 7 天默认值约束。不要把持久的按包覆盖写进 `python/pyproject.toml`。

各种形式都接受时间戳、友好时长或 ISO 时长；按包的覆盖还额外接受 `false`，
表示该包完全豁免冷静期。

```bash
# Shorten the cooldown for a single package (friendly duration)
uv lock --project python --exclude-newer-package "somepackage=1 day"

# Pin a single package to an absolute cutoff
uv lock --project python --exclude-newer-package "somepackage=2026-03-30T00:00:00Z"

# Exempt a single package from the cooldown entirely
uv lock --project python --exclude-newer-package "somepackage=false"

# Disable the cooldown for the whole resolution after reviewing every newly eligible package
uv lock --project python --exclude-newer "0 seconds"
```

CLI 标志只对当次调用覆盖 `python/pyproject.toml` 中的值，配置本身不变，
后续运行仍按原值执行。

### 更新 uv {#updating-uv}

要支持新的 uv 小版本系列，改 `python/pyproject.toml` 的 `required-version`。
要在该范围内更新项目的精确版本：

1. 更新 Nautilus Engineering 的 `[uv].version`。
1. 同步共享目录。
1. 更新 `.pre-commit-config.yaml` 中的 `rev`。
1. 更新每个按 digest 固定的 uv Docker 镜像。
1. 运行 `make update-uv` 在本地安装项目版本。

### Rust 依赖冷静期 {#rust-dependency-cooldown}

Cargo 冷静期检查会拒绝在 `Cargo.toml` 的 `[workspace.metadata.cooldown]`
所设窗口内发布的已解析注册表版本。它在依赖构建脚本或过程宏得以运行之前，
检查每个被跟踪的 `Cargo.lock` 文件，包括已提交或从其他分支拉入的版本。

检查在以下时点运行：

- **构建**：每个能编译 Rust 的 Make 目标都依赖 `check-cargo-cooldown`，
  涵盖 build、stub、check、Clippy、test、coverage、文档、基准、Docker 与
  本地 CLI 安装目标。即使在并行 Make 下，编译也会等待检查完成。
- **Pre-commit**：提交暂存了 `Cargo.toml` 或 `Cargo.lock` 文件、
  `.supply-chain/crate-dates.json` 或 `scripts/check-cargo-cooldown.sh` 时，
  `cargo-cooldown` 钩子运行。
- **CI**：pre-commit 任务运行 `prek run --all-files`；经由 Make 目标构建的
  任务先运行该检查。
- **按需**：`make check-cargo-cooldown` 运行同样的完整检查。
- **依赖更新**：`make cargo-update` 会把每个不被允许的新升级恢复为之前的版本。

Make 的编译目标还传 `--locked`，让 Cargo 在遇到检查未曾见过的版本解析时
直接失败，而不是自行解析。

冷静期窗口内的版本，既要在 `[workspace.metadata.cooldown.allow]` 中有精确
条目，又要有匹配的 cargo-vet 审计。不受支持的注册表会使检查失败。发布日期
来自已提交的数据库 `.supply-chain/crate-dates.json`：已记录的日期在离线时被
信任；数据库缺失的版本到 crates.io 查询，注册表不可达时按失败处理
（fail closed）。干净的 Git diff 证明不了依赖足够旧。

分支可能在新引入版本旁添加一条日期回填的数据库条目。`trusted-base = "origin/develop"` 设置补上这个缺口：对 `origin/develop` 缺少的每个数据库条目，
检查都会对 crates.io 重新验证，然后缓存通过结果。分支只有在自己或
`origin/develop` 变化时才重复这些请求，不是每次构建都发。

- **克隆中没有 `origin/develop`**：检查失败，直到你 fetch 它。
- **CI 浅克隆**：检查无法解析可信基，改为信任已记录的日期。
- **完整历史的 pre-commit 任务**：检查对照可信基验证。

`make cargo-update` 为它接受的每个变更记录日期。手工编辑锁文件后，运行
`bash scripts/check-cargo-cooldown.sh --update-db` 对账数据库，它同时清理
没有任何被跟踪锁解析到的条目。依赖更新命令会另行对新添加的日期重新对照
crates.io 验证。常规 pre-commit 与完整检查离线使用已提交的数据库。

pre-commit 钩子与 `make check-cargo-cooldown` 把成功的完整检查缓存为
`CARGO_TARGET_DIR` 下的 `.cargo-cooldown.json`。未设置 Cargo target 目录时，
钩子使用仓库根的 `target/`，Make 使用其 `TARGET_DIR`。CI 使用其配置的 Cargo
target 目录，让常驻 runner 在任务之间保留缓存。

任何被检查的锁文件、策略、审计、数据库、检查脚本，或可信基的数据库与
锁文件发生变化，都会使缓存失效。失败的检查不会被缓存。把该文件视为本地
验证状态，不要从不受信来源恢复它。

**门禁限度**：冷静期降低的是新发布的恶意注册表版本的暴露面，并不证明较旧
的版本安全，也不对构建脚本做沙箱，或审计 Git 与本地路径依赖。
`make install-tools` 这类开发工具引导命令安装的是依赖解析独立的外部包，
不受本仓库锁文件门禁约束。

直接调用 Cargo 与 Maturin 会绕过 Make。rust-analyzer 这类编辑器集成在锁文件
一变就可能运行构建脚本。在编辑器中打开不受信的分支之前，先运行
`make check-cargo-cooldown`。直接构建仓库代码时传 `--locked`，并在检查与编译
之间保持清单与锁文件不变。

## 构建 {#builds}

Python 包与独立的 Nautilus CLI 是分开的构建产物。`make build-debug` 与
`make build` 把 Python 包安装进 `python/.venv`，两者都不会更新 Cargo 二进制
目录里的 `nautilus`。改动或使用 CLI 时见
[Nautilus CLI 开发者指南](#nautilus-cli-developer-guide)。

改动 Rust 绑定或 Python 包代码后，日常开发用 debug 构建：它跳过发布优化与
LTO，缩短构建时间、降低内存峰值：

```bash
make build-debug
```

需要优化构建时用 `make build`。release profile 使用 fat LTO 与单一代码生成
单元，内存峰值更高。若构建能拿到完整内存配额并有足够的 swap，16 GB 的机器
也能完成 fat LTO。有 VM 或容器内存限制时要先核对。

链接器内存不足时，本地优化构建可改用 ThinLTO：

```bash
CARGO_PROFILE_RELEASE_LTO=thin make build
```

这一覆盖只对该命令生效。性能测量仍用默认的 fat LTO profile。

### 拉取变更后的刷新 {#refresh-after-pulling-changes}

用能更新受影响产物的命令。构建目标会调用各自的前置，因此 `make build-debug`
也会同步 Python 依赖并重新生成 Python 类型 stub。

| 变更的输入                                       | 命令                      | 更新的产物                                  |
| --------------------------------------------------- | ---------------------------- | ------------------------------------------------- |
| `python/pyproject.toml` 或 `python/uv.lock`         | `make sync`                  | `python/.venv` 中的依赖。                   |
| Rust 绑定、Python 包代码或 stub 源 | `make build-debug`           | Debug Python 包与生成的类型 stub。    |
| CLI 代码、SQL 初始化代码或 `schema/sql`  | `make install-cli`           | Cargo bin 路径下的独立 `nautilus` 二进制。 |
| Cargo、uv、`prek` 或 OSV Scanner 的工具固定版本         | `make install-tools`         | 固定的开发工具。                         |
| 共享目录中的 Cap'n Proto 版本           | `./scripts/install-capnp.sh` | Cap'n Proto 编译器。                             |

[配置环境变量](#4-configure-environment-variables)中的变量含检出专属路径。
切换检出、更换选定的 Python 版本或重建 `python/.venv` 之后，要激活该检出的
环境并重新导出这些变量。确认 shell 解析到的 Python 来自预期检出：

```bash
source python/.venv/bin/activate
command -v python
python --version
```

Fish 中激活用 `source python/.venv/bin/activate.fish`。仅激活不会刷新
`PYO3_PYTHON`，要针对选定的检出重复上面的环境变量命令。

## Cap'n Proto {#capn-proto}

序列化 schema 编译需要 [Cap'n Proto](https://capnproto.org)。所需版本定义在
`.nautilus-engineering/tools.toml`。

按平台安装正确版本：

```bash tab="Script (Linux/macOS)"
./scripts/install-capnp.sh
```

```bash tab="macOS (Homebrew)"
brew install capnp
```

```bash tab="Linux (source)"
CAPNP_VERSION=$(bash scripts/tool-version.sh capnp)
cd ~
wget https://capnproto.org/capnproto-c++-${CAPNP_VERSION}.tar.gz
tar xzf capnproto-c++-${CAPNP_VERSION}.tar.gz
cd capnproto-c++-${CAPNP_VERSION}
./configure
make -j$(nproc)
sudo make install
sudo ldconfig
```

```bash tab="Windows (Chocolatey)"
choco install capnproto
```

验证安装的版本与共享目录一致：

```bash
capnp --version
```

安装脚本确保装的是固定版本。若 Homebrew 或 Chocolatey 提供的是较旧版本，
从源码安装，或参阅
[Cap'n Proto 安装指南](https://capnproto.org/install.html)。

## 更快的构建 {#faster-builds}

Cranelift 代码生成后端可以缩短本地开发、测试与 IDE 检查的构建时间。
它需要 nightly Rust 工具链，并要在本地改动 `Cargo.toml`：

```bash
rustup toolchain install nightly --component rust-analyzer
```

保存下面的补丁，用 `git apply <patch>` 应用；推送改动之前用
`git apply -R <patch>` 撤销。

:::warning
不要提交这些改动。cranelift 补丁仅用于本地开发，推送后会破坏 CI。
:::

```diff
diff --git a/Cargo.toml b/Cargo.toml
--- a/Cargo.toml
+++ b/Cargo.toml
@@ -1,3 +1,5 @@
+cargo-features = ["codegen-backend"]
+
 [workspace]
 resolver = "2"
 members = [
@@ -424,6 +426,7 @@
 lto = false
 panic = "unwind"
 incremental = true
+codegen-backend = "cranelift"
 
 # Compile third-party deps at opt-level=1 in dev/test profiles. Workspace
 # members keep opt-level=0 (fast iteration); deps recompile rarely so the
@@ -444,6 +447,7 @@
 strip = false
 lto = false
 incremental = true
+codegen-backend = "cranelift"
 
 [profile.test.package."*"]
 opt-level = 1
@@ -452,6 +456,7 @@
 inherits = "test"
 debug = false # Improves compile times
 strip = "debuginfo" # Improves compile times
+codegen-backend = "cranelift"
 
 [profile.ci-pr]
 inherits = "test"
```

本地构建命令带 `RUSTUP_TOOLCHAIN=nightly` 运行，例如：

```bash
RUSTUP_TOOLCHAIN=nightly make build-debug
```

使用这个本地补丁时，在 [rust-analyzer 设置](#rust-analyzer-settings)中设置
同样的工具链。

## 服务 {#services}

从仓库根目录初始化 PostgreSQL、Redis 与 pgAdmin：

```bash
make init-services
```

它启动容器并初始化 NautilusTrader 数据库 schema。只启动容器而不重新初始化
schema 用 `make start-services`。只启动单个服务直接用 Compose 文件：

```bash
docker compose -f .docker/docker-compose.yml up -d postgres
```

开发服务有：

- `postgres`：PostgreSQL，默认 `POSTGRES_USER=nautilus`、
  `POSTGRES_PASSWORD=pass`、`POSTGRES_DB=nautilus`。
- `redis`：Redis 服务器。
- `pgadmin`：pgAdmin 4，用于数据库管理与维护。

:::info
这套配置仅用于开发环境。生产环境请使用正规、更安全的部署。
:::

`make stop-services` 停止容器但不删除数据。`make purge-services` 只在确实要
删除开发卷时使用。

基于 PostgreSQL 的测试各自可能维持多个连接。在高核工作站上，本地 nextest
并发可能超过开发容器的连接上限。用 CI profile 对齐 CI 的较低并发：

```bash
NEXTEST_PROFILE=ci make cargo-test-extras
```

想保留更多本地并行度，可显式设置有界的 worker 数，例如：

```bash
NEXTEST_TEST_THREADS=8 make cargo-test-extras
```

## Nautilus CLI 开发者指南 {#nautilus-cli-developer-guide}

Nautilus CLI 是独立的 Rust 二进制，用于 PostgreSQL 管理与仓库的其他操作。
它与 `make build-debug` 或 `make build` 安装的 Python 包互不依赖。

### 构建并选择 CLI {#build-and-select-the-cli}

从当前检出发行安装 CLI：

```bash
make install-cli
```

该目标运行 `cargo install --locked --force`，把 `nautilus` 放进 Cargo 的二进制
目录（通常是 `~/.cargo/bin`）。拉取 `crates/cli`、SQL 初始化代码或 `schema/sql`
的变更后要重新安装，否则已安装的 CLI 可能比检出旧，却在读取检出的较新 schema
文件。

运行依赖仓库的命令之前，先确认 shell 解析到哪个二进制及其版本：

```bash
command -v nautilus
nautilus --version
```

不替换已安装的二进制、直接从检出构建并运行 CLI：

```bash
cargo run --locked --package nautilus-cli --bin nautilus -- --help
```

:::warning
装有 GNOME 的 Linux 系统上，`/usr/bin/nautilus` 通常是 GNOME 文件管理器。
用下列任一方法选中 NautilusTrader CLI：

- 把 `~/.cargo/bin` 放在 `PATH` 中 `/usr/bin` 之前。
- 显式运行 `~/.cargo/bin/nautilus`。
- 在 shell 配置中加入 `alias nautilus="$HOME/.cargo/bin/nautilus"`。

:::

Windows 源码安装需要经由 MSYS2 或 WSL 的 GNU Make。夜间工作流也会发布
Windows x86-64 的 CLI 压缩包。

运行 `nautilus --help` 查看可用的命令组。

### 数据库命令 {#database-commands}

数据库命令的连接设置可以作为命令行参数传入，也可以放在当前工作目录或其
某级父目录的 `.env` 文件里。CLI 也接受相应的环境变量。

| 标志         | 环境变量 | 用途                                                       |
| ------------ | -------------------- | ------------------------------------------------------------- |
| `--host`     | `POSTGRES_HOST`      | 数据库主机。                                                |
| `--port`     | `POSTGRES_PORT`      | 数据库端口。                                                |
| `--username` | `POSTGRES_USERNAME`  | 连接用的管理员，通常是 `postgres` 角色。       |
| `--password` | `POSTGRES_PASSWORD`  | 管理员密码，同时也是应用角色的密码。 |
| `--database` | `POSTGRES_DATABASE`  | 数据库名，也是 `init` 期间创建的应用角色名。     |
| `--schema`   | `SCHEMA_DIR`         | 存放 SQL schema 文件的目录。                    |

例如：

```dotenv
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=pass
POSTGRES_DATABASE=nautilus
```

`nautilus database init` 依据 SQL 文件创建或更新角色与 schema。显式传入 schema
目录，这样重命名的克隆与 worktree 不依赖检出路径探测：

```bash
nautilus database init --schema "$PWD/schema/sql"
```

使用的 CLI 要与这些 schema 文件出自同一检出。初始化设计为可重复运行，
包括上一次中途停止之后。

`nautilus database assign-account` 把在 trader 作用域缓存之前持久化的账户事件
指派给某个 trader。存在这类事件时 Postgres 缓存拒绝连接，因此对该错误列出的
每个账户运行一次：

```bash
nautilus database assign-account --account-id SIM-001 --trader-id TRADER-001
```

:::danger
`nautilus database drop` 会移除目标 schema、权限、角色与存储的数据。只能用于
一次性的数据库，或确认数据可以删除之后。
:::

完整命令语法见 `nautilus database --help`。

## Rust analyzer 设置 {#rust-analyzer-settings}

Rust analyzer 是流行的 Rust 语言服务器，能与许多 IDE 集成。把它的
`VIRTUAL_ENV` 配置为 `python/.venv`。若 PyO3 分析找不到 Python，再按
[配置环境变量](#4-configure-environment-variables)提供 `PYO3_PYTHON` 与
`PYTHONHOME`。下面的示例覆盖 VS Code 与 AstroNvim；其他设置见
[rust-analyzer configuration](https://rust-analyzer.github.io/book/configuration.html)。

```json tab="VSCode"
{
    "rust-analyzer.restartServerOnConfigChange": true,
    "rust-analyzer.linkedProjects": [
        "Cargo.toml"
    ],
    "rust-analyzer.cargo.features": "all",
    "rust-analyzer.check.workspace": false,
    "rust-analyzer.check.extraEnv": {
        "VIRTUAL_ENV": "<path-to-nautilus-trader>/python/.venv",
        "CC": "clang",
        "CXX": "clang++"
    },
    "rust-analyzer.cargo.extraEnv": {
        "VIRTUAL_ENV": "<path-to-nautilus-trader>/python/.venv",
        "CC": "clang",
        "CXX": "clang++"
    },
    "rust-analyzer.runnables.extraEnv": {
        "VIRTUAL_ENV": "<path-to-nautilus-trader>/python/.venv",
        "CC": "clang",
        "CXX": "clang++"
    },
    "rust-analyzer.check.features": "all",
    "rust-analyzer.testExplorer": true
}
```

```lua tab="Neovim (AstroLSP)"
config = {
  rust_analyzer = {
    settings = {
      ["rust-analyzer"] = {
        restartServerOnConfigChange = true,
        linkedProjects = { "Cargo.toml" },
        cargo = {
          features = "all",
          extraEnv = {
            VIRTUAL_ENV = "<path-to-nautilus-trader>/python/.venv",
            CC = "clang",
            CXX = "clang++",
          },
        },
        check = {
          workspace = false,
          command = "check",
          features = "all",
          extraEnv = {
            VIRTUAL_ENV = "<path-to-nautilus-trader>/python/.venv",
            CC = "clang",
            CXX = "clang++",
          },
        },
        runnables = {
          extraEnv = {
            VIRTUAL_ENV = "<path-to-nautilus-trader>/python/.venv",
            CC = "clang",
            CXX = "clang++",
          },
        },
        testExplorer = true,
      },
    },
  },
}
```
