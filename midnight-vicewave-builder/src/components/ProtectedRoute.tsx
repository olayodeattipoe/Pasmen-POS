
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // You can replace this with a proper loading spinner component
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to login page but save the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user && !user.email) {
        return (
            <div className="flex h-screen items-center justify-center bg-background p-4">
                <div className="max-w-md text-center p-8 bg-card rounded-xl border border-destructive/20 shadow-lg">
                    <h2 className="text-2xl font-bold text-destructive mb-4">Access Denied</h2>
                    <p className="text-muted-foreground">
                        you do not have permission to view this software, request for accees
                    </p>
                </div>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
