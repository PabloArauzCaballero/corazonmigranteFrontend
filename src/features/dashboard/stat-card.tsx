import { Card, CardContent } from "@/shared/ui/card";

export function StatCard({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-black">{value}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
