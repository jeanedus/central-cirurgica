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
    id: "pain-cryo-denervation",
    title: "Criodenervação facetária por segmento",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Descompressão"].includes(subtype) && ["Percutânea", "Outra / não definida"].includes(approach) && /criodenerva[cç][aã]o/i.test(diagnosis || ""),
    reference: "Cenário 8.2, p. 158",
    codes: [
      { code: "3.14.03.03-4", description: "Denervação percutânea de faceta articular — por segmento", role: "principal", condition: "Multiplicar pelo número de segmentos vertebrais efetivamente denervados." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-chemical-denervation",
    title: "Denervação facetária por método químico",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Descompressão"].includes(subtype) && ["Percutânea", "Outra / não definida"].includes(approach) && /denerva[cç][aã]o.*(qu[ií]mic|[aá]lcool|fenol|oz[oô]nio)|(qu[ií]mic|[aá]lcool|fenol).*denerva[cç][aã]o/i.test(diagnosis || ""),
    reference: "Cenário 8.3, p. 159",
    codes: [
      { code: "3.14.03.03-4", description: "Denervação percutânea de faceta articular — por segmento", role: "principal", condition: "Multiplicar pelo número de segmentos vertebrais abordados." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-neurostimulation-laminectomy-test",
    title: "Neuroestimulação medular por laminectomia — fase teste",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Descompressão"].includes(subtype) && ["Posterior", "Outra / não definida"].includes(approach) && /neuroestimul|estimula[cç][aã]o el[eé]trica medular/i.test(diagnosis || "") && /teste|trial/i.test(diagnosis || "") && /laminectomia|laminotomia|aberta/i.test(diagnosis || ""),
    reference: "Cenário 8.7, p. 163",
    codes: [
      { code: "3.14.01.10-4", description: "Implante de eletrodos medular ou cerebral", role: "principal", condition: "Implante de eletrodo para fase teste." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "associado", condition: "Acesso por laminectomia/laminotomia." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-neurostimulation-laminectomy-implant",
    title: "Neuroestimulação medular por laminectomia — implante definitivo",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Descompressão"].includes(subtype) && ["Posterior", "Outra / não definida"].includes(approach) && /neuroestimul|estimula[cç][aã]o el[eé]trica medular/i.test(diagnosis || "") && /implante definitivo|gerador definitivo/i.test(diagnosis || "") && /laminectomia|laminotomia|aberta/i.test(diagnosis || ""),
    reference: "Cenário 8.8, p. 164",
    codes: [
      { code: "3.14.01.10-4", description: "Implante de eletrodos medular ou cerebral", role: "principal", condition: "Conforme eletrodo implantado; conferir se já foi implantado na fase teste." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "associado", condition: "Acesso por laminectomia/laminotomia." },
      { code: "3.14.03.14-0", description: "Implante de gerador para neuroestimulação", role: "associado", condition: "Implante do gerador definitivo." },
      { code: "4.01.03.43-9", description: "Impedanciometria", role: "condicional", condition: "Conforme teste do sistema." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-neurostimulation-revision",
    title: "Revisão de sistema de neuroestimulação",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Revisão de artrodese"].includes(subtype) && ["Posterior", "Percutânea", "Outra / não definida"].includes(approach) && /revis[aã]o.*(neuroestimul|estimulador)|neuroestimul.*revis[aã]o/i.test(diagnosis || ""),
    reference: "Cenário 8.9, p. 165",
    codes: [
      { code: "3.14.01.22-8", description: "Revisão de sistema de neuroestimulação", role: "principal", condition: "Conforme componente do sistema revisado e localização do eletrodo." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme técnica e registro." }
    ]
  },
  {
    id: "pain-selective-rhizotomy-spasticity",
    title: "Rizotomia seletiva/superseletiva para espasticidade",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Descompressão"].includes(subtype) && ["Posterior", "Outra / não definida"].includes(approach) && /rizotomia seletiva|rizotomia superseletiva|espasticidade/i.test(diagnosis || ""),
    reference: "Cenário 8.10, p. 166",
    codes: [
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "associado", condition: "Conforme acesso cirúrgico descrito." },
      { code: "3.14.03.12-3", description: "Exploração cirúrgica de nervos (neurólise externa)", role: "principal", condition: "Conforme nervos explorados." },
      { code: "3.14.03.21-2", description: "Microneurólise intraneural ou intrafascicular de dois ou mais nervos", role: "condicional", condition: "Conforme etapa intraneural/intrafascicular realizada." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme técnica e registro; conferir inconsistência textual da indicação no manual." }
    ]
  },
  {
    id: "pain-ozone-therapy",
    title: "Ozonioterapia para controle de dor osteomuscular da coluna",
    match: ({ subtype, approach, diagnosis }) => ["Outro", "Descompressão"].includes(subtype) && ["Percutânea", "Outra / não definida"].includes(approach) && /oz[oô]nio|ozonioterapia/i.test(diagnosis || ""),
    reference: "Cenário 8.13, p. 169",
    codes: [
      { code: "3.07.15.39-3", description: "Hérnia de disco cervical", role: "condicional", condition: "Conforme segmento cervical efetivamente tratado; alternativa anatômica ao código toracolombar." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Conforme segmento torácico/lombar efetivamente tratado; normalmente excludente do código cervical, salvo segmentos distintos." },
      { code: "4.08.13.36-3", description: "Coluna vertebral: infiltração foraminal ou facetária ou articular", role: "associado", condition: "Uma vez por procedimento conforme nota específica do cenário 8.13; não aplicar multiplicador do cenário 8.1." },
      { code: "3.16.02.16-9", description: "Bloqueio peridural ou subaracnóideo com corticoide", role: "condicional", condition: "Multiplicidade por segmentos/níveis conforme nota específica do cenário 8.13." },
      { code: "3.16.02.12-6", description: "Bloqueio facetário para-espinhoso", role: "condicional", condition: "Conforme segmentos/níveis efetivamente bloqueados." },
      { code: "2.01.03.30-1", description: "Infiltração de ponto gatilho ou agulhamento seco", role: "condicional", condition: "Por músculo efetivamente tratado." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "postoperative-spinal-infection",
    title: "Infecção pós-operatória da coluna — desbridamento/drenagem",
    match: ({ subtype, diagnosis }) =>
      ["Outro", "Descompressão", "Revisão de artrodese"].includes(subtype) &&
      /infec[cç][aã]o|abscesso|osteomielite|espondilodiscite/i.test(diagnosis || "") &&
      /p[oó]s.?operat[oó]ria|ferida operat[oó]ria|instrumenta[cç][aã]o pr[eé]via|implante infectado/i.test(diagnosis || ""),
    reference: "Cenário 6.3, p. 136–137",
    codes: [
      { code: "3.07.15.21-0", description: "Osteomielite de coluna — tratamento cirúrgico", role: "principal", condition: "Tratamento cirúrgico da infecção vertebral." },
      { code: "3.01.01.28-0", description: "Desbridamento cirúrgico — por unidade topográfica", role: "associado", condition: "Conforme unidades topográficas efetivamente tratadas." },
      { code: "3.01.01.62-0", description: "Incisão e drenagem de abscesso, hematoma ou panarício", role: "condicional", condition: "Se houver coleção/abscesso drenado." },
      { code: "3.01.01.23-9", description: "Curativo especial sob anestesia — por unidade topográfica", role: "condicional", condition: "Se realizado conforme cenário." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.24-5", description: "Pseudartrose de coluna — tratamento cirúrgico", role: "condicional", condition: "Se instrumentação prévia com pseudartrose." },
      { code: "3.07.15.27-0", description: "Retirada de material de síntese", role: "condicional", condition: "Se houver necessidade de troca/retirada do material." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "condicional", condition: "Somente se houver nova artrodese." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "condicional", condition: "Somente se houver nova artrodese 360°." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Se necessário em procedimento cervical posterior." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se intercorrência ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "spinal-infection-with-fusion",
    title: "Espondilodiscite/abscesso epidural — tratamento com artrodese",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Cervical", "Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      ["Anterior", "Posterior", "Lateral", "Anterior e posterior"].includes(approach) &&
      /espondilodiscite|discite|osteomielite|abscesso epidural/i.test(diagnosis || ""),
    reference: "Cenário 6.1, p. 130–133",
    codes: [
      { code: "3.07.15.21-0", description: "Osteomielite de coluna — tratamento cirúrgico", role: "principal", condition: "Tratamento cirúrgico da infecção vertebral." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos; concomitante ao 3.07.15.02-4 na artrodese 360°." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "condicional", condition: "Concomitante ao 3.07.15.01-6 quando artrodese 360°." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "condicional", condition: "Somente se corpectomia." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Conforme discectomia e localização torácica/lombar." },
      { code: "3.07.15.39-3", description: "Hérnia de disco cervical", role: "condicional", condition: "Conforme discectomia e localização cervical; alternativa anatômica ao código toracolombar." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.06.01.02-9", description: "Costectomia", role: "condicional", condition: "Conforme arcos costais efetivamente retirados." },
      { code: "3.06.01.19-3", description: "Toracotomia para procedimentos ortopédicos sobre a coluna", role: "condicional", condition: "Somente se acesso por toracotomia anterior/lateral." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Conforme coleta/etapa realizada e tabela aplicável." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Conforme necessidade de posicionamento/fixação cervical." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "spinal-infection-posterior-no-fusion",
    title: "Espondilodiscite/abscesso epidural — via posterior sem artrodese",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Descompressão", "Outro"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar"].includes(region) &&
      ["Posterior", "Endoscópica"].includes(approach) &&
      /espondilodiscite|discite|osteomielite|abscesso epidural/i.test(diagnosis || "") &&
      !/artrodese|instabilidade/i.test(diagnosis || ""),
    reference: "Cenário 6.2, p. 134–135",
    codes: [
      { code: "3.07.15.21-0", description: "Osteomielite de coluna — tratamento cirúrgico", role: "principal", condition: "Código principal do cenário sem artrodese." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Se houver anulotomia/discectomia parcial para coleta e limpeza intradiscal." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "condicional", condition: "Se houver coleta/etapa de biópsia; extração do manual aponta divergência na observação geral." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "spinal-foreign-body-removal",
    title: "Retirada de corpo estranho na coluna",
    match: ({ subtype, diagnosis }) =>
      ["Descompressão", "Outro"].includes(subtype) &&
      /corpo estranho|fragmento met[aá]lico|proj[eé]til|estilha[cç]o/i.test(diagnosis || ""),
    reference: "Cenário 6.4, p. 138–139",
    codes: [
      { code: "3.07.15.31-8", description: "Tratamento cirúrgico da lesão traumática raquimedular", role: "condicional", condition: "Conforme lesão traumática raquimedular documentada." },
      { code: "3.07.15.26-1", description: "Retirada de corpo estranho — tratamento cirúrgico", role: "principal", condition: "Retirada efetiva de corpo estranho." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "spinal-biopsy",
    title: "Biópsia de lesão vertebral",
    match: ({ subtype, diagnosis }) =>
      ["Outro", "Descompressão"].includes(subtype) &&
      /bi[oó]psia/i.test(diagnosis || "") &&
      /les[aã]o vertebral|les[aã]o [oó]ssea|coluna/i.test(diagnosis || ""),
    reference: "Cenário 6.6, p. 143",
    codes: [
      { code: "3.07.15.03-2", description: "Biópsia da coluna", role: "principal", condition: "Conforme lesão e técnica de biópsia." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "open-csf-fistula-repair",
    title: "Tratamento cirúrgico de fístula liquórica aberta",
    match: ({ subtype, diagnosis }) =>
      ["Outro", "Revisão de artrodese"].includes(subtype) &&
      /f[ií]stula liqu[oó]rica|vazamento de l[ií]quor|liquorr[eé]ia/i.test(diagnosis || "") &&
      /reopera[cç][aã]o|p[oó]s.?operat[oó]ria|aberta/i.test(diagnosis || ""),
    reference: "Cenário 6.7, p. 144",
    codes: [
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "principal", condition: "Fístula persistente/alto débito tratada cirurgicamente." },
      { code: "3.01.01.62-0", description: "Incisão e drenagem de abscesso, hematoma ou panarício", role: "condicional", condition: "Conforme coleção liquórica/hematoma/infecciosa drenada." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme técnica e registro." }
    ]
  },
  {
    id: "pain-facet-infiltration",
    title: "Infiltração/bloqueio facetário ou foraminal",
    match: ({ subtype, approach, diagnosis }) =>
      ["Outro", "Descompressão"].includes(subtype) &&
      ["Percutânea", "Outra / não definida"].includes(approach) &&
      /bloqueio|infiltra[cç][aã]o|dor facet[aá]ria|dor radicular/i.test(diagnosis || "") &&
      !/radiofrequ[eê]ncia|rizotomia|crio|oz[oô]nio|discografia|neuroestimul/i.test(diagnosis || ""),
    reference: "Cenário 8.1, p. 157",
    codes: [
      { code: "4.08.13.36-3", description: "Coluna vertebral: infiltração foraminal ou facetária ou articular", role: "principal", condition: "Multiplicar por articulações facetárias e neuroforames efetivamente infiltrados; duas facetas e dois forames por nível segundo manual." },
      { code: "3.14.03.03-4", description: "Denervação percutânea de faceta articular — por segmento", role: "condicional", condition: "Somente se houver denervação do ramo medial; multiplicar por segmentos denervados." },
      { code: "3.16.02.16-9", description: "Bloqueio peridural ou subaracnóideo com corticoide", role: "condicional", condition: "Uma vez por procedimento, conforme cenário 8.1." },
      { code: "3.16.02.12-6", description: "Bloqueio facetário para-espinhoso", role: "condicional", condition: "Conforme técnica efetivamente realizada." },
      { code: "2.01.03.30-1", description: "Infiltração de ponto gatilho ou agulhamento seco", role: "condicional", condition: "Por músculo efetivamente tratado." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-radiofrequency-rhizotomy",
    title: "Rizotomia facetária por radiofrequência",
    match: ({ subtype, approach, diagnosis }) =>
      ["Outro", "Descompressão"].includes(subtype) &&
      ["Percutânea", "Outra / não definida"].includes(approach) &&
      /radiofrequ[eê]ncia|rizotomia facet[aá]ria/i.test(diagnosis || ""),
    reference: "Cenário 8.4, p. 160",
    codes: [
      { code: "3.14.03.33-6", description: "Rizotomia percutânea por segmento — qualquer método", role: "principal", condition: "Multiplicar pelo número de segmentos vertebrais abordados." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-neurostimulation-percutaneous-test",
    title: "Neuroestimulação medular/periférica — fase teste percutânea",
    match: ({ subtype, approach, diagnosis }) =>
      ["Outro", "Descompressão"].includes(subtype) &&
      ["Percutânea", "Outra / não definida"].includes(approach) &&
      /neuroestimul|estimula[cç][aã]o el[eé]trica medular/i.test(diagnosis || "") &&
      /teste|trial/i.test(diagnosis || ""),
    reference: "Cenário 8.5, p. 161",
    codes: [
      { code: "3.14.01.10-4", description: "Implante de eletrodos medular ou cerebral", role: "principal", condition: "Implante de eletrodo na fase teste." },
      { code: "3.16.02.22-3", description: "Passagem de cateter peridural ou subaracnóideo com bloqueio de prova", role: "associado", condition: "Conforme técnica descrita no cenário." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "pain-neurostimulation-percutaneous-implant",
    title: "Neuroestimulação medular/periférica — implante definitivo percutâneo",
    match: ({ subtype, approach, diagnosis }) =>
      ["Outro", "Descompressão"].includes(subtype) &&
      ["Percutânea", "Outra / não definida"].includes(approach) &&
      /neuroestimul|estimula[cç][aã]o el[eé]trica medular/i.test(diagnosis || "") &&
      /implante definitivo|gerador definitivo|implante do gerador/i.test(diagnosis || ""),
    reference: "Cenário 8.6, p. 162",
    codes: [
      { code: "3.14.01.10-4", description: "Implante de eletrodos medular ou cerebral", role: "principal", condition: "Não repetir se o eletrodo definitivo for o mesmo já implantado na fase teste." },
      { code: "3.14.03.14-0", description: "Implante de gerador para neuroestimulação", role: "associado", condition: "Implante do gerador definitivo." },
      { code: "4.01.03.43-9", description: "Impedanciometria", role: "condicional", condition: "Conforme teste do sistema." },
      { code: "3.16.02.22-3", description: "Passagem de cateter peridural ou subaracnóideo com bloqueio de prova", role: "condicional", condition: "Conforme técnica do cenário." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "percutaneous-discectomy-pain",
    title: "Discectomia percutânea para controle da dor",
    match: ({ subtype, approach, diagnosis }) =>
      ["Outro", "Discectomia"].includes(subtype) &&
      ["Percutânea", "Outra / não definida"].includes(approach) &&
      /discectomia percut[aâ]nea/i.test(diagnosis || ""),
    reference: "Cenário 8.11, p. 167",
    codes: [
      { code: "4.08.14.09-2", description: "Osteoplastia ou discectomia percutânea", role: "principal", condition: "Multiplicar pelo número de segmentos/discos operados." },
      { code: "3.16.02.16-9", description: "Bloqueio peridural ou subaracnóideo com corticoide", role: "condicional", condition: "Uma vez por procedimento." },
      { code: "3.16.02.12-6", description: "Bloqueio facetário para-espinhoso", role: "condicional", condition: "Multiplicar por segmentos/níveis bloqueados." },
      { code: "2.01.03.30-1", description: "Infiltração de ponto gatilho ou agulhamento seco", role: "condicional", condition: "Por músculo efetivamente tratado." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "lumbar-discography",
    title: "Discografia lombar",
    match: ({ subtype, approach, diagnosis }) =>
      ["Outro", "Discectomia"].includes(subtype) &&
      ["Percutânea", "Outra / não definida"].includes(approach) &&
      /discografia/i.test(diagnosis || ""),
    reference: "Cenário 8.12, p. 168",
    codes: [
      { code: "4.08.14.10-6", description: "Discografia", role: "principal", condition: "Multiplicar pelo número de segmentos/discos examinados." },
      { code: "3.16.02.16-9", description: "Bloqueio peridural ou subaracnóideo com corticoide", role: "condicional", condition: "Uma vez por procedimento." },
      { code: "3.16.02.12-6", description: "Bloqueio facetário para-espinhoso", role: "condicional", condition: "Multiplicar por segmentos/níveis bloqueados." },
      { code: "2.01.03.30-1", description: "Infiltração de ponto gatilho ou agulhamento seco", role: "condicional", condition: "Por músculo efetivamente tratado." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Conforme registro." }
    ]
  },
  {
    id: "early-onset-scoliosis-growth-system",
    title: "Escoliose de início precoce — sistema de crescimento",
    match: ({ subtype, diagnosis }) =>
      ["Artrodese", "Outro"].includes(subtype) &&
      /escoliose|deformidade/i.test(diagnosis || "") &&
      /in[ií]cio precoce|infantil|sistema de crescimento|haste expans[ií]vel|veptr/i.test(diagnosis || ""),
    reference: "Cenário 5.1, p. 109–110",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "Código principal do cenário de escoliose." },
      { code: "3.07.15.01-6", description: "Artrodese da coluna com instrumentação por segmento", role: "condicional", condition: "Conforme técnica/sistema de crescimento e segmentos efetivamente artrodesados." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada de enxerto, no mesmo sítio ou em outro." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Somente se houver necessidade de tração craniana." },
      { code: "3.07.15.29-6", description: "Tração cervical transesquelética", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.09.03-2", description: "Tração transesquelética por membro", role: "condicional", condition: "Somente se realizada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar risco neurológico/déficit prévio; código destinado à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "growth-rod-lengthening",
    title: "Alongamento de haste de crescimento",
    match: ({ subtype, diagnosis }) =>
      ["Outro", "Artrodese"].includes(subtype) &&
      /alongamento|expans[aã]o|distra[cç][aã]o/i.test(diagnosis || "") &&
      /haste|crescimento|escoliose/i.test(diagnosis || ""),
    reference: "Cenário 5.2, p. 111",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "O manual indica a configuração final exatamente conforme a tabela do cenário." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "previsto_na_tecnica", condition: "Conforme cenário e justificativa; destinado à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "adolescent-scoliosis-posterior-fusion",
    title: "Escoliose do adolescente — artrodese posterior",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Outro"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      approach === "Posterior" &&
      /escoliose/i.test(diagnosis || "") &&
      /adolescente|idiop[aá]tica|juvenil/i.test(diagnosis || "") &&
      !/hemiv[eé]rtebra|cong[eê]nita/i.test(diagnosis || ""),
    reference: "Cenário 5.3, p. 112–114",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "Código principal para correção da escoliose." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos efetivamente artrodesados." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "condicional", condition: "Concomitante ao código 3.07.15.01-6 quando realizada artrodese 360°." },
      { code: "3.07.15.22-9", description: "Osteotomia de coluna vertebral", role: "condicional", condition: "Somente se realizada; VCR segue fórmula específica do manual." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Nos casos de VCR, conforme fórmula específica." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "condicional", condition: "Somente nos casos de VCR." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada." },
      { code: "3.06.01.02-9", description: "Costectomia", role: "condicional", condition: "Quando realizada costoplastia; porte conforme arcos costais." },
      { code: "3.07.15.27-0", description: "Retirada de material de síntese", role: "condicional", condition: "Em cirurgia definitiva de paciente com sistema prévio compatível com crescimento." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer fístula inadvertida e for tratada." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Somente se houver tração craniana." },
      { code: "3.07.15.29-6", description: "Tração cervical transesquelética", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.09.03-2", description: "Tração transesquelética por membro", role: "condicional", condition: "Somente se realizada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "pathologic-kyphosis-posterior-fusion",
    title: "Cifose patológica — artrodese posterior",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Outro"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      approach === "Posterior" &&
      /cifose|dorso curvo/i.test(diagnosis || "") &&
      !/escoliose|hemiv[eé]rtebra|cong[eê]nita/i.test(diagnosis || ""),
    reference: "Cenário 5.4, p. 115–116",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "Código principal do cenário." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos efetivamente artrodesados." },
      { code: "3.07.15.22-9", description: "Osteotomia de coluna vertebral", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Somente se houver tração craniana." },
      { code: "3.07.15.29-6", description: "Tração cervical transesquelética", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.09.03-2", description: "Tração transesquelética por membro", role: "condicional", condition: "Somente se realizada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "congenital-scoliosis-hemivertebra",
    title: "Escoliose congênita — ressecção de hemivértebra e artrodese posterior",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Outro"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar", "Multissegmentar"].includes(region) &&
      approach === "Posterior" &&
      /hemiv[eé]rtebra/i.test(diagnosis || ""),
    reference: "Cenário 5.5, p. 117–118",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "Código para correção da deformidade." },
      { code: "3.07.15.17-2", description: "Hemivértebra — ressecção via anterior ou posterior", role: "associado", condition: "Ressecção da hemivértebra." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos instrumentados." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "associado", condition: "Concomitante na configuração 360° descrita." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "adult-thoracolumbar-deformity-360",
    title: "Deformidade toracolombar/lombar do adulto — artrodese 360°",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar", "Sacral", "Multissegmentar"].includes(region) &&
      ["Anterior e posterior", "Anterior", "Lateral", "Posterior"].includes(approach) &&
      /escoliose|cifose|deformidade/i.test(diagnosis || "") &&
      /adulto|degenerativa|iatrog[eê]nica|sagital|coronal|p[oó]s-laminectomia|p[oó]s-fus[aã]o/i.test(diagnosis || "") &&
      !/hemiv[eé]rtebra|cong[eê]nita|in[ií]cio precoce|adolescente/i.test(diagnosis || ""),
    reference: "Cenário 5.6, p. 119–121",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "Código principal da correção da deformidade." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos instrumentados; concomitante ao 3.07.15.02-4 em 360°." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "associado", condition: "Concomitante ao 3.07.15.01-6 quando realizada artrodese 360°." },
      { code: "3.07.15.22-9", description: "Osteotomia de coluna vertebral", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "condicional", condition: "Somente se corpectomia; multiplicidade conforme número de corpos." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Discectomia para interposição de enxerto/cage ou corpectomia." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.06.01.02-9", description: "Costectomia", role: "condicional", condition: "Conforme técnica e arcos costais abordados." },
      { code: "3.06.01.19-3", description: "Toracotomia para procedimentos ortopédicos sobre a coluna", role: "condicional", condition: "Somente se acesso por toracotomia anterior/lateral." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.24-5", description: "Pseudartrose de coluna — tratamento cirúrgico", role: "condicional", condition: "Deformidade iatrogênica com ou sem pseudartrose, conforme achados." },
      { code: "3.07.15.27-0", description: "Retirada de material de síntese", role: "condicional", condition: "Deformidade iatrogênica com ou sem pseudartrose, se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "adult-cervical-deformity",
    title: "Deformidade cervical/cervicotorácica do adulto",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Cervical", "Torácica", "Multissegmentar"].includes(region) &&
      ["Anterior", "Posterior", "Anterior e posterior"].includes(approach) &&
      /deformidade|cifose|escoliose/i.test(diagnosis || "") &&
      /cervical|cervicotor[aá]cica|cr[aâ]nio.?cervical|adulto/i.test(diagnosis || "") &&
      !/hemiv[eé]rtebra|cong[eê]nita/i.test(diagnosis || ""),
    reference: "Cenário 5.7, p. 122–124",
    codes: [
      { code: "3.07.15.10-5", description: "Dorso curvo/escoliose/giba costal — tratamento cirúrgico", role: "principal", condition: "Código principal para correção da deformidade." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos; concomitante ao 3.07.15.02-4 na artrodese 360°." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "condicional", condition: "Concomitante ao código 3.07.15.01-6 quando realizada artrodese 360°." },
      { code: "3.07.15.22-9", description: "Osteotomia de coluna vertebral", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "condicional", condition: "Somente se corpectomia; multiplicidade conforme corpos." },
      { code: "3.07.15.39-3", description: "Hérnia de disco cervical", role: "condicional", condition: "Discectomia para interposição de enxerto/cage ou corpectomia." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.24-5", description: "Pseudartrose de coluna — tratamento cirúrgico", role: "condicional", condition: "Deformidade iatrogênica com ou sem pseudartrose." },
      { code: "3.07.15.27-0", description: "Retirada de material de síntese", role: "condicional", condition: "Deformidade iatrogênica com ou sem pseudartrose, se realizada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se ocorrer e for tratada." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Conforme necessidade de fixação/tração craniana descrita." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "craniovertebral-malformation-decompression-fusion",
    title: "Malformação craniovertebral — descompressão com fixação occipitocervical",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Descompressão", "Outro"].includes(subtype) &&
      ["Cervical", "Multissegmentar"].includes(region) &&
      ["Posterior", "Anterior e posterior"].includes(approach) &&
      /malforma[cç][aã]o craniovertebral|chiari|impress[aã]o basilar|invagina[cç][aã]o basilar|instabilidade atlanto.?axial/i.test(diagnosis || ""),
    reference: "Cenários 5.8 e 5.9, p. 125–128",
    codes: [
      { code: "3.07.15.32-6", description: "Tratamento cirúrgico das malformações craniovertebrais", role: "principal", condition: "Código principal do cenário." },
      { code: "3.07.15.35-0", description: "Tratamento microcirúrgico das lesões intramedulares", role: "condicional", condition: "Conforme presença e tratamento de lesão intramedular, MAV ou siringomielia." },
      { code: "3.02.15.02-1", description: "Craniotomia descompressiva", role: "previsto_na_tecnica", condition: "Conforme técnica de descompressão da fossa posterior." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "previsto_na_tecnica", condition: "Conforme etapa descompressiva descrita." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "previsto_na_tecnica", condition: "Conforme níveis abordados, incluindo C1 quando realizado." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "condicional", condition: "No cenário com fixação occipitocervical (5.9), conforme segmentos." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto ósseo autólogo", role: "condicional", condition: "Somente se houver retirada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "condicional", condition: "Conforme ampliação dural/duroplastia e nota do cenário; conferir página original antes de cobrar." },
      { code: "3.01.01.68-9", description: "Reconstrução com retalhos de gálea aponeurótica", role: "condicional", condition: "Somente se houver ampliação dural com gálea." },
      { code: "3.07.09.01-6", description: "Instalação de halo craniano", role: "condicional", condition: "Conforme posicionamento/fixação da cabeça descritos." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Justificar; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "previsto_na_tecnica", condition: "Por hora ou fração, conforme registro." }
    ]
  },
  {
    id: "traumatic-fracture-posterior-corpectomy",
    title: "Fratura toracolombar — corpectomia posterior",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar", "Sacral"].includes(region) &&
      approach === "Posterior" &&
      /fratura|fratura-luxação|trauma/i.test(diagnosis || "") &&
      /corpectom|substitui[cç][aã]o do corpo/i.test(diagnosis || ""),
    reference: "Cenário 3.2, p. 67–68",
    codes: [
      { code: "3.07.15.16-4", description: "Fratura/fratura-luxação de coluna — tratamento cirúrgico", role: "principal", condition: "Cobrança uma única vez, conforme manual." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos instrumentados." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "associado", condition: "Conforme corpectomia e configuração 360°; multiplicidade específica do manual." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "associado", condition: "Conforme número de corpos ressecados; não calcular automaticamente." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Discectomias para corpectomia; multiplicidade específica." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Conforme técnica." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.31-8", description: "Lesão traumática raquimedular", role: "condicional", condition: "Somente quando houver trauma raquimedular documentado." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.06.01.02-9", description: "Costectomia", role: "condicional", condition: "Conforme costo-transversectomia; porte conforme número de arcos." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se presente e tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração." }
    ]
  },
  {
    id: "traumatic-fracture-360-corpectomy",
    title: "Fratura toracolombar — corpectomia anterior/lateral e fixação posterior 360°",
    match: ({ subtype, region, approach, diagnosis }) =>
      ["Artrodese", "Revisão de artrodese"].includes(subtype) &&
      ["Torácica", "Toracolombar", "Lombar"].includes(region) &&
      ["Anterior e posterior", "Anterior", "Lateral"].includes(approach) &&
      /fratura|fratura-luxação|trauma/i.test(diagnosis || "") &&
      /corpectom|substitui[cç][aã]o do corpo/i.test(diagnosis || ""),
    reference: "Cenário 3.3, p. 69–71",
    codes: [
      { code: "3.07.15.16-4", description: "Fratura/fratura-luxação de coluna — tratamento cirúrgico", role: "principal", condition: "Cobrança uma única vez, conforme manual." },
      { code: "3.07.15.01-6", description: "Artrodese instrumentada por segmento", role: "associado", condition: "Conforme segmentos instrumentados." },
      { code: "3.07.15.02-4", description: "Artrodese via anterior/póstero-lateral", role: "associado", condition: "Concomitante na configuração 360°; separar vias/tempos e validar contrato." },
      { code: "3.07.15.28-8", description: "Substituição de corpo vertebral", role: "associado", condition: "Conforme número de corpos ressecados; não calcular automaticamente." },
      { code: "3.07.15.18-0", description: "Hérnia de disco tóraco-lombar", role: "condicional", condition: "Discectomias para corpectomia; multiplicidade específica." },
      { code: "3.07.15.19-9", description: "Laminectomia/laminotomia", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.09-1", description: "Descompressão medular/cauda equina", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.36-9", description: "Tratamento microcirúrgico do canal estreito por segmento", role: "condicional", condition: "Somente se realizada." },
      { code: "3.07.15.31-8", description: "Lesão traumática raquimedular", role: "condicional", condition: "Somente se houver trauma raquimedular." },
      { code: "3.07.32.02-6", description: "Retirada de enxerto autólogo", role: "condicional", condition: "Somente se realizada." },
      { code: "3.06.01.02-9", description: "Costectomia", role: "condicional", condition: "Conforme técnica póstero-lateral." },
      { code: "3.06.01.19-3", description: "Toracotomia para procedimento ortopédico sobre coluna", role: "condicional", condition: "Somente se acesso torácico anterior/lateral." },
      { code: "3.09.10.13-7", description: "Lesão vascular intra-abdominal", role: "evento", condition: "Somente se lesão inadvertida em acesso anterior lombar for tratada." },
      { code: "3.14.01.26-0", description: "Tratamento cirúrgico da fístula liquórica", role: "evento", condition: "Somente se presente e tratada." },
      { code: "2.02.02.09-1", description: "Monitorização neurofisiológica intraoperatória", role: "condicional", condition: "Se justificada; destinada à equipe de neuromonitorização." },
      { code: "4.08.11.02-6", description: "Radioscopia", role: "condicional", condition: "Conforme tempo/fração." }
    ]
  },
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
