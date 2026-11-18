<script lang="ts">
  import { link } from '$lib/i18n'
  import { FIGHTING_ROSTER } from '$lib/fighting/roster'
  import { FIGHT_STAGES } from '$lib/fighting/stages'
  import type { FightMode, FighterId } from '$lib/fighting/types'
  import FightPortrait from './FightPortrait.svelte'
  export let language: 'fr' | 'en'
  export let player: FighterId
  export let opponent: FighterId
  export let onMode: (mode: FightMode) => void
  $: fr = language === 'fr'
  $: modes = [
    {
      id: 'versus-ai' as const,
      number: '01',
      name: fr ? 'Contre l’IA' : 'Versus AI',
      tag: fr ? 'SOLO' : 'SOLO',
      description: fr
        ? 'Choisis ton rival. Fais parler ton Nen.'
        : 'Choose your rival. Let your Nen do the talking.',
    },
    {
      id: 'versus-local' as const,
      number: '02',
      name: fr ? 'Versus local' : 'Local versus',
      tag: fr ? '2 JOUEURS' : '2 PLAYERS',
      description: fr
        ? 'Un écran. Deux combattants. Aucun détour.'
        : 'One screen. Two fighters. Settle the score.',
    },
    {
      id: 'training' as const,
      number: '03',
      name: fr ? 'Entraînement' : 'Training',
      tag: fr ? 'LIBRE' : 'FREE PLAY',
      description: fr
        ? 'Travaille tes combos et maîtrise tes techniques.'
        : 'Practice your combos. Master your techniques.',
    },
  ]
</script>

<section class="clash-menu">
  <div class="clash-menu-hero">
    <div class="clash-menu-copy">
      <p class="clash-kicker">FIGHTING GROUND / BLACK WHALE</p>
      <h1>{fr ? 'À TOI' : 'MAKE IT'}<br /><span>{fr ? 'DE JOUER.' : 'YOUR FIGHT.'}</span></h1>
      <p class="hero-description">
        {fr ? 'Choisis ton camp. Trouve ton style.' : 'Choose your side. Find your style.'}<br />{fr
          ? 'Le prochain duel commence ici.'
          : 'Your next duel starts here.'}
      </p>
      <div class="menu-stats">
        <span><b>{FIGHTING_ROSTER.length}</b> {fr ? 'combattants' : 'fighters'}</span><i></i><span
          ><b>{FIGHT_STAGES.length}</b> {fr ? 'terrains' : 'stages'}</span
        ><i></i><span>{fr ? 'Clavier & manette' : 'Keyboard & controller'}</span>
      </div>
    </div>
    <div class="clash-menu-art" aria-hidden="true">
      <span class="art-word">CLASH</span><span class="art-slash"></span>
      <div class="menu-fighter menu-fighter--one"><FightPortrait id={player} /></div>
      <div class="menu-fighter menu-fighter--two"><FightPortrait id={opponent} reverse /></div>
      <span class="art-versus"></span>
      <span class="art-caption">AURA MEETS INSTINCT.</span>
    </div>
  </div>

  <div class="mode-heading">
    <h2>{fr ? 'CHOISIS TON MODE' : 'CHOOSE YOUR MODE'}</h2>
    <span>SELECT / 01—03</span>
  </div>
  <div class="clash-mode-cards">
    {#each modes as mode, index (mode.id)}
      <button
        type="button"
        class="clash-mode-card"
        class:featured={index === 0}
        aria-label={mode.name}
        onclick={() => onMode(mode.id)}
      >
        <span class="mode-meta"><span>{mode.number} /</span><span>{mode.tag}</span></span>
        <strong>{mode.name}</strong><span class="mode-description">{mode.description}</span>
        <span class="mode-action">{fr ? 'Jouer' : 'Play'}<span aria-hidden="true">↗</span></span>
      </button>
    {/each}
  </div>
  <div class="clash-menu-links">
    <a href={$link('/fighting/profile')}><span aria-hidden="true">◇</span><span><strong>{fr ? 'Profil et saisons' : 'Profile and seasons'}</strong><small>{fr ? 'Historique, maîtrise et tournois' : 'History, mastery and tournaments'}</small></span><span aria-hidden="true">→</span></a>
    <a href={$link('/fighting/academy')}
      ><span class="menu-link-icon" aria-hidden="true">⌁</span><span
        ><strong>{fr ? 'Académie du Nen' : 'Nen Academy'}</strong><small
          >{fr ? 'Leçons, combos et défis Arcade' : 'Lessons, combos and Arcade challenges'}</small
        ></span
      ><span aria-hidden="true">→</span></a
    >
    <a href={$link('/fighting/pvp')}
      ><span class="menu-link-icon" aria-hidden="true">↔</span><span
        ><strong>{fr ? 'Duel privé en ligne' : 'Private online duel'}</strong><small
          >{fr ? 'Invite un ami dans ton salon' : 'Invite a friend to your room'}</small
        ></span
      ><span aria-hidden="true">→</span></a
    >
    <a href={$link('/fighting/replays')}
      ><span class="menu-link-icon" aria-hidden="true">▷</span><span
        ><strong>{fr ? 'Salle des replays' : 'Replay room'}</strong><small
          >{fr ? 'Revois tes derniers combats' : 'Revisit your latest fights'}</small
        ></span
      ><span aria-hidden="true">→</span></a
    >
  </div>
</section>

<style>
  .clash-menu {
    padding-bottom: 1.5rem;
  }
  .clash-menu-hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    min-height: 350px;
    align-items: center;
    overflow: hidden;
  }
  .clash-menu-copy {
    position: relative;
    z-index: 2;
    padding: 2rem 0;
  }
  h1 {
    margin: 1.25rem 0;
    color: #f6f0e8;
    font:
      italic 900 clamp(3rem, 6.3vw, 6.8rem)/0.95 Arial,
      sans-serif;
    letter-spacing: -0.065em;
  }
  h1 span {
    color: var(--clash-orange);
  }
  .hero-description {
    color: #b2a9bc;
    font-size: 0.9rem;
    line-height: 1.65;
  }
  .menu-stats {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
    margin-top: 1.6rem;
    color: #a59aac;
    font: 0.62rem var(--font-mono);
  }
  .menu-stats b {
    color: #f1e8f8;
  }
  .menu-stats i {
    height: 12px;
    width: 1px;
    background: #554457;
  }
  .clash-menu-art {
    position: relative;
    height: 350px;
    align-self: end;
    isolation: isolate;
  }
  .art-word {
    position: absolute;
    top: 80px;
    right: -8%;
    font:
      italic 900 9vw/0.8 Arial,
      sans-serif;
    letter-spacing: -0.09em;
    color: transparent;
    -webkit-text-stroke: 1px #72557e52;
    transform: rotate(-12deg);
  }
  .art-slash {
    position: absolute;
    inset: 20% 10% 10%;
    z-index: -1;
    transform: skew(-27deg) rotate(-12deg);
    background: linear-gradient(120deg, #ed692c35, #9c4bea45 60%, #3b1e4e);
    border: 1px solid #a5647845;
  }
  .menu-fighter {
    position: absolute;
    width: 55%;
    height: 100%;
    bottom: 0;
  }
  .menu-fighter--one {
    left: 0;
    z-index: 2;
    transform: rotate(-6deg);
  }
  .menu-fighter--two {
    right: 0;
    transform: rotate(6deg);
  }
  .art-versus {
    position: absolute;
    left: 43%;
    top: 45%;
    z-index: 3;
    font:
      italic 900 clamp(2.5rem, 5vw, 5rem)/1 Arial,
      sans-serif;
    color: #f8ece5;
    text-shadow: 4px 4px #ef704b;
    transform: rotate(-10deg);
  }
  .art-versus::before {
    content: 'VS';
  }
  .art-caption {
    position: absolute;
    right: 2%;
    bottom: 14px;
    color: #b695ce;
    font: 0.55rem var(--font-mono);
    letter-spacing: 0.25em;
  }
  .mode-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 0;
    border-bottom: 1px solid #fff2;
    margin-bottom: 1rem;
  }
  .mode-heading h2 {
    margin: 0;
    font: 600 0.7rem var(--font-mono);
    letter-spacing: 0.12em;
  }
  .mode-heading > span {
    color: #8d8199;
    font: 0.55rem var(--font-mono);
  }
  .clash-mode-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  .clash-mode-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 210px;
    padding: 1.4rem;
    overflow: hidden;
    border: 1px solid #514158;
    background: linear-gradient(130deg, #2c203332, #17121e);
    color: #f9f3ef;
    text-align: left;
    cursor: pointer;
    transition:
      transform 150ms,
      border-color 150ms;
  }
  .clash-mode-card::after {
    position: absolute;
    right: -15px;
    top: 28px;
    width: 90px;
    height: 160px;
    content: '';
    transform: rotate(30deg);
    border: 18px solid #a97eea08;
    pointer-events: none;
  }
  .clash-mode-card.featured {
    border-color: #fc844b;
    background: linear-gradient(120deg, #582d20, #241519);
  }
  .clash-mode-card:hover {
    transform: translateY(-4px);
    border-color: #b79aff;
  }
  .clash-mode-card.featured:hover {
    border-color: #ffb38c;
  }
  .mode-meta {
    display: flex;
    justify-content: space-between;
    color: #ac98ba;
    font: 0.58rem var(--font-mono);
    letter-spacing: 0.1em;
  }
  .featured .mode-meta {
    color: #ffb58c;
  }
  .clash-mode-card strong {
    margin: 1.3rem 0 0.6rem;
    font:
      italic 900 clamp(1.3rem, 2.4vw, 2.1rem)/1.1 Arial,
      sans-serif;
    letter-spacing: -0.04em;
    text-transform: uppercase;
  }
  .mode-description {
    max-width: 25rem;
    color: #b8a9c2;
    font-size: 0.75rem;
    line-height: 1.5;
  }
  .featured .mode-description {
    color: #d6b4a6;
  }
  .mode-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: 1.3rem;
    color: #c9a9f4;
    font: 600 0.65rem var(--font-mono);
  }
  .featured .mode-action {
    color: #ff9b67;
  }
  .mode-action > span {
    font-size: 1.3rem;
  }
  .clash-menu-links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 1rem 0 0.5rem;
  }
  .clash-menu-links a {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-height: 75px;
    padding: 0.75rem 0;
    color: #bfaed0;
    text-decoration: none;
    border-bottom: 1px solid #ffffff16;
  }
  .clash-menu-links a:hover {
    color: #ffb38c;
  }
  .menu-link-icon {
    display: grid;
    place-items: center;
    width: 37px;
    height: 37px;
    border: 1px solid #675078;
    font:
      1.3rem Arial,
      sans-serif;
    flex: 0 0 auto;
  }
  .clash-menu-links strong {
    display: block;
    color: #ede3f4;
    font-size: 0.75rem;
  }
  .clash-menu-links small {
    display: block;
    color: #9d8eaa;
    font-size: 0.65rem;
    margin-top: 0.35rem;
  }
  .clash-menu-links a > span:last-child {
    margin-left: auto;
  }
  @media (max-width: 850px) {
    .clash-menu-hero {
      min-height: 310px;
    }
    .clash-menu-art {
      height: 300px;
    }
    .clash-mode-card {
      padding: 1rem;
    }
    .clash-menu-links {
      gap: 0.7rem;
    }
    .menu-link-icon {
      display: none;
    }
  }
  @media (max-width: 600px) {
    .clash-menu-hero {
      grid-template-columns: 1fr;
      position: relative;
      min-height: 300px;
    }
    .clash-menu-copy {
      padding: 2rem 0;
    }
    .clash-menu-art {
      position: absolute;
      right: -18%;
      width: 72%;
      height: 260px;
      opacity: 0.35;
    }
    h1 {
      font-size: 3.2rem;
    }
    .hero-description {
      font-size: 0.8rem;
    }
    .menu-stats {
      font-size: 0.55rem;
      gap: 0.5rem;
    }
    .clash-mode-cards {
      grid-template-columns: 1fr;
      gap: 0.7rem;
    }
    .clash-mode-card {
      min-height: 0;
      padding: 1.1rem;
    }
    .clash-mode-card strong {
      margin-top: 0.8rem;
      font-size: 1.7rem;
    }
    .mode-action {
      position: absolute;
      right: 1rem;
      top: 2.7rem;
      padding: 0;
      font-size: 0;
    }
    .clash-menu-links {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .menu-link-icon {
      display: grid;
    }
    .clash-menu-links a {
      min-height: 65px;
    }
  }
</style>
