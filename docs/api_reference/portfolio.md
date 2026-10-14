# 组合 {#portfolio}

Python Portfolio 暴露只读的账户、盈亏、敞口、保证金和快照查询。工具盈亏与敞口查询在适用时
接受新鲜价格覆盖；八个标量与集合形式的盈亏、敞口查询都接受可选的目标货币。换算失败时，标量
方法和 `net_exposures` 不返回任何值，盈亏集合方法则抛出异常。任何方法都不会返回部分换算的
混合货币合计。权威的更新与生命周期命令保留在 Rust 引擎内部。

由最新源码自动生成，见官方文档中的 [`nautilus_trader.portfolio`](https://nautilustrader.io/docs/python-api-latest/#module-nautilus_trader.portfolio)。
