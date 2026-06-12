import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from './Layout';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { motion } from 'framer-motion';

// Import page components
import AnalyticsPage from './pages/AnalyticsPage';
import SalesAnalytics from './pages/SalesAnalytics';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Reports from './pages/Reports';
// import POSAdminPage from './pages/POSAdminPage'; // Removed
import CustomersPage from './pages/CustomersPage';
import InventoryPage from './pages/InventoryPage';
import AlertsPage from './pages/AlertsPage';
import SuppliersPage from './pages/SuppliersPage';
import UsersPage from './pages/UsersPage'; // Added
// import ServersPage from './pages/ServersPage'; // Removed
import CustomizeSite from './pages/CustomizeSite';
import MenuItemsPage from './pages/MenuItemsPage';
import InventoryLedger from './pages/InventoryLedger';
import MainStorePage from './pages/MainStorePage';
import ProductionPage from './pages/ProductionPage';
import Index from '../pages/Index';

interface DashboardProps {
 user?: any;
 onLogout?: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
 const location = useLocation();
 const [control_array, setControl_array] = useState([]);
 const [selectedCategory, setSelectedCategory] = useState('');

 const getPageContent = () => {
 switch (location.pathname) {
 case '/menu-items':
 return <MenuItemsPage />;
 // case '/servers':
 // return <ServersPage />;
 case '/analytics':
 return <AnalyticsPage />;
 case '/sales-analytics':
 return <SalesAnalytics />;
 case '/monitoring':
 return <MonitoringDashboard />;
 case '/reports':
 return <Reports />;
 case '/users':
 return <UsersPage />;
 case '/customers':
 return <CustomersPage />;
 case '/inventory':
 return <InventoryPage />;
 case '/alerts':
 return <AlertsPage />;
 case '/suppliers':
 return <SuppliersPage />;
 case '/inventory-ledger':
 return <InventoryLedger />;
 case '/main-store':
 return <MainStorePage />;
 case '/production':
 return <ProductionPage />;
 case '/':
 return <Index />;
 default:
 return <SalesAnalytics />;
 }
 };

 return (
 <Layout>
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5 }}
 className="flex-1 flex flex-col"
 >
 <div className="@container/main flex flex-1 flex-col gap-2">
 <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
 {getPageContent()}
 </div>
 </div>
 </motion.div>
 </Layout>
 );
}
