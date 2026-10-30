import { api } from "@/lib/apiClient";
import type {
  IncidentItem,
  CategoryInfo,
  HealthScoreData,
  AnalyticsData,
  BroadcastItem,
  PerformanceMetrics,
} from "@/types/incident";

export interface GetIncidentsParams {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  status?: string;
  search?: string;
  limit?: number;
}

export interface SubmitReportPayload {
  category: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  media?: string[];
  forceNew?: boolean;
}

export const incidentService = {
  async getNearbyIncidents(params: GetIncidentsParams = {}): Promise<IncidentItem[]> {
    const response = await api.get("/incidents", { params });
    return response.data?.data?.incidents || [];
  },

  async getIncidentById(id: string): Promise<IncidentItem> {
    const response = await api.get(`/incidents/${id}`);
    return response.data?.data;
  },

  async getCategories(): Promise<CategoryInfo[]> {
    const response = await api.get("/incidents/categories");
    return response.data?.data || [];
  },

  async checkDuplicate(category: string, lat: number, lng: number, radius = 250) {
    const response = await api.get("/reports/check-duplicate", {
      params: { category, lat, lng, radius },
    });
    return response.data?.data;
  },

  async submitReport(payload: SubmitReportPayload) {
    const response = await api.post("/reports", payload);
    return response.data?.data;
  },

  async uploadEvidence(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data?.url;
  },

  async upvoteIncident(id: string) {
    const response = await api.post(`/incidents/${id}/upvote`);
    return response.data;
  },

  async updateIncidentStatus(
    id: string,
    status: string,
    resolutionNote?: string,
    resolutionMedia?: string[],
    complaintRef?: string
  ) {
    const response = await api.patch(`/incidents/${id}/status`, {
      status,
      resolutionNote,
      resolutionMedia,
      complaintRef,
    });
    return response.data;
  },

  async resolveIncident(
    id: string,
    resolutionNote: string,
    media: string[] = [],
    complaintRef?: string
  ) {
    const response = await api.post(`/incidents/${id}/resolve`, {
      resolutionNote,
      resolutionMedia: media,
      complaintRef,
    });
    return response.data;
  },

  async mergeIncidents(sourceIncidentId: string, targetIncidentId: string, reason?: string) {
    const response = await api.post("/incidents/merge", {
      sourceIncidentId,
      targetIncidentId,
      reason,
    });
    return response.data;
  },

  async flagIncident(id: string, reason: string) {
    const response = await api.post(`/incidents/${id}/flag`, { reason });
    return response.data;
  },

  async dismissFlags(id: string) {
    const response = await api.post(`/incidents/${id}/dismiss-flags`);
    return response.data;
  },

  async reopenIncident(id: string, reason: string, media: string[] = []) {
    const response = await api.post(`/incidents/${id}/reopen`, {
      reason,
      media,
    });
    return response.data;
  },

  async fieldVerifyIncident(
    id: string,
    inspectorName: string,
    role?: string,
    notes?: string
  ) {
    const response = await api.post(`/incidents/${id}/field-verify`, {
      inspectorName,
      role,
      notes,
    });
    return response.data;
  },

  async getHealthScore(): Promise<HealthScoreData> {
    const response = await api.get("/incidents/health-score");
    return response.data?.data;
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const response = await api.get("/incidents/analytics");
    return response.data?.data;
  },

  async simulateScenario(scenario: string, incidentId?: string) {
    const response = await api.post("/incidents/simulate", { scenario, incidentId });
    return response.data;
  },

  async getBroadcasts(ward?: string): Promise<BroadcastItem[]> {
    const params = ward && ward !== "all" ? { ward } : {};
    const response = await api.get("/incidents/broadcasts", { params });
    return response.data?.data || [];
  },

  async createBroadcast(payload: {
    title: string;
    message: string;
    severity?: "critical" | "warning" | "info";
    category?: string;
    ward?: string;
  }) {
    const response = await api.post("/incidents/broadcasts", payload);
    return response.data;
  },

  async dismissBroadcast(id: string) {
    const response = await api.delete(`/incidents/broadcasts/${id}`);
    return response.data;
  },

  async triggerSos(payload: {
    latitude: number;
    longitude: number;
    address?: string;
    details?: string;
  }) {
    const response = await api.post("/incidents/sos", payload);
    return response.data;
  },

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await api.get("/incidents/performance");
    return response.data?.data;
  },
};
