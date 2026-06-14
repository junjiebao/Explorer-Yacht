#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generate a professional cover image for 探险游艇——游艇行业新宠儿
Original artwork - no copyright issues.
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageColor
import math, os

# ============================================================
# CONFIG
# ============================================================
OUTPUT_PATH = r"d:\GitHub works\Explorer-Yacht\output\cover.jpg"
WIDTH = 1600
HEIGHT = 2560  # 1:1.6 ratio (standard book cover)
BOOK_TITLE = "探险游艇"
BOOK_SUBTITLE = "游艇行业新宠儿"
AUTHOR_NAME = "Joey 鲍俊杰"
AUTHOR_TAGLINE = "——首本中文探险游艇全景指南——"

# Font paths (Windows 11)
FONT_TITLE = r"C:\Windows\Fonts\simhei.ttf"      # 黑体 - bold, modern
FONT_SERIF = r"C:\Windows\Fonts\NotoSerifSC-VF.ttf"  # Noto Serif SC - elegant
FONT_SANS = r"C:\Windows\Fonts\NotoSansSC-VF.ttf"    # Noto Sans SC
FONT_EN = r"C:\Windows\Fonts\simhei.ttf"


def create_gradient_background(width, height, color_top, color_bottom):
    """Create a vertical gradient background"""
    base = Image.new('RGB', (width, height), color_top)
    top = Image.new('RGB', (width, height), color_top)
    bottom = Image.new('RGB', (width, height), color_bottom)

    mask = Image.new('L', (width, height))
    for y in range(height):
        intensity = int(255 * (y / height))
        for x in range(width):
            mask.putpixel((x, y), intensity)

    # Blend: 0% top at top, 100% bottom at bottom
    result = Image.composite(bottom, top, mask)
    return result


def draw_waves(draw, width, height):
    """Draw subtle decorative wave lines"""
    wave_color = (255, 255, 255, 25)  # Very subtle white

    for wave_y_base in range(int(height * 0.55), int(height * 0.85), int(height * 0.06)):
        points = []
        amplitude = 8 + (wave_y_base % 30)
        frequency = 0.008
        for x in range(0, width + 1, 4):
            y = wave_y_base + int(amplitude * math.sin(frequency * x + wave_y_base * 0.01))
            points.append((x, y))
        if len(points) >= 2:
            for i in range(len(points) - 1):
                draw.line([points[i], points[i+1]], fill=wave_color, width=1)


def draw_compass(draw, cx, cy, size, alpha):
    """Draw a decorative compass rose"""
    color = (255, 255, 255, alpha)
    # Four main directions
    draw.line([(cx, cy - size), (cx, cy + size)], fill=color, width=2)
    draw.line([(cx - size, cy), (cx + size, cy)], fill=color, width=2)
    # Diagonals
    d = int(size * 0.7)
    draw.line([(cx - d, cy - d), (cx + d, cy + d)], fill=color, width=1)
    draw.line([(cx + d, cy - d), (cx - d, cy + d)], fill=color, width=1)
    # Circle
    draw.ellipse([cx - size, cy - size, cx + size, cy + size], outline=color, width=2)
    draw.ellipse([cx - size//2, cy - size//2, cx + size//2, cy + size//2], outline=color, width=2)


def main():
    print("🎨 Generating cover image...")

    # ---- 1. Background ----
    # Deep navy to darker navy gradient
    color_top = (15, 30, 60)       # Very dark navy
    color_bottom = (5, 15, 40)     # Almost black navy
    img = create_gradient_background(WIDTH, HEIGHT, color_top, color_bottom)

    # ---- 2. Add subtle texture (overlay gradient for depth) ----
    overlay = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)

    # Radial highlight in upper-center
    center_x, center_y = WIDTH // 2, int(HEIGHT * 0.25)
    for r in range(int(HEIGHT * 0.6), 10, -1):
        alpha = max(0, min(20, int(15 * (1 - r / (HEIGHT * 0.6)))))
        overlay_draw.ellipse(
            [center_x - r, center_y - r, center_x + r, center_y + r],
            fill=(180, 200, 230, alpha)
        )

    img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')

    # ---- 3. Draw decorative elements ----
    deco = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    deco_draw = ImageDraw.Draw(deco)

    # Subtle wave lines in lower portion
    draw_waves(deco_draw, WIDTH, HEIGHT)

    # Compass rose - small and elegant, top center
    draw_compass(deco_draw, WIDTH // 2, int(HEIGHT * 0.13), 45, 35)

    # Thin decorative line separator
    line_y = int(HEIGHT * 0.42)
    deco_draw.line([(int(WIDTH * 0.35), line_y), (int(WIDTH * 0.65), line_y)],
                   fill=(200, 190, 150, 70), width=1)

    line_y2 = int(HEIGHT * 0.68)
    deco_draw.line([(int(WIDTH * 0.3), line_y2), (int(WIDTH * 0.7), line_y2)],
                   fill=(200, 190, 150, 60), width=1)

    img = Image.alpha_composite(img.convert('RGBA'), deco).convert('RGB')

    # ---- 4. Main drawing context ----
    draw = ImageDraw.Draw(img)

    # ---- 5. Title - Main ----
    title_font_size = 180
    title_font = ImageFont.truetype(FONT_TITLE, title_font_size)

    # Calculate text sizes for centering
    title_bbox = draw.textbbox((0, 0), BOOK_TITLE, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]
    title_x = (WIDTH - title_w) // 2
    title_y = int(HEIGHT * 0.31)

    # Title shadow
    shadow_offset = 4
    draw.text((title_x + shadow_offset, title_y + shadow_offset), BOOK_TITLE,
              fill=(0, 0, 0, 180), font=title_font)

    # Title text with gold-white gradient effect (paint top gold, bottom warm white)
    # Draw the title twice with slightly different colors for effect
    draw.text((title_x, title_y), BOOK_TITLE,
              fill=(240, 220, 160), font=title_font)  # Warm gold

    # ---- 6. Subtitle ----
    subtitle_font_size = 64
    subtitle_font = ImageFont.truetype(FONT_SERIF, subtitle_font_size)
    sub_bbox = draw.textbbox((0, 0), BOOK_SUBTITLE, font=subtitle_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (WIDTH - sub_w) // 2
    sub_y = title_y + title_h + 30

    draw.text((sub_x, sub_y), BOOK_SUBTITLE,
              fill=(180, 200, 230), font=subtitle_font)

    # ---- 7. Tagline ----
    tagline_font_size = 36
    tagline_font = ImageFont.truetype(FONT_SERIF, tagline_font_size)
    tag_bbox = draw.textbbox((0, 0), AUTHOR_TAGLINE, font=tagline_font)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_x = (WIDTH - tag_w) // 2
    tag_y = int(HEIGHT * 0.72)

    draw.text((tag_x, tag_y), AUTHOR_TAGLINE,
              fill=(160, 180, 210), font=tagline_font)

    # ---- 8. Author name ----
    author_font_size = 48
    author_font = ImageFont.truetype(FONT_SANS, author_font_size)
    auth_text = f"著  |  {AUTHOR_NAME}"
    auth_bbox = draw.textbbox((0, 0), auth_text, font=author_font)
    auth_w = auth_bbox[2] - auth_bbox[0]
    auth_x = (WIDTH - auth_w) // 2
    auth_y = int(HEIGHT * 0.78)

    draw.text((auth_x, auth_y), auth_text,
              fill=(200, 200, 220), font=author_font)

    # ---- 9. Bottom decorative element - small anchor/yacht silhouette hint ----
    # Simple yacht-like geometric shape at very bottom
    bottom_y = int(HEIGHT * 0.92)
    yacht_color = (100, 130, 170, 30)
    deco2 = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    deco2_draw = ImageDraw.Draw(deco2)

    # Minimal horizontal lines suggesting horizon
    for offset in range(0, 5):
        alpha_val = 30 - offset * 5
        y_pos = bottom_y + offset * 3
        deco2_draw.line([(int(WIDTH * 0.25), y_pos), (int(WIDTH * 0.75), y_pos)],
                        fill=(150, 180, 210, alpha_val), width=1)

    img = Image.alpha_composite(img.convert('RGBA'), deco2).convert('RGB')

    # ---- 10. Final polish - subtle vignette ----
    vignette = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    vignette_draw = ImageDraw.Draw(vignette)

    # Darken edges slightly
    for i in range(100):
        alpha = 120 - i  # 120 -> 21
        rect = [i, i, WIDTH - i, HEIGHT - i]
        vignette_draw.rectangle(rect, outline=(0, 0, 0, alpha), width=1)

    img = Image.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')

    # ---- Save ----
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    img.save(OUTPUT_PATH, 'JPEG', quality=95, dpi=(300, 300))
    file_size = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"✅ Cover saved: {OUTPUT_PATH}")
    print(f"   Dimensions: {WIDTH}x{HEIGHT}px (300 DPI)")
    print(f"   File size: {file_size:.0f} KB")
    print(f"   Format: JPEG, RGB")


if __name__ == '__main__':
    main()
