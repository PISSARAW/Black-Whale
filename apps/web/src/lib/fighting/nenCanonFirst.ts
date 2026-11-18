import type { NenCanonProfiles } from './nenCanonTypes'

export const NEN_CANON_FIRST: NenCanonProfiles = {
  kurapika: {
    abilities: [
      'chain-jail',
      'dowsing-chain',
      'holy-chain',
      'steal-chain',
      'judgment-chain',
      'stealth-dolphin',
      'emperor-time',
    ],
    condition:
      'Each finger has its own chain. Chain Jail binds active Spiders only; Judgment implantation, Dolphin and video Dowsing require Emperor Time. Video screening also requires a previously met subject and real recorded media.',
    effect:
      'Restraint, directed chain, healing, aura drain and a single stolen use remain distinct.',
    prohibition:
      'No free aura or mastery from Emperor Time; no copied equipment or exemption from the fatal vow.',
    adaptation:
      'Damage, healing, drain and range tune the duel; the announced Judgment clause is to remain in Zetsu. Lifespan is counted in simulated frames.',
  },
  hisoka: {
    abilities: ['bungee-gum', 'texture-surprise'],
    condition:
      'Pulls and recoil need Hisoka’s attached, stretched elastic line; a disguise needs an existing surface.',
    effect: 'Sticky elastic aura changes spacing; Texture Surprise changes surface appearance.',
    prohibition: 'No teleportation, healing, invulnerability or physical change from a texture.',
    adaptation:
      'One fighter-to-fighter tether, cloth preparation, reach and composed card finish tune the duel.',
  },
  chrollo: {
    abilities: [
      'skill-hunter',
      'double-face',
      'sun-and-moon',
      'black-voice',
      'indoor-fish',
      'fun-fun-cloth',
      'chrollo-teleportation',
      'order-stamp',
      'convert-hands',
      'gallery-fake',
      'love-dial-6700',
      'lovely-ghostwriter',
    ],
    condition:
      'Acquisition needs witnessing, answered questions, a palm on the cover and completion within one hour. Active pages require the right-hand book or the unique bookmark; copied powers retain their own conditions.',
    effect:
      'Historical pages execute their separate effects. Gallery Fake copies remain inert, can be located from the original and sense contacts within their volume; Sun and Moon marks persist.',
    prohibition: 'No body, weapon, animal, ally, consent or learned model is acquired with a page.',
    adaptation:
      'Retrospective pages combine demonstrated eras. Timings, dimensions and stocks are duel tuning. Lovely Ghostwriter requires genuine handwritten identity, a visible subject or portrait, real writing material and a defined scenario month; never the caster’s own future. Further material interactions remain under audit.',
  },
  benjamin: {
    abilities: ['benjamin-baton', 'air-blow', 'secret-window', 'culdcept'],
    condition:
      'The inherited soldier must be dead, loyal, an academy graduate and a member of Benjamin’s private army.',
    effect: 'Air Blow, contact surveillance and a held Culdcept card have separate functions.',
    prohibition:
      'No generic inheritance damage stacks, surveillance paralysis or capture of ordinary bullets and Halkenburg’s arrow.',
    adaptation:
      'Three inheritances predate the duel. Air Blow and projectile capture adapt incomplete canonical mechanics; the firearm is physical.',
    physicalSlots: ['backSpecial'],
  },
  tserriednich: {
    abilities: ['parallel-future'],
    condition:
      'Close the eyes in voluntary Zetsu, complete vulnerable preparation, observe ten seconds, then reopen to diverge.',
    effect: 'The real body diverges while the opponent perceives the predicted sequence.',
    prohibition:
      'No automatic evasion, damage or verdict imported from a forecast; no guardian ability under manual control.',
    adaptation:
      'Preparation and suspended viewing tune the duel. Future human decisions cannot be known; current inputs are projected and replayed.',
  },
  feitan: {
    abilities: ['pain-packer', 'rising-sun'],
    condition: 'Actual injuries charge Pain Packer; the outfit precedes release of Rising Sun.',
    effect: 'Pain strengthens a persistent heat zone; the outfit protects against that heat.',
    prohibition:
      'No healing, physical super armour, global damage boost or heat blocked by ordinary guard.',
    adaptation: 'Injury spending, preparation, aura, radius, heat and scoring tune the duel.',
    physicalSlots: ['forwardSpecial', 'downSpecial', 'backSpecial'],
  },
  saiyu: {
    abilities: ['saiyu-three-monkeys', 'saiyu-priest-staff'],
    condition: 'Each monkey must make its own contact to remove sight, hearing or speech.',
    effect: 'Independent sensory seals; the staff supplies martial reach.',
    prohibition:
      'No automatic Zetsu, additional stun or removal of another sense by repeating the same monkey.',
    adaptation:
      'Contact range, guard response, persistence until the next round and composed staff attacks tune the duel.',
  },
  theta: {
    abilities: [],
    condition: 'Aim a real handgun; ordinary martial and basic Nen rules still apply.',
    effect: 'Physical bullets and martial strikes; the personal Hatsu is unknown.',
    prohibition: 'No aura projectile, forced Zetsu, aura drain or stealable gun Hatsu.',
    adaptation: 'Aiming variants and timings tune the duel without inventing a magazine limit.',
  },
  biscuit: {
    abilities: ['magical-esthetician-cookie'],
    condition:
      'The natural body can be revealed while free to act; Cookie would require a treatment session.',
    effect: 'A bodily form change and martial attacks; Cookie is outside this duel.',
    prohibition:
      'No offensive massage, aura cost or timer on the bodily reveal, and no copying that body through Skill Hunter.',
    adaptation:
      'Strength and resistance multipliers tune the natural body; each new round restores the compact form.',
    physicalSlots: ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'],
  },
  phinks: {
    abilities: ['ripper-cyclotron'],
    condition:
      'Complete clockwise rotations of the right arm, then commit the charged right punch.',
    effect: 'Only complete rotations strengthen that punch.',
    prohibition: 'No global damage bonus, seven-turn cap or asserted canonical four-turn minimum.',
    adaptation:
      'Rotation cadence, aura per turn and spending the punch on a miss, guard or interruption tune the duel.',
  },
  franklin: {
    abilities: ['double-machine-gun'],
    condition: 'Available Nen and emission from the permanently severed fingertips.',
    effect: 'Travelling Nen bullets from both hands; interruption stops subsequent shots.',
    prohibition:
      'No invisible contact damage, universal guard piercing or low-health activation requirement.',
    adaptation: 'Salvo lengths, aiming variants, aura and projectile timings tune the duel.',
  },
  machi: {
    abilities: ['nen-stitches'],
    condition:
      'Suture, tracking and restraint use actual threads. Reattaching a forearm needs its original material, a physical needle, free hands, a consenting living patient and relaxed arm aura.',
    effect:
      'Reconnect the original forearm without restoring lost HP or regrowing flesh; suture a wound, mark a target or maintain a physical tether.',
    prohibition:
      'No generic timed paralysis, remote healing unrelated to suture or free binding without a thread.',
    adaptation:
      'Open-wound HP recovery, contact ranges and operation timing tune the duel. Severed forearms are explicit physical injuries with original material; reconnection does not restore HP.',
  },
  illumi: {
    abilities: ['illumi-needle-people'],
    condition:
      'Physical needles, skull implantation and an explicit order are required for Needle People.',
    effect:
      'Commands overwrite autonomy; bodily consequences remain distinct from maintained Nen. Face alteration includes pinned Gittarackur and the temporary unpinned Hisoka face, with the original eyes and no copied Hatsu.',
    prohibition:
      'No aura drain, automatic two-second recovery, defensive disguise bonus or invented finisher.',
    adaptation:
      'Available needles, reach, orders and persistence use the duel’s two bodies; appearance does not copy abilities.',
  },
  kalluto: {
    abilities: ['dance-of-the-serpents-bite', 'surveillance-paper-dolls'],
    condition:
      'A real paper fragment embeds in the chosen zone; a matching doll relays nearby speech.',
    effect: 'A cutting paper stream follows planted fragments; dolls provide private listening.',
    prohibition: 'No explosive marks, mind reading, aura drain or automatic execution.',
    adaptation: 'Zone selection, projectiles, voice radius, costs and preparation tune the duel.',
  },
  bonolenov: {
    abilities: [
      'battle-cantabile-prologue',
      'battle-cantabile-jupiter',
      'battle-cantabile-metamorphosen',
    ],
    condition:
      'Music from the body holes precedes each piece. Metamorphosen needs a spoken exchange and earned time with its model.',
    effect:
      'Prologue conjures attire and spear; Jupiter pursues in range; Metamorphosen changes appearance.',
    prohibition:
      'No copied body holes, learned model, Nen powers, stat boost, invulnerability or automatic evasion.',
    adaptation:
      'Dance durations, sound radius, conversation distance and fixed collision shape tune the duel.',
  },
  shizuku: {
    abilities: ['blinky'],
    condition:
      'Name an eligible nonliving target; blood extraction needs an actual open wound and an unblocked path.',
    effect: 'Targeted suction, blood extraction and ejection of the last stored matter.',
    prohibition:
      'No suction of Nen constructs or living bodies, automatic execution or damaging utility hitbox.',
    adaptation:
      'Opening wounds, plugging them, suction range, rates and stored objects tune the duel.',
  },
  hinrigh: {
    abilities: ['biohazard-hinrigh'],
    condition:
      'Touch a real object; transformed animals retain the object’s function and finite aura.',
    effect:
      'Handcuff pigeons restrain; a camera cat records for physical retrieval, a snake barrel fires the actual ammunition, and an oyster preserves its swallowed transmitter and radio signal.',
    prohibition:
      'No animal from nothing, copied inventory, self-transformation, generic boost or forced Zetsu.',
    adaptation:
      'Two cuff pairs, device stocks, transformation time, durability and most lifetimes tune the duel. The oyster estimate remains two simulated hours; the knife remains physical.',
  },
  mizaistom: {
    abilities: ['cross-game'],
    condition:
      'Present a yellow warning and spoken order before disobedience can trigger restraint.',
    effect:
      'A warned target’s accepted voluntary action can trigger confinement; speech remains possible.',
    prohibition:
      'No restraint on an ordinary hit, involuntary recoil or invalid input; no red-card power invented.',
    adaptation:
      'One disclosed order, notice interval, range and confinement duration tune the duel.',
  },
  leorio: {
    abilities: ['leorio-remote-punch'],
    condition: 'Strike a connected solid surface before the aura emerges as a distant fist.',
    effect: 'A delayed, surface-transmitted punch with ordinary collision at emergence.',
    prohibition:
      'No airborne aura ball, medical pulse, duplicated emission or new low-health finisher.',
    adaptation: 'Exit position, underground travel, reach, damage and aura tune the duel.',
  },
  hanzo: {
    abilities: ['hanzo-skill-4'],
    condition:
      'Leave the physical body asleep and still; return to it to stop voluntarily. Disturbance wakes it.',
    effect:
      'A controlled double moves through matter while the sleeping body remains a vulnerable target.',
    prohibition:
      'No automatic substitution, protection for the sleeping body or physical ammunition supplied to the double.',
    adaptation: 'Projection startup, movement limits and close-range choke timings tune the duel.',
    physicalSlots: ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'],
  },
}
