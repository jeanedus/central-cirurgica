# Módulo: Consentimentos e Orientações

## Objetivo
Gerenciar termos de consentimento livre e esclarecido (TCLE) e orientações pré e pós-operatórias individualizados por procedimento, integrados ao cadastro de procedimentos e às solicitações cirúrgicas.

## Componentes
1. Biblioteca de modelos por procedimento e técnica.
2. Gerador de TCLE.
3. Gerador de orientações pré-operatórias.
4. Gerador de orientações pós-operatórias.
5. Registro de entrega, leitura, esclarecimento e assinatura.
6. Controle de versões, revisão e aprovação dos modelos.

## Biblioteca por procedimento
Cada procedimento poderá ter:
- TCLE específico e suas variantes técnicas.
- Orientações pré-operatórias.
- Orientações pós-operatórias.
- Anexos e checklists específicos.
- Referências bibliográficas ou institucionais usadas na elaboração.
- Responsável pela revisão e data da última aprovação.

Exemplos iniciais de grupos: artrodese cervical anterior, artrodese lombar posterior, descompressão lombar, vertebroplastia/cifoplastia, ressecção de tumor vertebral, craniotomia para tumor, neuroendoscopia e procedimentos de derivação liquórica.

## Conteúdo mínimo do TCLE
- Identificação do procedimento proposto e sua finalidade.
- Diagnóstico/indicação e objetivos esperados.
- Descrição compreensível do procedimento e aspectos relevantes da técnica.
- Benefícios esperados, sem promessa de resultado.
- Riscos e complicações relevantes, gerais e específicos do procedimento.
- Possibilidade de necessidade de procedimentos adicionais ou mudança de estratégia, quando aplicável, com limites claros.
- Alternativas razoáveis, inclusive não realizar o procedimento, e consequências relevantes.
- Possibilidade de não atingir o resultado esperado e de persistência/recorrência de sintomas.
- Espaço para dúvidas e registro de que foram esclarecidas.
- Declaração de decisão voluntária, possibilidade de revogar o consentimento antes do procedimento e contatos para esclarecimentos.
- Identificação do paciente ou representante legal, médico responsável, data e assinaturas; testemunhas quando aplicável conforme política institucional.

O termo não substitui a conversa clínica individualizada nem deve funcionar como autorização genérica para qualquer procedimento. A versão final deve refletir o caso, a técnica planejada, os riscos materiais e as alternativas discutidas.

## Orientações pré-operatórias
Modelos com campos configuráveis para:
- Data, horário e local de internação.
- Jejum conforme orientação anestésica/institucional.
- Medicamentos: instruções individualizadas pelo médico e anestesista; não gerar suspensão automática de anticoagulantes, antiagregantes, antidiabéticos ou outros fármacos.
- Exames, avaliações e documentos necessários.
- Higiene, preparo e itens para internação.
- Acompanhante e logística de alta.
- Canal de contato em caso de intercorrências antes da cirurgia.

## Orientações pós-operatórias
Modelos configuráveis para:
- Cuidados com ferida operatória e curativo.
- Banho e higiene conforme técnica e orientação da equipe.
- Mobilização, restrições de esforço e retorno gradual às atividades.
- Uso de órtese, quando indicada.
- Medicações prescritas, sem doses predefinidas não validadas.
- Retorno ambulatorial e acompanhamento.
- Sinais de alerta e como procurar atendimento: febre, piora importante da dor, secreção ou abertura da ferida, déficit neurológico novo/progressivo, alteração esfincteriana, dispneia ou dor torácica, conforme o procedimento.
- Contatos e orientações específicas da equipe.

## Fluxo de uso
1. Selecionar a cirurgia/procedimento na solicitação ou registro cirúrgico.
2. O sistema sugere os modelos correspondentes.
3. O médico revisa e personaliza os campos clínicos e riscos específicos do paciente.
4. Gerar documentos em PDF para impressão ou assinatura eletrônica por solução apropriada.
5. Registrar entrega, data, versão do documento e status de assinatura.
6. Associar os documentos ao registro da cirurgia, sem duplicar dados cadastrais.

## Estados documentais
- Rascunho
- Em revisão médica
- Aprovado para uso
- Gerado para paciente
- Entregue
- Assinado
- Recusado / consentimento não obtido
- Revogado / substituído

## Governança clínica e jurídica
- Cada modelo terá número de versão, autor/revisor, data de aprovação e histórico de alterações.
- Modelos devem ser revisados por profissional responsável e, quando pertinente, pela instituição/assessoria jurídica e comitê de ética.
- Não publicar automaticamente modelos clínicos sem validação.
- O sistema deve distinguir modelo aprovado de documento individual efetivamente revisado e assinado.
- O consentimento deve ser um processo de comunicação e decisão compartilhada, não apenas coleta de assinatura.
- Orientações medicamentosas e restrições devem ser individualizadas; evitar recomendações automáticas potencialmente perigosas.

## Privacidade e segurança
- Documentos preenchidos com dados reais são dados pessoais sensíveis e devem ficar em ambiente protegido, com controle de acesso, criptografia, auditoria, backup e política de retenção.
- Não versionar TCLE preenchido, documentos assinados ou dados identificáveis de pacientes no GitHub.
- Registrar acesso e alterações conforme política de privacidade e LGPD.

## Critérios de aceite iniciais
- Selecionar um procedimento sugere TCLE e orientações correspondentes.
- Os três documentos (TCLE, pré e pós-operatório) podem ser editados individualmente antes da emissão.
- O sistema registra versão e data dos modelos usados.
- O documento gerado pode ser exportado para PDF e associado ao registro da cirurgia.
- Nenhum modelo é liberado para uso sem aprovação explícita.
- É possível registrar entrega, assinatura, recusa ou revogação.
