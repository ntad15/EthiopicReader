export type Language = 'geez' | 'amharic' | 'english' | 'transliteration';

export type SpeakerRole = 'priest' | 'deacon' | 'congregation' | 'all';

export type BlockType = 'heading' | 'rubric' | 'prayer' | 'response';

export interface PrayerBlock {
  id: string;
  type: BlockType;
  speaker?: SpeakerRole;
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
