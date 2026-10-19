alter table public.thesis_research_exposures add column client_id uuid;
create unique index thesis_research_exposures_client_id on public.thesis_research_exposures(client_id);
-- Preserve the current command definition while making retries idempotent and tightening independent review.
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.thesis_research_command(uuid,text,jsonb)'::regprocedure) into definition;
 definition=replace(definition,'thesis_research_exposures(user_id,slot,session_id,kind,resource,client_time,protocol_version) values(target_user,seat.slot,', 'thesis_research_exposures(client_id,user_id,slot,session_id,kind,resource,client_time,protocol_version) values((item->>''id'')::uuid,target_user,seat.slot,');
 definition=replace(definition, 'item->>''clientTime'',cfg.research_protocol);','item->>''clientTime'',cfg.research_protocol) on conflict(client_id) do nothing;');
 definition=replace(definition, 'assessment.status is distinct from ''submitted'' or assessment.stage', 'assessment.status is distinct from ''submitted'' or assessment.quality is distinct from ''valid'' or assessment.stage');
 execute definition;
end; $patch$;
