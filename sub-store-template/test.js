const fs = require('fs')
const path = require('path')

// Mock Sub-Store environment
const $substore = {
  env: { isLoon: true, isSurge: false, isNode: true },
  http: {
    get: async (opt) => {
      console.log(`  [HTTP GET] ${opt.url}`)
      if (opt['policy-descriptor']) {
        console.log(`  [通过节点路由] tag: ${opt.node?.tag || 'N/A'}`)
      }
      return {
        status: 200,
        body: JSON.stringify({ country: 'Japan', isp: 'NTT', countryCode: 'JP' }),
      }
    },
    post: async (opt) => {
      console.log(`  [HTTP POST] ${opt.url}`)
      return { status: 200, body: '{}', headers: {} }
    },
  },
  info: (msg) => console.log(`  [INFO] ${msg}`),
  error: (msg) => console.error(`  [ERROR] ${msg}`),
  log: (msg) => console.log(`  [LOG] ${msg}`),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
}

const scriptResourceCache = {
  _data: {},
  get(id) { return this._data[id] },
  set(id, val) { this._data[id] = val },
}

// Mock proxy
const mockProxies = [
  { name: '🇺🇸US01 / 0.5x', type: 'vless', server: 'direct-us-rs-01.inetsnode.de', port: 36699 },
  { name: '🇺🇸US06🌟', type: 'vless', server: 'direct-us-dmit-01.inetsnode.de', port: 36699 },
]

// Mock ProxyUtils
global.ProxyUtils = {
  produce(proxies, target) {
    const p = proxies[0]
    return { tag: p.name, type: p.type, server: p.server, port: p.port }
  },
}
global.$utils = undefined
global.$substore = $substore
global.$arguments = { youtube: 'true', netflix: 'true', timeout: '5000', retries: '1' }
global.scriptResourceCache = scriptResourceCache

async function main() {
  console.log('=== 测试 geo-media-check.js ===\n')

  // Check syntax
  const code = fs.readFileSync(path.join(__dirname, 'geo-media-check.js'), 'utf8')
  try {
    new Function(code)
    console.log('✓ 语法检查通过\n')
  } catch (e) {
    console.error('✗ 语法错误:', e.message)
    process.exit(1)
  }

  // Run the operator
  try {
    // We need to evaluate the script to get operator()
    const wrappedCode = `
      ${code}
      return operator
    `
    const getOperator = new Function(wrappedCode)
    const operator = getOperator()

    console.log(`测试 ${mockProxies.length} 个节点 (youtube=true, netflix=true)`)
    console.log('正在执行...\n')

    const result = await operator(mockProxies, 'Surge', {})
    console.log('\n=== 结果 ===')
    result.forEach(p => {
      console.log(`  ${p.name}`)
      if (p._geo) console.log(`    _geo: ${JSON.stringify(p._geo)}`)
    })

    console.log('\n✓ 脚本执行成功，未崩溃')
    console.log('注意: 本地测试使用模拟 HTTP 请求。实际结果需在 Loon/Sub-Store 中验证。')
  } catch (e) {
    console.error(`\n✗ 执行失败: ${e.message}`)
    console.error(e.stack)
    process.exit(1)
  }
}

main()
