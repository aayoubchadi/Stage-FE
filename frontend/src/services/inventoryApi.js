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
 * CATEGORIES
 * =====================
 */
export async function fetchCategories() {
  const res = await fetch(\`\${API_BASE_URL}/products/categories\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createCategory(data) {
  const res = await fetch(\`\${API_BASE_URL}/products/categories\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/**
 * =====================
 * PRODUCTS
 * =====================
 */
export async function fetchProducts() {
  const res = await fetch(\`\${API_BASE_URL}/products\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchProductById(id) {
  const res = await fetch(\`\${API_BASE_URL}/products/\${id}\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createProduct(data) {
  const res = await fetch(\`\${API_BASE_URL}/products\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateProduct(id, data) {
  const res = await fetch(\`\${API_BASE_URL}/products/\${id}\`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/**
 * =====================
 * LOCATIONS
 * =====================
 */
export async function fetchLocations() {
  const res = await fetch(\`\${API_BASE_URL}/inventory/locations\`, { headers: getAuthHeaders() });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createLocation(data) {
  const res = await fetch(\`\${API_BASE_URL}/inventory/locations\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

/**
 * =====================
 * MOVEMENTS
 * =====================
 */
export async function recordStockMovement(data) {
  const res = await fetch(\`\${API_BASE_URL}/inventory/move\`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}
