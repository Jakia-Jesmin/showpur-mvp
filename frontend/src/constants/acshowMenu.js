import { LayoutDashboard, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, TrendingUp, Activity, Settings, ShoppingCart, DollarSign, Receipt, Package, CreditCard, Zap, Layers, Clock } from 'lucide-react';
import { Bell, RefreshCw, Menu, X, Users } from 'lucide-react';

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
  { id: 'contacts', label: 'Contacts (পরিচিতি)', icon: Users, path: '/acshow/contacts' },
  { id: 'products', label: 'Products (পণ্য)', icon: Package, path: '/acshow/products' },
  { id: 'divider2', label: '', icon: null, path: null, isDivider: true },

  // Floor 1: Cash Intelligence
  { id: 'pulse', label: 'Daily Pulse (দৈনিক)', icon: Zap, path: '/acshow/pulse' },
  { id: 'inventory-quality', label: 'Inventory Quality', icon: Layers, path: '/acshow/inventory-quality' },
  { id: 'aging-report', label: 'Aging Report (বকেয়া)', icon: Clock, path: '/acshow/aging-report' },
  { id: 'cashflow', label: 'Cashflow (ক্যাশফ্লো)', icon: TrendingUp, path: '/acshow/cashflow' },
  { id: 'health', label: 'Business Health', icon: Activity, path: '/acshow/health' },
  { id: 'settings', label: 'Settings (সেটিংস)', icon: Settings, path: '/acshow/settings' },
];