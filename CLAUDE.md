# AURA — Assistente Financeiro MVP 1.0

## Stack
- Backend: Django 5 + Django Ninja + PostgreSQL 16 + pgvector
- IA: Google Gemini 2.5 Flash
- Fila: Celery 5 + Redis 7
- Mobile: React Native + Expo bare workflow + Expo Router
- Infra: Docker + Caddy + GitHub Actions + VPS Ubuntu 24.04 (Hostinger IP: 72.62.9.242)
- Storage: Backblaze B2 via boto3 (compatível com S3)
- Auth: JWT via django-ninja-jwt

## Estrutura
- Backend: aura/apps/api/
- Mobile: aura/apps/mobile/
- Infra: docker-compose.yml + Caddyfile na raiz

## Modelos principais
- User: email, phone, monthly_limit — SEM campo de avatar no banco
- Category: name, icon, color, is_system, user (null = sistema)
- Expense: user, description, amount, date, category, status, source, ai_insight, embedding(768d)
- ExpenseStatus: pending | processed | manual | error
- ExpenseSource: app | notification

## Regras críticas
- Avatar NUNCA salvo no banco — chave fixa: avatars/{user_id}.jpg no Backblaze
- URL montada dinamicamente: {B2_PUBLIC_URL}/avatars/{user_id}.jpg
- Despesa criada com status "pending", processada assincronamente via Celery + Gemini
- Teto mensal (monthly_limit) é fixo — usuário atualiza quando quiser
- Deduplicação de notificações: mesmo user + valor + source=notification + < 2 minutos

## Comandos úteis
- Subir containers: docker compose up --build -d
- Migrations: docker compose exec api python manage.py migrate
- Worker: celery -A core worker --loglevel=info
- Swagger: https://api.seudominio.com.br/api/docs

## Fases de desenvolvimento (completar em ordem)
- [FASE 1] Infraestrutura Base — Docker, CI/CD, DNS, HTTPS ✅/⬜
- [FASE 2] Django Base + Auth — User, JWT, perfil, Celery+Redis ✅/⬜
- [FASE 3] Categorias e Despesas — CRUD, task mock, status pending ✅/⬜
- [FASE 4] Integração Gemini 2.5 — categorização, embeddings, pgvector ✅/⬜
- [FASE 5] Dashboard — summary, categories, history 6 meses ✅/⬜
- [FASE 6] Chat com a Aura — ChatMessage, contexto financeiro, RAG ✅/⬜
- [FASE 7] App Mobile — todas as telas, Zustand, JWT interceptor, APK ✅/⬜
- [FASE 8] Captura de Notificações — Kotlin NotificationListenerService, parsers ✅/⬜
- [FASE 9] Polimento — rate limiting, logs, backup, testes ✅/⬜

## FASE ATUAL: Fase 1 — Infraestrutura Base

## Proibições
- NUNCA adicionar campo de avatar no model User
- NUNCA usar SDK proprietário do Backblaze (usar boto3)
- NUNCA iniciar fase N+1 sem confirmar que a fase N está testada e funcionando