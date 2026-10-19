import { supabase } from '../lib/supabaseClient.js';
export async function researchRequest(action,payload={}){
 const before=(await supabase.auth.getSession()).data?.session;
 const response=await fetch('/api/thesis-research',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${before?.access_token||''}`},body:JSON.stringify({action,...payload})});
 const result=await response.json();const after=(await supabase.auth.getSession()).data?.session;
 if(before?.user?.id!==after?.user?.id)throw new Error('La cuenta cambió. Vuelve a ingresar.');
 if(!response.ok)throw new Error(result.message||'No se confirmó el registro.');return result;
}
