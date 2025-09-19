import '@testing-library/jest-dom'

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
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.CLAUDE_MODEL = 'claude-3-haiku-20240307'
process.env.CLAUDE_MAX_TOKENS = '800'

// Mock global fetch
global.fetch = jest.fn()

// Setup cleanup
afterEach(() => {
  jest.clearAllMocks()
})