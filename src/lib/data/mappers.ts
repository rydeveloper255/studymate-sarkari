import {
  DbGovernmentJob,
  DbGovernmentUpdate,
  DbState,
  DbAdmitCard,
  DbExamResult,
  DbAnswerKey,
  DbOrganization,
  DbContentSource,
  DbGovernmentContent,
} from '../../types/database';
import {
  JobVacancy,
  GovernmentUpdate,
  StateInfo,
  AdmitCardItem,
  ResultItem,
  AnswerKeyItem,
  OrganizationInfo,
  ContentSourceInfo,
} from '../../types';

export function mapDbGovernmentContentToVacancy(row: DbGovernmentContent): JobVacancy {
  const isCentral = !row.region || row.region === 'ALL';
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || 'Government Vacancy',
    organization: row.organization || 'Government Organization',
    deptOrMinistry: row.department || undefined,
    postName: row.post_name || row.title,
    sector: isCentral ? 'central' : 'state',
    centralCategory: isCentral ? (Array.isArray(row.category) ? row.category[0] : row.category) : undefined,
    stateCode: isCentral ? undefined : row.region,
    stateName: isCentral ? undefined : row.region,
    totalVacancies: String(row.vacancy_count || 'Various'),
    qualification: Array.isArray(row.qualification) ? row.qualification : [row.qualification || 'As per official notification'],
    ageLimit: row.age_limit || {
      minAge: '18',
      maxAge: '35',
      asOnDate: 'As per notification',
      relaxationDetails: 'Category relaxations applicable',
    },
    applicationFee: row.fee_details || {
      general: '₹100',
      scStPh: 'Exempted',
      paymentMode: 'Online via Net Banking / Debit Card / UPI',
    },
    importantDates: {
      notificationDate: row.published_at || 'Announced',
      applyStartDate: row.application_start_at || row.published_at || 'Announced',
      applyEndDate: row.application_end_at || 'Refer notification',
      examDate: row.exam_date || undefined,
    },
    selectionProcess: Array.isArray(row.selection_process) ? row.selection_process : ['Written Examination', 'Document Verification'],
    salaryOrPayScale: undefined,
    status: row.status === 'upcoming' ? 'Upcoming' : row.status === 'expired' || row.status === 'closed' ? 'Closed' : 'Active',
    isDemo: false,
    publishedDate: row.published_at || new Date().toISOString().split('T')[0],
    summary: row.description || row.title || '',
    importantInstructions: undefined,
    officialNotificationUrl: row.notification_url || row.source_url || '#',
    officialApplyUrl: row.application_url || row.source_url || '#',
    officialWebsiteUrl: row.source_url || '#',
  };
}

export function mapDbGovernmentContentToAdmitCard(row: DbGovernmentContent): AdmitCardItem {
  const isCentral = !row.region || row.region === 'ALL';
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    examName: row.post_name || row.title,
    sector: isCentral ? 'central' : 'state',
    stateName: isCentral ? undefined : row.region,
    releaseDate: row.release_date || row.published_at,
    examDate: row.exam_date || row.published_at,
    status: row.status === 'available' || row.status === 'Available' ? 'Available' : 'Released',
    downloadUrl: row.notification_url || row.source_url || '#',
    isDemo: false,
    instructions: 'Download hall ticket using official registration ID and password.',
  };
}

export function mapDbGovernmentContentToResult(row: DbGovernmentContent): ResultItem {
  const isCentral = !row.region || row.region === 'ALL';
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    examName: row.post_name || row.title,
    sector: isCentral ? 'central' : 'state',
    stateName: isCentral ? undefined : row.region,
    resultDate: row.release_date || row.published_at,
    status: 'Declared',
    viewUrl: row.notification_url || row.source_url || '#',
    isDemo: false,
    cutOffAvailable: true,
  };
}

export function mapDbGovernmentContentToAnswerKey(row: DbGovernmentContent): AnswerKeyItem {
  const isCentral = !row.region || row.region === 'ALL';
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    examName: row.post_name || row.title,
    sector: isCentral ? 'central' : 'state',
    stateName: isCentral ? undefined : row.region,
    releaseDate: row.release_date || row.published_at,
    objectionLastDate: row.application_end_at || undefined,
    viewUrl: row.notification_url || row.source_url || '#',
    isDemo: false,
    status: 'Released',
  };
}

export function mapDbGovernmentContentToUpdate(row: DbGovernmentContent): GovernmentUpdate {
  return {
    id: row.id,
    title: row.title,
    category:
      row.content_type === 'admit_card'
        ? 'admit_card'
        : row.content_type === 'result'
        ? 'result'
        : row.content_type === 'answer_key'
        ? 'answer_key'
        : 'recruitment',
    organization: row.organization,
    date: row.published_at || new Date().toISOString().split('T')[0],
    summary: row.description || row.title || '',
    isDemo: false,
    linkUrl: row.notification_url || row.source_url || undefined,
    badgeTag: row.content_type.replace('_', ' ').toUpperCase(),
    isHighPriority: true,
  };
}

export function mapDbJobToVacancy(row: DbGovernmentJob): JobVacancy {
  return {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || 'Government Vacancy',
    organization: row.organization_name || 'Government Organization',
    deptOrMinistry: row.department_or_ministry || undefined,
    postName: row.post_name || row.title,
    sector: row.sector || 'central',
    centralCategory: row.central_category || undefined,
    stateCode: row.state_code || undefined,
    stateName: row.state_name || undefined,
    totalVacancies: row.total_vacancies ?? 'Not specified',
    qualification: Array.isArray(row.qualification) ? row.qualification : ['As per official notification'],
    ageLimit: row.age_limit || {
      minAge: '18',
      maxAge: '30',
      asOnDate: 'As per notification',
      relaxationDetails: 'Category relaxations applicable',
    },
    applicationFee: row.application_fee || {
      general: 'Refer notification',
      scStPh: 'Nil',
      paymentMode: 'Online via Net Banking / Debit Card / UPI',
    },
    importantDates: row.important_dates || {
      notificationDate: row.published_date || 'Announced',
      applyStartDate: row.published_date || 'Announced',
      applyEndDate: 'Refer notification',
    },
    selectionProcess: Array.isArray(row.selection_process) ? row.selection_process : ['Written Exam / Interview'],
    salaryOrPayScale: row.salary_or_pay_scale || undefined,
    status: row.status || 'Active',
    isDemo: false,
    publishedDate: row.published_date || new Date().toISOString().split('T')[0],
    summary: row.summary || '',
    importantInstructions: Array.isArray(row.important_instructions) ? row.important_instructions : undefined,
    officialNotificationUrl: row.official_notification_url || '#',
    officialApplyUrl: row.official_apply_url || '#',
    officialWebsiteUrl: row.official_website_url || '#',
  };
}

export function mapDbUpdateToUpdate(row: DbGovernmentUpdate): GovernmentUpdate {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    organization: row.organization,
    date: row.update_date || new Date().toISOString().split('T')[0],
    summary: row.summary || '',
    isDemo: false,
    linkUrl: row.link_url || undefined,
    badgeTag: row.badge_tag || undefined,
    isHighPriority: Boolean(row.is_high_priority),
  };
}

export function mapDbStateToStateInfo(row: DbState): StateInfo {
  return {
    code: row.code,
    name: row.name,
    slug: row.slug,
    type: row.type,
    capital: row.capital,
    zone: row.zone,
    totalActiveVacanciesCount: row.total_active_vacancies_count ?? 0,
    highlightOrganizations: Array.isArray(row.highlight_organizations) ? row.highlight_organizations : [],
  };
}

export function mapDbAdmitCardToItem(row: DbAdmitCard): AdmitCardItem {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    examName: row.exam_name,
    sector: row.sector,
    stateName: row.state_name || undefined,
    releaseDate: row.release_date,
    examDate: row.exam_date,
    status: row.status || 'Available',
    downloadUrl: row.download_url,
    isDemo: false,
    instructions: row.instructions || undefined,
  };
}

export function mapDbResultToItem(row: DbExamResult): ResultItem {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    examName: row.exam_name,
    sector: row.sector,
    stateName: row.state_name || undefined,
    resultDate: row.result_date,
    status: row.status || 'Declared',
    viewUrl: row.view_url,
    isDemo: false,
    cutOffAvailable: Boolean(row.cut_off_available),
  };
}

export function mapDbAnswerKeyToItem(row: DbAnswerKey): AnswerKeyItem {
  return {
    id: row.id,
    title: row.title,
    organization: row.organization,
    examName: row.exam_name,
    sector: row.sector,
    stateName: row.state_name || undefined,
    releaseDate: row.release_date,
    objectionLastDate: row.objection_last_date || undefined,
    viewUrl: row.view_url,
    isDemo: false,
    status: row.status || 'Provisional',
  };
}

export function mapDbOrgToItem(row: DbOrganization): OrganizationInfo {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    fullName: row.full_name || undefined,
    sector: row.sector,
    stateCode: row.state_code || undefined,
    websiteUrl: row.website_url || undefined,
    logoUrl: row.logo_url || undefined,
  };
}

export function mapDbSourceToItem(row: DbContentSource): ContentSourceInfo {
  return {
    id: row.id,
    sourceName: row.source_name,
    officialUrl: row.official_url,
    scope: row.scope,
    stateCode: row.state_code || undefined,
    category: Array.isArray(row.category) ? row.category : ['vacancy'],
    sourceType: row.source_type || 'html',
    priority: row.priority || 'medium',
    checkIntervalMinutes: row.check_interval_minutes || 60,
    active: row.active ?? true,
    parserKey: row.parser_key || undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    lastSuccessAt: row.last_success_at || undefined,
    lastError: row.last_error || undefined,
    organizationId: row.organization_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapJobSourceToContentSourceInfo(row: any): ContentSourceInfo {
  const isCentral = row.region === 'ALL' || !row.region;
  const categories = Array.isArray(row.category)
    ? row.category
    : typeof row.category === 'string'
      ? [row.category]
      : ['vacancy'];

  return {
    id: row.id,
    sourceName: row.name || 'Official Government Source',
    officialUrl: row.official_url,
    scope: isCentral ? 'central' : 'state',
    stateCode: isCentral ? undefined : row.region,
    category: categories,
    sourceType: row.source_type || 'html',
    priority: (row.region === 'ALL' || categories.includes('UPSC') || categories.includes('SSC')) ? 'high' : 'medium',
    checkIntervalMinutes: 30,
    active: row.active ?? true,
    parserKey: undefined,
    lastCheckedAt: row.last_checked_at || undefined,
    lastSuccessAt: row.last_success_at || undefined,
    lastError: row.last_error || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}
