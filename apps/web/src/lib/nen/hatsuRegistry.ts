export type HatsuInteractionKind =
  | 'elastic'
  | 'disguise'
  | 'scarlet'
  | 'chain-rule'
  | 'chain-bind'
  | 'dowsing'
  | 'enhance'
  | 'control'
  | 'growth'
  | 'vehicle'
  | 'scout'
  | 'tribunal'
  | 'curse'
  | 'inherit'
  | 'blast'
  | 'surveillance'
  | 'capture'
  | 'future'
  | 'arrow'
  | 'guardian'
  | 'portal'
  | 'resurrection'
  | 'poetry'
  | 'restoration'
  | 'transformation'
  | 'rhythm'
  | 'impact'
  | 'mimicry'
  | 'theft'
  | 'bookmark'
  | 'devour'
  | 'pocket'
  | 'teleport'
  | 'polarity'
  | 'command'
  | 'identity-swap'
  | 'divination'
  | 'prophecy'
  | 'clone'
  | 'puppet'
  | 'barrage'
  | 'projection'
  | 'animate'
  | 'needle'
  | 'paper-spy'
  | 'shred'
  | 'remote-strike'
  | 'spatial'
  | 'stitch'
  | 'melody'
  | 'infection'
  | 'windup'
  | 'predator'
  | 'staff'
  | 'senses'
  | 'vacuum'
  | 'snakes'
  | 'training-shot'
  | 'serpent'
  | 'flock'
  | 'relay'
  | 'postmortem-curse'

export interface HatsuProfile {
  id: string
  name: string
  owner: string
  kind: HatsuInteractionKind
  instruction: string
  rule: string
  cost: string
  color: string
  action: string
}

/**
 * Interaction knowledge used by the global Hatsu layer.
 * This is deliberately explicit: a technique never falls back to a generic
 * particle effect when its canon mechanics are already known.
 */
export const HATSU_PROFILES: HatsuProfile[] = [
  { id: 'bungee-gum', name: 'Bungee Gum', owner: 'Hisoka', kind: 'elastic', instruction: 'Select at least two characters on the map. After 5 seconds without a new target, only they remain visible.', rule: 'Each new character resets the five-second selection window.', cost: 'Continuous aura · increasing tension', color: '#f06bb5', action: 'Select a character' },
  { id: 'texture-surprise', name: 'Texture Surprise', owner: 'Hisoka', kind: 'disguise', instruction: 'Click an element to cover its texture and conceal its true appearance.', rule: 'The thin layer changes perception, not the nature of the target.', cost: 'Low · limited surface', color: '#d98fc4', action: 'Choose a surface' },
  { id: 'emperor-time', name: 'Emperor Time', owner: 'Kurapika', kind: 'scarlet', instruction: 'Every active second consumes one hour of life, retained for this session.', rule: 'After one year of consumed life, Nen is sealed for five minutes and the counter resets.', cost: '1 second = 1 hour of life', color: '#ef3340', action: 'Observe life reserve' },
  { id: 'steal-chain', name: 'Steal Chain', owner: 'Kurapika', kind: 'chain-rule', instruction: 'Select a target, then impose the displayed rule.', rule: 'The chain drains an ability; breaking a condition triggers the penalty.', cost: 'Condition and contact required', color: '#d7dce2', action: 'Drive in the chain' },
  { id: 'chain-jail', name: 'Chain Jail', owner: 'Kurapika', kind: 'chain-bind', instruction: 'Click a target to bind it in chains.', rule: 'The absolute restriction is reserved for Phantom Troupe members.', cost: 'Fatal vow if the target is invalid', color: '#c9ced6', action: 'Bind target' },
  { id: 'dowsing-chain', name: 'Dowsing Chain', owner: 'Kurapika', kind: 'dowsing', instruction: 'Move the pointer: the pendulum searches for interactive elements and reacts to the nearest one.', rule: 'The pendulum combines intuition, concentration, and available information.', cost: 'Sustained concentration', color: '#8ecae6', action: 'Start search' },
  { id: 'benjamin-aura', name: 'Aura Manipulation', owner: 'Benjamin', kind: 'enhance', instruction: 'Click to temporarily reinforce an area of the site.', rule: 'Massive aura improves physical power and resistance.', cost: 'Proportional aura expenditure', color: '#f0b429', action: 'Reinforce' },
  { id: 'oito-hatsu', name: 'Royal Guard Hatsu', owner: 'Oito', kind: 'control', instruction: 'Select several targets to materialize control links.', rule: 'Manipulation requires an acquired target and a maintained link.', cost: 'Aura per controlled target', color: '#70d6b2', action: 'Establish a link' },
  { id: 'erigeron', name: 'Erigeron', owner: 'Bill', kind: 'growth', instruction: 'Click an element to accelerate the life and aura within it.', rule: 'Acceleration is strong on plants and weak on a Nen novice.', cost: 'Palms close to the living target', color: '#7fd35b', action: 'Trigger growth' },
  { id: 'kurton-vehicle-transformation', name: 'Vehicle Transformation', owner: 'Kurton', kind: 'vehicle', instruction: 'Board up to five elements, then make them travel together.', rule: 'The body becomes a vehicle and passenger aura serves as fuel.', cost: 'Shared aura · 5 passengers max.', color: '#f2a65a', action: 'Board' },
  { id: 'little-eye', name: 'Little Eye', owner: 'Sayird', kind: 'scout', instruction: 'Send the small eye into an area to observe it through a creature.', rule: 'The target must be a real small animal; visual and auditory perception are shared.', cost: 'Very low · persists while unconscious', color: '#55c2ff', action: 'Release scout' },
  { id: 'cross-game', name: 'Cross Game', owner: 'Mizaistom', kind: 'tribunal', instruction: 'Blue admits, yellow warns then immobilizes, and red expels the selected target.', rule: 'Yellow restraint triggers only after an ignored warning.', cost: 'Brief effect · reusable', color: '#f0c94d', action: 'Change card' },
  { id: 'beyond-sacrificial-curse', name: 'Sacrificial Curse', owner: 'Beyond', kind: 'curse', instruction: 'Mark a target: the curse remains dormant until the sacrifice.', rule: 'The carrier’s death remotely triggers the curse placed on the target.', cost: 'Human sacrifice · post-mortem', color: '#9d65d0', action: 'Reveal with Gyo' },
  { id: 'benjamin-baton', name: 'Benjamin Baton', owner: 'Benjamin', kind: 'inherit', instruction: 'Select up to four characters on the map to reveal their known Hatsu.', rule: 'Each selected character adds a star and exposes their registered abilities.', cost: '4 selected characters maximum', color: '#ffd166', action: 'Inspect abilities' },
  { id: 'air-blow', name: 'Air Blow', owner: 'Benjamin / Vincent', kind: 'blast', instruction: 'Click to project a wave from the palm that pushes the page back.', rule: 'Emission strikes at range; its exact limits remain unknown.', cost: 'Unknown', color: '#c6f1ff', action: 'Strike the air' },
  { id: 'secret-window', name: 'Secret Window', owner: 'Benjamin / Musse', kind: 'surveillance', instruction: 'Place an eye on a map character. It glows if they move or die in the next chapter.', rule: 'The current and next visible chapter states are compared.', cost: 'One observed character', color: '#a8b7d8', action: 'Place the eye' },
  { id: 'culdcept', name: 'Culdcept', owner: 'Benjamin / Shikaku', kind: 'capture', instruction: 'Click two opposite corners on the map to seal that zone for ten seconds.', rule: 'Pointer interactions inside the delimited rectangle are blocked.', cost: '10-second seal', color: '#8c7ae6', action: 'Choose the first corner' },
  { id: 'parallel-future', name: 'Parallel Future', owner: 'Tserriednich', kind: 'future', instruction: 'For ten seconds, cyan shows the present and violet shows every living character in the next chapter.', rule: 'The prediction uses the last visible event of the following chapter.', cost: 'Complete Zetsu · 10-second vision', color: '#7dd3fc', action: 'Open the future' },
  { id: 'grimmel-the-dissonance', name: 'Grimmel the Dissonance', owner: 'Halkenburg', kind: 'arrow', instruction: 'Click the map to draw the bow, then click a character to fire and force their perspective.', rule: 'The second target must be a visible character on the map.', cost: 'Collective will · forced perspective', color: '#f7e27d', action: 'Materialize the bow' },
  { id: 'without-you', name: 'Without You', owner: 'Kacho', kind: 'guardian', instruction: 'The guardian records your last five interactions. Click it to replay them visually.', rule: 'The protective presence follows navigation while the Hatsu remains active.', cost: 'Five-event memory', color: '#f6b8d1', action: 'Record interactions' },
  { id: 'magical-worm', name: 'Magical Worm', owner: 'Fugetsu', kind: 'portal', instruction: 'Right-click two map locations to place linked doors, then click either door to cross.', rule: 'Each door restores the URL, chapter, zoom level, tier and location of its counterpart.', cost: 'Two persistent anchors', color: '#80edc7', action: 'Right-click the entrance' },
  { id: 'cats-name', name: "Cat's Name", owner: 'Camilla', kind: 'resurrection', instruction: 'Trigger simulated death: the cat counters the culprit and restores life.', rule: 'The ability responds only to Camilla’s direct death through post-mortem Nen.', cost: 'Prior death · killer required', color: '#ff8fab', action: 'Simulate death' },
  { id: 'great-haiku', name: 'Great Haiku', owner: 'Basho', kind: 'poetry', instruction: 'Select three pieces of page copy to compose a haiku; the finished verse materializes as a site-wide weather effect.', rule: 'The result grows stronger when the three selected lines form a convincing poem.', cost: 'Three lines · quality determines power', color: '#e7c873', action: 'Choose the first line' },
  { id: 'magical-esthetician-cookie', name: 'Magical Esthetician Cookie', owner: 'Biscuit', kind: 'restoration', instruction: 'Click a tired section to massage it, clear visual fatigue and return it refreshed to the top of the viewport.', rule: 'Cookie relieves exhaustion and compresses hours of rest into a short treatment.', cost: 'One treatment at a time', color: '#f3b6d2', action: 'Choose a section to restore' },
  { id: 'biscuit-body-transformation', name: 'Body Transformation', owner: 'Biscuit', kind: 'transformation', instruction: 'Click any card to alternate between its compact concealed form and its full muscular form.', rule: 'The visible body changes radically while its underlying identity remains the same.', cost: 'Maintained transformation', color: '#f0a6c5', action: 'Transform a page body' },
  { id: 'battle-cantabile-prologue', name: 'Battle Cantabile: Prologue', owner: 'Bonolenov', kind: 'rhythm', instruction: 'Strike page elements in sequence; each hit joins the percussion loop and makes the interface dance to your rhythm.', rule: 'Air passing through the body’s holes becomes battle music whose rhythm carries the technique.', cost: 'Continuous movement and rhythm', color: '#d7b56d', action: 'Begin the rhythm' },
  { id: 'battle-cantabile-jupiter', name: 'Battle Cantabile: Jupiter', owner: 'Bonolenov', kind: 'impact', instruction: 'Choose a target and drop a miniature Jupiter on it, collapsing that part of the page under immense weight.', rule: 'The conjured planet crushes the designated target with overwhelming mass.', cost: 'One massive impact', color: '#d9935b', action: 'Choose the impact site' },
  { id: 'battle-cantabile-metamorphosen', name: 'Battle Cantabile: Metamorphosen', owner: 'Bonolenov', kind: 'mimicry', instruction: 'Select a model, then another element; the second adopts the first element’s visible form.', rule: 'Battle music changes Bonolenov’s appearance into a chosen identity or object.', cost: 'Model plus target', color: '#a889c8', action: 'Choose a form to copy' },
  { id: 'skill-hunter', name: 'Skill Hunter', owner: 'Chrollo', kind: 'theft', instruction: 'Click a button or link to steal it into the floating book; the original control is sealed while its copy remains usable.', rule: 'A stolen ability is stored in the book and cannot be used by its owner while held.', cost: 'Targeted control must be exposed', color: '#b69ad9', action: 'Open the book and steal a control' },
  { id: 'double-face', name: 'Double Face', owner: 'Chrollo', kind: 'bookmark', instruction: 'Bookmark up to two sections; both remain pinned and visible while you navigate the rest of the page.', rule: 'The bookmark keeps one stolen ability active while Skill Hunter opens on another page.', cost: 'Two simultaneous pages maximum', color: '#9c7ac4', action: 'Bookmark the first section' },
  { id: 'indoor-fish', name: 'Indoor Fish', owner: 'Chrollo', kind: 'devour', instruction: 'Click page copy to let the fish consume its words while the layout remains eerily intact until Zetsu.', rule: 'Indoor Fish eat flesh only inside a sealed room; victims feel nothing and remain alive until the ability ends.', cost: 'Enclosed active page', color: '#78b6c9', action: 'Release the fish indoors' },
  { id: 'fun-fun-cloth', name: 'Fun Fun Cloth', owner: 'Chrollo', kind: 'pocket', instruction: 'Click any section to shrink it into a cloth token; click the token to restore it at full size.', rule: 'Anything wrapped by the cloth is reduced and stored without damage.', cost: 'Stored targets remain bound', color: '#d9d1bd', action: 'Wrap and shrink a section' },
  { id: 'chrollo-teleportation', name: 'Teleport', owner: 'Chrollo', kind: 'teleport', instruction: 'Select two page elements to exchange their exact positions instantly.', rule: 'The stolen technique forcibly relocates targets without requiring visible travel.', cost: 'Two valid destinations', color: '#7dd4d0', action: 'Choose the first target' },
  { id: 'sun-and-moon', name: 'The Sun and Moon', owner: 'Chrollo', kind: 'polarity', instruction: 'Mark one element with the Sun and another with the Moon; touching either detonates both marks and blasts the two targets away.', rule: 'Opposite marks explode on contact and persist through post-mortem Nen.', cost: 'One Sun mark plus one Moon mark', color: '#ffb347', action: 'Place the Sun mark' },
  { id: 'order-stamp', name: 'Order Stamp', owner: 'Chrollo', kind: 'command', instruction: 'Stamp non-interactive blocks, then click a destination to command every stamped puppet to march there.', rule: 'The stamp controls puppets as objects, never beings the user considers alive.', cost: 'Only inanimate page bodies', color: '#cf6d62', action: 'Stamp page puppets' },
  { id: 'convert-hands', name: 'Convert Hands', owner: 'Chrollo', kind: 'identity-swap', instruction: 'Select two elements to exchange their visible identities while retaining their original destinations and behavior.', rule: 'Left and right hand marks exchange appearances without exchanging the underlying person.', cost: 'Two marked identities', color: '#d6a5cc', action: 'Mark the first identity' },
  { id: 'love-dial-6700', name: 'Love Dial 6700', owner: 'Chrollo', kind: 'divination', instruction: 'Click page elements to make the dial measure affinity and point toward the strongest match on the current page.', rule: 'The phone-like divination tool guides its user toward a desired person through changing compatibility readings.', cost: 'Repeated readings improve direction', color: '#f08db6', action: 'Take an affinity reading' },
  { id: 'lovely-ghostwriter', name: 'Lovely Ghostwriter', owner: 'Chrollo', kind: 'prophecy', instruction: 'Select a character or section to write a four-line prophecy from its links, state and surrounding context.', rule: 'Automatic writing predicts the target’s immediate future in cryptic verse while hiding their own prophecy from them.', cost: 'Target information and written medium', color: '#d8c7ed', action: 'Choose a subject for prophecy' },
  { id: 'gallery-fake', name: 'Gallery Fake', owner: 'Chrollo', kind: 'clone', instruction: 'Click a page element to create a perfect-looking but non-functional visual duplicate that can be placed elsewhere.', rule: 'Gallery Fake creates exact copies that lack the original’s living qualities and special powers.', cost: 'Copies vanish after twenty-four hours', color: '#a7c8c5', action: 'Copy a visible object' },
  { id: 'black-voice', name: 'Black Voice', owner: 'Chrollo', kind: 'puppet', instruction: 'Plant an antenna in a button or link, then click anywhere to remotely force the captured control to act.', rule: 'The antenna grants total remote control until removed or the target is destroyed.', cost: 'One antenna and one controller', color: '#7f92b8', action: 'Plant an antenna' },
  { id: 'double-machine-gun', name: 'Double Machine Gun', owner: 'Franklin', kind: 'barrage', instruction: 'Every click fires paired aura bullets that knock page elements backward; rapid fire compounds the displacement.', rule: 'Severed fingertips emit a sustained, powerful volley whose force rewards commitment.', cost: 'Continuous emitted aura', color: '#e6ad57', action: 'Open fire' },
  { id: 'hanzo-skill-4', name: 'Hanzo Skill 4', owner: 'Hanzo', kind: 'projection', instruction: 'Click a section to send an astral double inside it and inspect a detached copy while the page body remains fixed.', rule: 'Hanzo’s consciousness leaves his sleeping body as an invisible double but must return if the body is disturbed.', cost: 'Motionless unconscious body', color: '#8bd1cf', action: 'Project the double' },
  { id: 'biohazard-hinrigh', name: 'Biohazard', owner: 'Hinrigh', kind: 'animate', instruction: 'Click a nonliving interface object to animate it; transformed controls crawl toward the cursor while retaining their original function.', rule: 'Touched machines and objects become living animals without losing their practical properties.', cost: 'Direct contact with an object', color: '#77c887', action: 'Animate an object' },
  { id: 'illumi-needle-people', name: 'Needle People', owner: 'Illumi', kind: 'needle', instruction: 'Pierce page elements with needles; converted targets lose their own action and obediently follow the cursor.', rule: 'Needles overwrite autonomy and turn people into disposable puppets until exhaustion or death.', cost: 'One needle per puppet', color: '#b6a4d8', action: 'Insert a control needle' },
  { id: 'surveillance-paper-dolls', name: 'Surveillance Paper Dolls', owner: 'Kalluto', kind: 'paper-spy', instruction: 'Attach paper dolls to sections; they count and report every DOM change occurring inside their target.', rule: 'Tiny paper figures eavesdrop remotely and relay activity to their user.', cost: 'One paper observer per area', color: '#efb9c8', action: 'Deploy a paper observer' },
  { id: 'dance-of-the-serpents-bite', name: "Dance of the Serpent's Bite", owner: 'Kalluto', kind: 'shred', instruction: 'Click a target repeatedly to slice it into finer paper strips until its content scatters away.', rule: 'A fan controls razor paper confetti capable of tracking and cutting a chosen target.', cost: 'Sustained paper swarm', color: '#f1a7bb', action: 'Begin the paper dance' },
  { id: 'leorio-remote-punch', name: 'Remote Punch', owner: 'Leorio', kind: 'remote-strike', instruction: 'Click any point: a fist emerges from the opposite side of the viewport and punches the selected element remotely.', rule: 'Aura travels through a surface and reproduces the punch at a distant point.', cost: 'A connected surface and emitted aura', color: '#62c6e8', action: 'Choose a remote impact' },
  { id: 'luini-spatial-teleportation', name: 'Spatial Teleportation', owner: 'Luini', kind: 'spatial', instruction: 'Send sections through the page boundary into a hidden room; reopen the spatial hatch to bring them back.', rule: 'Luini passes through walls into a private connected space but must respect his marked entry points.', cost: 'Prepared boundary and return route', color: '#8a78d6', action: 'Open the hidden room' },
  { id: 'nen-stitches', name: 'Nen Stitches', owner: 'Machi', kind: 'stitch', instruction: 'Select two separate sections to sew their edges together so they move and scroll as one repaired body.', rule: 'Aura threads reconnect severed flesh with exceptional speed and precision.', cost: 'Thread length and precision', color: '#dd77b7', action: 'Choose the first torn edge' },
  { id: 'melody-enchanting-music', name: 'Enchanting Music', owner: 'Melody', kind: 'melody', instruction: 'Click elements to add notes; the growing melody synchronizes the whole page into a calming pulse and reveals emotional emphasis.', rule: 'Music carries aura directly into listeners, soothing them and shaping their emotional state.', cost: 'Continuous performance and hearing', color: '#70c6d7', action: 'Play the first note' },
  { id: 'contagion', name: 'Contagion', owner: 'Morena', kind: 'infection', instruction: 'Infect an element, then click infected nodes to spread levels through neighboring content until the page becomes a Heil-Ly network.', rule: 'Members gain levels through murder and unlock power at thresholds while infection spreads only by Morena’s kiss.', cost: 'Membership, targets and escalating levels', color: '#d94f68', action: 'Create a level-one member' },
  { id: 'ripper-cyclotron', name: 'Ripper Cyclotron', owner: 'Phinks', kind: 'windup', instruction: 'Click the same target to wind the arm; each rotation multiplies the eventual impact until the charged section is released.', rule: 'Every full arm rotation increases the aura concentrated in the next punch.', cost: 'Visible wind-up time', color: '#f2c34f', action: 'Choose a target and wind up' },
  { id: 'rihan-predator', name: 'Predator', owner: 'Rihan', kind: 'predator', instruction: 'Study the same interface species three times; once its rules are known, Predator materializes and removes every matching target.', rule: 'Predator becomes stronger and more specialized as Rihan correctly deduces an enemy ability’s conditions.', cost: 'Accurate analysis · weak against unknowns', color: '#7bb66c', action: 'Begin analyzing a target' },
  { id: 'saiyu-priest-staff', name: 'Priest Staff', owner: 'Saiyu', kind: 'staff', instruction: 'Plant the staff on an element to pin it and repel neighboring content away from the impact point.', rule: 'The conjured staff extends and strikes with force at close or mid range.', cost: 'One controlled staff', color: '#d5a94f', action: 'Plant the staff' },
  { id: 'saiyu-three-monkeys', name: 'Three Monkeys', owner: 'Saiyu', kind: 'senses', instruction: 'Each click seals sight, hearing, then speech across the site; the fourth releases all three senses.', rule: 'Three Nen monkeys rob the target of vision, hearing and speech when their attacks connect.', cost: 'Three successful sensory strikes', color: '#c58c5b', action: 'Seal sight' },
  { id: 'blinky', name: 'Blinky', owner: 'Shizuku', kind: 'vacuum', instruction: 'Click nonliving page content to vacuum it into Blinky’s storage; living character markers are rejected.', rule: 'Blinky sucks up any nonliving matter Shizuku names, except Nen constructs and things she considers alive.', cost: 'Declared nonliving target', color: '#85b9d8', action: 'Name something to vacuum' },
  { id: 'silent-majority', name: 'Silent Majority', owner: 'Unknown Assassin', kind: 'snakes', instruction: 'Mark ten page targets to conceal the user among them; four snakes then drain the next selected victim while the others remain suspects.', rule: 'The curse needs a ten-person range, kills through four snakes and rebounds if dismissed without a victim.', cost: 'Ten nearby targets · one mandatory victim', color: '#8765aa', action: 'Build the ten-target field' },
  { id: 'theta-aura-projectile', name: 'Aura Projectile', owner: 'Theta', kind: 'training-shot', instruction: 'Select a target, hold the pointer perfectly still through the warning, then survive the emitted shot without breaking focus.', rule: 'Theta fires a controlled aura projectile to test whether a student can maintain complete Zetsu under pressure.', cost: 'Three seconds of flawless concentration', color: '#8fe3f0', action: 'Choose a Zetsu trainee' },
  { id: 'snake-arm', name: 'Snake Arm', owner: 'Gel', kind: 'serpent', instruction: 'Click an element to coil the transformed arm around it; the restrained target compresses and cannot act until clicked again.', rule: 'Gel partially transforms her arm into a snake capable of instantly restraining a Zodiac-level target.', cost: 'Maintained partial transformation', color: '#86c98a', action: 'Choose something to restrain' },
  { id: 'bird-manipulation', name: 'Bird Manipulation', owner: 'Cluck', kind: 'flock', instruction: 'Assign birds to page elements; each pigeon carries a readable dispatch into the flock’s delivery panel.', rule: 'Hundreds of controlled birds can deliver documents accurately over a vast area.', cost: 'One controlled bird per dispatch', color: '#b9d8e8', action: 'Give a dispatch to the flock' },
  { id: 'transport-portals', name: 'Transport Portals', owner: 'Tokarine', kind: 'relay', instruction: 'Load up to three sections, then click each cargo repeatedly to move it through visible relay stages across the page.', rule: 'The ability transports limited cargo between expedition relays but explicitly cannot teleport it.', cost: 'Low capacity · staged transport', color: '#e2b86e', action: 'Load cargo at relay one' },
  { id: 'yomotsu-hegui', name: 'Yomotsu Hegui', owner: "Camilla's Have-Nots", kind: 'postmortem-curse', instruction: 'Perform five preparation rites on the same target; the final click simulates the user’s sacrifice and releases the aura-draining curse.', rule: 'Years of fixation, a connected object, ashes, proximity and suicide empower a post-mortem curse against one target.', cost: 'Long preparation · connected object · user’s life', color: '#a04f68', action: 'Choose the lifelong target' },
]

export const hatsuById = (id: string | null | undefined) =>
  HATSU_PROFILES.find((profile) => profile.id === id) ?? null
