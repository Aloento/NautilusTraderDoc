# 插件 {#plugins}

`nautilus-plugin` crate 定义了 NautilusTrader 插件的产物契约。插件是一个独立编译的
Rust `cdylib`，通过带版本的清单表明身份，并经由 C-ABI 边界交换值。

该 crate 只覆盖产物身份与边界原语，不负责加载、注册或运行插件。
加载宿主属于 Nautilus 内部部署细节，不在本仓库内。

:::warning
插件 ABI 处于早期 alpha，契约不稳定。插件构建必须锁定与之匹配的
`nautilus-plugin` 版本。
:::

## 产物契约 {#artifact-contract}

插件是导出单一入口符号 `nautilus_plugin_init` 的 Rust `cdylib`。
`nautilus_plugin!` 宏生成该符号，同时生成携带构建身份的静态清单：

```rust
nautilus_plugin::nautilus_plugin! {
    name: "example-plugin",
    vendor: "Nautech",
    version: env!("CARGO_PKG_VERSION"),
}
```

`name` 与 `version` 必填，`vendor` 默认为空字符串。每个产物在模块作用域调用该宏
一次，在产物的 `Cargo.toml` 中设置 `crate-type = ["cdylib"]`，
并依赖匹配的 `nautilus-plugin` 版本。

## 清单兼容性 {#manifest-compatibility}

`nautilus_plugin_init` 接受一个不透明的宿主指针，返回存放在进程生命周期
存储中的 `PluginManifest`。宿主指针为空或调用 panic 时返回 null。
`PluginManifest::validate` 检查宿主在注册前依赖的各项不变式，报告发现的每个
结构性问题，并在下列情形失败：

- `abi_version` 不等于 `NAUTILUS_PLUGIN_ABI_VERSION`，或 `build_id.schema_version`
  不等于 `PLUGIN_BUILD_ID_VERSION`。
- `plugin_name` 或 `plugin_version` 为空。
- 任何清单字符串格式非法：空指针配非零长度，或字节不是有效 UTF-8。
- `build_id.precision_mode` 或 `build_id.fixed_precision` 与宿主构建不一致。

校验精度是因为它会改变模型类型跨边界的布局。其余构建身份字段
（`nautilus-plugin` 版本、`rustc` 版本、target triple 与构建 profile）
仅用于诊断。

## 边界规则 {#boundary-rules}

只有 `nautilus_plugin::boundary` 中的 `#[repr(C)]` 类型，以及由它们构成的
`#[repr(C)]` 类型，才能出现在跨边界的签名中。`String`、`Vec` 与
`Box<dyn Trait>` 依赖 Rust 不稳定的 ABI，绝不可跨越边界。panic 也不允许
穿越边界展开：生成的入口符号会捕获它们并返回 null。

按当前 ABI，插件不会被卸载，因此清单存储在进程存续期内始终有效。

边界与清单类型见 [the crate docs](https://docs.rs/nautilus-plugin)。
