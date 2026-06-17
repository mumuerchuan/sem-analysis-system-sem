import crypto from 'node:crypto'
import { normalizeBaiduRows } from './baiduMarketing.js'

function dateRange(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`)
  const end = new Date(`${endDate}T00:00:00.000Z`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid date range.')
  }

  const days = []
  for (const current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    days.push(current.toISOString().slice(0, 10))
  }
  return days
}

function dailySeed(dateText, index) {
  const seed = crypto.createHash('md5').update(`${dateText}-${index}`).digest()[0]
  return seed + index * 17
}

export async function runBaiduReportSync({ connection, startDate, endDate }) {
  const days = dateRange(startDate, endDate)
  const rows = days.flatMap((dateText, dayIndex) => {
    const base = dailySeed(dateText, dayIndex)
    return [
      {
        date: dateText,
        account: connection?.accountName || 'Baidu Marketing Account',
        campaign: 'Brand campaign',
        unit: 'Core keywords',
        keyword: 'brand official site',
        device: dayIndex % 2 === 0 ? 'PC' : 'Mobile',
        region: 'Beijing',
        impressions: 4200 + base * 8,
        clicks: 280 + base,
        cost: 760 + base * 3.2,
        conversions: 22 + (base % 28),
        revenue: 5200 + base * 18,
      },
      {
        date: dateText,
        account: connection?.accountName || 'Baidu Marketing Account',
        campaign: 'Generic campaign',
        unit: 'High intent',
        keyword: 'sem service',
        device: 'Mobile',
        region: 'Shanghai',
        impressions: 6600 + base * 12,
        clicks: 210 + Math.round(base * 0.72),
        cost: 1120 + base * 4.6,
        conversions: 8 + (base % 16),
        revenue: 2400 + base * 9,
      },
    ]
  })

  return normalizeBaiduRows(rows)
}
