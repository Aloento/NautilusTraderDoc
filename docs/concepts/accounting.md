# 核算 {#accounting}

核算子系统为平台对接的每个账户跟踪余额、保证金与盈亏。本指南介绍数据模型、
策略使用的查询 API，以及适配器作者必须遵循、以在各场所间保持一致的约定。

内容同时适用于回测与实时交易。回测专属的配置（初始余额、按场所选择保证金模型）
见[回测](./backtesting/index.md)。

## 账户类型 {#account-types}

实时交易与回测中，向引擎挂载场所时通过 `account_type` 选择 Cash、Margin 或 Betting。

Wallet 建模链上钱包状态，由 Blockchain 适配器选用。其执行客户端支持本地签名的
Uniswap V3 市价交换，但尚未达到生产可用。

| 账户类型 | 典型场景                                | 引擎锁定的内容                                                     |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------- |
| Cash         | 现货交易（例如 BTC/USDT、股票）    | 待成交买单的名义价值；待成交卖单的基础资产数量。   |
| Margin       | 衍生品或任何允许杠杆的产品 | 每笔订单的初始保证金，加未平仓持仓的维持保证金。 |
| Betting      | 体育博彩、做庄                      | 场所要求的投注额。无杠杆。                                 |
| Wallet       | 区块链钱包（DeFi）                       | 为待成交订单在本地预留的金额。无杠杆、无借贷。    |

### Cash 账户 {#cash-accounts}

Cash 账户**全额结算交易**，没有杠杆，因而不存在保证金概念。锁定余额反映为待成交
订单预留的价值：每笔待成交买单的名义价值，以及每笔待成交卖单将交付的数量。

卖出交付的是工具的基础资产，预留因而应记在该资产上。`base_currency()` 为
`None` 的工具（二元期权、股票等）不建模这种资产：这类工具的待成交卖单
**不锁定任何东西**，其所得也不会与可用计价余额比对。

若按订单数量在计价币种上预留，就等于把股数或合约数当作金钱，锁定这笔销售
永不消耗的抵押品；再把销售所得与可用抵押品比对，会因为缺少这笔销售自己
入账的余额而拒单。

实时交易中，这类工具的可用库存不在本地跟踪或检查，并发卖出也不例外，
由场所负责执行，任何拒绝经正常订单生命周期送达。这一边界是有意为之：
在本地复现场所的库存检查，需要适配器收不到的逐资产余额。
有基础资产的工具的买入预留与卖出检查不变。

#### 模拟卖空检查 {#simulated-short-selling-checks}

回测与沙箱中，现金账户上每笔股票或二元期权卖单在提交时检查：订单剩余数量
不得超过所选持仓中的多头库存，包括已成交但尚未更新到持仓的部分。
减少或平掉该持仓的卖单仍然有效。

对按计价金额给出的卖单，检查用订单价格或当前买价折算合约数。
触发式市价单与移动止损单成交时的转换价可能不同，合约数量随之变化。

入场订单只有随成交逐步为其后续出场订单贡献库存。`oto_full_trigger`
默认为 `false`，因此部分成交后全量出场可能被拒绝。设为 `true`
则出场要等全额入场成交后才释放。持仓更新被延迟时同样适用。

这项提交时检查不为其他在途卖单预留库存，也不在数量后续变化时重新校验。

### Margin 账户 {#margin-accounts}

Margin 账户支持需要抵押品的工具，如期货或带杠杆的加密永续。它跟踪账户余额，
为在途订单与持仓预留保证金，并可按工具配置杠杆。引擎在两个范围内跟踪保证金，
见下文[保证金范围](#margin-scopes)。

**术语**：

- **杠杆**：相对账户净值放大敞口。杠杆越高，潜在收益与风险都越高。
- **初始保证金**：提交订单时预留的抵押品。
- **维持保证金**：保持未平仓持仓所需的最低抵押品。
- **锁定余额**：作为抵押品预留的资金，不可用于新订单。

:::note
只减仓订单只能降低敞口，因此不计入现金账户的 `balance_locked`，
也不增加保证金账户的初始保证金。Wallet 订单仍预留输入资产，
因为链上交易无论是否减仓都会消耗该资产。
:::

### Betting 账户 {#betting-accounts}

Betting 账户专用于以固定金额博取固定赔付的场所（预测市场、体育博彩）。
引擎只锁定场所要求的投注额，杠杆与保证金不适用。

### Wallet 账户 {#wallet-accounts}

Wallet 账户表示区块链钱包：无杠杆、多币种的 native 与 ERC-20 代币余额，
没有保证金，也没有借贷。

对于报告式状态：

- `total` 是观察到的链上余额。
- `locked` 跟踪本地待成交订单的预留。
- `free = total - locked`。

账户状态事件**只贡献 total**：账户忽略传入的 `locked` 与 `free`，
保留本地预留并重新推导 `free`。实时启动时，它根据已提交和未成交订单
重建这些瞬时预留。

改单待确认期间，账户按借记币种预留其观察到的全部余额——待确认事件不携带
请求的条款。若预留额超过最新观察到的 total，`locked` 以 `total`
封顶，`free` 保持为零，直到余额或预留变化。

total 为负的余额会被拒绝而非应用。ERC-20 allowance 是对支出方的授权，
从不表示为余额或锁定资金。

## 余额模型 {#balance-model}

`AccountBalance` 在同一币种下持有三个值：

- `total`：场所报告的总余额数字（依场所而定，可能是钱包余额、净清算值或保证金余额）。
- `locked`：为在途订单与持仓预留的金额。
- `free`：可用于新订单的金额（`total - locked`）。

**余额不变式** `total == locked + free` 必须在币种精度下恒成立。

Python 的 `AccountBalance(total, locked, free)` 构造函数要求一次给足三个字段。
用 Rust 编写的适配器代码另有强制该不变式的派生构造函数。只要场所只报告三者中的
两个，就应优先使用它们而非 `AccountBalance::new`：

| Rust 构造函数                        | 使用场景                                                              |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `AccountBalance::from_total_and_locked` | 场所报告 total 与 locked，`free` 由两者推出。          |
| `AccountBalance::from_total_and_free`   | 场所报告 total 与 free，`locked` 由两者推出。          |
| `AccountBalance::new`                   | 三个值均已知且一致（测试、直通路径）。 |

`total >= 0` 时，每个派生构造函数把场所报告的字段钳制到 `[0, total]`，
场所舍入造成的瞬时越界不会让账户处于破损状态。

## 币种与估值约定 {#currency-and-valuation-contracts}

核算数值在显式转换成功前保持其源币种。这防止有效数字被标上错误币种，
也防止不可得的值被当作零。

| 数值                        | 币种约定                                              |
| ---------------------------- | -------------------------------------------------------------- |
| 工具成本币种     | 反向合约为基础币种，quanto 合约为结算币种，其余为计价币种。  |
| 持仓盈亏                 | 开仓时确定的工具成本币种。     |
| 计算式锁定与保证金 | 各计算金额自身的币种，独立换算。    |
| 组合聚合         | 原生分桶，或换算成功后的账户基础币种。 |

聚合只合并可兼容的 `Money` 值。没有基础币种的账户保持各原生币种独立分桶。
单工具已实现盈亏查询遇到混合币种时返回"不可得"，而不是强行合并。

核算与估值路径还遵循这些规则：

- 无效或不可表示的名义值、盈亏、手续费、锁定余额与保证金结果会产生错误、
  不可得值或未估价状态，不会以零替代。已实现盈亏重算失败时，
  先前缓存的结果也会一并清除。
- 对没有基础币种的多币种现金账户，`equity()` 对已入账的非反向基础资产只计一次。
  `mark_values()` 仍是持仓总值查询，包含该资产。
- MTM 快照区分沿用的陈旧输入与从未有完整估值数据的持仓。
  陈旧价格元数据只覆盖未平仓的工具与持仓方向的组合。

净值公式、价格与汇率选择、快照元数据、缺失价格查询范围见
[组合](./portfolio.md#equity-and-mark-to-market)。

## 保证金范围 {#margin-scopes}

`MarginBalance` 有四个字段：`initial`、`maintenance`、`currency`，
以及一个 `Optional[InstrumentId]`，用于选择两个范围之一。

### 按工具范围 {#per-instrument-scope}

`MarginBalance.instrument_id` 设为具体工具。适用于：

- 逐仓保证金（按持仓的抵押品）。
- 回测或计算式保证金：`AccountsManager` 按工具根据在途订单与持仓
  在本地推导保证金。

### 账户级范围 {#account-wide-scope}

`MarginBalance.instrument_id` 为 `None`，条目以 `currency`
（抵押品币种）为键。适用于按抵押币种报告单一汇总值的全仓（cross-margin）场所。
场所可能发出一条账户级条目（单抵押品全仓）或多条（每种抵押币一条）。

两个范围在同一 `MarginAccount` 上以独立的内部存储并存。`AccountState`
事件可以携带任一或两个范围的条目。`MarginAccount.apply()` 依据
`instrument_id` 是否设置，把每个条目路由到正确的存储。

:::warning
`MarginAccount.apply()` 用传入事件**替换**两个保证金存储，不与旧状态合并。
事件既无余额也无保证金时，原有存储保持不变。

发送部分快照的适配器必须在每次更新中带上每个活动保证金条目，
否则这些条目会被丢弃，直到下一个完整快照。

事件携带的余额按币种替换对应存储条目，事件未涉及的币种保留。
:::

## 策略查询 API {#strategy-query-api}

按场所的报告形态选择匹配的查询。场所按工具报告保证金就按 `InstrumentId` 查，
按账户级报告就按 `Currency` 查。

| 范围          | 查询                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| 按工具 | `margin`、`initial_margin`、`maintenance_margin`                         |
| 账户级   | `account_margin`、`account_initial_margin`、`account_maintenance_margin` |
| 两个范围    | `total_initial_margin`、`total_maintenance_margin`                        |

下列签名描述 Python 绑定。点查询在条目缺失时返回 `None`；
汇总查询始终返回 `Money`（无匹配时为该币种的零值）。

### 按工具查询（`MarginAccount`） {#per-instrument-queries-marginaccount}

- `margin(instrument_id) -> MarginBalance | None`
- `initial_margin(instrument_id) -> Money | None`
- `maintenance_margin(instrument_id) -> Money | None`
- `margins() -> dict[InstrumentId, MarginBalance]`（全部按工具条目）
- `initial_margins() -> dict[InstrumentId, Money]`
- `maintenance_margins() -> dict[InstrumentId, Money]`

这些方法只看到按工具存储。在全仓场所上它们返回空字典或 `None`，
请使用下面的账户级查询。

### 账户级查询（`MarginAccount`） {#account-wide-queries-marginaccount}

- `account_margin(currency) -> MarginBalance | None`
- `account_initial_margin(currency) -> Money | None`
- `account_maintenance_margin(currency) -> Money | None`
- `account_margins() -> dict[Currency, MarginBalance]`（全部账户级条目）
- `account_initial_margins() -> dict[Currency, Money]`
- `account_maintenance_margins() -> dict[Currency, Money]`

### 合计（`MarginAccount`） {#totals-marginaccount}

以下方法对指定币种汇总按工具与账户级条目：

- `total_initial_margin(currency) -> Money`
- `total_maintenance_margin(currency) -> Money`

策略所在的场所可能两种范围并存（例如逐仓持仓与全仓抵押品同在场）时很有用。

### Python 绑定边界 {#python-binding-boundary}

这一查询界面不暴露 Rust 内部变更方法
`update_margin`、`clear_margin`、`clear_account_margin`、`clear_initial_margin`、
`clear_maintenance_margin`、`set_margin_model`。Python 暴露其他变更方法，
包括 `update_initial_margin`、`update_maintenance_margin`、
`set_default_leverage`、`set_leverage`。

### 组合级查询 {#portfolio-level-queries}

保证金查询：

- `portfolio.instrument_initial_margins(venue=..., account_id=...) -> dict[InstrumentId, Money] | None`
- `portfolio.instrument_maintenance_margins(venue=..., account_id=...) -> dict[InstrumentId, Money] | None`

`account_id` 选定该账户。只给场所时，只有该场所下恰好签发一个账户才能解析；
多个账户共享场所时请传 `account_id`。

保证金账户可解析时，这两个方法返回与
`MarginAccount.initial_margins`、`MarginAccount.maintenance_margins`
相同的按工具金额视图；没有可解析的保证金账户时返回 `None`。

全仓场所的账户级数据，直接经
`portfolio.account(venue=venue).account_initial_margin(ccy)` 查询账户。
返回的账户是**脱离的快照**，不能变更 Portfolio 状态。

盈亏、敞口、盯市与净值查询都接受 `venue` 和可选 `account_id`
来限定多账户场所：

- `portfolio.unrealized_pnls(venue=..., account_id=..., target_currency=...) -> dict[Currency, Money]`
- `portfolio.realized_pnls(venue=..., account_id=..., target_currency=...) -> dict[Currency, Money]`
- `portfolio.total_pnls(venue=..., account_id=..., target_currency=...) -> dict[Currency, Money]`
- `portfolio.net_exposures(venue=..., account_id=..., target_currency=...) -> dict[Currency, Money] | None`
- `portfolio.mark_values(venue=..., account_id=...) -> dict[Currency, Money]`
- `portfolio.equity(venue=..., account_id=...) -> dict[Currency, Money]`
- `portfolio.missing_price_instruments(venue, account_id=...) -> list[InstrumentId]`

两个范围参数同时给出时，必须指向同一账户。缺失价格、目标币种换算失败或
算术溢出会使整个受影响集合失效：查询绝不返回部分或混合币种的合计。

净值公式、价格回退链、基础币种换算行为、警告仅一次的缺失价格跟踪器，
见[组合指南](./portfolio.md#equity-and-mark-to-market)。

### 实例 {#worked-examples}

单抵押品全仓（一条账户级条目）：

```python
usdc_margin = margin_account.account_initial_margin(USDC)
usdc_total = margin_account.total_initial_margin(USDC)
```

按币全仓（每种抵押币一条）：

```python
for ccy, margin_balance in margin_account.account_margins().items():
    print(ccy, margin_balance.initial, margin_balance.maintenance)
```

## 保证金模型 {#margin-models}

NautilusTrader 为计算路径（回测，以及以 `calculate_account_state=True`
运行以做对账的实时策略）提供灵活的保证金计算模型。场所报告的保证金
直接进入账户的 `margins` 或 `account_margins` 存储，不经过模型。

### 概览 {#overview}

不同场所对待杠杆的方式不同：

- **传统券商**（例如 Interactive Brokers）：保证金比例固定，与杠杆无关。
- **加密交易所**（Binance 等）：杠杆可能降低保证金要求。

两个内置模型都按工具 `margin_init` 与 `margin_maint` 字段对名义值取百分比
计算保证金，区别只在杠杆是否降低预留额。对真正按合约固定保证金的场所
（CME / ICE），设置 `instrument.margin_init` 与 `margin_maint`，
让百分比还原出目标金额。

### HEDGING 模式的轧差 {#hedging-mode-netting}

`OmsType.HEDGING` 下，新持仓 ID 的首笔成交开启一个 `Position`，
后续成交更新该持仓，因此账户可就同一工具持有多个未平仓子持仓。
账户管理器按 `ts_opened` 顺序把这些子持仓轧差到一个假想的 NETTING 持仓上，
再对轧差后的净带符号数量与平均开仓价运行一次保证金模型。

重放遵循与 `Position.apply` 相同的规则：

- 同方向成交得到数量加权的平均开仓价。
- 反方向成交按既有均价部分平仓。
- 穿越零位的成交使剩余部分采用该笔成交的价格。

`ts_opened` 相同的子持仓按 `(ts_opened, position_id)` 顺序折叠，
结果不依赖缓存迭代顺序。

在相同保证金模型与杠杆下，只要折叠后的净数量与平均开仓价一致，HEDGING 与
NETTING 的维持保证金就一致。保证金要求随**净经济敞口**缩放。

### 可用模型 {#available-models}

#### `StandardMarginModel` {#standardmarginmodel}

**使用固定百分比、不除以杠杆**，与传统券商行为一致。

```python
# Fixed percentages - leverage ignored
margin = notional * instrument.margin_init
```

- 初始保证金：`notional_value * instrument.margin_init`
- 维持保证金：`notional_value * instrument.margin_maint`

**适用场景**：传统券商（Interactive Brokers）、保证金要求固定的外汇经纪商。

#### `LeveragedMarginModel` {#leveragedmarginmodel}

把保证金要求**除以杠杆**。

```python
# Leverage reduces margin requirements
adjusted_notional = notional / leverage
margin = adjusted_notional * instrument.margin_init
```

- 初始保证金：`(notional_value / leverage) * instrument.margin_init`
- 维持保证金：`(notional_value / leverage) * instrument.margin_maint`

**适用场景**：按杠杆降低保证金的加密交易所，以及杠杆影响保证金要求的场所。

### 默认行为 {#default-behavior}

`MarginAccount` 默认使用 `LeveragedMarginModel`。回测把
`StandardMarginModel` 直接传给 `BacktestVenueConfig.margin_model` 即可选用。

### 实例：EUR/USD {#worked-example-eurusd}

- **工具**：EUR/USD
- **数量**：100,000 EUR
- **价格**：1.10000
- **名义值**：$110,000
- **杠杆**：50x
- **`instrument.margin_init`**：3%

| 模型     | 计算            | 结果 | 百分比 |
| --------- | ---------------------- | ------ | ---------- |
| Standard  | $110,000 × 0.03        | $3,300 | 3.00%      |
| Leveraged | ($110,000 ÷ 50) × 0.03 | $66    | 0.06%      |

在 $1,000 的账户上：Standard 模型会拒单，Leveraged 模型允许成交。

### Python 模型选择 {#python-model-selection}

把 `StandardMarginModel()` 或 `LeveragedMarginModel()` 直接传给回测场所。
Python 绑定不接受自定义保证金模型子类或 `MarginModelConfig` 包装。
见[回测](./backtesting/accounts-and-margin.md#margin-models)。

## 适配器约定 {#adapter-convention}

实时适配器把场所响应翻译为 `AccountBalance` 与
`MarginBalance` 实例。适配器作者必须遵循以下约定：

### 构建 `AccountBalance` {#building-accountbalance}

优先使用派生构造函数，让钳制与 `total == locked + free` 不变式在中央得到强制。
手工算好三个字段再传给 `AccountBalance::new`，只适用于三个值都已权威已知的
直通路径（例如测试）。

### 构建 `MarginBalance` {#building-marginbalance}

选择与场所报告形态匹配的范围：

| 场所报告                                  | 范围          | 发出方式                                                  |
| ---------------------------------------------- | -------------- | ---------------------------------------------------------- |
| 按工具（逐仓持仓）            | 按工具 | `MarginBalance::new(initial, maint, Some(id))`             |
| 每种抵押品一条汇总（全仓） | 账户级   | `MarginBalance::new(initial, maint, None)`                 |
| 多条汇总，每种抵押品一条        | 账户级   | 每种币种一条 `instrument_id=None` 的 `MarginBalance` |

:::info
不使用合成的 `ACCOUNT.{VENUE}` 或 `ACCOUNT-{COIN}.{VENUE}`
`InstrumentId` 占位符。账户级条目携带 `instrument_id=None`，
以 `currency` 为键。
:::

## 相关指南 {#related-guides}

- [回测](./backtesting/index.md)：初始余额、保证金模型与回测专属的账户
  设置。
- [组合](./portfolio.md)：组合级盈亏、敞口与币种换算。
- [持仓](./positions.md)：持仓生命周期、聚合与盈亏。
- [适配器](./adapters.md)：适配器作者的要求与最佳实践。
- [区块链](./../integrations/blockchain.md)：选用 Wallet 账户的适配器
  及其执行状态。
