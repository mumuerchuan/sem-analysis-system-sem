import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const dataDir = path.resolve('server/.data')
const connectionsPath = path.join(dataDir, 'connections.json')
const appSecret = process.env.APP_SECRET || 'dev-only-change-me-before-production'

function key() {
  return crypto.createHash('sha256').update(appSecret).digest()
}

function encrypt(value) {
  if (!value) return ''
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

function decrypt(value) {
  if (!value) return ''
  const [ivText, tagText, encryptedText] = value.split('.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64'))
  decipher.setAuthTag(Buffer.from(tagText, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

async function readConnections() {
  try {
    const file = await fs.readFile(connectionsPath, 'utf8')
    return JSON.parse(file)
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeConnections(connections) {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(connectionsPath, JSON.stringify(connections, null, 2), 'utf8')
}

function publicConnection(connection) {
  return {
    id: connection.id,
    provider: connection.provider,
    accountName: connection.accountName,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
    expiresAt: connection.expiresAt,
    hasRefreshToken: Boolean(connection.refreshToken),
  }
}

export async function listConnections() {
  const connections = await readConnections()
  return connections.map(publicConnection)
}

export async function getConnection(id) {
  const connections = await readConnections()
  const connection = connections.find((item) => item.id === id)
  if (!connection) return null
  return {
    ...connection,
    accessToken: decrypt(connection.accessToken),
    refreshToken: decrypt(connection.refreshToken),
  }
}

export async function saveBaiduConnection(tokenPayload) {
  const now = new Date()
  const expiresIn = Number(tokenPayload.expires_in || 0)
  const connection = {
    id: crypto.randomUUID(),
    provider: 'baidu',
    accountName: tokenPayload.account_name || tokenPayload.user_id || 'Baidu Marketing Account',
    accessToken: encrypt(tokenPayload.access_token),
    refreshToken: encrypt(tokenPayload.refresh_token),
    scope: tokenPayload.scope || '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: expiresIn ? new Date(now.getTime() + expiresIn * 1000).toISOString() : '',
  }

  const connections = await readConnections()
  connections.push(connection)
  await writeConnections(connections)
  return publicConnection(connection)
}

export async function updateConnectionTokens(id, tokenPayload) {
  const connections = await readConnections()
  const index = connections.findIndex((item) => item.id === id)
  if (index === -1) return null

  const now = new Date()
  const expiresIn = Number(tokenPayload.expires_in || 0)
  const current = connections[index]
  connections[index] = {
    ...current,
    accessToken: encrypt(tokenPayload.access_token),
    refreshToken: encrypt(tokenPayload.refresh_token || decrypt(current.refreshToken)),
    updatedAt: now.toISOString(),
    expiresAt: expiresIn ? new Date(now.getTime() + expiresIn * 1000).toISOString() : current.expiresAt,
  }
  await writeConnections(connections)
  return publicConnection(connections[index])
}

export async function deleteConnection(id) {
  const connections = await readConnections()
  const nextConnections = connections.filter((item) => item.id !== id)
  await writeConnections(nextConnections)
  return connections.length !== nextConnections.length
}
