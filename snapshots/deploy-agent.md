---
title: "MUVA Chat Deploy Agent - CI/CD & VPS Deployment Snapshot"
agent: deploy-agent
last_updated: "2025-10-09"
status: PRODUCTION_READY
version: "2.0-COMPREHENSIVE"
infrastructure: VPS_HOSTINGER
---

# 🚀 Deploy Agent - CI/CD & VPS Deployment Snapshot

**Agent**: @deploy-agent
**Última actualización**: 9 Octubre 2025
**Estado**: PRODUCCIÓN - VPS Hostinger (195.200.6.216)
**Infraestructura**: ✅ VPS (ACTUAL) | ❌ Vercel (DEPRECADO Oct 4, 2025)

---

## 🎯 CURRENT PROJECT: MUVA Chat → MUVA Chat Rebrand (2025-10-11)

**Status:** 📋 Planning Complete - Ready for Execution
**Documentation:** `docs/projects/innpilot-to-muva-rebrand/` (plan.md, TODO.md, workflow.md)
**Last Updated:** October 11, 2025
**Duration:** ~9 hours total (5 FASES)

### My Responsibilities: FASE 3 + FASE 5 (~2.5 hours)

**FASE 3: VPS Infrastructure (2 hours)**

**FASE 3.1: Rename PM2 process (30min)**
- SSH a VPS: `ssh oneill@muva.chat`
- Stop process: `pm2 stop muva-chat`
- Delete process: `pm2 delete muva-chat`
- Start new: `pm2 start npm --name "muva-chat" -- start`
- Save: `pm2 save`
- Test: `pm2 status` debe mostrar "muva-chat" online
- Agent: **@agent-deploy-agent**

**FASE 3.2: Actualizar Nginx config (30min)**
- Opción A (rename): `sudo mv /etc/nginx/sites-available/innpilot.conf /etc/nginx/sites-available/muva.conf`
- Opción B (keep): Solo actualizar comentarios internos
- Actualizar comentarios: "MUVA Chat subdomain routing" → "MUVA Chat subdomain routing"
- Test config: `sudo nginx -t`
- Reload: `sudo systemctl reload nginx`
- Test: `https://muva.chat` carga correctamente
- Agent: **@agent-deploy-agent**

**FASE 3.3: Verificar deployment (30min)**
- Verificar: https://muva.chat/api/health
- Verificar: https://simmerdown.muva.chat/chat
- Verificar: PM2 logs sin errores
- Verificar: Nginx logs sin errores
- Test: Todos los endpoints responden 200 OK
- Agent: **@agent-deploy-agent**

**FASE 3.4: Actualizar deployment scripts (20min)**
- Buscar scripts con "innpilot" en nombres o comentarios
- Actualizar references a PM2 process name
- Actualizar docs de deployment
- Files: `scripts/*`, `docs/deployment/*`
- Agent: **@agent-deploy-agent**

**FASE 5.3: Git commit + tag (15min)**
- git status (review changes)
- git add .
- git commit: "feat(rebrand): Complete MUVA Chat → MUVA Chat rebranding"
- Incluir BREAKING CHANGE note en commit body
- git tag -a v2.0-muva-rebrand -m "Complete rebranding to MUVA Chat"
- git push origin dev
- git push origin --tags
- Test: `git log` muestra commit, `git tag` muestra v2.0-muva-rebrand
- Agent: **@agent-deploy-agent**

### Planning Files

**Read These First:**
- `docs/projects/innpilot-to-muva-rebrand/plan.md` - Complete rebranding strategy (450+ lines)
- `docs/projects/innpilot-to-muva-rebrand/TODO.md` - 18 tasks across 5 FASES
- `docs/projects/innpilot-to-muva-rebrand/innpilot-to-muva-rebrand-prompt-workflow.md` - Copy-paste prompts

### Key Context

**Brand Evolution:**
- MUVA Chat (SIRE-focused) → MUVA Chat (multi-tenant + tourism + SIRE premium)
- SIRE: NOT deprecated - es gancho comercial premium
- Package name: "muva-chat" (NOT "muva-platform")
- PM2 process: "innpilot" → "muva-chat"

**Scope:**
- PM2 process rename (infrastructure change)
- Nginx config update (comments + optional rename)
- Deployment scripts update
- Git workflow (commit + tag)

### Deployment Commands

**FASE 3.1: PM2 Rename**
```bash
ssh oneill@muva.chat
pm2 stop muva-chat
pm2 delete muva-chat
pm2 start npm --name "muva-chat" -- start
pm2 save
pm2 status
```

**FASE 3.2: Nginx Update**
```bash
# Option A: Rename config file
sudo mv /etc/nginx/sites-available/innpilot.conf /etc/nginx/sites-available/muva.conf
sudo ln -sf /etc/nginx/sites-available/muva.conf /etc/nginx/sites-enabled/muva.conf
sudo rm /etc/nginx/sites-enabled/innpilot.conf

# Option B: Keep filename, update comments only
sudo nano /etc/nginx/sites-available/innpilot.conf
# Update: "MUVA Chat subdomain routing" → "MUVA Chat subdomain routing"

sudo nginx -t
sudo systemctl reload nginx
```

**FASE 3.3: Verification**
```bash
curl -s https://muva.chat/api/health | jq
curl -s https://simmerdown.muva.chat/chat
pm2 logs muva-chat --lines 50
sudo tail -f /var/log/nginx/access.log
```

**FASE 5.3: Git Workflow**
```bash
git status
git add .
git commit -m "$(cat <<'EOF'
feat(rebrand): Complete MUVA Chat → MUVA Chat rebranding

BREAKING CHANGE: Project rebranded from MUVA Chat to MUVA Chat
- Updated package.json name to "muva-chat"
- Updated PM2 process name to "muva-chat"
- Updated all documentation and UI strings
- SIRE remains as premium feature

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
git tag -a v2.0-muva-rebrand -m "Complete rebranding to MUVA Chat"
git push origin dev
git push origin --tags
```

### Workflow

**Execute FASE 3.1-3.4:**
1. Read workflow prompts: `innpilot-to-muva-rebrand-prompt-workflow.md` (Prompt 3.1-3.4)
2. SSH to VPS
3. Rename PM2 process
4. Update Nginx config
5. Verify deployment
6. Update deployment scripts
7. Mark TODO.md tasks 3.1-3.4 complete

**Execute FASE 5.3:**
1. Read workflow prompt: `innpilot-to-muva-rebrand-prompt-workflow.md` (Prompt 5.3)
2. Review all changes with `git status`
3. Create commit with proper message
4. Create tag v2.0-muva-rebrand
5. Push to origin
6. Mark TODO.md task 5.3 complete

### Coordination

- **@agent-backend-developer**: Handles README, package.json, CLAUDE.md, docs, code comments
- **@agent-ux-interface**: Handles metadata, UI strings
- **@agent-deploy-agent**: Handles PM2, Nginx, deployment scripts, git workflow (this agent)

---

## 🎯 PROPÓSITO DEL DEPLOY AGENT

Automatizar completamente el flujo de desarrollo desde cambios locales hasta producción verificada en VPS, eliminando trabajo manual repetitivo y garantizando deploys consistentes.

**Workflow Completo Automatizado:**
```
📝 Code Changes → 🔄 Commit → 📤 Push GitHub → 🤖 GitHub Actions →
🚀 Deploy VPS → 🔄 PM2 Reload → ✅ Health Check → 📊 Report
```

**Timeline Esperado:** ~3 minutos (commit → producción verificada)

---

## 🏗️ INFRAESTRUCTURA DE PRODUCCIÓN

### VPS Hostinger Stack (ACTUAL - Oct 2025)

**Hardware:**
```
Provider: Hostinger VPS
IP: 195.200.6.216
OS: Ubuntu 22.04 LTS
Region: Europe (eu-central-1)
Resources: 2 CPU cores, 4GB RAM, 100GB SSD
```

**Software Stack:**
```
Web Server: Nginx 1.x (reverse proxy + SSL + rate limiting)
Process Manager: PM2 v5.x (cluster mode, 2 instances)
Runtime: Node.js 20.x LTS
Framework: Next.js 15.5.3 (production build)
Database: Supabase PostgreSQL 17.4 (remote)
SSL: Let's Encrypt wildcard certificate (*.muva.chat)
```

**Domain Configuration:**
```
Primary: muva.chat (SSL A+ rating)
Wildcard: *.muva.chat (subdomain routing ready)
DNS: Hostinger nameservers
HTTPS: Mandatory (HTTP → HTTPS redirect)
```

### Vercel Infrastructure (DEPRECADO)

**⚠️ IMPORTANTE:** Migración de Vercel → VPS completada Oct 4, 2025.

**NUNCA crear:**
- ❌ `vercel.json` - Use VPS cron instead
- ❌ Vercel CLI commands - Use PM2 + Git deployment
- ❌ Serverless functions - Use Next.js API routes

---

## 🔄 CI/CD PIPELINE COMPLETO

### GitHub Actions Workflow (`.github/workflows/deploy.yml`)

**Trigger:** Push to `dev` branch

**Total Steps:** 8 (checkout → deploy → health check → rollback on failure)

**Workflow completo:**

```yaml
name: Deploy to VPS
on:
  push:
    branches: [dev]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # 1. Checkout code from GitHub
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Setup Node.js 20.x
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. Install dependencies (exact versions)
      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      # 4. Build Next.js app with production env
      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NEXT_PUBLIC_APP_URL: https://muva.chat

      # 5. Deploy to VPS via SSH
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ${{ secrets.VPS_APP_PATH }}
            git pull origin dev
            npm ci --legacy-peer-deps
            npm run build
            pm2 reload docs/deployment/ecosystem.config.cjs --update-env

      # 6. Wait for deployment to stabilize
      - name: Wait for deployment
        run: sleep 10

      # 7. Health check verification
      - name: Health check
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://muva.chat/api/health)
          if [ $response != "200" ]; then
            echo "Health check failed with status $response"
            exit 1
          fi
          echo "Health check passed: $response"

      # 8. Rollback on failure
      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ${{ secrets.VPS_APP_PATH }}
            git reset --hard HEAD~1
            npm ci --legacy-peer-deps
            npm run build
            pm2 reload docs/deployment/ecosystem.config.cjs --update-env
            echo "Rolled back to previous version"

      # 9. Notify success
      - name: Notify success
        if: success()
        run: |
          echo "✅ Deployment successful!"
          echo "🌐 https://muva.chat is live"
```

**Timeline Breakdown:**
| Step | Duration | Description |
|------|----------|-------------|
| Checkout | ~5s | Clone repository |
| Setup Node.js | ~10s | Install Node 20.x + cache restore |
| Install deps | ~60s | `npm ci` (cached) |
| Build | ~90s | Next.js production build |
| Deploy to VPS | ~20s | SSH + git pull + npm install + PM2 reload |
| Wait | ~10s | Let PM2 stabilize |
| Health check | ~5s | Verify /api/health returns 200 |
| **TOTAL** | **~3min** | **Commit → Production** |

---

## 🔐 SECRETS MANAGEMENT

### GitHub Secrets (10 configurados)

**VPS Credentials (4):**
```
VPS_HOST                 # 195.200.6.216 (IP del VPS)
VPS_USER                 # root or deploy user
VPS_SSH_KEY              # SSH private key (RSA 4096-bit)
VPS_APP_PATH             # /var/www/muva-chat (app directory)
```

**Database Credentials (3):**
```
NEXT_PUBLIC_SUPABASE_URL          # https://ooaumjzaztmutltifhoq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Public anon key (JWT)
SUPABASE_SERVICE_ROLE_KEY         # Service role key (admin access)
```

**AI API Keys (2):**
```
OPENAI_API_KEY           # sk-proj-... (embeddings + GPT)
ANTHROPIC_API_KEY        # sk-ant-api03-... (Claude chat)
```

**Authentication (1):**
```
JWT_SECRET_KEY           # 64+ chars random string (guest/staff auth)
```

### Secrets Rotation Policy

**Frequency:** 90-day cycle (documented)

**Proceso de Rotación:**
1. Generate new secret (OpenSSL, platform dashboard, etc.)
2. Update GitHub Secret via `gh secret set SECRET_NAME`
3. Update VPS `.env.local` via SSH
4. Restart PM2: `pm2 reload muva-chat --update-env`
5. Verify health check passes
6. Invalidate old secret in provider dashboard

**Documentación:** `docs/deployment/GITHUB_SECRETS.md` (142 líneas)

---

## 🖥️ VPS DEPLOYMENT CONFIGURATION

### PM2 Process Manager

**Ecosystem Config:** `docs/deployment/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'innpilot',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/muva-chat',
    instances: 2,              // Cluster mode (2 CPUs)
    exec_mode: 'cluster',      // Load balancing
    autorestart: true,         // Auto-restart on crash
    watch: false,              // No file watching (manual deploy)
    max_memory_restart: '1G',  // Restart if > 1GB RAM
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/muva-chat-error.log',
    out_file: '/var/log/pm2/muva-chat-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    time: true
  }]
}
```

**PM2 Commands (Deployment):**
```bash
# Start application (initial)
pm2 start ecosystem.config.js

# Reload (zero-downtime) - PREFERRED for deploys
pm2 reload muva-chat --update-env

# Restart (brief downtime) - Only for major changes
pm2 restart muva-chat

# Status check
pm2 status

# Real-time logs
pm2 logs muva-chat --lines 100

# Interactive monitoring
pm2 monit

# Save current process list (persist across reboots)
pm2 save

# Setup startup script (run PM2 on boot)
pm2 startup systemd
```

### Nginx Reverse Proxy

**Config Location:** `/etc/nginx/sites-available/innpilot.conf`

**Key Features:**
- **Reverse Proxy:** Port 80/443 → localhost:3000 (PM2)
- **SSL Termination:** Let's Encrypt wildcard certificate
- **Rate Limiting:** 10 req/s for `/api/*` endpoints
- **Gzip Compression:** Text files (HTML, CSS, JS, JSON)
- **Static Caching:** `/_next/static/` → 1 year cache
- **Security Headers:** X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **HTTP → HTTPS Redirect:** Mandatory HTTPS

**Nginx Commands:**
```bash
# Test configuration (before reload)
sudo nginx -t

# Reload configuration (zero-downtime)
sudo systemctl reload nginx

# Restart Nginx (brief downtime)
sudo systemctl restart nginx

# View status
sudo systemctl status nginx

# Access logs
sudo tail -f /var/log/nginx/innpilot-access.log

# Error logs
sudo tail -f /var/log/nginx/muva-chat-error.log
```

### SSL Certificate (Let's Encrypt)

**Certificate Type:** Wildcard (`*.muva.chat` + `muva.chat`)

**Auto-Renewal:**
```bash
# Test renewal (dry-run)
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates

# Renewal timer (systemd)
sudo systemctl status certbot.timer
```

**Renewal Schedule:** Automatic every 60 days (certificates expire after 90 days)

---

## 📝 DEPLOYMENT WORKFLOWS

### 1. Automated Deployment (CI/CD) - PREFERRED

**Trigger:** Push to `dev` branch

```bash
# 1. Make code changes locally
git add .
git commit -m "feat: implement new feature"

# 2. Push to GitHub (triggers CI/CD)
git push origin dev

# 3. Monitor GitHub Actions (optional)
gh run watch

# 4. Verify deployment success
curl -s https://muva.chat/api/health | jq
# Expected: {"status":"ok","timestamp":"..."}

# 5. Check logs (if issues)
gh run list --workflow=deploy.yml --limit 5
gh run view <run-id> --log
```

**Expected Output (successful deploy):**
```
✅ Deployment successful!
🌐 https://muva.chat is live
```

### 2. Manual Deployment (Emergency/Debugging)

**Use Case:** GitHub Actions down, SSH-only access needed

```bash
# 1. SSH to VPS
ssh root@195.200.6.216
# Or: ssh deploy@muva.chat

# 2. Navigate to app directory
cd /var/www/muva-chat

# 3. Pull latest code
git pull origin dev

# 4. Install dependencies (exact versions)
npm ci --legacy-peer-deps

# 5. Build application
npm run build

# 6. Reload PM2 (zero-downtime)
pm2 reload docs/deployment/ecosystem.config.cjs --update-env

# 7. Verify deployment
pm2 status
curl -s http://localhost:3000/api/health | jq

# 8. Check Nginx
sudo systemctl status nginx

# 9. Exit SSH
exit

# 10. Verify from local
curl -s https://muva.chat/api/health | jq
```

**Timeline:** ~5 minutos (manual commands)

### 3. Rollback Deployment (Emergency)

**Scenario:** Deployment broke production, need immediate revert

**Option A: Automatic Rollback (GitHub Actions)**
- GitHub Actions detecta health check failure
- Ejecuta step "Rollback on failure"
- Revierte a commit anterior (HEAD~1)
- Rebuild + PM2 reload automático

**Option B: Manual Rollback (SSH)**

```bash
# 1. SSH to VPS
ssh root@195.200.6.216

# 2. Navigate to app
cd /var/www/muva-chat

# 3. View recent commits
git log --oneline -10

# 4. Reset to previous stable commit
git reset --hard <commit-hash>
# Example: git reset --hard HEAD~1 (1 commit back)

# 5. Rebuild
npm ci --legacy-peer-deps
npm run build

# 6. Reload PM2
pm2 reload muva-chat --update-env

# 7. Verify rollback successful
curl -s http://localhost:3000/api/health | jq
pm2 logs muva-chat --lines 50
```

**Timeline:** ~2 minutos (emergency rollback)

**Option C: Local Revert + Re-deploy (Recommended)**

```bash
# 1. Local machine - revert commit
git log --oneline -5
git revert <bad-commit-hash>

# 2. Push to GitHub (triggers auto-deploy)
git push origin dev

# 3. GitHub Actions deploys reverted code
# (uses normal CI/CD pipeline)
```

**Timeline:** ~3 minutos (uses CI/CD pipeline)

---

## 🛡️ GIT SAFETY PROTOCOL

### Commit Guidelines (CLAUDE.md)

**NEVER:**
- ❌ Update git config without user approval
- ❌ Run destructive commands (`git push --force`, `git reset --hard` without backup)
- ❌ Skip hooks (`--no-verify`, `--no-gpg-sign`)
- ❌ Force push to main/master branches
- ❌ Commit secrets (.env files, API keys, credentials)

**ALWAYS:**
- ✅ Use semantic commit messages (feat:, fix:, docs:, refactor:, test:)
- ✅ Run `git status` and `git diff` before commit
- ✅ Check authorship before amending: `git log -1 --format='%an %ae'`
- ✅ Verify not pushed: `git status` shows "Your branch is ahead"
- ✅ Add Claude Code signature to commits

**Commit Message Format:**
```
<type>: <description>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Commit Types:**
```
feat:      New feature
fix:       Bug fix
docs:      Documentation changes
refactor:  Code refactoring (no functional changes)
test:      Test changes
config:    Configuration changes
deploy:    Deployment/infrastructure changes
```

### Pre-Commit Hooks (Optional)

**Not currently implemented, but recommended:**

```bash
# .husky/pre-commit (example)
#!/bin/sh
npm run lint
npm run type-check
npm run test
```

---

## 🔍 HEALTH CHECKS & VERIFICATION

### Endpoints Verificados

**Primary Health Check:**
```bash
GET https://muva.chat/api/health

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2025-10-08T22:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

**Additional Verification Endpoints:**
```bash
# SIRE Assistant (Claude 3 Haiku)
POST https://muva.chat/api/chat
Expected: <3s response, 200 OK

# MUVA Tourism Assistant (Claude 3.5 Haiku + Images)
POST https://muva.chat/api/chat/muva
Expected: <5s response, 200 OK

# Guest Chat (Multi-conversation)
POST https://muva.chat/api/guest/chat
Expected: <3s response, 200 OK with JWT auth

# Staff Chat
POST https://muva.chat/api/staff/chat
Expected: <3s response, 200 OK with JWT auth

# Public Chat (Rate-limited)
POST https://muva.chat/api/public/chat
Expected: <2s response, 200 OK, max 10 req/s
```

### Performance Targets

| Endpoint | Target | Actual (Oct 2025) | Status |
|----------|--------|-------------------|--------|
| `/api/health` | <1s | ~500ms | ✅ PASS |
| `/api/chat` (SIRE) | <3s | ~1.5-2.5s | ✅ PASS |
| `/api/chat/muva` | <5s | ~2-4s | ✅ PASS |
| `/api/guest/chat` | <3s | ~1.5-2.5s | ✅ PASS |
| `/api/staff/chat` | <3s | ~1.5-2.5s | ✅ PASS |
| `/api/public/chat` | <2s | ~1-1.8s | ✅ PASS |

### Monitoring Commands

**From Local Machine:**
```bash
# Health check
curl -s https://muva.chat/api/health | jq

# Response time measurement
time curl -s https://muva.chat/api/health

# HTTP status code only
curl -s -o /dev/null -w "%{http_code}" https://muva.chat/api/health

# Full headers
curl -I https://muva.chat/api/health
```

**From VPS (SSH):**
```bash
# PM2 status
pm2 status

# Real-time logs
pm2 logs muva-chat --lines 100

# Memory/CPU monitoring
pm2 monit

# Nginx logs
sudo tail -f /var/log/nginx/innpilot-access.log
sudo tail -f /var/log/nginx/muva-chat-error.log

# System resources
htop
df -h  # Disk usage
free -h  # Memory usage
```

---

## 🚨 TROUBLESHOOTING

### Common Issues

**1. Build Fails in GitHub Actions**
```bash
# Check workflow logs
gh run list --workflow=deploy.yml --limit 5
gh run view <run-id> --log

# Reproduce locally
npm ci --legacy-peer-deps
npm run build

# Fix TypeScript errors
npm run type-check
```

**2. SSH Connection Timeout**
```bash
# Test SSH from local
ssh -vvv root@195.200.6.216

# Verify firewall (from VPS console)
sudo ufw status
sudo ufw allow 22/tcp

# Verify SSH service running
sudo systemctl status ssh
```

**3. PM2 Process Crashes**
```bash
# SSH to VPS
ssh root@195.200.6.216

# Check status
pm2 status

# View error logs
pm2 logs muva-chat --err --lines 200

# Restart PM2
pm2 restart muva-chat
```

**4. Nginx 502 Bad Gateway**
```bash
# Verify PM2 running
pm2 status muva-chat

# Test local Next.js
curl http://localhost:3000/api/health

# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**5. SSL Certificate Issues**
```bash
# Check certificate
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

**6. Health Check Fails**
```bash
# Test from VPS
curl http://localhost:3000/api/health

# Check PM2 logs
pm2 logs muva-chat --lines 100

# Verify build artifacts
ls -la /var/www/muva-chat/.next/server/pages/api/

# Rebuild if needed
npm run build
pm2 reload muva-chat
```

**Emergency Rollback (1 comando):**
```bash
ssh root@195.200.6.216 "cd /var/www/muva-chat && git reset --hard HEAD~1 && npm ci --legacy-peer-deps && npm run build && pm2 reload muva-chat"
```

**Documentación completa:** `docs/deployment/TROUBLESHOOTING.md` (480 líneas)

---

## 🎯 GAPS Y MEJORAS FUTURAS

### CRÍTICO
1. **Rollback Automation** - Rollback automático en health check failures (actualmente manual)
2. **Backup Strategy** - No hay backups automáticos de VPS (solo Supabase DB backups)

### IMPORTANTE
1. **Staging Environment** - No existe staging (deploy directo a producción)
2. **Blue-Green Deployment** - No implementado (downtime breve en deploys)
3. **Deploy Notifications** - No hay notificaciones Slack/Discord/Email

### MEDIO
1. **Canary Releases** - No implementado (deploy 100% o nada)
2. **Load Testing** - No hay pre-deployment load testing
3. **Deployment Metrics** - No tracking de deployment frequency/success rate
4. **Database Migrations** - No automatizadas en CI/CD (manual via Supabase dashboard)

---

## 📚 DOCUMENTACIÓN DEPLOYMENT

**Guides Disponibles (108KB total):**

| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `VPS_SETUP_GUIDE.md` | 13.8KB | VPS setup completo (Node.js, PM2, Nginx, SSL) |
| `DEPLOYMENT_WORKFLOW.md` | 7.1KB | CI/CD workflow + manual deployment |
| `SUBDOMAIN_SETUP_GUIDE.md` | 17.9KB | Wildcard DNS + Nginx subdomain routing |
| `VPS_CRON_SETUP.md` | 9.9KB | Cron jobs (auto-archive conversations) |
| `TROUBLESHOOTING.md` | 15KB | Solución 7 problemas comunes |
| `GITHUB_SECRETS.md` | 3.5KB | Configuración 10 secrets + rotation |
| `STORAGE_SETUP_GUIDE.md` | 8KB | Supabase Storage setup |

**Total:** 7 guías, 75KB documentación deployment

---

## 🔗 COORDINACIÓN CON OTROS AGENTES

**Trabaja estrechamente con:**

- **@backend-developer** - APIs deployment configuration, environment variables
- **@infrastructure-monitor** - Health checks, performance monitoring, error detection
- **@database-agent** - Database migrations deployment, RPC functions
- **@ux-interface** - Frontend build optimization, static assets caching

**Ver:** `CLAUDE.md` para guías proyecto-wide

---

## 📌 REFERENCIAS RÁPIDAS

### Production URLs
```
Primary: https://muva.chat
Health: https://muva.chat/api/health
SSL Report: https://www.ssllabs.com/ssltest/analyze.html?d=muva.chat
```

### VPS Access
```
IP: 195.200.6.216
SSH: ssh root@195.200.6.216
SSH Alias: ssh muva-vps (if configured in ~/.ssh/config)
App Path: /var/www/muva-chat
```

### PM2 Commands
```
Status: pm2 status
Logs: pm2 logs muva-chat
Reload: pm2 reload muva-chat --update-env
Monit: pm2 monit
```

### Nginx Commands
```
Test Config: sudo nginx -t
Reload: sudo systemctl reload nginx
Logs: sudo tail -f /var/log/nginx/innpilot-access.log
```

### GitHub Actions
```
List Runs: gh run list --workflow=deploy.yml
View Logs: gh run view <run-id> --log
Watch Live: gh run watch
```

### Snapshots Relacionados
```
🖥️ Infrastructure: snapshots/infrastructure-monitor.md
🔧 Backend: snapshots/backend-developer.md
🗺️ APIs: snapshots/api-endpoints-mapper.md
🌐 General: snapshots/general-snapshot.md
```

---

**Última Revisión:** 8 Octubre 2025
**Próxima Actualización:** Cuando se implementen mejoras críticas (backup, staging)
**Mantenido por:** Deploy Agent (@deploy-agent)
