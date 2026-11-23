/** Page copy of the 2D duel, kept out of the route so the page stays a page. */
export function fightingCopy(language: 'fr' | 'en') {
  return language === 'fr'
    ? {
        eyebrow: 'NOUVEAU MODE · DUEL 2D',
        title: 'Black Whale: Clash',
        intro:
          'Choisis ton combattant, maîtrise son aura et impose-toi avant la fin du chronomètre.',
        player: 'Ton combattant',
        opponent: 'Adversaire',
        launch: 'Entrer dans l’arène',
        ready: 'PRÊT ?',
        fight: 'COMBATTRE',
        victory: 'VICTOIRE',
        defeat: 'DÉFAITE',
        draw: 'ÉGALITÉ',
        rematch: 'Revanche',
        roster: 'Changer de combattants',
        controls: 'Commandes',
        movement: 'ZQSD / WASD : déplacement · double appui : dash',
        jump: 'Espace : garde · C : Aura',
        attacks:
          'J/K/L : léger/lourd/Hatsu · I : ultime · O : projectile · M : projection',
        aura: 'U : Kaméo · N : Burst · G : On · V : commandes Nen · P : pause',
      }
    : {
        eyebrow: 'NEW MODE · 2D DUEL',
        title: 'Black Whale: Clash',
        intro: 'Choose your fighter, master their aura and prevail before the timer runs out.',
        player: 'Your fighter',
        opponent: 'Opponent',
        launch: 'Enter the arena',
        ready: 'READY?',
        fight: 'FIGHT',
        victory: 'VICTORY',
        defeat: 'DEFEAT',
        draw: 'DRAW',
        rematch: 'Rematch',
        roster: 'Change fighters',
        controls: 'Controls',
        movement: 'WASD / ZQSD: movement · double tap: dash',
        jump: 'Space: Guard · C: Aura',
        attacks:
          'J/K/L: Light/Heavy/Hatsu · I: Finisher · O: Projectile · M: Throw',
        aura: 'U: Kameo · N: Burst · G: On · V: Nen controls · P: Pause',
      }
}
