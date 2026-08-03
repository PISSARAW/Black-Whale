/**
 * What a body aboard is wearing, read off the role the catalogue gives it.
 *
 * A closed table of the exact strings `data/` uses, and not a set of keyword
 * rules. Two reasons, and the second is the important one.
 *
 * The first is that the roles are prose in two languages, written over years —
 * "Private Guard of Prince Camilla ; Provisional Hunter" beside "garde /
 * transport". Any rule that reads them is a rule that will one day read a new
 * one wrong and dress a queen as a marine, silently.
 *
 * The second is that a costume is a *claim*: it says the archive knows what
 * this person is doing on this ship. A default — "anything unrecognised is a
 * civilian" — is that claim made without evidence, over and over, and it is the
 * mechanism by which two hundred invented passengers would eventually walk back
 * into a reconstruction that has refused them from the start. So there is no
 * default. `wardrobeFor` answers `null`, `wardrobe.test.ts` asserts that
 * `data/` contains no role it answers `null` for, and a role added to the
 * catalogue without a costume is a failing test rather than a stranger in the
 * corridor.
 *
 * The looks themselves are `humanProfiles.ts`'s nine, unchanged: this decides
 * which of them a person is drawn from, never how one is drawn.
 */
import type { Costume } from './types'

/**
 * Every role in the catalogue, by the costume it is drawn in.
 *
 * Grouped by costume rather than listed role by role, because the grouping is
 * the argument: what these strings have in common is the answer, and reading
 * them together is what makes a misfiled one visible.
 */
const BY_COSTUME: ReadonlyArray<readonly [Costume, readonly string[]]> = [
  // ── Posted guards ────────────────────────────
  // The largest group aboard by far, and the shape of the huis clos: a detail
  // in front of every prince's door. A spy for another queen is still a
  // bodyguard standing a watch — that is precisely what made the informants
  // invisible — so they are dressed as one.
  [
    { role: 'guard' },
    [
      'guard',
      'Guard',
      'ancien garde',
      'garde / transport',
      'kakin royal army',
      'officier tactique',
      'post-mortem guard/spy',
      'soldat / recherche de Borksen',
      'soldat / transfere',
      'soldat privé de Benjamin / garde du camp Zhang Lei',
      'soldat privé de Benjamin / surveillant du camp Woble',
      'suspected bodyguard/spy',
      'capitaine des gardes de Marayam',
      'capitaine des gardes de Tubeppa',
      'Captain and Coordinator of the Royal Bodyguards affiliated with Queen Duazul',
      "Captain of Queen Duazul's Royal Guard",
      "Captain of Queen Swinko-swinko's Royal Guard",
      'Captain of the Guards for Prince Halkenburg',
      'Bodyguard for Prince Halkenburg',
      'Bodyguard for Prince Tubeppa ; Provisional Hunter',
      'Personal Soldier for Prince Halkenburg',
      'Private Guard of Prince Camilla',
      'Private Guard of Prince Camilla ; Provisional Hunter',
      'Private Military Commander for Prince Tserriednich',
      'Private Soldier for Duazul Hui Guo Rou assigned to Prince Luzurus Hui Guo Rou',
      'Private Soldier for Prince Benjamin Hui Guo Rou',
      'Private Soldier for Prince Benjamin Hui Guo Rou ; Royal Bodyguard for Prince Halkenburg',
      'Private Soldier for Prince Benjamin Hui Guo Rou ; Royal Bodyguard for Prince Halkenburg Hui Guo Rou',
      'Private Soldier for Prince Benjamin Hui Guo Rou ; Royal Bodyguard for Prince Marayam Hui Guo Rou',
      'Private Soldier for Prince Benjamin Hui Guo Rou ; Royal Bodyguard for Prince Tyson Hui Guo Rou',
      'Private Soldier for Prince Benjamin Hui Guo Rou ; Royal Bodyguard for Prince Woble Hui Guo Rou',
      'Private Soldier for Prince Halkenburg Hui Guo Rou',
      'Private Soldier for Prince Tserriednich Hui Guo Rou ; Provisional Hunter',
      'Private Soldier for Prince Tserriednich Hui Guo Rou ; Provisional Hunter ; 289th Hunter Exam Examinee',
      'Private Soldier for Queen Duazul assigned to Prince Luzurus',
      'Royal Bodyguard for Prince Fugetsu Hui Guo Rou',
      'Royal Bodyguard for Prince Luzurus',
      'Royal Bodyguard for Prince Marayam Hui Guo Rou',
      'Royal Bodyguard for Prince Momoze Hui Guo Rou ; Spy for Queen Duazul Hui Guo Rou',
      'Royal Bodyguard for Prince Momoze Hui Guo Rou ; Spy for Queen Seiko Hui Guo Rou',
      'Royal Bodyguard for Prince Momoze Hui Guo Rou ; Spy for Queen Tang Zhao Li Hui Guo Rou',
      'Royal Bodyguard for Prince Tubeppa',
      'Royal Bodyguard for Prince Tubeppa Hui Guo Rou',
      'Royal Bodyguard for Prince Tyson',
      'Royal Bodyguard for Prince Woble Hui Guo Rou',
      'Royal Bodyguard for Prince Zhang Lei',
      'Royal Bodyguard for Prince Zhang Lei Hui Guo Rou ; Spy for Queen Duazul Hui Guo Rou',
      'Spy for Katrono Hui Guo Rou',
      'Spy for Queen Swinko-swinko ; Royal Bodyguard for Prince Momoze',
      'Spy for Queen Tang Zhao Li Hui Guo Rou',
      'Spy for Queen Unma Hui Guo Rou ; Royal Bodyguard for Prince Benjamin Hui Guo Rou',
      'Spy for Queen Unma Hui Guo Rou (Former) ; Royal Bodyguard for Prince Benjamin Hui Guo Rou',
    ],
  ],

  // ── Guards whose post is the Nen itself ──────
  // The role names the aura, so the look does too. Whether they actually carry
  // one is decided elsewhere and by the data alone — see `nen.ts`: a costume
  // has never been evidence of anything.
  [
    { role: 'nen-guard' },
    [
      'Nen teacher/protector',
      'garde / instructeur de Nen',
      'personal guard/instructor of recovering Nen',
      'soldat privé de Benjamin / analyste Nen',
    ],
  ],

  // ── Hunters ──────────────────────────────────
  // The ones the catalogue names as Hunters first and as somebody's guard
  // second. Where the order is the other way round the post wins, because the
  // post is what they are doing in the corridor you are standing in.
  [
    { role: 'hunter' },
    [
      'Hunter',
      'Hunter ; Bodyguard for Prince Kacho',
      'Hunter ; Royal Bodyguard for Prince Luzurus',
      'Hunter ; Royal Bodyguard for Prince Tyson',
      'Hunter / garde royal',
      'Virus Hunter (Single-Star) ; Doctor',
      'garde / Hunter',
      'guard / protective',
      'guard/ninja',
      'prince tyson',
      'soutien / musique Nen',
      'zodiaque',
      'zodiaque / garde de Beyond',
      'zodiaque / taupe potentiel, garde de Beyond',
    ],
  ],

  // ── Fighters ─────────────────────────────────
  [
    { role: 'fighter' },
    [
      'Brigade target/lone fighter',
      'Heil-Ly',
      'Phantom Troupe',
      'assassin / infiltrateur',
      'assassin / membre de la Brigade',
      'assassin / under surveillance of the Zodiacs',
      'chef operations / allie Brigade',
      'combattant / chasse d’Hisoka',
      "combattante / chasse d'Hisoka",
      'leader secret',
      "tireur / attente d'Hisoka",
      "voleuse / recherche d'Hisoka",
    ],
  ],
  // The prince who commands the army wears the army's clothes, not a fighter's.
  [{ role: 'fighter', dress: 'uniform' }, ['chef militaire / loi martiale']],
  // The families aboard: mafiosi work in suits, and the ship is where they work.
  [
    { role: 'fighter', dress: 'suit' },
    [
      'Consigliere of the Cha-R Family',
      'Mafioso',
      'Mafioso ; Arcade Employee',
      'Mafioso ; Back-Alley Doctor ; Hitman',
      'Mafioso ; Civil Engineer',
      'Mafioso ; Cleaner ; Feed Manufacturer',
      'Mafioso ; Construction Worker',
      'Mafioso ; Demolition Worker',
      'Mafioso ; Hacker',
      'Mafioso ; Insurance Scammer',
      "Mafioso ; Investigator's Assistant",
      'Mafioso ; Mercenary Transporter',
      'Mafioso ; Plumber',
      'Mafioso ; Pro Gamer',
      'Mafioso ; Professional Wrestler',
      'Mafioso ; Repairman',
      'Mafioso ; Seamstress ; Arts and Crafts',
      'Mafioso ; Temp Staffing/Mediator',
      'Mafioso ; Transporter ; Hitman',
      'Mafioso ; Unscrupulous Lawyer ; Legal Advisor for the Heil-Ly Family',
      'Mafioso ; Waste Disposal Contractor',
      'Mafioso Lieutenant',
      'Mafioso Supervisor',
      "Vice Boss of the Cha-R Family ; Military Advisor for the Seventh Prince's Army",
      'boss of Cha-R / godfather of Luzurus',
      'boss of Xi-Yu / advisor to Zhang Lei',
      'parrain mafia / alliance',
    ],
  ],

  // ── The staff ────────────────────────────────
  // Servants, doctors, judges, announcers and the ministry: everyone whose work
  // aboard is done in a suit rather than in a uniform.
  [
    { role: 'steward' },
    [
      'Announcer Personality for the Dark Continent Voyage',
      'Grand Chamberlain for King Nasubi',
      'IPA ; detache au Justice Bureau',
      'IPA Deputy Secretary ; guide de Beyond',
      'Majordomo of Prince Camilla',
      'Ministry of Justice',
      'Personal Butler for King Nasubi',
      "Prince Fugetsu's Maid",
      "Prince Fugetsu's Servant",
      "Prince Kacho's Maid",
      "Prince Kacho's Servant",
      "Prince Marayam's Servant",
      'Researcher ; Servant for Prince Tubeppa',
      'Researcher ; Servant for Prince Tubeppa Hui Guo Rou',
      'Servant for Prince Tubeppa',
      'Undertaker',
      'annonceur',
      'coordination scientifique',
      'enqueteur / superviser',
      'juge',
      'justice bureau',
      'medecin / etudiant',
      'medecin en chef',
      'servant of Queen Oito',
    ],
  ],

  // ── The royal family ─────────────────────────
  // Gowns for the queens and for the princesses, a suit for the king and for
  // the princes who hold a court rather than a command. The catalogue files all
  // seven queens under one role, which is why one line covers them.
  [
    { role: 'witness', dress: 'gown' },
    [
      'kakin royal family',
      'alliee / espionne',
      'prisonniere',
      'princesse sous protection judiciaire',
      'protection post-mortem de Fugetsu',
    ],
  ],
  [
    { role: 'steward', dress: 'suit' },
    [
      'organisateur',
      'prince / Nen training',
      'recherche / laboratoire',
      'strategie / renseignement',
    ],
  ],
  // The prince whose whole position is what he preaches.
  [{ role: 'witness', dress: 'ritual' }, ['preaching/influence by Nen']],
  [
    { role: 'witness' },
    [
      "consciousness in Balsamilco's body",
      'faux Woble sous protection',
      'passager civil',
      'protection dimensionnelle',
      'véritable Woble — emplacement jamais confirmé',
    ],
  ],
  [{ role: 'victim' }, ['victime de Stand by Me', 'victime de Tuffdy']],

  // ── The two the walk already draws ───────────
  // Morena and the Silent Majority user have looks of their own in
  // `humanProfiles.ts`, because the walk already puts both on screen. The
  // distribution reuses them rather than inventing a second Morena.
  [{ role: 'morena' }, ['chef Heil-Ly / game master']],
  [{ role: 'silent-majority' }, ['undercover assassin / identity unknown']],
]

const WARDROBE = new Map<string, Costume>(
  BY_COSTUME.flatMap(([costume, roles]) => roles.map((role) => [role, costume] as const)),
)

/**
 * What to dress this role in, or `null` if the archive has never said.
 *
 * `null` is a refusal, not a fallback: the caller draws nobody. See the head of
 * this file for why that is the only safe answer.
 */
export function wardrobeFor(role: string | null | undefined): Costume | null {
  return WARDROBE.get(String(role ?? '').trim()) ?? null
}

/** Every role the wardrobe knows, for the exhaustiveness test. */
export function dressedRoles(): string[] {
  return [...WARDROBE.keys()]
}
