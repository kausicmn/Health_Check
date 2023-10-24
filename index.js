const yaml = require('js-yaml');
const fs   = require('fs');
const axios= require('axios');
function parse_yaml()
{
    try {
        if(process.argv.length<3) // Check if YAML file is given as input
        {
            console.log('Please Enter the file name'); 
            process.exit(1)
        }
        else
        {
            const doc = yaml.load(fs.readFileSync(process.argv[2], 'utf8'));
            return doc;
        }
      } catch (e) {
        console.log(e);
      }
}
domains={}
async function health_check(endpoints)
{
while(true){
    for(endpoint of endpoints)
    {
        const {headers={},name,url,method='GET',body} = endpoint
        const endpoint_url = new URL(url);
        const startTime = Date.now();
            await axios({
                method:method,
                url: url,
                data: body,
                headers:headers,
              }).then((res)=>{
                const endtime = Date.now();
                const latency=endtime-startTime
                update_availabilty(res,endpoint_url,latency);
            }).catch((err)=>{
                update_availabilty(err,endpoint_url,0);
            })
                     
    }
    for (domain in domains){
        const availability=Math.round((domains[domain].up/domains[domain].totalrequest)*100);
        console.log(`${domain} has ${availability} percentage`);
    }
    await new Promise((resolve) => setTimeout(resolve, 15000));
}
}
function update_availabilty(res,url,latency)
{
    if(res.status>=200 && res.status <300 && latency<500){
        if(domains[url.hostname]){
            domains[url.hostname].totalrequest+=1
            domains[url.hostname].up+=1
        }
        else{
            domains[url.hostname]={totalrequest:1,up:1}
        }
       }
       else{
        if(domains[url.hostname]){
            domains[url.hostname].totalrequest+=1
        }
        else{
            domains[url.hostname]={totalrequest:1,up:0}
        }
       }
}
health_check(parse_yaml());
