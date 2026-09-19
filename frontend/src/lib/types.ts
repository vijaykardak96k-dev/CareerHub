/** Types mirroring the backend DTOs exposed under /api/v1. */

export type Role = 'STUDENT' | 'COMPANY' | 'COLLEGE_ADMIN';
export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type OpeningStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
export type OpeningType = 'JOB' | 'INTERNSHIP';
export type Proficiency = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type CertificateStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type ApplicationStatus =
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AccountView {
  id: string;
  email: string;
  role: Role;
  displayName: string;
  active: boolean;
  companyStatus: CompanyStatus | null;
  profileCompletion: number | null;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: AccountView;
}

export interface CompanyBrief {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  location: string | null;
}

export interface CompanyView {
  id: string;
  email: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  industry: string | null;
  website: string | null;
  location: string | null;
  contactEmail: string | null;
  status: CompanyStatus;
  reviewNote: string | null;
  active: boolean;
  createdAt: string;
}

export interface CompanyDashboard {
  totalJobs: number;
  publishedJobs: number;
  totalInternships: number;
  publishedInternships: number;
  totalApplications: number;
  shortlisted: number;
  selected: number;
  unreadNotifications: number;
  status: CompanyStatus;
}

export interface StudentProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  college: string | null;
  department: string | null;
  course: string | null;
  graduationYear: number | null;
  cgpa: number | null;
  location: string | null;
  photoUrl: string | null;
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  profileCompletion: number;
  active: boolean;
}

export interface EducationView {
  id: string;
  degree: string;
  institution: string;
  specialization: string | null;
  startYear: number | null;
  endYear: number | null;
  grade: string | null;
}

export interface ProjectView {
  id: string;
  title: string;
  description: string | null;
  techStack: string | null;
  projectUrl: string | null;
  repoUrl: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ExperienceView {
  id: string;
  companyName: string;
  roleTitle: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  currentlyWorking: boolean;
}

export interface StudentDashboard {
  profileCompletion: number;
  skillCount: number;
  certificateCount: number;
  verifiedCertificateCount: number;
  assessmentCount: number;
  averageAssessmentScore: number;
  activeApplications: number;
  shortlistedApplications: number;
  selectedApplications: number;
  unreadNotifications: number;
}

export interface JobView {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  minCgpa: number | null;
  graduationYear: number | null;
  deadline: string | null;
  vacancies: number;
  status: OpeningStatus;
  skills: string[];
  company: CompanyBrief;
  openForApplications: boolean;
  createdAt: string;
}

export interface InternshipView {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  workMode: WorkMode;
  durationMonths: number;
  stipend: number | null;
  eligibility: string | null;
  minCgpa: number | null;
  graduationYear: number | null;
  deadline: string | null;
  vacancies: number;
  status: OpeningStatus;
  skills: string[];
  company: CompanyBrief;
  openForApplications: boolean;
  createdAt: string;
}

export interface ApplicationView {
  id: string;
  openingType: OpeningType;
  openingId: string;
  openingTitle: string;
  companyName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: ApplicationStatus;
  coverLetter: string | null;
  appliedAt: string;
  updatedAt: string;
}

export interface StatusHistoryView {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  changedBy: string | null;
  changedAt: string;
}

export interface SkillView {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  categoryId: string;
  categoryName: string;
}

export interface CategoryView {
  id: string;
  name: string;
  description: string | null;
  skills: SkillView[];
}

export interface StudentSkillView {
  id: string;
  skillId: string;
  skillName: string;
  categoryName: string;
  proficiency: Proficiency;
  yearsExperience: number | null;
}

export interface SkillGapView {
  target: string;
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
}

export interface AssessmentView {
  id: string;
  title: string;
  description: string | null;
  skillId: string;
  skillName: string;
  durationMinutes: number;
  passingPercentage: number;
  active: boolean;
  questionCount: number;
  createdAt: string;
}

export interface OptionView {
  id: string;
  optionText: string;
}

export interface QuestionView {
  id: string;
  questionText: string;
  marks: number;
  options: OptionView[];
}

export interface AttemptStart {
  assessmentId: string;
  title: string;
  skillName: string;
  durationMinutes: number;
  totalMarks: number;
  questions: QuestionView[];
}

export interface AttemptResult {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  skillName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  attemptedAt: string;
}

export interface AdminOptionView {
  id: string;
  optionText: string;
  correct: boolean;
}

export interface AdminQuestionView {
  id: string;
  questionText: string;
  marks: number;
  options: AdminOptionView[];
}

export interface CertificateView {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  status: CertificateStatus;
  reviewNote: string | null;
  studentId: string;
  studentName: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ResumeView {
  personal: StudentProfile;
  summary: string | null;
  careerObjective: string | null;
  template: string | null;
  education: EducationView[];
  skills: StudentSkillView[];
  projects: ProjectView[];
  experience: ExperienceView[];
  certificates: CertificateView[];
}

export interface NotificationView {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface CountPoint {
  label: string;
  value: number;
}

export interface AdminOverview {
  totalStudents: number;
  totalCompanies: number;
  pendingCompanies: number;
  activeJobs: number;
  activeInternships: number;
  totalApplications: number;
  selectedStudents: number;
  pendingCertificates: number;
}

export interface AnalyticsSummary {
  applicationsByStatus: CountPoint[];
  jobsByMonth: CountPoint[];
  topSkills: CountPoint[];
  selectedStudents: number;
  totalApplications: number;
}

export interface UserSummary {
  id: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}
