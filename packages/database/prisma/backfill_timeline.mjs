import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const knownEvents = [
  {
    chapter: 345,
    chapterTitle: 'Signature',
    sequence: 1,
    title: 'Tserriednich is revealed as a serial killer',
    summary:
      'Tserriednich murders and dismembers young women while treating their bodies as material for his collection.',
    legacyTitles: ['Début du chapitre 345'],
  },
  {
    chapter: 348,
    chapterTitle: 'Resolve',
    sequence: 1,
    title: 'Benjamin challenges Tserriednich',
    summary:
      'Benjamin tells Tserriednich that only one prince will survive the voyage and promises to eliminate him personally.',
    legacyTitles: ['Début du chapitre 348'],
  },
  {
    chapter: 349,
    chapterTitle: 'Worm Toxin',
    sequence: 1,
    title: 'The fourteen princes enter the Succession Contest',
    summary:
      'The royal heirs gather for the urn ceremony and receive the eggs that will awaken their Guardian Spirit Beasts.',
    legacyTitles: ['Appearance of Benjamin Hui Guo Rou'],
  },
  {
    chapter: 351,
    chapterTitle: 'Battle to the Death',
    sequence: 1,
    title: 'Hisoka and Chrollo begin their death match',
    summary:
      "At Heaven's Arena, Chrollo reveals a prepared combination of stolen abilities and promises Hisoka certain death.",
    legacyTitles: [],
  },
  {
    chapter: 356,
    chapterTitle: 'Unfortunate: Part 1',
    sequence: 1,
    title: 'Chrollo kills Hisoka',
    summary:
      'More than two hundred manipulated puppets overwhelm Hisoka; the final explosions leave him dead beneath the bodies.',
    legacyTitles: [],
  },
  {
    chapter: 357,
    chapterTitle: 'Unfortunate: Part 2',
    sequence: 1,
    title: 'Hisoka resurrects and changes the hunt',
    summary:
      "Post-mortem Bungee Gum restarts Hisoka's heart and lungs; he then kills Kortopi and Shalnark and vows to hunt every Spider.",
    legacyTitles: [],
  },
  {
    chapter: 358,
    chapterTitle: 'Eve',
    sequence: 2,
    title: 'Woody is found dead',
    summary: 'Woody is found exsanguinated in the bathroom of room 1014.',
    legacyTitles: [],
  },
  {
    chapter: 360,
    chapterTitle: 'Parasite',
    sequence: 1,
    title: 'Sayird is manipulated',
    summary:
      'Controlled by a parasitic Nen ability, Sayird kills Kurton and attacks Kurapika before being subdued.',
    legacyTitles: ['Début du chapitre 360'],
  },
  {
    chapter: 364,
    chapterTitle: 'Speculation',
    sequence: 1,
    title: 'Vincent attacks room 1014',
    summary:
      'Vincent kills Sandra, opens fire on Bill and Kurapika, then poisons himself after they overpower him.',
    legacyTitles: ['Vincent arrives'],
  },
  {
    chapter: 373,
    chapterTitle: 'Inheritance',
    sequence: 1,
    title: 'Camilla resurrects after Musse kills her',
    summary:
      "Camilla's post-mortem Nen beast kills Musse and uses his life force to restore her body.",
    legacyTitles: [],
  },
  {
    chapter: 365,
    chapterTitle: 'Choice',
    sequence: 1,
    title: 'Zhang Lei and Tubeppa approach room 1014',
    summary:
      'Both princes seek information from Kurapika; Zhang Lei receives Oito and Woble while Tubeppa proposes a truce.',
    legacyTitles: [],
  },
  {
    chapter: 366,
    chapterTitle: 'To Each His Own',
    sequence: 1,
    title: 'The princes respond to the Nen stalemate',
    summary:
      "Tyson promotes her Book, Luzurus sends a guard to learn Nen, and the royal factions adapt to Kurapika's announcement.",
    legacyTitles: [],
  },
  {
    chapter: 366,
    chapterTitle: 'To Each His Own',
    sequence: 2,
    title: 'Chrollo orders the hunt for Hisoka',
    summary:
      'The Phantom Troupe gathers aboard the Black Whale, accepts Illumi as a member and begins searching the lower tiers for Hisoka.',
    legacyTitles: [],
  },
  {
    chapter: 373,
    chapterTitle: 'Inheritance',
    sequence: 2,
    title: 'Camilla attacks Benjamin',
    summary:
      'Camilla shoots at Furykov, Benjamin and Balsamilco before Furykov breaks her arm and arrests her.',
    legacyTitles: [],
  },
  {
    chapter: 368,
    chapterTitle: 'Foul Play',
    sequence: 1,
    title: 'Momoze is assassinated',
    summary:
      'Tuffdy strangles Momoze after her Guardian Spirit Beast exhausts her aura and disappears.',
    legacyTitles: [],
  },
  {
    chapter: 369,
    chapterTitle: 'Limits',
    sequence: 2,
    title: 'Silent Majority kills Barrigen',
    summary:
      "Four conjured snakes drain Barrigen's blood during Kurapika's first Nen class while the hidden user observes through Loberry.",
    legacyTitles: [],
  },
  {
    chapter: 369,
    chapterTitle: 'Limits',
    sequence: 1,
    title: 'Silent Majority possesses Loberry',
    summary:
      "The hidden assassin uses Loberry as the only witness to the masked doll observing Kurapika's Nen class.",
    legacyTitles: ['Début du chapitre 369'],
  },
  {
    chapter: 370,
    chapterTitle: 'Observation',
    sequence: 1,
    title: 'Silent Majority kills Myuhan',
    summary:
      'Myuhan is found exsanguinated in a bathroom after the unresolved assassin activates Silent Majority again.',
    legacyTitles: [],
  },
  {
    chapter: 372,
    chapterTitle: 'Disappearance',
    sequence: 1,
    title: 'Hanzo avenges Momoze',
    summary:
      'Hanzo identifies Tuffdy, obtains his confession in detention and kills him with Hanzo Skill 4.',
    legacyTitles: [],
  },
  {
    chapter: 371,
    chapterTitle: 'Mission',
    sequence: 2,
    title: 'The Phantom Troupe subdues the Buor men',
    summary:
      "Franklin, Phinks, Feitan and Nobunaga overpower three mafia members and interrogate them about Kakin's underworld.",
    legacyTitles: [],
  },
  {
    chapter: 377,
    chapterTitle: 'Scheme',
    sequence: 1,
    title: 'The Phantom Troupe divides the search for Hisoka',
    summary:
      'Chrollo disperses the Spiders across the lower tiers while Shizuku and Bonolenov choose to accompany him.',
    legacyTitles: ['Appearance of Hinrigh Biganduffno'],
  },
  {
    chapter: 378,
    chapterTitle: 'Balance',
    sequence: 1,
    title: 'Morena unleashes Contagion',
    summary:
      'Morena infects the Heil-Ly members, assigns levels for murder and sends them out to destroy Kakin and the world.',
    legacyTitles: ['Appearance of Morena Prudo'],
  },
  {
    chapter: 384,
    chapterTitle: 'War',
    sequence: 1,
    title: 'The mafia bosses set the Spiders against Heil-Ly',
    summary:
      'Onior and Brocco decide to let the Phantom Troupe and Heil-Ly weaken each other while their families search for Hisoka.',
    legacyTitles: [],
  },
  {
    chapter: 380,
    chapterTitle: 'Alarm',
    sequence: 1,
    title: 'Fugetsu emerges alone on Tier 3',
    summary:
      'An uncontrolled use of Magical Worm takes Fugetsu to Tier 3, where the Hunters place her under Justice protection.',
    legacyTitles: ['Début du chapitre 380'],
  },
  {
    chapter: 374,
    chapterTitle: 'Ability',
    sequence: 1,
    title: "Fugetsu's Magical Worm opens",
    summary: "Fugetsu's Guardian Spirit Beast creates a passage connecting her room to Kacho's.",
    legacyTitles: [],
  },
  {
    chapter: 375,
    chapterTitle: 'Persuasion',
    sequence: 2,
    title: "Marayam's room is isolated",
    summary:
      "Marayam's Guardian Spirit Beast moves room 1013 into a protected Nen space that cannot be re-entered from outside.",
    legacyTitles: [],
  },
  {
    chapter: 381,
    chapterTitle: 'Predation',
    sequence: 1,
    title: "Predator devours Salé-salé's Guardian Spirit Beast",
    summary:
      "After studying its conditions, Rihan's Predator neutralizes Salé-salé's manipulative Guardian Spirit Beast.",
    legacyTitles: [],
  },
  {
    chapter: 382,
    chapterTitle: 'Awakening',
    sequence: 1,
    title: 'Salé-salé is assassinated',
    summary:
      'Yushohi kills Salé-salé with Stand by Me; the death is concealed and attributed publicly to illness.',
    legacyTitles: [],
  },
  {
    chapter: 382,
    chapterTitle: 'Awakening',
    sequence: 2,
    title: 'Halkenburg commits to the Succession Contest',
    summary:
      'After failing to shoot Nasubi or himself, Halkenburg accepts the fight and awakens his collective Nen ability.',
    legacyTitles: ['Halkenburg Collapse'],
  },
  {
    chapter: 383,
    chapterTitle: 'Escape',
    sequence: 1,
    title: 'Kacho and Fugetsu attempt to escape',
    summary:
      'The twins leave the Black Whale in a lifeboat, triggering the succession ceremony trap.',
    occursOnBlackWhale: false,
    legacyTitles: [],
  },
  {
    chapter: 383,
    chapterTitle: 'Escape',
    sequence: 2,
    title: 'Kacho dies and Without You awakens',
    summary: 'Kacho dies outside the ship and her Guardian Spirit Beast activates in her image.',
    occursOnBlackWhale: false,
    legacyTitles: [],
  },
  {
    chapter: 383,
    chapterTitle: 'Escape',
    sequence: 3,
    title: 'Without You rejoins Fugetsu aboard the Black Whale',
    summary:
      "The post-mortem Nen construct bearing Kacho's appearance returns through Magical Worm and remains beside Fugetsu.",
    occursOnBlackWhale: true,
    legacyTitles: [],
  },
  {
    chapter: 386,
    chapterTitle: 'Hypothesis',
    sequence: 1,
    title: "Tserriednich survives Theta's execution attempt",
    summary:
      'Parallel Future lets Tserriednich foresee the gunshot, evade it and conceal the outcome from his guards.',
    legacyTitles: [],
  },
  {
    chapter: 389,
    chapterTitle: 'Curse',
    sequence: 1,
    title: 'Halkenburg strikes Shikaku',
    summary:
      "Halkenburg's collective arrow pierces every defence and transfers Sumidori into Shikaku's body.",
    legacyTitles: [],
  },
  {
    chapter: 392,
    chapterTitle: 'Information',
    sequence: 2,
    title: 'Lynch exposes the false Hisoka',
    summary:
      'Lynch strikes Bonolenov in disguise and her ability reveals that the man posing as Hisoka is an impostor.',
    legacyTitles: [],
  },
  {
    chapter: 392,
    chapterTitle: 'Information',
    sequence: 1,
    title: 'Lynch tests Hanal while searching for Hisoka',
    summary:
      'Lynch strikes Hanal on Tier 3 and Body and Soul confirms that the passer-by is not Hisoka.',
    legacyTitles: ['Début du chapitre 392'],
  },
  {
    chapter: 393,
    chapterTitle: 'Plea',
    sequence: 1,
    title: 'Bonolenov kills Lynch',
    summary:
      "Bonolenov neutralizes Zakuro, kills Lynch and impersonates her to keep the Phantom Troupe's deception intact.",
    legacyTitles: [],
  },
  {
    chapter: 398,
    chapterTitle: 'Search',
    sequence: 1,
    title: 'The Heil-Ly hideout is traced to Tier 2',
    summary:
      "Hinrigh plants a transmitter beyond the room 3101 trap, allowing the Phantom Troupe to locate Morena's true base.",
    legacyTitles: [],
  },
  {
    chapter: 402,
    chapterTitle: 'Letter',
    sequence: 1,
    title: "Kacho's posthumous letters are distributed",
    summary:
      'Fugetsu visits the princes under Justice Ministry escort to deliver the messages prepared by Kacho.',
    legacyTitles: [],
  },
  {
    chapter: 405,
    chapterTitle: 'Performance',
    sequence: 1,
    title: 'Dogman abducts Borksen',
    summary:
      "Using Halkenburg's funeral procession as cover, Dogman identifies and abducts the Specialist sought by Morena.",
    legacyTitles: [],
  },
  {
    chapter: 405,
    chapterTitle: 'Performance',
    sequence: 3,
    title: 'Chrollo searches the funeral procession',
    summary:
      "Chrollo uses Love Dial 6700 among Halkenburg's mourners and concludes that the target he needs is on an upper tier.",
    legacyTitles: ['Début du chapitre 405'],
  },
  {
    chapter: 405,
    chapterTitle: 'Performance',
    sequence: 2,
    title: 'The real Hisoka appears at the Tier 1 casino',
    summary:
      'Hisoka plays SQ-X while Bonolenov, still disguised as him, spots him and immediately changes form to avoid detection.',
    legacyTitles: [],
  },
  {
    chapter: 406,
    chapterTitle: 'Regalia',
    sequence: 1,
    title: "Halkenburg's body dies",
    summary:
      "Halkenburg's original body dies while his consciousness continues operating from Balsamilco's body.",
    legacyTitles: [],
  },
  {
    chapter: 406,
    chapterTitle: 'Regalia',
    sequence: 2,
    title: 'Chrollo targets the Kakin regalia',
    summary:
      'Chrollo identifies the three royal treasures as the key to strengthening Skill Hunter before his next fight with Hisoka.',
    legacyTitles: [],
  },
  {
    chapter: 407,
    chapterTitle: 'Negotiation',
    sequence: 1,
    title: 'Morena begins her negotiation game with Borksen',
    summary:
      'Morena asks Borksen to join Heil-Ly and uses a card game that forces both sides to reveal information and narrow the answer.',
    legacyTitles: [],
  },
  {
    chapter: 408,
    chapterTitle: 'Negotiation: Part 2',
    sequence: 1,
    title: 'Morena reveals her goal and origins',
    summary:
      'The game compels Morena to explain Contagion, her origin as a Kakin “Meat” and her plan to destroy the kingdom and the world.',
    legacyTitles: [],
  },
  {
    chapter: 409,
    chapterTitle: 'Negotiation: Part 3',
    sequence: 1,
    title: 'Borksen fulfills a condition of Contagion',
    summary:
      "Borksen trades a kiss for a recovered response card, unknowingly satisfying one of the conditions of Morena's ability.",
    legacyTitles: [],
  },
  {
    chapter: 413,
    chapterTitle: 'Loyalty',
    sequence: 2,
    title: 'Benjamin discovers the body swap and his infection',
    summary:
      'Benjamin realizes that Halkenburg controls Balsamilco and learns that he has been infected with TSK-17.',
    legacyTitles: [],
  },
  {
    chapter: 410,
    chapterTitle: 'Negotiation: Part 4',
    sequence: 2,
    title: "Borksen accepts Morena's offer",
    summary:
      "Borksen deliberately chooses Yes and joins Heil-Ly, remaining at level zero until Contagion's final condition is met.",
    legacyTitles: [],
  },
  {
    chapter: 413,
    chapterTitle: 'Loyalty',
    sequence: 3,
    title: 'Benjamin proclaims martial law',
    summary:
      'Benjamin orders the capture of the princes and moves his command centre to the Justice Bureau on Tier 2.',
    legacyTitles: [],
  },
  {
    chapter: 412,
    chapterTitle: 'Question',
    sequence: 1,
    title: 'Oito reveals that the baby is not Woble',
    summary:
      'Confronted by Kurapika and Bill, Oito admits that the child in room 1014 is her nephew; the real Woble remains missing.',
    legacyTitles: [],
  },
  {
    chapter: 340,
    chapterTitle: 'Special Mission',
    sequence: 1,
    title: 'Kakin announces the Dark Continent expedition',
    summary:
      'Nasubi appoints Beyond Netero to lead Kakin toward the Dark Continent, and the V5 orders the Zodiacs to capture him.',
    legacyTitles: ['Zodiacs Assemble'],
  },
  {
    chapter: 341,
    chapterTitle: 'Threats',
    sequence: 1,
    title: 'Beyond surrenders to the Zodiacs',
    summary:
      'The Zodiacs learn about the Five Threats before Beyond voluntarily places himself in their custody.',
    legacyTitles: [],
  },
  {
    chapter: 342,
    chapterTitle: 'Challenge',
    sequence: 1,
    title: 'The V5 brings Kakin into the V6',
    summary:
      'Beyond challenges the Zodiacs, while the international powers decide to support Kakin and make the Hunters escort him.',
    legacyTitles: [],
  },
  {
    chapter: 343,
    chapterTitle: 'Invitation',
    sequence: 1,
    title: 'Leorio and Kurapika are recruited as Zodiacs',
    summary:
      'Cheadle recruits Leorio for the expedition, and his recommendation brings Kurapika back into contact with the Association.',
    legacyTitles: [],
  },
  {
    chapter: 344,
    chapterTitle: 'Author',
    sequence: 1,
    title: 'Kurapika identifies Tserriednich as his target',
    summary:
      'Mizaistom reveals that Tserriednich owns the remaining Scarlet Eyes, giving Kurapika a route into the expedition.',
    legacyTitles: [],
  },
  {
    chapter: 346,
    chapterTitle: 'Options',
    sequence: 1,
    title: 'Kurapika exposes the risk of a Zodiac mole',
    summary:
      'Kurapika concludes that Beyond prepared allies inside the Hunter Association, and the Zodiacs organize their expedition roles.',
    legacyTitles: [],
  },
  {
    chapter: 347,
    chapterTitle: 'Inauguration',
    sequence: 1,
    title: "Ging reproduces Leorio's Nen technique",
    summary:
      "Ging defeats Muherr's staged ambush by copying and extending the remote-punch technique that Leorio once used on him.",
    legacyTitles: [],
  },
  {
    chapter: 350,
    chapterTitle: 'Prince',
    sequence: 1,
    title: 'Kurapika recruits guards for the younger princes',
    summary:
      'Kurapika brings Biscuit, Basho, Izunavi, Hanzo and Melody into the royal bodyguard selection to reach Tserriednich.',
    legacyTitles: [],
  },
  {
    chapter: 352,
    chapterTitle: 'Troublesome',
    sequence: 1,
    title: 'Chrollo combines Order Stamp and Gallery Fake',
    summary:
      'Chrollo demonstrates how copied bodies can be turned into puppets while concealing his movements among the audience.',
    legacyTitles: [],
  },
  {
    chapter: 353,
    chapterTitle: 'Cold-Blooded',
    sequence: 1,
    title: 'Chrollo overwhelms Hisoka with puppets',
    summary:
      'Dozens of controlled spectators attack Hisoka while Chrollo repeatedly strikes from within the crowd.',
    legacyTitles: [],
  },
  {
    chapter: 354,
    chapterTitle: 'Head',
    sequence: 1,
    title: 'Hisoka turns severed heads into weapons',
    summary:
      'Hisoka uses Bungee Gum and Shu to fight through the puppets and briefly injure Chrollo.',
    legacyTitles: [],
  },
  {
    chapter: 355,
    chapterTitle: 'Detonation',
    sequence: 1,
    title: 'Chrollo prepares the explosive final assault',
    summary:
      'Post-mortem Sun and Moon marks preserve copied puppets, allowing Chrollo to assemble an explosive swarm.',
    legacyTitles: [],
  },
  {
    chapter: 361,
    chapterTitle: 'Withdraw',
    sequence: 1,
    title: "Kurapika steals Sayird's ability",
    summary:
      'Kurapika subdues Sayird and uses Steal Chain, revealing the Emperor Time condition needed to control the stolen power.',
    legacyTitles: [],
  },
  {
    chapter: 362,
    chapterTitle: 'Resolve',
    sequence: 1,
    title: 'The rules of the Guardian Spirit Beasts emerge',
    summary:
      'The princes learn that the beasts cannot directly kill one another or another host, while Tserriednich forces Theta to teach him Nen.',
    legacyTitles: ['Début du chapitre 362'],
  },
  {
    chapter: 363,
    chapterTitle: 'Nen Beast',
    sequence: 1,
    title: 'Benjamin deploys his soldiers among the princes',
    summary:
      'After learning the limits of the guardian beasts, Benjamin uses his private army to monitor the other royal factions.',
    legacyTitles: ['Appearance of Balsamilco Might'],
  },
  {
    chapter: 367,
    chapterTitle: 'Synchronization',
    sequence: 1,
    title: 'Kurapika explains the Guardian Spirit Beasts',
    summary:
      'Kurapika shares the mechanics of parasitic Nen with rival guards while Oito and Bill search for an insect for Little Eye.',
    legacyTitles: [],
  },
  {
    chapter: 376,
    chapterTitle: 'Determination',
    sequence: 1,
    title: 'Benjamin and Camilla are placed under judicial surveillance',
    summary:
      'Their competing accounts leave both princes confined under Justice supervision while the court investigates the attack.',
    legacyTitles: [],
  },
  {
    chapter: 379,
    chapterTitle: 'Collaboration',
    sequence: 1,
    title: 'Heil-Ly sabotages the murder investigation',
    summary:
      'Luini escapes through his spatial ability while Cashew mixes truth and lies to mislead Mizaistom.',
    legacyTitles: [],
  },
  {
    chapter: 385,
    chapterTitle: 'Warning',
    sequence: 1,
    title: 'Theta shoots Tserriednich during Zetsu',
    summary:
      'Theta uses the disappearance of the guardian beast during training to execute Tserriednich with a shot to the head.',
    legacyTitles: [],
  },
  {
    chapter: 387,
    chapterTitle: 'Recreation',
    sequence: 1,
    title: 'Tserriednich understands Parallel Future',
    summary:
      'Tserriednich determines that Zetsu grants him a ten-second vision whose predicted outcome remains visible to everyone else.',
    legacyTitles: [],
  },
  {
    chapter: 388,
    chapterTitle: 'Reflection',
    sequence: 1,
    title: 'Kurapika rapidly awakens the Nen students',
    summary:
      "Kurapika lends abilities through Stealth Dolphin to open the students' aura nodes while Bill demonstrates Water Divination.",
    legacyTitles: [],
  },
  {
    chapter: 390,
    chapterTitle: 'Clash: Part 1',
    sequence: 1,
    title: 'Xi-Yu clashes with Heil-Ly on Tier 3',
    summary:
      'Hinrigh, Lynch and Zakuro confront Heil-Ly members; Hinrigh kills the soldiers who try to expel his team.',
    legacyTitles: [],
  },
  {
    chapter: 391,
    chapterTitle: 'Clash: Part 2',
    sequence: 1,
    title: 'Hinrigh begins tracking the Heil-Ly routes',
    summary:
      'Hinrigh turns a camera into a scouting animal while Lynch and Zakuro continue the search for Hisoka.',
    legacyTitles: [],
  },
  {
    chapter: 394,
    chapterTitle: 'Hypothesis',
    sequence: 1,
    title: 'The room 3101 trap claims Tassi',
    summary:
      'Tassi crosses the threshold, is teleported into the Heil-Ly base and killed so Bille can reach level 21.',
    legacyTitles: ['Début du chapitre 394'],
  },
  {
    chapter: 395,
    chapterTitle: 'Founding: Part 1',
    sequence: 1,
    title: 'The Phantom Troupe probes room 3101',
    summary:
      'Nobunaga, Phinks and Feitan use neighbouring rooms and unwilling test subjects to investigate the Heil-Ly teleportation trap.',
    legacyTitles: [],
  },
  {
    chapter: 396,
    chapterTitle: 'Founding: Part 2',
    sequence: 1,
    title: 'The future Spiders perform in Meteor City',
    summary:
      'A young Chrollo organizes a dubbed screening of Power Cleaners with the children who will later form the Phantom Troupe.',
    legacyTitles: [],
  },
  {
    chapter: 397,
    chapterTitle: 'Founding: Part 3',
    sequence: 1,
    title: "Sarasa's murder shapes the Phantom Troupe",
    summary:
      'The children find Sarasa murdered; Chrollo commits to mastering technology and building a group that will hunt her killers.',
    legacyTitles: [],
  },
  {
    chapter: 399,
    chapterTitle: 'Expulsion',
    sequence: 1,
    title: 'Hinrigh and Nobunaga enter the Heil-Ly hideout',
    summary:
      "The pair crosses the trapped rooms and confronts Morena's followers before Yokotani expels them through his legal ability.",
    legacyTitles: [],
  },
  {
    chapter: 400,
    chapterTitle: 'Secrecy',
    sequence: 1,
    title: 'The Phantom Troupe confirms the hideout is on Tier 2',
    summary:
      "Phinks, Feitan and Nobunaga use Hinrigh's transmitter to establish that Morena's Nen space lies above Tier 3.",
    legacyTitles: [],
  },
  {
    chapter: 401,
    chapterTitle: 'Moonlight',
    sequence: 1,
    title: 'Longhi offers Kurapika a binding alliance',
    summary:
      'Longhi reveals Moonlight Act, her connection to Beyond and the plan to identify which prince may be his child.',
    legacyTitles: [],
  },
  {
    chapter: 403,
    chapterTitle: 'Results',
    sequence: 1,
    title: 'Balsamilco begins the TSK-17 assassination plan',
    summary:
      "Balsamilco enters the Justice Bureau intending to infect Halkenburg during questioning, as Kacho's letter reveals Unma is Halkenburg's mother.",
    legacyTitles: [],
  },
  {
    chapter: 404,
    chapterTitle: 'Speculation',
    sequence: 1,
    title: "Halkenburg takes Balsamilco's body",
    summary:
      'Halkenburg fires through the courthouse wall and transfers his consciousness into Balsamilco before his original body succumbs.',
    legacyTitles: [],
  },
  {
    chapter: 411,
    chapterTitle: 'Announcement',
    sequence: 1,
    title: 'Kurapika opens the second Nen class',
    summary:
      'Kurapika expands the lessons, explains how the succession ritual can fail and announces that Woble is not an eligible participant.',
    legacyTitles: [],
  },
  {
    chapter: 412,
    chapterTitle: 'Question',
    sequence: 2,
    title: 'Beyond meets Judge Cleapatro',
    summary:
      'Cleapatro visits Beyond in his VVIP cell to review the more than one thousand lawsuits he filed against Kakin.',
    legacyTitles: [],
  },
  {
    chapter: 413,
    chapterTitle: 'Loyalty',
    sequence: 1,
    title: "Halkenburg's burial confirms his soul survives",
    summary:
      "Nasubi observes that Halkenburg's flame is unlit and confirms that his succession rights remain while his soul inhabits another body.",
    legacyTitles: [],
  },
  {
    chapter: 414,
    chapterTitle: 'Friends',
    sequence: 1,
    title: "Benjamin's soldiers begin their martial-law operations",
    summary:
      "Kanjidol attacks Luzurus's guards while military teams prepare to force entry into Halkenburg's quarters.",
    legacyTitles: [],
  },
  {
    chapter: 414,
    chapterTitle: 'Friends',
    sequence: 2,
    title: "Kurapika seeks his friends' help to protect Woble",
    summary:
      "Kurapika proposes tracing the real Woble and dismantling Beyond's curse, trusting friends on the mainland to protect her.",
    legacyTitles: [],
  },
  {
    chapter: 415,
    chapterTitle: 'Truth or Falsehood',
    sequence: 1,
    title: 'Furykov confronts Beyond about his sacrificial curse',
    summary:
      'Two months before departure, Furykov analyzes the curse placed on him at birth, determines that the Seed Urn Ceremony assigned it a royal target and confronts Beyond.',
    legacyTitles: ["The Seed Urn Ceremony assigns royal targets to Beyond's curses"],
    isFlashback: true,
    occurredAtLabel: 'Two months before departure',
    occursOnBlackWhale: false,
    occursAfterTitle: 'The fourteen princes enter the Succession Contest',
  },
  {
    chapter: 415,
    chapterTitle: 'Truth or Falsehood',
    sequence: 2,
    title: 'Kurapika and Oito prepare a message for the mainland',
    summary:
      "Kurapika and Oito discuss a letter intended for Oito's sister through a delivery service before the declaration of martial law interrupts them.",
    legacyTitles: ["Furykov identifies the structure of Beyond's curse"],
  },
  {
    chapter: 415,
    chapterTitle: 'Truth or Falsehood',
    sequence: 3,
    title: 'The royal camps respond to special martial law',
    summary:
      'The princes and their guards receive conflicting movement, escort and disarmament orders as Benjamin summons the heirs and tightens control of Tier 1.',
    legacyTitles: [],
    occursAfterTitle: 'Kurapika and Oito prepare a message for the mainland',
  },
  {
    chapter: 415,
    chapterTitle: 'Truth or Falsehood',
    sequence: 4,
    title: 'Ridge subdues Kanjidol during martial law',
    summary:
      "After Kanjidol arms part of Luzurus's guard detail, Hunter Ridge defeats, injures and detains him in the royal residential sector.",
    legacyTitles: [],
  },
]

async function syncEvent(definition) {
  const chapter = await prisma.chapter.upsert({
    where: { number: definition.chapter },
    update: { title: definition.chapterTitle },
    create: { number: definition.chapter, title: definition.chapterTitle },
  })

  const matchingTitles = [definition.title, ...definition.legacyTitles]
  const existing = await prisma.narrativeEvent.findFirst({
    where: { title: { in: matchingTitles } },
  })

  if (existing) {
    await prisma.narrativeEvent.update({
      where: { id: existing.id },
      data: {
        chapterId: chapter.id,
        sequence: definition.sequence,
        title: definition.title,
        summary: definition.summary,
        ...(definition.isFlashback === undefined ? {} : { isFlashback: definition.isFlashback }),
        ...(definition.occurredAtLabel === undefined
          ? {}
          : { occurredAtLabel: definition.occurredAtLabel }),
        ...(definition.occursOnBlackWhale === undefined
          ? {}
          : { occursOnBlackWhale: definition.occursOnBlackWhale }),
      },
    })
    return 'updated'
  }

  await prisma.narrativeEvent.create({
    data: {
      chapterId: chapter.id,
      sequence: definition.sequence,
      title: definition.title,
      summary: definition.summary,
      isFlashback: definition.isFlashback ?? false,
      occurredAtLabel: definition.occurredAtLabel ?? null,
      occursOnBlackWhale: definition.occursOnBlackWhale ?? true,
    },
  })
  return 'created'
}

async function main() {
  const results = { created: 0, updated: 0 }
  for (const definition of knownEvents) {
    const result = await syncEvent(definition)
    results[result] += 1
  }

  // Preserve curated occurrence order (including flashbacks). Only events that
  // do not have a chronological position yet are appended in publication order.
  await prisma.$executeRawUnsafe(`
		WITH cursor_end AS (
			SELECT COALESCE(MAX("ordinal"), -1) AS "lastOrdinal" FROM "NarrativeEvent"
		), ordered_events AS (
			SELECT event."id", cursor_end."lastOrdinal" + ROW_NUMBER() OVER (
				ORDER BY chapter."number", event."sequence", event."id"
			) AS "ordinal"
			FROM "NarrativeEvent" event
			JOIN "Chapter" chapter ON chapter."id" = event."chapterId"
			CROSS JOIN cursor_end
			WHERE event."ordinal" IS NULL
		)
		UPDATE "NarrativeEvent" event
		SET "ordinal" = ordered_events."ordinal"
		FROM ordered_events
		WHERE event."id" = ordered_events."id"
	`)

  // A late chapter can reveal an event from much earlier. Reinsert those
  // declared events beside their chronological anchor without disturbing the
  // relative order of the rest of the curated timeline.
  const anchoredDefinitions = knownEvents.filter((definition) => definition.occursAfterTitle)
  if (anchoredDefinitions.length > 0) {
    const orderedEvents = await prisma.narrativeEvent.findMany({
      orderBy: [{ ordinal: 'asc' }, { chapter: { number: 'asc' } }, { sequence: 'asc' }],
    })

    for (const definition of anchoredDefinitions) {
      const eventIndex = orderedEvents.findIndex((event) => event.title === definition.title)
      if (eventIndex === -1) continue
      const [event] = orderedEvents.splice(eventIndex, 1)
      const anchorIndex = orderedEvents.findIndex(
        (candidate) => candidate.title === definition.occursAfterTitle,
      )
      if (anchorIndex === -1) {
        orderedEvents.splice(eventIndex, 0, event)
        continue
      }
      orderedEvents.splice(anchorIndex + 1, 0, event)
    }

    await prisma.$transaction([
      prisma.narrativeEvent.updateMany({ data: { ordinal: null } }),
      ...orderedEvents.map((event, ordinal) =>
        prisma.narrativeEvent.update({ where: { id: event.id }, data: { ordinal } }),
      ),
    ])
  }

  await prisma.$executeRawUnsafe(`
		UPDATE "NarrativeEvent" event
		SET "occursOnBlackWhale" = CASE
			WHEN event."isFlashback" = TRUE THEN event."occursOnBlackWhale"
			WHEN event."title" IN (
				'Kacho and Fugetsu attempt to escape',
				'Kacho dies and Without You awakens'
			) THEN FALSE
			WHEN event."title" = 'Without You rejoins Fugetsu aboard the Black Whale' THEN TRUE
			ELSE NOT (
				SELECT chapter."number" < 359 OR chapter."number" IN (396, 397)
				FROM "Chapter" chapter
				WHERE chapter."id" = event."chapterId"
			)
		END
	`)
  console.log(
    `Timeline synchronisée : ${results.created} créations, ${results.updated} mises à jour.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
