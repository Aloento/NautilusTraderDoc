# 开发者指南

关于开发、扩展 NautilusTrader，或向项目回馈贡献的指导。

NautilusTrader 是 **Rust 核心加 Python 绑定**的架构：

- **Rust** 负责网络、数据解析、订单撮合及其他性能关键操作。
- **Python** 提供面向用户的 API，用于策略开发、配置与系统集成。
- **PyO3** 连接两者，以极低开销把 Rust 功能暴露给 Python。

这一方式把 Python 的简洁与生态，同 Rust 的性能与内存安全结合在一起。

## 目录 {#contents}

- [环境搭建](./environment_setup.md)
- [设计原则](./design_principles.md)
- [回调派发契约](./callback_dispatch.md)
- [运行时一致性契约](./runtime_conformance.md)
- [编码规范](./coding_standards.md)
- [Shell](./shell.md)
- [Rust](./rust.md)
- [Python](./python.md)
- [测试](./testing.md)
- [测试数据集](./test_datasets.md)
- [文档风格](./docs.md)
- [Markdown 风格](./markdown_style.md)
- [发布说明](./releases.md)
- [安全架构](./security.md)
- [适配器](./adapters.md)
- [Python 适配器](./python_adapters.md)
- [数据测试规范](./spec_data_testing.md)
- [执行测试规范](./spec_exec_testing.md)
- [基准测试](./benchmarking.md)
- [FFI 内存契约](./ffi.md)
- [插件](./plugins.md)
