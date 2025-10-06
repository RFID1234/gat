#!/usr/bin/env python3
"""
Convert Excel file to CSV format for GCP generator
"""

import pandas as pd
import sys
import os

def convert_excel_to_csv(excel_file, output_file=None):
    """Convert Excel file to CSV format"""
    
    if not os.path.exists(excel_file):
        print(f"Error: Excel file '{excel_file}' not found!")
        return False
    
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        print(f"Found {len(df)} rows in Excel file")
        print(f"Columns: {list(df.columns)}")
        
        # Assume first column contains product codes
        # Rename to 'product_code' for consistency
        first_column = df.columns[0]
        df = df.rename(columns={first_column: 'product_code'})
        
        # Clean product codes
        df['product_code'] = df['product_code'].astype(str).str.strip()
        
        # Remove empty rows
        df = df.dropna(subset=['product_code'])
        df = df[df['product_code'] != '']
        
        # Set output filename
        if output_file is None:
            output_file = os.path.splitext(excel_file)[0] + '.csv'
        
        # Save as CSV
        df.to_csv(output_file, index=False)
        print(f"✓ Converted to CSV: {output_file}")
        print(f"✓ {len(df)} product codes ready for processing")
        
        return True
        
    except Exception as e:
        print(f"Error converting Excel file: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_excel_to_csv.py <excel_file> [output_file]")
        sys.exit(1)
    
    excel_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = convert_excel_to_csv(excel_file, output_file)
    
    if success:
        print("\n✓ Excel to CSV conversion complete!")
        print("\nNext steps:")
        print("1. Review the generated CSV file")
        print("2. Run the GCP generator: python generator_prod.py product_codes.csv")
    else:
        print("\n✗ Conversion failed!")
        sys.exit(1)
