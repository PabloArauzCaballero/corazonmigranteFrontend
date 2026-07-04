"use client";

import { useQueries } from "@tanstack/react-query";
import { listTransactions } from "@/features/accounting/accounting.api";
import { listServices } from "@/features/products/products.api";
import { listAppointmentRequests } from "@/features/therapy/therapy.api";
import { listUsers } from "@/features/users/users.api";
import { StatCard } from "@/features/dashboard/stat-card";

function statValue(data: { total: number } | undefined, isError: boolean) {
  if (isError) return "Error";
  if (!data) return "...";
  return String(data.total);
}

export function AdminOverview() {
  const [requests, users, services, transactions] = useQueries({
    queries: [
      { queryKey: ["dashboard", "requests"], queryFn: () => listAppointmentRequests({ page: 1, pageSize: 1 }) },
      { queryKey: ["dashboard", "users"], queryFn: () => listUsers({ page: 1, pageSize: 1 }) },
      { queryKey: ["dashboard", "services"], queryFn: () => listServices({ page: 1, pageSize: 1 }) },
      { queryKey: ["dashboard", "transactions"], queryFn: () => listTransactions({ page: 1, pageSize: 1 }) }
    ]
  });

  return (
    <div className="grid gap-5 md:grid-cols-4">
      <StatCard label="Solicitudes" value={statValue(requests.data, requests.isError)} description="Total leído desde el backend." />
      <StatCard label="Usuarios" value={statValue(users.data, users.isError)} description="Total leído desde el backend." />
      <StatCard label="Servicios" value={statValue(services.data, services.isError)} description="Total leído desde el backend." />
      <StatCard label="Transacciones" value={statValue(transactions.data, transactions.isError)} description="Total leído desde el backend." />
    </div>
  );
}
