"""DAMEN 图片批量优化
- 删除重复文件（带 (1) 的副本）
- 所有 JPG 等比例缩放到最长边 ≤1600px，quality 82 覆盖原文件
- 同时生成 WebP 版本（同名 .webp）供浏览器自适应
- 为图库缩略图生成专用小图（300px 宽）到 thumbs/ 目录
"""

import os, glob
from PIL import Image

BASE = r"D:\GitHub\Explorer-Yacht\images\Damen"
SUBDIRS = ["60", "80", "105"]

# 1. 删除重复文件
print("=== 删除重复文件 ===")
for sub in SUBDIRS:
    folder = os.path.join(BASE, sub)
    for f in list(os.listdir(folder)):
        if " (1)" in f:
            path = os.path.join(folder, f)
            os.remove(path)
            print(f"  DEL {os.path.basename(path)}")

# 2. 批量压缩
print("\n=== 压缩与转换 ===")
total_before = 0
total_after = 0

for sub in SUBDIRS:
    folder = os.path.join(BASE, sub)
    thumb_dir = os.path.join(folder, "thumbs")
    os.makedirs(thumb_dir, exist_ok=True)

    for ext in ("*.jpg", "*.jpeg", "*.png"):
        for fpath in glob.glob(os.path.join(folder, ext)):
            basename = os.path.splitext(os.path.basename(fpath))[0]
            before = os.path.getsize(fpath)
            total_before += before

            try:
                img = Image.open(fpath).convert("RGB")
                w, h = img.size

                # 等比缩放到最长边 1600px
                max_dim = 1600
                if max(w, h) > max_dim:
                    ratio = max_dim / max(w, h)
                    img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

                # 覆盖原文件（JPEG quality 82）
                img.save(fpath, "JPEG", quality=82, optimize=True, progressive=True)

                # 生成 WebP
                webp_path = os.path.join(folder, f"{basename}.webp")
                img.save(webp_path, "WEBP", quality=82)

                # 生成缩略图（300px 宽）
                thumb = img.copy()
                if thumb.width > 300:
                    ratio = 300 / thumb.width
                    thumb = thumb.resize((300, int(thumb.height * ratio)), Image.LANCZOS)
                thumb_path = os.path.join(thumb_dir, f"{basename}.webp")
                thumb.save(thumb_path, "WEBP", quality=72)

                after = os.path.getsize(fpath)
                total_after += after
                webp_kb = os.path.getsize(webp_path) / 1024
                thumb_kb = os.path.getsize(thumb_path) / 1024
                saving = (1 - after / before) * 100
                print(f"  {basename:45s} {before/1024:6.0f}KB → {after/1024:6.0f}KB (-{saving:.0f}%)  webp:{webp_kb:.0f}KB  thumb:{thumb_kb:.0f}KB")

            except Exception as e:
                print(f"  ERR {fpath}: {e}")

    # 删除 PNG 源文件（已转 JPG/WebP）
    for fpath in glob.glob(os.path.join(folder, "*.png")):
        os.remove(fpath)
        print(f"  DEL PNG: {os.path.basename(fpath)}")

print(f"\n=== 汇总 ===")
print(f"原图总大小: {total_before/1024/1024:.1f} MB")
print(f"压缩后总大小: {total_after/1024/1024:.1f} MB")
print(f"压缩率: {total_after/total_before*100:.0f}%")
print("完成！")
