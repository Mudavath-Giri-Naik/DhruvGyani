/**
 * Where the sun is for a place and moment, from the standard NOAA solar
 * position approximations. Good to a fraction of a degree, which is plenty
 * for "is it polar night at the station right now?".
 */
const RAD = Math.PI / 180;
/** The sun counts as risen when its centre is above -0.833° (refraction plus the solar radius). */
const HORIZON = -0.833;

export type SunState = "polar_day" | "polar_night" | "day" | "twilight" | "night";

export interface SunInfo {
  /** Degrees above the horizon (negative when below). */
  elevation: number;
  /** Hours of daylight on this date: 0 in polar night, 24 in polar day. */
  daylightHours: number;
  state: SunState;
  /** Local solar time in minutes after midnight (the sun is highest at 720). */
  solarMinutes: number;
}

function declinationAndEqTime(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000) + 1;
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - 12) / 24);
  const declination =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  return { declination, eqTime };
}

export function sunInfo(lat: number, lng: number, date: Date): SunInfo {
  const { declination, eqTime } = declinationAndEqTime(date);
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const solarMinutes = (((utcMinutes + eqTime + 4 * lng) % 1440) + 1440) % 1440;
  const hourAngle = (solarMinutes / 4 - 180) * RAD;
  const phi = lat * RAD;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle)) / RAD;

  const cosOmega = (Math.sin(HORIZON * RAD) - Math.sin(phi) * Math.sin(declination)) / (Math.cos(phi) * Math.cos(declination));
  const daylightHours = cosOmega >= 1 ? 0 : cosOmega <= -1 ? 24 : (2 * Math.acos(cosOmega)) / RAD / 15;

  const state: SunState = daylightHours === 24 ? "polar_day" : daylightHours === 0 ? "polar_night" : elevation > HORIZON ? "day" : elevation > -6 ? "twilight" : "night";
  return { elevation, daylightHours, state, solarMinutes };
}
