import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from './context/AuthContext';

export default function AuthPage() {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (username && password) {
            const success = await login(username, password);
            if (success) {
                navigate('/');
            } else {
                setError('Invalid username or password');
            }
        } else {
            setError('Please enter both username and password');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="bg-card border border-border p-8 rounded-lg shadow-lg w-full max-w-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-primary mb-2">POS Login</h1>
                    <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full h-10 px-3 py-2 rounded-md bg-input text-foreground border border-input focus:ring-2 focus:ring-ring focus:outline-none transition-all placeholder:text-muted-foreground sm:text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full h-10 px-3 py-2 rounded-md bg-input text-foreground border border-input focus:ring-2 focus:ring-ring focus:outline-none transition-all placeholder:text-muted-foreground sm:text-sm"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full font-semibold"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    <p>Protected System • Authorized Personnel Only</p>
                </div>
            </div>
        </div>
    );
}
