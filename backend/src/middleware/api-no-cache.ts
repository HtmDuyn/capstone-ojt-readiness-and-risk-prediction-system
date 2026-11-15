import type { RequestHandler } from 'express';

export const apiNoCache:RequestHandler=(req,res,next)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Pragma','no-cache');
 res.setHeader('Expires','0');
 // Discard old browser validators during the transition to no-store. Keep
 // If-Match/If-Unmodified-Since intact: they may protect concurrent writes.
 if(req.method==='GET'||req.method==='HEAD'){
  delete req.headers['if-none-match'];
  delete req.headers['if-modified-since'];
 }
 next();
};
