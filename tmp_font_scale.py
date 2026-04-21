import re
path = r'd:/NextJs/soft-power-food/app/landing.css'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def repl_px(m):
    val = float(m.group(1))
    new_val = round(val * 1.25, 1)
    if new_val.is_integer(): new_val = int(new_val)
    return f'font-size: {new_val}px'

def repl_clamp(m):
    c1, c2, c3 = float(m.group(1)), m.group(2), float(m.group(3))
    n1 = round(c1 * 1.25, 1)
    n3 = round(c3 * 1.25, 1)
    if n1.is_integer(): n1 = int(n1)
    if n3.is_integer(): n3 = int(n3)
    return f'font-size: clamp({n1}px, {c2}, {n3}px)'

content = re.sub(r'font-size:\s*([\d\.]+)px', repl_px, content)
content = re.sub(r'font-size:\s*clamp\(([\d\.]+)px,\s*([^,]+),\s*([\d\.]+)px\)', repl_clamp, content)

content = content.replace("font-family: 'Sarabun', var(--font-sans), sans-serif;", "font-family: var(--font-sans), 'Kanit', sans-serif;")
content = re.sub(r'font-family:\s*var\(--font-prompt\),\s*var\(--font-sans\);\s*', '', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
