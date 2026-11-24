/**
 * A rough land mask for the dotted globe: each entry is an ellipse in degrees
 * [centre latitude, centre longitude, latitude radius, longitude radius].
 * It only needs to read as "continents" at a glance, not be a real map.
 */
export const LAND: readonly (readonly [number, number, number, number])[] = [
  // Africa
  [8, 20, 20, 18],
  [-15, 25, 15, 13],
  [-28, 24, 7, 9],
  [24, 8, 10, 24],
  [28, 31, 6, 6],
  [11, 42, 5, 6],
  [-19, 46.5, 6, 2.2],
  // Middle East
  [23, 46, 9, 9],
  [32, 54, 6, 9],
  [39, 35, 3, 8],
  // Europe
  [48, 12, 8, 18],
  [56, 26, 8, 20],
  [41, -4, 4, 5],
  [61, 15, 6, 10],
  [54, -2, 4, 3],
  // Asia
  [56, 90, 13, 40],
  [63, 122, 10, 30],
  [41, 68, 8, 15],
  [35, 104, 12, 15],
  [45, 122, 8, 12],
  [22, 78, 8, 8],
  [14, 77, 6, 4],
  [9.5, 77.3, 3, 2.5],
  [7.8, 80.7, 1.6, 1],
  [16, 100, 7, 5],
  [5, 102, 4, 3],
  [12, 106, 5, 3],
  [12, 122, 4, 2],
  [36, 138, 4, 3],
  // Indonesia
  [-1, 103, 3, 6],
  [-1, 114, 3, 4],
  [-3, 121, 3, 3],
  [-7, 111, 1.5, 6],
  [-5, 139, 3, 7],
  // Australia
  [-25, 134, 10, 17],
  [-17, 140, 4, 6],
  [-33, 145, 4, 6],
  [-31, 117, 5, 5],
  // Americas
  [45, -100, 14, 25],
  [60, -110, 9, 30],
  [35, -85, 8, 10],
  [20, -100, 6, 8],
  [10, -84, 4, 4],
  [-10, -60, 16, 14],
  [-30, -62, 10, 8],
  [-45, -70, 7, 4],
  [5, -68, 6, 10],
  [70, -42, 8, 14],
];

export function isLand(lat: number, lon: number) {
  for (const [a, b, ra, rb] of LAND) {
    const x = (lat - a) / ra;
    const y = (lon - b) / rb;
    if (x * x + y * y < 1) return true;
  }
  return false;
}

export const HOME = { lat: 6.93, lon: 79.86 }; // Colombo

export const DESTINATIONS: readonly (readonly [number, number])[] = [
  [51.5, -0.1], // London
  [25.2, 55.3], // Dubai
  [1.35, 103.8], // Singapore
  [35.7, 139.7], // Tokyo
  [-31.9, 115.9], // Perth
  [-1.3, 36.8], // Nairobi
  [55.7, 37.6], // Moscow
];
