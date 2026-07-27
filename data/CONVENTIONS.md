# Conventions de nommage

## Slugs des personnages

### Personnages nommés

Utiliser le nom complet en kebab-case. S'il n'y a qu'un prénom, utiliser le prénom.
Exemples :

- `kurapika`
- `chrollo-lucilfer`
- `benjamin-hui-guo-rou`

### Personnages anonymes

Pour éviter les doublons et permettre une identification claire, les personnages anonymes doivent suivre le format :
`[affiliation]-[rôle]-[numero]`

Exemples :

- `mafia-heilly-soldier-01`
- `royal-guard-woble-01`
- `passenger-civilian-01`
- `hunter-temp-01`

Si une affiliation précise n'est pas connue mais qu'un camp est évident :

- `prince-camp-benjamin-soldier-01`

### Identifiants de base de données (ID)

Toujours utiliser des UUID (générés automatiquement par la DB).

## Lieux

Les slugs des lieux suivent la hiérarchie pour plus de clarté, mais sans le nom du vaisseau :
`tier-[1-5]-[secteur]-[nom-ou-numero]`

Exemples :

- `tier-1-royal-residential-sector-room-1014`
- `tier-1-banquet-hall`
- `tier-3-medical-district`
