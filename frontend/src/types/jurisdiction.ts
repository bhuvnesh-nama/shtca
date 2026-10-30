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

