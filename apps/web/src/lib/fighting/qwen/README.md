# Qwen · stratégie distante et exécution locale

Le premier périmètre est **Hisoka et Machi, dans les deux sièges**, en mode
Versus local. Le bouton « Activer Qwen · IA contre IA » du combat confie les deux
combattants au même contrôleur rapide. L’IA native adversaire est désactivée par
ce mode. Aucun moteur, dégât, coût, combo ou pouvoir de Nen n’est modifié.

## Connexion privée

Sur le poste qui exécute le serveur web :

```sh
node apps/web/scripts/start-clash-qwen-tunnel.mjs
```

Tailscale peut demander une vérification SSH. Le tunnel authentifié relie
`127.0.0.1:11439` du poste à `127.0.0.1:11434` du serveur Qwen existant
`vps-e177d34a`. Il n’expose aucun port Ollama public. Conserver le tunnel actif.
Dans `apps/web/.env`, puis redémarrer le serveur web :

```dotenv
CLASH_OLLAMA_URL=http://127.0.0.1:11439
CLASH_OLLAMA_MODEL=qwen2.5:1.5b
```

`CLASH_OLLAMA_TOKEN` est facultatif pour un point d’accès privé authentifié par
Bearer. Ces variables restent côté serveur. Elles sont séparées du gateway de
recherche `OLLAMA_*`, qui n’accepte pas le protocole de combat. Les conteneurs
doivent recevoir ces variables et disposer d’un chemin réseau vers le point
d’inférence ; leur boucle locale n’est pas celle du poste hôte. Cette intégration
n’effectue aucun déploiement de production ni changement du service d’inférence.

## Décisions et limites

- `observation.ts` transmet la santé propre en pourcentage, l’aura propre, les
  plaies, les liens propres et les indices corporels visibles de l’adversaire.
  Aucune aura adverse, commande cachée ou prévision privée n’est envoyée.
- `perceptionHistory.ts` conserve six retours d’impacts réellement vécus.
- `clashQwen.ts` construit les règles et le catalogue côté serveur. Ollama
  reçoit un schéma JSON fermé : distance tactique, technique de Nen et Hatsu
  existant à rechercher. Le modèle ne peut écrire aucun état du moteur.
- `duel.ts` alterne les deux sièges, une requête à la fois, sans attendre dans
  le tick de simulation. Le délai maximal et la durée de validité du plan sont
  de 18 secondes, adaptés au serveur CPU actuel. Une réponse d’une autre manche
  ou session est ignorée ; les plans périmés repassent au contrôleur local.
- `execution.ts` et `reflexes.ts` passent par les commandes normales, les
  disponibilités natives et les fenêtres de confirmation de `comboChoices`.
  Ils assurent déplacements, garde avec retard de réaction de dix frames,
  ressources et enchaînements. Une récupération se termine à 50 aura ; la zone
  se règle sur la portée du coup choisi. Ce sont des politiques d’IA, pas de
  nouvelles règles du Nen. En, In, Gyo et On restent soumis au moteur existant.
- L’interface affiche les plans réellement reçus, les indisponibilités et la
  source active de chaque siège. Un duel de repli sans réponse de Qwen n’est
  jamais validé comme duel Qwen.

Sur ce serveur CPU, les premières mesures prennent plusieurs secondes. Qwen
n’assure donc pas les réflexes et aucune supériorité sur l’IA native n’est promise.
Le raisonnement du modèle ne remplace pas la validation des conditions du Nen.

## Vérification reproductible

```sh
pnpm --filter @black-whale/web exec vitest run src/lib/fighting/qwen/qwen.test.ts src/lib/server/clashQwen.test.ts
node apps/web/scripts/test-clash-qwen-duel.mjs
```

Le second essai exige le vrai Ollama accessible par le tunnel. Il joue le moteur
en temps réel, sans santé modifiée et sans vainqueur imposé. Il refuse de réussir
si les deux sièges n’ont pas reçu de vraies réponses. Le replay natif et les
mesures sont écrits dans `output/hisoka-machi-qwen/`. Tous les checkpoints et le
hash final sont rejoués ; la lecture du replay ne contacte plus le modèle.
Ce test mesure un duel autonome du moteur, pas une capture vidéo du navigateur.
