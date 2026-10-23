const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync(require.resolve('../providers/goku-lattin.js'), 'utf8');
function load(fetch) {
  const ctx = {module:{exports:{}},Promise,fetch,TMDB_API_KEY:'runtime-test-key'};
  vm.createContext(ctx); vm.runInContext(code, ctx); return ctx;
}
function encode(cfg) {
  let s=Buffer.from(JSON.stringify(cfg)).toString('base64').split('').reverse()
    .map(c=>String.fromCharCode(c.charCodeAt(0)+3)).join('');
  return Buffer.from(s,'binary').toString('base64').replace(/[a-zA-Z]/g,
    c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<='m'?13:-13)));
}
function response(body,url) {
  return Promise.resolve({ok:true,status:200,url,text:()=>Promise.resolve(body)});
}
const cfg = {file_code:'abc123def456',source:'https://video.example/master.m3u8',title:'Private upstream filename'};
test('encoded player config round trip without eval or atob',()=>{
  const c=load();assert.equal(c.decodeConfig(encode(cfg)).source,cfg.source);
});
test('rejects unrelated player, trailers and demo source scripts',()=>{
  const c=load();
  const html='<script>var source="https://ads.example/ad.mp4"</script>'+
    '<script type="application/json">'+JSON.stringify([encode(cfg)])+'</script>';
  assert.equal(c.playerConfig(html,'different'),null);
  assert.equal(c.playerConfig(html,cfg.file_code).source,cfg.source);
});
test('only approved online player services; never download links',()=>{
  const c=load(); const info=c.movieInfo('<a href="https://imdb.com/title/tt6685538/"></a>'+
    '<a service="OnlineVoe" data="abc123def456"></a><a service="TurboBit" data="download"></a>');
  assert.equal(info.players.length,1);assert.equal(info.imdb,'tt6685538');
});
test('minified HTML supports unquoted href, service, data and script type',()=>{
  const c=load();
  assert.equal(c.candidates('<div id=content_inside><a href=/pelicula/mavka/ >X</a><div id=sidebar><a href=/pelicula/ad/ >Ad</a>')[0],
    'https://www.cinecalidad.my/pelicula/mavka/');
  assert.equal(c.movieInfo('<a service=OnlineVoe data=abc123def456 >').players.length,1);
  assert.equal(c.playerConfig('<script type=application/json>'+JSON.stringify([encode(cfg)])+'</script>',cfg.file_code).source,cfg.source);
});
test('TV and invalid IDs never trigger network',async()=>{
  const c=load(()=>{throw Error('unexpected request');});
  assert.equal((await c.getStreams('12','tv')).length,0);
  assert.equal((await c.getStreams('../../secret','movie')).length,0);
});
test('numeric IDs resolve via public mapping when runtime key is absent',async()=>{
  const seen=[];
  const c=load(url=>{
    seen.push(url);
    if(url.includes('query.wikidata.org'))return response(JSON.stringify({results:{bindings:[{imdb:{value:'tt0266543'}}]}}),url);
    if(url.includes('cinemeta'))return response(JSON.stringify({meta:{name:'Finding Nemo'}}),url);
    throw Error('Unexpected URL');
  });c.TMDB_API_KEY='';
  const meta=await c.metadata('12');
  assert.equal(meta.imdb,'tt0266543');assert.equal(meta.titles[0],'Finding Nemo');
  assert.ok(!seen.some(u=>u.includes('api.themoviedb.org')||u.includes('api_key=')));
});
test('invalid runtime key uses fallback, but never logs secrets or request URLs',async()=>{
  const c=load(url=>{
    if(url.includes('themoviedb'))return Promise.resolve({ok:false,status:401});
    if(url.includes('wikidata'))return response(JSON.stringify({results:{bindings:[{imdb:{value:'tt0266543'}}]}}),url);
    return response(JSON.stringify({meta:{name:'Finding Nemo'}}),url);
  });
  const logs=[];c.console={log:s=>logs.push(s)};c.TMDB_API_KEY='secret-test-value';
  assert.equal((await c.metadata('12')).imdb,'tt0266543');
  assert.ok(!logs.join(' ').includes('secret-test-value'));
  assert.ok(!logs.join(' ').includes('https://'));
});
test('missing public mapping fails without title guesses',async()=>{
  const c=load(u=>response(JSON.stringify({results:{bindings:[]}}),u));c.TMDB_API_KEY='';
  assert.equal((await c.getStreams('99999999','movie')).length,0);
});
test('network errors and signed URLs never enter diagnostic logs',async()=>{
  const c=load(()=>Promise.reject(new Error('fetch https://x.example?api_key=secret')));
  const logs=[];c.console={log:s=>logs.push(s)};
  assert.equal((await c.getStreams('tt0266543','movie')).length,0);
  assert.ok(logs.some(s=>s.includes('network_or_parse_error')));
  assert.ok(!logs.join(' ').includes('secret'));
});
test('title search retries without English article and still requires exact IMDb',async()=>{
  const seen=[];
  const c=load(url=>{
    seen.push(url);
    if(url.includes('?s=The%20Matrix'))return response('<div id=content_inside></div>',url);
    if(url.includes('?s=Matrix'))return response('<div id=content_inside><a href=/pelicula/matrix/ >Matrix</a>',url);
    if(url.endsWith('/pelicula/matrix/'))return response('<a href=https://www.imdb.com/title/tt0133093/ >IMDb</a>',url);
    throw Error('Unexpected URL');
  });
  const movie=await c.findMovie({imdb:'tt0133093',titles:['The Matrix']});
  assert.equal(movie.info.imdb,'tt0133093');
  assert.ok(seen.some(u=>u.includes('?s=Matrix')));
});
test('exact movie and branded stream; follows redirect without blocking on CDN probes',async()=>{
  const seen=[];
  const c=load(url=>{
    seen.push(url);
    if(url.includes('api.themoviedb.org'))return response(JSON.stringify({imdb_id:'tt6685538',title:'Mavka'}),url);
    if(url.includes('?s='))return response('<div id="content_inside"><a href="/pelicula/mavka/">Movie</a>',url);
    if(url.endsWith('/pelicula/mavka/'))return response('<a href="https://imdb.com/title/tt6685538/"></a>'+
      '<strong>Audio:</strong>Latino<a service="OnlineVoe" data="abc123def456"></a>',url);
    if(url.includes('voe.sx'))return response('<script>window.location.href="https://player.example/e/abc123def456"</script>',url);
    if(url.includes('player.example'))return response('<script type="application/json">'+JSON.stringify([encode(cfg)])+'</script>',url);
    if(url.endsWith('master.m3u8'))return response('#EXTM3U\n#EXT-X-STREAM-INF:RESOLUTION=1920x1080\nchild.m3u8',url);
    if(url.endsWith('child.m3u8'))return response('#EXTM3U\n#EXTINF:8,\nsegment.ts',url);
    throw Error('Unexpected URL '+url);
  });
  const results=await c.getStreams('459003','movie');
  assert.equal(results.length,1);assert.equal(results[0].name,'Goku lattin');
  assert.equal(results[0].quality,'Auto');assert.match(results[0].title,/Latino/);
  assert.ok(!/cinecalidad|Private|VOE/i.test(results[0].title));
  assert.ok(!seen.some(u=>u.includes('video.example')));
});
test('never offers wrong IMDb match or HTML disguised as HLS',async()=>{
  const c=load(url=>response('<html>Error</html>',url));
  await assert.rejects(c.playlist('https://video.example/master.m3u8','https://player.example',0));
  assert.equal((await c.getStreams('tt6685538','movie')).length,0);
});
test('request timeout settles even if fetch ignores AbortController.signal',async()=>{
  let aborts=0;
  const c=load(()=>new Promise(()=>{}));
  c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;c.REQUEST_TIMEOUT_MS=15;
  c.AbortController=function(){this.signal={};this.abort=()=>{aborts++;};};
  const start=Date.now();
  await assert.rejects(c.request('https://ignored-signal.example/'),/request_timeout/);
  assert.equal(aborts,1);assert.ok(Date.now()-start<500);
});
test('response body timeout is bounded as well as initial fetch',async()=>{
  const c=load(()=>Promise.resolve({ok:true,status:200,text:()=>new Promise(()=>{})}));
  c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;c.REQUEST_TIMEOUT_MS=15;
  await assert.rejects(c.request('https://slow-body.example/'),/request_timeout/);
});
test('global search budget resolves empty and stops launching extra requests',async()=>{
  let calls=0;
  const c=load(()=>{calls++;return new Promise(()=>{});});
  c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;
  c.SEARCH_TIMEOUT_MS=25;c.REQUEST_TIMEOUT_MS=1000;
  const start=Date.now(),result=await c.getStreams('12','movie');
  assert.equal(result.length,0);assert.ok(Date.now()-start<500);
  await new Promise(r=>setTimeout(r,40));assert.equal(calls,1);
});
test('first useful player wins without waiting for a stalled second player',async()=>{
  const c=load();c.setTimeout=setTimeout;c.clearTimeout=clearTimeout;
  const result=await c.firstUsable([new Promise(()=>{}),Promise.resolve({url:'https://video.example/movie.m3u8'})]);
  assert.equal(result.url,'https://video.example/movie.m3u8');
});
test('no network work starts after a search is cancelled',async()=>{
  let calls=0;
  const c=load(()=>{calls++;throw Error('not expected');});
  await assert.rejects(c.request('https://source.example/',null,{cancelled:true}),/search_timeout/);
  assert.equal(calls,0);
});
test('Nuvio native sleep timers are short and stop polling after completion',async()=>{
  const sleeps=[],c=load();
  c.TIMER_SLICE_MS=5;
  c.__plugin_sleep=ms=>{
    sleeps.push(ms);return new Promise(r=>setTimeout(r,ms));
  };
  assert.equal(await c.timeLimited(()=>Promise.resolve('done'),26000),'done');
  await new Promise(r=>setTimeout(r,30));
  assert.equal(sleeps.length,1);assert.ok(sleeps.every(ms=>ms<=5));
});
test('native-sleep-only environment enforces timeout without browser timers',async()=>{
  const c=load();c.TIMER_SLICE_MS=5;
  c.__plugin_sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const start=Date.now();
  await assert.rejects(c.timeLimited(()=>new Promise(()=>{}),15),/request_timeout/);
  assert.ok(Date.now()-start<500);
});
test('settings diagnostics show failing request on device without exposing secrets',async()=>{
  const c=load(u=>{
    if(u.includes('themoviedb'))return Promise.resolve({ok:false,status:403});
    return Promise.resolve({ok:false,status:429});
  });
  c.TMDB_API_KEY='private-do-not-display';
  const layout=await c.module.exports.onSettings(),rendered=JSON.stringify(layout);
  assert.ok(layout.every(x=>x.type==='header'||x.type==='info'));
  assert.match(rendered,/Diagnóstico Goku lattin 0.1.3/);
  assert.match(rendered,/http_403/);assert.match(rendered,/http_429/);
  assert.match(rendered,/sin fuentes/);
  assert.ok(!rendered.includes('private-do-not-display'));
  assert.ok(!rendered.includes('https://'));
  assert.ok(!rendered.includes('cinecalidad'));
  assert.equal(c.DIAGNOSTIC,null);
});
test('settings diagnostics use known numeric movie and report a successful pipeline',async()=>{
  const c=load(u=>{
    if(u.includes('themoviedb'))return response(JSON.stringify({imdb_id:'tt1302011',title:'Kung Fu Panda 2'}),u);
    if(u.includes('?s='))return response('<div id=content_inside><a href=/pelicula/kung-fu-panda-2/ >Movie</a>',u);
    if(u.includes('/pelicula/'))return response('<a href=https://imdb.com/title/tt1302011/ >IMDb</a>'+
      '<strong>Audio:</strong>Latino<a service=OnlineVoe data=abc123def456 >Online</a>',u);
    if(u.includes('voe.sx'))return response('<script type=application/json>'+JSON.stringify([encode(cfg)])+'</script>',u);
    throw Error('Unexpected URL');
  });
  const rendered=JSON.stringify(await c.module.exports.onSettings());
  assert.match(rendered,/1 fuente encontrada/);
  assert.match(rendered,/S2 · Ficha del origen/);
  assert.match(rendered,/P1 · Servidor de vídeo/);
  assert.ok(!rendered.includes('https://video.example'));
  assert.equal(c.DIAGNOSTIC,null);
});
test('ordinary stream queries never collect a diagnostic request history',async()=>{
  const c=load(u=>response('{}',u));
  await c.getStreams('tt0266543','movie');assert.equal(c.DIAGNOSTIC,null);
});
