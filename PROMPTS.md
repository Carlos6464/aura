# AURA — Prompts de Desenvolvimento

Referência de prompts para usar no Claude Code durante o desenvolvimento.
Para comandos rápidos, use os atalhos em `.claude/commands/`.

---

## 🚀 Iniciando uma Fase
```
Vamos iniciar a [FASE X — Nome da Fase].
Leia o CLAUDE.md, verifique o que já existe no projeto
e gere todos os arquivos necessários para completar essa fase.
Não avance além do escopo dela.
```

---

## 📄 Gerando um Arquivo Específico
```
Gere o arquivo [caminho/do/arquivo.py] completo e funcional,
seguindo a stack e estrutura definidas no CLAUDE.md.
Sem placeholders, sem TODOs — código pronto para rodar.
```

---

## 🔍 Revisando o que Foi Feito
```
Revise tudo que foi criado na [FASE X].
Verifique se todos os itens do Definition of Done foram atendidos,
se há erros, imports faltando ou inconsistências com o CLAUDE.md.
Liste o que está ok e o que precisa de ajuste.
```

---

## 🐛 Corrigindo um Erro
```
Recebi esse erro ao rodar o projeto:

[cole o erro aqui]

Contexto: estou na [FASE X], rodei o comando [comando usado].
Analise a causa raiz e corrija sem quebrar o que já funciona.
```

---

## ✅ Testando um Endpoint
```
Preciso testar o endpoint [MÉTODO /api/rota/].
Gere o comando curl completo com payload de exemplo
e me diga o que esperar como resposta de sucesso.
```

---

## 🔄 Refatorando sem Quebrar
```
Refatore o arquivo [caminho/arquivo.py] para [motivo].
Mantenha o comportamento atual, não altere outros arquivos
e garanta que está consistente com o CLAUDE.md.
```

---

## 🐳 Problemas com Docker
```
O container [nome do container] está com problema.
Saída do docker compose logs:

[cole os logs aqui]

Diagnostique e corrija o docker-compose.yml ou o Dockerfile
sem alterar a estrutura de serviços definida no projeto.
```

---

## 📦 Adicionando uma Dependência
```
Preciso adicionar [nome da lib] ao projeto para [finalidade].
Verifique se já não existe algo equivalente na stack atual,
adicione ao requirements.txt ou package.json e mostre
como configurar corretamente no projeto.
```

---

## 🧩 Criando um Endpoint Novo
```
Crie o endpoint [MÉTODO /api/rota/] seguindo o padrão
dos outros endpoints do projeto.
Entrada esperada: [descreva o payload]
Saída esperada: [descreva a resposta]
Inclua validação, autenticação JWT e tratamento de erro.
```

---

## 🤖 Integrando com o Gemini
```
Implemente a função [nome da função] em ai/[arquivo].py
que chama o Gemini 2.5 Flash para [objetivo].
Use o cliente já configurado no projeto, trate erros de API
e retorne o resultado no formato [descreva o formato].
```

---

## 📱 Criando uma Tela Mobile
```
Crie a tela [nome da tela] em app/[rota].tsx.
Ela deve [descreva o comportamento].
Use NativeWind para estilo, Zustand para estado global
e Axios para chamadas à API. Siga o padrão das telas existentes.
```

---

## 🔐 Verificando Segurança
```
Revise o arquivo [caminho/arquivo] em busca de:
- Dados sensíveis expostos
- Endpoints sem autenticação JWT
- Usuário acessando dados de outro usuário
- Variáveis de ambiente hardcoded
Aponte os problemas e corrija cada um.
```

---

## 📊 Avançando de Fase
```
A [FASE X] está concluída e testada.
Atualize o CLAUDE.md marcando ela como ✅
e ajuste a linha FASE ATUAL para [FASE X+1 — Nome].
```