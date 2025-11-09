// src/lib/findMeditation.ts
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Lundi=0 ... Dimanche=6 en heure de Paris
function parisWeekdayMonday0(): number {
  const now = new Date();
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
  }).format(now);
  const map: Record<string, number> = {
    Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
  };
  return map[day] ?? 0;
}

function pathForWeekday(iMon0: number): string {
  const label = String(iMon0 + 1).padStart(3, '0'); // 001..007
  return `meditations/${label}.mp3`;
}

// API: same name, no args
export async function findMeditationURL(): Promise<string | null> {
  const idx = parisWeekdayMonday0();
  const path = pathForWeekday(idx);
  try {
    return await getDownloadURL(ref(storage, path));
  } catch (e) {
    console.warn(`Audio du jour manquant (${path}), fallback 001.mp3`, e);
    try {
      return await getDownloadURL(ref(storage, 'meditations/001.mp3'));
    } catch {
      return null;
    }
  }
}

