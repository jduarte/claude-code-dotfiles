#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SOURCES_DIR = path.join(__dirname, '..', 'data', 'sources');
const ORIGINAL_GLOSSARY_PATH = path.join(__dirname, '..', 'data', 'glossary.original.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'glossary.json');

// Use original glossary if it exists, otherwise skip loading existing
const USE_ORIGINAL_GLOSSARY = fs.existsSync(ORIGINAL_GLOSSARY_PATH);

// Category priority for reasoning (more specific > generic)
const CATEGORY_SPECIFICITY = {
  'GitHub Repos': 1,      // Least specific - just means "from a repo"
  'Engineering': 5,
  'Product': 5,
  'Sales': 5,
  'Finance': 5,
  'Security': 5,
  'Marketing': 5,
  'Customer Success': 5,
  'Partners': 5,
  'Organization': 5,
  'Industry': 5,
  'Retail': 5,
  'Amazon': 6,            // More specific domain
};

function loadSourceFiles() {
  const files = fs.readdirSync(SOURCES_DIR).filter(f => f.endsWith('.json'));
  const allTerms = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(SOURCES_DIR, file), 'utf8');
      const terms = JSON.parse(content);
      if (Array.isArray(terms)) {
        for (const term of terms) {
          // Normalize property names (e.g., 'related' -> 'relatedTerms')
          const normalized = { ...term };
          if (normalized.related && !normalized.relatedTerms) {
            normalized.relatedTerms = normalized.related;
          }
          delete normalized.related;
          allTerms.push({ ...normalized, _source: file });
        }
      }
    } catch (e) {
      console.error(`Error loading ${file}: ${e.message}`);
    }
  }

  return allTerms;
}

function loadExistingGlossary() {
  if (!USE_ORIGINAL_GLOSSARY) {
    console.log('No original glossary found, starting fresh from sources only');
    return [];
  }
  try {
    const content = fs.readFileSync(ORIGINAL_GLOSSARY_PATH, 'utf8');
    const glossary = JSON.parse(content);
    return glossary.terms || [];
  } catch (e) {
    console.error(`Error loading glossary: ${e.message}`);
    return [];
  }
}

function normalizeAcronym(acronym) {
  // Remove any existing disambiguation suffix like "(Architecture)" or "(Sales)"
  return acronym.trim().replace(/\s*\([^)]+\)\s*$/, '').trim();
}

function groupByAcronym(terms) {
  const groups = new Map();

  for (const term of terms) {
    const key = normalizeAcronym(term.acronym);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(term);
  }

  return groups;
}

function extractKeyPhrases(description) {
  if (!description) return new Set();
  // Extract key identifying phrases (simplified)
  const phrases = new Set();
  const lower = description.toLowerCase();

  // Look for defining patterns
  const patterns = [
    /(?:is |are |refers to |means )([^.]+)/gi,
    /(?:a |an |the )([a-z]+ (?:service|team|tool|platform|system|process|role|metric))/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(lower)) !== null) {
      phrases.add(match[1].trim());
    }
  }

  return phrases;
}

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/records?\b/g, 'record')  // Normalize singular/plural
    .replace(/services?\b/g, 'service')
    .replace(/teams?\b/g, 'team')
    .replace(/representatives?\b/g, 'representative')
    .trim();
}

function areSameConcept(term1, term2) {
  // Check if two terms with the same acronym refer to the same concept

  // Normalize and compare names
  const name1 = normalizeName(term1.name);
  const name2 = normalizeName(term2.name);

  if (name1 === name2) return true;

  // Check for significant word overlap in names
  const words1 = new Set(name1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(name2.split(/\s+/).filter(w => w.length > 2));
  const intersection = [...words1].filter(w => words2.has(w));

  // High overlap means same concept
  if (intersection.length >= 2) return true;
  if (words1.size <= 2 && words2.size <= 2 && intersection.length >= 1) return true;

  // Check if one is essentially a subset (e.g., "Decision Record" vs "Architecture Decision Record")
  const smaller = words1.size < words2.size ? words1 : words2;
  const larger = words1.size < words2.size ? words2 : words1;
  const subsetMatch = [...smaller].filter(w => larger.has(w)).length;
  if (subsetMatch === smaller.size && smaller.size >= 2) return true;

  // Check categories - if very different domains, likely different concepts
  const cat1 = term1.category || '';
  const cat2 = term2.category || '';

  const incompatibleCategories = [
    ['Sales', 'Engineering'],
    ['Sales', 'GitHub Repos'],
    ['Finance', 'Engineering'],
    ['Sales', 'Security'],
  ];

  for (const [a, b] of incompatibleCategories) {
    if ((cat1 === a && cat2 === b) || (cat1 === b && cat2 === a)) {
      // Categories suggest different concepts - check names more carefully
      if (name1 !== name2 && intersection.length === 0) {
        return false;
      }
    }
  }

  return true;
}

function combineDescriptions(descriptions) {
  // Filter out empty/undefined
  const valid = descriptions.filter(d => d && d.trim());
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];

  // Start with the longest description as base
  valid.sort((a, b) => b.length - a.length);
  let combined = valid[0];

  // Extract unique sentences from other descriptions
  const baseSentences = new Set(
    combined.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 10)
  );

  for (let i = 1; i < valid.length; i++) {
    const sentences = valid[i].split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);

    for (const sentence of sentences) {
      const normalized = sentence.toLowerCase();
      // Check if this sentence adds new information
      let isNew = true;
      for (const base of baseSentences) {
        // Simple similarity check - if >60% words overlap, skip
        const sWords = new Set(normalized.split(/\s+/));
        const bWords = new Set(base.split(/\s+/));
        const overlap = [...sWords].filter(w => bWords.has(w)).length;
        if (overlap / Math.max(sWords.size, bWords.size) > 0.6) {
          isNew = false;
          break;
        }
      }

      if (isNew) {
        combined += ' ' + sentence + '.';
        baseSentences.add(normalized);
      }
    }
  }

  return combined.trim();
}

function mergeLinks(linksArrays) {
  const seen = new Map();

  for (const links of linksArrays) {
    if (!Array.isArray(links)) continue;
    for (const link of links) {
      if (link.url && !seen.has(link.url)) {
        seen.set(link.url, link);
      }
    }
  }

  const result = [...seen.values()];
  return result.length > 0 ? result : undefined;
}

function mergeRelatedTerms(arrays) {
  const seen = new Set();

  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    for (const term of arr) {
      seen.add(term);
    }
  }

  const result = [...seen].sort();
  return result.length > 0 ? result : undefined;
}

function normalizeTermProperties(term) {
  // Handle 'related' -> 'relatedTerms' rename
  if (term.related && !term.relatedTerms) {
    term.relatedTerms = term.related;
  }
  delete term.related;

  // Remove any other non-standard properties
  const validKeys = ['acronym', 'name', 'description', 'category', 'owner', 'relatedTerms', 'links'];
  for (const key of Object.keys(term)) {
    if (!validKeys.includes(key)) {
      delete term[key];
    }
  }

  return term;
}

function pickBestCategory(categories) {
  // Filter out undefined/null
  const valid = categories.filter(c => c);
  if (valid.length === 0) return 'Engineering'; // Default

  // Count occurrences
  const counts = new Map();
  for (const cat of valid) {
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  // Pick the most specific category that appears
  let best = valid[0];
  let bestScore = CATEGORY_SPECIFICITY[best] || 3;

  for (const [cat, count] of counts) {
    const score = CATEGORY_SPECIFICITY[cat] || 3;
    // Prefer more specific categories, or if tied, more frequent
    if (score > bestScore || (score === bestScore && count > counts.get(best))) {
      best = cat;
      bestScore = score;
    }
  }

  return best;
}

function pickBestOwner(owners) {
  const valid = owners.filter(o => o);
  if (valid.length === 0) return undefined;

  // Return most common, or first if tied
  const counts = new Map();
  for (const owner of valid) {
    counts.set(owner, (counts.get(owner) || 0) + 1);
  }

  let best = valid[0];
  for (const [owner, count] of counts) {
    if (count > (counts.get(best) || 0)) {
      best = owner;
    }
  }

  return best;
}

function mergeTermGroup(terms) {
  if (terms.length === 1) {
    const { _source, ...term } = terms[0];
    return [term];
  }

  // Check if all terms refer to the same concept
  const conceptGroups = [];

  for (const term of terms) {
    let foundGroup = false;
    for (const group of conceptGroups) {
      if (areSameConcept(term, group[0])) {
        group.push(term);
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      conceptGroups.push([term]);
    }
  }

  // Merge each concept group
  const results = [];

  for (let i = 0; i < conceptGroups.length; i++) {
    const group = conceptGroups[i];

    // Pick best name (longest, most descriptive)
    const names = group.map(t => t.name).filter(n => n);
    const bestName = names.sort((a, b) => b.length - a.length)[0] || group[0].acronym;

    // Combine descriptions
    const description = combineDescriptions(group.map(t => t.description));

    // Pick best category
    const category = pickBestCategory(group.map(t => t.category));

    // Pick owner if any
    const owner = pickBestOwner(group.map(t => t.owner));

    // Merge links and related terms
    const links = mergeLinks(group.map(t => t.links));
    const relatedTerms = mergeRelatedTerms(group.map(t => t.relatedTerms));

    // Determine acronym - add disambiguation if multiple concepts
    let acronym = normalizeAcronym(group[0].acronym);  // Always use normalized base acronym
    if (conceptGroups.length > 1) {
      // Need disambiguation - use a distinguishing word from the name
      const distinguisher = findDistinguisher(bestName, conceptGroups, i, category);
      if (distinguisher) {
        acronym = `${acronym} (${distinguisher})`;
      }
    }

    const merged = { acronym, name: bestName, category };
    if (description) merged.description = description;
    if (owner) merged.owner = owner;
    if (relatedTerms) merged.relatedTerms = relatedTerms;
    if (links) merged.links = links;

    results.push(merged);
  }

  return results;
}

function findDistinguisher(name, allGroups, currentIndex, category) {
  // Find a word that distinguishes this concept from others
  const otherNames = allGroups
    .filter((_, i) => i !== currentIndex)
    .flatMap(g => g.map(t => (t.name || '').toLowerCase()))
    .join(' ');

  const otherWords = new Set(otherNames.split(/\s+/).filter(w => w.length > 2));

  // Clean the name - remove any existing parenthetical notes
  const cleanName = (name || '').replace(/\s*\([^)]+\)\s*/g, ' ').trim();
  const words = cleanName.split(/\s+/);

  // Skip common words
  const skipWords = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'was', 'salsify']);

  for (const word of words) {
    const lower = word.toLowerCase();
    if (word.length > 3 && !otherWords.has(lower) && !skipWords.has(lower)) {
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
  }

  // Fall back to category-based disambiguation if categories differ
  const otherCategories = new Set(
    allGroups.filter((_, i) => i !== currentIndex).flatMap(g => g.map(t => t.category))
  );
  if (category && !otherCategories.has(category)) {
    return category;
  }

  // Last resort - use index number
  return `${currentIndex + 1}`;
}

function validateTerm(term) {
  // Basic validation against schema requirements
  if (!term.acronym || !term.name || !term.category) {
    return false;
  }
  if (term.acronym.length > 50 || term.name.length > 200) {
    return false;
  }
  if (term.description && term.description.length > 2000) {
    term.description = term.description.substring(0, 1997) + '...';
  }

  // Remove any non-standard properties to match schema
  const validKeys = ['acronym', 'name', 'description', 'category', 'owner', 'relatedTerms', 'links'];
  for (const key of Object.keys(term)) {
    if (!validKeys.includes(key)) {
      delete term[key];
    }
  }

  return true;
}

function main() {
  console.log('Loading source files...');
  const sourceTerms = loadSourceFiles();
  console.log(`Loaded ${sourceTerms.length} terms from source files`);

  console.log('Loading existing glossary...');
  const existingTerms = loadExistingGlossary();
  console.log(`Loaded ${existingTerms.length} terms from existing glossary`);

  // Combine all terms
  const allTerms = [...sourceTerms, ...existingTerms.map(t => ({ ...t, _source: 'glossary.json' }))];
  console.log(`Total terms to process: ${allTerms.length}`);

  // Group by acronym
  const groups = groupByAcronym(allTerms);
  console.log(`Found ${groups.size} unique acronyms`);

  // Count duplicates
  let duplicates = 0;
  for (const [acronym, terms] of groups) {
    if (terms.length > 1) {
      duplicates++;
    }
  }
  console.log(`Acronyms with multiple entries: ${duplicates}`);

  // Merge each group
  console.log('\nMerging terms...');
  const mergedTerms = [];
  const disambiguated = [];

  for (const [acronym, terms] of groups) {
    const merged = mergeTermGroup(terms);

    if (merged.length > 1) {
      disambiguated.push({ acronym, count: merged.length, terms: merged.map(t => t.name) });
    }

    for (const term of merged) {
      if (validateTerm(term)) {
        mergedTerms.push(term);
      } else {
        console.warn(`Invalid term skipped: ${term.acronym}`);
      }
    }
  }

  // Deduplicate by acronym (in case of any remaining duplicates)
  const seenAcronyms = new Map();
  const dedupedTerms = [];
  for (const term of mergedTerms) {
    if (seenAcronyms.has(term.acronym)) {
      // Merge with existing
      const existing = seenAcronyms.get(term.acronym);
      existing.description = combineDescriptions([existing.description, term.description]);
      existing.links = mergeLinks([existing.links, term.links]);
      existing.relatedTerms = mergeRelatedTerms([existing.relatedTerms, term.relatedTerms]);
    } else {
      seenAcronyms.set(term.acronym, term);
      dedupedTerms.push(term);
    }
  }

  // Sort alphabetically by acronym
  dedupedTerms.sort((a, b) => a.acronym.localeCompare(b.acronym));

  // Report disambiguations
  if (disambiguated.length > 0) {
    console.log('\nDisambiguated acronyms:');
    for (const d of disambiguated) {
      console.log(`  ${d.acronym}: ${d.terms.join(' | ')}`);
    }
  }

  // Build output
  const output = {
    "$schema": "./glossary.schema.json",
    terms: dedupedTerms
  };

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');

  console.log(`\nMerge complete!`);
  console.log(`Total unique terms: ${dedupedTerms.length}`);
  console.log(`Output written to: ${OUTPUT_PATH}`);

  // Category breakdown
  const catCounts = new Map();
  for (const term of dedupedTerms) {
    catCounts.set(term.category, (catCounts.get(term.category) || 0) + 1);
  }
  console.log('\nCategory breakdown:');
  for (const [cat, count] of [...catCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}

main();
