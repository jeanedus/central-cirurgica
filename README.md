# Central Cirúrgica

Sistema modular para gestão de solicitações cirúrgicas, procedimentos, materiais, documentos e acompanhamento financeiro.

## Versão atual: 0.1.0 — protótipo navegável

A primeira versão contém:
- Painel inicial com indicadores demonstrativos.
- Cadastro local de procedimentos.
- Registro local de cirurgias.
- Acompanhamento inicial de status.
- Campos financeiros básicos de previsão e recebimento.

## Executar localmente

Como esta versão usa módulos JavaScript nativos, execute um servidor estático na raiz do projeto. Exemplo com Node.js instalado:

```bash
npx serve .
```

Depois abra o endereço local informado pelo comando.

Também é possível publicar o protótipo pelo GitHub Pages: **Settings → Pages → Deploy from a branch → main → /(root)**. Após salvar, o GitHub exibirá o endereço público do site. O repositório pode continuar privado, mas a disponibilidade do GitHub Pages em repositórios privados depende do plano e das configurações da conta.

## Aviso importante de segurança

**Esta versão é apenas um protótipo de interface. Não utilize dados reais, nomes, documentos, informações clínicas ou identificadores de pacientes.** Os registros são salvos no localStorage do navegador, sem autenticação, criptografia de dados em repouso, sincronização entre dispositivos ou controles adequados para dados pessoais sensíveis.

Antes de qualquer uso assistencial ou operacional real, será necessário implementar backend, banco de dados protegido, autenticação, autorização por perfil, trilha de auditoria, backups, política de retenção e controles de privacidade/LGPD.

## Arquitetura modular

- `src/core/`: funções compartilhadas e acesso a dados.
- `src/modules/`: módulos funcionais independentes.
- `src/main.js`: inicialização e navegação.
- `src/styles.css`: identidade visual e componentes de interface.
- `docs/`: especificações funcionais e decisões de arquitetura.

## Próximas etapas

1. Criar o projeto Supabase e aplicar `supabase/migrations/0001_initial_schema.sql`.
2. Testar autenticação e isolamento de dados com usuários distintos.
3. Integrar o frontend por uma camada de serviços, mantendo o modo de demonstração até a validação.
4. Procedimentos, TUSS, SIGTAP e materiais/OPME.
5. Solicitações e geração de documentos.
6. Descrições operatórias.
7. Consentimentos e orientações.
8. Gestão financeira detalhada e relatórios.

A arquitetura proposta para banco, autenticação, RLS e auditoria está em `docs/arquitetura-backend-seguranca.md`.

## Desenvolvimento

Mantenha cada domínio em seu próprio módulo e concentre regras compartilhadas em `src/core`. Mudanças em um módulo devem ser acompanhadas por testes próprios e revisão de compatibilidade.
