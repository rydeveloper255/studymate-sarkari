import { ContentSourceInfo, SourceScope, SourcePriority, SourceCategory } from '../types';
import { CENTRAL_SOURCES } from './sources/centralSources';
import { STATE_SOURCES_NORTH } from './sources/stateSourcesNorth';
import { STATE_SOURCES_SOUTH_WEST } from './sources/stateSourcesSouthWest';
import { STATE_SOURCES_NORTH_EAST_UTS } from './sources/stateSourcesNorthEastUTs';
import { INSTITUTION_SOURCES } from './sources/institutionSources';

/**
 * STUDYMATE SARKARI — OFFICIAL GOVERNMENT SOURCE REGISTRY
 *
 * Exhaustive, verified directory of primary official recruitment authorities
 * across Central Government, all 28 States, 8 Union Territories, and
 * premier National Autonomous Institutions.
 */
export const OFFICIAL_GOVERNMENT_SOURCES: ContentSourceInfo[] = [
  ...CENTRAL_SOURCES,
  ...STATE_SOURCES_NORTH,
  ...STATE_SOURCES_SOUTH_WEST,
  ...STATE_SOURCES_NORTH_EAST_UTS,
  ...INSTITUTION_SOURCES,
];

export function getSourcesByScope(scope: SourceScope): ContentSourceInfo[] {
  return OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.scope === scope && s.active);
}

export function getSourcesByState(stateCode: string): ContentSourceInfo[] {
  const code = stateCode.toUpperCase().trim();
  return OFFICIAL_GOVERNMENT_SOURCES.filter(
    (s) => s.stateCode === code && s.active
  );
}

export function getSourcesByPriority(priority: SourcePriority): ContentSourceInfo[] {
  return OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.priority === priority && s.active);
}

export function getSourcesByCategory(category: SourceCategory): ContentSourceInfo[] {
  return OFFICIAL_GOVERNMENT_SOURCES.filter(
    (s) => s.category.includes(category) && s.active
  );
}

export function getSourceStats() {
  const total = OFFICIAL_GOVERNMENT_SOURCES.length;
  const central = OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.scope === 'central').length;
  const state = OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.scope === 'state').length;
  const unionTerritory = OFFICIAL_GOVERNMENT_SOURCES.filter(
    (s) => s.scope === 'union_territory'
  ).length;
  const institution = OFFICIAL_GOVERNMENT_SOURCES.filter(
    (s) => s.scope === 'institution'
  ).length;

  const highPriority = OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.priority === 'high').length;
  const mediumPriority = OFFICIAL_GOVERNMENT_SOURCES.filter(
    (s) => s.priority === 'medium'
  ).length;
  const lowPriority = OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.priority === 'low').length;

  const activeCount = OFFICIAL_GOVERNMENT_SOURCES.filter((s) => s.active).length;

  return {
    total,
    central,
    state,
    unionTerritory,
    institution,
    highPriority,
    mediumPriority,
    lowPriority,
    activeCount,
  };
}
