/**
 * 节点信息(适配 Surge/Loon 版 也可在任意平台上使用 HTTP API)
 *
 * Node.js 版 可使用 http_meta_geo.js
 *
 * 查看说明: https://t.me/zhetengsha/1269
 *
 * 欢迎加入 Telegram 群组 https://t.me/zhetengsha
 *
 * 参数
 * - [retries] 重试次数 默认 1
 * - [retry_delay] 重试延时(单位: 毫秒) 默认 1000
 * - [concurrency] 并发数 默认 10
 * - [internal] 使用内部方法获取 IP 信息. 默认 false
 *              (因为懒) 开启后, 将认为远程 API 返回的响应内容为纯文本 IP 地址, 并用于内部方法
 *              目前仅支持 Surge/Loon(build >= 692) 等有 $utils.ipaso,  $utils.ipasn 和 $utils.geoip API 的 App, 数据来自 GeoIP 数据库
 * - [timeout] 请求超时(单位: 毫秒) 默认 5000
 * - [method] 请求方法. 默认 get
 * - [api] 测落地的 API. 默认为 http://ip-api.com/json?lang=zh-CN
 *         当使用 internal 时, 默认为 http://checkip.amazonaws.com
 * - [format] 自定义格式, 从 节点(proxy) 和 落地 API 响应(api)中取数据. 默认为: {{api.country}} {{api.isp}} - {{proxy.name}}
 *            当使用 internal 时, 默认为 {{api.countryCode}} {{api.aso}} - {{proxy.name}}
 * - [regex] 使用正则表达式从落地 API 响应(api)中取数据. 格式为 a:x;b:y 此时将使用正则表达式 x 和 y 来从 api 中取数据, 赋值给 a 和 b. 然后可在 format 中使用 {{api.a}} 和 {{api.b}}
 * - [geo] 在节点上附加 _geo 字段(API 响应数据), 默认不附加
 * - [incompatible] 在节点上附加 _incompatible 字段来标记当前客户端不兼容该协议, 默认不附加
 * - [remove_incompatible] 移除当前客户端不兼容的协议. 默认不移除.
 * - [remove_failed] 移除失败的节点. 默认不移除.
 * - [surge_http_api] 使用另一台设备上的 HTTP API. 设置后, 将不检测当前运行客户端, 并使用另一台设备上的 HTTP API 执行请求. 默认不使用. 例: 192.168.31.5:6171
 * - [surge_http_api_protocol] HTTP API 的 协议. 默认 http
 * - [surge_http_api_key] HTTP API 的 密码
 * - [cache] 使用缓存. 默认不使用缓存
 * - [disable_failed_cache/ignore_failed_error] 禁用失败缓存. 即不缓存失败结果
 * - [youtube/netflix/disney/dazn/paramount/discovery/chatgpt] 媒体解锁检测. 设为 true 启用. 对每个节点发起 HTTP 请求检测对应平台解锁状态, 通过则追加后缀标签
 * - [media_format] 自定义媒体检测后缀格式, 默认只显示通过的平台标签. 可用变量: {{yt}} {{nf}} {{dp}} {{dz}} {{pm}} {{dc}} {{gpt}}, 值为 ✓ (通过) 或 ✗ (失败) 或 ◐ (部分)
 * - [media_timeout] 媒体检测单独超时(毫秒). 默认取 timeout 值. 设为较小值可不拖慢整体检测
 * 关于缓存时长
 * 当使用相关脚本时, 若在对应的脚本中使用参数(⚠ 别忘了这个, 一般为 cache, 值设为 true 即可)开启缓存
 * 可在前端(>=2.16.0) 配置各项缓存的默认时长
 * 持久化缓存数据在 JSON 里
 * 可以在脚本的前面添加一个脚本操作, 实现保留 1 小时的缓存. 这样比较灵活
 * async function operator() {
 *     scriptResourceCache._cleanup(undefined, 1 * 3600 * 1000);
 * }
 */

async function operator(proxies = [], targetPlatform, context) {
  const $ = $substore
  const { isLoon, isSurge, isNode } = $.env
  const internal = $arguments.internal
  const regex = $arguments.regex
  let format = $arguments.format || '{{api.country}} {{api.isp}} - {{proxy.name}}'
  let url = $arguments.api || 'http://ip-api.com/json?lang=zh-CN'
  if (internal) {
    // if (isSurge) {
    //   //
    // } else if (isLoon) {
    //   const build = $loon.match(/\((\d+)\)$/)?.[1]
    //   if (build < 692) throw new Error('Loon 版本过低, 请升级到 build 692 及以上版本')
    // } else {
    //   throw new Error('仅 Surge/Loon 支持使用内部方法获取 IP 信息')
    // }
    if (typeof $utils === 'undefined' || typeof $utils.geoip === 'undefined' || typeof $utils.ipaso === 'undefined') {
      $.error(`目前仅支持 Surge/Loon(build >= 692) 等有 $utils.ipaso 和 $utils.geoip API 的 App`)
      throw new Error('不支持使用内部方法获取 IP 信息, 请查看日志')
    }
    format = $arguments.format || `{{api.countryCode}} {{api.aso}} - {{proxy.name}}`
    url = $arguments.api || 'http://checkip.amazonaws.com'
  }
  const surge_http_api = $arguments.surge_http_api
  const surge_http_api_protocol = $arguments.surge_http_api_protocol || 'http'
  const surge_http_api_key = $arguments.surge_http_api_key
  const surge_http_api_enabled = surge_http_api
  if (!surge_http_api_enabled && !isLoon && !isSurge)
    throw new Error('请使用 Loon, Surge(ability=http-client-policy) 或 配置 HTTP API')

  const disableFailedCache = $arguments.disable_failed_cache || $arguments.ignore_failed_error
  const remove_failed = $arguments.remove_failed
  const remove_incompatible = $arguments.remove_incompatible
  const incompatibleEnabled = $arguments.incompatible
  const geoEnabled = $arguments.geo
  const cacheEnabled = $arguments.cache
  const cache = scriptResourceCache

  const method = $arguments.method || 'get'

  const target = isLoon ? 'Loon' : isSurge ? 'Surge' : undefined
  const concurrency = parseInt($arguments.concurrency || 10) // 一组并发数

  // 媒体解锁检测配置
  const MEDIA_PLATFORMS = [
    { key: 'youtube',   tag: 'YT'  },
    { key: 'netflix',   tag: 'NF'  },
    { key: 'disney',    tag: 'D+'  },
    { key: 'dazn',      tag: 'DZ'  },
    { key: 'paramount', tag: 'PM'  },
    { key: 'discovery', tag: 'DC'  },
    { key: 'chatgpt',   tag: 'GPT' },
  ]
  const enabledMediaChecks = MEDIA_PLATFORMS.filter(p => $arguments[p.key] === 'true')
  const mediaFormat = $arguments.media_format
  const mediaTimeout = parseFloat($arguments.media_timeout || $arguments.timeout || 5000)

  // 媒体解锁检测 - 常量 (需在 executeAsyncTasks 前初始化)
  const MEDIA_RESULT_SYMBOLS = { ok: '✓', partial: '◐', blocked: '✗', error: '?' }
  const MEDIA_RESULT_TAGS = {
    youtube:   { ok: 'YT', partial: '', blocked: '', error: '' },
    netflix:   { ok: 'NF', partial: 'NF◐', blocked: '', error: '' },
    disney:    { ok: 'D+', partial: 'D+⚠', blocked: '', error: '' },
    dazn:      { ok: 'DZ', partial: '', blocked: '', error: '' },
    paramount: { ok: 'PM', partial: '', blocked: '', error: '' },
    discovery: { ok: 'DC', partial: '', blocked: '', error: '' },
    chatgpt:   { ok: 'GPT', partial: '', blocked: '', error: '' },
  }
  const mediaCheckers = {
    youtube: checkYoutube,
    netflix: checkNetflix,
    disney: checkDisney,
    dazn: checkDazn,
    paramount: checkParamount,
    discovery: checkDiscovery,
    chatgpt: checkChatgpt,
  }

  await executeAsyncTasks(
    proxies.map(proxy => () => check(proxy)),
    { concurrency }
  )

  // const batches = []
  // for (let i = 0; i < proxies.length; i += concurrency) {
  //   const batch = proxies.slice(i, i + concurrency)
  //   batches.push(batch)
  // }

  // for (const batch of batches) {
  //   await Promise.all(batch.map(check))
  // }

  if (remove_incompatible || remove_failed) {
    proxies = proxies.filter(p => {
      if (remove_incompatible && p._incompatible) {
        return false
      } else if (remove_failed && !p._geo) {
        return !remove_incompatible && p._incompatible
      }
      return true
    })
  }

  if (!geoEnabled || !incompatibleEnabled) {
    proxies = proxies.map(p => {
      if (!geoEnabled) {
        delete p._geo
      }
      if (!incompatibleEnabled) {
        delete p._incompatible
      }
      return p
    })
  }

  return proxies

  async function check(proxy) {
    // $.info(`[${proxy.name}] 检测`)
    // $.info(`检测 ${JSON.stringify(proxy, null, 2)}`)
    const id = cacheEnabled
      ? `geo:${url}:${format}:${regex}:${internal}:${JSON.stringify(
          Object.fromEntries(Object.entries(proxy).filter(([key]) => !/^(collectionName|subName|id|_.*)$/i.test(key)))
        )}`
      : undefined
    // $.info(`检测 ${id}`)
    let mediaCheckPromise = Promise.resolve('')
    try {
      const node = ProxyUtils.produce([proxy], surge_http_api_enabled ? 'Surge' : target)
      if (node) {
        // 媒体解锁检测 - 启动异步任务，与 geo 请求并行
        mediaCheckPromise = enabledMediaChecks.length > 0 ? runMediaChecks(node) : Promise.resolve('')

        const cached = cache.get(id)
        if (cacheEnabled && cached) {
          if (cached.api) {
            $.info(`[${proxy.name}] 使用成功缓存`)
            $.log(`[${proxy.name}] api: ${JSON.stringify(cached.api, null, 2)}`)
            proxy.name = formatter({ proxy, api: cached.api, format, regex })
            const mediaSuffix = await mediaCheckPromise
            if (mediaSuffix) proxy.name += ` ${mediaSuffix}`
            proxy._geo = cached.api
            return
          } else {
            if (disableFailedCache) {
              $.info(`[${proxy.name}] 不使用失败缓存`)
            } else {
              $.info(`[${proxy.name}] 使用失败缓存`)
              return
            }
          }
        }
        // 请求
        const startedAt = Date.now()
        const res = await http({
          method,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
          },
          url,
          'policy-descriptor': node,
          node,
        })
        let api = String(lodash_get(res, 'body'))
        const status = parseInt(res.status || res.statusCode || 200)
        let latency = ''
        latency = `${Date.now() - startedAt}`
        $.info(`[${proxy.name}] status: ${status}, latency: ${latency}`)
        if (internal) {
          const ip = api.trim()
          api = {
            countryCode: $utils.geoip(ip) || '',
            aso: $utils.ipaso(ip) || '',
            asn: $utils.ipasn(ip) || '',
          }
        } else {
          try {
            api = JSON.parse(api)
          } catch (e) {}
        }

        $.log(`[${proxy.name}] api: ${JSON.stringify(api, null, 2)}`)
        if (status == 200) {
          proxy.name = formatter({ proxy, api, format, regex })
          const mediaSuffix = await mediaCheckPromise
          if (mediaSuffix) proxy.name += ` ${mediaSuffix}`
          proxy._geo = api
          if (cacheEnabled) {
            $.info(`[${proxy.name}] 设置成功缓存`)
            cache.set(id, { api })
          }
        } else {
          if (cacheEnabled) {
            $.info(`[${proxy.name}] 设置失败缓存`)
            cache.set(id, {})
          }
        }
      } else {
        proxy._incompatible = true
      }
    } catch (e) {
      $.error(`[${proxy.name}] ${e.message ?? e}`)
      const mediaSuffix = await mediaCheckPromise
      if (mediaSuffix) proxy.name += ` ${mediaSuffix}`
      if (cacheEnabled) {
        $.info(`[${proxy.name}] 设置失败缓存`)
        cache.set(id, {})
      }
    }
  }
  // 请求
  async function http(opt = {}) {
    const METHOD = opt.method || 'get'
    const TIMEOUT = parseFloat(opt.timeout || $arguments.timeout || 5000)
    const RETRIES = parseFloat(opt.retries ?? $arguments.retries ?? 1)
    const RETRY_DELAY = parseFloat(opt.retry_delay ?? $arguments.retry_delay ?? 1000)

    let count = 0
    const fn = async () => {
      try {
        if (surge_http_api_enabled) {
          const res = await $.http.post({
            url: `${surge_http_api_protocol}://${surge_http_api}/v1/scripting/evaluate`,
            timeout: TIMEOUT,
            headers: { 'x-key': surge_http_api_key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              script_text: `$httpClient.get(${JSON.stringify({
                ...opt,
                timeout: TIMEOUT / 1000,
              })}, (error, response, data) => {  $done({ error, response, data }) }) `,
              mock_type: 'cron',
              timeout: TIMEOUT / 1000,
            }),
          })
          let body = String(lodash_get(res, 'body'))
          try {
            body = JSON.parse(body)
          } catch (e) {}
          // $.info(JSON.stringify(body, null, 2))
          const error = lodash_get(body, 'result.error')
          if (error) throw new Error(error)
          let data = String(lodash_get(body, 'result.data'))
          let response = String(lodash_get(body, 'result.response'))
          // try {
          //   data = JSON.parse(data)
          // } catch (e) {}
          // $.info(JSON.stringify(data, null, 2))
          return { ...response, body: data }
        } else {
          return await $.http[METHOD]({ ...opt, timeout: TIMEOUT })
        }
      } catch (e) {
        // $.error(e)
        if (count < RETRIES) {
          count++
          const delay = RETRY_DELAY * count
          // $.info(`第 ${count} 次请求失败: ${e.message || e}, 等待 ${delay / 1000}s 后重试`)
          await $.wait(delay)
          return await fn()
        } else {
          throw e
        }
      }
    }
    return await fn()
  }
  function lodash_get(source, path, defaultValue = undefined) {
    const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.')
    let result = source
    for (const p of paths) {
      result = Object(result)[p]
      if (result === undefined) {
        return defaultValue
      }
    }
    return result
  }
  function formatter({ proxy = {}, api = {}, format = '', regex = '' }) {
    if (regex) {
      const regexPairs = regex.split(/\s*;\s*/g).filter(Boolean)
      const extracted = {}
      for (const pair of regexPairs) {
        const [key, pattern] = pair.split(/\s*:\s*/g).map(s => s.trim())
        if (key && pattern) {
          try {
            const reg = new RegExp(pattern)
            extracted[key] = (typeof api === 'string' ? api : JSON.stringify(api)).match(reg)?.[1]?.trim()
          } catch (e) {
            $.error(`正则表达式解析错误: ${e.message}`)
          }
        }
      }
      api = { ...api, ...extracted }
    }
    let f = format.replace(/\{\{(.*?)\}\}/g, '${$1}')
    return eval(`\`${f}\``)
  }
  function executeAsyncTasks(tasks, { wrap, result, concurrency = 1 } = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        let running = 0
        const results = []

        let index = 0

        function executeNextTask() {
          while (index < tasks.length && running < concurrency) {
            const taskIndex = index++
            const currentTask = tasks[taskIndex]
            running++

            currentTask()
              .then(data => {
                if (result) {
                  results[taskIndex] = wrap ? { data } : data
                }
              })
              .catch(error => {
                if (result) {
                  results[taskIndex] = wrap ? { error } : error
                }
              })
              .finally(() => {
                running--
                executeNextTask()
              })
          }

          if (running === 0) {
            return resolve(result ? results : undefined)
          }
        }

        await executeNextTask()
      } catch (e) {
        reject(e)
      }
    })
  }

  // ---- 媒体解锁检测函数 ----
  async function runMediaChecks(node) {
    const results = {}
    const checks = enabledMediaChecks.map(async (platform) => {
      try {
        results[platform.key] = await mediaCheckers[platform.key](node)
      } catch (e) {
        results[platform.key] = 'error'
      }
    })
    await Promise.allSettled(checks)

    if (mediaFormat) {
      const vars = {}
      for (const p of enabledMediaChecks) {
        vars[p.key === 'youtube' ? 'yt' : p.key === 'netflix' ? 'nf' : p.key === 'disney' ? 'dp' : p.key === 'dazn' ? 'dz' : p.key === 'paramount' ? 'pm' : p.key === 'discovery' ? 'dc' : 'gpt'] =
          MEDIA_RESULT_SYMBOLS[results[p.key]] || '?'
      }
      let f = mediaFormat.replace(/\{\{(.*?)\}\}/g, '${$1}')
      try {
        return eval(`\`${f}\``)
      } catch (e) {
        return ''
      }
    }

    const tags = enabledMediaChecks
      .map(p => MEDIA_RESULT_TAGS[p.key][results[p.key]] || '')
      .filter(Boolean)
    return tags.length > 0 ? `[${tags.join('][')}]` : ''
  }

  async function checkYoutube(node) {
    try {
      const res = await http({
        url: 'https://www.youtube.com/premium',
        timeout: mediaTimeout,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36' },
        'policy-descriptor': node,
        node,
      })
      const body = String(lodash_get(res, 'body') || '')
      if (body.includes('Premium is not available in your country')) return 'blocked'
      return body.includes('www.google.cn') ? 'blocked' : 'ok'
    } catch (e) {
      return 'error'
    }
  }

  async function checkNetflix(node) {
    try {
      const res = await http({
        url: 'https://www.netflix.com/title/81280792',
        timeout: mediaTimeout,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15' },
        'policy-descriptor': node,
        node,
      })
      const status = parseInt(res.status || res.statusCode || 0)
      if (status === 403) return 'blocked'
      if (status === 404) return 'partial'
      if (status === 200) return 'ok'
      return 'error'
    } catch (e) {
      return 'error'
    }
  }

  async function checkDisney(node) {
    try {
      const res = await http({
        method: 'post',
        url: 'https://disney.api.edge.bamgrid.com/graph/v1/device/graphql',
        timeout: mediaTimeout,
        headers: {
          'Accept-Language': 'en',
          'Authorization': 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
        },
        body: JSON.stringify({
          query: 'mutation registerDevice($input: RegisterDeviceInput!) { registerDevice(registerDevice: $input) { grant { grantType assertion } } }',
          variables: { input: { applicationRuntime: 'chrome', attributes: { browserName: 'chrome', browserVersion: '94.0.4606', manufacturer: 'microsoft', model: null, operatingSystem: 'windows', operatingSystemVersion: '10.0', osDeviceIds: [] }, deviceFamily: 'browser', deviceLanguage: 'en', deviceProfile: 'windows' } },
        }),
        'policy-descriptor': node,
        node,
      })
      const body = String(lodash_get(res, 'body') || '')
      let data
      try { data = JSON.parse(body) } catch (e) { return 'error' }
      const session = data?.extensions?.sdk?.session
      if (!session) return 'blocked'
      return session.inSupportedLocation === false ? 'partial' : 'ok'
    } catch (e) {
      return 'error'
    }
  }

  async function checkDazn(node) {
    try {
      const res = await http({
        method: 'post',
        url: 'https://startup.core.indazn.com/misl/v5/Startup',
        timeout: mediaTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
        },
        body: JSON.stringify({ LandingPageKey: 'generic', Platform: 'web', PlatformAttributes: {}, Manufacturer: '', PromoCode: '', Version: '2' }),
        'policy-descriptor': node,
        node,
      })
      const body = String(lodash_get(res, 'body') || '')
      if (body.includes('"GeolocatedCountry"')) return 'ok'
      return 'blocked'
    } catch (e) {
      return 'error'
    }
  }

  async function checkParamount(node) {
    try {
      const res = await http({
        url: 'https://www.paramountplus.com/',
        timeout: mediaTimeout,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36' },
        'policy-descriptor': node,
        node,
      })
      const status = parseInt(res.status || res.statusCode || 0)
      return status === 200 ? 'ok' : status === 302 ? 'blocked' : 'error'
    } catch (e) {
      return 'error'
    }
  }

  async function checkDiscovery(node) {
    try {
      const tokenRes = await http({
        url: 'https://us1-prod-direct.discoveryplus.com/token?deviceId=d1a4a5d25212400d1e6985984604d740&realm=go&shortlived=true',
        timeout: mediaTimeout,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36' },
        'policy-descriptor': node,
        node,
      })
      const tokenBody = String(lodash_get(tokenRes, 'body') || '')
      let tokenData
      try { tokenData = JSON.parse(tokenBody) } catch (e) { return 'error' }
      const token = tokenData?.data?.attributes?.token
      if (!token) return 'error'

      const userRes = await http({
        url: 'https://us1-prod-direct.discoveryplus.com/users/me',
        timeout: mediaTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
          'Cookie': `st=${token}`,
        },
        'policy-descriptor': node,
        node,
      })
      const userBody = String(lodash_get(userRes, 'body') || '')
      let userData
      try { userData = JSON.parse(userBody) } catch (e) { return 'error' }
      const location = userData?.data?.attributes?.currentLocationTerritory
      return location === 'us' ? 'ok' : 'blocked'
    } catch (e) {
      return 'error'
    }
  }

  async function checkChatgpt(node) {
    try {
      const res = await http({
        url: 'https://chat.openai.com/',
        timeout: mediaTimeout,
        'auto-redirect': false,
        'policy-descriptor': node,
        node,
      })
      const respStr = JSON.stringify(res)
      if (respStr.includes('text/plain')) return 'blocked'

      const regionRes = await http({
        url: 'https://chat.openai.com/cdn-cgi/trace',
        timeout: mediaTimeout,
        'policy-descriptor': node,
        node,
      })
      const traceBody = String(lodash_get(regionRes, 'body') || '')
      const match = traceBody.match(/loc=([A-Z]{2})/)
      if (!match) return 'error'

      const SUPPORTED = ['T1','XX','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BD','BB','BE','BZ','BJ','BT','BA','BW','BR','BG','BF','CV','CA','CL','CO','KM','CR','HR','CY','DK','DJ','DM','DO','EC','SV','EE','FJ','FI','FR','GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IQ','IE','IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LV','LB','LS','LR','LI','LT','LU','MG','MW','MY','MV','ML','MT','MH','MR','MU','MX','MC','MN','ME','MA','MZ','MM','NA','NR','NP','NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PE','PH','PL','PT','QA','RO','RW','KN','LC','VC','WS','SM','ST','SN','RS','SC','SL','SG','SK','SI','SB','ZA','ES','LK','SR','SE','CH','TH','TG','TO','TT','TN','TR','TV','UG','AE','US','UY','VU','ZM','BO','BN','CG','CZ','VA','FM','MD','PS','KR','TW','TZ','TL','GB']
      return SUPPORTED.includes(match[1]) ? 'ok' : 'blocked'
    } catch (e) {
      return 'error'
    }
  }
}