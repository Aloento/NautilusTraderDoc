# 迁移 Parquet 目录 {#migrate-a-parquet-catalog}

用 `nautilus catalog migrate-parquet` 把已有的 Nautilus Parquet 目录重写为当前 Arrow 格式。
该命令读取源目录并写入一个独立的目标目录，目标必须是新的或空的，且不能与源重叠。两个位置
都可以是本地路径或受支持的对象存储 URI。

## 执行迁移 {#run-the-migration}

先校验源 schema：

```bash
nautilus catalog migrate-parquet /data/catalog-old /data/catalog-new --dry-run
```

试运行仅根据源 schema 与布局规划迁移。它报告可识别的文件、schema 冲突和位于受支持目录树
之外的文件，且不创建任何目标文件或目录。它不解码行值，也不证明目标可写。先解决报告的
schema 错误，再执行转换：

```bash
nautilus catalog migrate-parquet /data/catalog-old /data/catalog-new
```

在源码检出目录中运行时，使用：

```bash
cargo run -p nautilus-cli -- catalog migrate-parquet /data/catalog-old /data/catalog-new
```

远程存储时，用可重复的 `--source-option key=value` 和 `--target-option key=value` 参数传入
原生对象存储设置。

两个位置之间的重叠会在创建任何东西之前被拒绝；非空目标中不会写入任何数据，因此对已完成的
目标重复执行会失败，而不会覆盖其文件。本地路径下，空目录检查运行之前，目标目录本身可能已
被创建。

迁移会保留源文件：只读取它们，并在转换每个文件前重新检查其大小与版本标记。

若某个文件的行超出其文件名中的时间戳区间，转换也会拒绝该文件；仅看 schema 的试运行检测不到
这种情况。请在单独的副本中修正源的覆盖范围，然后重试到一个新的空目标。

打印的报告区分：已迁移的文件与行数、转码的行数、由路径推导标识符的行数、跳过的文件、以及
未迁移的文件；空覆盖文件计入已迁移文件、行数为零。切换之前先检查报告。

## Arrow 表示 {#arrow-representation}

当前格式使用标准 Arrow 类型。下面每种表示适用于其旁注的记录族。

| 值                      | 当前 Arrow 表示                                   | 记录族                                                                                  |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 价格与数量              | `Decimal128(38, 16)`                              | 报价、成交、K 线、delta、深度档位、标记价与指数价、收盘价                               |
| 小数文本                | UTF-8 字符串                                      | Funding `rate`、金融工具、订单、持仓、快照与报告记录                                    |
| 浮点度量                | `Float64`                                         | 期权 Greeks、持仓 `signed_qty` 以及均价/收益字段                                        |
| 时刻时间戳              | `Timestamp(Nanosecond, Some("UTC"))`              | 每个 `ts_event`/`ts_init` 列及其他时刻字段                                              |
| 时长与计数              | 无符号整数                                        | 持仓 `duration`、funding `interval`、序号、计数、订单 ID、标志位                        |
| 行情枚举                | `Dictionary<Int8, Utf8>` 枚举名                   | 成交主动方、delta 动作/方向、收盘类型、状态动作、Greeks 约定                            |
| 记录枚举与 ID           | UTF-8 字符串                                      | 订单、持仓、快照与报告的枚举、方向、状态和 ID                                           |
| 结构化负载              | 以 `arrow.json` 编码的 UTF-8 字符串               | 账户余额/保证金/`info`、订单 `info`/手续费/标签、报告                                   |
| 自定义 `Money`          | 小数金额与货币字典组成的 struct                   | Arrow 宏生成的自定义数据 `Money` 字段                                                   |
| 深度方向                | 价格、数量、计数、订单 ID struct 的 list          | 订单簿深度                                                                              |

纳秒值保持精确，包括同一微秒内的不同时间戳；时长保持整数值。

`OrderFilled` 展示了记录族与行情数据的差异：它的 `last_px`、`last_qty`、`order_side`、
`order_type` 和 `liquidity_side` 列全部是 UTF-8 字符串，只有 `info` 列使用 `arrow.json`。

显示输出是独立的便捷表示，可能使用浮点价格与数量。需要精确小数值时，请使用可用的原始输出。

### 存储标度与精度 {#storage-scale-and-precision}

物理小数一律使用标度 16，每个文件的 schema 元数据携带解释它们所需的领域值
`price_precision` 和 `size_precision`。标准精度构建在编码时对原始整数重新定标；读取方会拒绝
其数值配置无法精确表示的值，而不是四舍五入。精度元数据大于 16、以及精度大于 16 的 `Money`
货币都会被拒绝，因此 wei 这类 DeFi 精度不在目录可表示的范围内。

### Schema 识别与兼容性 {#schema-identification-and-compatibility}

schema 指纹记录有序的字段名、Arrow 类型与可空性。迁移注册表对已注册的传统转码器使用精确
指纹。匹配当前 schema 时按名称与类型检查列，字典字符串接受纯 UTF-8，不要求字段顺序或可空性
一致。schema 元数据不计入指纹：`type_name`、身份与数值精度仍是独立要求。没有持久化的整数
schema 版本。仅凭发布版本号无法确定文件的 schema。

V2 目录的 Arrow schema 与 v1 不同。兼容性更新保留既有字段的含义、精确数值、身份与时间戳。
不兼容 schema 的变更需要显式迁移和文档化的源支持；读取方不得悄悄重新解释旧文件。对于位于
当前目录布局中的文件，运行时查询会拒绝被查询选中的文件里可识别的传统 schema，并引导调用方
去执行迁移——即使某个 SQL 谓词本会返回零行。时间戳边界可能在 schema 校验前就排除文件。
查询也会跳过更旧的目录布局；这两种情况都可能返回零行且没有 schema 错误。查询传统目录前
请先迁移。

### 空值与被拒绝的值 {#nulls-and-rejected-values}

未定义的价格与数量在可空的记录族（如 delta、收盘价、标记价与指数价）中映射为 Arrow null。
报价、成交和 K 线把价格与数量列声明为非空，编码时拒绝未定义值，解码时拒绝 null，并指明字段
与行。深度档位字段不可空：编码时省略缺失档位，解码时拒绝 null 档位与 null 值。无效值以及
超出可表示范围的值都会产生错误。

### 身份与文件布局 {#identity-and-file-layout}

每个文件的 schema 元数据在 `type_name` 下写明其类型，例如 `QuoteTick`、`OrderFilled`、
`CryptoPerpetual` 或已注册的自定义类型，并在 `instrument_id` 或 `bar_type` 下携带其身份。
目录名重复这一身份。行情文件（包括 funding rate、工具状态和期权 Greeks）只在元数据中保留
工具 ID；记录文件同时把它存为一列。写入器在持久化前剥离内存中可空的 `identifier` 列，因此
存储的文件不含 `identifier` 列。Parquet 文件不存储 cluster key。

目录按数据类型与标识符分组文件。自定义数据使用 `data/custom/<type>/<identifier>/`；金融工具
按每个具体工具类型建一个文件夹。读取迁移源时能识别旧文件夹名，包括 `quote_tick`、
`order_book_depth10`、按类划分的工具目录和 `custom_<type>`。

## 哪些会转换 {#what-converts}

| 源形态                                     | 转换                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| 定宽行情数据，8 或 16 字节字段             | 归一化为小数、UTC 时间戳、枚举字典、纯 UTF-8                   |
| 扁平 10 档与定长 list 深度                 | 重建为变长深度 list；null 档位丢弃；缺失 ID 置零               |
| 带传统 `type` 元数据的记录                 | 对齐到已注册的记录 schema，包括 `info`                         |
| 带传统 `class` 元数据的金融工具            | 解码并按类重新编码为字符串 schema                              |
| 已知的传统状态、funding 与收盘形态         | 通过三个已注册转码器转换                                       |
| 带 `type_name` 的最终格式自定义数据        | 直接透传；`custom_<type>` 重命名为 `custom/<type>`             |
| 不带 `type_name` 的传统自定义数据          | 从 `custom_<type>` 目录推断类型并重命名                        |
| 空覆盖文件                                 | 以空文件复制到重命名后的布局                                   |

随后，迁移会对每个内置的目标 batch 解码，再用当前编码器重新编码，因此迁移后的文件与后续写入
产生的文件具有相同的 schema 和元数据，二者可以合并。被当前解码器拒绝的行会导致迁移失败。

自定义数据的 `ts_event` 和 `ts_init` 列若以 `uint64` 纳秒存储，会转换为
`timestamp("ns", tz="UTC")`。传统字典编码的字符串列变为纯 UTF-8；其他受支持的自定义数据列
原样透传。时间戳已是纳秒 Arrow 时间戳的自定义文件原样透传。时间戳使用其他物理类型的文件
（尤其是旧版 pandas 写入目录中的 `int64`）会在预检失败：请先重 cast 为 `uint64` 纳秒再迁移。

从 `custom_<type>` 目录推断类型是尽力而为的 snake_case 转 PascalCase：缩写经不起这种转换，
因此切换前请核对推断出的目标目录。

定深源格式省略订单 ID，迁移会保留其读取器返回的零 ID。目标格式在后续写入中会保留订单 ID。

### 哪些不会转换 {#what-does-not-convert}

- **Feather 树。** `backtest` 和 `live` Feather 树不在本命令范围内。请改用
  [流式工作流](./stream_parquet_catalog.md)转换已暂存的运行。
- **未迁移路径。** `portfolio_snapshot` 目录、非 Parquet 叶子节点和无法识别的目录会报告为
  未迁移，绝不转换。
- **预检失败。** schema 冲突、传统 `custom_<type>` 目录之外缺失 `type_name` 元数据、没有
  `class` 或 `type_name` 元数据的金融工具、定二进制自定义列、既非 `uint64` 也非纳秒 Arrow
  时间戳的自定义时间戳，以及未知指纹，都会在预检阶段失败并列出全部问题，且在任何目标写入
  之前。

### 已验证的源与切换检查 {#verified-sources-and-cutover-checks}

已发布版本的覆盖范围限于来自 **1.231.0** 版本的以下 fixtures：

| 源写入器                    | 数值配置            | 已验证的记录族                                |
| --------------------------- | ------------------- | --------------------------------------------- |
| 发布的 Python Linux wheel   | 128 位              | 报价、`CurrencyPair`、Binance 标记价更新      |
| 发布 tag 处的 Rust 源码     | 64 位               | 报价与 `CurrencyPair`                         |
| 发布的 Python 适配器写入器  | 与精度无关          | 两个 fixture 目录中的 Binance 标记价更新      |

Binance fixture 是 `BinanceFuturesMarkPriceUpdate`：其价格与 funding rate 为字符串，同一个已
发布适配器文件在两种数值配置下都经过测试。测试比较解码后的报价与工具字段、全部适配器 Arrow
字段、分区身份、纳秒时间戳、已知的空覆盖，以及源文件字节。适配器验证覆盖迁移与原始 Arrow
查询，不承诺在适配器 schema 变更后的强类型解码。已发布的 Python 工具写入器不写 tick scheme，
因此迁移无法恢复它们。fixture 的来源与复现说明随源数据放在
`test_data/nautilus/catalog_1_231_0/`。

这份矩阵并不能确立对所有 1.x 版本、工具类或适配器的支持。其他版本与记录族需要各自的源
fixture 和切换比较。未知指纹与不受支持的自定义时间戳类型仍是预检错误。

额外的端到端覆盖来自 develop 提交 `1602043deb`，构建时启用了 `high-precision` feature。它
覆盖报价、成交、K 线、定深订单簿、`CurrencyPair` 工具、账户状态记录和一个通用自定义数据类型。
测试把解码后的目标值与原始值比较，并检查源文件保持字节级一致。该 fixture 不能确立最低受支持
版本，也不覆盖所有历史目录格式。

合成工具的回归测试还覆盖带传统 `class` 元数据的 `CryptoPerpetual` 文件中的纯字符串与字典编码
字符串、`uint64` 与 `timestamp("ns", tz="UTC")` 两种时间戳，以及有无已移除的 `maker_fee` 和
`taker_fee` 列。迁移会丢弃这些费率列，因为当前工具模型不再存储它们。运行时查询会拒绝这些传统
工具文件并引导用户执行迁移命令；读取时不会转换文件。

源中包含以下内容时，请仔细检查目标：

- 更旧 Nautilus 版本写入的数据。
- `CurrencyPair` 和 `CryptoPerpetual` 之外的工具类型。
- 上述 Binance fixture 之外的适配器自定义数据，如 Betfair、Deribit 和 Hyperliquid。
- delta、标记价与指数价、收盘价、Greeks、当前形态的 funding，或 `account_state` 之外的记录族。

通过查询目标并与源比较解码后的值、身份、时间戳和覆盖区间来验证目标。仅比较文件数和行数是不够的。

## 从失败的迁移中恢复 {#recover-from-a-failed-migration}

转换时一次处理一个文件，每个源文件都完整读入内存。文件按顺序以"仅创建"方式写入，因此失败
可能留下不完整的目录。

:::warning[重试到新的空目标]
没有"续传到部分完成的目录"这种机制。修正原因后重试到一个新的空目标；重试到那个不完整的目录
会因空目录检查而失败。
:::

回滚使用被保留的源：把应用指回与兼容应用版本的源目录。没有反向迁移，因此切换之后只写入新目标
的数据不会回流到源。

## 读取结果 {#read-the-result}

把 `ParquetDataCatalog`、回测数据配置或实时节点的目录配置指向目标目录。使用当前 Nautilus 版本
写入更多数据。PyArrow、pandas 和 Polars 可以直接读取开放的 Arrow 值，无需 Nautilus 专用的
二进制解码器。

新的流式数据见 [Parquet 流式写入](./stream_parquet_catalog.md)。
