<div align="center">

<img src="https://img.shields.io/badge/status-em%20desenvolvimento-00ffc2?style=for-the-badge&labelColor=0d1117" />
<img src="https://img.shields.io/badge/versão-1.0.0-a855f7?style=for-the-badge&labelColor=0d1117" />
<img src="https://img.shields.io/badge/licença-MIT-0066ff?style=for-the-badge&labelColor=0d1117" />

<br/><br/>

```
╔═══════════════════════════════════════╗
║      ✦  A U R A                      ║
║         Agente de Transformação       ║
║         Financeira AI-First           ║
╚═══════════════════════════════════════╝
```

**Aura** é um SaaS de transformação financeira que usa IA local para identificar padrões de comportamento emocional em gastos e intervir no momento certo — via WhatsApp, push ou in-app — sem julgamento.

[Arquitetura](#-arquitetura) • [Stack](#-stack) • [Funcionalidades](#-funcionalidades) • [Estrutura](#-estrutura-do-projeto) • [Banco de Dados](#-banco-de-dados) • [Como Rodar](#-como-rodar) • [Roadmap](#-roadmap)

</div>

---

## 🧠 O Problema

Jovens adultos falham em gerir finanças **não por falta de matemática**, mas por impulsividade e fricção. Nenhuma planilha resolve comportamento.

## 💡 A Solução

O Aura atua **no momento do gasto**, não depois. A IA analisa cada transação, identifica o gatilho emocional (tédio, estresse, euforia), detecta padrões e envia um conselho empático — no canal certo, na hora certa.

```
"iFood 23h sexta R$85"
    → IMPULSO detectado (confiança: 0.87)
    → Gatilho: TÉDIO
    → Padrão: 4ª delivery da semana
    → WhatsApp: "Oi! Tudo bem? Percebi mais um delivery tardio.
                 Foi fome ou mais por hábito? 😊"
```

---

## ✨ Funcionalidades

### Ingestão Omnichannel (5 canais)

| Canal                      | Como funciona                                                                     |
| -------------------------- | --------------------------------------------------------------------------------- |
| 📱 **App Mobile**          | Input manual com categorização automática via IA                                  |
| 💬 **WhatsApp Bot**        | Evolution API — texto ou áudio transcrito via Whisper                             |
| 🔔 **Notificação Android** | Background service captura notificações bancárias (Nubank, Inter, Itaú, Bradesco) |
| 📧 **Email Gateway**       | Usuário encaminha comprovante para `user@aura.app` — SendGrid processa            |
| 📄 **Importação OFX**      | Upload de extrato bancário com processamento em lote via BullMQ                   |

### Análise Comportamental com IA Local

- **Classificação de sentimento**: IMPULSO · NECESSÁRIO · NEUTRO
- **Detecção de gatilhos emocionais**: tédio, estresse, euforia, social
- **Perfil psicológico acumulado**: impulse score com média móvel exponencial
- **Estágios de consciência**: UNAWARE → AWARE → CHANGING → AUTONOMOUS
- **Padrões comportamentais**: frequência, custo mensal, contexto

### Chat RAG Financeiro

- Assistente que **conhece o histórico pessoal** do usuário
- "Quanto gastei com Uber esse mês?" → resposta com dados reais
- Embeddings em pgvector + ChromaDB + Llama 3 via Ollama
- Streaming token a token via Socket.io

### Intervenções Inteligentes (4 tipos)

| Tipo                | Quando dispara                                       |
| ------------------- | ---------------------------------------------------- |
| 🛡️ **Preventiva**   | Gasto impulsivo + madrugada + impulse score alto     |
| 📚 **Educativa**    | Padrão forte detectado + usuário ainda UNAWARE       |
| 🎉 **Celebratória** | Usuário com histórico impulsivo faz boa escolha      |
| 🤔 **Reflexiva**    | Pós-gasto impulsivo + diurno + taxa de sucesso baixa |

### Modelo SaaS Freemium

| Recurso            | Free              | Premium         |
| ------------------ | ----------------- | --------------- |
| Transações manuais | Ilimitadas        | Ilimitadas      |
| WhatsApp Bot       | 10 tx/mês         | Ilimitado       |
| Apps monitorados   | 1 app             | Ilimitado       |
| Importação OFX     | 🔒                | ✅              |
| Email Gateway      | 🔒                | ✅              |
| Chat IA            | 5 queries/dia     | Ilimitado       |
| Fila BullMQ        | Prioridade normal | Prioridade alta |

---

## 🏗 Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    5 CANAIS DE ENTRADA                          │
│  App Mobile · WhatsApp · Notificação · Email · OFX             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                  NestJS API Gateway                              │
│  Guards (Auth + Planos) · Controllers · Use Cases               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  BullMQ + Redis                          │   │
│  │  ia.processing · batch.import · incoming.webhook        │   │
│  └──────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│              Microsserviço IA — Python FastAPI                   │
│  POST /categorize · POST /sentiment · WebSocket /chat           │
│  Llama 3 (Ollama local) · LangChain · ChromaDB                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                         Persistência                             │
│  PostgreSQL + DrizzleORM · pgvector (embeddings)                │
│  Redis (BullMQ + cache) · MinIO (arquivos OFX)                  │
└─────────────────────────────────────────────────────────────────┘
```

### Por que dois serviços?

O ecossistema Python (LangChain, ChromaDB, Whisper, transformers) é imbatível para IA. O NestJS cuida da lógica de negócio, autenticação, filas e APIs. Cada linguagem faz o que faz melhor.

### Por que IA local (Ollama)?

Dados financeiros são sensíveis. O Aura **nunca envia histórico financeiro para APIs externas**. Llama 3 roda localmente — esse é o diferencial de privacidade do produto.

---

## 🧱 Clean Architecture

O projeto segue Clean Architecture com separação rígida de camadas:

```
libs/domain/          ← Regras de negócio puras (zero dependências externas)
libs/application/     ← Use Cases e Ports (interfaces)
libs/infrastructure/  ← DrizzleORM, BullMQ, adapters externos
libs/shared/dtos/          ← Contratos de API compartilhados
libs/shared/util/          ← Helpers e validadores
```

**Regra absoluta:** `libs/core/domain` não tem nenhum `import` de framework, ORM ou lib externa. TypeScript puro. Isso garante que as regras de negócio possam ser testadas sem banco, sem servidor, sem nada.

### Design Patterns aplicados

**Strategy** — Tipos de intervenção (preventiva, educativa, celebratória, reflexiva) são intercambiáveis sem if/else. Limites de plano (Free vs Premium) são uma strategy trocável.

**Observer** — `TransactionEventBus` publica para 3 observers em paralelo:

- `SentimentAnalysisObserver` → fila `ia.processing`
- `PatternDetectorObserver` → detecta padrões comportamentais
- `AdvicePlannerObserver` → agenda conselho

**Factory** — `TransactionChannelFactory.create(origin)` retorna o canal correto (Manual, WhatsApp, Notification, Email, OFX). Adicionar Open Finance = criar um novo canal, zero alteração no restante.

---

## 🗄 Banco de Dados

**DrizzleORM** + **PostgreSQL** + **pgvector**

14 tabelas organizadas em 4 módulos:

```
Identidade & SaaS        →  users, plans, subscriptions,
                              refresh_tokens, usage_counters

Financeiro Core          →  transactions, categories,
                              ai_insights, advices

Perfil Comportamental    →  user_behavior_profiles, chat_messages (+ embeddings)

Integrações              →  webhook_configs, email_integrations, import_batches
```

Destaques do schema:

- `usage_counters` com `@@unique([userId, feature, month])` para enforcement atômico de limites SaaS
- `transactions.deletedAt` — soft delete preserva histórico comportamental
- `chat_messages.embedding vector(1536)` com índice HNSW para busca semântica
- `user_behavior_profiles.impulseScore` calculado com média móvel exponencial

---

## 🛠 Stack

### Backend

| Tecnologia         | Uso                                                                    |
| ------------------ | ---------------------------------------------------------------------- |
| **NestJS**         | API Gateway, guards, controllers, use cases                            |
| **DrizzleORM**     | ORM SQL-first com tipagem perfeita + pgvector nativo                   |
| **BullMQ + Redis** | Filas assíncronas: `ia.processing`, `batch.import`, `incoming.webhook` |
| **Socket.io**      | Chat em tempo real com streaming token a token                         |
| **PostgreSQL**     | Banco principal + pgvector para embeddings                             |
| **MinIO**          | Storage de arquivos OFX                                                |

### IA (Microsserviço Python)

| Tecnologia           | Uso                               |
| -------------------- | --------------------------------- |
| **FastAPI**          | Framework do microsserviço de IA  |
| **Ollama + Llama 3** | LLM local — privacidade total     |
| **LangChain**        | Orquestração de pipelines de IA   |
| **ChromaDB**         | Vector database para RAG          |
| **Whisper**          | Transcrição de áudios do WhatsApp |

### Frontend & Mobile

| Tecnologia              | Uso                        |
| ----------------------- | -------------------------- |
| **React Native (Expo)** | App mobile — iOS e Android |
| **Next.js**             | Painel administrativo web  |
| **Tailwind CSS**        | Estilização                |

### Infra & Integrações

| Tecnologia         | Uso                                                  |
| ------------------ | ---------------------------------------------------- |
| **Turborepo**      | Gerenciamento do monorepo TypeScript + Python        |
| **Docker Compose** | Orquestração de todos os serviços em desenvolvimento |
| **Evolution API**  | WhatsApp Bot                                         |
| **Stripe**         | Billing e gerenciamento de assinaturas               |
| **SendGrid**       | Email Gateway de entrada                             |
| **Google OAuth**   | Autenticação social                                  |

---

## 📁 Estrutura do Projeto

```
aura/
├── apps/
│   ├── api-gateway/          # NestJS — backend principal
│   ├── web-admin/            # Next.js — painel administrativo
│   ├── mobile/               # React Native (Expo)
│   └── ia-service/           # Python FastAPI — microsserviço de IA
│
├── libs/
│   ├── domain/               # Entidades, Value Objects, Strategies, Observers, Factories
│   ├── application/          # Use Cases e Ports/Interfaces
│   └── infrastructure/       # DrizzleORM, BullMQ, adapters externos
│
├── docs/
│   └── adr/                  # Architecture Decision Records
│       ├── 001-turborepo-vs-nx.md
│       ├── 002-drizzle-vs-prisma.md
│       ├── 003-ollama-local.md
│       └── 004-bullmq-vs-rabbitmq.md
│
├── pnpm-workspace.yaml       # define apps/* e libs/* como workspaces
├── turbo.json                # pipeline de build e cache
├── tsconfig.base.json        # path aliases compartilhados (@aura/domain, etc.)
└── docker-compose.yml
```

### Domain Layer — libs/core/domain

```
src/lib/
├── entities/
│   ├── user.entity.ts                  # Usuário com roles (ADMIN, USER)
│   ├── transaction.entity.ts           # Transação com análise de IA
│   ├── category.entity.ts              # Categorias do sistema e customizadas
│   ├── plan.entity.ts                  # Planos FREE e PREMIUM
│   ├── advice.entity.ts                # Conselhos enviados + rastreamento de outcome
│   ├── trigger.entity.ts               # Gatilhos emocionais detectados
│   ├── behavioral-pattern.entity.ts    # Padrões de comportamento
│   └── psychological-profile.entity.ts # Perfil acumulado do usuário
├── value-objects/
│   ├── money.vo.ts                     # Valor monetário imutável
│   └── email.vo.ts                     # Email validado e normalizado
├── enums/
│   └── index.ts                        # TransactionOrigin, Sentiment, UserRole, etc.
├── errors/
│   └── domain.errors.ts               # DomainError, PlanLimitExceededError, etc.
├── strategies/
│   ├── intervention/
│   │   └── intervention.strategy.ts   # Preventiva, Educativa, Celebratória, Reflexiva
│   └── plan-limit/
│       └── plan-limit.strategy.ts     # FreePlanLimitStrategy, PremiumPlanLimitStrategy
├── observers/
│   └── transaction-event-bus.ts       # Observer pattern — Sentiment, Pattern, Advice
└── factories/
    └── channels/
        └── transaction-channel.factory.ts  # Manual, WhatsApp, Notification, Email, OFX
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 20 LTS
- pnpm
- Docker e Docker Compose
- Python 3.11+

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/aura.git
cd aura
pnpm install   # instala todas as deps de apps/* e libs/* de uma vez
```

### 2. Subir a infraestrutura

```bash
docker compose up -d
```

Serviços que sobem:

- PostgreSQL (porta 5432)
- Redis (porta 6379)
- MinIO (porta 9000)
- Ollama — **na primeira execução baixa o Llama 3 (~4GB, pode demorar 5–10min)**
- Evolution API (WhatsApp)

### 3. Verificar se o Ollama está pronto

```bash
curl http://localhost:11434/api/tags
# deve retornar o modelo listado
```

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env
# edite com suas chaves: Google OAuth, Stripe, SendGrid, Evolution API
```

### 5. Rodar migrations

```bash
pnpm --filter @aura/api-gateway db:migrate
```

> ⚠️ **Atenção:** após as migrations, execute o SQL manual para o índice HNSW do pgvector:
>
> ```sql
> CREATE INDEX USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
> ```

### 6. Subir os serviços

```bash
# Todos os apps de uma vez (Turborepo)
pnpm turbo dev

# Ou individualmente
pnpm --filter @aura/api-gateway start:dev
pnpm --filter @aura/web-admin dev
pnpm --filter @aura/mobile start

# Microsserviço Python (fora do Turborepo)
cd apps/ia-service && uvicorn main:app --reload
```

### 7. Stripe CLI (para webhooks em desenvolvimento)

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### 8. Google Sign-In (Android)

> ⚠️ Configure o SHA-1 do debug.keystore no Google Cloud Console **antes** de testar no device:
>
> ```bash
> keytool -list -v -keystore ~/.android/debug.keystore \
>   -alias androiddebugkey -storepass android -keypass android
> ```

---

## 🧪 Testes

```bash
# Todos os testes (Turborepo — roda em paralelo e usa cache)
pnpm turbo test

# Só o domínio
pnpm --filter @aura/domain test

# Testes de integração
pnpm --filter @aura/api-gateway test:integration

# Microsserviço Python
cd apps/ia-service && pytest

# Coverage
pnpm --filter @aura/domain test -- --coverage
```

---

## 📋 Roadmap

- [x] Domain Layer completo (entidades, value objects, strategies, observer, factory)
- [ ] Application Layer (use cases com ports/interfaces)
- [ ] Infrastructure Layer (DrizzleORM, BullMQ adapters)
- [ ] API Gateway NestJS (controllers, guards, módulos)
- [ ] Autenticação Google OAuth + JWT
- [ ] App Mobile React Native (Expo)
- [ ] Microsserviço IA Python (sentiment, categorize, chat)
- [ ] Chat RAG com ChromaDB e Socket.io
- [ ] WhatsApp Bot (Evolution API)
- [ ] Email Gateway (SendGrid)
- [ ] Importação OFX
- [ ] Notificações Android
- [ ] Stripe Integration (checkout, webhooks, downgrade)
- [ ] Painel Admin Next.js (MRR, Churn, Queue Stats)
- [ ] Testes de integração com Testcontainers
- [ ] CI/CD (GitHub Actions)

---

## 🎯 Contexto

Este projeto está sendo desenvolvido como parte de uma **transição de carreira de Full Stack Developer para Software Architect**, seguindo o currículo do curso [Full Cycle 4.0](https://fullcycle.com.br).

Cada decisão arquitetural está documentada em `docs/adr/`. O objetivo é ter um produto real que demonstre domínio de:

- Clean Architecture e Domain-Driven Design
- Design Patterns (Strategy, Observer, Factory)
- Sistemas distribuídos com filas assíncronas
- Integração de LLMs locais em produto de produção
- Arquitetura de dados com pgvector e RAG
- Modelo SaaS com billing e feature flags

---

## 📄 Architecture Decision Records

| ADR                                       | Decisão                            | Status    |
| ----------------------------------------- | ---------------------------------- | --------- |
| [001](docs/adr/001-nx-monorepo.md)        | Turborepo para TypeScript + Python | ✅ Aceito |
| [002](docs/adr/002-drizzle-vs-prisma.md)  | DrizzleORM no lugar do Prisma      | ✅ Aceito |
| [003](docs/adr/003-ollama-local.md)       | Ollama local em vez de OpenAI      | ✅ Aceito |
| [004](docs/adr/004-bullmq-vs-rabbitmq.md) | BullMQ + Redis em vez de RabbitMQ  | ✅ Aceito |

---

## 👤 Autor

Desenvolvido por **[Seu Nome]**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)

---

<div align="center">

**Aura** — construído com arquitetura séria, para um problema real.

</div>
