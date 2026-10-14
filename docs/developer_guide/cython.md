# Cython

本文档为在 NautilusTrader 中使用 Cython 的开发者提供建议与实用技巧。
关于 Cython 的语法和约定，详情请参阅官方文档：
[Cython docs](https://cython.readthedocs.io/en/latest/index.html)。

## 什么是 Cython？

Cython 是 Python 的一个超集，可编译为 C 扩展模块，支持可选的静态类型并带来性能优化。NautilusTrader 在其 Python 绑定以及性能关键的组件中广泛使用 Cython。

## 函数与方法签名

请确保所有返回 `void` 或原生 C 类型（例如 `bint`、`int`、`double`）的函数与方法签名中包含 `except *` 关键字。

这样可以保证 Python 异常不会被静默忽略，而会按预期向上“冒泡”到调用方。

## 调试

### PyCharm

多年来，增强对 Cython 调试支持一直是 PyCharm 用户频繁提出的需求。但就目前情况来看，PyCharm 很可能不会将 Cython 调试作为一等公民来全面支持（参见 JetBrains YouTrack 上的相关 issue）。

更多信息请参见该 issue：
[YouTrack: PY-9476](https://youtrack.jetbrains.com/issue/PY-9476)。

### Cython 官方文档

Cython 官方文档中也给出了一些调试建议：
[Cython — Debugging guide](https://cython.readthedocs.io/en/latest/src/userguide/debugging.html)

文档总结的做法通常需要在命令行手动运行一个特殊定制的 `gdb`，该流程较为繁琐，我们并不推荐将其作为常规调试流程。

### 调试小贴士

在调试像 NautilusTrader 这样复杂的系统时，通过调试器逐步跟踪代码通常非常有帮助。但如果无法直接对 Cython 代码进行交互式调试，下面这些方法可以提高可观察性：

- 确保你正在调试的回测或实时系统启用了 `LogLevel.DEBUG`。
  例如在配置中使用 `BacktestEngineConfig(logging=LoggingConfig(log_level="DEBUG"))` 或 `TradingNodeConfig(logging=LoggingConfig=log_level="DEBUG"))`（保持与代码示例一致）。
  启用 `DEBUG` 模式后，你会看到更详细、更细粒度的日志，这通常能帮助理解程序的执行流程。
- 如果仍需更细致的可见性，建议在关键位置加入日志调用到相应组件的 logger，通常形如：
  `self._log.debug(f"HERE {variable}")` 就能提供足够的信息用于排查。
