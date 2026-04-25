export type Language = 'geez' | 'amharic' | 'english' | 'transliteration';

export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type LiturgicalSeason = 'ordinary' | 'advent' | 'christmas' | 'lent' | 'easter' | 'pentecost';

export interface ConditionalConditions {
  dayOfWeek?: DayOfWeek[];
  season?: LiturgicalSeason[];
  dateRange?: { start: string; end: string }[]; // ISO date strings
  feast?: string[]; // Special feast day identifiers
}

export interface PrayerBlock {
  id: string;
  type: 'heading' | 'rubric' | 'prayer' | 'response' | 'placeholder';
  speaker?: 'priest' | 'deacon' | 'asst. priest' | 'asst. deacon' | 'congregation' | 'all';
  geez?: string;
  amharic?: string;
  english?: string;
  transliteration?: string;
  /** ReadingSlotKey — marks a heading/rubric block that shows a dynamic reading reference */
  dynamic?: string;
  /** Override ID — for placeholder blocks: references section ID in seasonals.json */
  overrideId?: string;
  /** Optional — for placeholder blocks: if true, skip silently when no matching override found */
  optional?: boolean;
  /** Conditions — for blocks in seasonals.json: when to use this alternative */
  conditions?: ConditionalConditions;
}

export interface LiturgicalSection {
  id: string;
  title: {
    english: string;
    geez?: string;
    amharic?: string;
  };
  blocks: PrayerBlock[];
}

export interface LiturgicalText {
  id: string;
  title: {
    english: string;
    geez?: string;
    amharic?: string;
  };
  sections: LiturgicalSection[];
}

export interface AnaphoraMetadata {
  id: string;
  name: {
    english: string;
    geez?: string;
    amharic?: string;
  };
  saint?: string;
}

export interface Anaphora extends AnaphoraMetadata {
  sections: LiturgicalSection[];
}
