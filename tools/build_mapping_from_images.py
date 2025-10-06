#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMAGES_DIR = ROOT / 'public' / 'images'
IMAGES_ALL_DIR = ROOT / 'public' / 'images_all'
PUBLIC_CODES = ROOT / 'public' / 'api' / 'codes.json'
API_CODES = ROOT / 'api' / 'codes.json'


def choose_source_dir():
    cand = []
    if IMAGES_DIR.exists():
        cand.append((sum(1 for _ in IMAGES_DIR.glob('guilloche_*.png')), IMAGES_DIR))
    if IMAGES_ALL_DIR.exists():
        cand.append((sum(1 for _ in IMAGES_ALL_DIR.glob('guilloche_*.png')), IMAGES_ALL_DIR))
    if not cand:
        return None
    cand.sort(reverse=True)
    return cand[0][1]


def main():
    src = choose_source_dir()
    if not src:
        print('No images found in public/images or public/images_all')
        return 1

    base_url = '/images_all' if src.name == 'images_all' else '/images'

    mapping = {}
    for p in src.glob('guilloche_*.png'):
        name = p.name
        code = name[len('guilloche_'):-len('.png')]
        mapping[code] = {
            'imageUrl': f'{base_url}/{name}',
            'name': f'GAT Sport Product {code}',
            'description': 'Authentic GAT Sport product'
        }

    PUBLIC_CODES.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_CODES.write_text(json.dumps(mapping, indent=2))
    API_CODES.parent.mkdir(parents=True, exist_ok=True)
    API_CODES.write_text(json.dumps(mapping, indent=2))

    print(f'Wrote {len(mapping)} codes to {PUBLIC_CODES} and {API_CODES}')
    print(f'Source directory: {src} (base URL {base_url})')
    return 0


if __name__ == '__main__':
    raise SystemExit(main()) 