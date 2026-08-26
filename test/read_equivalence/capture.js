// Capture the metamodel and scene-instance GET output for a set of fixtures, for
// before/after comparison.
require('dotenv').config({path:'.env.test'});
const fs=require('fs');
const scene_fixture=require('./scene_fixture');
const B='http://localhost:8000';
const OUT=process.argv[2];
const FIXTURES=[
  ['bpmn','test/unitTests/models/bpmn_metamodel.json'],
  ['archimate_core','test/unitTests/models/ArchiMate_coreLayers_metamodel.json'],
  ['flowscene','test/unitTests/models/FlowScene.json'],
  ['e3value','test/unitTests/models/e3-value_metamodel.json'],
];
(async()=>{
  const tok=await (await fetch(`${B}/login/signin`,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:'admin',password:'admin'})})).json();
  const H={'Content-Type':'application/json',Authorization:`Bearer ${tok}`};
  const out={};
  for (const [name,path] of FIXTURES) {
    const model=JSON.parse(fs.readFileSync(path,'utf8'));
    const st=(Array.isArray(model)?model[0]:model).uuid;
    const p=await fetch(`${B}/metamodel/sceneTypes/`,{method:'POST',headers:H,body:JSON.stringify(model)});
    const g=await fetch(`${B}/metamodel/sceneTypes/${st}`,{headers:H});
    out[name]={post:p.status,get:g.status,uuid:st,body:await g.json()};
    process.stdout.write(`  ${name}: POST ${p.status} GET ${g.status}\n`);
  }
  // The instance read. The four fixtures above only exercise /metamodel, so a
  // change to the instance read or the instance write path was invisible here.
  const seeded=await scene_fixture.seed(B,H);
  const gs=await fetch(`${B}/instances/sceneInstances/${scene_fixture.ids.scene_instance}`,{headers:H});
  out.scene_instance={post:seeded.scene_status,metamodel_post:seeded.metamodel_status,
    get:gs.status,uuid:scene_fixture.ids.scene_instance,body:await gs.json()};
  process.stdout.write(`  scene_instance: POST ${seeded.scene_status} GET ${gs.status}\n`);
  fs.writeFileSync(OUT, JSON.stringify(out,null,1));
  console.log('captured ->', OUT);
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
