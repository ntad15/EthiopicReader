/**
 * Feature flags — edit here to toggle experimental behaviour.
 *
 * COMBINED_QIDASE_MODE
 *   false (default): home screen shows the existing "Qidase" accordion that expands into
 *                    Kidan, Serate Qidase, and Fere Qidase sub-tiles.
 *   true:            home screen shows two flat cards — "Kidan" and "Qidase".
 *                    Tapping Qidase opens an anaphora picker, then renders
 *                    Serate Qidase + the chosen Fere Qidase together as one continuous reading.
 */
export const COMBINED_QIDASE_MODE = true;
