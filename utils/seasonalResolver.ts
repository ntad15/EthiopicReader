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
    if (!context.season || !conditions.season.includes(context.season)) {
      return false;
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
