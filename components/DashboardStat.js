import { formatNumber } from "../lib/format";

export default function DashboardStat({ label, value }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </div>
  );
}
