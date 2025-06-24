export interface StatusData {
  lastWaterIntake: string;
  altitude: number;
  lastUpdated: string;
}

export enum HydrationStatus {
  WELL_HYDRATED = 'Well hydrated ✅',
  GOOD = 'Good 👍',
  TIME_FOR_WATER = 'Time for water ⏰',
  DEHYDRATED = 'Dehydrated! 🚨',
  NO_DATA = 'No data'
}

export enum MoodLevel {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  FAIR = 'Fair',
  LOW = 'Low'
}

export const ALTITUDE_CONFIG = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 5,
  THRESHOLDS: {
    EXCELLENT: 8,
    GOOD: 6,
    FAIR: 4
  }
} as const;

export const HYDRATION_THRESHOLDS = {
  WELL_HYDRATED: 1,
  GOOD: 3,
  TIME_FOR_WATER: 6
} as const;

export type AltitudeEmoji = '🚀' | '✈️' | '🎈' | '🪂' | '🏊';

export interface TimeAgoOptions {
  locale?: string;
  includeSeconds?: boolean;
}