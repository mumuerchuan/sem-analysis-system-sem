# SEM Insight

SEM Insight is a prototype SEM performance analysis system.

## Features

- Upload `.xlsx`, `.xls`, or `.csv` reports.
- Auto-map common SEM fields such as cost, impressions, clicks, conversions, campaign, keyword, device, region, and date.
- Show KPI cards, daily trend chart, dimension ranking, and optimization diagnostics.
- Export sample template.
- Export a multi-sheet analysis report.
- Provide a backend skeleton for Baidu Marketing OAuth and report normalization.
- Connect the UI to the backend Baidu authorization URL endpoint.
- Load Baidu sync preview data into the same dashboard.
- Exchange Baidu OAuth authorization codes for tokens when credentials are configured.
- Store connected account metadata locally with encrypted token fields.
- Create report sync jobs with date ranges and persist sync history locally.

## Run

Install dependencies:

```bash
npm install
```

Run the web app:

```bash
npm run dev
```

Run the API skeleton:

```bash
npm run dev:api
```

Open:

```text
http://127.0.0.1:5173
```

## Baidu Marketing API Setup

Copy `.env.example` to `.env`, then fill:

```text
BAIDU_CLIENT_ID=
BAIDU_CLIENT_SECRET=
BAIDU_REDIRECT_URI=http://127.0.0.1:5174/api/baidu/callback
APP_SECRET=replace-with-a-long-random-secret
```

Optional frontend API override:

```text
VITE_API_BASE=http://127.0.0.1:5174
```

Useful development endpoints:

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

Connected account records are saved under `server/.data/connections.json`. Token fields are encrypted with `APP_SECRET`, and this directory is ignored by git. Use a long random `APP_SECRET` before connecting real accounts.

Sync job records are saved under `server/.data/sync-jobs.json`. The current sync job runner returns deterministic preview rows. Replace `server/baiduReportSync.js` with real Baidu Marketing report API requests once report scopes and dimensions are approved.

Scheduled report sync should be added after real Baidu Marketing API credentials, scopes, and report dimensions are approved.

In the UI:

- `连接百度账户` calls `/api/baidu/auth-url`. If credentials are missing, it shows the next setup step.
- `同步预览数据` calls `/api/baidu/sync-preview` and loads demo Baidu-format rows into the dashboard.
- `刷新连接状态` calls `/api/baidu/connections` and displays saved Baidu connections without exposing tokens.
- `创建同步任务` calls `/api/baidu/sync-jobs`, persists the job, and loads returned rows into the dashboard.
