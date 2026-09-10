import type { ServiceRecord, FuelRecord } from '@/lib/supabase';

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportServiceCSV(records: ServiceRecord[]) {
  const headers = ['Tarikh', 'Jenis Servis', 'Mileage (km)', 'Kos (RM)', 'Catatan'];
  const rows = records.map((r) => [
    r.service_date,
    r.service_type,
    r.mileage_km,
    r.cost_rm.toFixed(2),
    r.notes ?? '',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
  downloadFile(csv, `log-servis-saga-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportFuelCSV(records: FuelRecord[]) {
  const headers = [
    'Tarikh Isi',
    'Jenis Petrol',
    'Mileage (km)',
    'Liter',
    'Harga/Liter (RM)',
    'Jumlah Kos (RM)',
    'Stesen',
    'Full Tank',
    'Catatan',
  ];
  const rows = records.map((r) => [
    r.fill_date,
    r.fuel_type,
    r.mileage_km,
    r.liters.toFixed(3),
    r.price_per_liter_rm.toFixed(2),
    r.total_cost_rm.toFixed(2),
    r.station ?? '',
    r.full_tank ? 'Ya' : 'Tidak',
    r.notes ?? '',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
  downloadFile(csv, `log-petrol-saga-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportServicePDF(records: ServiceRecord[]) {
  const win = window.open('', '_blank');
  if (!win) return;
  const rows = records
    .map(
      (r) => `
      <tr>
        <td>${r.service_date}</td>
        <td>${r.service_type}</td>
        <td style="text-align:right">${r.mileage_km.toLocaleString('ms-MY')}</td>
        <td style="text-align:right">RM ${r.cost_rm.toFixed(2)}</td>
        <td>${r.notes ?? '—'}</td>
      </tr>`,
    )
    .join('');
  const total = records.reduce((s, r) => s + Number(r.cost_rm), 0);
  win.document.write(`<!DOCTYPE html><html><head><title>Log Servis — Proton Saga VVT MC2</title>
  <style>
    *{font-family:Helvetica,Arial,sans-serif}
    body{padding:40px;color:#1e293b}
    h1{font-size:22px;margin:0 0 4px}
    .sub{color:#64748b;font-size:13px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#f1f5f9;padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;text-transform:uppercase;font-size:10px;letter-spacing:.5px;color:#475569}
    td{padding:8px 12px;border-bottom:1px solid #e2e8f0}
    .total{margin-top:16px;font-size:14px;font-weight:bold;text-align:right}
    .footer{margin-top:32px;font-size:10px;color:#94a3b8;text-align:center}
    @media print{body{padding:20px}}
  </style></head><body>
    <h1>Log Servis — Proton Saga VVT MC2</h1>
    <div class="sub">Dijana pada ${new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })} · ${records.length} rekod</div>
    <table><thead><tr>
      <th>Tarikh</th><th>Jenis Servis</th><th>Mileage (km)</th><th>Kos (RM)</th><th>Catatan</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="total">Jumlah Kos: RM ${total.toFixed(2)}</div>
    <div class="footer">Log Penyelenggaraan Proton Saga VVT MC2</div>
    <script>window.onload=function(){window.print()}</script>
  </body></html>`);
  win.document.close();
}

export function exportFuelPDF(records: FuelRecord[]) {
  const win = window.open('', '_blank');
  if (!win) return;

  const sorted = [...records].sort((a, b) =>
    a.fill_date < b.fill_date ? -1 : 1,
  );

  const rows = sorted
    .map((r, i) => {
      const prev = i > 0 ? sorted[i - 1] : null;
      const distanceKm = prev ? r.mileage_km - prev.mileage_km : null;
      const rmPerKm = distanceKm && distanceKm > 0 ? (Number(r.total_cost_rm) / distanceKm).toFixed(4) : '—';
      const kmPerLiter = distanceKm && distanceKm > 0 ? (distanceKm / Number(r.liters)).toFixed(2) : '—';
      return `
      <tr>
        <td>${r.fill_date}</td>
        <td>${r.fuel_type}</td>
        <td style="text-align:right">${r.mileage_km.toLocaleString('ms-MY')}</td>
        <td style="text-align:right">${distanceKm !== null ? distanceKm.toLocaleString('ms-MY') : '—'}</td>
        <td style="text-align:right">${Number(r.liters).toFixed(3)}</td>
        <td style="text-align:right">RM ${Number(r.price_per_liter_rm).toFixed(2)}</td>
        <td style="text-align:right">RM ${Number(r.total_cost_rm).toFixed(2)}</td>
        <td style="text-align:right">${kmPerLiter}</td>
        <td style="text-align:right">${rmPerKm}</td>
      </tr>`;
    })
    .join('');

  const totalCost = records.reduce((s, r) => s + Number(r.total_cost_rm), 0);
  const totalLiters = records.reduce((s, r) => s + Number(r.liters), 0);

  win.document.write(`<!DOCTYPE html><html><head><title>Log Petrol — Proton Saga VVT MC2</title>
  <style>
    *{font-family:Helvetica,Arial,sans-serif}
    body{padding:40px;color:#1e293b}
    h1{font-size:22px;margin:0 0 4px}
    .sub{color:#64748b;font-size:13px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th{background:#f1f5f9;padding:8px 10px;text-align:left;border-bottom:2px solid #e2e8f0;text-transform:uppercase;font-size:9px;letter-spacing:.5px;color:#475569}
    td{padding:6px 10px;border-bottom:1px solid #e2e8f0}
    .total{margin-top:16px;font-size:14px;font-weight:bold;text-align:right}
    .footer{margin-top:32px;font-size:10px;color:#94a3b8;text-align:center}
    @media print{body{padding:20px}}
  </style></head><body>
    <h1>Log Petrol — Proton Saga VVT MC2</h1>
    <div class="sub">Dijana pada ${new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' })} · ${records.length} rekod</div>
    <table><thead><tr>
      <th>Tarikh</th><th>Petrol</th><th>Mileage</th><th>Jarak (km)</th><th>Liter</th><th>H/L (RM)</th><th>Kos (RM)</th><th>km/L</th><th>RM/km</th>
    </tr></thead><tbody>${rows}</tbody></table>
    <div class="total">Jumlah Kos: RM ${totalCost.toFixed(2)} · Total Liter: ${totalLiters.toFixed(3)} L</div>
    <div class="footer">Log Petrol Proton Saga VVT MC2</div>
    <script>window.onload=function(){window.print()}</script>
  </body></html>`);
  win.document.close();
}
