-- Second stage: apply only after the mandatory acceptance UI/API is deployed.
-- Existing owner/approval policies remain in force. Reads/deletions for privacy
-- remain available; starting or changing practice requires the current acceptance.
do $$
declare target text;
begin
  foreach target in array array['simulation_sessions','simulation_appointments','simulation_student_availability'] loop
    execute format('create policy "Current access acceptance for insert" on public.%I as restrictive for insert to authenticated with check ((select public.current_user_has_simulation_access_consent()))', target);
    execute format('create policy "Current access acceptance for update" on public.%I as restrictive for update to authenticated using ((select public.current_user_has_simulation_access_consent())) with check ((select public.current_user_has_simulation_access_consent()))', target);
  end loop;
end;
$$;
