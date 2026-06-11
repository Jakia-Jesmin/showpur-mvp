import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useInventoryQuality } from '@/hooks/useBusinessPulse';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN');

const BUCKETS = [
  {
    key:         'healthy_value',
    label:       'Healthy',
    labelBn:     'ভালো মজুদ',
    days:        '0–30 days',
    emoji:       '🟢',
    bg:          'bg-emerald-50',
    border:      'border-emerald-200',
    text:        'text-emerald-700',
    bar:         'bg-emerald-500',
    bucketName:  'HEALTHY',
  },
  {
    key:         'watch_value',
    label:       'Watch',
    labelBn:     'নজর রাখুন',
    days:        '31–60 days',
    emoji:       '🟡',
    bg:          'bg-amber-50',
    border:      'border-amber-200',
    text:        'text-amber-700',
    bar:         'bg-amber-400',
    bucketName:  'WATCH',
  },
  {
    key:         'risk_value',
    label:       'At Risk',
    labelBn:     'ঝুঁকিতে',
    days:        '61–90 days',
    emoji:       '🟠',
    bg:          'bg-orange-50',
    border:      'border-orange-200',
    text:        'text-orange-700',
    bar:         'bg-orange-500',
    bucketName:  'RISK',
  },
  {
    key:         'dead_stock_value',
    label:       'Dead Stock',
    labelBn:     'অচল মজুদ',
    days:        '90+ days',
    emoji:       '🔴',
    bg:          'bg-red-50',
    border:      'border-red-200',
    text:        'text-red-700',
    bar:         'bg-red-500',
    bucketName:  'DEAD_STOCK',
  },
];

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-24 bg-gray-200 rounded-2xl" />
    {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
  </div>
);

const ItemRow = ({ item }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 text-sm">
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-800 truncate">{item.product}</p>
      <p className="text-xs text-gray-400 truncate">{item.showroom}</p>
    </div>
    <div className="flex items-center gap-4 ml-3 shrink-0 text-right">
      <div>
        <p className="text-[11px] text-gray-400">Qty</p>
        <p className="font-semibold text-gray-700">{item.remaining_qty}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400">Age</p>
        <p className="font-semibold text-gray-700">{item.age_days}d</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-400">Value</p>
        <p className="font-bold text-gray-800">৳{fmt(item.value)}</p>
      </div>
    </div>
  </div>
);

const BucketCard = ({ bucket, value, total, items }) => {
  const [open, setOpen] = useState(false);
  const pct = total > 0 ? ((parseFloat(value || 0) / parseFloat(total)) * 100).toFixed(0) : 0;
  const filteredItems = (items || []).filter(it => it.bucket === bucket.bucketName);

  return (
    <div className={`${bucket.bg} border ${bucket.border} rounded-2xl overflow-hidden`}>
      <button
        className="w-full p-4 text-left flex items-center justify-between"
        onClick={() => filteredItems.length > 0 && setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-xl shrink-0">{bucket.emoji}</span>
          <div className="min-w-0">
            <p className={`text-sm font-bold ${bucket.text}`}>{bucket.label}</p>
            <p className="text-[11px] text-gray-400">{bucket.labelBn} · {bucket.days}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-right">
            <p className={`text-base font-black ${bucket.text}`}>৳{fmt(value)}</p>
            <p className="text-[11px] text-gray-400">{pct}% of total</p>
          </div>
          {filteredItems.length > 0 && (
            open
              ? <ChevronDown size={16} className="text-gray-400" />
              : <ChevronRight size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Width bar */}
      <div className="mx-4 mb-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${bucket.bar} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Expandable items */}
      {open && filteredItems.length > 0 && (
        <div className="bg-white/70 mx-3 mb-3 rounded-xl px-3">
          {filteredItems.map((item, i) => <ItemRow key={i} item={item} />)}
        </div>
      )}
    </div>
  );
};

const InventoryQualityPage = () => {
  const { report, loading, error, refresh } = useInventoryQuality();
  const r = report || {};
  const total = parseFloat(r.total_inventory_value || 0);

  const atRisk = parseFloat(r.risk_value || 0) + parseFloat(r.dead_stock_value || 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-800">Inventory Quality</h1>
          <p className="text-xs text-gray-400">মজুদের মান বিশ্লেষণ</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={refresh} className="px-3 py-1 bg-red-100 rounded-lg text-xs font-semibold">Retry</button>
        </div>
      )}

      {loading ? <Skeleton /> : (
        <>
          {/* ── TOTAL INVENTORY VALUE ────────────────────────── */}
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Total Inventory Float</p>
                <p className="text-[11px] text-slate-400 mb-2">শোরুমে মোট মজুদ</p>
                <p className="text-4xl font-black">৳{fmt(r.total_inventory_value)}</p>
                <p className="text-xs text-slate-400 mt-2">{(r.items || []).length} display request{(r.items || []).length !== 1 ? 's' : ''} outstanding</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Package size={22} className="text-slate-200" />
              </div>
            </div>

            {/* Health bar */}
            {total > 0 && (
              <div className="mt-4">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                  {BUCKETS.map(b => {
                    const w = ((parseFloat(r[b.key] || 0) / total) * 100).toFixed(1);
                    return parseFloat(w) > 0 ? (
                      <div key={b.key} className={`h-full ${b.bar}`} style={{ width: `${w}%` }} title={`${b.label}: ${w}%`} />
                    ) : null;
                  })}
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
                  <span>🟢 Healthy</span>
                  <span>🟡 Watch</span>
                  <span>🟠 Risk</span>
                  <span>🔴 Dead</span>
                </div>
              </div>
            )}
          </div>

          {/* ── AT-RISK ALERT ────────────────────────────────── */}
          {atRisk > 0 && total > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-2 items-start">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-bold text-rose-800">Capital at Risk</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  ৳{fmt(atRisk)} ({((atRisk / total) * 100).toFixed(0)}% of total) is in 61+ day stock.
                  Consider running a promotion or returning unsold goods.
                </p>
              </div>
            </div>
          )}

          {/* ── BUCKET CARDS ─────────────────────────────────── */}
          <div className="space-y-3">
            {BUCKETS.map(bucket => (
              <BucketCard
                key={bucket.key}
                bucket={bucket}
                value={r[bucket.key]}
                total={r.total_inventory_value}
                items={r.items}
              />
            ))}
          </div>

          {/* ── EMPTY STATE ──────────────────────────────────── */}
          {total === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="font-bold text-gray-700">No Outstanding Inventory</h3>
              <p className="text-sm text-gray-400 mt-1">No products are currently dispatched to showrooms.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryQualityPage;
