# Blockchain

## 合约（Contracts）

针对 EVM 智能合约提供的高性能查询接口，使用类型安全的 Rust 抽象封装。通过高效的批量（batch）调用，支持获取代币元数据（token metadata）、DEX 池信息以及常见 DeFi 协议的状态。

### 基础（Multicall3）

使用 Multicall3（合约地址 `0xcA11bde05977b3631167028862bE2a173976CA11`）将多个合约调用合并为一次 RPC 请求。

- 始终使用 `allow_failure: true` 以支持部分成功并获取更详细的错误信息
- 在同一区块内以原子方式执行
- 可能的错误类型：`RpcError`（网络/RPC 问题）、`AbiDecodingError`（ABI 解码失败）

### ERC20

继承自 `BaseContract`，利用 Multicall3 实现高效的批量操作。可获取代币的元数据，并对非标准实现具备鲁棒性的处理逻辑。

**方法（Methods）：**

- `fetch_token_info`：获取单个代币的元数据（内部通过 multicall 获取 name、symbol、decimals）
- `batch_fetch_token_info`：在一次 multicall 中获取多个代币（每个代币发起 3 个调用）
- `enforce_token_fields`：校验 name/symbol 非空

**错误类型（Error Types）：**

1. **`CallFailed`** — 合约不存在或函数未实现 → 跳过该代币
2. **`DecodingError`** — 返回原始字节而非 ABI 编码（例如 `0x5269636f...`）→ 跳过该代币
3. **`EmptyTokenField`** — 函数返回空字符串 → 若强制校验则跳过

**最佳实践（Best Practices）：**

- 若某个池（pool）的任一代币出现错误，建议跳过该池
- `raw_data` 字段保留原始响应，便于调试
- 非标准代币通常还可能存在其他问题（例如转账手续费、rebasing 等）

## 配置（Configuration）

| Option                            | Default            | Description                                                                   |
| --------------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| `chain`                           | Required           | 要同步的 `nautilus_trader.model.Chain`（例如 `Chain.ETHEREUM`）。             |
| `dex_ids`                         | Required           | 描述要启用哪些 DEX 集成的 `DexType` 标识序列。                                |
| `http_rpc_url`                    | Required           | 用于 EVM 调用和 Multicall 请求的 HTTPS RPC 端点。                             |
| `wss_rpc_url`                     | `None`             | 可选的 WSS 端点，用于流式接收实时更新。                                       |
| `rpc_requests_per_second`         | `None`             | 可选的出站 RPC 调用限速（每秒请求数）。                                       |
| `multicall_calls_per_rpc_request` | `100`              | 单次 RPC 请求中批处理的 Multicall 目标最大数量。                              |
| `use_hypersync_for_live_data`     | `True`             | 若为 `True`，使用 Hypersync 进行引导和流式同步以获得更低延迟的差分（diffs）。 |
| `from_block`                      | `None`             | 用于历史回溯的可选起始区块高度。                                              |
| `pool_filters`                    | `DexPoolFilters()` | 选择要监控的 DEX 池时应用的过滤规则。                                         |
| `postgres_cache_database_config`  | `None`             | 可选的 `PostgresConnectOptions`，用于在磁盘上缓存已解码的池状态。             |
