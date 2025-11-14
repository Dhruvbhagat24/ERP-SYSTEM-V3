# Live Dashboard Implementation

## Overview
The ERP System dashboard now features **real-time data updates** that automatically fetch and display live information from your buying, selling, stocks, and assets APIs.

## Features Implemented

### ✅ Live Data Integration
- **Real-time Data Fetching**: Automatically pulls data from all backend APIs every 30 seconds
- **Live Metrics Calculation**: Calculates revenue, sales count, product count, and asset values in real-time
- **Dynamic Activity Feed**: Shows recent buying and selling transactions as they happen

### ✅ Interactive Controls
- **Live Mode Toggle**: Switch between live updates and offline mode
- **Manual Refresh**: Force refresh data on demand
- **Status Indicators**: Visual indicators showing live/offline status and last update time
- **Loading States**: Proper loading and error handling with user feedback

### ✅ Dashboard Metrics
1. **Total Revenue**: Calculated as (Total Selling Value - Total Buying Value)
2. **Sales**: Total number of selling transactions
3. **Products**: Total number of stock items
4. **Assets Value**: Sum of all asset values

### ✅ Real-time Alerts
- **Low Stock Alert**: Shows items that need restocking
- **Pending Orders**: Displays orders awaiting processing
- **Overdue Invoices**: Tracks overdue payment reminders
- **Completed Tasks**: Shows recently completed business tasks

## Technical Implementation

### API Integration
The dashboard connects to these endpoints:
- `GET /api/buying` - Fetch buying transactions
- `GET /api/selling` - Fetch selling transactions  
- `GET /api/stocks` - Fetch stock/product data
- `GET /api/assets` - Fetch company assets

### Data Flow
1. **Initial Load**: Fetches all data when dashboard mounts
2. **Live Updates**: Polls APIs every 30 seconds when live mode is enabled
3. **Error Handling**: Shows user-friendly errors if APIs are unavailable
4. **Performance**: Uses React hooks for efficient re-rendering

### State Management
- **useState**: Manages dashboard data, loading, error states
- **useEffect**: Handles initial load and cleanup
- **useCallback**: Optimizes API calls to prevent unnecessary requests
- **useRef**: Manages interval for live updates

## How to Use

### 1. Start the Backend Server
```bash
cd server
npm start
```
The server will run on `http://localhost:5000`

### 2. Start the Frontend
```bash
npm start
```
The React app will run on `http://localhost:3000`

### 3. Dashboard Controls
- **Live Toggle**: Click to enable/disable automatic updates
- **Refresh Button**: Manually refresh data at any time
- **Status Indicator**: Green dot = Live, Gray = Offline

## Sample Data for Testing

You can add sample data using PowerShell commands:

### Add Stocks
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/stocks" -Method POST -ContentType "application/json" -Body '{"name": "Apple Inc", "symbol": "AAPL", "price": 150.25, "quantity": 100}'
```

### Add Assets
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/assets" -Method POST -ContentType "application/json" -Body '{"name": "Office Building", "description": "Main headquarters", "value": 500000}'
```

### Add Buying Transaction
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/buying" -Method POST -ContentType "application/json" -Body '{"stock_id": 5, "quantity": 50, "price": 148.00}'
```

### Add Selling Transaction
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/selling" -Method POST -ContentType "application/json" -Body '{"stock_id": 5, "quantity": 30, "price": 152.00}'
```

## Dashboard Features

### Live Metrics Cards
Each metric card shows:
- **Current Value**: Real-time calculated value
- **Change Percentage**: Estimated change from previous period
- **Sparkline Chart**: Visual trend representation
- **Icon**: Visual identification

### Activity Feed
Shows the 5 most recent transactions:
- **Purchase Orders**: Recent buying transactions
- **Sales**: Recent selling transactions
- **Timestamps**: When each transaction occurred
- **Details**: Quantity, price, and calculated totals

### Alert Cards
Color-coded alerts for business insights:
- **Warning (Yellow)**: Low stock alerts
- **Info (Blue)**: Pending orders
- **Danger (Red)**: Overdue invoices  
- **Success (Green)**: Completed tasks

## Customization

### Update Intervals
To change the live update frequency, modify this line in `Dashboard.jsx`:
```javascript
intervalRef.current = setInterval(() => {
  fetchLiveData(true);
}, 30000); // Change 30000 to desired milliseconds
```

### Add New Metrics
To add new calculated metrics:
1. Add new state to `dashboardData`
2. Calculate the value in `fetchLiveData()`
3. Add new `MetricCard` to the metrics array

### Modify Alerts
Update the `liveAlerts` array to customize alert thresholds and messages.

## Troubleshooting

### Dashboard Shows "Loading..."
- Ensure the backend server is running on port 5000
- Check that APIs are responding: `http://localhost:5000/api/stocks`
- Verify database connection in server logs

### No Live Updates
- Check that Live Mode toggle is enabled (green indicator)
- Verify browser console for any JavaScript errors
- Ensure APIs are accessible and returning valid JSON

### Error Messages
- **"Failed to load dashboard data"**: Backend server not running
- **"Server not responding"**: Check server logs for database issues
- **Network errors**: Verify CORS settings in server configuration

## Benefits

### ✅ Real-time Business Intelligence
- Instant visibility into business performance
- No need to manually refresh for latest data
- Automated trend analysis and change detection

### ✅ Better User Experience
- Smooth loading states and error handling
- Visual feedback for all user interactions
- Responsive design for mobile and desktop

### ✅ Scalable Architecture
- Clean separation between UI and data fetching
- Easy to add new metrics and data sources
- Optimized performance with minimal re-renders

---

**Note**: This implementation provides a solid foundation for real-time dashboard functionality. You can extend it by adding WebSocket connections for instant updates, more sophisticated caching, or advanced analytics features.