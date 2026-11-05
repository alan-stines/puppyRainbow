import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(root,'content.json')));
assert.equal(content.photos.length,20);
assert.equal(content.stories.length,22);
assert.equal(content.stories.filter(s=>s.new).length,10);
assert.equal(new Set(content.photos.map(p=>p.id)).size,20);
assert.equal(new Set(content.stories.map(s=>s.id)).size,22);
for (const p of content.photos) {
 assert(p.alt && p.credit && p.creditUrl.startsWith('https://unsplash.com'));
 assert(fs.statSync(path.join(root,p.src)).size > 1000);
 assert(!p.story || content.stories.some(s=>s.id===p.story));
}
for (const s of content.stories) {
 assert(content.photos.some(p=>p.id===s.photo));
 assert.equal(s.paragraphs.length,4);
 assert(s.paragraphs.every(p=>p.length>30));
}
const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
 if(!m[1].startsWith('http')) assert(fs.existsSync(path.join(root,m[1])),`Missing ${m[1]}`);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate HTML id');
assert(html.includes('role="status"'));
console.log('Content and asset checks passed: 20 photos, 22 stories, 10 new tales.');
