-- Central Cirúrgica — schema inicial
-- Execute em um projeto Supabase novo. Não contém dados de pacientes.
-- Todas as tabelas de negócio são isoladas por owner_id e protegidas por RLS.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  specialty text not null check (specialty in ('Coluna', 'Crânio', 'Nervos periféricos', 'Outros')),
  technique text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.surgeries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  procedure_id uuid references public.procedures(id) on delete set null,
  procedure_snapshot text not null,
  patient_ref text,
  specialty text not null default 'Coluna' check (specialty in ('Coluna', 'Crânio', 'Nervos periféricos', 'Outros')),
  hospital text,
  payer text not null default 'Convênio' check (payer in ('Convênio', 'SUS', 'Particular')),
  status text not null default 'Solicitada' check (status in ('Solicitada', 'Em análise', 'Autorizada', 'Agendada', 'Realizada', 'Faturada', 'Parcialmente recebida', 'Recebida', 'Cancelada', 'Negada')),
  request_date date,
  surgery_date date,
  expected_revenue numeric(12,2) not null default 0 check (expected_revenue >= 0),
  received numeric(12,2) not null default 0 check (received >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint surgeries_patient_ref_not_blank check (patient_ref is null or char_length(trim(patient_ref)) > 0)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  changed_at timestamptz not null default timezone('utc', now()),
  old_data jsonb,
  new_data jsonb
);

create index if not exists procedures_owner_name_idx on public.procedures(owner_id, name);
create index if not exists surgeries_owner_date_idx on public.surgeries(owner_id, surgery_date desc);
create index if not exists surgeries_owner_status_idx on public.surgeries(owner_id, status);
create index if not exists audit_logs_owner_changed_idx on public.audit_logs(owner_id, changed_at desc);

create or replace function public.log_business_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_record_id uuid;
begin
  if (tg_op = 'DELETE') then
    v_owner_id := old.owner_id;
    v_record_id := old.id;
    insert into public.audit_logs(owner_id, table_name, record_id, operation, old_data)
    values (v_owner_id, tg_table_name, v_record_id, tg_op, to_jsonb(old));
    return old;
  elsif (tg_op = 'UPDATE') then
    v_owner_id := new.owner_id;
    v_record_id := new.id;
    insert into public.audit_logs(owner_id, table_name, record_id, operation, old_data, new_data)
    values (v_owner_id, tg_table_name, v_record_id, tg_op, to_jsonb(old), to_jsonb(new));
    return new;
  else
    v_owner_id := new.owner_id;
    v_record_id := new.id;
    insert into public.audit_logs(owner_id, table_name, record_id, operation, new_data)
    values (v_owner_id, tg_table_name, v_record_id, tg_op, to_jsonb(new));
    return new;
  end if;
end;
$$;

drop trigger if exists procedures_audit on public.procedures;
create trigger procedures_audit after insert or update or delete on public.procedures
for each row execute procedure public.log_business_change();

drop trigger if exists surgeries_audit on public.surgeries;
create trigger surgeries_audit after insert or update or delete on public.surgeries
for each row execute procedure public.log_business_change();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists procedures_updated_at on public.procedures;
create trigger procedures_updated_at before update on public.procedures
for each row execute procedure public.set_updated_at();

drop trigger if exists surgeries_updated_at on public.surgeries;
create trigger surgeries_updated_at before update on public.surgeries
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.procedures enable row level security;
alter table public.surgeries enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "procedures_select_own" on public.procedures;
create policy "procedures_select_own" on public.procedures
for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "procedures_insert_own" on public.procedures;
create policy "procedures_insert_own" on public.procedures
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "procedures_update_own" on public.procedures;
create policy "procedures_update_own" on public.procedures
for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "procedures_delete_own" on public.procedures;
create policy "procedures_delete_own" on public.procedures
for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "surgeries_select_own" on public.surgeries;
create policy "surgeries_select_own" on public.surgeries
for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "surgeries_insert_own" on public.surgeries;
create policy "surgeries_insert_own" on public.surgeries
for insert to authenticated with check (owner_id = (select auth.uid()));

drop policy if exists "surgeries_update_own" on public.surgeries;
create policy "surgeries_update_own" on public.surgeries
for update to authenticated using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "surgeries_delete_own" on public.surgeries;
create policy "surgeries_delete_own" on public.surgeries
for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "audit_select_own" on public.audit_logs;
create policy "audit_select_own" on public.audit_logs
for select to authenticated using (owner_id = (select auth.uid()));

-- Não criar políticas de INSERT/UPDATE/DELETE para audit_logs:
-- os eventos são gravados exclusivamente pelos triggers SECURITY DEFINER.
