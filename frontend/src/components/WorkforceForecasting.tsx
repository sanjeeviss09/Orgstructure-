import { useEffect, useState } from 'react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Users, IndianRupee, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ForecastingData {
  budgetHC: number;
  activeHC: number;
  offeredHC: number;
  vacancyHC: number;
  expectedJoiningHC: number;
  forecastedHC: number;
  futureBudgetUtilization: number;
  futurePayrollCost: number;
  expectedSavings: number;
  hiringRequirementForecast: number;
  forecastCompletionDates: {
    vacancies: number;
    avgHiringSpeed: number;
    expectedClosureMonths: number;
  };
}

export default function WorkforceForecasting() {
  const [data, setData] = useState<ForecastingData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/analytics/forecasting`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to fetch workforce forecasting", err));
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-pulse flex flex-col items-center justify-center space-y-4">
          <TrendingUp size={48} className="text-slate-600" />
          <p>Loading Workforce Forecasts...</p>
        </div>
      </div>
    );
  }

  const hcChartData = {
    labels: ['Budget HC', 'Actual HC', 'Offered HC', 'Vacancy HC', 'Forecasted HC'],
    datasets: [
      {
        label: 'Headcount',
        data: [data.budgetHC, data.activeHC, data.offeredHC, data.vacancyHC, data.forecastedHC],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Forecasted Headcount</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data.forecastedHC}</h3>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-400">
            <span>Expected Joining: {data.expectedJoiningHC}</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Future Budget Utilization</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data.futureBudgetUtilization.toFixed(1)}%</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-400">
            <span>Future Cost: ₹{(data.futurePayrollCost / 100000).toFixed(2)}L</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Expected Savings</p>
              <h3 className={`text-3xl font-bold mt-1 ${data.expectedSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ₹{(Math.abs(data.expectedSavings) / 100000).toFixed(2)}L
              </h3>
            </div>
            <div className="bg-emerald-500/20 p-3 rounded-lg">
              <IndianRupee className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-400">
            {data.expectedSavings >= 0 ? (
              <><ArrowUpRight className="w-4 h-4 text-emerald-400 mr-1" /> Surplus</>
            ) : (
              <><ArrowDownRight className="w-4 h-4 text-red-400 mr-1" /> Deficit</>
            )}
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Forecast Completion</p>
              <h3 className="text-3xl font-bold text-white mt-1">{data.forecastCompletionDates.expectedClosureMonths} Mo</h3>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-slate-400">
            <span>Based on {data.forecastCompletionDates.avgHiringSpeed} hires/month</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">Headcount Forecasting Analytics</h3>
        <div className="h-80">
          <Bar data={hcChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </div>
    </div>
  );
}
