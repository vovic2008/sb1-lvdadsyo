import React, { useState, useEffect } from 'react';
import { Users, Trophy, Target, TrendingUp, Bot, Award, Upload, Calculator, Download } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Stats {
  totalUsers: number;
  totalBets: number;
  totalTeams: number;
  betsByGame: Array<{ game: string; count: string }>;
  topUsers: Array<{ name: string; username: string; bet_count: string; balance: number }>;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Помилка завантаження статистики:', error);
      setError('Не вдалося завантажити статистику. Перевірте підключення до бази даних.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: 'teams' | 'users', file: File) => {
    setActionLoading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/admin/upload-${type}`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`${type === 'teams' ? 'Команди' : 'Користувачі'} успішно завантажені: ${result.count} записів`);
        fetchStats(); // Оновити статистику
      } else {
        alert(`Помилка: ${result.error}`);
      }
    } catch (error) {
      console.error('Помилка завантаження:', error);
      alert('Помилка завантаження файлу');
    } finally {
      setActionLoading(null);
    }
  };

  const calculateWinnings = async () => {
    setActionLoading('calculate');
    try {
      const response = await fetch('/api/admin/calculate-winnings', {
        method: 'POST',
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`Розрахунок завершено! Оброблено: ${result.calculated} результатів`);
        fetchStats(); // Оновити статистику
      } else {
        alert(`Помилка: ${result.error}`);
      }
    } catch (error) {
      console.error('Помилка розрахунку:', error);
      alert('Помилка розрахунку виграшів');
    } finally {
      setActionLoading(null);
    }
  };

  const exportStats = async () => {
    setActionLoading('export');
    try {
      const response = await fetch('/api/admin/export-stats');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'betting_stats.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Помилка експорту статистики');
      }
    } catch (error) {
      console.error('Помилка експорту:', error);
      alert('Помилка експорту статистики');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg font-medium">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  const betsByGameData = stats?.betsByGame?.map(item => ({
    game: item.game === 'dota' ? 'Dota 2' : 'CS2',
    count: parseInt(item.count)
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Головна панель</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Bot className="h-4 w-4" />
          <span>Статус бота: Активний</span>
        </div>
      </div>

      {/* Статистичні картки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Загальна кількість користувачів"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Загальна кількість ставок"
          value={stats?.totalBets || 0}
          icon={Target}
          color="green"
        />
        <StatsCard
          title="Команд у системі"
          value={stats?.totalTeams || 0}
          icon={Trophy}
          color="yellow"
        />
        <StatsCard
          title="Активних турнірів"
          value={2}
          icon={Award}
          color="purple"
        />
      </div>

      {/* Графіки */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ставки за грою</h3>
          {betsByGameData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={betsByGameData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="game" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Немає даних для відображення</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Топ користувачів</h3>
          <div className="space-y-3">
            {stats?.topUsers?.length > 0 ? (
              stats.topUsers.slice(0, 5).map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{user.balance} балів</p>
                    <p className="text-sm text-gray-500">{user.bet_count} ставок</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-gray-500">
                <p>Немає користувачів для відображення</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Швидкі дії */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Швидкі дії</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Завантажити команди */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('teams', file);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={actionLoading === 'teams'}
            />
            <div className={`p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors ${actionLoading === 'teams' ? 'opacity-50' : ''}`}>
              {actionLoading === 'teams' ? (
                <div className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2">
                  <Upload className="h-8 w-8" />
                </div>
              ) : (
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {actionLoading === 'teams' ? 'Завантаження...' : 'Завантажити команди'}
              </p>
            </div>
          </div>

          {/* Завантажити користувачів */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('users', file);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={actionLoading === 'users'}
            />
            <div className={`p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors ${actionLoading === 'users' ? 'opacity-50' : ''}`}>
              {actionLoading === 'users' ? (
                <div className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2">
                  <Users className="h-8 w-8" />
                </div>
              ) : (
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              )}
              <p className="text-sm font-medium text-gray-700">
                {actionLoading === 'users' ? 'Завантаження...' : 'Завантажити користувачів'}
              </p>
            </div>
          </div>

          {/* Розрахувати виграші */}
          <button 
            onClick={calculateWinnings}
            disabled={actionLoading === 'calculate'}
            className={`p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors ${actionLoading === 'calculate' ? 'opacity-50' : ''}`}
          >
            {actionLoading === 'calculate' ? (
              <div className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-2">
                <Calculator className="h-8 w-8" />
              </div>
            ) : (
              <Calculator className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            )}
            <p className="text-sm font-medium text-gray-700">
              {actionLoading === 'calculate' ? 'Розрахунок...' : 'Розрахувати виграші'}
            </p>
          </button>
        </div>

        {/* Експорт статистики */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button 
            onClick={exportStats}
            disabled={actionLoading === 'export'}
            className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${actionLoading === 'export' ? 'opacity-50' : ''}`}
          >
            {actionLoading === 'export' ? (
              <div className="animate-spin h-4 w-4 mr-2">
                <Download className="h-4 w-4" />
              </div>
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {actionLoading === 'export' ? 'Експорт...' : 'Експортувати статистику'}
          </button>
        </div>
      </div>
    </div>
  );
}