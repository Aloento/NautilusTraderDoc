# 值类型 {#value-types}

NautilusTrader 为交易核心概念提供专门的值类型：`Price`、`Quantity` 和 `Money`。
这些类型内部使用定点数算术，在不同平台和环境下都能进行高效、确定性的计算。

## 概览 {#overview}

| 类型       | 用途                                  | 有无符号 | 币种 |
| ---------- | ---------------------------------------- | ------ | -------- |
| `Quantity` | 交易量、订单数量、持仓。   | 无     | -        |
| `Price`    | 市场价格、报价、价位。     | 有    | -        |
| `Money`    | 货币金额、盈亏、账户余额。 | 有    | 有      |

## 不可变性 {#immutability}

在 Python 中，所有值类型都是**不可变的**。值一经构造便无法更改，
运算不会产生原地修改。

```python
from nautilus_trader.model import Quantity

qty1 = Quantity(100, precision=0)
qty2 = Quantity(50, precision=0)

# This creates a NEW Quantity; qty1 and qty2 are unchanged
result = qty1 + qty2

print(qty1)  # 100
print(qty2)  # 50
print(result)  # 150
```

这一设计带来几点好处：

- **线程安全**：不可变的值可在线程间安全共享，无需同步。
- **可预测**：值不会意外变化，调试更容易。
- **可哈希**：不可变类型可用作字典键和集合元素。

## 算术运算 {#arithmetic-operations}

值类型支持标准算术运算符（`+`、`-`、`*`、`/`、`%`、`//`）
和一元运算符（`-`、`+`、`abs`）。返回类型取决于运算符
与操作数的类型。

### 同类型二元运算 {#same-type-binary-operations}

同一值类型的加减法返回该类型本身，保留其领域含义（价格加价格仍是价格）：

| 运算             | 结果     |
| --------------------- | ---------- |
| `Quantity + Quantity` | `Quantity` |
| `Quantity - Quantity` | `Quantity` |
| `Price + Price`       | `Price`    |
| `Price - Price`       | `Price`    |
| `Money + Money`       | `Money`    |
| `Money - Money`       | `Money`    |

```python
from nautilus_trader.model import Price

price1 = Price(100.50, precision=2)
price2 = Price(0.25, precision=2)

result = price1 + price2  # Returns Price(100.75, precision=2)
print(type(result))  # <class 'nautilus_trader.model.Price'>
```

同类型之间的乘法、除法、整除和取模返回 `Decimal`：

| 运算        | 结果    |
| ---------------- | --------- |
| `Price * Price`  | `Decimal` |
| `Price / Price`  | `Decimal` |
| `Price // Price` | `Decimal` |
| `Price % Price`  | `Decimal` |

`Quantity` 和 `Money` 遵循同样的规则。

这些运算返回 `Decimal`，因为结果的量纲含义变了：

- 价格乘以价格得到的是"价格的平方"，不再是价格。
- 数量除以数量得到的是无量纲比值，不再是数量。

返回 `Decimal` 让单位的换变得以显式体现，避免把结果误读为原来单位的值。

### 一元运算 {#unary-operations}

一元运算符在结果对该类型有效时保留值类型：

| 运算  | `Price`   | `Quantity` | `Money`   |
| ---------- | --------- | ---------- | --------- |
| `-x`（取负） | `Price`   | `Decimal`  | `Money`   |
| `+x`（取正） | `Price`   | `Quantity` | `Money`   |
| `abs(x)`   | `Price`   | `Quantity` | `Money`   |
| `int(x)`   | `int`     | `int`      | `int`     |
| `float(x)` | `float`   | `float`    | `float`   |
| `round(x)` | `Decimal` | `Decimal`  | `Decimal` |

`Quantity.__neg__` 返回 `Decimal` 而非 `Quantity`，因为 `Quantity` 是无符号的，
无法表示负值。

```python
from nautilus_trader.model import Currency, Money, Price, Quantity

USD = Currency.from_str("USD")

price = Price(100.50, precision=2)
print(-price)  # -100.50
print(type(-price))  # <class 'nautilus_trader.model.Price'>

money = Money(-50.00, USD)
print(abs(money))  # 50.00 USD
print(type(abs(money)))  # <class 'nautilus_trader.model.Money'>

qty = Quantity(10, precision=0)
print(+qty)  # 10
print(type(+qty))  # <class 'nautilus_trader.model.Quantity'>
```

### 混合类型运算 {#mixed-type-operations}

与其他数值类型运算时，结果类型遵循 Python 的
[数值塔](https://docs.python.org/3/library/numbers.html)约定，向更一般的类型拓宽。
与 `float` 运算返回 `float`；与 `int` 和 `Decimal` 运算返回 `Decimal` 以保留精度。

六个二元运算符（`+`、`-`、`*`、`/`、`//`、`%`）都遵循这一规则，且两个方向均适用
（`value op scalar` 与 `scalar op value`）：

| 左操作数 | 右操作数 | 结果类型 |
| ------------ | ------------- | ----------- |
| 值类型   | `int`         | `Decimal`   |
| 值类型   | `float`       | `float`     |
| 值类型   | `Decimal`     | `Decimal`   |
| `int`        | 值类型    | `Decimal`   |
| `float`      | 值类型    | `float`     |
| `Decimal`    | 值类型    | `Decimal`   |

```python
from decimal import Decimal

from nautilus_trader.model import Quantity

qty = Quantity(100, precision=0)

# Quantity + int -> Decimal
result1 = qty + 50
print(type(result1))  # <class 'decimal.Decimal'>

# Quantity + float -> float
result2 = qty + 50.5
print(type(result2))  # <class 'float'>

# Quantity + Decimal -> Decimal
result3 = qty + Decimal("50")
print(type(result3))  # <class 'decimal.Decimal'>
```

## 精度处理 {#precision-handling}

每个值类型都带有一个精度值，表示小数位数。`Price` 和 `Quantity` 存储显式的
`precision` 字段，`Money` 则使用其币种的精度。精度在构造时设定，之后不可变，
这些类型不存在"未指定"的精度。

### 定点数表示 {#fixed-point-representation}

值类型内部以整数存储，按全局固定精度缩放（例如高精度模式下的 10^16），而不是浮点数。
精度字段记录构造时使用的小数位数，控制显示格式与序列化，
但底层原始值始终使用全局尺度。

```python
from nautilus_trader.model import Price

p1 = Price(1.23, precision=2)  # displays as "1.23"
p2 = Price(1.230, precision=3)  # displays as "1.230"

p1 == p2  # True: same underlying value
str(p1)  # "1.23"
str(p2)  # "1.230"
```

**精度与相等性**：小数数值相同但精度不同的两个价格相等。
精度控制显示，不控制相等性。`precision` 字段决定字符串格式及显示的小数位数，
相等性则基于底层数值。

**行情数据序列化**：行情数据类型（如报价、成交、订单簿增量）写入 Parquet 或 Arrow 时，
文件元数据会记录其精度，以便读取方正确解码。同一文件内的所有行情值必须使用相同精度。

:::warning
若交易场所修改了某工具的 tick size（因而改变其精度），变更前与变更后写出的数据文件的
精度元数据不同，不要将它们合并到同一个文件。
:::

工具级精度如何约束合法的价格与数量，见工具指南中的
[精度](./instruments/index.md#precision)一节。

### 运算精度 {#arithmetic-precision}

对不同精度的值做算术运算时，结果取操作数中的最大精度。

```python
from nautilus_trader.model import Price

price1 = Price(100.5, precision=1)  # 1 decimal place
price2 = Price(0.125, precision=3)  # 3 decimal places

result = price1 + price2
print(result)  # 100.625
print(result.precision)  # 3 (max of 1 and 3)
```

## 类型专属约束 {#type-specific-constraints}

### Quantity {#quantity}

`Quantity` 表示非负数量。构造负数量，或从小值中减去更大的值，都会报错：

```python
from nautilus_trader.model import Quantity

# This raises ValueError: Quantity cannot be negative
qty = Quantity(-100, precision=0)

# This also raises ValueError
qty1 = Quantity(50, precision=0)
qty2 = Quantity(100, precision=0)
result = qty1 - qty2  # Would be -50, which is invalid
```

### Money {#money}

`Money` 值包含币种。`Money` 之间的加减法要求**币种一致**：

```python
from nautilus_trader.model import Currency, Money

USD = Currency.from_str("USD")
EUR = Currency.from_str("EUR")

usd_amount = Money(100.00, USD)
eur_amount = Money(50.00, EUR)

# This works - same currency
result = usd_amount + Money(25.00, USD)

# This raises ValueError - currency mismatch
result = usd_amount + eur_amount
```

## 常用模式 {#common-patterns}

### 累加值 {#accumulating-values}

值类型不可变，累加时要重新赋值：

```python
from nautilus_trader.model import Currency, Money

USD = Currency.from_str("USD")

total = Money(0.00, USD)
amounts = [Money(100.00, USD), Money(50.00, USD), Money(25.00, USD)]

for amount in amounts:
    total = total + amount  # Reassign to new Money instance

print(total)  # 175.00 USD
```

### 转换为其他类型 {#converting-to-other-types}

值类型提供转换方法：

```python
from nautilus_trader.model import Price

price = Price(123.456, precision=3)

# Convert to Decimal (preserves precision)
decimal_value = price.as_decimal()

# Convert to float
float_value = price.as_double()

# Convert to string
string_value = str(price)  # "123.456"
```

浮点转换支持到 16 位精度。精度为 17 或 18 时，`float()`、`as_double()`
以及与 `float` 操作数的算术运算会抛出 `ValueError`，而不是舍入掉多余的位数。
精度 16 及以下的转换仍可能发生舍入，因为 float 只有约 16 位有效数字。
需要精确值时使用 `as_decimal()`。

### 从字符串创建 {#creating-from-strings}

从字符串表示解析值类型：

```python
from nautilus_trader.model import Money, Price, Quantity

qty = Quantity.from_str("100.5")
price = Price.from_str("99.95")
money = Money.from_str("1000.00 USD")
```
