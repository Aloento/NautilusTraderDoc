# Rust

Nautilus 在 `crates/` 目录下有完整的 Rust 实现。不用 Python 也能编写 actor、策略，运行回测和实时交易。领域模型与 Python 包共用，Python 用户组件通过 PyO3 运行在同一个 Rust 引擎上。

:::warning
Rust API 仍在积极开发中。方法签名和 trait 要求可能随版本变化。
:::

## 系统实现 {#system-implementations}

Nautilus 有两条路径，按期望的编写与部署方式选择。

- **Rust**：`crates/` 下的纯 Rust，无需 Python 即可运行。
- **Python**：[Python 用户组件](./python.md)通过 `python/nautilus_trader/` 下的 PyO3 绑定运行在 Rust 核心上。

### 能力矩阵 {#capability-matrix}

| 组件            | Rust | Python |
| --------------- | ---- | ------ |
| Strategy        | ✓    | ✓      |
| Actor           | ✓    | ✓      |
| DataEngine      | ✓    | ✓      |
| ExecutionEngine | ✓    | ✓      |
| RiskEngine      | ✓    | ✓      |
| BacktestEngine  | ✓    | ✓      |
| BacktestNode    | ✓    | ✓      |
| LiveNode        | ✓    | ✓      |
| OrderEmulator   | ✓    | ✓      |
| 撮合引擎        | ✓    | ✓      |
| Portfolio       | ✓    | ✓      |
| 账户            | ✓    | ✓      |
| Cache           | ✓    | ✓      |
| MessageBus      | ✓    | ✓      |
| 数据目录        | ✓    | ✓      |
| 指标            | ✓    | ✓      |
| 执行算法        | TWAP | TWAP   |
| Controller      | -    | ✓      |
| Tearsheets      | -    | ✓      |

:::note
Controller 运行时以 Rust 实现，为 Python 的 `Controller` 基类提供支持。矩阵中对 Rust 标记为缺失，是因为受支持的注册路径（可导入的 controller 配置）仅限 Python。
:::

### 适配器 {#adapters}

| 适配器              | Rust | Python |
| ------------------- | ---- | ------ |
| Architect AX        | ✓    | ✓      |
| Betfair             | ✓    | ✓      |
| Binance             | ✓    | ✓      |
| Blockchain          | ✓    | ✓      |
| Bybit               | ✓    | ✓      |
| Coinbase            | ✓    | ✓      |
| Databento           | ✓    | ✓      |
| Deribit             | ✓    | ✓      |
| Derive              | ✓    | ✓      |
| dYdX                | ✓    | ✓      |
| Hyperliquid         | ✓    | ✓      |
| Interactive Brokers | ✓    | ✓      |
| Kraken              | ✓    | ✓      |
| Lighter             | ✓    | ✓      |
| OKX                 | ✓    | ✓      |
| Polymarket          | ✓    | ✓      |
| Sandbox             | ✓    | ✓      |
| Tardis              | ✓    | ✓      |

### 如何选择 {#choosing-a-path}

- **Rust** 提供无 Python 运行时的原生性能。核心交易功能全部可用。适合对延迟敏感的部署，或偏好编译型语言的团队。
- **Python** 保留 Python 的编写体验。用户组件（actor、策略）运行在 Rust 核心上完成数据处理与执行。

## 项目设置 {#project-setup}

Nautilus 的 crate 已发布到
[crates.io](https://crates.io/crates/nautilus-backtest)。把它们加入你的
`Cargo.toml`：

```toml
[dependencies]
nautilus-backtest = "0.65"
nautilus-common = "0.65"
nautilus-execution = "0.65"
nautilus-model = { version = "0.65", features = ["test-support"] }
nautilus-trading = { version = "0.65", features = ["examples"] }

anyhow = "1"
log = "0.4"
```

实时交易需加上 live crate 和你所用交易场所的适配器：

```toml
[dependencies]
nautilus-live = "0.65"
nautilus-okx = "0.65"
```

要跟随最新开发分支，把所有 Nautilus 依赖指向同一个 git 源，避免 crates.io 与 git 版本之间的类型不匹配：

```toml
[dependencies]
nautilus-backtest = { git = "https://github.com/nautechsystems/nautilus_trader.git", branch = "develop" }
nautilus-common = { git = "https://github.com/nautechsystems/nautilus_trader.git", branch = "develop" }
nautilus-execution = { git = "https://github.com/nautechsystems/nautilus_trader.git", branch = "develop" }
nautilus-model = { git = "https://github.com/nautechsystems/nautilus_trader.git", branch = "develop", features = ["test-support"] }
nautilus-trading = { git = "https://github.com/nautechsystems/nautilus_trader.git", branch = "develop", features = ["examples"] }
```

最低支持 Rust 版本（MSRV）为 **1.99.0**。

### Feature 标志 {#feature-flags}

| 标志             | Crate               | 效果                                                 |
| ---------------- | ------------------- | ---------------------------------------------------- |
| `high-precision` | `nautilus-model`    | 16 位定点精度（默认 9 位）。                         |
| `test-support`   | `nautilus-model`    | 测试夹具、builder、specs 和默认值。                  |
| `examples`       | `nautilus-trading`  | 示例策略（`EmaCross`、`GridMarketMaker`）。          |
| `streaming`      | `nautilus-backtest` | `BacktestNode` 基于数据目录的数据流式加载。          |
| `defi`           | `nautilus-model`    | DeFi 数据类型。隐含 `high-precision`。               |

:::tip
标准 9 位精度足以应对大多数传统金融工具。
加密货币场所的价格或数量需要超过九位小数时，启用 `high-precision`。
:::

### 内存分配器 {#memory-allocator}

`nautilus` CLI 和 Python wheel 使用 [mimalloc](https://crates.io/crates/mimalloc) 承担 Rust
分配。Rust 二进制自行选择分配器，因此你的二进制要匹配的话需自行加入 mimalloc：

```toml
[dependencies]
mimalloc = "0.1"
```

```rust
use mimalloc::MiMalloc;
use nautilus_common::logging::headers::register_allocator_mimalloc;

#[global_allocator]
static GLOBAL: MiMalloc = MiMalloc;

fn main() {
    register_allocator_mimalloc();
}
```

声明 `GLOBAL` 即选用 mimalloc。在 `main` 开头、构造 Nautilus 节点之前调用 `register_allocator_mimalloc`，
版本头部即可报告 `allocator: mimalloc <version>`。注册**只更新头部元数据**，
并不选择分配器。

使用默认系统分配器也可以。比较分配器选择时，请在你的负载和平台上实测吞吐量与常驻内存。
背景见[架构指南](./architecture.md#memory-allocation)。

## Actor {#actors}

actor 接收行情、自定义数据/信号和系统事件，但不管理订单。实现 `DataActor` trait，并用 `nautilus_actor!` 把你的 `DataActorCore` 字段接入运行时契约。你的类型要实现或派生 `Debug`，宏负责提供原生的运行时接线。

用户代码通常使用 `DataActor` 的门面（facade）方法完成订阅、缓存访问和时钟访问。

### Handler 方法 {#handler-methods}

重写 `DataActor` trait 上的任意 handler 即可接收对应的数据或事件。所有 handler 都有默认空实现，只需重写用到的。

| Handler                | 接收内容                  |
| ---------------------- | ------------------------- |
| `on_start`             | actor 已启动。            |
| `on_stop`              | actor 已停止。            |
| `on_quote`             | `QuoteTick`               |
| `on_trade`             | `TradeTick`               |
| `on_bar`               | `Bar`                     |
| `on_book_deltas`       | `OrderBookDeltas`         |
| `on_book`              | `OrderBook`（按间隔）     |
| `on_instrument`        | `InstrumentAny`           |
| `on_mark_price`        | `MarkPriceUpdate`         |
| `on_index_price`       | `IndexPriceUpdate`        |
| `on_funding_rate`      | `FundingRateUpdate`       |
| `on_option_greeks`     | `OptionGreeks`            |
| `on_option_chain`      | `OptionChainSlice`        |
| `on_instrument_status` | `InstrumentStatus`        |
| `on_time_event`        | `TimeEvent`               |

分步教程见
[编写 Actor（Rust）](./../how_to/write_rust_actor.md)操作指南。
完整示例见
[`BookImbalanceActor`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/trading/src/examples/actors/imbalance)。

## 策略 {#strategies}

策略在 actor 之上增加订单管理。实现 `DataActor` 处理数据，并用 `nautilus_strategy!` 把你的 `StrategyCore` 字段接入策略运行时契约。`StrategyCore` 存储运行时的策略状态；运行时注册需要宏生成的原生接线。

常规策略逻辑通过 `Strategy` 方法和 `self` 上的门面方法访问该状态。策略还会重写 `Strategy` trait 上的订单事件 handler，如 `on_order_filled`（`OrderFilled`）和 `on_order_canceled`（`OrderCanceled`）。

### 订单管理 {#order-management}

`Strategy` trait 通过门面提供订单方法：

| 方法                  | 动作                                      |
| --------------------- | ----------------------------------------- |
| `submit_order`        | 向交易场所提交新订单。                    |
| `submit_order_list`   | 提交一组或有订单（contingent orders）。   |
| `modify_order`        | 修改价格、数量或触发价。                  |
| `cancel_order`        | 撤销指定订单。                            |
| `cancel_orders`       | 撤销一批按条件筛选的订单。                |
| `cancel_all_orders`   | 撤销某金融工具的全部订单。                |
| `close_position`      | 用市价单平掉持仓。                        |
| `close_all_positions` | 平掉全部未平仓持仓。                      |

`OrderApi`（通过 `self.order()` 访问）用于构建订单和订单列表：

- `generate_client_order_id`
- `generate_order_list_id`
- `market`
- `limit`
- `stop_market`
- `stop_limit`
- `market_to_limit`
- `market_if_touched`
- `limit_if_touched`
- `trailing_stop_market`
- `trailing_stop_limit`
- `bracket`
- `create_list`

### 缓存与时钟访问 {#cache-and-clock-access}

缓存和时钟访问通过不同接口报告借用冲突：

- 缓存门面的 `try_*` 查找遇到借用冲突时返回查找错误的 `Access` 变体。`NotFound` 仍表示请求的数据不存在。
- 缓存门面的 `get()` 方法和原生支撑的时钟调度方法通过 `anyhow::Result` 返回访问错误。
- 现有的"保证不失败"访问器冲突时仍会 panic。

重试前先释放冲突的借用。这些错误不会推迟回调，也不会改变回调的投递顺序。

### 核心接线宏 {#core-wiring-macros}

Rust 的 actor、策略和执行算法把运行时核心保留为结构体字段，宏告诉 trait 该字段在哪里。

| 宏                                             | 核心字段               | 生成内容                        |
| ---------------------------------------------- | ---------------------- | ------------------------------- |
| `nautilus_actor!(Type)`                        | `DataActorCore`        | 运行时接线。                    |
| `nautilus_strategy!(Type)`                     | `StrategyCore`         | 运行时接线和 `Strategy`。       |
| `nautilus_execution_algorithm!(Type, { ... })` | `ExecutionAlgorithmCore` | 运行时接线和算法。            |

宏默认期望一个名为 `core` 的字段，必要时把字段名作为第二个参数传入。宏不会让 actor、策略或 `StrategyCore` deref 到运行时内部。执行算法宏要求传入 `on_order()` 实现块，因为该方法定义算法必需的订单处理。

### 原生 trait {#native-traits}

默认使用门面方法：

- `actor_id()`
- `trader_id()`
- `is_registered()`
- `config()`
- `strategy_id()`
- `clock()`
- `cache()`
- `order()`
- `portfolio()`

`DataActorNative`、`StrategyNative` 和 `ExecutionAlgorithmNative` 用于门面之下的原生专有访问。本节记录的是引擎、运行时和显式延迟敏感的原生 Rust 代码，不是可移植的编写路径。

| 编写路径              | 用原生 trait？   | 常规 API                          |
| --------------------- | ---------------- | --------------------------------- |
| 原生 Rust 二进制      | 仅在需要时       | `Strategy` 和 `DataActor` 门面。  |
| 从 Python 启动的 Rust | 仅在需要时       | 与原生 Rust 相同。                |
| Python 编写的组件     | 否               | 只用门面。                        |

原生 trait 暴露借用的核心状态、`Rc<RefCell<_>>` 和运行时引用。当原生 Rust 代码在明确的延迟敏感路径上有意接受这些借用规则时才使用它们。

引擎、运行时、注册、PyO3 和 testkit 代码在需要 actor-core、strategy-core 或 execution-algorithm-core 访问时可以导入 `DataActorNative`、`StrategyNative` 或 `ExecutionAlgorithmNative`。这些类型不跨越 Python 边界。不要在普通的可移植 actor、策略或执行算法逻辑，以及 Python 编写的组件中使用它们。

`ExecutionAlgorithmCore` 拥有一个 `DataActorCore`，但不会 deref 到它。
常规执行算法逻辑应使用 `id()`、`actor_id()`、
`trader_id()`、`clock()` 和 `cache()`。只有代码确实需要原生执行算法状态时，才使用 `ExecutionAlgorithmNative`。

选择最小的原生句柄，并让每次借用保持最小作用域。常规策略订单构造用 `order()`，只有原生代码确实需要原始可变工厂借用时才用
`order_factory()`。

#### `DataActorNative` 方法 {#dataactornative-methods}

| 原生方法      | 返回类型                   | 适用场景                        |
| ------------- | -------------------------- | ------------------------------- |
| `core()`      | `&DataActorCore`           | 读取 actor 内部状态。           |
| `core_mut()`  | `&mut DataActorCore`       | 修改 actor 内部状态。           |
| `clock_mut()` | `RefMut<'_, dyn Clock>`    | 需要可变的时钟借用。            |
| `clock_rc()`  | `Rc<RefCell<dyn Clock>>`   | 存储或传递共享时钟。            |
| `cache_ref()` | `Ref<'_, Cache>`           | 需要短暂的实时缓存读取。        |
| `cache_rc()`  | `Rc<RefCell<Cache>>`       | 修改、存储或传递缓存。          |

用 `try_cache_ref()` 和 `try_clock_mut()` 处理失败的原生借用而不 panic。`ComponentAccessError` 从 `nautilus_common::component` 导入：

- 缓存被可变借用时，`try_cache_ref()` 返回 `ComponentAccessError::ReadConflict`。
- 时钟已被借用时，`try_clock_mut()` 返回 `ComponentAccessError::WriteConflict`。
- 注册尚未提供该资源时，两者都返回 `ComponentAccessError::NotRegistered`。

错误会指出涉及的资源和尝试的操作。回调重入可能引发冲突，但仅有冲突并不能断定就是重入所致。消息含义与纠正措施见[重入诊断](./../developer_guide/callback_dispatch.md#reentrancy-and-dispatch-diagnostics)。

#### `StrategyNative` 方法 {#strategynative-methods}

| 原生方法              | 返回类型                      | 适用场景                        |
| --------------------- | ----------------------------- | ------------------------------- |
| `strategy_core()`     | `&StrategyCore`               | 读取策略内部状态。              |
| `strategy_core_mut()` | `&mut StrategyCore`           | 修改策略内部状态。              |
| `order_factory()`     | `RefMut<'_, OrderFactory>`    | 需要原始可变工厂借用。          |
| `order_factory_rc()`  | `Rc<RefCell<OrderFactory>>`   | 存储或传递工厂。                |
| `portfolio_rc()`      | `Rc<RefCell<Portfolio>>`      | 存储或传递投资组合。            |

#### `ExecutionAlgorithmNative` 方法 {#executionalgorithmnative-methods}

| 原生方法                      | 返回类型                        | 适用场景                              |
| ----------------------------- | ------------------------------- | ------------------------------------- |
| `exec_algorithm_core()`       | `&ExecutionAlgorithmCore`       | 读取执行算法内部状态。                |
| `exec_algorithm_core_mut()`   | `&mut ExecutionAlgorithmCore`   | 修改执行算法内部状态。                |

分步教程见
[编写策略（Rust）](./../how_to/write_rust_strategy.md)操作指南。
完整示例见
[`EmaCross`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/trading/src/examples/strategies/ema_cross)
和
[`GridMarketMaker`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/trading/src/examples/strategies/grid_mm)。

### 运行 Rust 组件 {#running-rust-components}

Rust 策略和 actor 有两条运行路径。下面的示例使用策略，捆绑的 actor 走同样的模式：纯 Rust 用 `add_actor`，从 Python 用 `add_builtin_actor`。

#### 纯 Rust {#pure-rust}

用 Rust 编写策略和 `main` 函数，`cargo build` 构建独立二进制。这条路径不需要 Python 运行时。

```rust
let strategy = GridMarketMaker::new(config);
node.add_strategy(strategy)?;
node.run().await?;
```

完整流程见
[运行实时交易（Rust）](./../how_to/run_rust_live_trading.md)。

#### 从 Python 使用内置示例 {#built-in-examples-from-python}

向 `add_builtin_strategy` 传入类型名和配置，即可从 Python 注册内置示例策略。这条路径的存在，是为了让捆绑示例策略代码在 Rust 与 Python 的文档、示例和测试中保持单一来源。它不是添加原生策略的一等扩展路径，自定义原生组件请用纯 Rust。

```python
from nautilus_trader.trading import GridMarketMakerConfig

config = GridMarketMakerConfig(
    instrument_id=InstrumentId.from_str("BTC-USDT-SWAP.OKX"),
    max_position=Quantity.from_str("10.0"),
    trade_size=Quantity.from_str("0.1"),
    num_levels=5,
    grid_step_bps=15,
)

node.add_builtin_strategy("GridMarketMaker", config)
```

内置策略配置：

| 配置                         | 策略                   |
| ---------------------------- | ---------------------- |
| `CompositeMarketMakerConfig` | `CompositeMarketMaker` |
| `DeltaNeutralVolConfig`      | `DeltaNeutralVol`      |
| `EmaCrossConfig`             | `EmaCross`             |
| `ExecTesterConfig`           | `ExecTester`           |
| `GridMarketMakerConfig`      | `GridMarketMaker`      |
| `HurstVpinDirectionalConfig` | `HurstVpinDirectional` |

示例和测试使用的 actor 走 `add_builtin_actor`，遵循同样的"仅限捆绑"规则。

内置 actor 配置（通过 `add_builtin_actor`）：

| 配置                       | Actor                |
| -------------------------- | -------------------- |
| `BookImbalanceActorConfig` | `BookImbalanceActor` |
| `DataTesterConfig`         | `DataTester`         |

## 回测 {#backtesting}

两套 API 的带注释教程见
[运行回测（Rust）](./../how_to/run_rust_backtest.md)操作指南。

### `BacktestEngine`（低层 API） {#backtestengine-low-level-api}

构造引擎、添加交易场所和金融工具、加载数据、注册策略，然后运行。完整可运行示例：

```bash
cargo run -p nautilus-backtest --features examples --example engine-ema-cross
```

源码：
[`crates/backtest/examples/engine_ema_cross.rs`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/backtest/examples/engine_ema_cross.rs)

### `BacktestNode`（高层 API） {#backtestnode-high-level-api}

从 `ParquetDataCatalog` 加载数据，支持按可配置的分块大小流式读取。需要为 `nautilus-backtest` 启用 `streaming` feature。完整可运行示例：

```bash
cargo run -p nautilus-backtest --features examples,streaming --example node-ema-cross
```

源码：
[`crates/backtest/examples/node_ema_cross.rs`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/backtest/examples/node_ema_cross.rs)

## 实时交易 {#live-trading}

带注释的教程见
[运行实时交易（Rust）](./../how_to/run_rust_live_trading.md)操作指南。

`LiveNode` 通过适配器客户端连接真实交易场所和数据源。用 builder 模式配置数据与执行客户端，`run()` 启动异步事件循环。各适配器提供自己的工厂和配置类型。

| 适配器              | 示例                                          |
| ------------------- | --------------------------------------------- |
| Architect AX        | `crates/adapters/architect_ax/examples/`      |
| Betfair             | `crates/adapters/betfair/examples/`           |
| Binance             | `crates/adapters/binance/examples/`           |
| Blockchain          | `crates/adapters/blockchain/examples/`        |
| Bybit               | `crates/adapters/bybit/examples/`             |
| Coinbase            | `crates/adapters/coinbase/examples/`          |
| Databento           | `crates/adapters/databento/examples/`         |
| Deribit             | `crates/adapters/deribit/examples/`           |
| Derive              | `crates/adapters/derive/examples/`            |
| dYdX                | `crates/adapters/dydx/examples/`              |
| Hyperliquid         | `crates/adapters/hyperliquid/examples/`       |
| Interactive Brokers | `crates/adapters/interactive_brokers/examples/` |
| Kraken              | `crates/adapters/kraken/examples/`            |
| Lighter             | `crates/adapters/lighter/examples/`           |
| OKX                 | `crates/adapters/okx/examples/`               |
| Polymarket          | `crates/adapters/polymarket/examples/`        |
| Sandbox             | `crates/adapters/sandbox/examples/`           |
| Tardis              | `crates/adapters/tardis/examples/`            |

多数适配器都带有 `node_data_tester.rs` 和 `node_exec_tester.rs`
示例，用于针对真实交易场所测试数据请求、数据流和订单执行。

## 相关指南 {#related-guides}

- [Python](./python.md) - Python 所有权、运行时与公共 API 边界。
- [编写 Actor（Rust）](./../how_to/write_rust_actor.md) - Actor 分步教程。
- [编写策略（Rust）](./../how_to/write_rust_strategy.md) - 策略分步教程。
- [运行回测（Rust）](./../how_to/run_rust_backtest.md) - BacktestEngine 与 BacktestNode 用法。
- [运行实时交易（Rust）](./../how_to/run_rust_live_trading.md) - LiveNode 设置与场所连接。
- [架构](./architecture.md) - 系统设计与数据/执行流。
- [Actor](./actors.md) - Actor 概念（Python 与 Rust 通用）。
- [策略](./strategies.md) - 策略概念与 handler 参考。
- [事件](./events/index.md) - 事件类型与 handler 分发。
- [回测](./backtesting/index.md) - 回测概念与撮合引擎行为。
