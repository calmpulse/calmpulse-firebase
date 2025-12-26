export function isFirestoreApiDisabledError(e: unknown): boolean {
  const msg =
    typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : String(e);

  // Firebase sometimes surfaces this exact text when the API is disabled.
  if (msg.includes('Cloud Firestore API has not been used')) return true;
  if (msg.includes('firestore.googleapis.com')) return true;

  return false;
}

export function formatFirestoreErrorForUi(e: unknown): string {
  const msg =
    typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : String(e);

  // Keep the UI message short and actionable.
  if (isFirestoreApiDisabledError(e)) {
    return 'Firestore is disabled for this Firebase project. Enable the Cloud Firestore API (or create Firestore in Firebase console), then refresh.';
  }

  // Generic fallback (avoid dumping huge stacks into UI).
  return msg.length > 160 ? `${msg.slice(0, 160)}…` : msg;
}







