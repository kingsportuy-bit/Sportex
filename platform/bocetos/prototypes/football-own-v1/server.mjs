import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {basicLayerNames} from './basic-renderer.js';
const root=new URL('./',import.meta.url),port=Number(process.env.SPORTEX_PROTOTYPE_PORT||4321);
const allowed=new Map([['/','index.html'],...['index.html','style.css','app.js','anchor-editor.js','anchors.js','assets.js','material.js','renderer.js','basic-renderer.js','basic-front-defaults.js','README.md','comparison.jpg','basic-comparison.jpg','assets/body-football.png','assets/collar-round.png','assets/collar-v.png','assets/collar-polo.png'].map(p=>['/'+p,p]),...['front','back'].flatMap(side=>basicLayerNames.map(name=>[`/base/${side}-${name}.png`,`../../public/assets/psd-kit/${side}-${name}.png`]))]);
const mime={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',md:'text/plain; charset=utf-8',png:'image/png',jpg:'image/jpeg'};
const server=http.createServer(async(req,res)=>{
  const name=allowed.get(new URL(req.url,'http://localhost').pathname);
  if(!name||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end();return;}
  try{const bytes=await readFile(new URL(name,root));res.writeHead(200,{'content-type':mime[name.split('.').pop()]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'self'; img-src 'self' blob: data:; style-src 'self'; script-src 'self'; connect-src 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404);res.end();}
});
server.listen(port,'127.0.0.1',()=>console.log(`SPORTEX_PROTO=http://127.0.0.1:${port}/ ROOT=${fileURLToPath(root)}`));
