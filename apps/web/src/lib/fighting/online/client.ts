import type { OnlineCommand } from './protocol'
import { PVP_RULESET, pvpSessionKey, type PvpSession } from '../pvp/types'
export async function onlineRequest<T>(options: {
  endpoint: string
  token?: string
  command?: OnlineCommand
  signal?: AbortSignal
}): Promise<T> {
  const response = await fetch(options.endpoint, {
    method: options.command ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${options.token ?? ''}`, 'content-type': 'application/json' },
    body: options.command
      ? JSON.stringify({ ...options.command, ruleset: PVP_RULESET })
      : undefined,
    signal: options.signal,
  })
  const value = await response.json()
  if (!response.ok) throw Error(value.error ?? 'UNAVAILABLE')
  return value as T
}
export function rememberOnlineSession(session: PvpSession) {
  sessionStorage.setItem(pvpSessionKey(session.matchId), session.token)
  if (session.watchHref) sessionStorage.setItem(`clash:watch:${session.matchId}`, session.watchHref)
}
const messages: Record<string, [string, string]> = {
  UNAUTHORIZED: [
    'Code de récupération inconnu sur ce serveur.',
    'Recovery code not recognised on this server.',
  ],
  BUSY: [
    'Une recherche, une série ou un tournoi est déjà en cours.',
    'A search, series or tournament is already active.',
  ],
  CONNECTION: [
    'Connexion au-delà du filtre choisi. Réessaie ou augmente la tolérance.',
    'Connection exceeds the selected filter. Retry or increase tolerance.',
  ],
  INVALID_PROBE: [
    'Mesure de connexion expirée. Relance la recherche.',
    'Connection measurement expired. Start searching again.',
  ],
  NOT_READY: [
    'La rencontre suivante n’est pas encore disponible.',
    'The next encounter is not available yet.',
  ],
  ALREADY_REPORTED: ['Ce signalement est déjà enregistré.', 'This report is already recorded.'],
  RATE_LIMITED: [
    'Trop de demandes rapprochées. Patiente un moment.',
    'Too many requests. Wait a moment.',
  ],
  VERSION: [
    'Recharge le jeu pour utiliser les règles actuelles.',
    'Reload the game to use the current rules.',
  ],
  CAPACITY: ['Le service est complet pour le moment.', 'The service is currently at capacity.'],
}
export function onlineError(error: unknown, language: 'fr' | 'en') {
  const key = error instanceof Error ? error.message : ''
  const message = messages[key] ?? [
    'Service indisponible. Aucun résultat local ne remplace le résultat serveur.',
    'Service unavailable. Local results cannot replace server results.',
  ]
  return message[language === 'fr' ? 0 : 1]
}
