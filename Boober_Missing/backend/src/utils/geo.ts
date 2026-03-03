/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate estimated travel time based on distance and average speed
 * @param distance Distance in kilometers
 * @param averageSpeedKmh Average speed in km/h (default: 30 km/h for city driving)
 * @returns Estimated time in minutes
 */
export function estimateTravelTime(distance: number, averageSpeedKmh: number = 30): number {
  const timeHours = distance / averageSpeedKmh;
  return Math.round(timeHours * 60);
}

/**
 * Calculate fare based on distance and time
 * @param distance Distance in kilometers
 * @param time Time in minutes
 * @param baseFare Base fare amount
 * @param perKmRate Rate per kilometer
 * @param perMinuteRate Rate per minute
 * @returns Total fare
 */
export function calculateFare(
  distance: number,
  time: number,
  baseFare: number = 15,
  perKmRate: number = 8,
  perMinuteRate: number = 1.5
): number {
  const distanceFare = distance * perKmRate;
  const timeFare = time * perMinuteRate;
  const totalFare = baseFare + distanceFare + timeFare;

  // Round to nearest rand
  return Math.round(totalFare);
}

/**
 * Check if a point is within a given radius of another point
 * @param lat1 Latitude of center point
 * @param lon1 Longitude of center point
 * @param lat2 Latitude of point to check
 * @param lon2 Longitude of point to check
 * @param radiusKm Radius in kilometers
 * @returns True if point is within radius
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  return distance <= radiusKm;
}

/**
 * Generate a random point within a given radius
 * @param lat Center latitude
 * @param lon Center longitude
 * @param radiusKm Radius in kilometers
 * @returns Random point coordinates
 */
export function randomPointWithinRadius(
  lat: number,
  lon: number,
  radiusKm: number
): { latitude: number; longitude: number } {
  const randomAngle = Math.random() * 2 * Math.PI;
  const randomRadius = Math.random() * radiusKm;

  // Convert km to degrees (approximate)
  const kmPerDegree = 111.32; // At the equator
  const deltaLat = (randomRadius * Math.cos(randomAngle)) / kmPerDegree;
  const deltaLon = (randomRadius * Math.sin(randomAngle)) / (kmPerDegree * Math.cos(toRad(lat)));

  return {
    latitude: lat + deltaLat,
    longitude: lon + deltaLon,
  };
}

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lon Longitude
 * @returns Formatted string
 */
export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Calculate bearing between two points
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Bearing in degrees
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  let bearing = Math.atan2(y, x);
  bearing = toDeg(bearing);
  bearing = (bearing + 360) % 360;

  return bearing;
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

/**
 * Get direction from bearing
 * @param bearing Bearing in degrees
 * @returns Direction string (N, NE, E, SE, S, SW, W, NW)
 */
export function getDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}
