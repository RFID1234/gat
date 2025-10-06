#!/usr/bin/env python3
"""
Production Image Generator for GAT Sport Product Authentication
Processes Excel file with product codes and generates unique guilloche images
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import hashlib
import random
import os
import json
import sys
from matplotlib.patches import PathPatch
from pathlib import Path

def generate_guilloche(product_id, output_file, size=800):
    """Generate a unique guilloche pattern for a product ID"""
    # Hash product ID for unique seed
    seed = int(hashlib.sha256(str(product_id).encode()).hexdigest(), 16) % (2**32)
    random.seed(seed)
    
    # Exact colors from client
    colors = ['#1EF1F2', '#DC4FDD', '#F6FA31']
    
    # Unique shapes per color
    shape_types = random.sample(['arc', 'oval', 'loop', 'leaf'], 3)
    
    # Setup plot
    fig, ax = plt.subplots(figsize=(size/100, size/100), dpi=100)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Outer black circular boundary
    boundary = plt.Circle((0, 0), 1, color='black', fill=False, linewidth=2)
    ax.add_patch(boundary)
    ax.set_xlim(-1.1, 1.1)
    ax.set_ylim(-1.1, 1.1)
    
    # Create clip path
    from matplotlib.path import Path
    clip_circle = plt.Circle((0, 0), 1, visible=False, transform=ax.transData)
    clip_path = PathPatch(clip_circle.get_path(), transform=ax.transData,
                          facecolor='none', edgecolor='none', linewidth=0)
    clip_path.set_visible(False)
    ax.add_patch(clip_path)
    
    # High-res theta for smooth curves
    theta = np.linspace(0, 2 * np.pi, 10000)
    
    # Prepare JSON spec structure
    spec = {
        "product_id": str(product_id),
        "seed": seed,
        "colors": colors,
        "shape_types": list(shape_types),
        "size": size,
        "per_shape": []
    }
    
    # Draw patterns for each color
    for i, color in enumerate(colors):
        shape = shape_types[i]
        cx, cy = random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4)
        amp = random.uniform(0.05, 0.3)
        phase = random.uniform(0, 2 * np.pi)
        lobes = random.randint(2, 4)
        density = random.randint(18, 36)
        linewidth = 50.0 / density
        scale = random.uniform(0.8, 1.2)
        
        # Store per-shape params
        shape_entry = {
            "index": i,
            "color": color,
            "shape": shape,
            "center": [cx, cy],
            "amp": amp,
            "phase": phase,
            "lobes": lobes,
            "density": density,
            "scale": scale
        }
        spec["per_shape"].append(shape_entry)
        
        # Shape-specific radius modulation
        if shape == 'arc':
            r_base = 1 + amp * np.cos(theta + phase)
        elif shape == 'oval':
            a = 1.0 + random.uniform(0.1, 0.3)
            b = 1.0 - random.uniform(0.1, 0.3)
            shape_entry["oval_a"] = a
            shape_entry["oval_b"] = b
            r_base = a * b / np.sqrt((b * np.cos(theta + phase))**2 + (a * np.sin(theta + phase))**2)
        elif shape == 'loop':
            exponent = 2.5
            raw = (np.abs(np.cos((lobes / 2.0) * theta + phase)) + 0.01) ** exponent
            shape_entry["loop_exponent"] = exponent
            if raw.max() > 0:
                r_base = raw / np.max(raw)
            else:
                r_base = np.full_like(theta, 1.0)
        elif shape == 'leaf':
            r_leaf = 1.0 - np.sin(theta + phase)
            r_leaf = np.clip(r_leaf, 0.01, None)
            if r_leaf.max() > 0:
                r_base = r_leaf / np.max(r_leaf)
            else:
                r_base = np.full_like(theta, 1.0)
            shape_entry["leaf_type"] = "heart_polar_r=1-sin(theta+phase)"
        else:
            r_base = np.full_like(theta, 1.0)
        
        # Normalize and scale
        r_base = (r_base / np.max(r_base)) * scale
        
        # Plot concentric layers
        for d in np.linspace(0.001, 1, density):
            r = d * r_base
            x = r * np.cos(theta) + cx
            y = r * np.sin(theta) + cy
            lines = ax.plot(x, y, color=color, linewidth=linewidth, alpha=0.9)
            for line in lines:
                line.set_clip_path(clip_path)
    
    # Save with white background
    plt.savefig(output_file, bbox_inches='tight', pad_inches=0, transparent=False, facecolor=fig.get_facecolor())
    plt.close()
    
    # Write JSON spec
    try:
        json_path = os.path.splitext(output_file)[0] + ".json"
        with open(json_path, "w") as jf:
            json.dump(spec, jf, indent=2)
    except Exception as e:
        print(f"Warning: failed to write JSON spec for {output_file}: {e}")

def process_excel_file(excel_path, output_dir="generated_images"):
    """Process Excel file and generate images for each product code"""
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    
    try:
        # Read Excel file
        df = pd.read_excel(excel_path)
        print(f"Found {len(df)} rows in Excel file")
        
        # Assume first column contains product codes
        product_codes = df.iloc[:, 0].dropna().astype(str).tolist()
        print(f"Processing {len(product_codes)} product codes...")
        
        # Generate images
        for i, code in enumerate(product_codes):
            print(f"Generating image {i+1}/{len(product_codes)}: {code}")
            
            # Clean code for filename
            clean_code = "".join(c for c in code if c.isalnum())
            output_file = os.path.join(output_dir, f"guilloche_{clean_code}.png")
            
            try:
                generate_guilloche(product_id=code, output_file=output_file, size=800)
                print(f"✓ Generated: {output_file}")
            except Exception as e:
                print(f"✗ Failed to generate image for {code}: {e}")
        
        print(f"\nCompleted! Images saved to: {output_dir}")
        
        # Generate database insert script
        generate_db_insert_script(product_codes, output_dir)
        
    except Exception as e:
        print(f"Error processing Excel file: {e}")
        return False
    
    return True

def generate_db_insert_script(product_codes, output_dir):
    """Generate SQL insert script for the product codes"""
    
    sql_file = os.path.join(output_dir, "insert_products.sql")
    
    with open(sql_file, "w") as f:
        f.write("-- Insert product codes into database\n")
        f.write("-- Run this script after generating images\n\n")
        
        for code in product_codes:
            clean_code = "".join(c for c in code if c.isalnum())
            image_path = f"/images/guilloche_{clean_code}.png"
            
            f.write(f"INSERT INTO products (code, name, description, image_url) VALUES\n")
            f.write(f"('{code}', 'GAT Sport Product {code}', 'Authentic GAT Sport product with unique security pattern', '{image_path}')\n")
            f.write(f"ON CONFLICT (code) DO NOTHING;\n\n")
    
    print(f"Database insert script generated: {sql_file}")

if __name__ == "__main__":
    excel_file = "gat codes 5000.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"Error: Excel file '{excel_file}' not found!")
        print("Please ensure the Excel file is in the same directory as this script.")
        sys.exit(1)
    
    print("GAT Sport Product Image Generator")
    print("=" * 40)
    
    success = process_excel_file(excel_file)
    
    if success:
        print("\n✓ All images generated successfully!")
        print("\nNext steps:")
        print("1. Upload generated images to your web server")
        print("2. Run the SQL insert script to add products to database")
        print("3. Deploy your authentication website")
    else:
        print("\n✗ Image generation failed!")
        sys.exit(1)
