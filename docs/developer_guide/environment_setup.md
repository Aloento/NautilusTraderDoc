# 环境搭建

建议在开发时使用 PyCharm Professional，因为它支持 Cython 语法的解析。作为替代，也可以使用安装了 Cython 扩展的 Visual Studio Code。

[uv](https://docs.astral.sh/uv) 是我们推荐用来管理 Python 虚拟环境和依赖的工具。

[pre-commit](https://pre-commit.com/) 用于在提交时自动运行各类检查、格式化和 lint 工具。

NautilusTrader 日益依赖 [Rust](https://www.rust-lang.org)，因此系统中也应安装 Rust
（参见 [安装指南](https://www.rust-lang.org/tools/install)）。

:::info
NautilusTrader 必须能在 **Linux、macOS 和 Windows** 上编译并运行。请注意代码与脚本的可移植性（例如使用 `std::path::Path` 来处理路径，避免在 shell 脚本中使用只有 Bash 支持的写法等）。
:::

## 快速设置

下面的步骤以类 UNIX 系统为主（仅需执行一次以准备开发环境）。

1. 按照 [安装指南](../getting_started/installation.md) 设置项目，最后一步将用来安装开发与测试依赖的命令做如下修改：

```bash
uv sync --active --all-groups --all-extras
```

或者：

```bash
make install
```

如果你在频繁开发和迭代，采用 debug 编译通常已经足够，而且比完整优化的构建要快得多。
要以 debug 模式安装，请运行：

```bash
make install-debug
```

1. 安装并启用 pre-commit 钩子，之后每次提交时会自动运行相关检查：

```bash
pre-commit install
```

在打开 Pull Request 之前，请在本地运行格式化与 lint 测试，确保 CI 在首次运行时通过：

```bash
make format
make pre-commit
```

务必确保 Rust 编译器报告 **0 错误**——构建失败会拖慢所有人的开发流程。

1. 可选：如果你频繁进行 Rust 开发，建议在 `.cargo/config.toml` 中配置 `PYO3_PYTHON` 为你的 Python 解释器路径，这可以减少基于 IDE 或 rust-analyzer 的 `cargo check` 的重复编译时间：

```bash
PYTHON_PATH=$(which python)
echo -e "\n[env]\nPYO3_PYTHON = \"$PYTHON_PATH\"" >> .cargo/config.toml
```

由于 `.cargo/config.toml` 被纳入版本控制，建议将其本地修改设置为被 Git 忽略（skip worktree）：

```bash
git update-index --skip-worktree .cargo/config.toml
```

如果需要恢复跟踪：

```bash
git update-index --no-skip-worktree .cargo/config.toml
```

## 构建

在修改了任何 `.rs`、`.pyx` 或 `.pxd` 文件后，可通过下列命令重新编译：

```bash
uv run --no-sync python build.py
```

或者：

```bash
make build
```

如果你在频繁迭代，采用 debug 模式编译通常已足够且速度显著更快。
要以 debug 模式编译，请运行：

```bash
make build-debug
```

## 更快的构建（可选）

使用 cranelift 后端可以显著缩短开发、测试与 IDE 检查的编译时间。但 cranelift 目前需要 nightly toolchain 并做一些额外配置。先安装 nightly toolchain：

```bash
rustup install nightly
rustup override set nightly
rustup component add rust-analyzer # install nightly lsp
rustup override set stable # reset to stable
```

在 workspace 的 `Cargo.toml` 中启用 nightly 特性并为 dev/test profile 使用 "cranelift" 后端。下面的 patch 可以用 `git apply <patch>` 应用；在推送前可以用 `git apply -R <patch>` 撤销。

```diff
diff --git a/Cargo.toml b/Cargo.toml
index 62b78cd8d0..beb0800211 100644
--- a/Cargo.toml
+++ b/Cargo.toml
@@ -1,3 +1,6 @@
+# This line needs to come before anything else in Cargo.toml
+cargo-features = ["codegen-backend"]
+
  [workspace]
  resolver = "2"
  members = [
@@ -140,6 +143,7 @@ lto = false
  panic = "unwind"
  incremental = true
  codegen-units = 256
+ codegen-backend = "cranelift"

  [profile.test]
  opt-level = 0
@@ -150,11 +154,13 @@ strip = false
  lto = false
  incremental = true
  codegen-units = 256
+ codegen-backend = "cranelift"

  [profile.nextest]
  inherits = "test"
  debug = false # Improves compile times
  strip = "debuginfo" # Improves compile times
+ codegen-backend = "cranelift"

  [profile.release]
  opt-level = 3
```

在运行类似 `make build-debug` 的命令时传入 `RUSTUP_TOOLCHAIN=nightly`，并在所有 rust-analyzer 的设置中包含该环境以加速构建与 IDE 检查。

## 服务

你可以使用仓库中 `.docker` 目录下的 `docker-compose.yml` 来启动 Nautilus 的开发环境，此操作会启动以下服务：

```bash
docker-compose up -d
```

如果只需要启动部分服务（例如 `postgres`），可以只指定要启动的服务：

```bash
docker-compose up -d postgres
```

使用到的服务包括：

- `postgres`：Postgres 数据库，默认 root 用户（在文档中写作 `POSTRES_USER`）默认为 `postgres`；`POSTGRES_PASSWORD` 默认为 `pass`；`POSTGRES_DB` 默认为 `postgres`。
- `redis`：Redis 服务。
- `pgadmin`：用于数据库管理的 PgAdmin4。

:::info
注意：此容器化配置仅用于开发环境。生产环境请使用更严格、更安全的部署方案。
:::

在服务启动后，需要使用 `psql` 登录并创建名为 `nautilus` 的 Postgres 数据库。
运行命令并输入 docker 服务配置中的 `POSTGRES_PASSWORD`：

```bash
psql -h localhost -p 5432 -U postgres
```

以 `postgres` 管理员身份登录后，执行 `CREATE DATABASE` 命令创建目标数据库（本例使用 `nautilus`）：

```sql
psql (16.2, server 15.2 (Debian 15.2-1.pgdg110+1))
Type "help" for help.

postgres=# CREATE DATABASE nautilus;
CREATE DATABASE
```

## Nautilus CLI 开发指南

## 介绍

Nautilus CLI 是一个用于与 NautilusTrader 生态系统交互的命令行工具，提供管理 PostgreSQL 数据库和处理交易相关操作的命令集合。

:::note
Nautilus CLI 仅在类 UNIX 系统上受支持。
:::

## 安装

可以通过仓库中的 Makefile 目标安装 Nautilus CLI，该目标底层使用 `cargo install`，安装后会将 `nautilus` 可执行文件放入系统 PATH（前提是 Rust 的 `cargo` 已正确配置）。

```bash
make install-cli
```

## 命令

运行 `nautilus --help` 可查看 CLI 的结构与可用命令组：

### Database

这些命令用于初始化 PostgreSQL 数据库。使用时需提供正确的连接配置，可以通过命令行参数或在项目根目录（或当前工作目录）放置一个 `.env` 文件来指定。

- `--host` 或 `POSTGRES_HOST`：数据库主机
- `--port` 或 `POSTGRES_PORT`：数据库端口
- `--user` 或 `POSTGRES_USER`：root 管理员用户名（通常为 `postgres`）
- `--password` 或 `POSTGRES_PASSWORD`：root 管理员密码
- `--database` 或 `POSTGRES_DATABASE`：要创建的数据库名，同时也会作为新用户的名称并授予该用户对该数据库的权限（例如，如果你传入 `nautilus`，则会创建一个名为 `nautilus` 的用户，密码使用 `POSTGRES_PASSWORD`，并将 `nautilus` 数据库归该用户所有）。

示例 `.env` 文件：

```ini
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=pass
POSTGRES_DATABASE=nautilus
```

命令列表示例：

1. `nautilus database init`：引导创建 schema、roles 以及 `schema` 根目录下的所有 SQL 文件（如 `tables.sql`）。
2. `nautilus database drop`：删除目标 Postgres 数据库中的所有表、角色和数据。

## Rust analyzer 设置

Rust analyzer 是流行的 Rust 语言服务器，支持多种 IDE。建议为 rust-analyzer 配置与 `make build-debug` 相同的环境变量，以加快编译速度。下面给出已验证可用的 VSCode 与 Astro Nvim 配置示例。更多信息请见相关 PR 或 rust-analyzer 配置文档。

（参考：相关 PR：[nautechsystems/nautilus_trader#2524](https://github.com/nautechsystems/nautilus_trader/pull/2524)；rust-analyzer 文档：[configuration](https://rust-analyzer.github.io/book/configuration.html)）

### VSCode

可将下面的设置加入 VSCode 的 `settings.json`：

```json
    "rust-analyzer.restartServerOnConfigChange": true,
    "rust-analyzer.linkedProjects": [
        "Cargo.toml"
    ],
    "rust-analyzer.cargo.features": "all",
    "rust-analyzer.check.workspace": false,
    "rust-analyzer.check.extraEnv": {
        "VIRTUAL_ENV": "<path-to-your-virtual-environment>/.venv",
        "CC": "clang",
        "CXX": "clang++"
    },
    "rust-analyzer.cargo.extraEnv": {
        "VIRTUAL_ENV": "<path-to-your-virtual-environment>/.venv",
        "CC": "clang",
        "CXX": "clang++"
    },
    "rust-analyzer.runnables.extraEnv": {
        "VIRTUAL_ENV": "<path-to-your-virtual-environment>/.venv",
        "CC": "clang",
        "CXX": "clang++"
    },
    "rust-analyzer.check.features": "all",
    "rust-analyzer.testExplorer": true
```

### Astro Nvim (Neovim + AstroLSP)

可将下面内容加入 Astro LSP 的配置文件：

```lua
    config = {
      rust_analyzer = {
        settings = {
          ["rust-analyzer"] = {
            restartServerOnConfigChange = true,
            linkedProjects = { "Cargo.toml" },
            cargo = {
              features = "all",
              extraEnv = {
                VIRTUAL_ENV = "<path-to-your-virtual-environment>/.venv",
                CC = "clang",
                CXX = "clang++",
              },
            },
            check = {
              workspace = false,
              command = "check",
              features = "all",
              extraEnv = {
                VIRTUAL_ENV = "<path-to-your-virtual-environment>/.venv",
                CC = "clang",
                CXX = "clang++",
              },
            },
            runnables = {
              extraEnv = {
                VIRTUAL_ENV = "<path-to-your-virtual-environment>/.venv",
                CC = "clang",
                CXX = "clang++",
              },
            },
            testExplorer = true,
          },
        },
      },
```
