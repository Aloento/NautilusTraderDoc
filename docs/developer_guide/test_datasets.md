# 测试数据集 {#test-datasets}

本页定义整理、存储与使用外部数据集（作为测试夹具）的目标标准。新数据集应遵循
这些标准；早于本策略的既有数据集记录在[遗留数据集](#legacy-datasets)下。

## 数据集类别 {#dataset-categories}

**小数据**（< 1 MB）连同 `metadata.json` 直接提交到 `test_data/<source>/`。
这类文件无需网络访问即可随时使用。

**大数据**（> 1 MB）以 Parquet 形式托管在 R2 测试数据桶中，SHA-256 校验和记录在
`test_data/large/checksums.json`。运行用到大数据的测试之前，从仓库根目录准备夹具：

```bash
cargo run --locked -p nautilus-testkit --bin prepare-test-data
```

该命令下载缺失的文件，并校验被跟踪的校验和清单中的每个夹具。校验和不同的缓存文件
会被替换，清单本身不变；校验和不匹配的下载会被拒绝并删除。CI 在恢复测试数据缓存后
运行这一步。

`ensure_test_data_exists()` 只检查本地文件是否存在。缺少所需夹具的测试会失败，
并在消息中指明准备命令，但不会下载数据。准备步骤与测试都遵循 `TEST_DATA_ROOT_PATH`。

**用户自取数据**适用于供应商许可、授权模式或访问控制不允许 NautilusTrader 公开
再分发的场合。这一限制同时覆盖公开仓库与公开 R2 桶。该模式下，仓库只保存清单、
获取说明与转换代码。每个用户用自己的供应商账号下载源数据并在本地转换。

符合下列任一条件时使用用户自取模型：

- 供应商要求每个用户持有自己的账号、API 密钥或历史数据许可。
- 许可允许内部使用，但未明确允许再分派生夹具。
- 数据集适合示例或选择性启用的集成测试，但不适合默认 CI。

## 必需元数据 {#required-metadata}

每个存储或再分发具体产物的整理数据集，其 `metadata.json` 至少包含：

| 字段          | 说明                                       |
| -------------- | ------------------------------------------------- |
| `file`         | 数据集的文件名。                          |
| `sha256`       | 文件的 SHA-256 哈希。                         |
| `size_bytes`   | 文件字节大小。                               |
| `original_url` | 原始源数据的下载 URL。         |
| `licence`      | 许可条款与任何再分发限制。 |
| `added_at`     | 数据集整理完成时的 ISO 8601 时间戳。  |

这些字段与 `scripts/curate-dataset.sh` 的输出一致。想要更完整的出处记录，
推荐额外添加：

| 字段           | 说明                                               |
| --------------- | --------------------------------------------------------- |
| `instrument`    | 覆盖的工具代码。                             |
| `date`          | 覆盖的交易日。                                  |
| `format`        | 存储格式（如 "Nautilus OrderBookDelta Parquet"）。 |
| `original_file` | 转换前的供应商原始文件名。           |
| `parser`        | 转换所用的解析器（如 "itchy 0.3.4"）。     |

用户自取数据集在适用时使用同样的元数据字段，并应额外包含：

| 字段               | 说明                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `distribution`      | 必须为 `"user-fetch"`。                                              |
| `fetch_method`      | 用户如何获取源数据（API、网页门户、CLI 等）。  |
| `fetch_reference`   | 面向用户下载流程的 URL 或文档引用。         |
| `auth`              | 所需的凭据或授权（如有）。                        |
| `transform_version` | 构建最终文件的本地转换管线版本。 |
| `redistribution`    | 简述该数据集的再分发限制。         |
| `public_mirror`     | 受限的供应商数据集必须为 `false`。                      |

关于用户自取数据集：

- 没有单一提交或镜像的产物时，`metadata.json` 可以省略 `file`、`sha256` 与
  `size_bytes`。此时 `manifest.json` 的 `target_files` 是本地输出文件的权威来源。
- 供应商可能为每个用户账号或每次请求生成不同的文件。此时 `original_url` 可以指向
  供应商的下载入口，而不是具体文件的 URL。

其他元数据字段在适用时仍推荐填写。特别是用户自取数据集仍应记录 `licence` 与
`added_at`。

## 存储格式 {#storage-format}

新数据集应存为 **Nautilus Parquet**（不是供应商原始格式）。这能保证：

- 所有测试数据集的数据类型一致。
- 测试时无需解析供应商格式。
- 就许可而言，衍生作品状态清晰。

使用 ZSTD 压缩（级别 3）与 1M 行组。

用户自取数据集经过本地转换后也应是 Nautilus Parquet。供应商原始文件既不进仓库，
也不进公开 R2 桶。

## 命名约定 {#naming-convention}

```
<source>_<instrument>_<date>_<datatype>.parquet
```

示例：

- `itch_AAPL_2019-01-30_deltas.parquet`
- `tardis_BTCUSDT_2020-09-01_depth10.parquet`
- `histdata_EURUSD.SIM_2020-01_quotes.parquet`

## 整理流程 {#curation-workflow}

### 简单文件（单次下载） {#simple-files-single-download}

使用 `scripts/curate-dataset.sh`：

```bash
scripts/curate-dataset.sh <slug> <filename> <download-url> <license>
```

它创建一个带版本的目录（`v1/<slug>/`），内含该文件、`LICENSE.txt`，
以及包含上述必需字段的 `metadata.json`。

### 复杂管线（解析 + 转换） {#complex-pipelines-parse-transform}

需要格式转换的数据集（如二进制 ITCH 转 Parquet）：

1. 在 `crates/testkit/src/<source>/` 中写一个整理函数，用 `#[cfg(test)]`
   或 `#[ignore]` 测试门控。
1. 函数负责：下载、解析、过滤、转换为 NautilusTrader 类型、写出 Parquet。
1. 把 Parquet 文件与 `metadata.json` 输出到本地目录。
1. 手工上传到 R2，然后把校验和加入 `checksums.json`。

### 用户自取管线（受限再分发） {#user-fetched-pipelines-restricted-redistribution}

NautilusTrader 无法再分发的数据集：

1. 提交清单与 `metadata.json`，但不要提交真实的供应商数据或转换出的 Parquet 输出。
1. 提供一个本地获取命令或脚本，使用用户自己的供应商凭据、授权或已购买的历史文件。
1. 在本地把供应商数据转换为 Nautilus Parquet。
1. 结果文件存放在被 git 忽略的本地缓存路径。
1. 让测试与示例选择性启用；数据集缺失时应干净地跳过。

新数据集默认的分发优先顺序是：

1. 提交进仓库的小数据。
1. 公开 R2 的大数据。
1. 用户自取数据。

只有当前两种选择在供应商条款下都不可接受时，才选择用户自取。

禁止：

- 把受限的供应商数据集上传到公开 R2 桶。
- 再分发权利不明确时，把供应商衍生的真实 Parquet 文件提交进仓库。
- 让默认 CI 依赖供应商凭据或付费的历史数据访问。

许可允许内部共享时，可以维护一个私有镜像供内部 CI 或员工使用。那是独立的
运维路径，不属于公开测试数据标准的一部分。

## 添加新数据集 {#adding-a-new-dataset}

1. 按上述流程整理数据。
1. 写好含全部必需字段的 `metadata.json`。
1. 小数据：提交到 `test_data/<source>/`。
1. 大数据：把 Parquet 上传到 R2，把校验和加入 `test_data/large/checksums.json`。
1. 用户自取数据：只提交清单与获取说明。源数据与衍生数据既不进仓库，也不进公开 R2 桶。
1. 需要时在 `crates/testkit/src/common.rs` 添加共享的测试数据路径函数。
1. 编写使用该数据集的测试。

用户自取数据优先采用这种布局：

```text
test_data/<source>/<slug>/
  metadata.json
  manifest.json
  README.md
```

生成的产物统一缓存在 `test_data/local/<source>/<slug>/`。确需本地保留时，
供应商原始下载放在同一缓存路径下的同级 `vendor/` 目录。

清单应机器可读且稳定，记录在另一台机器上复现获取与转换步骤所需的最少信息。

`metadata.json` 是出处、许可与再分发规则的权威来源；`manifest.json` 是获取输入、
命令、缓存位置与输出文件的权威来源。

推荐的清单字段：

| 字段               | 说明                                                 |
| ------------------- | ----------------------------------------------------------- |
| `slug`              | 稳定的数据集标识。                                  |
| `vendor`            | 供应商或交易场所名称。                                       |
| `source_type`       | `api`、`portal-download`、`purchased-archive` 等。         |
| `source_filters`    | 代码、事件 ID、市场 ID、日期范围或文件名。 |
| `target_files`      | 转换后预期的输出 Nautilus Parquet 文件。    |
| `cache_dir`         | 相对 `test_data/local/` 的本地输出位置。       |
| `fetch_command`     | 建议的获取命令或脚本入口。                    |
| `transform_command` | 建议的本地转换命令。                         |
| `env`               | 所需的环境变量。                             |
| `notes`             | 给用户的简短运维说明。                          |

依赖用户自取数据的测试应当：

- 与默认 CI 测试分开标记或分组。
- 本地数据集缺失时以清晰的消息跳过。
- 除非用户显式启用，否则不访问网络。
- 复用稳定的本地缓存路径，让每台机器只获取一次。

基于 pytest 的测试优先用这样的守卫：

```python
if not filepath.exists():
    pytest.skip(f"User-fetched test data not found: {filepath}")
```

默认 CI 不预期运行、需手工准备数据集的 Rust 测试，优先用 `#[ignore]`。

## 重新生成数据集 {#regenerating-datasets}

模式变更使某个大型 Parquet 文件失效时，从原始源数据重新生成，用下文的整理测试。
重新生成后：

1. `sha256sum /tmp/<output_file>.parquet`
1. 用新的哈希更新 `test_data/large/checksums.json`。
1. 更新对应的 `metadata.json`（sha256、size_bytes）。
1. 把 Parquet 文件上传到 R2。
1. 用重新生成的文件替换 `test_data/large/` 中的缓存文件，然后运行准备命令验证；
   设置了 `TEST_DATA_ROOT_PATH` 时使用其下的对应缓存。
1. 提交 `checksums.json` 与 `metadata.json`（这也会使 CI 缓存失效）。

### ITCH AAPL L3 增量 {#itch-aapl-l3-deltas}

来源：来自 NASDAQ EMI 的 `01302019.NASDAQ_ITCH50.gz`（约 4.4 GB）。

```bash
# Download source (keep a local copy, this is a large file)
wget -O ~/Downloads/01302019.NASDAQ_ITCH50.gz \
  "https://emi.nasdaq.com/ITCH/Nasdaq%20ITCH/01302019.NASDAQ_ITCH50.gz"

# Curation test expects source at /tmp
ln -sf ~/Downloads/01302019.NASDAQ_ITCH50.gz /tmp/01302019.NASDAQ_ITCH50.gz

# Regenerate parquet (output: /tmp/itch_AAPL.XNAS_2019-01-30_deltas.parquet)
cargo test -p nautilus-testkit --lib test_curate_aapl_itch -- --ignored --nocapture
```

### Tardis Deribit BTC-PERPETUAL L2 增量 {#tardis-deribit-btc-perpetual-l2-deltas}

来源：来自 [Tardis](https://tardis.dev/) 的
`tardis_deribit_incremental_book_L2_2020-04-01_BTC-PERPETUAL.csv.gz`。
每月首日的数据可作为免费样例获取（无需 API 密钥）。

```bash
# Download source (free sample, no API key needed)
wget -O test_data/large/tardis_deribit_incremental_book_L2_2020-04-01_BTC-PERPETUAL.csv.gz \
  "https://datasets.tardis.dev/v1/deribit/incremental_book_L2/2020/04/01/BTC-PERPETUAL.csv.gz"

# Regenerate parquet (output: /tmp/tardis_BTC-PERPETUAL.DERIBIT_2020-04-01_deltas.parquet)
cargo test -p nautilus-tardis --features arrow test_curate_deribit_deltas -- --ignored --nocapture
```

## 教程测试数据 {#tutorial-test-data}

若干教程与指南会加载用户提供的行情数据。`NAUTILUS_DATA_DIR` 环境变量可覆盖它们的
基础数据路径。这类文件用 `test_data/local/` 作为被 git 忽略的仓库本地存放位置。

### 目录布局 {#directory-layout}

```text
test_data/local/
  Binance/
    BTCUSDT_T_DEPTH_2022-11-01_depth_snap.csv
    BTCUSDT_T_DEPTH_2022-11-01_depth_update.csv
  Bybit/
    2024-12-01_XRPUSDT_ob500.data.zip
  HISTDATA/
    DAT_ASCII_EURUSD_T_202001.csv.gz
```

`test_data/local/` 目录被 gitignore。预期文件缺失时，教程脚本会以缺数据消息停止。

### 获取数据 {#obtaining-the-data}

**Binance 深度快照**来自
[Binance public data portal](https://data.binance.vision/)。下载 2022-11-01 的
BTCUSDT T_DEPTH 文件，把 snap 与 update 两个 CSV 放到 `test_data/local/Binance/`。
测试用其中一部分行（如前 10,000 行）就够。

**Bybit ob500 订单簿数据**来自 Bybit CDN：

```bash
curl -L "https://quote-saver.bycsi.com/orderbook/linear/XRPUSDT/2024-12-01_XRPUSDT_ob500.data.zip" \
  -o test_data/local/Bybit/2024-12-01_XRPUSDT_ob500.data.zip
```

完整文件约 360 MB。测试时可只取前几百行，重新打包成更小的 zip。

**HISTDATA 逐笔数据**来自 [histdata.com](https://www.histdata.com/)。下载
EUR/USD 任意月份的 ASCII 逐笔数据，把 CSV（或 `.csv.gz`）放到
`test_data/local/HISTDATA/`。

### 运行教程 {#running-the-tutorials}

构建 Python 包，然后从仓库根目录运行教程源文件：

```bash
make build-debug
NAUTILUS_DATA_DIR="$PWD/test_data/local" \
  uv run --project python --no-sync python docs/tutorials/backtest_orderbook_binance.py
NAUTILUS_DATA_DIR="$PWD/test_data/local" \
  uv run --project python --no-sync python docs/tutorials/backtest_orderbook_bybit.py
```

## 遗留数据集 {#legacy-datasets}

这些数据集早于本策略，使用供应商原始格式（CSV/CSV.gz）且没有 `metadata.json`。
它们对既有测试仍然有效。新数据集应遵循上文的 Parquet 标准。

| 数据集                    | 来源   | 格式           | 位置            | 状态   |
| -------------------------- | -------- | ---------------- | ------------------- | -------- |
| Tardis Deribit L2 deltas   | Tardis   | Parquet (large)  | `test_data/large/`  | Curated  |
| ITCH AAPL L3 deltas        | NASDAQ   | Parquet (large)  | `test_data/large/`  | Curated  |
| HISTDATA EURUSD.SIM quotes | HISTDATA | Parquet (large)  | `test_data/large/`  | Migrated |
| Tardis Deribit L2          | Tardis   | CSV (checked in) | `test_data/tardis/` | Legacy   |
| Tardis Binance snapshots   | Tardis   | CSV.gz (large)   | `test_data/large/`  | Legacy   |
| Tardis Bitmex trades       | Tardis   | CSV.gz (large)   | `test_data/large/`  | Legacy   |

原先的 `nautechsystems/nautilus_data` 目录对应上表的 HISTDATA EURUSD.SIM Parquet
文件。HISTDATA 原始 CSV 文件仍属于用户自取。
