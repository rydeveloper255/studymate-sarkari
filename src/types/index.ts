export type JobSector = 'central' | 'state';

export type SourceScope = 'central' | 'state' | 'union_territory' | 'institution';

export type SourcePriority = 'high' | 'medium' | 'low';

export type SourceType = 'html' | 'pdf' | 'rss' | 'api' | 'sitemap';

export type SourceCategory =
  | 'vacancy'
  | 'admit_card'
  | 'result'
  | 'answer_key'
  | 'exam_update';

export type CentralCategory =
  | 'UPSC'
  | 'SSC'
  | 'Railway'
  | 'Banking'
  | 'Defence'
  | 'Postal'
  | 'Public Sector'
  | 'Other Central Government';

export type JobStatus = 'Active' | 'Closing Soon' | 'Upcoming' | 'Closed';

export interface ImportantDates {
  notificationDate: string;
  applyStartDate: string;
  applyEndDate: string;
  examDate?: string;
  admitCardDate?: string;
}

export interface ApplicationFee {
  general: string;
  obcEws?: string;
  scStPh: string;
  female?: string;
  paymentMode: string;
}

export interface AgeLimit {
  minAge: number | string;
  maxAge: number | string;
  asOnDate?: string;
  relaxationDetails?: string;
}

export interface JobVacancy {
  id: string;
  slug: string;
  title: string;
  organization: string;
  deptOrMinistry?: string;
  postName: string;
  sector: JobSector;
  centralCategory?: CentralCategory;
  stateCode?: string; // for state jobs (e.g., 'BR', 'UP', 'MH')
  stateName?: string;
  totalVacancies: number | string;
  qualification: string[];
  ageLimit: AgeLimit;
  applicationFee: ApplicationFee;
  importantDates: ImportantDates;
  selectionProcess: string[];
  salaryOrPayScale?: string;
  status: JobStatus;
  isDemo: boolean;
  publishedDate: string;
  summary: string;
  importantInstructions?: string[];
  officialNotificationUrl: string;
  officialApplyUrl: string;
  officialWebsiteUrl: string;
}

export interface StateInfo {
  code: string;
  name: string;
  slug: string;
  type: 'state' | 'ut';
  capital: string;
  zone: 'Northern' | 'Southern' | 'Eastern' | 'Western' | 'Central' | 'North-Eastern' | 'UT';
  totalActiveVacanciesCount: number;
  highlightOrganizations: string[];
}

export interface AdmitCardItem {
  id: string;
  title: string;
  organization: string;
  examName: string;
  sector: JobSector;
  stateName?: string;
  releaseDate: string;
  examDate: string;
  status: 'Available' | 'Expected Soon' | 'Delayed';
  downloadUrl: string;
  isDemo: boolean;
  instructions?: string;
}

export interface ResultItem {
  id: string;
  title: string;
  organization: string;
  examName: string;
  sector: JobSector;
  stateName?: string;
  resultDate: string;
  status: 'Declared' | 'Merit List Out' | 'Cutoff Available';
  viewUrl: string;
  isDemo: boolean;
  cutOffAvailable?: boolean;
}

export interface AnswerKeyItem {
  id: string;
  title: string;
  organization: string;
  examName: string;
  sector: JobSector;
  stateName?: string;
  releaseDate: string;
  objectionLastDate?: string;
  viewUrl: string;
  isDemo: boolean;
  status: 'Final' | 'Provisional';
}

export type UpdateCategory =
  | 'recruitment'
  | 'admit_card'
  | 'result'
  | 'answer_key'
  | 'exam_update';

export interface OrganizationInfo {
  id: string;
  code: string;
  name: string;
  fullName?: string;
  sector: JobSector;
  stateCode?: string;
  websiteUrl?: string;
  logoUrl?: string;
}

export interface ContentSourceInfo {
  id: string;
  sourceName: string;
  officialUrl: string;
  scope: SourceScope;
  stateCode?: string;
  category: SourceCategory[];
  sourceType: SourceType;
  priority: SourcePriority;
  checkIntervalMinutes: number;
  active: boolean;
  parserKey?: string;
  lastCheckedAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GovernmentUpdate {
  id: string;
  title: string;
  category: UpdateCategory;
  organization: string;
  date: string;
  summary: string;
  isDemo: boolean;
  linkUrl?: string;
  badgeTag?: string;
  isHighPriority?: boolean;
}

export * from './database';
export * from './parser';
export * from './telegram';
export * from './automation';


export interface JobFilterState {
  searchQuery: string;
  sector: 'all' | 'central' | 'state';
  state: string;
  centralCategory: string;
  qualification: string;
  status: string;
  sortBy: 'latest' | 'last_date' | 'vacancies';
}
