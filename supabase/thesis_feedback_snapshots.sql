create function public.thesis_archive_formative_snapshot() returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.closure->'formativeSnapshot' is not null and (tg_op='INSERT' or new.closure->'formativeSnapshot' is distinct from old.closure->'formativeSnapshot') then
  insert into public.thesis_feedback_history(id,session_id,user_id,slot,turn_index,feedback_version,protocol_version,input,result,model)
  values((new.closure->'formativeSnapshot'->>'id')::uuid,new.id,new.user_id,new.slot,0,new.closure->'formativeSnapshot'->>'version',new.protocol_version,'{}'::jsonb,jsonb_build_object('kind','formative_summary','snapshot',new.closure->'formativeSnapshot'),'educational_rules') on conflict(id) do nothing;
 end if;
 return new;
end;$$;
revoke all on function public.thesis_archive_formative_snapshot() from public,anon,authenticated;
grant execute on function public.thesis_archive_formative_snapshot() to service_role;
create trigger thesis_formative_snapshot_archive after insert or update of closure on public.thesis_tomas_sessions for each row execute function public.thesis_archive_formative_snapshot();
