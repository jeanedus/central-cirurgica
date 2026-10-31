# Backend — Central Cirúrgica

API própria em Node.js + TypeScript + Express, PostgreSQL e Prisma.

## Requisitos

- Docker Desktop em execução.
- Docker Compose v2.

## Inicialização na raiz do repositório

1. Copie o arquivo .env.example para .env.
2. Defina POSTGRES_PASSWORD com uma senha longa e exclusiva. Neste primeiro ambiente local, use apenas letras e números para evitar problemas de codificação na URL de conexão.
3. Execute:

```bash
docker compose up --build
```

O Docker iniciará o PostgreSQL, aguardará o banco ficar saudável, aplicará as migrações Prisma e iniciará a API.

## Verificações

- API: http://localhost:3333/api/health
- Conexão com banco: http://localhost:3333/api/health/database

Resposta esperada do health check do banco:

```json
{"status":"ok","database":"connected"}
```

## Parar e reiniciar

- Parar: `docker compose down`
- Reiniciar: `docker compose up -d`
- Ver logs: `docker compose logs -f api`
- Parar e apagar também o banco local: `docker compose down -v` (apaga os dados).

Esta etapa ainda não implementa login nem endpoints de negócio. Não utilizar dados reais ou identificáveis de pacientes.
