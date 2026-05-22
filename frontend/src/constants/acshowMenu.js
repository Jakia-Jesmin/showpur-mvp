import { LayoutDashboard, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, TrendingUp, Activity, Settings, ShoppingCart, DollarSign, Receipt, Package, CreditCard } from 'lucide-react';
import { Bell, RefreshCw, Menu, X } from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard (ড্যাশবোর্ড)', icon: LayoutDashboard, path: '/acshow' },
  
  // Quick Actions Section
  { id: 'divider1', label: '', icon: null, path: null, isDivider: true },
  { id: 'quick-collection', label: 'Receive Money (কালেকশন)', icon: DollarSign, path: '/acshow?action=collection', isQuick: true },
  { id: 'quick-payment', label: 'Pay Supplier (পরিশোধ)', icon: CreditCard, path: '/acshow?action=payment', isQuick: true },
  { id: 'quick-sale', label: 'Record Sale (বিক্রয়)', icon: ShoppingCart, path: '/acshow?action=sale', isQuick: true },
  { id: 'quick-purchase', label: 'Record Purchase (কেনা)', icon: Package, path: '/acshow?action=purchase', isQuick: true },
  { id: 'quick-expense', label: 'Add Expense (খরচ)', icon: Receipt, path: '/acshow?action=expense', isQuick: true },
  
  // Main Menu
  { id: 'divider2', label: '', icon: null, path: null, isDivider: true },
  { id: 'cashflow', label: 'Cashflow (ক্যাশফ্লো)', icon: TrendingUp, path: '/acshow/cashflow' },
  { id: 'health', label: 'Business Health', icon: Activity, path: '/acshow/health' },
  { id: 'settings', label: 'Settings (সেটিংস)', icon: Settings, path: '/acshow/settings' },
];