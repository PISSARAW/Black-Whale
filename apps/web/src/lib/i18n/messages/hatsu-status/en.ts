/**
 * What each Hatsu says while it is running: the status line under the readout and
 * the titles of the panels a technique opens.
 *
 * One namespace per interaction kind, matching `HATSU_INTERACTION_BY_KIND`, so a
 * handler and its copy are found under the same name. Every entry here was lifted
 * from the handler that used to hold the string inline.
 */
export const hatsuStatusEn = {
  disguise: {
    forged: (a0: string, a1: string) =>
      `${a0}'s real information concealed beneath “${a1}” · its original function remains underneath`,
  },

  scarlet: {
    swept: (a0: string, a1: number, a2: number) =>
      a1
        ? `${a0} at 100% in every category · ${a1} sealed element${a1 > 1 ? 's' : ''} answered · ${a2} hours of a2 spent`
        : `${a0} was already running at full efficiency · ${a2} hours of a2 spent for nothing`,
  },

  'chain-rule': {
    nothingToTake: (a0: string) =>
      `${a0}'s aura is draining out of the syringe, but there was no ability in it to take`,
    drained: (a0: string, a1: string) =>
      `${a0} pulled out of ${a1} · it is held in Zetsu and does not get it back until the chain returns it`,
  },

  'chain-bind': {
    vowViolated: (a0: string) => `Vow violated on ${a0} · Chain Jail rejects non-Spider target`,
    bound: (a0: string) => `${a0} bound in forced Zetsu · all actions sealed`,
  },

  dowsing: {
    probed: (a0: boolean, a1: string, a2: number) =>
      a0 ? `${a1} · pendulum detects a0 or deception (${a2}%)` : `${a1} located · signal ${a2}%`,
  },

  enhance: {
    reinforced: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} at full Ren · there is more aura in it than it can hold and the mantle spills onto everything beside it`
        : `${a1} reinforced · aura output ${a2}/5`,
  },

  control: {
    guarded: (a0: string) =>
      `${a0} is the one being guarded · every link from here is drawn back to it`,
    answered: (a0: string, a1: number) =>
      `${a0} was touched and all ${a1} answered at once · that is the whole of the network`,
    network: (a0: string, a1: number) =>
      `${a1} guard${a1 > 1 ? 's' : ''} around ${a0} · they pool what little they each have`,
  },

  growth: {
    grown: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} Nen growth ${a2}/10 · progress is slow on an untrained person`
        : `${a1} germinated to growth stage ${a2}/10`,
  },

  vehicle: {
    launched: (a0: number, a1: number) =>
      `Vehicle launched · ${a0} passengers burning ${a1}% of their own aura to move the hull`,
    boarding: (a0: number) => `${a0}/5 passengers aboard · click a passenger to depart`,
    alreadyAboard: (a0: string) =>
      `${a0} is already aboard · the vehicle needs a second passenger before it departs`,
    full: (a0: string) => `${a0} refused · the transformed hull is full at 5 passengers`,
  },

  scout: {
    conjured: (a0: string) =>
      `${a0} is made of aura · Little Eye cannot take hold of a conjured creature`,
    tooBig: (a0: number, a1: string) =>
      `${a1} is ${a0}× bigger than a hamster · the ball has nothing it can hold`,
    taken: (a0: number) =>
      `A host of ${a0}px² taken · what it sees and hears comes back, and it keeps seeing aura while it lasts`,
  },

  tribunal: {
    blue: (a0: string) => `BLUE · ${a0} is admitted and answers to the court from now on`,
    yellow: (a0: string) =>
      `YELLOW · ${a0} is under the court's control and did as it was told · flip the card if it stops`,
    yellowReversed: (a0: string) =>
      `YELLOW REVERSED · ${a0} is boxed in and can still speak · the box does not hold long`,
    released: (a0: string) =>
      `${a0} is out of the box · the court can restrain it as many times as it needs to`,
    red: (a0: string) => `RED · ${a0} is dismissed and no longer answers to this court`,
  },

  curse: {
    victim: (a0: string) =>
      `${a0} was named the victim · a sacrifice among its own was chosen at the same moment and marked where nothing shows`,
    searched: (a0: boolean, a1: string) =>
      a0
        ? `Gyo a0 the birthmark somewhere inside ${a1} · touch the sacrifice itself to spend it`
        : `Gyo a0 nothing on ${a1} · whoever cast this masked their own aura in it`,
    spent: (a0: string) =>
      `The sacrifice died · the curse crossed the whole page and took ${a0}, and nothing on it says who cast it`,
  },

  blast: {
    fired: (a0: number, a1: string) =>
      a0
        ? `The palm blast broke ${a0} guard${a0 > 1 ? 's' : ''} off ${a1} from across the page, without touching it`
        : `${a1} had no guard up · the blast went straight through and did nothing`,
  },

  surveillance: {
    recorded: (a0: boolean, a1: boolean, a2: string) =>
      a0
        ? `${a2} · owl recorded impending death`
        : a1
          ? `${a2} · owl recorded a location change`
          : `${a2} · live feed stable, earlier footage retained`,
  },

  future: {
    predicted: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} added to the immutable ten-second prediction · choose a different real action`
        : `Prediction ended · ${a2} actions remain as afterimages`,
  },

  resurrection: {
    killed: (a0: string) => `${a0} killed Camilla · post-mortem counterattack materializing`,
    absorbed: (a0: string) => `${a0}'s life force absorbed · Camilla fully resurrected`,
  },

  poetry: {
    line: (a0: number) => `Line ${a0}/3 written · the words chosen are what decides the effect`,
    light: (a0: string, a1: string, a2: number, a3: boolean) =>
      `“${a1}” · the word for light purified ${a0} and lifted ${a2} thing${a2 === 1 ? '' : 's'} off it${a3 ? ', and the season carried it further' : ''}`,
    fire: (a0: string, a1: string, a2: boolean) =>
      `“${a0}” · whatever the fist strikes burns, and ${a1} was what it struck${a2 ? ' · the season made it burn through' : ''}`,
    inert: (a0: string) =>
      `“${a0}” · there is no word of invocation anywhere in it · the strip stays a strip of paper`,
  },

  restoration: {
    restored: (a0: string) =>
      `${a0} restored · chapter filters, map depth and event position returned to their rested baseline`,
  },

  transformation: {
    toggled: (a0: boolean, a1: number, a2: number, a3: string) =>
      a0
        ? `${a3} in the harmless form · ${a1} of its ${a2} controls are past what that body can do`
        : `${a3} back to its true form · everything within reach again`,
  },

  rhythm: {
    armed: (a0: number, a1: string) =>
      `${a1} wears the conjured attire and holds the spear · its reach covers ${a0} neighbour${a0 === 1 ? '' : 's'}, and the attire covers it`,
  },

  impact: {
    escaped: (a0: string) => `${a0} got out of earshot before the sphere closed on it`,
    caught: (a0: string) => `Jupiter caught ${a0} and closed`,
    chasing: (a0: string, a1: number) => `Jupiter is still chasing ${a0} · a1 ${a1}/4`,
    conjured: (a0: string) =>
      `Jupiter conjured over ${a0} · the dance is done, so it will not stop now`,
  },

  mimicry: {
    studied: (a0: number, a1: string) =>
      `${a0} seconds spent with ${a1} · that is exactly how long its form will hold`,
    copied: (a0: string, a1: string, a2: number) =>
      `${a1} took ${a0}'s form · ${a2} seconds of it, whatever the difference in size`,
    expired: (a0: string, a1: string) =>
      `The time bought with ${a0} ran out and ${a1} is itself again`,
  },

  theft: {
    needsControl: () => 'Skill Hunter requires an exposed button or link',
    sealed: (a0: string) => `${a0} sealed in Skill Hunter`,
  },

  bookmark: {
    alreadyHeld: (a0: string) => `${a0} is already the held page · the other hand holds the book`,
    twoOnly: (a0: string) => `Two open pages is the whole of it · ${a0} would need a third hand`,
    pinned: (a0: boolean, a1: string, a2: string) =>
      a0
        ? `${a2} held open by the bookmark · the book is free to open somewhere else`
        : `Both pages are open at once · ${a1} and ${a2} can be used together`,
  },

  devour: {
    notSealed: (a0: string) =>
      `${a0} is not a sealed room · the fish suffocates among all those open doors`,
    eaten: (a0: string) =>
      `${a0} has been eaten through · it still stands, still answers, and still does not know`,
    biting: (a0: string, a1: number) =>
      `${a0} being eaten · bite ${a1}/4 · no pain, no blood, no mark on it`,
  },

  pocket: {
    wrapped: (a0: boolean, a1: string) =>
      a0
        ? `${a1} a0 up · it fits in a palm now, and nothing about it is damaged`
        : `${a1} let back out of the cloth at its original size`,
  },

  teleport: {
    nowhere: (a0: string) =>
      `${a0} stayed where it was · there is nowhere else on this page to put it`,
    moved: (a0: string, a1: string) =>
      `${a1} is no longer where it stood · it is beside ${a0}, and it was not asked`,
  },

  polarity: {
    marked: (a0: boolean, a1: string) =>
      a0
        ? `Sun and plus pressed onto ${a1} · touch it again to hold the contact, or place the Moon`
        : `Moon and minus pressed onto ${a1} · the pair is placed but nothing has touched yet`,
    charging: (a0: number, a1: string) =>
      `Contact held on ${a1} for ${a0} second${a0 > 1 ? 's' : ''} · ${a0 >= 4 ? 'fully a0d' : 'three to five is full power'}`,
    closing: (a0: number) =>
      `${a0}px between the two marks · they were carried together and have still not met`,
    detonated: (a0: boolean, a1: number, a2: number) =>
      a0
        ? `Fully a2d marks met · ${a1} bodies went up, not just the two bearing them`
        : `The marks touched at a2 ${a2} · only the two bearers went up`,
  },

  command: {
    noHead: (a0: string) => `${a0} has no head · there is nothing on it to stamp`,
    alive: (a0: string) =>
      `${a0} is not an object · the stamp refuses it, though a Nen copy of it would do`,
    stamped: (a0: number, a1: number, a2: string) =>
      `人 on ${a2}'s head · ${a0} puppet${a1 ? 's' : ''} · take a head off and that one stops`,
    order: (a0: string, a1: number) =>
      `“Go to ${a0}” · simple enough for all ${a1} of them to follow it`,
  },

  'identity-swap': {
    leftHand: (a0: string) =>
      `Left hand on ${a0} · its likeness is taken, its destination is not · now choose who wears it`,
    ownFace: (a0: string) => `${a0} cannot wear its own face · touch a second identity`,
    swapped: (a0: string, a1: string) =>
      `${a0} and ${a1} are wearing each other's faces · both still lead exactly where they always led`,
  },

  divination: {
    sameArea: () =>
      'The dial will not take another call from this area · move somewhere else first',
    noCalls: () => 'No calls left today · the handset has its allowance and that was it',
    guideTitle: (a0: number) => `Love Dial 6700 · call ${a0}/6`,
    reading: (a0: string, a1: string, a2: number) =>
      `Dialled ${a0} · the ideal partner is ${a1} (${a2}%) · that is all the handset will say`,
  },

  prophecy: {
    ownFuture: () => 'Lovely Ghostwriter cannot write the fortune of whoever is holding the pen',
    incomplete: (a0: string, a1: string) =>
      `${a0} did not write down ${a1} · the quill will not move on an incomplete slip`,
    consulting: (a0: string) =>
      `The quill is still moving over ${a0}'s slip · the trance has not broken yet`,
    guideTitle: () => 'Lovely Ghostwriter · foretold paths',
    written: (a0: string, a1: number) =>
      `Four quatrains written for ${a0} in a trance · the first one is the past, the ${a1} routes after it are not`,
  },

  clone: {
    copyOfCopy: () => 'A copy has nothing left to copy · touch an original object',
    noBody: (a0: string) => `${a0} has no visible body to copy`,
    copied: (a0: boolean, a1: string) =>
      a0
        ? `${a1} copied · what came out of the right hand is a body, and it does none of what the original does`
        : `${a1} copied · the replica lies beside the original with none of its function`,
    expired: (a0: string) => `The copy of ${a0} reached its twenty-four hours and went`,
  },

  puppet: {
    needsControl: () => 'Black Voice needs a button or link for its antenna',
    bothPlanted: () =>
      'Both antennae are out · one of them answers the phone and the other is for you to look at',
    planted: (a0: string) =>
      `${a0} has an antenna in it · plant the second before giving any order`,
    ordered: (a0: string, a1: string | null) =>
      `The order went into ${a0}${a1 ? `, not into ${a1}` : ''}`,
  },

  barrage: {
    fired: (a0: number, a1: string, a2: number) =>
      `${a0} bullets across ${a1} and what stood beside it${a2 ? ` · ${a2} Nen construct${a2 > 1 ? 's' : ''} torn straight through` : ''}`,
  },

  projection: {
    recalled: (a0: string) => `${a0} was touched · the double is gone and he is back inside it`,
    passedThrough: (a0: string) =>
      `The double passed straight through ${a0} without opening anything on the way`,
    left: (a0: string) =>
      `The double left ${a0} behind · the body does nothing while he is out, and touching it ends this`,
  },

  animate: {
    noAura: (a0: string, a1: boolean) =>
      `${a0} refused · there is no aura left today for ${a1 ? 'a third a1 body' : 'an eleventh small one'}`,
    touched: (a0: string) => `${a0} touched · the change takes a few seconds to come through`,
    alive: (a0: string, a1: boolean) =>
      `${a0} is alive and still doing its job · ${a1 ? 'a a1 body, so' : 'small, so'} its aura will not last long`,
    spent: (a0: string) => `${a0} used up its aura and is an object again`,
  },

  needle: {
    crippled: (a0: string) => `${a0} already survived an order · it is crippled and takes no more`,
    inserted: (a0: string) =>
      `A needle into ${a0} and one order given · there is nothing left in it that could stop`,
    straining: (a0: string, a1: number) =>
      `${a0} is still carrying out its order · ${a1}/3 before the body gives`,
    burntOut: (a0: string) =>
      `${a0} carried the order out and burnt itself doing it · crippled from here on`,
  },

  'paper-spy': {
    reported: (a0: string, a1: number) => `${a0} · ${a1} changes reported by paper doll`,
    deployed: (a0: string) => `Paper doll deployed inside ${a0}`,
  },

  shred: {
    stuck: (a0: string, a1: number, a2: number) =>
      `One piece stuck in ${a0} at ${a1}%, ${a2}% · every stream from here finds it again`,
    tracking: (a0: string, a1: boolean, a2: number, a3: string) =>
      `The stream came back into the same wound in ${a0} · pass ${a2}${a1 ? '' : ` · you aimed at ${a3} and it went there anyway`}`,
  },

  'remote-strike': {
    alone: (a0: string) =>
      `${a0} is alone on its surface · the aura has nowhere along it to travel`,
    emerged: (a0: string, a1: string, a2: string, a3: number) =>
      `Struck at ${a2}, ran along ${a0}, and came up under ${a1} · ${a3} fist${a3 > 1 ? 's' : ''} out of this surface`,
  },

  spatial: {
    burnt: (a0: string) => `${a0} was unsealed once · the passage will never open there again`,
    tooManyDoors: (a0: string, a1: number) =>
      `${a0} has ${a1} ways out · that is not a sealed room, and now it is a burnt one`,
    carried: (a0: string) =>
      `${a0} carried through the sealed room into the space behind it · it comes back out anywhere, as long as this room stays shut`,
  },

  stitch: {
    threadOut: (a0: string) =>
      `Thread out of ${a0} · the closer the second edge, the stronger the seam`,
    reattached: (a0: number, a1: string) =>
      a0
        ? `${a0} severed part${a0 > 1 ? 's' : ''} sewn back onto ${a1}, moving again straight away`
        : `${a1} has nothing torn off it to sew back`,
    strong: (a0: string, a1: number, a2: string) =>
      `${a1}px of thread · short enough to hold ${a0} and ${a2} together as one body`,
    slack: (a0: number) =>
      `${a0}px of thread · at that a0 it is cotton, and the seam does not hold`,
  },

  melody: {
    playing: (a0: number) =>
      `Note ${a0} of the piece · so far it is only calming whoever can hear it`,
    landed: (a0: number, a1: string) =>
      `The piece landed · ${a0} section${a0 === 1 ? '' : 's'} are oblivious to everything but ${a1} for the next three minutes`,
    ended: () => 'The piece ended · they notice the room again',
  },

  infection: {
    holdingKnife: (a0: string, a1: string | number) =>
      `${a0} is the one holding the knife now · level ${a1}`,
    kissed: (a0: string) =>
      `${a0} kissed into the group · level 0, and it stays there until it kills something`,
    killed: (a0: string, a1: string, a2: number, a3: number, a4: string) =>
      `${a0} killed ${a1} for ${a2} · a3 ${a3}${a4}`,
  },

  windup: {
    winding: (a0: number) =>
      `Rotation ${a0} · ×${a0} in the fist · hit something else to let it go`,
    tooFew: (a0: number, a1: string) =>
      `×${a0} into ${a1} and it is still standing · not enough rotations, and now the arm is empty`,
    landed: (a0: boolean, a1: number, a2: string, a3: number) =>
      a0
        ? `×${a1} was far more than ${a2} needed · ${a3} bystander${a3 === 1 ? '' : 's'} went with it`
        : `×${a1} · ${a2} destroyed, and nothing else was`,
  },

  predator: {
    nothingToRead: (a0: string) =>
      `${a0} has no ability to read · there is nothing for a Predator to grow against`,
    tooMany: (a0: number, a1: string) =>
      `${a1} carries ${a0} abilities · Predator is at a disadvantage there and will not form`,
    working: (a0: string, a1: number) =>
      `Working ${a0} out alone · ${a1}/3 · being told the answer would only make it weaker`,
    countered: (a0: string, a1: number) =>
      `Predator swallowed ${a0} wherever it was carried (${a1}) · and now there is no Nen at all for forty-eight hours`,
  },

  staff: {
    reached: (a0: number, a1: number, a2: string) =>
      `The staff is out to ${a1} · from ${a2} it a1ed ${a0} bod${a0 === 1 ? 'y' : 'ies'} on either side`,
  },

  senses: {
    stage: (a0: number) =>
      [
        'All senses restored',
        'Sight sealed',
        'Sight + hearing sealed',
        'Sight + hearing + speech sealed',
      ][a0],
  },

  vacuum: {
    alive: (a0: number, a1: string) =>
      a0
        ? `${a1} is alive, so it is not swallowed · ${a0} foreign substance${a0 > 1 ? 's were' : ' was'} drawn out of it instead`
        : `${a1} refused · Blinky considers the target alive`,
    nenTrap: (a0: string) =>
      `${a0} will not go in · it is made of Nen, and that is how you know it is a trap`,
    swallowed: (a0: string, a1: number) =>
      `“${a0}” named aloud and swallowed · ${a1} in the tank, and only the last one ever comes back`,
  },

  snakes: {
    outOfRange: (a0: string) =>
      `${a0} is outside the ten · the snakes only go to someone already in range`,
    building: (a0: number) =>
      `${a0}/10 in range · the user is one of them and cannot be picked out`,
    alreadySuspect: (a0: string, a1: number) =>
      `${a0} is already one of the suspects · the field is only at ${a1}/10`,
    spent: () => 'One of the ten has already been drained · the marionette only ever points once',
    drained: (a0: string) =>
      `Four snakes on ${a0} · eleven seconds and it is empty · the curse is spent and has nothing to rebound onto`,
  },

  'training-shot': {
    sealed: () =>
      `Maintain perfect focus for 3 seconds · the trainee's site action is sealed in Zetsu`,
    held: (a0: string) =>
      `${a0} maintained Zetsu · controlled shot survived and its action was restored`,
  },

  serpent: {
    released: (a0: string) => `${a0} released · the arm uncoils all at once`,
    coiling: (a0: boolean, a1: boolean, a2: number, a3: string) =>
      a0
        ? `${a3} fully constricted · nothing gets through the a2 now`
        : `Coil ${a2}/3 around ${a3} · ${a1 ? 'its controls are pinned' : 'it can still move'}`,
  },

  flock: {
    dispatched: (a0: number, a1: string) => `Pigeon ${a0} dispatched with ${a1}`,
  },

  relay: {
    staged: (a0: string, a1: boolean, a2: number) =>
      `Cargo ${a0} · relay a2 ${a2}/3${a1 ? ' · delivered into relay storage without teleportation' : ''}`,
  },

  healing: {
    unhurt: (a0: string) => `${a0} carries no wound · the cross finds nothing on it to close`,
    mending: (a0: boolean, a1: string) =>
      a0
        ? `Holy Chain closed ${a1} · it answers again`
        : `Enhancement drawn into ${a1} · the wound is half shut, and one more pass finishes it`,
  },

  'heart-vow': {
    staked: (a0: string) =>
      `The stake is around ${a0}'s heart · touch it again to declare a rule, touch anything else and the rule is broken`,
    twoRules: (a0: string) => `${a0} already carries two rules · one stake will not hold a third`,
    declared: (a0: number, a1: string) =>
      `Rule ${a0}/2 declared onto ${a1} · it stays alive as long as it obeys them`,
    broken: (a0: string, a1: string) =>
      `${a1} was touched instead · the rule was broken and the stake went through ${a0}'s heart`,
  },

  'ability-loan': {
    empty: () =>
      'The dolphin is empty · Steal Chain has to take something before there is anything to loan',
    readOut: (a0: string, a1: string) => `${a0} read out in full: ${a1}`,
    spent: (a0: string, a1: string, a2: boolean) =>
      `${a0} used once by ${a1}${a2 ? ', whose nodes were forced open by using it' : ''} · it has already gone back to its owner`,
  },

  contract: {
    signed: (a0: boolean, a1: string) =>
      a0
        ? `${a1} read the terms and signed · one more voluntary signature and it stands`
        : `Both parties have signed · touch either of them to honour it, touch anyone else and it is a breach`,
    honoured: () =>
      `Terms honoured · both signatories collected the agreed reward, and everything they promised each other is open`,
    breached: (a0: string, a1: string) =>
      `${a1} was never party to this · ${a0} breached, and the penalty is a week of Zetsu`,
    served: (a0: string) => `${a0} served its week and is out of Zetsu`,
  },

  'truth-punch': {
    answered: (a0: boolean, a1: number, a2: string) =>
      a0
        ? `${a2}'s own voice answered, and it kept it short · ask again with another blow`
        : `Blow ${a1} · same question, and ${a2} expanded on what it had already said`,
  },

  'blood-search': {
    guideTitle: () => 'Bloody Mary · drops still wet',
    released: (a0: string) =>
      `A drop released into ${a0} · it goes looking by itself and reports back as it finds things`,
    found: (a0: string, a1: number) => `Drop ${a1} found ${a0}`,
    dried: (a0: number) =>
      `Drop ${a0} dried out · about forty minutes was all its aura had, and what it found went with it`,
  },

  'legal-defense': {
    declared: (a0: string) =>
      `${a0} declared the hideout · LSDF answers nowhere else, and only while Morena is here`,
    outside: (a0: string) =>
      `${a0} is outside the hideout · Yokotani has no standing there and nothing happens`,
    guarded: (a0: number, a1: string) =>
      `A a0 ${a0} guard is standing on ${a1} · it cannot act, and nothing can reach it either`,
  },

  'damage-transfer': {
    resting: (a0: string) =>
      `Left hand resting on ${a0} · every blow taken from now on arrives here instead`,
    noSink: (a0: string) =>
      `The left hand was struck with nothing to pass it on to · ${a0} took all of it itself`,
    transferred: (a0: string, a1: boolean, a2: string, a3: number) =>
      `${a2} was struck and did not feel it · blow ${a3} landed on ${a0}${a1 ? ', which has taken all it can' : ''}`,
  },

  'door-network': {
    nenConstruct: (a0: string) =>
      `${a0} is a Nen construct · it walks through Voconte's frame without being moved at all`,
    trapArmed: (a0: string) =>
      `${a0} armed as the trapped frame · whoever steps into it comes out in the hideout`,
    returnArmed: (a0: string) =>
      `${a0} is the return frame · the pair only works one way through each of them`,
    notADoor: (a0: string) =>
      `${a0} is not a doorframe · walking past one of them does nothing at all`,
    crossed: (a0: string, a1: string) => `${a1} was stepped into and came out at ${a0}`,
  },

  'weapon-body': {
    hammer: (a0: string) => `Hammer · ${a0} flattened where it stood`,
    drill: (a0: unknown, a1: string) =>
      a0
        ? `Drill · ${a1} bored through, and what it was keeping a0 is open`
        : `Drill · there was nothing a0 inside ${a1} to get at`,
    axe: (a0: boolean, a1: string, a2: string) =>
      a0 ? `Axe · ${a1} taken off ${a2}` : `Axe · ${a2} has nothing left on it to cut off`,
  },

  'coercive-beast': {
    obeyed: (a0: string) => `${a0} did it without being asked`,
    taken: (a0: string) =>
      `${a0} satisfied it three times and is completely the Beast's · nobody is going to say what it satisfied`,
    probed: (a0: boolean, a1: string, a2: number) =>
      a0
        ? `${a1} satisfies the condition · ${a2}/3`
        : `${a1} does not satisfy the condition, and that is all anyone will tell you`,
  },

  'coin-growth': {
    awakened: (a0: string) =>
      `${a0} has held the same coin long enough to be awakened by it · what was dormant in it is open`,
    kept: (a0: string, a1: number) =>
      `${a0} kept the coin another ten days · a1 ${a1}, and it keeps climbing while nobody moves it`,
    transferred: (a0: unknown, a1: string, a2: string) =>
      a0
        ? `The coin was given to ${a2} · its back changed, its value fell to 1, and ${a1} kept none of it`
        : `A coin minted into ${a2} at value 1`,
  },

  'lie-marks': {
    truthful: (a0: string) =>
      `${a0} answered straight · the beast brought its face back without marking it`,
    marked: (a0: number, a1: string) =>
      [
        `A cut opened on ${a1} for the first lie`,
        `The cut on ${a1} went septic for the second · it was warned aloud not to try a third`,
        `Third lie · nobody knows what ${a1} is now, only that it is not what it was`,
      ][a0],
  },

  'drug-synthesis': {
    partner: (a0: string) =>
      `${a0} entered the contract · the beast does not appear at all without a second party`,
    selfPartner: (a0: string) => `${a0} cannot collaborate with itself`,
    guideTitle: () => 'Tubeppa synthesis · route compound',
    routes: (a0: string, a1: string) =>
      `Both partners brought routes · what came out of the beast is a shortcut between ${a0} and ${a1}`,
    material: () =>
      `Both partners brought material · the compound opened what each of them was holding back`,
    inert: (a0: string, a1: string) =>
      `${a0} and ${a1} have nothing in common to work with · the batch is inert`,
  },

  'aura-levy': {
    taboo: (a0: string) =>
      `${a0} came back for a second helping · that is the doctrine's one taboo, and the punishment for it is not gentle`,
    guideTitle: () => 'Tyson · happiness in return',
    read: (a0: string, a1: number, a2: number) =>
      `${a0} a1 ${a1} characters of the Book · ${a2}% a2 back, and one control taken as the levy`,
  },

  'desire-trap': {
    bait: (a0: string) =>
      `The centipede read ${a0} and put out what it wants as bait · taking the bait is what springs this`,
    sprung: (a0: string) =>
      `The bait was taken · the coercion only started then, and it carried the site to ${a0}`,
  },

  'diffusive-smoke': {
    released: (a0: number) =>
      `Smoke out · ${a0} within seven metres are breathing it, and each of them will be emitting inside two`,
  },

  solicitation: {
    alreadyHeld: (a0: string) =>
      `${a0} is already being held · one body at a time is all she can carry`,
    asked: (a0: string) =>
      `“${a0}, are you free?” · touch it again for yes, or touch anything else to refuse for it`,
    saidYes: (a0: number, a1: string) =>
      `${a1} said yes · the spider is in its ear and the body is not its own · ${a0} others are still being asked`,
    exhausted: (a0: string) =>
      `${a0} had no aura left to feed it · the spider left at speed and it has itself back`,
  },

  'room-isolation': {
    realRoom: (a0: string) =>
      `${a0} is the real room · it stays exactly as it is, and everyone else gets sent somewhere that is not it`,
    inside: (a0: string) =>
      `${a0} is inside · the barrier only faces outward, so leaving is nothing`,
    emptyCopy: (a0: string, a1: number) =>
      `${a0} went for the room and walked into an empty copy of it · ${a1} things that should be there are not`,
  },

  'pain-armour': {
    packed: (a0: string, a1: number, a2: number) =>
      a1
        ? `${a0} taken and wrapped · ${a1} control${a1 > 1 ? 's' : ''} sealed inside it · ${a2} hit${a2 > 1 ? 's' : ''} packed and none given back`
        : `${a0} taken and wrapped · nothing of it worked anyway · ${a2} hit${a2 > 1 ? 's' : ''} packed`,
    alreadyPacked: (a0: string) =>
      `${a0} is already in the wrapping · the same damage is not taken twice`,
  },

  'sun-flare': {
    risen: (a0: string, a1: number, a2: number, a3: number) =>
      `The sphere rose on ${a0} · ${a1} packed hit${a1 > 1 ? 's' : ''} spent, ${a2} thing${a2 === 1 ? '' : 's'} caught in the radius and ${a3} of them opened`,
    nothingPacked: (a0: string) =>
      `Nothing was packed, so there is nothing to spend on ${a0} · take the damage first`,
  },

  'postmortem-curse': {
    target: (a0: string) =>
      `${a0} is the target · now find something of theirs to keep, and to burn`,
    notConnected: (a0: string, a1: string) =>
      `${a1} has nothing to do with ${a0} · a curse cannot be hung on a stranger's belongings`,
    relic: (a0: string) =>
      `${a0} kept as the connected object · think of the target every day, and stay near them`,
    wrongObject: (a0: string) => `The rite is performed over the relic, not over ${a0}`,
    rite: (a0: string, a1: number, a2: number) =>
      `Rite ${a1}/5 · ${a2}px between the ashes and ${a0}, and that distance is most of the curse`,
    completed: (a0: string, a1: number, a2: boolean) =>
      `Ashes drunk and the dagger used · at ${a1}px this needs ${a2 ? 'hours' : 'months'} to finish ${a0}`,
    noAura: (a0: string) =>
      `${a0} has no aura left · whoever did this has been dead the whole time`,
  },
  /**
   * The short tokens stamped on the impact points. They are badges rather than
   * sentences, so they stay upper-case and terse in both languages.
   */
  tokens: {
    /** The four forged textures Texture Surprise cycles through. */
    forgeries: ['OFFICIAL ACCESS', 'CLEARED RECORD', 'AUTHORIZED IDENTITY', 'EMPTY SURFACE'],
    forgeryAria: (a0: string) => `${a0} — Texture Surprise forgery`,
    /** Cross Game's four cards, in the order they are played. */
    tribunalCards: [
      'BLUE · ADMISSION',
      'YELLOW · WARNING',
      'YELLOW · RESTRAINT',
      'RED · DISMISSAL',
    ],
    fatalVow: 'FATAL VOW',
    conjured: 'CONJURED',
    tooBig: 'TOO BIG',
    markFound: 'MARK FOUND',
    noTrace: 'NO TRACE',
    guardsBroken: (a0: number) => `GUARD ×${a0}`,
    noGuard: 'NO GUARD',
    light: 'LIGHT',
    lightSeasonal: 'LIGHT ++',
    fire: 'FIRE',
    fireSeasonal: 'FIRE ++',
    noInvocation: 'NO INVOCATION',
    twoOnly: 'TWO ONLY',
    notSealed: 'NOT SEALED',
    closing: 'CLOSING',
    detonation: 'DETONATION',
    noHead: 'NO HEAD',
    alive: 'ALIVE',
    refused: 'REFUSED',
    noCalls: 'NO CALLS',
    noOwnFuture: 'NO OWN FUTURE',
    incomplete: 'INCOMPLETE',
    recalled: 'RECALLED',
    noAura: 'NO AURA',
    stuck: 'STUCK',
    noSurface: 'NO SURFACE',
    reset: 'RESET',
    reattached: 'REATTACHED',
    nothingTorn: 'NOTHING TORN',
    notes: ['DO', 'RE', 'MI', 'FA', 'SOL', 'LA', 'SI'],
    levelZero: 'LV 0',
    nothingToRead: 'NOTHING TO READ',
    countered: 'COUNTERED',
    cleaned: 'CLEANED',
    nenTrap: 'NEN TRAP',
    outOfRange: 'OUT OF RANGE',
    spent: 'SPENT',
    unhurt: 'UNHURT',
    stake: 'STAKE',
    empty: 'EMPTY',
    reward: 'REWARD',
    zetsu: 'ZETSU',
    noJurisdiction: 'NO JURISDICTION',
    leftHand: 'LEFT HAND',
    notMoved: 'NOT MOVED',
    trapDoor: 'TRAP DOOR',
    returnDoor: 'RETURN DOOR',
    intoHideout: 'INTO THE HIDEOUT',
    backToRoom: 'BACK TO 3101',
    obeyed: 'OBEYED',
    taken: 'TAKEN',
    met: (a0: number) => `MET ${a0}/3`,
    unmet: 'UNMET',
    trueAnswer: 'TRUE',
    route: 'ROUTE',
    reveal: 'REVEAL',
    inert: 'INERT',
    taboo: 'TABOO',
    trapSprung: 'TRAP SPRUNG',
    tooTired: 'TOO TIRED',
    yes: 'YES',
    protectedRoom: 'ROOM 1013',
    emptyCopy: 'EMPTY COPY',
    notConnected: 'NOT CONNECTED',
    ren: (a0: number) => `REN ${a0}`,
    charge: (a0: string) => `CHARGE · ${a0}`,
    answered: (a0: number) => `ANSWERED ×${a0}`,
    grow: (a0: number) => `GROW ${a0}`,
    victim: (a0: string) => `VICTIM · ${a0}`,
    predicted: (a0: string) => `PREDICTED · ${a0}`,
    small: (a0: string) => `SMALL · ${a0}`,
    trueForm: (a0: string) => `TRUE · ${a0}`,
    armed: (a0: string) => `ARMED · ${a0}`,
    bite: (a0: number) => `BITE ${a0}`,
    wrapped: (a0: string) => `WRAPPED · ${a0}`,
    released: (a0: string) => `RELEASED · ${a0}`,
    chargeLevel: (a0: number) => `CHARGE ${a0}`,
    order: (a0: string) => `ORDER · ${a0}`,
    pass: (a0: number) => `PASS ${a0}`,
    doors: (a0: number) => `${a0} DOORS`,
    sewn: (a0: number) => `SEWN ${a0}px`,
    slack: (a0: number) => `SLACK ${a0}px`,
    level: (a0: string | number) => `LV ${a0}`,
    levelGain: (a0: number, a1: number) => `+${a0} → LV ${a1}`,
    hit: (a0: number) => `HIT ×${a0}`,
    abilities: (a0: number) => `${a0} ABILITIES`,
    read: (a0: number) => `READ ${a0}/3`,
    reach: (a0: number) => `REACH ${a0}`,
    freed: (a0: string) => `FREED · ${a0}`,
    coil: (a0: number) => `COIL ${a0}`,
    relay: (a0: number) => `RELAY ${a0}`,
    healed: (a0: string) => `HEALED · ${a0}`,
    mending: (a0: number) => `MENDING ${a0}/2`,
    heart: (a0: string) => `HEART · ${a0}`,
    rule: (a0: number) => `RULE ${a0}`,
    spentAbility: (a0: string) => `SPENT · ${a0}`,
    sign: (a0: number) => `SIGN ${a0}/2`,
    drop: (a0: number) => `DROP ${a0}`,
    hideout: (a0: string) => `HIDEOUT · ${a0}`,
    guardLevel: (a0: number) => `GUARD ${a0}`,
    sink: (a0: string) => `SINK · ${a0}`,
    lie: (a0: number) => `LIE ${a0}`,
    partner: (a0: string) => `PARTNER · ${a0}`,
    bait: (a0: string) => `BAIT · ${a0}`,
    inhaling: (a0: number) => `${a0} INHALING`,
    target: (a0: string) => `TARGET · ${a0}`,
    relic: (a0: string) => `RELIC · ${a0}`,
    rite: (a0: number) => `RITE ${a0}`,
    packedHits: (a0: number) => `PACKED ×${a0}`,
    nothingPacked: 'NOTHING PACKED',
    carbonised: (a0: number) => `BURNT ×${a0}`,
    noDiscrimination: 'Allies inside the radius burn with the target',
  },
}
