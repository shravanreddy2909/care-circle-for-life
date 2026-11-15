
create or replace function public.medicines_after_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if not exists (select 1 from public.families where id = old.family_id) then
      return null;
    end if;
    insert into public.audit_log (family_id, actor_id, action, details)
    values (old.family_id, auth.uid(), 'medicine.delete', jsonb_build_object('medicine', old.name, 'dose', old.dose));
    return null;
  end if;
  if tg_op = 'UPDATE' then
    delete from public.doses
    where medicine_id = new.id and status = 'upcoming' and scheduled_at > now()
      and pre_reminder_sent_at is null and due_reminder_sent_at is null;
    update public.doses set medicine_name = new.name, dose = new.dose
    where medicine_id = new.id and status = 'upcoming';
  end if;
  perform public.generate_doses_for_medicine(new.id);
  insert into public.audit_log (family_id, actor_id, action, details)
  values (new.family_id, auth.uid(), 'medicine.' || lower(tg_op), jsonb_build_object('medicine', new.name, 'dose', new.dose));
  return null;
end $$;
