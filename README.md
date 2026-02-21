<div align="center">

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-00ffc2?style=for-the-badge&labelColor=0d1117)
![Versão](https://img.shields.io/badge/versão-1.0.0-a855f7?style=for-the-badge&labelColor=0d1117)
![Licença](https://img.shields.io/badge/licença-MIT-0066ff?style=for-the-badge&labelColor=0d1117)

```
╔═══════════════════════════════════════╗
║      ✦  A U R A                      ║
║         Agente de Transformação       ║
║         Financeira AI-First           ║
╚═══════════════════════════════════════╝
```

**Aura é um SaaS de transformação financeira que usa IA local para identificar padrões de comportamento emocional em gastos e intervir no momento certo — via WhatsApp, push ou in-app — sem julgamento.**

[Arquitetura](#-arquitetura) • [Stack](#-stack) • [Funcionalidades](#-funcionalidades) • [Estrutura](#-estrutura-do-projeto) • [Banco de Dados](#-banco-de-dados) • [Como Rodar](#-como-rodar) • [Roadmap](#-roadmap)

</div>

---

## 🧠 O Problema

Jovens adultos falham em gerir finanças não por falta de matemática, mas por impulsividade e fricção. Nenhuma planilha resolve comportamento.

## 💡 A Solução

O Aura atua no momento do gasto, não depois. A IA analisa cada transação, identifica o gatilho emocional (tédio, estresse, euforia), detecta padrões e envia um conselho empático — no canal certo, na hora certa.

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

- Classificação de sentimento: `IMPULSO` · `NECESSÁRIO` · `NEUTRO`
- Detecção de gatilhos emocionais: tédio, estresse, euforia, social
- Perfil psicológico acumulado: impulse score com média móvel exponencial
- Estágios de consciência: `UNAWARE` → `AWARE` → `CHANGING` → `AUTONOMOUS`
- Padrões comportamentais: frequência, custo mensal, contexto

### Chat RAG Financeiro

- Assistente que conhece o histórico pessoal do usuário
- _"Quanto gastei com Uber esse mês?"_ → resposta com dados reais
- Embeddings em pgvector + ChromaDB + Llama 3 via Ollama
- Streaming token a token via Socket.io

### Intervenções Inteligentes (4 tipos)

| Tipo                | Quando dispara                                       |
| ------------------- | ---------------------------------------------------- |
| 🛡️ **Preventiva**   | Gasto impulsivo + madrugada + impulse score alto     |
| 📚 **Educativa**    | Padrão forte detectado + usuário ainda `UNAWARE`     |
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

> **Por que dois serviços?**
> O ecossistema Python (LangChain, ChromaDB, Whisper, transformers) é imbatível para IA. O NestJS cuida da lógica de negócio, autenticação, filas e APIs. Cada linguagem faz o que faz melhor.

> **Por que IA local (Ollama)?**
> Dados financeiros são sensíveis. O Aura nunca envia histórico financeiro para APIs externas. Llama 3 roda localmente — esse é o diferencial de privacidade do produto.

---

## 🧱 Clean Architecture & Monorepo

O projeto utiliza **Turborepo** para orquestrar um monorepo rigoroso, dividindo o TypeScript em pacotes isolados com resolução de módulos otimizada para bundlers (Webpack).

```
libs/domain/          ← Regras de negócio puras (TypeScript puro, testado com Vitest)
libs/application/     ← Use Cases e Ports/Interfaces
libs/infrastructure/  ← DrizzleORM, BullMQ, Adapters externos (Bcrypt, JWT)
```

> **Regra absoluta:** `libs/domain` não tem nenhum import de framework, ORM ou lib externa. Isso garante que o coração da aplicação possa ser testado sem banco de dados, resultando em testes executados em milissegundos.

### Design Patterns aplicados

**Strategy** — Tipos de intervenção (preventiva, educativa, celebratória, reflexiva) são intercambiáveis sem `if/else`. Limites de plano (Free vs Premium) são uma strategy trocável.

**Observer** — `TransactionEventBus` publica eventos para observers em paralelo:

- `SentimentAnalysisObserver` → fila `ia.processing`
- `PatternDetectorObserver` → detecta padrões comportamentais
- `AdvicePlannerObserver` → agenda conselhos

**Factory** — O app não conhece a complexidade de instanciar canais. A Factory retorna o canal correto (Manual, WhatsApp, Notification, Email, OFX).

---

## 🗄 Banco de Dados

**DrizzleORM + PostgreSQL + pgvector** — 14 tabelas organizadas em 4 módulos:

```
Identidade & SaaS        →  users, plans, subscriptions, refresh_tokens, usage_counters
Financeiro Core          →  transactions, categories, ai_insights, advices
Perfil Comportamental    →  user_behavior_profiles, chat_messages (+ embeddings)
Integrações              →  webhook_configs, email_integrations, import_batches
```

**Destaques do schema:**

- `usage_counters` com `@@unique([userId, feature, month])` para enforcement atômico de limites SaaS.
- `chat_messages.embedding vector(1536)` com índice HNSW para busca semântica veloz.

---

## 🛠 Stack

### Backend

| Tecnologia         | Uso                                                         |
| ------------------ | ----------------------------------------------------------- |
| **NestJS**         | API Gateway, controllers injetando casos de uso do monorepo |
| **DrizzleORM**     | ORM SQL-first com tipagem perfeita + pgvector nativo        |
| **BullMQ + Redis** | Filas assíncronas de processamento                          |
| **PostgreSQL**     | Banco principal + pgvector para embeddings                  |

### Infra, Testes & IA

| Tecnologia           | Uso                                                                   |
| -------------------- | --------------------------------------------------------------------- |
| **Turborepo / pnpm** | Gerenciamento do monorepo, build cache e workspaces                   |
| **Jest & Vitest**    | Jest no NestJS (CommonJS) / Vitest nas libs (ESM veloz)               |
| **Webpack**          | Bundler configurado via `webpack-node-externals` para engolir as libs |
| **Ollama + Python**  | Microsserviço FastAPI isolado rodando IA localmente                   |

---

## 📁 Estrutura do Projeto

```
aura/
├── apps/
│   ├── api-gateway/          # NestJS — backend principal (Testes: Jest)
│   ├── web-admin/            # Next.js — painel administrativo
│   ├── mobile/               # React Native (Expo)
│   └── ia-service/           # Python FastAPI — microsserviço de IA
│
├── libs/
│   ├── domain/               # Entidades, Value Objects, Strategies (Testes: Vitest)
│   ├── application/          # Use Cases e Ports/Interfaces (Testes: Vitest)
│   └── infrastructure/       # DrizzleORM, repositórios, adapters (Testes: Vitest)
│
├── pnpm-workspace.yaml       # define apps/* e libs/* como workspaces
├── turbo.json                # pipeline de build e cache
└── tsconfig.base.json        # path aliases e moduleResolution: bundler compartilhados
```

---

## 🚀 Como Rodar

### Pré-requisitos

- Node.js 20 LTS
- pnpm
- Docker e Docker Compose
- Python 3.11+ (para o microsserviço IA)

### 1. Clonar e instalar

```bash
git clone https://github.com/seu-usuario/aura.git
cd aura
pnpm install   # o pnpm resolve os links simbólicos de todo o monorepo nativamente
```

### 2. Subir a infraestrutura

```bash
docker compose up -d
# Sobe Postgres, Redis, MinIO e Ollama.
```

### 3. Rodar as Aplicações e Testes

```bash
# Rodar todos os testes do monorepo (usando cache do Turbo)
pnpm turbo test

# Iniciar o API Gateway em desenvolvimento
pnpm --filter api-gateway start:dev
```

> ⚠️ **Atenção (pgvector):** após rodar as migrations do banco no futuro, execute o SQL manual para criar o índice do RAG:
>
> ```sql
> CREATE INDEX USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
> ```

---

## 📋 Roadmap

- [x] Setup do Monorepo Profissional (Turborepo, pnpm workspaces, TSConfig Base)
- [x] Domain Layer completo (Entidades, Value Objects, Strategies, Observers, Factories)
- [x] Application Layer (Use cases de Auth e Ports/Interfaces)
- [x] Infrastructure Layer inicial (Bcrypt, Repositórios In-Memory e JWT)
- [x] API Gateway NestJS Base (Integração correta com o Webpack do monorepo)
- [x] Testes Automatizados (Vitest no Domínio/App e Jest no NestJS)
- [ ] Schema Completo do DrizzleORM configurado
- [ ] Autenticação Google OAuth
- [ ] Microsserviço IA Python (sentiment, categorize, chat)
- [ ] Filas com BullMQ
- [ ] App Mobile React Native (Expo)
- [ ] Painel Admin Next.js

---

## 🎯 Contexto

Este projeto está sendo desenvolvido como parte de um plano de reestruturação de carreira para **Software Architect**, consolidando mais de três anos de experiência prática e seguindo conceitos avançados de engenharia de software (inspirado no currículo Full Cycle).

O objetivo é ter um produto de ponta que demonstre domínio real sobre:

- Clean Architecture em cenários complexos (Monorepos)
- Resolução profunda de problemas de compilação, Bundlers e Módulos (ESM vs CJS)
- Sistemas distribuídos e integração de IAs LLM locais

---

## 📄 Architecture Decision Records

| ADR | Decisão                             | Status    |
| --- | ----------------------------------- | --------- |
| 001 | Turborepo + Webpack Custom + NestJS | ✅ Aceito |
| 002 | DrizzleORM no lugar do Prisma       | ✅ Aceito |
| 003 | Ollama local em vez de OpenAI       | ✅ Aceito |
| 004 | Vitest (Libs) e Jest (API Gateway)  | ✅ Aceito |

---

## 👤 Autor

Desenvolvido por **Carlos Adriano Sodré Araújo**

<div align="center">

_Aura — construído com arquitetura séria, para um problema real._

</div>
