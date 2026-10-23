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
test('numeric IDs without injected metadata key fail closed',async()=>{
  const c=load(()=>{throw Error('unexpected request');});c.TMDB_API_KEY='';
  assert.equal((await c.getStreams('459003','movie')).length,0);
});
test('exact IMDb match and branded output, follows VOE redirect, checks child HLS',async()=>{
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
  assert.equal(results[0].quality,'1080p');assert.match(results[0].title,/Latino/);
  assert.ok(!/cinecalidad|Private|VOE/i.test(results[0].title));
  assert.ok(seen.includes('https://video.example/child.m3u8'));
});
test('never offers wrong IMDb match or HTML disguised as HLS',async()=>{
  const c=load(url=>response('<html>Error</html>',url));
  await assert.rejects(c.playlist('https://video.example/master.m3u8','https://player.example',0));
  assert.equal((await c.getStreams('tt6685538','movie')).length,0);
});
