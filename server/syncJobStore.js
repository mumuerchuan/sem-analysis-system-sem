import fs from 'node:fs/promises'
import path from 'node:path'

const dataDir = path.resolve('server/.data')
const jobsPath = path.join(dataDir, 'sync-jobs.json')

async function readJobs() {
  try {
    const file = await fs.readFile(jobsPath, 'utf8')
    return JSON.parse(file)
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeJobs(jobs) {
  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(jobsPath, JSON.stringify(jobs, null, 2), 'utf8')
}

export async function listSyncJobs() {
  const jobs = await readJobs()
  return jobs
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(({ rows, ...job }) => ({
      ...job,
      rowCount: job.rowCount || rows?.length || 0,
    }))
}

export async function getSyncJob(id) {
  const jobs = await readJobs()
  return jobs.find((job) => job.id === id) || null
}

export async function saveSyncJob(job) {
  const jobs = await readJobs()
  const index = jobs.findIndex((item) => item.id === job.id)
  if (index >= 0) {
    jobs[index] = job
  } else {
    jobs.push(job)
  }
  await writeJobs(jobs)
  return job
}
