import { invalid, pagination } from '../modules/students/student.validation';

export function detailPagination(params:Record<string,unknown>,selector:string,prefix:string) {
  const pageKey=prefix+'Page',limitKey=prefix+'Limit';
  if(params[selector]===undefined&&(params[pageKey]!==undefined||params[limitKey]!==undefined))
    throw invalid(`Select ${selector} before paging ${prefix}.`);
  const value=pagination({page:params[pageKey],limit:params[limitKey]},[]);
  if(value.offset>2147483647)throw invalid(`${prefix} pagination exceeds the allowed range.`);
  return value;
}
