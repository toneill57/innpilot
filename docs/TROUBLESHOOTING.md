# InnPilot Troubleshooting Guide

## Table of Contents
- [Environment Issues](#environment-issues)
- [API Errors](#api-errors)
- [Performance Problems](#performance-problems)
- [Database Issues](#database-issues)
- [Deployment Problems](#deployment-problems)
- [Development Issues](#development-issues)
- [Monitoring and Diagnostics](#monitoring-and-diagnostics)

## Environment Issues

### ❌ Environment Variables Not Loading

**Symptoms:**
- `Environment validation failed!`
- `Missing required variables`
- API returning 500 errors

**Solutions:**

1. **Check environment file exists:**
   ```bash
   ls -la .env.local
   ```

2. **Validate environment format:**
   ```bash
   npm run validate-env
   ```

3. **Common formatting issues:**
   ```bash
   # ❌ Wrong - no quotes around values with spaces
   CLAUDE_MODEL=claude 3 haiku

   # ✅ Correct - quotes not needed for single values
   CLAUDE_MODEL=claude-3-haiku-20240307

   # ❌ Wrong - extra spaces
   SUPABASE_URL = https://example.supabase.co

   # ✅ Correct - no spaces around =
   SUPABASE_URL=https://example.supabase.co
   ```

4. **Recreate environment file:**
   ```bash
   cp .env.example .env.local
   # Edit with your actual values
   ```

### ⚠️ API Keys Invalid

**Symptoms:**
- `API key not configured` in status endpoint
- 401/403 errors from external APIs

**Solutions:**

1. **Verify API key formats:**
   ```bash
   # OpenAI should start with sk-proj-
   echo $OPENAI_API_KEY | grep "^sk-proj-"

   # Anthropic should start with sk-ant-
   echo $ANTHROPIC_API_KEY | grep "^sk-ant-"
   ```

2. **Test API keys manually:**
   ```bash
   # Test OpenAI
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models

   # Test Anthropic
   curl -H "x-api-key: $ANTHROPIC_API_KEY" \
        https://api.anthropic.com/v1/messages
   ```

## API Errors

### 🔥 Chat API Timeout

**Symptoms:**
- Response takes >30 seconds
- `504 Gateway Timeout` errors
- Incomplete responses

**Solutions:**

1. **Check system status:**
   ```javascript
   // Primary method
   const status = await fetch('https://innpilot.vercel.app/api/health')
     .then(res => res.json());
   console.log('System status:', status.status);

   // Development only
   const devStatus = await fetch('http://localhost:3000/api/status')
     .then(res => res.json());
   ```

2. **Reduce context chunks:**
   ```json
   {
     "question": "Your question",
     "max_context_chunks": 2
   }
   ```

3. **Monitor response times:**
   ```javascript
   // Primary method
   const start = performance.now();
   const response = await fetch('https://innpilot.vercel.app/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ question: "Simple question" })
   });
   const data = await response.json();
   const duration = performance.now() - start;
   console.log(`Response time: ${duration.toFixed(2)}ms`);
   ```

4. **Clear semantic cache:**
   ```bash
   # Restart the application to clear memory cache
   npm run dev
   ```

### 🚫 File Validation Errors

**Symptoms:**
- `Invalid file type` for .txt files
- `File too large` for small files
- Validation never completes

**Solutions:**

1. **Check file format:**
   ```bash
   file your-file.txt
   # Should show: ASCII text or UTF-8 Unicode text
   ```

2. **Verify file size:**
   ```bash
   ls -lh your-file.txt
   # Should be under 10MB
   ```

3. **Test file content:**
   ```bash
   head -n 5 your-file.txt
   # Should show tab-separated values
   ```

4. **Manual validation test:**
   ```javascript
   // Primary method
   const formData = new FormData();
   formData.append('file', fileInput.files[0]);

   const response = await fetch('https://innpilot.vercel.app/api/validate', {
     method: 'POST',
     body: formData
   });
   const validation = await response.json();
   console.log('Validation result:', validation);
   ```

## Performance Problems

### 🐌 Slow Response Times

**Symptoms:**
- Chat responses taking >5 seconds
- High latency in API calls
- Poor user experience

**Diagnostic Steps:**

1. **Check component performance:**
   ```javascript
   // Primary method
   const start = performance.now();
   const response = await fetch('https://innpilot.vercel.app/api/health');
   const data = await response.json();
   const duration = performance.now() - start;
   console.log('Health check time:', duration, 'ms');
   console.log('Status:', data);
   ```

2. **Monitor individual services:**
   ```javascript
   // Primary method - Check embedding generation time
   const start = performance.now();
   const response = await fetch('https://innpilot.vercel.app/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ question: "test", use_context: false })
   });
   const data = await response.json();
   const duration = performance.now() - start;
   console.log('Service response time:', duration, 'ms');
   ```

3. **Cache hit rates:**
   ```javascript
   // Primary method - Send same question twice and compare times
   const question = "¿Cuáles son los documentos válidos?";

   // First request
   const start1 = performance.now();
   const response1 = await fetch('https://innpilot.vercel.app/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ question })
   });
   const duration1 = performance.now() - start1;

   // Second request (should hit cache)
   const start2 = performance.now();
   const response2 = await fetch('https://innpilot.vercel.app/api/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ question })
   });
   const duration2 = performance.now() - start2;

   console.log('First request:', duration1, 'ms');
   console.log('Second request (cache):', duration2, 'ms');
   console.log('Cache improvement:', ((duration1 - duration2) / duration1 * 100).toFixed(1), '%');
   ```

**Solutions:**

1. **Optimize context chunks:**
   ```env
   # Reduce in .env.local
   CLAUDE_MAX_TOKENS=500
   ```

2. **Regional optimization:**
   - Deploy closer to users
   - Use CDN for static assets
   - Consider Edge Runtime benefits

3. **Cache optimization:**
   - Increase cache TTL
   - Implement Redis cache
   - Preload common queries

### 💾 Memory Issues

**Symptoms:**
- Out of memory errors
- Slow garbage collection
- Application crashes

**Solutions:**

1. **Monitor memory usage:**
   ```bash
   # Node.js memory inspection
   node --inspect src/app.js
   ```

2. **Optimize imports:**
   ```typescript
   // ❌ Don't import entire library
   import * as utils from 'lodash'

   // ✅ Import only what you need
   import { debounce } from 'lodash'
   ```

3. **Clear large objects:**
   ```typescript
   // Clear conversation history periodically
   if (messages.length > 50) {
     setMessages(messages.slice(-20))
   }
   ```

## Database Issues

### 🗄️ Supabase Connection Errors

**Symptoms:**
- `Connection failed` in health check
- Timeout errors from database
- `ETIMEDOUT` or `ECONNREFUSED`

**Diagnostic Steps:**

1. **Test connection directly:**
   ```javascript
   // Primary method
   const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/document_embeddings?select=id&limit=1`, {
     headers: {
       'apikey': process.env.SUPABASE_ANON_KEY,
       'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
     }
   });
   const data = await response.json();
   console.log('Supabase connection test:', data);
   ```

2. **Check Supabase dashboard:**
   - Visit your project dashboard
   - Check if project is paused
   - Verify API key is correct

3. **Network connectivity:**
   ```bash
   # Test DNS resolution
   nslookup $(echo $SUPABASE_URL | sed 's|https://||' | sed 's|/.*||')

   # Test port connectivity
   telnet your-project.supabase.co 443
   ```

**Solutions:**

1. **Refresh connection:**
   ```bash
   # Restart application
   npm run dev
   ```

2. **Update Supabase client:**
   ```bash
   npm update @supabase/supabase-js
   ```

3. **Check firewall/VPN:**
   - Disable VPN temporarily
   - Check corporate firewall settings
   - Verify no proxy interference

### 🔍 Vector Search Issues

**Symptoms:**
- No relevant documents found
- Poor search quality
- `match_documents` function errors

**Solutions:**

1. **Verify embeddings exist:**
   ```sql
   SELECT COUNT(*) FROM document_embeddings;
   ```

2. **Test search manually:**
   ```sql
   SELECT content, similarity
   FROM match_documents('test embedding vector', 0.3, 5);
   ```

3. **Re-populate embeddings:**
   ```bash
   npm run clear-database
   npm run populate-embeddings
   ```

## Deployment Problems

### 🚀 Vercel Deployment Failures

**Symptoms:**
- Build fails on Vercel
- Environment variables not working
- Function timeouts

**Solutions:**

1. **Check build logs:**
   ```bash
   vercel logs [deployment-url]
   ```

2. **Verify environment variables:**
   ```bash
   vercel env ls
   ```

3. **Test build locally:**
   ```bash
   npm run build
   ```

4. **Edge Runtime issues:**
   ```typescript
   // Ensure Edge Runtime compatibility
   export const runtime = 'edge'

   // Avoid Node.js-specific APIs
   // Use Web APIs instead
   ```

### 🌐 Production Environment Issues

**Symptoms:**
- Works locally but fails in production
- Different behavior between environments
- Configuration mismatches

**Solutions:**

1. **Environment parity check:**
   ```bash
   # Compare local vs production
   npm run validate-env
   curl https://your-app.vercel.app/api/status
   ```

2. **Check runtime differences:**
   ```typescript
   // Log environment info
   console.log({
     runtime: process.env.VERCEL ? 'vercel' : 'local',
     nodeEnv: process.env.NODE_ENV,
     region: process.env.VERCEL_REGION
   })
   ```

## Development Issues

### 🛠️ Build Errors

**Common TypeScript errors:**

```bash
# Clear TypeScript cache
rm -rf .next
npx tsc --noEmit

# Fix common issues
npm audit fix
npm update
```

**Module resolution errors:**
```typescript
// Use absolute imports
import { utils } from '@/lib/utils'

// Instead of relative
import { utils } from '../../lib/utils'
```

### 🔧 Hot Reload Issues

**Solutions:**

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check file watchers:**
   ```bash
   # Increase file watcher limit on macOS/Linux
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Restart development server:**
   ```bash
   # Force restart
   pkill -f "next dev"
   npm run dev
   ```

## Monitoring and Diagnostics

### 📊 Health Monitoring

**Automated checks:**
```javascript
// Primary method - Basic health
try {
  const health = await fetch('https://innpilot.vercel.app/api/health');
  if (!health.ok) throw new Error('Health check failed');
  const data = await health.json();
  console.log('Health status:', data.status);
} catch (error) {
  console.error('Health check failed:', error.message);
}

// Detailed status (development)
try {
  const status = await fetch('http://localhost:3000/api/status');
  const data = await status.json();
  console.log('Services:', data.services);
} catch (error) {
  console.error('Status check failed:', error.message);
}
```

**Custom monitoring script:**
```javascript
// monitor.js - Primary monitoring method
async function monitorHealth() {
  while (true) {
    try {
      console.log(`${new Date().toISOString()}: Checking health...`);
      const response = await fetch('https://innpilot.vercel.app/api/health');
      const data = await response.json();
      console.log('Status:', data.status);
    } catch (error) {
      console.error('Health check failed:', error.message);
    }
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
  }
}

monitorHealth();
```

### 🔍 Debug Logging

**Enable verbose logging:**
```env
# In .env.local
DEBUG=innpilot:*
LOG_LEVEL=debug
```

**Custom debug logging:**
```typescript
// Add to API routes
console.log(`[${new Date().toISOString()}] Request:`, {
  method: request.method,
  url: request.url,
  headers: Object.fromEntries(request.headers)
})
```

### 📈 Performance Profiling

**Profile API calls:**
```javascript
// Primary method - Detailed performance profiling
async function profileAPICall(url, options = {}) {
  const start = performance.now();

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    const total = performance.now() - start;

    return {
      success: true,
      status: response.status,
      responseTime: total,
      data: data
    };
  } catch (error) {
    const total = performance.now() - start;
    return {
      success: false,
      error: error.message,
      responseTime: total
    };
  }
}

// Usage example
const result = await profileAPICall('https://innpilot.vercel.app/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: "Test performance" })
});
console.log('Profile result:', result);
```

**React Performance:**
```typescript
import { Profiler } from 'react'

function onRenderCallback(id, phase, actualDuration) {
  console.log('Render:', { id, phase, actualDuration })
}

<Profiler id="ChatAssistant" onRender={onRenderCallback}>
  <ChatAssistant />
</Profiler>
```

## Getting Help

### Before Creating an Issue

1. **Check this troubleshooting guide**
2. **Review logs and error messages**
3. **Test with minimal reproduction case**
4. **Verify environment setup**

### Issue Template

```markdown
## Problem Description
Brief description of the issue

## Environment
- OS: [macOS/Windows/Linux]
- Node.js version: [output of `node --version`]
- npm version: [output of `npm --version`]
- Browser: [if applicable]

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Error Messages
```
Full error messages and stack traces
```

## Additional Context
Screenshots, logs, or other relevant information
```

### Emergency Contact

For critical production issues:
1. Check `/api/status` endpoint
2. Review Vercel deployment logs
3. Check external service status pages
4. Contact system administrator

## Prevention

### Best Practices
- Always run `npm run validate-env` before deployment
- Test in staging environment first
- Monitor health endpoints regularly
- Keep dependencies updated
- Backup configuration and data

### Monitoring Setup
- Set up uptime monitoring
- Configure alert thresholds
- Monitor response times
- Track error rates
- Review logs regularly