# Arquitetura de codificação cirúrgica — Central Cirúrgica

## Objetivo

Estruturar pedidos cirúrgicos com codificação tecnicamente justificável, rastreável e específica para cada fonte pagadora, começando por cirurgia da coluna. O sistema deve apoiar o médico, nunca substituir sua decisão clínica nem sugerir cobrança de etapa que não esteja indicada, planejada e efetivamente realizada.

## Fontes e hierarquia de informação

### Saúde suplementar

- **TUSS/ANS — Tabela 22 (Procedimentos em Saúde):** fonte oficial para identificação e nomenclatura padronizada dos procedimentos na troca de informações TISS. Registrar código, termo, descrição, início/fim de vigência e versão de origem.
- **CBHPM/AMB:** referência de classificação e hierarquização de procedimentos e honorários. A página pública da AMB informa edição 2022 como última edição publicada; atualizações normativas devem ser acompanhadas.
- **Manuais das sociedades:** diretrizes referenciais de interpretação e sequenciamento, registrando sociedade autora, edição, data, página, procedimento-modelo e observações. Manual não substitui contrato nem garante remuneração automática.

### SUS

- **SIGTAP/DATASUS:** fonte oficial para código, descrição, competência mensal, atributos, instrumento de registro, modalidade, CBO, serviço/classificação, valores e compatibilidades/relacionamentos.
- Importar e preservar competências mensais. Não sobrescrever histórico: o código pode mudar de descrição, atributos, valor ou vigência.
- As compatibilidades SIGTAP (compatível, sequencial, excludente, obrigatória etc.) são regras próprias do registro SUS e não devem ser inferidas a partir de regras CBHPM/TUSS.

## Princípios extraídos dos materiais recebidos

### Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral — 3ª edição, SBC/SBOT/SBN, 04/09/2025

- A edição divide o conteúdo em conceitos preliminares, descrição das codificações, cenários clínico-cirúrgicos e relacionamento com operadoras.
- Distingue procedimentos cobrados por segmento, por vértebra, por estrutura abordada e uma única vez por cirurgia.
- Exemplo de regra do manual: artrodese instrumentada (3.07.15.01-6) é contabilizada por segmento; biópsia da coluna (3.07.15.03-2) e laminectomia/laminotomia (3.07.15.19-9) são por vértebra; cirurgia endoscópica (3.07.15.05-9) e tratamento cirúrgico de fratura (3.07.15.16-4) são apresentados como códigos cobrados uma vez por cirurgia.
- A regra de multiplicidade deve ser armazenada por procedimento e respeitar exceções específicas descritas no cenário correspondente. Não aplicar uma regra genérica de multiplicação a todos os códigos.
- O manual afirma que cirurgias bilaterais no mesmo segmento/nível não geram automaticamente cobrança duplicada para determinados procedimentos.
- Os códigos complementares devem ser relacionados aos achados clínicos, exame físico, imagem e objetivos cirúrgicos. O relatório final deve documentar as etapas solicitadas e efetivamente realizadas.
- Para acessos combinados, tempos cirúrgicos, artrodese 360°, fístula liquórica, neuromonitorização, enxerto e demais exceções, usar as notas específicas de cada cenário; não generalizar regras isoladas.
- O próprio manual caracteriza seu conteúdo como referencial para negociação entre prestadores e operadoras.

### Guia “Como usar os manuais de codificação”, 2022

- Apresenta o conceito de código principal seguido de etapas sequenciais/complementares.
- Propõe avaliar se uma etapa é independente do tempo principal, acrescenta tempo/risco e possui código na tabela de referência.
- Seu conteúdo é material interpretativo; a aplicação prática deve ser subordinada à edição mais recente do manual específico da especialidade e às regras da fonte pagadora.

## Modelo funcional proposto

### 1. Catálogo de códigos

Cada código deve guardar:
- sistema/tabela (TUSS, SIGTAP, CBHPM ou manual de sociedade);
- código, nome e descrição;
- edição/competência e vigência;
- fonte oficial, documento, página e data de consulta;
- status (vigente, não vigente, em revisão);
- especialidade/área e região anatômica;
- unidade de cobrança definida pela fonte (por cirurgia, segmento, vértebra, estrutura, lado, hora, unidade topográfica etc.);
- observações, exceções e grau de validação.

### 2. Regras de codificação

Representar separadamente:
- papel do código (principal, sequencial, complementar, adicional);
- condição clínica/técnica necessária;
- procedimento-modelo ou família de cirurgia;
- dependências e compatibilidades;
- exclusões e situações de não concomitância;
- multiplicador e unidade de contagem;
- via de acesso e tempo cirúrgico;
- justificativa exigida;
- fonte, versão, página e nível de confiança.

As regras precisam suportar relações muitos-para-muitos, condições e exceções. Não codificar combinações apenas por proximidade textual entre nomes.

### 3. Pedido cirúrgico

O pedido deve manter:
- diagnóstico, CID e correlação clínica-radiológica;
- objetivo principal e objetivos complementares;
- técnica, níveis/segmentos/vértebras/estruturas e lateralidade;
- via(s) de acesso e tempos cirúrgicos;
- lista ordenada de códigos, quantidades e justificativas individuais;
- OPME associada ao objetivo e técnica;
- fonte/tabela e versão usada;
- observações e documentação de suporte.

O sistema pode apresentar sugestões explicadas, mas o médico confirma, edita ou rejeita cada código. Mostrar por que cada sugestão apareceu e quais dados clínicos faltam.

### 4. Autorização e execução

Manter versões distintas:
1. códigos solicitados;
2. códigos autorizados, parcialmente autorizados ou negados;
3. códigos/etapas efetivamente realizados;
4. códigos enviados para faturamento e valores efetivamente recebidos.

A descrição cirúrgica deve ser comparada com o pedido e a autorização. Alertar para divergências, sem criar automaticamente registro de realização ou cobrança.

### 5. Remuneração

Separar:
- porte/valor referencial da CBHPM;
- valores SIGTAP por competência;
- valores negociados em contrato com cada operadora/hospital;
- valores solicitados, autorizados, faturados e recebidos.

Não apresentar valor referencial como garantia de pagamento. Não inferir tabela contratual de uma operadora.

## Estratégia de implantação

1. Consolidar a biblioteca de regras da 3ª edição do Manual de Coluna, preservando página e exceções.
2. Obter e importar a versão vigente da TUSS/ANS, inicialmente Tabela 22; avaliar tabelas de OPME separadamente.
3. Importar SIGTAP por competência, com atributos e compatibilidades relevantes para Grupo 04, Subgrupo 03 (SNC/SNP — coluna e nervos periféricos), além dos procedimentos transversais aplicáveis.
4. Validar os códigos de cada cenário contra as fontes oficiais e identificar diferenças de código/descrição/versão.
5. Implementar recomendação assistida de códigos e justificativas para pedidos de cirurgia de coluna.
6. Depois de validado, expandir para neurocirurgia craniana e nervos periféricos.

## Regras de segurança e integridade

- Não sugerir código sem correspondência a etapa indicada e justificável.
- Não adicionar procedimento só para aumentar remuneração.
- Não converter automaticamente código de uma tabela para outra sem mapeamento oficial validado.
- Não presumir compatibilidade SUS com base em manual CBHPM, nem vice-versa.
- Preservar histórico de versões, fonte, data de importação e autor da revisão.
- Marcar conteúdo extraído por OCR ou importação automática como pendente de validação humana.
- Utilizar apenas dados fictícios no ambiente de desenvolvimento até validação de segurança e LGPD.

## Fontes públicas consultadas

- ANS — Códigos da TUSS: https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/codigos-da-tuss
- ANS — Padrão TISS maio/2026: https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-2013-maio-2026
- Ministério da Saúde — FAQ SIGTAP: https://webatendimento.saude.gov.br/faq/sigtap
- Wiki oficial SIGTAP: https://wiki.saude.gov.br/sigtap/index.php/P%C3%A1gina_principal
- AMB — CBHPM: https://amb.org.br/publicacoes-amb/cbhpm/
- SBN — Manuais e Protocolos: https://www.portalsbn.org/manuais-e-protocolos
- Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral, 3ª edição (SBC/SBOT/SBN, 2025), disponibilizado no portal da SBN.

## Observação de escopo

Este documento registra a arquitetura funcional e as regras de domínio iniciais. A extração integral de códigos e combinações é uma etapa de carga e validação de dados, não deve ser substituída por listas montadas manualmente ou por inferências de IA.
