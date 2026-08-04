#!/usr/bin/env node
// Cliquet ADR-002, appliqué par le harness plutôt que par la lecture de CLAUDE.md :
// ce hook s'exécute pour *tout* agent (principal, Explore, Plan, general-purpose,
// agents cloud), qu'il ait lu les instructions du dépôt ou non.
//
// Il ne remplace pas ESLint — il agit avant l'écriture, là où ESLint n'agirait
// qu'après. Refus : faire grossir un fichier applicatif déjà à la borne.

import { readFileSync, existsSync } from 'node:fs'
import { relative, isAbsolute } from 'node:path'

const MAX_LINES = 500
const WARN_LINES = 420
const ROOT = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()

// Le code applicatif, et lui seul.
const IN_SCOPE = /^(apps\/[^/]+\/src\/|packages\/[^/]+\/src\/).*\.(ts|js|svelte)$/

// Déclaratif, pas logique : long pour une raison inoffensive (voir eslint.config.js).
const EXEMPT = [
  /^apps\/[^/]+\/src\/lib\/i18n\/messages\//,
  /^apps\/[^/]+\/src\/lib\/assets\/maps\//,
  /\.(test|spec)\.ts$/,
  /\.gen\.ts$/,
]

const RULES = [
  '≤ 500 lignes brutes par fichier',
  '≤ 3 paramètres par fonction (au-delà : un objet `options` typé, ou une classe)',
  'complexité cyclomatique ≤ 10 par fonction',
]

const HOW = [
  'Ce dont ta tâche a besoin (type, helper, constante, sous-composant, branche de',
  'logique) part dans un **fichier neuf** que ce fichier importe — rien de neuf ne',
  "s'ajoute dans le corps d'un fichier hors-borne. Profites-en pour en sortir ce qui",
  'est adjacent à ton travail : quelques dizaines de lignes suffisent, le but est de',
  "le laisser plus court, pas de le rendre conforme d'un coup. L'extraction ne change",
  'aucun comportement ; un module TS découpé garde son chemin et ré-exporte ses',
  'symboles (façade), un .svelte extrait des composants enfants et des `.svelte.ts`.',
].join(' ')

function emit(payload) {
  process.stdout.write(JSON.stringify(payload))
  process.exit(0)
}

function pass() {
  process.exit(0)
}

function deny(reason) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  })
}

function remind(context) {
  emit({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: context,
    },
    suppressOutput: true,
  })
}

function countLines(text) {
  return text.length === 0 ? 0 : text.split('\n').length
}

let input
try {
  input = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  pass()
}

const tool = input.tool_name
const target = input.tool_input?.file_path
if (!target || (tool !== 'Write' && tool !== 'Edit')) pass()

const rel = isAbsolute(target) ? relative(ROOT, target) : target
if (!IN_SCOPE.test(rel) || EXEMPT.some((re) => re.test(rel))) pass()

const exists = existsSync(target)
const current = exists ? countLines(readFileSync(target, 'utf8')) : 0

if (tool === 'Write') {
  const after = countLines(input.tool_input.content ?? '')
  if (after > MAX_LINES) {
    deny(
      `ADR-002 — ${rel} ferait ${after} lignes, la borne est ${MAX_LINES} (lignes brutes, ` +
        `blancs et commentaires inclus). ${HOW} Découpe avant d'écrire.`,
    )
  }
  if (after > WARN_LINES) {
    remind(
      `Rappel ADR-002 : ${rel} fait ${after} lignes, la borne est ${MAX_LINES}. ` +
        `Le prochain ajout devra partir dans un fichier voisin.`,
    )
  }
  pass()
}

// Edit : le delta est ce qui compte. Raccourcir un fichier hors-borne est le
// comportement recherché, on ne le gêne pas.
const before = countLines(input.tool_input.old_string ?? '')
const after = countLines(input.tool_input.new_string ?? '')
const delta = after - before
const projected = current + delta

if (delta > 0 && projected > MAX_LINES) {
  deny(
    `ADR-002 — ${rel} est à ${current} lignes (borne ${MAX_LINES}) et cet edit en ajoute ` +
      `${delta}. Un fichier hors-borne ne grossit pas. ${HOW} ` +
      `Si le fichier repasse sous ${MAX_LINES}, retire son entrée du cliquet dans eslint.config.js.`,
  )
}

if (projected > WARN_LINES && projected <= MAX_LINES && delta > 0) {
  remind(
    `Rappel ADR-002 : ${rel} atteindra ${projected} lignes, la borne est ${MAX_LINES}. ` +
      `Les trois bornes du dépôt : ${RULES.join(' ; ')}.`,
  )
}

pass()
