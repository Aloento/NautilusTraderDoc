# 教程

这些教程以循序渐进的方式提供实践演练，每个教程聚焦特定功能或工作流，便于读者动手学习。从基础任务到更复杂的操作，覆盖不同技能层级的需求。

:::info
每个教程均由 docs 目录下的 Jupyter Notebook 生成（见 tutorials 目录）。这些 notebook 是宝贵的学习资源，支持交互式运行示例代码，便于理解与复现。
:::

:::tip

- 请确保你查看的教程文档版本与所使用的 NautilusTrader 版本匹配：
- **Latest**：基于 `master` 分支最新提交（HEAD）构建，适用于最新稳定版本。参见 [Latest 教程](../tutorials/)。
- **Nightly**：基于 `nightly` 分支最新提交构建，包含前沿或试验性功能。参见 [Nightly 教程](https://nautilustrader.io/docs/nightly/tutorials/)。

:::

## 在 Docker 中运行

另外，我们提供了一个自包含的 Docker 化 Jupyter Notebook 服务镜像，可直接下载使用，无需本地环境配置或额外安装。这是快速体验 NautilusTrader 的最便捷方式。注意：删除容器会同时删除容器内的数据。

- 开始之前，请先安装 Docker：
  - 参见 [Docker 安装指南](https://docs.docker.com/get-docker/)，并按步骤完成安装。
- 在终端中下载最新镜像：
  - `docker pull ghcr.io/nautechsystems/jupyterlab:nightly --platform linux/amd64`
- 运行容器并映射 Jupyter 端口：
  - `docker run -p 8888:8888 ghcr.io/nautechsystems/jupyterlab:nightly`
- 容器启动后，终端会打印一条包含访问 token 的 URL，复制该 URL 在浏览器中打开即可，例如：
  - `http://localhost:8888`

:::info
当前 NautilusTrader 在 Jupyter Notebook 的日志输出（stdout）上会超过 Jupyter 的速率限制，
因此示例中将 `log_level` 设置为 `ERROR`。将日志级别调低以查看更多输出会导致 notebook 在执行单元格时挂起。我们正在调查修复方案，方向包括提高 Jupyter 的配置速率限制，或对 Nautilus 的日志刷新进行节流处理。

- 相关 issue： [jupyterlab#12845](https://github.com/jupyterlab/jupyterlab/issues/12845)
- 参考项目： [jupyterlab-limit-output](https://github.com/deshaw/jupyterlab-limit-output)

:::
