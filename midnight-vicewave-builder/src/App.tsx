import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Dashboard } from "./components/Dashboard";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
 <QueryClientProvider client={queryClient}>
 <TooltipProvider>
 <Toaster />
 <Sonner />
 <BrowserRouter>
 <AuthProvider>
 <Routes>
 <Route path="/login" element={<Login />} />

 <Route element={<ProtectedRoute />}>
 <Route path="/" element={<Dashboard />} />
 <Route path="/dashboard" element={<Dashboard />} />
 <Route path="/analytics" element={<Dashboard />} />
 <Route path="/sales-analytics" element={<Dashboard />} />
 <Route path="/monitoring" element={<Dashboard />} />
 <Route path="/reports" element={<Dashboard />} />
 <Route path="/users" element={<Dashboard />} />
 <Route path="/customers" element={<Dashboard />} />
 <Route path="/inventory" element={<Dashboard />} />
 <Route path="/alerts" element={<Dashboard />} />
 <Route path="/suppliers" element={<Dashboard />} />
 <Route path="/menu-items" element={<Dashboard />} />
 <Route path="/inventory-ledger" element={<Dashboard />} />
 <Route path="/main-store" element={<Dashboard />} />
 <Route path="/production" element={<Dashboard />} />
 </Route>

 {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
 <Route path="*" element={<NotFound />} />
 </Routes>
 </AuthProvider>
 </BrowserRouter>
 </TooltipProvider>
 </QueryClientProvider>
);

export default App;
