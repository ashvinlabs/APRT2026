drop extension if exists "pg_net";


  create table "public"."audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "staff_id" uuid,
    "action" text not null,
    "metadata" jsonb,
    "voter_id" uuid
      );


alter table "public"."audit_logs" enable row level security;


  create table "public"."candidates" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "photo_url" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."candidates" enable row level security;


  create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "permissions" jsonb not null default '{}'::jsonb,
    "color" text default '#94a3b8'::text,
    "priority" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."roles" enable row level security;


  create table "public"."settings" (
    "id" text not null,
    "value" jsonb not null,
    "updated_at" timestamp with time zone default now(),
    "updated_by" uuid
      );


alter table "public"."settings" enable row level security;


  create table "public"."staff" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "name" text not null,
    "is_approved" boolean default false,
    "approved_by" uuid,
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."staff_roles" (
    "staff_id" uuid not null,
    "role_id" uuid not null
      );



  create table "public"."voters" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "address" text,
    "invitation_code" text,
    "is_present" boolean default false,
    "present_at" timestamp with time zone,
    "handled_by" uuid,
    "created_at" timestamp with time zone default now(),
    "nik" text
      );


alter table "public"."voters" enable row level security;


  create table "public"."votes" (
    "id" uuid not null default gen_random_uuid(),
    "candidate_id" uuid,
    "is_valid" boolean default true,
    "recorded_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."votes" enable row level security;

CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id);

CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id);

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);

CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);

CREATE UNIQUE INDEX settings_pkey ON public.settings USING btree (id);

CREATE UNIQUE INDEX staff_pkey ON public.staff USING btree (id);

CREATE UNIQUE INDEX staff_roles_pkey ON public.staff_roles USING btree (staff_id, role_id);

CREATE UNIQUE INDEX staff_user_id_key ON public.staff USING btree (user_id);

CREATE UNIQUE INDEX voters_invitation_code_key ON public.voters USING btree (invitation_code);

CREATE UNIQUE INDEX voters_pkey ON public.voters USING btree (id);

CREATE UNIQUE INDEX votes_pkey ON public.votes USING btree (id);

alter table "public"."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY using index "audit_logs_pkey";

alter table "public"."candidates" add constraint "candidates_pkey" PRIMARY KEY using index "candidates_pkey";

alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";

alter table "public"."settings" add constraint "settings_pkey" PRIMARY KEY using index "settings_pkey";

alter table "public"."staff" add constraint "staff_pkey" PRIMARY KEY using index "staff_pkey";

alter table "public"."staff_roles" add constraint "staff_roles_pkey" PRIMARY KEY using index "staff_roles_pkey";

alter table "public"."voters" add constraint "voters_pkey" PRIMARY KEY using index "voters_pkey";

alter table "public"."votes" add constraint "votes_pkey" PRIMARY KEY using index "votes_pkey";

alter table "public"."audit_logs" add constraint "audit_logs_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES auth.users(id) not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_staff_id_fkey";

alter table "public"."audit_logs" add constraint "audit_logs_voter_id_fkey" FOREIGN KEY (voter_id) REFERENCES public.voters(id) ON DELETE SET NULL not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_voter_id_fkey";

alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";

alter table "public"."settings" add constraint "settings_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

alter table "public"."settings" validate constraint "settings_updated_by_fkey";

alter table "public"."staff" add constraint "staff_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) not valid;

alter table "public"."staff" validate constraint "staff_approved_by_fkey";

alter table "public"."staff" add constraint "staff_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."staff" validate constraint "staff_user_id_fkey";

alter table "public"."staff" add constraint "staff_user_id_key" UNIQUE using index "staff_user_id_key";

alter table "public"."staff_roles" add constraint "staff_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."staff_roles" validate constraint "staff_roles_role_id_fkey";

alter table "public"."staff_roles" add constraint "staff_roles_staff_id_fkey" FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE not valid;

alter table "public"."staff_roles" validate constraint "staff_roles_staff_id_fkey";

alter table "public"."voters" add constraint "voters_handled_by_fkey" FOREIGN KEY (handled_by) REFERENCES auth.users(id) not valid;

alter table "public"."voters" validate constraint "voters_handled_by_fkey";

alter table "public"."voters" add constraint "voters_invitation_code_key" UNIQUE using index "voters_invitation_code_key";

alter table "public"."votes" add constraint "votes_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) not valid;

alter table "public"."votes" validate constraint "votes_candidate_id_fkey";

alter table "public"."votes" add constraint "votes_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES auth.users(id) not valid;

alter table "public"."votes" validate constraint "votes_recorded_by_fkey";

grant delete on table "public"."audit_logs" to "anon";

grant insert on table "public"."audit_logs" to "anon";

grant references on table "public"."audit_logs" to "anon";

grant select on table "public"."audit_logs" to "anon";

grant trigger on table "public"."audit_logs" to "anon";

grant truncate on table "public"."audit_logs" to "anon";

grant update on table "public"."audit_logs" to "anon";

grant delete on table "public"."audit_logs" to "authenticated";

grant insert on table "public"."audit_logs" to "authenticated";

grant references on table "public"."audit_logs" to "authenticated";

grant select on table "public"."audit_logs" to "authenticated";

grant trigger on table "public"."audit_logs" to "authenticated";

grant truncate on table "public"."audit_logs" to "authenticated";

grant update on table "public"."audit_logs" to "authenticated";

grant delete on table "public"."audit_logs" to "service_role";

grant insert on table "public"."audit_logs" to "service_role";

grant references on table "public"."audit_logs" to "service_role";

grant select on table "public"."audit_logs" to "service_role";

grant trigger on table "public"."audit_logs" to "service_role";

grant truncate on table "public"."audit_logs" to "service_role";

grant update on table "public"."audit_logs" to "service_role";

grant delete on table "public"."candidates" to "anon";

grant insert on table "public"."candidates" to "anon";

grant references on table "public"."candidates" to "anon";

grant select on table "public"."candidates" to "anon";

grant trigger on table "public"."candidates" to "anon";

grant truncate on table "public"."candidates" to "anon";

grant update on table "public"."candidates" to "anon";

grant delete on table "public"."candidates" to "authenticated";

grant insert on table "public"."candidates" to "authenticated";

grant references on table "public"."candidates" to "authenticated";

grant select on table "public"."candidates" to "authenticated";

grant trigger on table "public"."candidates" to "authenticated";

grant truncate on table "public"."candidates" to "authenticated";

grant update on table "public"."candidates" to "authenticated";

grant delete on table "public"."candidates" to "service_role";

grant insert on table "public"."candidates" to "service_role";

grant references on table "public"."candidates" to "service_role";

grant select on table "public"."candidates" to "service_role";

grant trigger on table "public"."candidates" to "service_role";

grant truncate on table "public"."candidates" to "service_role";

grant update on table "public"."candidates" to "service_role";

grant delete on table "public"."roles" to "anon";

grant insert on table "public"."roles" to "anon";

grant references on table "public"."roles" to "anon";

grant select on table "public"."roles" to "anon";

grant trigger on table "public"."roles" to "anon";

grant truncate on table "public"."roles" to "anon";

grant update on table "public"."roles" to "anon";

grant delete on table "public"."roles" to "authenticated";

grant insert on table "public"."roles" to "authenticated";

grant references on table "public"."roles" to "authenticated";

grant select on table "public"."roles" to "authenticated";

grant trigger on table "public"."roles" to "authenticated";

grant truncate on table "public"."roles" to "authenticated";

grant update on table "public"."roles" to "authenticated";

grant delete on table "public"."roles" to "service_role";

grant insert on table "public"."roles" to "service_role";

grant references on table "public"."roles" to "service_role";

grant select on table "public"."roles" to "service_role";

grant trigger on table "public"."roles" to "service_role";

grant truncate on table "public"."roles" to "service_role";

grant update on table "public"."roles" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";

grant delete on table "public"."staff" to "anon";

grant insert on table "public"."staff" to "anon";

grant references on table "public"."staff" to "anon";

grant select on table "public"."staff" to "anon";

grant trigger on table "public"."staff" to "anon";

grant truncate on table "public"."staff" to "anon";

grant update on table "public"."staff" to "anon";

grant delete on table "public"."staff" to "authenticated";

grant insert on table "public"."staff" to "authenticated";

grant references on table "public"."staff" to "authenticated";

grant select on table "public"."staff" to "authenticated";

grant trigger on table "public"."staff" to "authenticated";

grant truncate on table "public"."staff" to "authenticated";

grant update on table "public"."staff" to "authenticated";

grant delete on table "public"."staff" to "service_role";

grant insert on table "public"."staff" to "service_role";

grant references on table "public"."staff" to "service_role";

grant select on table "public"."staff" to "service_role";

grant trigger on table "public"."staff" to "service_role";

grant truncate on table "public"."staff" to "service_role";

grant update on table "public"."staff" to "service_role";

grant delete on table "public"."staff_roles" to "anon";

grant insert on table "public"."staff_roles" to "anon";

grant references on table "public"."staff_roles" to "anon";

grant select on table "public"."staff_roles" to "anon";

grant trigger on table "public"."staff_roles" to "anon";

grant truncate on table "public"."staff_roles" to "anon";

grant update on table "public"."staff_roles" to "anon";

grant delete on table "public"."staff_roles" to "authenticated";

grant insert on table "public"."staff_roles" to "authenticated";

grant references on table "public"."staff_roles" to "authenticated";

grant select on table "public"."staff_roles" to "authenticated";

grant trigger on table "public"."staff_roles" to "authenticated";

grant truncate on table "public"."staff_roles" to "authenticated";

grant update on table "public"."staff_roles" to "authenticated";

grant delete on table "public"."staff_roles" to "service_role";

grant insert on table "public"."staff_roles" to "service_role";

grant references on table "public"."staff_roles" to "service_role";

grant select on table "public"."staff_roles" to "service_role";

grant trigger on table "public"."staff_roles" to "service_role";

grant truncate on table "public"."staff_roles" to "service_role";

grant update on table "public"."staff_roles" to "service_role";

grant delete on table "public"."voters" to "anon";

grant insert on table "public"."voters" to "anon";

grant references on table "public"."voters" to "anon";

grant select on table "public"."voters" to "anon";

grant trigger on table "public"."voters" to "anon";

grant truncate on table "public"."voters" to "anon";

grant update on table "public"."voters" to "anon";

grant delete on table "public"."voters" to "authenticated";

grant insert on table "public"."voters" to "authenticated";

grant references on table "public"."voters" to "authenticated";

grant select on table "public"."voters" to "authenticated";

grant trigger on table "public"."voters" to "authenticated";

grant truncate on table "public"."voters" to "authenticated";

grant update on table "public"."voters" to "authenticated";

grant delete on table "public"."voters" to "service_role";

grant insert on table "public"."voters" to "service_role";

grant references on table "public"."voters" to "service_role";

grant select on table "public"."voters" to "service_role";

grant trigger on table "public"."voters" to "service_role";

grant truncate on table "public"."voters" to "service_role";

grant update on table "public"."voters" to "service_role";

grant delete on table "public"."votes" to "anon";

grant insert on table "public"."votes" to "anon";

grant references on table "public"."votes" to "anon";

grant select on table "public"."votes" to "anon";

grant trigger on table "public"."votes" to "anon";

grant truncate on table "public"."votes" to "anon";

grant update on table "public"."votes" to "anon";

grant delete on table "public"."votes" to "authenticated";

grant insert on table "public"."votes" to "authenticated";

grant references on table "public"."votes" to "authenticated";

grant select on table "public"."votes" to "authenticated";

grant trigger on table "public"."votes" to "authenticated";

grant truncate on table "public"."votes" to "authenticated";

grant update on table "public"."votes" to "authenticated";

grant delete on table "public"."votes" to "service_role";

grant insert on table "public"."votes" to "service_role";

grant references on table "public"."votes" to "service_role";

grant select on table "public"."votes" to "service_role";

grant trigger on table "public"."votes" to "service_role";

grant truncate on table "public"."votes" to "service_role";

grant update on table "public"."votes" to "service_role";


  create policy "Enable read for authenticated users"
  on "public"."audit_logs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Enable write for authenticated users"
  on "public"."audit_logs"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable write for authenticated"
  on "public"."audit_logs"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable delete for testing"
  on "public"."candidates"
  as permissive
  for delete
  to public
using (true);



  create policy "Enable insert for testing"
  on "public"."candidates"
  as permissive
  for insert
  to public
with check (true);



  create policy "Enable read for everyone"
  on "public"."candidates"
  as permissive
  for select
  to public
using (true);



  create policy "Enable update for testing"
  on "public"."candidates"
  as permissive
  for update
  to public
using (true);



  create policy "Enable read for everyone"
  on "public"."roles"
  as permissive
  for select
  to public
using (true);



  create policy "Enable all for authenticated users"
  on "public"."settings"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Enable read for everyone"
  on "public"."settings"
  as permissive
  for select
  to public
using (true);



  create policy "Authorized staff manage voters"
  on "public"."voters"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Enable all for authenticated users"
  on "public"."voters"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Enable read for everyone"
  on "public"."voters"
  as permissive
  for select
  to public
using (true);



  create policy "Authorized staff manage votes"
  on "public"."votes"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Enable all for authenticated users"
  on "public"."votes"
  as permissive
  for all
  to authenticated
using (true);



  create policy "Allow Public Delete"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'candidates'::text));



  create policy "Allow Public Select"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'candidates'::text));



  create policy "Allow Public Update"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'candidates'::text));



  create policy "Allow Public Upload"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'candidates'::text));



