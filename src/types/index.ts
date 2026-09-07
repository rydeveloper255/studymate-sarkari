export type JobCategory = 'All' | 'SSC' | 'Railway' | 'UPSC' | 'Banking' | 'Defence' | 'Teaching' | 'Police' | 'State PSC' | 'Medical' | 'Engineering';

export type QualificationLevel =
  | 'All'
  | '10th Pass'
  | '12th Pass'
  | 'Graduate'
  | 'Post Graduate'
  | 'Engineering'
  | 'Diploma'
  | 'ITI'
  | 'Teaching'
  | 'Medical';

export interface ImportantDate {
  milestone: string;
  date: string;
  isCrucial?: boolean;
  isTentative?: boolean;
}

export interface CategoryVacancyBreakdown {
  ur: number;
  ews: number;
  obc: number;
  sc: number;
  st: number;
  female?: number;
  total: number;
}

export interface PhysicalStandards {
  heightMale?: string;
  heightFemale?: string;
  chestMale?: string;
  runningMale?: string;
  runningFemale?: string;
}

export interface CandidateDirectLoginLinks {
  otrApplyUrl?: string;
  admitCardLoginUrl?: string;
  marksheetResultUrl?: string;
  appStatusUrl?: string;
}

export interface SmartScheduleStatus {
  isPeakHour: boolean;
  activeMode: 'PEAK' | 'OFF_PEAK';
  intervalSeconds: number;
  nextRunInSeconds: number;
  peakWindow: string;
  manualPeakOverride: boolean;
  activeSourcesCrawling: number;
}

export interface EmploymentGazetteItem {
  id: string;
  editionDate: string;
  title: string;
  department: string;
  category: JobCategory;
  vacancies: string;
  qualification: string;
  expectedPortalRelease: string;
  gazetteSnippet: string;
  isAdvanceNotice: boolean;
  sourceIssueNo: string;
}

export interface AntiCrashMirrorPdf {
  id: string;
  jobId: string;
  title: string;
  sourceCommission: string;
  fileSizeBytes: string;
  mirrorEndpoint: string;
  originalUrl: string;
  cdnStatus: 'CACHED_HOT' | 'MIRROR_READY' | 'STREAMING';
  cachedAt: string;
  downloadsServed: number;
  downloadSpeed: string;
}

export interface PostEligibility {
  postName: string;
  postCode: string;
  department: string;
  payLevel: string;
  ageLimit: string;
  qualification: string;
}

export interface ExamPatternSection {
  section: string;
  questions: number;
  marks: number;
  negativeMarking: string;
}

export interface DirectLink {
  title: string;
  subtitle: string;
  url: string;
  buttonText: string;
  isExternal?: boolean;
  type?: 'apply' | 'pdf' | 'syllabus' | 'cutoff' | 'official';
}

export interface JobItem {
  id: string;
  title: string;
  shortTitle: string;
  department: string;
  ministry?: string;
  category: JobCategory;
  state: string; // 'All India' or state name
  advtNo: string;
  vacanciesCount: number;
  vacanciesFormatted: string;
  payScale: string;
  payLevel: string;
  jobLocation: string;
  applyMode: string;
  lastDate: string;
  lastDateTimestamp: string;
  examDate: string;
  selectionProcess: string;
  qualificationSummary: string;
  qualificationLevel: QualificationLevel;
  ageLimit: string;
  crucialAgeDate: string;
  feeGeneral: string;
  feeReserved: string;
  acceptedPaymentModes: string;
  isOfficialGazetteVerified: boolean;
  isHot?: boolean;
  isNew?: boolean;
  isClosingSoon?: boolean;
  closingDaysLeft?: number;
  updatedTime: string;
  description: string;
  importantDates: ImportantDate[];
  postWiseVacancies: PostEligibility[];
  examPatternTier1: ExamPatternSection[];
  tier2Notes?: string[];
  normalizationNote?: string;
  directLinks: DirectLink[];
  faqs: { question: string; answer: string }[];
  categoryVacancies?: CategoryVacancyBreakdown;
  physicalStandards?: PhysicalStandards;
  directCandidateLogins?: CandidateDirectLoginLinks;
  mirrorPdfUrl?: string;
  urgencyBadge?: 'CLOSING_SOON' | 'JUST_OUT' | 'MEGA_BHARTI' | 'RESULT_LIVE';
}

export interface AdmitCardItem {
  id: string;
  title: string;
  examName: string;
  commission: string;
  commissionCode: 'upsc' | 'ssc' | 'railways' | 'banking' | 'state-psc' | 'nta';
  category: 'civil' | 'police' | 'teaching' | 'tech' | 'clerical';
  month: string;
  examDateFormatted: string;
  statusBadge: string;
  statusType: 'active' | 'status_out' | 'city_slip' | 'urgent';
  totalCenters?: string;
  citySlipUrl: string;
  hallTicketUrl: string;
  requirements: string;
  updatedTime: string;
}

export interface ResultItem {
  id: string;
  title: string;
  board: string;
  category: JobCategory;
  declaredDate: string;
  examDate: string;
  totalPosts: string;
  resultType: 'Final Result' | 'Tier 1 Result' | 'Score Card' | 'Merit List' | 'Waiting List';
  downloadUrl: string;
  cutOffUrl?: string;
  cutoffSummary?: { [category: string]: string };
  isNew?: boolean;
}

export interface AnswerKeyItem {
  id: string;
  title: string;
  board: string;
  category: JobCategory;
  releaseDate: string;
  objectionLastDate: string;
  feePerQuestion: string;
  status: 'Objection Window Open' | 'Final Answer Key' | 'Provisional Key';
  answerKeyUrl: string;
  challengePortalUrl: string;
  totalQuestions?: number;
}

export interface StateInfo {
  code: string;
  name: string;
  hindiName: string;
  activeJobsCount: number;
  capital: string;
  pscName: string;
  pscUrl: string;
  popularExams: string[];
}

export interface GovernmentSource {
  id: string;
  name: string;
  type: 'Central Commission' | 'State PSC' | 'Railway Board' | 'Defence' | 'Banking' | 'Police Recruitment' | 'Education' | 'National Agency' | 'Research' | 'Insurance' | 'Postal';
  stateOrDomain: string;
  url: string;
  scope?: string;
  scrapeCategory: 'Jobs' | 'Admit Card' | 'Results' | 'Answer Key' | 'All';
  lastStatus: 'Operational' | 'Active' | 'Rate Limited' | 'Checking';
  lastCheckedTime?: string;
  itemsFoundCount: number;
  isActive: boolean;
}

export interface TelegramBotLog {
  id: string;
  timestamp: string;
  sourceName: string;
  messageType: 'INFO' | 'SUCCESS' | 'SCRAPE_DISCOVERY' | 'TELEGRAM_BROADCAST' | 'ERROR';
  details: string;
}

export interface WhatsAppBroadcastRecord {
  id: string;
  itemId: string;
  category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY' | 'NOTIFICATION' | 'DIGEST' | 'DEADLINE_URGENT';
  title: string;
  department?: string;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED_DUPLICATE';
  channelUrl: string;
  formattedText?: string;
  autoBroadcasted: boolean;
  deepLink?: string;
  pdfUrl?: string;
  utmParams?: string;
  bannerGenerated?: boolean;
  gatewayUsed?: 'GREEN_API' | 'META_CLOUD_API' | 'WEBHOOK_FALLBACK' | 'SIMULATOR';
}

export interface WhatsAppBannerConfig {
  title: string;
  department: string;
  vacancies: string;
  eligibility: string;
  payScale: string;
  lastDate: string;
  stateOrCentral: string;
  badgeType: 'NEW_JOB' | 'LAST_DATE' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY';
}

export interface TelegramBroadcastRecord {
  id: string;
  itemId: string;
  category: 'JOB' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY' | 'NOTIFICATION' | 'DIGEST' | 'DEADLINE_URGENT';
  title: string;
  department?: string;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED_DUPLICATE';
  channelUrl: string;
  formattedText?: string;
  htmlText?: string;
  autoBroadcasted: boolean;
  deepLink?: string;
  pdfUrl?: string;
  utmParams?: string;
  bannerGenerated?: boolean;
  channelHandle?: string;
}

export interface TelegramBannerConfig {
  title: string;
  department: string;
  vacancies: string;
  eligibility: string;
  payScale: string;
  lastDate: string;
  stateOrCentral: string;
  badgeType: 'NEW_JOB' | 'LAST_DATE' | 'ADMIT_CARD' | 'RESULT' | 'ANSWER_KEY';
}


