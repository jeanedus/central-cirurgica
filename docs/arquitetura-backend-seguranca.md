# Arquitetura inicial de backend e segurança

## Objetivo

Preparar a Central Cirúrgica para sair do armazenamento exclusivo no navegador e passar a usar banco de dados PostgreSQL com autenticação, isolamento por usuário e trilha de auditoria.

A primeira integração proposta usa Supabase (PostgreSQL + Auth). O frontend pode continuar hospedado no GitHub Pages. A integração será feita em uma etapa separada, depois que o projeto Supabase for criado e as configurações públicas forem fornecidas.

## Princípios

1. **Não interromper o protótipo atual.** O armazenamento local permanece como modo de demonstração até a migração estar testada.
2. **Negar por padrão.** Todas as tabelas de negócio terão RLS habilitado; cada usuário só acessa registros cujo `owner_id` corresponda a `auth.uid()`.
3. **Minimização.** A primeira versão do banco não terá nome, CPF, endereço, telefone, prontuário ou descrição clínica livre de pacientes. O campo `patient_ref` deve ser um código interno não identificável.
4. **Privilégio mínimo.** A chave `service_role` nunca será colocada no navegador, no repositório ou em variáveis públicas. O frontend usará apenas a chave publicável/anon, protegida por RLS.
5. **Auditoria.** Alterações em procedimentos e cirurgias serão registradas em tabela de auditoria.
6. **Separação de módulos.** A camada de acesso a dados será isolada em `src/services/`; os módulos de interface não devem chamar diretamente APIs do Supabase.
7. **Dados reais somente após validação.** A integração inicial é técnica; antes de qualquer uso assistencial ou operacional real, será necessária revisão de segurança, privacidade/LGPD, backup, retenção, contratos e testes.

## Modelo inicial

- `profiles`: perfil mínimo associado ao usuário autenticado.
- `procedures`: biblioteca de procedimentos de cada usuário.
- `surgeries`: registros administrativos de cirurgias, sem dados identificáveis de pacientes.
- `audit_logs`: trilha de criação, atualização e exclusão lógica/física dos registros de negócio.

Todas as tabelas de negócio têm `owner_id`. A arquitetura inicial isola os dados por usuário. Compartilhamento entre membros de uma clínica será implementado posteriormente com entidades de organização e associação, sem relaxar as políticas atuais.

## Fluxo de implantação

1. Criar um projeto Supabase na região adequada e habilitar autenticação por e-mail.
2. Executar a migration SQL em `supabase/migrations/` pelo SQL Editor ou CLI.
3. Confirmar RLS e políticas com dois usuários de teste distintos.
4. Configurar no frontend somente a URL do projeto e a chave publicável/anon.
5. Criar uma camada de repositório assíncrona e migrar um módulo por vez.
6. Testar migração, erros de rede, sessão expirada e isolamento de dados.
7. Só depois planejar a importação de dados de demonstração.

## Configurações e segredos

- URL Supabase: configuração pública.
- Chave publishable/anon: pode estar no frontend apenas com RLS corretamente habilitado e testado.
- Chave `service_role`, senhas, tokens privados e chaves de backup: nunca inserir no frontend, GitHub ou issues.
- Preferir GitHub Actions Secrets para automações futuras; não são necessários nesta etapa.

## Limitações ainda abertas

- A autenticação e o banco ainda não estão conectados ao frontend.
- Não há ainda perfis administrativos, equipes, compartilhamento por clínica ou MFA obrigatório.
- Não há upload de documentos; quando implementado, deverá usar Storage privado e políticas de acesso.
- Não há módulo de faturamento/contas a pagar e receber detalhado nesta migration.
- Não utilizar dados reais de pacientes nesta fase.
