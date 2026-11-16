const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {randomUUID}=require('node:crypto');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX},
}).outputText,f);
require.extensions['.tsx']=require.extensions['.ts'];
const {translate}=require('../lib/i18n.tsx');
const {english}=require('../lib/translations.ts');
const root=path.resolve(__dirname,'..');
function all(tree,predicate){
 if(!tree||typeof tree!=='object')return [];
 const children=[tree.props?.children].flat(Infinity).flatMap(child=>all(child,predicate));
 return predicate(tree)?[tree,...children]:children;
}
function text(tree){
 if(tree===null||tree===undefined||typeof tree==='boolean')return '';
 if(typeof tree!=='object')return String(tree);
 return [tree.props?.children].flat(Infinity).map(text).join(' ');
}
// Exercise the actual component event handlers and transitions without a DOM dependency.
function harness(locale='tr',fetcher=async()=>{throw new Error('offline');}){
 const values=[];let cursor=0;const requests=[];
 const React={useEffect:()=>{},useState(initial){const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],value=>{values[i]=typeof value==='function'?value(values[i]):value;}];},useRef(initial){const i=cursor++;return values[i]??(values[i]={current:initial});}};
 const jsx=(type,props)=>({type,props});const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,'components/ProductFeedbackModal.tsx'),'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX},
 }).outputText,{
  module,exports:module.exports,AbortController,crypto:{randomUUID},window:{setTimeout,clearTimeout},
  localStorage:new Proxy({},{get(){assert.fail('General feedback must not access personal browser storage');}}),
  fetch:async(url,options)=>{requests.push({url,options});return fetcher(url,options);},
  require:name=>name==='react'?React:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='@/lib/i18n'?{useLocale:()=>({locale,t:value=>translate(value,locale)})}:require(name.startsWith('@/')?path.join(root,name.slice(2)+'.ts'):name),
 });
 let closed=false;
 const render=()=>{cursor=0;return module.exports.ProductFeedbackModal({onClose:()=>{closed=true;}});};
 return {render,requests,closed:()=>closed};
}
const event={preventDefault(){}};
function preview(h,description='A reproducible problem with the layout'){
 let tree=h.render();all(tree,n=>n.type==='textarea')[0].props.onChange({target:{value:description}});
 tree=h.render();all(tree,n=>n.type==='form')[0].props.onSubmit(event);return h.render();
}
test('opening, editing and previewing send nothing; an explicit storage agreement and submit are both required',async()=>{
 const h=harness(),tree=preview(h);
 assert.equal(h.requests.length,0);
 assert.match(text(tree),/Göndermeden önce kontrol et/);
 assert.ok(all(tree,n=>n.type==='button'&&n.props.type==='submit')[0].props.disabled);
 await all(tree,n=>n.type==='form')[0].props.onSubmit(event);
 assert.equal(h.requests.length,0);
 all(tree,n=>n.type==='input'&&n.props.type==='checkbox')[0].props.onChange({target:{checked:true}});
 assert.equal(h.requests.length,0,'checking consent alone does not send');
 await all(h.render(),n=>n.type==='form')[0].props.onSubmit(event);
 assert.equal(h.requests.length,1);
 assert.deepEqual(Object.keys(JSON.parse(h.requests[0].options.body)).sort(),['version','submissionId','category','description','steps','locale','consent'].sort());
});
test('failed save keeps the reviewed text and ID; explicit retry receives a valid matching receipt',async()=>{
 let attempt=0;
 const h=harness('en',async(url,{body})=>++attempt===1?{status:503,ok:false}:{status:201,ok:true,json:async()=>({saved:true,id:JSON.parse(body).submissionId})});
 let tree=preview(h);
 all(tree,n=>n.type==='input')[0].props.onChange({target:{checked:true}});
 await all(h.render(),n=>n.type==='form')[0].props.onSubmit(event);
 tree=h.render();assert.match(text(tree),/We could not confirm the save/);assert.match(text(tree),/A reproducible problem/);
 await all(tree,n=>n.type==='form')[0].props.onSubmit(event);
 tree=h.render();assert.match(text(tree),/Your report has been saved/);
 assert.equal(h.requests[0].options.body,h.requests[1].options.body);
 assert.equal(JSON.parse(h.requests[0].options.body).locale,'en');
});
test('editing a preview requires a new agreement and cannot silently send the previous snapshot',()=>{
 const h=harness();let tree=preview(h);
 all(tree,n=>n.type==='input')[0].props.onChange({target:{checked:true}});
 all(h.render(),n=>n.type==='button'&&text(n)==='Düzenle')[0].props.onClick();
 tree=h.render();assert.equal(all(tree,n=>n.type==='textarea')[0].props.value,'A reproducible problem with the layout');
 all(tree,n=>n.type==='form')[0].props.onSubmit(event);
 tree=h.render();assert.equal(all(tree,n=>n.type==='input')[0].props.checked,false);
 assert.equal(h.requests.length,0);
});
test('rate limit and malformed success stay recoverable instead of showing a false saved message',async()=>{
 for(const response of [{status:429,ok:false},{status:200,ok:true,json:async()=>({saved:true,id:randomUUID()})}]){
  const h=harness('en',async()=>response);let tree=preview(h);
  all(tree,n=>n.type==='input')[0].props.onChange({target:{checked:true}});
  await all(h.render(),n=>n.type==='form')[0].props.onSubmit(event);
  tree=h.render();assert.doesNotMatch(text(tree),/Your report has been saved/);assert.equal(all(tree,n=>n.type==='form').length,1);assert.equal(h.requests.length,1);
 }
});
test('both languages cover every product-feedback UI message; input and preview remain plain text',()=>{
 const source=fs.readFileSync(path.join(root,'components/ProductFeedbackModal.tsx'),'utf8');
 const strings=[...source.matchAll(/(?:t|setMessage)\('([^']+)'\)/g)].map(m=>m[1]);
 for(const label of strings)assert.ok(english[label],`Missing English: ${label}`);
 for(const locale of ['tr','en']){
  const h=harness(locale),tree=preview(h,'<script>private text stays literal</script>');
  assert.ok(text(tree).includes('<script>private text stays literal</script>'));
  assert.equal(all(tree,n=>n.props?.dangerouslySetInnerHTML).length,0);
 }
});
test('the report dialog has native focus/Escape semantics and scoped mobile input, viewport and touch rules',()=>{
 const h=harness(),tree=h.render();assert.equal(tree.type,'dialog');assert.equal(tree.props['aria-labelledby'],'product-feedback-title');
 tree.props.onCancel(event);assert.equal(h.closed(),true);
 const css=fs.readFileSync(path.join(root,'app/globals.css'),'utf8').split('/* Product reports')[1];
 assert.match(css,/100dvh/);assert.match(css,/font-size: 16px/);assert.match(css,/min-height: 44px/);assert.match(css,/safe-area-inset-bottom/);assert.match(css,/overflow-wrap: anywhere/);
 const navbar=fs.readFileSync(path.join(root,'components/Navbar.tsx'),'utf8');
 assert.match(navbar,/Kombin değerlendirmesi/);assert.match(navbar,/Hata bildir \/ Öneri paylaş/);
 const page=fs.readFileSync(path.join(root,'app/page.tsx'),'utf8');
 assert.match(page,/product-feedback-entry/);assert.match(page,/isProductFeedbackOpen && <ProductFeedbackModal/);
});
test('Compose keeps reports persistent and grants the operator tool a read-only offline mount',()=>{
 const compose=fs.readFileSync(path.join(root,'docker-compose.yml'),'utf8');
 assert.match(compose,/reports_data:\/app\/\.data\/reports/);
 assert.match(compose,/reports_data:\/reports:ro/);assert.match(compose,/network_mode: "none"/);
 const docker=fs.readFileSync(path.join(root,'Dockerfile'),'utf8');assert.match(docker,/chmod 700 \/app\/\.data\/reports/);assert.match(docker,/COPY scripts\/feedback/);
});
