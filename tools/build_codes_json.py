#!/usr/bin/env python3
"""
Build codes.json and images from the Excel file for static+serverless hosting.
- Reads: "gat codes 5000.xlsx"
- Writes: public/images/guilloche_<CODE>.png and api/codes.json
Requires: pandas, matplotlib, numpy
"""
import os, sys, json
from pathlib import Path
import pandas as pd

# Import the guilloche generator from captcha.py
import importlib.util

def load_captcha_generator():
    here = Path(__file__).resolve().parents[1]
    captcha_path = here / 'captcha.py'
    spec = importlib.util.spec_from_file_location('captcha', str(captcha_path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.generate_guilloche

def main():
    root = Path(__file__).resolve().parents[1]
    excel_file = root / 'gat codes 5000.xlsx'
    public_images = root / 'public' / 'images'
    api_dir = root / 'api'
    codes_json_path = api_dir / 'codes.json'

    if not excel_file.exists():
        print(f"Error: Excel file not found: {excel_file}")
        sys.exit(1)

    public_images.mkdir(parents=True, exist_ok=True)
    api_dir.mkdir(parents=True, exist_ok=True)

    print(f"Reading Excel: {excel_file}")
    df = pd.read_excel(str(excel_file))
    codes = df.iloc[:,0].dropna().astype(str).str.strip().tolist()
    print(f"Found {len(codes)} codes")

    generate_guilloche = load_captcha_generator()

    mapping = {}
    for i, code in enumerate(codes):
        clean_code = ''.join(c for c in code if c.isalnum())
        out_file = public_images / f"guilloche_{clean_code}.png"
        try:
            print(f"[{i+1}/{len(codes)}] Generating image for {code} -> {out_file.name}")
            generate_guilloche(product_id=code, output_file=str(out_file), size=800)
            mapping[code] = {
                "imageUrl": f"/images/{out_file.name}",
                "name": f"GAT Sport Product {code}",
                "description": "Authentic GAT Sport product"
            }
        except Exception as e:
            print(f"Failed to generate for {code}: {e}")

    print(f"Writing codes mapping: {codes_json_path}")
    with open(codes_json_path, 'w') as f:
        json.dump(mapping, f, indent=2)

    print("Done.")

if __name__ == '__main__':
    main() 