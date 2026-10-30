import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

export interface Translations {
  appName: string;
  brandSubtitle: string;
  reportHazard: string;
  allPilotWards: string;
  liveSync: string;
  connecting: string;
  safetyFeed: string;
  liveMap: string;
  rwaDashboard: string;
  healthScoreTitle: string;
  upvoteButton: string;
  verifiedField: string;
  reopenButton: string;
  emergencySos: string;
  officialBroadcast: string;
  demoLab: string;
  inspect: string;
  activeHazards: string;
  resolved: string;
  confirmed: string;
  reported: string;
  reopened: string;
  categories: {
    power_cut: string;
    water_issue: string;
    theft_security: string;
    stray_animals: string;
    road_hazard: string;
    sanitation: string;
    other: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    appName: "HyperNet",
    brandSubtitle: "Neighbourhood Safety & Hazards Network",
    reportHazard: "Report Hazard",
    allPilotWards: "All Pilot Wards",
    liveSync: "Live Sync",
    connecting: "Connecting",
    safetyFeed: "Safety Feed",
    liveMap: "Live Map",
    rwaDashboard: "RWA Operations",
    healthScoreTitle: "Neighbourhood Safety & Health Score",
    upvoteButton: "Confirm / Upvote",
    verifiedField: "Field Verified",
    reopenButton: "Problem Returned? Re-Open",
    emergencySos: "Emergency SOS",
    officialBroadcast: "Official Emergency Broadcast",
    demoLab: "Demo Lab",
    inspect: "Inspect",
    activeHazards: "Active Hazards",
    resolved: "Resolved & Verified",
    confirmed: "Community Confirmed",
    reported: "Resident Reported",
    reopened: "Hazard Reopened",
    categories: {
      power_cut: "Power Cut & Electrical",
      water_issue: "Water Supply & Leakage",
      theft_security: "Theft & Security",
      stray_animals: "Stray Animals Hazard",
      road_hazard: "Road Hazards & Potholes",
      sanitation: "Sanitation & Waste",
      other: "Other Local Issue",
    },
  },
  hi: {
    appName: "हाइपरनेट",
    brandSubtitle: "स्थानीय समुदाय सुरक्षा एवं समस्या समाधान नेटवर्क",
    reportHazard: "समस्या दर्ज करें",
    allPilotWards: "सभी पायलट सोसायटियां",
    liveSync: "लाइव सिंक",
    connecting: "कनेक्ट हो रहा है",
    safetyFeed: "सुरक्षा फ़ीड",
    liveMap: "लाइव मैप",
    rwaDashboard: "आरडब्ल्यूए संचालन",
    healthScoreTitle: "सोसायटी सुरक्षा एवं स्वास्थ्य स्कोर",
    upvoteButton: "पुष्टि करें / अपवोट",
    verifiedField: "मौका मुआयना सत्यापित",
    reopenButton: "समस्या फिर आई? पुनः खोलें",
    emergencySos: "आपातकालीन एसओएस",
    officialBroadcast: "आधिकारिक आपातकालीन घोषणा",
    demoLab: "डेमो लैब",
    inspect: "सत्यापन",
    activeHazards: "सक्रिय समस्याएं",
    resolved: "समाधान सत्यापित",
    confirmed: "समुदाय द्वारा पुष्टित",
    reported: "दर्ज की गई समस्या",
    reopened: "पुनः खोली गई",
    categories: {
      power_cut: "बिजली कटौती एवं विद्युत",
      water_issue: "जल आपूर्ति एवं लीकेज",
      theft_security: "चोरी एवं सुरक्षा अलर्ट",
      stray_animals: "आवारा पशु खतरा",
      road_hazard: "सड़क गड्ढे व अवरोध",
      sanitation: "कचरा एवं स्वच्छता",
      other: "अन्य स्थानीय समस्या",
    },
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  getCategoryName: (catId: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("hypernet_lang") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("hypernet_lang", lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "hi" : "en");
  };

  const t = translations[language];

  const getCategoryName = (catId: string) => {
    const key = catId as keyof Translations["categories"];
    return t.categories[key] || t.categories.other;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, getCategoryName }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
