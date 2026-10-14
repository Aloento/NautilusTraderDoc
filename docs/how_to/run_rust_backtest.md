# 运行回测（Rust） {#run-a-backtest-rust}

Nautilus 提供两套 Rust 回测 API：`BacktestEngine`（底层）和 `BacktestNode`（高层，支持
数据目录流式加载）。本指南两者都讲。

回测概念、成交模型和撮合引擎行为的背景见[回测](./../concepts/backtesting/index.md)概念指南。
项目设置与 feature flag 见 [Rust](./../concepts/rust.md#project-setup)概念指南。

## 依赖 {#dependencies}

在 `Cargo.toml` 中加入以下内容。`streaming` 和 `nautilus-persistence` 两项只有高层
`BacktestNode` API 才需要。

```toml
[dependencies]
nautilus-backtest = { version = "0.65", features = ["streaming"] }
nautilus-execution = "0.65"
nautilus-model = { version = "0.65", features = ["test-support"] }
nautilus-persistence = "0.65"
nautilus-trading = { version = "0.65", features = ["examples"] }

ahash = "0.8"
anyhow = "1"
tempfile = "3"
ustr = "1"
```

只需要底层 `BacktestEngine` 时，去掉 `streaming`、`nautilus-persistence`、`tempfile` 和 `ustr`。

## BacktestEngine（底层 API） {#backtestengine-low-level-api}

底层 API 提供直接控制：自己构建引擎，添加场所和工具，在内存中加载数据，注册策略，然后运行。

### 1. 创建引擎 {#1-create-the-engine}

```rust
use nautilus_backtest::{config::BacktestEngineConfig, engine::BacktestEngine};

let mut engine = BacktestEngine::new(BacktestEngineConfig::default())?;
```

### 2. 添加场所 {#2-add-a-venue}

`SimulatedVenueConfig` 使用 `bon::Builder`：只需设置必填字段，其余设置都回退到有文档的默认值。
`build()` 会校验配置并返回 `ConfigResult`，需要向上传递或 unwrap。

```rust
use nautilus_backtest::config::SimulatedVenueConfig;
use nautilus_execution::models::fee::{FeeModelAny, MakerTakerFeeModel};
use nautilus_model::{
    enums::{AccountType, BookType, OmsType},
    identifiers::Venue,
    types::Money,
};

engine.add_venue(
    SimulatedVenueConfig::builder()
        .venue(Venue::from("SIM"))
        .oms_type(OmsType::Hedging)
        .account_type(AccountType::Margin)
        .book_type(BookType::L1_MBP)
        .starting_balances(vec![Money::from("1_000_000 USD")])
        .fee_model(FeeModelAny::MakerTaker(MakerTakerFeeModel::zero()).into())
        .build()?,
)?;
```

通过链式 setter 覆盖任何默认值，例如 `.reject_stop_orders(false)` 或 `.allow_cash_borrowing(true)`。

### 3. 添加工具与数据 {#3-add-instruments-and-data}

```rust
use nautilus_model::instruments::{
    Instrument, InstrumentAny, stubs::audusd_sim,
};

let instrument = InstrumentAny::CurrencyPair(audusd_sim());
let instrument_id = instrument.id();
engine.add_instrument(&instrument)?;

let quotes = generate_quotes(instrument_id); // Your data loading function
engine.add_data(quotes, None, true, true)?;
```

### 4. 注册策略并运行 {#4-register-a-strategy-and-run}

```rust
use nautilus_model::types::Quantity;
use nautilus_trading::examples::strategies::EmaCross;

let strategy = EmaCross::new(
    instrument_id,
    Quantity::from("100000"),
    10, // fast EMA period
    20, // slow EMA period
);

engine.add_strategy(strategy)?;
engine.run(None, None, None, false)?;
```

### 运行完整示例 {#run-the-full-example}

```bash
cargo run -p nautilus-backtest --features examples --example engine-ema-cross
```

源码：
[`crates/backtest/examples/engine_ema_cross.rs`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/backtest/examples/engine_ema_cross.rs)

## BacktestNode（高层 API） {#backtestnode-high-level-api}

高层 API 从 `ParquetDataCatalog` 加载数据，按可配置的块大小流式读入。需要为
`nautilus-backtest` 启用 `streaming` feature。

### 1. 写入数据到目录 {#1-write-data-to-a-catalog}

```rust
use nautilus_model::instruments::{
    Instrument, InstrumentAny, stubs::audusd_sim,
};
use nautilus_persistence::backend::parquet::catalog::ParquetDataCatalog;
use tempfile::TempDir;

let instrument = InstrumentAny::CurrencyPair(audusd_sim());
let instrument_id = instrument.id();
let quotes = generate_quotes(instrument_id);

let temp_dir = TempDir::new()?;
let catalog_path = temp_dir.path().to_str()
    .context("temp dir path is not valid UTF-8")?
    .to_string();
let catalog = ParquetDataCatalog::new(
    temp_dir.path(), None, None, None, None,
);

catalog.write_instruments(vec![instrument])?;
catalog.write_to_parquet(&quotes, None, None, None)?;
```

### 2. 配置运行 {#2-configure-the-run}

```rust
use nautilus_backtest::config::{
    BacktestDataConfig, BacktestRunConfig, BacktestVenueConfig, NautilusDataType,
};
use nautilus_model::enums::{AccountType, BookType, OmsType};

let venue_config = BacktestVenueConfig::builder()
    .name("SIM")
    .oms_type(OmsType::Hedging)
    .account_type(AccountType::Margin)
    .book_type(BookType::L1_MBP)
    .starting_balances(vec!["1_000_000 USD".to_string()])
    .build()?;

let data_config = BacktestDataConfig::builder()
    .data_type(NautilusDataType::QuoteTick)
    .catalog_path(catalog_path)
    .instrument_id(instrument_id)
    .build()?;

let run_config = BacktestRunConfig::builder()
    .id("ema-cross-run".to_string())
    .venues(vec![venue_config])
    .data(vec![data_config])
    .chunk_size(100)
    .build()?;
```

### 3. 构建、添加策略并运行 {#3-build-add-strategies-and-run}

```rust
use nautilus_backtest::node::BacktestNode;
use nautilus_model::types::Quantity;
use nautilus_trading::examples::strategies::EmaCross;

let mut node = BacktestNode::new(vec![run_config])?;
node.build()?;

let engine = node.get_engine_mut("ema-cross-run")
    .context("engine not found for run config ID")?;
let strategy = EmaCross::new(
    instrument_id,
    Quantity::from("100000"),
    10,
    20,
);
engine.add_strategy(strategy)?;

node.run()?;
```

### 运行完整示例 {#run-the-full-example-1}

```bash
cargo run -p nautilus-backtest --features examples,streaming --example node-ema-cross
```

源码：
[`crates/backtest/examples/node_ema_cross.rs`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/backtest/examples/node_ema_cross.rs)
