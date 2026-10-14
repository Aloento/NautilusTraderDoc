# Tardis

Tardis 提供面向加密货币市场的细粒度数据，包括逐笔（tick-by-tick）的订单薄快照与增量更新、成交（trades）、持仓量（open interest）、资金费率（funding rates）、期权链（options chains）以及主流交易所的强制平仓/清算（liquidations）数据。

NautilusTrader 提供与 Tardis API 及其数据格式的集成，便于无缝访问 Tardis 数据。该适配器的主要功能包括：

- `TardisCSVDataLoader`：读取 Tardis 格式的 CSV 文件并转换为 Nautilus 数据，支持批量加载与内存友好的流式处理。
- `TardisMachineClient`：支持从 Tardis Machine WebSocket 服务的实时流与历史回放，将消息转换为 Nautilus 可用的数据结构。
- `TardisHttpClient`：向 Tardis HTTP API 请求 instrument 定义元数据，并解析为 Nautilus 的 instrument 定义。
- `TardisDataClient`：提供用于订阅来自 Tardis Machine WebSocket 的实时数据流的客户端。
- `TardisInstrumentProvider`：通过 Tardis 的 HTTP instrument 元数据 API 提供 instrument 定义。
- 数据管道函数（Data pipeline functions）：支持从 Tardis Machine 回放历史数据并将其写入 Nautilus 的 Parquet 格式，且可直接集成到 catalog 以简化数据管理（详见下文）。

:::info
使用该适配器需要提供 Tardis API key。另请参见 “环境变量（environment variables）” 小节。
:::

## 概览

该适配器以 Rust 实现，并提供可选的 Python 绑定，以便在 Python 工作流中更方便地使用。适配器本身不依赖任何外部的 Tardis 客户端库。

:::info
无需对 `tardis` 做额外的安装步骤。适配器的核心组件以静态库方式编译，并在构建过程中自动链接。
:::

## Tardis 文档

Tardis 提供详尽的用户[文档](https://docs.tardis.dev/)。建议在使用本集成指南时，同时参考 Tardis 官方文档以获取更深入的细节。

## 支持的格式

Tardis 提供“归一化（normalized）”的市场数据——在所有支持的交易所之间保持统一格式。这种归一化非常有价值，因为单个解析器即可处理任何 [Tardis 支持的交易所](#venues) 的数据，从而减少开发工作与复杂性。因此，NautilusTrader 暂不直接支持各交易所的原生市场数据格式，以避免为每个交易所实现各自解析器的不必要开销。

下列归一化的 Tardis 格式被 NautilusTrader 支持：

| Tardis 格式                                                                                                                  | Nautilus 数据类型                                                   |
| :--------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------ |
| [book_change](https://docs.tardis.dev/api/tardis-machine#book_change)                                                        | `OrderBookDelta`                                                    |
| [book*snapshot*\*](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit) | `OrderBookDepth10`                                                  |
| [quote](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit)            | `QuoteTick`                                                         |
| [quote_10s](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit)        | `QuoteTick`                                                         |
| [trade](https://docs.tardis.dev/api/tardis-machine#trade)                                                                    | `Trade`                                                             |
| [trade*bar*\*](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix)                            | `Bar`                                                               |
| [instrument](https://docs.tardis.dev/api/instruments-metadata-api)                                                           | `CurrencyPair`, `CryptoFuture`, `CryptoPerpetual`, `OptionContract` |
| [derivative_ticker](https://docs.tardis.dev/api/tardis-machine#derivative_ticker)                                            | _尚未支持_                                                          |
| [disconnect](https://docs.tardis.dev/api/tardis-machine#disconnect)                                                          | _不适用_                                                            |

**注：**

- [quote](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit) 是 [book_snapshot_1_0ms](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit) 的别名。
- [quote_10s](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit) 是 [book_snapshot_1_10s](https://docs.tardis.dev/api/tardis-machine#book_snapshot_-number_of_levels-_-snapshot_interval-time_unit) 的别名。
- quote、quote_10s 以及一层快照（one-level snapshots）都会被解析为 `QuoteTick`。

:::info
另请参见 Tardis 的[归一化市场数据 API](https://docs.tardis.dev/api/tardis-machine#normalized-market-data-apis)。
:::

## Bar（K 线）

适配器会自动将 [Tardis 的 trade bar 间隔与后缀](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix) 转换为 Nautilus 的 `BarType`，包括：

| Tardis 后缀                                                                                                   | Nautilus bar 聚合单位 |
| :------------------------------------------------------------------------------------------------------------ | :-------------------- |
| [ms](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix) - 毫秒                | `MILLISECOND`         |
| [s](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix) - 秒                   | `SECOND`              |
| [m](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix) - 分钟                 | `MINUTE`              |
| [ticks](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix) - 以成交笔数为单位 | `TICK`                |
| [vol](https://docs.tardis.dev/api/tardis-machine#trade_bar_-aggregation_interval-suffix) - 成交量大小         | `VOLUME`              |

## 代码与符号规范（Symbology and normalization）

Tardis 集成通过一致的符号归一化，保证与 NautilusTrader 的加密货币交易所适配器无缝兼容。通常情况下，NautilusTrader 会采用 Tardis 提供的原生交易所命名规则。但对于某些交易所，原始符号会按照 Nautilus 的符号规范进行调整，具体如下：

### 通用规则

- 所有符号会转换为大写。
- 对于某些交易所，会在市场类型后缀前添加连字符（hyphen）（详见[交易所特定的规范](#exchange-specific-normalizations)）。
- 原始交易所符号会保留在 Nautilus instrument 定义的 `raw_symbol` 字段中。

### 交易所特定的规范

- **Binance**：Nautilus 会在所有永续合约符号后追加 `-PERP` 后缀。
- **Bybit**：Nautilus 使用特定的产品类别后缀，包括 `-SPOT`、`-LINEAR`、`-INVERSE`、`-OPTION`。
- **dYdX**：Nautilus 会在所有永续合约符号后追加 `-PERP` 后缀。
- **Gate.io**：Nautilus 会在所有永续合约符号后追加 `-PERP` 后缀。

有关各交易所符号规范的详细说明，参见：

- [Binance 符号规范](./binance.md#symbology)
- [Bybit 符号规范](./bybit.md#symbology)
- [dYdX 符号规范](./dydx.md#symbology)

## Venues（交易场所）

Tardis 中的某些交易所在逻辑上被划分为多个 venue。下表列出了 Nautilus 的 venue 与对应的 Tardis 交易所映射关系：

| Nautilus venue     | Tardis 交易所(s)                                                                                             |
| :----------------- | :----------------------------------------------------------------------------------------------------------- |
| `ASCENDEX`         | `ascendex`                                                                                                   |
| `BINANCE`          | `binance`, `binance-dex`, `binance-european-options`, `binance-futures`, `binance-jersey`, `binance-options` |
| `BINANCE_DELIVERY` | `binance-delivery`（_币本位合约_）                                                                           |
| `BINANCE_US`       | `binance-us`                                                                                                 |
| `BITFINEX`         | `bitfinex`, `bitfinex-derivatives`                                                                           |
| `BITFLYER`         | `bitflyer`                                                                                                   |
| `BITGET`           | `bitget`, `bitget-futures`                                                                                   |
| `BITMEX`           | `bitmex`                                                                                                     |
| `BITNOMIAL`        | `bitnomial`                                                                                                  |
| `BITSTAMP`         | `bitstamp`                                                                                                   |
| `BLOCKCHAIN_COM`   | `blockchain-com`                                                                                             |
| `BYBIT`            | `bybit`, `bybit-options`, `bybit-spot`                                                                       |
| `COINBASE`         | `coinbase`                                                                                                   |
| `COINBASE_INTX`    | `coinbase-international`                                                                                     |
| `COINFLEX`         | `coinflex`（_用于历史研究_）                                                                                 |
| `CRYPTO_COM`       | `crypto-com`, `crypto-com-derivatives`                                                                       |
| `CRYPTOFACILITIES` | `cryptofacilities`                                                                                           |
| `DELTA`            | `delta`                                                                                                      |
| `DERIBIT`          | `deribit`                                                                                                    |
| `DYDX`             | `dydx`                                                                                                       |
| `DYDX_V4`          | `dydx-v4`                                                                                                    |
| `FTX`              | `ftx`, `ftx-us`（_用于历史研究_）                                                                            |
| `GATE_IO`          | `gate-io`, `gate-io-futures`                                                                                 |
| `GEMINI`           | `gemini`                                                                                                     |
| `HITBTC`           | `hitbtc`                                                                                                     |
| `HUOBI`            | `huobi`, `huobi-dm`, `huobi-dm-linear-swap`, `huobi-dm-options`                                              |
| `HUOBI_DELIVERY`   | `huobi-dm-swap`                                                                                              |
| `HYPERLIQUID`      | `hyperliquid`                                                                                                |
| `KRAKEN`           | `kraken`                                                                                                     |
| `KUCOIN`           | `kucoin`, `kucoin-futures`                                                                                   |
| `MANGO`            | `mango`                                                                                                      |
| `OKCOIN`           | `okcoin`                                                                                                     |
| `OKEX`             | `okex`, `okex-futures`, `okex-options`, `okex-spreads`, `okex-swap`                                          |
| `PHEMEX`           | `phemex`                                                                                                     |
| `POLONIEX`         | `poloniex`                                                                                                   |
| `SERUM`            | `serum`（_用于历史研究_）                                                                                    |
| `STAR_ATLAS`       | `star-atlas`                                                                                                 |
| `UPBIT`            | `upbit`                                                                                                      |
| `WOO_X`            | `woo-x`                                                                                                      |

## 环境变量

下列环境变量用于配置 Tardis 与 NautilusTrader：

- `TM_API_KEY`：Tardis Machine 的 API key。
- `TARDIS_API_KEY`：NautilusTrader Tardis 客户端使用的 API key。
- `TARDIS_MACHINE_WS_URL`（可选）：NautilusTrader 中 `TardisMachineClient` 使用的 WebSocket URL。
- `TARDIS_BASE_URL`（可选）：NautilusTrader 中 `TardisHttpClient` 使用的基础 URL。
- `NAUTILUS_PATH`（可选）：包含 `catalog/` 子目录的父目录，用于将回放数据以 Nautilus catalog 格式写入。

## 运行 Tardis Machine 的历史回放（historical replays）

[Tardis Machine Server](https://docs.tardis.dev/api/tardis-machine) 是一个可在本地运行的服务，带有内置数据缓存，通过 HTTP 与 WebSocket API 提供逐 tick 的历史数据和实时汇总数据。

你可以执行完整的 Tardis Machine WebSocket 历史回放，并将结果输出为 Nautilus Parquet 格式，支持 Python 或 Rust 两种方式。由于回放功能在 Rust 中实现，无论从 Python 还是 Rust 调用，性能相同，你可以按工作流偏好来选择。

端到端的 `run_tardis_machine_replay` 数据管道函数会根据指定的[配置](#configuration) 执行以下步骤：

- 连接到 Tardis Machine 服务器。
- 向 Tardis 的 [instruments metadata](https://docs.tardis.dev/api/instruments-metadata-api) HTTP API 请求并解析所需的 instrument 定义。
- 从 Tardis Machine 服务器按指定时间范围流式请求所有目标 instruments 与数据类型。
- 对于每个 instrument、数据类型和日期（UTC），生成一个符合 catalog 的 `.parquet` 文件。
- 断开与 Tardis Machine 的连接并结束进程。

**文件命名约定**

按天、按 instrument 写入文件，使用 ISO 8601 时间戳范围以明确表示数据的时间跨度：

- **格式**：`{start_timestamp}_{end_timestamp}.parquet`
- **示例**：`2023-10-01T00-00-00-000000000Z_2023-10-01T23-59-59-999999999Z.parquet`
- **目录结构**：`data/{data_type}/{instrument_id}/{filename}`

该格式与 Nautilus 数据 catalog 完全兼容，便于查询、合并与数据管理操作。

:::note
对于每月的第一天，您可以在无需 API key 的情况下请求数据；其他日期则需要 Tardis Machine 的 API key。
:::

此流程针对直接输出到 Nautilus Parquet 数据 catalog 进行了优化。请确保将 `NAUTILUS_PATH` 环境变量设置为包含 `catalog/` 子目录的父目录。Parquet 文件将按数据类型与 instrument 存放在 `<NAUTILUS_PATH>/catalog/data/` 的相应子目录下。

如果配置文件中未指定 `output_path` 且 `NAUTILUS_PATH` 未设置，则系统将默认使用当前工作目录。

### 操作步骤

首先，确保 `tardis-machine` 的 Docker 容器正在运行。可以使用如下命令启动：

```bash
docker run -p 8000:8000 -p 8001:8001 -e "TM_API_KEY=YOUR_API_KEY" -d tardisdev/tardis-machine
```

该命令会以无持久缓存的方式启动 `tardis-machine` 服务，可能影响性能。如需更好的性能，请考虑为容器挂载持久卷。更多信息请参见 Tardis 的 [Docker 文档](https://docs.tardis.dev/api/tardis-machine#docker)。

### 配置

接下来，准备好一个 JSON 格式的配置文件。

**配置 JSON 格式**

| 字段                | 类型              | 描述                                                                                                                   | 默认                                                              |
| :------------------ | :---------------- | :--------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------- |
| `tardis_ws_url`     | string (optional) | Tardis Machine 的 WebSocket URL。                                                                                      | 若为 `null` 则使用环境变量 `TARDIS_MACHINE_WS_URL`。              |
| `normalize_symbols` | bool (optional)   | 是否应用 Nautilus 的[符号归一化](#symbology-and-normalization)。                                                       | 若为 `null` 则默认为 `true`。                                     |
| `output_path`       | string (optional) | 写入 Nautilus Parquet 数据的输出目录路径。                                                                             | 若为 `null` 则使用 `NAUTILUS_PATH` 环境变量，否则为当前工作目录。 |
| `options`           | JSON[]            | 一个 [ReplayNormalizedRequestOptions](https://docs.tardis.dev/api/tardis-machine#replay-normalized-options) 对象数组。 |

示例配置文件 `example_config.json` 可在此找到：[example_config.json](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/tardis/bin/example_config.json)：

```json
{
  "tardis_ws_url": "ws://localhost:8001",
  "output_path": null,
  "options": [
    {
      "exchange": "bitmex",
      "symbols": ["xbtusd", "ethusd"],
      "data_types": ["trade"],
      "from": "2019-10-01",
      "to": "2019-10-02"
    }
  ]
}
```

### 在 Python 中执行回放

在 Python 中运行回放可参考下列脚本：

```python
import asyncio

from nautilus_trader.core import nautilus_pyo3


async def run():
    config_filepath = Path("YOUR_CONFIG_FILEPATH")
    await nautilus_pyo3.run_tardis_machine_replay(str(config_filepath.resolve()))


if __name__ == "__main__":
    asyncio.run(run())
```

### 在 Rust 中执行回放

在 Rust 中运行回放可参考下列示例：

```rust
use std::{env, path::PathBuf};

use nautilus_adapters::tardis::replay::run_tardis_machine_replay_from_config;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    let config_filepath = PathBuf::from("YOUR_CONFIG_FILEPATH");
    run_tardis_machine_replay_from_config(&config_filepath).await;
}
```

请确保启用 Rust 日志，例如在 shell 中设置：

```bash
export RUST_LOG=debug
```

可运行的示例二进制位于仓库：[example_replay.rs](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/tardis/bin/example_replay.rs)。

也可以使用 cargo 运行：

```bash
cargo run --bin tardis-replay <path_to_your_config>
```

## 加载 Tardis CSV 数据

Tardis 格式的 CSV 数据可以通过 Python 或 Rust 加载。加载器会读取磁盘上的 CSV 文本并将其解析为 Nautilus 数据。由于加载器在 Rust 中实现，因此无论从 Python 还是 Rust 调用，性能表现一致，可按个人工作流偏好选择。

你也可以为 `load_*` 函数/方法可选地指定 `limit` 参数，以限制加载的最大行数。

:::note
混合多个 instrument 的 CSV 文件由于精度（precision）要求较高，存在较大挑战，不建议使用。请使用单一 instrument 的 CSV 文件（详见下文）。
:::

### 在 Python 中加载 CSV

可使用 `TardisCSVDataLoader` 在 Python 中加载 Tardis 格式的 CSV。
加载时可选地指定 instrument ID，但必须显式提供 price precision 与 size precision。指定 instrument ID 能提升加载性能，而精度参数是必需的，因为文本数据本身无法推断出精度。

示例用法：

```python
from nautilus_trader.adapters.tardis import TardisCSVDataLoader
from nautilus_trader.model import InstrumentId


instrument_id = InstrumentId.from_str("BTC-PERPETUAL.DERIBIT")
loader = TardisCSVDataLoader(
    price_precision=1,
    size_precision=0,
    instrument_id=instrument_id,
)

filepath = Path("YOUR_CSV_DATA_PATH")
limit = None

deltas = loader.load_deltas(filepath, limit)
```

### 在 Rust 中加载 CSV

在 Rust 中可使用此处的加载函数：[csv 模块示例](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/tardis/src/csv/mod.rs)。
加载时同样可以可选地指定 instrument ID，但必须提供 price precision 与 size precision。指定 instrument ID 能提升加载性能，而精度参数不可省略。

完整示例见仓库：[example_csv.rs](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/tardis/bin/example_csv.rs)。

示例代码：

```rust
use std::path::Path;

use nautilus_adapters::tardis;
use nautilus_model::identifiers::InstrumentId;

#[tokio::main]
async fn main() {
    // 你必须指定精度以及 CSV 文件路径
    let price_precision = 1;
    let size_precision = 0;
    let filepath = Path::new("YOUR_CSV_DATA_PATH");

    // 可选地指定 instrument ID 与/或 limit
    let instrument_id = InstrumentId::from("BTC-PERPETUAL.DERIBIT");
    let limit = None;

    // 根据工作流决定是否传播解析错误
    let _deltas = tardis::csv::load_deltas(
        filepath,
        price_precision,
        size_precision,
        Some(instrument_id),
        limit,
    )
    .unwrap();
}
```

## 流式处理 Tardis CSV 数据

为在内存受限的环境下高效处理大文件，Tardis 集成提供了流式处理能力：按配置的块（chunk）读取与处理数据，而非一次性将整个文件载入内存。这在处理数 GB 级别的 CSV 文件时尤为有用。

流式功能适用于所有支持的 Tardis 数据类型：

- 订单薄增量（Order book deltas，`stream_deltas`）。
- 报价（Quote ticks，`stream_quotes`）。
- 成交（Trade ticks，`stream_trades`）。
- 订单薄深度快照（Order book depth snapshots，`stream_depth10`）。

### 在 Python 中流式读取 CSV

`TardisCSVDataLoader` 提供流式方法，按迭代器返回数据块。每个方法接受 `chunk_size` 参数，用于控制每个块读取的记录数：

```python
from nautilus_trader.adapters.tardis import TardisCSVDataLoader
from nautilus_trader.model import InstrumentId

instrument_id = InstrumentId.from_str("BTC-PERPETUAL.DERIBIT")
loader = TardisCSVDataLoader(
    price_precision=1,
    size_precision=0,
    instrument_id=instrument_id,
)

filepath = Path("large_trades_file.csv")
chunk_size = 100_000  # 每块处理 100,000 条记录（默认值）

# 分块流式处理成交数据
for chunk in loader.stream_trades(filepath, chunk_size):
    print(f"Processing chunk with {len(chunk)} trades")
    # 仅该块数据在内存中
    for trade in chunk:
        # 在此处实现你的处理逻辑
        pass
```

### 流式处理订单薄数据

订单薄数据的流式支持包括增量（deltas）和深度快照（depth snapshots）：

```python
# 流式处理订单薄增量
for chunk in loader.stream_deltas(filepath):
    print(f"Processing {len(chunk)} deltas")
    # 处理 delta 块

# 流式处理 depth10 快照（levels 可选：5 或 25）
for chunk in loader.stream_depth10(filepath, levels=5):
    print(f"Processing {len(chunk)} depth snapshots")
    # 处理 depth 块
```

### 流式处理报价数据

报价数据的流式处理方式类似：

```python
# 流式处理报价 ticks
for chunk in loader.stream_quotes(filepath):
    print(f"Processing {len(chunk)} quotes")
    # 处理报价块
```

### 内存效率优势

流式处理方式带来显著的内存效率优势：

- 可控的内存占用：一次仅加载一个数据块。
- 可扩展的处理能力：可处理大于可用内存的文件。
- 支持配置块大小：根据系统内存与性能需求调整 `chunk_size`（默认 100,000）。

:::warning
当在流式模式下使用精度推断（未显式提供精度）时，推断出的精度可能与对整个文件进行批量加载时得到的结果不同。因为精度推断基于块边界进行，不同块中可能包含不同的精度要求。为获得确定性行为，请在调用流式方法时显式提供 `price_precision` 与 `size_precision`。
:::

### 在 Rust 中流式读取 CSV

底层的流式功能由 Rust 实现，也可以直接在 Rust 中使用：

```rust
use std::path::Path;
use nautilus_adapters::tardis::csv::{stream_trades, stream_deltas};
use nautilus_model::identifiers::InstrumentId;

#[tokio::main]
async fn main() {
    let filepath = Path::new("large_trades_file.csv");
    let chunk_size = 100_000;
    let price_precision = Some(1);
    let size_precision = Some(0);
    let instrument_id = Some(InstrumentId::from("BTC-PERPETUAL.DERIBIT"));

    // 分块流式处理成交数据
    let stream = stream_trades(
        filepath,
        chunk_size,
        price_precision,
        size_precision,
        instrument_id,
    ).unwrap();

    for chunk_result in stream {
        match chunk_result {
            Ok(chunk) => {
                println!("Processing chunk with {} trades", chunk.len());
                // 处理该块
            }
            Err(e) => {
                eprintln!("Error processing chunk: {}", e);
                break;
            }
        }
    }
}
```

## 请求 instrument 定义

你可以使用 `TardisHttpClient` 在 Python 与 Rust 中请求 instrument 定义。该客户端会调用 [Tardis instruments metadata API](https://docs.tardis.dev/api/instruments-metadata-api) 并将 instrument 元数据解析为 Nautilus 的 instrument 定义。

`TardisHttpClient` 的构造函数接受可选参数：`api_key`、`base_url` 与 `timeout_secs`（默认 60 秒）。

该客户端提供获取单个 `instrument` 或某个交易所上所有 `instruments` 的方法。请在引用 [Tardis 支持的交易所](https://api.tardis.dev/v1/exchanges) 时使用 Tardis 的 lower-kebab 命名规范。

:::note
访问 instruments metadata API 需要 Tardis 的 API key。
:::

### 在 Python 中请求 Instruments

在 Python 中获取 instrument 定义的示例：

```python
import asyncio

from nautilus_trader.core import nautilus_pyo3


async def run():
    http_client = nautilus_pyo3.TardisHttpClient()

    instrument = await http_client.instrument("bitmex", "xbtusd")
    print(f"Received: {instrument}")

    instruments = await http_client.instruments("bitmex")
    print(f"Received: {len(instruments)} instruments")


if __name__ == "__main__":
    asyncio.run(run())
```

### 在 Rust 中请求 Instruments

在 Rust 中获取 instrument 定义的示例：完整示例见仓库中的 [example_http.rs](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/adapters/tardis/bin/example_http.rs)。

```rust
use nautilus_adapters::tardis::{enums::Exchange, http::client::TardisHttpClient};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();

    let client = TardisHttpClient::new(None, None, None).unwrap();

    // Nautilus instrument definitions
    let resp = client.instruments(Exchange::Bitmex).await;
    println!("Received: {resp:?}");

    let resp = client.instrument(Exchange::Bitmex, "ETHUSDT").await;
    println!("Received: {resp:?}");
}
```

## Instrument provider

`TardisInstrumentProvider` 通过 HTTP instrument 元数据 API 请求并解析来自 Tardis 的 instrument 定义。由于存在多个 [Tardis 支持的交易所](#venues)，在加载所有 instruments 时，需要使用 `InstrumentProviderConfig` 过滤出目标 venues：

```python
from nautilus_trader.config import InstrumentProviderConfig

# 查看支持的 venues: https://nautilustrader.io/docs/nightly/integrations/tardis#venues
venues = {"BINANCE", "BYBIT"}
filters = {"venues": frozenset(venues)}
instrument_provider_config = InstrumentProviderConfig(load_all=True, filters=filters)
```

你也可以像平时一样加载特定的 instrument 定义：

```python
from nautilus_trader.config import InstrumentProviderConfig

instrument_ids = [
    InstrumentId.from_str("BTCUSDT-PERP.BINANCE"),  # 将使用 'binance-futures' 交易所
    InstrumentId.from_str("BTCUSDT.BINANCE"),      # 将使用 'binance' 交易所
]
instrument_provider_config = InstrumentProviderConfig(load_ids=instrument_ids)
```

:::note
订阅之前，所需的 instruments 必须已缓存可用。为简化流程，建议为计划订阅的 venues 预先加载所有 instruments。
:::

## 实时数据客户端

`TardisDataClient` 允许将 Tardis Machine 集成到正在运行的 NautilusTrader 系统中。它支持订阅下列数据类型：

- `OrderBookDelta`（来自 Tardis 的 L2 细粒度，包含所有变更或完整深度快照）
- `OrderBookDepth10`（来自 Tardis 的 L2 细粒度，提供最多 10 层快照）
- `QuoteTick`
- `TradeTick`
- `Bar`（基于 Tardis 支持的 bar 聚合）

### 数据 WebSocket

主 `TardisMachineClient` 的数据 WebSocket 在初始连接阶段负责管理所有接收到的流订阅，直到 `ws_connection_delay_secs` 指定的延迟时间结束。对于在此之后新增的订阅，会创建新的 `TardisMachineClient` 实例。该策略在启动时能让主 WebSocket 在单个流中处理数百个订阅，从而提高性能。

当设定了 `ws_connection_delay_secs` 的初始订阅延迟时，对这些流的取消订阅不会真正从 Tardis Machine 的流中移除订阅（因为 Tardis 不支持选择性取消订阅）。不过组件仍会如期从消息总线（message bus）的发布中取消订阅。

在任何初始延迟之后创建的订阅，将按常规行为正常取消并从 Tardis Machine 流中移除。

:::tip
如果你预计会频繁地订阅与取消订阅，建议将 `ws_connection_delay_secs` 设为 0。这样每次初始订阅都会创建一个新的客户端，便于在取消订阅时单独关闭。
:::

## 限制与注意事项

已知的限制与注意事项包括：

- 不支持单次的历史数据请求（historical data requests），因为每次请求至少需要从 Tardis Machine 做一天的回放，且可能需要附加筛选，这在实践中既不高效也不实用。

:::info
如需更多功能或希望为 Tardis 适配器贡献代码，请参见我们的[贡献指南](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md)。
:::
