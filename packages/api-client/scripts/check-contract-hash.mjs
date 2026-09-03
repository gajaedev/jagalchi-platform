import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const expected = 'b629ae9d1afbe06505c4a1f841d6f382046c944ae910946771638a1da433a92e';
const contract = new URL('../contract/openapi.json', import.meta.url);
const actual = createHash('sha256').update(await readFile(contract)).digest('hex');
if (actual !== expected) {
  throw new Error(`OpenAPI contract hash mismatch: expected ${expected}, received ${actual}`);
}
console.log(`OpenAPI contract verified: ${actual}`);
