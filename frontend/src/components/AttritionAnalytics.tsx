import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { AlertTriangle, Users, IndianRupee, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AttritionData {
  attritionRate: number;
  monthlyAttrition: { month: string; rate: number }[];
  deptAttrition: { department: string; rate: number }[];
  buAttrition: { bu: string; rate: number }[];
  resignationImpact: number;
  replacementRequirement: number;
  costImpact: number;
}

export default function AttritionAnalytics() {
  const [data, setData] = useState<AttritionData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/attrition`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to fetch attrition analytics", err));
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
          <Activity size={48} className="text-slate-600" />
          <p>Loading Attrition Analytics...</p>
        </div>
      </div>
    );
  }

  const lineChartData = {
    labels: data.monthlyAttrition.map(d => d.month),
    datasets: [
      {
        label: 'Monthly Attrition Rate (%)',
        data: data.monthlyAttrition.map(d => d.rate),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.4,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  const deptChartData = {
    labels: data.deptAttrition.map(d => d.department),
    datasets: [
      {
        label: 'Department Attrition Rate (%)',
        data: data.deptAttrition.map(d => d.rate),
        backgroundColor: data.deptAttrition.map(d => d.rate > 10 ? '#ef4444' : d.rate > 5 ? '#f59e0b' : '#10b981'),
        borderRadius: 4
      }
    ]
  };

  const buChartData = {
    labels: data.buAttrition.map(d => d.bu),
    datasets: [
      {
        label: 'Business Unit Attrition Rate (%)',
        data: data.buAttrition.map(d => d.rate),
        backgroundColor: '#6366f1',
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Overall Attrition Rate</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data.attritionRate}%</h3>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Resignation Impact</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data.resignationImpact.toFixed(1)}</h3>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Replacement Req.</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data.replacementRequirement}</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Cost Impact</p>
              <h3 className="text-3xl font-bold text-white mt-1">₹{(data.costImpact / 100000).toFixed(2)}L</h3>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-lg">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Monthly Attrition Trend</h3>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Department Attrition (Heatmap)</h3>
          <div className="h-64">
            <Bar data={deptChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">Colors indicate severity (Green &lt; 5%, Yellow 5-10%, Red &gt; 10%)</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4">Business Unit Attrition</h3>
          <div className="h-64">
            <Bar data={buChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
