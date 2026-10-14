# Tardis

Tardis 提供细粒度的加密货币行情数据，包括逐笔订单簿快照与增量、成交、未平仓合约量、资金费率、期权摘要
和平仓数据。

NautilusTrader 集成了 Tardis API、Tardis Machine WebSocket 服务器和 Tardis CSV 格式。该适配器的能力包括：

- CSV 加载与流式函数把 Tardis 格式的文件批量或有界分块地读入为 Nautilus 数据。
- `run_tardis_machine_replay` 回放历史数据并写出 Nautilus Parquet catalog 文件。
- `TardisDataClientConfig` 与 `TardisDataClientFactory` 把 Nautilus 节点连接到配置好的历史回放或
  实时 Tardis Machine 数据流。
- Python 与 Rust 均暴露 `TardisMachineClient` 和 `TardisHttpClient`，用于更底层地访问归一化数据流
  与金融工具元数据。

:::info
Nautilus 的金融工具元数据调用需要 `TARDIS_API_KEY`。Tardis Machine 在访问每月免费首日之外的历史日期时
使用 `TM_API_KEY`。另见[环境变量](#environment-variables)。
:::

## 概览 {#overview}

该适配器用 Rust 实现，附带可选的 Python 绑定。其组件编译进 NautilusTrader，因此无需单独安装 Tardis
客户端库。上游 API、格式与服务器请查阅 [Tardis 文档](https://docs.tardis.dev/)。

Tardis Machine 使用的最低已测试 Tardis Node 版本为 **18.2.2**。该版本修复了 Deribit 订单簿归一化中的
一个问题：已被快照覆盖的排队增量在快照之后到达时的处理。NautilusTrader 不会在你的 Tardis Machine
部署中锁定版本。

## 支持的格式 {#supported-formats}

Tardis 提供*归一化*行情数据，一种在各支持交易所间统一的格式。这一归一化让同一个解析器能处理来自任何
[Tardis 支持的交易所](#venues)的数据。本适配器不支持交易所原生格式的 Tardis 行情数据。

NautilusTrader 支持下列归一化的 Tardis Machine 格式。字段 schema 见官方
[Tardis 数据类型参考](https://docs.tardis.dev/tardis-machine/data-types)。

| Tardis 格式 | Nautilus 数据类型 |
| :------------------ | :------------------------------------------------------------ |
| `book_change`       | `OrderBookDeltas`                                             |
| `book_snapshot_*`   | `OrderBookDepth` 或 `OrderBookDeltas`                         |
| `quote`             | `QuoteTick`                                                   |
| `quote_10s`         | `QuoteTick`                                                   |
| `trade`             | `TradeTick`                                                   |
| `trade_bar_*`       | `Bar`                                                         |
| `derivative_ticker` | `FundingRateUpdate`、`MarkPriceUpdate` 或 `IndexPriceUpdate` |
| `option_summary`    | `OptionGreeks`；可由 BBO 字段产生可选的 `QuoteTick`          |
| `disconnect`        | 忽略                                                          |

**说明**：

- Tardis 文档把 `quote` 记为 `book_snapshot_1_0ms` 的别名。
- Tardis 文档把 `quote_10s` 记为 `book_snapshot_1_10s` 的别名。
- `quote`、`quote_10s` 和单档快照按 `QuoteTick` 解析。
- 数据客户端只在数值变化时，才从 `derivative_ticker` 消息发出资金费率、标记价格与指数价格更新。
  catalog 回放流水线不写这些更新。
- Tardis 的 `option_summary` 消息包含最优买卖价字段。Nautilus 总是把该数据流映射为
  `OptionGreeks`。设 `extract_bbo_as_quotes` 为 `true` 可同时从这些 BBO 字段发出 `QuoteTick`。
- 适配器不解析 Tardis 的 `book_ticker`、`liquidation` 或 `error` 归一化格式。

:::info
另见 Tardis 的 [Tardis Machine 快速上手](https://docs.tardis.dev/tardis-machine/quickstart)。
:::

## K 线 {#bars}

适配器把 Tardis 成交 K 线的间隔与后缀转换为 Nautilus `BarType`，包括下列对应关系：

| Tardis 后缀 | 含义 | Nautilus K 线聚合 |
| :------------ | :-------------- | :------------------------- |
| `ms`          | 毫秒            | `MILLISECOND`              |
| `s`           | 秒              | `SECOND`                   |
| `m`           | 分钟            | `MINUTE`、`HOUR` 或 `DAY`  |
| `ticks`       | 笔数            | `TICK`                     |
| `vol`         | 成交量规模      | `VOLUME`                   |

能整除小时或天的分钟间隔使用规范的 Nautilus `HOUR` 或 `DAY` 聚合。

## 符号与归一化 {#symbology-and-normalization}

Tardis 集成以与 NautilusTrader 加密交易所适配器兼容的方式归一化符号。NautilusTrader 通常使用 Tardis
提供的交易所原生名称。对某些交易所，它会把原始符号调整为 Nautilus 符号，如下所示：

### 通用规则 {#common-rules}

- 所有符号都转为大写。
- 部分交易所的市场类型后缀用连字符追加。
- 原始交易所符号保留在 Nautilus 金融工具定义的 `raw_symbol` 字段中。

### 各交易所特有的归一化 {#exchange-specific-normalizations}

- **Binance**：Nautilus 给 `binance`、`binance-futures`、`binance-us`、`binance-dex` 和
  `binance-jersey` 的永续符号追加后缀 `-PERP`。
- **Bybit**：Nautilus 使用产品类别后缀，包括 `-SPOT`、`-LINEAR`、`-INVERSE` 和 `-OPTION`。
- **dYdX v3**：Nautilus 给 `dydx` 的永续符号追加后缀 `-PERP`。
- **Gate.io**：Nautilus 给 `gate-io-futures` 的永续符号追加后缀 `-PERP`。
- **MEXC**：Nautilus 给 `mexc-futures` 的永续符号追加后缀 `-PERP`。

各交易所的详细符号文档：

- [Binance 符号](./binance.md#symbology)
- [Bybit 符号](./bybit.md#symbology)
- [dYdX 符号](./dydx.md#symbology)

## 交易场所 {#venues}

Tardis 上的部分交易所被划分为多个交易场所。下表列出 Nautilus 交易场所与对应 Tardis 交易所之间的映射：

| Nautilus 交易场所 | Tardis 交易所 |
| :----------------- | :----------------------------------------------------------------------------------------------------------- |
| `ASCENDEX`         | `ascendex`                                                                                                   |
| `BINANCE`          | `binance`, `binance-dex`, `binance-european-options`, `binance-futures`, `binance-jersey`, `binance-options` |
| `BINANCE_DELIVERY` | `binance-delivery` (*COIN-margined contracts*)                                                               |
| `BINANCE_US`       | `binance-us`                                                                                                 |
| `BITFINEX`         | `bitfinex`, `bitfinex-derivatives`                                                                           |
| `BITFLYER`         | `bitflyer`                                                                                                   |
| `BITGET`           | `bitget`, `bitget-futures`                                                                                   |
| `BITMEX`           | `bitmex` (*historical data only*)                                                                            |
| `BITNOMIAL`        | `bitnomial`                                                                                                  |
| `BITSTAMP`         | `bitstamp`                                                                                                   |
| `BLOCKCHAIN_COM`   | `blockchain-com`                                                                                             |
| `BYBIT`            | `bybit`, `bybit-options`, `bybit-spot`                                                                       |
| `COINBASE`         | `coinbase`                                                                                                   |
| `COINBASE_INTX`    | `coinbase-international`                                                                                     |
| `COINFLEX`         | `coinflex` (*historical data only*)                                                                          |
| `CRYPTO_COM`       | `crypto-com`                                                                                                 |
| `CRYPTOFACILITIES` | `cryptofacilities`                                                                                           |
| `DELTA`            | `delta`                                                                                                      |
| `DERIBIT`          | `deribit`                                                                                                    |
| `DYDX`             | `dydx`                                                                                                       |
| `DYDX_V4`          | `dydx-v4`                                                                                                    |
| `FTX`              | `ftx`, `ftx-us` (*historical data only*)                                                                     |
| `GATE_IO`          | `gate-io`, `gate-io-futures`                                                                                 |
| `GEMINI`           | `gemini`                                                                                                     |
| `HITBTC`           | `hitbtc`                                                                                                     |
| `HUOBI`            | `huobi`, `huobi-dm`, `huobi-dm-linear-swap`, `huobi-dm-options`                                              |
| `HUOBI_DELIVERY`   | `huobi-dm-swap`                                                                                              |
| `HYPERLIQUID`      | `hyperliquid`                                                                                                |
| `KRAKEN`           | `kraken`                                                                                                     |
| `KUCOIN`           | `kucoin`, `kucoin-futures`                                                                                   |
| `LIGHTER`          | `lighter`                                                                                                    |
| `MANGO`            | `mango`                                                                                                      |
| `MEXC`             | `mexc`, `mexc-futures`                                                                                       |
| `OKCOIN`           | `okcoin`                                                                                                     |
| `OKEX`             | `okex`, `okex-futures`, `okex-options`, `okex-spreads`, `okex-swap`                                          |
| `PHEMEX`           | `phemex`                                                                                                     |
| `POLONIEX`         | `poloniex`                                                                                                   |
| `SERUM`            | `serum` (*historical data only*)                                                                             |
| `STAR_ATLAS`       | `star-atlas`                                                                                                 |
| `UPBIT`            | `upbit`                                                                                                      |
| `WOO_X`            | `woo-x`                                                                                                      |

部分交易所 ID 代表为保留历史数据而保留的下架交易场所。可用性与下架状态见官方
[历史数据详情](https://docs.tardis.dev/historical-data-details)。

Tardis Node [18.2.3](https://github.com/tardis-dev/tardis-node/releases/tag/18.2.3) 移除了 BitMEX
的实时数据流。BitMEX 的历史回放、通道与归一化仍然支持。

## 环境变量 {#environment-variables}

Tardis 与 NautilusTrader 使用以下环境变量。

- `TM_API_KEY`：传给 Tardis Machine 进程、用于访问历史数据的 API key。
- `TARDIS_API_KEY`：Nautilus 金融工具元数据请求用的 API key。
- `TARDIS_MACHINE_WS_URL`（可选）：Tardis Machine WebSocket 基础 URL。
- `NAUTILUS_PATH`（可选）：包含回放输出用 `catalog/` 子目录的父目录。

Tardis 金融工具元数据 API 需要 bearer token 鉴权，仅对有效的 pro 与 business Tardis 订阅开放。

## 运行 Tardis Machine 历史回放 {#running-tardis-machine-historical-replays}

[Tardis Machine Server](https://docs.tardis.dev/tardis-machine/quickstart) 是一个可本地运行、
内置数据缓存的服务器。它通过 HTTP 与 WebSocket API 提供 tick 级的历史与合并后的实时加密货币行情数据。

:::warning
若在完成之前取消历史 WebSocket 回放，Tardis Machine 18.2.2 可能终止。该问题出现在
Node.js 26.7.0 上运行的 Tardis Node 18.2.3。回放可能留着缓存文件句柄不关闭，垃圾回收关闭它时
引发 `ERR_INVALID_STATE` 错误。服务器退出还会中断其他已连接的客户端。

尽可能让回放自然结束。同一服务器跑在 Node.js 24.19.0 上可避开观测到的崩溃，但仍会产生
`DEP0137` 警告。这并没有修复上游的文件句柄泄漏。
:::

你可以从 Python 或 Rust 运行完整的 Tardis Machine WebSocket 回放，并以 Nautilus Parquet 格式写出
结果。两种接口调用的是同一个 Rust 回放实现。

端到端的数据流水线函数 `run_tardis_machine_replay` 按指定的[配置](#configuration)执行以下步骤：

- 连接 Tardis Machine 服务器。
- 从 Tardis 金融工具元数据 API 请求并解析所配置交易所的全部金融工具定义。
- 从 Tardis Machine 按指定时间范围流式获取所有请求的金融工具与数据类型。
- 按数据类型与日期（UTC），以金融工具或 bar type 写出与 catalog 兼容的 `.parquet` 文件。
- 结束数据流并把剩余数据刷写到磁盘。

### 输出文件 {#output-files}

文件按 UTC 每个交易日、每个金融工具一个（或按 bar type 一个）写出，文件名用 ISO 8601 时间戳范围：

- **格式**：`{start_timestamp}_{end_timestamp}.parquet`
- **示例**：`2023-10-01T00-00-00-000000000Z_2023-10-01T23-59-59-999999999Z.parquet`
- **相对路径**：`{data_type}/{instrument_id}/{filename}`；K 线则为 `bars/{bar_type}/{filename}`。

该格式与 Nautilus 数据 catalog 的查询、合并与管理兼容。

:::note
每月第一天的数据无需 Tardis Machine API key 即可请求。其他日期需要 `TM_API_KEY`。
:::

该流程针对直接输出到 Nautilus Parquet 数据 catalog 做了优化。
把 `NAUTILUS_PATH` 设为包含 `catalog/` 子目录的父目录。Parquet 文件写入
`<NAUTILUS_PATH>/catalog/data/` 下，按数据类型与金融工具或 bar type 分子目录。

若既未指定 `output_path` 也未设置 `NAUTILUS_PATH`，输出默认为当前工作目录。

### 步骤 {#procedure}

:::warning
不要把 Tardis Machine 端口发布到主机地址 `0.0.0.0`。端口映射省略主机地址时，Docker
[默认在所有主机接口上发布端口](https://docs.docker.com/engine/network/port-publishing/)。
在 Linux 上，Docker [会在 `ufw` 应用规则之前转移已发布的容器流量](https://docs.docker.com/engine/network/packet-filtering-firewalls/#docker-and-ufw)，
可能绕过预期的防火墙限制。除非确实需要并另行加固了远程访问，两个端口都应绑定 `127.0.0.1`。
:::

对于每月免费首日之外的日期，先在主机环境中设置 `TM_API_KEY`，再启动
`tardis-machine` Docker 容器：

```bash
docker run \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:8001:8001 \
  -e TM_API_KEY \
  -d tardisdev/tardis-machine
```

该命令启动的 `tardis-machine` 服务器没有持久化本地缓存，可能影响性能。要获得更好的回放性能，
请配合持久卷运行。

### 配置 {#configuration}

接下来，确保手边有一份配置 JSON 文件。

**配置 JSON 字段**

- `tardis_ws_url`（`str | null`）：Tardis Machine WebSocket URL。默认为
  `TARDIS_MACHINE_WS_URL`。
- `tardis_http_url`（`str | null`）：Tardis HTTP API 基础 URL。默认为
  `https://api.tardis.dev/v1`。
- `normalize_symbols`（`bool | null`）：应用 Nautilus 符号归一化。默认为 `true`。
- `output_path`（`str | null`）：Parquet 数据的输出目录。未设置时，若 `NAUTILUS_PATH`
  已设则用 `<NAUTILUS_PATH>/catalog/data`，否则用当前工作目录。
- `book_snapshot_output`（`"deltas" | "depth" | null`）：快照的输出格式。默认
  `"deltas"`。
- `extract_bbo_as_quotes`（`bool | null`）：同时从 Tardis Machine `option_summary` 消息的
  最优买卖价字段写出 `QuoteTick` 数据。默认为 `false`。
- `compression`（`"zstd" | "snappy" | "uncompressed" | null`）：Parquet 压缩编解码器。
  默认为 `"zstd"` 3 级。
- `proxy_url`（`str | null`）：Tardis HTTP 请求的代理 URL。默认不使用代理。
- `options`（`JSON[]`）：必需的回放请求选项对象。

示例配置文件位于 `crates/adapters/tardis/bin/example_config.json`：

```json
{
  "tardis_ws_url": "ws://localhost:8001",
  "output_path": null,
  "options": [
    {
      "exchange": "bitmex",
      "symbols": [
        "xbtusd",
        "ethusd"
      ],
      "data_types": [
        "trade"
      ],
      "from": "2019-10-01",
      "to": "2019-10-02"
    }
  ]
}
```

### 订单簿快照输出 {#book-snapshot-output}

配置项 `book_snapshot_output` 控制 Tardis `book_snapshot_*` 消息如何转换与存储。

| 值 | Nautilus 类型 | 输出目录 | 说明 |
| :------- | :---------------- | :------------------- | :-------------------------------------- |
| `deltas` | `OrderBookDeltas` | `order_book_deltas/` | 每个快照转为清空加逐档新增增量。 |
| `depth`  | `OrderBookDepth`  | `order_book_depths/` | 含全部价位档的快照。 |

**各格式的适用场景**：

- **`deltas`（默认）**：需要重建订单簿状态、或把快照与 `book_change` 数据合并时使用。
  每个快照变成一个清空增量，随后每档一个新增增量。
- **`depth`**：策略需要周期性深度快照时使用。每个快照是包含交易场所消息中全部价位档的
  单条记录。

**避免文件覆盖**：

对同一金融工具、同一日期范围同时下载 `book_snapshot_*` 与 `book_change` 数据时，
`depth` 把快照写到 `order_book_depths/`，避免覆盖 `order_book_deltas/`。

显式指定格式的示例配置：

```json
{
  "tardis_ws_url": "ws://localhost:8001",
  "book_snapshot_output": "depth",
  "options": [
    {
      "exchange": "binance-futures",
      "symbols": ["btcusdt"],
      "data_types": ["book_snapshot_5_100ms", "book_change"],
      "from": "2024-01-01",
      "to": "2024-01-02"
    }
  ]
}
```

### 期权摘要 BBO 提取 {#option-summary-bbo-extraction}

请求 Tardis Machine 的 `option_summary` 数据且回测同时需要期权 BBO 报价时，把
`extract_bbo_as_quotes` 设为 `true`。Nautilus 仍会为每条 `option_summary` 消息写出
`OptionGreeks`。当最优买卖价字段齐全且数量有效时，还会为同一金融工具与时间戳写出一个
`QuoteTick`。

该选项只作用于 Tardis Machine 的 `option_summary` 回放与流式消息，不改变 Tardis CSV 加载。

```json
{
  "tardis_ws_url": "ws://localhost:8001",
  "extract_bbo_as_quotes": true,
  "options": [
    {
      "exchange": "deribit",
      "symbols": ["BTC-28JUN24-70000-C"],
      "data_types": ["option_summary"],
      "from": "2024-01-01",
      "to": "2024-01-02"
    }
  ]
}
```

### Python 回放 {#python-replays}

在 Python 中运行回放，创建一个类似下面的脚本：

```python
import asyncio
from pathlib import Path

from nautilus_trader.adapters.tardis import run_tardis_machine_replay


async def run():
    config_filepath = Path("YOUR_CONFIG_FILEPATH")
    await run_tardis_machine_replay(str(config_filepath.resolve()))


if __name__ == "__main__":
    asyncio.run(run())
```

### Rust 回放 {#rust-replays}

在 Rust 中运行回放，启用 `nautilus-tardis` 的 `replay` feature flag，并创建一个类似下面的二进制：

```rust
use std::path::PathBuf;

use nautilus_tardis::replay::run_tardis_machine_replay_from_config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    nautilus_common::logging::ensure_logging_initialized();

    let config_filepath = PathBuf::from("YOUR_CONFIG_FILEPATH");
    run_tardis_machine_replay_from_config(&config_filepath).await?;
    Ok(())
}
```

日志默认为 INFO 级别。要启用调试日志，导出以下环境变量：

```bash
export NAUTILUS_LOG=debug
```

一个可运行的示例二进制位于 `crates/adapters/tardis/bin/example_replay.rs`。

也可以用 cargo 运行：

```bash
cargo run -p nautilus-tardis --features replay --bin tardis-replay <path_to_your_config>
```

### 期权链回测 catalog {#option-chain-backtest-catalog}

期权链回测在 Tardis 回放把数据写入 Nautilus catalog 之后才能开始。回测加载器不会在运行期间
请求补齐缺失的 Tardis 数据，因此 catalog 必须包含：

- 来自 Tardis 金融工具元数据 API 的期权金融工具。
- 来自单层期权订单簿快照、报价数据或 `option_summary` BBO 提取的 `QuoteTick` 数据。
- 来自 Tardis `option_summary` 消息的 `OptionGreeks` 数据。

对同一批期权金融工具 ID，在 `BacktestDataConfig` 列表中同时使用 `QuoteTick` 与
`OptionGreeks`。期权链管理器把回放的 BBO 与 Greeks 聚合为 `OptionChainSlice` 快照。
原始发布用 `snapshot_interval_ms=None`；设置毫秒级间隔则发布抽稀后的快照。

策略可以用 ATM 相对或 ATM 百分比行权价区间按价内程度选合约，用 `StrikeRange.delta(target, tolerance)`
按 delta 选，或用 `StrikeRange.fixed([...])` 按固定行权价选。回测中的期权订单撮合是报价驱动的：
可成交订单作为 taker 对着对手方 BBO 成交；当后续 BBO 更新穿过限价时，被动限价单可以作为 maker 成交。

在模拟交易场所上用结构化费用模型（如 `CappedOptionFeeModel` 或 `TieredNotionalOptionFeeModel`）
显式配置期权费用。不存在从 Tardis 交易所到费用模型的自动映射。

### 期权链 CSV catalog 转换 {#option-chain-csv-catalog-conversion}

对于来自可下载 Tardis CSV 文件的历史期权链，用 `convert_tardis_options_chain_csv(...)`
把 `options_chain` 行转换为 Nautilus catalog 数据。这条路径既不调用 Tardis Machine，也不调用
金融工具元数据 API。可配合已有的 Tardis CSV 文件使用，或在没有 API key 时从下载的数据引导
建立 catalog。

转换器为每个选中的行写出 `OptionGreeks`。默认 `extract_bbo_as_quotes=True` 时，最优买卖价
完整的行还会写出 `QuoteTick`。期权链回测请保持该选项开启。仅含 Greeks 的 catalog 不提供报价，
因此对没有 BBO 数据的行权价，链管理器无法发布内容完整的 `OptionChainSlice` 快照。

金融工具推导目前仅支持 Deribit 期权。对其他期权交易场所，转换前先设 `write_instruments=False`，
并在回测前通过其他来源加载金融工具。对非 Deribit 文件保持该选项开启时，可能在数据文件已写入
catalog 之后才失败。

按时间顺序传入逐日的 `options_chain` CSV 路径。`underlyings` 过滤器匹配符号前缀，
如 `["BTC-"]`。要在每个输入文件内按间隔保留每个金融工具的最后一行，设置
`snapshot_interval_ms`；或设为 `None` 写出每个选中行。抽稀时文件内的行必须按
`local_timestamp` 排序。

显式提供 `price_precision` 与 `size_precision` 以获得确定性的报价元数据。推断出的精度
会随着后续行被读取而升高，因此文件前部写入的数据可能保留较低精度的元数据。

```python
from pathlib import Path

from nautilus_trader.adapters.tardis import convert_tardis_options_chain_csv


convert_tardis_options_chain_csv(
    filepaths=[Path("deribit_options_chain_2020-06-08.csv")],
    catalog_path=Path("catalog"),
    underlyings=["BTC-"],
    snapshot_interval_ms=60_000,
    price_precision=4,
    size_precision=1,
)
```

## 加载 Tardis CSV 数据 {#loading-tardis-csv-data}

Tardis 格式的 CSV 数据可以用 Python 或 Rust 加载。加载器从磁盘读取 CSV 文本数据并解析为
Nautilus 数据。两种接口调用同一个 Rust 加载器。

`load_*` 函数还可以指定 `limit` 参数来控制加载的最大行数。

按 [Tardis FAQ](https://docs.tardis.dev/faq/order-books)，增量加载器与流式函数会跳过文件中
第一个快照行之前的所有行。被裁剪或拆分过、不再以快照行开头的 CSV 会产生零个增量。

:::note
由于精度要求，加载混合金融工具的 CSV 文件很有挑战，不推荐这样做。请改用单金融工具的 CSV 文件。

`load_tardis_options_chain`、`stream_tardis_options_chain` 和
`convert_tardis_options_chain_csv` 函数是例外：Tardis 的 `options_chain` 文件本身就是混合
金融工具的链文件，这些路径会按金融工具分别跟踪精度。为获得确定性输出，仍推荐显式精度。
:::

### 在 Python 中加载 CSV 数据 {#loading-csv-data-in-python}

在 Python 中可用模块级的 `load_tardis_*` 函数加载 Tardis 格式的 CSV 数据。加载数据时可以选择
指定金融工具 ID、价格精度和数量精度。提供金融工具 ID 能提升加载性能。省略精度时从 CSV 推断，
但推荐显式指定以获得确定性输出，尤其是大文件。

要加载数据，创建一个类似下面的脚本：

```python
from pathlib import Path

from nautilus_trader.adapters.tardis import load_tardis_deltas
from nautilus_trader.model import InstrumentId


instrument_id = InstrumentId.from_str("BTC-PERPETUAL.DERIBIT")
deltas = load_tardis_deltas(
    filepath=Path("YOUR_CSV_DATA_PATH"),
    price_precision=1,
    size_precision=0,
    instrument_id=instrument_id,
)
```

### 在 Rust 中加载 CSV 数据 {#loading-csv-data-in-rust}

在 Rust 中可用 `crates/adapters/tardis/src/csv/mod.rs` 里的加载函数加载 Tardis 格式的 CSV 数据。
加载时可以选择指定金融工具 ID、价格精度和数量精度。提供金融工具 ID 能提升加载性能。省略精度时
从 CSV 推断，但推荐显式指定以获得确定性输出。

完整示例见 `crates/adapters/tardis/bin/example_csv.rs`。

加载数据可以用类似下面的代码：

```rust
use std::path::Path;

use nautilus_model::identifiers::InstrumentId;
use nautilus_tardis::csv::load_deltas;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Optionally specify precisions and the CSV filepath
    let price_precision = Some(1);
    let size_precision = Some(0);
    let filepath = Path::new("YOUR_CSV_DATA_PATH");

    // Optionally specify an instrument ID and/or limit
    let instrument_id = InstrumentId::from("BTC-PERPETUAL.DERIBIT");
    let limit = None;

    let _deltas = load_deltas(
        filepath,
        price_precision,
        size_precision,
        Some(instrument_id),
        limit,
    )?;
    Ok(())
}
```

## 流式读取 Tardis CSV 数据 {#streaming-tardis-csv-data}

Tardis 集成可以按可配置的分块加载并处理大型 CSV 文件。这样无需把整个文件载入内存或耗尽系统内存，
就能处理数 GB 的文件。

Python 为下列 CSV 数据提供流式函数：

- 订单簿增量（`stream_tardis_deltas` 与 `stream_tardis_batched_deltas`）。
- 订单簿深度快照（`stream_tardis_depth_from_snapshot5` 与
  `stream_tardis_depth_from_snapshot25`）。
- 报价 tick（`stream_tardis_quotes`）。
- 成交 tick（`stream_tardis_trades`）。
- 资金费率（`stream_tardis_funding_rates`）。
- 期权链行（`stream_tardis_options_chain`）。

Rust 暴露等价的 `stream_*` 函数。

### 在 Python 中流式读取 CSV 数据 {#streaming-csv-data-in-python}

模块级的 `stream_tardis_*` 函数返回有界分块的迭代器。`chunk_size` 参数接受
`[1, 1_000_000]` 内的值，控制每块读取的记录数：

```python
from pathlib import Path

from nautilus_trader.adapters.tardis import stream_tardis_trades
from nautilus_trader.model import InstrumentId

instrument_id = InstrumentId.from_str("BTC-PERPETUAL.DERIBIT")
filepath = Path("large_trades_file.csv")

trades = stream_tardis_trades(
    filepath=filepath,
    chunk_size=100_000,
    price_precision=1,
    size_precision=0,
    instrument_id=instrument_id,
)

# Stream trade ticks in chunks
for chunk in trades:
    print(f"Processing chunk with {len(chunk)} trades")
    # Process each chunk - only this chunk is in memory
    for trade in chunk:
        # Your processing logic here
        pass
```

### 流式读取订单簿数据 {#streaming-order-book-data}

订单簿数据的流式读取对增量和深度快照都可用：

```python
from pathlib import Path

from nautilus_trader.adapters.tardis import stream_tardis_deltas
from nautilus_trader.adapters.tardis import stream_tardis_depth_from_snapshot5


filepath = Path("book_snapshot_5.csv")

# Stream order book deltas
for chunk in stream_tardis_deltas(filepath):
    print(f"Processing {len(chunk)} deltas")
    # Process delta chunk

# Stream depth snapshots from snapshot_5 files
for chunk in stream_tardis_depth_from_snapshot5(filepath):
    print(f"Processing {len(chunk)} depth snapshots")
    # Process depth chunk
```

### 流式读取报价数据 {#streaming-quote-data}

报价数据的流式读取方式类似：

```python
from pathlib import Path

from nautilus_trader.adapters.tardis import stream_tardis_quotes


filepath = Path("quotes.csv")

# Stream quote ticks
for chunk in stream_tardis_quotes(filepath):
    print(f"Processing {len(chunk)} quotes")
    # Process quote chunk
```

### 内存使用 {#memory-use}

流式读取限制了同一时刻保留的已解析记录数：

- **内存占用可控**：同一时刻只把一个分块载入内存。
- **大文件处理**：迭代器可以处理大于可用 RAM 的文件。
- **分块大小可配置**：根据系统的内存与性能需求在 `[1, 1_000_000]` 内调节
  `chunk_size`（默认 100,000）。

:::warning
使用流式读取并依赖精度推断时，推断出的精度可能与整体加载整个文件不同。精度推断只在分块
边界内起作用，不同分块可能包含精度要求不同的值。要获得确定性的精度行为，请显式提供
`price_precision` 与 `size_precision` 参数。
:::

### 在 Rust 中流式读取 CSV 数据 {#streaming-csv-data-in-rust}

底层流式功能用 Rust 实现，可直接使用：

```rust
use std::path::Path;

use nautilus_model::identifiers::InstrumentId;
use nautilus_tardis::csv::stream_trades;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let filepath = Path::new("large_trades_file.csv");
    let chunk_size = 100_000;
    let price_precision = Some(1);
    let size_precision = Some(0);
    let instrument_id = Some(InstrumentId::from("BTC-PERPETUAL.DERIBIT"));

    // Stream trades in chunks
    let stream = stream_trades(
        filepath,
        chunk_size,
        price_precision,
        size_precision,
        instrument_id,
    )?;

    for chunk in stream {
        let chunk = chunk?;
        println!("Processing chunk with {} trades", chunk.len());
        // Process chunk
    }

    Ok(())
}
```

## 金融工具元数据 {#instrument-metadata}

回放流水线与数据客户端在连接 Tardis Machine 之前，会为所配置 Tardis options 中的每个交易所请求
元数据。它们使用
[Tardis 金融工具元数据 API](https://docs.tardis.dev/api/instruments-metadata-api)
把金融工具元数据解析为 Nautilus 定义。数据客户端还会把这些定义发布到 Nautilus 数据引擎。

:::note
需要有效 Tardis pro 或 business 订阅的 `TARDIS_API_KEY`。自动引导会为每个配置的 Tardis 交易所
请求全部金融工具元数据。
:::

Python 与 Rust 用户也可以直接用 `TardisHttpClient` 请求金融工具定义。该客户端接受可选的
`api_key`、`base_url`、`timeout_secs`、`normalize_symbols` 和 `proxy_url` 参数。它可以获取
单个符号或某交易所的全部金融工具。请使用 Tardis 的小写连字符交易所 ID，如 `binance-futures`。

### 在 Python 中请求金融工具 {#requesting-instruments-in-python}

```python
import asyncio

from nautilus_trader.adapters.tardis import TardisHttpClient


async def run():
    http_client = TardisHttpClient()

    instrument = await http_client.instruments("bitmex", symbol="xbtusd")
    print(f"Received: {instrument}")

    instruments = await http_client.instruments("bitmex")
    print(f"Received: {len(instruments)} instruments")


if __name__ == "__main__":
    asyncio.run(run())
```

### 在 Rust 中请求金融工具 {#requesting-instruments-in-rust}

完整示例见 `crates/adapters/tardis/bin/example_http.rs`。

```rust
use nautilus_tardis::{
    common::enums::TardisExchange,
    http::TardisHttpClient,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    nautilus_common::logging::ensure_logging_initialized();

    let client = TardisHttpClient::new(None, None, None, true, None)?;

    // Tardis instrument definitions
    let info = client
        .instruments_info(TardisExchange::Bitmex, Some("XBTUSD"), None)
        .await?;
    println!("Received: {info:?}");

    // Nautilus instrument definitions
    let instruments = client
        .instruments(
            TardisExchange::Bitmex,
            Some("XBTUSD"),
            None,
            None,
            None,
            None,
            None,
            None,
        )
        .await?;
    println!("Received: {instruments:?}");
    Ok(())
}
```

## Nautilus data client

`TardisDataClientConfig` and `TardisDataClientFactory` integrate a configured Tardis Machine stream
with a Nautilus node. The configuration selects one mode:

- A non-empty `options` list connects to the historical `ws-replay-normalized` endpoint.
- When `options` is empty, a non-empty `stream_options` list connects to the real-time
  `ws-stream-normalized` endpoint and reconnects automatically after a recoverable interruption.

One list must be non-empty. If both are set, `options` selects historical replay mode. These request
options determine the upstream exchanges, symbols, and data types. Nautilus subscription commands
do not add or remove data from the Tardis Machine WebSocket.

When `options` is empty, a BitMEX entry in `stream_options` fails before any network request.
Use historical `options` for BitMEX replay. An unsupported-exchange close from Tardis Machine
terminates the live stream without reconnecting.

The data client adds `derivative_ticker` to every configured request so it can publish funding
rates, mark prices, and index prices when their values change. It also supports the other outputs in
[supported formats](#supported-formats), including `OptionGreeks` and optional BBO `QuoteTick` data
from `option_summary` messages.

Create Python stream options from Tardis JSON, then pass them to the public data client config:

```python
from nautilus_trader.adapters.tardis import StreamNormalizedRequestOptions
from nautilus_trader.adapters.tardis import TardisDataClientConfig
from nautilus_trader.adapters.tardis import TardisDataClientFactory


stream_options = StreamNormalizedRequestOptions.from_json(
    b'{"exchange":"binance-futures","symbols":["BTCUSDT"],"dataTypes":["trade","quote"]}',
)
config = TardisDataClientConfig(stream_options=[stream_options])
factory = TardisDataClientFactory()
```

Pass `factory` and `config` to `LiveNode.builder(...).add_data_client(...)`. See
`examples/live/tardis/data_tester.py` for the node registration pattern and
`crates/adapters/tardis/examples/node_data_tester.rs` for a complete Rust replay client.

The Rust data client config can set `book_snapshot_output` to `depth`. The Python data client config uses the
default `deltas` output. The standalone replay JSON configuration supports both values.

## Trade ID derivation

Trade ticks use the venue-provided trade ID from the Tardis message or CSV row as the `TradeId`. If the venue
omits the trade ID (empty string or null on some exchanges), both parsers use a deterministic FNV-1a hash. The
hash includes the symbol, timestamp, price, amount, and side. Price and amount hash by decimal value, so both
parsers derive the same ID for the same event, provided its CSV values round-trip through `f64` unchanged. The
same venue event yields the same trade ID across replays, keeping downstream dedup intact.

## Limitations and considerations

`TardisDataClient` does not implement Nautilus data requests, including instrument, order book,
quote, trade, funding rate, and bar requests. Configure historical replay through `options`, or use
`run_tardis_machine_replay` for catalog workflows.

## Testing Tardis Node compatibility

The Deribit regression feeds a snapshot, covered queued updates, and a fresh update through the
installed Tardis Node normalizer, then checks the complete Nautilus order book. It requires Node.js
compatible with the tested `tardis-dev` package and runs separately from the default Rust tests.
From the repository root:

```bash
tardis_test_dir=$(mktemp -d)
npm install --prefix "$tardis_test_dir" --ignore-scripts --no-audit --no-fund tardis-dev@18.2.2
TARDIS_NODE_MODULE="$tardis_test_dir/node_modules/tardis-dev" \
  CARGO_BUILD_JOBS=4 NEXTEST_TEST_THREADS=4 cargo nextest run --locked -p nautilus-tardis \
  --cargo-profile nextest --run-ignored only -E 'test(test_deribit_snapshot_queued_updates_with_tardis_node)'
rm -rf "$tardis_test_dir"
```

## Contributing

:::info
For additional features or to contribute to the Tardis adapter, please see our
[contributing guide](https://github.com/nautechsystems/nautilus_trader/blob/develop/CONTRIBUTING.md).
:::
