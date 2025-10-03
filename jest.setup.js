import '@testing-library/jest-dom'

// Mock react-markdown to avoid ESM transform issues
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }) {
    return children
  }
})

// Mock jose (JWT library) to avoid ESM transform issues
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token')
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      reservation_id: 'test-reservation-id',
      conversation_id: 'test-conversation-id',
      tenant_id: 'test-tenant',
      guest_name: 'Test Guest'
    }
  }),
  importJWK: jest.fn(),
  createRemoteJWKSet: jest.fn()
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      pathname: '/',
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.OPENAI_API_KEY = 'sk-test-openai-key-1234567890'
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-anthropic-key-1234567890'
process.env.CLAUDE_MODEL = 'claude-3-haiku-20240307'
process.env.CLAUDE_MAX_TOKENS = '800'
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.GUEST_TOKEN_EXPIRY = '7d'

// Polyfill TextEncoder/TextDecoder for Node environment
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill Web APIs for Next.js 15 Edge Runtime
// These are needed for API route tests that use Request/Response

// Basic Headers implementation
if (!global.Headers) {
  global.Headers = class Headers {
    constructor(init) {
      this._headers = new Map()
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this.set(key, value))
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value))
        } else {
          Object.entries(init).forEach(([key, value]) => this.set(key, value))
        }
      }
    }
    append(name, value) {
      const existing = this.get(name)
      this.set(name, existing ? `${existing}, ${value}` : value)
    }
    delete(name) {
      this._headers.delete(name.toLowerCase())
    }
    get(name) {
      return this._headers.get(name.toLowerCase()) || null
    }
    has(name) {
      return this._headers.has(name.toLowerCase())
    }
    set(name, value) {
      this._headers.set(name.toLowerCase(), String(value))
    }
    forEach(callback, thisArg) {
      this._headers.forEach((value, key) => callback.call(thisArg, value, key, this))
    }
    entries() {
      return this._headers.entries()
    }
    keys() {
      return this._headers.keys()
    }
    values() {
      return this._headers.values()
    }
  }
}

// Basic Response implementation
if (!global.Response) {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || ''
      this.headers = new Headers(init.headers)
      this.ok = this.status >= 200 && this.status < 300
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
    clone() {
      return new Response(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      })
    }
    static json(data, init = {}) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'content-type': 'application/json',
          ...init.headers
        }
      })
    }
  }
}

// Basic Request implementation
if (!global.Request) {
  global.Request = class Request {
    constructor(input, init = {}) {
      this._url = typeof input === 'string' ? input : input.url
      this._method = init.method || 'GET'
      this._headers = new Headers(init.headers)
      this._body = init.body || null
      this._bodyInit = init.body
    }
    get url() {
      return this._url
    }
    get method() {
      return this._method
    }
    get headers() {
      return this._headers
    }
    get body() {
      return this._body
    }
    async json() {
      if (!this._bodyInit) return {}
      return typeof this._bodyInit === 'string'
        ? JSON.parse(this._bodyInit)
        : this._bodyInit
    }
    async text() {
      return this._bodyInit ? String(this._bodyInit) : ''
    }
    async formData() {
      // Simple FormData mock
      return this._bodyInit || new FormData()
    }
    clone() {
      return new Request(this._url, {
        method: this._method,
        headers: this._headers,
        body: this._bodyInit
      })
    }
  }
}

// Mock NextRequest (extends Request)
global.NextRequest = class NextRequest extends global.Request {
  constructor(input, init = {}) {
    super(input, init)
    this.nextUrl = new URL(this.url)
    this.cookies = new Map()
    this.geo = {}
  }
}

// Mock NextResponse (extends Response)
global.NextResponse = class NextResponse extends global.Response {
  static json(data, init = {}) {
    const response = new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers
      }
    })
    return response
  }

  static redirect(url, init) {
    return new NextResponse(null, {
      ...init,
      status: 307,
      headers: {
        Location: url,
        ...init?.headers
      }
    })
  }
}

// Polyfill FormData
if (!global.FormData) {
  global.FormData = class FormData {
    constructor() {
      this._data = new Map()
    }
    append(name, value, filename) {
      if (!this._data.has(name)) {
        this._data.set(name, [])
      }
      const entry = typeof value === 'object' && value !== null ? value : { value }
      if (filename) entry.filename = filename
      this._data.get(name).push(entry)
    }
    delete(name) {
      this._data.delete(name)
    }
    get(name) {
      const values = this._data.get(name)
      return values && values.length > 0 ? values[0] : null
    }
    getAll(name) {
      return this._data.get(name) || []
    }
    has(name) {
      return this._data.has(name)
    }
    set(name, value, filename) {
      const entry = typeof value === 'object' && value !== null ? value : { value }
      if (filename) entry.filename = filename
      this._data.set(name, [entry])
    }
    entries() {
      const entries = []
      this._data.forEach((values, key) => {
        values.forEach(value => entries.push([key, value]))
      })
      return entries[Symbol.iterator]()
    }
    keys() {
      return this._data.keys()
    }
    values() {
      const values = []
      this._data.forEach(vals => vals.forEach(v => values.push(v)))
      return values[Symbol.iterator]()
    }
    forEach(callback, thisArg) {
      this._data.forEach((values, key) => {
        values.forEach(value => callback.call(thisArg, value, key, this))
      })
    }
  }
}

// Polyfill Blob
if (!global.Blob) {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this._parts = parts
      this.type = options.type || ''
      this.size = parts.reduce((acc, part) => {
        if (typeof part === 'string') return acc + part.length
        if (part instanceof ArrayBuffer) return acc + part.byteLength
        return acc
      }, 0)
    }
    async text() {
      return this._parts.join('')
    }
    async arrayBuffer() {
      const text = await this.text()
      const encoder = new TextEncoder()
      return encoder.encode(text).buffer
    }
    slice(start, end, contentType) {
      return new Blob(this._parts.slice(start, end), { type: contentType })
    }
  }
}

// Polyfill File
if (!global.File) {
  global.File = class File extends global.Blob {
    constructor(bits, name, options = {}) {
      super(bits, options)
      this.name = name
      this.lastModified = options.lastModified || Date.now()
    }
  }
}

// Mock global fetch
global.fetch = jest.fn()

// Setup cleanup
afterEach(() => {
  jest.clearAllMocks()
})