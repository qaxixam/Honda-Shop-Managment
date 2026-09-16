import React from "react";
import KpiCard from "../components/KpiCard";

/**
 * MetricCard is an alias of KpiCard.
 * Kept as a separate file so existing imports keep working.
 */
export default function MetricCard(props) {
  return <KpiCard {...props} />;
}
