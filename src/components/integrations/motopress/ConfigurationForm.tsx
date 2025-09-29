'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2, Settings } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ConfigurationFormProps {
  tenantId: string
  onConfigured: () => void
  onCancel: () => void
}

interface TestResult {
  connected: boolean
  message: string
  accommodations_count?: number
  error?: string
}

export function ConfigurationForm({ tenantId, onConfigured, onCancel }: ConfigurationFormProps) {
  const [formData, setFormData] = useState({
    api_key: '',
    site_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadExistingConfig()
  }, [tenantId])

  const loadExistingConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/integrations/motopress/configure?tenant_id=${tenantId}`)
      const data = await response.json()

      if (data.exists && data.config) {
        // Note: We don't load sensitive data for security
        setFormData(prev => ({
          ...prev,
          site_url: data.config.site_url || ''
        }))
      }
    } catch (error) {
      console.error('Failed to load existing configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTestResult(null)
    setError('')
  }

  const testConnection = async () => {
    if (!formData.api_key || !formData.site_url) {
      setError('Please provide both API key and site URL')
      return
    }

    try {
      setTesting(true)
      setError('')

      const response = await fetch('/api/integrations/motopress/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: formData.api_key,
          site_url: formData.site_url
        })
      })

      const result = await response.json()
      setTestResult(result)

      if (!result.connected) {
        setError(result.error || 'Connection test failed')
      }

    } catch (error) {
      console.error('Connection test failed:', error)
      setError('Failed to test connection')
      setTestResult({ connected: false, message: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  const saveConfiguration = async () => {
    if (!testResult?.connected) {
      setError('Please test the connection first')
      return
    }

    try {
      setSaving(true)
      setError('')

      const response = await fetch('/api/integrations/motopress/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          api_key: formData.api_key,
          site_url: formData.site_url,
          is_active: true
        })
      })

      const result = await response.json()

      if (result.success) {
        onConfigured()
      } else {
        setError(result.error || 'Failed to save configuration')
      }

    } catch (error) {
      console.error('Failed to save configuration:', error)
      setError('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading configuration...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configure MotoPress Integration
        </CardTitle>
        <CardDescription>
          Enter your MotoPress Hotel Booking API credentials to enable data synchronization
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site_url">WordPress Site URL</Label>
            <Input
              id="site_url"
              type="url"
              placeholder="https://your-site.com"
              value={formData.site_url}
              onChange={(e) => handleInputChange('site_url', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your WordPress site URL where MotoPress Hotel Booking is installed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">Consumer Key</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="ck_..."
              value={formData.api_key}
              onChange={(e) => handleInputChange('api_key', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Consumer Key from WooCommerce REST API settings
            </p>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.connected ? "default" : "destructive"}>
            {testResult.connected ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {testResult.message}
              {testResult.accommodations_count && (
                <span className="block mt-1">
                  Found {testResult.accommodations_count} accommodations available for import
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={testing || !formData.api_key || !formData.site_url}
            className="flex items-center gap-1"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>

          <Button
            onClick={saveConfiguration}
            disabled={saving || !testResult?.connected}
            className="flex items-center gap-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>

          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {/* Help Section */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">How to get your API credentials:</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Go to your WordPress admin dashboard</li>
            <li>Navigate to WooCommerce → Settings → Advanced → REST API</li>
            <li>Click "Add key" to create new API credentials</li>
            <li>Set permissions to "Read" and copy the Consumer Key</li>
            <li>Use the Consumer Key as the API Key above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}