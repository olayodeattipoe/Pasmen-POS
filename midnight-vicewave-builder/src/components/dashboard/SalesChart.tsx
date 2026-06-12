import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { motion } from "framer-motion";

const data = [
 { name: "Jan", sales: 4000, revenue: 2400 },
 { name: "Feb", sales: 3000, revenue: 1398 },
 { name: "Mar", sales: 2000, revenue: 9800 },
 { name: "Apr", sales: 2780, revenue: 3908 },
 { name: "May", sales: 1890, revenue: 4800 },
 { name: "Jun", sales: 2390, revenue: 3800 },
 { name: "Jul", sales: 3490, revenue: 4300 },
];

export const SalesChart = () => {
 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="glass shimmer rounded-2xl p-8 border-glow-golden card-elevated transition-smooth"
 >
 <h3 className="text-2xl font-vicewave mb-8 text-golden text-depth">Revenue Overview</h3>
 
 <ResponsiveContainer width="100%" height={300}>
 <AreaChart data={data}>
 <defs>
 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="hsl(45 85% 62%)" stopOpacity={0.3} />
 <stop offset="95%" stopColor="hsl(45 85% 62%)" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 18% / 0.3)" />
 <XAxis 
 dataKey="name" 
 stroke="hsl(40 15% 92% / 0.6)"
 style={{ fontSize: '12px', fontFamily: 'Space Grotesk' }}
 />
 <YAxis 
 stroke="hsl(40 15% 92% / 0.6)"
 style={{ fontSize: '12px', fontFamily: 'Space Grotesk' }}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "hsl(240 20% 10% / 0.95)",
 border: "1px solid hsl(45 85% 62% / 0.3)",
 borderRadius: "12px",
 color: "hsl(40 15% 92%)",
 backdropFilter: "blur(12px)",
 }}
 />
 <Area
 type="monotone"
 dataKey="revenue"
 stroke="hsl(45 85% 62%)"
 strokeWidth={3}
 fill="url(#colorRevenue)"
 filter="drop-shadow(0 0 12px hsl(45 85% 62% / 0.4))"
 />
 </AreaChart>
 </ResponsiveContainer>
 </motion.div>
 );
};
