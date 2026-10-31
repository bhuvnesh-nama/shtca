/**
 * Advanced Spatial Geofencing & Nearest-Neighbor Authority Routing Engine
 * Implements DSA Spatial Distance Calculation (Haversine Formula) & Multi-Tier Jurisdiction
 */

export interface AuthorityNode {
  id: string;
  name: string;
  office: string;
  tier: "apex_central" | "zonal_ward" | "local_society";
  level: 1 | 2 | 3;
  latitude: number;
  longitude: number;
  jurisdictionRadiusKm: number;
  jurisdictionType: "Arterial Infrastructure" | "Zonal Sector Public Works" | "Housing Society & Colony";
  contactNumber: string;
}

// Haversine Spherical Distance Algorithm (DSA Concept)
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Registered Multi-Tier Governance Authority Registry
export const AUTHORITY_REGISTRY: AuthorityNode[] = [
  // TIER 1: Apex Central Municipal Public Works & Highway Commissionerates
  {
    id: "AUTH-APEX-01",
    name: "Central Municipal Commissionerate & PWD Apex Division",
    office: "Apex Civic Center, Central Engineering Directorate",
    tier: "apex_central",
    level: 1,
    latitude: 28.6304,
    longitude: 77.2177,
    jurisdictionRadiusKm: 50.0,
    jurisdictionType: "Arterial Infrastructure",
    contactNumber: "011-23225000",
  },
  {
    id: "AUTH-APEX-RAJASTHAN",
    name: "Rajasthan Urban Infrastructure & Local Bodies Directorate",
    office: "Directorate of Local Bodies (DLB), Tonk Road, Jaipur",
    tier: "apex_central",
    level: 1,
    latitude: 26.8950,
    longitude: 75.8050,
    jurisdictionRadiusKm: 60.0,
    jurisdictionType: "Arterial Infrastructure",
    contactNumber: "0141-2223800",
  },
  // TIER 2: Zonal / Ward Municipal Divisions - Delhi NCR
  {
    id: "AUTH-ZONE-EAST",
    name: "East Zone Municipal Public Works Division",
    office: "Ward 42 Zonal Engineering Office, Anand Vihar",
    tier: "zonal_ward",
    level: 2,
    latitude: 28.6469,
    longitude: 77.3060,
    jurisdictionRadiusKm: 12.0,
    jurisdictionType: "Zonal Sector Public Works",
    contactNumber: "011-22143001",
  },
  {
    id: "AUTH-ZONE-CENTRAL",
    name: "Central Zone Municipal Infrastructure Cell",
    office: "Civic Redressal Building, Connaught Place Sub-Division",
    tier: "zonal_ward",
    level: 2,
    latitude: 28.6328,
    longitude: 77.2197,
    jurisdictionRadiusKm: 10.0,
    jurisdictionType: "Zonal Sector Public Works",
    contactNumber: "011-23348002",
  },
  {
    id: "AUTH-ZONE-SOUTH",
    name: "South Zone Municipal Engineering Works",
    office: "South Zonal Redressal Center, Green Park",
    tier: "zonal_ward",
    level: 2,
    latitude: 28.5583,
    longitude: 77.2028,
    jurisdictionRadiusKm: 15.0,
    jurisdictionType: "Zonal Sector Public Works",
    contactNumber: "011-26514003",
  },
  // TIER 2: Zonal / Ward Municipal Divisions - Jaipur
  {
    id: "AUTH-ZONE-JAIPUR-MALVIYA",
    name: "Jaipur Greater Municipal Corporation (Malviya Nagar & Jagatpura Zone)",
    office: "Zonal Municipal Engineering Center, Calgiri Marg, Malviya Nagar, Jaipur",
    tier: "zonal_ward",
    level: 2,
    latitude: 26.8530,
    longitude: 75.8190,
    jurisdictionRadiusKm: 15.0,
    jurisdictionType: "Zonal Sector Public Works",
    contactNumber: "0141-2720101",
  },
  {
    id: "AUTH-ZONE-JAIPUR-HERITAGE",
    name: "Jaipur Heritage Municipal Corporation (Central & Old City Zone)",
    office: "Heritage Municipal Headquarters, Jaleb Chowk, Badi Chaupar, Jaipur",
    tier: "zonal_ward",
    level: 2,
    latitude: 26.9239,
    longitude: 75.8267,
    jurisdictionRadiusKm: 15.0,
    jurisdictionType: "Zonal Sector Public Works",
    contactNumber: "0141-2601202",
  },
  // TIER 3: Local Resident Welfare Associations (RWA) & Housing Societies (Micro Geofence)
  {
    id: "AUTH-RWA-JAIPUR-JLP",
    name: "Jawahar Circle & Malviya Enclave Residents Welfare Association",
    office: "Community Estate Center, Sector 3, Near Jawahar Circle, Jaipur",
    tier: "local_society",
    level: 3,
    latitude: 26.8480,
    longitude: 75.8010,
    jurisdictionRadiusKm: 1.0,
    jurisdictionType: "Housing Society & Colony",
    contactNumber: "+91-9414012345",
  },
  {
    id: "AUTH-RWA-PREET",
    name: "Preet Vihar Resident Welfare Association (RWA Cell)",
    office: "Community Estate Management Office, C-Block Preet Vihar",
    tier: "local_society",
    level: 3,
    latitude: 28.6370,
    longitude: 77.2950,
    jurisdictionRadiusKm: 1.5,
    jurisdictionType: "Housing Society & Colony",
    contactNumber: "+91-9811023450",
  },
  {
    id: "AUTH-RWA-MAYUR",
    name: "Mayur Vihar Pocket-1 Resident Welfare Society",
    office: "Pocket 1 Society Estate Secretariat, Mayur Vihar",
    tier: "local_society",
    level: 3,
    latitude: 28.6080,
    longitude: 77.2980,
    jurisdictionRadiusKm: 1.2,
    jurisdictionType: "Housing Society & Colony",
    contactNumber: "+91-9811098760",
  },
  {
    id: "AUTH-RWA-CONNAUGHT",
    name: "Connaught Residents & Traders Welfare Group",
    office: "Barakhamba Road Estate Coordination Cell",
    tier: "local_society",
    level: 3,
    latitude: 28.6290,
    longitude: 77.2210,
    jurisdictionRadiusKm: 1.0,
    jurisdictionType: "Housing Society & Colony",
    contactNumber: "+91-9871144332",
  },
];

export interface ResolvedRouting {
  officeId: string;
  tier: "apex_central" | "zonal_ward" | "local_society";
  name: string;
  office: string;
  jurisdictionType: "Arterial Infrastructure" | "Zonal Sector Public Works" | "Housing Society & Colony";
  distanceKm: number;
  routingReason: string;
  contactNumber: string;
}

/**
 * Intelligent Spatial Dispatch Resolver
 * 1. Categorizes issue: Arterial / Major Public Works vs Internal Society / Ward.
 * 2. If Arterial/High-voltage/Trunk water main -> Routes to Apex Central Authority (Tier 1).
 * 3. If Local/Society issue -> Runs Haversine Nearest Neighbor search among Tier 3 RWAs.
 *    If nearest RWA is within jurisdiction radius (< 1.5km) -> Dispatches to Local Society Admin!
 * 4. Fallback / Nearest Neighbor search among Tier 2 Zonal Municipal Offices if outside society boundary.
 */
export function resolveNearestAuthority(
  latitude: number,
  longitude: number,
  category: string,
  severity?: string,
  title?: string,
  description?: string
): ResolvedRouting {
  const textCorpus = `${title || ""} ${description || ""}`.toLowerCase();

  // 1. Detect if issue requires Tier 1 Central Municipal / PWD Apex Body
  const isArterialOrMajor =
    textCorpus.includes("highway") ||
    textCorpus.includes("flyover") ||
    textCorpus.includes("arterial") ||
    textCorpus.includes("main road") ||
    textCorpus.includes("substation") ||
    textCorpus.includes("transformer") ||
    textCorpus.includes("trunk pipeline") ||
    textCorpus.includes("water treatment") ||
    severity === "critical";

  if (isArterialOrMajor) {
    const apexNodes = AUTHORITY_REGISTRY.filter((a) => a.tier === "apex_central");
    let closestApex = apexNodes[0];
    let minApexDist = Infinity;
    for (const node of apexNodes) {
      const d = calculateHaversineDistance(latitude, longitude, node.latitude, node.longitude);
      if (d < minApexDist) {
        minApexDist = d;
        closestApex = node;
      }
    }

    if (minApexDist <= (closestApex.jurisdictionRadiusKm || 60)) {
      return {
        officeId: closestApex.id,
        tier: "apex_central",
        name: closestApex.name,
        office: closestApex.office,
        jurisdictionType: closestApex.jurisdictionType,
        distanceKm: minApexDist,
        routingReason: `Arterial Infrastructure & High-Impact Public Works: Dispatched to Regional Apex Directorate (${minApexDist} km away)`,
        contactNumber: closestApex.contactNumber,
      };
    }
  }

  // 2. Search for Nearest Local Society / RWA Admin (Tier 3) within Geofence
  const societyNodes = AUTHORITY_REGISTRY.filter((a) => a.tier === "local_society");
  let nearestSociety: AuthorityNode | null = null;
  let minSocietyDist = Infinity;

  for (const node of societyNodes) {
    const dist = calculateHaversineDistance(latitude, longitude, node.latitude, node.longitude);
    if (dist < minSocietyDist) {
      minSocietyDist = dist;
      nearestSociety = node;
    }
  }

  // If inside registered society geofence boundary (<= jurisdiction radius)
  if (nearestSociety && minSocietyDist <= nearestSociety.jurisdictionRadiusKm) {
    return {
      officeId: nearestSociety.id,
      tier: "local_society",
      name: nearestSociety.name,
      office: nearestSociety.office,
      jurisdictionType: nearestSociety.jurisdictionType,
      distanceKm: minSocietyDist,
      routingReason: `Spatial Geofence Match: Issue located within Colony/Society Boundary (${minSocietyDist} km)`,
      contactNumber: nearestSociety.contactNumber,
    };
  }

  // 3. Fallback to Nearest Zonal / Ward Municipal Office (Tier 2)
  const zonalNodes = AUTHORITY_REGISTRY.filter((a) => a.tier === "zonal_ward");
  let nearestZonal: AuthorityNode = zonalNodes[0];
  let minZonalDist = Infinity;

  for (const node of zonalNodes) {
    const dist = calculateHaversineDistance(latitude, longitude, node.latitude, node.longitude);
    if (dist < minZonalDist) {
      minZonalDist = dist;
      nearestZonal = node;
    }
  }

  return {
    officeId: nearestZonal.id,
    tier: "zonal_ward",
    name: nearestZonal.name,
    office: nearestZonal.office,
    jurisdictionType: nearestZonal.jurisdictionType,
    distanceKm: minZonalDist,
    routingReason: `Nearest-Office Fallback: Area has no local society office. Dispatched to closest Zonal Ward Office (${minZonalDist} km away)`,
    contactNumber: nearestZonal.contactNumber,
  };
}

