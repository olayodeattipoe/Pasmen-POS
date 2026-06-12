import re

with open("src/components/pages/ProductionPage.tsx", "r") as f:
    content = f.read()

# Replace colorful theming with black/white/border/muted
colors_to_replace = [
    (r'text-indigo-400', 'text-foreground'),
    (r'bg-indigo-500/20', 'bg-muted'),
    (r'bg-indigo-500/10', 'bg-muted/50'),
    (r'bg-indigo-500/30', 'bg-muted'),
    (r'border-indigo-500/20', 'border-border'),
    (r'border-indigo-500/30', 'border-border'),
    (r'border-indigo-500/50', 'border-border'),
    (r'border-indigo-500', 'border-border'),
    (r'text-indigo-500', 'text-foreground'),
    (r'bg-indigo-600', 'bg-foreground text-background'),
    (r'hover:bg-indigo-700', 'hover:bg-foreground/90'),
    (r'text-gradient-golden', 'text-foreground'),
    (r'border-l-indigo-500', 'border-l-foreground'),
    (r'ring-indigo-500', 'ring-foreground'),
    (r'text-amber-500', 'text-muted-foreground'),
    (r'border-amber-500/30', 'border-border'),
    (r'bg-amber-500/10', 'bg-muted'),
    (r'hover:bg-amber-500/10', 'hover:bg-muted'),
    (r'hover:text-amber-400', 'hover:text-foreground'),
    (r'bg-emerald-500/20', 'bg-muted'),
    (r'text-emerald-400', 'text-foreground'),
    (r'text-emerald-500', 'text-foreground'),
    (r'bg-emerald-600', 'bg-primary text-primary-foreground'),
    (r'hover:bg-emerald-700', 'hover:bg-primary/90'),
    (r'text-red-400', 'text-destructive'),
    (r'bg-red-400/10', 'bg-destructive/10'),
    (r'hover:bg-red-400/10', 'hover:bg-destructive/10'),
]

for pattern, replacement in colors_to_replace:
    content = re.sub(pattern, replacement, content)

# Add pagination state
state_declarations = """    const [currentLogsLoading, setCurrentLogsLoading] = useState(false);

    // Pagination states
    const [batchPage, setBatchPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [globalLogPage, setGlobalLogPage] = useState(1);
    const ITEMS_PER_PAGE = 10;"""

content = content.replace("    const [currentLogsLoading, setCurrentLogsLoading] = useState(false);", state_declarations)

# Update batches rendering
current_batches_code = """                                ) : (
                                    filteredBatches.map(batch => ("""

paginated_batches_code = """                                ) : (
                                    filteredBatches.slice((batchPage - 1) * ITEMS_PER_PAGE, batchPage * ITEMS_PER_PAGE).map(batch => ("""

content = content.replace(current_batches_code, paginated_batches_code)

batches_pagination_ui = """                                            </Card>
                                        ))
                                    )}
                                </div>"""

batches_pagination_replacement = """                                            </Card>
                                        ))
                                    )}
                                    {filteredBatches.length > 0 && (
                                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                                            <div className="text-xs text-muted-foreground border-border">
                                                Showing {filteredBatches.slice((batchPage - 1) * ITEMS_PER_PAGE, batchPage * ITEMS_PER_PAGE).length} of {filteredBatches.length}
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" onClick={() => setBatchPage(p => Math.max(1, p - 1))} disabled={batchPage === 1} className="h-7 text-xs border-border">Prev</Button>
                                                <div className="flex items-center px-2 bg-muted rounded text-xs">
                                                    {batchPage} / {Math.ceil(filteredBatches.length / ITEMS_PER_PAGE) || 1}
                                                </div>
                                                <Button variant="outline" size="sm" onClick={() => setBatchPage(p => p + 1)} disabled={batchPage * ITEMS_PER_PAGE >= filteredBatches.length} className="h-7 text-xs border-border">Next</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>"""

content = content.replace(batches_pagination_ui, batches_pagination_replacement)

# Update History rendering
current_history_code = """                                                                 ) : (
                                                                    currentBatchLogs.map(log => ("""

paginated_history_code = """                                                                 ) : (
                                                                    currentBatchLogs.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE).map(log => ("""

content = content.replace(current_history_code, paginated_history_code)

history_pagination_ui = """                                                                        </TableRow>
                                                                    ))
                                                                )}
                                                            </TableBody>
                                                        </Table>"""

history_pagination_replacement = """                                                                        </TableRow>
                                                                    ))
                                                                )}
                                                            </TableBody>
                                                        </Table>
                                                        {currentBatchLogs.length > 0 && (
                                                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                                                                <div className="text-sm text-muted-foreground border-border">
                                                                    Showing {currentBatchLogs.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE).length} of {currentBatchLogs.length} entries
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="border-border">Previous</Button>
                                                                    <div className="flex items-center px-4 bg-muted rounded text-sm font-medium border-border">
                                                                        Page {historyPage} of {Math.ceil(currentBatchLogs.length / ITEMS_PER_PAGE) || 1}
                                                                    </div>
                                                                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => p + 1)} disabled={historyPage * ITEMS_PER_PAGE >= currentBatchLogs.length} className="border-border">Next</Button>
                                                                </div>
                                                            </div>
                                                        )}"""

content = content.replace(history_pagination_ui, history_pagination_replacement)


# Update Global Log rendering
current_global_code = """                                        ) : (
                                            batchLogs.map(log => ("""

paginated_global_code = """                                        ) : (
                                            batchLogs.slice((globalLogPage - 1) * ITEMS_PER_PAGE, globalLogPage * ITEMS_PER_PAGE).map(log => ("""

content = content.replace(current_global_code, paginated_global_code)

global_pagination_ui = """                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>"""

global_pagination_replacement = """                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                {batchLogs.length > 0 && (
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                                        <div className="text-sm text-muted-foreground border-border">
                                            Showing {batchLogs.slice((globalLogPage - 1) * ITEMS_PER_PAGE, globalLogPage * ITEMS_PER_PAGE).length} of {batchLogs.length} entries
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setGlobalLogPage(p => Math.max(1, p - 1))} disabled={globalLogPage === 1} className="border-border">Previous</Button>
                                            <div className="flex items-center px-4 bg-muted rounded text-sm font-medium border-border">
                                                Page {globalLogPage} of {Math.ceil(batchLogs.length / ITEMS_PER_PAGE) || 1}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setGlobalLogPage(p => p + 1)} disabled={globalLogPage * ITEMS_PER_PAGE >= batchLogs.length} className="border-border">Next</Button>
                                        </div>
                                    </div>
                                )}"""

content = content.replace(global_pagination_ui, global_pagination_replacement)

# Reset pagination when searching global logs
global_search_reset = """                                        <Input
                                            placeholder="Search logs by batch name..."
                                            value={logSearch}
                                            onChange={(e) => setLogSearch(e.target.value)}"""

global_search_reset_replacement = """                                        <Input
                                            placeholder="Search logs by batch name..."
                                            value={logSearch}
                                            onChange={(e) => {
                                                setLogSearch(e.target.value);
                                                setGlobalLogPage(1);
                                            }}"""

content = content.replace(global_search_reset, global_search_reset_replacement)

filters_clear_reset = """                                        onClick={() => {
                                            setLogSearch('');
                                            setLogStartDate('');
                                            setLogEndDate('');
                                        }}"""

filters_clear_reset_replacement = """                                        onClick={() => {
                                            setLogSearch('');
                                            setLogStartDate('');
                                            setLogEndDate('');
                                            setGlobalLogPage(1);
                                        }}"""

content = content.replace(filters_clear_reset, filters_clear_reset_replacement)

# Additional UI simplification changes
content = content.replace('bg-indigo-500/20 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/30', 'bg-foreground text-background hover:bg-foreground/90 border border-border shadow-lg')
content = content.replace('bg-indigo-600 text-white hover:bg-indigo-700 w-full', 'bg-foreground text-background hover:bg-foreground/90 w-full')

with open("src/components/pages/ProductionPage.tsx", "w") as f:
    f.write(content)

