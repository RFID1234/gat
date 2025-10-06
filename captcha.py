import numpy as np
import matplotlib.pyplot as plt
import hashlib
import random
from matplotlib.patches import PathPatch
import os
import json

def generate_guilloche(product_id, output_file='guilloche.png', size=800):
    # Hash product ID for unique seed
    seed = int(hashlib.sha256(str(product_id).encode()).hexdigest(), 16) % (2**32)
    random.seed(seed)
    
    # Exact colors from client
    colors = ['#1EF1F2', '#DC4FDD', '#F6FA31']
    
    # Unique shapes per color (no duplicates) — removed 'circle', added 'leaf' (heart-like)
    shape_types = random.sample(['arc', 'oval', 'loop', 'leaf'], 3)
    
    # Setup plot
    fig, ax = plt.subplots(figsize=(size/100, size/100), dpi=100)
    # Force white figure + axis background so saved image has white inside circle
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')
    ax.set_aspect('equal')
    ax.axis('off')
    
    # Outer black circular boundary
    boundary = plt.Circle((0, 0), 1, color='black', fill=False, linewidth=2)
    ax.add_patch(boundary)
    ax.set_xlim(-1.1, 1.1)
    ax.set_ylim(-1.1, 1.1)
    
    # Create clip path as PathPatch — make it invisible (no fill / no edge)
    from matplotlib.path import Path
    # create a circle patch for clipping but DO NOT draw a filled patch
    clip_circle = plt.Circle((0, 0), 1, visible=False, transform=ax.transData)
    # create a PathPatch but explicitly set no face/edge so it won't draw
    clip_path = PathPatch(clip_circle.get_path(), transform=ax.transData,
                          facecolor='none', edgecolor='none', linewidth=0)
    clip_path.set_visible(False)   # extra safeguard: make it invisible
    ax.add_patch(clip_path)  # Add to axes for clipping reference
    
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
        # Random offset center within boundary
        cx, cy = random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.4)
        # Shared params for uniqueness and coverage
        amp = random.uniform(0.05, 0.3)  # Modulation amplitude
        phase = random.uniform(0, 2 * np.pi)  # Phase shift
        lobes = random.randint(2, 4)  # Lobe count where applicable
        # fewer concentric steps -> larger visible gaps for print
        density = random.randint(18, 36)  # was 60..100, now 18..36
        linewidth = 50.0 / density
        scale = random.uniform(0.8, 1.2)  # Overall scaling for coverage
        
        # Store per-shape params into spec
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
        
        # Shape-specific radius modulation (removed 'circle', added 'leaf' as heart-like)
        if shape == 'arc':
            r_base = 1 + amp * np.cos(theta + phase)  # Arc-like bulges
        elif shape == 'oval':
            a = 1.0 + random.uniform(0.1, 0.3)
            b = 1.0 - random.uniform(0.1, 0.3)
            # also store a,b in spec
            shape_entry["oval_a"] = a
            shape_entry["oval_b"] = b
            r_base = a * b / np.sqrt((b * np.cos(theta + phase))**2 + (a * np.sin(theta + phase))**2)  # Elliptic
        elif shape == 'loop':
            # Slimmer "infinity" lobes: sharpen peaks by raising abs(cos) to power >1,
            # add a tiny floor so inner rings exist, then normalize.
            exponent = 2.5
            raw = (np.abs(np.cos((lobes / 2.0) * theta + phase)) + 0.01) ** exponent
            # store exponent for debug
            shape_entry["loop_exponent"] = exponent
            if raw.max() > 0:
                r_base = raw / np.max(raw)
            else:
                r_base = np.full_like(theta, 1.0)
        elif shape == 'leaf':
            # Heart-like polar curve: r = 1 - sin(theta + phase)
            # shift & clip to keep positive, then normalize
            r_leaf = 1.0 - np.sin(theta + phase)
            # small floor to ensure inner rings exist
            r_leaf = np.clip(r_leaf, 0.01, None)
            # normalize
            if r_leaf.max() > 0:
                r_base = r_leaf / np.max(r_leaf)
            else:
                r_base = np.full_like(theta, 1.0)
            # record that this is the heart-like leaf
            shape_entry["leaf_type"] = "heart_polar_r=1-sin(theta+phase)"
        else:
            r_base = np.full_like(theta, 1.0)
        
        # Normalize and scale for coverage
        r_base = (r_base / np.max(r_base)) * scale
        
        # Plot concentric layers for guilloche effect, starting near center
        for d in np.linspace(0.001, 1, density):  # Start very close to center to fill it
            r = d * r_base
            x = r * np.cos(theta) + cx
            y = r * np.sin(theta) + cy
            # Thicker strokes for print-readability
            lines = ax.plot(x, y, color=color, linewidth=linewidth, alpha=0.9)
            # Clip each line to the clip_path (clip patch is invisible)
            for line in lines:
                line.set_clip_path(clip_path)
    
    # Save with a white background (transparent=False ensures white inside circle)
    plt.savefig(output_file, bbox_inches='tight', pad_inches=0, transparent=False, facecolor=fig.get_facecolor())
    plt.close()
    
    # Write JSON spec next to the output file
    try:
        json_path = os.path.splitext(output_file)[0] + ".json"
        with open(json_path, "w") as jf:
            json.dump(spec, jf, indent=2)
    except Exception as e:
        print("Warning: failed to write JSON spec:", e)

def batch_generate(count=8, size=800):
    # Save into "patterns" folder next to the script (or cwd if __file__ not defined)
    if "__file__" in globals():
        base_dir = os.path.dirname(os.path.abspath(__file__))
    else:
        base_dir = os.getcwd()
    out_dir = os.path.join(base_dir, "patterns3")
    os.makedirs(out_dir, exist_ok=True)
    
    for i in range(count):
        # create a deterministic-ish product id per image (you can change prefix)
        pid = f"PATTERN_{i+1}"
        out_file = os.path.join(out_dir, f"guilloche_{pid}.png")
        print("Generating:", out_file)
        generate_guilloche(product_id=pid, output_file=out_file, size=size)
    print("Done — images written to:", out_dir)

if __name__ == "__main__":
    # Change the number here if you want more/less images
    N_IMAGES = 8
    batch_generate(count=N_IMAGES, size=800)