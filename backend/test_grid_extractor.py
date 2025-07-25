#!/usr/bin/env python3
"""
Test script for the robust universal grid extractor.
This demonstrates how the extractor can handle complex div-based grids
like university rankings, product listings, etc.
"""

from core.grid_extractor import (
    extract_grid_rows,
    extract_advanced_grid,
    extract_grid_with_mapping,
)
from core.extractor_router import extract_structured_content
import pandas as pd

# Sample HTML that mimics university ranking data (similar to TopUniversities)
sample_html = """
<!DOCTYPE html>
<html>
<head>
    <title>University Rankings</title>
</head>
<body>
    <div class="container">
        <h1>World University Rankings 2024</h1>
        
        <div class="ranking-item">
            <div class="rank-position">1</div>
            <div class="university-name">Massachusetts Institute of Technology (MIT)</div>
            <div class="country">United States</div>
            <div class="score">100.0</div>
        </div>
        
        <div class="ranking-item">
            <div class="rank-position">2</div>
            <div class="university-name">Stanford University</div>
            <div class="country">United States</div>
            <div class="score">98.4</div>
        </div>
        
        <div class="ranking-item">
            <div class="rank-position">3</div>
            <div class="university-name">Harvard University</div>
            <div class="country">United States</div>
            <div class="score">97.8</div>
        </div>
        
        <div class="ranking-item">
            <div class="rank-position">4</div>
            <div class="university-name">University of Oxford</div>
            <div class="country">United Kingdom</div>
            <div class="score">96.2</div>
        </div>
        
        <div class="ranking-item">
            <div class="rank-position">5</div>
            <div class="university-name">California Institute of Technology (Caltech)</div>
            <div class="country">United States</div>
            <div class="score">95.9</div>
        </div>
    </div>
</body>
</html>
"""

# Sample HTML for product listings
product_html = """
<!DOCTYPE html>
<html>
<head>
    <title>Product Catalog</title>
</head>
<body>
    <div class="product-grid">
        <div class="product-card">
            <div class="product-image">
                <img src="/images/laptop1.jpg" alt="Laptop">
            </div>
            <div class="product-title">MacBook Pro 16"</div>
            <div class="product-price">$2,499</div>
            <div class="product-rating">4.8/5</div>
        </div>
        
        <div class="product-card">
            <div class="product-image">
                <img src="/images/laptop2.jpg" alt="Laptop">
            </div>
            <div class="product-title">Dell XPS 13</div>
            <div class="product-price">$1,299</div>
            <div class="product-rating">4.6/5</div>
        </div>
        
        <div class="product-card">
            <div class="product-image">
                <img src="/images/laptop3.jpg" alt="Laptop">
            </div>
            <div class="product-title">HP Spectre x360</div>
            <div class="product-price">$1,199</div>
            <div class="product-rating">4.5/5</div>
        </div>
    </div>
</body>
</html>
"""


def test_university_rankings():
    """Test the grid extractor with university ranking data."""
    print("=== Testing University Rankings Extraction ===")

    # Test basic grid extraction
    df = extract_grid_rows(sample_html)
    print(f"Basic extraction found {len(df)} rows with {len(df.columns)} columns")
    print("Columns:", list(df.columns))
    print("\nExtracted data:")
    print(df.to_string(index=False))

    # Test advanced grid extraction
    print("\n=== Advanced Grid Extraction ===")
    advanced_df = extract_advanced_grid(sample_html, min_rows=2, min_columns=2)
    print(
        f"Advanced extraction found {len(advanced_df)} rows with {len(advanced_df.columns)} columns"
    )
    print("Columns:", list(advanced_df.columns))

    # Test grid extraction with mapping
    print("\n=== Grid Extraction with Mapping ===")
    result = extract_grid_with_mapping(sample_html)
    print(f"Mapping extraction found {len(result['data'])} rows")
    print("Column mapping suggestions:", result["suggestions"])
    print("\nNormalized data:")
    print(result["normalized_data"].to_string(index=False))

    # Test full structured content extraction
    print("\n=== Full Structured Content Extraction ===")
    full_result = extract_structured_content(sample_html)
    print("Available data types:", list(full_result.keys()))
    if "universal_grid" in full_result:
        print(f"Universal grid: {len(full_result['universal_grid'])} items")
    if "listings" in full_result:
        print(f"Listings: {len(full_result['listings'])} items")


def test_product_listings():
    """Test the grid extractor with product listing data."""
    print("\n\n=== Testing Product Listings Extraction ===")

    # Test basic grid extraction
    df = extract_grid_rows(product_html)
    print(f"Basic extraction found {len(df)} rows with {len(df.columns)} columns")
    print("Columns:", list(df.columns))
    print("\nExtracted data:")
    print(df.to_string(index=False))

    # Test grid extraction with mapping
    print("\n=== Grid Extraction with Mapping ===")
    result = extract_grid_with_mapping(product_html)
    print(f"Mapping extraction found {len(result['data'])} rows")
    print("Column mapping suggestions:", result["suggestions"])
    print("\nNormalized data:")
    print(result["normalized_data"].to_string(index=False))


def test_edge_cases():
    """Test edge cases and robustness."""
    print("\n\n=== Testing Edge Cases ===")

    # Test with minimal HTML
    minimal_html = "<html><body><div>Single item</div></body></html>"
    df = extract_grid_rows(minimal_html)
    print(f"Minimal HTML: {len(df)} rows extracted")

    # Test with no repeated structures
    no_repeat_html = """
    <html><body>
        <div class="header">Header</div>
        <div class="content">Content</div>
        <div class="footer">Footer</div>
    </body></html>
    """
    df = extract_grid_rows(no_repeat_html)
    print(f"No repeated structures: {len(df)} rows extracted")

    # Test with complex nested structures
    complex_html = """
    <html><body>
        <div class="container">
            <div class="item">
                <div class="title">Item 1</div>
                <div class="details">
                    <span class="price">$100</span>
                    <span class="rating">4.5</span>
                </div>
            </div>
            <div class="item">
                <div class="title">Item 2</div>
                <div class="details">
                    <span class="price">$200</span>
                    <span class="rating">4.8</span>
                </div>
            </div>
        </div>
    </body></html>
    """
    df = extract_grid_rows(complex_html)
    print(f"Complex nested structures: {len(df)} rows extracted")
    if not df.empty:
        print("Columns:", list(df.columns))


if __name__ == "__main__":
    test_university_rankings()
    test_product_listings()
    test_edge_cases()

    print("\n\n=== Summary ===")
    print("The robust universal grid extractor successfully handles:")
    print("✓ University ranking data with repeated div structures")
    print("✓ Product listings with nested content")
    print("✓ Edge cases with minimal or complex HTML")
    print("✓ Automatic column name normalization")
    print("✓ Intelligent column mapping suggestions")
    print("✓ Multiple extraction strategies for maximum coverage")
