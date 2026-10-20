import {createEditorServer} from './server.mjs';
import {createLabService} from '../core/bocetos/service.mjs';
import {LabStore} from '../core/bocetos/store.mjs';
import {join} from 'node:path';
if(process.env.NODE_ENV==='production')throw new Error('Este arranque es solo para el panel local.');
const port=Number(process.env.PANEL_PORT||4319);
const lab=createLabService({store:new LabStore(join(import.meta.dirname,'private','panel','state.json'))});
createEditorServer({lab}).listen(port,'127.0.0.1',()=>console.log(`SPORTEX · Panel local: http://127.0.0.1:${port}/admin`));
