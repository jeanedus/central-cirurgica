// Regras estruturadas a partir da extração do Manual SBC/SBOT/SBN, 3ª edição (2025).
// Os códigos são referências do manual; não presumir equivalência TUSS/SIGTAP nem cobertura.
// Toda sugestão exige confirmação do cirurgião e validação da tabela/contrato aplicável.

const SOURCE = "Manual de Diretrizes de Codificação em Cirurgia da Coluna Vertebral — SBC/SBOT/SBN, 3ª edição (04/09/2025)";

// Impede que cenários degenerativos sejam aplicados a diagnósticos com regras próprias
// ou que exigem cenário específico ainda não parametrizado.
const isNonDegenerativeDiagnosis = diagnosis =>
  /fratura|fratura-luxação|trauma|tumor|neoplas|metástase|metastase|osteomielite|espondilodiscite|discite|abscesso|infe[cç][aã]o|escoliose|cifose|deformidade|hemiv[eé]rtebra|malforma[cç][aã]o/i.test(diagnosis || "");

const scenarios = [
  {
    id: "vertebral-tumor-anterior-corpectomy",
    title: "Tumor do corpo vertebral — via anterior/lateral com corpectomia",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Outro"].includes(subtype) &&
      ["Cervical", "Torácica", "Toracolombar", "Lombar"].includes(region) &&
      ["Anterior", "Lateral", "Anterior e posterior"].includes(approach) &&
      /tumor|neoplas|met[aá]stase/i.test(diagnosis || "") &&
      /corpectom|substitui[cç][aã]o do corpo/i.test(diagnosis || ""),
    reference: "Cenário 4.1, p. 85–86; 4.3 se houver tempo posterior",
    codes: [
      { code: "3.07.15.38-5", description: "Tumor ósseo vertebral: ressecção com substituição, com ou sem instrumentação", role: "principal", condition: "Tumor do corpo vertebral com corpectomia." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "associado", condition: "Quantidade depende do número de corpos ressecados; não calculada automaticamente." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "associado", condition: "Multiplicidade específica da corpectomia; conferir fórmula do manual." },
      { code: "3.07.15.18-0", description: "Hérnia tóraco-lombar — discectomias para corpectomia", role: "condicional", condition: "Conforme localização torácica/lombar e fórmula específica." },
      { code: "3.07.15.39-3", description: "Hérnia cervical — discectomias para corpectomia", role: "condicional", condition: "Conforme localização cervical; alternativa anatômica ao código toracolombar." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizado." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Conforme técnica/tabela; não presumir etapa independente." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada, conforme nota do cenário." },
      { code: "3.09.10.13-7", description: "Lesões vasculares intra-abdominais", role: "evento", condition: "Somente se lesão inadvertida ocorrer no acesso anterior lombar e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; código destinado à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração e registro aplicáveis." }
    ]
  },
  {
    id: "vertebral-tumor-posterior-corpectomy",
    title: "Tumor vertebral torácico/lombar — via posterior com corpectomia",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Outro"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar"].includes(region) &&
      approach === "Posterior" &&
      /tumor|neoplas|met[aá]stase/i.test(diagnosis || "") &&
      /corpectom|substitui[cç][aã]o do corpo/i.test(diagnosis || ""),
    reference: "Cenário 4.2, p. 87–89",
    codes: [
      { code: "3.07.15.38-5", description: "Tumor ósseo vertebral", role: "principal", condition: "Ressecção de tumor vertebral com corpectomia posterior." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos efetivamente instrumentados." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "associado", condition: "Configuração 360°; multiplicidade depende da corpectomia." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "associado", condition: "Quantidade depende do número de corpos ressecados." },
      { code: "3.07.15.18-0", description: "Hérnia tóraco-lombar — discectomias da corpectomia", role: "condicional", condition: "Multiplicidade específica; não calcular sem número de corpos." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Conforme técnica efetivamente realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Canal estreito microcirúrgico por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.06.01.02-9", description: "Costectomia", role: "condicional", condition: "Somente quando necessária costo-transversectomia." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Conforme técnica/tabela; não presumir etapa independente." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração e registro aplicáveis." }
    ]
  },
  {
    id: "vertebral-tumor-posterior-fusion",
    title: "Tumor ósseo vertebral posterior — ressecção com artrodese, sem corpectomia",
    match: ({ subtype, region, approach, diagnosis }) =>
      subtype === "Artrodese" &&
      ["Cervical", "Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      approach === "Posterior" &&
      /tumor|neoplas|met[aá]stase/i.test(diagnosis || "") &&
      !/corpectom|substitui[cç][aã]o do corpo|canal|intradural|intramedular|extradural/i.test(diagnosis || ""),
    reference: "Cenários 4.4 e 4.6, p. 94–99",
    codes: [
      { code: "3.07.15.38-5", description: "Tumor ósseo vertebral", role: "principal", condition: "Ressecção de tumor ósseo vertebral com estabilização." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos efetivamente instrumentados." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Conforme ressecção posterior realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se houver compressão e etapa descompressiva." },
      { code: "3.07.15.36-9", description: "Canal estreito microcirúrgico por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Conforme técnica/tabela e etapa realizada." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se presente e tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração e registro aplicáveis." }
    ]
  },
  {
    id: "vertebral-tumor-posterior-decompression",
    title: "Tumor ósseo vertebral posterior — ressecção sem artrodese",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Descompressão", "Outro"].includes(subtype) &&
      ["Cervical", "Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      approach === "Posterior" &&
      /tumor|neoplas|met[aá]stase/i.test(diagnosis || "") &&
      !/corpectom|substitui[cç][aã]o do corpo|canal|intradural|intramedular|extradural/i.test(diagnosis || ""),
    reference: "Cenários 4.5 e 4.7, p. 96–101",
    codes: [
      { code: "3.07.15.38-5", description: "Tumor ósseo vertebral", role: "principal", condition: "Ressecção de tumor ósseo vertebral sem artrodese." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se houver compressão e etapa descompressiva." },
      { code: "3.07.15.36-9", description: "Canal estreito microcirúrgico por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Conforme técnica/tabela e etapa realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se presente e tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração e registro aplicáveis." }
    ]
  },
  {
    id: "spinal-canal-tumor",
    title: "Tumor do canal vertebral — microcirurgia",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Descompressão", "Outro"].includes(subtype) &&
      ["Cervical", "Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      approach === "Posterior" &&
      /tumor|neoplas|les[aã]o intramedular|les[aã]o intradural|mav|siringomielia/i.test(diagnosis || "") &&
      /canal|intradural|intramedular|extradural|medular/i.test(diagnosis || ""),
    reference: "Cenários 4.9 e 4.10, p. 104–107",
    codes: [
      { code: "3.07.15.35-0", description: "Tratamento microcirúrgico de lesões intramedulares", role: "principal", condition: "Selecionar para localização intramedular; conferir anatomia." },
      { code: "3.07.15.20-2", description: "Microcirurgia para tumores extra-intradurais", role: "condicional", condition: "Alternativa ao código intramedular conforme localização; não somar automaticamente." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "condicional", condition: "Somente no cenário com instabilidade/potencial instabilidade e artrodese." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Conforme técnica." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Canal estreito microcirúrgico por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Conforme nota específica; cenário 4.10 menciona durotomia programada ou inadvertida." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração e registro aplicáveis." }
    ]
  },
  {
    id: "traumatic-fracture-posterior",
    title: "Fratura toracolombar/sacral — fixação posterior sem corpectomia",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Lombar", "Toracolombar", "Torácica", "Sacral"].includes(region) &&
      ["Posterior", "Percutânea"].includes(approach) &&
      /fratura|fratura-luxação|trauma/i.test(diagnosis || ""),
    reference: "Cenário 3.1, p. 65–66",
    codes: [
      { code: "3.07.15.16-4", description: "Fratura ou fratura-luxação de coluna — tratamento cirúrgico", role: "principal", condition: "Código do cenário traumático; cobrança uma única vez, conforme manual." },
      { code: "3.07.15.01-6", description: "Artrodese da coluna com instrumentação por segmento", role: "associado", condition: "Conforme segmentos efetivamente instrumentados/artrodesados." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se houver compressão e etapa descompressiva efetiva." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se a técnica microcirúrgica do canal estreito for realizada." },
      { code: "3.07.15.31-8", description: "Lesão traumática raquimedular", role: "condicional", condition: "Somente quando houver trauma raquimedular documentado." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada efetiva." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Com justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se fístula pós-traumática/inadvertida ocorrer e for tratada; nunca pré-selecionar." }
    ]
  },
  {
    id: "cervical-anterior-fusion",
    title: "Artrodese cervical anterior",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      region === "Cervical" && approach === "Anterior" &&
      !isNonDegenerativeDiagnosis(diagnosis),
    reference: "Cenário 2.11, p. 49–50",
    codes: [
      { code: "3.07.15.02-4", description: "Artrodese de coluna via anterior ou póstero-lateral — tratamento cirúrgico", role: "principal", condition: "Código principal da artrodese cervical anterior." },
      { code: "3.07.15.39-3", description: "Hérnia de disco cervical — tratamento cirúrgico", role: "associado", condition: "Etapa discal correspondente à descompressão/artrodese planejada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se houver estenose tratada por etapa microcirúrgica." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se a etapa descompressiva correspondente for realizada." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada efetiva." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Com justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer inadvertidamente e for tratada; nunca pré-selecionar." }
    ]
  },
  {
    id: "cervical-disc-arthroplasty",
    title: "Artroplastia discal cervical",
    match: ({ subtype, region, approach }) =>
      subtype === "Artroplastia" && region === "Cervical" && approach === "Anterior",
    reference: "Cenário 2.12, p. 51–52",
    codes: [
      { code: "3.07.15.59-8", description: "Artroplastia discal de coluna vertebral", role: "principal", condition: "Prótese discal: uma por segmento; cenário descrito para um ou dois níveis C3–C7, sem instabilidade." },
      { code: "3.07.15.39-3", description: "Hérnia de disco cervical — tratamento cirúrgico", role: "associado", condition: "Etapa discal correspondente ao nível tratado." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se houver estenose tratada por etapa microcirúrgica." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se a etapa descompressiva correspondente for realizada." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Com justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer inadvertidamente e for tratada; nunca pré-selecionar." }
    ]
  },
  {
    id: "posterior-spinal-infection",
    title: "Espondilodiscite/abscesso epidural torácico ou lombar — via posterior sem artrodese",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Descompressão", "Discectomia"].includes(subtype) &&
      ["Lombar", "Toracolombar", "Torácica"].includes(region) &&
      ["Posterior", "Percutânea"].includes(approach) &&
      /espondilodiscite|discite|osteomielite|abscesso epidural/i.test(diagnosis || ""),
    reference: "Cenário 6.2, p. 134–135",
    codes: [
      { code: "3.07.15.21-0", description: "Osteomielite de coluna — tratamento cirúrgico", role: "principal", condition: "Código principal para o tratamento cirúrgico da infecção vertebral." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar — tratamento cirúrgico", role: "condicional", condition: "Somente se houver anulotomia/discectomia parcial para coleta e limpeza intradiscal, conforme cenário." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se houver etapa descompressiva efetiva." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se realizada a técnica correspondente." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Se houver coleta/etapa de biópsia; observar a divergência textual indicada na extração do manual." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Com justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer inadvertidamente e for tratada; nunca pré-selecionar." }
    ]
  },
  {
    id: "endoscopic-disc-herniation",
    title: "Hérnia discal por via endoscópica",
    match: ({ subtype, approach, diagnosis }) =>
      subtype === "Cirurgia endoscópica" && approach === "Endoscópica" &&
      /h[eé]rnia|disco extruso|disco sequestrado/i.test(diagnosis || ""),
    reference: "Cenário 7.2, p. 148–149",
    codes: [
      { code: "3.07.15.05-9", description: "Cirurgia de coluna por via endoscópica", role: "principal", condition: "Cobrança uma única vez por procedimento endoscópico." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar — tratamento cirúrgico", role: "condicional", condition: "Utilizar conforme localização torácica/lombar; excludente do código cervical." },
      { code: "3.07.15.39-3", description: "Hérnia de disco cervical — tratamento cirúrgico", role: "condicional", condition: "Utilizar conforme localização cervical; excludente do código tóraco-lombar." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se houver estenose concomitante tratada." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se a etapa descompressiva correspondente for realizada." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.16.02.16-9", description: "Bloqueio peridural ou subaracnóideo com corticoide", role: "condicional", condition: "Consta na tabela do cenário; confirmar pertinência e condição antes de selecionar." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer inadvertidamente e for tratada; nunca pré-selecionar." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Código conforme outros cenários do manual; a tabela 7.2 apresenta divergência de transcrição que exige conferência visual antes do uso." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Código conforme outros cenários; a tabela 7.2 apresenta divergência de transcrição que exige conferência visual antes do uso." }
    ]
  },
  {
    id: "lumbar-disc-herniation",
    title: "Hérnia de disco lombar sem instabilidade — discectomia",
    match: ({ subtype, region, diagnosis }) =>
      ["Discectomia", "Descompressão"].includes(subtype) &&
      ["Lombar", "Toracolombar"].includes(region) &&
      /h[eé]rnia|h[eé]rnia discal|disco extruso|disco sequestrado/i.test(diagnosis || ""),
    reference: "Cenário 2.1, p. 29–30",
    codes: [
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar — tratamento cirúrgico", role: "principal", condition: "Código principal do cenário para hérnia lombar sem instabilidade que demande artrodese/fixação." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal vertebral estreito por segmento", role: "condicional", condition: "Somente se houver estenose concomitante efetivamente tratada." },
      { code: "3.07.15.09-1", description: "Descompressão medular e/ou cauda equina", role: "condicional", condition: "Somente se a etapa descompressiva correspondente for efetivamente realizada." },
      { code: "3.07.15.19-9", description: "Laminectomia ou laminotomia", role: "condicional", condition: "Somente se essa etapa de acesso/descompressão for executada; não presumir." },
      { code: "4.08.11.02-6", description: "Radioscopia para acompanhamento de procedimento cirúrgico", role: "condicional", condition: "Por hora ou fração, conforme regra e registro aplicáveis." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória em cirurgias espinhais e ortopedia", role: "condicional", condition: "Exige justificativa clínica; código destinado à equipe de neuromonitorização." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Evento intraoperatório: nunca pré-selecionar; registrar somente se ocorrer inadvertidamente e for tratado." }
    ]
  },
  {
    id: "degenerative-posterior-fusion",
    title: "Artrodese tóraco-lombar posterior",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Lombar", "Toracolombar", "Torácica", "Multissegmentar"].includes(region) &&
      ["Posterior", "Percutânea"].includes(approach) &&
      !isNonDegenerativeDiagnosis(diagnosis),
    reference: "Cenário 2.6, p. 39–40",
    codes: [
      { code: "3.07.15.01-6", description: "Artrodese da coluna com instrumentação por segmento", role: "principal", condition: "Conforme segmentos efetivamente artrodesados; confirmar unidade de cobrança." },
      { code: "3.07.15.02-4", description: "Artrodese de coluna via anterior ou póstero-lateral — tratamento cirúrgico", role: "condicional", condition: "Selecionar somente quando o plano incluir artrodese 360° com os tempos/vias correspondentes; não usar automaticamente em artrodese posterior isolada. Validar cenário e contrato." },
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
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Lombar", "Multissegmentar"].includes(region) &&
      ["Anterior", "Lateral", "Anterior e posterior"].includes(approach) &&
      !isNonDegenerativeDiagnosis(diagnosis),
    reference: "Cenário 2.7, p. 41–42",
    codes: [
      { code: "3.07.15.01-6", description: "Artrodese da coluna com instrumentação por segmento", role: "principal", condition: "Conforme segmentos efetivamente instrumentados/artrodesados." },
      { code: "3.07.15.02-4", description: "Artrodese de coluna via anterior ou póstero-lateral — tratamento cirúrgico", role: "condicional", condition: "Selecionar somente se forem realizados os tempos/vias que caracterizam artrodese 360°; separar os tempos no pedido e validar contrato." },
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
      /estenose|canal estreito/i.test(diagnosis || "") &&
      !isNonDegenerativeDiagnosis(diagnosis),
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
