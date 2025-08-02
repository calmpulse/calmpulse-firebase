// src/lib/meditationDate.ts
/* Helpers date + chemin pour la rotation des méditations
   — toutes les dates sont calculées en Europe/Paris pour rester cohérent
     avec toLocalDay() que tu utilises dans le streak. */

/// Retourne la date/heure actuelle *vue* depuis le fuseau Europe/Paris.
export function parisToday(): Date {
  const localParis = new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Paris',
  });
  return new Date(localParis);
}

/// Transforme une Date en ID "YYYY-MM-DD".
export function dateToId(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/// Construit le chemin Storage correspondant au jour donné.
export function pathFor(d: Date): string {
  // Exemple : meditations/2025-08-05.mp3
  return `meditations/${dateToId(d)}.mp3`;
}
