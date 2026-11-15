const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const express=require('express');
const {apiNoCache}=require('../dist/middleware/api-no-cache');

function request(server,path,headers={},method='GET'){
 return new Promise((resolve,reject)=>{
  const req=http.request({host:'127.0.0.1',port:server.address().port,path,headers,method},res=>{
   let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
  });req.on('error',reject);req.end();
 });
}
test('API reads return fresh bodies even with old conditional validators; writes retain concurrency headers',async t=>{
 const app=express();app.disable('etag');app.use('/api',apiNoCache);
 let version=1;
 app.get('/api/data',(req,res)=>res.json({version}));
 app.patch('/api/data',(req,res)=>res.json({ifMatch:req.headers['if-match'],unmodified:req.headers['if-unmodified-since']}));
 app.get('/asset',(req,res)=>res.send('static content'));
 const server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const first=await request(server,'/api/data');
 assert.equal(first.status,200);assert.equal(first.headers['cache-control'],'no-store');assert.equal(first.headers.etag,undefined);
 version=2;
 const next=await request(server,'/api/data',{'If-None-Match':'*','If-Modified-Since':'Wed, 01 Jan 2099 00:00:00 GMT'});
 assert.equal(next.status,200);assert.deepEqual(JSON.parse(next.body),{version:2});
 const unchanged=await request(server,'/api/data',{'If-None-Match':'*'});
 assert.equal(unchanged.status,200);assert.equal(unchanged.headers['cache-control'],'no-store');
 const write=await request(server,'/api/data',{'If-Match':'version-2','If-Unmodified-Since':'Wed, 01 Jan 2020 00:00:00 GMT'},'PATCH');
 assert.deepEqual(JSON.parse(write.body),{ifMatch:'version-2',unmodified:'Wed, 01 Jan 2020 00:00:00 GMT'});
 assert.equal((await request(server,'/asset')).headers['cache-control'],undefined);
});

test('the real backend mounts no-store for API responses',async t=>{
 const app=require('../dist/app').default;
 assert.equal(app.disabled('etag'),true);
 const server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));const {pool}=require('../dist/config/database');if(pool)await pool.end();});
 const response=await request(server,'/api/companies',{'If-None-Match':'*'});
 assert.equal(response.status,401);assert.equal(response.headers['cache-control'],'no-store');assert.equal(response.headers.etag,undefined);
});
