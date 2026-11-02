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
assert.equal(infection?.scenarioId, "posterior-spinal-infection");

// Tumor, deformity and infection diagnoses must not be suggested as generic
// degenerative posterior fusion when no dedicated scenario is available.
for (const diagnosis of ["Tumor vertebral T11", "Escoliose degenerativa", "Osteomielite vertebral"]) {
  const result = getSpineCodingSuggestions({ ...base, diagnosis });
  assert.notEqual(result?.scenarioId, "degenerative-posterior-fusion");
}

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

console.log("Spine coding rules: semantic regression tests passed.");
