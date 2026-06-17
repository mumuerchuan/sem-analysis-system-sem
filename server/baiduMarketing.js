const BAIDU_AUTH_BASE =
  process.env.BAIDU_AUTH_BASE || 'https://openapi.baidu.com/oauth/2.0/authorize'
const BAIDU_TOKEN_URL =
  process.env.BAIDU_TOKEN_URL || 'https://openapi.baidu.com/oauth/2.0/token'

export function getBaiduConfig() {
  return {
    clientId: process.env.BAIDU_CLIENT_ID || '',
    clientSecret: process.env.BAIDU_CLIENT_SECRET || '',
    redirectUri:
      process.env.BAIDU_REDIRECT_URI || 'http://127.0.0.1:5174/api/baidu/callback',
  }
}

export function getBaiduStatus() {
  const config = getBaiduConfig()
  return {
    configured: Boolean(config.clientId && config.clientSecret && config.redirectUri),
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
    redirectUri: config.redirectUri,
  }
}

export function buildAuthorizeUrl(state) {
  const config = getBaiduConfig()
  if (!config.clientId) {
    return null
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  })

  return `${BAIDU_AUTH_BASE}?${params.toString()}`
}

async function requestToken(params) {
  const response = await fetch(`${BAIDU_TOKEN_URL}?${params.toString()}`, {
    method: 'POST',
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload.error) {
    const message = payload.error_description || payload.error || 'Baidu token request failed.'
    throw new Error(message)
  }

  return payload
}

export async function exchangeAuthorizationCode(code) {
  const config = getBaiduConfig()
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Baidu client credentials are not configured.')
  }

  return requestToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
    }),
  )
}

export async function refreshAccessToken(refreshToken) {
  const config = getBaiduConfig()
  if (!config.clientId || !config.clientSecret) {
    throw new Error('Baidu client credentials are not configured.')
  }

  return requestToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  )
}

export function normalizeBaiduRows(rows = []) {
  return rows.map((row, index) => ({
    id: row.id || index + 1,
    date: row.date || row.dateKey || '',
    account: row.account || row.accountName || '',
    campaign: row.campaign || row.campaignName || '',
    unit: row.unit || row.adgroupName || '',
    keyword: row.keyword || row.keywordName || '',
    device: row.device || '',
    region: row.region || '',
    impressions: Number(row.impressions || row.show || 0),
    clicks: Number(row.clicks || row.click || 0),
    cost: Number(row.cost || row.spend || 0),
    conversions: Number(row.conversions || row.conversion || 0),
    revenue: Number(row.revenue || 0),
  }))
}
