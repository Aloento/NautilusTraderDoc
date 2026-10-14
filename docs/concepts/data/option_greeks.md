# OptionGreeks

`OptionGreeks` 表示交易场所针对单个期权工具提供的希腊字母敏感度和隐含波动率。它是原生 `Data` 枚举的一个变体，可被记录、回放，并通过数据目录查询。

## 字段 {#fields}

| 字段               | Rust 类型           | Python 类型        | 必填/默认值 | 说明                                      |
| ------------------ | ------------------- | ------------------ | ---------------- | ------------------------------------------ |
| `instrument_id`    | `InstrumentId`      | `InstrumentId`     | 必填         | 希腊字母对应的期权工具。          |
| `convention`       | `GreeksConvention`  | `GreeksConvention` | 默认值          | 数值的计价基准（numeraire）约定。       |
| `greeks`           | `OptionGreekValues` | 多个独立 float    | 必填         | Delta、gamma、vega、theta 和 rho。        |
| `mark_iv`          | `Option<f64>`       | `float \| None`    | `None`           | 标记隐含波动率。                   |
| `bid_iv`           | `Option<f64>`       | `float \| None`    | `None`           | 买价隐含波动率。                    |
| `ask_iv`           | `Option<f64>`       | `float \| None`    | `None`           | 卖价隐含波动率。                    |
| `underlying_price` | `Option<f64>`       | `float \| None`    | `None`           | 计算所用的标的价格。 |
| `open_interest`    | `Option<f64>`       | `float \| None`    | `None`           | 未平仓合约数（若交易场所有发布）。              |
| `ts_event`         | `UnixNanos`         | `int`              | 必填         | 事件时间戳（纳秒）。            |
| `ts_init`          | `UnixNanos`         | `int`              | 必填         | 初始化时间戳（纳秒）。   |

## 行为 {#behavior}

- 在 Rust 接口上，`OptionGreeks` 可解引用到其核心的 `OptionGreekValues`。
- Python 构造函数接受 `delta`、`gamma`、`vega`、`theta` 以及可选的 `rho`，均为独立的 float 参数。
- 期权链订阅用 `underlying_price` 和 delta 确定 ATM 及基于 delta 的行权价窗口。

## 示例 {#example}

```rust tab="Rust"
use nautilus_core::UnixNanos;
use nautilus_model::{
    data::{OptionGreekValues, OptionGreeks},
    enums::GreeksConvention,
    identifiers::InstrumentId,
};

let greeks = OptionGreeks {
    instrument_id: InstrumentId::from("BTC-20240628-65000-C.DERIBIT"),
    convention: GreeksConvention::PriceAdjusted,
    greeks: OptionGreekValues {
        delta: 0.51,
        gamma: 0.0002,
        vega: 12.5,
        theta: -3.2,
        rho: 0.1,
    },
    mark_iv: Some(0.55),
    bid_iv: Some(0.54),
    ask_iv: Some(0.56),
    underlying_price: Some(65_000.0),
    open_interest: Some(120.0),
    ts_event: UnixNanos::from(1_000_000_000),
    ts_init: UnixNanos::from(1_000_000_100),
};
```

```python tab="Python"
from nautilus_trader.model import InstrumentId
from nautilus_trader.model import OptionGreeks

greeks = OptionGreeks(
    instrument_id=InstrumentId.from_str("BTC-20240628-65000-C.DERIBIT"),
    delta=0.51,
    gamma=0.0002,
    vega=12.5,
    theta=-3.2,
    rho=0.1,
    mark_iv=0.55,
    bid_iv=0.54,
    ask_iv=0.56,
    underlying_price=65_000.0,
    open_interest=120.0,
    ts_event=1_000_000_000,
    ts_init=1_000_000_100,
)
```

## 相关指南 {#related-guides}

- [希腊字母](./../greeks.md) 介绍交易场所提供与本地计算的 Greeks。
- [期权](./../options.md#optiongreeks-data-type) 介绍期权链订阅。
- [Python API 参考](https://nautilustrader.io/docs/python-api-latest/model/data.html) 列出 Python 成员。
