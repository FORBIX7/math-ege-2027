const PREFIX="mathematics:"+self.registration.scope+":";
const CACHE=PREFIX+"67c5c9a11851";
const FILES=["./", "./app-v2.js", "./concepts.js", "./course.js", "./data.js", "./engine-v2.1.js", "./engine.js", "./hints.js", "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon.svg", "./index.html", "./manifest.webmanifest", "./panels.js", "./style-v2.css", "./vendor/fonts/KaTeX_AMS-Regular.woff2", "./vendor/fonts/KaTeX_Caligraphic-Bold.woff2", "./vendor/fonts/KaTeX_Caligraphic-Regular.woff2", "./vendor/fonts/KaTeX_Fraktur-Bold.woff2", "./vendor/fonts/KaTeX_Fraktur-Regular.woff2", "./vendor/fonts/KaTeX_Main-Bold.woff2", "./vendor/fonts/KaTeX_Main-BoldItalic.woff2", "./vendor/fonts/KaTeX_Main-Italic.woff2", "./vendor/fonts/KaTeX_Main-Regular.woff2", "./vendor/fonts/KaTeX_Math-BoldItalic.woff2", "./vendor/fonts/KaTeX_Math-Italic.woff2", "./vendor/fonts/KaTeX_SansSerif-Bold.woff2", "./vendor/fonts/KaTeX_SansSerif-Italic.woff2", "./vendor/fonts/KaTeX_SansSerif-Regular.woff2", "./vendor/fonts/KaTeX_Script-Regular.woff2", "./vendor/fonts/KaTeX_Size1-Regular.woff2", "./vendor/fonts/KaTeX_Size2-Regular.woff2", "./vendor/fonts/KaTeX_Size3-Regular.woff2", "./vendor/fonts/KaTeX_Size4-Regular.woff2", "./vendor/fonts/KaTeX_Typewriter-Regular.woff2", "./vendor/KATEX-LICENSE.txt", "./vendor/katex.min.css", "./vendor/katex.min.js", "./vendor/QR-LICENSE.txt", "./vendor/qrcode.js", "./visuals.js"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(response=>{
  if(response.ok){const copy=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}
  return response;
 }).catch(()=>caches.match(e.request).then(r=>r||Promise.reject(Error('Resource not downloaded')))));
});
