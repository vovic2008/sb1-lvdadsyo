import React, { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Shield, Users, Trophy, Bot } from 'lucide-react';

interface TournamentSettings {
  dota_enabled: boolean;
  cs_enabled: boolean;
  betting_enabled: boolean;
  tournament_name: string;
  admin_username: string;
}

interface BotStatus {
  status: string;
  uptime: string;
  lastUpdate: string;
}

export function Settings() {
  const [settings, setSettings] = useState<TournamentSettings>({
    dota_enabled: true,
    cs_enabled: true,
    betting_enabled: true,
    tournament_name: 'BetBattle Tournament 2024',
    admin_username: '@admin_username'
  });
  
  const [botStatus, setBotStatus] = useState<BotStatus>({
    status: 'Активний',
    uptime: '2 години 45 хвилин',
    lastUpdate: new Date().toLocaleString('uk-UA')
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Імітація збереження налаштувань
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Помилка збереження:', error);
    } finally {
      setLoading(false);
    }
  };

  const restartBot = async () => {
    try {
      setBotStatus(prev => ({ ...prev, status: 'Перезапуск...' }));
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBotStatus({
        status: 'Активний',
        uptime: '0 хвилин',
        lastUpdate: new Date().toLocaleString('uk-UA')
      });
    } catch (error) {
      console.error('Помилка перезапуску:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Налаштування</h2>
        <div className="flex items-center space-x-2">
          <SettingsIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">Конфігурація системи</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Налаштування турніру */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Налаштування турніру</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Назва турніру
              </label>
              <input
                type="text"
                value={settings.tournament_name}
                onChange={(e) => setSettings(prev => ({ ...prev, tournament_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username адміністратора
              </label>
              <input
                type="text"
                value={settings.admin_username}
                onChange={(e) => setSettings(prev => ({ ...prev, admin_username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.dota_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, dota_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Увімкнути Dota 2</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.cs_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, cs_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Увімкнути CS2</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.betting_enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, betting_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">Увімкнути ставки</span>
              </label>
            </div>
          </div>
        </div>

        {/* Статус бота */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Bot className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Статус бота</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Статус</p>
                <p className="text-sm text-green-700">{botStatus.status}</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Час роботи</p>
                <p className="text-lg font-semibold text-gray-900">{botStatus.uptime}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">Оновлено</p>
                <p className="text-sm text-gray-900">{botStatus.lastUpdate}</p>
              </div>
            </div>

            <button
              onClick={restartBot}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Перезапустити бота
            </button>
          </div>
        </div>
      </div>

      {/* Кнопка збереження */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
            saved 
              ? 'bg-green-600 text-white' 
              : loading 
                ? 'bg-gray-400 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Збереження...' : saved ? 'Збережено!' : 'Зберегти налаштування'}
        </button>
      </div>
    </div>
  );
}