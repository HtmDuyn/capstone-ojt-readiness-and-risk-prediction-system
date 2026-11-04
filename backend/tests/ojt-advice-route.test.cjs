const assert=require('node:assert/strict');
const {test}=require('node:test');
const express=require('express');

// Isolate HTTP request validation from authentication/DB, which require a real account.
function stub(path,exports){require.cache[require.resolve(path)]={exports};}
stub('../dist/middleware/authenticate',{authenticate:(req,_res,next)=>{req.user={userId:5,roleCode:'STUDENT'};next();}});
stub('../dist/middleware/authorize',{authorizeRoles:()=> (_req,_res,next)=>next()});
stub('../dist/modules/student-portal/ojt-advice.service',{ojtAdvice:async(id)=>({status:'FALLBACK',ojtSemesterId:id})});
stub('../dist/modules/student-portal/readiness.service',{readiness:async(actor)=>({studentUserId:actor.userId,ojtSemesterId:7})});

test('advice HTTP accepts empty query and JSON body; rejects missing ID and extra query',async()=>{
  const app=express();app.use(express.json());
  app.use('/api',require('../dist/modules/student-portal/portal.routes').default);
  app.use((error,_req,res,_next)=>res.status(error.statusCode||500).json({message:error.message}));
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const url=`http://127.0.0.1:${server.address().port}/api/students/me/ojt-advice`;
  const post=(suffix,body)=>fetch(url+suffix,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    const valid=await post('',{ojtSemesterId:1});assert.equal(valid.status,200);
    assert.deepEqual(await valid.json(),{success:true,data:{status:'FALLBACK',ojtSemesterId:1}});
    assert.equal((await post('',{})).status,400);
    assert.equal((await post('?x=1',{ojtSemesterId:1})).status,400);
    const readiness=await fetch(url.replace('/ojt-advice','/ojt-readiness'));
    assert.equal(readiness.status,200);
    assert.deepEqual((await readiness.json()).data,{studentUserId:5,ojtSemesterId:7});
    assert.equal((await fetch(url.replace('/ojt-advice','/ojt-readiness')+'?studentId=99')).status,400);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
