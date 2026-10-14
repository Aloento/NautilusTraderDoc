# 编写 Actor（Rust）

Actor 接收行情数据、自定义数据/信号和系统事件，但不管理订单。本指南带你构建一个
`SpreadMonitor`，它订阅报价并记录买卖价差。

Actor、trait 与处理器分发的背景见 [Actor](./../concepts/actors.md) 和 [Rust](./../concepts/rust.md)
概念指南。

## 定义结构体 {#define-the-struct}

Actor 拥有一个 `DataActorCore` 和它需要的任何状态。core 存储 Actor 的运行时状态。用户代码通常
通过 `DataActor` 的门面方法访问这些状态，例如：

- `clock()`
- `cache()`
- `config()`
- `actor_id()`
- `trader_id()`
- 订阅方法

```rust
use nautilus_common::{nautilus_actor, actor::{DataActor, DataActorConfig, DataActorCore}};
use nautilus_model::{data::QuoteTick, identifiers::{ActorId, InstrumentId}};

pub struct SpreadMonitor {
    core: DataActorCore,
    instrument_id: InstrumentId,
}
```

## 实现构造函数 {#implement-the-constructor}

用 Actor ID 创建 `DataActorConfig`，再传给 `DataActorCore::new`。配置字段是带默认值的
`Option`，因此除 Actor ID 外其余都可以用 `..Default::default()` 覆盖。

```rust
impl SpreadMonitor {
    pub fn new(instrument_id: InstrumentId) -> Self {
        let config = DataActorConfig {
            actor_id: Some(ActorId::from("SPREAD_MON-001")),
            ..Default::default()
        };
        Self {
            core: DataActorCore::new(config),
            instrument_id,
        }
    }
}
```

## 接入 core 并实现 Debug {#wire-up-the-core-and-implement-debug}

`nautilus_actor!` 宏把 Actor 的 `DataActorCore` 字段接到运行时约定上。默认委托给名为 `core`
的字段；字段名不同时传第二个参数。常规回调不会调用宏生成的 native 访问器，请在 `self` 上使用
`DataActor` 门面方法。

运行时注册依赖 `Actor` 和 `Component` 的 blanket 实现。宏提供 native 运行时的接线；`Debug` 需要
手动实现或 derive。

```rust
nautilus_actor!(SpreadMonitor);

impl std::fmt::Debug for SpreadMonitor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SpreadMonitor").finish()
    }
}
```

## 实现 DataActor trait {#implement-the-dataactor-trait}

覆盖处理器方法来接收数据。所有处理器都有默认的空实现，只需覆盖你需要的。每个处理器返回
`anyhow::Result<()>`。

```rust
impl DataActor for SpreadMonitor {
    fn on_start(&mut self) -> anyhow::Result<()> {
        self.subscribe_quotes(self.instrument_id, None, None);
        Ok(())
    }

    fn on_quote(&mut self, quote: &QuoteTick) -> anyhow::Result<()> {
        let spread = quote.ask_price.as_f64() - quote.bid_price.as_f64();
        log::info!("Spread: {spread:.5}");
        Ok(())
    }
}
```

`subscribe_quotes` 通过 `DataActor` trait 可直接在 `self` 上调用。全部可用处理器见
[处理器表](./../concepts/rust.md#handler-methods)。

## Native 运行时访问 {#native-runtime-access}

默认使用公开的 `DataActor` 门面。只有门面方法无法满足、确需 native 专用访问路径时才引入
`DataActorNative`。门面上提供只读属性：

- `config()`
- `actor_id()`
- `trader_id()`
- `is_registered()`

[Rust native traits](./../concepts/rust.md#native-traits) 一节给出 native trait 的适用性矩阵和
下面这张方法表：

- [`DataActorNative` 方法](./../concepts/rust.md#dataactornative-methods)

这些类型不能跨 Python 边界，因此可移植的 Actor 应使用门面方法，例如：

- `clock()`
- `cache()`

## 注册 Actor {#register-the-actor}

用 `BacktestEngine`：

```rust
let actor = SpreadMonitor::new(instrument_id);
engine.add_actor(actor)?;
```

用 `LiveNode`：

```rust
let actor = SpreadMonitor::new(instrument_id);
node.add_actor(actor)?;
```

## 引用的安全性 {#guard-safety}

系统向你的 Actor 分发消息时，会从注册表取得一个短生命周期的 `ActorRef` guard。你不需要直接
管理这些 guard。若在回调里编写访问其他 Actor 的代码，遵循以下规则：

- 每次都按 ID 查找 Actor，不要缓存 `ActorRef`。
- 在作用域结束前 drop guard，绝不把它存进字段。
- 绝不跨 `.await` 点持有 guard。

`DataActorCore` 上的订阅方法已正确处理这一点：它们捕获 Actor ID，并在回调闭包内部完成查找。
完整的线程与注册表模型见[运行时不变量](./../developer_guide/rust.md#runtime-invariants)。

## 完整示例 {#full-example}

更完整的 Actor 见
[`BookImbalanceActor`](https://github.com/nautechsystems/nautilus_trader/tree/develop/crates/trading/src/examples/actors/imbalance)，
它按工具跟踪状态，并在停止时打印汇总。
