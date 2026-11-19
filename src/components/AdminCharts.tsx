import React, { useState } from 'react';
import { DashboardAnalytics } from '../utils/commerce';

interface AdminChartsProps {
  analytics: DashboardAnalytics;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({ analytics }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const series =
    period === 'daily'
      ? analytics.dailyRevenue
      : period === 'weekly'
      ? analytics.weeklyRevenue
      : analytics.monthlyRevenue;

  const maxRev = Math.max(100, ...series.map((s) => s.revenue));
  const maxDishQty = Math.max(1, ...analytics.bestSellingDishes.map((d) => d.quantity));
  const totalStatusCount = Math.max(
    1,
    analytics.statusDistribution.reduce((sum, s) => sum + s.count, 0)
  );

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold text-[#242424]">Revenue Performance</h3>
            <p className="text-xs text-[#242424]/65">
              Calculated live from non-cancelled Firestore orders
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F4E7D3] self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPeriod(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  period === mode ? 'bg-white text-[#641E24] shadow-xs' : 'text-[#242424]/70'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 items-end h-52 pt-6 border-t border-[#F3E8D8]">
          {series.map((point) => {
            const pct = Math.max(4, Math.round((point.revenue / maxRev) * 100));
            return (
              <div key={point.label} className="flex flex-col items-center justify-end h-full gap-2">
                <span className="font-mono tabular-nums text-[11px] font-semibold text-[#641E24]">
                  ₹{point.revenue}
                </span>
                <div className="w-full max-w-[44px] flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-[#641E24] hover:bg-[#F28C28] transition-colors"
                    style={{ height: `${pct}%` }}
                    title={`${point.label}: ₹${point.revenue} (${point.orders} orders)`}
                  />
                </div>
                <span className="text-[11px] font-medium text-[#242424]/70 text-center truncate w-full">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best-Selling Dishes */}
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#242424]">Best-Selling Dishes</h3>
            <p className="text-xs text-[#242424]/65">Top ordered items by quantity sold</p>
          </div>

          {analytics.bestSellingDishes.length === 0 ? (
            <p className="text-sm text-[#242424]/65 py-8 text-center">
              No completed or active order items yet.
            </p>
          ) : (
            <div className="space-y-3.5 pt-2">
              {analytics.bestSellingDishes.map((dish) => {
                const widthPct = Math.round((dish.quantity / maxDishQty) * 100);
                return (
                  <div key={dish.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span className="font-semibold text-[#242424] truncate">{dish.name}</span>
                      <span className="font-mono tabular-nums text-[#641E24] font-bold shrink-0">
                        {dish.quantity} sold · ₹{dish.revenue}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#F4E7D3] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F28C28]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#242424]">Order Status Distribution</h3>
            <p className="text-xs text-[#242424]/65">Live breakdown across all order stages</p>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.statusDistribution.map((item) => {
              const pct = Math.round((item.count / totalStatusCount) * 100);
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#242424]">{item.status}</span>
                    <span className="font-mono tabular-nums text-[#242424]/75">
                      {item.count} ({analytics.totalOrders > 0 ? pct : 0}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F4E7D3] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'Cancelled'
                          ? 'bg-red-600'
                          : item.status === 'Completed'
                          ? 'bg-emerald-600'
                          : 'bg-[#641E24]'
                      }`}
                      style={{ width: `${analytics.totalOrders > 0 ? pct : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
