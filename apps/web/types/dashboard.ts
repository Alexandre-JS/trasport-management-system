export type DashboardMetric = {
  label: string;
  value: string;
  tone: "blue" | "green" | "amber" | "slate";
  href?: string;
};

export type RecentOperation = {
  id: string;
  cargoCode: string;
  client: string;
  route: string;
  status: string;
  updatedAt: string;
};
