// Refer to root /supabase-schema.sql for the complete SQL migration & RLS definitions
export const SCHEMA_INFO = {
  version: '3.0.0',
  tables: [
    'government_content', // Master unified table for all scraped government content
    'job_sources',
    'job_regions',
    'job_categories',
    'source_fetch_logs',
    'telegram_notifications',
    'organizations',
    'states',
    'government_jobs',
    'government_updates',
    'admit_cards',
    'exam_results',
    'answer_keys',
    'content_sources',
  ],
};
