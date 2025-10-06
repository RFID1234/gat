#!/usr/bin/env python3
import json, os, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODES_JSON = ROOT / 'api' / 'codes.json'
IMAGES_DIR = ROOT / 'public' / 'images'
ALL_DIR = ROOT / 'public' / 'images_all'

N = int(os.environ.get('DEV_CODES', '20'))

def main():
    if not CODES_JSON.exists():
        print('codes.json not found. Run tools/build_codes_json.py first.')
        return 1
    with open(CODES_JSON, 'r') as f:
        data = json.load(f)
    codes = list(data.keys())
    keep = set(codes[:N])

    # Move all images to images_all once
    if IMAGES_DIR.exists():
        if not ALL_DIR.exists():
            print('Moving full images directory to images_all...')
            IMAGES_DIR.rename(ALL_DIR)
        else:
            shutil.rmtree(IMAGES_DIR, ignore_errors=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Copy only needed images back
    kept = {}
    for code in keep:
        entry = data[code]
        url = entry.get('imageUrl', f'/images/guilloche_{code}.png')
        name = url.split('/')[-1]
        src = ALL_DIR / name
        dst = IMAGES_DIR / name
        if src.exists():
            shutil.copy2(src, dst)
            kept[code] = entry
        else:
            print(f'Warning: missing image for {code}: {src}')

    # Write filtered codes.json
    with open(CODES_JSON, 'w') as f:
        json.dump(kept, f, indent=2)
    print(f'Kept {len(kept)} codes/images for dev. You can set DEV_CODES to change the count.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main()) 