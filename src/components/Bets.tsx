import React, { useState, useEffect } from 'react';
import { Target, Trophy, Star, Filter } from 'lucide-react';

interface Bet {
  id: number;
  user_name: string;
  user_username: string;
  game: string;
  bet_type: string;
  team_name: string;
  player_username: string;
  points: number;
  is_won: boolean | null;
  created_at: string;
}

export function Bets() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBets();
  }, []);

  const fetchBets = async () => {
    try {
      const response = await fetch('/api/admin/bets');
      const data = await response.json();
      setBets(data);
    } catch (error) {
      console.error('Помилка завантаження ставок:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'won') return bet.is_won === true;
    if (filter === 'lost') return bet.is_won === false;
    if (filter === 'pending') return bet.is_won === null;
    return bet.game === filter;
  });

  const getBetTypeIcon = (betType: string) => {
    switch (betType) {
      case 'winner':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'mvp':
        return <Star className="h-4 w-4 text-purple-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBetTypeLabel = (betType: string) => {
    switch (betType) {
      case 'winner':
        return 'Переможець';
      case '2nd_place':
        return '2 місце';
      case '3rd_place':
        return '3 місце';
      case 'mvp':
        return 'MVP';
      default:
        return betType;
    }
  };

  const getStatusBadge = (isWon: boolean | null) => {
    if (isWon === true) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Виграна</span>;
    } else if (isWon === false) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Програна</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Очікує</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Ставки</h2>
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Всі ставки</option>
            <option value="dota">Dota 2</option>
            <option value="cs">CS2</option>
            <option value="won">Виграні</option>
            <option value="lost">Програні</option>
            <option value="pending">Очікують</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Всього ставок: {filteredBets.length}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Користувач
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Гра
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип ставки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Вибір
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Бали
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBets.map((bet) => (
                <tr key={bet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{bet.user_name}</div>
                      <div className="text-sm text-gray-500">@{bet.user_username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bet.game === 'dota' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bet.game === 'dota' ? 'Dota 2' : 'CS2'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getBetTypeIcon(bet.bet_type)}
                      <span className="text-sm text-gray-900">{getBetTypeLabel(bet.bet_type)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bet.team_name || bet.player_username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {bet.points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(bet.is_won)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bet.created_at).toLocaleDateString('uk-UA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}