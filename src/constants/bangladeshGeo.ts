import geoData from './bangladeshGeo.json';

export interface Division {
  id: string;
  name: string;
  bn_name: string;
}

export interface District {
  id: string;
  division_id: string;
  name: string;
  bn_name: string;
}

export interface Upazila {
  id: string;
  district_id: string;
  name: string;
  bn_name: string;
}

export interface BangladeshGeoData {
  divisions: Division[];
  districts: District[];
  upazilas: Upazila[];
}

export const bangladeshGeo: BangladeshGeoData = geoData as BangladeshGeoData;

/**
 * Get all 8 divisions
 */
export function getDivisions(): Division[] {
  return bangladeshGeo.divisions;
}

/**
 * Get all districts belonging to a specific division
 */
export function getDistrictsByDivision(divisionId: string): District[] {
  if (!divisionId) return [];
  return bangladeshGeo.districts.filter(
    (d) => String(d.division_id) === String(divisionId)
  );
}

/**
 * Get all upazilas belonging to a specific district
 */
export function getUpazilasByDistrict(districtId: string): Upazila[] {
  if (!districtId) return [];
  return bangladeshGeo.upazilas.filter(
    (u) => String(u.district_id) === String(districtId)
  );
}

/**
 * Find division by id
 */
export function getDivisionById(divisionId: string): Division | undefined {
  return bangladeshGeo.divisions.find(
    (d) => String(d.id) === String(divisionId)
  );
}

/**
 * Find district by id
 */
export function getDistrictById(districtId: string): District | undefined {
  return bangladeshGeo.districts.find(
    (d) => String(d.id) === String(districtId)
  );
}

/**
 * Find upazila by id
 */
export function getUpazilaById(upazilaId: string): Upazila | undefined {
  return bangladeshGeo.upazilas.find((u) => String(u.id) === String(upazilaId));
}

/**
 * Helper to format a combined location string: e.g. "শ্রীপুর, গাজীপুর, ঢাকা"
 */
export function formatLocationString({
  divisionId,
  districtId,
  upazilaId,
  locale = 'bn',
}: {
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  locale?: 'bn' | 'en';
}): string {
  const parts: string[] = [];

  if (upazilaId) {
    const upazila = getUpazilaById(upazilaId);
    if (upazila) parts.push(locale === 'bn' ? upazila.bn_name : upazila.name);
  }

  if (districtId) {
    const district = getDistrictById(districtId);
    if (district)
      parts.push(locale === 'bn' ? district.bn_name : district.name);
  }

  if (divisionId) {
    const division = getDivisionById(divisionId);
    if (division)
      parts.push(locale === 'bn' ? division.bn_name : division.name);
  }

  return parts.join(', ');
}

/**
 * Intelligent matcher from user profile location info into cascading Geo format.
 */
export function matchUserLocationToGeo(
  user?: {
    country?: string | null;
    countryCode?: string | null;
    state?: string | null;
    city?: string | null;
    location?: string | null;
  } | null
): {
  country: string;
  countryCode: string;
  state: string;
  city: string;
  location: string;
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
  detailedAddress?: string;
} {
  const emptyResult = {
    country: user?.country || 'Bangladesh',
    countryCode: user?.countryCode || 'BD',
    state: '',
    city: '',
    location: '',
    divisionId: undefined,
    districtId: undefined,
    upazilaId: undefined,
    detailedAddress: '',
  };

  if (!user) return emptyResult;

  const rawLocation = (user.location || '').trim();
  const rawCity = (user.city || '').trim();
  const rawState = (user.state || '').trim();

  // If user has no location set at all
  if (!rawLocation && !rawCity && !rawState) {
    return emptyResult;
  }

  const normalize = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');

  const normLocation = normalize(rawLocation);
  const normCity = normalize(rawCity);
  const normState = normalize(rawState);

  const matchesName = (
    target: string,
    name: string,
    bnName: string,
    aliases: string[] = []
  ) => {
    if (!target) return false;
    const nName = normalize(name);
    const nBn = normalize(bnName);
    if (
      target === nName ||
      target === nBn ||
      target.includes(nName) ||
      target.includes(nBn)
    ) {
      return true;
    }
    return aliases.some(
      (a) => target === normalize(a) || target.includes(normalize(a))
    );
  };

  let foundDistrict: District | undefined;
  let foundDivision: Division | undefined;
  let foundUpazila: Upazila | undefined;

  // 1. Try to find District matching city, location, or state
  const districtAliases: Record<string, string[]> = {
    Chittagong: ['Chattogram'],
    Chattogram: ['Chittagong'],
    Barisal: ['Barishal'],
    Barishal: ['Barisal'],
    Bogra: ['Bogura'],
    Bogura: ['Bogra'],
    Comilla: ['Cumilla'],
    Cumilla: ['Comilla'],
    Jessore: ['Jashore'],
    Jashore: ['Jessore'],
  };

  for (const d of bangladeshGeo.districts) {
    const aliases = districtAliases[d.name] || [];
    if (
      (normCity && matchesName(normCity, d.name, d.bn_name, aliases)) ||
      (normLocation && matchesName(normLocation, d.name, d.bn_name, aliases)) ||
      (normState && matchesName(normState, d.name, d.bn_name, aliases))
    ) {
      foundDistrict = d;
      break;
    }
  }

  // 2. If district found, get its division
  if (foundDistrict) {
    foundDivision = getDivisionById(foundDistrict.division_id);

    // Try to find Upazila in that district if location specifies one
    if (normLocation) {
      const upazilasInDist = getUpazilasByDistrict(foundDistrict.id);
      for (const u of upazilasInDist) {
        if (matchesName(normLocation, u.name, u.bn_name)) {
          foundUpazila = u;
          break;
        }
      }
    }
  } else {
    // 3. If no district matched, try to match Division directly
    const divisionAliases: Record<string, string[]> = {
      Chattagram: ['Chittagong'],
      Barisal: ['Barishal'],
    };

    for (const div of bangladeshGeo.divisions) {
      const aliases = divisionAliases[div.name] || [];
      if (
        (normState && matchesName(normState, div.name, div.bn_name, aliases)) ||
        (normLocation &&
          matchesName(normLocation, div.name, div.bn_name, aliases)) ||
        (normCity && matchesName(normCity, div.name, div.bn_name, aliases))
      ) {
        foundDivision = div;
        break;
      }
    }
  }

  const finalLocation =
    rawLocation ||
    (foundDistrict ? foundDistrict.name : '') ||
    (foundDivision ? foundDivision.name : '');

  return {
    country: user.country || 'Bangladesh',
    countryCode: user.countryCode || 'BD',
    state: foundDivision ? foundDivision.name : rawState || '',
    city: foundDistrict ? foundDistrict.name : rawCity || '',
    location: finalLocation,
    divisionId: foundDivision ? String(foundDivision.id) : undefined,
    districtId: foundDistrict ? String(foundDistrict.id) : undefined,
    upazilaId: foundUpazila ? String(foundUpazila.id) : undefined,
    detailedAddress: '',
  };
}
