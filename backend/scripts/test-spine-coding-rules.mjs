import assert from "node:assert/strict";
import { getSpineCodingSuggestions } from "../../src/data/spine-coding-rules.js";

const base = { subtype: "Artrodese", region: "Lombar", approach: "Posterior" };

// Regression: degenerative fusion matching previously referenced diagnosis without
// destructuring it, which could throw a ReferenceError.
const degenerative = getSpineCodingSuggestions({ ...base, diagnosis: "Espondilolistese degenerativa" });
assert.equal(degenerative?.scenarioId, "degenerative-posterior-fusion");
assert.equal(degenerative.codes[0].role, "principal");
assert.ok(degenerative.codes.every(code => code.system === "SOCIETY_MANUAL" && code.requiresReview));

// Trauma must not fall through into the degenerative fusion scenario.
const trauma = getSpineCodingSuggestions({ ...base, diagnosis: "Fratura L2 tipo B2" });
assert.equal(trauma?.scenarioId, "traumatic-fracture-posterior");
assert.equal(trauma.codes[0].code, "3.07.15.16-4");

// Infection must select its dedicated scenario and never the generic fusion set.
const infection = getSpineCodingSuggestions({
  subtype: "Descompressão", region: "Toracolombar", approach: "Posterior",
  diagnosis: "Espondilodiscite com abscesso epidural"
});
assert.equal(infection?.scenarioId, "spinal-infection-posterior-no-fusion");

// Tumor, deformity and infection diagnoses must not be suggested as generic
// degenerative posterior fusion when no dedicated scenario is available.
for (const diagnosis of ["Tumor vertebral T11", "Escoliose degenerativa", "Osteomielite vertebral"]) {
  const result = getSpineCodingSuggestions({ ...base, diagnosis });
  assert.notEqual(result?.scenarioId, "degenerative-posterior-fusion");
}

// Fraturas com corpectomia devem preceder o cenário traumático sem corpectomia.
const traumaCorpectomy = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Toracolombar", approach: "Posterior",
  diagnosis: "Fratura L2 tipo B2 com corpectomia e substituição do corpo"
});
assert.equal(traumaCorpectomy?.scenarioId, "traumatic-fracture-posterior-corpectomy");
assert.ok(traumaCorpectomy.codes.some(code => code.code === "3.07.15.28-8"));
assert.equal(traumaCorpectomy.codes.find(code => code.code === "3.07.15.16-4").condition.includes("uma única vez"), true);

const trauma360 = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Toracolombar", approach: "Anterior e posterior",
  diagnosis: "Fratura T12 com corpectomia e substituição do corpo"
});
assert.equal(trauma360?.scenarioId, "traumatic-fracture-360-corpectomy");

const cryo = getSpineCodingSuggestions({
  subtype: "Outro", region: "Lombar", approach: "Percutânea", diagnosis: "Criodenervação facetária"
});
assert.equal(cryo?.scenarioId, "pain-cryo-denervation");

const chemical = getSpineCodingSuggestions({
  subtype: "Outro", region: "Lombar", approach: "Percutânea", diagnosis: "Denervação facetária por método químico com álcool"
});
assert.equal(chemical?.scenarioId, "pain-chemical-denervation");

const stimLaminectomyTest = getSpineCodingSuggestions({
  subtype: "Outro", region: "Torácica", approach: "Posterior",
  diagnosis: "Neuroestimulação medular fase teste por laminectomia"
});
assert.equal(stimLaminectomyTest?.scenarioId, "pain-neurostimulation-laminectomy-test");

const stimLaminectomyImplant = getSpineCodingSuggestions({
  subtype: "Outro", region: "Torácica", approach: "Posterior",
  diagnosis: "Neuroestimulação medular implante definitivo por laminectomia"
});
assert.equal(stimLaminectomyImplant?.scenarioId, "pain-neurostimulation-laminectomy-implant");

const stimRevision = getSpineCodingSuggestions({
  subtype: "Revisão de artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Revisão de sistema de neuroestimulação medular"
});
assert.equal(stimRevision?.scenarioId, "pain-neurostimulation-revision");

const selectiveRhizotomy = getSpineCodingSuggestions({
  subtype: "Outro", region: "Lombar", approach: "Posterior",
  diagnosis: "Rizotomia seletiva para espasticidade"
});
assert.equal(selectiveRhizotomy?.scenarioId, "pain-selective-rhizotomy-spasticity");

const ozone = getSpineCodingSuggestions({
  subtype: "Outro", region: "Lombar", approach: "Percutânea",
  diagnosis: "Ozonioterapia para dor lombar"
});
assert.equal(ozone?.scenarioId, "pain-ozone-therapy");

// Infecções e controle da dor: cenários não devem cair em regras degenerativas.
const postOpInfection = getSpineCodingSuggestions({
  subtype: "Revisão de artrodese", region: "Lombar", approach: "Posterior",
  diagnosis: "Infecção pós-operatória com abscesso e instrumentação prévia"
});
assert.equal(postOpInfection?.scenarioId, "postoperative-spinal-infection");
assert.ok(postOpInfection.codes.some(code => code.code === "3.01.01.28-0"));

const spondylodiscitisNoFusion = getSpineCodingSuggestions({
  subtype: "Descompressão", region: "Lombar", approach: "Posterior",
  diagnosis: "Espondilodiscite lombar com abscesso epidural sem instabilidade"
});
assert.equal(spondylodiscitisNoFusion?.scenarioId, "posterior-spinal-infection");
assert.ok(!spondylodiscitisNoFusion.codes.some(code => code.code === "3.07.15.01-6"));

const radiofrequency = getSpineCodingSuggestions({
  subtype: "Outro", region: "Lombar", approach: "Percutânea",
  diagnosis: "Rizotomia facetária por radiofrequência"
});
assert.equal(radiofrequency?.scenarioId, "pain-radiofrequency-rhizotomy");
assert.ok(radiofrequency.codes.some(code => code.code === "3.14.03.33-6"));

const stimTest = getSpineCodingSuggestions({
  subtype: "Outro", region: "Torácica", approach: "Percutânea",
  diagnosis: "Neuroestimulação medular fase teste percutânea"
});
assert.equal(stimTest?.scenarioId, "pain-neurostimulation-percutaneous-test");

const stimImplant = getSpineCodingSuggestions({
  subtype: "Outro", region: "Torácica", approach: "Percutânea",
  diagnosis: "Neuroestimulação medular implante definitivo do gerador"
});
assert.equal(stimImplant?.scenarioId, "pain-neurostimulation-percutaneous-implant");

const discography = getSpineCodingSuggestions({
  subtype: "Outro", region: "Lombar", approach: "Percutânea",
  diagnosis: "Discografia lombar"
});
assert.equal(discography?.scenarioId, "lumbar-discography");

// Deformidades: roteamento específico por diagnóstico, região e via.
const earlyScoliosis = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Escoliose de início precoce com sistema de crescimento"
});
assert.equal(earlyScoliosis?.scenarioId, "early-onset-scoliosis-growth-system");

const adolescentScoliosis = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Escoliose idiopática do adolescente"
});
assert.equal(adolescentScoliosis?.scenarioId, "adolescent-scoliosis-posterior-fusion");

const hemivertebra = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Toracolombar", approach: "Posterior",
  diagnosis: "Escoliose congênita por hemivértebra"
});
assert.equal(hemivertebra?.scenarioId, "congenital-scoliosis-hemivertebra");

const adultDeformity = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Lombar", approach: "Anterior e posterior",
  diagnosis: "Deformidade lombar degenerativa do adulto com desequilíbrio sagital"
});
assert.equal(adultDeformity?.scenarioId, "deformity-adult-360-fusion");

const craniovertebral = getSpineCodingSuggestions({
  subtype: "Descompressão", region: "Cervical", approach: "Posterior",
  diagnosis: "Malformação craniovertebral tipo Chiari"
});
assert.equal(craniovertebral?.scenarioId, "deformity-craniovertebral-decompression");

// Tumor do corpo vertebral com corpectomia deve cair no cenário específico.
const tumorCorpectomy = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Tumor vertebral T11 com corpectomia e substituição do corpo"
});
assert.equal(tumorCorpectomy?.scenarioId, "vertebral-tumor-posterior-corpectomy");
assert.ok(tumorCorpectomy.codes.some(code => code.code === "3.07.15.28-8"));
assert.ok(tumorCorpectomy.codes.every(code => code.quantity === null && code.requiresReview));

// Tumor ósseo posterior sem corpectomia deve ter família própria.
const tumorFusion = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Tumor ósseo vertebral T10"
});
assert.equal(tumorFusion?.scenarioId, "vertebral-tumor-posterior-fusion");

// Tumor do canal seleciona família de microcirurgia e não soma automaticamente
// os dois códigos anatômicos alternativos.
const canalTumor = getSpineCodingSuggestions({
  subtype: "Descompressão", region: "Cervical", approach: "Posterior",
  diagnosis: "Tumor intradural extramedular do canal cervical"
});
assert.equal(canalTumor?.scenarioId, "spinal-canal-tumor");
assert.ok(canalTumor.codes.find(code => code.code === "3.07.15.20-2").condition.includes("Alternativa"));

// Cervical arthroplasty and endoscopic disc herniation remain separately mapped.
const arthroplasty = getSpineCodingSuggestions({
  subtype: "Artroplastia", region: "Cervical", approach: "Anterior",
  diagnosis: "Doença discal cervical"
});
assert.equal(arthroplasty?.scenarioId, "cervical-disc-arthroplasty");

const endoscopic = getSpineCodingSuggestions({
  subtype: "Cirurgia endoscópica", region: "Lombar", approach: "Endoscópica",
  diagnosis: "Hérnia discal extrusa"
});
assert.equal(endoscopic?.scenarioId, "endoscopic-disc-herniation");

const earlyOnset = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Escoliose de início precoce com sistema de crescimento"
});
assert.equal(earlyOnset?.scenarioId, "deformity-early-onset-growth");

const growthLengthening = getSpineCodingSuggestions({
  subtype: "Outro", region: "Torácica", approach: "Posterior",
  diagnosis: "Alongamento de haste de crescimento"
});
assert.equal(growthLengthening?.scenarioId, "deformity-growth-rod-lengthening");

const adolescentScoliosis = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Escoliose idiopática do adolescente"
});
assert.equal(adolescentScoliosis?.scenarioId, "deformity-adolescent-posterior-fusion");

const kyphosis = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Cifose patológica com deformidade"
});
assert.equal(kyphosis?.scenarioId, "deformity-pathologic-kyphosis");

const hemivertebra = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Torácica", approach: "Posterior",
  diagnosis: "Escoliose congênita com hemivértebra"
});
assert.equal(hemivertebra?.scenarioId, "deformity-congenital-hemivertebra");

const cervicalDeformity = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Cervical", approach: "Anterior e posterior",
  diagnosis: "Deformidade cervical do adulto"
});
assert.equal(cervicalDeformity?.scenarioId, "deformity-cervical-adult");

const craniovertebralDecompression = getSpineCodingSuggestions({
  subtype: "Descompressão", region: "Cervical", approach: "Posterior",
  diagnosis: "Malformação craniovertebral tipo Chiari"
});
assert.equal(craniovertebralDecompression?.scenarioId, "deformity-craniovertebral-decompression");

const craniovertebralFusion = getSpineCodingSuggestions({
  subtype: "Artrodese", region: "Cervical", approach: "Posterior",
  diagnosis: "Malformação craniovertebral Chiari com fixação occipitocervical"
});
assert.equal(craniovertebralFusion?.scenarioId, "deformity-craniovertebral-fusion");

console.log("Spine coding rules: semantic regression tests passed.");
