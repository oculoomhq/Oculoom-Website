import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const portArg=process.argv.indexOf('--port');const port=portArg>=0?Number(process.argv[portArg+1]):4173;
const base=resolve('dist');
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(base,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(base+'/')){res.writeHead(403);res.end();return;}const content=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.xml':'application/xml'})[extname(file)]||'text/plain');res.end(content);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'0.0.0.0');
