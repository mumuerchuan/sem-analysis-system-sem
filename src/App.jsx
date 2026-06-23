import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lightbulb,
  Link2,
  Search,
  Tags,
  TrendingUp,
  Upload,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5174'

const fieldAliases = {
  date: ['日期', '时间', 'date', 'day', '推广日期'],
  account: ['账户', '账号', '账户名称', 'account'],
  campaign: ['计划', '推广计划', '计划名称', '计划/单元', 'campaign'],
  unit: ['单元', '推广单元', '单元名称', '计划/单元', 'adgroup', 'ad group'],
  keyword: ['关键词', '搜索词', '词', 'keyword', 'query'],
  device: ['设备', '终端', 'device'],
  region: ['地域', '地区', '省份', '城市', 'region'],
  impressions: ['展现', '展示', '展现量', '展示量', 'impressions', 'impr'],
  clicks: ['点击', '点击量', 'clicks'],
  cost: ['消费', '花费', '费用', '总费用', 'cost', 'spend'],
  conversions: [
    '转化',
    '转化数',
    '咨询',
    '线索',
    '订单',
    '表单提交成功量',
    '表单提交成功',
    'conversions',
    'conv',
  ],
  revenue: ['收入', '成交金额', '销售额', 'gmv', 'revenue'],
}

const dimensionFields = [
  { key: 'date', label: '日期', description: '按天或报表周期聚合' },
  { key: 'account', label: '账户', description: '账户名称' },
  { key: 'campaign', label: '计划', description: '计划/方案/推广计划' },
  { key: 'unit', label: '单元', description: '推广单元' },
  { key: 'keyword', label: '关键词', description: '关键词或搜索词' },
  { key: 'device', label: '设备', description: 'PC / 移动等终端' },
  { key: 'region', label: '地域', description: '省份、城市或投放地域' },
]

const metricFields = [
  { key: 'cost', label: '消费', format: 'money' },
  { key: 'impressions', label: '展现', format: 'number' },
  { key: 'clicks', label: '点击', format: 'number' },
  { key: 'conversions', label: '转化', format: 'number' },
  { key: 'revenue', label: '收入', format: 'money' },
  { key: 'ctr', label: 'CTR', format: 'percent' },
  { key: 'cpc', label: 'CPC', format: 'money' },
  { key: 'cvr', label: 'CVR', format: 'percent' },
  { key: 'cpa', label: 'CPA', format: 'money' },
  { key: 'roi', label: 'ROI', format: 'ratio' },
]

const chartTypes = [
  ['bar', '柱图'],
  ['line', '折线'],
  ['area', '面积'],
]

const chartColors = ['#2563eb', '#0f9f6e', '#d97706', '#7c3aed', '#dc2626', '#0891b2']

const keywordHeaderAliases = [
  '关键词',
  '关键字',
  '搜索词',
  '词',
  'keyword',
  'query',
  'searchterm',
  'search term',
]

const keywordIntentRules = [
  { unit: '价格费用词', terms: ['价格', '多少钱', '费用', '报价', '收费', '成本', '价钱', '预算'] },
  { unit: '下载安装词', terms: ['下载', '安装包', '安装', '怎么下', '如何下', '哪里下', '在哪下'] },
  { unit: '官网入口词', terms: ['官网', '官方网站', '登录', '入口', '网页版'] },
  { unit: '工时管理词', terms: ['工时', '工时管理', '标准工时', '工时精细化', '工时效率'] },
  { unit: '工作任务词', terms: ['工作任务', '多任务', '任务管理', '任务看板', '任务面板'] },
  { unit: '服务商词', terms: ['公司', '厂家', '服务商', '机构', '代理', '供应商', '哪家好'] },
  { unit: '产品系统词', terms: ['软件', '系统', '平台', '工具', 'saas', 'app', '应用'] },
  { unit: '咨询转化词', terms: ['咨询', '电话', '客服', '预约', '申请', '办理', '开户'] },
  { unit: '教程培训词', terms: ['教程', '培训', '学习', '课程', '怎么', '如何', '方法'] },
  { unit: '口碑对比词', terms: ['排名', '排行', '推荐', '比较', '评测', '怎么样', '好不好'] },
]

const keywordStopWords = [
  '价格',
  '多少钱',
  '费用',
  '报价',
  '收费',
  '成本',
  '价钱',
  '预算',
  '公司',
  '厂家',
  '服务商',
  '机构',
  '代理',
  '供应商',
  '哪家好',
  '软件',
  '系统',
  '平台',
  '工具',
  'saas',
  'app',
  '应用',
  '咨询',
  '电话',
  '客服',
  '预约',
  '申请',
  '办理',
  '开户',
  '教程',
  '培训',
  '学习',
  '课程',
  '怎么',
  '如何',
  '方法',
  '排名',
  '排行',
  '推荐',
  '比较',
  '评测',
  '怎么样',
  '好不好',
  '官网',
  '官方网站',
  '登录',
  '入口',
  '下载',
  '的',
]

const keywordSynonymGroups = [
  ['价格', '多少钱', '费用', '报价', '收费', '价钱'],
  ['公司', '厂家', '服务商', '机构', '供应商'],
  ['软件', '系统', '平台', '工具', '应用'],
  ['教程', '培训', '学习', '课程'],
  ['排名', '排行', '推荐', '哪家好'],
  ['官网', '官方网站', '入口', '登录'],
]

const KEYWORD_UNIT_LIMIT = 10

const keywordBrandRules = [
  { label: '泛微', terms: ['泛微', 'eteams', 'e-office', 'eoffice', 'emobile'] },
  { label: '通达', terms: ['通达', 'tongda'] },
  { label: '致远', terms: ['致远', 'seeyon'] },
  { label: '蓝凌', terms: ['蓝凌'] },
  { label: '钉钉', terms: ['钉钉'] },
  { label: '飞书', terms: ['飞书'] },
  { label: '企业微信', terms: ['企业微信'] },
  { label: '金蝶', terms: ['金蝶'] },
  { label: '用友', terms: ['用友'] },
]

const keywordPlanRules = [
  { plan: '品牌竞品词', terms: keywordBrandRules.flatMap((rule) => rule.terms) },
  {
    plan: '办公协同词',
    terms: [
      'oa',
      '办公',
      '办公自动化',
      '协同',
      '协同办公',
      '移动办公',
      '手机办公',
      'm3办公',
      '移动oa',
      '手机oa',
    ],
  },
  {
    plan: '目标任务管理词',
    terms: [
      'okr',
      'kpi',
      '绩效目标',
      '目标管理',
      '工时',
      '标准工时',
      '工作任务',
      '多任务管理',
      '任务管理',
      '任务看板',
      '任务面板',
      '项目管理',
      '项目看板',
      '项目协作',
    ],
  },
  {
    plan: '业务管理系统词',
    terms: [
      'erp',
      'crm',
      '企业管理',
      '客户管理',
      '销售管理',
      '管理系统',
      '管理平台',
      '管理软件',
      '管理工具',
    ],
  },
  { plan: '流程人事管理词', terms: ['流程', '审批', '报销', '考勤', '请假', '人事', 'hr', '人力资源'] },
  { plan: '文档知识词', terms: ['文档', '知识库', '知识管理', '网盘'] },
]

const keywordUnitCoreRules = [
  { label: '价格费用', terms: ['价格', '多少钱', '费用', '报价', '收费', '成本', '价钱', '预算'] },
  { label: '下载安装', terms: ['下载', '安装包', '安装', '怎么下', '如何下', '哪里下', '在哪下'] },
  { label: '官网入口', terms: ['官网', '官方网站', '登录', '入口', '网页版'] },
  { label: '服务商', terms: ['公司', '厂家', '服务商', '机构', '代理', '供应商'] },
  { label: '口碑对比', terms: ['排名', '排行', '推荐', '比较', '评测', '怎么样', '好不好', '哪家好'] },
  { label: '教程方法', terms: ['教程', '培训', '学习', '课程', '怎么', '如何', '方法'] },
  { label: '移动端', terms: ['移动', '手机', 'm3', 'app'] },
  { label: 'OKR目标管理', terms: ['okr', '目标管理', '绩效目标'] },
  { label: '工时管理', terms: ['工时', '标准工时', '工时精细化', '工时效率'] },
  { label: '工作任务管理', terms: ['工作任务', '多任务管理', '任务管理', '任务看板', '任务面板'] },
  { label: '流程审批', terms: ['流程', '审批', '报销', '考勤', '请假'] },
  { label: '项目管理', terms: ['项目管理', '项目看板', '项目协作'] },
  { label: '客户销售', terms: ['客户', '销售', 'crm'] },
  { label: '文档知识', terms: ['文档', '知识', '网盘'] },
]

const keywordScenarioRules = [
  { label: '产品团队', terms: ['产品部', '产品经理', '产品研发', '产品运营', '产品团队'] },
  { label: '研发团队', terms: ['研发', '技术部', '开发'] },
  { label: '部门团队', terms: ['部门', '团队', '组织'] },
  { label: '绩效考核', terms: ['绩效', '考核', 'kpi'] },
  { label: '目标管理', terms: ['目标管理', '目标'] },
  { label: '下载', terms: ['下载', '安装包', '安装', '怎么下', '如何下', '哪里下', '在哪下'] },
  { label: '官网入口', terms: ['官网入口', '官网', '官方网站', '登录', '入口'] },
  { label: '网页版', terms: ['网页版', '网页端', 'web版', 'web端'] },
  { label: '推荐排行', terms: ['推荐', '排行', '排名', '哪家好'] },
  { label: '价格费用', terms: ['价格', '多少钱', '费用', '报价', '收费'] },
]

const keywordProductTypeRules = [
  { label: 'OKR系统', terms: ['okr系统', 'okr软件', 'okr平台', 'okr工具', 'okr'] },
  { label: '工时管理', terms: ['工时管理设计', '工时管理体系', '工时精细化管理', '工时效率管理', '标准工时管理', '工时管理', '工时'] },
  { label: '开发任务管理', terms: ['开发团队任务管理', '开发任务管理'] },
  { label: '工作任务管理', terms: ['工作多任务管理', '工作任务管理看板', '工作任务管理面板', '管理工作任务', '工作任务管理', '工作任务 管理'] },
  { label: '任务管理', terms: ['好用的任务管理', '任务管理看板', '任务管理面板', '任务管理'] },
  { label: '项目管理', terms: ['国内装修工程项目管理', '国内项目管理', '大型企业项目管理', '大项目管理看板', '产品项目管理', '项目管理'] },
  { label: 'OA管理系统', terms: ['oa管理系统', 'oa管理平台'] },
  { label: 'OA办公系统', terms: ['oa办公系统', 'oa办公平台'] },
  { label: 'OA系统', terms: ['oa系统', 'oa软件', 'oa平台'] },
  { label: '协同办公平台', terms: ['协同办公平台'] },
  { label: '协同办公系统', terms: ['协同办公系统'] },
  { label: '移动办公平台', terms: ['移动办公平台', '手机办公平台', 'm3办公平台'] },
  { label: '移动办公系统', terms: ['移动办公系统', '手机办公系统', 'm3办公系统'] },
  { label: '办公软件', terms: ['办公软件'] },
  { label: '办公系统', terms: ['办公系统'] },
  { label: '办公平台', terms: ['办公平台'] },
  { label: 'ERP系统', terms: ['erp系统', 'erp软件', 'erp平台'] },
  { label: 'CRM系统', terms: ['crm系统', 'crm软件', 'crm平台'] },
  { label: '管理系统', terms: ['管理系统'] },
  { label: '管理平台', terms: ['管理平台'] },
  { label: '软件', terms: ['软件'] },
  { label: '系统', terms: ['系统'] },
  { label: '平台', terms: ['平台'] },
]

const keywordSubjectStopWords = [
  ...keywordStopWords,
  '开源',
  '免费',
  '网页版',
  '安装',
  '安装包',
  '怎么下',
  '如何下',
  '哪里下',
  '在哪下',
  'okr',
  'kpi',
  '目标管理',
  '绩效目标',
  '集团',
  '有限公司',
  '有限责任公司',
]

const sampleRows = [
  ['日期', '账户', '计划', '单元', '关键词', '设备', '地域', '展现', '点击', '消费', '转化', '收入'],
  ['2026-06-01', '百度搜索账户A', '品牌词', '品牌核心', '品牌官网', 'PC', '北京', 12500, 890, 2450, 92, 18400],
  ['2026-06-01', '百度搜索账户A', '行业词', '高意向', 'sem托管公司', '移动', '上海', 8600, 428, 3860, 18, 7200],
  ['2026-06-02', '百度搜索账户A', '行业词', '价格咨询', '百度推广多少钱', '移动', '广东', 14100, 535, 6120, 16, 6400],
  ['2026-06-02', '百度搜索账户A', '竞品词', '竞品拦截', '某某平台开户', 'PC', '浙江', 7200, 216, 2830, 4, 1200],
  ['2026-06-03', '百度搜索账户A', '通用词', '泛流量', '网络推广', '移动', '江苏', 23800, 714, 7660, 9, 3600],
  ['2026-06-03', '百度搜索账户A', '品牌词', '品牌核心', '品牌售后', 'PC', '北京', 9100, 783, 1760, 81, 16200],
]

const money = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('zh-CN')

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[()（）_\-/\\]/g, '')
}

function aliasSet(aliases) {
  return aliases.map(normalizeHeader)
}

function isCsvFile(file) {
  return /\.csv$/i.test(file.name || '')
}

function countReplacementChars(text) {
  return (text.match(/\uFFFD/g) || []).length
}

function decodeCsvText(arrayBuffer) {
  const utf8 = new TextDecoder('utf-8').decode(arrayBuffer)
  if (countReplacementChars(utf8) === 0) return utf8

  try {
    return new TextDecoder('gb18030').decode(arrayBuffer)
  } catch {
    return utf8
  }
}

function normalizeKeyword(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[，,。；;：:｜|、]/g, ' ')
    .replace(/\s+/g, '')
}

function findKeywordHeaderIndex(headers) {
  const normalized = headers.map(normalizeHeader)
  const aliases = keywordHeaderAliases.map(normalizeHeader)
  let index = normalized.findIndex((header) => aliases.includes(header))
  if (index >= 0) return index
  index = normalized.findIndex((header) => aliases.some((alias) => alias && header.includes(alias)))
  return index >= 0 ? index : 0
}

function removeKeywordStopWords(keyword) {
  let core = keyword
  keywordStopWords.forEach((word) => {
    core = core.replaceAll(word, '')
  })
  return core || keyword
}

function detectKeywordIntent(keyword) {
  return (
    keywordIntentRules.find((rule) => rule.terms.some((term) => keyword.includes(term))) || {
      unit: '基础需求词',
      terms: [],
    }
  )
}

function detectSynonymLabel(keyword) {
  const group = keywordSynonymGroups.find((terms) => terms.some((term) => keyword.includes(term)))
  if (!group) return '同类词'
  return `${group[0]}同义词`
}

function detectKeywordBrand(keyword) {
  return keywordBrandRules.find((rule) => rule.terms.some((term) => keyword.includes(term)))
}

function detectKeywordProductType(keyword) {
  return keywordProductTypeRules.find((rule) => rule.terms.some((term) => keyword.includes(term)))
}

function detectKeywordScenario(keyword) {
  return keywordScenarioRules.find((rule) => rule.terms.some((term) => keyword.includes(term)))
}

function isTechnicalKeyword(keyword) {
  return (
    /(\d{1,3}\.){3}\d{1,3}/.test(keyword) ||
    keyword.includes('.net') ||
    keyword.includes('http') ||
    keyword.includes('开源')
  )
}

function compactKeywordCore(keyword, maxLength = 8) {
  const core = removeKeywordStopWords(keyword)
    .replace(/[0-9]+/g, '')
    .replace(/[a-z]{1,2}$/g, '')
  return (core.length > 1 ? core : keyword).slice(0, maxLength)
}

function detectKeywordPlan(keyword) {
  if (isTechnicalKeyword(keyword)) return '技术开发词'
  const planRule = keywordPlanRules.find((rule) => rule.terms.some((term) => keyword.includes(term)))
  if (planRule) return planRule.plan
  return `${compactKeywordCore(keyword, 8)}词`
}

function extractKeywordSubject(keyword, productType) {
  let subject = keyword

  if (productType) {
    productType.terms.forEach((term) => {
      subject = subject.replaceAll(term, '')
    })
  }

  keywordSubjectStopWords.forEach((word) => {
    subject = subject.replaceAll(word, '')
  })

  subject = subject
    .replace(/(\d{1,3}\.){3}\d{1,3}/g, '')
    .replace(/^[.\-_/\\]+|[.\-_/\\]+$/g, '')

  if (subject.length >= 2 && subject.length <= 12) return subject
  if (subject.length > 12) return subject.slice(0, 12)
  return ''
}

function detectKeywordUnitCore(keyword) {
  const brand = detectKeywordBrand(keyword)
  if (brand) return `品牌-${brand.label}`

  if (isTechnicalKeyword(keyword)) return keyword.includes('开源') ? '技术开源' : '技术地址'

  const productType = detectKeywordProductType(keyword)
  if (productType) {
    const scenario = detectKeywordScenario(keyword)
    const subject = extractKeywordSubject(keyword, productType)
    if (productType.label.includes('OKR')) {
      if (subject) return `${subject}-${productType.label}`
      return scenario ? `${scenario.label}-${productType.label}` : productType.label
    }
    return subject ? `${subject}-${productType.label}` : productType.label
  }

  const unitRule = keywordUnitCoreRules.find((rule) => rule.terms.some((term) => keyword.includes(term)))
  if (unitRule) return unitRule.label

  return compactKeywordCore(keyword, 6)
}

function buildKeywordUnitName(keyword, unitCore, intent) {
  const base = unitCore || compactKeywordCore(keyword, 8)
  const suffixMap = {
    价格费用词: '价格',
    下载安装词: '下载',
    官网入口词: '官网',
    服务商词: '服务商',
    口碑对比词: '推荐',
    教程培训词: '教程',
  }
  const suffix = suffixMap[intent.unit]
  if (!suffix || base.endsWith(suffix)) return base
  return `${base}${suffix}`
}

function classifyKeyword(keyword, index) {
  const normalized = normalizeKeyword(keyword)
  const intent = detectKeywordIntent(normalized)
  const synonymLabel = detectSynonymLabel(normalized)
  const plan = detectKeywordPlan(normalized)
  const unitCore = detectKeywordUnitCore(normalized)
  const unit = buildKeywordUnitName(normalized, unitCore, intent)
  const matchType = intent.unit === '基础需求词' ? '短语匹配' : '精确匹配'

  return {
    id: index + 1,
    keyword,
    normalized,
    plan,
    unit,
    unitBase: unit,
    unitKeywordCount: 1,
    unitBatch: 1,
    intent: intent.unit,
    synonymGroup: synonymLabel,
    matchType,
    negativeHint:
      intent.unit === '教程培训词' || intent.unit === '口碑对比词'
        ? '如目标是获客，可关注低意向搜索词并加入否词'
        : '',
  }
}

function splitLargeKeywordUnits(groups, limit = KEYWORD_UNIT_LIMIT) {
  const unitMap = groups.reduce((map, item) => {
    const key = `${item.plan}__${item.unitBase || item.unit}`
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
    return map
  }, new Map())

  return Array.from(unitMap.values())
    .flatMap((items) => {
      const sorted = [...items].sort((a, b) =>
        a.normalized.localeCompare(b.normalized, 'zh-Hans-CN', { numeric: true }),
      )
      return sorted.map((item, index) => {
        const batch = Math.floor(index / limit) + 1
        const batchStart = (batch - 1) * limit
        const batchSize = Math.min(limit, sorted.length - batchStart)
        const suffix = sorted.length > limit ? `-${String(batch).padStart(2, '0')}` : ''
        return {
          ...item,
          unit: `${item.unitBase || item.unit}${suffix}`,
          unitBatch: batch,
          unitKeywordCount: batchSize,
        }
      })
    })
    .map((item, index) => ({
      ...item,
      id: index + 1,
    }))
}

function classifyKeywords(keywords) {
  return splitLargeKeywordUnits(keywords.map(classifyKeyword), KEYWORD_UNIT_LIMIT)
}

function maxKeywordUnitSize(groups) {
  const counts = groups.reduce((map, item) => {
    const key = `${item.plan}__${item.unit}`
    map.set(key, (map.get(key) || 0) + 1)
    return map
  }, new Map())
  return Math.max(0, ...counts.values())
}

function parseKeywordWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target.result
        const workbook = isCsvFile(file)
          ? XLSX.read(decodeCsvText(data), { type: 'string', cellDates: true })
          : XLSX.read(data, { type: 'array', cellDates: true })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const matrix = XLSX.utils
          .sheet_to_json(sheet, { header: 1, defval: '' })
          .filter((row) => row.some((cell) => String(cell).trim() !== ''))
        const headerIndex = matrix.findIndex((row) =>
          row.some((cell) =>
            keywordHeaderAliases.map(normalizeHeader).includes(normalizeHeader(cell)),
          ),
        )
        const headers = headerIndex >= 0 ? matrix[headerIndex] : ['关键词']
        const body = headerIndex >= 0 ? matrix.slice(headerIndex + 1) : matrix
        const keywordIndex = findKeywordHeaderIndex(headers)
        const keywords = uniqueValues(
          body
            .map((row) => String(row[keywordIndex] || row[0] || '').trim())
            .filter(Boolean),
        )
        resolve({
          keywords,
          sheetName: workbook.SheetNames[0],
          headers,
        })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const cleaned = String(value ?? '')
    .replace(/,/g, '')
    .replace(/￥|¥|元|%/g, '')
    .trim()
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function toDateKey(value) {
  if (!value) return '未标注日期'
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      const month = String(parsed.m).padStart(2, '0')
      const day = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${month}-${day}`
    }
  }
  const text = String(value).trim().replace(/\//g, '-')
  return text || '未标注日期'
}

function mapHeaders(headers) {
  const normalized = headers.map(normalizeHeader)
  const exactMatch = Object.fromEntries(
    Object.entries(fieldAliases).map(([key, aliases]) => {
      const matchIndex = normalized.findIndex((header) => aliasSet(aliases).includes(header))
      return [key, matchIndex]
    }),
  )

  return Object.fromEntries(
    Object.entries(fieldAliases).map(([key, aliases]) => {
      if (exactMatch[key] >= 0) return [key, exactMatch[key]]
      const normalizedAliases = aliasSet(aliases)
      const matchIndex = normalized.findIndex((header) =>
        normalizedAliases.some((alias) => alias && header.includes(alias)),
      )
      return [key, matchIndex]
    }),
  )
}

function headerScore(headers) {
  const indexes = mapHeaders(headers)
  return ['impressions', 'clicks', 'cost', 'conversions', 'campaign', 'account'].reduce(
    (score, key) => score + (indexes[key] >= 0 ? 1 : 0),
    0,
  )
}

function findHeaderRow(matrix) {
  let bestIndex = 0
  let bestScore = -1
  matrix.forEach((row, index) => {
    const score = headerScore(row)
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })
  return { headerIndex: bestIndex, score: bestScore }
}

function ratio(numerator, denominator) {
  return denominator ? numerator / denominator : 0
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`
}

function formatMetricValue(value, metricKey) {
  const field = metricFields.find((item) => item.key === metricKey)
  if (field?.format === 'money') return money.format(value)
  if (field?.format === 'percent') return formatPercent(value)
  if (field?.format === 'ratio') return `${Number(value || 0).toFixed(2)}x`
  return number.format(Math.round(value || 0))
}

function createMetric(rows, label, dimensionKey) {
  const grouped = new Map()
  rows.forEach((row) => {
    const key = row[dimensionKey] || '未标注'
    const current = grouped.get(key) || {
      name: key,
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
    }
    current.impressions += row.impressions
    current.clicks += row.clicks
    current.cost += row.cost
    current.conversions += row.conversions
    current.revenue += row.revenue
    grouped.set(key, current)
  })

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      label,
      ctr: ratio(item.clicks, item.impressions),
      cpc: ratio(item.cost, item.clicks),
      cvr: ratio(item.conversions, item.clicks),
      cpa: ratio(item.cost, item.conversions),
      roi: ratio(item.revenue, item.cost),
    }))
    .sort((a, b) => b.cost - a.cost)
}

function valueForMetric(item, metricKey) {
  if (metricKey === 'ctr') return item.ctr
  if (metricKey === 'cpc') return item.cpc
  if (metricKey === 'cvr') return item.cvr
  if (metricKey === 'cpa') return item.cpa
  if (metricKey === 'roi') return item.roi
  return item[metricKey] || 0
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
}

function buildMultiDimensionData(rows, dimensionKeys, metricKeys, limit = 10) {
  const safeDimensions = dimensionKeys.length ? dimensionKeys : ['campaign']
  const safeMetrics = metricKeys.length ? metricKeys : ['cost']
  const grouped = new Map()

  rows.forEach((row) => {
    const keyParts = safeDimensions.map((dimensionKey) => row[dimensionKey] || '未标注')
    const key = keyParts.join(' / ')
    const current = grouped.get(key) || {
      name: key,
      dimensionValues: Object.fromEntries(
        safeDimensions.map((dimensionKey, index) => [dimensionKey, keyParts[index]]),
      ),
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      revenue: 0,
    }

    current.impressions += row.impressions
    current.clicks += row.clicks
    current.cost += row.cost
    current.conversions += row.conversions
    current.revenue += row.revenue
    grouped.set(key, current)
  })

  return [...grouped.values()]
    .map((item) => {
      const enriched = {
        ...item,
        ctr: ratio(item.clicks, item.impressions),
        cpc: ratio(item.cost, item.clicks),
        cvr: ratio(item.conversions, item.clicks),
        cpa: ratio(item.cost, item.conversions),
        roi: ratio(item.revenue, item.cost),
      }
      safeMetrics.forEach((metricKey) => {
        enriched[metricKey] = valueForMetric(enriched, metricKey)
      })
      return enriched
    })
    .sort((a, b) => valueForMetric(b, safeMetrics[0]) - valueForMetric(a, safeMetrics[0]))
    .slice(0, limit)
}

function buildFunnelData(summary) {
  return [
    { name: '展现', value: summary.impressions, fill: '#2563eb' },
    { name: '点击', value: summary.clicks, fill: '#0f9f6e' },
    { name: '转化', value: summary.conversions, fill: '#d97706' },
  ]
}

function buildHeatmap(rows, rowKey, columnKey, metricKey) {
  const rowItems = createMetric(rows, '', rowKey).slice(0, 6).map((item) => item.name)
  const columnItems = createMetric(rows, '', columnKey).slice(0, 5).map((item) => item.name)
  const cells = rowItems.flatMap((rowName) =>
    columnItems.map((columnName) => {
      const matchedRows = rows.filter(
        (row) => (row[rowKey] || '未标注') === rowName && (row[columnKey] || '未标注') === columnName,
      )
      const metric = createMetric(matchedRows, '', rowKey)[0]
      const value = metric ? valueForMetric(metric, metricKey) : 0
      return { rowName, columnName, value }
    }),
  )
  const max = Math.max(...cells.map((cell) => cell.value), 1)
  return { rowItems, columnItems, cells, max }
}

function average(values) {
  const cleanValues = values.filter((value) => Number.isFinite(value))
  return cleanValues.length
    ? cleanValues.reduce((sum, value) => sum + value, 0) / cleanValues.length
    : 0
}

function standardDeviation(values) {
  const mean = average(values)
  const variance = average(values.map((value) => (value - mean) ** 2))
  return Math.sqrt(variance)
}

function pearsonCorrelation(leftValues, rightValues) {
  const paired = leftValues
    .map((left, index) => [left, rightValues[index]])
    .filter(([left, right]) => Number.isFinite(left) && Number.isFinite(right))
  if (paired.length < 2) return 0

  const leftMean = average(paired.map(([left]) => left))
  const rightMean = average(paired.map(([, right]) => right))
  const numerator = paired.reduce(
    (sum, [left, right]) => sum + (left - leftMean) * (right - rightMean),
    0,
  )
  const leftDenominator = Math.sqrt(
    paired.reduce((sum, [left]) => sum + (left - leftMean) ** 2, 0),
  )
  const rightDenominator = Math.sqrt(
    paired.reduce((sum, [, right]) => sum + (right - rightMean) ** 2, 0),
  )

  return leftDenominator && rightDenominator
    ? numerator / (leftDenominator * rightDenominator)
    : 0
}

function buildDataQuality(rows, metadata) {
  const rowCount = rows.length
  const mappedFields = Object.values(metadata.indexes || {}).filter((index) => index >= 0).length
  const zeroCostRows = rows.filter((row) => row.cost === 0).length
  const zeroConversionRows = rows.filter((row) => row.clicks > 0 && row.conversions === 0).length
  const unknownDimensionRows = rows.filter(
    (row) => row.campaign.includes('未标注') || row.account.includes('默认'),
  ).length
  const completeness = rowCount
    ? 1 - (zeroCostRows + unknownDimensionRows) / Math.max(rowCount * 2, 1)
    : 0

  return {
    rowCount,
    mappedFields,
    rawFieldCount: metadata.headers?.length || 0,
    zeroCostRows,
    zeroConversionRows,
    unknownDimensionRows,
    completeness,
  }
}

function buildAnomalies(rows) {
  const campaignMetrics = createMetric(rows, '计划', 'campaign')
  const cpaValues = campaignMetrics.map((item) => item.cpa).filter((value) => value > 0)
  const cpcValues = campaignMetrics.map((item) => item.cpc).filter((value) => value > 0)
  const cpaMean = average(cpaValues)
  const cpaStd = standardDeviation(cpaValues)
  const cpcMean = average(cpcValues)
  const cpcStd = standardDeviation(cpcValues)

  return campaignMetrics
    .flatMap((item) => {
      const alerts = []
      if (item.cost > 0 && item.conversions === 0) {
        alerts.push({
          name: item.name,
          type: '无转化消耗',
          metric: money.format(item.cost),
          severity: 'high',
        })
      }
      if (cpaStd && item.cpa > cpaMean + cpaStd * 1.4) {
        alerts.push({
          name: item.name,
          type: 'CPA 异常偏高',
          metric: money.format(item.cpa),
          severity: 'medium',
        })
      }
      if (cpcStd && item.cpc > cpcMean + cpcStd * 1.6) {
        alerts.push({
          name: item.name,
          type: 'CPC 异常偏高',
          metric: money.format(item.cpc),
          severity: 'medium',
        })
      }
      return alerts
    })
    .slice(0, 8)
}

function buildContribution(rows, dimensionKey, metricKey) {
  const total = rows.reduce((sum, row) => sum + toNumber(row[metricKey]), 0)
  return createMetric(rows, '', dimensionKey)
    .map((item) => {
      const value = valueForMetric(item, metricKey)
      return {
        name: item.name,
        value,
        share: total ? value / total : 0,
      }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
}

function buildCorrelations(rows) {
  const metrics = ['impressions', 'clicks', 'cost', 'conversions', 'revenue']
  return metrics
    .filter((metric) => metric !== 'conversions')
    .map((metric) => ({
      metric,
      label: metricFields.find((field) => field.key === metric)?.label || metric,
      value: pearsonCorrelation(
        rows.map((row) => row[metric]),
        rows.map((row) => row.conversions),
      ),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
}

function buildChartRecommendations(rows, quality, correlations) {
  const recommendations = []
  if (!rows.length) return recommendations

  const topCorrelation = correlations[0]
  if (topCorrelation && Math.abs(topCorrelation.value) > 0.55) {
    recommendations.push({
      title: `${topCorrelation.label} 与转化相关性较强`,
      detail: `相关系数 ${topCorrelation.value.toFixed(2)}，建议用散点图观察边际效率。`,
    })
  }
  if (quality.zeroConversionRows > 0) {
    recommendations.push({
      title: '存在点击后无转化记录',
      detail: `${quality.zeroConversionRows} 行有点击但无转化，建议加入搜索词、落地页和计划维度交叉分析。`,
    })
  }
  recommendations.push({
    title: '推荐组合视图',
    detail: '拖入“计划 + 设备”作为维度，并选择“消费 + 转化 + CPA”作为指标，适合定位预算浪费。',
  })
  recommendations.push({
    title: '推荐贡献拆解',
    detail: '使用计划维度查看消费贡献，再切换 ROI 或 CPA 识别高消耗低回报对象。',
  })

  return recommendations.slice(0, 4)
}

function buildAnalyticsLab(rows, metadata) {
  const quality = buildDataQuality(rows, metadata)
  const anomalies = buildAnomalies(rows)
  const contribution = buildContribution(rows, 'campaign', 'cost')
  const correlations = buildCorrelations(rows)
  const recommendations = buildChartRecommendations(rows, quality, correlations)

  return { quality, anomalies, contribution, correlations, recommendations }
}

function buildDiagnostics(items) {
  return items
    .flatMap((item) => {
      const result = []
      if (item.cost >= 1000 && item.conversions === 0) {
        result.push({
          level: 'high',
          title: `${item.name} 消费较高但暂无转化`,
          detail: `已消费 ${money.format(item.cost)}，建议检查搜索词、落地页相关性和匹配方式。`,
          action: '优先否词或降低出价',
        })
      }
      if (item.clicks >= 100 && item.cvr < 0.02) {
        result.push({
          level: 'medium',
          title: `${item.name} 点击不少但转化率偏低`,
          detail: `点击 ${number.format(item.clicks)}，CVR ${formatPercent(item.cvr)}。`,
          action: '优化落地页和创意承诺',
        })
      }
      if (item.impressions >= 1000 && item.ctr < 0.03) {
        result.push({
          level: 'medium',
          title: `${item.name} CTR 偏低`,
          detail: `展现 ${number.format(item.impressions)}，CTR ${formatPercent(item.ctr)}。`,
          action: '重写创意标题或收窄关键词',
        })
      }
      if (item.conversions > 0 && item.cpa > 300) {
        result.push({
          level: 'low',
          title: `${item.name} CPA 需要关注`,
          detail: `当前 CPA ${money.format(item.cpa)}，可对比业务可接受获客成本。`,
          action: '分时段和地域精细调价',
        })
      }
      return result
    })
    .slice(0, 8)
}

function parseWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target.result
        const workbook = isCsvFile(file)
          ? XLSX.read(decodeCsvText(data), { type: 'string', cellDates: true })
          : XLSX.read(data, {
              type: 'array',
              cellDates: true,
            })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        const compactMatrix = matrix.filter((row) =>
          row.some((cell) => String(cell).trim() !== ''),
        )
        const { headerIndex, score } = findHeaderRow(compactMatrix)
        const headers = compactMatrix[headerIndex] || []
        const body = compactMatrix.slice(headerIndex + 1)
        const indexes = mapHeaders(headers)
        if (score < 3) {
          resolve({ rows: [], headers, indexes, sheetName: workbook.SheetNames[0] })
          return
        }
        const rows = body
          .map((row, index) => ({
            id: index + 1,
            date: toDateKey(row[indexes.date]),
            account: row[indexes.account] || '默认账户',
            campaign: row[indexes.campaign] || '未标注计划',
            unit: row[indexes.unit] || '未标注单元',
            keyword: row[indexes.keyword] || '未标注关键词',
            device: row[indexes.device] || '未标注设备',
            region: row[indexes.region] || '未标注地域',
            impressions: toNumber(row[indexes.impressions]),
            clicks: toNumber(row[indexes.clicks]),
            cost: toNumber(row[indexes.cost]),
            conversions: toNumber(row[indexes.conversions]),
            revenue: toNumber(row[indexes.revenue]),
          }))
          .filter((row) => row.impressions || row.clicks || row.cost || row.conversions)
        resolve({ rows, headers, indexes, sheetName: workbook.SheetNames[0] })
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function analyzeRows(rows) {
  const totals = rows.reduce(
    (sum, row) => ({
      impressions: sum.impressions + row.impressions,
      clicks: sum.clicks + row.clicks,
      cost: sum.cost + row.cost,
      conversions: sum.conversions + row.conversions,
      revenue: sum.revenue + row.revenue,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0, revenue: 0 },
  )
  const summary = {
    ...totals,
    ctr: ratio(totals.clicks, totals.impressions),
    cpc: ratio(totals.cost, totals.clicks),
    cvr: ratio(totals.conversions, totals.clicks),
    cpa: ratio(totals.cost, totals.conversions),
    roi: ratio(totals.revenue, totals.cost),
  }
  const campaign = createMetric(rows, '计划', 'campaign')
  const keyword = createMetric(rows, '关键词', 'keyword')
  const device = createMetric(rows, '设备', 'device')
  const region = createMetric(rows, '地域', 'region')
  const daily = createMetric(rows, '日期', 'date').sort((a, b) => a.name.localeCompare(b.name))
  const diagnostics = buildDiagnostics([...campaign.slice(0, 8), ...keyword.slice(0, 16)])
  return { summary, campaign, keyword, device, region, daily, diagnostics }
}

function exportSample() {
  const sheet = XLSX.utils.aoa_to_sheet(sampleRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'SEM示例数据')
  XLSX.writeFile(workbook, 'sem_sample_data.xlsx')
}

function metricRows(items) {
  return items.map((item) => ({
    name: item.name,
    impressions: item.impressions,
    clicks: item.clicks,
    cost: Number(item.cost.toFixed(2)),
    conversions: item.conversions,
    revenue: Number(item.revenue.toFixed(2)),
    ctr: formatPercent(item.ctr),
    cpc: Number(item.cpc.toFixed(2)),
    cvr: formatPercent(item.cvr),
    cpa: Number(item.cpa.toFixed(2)),
    roi: Number(item.roi.toFixed(2)),
  }))
}

function exportAnalysisReport(analysis) {
  const workbook = XLSX.utils.book_new()
  const summary = [
    ['metric', 'value'],
    ['impressions', analysis.summary.impressions],
    ['clicks', analysis.summary.clicks],
    ['cost', Number(analysis.summary.cost.toFixed(2))],
    ['conversions', analysis.summary.conversions],
    ['revenue', Number(analysis.summary.revenue.toFixed(2))],
    ['ctr', formatPercent(analysis.summary.ctr)],
    ['cpc', Number(analysis.summary.cpc.toFixed(2))],
    ['cvr', formatPercent(analysis.summary.cvr)],
    ['cpa', Number(analysis.summary.cpa.toFixed(2))],
    ['roi', Number(analysis.summary.roi.toFixed(2))],
  ]
  const diagnostics = analysis.diagnostics.map((item) => ({
    level: item.level,
    title: item.title,
    detail: item.detail,
    action: item.action,
  }))

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summary), 'summary')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metricRows(analysis.daily)), 'daily')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metricRows(analysis.campaign)), 'campaign')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metricRows(analysis.keyword)), 'keyword')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metricRows(analysis.device)), 'device')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(metricRows(analysis.region)), 'region')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(diagnostics), 'diagnostics')
  XLSX.writeFile(workbook, `sem_analysis_report_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function exportKeywordGroups(groups) {
  const workbook = XLSX.utils.book_new()
  const rows = groups.map((item) => ({
    计划: item.plan,
    单元: item.unit,
    单元批次: item.unitBatch,
    单元内关键词数: item.unitKeywordCount,
    关键词: item.keyword,
    匹配方式建议: item.matchType,
    语义意图: item.intent,
    同义词组: item.synonymGroup,
    否词提示: item.negativeHint,
  }))
  const summaryRows = Object.values(
    groups.reduce((summary, item) => {
      const key = `${item.plan}__${item.unit}`
      summary[key] ||= {
        计划: item.plan,
        单元: item.unit,
        单元批次: item.unitBatch,
        关键词数量: 0,
      }
      summary[key].关键词数量 += 1
      return summary
    }, {}),
  )

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'keyword_groups')
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'summary')
  XLSX.writeFile(workbook, `sem_keyword_groups_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function normalizeApiRows(apiRows) {
  return apiRows.map((row, index) => ({
    id: row.id || index + 1,
    date: toDateKey(row.date),
    account: row.account || '百度账户',
    campaign: row.campaign || '未标注计划',
    unit: row.unit || '未标注单元',
    keyword: row.keyword || '未标注关键词',
    device: row.device || '未标注设备',
    region: row.region || '未标注地域',
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    cost: toNumber(row.cost),
    conversions: toNumber(row.conversions),
    revenue: toNumber(row.revenue),
  }))
}

function MetricCard({ title, value, sub }) {
  return (
    <div className="metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  )
}

function App() {
  const inputRef = useRef(null)
  const keywordInputRef = useRef(null)
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [keywordError, setKeywordError] = useState('')
  const [keywordFileName, setKeywordFileName] = useState('')
  const [keywordGroups, setKeywordGroups] = useState([])
  const [activeTable, setActiveTable] = useState('campaign')
  const [apiStatus, setApiStatus] = useState(null)
  const [apiMessage, setApiMessage] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [connections, setConnections] = useState([])
  const [syncJobs, setSyncJobs] = useState([])
  const [syncStartDate, setSyncStartDate] = useState('2026-06-01')
  const [syncEndDate, setSyncEndDate] = useState('2026-06-10')
  const [activePage, setActivePage] = useState('analysis')
  const [dataMeta, setDataMeta] = useState({ headers: [], indexes: {}, sheetName: '' })
  const [visualConfig, setVisualConfig] = useState({
    dimensions: ['campaign'],
    metrics: ['cost'],
    chartType: 'bar',
  })

  const analysis = useMemo(() => analyzeRows(rows), [rows])
  const analyticsLab = buildAnalyticsLab(rows, dataMeta)
  const hasData = rows.length > 0
  const selectedDimensions = visualConfig.dimensions
    .map((key) => dimensionFields.find((item) => item.key === key))
    .filter(Boolean)
  const selectedMetrics = visualConfig.metrics
    .map((key) => metricFields.find((item) => item.key === key))
    .filter(Boolean)
  const primaryDimension = selectedDimensions[0] || dimensionFields[2]
  const primaryMetric = selectedMetrics[0] || metricFields[0]
  const visualData = useMemo(
    () => buildMultiDimensionData(rows, visualConfig.dimensions, visualConfig.metrics, 10),
    [rows, visualConfig.dimensions, visualConfig.metrics],
  )
  const pieData = visualData.slice(0, 6)
  const scatterData = createMetric(rows, primaryDimension.label, primaryDimension.key)
    .slice(0, 30)
    .map((item) => ({
      name: item.name,
      cost: item.cost,
      conversions: item.conversions,
      cpa: item.cpa,
    }))
  const funnelData = buildFunnelData(analysis.summary)
  const heatmap = buildHeatmap(rows, 'campaign', 'device', primaryMetric.key)

  async function refreshBaiduState() {
    try {
      const [statusResponse, connectionsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/baidu/status`),
        fetch(`${API_BASE}/api/baidu/connections`),
      ])
      if (!statusResponse.ok || !connectionsResponse.ok) throw new Error('state request failed')
      setApiStatus(await statusResponse.json())
      const payload = await connectionsResponse.json()
      setConnections(payload.connections || [])
      const jobsResponse = await fetch(`${API_BASE}/api/baidu/sync-jobs`)
      if (jobsResponse.ok) {
        const jobsPayload = await jobsResponse.json()
        setSyncJobs(jobsPayload.jobs || [])
      }
    } catch {
      setApiStatus({ configured: false, offline: true })
      setConnections([])
      setSyncJobs([])
    }
  }

  useEffect(() => {
    // Initial API hydration is the one place this app syncs external server state on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshBaiduState()
  }, [])

  async function handleFile(file) {
    if (!file) return
    setError('')
    try {
      const parsed = await parseWorkbook(file)
      if (!parsed.rows.length) {
        setError('没有识别到有效投放数据，请确认表格里包含消费、点击、展现等字段。')
        return
      }
      setRows(parsed.rows)
      setFileName(file.name)
      setDataMeta({
        headers: parsed.headers,
        indexes: parsed.indexes,
        sheetName: parsed.sheetName,
      })
    } catch {
      setError('文件解析失败，请上传 .xlsx、.xls 或 .csv 格式的投放报表。')
    }
  }

  async function handleKeywordFile(file) {
    if (!file) return
    setKeywordError('')
    try {
      const parsed = await parseKeywordWorkbook(file)
      if (!parsed.keywords.length) {
        setKeywordError('没有识别到关键词，请确认表格中有“关键词”或“搜索词”列。')
        return
      }
      setKeywordGroups(classifyKeywords(parsed.keywords))
      setKeywordFileName(file.name)
    } catch {
      setKeywordError('关键词文件解析失败，请上传 .xlsx、.xls 或 .csv。')
    }
  }

  function classifyCurrentReportKeywords() {
    const keywords = uniqueValues(rows.map((row) => row.keyword).filter((keyword) => !keyword.includes('未标注')))
    if (!keywords.length) {
      setKeywordError('当前报表里没有可用关键词，请单独上传关键词表。')
      return
    }
    setKeywordGroups(classifyKeywords(keywords))
    setKeywordFileName('当前报表关键词')
    setKeywordError('')
  }

  function loadSample() {
    const [headers, ...body] = sampleRows
    const indexes = mapHeaders(headers)
    const parsedRows = body.map((row, index) => ({
      id: index + 1,
      date: toDateKey(row[indexes.date]),
      account: row[indexes.account],
      campaign: row[indexes.campaign],
      unit: row[indexes.unit],
      keyword: row[indexes.keyword],
      device: row[indexes.device],
      region: row[indexes.region],
      impressions: toNumber(row[indexes.impressions]),
      clicks: toNumber(row[indexes.clicks]),
      cost: toNumber(row[indexes.cost]),
      conversions: toNumber(row[indexes.conversions]),
      revenue: toNumber(row[indexes.revenue]),
    }))
    setRows(parsedRows)
    setFileName('内置示例数据')
    setDataMeta({ headers, indexes, sheetName: '示例数据' })
    setError('')
  }

  async function connectBaiduAccount() {
    setApiMessage('')
    try {
      const response = await fetch(`${API_BASE}/api/baidu/auth-url`)
      const payload = await response.json()
      if (!response.ok) {
        setApiMessage(payload.nextStep || payload.error || '百度授权参数未配置。')
        return
      }
      window.location.href = payload.url
    } catch {
      setApiMessage('后端 API 未连接，请先运行 npm run dev:api。')
    }
  }

  async function loadBaiduPreview() {
    setApiMessage('')
    setIsSyncing(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const response = await fetch(`${API_BASE}/api/baidu/sync-preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: today, endDate: today }),
      })
      if (!response.ok) throw new Error('sync preview failed')
      const payload = await response.json()
      const nextRows = normalizeApiRows(payload.rows || [])
      setRows(nextRows)
      setFileName('百度 API 同步预览')
      setDataMeta({ headers: [], indexes: {}, sheetName: '百度 API 同步预览' })
      setApiMessage(`已载入 ${number.format(nextRows.length)} 条百度同步预览数据。`)
    } catch {
      setApiMessage('同步预览失败，请确认后端 API 正在运行。')
    } finally {
      setIsSyncing(false)
    }
  }

  async function createSyncJob() {
    setApiMessage('')
    setIsSyncing(true)
    try {
      const response = await fetch(`${API_BASE}/api/baidu/sync-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connections[0]?.id || '',
          startDate: syncStartDate,
          endDate: syncEndDate,
          mode: connections[0]?.id ? 'connected' : 'preview',
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'sync job failed')

      const nextRows = normalizeApiRows(payload.job.rows || [])
      setRows(nextRows)
      setFileName(`百度同步任务 ${payload.job.startDate} 至 ${payload.job.endDate}`)
      setDataMeta({ headers: [], indexes: {}, sheetName: '百度同步任务' })
      setApiMessage(`同步任务完成，已载入 ${number.format(nextRows.length)} 条数据。`)
      await refreshBaiduState()
    } catch (syncError) {
      setApiMessage(syncError.message || '创建同步任务失败，请确认后端 API 正在运行。')
    } finally {
      setIsSyncing(false)
    }
  }

  const tableRows = analysis[activeTable] || []
  const chartData = analysis.daily.map((item) => ({
    name: item.name,
    消费: Math.round(item.cost),
    转化: item.conversions,
    CPA: Math.round(item.cpa),
  }))

  function handleFieldDragStart(event, fieldType, fieldKey) {
    event.dataTransfer.setData('application/json', JSON.stringify({ fieldType, fieldKey }))
  }

  function handleFieldDrop(event, targetType) {
    event.preventDefault()
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/json'))
      if (targetType === 'dimension' && payload.fieldType === 'dimension') {
        setVisualConfig((current) => ({
          ...current,
          dimensions: uniqueValues([...current.dimensions, payload.fieldKey]),
        }))
      }
      if (targetType === 'metric' && payload.fieldType === 'metric') {
        setVisualConfig((current) => ({
          ...current,
          metrics: uniqueValues([...current.metrics, payload.fieldKey]),
        }))
      }
    } catch {
      // Ignore invalid drag payloads.
    }
  }

  function toggleField(fieldType, fieldKey) {
    setVisualConfig((current) => {
      const key = fieldType === 'dimension' ? 'dimensions' : 'metrics'
      const exists = current[key].includes(fieldKey)
      const nextValues = exists
        ? current[key].filter((item) => item !== fieldKey)
        : [...current[key], fieldKey]

      return {
        ...current,
        [key]: nextValues.length ? nextValues : current[key],
      }
    })
  }

  function removeSelectedField(fieldType, fieldKey) {
    setVisualConfig((current) => {
      const key = fieldType === 'dimension' ? 'dimensions' : 'metrics'
      const nextValues = current[key].filter((item) => item !== fieldKey)
      return {
        ...current,
        [key]: nextValues.length ? nextValues : current[key],
      }
    })
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Search size={22} />
          </div>
          <div>
            <strong>SEM Insight</strong>
            <span>投放效果分析系统</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="主导航">
          <button
            className={`nav-item ${activePage === 'analysis' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('analysis')}
          >
            <BarChart3 size={18} /> 数据看板
          </button>
          <button
            className={`nav-item ${activePage === 'upload' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('analysis')}
          >
            <FileSpreadsheet size={18} /> 上传报表
          </button>
          <button
            className={`nav-item ${activePage === 'keyword' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('keyword')}
          >
            <Tags size={18} /> 关键词分组
          </button>
          <button
            className={`nav-item ${activePage === 'baidu' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('analysis')}
          >
            <Cloud size={18} /> 百度授权
          </button>
          <button
            className={`nav-item ${activePage === 'diagnosis' ? 'active' : ''}`}
            type="button"
            onClick={() => setActivePage('analysis')}
          >
            <AlertTriangle size={18} /> 诊断建议
          </button>
        </nav>

        <section className="auth-panel">
          <div className="auth-icon">
            <KeyRound size={18} />
          </div>
          <strong>百度营销 API</strong>
          <p>
            {apiStatus?.offline
              ? '后端 API 未连接，请先运行 npm run dev:api。'
              : connections.length
                ? `已保存 ${connections.length} 个百度连接，可继续同步报表。`
                : apiStatus?.configured
                  ? 'OAuth 参数已配置，可以跳转百度授权。'
                : 'OAuth 参数未配置，可先使用同步预览体验接口。'}
          </p>
          <button type="button" onClick={connectBaiduAccount}>
            <Link2 size={16} /> 连接百度账户
          </button>
          <button type="button" className="ghost-auth" onClick={loadBaiduPreview} disabled={isSyncing}>
            <Cloud size={16} /> {isSyncing ? '同步中...' : '同步预览数据'}
          </button>
          <button type="button" className="ghost-auth" onClick={refreshBaiduState}>
            <CheckCircle2 size={16} /> 刷新连接状态
          </button>
          {apiMessage && <span className="api-message">{apiMessage}</span>}
          {connections.length > 0 && (
            <div className="connection-list">
              {connections.map((connection) => (
                <span key={connection.id}>{connection.accountName}</span>
              ))}
            </div>
          )}
        </section>
      </aside>

      <section className="workspace">
        {activePage === 'analysis' ? (
          <>
        <header className="topbar">
          <div>
            <p className="eyebrow">SEM Performance Analytics</p>
            <h1>投放效果分析</h1>
          </div>
          <div className="top-actions">
            <button type="button" onClick={exportSample}>
              <Download size={16} /> 示例模板
            </button>
            <button type="button" disabled={!hasData} onClick={() => exportAnalysisReport(analysis)}>
              <Download size={16} /> 导出报告
            </button>
            <button type="button" className="primary" onClick={() => inputRef.current?.click()}>
              <Upload size={16} /> 上传 Excel
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </div>
        </header>

        <section className="upload-band">
          <div
            className="drop-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              handleFile(event.dataTransfer.files?.[0])
            }}
          >
            <FileSpreadsheet size={24} />
            <div>
              <strong>{fileName || '拖入百度推广报表，或点击上传'}</strong>
              <span>支持 .xlsx、.xls、.csv，自动识别消费、点击、展现、转化、收入等字段。</span>
            </div>
            <button type="button" onClick={loadSample}>
              使用示例数据
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </section>

        <section className="sync-panel">
          <div>
            <h2>百度报表同步</h2>
            <p>
              {connections.length
                ? '使用已保存连接创建同步任务。'
                : '当前使用预览模式，配置并授权百度账户后会切换到真实连接。'}
            </p>
          </div>
          <label>
            开始日期
            <input
              type="date"
              value={syncStartDate}
              onChange={(event) => setSyncStartDate(event.target.value)}
            />
          </label>
          <label>
            结束日期
            <input
              type="date"
              value={syncEndDate}
              onChange={(event) => setSyncEndDate(event.target.value)}
            />
          </label>
          <button type="button" onClick={createSyncJob} disabled={isSyncing}>
            <Cloud size={16} /> {isSyncing ? '同步中...' : '创建同步任务'}
          </button>
          <div className="job-list">
            {syncJobs.slice(0, 3).map((job) => (
              <span key={job.id}>
                {job.startDate} 至 {job.endDate} · {job.status} · {job.rowCount} 行
              </span>
            ))}
          </div>
        </section>

        <section className="metrics-grid">
          <MetricCard
            title="总消费"
            value={money.format(analysis.summary.cost)}
            sub={`${number.format(rows.length)} 条明细`}
          />
          <MetricCard
            title="点击 / 展现"
            value={`${number.format(analysis.summary.clicks)} / ${number.format(
              analysis.summary.impressions,
            )}`}
            sub={`CTR ${formatPercent(analysis.summary.ctr)}`}
          />
          <MetricCard
            title="转化与 CPA"
            value={`${number.format(analysis.summary.conversions)} / ${money.format(
              analysis.summary.cpa,
            )}`}
            sub={`CVR ${formatPercent(analysis.summary.cvr)}`}
          />
          <MetricCard
            title="ROI"
            value={`${analysis.summary.roi.toFixed(2)}x`}
            sub={`收入 ${money.format(analysis.summary.revenue)}`}
          />
        </section>

        <section className="analytics-lab">
          <div className="lab-header">
            <div>
              <p className="eyebrow">Data Analytics Layer</p>
              <h2>智能分析实验室</h2>
            </div>
            <span className="status-pill">
              <BrainCircuit size={14} /> {hasData ? '已生成洞察' : '等待数据'}
            </span>
          </div>

          <div className="lab-grid">
            <article className="lab-card quality">
              <div className="lab-card-title">
                <Database size={18} />
                <strong>数据质量</strong>
              </div>
              <div className="quality-score">
                {formatPercent(analyticsLab.quality.completeness)}
              </div>
              <div className="quality-list">
                <span>行数：{number.format(analyticsLab.quality.rowCount)}</span>
                <span>
                  字段映射：{analyticsLab.quality.mappedFields}/
                  {analyticsLab.quality.rawFieldCount || dimensionFields.length + metricFields.length}
                </span>
                <span>零消费行：{number.format(analyticsLab.quality.zeroCostRows)}</span>
                <span>点击无转化：{number.format(analyticsLab.quality.zeroConversionRows)}</span>
              </div>
            </article>

            <article className="lab-card">
              <div className="lab-card-title">
                <AlertTriangle size={18} />
                <strong>异常检测</strong>
              </div>
              <div className="insight-list">
                {analyticsLab.anomalies.length ? (
                  analyticsLab.anomalies.map((item) => (
                    <div className={`insight-row ${item.severity}`} key={`${item.name}-${item.type}`}>
                      <span>{item.type}</span>
                      <strong>{item.name}</strong>
                      <em>{item.metric}</em>
                    </div>
                  ))
                ) : (
                  <div className="insight-empty">暂无明显异常</div>
                )}
              </div>
            </article>

            <article className="lab-card">
              <div className="lab-card-title">
                <TrendingUp size={18} />
                <strong>消费贡献 Top 5</strong>
              </div>
              <div className="contribution-list">
                {analyticsLab.contribution.map((item) => (
                  <div className="contribution-row" key={item.name}>
                    <span>{item.name}</span>
                    <div>
                      <i style={{ width: `${Math.max(item.share * 100, 2)}%` }} />
                    </div>
                    <strong>{formatPercent(item.share)}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="lab-card">
              <div className="lab-card-title">
                <Lightbulb size={18} />
                <strong>图表与分析建议</strong>
              </div>
              <div className="recommendation-list">
                {analyticsLab.recommendations.map((item) => (
                  <div className="recommendation" key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="correlation-strip">
            {analyticsLab.correlations.map((item) => (
              <div className="correlation-item" key={item.metric}>
                <span>{item.label} ↔ 转化</span>
                <strong>{item.value.toFixed(2)}</strong>
                <i style={{ width: `${Math.abs(item.value) * 100}%` }} />
              </div>
            ))}
          </div>
        </section>

        <section className="visual-workbench">
          <div className="metadata-panel">
            <div className="panel-title compact">
              <div>
                <h2>元数据字段</h2>
                <p>
                  {dataMeta.sheetName
                    ? `${dataMeta.sheetName} · ${number.format(rows.length)} 行 · ${
                        dataMeta.headers.length || dimensionFields.length + metricFields.length
                      } 个字段`
                    : '上传报表后显示字段结构'}
                </p>
              </div>
            </div>

            <div className="field-group">
              <strong>维度</strong>
              <div className="field-chip-list">
                {dimensionFields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    className={`field-chip ${visualConfig.dimensions.includes(field.key) ? 'active' : ''}`}
                    draggable
                    onDragStart={(event) => handleFieldDragStart(event, 'dimension', field.key)}
                    onClick={() => toggleField('dimension', field.key)}
                  >
                    {field.label}
                    <span>{field.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field-group">
              <strong>指标</strong>
              <div className="field-chip-list metric">
                {metricFields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    className={`field-chip ${visualConfig.metrics.includes(field.key) ? 'active' : ''}`}
                    draggable
                    onDragStart={(event) => handleFieldDragStart(event, 'metric', field.key)}
                    onClick={() => toggleField('metric', field.key)}
                  >
                    {field.label}
                    <span>{field.format}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="builder-panel">
            <div className="panel-title">
              <div>
                <h2>拖拽分析器</h2>
                <p>拖动左侧字段到槽位，快速重组可视化视角</p>
              </div>
              <div className="segment">
                {chartTypes.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={visualConfig.chartType === key ? 'selected' : ''}
                    onClick={() => setVisualConfig((current) => ({ ...current, chartType: key }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="drop-zone-row">
              <div
                className="field-drop"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleFieldDrop(event, 'dimension')}
              >
                <span>维度</span>
                <div className="selected-pill-list">
                  {selectedDimensions.map((field, index) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => removeSelectedField('dimension', field.key)}
                    >
                      {index + 1}. {field.label}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="field-drop"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleFieldDrop(event, 'metric')}
              >
                <span>指标</span>
                <div className="selected-pill-list metric">
                  {selectedMetrics.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => removeSelectedField('metric', field.key)}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="builder-chart">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  {visualConfig.chartType === 'line' ? (
                    <LineChart data={visualData} margin={{ top: 14, right: 18, bottom: 14, left: 4 }}>
                      <CartesianGrid stroke="#e6e8ef" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {selectedMetrics.map((field, index) => (
                        <Line
                          key={field.key}
                          dataKey={field.key}
                          name={field.label}
                          stroke={chartColors[index % chartColors.length]}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  ) : visualConfig.chartType === 'area' ? (
                    <AreaChart data={visualData} margin={{ top: 14, right: 18, bottom: 14, left: 4 }}>
                      <CartesianGrid stroke="#e6e8ef" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {selectedMetrics.map((field, index) => (
                        <Area
                          key={field.key}
                          dataKey={field.key}
                          name={field.label}
                          stroke={chartColors[index % chartColors.length]}
                          fill={chartColors[index % chartColors.length]}
                          fillOpacity={0.18}
                        />
                      ))}
                    </AreaChart>
                  ) : (
                    <BarChart data={visualData} margin={{ top: 14, right: 18, bottom: 14, left: 4 }}>
                      <CartesianGrid stroke="#e6e8ef" strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {selectedMetrics.map((field, index) => (
                        <Bar
                          key={field.key}
                          dataKey={field.key}
                          name={field.label}
                          radius={[5, 5, 0, 0]}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">上传数据后启用拖拽分析</div>
              )}
            </div>
          </div>
        </section>

        <section className="viz-grid">
          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>{primaryMetric.label} 占比</h2>
                <p>按 {primaryDimension.label} 查看 Top 6 份额</p>
              </div>
            </div>
            <div className="small-chart">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie data={pieData} dataKey={primaryMetric.key} nameKey="name" innerRadius={52} outerRadius={92}>
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMetricValue(value, primaryMetric.key)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">暂无占比图</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>消费与转化散点</h2>
                <p>识别高消费低转化对象</p>
              </div>
            </div>
            <div className="small-chart">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 12, right: 18, bottom: 12, left: 4 }}>
                    <CartesianGrid stroke="#e6e8ef" />
                    <XAxis dataKey="cost" name="消费" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="conversions" name="转化" tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={scatterData} fill="#2563eb" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">暂无散点图</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>漏斗转化</h2>
                <p>展现到点击再到转化</p>
              </div>
            </div>
            <div className="funnel-bars">
              {funnelData.map((item, index) => {
                const width = funnelData[0]?.value ? Math.max((item.value / funnelData[0].value) * 100, 4) : 0
                return (
                  <div className="funnel-row" key={item.name}>
                    <span>{item.name}</span>
                    <div>
                      <i style={{ width: `${width}%`, background: item.fill }} />
                    </div>
                    <strong>
                      {index === 0 ? number.format(item.value) : `${number.format(item.value)} · ${formatPercent(ratio(item.value, funnelData[index - 1]?.value || 0))}`}
                    </strong>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>计划 × 设备热力</h2>
                <p>颜色越深表示 {primaryMetric.label} 越高</p>
              </div>
            </div>
            <div className="heatmap">
              <div className="heatmap-head" style={{ gridTemplateColumns: `130px repeat(${heatmap.columnItems.length}, 1fr)` }}>
                <span />
                {heatmap.columnItems.map((column) => (
                  <strong key={column}>{column}</strong>
                ))}
              </div>
              {heatmap.rowItems.map((rowName) => (
                <div className="heatmap-row" key={rowName} style={{ gridTemplateColumns: `130px repeat(${heatmap.columnItems.length}, 1fr)` }}>
                  <strong>{rowName}</strong>
                  {heatmap.columnItems.map((columnName) => {
                    const cell = heatmap.cells.find((item) => item.rowName === rowName && item.columnName === columnName)
                    const intensity = cell ? cell.value / heatmap.max : 0
                    return (
                      <span
                        key={`${rowName}-${columnName}`}
                        style={{ background: `rgba(37, 99, 235, ${0.08 + intensity * 0.72})` }}
                      >
                        {formatMetricValue(cell?.value || 0, primaryMetric.key)}
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel pivot-panel">
          <div className="panel-title">
            <div>
              <h2>多维透视明细</h2>
              <p>
                {selectedDimensions.map((field) => field.label).join(' / ')} ·{' '}
                {selectedMetrics.map((field) => field.label).join('、')}
              </p>
            </div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>组合维度</th>
                  {selectedDimensions.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                  {selectedMetrics.map((field) => (
                    <th key={field.key}>{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hasData ? (
                  visualData.map((item) => (
                    <tr key={item.name}>
                      <td>{item.name}</td>
                      {selectedDimensions.map((field) => (
                        <td key={field.key}>{item.dimensionValues?.[field.key] || '未标注'}</td>
                      ))}
                      {selectedMetrics.map((field) => (
                        <td key={field.key}>{formatMetricValue(item[field.key], field.key)}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={1 + selectedDimensions.length + selectedMetrics.length}>暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="content-grid">
          <div className="panel chart-panel">
            <div className="panel-title">
              <div>
                <h2>每日趋势</h2>
                <p>消费、转化和 CPA 的时间变化</p>
              </div>
              {hasData && (
                <span className="status-pill">
                  <CheckCircle2 size={14} /> 已分析
                </span>
              )}
            </div>
            <div className="chart-box">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="#e6e8ef" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="消费" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="转化" stroke="#0f9f6e" strokeWidth={2} />
                    <Line type="monotone" dataKey="CPA" stroke="#d97706" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">上传报表后生成趋势图</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <h2>问题诊断</h2>
                <p>按消费、转化率、CTR 和 CPA 自动筛选</p>
              </div>
            </div>
            <div className="diagnosis-list">
              {hasData && analysis.diagnostics.length ? (
                analysis.diagnostics.map((item) => (
                  <article className={`diagnosis ${item.level}`} key={`${item.title}${item.action}`}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                    <em>{item.action}</em>
                  </article>
                ))
              ) : (
                <div className="empty-state">暂无诊断项，可先使用示例数据体验</div>
              )}
            </div>
          </div>
        </section>

        <section className="panel table-panel">
          <div className="panel-title">
            <div>
              <h2>维度排行</h2>
              <p>定位高消费、高 CPA、低转化效率的对象</p>
            </div>
            <div className="segment">
              {[
                ['campaign', '计划'],
                ['keyword', '关键词'],
                ['device', '设备'],
                ['region', '地域'],
              ].map(([key, label]) => (
                <button
                  className={activeTable === key ? 'selected' : ''}
                  key={key}
                  type="button"
                  onClick={() => setActiveTable(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-chart-grid">
            <div className="rank-chart">
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tableRows.slice(0, 6).map((item) => ({
                      name: item.name,
                      消费: Math.round(item.cost),
                    }))}
                    layout="vertical"
                    margin={{ top: 8, right: 12, bottom: 8, left: 52 }}
                  >
                    <CartesianGrid stroke="#edf0f5" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={86} />
                    <Tooltip />
                    <Bar dataKey="消费" radius={[0, 5, 5, 0]}>
                      {tableRows.slice(0, 6).map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#2563eb' : '#7c8aa5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">上传数据后展示排行</div>
              )}
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>对象</th>
                    <th>消费</th>
                    <th>点击</th>
                    <th>CTR</th>
                    <th>转化</th>
                    <th>CPA</th>
                    <th>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {hasData ? (
                    tableRows.slice(0, 10).map((item) => (
                      <tr key={`${activeTable}-${item.name}`}>
                        <td>{item.name}</td>
                        <td>{money.format(item.cost)}</td>
                        <td>{number.format(item.clicks)}</td>
                        <td>{formatPercent(item.ctr)}</td>
                        <td>{number.format(item.conversions)}</td>
                        <td>{money.format(item.cpa)}</td>
                        <td>{item.roi.toFixed(2)}x</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7">暂无数据</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
          </>
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">SEM Keyword Builder</p>
                <h1>关键词智能分组</h1>
              </div>
            </header>

            <section className="keyword-tool keyword-page">
              <div className="keyword-tool-head">
                <div>
                  <p className="eyebrow">Keyword Classification</p>
                  <h2>计划与单元自动拆分</h2>
                  <span>
                    上传关键词表后，按大类生成少量计划，再按具体主题、品牌和搜索意图细拆单元。
                  </span>
                </div>
                <div className="keyword-actions">
                  <button type="button" onClick={() => keywordInputRef.current?.click()}>
                    <Upload size={16} /> 上传关键词表
                  </button>
                  <button type="button" onClick={classifyCurrentReportKeywords} disabled={!hasData}>
                    <Tags size={16} /> 使用当前报表关键词
                  </button>
                  <button
                    type="button"
                    onClick={() => exportKeywordGroups(keywordGroups)}
                    disabled={!keywordGroups.length}
                  >
                    <Download size={16} /> 导出分组
                  </button>
                  <input
                    ref={keywordInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(event) => handleKeywordFile(event.target.files?.[0])}
                  />
                </div>
              </div>
              <div className="keyword-summary">
                <div>
                  <strong>{number.format(keywordGroups.length)}</strong>
                  <span>关键词</span>
                </div>
                <div>
                  <strong>{number.format(uniqueValues(keywordGroups.map((item) => item.plan)).length)}</strong>
                  <span>计划</span>
                </div>
                <div>
                  <strong>{number.format(uniqueValues(keywordGroups.map((item) => `${item.plan}-${item.unit}`)).length)}</strong>
                  <span>单元</span>
                </div>
                <div>
                  <strong>{number.format(maxKeywordUnitSize(keywordGroups))}</strong>
                  <span>最大单元词数</span>
                </div>
                <div>
                  <strong>{keywordFileName || '未上传'}</strong>
                  <span>数据来源</span>
                </div>
              </div>
              {keywordError && <p className="error-text">{keywordError}</p>}
              <div className="keyword-table-wrap">
                <table className="data-table keyword-table">
                  <thead>
                    <tr>
                      <th>计划</th>
                      <th>单元</th>
                      <th>单元词数</th>
                      <th>关键词</th>
                      <th>匹配建议</th>
                      <th>语义意图</th>
                      <th>否词提示</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordGroups.length ? (
                      keywordGroups.slice(0, 120).map((item) => (
                        <tr key={`${item.id}-${item.keyword}`}>
                          <td>{item.plan}</td>
                          <td>{item.unit}</td>
                          <td>{item.unitKeywordCount}</td>
                          <td>{item.keyword}</td>
                          <td>{item.matchType}</td>
                          <td>{item.intent}</td>
                          <td>{item.negativeHint || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">暂无关键词分组结果</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default App
