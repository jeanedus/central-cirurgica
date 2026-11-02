// Regras estruturadas a partir da extração do Manual SBC/SBOT/SBN, 3ª edição (2025).
// Os códigos são referências do manual; não presumir equivalência TUSS/SIGTAP nem cobertura.
// Toda sugestão exige confirmação do cirurgião e validação da tabela/contrato aplicável.

const SOURCE = "Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral — SBC/SBOT/SBN, 3ª edição (04/09/2025)";

const scenarios = [
  {
    id: "degenerative-posterior-fusion",
    title: "Artrodese tóraco-lombar posterior",
    match: ({ subtype, region, approach }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Lombar", "Toracolombar", "Torácica", "Multissegmentar"].includes(region) &&
      ["Posterior", "Percutânea"].includes(approach),
    reference: "Cenário 2.6, p. 39–40",
    codes: [
      { code: "3.07.15.01-6", description: "Artrodese da coluna com instrumentação por segmento", role: "principal", condition: "Conforme segmentos efetivamente artrodesados; confirmar unidade de cobrança." },
      { code: "3.07.15.02-4", description: "Artrodese de coluna via anterior ou póstero-lateral — tratamento cirúrgico", role: "associado", condition: "O manual orienta associação concomitante com o código anterior quando realizada artrodese 360°; validar cenário e contrato." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se houver estenose tratada e etapa microcirúrgica correspondente." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se a descompressão correspondente for efetivamente realizada." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Somente se essa etapa de acesso/descompressão for executada; não presumir." },
      { code: "3.07.32.02-6", description: "Enxerto ósseo — retirada de enxerto autólogo", role: "condicional", condition: "Somente quando houver retirada de enxerto autólogo." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória em cirurgias espinhais e ortopedia", role: "condicional", condition: "Exige justificativa clínica; código destinado à equipe de neuromonitorização." }
    ]
  },
  {
    id: "anterior-lateral-fusion",
    title: "Artrodese lombar anterior ou lateral (ALIF/LLIF/XLIF)",
    match: ({ subtype, region, approach }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Lombar", "Multissegmentar"].includes(region) &&
      ["Anterior", "Lateral", "Anterior e posterior"].includes(approach),
    reference: "Cenário 2.7, p. 41–42",
    codes: [
      { code: "3.07.15.01-6", description: "Artrodese da coluna com instrumentação por segmento", role: "principal", condition: "Conforme segmentos efetivamente instrumentados/artrodesados." },
      { code: "3.07.15.02-4", description: "Artrodese de coluna via anterior ou póstero-lateral — tratamento cirúrgico", role: "associado", condition: "O manual orienta uso concomitante dos dois códigos em artrodese 360°; separar os tempos/vias e validar contrato." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se estenose for tratada por etapa microcirúrgica." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se a descompressão correspondente for realizada." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Somente se efetivamente executada." },
      { code: "3.07.32.02-6", description: "Enxerto ósseo — retirada de enxerto autólogo", role: "condicional", condition: "Somente quando houver retirada de enxerto autólogo." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória em cirurgias espinhais e ortopedia", role: "condicional", condition: "Exige justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.09.10.13-7", description: "Lesões vasculares intra-abdominais", role: "evento", condition: "Evento adverso intraoperatório: nunca pré-selecionar; registrar somente se ocorrer e houver tratamento." }
    ]
  },
  {
    id: "lumbar-stenosis-decompression",
    title: "Estenose de canal sem instabilidade — descompressão",
    match: ({ subtype, region, diagnosis }) =>
      ["Descompressão", "Discectomia"].includes(subtype) &&
      ["Lombar", "Toracolombar", "Torácica", "Cervical", "Multissegmentar"].includes(region) &&
      /estenose|canal estreito/i.test(diagnosis || ""),
    reference: "Cenário 2.4, p. 35–36",
    codes: [
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "principal", condition: "Código principal do cenário; confirmar objetivo e etapa executada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "associado", condition: "Quando a técnica microcirúrgica do canal estreito for realizada." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Não é automática: o manual cita técnica sem laminectomia, como flavectomia isolada." },
      { code: "3.07.15.22-9", description: "Osteotomia de coluna vertebral — tratamento cirúrgico", role: "condicional", condition: "Somente na técnica de Split do Processo Espinhoso descrita no cenário." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória em cirurgias espinhais e ortopedia", role: "condicional", condition: "Exige justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Evento intraoperatório: nunca pré-selecionar; registrar somente se ocorrer inadvertidamente e for tratado." }
    ]
  }
];

export function getSpineCodingScenario(input) {
  return scenarios.find(scenario => scenario.match(input)) || null;
}

export function getSpineCodingSuggestions(input) {
  const scenario = getSpineCodingScenario(input);
  if (!scenario) return null;
  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    source: SOURCE,
    reference: scenario.reference,
    codes: scenario.codes.map(item => ({
      system: "SOCIETY_MANUAL",
      code: item.code,
      description: item.description,
      role: item.role,
      condition: item.condition,
      source: SOURCE,
      reference: scenario.reference,
      quantity: null,
      requiresReview: true
    }))
  };
}
