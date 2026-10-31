export interface LocalOfficeJurisdiction {
  id: string;
  name: string;
  shortName: string;
  tier: "apex_central" | "zonal_ward" | "local_society";
  tierBadge: string;
  office: string;
  areaLabel: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  radiusKm: number;
  contactNumber: string;
  zoneKeywords: string[];
  governingBody: string;
  icon: string;
}

export const LOCAL_JURISDICTION_OFFICES: LocalOfficeJurisdiction[] = [
  {
    id: "AUTH-APEX-01",
    name: "Central Municipal Commissionerate & PWD Apex Division",
    shortName: "Apex Central Overview",
    tier: "apex_central",
    tierBadge: "Tier 1: Apex Central",
    office: "Apex Civic Center, Central Directorate",
    areaLabel: "All Zones (Systemwide Apex Command)",
    center: [28.6304, 77.2177],
    zoom: 12,
    radiusKm: 50.0,
    contactNumber: "011-23225000",
    zoneKeywords: ["all"],
    governingBody: "State Directorate & Central PWD",
    icon: "🏛️",
  },
  {
    id: "AUTH-APEX-RAJASTHAN",
    name: "Rajasthan Urban Infrastructure & DLB Directorate",
    shortName: "Rajasthan State Apex",
    tier: "apex_central",
    tierBadge: "Tier 1: Apex State",
    office: "Directorate of Local Bodies (DLB), Tonk Road, Jaipur",
    areaLabel: "Jaipur Metropolitan & State Urban Core",
    center: [26.8950, 75.8050],
    zoom: 12,
    radiusKm: 60.0,
    contactNumber: "0141-2223800",
    zoneKeywords: ["rajasthan", "dlb", "jaipur"],
    governingBody: "Department of Local Self Government, Rajasthan",
    icon: "🏛️",
  },
  {
    id: "AUTH-ZONE-JAIPUR-MALVIYA",
    name: "Jaipur Greater Municipal Corporation (Malviya Nagar & Jagatpura Zone)",
    shortName: "Jaipur Greater (Malviya Nagar)",
    tier: "zonal_ward",
    tierBadge: "Tier 2: Zonal Ward",
    office: "Zonal Municipal Engineering Center, Calgiri Marg, Malviya Nagar, Jaipur",
    areaLabel: "Malviya Nagar, Jagatpura, JLN Marg & Sanganer",
    center: [26.8530, 75.8190],
    zoom: 14,
    radiusKm: 15.0,
    contactNumber: "0141-2720101",
    zoneKeywords: ["jaipur", "malviya nagar", "jagatpura", "jln marg", "calgiri", "gaurav tower", "jawahar circle", "sanganer"],
    governingBody: "Jaipur Greater Nagar Nigam (JMC Greater)",
    icon: "🏢",
  },
  {
    id: "AUTH-ZONE-JAIPUR-HERITAGE",
    name: "Jaipur Heritage Municipal Corporation (Central & Old City Zone)",
    shortName: "Jaipur Heritage Division",
    tier: "zonal_ward",
    tierBadge: "Tier 2: Zonal Ward",
    office: "Heritage Municipal Headquarters, Jaleb Chowk, Badi Chaupar, Jaipur",
    areaLabel: "Walled Pink City, MI Road, C-Scheme & Civil Lines",
    center: [26.9239, 75.8267],
    zoom: 14,
    radiusKm: 15.0,
    contactNumber: "0141-2601202",
    zoneKeywords: ["heritage", "badi chaupar", "mi road", "c-scheme", "civil lines", "pink city", "chhoti chaupar", "sindhi camp"],
    governingBody: "Jaipur Heritage Nagar Nigam (JMC Heritage)",
    icon: "🏢",
  },
  {
    id: "AUTH-RWA-JAIPUR-JLP",
    name: "Jawahar Circle & Malviya Enclave Residents Welfare Association",
    shortName: "Jawahar Circle RWA",
    tier: "local_society",
    tierBadge: "Tier 3: Colony RWA",
    office: "Community Estate Center, Sector 3, Near Jawahar Circle, Jaipur",
    areaLabel: "Jawahar Circle & Sector 1-4 Enclave",
    center: [26.8480, 75.8010],
    zoom: 16,
    radiusKm: 1.0,
    contactNumber: "+91-9414012345",
    zoneKeywords: ["jawahar circle", "patrika gate", "malviya enclave", "sector 3", "sector 4"],
    governingBody: "Resident Welfare Association (RWA Cell)",
    icon: "🏡",
  },
  {
    id: "AUTH-ZONE-EAST",
    name: "East Zone Municipal Public Works Division",
    shortName: "East Zone Division",
    tier: "zonal_ward",
    tierBadge: "Tier 2: Zonal Ward",
    office: "Ward 42 Zonal Office, Anand Vihar",
    areaLabel: "Preet Vihar, Anand Vihar & East Zone",
    center: [28.6469, 77.3060],
    zoom: 14,
    radiusKm: 12.0,
    contactNumber: "011-22143001",
    zoneKeywords: ["east", "anand vihar", "preet vihar", "laxmi nagar", "patparganj", "vikas marg"],
    governingBody: "East Zone Municipal Ward Directorate",
    icon: "🏢",
  },
  {
    id: "AUTH-ZONE-CENTRAL",
    name: "Central Zone Municipal Infrastructure Cell",
    shortName: "Central Zone Office",
    tier: "zonal_ward",
    tierBadge: "Tier 2: Zonal Ward",
    office: "Civic Redressal Building, Connaught Place Sub-Division",
    areaLabel: "Connaught Place, Karol Bagh & Central Zone",
    center: [28.6328, 77.2197],
    zoom: 14,
    radiusKm: 10.0,
    contactNumber: "011-23348002",
    zoneKeywords: ["central", "connaught", "karol bagh", "paharganj", "barakhamba", "outer circle"],
    governingBody: "Central Zone Municipal Ward Directorate",
    icon: "🏢",
  },
  {
    id: "AUTH-ZONE-SOUTH",
    name: "South Zone Municipal Engineering Works",
    shortName: "South Zone Office",
    tier: "zonal_ward",
    tierBadge: "Tier 2: Zonal Ward",
    office: "South Zonal Redressal Center, Green Park",
    areaLabel: "Green Park, Hauz Khas & South Zone",
    center: [28.5583, 77.2028],
    zoom: 14,
    radiusKm: 15.0,
    contactNumber: "011-26514003",
    zoneKeywords: ["south", "green park", "hauz khas", "saket"],
    governingBody: "South Zone Municipal Ward Directorate",
    icon: "🏢",
  },
  {
    id: "AUTH-RWA-CONNAUGHT",
    name: "Connaught Residents & Traders Welfare Group",
    shortName: "Connaught Society RWA",
    tier: "local_society",
    tierBadge: "Tier 3: Colony RWA",
    office: "Barakhamba Road Estate Coordination Cell",
    areaLabel: "Connaught Place Society Blocks",
    center: [28.6290, 77.2210],
    zoom: 16,
    radiusKm: 1.0,
    contactNumber: "+91-9871144332",
    zoneKeywords: ["connaught", "barakhamba", "outer circle lane"],
    governingBody: "Resident Welfare Association (RWA)",
    icon: "🏡",
  },
  {
    id: "AUTH-RWA-PREET",
    name: "Preet Vihar Resident Welfare Association (RWA Cell)",
    shortName: "Preet Vihar RWA",
    tier: "local_society",
    tierBadge: "Tier 3: Colony RWA",
    office: "Community Estate Management Office, C-Block Preet Vihar",
    areaLabel: "Preet Vihar Colony Enclave",
    center: [28.6370, 77.2950],
    zoom: 16,
    radiusKm: 1.5,
    contactNumber: "+91-9811023450",
    zoneKeywords: ["preet vihar", "vikas marg block b"],
    governingBody: "Resident Welfare Association (RWA)",
    icon: "🏡",
  },
  {
    id: "AUTH-RWA-MAYUR",
    name: "Mayur Vihar Pocket-1 Resident Welfare Society",
    shortName: "Mayur Vihar RWA",
    tier: "local_society",
    tierBadge: "Tier 3: Housing Society",
    office: "Pocket 1 Society Estate Secretariat, Mayur Vihar",
    areaLabel: "Mayur Vihar Pocket 1 Enclave",
    center: [28.6080, 77.2980],
    zoom: 16,
    radiusKm: 1.2,
    contactNumber: "+91-9811098760",
    zoneKeywords: ["mayur vihar", "pocket 1"],
    governingBody: "Housing Society Management Committee",
    icon: "🏡",
  },
];

export function resolveNearestJurisdiction(lat: number, lng: number): {
  desk: LocalOfficeJurisdiction;
  distanceKm: number;
} {
  let nearest = LOCAL_JURISDICTION_OFFICES.find((o) => o.tier !== "apex_central") || LOCAL_JURISDICTION_OFFICES[0];
  let minDist = Infinity;
  for (const off of LOCAL_JURISDICTION_OFFICES) {
    if (off.tier === "apex_central") continue;
    const dLat = ((off.center[0] - lat) * Math.PI) / 180;
    const dLng = ((off.center[1] - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((off.center[0] * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < minDist) {
      minDist = dist;
      nearest = off;
    }
  }
  return {
    desk: nearest,
    distanceKm: Math.round(minDist * 10) / 10,
  };
}

