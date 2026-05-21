export type PolicyType =
  | 'renters'
  | 'contents'
  | 'travel'
  | 'gadget'
  | 'car'
  | 'home'
  | 'shop'
  | 'public_liability'
  | 'professional_indemnity'
  | 'employers_liability'
  | 'business_interruption'
  | 'cyber'
  | 'landlord'
  | 'other'

export type OwnerType =
  | 'individual'
  | 'student'
  | 'renter'
  | 'business'
  | 'shop'
  | 'landlord'
  | 'other'

export type PolicyStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export type ShortAnswer =
  | 'May be covered'
  | 'Conditions or exclusions may apply'
  | 'May not be covered'
  | 'Unclear from policy'
  | 'Not found in policy'

export interface UserContext {
  preExistingConditions: boolean
  highValueItems: boolean
  adventureActivities: boolean
}

export interface Policy {
  id: string
  user_id: string
  file_url: string
  policy_nickname: string
  policy_type: PolicyType
  jurisdiction: string
  owner_type: OwnerType
  insurer_name: string | null
  policyholder_name: string | null
  start_date: string | null
  end_date: string | null
  status: PolicyStatus
  processing_error: string | null
  total_pages: number | null
  uploaded_at: string
  user_context_json: UserContext | null
}

export interface PolicyPage {
  id: string
  policy_id: string
  page_number: number
  raw_text: string
  ocr_used: boolean
}

export interface PolicyChunk {
  id: string
  policy_id: string
  page_number: number
  section_title: string | null
  clause_reference: string | null
  chunk_text: string
  chunk_index: number
}

export interface CoverageItem {
  title: string
  status: 'Covered' | 'Limited' | 'Unclear' | 'Excluded'
  explanation: string
  page: number
  section: string
  quote: string
  confidence: ConfidenceLevel
}

export interface LimitItem {
  title: string
  amount: string
  context: string
  page: number
  section: string
  quote: string
}

export interface ImportantCondition {
  title: string
  explanation: string
  page: number
  section: string
  quote: string
}

export interface RiskFlag {
  level: 'High' | 'Medium' | 'Low'
  title: string
  explanation: string
  quote: string
  page: number
  section: string
  questionToAsk: string
  relevantFor?: ('pre_existing_conditions' | 'high_value_items' | 'adventure_activities')[]
}

export interface DateItem {
  title: string
  date: string | null
  context: string
  page: number
}

export interface PolicyOverview {
  policy_type: string
  insurer: string | null
  policyholder: string | null
  policy_period: string | null
  jurisdiction: string
  confidence: ConfidenceLevel
}

export interface PolicySummary {
  id: string
  policy_id: string
  overview_json: PolicyOverview
  coverage_json: CoverageItem[]
  exclusions_json: CoverageItem[]
  limits_json: LimitItem[]
  risk_flags_json: RiskFlag[]
  important_conditions_json: ImportantCondition[]
  generated_at: string
}

export interface RelevantClause {
  page: number
  section: string
  clause: string | null
  quote: string
}

export interface PossibleExclusion {
  page: number
  section: string
  explanation: string
}

export interface QuestionAnswer {
  shortAnswer: ShortAnswer
  confidence: ConfidenceLevel
  plainEnglishExplanation: string
  relevantClauses: RelevantClause[]
  possibleExclusions: PossibleExclusion[]
  questionsToAsk: string[]
  professionalReviewRecommended: boolean
  professionalReviewReason: string | null
}

export interface Question {
  id: string
  user_id: string
  policy_id: string
  question_text: string
  answer_json: QuestionAnswer
  created_at: string
}

export interface AILog {
  id: string
  user_id: string
  policy_id: string
  request_type: 'summary' | 'qa' | 'risk' | 'metadata'
  prompt_sent: string
  chunks_retrieved: object | null
  llm_response: string
  parsed_response: object | null
  citation_verification_passed: boolean
  latency_ms: number
  created_at: string
}
