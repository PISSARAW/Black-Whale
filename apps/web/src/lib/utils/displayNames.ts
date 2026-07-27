const englishNameOverrides: Record<string, string> = {
  "Neveu d'Oito": "Oito's Nephew",
  'Utilisateur de Silent Majority': 'Silent Majority User',
}

export function toEnglishDisplayName(name: string | null | undefined) {
  if (!name) return ''
  return englishNameOverrides[name] || name
}

function ordinal(value: number) {
  const lastTwo = value % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${value}th`
  if (value % 10 === 1) return `${value}st`
  if (value % 10 === 2) return `${value}nd`
  if (value % 10 === 3) return `${value}rd`
  return `${value}th`
}

export function toEnglishAlias(alias: string) {
  const prince = alias.match(/^(\d+)(?:er|e|ème)\s+Prince$/i)
  return prince ? `${ordinal(Number(prince[1]))} Prince` : toEnglishDisplayName(alias)
}

export function toEnglishConflictLabel(label: string) {
  return label.replace(/\s+contre\s+/gi, ' vs. ').replace(/\s+et\s+/gi, ' and ')
}

export function toEnglishEventTitle(title: string) {
  return title.replace(/^Début du chapitre\s+(\d+)$/i, 'Start of Chapter $1')
}
