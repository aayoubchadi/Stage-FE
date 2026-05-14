import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Plus,
  Search,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
} from 'lucide-react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { getSession } from '../lib/authStore';
import { cn } from '../lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function buildAuthHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

function resolveErrorMessage(payload, defaultMsg) {
  if (typeof payload === 'string') return payload;
  if (payload?.error) return payload.error;
  if (payload?.message) return payload.message;
  if (payload?.data?.message) return payload.data.message;
  return defaultMsg;
}

async function fetchPurchaseOrders({ accessToken }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders`, {
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(resolveErrorMessage(payload, 'Unable to load purchase orders'));
  }

  return response.json();
}

async function createPurchaseOrder({ accessToken, supplierId, items, notes }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders`, {
    method: 'POST',
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify({ supplierId, items, notes }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(resolveErrorMessage(payload, 'Unable to create purchase order'));
  }

  return response.json();
}

async function receivePurchaseOrder({ accessToken, purchaseOrderId, receivedItems }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/purchase-orders/${purchaseOrderId}/receive`, {
    method: 'POST',
    headers: buildAuthHeaders(accessToken),
    body: JSON.stringify({ receivedItems }),
  });

  if (!response.ok) {
    const payload = await response.json();
    throw new Error(resolveErrorMessage(payload, 'Unable to receive order'));
  }

  return response.json();
}

export default function PurchaseOrdersPage() {
  const [session] = useState(() => getSession());
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [form, setForm] = useState({
    supplierId: '',
    items: [],
    notes: '',
  });

  const accessToken = session?.accessToken;

  const loadPurchaseOrders = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const data = await fetchPurchaseOrders({ accessToken });
      setPurchaseOrders(data?.purchaseOrders || []);
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message || 'Unable to load purchase orders');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, [accessToken]);

  const handleCreatePurchaseOrder = async (event) => {
    event.preventDefault();
    if (!accessToken || !form.supplierId || form.items.length === 0) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPurchaseOrder({
        accessToken,
        supplierId: form.supplierId,
        items: form.items,
        notes: form.notes,
      });

      setForm({ supplierId: '', items: [], notes: '' });
      setShowCreateForm(false);
      setMessage('Purchase order created successfully');
      setMessageType('success');
      await loadPurchaseOrders();
    } catch (error) {
      setMessage(error.message || 'Unable to create purchase order');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveOrder = async (orderId) => {
    if (!accessToken) return;

    setIsSubmitting(true);
    try {
      const order = purchaseOrders.find((po) => po.id === orderId);
      const receivedItems = order?.items?.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })) || [];

      await receivePurchaseOrder({
        accessToken,
        purchaseOrderId: orderId,
        receivedItems,
      });

      setMessage('Purchase order received');
      setMessageType('success');
      await loadPurchaseOrders();
    } catch (error) {
      setMessage(error.message || 'Unable to receive order');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return purchaseOrders.filter((po) => {
      const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
      const matchesSearch =
        query.length === 0 ||
        String(po.id || '').toLowerCase().includes(query) ||
        String(po.supplier_name || '').toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter((po) => po.status === 'pending').length,
      received: purchaseOrders.filter((po) => po.status === 'received').length,
      cancelled: purchaseOrders.filter((po) => po.status === 'cancelled').length,
      totalValue: purchaseOrders.reduce((sum, po) => sum + (Number(po.total_amount || 0)), 0),
    };
  }, [purchaseOrders]);

  const getStatusColor = (status) => {
    if (status === 'pending') return 'text-amber-600 bg-amber-50';
    if (status === 'received') return 'text-green-600 bg-green-50';
    if (status === 'cancelled') return 'text-red-600 bg-red-50';
    return 'text-slate-600 bg-slate-50';
  };

  const getStatusIcon = (status) => {
    if (status === 'pending') return <Clock size={14} />;
    if (status === 'received') return <CheckCircle size={14} />;
    if (status === 'cancelled') return <AlertTriangle size={14} />;
    return null;
  };

  return (
    <>
      <PageBackground />
      <Header isDashboard={true} />
      <main className="section section-shell dashboard-page">
        <section className="dashboard-head">
          <p className="eyebrow">Procurement</p>
          <h1>Manage purchase orders and supplier relationships</h1>
          <div className="mt-4">
            <button
              type="button"
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={() => setShowCreateForm((current) => !current)}
            >
              <Plus size={16} />
              {showCreateForm ? 'Cancel' : 'New Order'}
            </button>
          </div>
        </section>

        {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
        {isLoading ? <p className="dashboard-state">Loading purchase orders...</p> : null}

        {!isLoading ? (
          <section className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Orders</span>
                  <Truck size={14} />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.total}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Pending</span>
                  <Clock size={14} className="text-amber-500" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.pending}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Received</span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.received}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Cancelled</span>
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.cancelled}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Total Value</span>
                  <Download size={14} />
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  ${(stats.totalValue / 1000).toFixed(1)}k
                </p>
              </div>
            </div>

            {/* Create Form */}
            {showCreateForm && (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Create Purchase Order</h3>
                <form className="space-y-4" onSubmit={handleCreatePurchaseOrder}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Supplier
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Enter supplier ID or name"
                        value={form.supplierId}
                        onChange={(e) => setForm((c) => ({ ...c, supplierId: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Additional notes"
                        value={form.notes}
                        onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                  </button>
                </form>
              </article>
            )}

            {/* Search & Filter */}
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-3">
                <select
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm"
                    placeholder="Search by order ID or supplier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </article>

            {/* Orders List */}
            <article className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No purchase orders found
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-slate-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 truncate">{order.id}</p>
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                                getStatusColor(order.status)
                              )}
                            >
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">
                            {order.supplier_name} • {order.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">
                            ${Number(order.total_amount || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <ChevronDown
                        size={18}
                        className={cn(
                          'text-slate-400 transition-transform ml-2 flex-shrink-0',
                          expandedOrderId === order.id && 'rotate-180'
                        )}
                      />
                    </button>

                    {expandedOrderId === order.id && (
                      <div className="border-t border-slate-200 p-4 bg-slate-50">
                        <div className="space-y-3">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-slate-700">{item.product_name}</span>
                              <span className="font-medium text-slate-900">
                                {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200 flex gap-2">
                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleReceiveOrder(order.id)}
                              className="btn btn-primary text-sm"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Processing...' : 'Mark as Received'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </article>
          </section>
        ) : null}
      </main>
    </>
  );
}
