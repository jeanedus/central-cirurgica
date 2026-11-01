# Revisão arquitetural — biblioteca de codificação cirúrgica

**Projeto:** Central Cirúrgica  
**Escopo:** revisão do modelo Prisma, API e interface de catálogo existentes, considerando as extrações do Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral — 3ª edição (SBC/SBOT & SBN, 2025), os materiais auxiliares e a arquitetura funcional já registrada.

**Status:** análise e proposta. Este documento não altera schema, migrations, API, frontend ou banco de dados.

---

## 1. Resumo executivo

A implementação atual de `ProcedureCode` é adequada apenas como um catálogo manual simples, mas não representa os requisitos de codificação clínica, contratual e histórica identificados durante a extração dos dez capítulos do manual.

A estrutura atual:
- enumera somente TUSS e SIGTAP;
- guarda código, descrição, observações e vínculo opcional a um procedimento;
- limita unicidade por organização, sistema e código;
- não guarda versão/competência, vigência, fonte, página ou validação;
- não representa CBHPM nem códigos citados em manuais de sociedades;
- não modela cenários, papéis dos códigos, multiplicadores, unidades de contagem, condições, exceções ou exclusões;
- não cria vínculo entre os códigos de uma cirurgia e os estados de solicitação, autorização, execução, faturamento e recebimento.

**Recomendação:** não ampliar o catálogo atual com novos campos avulsos. Evoluir para um modelo de catálogo versionado, regras explicáveis e snapshots por cirurgia, mantendo a estrutura de pedidos e pagamentos separada.

---

## 2. Estado atual confirmado no repositório

Arquivos examinados:
- `backend/prisma/schema.prisma` — blob SHA `338a026315a51aed9efb2c9947af132533f1aa26`.
- `backend/prisma/migrations/20261101130000_add_procedure_codes/migration.sql` — blob SHA `305ec363e97e39b02432657686497d907bc2012b`.
- `backend/src/modules/procedure-codes/procedure-codes.routes.ts` — blob SHA `8256070871a5952196c56c64bcce2957da7176a1`.
- `src/modules/procedures.js` — blob SHA `e56b10ac7b084fa0011207c0c69e74a8e29e4dee`.
- `backend/src/app.ts` — blob SHA `50345996c1ddafe9dcda1717e1e5b7c93ef52552`.

### 2.1 Modelo Prisma atual

O enum `ProcedureCodeSystem` contém apenas:
- `TUSS`
- `SIGTAP`

O modelo `ProcedureCode` contém:
- `organizationId`
- `procedureId` opcional
- `system`
- `code`
- `description`
- `notes`
- `active`
- timestamps

Índice único atual: `organizationId + system + code`.

### 2.2 API atual

Rotas disponíveis:
- GET `/api/procedure-codes`
- POST `/api/procedure-codes`
- PATCH `/api/procedure-codes/:id`
- DELETE `/api/procedure-codes/:id`

A API verifica associação do usuário à organização e restringe gravação/edição/exclusão a OWNER, ADMIN e DOCTOR. Verifica vínculo de procedimento na organização ao criar ou ao enviar novo `procedureId`.

### 2.3 Interface atual

A tela permite:
- cadastro de procedimento próprio;
- cadastro manual de código TUSS ou SIGTAP;
- descrição, vínculo opcional, situação ativo/inativo e observação interna;
- busca por código/descrição e filtro por tabela;
- edição e exclusão.

Não há importação oficial, versionamento, regra de codificação ou vínculo dos códigos a uma cirurgia.

---

## 3. Lacunas e riscos encontrados

### Críticas antes de usar dados reais

1. **Ausência de versionamento:** um mesmo código pode ter descrição, atributos ou vigência diferentes entre competências/edições. A chave única atual impede armazenar versões sucessivas do mesmo código na mesma organização.
2. **Ausência de snapshot cirúrgico:** a cirurgia não guarda os códigos e descrições exatamente como solicitados/autorizados/executados. Alterar ou excluir um cadastro no futuro não pode reescrever a história de uma cirurgia.
3. **Exclusão física de código:** a rota DELETE apaga o cadastro. Para catálogo referencial e histórico clínico-financeiro, deve-se preferir inativação/retirada de vigência e preservar registros já utilizados.
4. **Sem sistema CBHPM:** o manual da coluna é estruturado em códigos CBHPM. A estrutura atual não consegue representar essa fonte.
5. **Sem regras do manual:** multiplicidade, unidade de cobrança, código principal, sequencial, complementar, condições, exclusões, 360°, tempos/vias e notas não existem no schema.
6. **Sem proveniência:** não se guarda fonte oficial, edição/competência, documento, página, data de consulta, extração OCR, revisor e status de validação.
7. **Sem distinção entre fonte oficial e regra interpretativa:** TUSS, SIGTAP, CBHPM e manual de sociedade têm papéis diferentes e não devem ser tratados como uma tabela homogênea.
8. **Sem vínculo de códigos ao fluxo da cirurgia:** o estado geral da cirurgia não substitui o estado individual de cada código ou etapa.

### Importantes de integridade e manutenção

9. **Unicidade por organização não é adequada para catálogos oficiais versionados:** a mesma identificação deve existir em múltiplas versões/competências. A unicidade deve considerar a versão do catálogo.
10. **Vínculo entre organização e procedimento:** a API valida organização ao criar/alterar vínculo, mas a integridade não está expressa por chave estrangeira composta no banco. Recomenda-se reforçar essa garantia na modelagem.
11. **Auditoria não transacional:** operações de criação/edição/exclusão e gravação do AuditLog são chamadas separadas; falha no log pode gerar resposta de erro após alteração já efetivada. Usar transação Prisma para ação + log.
12. **Busca não filtra inativos por padrão:** pode ser desejável, mas a interface deve deixar claro quando mostra códigos inativos e permitir filtro específico.
13. **Permissão DOCTOR para administrar catálogo:** decisão de produto a confirmar; a permissão atual permite que qualquer médico da organização cadastre, edite e exclua códigos. A exclusão física deve deixar de existir mesmo que a permissão seja mantida.
14. **Ausência de importação/atualização controlada:** não há identificação de arquivo-fonte, checksum, competência, lote, relatório de erros ou reconciliação de registros.

---

## 4. Separação conceitual recomendada

O sistema deve manter entidades diferentes para os conceitos abaixo.

### A. Sistema de codificação

Identifica a natureza da referência:
- TUSS;
- SIGTAP;
- CBHPM;
- código/manual de sociedade;
- futuramente, outros sistemas que sejam efetivamente necessários.

Não confundir o sistema de codificação com a versão de sua publicação.

### B. Versão de catálogo

Uma publicação ou competência imutável:
- sistema;
- edição ou competência (ex.: TUSS 202605, SIGTAP 2026-11, CBHPM edição identificada);
- início e fim de vigência, quando disponíveis;
- data de publicação/importação;
- origem oficial;
- arquivo original e checksum;
- status de importação e validação.

Uma versão importada não deve ser sobrescrita. Nova publicação cria nova versão.

### C. Código do catálogo

Registro do código dentro de uma versão:
- versão;
- código;
- descrição oficial;
- atributos específicos da fonte;
- vigência do item, se diferente da versão;
- status na fonte;
- dados estruturados originais quando necessários.

Unicidade: `catalogVersionId + code`, não organização + tabela + código.

### D. Cenário cirúrgico

Representa um cenário documentado de cirurgia:
- nome e descrição;
- especialidade/região;
- diagnóstico/indicação de referência, quando constarem da fonte;
- técnica, acesso e tempo;
- edição do manual;
- páginas e documento;
- estado da extração/revisão.

Exemplos: hérnia lombar sem instabilidade; artrodese toracolombar posterior; tumor vertebral; endoscopia para estenose; discite infecciosa.

### E. Regra de codificação

Regra versionada, explicável e vinculada a um cenário:
- código de referência;
- papel (principal, sequencial, complementar, adicional ou condicional);
- condição necessária;
- unidade de contagem;
- multiplicador/fórmula;
- limites, se houver;
- exclusões e dependências;
- requisito de documentação;
- página e trecho de suporte;
- confiança/estado de validação;
- observação sobre divergência do documento.

A regra não deve ser codificada apenas por semelhança de nomes.

### F. Pedido cirúrgico e snapshot dos códigos

Cada cirurgia deve guardar uma cópia imutável do que foi utilizado em cada etapa do processo, mesmo se o catálogo oficial for atualizado depois.

Cada item deve conter:
- código e descrição na versão escolhida;
- sistema e edição/competência;
- cenário/regra que motivou a sugestão;
- papel e unidade de contagem;
- quantidade e memória de cálculo;
- justificativa individual;
- origem (manual, catálogo oficial, inclusão manual);
- estado (sugerido, confirmado, solicitado, autorizado, parcialmente autorizado, negado, realizado, faturado, glosado, recebido, cancelado);
- autor e timestamps de cada mudança.

Não substituir o estado global da cirurgia; os estados dos itens de codificação são independentes.

---

## 5. Modelo de dados-alvo — proposta lógica

Os nomes abaixo são conceituais, não nomes definitivos de models Prisma.

| Entidade | Finalidade |
|---|---|
| `CodingSystem` | TUSS, SIGTAP, CBHPM, Manual/Sociedade |
| `CatalogVersion` | Edição/competência imutável de uma fonte |
| `CatalogCode` | Código/descrição dentro da versão |
| `SourceDocument` | Manual, norma, arquivo oficial, URL, checksum e metadados |
| `SurgicalScenario` | Cenário cirúrgico documentado |
| `ScenarioCodeRule` | Associação entre cenário, código e regra |
| `CodingRuleCondition` | Condições clínicas/técnicas estruturadas e/ou texto explicativo |
| `CodeRelationship` | Exclusão, dependência, concomitância, sequência ou mapeamento |
| `SurgeryCodingItem` | Snapshot do código no pedido/cirurgia |
| `SurgeryCodingEvent` | Histórico de solicitação, autorização, execução, faturamento, glosa e recebimento |
| `CatalogImportBatch` | Lote de importação, origem, checksum, contagens e erros |
| `CodeCrosswalk` | Relação entre sistemas, com origem e validação explícitas |

### Relações principais

- Uma fonte tem várias versões.
- Uma versão contém vários códigos.
- Um documento pode sustentar vários cenários/regras.
- Um cenário tem várias regras.
- Uma regra pode apontar para código de uma versão específica de CBHPM ou para item de manual.
- Uma cirurgia tem vários itens de codificação.
- Um item de codificação tem vários eventos de estado.
- Um mapeamento entre TUSS e SIGTAP é uma entidade própria, nunca uma conversão implícita.

### Regras de banco

- Chaves estrangeiras devem impedir associação cruzada entre organizações quando houver dados customizados por organização.
- Catálogos oficiais podem ser globais/compartilhados; personalizações da organização devem ficar em camada separada.
- Não apagar fisicamente códigos/regras já usados; preferir status e vigência.
- Guardar snapshots e eventos com transações.
- Índices únicos devem respeitar versão, não apenas código.
- Campos monetários continuam em Decimal, com moeda e contexto de remuneração definidos; porte CBHPM não é valor monetário.
- Unidades de multiplicidade devem ser enum ou catálogo controlado, não texto livre isolado.

---

## 6. Regras do manual da coluna que exigem suporte explícito

A extração do manual demonstra que não basta associar um código a um procedimento genérico.

### 6.1 Unidades de cobrança distintas

O modelo deve suportar, pelo menos:
- uma vez por procedimento/cirurgia;
- por segmento;
- por vértebra;
- por disco;
- por articulação facetária;
- por forame;
- por estrutura;
- por músculo;
- por hora ou fração;
- por quantidade física/implante;
- por via ou tempo cirúrgico, quando o cenário especificar.

Não inferir uma unidade universal por código: a regra deve poder variar por cenário e edição, quando o próprio manual assim fizer.

### 6.2 Relações e exceções

Precisam ser representáveis:
- código principal + código de objetivo/técnica;
- códigos sequenciais/complementares;
- códigos mutuamente excludentes;
- códigos concomitantes (ex.: artrodese 360° quando descrita);
- multiplicadores especiais de corpectomia e VCR;
- etapas condicionadas a achado ou execução (ex.: fístula liquórica inadvertida);
- neuromonitorização com justificativa e destinação de honorários à equipe própria, conforme nota;
- etapas de acesso e tempo cirúrgico;
- cenários com divergência/inconsistência no texto-fonte.

### 6.3 Divergências documentais devem permanecer visíveis

Exemplos identificados na extração:
- capítulo 6, cenários 6.2 e 6.3: divergências entre observações gerais e tabelas;
- capítulo 7, cenário 7.2: linhas de códigos de neuromonitorização/radioscopia aparentemente inconsistentes na página 148;
- capítulo 8, cenário 8.10: indicação textual aparentemente incompatível com a descrição da rizotomia para espasticidade;
- capítulo 8, cenário 8.13: multiplicador de infiltração difere do cenário 8.1.

Essas situações devem ser registradas como alertas de qualidade da fonte, não corrigidas silenciosamente nem transformadas em regra automática.

---

## 7. Fontes e separação de responsabilidades

### TUSS/ANS
- Usar a publicação oficial da ANS, Tabela 22 para procedimentos.
- Guardar versão, vigência, código e descrição oficial.
- TUSS padroniza identificação na troca TISS; não é tabela de preço nem prova, por si só, de cobertura obrigatória.

### SIGTAP/DATASUS
- Importar por competência mensal.
- Guardar atributos, instrumento de registro, modalidade, CBO, serviço/classificação, valores e compatibilidades.
- Compatibilidades são próprias do SIGTAP; não transportar regras CBHPM para o SUS.

### CBHPM/AMB
- Armazenar edição e códigos/portes como classificação referencial.
- Não tratar porte como valor em reais.
- Valores negociados por operadora/hospital devem ficar em entidade contratual própria e com vigência.

### Manuais de sociedades
- São fontes de cenários, interpretação, sequenciamento, unidades, exceções e justificativas.
- Guardar sociedade, título, edição, data, páginas e status de revisão.
- Não atribuir a um manual status de tabela oficial TUSS/SIGTAP.

### Crosswalks
- Relações TUSS↔SIGTAP, CBHPM↔TUSS etc. só podem existir com fonte e método explícitos.
- Registrar direção, tipo de relação (equivalente, parcial, aproximado, não equivalente), validador e vigência.
- Não converter automaticamente pedido de uma fonte para outra.

---

## 8. Arquitetura do fluxo cirúrgico

Separar o fluxo de codificação do status geral da cirurgia.

1. **Rascunho:** cenário e dados clínico-cirúrgicos informados.
2. **Sugestões:** motor mostra códigos, regra, unidade, quantidade calculada e fonte/página.
3. **Revisão médica:** médico confirma, altera ou rejeita cada item e documenta motivo.
4. **Solicitado:** snapshot dos itens enviados à operadora/fonte pagadora.
5. **Auditoria:** registrar questionamentos, negativas, autorizações parciais e justificativas.
6. **Autorizado:** armazenar o que foi efetivamente autorizado e respectivas quantidades.
7. **Executado:** registrar apenas etapas efetivamente realizadas, com referência ao relatório operatório.
8. **Faturado:** registrar itens e valores enviados, sem inferir valor a partir de porte.
9. **Glosado/contestado:** registrar motivo, valor, recurso e desfecho.
10. **Recebido:** registrar valor e data efetivamente recebidos.

Uma etapa sugerida, solicitada ou autorizada nunca deve ser marcada automaticamente como realizada ou faturada.

---

## 9. Proposta de implementação em fases

### Fase 0 — congelar a estrutura atual
- Não executar a migration de `ProcedureCode` no ambiente local até aprovação do desenho.
- Não apagar ou reescrever dados existentes.
- Não executar `docker compose down -v`.
- Manter desenvolvimento com dados fictícios.

### Fase 1 — catálogo versionado e proveniência
- Criar sistemas de codificação e versões de catálogo.
- Criar códigos por versão.
- Criar importação com lote, arquivo, checksum, contagens e relatório de validação.
- Criar fonte documental e páginas.
- Preservar o catálogo organizacional atual durante migração, mapeando os registros sem perda.

### Fase 2 — cenários e regras de manual
- Cadastrar cenários da 3ª edição do manual de coluna.
- Cadastrar códigos e regras por cenário, com multiplicidade e condições.
- Registrar pendências de conferência visual/OCR.
- Interface de revisão de regras antes de habilitar sugestões.

### Fase 3 — codificação por cirurgia
- Criar snapshot dos itens.
- Criar eventos de estado por item.
- Separar solicitação, autorização, execução e faturamento.
- Exigir confirmação médica e registrar autoria.

### Fase 4 — TUSS e SIGTAP oficiais
- Importar TUSS oficial versão vigente e histórico disponível.
- Importar SIGTAP por competência, incluindo atributos e compatibilidades.
- Fazer crosswalk apenas quando documentado e validado.
- Criar testes de regressão de importação.

### Fase 5 — contratos, OPME e auditoria
- Relacionar valores negociados por contrato e vigência.
- Incorporar fluxo de OPME, negativas, junta e glosas.
- Validar referências jurídicas e regulatórias em fonte atual antes de automatizar prazos/direitos.

---

## 10. Critérios de aceite antes de qualquer migration nova

- [ ] CBHPM pode ser representada sem ser confundida com TUSS/SIGTAP.
- [ ] Uma mesma identificação de código pode existir em versões diferentes.
- [ ] Competência SIGTAP é preservada e consultável historicamente.
- [ ] Fonte, documento, página, edição e vigência são rastreáveis.
- [ ] Unidades e multiplicadores são estruturados.
- [ ] Exclusões, dependências, concomitâncias e condições são representáveis.
- [ ] Regras têm status de revisão e validação humana.
- [ ] Uma cirurgia preserva o snapshot do código/descrição/regra usado na época.
- [ ] Solicitação, autorização, execução, faturamento e recebimento são estados distintos.
- [ ] Não existe conversão automática TUSS↔SIGTAP sem crosswalk validado.
- [ ] Acesso e integridade multi-organização são garantidos no banco e na API.
- [ ] Migração de dados atuais tem plano de rollback e teste em cópia de desenvolvimento.
- [ ] Testes de API, integridade e regressão passam antes de atualizar o ambiente local.

---

## 11. Decisões ainda em aberto

Estas decisões devem ser fechadas antes do desenho físico definitivo do Prisma:

1. Catálogos oficiais globais compartilhados ou cópias versionadas por organização? **Recomendação:** globais e imutáveis; preferências/associações locais em camada da organização.
2. Quais fontes CBHPM estarão disponíveis/licenciadas para carga estruturada? A extração do manual não substitui a tabela integral.
3. A organização poderá criar códigos internos? **Recomendação:** sim, mas em namespace próprio, claramente distinto de código oficial.
4. Quem pode aprovar regras e importações? **Recomendação:** perfil administrativo/técnico específico; DOCTOR pode confirmar códigos na própria cirurgia, mas não necessariamente alterar o catálogo oficial.
5. Como serão modelados valores contratuais por operadora, hospital, equipe e profissional? Separar remuneração de classificação e porte.
6. Quais campos mínimos do pedido cirúrgico serão obrigatórios antes do motor sugerir códigos? Evitar sugestões com base apenas no nome do procedimento.
7. Quais documentos e normas precisam de revisão regulatória atual antes de gerar alertas jurídicos?

## 12. Conclusão

A base atual não deve ser expandida como se fosse uma tabela simples. A próxima implementação deve começar pelo versionamento e pela proveniência, depois regras por cenário e, só então, vínculo com cada cirurgia. Isso preserva histórico, reduz ambiguidade e mantém a decisão clínica com o médico.

**Nenhuma alteração de banco, migration ou ambiente local foi realizada nesta revisão.**
