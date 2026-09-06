-- =====================================================================
-- STUDYMATE SARKARI - COMPLETE SUPABASE / POSTGRESQL DATABASE SCHEMA
-- Based on StudyMate Sarkari Architecture & Production Tables
-- =====================================================================

-- ============================================================
-- 1. STATES / UNION TERRITORIES
-- ============================================================

create table if not exists public.states (
    id bigint generated always as identity primary key,
    name text not null unique,
    code text not null unique,
    state_type text not null default 'STATE'
        check (state_type in ('STATE', 'UT')),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);


-- ============================================================
-- 2. ORGANIZATIONS / DEPARTMENTS
-- ============================================================

create table if not exists public.organizations (
    id bigint generated always as identity primary key,
    name text not null,
    short_name text,
    organization_type text not null default 'CENTRAL'
        check (
            organization_type in (
                'CENTRAL',
                'STATE',
                'PSU',
                'AUTONOMOUS',
                'OTHER'
            )
        ),
    state_id bigint references public.states(id) on delete set null,
    official_website text,
    logo_url text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- 3. OFFICIAL GOVERNMENT SOURCES
-- ============================================================

create table if not exists public.official_sources (
    id bigint generated always as identity primary key,

    name text not null,

    organization_id bigint
        references public.organizations(id)
        on delete set null,

    state_id bigint
        references public.states(id)
        on delete set null,

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    source_url text not null,

    source_type text not null default 'WEBSITE'
        check (
            source_type in (
                'WEBSITE',
                'RSS',
                'API',
                'PDF'
            )
        ),

    check_interval_minutes integer not null default 60,

    last_checked_at timestamptz,
    last_success_at timestamptz,

    status text not null default 'ACTIVE'
        check (
            status in (
                'ACTIVE',
                'FAILED',
                'DISABLED'
            )
        ),

    last_error text,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);


-- ============================================================
-- 4. JOBS / VACANCIES
-- ============================================================

create table if not exists public.jobs (
    id bigint generated always as identity primary key,

    source_id bigint
        references public.official_sources(id)
        on delete set null,

    source_key text,

    title text not null,

    slug text,

    organization_id bigint
        references public.organizations(id)
        on delete set null,

    state_id bigint
        references public.states(id)
        on delete set null,

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    category text,

    advertisement_no text,

    total_vacancies integer,

    qualification text,
    age_limit text,
    application_fee text,
    salary text,
    selection_process text,

    application_start_date date,
    application_last_date date,
    exam_date date,

    description text,

    notification_url text,
    apply_url text,
    official_website text,

    published_at timestamptz,

    status text not null default 'ACTIVE'
        check (
            status in (
                'UPCOMING',
                'ACTIVE',
                'CLOSED',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    is_featured boolean not null default false,
    is_active boolean not null default true,

    source_url text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (source_id, source_key)
);


-- ============================================================
-- 5. JOB POST / VACANCY DETAILS
-- ============================================================

create table if not exists public.job_vacancies (
    id bigint generated always as identity primary key,

    job_id bigint not null
        references public.jobs(id)
        on delete cascade,

    post_name text not null,

    vacancy_count integer,

    category text,

    gender text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 6. JOB IMPORTANT DATES
-- ============================================================

create table if not exists public.job_dates (
    id bigint generated always as identity primary key,

    job_id bigint not null
        references public.jobs(id)
        on delete cascade,

    date_type text not null
        check (
            date_type in (
                'NOTIFICATION',
                'APPLICATION_START',
                'APPLICATION_LAST',
                'CORRECTION_START',
                'CORRECTION_LAST',
                'EXAM',
                'ADMIT_CARD',
                'ANSWER_KEY',
                'RESULT',
                'OTHER'
            )
        ),

    date_value date,

    description text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 7. RECRUITMENT NOTIFICATIONS
-- ============================================================

create table if not exists public.notifications (
    id bigint generated always as identity primary key,

    source_id bigint
        references public.official_sources(id)
        on delete set null,

    source_key text,

    title text not null,

    organization_id bigint
        references public.organizations(id)
        on delete set null,

    state_id bigint
        references public.states(id)
        on delete set null,

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    notification_type text not null default 'RECRUITMENT'
        check (
            notification_type in (
                'RECRUITMENT',
                'CORRECTION',
                'EXAM_NOTICE',
                'IMPORTANT',
                'OTHER'
            )
        ),

    description text,

    notification_date date,

    official_url text,

    source_url text,

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (source_id, source_key)
);


-- ============================================================
-- 8. ADMIT CARDS
-- ============================================================

create table if not exists public.admit_cards (
    id bigint generated always as identity primary key,

    source_id bigint
        references public.official_sources(id)
        on delete set null,

    source_key text,

    title text not null,

    organization_id bigint
        references public.organizations(id)
        on delete set null,

    state_id bigint
        references public.states(id)
        on delete set null,

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    exam_name text,

    admit_card_release_date date,

    exam_date date,

    description text,

    download_url text,

    official_website text,

    source_url text,

    status text not null default 'UPCOMING'
        check (
            status in (
                'RELEASED',
                'UPCOMING',
                'EXPIRED'
            )
        ),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (source_id, source_key)
);


-- ============================================================
-- 9. RESULTS
-- ============================================================

create table if not exists public.results (
    id bigint generated always as identity primary key,

    source_id bigint
        references public.official_sources(id)
        on delete set null,

    source_key text,

    title text not null,

    organization_id bigint
        references public.organizations(id)
        on delete set null,

    state_id bigint
        references public.states(id)
        on delete set null,

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    exam_name text,

    exam_date date,

    result_date date,

    description text,

    result_url text,

    official_website text,

    source_url text,

    status text not null default 'UPCOMING'
        check (
            status in (
                'DECLARED',
                'UPCOMING'
            )
        ),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (source_id, source_key)
);


-- ============================================================
-- 10. ANSWER KEYS
-- ============================================================

create table if not exists public.answer_keys (
    id bigint generated always as identity primary key,

    source_id bigint
        references public.official_sources(id)
        on delete set null,

    source_key text,

    title text not null,

    organization_id bigint
        references public.organizations(id)
        on delete set null,

    state_id bigint
        references public.states(id)
        on delete set null,

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    exam_name text,

    exam_date date,

    release_date date,

    objection_last_date date,

    description text,

    answer_key_url text,

    official_website text,

    source_url text,

    status text not null default 'UPCOMING'
        check (
            status in (
                'RELEASED',
                'UPCOMING',
                'EXPIRED'
            )
        ),

    is_active boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (source_id, source_key)
);


-- ============================================================
-- 11. LATEST UPDATES
-- ============================================================

create table if not exists public.latest_updates (
    id bigint generated always as identity primary key,

    title text not null,

    category text not null
        check (
            category in (
                'JOB',
                'NOTIFICATION',
                'ADMIT_CARD',
                'RESULT',
                'ANSWER_KEY',
                'EXAM_DATE',
                'OTHER'
            )
        ),

    scope text not null
        check (scope in ('CENTRAL', 'STATE')),

    state_id bigint
        references public.states(id)
        on delete set null,

    reference_type text,

    reference_id bigint,

    short_description text,

    published_at timestamptz not null default now(),

    source_url text,

    is_active boolean not null default true,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 12. SCRAPER LOGS
-- ============================================================

create table if not exists public.scraper_logs (
    id bigint generated always as identity primary key,

    source_id bigint
        references public.official_sources(id)
        on delete cascade,

    started_at timestamptz not null default now(),

    finished_at timestamptz,

    status text not null
        check (
            status in (
                'SUCCESS',
                'FAILED',
                'PARTIAL'
            )
        ),

    new_records integer not null default 0,

    updated_records integer not null default 0,

    error_message text,

    created_at timestamptz not null default now()
);


-- ============================================================
-- 13. INDEXES
-- ============================================================

create index if not exists idx_jobs_scope on public.jobs(scope);
create index if not exists idx_jobs_state on public.jobs(state_id);
create index if not exists idx_jobs_status on public.jobs(status);
create index if not exists idx_jobs_last_date on public.jobs(application_last_date);
create index if not exists idx_jobs_published on public.jobs(published_at desc);
create index if not exists idx_jobs_organization on public.jobs(organization_id);

create index if not exists idx_notifications_scope on public.notifications(scope);
create index if not exists idx_notifications_state on public.notifications(state_id);
create index if not exists idx_notifications_date on public.notifications(notification_date desc);

create index if not exists idx_admit_cards_scope on public.admit_cards(scope);
create index if not exists idx_admit_cards_state on public.admit_cards(state_id);
create index if not exists idx_admit_cards_exam_date on public.admit_cards(exam_date);

create index if not exists idx_results_scope on public.results(scope);
create index if not exists idx_results_state on public.results(state_id);
create index if not exists idx_results_date on public.results(result_date desc);

create index if not exists idx_answer_keys_scope on public.answer_keys(scope);
create index if not exists idx_answer_keys_state on public.answer_keys(state_id);
create index if not exists idx_answer_keys_release on public.answer_keys(release_date desc);

create index if not exists idx_latest_updates_published on public.latest_updates(published_at desc);
create index if not exists idx_latest_updates_category on public.latest_updates(category);
create index if not exists idx_latest_updates_state on public.latest_updates(state_id);

create index if not exists idx_scraper_logs_source on public.scraper_logs(source_id);
create index if not exists idx_scraper_logs_started on public.scraper_logs(started_at desc);


-- ============================================================
-- 14. STATES / UT SEED DATA
-- ============================================================

insert into public.states (name, code, state_type)
values
('Andhra Pradesh', 'AP', 'STATE'),
('Arunachal Pradesh', 'AR', 'STATE'),
('Assam', 'AS', 'STATE'),
('Bihar', 'BR', 'STATE'),
('Chhattisgarh', 'CG', 'STATE'),
('Goa', 'GA', 'STATE'),
('Gujarat', 'GJ', 'STATE'),
('Haryana', 'HR', 'STATE'),
('Himachal Pradesh', 'HP', 'STATE'),
('Jharkhand', 'JH', 'STATE'),
('Karnataka', 'KA', 'STATE'),
('Kerala', 'KL', 'STATE'),
('Madhya Pradesh', 'MP', 'STATE'),
('Maharashtra', 'MH', 'STATE'),
('Manipur', 'MN', 'STATE'),
('Meghalaya', 'ML', 'STATE'),
('Mizoram', 'MZ', 'STATE'),
('Nagaland', 'NL', 'STATE'),
('Odisha', 'OD', 'STATE'),
('Punjab', 'PB', 'STATE'),
('Rajasthan', 'RJ', 'STATE'),
('Sikkim', 'SK', 'STATE'),
('Tamil Nadu', 'TN', 'STATE'),
('Telangana', 'TS', 'STATE'),
('Tripura', 'TR', 'STATE'),
('Uttar Pradesh', 'UP', 'STATE'),
('Uttarakhand', 'UK', 'STATE'),
('West Bengal', 'WB', 'STATE'),
('Delhi', 'DL', 'UT'),
('Jammu & Kashmir', 'JK', 'UT'),
('Ladakh', 'LA', 'UT'),
('Chandigarh', 'CH', 'UT'),
('Puducherry', 'PY', 'UT'),
('Andaman & Nicobar Islands', 'AN', 'UT'),
('Dadra & Nagar Haveli and Daman & Diu', 'DNDD', 'UT'),
('Lakshadweep', 'LD', 'UT')
on conflict (code) do nothing;


-- ============================================================
-- 15. PUBLIC READ VIEWS
-- ============================================================

create or replace view public.active_jobs as
select
    j.*,
    o.name as organization_name,
    o.short_name as organization_short_name,
    s.name as state_name,
    s.code as state_code
from public.jobs j
left join public.organizations o
    on o.id = j.organization_id
left join public.states s
    on s.id = j.state_id
where j.is_active = true;


create or replace view public.active_latest_updates as
select
    lu.*,
    s.name as state_name,
    s.code as state_code
from public.latest_updates lu
left join public.states s
    on s.id = lu.state_id
where lu.is_active = true;


-- ============================================================
-- 16. AUTO UPDATE updated_at TRIGGERS
-- ============================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_organizations_updated on public.organizations;
create trigger trg_organizations_updated before update on public.organizations for each row execute function public.update_updated_at();

drop trigger if exists trg_sources_updated on public.official_sources;
create trigger trg_sources_updated before update on public.official_sources for each row execute function public.update_updated_at();

drop trigger if exists trg_jobs_updated on public.jobs;
create trigger trg_jobs_updated before update on public.jobs for each row execute function public.update_updated_at();

drop trigger if exists trg_notifications_updated on public.notifications;
create trigger trg_notifications_updated before update on public.notifications for each row execute function public.update_updated_at();

drop trigger if exists trg_admit_cards_updated on public.admit_cards;
create trigger trg_admit_cards_updated before update on public.admit_cards for each row execute function public.update_updated_at();

drop trigger if exists trg_results_updated on public.results;
create trigger trg_results_updated before update on public.results for each row execute function public.update_updated_at();

drop trigger if exists trg_answer_keys_updated on public.answer_keys;
create trigger trg_answer_keys_updated before update on public.answer_keys for each row execute function public.update_updated_at();


-- ============================================================
-- 17. ROW LEVEL SECURITY (RLS) POLICIES FOR FRONTEND & BOT ACCESS
-- ============================================================

-- Enable RLS on all tables
alter table public.states enable row level security;
alter table public.organizations enable row level security;
alter table public.official_sources enable row level security;
alter table public.jobs enable row level security;
alter table public.job_vacancies enable row level security;
alter table public.job_dates enable row level security;
alter table public.notifications enable row level security;
alter table public.admit_cards enable row level security;
alter table public.results enable row level security;
alter table public.answer_keys enable row level security;
alter table public.latest_updates enable row level security;
alter table public.scraper_logs enable row level security;

-- Public READ (SELECT) policies for website frontend (anon key)
create policy "Allow Public Read on states" on public.states for select using (true);
create policy "Allow Public Read on organizations" on public.organizations for select using (true);
create policy "Allow Public Read on official_sources" on public.official_sources for select using (true);
create policy "Allow Public Read on jobs" on public.jobs for select using (true);
create policy "Allow Public Read on job_vacancies" on public.job_vacancies for select using (true);
create policy "Allow Public Read on job_dates" on public.job_dates for select using (true);
create policy "Allow Public Read on notifications" on public.notifications for select using (true);
create policy "Allow Public Read on admit_cards" on public.admit_cards for select using (true);
create policy "Allow Public Read on results" on public.results for select using (true);
create policy "Allow Public Read on answer_keys" on public.answer_keys for select using (true);
create policy "Allow Public Read on latest_updates" on public.latest_updates for select using (true);
create policy "Allow Public Read on scraper_logs" on public.scraper_logs for select using (true);

-- INSERT & UPDATE policies for Telegram bot / Scraper worker
create policy "Allow Scraper Insert on jobs" on public.jobs for insert with check (true);
create policy "Allow Scraper Update on jobs" on public.jobs for update using (true);

create policy "Allow Scraper Insert on admit_cards" on public.admit_cards for insert with check (true);
create policy "Allow Scraper Update on admit_cards" on public.admit_cards for update using (true);

create policy "Allow Scraper Insert on results" on public.results for insert with check (true);
create policy "Allow Scraper Update on results" on public.results for update using (true);

create policy "Allow Scraper Insert on answer_keys" on public.answer_keys for insert with check (true);
create policy "Allow Scraper Update on answer_keys" on public.answer_keys for update using (true);

create policy "Allow Scraper Insert on notifications" on public.notifications for insert with check (true);
create policy "Allow Scraper Update on notifications" on public.notifications for update using (true);

create policy "Allow Scraper Insert on latest_updates" on public.latest_updates for insert with check (true);

create policy "Allow Scraper Insert on official_sources" on public.official_sources for insert with check (true);
create policy "Allow Scraper Update on official_sources" on public.official_sources for update using (true);

create policy "Allow Scraper Insert on scraper_logs" on public.scraper_logs for insert with check (true);
create policy "Allow Scraper Insert on organizations" on public.organizations for insert with check (true);

-- Realtime publication for immediate live website updates
alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.latest_updates;
alter publication supabase_realtime add table public.admit_cards;
alter publication supabase_realtime add table public.results;
alter publication supabase_realtime add table public.answer_keys;
