# StockPro Dashboard Stats Component Integration

## 📦 What Was Added

Your StockPro project now includes a **recharts-based inventory dashboard** component with:

- ✅ **4 Key Metrics**: Total Products, Daily Movements, Low Stock Alerts, Inventory Value
- ✅ **Interactive Line Chart**: Click any metric card to switch chart views
- ✅ **Dark Mode Support**: Automatically adapts to your `data-theme="dark"` attribute
- ✅ **StockPro Theme Colors**: Blue, Emerald, Red, Amber palette matching your brand
- ✅ **Responsive Grid**: Adapts to 2 columns (mobile) → 4 columns (desktop)

---

## 📁 File Structure

**New component files:**
```
src/
  components/
    ui/                           # New shadcn-style UI library
      ├── line-charts-6.jsx       # Chart wrapper (recharts)
      ├── badge-2.jsx             # Badge component
      ├── card.jsx                # Card container
      └── button-1.jsx            # Button component
    └── StockProDashboardStats.jsx # Main dashboard component
  lib/
    └── utils.js                   # Utility functions (cn helper)
```

**Config files:**
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS with Tailwind & autoprefixer

---

## 🚀 How to Use

### 1. **Import in Your Dashboard Page**

In your `ClientDashboardPage.jsx` or `AdminDashboardPage.jsx`:

```jsx
import StockProDashboardStats from '../components/StockProDashboardStats';

export default function ClientDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Your other dashboard content */}
      
      {/* Add the stats component */}
      <StockProDashboardStats />
      
      {/* More content */}
    </div>
  );
}
```

### 2. **Customize the Data**

Edit `src/components/StockProDashboardStats.jsx`:

```jsx
// Replace with real API data
const inventoryData = [
  { date: '2024-04-11', products: 24, movements: 8, lowStock: 3, value: 4200 },
  // ... more data
];

// Replace with real metrics from backend
const metrics = [
  {
    key: 'products',
    label: 'Total Products',
    value: 28,  // ← Replace with API data
    previousValue: 24,
    // ...
  },
  // ... more metrics
];
```

### 3. **Hook it to Your Backend**

Replace the hardcoded data with API calls:

```jsx
import { useEffect, useState } from 'react';

export default function StockProDashboardStats() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch from your backend
    fetch('/api/v1/dashboard/stats')
      .then(r => r.json())
      .then(d => setData(d.data))
      .catch(err => console.error(err));
  }, []);

  // ... rest of component
}
```

---

## 🎨 Theme Integration

The component automatically respects your existing theme system:

- **Light mode**: White cards, slate-gray text
- **Dark mode**: Dark slate cards detected via `[data-theme="dark"]` selector
- **Colors**: Uses blue, emerald, red, amber from tailwind config

---

## 📦 Dependencies Installed

```bash
npm install recharts radix-ui class-variance-authority lucide-react tailwindcss postcss autoprefixer
```

If any package fails, manually install:
```bash
npm install recharts --save
npm install lucide-react --save
```

---

## 🔄 Reverting to Backup

If you want to restore the original frontend state:

```bash
# Remove the modified frontend
rmdir /s C:\Users\hamzaa\Desktop\Stage-FE\frontend

# Restore from backup
xcopy C:\Users\hamzaa\Desktop\Stage-FE\frontend-backup-before-charts C:\Users\hamzaa\Desktop\Stage-FE\frontend /E /I
```

---

## ✅ Testing

1. **Start the dev server** (if not already running):
   ```bash
   cd C:\Users\hamzaa\Desktop\Stage-FE
   npm run dev
   ```

2. **Navigate to** `http://localhost:5175` (or your assigned port)

3. **In the dashboard**, you should see the 4 metric cards at the top with an interactive line chart below

4. **Click any metric card** to switch the chart view

---

## 🛠️ Troubleshooting

**Issue**: Styles not applying?
- Make sure `@tailwind` directives are at the top of `src/index.css`
- Clear browser cache and restart dev server

**Issue**: Chart not showing?
- Check browser console for errors
- Verify recharts is installed: `npm ls recharts`

**Issue**: Dark mode not working?
- Ensure your root element has `data-theme="dark"` when in dark mode
- Component watches for this attribute

---

## 📝 Next Steps

1. **Connect to real backend data**: Replace hardcoded arrays with API calls
2. **Add more metrics**: Duplicate metric cards to show additional insights
3. **Customize colors**: Edit the `chartConfig` object to match your brand
4. **Add export functionality**: Use recharts export features or add a simple screenshot button
5. **Responsive charts**: Already responsive, but test on mobile devices

---

## 💡 Tips

- **Large datasets?** Consider adding pagination/date range filters
- **Real-time updates?** Use WebSockets or polling with `setInterval`
- **Performance?** The chart re-renders only when `selectedMetric` changes
- **Custom tooltips?** Edit the `CustomTooltip` component at the bottom of StockProDashboardStats.jsx

---

**Questions?** Check the component source code for inline comments explaining each section!
