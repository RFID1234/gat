#!/usr/bin/env python3
import os, json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / 'public' / 'images'
ALL = ROOT / 'public' / 'images_all'
CODES_JSON = ROOT / 'api' / 'codes.json'

def main():
    if ALL.exists():
        if IMAGES.exists():
            shutil.rmtree(IMAGES)
        print('Restoring full images from images_all...')
        shutil.copytree(ALL, IMAGES)
    else:
        print('images_all not found; skipping restore of images')

    if IMAGES.exists():
        mapping = {}
        for p in IMAGES.glob('guilloche_*.png'):
            name = p.name
            # extract code from guilloche_<CODE>.png
            code = name[len('guilloche_'):-len('.png')]
            mapping[code] = {
                "imageUrl": f"/images/{name}",
                "name": f"GAT Sport Product {code}",
                "description": "Authentic GAT Sport product"
            }
        CODES_JSON.parent.mkdir(parents=True, exist_ok=True)
        with open(CODES_JSON, 'w') as f:
            json.dump(mapping, f, indent=2)
        print(f'Wrote mapping for {len(mapping)} codes to {CODES_JSON}')
    else:
        print('images directory not found; cannot rebuild mapping')

if __name__ == '__main__':
    main() 