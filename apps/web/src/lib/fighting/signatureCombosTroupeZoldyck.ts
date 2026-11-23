import type { SignatureCombo } from './signatureCombos'

/**
 * Signature combos of Illumi, Kalluto, Bonolenov and Shizuku (SIGNATURE_COMBOS.md).
 * Each relies strictly on canonical conditions: skull-needle implantation for Illumi,
 * an embedded paper fragment for Kalluto, uninterrupted dances for Bonolenov, and
 * open uncovered wounds for Shizuku's blood suction.
 */
export const TROUPE_ZOLDYCK_SIGNATURES: readonly SignatureCombo[] = [
  {
    id: 'illumi:implanted-order',
    fighter: 'illumi',
    opponent: 'hisoka',
    title: ['Consigne implantée', 'Implanted Order'],
    requirement: [
      'Aiguille basse, Pas sans présence, Paume Zoldyck, accélération avant, Cortège funèbre, Implantation crânienne « Reste », accélération arrière, Ordre · Approche, Aiguille de recul, Cortège funèbre. La perte d’autonomie vient uniquement de l’aiguille spéciale placée dans le crâne.',
      'Low Needle, Presenceless Step, Zoldyck Palm, forward accélération, Funeral Procession, Skull Implantation "Stay", back accélération, Order · Approach, Recoil Needle, Funeral Procession. Autonomy loss comes solely from the special needle placed in the skull.',
    ],
    steps: [
      { move: 'lowLight' },
      { move: 'forwardLight' },
      { move: 'standingHeavy' },
      { dash: 'forward' },
      { move: 'throw' },
      { move: 'neutralSpecial' },
      { dash: 'back' },
      { move: 'forwardSpecial', hit: false },
      { move: 'backHeavy' },
      { move: 'throw' },
    ],
  },
  {
    id: 'kalluto:paper-serpent',
    fighter: 'kalluto',
    opponent: 'feitan',
    title: ['Serpent de papier', 'Paper Serpent'],
    requirement: [
      'Préparation : Planter le papier sur le torse. Combo : Confettis rasants, Éventail tranchant, Revers de papier, Éventail lunaire, Fauchage de l’éventail, accélération arrière, Danse de la morsure, Morsure du serpent. Le rassemblement final exige qu’un fragment soit réellement planté.',
      'Setup: Plant Paper on the torso. Combo: Low Confetti, Cutting Fan, Paper Backfist, Lunar Fan, Fan Sweep, back accélération, Serpent Bite Dance, Serpent Bite. The final convergence requires a real embedded paper fragment.',
    ],
    preparation: [{ move: 'neutralSpecial' }],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'forwardLight' },
      { move: 'lowHeavy' },
      { dash: 'back' },
      { move: 'forwardSpecial', hits: 3 },
      { move: 'finisher', hits: 3 },
    ],
  },
  {
    id: 'bonolenov:celestial-cantabile',
    fighter: 'bonolenov',
    opponent: 'phinks',
    title: ['Cantabile céleste', 'Celestial Cantabile'],
    requirement: [
      'Préparation : Prologue · Danse ininterrompue. Combo : Battement bas, Poing rythmé, Coude tribal, Ronde guerrière, accélération avant, Prologue · Lance, Pas spiralé, recul dans la portée du son, Jupiter. La danse et la musique doivent rester ininterrompues avant chaque matérialisation.',
      'Setup: uninterrupted Prologue · Dance. Combo: Low Beat, Rhythm Fist, Tribal Elbow, War Sweep, forward accélération, Prologue · Spear, Spiral Step, retreat within earshot, Jupiter. Dance and music must remain uninterrupted before every conjuration.',
    ],
    preparation: [{ dance: 'prologue' }],
    steps: [
      { move: 'lowLight' },
      { move: 'standingLight' },
      { move: 'standingHeavy' },
      { move: 'lowHeavy' },
      { dash: 'forward' },
      { move: 'forwardSpecial' },
      { move: 'forwardHeavy' },
      { dash: 'back' },
      { dance: 'jupiter' },
    ],
  },
  {
    id: 'shizuku:clinical-cleanup',
    fighter: 'shizuku',
    opponent: 'franklin',
    title: ['Nettoyage clinique', 'Clinical Cleanup'],
    requirement: [
      'Coup de Blinky, Tuyau rasant, Marteau aspirant, accélération avant, Frappe de Blinky (qui ouvre une plaie), Hémorragie aspirée, Balayage ménager, recul face à la cible, Aspiration du sang. Blinky aspire seulement le sang sorti par des plaies ouvertes non bouchées, jamais une personne ni son aura.',
      'Blinky Jab, Low Nozzle, Vacuum Hammer, forward accélération, Blinky Strike (opening a wound), Vacuumed Hemorrhage, Cleaning Sweep, retreat facing the target, Blood Suction. Blinky only sucks blood exiting uncovered open wounds, never a person or aura.',
    ],
    steps: [
      { move: 'standingLight' },
      { move: 'lowLight' },
      { move: 'standingHeavy' },
      { dash: 'forward' },
      { move: 'forwardSpecial' },
      { move: 'throw' },
      { move: 'lowHeavy' },
      { dash: 'back' },
      { move: 'finisher', hit: false },
    ],
  },
]
