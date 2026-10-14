# 运行时一致性契约 {#runtime-conformance-contract}

需要定位选定[设计原则](./design_principles.md)的实现边界与代表性检查时，查阅本参考。

每个小节单独记录其源码基线。源码链接按本文档修订版解析。基线指明该小节证据所依据的
修订版，标注 historical 的除外。后续行为以本文档修订版所链接的源码与测试为准。
两者都不构成对未来变更的保证。

以下条目描述的是 Rust 源码与测试覆盖，不为任何适配器、Python 入口、配置或失败模式
背书。所列测试是源码参考，不是某次测试运行的记录。

## 证据与结果出处 {#evidence-and-outcome-provenance}

历史源码基线：[46f87cd1b7af576495418761bbf11db23e89124c](https://github.com/nautechsystems/nautilus_trader/commit/46f87cd1b7af576495418761bbf11db23e89124c)。
下述提交保留（submission-retention）行为由本文档修订版的链接源码与测试覆盖。

[执行策略](./../concepts/execution/policies.md#terminal-reconciliation-provenance)区分场所证据与
本地策略裁定。Rust 实时执行管理器中，`check_inflight_orders` 对达到重试上限的处理如下：

- **已提交订单**：不适用提交保留时，管理器生成原因为 `INFLIGHT_TIMEOUT` 的拒绝。
- **待确认更新与待确认撤单**：管理器生成 `OrderCanceled`，除非该订单从未被接受
  且需要保留。

这些事件带 `reconciliation=true`。当订单处于
`SubmissionRecoveryPolicy::RetainUnresolved`，或其客户端的
`retain_unresolved_submissions` 返回 `true` 时，管理器保留未获确认的订单。

- **实现**：[Execution manager](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/src/execution/manager.rs)
  中的 `check_inflight_orders`、`register_submission_retention`、
  `submission_is_retained` 与 `resolve_missing_order`。
- **代表性检查**：[Manager integration tests](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/tests/integration/manager.rs)
  中的 `test_inflight_order_generates_rejection_after_max_retries`、
  `test_retained_submission_survives_recovery_and_accepts_late_evidence`、
  `test_check_open_orders_submitted_missing_at_venue_obeys_recovery_policy`、
  `test_inflight_pending_update_generates_canceled`、
  `test_inflight_pending_cancel_generates_canceled`。
- **限度**：重试耗尽并不能确立场所侧的结果。仅凭对账标志无法区分场所报告与本地
  策略裁定，且 `OrderCanceled` 没有原因字段。消费者需要结合相关输入与日志才能
  保留这一区分。

## 回调顺序与所有权 {#callback-ordering-and-ownership}

源码审阅于：[16f2163a3cefd5ae212cbddda7dc5253f8fe0bbc](https://github.com/nautechsystems/nautilus_trader/commit/16f2163a3cefd5ae212cbddda7dc5253f8fe0bbc)。

[回调派发契约](./callback_dispatch.md)要求跨接收者的发布顺序与组件的独占访问。
私有 Rust 原语预留发布顺序，并拒绝对同一分配重叠的受检访问。生产环境的回调投递
不使用这些原语。回测使用边界排空与回调拆除。实时运行循环在选取下一个事件之前做
有界排空，待处理批次之间让出并检查停止。

运行时在少量显式的所有权边界上掌控调度。启动与关停路径在启用之前仍需所有权与
调度覆盖，但这不要求每个生命周期或 flush 方法都放一个排空。

- **实时启动**：成功启动后，运行循环的首次排空就是既有的投递边界。
- **实时处置**：内核处置后先释放持有的 runner，再尝试回调清理。
  外部根仍可阻止清除。
- **独立生命周期**：`start`/`stop` 没有连续的排队回调投递调度，保留其现有的
  同步行为。

[实时生命周期契约](./callback_dispatch.md#live-startup-and-standalone-lifecycle)把初始的排队激活
限定在 Rust 的 `run`/`run_with_mode` 与 Python 的 `run`/`run_async`。激活必须先拒绝
"独立启动 + 排队投递"的组合，然后才接受回调。这一拒绝尚未实现。

- **实现**：

  | 源码                                                       | 符号                                              |
  | ------------------------------------------------------------ | ---------------------------------------------------- |
  | [Dispatch](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/common/src/actor/dispatch.rs)        | `PublicationScope` 与 `drain`。                      |
  | [Allocation access](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/common/src/actor/access.rs) | `AllocationGuard`。                                   |
  | [Live bounded drain](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/src/dispatch.rs)      | 包装 `actor::drain_callbacks` 的 `drain_callbacks`。 |
  | [Runner](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/src/runner.rs)                    | `AsyncRunner::run`。                                  |
  | [Live node](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/src/node/mod.rs)               | `run_with_mode` 与 `dispose`。                       |

- **代表性检查**：

  - dispatch 模块的 `nested_publication_reserves_all_outer_recipients` 检查嵌套发布中
    外层接收者的顺序。
  - access 模块的 `test_actor_and_component_views_share_access` 检查跨视图的互斥。
  - runner 模块的 `test_runner_callback_failure_stops_before_next_command` 检查失败传播，
    以及待处理消息与致命闭锁（fatal latch）的保留。
  - runner 模块的 `test_runner_stop_preserves_messages_and_channel_only_scheduling` 检查
    停止后的有序复用，以及纯通道工作不额外让出。
  - live node 模块的 `test_callback_failure_stops_later_live_events` 检查失败行为：
    失败必须停止后续事件派发与 trader，并把闭锁保留到处置为止。
  - live node 模块的 `test_dispose_releases_retained_callback_roots` 检查 runner 所有权
    释放与致命闭锁清理，同时检查外部根存在时的拒绝与处置错误诊断。
  - live node 模块的 `test_dispose_releases_stop_generated_callback_roots` 检查处置会
    释放停止过程中生成并锚定的消息，而不投递它们。
- **限度**：这些检查不确立生产环境的回调顺序或所有权安全。运行时集成必须在排空之前
  结束外层可变借用，并保留 native、Python 与动态后端的生命周期资格。未经检查的访问
  仍在私有分配守卫之外。

  启用之前，必须通过真实的 native 与 Python 组件做精确的回调序列测试，确立确定性
  顺序。该要求适用于同步核心与回测。覆盖须包括嵌套发布、扇出、回调生成的命令、
  同一时间戳的工作，以及跨有界遍历的续作。仅凭最终计数与余额无法证明顺序。
  见[启用要求](./callback_dispatch.md#activation-requirements)。

## 恢复 {#recovery}

源码基线：[46f87cd1b7af576495418761bbf11db23e89124c](https://github.com/nautechsystems/nautilus_trader/commit/46f87cd1b7af576495418761bbf11db23e89124c)。

启用了执行对账的 Rust 实时节点，在启动 trader 组件之前先完成对账。对账出错则中止
启动。下面的启动集成测试通过测试执行客户端提供终态订单与成交报告，检查恢复出的
数量、价格、成交标识、手续费、持仓数量与终态状态。

- **实现**：[Live node](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/src/node/mod.rs)
  中的 `perform_startup_reconciliation` 及其调用方。
- **代表性检查**：[Node integration tests](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/tests/integration/node.rs)
  中的 `test_live_node_startup_recovers_terminal_fill_exactly`。
- **限度**：该检查覆盖的是基于报告的启动恢复，不涉及后备存储持久性、supervisor
  重启或任意 panic 恢复。对账可以被禁用；事件存储重放也会跳过实时客户端连接与
  对账。场所侧完整性仍受[对账权限](./../concepts/execution/policies.md#reconciliation-authority)
  策略约束。

## 过载处理 {#overload-handling}

源码审阅于：[16f2163a3cefd5ae212cbddda7dc5253f8fe0bbc](https://github.com/nautechsystems/nautilus_trader/commit/16f2163a3cefd5ae212cbddda7dc5253f8fe0bbc)。

[实时 runner](./../concepts/live.md#dispatch-priority-and-overload-behavior)使用无界消息通道。
轮询优先级不向生产者施加背压，也没有队列深度上限。私有回调派发器则单独执行
持有数量、已知存储与回调链三项限制。

- **实现**：[Runner](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/live/src/runner.rs)
  中的 `AsyncRunner::new` 与 `recv`；
  [Dispatch](https://github.com/nautechsystems/nautilus_trader/blob/develop/crates/common/src/actor/dispatch.rs)
  中的准入记账与 `drain`。
- **代表性检查**：runner 模块的 `test_recv_processes_system_event_before_command` 检查
  该通道对的优先级；dispatch 模块的
  `event_count_limit_latches_after_exact_capacity` 与
  `progress_limit_persists_between_bounded_drains` 检查私有限制。
- **限度**：轮询顺序测试不能证明持续负载下的有界延迟或进展。私有回调限制不会
  给实时 runner 队列或进程总内存设界。尽管运行循环排空已实现，生产回调启用与
  实时生命周期所有权覆盖仍是集成要求。队列监控提供运维信号，但不会自动限流
  数据源或停止交易。
