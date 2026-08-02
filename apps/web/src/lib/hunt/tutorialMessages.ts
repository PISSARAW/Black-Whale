import type { TutorialStep } from './tutorial'

type Lesson = Exclude<TutorialStep, 'done'>
export interface TutorialMessages {
  title: string
  dismiss: string
  step: Record<Lesson, { title: string; body: string }>
}

const en: TutorialMessages = {
  title: 'Initiation under pressure',
  dismiss: 'Hide initiation',
  step: {
    move: {
      title: 'Listen while moving',
      body: 'Cross the first room. Your footsteps are information for him too.',
    },
    zetsu: {
      title: 'Silence your aura',
      body: 'Enter Zetsu with X. You become harder to read, but Nen no longer warns you.',
    },
    en: {
      title: 'Buy information',
      body: 'Raise Ten again, then sweep with En. The sweep informs you and gives you away.',
    },
    hatsu: {
      title: 'Prepare your advantage',
      body: 'Use the chosen Hatsu. Its condition matters more than its power.',
    },
    contact: { title: 'Engineer contact', body: 'Now draw the hunter into a situation you chose.' },
  },
}

const fr: TutorialMessages = {
  title: 'Initiation en situation',
  dismiss: 'Masquer l’initiation',
  step: {
    move: {
      title: 'Écoutez en marchant',
      body: 'Traversez la première pièce. Vos pas sont aussi une information pour lui.',
    },
    zetsu: {
      title: 'Faites taire votre aura',
      body: 'Passez en Zetsu avec X. Vous devenez plus difficile à lire, mais le Nen ne vous avertit plus.',
    },
    en: {
      title: 'Achetez une information',
      body: 'Reprenez Ten, puis balayez avec En. Le balayage vous renseigne et vous dénonce.',
    },
    hatsu: {
      title: 'Préparez votre avantage',
      body: 'Employez le Hatsu choisi. Sa condition compte davantage que sa puissance.',
    },
    contact: {
      title: 'Fabriquez le contact',
      body: 'Attirez maintenant le chasseur vers une situation que vous avez choisie.',
    },
  },
}

export const tutorialMessages = (locale: 'en' | 'fr'): TutorialMessages =>
  locale === 'fr' ? fr : en
