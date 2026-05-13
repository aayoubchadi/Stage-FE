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
 * CUSTOMERS
 * =====================
 */
export async function fetchCustomers() {
  const res = await fetch(\`\${API_BASE_URL}/customers\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchCustomerById(id) {
  const res = await fetch(\`\${API_BASE_URL}/customers/\${id}\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createCustomer(data) {
  const res = await fetch(\`\${API_BASE_URL}/customers\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateCustomer(id, data) {
  const res = await fetch(\`\${API_BASE_URL}/customers/\${id}\`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/**
 * =====================
 * SALES ORDERS
 * =====================
 */
export async function fetchSalesOrders() {
  const res = await fetch(\`\${API_BASE_URL}/sales-orders\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchSalesOrderById(id) {
  const res = await fetch(\`\${API_BASE_URL}/sales-orders/\${id}\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createSalesOrder(data) {
  const res = await fetch(\`\${API_BASE_URL}/sales-orders\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function shipSalesOrderItems(soId, data) {
  const res = await fetch(\`\${API_BASE_URL}/sales-orders/\${soId}/ship\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
