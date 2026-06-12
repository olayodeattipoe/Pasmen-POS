import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                toast.success("Logged in successfully");
                navigate("/");
            } else {
                toast.error("Invalid credentials");
            }
        } catch (error) {
            toast.error("An error occurred during login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-black/95">
            <Card className="w-full max-w-md border-white/10 bg-black/50 backdrop-blur-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Login</CardTitle>
                    <CardDescription className="text-gray-400">
                        Enter your credentials to access the admin panel
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-200">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-200">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border-white/10 bg-white/5 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                            type="submit"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
