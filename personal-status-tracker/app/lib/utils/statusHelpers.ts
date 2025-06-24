import { 
  HydrationStatus, 
  MoodLevel, 
  ALTITUDE_CONFIG, 
  HYDRATION_THRESHOLDS,
  AltitudeEmoji 
} from '@/app/types/status';
import { ALTITUDE_COLORS } from '@/app/lib/constants';
import { calculateHoursSince } from './dateFormatters';

export function getHydrationStatus(lastWaterIntake: string): HydrationStatus {
  if (!lastWaterIntake) return HydrationStatus.NO_DATA;
  
  const hoursSince = calculateHoursSince(lastWaterIntake);
  
  if (hoursSince < HYDRATION_THRESHOLDS.WELL_HYDRATED) return HydrationStatus.WELL_HYDRATED;
  if (hoursSince < HYDRATION_THRESHOLDS.GOOD) return HydrationStatus.GOOD;
  if (hoursSince < HYDRATION_THRESHOLDS.TIME_FOR_WATER) return HydrationStatus.TIME_FOR_WATER;
  return HydrationStatus.DEHYDRATED;
}

export function getMoodLevel(altitude: number): MoodLevel {
  if (altitude >= ALTITUDE_CONFIG.THRESHOLDS.EXCELLENT) return MoodLevel.EXCELLENT;
  if (altitude >= ALTITUDE_CONFIG.THRESHOLDS.GOOD) return MoodLevel.GOOD;
  if (altitude >= ALTITUDE_CONFIG.THRESHOLDS.FAIR) return MoodLevel.FAIR;
  return MoodLevel.LOW;
}

export function getAltitudeColor(altitude: number): string {
  const moodLevel = getMoodLevel(altitude);
  
  switch (moodLevel) {
    case MoodLevel.EXCELLENT:
      return ALTITUDE_COLORS.EXCELLENT;
    case MoodLevel.GOOD:
      return ALTITUDE_COLORS.GOOD;
    case MoodLevel.FAIR:
      return ALTITUDE_COLORS.FAIR;
    default:
      return ALTITUDE_COLORS.LOW;
  }
}

export function getAltitudeEmoji(altitude: number): AltitudeEmoji {
  if (altitude >= 9) return '🚀';
  if (altitude >= 7) return '✈️';
  if (altitude >= 5) return '🎈';
  if (altitude >= 3) return '🪂';
  return '🏊';
}

export function validateAltitude(value: number): number {
  return Math.max(ALTITUDE_CONFIG.MIN, Math.min(ALTITUDE_CONFIG.MAX, value));
}