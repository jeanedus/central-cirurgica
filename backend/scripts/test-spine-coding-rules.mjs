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
