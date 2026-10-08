import { Router, type RequestHandler } from 'express';
import { jsonInputOperations } from '../config/swagger';
import { academicError } from '../modules/academic/academic.schema';

export function createJsonInputRouter(dispatch:Router):Router {
  const router=Router();
  for(const op of jsonInputOperations){
    const inputNames=new Set(op.inputs.map(field=>field.name));
    const sourceProperties=new Set(Object.keys(op.bodySchema.properties??{}).filter(name=>!inputNames.has(name)));
    const rejectUnknownFields=op.sourceMethod==='get'||op.bodySchema.additionalProperties===false;
    const sourcePath=op.sourcePath.slice(4);
    const sourceMethod=op.sourceMethod.toUpperCase();
    const handle:RequestHandler=(req,res,next)=>{
      if(op.protected&&(!req.headers.authorization?.startsWith('Bearer ')||!req.headers.authorization.slice(7).trim())){
        res.status(401).json({success:false,errorCode:'AUTH_REQUIRED',message:'Authentication required. Please provide a bearer token.'});return;
      }
      try {
        if(!req.body||typeof req.body!=='object'||Array.isArray(req.body))throw academicError('Nhập một JSON object trong request body.');
        if(Object.keys(req.query).length)throw academicError('Nhập bộ lọc trong JSON body; API này không nhận query parameters.');
        const input={...req.body},query=new URLSearchParams();let path=sourcePath;
        for(const field of op.inputs){
          const value=req.body[field.name];delete input[field.name];
          if(value===undefined||value===null){
            if(field.required)throw academicError(field.name+' is required in JSON body.');
            continue;
          }
          if(!['string','number','boolean'].includes(typeof value))throw academicError(field.name+' must be a scalar value.');
          if(field.location==='path'){
            if(!/^[1-9]\d*$/.test(String(value)))throw academicError(field.name+' must be a positive integer.');
            path=path.replace('{'+field.sourceName+'}',encodeURIComponent(String(value)));
          }else query.append(field.sourceName,String(value));
        }
        if(rejectUnknownFields){
          for(const key of Object.keys(input))if(!sourceProperties.has(key))throw academicError('Unknown JSON field: '+key+'.');
        }
        const previous={url:req.url,method:req.method,body:req.body};
        let restored=false;
        const restore=()=>{if(restored)return;restored=true;req.url=previous.url;req.method=previous.method;req.body=previous.body;res.off('finish',restore);res.off('close',restore);};
        req.url=path+(query.size?'?'+query.toString():'');req.method=sourceMethod;req.body=input;
        res.once('finish',restore);res.once('close',restore);
        try{dispatch(req,res,error=>{restore();next(error);});}catch(error){restore();throw error;}
      }catch(error){next(error);}
    };
    if(!['post','patch','put','delete'].includes(op.method))throw Error('Unsupported JSON input method: '+op.method);
    router.route(op.path.slice(4))[op.method as 'post'|'patch'|'put'|'delete'](handle);
  }
  return router;
}

