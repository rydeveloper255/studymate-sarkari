/**
 * StudyMate Sarkari — Schema.org JSON-LD Structured Data Generators
 * Compliant with Google Search Central guidelines for JobPosting, Breadcrumbs, WebSite, and Articles.
 */

import { JobVacancy, GovernmentUpdate, StateInfo } from '../../types';

const BASE_URL = 'https://sarkari.studymate.in';

/**
 * Escapes strings to prevent JSON-LD injection / script breakout
 */
function sanitizeString(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .trim();
}

/**
 * WebSite & Sitelinks Searchbox JSON-LD
 */
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StudyMate Sarkari',
    alternateName: ['StudyMate Govt Jobs', 'StudyMate Sarkari Portal'],
    url: BASE_URL,
    description: 'Central and State Government vacancies, admit cards, results, and important recruitment notifications in India.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StudyMate Sarkari',
    url: BASE_URL,
    logo: `${BASE_URL}/icon-512.png`,
    description: 'Trusted portal for authentic government job notifications, admit cards, and examination results in India.',
    sameAs: [
      'https://t.me/studymatesarkari',
    ],
  };
}

/**
 * BreadcrumbList schema
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: sanitizeString(item.name),
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * JobPosting Schema for verified government vacancies
 * Follows strict Google Search Guidelines: never fabricates salary, dates, or hiring org.
 */
export function generateJobPostingSchema(job: JobVacancy) {
  if (!job || !job.title) return undefined;

  const validThroughDate = job.importantDates?.applyEndDate
    ? `${job.importantDates.applyEndDate}T23:59:59+05:30`
    : undefined;

  const locationRegion = job.stateName && job.stateName !== 'Central'
    ? job.stateName
    : 'India';

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: sanitizeString(job.title),
    description: sanitizeString(
      job.summary ||
      `${job.organization} has released official notification for ${job.postName}. Total vacancies: ${job.totalVacancies}. Check eligibility, age limit, and official application details on StudyMate Sarkari.`
    ),
    datePosted: job.publishedDate ? `${job.publishedDate}T00:00:00+05:30` : undefined,
    validThrough: validThroughDate,
    employmentType: 'FULL_TIME',
    directApply: Boolean(job.officialApplyUrl),
    hiringOrganization: {
      '@type': 'GovernmentOrganization',
      name: sanitizeString(job.organization),
      sameAs: job.officialWebsiteUrl || undefined,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        addressRegion: sanitizeString(locationRegion),
      },
    },
  };

  if (typeof job.totalVacancies === 'number' && job.totalVacancies > 0) {
    schema.totalJobOpenings = job.totalVacancies;
  }

  if (job.qualification && job.qualification.length > 0) {
    schema.educationRequirements = job.qualification.map((q) => sanitizeString(q)).join('; ');
  }

  if (job.salaryOrPayScale && !job.salaryOrPayScale.toLowerCase().includes('refer')) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        description: sanitizeString(job.salaryOrPayScale),
      },
    };
  }

  return schema;
}

/**
 * NewsArticle / Article schema for official updates and bulletins
 */
export function generateNewsArticleSchema(update: GovernmentUpdate) {
  if (!update || !update.title) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: sanitizeString(update.title),
    description: sanitizeString(update.summary),
    datePublished: update.date ? `${update.date}T00:00:00+05:30` : undefined,
    dateModified: update.date ? `${update.date}T00:00:00+05:30` : undefined,
    author: {
      '@type': 'Organization',
      name: 'StudyMate Sarkari Editorial & Verification Team',
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'StudyMate Sarkari',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/updates/${update.id}`,
    },
  };
}
