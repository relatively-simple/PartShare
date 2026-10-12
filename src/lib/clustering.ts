import type { Post } from './types';

export interface GroupedPost {
  id: string;
  canonicalTitle: string;
  category: Post['category'];
  type: Post['type'];
  model_number: string | null;
  totalQuantity: number;
  distinctAuthorsCount: number;
  posts: Post[];
}

// Common electronics noise words to strip when finding the core component signature
const NOISE_WORDS = new Set([
  'board', 'module', 'dev', 'devkit', 'development', 'kit', 'sensor',
  'shield', 'motor', 'breakout', 'v1', 'v2', 'v3', 'r1', 'r2', 'r3',
  'clone', 'original', 'for', 'with', 'and', 'piece', 'pieces', 'pcs',
  'new', 'used', 'working', 'diy', 'arduino', 'compatible'
]);

/**
 * Extracts a normalized signature from a post's title and model number.
 * e.g., "ESP32 DevKit V1" -> "esp32"
 * e.g., "N20 motor 500RPM" -> "n20"
 * e.g., "Arduino Uno R3" -> "uno"
 */
export function extractPartSignature(title: string, modelNumber?: string | null): string {
  const combined = `${modelNumber || ''} ${title}`.toLowerCase();
  
  // Normalize characters
  const clean = combined.replace(/[^a-z0-9\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(Boolean);
  
  // Keep meaningful core technical identifiers (e.g. containing digits or specific chip names)
  const coreTokens = tokens.filter(t => !NOISE_WORDS.has(t));
  
  if (coreTokens.length === 0) {
    return tokens[0] || 'part';
  }

  // Prioritize tokens with numbers like esp32, n20, atmega328, sg90, l298n
  const tokenWithDigits = coreTokens.find(t => /\d/.test(t) && t.length >= 2);
  if (tokenWithDigits) {
    return tokenWithDigits;
  }

  return coreTokens.slice(0, 2).sort().join('_');
}

/**
 * Checks if two posts refer to the same physical hardware component.
 */
export function arePostsSimilar(a: Post, b: Post): boolean {
  if (a.category !== b.category || a.type !== b.type) {
    return false;
  }

  // Exact model_key match if present and meaningful
  if (a.model_key && b.model_key && a.model_key.length >= 3 && a.model_key === b.model_key) {
    return true;
  }

  const sigA = extractPartSignature(a.title, a.model_number);
  const sigB = extractPartSignature(b.title, b.model_number);

  if (sigA.length >= 2 && sigB.length >= 2) {
    if (sigA === sigB) return true;
    // Substring matching only allowed for distinct identifiers of 4+ characters
    if (Math.min(sigA.length, sigB.length) >= 4) {
      if (sigA.includes(sigB) || sigB.includes(sigA)) return true;
    }
  }

  return false;
}

/**
 * Clusters an array of posts into smart grouped component entries.
 */
export function clusterPosts(posts: Post[]): GroupedPost[] {
  const groups: GroupedPost[] = [];

  for (const post of posts) {
    let matchedGroup = groups.find(g => arePostsSimilar(g.posts[0], post));

    if (matchedGroup) {
      matchedGroup.posts.push(post);
      matchedGroup.totalQuantity += post.quantity;
      
      const authors = new Set(matchedGroup.posts.map(p => p.author_name || p.user_id));
      matchedGroup.distinctAuthorsCount = authors.size;

      // Keep the most concise title as canonical
      if (post.title.length < matchedGroup.canonicalTitle.length && post.title.length >= 4) {
        matchedGroup.canonicalTitle = post.title;
      }
      if (!matchedGroup.model_number && post.model_number) {
        matchedGroup.model_number = post.model_number;
      }
    } else {
      groups.push({
        id: `group_${post.id}`,
        canonicalTitle: post.title,
        category: post.category,
        type: post.type,
        model_number: post.model_number || null,
        totalQuantity: post.quantity,
        distinctAuthorsCount: 1,
        posts: [post]
      });
    }
  }

  return groups;
}
