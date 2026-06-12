import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
 Settings, 
 Palette, 
 Layout,
 Monitor,
 Smartphone,
 Tablet,
 Save,
 Eye,
 Code,
 Wand2
} from "lucide-react";
import { motion } from "framer-motion";

interface CustomizeSiteProps {
 selectedCategory: string;
 setSelectedCategory: (category: string) => void;
 array: any[];
 setControl_array: (array: any[]) => void;
}

export default function CustomizeSite({ 
 selectedCategory, 
 setSelectedCategory, 
 array, 
 setControl_array 
}: CustomizeSiteProps) {
 const [activeTab, setActiveTab] = useState('layout');
 const [previewMode, setPreviewMode] = useState('desktop');

 const customizationOptions = [
 {
 id: 'layout',
 title: 'Layout & Structure',
 description: 'Customize page layout and component arrangement',
 icon: Layout,
 color: 'foreground'
 },
 {
 id: 'colors',
 title: 'Color Scheme',
 description: 'Modify color palette and theme settings',
 icon: Palette,
 color: 'foreground'
 },
 {
 id: 'components',
 title: 'Components',
 description: 'Add, remove, or modify UI components',
 icon: Settings,
 color: 'foreground'
 },
 {
 id: 'responsive',
 title: 'Responsive Design',
 description: 'Configure mobile and tablet layouts',
 icon: Monitor,
 color: 'foreground'
 }
 ];

 const layoutOptions = [
 { id: 'sidebar-left', name: 'Left Sidebar', description: 'Navigation on the left side' },
 { id: 'sidebar-right', name: 'Right Sidebar', description: 'Navigation on the right side' },
 { id: 'top-nav', name: 'Top Navigation', description: 'Navigation at the top' },
 { id: 'minimal', name: 'Minimal', description: 'Clean, minimal layout' }
 ];

 const colorSchemes = [
 { id: 'midnight-vicewave', name: 'Midnight Vicewave', description: 'Current dark theme with neon accents' },
 { id: 'ocean-breeze', name: 'Ocean Breeze', description: 'Light blue and teal theme' },
 { id: 'sunset-glow', name: 'Sunset Glow', description: 'Warm orange and pink theme' },
 { id: 'forest-deep', name: 'Forest Deep', description: 'Dark green and earth tones' }
 ];

 const components = [
 { id: 'header', name: 'Header', enabled: true, customizable: true },
 { id: 'sidebar', name: 'Sidebar', enabled: true, customizable: true },
 { id: 'footer', name: 'Footer', enabled: false, customizable: true },
 { id: 'breadcrumbs', name: 'Breadcrumbs', enabled: true, customizable: false },
 { id: 'search', name: 'Search Bar', enabled: true, customizable: true },
 { id: 'notifications', name: 'Notifications', enabled: true, customizable: true }
 ];

 const getPreviewIcon = (mode: string) => {
 switch (mode) {
 case 'desktop': return Monitor;
 case 'tablet': return Tablet;
 case 'mobile': return Smartphone;
 default: return Monitor;
 }
 };

 return (
 <div className="space-y-6 p-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex justify-between items-center"
 >
 <div>
 <h1 className="text-3xl font-bold text-foreground">Site Customization</h1>
 <p className="text-muted-foreground">Customize your dashboard appearance and functionality</p>
 </div>
 <div className="flex items-center space-x-4">
 <div className="flex items-center space-x-2">
 <Button
 variant={previewMode === 'desktop' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setPreviewMode('desktop')}
 >
 <Monitor className="h-4 w-4" />
 </Button>
 <Button
 variant={previewMode === 'tablet' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setPreviewMode('tablet')}
 >
 <Tablet className="h-4 w-4" />
 </Button>
 <Button
 variant={previewMode === 'mobile' ? 'default' : 'outline'}
 size="sm"
 onClick={() => setPreviewMode('mobile')}
 >
 <Smartphone className="h-4 w-4" />
 </Button>
 </div>
 <Button className="">
 <Eye className="h-4 w-4 mr-2" />
 Preview
 </Button>
 <Button className="">
 <Save className="h-4 w-4 mr-2" />
 Save Changes
 </Button>
 </div>
 </motion.div>

 {/* Customization Tabs */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Customization Options</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {customizationOptions.map((option) => {
 const Icon = option.icon;
 return (
 <Button
 key={option.id}
 variant={activeTab === option.id ? 'default' : 'outline'}
 className={`h-24 flex flex-col items-center justify-center space-y-2 ${
 activeTab === option.id ? '' : ''
 }`}
 onClick={() => setActiveTab(option.id)}
 >
 <Icon className="h-6 w-6" />
 <div className="text-center">
 <div className="font-medium">{option.title}</div>
 <div className="text-xs text-muted-foreground">{option.description}</div>
 </div>
 </Button>
 );
 })}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* Layout Customization */}
 {activeTab === 'layout' && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Layout Configuration</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {layoutOptions.map((option) => (
 <div
 key={option.id}
 className="p-4 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
 >
 <div className="font-medium">{option.name}</div>
 <div className="text-sm text-muted-foreground">{option.description}</div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* Color Scheme Customization */}
 {activeTab === 'colors' && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Color Schemes</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {colorSchemes.map((scheme) => (
 <div
 key={scheme.id}
 className="p-4 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
 >
 <div className="flex items-center justify-between">
 <div>
 <div className="font-medium">{scheme.name}</div>
 <div className="text-sm text-muted-foreground">{scheme.description}</div>
 </div>
 {scheme.id === 'midnight-vicewave' && (
 <Badge variant="default">Current</Badge>
 )}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* Component Customization */}
 {activeTab === 'components' && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Component Settings</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {components.map((component) => (
 <div
 key={component.id}
 className="flex items-center justify-between p-4 rounded-lg border border-muted bg-muted/30"
 >
 <div>
 <div className="font-medium">{component.name}</div>
 <div className="text-sm text-muted-foreground">
 {component.customizable ? 'Customizable' : 'Fixed component'}
 </div>
 </div>
 <div className="flex items-center space-x-2">
 <Badge variant={component.enabled ? 'default' : 'secondary'}>
 {component.enabled ? 'Enabled' : 'Disabled'}
 </Badge>
 {component.customizable && (
 <Button variant="outline" size="sm">
 <Settings className="h-4 w-4 mr-2" />
 Configure
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* Responsive Design */}
 {activeTab === 'responsive' && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Responsive Design Settings</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-6">
 <div>
 <h3 className="font-medium mb-4">Breakpoint Configuration</h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="p-4 rounded-lg border border-muted bg-muted/30">
 <div className="flex items-center space-x-2 mb-2">
 <Smartphone className="h-4 w-4" />
 <span className="font-medium">Mobile</span>
 </div>
 <div className="text-sm text-muted-foreground">320px - 768px</div>
 </div>
 <div className="p-4 rounded-lg border border-muted bg-muted/30">
 <div className="flex items-center space-x-2 mb-2">
 <Tablet className="h-4 w-4" />
 <span className="font-medium">Tablet</span>
 </div>
 <div className="text-sm text-muted-foreground">768px - 1024px</div>
 </div>
 <div className="p-4 rounded-lg border border-muted bg-muted/30">
 <div className="flex items-center space-x-2 mb-2">
 <Monitor className="h-4 w-4" />
 <span className="font-medium">Desktop</span>
 </div>
 <div className="text-sm text-muted-foreground">1024px+</div>
 </div>
 </div>
 </div>

 <div>
 <h3 className="font-medium mb-4">Current Preview Mode</h3>
 <div className="flex items-center space-x-4">
 <div className="flex items-center space-x-2">
 {React.createElement(getPreviewIcon(previewMode), { className: "h-5 w-5" })}
 <span className="capitalize">{previewMode}</span>
 </div>
 <Badge variant="outline">
 {previewMode === 'desktop' ? '1024px+' : 
 previewMode === 'tablet' ? '768px - 1024px' : 
 '320px - 768px'}
 </Badge>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}

 {/* Preview Section */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Live Preview</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
 <div className="flex items-center justify-center space-x-2 mb-4">
 {React.createElement(getPreviewIcon(previewMode), { className: "h-6 w-6 text-muted-foreground" })}
 <span className="text-muted-foreground">
 {previewMode === 'desktop' ? 'Desktop Preview' : 
 previewMode === 'tablet' ? 'Tablet Preview' : 
 'Mobile Preview'}
 </span>
 </div>
 <p className="text-muted-foreground mb-4">
 Your customized dashboard will appear here
 </p>
 <Button variant="outline">
 <Wand2 className="h-4 w-4 mr-2" />
 Generate Preview
 </Button>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </div>
 );
}
