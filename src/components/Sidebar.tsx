import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  TrendingUp, 
  Settings, 
  Bot,
  Target
} from 'lucide-react';

const navigation = [
  { name: 'Головна', href: '/', icon: LayoutDashboard },
  { name: 'Команди', href: '/teams', icon: Trophy },
  { name: 'Користувачі', href: '/users', icon: Users },
  { name: 'Ставки', href: '/bets', icon: Target },
  { name: 'Налаштування', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
        <div className="flex h-16 flex-shrink-0 items-center px-4">
          <Bot className="h-8 w-8 text-white" />
          <span className="ml-2 text-white text-lg font-bold">BetBattleBot</span>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}