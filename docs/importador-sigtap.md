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

O importador não sobrescreve uma versão que já exista com o mesmo sistema e rótulo. Uma nova competência/edição deve gerar nova versão.

## Limitações conhecidas e controles

1. O importador exige que os arquivos de dados estejam diretamente no diretório informado, junto aos respectivos layouts.
2. A validação de largura garante consistência estrutural, não garante que o pacote seja oficial, completo ou semanticamente correto.
3. Os relacionamentos são preservados como registros de dataset. A interpretação dos tipos de compatibilidade, exceções, habilitações, CBO, CID, serviços e modalidades deve ser implementada com base na documentação oficial antes de qualquer regra automática.
4. O arquivo `tb_descricao.txt` é preservado como dataset independente; ainda não é mesclado automaticamente ao texto curto de `tb_procedimento.txt`.
5. A importação real cria versão e lote antes de inserir os registros. Em caso de falha, lote e versão são marcados como FAILED; não há limpeza automática de dados parciais. A versão falha não deve ser reutilizada nem ativada.
6. O pacote SIGTAP 202610 que foi analisado nesta etapa é uma cópia de referência fornecida na conversa, não uma captura autenticada do DATASUS. Antes de produção, baixar novamente da fonte oficial, registrar URL/data/arquivo/checksum e repetir o modo de validação.
7. Nenhuma importação real foi executada nesta etapa; somente o parser e as migrations foram validados em CI.

## Verificações automatizadas

Workflow: `.github/workflows/backend-validation.yml`

Verifica schema Prisma, geração do client, aplicação de todas as migrations em PostgreSQL descartável, seed, sintaxe do importador e build TypeScript.

Execução aprovada em 01/11/2026:
https://github.com/jeanedus/central-cirurgica/actions/runs/41360897420
