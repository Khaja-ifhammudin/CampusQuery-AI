import { tokenize, scoreChunk, generateLocalFallbackAnswer, retrieveContext } from '../server/rag.js';
import { readFileSync } from 'fs';

// Load active documents from db
const db = JSON.parse(readFileSync('./data/campusquery-db.json', 'utf8'));
const activeDocs = db.documents.filter(d => d.isActive);

console.log('--- UNIT TEST: RAG Retrieval & Local Fallback ---');

const query = 'According to campus regulations, can students keep dragons as pets in residence halls?';
const retrieved = retrieveContext(query, activeDocs, 3);

console.log(`Query: "${query}"`);
console.log(`Retrieved chunks count: ${retrieved.length}`);
retrieved.forEach((r, i) => {
  console.log(`  [Chunk ${i+1}] Score: ${r.score.toFixed(2)} | Doc: ${r.chunk.documentTitle} | Section: ${r.chunk.sectionTitle}`);
});

const fallbackAnswer = generateLocalFallbackAnswer(query, retrieved);
console.log(`\nFallback answer generated:`);
console.log(`"${fallbackAnswer}"`);

const doesNotHallucinate = !fallbackAnswer.toLowerCase().includes('dragons are allowed') &&
  !fallbackAnswer.toLowerCase().includes('blue line shuttle') &&
  fallbackAnswer.includes('could not find verified university documentation');

console.log(`\nLocal Fallback Unit Test Result: ${doesNotHallucinate ? 'PASS' : 'FAIL'}`);
process.exit(doesNotHallucinate ? 0 : 1);
