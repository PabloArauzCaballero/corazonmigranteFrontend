import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";

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
  const query = qs.toString();
  return apiRequest(query ? `${ENDPOINTS.notifications.list}?${query}` : ENDPOINTS.notifications.list, { auth: true });
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiRequest(ENDPOINTS.notifications.unreadCount, { auth: true });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(ENDPOINTS.notifications.markRead.replace(":notificationId", encodeURIComponent(id)), {
    method: "PATCH",
    auth: true
  });
}

export async function markAllRead(): Promise<void> {
  await apiRequest(ENDPOINTS.notifications.markAllRead, { method: "PATCH", auth: true });
}
