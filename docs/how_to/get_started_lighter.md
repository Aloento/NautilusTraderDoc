# Lighter 快速上手 {#get-started-with-lighter}

Lighter 通过 Rust 引擎提供。你可以在纯 Rust 项目中使用，也可以在 Python 中通过 PyO3 绑定
使用——绑定把同一套 Rust 数据与执行客户端暴露给 Python 的 `LiveNode`。

最短路径是先用公共数据。数据订阅跑通后，再加上执行凭据，然后接入一个能提交订单的策略。

## 选择搭建路径 {#choose-a-setup-path}

| 路径        | 适用场景                                          | 第一步                                     |
| :---------- | :------------------------------------------------ | :----------------------------------------- |
| 纯 Rust     | 想要编译型应用，不依赖 Python 运行时。            | 复制 Rust 快速上手示例。                   |
| Python      | 想在 Rust 引擎上跑 Python 脚本。                  | 运行 Python 数据测试器。                   |
| RWA 示例    | 想要 Databento 信号数据加 Lighter 交易。          | 阅读组合做市教程。                         |

从这些文件开始：

- Rust 快速上手：`examples/quickstarts/lighter-rust-data-client/`。
- Python 数据测试器：`examples/live/lighter/data_tester.py`。
- RWA 教程：[组合做市教程][lighter-rwa-composite-mm]。

Rust 和 Python 两条路径都用到这些组件：

- `LighterDataClientConfig` 选择 Lighter 或 Robinhood 部署、mainnet 或 testnet、可选的自定义
  场所，以及可选的传输设置。
- `LighterExecutionClientConfig` 增加账户 ID 并解析凭据。其账户签发方必须与解析出的场所一致。
- `LighterDataClientFactory` 和 `LighterExecutionClientFactory` 向 `LiveNode` 注册客户端。
- `DataTester` 和 `ExecTester` 在你编写自定义策略之前提供冒烟测试 Actor。

## 纯 Rust 起步 {#pure-rust-starter}

把快速上手示例复制到自己的工作区：

```bash
cp -R examples/quickstarts/lighter-rust-data-client ~/lighter-rust-data-client
cd ~/lighter-rust-data-client
cargo run
```

它会构建一个 `LiveNode`，注册 Lighter 数据客户端，添加一个 `DataTester`，并连接 testnet 公共
流。按 Ctrl+C 停止。

核心设置使用 builder，可选默认值会自动填充：

```rust
let data_config = LighterDataClientConfig::builder()
    .environment(LighterEnvironment::Testnet)
    .build();

let mut node = LiveNode::builder(trader_id, Environment::Live)?
    .with_name("LIGHTER-DATA-STARTER-001".to_string())
    .add_data_client(
        None,
        Box::new(LighterDataClientFactory::new()),
        Box::new(data_config),
    )?
    .build()?;
```

数据路径走通后，在调用 `.build()` 之前向 builder 添加执行客户端：

```rust
let exec_config = LighterExecutionClientConfig::builder()
    .account_id(account_id)
    .environment(LighterEnvironment::Testnet)
    .build();

let mut node = LiveNode::builder(trader_id, Environment::Live)?
    .with_name("LIGHTER-EXEC-STARTER-001".to_string())
    .add_data_client(
        None,
        Box::new(LighterDataClientFactory::new()),
        Box::new(data_config),
    )?
    .add_exec_client(
        None,
        Box::new(LighterExecutionClientFactory::new()),
        Box::new(exec_config),
    )?
    .build()?;
```

执行方面，先按
[账户与 API key 设置](./../integrations/lighter.md#account-and-api-key-setup)操作，然后在连接前
设置对应的环境变量：

```bash
export LIGHTER_TESTNET_ACCOUNT_INDEX="123456"
export LIGHTER_TESTNET_API_KEY_INDEX="4"
export LIGHTER_TESTNET_API_SECRET="your-lighter-api-secret"
```

部署与环境决定凭据命名空间：

| 部署       | 环境        | 凭据前缀                      |
| ---------- | ----------- | ----------------------------- |
| Lighter    | Mainnet     | `LIGHTER_*`                   |
| Lighter    | Testnet     | `LIGHTER_TESTNET_*`           |
| Robinhood  | Mainnet     | `LIGHTER_ROBINHOOD_*`         |
| Robinhood  | Testnet     | `LIGHTER_ROBINHOOD_TESTNET_*` |

每个命名空间都提供 `ACCOUNT_INDEX`、`API_KEY_INDEX` 和 `API_SECRET`。

## Python 起步 {#python-starter}

Python 通过 PyO3 使用 Rust 引擎。在源码检出目录之外安装 Python 开发 wheel，或先从源码构建
包，再运行这些示例。见 [Python 安装][python-install]。

在仓库根目录、Python 已安装的情况下：

```bash
uv run --project python --no-sync python examples/live/lighter/data_tester.py
```

脚本会立即连接 Lighter Testnet 并开始接收数据流。部署、环境和金融工具是文件顶部的模块级常量。

Python 脚本与 Rust 设置一一对应：

```python
builder = LiveNode.builder(
    "LIGHTER-DATA-TESTER-001",
    TraderId.from_str("TESTER-001"),
    Environment.LIVE,
).add_data_client(
    VENUE,
    LighterDataClientFactory(),
    LighterDataClientConfig(
        environment=LighterEnvironment.TESTNET,
        deployment=LighterDeployment.LIGHTER,
    ),
)
```

数据测试器跑通后再使用执行测试器：

```bash
uv run --project python --no-sync python examples/live/lighter/exec_tester.py
```

执行测试器同样会立即连接，且默认会下真实订单（`dry_run=False`，模块顶部有警告）。默认环境是
testnet；设置 `LIGHTER_DEPLOYMENT` 和 `LIGHTER_ENVIRONMENT` 可选择目标部署与环境。

## 过渡到策略 {#move-to-a-strategy}

起步路径验证了客户端接线、订阅和凭据查找。下一步是用策略替换测试器：

- 纯 Rust 策略见[编写策略（Rust）](./write_rust_strategy.md)。
- Python 节点接线加内置 Rust `CompositeMarketMaker` 策略，见
  `examples/live/lighter/nvda_composite_mm.py`。
- 需要完整的 Databento 信号设置时，阅读
  [Lighter RWA 上的组合做市][lighter-rwa-composite-mm]。

:::warning
Rust 执行示例自带 `DRY_RUN = false`，一运行就可能提交真实订单。把 `DRY_RUN` 设为 `true` 可以
只连接不提交订单。Python 执行示例同样一运行就提交真实订单。请从 testnet 起步或使用允许的最小
数量，并在运行前确认金融工具、部署、环境、账户 index、API key index 和私钥。
:::

紧急清理时，`cargo run --bin lighter-flatten -p nautilus-lighter` 会取消所选部署账户的未结订单
并平掉持仓。使用前先停止其他会写该账户的进程，并阅读
[紧急账户清理](./../integrations/lighter.md#emergency-account-cleanup)。该工具提交一次账户级
全量取消和一次平仓。账户变平之前它不做对账。

[lighter-rwa-composite-mm]: https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/tutorials/lighter_rwa_composite_mm.md
[python-install]: https://github.com/nautechsystems/nautilus_trader/blob/develop/docs/getting_started/installation.md#development-wheels
