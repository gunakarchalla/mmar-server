// Compare two captures. Arrays of objects are matched by uuid where possible, so
// that a different but equivalent ordering is reported separately from a real
// difference in content.
const fs=require('fs');
const A=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const Bb=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
let diffs=0, orderOnly=0;
// Set when the rows were written, so they differ between two seeded databases.
// Nothing about how a read is executed can change them.
const VOLATILE=new Set(['creation_time','modification_time']);
const key=o => (o && typeof o==='object' && (o.uuid ?? o.uuid_metaobject)) || undefined;
function cmp(a,b,p){
  if (a===b) return;
  if (a===null||b===null||a===undefined||b===undefined||typeof a!=='object'||typeof b!=='object'){
    if (JSON.stringify(a)!==JSON.stringify(b)){ diffs++; if(diffs<=40) console.log(`  DIFF ${p}: ${JSON.stringify(a)?.slice(0,60)} != ${JSON.stringify(b)?.slice(0,60)}`);} return;
  }
  if (Array.isArray(a)!==Array.isArray(b)){ diffs++; console.log(`  DIFF ${p}: array vs object`); return; }
  if (Array.isArray(a)){
    if (a.length!==b.length){ diffs++; console.log(`  DIFF ${p}: length ${a.length} != ${b.length}`); return; }
    const ka=a.map(key), kb=b.map(key);
    if (ka.every(k=>k!==undefined) && kb.every(k=>k!==undefined)){
      const sa=[...ka].sort().join(','), sb=[...kb].sort().join(',');
      if (sa!==sb){ diffs++; console.log(`  DIFF ${p}: different members`); return; }
      if (ka.join(',')!==kb.join(',')){ orderOnly++; if(orderOnly<=5) console.log(`  ORDER ${p}: same members, different order`); }
      const mb=new Map(b.map(o=>[key(o),o]));
      a.forEach(o=>cmp(o,mb.get(key(o)),`${p}[${key(o)?.slice(0,8)}]`));
      return;
    }
    a.forEach((o,i)=>cmp(o,b[i],`${p}[${i}]`)); return;
  }
  for (const k of new Set([...Object.keys(a),...Object.keys(b)])){
    if (VOLATILE.has(k)) continue;
    if (!(k in a)){ diffs++; if(diffs<=40) console.log(`  ONLY-IN-B ${p}.${k} = ${JSON.stringify(b[k])?.slice(0,60)}`); continue; }
    if (!(k in b)){ diffs++; if(diffs<=40) console.log(`  ONLY-IN-A ${p}.${k} = ${JSON.stringify(a[k])?.slice(0,60)}`); continue; }
    cmp(a[k],b[k],`${p}.${k}`);
  }
}
for (const name of new Set([...Object.keys(A),...Object.keys(Bb)])) cmp(A[name],Bb[name],name);
console.log(diffs===0 ? `EQUIVALENT (${orderOnly} array-order differences)` : `${diffs} DIFFERENCES, ${orderOnly} order-only`);
process.exit(diffs===0?0:1);
