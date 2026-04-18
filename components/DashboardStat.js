import { formatNumber } from "../lib/format";

export default function DashboardStat({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-card-label">{label}</span>
      <strong className="stat-card-value">{formatNumber(value)}</strong>
    </div>
  );
}
