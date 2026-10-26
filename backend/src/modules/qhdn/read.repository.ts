import { pool } from '../../config/database';
import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';

// Reports and catalog reads share one snapshot without taking the write advisory lock.
export async function readTransaction<T>(work:(client:PoolClient)=>Promise<T>,existingClient?:PoolClient):Promise<T>{
  if(existingClient)return work(existingClient);
  if(!pool)throw invalid('Database is not configured.',503,'DATABASE_UNAVAILABLE');
  const client=await pool.connect();
  try{
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const result=await work(client);
    await client.query('COMMIT');
    return result;
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{client.release();}
}
