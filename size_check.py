
import os
import sys

files = [
    r'src/app/dashboard/individual/messaging/page.tsx',
    r'src/app/dashboard/individual/new-application/page.tsx',
    r'src/app/dashboard/individual/profile/page.tsx',
    r'src/app/dashboard/individual/settings/page.tsx'
]

for file_path in files:
    full_path = os.path.join(r'c:\Docufieds\docufieds', file_path)
    if not os.path.exists(full_path):
        print(f'File not found: {full_path}')
        continue
        
    print(f'Checking {file_path}...')
    try:
        with open(full_path, 'rb') as f:
            content = f.read()
            found_issue = False
            for i, byte in enumerate(content):
                # Check for non-ascii or control chars (except newline/tab/return)
                if byte > 127 or (byte < 32 and byte not in [9, 10, 13]):
                    print(f'  Found byte {byte} ({hex(byte)}) at position {i}')
                    # Context
                    start = max(0, i - 10)
                    end = min(len(content), i + 10)
                    print(f'  Context: {content[start:end]}')
                    found_issue = True
                    break # Just show first one per file
            if not found_issue:
                print(f'  No suspicious bytes found.')
    except Exception as e:
        print(f'  Error: {e}')
