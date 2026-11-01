# Fontes oficiais e estratégia de importação — TUSS e SIGTAP

**Projeto:** Central Cirúrgica  
**Data de verificação:** 01/11/2026  
**Escopo:** fontes oficiais para estruturar importação de TUSS e SIGTAP, com foco inicial em procedimentos cirúrgicos de coluna e neurocirurgia.

## 1. TUSS — ANS / Open Concept Lab

### Fonte oficial

Página da ANS:  
https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/codigos-da-tuss

A página foi publicada em 09/07/2026 e atualizada em 15/07/2026. A ANS informa que as tabelas TUSS são disponibilizadas em Excel, CSV, JSON e API por meio de plataforma baseada em Open Concept Lab (OCL).

A página descreve:
- Tabela 22: Procedimentos em Saúde;
- Tabela 19: Materiais, OPME;
- a TUSS integra o padrão TISS e padroniza a identificação de itens na troca de informações;
- a existência de um código TUSS não equivale, por si só, à cobertura obrigatória do Rol da ANS.

### API e endpoints documentados

Documentação OCLService:  
https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest-doc/rest/oclservice#/

OpenAPI:  
https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest-doc/rest/oclservice/openapi.json

Endpoint de fontes/tabelas:  
https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest/oclservice/ANS/source

Endpoint de conceitos de uma tabela:  
`/rest/oclservice/ANS/concepts/{table}`

Exemplo documentado pela interface OCL:  
`/rest/oclservice/ANS/concepts/tuss-22?page=2&q=odonto`

A consulta ao endpoint de fontes em 01/11/2026 retornou `tuss-22` com descrição “Procedimentos em saúde” e 5.964 registros. Esse total é metadado apresentado pelo serviço no momento da consulta, não uma contagem independente do arquivo integral.

### Estratégia recomendada para a Central Cirúrgica

1. Consultar o endpoint `/ANS/source` e localizar `tuss-22`.
2. Obter a definição/identificador da fonte e sua versão conforme o contrato da API OCL.
3. Baixar a tabela completa por JSON/CSV ou percorrer o endpoint paginado de conceitos.
4. Guardar resposta original, URL, data/hora, identificador/versão da fonte, paginação e checksum.
5. Validar estrutura e contagem antes de publicar a versão importada.
6. Não substituir a versão anterior; cada atualização gera uma nova versão de catálogo.
7. Importar TUSS 19 (OPME) em catálogo separado, em fase própria, devido ao volume muito maior informado pela ANS.

**Ponto ainda pendente:** a página oficial e a listagem OCL foram verificadas, mas a resposta integral paginada de `tuss-22` e o esquema exato de versionamento do endpoint ainda precisam ser testados em ambiente de integração. Não foi criada carga de códigos neste levantamento.

## 2. SIGTAP — Ministério da Saúde / DATASUS

### Fontes oficiais

Wiki SIGTAP:  
https://wiki.saude.gov.br/sigtap/index.php/P%C3%A1gina_principal

Página de downloads:  
https://wiki.datasus.gov.br/sigtap/index.php/Download

FAQ Ministério da Saúde:  
https://webatendimento.saude.gov.br/faq/sigtap

Cronograma oficial 2026:  
https://wiki.datasus.gov.br/cnes/index.php/Cronograma

O Ministério da Saúde descreve o SIGTAP como ferramenta com série histórica mensal, atributos dos procedimentos, compatibilidades, relacionamentos e notas técnicas. Cada competência disponibiliza arquivo TXT para importação nos sistemas de captação e processamento.

A área oficial de download informa arquivos TXT por competência e Notas Técnicas correspondentes. A documentação SIGTAP descreve a estrutura hierárquica Grupo, Subgrupo, Forma de Organização e Procedimento, e detalha atributos e compatibilidades.

### Competência de referência em 01/11/2026

O cronograma oficial informa:
- competência outubro/2026: disponibilização prevista em 02/10/2026;
- competência novembro/2026: disponibilização prevista em 03/11/2026.

Portanto, na data deste levantamento (01/11/2026), a competência novembro ainda não havia atingido sua data oficial prevista de disponibilização. A competência de referência mais recente prevista como publicada é outubro/2026 (202610). Confirmar o arquivo efetivamente disponível antes de importar; o cronograma pode sofrer alterações e prevê possibilidade de mais de uma versão por competência.

### Recorte inicial para coluna e nervos periféricos

A estrutura SIGTAP relevante é:
- Grupo 04 — Procedimentos cirúrgicos;
- Subgrupo 03 — Cirurgia do sistema nervoso central e periférico;
- Forma de Organização 02 — Coluna e nervos periféricos.

A documentação oficial explica que o código possui dez dígitos: Grupo (2), Subgrupo (2), Forma de Organização (2), sequência (3) e dígito verificador (1).

**Importante:** não limitar a importação somente à Forma 04.03.02. Procedimentos transversais relevantes para cirurgia de coluna podem estar em outras formas de organização ou grupos, por exemplo materiais, exames, procedimentos diagnósticos, anestesia e outros procedimentos cirúrgicos. O recorte 04.03.02 é um ponto de partida para análise, não o universo completo.

### Compatibilidades e atributos

A importação não deve guardar apenas código e descrição. Deve preservar, conforme os arquivos e layouts oficiais:
- modalidade de atendimento;
- complexidade;
- financiamento e valores;
- instrumento de registro;
- quantidade máxima;
- idade mínima/máxima e sexo;
- CBO;
- serviço/classificação;
- habilitação;
- CID e demais atributos;
- relações de compatibilidade, incluindo compatível, excludente, concomitante, obrigatória e sequencial, quando disponíveis;
- origem/relacionamentos e notas técnicas.

A forma exata de cada atributo e arquivo deve ser conferida no layout oficial da competência importada.

### Estratégia recomendada

1. Obter o ZIP oficial da competência 202610, se ainda for a última competência disponível.
2. Preservar ZIP original e checksum.
3. Extrair e inventariar todos os TXT, não apenas a tabela de procedimentos.
4. Identificar os arquivos de procedimentos, atributos, relações e compatibilidades conforme o leiaute da competência.
5. Fazer parser com codificação e delimitadores conforme o leiaute oficial; não presumir CSV simples.
6. Importar primeiro em staging, validar contagens, chaves e relações.
7. Publicar a competência como versão imutável somente após validação.
8. Repetir mensalmente, preservando a série histórica e notas técnicas.

**Ponto ainda pendente:** a página oficial de download e o cronograma foram verificados, mas o ZIP oficial 202610 e seu leiaute não foram baixados e validados neste levantamento. Não foi criada carga de códigos SIGTAP.

## 3. Mapeamento TUSS ↔ SIGTAP

A página oficial de download SIGTAP informa que existe uma planilha de mapeamento entre procedimentos da Tabela SUS e a TUSS/ANS.

Isso permite considerar uma fonte oficial de relacionamento para análise, mas não justifica conversão automática sem avaliar:
- versão/competência de cada lado;
- direção do relacionamento;
- se a equivalência é exata, parcial ou apenas aproximada;
- se o relacionamento é atual e aplicável ao cenário;
- existência de mais de um código correspondente.

O crosswalk deve ser armazenado como entidade separada, com documento, versão, direção, tipo de relação, data de validação e responsável. Nunca substituir o código original do sistema de origem.

## 4. Fontes oficiais versus fontes auxiliares

A implementação deve usar:
- ANS/OCL como fonte oficial da TUSS;
- Ministério da Saúde/DATASUS/SIGTAP como fonte oficial do SIGTAP;
- páginas de terceiros apenas para conferência exploratória, nunca como origem primária da importação;
- manuais de sociedades para regras e cenários de interpretação, não para substituir os cadastros oficiais das tabelas.

## 5. Consequências para a arquitetura

Este levantamento confirma a necessidade de:
- catálogo compartilhado e global, versionado por fonte;
- importações por lote com checksum e relatório;
- armazenamento dos dados originais e dados normalizados;
- versionamento imutável por competência/edição;
- staging e validação antes da publicação;
- catálogo de atributos e relações SIGTAP;
- importação separada de TUSS 22 e TUSS 19;
- crosswalk independente;
- nenhum valor TUSS interpretado como preço ou cobertura;
- nenhum porte CBHPM confundido com valor monetário;
- nenhuma regra de manual convertida em compatibilidade SIGTAP.

## 6. Fontes consultadas

1. ANS — Códigos da TUSS: https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/codigos-da-tuss
2. ANS — notícia sobre plataforma TUSS e distinção TUSS/Rol: https://www.gov.br/ans/pt-br/assuntos/noticias/periodo-eleitoral/ans-lanca-ferramenta-para-consulta-a-codigos-de-procedimentos-e-medicamentos
3. OCLService — documentação: https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest-doc/rest/oclservice#/
4. OCLService — lista de fontes: https://consulta-ocl.apps.sa-1a.mendixcloud.com/rest/oclservice/ANS/source
5. Ministério da Saúde — FAQ SIGTAP: https://webatendimento.saude.gov.br/faq/sigtap
6. SIGTAP — Wiki oficial: https://wiki.saude.gov.br/sigtap/index.php/P%C3%A1gina_principal
7. SIGTAP — Download: https://wiki.datasus.gov.br/sigtap/index.php/Download
8. DATASUS/CGSI — Cronograma 2026: https://wiki.datasus.gov.br/cnes/index.php/Cronograma

**Status:** levantamento de fontes e desenho de ingestão. Nenhuma importação foi executada e nenhum banco ou ambiente local foi alterado.
