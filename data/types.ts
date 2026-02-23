export type Language = 'geez' | 'amharic' | 'english' | 'transliteration';

export interface PrayerBlock {
  id: string;
  type: 'heading' | 'rubric' | 'prayer' | 'response';
  speaker?: 'priest' | 'deacon' | 'congregation' | 'all';
  geez?: string;
  amharic?: string;
  english?: string;
  transliteration?: string;
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
