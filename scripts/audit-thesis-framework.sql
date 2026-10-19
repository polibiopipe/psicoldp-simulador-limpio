-- Run as project administrator. All test writes are rolled back.
begin;
do $test$
declare uid uuid; request_id uuid=gen_random_uuid(); result jsonb; message text;
begin
 select user_id into uid from public.thesis_research_staff where 'coordinator'=any(roles) order by created_at limit 1;
 if uid is null then raise exception 'A verified coordinator is required for this transactional test'; end if;
 result=public.thesis_framework_command(uid,'category',jsonb_build_object('id',request_id,'key','qa_framework_transient','label','TRANSIENT QA CATEGORY','definition','Technical check only; never participant evidence.','origin','emergent','status','proposed','inclusion','Transactional verification only.','exclusion','Not an empirical category.','changeReason','Technical test; transaction rolls back.','expectedVersion',0));
 if (result->>'version')::integer<>1 then raise exception 'Unexpected first version'; end if;
 perform public.thesis_framework_command(uid,'category',jsonb_build_object('id',request_id,'key','qa_framework_transient','expectedVersion',0));
 if (select count(*) from public.thesis_framework_categories where key='qa_framework_transient')<>1 then raise exception 'Retry duplicated a category'; end if;
 begin perform public.thesis_framework_command(uid,'category',jsonb_build_object('id',gen_random_uuid(),'key','qa_framework_transient','expectedVersion',0));raise exception 'Version conflict was not rejected';
 exception when others then get stacked diagnostics message=message_text;if message<>'VERSION_CONFLICT' then raise;end if;end;
 begin perform public.thesis_framework_command(gen_random_uuid(),'category','{}'::jsonb);raise exception 'Unassigned account was allowed';
 exception when others then get stacked diagnostics message=message_text;if message<>'CODER_REQUIRED' then raise;end if;end;
 begin perform public.thesis_framework_command(uid,'entry',jsonb_build_object('id',gen_random_uuid(),'entry_type','analysis_plan','payload',jsonb_build_object('status','active','primaryCriterion','evidence','validationReference','TRANSIENT QA CHECK','assumptionsReview','This is only a transactional verification; no research authorization is represented.')));raise exception 'Unvalidated active plan was allowed';
 exception when others then get stacked diagnostics message=message_text;if message<>'VALIDATED_ANALYSIS_PLAN_REQUIRED' then raise;end if;end;
end;$test$;
rollback;
select 'PASS: transactional role denial, category retry/version integrity and blocked unvalidated active plan; no test records retained' as result;
