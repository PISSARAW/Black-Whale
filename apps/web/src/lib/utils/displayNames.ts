const englishNameOverrides: Record<string, string> = {
  "Neveu d'Oito": "Oito's Nephew",
  'Utilisateur de Silent Majority': 'Silent Majority User'
};

export function toEnglishDisplayName(name: string | null | undefined) {
  if (!name) return '';
  return englishNameOverrides[name] || name;
}
