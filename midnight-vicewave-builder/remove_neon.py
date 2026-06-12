import os
import re

directory = 'src'

# Aggressive replacements for any Tailwind class containing a neon color
replacements = [
    # Any text-neon-... -> text-foreground
    (r'text-neon-(cyan|pink|purple)(/\d+)?', 'text-foreground'),
    # Any bg-neon-... -> bg-muted
    (r'bg-neon-(cyan|pink|purple)(/\d+)?', 'bg-muted'),
    # Any border-neon-... -> border-border
    (r'border-[t|b|l|r]-neon-(cyan|pink|purple)(/\d+)?', 'border-border'),
    (r'border-neon-(cyan|pink|purple)(/\d+)?', 'border-border'),
    # Any ring-neon-... -> ring-foreground
    (r'ring-neon-(cyan|pink|purple)(/\d+)?', 'ring-foreground'),
    # Outline
    (r'outline-neon-(cyan|pink|purple)(/\d+)?', 'outline-foreground'),
    # Any from-neon-... -> from-muted/50
    (r'from-neon-(cyan|pink|purple)(/\d+)?', 'from-muted/50'),
    # Any to-neon-... -> to-transparent
    (r'to-neon-(cyan|pink|purple)(/\d+)?', 'to-transparent'),
    # Any shadow-neon-... -> shadow-sm
    (r'shadow-neon-(cyan|pink|purple)(/\d+)?', 'shadow-sm'),
    # Any scrollbar-thumb-neon-... -> scrollbar-thumb-muted
    (r'scrollbar-thumb-neon-(cyan|pink|purple)(/\d+)?', 'scrollbar-thumb-muted'),
    # fill and stroke
    (r'fill-neon-(cyan|pink|purple)(/\d+)?', 'fill-foreground'),
    (r'stroke-neon-(cyan|pink|purple)(/\d+)?', 'stroke-foreground'),
    # Catch stray color objects in CustomizeSite where it might be a prop like color: 'neon-cyan'
    (r"'neon-(cyan|pink|purple)'", "'foreground'"),
    (r'"neon-(cyan|pink|purple)"', '"foreground"'),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            # Apply all replacements
            for pattern, repl in replacements:
                new_content = re.sub(pattern, repl, new_content)
            
            if new_content != content:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {path}")
