import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import crypto from 'node:crypto'
import {
  buildAuthorizeUrl,
  exchangeAuthorizationCode,
  getBaiduStatus,
  normalizeBaiduRows,
  refreshAccessToken,
} from './baiduMarketing.js'
import { runBaiduReportSync } from './baiduReportSync.js'
import {
  deleteConnection,
  getConnection,
  listConnections,
  saveBaiduConnection,
  updateConnectionTokens,
} from './connectionStore.js'
import { getSyncJob, listSyncJobs, saveSyncJob } from './syncJobStore.js'

const app = express()
const port = Number(process.env.API_PORT || 5174)

app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://127.0.0.1:5173' }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'sem-analysis-api',
    time: new Date().toISOString(),
  })
})

app.get('/api/baidu/status', (_req, res) => {
  res.json(getBaiduStatus())
})

app.get('/api/baidu/connections', async (_req, res, next) => {
  try {
    res.json({ connections: await listConnections() })
  } catch (error) {
    next(error)
  }
})

app.get('/api/baidu/auth-url', (_req, res) => {
  const state = crypto.randomUUID()
  const url = buildAuthorizeUrl(state)
  if (!url) {
    res.status(400).json({
      error: 'BAIDU_CLIENT_ID is not configured.',
      nextStep: 'Copy .env.example to .env and fill Baidu Marketing API credentials.',
    })
    return
  }

  res.json({ url, state })
})

app.get('/api/baidu/callback', async (req, res, next) => {
  const { code, state, error } = req.query
  if (error) {
    res.status(400).send(`Baidu authorization failed: ${error}`)
    return
  }
  if (!code) {
    res.status(400).send('Missing authorization code.')
    return
  }

  try {
    const tokenPayload = await exchangeAuthorizationCode(String(code))
    const connection = await saveBaiduConnection(tokenPayload)
    res.send(`
      <html>
        <head><title>SEM Insight Authorization</title></head>
        <body style="font-family: Arial, sans-serif; padding: 32px;">
          <h1>Baidu account connected</h1>
          <p>Connection ID: ${connection.id}</p>
          <p>State: ${String(state || '')}</p>
          <p>You can close this page and return to SEM Insight.</p>
        </body>
      </html>
    `)
  } catch (exchangeError) {
    if (!getBaiduStatus().configured) {
      res.status(400).send(`
        <html>
          <head><title>SEM Insight Authorization</title></head>
          <body style="font-family: Arial, sans-serif; padding: 32px;">
            <h1>Baidu credentials are not configured</h1>
            <p>The callback received a code, but token exchange needs BAIDU_CLIENT_ID and BAIDU_CLIENT_SECRET.</p>
            <p>State: ${String(state || '')}</p>
          </body>
        </html>
      `)
      return
    }
    next(exchangeError)
  }
})

app.post('/api/baidu/connections/:id/refresh', async (req, res, next) => {
  try {
    const connection = await getConnection(req.params.id)
    if (!connection) {
      res.status(404).json({ error: 'Connection not found.' })
      return
    }
    if (!connection.refreshToken) {
      res.status(400).json({ error: 'Connection does not have a refresh token.' })
      return
    }
    const tokenPayload = await refreshAccessToken(connection.refreshToken)
    const updated = await updateConnectionTokens(req.params.id, tokenPayload)
    res.json({ connection: updated })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/baidu/connections/:id', async (req, res, next) => {
  try {
    const deleted = await deleteConnection(req.params.id)
    if (!deleted) {
      res.status(404).json({ error: 'Connection not found.' })
      return
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

app.post('/api/baidu/normalize-report', (req, res) => {
  const rows = normalizeBaiduRows(req.body?.rows || [])
  res.json({ rows, count: rows.length })
})

app.post('/api/baidu/sync-preview', (req, res) => {
  const { startDate, endDate, accountId } = req.body || {}
  res.json({
    mode: 'preview',
    accountId: accountId || 'demo-account',
    startDate: startDate || '',
    endDate: endDate || '',
    rows: normalizeBaiduRows([
      {
        date: startDate || new Date().toISOString().slice(0, 10),
        account: 'Baidu demo account',
        campaign: 'Brand campaign',
        unit: 'Core keywords',
        keyword: 'brand official site',
        device: 'PC',
        region: 'Beijing',
        impressions: 5600,
        clicks: 386,
        cost: 980,
        conversions: 42,
        revenue: 8400,
      },
    ]),
  })
})

app.get('/api/baidu/sync-jobs', async (_req, res, next) => {
  try {
    res.json({ jobs: await listSyncJobs() })
  } catch (error) {
    next(error)
  }
})

app.get('/api/baidu/sync-jobs/:id', async (req, res, next) => {
  try {
    const job = await getSyncJob(req.params.id)
    if (!job) {
      res.status(404).json({ error: 'Sync job not found.' })
      return
    }
    res.json({ job })
  } catch (error) {
    next(error)
  }
})

app.post('/api/baidu/sync-jobs', async (req, res, next) => {
  const { connectionId, startDate, endDate, mode = 'preview' } = req.body || {}
  const now = new Date().toISOString()
  const job = {
    id: crypto.randomUUID(),
    provider: 'baidu',
    mode,
    connectionId: connectionId || '',
    startDate,
    endDate,
    status: 'running',
    rowCount: 0,
    rows: [],
    error: '',
    createdAt: now,
    updatedAt: now,
  }

  try {
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'startDate and endDate are required.' })
      return
    }

    await saveSyncJob(job)
    const connection = connectionId ? await getConnection(connectionId) : null
    if (connectionId && !connection) {
      throw new Error('Connection not found.')
    }

    const rows = await runBaiduReportSync({ connection, startDate, endDate })
    const completedJob = {
      ...job,
      status: 'completed',
      rowCount: rows.length,
      rows,
      updatedAt: new Date().toISOString(),
    }
    await saveSyncJob(completedJob)
    res.status(201).json({ job: completedJob })
  } catch (error) {
    const failedJob = {
      ...job,
      status: 'failed',
      error: error.message,
      updatedAt: new Date().toISOString(),
    }
    await saveSyncJob(failedJob)
    next(error)
  }
})

app.listen(port, () => {
  console.log(`SEM analysis API listening on http://127.0.0.1:${port}`)
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({
    error: 'Internal server error.',
    message: error.message,
  })
})
