import type { NenCanonProfiles } from './nenCanonTypes'

export const NEN_CANON_SECOND: NenCanonProfiles = {
  rihan: {
    abilities: ['rihan-predator'],
    condition:
      'Personally study a perceivable, live manifestation and identify its conditions without outside information.',
    effect:
      'A specialized Predator consumes the studied manifestation; success seals the user’s Nen for forty-eight hours.',
    prohibition:
      'No reading hidden inputs, automatic knowledge, damage buff or suppression by striking the enemy’s body.',
    adaptation:
      'The registered prey list and shortened observation are duel adaptations; the forty-eight-hour price uses simulated time.',
  },
  zakuro: {
    abilities: ['bloody-mary'],
    condition:
      'Supply real blood and maintain its manipulation; copies do not receive Zakuro’s infusion equipment.',
    effect: 'Blood drops and a physical tendril can capture, pull or release a target.',
    prohibition:
      'No blood from nothing, generic paralysis, autonomous damage buff or effect maintained after Nen is lost.',
    adaptation: 'HP expenditure, blood reserve, reach, drops and capture times tune the duel.',
  },
  melody: {
    abilities: ['melody-enchanting-music'],
    condition:
      'Use a real flute with free hands and continuous performance; the listener must hear the sound.',
    effect:
      'Audible Nen music pacifies; exceptional bodily hearing remains separate from the Hatsu.',
    prohibition:
      'No physical guard against sound, invented offensive finisher or hearing/prediction transferred with a stolen page.',
    adaptation:
      'Performance durations, range and reaction aids tune the duel; covering the ears occupies the hands.',
  },
  basho: {
    abilities: ['great-haiku'],
    condition: 'Write a complete three-line poem before invoking its represented effect.',
    effect:
      'The completed poem can produce its supported fire effect; writing remains interruptible.',
    prohibition:
      'No automatic aura burn, immediate writing completion or unrestricted free-form wish engine.',
    adaptation:
      'The supported poem vocabulary, quality assessment, writing duration and fire tune the duel.',
  },
  camilla: {
    abilities: ['cats-name'],
    condition: 'An attributed death caused by a living killer triggers the post-mortem sequence.',
    effect: 'The cat captures and kills the killer, absorbs life, then revives Camilla.',
    prohibition:
      'No manual activation, low-HP threshold, resurrection after a nonlethal verdict or user-controlled guardian ability.',
    adaptation:
      'Sequence timing and two-body targeting tune the duel; her handgun is physical. Post-mortem Nen can act in Zetsu without aura.',
  },
  halkenburg: {
    abilities: ['grimmel-the-dissonance'],
    condition:
      'Actual consenting supporters already bear the feather and share the user’s will; collective charge precedes the shot.',
    effect:
      'A selected supporter sleeps while occupying the struck target’s body; the arrow passes ordinary guard.',
    prohibition:
      'No imaginary cohort, damage arrow, copied supporters or shot without shared will.',
    adaptation:
      'Charge, life expenditure, supporter selection and possession duration tune the duel. The full group armour and soul-exchange simulation are not implemented.',
  },
  gel: {
    abilities: ['snake-arm'],
    condition:
      'Reach the opponent with the actually transformed arm; interruption and guard still apply.',
    effect: 'An arm transformation extends physical striking reach.',
    prohibition:
      'No confirmed venom, poison, shedding, aura drain, invulnerability or automatic restraint.',
    adaptation:
      'Its formal name, category and full conditions remain unknown; directional strikes, costs and reach tune the duel.',
  },
  lynch: {
    abilities: ['body-and-soul'],
    condition:
      'Ask an audible question, then land a real punch on the conscious questioned subject.',
    effect: 'The subject’s soul gives an answer private to the questioner.',
    prohibition:
      'No guarded or projectile answer, thought reading without a question, damage bonus or public private-answer reveal.',
    adaptation:
      'Available questions, consciousness approximation, answer range, aura and timing tune the duel.',
  },
  luini: {
    abilities: ['luini-spatial-teleportation'],
    condition:
      'Anchor from inside a sealed single-door room; destinations must have been visited. Opening its door permanently invalidates the room.',
    effect:
      'Travel from the anchor to a visited destination and return to the anchor from outside.',
    prohibition:
      'No anchor copied with a Hatsu, automatic dodge, damaging teleport or reuse of an invalidated room.',
    adaptation:
      'Rooms and destinations are represented within one arena; range, recovery and aura tune the duel.',
  },
  bill: {
    abilities: ['erigeron'],
    condition:
      'Bring the palms near an actual living support target; plants respond more strongly than untrained Nen users.',
    effect: 'The prepared seed grows; martial attacks remain independent of that support action.',
    prohibition:
      'No self-healing, automatic combat buff, hostile plant attack or offensive finisher.',
    adaptation:
      'The scenario supplies a seed; a completed growth and its aura cost tune the duel. Ordinary duels supply no target.',
  },
  furykov: {
    abilities: ['combo-master'],
    condition:
      'Conjure the console with usable Nen; the alert concerns actual concealed Nen directed at its user.',
    effect: 'Immediate alerts show confirmed affected users; unreadable signatures remain unknown.',
    prohibition:
      'No free identity reveal, automatic evasion, enemy input prediction, combat buff or deciphering/fabrication compressed into a duel.',
    adaptation:
      'Console cost, commitment and Gyo-readable signatures tune the duel; work requiring days remains unavailable.',
    physicalSlots: ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'],
  },
  cluck: {
    abilities: ['bird-manipulation'],
    condition:
      'Control a real bird supplied by the scene; the full canonical activation conditions are unknown.',
    effect: 'A real pigeon delivers a dispatch to the prepared destination.',
    prohibition:
      'No birds created by copying, invented offensive flock or asserted restriction to mail delivery.',
    adaptation:
      'Delivery is the supported scenario application. Costs, path and recovery tune the duel.',
    physicalSlots: ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'],
  },
  beyond: {
    abilities: ['beyond-sacrificial-curse'],
    condition:
      'A prepared marked sacrifice must die to trigger the curse against its designated target.',
    effect:
      'The actual curse is declared but unavailable without that preparation; duel attacks are martial.',
    prohibition:
      'No curse triggered by Beyond’s wounds, low HP, ordinary attack or death; no inherited Isaac Netero ability.',
    adaptation:
      'The physical moveset is a duel interpretation. Steal Chain may retain the curse but cannot provide its missing preparation.',
    physicalSlots: ['neutralSpecial', 'forwardSpecial', 'downSpecial', 'backSpecial'],
  },
  longhi: {
    abilities: ['moonlight-act'],
    condition:
      'Explain fixed terms, duration, reward and penalty; obtain two voluntary signatures.',
    effect:
      'A fulfilled pact grants one use; breach applies the disclosed Zetsu sanction to the signatories.',
    prohibition:
      'No forced consent on contact, paralysis, arbitrary alteration of signed terms or inherited signature after a team relay.',
    adaptation:
      'A five-second no-attacks truce and a sanction carried through the match represent the longer canonical agreement.',
  },
  musse: {
    abilities: ['secret-window'],
    condition: 'Attach the surveillance owl by actual contact; only its user sees the feed.',
    effect: 'The owl reports bodily actions privately; the handgun fires physical bullets.',
    prohibition:
      'No damage, restraint, automatic dodge, aura reading, future vision or public owl.',
    adaptation:
      'One contact owl, observation vocabulary, startup, aura and interruption tune the duel.',
  },
  padaille: {
    abilities: ['padaille-weapon-transformation'],
    condition:
      'Transform the right hand into one of the three represented tools: hammer, drill or axe.',
    effect: 'The selected tool makes its own physical contact; it can be retracted.',
    prohibition:
      'No random tool requirement, additional attested weapons, global boost or invented finisher.',
    adaptation: 'Direct selection, reach, attacks, costs and recovery tune the duel.',
  },
  sayird: {
    abilities: ['little-eye'],
    condition:
      'Control a real small animal, at most hamster-sized; Nen-conjured hosts are excluded.',
    effect:
      'The animal relays local sight and sound and retains control through the user’s unconsciousness.',
    prohibition:
      'No creature from nothing, copied host, offensive swarm or unrestricted omniscient view.',
    adaptation:
      'A scenario supplies the mouse; its path, observation area, cost and recovery tune the duel.',
    physicalSlots: ['forwardSpecial', 'downSpecial', 'backSpecial', 'finisher'],
  },
  terebellum: {
    abilities: ['damage-sweet-home'],
    condition:
      'Real simultaneous hand contacts are checked at injury: left to transfer own damage, right plus left for another person’s damage.',
    effect:
      'Damage moves to the contacted recipient; right-hand absorption without a recipient wounds the left hand.',
    prohibition:
      'No automatic reflection, free dodge, long-range transfer or damage removed without a recipient.',
    adaptation:
      'Short hand boxes, active contact frames, martial carriers and scenario receptacles tune the duel.',
  },
  voconte: {
    abilities: ['voconte-hideout-doors'],
    condition:
      'An active network connects prepared physical thresholds; a body crosses in the triggering direction.',
    effect: 'A real crossing transports the person; stationary or reverse passage does nothing.',
    prohibition:
      'No Luini single-door-room condition, teleport strike, automatic evasion or transport of Nen constructs.',
    adaptation:
      'Two supplied frames, setup, direction, placement and maintenance tune the duel; full installation rules remain unknown.',
  },
  yokotani: {
    abilities: ['lsdf'],
    condition:
      'Morena is present in the Heil-Ly hideout; introduce the guards to an unlawful intruder.',
    effect:
      'Invulnerable guards escort and expel the intruder without injury; Yokotani remains vulnerable.',
    prohibition:
      'No damaging guard, point, knockdown, automatic personal invulnerability or jurisdiction outside the hideout.',
    adaptation:
      'Approach, escalation and escort speed tune the duel; expulsion is a nonlethal verdict.',
  },
}
