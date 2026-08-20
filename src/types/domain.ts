export type CompetitionSystem =
  | 'round_robin'
  | 'groups_playoffs'
  | 'knockout'
  | 'league_playoffs';

export type ChampionshipStatus = 'upcoming' | 'ongoing' | 'finished';

export type MemberRole = 'admin' | 'organizer';

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'suspended' | 'cancelled';

export type MatchStage = 'group' | 'knockout';

export type PlayerPosition = 'gk' | 'def' | 'mid' | 'fwd';

export type MatchEventType =
  | 'goal'
  | 'assist'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'match_start'
  | 'match_end';

export const COMPETITION_SYSTEM_LABEL: Record<CompetitionSystem, string> = {
  round_robin: 'Todos contra todos',
  groups_playoffs: 'Grupos + playoffs',
  knockout: 'Eliminación directa',
  league_playoffs: 'Liga + playoffs',
};

export const CHAMPIONSHIP_STATUS_LABEL: Record<ChampionshipStatus, string> = {
  upcoming: 'Próximo',
  ongoing: 'En curso',
  finished: 'Finalizado',
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  scheduled: 'Programado',
  live: 'En juego',
  finished: 'Finalizado',
  suspended: 'Suspendido',
  cancelled: 'Cancelado',
};

export const PLAYER_POSITION_LABEL: Record<PlayerPosition, string> = {
  gk: 'Arquero',
  def: 'Defensa',
  mid: 'Mediocampista',
  fwd: 'Delantero',
};

export const PLAYER_POSITION_SHORT: Record<PlayerPosition, string> = {
  gk: 'POR',
  def: 'DEF',
  mid: 'MED',
  fwd: 'DEL',
};

export interface StandingRow {
  team_id: string;
  team_name: string;
  team_short_name: string | null;
  team_logo_url: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface TopScorerRow {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  photo_url: string | null;
  team_id: string;
  team_name: string;
  goals: number;
  matches_played: number;
}

export interface TopAssistRow {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  photo_url: string | null;
  team_id: string;
  team_name: string;
  assists: number;
  matches_played: number;
}

export interface TopCardRow {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  photo_url: string | null;
  team_id: string;
  team_name: string;
  yellow_cards: number;
  red_cards: number;
}

export interface ChampionshipStatsRow {
  total_matches: number;
  played_matches: number;
  remaining_matches: number;
  total_goals: number;
  avg_goals_per_match: number;
  total_yellow_cards: number;
  total_red_cards: number;
  top_scoring_team_id: string | null;
  top_scoring_team_name: string | null;
  best_defense_team_id: string | null;
  best_defense_team_name: string | null;
}
