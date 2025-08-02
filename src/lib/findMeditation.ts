import { ref, getDownloadURL } from 'firebase/storage';
import { storage }             from '@/lib/firebase';
import { parisToday, pathFor } from '@/lib/meditationDate';

export async function findMeditationURL(maxLookback = 14): Promise<string | null> {
  let d = parisToday();
  for (let i = 0; i <= maxLookback; i++) {
    try {
      const url = await getDownloadURL(ref(storage, pathFor(d)));
      if (i > 0)
        console.warn(`Fallback : piste trouvée ${i} jour(s) en arrière (${pathFor(d)})`);
      return url;               // ✅ trouvé
    } catch {
      d.setDate(d.getDate() - 1); // ← recule d’un jour
    }
  }
  return null;
}
