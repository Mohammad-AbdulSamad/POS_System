// src/components/dashboard/SalesChart.jsx
import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card, { CardHeader, CardBody } from '../common/Card';
import { Tabs, TabsList, TabsTrigger } from '../common/Tabs';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import { TrendingUp, Download, Calendar } from 'lucide-react';
import clsx from 'clsx';

/**
 * SalesChart Component
 * 
 * A comprehensive sales analytics chart with multiple views and time periods.
 * Displays sales data using recharts library with customizable chart types.
 * 
 * @example
 * <SalesChart
 *   data={salesData}
 *   loading={false}
 *   onPeriodChange={(period) => fetchData(period)}
 * />
 */

const SalesChart = ({
  data = [],
  loading = false,
  title = 'Sales Overview',
  subtitle = 'Track your sales performance',
  showPeriodSelector = true,
  showChartTypeSelector = true,
  showDownload = true,
  defaultPeriod = 'week',
  defaultChartType = 'line',
  currency = '₪',
  onPeriodChange,
  onDownload,
  className = '',
}) => {
  const [period, setPeriod] = useState(defaultPeriod);
  const [chartType, setChartType] = useState(defaultChartType);

  // Period options
  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const handleDownload = () => {
    onDownload?.(data, period, chartType);
  };

  // Calculate summary stats
  const totalSales = data.reduce((sum, item) => sum + (item.sales || 0), 0);
  const avgSales = data.length > 0 ? totalSales / data.length : 0;
  const maxSales = Math.max(...data.map(item => item.sales || 0), 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">
                {currency}{entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={clsx('h-full', className)}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={TrendingUp}
        action={
          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            {showChartTypeSelector && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    chartType === 'line'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={clsx(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                    chartType === 'bar'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Bar
                </button>
              </div>
            )}

            {/* Download Button */}
            {showDownload && (
              <Button
                size="sm"
                variant="ghost"
                icon={Download}
                onClick={handleDownload}
              >
                Export
              </Button>
            )}
          </div>
        }
      />

      <CardBody>
        {/* Period Selector */}
        {showPeriodSelector && (
          <div className="mb-6">
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <TabsList variant="enclosed">
                {periods.map((p) => (
                  <TabsTrigger key={p.value} value={p.value}>
                    {p.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Total Sales</p>
            <p className="text-lg font-bold text-gray-900">
              {currency}{totalSales.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Average</p>
            <p className="text-lg font-bold text-gray-900">
              {currency}{avgSales.toFixed(0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Peak</p>
            <p className="text-lg font-bold text-gray-900">
              {currency}{maxSales.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <Spinner size="lg" label="Loading chart..." />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-gray-500">
            <Calendar className="h-12 w-12 mb-4 text-gray-400" />
            <p>No data available for this period</p>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(value) => `${currency}${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  {data[0]?.target && (
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </LineChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(value) => `${currency}${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                  />
                  {data[0]?.target && (
                    <Bar
                      dataKey="target"
                      name="Target"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                      opacity={0.5}
                    />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

SalesChart.displayName = 'SalesChart';

export default SalesChart;

/**
 * Example Usage:
 * 
 * import SalesChart from '@/components/dashboard/SalesChart';
 * 
 * // Basic usage
 * const salesData = [
 *   { name: 'Mon', sales: 4000, target: 3500 },
 *   { name: 'Tue', sales: 3000, target: 3500 },
 *   { name: 'Wed', sales: 2000, target: 3500 },
 *   { name: 'Thu', sales: 2780, target: 3500 },
 *   { name: 'Fri', sales: 1890, target: 3500 },
 *   { name: 'Sat', sales: 2390, target: 3500 },
 *   { name: 'Sun', sales: 3490, target: 3500 },
 * ];
 * 
 * <SalesChart data={salesData} />
 * 
 * // With loading state
 * <SalesChart data={salesData} loading={isLoading} />
 * 
 * // With period change handler
 * <SalesChart
 *   data={salesData}
 *   onPeriodChange={(period) => {
 *     console.log('Period changed to:', period);
 *     fetchSalesData(period);
 *   }}
 * />
 * 
 * // With download handler
 * <SalesChart
 *   data={salesData}
 *   onDownload={(data, period, chartType) => {
 *     // Export data to CSV or PDF
 *     downloadReport(data, period, chartType);
 *   }}
 * />
 * 
 * // Complete dashboard implementation
 * const Dashboard = () => {
 *   const [salesData, setSalesData] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   const fetchData = async (period) => {
 *     setLoading(true);
 *     const data = await api.getSalesData(period);
 *     setSalesData(data);
 *     setLoading(false);
 *   };
 * 
 *   useEffect(() => {
 *     fetchData('week');
 *   }, []);
 * 
 *   return (
 *     <div className="grid grid-cols-1 gap-6">
 *       <SalesChart
 *         data={salesData}
 *         loading={loading}
 *         onPeriodChange={fetchData}
 *         onDownload={(data) => exportToCSV(data)}
 *       />
 *     </div>
 *   );
 * };
 */