# SEM 投放效果分析系统

这是一个面向搜索推广投放的 SEM 数据分析原型系统，支持上传 Excel / CSV 报表，也预留了百度营销账户授权、数据同步和报表规范化能力。

## 核心功能

- 支持上传 `.xlsx`、`.xls`、`.csv` 投放报表。
- 自动识别常见 SEM 字段：消费、展现、点击、转化、收入、计划、单元、关键词、设备、地域、日期等。
- 提供 KPI 卡片、每日趋势、维度排行、诊断建议和多维可视化分析。
- 支持拖拽多个维度和指标，快速生成柱图、折线图、面积图、占比图、散点图、漏斗图和热力图。
- 支持导出示例模板和多工作表分析报告。
- 内置关键词分组功能，可按 SEM 账户结构自动拆分计划、单元和关键词。
- 关键词分组支持按同类词、同义词、产品类型、品牌主体、下载/官网/价格/推荐等搜索意图细分。
- 单个关键词单元默认不超过 10 个词，便于后续投放搭建和质量度管理。
- 提供百度营销 OAuth、连接状态、本地连接记录和同步任务的后端骨架。

## 技术栈

- React
- Vite
- Recharts
- XLSX
- Express
- Baidu Marketing API 接入骨架

## 本地运行

安装依赖：

```bash
npm install
```

启动前端：

```bash
npm run dev
```

启动后端 API：

```bash
npm run dev:api
```

打开浏览器访问：

```text
http://127.0.0.1:5173
```

## 百度营销 API 配置

复制 `.env.example` 为 `.env`，然后填写：

```text
BAIDU_CLIENT_ID=
BAIDU_CLIENT_SECRET=
BAIDU_REDIRECT_URI=http://127.0.0.1:5174/api/baidu/callback
APP_SECRET=replace-with-a-long-random-secret
```

如需修改前端访问的 API 地址，可设置：

```text
VITE_API_BASE=http://127.0.0.1:5174
```

## 后端接口

开发阶段可用接口：

```text
GET  /api/health
GET  /api/baidu/status
GET  /api/baidu/auth-url
GET  /api/baidu/callback
GET  /api/baidu/connections
POST /api/baidu/connections/:id/refresh
DELETE /api/baidu/connections/:id
GET  /api/baidu/sync-jobs
GET  /api/baidu/sync-jobs/:id
POST /api/baidu/sync-jobs
POST /api/baidu/normalize-report
POST /api/baidu/sync-preview
```

## 数据存储说明

百度账户连接记录保存在：

```text
server/.data/connections.json
```

同步任务记录保存在：

```text
server/.data/sync-jobs.json
```

这些本地数据目录已被 `.gitignore` 忽略，不会提交到 GitHub。连接记录里的 token 字段会使用 `APP_SECRET` 加密，接入真实账户前请务必设置足够长的随机密钥。

## 当前接入状态

当前百度营销同步任务仍是可运行的开发骨架，`server/baiduReportSync.js` 会返回确定性的预览数据。拿到正式百度营销 API 权限、报表范围和字段维度后，可以在这里替换为真实报表请求。

界面中的百度相关操作：

- `连接百度账户`：调用 `/api/baidu/auth-url`，如果缺少凭证，会提示下一步配置。
- `同步预览数据`：调用 `/api/baidu/sync-preview`，把模拟的百度格式数据加载到仪表盘。
- `刷新连接状态`：调用 `/api/baidu/connections`，展示已保存连接，但不会暴露 token。
- `创建同步任务`：调用 `/api/baidu/sync-jobs`，保存任务并加载返回的数据。

## 适用场景

- SEM 日常投放数据复盘。
- 百度推广账户报表分析。
- 计划、单元、关键词维度的效果诊断。
- 关键词批量分类和账户结构搭建。
- 搜索词拓词、归类、否词和匹配方式初筛。
