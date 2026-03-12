# AURA — Documento de Planejamento Completo

> Assistente financeiro com análise comportamental
> Versão: MVP 1.0
> Stack: Django Ninja + PostgreSQL + Gemini 2.5 + Celery + React Native (Expo)

---

## ÍNDICE

1. Visão do Produto
2. Stack Tecnológica
3. Arquitetura Geral
4. Infraestrutura e Deploy
5. Estrutura de Pastas
6. Modelos do Banco de Dados
7. Sistema de Filas (Celery + Redis)
8. Endpoints da API
9. Integração com IA (Gemini 2.5)
10. Captura via Notificação do Celular
11. Dashboard e Relatórios
12. App Mobile (React Native + Expo)
13. Fases de Desenvolvimento
14. Variáveis de Ambiente
15. Dependências

---

## 1. Visão do Produto

### O que é a Aura
Assistente financeiro com análise comportamental. O usuário registra ou captura despesas
automaticamente pelo celular e a Aura categoriza com IA, compara com o teto definido pelo
próprio usuário e gera análises comportamentais sobre os padrões de gasto.

### O que o MVP faz
- Usuário cria conta e define seu teto de gastos mensal fixo
- Lança despesas manualmente pelo app OU a Aura captura automaticamente via notificações
  de apps bancários
- A IA (Gemini 2.5 Flash) categoriza cada despesa automaticamente
- Dashboard mostra gráficos de gastos vs. teto e histórico por categoria
- Chat com a IA para perguntar sobre as próprias finanças
- Perfil completo: foto de perfil (Backblaze B2), edição de dados, troca de senha,
  e-mail e controle do teto

### O que o MVP NÃO faz (escopo fora)
- Controle de receitas (apenas despesas)
- Teto diferente por mês (teto é fixo, o usuário atualiza quando quiser)
- Integração bancária direta (Open Finance)
- Metas de investimento
- Suporte a iOS para captura de notificações (política da Apple)
- Publicação nas lojas (MVP via APK direto)

---

## 2. Stack Tecnológica

### Backend
| Camada          | Tecnologia               | Motivo                                                         |
|-----------------|--------------------------|----------------------------------------------------------------|
| Framework API   | Django 5 + Django Ninja  | Tipagem automática, docs OpenAPI, ideal para app mobile        |
| Banco de dados  | PostgreSQL 16 + pgvector | Relacional robusto + vetores para memória da IA                |
| Fila de tarefas | Celery 5                 | Processa transações assíncrono, evita race condition           |
| Broker da fila  | Redis 7                  | Leve, rápido, padrão de mercado para Celery                    |
| IA              | Google Gemini 2.5 Flash  | Raciocínio avançado, contexto longo, análise comportamental    |
| Proxy reverso   | Caddy                    | HTTPS automático via Let's Encrypt                             |
| Containers      | Docker + Docker Compose  | Mesma imagem roda local e na VPS                               |
| CI/CD           | GitHub Actions           | Deploy automático a cada git push                              |
| VPS             | Ubuntu 24.04 (Hostinger) | Já configurado com Docker e Firewall                           |
| Autenticação    | JWT via django-ninja-jwt | Stateless, ideal para app mobile                               |
| Storage de foto | Backblaze B2             | Storage externo para fotos de perfil, identificadas pelo ID do usuário |

### App Mobile
| Camada          | Tecnologia              | Motivo                                                      |
|-----------------|-------------------------|-------------------------------------------------------------|
| Framework       | React Native            | Cross-platform, futuro iOS                                  |
| Toolchain       | Expo (bare workflow)    | Permite módulos nativos para captura de notificações        |
| Navegação       | Expo Router             | File-based routing, mais simples para MVP                   |
| Estado global   | Zustand                 | Leve, sem boilerplate, substitui Redux                      |
| Requisições     | Axios                   | Interceptors para JWT automático                            |
| Gráficos        | Victory Native          | Gráficos nativos para React Native                          |
| Estilização     | NativeWind (Tailwind)   | Produtividade e consistência visual                         |
| Foto de perfil  | expo-image-picker       | Seleção e crop da foto antes de enviar para o backend       |
| Notificações    | Módulo nativo Android   | NotificationListenerService para ler apps bancários         |

---

## 3. Arquitetura Geral

```
[App Mobile — Android]
        |
        |-- Lançamento manual de despesa
        |-- Upload de foto de perfil -> API -> Backblaze B2
        |-- Captura de notificação bancária (background nativo)
        |
        |  HTTPS + JWT
        v
[Caddy Proxy]  api.dominio.com.br -> Django :8000
        |
        v
[Django Ninja :8000]
        |
        |-- Upload de foto: recebe arquivo -> envia para Backblaze B2
        |   URL pública: f000.backblazeb2.com/file/{bucket}/avatars/{user_id}.jpg
        |
        v
[Celery Task Queue]
        |
   _____|______________________
   |           |               |
[PostgreSQL] [Redis]      [Gemini 2.5]
[+pgvector]  [Broker]    [API externa]

[Backblaze B2 — storage externo]
   |-- avatars/{user_id}.jpg   <- foto de perfil de cada usuário
```

### Por que não precisa de campo novo na tabela User?
O nome do arquivo no Backblaze é sempre `avatars/{user_id}.jpg`.
A URL é 100% previsível a partir do ID do usuário:

```
https://f000.backblazeb2.com/file/{BUCKET_NAME}/avatars/{user_id}.jpg
```

O backend monta essa URL dinamicamente na hora de retornar os dados do usuário.
Fazer upload sobrescreve o arquivo anterior automaticamente (mesmo nome = mesmo ID).
Nenhum campo extra no banco, nenhuma migration nova.

### Fluxo de upload de foto
```
1. App abre galeria via expo-image-picker
2. Usuário seleciona e recorta (crop quadrado 1:1)
3. App envia PATCH /api/users/me/avatar/ com multipart/form-data
4. Django recebe o arquivo e faz upload para Backblaze B2
   com a chave: avatars/{user_id}.jpg
5. Backblaze sobrescreve o arquivo anterior se existir
6. Django retorna a URL pública da imagem
7. App atualiza o estado local com a nova URL
```

### Fluxo de uma transação
```
1. App envia POST /api/expenses/
2. Django valida e salva (status: pending)
3. Retorna resposta IMEDIATA para o app
4. Task enviada para fila Celery
5. Worker pega a task
6. Chama Gemini 2.5 -> categoriza + gera insight comportamental
7. Gera embedding -> salva no pgvector
8. Atualiza despesa (status: processed)
9. App consulta GET /api/expenses/{id}/ -> já com categoria e insight
```

---

## 4. Infraestrutura e Deploy

### VPS (já configurado)
- IP: 72.62.9.242
- OS: Ubuntu 24.04 LTS
- Docker e Docker Compose instalados
- UFW habilitado (portas 22, 80, 443 abertas)
- Swap de 2GB configurado

### Domínio (Hostgator)
Configurar no painel DNS:

| Tipo | Nome | Valor       | TTL   |
|------|------|-------------|-------|
| A    | @    | 72.62.9.242 | 14400 |
| A    | api  | 72.62.9.242 | 14400 |

Resultado: https://api.seudominio.com.br -> Django Ninja

### Estrutura na VPS
```
/opt/aura/
├── .env
├── docker-compose.yml
├── Caddyfile
└── apps/
    └── api/
```

### Caddyfile
```
api.seudominio.com.br {
    reverse_proxy api:8000
}
```

### docker-compose.yml
```yaml
services:
  caddy:
    image: caddy:2-alpine
    container_name: aura_caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - aura_net

  db:
    image: pgvector/pgvector:pg16
    container_name: aura_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - aura_net

  redis:
    image: redis:7-alpine
    container_name: aura_redis
    restart: unless-stopped
    networks:
      - aura_net

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: aura_api
    restart: unless-stopped
    env_file: .env
    depends_on:
      - db
      - redis
    networks:
      - aura_net
    command: gunicorn core.wsgi:application --bind 0.0.0.0:8000

  worker:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: aura_worker
    restart: unless-stopped
    env_file: .env
    depends_on:
      - db
      - redis
    networks:
      - aura_net
    command: celery -A core worker --loglevel=info

volumes:
  caddy_data:
  caddy_config:
  pgdata:

networks:
  aura_net:
    driver: bridge
```

### GitHub Actions (CI/CD)
```yaml
name: Deploy Aura
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/aura
            git pull origin main
            docker compose up --build -d
            docker compose exec api python manage.py migrate
```

Secrets no GitHub: SSH_HOST, SSH_USER, SSH_PRIVATE_KEY

---

## 5. Estrutura de Pastas

```
aura/                                      <- RAIZ (abrir no VS Code)
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .env                                   <- NÃO versionar
├── .env.example                           <- versionar (sem valores reais)
├── .gitignore
├── docker-compose.yml
├── Caddyfile
└── apps/
    ├── api/                               <- BACKEND DJANGO
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   ├── manage.py
    │   ├── core/
    │   │   ├── settings.py
    │   │   ├── urls.py
    │   │   └── celery.py
    │   ├── users/
    │   │   ├── models.py
    │   │   ├── schemas.py
    │   │   ├── api.py
    │   │   └── services.py               <- lógica de upload para Backblaze
    │   ├── expenses/
    │   │   ├── models.py
    │   │   ├── schemas.py
    │   │   ├── api.py
    │   │   ├── services.py
    │   │   └── tasks.py
    │   ├── categories/
    │   │   ├── models.py
    │   │   ├── api.py
    │   │   └── fixtures/
    │   │       └── default_categories.json
    │   ├── ai/
    │   │   ├── gemini_client.py
    │   │   ├── categorizer.py
    │   │   ├── chat.py
    │   │   └── embeddings.py
    │   ├── dashboard/
    │   │   ├── schemas.py
    │   │   └── api.py
    │   └── notifications/
    │       ├── parsers.py
    │       ├── schemas.py
    │       └── api.py
    │
    └── mobile/                            <- APP REACT NATIVE
        ├── package.json
        ├── app.json
        ├── app/                           <- telas (Expo Router)
        │   ├── _layout.tsx
        │   ├── index.tsx
        │   ├── (auth)/
        │   │   ├── welcome.tsx
        │   │   ├── login.tsx
        │   │   └── register.tsx
        │   └── (app)/
        │       ├── _layout.tsx
        │       ├── home.tsx
        │       ├── expenses/
        │       │   ├── index.tsx
        │       │   └── add.tsx
        │       ├── dashboard.tsx
        │       └── profile/
        │           ├── index.tsx
        │           ├── edit-info.tsx
        │           ├── change-email.tsx
        │           ├── change-password.tsx
        │           └── delete-account.tsx
        └── src/
            ├── api/
            │   ├── client.ts
            │   ├── auth.ts
            │   ├── expenses.ts
            │   ├── dashboard.ts
            │   └── users.ts
            ├── store/
            │   ├── authStore.ts
            │   └── expenseStore.ts
            ├── components/
            │   ├── UserAvatar.tsx         <- foto do Backblaze ou iniciais como fallback
            │   ├── BudgetBar.tsx
            │   ├── ExpenseCard.tsx
            │   ├── CategoryBadge.tsx
            │   └── charts/
            │       ├── PieChart.tsx
            │       └── BarChart.tsx
            ├── hooks/
            │   ├── useExpenses.ts
            │   ├── useDashboard.ts
            │   └── useProfile.ts
            └── modules/
                └── NotificationListener/
                    ├── index.ts
                    └── android/
```

---

## 6. Modelos do Banco de Dados

### User (users/models.py)
```python
class User(AbstractUser):
    email          = EmailField(unique=True)
    phone          = CharField(max_length=20, blank=True)
    monthly_limit  = DecimalField(
                         max_digits=10, decimal_places=2,
                         null=True, blank=True
                     )
    # Sem campo de foto na tabela.
    # A foto é armazenada no Backblaze B2 com a chave avatars/{user_id}.jpg
    # A URL é construída dinamicamente no schema de resposta:
    # https://f000.backblazeb2.com/file/{BUCKET}/avatars/{user_id}.jpg
    created_at     = DateTimeField(auto_now_add=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']
```

Regras do teto:
- Valor único e fixo, válido para todos os meses
- O usuário atualiza quando quiser via tela de perfil
- O novo valor vale a partir do momento da atualização
- Comparativos do dashboard sempre usam o teto atual

### Category (categories/models.py)
```python
class Category(Model):
    name       = CharField(max_length=100)
    icon       = CharField(max_length=50, blank=True)    # nome do ícone no app
    color      = CharField(max_length=7, blank=True)     # hex: #FF5733
    is_system  = BooleanField(default=False)             # True = criada pela Aura
    user       = ForeignKey(User, null=True, blank=True) # null = categoria do sistema
    created_at = DateTimeField(auto_now_add=True)
```

Categorias padrão do sistema:
Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Assinaturas, Compras, Pets, Outros

### Expense (expenses/models.py)
```python
class ExpenseStatus(TextChoices):
    PENDING   = 'pending'    # aguardando IA
    PROCESSED = 'processed'  # categorizado pela IA
    MANUAL    = 'manual'     # corrigido pelo usuário
    ERROR     = 'error'      # falha no processamento

class ExpenseSource(TextChoices):
    APP          = 'app'          # lançado manualmente
    NOTIFICATION = 'notification' # capturado de notificação

class Expense(Model):
    user             = ForeignKey(User, on_delete=CASCADE)
    description      = CharField(max_length=255)
    amount           = DecimalField(max_digits=10, decimal_places=2)
    date             = DateField()
    category         = ForeignKey(Category, null=True, blank=True)
    status           = CharField(choices=ExpenseStatus, default=PENDING)
    source           = CharField(choices=ExpenseSource, default=APP)
    ai_insight       = TextField(blank=True)
    embedding        = VectorField(dimensions=768, null=True)  # pgvector
    raw_notification = TextField(blank=True)
    created_at       = DateTimeField(auto_now_add=True)
    updated_at       = DateTimeField(auto_now=True)
```

### Relacionamentos
```
User
 ├── monthly_limit  (teto fixo, atualizado pelo usuário quando quiser)
 ├── [foto no Backblaze B2 — sem campo no banco]
 ├──< Category      (categorias personalizadas)
 └──< Expense
        ├── category -> Category
        ├── status: pending | processed | manual | error
        └── source: app | notification
```

---

## 7. Sistema de Filas (Celery + Redis)

### Por que usar fila?
- Sem fila: app espera 2-5 segundos enquanto a API chama o Gemini
- Com fila: API retorna em milissegundos com status "pending", Celery processa em background
- Evita race conditions quando várias notificações chegam simultaneamente

### expenses/tasks.py
```python
@shared_task(bind=True, max_retries=3)
def categorize_expense(self, expense_id):
    try:
        expense = Expense.objects.get(id=expense_id)

        # 1. Categorizar com Gemini 2.5
        category, insight = categorize_with_gemini(
            description=expense.description,
            amount=expense.amount,
            user_context=get_user_context(expense.user)
        )

        # 2. Gerar embedding para RAG
        embedding = generate_embedding(expense.description)

        # 3. Salvar resultado
        expense.category   = category
        expense.ai_insight = insight
        expense.embedding  = embedding
        expense.status     = ExpenseStatus.PROCESSED
        expense.save()

    except Exception as exc:
        expense.status = ExpenseStatus.ERROR
        expense.save()
        raise self.retry(exc=exc, countdown=60)
```

---

## 8. Endpoints da API

### Autenticação /api/auth/
| Método | Endpoint            | Descrição     | Auth |
|--------|---------------------|---------------|------|
| POST   | /api/auth/register/ | Criar conta   | Não  |
| POST   | /api/auth/login/    | Login -> JWT  | Não  |
| POST   | /api/auth/refresh/  | Renovar token | Não  |

### Usuário /api/users/
| Método | Endpoint                       | Descrição                          | Auth |
|--------|--------------------------------|------------------------------------|------|
| GET    | /api/users/me/                 | Dados completos do perfil          | Sim  |
| PATCH  | /api/users/me/                 | Atualizar nome, telefone e/ou teto | Sim  |
| PATCH  | /api/users/me/avatar/          | Upload de foto (multipart)         | Sim  |
| DELETE | /api/users/me/avatar/          | Remover foto do Backblaze          | Sim  |
| POST   | /api/users/me/change-email/    | Trocar e-mail (requer senha atual) | Sim  |
| POST   | /api/users/me/change-password/ | Trocar senha (requer senha atual)  | Sim  |
| DELETE | /api/users/me/                 | Excluir conta (requer senha)       | Sim  |

Payload PATCH /api/users/me/:
```json
{
  "name": "Adriano Silva",
  "phone": "11999999999",
  "monthly_limit": 4500.00
}
```

Payload PATCH /api/users/me/avatar/:
```
Content-Type: multipart/form-data
Campo: avatar (arquivo de imagem JPG/PNG)
```

Resposta GET /api/users/me/:
```json
{
  "id": 1,
  "name": "Adriano Silva",
  "email": "adriano@email.com",
  "phone": "11999999999",
  "monthly_limit": 3000.00,
  "avatar_url": "https://f000.backblazeb2.com/file/aura-bucket/avatars/1.jpg",
  "has_avatar": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

> avatar_url é montado no schema: f"{B2_PUBLIC_URL}/avatars/{user.id}.jpg"
> has_avatar indica se o arquivo existe no Backblaze (verificado no upload/delete)
> O app usa avatar_url se has_avatar=true, caso contrário exibe as iniciais

Payload POST /api/users/me/change-email/:
```json
{
  "new_email": "novo@email.com",
  "current_password": "minhasenhaatual"
}
```

Payload POST /api/users/me/change-password/:
```json
{
  "current_password": "minhasenhaatual",
  "new_password": "minhanovalsenha",
  "confirm_new_password": "minhanovalsenha"
}
```

Payload DELETE /api/users/me/:
```json
{
  "current_password": "minhasenhaatual",
  "confirm": "EXCLUIR"
}
```

### Lógica do serviço Backblaze (users/services.py)
```python
import boto3  # Backblaze B2 é compatível com a API S3 da AWS

def get_b2_client():
    return boto3.client(
        's3',
        endpoint_url=settings.B2_ENDPOINT_URL,
        aws_access_key_id=settings.B2_KEY_ID,
        aws_secret_access_key=settings.B2_APP_KEY,
    )

def upload_avatar(user_id: int, file_bytes: bytes) -> str:
    client = get_b2_client()
    key = f"avatars/{user_id}.jpg"
    client.put_object(
        Bucket=settings.B2_BUCKET_NAME,
        Key=key,
        Body=file_bytes,
        ContentType='image/jpeg',
    )
    return f"{settings.B2_PUBLIC_URL}/{key}"

def delete_avatar(user_id: int):
    client = get_b2_client()
    client.delete_object(
        Bucket=settings.B2_BUCKET_NAME,
        Key=f"avatars/{user_id}.jpg"
    )
```

> Backblaze B2 é 100% compatível com a API S3 da AWS via boto3.
> Não precisa de SDK próprio do Backblaze.

### Despesas /api/expenses/
| Método | Endpoint            | Descrição            | Auth |
|--------|---------------------|----------------------|------|
| GET    | /api/expenses/      | Listar (com filtros) | Sim  |
| POST   | /api/expenses/      | Criar despesa manual | Sim  |
| GET    | /api/expenses/{id}/ | Detalhe              | Sim  |
| PATCH  | /api/expenses/{id}/ | Corrigir categoria   | Sim  |
| DELETE | /api/expenses/{id}/ | Remover              | Sim  |

Query params: ?month=2025-06 | ?category_id=3 | ?status=pending | ?page=1&page_size=20

Payload criação:
```json
{
  "description": "Almoço no restaurante",
  "amount": 45.90,
  "date": "2025-06-15",
  "category_id": null
}
```

Resposta:
```json
{
  "id": 123,
  "description": "Almoço no restaurante",
  "amount": 45.90,
  "date": "2025-06-15",
  "category": null,
  "status": "pending",
  "source": "app",
  "ai_insight": "",
  "created_at": "2025-06-15T12:00:00Z"
}
```

### Notificações /api/notifications/
| Método | Endpoint                   | Descrição                     | Auth |
|--------|----------------------------|-------------------------------|------|
| POST   | /api/notifications/ingest/ | Receber notificação do celular| Sim  |

Payload:
```json
{
  "app_package": "com.nu.bank",
  "app_name": "Nubank",
  "title": "Compra aprovada",
  "body": "Compra de R$ 89,90 no IFOOD aprovada",
  "timestamp": "2025-06-15T13:30:00Z"
}
```

### Categorias /api/categories/
| Método | Endpoint              | Descrição           | Auth |
|--------|-----------------------|---------------------|------|
| GET    | /api/categories/      | Listar todas        | Sim  |
| POST   | /api/categories/      | Criar personalizada | Sim  |
| DELETE | /api/categories/{id}/ | Deletar própria     | Sim  |

### Dashboard /api/dashboard/
| Método | Endpoint                              | Descrição            | Auth |
|--------|---------------------------------------|----------------------|------|
| GET    | /api/dashboard/summary/               | Resumo do mês atual  | Sim  |
| GET    | /api/dashboard/monthly/{year}/{month}/| Mês específico       | Sim  |
| GET    | /api/dashboard/categories/            | Gastos por categoria | Sim  |
| GET    | /api/dashboard/history/               | Últimos 6 meses      | Sim  |

Resposta summary:
```json
{
  "month": "2025-06",
  "total_spent": 2340.50,
  "monthly_limit": 3000.00,
  "limit_percentage": 78.0,
  "remaining": 659.50,
  "alert_level": "warning",
  "total_transactions": 47,
  "top_category": {
    "name": "Alimentação",
    "amount": 890.00,
    "percentage": 38.0
  }
}
```

Níveis de alerta: 0-70% = ok (verde) | 70-90% = warning (amarelo) | 90%+ = danger (vermelho)

### Chat /api/chat/
| Método | Endpoint            | Descrição        | Auth |
|--------|---------------------|------------------|------|
| POST   | /api/chat/message/  | Enviar mensagem  | Sim  |
| GET    | /api/chat/history/  | Histórico        | Sim  |
| DELETE | /api/chat/history/  | Limpar histórico | Sim  |

---

## 9. Integração com IA (Gemini 2.5)

### Cliente
```python
import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')
```

### Categorização automática
```
Você é um assistente financeiro especialista em comportamento de consumo.
Categorize esta despesa e forneça um insight comportamental.

Despesa: "{description}" — R$ {amount}
Categorias disponíveis: {lista}
Contexto recente: {ultimas_despesas}

Responda APENAS em JSON:
{
  "category": "nome_da_categoria",
  "confidence": 0.95,
  "insight": "Uma frase sobre o padrão de comportamento"
}
```

### Chat financeiro
Contexto montado antes de cada mensagem:
1. Resumo do mês (total, teto, alerta)
2. Últimas 10 despesas
3. Histórico dos últimos 3 meses
4. 5 despesas mais similares à pergunta via busca vetorial (RAG)
5. Histórico do chat (últimas 10 mensagens)

```
Você é a Aura, assistente financeira com análise comportamental.
Teto mensal: R$ {monthly_limit}
Gasto este mês: R$ {total_spent} ({percentage}% do teto)
Maior gasto: {top_category} — R$ {top_amount}
Histórico: {monthly_history}

Seja direta, empática e use os dados reais.
Nunca dê respostas genéricas.
```

### Memória vetorial (RAG)
```
Ao processar despesa:
  -> Gerar embedding (768 dimensões) da descrição
  -> Salvar no campo embedding (pgvector)

Ao responder no chat:
  -> Gerar embedding da pergunta
  -> SELECT * FROM expenses ORDER BY embedding <=> query_embedding LIMIT 5
  -> Incluir resultado no contexto do prompt
```

---

## 10. Captura via Notificação do Celular

### Por que módulo nativo Android?
- Expo Notifications só recebe push do próprio servidor
- Para ler notificações de outros apps é preciso NotificationListenerService do Android
- Isso exige Expo bare workflow para incluir código Kotlin nativo
- iOS não permite leitura de notificações de terceiros -> Android first

### Fluxo no app
```
1. Usuário concede permissão especial:
   Configurações -> Acesso a Notificações -> Aura (ON)
2. NotificationListenerService fica ativo em background
3. App bancário envia notificação de compra
4. Serviço nativo intercepta e passa para o módulo TypeScript
5. Módulo verifica se é de app bancário suportado
6. Extrai valor e descrição via parser (regex por banco)
7. Envia POST /api/notifications/ingest/ com JWT
8. API cria despesa (pending) e envia para fila Celery
```

### Apps bancários suportados no MVP
Nubank, Itaú, Bradesco, Banco do Brasil, Mercado Pago, PicPay, Inter

### Proteção contra duplicatas
```
Verificar antes de criar:
  user + valor igual + source=notification + criado há menos de 2 minutos
  -> Se encontrar: ignorar, retornar ID da existente
  -> Se não encontrar: criar normalmente
```

---

## 11. Dashboard e Relatórios

```
Gráfico de pizza:    GET /api/dashboard/categories/?month=2025-06
Gráfico de barras:   GET /api/dashboard/history/
Barra de progresso:  (total_spent / monthly_limit) x 100
Alerta de teto:      ok (verde) | warning (amarelo) | danger (vermelho)
```

---

## 12. App Mobile (React Native + Expo)

### Setup inicial
```bash
npx create-expo-app@latest mobile --template bare-minimum
cd mobile
npx expo install expo-router expo-secure-store expo-image-picker
npm install axios zustand victory-native nativewind
```

### Componente UserAvatar
Exibe a foto do Backblaze se disponível. Fallback automático para iniciais se
has_avatar=false ou se a imagem falhar ao carregar.

```tsx
// src/components/UserAvatar.tsx
export const UserAvatar = ({ avatarUrl, hasAvatar, name, size = 40 }) => {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('')

  if (hasAvatar && avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        // Fallback automático se a imagem falhar
        onError={() => setShowFallback(true)}
      />
    )
  }

  // Fallback: círculo com iniciais
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2,
                   backgroundColor: '#6C63FF', alignItems: 'center',
                   justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{initials}</Text>
    </View>
  )
}
```

---

### Telas do MVP

#### Onboarding (/auth/welcome)
- 3 slides apresentando a Aura
- Botões: "Criar conta" e "Já tenho conta"

---

#### Cadastro (/auth/register)
- Campos: nome, e-mail, senha
- Telefone (opcional)
- Teto mensal (opcional — pode configurar depois no perfil)

---

#### Login (/auth/login)
- E-mail e senha
- Token JWT salvo no expo-secure-store (criptografado no dispositivo)

---

#### Home (/home)
```
┌─────────────────────────────┐
│ [foto/AS]  Olá, Adriano 👋  │  <- UserAvatar (foto ou iniciais)
│            Junho 2025       │
├─────────────────────────────┤
│  TETO DO MÊS                │
│  [=======---------] 78%     │  <- barra colorida por alert_level
│  R$ 2.340 de R$ 3.000       │
│  Faltam R$ 659,50  ⚠️       │
├─────────────────────────────┤
│  ÚLTIMAS DESPESAS           │
│  ┌─────────────────────┐    │
│  │ 🍔 Alimentação      │    │
│  │ iFood  R$ 42,90  ⏳ │    │  <- pending = relógio
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 🚗 Transporte       │    │
│  │ Uber   R$ 18,50  ✓  │    │  <- processed = check
│  └─────────────────────┘    │
├─────────────────────────────┤
│       [+ Adicionar]         │
└─────────────────────────────┘
```

---

#### Lista de Despesas (/expenses)
- Seletor de mês no topo
- Filtro por categoria
- Pull-to-refresh
- Card com: descrição, valor, categoria, data, status
- Tap no card -> detalhe com opção de corrigir categoria

---

#### Adicionar Despesa (/expenses/add)
- Descrição (texto livre)
- Valor (teclado numérico)
- Data (date picker, padrão hoje)
- Categoria (opcional — deixar para a IA)
- Botão "Salvar" -> POST imediato + feedback visual

---

#### Dashboard (/dashboard)
```
┌─────────────────────────────┐
│ [< Maio]  Junho 2025  [Jul >]│
├─────────────────────────────┤
│  GASTOS POR CATEGORIA       │
│  [Gráfico de Pizza]         │
│  🍔 Alimentação  38%        │
│  🚗 Transporte   22%        │
│  🏠 Moradia      18%        │
├─────────────────────────────┤
│  HISTÓRICO (6 meses)        │
│  [Gráfico de Barras]        │
│  - - - - - - (linha do teto)│
│  |   |   ||| |   |   |||    │
│  Jan Fev Mar Abr Mai Jun    │
└─────────────────────────────┘
```

---

#### Perfil (/profile)
```
┌─────────────────────────────┐
│    [foto/AS]  Adriano Silva │  <- UserAvatar (grande, 80px)
│        adriano@email.com    │
│      [Alterar foto]         │  -> abre galeria via expo-image-picker
├─────────────────────────────┤
│  CONTA                      │
│  > Editar informações       │  -> /profile/edit-info
│  > Alterar e-mail           │  -> /profile/change-email
│  > Alterar senha            │  -> /profile/change-password
├─────────────────────────────┤
│  FINANÇAS                   │
│  Teto mensal atual          │
│  R$ 3.000,00                │
│  [Atualizar teto]           │  -> modal inline
├─────────────────────────────┤
│  NOTIFICAÇÕES               │
│  Captura automática  [ON]   │
│  Apps monitorados    (7)    │
├─────────────────────────────┤
│  [Sair]                     │
│  [Excluir minha conta]      │
└─────────────────────────────┘
```

Upload de foto de perfil (fluxo no app):
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],   // crop quadrado obrigatório
  quality: 0.8,
})

const formData = new FormData()
formData.append('avatar', {
  uri: result.assets[0].uri,
  type: 'image/jpeg',
  name: 'avatar.jpg',
})

const response = await client.patch('/api/users/me/avatar/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
// Atualiza authStore com a nova avatar_url retornada
```

---

#### Editar Informações (/profile/edit-info)
- Nome completo (pré-preenchido)
- Telefone (pré-preenchido)
- Botão "Salvar" -> PATCH /api/users/me/

---

#### Alterar E-mail (/profile/change-email)
- Novo e-mail
- Confirmar novo e-mail
- Senha atual (confirmação de segurança)
- Botão "Confirmar" -> POST /api/users/me/change-email/

---

#### Alterar Senha (/profile/change-password)
- Senha atual
- Nova senha
- Confirmar nova senha
- Validação de força em tempo real
- Botão "Confirmar" -> POST /api/users/me/change-password/

---

#### Atualizar Teto (modal inline no perfil)
```
┌─────────────────────────────┐
│  Atualizar teto mensal      │
│  Teto atual: R$ 3.000,00    │
│                             │
│  Novo teto: [R$ _________]  │
│                             │
│  Vale para todos os meses   │
│  a partir de agora.         │
│                             │
│  [Cancelar]     [Salvar]    │
└─────────────────────────────┘
```

---

#### Excluir Conta (/profile/delete-account)
```
┌─────────────────────────────┐
│  ⚠️  EXCLUIR CONTA          │
│  Esta ação é irreversível.  │
│                             │
│  Serão apagados:            │
│  • Perfil e histórico       │
│  • Foto de perfil           │
│  • Todas as despesas        │
│  • Conversas com a Aura     │
│                             │
│  Digite sua senha:          │
│  [___________________]      │
│                             │
│  [Cancelar] [Excluir tudo]  │
│  (botão só habilita com     │
│   senha preenchida)         │
└─────────────────────────────┘
```

DELETE /api/users/me/
-> apaga registro no banco
-> apaga avatars/{user_id}.jpg no Backblaze
-> logout automático -> redireciona para Onboarding

---

### Estado global (Zustand)
- authStore: token, user (com avatar_url e has_avatar), login(), logout(), updateUser()
- expenseStore: expenses[], isLoading, fetchExpenses(), addExpense()

### Cliente HTTP com JWT automático
```typescript
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
// Se 401: tenta renovar com refresh token
// Se falhar: logout e redireciona para /auth/login
```

---

## 13. Fases de Desenvolvimento

### FASE 1 — Infraestrutura Base
Entrega: Servidor funcionando, CI/CD ativo, domínio com HTTPS

- [ ] Criar estrutura de pastas (aura/apps/api e aura/apps/mobile)
- [ ] Configurar docker-compose.yml (db, redis, api, worker, caddy)
- [ ] Criar Dockerfile da API Django
- [ ] Criar repositório privado no GitHub
- [ ] Configurar DNS no Hostgator (@ e api apontando para VPS)
- [ ] Configurar secrets no GitHub (SSH_HOST, SSH_USER, SSH_PRIVATE_KEY)
- [ ] Criar .github/workflows/deploy.yml
- [ ] Criar bucket no Backblaze B2 e anotar credenciais
- [ ] Primeiro git push -> verificar containers na VPS
- [ ] Confirmar HTTPS em https://api.seudominio.com.br

### FASE 2 — Django Base + Autenticação
Entrega: Cadastro, login e JWT funcionando

- [ ] Iniciar projeto Django em apps/api/
- [ ] Instalar e configurar django-ninja e django-ninja-jwt
- [ ] Criar app users/ com model User (sem campo de foto)
- [ ] Implementar services.py com upload_avatar() e delete_avatar() via boto3
- [ ] Criar endpoints: register, login, refresh
- [ ] Criar endpoints de perfil: me, update, avatar upload, avatar delete
- [ ] Criar endpoints: change-email, change-password, delete account
- [ ] Configurar Celery com Redis
- [ ] Testar no Swagger (/api/docs)

### FASE 3 — Categorias e Despesas
Entrega: Lançar despesa e ver fila com status pending

- [ ] Criar app categories/ com model e fixture padrão
- [ ] Criar app expenses/ com model Expense completo
- [ ] Criar endpoints CRUD de despesas (filtros + paginação)
- [ ] Criar task Celery categorize_expense (mock por enquanto)
- [ ] Ao criar despesa -> disparar task -> retornar status pending
- [ ] Endpoint PATCH para corrigir categoria manualmente
- [ ] Testar fluxo completo via Swagger

### FASE 4 — Integração com Gemini 2.5
Entrega: IA categorizando despesas automaticamente

- [ ] Criar app ai/ com cliente do Gemini 2.5 Flash
- [ ] Implementar categorize_with_gemini() com prompt estruturado
- [ ] Integrar com a task Celery (substituir mock)
- [ ] Implementar geração de embeddings com pgvector
- [ ] Testar: POST despesa -> fila -> Gemini -> status processed

### FASE 5 — Dashboard e Relatórios
Entrega: Dados prontos para o app

- [ ] Criar app dashboard/ com queries de agregação
- [ ] Endpoint summary/ com teto, total, percentual e alerta
- [ ] Endpoint categories/ com gastos por categoria
- [ ] Endpoint history/ com últimos 6 meses
- [ ] Testar com dados reais no banco

### FASE 6 — Chat com a Aura
Entrega: Conversar com a IA sobre as próprias finanças

- [ ] Criar model ChatMessage para histórico
- [ ] Implementar ai/chat.py com montagem de contexto financeiro
- [ ] Implementar busca vetorial (RAG)
- [ ] Criar endpoints: POST message, GET history, DELETE history
- [ ] Testar: "Onde gastei mais?", "Estou perto do limite?"

### FASE 7 — App Mobile Base
Entrega: App funcionando com todas as telas

- [ ] Criar projeto Expo bare workflow em apps/mobile/
- [ ] Configurar Expo Router com estrutura (auth) e (app)
- [ ] Configurar NativeWind e Axios com interceptors JWT
- [ ] Configurar Zustand (authStore, expenseStore)
- [ ] Implementar componente UserAvatar (foto + fallback de iniciais)
- [ ] Implementar telas de auth: Onboarding, Login, Registro
- [ ] Implementar Home com barra de teto e últimas despesas
- [ ] Implementar Lista de Despesas com filtros e pull-to-refresh
- [ ] Implementar Adicionar Despesa
- [ ] Implementar Dashboard com gráficos de pizza e barras
- [ ] Implementar tela principal de Perfil com UserAvatar grande
- [ ] Implementar upload de foto via expo-image-picker
- [ ] Implementar Editar Informações (nome e telefone)
- [ ] Implementar Alterar E-mail
- [ ] Implementar Alterar Senha (com validação de força)
- [ ] Implementar modal de Atualizar Teto Mensal
- [ ] Implementar tela de Excluir Conta
- [ ] Gerar APK e testar no celular

### FASE 8 — Captura de Notificações
Entrega: Despesas criadas automaticamente pelo celular

- [ ] Criar módulo nativo Android (NotificationListenerService em Kotlin)
- [ ] Criar bridge TypeScript para o módulo nativo
- [ ] Implementar parsers dos apps bancários suportados
- [ ] Criar app notifications/ no Django com endpoint ingest/
- [ ] Implementar deduplicação de notificações
- [ ] Integrar com fila Celery
- [ ] Testar com notificações reais de cada banco
- [ ] Implementar toggle e onboarding do listener na tela de perfil

### FASE 9 — Polimento e Estabilização
Entrega: Produto estável para uso real

- [ ] Rate limiting nos endpoints da API
- [ ] Logs estruturados (API, worker, erros da IA)
- [ ] Backup automático do banco (script + cron)
- [ ] Tratamento de erros no app (toasts, estados de erro)
- [ ] Loading states em todas as telas
- [ ] Revisão de permissões (usuário só vê próprios dados)
- [ ] Testes das tasks Celery e parsers de notificação
- [ ] Documentação Swagger finalizada

---

## 14. Variáveis de Ambiente

### .env.example (versionar no Git)
```env
# Django
SECRET_KEY=troque-por-uma-chave-aleatoria-longa
DEBUG=False
ALLOWED_HOSTS=api.seudominio.com.br,localhost

# Banco de dados
DB_USER=aura_user
DB_PASSWORD=senha_segura_aqui
DB_NAME=aura_db
DB_HOST=db
DB_PORT=5432

# Redis / Celery
REDIS_URL=redis://redis:6379/0

# Google Gemini
GEMINI_API_KEY=sua_api_key_do_google_ai_studio

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=30

# Backblaze B2
B2_KEY_ID=seu_key_id_do_backblaze
B2_APP_KEY=sua_app_key_do_backblaze
B2_BUCKET_NAME=aura-bucket
B2_ENDPOINT_URL=https://s3.us-west-004.backblazeb2.com
B2_PUBLIC_URL=https://f000.backblazeb2.com/file/aura-bucket
```

> B2_ENDPOINT_URL e B2_PUBLIC_URL variam conforme a região do bucket criado no Backblaze.
> Pegar os valores exatos no painel do Backblaze após criar o bucket.

### .env do app mobile (apps/mobile/.env)
```env
EXPO_PUBLIC_API_URL=https://api.seudominio.com.br
```

---

## 15. Dependências

### Backend (apps/api/requirements.txt)
```
django==5.0.6
django-ninja==1.2.1
django-ninja-jwt==5.3.1
psycopg2-binary==2.9.9
pgvector==0.3.2
celery==5.4.0
redis==5.0.7
django-celery-results==2.5.1
google-generativeai==0.7.2
python-decouple==3.8
django-cors-headers==4.4.0
django-ratelimit==4.1.0
boto3==1.34.0
gunicorn==22.0.0
```

> boto3 é o SDK da AWS mas funciona com Backblaze B2 pois o B2 é compatível com a API S3.
> Não é necessário nenhum SDK específico do Backblaze.

### App Mobile (principais)
```
expo ~51.0.0
expo-router ~3.5.0
expo-secure-store ~13.0.0
expo-image-picker ~15.0.0
react-native 0.74.0
axios ^1.7.0
zustand ^4.5.0
victory-native ^41.0.0
nativewind ^4.0.0
```

---

*Documento gerado antes do início do desenvolvimento.*
*Todas as fases devem ser concluídas em ordem.*
*Não iniciar a Fase N+1 sem testar e confirmar a Fase N.*