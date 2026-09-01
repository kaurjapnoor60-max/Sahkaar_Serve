import re

def main():
    with open('src/data.ts', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    seen = set()
    in_hi = False
    new_lines = []
    
    for i, line in enumerate(lines):
        if 'hi: {' in line:
            in_hi = True
            seen.clear()
            new_lines.append(line)
            continue
            
        if in_hi and '},' in line and not line.strip().startswith("'"):
            # Check if this is the end of the hi block
            # Actually, let's just use a simpler heuristic or just clear at each top level language block
            pass
            
        if in_hi and line.strip().startswith('}'):
            if i + 1 < len(lines) and 'pa: {' in lines[i+1] or 'pa: {' in line:
                 in_hi = False
                 
        if in_hi:
            # Match both single and double quotes for keys
            match = re.match(r'^\s*[\'"]([^\'"]+)[\'"]:', line)
            if match:
                key = match.group(1)
                if key in seen:
                    print(f"Removed duplicate key: {key} at line {i+1}")
                    continue
                seen.add(key)
                
        new_lines.append(line)
        
    with open('src/data.ts', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
if __name__ == '__main__':
    main()
