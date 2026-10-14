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

| TC | 名称 | 描述 | 跳过条件 |
| ------ | -------------------- | ------------------------------------------- | ----------------- |
| TC-E20 | StopMarket BUY | 在卖价上方挂止损买单，验证被确认。 | 不支持 `STOP_MARKET` |
| TC-E21 | StopMarket SELL | 在买价下方挂止损卖单，验证被确认。 | 不支持 `STOP_MARKET` |
| TC-E22 | StopLimit BUY | 带触发价 + 限价的止损限价买单。 | 不支持 `STOP_LIMIT` |
| TC-E23 | StopLimit SELL | 带触发价 + 限价的止损限价卖单。 | 不支持 `STOP_LIMIT` |
| TC-E24 | MarketIfTouched BUY | 在买价下方的 MIT 买单。 | 不支持 `MIT` |
| TC-E25 | MarketIfTouched SELL | 在卖价上方的 MIT 卖单。 | 不支持 `MIT` |
| TC-E26 | LimitIfTouched BUY | 带触发价 + 限价的 LIT 买单。 | 不支持 `LIT` |
| TC-E27 | LimitIfTouched SELL | 带触发价 + 限价的 LIT 卖单。 | 不支持 `LIT` |

### TC-E20：StopMarket BUY {#tc-e20-stopmarket-buy}

| 字段 | 值                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                 |
| **操作**         | ExecTester 在当前卖价上方挂止损市价买单。            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。            |
| **通过标准**  | 止损单在交易场所被确认，触发价正确且 side=BUY。 |
| **跳过条件**      | 适配器不支持 `StopMarket` 订单。                         |

**注意事项**：

- 触发价应高于当前卖价 `stop_offset_ticks`。
- 订单不应立即触发（触发价高于市场）。
- 对触发单签名长效的交易场所，触发单的签名过期要对照交易场所的触发单窗口检查，
  而不是普通订单的过期时间。
- 验证触发与成交需要市场移动，测试期间未必会发生。
- 确认后重启或强制对账。若交易场所把触发单放在独立端点，检查未决订单报告，
  确保该订单仍然出现。

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

### TC-E21：StopMarket SELL {#tc-e21-stopmarket-sell}

| 字段 | 值                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                  |
| **操作**         | ExecTester 在当前买价下方挂止损市价卖单。                    |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。             |
| **通过标准**  | 止损单在交易场所被确认，触发价正确且 side=SELL。 |
| **跳过条件**      | 适配器不支持 `StopMarket` 订单。                          |

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

### TC-E22：StopLimit BUY {#tc-e22-stoplimit-buy}

| 字段 | 值                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                             |
| **操作**         | ExecTester 挂止损限价买单，触发价高于卖价并带限价偏移。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                        |
| **通过标准**  | 止损限价单被确认，触发价、限价均正确且 side=BUY。  |
| **跳过条件**      | 适配器不支持 `StopLimit` 订单。                                      |

**注意事项**：

- 需要设置 `stop_limit_offset_ticks`，用于限价相对触发价的偏移。

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

### TC-E23：StopLimit SELL {#tc-e23-stoplimit-sell}

| 字段 | 值                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                             |
| **操作**         | ExecTester 挂止损限价卖单，触发价低于买价。                 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                        |
| **通过标准**  | 止损限价单被确认，触发价、限价均正确且 side=SELL。 |
| **跳过条件**      | 适配器不支持 `StopLimit` 订单。                                      |

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

### TC-E24：MarketIfTouched BUY {#tc-e24-marketiftouched-buy}

| 字段 | 值                                                      |
| ------------------ | ---------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。      |
| **操作**         | 挂 MIT 买单，触发价低于当前买价（逢低买入）。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。 |
| **通过标准**  | MIT 单在交易场所被确认，触发价正确。    |
| **跳过条件**      | 适配器不支持 `MarketIfTouched` 订单。         |

### TC-E25：MarketIfTouched SELL {#tc-e25-marketiftouched-sell}

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。          |
| **操作**         | 挂 MIT 卖单，触发价高于当前卖价（逢高卖出）。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。     |
| **通过标准**  | MIT 单在交易场所被确认，触发价正确。        |
| **跳过条件**      | 适配器不支持 `MarketIfTouched` 订单。             |

### TC-E26：LimitIfTouched BUY {#tc-e26-limitiftouched-buy}

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。          |
| **操作**         | 挂 LIT 买单，触发价低于买价并带限价偏移。   |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。     |
| **通过标准**  | LIT 单被确认，触发价与限价均正确。 |
| **跳过条件**      | 适配器不支持 `LimitIfTouched` 订单。              |

### TC-E27：LimitIfTouched SELL {#tc-e27-limitiftouched-sell}

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。          |
| **操作**         | 挂 LIT 卖单，触发价高于卖价并带限价偏移。  |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。     |
| **通过标准**  | LIT 单被确认，触发价与限价均正确。 |
| **跳过条件**      | 适配器不支持 `LimitIfTouched` 订单。              |

---

## 第 4 组：订单修改 {#group-4-order-modification}

测试订单修改（amend）与撤单重提（cancel-replace）工作流。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ------------------------- | ---------------------------------------------- | ------------------------ |
| TC-E30 | 修改限价 BUY 价格 | 把未决限价买单改到新价格。 | 不支持 modify。 |
| TC-E31 | 修改限价 SELL 价格 | 把未决限价卖单改到新价格。 | 不支持 modify。 |
| TC-E32 | 撤单重提限价 BUY | 撤销并以新价格重新提交限价买单。 | 从不 |
| TC-E33 | 撤单重提限价 SELL | 撤销并以新价格重新提交限价卖单。 | 从不 |
| TC-E34 | 修改止损触发价 | 修改止损单的触发价。 | 不支持 modify 或不支持止损单。 |
| TC-E35 | 撤单重提止损单 | 撤销并以新触发价重新提交止损单。 | 不支持止损单。 |
| TC-E36 | 修改被拒绝 | 在不支持的适配器上执行 modify。 | 适配器支持 modify。 |

`trigger_limit_order_maintenance_once=True` 要求恰好选择限价单 modify 或撤单重提模式之一，
且至少启用一侧限价。它与括号单入场、`test_modify_rejected` 和双边批量限价提交不兼容。
配置校验会拒绝这些组合。

### TC-E30：修改限价 BUY 价格 {#tc-e30-modify-limit-buy-price}

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件**   | 来自 TC-E10 的未决 GTC 限价买单。                                              |
| **操作**         | ExecTester 把未决限价买单修改到新价格。                       |
| **事件序列** | `OrderPendingUpdate` -> `OrderUpdated`。                                      |
| **通过标准**  | `OrderUpdated` 事件记录新价格。订单退出 `PendingUpdate`。 |
| **跳过条件**      | 适配器不支持订单修改。                                 |

**注意事项**：

- `trigger_limit_order_maintenance_once=True` 在收到第一个 `OrderAccepted` 后直接改到一个
  不同的有效价格，倾向更被动一个 tick。盘口安静不算无定论。
- 一次性工作流启动后，该侧不再继续限价维护。因此测试器不会立即把订单改回 TOB 目标。
- 没有该标志时，modify 等待订单价格偏离目标 TOB 偏移。市场不动、没有
  `OrderUpdated` 属于无定论，不是失败。
- 验证 `OrderUpdated` 日志显示预期价格。强制或漂移触发的 amend 之后事件仍未到达时，
  订单停留在 `PendingUpdate`，测试器停止对其修改。

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

### TC-E31：修改限价 SELL 价格 {#tc-e31-modify-limit-sell-price}

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件**   | 来自 TC-E11 的未决 GTC 限价卖单。                                             |
| **操作**         | ExecTester 把未决限价卖单修改到新价格。                      |
| **事件序列** | `OrderPendingUpdate` -> `OrderUpdated`。                                      |
| **通过标准**  | `OrderUpdated` 事件记录新价格。订单退出 `PendingUpdate`。 |
| **跳过条件**      | 适配器不支持订单修改。                                 |

**注意事项**：

- 一次性触发与盘口安静的判定指引同 TC-E30。

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

### TC-E32：撤单重提限价 BUY {#tc-e32-cancel-replace-limit-buy}

| 字段 | 值                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件**   | 未决 GTC 限价买单。                                                                                   |
| **操作**         | ExecTester 撤销限价买单并以新价格重新提交。                                        |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled` -> `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。 |
| **通过标准**  | 原订单被取消，新订单以更新后的价格被确认。                                         |
| **跳过条件**      | 从不（撤单重提始终可用）。                                                           |

**注意事项**：

- 适配器不支持原生 modify 时，这是通用的替代方案。
- cache 中有两个不同订单：被取消的原单与新的替身单。
- `trigger_limit_order_maintenance_once=True` 在收到第一个 `OrderAccepted` 后直接请求一次
  撤单，且只在 `OrderCanceled` 之后提交替身单。
- 没有一次性触发时，撤单重提等待 TOB 漂移。市场不动、没有替身单属于无定论，
  不是失败。

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

### TC-E33：撤单重提限价 SELL {#tc-e33-cancel-replace-limit-sell}

| 字段 | 值                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件**   | 未决 GTC 限价卖单。                                                                                  |
| **操作**         | ExecTester 撤销限价卖单并以新价格重新提交。                                       |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled` -> `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。 |
| **通过标准**  | 原订单被取消，新订单以更新后的价格被确认。                                         |
| **跳过条件**      | 从不。                                                                                                |

**注意事项**：

- 一次性触发与盘口安静的判定指引同 TC-E32。

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

### TC-E34：修改止损触发价 {#tc-e34-modify-stop-trigger-price}

| 字段 | 值                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **前置条件**   | 来自 TC-E20 或 TC-E22 的未决止损单。                                                                 |
| **操作**         | 市场移动时 ExecTester 修改止损触发价（`modify_stop_orders_to_maintain_offset=True`）。 |
| **事件序列** | `OrderPendingUpdate` -> `OrderUpdated`。                                                                |
| **通过标准**  | `OrderUpdated` 事件记录新触发价。订单退出 `PendingUpdate`。                   |
| **跳过条件**      | 适配器不支持原生止损 modify，或不支持止损单。                                 |

**注意事项**：

- 有些交易场所允许限价单 modify 但拒绝触发单 replace。这类适配器跳过
  TC-E34，改跑 TC-E35。

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

### TC-E35：撤单重提止损单 {#tc-e35-cancel-replace-stop-order}

| 字段 | 值                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **前置条件**   | 未决止损单。                                                                                      |
| **操作**         | ExecTester 撤销止损单并以新触发价重新提交。                                           |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled` -> `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。 |
| **通过标准**  | 原止损单被取消，新止损单以更新后的触发价被确认。                                   |
| **跳过条件**      | 不支持止损单。                                                                                |

**注意事项**：

- 对不支持原生触发单 replace 的交易场所，这是必需的路径。
- 新止损单确认后，重启或强制对账，验证恰好只剩一个当前触发单。

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

### TC-E36：修改被拒绝 {#tc-e36-modify-rejected}

| 字段 | 值                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| **前置条件**   | 未决限价单，且适配器明确不支持 modify。                                                   |
| **操作**         | 尝试修改该订单（以编程方式，不通过 ExecTester 的自动维护）。                    |
| **事件序列** | `OrderModifyRejected`。                                                                               |
| **通过标准**  | 修改尝试产生带原因的 `OrderModifyRejected` 事件。原订单保持不变。 |
| **跳过条件**      | 适配器支持订单修改。                                                                 |

**注意事项**：

- 该测试验证适配器的拒绝路径，不是 ExecTester 的撤单重提逻辑。
- 拒绝原因应表明不支持修改。

---

## 第 5 组：订单取消 {#group-5-order-cancellation}

测试订单取消工作流。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | -------------------------- | ------------------------------------------------- | ---------------- |
| TC-E40 | 取消单个限价单 | 取消一个未决限价单。 | 从不 |
| TC-E41 | 停止时全部取消 | 策略停止时取消所有未决订单（默认）。 | 从不 |
| TC-E42 | 停止时逐个取消 | 停止时逐一取消订单。 | 从不 |
| TC-E43 | 停止时批量取消 | 停止时通过批量 API 取消订单。 | 不支持批量取消 |
| TC-E44 | 取消已取消订单 | 验证文档化的拒绝或幂等结果。 | 从不 |

### TC-E40：取消单个限价单 {#tc-e40-cancel-single-limit-order}

| 字段 | 值                                                           |
| ------------------ | --------------------------------------------------------------- |
| **前置条件**   | 来自 TC-E10 或 TC-E11 的未决 GTC 限价单。                     |
| **操作**         | 停止策略。ExecTester 取消未决限价单。     |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled`。                        |
| **通过标准**  | 订单状态转为 CANCELED。无剩余未决订单。 |
| **跳过条件**      | 从不。                                                          |

**注意事项**：

- `cancel_orders_on_stop=True`（默认）在策略停止时触发取消。
- 验证 `OrderCanceled` 事件包含正确的 `venue_order_id`。

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

### TC-E41：停止时全部取消 {#tc-e41-cancel-all-on-stop}

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件**   | 多个未决订单（来自 TC-E12 的限价买 + 限价卖）。     |
| **操作**         | 以 `cancel_orders_on_stop=True`（默认）停止策略。 |
| **事件序列** | 每个订单各自：`OrderPendingCancel` -> `OrderCanceled`。       |
| **通过标准**  | 所有未决订单被取消。无剩余未决订单。            |
| **跳过条件**      | 从不。                                                         |

**注意事项**：

- 默认的停止路径使用 `cancel_all`。有些交易场所将其实现为全账户范围。在其他
  未决订单旁运行前，先确认适配器的 `CancelAllOrders` 作用域。
  用 `use_individual_cancels_on_stop` 或 `use_batch_cancel_on_stop` 隔离影响。

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

### TC-E42：停止时逐个取消 {#tc-e42-individual-cancels-on-stop}

| 字段 | 值                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **前置条件**   | 多个未决订单。                                               |
| **操作**         | 以 `use_individual_cancels_on_stop=True` 停止。                    |
| **事件序列** | 每个订单各自一次 `OrderPendingCancel` -> `OrderCanceled`。  |
| **通过标准**  | 每个订单被逐个取消。所有订单到达 CANCELED 状态。 |
| **跳过条件**      | 从不。                                                              |

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

### TC-E43：停止时批量取消 {#tc-e43-batch-cancel-on-stop}

| 字段 | 值                                                                    |
| ------------------ | ------------------------------------------------------------------------ |
| **前置条件**   | 多个未决订单，适配器支持批量取消。                     |
| **操作**         | 以 `use_batch_cancel_on_stop=True` 停止。                               |
| **事件序列** | 所有订单批量 `OrderPendingCancel` -> `OrderCanceled`。            |
| **通过标准**  | 所有订单经单个批量请求取消。全部到达 CANCELED 状态。 |
| **跳过条件**      | 适配器不支持批量取消。                                   |

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

### TC-E44：取消已取消订单 {#tc-e44-cancel-already-canceled-order}

| 字段 | 值                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------- |
| **前置条件**   | 一个先前已取消的订单（来自 TC-E40）。                                            |
| **操作**         | 再次尝试取消同一订单。                                               |
| **事件序列** | 默认 `OrderCancelRejected`；若为文档化的幂等结果，则无新事件。 |
| **通过标准**  | 结果符合适配器契约，且不产生重复的终态事件。               |
| **跳过条件**      | 从不。                                                                                |

**注意事项**：

- 默认契约测试适配器对无效取消请求的错误处理。拒绝原因应表明订单不处于可取消状态。
- `Strategy.cancel_order` 和订单管理器会丢弃本地已关闭订单的取消，因此 `ExecTester`
  在 TC-E40 之后无法触达适配器。第二次 `cancel_order` 若从未离开进程，属于无定论。
- 交易场所可能把对已终态订单的取消视为幂等。记录该处置方式，并用适配器专项测试：
  在订单已终态后以交易场所订单 ID 提交 `CancelOrder`。

---

## 第 6 组：括号单 {#group-6-bracket-orders}

测试括号单提交（入场 + 止盈 + 止损）。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ---------------------------- | ----------------------------------------------- | ------------------- |
| TC-E50 | Bracket BUY | 入场限价买 + 止盈限价卖 + 止损卖。 | 不支持括号单 |
| TC-E51 | Bracket SELL | 入场限价卖 + 止盈限价买 + 止损买。 | 不支持括号单 |
| TC-E52 | 括号单入场成交激活 | 验证入场成交后止盈/止损被激活。 | 不支持括号单 |
| TC-E53 | 带 post-only 入场的括号单 | 入场订单使用 post-only 标志。 | 不支持括号单或 PO |

### TC-E50：Bracket BUY {#tc-e50-bracket-buy}

| 字段 | 值                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                                                                                   |
| **操作**         | ExecTester 提交括号单：限价买入场 + 止盈卖出 + 止损卖出。                                                |
| **事件序列** | 入场：`OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。止盈与止损：`OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。 |
| **通过标准**  | 创建并确认三个订单：入场低于买价，止盈高于卖价，止损低于入场价。                                                       |
| **跳过条件**      | 适配器不支持括号单。                                                                                                |

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

### TC-E51：Bracket SELL {#tc-e51-bracket-sell}

| 字段 | 值                                                           |
| ------------------ | --------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。           |
| **操作**         | ExecTester 提交括号单：限价卖入场 + 止盈买 + 止损买。 |
| **事件序列** | 与 TC-E50 相同模式，方向为卖出。                       |
| **通过标准**  | 卖出侧创建并确认三个订单。                 |
| **跳过条件**      | 适配器不支持括号单。                        |

### TC-E52：括号单入场成交激活止盈/止损 {#tc-e52-bracket-entry-fill-activates-tpsl}

| 字段 | 值                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **前置条件**   | 来自 TC-E50 的括号单，且入场订单成交。                    |
| **操作**         | 入场订单成交。验证或有止盈与止损订单被激活。       |
| **事件序列** | 入场：`OrderFilled`。止盈与止损从或有状态转为激活。 |
| **通过标准**  | 入场成交后，止盈与止损订单在交易场所生效。             |
| **跳过条件**      | 适配器不支持括号单。                              |

**注意事项**：

- 这需要入场订单真正成交，可能要激进定价。
- 止盈/止损激活机制因交易场所而异（有的立即激活，有的是 OCA 组）。

### TC-E53：带 post-only 入场的括号单 {#tc-e53-bracket-with-post-only-entry}

| 字段 | 值                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **前置条件**   | 适配器支持括号单与 post-only。                                |
| **操作**         | 以 `use_post_only=True` 提交括号单（作用于入场与止盈）。     |
| **事件序列** | 与 TC-E50 相同，入场带 post-only 标志。                            |
| **通过标准**  | 入场与止盈订单以 post-only（maker）被确认。止损单不是 post-only。 |
| **跳过条件**      | 不支持括号单或不支持 post-only。                             |

---

## 第 7 组：订单标志 {#group-7-order-flags}

测试订单级标志与特殊参数。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ------------------- | -------------------------------------------- | -------------------- |
| TC-E60 | PostOnly 被确认 | 带 post-only 的限价单，挂远离 TOB。 | 不支持 post-only |
| TC-E61 | 平仓时 ReduceOnly | 用 reduce-only 标志平仓。 | 不支持 reduce-only |
| TC-E62 | 显示数量 | 显示数量小于总量的冰山单。 | 不支持显示数量 |
| TC-E63 | 自定义订单参数 | 通过 `order_params` 传适配器特有参数。 | 不适用 |

### TC-E60：PostOnly 被确认 {#tc-e60-postonly-accepted}

| 字段 | 值                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                   |
| **操作**         | ExecTester 以被动价格挂 `use_post_only=True` 的限价买单。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。              |
| **通过标准**  | 订单作为 maker 单被确认。交易场所确认了 post-only 标志。  |
| **跳过条件**      | 适配器不支持 post-only 标志。                                |

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

### TC-E61：平仓时 ReduceOnly {#tc-e61-reduceonly-on-close}

| 字段 | 值                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **前置条件**   | 有持仓（来自 TC-E01）。                                                                   |
| **操作**         | 以 `reduce_only_on_stop=True` 停止策略。平仓订单使用 reduce-only 标志。            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`（带 reduce-only）。 |
| **通过标准**  | 平仓订单带 reduce-only 标志。持仓完全平掉。                                     |
| **跳过条件**      | 适配器不支持 reduce-only 标志。                                                     |

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

### TC-E62：显示数量（冰山单） {#tc-e62-display-quantity-iceberg}

| 字段 | 值                                                                           |
| ------------------ | ------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，支持显示数量。                           |
| **操作**         | 挂 `order_display_qty` < `order_qty` 的限价单。                       |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                      |
| **通过标准**  | 订单带显示数量被确认。盘面上只见显示数量。 |
| **跳过条件**      | 适配器不支持显示数量 / 冰山订单。                     |

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

### TC-E63：自定义订单参数 {#tc-e63-custom-order-params}

| 字段 | 值                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，且接受额外参数。                    |
| **操作**         | 挂单时带上包含适配器特有参数的 `order_params` 字典。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                   |
| **通过标准**  | 订单被确认。适配器特有参数透传给交易场所。         |
| **跳过条件**      | 不适用（适配器特有）。                                                      |

**注意事项**：

- `order_params` 字典对 ExecTester 不透明，直接透传给适配器。
- 支持的参数参见对应适配器指南。

---

## 第 8 组：拒绝处理 {#group-8-rejection-handling}

测试适配器正确处理并上报订单拒绝。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | ---------------------- | ------------------------------------------------ | --------------- |
| TC-E70 | PostOnly 拒绝 | 会穿越价差的 post-only 订单。 | 不支持 post-only |
| TC-E71 | ReduceOnly 拒绝 | 无可减仓仓的 reduce-only 订单。 | 不支持 reduce-only |
| TC-E72 | 不支持的订单类型 | 提交适配器不支持的订单类型。 | 从不 |
| TC-E73 | 不支持的 TIF | 提交带不支持有效期的订单。 | 从不 |
| TC-E74 | 提交结果不明失败 | 提交时传输、超时或发送失败。 | 无 mock 路径 |
| TC-E75 | 取消结果不明失败 | 取消时传输、超时或发送失败。 | 不支持取消 |
| TC-E76 | 修改结果不明失败 | 修改时传输、超时或发送失败。 | 不支持 modify |
| TC-E77 | 整批结果不明失败 | 整批失败且无逐单结果。 | 不支持批量 |
| TC-E78 | 逐单批量拒绝 | 批量响应带显式的逐单拒绝。 | 不支持批量 |

TC-E74 到 TC-E78 在下方合并说明，因为它们通常需要 mock 的 HTTP 或
WebSocket 边界，而不是实时交易场所。

### 结果不明的失败 {#ambiguous-outcome-failures}

这些用例证明：交易场所结果未知时，适配器的请求失败不会变成终态拒绝事件。通过标准同时定义了本地准备失败的
例外：必须能确定命令未被发送，且失败可归因于某一条取消或修改命令。两个条件都成立时，适配器可以发出匹配的
拒绝事件。

**通过标准**：

- 提交因传输错误、超时、WebSocket 发送失败、重试耗尽或响应解析失败而不发出
  `OrderRejected`。
- 取消因传输错误、超时、WebSocket 发送失败、重试耗尽或整请求服务失败而不发出
  `OrderCancelRejected`。
- 修改因传输错误、超时、WebSocket 发送失败、重试耗尽或整请求服务失败而不发出
  `OrderModifyRejected`。
- 能证明命令无法发送的本地取消准备失败，在适配器可把失败归因于单条取消命令时，
  可以发出 `OrderCancelRejected`。
- 能证明命令无法发送的本地修改准备失败，在适配器可把失败归因于单条修改命令时，
  可以发出 `OrderModifyRejected`。
- 整批请求失败且交易场所未返回逐单结果时，不逐单发出拒绝。
- 显式的逐单交易场所拒绝仍带着交易场所原因发出对应的拒绝事件。

在交易场所更新、查询结果或对账确认解决之前，订单保持在合适的在途状态。

### TC-E70：PostOnly 拒绝 {#tc-e70-postonly-rejection}

| 字段 | 值                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件** | 适配器已连接，金融工具已加载，报价正在流入。                                                                           |
| **操作**         | ExecTester 把 post-only 订单挂到盘口错误的一侧（`test_reject_post_only=True`），使其穿越价差。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderRejected`。                                                                      |
| **通过标准**  | 交易场所拒绝订单。`OrderRejected.due_post_only=true`。原因指明 post-only 违规。                                      |
| **跳过条件**      | 适配器不支持 post-only 标志。                                                                                        |

**注意事项**：

- ExecTester 的 `test_reject_post_only` 模式故意把订单定价到穿越盘口。
- 有些交易场所可能部分成交而非拒绝。行为因交易场所而异。
- 对 post-only 穿越拒绝而发出 `OrderRejected` 的适配器应设置
  `due_post_only=true`，让策略能把这与其他交易场所拒绝区分开。

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

### TC-E71：ReduceOnly 拒绝 {#tc-e71-reduceonly-rejection}

| 字段 | 值                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **前置条件**   | 适配器已连接，该金融工具无未了结持仓。                                                                                                            |
| **操作**         | 无仓可减时，ExecTester 通过 `test_reject_reduce_only=True` 与 `open_position_on_start_qty` 以 `reduce_only=True` 提交开仓市场单。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderRejected`。                                                                                                         |
| **通过标准**  | 订单被拒绝。`OrderRejected` 事件的原因指明 reduce-only 违规。                                                                                |
| **跳过条件**      | 适配器不支持 reduce-only 标志。                                                                                                                         |

**注意事项**：

- `test_reject_reduce_only` 标志只作用于经 `open_position_on_start_qty` 提交的开仓市场单。
- 运行本测试前确认该金融工具没有既存持仓。

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

### TC-E72：不支持的订单类型 {#tc-e72-unsupported-order-type}

| 字段 | 值                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，订单类型不在适配器支持集合内。        |
| **操作**         | 提交适配器不支持的订单类型。                   |
| **事件序列** | `OrderDenied`（提交前被适配器拒绝）。                 |
| **通过标准**  | 订单在到达交易场所前被拒绝。`OrderDenied` 事件带原因。 |
| **跳过条件**      | 从不（每个适配器都有可测试的不支持订单类型）。           |

**注意事项**：

- `OrderDenied` 发生在适配器层面，订单尚未到达交易场所。
- 这与正常的 `OrderRejected` 路径不同，后者跟随一次交易场所拒绝。对账也可能合成
  `OrderRejected`。见[终态对账来源](./../concepts/execution/policies.md#terminal-reconciliation-provenance)。
- 用一个适配器不支持的止损订单类型来配置测试。

### TC-E73：不支持的 TIF {#tc-e73-unsupported-tif}

| 字段 | 值                                                                |
| ------------------ | -------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，TIF 不在适配器支持集合内。               |
| **操作**         | 提交带适配器不支持 TIF 的订单。             |
| **事件序列** | `OrderDenied`（提交前被适配器拒绝）。                 |
| **通过标准**  | 订单在到达交易场所前被拒绝。`OrderDenied` 事件带原因。 |
| **跳过条件**      | 从不（每个适配器都有可测试的不支持 TIF 选项）。           |

**注意事项**：

- 与 TC-E72 类似，针对有效期选项。
- 用 Nautilus 枚举中适配器不映射的 TIF 值测试。

---

## 第 9 组：生命周期与对账 {#group-9-lifecycle-and-reconciliation}

测试策略生命周期行为，以及启动、停止和报告失败时的执行状态恢复。

TC-E88 和 TC-E89 以确定性适配器单元或集成测试离线运行，而不是经
`ExecTester` 对着交易场所跑。

| TC | 名称 | 描述 | 跳过条件 |
| ------ | --------------------------------- | -------------------------------------------------------- | ------------------------------------------- |
| TC-E80 | 启动时开仓 | 策略启动时立即开仓。 | 不支持市场单 |
| TC-E81 | 停止时取消订单 | 策略停止时取消所有未决订单。 | 从不 |
| TC-E82 | 停止时平仓 | 策略停止时平掉持仓。 | 不支持市场单 |
| TC-E83 | 停止时退订 | 策略停止时退订数据源。 | 不支持退订 |
| TC-E84 | 对账未决订单 | 对账先前会话遗留的未决订单。 | 从不 |
| TC-E85 | 对账已成交订单 | 对账先前会话中已成交的订单。 | 从不 |
| TC-E86 | 对账多头持仓 | 对账既有多头持仓。 | 从不 |
| TC-E87 | 对账空头持仓 | 对账既有空头持仓。 | 从不 |
| TC-E88 | 对账手续费失败 | 必需的成交手续费无法表示。 | 无成交手续费逻辑 |
| TC-E89 | WebSocket 手续费失败 | 私有成交手续费无法表示。 | 无私有成交流或手续费逻辑 |

### TC-E80：启动时开仓 {#tc-e80-open-position-on-start}

| 字段 | 值                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，金融工具已加载，无既存持仓。                                        |
| **操作**         | 策略设置 `open_position_on_start_qty` 后启动。                                             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。                        |
| **通过标准**  | 启动时建仓。市场单在限价维护开始前已提交并成交。 |
| **跳过条件**      | 适配器不支持市场单。                                                            |

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

### TC-E81：停止时取消订单 {#tc-e81-cancel-orders-on-stop}

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件**   | 策略会话中有未决限价单。                   |
| **操作**         | 以 `cancel_orders_on_stop=True`（默认）停止策略。 |
| **事件序列** | 每个未决订单各自：`OrderPendingCancel` -> `OrderCanceled`。  |
| **通过标准**  | 停止时策略拥有的所有未决订单被取消。               |
| **跳过条件**      | 从不。                                                         |

### TC-E82：停止时平仓 {#tc-e82-close-positions-on-stop}

| 字段 | 值                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| **前置条件**   | 策略会话中有持仓。                                                   |
| **操作**         | 以 `close_positions_on_stop=True`（默认）停止策略。                           |
| **事件序列** | 平仓单：`OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled`。 |
| **通过标准**  | 持仓已平，或仅残留精确的亚精度余量。无未决订单。     |
| **跳过条件**      | 适配器不支持市场单。                                                    |

### TC-E83：停止时退订 {#tc-e83-unsubscribe-on-stop}

| 字段 | 值                                                            |
| ------------------ | ---------------------------------------------------------------- |
| **前置条件**   | 有活跃的数据订阅（报价、成交、订单簿）。                |
| **操作**         | 以 `can_unsubscribe=True`（默认）停止策略。         |
| **事件序列** | 数据订阅被移除。                                      |
| **通过标准**  | 停止后不再收到数据事件。干净断开。 |
| **跳过条件**      | 适配器不支持退订。                            |

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

### TC-E84：对账未决订单 {#tc-e84-reconcile-open-orders}

| 字段 | 值                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 交易场所上有先前会话遗留的一个或多个未决限价单。                                                                |
| **操作**         | 以 `reconciliation=True` 启动节点。                                                                                      |
| **事件序列** | 每个未决订单生成 `OrderStatusReport`。                                                                              |
| **通过标准**  | 每个未决订单以正确的 `venue_order_id`、status=ACCEPTED、价格、数量、方向和订单类型载入 cache。 |
| **跳过条件**      | 从不。                                                                                                                          |

**注意事项**：

- 从先前的测试会话留下未取消的限价单（停止时不取消）。
- 配置 `external_order_instrument_ids`，让策略注册时建立用于分派对账订单的活跃声明。
- 验证对账订单数量与交易场所报告的数量一致。
- 全量状态可能包含历史的终态订单。未被认领的会以 EXTERNAL 出现。未决订单数量要对照
  交易场所的未决订单端点比较，而不是全量状态的总长度。
- 即使交易场所只有秒级精度，报告的 `ts_event` 也必须是 Unix 纳秒。

### TC-E85：对账已成交订单 {#tc-e85-reconcile-filled-orders}

| 字段 | 值                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 交易场所上有先前会话成交的一个或多个订单。                                                                        |
| **操作**         | 以 `reconciliation=True` 启动节点。                                                                                          |
| **事件序列** | 每笔历史成交生成 `FillReport`。                                                                                    |
| **通过标准**  | 每个已成交订单以正确的 `venue_order_id`、status=FILLED、成交价、成交量和手续费载入 cache。 |
| **跳过条件**      | 从不。                                                                                                                              |

**注意事项**：

- 需要先前会话中成交的订单。
- 验证成交价、数量和手续费与交易场所报告的值一致。
- 有些适配器只报告回看窗口内的成交。
- 历史成交回放可能把实时的零手续费改为 REST 手续费。数据流省略费用而对账提供费用时，
  这一翻转是预期行为。
- 即使交易场所只有秒级精度，报告的 `ts_event` 也必须是 Unix 纳秒。

### TC-E86：对账多头持仓 {#tc-e86-reconcile-open-long-position}

| 字段 | 值                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| **前置条件**   | 交易场所上有先前会话遗留的多头持仓。                                                     |
| **操作**         | 以 `reconciliation=True` 启动节点。                                                                   |
| **事件序列** | 为多头持仓生成 `PositionStatusReport`。                                                      |
| **通过标准**  | 持仓载入 cache，金融工具、side=LONG、数量与开仓均价均与交易场所一致。 |
| **跳过条件**      | 从不。                                                                                                       |

**注意事项**：

- 在先前会话开多头，然后不平仓直接停止策略
  （`close_positions_on_stop=False`）。
- 验证对账后的持仓数量与开仓均价和交易场所一致。
- 对账之后，策略应能管理或平掉该持仓。

### TC-E87：对账空头持仓 {#tc-e87-reconcile-open-short-position}

| 字段 | 值                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 交易场所上有先前会话遗留的空头持仓。                                                     |
| **操作**         | 以 `reconciliation=True` 启动节点。                                                                    |
| **事件序列** | 为空头持仓生成 `PositionStatusReport`。                                                      |
| **通过标准**  | 持仓载入 cache，金融工具、side=SHORT、数量与开仓均价均与交易场所一致。 |
| **跳过条件**      | 从不。                                                                                                        |

**注意事项**：

- 在先前会话开空头，然后不平仓直接停止策略
  （`close_positions_on_stop=False`）。
- 验证对账后的持仓数量与开仓均价和交易场所一致。
- 对账之后，策略应能管理或平掉该持仓。

### TC-E88：对账手续费失败 {#tc-e88-reconciliation-commission-failure}

| 字段 | 值                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 确定性 fixture 为已拥有的已确认成交产生越界手续费。                       |
| **操作**         | 用该 fixture 走直接成交、全量状态、定向报告和推断成交的手续费路径。        |
| **事件序列** | 报告请求返回错误。引擎对账记录 hook 错误，不发出回退的推断成交。   |
| **通过标准**  | 错误可观察。启动失败或推断工作被推迟。稍后有效响应恰好对账一次。 |
| **跳过条件**      | 适配器不为成交报告计算手续费。                                                     |

**注意事项**：

- 断言没有零手续费或通用手续费替换失败的交易场所计算。
- 除直接构造 `FillReport` 外，也要走推断成交 hook。
- 适配器不覆盖共享手续费 hook 时，跳过推断成交部分。
- 断言 hook 的数量、价格与流动性输入与发出的推断成交一致。包含先前成交后增量残差的
  反推价格。
- 有效的显式成交可以生效，但残差数量与依赖它的终态转移保持待定。
- 没有成交证据的仅持仓合成修正不属于手续费计算失败。

### TC-E89：WebSocket 手续费失败 {#tc-e89-websocket-commission-failure}

| 字段 | 值                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 私有成交流产生越界手续费，且带稳定的交易场所成交 ID。                          |
| **操作**         | 投递无效成交，把其手续费换成有效值，再以同一成交 ID 重投。              |
| **事件序列** | 首次投递不发出成交，也不改动成交、终态或去重状态。重放恰好发出一次成交。   |
| **通过标准**  | 无 panic、无回退。有效重放恰好生效一次。REST 对账可恢复漏掉的重放。 |
| **跳过条件**      | 适配器无私有成交流，或不为私有成交计算手续费。                           |

**注意事项**：

- 一笔交易场所成交填满多个自有订单时，让其中一个报告失败。断言首次投递这些报告一个
  都不发出。这可防止重放复制失败之前已构造的报告。
- 断言适配器只在所有报告构造并路由成功后才消耗去重键。
- 断言失败的成交不确认、也不终态化其订单。

---

## 第 10 组：期权交易 {#group-10-options-trading}

测试期权特有的执行行为。期权金融工具通常与线性衍生品有不同的约束：交易场所可能限制订单类型、
支持替代定价模式，或不允许条件单。具体限制因交易场所而异，参见适配器指南。

这些测试需要 `CryptoOption` 金融工具。选一个流动性尚可的虚值期权以便成交。

| TC | 名称 | 描述 | 跳过条件 |
| ------- | ----------------------------- | --------------------------------------------------------------------- | ------------------- |
| TC-E90 | 期权 Limit BUY | 在期权金融工具上挂限价买单。 | 不支持期权 |
| TC-E91 | 期权 Limit SELL | 在期权金融工具上挂限价卖单。 | 不支持期权 |
| TC-E92 | 带替代定价的限价单 | 经 `order_params` 用适配器特有定价挂限价单。 | 不支持替代定价 |
| TC-E94 | 不支持的订单类型被拒绝 | 提交适配器为期权拒绝的订单类型。 | 不支持期权 |
| TC-E96 | 条件单为期权被拒绝 | 在期权上提交止损/条件单。预期被拒绝。 | 不支持期权 |
| TC-E99 | 期权 FOK 限价单 | 在期权金融工具上挂 FOK 限价单。 | 期权不支持 FOK |
| TC-E100 | 取消期权订单 | 取消期权上的未决限价单。 | 不支持期权 |
| TC-E101 | 对账期权持仓 | 对账先前会话的期权持仓。 | 不支持期权 |

### TC-E90：期权 Limit BUY {#tc-e90-limit-buy-option}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，期权金融工具已加载，报价正在流入。                |
| **操作**         | ExecTester 在期权上以被动价格挂限价买单。             |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                  |
| **通过标准**  | 订单被交易场所确认，金融工具、方向、价格、数量均正确。 |
| **跳过条件**      | 适配器不支持期权交易。                                   |

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

### TC-E91：期权 Limit SELL {#tc-e91-limit-sell-option}

| 字段 | 值                                                                       |
| ------------------ | --------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，期权金融工具已加载，报价正在流入。                |
| **操作**         | ExecTester 在期权上以被动价格挂限价卖单。            |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。                  |
| **通过标准**  | 订单被交易场所确认，金融工具、方向、价格、数量均正确。 |
| **跳过条件**      | 适配器不支持期权交易。                                   |

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

### TC-E92：带替代定价的限价单 {#tc-e92-limit-with-alternative-pricing}

| 字段 | 值                                                               |
| ------------------ | ------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，期权金融工具已加载。                        |
| **操作**         | 经 `order_params` 用适配器特有定价挂限价单。 |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted`。          |
| **通过标准**  | 订单被确认。交易场所确认了替代定价模式。    |
| **跳过条件**      | 适配器不支持期权的替代定价模式。     |

**注意事项**：

- 替代定价生效时，订单对象上的 `price` 字段可能是占位值。支持的参数键参见适配器指南。
- 例如：OKX 支持 `px_usd`（USD 价格）与 `px_vol`（隐含波动率）。
- 在交易场所响应中验证定价模式被正确反映。

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

### TC-E94：期权不支持的订单类型被拒绝 {#tc-e94-unsupported-order-type-denied-for-options}

| 字段 | 值                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，期权金融工具已加载。                                                                |
| **操作**         | 提交交易场所对期权不支持的订单类型（如市场单）。                            |
| **事件序列** | 依适配器而定：`OrderDenied`（提交前）或 `OrderSubmitted` -> `OrderRejected`（提交后）。 |
| **通过标准**  | 订单不成交。拒绝或驳回原因提及不支持的订单类型。                      |
| **跳过条件**      | 适配器不支持期权。                                                                           |

**注意事项**：

- 确切的拒绝点因适配器而异。有些适配器在提交前本地拒绝，有些提交后转达交易场所的拒绝。
- ExecTester 可在期权金融工具上经 `open_position_on_start_qty` 触发市场单。
  一些不支持的类型（如 `MarketToLimit`）需要手工或编程提交。
- 对适配器文档中每个不支持的类型都要测试。

### TC-E96：期权条件单被拒绝 {#tc-e96-conditional-order-rejected-for-options}

| 字段 | 值                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，期权金融工具已加载。                                                                |
| **操作**         | 在期权金融工具上提交条件单。                                                         |
| **事件序列** | 依适配器而定：`OrderDenied`（提交前）或 `OrderSubmitted` -> `OrderRejected`（提交后）。 |
| **通过标准**  | 订单不成交。原因提及不支持条件单类型。                                  |
| **跳过条件**      | 适配器不支持期权，或适配器为期权支持条件单。                             |

**注意事项**：

- 对适配器文档中每个为期权不支持的条件类型都要测试
  （如 `STOP_MARKET`、`STOP_LIMIT`、`MARKET_IF_TOUCHED`、`LIMIT_IF_TOUCHED`、
  `TRAILING_STOP_MARKET`）。
- ExecTester 可在期权金融工具上经 `enable_stop_buys`/`enable_stop_sells`
  配合 `stop_order_type` 触发条件单。

### TC-E99：期权 FOK 限价单 {#tc-e99-fok-limit-option}

| 字段 | 值                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| **前置条件**   | 适配器已连接，期权金融工具已加载，盘口深度充足。                            |
| **操作**         | 在期权金融工具上挂 `TimeInForce::Fok` 限价单。                           |
| **事件序列** | `OrderInitialized` -> `OrderSubmitted` -> `OrderAccepted` -> `OrderFilled` 或 `OrderCanceled`。 |
| **通过标准**  | 订单全部成交或被取消。无部分成交。                                       |
| **跳过条件**      | 期权不支持 FOK。                                                      |

**注意事项**：

- 有些交易场所为期权 FOK 订单使用专门的订单类型（如 OKX 用
  `op_fok`）。适配器透明处理这一映射。
- 正向用例要用小数量加激进定价来获得成交。

### TC-E100：取消期权订单 {#tc-e100-cancel-option-order}

| 字段 | 值                                                          |
| ------------------ | -------------------------------------------------------------- |
| **前置条件**   | 来自 TC-E90 或 TC-E91 的未决限价单。                        |
| **操作**         | 取消该未决限价单。                                   |
| **事件序列** | `OrderPendingCancel` -> `OrderCanceled`。                       |
| **通过标准**  | 订单被取消。不再出现在交易场所的未决订单中。 |
| **跳过条件**      | 适配器不支持期权。                              |

### TC-E101：对账期权持仓 {#tc-e101-reconcile-option-position}

| 字段 | 值                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| **前置条件**   | 先前会话的期权持仓。                                           |
| **操作**         | 以 `reconciliation=True` 启动节点。                                           |
| **事件序列** | 为期权持仓生成 `PositionStatusReport`。                            |
| **通过标准**  | 持仓载入 cache，金融工具、方向、数量与开仓均价均正确。 |
| **跳过条件**      | 适配器不支持期权。                                                    |

**注意事项**：

- 在先前会话开期权持仓，然后不平仓直接停止
  （`close_positions_on_stop=False`）。
- 验证对账后的持仓与交易场所报告的状态一致。

---

## ExecTester 配置参考 {#exectester-configuration-reference}

Python `ExecTesterConfig` 各参数的快速参考。默认值是构造后解析得到的值。
Rust builder 使用等价的默认值。

| 参数 | 类型 | 默认值 | 影响分组 |
| ----------------------------------------------- | --------------------- | ---------------------- | -------------- |
| `strategy_id`                                   | `StrategyId?`         | `None`                 | 全部            |
| `order_id_tag`                                  | `str?`                | `None`                 | 全部            |
| `use_hyphens_in_client_order_ids`               | `bool`                | `True`                 | 全部            |
| `use_uuid_client_order_ids`                     | `bool`                | `False`                | 全部            |
| `external_order_instrument_ids`                 | `list[InstrumentId]?` | `None`                 | 9              |
| `instrument_id`                                 | `InstrumentId`        | `BTCUSDT-PERP.BINANCE` | 全部            |
| `client_id`                                     | `ClientId?`           | `None`                 | 全部            |
| `order_qty`                                     | `Quantity`            | `0.001`                | 全部            |
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
| `log_events`                                    | `bool`                | `True`                 | 全部            |
| `log_commands`                                  | `bool`                | `True`                 | 全部            |
