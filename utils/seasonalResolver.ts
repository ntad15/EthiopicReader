import type {
  ConditionalConditions,
  DayOfWeek,
  LiturgicalSeason,
  PrayerBlock,
  LiturgicalSection,
  LiturgicalText,
} from '../data/types';

/**
 * Context for evaluating seasonal conditions.
 */
export interface SeasonalContext {
  date: Date;
  season?: LiturgicalSeason;
  feastDays?: string[]; // IDs of feast days for current date
}

/**
 * Map JavaScript Date.getDay() (0=Sunday) to DayOfWeek type.
 */
const DAY_MAP: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Special liturgical seasons (not ordinary time)
 */
const SPECIAL_SEASONS: LiturgicalSeason[] = [
  'advent',
  'christmas',
  'lent',
  'easter',
  'pentecost',
];

/**
 * Easter Sunday dates by year (Coptic Orthodox calendar).
 * Update this for future years as needed.
 */
const EASTER_DATES: Record<number, string> = {
  2026: '2026-04-12', // April 12, 2026
  // Add future years here, e.g.:
  // 2027: '2027-04-XX',
  // 2028: '2028-04-XX',
};

/**
 * Calculate the liturgical season for a given date.
 * Easter season runs from Easter Sunday through Pentecost Sunday (50 days inclusive).
 */
export function calculateLiturgicalSeason(date: Date): LiturgicalSeason {
  const year = date.getFullYear();
  const easterDateString = EASTER_DATES[year];
  
  if (easterDateString) {
    const easterDate = new Date(easterDateString);
    const easterTime = easterDate.getTime();
    const currentTime = date.getTime();
    
    // Easter season is 50 days inclusive (Easter Sunday to Pentecost Sunday)
    // Pentecost is on day 50, so we add 49 days to Easter
    const pentecostDate = new Date(easterDate);
    pentecostDate.setDate(pentecostDate.getDate() + 49);
    const pentecostTime = pentecostDate.getTime();
    
    // Check if current date is within Easter season
    if (currentTime >= easterTime && currentTime <= pentecostTime) {
      return 'easter';
    }
  }
  
  // TODO: Calculate other seasons (advent, christmas, lent, pentecost)
  // For now, return 'ordinary' as fallback
  return 'ordinary';
}

/**
 * Check if the current context matches the given conditions.
 */
export function matchesConditions(
  conditions: ConditionalConditions,
  context: SeasonalContext
): boolean {
  // Check day of week
  if (conditions.dayOfWeek && conditions.dayOfWeek.length > 0) {
    const currentDay = DAY_MAP[context.date.getDay()];
    if (!conditions.dayOfWeek.includes(currentDay)) {
      return false;
    }
  }

  // Check liturgical season
  if (conditions.season && conditions.season.length > 0) {
    if (!context.season) {
      return false;
    }
    
    // Special handling for "ordinary": matches when NOT in any special season
    if (conditions.season.includes('ordinary')) {
      // If only "ordinary" is specified, match when current season is ordinary or not a special season
      if (conditions.season.length === 1) {
        // Match if current season is ordinary OR undefined/not a special season
        if (context.season === 'ordinary' || !SPECIAL_SEASONS.includes(context.season)) {
          return true;
        }
        return false;
      } else {
        // If "ordinary" is mixed with other seasons, treat it as matching ordinary time
        // and also match the other listed seasons
        if (context.season === 'ordinary' || conditions.season.includes(context.season)) {
          return true;
        }
        return false;
      }
    } else {
      // No "ordinary" in the list, use standard matching
      if (!conditions.season.includes(context.season)) {
        return false;
      }
    }
  }

  // Check date range
  if (conditions.dateRange && conditions.dateRange.length > 0) {
    const currentTime = context.date.getTime();
    const inRange = conditions.dateRange.some(({ start, end }) => {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      return currentTime >= startTime && currentTime <= endTime;
    });
    if (!inRange) {
      return false;
    }
  }

  // Check feast days
  if (conditions.feast && conditions.feast.length > 0) {
    if (!context.feastDays || context.feastDays.length === 0) {
      return false;
    }
    const hasFeast = conditions.feast.some((f) => context.feastDays!.includes(f));
    if (!hasFeast) {
      return false;
    }
  }

  return true;
}

/**
 * Resolve a placeholder block by finding the matching conditional block.
 * Returns the matching block from seasonals, or null if none match.
 */
export function resolvePlaceholder(
  overrideId: string,
  seasonalsData: LiturgicalText,
  context: SeasonalContext
): PrayerBlock | null {
  // Find the section with matching ID
  const section = seasonalsData.sections.find((sec) => sec.id === overrideId);
  if (!section) {
    return null;
  }

  // Find first block whose conditions match the current context
  const matchingBlock = section.blocks.find((block) =>
    block.conditions ? matchesConditions(block.conditions, context) : false
  );

  return matchingBlock || null;
}

/**
 * Process an array of blocks, replacing placeholders with resolved content.
 */
export function processBlocks(
  blocks: PrayerBlock[],
  seasonalsData: LiturgicalText,
  context: SeasonalContext
): PrayerBlock[] {
  const result: PrayerBlock[] = [];

  for (const block of blocks) {
    if (block.type === 'placeholder' && block.overrideId) {
      const resolved = resolvePlaceholder(block.overrideId, seasonalsData, context);
      if (resolved) {
        // Use the resolved block but keep the placeholder's ID
        result.push({ ...resolved, id: block.id });
      } else if (!block.optional) {
        // If no match and NOT optional, keep the placeholder (will show as empty)
        result.push(block);
      }
      // If optional and no match found, skip entirely
    } else {
      result.push(block);
    }
  }

  return result;
}

/**
 * Process sections, resolving any placeholders within their blocks.
 */
export function processSections(
  sections: LiturgicalSection[],
  seasonalsData: LiturgicalText,
  context: SeasonalContext
): LiturgicalSection[] {
  return sections.map((section) => ({
    ...section,
    blocks: processBlocks(section.blocks, seasonalsData, context),
  }));
}
