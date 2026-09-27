'use strict'
/**
 * S35 T0 spike 第二腿 — dns.lookup seam 的完整正例 + undici 调用形态捕获
 * （零外网依赖：patched lookup 把伪域名指向 127.0.0.1 回环服务器）
 */
const dns = require('dns')
const net = require('net')
const http = require('http')

const ARTIFICIAL_HOST = 'doh-spike-artificial.test'
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' })
  res.end('spike-ok')
})

function errInfo(e) {
  const cause = e && e.cause
  return cause ? `${cause.code || cause.message}` : `${(e && e.message) || e}`
}

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port
  console.log(`[env] node ${process.version} | loopback 127.0.0.1:${port}`)

  // ---- P1: dns.lookup patch 完整正例（返回 127.0.0.1） ----
  const origLookup = dns.lookup.bind(dns)
  const callShapes = []
  dns.lookup = function spikeLookup(hostname, options, callback) {
    let cb = callback
    let opts = options
    if (typeof options === 'function') { cb = options; opts = undefined }
    callShapes.push({ hostname, options: typeof opts === 'object' ? { ...opts } : opts })
    console.log(`  [p1] patched dns.lookup called: ${hostname} opts=${JSON.stringify(opts)}`)
    // 伪域名 → 127.0.0.1；其余透传原函数
    if (hostname === ARTIFICIAL_HOST) {
      if (opts && typeof opts === 'object' && opts.all) {
        cb(null, [{ address: '127.0.0.1', family: 4 }])
      } else if (opts && typeof opts === 'object') {
        cb(null, '127.0.0.1', 4)
      } else {
        cb(null, '127.0.0.1', 4)
      }
      return
    }
    return origLookup(hostname, opts, cb)
  }
  try {
    const r = await fetch(`http://${ARTIFICIAL_HOST}:${port}/positive`)
    const body = await r.text()
    console.log(`[p1] POSITIVE fetch: status=${r.status} body="${body}" — dns.lookup seam 让 fetch 使用注入解析 ✓`)
  } catch (e) {
    console.log(`[p1] POSITIVE fetch FAILED: ${errInfo(e)}`)
  }

  // ---- P2: 还原后再 fetch（预期回 ENOTFOUND） ----
  dns.lookup = origLookup
  console.log(`[p2] dns.lookup restored: ${dns.lookup === origLookup}`)
  try {
    await fetch(`http://${ARTIFICIAL_HOST}:${port}/after-restore`)
    console.log('[p2] after-restore fetch unexpectedly ok')
  } catch (e) {
    console.log(`[p2] after-restore fetch err: ${errInfo(e)} (expected ENOTFOUND)`)
  }
  console.log(`[p2] undici 调用形态记录（${callShapes.length} 次）: ${JSON.stringify(callShapes)}`)

  server.close()
})
