# 开发者指南

欢迎阅读 NautilusTrader 的开发者指南！

这里汇集了如何开发和扩展 NautilusTrader 以满足你交易需求的说明，以及如何将改进贡献回项目的指引。

:::info
本指南的结构同时兼顾了机器化工具和人类读者的阅读需求，便于自动化处理与人工查阅并存。
:::

我们信奉“用对工具做对事”的理念。整体设计思想是尽可能发挥 Python 在高级抽象和丰富生态上的优势，同时通过额外手段弥补其在性能和类型安全（作为解释型动态语言时固有的短板）方面的不足。

Cython 的一个重要优势是：内存的分配与释放可以在构建的“cythonization”步骤中由 C 代码生成器处理（除非你在实现中显式使用了它的低级特性）。

这种做法把 Python 的简洁性与通过编译扩展获得的近原生 C 性能结合了起来。

我们主要的开发与运行环境是 Python。由于生产代码库中大量采用了以 `.pyx` 与 `.pxd` 为后缀的 Cython 文件，因此理解 CPython 实现如何与底层 CPython API 交互，以及 Cython 生成的 NautilusTrader C 扩展模块的工作方式，会非常有帮助。

建议仔细阅读 [Cython 文档](https://cython.readthedocs.io/en/latest/) 来熟悉其核心概念，以及在哪些地方使用了 C 类型（C typing）。

你不需要成为 C 语言专家，但理解 Cython 中的 C 语法如何用于函数与方法定义、局部代码块，以及常见原始 C 类型如何映射到对应的 `PyObject` 类型，会对开发与调试极为有利。

## 目录

- [环境搭建（Environment Setup）](environment_setup.md)
- [编码规范（Coding Standards）](coding_standards.md)
- [Cython](cython.md)
- [Rust](rust.md)
- [文档（Docs）](docs.md)
- [测试（Testing）](testing.md)
- [适配器（Adapters）](adapters.md)
- [基准测试（Benchmarking）](benchmarking.md)
- [封装数据（Packaged Data）](packaged_data.md)
- [FFI 内存契约（FFI Memory Contract）](ffi.md)
