// src/lib/findStory.ts
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Get the download URL for a story audio file from Firebase Storage
 * @param storyId - The ID of the story (1, 2, 3, 4, etc.)
 * @returns Promise<string | null> - The download URL or null if not found
 */
export async function findStoryURL(storyId: number): Promise<string | null> {
  // Story files should be named: story1.mp3, story2.mp3, etc. in the stories/ folder
  const path = `stories/story${storyId}.mp3`;
  try {
    const url = await getDownloadURL(ref(storage, path));
    console.log(`✅ Found story ${storyId} at: ${path}`);
    return url;
  } catch (e) {
    console.warn(`❌ Story audio not found (${path})`, e);
    return null;
  }
}

/**
 * Get download URLs for all stories
 * @returns Promise<Array<{id: number, url: string | null}>>
 */
export async function findAllStoryURLs(): Promise<Array<{id: number, url: string | null}>> {
  const storyIds = [1, 2, 3, 4];
  const promises = storyIds.map(async (id) => ({
    id,
    url: await findStoryURL(id),
  }));
  return Promise.all(promises);
}

