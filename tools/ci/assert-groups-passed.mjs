import { findBrokenJobs, readJobResults } from './job-results.mjs';

const broken = findBrokenJobs(readJobResults());

if (broken.length > 0) {
  console.error(`Groups that did not pass: ${broken.join(', ')}`);
  process.exit(1);
}

console.log('Every group passed.');
