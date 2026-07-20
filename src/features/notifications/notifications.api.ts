import { apiRequest } from "@/shared/api/client";

export type AdminNotification = {
  id: string;
  type: string;
  entityType?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  recipientRole: string;
  createdAt: string;
};

export type NotificationsListResponse = {
  items: AdminNotification[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export async function listNotifications(params?: { page?: number; unreadOnly?: boolean }): Promise<NotificationsListResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.unreadOnly) qs.set("unreadOnly", "true");
  return apiRequest(`/api/v1/admin/notifications?${qs}`, { auth: true });
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiRequest("/api/v1/admin/notifications/unread-count", { auth: true });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(`/api/v1/admin/notifications/${id}/read`, { method: "PATCH", auth: true });
}

export async function markAllRead(): Promise<void> {
  await apiRequest("/api/v1/admin/notifications/read-all", { method: "PATCH", auth: true });
}
