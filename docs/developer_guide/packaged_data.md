# 打包数据

仓库内部的一些示例数据存放在 `tests/test_kit/data` 目录下。

## Libor 利率

1 个月期美元（USD）Libor 利率可以通过下载 CSV 格式的数据来更新，数据来源为 [FRED - USD1MTD156N](https://fred.stlouisfed.org/series/USD1MTD156N)。

请确保在时间范围（time window）选项中选择 `Max`，以获取完整的历史序列。

## 短期利率（Short term interest rates）

同业（interbank）短期利率可通过 OECD 提供的 CSV 数据进行更新，下载页面： [OECD Short-term interest rates](https://data.oecd.org/interest/short-term-interest-rates.htm)。

## 经济事件（Economic events）

经济事件（economic events）的数据可以从 FXStreet 下载 CSV： [FXStreet Economic Calendar](https://www.fxstreet.com/economic-calendar)。

请确保所选时区为 GMT（Greenwich Mean Time）。

FXStreet 最多只允许筛选 3 个月的时间范围，因此按年度季度下载并手动合并为单个 CSV 文件是常见的做法。
使用日历图标按下面的区间分别筛选并下载：

- 01/01/xx - 31/03/xx
- 01/04/xx - 30/06/xx
- 01/07/xx - 30/09/xx
- 01/10/xx - 31/12/xx

分别下载每个季度的 CSV 并将它们合并。
