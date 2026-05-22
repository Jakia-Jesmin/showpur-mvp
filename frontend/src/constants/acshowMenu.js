import { LayoutDashboard, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, TrendingUp, Activity, Settings, ShoppingCart } from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard (ড্যাশবোর্ড)', icon: LayoutDashboard, path: '/acshow' },
  { id: 'operations', label: 'Operations (অপারেশন)', icon: Activity, path: '/acshow/operations' },
  { id: 'pos', label: 'POS Terminal (পস)', icon: ShoppingCart, path: '/acshow/pos' },
  { id: 'transactions', label: 'Transactions (লেনদেন)', icon: ArrowLeftRight, path: '/acshow/transactions' },
  { id: 'reports', label: 'Reports (প্রতিবেদন)', icon: TrendingUp, path: '/acshow/reports' },
  { id: 'settings', label: 'Settings (সেটিংস)', icon: Settings, path: '/acshow/settings' },
];