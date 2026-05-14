import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  Download,
  Calendar,
  Eye,
} from 'lucide-react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { getSession } from '../lib/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function buildAuthHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

async function fetchDashboardOverview({ accessToken }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/overview`, {
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Unable to load overview data');
  }

  return response.json();
}

async function fetchReportSummary({ accessToken }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports/summary`, {
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Unable to load report summary');
  }

  return response.json();
}

async function fetchLowStockReport({ accessToken }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports/low-stock`, {
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error('Unable to load low stock report');
  }

  return response.json();
}

export default function ReportsPage() {
  const [session] = useState(() => getSession());
  const [overview, setOverview] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [exportFormat, setExportFormat] = useState('csv');

  const accessToken = session?.accessToken;

  const loadData = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const [overviewData, reportData, lowStockData] = await Promise.all([
        fetchDashboardOverview({ accessToken }),
        fetchReportSummary({ accessToken }),
        fetchLowStockReport({ accessToken }),
      ]);

      setOverview(overviewData?.data || {});
      setReportSummary(reportData?.data || {});
      setLowStockItems(lowStockData?.data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const metrics = useMemo(() => {
    return {
      lowStockCount: overview?.low_stock_items || 0,
      totalInventoryValue: overview?.total_inventory_value || 0,
      activeOrders: overview?.active_sales_orders || 0,
      totalProducts: reportSummary?.total_products || 0,
      totalRevenue: reportSummary?.total_revenue || 0,
      averageOrderValue: reportSummary?.average_order_value || 0,
      topProducts: reportSummary?.top_products || [],
    };
  }, [overview, reportSummary]);

  const handleExportReport = (format) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `stockpro-report-${timestamp}.${format}`;

    if (format === 'csv') {
      const csv = [
        ['Inventory Report', timestamp].join(','),
        '',
        ['Metric', 'Value'].join(','),
        ['Total Inventory Value', `$${metrics.totalInventoryValue.toFixed(2)}`].join(','),
        ['Low Stock Items', metrics.lowStockCount].join(','),
        ['Active Orders', metrics.activeOrders].join(','),
        ['Total Products', metrics.totalProducts].join(','),
        '',
        ['Low Stock Items'].join(','),
        ['Product Name', 'SKU', 'Current Stock', 'Min Threshold'].join(','),
        ...lowStockItems.map((item) =>
          [item.name, item.sku, item.quantity_in_stock, item.low_stock_threshold].join(',')
        ),
      ]
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageBackground />
        <Header isDashboard={true} />
        <main className="section section-shell dashboard-page">
          <p className="dashboard-state">Loading reports...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <PageBackground />
      <Header isDashboard={true} />
      <main className="section section-shell dashboard-page">
        <section className="dashboard-head">
          <p className="eyebrow">Analytics</p>
          <h1>Business insights and performance metrics</h1>
          <div className="mt-4 flex gap-2 flex-wrap">
            <select
              className="px-3 py-2 rounded-md border border-slate-300 text-sm"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
              <option value="1year">Last year</option>
              <option value="all">All time</option>
            </select>
            <button
              type="button"
              className="btn btn-secondary inline-flex items-center gap-2"
              onClick={() => handleExportReport('csv')}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </section>

        <section className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Inventory Value</span>
                <Activity size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">
                ${(metrics.totalInventoryValue / 1000).toFixed(1)}k
              </p>
              <p className="mt-2 text-xs text-slate-500">Total stock value</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Low Stock Items</span>
                <AlertCircle size={14} className="text-amber-500" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">{metrics.lowStockCount}</p>
              <p className="mt-2 text-xs text-slate-500">Need reordering soon</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Active Orders</span>
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="text-3xl font-semibold text-slate-900">{metrics.activeOrders}</p>
              <p className="mt-2 text-xs text-slate-500">In progress</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                <span>Total Revenue</span>
                <TrendingUp size={14} className="text-purple-500" />
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                ${(metrics.totalRevenue / 1000).toFixed(1)}k
              </p>
              <p className="mt-2 text-xs text-slate-500">Sales revenue</p>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory Metrics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <BarChart3 size={18} />
                Inventory Overview
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Total Products</span>
                    <span className="font-semibold text-slate-900">{metrics.totalProducts}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">In Stock</span>
                    <span className="font-semibold text-slate-900">
                      {metrics.totalProducts - metrics.lowStockCount}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{
                        width: `${
                          metrics.totalProducts > 0
                            ? (((metrics.totalProducts - metrics.lowStockCount) /
                              metrics.totalProducts) *
                              100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Low Stock</span>
                    <span className="font-semibold text-slate-900">{metrics.lowStockCount}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{
                        width: `${
                          metrics.totalProducts > 0
                            ? ((metrics.lowStockCount / metrics.totalProducts) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Metrics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <Activity size={18} />
                Sales Performance
              </h3>
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600 mb-1">Average Order Value</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    ${metrics.averageOrderValue.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    ${(metrics.totalRevenue / 1000).toFixed(1)}k
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600 mb-1">Active Orders</p>
                  <p className="text-2xl font-semibold text-slate-900">{metrics.activeOrders}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          {metrics.topProducts.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                <TrendingUp size={18} />
                Top Selling Products
              </h3>
              <div className="space-y-3">
                {metrics.topProducts.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{product.sales_count} sales</p>
                      <p className="text-xs text-slate-500">
                        ${Number(product.total_revenue || 0).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-900 mb-4">
                <AlertCircle size={18} />
                Low Stock Alert ({lowStockItems.length} items)
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lowStockItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded bg-white/50">
                    <div>
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-700">{item.quantity_in_stock} in stock</p>
                      <p className="text-xs text-slate-500">Min: {item.low_stock_threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
