import Incident from "../models/incident.model";
import Report from "../models/report.model";
import Broadcast from "../models/broadcast.model";

export const seedDemoIncidents = async (force = false) => {
  try {
    const count = await Incident.countDocuments();
    if (count > 0 && !force) {
      // Ensure broadcast is seeded even if incidents already exist
      const broadcastCount = await Broadcast.countDocuments();
      if (broadcastCount === 0) {
        await seedBroadcasts();
      }
      return; // Already seeded
    }

    if (force) {
      await Incident.deleteMany({});
      await Report.deleteMany({});
      await Broadcast.deleteMany({});
    }

    console.log("🌱 Seeding initial demo neighbourhood incidents...");

    // Sample coordinates in central residential zone (28.6304, 77.2177)
    const demoItems = [
      {
        title: "Major Society Power Cut - Block B & C Transformer Tripped",
        category: "power_cut" as const,
        description: "Complete power outage in Blocks B, C and basement elevator lines after transformer spark. Back-up generator running on low fuel.",
        severity: "critical" as const,
        status: "action_pending" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.2175, 28.6305] as [number, number],
        },
        address: "Greenwood Residency, Substation 4, Block B",
        media: [],
        reportCount: 3,
        upvotes: 8,
        confirmations: 8,
        reportsData: [
          {
            reporterName: "Rajesh Sharma (Flat B-402)",
            title: "Power gone since 30 mins",
            description: "No electricity in entire Block B. Elevators stuck.",
            address: "Block B elevator lobby",
          },
          {
            reporterName: "Pooja Verma (Flat C-104)",
            title: "Transformer spark sound",
            description: "Saw heavy sparks at the main pole behind Block C.",
            address: "Near Block C transformer",
          },
        ],
      },
      {
        title: "Main Overhead Water Tank Pipeline Leakage",
        category: "water_issue" as const,
        description: "High pressure potable water leaking continuously from main distribution joint, flooding walkway and reducing water pressure.",
        severity: "medium" as const,
        status: "confirmed" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.221, 28.629] as [number, number],
        },
        address: "Lane 3, near Society Pump House",
        media: ["https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=600&auto=format&fit=crop&q=60"],
        reportCount: 2,
        upvotes: 6,
        confirmations: 6,
        reportsData: [
          {
            reporterName: "Sunil Gupta",
            title: "Clean water wastage",
            description: "Fresh water pipe leaking since morning.",
            address: "Near pump house",
          },
        ],
      },
      {
        title: "Attempted Two-Wheeler Theft in Basement Parking",
        category: "theft_security" as const,
        description: "Motorbike handlebar lock broken and ignition wires cut near Pillar P-14. Security guards alerted. Residents requested to check vehicles.",
        severity: "high" as const,
        status: "under_review" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.219, 28.632] as [number, number],
        },
        address: "Basement Parking B2, Pillar P-14",
        media: [],
        reportCount: 1,
        upvotes: 4,
        confirmations: 4,
        reportsData: [
          {
            reporterName: "Amitabh Sen (Flat A-201)",
            title: "Bike lock tampered",
            description: "Found my bike shifted and ignition cut. Reported to guard desk.",
            address: "Basement B2",
          },
        ],
      },
      {
        title: "Pack of Aggressive Stray Dogs Near Children's Park",
        category: "stray_animals" as const,
        description: "Group of 5-6 stray dogs chasing bicycles and barking aggressively at children near the community playground gate.",
        severity: "medium" as const,
        status: "reported" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.215, 28.633] as [number, number],
        },
        address: "Community Children Park, East Gate",
        media: [],
        reportCount: 2,
        upvotes: 5,
        confirmations: 5,
        reportsData: [
          {
            reporterName: "Meenakshi Iyer",
            title: "Aggressive dogs near park",
            description: "Kids were frightened while coming back from school.",
            address: "East gate playground",
          },
        ],
      },
      {
        title: "Deep Pothole & Broken Paver Ramp at Main Gate",
        category: "road_hazard" as const,
        description: "Sharp pothole and displaced paver blocks right at vehicle entry boom barrier causing scraping of low-clearance cars.",
        severity: "medium" as const,
        status: "confirmed" as const,
        location: {
          type: "Point" as const,
          coordinates: [77.218, 28.635] as [number, number],
        },
        address: "Society Main Entry Gate 1",
        media: ["https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60"],
        reportCount: 3,
        upvotes: 11,
        confirmations: 11,
        reportsData: [
          {
            reporterName: "Kunal Mehra",
            title: "Car bumper scraped",
            description: "Deep pothole right at gate entry. Please fill temporarily.",
            address: "Main gate 1",
          },
        ],
      },
    ];

    for (const item of demoItems) {
      const { reportsData, ...incidentData } = item;

      const incident = new Incident({
        ...incidentData,
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
        title: "⚡ Urgent: Substation Power Line Maintenance Notice",
        message: "State Electricity Board emergency maintenance underway at Sector Feeder #4. Standby DG sets operational for lifts and water pumps until 6:00 PM.",
        severity: "warning" as const,
        category: "power_grid",
        ward: "all",
        issuedBy: {
          name: "RWA Maintenance Desk",
          role: "Society Infrastructure Team",
        },
        isActive: true,
      },
      {
        title: "💧 Potable Water Line Scheduled Flush Advisory",
        message: "Society overhead tank cleaning scheduled tomorrow morning 9:00 AM - 1:00 PM. Please store sufficient drinking water in advance.",
        severity: "info" as const,
        category: "water_supply",
        ward: "Central Greenwood Society",
        issuedBy: {
          name: "Municipal Water Board & RWA",
          role: "Civil Administration",
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
