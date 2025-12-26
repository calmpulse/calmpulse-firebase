/**
 * Seeds Firebase *Emulators* (Auth + Firestore) with fake users and "15-min completions"
 * at random intervals (10–30s). This does NOT touch production.
 *
 * Run via:
 *   firebase emulators:exec "node scripts/seed-emulators.mjs"
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const TOTAL_TIME = 900;

function toLocalDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthKeyFromDay(day) {
  return day.slice(0, 7);
}

function dailyDocId(uid, d = new Date()) {
  return `${uid}_${toLocalDay(d)}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // These are emulator-only; apiKey etc can be dummy.
  const app = initializeApp({
    apiKey: 'demo',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'demo-calmpulse',
  });

  const auth = getAuth(app);
  const db = getFirestore(app);

  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);

  console.log('[seed] connected to emulators (auth:9099, firestore:8080)');

  // Loop forever: create user -> write completion doc -> wait 10-30s -> repeat
  // Stop with Ctrl+C.
  let i = 0;
  while (true) {
    i += 1;
    const suffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const email = `fake_${suffix}@example.com`;
    const password = `Passw0rd!${suffix}`;
    const displayName = `User ${String(i).padStart(3, '0')}`;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      const day = toLocalDay(new Date());
      const month = monthKeyFromDay(day);

      // Mirrors the app's write shape.
      await setDoc(
        doc(db, 'communityCompletions', dailyDocId(cred.user.uid)),
        {
          userId: cred.user.uid,
          name: displayName,
          endedAt: serverTimestamp(),
          duration: TOTAL_TIME,
          day,
          month,
        },
        { merge: true },
      );

      console.log(`[seed] wrote completion #${i} (${displayName})`);
    } catch (e) {
      console.error('[seed] error:', e?.message ?? e);
    }

    const waitMs = randInt(10_000, 30_000);
    await sleep(waitMs);
  }
}

main().catch((e) => {
  console.error('[seed] fatal:', e?.message ?? e);
  process.exit(1);
});







