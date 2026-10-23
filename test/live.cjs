const {getStreams} = require('../providers/goku-lattin.js');
const start=Date.now();
getStreams(process.argv[2] || 'tt6685538','movie').then(results=>{
  console.log(JSON.stringify({seconds:(Date.now()-start)/1000,count:results.length,
    streams:results.map(s=>({name:s.name,title:s.title,quality:s.quality,
      host:new URL(s.url).hostname}))},null,2));
  if (!results.length) process.exitCode=2;
});
