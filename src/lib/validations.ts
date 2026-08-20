import { z } from 'zod';

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Ingresa tu nombre'),
    lastName: z.string().trim().min(1, 'Ingresa tu apellido'),
    email: z.string().trim().email('Email inválido'),
    phone: z.string().trim().optional(),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Email inválido'),
});

export const championshipSchema = z.object({
  name: z.string().trim().min(3, 'Mínimo 3 caracteres'),
  shortName: z.string().trim().max(12).optional(),
  season: z.string().trim().optional(),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  city: z.string().trim().optional(),
  country: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teamSize: z.number().int().min(5).max(11).default(6),
  maxTeams: z.number().int().min(2).max(64).optional(),
  competitionSystem: z.enum([
    'round_robin',
    'groups_playoffs',
    'knockout',
    'league_playoffs',
    'league_series',
  ]),
  groupCount: z.number().int().min(2).max(12).optional(),
  pointsWin: z.number().int().min(0).default(3),
  pointsDraw: z.number().int().min(0).default(1),
  pointsLoss: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(true),
});

export type ChampionshipInput = z.infer<typeof championshipSchema>;

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  shortName: z.string().trim().max(6).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  coachName: z.string().trim().optional(),
});

export type TeamInput = z.infer<typeof teamSchema>;

export const clubSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres'),
  shortName: z.string().trim().max(6).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
});

export type ClubInput = z.infer<typeof clubSchema>;

export const playerSchema = z.object({
  firstName: z.string().trim().min(1, 'Ingresa el nombre'),
  lastName: z.string().trim().min(1, 'Ingresa el apellido'),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
  position: z.enum(['gk', 'def', 'mid', 'fwd']),
});

export type PlayerInput = z.infer<typeof playerSchema>;

export const matchResultSchema = z.object({
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export type MatchResultInput = z.infer<typeof matchResultSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  role: z.enum(['admin', 'organizer']),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
