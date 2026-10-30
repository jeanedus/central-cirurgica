# Módulo: Gestão de Cirurgias e Financeiro

## Objetivo
Acompanhar cada cirurgia desde a solicitação até o recebimento, com controle separado de receitas, despesas, pagamentos e rentabilidade. Este módulo deve ser independente, mas integrado aos cadastros de procedimentos, solicitações, materiais/OPME e hospitais.

## Princípios
- Uma cirurgia possui um identificador interno único e pode estar vinculada a uma solicitação.
- Não duplicar dados já existentes: importar paciente/identificador, procedimento, códigos, convênio/SUS e materiais da solicitação vinculada.
- Separar valores previstos, solicitados, autorizados, faturados, glosados, aprovados e efetivamente recebidos.
- Registrar receitas e despesas como lançamentos individualizados, com categoria, valor, competência, vencimento, pagamento e comprovante opcional.
- Permitir pagamentos parciais e múltiplos lançamentos por cirurgia.
- Manter histórico de alterações e trilha de auditoria.
- Não armazenar dados identificáveis de pacientes no repositório GitHub. Dados operacionais devem ficar em banco protegido, com controle de acesso.

## Estados do fluxo
1. Solicitada
2. Em análise
3. Autorizada (total ou parcialmente)
4. Agendada
5. Realizada
6. Faturada
7. Parcialmente recebida
8. Recebida
9. Cancelada / negada

O status financeiro deve ser independente do status assistencial. Ex.: cirurgia realizada pode permanecer aguardando faturamento ou recebimento.

## Cadastro da cirurgia
- Identificador interno
- Referência à solicitação
- Identificador do paciente no sistema (evitar nome completo em relatórios gerais)
- Data da solicitação, autorização, agendamento e realização
- Procedimento principal e procedimentos associados
- Níveis/localização e técnica
- Hospital/unidade
- Convênio, particular ou SUS
- Número de autorização/protocolo
- Médico responsável e equipe
- Status assistencial e status financeiro
- Observações administrativas

## Receitas
Cada receita deve ser um lançamento separado:
- Categoria: honorários principais, honorários auxiliares, instrumentação, consulta/avaliação vinculada, pacote/repasse ou outra receita
- Pagador: convênio, hospital, paciente ou outro
- Valor solicitado
- Valor autorizado/aprovado
- Valor faturado
- Valor glosado e motivo
- Valor recebido
- Data de competência, emissão/faturamento, vencimento e recebimento
- Número de nota/guia/protocolo
- Status: previsto, a faturar, faturado, parcialmente recebido, recebido, glosado ou contestado

## Despesas e custos
Permitir múltiplos lançamentos por cirurgia, com categorias configuráveis:
- Hospital / taxa de sala
- Anestesia
- Materiais e OPME
- Instrumentador
- Auxiliares / equipe médica
- Enfermagem ou equipe de apoio
- Equipamentos / locações
- Medicamentos e insumos
- Transporte / logística
- Taxas administrativas
- Impostos
- Outros

Campos de cada despesa:
- Categoria e descrição
- Fornecedor/prestador
- Valor previsto e valor efetivo
- Data de competência
- Data de vencimento e pagamento
- Status: previsto, pendente, parcialmente pago ou pago
- Forma de pagamento
- Documento/comprovante opcional
- Observações

## Indicadores e cálculos
- Receita bruta faturada
- Receita aprovada
- Receita efetivamente recebida
- Total de despesas previstas e efetivamente pagas
- Contas a receber e contas a pagar
- Glosas e percentual de glosa
- Resultado operacional por cirurgia = receitas recebidas - despesas pagas
- Resultado estimado = receitas previstas/aprovadas - despesas previstas
- Margem operacional, identificando claramente a base de cálculo
- Rentabilidade por procedimento, hospital, convênio, período e equipe
- Prazo médio entre realização, faturamento e recebimento

Não chamar resultado operacional de lucro líquido sem incluir todos os impostos, custos indiretos e critérios contábeis definidos pelo usuário.

## Relatórios
- Produção cirúrgica por período, hospital, convênio e procedimento
- Cirurgias solicitadas, autorizadas, realizadas e canceladas
- Faturamento, recebimentos, glosas e valores pendentes
- Despesas por categoria e fornecedor
- Resultado por cirurgia e comparativos agregados
- Exportação CSV/XLSX/PDF, com filtros e sem expor dados pessoais desnecessários

## Requisitos de segurança
- Autenticação e autorização por perfil
- Criptografia em trânsito e proteção dos dados armazenados
- Registro de acesso e alterações
- Backup e política de retenção
- Minimização de dados pessoais e adequação à LGPD
- Nenhum dado real de paciente, credencial, token ou segredo em commits, issues ou arquivos versionados

## Critérios de aceite iniciais
- Uma cirurgia pode ser criada a partir de uma solicitação existente.
- É possível registrar várias receitas e despesas por cirurgia.
- É possível registrar pagamentos parciais.
- Os status assistencial e financeiro são independentes.
- O sistema calcula valores pendentes, recebidos, pagos e resultado operacional.
- Os relatórios permitem filtrar por período, hospital, convênio e procedimento.
