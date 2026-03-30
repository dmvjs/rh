import { Hono } from 'hono'
import { authenticate } from '../middleware/auth.js'

const router = new Hono()

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

router.post('/presign', authenticate, async (c) => {
  const { contentType } = await c.req.json().catch(() => ({}))
  if (!ALLOWED.has(contentType)) return c.json({ error: 'Allowed types: jpeg, png, webp' }, 400)

  const { id } = c.get('user')
  const key = `listings/${id}/${crypto.randomUUID()}`
  const url = await presignS3Put({
    bucket:          c.env.S3_BUCKET,
    key,
    contentType,
    region:          c.env.AWS_REGION ?? 'us-east-1',
    accessKeyId:     c.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: c.env.AWS_SECRET_ACCESS_KEY,
  })

  return c.json({ url, key })
})

// Minimal S3 presigned PUT — Web Crypto only, no SDK needed
async function presignS3Put({ bucket, key, contentType, region, accessKeyId, secretAccessKey, expires = 300 }) {
  const now   = new Date()
  const date  = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const day   = date.slice(0, 8)
  const host  = `${bucket}.s3.${region}.amazonaws.com`
  const scope = `${day}/${region}/s3/aws4_request`

  const params = new URLSearchParams({
    'X-Amz-Algorithm':     'AWS4-HMAC-SHA256',
    'X-Amz-Credential':    `${accessKeyId}/${scope}`,
    'X-Amz-Date':          date,
    'X-Amz-Expires':       String(expires),
    'X-Amz-SignedHeaders': 'content-type;host',
  })

  const canonical = ['PUT', `/${key}`, params.toString(), `content-type:${contentType}\nhost:${host}\n`, 'content-type;host', 'UNSIGNED-PAYLOAD'].join('\n')
  const sts       = ['AWS4-HMAC-SHA256', date, scope, await sha256(canonical)].join('\n')
  const sigKey    = await signingKey(secretAccessKey, day, region)
  params.set('X-Amz-Signature', await hmacHex(sigKey, sts))

  return `https://${host}/${key}?${params}`
}

const enc       = (s)   => new TextEncoder().encode(s)
const hex       = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
const sha256    = async (s) => hex(await crypto.subtle.digest('SHA-256', enc(s)))
const hmac      = async (key, msg) => {
  const k = await crypto.subtle.importKey('raw', typeof key === 'string' ? enc(key) : key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', k, enc(msg))
}
const hmacHex   = async (key, msg) => hex(await hmac(key, msg))
const signingKey = async (secret, day, region) => {
  const dk = await hmac('AWS4' + secret, day)
  const rk = await hmac(dk, region)
  const sk = await hmac(rk, 's3')
  return hmac(sk, 'aws4_request')
}

export default router
