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
    appName: "NagarSeva",
    brandSubtitle: "Municipal Corporation Civic Grievance & Redressal Portal",
    reportHazard: "Register Grievance",
    allPilotWards: "All Municipal Wards",
    liveSync: "Live Civic Sync",
    connecting: "Connecting...",
    safetyFeed: "Grievance Feed",
    liveMap: "Ward Map",
    rwaDashboard: "Municipal Officer Portal",
    healthScoreTitle: "Ward Civic Health & Redressal Index",
    upvoteButton: "Confirm / Support",
    verifiedField: "Inspected On-Ground",
    reopenButton: "Issue Not Fixed? Re-Open",
    emergencySos: "Emergency Civic Alert",
    officialBroadcast: "Official Municipal Broadcast",
    demoLab: "Simulator",
    inspect: "Inspect",
    activeHazards: "Pending Grievances",
    resolved: "Resolved & Inspected",
    confirmed: "Community Confirmed",
    reported: "Registered Grievance",
    reopened: "Re-Opened Grievance",
    categories: {
      power_cut: "Power Discom & Street Lighting",
      water_issue: "Water Supply & Sewerage Board",
      theft_security: "Encroachment & Public Safety",
      stray_animals: "Stray Animal & Cattle Control",
      road_hazard: "PWD Roads & Infrastructure",
      sanitation: "Solid Waste & Public Sanitation",
      other: "General Civic Grievance",
    },
  },
  hi: {
    appName: "नगर सेवा",
    brandSubtitle: "नगर निगम नागरिक सेवा एवं शिकायत निवारण पोर्टल",
    reportHazard: "शिकायत दर्ज करें",
    allPilotWards: "सभी नगर निगम वार्ड",
    liveSync: "लाइव पोर्टल",
    connecting: "कनेक्ट हो रहा है",
    safetyFeed: "शिकायत फ़ीड",
    liveMap: "वार्ड मानचित्र",
    rwaDashboard: "नगर निगम अधिकारी कंसोल",
    healthScoreTitle: "वार्ड नागरिक स्वास्थ्य एवं निवारण सूचकांक",
    upvoteButton: "पुष्टि करें / समर्थन दें",
    verifiedField: "मौका मुआयना सत्यापित",
    reopenButton: "समाधान नहीं हुआ? पुनः खोलें",
    emergencySos: "आपातकालीन नागरिक अलर्ट",
    officialBroadcast: "आधिकारिक नगर निगम घोषणा",
    demoLab: "सिम्युलेटर",
    inspect: "सत्यापन",
    activeHazards: "लंबित शिकायतें",
    resolved: "समाधान सत्यापित",
    confirmed: "समुदाय द्वारा पुष्टित",
    reported: "दर्ज की गई शिकायत",
    reopened: "पुनः खोली गई शिकायत",
    categories: {
      power_cut: "विद्युत वितरण एवं स्ट्रीट लाइट",
      water_issue: "जल आपूर्ति एवं सीवरेज बोर्ड",
      theft_security: "अतिक्रमण, सतर्कता एवं सुरक्षा",
      stray_animals: "आवारा पशु नियंत्रण प्रकोष्ठ",
      road_hazard: "लोक निर्माण व सड़क ढांचा (PWD)",
      sanitation: "ठोस अपशिष्ट एवं स्वच्छता विभाग",
      other: "अन्य नागरिक शिकायत",
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
