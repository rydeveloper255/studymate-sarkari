-- ==============================================================================
-- STUDYMATE SARKARI — SUPABASE DATABASE SCHEMA (STEP 2 DATA ARCHITECTURE)
-- PostgreSQL / Supabase Schema Definition, Indexes, RLS Policies & Seed Data
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    sector TEXT NOT NULL CHECK (sector IN ('central', 'state')),
    state_code TEXT,
    website_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STATES & UNION TERRITORIES TABLE
CREATE TABLE IF NOT EXISTS states (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('state', 'ut')),
    capital TEXT NOT NULL,
    zone TEXT NOT NULL,
    total_active_vacancies_count INTEGER DEFAULT 0,
    highlight_organizations TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GOVERNMENT JOBS & VACANCIES TABLE
CREATE TABLE IF NOT EXISTS government_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    organization_name TEXT NOT NULL,
    department_or_ministry TEXT,
    post_name TEXT NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('central', 'state')),
    central_category TEXT CHECK (central_category IN (
        'UPSC', 'SSC', 'Railway', 'Banking', 'Defence', 'Postal', 'Public Sector', 'Other Central Government'
    )),
    state_code TEXT REFERENCES states(code) ON DELETE SET NULL,
    state_name TEXT,
    total_vacancies TEXT NOT NULL,
    qualification TEXT[] NOT NULL DEFAULT '{}',
    age_limit JSONB NOT NULL DEFAULT '{"minAge": 18, "maxAge": 30}',
    application_fee JSONB NOT NULL DEFAULT '{"general": "0", "scStPh": "0", "paymentMode": "Online"}',
    important_dates JSONB NOT NULL DEFAULT '{}',
    selection_process TEXT[] DEFAULT '{}',
    salary_or_pay_scale TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closing Soon', 'Upcoming', 'Closed')),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT,
    important_instructions TEXT[],
    official_notification_url TEXT NOT NULL,
    official_apply_url TEXT NOT NULL,
    official_website_url TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GOVERNMENT RECRUITMENT / EXAM UPDATES TABLE
CREATE TABLE IF NOT EXISTS government_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('recruitment', 'admit_card', 'result', 'answer_key', 'exam_update')),
    organization TEXT NOT NULL,
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    link_url TEXT,
    badge_tag TEXT,
    is_high_priority BOOLEAN DEFAULT FALSE,
    job_id UUID REFERENCES government_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADMIT CARDS & HALL TICKETS TABLE
CREATE TABLE IF NOT EXISTS admit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('central', 'state')),
    state_name TEXT,
    release_date DATE NOT NULL,
    exam_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Expected Soon', 'Delayed')),
    download_url TEXT NOT NULL,
    instructions TEXT,
    job_id UUID REFERENCES government_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXAM RESULTS & MERIT LISTS TABLE
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('central', 'state')),
    state_name TEXT,
    result_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Declared' CHECK (status IN ('Declared', 'Merit List Out', 'Cutoff Available')),
    view_url TEXT NOT NULL,
    cut_off_available BOOLEAN DEFAULT FALSE,
    job_id UUID REFERENCES government_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ANSWER KEYS & OBJECTIONS TABLE
CREATE TABLE IF NOT EXISTS answer_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    sector TEXT NOT NULL CHECK (sector IN ('central', 'state')),
    state_name TEXT,
    release_date DATE NOT NULL,
    objection_last_date DATE,
    view_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Final' CHECK (status IN ('Final', 'Provisional')),
    job_id UUID REFERENCES government_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CONTENT SOURCES REGISTRY (Foundation for automated updates & ingestion - Step 3 & 4)
CREATE TABLE IF NOT EXISTS content_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name TEXT NOT NULL,
    official_url TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('central', 'state', 'union_territory', 'institution')),
    state_code TEXT,
    category TEXT[] NOT NULL DEFAULT '{"vacancy"}',
    source_type TEXT NOT NULL CHECK (source_type IN ('html', 'pdf', 'rss', 'api', 'sitemap', 'official_portal', 'manual', 'bulletin')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    check_interval_minutes INTEGER NOT NULL DEFAULT 60,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    parser_key TEXT,
    last_checked_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    content_hash TEXT,
    etag TEXT,
    last_modified TEXT,
    fetch_status TEXT,
    is_fetching BOOLEAN DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CONTENT FETCH LOG (Step 4 Automated Source Monitoring & Audit Trail)
CREATE TABLE IF NOT EXISTS content_fetch_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
    requested_url TEXT NOT NULL,
    final_url TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    http_status INTEGER,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    changed BOOLEAN NOT NULL DEFAULT FALSE,
    content_hash TEXT,
    content_type TEXT,
    content_length BIGINT,
    etag TEXT,
    last_modified TEXT,
    response_time_ms INTEGER,
    attempt_number INTEGER DEFAULT 1,
    fetch_state TEXT NOT NULL CHECK (fetch_state IN (
        'SUCCESS_CHANGED',
        'SUCCESS_UNCHANGED',
        'HTTP_ERROR',
        'NETWORK_ERROR',
        'TIMEOUT',
        'INVALID_URL',
        'REDIRECT_REJECTED',
        'CONTENT_TOO_LARGE',
        'RATE_LIMITED',
        'UNSUPPORTED_CONTENT_TYPE'
    )),
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 5: PARSED CONTENT ITEMS & PARSE AUDIT LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS content_parse_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
    fetch_log_id UUID REFERENCES content_fetch_log(id) ON DELETE SET NULL,
    content_hash TEXT NOT NULL,
    parser_key TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    success BOOLEAN NOT NULL DEFAULT true,
    item_count INTEGER NOT NULL DEFAULT 0,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parsed_content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
    fetch_log_id UUID REFERENCES content_fetch_log(id) ON DELETE SET NULL,
    content_hash TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('vacancy', 'admit_card', 'result', 'answer_key', 'exam_update', 'other')),
    title TEXT NOT NULL,
    normalized_payload JSONB NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
    verification_status TEXT NOT NULL CHECK (verification_status IN (
        'DRAFT',
        'PENDING_REVIEW',
        'VERIFIED',
        'PUBLISHED',
        'EXPIRED',
        'REJECTED',
        'CONFLICT_REVIEW_REQUIRED',
        'ORGANIZATION_REVIEW_REQUIRED',
        'PARSER_REQUIRED'
    )),
    deduplication_key TEXT NOT NULL,
    parser_key TEXT NOT NULL,
    official_url TEXT NOT NULL,
    official_notification_url TEXT,
    official_apply_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 6: PUBLISHING AUDIT LOGS & EXPIRATION LIFECYCLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS publish_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES content_sources(id) ON DELETE SET NULL,
    parsed_item_id UUID REFERENCES parsed_content_items(id) ON DELETE SET NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('government_jobs', 'government_updates', 'admit_cards', 'exam_results', 'answer_keys')),
    target_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('PUBLISHED_NEW', 'UPDATED_EXISTING', 'SKIPPED_UNMODIFIED', 'REJECTED_INELIGIBLE', 'STATUS_EXPIRED')),
    previous_status TEXT,
    new_status TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 7: TELEGRAM NOTIFICATION AUDIT LOGS & IDEMPOTENCY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS telegram_notification_log (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('NEW_VACANCY', 'ADMIT_CARD', 'RESULT', 'ANSWER_KEY', 'EXAM_UPDATE', 'JOB_UPDATE')),
    destination_chat_id TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    message_hash TEXT NOT NULL,
    telegram_message_id BIGINT,
    status TEXT NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'SKIPPED_DUPLICATE', 'SKIPPED_INELIGIBLE', 'DRY_RUN_SUCCESS', 'DISABLED')),
    attempt_count INTEGER NOT NULL DEFAULT 1,
    sent_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 8: AUTOMATION, PIPELINE RUNS, DEAD-LETTER QUEUE & DISTRIBUTED LOCKS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_name TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN (
        'FETCH_SOURCES',
        'PARSE_CONTENT',
        'PUBLISH_VERIFIED',
        'TELEGRAM_DISPATCH',
        'FULL_PIPELINE',
        'RETRY_DEAD_LETTER',
        'DATA_QUALITY_CHECK'
    )),
    status TEXT NOT NULL CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED')),
    correlation_id TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    items_found INTEGER NOT NULL DEFAULT 0,
    items_processed INTEGER NOT NULL DEFAULT 0,
    items_published INTEGER NOT NULL DEFAULT 0,
    items_failed INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    run_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES content_sources(id) ON DELETE CASCADE,
    pipeline_stage TEXT NOT NULL CHECK (pipeline_stage IN ('FETCH', 'PARSE', 'PUBLISH', 'TELEGRAM')),
    run_id TEXT NOT NULL,
    task_payload JSONB NOT NULL DEFAULT '{}',
    attempt_count INTEGER NOT NULL DEFAULT 1,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_code TEXT NOT NULL,
    safe_error_message TEXT NOT NULL,
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    first_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    next_retry_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('PENDING_RETRY', 'DEAD_LETTER', 'RESOLVED', 'ABANDONED')) DEFAULT 'PENDING_RETRY',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS distributed_locks (
    lock_key TEXT PRIMARY KEY,
    lock_token TEXT NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}'
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH, FILTERING & MONITORING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON government_jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON government_jobs(sector);
CREATE INDEX IF NOT EXISTS idx_jobs_state_code ON government_jobs(state_code);
CREATE INDEX IF NOT EXISTS idx_jobs_central_category ON government_jobs(central_category);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON government_jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_published_date ON government_jobs(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON government_jobs(is_active);

CREATE INDEX IF NOT EXISTS idx_updates_category ON government_updates(category);
CREATE INDEX IF NOT EXISTS idx_updates_date ON government_updates(update_date DESC);
CREATE INDEX IF NOT EXISTS idx_admit_cards_release ON admit_cards(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_results_date ON exam_results(result_date DESC);
CREATE INDEX IF NOT EXISTS idx_answer_keys_date ON answer_keys(release_date DESC);

CREATE INDEX IF NOT EXISTS idx_sources_active_priority ON content_sources(active, priority);
CREATE INDEX IF NOT EXISTS idx_sources_last_checked ON content_sources(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_fetch_log_source_time ON content_fetch_log(source_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_fetch_log_success ON content_fetch_log(success);
CREATE INDEX IF NOT EXISTS idx_fetch_log_state ON content_fetch_log(fetch_state);

CREATE INDEX IF NOT EXISTS idx_parse_log_source ON content_parse_log(source_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_parsed_items_source ON parsed_content_items(source_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parsed_items_dedup ON parsed_content_items(deduplication_key);
CREATE INDEX IF NOT EXISTS idx_parsed_items_status ON parsed_content_items(verification_status);
CREATE INDEX IF NOT EXISTS idx_parsed_items_type ON parsed_content_items(item_type);

CREATE INDEX IF NOT EXISTS idx_publish_log_target ON publish_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_publish_log_action ON publish_log(action);
CREATE INDEX IF NOT EXISTS idx_publish_log_created ON publish_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telegram_log_idempotency ON telegram_notification_log(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_telegram_log_target ON telegram_notification_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_telegram_log_status ON telegram_notification_log(status);
CREATE INDEX IF NOT EXISTS idx_telegram_log_created ON telegram_notification_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_correlation ON pipeline_runs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);

CREATE INDEX IF NOT EXISTS idx_dead_letter_source ON pipeline_dead_letter_queue(source_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_status ON pipeline_dead_letter_queue(status);
CREATE INDEX IF NOT EXISTS idx_dead_letter_next_retry ON pipeline_dead_letter_queue(next_retry_at);

CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON distributed_locks(expires_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE government_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_fetch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_parse_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsed_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributed_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Public read access for states" ON states FOR SELECT USING (true);
CREATE POLICY "Public read access for government_jobs" ON government_jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access for government_updates" ON government_updates FOR SELECT USING (true);
CREATE POLICY "Public read access for admit_cards" ON admit_cards FOR SELECT USING (true);
CREATE POLICY "Public read access for exam_results" ON exam_results FOR SELECT USING (true);
CREATE POLICY "Public read access for answer_keys" ON answer_keys FOR SELECT USING (true);
CREATE POLICY "Public read access for content_sources" ON content_sources FOR SELECT USING (true);
CREATE POLICY "Public read access for content_fetch_log" ON content_fetch_log FOR SELECT USING (true);
CREATE POLICY "Public read access for content_parse_log" ON content_parse_log FOR SELECT USING (true);
CREATE POLICY "Public read access for parsed_content_items" ON parsed_content_items FOR SELECT USING (true);
CREATE POLICY "Public read access for publish_log" ON publish_log FOR SELECT USING (true);
CREATE POLICY "Public read access for telegram_notification_log" ON telegram_notification_log FOR SELECT USING (true);
CREATE POLICY "Public read access for pipeline_runs" ON pipeline_runs FOR SELECT USING (true);
CREATE POLICY "Public read access for pipeline_dead_letter_queue" ON pipeline_dead_letter_queue FOR SELECT USING (true);
CREATE POLICY "Public read access for distributed_locks" ON distributed_locks FOR SELECT USING (true);


