import { reindex } from './actions.mjs';

function main() {
  const { total, shelves } = reindex();
  if (total === 0) {
    console.log('No models on any shelf. The studio page will show its empty state.');
    return 0;
  }
  console.log(`${total} models indexed`);
  for (const [shelf, count] of Object.entries(shelves)) {
    console.log(`  ${shelf.padEnd(8)} ${count}`);
  }
  return 0;
}

process.exit(main());
