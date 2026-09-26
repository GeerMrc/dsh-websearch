'use strict'
/**
 * S35 T0 spike — 进程晚期 DNS 拦截 seam 可行性实证（零外网依赖）
 *
 * 三个问题，一次脚本全部回答：
 *   Q1 晚期 patch require('dns').lookup / dns.promises.lookup 是否影响 global fetch？
 *      （预期：不影响——net.js 已在进程 bootstrap 期捕获模块级 dnsLookup 引用）
 *   Q2 包装 net.Socket.prototype.connect 并按调用注入 options.lookup，
 *      是否能让 global fetch 使用我们指定的解析结果？
 *      （预期：能——net.js 按调用时 options.lookup ?? dnsLookup 取值）
 *   Q3 disposer 还原后原型是否回到原函数？（预期：是）
 *
 * 方法：本地 127.0.0.1 回环 HTTP 服务器承载正例——注入式 lookup 把
 * doh-spike-injected.test 解析到 127.0.0.1，fetch 应拿到 200 "spike-ok"。
 */

const dns = require('dns')
const net = require('net')
const http = require('http')

const ARTIFICIAL_HOST = 'doh-spike-artificial.test'

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' })
  res.end('spike-ok')
})

function fetchErrInfo(e) {
  const cause = e && e.cause
  return cause ? `${cause.code || cause.message}` : `${(e && e.message) || e}`
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port
  console.log(`[env] node ${process.version} | loopback server 127.0.0.1:${port}`)

  // ---- Q1: 晚期 dns.lookup / dns.promises.lookup patch（fetch 之前施加） ----
  let lateDnsPatchHits = 0
  const origLookup = dns.lookup.bind(dns)
  dns.lookup = function latePatchedLookup(hostname, options, callback) {
    lateDnsPatchHits += 1
    console.log(`  [q1] late dns.lookup patch HIT: ${hostname}`)
    return origLookup(hostname, options, callback)
  }
  let promisesPatchApplied = false
  try {
    const origPromises = dns.promises.lookup.bind(dns.promises)
    dns.promises.lookup = async function latePatchedPromises(hostname, options) {
      console.log(`  [q1] late dns.promises patch HIT: ${hostname}`)
      return origPromises(hostname, options)
    }
    promisesPatchApplied = true
  } catch (e) {
    promisesPatchApplied = false
    console.log(`  [q1] dns.promises patch REJECTED: ${e.message}`)
  }
  // 对照组：未注入 seam，直接 fetch 伪域名（预期 ENOTFOUND，且 late patch 不被 fetch 路径调用）
  try {
    const r = await fetch(`http://${ARTIFICIAL_HOST}:${port}/control`)
    console.log(`[q1] control fetch unexpectedly ok: ${r.status}`)
  } catch (e) {
    console.log(`[q1] control fetch err: ${fetchErrInfo(e)} | lateDnsPatchHits=${lateDnsPatchHits}${promisesPatchApplied ? ' (promises patch applied but unused by fetch)' : ''}`)
  }

  // ---- Q2: Socket.prototype.connect 包装 + options.lookup 注入 ----
  let injectedHits = 0
  const origConnect = net.Socket.prototype.connect
  net.Socket.prototype.connect = function spikeConnect(options, ...rest) {
    if (
      options && typeof options === 'object' &&
      options.lookup === undefined &&
      typeof options.host === 'string' &&
      net.isIP(options.host) === 0 &&
      !options.path
    ) {
      options = Object.assign({}, options, {
        lookup(hostname, lookupOptions, callback) {
          injectedHits += 1
          console.log(`  [q2] injected lookup called: ${hostname} opts=${JSON.stringify(lookupOptions)}`)
          if (lookupOptions && lookupOptions.all) {
            callback(null, [{ address: '127.0.0.1', family: 4 }])
          } else {
            callback(null, '127.0.0.1', 4)
          }
        },
      })
    }
    return origConnect.call(this, options, ...rest)
  }
  try {
    const r = await fetch(`http://${ARTIFICIAL_HOST}:${port}/injected`)
    const body = await r.text()
    console.log(`[q2] injected fetch: status=${r.status} body="${body}" injectedHits=${injectedHits}`)
  } catch (e) {
    console.log(`[q2] injected fetch err: ${fetchErrInfo(e)} injectedHits=${injectedHits}`)
  }

  // ---- Q3: disposer 还原 ----
  net.Socket.prototype.connect = origConnect
  console.log(`[q3] prototype restored: ${net.Socket.prototype.connect === origConnect}`)
  try {
    await fetch(`http://${ARTIFICIAL_HOST}:${port}/after-restore`)
    console.log('[q3] after-restore fetch unexpectedly ok')
  } catch (e) {
    console.log(`[q3] after-restore fetch err: ${fetchErrInfo(e)} (expected ENOTFOUND again)`)
  }

  server.close()
})
