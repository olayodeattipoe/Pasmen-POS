import { motion } from "framer-motion";

const inventoryData = [
 { id: 1, product: "Synth Module X1", stock: 45, status: "In Stock", value: "$2,499" },
 { id: 2, product: "Neon Keyboard Pro", stock: 12, status: "Low Stock", value: "$899" },
 { id: 3, product: "Vicewave Headphones", stock: 89, status: "In Stock", value: "$349" },
 { id: 4, product: "RGB Controller", stock: 3, status: "Critical", value: "$199" },
 { id: 5, product: "Miami Mixer Deck", stock: 56, status: "In Stock", value: "$1,299" },
];

const statusColors = {
 "In Stock": "text-green-400",
 "Low Stock": "text-yellow-400",
 "Critical": "text-red-400",
};

export const InventoryTable = () => {
 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 className="glass rounded-xl p-6 border border-border transition-all duration-300"
 >
 <h3 className="text-xl font-bold mb-6 text-foreground">Current Inventory</h3>
 
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="border-b border-border">
 <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
 Product
 </th>
 <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
 Stock
 </th>
 <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
 Status
 </th>
 <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
 Value
 </th>
 </tr>
 </thead>
 <tbody>
 {inventoryData.map((item, index) => (
 <motion.tr
 key={item.id}
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.4 + index * 0.1 }}
 className="border-b border-border hover:bg-muted transition-all duration-300"
 >
 <td className="py-4 px-4 font-medium">{item.product}</td>
 <td className="py-4 px-4">{item.stock}</td>
 <td className="py-4 px-4">
 <span className={statusColors[item.status as keyof typeof statusColors]}>
 {item.status}
 </span>
 </td>
 <td className="py-4 px-4 font-semibold">{item.value}</td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>
 </motion.div>
 );
};
