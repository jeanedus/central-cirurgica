# Importador SIGTAP — especificação e uso

## Objetivo

Importar uma competência SIGTAP a partir dos arquivos TXT de largura fixa exportados pelo sistema, usando os arquivos `*_layout.txt` do próprio pacote para determinar nomes, posições e larguras dos campos.

O importador não deve ser considerado validador semântico das regras assistenciais do SIGTAP nem substitui a conferência da origem oficial do pacote.

## Implementação

Arquivo: `backend/scripts/import-sigtap.js`

Comando registrado no `backend/package.json`:

```bash
npm run db:import:sigtap -- <diretorio-extraido> <AAAAMM> [rotulo-versao]
```

Validação sem gravação:

```bash
node scripts/import-sigtap.js <diretorio-extraido> --validate-only
```

O modo `--validate-only`:
- exige os arquivos de dados e seus layouts correspondentes;
- interpreta posições e larguras conforme o layout;
- interrompe se qualquer linha tiver largura diferente da esperada;
- verifica a presença de `tb_procedimento.txt`;
- verifica se os códigos de procedimento têm 10 dígitos e não se repetem;
- calcula checksum SHA-256 determinístico sobre nomes, conteúdo dos arquivos de dados e layouts;
- não consulta nem grava no banco.

## Persistência

- `CatalogVersion`: competência, rótulo, checksum e estado da importação.
- `CatalogImportBatch`: arquivo lógico, checksum, contagens e estado.
- `CatalogCode`: catálogo pesquisável de procedimentos derivado de `tb_procedimento.txt`, com descrição, atributos e registro original.
- `CatalogDatasetRecord`: preserva cada registro estruturado dos demais arquivos e também o registro original da tabela principal, identificado por dataset e linha de origem.

Os campos do SIGTAP são preservados como strings no JSON bruto/estruturado, evitando perda de zeros à esquerda e formatação original. Não se convertem valores monetários nem códigos de compatibilidade com base apenas na largura do campo.

O importador não sobrescreve uma versão que já exista com o mesmo sistema e rótulo. Uma nova competência/edição deve gerar nova versão. Para a competência 202610, a fonte fica registrada como `OFFICIAL_CATALOG`, com proveniência explícita da cópia aceita pelo responsável do projeto: espelho RenatoKR/SIGTAP, cujo workflow documenta sincronização com o FTP do DATASUS. O metadado `sourceVerification: USER_ACCEPTED_MIRROR_COPY` deixa claro que a cópia foi aceita para uso no projeto, mas não houve comparação direta do hash com o servidor DATASUS. O checksum SHA-256 do ZIP é registrado separadamente do checksum dos TXT/layouts processados.

## Limitações conhecidas e controles

1. O importador exige que os arquivos de dados estejam diretamente no diretório informado, junto aos respectivos layouts.
2. A validação de largura garante consistência estrutural, não garante que o pacote seja oficial, completo ou semanticamente correto.
3. Os relacionamentos são preservados como registros de dataset. A interpretação dos tipos de compatibilidade, exceções, habilitações, CBO, CID, serviços e modalidades deve ser implementada com base na documentação oficial antes de qualquer regra automática.
4. O arquivo `tb_descricao.txt` é preservado como dataset independente; ainda não é mesclado automaticamente ao texto curto de `tb_procedimento.txt`.
5. A importação real cria versão e lote antes de inserir os registros. Em caso de falha, lote e versão são marcados como FAILED; não há limpeza automática de dados parciais. A versão falha não deve ser reutilizada nem ativada.
6. A cópia SIGTAP 202610 foi aceita pelo responsável do projeto como fonte de trabalho. O ZIP `TabelaUnificada_202610_v2610271043.zip` passou no teste CRC, contém 87 entradas e tem SHA-256 `525e5ef197da5133ed3177f42b56cb341057668af8da2fdc7f6674bcc25af5cd`. Os 41 arquivos de dados têm layouts correspondentes; foram verificados 395.908 registros, sem divergência de largura, e 5.039 códigos distintos em `tb_procedimento.txt`. O espelho informa sincronização automatizada com `ftp://ftp2.datasus.gov.br/pub/sistemas/tup/downloads/`; ainda assim, não foi possível comparar o arquivo diretamente com o servidor oficial. A classificação e os metadados preservam essa distinção.
7. A validação estrutural da cópia foi executada nesta etapa; a importação no banco da instalação local ainda depende da execução do comando pelo operador. A validação de CI não substitui essa importação nem a revisão semântica dos relacionamentos SIGTAP.

## Verificações automatizadas

Workflow: `.github/workflows/backend-validation.yml`

Verifica schema Prisma, geração do client, aplicação de todas as migrations em PostgreSQL descartável, seed, sintaxe do importador, execução real do modo `--validate-only` contra um fixture fixo de largura (incluindo a exclusão de `LEIA_ME.TXT`) e build TypeScript. O fixture não contém dados assistenciais e a validação não grava no banco.

Execução aprovada em 01/11/2026:
https://github.com/jeanedus/central-cirurgica/actions/runs/41361009877

## Consulta do catálogo na aplicação

A API de leitura do catálogo versionado está em `backend/src/modules/catalogs/catalogs.routes.ts`:
- `GET /api/catalogs/SIGTAP`: informa se existe uma versão importada e validada e seus metadados.
- `GET /api/catalogs/SIGTAP/codes?search=<termo>&page=1&pageSize=50`: pesquisa os códigos da versão vigente, com paginação (máximo 100 por página).

A tela Procedimentos e códigos abre o painel de consulta do SIGTAP quando o filtro SIGTAP é selecionado. Ela diferencia o catálogo versionado dos códigos manuais antigos. Se ainda não houver versão importada e validada, mostra uma mensagem explícita em vez de uma tabela vazia ou de falha silenciosa.

A consulta exige autenticação e associação do usuário à organização ativa, mas os registros do catálogo permanecem compartilhados entre organizações. A consulta não altera nem exclui códigos manuais.
