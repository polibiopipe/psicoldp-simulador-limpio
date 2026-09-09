-- Stop research inclusion when completion falls outside the collection window.
begin;
create or replace view public.simulation_research_eligible_sessions with (security_invoker=true) as
with latest as (
  select distinct on(user_id,study_key) * from public.simulation_research_consent_events order by user_id,study_key,sequence desc
)
select e.participant_code, st.study_key, st.version, s.case_id, s.session_number,
  case when st.information->'data_categories' ? 'conversation' then s.conversation end as conversation,
  case when st.information->'data_categories' ? 'feedback' then s.feedback end as feedback,
  case when st.information->'data_categories' ? 'usage' then jsonb_build_object('score',s.score,'status',s.status,'duration_seconds',greatest(0,extract(epoch from (s.completed_at-s.started_at)))) end as usage,
  e.quotes_accepted
from latest e
join public.simulation_research_studies st on st.id=e.study_id
join public.simulation_sessions s on s.user_id=e.user_id
where e.action='accepted' and st.status in ('published','closed') and st.retention_until>now()
  and s.created_at>=e.created_at and s.started_at>=e.created_at
  and s.created_at<=least(st.collection_until,coalesce(st.closed_at,st.collection_until))
  and s.completed_at<=least(st.collection_until,coalesce(st.closed_at,st.collection_until))
  and s.status='completed';
revoke all on public.simulation_research_eligible_sessions from public, anon, authenticated;
grant select on public.simulation_research_eligible_sessions to service_role;

commit;
