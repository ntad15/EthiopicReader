export const SOURCE_SCHEMA_VERSION = 1 as const;

export const SOURCE_LOCALES = ['gez', 'am', 'en', 'gez-Latn'] as const;
export type LocaleCode = (typeof SOURCE_LOCALES)[number];

export type LocalizedText = Partial<Record<LocaleCode, string>>;

export const READING_SLOTS = ['pauline', 'catholic', 'acts', 'psalm', 'gospel'] as const;
export type ReadingSlot = (typeof READING_SLOTS)[number];

export const SPEAKER_ROLES = [
  'priest',
  'deacon',
  'assistant-priest',
  'assistant-deacon',
  'assembly',
  'all',
] as const;
export type SpeakerRole = (typeof SPEAKER_ROLES)[number];

export const DAY_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
export type DayOfWeek = (typeof DAY_OF_WEEK)[number];

export const LITURGICAL_SEASONS = [
  'ordinary',
  'advent',
  'christmas',
  'lent',
  'easter',
  'pentecost',
] as const;
export type LiturgicalSeason = (typeof LITURGICAL_SEASONS)[number];

export interface SourceMetadata {
  saint?: string;
  tags?: string[];
  source?: {
    type: 'manual' | 'pdf' | 'csv' | 'imported';
    ref?: string;
  };
  notes?: string[];
}

export interface LiturgicalCondition {
  daysOfWeek?: DayOfWeek[];
  seasons?: LiturgicalSeason[];
  feastIds?: string[];
  dateRanges?: Array<{
    start: string;
    end: string;
  }>;
}

export interface SourceSection {
  id: string;
  titles: LocalizedText;
  nodes: SourceNode[];
  tags?: string[];
}

export interface TextNode {
  id: string;
  kind: 'text';
  role: 'prayer' | 'response';
  speaker?: SpeakerRole;
  content: LocalizedText;
  tags?: string[];
}

export interface HeadingNode {
  id: string;
  kind: 'heading';
  content: LocalizedText;
  tags?: string[];
}

export interface RubricNode {
  id: string;
  kind: 'rubric';
  content: LocalizedText;
  tags?: string[];
}

export interface ReadingRefNode {
  id: string;
  kind: 'reading-ref';
  slot: ReadingSlot;
  labels: LocalizedText;
  style?: 'heading' | 'rubric';
  tags?: string[];
}

export interface ReadingBodyNode {
  id: string;
  kind: 'reading-body';
  slot: ReadingSlot;
  tags?: string[];
}

export interface IncludeNode {
  id: string;
  kind: 'include';
  ref: string;
  tags?: string[];
}

export interface SeasonalRefNode {
  id: string;
  kind: 'seasonal-ref';
  slot: string;
  optional?: boolean;
  tags?: string[];
}

export type SourceNode =
  | TextNode
  | HeadingNode
  | RubricNode
  | ReadingRefNode
  | ReadingBodyNode
  | IncludeNode
  | SeasonalRefNode;

export interface BaseSourceDocument {
  schemaVersion: typeof SOURCE_SCHEMA_VERSION;
  id: string;
  slug: string;
  titles: LocalizedText;
  tags?: string[];
  metadata?: SourceMetadata;
}

export interface StructuredSourceDocument extends BaseSourceDocument {
  kind: 'service' | 'anaphora' | 'fragment';
  sections: SourceSection[];
}

export interface SeasonalRule {
  id: string;
  when: LiturgicalCondition;
  nodes: SourceNode[];
}

export interface SeasonalSlot {
  id: string;
  titles?: LocalizedText;
  rules: SeasonalRule[];
}

export interface SeasonalSourceDocument extends BaseSourceDocument {
  kind: 'seasonal';
  slots: SeasonalSlot[];
}

export type SourceDocument = StructuredSourceDocument | SeasonalSourceDocument;
