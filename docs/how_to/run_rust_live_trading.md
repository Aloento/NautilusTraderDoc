# 运行实时交易（Rust） {#run-live-trading-rust}

`LiveNode` 通过适配器客户端连接真实交易场所和数据源。本指南以 OKX 为例，走一遍完整的实时
交易设置。

节点生命周期见[实时交易](./../concepts/live.md)。命令结果见
[执行政策](./../concepts/execution/policies.md#command-outcomes)。状态恢复见
[执行对账](./../concepts/execution/reconciliation.md)。项目设置与 feature flag 见
[Rust](./../concepts/rust.md#project-setup)概念指南。

## 依赖 {#dependencies}

在 `Cargo.toml` 中加入 live crate、你的场所适配器和支持 crate：

```toml
[dependencies]
nautilus-common = "0.65"
nautilus-live = "0.65"
nautilus-model = "0.65"
nautilus-okx = "0.65"
nautilus-trading = { version = "0.65", features = ["examples"] }

anyhow = "1"
dotenvy = "0.15"
log = "0.4"
tokio = { version = "1", features = ["full"] }
```

## 构建节点 {#build-the-node}

`LiveNode` 使用 builder 模式。为你的场所添加数据与执行客户端工厂，配置日志，然后构建。

```rust
use log::LevelFilter;
use nautilus_common::{enums::Environment, logging::logger::LoggerConfig};
use nautilus_live::node::LiveNode;
use nautilus_model::identifiers::{AccountId, TraderId};
use nautilus_okx::{
    common::enums::OKXInstrumentType,
    config::{OKXDataClientConfig, OKXExecutionClientConfig},
    factories::{OKXDataClientFactory, OKXExecutionClientFactory},
};

let trader_id = TraderId::from("TESTER-001");
let account_id = AccountId::from("OKX-001");

let data_config = OKXDataClientConfig::builder()
    .instrument_types(vec![OKXInstrumentType::Swap])
    .build();

let exec_config = OKXExecutionClientConfig::builder()
    .account_id(account_id)
    .instrument_types(vec![OKXInstrumentType::Swap])
    .build();

let log_config = LoggerConfig {
    stdout_level: LevelFilter::Info,
    ..Default::default()
};

let mut node = LiveNode::builder(trader_id, Environment::Live)?
    .with_name("MY-NODE-001".to_string())
    .with_logging(log_config)
    .add_data_client(
        None,
        Box::new(OKXDataClientFactory::new()),
        Box::new(data_config),
    )?
    .add_exec_client(
        None,
        Box::new(OKXExecutionClientFactory::new()),
        Box::new(exec_config),
    )?
    .with_reconciliation(false) // Simplified; enable in production
    .with_delay_post_stop_secs(5)
    .build()?;
```

:::warning
为简单起见，本示例禁用了对账。生产环境请移除
`.with_reconciliation(false)`，让引擎在启动时把缓存状态与场对齐。见
[执行对账](./../concepts/execution/reconciliation.md)。
:::

## 添加策略并运行 {#add-strategies-and-run}

```rust
use nautilus_model::{identifiers::InstrumentId, types::Quantity};
use nautilus_trading::examples::strategies::{
    GridMarketMaker, GridMarketMakerConfig,
};

let mut config = GridMarketMakerConfig::builder()
    .instrument_id(InstrumentId::from("ETH-USDT-SWAP.OKX"))
    .max_position(Quantity::from("0.10"))
    .num_levels(3)
    .grid_step_bps(100)
    .skew_factor(0.5)
    .requote_threshold_bps(10)
    .expire_time_secs(8)
    .on_cancel_resubmit(true)
    .build();

// OKX rejects hyphens in client order IDs
config.base.use_hyphens_in_client_order_ids = false;

let strategy = GridMarketMaker::new(config);

node.add_strategy(strategy)?;
node.run().await?;
```

节点一直运行到被中断（Ctrl+C）或以编程方式关闭。

## 环境变量 {#environment-variables}

OKX 从环境变量读取 API 凭据。用 `dotenvy` 配 `.env` 文件，或在 shell 中设置：

```bash
export OKX_API_KEY="your_api_key"
export OKX_API_SECRET="your_api_secret"
export OKX_API_PASSPHRASE="your_passphrase"
```

模拟交易（demo trading）时，在两个配置 builder 上设置 `.environment(OKXEnvironment::Demo)`，
并使用 OKX 的 demo API 凭据。

各适配器所需的环境变量在该场所的
[集成指南](./../integrations/index.md)中都有说明。

## 异步运行时 {#async-runtime}

`LiveNode::run()` 是 async 的，需要 Tokio 运行时。在主函数上使用 `#[tokio::main]`：

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    // ... node setup ...

    node.run().await?;
    Ok(())
}
```

## 适配器示例 {#adapter-examples}

多数适配器都附带可运行的示例，含数据测试器和执行测试器：

| 适配器              | 示例目录                                        |
| ------------------- | ----------------------------------------------- |
| Architect AX        | `crates/adapters/architect_ax/examples/`        |
| Betfair             | `crates/adapters/betfair/examples/`             |
| Binance             | `crates/adapters/binance/examples/`             |
| Blockchain          | `crates/adapters/blockchain/examples/`          |
| Bybit               | `crates/adapters/bybit/examples/`               |
| Coinbase            | `crates/adapters/coinbase/examples/`            |
| Databento           | `crates/adapters/databento/examples/`           |
| Deribit             | `crates/adapters/deribit/examples/`             |
| Derive              | `crates/adapters/derive/examples/`              |
| dYdX                | `crates/adapters/dydx/examples/`                |
| Hyperliquid         | `crates/adapters/hyperliquid/examples/`         |
| Interactive Brokers | `crates/adapters/interactive_brokers/examples/` |
| Kraken              | `crates/adapters/kraken/examples/`              |
| Lighter             | `crates/adapters/lighter/examples/`             |
| OKX                 | `crates/adapters/okx/examples/`                 |
| Polymarket          | `crates/adapters/polymarket/examples/`          |
| Sandbox             | `crates/adapters/sandbox/examples/`             |
| Tardis              | `crates/adapters/tardis/examples/`              |
