# 执行测试规范

使用这份测试矩阵，配合 Rust 的 `ExecTester` 策略验证适配器的执行功能。Python 将其作为内置策略暴露，通过
`nautilus_trader.testkit.ExecTesterConfig` 配置；Rust 代码从 `nautilus_testkit::testers` 导入。用例使用带前缀的
ID（例如 TC-E01），按功能分组。

**每个适配器必须通过与其支持能力相对应的那部分测试。**

测试从简单（单笔市场单）到复杂（括号单、修改链、拒绝处理）递进。通过第 1-5 组的适配器即视为达到基线合规。
先用[数据测试规范](./spec_data_testing.md)验证数据连通性，再跑执行测试。

适配器特有的行为（交易场所如何撮合市场单、如何处理 TIF 选项等）写在各适配器自己的指南里，不写在这里。
每个适配器指南都应包含一份能力矩阵，列出其支持的订单类型、有效期选项、动作和标志。

## 前置条件 {#prerequisites}

运行执行测试前：

- 有有效 API 凭证的 demo/testnet 账户（推荐但非必需）。
- 账户资金足以支撑测试所用的金融工具和数量的保证金。
- 目标金融工具可用，且能通过 instrument provider 加载。
- 已设置环境变量：`{VENUE}_API_KEY`、`{VENUE}_API_SECRET`（或 sandbox 变体）。
- 交易场所若提供 demo/testnet 模式，使用该环境下创建的凭证。演示环境与生产环境的 API key 通常相互独立、
  不可互换。用错凭证会导致鉴权错误（如 HTTP 401）。
- 绕过风控引擎（`LiveRiskEngineConfig(bypass=True)`），避免干扰。
- 启用对账以验证状态一致性。

**Python 节点搭建**：

使用 `nautilus_trader.live.LiveNode`。若需在节点构建前注册适配器客户端工厂，调用 `LiveNode.builder(...)`。

```python
from nautilus_trader.common import Environment
from nautilus_trader.config import LiveExecutionEngineConfig
from nautilus_trader.config import LiveRiskEngineConfig
from nautilus_trader.live import LiveNode
from nautilus_trader.model import TraderId
from nautilus_trader.testkit import ExecTesterConfig

node = (
    LiveNode.builder("TESTER-001", TraderId("TESTER-001"), Environment.SANDBOX)
    .with_risk_engine_config(LiveRiskEngineConfig(bypass=True))
    .with_exec_engine_config(LiveExecutionEngineConfig(reconciliation=True))
    .add_exec_client(None, adapter_exec_client_factory, exec_client_config)
    .build()
)

tester_config = ExecTesterConfig(
    instrument_id=instrument_id,
    client_id=client_id,
    order_qty=order_qty,
)
node.add_builtin_strategy("ExecTester", tester_config)
# Register remaining components, then start or run
```

**Rust 节点搭建**（参考：`crates/adapters/{adapter}/examples/node_exec_tester.rs`）：

```rust
use nautilus_testkit::testers::{ExecTester, ExecTesterConfig};
use nautilus_trading::strategy::StrategyConfig;

let tester_config = ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(order_qty)
    .build()?;
let tester = ExecTester::new(tester_config);
node.add_strategy(tester)?;
node.run().await?;
```

## 时间戳量纲 {#timestamp-scale}

Nautilus 以 Unix 纳秒（`UnixNanos`）存储 `ts_event` 和 `ts_init`。所有执行消息都必须使用该量纲：订单事件、
成交、账户状态和对账报告（`OrderStatusReport`、`FillReport`、`PositionStatusReport`、`ExecutionMassStatus`）。

- 小于 `10^16` 的值不可能是合法的 Unix 纳秒时间戳（`10^16` ns 约为 1970-01-01 之后 116 天），通常说明适配器
  没有把交易场所的量纲转换过来。
- 转换正确的秒级交易场所时间以 `000000000` 结尾，仍然算通过：那是精度粗，不是量纲错误。
- 实时流的 `ts_event` 应接近会话的挂钟时间。对账报告可以更久远，只要量纲是纳秒就仍然有效。
- `ts_init` 是 Nautilus 创建对象时的本地时钟。交易场所时钟超前时，`ts_event` 略大于 `ts_init` 是可能的。

收到的行情或订单事件时间戳未通过量纲检查时，`ExecTester` 会发出警告。报告的时间戳要检查报告本身。任何执行
消息上出现量纲警告，或残留的秒、毫秒、微秒，一律按失败处理。

## 基本冒烟测试 {#basic-smoke-test}

一个随时可跑的快速健全性检查，例如改动适配器之后或开发迭代之间。测试器启动时用市场单开仓，挂出一买一卖
两个 post-only 限价单，等待 30 秒后停止（撤销未决订单并平仓）。

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.001"),
    open_position_on_start_qty=Decimal("0.001"),
    enable_limit_buys=True,
    enable_limit_sells=True,
    use_post_only=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.001"))
    .open_position_on_start_qty(dec!(0.001))
    .enable_limit_buys(true)
    .enable_limit_sells(true)
    .use_post_only(true)
    .build()?
```

**预期行为**：

1. 启动时：市场单成交，建立持仓。
2. 在距最优买卖价 `tob_offset_ticks`（默认 500 个 tick）处挂出两个限价单。
3. 策略空闲 30 秒。检查日志有无错误、被拒订单或断连。
4. 停止时：撤销未决限价单，用市场单平仓。

**通过标准**：日志无错误，持仓干净地开平，限价单得到交易场所确认。

---

下面每组先给汇总表格，随后是详细测试卡片。
测试 ID 采用间隔编号，便于插入新用例而无需重排。

---

## 第 1 组：市场单 {#group-1-market-orders}

测试市场单的提交与成交。市场单应立即执行。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ----------------------------- | --------------------------------------------------- | ------------------ |
| TC-E01 | Market BUY - 提交并成交 | 用市场买单开多头持仓。 | 不支持市场单 |
| TC-E02 | Market SELL - 提交并成交 | 用市场卖单开空头持仓。 | 不支持市场单 |
| TC-E03 | 带 IOC TIF 的市场单 | 显式使用 IOC 有效期的市场单。 | 不支持 IOC |
| TC-E04 | 带 FOK TIF 的市场单 | 显式使用 FOK 有效期的市场单。 | 不支持 FOK |
| TC-E05 | 带报价币数量的市场单 | 使用报价币数量的市场单。 | 不支持报价币数量 |
| TC-E06 | 用市场单平仓 | 停止时用市场单平掉持仓。 | 不支持市场单 |

### TC-E01：Market BUY - 提交并成交 {#tc-e01-market-buy---submit-and-fill}

| 字段 | 值 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，行情正在流入，无未了结持仓。 |
| **操作** | ExecTester 通过 `open_position_on_start_qty` 开多头持仓。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。 |
| **通过标准** | 持仓建立，side=LONG，数量与配置一致，成交价在市场范围内，`AccountState` 已更新。 |
| **跳过条件** | 适配器不支持市场单。 |

**注意事项**：

- 部分适配器把市场单模拟为激进的限价 IOC 单（见适配器指南）。
- 无论交易场所机制如何，策略视角看到的事件序列应当一致。
- 成交价应在最近的买卖价差之内。
- 部分成交是合法的。核对累计成交数量与订单数量一致。

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .build()?
```

### TC-E02：Market SELL - 提交并成交 {#tc-e02-market-sell---submit-and-fill}

| 字段 | 值 |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，行情正在流入，无未了结持仓。 |
| **操作** | ExecTester 通过负的 `open_position_on_start_qty` 开空头持仓。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。 |
| **通过标准** | 持仓建立，side=SHORT，数量与配置一致，成交价在市场范围内。 |
| **跳过条件** | 适配器不支持市场单或做空。 |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("-0.01"),
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(-1, 2))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .build()?
```

### TC-E03：带 IOC TIF 的市场单 {#tc-e03-market-order-with-ioc-tif}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载，行情正在流入。                  |
| **操作**         | 用 `open_position_time_in_force=IOC` 开仓。                       |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。 |
| **通过标准**  | 与 TC-E01 相同。订单上显式设置了 IOC TIF。                 |
| **跳过条件**      | 不支持 IOC。                                                             |

**注意事项**：

- 部分适配器把市场单模拟为激进的限价 IOC 单。未成交的模拟市场单对应
  `OrderCanceled`，而不是 `OrderRejected`。

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
    open_position_time_in_force=TimeInForce.IOC,
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .open_position_time_in_force(TimeInForce::Ioc)
    .build()?
```

### TC-E04：带 FOK TIF 的市场单 {#tc-e04-market-order-with-fok-tif}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载，行情正在流入。                  |
| **操作**         | 用 `open_position_time_in_force=FOK` 开仓。                       |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。 |
| **通过标准**  | 与 TC-E01 相同。订单上显式设置了 FOK TIF。                 |
| **跳过条件**      | 不支持 FOK。                                                             |

**注意事项**：

- FOK 要求全部数量立即可成交，否则订单被取消。
- 使用较小的测试数量，确保盘口深度足以全部成交。

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
    open_position_time_in_force=TimeInForce.FOK,
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .open_position_time_in_force(TimeInForce::Fok)
    .build()?
```

### TC-E05：带报价币数量的市场单 {#tc-e05-market-order-with-quote-quantity}

| 字段 | 值                                                                            |
| ------------------ | -------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载，适配器支持报价币数量。           |
| **操作**         | 用 `use_quote_quantity=True` 开仓，数量以报价币计。        |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。      |
| **通过标准**  | 订单以报价币数量提交。成交数量以基础币计。 |
| **跳过条件**      | 适配器不支持报价币数量订单。                                  |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("100.0"),  # Quote currency amount
    open_position_on_start_qty=Decimal("100.0"),
    use_quote_quantity=True,
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("100"))
    .open_position_on_start_qty(Decimal::from(100))
    .use_quote_quantity(true)
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .build()?
```

### TC-E06：停止时用市场单平仓 {#tc-e06-close-position-via-market-order-on-stop}

| 字段 | 值                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------- |
| **前置条件**   | 来自 TC-E01 或 TC-E02 的持仓。                                                        |
| **操作**         | 停止策略。ExecTester 用市场单平仓。                             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`（平仓单）。 |
| **通过标准**  | 持仓已平，或仅残留精确的亚精度余量。无未决订单。   |
| **跳过条件**      | 适配器不支持市场单。                                                     |

**注意事项**：

- 该测试自然衔接在 TC-E01 或 TC-E02 之后，属同一会话。
- `close_positions_on_stop=True` 是默认值。
- 平仓单的方向应与持仓相反。
- 交易场所接受的数量小数位少于金融工具定义时，设置 `close_positions_qty_precision`。
  测试器只平掉该精度下可成交的数量，并记录任何精确的残留量。

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
    close_positions_on_stop=True,
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .close_positions_on_stop(true)
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .build()?
```

---

## 第 2 组：限价单 {#group-2-limit-orders}

测试限价单的提交、确认，以及在各有效期选项下的行为。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ------------------------- | ------------------------------------------------ | --------- |
| TC-E10 | Limit BUY GTC | 在 TOB 下方挂 GTC 限价买单，验证被确认。 | 从不 |
| TC-E11 | Limit SELL GTC | 在 TOB 上方挂 GTC 限价卖单，验证被确认。 | 从不 |
| TC-E12 | Limit BUY 与 SELL 成对 | 双边同时挂单，验证两单均被确认。 | 从不 |
| TC-E13 | Limit IOC 激进成交 | 以激进价格挂限价 IOC，预期成交。 | 不支持 IOC |
| TC-E14 | Limit IOC 被动不成交 | 远离市场挂限价 IOC，预期被取消。 | 不支持 IOC |
| TC-E15 | Limit FOK 成交 | 以激进价格挂限价 FOK，预期成交。 | 不支持 FOK |
| TC-E16 | Limit FOK 不成交 | 远离市场挂限价 FOK，预期被取消。 | 不支持 FOK |
| TC-E17 | Limit GTD | 挂带过期时间的限价单，验证被确认。 | 不支持 GTD |
| TC-E18 | Limit GTD 到期 | 验证到期时的文档化终态事件。 | 不支持 GTD |
| TC-E19 | Limit DAY | 挂 DAY TIF 限价单，验证被确认。 | 不支持 DAY |

### TC-E10：Limit BUY GTC - 提交并确认 {#tc-e10-limit-buy-gtc---submit-and-accept}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                       |
| **操作**         | ExecTester 在 `best_bid - tob_offset_ticks` 处挂限价买单。             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                  |
| **通过标准**  | 订单在交易场所挂着，价格、数量、side=BUY、TIF=GTC 均正确。 |
| **跳过条件**      | 从不。                                                                      |

**注意事项**：

- `tob_offset_ticks`（默认 500）使订单远离市场，避免意外成交。
- 验证订单以 `OrderStatus.ACCEPTED` 出现在 cache 中。
- 订单应一直挂着，直到被显式取消。

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .build()?
```

### TC-E11：Limit SELL GTC - 提交并确认 {#tc-e11-limit-sell-gtc---submit-and-accept}

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                        |
| **操作**         | ExecTester 在 `best_ask + tob_offset_ticks` 处挂限价卖单。             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                   |
| **通过标准**  | 订单在交易场所挂着，价格、数量、side=SELL、TIF=GTC 均正确。 |
| **跳过条件**      | 从不。                                                                       |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(true)
    .build()?
```

### TC-E12：Limit BUY 与 SELL 成对 {#tc-e12-limit-buy-and-sell-pair}

| 字段 | 值                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                                      |
| **操作**         | ExecTester 同时挂出限价买单与限价卖单。                                         |
| **事件序列** | 两条独立序列：各自 `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。 |
| **通过标准**  | 两单均在交易场所挂着，买单低于买价，卖单高于卖价。                                  |
| **跳过条件**      | 从不。                                                                                     |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(true)
    .build()?
```

### TC-E13：Limit IOC 激进成交 {#tc-e13-limit-ioc-aggressive-fill}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                       |
| **操作**         | 以不低于最优卖价的价格（激进价格）提交限价 IOC 买单。         |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。 |
| **通过标准**  | 订单立即成交。建立持仓。                                   |
| **跳过条件**      | 适配器不支持 IOC TIF。                                           |

**注意事项**：

- 该测试需要手工创建订单或适配器特有的配置，因为 ExecTester 默认的限价单挂单使用 GTC TIF。
- 交易场所会取消未立即成交的 IOC 订单。

### TC-E14：Limit IOC 被动 - 不成交 {#tc-e14-limit-ioc-passive---no-fill}

| 字段 | 值                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                         |
| **操作**         | 远低于市场提交限价 IOC 买单（被动价格）。                 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderCanceled`。 |
| **通过标准**  | 订单被交易场所立即取消且无成交。                          |
| **跳过条件**      | 适配器不支持 IOC TIF。                                             |

**注意事项**：

- 交易场所应取消未成交的 IOC 订单。验证 `OrderCanceled`（而非 `OrderExpired` 或
  `OrderRejected`）。

### TC-E15：Limit FOK 成交 {#tc-e15-limit-fok-fill}

| 字段 | 值                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载，报价正在流入，盘口深度充足。       |
| **操作**         | 以激进价格提交限价 FOK 买单，数量在最优档深度之内。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。        |
| **通过标准**  | 订单在单个成交事件中全部成交。                                     |
| **跳过条件**      | 适配器不支持 FOK TIF。                                                  |

**注意事项**：

- FOK 要求全部数量可成交。使用较小数量以确保盘口深度充足。

### TC-E16：Limit FOK 不成交 {#tc-e16-limit-fok-no-fill}

| 字段 | 值                                                                         |
| ------------------ | ----------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                         |
| **操作**         | 以被动价格（远低于市场）提交限价 FOK 买单。                  |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderCanceled`。 |
| **通过标准**  | 订单被交易场所立即取消且无成交。                          |
| **跳过条件**      | 适配器不支持 FOK TIF。                                             |

### TC-E17：Limit GTD - 提交并确认 {#tc-e17-limit-gtd---submit-and-accept}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                       |
| **操作**         | 挂限价买单并设置 `order_expire_time_delta_mins`（如 60 分钟）。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                  |
| **通过标准**  | 订单被确认，TIF 为 GTD 且过期时间戳正确。                   |
| **跳过条件**      | 适配器不支持 GTD TIF。                                           |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    order_expire_time_delta_mins=60,
    enable_limit_buys=True,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .order_expire_time_delta_mins(60)
    .build()?
```

### TC-E18：Limit GTD 到期 {#tc-e18-limit-gtd-expiry}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | 用交易场所支持的最短过期时间，保留 TC-E17 的 GTD 限价单。 |
| **操作**         | 等待 GTD 到期时间过去。                                     |
| **事件序列** | 默认 `OrderExpired`，或适配器文档化的终态事件。 |
| **通过标准**  | 订单在交易场所过期时达到适配器文档化的终态。       |
| **跳过条件**      | 适配器不支持 GTD TIF。                                           |

**注意事项**：

- 使用交易场所接受的最短过期时间。不要假设一两分钟就有效。
- 有些交易场所把 GTD 到期报告为取消。保留并验证文档化的适配器映射，
  而不是把所有交易场所都归一成 `OrderExpired`。

### TC-E19：Limit DAY - 提交并确认 {#tc-e19-limit-day---submit-and-accept}

| 字段 | 值                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载，市场处于交易时段。                  |
| **操作**         | 提交 DAY TIF 限价买单。                                                     |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                         |
| **通过标准**  | 订单以 DAY TIF 被确认。将在交易日结束时自动取消。 |
| **跳过条件**      | 适配器不支持 DAY TIF。                                                  |

**注意事项**：

- 在 7×24 加密交易场所与传统市场上，DAY 订单的行为可能不同。
- 验证交易时段外提交时的行为（如适用）。

---

## 第 3 组：止损单与条件单 {#group-3-stop-and-conditional-orders}

测试止损与条件订单类型。这类订单在交易场所挂着，直到触发条件满足。支持交易场所原生条件单的适配器，
还应验证未决触发单会出现在重启对账中，而不只是出现在普通的未决订单端点里。

| TC     | Name                 | Description                                 | Skip when         |
| ------ | -------------------- | ------------------------------------------- | ----------------- |
| TC-E20 | StopMarket BUY       | Stop buy above ask, verify accepted.        | No `STOP_MARKET`. |
| TC-E21 | StopMarket SELL      | Stop sell below bid, verify accepted.       | No `STOP_MARKET`. |
| TC-E22 | StopLimit BUY        | Stop-limit buy with trigger + limit price.  | No `STOP_LIMIT`.  |
| TC-E23 | StopLimit SELL       | Stop-limit sell with trigger + limit price. | No `STOP_LIMIT`.  |
| TC-E24 | MarketIfTouched BUY  | MIT buy below bid.                          | No `MIT`.         |
| TC-E25 | MarketIfTouched SELL | MIT sell above ask.                         | No `MIT`.         |
| TC-E26 | LimitIfTouched BUY   | LIT buy with trigger + limit price.         | No `LIT`.         |
| TC-E27 | LimitIfTouched SELL  | LIT sell with trigger + limit price.        | No `LIT`.         |

### TC-E20: StopMarket BUY

| 字段 | 值                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                 |
| **操作**         | ExecTester places a stop-market buy above the current ask.            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.            |
| **通过标准**  | Stop order accepted on venue with correct trigger price and side=BUY. |
| **跳过条件**      | Adapter does not support `StopMarket` orders.                         |

**注意事项**：

- The trigger price should be above the current ask by `stop_offset_ticks`.
- The order should NOT trigger immediately (trigger price is above market).
- For venues with long-lived trigger signatures, check trigger-order signing expiry against the venue's
  trigger-order window, rather than normal order expiry.
- Verifying trigger and fill requires the market to move, which may not happen during the test.
- After acceptance, restart or force reconciliation. If the venue keeps trigger orders in a separate endpoint,
  check the open order reports. Make sure that the order still appears there.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=False,
    enable_stop_buys=True,
    enable_stop_sells=False,
    stop_order_type=OrderType.STOP_MARKET,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .enable_stop_buys(true)
    .enable_stop_sells(false)
    .stop_order_type(OrderType::StopMarket)
    .build()?
```

### TC-E21: StopMarket SELL

| 字段 | 值                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                  |
| **操作**         | ExecTester places a stop-market sell below the current bid.            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.             |
| **通过标准**  | Stop order accepted on venue with correct trigger price and side=SELL. |
| **跳过条件**      | Adapter does not support `StopMarket` orders.                          |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=False,
    enable_stop_buys=False,
    enable_stop_sells=True,
    stop_order_type=OrderType.STOP_MARKET,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .enable_stop_buys(false)
    .enable_stop_sells(true)
    .stop_order_type(OrderType::StopMarket)
    .build()?
```

### TC-E22: StopLimit BUY

| 字段 | 值                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                             |
| **操作**         | ExecTester places a stop-limit buy with trigger price above ask and limit offset. |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.                        |
| **通过标准**  | Stop-limit order accepted with correct trigger price, limit price, and side=BUY.  |
| **跳过条件**      | Adapter does not support `StopLimit` orders.                                      |

**注意事项**：

- Requires `stop_limit_offset_ticks` to be set for the limit price offset from the trigger price.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=False,
    enable_stop_buys=True,
    enable_stop_sells=False,
    stop_order_type=OrderType.STOP_LIMIT,
    stop_limit_offset_ticks=50,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .enable_stop_buys(true)
    .enable_stop_sells(false)
    .stop_order_type(OrderType::StopLimit)
    .stop_limit_offset_ticks(50)
    .build()?
```

### TC-E23: StopLimit SELL

| 字段 | 值                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                             |
| **操作**         | ExecTester places a stop-limit sell with trigger price below bid.                 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.                        |
| **通过标准**  | Stop-limit order accepted with correct trigger price, limit price, and side=SELL. |
| **跳过条件**      | Adapter does not support `StopLimit` orders.                                      |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=False,
    enable_stop_buys=False,
    enable_stop_sells=True,
    stop_order_type=OrderType.STOP_LIMIT,
    stop_limit_offset_ticks=50,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .enable_stop_buys(false)
    .enable_stop_sells(true)
    .stop_order_type(OrderType::StopLimit)
    .stop_limit_offset_ticks(50)
    .build()?
```

### TC-E24: MarketIfTouched BUY

| 字段 | 值                                                      |
| ------------------ | ---------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。      |
| **操作**         | Place MIT buy with trigger below current bid (buy on dip). |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`. |
| **通过标准**  | MIT order accepted on venue with correct trigger price.    |
| **跳过条件**      | Adapter does not support `MarketIfTouched` orders.         |

### TC-E25: MarketIfTouched SELL

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。          |
| **操作**         | Place MIT sell with trigger above current ask (sell on rally). |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.     |
| **通过标准**  | MIT order accepted on venue with correct trigger price.        |
| **跳过条件**      | Adapter does not support `MarketIfTouched` orders.             |

### TC-E26: LimitIfTouched BUY

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。          |
| **操作**         | Place LIT buy with trigger below bid and limit price offset.   |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.     |
| **通过标准**  | LIT order accepted with correct trigger price and limit price. |
| **跳过条件**      | Adapter does not support `LimitIfTouched` orders.              |

### TC-E27: LimitIfTouched SELL

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。          |
| **操作**         | Place LIT sell with trigger above ask and limit price offset.  |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.     |
| **通过标准**  | LIT order accepted with correct trigger price and limit price. |
| **跳过条件**      | Adapter does not support `LimitIfTouched` orders.              |

---

## Group 4: Order modification

Test order modification (amend) and cancel-replace workflows.

| TC     | Name                      | Description                                    | Skip when                |
| ------ | ------------------------- | ---------------------------------------------- | ------------------------ |
| TC-E30 | Modify limit BUY price    | Amend open limit buy to new price.             | No modify support.       |
| TC-E31 | Modify limit SELL price   | Amend open limit sell to new price.            | No modify support.       |
| TC-E32 | Cancel-replace limit BUY  | Cancel and resubmit limit buy at new price.    | Never.                   |
| TC-E33 | Cancel-replace limit SELL | Cancel and resubmit limit sell at new price.   | Never.                   |
| TC-E34 | Modify stop trigger price | Amend stop order trigger price.                | No modify or no stop.    |
| TC-E35 | Cancel-replace stop order | Cancel and resubmit stop at new trigger price. | No stop orders.          |
| TC-E36 | Modify rejected           | Modify on unsupported adapter.                 | Adapter supports modify. |

`trigger_limit_order_maintenance_once=True` requires exactly one of the limit-order modify or
cancel-replace modes and at least one enabled limit side. It is incompatible with bracket entries,
`test_modify_rejected`, and two-sided batch limit submission. Configuration validation rejects these
combinations.

### TC-E30: Modify limit BUY price

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件**   | Open GTC limit buy from TC-E10.                                              |
| **操作**         | ExecTester modifies the open limit buy to a new price.                       |
| **事件序列** | `OrderPendingUpdate` -> `OrderUpdated`.                                      |
| **通过标准**  | `OrderUpdated` event logged with the new price. Order exits `PendingUpdate`. |
| **跳过条件**      | Adapter does not support order modification.                                 |

**注意事项**：

- `trigger_limit_order_maintenance_once=True` amends to a different valid price directly from
  the first `OrderAccepted`, preferring one tick more passive. A quiet book is not inconclusive.
- After the one-shot workflow starts, it stops further limit maintenance for that side. Thus, the tester does
  not immediately amend the order back to the TOB target.
- Without that flag, the modify waits for the order price to drift from the target
  TOB offset. No movement and no `OrderUpdated` is inconclusive, not a failure.
- Verify the `OrderUpdated` log shows the expected price. If the event never
  arrives after a forced or drift-triggered amend, the order stays in `PendingUpdate`
  and the tester stops modifying it.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    modify_orders_to_maintain_tob_offset=True,
    trigger_limit_order_maintenance_once=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .modify_orders_to_maintain_tob_offset(true)
    .trigger_limit_order_maintenance_once(true)
    .build()?
```

### TC-E31: Modify limit SELL price

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件**   | Open GTC limit sell from TC-E11.                                             |
| **操作**         | ExecTester modifies the open limit sell to a new price.                      |
| **事件序列** | `OrderPendingUpdate` -> `OrderUpdated`.                                      |
| **通过标准**  | `OrderUpdated` event logged with the new price. Order exits `PendingUpdate`. |
| **跳过条件**      | Adapter does not support order modification.                                 |

**注意事项**：

- Same one-shot trigger and quiet-book guidance as TC-E30.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=True,
    modify_orders_to_maintain_tob_offset=True,
    trigger_limit_order_maintenance_once=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(true)
    .modify_orders_to_maintain_tob_offset(true)
    .trigger_limit_order_maintenance_once(true)
    .build()?
```

### TC-E32: Cancel-replace limit BUY

| 字段 | 值                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件**   | Open GTC limit buy.                                                                                   |
| **操作**         | ExecTester cancels and resubmits the limit buy at a new price.                                        |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled` -> `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`. |
| **通过标准**  | Original order canceled, new order accepted at updated price.                                         |
| **跳过条件**      | Never (cancel-replace is always available).                                                           |

**注意事项**：

- This is the universal alternative when the adapter does not support native modify.
- Two distinct orders in the cache: the canceled original and the new replacement.
- `trigger_limit_order_maintenance_once=True` requests one cancel directly from the first
  `OrderAccepted`, then submits the replacement only after `OrderCanceled`.
- Without the one-shot trigger, cancel-replace waits for TOB drift. No movement and no replacement
  is inconclusive, not a failure.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    cancel_replace_orders_to_maintain_tob_offset=True,
    trigger_limit_order_maintenance_once=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .cancel_replace_orders_to_maintain_tob_offset(true)
    .trigger_limit_order_maintenance_once(true)
    .build()?
```

### TC-E33: Cancel-replace limit SELL

| 字段 | 值                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件**   | Open GTC limit sell.                                                                                  |
| **操作**         | ExecTester cancels and resubmits the limit sell at a new price.                                       |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled` -> `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`. |
| **通过标准**  | Original order canceled, new order accepted at updated price.                                         |
| **跳过条件**      | Never.                                                                                                |

**注意事项**：

- Same one-shot trigger and quiet-book guidance as TC-E32.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=False,
    enable_limit_sells=True,
    cancel_replace_orders_to_maintain_tob_offset=True,
    trigger_limit_order_maintenance_once=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(false)
    .enable_limit_sells(true)
    .cancel_replace_orders_to_maintain_tob_offset(true)
    .trigger_limit_order_maintenance_once(true)
    .build()?
```

### TC-E34: Modify stop trigger price

| 字段 | 值                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **前置条件**   | Open stop order from TC-E20 or TC-E22.                                                                 |
| **操作**         | ExecTester modifies stop trigger price as market moves (`modify_stop_orders_to_maintain_offset=True`). |
| **事件序列** | `OrderPendingUpdate` -> `OrderUpdated`.                                                                |
| **通过标准**  | `OrderUpdated` event logged with the new trigger price. Order exits `PendingUpdate`.                   |
| **跳过条件**      | Adapter does not support native stop modify, or no stop order support.                                 |

**注意事项**：

- Some venues allow limit-order modify but reject trigger-order replace. For those adapters,
  skip TC-E34 and run TC-E35 instead.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_stop_buys=True,
    modify_stop_orders_to_maintain_offset=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_stop_buys(true)
    .modify_stop_orders_to_maintain_offset(true)
    .build()?
```

### TC-E35: Cancel-replace stop order

| 字段 | 值                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件**   | Open stop order.                                                                                      |
| **操作**         | ExecTester cancels and resubmits stop at new trigger price.                                           |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled` -> `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`. |
| **通过标准**  | Original stop canceled, new stop accepted at updated trigger price.                                   |
| **跳过条件**      | No stop order support.                                                                                |

**注意事项**：

- This is the required path for venues that do not support native trigger-order replace.
- After the new stop is accepted, restart or force reconciliation and verify exactly one
  current trigger order remains.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_stop_buys=True,
    cancel_replace_stop_orders_to_maintain_offset=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_stop_buys(true)
    .cancel_replace_stop_orders_to_maintain_offset(true)
    .build()?
```

### TC-E36: Modify rejected

| 字段 | 值                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **前置条件**   | Open limit order, adapter does NOT support modify.                                                   |
| **操作**         | Attempt to modify the order (programmatically, not via ExecTester auto-maintain).                    |
| **事件序列** | `OrderModifyRejected`.                                                                               |
| **通过标准**  | Modify attempt results in `OrderModifyRejected` event with reason. Original order remains unchanged. |
| **跳过条件**      | Adapter supports order modification.                                                                 |

**注意事项**：

- This tests the adapter's rejection path, not the ExecTester's cancel-replace logic.
- The rejection reason should indicate that modification is not supported.

---

## Group 5: Order cancellation

Test order cancellation workflows.

| TC     | Name                       | Description                                       | Skip when        |
| ------ | -------------------------- | ------------------------------------------------- | ---------------- |
| TC-E40 | Cancel single limit order  | Cancel an open limit order.                       | Never.           |
| TC-E41 | Cancel all on stop         | Strategy stop cancels all open orders (default).  | Never.           |
| TC-E42 | Individual cancels on stop | Cancel orders one-by-one on stop.                 | Never.           |
| TC-E43 | Batch cancel on stop       | Cancel orders via batch API on stop.              | No batch cancel. |
| TC-E44 | Cancel already-canceled    | Verify documented rejection or idempotent result. | Never.           |

### TC-E40: Cancel single limit order

| 字段 | 值                                                           |
| ------------------ | --------------------------------------------------------------- |
| **前置条件**   | Open GTC limit order from TC-E10 or TC-E11.                     |
| **操作**         | Stop the strategy. ExecTester cancels the open limit order.     |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled`.                        |
| **通过标准**  | Order status transitions to CANCELED. No open orders remaining. |
| **跳过条件**      | Never.                                                          |

**注意事项**：

- `cancel_orders_on_stop=True` (default) triggers cancellation when the strategy stops.
- Verify the `OrderCanceled` event contains the correct `venue_order_id`.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    cancel_orders_on_stop=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .cancel_orders_on_stop(true)
    .build()?
```

### TC-E41: Cancel all on stop

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件**   | Multiple open orders (limit buy + limit sell from TC-E12).     |
| **操作**         | Stop the strategy with `cancel_orders_on_stop=True` (default). |
| **事件序列** | For each order: `OrderPendingCancel` -> `OrderCanceled`.       |
| **通过标准**  | All open orders canceled. No open orders remaining.            |
| **跳过条件**      | Never.                                                         |

**注意事项**：

- Default stop uses `cancel_all`. Some venues implement that as account-wide. Confirm
  the adapter's `CancelAllOrders` scope before running beside other open orders.
  Use `use_individual_cancels_on_stop` or `use_batch_cancel_on_stop` to isolate.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=True,
    cancel_orders_on_stop=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(true)
    .cancel_orders_on_stop(true)
    .build()?
```

### TC-E42: Individual cancels on stop

| 字段 | 值                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **前置条件**   | Multiple open orders.                                               |
| **操作**         | Stop with `use_individual_cancels_on_stop=True`.                    |
| **事件序列** | Individual `OrderPendingCancel` -> `OrderCanceled` for each order.  |
| **通过标准**  | Each order canceled individually. All orders reach CANCELED status. |
| **跳过条件**      | Never.                                                              |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=True,
    use_individual_cancels_on_stop=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(true)
    .use_individual_cancels_on_stop(true)
    .build()?
```

### TC-E43: Batch cancel on stop

| 字段 | 值                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| **前置条件**   | Multiple open orders, adapter supports batch cancel.                     |
| **操作**         | Stop with `use_batch_cancel_on_stop=True`.                               |
| **事件序列** | Batch `OrderPendingCancel` -> `OrderCanceled` for all orders.            |
| **通过标准**  | All orders canceled via single batch request. All reach CANCELED status. |
| **跳过条件**      | Adapter does not support batch cancel.                                   |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=True,
    use_batch_cancel_on_stop=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(true)
    .use_batch_cancel_on_stop(true)
    .build()?
```

### TC-E44: Cancel already-canceled order

| 字段 | 值                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------- |
| **前置条件**   | A previously canceled order (from TC-E40).                                            |
| **操作**         | Attempt to cancel the same order again.                                               |
| **事件序列** | `OrderCancelRejected` by default, or no new event for a documented idempotent result. |
| **通过标准**  | Result matches the adapter contract without a duplicate terminal event.               |
| **跳过条件**      | Never.                                                                                |

**注意事项**：

- The default contract tests the adapter's error handling for invalid cancel requests. The
  rejection reason should indicate the order is not in a cancelable state.
- `Strategy.cancel_order` and the order manager drop cancels for locally closed orders, so
  `ExecTester` cannot reach the adapter after TC-E40. A second `cancel_order` that never
  leaves the process is inconclusive.
- A venue may treat an already-terminal cancel as idempotent. Document that disposition and use an
  adapter-focused test that submits `CancelOrder` with the venue order ID after the order is
  terminal.

---

## Group 6: Bracket orders

Test bracket order submission (entry + take-profit + stop-loss).

| TC     | Name                         | Description                                     | Skip when           |
| ------ | ---------------------------- | ----------------------------------------------- | ------------------- |
| TC-E50 | Bracket BUY                  | Entry limit buy + TP limit sell + SL stop sell. | No bracket support. |
| TC-E51 | Bracket SELL                 | Entry limit sell + TP limit buy + SL stop buy.  | No bracket support. |
| TC-E52 | Bracket entry fill activates | Verify TP/SL become active after entry fill.    | No bracket support. |
| TC-E53 | Bracket with post-only entry | Entry order uses post-only flag.                | No bracket or PO.   |

### TC-E50: Bracket BUY

| 字段 | 值                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                                                                                   |
| **操作**         | ExecTester submits a bracket order: limit buy entry + take-profit sell + stop-loss sell.                                                |
| **事件序列** | Entry: `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`. TP and SL: `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`. |
| **通过标准**  | Three orders created and accepted: entry below bid, TP above ask, SL below entry.                                                       |
| **跳过条件**      | Adapter does not support bracket orders.                                                                                                |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_brackets=True,
    bracket_entry_order_type=OrderType.LIMIT,
    bracket_offset_ticks=500,
    enable_limit_buys=True,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_brackets(true)
    .bracket_entry_order_type(OrderType::Limit)
    .bracket_offset_ticks(500)
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .build()?
```

### TC-E51: Bracket SELL

| 字段 | 值                                                           |
| ------------------ | --------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。           |
| **操作**         | ExecTester submits bracket: limit sell entry + TP buy + SL buy. |
| **事件序列** | Same pattern as TC-E50 but for sell side.                       |
| **通过标准**  | Three orders created and accepted on sell side.                 |
| **跳过条件**      | Adapter does not support bracket orders.                        |

### TC-E52: Bracket entry fill activates TP/SL

| 字段 | 值                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **前置条件**   | Bracket order from TC-E50 where entry order fills.                    |
| **操作**         | Entry order fills. Verify contingent TP and SL orders activate.       |
| **事件序列** | Entry: `OrderFilled`. TP and SL transition from contingent to active. |
| **通过标准**  | After entry fill, TP and SL orders are live on the venue.             |
| **跳过条件**      | Adapter does not support bracket orders.                              |

**注意事项**：

- This requires the entry order to actually fill, which may need aggressive pricing.
- The TP/SL activation mechanism varies by venue (some activate immediately, some are OCA groups).

### TC-E53: Bracket with post-only entry

| 字段 | 值                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **前置条件**   | Adapter supports brackets and post-only.                                |
| **操作**         | Submit bracket with `use_post_only=True` (applied to entry and TP).     |
| **事件序列** | Same as TC-E50 with post-only flag on entry.                            |
| **通过标准**  | Entry and TP orders accepted as post-only (maker). SL is not post-only. |
| **跳过条件**      | No bracket support or no post-only support.                             |

---

## Group 7: Order flags

Test order-level flags and special parameters.

| TC     | Name                | Description                                  | Skip when            |
| ------ | ------------------- | -------------------------------------------- | -------------------- |
| TC-E60 | PostOnly accepted   | Limit with post-only, placed away from TOB.  | No post-only.        |
| TC-E61 | ReduceOnly on close | Close position with reduce-only flag.        | No reduce-only.      |
| TC-E62 | Display quantity    | Iceberg order with visible quantity < total. | No display quantity. |
| TC-E63 | Custom order params | Adapter-specific params via `order_params`.  | N/A.                 |

### TC-E60: PostOnly accepted

| 字段 | 值                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                   |
| **操作**         | ExecTester places limit buy with `use_post_only=True` at passive price. |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.              |
| **通过标准**  | Order accepted as a maker order. Post-only flag acknowledged by venue.  |
| **跳过条件**      | Adapter does not support post-only flag.                                |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    use_post_only=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .use_post_only(true)
    .build()?
```

### TC-E61: ReduceOnly on close

| 字段 | 值                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **前置条件**   | Open position (from TC-E01).                                                                   |
| **操作**         | Stop strategy with `reduce_only_on_stop=True`. Closing order uses reduce-only flag.            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled` (with reduce-only). |
| **通过标准**  | Closing order has reduce-only flag. Position fully closed.                                     |
| **跳过条件**      | Adapter does not support reduce-only flag.                                                     |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
    reduce_only_on_stop=True,
    close_positions_on_stop=True,
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .reduce_only_on_stop(true)
    .close_positions_on_stop(true)
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .build()?
```

### TC-E62: Display quantity (iceberg)

| 字段 | 值                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, adapter supports display quantity.                           |
| **操作**         | Place limit order with `order_display_qty` < `order_qty`.                       |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.                      |
| **通过标准**  | Order accepted with display quantity set. Only display qty visible on the book. |
| **跳过条件**      | Adapter does not support display quantity / iceberg orders.                     |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("1.0"),
    order_display_qty=Quantity.from_str("0.1"),
    enable_limit_buys=True,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("1.0"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .order_display_qty(Quantity::from("0.1"))
    .build()?
```

### TC-E63: Custom order params

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, adapter accepts additional parameters.                    |
| **操作**         | Place order with `order_params` dict containing adapter-specific parameters. |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.                   |
| **通过标准**  | Order accepted. Adapter-specific parameters passed through to venue.         |
| **跳过条件**      | N/A (adapter-specific).                                                      |

**注意事项**：

- The `order_params` dict is opaque to the ExecTester and passed through to the adapter.
- Consult the adapter's guide for supported parameters.

---

## Group 8: Rejection handling

Test that the adapter correctly handles and reports order rejections.

| TC     | Name                   | Description                                      | Skip when       |
| ------ | ---------------------- | ------------------------------------------------ | --------------- |
| TC-E70 | PostOnly rejection     | Post-only order that would cross the spread.     | No post-only.   |
| TC-E71 | ReduceOnly rejection   | Reduce-only order with no position to reduce.    | No reduce-only. |
| TC-E72 | Unsupported order type | Submit order type not supported by adapter.      | Never.          |
| TC-E73 | Unsupported TIF        | Submit order with unsupported time in force.     | Never.          |
| TC-E74 | Ambiguous submit fail  | Transport, timeout, or send failure on submit.   | No mock path.   |
| TC-E75 | Ambiguous cancel fail  | Transport, timeout, or send failure on cancel.   | No cancel.      |
| TC-E76 | Ambiguous modify fail  | Transport, timeout, or send failure on modify.   | No modify.      |
| TC-E77 | Ambiguous batch fail   | Whole-batch failure without per-order result.    | No batch.       |
| TC-E78 | Per-order batch reject | Batch response has explicit per-order rejection. | No batch.       |

TC-E74 through TC-E78 are specified collectively below because they usually require a mock HTTP or
WebSocket boundary rather than a live venue.

### Ambiguous outcome failures

These cases prove that adapter request failures do not turn into terminal rejection events when the venue
outcome is unknown. The pass criteria also define an exception for local prepare failures. The command must be
known not to have been sent. The failure must be attributable to one cancel or modify command. If both
conditions hold, the adapter can emit the matching rejection event.

**通过标准**：

- Submit failures from transport errors, timeouts, WebSocket send failures, retry exhaustion, or
  response parse failures do not emit `OrderRejected`.
- Cancel failures from transport errors, timeouts, WebSocket send failures, retry exhaustion, or
  whole-request server failures do not emit `OrderCancelRejected`.
- Modify failures from transport errors, timeouts, WebSocket send failures, retry exhaustion, or
  whole-request server failures do not emit `OrderModifyRejected`.
- Local cancel prepare failures that prove the command cannot be sent may emit
  `OrderCancelRejected` when the adapter can attribute the failure to one cancel command.
- Local modify prepare failures that prove the command cannot be sent may emit
  `OrderModifyRejected` when the adapter can attribute the failure to one modify command.
- Whole-batch request failures do not emit one rejection per order when the venue did not return
  per-order results.
- Explicit per-order venue rejections still emit the matching rejection event with the venue
  reason.

The order remains in the appropriate in-flight state until a venue update, query result, or
reconciliation pass resolves it.

### TC-E70: PostOnly rejection

| 字段 | 值                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                                                                           |
| **操作**         | ExecTester places post-only order on the wrong side of the book (`test_reject_post_only=True`), causing it to cross the spread. |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderRejected`.                                                                      |
| **通过标准**  | Venue rejects order. `OrderRejected.due_post_only=true`. Reason names post-only violation.                                      |
| **跳过条件**      | Adapter does not support post-only flag.                                                                                        |

**注意事项**：

- The ExecTester's `test_reject_post_only` mode intentionally prices the order to cross.
- Some venues may partially fill instead of rejecting. Behavior is venue-specific.
- Adapters that emit `OrderRejected` for a post-only crossing reject should set
  `due_post_only=true` so strategies can distinguish this from other venue rejections.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    use_post_only=True,
    test_reject_post_only=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .enable_limit_buys(true)
    .enable_limit_sells(false)
    .use_post_only(true)
    .test_reject_post_only(true)
    .build()?
```

### TC-E71: ReduceOnly rejection

| 字段 | 值                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **前置条件**   | Adapter connected, no open position for the instrument.                                                                                                            |
| **操作**         | ExecTester opens a market position with `reduce_only=True` via `test_reject_reduce_only=True` and `open_position_on_start_qty`, when no position exists to reduce. |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderRejected`.                                                                                                         |
| **通过标准**  | Order rejected. `OrderRejected` event with reason indicating reduce-only violation.                                                                                |
| **跳过条件**      | Adapter does not support reduce-only flag.                                                                                                                         |

**注意事项**：

- The `test_reject_reduce_only` flag only applies to the opening market order submitted via
  `open_position_on_start_qty`.
- Verify no prior position exists for the instrument before running this test.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
    test_reject_reduce_only=True,
    enable_limit_buys=False,
    enable_limit_sells=False,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .test_reject_reduce_only(true)
    .enable_limit_buys(false)
    .enable_limit_sells(false)
    .build()?
```

### TC-E72: Unsupported order type

| 字段 | 值                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, order type not in adapter's supported set.        |
| **操作**         | Submit an order type the adapter does not support.                   |
| **事件序列** | `OrderDenied` (pre-submission rejection by adapter).                 |
| **通过标准**  | Order denied before reaching venue. `OrderDenied` event with reason. |
| **跳过条件**      | Never (every adapter has unsupported order types to test).           |

**注意事项**：

- `OrderDenied` occurs at the adapter level before the order reaches the venue.
- This differs from the normal `OrderRejected` path, which follows a venue rejection. Reconciliation can also
  synthesize `OrderRejected`. See [Terminal reconciliation
  provenance](./../concepts/execution/policies.md#terminal-reconciliation-provenance).
- Test by configuring a stop order type that the adapter does not support.

### TC-E73: Unsupported TIF

| 字段 | 值                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, TIF not in adapter's supported set.               |
| **操作**         | Submit an order with a TIF the adapter does not support.             |
| **事件序列** | `OrderDenied` (pre-submission rejection by adapter).                 |
| **通过标准**  | Order denied before reaching venue. `OrderDenied` event with reason. |
| **跳过条件**      | Never (every adapter has unsupported TIF options to test).           |

**注意事项**：

- Similar to TC-E72 but for time-in-force options.
- Test with TIF values from the Nautilus enum that the adapter does not map.

---

## Group 9: Lifecycle and reconciliation

Test strategy lifecycle behavior and execution-state recovery on start, stop, and report failure.

TC-E88 and TC-E89 run offline as deterministic adapter unit or integration tests rather than through
`ExecTester` against a venue.

| TC     | Name                              | Description                                              | Skip when                                   |
| ------ | --------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| TC-E80 | Open position on start            | Open a position immediately when strategy starts.        | No market orders.                           |
| TC-E81 | Cancel orders on stop             | Cancel all open orders when strategy stops.              | Never.                                      |
| TC-E82 | Close positions on stop           | Close open positions when strategy stops.                | No market orders.                           |
| TC-E83 | Unsubscribe on stop               | Unsubscribe from data feeds on strategy stop.            | No unsub support.                           |
| TC-E84 | Reconcile open orders             | Reconcile existing open orders from a prior session.     | Never.                                      |
| TC-E85 | Reconcile filled orders           | Reconcile previously filled orders from a prior session. | Never.                                      |
| TC-E86 | Reconcile open long               | Reconcile existing open long position.                   | Never.                                      |
| TC-E87 | Reconcile open short              | Reconcile existing open short position.                  | Never.                                      |
| TC-E88 | Reconciliation commission failure | A required fill commission cannot be represented.        | No fill commission logic.                   |
| TC-E89 | WebSocket commission failure      | A private fill commission cannot be represented.         | No private fill stream or commission logic. |

### TC-E80: Open position on start

| 字段 | 值                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, instrument loaded, no existing position.                                        |
| **操作**         | Strategy starts with `open_position_on_start_qty` set.                                             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`.                        |
| **通过标准**  | Position opened on start. Market order submitted and filled before limit order maintenance begins. |
| **跳过条件**      | Adapter does not support market orders.                                                            |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    open_position_on_start_qty=Decimal("0.01"),
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .open_position_on_start_qty(Decimal::new(1, 2))
    .build()?
```

### TC-E81: Cancel orders on stop

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件**   | Open limit orders from the strategy session.                   |
| **操作**         | Stop the strategy with `cancel_orders_on_stop=True` (default). |
| **事件序列** | For each open order: `OrderPendingCancel` -> `OrderCanceled`.  |
| **通过标准**  | All strategy-owned open orders canceled on stop.               |
| **跳过条件**      | Never.                                                         |

### TC-E82: Close positions on stop

| 字段 | 值                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **前置条件**   | Open position from the strategy session.                                                   |
| **操作**         | Stop the strategy with `close_positions_on_stop=True` (default).                           |
| **事件序列** | Closing order: `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`. |
| **通过标准**  | Positions closed, or only exact sub-precision residuals remain. No open orders remain.     |
| **跳过条件**      | Adapter does not support market orders.                                                    |

### TC-E83: Unsubscribe on stop

| 字段 | 值                                                            |
| ------------------ | ---------------------------------------------------------------- |
| **前置条件**   | Active data subscriptions (quotes, trades, book).                |
| **操作**         | Stop the strategy with `can_unsubscribe=True` (default).         |
| **事件序列** | Data subscriptions removed.                                      |
| **通过标准**  | No further data events received after stop. Clean disconnection. |
| **跳过条件**      | Adapter does not support unsubscribe.                            |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,
    order_qty=Quantity.from_str("0.01"),
    can_unsubscribe=True,
)
```

**Rust 配置**：

```rust
ExecTesterConfig::builder()
    .base(StrategyConfig {
        strategy_id: Some(strategy_id),
        ..Default::default()
    })
    .instrument_id(instrument_id)
    .client_id(client_id)
    .order_qty(Quantity::from("0.01"))
    .can_unsubscribe(true)
    .build()?
```

### TC-E84: Reconcile open orders

| 字段 | 值                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | One or more open limit orders on the venue from a prior session.                                                                |
| **操作**         | Start the node with `reconciliation=True`.                                                                                      |
| **事件序列** | `OrderStatusReport` generated for each open order.                                                                              |
| **通过标准**  | Each open order is loaded into the cache with correct `venue_order_id`, status=ACCEPTED, price, quantity, side, and order type. |
| **跳过条件**      | Never.                                                                                                                          |

**注意事项**：

- Leave limit orders open from a prior test session (do not cancel on stop).
- Configure `external_order_instrument_ids` so strategy registration creates the active claim used
  to assign reconciled orders.
- Verify that the reconciled order count matches the venue-reported count.
- Mass-status may include historical terminal orders. Unclaimed ones appear as EXTERNAL.
  Compare open-order counts against the venue open-order endpoint, not the full mass-status
  length.
- Report `ts_event` values must be Unix nanoseconds even when the venue only has second precision.

### TC-E85: Reconcile filled orders

| 字段 | 值                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | One or more filled orders on the venue from a prior session.                                                                        |
| **操作**         | Start the node with `reconciliation=True`.                                                                                          |
| **事件序列** | `FillReport` generated for each historical fill.                                                                                    |
| **通过标准**  | Each filled order is loaded into the cache with correct `venue_order_id`, status=FILLED, fill price, fill quantity, and commission. |
| **跳过条件**      | Never.                                                                                                                              |

**注意事项**：

- Requires orders that filled in a prior session.
- Verify fill price, quantity, and commission match the venue's reported values.
- Some adapters may only report fills within a lookback window.
- Historical fill replay can change a live zero commission to the REST fee. That flip is
  expected when the stream omits fees and reconciliation supplies them.
- Report `ts_event` values must be Unix nanoseconds even when the venue only has second precision.

### TC-E86: Reconcile open long position

| 字段 | 值                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **前置条件**   | An open long position on the venue from a prior session.                                                     |
| **操作**         | Start the node with `reconciliation=True`.                                                                   |
| **事件序列** | `PositionStatusReport` generated for the long position.                                                      |
| **通过标准**  | Position loaded into cache with correct instrument, side=LONG, quantity, and entry price matching the venue. |
| **跳过条件**      | Never.                                                                                                       |

**注意事项**：

- Open a long position in a prior session and stop the strategy without closing it
  (`close_positions_on_stop=False`).
- Verify the reconciled position quantity and average entry price match the venue.
- After reconciliation, the strategy should be able to manage or close this position.

### TC-E87: Reconcile open short position

| 字段 | 值                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | An open short position on the venue from a prior session.                                                     |
| **操作**         | Start the node with `reconciliation=True`.                                                                    |
| **事件序列** | `PositionStatusReport` generated for the short position.                                                      |
| **通过标准**  | Position loaded into cache with correct instrument, side=SHORT, quantity, and entry price matching the venue. |
| **跳过条件**      | Never.                                                                                                        |

**注意事项**：

- Open a short position in a prior session and stop the strategy without closing it
  (`close_positions_on_stop=False`).
- Verify the reconciled position quantity and average entry price match the venue.
- After reconciliation, the strategy should be able to manage or close this position.

### TC-E88: Reconciliation commission failure

| 字段 | 值                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | A deterministic fixture produces an out-of-range commission for an owned, confirmed fill.                       |
| **操作**         | Exercise direct fill, mass-status, targeted report, and inferred-fill commission paths with the fixture.        |
| **事件序列** | Report requests return an error. Engine reconciliation logs a hook error and emits no fallback inferred fill.   |
| **通过标准**  | The error is observable. Startup fails or inferred work defers. A later valid response reconciles exactly once. |
| **跳过条件**      | The adapter does not calculate commission for fill reports.                                                     |

**注意事项**：

- Assert that no zero or generic commission replaces the failed venue calculation.
- Exercise the inferred-fill hook as well as direct `FillReport` construction.
- Skip the inferred-fill portion when the adapter does not override the shared commission hook.
- Assert that hook quantity, price, and liquidity inputs match the emitted inferred fill. Include the
  back-solved price of an incremental residual after a prior fill.
- Valid explicit fills may apply, but the residual quantity and dependent terminal transition stay
  pending.
- A position-only synthetic correction without trade evidence is not a commission calculation
  failure.

### TC-E89: WebSocket commission failure

| 字段 | 值                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | A private fill fixture produces an out-of-range commission and has a stable venue trade ID.                          |
| **操作**         | Deliver the invalid trade, replace its commission with a valid value, then redeliver the same trade ID.              |
| **事件序列** | The first delivery emits no fill and changes no fill, terminal, or deduplication state. The replay emits one fill.   |
| **通过标准**  | No panic or fallback occurs. The valid replay applies exactly once. REST reconciliation can recover a missed replay. |
| **跳过条件**      | The adapter has no private fill stream or does not calculate commission for private fills.                           |

**注意事项**：

- For a venue trade that fills several owned orders, make one report fail. Assert that the first delivery
  emits none of those reports. This prevents a replay from duplicating reports built before the failure.
- Assert that the adapter consumes the deduplication key only after all reports construct and route
  successfully.
- Assert that a failed trade does not confirm or terminalize its order.

---

## Group 10: Options trading

Test options-specific execution behavior. Options instruments typically have different constraints from linear
derivatives: venues may restrict order types, support alternative pricing modes, or disallow conditional
orders. Exact restrictions vary by venue. Consult the adapter guide.

These tests require a `CryptoOption` instrument. Use an OTM option with
reasonable liquidity for fills.

| TC      | Name                          | Description                                                           | Skip when           |
| ------- | ----------------------------- | --------------------------------------------------------------------- | ------------------- |
| TC-E90  | Limit BUY option              | Place a limit buy on an option instrument.                            | No options support. |
| TC-E91  | Limit SELL option             | Place a limit sell on an option instrument.                           | No options support. |
| TC-E92  | Limit with alt pricing        | Place a limit order with adapter-specific pricing via `order_params`. | No alt pricing.     |
| TC-E94  | Unsupported order type denied | Submit an order type the adapter rejects for options.                 | No options support. |
| TC-E96  | Conditional order rejected    | Submit a stop/conditional order on an option. Expect rejection.       | No options support. |
| TC-E99  | FOK limit option              | Place a FOK limit order on an option instrument.                      | No FOK options.     |
| TC-E100 | Cancel option order           | Cancel an open limit order on an option instrument.                   | No options support. |
| TC-E101 | Reconcile option position     | Reconcile an open option position from a prior session.               | No options support. |

### TC-E90: Limit BUY option

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, option instrument loaded, quotes flowing.                |
| **操作**         | ExecTester places a limit buy on the option at a passive price.             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.                  |
| **通过标准**  | Order accepted by venue with correct instrument, side, price, and quantity. |
| **跳过条件**      | Adapter does not support options trading.                                   |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,  # CryptoOption instrument
    order_qty=Quantity.from_str("1"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    tob_offset_ticks=500,
)
```

### TC-E91: Limit SELL option

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, option instrument loaded, quotes flowing.                |
| **操作**         | ExecTester places a limit sell on the option at a passive price.            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.                  |
| **通过标准**  | Order accepted by venue with correct instrument, side, price, and quantity. |
| **跳过条件**      | Adapter does not support options trading.                                   |

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,  # CryptoOption instrument
    order_qty=Quantity.from_str("1"),
    enable_limit_buys=False,
    enable_limit_sells=True,
    tob_offset_ticks=500,
)
```

### TC-E92: Limit with alternative pricing

| 字段 | 值                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, option instrument loaded.                        |
| **操作**         | Place limit order with adapter-specific pricing via `order_params`. |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`.          |
| **通过标准**  | Order accepted. Venue acknowledges the alternative pricing mode.    |
| **跳过条件**      | Adapter does not support alternative pricing modes for options.     |

**注意事项**：

- The `price` field on the order object may be a placeholder when alternative pricing
  is active. Consult the adapter guide for supported parameter keys.
- Example: OKX supports `px_usd` (USD price) and `px_vol` (implied volatility).
- Verify in venue responses that the pricing mode is reflected correctly.

**Python 配置**：

```python
ExecTesterConfig(
    instrument_id=instrument_id,  # CryptoOption instrument
    order_qty=Quantity.from_str("1"),
    enable_limit_buys=True,
    enable_limit_sells=False,
    order_params={"px_usd": "100.5"},  # Adapter-specific pricing key
)
```

### TC-E94: Unsupported order type denied for options

| 字段 | 值                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, option instrument loaded.                                                                |
| **操作**         | Submit an order type the venue does not support for options (e.g. market order).                            |
| **事件序列** | Adapter-dependent: `OrderDenied` (pre-submission) or `OrderSubmitted` -> `OrderRejected` (post-submission). |
| **通过标准**  | Order does not fill. Denial or rejection reason references the unsupported order type.                      |
| **跳过条件**      | Adapter does not support options.                                                                           |

**注意事项**：

- The exact rejection point varies by adapter. Some adapters deny locally before submitting. Others submit and
  relay the venue rejection.
- ExecTester can trigger a market order via `open_position_on_start_qty` on an
  option instrument. Some unsupported types (e.g. `MarketToLimit`) require
  manual or programmatic submission.
- Test each unsupported type the adapter documents.

### TC-E96: Conditional order rejected for options

| 字段 | 值                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, option instrument loaded.                                                                |
| **操作**         | Submit a conditional order on an option instrument.                                                         |
| **事件序列** | Adapter-dependent: `OrderDenied` (pre-submission) or `OrderSubmitted` -> `OrderRejected` (post-submission). |
| **通过标准**  | Order does not fill. Reason references unsupported conditional order type.                                  |
| **跳过条件**      | Adapter does not support options, or adapter supports conditionals for options.                             |

**注意事项**：

- Test each conditional type the adapter documents as unsupported for options
  (e.g. `STOP_MARKET`, `STOP_LIMIT`, `MARKET_IF_TOUCHED`, `LIMIT_IF_TOUCHED`,
  `TRAILING_STOP_MARKET`).
- ExecTester can trigger conditional orders via `enable_stop_buys`/`enable_stop_sells`
  with `stop_order_type` on an option instrument.

### TC-E99: FOK limit option

| 字段 | 值                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **前置条件**   | Adapter connected, option instrument loaded, sufficient book depth.                            |
| **操作**         | Place a limit order with `TimeInForce::Fok` on an option instrument.                           |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled` or `OrderCanceled`. |
| **通过标准**  | Order fills completely or is canceled. No partial fills.                                       |
| **跳过条件**      | Adapter does not support FOK for options.                                                      |

**注意事项**：

- Some venues use a dedicated order type for options FOK orders (e.g. OKX uses
  `op_fok`). The adapter handles this mapping transparently.
- Use small quantities and aggressive pricing to get a fill for the positive case.

### TC-E100: Cancel option order

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件**   | Open limit order from TC-E90 or TC-E91.                        |
| **操作**         | Cancel the open limit order.                                   |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled`.                       |
| **通过标准**  | Order canceled. No longer appears in open orders on the venue. |
| **跳过条件**      | Adapter does not support options.                              |

### TC-E101: Reconcile option position

| 字段 | 值                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| **前置条件**   | Open option position from a prior session.                                           |
| **操作**         | Start the node with `reconciliation=True`.                                           |
| **事件序列** | `PositionStatusReport` generated for the option position.                            |
| **通过标准**  | Position loaded into cache with correct instrument, side, quantity, and entry price. |
| **跳过条件**      | Adapter does not support options.                                                    |

**注意事项**：

- Open an option position in a prior session and stop without closing
  (`close_positions_on_stop=False`).
- Verify the reconciled position matches the venue-reported state.

---

## ExecTester configuration reference

Quick reference for each Python `ExecTesterConfig` parameter. Defaults are resolved values after construction.
The Rust builder uses equivalent defaults.

| Parameter                                       | Type                  | Default                | Affects groups |
| ----------------------------------------------- | --------------------- | ---------------------- | -------------- |
| `strategy_id`                                   | `StrategyId?`         | `None`                 | All            |
| `order_id_tag`                                  | `str?`                | `None`                 | All            |
| `use_hyphens_in_client_order_ids`               | `bool`                | `True`                 | All            |
| `use_uuid_client_order_ids`                     | `bool`                | `False`                | All            |
| `external_order_instrument_ids`                 | `list[InstrumentId]?` | `None`                 | 9              |
| `instrument_id`                                 | `InstrumentId`        | `BTCUSDT-PERP.BINANCE` | All            |
| `client_id`                                     | `ClientId?`           | `None`                 | All            |
| `order_qty`                                     | `Quantity`            | `0.001`                | All            |
| `order_display_qty`                             | `Quantity?`           | `None`                 | 2, 7           |
| `order_expire_time_delta_mins`                  | `PositiveInt?`        | `None`                 | 2              |
| `order_params`                                  | `dict?`               | `None`                 | 7, 10          |
| `subscribe_book`                                | `bool`                | `False`                |                |
| `subscribe_quotes`                              | `bool`                | `True`                 |                |
| `subscribe_trades`                              | `bool`                | `True`                 |                |
| `book_type`                                     | `BookType`            | `L2_MBP`               |                |
| `book_depth`                                    | `PositiveInt?`        | `None`                 |                |
| `book_interval_ms`                              | `PositiveInt`         | `1000`                 |                |
| `book_levels_to_print`                          | `PositiveInt`         | `10`                   |                |
| `open_position_on_start_qty`                    | `Decimal?`            | `None`                 | 1, 9           |
| `open_position_on_first_quote`                  | `bool`                | `False`                | 1              |
| `open_position_time_in_force`                   | `TimeInForce`         | `GTC`                  | 1              |
| `enable_limit_buys`                             | `bool`                | `True`                 | 2, 4, 5, 6     |
| `enable_limit_sells`                            | `bool`                | `True`                 | 2, 4, 5, 6     |
| `enable_stop_buys`                              | `bool`                | `False`                | 3, 4           |
| `enable_stop_sells`                             | `bool`                | `False`                | 3, 4           |
| `tob_offset_ticks`                              | `PositiveInt`         | `500`                  | 2, 4           |
| `limit_time_in_force`                           | `TimeInForce?`        | `None`                 | 2, 6           |
| `stop_order_type`                               | `OrderType`           | `STOP_MARKET`          | 3              |
| `stop_offset_ticks`                             | `PositiveInt`         | `100`                  | 3              |
| `stop_limit_offset_ticks`                       | `PositiveInt?`        | `None`                 | 3              |
| `stop_trigger_type`                             | `TriggerType`         | `DEFAULT`              | 3              |
| `stop_time_in_force`                            | `TimeInForce?`        | `None`                 | 3              |
| `trailing_offset`                               | `Decimal?`            | `None`                 | 3              |
| `trailing_offset_type`                          | `TrailingOffsetType`  | `BASIS_POINTS`         | 3              |
| `enable_brackets`                               | `bool`                | `False`                | 6              |
| `batch_submit_limit_pair`                       | `bool`                | `False`                | 2, 5           |
| `bracket_entry_order_type`                      | `OrderType`           | `LIMIT`                | 6              |
| `bracket_offset_ticks`                          | `PositiveInt`         | `500`                  | 6              |
| `modify_orders_to_maintain_tob_offset`          | `bool`                | `False`                | 4              |
| `modify_stop_orders_to_maintain_offset`         | `bool`                | `False`                | 4              |
| `cancel_replace_orders_to_maintain_tob_offset`  | `bool`                | `False`                | 4              |
| `cancel_replace_stop_orders_to_maintain_offset` | `bool`                | `False`                | 4              |
| `trigger_limit_order_maintenance_once`          | `bool`                | `False`                | 4              |
| `use_post_only`                                 | `bool`                | `False`                | 2, 6, 7, 8     |
| `limit_aggressive`                              | `bool`                | `False`                | 2              |
| `use_quote_quantity`                            | `bool`                | `False`                | 1, 7           |
| `emulation_trigger`                             | `TriggerType?`        | `None`                 | 2, 3           |
| `use_individual_cancels_on_stop`                | `bool`                | `False`                | 5              |
| `cancel_orders_on_stop`                         | `bool`                | `True`                 | 5, 9           |
| `close_positions_on_stop`                       | `bool`                | `True`                 | 9              |
| `close_positions_qty_precision`                 | `int?`                | `None`                 | 9              |
| `close_positions_time_in_force`                 | `TimeInForce?`        | `None`                 | 9              |
| `reduce_only_on_stop`                           | `bool`                | `True`                 | 7, 9           |
| `use_batch_cancel_on_stop`                      | `bool`                | `False`                | 5              |
| `dry_run`                                       | `bool`                | `False`                |                |
| `log_data`                                      | `bool`                | `True`                 |                |
| `test_reject_post_only`                         | `bool`                | `False`                | 8              |
| `test_reject_reduce_only`                       | `bool`                | `False`                | 8              |
| `test_modify_rejected`                          | `bool`                | `False`                | 4              |
| `can_unsubscribe`                               | `bool`                | `True`                 | 9              |
| `clamp_to_instrument_price_range`               | `bool`                | `False`                | 1-8, 10        |
| `log_events`                                    | `bool`                | `True`                 | All            |
| `log_commands`                                  | `bool`                | `True`                 | All            |
