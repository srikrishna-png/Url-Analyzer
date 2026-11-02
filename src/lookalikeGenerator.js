/**
 * lookalikeGenerator.js
 * Generates homoglyphs, typosquatting permutations, and TLD swaps,
 * and performs live asynchronous DNS queries to verify which are actively registered.
 */

import dns from 'node:dns/promises';
import { parse as parseDomain } from 'tldts';

const HOMOGLYPH_MAP = {
  'a': ['а'], // Cyrillic small letter a
  'c': ['с'], // Cyrillic small letter es
  'e': ['е'], // Cyrillic small letter ie
  'i': ['і', '1', 'l'],
  'l': ['1', 'i'],
  'o': ['о', '0'], // Cyrillic small letter o
  'p': ['р'], // Cyrillic small letter er
  's': ['ѕ'],
  'x': ['х'],
  'y': ['у']
};

const COMMON_TLDS = ['com', 'co', 'cm', 'net', 'org', 'xyz', 'top', 'vip', 'info', 'cc', 'online'];

export function generateVariants(domainName) {
  const parsed = parseDomain(domainName);
  if (!parsed.domainWithoutSuffix || !parsed.publicSuffix) return [];

  const name = parsed.domainWithoutSuffix.toLowerCase();
  const tld = parsed.publicSuffix.toLowerCase();
  const variants = new Set();

  // 1. Omissions (skip one letter)
  for (let i = 0; i < name.length; i++) {
    if (name.length > 3) {
      const omitted = name.slice(0, i) + name.slice(i + 1);
      variants.add({ domain: `${omitted}.${tld}`, type: 'omission' });
    }
  }

  // 2. Transpositions (swap adjacent letters)
  for (let i = 0; i < name.length - 1; i++) {
    const chars = name.split('');
    const temp = chars[i];
    chars[i] = chars[i + 1];
    chars[i + 1] = temp;
    const swapped = chars.join('');
    if (swapped !== name) {
      variants.add({ domain: `${swapped}.${tld}`, type: 'transposition' });
    }
  }

  // 3. TLD swaps
  for (const newTld of COMMON_TLDS) {
    if (newTld !== tld) {
      variants.add({ domain: `${name}.${newTld}`, type: 'tld-swap' });
    }
  }

  // 4. Homoglyphs
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (HOMOGLYPH_MAP[char]) {
      for (const replacement of HOMOGLYPH_MAP[char]) {
        const hVariant = name.slice(0, i) + replacement + name.slice(i + 1);
        variants.add({ domain: `${hVariant}.${tld}`, type: 'homoglyph' });
      }
    }
  }

  return Array.from(variants);
}

// Check which variants actively resolve to IP addresses
export async function findActiveLookalikes(domainName, maxCheck = 20) {
  const allVariants = generateVariants(domainName);
  const selected = allVariants.slice(0, maxCheck);

  const checkSingle = async (v) => {
    try {
      const ips = await dns.resolve4(v.domain);
      return {
        domain: v.domain,
        type: v.type,
        isActive: true,
        ips
      };
    } catch {
      return {
        domain: v.domain,
        type: v.type,
        isActive: false,
        ips: []
      };
    }
  };

  const results = await Promise.all(selected.map(checkSingle));
  const activeOnly = results.filter(r => r.isActive);

  return {
    queriedCount: selected.length,
    activeCount: activeOnly.length,
    activeVariants: activeOnly,
    inactiveSample: results.filter(r => !r.isActive).slice(0, 5)
  };
}
