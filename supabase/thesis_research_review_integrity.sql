-- Preserve review decisions, keep frozen versions immutable and permit scoped access revocation.
do $patch$
declare definition text;
begin
 select pg_get_functiondef('public.thesis_research_command(uuid,text,jsonb)'::regprocedure) into definition;
 definition=replace(definition, 'insert into public.thesis_research_staff(user_id,roles) values', 'if jsonb_array_length(p_payload->''roles'')=0 then delete from public.thesis_research_staff where user_id=target_user; else insert into public.thesis_research_staff(user_id,roles) values');
 definition=replace(definition, 'do update set roles=excluded.roles;', 'do update set roles=excluded.roles; end if;');
 definition=replace(definition, 'elsif p_action=''freeze'' then', 'elsif p_action=''freeze'' then if protocol.status=''frozen'' then raise exception ''PROTOCOL_FROZEN''; end if;');
 definition=replace(definition, 'if enrollment.status=''eligible'' then raise exception ''ELIGIBILITY_ALREADY_VERIFIED'';', 'if enrollment.status is not null and enrollment.status<>''pending'' then raise exception ''ELIGIBILITY_ALREADY_VERIFIED'';');
 definition=replace(definition, 'where id=(p_payload->>''assessmentId'')::uuid returning jsonb_build_object(''saved'',true)', 'where id=(p_payload->>''assessmentId'')::uuid and status=''submitted'' returning jsonb_build_object(''saved'',true)');
 definition=replace(definition, 'insert into public.thesis_research_audit(actor_id,action,record_id) values(p_user,p_action,coalesce(row_id::text,result->>''id'',p_payload->>''sessionId'',p_payload->>''assessmentId''));', 'insert into public.thesis_research_audit(actor_id,action,record_id,details) values(p_user,p_action,coalesce(row_id::text,result->>''id'',p_payload->>''sessionId'',p_payload->>''assessmentId'',p_payload->>''slot''),case when p_action in (''eligibility_review'',''assessment_quality'',''assign'',''staff_set'',''freeze'') then p_payload else ''{}''::jsonb end);');
 definition=replace(definition, 'set status=''frozen'',approval_reference=', 'set status=''frozen'',document=p_payload->''document'',approval_reference=');
 execute definition;
end; $patch$;
