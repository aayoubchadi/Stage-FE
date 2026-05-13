import { API_BASE_URL } from './authApi';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: \`Bearer \${token}\` }),
  };
}

/**
 * =====================
 * SUPPLIERS
 * =====================
 */
export async function fetchSuppliers() {
  const res = await fetch(\`\${API_BASE_URL}/suppliers\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchSupplierById(id) {
  const res = await fetch(\`\${API_BASE_URL}/suppliers/\${id}\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createSupplier(data) {
  const res = await fetch(\`\${API_BASE_URL}/suppliers\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateSupplier(id, data) {
  const res = await fetch(\`\${API_BASE_URL}/suppliers/\${id}\`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/**
 * =====================
 * PURCHASE ORDERS
 * =====================
 */
export async function fetchPurchaseOrders() {
  const res = await fetch(\`\${API_BASE_URL}/purchase-orders\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchPurchaseOrderById(id) {
  const res = await fetch(\`\${API_BASE_URL}/purchase-orders/\${id}\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createPurchaseOrder(data) {
  const res = await fetch(\`\${API_BASE_URL}/purchase-orders\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function receivePurchaseOrderItems(poId, data) {
  const res = await fetch(\`\${API_BASE_URL}/purchase-orders/\${poId}/receive\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
