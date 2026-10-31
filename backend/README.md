# Backend — Central Cirúrgica

API própria em Node.js + TypeScript + Express, PostgreSQL e Prisma.

## Requisitos

- Docker Desktop em execução.
- Docker Compose v2.

## Inicialização na raiz do repositório

1. Copie o arquivo .env.example para .env.
2. Defina POSTGRES_PASSWORD com uma senha longa e exclusiva. Neste ambiente local, use apenas letras e números.
3. Defina AUTH_JWT_SECRET com pelo menos 32 caracteres aleatórios. Não reutilize a senha do banco.
4. Execute:

```bash
docker compose up --build
```

O Docker iniciará o PostgreSQL, aguardará o banco ficar saudável, aplicará as migrações Prisma e iniciará a API.

## Verificações

- API: http://localhost:3333/api/health
- Conexão com banco: http://localhost:3333/api/health/database

## Autenticação inicial

- `POST /api/auth/register`: cria usuário, organização e vínculo OWNER.
- `POST /api/auth/login`: autentica e retorna token Bearer válido por 8 horas.
- `GET /api/auth/me`: retorna usuário e organizações; exige `Authorization: Bearer <token>`.

Exemplo de cadastro:

```json
{
  "name": "Minha Clínica",
  "displayName": "Nome do profissional",
  "email": "profissional@exemplo.com",
  "password": "uma-senha-forte-com-12-caracteres"
}
```

A API armazena senhas com bcrypt e aplica limitação de tentativas nas rotas de autenticação. O cadastro público está habilitado apenas para desenvolvimento inicial; antes de disponibilizar o produto publicamente, implementar convite/verificação de e-mail, recuperação de senha, política de sessão, monitoramento e revisão de segurança.

## Parar e reiniciar

- Parar: `docker compose down`
- Reiniciar: `docker compose up -d`
- Ver logs: `docker compose logs -f api`
- Parar e apagar também o banco local: `docker compose down -v` (apaga os dados).

Não utilizar dados reais ou identificáveis de pacientes nesta fase.

## Frontend com tela de acesso

Após atualizar o projeto, inicie um servidor estático na raiz do repositório em outra janela do terminal:

```bash
npx serve -l 5500 .
```

Acesse http://localhost:5500. A tela de login se comunica com a API em http://localhost:3333. O token fica em sessionStorage e é removido ao sair ou fechar a sessão do navegador.

A interface inicial usa dados demonstrativos do navegador para os módulos antigos. O login autentica na API, mas ainda não significa que os registros de cirurgias e procedimentos estejam sendo persistidos no PostgreSQL ou isolados por organização. Não inserir dados reais de pacientes.
