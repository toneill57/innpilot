'use client'

import { useState, useCallback } from 'react'

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryMultiplier?: number
  shouldRetry?: (error: Error, attempt: number) => boolean
}

interface RetryState {
  isLoading: boolean
  error: Error | null
  data: any
  attemptCount: number
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryMultiplier: 2,
  shouldRetry: (error: Error, attempt: number) => {
    // Retry on network errors or 5xx server errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true
    }
    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return true
    }
    return false
  }
}

export function useRetryFetch(options: RetryOptions = {}) {
  const opts = { ...defaultOptions, ...options }

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    data: null,
    attemptCount: 0
  })

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const fetchWithRetry = useCallback(async (
    url: string,
    fetchOptions?: RequestInit
  ): Promise<any> => {
    console.log('🔄 fetchWithRetry CALLED:', { url, fetchOptions })
    setState(prev => ({ ...prev, isLoading: true, error: null, attemptCount: 0 }))

    for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
      setState(prev => ({ ...prev, attemptCount: attempt }))
      console.log(`🔄 Attempt ${attempt}/${opts.maxRetries + 1} for ${url}`)

      try {
        const response = await fetch(url, fetchOptions)
        console.log(`📡 Response received:`, { status: response.status, ok: response.ok })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
          console.log('❌ HTTP Error:', { status: response.status, errorData })
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('✅ fetchWithRetry SUCCESS:', data)

        setState(prev => ({
          ...prev,
          isLoading: false,
          data,
          error: null
        }))

        return data

      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')

        // Check if we should retry
        const shouldRetry = attempt <= opts.maxRetries && opts.shouldRetry(err, attempt)

        if (shouldRetry) {
          const delay = opts.retryDelay * Math.pow(opts.retryMultiplier, attempt - 1)
          console.warn(`Request failed (attempt ${attempt}/${opts.maxRetries + 1}), retrying in ${delay}ms:`, err.message)
          await sleep(delay)
          continue
        }

        // Final failure
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err,
          data: null
        }))

        throw err
      }
    }
  }, [opts])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      attemptCount: 0
    })
  }, [])

  return {
    ...state,
    fetchWithRetry,
    reset
  }
}

// Specialized hooks for common integration operations
export function useMotoPressFetch() {
  return useRetryFetch({
    maxRetries: 3,
    retryDelay: 1500,
    shouldRetry: (error: Error, attempt: number) => {
      // More aggressive retry for MotoPress API calls
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        return true
      }
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503') || error.message.includes('504')) {
        return true
      }
      // Retry on rate limiting
      if (error.message.includes('429')) {
        return true
      }
      return false
    }
  })
}

export function useIntegrationFetch() {
  return useRetryFetch({
    maxRetries: 2,
    retryDelay: 1000,
    shouldRetry: (error: Error, attempt: number) => {
      // Conservative retry for internal integration APIs
      return error.message.includes('500') || error.message.includes('502')
    }
  })
}