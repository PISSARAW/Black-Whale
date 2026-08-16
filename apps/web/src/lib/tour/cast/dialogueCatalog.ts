/**
 * Authored bilingual situation lines, separated from dialogue selection so the
 * catalogue and its small engine remain independently reviewable.
 */

import type { Beat, Voice } from './dialogue'

type Pair = { text: string; textFr: string }

const SPECIAL: Record<
  Exclude<Voice, 'military' | 'hunter' | 'royal' | 'mafia' | 'child' | 'civilian'>,
  Partial<Record<Beat, Pair>> & { watch: Pair }
> = {
  kurapika: {
    death: {
      text: 'Another death means the enemy can still act unseen. I have to protect Woble before I pursue answers.',
      textFr:
        'Un mort de plus signifie que l’ennemi agit toujours sans être vu. Je dois protéger Woble avant de chercher des réponses.',
    },
    nen: {
      text: 'Information about Nen is the only leverage I have. I will share enough to keep this room alive—not enough to lose control.',
      textFr:
        'Les informations sur le Nen sont mon seul levier. J’en donnerai assez pour maintenir cette pièce en vie, pas assez pour perdre le contrôle.',
    },
    'martial-law': {
      text: 'Martial law narrows every exit. I need a route that protects Woble without revealing what our camp knows.',
      textFr:
        'La loi martiale referme toutes les issues. Il me faut une voie qui protège Woble sans révéler ce que notre camp sait.',
    },
    negotiation: {
      text: 'An agreement is useful only if its conditions can be enforced. I am listening for what has been left unsaid.',
      textFr:
        'Un accord n’est utile que si ses conditions peuvent être imposées. J’écoute surtout ce qui n’a pas été dit.',
    },
    watch: {
      text: 'Every quiet minute aboard this ship is borrowed time. I am using it to keep Woble alive.',
      textFr:
        'Chaque minute calme sur ce navire est du temps emprunté. Je l’utilise pour maintenir Woble en vie.',
    },
  },
  oito: {
    death: {
      text: 'I cannot let fear choose for me. Whatever happens outside this room, the child comes first.',
      textFr:
        'Je ne peux pas laisser la peur décider à ma place. Quoi qu’il arrive hors de cette pièce, l’enfant passe avant tout.',
    },
    negotiation: {
      text: 'I do not want the throne. If an alliance gives the child one more day, I will hear its price.',
      textFr:
        'Je ne veux pas du trône. Si une alliance offre un jour de plus à l’enfant, j’en écouterai le prix.',
    },
    watch: {
      text: 'I am watching the door, even when Kurapika tells me to rest. A mother aboard this ship cannot afford not to.',
      textFr:
        'Je surveille la porte, même lorsque Kurapika me demande de me reposer. Une mère sur ce navire ne peut pas faire autrement.',
    },
  },
  benjamin: {
    'martial-law': {
      text: 'Order is not a request. Every corridor will answer to my command before this day is over.',
      textFr:
        'L’ordre n’est pas une requête. Avant la fin de cette journée, chaque coursive répondra à mon commandement.',
    },
    danger: {
      text: 'A threat that shows itself has already made its first mistake. My soldiers will make sure it is the last.',
      textFr:
        'Une menace qui se montre a déjà commis sa première erreur. Mes soldats feront en sorte que ce soit la dernière.',
    },
    succession: {
      text: 'There is one throne and one chain of command. The contest only decides how quickly the others accept that fact.',
      textFr:
        'Il n’existe qu’un trône et qu’une chaîne de commandement. Le concours décide seulement de la vitesse à laquelle les autres l’accepteront.',
    },
    watch: {
      text: 'Report facts, not impressions. I will decide what they mean.',
      textFr: 'Rapportez des faits, pas des impressions. C’est moi qui déciderai de leur sens.',
    },
  },
  camilla: {
    succession: {
      text: 'The throne is mine. Anyone treating that as a question is wasting the little time they have left.',
      textFr:
        'Le trône est à moi. Quiconque traite encore cela comme une question gaspille le peu de temps qu’il lui reste.',
    },
    danger: {
      text: 'Let them try. Their hostility is far more useful to me than their obedience.',
      textFr: 'Qu’ils essaient. Leur hostilité m’est bien plus utile que leur obéissance.',
    },
    watch: {
      text: 'I have given my order. I am not interested in hearing why someone failed to carry it out.',
      textFr:
        'J’ai donné mon ordre. Je ne veux pas entendre pourquoi quelqu’un n’a pas réussi à l’exécuter.',
    },
  },
  tserriednich: {
    nen: {
      text: 'The structure is becoming clear. Once I understand the rule, improvement is only a matter of discipline.',
      textFr:
        'La structure devient claire. Une fois la règle comprise, progresser n’est plus qu’une question de discipline.',
    },
    danger: {
      text: 'Violence without understanding is crude. I would rather know exactly what the other person believes will happen.',
      textFr:
        'La violence sans compréhension est grossière. Je préfère savoir exactement ce que l’autre croit sur le point d’arriver.',
    },
    watch: {
      text: 'Do not interrupt. I am learning faster than the people trying to teach me.',
      textFr: 'Ne m’interrompez pas. J’apprends plus vite que ceux qui prétendent m’enseigner.',
    },
  },
  halkenburg: {
    succession: {
      text: 'A crown bought with the lives of my siblings is not legitimacy. I will confront the system that demands it.',
      textFr:
        'Une couronne achetée avec la vie de ma fratrie n’est pas légitime. J’affronterai le système qui l’exige.',
    },
    danger: {
      text: 'If we act, we act together. No single life in this room is ammunition to be spent lightly.',
      textFr:
        'Si nous agissons, nous agissons ensemble. Aucune vie dans cette pièce n’est une munition que l’on dépense à la légère.',
    },
    watch: {
      text: 'Their trust is heavier than any weapon. I intend to remain worthy of it.',
      textFr:
        'Leur confiance pèse plus lourd que n’importe quelle arme. Je compte en rester digne.',
    },
  },
  nasubi: {
    succession: {
      text: 'The vessel does not ask which seed wished to grow. It preserves the one strong enough to become the tree.',
      textFr:
        'Le vaisseau ne demande pas quelle graine voulait pousser. Il préserve celle qui est assez forte pour devenir l’arbre.',
    },
    death: {
      text: 'Grief belongs to a father. The king must still see the ritual through.',
      textFr: 'Le chagrin appartient au père. Le roi, lui, doit mener le rite jusqu’au bout.',
    },
    watch: {
      text: 'The voyage proceeds. What matters is not the noise aboard, but what remains when it ends.',
      textFr:
        'Le voyage suit son cours. Ce qui compte n’est pas le bruit à bord, mais ce qui subsistera lorsqu’il prendra fin.',
    },
  },
  melody: {
    death: {
      text: 'Fear changes the heart before the face admits it. This room is already saying more than its words.',
      textFr:
        'La peur change le cœur avant que le visage ne l’admette. Cette pièce en dit déjà plus que ses paroles.',
    },
    escape: {
      text: 'A path is only safe if both of them reach its end. I will listen for the moment the plan begins to fail.',
      textFr:
        'Un chemin n’est sûr que si elles atteignent toutes les deux son terme. J’écouterai l’instant où le plan commencera à céder.',
    },
    watch: {
      text: 'Keep your voice steady. A lie is much louder to me than you think.',
      textFr:
        'Gardez une voix stable. Un mensonge est bien plus sonore pour moi que vous ne le pensez.',
    },
  },
  morena: {
    negotiation: {
      text: 'You are free to refuse. I only need you to understand what that choice truly costs.',
      textFr:
        'Vous êtes libre de refuser. J’ai seulement besoin que vous compreniez ce que ce choix coûte réellement.',
    },
    nen: {
      text: 'Power makes the rules visible. What someone does after seeing them is the part that interests me.',
      textFr:
        'Le pouvoir rend les règles visibles. Ce que quelqu’un fait après les avoir vues est la partie qui m’intéresse.',
    },
    watch: {
      text: 'This ship carries an entire country in miniature. That makes it an excellent place to begin again.',
      textFr:
        'Ce navire transporte un pays entier en miniature. C’est un excellent endroit pour tout recommencer.',
    },
  },
  chrollo: {
    hunt: {
      text: 'Do not confuse speed with progress. We find Hisoka by understanding where he wants us to look.',
      textFr:
        'Ne confondez pas vitesse et progrès. Nous trouverons Hisoka en comprenant où il veut que nous regardions.',
    },
    danger: {
      text: 'Stay with the objective. Anger is useful only when it does not choose the route for us.',
      textFr:
        'Restez concentrés sur l’objectif. La colère n’est utile que lorsqu’elle ne choisit pas notre route.',
    },
    watch: {
      text: 'The ship is a closed book with moving pages. We only need to learn the order in which they turn.',
      textFr:
        'Le navire est un livre fermé dont les pages bougent. Il suffit d’apprendre dans quel ordre elles se tournent.',
    },
  },
  hisoka: {
    hunt: {
      text: 'If they are looking for me, the least I can do is make the search entertaining.',
      textFr: 'S’ils me cherchent, la moindre des choses est de rendre la recherche divertissante.',
    },
    danger: {
      text: 'The dangerous ones are finally moving. Waiting was beginning to become tedious.',
      textFr:
        'Les plus dangereux se mettent enfin en mouvement. L’attente commençait à devenir pénible.',
    },
    watch: {
      text: 'So many people are trying not to show their hand. That is usually when they are most revealing.',
      textFr:
        'Tant de gens essaient de ne pas dévoiler leur jeu. C’est généralement là qu’ils se révèlent le plus.',
    },
  },
}

const GENERAL: Record<Exclude<Voice, keyof typeof SPECIAL>, Record<Beat, Pair>> = {
  military: {
    'martial-law': {
      text: 'The order has changed. Hold the corridor, verify every identity, and let nobody improvise.',
      textFr:
        'L’ordre a changé. Tenez la coursive, vérifiez chaque identité et ne laissez personne improviser.',
    },
    death: {
      text: 'Someone found a way through the security detail. Until we know how, every post is compromised.',
      textFr:
        'Quelqu’un a trouvé un passage à travers le dispositif. Tant que nous ignorons comment, chaque poste est compromis.',
    },
    nen: {
      text: 'Conventional security is not enough against an ability we cannot identify. I am watching behaviour, not explanations.',
      textFr:
        'La sécurité conventionnelle ne suffit pas contre une capacité inconnue. Je surveille les comportements, pas les explications.',
    },
    hunt: {
      text: 'The target is still unconfirmed. I keep my sector closed until the report changes.',
      textFr:
        'La cible n’est toujours pas confirmée. Je maintiens mon secteur fermé jusqu’à nouvel ordre.',
    },
    escape: {
      text: 'An unguarded route is not an exit; it is a breach. I am treating it as one.',
      textFr:
        'Une voie sans garde n’est pas une sortie, c’est une brèche. Je la traite comme telle.',
    },
    negotiation: {
      text: 'They can talk. My responsibility is to make sure nobody changes the balance while they do.',
      textFr:
        'Ils peuvent parler. Ma responsabilité est d’empêcher quiconque de modifier le rapport de force pendant ce temps.',
    },
    succession: {
      text: 'The princes decide policy. My job is to ensure my side is still standing when they finish.',
      textFr:
        'Les princes décident de la politique. Mon travail est de m’assurer que mon camp sera encore debout lorsqu’ils auront terminé.',
    },
    danger: {
      text: 'Stay behind the line and keep your hands visible. I will not give the threat a second opening.',
      textFr:
        'Restez derrière la ligne et gardez les mains visibles. Je ne laisserai pas une seconde ouverture à la menace.',
    },
    watch: {
      text: 'I remain at my post. Quiet does not mean safe aboard this ship.',
      textFr:
        'Je reste à mon poste. Sur ce navire, le calme ne signifie pas que nous sommes en sécurité.',
    },
  },
  hunter: {
    'martial-law': {
      text: 'Authority is moving faster than the evidence. I need to preserve both the scene and our freedom to act.',
      textFr:
        'L’autorité avance plus vite que les preuves. Je dois préserver à la fois la scène et notre liberté d’action.',
    },
    death: {
      text: 'The method matters more than the panic around it. If I can read the pattern, I can prevent the next death.',
      textFr:
        'La méthode compte davantage que la panique qu’elle provoque. Si je comprends le motif, je peux empêcher la prochaine mort.',
    },
    nen: {
      text: 'Do not name an ability before its conditions are known. A wrong assumption is exactly what a Nen user exploits.',
      textFr:
        'Ne nommez pas une capacité avant d’en connaître les conditions. Une fausse hypothèse est précisément ce qu’exploite un utilisateur de Nen.',
    },
    hunt: {
      text: 'I am following confirmed movement, not rumours. On a ship this crowded, the distinction keeps people alive.',
      textFr:
        'Je suis les déplacements confirmés, pas les rumeurs. Sur un navire aussi dense, cette différence sauve des vies.',
    },
    escape: {
      text: 'Every route has a condition. I want to know who can use this one, and what happens when it closes.',
      textFr:
        'Chaque voie possède une condition. Je veux savoir qui peut emprunter celle-ci et ce qui arrive lorsqu’elle se ferme.',
    },
    negotiation: {
      text: 'I will listen, but I will verify every condition before anyone in my care accepts it.',
      textFr:
        'J’écouterai, mais je vérifierai chaque condition avant que quiconque sous ma protection ne l’accepte.',
    },
    succession: {
      text: 'The contest turns every ordinary decision into a move. I am trying to keep people from becoming pieces.',
      textFr:
        'Le concours transforme chaque décision ordinaire en mouvement stratégique. J’essaie d’empêcher que les personnes deviennent des pièces.',
    },
    danger: {
      text: 'Stay alert and do not chase the first explanation. The obvious threat may only be the trigger.',
      textFr:
        'Restez vigilants et ne poursuivez pas la première explication. La menace évidente n’est peut-être que le déclencheur.',
    },
    watch: {
      text: 'I am watching the room and the people watching it. Both tell me something different.',
      textFr:
        'Je surveille la pièce et ceux qui la surveillent. Les deux ne racontent pas la même chose.',
    },
  },
  royal: {
    'martial-law': {
      text: 'The army calls this protection. In a succession contest, protection is simply control with better manners.',
      textFr:
        'L’armée appelle cela de la protection. Dans un concours de succession, la protection n’est que du contrôle mieux présenté.',
    },
    death: {
      text: 'Another room is grieving, and every other room is calculating what the death changes.',
      textFr:
        'Une pièce de plus est en deuil, et toutes les autres calculent ce que cette mort change.',
    },
    nen: {
      text: 'The beasts have changed the contest, but not its purpose. Power still belongs to whoever understands the rules first.',
      textFr:
        'Les bêtes ont changé le concours, mais pas son but. Le pouvoir appartient toujours à celui qui comprend les règles le premier.',
    },
    hunt: {
      text: 'Let the lower tiers chase their quarry. I am more interested in who profits from the disturbance.',
      textFr:
        'Que les niveaux inférieurs poursuivent leur proie. Je m’intéresse davantage à celui qui profite de l’agitation.',
    },
    escape: {
      text: 'A hidden passage is valuable only until everyone knows it exists. Now it is leverage.',
      textFr:
        'Un passage secret n’a de valeur que tant que personne ne le connaît. Désormais, c’est un moyen de pression.',
    },
    negotiation: {
      text: 'An alliance aboard this ship is not trust. It is an agreement about which danger comes first.',
      textFr:
        'Une alliance sur ce navire n’est pas de la confiance. C’est un accord sur le danger à traiter en premier.',
    },
    succession: {
      text: 'Every prince is measuring the others. I intend to decide what they are allowed to learn from me.',
      textFr:
        'Chaque prince mesure les autres. J’ai l’intention de décider ce qu’ils sont autorisés à apprendre de moi.',
    },
    danger: {
      text: 'Panic is an invitation to one’s rivals. Whatever happens, this room will remain composed.',
      textFr:
        'La panique est une invitation offerte à ses rivaux. Quoi qu’il arrive, cette pièce gardera son calme.',
    },
    watch: {
      text: 'Nothing aboard is merely routine now. Even silence between the rooms has political weight.',
      textFr:
        'Plus rien à bord n’est une simple routine. Même le silence entre les pièces a un poids politique.',
    },
  },
  mafia: {
    'martial-law': {
      text: 'Uniforms are filling the corridors. Business continues, but nobody takes the usual route twice.',
      textFr:
        'Les uniformes remplissent les coursives. Les affaires continuent, mais personne n’emprunte deux fois la route habituelle.',
    },
    death: {
      text: 'A body is a message. Before I react, I want to know who was meant to read it.',
      textFr: 'Un corps est un message. Avant de réagir, je veux savoir à qui il était destiné.',
    },
    nen: {
      text: 'Nen has changed the price of every mistake. The people who learn fastest will own the routes.',
      textFr:
        'Le Nen a changé le prix de chaque erreur. Ceux qui apprennent le plus vite posséderont les passages.',
    },
    hunt: {
      text: 'Everyone is searching, which means everyone is leaving traces. That may be worth more than the target.',
      textFr:
        'Tout le monde cherche, donc tout le monde laisse des traces. Elles valent peut-être plus que la cible.',
    },
    escape: {
      text: 'A route nobody controls is a route waiting to be claimed.',
      textFr: 'Une route que personne ne contrôle est une route qui attend son propriétaire.',
    },
    negotiation: {
      text: 'Terms are temporary. What matters is who still has options after the agreement is made.',
      textFr:
        'Les conditions sont temporaires. Ce qui compte, c’est de savoir qui possède encore des options après l’accord.',
    },
    succession: {
      text: 'The princes fight above us, but every decision they make changes the market below.',
      textFr:
        'Les princes se battent au-dessus de nous, mais chacune de leurs décisions transforme le marché en dessous.',
    },
    danger: {
      text: 'Keep the exits clear. Courage is cheaper when there is still somewhere to go.',
      textFr:
        'Gardez les sorties libres. Le courage coûte moins cher lorsqu’il reste un endroit où aller.',
    },
    watch: {
      text: 'I am listening. On this ship, useful information usually arrives before the person selling it.',
      textFr:
        'J’écoute. Sur ce navire, une information utile arrive généralement avant celui qui veut la vendre.',
    },
  },
  child: {
    'martial-law': {
      text: 'There are more soldiers outside than before. Everyone tells me not to worry, which makes it difficult not to.',
      textFr:
        'Il y a davantage de soldats dehors qu’avant. Tout le monde me dit de ne pas m’inquiéter, ce qui rend la chose difficile.',
    },
    death: {
      text: 'The adults stop talking when I enter. I know that means something terrible happened.',
      textFr:
        'Les adultes cessent de parler lorsque j’entre. Je sais que cela signifie qu’une chose terrible est arrivée.',
    },
    nen: {
      text: 'They say there is something in the room that I cannot see. I think some of them are more frightened than I am.',
      textFr:
        'Ils disent qu’il y a quelque chose dans la pièce que je ne peux pas voir. Je crois que certains ont plus peur que moi.',
    },
    hunt: {
      text: 'Everyone keeps looking at the doors. I wish someone would tell me what they expect to come through.',
      textFr:
        'Tout le monde regarde les portes. J’aimerais que quelqu’un me dise ce qu’ils pensent voir entrer.',
    },
    escape: {
      text: 'If the door opens again, I want to know where it goes before anyone follows me.',
      textFr:
        'Si la porte s’ouvre encore, je veux savoir où elle mène avant que quelqu’un me suive.',
    },
    negotiation: {
      text: 'They are speaking politely, but nobody in the room sounds calm.',
      textFr: 'Ils parlent poliment, mais personne dans cette pièce n’a l’air calme.',
    },
    succession: {
      text: 'The adults call it a contest. Nobody looks as though they are playing.',
      textFr: 'Les adultes appellent cela un concours. Personne n’a pourtant l’air de jouer.',
    },
    danger: {
      text: 'They told me to stay here and keep quiet. I can hear them moving outside.',
      textFr: 'Ils m’ont dit de rester ici et de me taire. Je les entends bouger dehors.',
    },
    watch: {
      text: 'Everyone is busy, so I am trying not to become one more thing they have to worry about.',
      textFr:
        'Tout le monde est occupé, alors j’essaie de ne pas devenir une inquiétude supplémentaire.',
    },
  },
  civilian: {
    'martial-law': {
      text: 'The rules changed without warning. I will keep my identification ready and stay out of the soldiers’ way.',
      textFr:
        'Les règles ont changé sans prévenir. Je garde mes papiers prêts et j’évite la route des soldats.',
    },
    death: {
      text: 'News travels quickly aboard a closed ship. The truth does not.',
      textFr: 'Les nouvelles circulent vite dans un navire fermé. La vérité, beaucoup moins.',
    },
    nen: {
      text: 'They keep using the word Nen as though naming the danger makes it easier to survive.',
      textFr:
        'Ils répètent le mot Nen comme si donner un nom au danger permettait d’y survivre plus facilement.',
    },
    hunt: {
      text: 'People are asking questions on every deck. I have learned that the safest answer is the shortest one.',
      textFr:
        'Des gens posent des questions sur tous les ponts. J’ai appris que la réponse la plus sûre est la plus courte.',
    },
    escape: {
      text: 'Every exit seems to lead to another checkpoint. I no longer know which direction counts as safety.',
      textFr:
        'Chaque sortie semble mener à un autre contrôle. Je ne sais plus quelle direction peut encore être considérée comme sûre.',
    },
    negotiation: {
      text: 'Important people are talking. The rest of us will discover what they decided when the doors open.',
      textFr:
        'Les personnes importantes discutent. Les autres découvriront leur décision lorsque les portes s’ouvriront.',
    },
    succession: {
      text: 'The royal contest is far above my station, but its consequences keep reaching this deck.',
      textFr:
        'Le concours royal dépasse largement ma condition, mais ses conséquences atteignent toujours ce pont.',
    },
    danger: {
      text: 'I am staying close to the wall and away from anyone who looks as though they know what is happening.',
      textFr:
        'Je reste près du mur et loin de ceux qui donnent l’impression de savoir ce qui se passe.',
    },
    watch: {
      text: 'I am carrying on with my work. It is the only ordinary thing left to do.',
      textFr: 'Je poursuis mon travail. C’est la seule chose ordinaire qu’il reste à faire.',
    },
  },
}

export function pairFor(voice: Voice, beat: Beat): Pair {
  if (voice in SPECIAL) {
    const lines = SPECIAL[voice as keyof typeof SPECIAL]
    return lines[beat] ?? lines.watch
  }
  return GENERAL[voice as keyof typeof GENERAL][beat]
}
