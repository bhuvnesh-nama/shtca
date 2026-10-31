import Incident from "../models/incident.model";
import Report from "../models/report.model";
import Broadcast from "../models/broadcast.model";
import { resolveNearestAuthority } from "./authorityRouting";
import User from "../models/user.model";

export const seedAdminUser = async () => {
  try {
    const officers = [
      {
        name: "Central Authority Head",
        email: "admin@authority.gov.in",
        password: "AdminPassword123!",
        role: "admin",
        ward: "AUTH-APEX-01",
        phone: "011-23225000",
      },
      {
        name: "Er. Rajiv Sharma (East Zone Division)",
        email: "east.officer@authority.gov.in",
        password: "AdminPassword123!",
        role: "officer",
        ward: "AUTH-ZONE-EAST",
        phone: "011-22143001",
      },
      {
        name: "Er. Neha Kapoor (Central Zone Office)",
        email: "central.officer@authority.gov.in",
        password: "AdminPassword123!",
        role: "officer",
        ward: "AUTH-ZONE-CENTRAL",
        phone: "011-23348002",
      },
      {
        name: "Col. V.K. Mehra (Connaught Society RWA)",
        email: "rwa.admin@society.org",
        password: "AdminPassword123!",
        role: "officer",
        ward: "AUTH-RWA-CONNAUGHT",
        phone: "+91-9871144332",
      },
      // Jaipur Municipal Authority Accounts
      {
        name: "Er. Amit Shekhawat (Jaipur Greater - Malviya Nagar Zone)",
        email: "jaipur.admin@authority.gov.in",
        password: "AdminPassword123!",
        role: "officer",
        ward: "AUTH-ZONE-JAIPUR-MALVIYA",
        phone: "0141-2720101",
      },
      {
        name: "Er. Priyanka Rathore (Jaipur Heritage - Central Zone)",
        email: "jaipur.heritage@authority.gov.in",
        password: "AdminPassword123!",
        role: "officer",
        ward: "AUTH-ZONE-JAIPUR-HERITAGE",
        phone: "0141-2601202",
      },
      {
        name: "Dr. Mahendra Meena (Jawahar Circle RWA Admin)",
        email: "jaipur.rwa@society.org",
        password: "AdminPassword123!",
        role: "officer",
        ward: "AUTH-RWA-JAIPUR-JLP",
        phone: "+91-9414012345",
      },
    ];

    for (const off of officers) {
      const existing = await User.findOne({ email: off.email });
      if (!existing) {
        const u = new User({
          ...off,
          isEmailVerified: true,
        });
        await u.save();
        console.log(`👑 Seeded Authority account: ${off.email} (${off.ward})`);
      }
    }
  } catch (err) {
    console.warn("Could not seed authority officers:", err);
  }
};

export const seedJaipurIncidents = async () => {
  const jaipurItems = [
    {
      complaintRef: "JPR-2026-01102",
      title: "Deep Crater Potholes & Damaged Asphalt on Calgiri Marg Near Apex Hospital",
      category: "road_hazard" as const,
      department: "Jaipur Development Authority (JDA) & PWD Division",
      ward: "Jaipur Greater - Malviya Nagar Zone",
      pincode: "302017",
      landmark: "Opposite Apex Hospital & Calgiri Eye Hospital, Sector 4",
      description: "Severe deep potholes and exposed aggregate left following water pipeline laying work on Calgiri Marg. Two-wheelers frequently skidding, urgent resurfacing needed.",
      severity: "high" as const,
      status: "action_pending" as const,
      location: {
        type: "Point" as const,
        coordinates: [75.8150, 26.8550] as [number, number],
      },
      address: "Calgiri Marg, Sector 4, Malviya Nagar, Jaipur, Rajasthan",
      media: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60"],
      reportCount: 3,
      upvotes: 9,
      confirmations: 9,
      inspectedBy: {
        name: "Er. Amit Shekhawat",
        role: "Assistant Engineer (AEN) - PWD Malviya Nagar",
        inspectedAt: new Date(),
        notes: "Inspected site. Cold mix patch team scheduled for dispatch.",
      },
      reportsData: [
        {
          reporterName: "Vikram Singh Rathore",
          title: "Road hazard near hospital gate",
          description: "Big potholes making ambulance transit dangerous.",
          address: "Calgiri Marg, Opp Apex Hospital",
        },
        {
          reporterName: "Meenakshi Khandelwal",
          title: "Two-wheeler skidding risk",
          description: "Loose gravel everywhere after digging.",
          address: "Sector 4 Junction, Malviya Nagar",
        },
      ],
    },
    {
      complaintRef: "JPR-2026-03481",
      title: "Main Potable Water Trunk Pipeline Rupture Flooding Service Lane",
      category: "water_issue" as const,
      department: "PHED Rajasthan (Public Health Engineering Department)",
      ward: "Jaipur Greater - Malviya Nagar Zone",
      pincode: "302017",
      landmark: "JLN Marg, Near World Trade Park & Gaurav Tower",
      description: "Underground main drinking water supply trunk ruptured with high pressure water gushing onto JLN service lane. Water pressure completely dropped in Malviya Nagar Sector 1-5.",
      severity: "high" as const,
      status: "action_pending" as const,
      location: {
        type: "Point" as const,
        coordinates: [75.8055, 26.8535] as [number, number],
      },
      address: "JLN Marg, Opp World Trade Park, Malviya Nagar, Jaipur",
      media: ["https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=600&auto=format&fit=crop&q=60"],
      reportCount: 4,
      upvotes: 14,
      confirmations: 14,
      reportsData: [
        {
          reporterName: "Siddharth Jain",
          title: "Enormous clean water wastage",
          description: "Fresh water flooding sidewalk since early morning.",
          address: "JLN Marg Service Road",
        },
      ],
    },
    {
      complaintRef: "JPR-2026-05920",
      title: "Overflowing Garbage Dumpster & Stray Cattle Blocking Sector Entry",
      category: "sanitation" as const,
      department: "Jaipur Greater Nagar Nigam - Swachhata Division",
      ward: "Jawahar Circle & Malviya Enclave RWA",
      pincode: "302018",
      landmark: "Gate 2, Jawahar Circle Garden, Near Patrika Gate",
      description: "Municipal waste compactor bin overflowing with rotting refuse onto the pedestrian walkway. Stray cattle scavenging and blocking entryway.",
      severity: "medium" as const,
      status: "reported" as const,
      location: {
        type: "Point" as const,
        coordinates: [75.8010, 26.8480] as [number, number],
      },
      address: "Jawahar Circle Garden Road, Malviya Nagar, Jaipur",
      media: [],
      reportCount: 2,
      upvotes: 6,
      confirmations: 6,
      reportsData: [
        {
          reporterName: "Sunita Sharma",
          title: "Foul smell and blocked footpath",
          description: "Garbage hasn't been collected for 2 days.",
          address: "Gate 2 Jawahar Circle",
        },
      ],
    },
    {
      complaintRef: "JPR-2026-07731",
      title: "Overhead Distribution Line Snapped & Transformer Sparking",
      category: "power_cut" as const,
      department: "JVVNL (Jaipur Vidyut Vitran Nigam Ltd)",
      ward: "Jaipur Greater - Malviya Nagar Zone",
      pincode: "302017",
      landmark: "Near Jagatpura Railway Overbridge, Model Town Crossing",
      description: "High-voltage distribution wire snapped after tree branch fall, sparking heavily on road divider. Power completely cut off in Model Town and Jagatpura sector.",
      severity: "critical" as const,
      status: "action_pending" as const,
      location: {
        type: "Point" as const,
        coordinates: [75.8320, 26.8420] as [number, number],
      },
      address: "Jagatpura Flyover Approach, Model Town, Jaipur",
      media: [],
      reportCount: 5,
      upvotes: 18,
      confirmations: 18,
      reportsData: [
        {
          reporterName: "Anil Choudhary",
          title: "Live wire hanging over road",
          description: "Sparks flying near transformer pole. Traffic halted.",
          address: "Jagatpura Railway Crossing",
        },
      ],
    },
    {
      complaintRef: "JPR-2026-09144",
      title: "Choked Heritage Storm Sewer Causing Market Backflow",
      category: "water_issue" as const,
      department: "Jaipur Heritage Municipal Corporation",
      ward: "Jaipur Heritage - Central Zone",
      pincode: "302001",
      landmark: "MI Road, Near Panch Batti & Raj Mandir",
      description: "Old masonry sewer trunk clogged with silt and commercial waste, dirty backflow onto market walkway causing pedestrian disruption.",
      severity: "medium" as const,
      status: "confirmed" as const,
      location: {
        type: "Point" as const,
        coordinates: [75.8010, 26.9215] as [number, number],
      },
      address: "MI Road, Panch Batti, Jaipur Heritage Zone",
      media: [],
      reportCount: 3,
      upvotes: 7,
      confirmations: 7,
      reportsData: [
        {
          reporterName: "Gopal Pareek",
          title: "Drain overflow on MI road",
          description: "Sewage water leaking outside shops.",
          address: "Panch Batti, MI Road",
        },
      ],
    },
  ];

  for (const item of jaipurItems) {
    const existing = await Incident.findOne({ complaintRef: item.complaintRef });
    if (existing) continue;

    const { reportsData, ...incidentData } = item;
    const assignedAuth = resolveNearestAuthority(
      incidentData.location.coordinates[1],
      incidentData.location.coordinates[0],
      incidentData.category,
      incidentData.severity,
      incidentData.title,
      incidentData.description
    );

    const incident = new Incident({
      ...incidentData,
      assignedAuthority: assignedAuth,
      comments: [
        {
          author: reportsData[0]?.reporterName || "Resident Complainant",
          role: "Citizen",
          message: "Grievance registered. Nearby residents requested verification.",
          createdAt: new Date(Date.now() - 3600000 * 3),
        },
        {
          author: assignedAuth.name,
          role: assignedAuth.tier === "apex_central" ? "Apex Directorate" : (assignedAuth.tier === "local_society" ? "Society Admin" : "Zonal Ward Officer"),
          message: `Dispatched to ${assignedAuth.office} (${assignedAuth.distanceKm} km away). ${assignedAuth.routingReason}`,
          createdAt: new Date(Date.now() - 3600000 * 1),
        },
      ],
      reports: [],
    });
    await incident.save();

    const reportIds = [];
    for (const rep of reportsData) {
      const report = new Report({
        incident: incident._id,
        category: incident.category,
        title: rep.title,
        description: rep.description,
        location: incident.location,
        address: rep.address,
        reporterName: rep.reporterName,
        status: "linked",
      });
      await report.save();
      reportIds.push(report._id);
    }
    incident.reports = reportIds as any;
    await incident.save();
  }
  console.log("✅ Seeded Jaipur hyperlocal incidents successfully.");
};

export const seedDemoIncidents = async (force = false) => {
  try {
    await seedAdminUser();
    const count = await Incident.countDocuments();
    if (count > 0 && !force) {
      // Ensure broadcast is seeded even if incidents already exist
      const broadcastCount = await Broadcast.countDocuments();
      if (broadcastCount === 0) {
        await seedBroadcasts();
      }

      // Ensure all Jaipur incidents exist for testing in Jaipur
      await seedJaipurIncidents();
      return; // Already seeded
    }

    if (force) {
      await Incident.deleteMany({});
      await Report.deleteMany({});
      await Broadcast.deleteMany({});
    }

    console.log("🌱 Seeding initial demo neighbourhood incidents...");

    // Sample coordinates in residential and civic zone (28.6304, 77.2177)
    const demoItems = [
      {
        complaintRef: "CIVIC-2026-08491",
        title: "Major Area Power Outage - Substation Transformer Tripping",
        category: "power_cut" as const,
        department: "Power Discom & Street Lighting Division",
        ward: "Zone 1 - East (Preet Vihar)",
        pincode: "110092",
        landmark: "Opposite Substation 4, Block B",
        description: "Complete power outage in residential colony blocks B and C after sudden transformer sparking. Street lights dark, urgent inspection needed.",
        severity: "critical" as const,
        status: "action_pending" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.2175, 28.6305] as [number, number],
        },
        address: "Main Vikas Marg, Near Substation 4, Block B",
        media: [],
        reportCount: 3,
        upvotes: 8,
        confirmations: 8,
        inspectedBy: {
          name: "Er. Arvind Sharma",
          role: "Junior Engineer (JE) - Power Distribution",
          inspectedAt: new Date(),
          notes: "On-site feeder tested. Emergency repair team dispatched.",
        },
        reportsData: [
          {
            reporterName: "Rajesh Sharma",
            title: "Power cut since 45 mins",
            description: "No electricity in entire residential block. Street lights also dark.",
            address: "Main Vikas Marg, Block B",
          },
          {
            reporterName: "Pooja Verma",
            title: "Transformer spark sound",
            description: "Saw heavy sparks and smoke from distribution transformer.",
            address: "Near Substation 4 pole",
          },
        ],
      },
      {
        complaintRef: "CIVIC-2026-02482",
        title: "Main Potable Water Distribution Pipeline Burst & Street Flooding",
        category: "water_issue" as const,
        department: "Water Supply & Works Board",
        ward: "Zone 2 - Central (Connaught Place)",
        pincode: "110001",
        landmark: "Near Booster Pump House, Outer Circle Lane 3",
        description: "High pressure drinking water leaking continuously from main distribution joint, flooding road walkway and drastically dropping household pressure.",
        severity: "medium" as const,
        status: "confirmed" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.221, 28.629] as [number, number],
        },
        address: "Lane 3, near Booster Pump House",
        media: ["https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=600&auto=format&fit=crop&q=60"],
        reportCount: 2,
        upvotes: 6,
        confirmations: 6,
        reportsData: [
          {
            reporterName: "Sunil Gupta",
            title: "Clean water wastage",
            description: "Fresh water pipe leaking since morning, road completely inundated.",
            address: "Near booster pump house",
          },
        ],
      },
      {
        complaintRef: "RWA-2026-05183",
        title: "Society Gate Streetlight Wire Damage & Footpath Obstruction",
        category: "theft_security" as const,
        department: "Society Security & Vigilance Unit (RWA)",
        ward: "Zone 3 - East (Mayur Vihar)",
        pincode: "110091",
        landmark: "Pillar 14, Housing Society Entrance Road",
        description: "Streetlight cables damaged and unauthorized wooden barricades placed on pedestrian walkway near society gate. Security patrol requested.",
        severity: "high" as const,
        status: "under_review" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.219, 28.632] as [number, number],
        },
        address: "Society Approach Road, Near Pillar 14",
        media: [],
        reportCount: 1,
        upvotes: 4,
        confirmations: 4,
        reportsData: [
          {
            reporterName: "Amitabh Sen",
            title: "Obstruction on walkway",
            description: "Pedestrian walkway blocked and dark due to damaged light.",
            address: "Near Society Entrance",
          },
        ],
      },
      {
        complaintRef: "HBD-2026-07921",
        title: "Aggressive Stray Animals Blocking Housing Estate Road Access",
        category: "stray_animals" as const,
        department: "Animal Welfare & Estate Safety Unit (Housing Board)",
        ward: "Zone 4 - Central (Karol Bagh)",
        pincode: "110005",
        landmark: "Housing Board Complex East Gate",
        description: "Stray cattle and aggressive dogs congregating at the complex gate during morning hours, creating safety hazards for residents and school children.",
        severity: "medium" as const,
        status: "reported" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.215, 28.633] as [number, number],
        },
        address: "Housing Estate Main Road, East Gate",
        media: [],
        reportCount: 2,
        upvotes: 5,
        confirmations: 5,
        reportsData: [
          {
            reporterName: "Meenakshi Iyer",
            title: "Stray animals blocking road",
            description: "Children and pedestrians unable to pass safely.",
            address: "East gate crossing",
          },
        ],
      },
      {
        complaintRef: "CIVIC-2026-03114",
        title: "Deep Pothole & Sunken Manhole Chamber at Main Arterial Junction",
        category: "road_hazard" as const,
        department: "Road Infrastructure & Public Works (PWD)",
        ward: "Zone 5 - East (Anand Vihar)",
        pincode: "110092",
        landmark: "Main Road Junction, Gate 1",
        description: "Sunken manhole chamber with sharp road depression causing vehicle damage and serious accident risk for two-wheelers, especially at night.",
        severity: "medium" as const,
        status: "confirmed" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.218, 28.635] as [number, number],
        },
        address: "Main Arterial Road, Near Gate 1",
        media: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60"],
        reportCount: 3,
        upvotes: 11,
        confirmations: 11,
        reportsData: [
          {
            reporterName: "Kunal Mehra",
            title: "Accident hazard from sunken manhole",
            description: "Deep cavity in middle of traffic lane. Needs urgent asphalt repair.",
            address: "Gate 1 Junction",
          },
        ],
      },
    ];

    for (const item of demoItems) {
      const { reportsData, ...incidentData } = item;

      const assignedAuth = resolveNearestAuthority(
        incidentData.location.coordinates[1],
        incidentData.location.coordinates[0],
        incidentData.category,
        incidentData.severity,
        incidentData.title,
        incidentData.description
      );

      const incident = new Incident({
        ...incidentData,
        assignedAuthority: assignedAuth,
        comments: [
          {
            author: reportsData[0]?.reporterName || "Resident Complainant",
            role: "Citizen",
            message: "Grievance registered. Nearby residents requested verification.",
            createdAt: new Date(Date.now() - 3600000 * 4),
          },
          {
            author: assignedAuth.name,
            role: assignedAuth.tier === "apex_central" ? "Apex Directorate" : (assignedAuth.tier === "local_society" ? "Society Admin" : "Zonal Ward Officer"),
            message: `Dispatched to ${assignedAuth.office} (${assignedAuth.distanceKm} km away). ${assignedAuth.routingReason}`,
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
        ],
        reports: [],
      });
      await incident.save();

      const reportIds = [];
      for (const rep of reportsData) {
        const report = new Report({
          incident: incident._id,
          category: incident.category,
          title: rep.title,
          description: rep.description,
          location: incident.location,
          address: rep.address,
          reporterName: rep.reporterName,
          status: "linked",
        });
        await report.save();
        reportIds.push(report._id);
      }

      incident.reports = reportIds as any;
      await incident.save();
    }

    await seedBroadcasts();
    console.log("✅ Seeded problem-statement aligned incidents and broadcasts successfully.");
  } catch (error) {
    console.error("Error seeding incidents:", error);
  }
};

export const seedBroadcasts = async () => {
  try {
    const demoBroadcasts = [
      {
        title: "⚡ Power Distribution Feeder 4 Maintenance Advisory",
        message: "State Electricity Distribution division has initiated urgent maintenance work on Feeder 4. Citizens are advised to plan accordingly.",
        severity: "warning" as const,
        category: "power_grid",
        ward: "all",
        issuedBy: {
          name: "Er. S.K. Sharma",
          role: "Executive Engineer (Power Discom)",
        },
        isActive: true,
      },
      {
        title: "💧 Main Pipeline & Overhead Reservoir Cleaning Schedule",
        message: "Regional potable water pipeline and reservoir sanitization scheduled tomorrow from 9:00 AM to 1:00 PM. Please store sufficient water.",
        severity: "info" as const,
        category: "water_supply",
        ward: "Zone 2 - Central (Connaught Place)",
        issuedBy: {
          name: "Er. Manoj Verma",
          role: "Superintending Engineer (Water Works Board)",
        },
        isActive: true,
      },
    ];

    for (const b of demoBroadcasts) {
      await Broadcast.create(b);
    }
    console.log("📢 Seeded emergency broadcasts successfully.");
  } catch (err) {
    console.error("Error seeding broadcasts:", err);
  }
};
