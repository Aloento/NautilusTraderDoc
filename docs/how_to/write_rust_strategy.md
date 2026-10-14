# 编写策略（Rust）

策略在 Actor 之上增加订单管理。本指南带你构建一个最小策略：订阅报价并提交市价订单。请先阅读
[编写 Actor（Rust）](./write_rust_actor.md)。

策略概念与订单管理的背景见 [策略](./../concepts/strategies.md) 和 [Rust](./../concepts/rust.md)
概念指南。

## 定义结构体 {#define-the-struct}

策略保存一个 `StrategyCore` 字段用于运行时接线。常规策略逻辑不直接使用这个字段，请在 `self`
上使用门面方法。

```rust
use nautilus_common::actor::DataActor;
use nautilus_model::{
    data::QuoteTick,
    enums::OrderSide,
    identifiers::{InstrumentId, StrategyId},
    types::Quantity,
};
use nautilus_trading::{nautilus_strategy, strategy::{Strategy, StrategyConfig, StrategyCore}};

pub struct MyStrategy {
    core: StrategyCore,
    instrument_id: InstrumentId,
    trade_size: Quantity,
}
```

## 实现构造函数 {#implement-the-constructor}

`StrategyConfig` 接受 `strategy_id` 和 `order_id_tag`。tag 会追加到该策略产生的所有客户端订单
ID 上，避免多个策略交易同一工具时 ID 冲突。

tag 不能包含连字符，因为运行时从策略 ID 最后一段连字符分隔的部分把它读回来。tag 无效时
`StrategyCore::new` 会 panic；改用 `StrategyCore::new_checked` 可按错误处理。

```rust
impl MyStrategy {
    pub fn new(instrument_id: InstrumentId) -> Self {
        let config = StrategyConfig {
            strategy_id: Some(StrategyId::from("MY_STRAT-001")),
            order_id_tag: Some("001".to_string()),
            ..Default::default()
        };
        Self {
            core: StrategyCore::new(config),
            instrument_id,
            trade_size: Quantity::from("1.0"),
        }
    }
}
```

## 接入 core 并实现 Debug {#wire-up-the-core-and-implement-debug}

`nautilus_strategy!` 宏生成注册和 `Strategy` trait 实现所需的 native 运行时接线。默认委托给名为
`core` 的字段；字段名不同时传第二个参数。宏不会让你的策略或其 `StrategyCore` 解引用到运行时
内部。它还添加 `config()`，返回传给 `StrategyCore::new` 的 `StrategyConfig`。

运行时注册使用 `Actor` 和 `Component` 的 blanket 实现，需要 native 接线和 `Debug`。宏提供 native
接线；`Debug` 需要手动实现或 derive。

```rust
nautilus_strategy!(MyStrategy);

impl std::fmt::Debug for MyStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MyStrategy").finish()
    }
}
```

## 实现 DataActor trait {#implement-the-dataactor-trait}

数据处理与 Actor 完全相同：在 `on_start` 中订阅，在处理器中响应。

```rust
impl DataActor for MyStrategy {
    fn on_start(&mut self) -> anyhow::Result<()> {
        self.subscribe_quotes(self.instrument_id, None, None);
        Ok(())
    }

    fn on_quote(&mut self, quote: &QuoteTick) -> anyhow::Result<()> {
        let order = self.order().market(
            self.instrument_id,
            OrderSide::Buy,
            self.trade_size,
            None, None, None, None, None, None, None,
        );
        self.submit_order(order, None, None, None)?;
        Ok(())
    }
}
```

`self.order()` 构建订单和订单列表。可用方法：

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
- `generate_client_order_id`
- `generate_order_list_id`

`submit_order` 通过宏生成的 `Strategy` trait 实现在 `self` 上可用。

## Native 运行时访问 {#native-runtime-access}

策略逻辑中使用公开门面：

- `clock()`
- `cache()`
- `order()`
- `portfolio()`
- `strategy_id()`
- `Strategy` 上的订单管理方法

常规策略代码不导入 `DataActorNative` 或 `StrategyNative`，也不调用这些 native 句柄：

- `core()`
- `core_mut()`
- `strategy_core()`
- `strategy_core_mut()`
- `order_factory()`
- `order_factory_rc()`
- `portfolio_rc()`

这些 native 句柄暴露借用的运行时状态，只保留在引擎、运行时、注册、PyO3、testkit 或明确对
延迟敏感的 native 代码中。[Rust native traits](./../concepts/rust.md#native-traits) 一节给出
native trait 的适用性矩阵和这两张方法表：

- [`DataActorNative` 方法](./../concepts/rust.md#dataactornative-methods)
- [`StrategyNative` 方法](./../concepts/rust.md#strategynative-methods)

## 覆盖 Strategy 钩子 {#override-strategy-hooks}

要覆盖 `Strategy` trait 的方法（如订单或持仓事件处理器），把它们写在一个代码块里传入。宏会
自动生成内部管道；`DataActor` 的处理器仍放在独立的 `impl DataActor` 块中。

```rust
nautilus_strategy!(MyStrategy, {
    fn on_order_rejected(&mut self, event: OrderRejected) {
        log::warn!("Order rejected: {}", event.reason);
    }
});
```

## 订单管理方法 {#order-management-methods}

`Strategy` trait 提供以下门面方法：

| 方法                  | 作用                                          |
| --------------------- | ----------------------------------------------- |
| `submit_order`        | 向交易场所提交新订单。                        |
| `submit_order_list`   | 提交一组或有订单。                            |
| `modify_order`        | 修改价格、数量或触发价。                      |
| `modify_orders`       | 修改同一工具的多个订单。                      |
| `cancel_order`        | 取消指定订单。                                |
| `cancel_orders`       | 取消一批经过滤的订单。                        |
| `cancel_all_orders`   | 取消某工具的全部订单。                        |
| `close_position`      | 用市价订单平仓。                              |
| `close_all_positions` | 平掉全部未平仓头寸。                          |

## 完整示例 {#full-examples}

- [`EmaCross`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/trading/src/examples/strategies/ema_cross)：
  集成指标的双 EMA 交叉策略。
- [`GridMarketMaker`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/trading/src/examples/strategies/grid_mm)：
  可配置档位与重新报价的网格做市。
