import type { FighterId } from '../types'

type Lines = readonly [string, string, string, string]
/** Original Clash writing: introduction FR/EN, victory FR/EN. No manga quotations. */
export const DIALOGUES: Partial<Record<FighterId, Lines>> = {
  kurapika: [
    'Je choisis ce que j’engage.',
    'I choose what I commit.',
    'Je peux maintenant baisser la garde.',
    'I can lower my guard now.',
  ],
  hisoka: [
    'Voyons comment tu réponds.',
    'Let’s see how you respond.',
    'Voilà une réponse intéressante.',
    'That was an interesting answer.',
  ],
  chrollo: [
    'Chaque choix laisse une ouverture.',
    'Every choice leaves an opening.',
    'Cette rencontre trouve sa conclusion.',
    'This encounter has reached its conclusion.',
  ],
  benjamin: [
    'Tiens ta position.',
    'Hold your position.',
    'La position est tenue.',
    'The position is secure.',
  ],
  tserriednich: [
    'Je veux voir ton prochain choix.',
    'I want to see your next choice.',
    'Je retiendrai cette séquence.',
    'I will remember this sequence.',
  ],
  feitan: [
    'Ne perds pas de temps.',
    'Do not waste time.',
    'Cela suffit pour aujourd’hui.',
    'That is enough for today.',
  ],
  saiyu: [
    'Voyons si tu tiens le rythme.',
    'Let’s see if you keep pace.',
    'Le rythme a fini par changer.',
    'The rhythm finally changed.',
  ],
  theta: [
    'Je vais observer chaque mouvement.',
    'I will watch every movement.',
    'Je reste attentive à la suite.',
    'I remain alert for what comes next.',
  ],
  biscuit: [
    'Commence par une bonne posture.',
    'Start with a good stance.',
    'Reprends depuis tes appuis.',
    'Start again from your footing.',
  ],
  phinks: [
    'Approche et on commence.',
    'Come closer and we begin.',
    'On en reste là.',
    'We leave it there.',
  ],
  franklin: [
    'Je vais tenir ma distance.',
    'I will hold my distance.',
    'Je n’ai plus besoin d’avancer.',
    'I do not need to advance further.',
  ],
  machi: [
    'Je ne te quitterai pas des yeux.',
    'I will keep my eyes on you.',
    'Le dernier mouvement a compté.',
    'The last movement mattered.',
  ],
  illumi: [
    'Je préfère un travail précis.',
    'I prefer precise work.',
    'Le travail est terminé.',
    'The work is finished.',
  ],
  kalluto: [
    'Je trouverai ma place.',
    'I will find my place.',
    'J’ai tenu ma place.',
    'I held my place.',
  ],
  bonolenov: [
    'Écoute avant de bouger.',
    'Listen before you move.',
    'Le silence peut revenir.',
    'Silence may return.',
  ],
  shizuku: ['On peut commencer ?', 'Can we begin?', 'C’est terminé, alors.', 'It is over, then.'],
  hinrigh: [
    'Regarde bien le terrain.',
    'Look closely at the ground.',
    'Je reprends ma route.',
    'I will be on my way.',
  ],
  mizaistom: [
    'Garde tes distances.',
    'Keep your distance.',
    'Nous pouvons nous arrêter ici.',
    'We can stop here.',
  ],
  leorio: [
    'Je suis prêt à tenir bon.',
    'I am ready to stand my ground.',
    'Je suis encore debout.',
    'I am still standing.',
  ],
  hanzo: [
    'Je reste attentif jusqu’au bout.',
    'I stay alert to the end.',
    'Je peux enfin relâcher mon attention.',
    'I can finally relax my attention.',
  ],
  rihan: [
    'Je prendrai le temps d’observer.',
    'I will take time to observe.',
    'Je retiens ce que j’ai observé.',
    'I will retain what I observed.',
  ],
  zakuro: [
    'Je vais garder mon sang-froid.',
    'I will keep my composure.',
    'Je garde les idées claires.',
    'I am keeping a clear head.',
  ],
  melody: [
    'Prenons le temps de respirer.',
    'Let us take a breath.',
    'Un peu de calme, maintenant.',
    'Some quiet, now.',
  ],
  basho: [
    'Chaque instant mérite son mot.',
    'Every moment deserves its word.',
    'Je garderai une ligne de ce duel.',
    'I will keep a line from this duel.',
  ],
  camilla: [
    'Le verdict n’est pas encore tombé.',
    'The verdict is still ahead.',
    'Le verdict m’est favorable.',
    'The verdict is in my favour.',
  ],
  halkenburg: [
    'Je ne reculerai pas par hésitation.',
    'I will not step back out of doubt.',
    'Je dois assumer ce résultat.',
    'I must take responsibility for this result.',
  ],
  gel: [
    'Je vais rester à bonne distance.',
    'I will stay at the right distance.',
    'La distance a fait la différence.',
    'Distance made the difference.',
  ],
  lynch: [
    'J’ai une question pour toi.',
    'I have a question for you.',
    'Cette rencontre me suffit.',
    'This encounter is enough for me.',
  ],
  luini: [
    'Je cherche une ouverture.',
    'I am looking for an opening.',
    'La voie est libre.',
    'The way is clear.',
  ],
  bill: [
    'On avance un pas à la fois.',
    'We move one step at a time.',
    'Un pas de plus est accompli.',
    'One more step is done.',
  ],
  furykov: [
    'Ta posture en dit déjà assez.',
    'Your stance already says enough.',
    'Je n’oublierai pas cette posture.',
    'I will not forget that stance.',
  ],
  cluck: [
    'Je garde les yeux ouverts.',
    'I am keeping my eyes open.',
    'Je peux regarder plus loin.',
    'I can look further ahead.',
  ],
  beyond: [
    'Allons jusqu’au bout.',
    'Let us see this through.',
    'La route continue.',
    'The road continues.',
  ],
  longhi: [
    'Je mesure chaque engagement.',
    'I weigh every commitment.',
    'Je tiendrai mes engagements.',
    'I will keep my commitments.',
  ],
  musse: [
    'Je surveille les angles.',
    'I am watching the angles.',
    'Les angles sont dégagés.',
    'The angles are clear.',
  ],
  padaille: [
    'Je ne céderai pas le passage.',
    'I will not yield the way.',
    'Le passage reste de mon côté.',
    'The way stays on my side.',
  ],
  sayird: [
    'Je prends le temps de vérifier.',
    'I take time to check.',
    'Je peux clore cette vérification.',
    'I can close this check.',
  ],
  terebellum: [
    'Je tiendrai jusqu’au verdict.',
    'I will hold until the verdict.',
    'Je suis allé jusqu’au bout.',
    'I saw it through.',
  ],
  voconte: [
    'Je prépare mon prochain déplacement.',
    'I am preparing my next move.',
    'Je peux passer à la suite.',
    'I can move on.',
  ],
  yokotani: [
    'Respectons le cadre de la rencontre.',
    'Let us respect the terms of the encounter.',
    'La rencontre est close.',
    'The encounter is closed.',
  ],
}
export function characterLine(id: FighterId, language: 'fr' | 'en', victory = false): string {
  const lines = DIALOGUES[id] ?? [
    'À toi de jouer.',
    'Your move.',
    'La rencontre est terminée.',
    'The encounter is over.',
  ]
  return lines[(victory ? 2 : 0) + (language === 'en' ? 1 : 0)]
}
