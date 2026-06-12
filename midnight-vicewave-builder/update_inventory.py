import re
import os

print("Updating src/components/pages/InventoryPage.tsx...")
path = "src/components/pages/InventoryPage.tsx"

with open(path, "r", encoding='utf-8') as f:
    text = f.read()

# 1. CategoryTab
text = re.sub(
    r"function CategoryTab\(\{ title, percentage \}: \{ title: string; percentage: number \}\) \{",
    r"function CategoryTab({ title, percentage, showPercentage = true }: { title: string; percentage: number; showPercentage?: boolean }) {",
    text
)
text = re.sub(
    r"(<span className=\"inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium\">\s*\{percentage\}%\s*</span>)",
    r"{showPercentage && \1}",
    text
)

# 2. ItemCard signature
text = re.sub(
    r"isSelected: boolean;\n\}\) \{",
    r"isSelected: boolean;\n  showStockInfo?: boolean;\n}) {",
    text
)

text = re.sub(
    r"(<CapacityIndicator percentage=\{percentage\} />\s*</div>)",
    r"{showStockInfo !== false && <CapacityIndicator percentage={percentage} />}\n        </div>",
    text
)

text = re.sub(
    r"(<div className=\"bg-gradient-to-r from-muted/60 to-muted/40 px-3 py-1.5 rounded-lg border border-border/40\">\s*<span className=\"text-sm font-bold text-foreground\">\{percentage\}%</span>\s*</div>)",
    r"{showStockInfo !== false ? \1 : <div></div>}",
    text
)

# 3. CategoryTab usage
text = re.sub(
    r"(<CategoryTab\s*title=\{category\.title\}\s*percentage=\{tabData\[category\.id\]\.percentage\}\s*/>)",
    r"<CategoryTab\n                            title={category.title}\n                            percentage={tabData[category.id].percentage}\n                            showPercentage={category.id === 'rawitems'}\n                          />",
    text
)

# 4. ItemCard usage
text = re.sub(
    r"(isSelected=\{selectedItem\?\.id === item\.id\}\s*/>)",
    r"isSelected={selectedItem?.id === item.id}\n                      showStockInfo={category.id === 'rawitems'}\n                    />",
    text
)

# 5. Stock Metrics card block
old_metrics = r"""<Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent">\s*<CardContent className="p-5 flex flex-col justify-center h-full">\s*<p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Current Stock</p>\s*<div className="flex items-end gap-3">\s*<span className="text-4xl font-bold font-vicewave text-foreground leading-none">\s*\{selectedItem\.itemType === 'rawitems' \|\| selectedItem\.quantity_in_stock !== undefined\s*\?\s*selectedItem\.quantity_in_stock \|\| 0\s*:\s*selectedItem\.self_quantity_in_stock \|\| 0\}\s*</span>\s*<div className="pb-1"><CapacityIndicator percentage=\{selectedItem\.percentage\} /></div>\s*</div>\s*</CardContent>\s*</Card>\s*\{selectedItem\.itemType === 'rawitems' \? \(\s*<Card className="glass border-border/50">\s*<CardContent className="p-5 flex flex-col justify-center h-full">\s*<p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Reorder Level</p>\s*<p className="text-3xl font-bold font-vicewave leading-none">\{selectedItem\.reorder_level \|\| 0\}</p>\s*<p className="text-xs text-muted-foreground mt-2 uppercase">\{selectedItem\.unit \|\| 'PIECES'\}</p>\s*</CardContent>\s*</Card>\s*\) : \(\s*<Card className="glass border-border/50">\s*<CardContent className="p-5 flex flex-col justify-center h-full">\s*<p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Required Qty</p>\s*<p className="text-3xl font-bold font-vicewave leading-none">\{selectedItem\.self_required_quantity \|\| 0\}</p>\s*</CardContent>\s*</Card>\s*\)\}"""

new_metrics = r"""{selectedItem.itemType === 'rawitems' && (
            <>
              <Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent">
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Current Stock</p>
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold font-vicewave text-foreground leading-none">
                      {selectedItem.quantity_in_stock || 0}
                    </span>
                    <div className="pb-1"><CapacityIndicator percentage={selectedItem.percentage} /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-border/50">
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Reorder Level</p>
                  <p className="text-3xl font-bold font-vicewave leading-none">{selectedItem.reorder_level || 0}</p>
                  <p className="text-xs text-muted-foreground mt-2 uppercase">{selectedItem.unit || 'PIECES'}</p>
                </CardContent>
              </Card>
            </>
          )}"""

text = re.sub(old_metrics, new_metrics, text)

# 6. Quick Actions
old_actions = r"""<Button\s*onClick=\{([^}]+)\}\s*className="bg-\[#00d9ff\] text-black hover:bg-\[#00c4e6\] font-bold shadow-lg shadow-\[#00d9ff\]/20"\s*>\s*<Plus className="w-4 h-4 mr-2" /> Adjust Stock\s*</Button>\s*<Button variant=\{editingInventory \? "secondary" : "outline"\} onClick=\{handleStartEditInventory\} className="border-border hover:bg-muted group">\s*<Edit className="w-4 h-4 mr-2 group-hover:text-foreground transition-colors" /> \{editingInventory \? 'Cancel Edit' : 'Edit Constraints'\}\s*</Button>"""

new_actions = r"""{selectedItem.itemType === 'rawitems' && (
              <>
                <Button
                  onClick={\1}
                  className="bg-[#00d9ff] text-black hover:bg-[#00c4e6] font-bold shadow-lg shadow-[#00d9ff]/20"
                >
                  <Plus className="w-4 h-4 mr-2" /> Adjust Stock
                </Button>
                <Button variant={editingInventory ? "secondary" : "outline"} onClick={handleStartEditInventory} className="border-border hover:bg-muted group">
                  <Edit className="w-4 h-4 mr-2 group-hover:text-foreground transition-colors" /> {editingInventory ? 'Cancel Edit' : 'Edit Constraints'}
                </Button>
              </>
            )}"""

text = re.sub(old_actions, new_actions, text)

# 7. Ledger
text = re.sub(
    r"\{\/\* ROW 4: Full-width Stock Ledger \*\/\}\s*<motion\.div initial=\{\{ opacity: 0, y: 20 \}\} animate=\{\{ opacity: 1, y: 0 \}\} transition=\{\{ delay: 0\.4 \}\} className=\"space-y-4\">",
    r"{/* ROW 4: Full-width Stock Ledger */}\n        {selectedItem.itemType === 'rawitems' && (\n        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className=\"space-y-4\">",
    text
)

text = re.sub(
    r"(</Table>\s*</div>\s*</CardContent>\s*</Card>\s*</motion\.div>\s*)</div>\s*\)}",
    r"\1  )}\n        </div>\n      )}",
    text
)

with open(path, "w", encoding='utf-8') as f:
    f.write(text)

print("Done replacing.")
