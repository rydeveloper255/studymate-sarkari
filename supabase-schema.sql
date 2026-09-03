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

-- ==============================================================================
-- STEP 9: NORMALIZED GOVERNMENT INFORMATION SCHEMA (SECTIONS 3, 4, 5, 6, 8, 15)
-- ==============================================================================

-- 1. JOB REGIONS (37 regions: All India + 28 States + 8 Union Territories)
CREATE TABLE IF NOT EXISTS job_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('all_india', 'state', 'ut')),
    capital TEXT,
    zone TEXT,
    total_active_vacancies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOB CATEGORIES (Normalized classification: SSC, Railway, Police, UPSC, Banking, etc.)
CREATE TABLE IF NOT EXISTS job_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOB SOURCES (Authoritative official registry)
CREATE TABLE IF NOT EXISTS job_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    organization TEXT NOT NULL,
    region TEXT,
    source_type TEXT NOT NULL DEFAULT 'html',
    official_url TEXT NOT NULL,
    recruitment_url TEXT,
    category TEXT[] NOT NULL DEFAULT '{"vacancy"}',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. JOB CATEGORY MAP (Many-to-many relationship)
CREATE TABLE IF NOT EXISTS job_category_map (
    job_id UUID REFERENCES government_jobs(id) ON DELETE CASCADE,
    category_id UUID REFERENCES job_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, category_id)
);

-- 5. EXAM UPDATES (Unified lifecycle events: recruitment, exam_notice, admit_card, result, answer_key)
CREATE TABLE IF NOT EXISTS exam_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    update_type TEXT NOT NULL CHECK (update_type IN ('recruitment', 'exam_notice', 'admit_card', 'result', 'answer_key', 'cutoff', 'selection_list', 'other')),
    organization TEXT NOT NULL,
    update_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    official_url TEXT,
    link_url TEXT,
    badge_tag TEXT,
    is_high_priority BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'Active',
    job_id UUID REFERENCES government_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SOURCE FETCH LOGS (Audit trail for source fetching)
CREATE TABLE IF NOT EXISTS source_fetch_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES job_sources(id) ON DELETE CASCADE,
    requested_url TEXT NOT NULL,
    final_url TEXT NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    http_status INTEGER,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    changed BOOLEAN NOT NULL DEFAULT FALSE,
    content_hash TEXT,
    content_type TEXT,
    content_length BIGINT,
    response_time_ms INTEGER,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TELEGRAM NOTIFICATIONS (Idempotent tracking for canonical notifications)
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id TEXT PRIMARY KEY,
    job_id UUID REFERENCES government_jobs(id) ON DELETE SET NULL,
    update_id UUID REFERENCES exam_updates(id) ON DELETE SET NULL,
    telegram_chat_id TEXT NOT NULL,
    message_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ,
    telegram_message_id BIGINT,
    idempotency_key TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'SKIPPED_DUPLICATE', 'SKIPPED_INELIGIBLE', 'DRY_RUN_SUCCESS', 'DISABLED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR NORMALIZED TABLES
CREATE INDEX IF NOT EXISTS idx_job_regions_code ON job_regions(code);
CREATE INDEX IF NOT EXISTS idx_job_regions_slug ON job_regions(slug);
CREATE INDEX IF NOT EXISTS idx_job_regions_type ON job_regions(type);
CREATE INDEX IF NOT EXISTS idx_job_categories_code ON job_categories(code);
CREATE INDEX IF NOT EXISTS idx_job_categories_slug ON job_categories(slug);
CREATE INDEX IF NOT EXISTS idx_job_sources_active ON job_sources(active);
CREATE INDEX IF NOT EXISTS idx_job_sources_region ON job_sources(region);
CREATE INDEX IF NOT EXISTS idx_exam_updates_type ON exam_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_exam_updates_job_id ON exam_updates(job_id);
CREATE INDEX IF NOT EXISTS idx_exam_updates_date ON exam_updates(update_date DESC);
CREATE INDEX IF NOT EXISTS idx_source_fetch_logs_source ON source_fetch_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_tg_notifications_key ON telegram_notifications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_tg_notifications_job ON telegram_notifications(job_id);

-- RLS FOR NORMALIZED TABLES
ALTER TABLE job_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_category_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_fetch_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for job_regions" ON job_regions FOR SELECT USING (true);
CREATE POLICY "Public read access for job_categories" ON job_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for job_sources" ON job_sources FOR SELECT USING (true);
CREATE POLICY "Public read access for job_category_map" ON job_category_map FOR SELECT USING (true);
CREATE POLICY "Public read access for exam_updates" ON exam_updates FOR SELECT USING (is_verified = true);
CREATE POLICY "Public read access for source_fetch_logs" ON source_fetch_logs FOR SELECT USING (true);
CREATE POLICY "Public read access for telegram_notifications" ON telegram_notifications FOR SELECT USING (true);

-- SEED DATA: 37 REGIONS (All India + 28 States + 8 Union Territories)
INSERT INTO job_regions (code, name, slug, type, capital, zone) VALUES
('ALL', 'All India', 'all-india', 'all_india', 'New Delhi', 'All India'),
('AP', 'Andhra Pradesh', 'andhra-pradesh', 'state', 'Amaravati', 'Southern'),
('AR', 'Arunachal Pradesh', 'arunachal-pradesh', 'state', 'Itanagar', 'North-Eastern'),
('AS', 'Assam', 'assam', 'state', 'Dispur', 'North-Eastern'),
('BR', 'Bihar', 'bihar', 'state', 'Patna', 'Eastern'),
('CG', 'Chhattisgarh', 'chhattisgarh', 'state', 'Raipur', 'Central'),
('GA', 'Goa', 'goa', 'state', 'Panaji', 'Western'),
('GJ', 'Gujarat', 'gujarat', 'state', 'Gandhinagar', 'Western'),
('HR', 'Haryana', 'haryana', 'state', 'Chandigarh', 'Northern'),
('HP', 'Himachal Pradesh', 'himachal-pradesh', 'state', 'Shimla', 'Northern'),
('JH', 'Jharkhand', 'jharkhand', 'state', 'Ranchi', 'Eastern'),
('KA', 'Karnataka', 'karnataka', 'state', 'Bengaluru', 'Southern'),
('KL', 'Kerala', 'kerala', 'state', 'Thiruvananthapuram', 'Southern'),
('MP', 'Madhya Pradesh', 'madhya-pradesh', 'state', 'Bhopal', 'Central'),
('MH', 'Maharashtra', 'maharashtra', 'state', 'Mumbai', 'Western'),
('MN', 'Manipur', 'manipur', 'state', 'Imphal', 'North-Eastern'),
('ML', 'Meghalaya', 'meghalaya', 'state', 'Shillong', 'North-Eastern'),
('MZ', 'Mizoram', 'mizoram', 'state', 'Aizawl', 'North-Eastern'),
('NL', 'Nagaland', 'nagaland', 'state', 'Kohima', 'North-Eastern'),
('OD', 'Odisha', 'odisha', 'state', 'Bhubaneswar', 'Eastern'),
('PB', 'Punjab', 'punjab', 'state', 'Chandigarh', 'Northern'),
('RJ', 'Rajasthan', 'rajasthan', 'state', 'Jaipur', 'Northern'),
('SK', 'Sikkim', 'sikkim', 'state', 'Gangtok', 'North-Eastern'),
('TN', 'Tamil Nadu', 'tamil-nadu', 'state', 'Chennai', 'Southern'),
('TS', 'Telangana', 'telangana', 'state', 'Hyderabad', 'Southern'),
('TR', 'Tripura', 'tripura', 'state', 'Agartala', 'North-Eastern'),
('UP', 'Uttar Pradesh', 'uttar-pradesh', 'state', 'Lucknow', 'Northern'),
('UK', 'Uttarakhand', 'uttarakhand', 'state', 'Dehradun', 'Northern'),
('WB', 'West Bengal', 'west-bengal', 'state', 'Kolkata', 'Eastern'),
('AN', 'Andaman and Nicobar Islands', 'andaman-and-nicobar-islands', 'ut', 'Port Blair', 'Southern'),
('CH', 'Chandigarh', 'chandigarh', 'ut', 'Chandigarh', 'Northern'),
('DN', 'Dadra and Nagar Haveli and Daman and Diu', 'dadra-and-nagar-haveli-and-daman-and-diu', 'ut', 'Daman', 'Western'),
('DL', 'Delhi', 'delhi', 'ut', 'New Delhi', 'Northern'),
('JK', 'Jammu and Kashmir', 'jammu-and-kashmir', 'ut', 'Srinagar/Jammu', 'Northern'),
('LA', 'Ladakh', 'ladakh', 'ut', 'Leh', 'Northern'),
('LD', 'Lakshadweep', 'lakshadweep', 'ut', 'Kavaratti', 'Southern'),
('PY', 'Puducherry', 'puducherry', 'ut', 'Puducherry', 'Southern')
ON CONFLICT (code) DO NOTHING;

-- SEED DATA: 15 RECRUITMENT CATEGORIES
INSERT INTO job_categories (code, name, slug, description) VALUES
('CENTRAL', 'Central Government', 'central-government', 'Recruitments by ministries, departments and central organizations'),
('STATE', 'State Government', 'state-government', 'State level recruitments across administrative and department wings'),
('SSC', 'Staff Selection Commission', 'ssc', 'SSC CGL, CHSL, MTS, CPO, GD Constable and technical cadres'),
('RAILWAY', 'Railway Recruitment Board', 'railway', 'Indian Railways RRB NTPC, Group D, ALP, JE, RPF vacancies'),
('POLICE', 'Police & Paramilitary', 'police', 'State Police, CAPF, CRPF, BSF, CISF, ITBP, SSB and Defence cadres'),
('UPSC', 'Union Public Service Commission', 'upsc', 'Civil Services (IAS, IPS, IFS), CDS, NDA, CMS, IES, ORA'),
('BANKING', 'Banking & Insurance', 'banking', 'IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, LIC, Insurance PSUs'),
('DEFENCE', 'Armed Forces & Defence', 'defence', 'Indian Army, Indian Navy, Indian Air Force, Coast Guard, AFCAT'),
('TEACHING', 'Teaching & Academia', 'teaching', 'CTET, KVS, NVS, State TET, Assistant Professor, Lecturer vacancies'),
('HEALTHCARE', 'Healthcare & Medical', 'healthcare', 'AIIMS, ESIC, State Health Missions, Staff Nurse, Medical Officer'),
('PSU', 'Public Sector Undertakings', 'psu', 'Maharatna & Navratna PSUs like ONGC, BHEL, IOCL, SAIL, NTPC, GAIL'),
('COURT', 'Judiciary & High Courts', 'court', 'Supreme Court, High Courts, District Courts, Judicial Services'),
('UNIVERSITY', 'Universities & Colleges', 'university', 'Central & State Universities, Non-Teaching & Faculty cadres'),
('STATE_PSC', 'State PSC', 'state-psc', 'BPSC, UPPSC, KPSC, MPSC, TNPSC, APPSC and other State Public Service Commissions'),
('OTHER', 'Other Autonomous Bodies', 'other', 'Statutory councils, research institutes, autonomous regulatory authorities')
ON CONFLICT (code) DO NOTHING;


