import type { FuelRecord, Vehicle } from '@/lib/supabase';

export const FUEL_SEGMENTS = 7;

export function getAvgFuelEfficiency(records: FuelRecord[]): number | null {
  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : a.fill_date > b.fill_date ? 1 : 0,
  );
  let totalDistance = 0;
  let totalLiters = 0;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.full_tank && curr.full_tank) {
      const dist = curr.mileage_km - prev.mileage_km;
      if (dist > 0) {
        totalDistance += dist;
        totalLiters += Number(curr.liters);
      }
    }
  }
  return totalDistance > 0 && totalLiters > 0
    ? totalDistance / totalLiters
    : null;
}

export function estimateLitersBeforeFill(
  bars: number,
  tankCapacity: number,
): number {
  return Math.round((bars / FUEL_SEGMENTS) * tankCapacity * 1000) / 1000;
}

export function estimateRangeKm(
  bars: number,
  tankCapacity: number,
  avgEfficiency: number | null,
): number | null {
  if (avgEfficiency === null || avgEfficiency <= 0) return null;
  const liters = estimateLitersBeforeFill(bars, tankCapacity);
  return Math.round(liters * avgEfficiency);
}

export function isLowFuel(
  record: FuelRecord,
  lowFuelThresholdKm: number,
): boolean {
  if (record.dashboard_range_km !== null) {
    return record.dashboard_range_km <= lowFuelThresholdKm;
  }
  if (record.fuel_bar_before !== null) {
    return record.fuel_bar_before <= 1;
  }
  if (record.est_remaining_range_km !== null) {
    return record.est_remaining_range_km <= lowFuelThresholdKm;
  }
  return false;
}

export function getEffectiveRange(record: FuelRecord): {
  range: number | null;
  isEstimated: boolean;
} {
  if (record.dashboard_range_km !== null) {
    return { range: record.dashboard_range_km, isEstimated: false };
  }
  if (record.est_remaining_range_km !== null) {
    return { range: record.est_remaining_range_km, isEstimated: true };
  }
  return { range: null, isEstimated: false };
}

export function estimateLitersAfterFill(
  litersBefore: number,
  litersFilled: number,
  tankCapacity: number,
): number {
  return Math.min(litersBefore + litersFilled, tankCapacity);
}

export interface RefuelPattern {
  avgRangeBeforeFill: number | null;
  lowFuelFillCount: number;
  totalFills: number;
  lowFuelPercentage: number;
  showAdvice: boolean;
}

export function computeRefuelPattern(
  records: FuelRecord[],
  lowFuelThresholdKm: number,
): RefuelPattern {
  const withData = records.filter(
    (r) =>
      r.dashboard_range_km !== null ||
      r.est_remaining_range_km !== null ||
      r.fuel_bar_before !== null,
  );
  if (withData.length === 0) {
    return {
      avgRangeBeforeFill: null,
      lowFuelFillCount: 0,
      totalFills: 0,
      lowFuelPercentage: 0,
      showAdvice: false,
    };
  }
  const ranges = withData.map((r) => {
    const { range } = getEffectiveRange(r);
    return range;
  });
  const validRanges = ranges.filter((r): r is number => r !== null);
  const avgRange =
    validRanges.length > 0
      ? Math.round(validRanges.reduce((s, r) => s + r, 0) / validRanges.length)
      : null;
  const lowFuelCount = withData.filter((r) =>
    isLowFuel(r, lowFuelThresholdKm),
  ).length;
  const percentage = Math.round((lowFuelCount / withData.length) * 100);
  return {
    avgRangeBeforeFill: avgRange,
    lowFuelFillCount: lowFuelCount,
    totalFills: withData.length,
    lowFuelPercentage: percentage,
    showAdvice: percentage > 30,
  };
}

export function getDefaultTankCapacity(vehicle: Vehicle | null): number {
  return vehicle ? Number(vehicle.tank_capacity_l) : 40;
}

export function getDefaultLowFuelWarning(vehicle: Vehicle | null): number {
  return vehicle ? Number(vehicle.low_fuel_warning_km) : 80;
}
