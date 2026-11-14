# Source-bound interiors

These twelve programmes have a detailed walkable rendering even when the manga only supplies a plan, a cutaway, or a name. “Detailed” does not mean that every visible choice is canon.

## Reading the reconstruction

Two independent labels describe every generated surface:

- **Provenance** says what evidence exists: `panel`, `plan`, `map`, or `inferred`.
- **Reconstruction role** says what the renderer did: `attested`, `metric-estimate`, `functional-reconstruction`, or `connective-inference`.

The room envelope, furniture, finish, and access may therefore carry different labels. Colours, materials, floor patterns, ceiling systems, luminaires, and metric dimensions remain reconstructions unless their own tag says otherwise.

Any object that occupies the floor is a structure in `blueprint.json`. Inferred beds, desks, cabinets, seats, and recycling tanks collide with the visitor and remain explicitly `inferred`; decorative joints and ceiling services remain tagged visual details.

## Certified locations

| Location                        | Strongest evidence                                       | Furniture                                | Known limit                                                                                           |
| ------------------------------- | -------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Soldiers’ quarters              | Ch. 363 names the zone; project /ship map supplies rooms | 96 mapped bed symbols                    | Eight rooms and twelve beds per room are not a manga census; profiles and finishes are reconstructed. |
| Royal Army local section        | Ch. 380 annotated cutaway names the Tier 3 service       | None                                     | No room plan or furniture is shown; envelope and lights are reconstructed.                            |
| Central courthouse              | Published courtroom plan                                 | Six plan fixtures                        | Materials, colours, and exact profiles are reconstructed.                                             |
| Registered Heil-Ly office       | Published plan                                           | Desk and files from the plan             | This is not the secret hideout or room 302 shown in later chapters.                                   |
| First-class residential block   | Published cabin plan                                     | Six beds and six storage units           | The companionway and all finishes are reconstructed.                                                  |
| Tier 3 standard cabins          | Published cabin plan                                     | Twelve beds and twelve cupboards         | Detailed construction and finishes are reconstructed.                                                 |
| Central Police dormitory        | Catalogue mention only                                   | Four bunks and two lockers, all inferred | No published drawing establishes its placement or interior.                                           |
| Ei-I office                     | Published cutaway establishes the compartment            | Desk, seats, and files, all inferred     | No published drawing establishes the furniture.                                                       |
| Recycling and sewage facilities | Published deck volumes                                   | Six process tanks, all inferred          | No published drawing establishes machinery or services.                                               |
| Xi-Yu office                    | Published plan                                           | One meeting table                        | Detailed construction and finishes are reconstructed.                                                 |
| Tier 5 clinic                   | Published deck volume                                    | Two beds and one cabinet, all inferred   | No published drawing establishes equipment or layout.                                                 |
| Tier 5 standard cabins          | Published cabin plan                                     | Twelve beds and twelve cupboards         | Detailed construction and finishes are reconstructed.                                                 |

## Enforced guarantees

The certification suite checks every sub-space of every location:

- every rendered triangle has a bilingual evidence tag;
- floors and ceilings use the authored room footprint;
- detailed and coarse furniture are never shown together;
- inferred floor-standing furniture exists in the collision blueprint;
- visible fixtures share the positions used by the baked lighting;
- evidence mode removes the detailed reconstruction;
- each room stays within its declared triangle budget;
- the complete blueprint remains connected and validates doors, arrivals, sources, and collisions.

The suite cannot turn an inference into evidence. Its purpose is to make the boundary inspectable and to prevent the 2D plan, collision model, lighting, and detailed 3D rendering from silently diverging.
