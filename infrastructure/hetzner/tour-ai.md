---
titre: IA privée du site
etage: 2
couvre:
  - infrastructure/hetzner/tour-ai-gateway.py
  - infrastructure/hetzner/black-whale-tour-ai.service
  - infrastructure/hetzner/configure-tour-ai.py
  - infrastructure/hetzner/test_tour_ai_gateway.py
depend-de: [12-l-exploitation]
revu-le: 2026-11-15
empreinte: pending
decisions: []
---

# Private inference over Tailscale

The two tour endpoints (`/tour/search` and `/tour/ask`) use native Ollama structured
outputs. Production uses `qwen2.5:1.5b` on the existing `vps-e177d34a` inference
host through Tailscale Serve, port 9445. Visitors only contact SvelteKit.
The personal chat/router API is a different protocol and must not be used as
`OLLAMA_URL`. Neither a public Ollama port nor Tailscale Funnel is required.

`tour-ai-gateway.py` listens on loopback port 8768. It requires a dedicated
Bearer credential, accepts only the tour's keyword/topic schemas, checks the
existing fleet resource policy, and allows one generation at a time. The
existing Ollama service retains its 4 GiB/two-core limits. Requests are bounded
to 64 generated tokens, a 4K context and 23 seconds upstream. Responses are
validated before forwarding. Models stay loaded for five minutes, subject to
the existing personal inference service unloading them. Prompts, answers and
credentials are not logged; successful generations log an inference ID and timing.

Install the gateway and unit on the inference host:

```sh
install -d -m 755 /opt/black-whale-tour-ai
# Copy tour-ai-gateway.py, configure-tour-ai.py and black-whale-tour-ai.service
# from this directory to /opt/black-whale-tour-ai on that host.
install -m 644 /opt/black-whale-tour-ai/black-whale-tour-ai.service /etc/systemd/system/
```

The runtime dependency is the existing `/opt/tailscale-personnel/ai-router`
directory (`node_runtime.py`, `resource_policy.py`, `generation.py`). It must be
readable by the unit's dynamic user. Copy `configure-tour-ai.py` to
`/opt/black-whale-tour-ai` on the web host too, then provision the credential
through a pipe (do not run the gateway subcommand alone in a terminal):

```sh
tailscale ssh root@vps-e177d34a 'python3 /opt/black-whale-tour-ai/configure-tour-ai.py gateway' \
  | ssh black-whale 'python3 /opt/black-whale-tour-ai/configure-tour-ai.py web'
tailscale ssh root@vps-e177d34a 'systemctl daemon-reload && systemctl enable --now black-whale-tour-ai && tailscale serve --bg --https=9445 http://127.0.0.1:8768'
```

Provisioning is idempotent and preserves a private backup of the web environment
outside the checkout. It sets `OLLAMA_URL` to the private HTTPS gateway,
`OLLAMA_MODEL=qwen2.5:1.5b`, `OLLAMA_TOKEN` and `OLLAMA_TIMEOUT_MS=25000`.
Recreate the web container after changing these values; the routes capture them
at startup. Keep the gateway private using tailnet policy and its service token.
No browser receives the token. An unavailable or busy model preserves the
existing deterministic search and archive fallback.

Validation:

```sh
python3 -m unittest discover -s infrastructure/hetzner -p 'test_tour_ai_gateway.py'
pnpm --filter @black-whale/web test src/lib/server/tourSearch.test.ts src/lib/server/castQuestion.test.ts
BLACK_WHALE_PRODUCTION_URL=https://exploreblackwhale.com pnpm exec playwright test --config playwright.production.config.ts
```

Correlate web `Ollama answered` logs with `journalctl -u black-whale-tour-ai` by
`inferenceId`/`id` to prove that a result came from actual inference, rather than
a phrase matcher or cache. Test the container-to-gateway path, not only the host.
To disable, empty `OLLAMA_URL` and `OLLAMA_MODEL` and recreate only the web
container. Previous release images and environment backups allow rollback.

### Site-wide natural language search

The same gateway also accepts the fixed `search` schema used by `POST /search`:
content kind, optional Nen category and up to four short search terms. Deploy
the updated `tour-ai-gateway.py` and restart `black-whale-tour-ai` before deploying
a web image that uses this schema. Existing tour schemas remain supported.
No additional token, public port or tailnet service is needed.

The model sees no catalogue or chapter-dependent context. The web server applies
the cookie cap before ranking and publishing results; only fact-free intent is
cached. Run `tests/site-search.production.spec.ts` with the production Playwright
configuration to check FR/EN semantic retrieval, mobile/keyboard navigation,
cross-cap isolation (including zero), body/query cap spoofing, and the ability
page reached from a capped result. The tour tests run alongside it.
