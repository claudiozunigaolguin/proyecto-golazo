import type {
  ChampionshipStatus,
  CompetitionSystem,
  MatchEventType,
  MatchStage,
  MatchStatus,
  MemberRole,
  PlayerPosition,
  UserPlan,
} from './domain';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          is_super_admin: boolean;
          plan: UserPlan;
          plan_renews_at: string | null;
          mp_preapproval_id: string | null;
          mp_payer_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<{
          first_name: string;
          last_name: string;
          phone: string | null;
          avatar_url: string | null;
          plan: UserPlan;
          plan_renews_at: string | null;
          mp_preapproval_id: string | null;
          mp_payer_email: string | null;
        }>;
        Relationships: [];
      };
      championships: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          short_name: string | null;
          season: string | null;
          description: string | null;
          location: string | null;
          city: string | null;
          country: string | null;
          start_date: string | null;
          end_date: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          sport_mode: string;
          team_size: number;
          max_teams: number | null;
          competition_system: CompetitionSystem;
          points_win: number;
          points_draw: number;
          points_loss: number;
          tiebreakers: string[];
          status: ChampionshipStatus;
          is_public: boolean;
          slug: string;
          group_count: number | null;
          name_locked: boolean;
          delete_locked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          owner_id: string;
          name: string;
          short_name: string | null;
          season: string | null;
          description: string | null;
          location: string | null;
          city: string | null;
          country: string | null;
          start_date: string | null;
          end_date: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          sport_mode: string;
          team_size: number;
          max_teams: number | null;
          competition_system: CompetitionSystem;
          points_win: number;
          points_draw: number;
          points_loss: number;
          tiebreakers: string[];
          status: ChampionshipStatus;
          is_public: boolean;
          slug: string;
          group_count: number | null;
        }> & { name: string; owner_id: string };
        Update: Partial<{
          name: string;
          short_name: string | null;
          season: string | null;
          description: string | null;
          location: string | null;
          city: string | null;
          country: string | null;
          start_date: string | null;
          end_date: string | null;
          logo_url: string | null;
          cover_image_url: string | null;
          team_size: number;
          max_teams: number | null;
          competition_system: CompetitionSystem;
          points_win: number;
          points_draw: number;
          points_loss: number;
          tiebreakers: string[];
          status: ChampionshipStatus;
          is_public: boolean;
          group_count: number | null;
        }>;
        Relationships: [];
      };
      championship_members: {
        Row: {
          id: string;
          championship_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          championship_id: string;
          user_id: string;
          role: MemberRole;
        };
        Update: Partial<{ role: MemberRole }>;
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          championship_id: string;
          name: string;
          address: string | null;
          city: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          championship_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
        };
        Update: Partial<{ name: string; address: string | null; city: string | null }>;
        Relationships: [];
      };
      rounds: {
        Row: {
          id: string;
          championship_id: string;
          name: string;
          order_number: number;
          start_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          championship_id: string;
          name: string;
          order_number: number;
          start_date?: string | null;
        };
        Update: Partial<{ name: string; order_number: number; start_date: string | null }>;
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          championship_id: string;
          name: string;
          order_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          championship_id: string;
          name: string;
          order_number: number;
        };
        Update: Partial<{ name: string; order_number: number }>;
        Relationships: [];
      };
      clubs: {
        Row: {
          id: string;
          championship_id: string;
          name: string;
          short_name: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          short_name: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
        }> & { championship_id: string; name: string };
        Update: Partial<{
          name: string;
          short_name: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
        }>;
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          championship_id: string;
          name: string;
          short_name: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          captain_player_id: string | null;
          coach_name: string | null;
          group_id: string | null;
          club_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          captain_player_id: string | null;
          coach_name: string | null;
          short_name: string | null;
          group_id: string | null;
          club_id: string | null;
        }> & { championship_id: string; name: string };
        Update: Partial<{
          name: string;
          short_name: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          captain_player_id: string | null;
          coach_name: string | null;
          group_id: string | null;
          club_id: string | null;
        }>;
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          championship_id: string;
          first_name: string;
          last_name: string;
          jersey_number: number | null;
          photo_url: string | null;
          position: PlayerPosition;
          birth_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          jersey_number: number | null;
          photo_url: string | null;
          birth_date: string | null;
        }> & {
          team_id: string;
          championship_id: string;
          first_name: string;
          last_name: string;
          position: PlayerPosition;
        };
        Update: Partial<{
          first_name: string;
          last_name: string;
          jersey_number: number | null;
          photo_url: string | null;
          position: PlayerPosition;
          birth_date: string | null;
          team_id: string;
        }>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          championship_id: string;
          round_id: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          venue_id: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          current_minute: number | null;
          is_live: boolean;
          stage: MatchStage;
          bracket_round: string | null;
          bracket_round_order: number | null;
          bracket_position: number | null;
          next_match_id: string | null;
          next_match_slot: 'home' | 'away' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          round_id: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          venue_id: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          current_minute: number | null;
          is_live: boolean;
          stage: MatchStage;
          bracket_round: string | null;
          bracket_round_order: number | null;
          bracket_position: number | null;
          next_match_id: string | null;
          next_match_slot: 'home' | 'away' | null;
        }> & { championship_id: string };
        Update: Partial<{
          round_id: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          venue_id: string | null;
          scheduled_at: string | null;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          current_minute: number | null;
          is_live: boolean;
          stage: MatchStage;
          bracket_round: string | null;
          bracket_round_order: number | null;
          bracket_position: number | null;
          next_match_id: string | null;
          next_match_slot: 'home' | 'away' | null;
        }>;
        Relationships: [];
      };
      match_events: {
        Row: {
          id: string;
          match_id: string;
          championship_id: string;
          team_id: string;
          player_id: string | null;
          related_player_id: string | null;
          type: MatchEventType;
          minute: number | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<{
          id: string;
          championship_id: string;
          player_id: string | null;
          related_player_id: string | null;
          minute: number | null;
          notes: string | null;
          created_by: string | null;
        }> & {
          match_id: string;
          team_id: string;
          type: MatchEventType;
        };
        Update: Partial<{
          player_id: string | null;
          related_player_id: string | null;
          minute: number | null;
          notes: string | null;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data: Record<string, unknown> | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data?: Record<string, unknown> | null;
        };
        Update: Partial<{ read_at: string | null }>;
        Relationships: [];
      };
    };
    Views: {
      goals: { Row: Database['public']['Tables']['match_events']['Row']; Relationships: [] };
      assists: { Row: Database['public']['Tables']['match_events']['Row']; Relationships: [] };
      cards: { Row: Database['public']['Tables']['match_events']['Row']; Relationships: [] };
    };
    Functions: {
      get_my_billing_status: {
        Args: Record<string, never>;
        Returns: {
          plan: UserPlan;
          is_super_admin: boolean;
          championship_count: number;
          championship_limit: number | null;
          plan_renews_at: string | null;
        }[];
      };
      get_championship_limit: {
        Args: { p_user_id: string };
        Returns: number | null;
      };
      get_standings: {
        Args: { p_championship_id: string; p_group_id?: string | null };
        Returns: {
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
        }[];
      };
      get_club_standings: {
        Args: { p_championship_id: string };
        Returns: {
          club_id: string;
          club_name: string;
          club_short_name: string | null;
          club_logo_url: string | null;
          played: number;
          won: number;
          drawn: number;
          lost: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          points: number;
        }[];
      };
      get_top_scorers: {
        Args: { p_championship_id: string; p_limit?: number };
        Returns: {
          player_id: string;
          first_name: string;
          last_name: string;
          jersey_number: number | null;
          photo_url: string | null;
          team_id: string;
          team_name: string;
          goals: number;
          matches_played: number;
        }[];
      };
      get_top_assists: {
        Args: { p_championship_id: string; p_limit?: number };
        Returns: {
          player_id: string;
          first_name: string;
          last_name: string;
          jersey_number: number | null;
          photo_url: string | null;
          team_id: string;
          team_name: string;
          assists: number;
          matches_played: number;
        }[];
      };
      get_top_cards: {
        Args: { p_championship_id: string; p_limit?: number };
        Returns: {
          player_id: string;
          first_name: string;
          last_name: string;
          jersey_number: number | null;
          photo_url: string | null;
          team_id: string;
          team_name: string;
          yellow_cards: number;
          red_cards: number;
        }[];
      };
      get_championship_stats: {
        Args: { p_championship_id: string };
        Returns: {
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
        }[];
      };
    };
  };
}
