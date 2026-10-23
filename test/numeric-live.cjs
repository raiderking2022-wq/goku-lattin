// Exercise exactly the numeric-ID entry point used by Android, without a key.
// This is a Node compatibility check, not a test on the user's Android device.
const {getStreams}=require('../providers/goku-lattin.js');
async function main(){
  const ids=process.argv.slice(2);
  for(const id of ids.length?ids:['12','603']){
    const start=Date.now();
    const streams=await getStreams(id,'movie');
    console.log(JSON.stringify({id,seconds:(Date.now()-start)/1000,count:streams.length,
      streams:streams.map(s=>({name:s.name,title:s.title,quality:s.quality}))}));
    if(!streams.length)process.exitCode=2;
  }
}
main().catch(()=>{console.error('Live test failed');process.exitCode=1;});
