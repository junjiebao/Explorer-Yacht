#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Convert 探险游艇——游艇行业新宠儿.docx to EPUB format
Generates text-only EPUB for Google Books upload (no copyright issues).
Also can generate version with images for personal reference.

Google Books EPUB requirements:
  - Valid EPUB 2.0.1 or 3.0
  - NCX table of contents (EPUB 2) + NAV document (EPUB 3)
  - No DRM
  - UTF-8 encoding
  - Proper XHTML content files
  - All resources self-contained
"""

import os, re, zipfile
from pathlib import Path
from datetime import datetime
from docx import Document
from lxml import etree
from ebooklib import epub

# ============================================================
# CONFIGURATION
# ============================================================
DOCX_PATH = r"D:\下载目录\探险游艇——游艇行业新宠儿.docx"
OUTPUT_DIR = r"d:\GitHub works\Explorer-Yacht\output"
INCLUDE_IMAGES = False  # Set True for images version, False for Google Books
COVER_IMAGE = r"d:\GitHub works\Explorer-Yacht\output\cover.jpg"  # Original cover art, no copyright issues

BOOK_TITLE = "探险游艇——游艇行业新宠儿"
BOOK_AUTHOR = "Joey 鲍俊杰"
BOOK_LANGUAGE = "zh-CN"
PUBLISHER = "Explorer Yacht Publishing"
BOOK_DESCRIPTION = (
    "本书全面介绍探险游艇的历史、设计、建造、运营管理及未来发展趋势。"
    "从古代航海历史到现代探险游艇技术，涵盖船体设计、动力系统、极地探险、"
    "经典航线等丰富内容，是游艇爱好者和行业从业者的重要参考读物。"
)
BOOK_IDENTIFIER = "explorer-yacht-new-darling-001"


def extract_images_from_docx(docx_path):
    """Extract image references from docx document.xml.rels"""
    image_map = {}
    with zipfile.ZipFile(docx_path, 'r') as z:
        if 'word/_rels/document.xml.rels' in z.namelist():
            rels_xml = z.read('word/_rels/document.xml.rels')
            rels_tree = etree.fromstring(rels_xml)
            ns = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}
            for rel in rels_tree.findall('.//r:Relationship', ns):
                r_id = rel.get('Id')
                target = rel.get('Target')
                if target and 'media/' in target:
                    image_map[r_id] = target
    return image_map


def get_image_blob_and_ext(docx_path, image_rel_path):
    """Get image binary data and extension from docx"""
    full_path = f"word/{image_rel_path}"
    with zipfile.ZipFile(docx_path, 'r') as z:
        if full_path in z.namelist():
            data = z.read(full_path)
            ext = os.path.splitext(image_rel_path)[1].lower()
            return data, ext
    return None, None


def get_image_rid_from_paragraph(para):
    """Extract r:embed ID from paragraph's drawings/pictures"""
    r_ids = []
    element = para._element

    for drawing in element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing'):
        for blip in drawing.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}blip'):
            embed = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            if embed:
                r_ids.append(embed)

    for pict in element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pict'):
        for imagedata in pict.findall('.//{urn:schemas-microsoft-com:vml}imagedata'):
            rid = imagedata.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
            if rid:
                r_ids.append(rid)

    return r_ids


def clean_heading_text(text):
    """Clean heading text: remove leading punctuation, normalize spaces"""
    text = text.strip()
    # Remove leading colons, full-width colons, spaces
    text = re.sub(r'^[：:：\s]+', '', text)
    # Normalize repeated spaces
    text = re.sub(r'\s+', ' ', text)
    return text


def clean_text(text):
    """Clean up text for EPUB"""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    # Escape HTML entities
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return text


def create_epub(docx_path, output_dir, include_images=False):
    """Main conversion function"""

    version_suffix = "with-images" if include_images else "text-only"
    output_path = os.path.join(output_dir, f"探险游艇——游艇行业新宠儿_{version_suffix}.epub")
    os.makedirs(output_dir, exist_ok=True)

    doc = Document(docx_path)
    image_map = extract_images_from_docx(docx_path)

    # ---- Create EPUB book ----
    book = epub.EpubBook()
    book.set_identifier(BOOK_IDENTIFIER)
    book.set_title(BOOK_TITLE)
    book.set_language(BOOK_LANGUAGE)
    book.add_author(BOOK_AUTHOR)
    book.add_metadata('DC', 'publisher', PUBLISHER)
    book.add_metadata('DC', 'description', BOOK_DESCRIPTION)
    book.add_metadata('DC', 'date', datetime.now().strftime('%Y-%m-%d'))
    book.add_metadata('DC', 'rights', '本文档为免费读物，仅供个人学习和研究使用。')
    book.add_metadata('DC', 'format', 'EPUB 3.0')

    # ---- Cover Image (ebooklib auto-manages spine + TOC) ----
    if os.path.exists(COVER_IMAGE):
        with open(COVER_IMAGE, 'rb') as f:
            cover_data = f.read()
        book.set_cover('images/cover.jpg', cover_data)
        print(f"   📷 封面已嵌入: {os.path.basename(COVER_IMAGE)}")

    # ---- CSS Styling ----
    css = epub.EpubItem(
        uid="style_default",
        file_name="style/default.css",
        media_type="text/css",
        content="""@charset "UTF-8";

/* Base */
body {
    font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", "SimSun", serif;
    line-height: 1.8;
    margin: 0 3%;
    font-size: 1em;
    color: #333;
    orphans: 2;
    widows: 2;
}

/* Headings */
h1 {
    font-size: 1.6em;
    font-weight: bold;
    text-align: center;
    margin: 2em 0 1em 0;
    page-break-before: always;
    color: #1a1a1a;
}
h2 {
    font-size: 1.35em;
    font-weight: bold;
    margin: 1.8em 0 0.8em 0;
    color: #2a2a2a;
    page-break-before: auto;
}
h3 {
    font-size: 1.2em;
    font-weight: bold;
    margin: 1.4em 0 0.6em 0;
    color: #3a3a3a;
}
h4 {
    font-size: 1.08em;
    font-weight: bold;
    margin: 1.1em 0 0.5em 0;
    color: #4a4a4a;
}
h5 {
    font-size: 1em;
    font-weight: bold;
    margin: 0.9em 0 0.4em 0;
    color: #555;
}
h6 {
    font-size: 0.95em;
    font-weight: bold;
    margin: 0.7em 0 0.3em 0;
    color: #666;
}

/* Paragraphs */
p {
    text-indent: 2em;
    margin: 0.4em 0;
    text-align: justify;
}
p.no-indent {
    text-indent: 0;
}

/* Image placeholder */
div.image-placeholder {
    border: 1px dashed #ccc;
    padding: 0.8em;
    margin: 1em 0;
    text-align: center;
    color: #999;
    font-style: italic;
    background: #fafafa;
    font-size: 0.9em;
}
div.image-placeholder p {
    text-indent: 0;
    text-align: center;
}
figure {
    margin: 1.5em 0;
    text-align: center;
}
figcaption {
    font-size: 0.9em;
    color: #666;
    margin-top: 0.5em;
    text-indent: 0;
}
img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
}

/* Title page */
div.title-page {
    text-align: center;
    padding: 3em 0;
    page-break-after: always;
}
div.title-page h1 {
    font-size: 2em;
    page-break-before: auto;
    margin-bottom: 1.5em;
}
div.title-page p {
    text-indent: 0;
    text-align: center;
    margin: 0.5em 0;
}
div.title-page .subtitle {
    font-size: 1.2em;
    color: #555;
    margin: 1em 0;
}

/* Preface / special sections */
div.preface {
    margin: 1em 0;
}
div.preface p {
    text-indent: 2em;
}

/* Utility */
hr.sep {
    border: none;
    border-top: 1px solid #ddd;
    margin: 2em 25%;
}
""")

    book.add_item(css)

    # ---- Parse paragraphs into structured chapters ----
    # Strategy: Split at H1 level for main chapters.
    # H2-H6 headings become sub-sections within chapters.
    # The first content before any H1 goes into a "cover" chapter.

    all_items = []  # list of (type, data)
    # type: 'h1','h2','h3','h4','h5','h6','p','image','empty'

    NOTE_IMAGE_REMOVED = True  # Show placeholder for removed images

    for i, para in enumerate(doc.paragraphs):
        style_name = para.style.name if para.style else 'Normal'
        text = para.text.strip() if para.text else ''

        # Check for images
        img_rids = get_image_rid_from_paragraph(para)

        if img_rids:
            if include_images:
                img_html_parts = []
                for rid in img_rids:
                    if rid in image_map:
                        rel_path = image_map[rid]
                        img_data, ext = get_image_blob_and_ext(docx_path, rel_path)
                        if img_data:
                            ext_clean = ext.lstrip('.')
                            if ext_clean == 'jpeg':
                                ext_clean = 'jpg'
                            img_id = f"img_{i}_{rid.replace('rId','')}"
                            img_filename = f"images/{img_id}.{ext_clean}"
                            mime_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                                        'png': 'image/png', 'webp': 'image/webp',
                                        'gif': 'image/gif', 'svg': 'image/svg+xml'}
                            mime_type = mime_map.get(ext_clean, 'image/jpeg')
                            img_item = epub.EpubItem(
                                uid=img_id, file_name=img_filename,
                                media_type=mime_type, content=img_data,
                            )
                            book.add_item(img_item)
                            img_html_parts.append(
                                f'<figure><img src="../{img_filename}" alt="图片"/>'
                                f'<figcaption>图片</figcaption></figure>')
                if img_html_parts:
                    all_items.append(('image_html', '\n'.join(img_html_parts)))
            else:
                all_items.append(('image_placeholder',
                    f'<div class="image-placeholder">'
                    f'<p>[ 图片 — 为避免版权纠纷，本免费版本未收录图片 ]</p>'
                    f'</div>'))
            continue

        if not text:
            # Empty paragraph
            all_items.append(('empty', '<p class="no-indent">&#160;</p>'))
            continue

        # Determine heading level
        is_heading = False
        heading_level = 0
        if style_name and 'Heading' in style_name:
            is_heading = True
            match = re.search(r'Heading\s*(\d)', style_name)
            if match:
                heading_level = int(match.group(1))

        # Skip the very first paragraph if it's the main title (it will be on cover page)
        if i == 0 and style_name == 'MainTitle':
            # Already handled in cover page
            continue

        if is_heading and heading_level >= 1:
            clean_title = clean_heading_text(text)
            if clean_title:
                all_items.append((f'h{heading_level}', clean_title))
        else:
            # Regular paragraph
            all_items.append(('p', clean_text(text)))

    # ---- Group items into chapters (split on H1) ----
    chapters = []  # List of (chapter_title, items_list)
    current_items = []
    current_title = None

    for item in all_items:
        typ = item[0]
        if typ == 'h1':
            # Save previous chapter at H1 boundary
            if current_title is not None and current_items:
                chapters.append((current_title, current_items))
            current_title = item[1]
            current_items = [item]
        else:
            if current_title is None:
                # Items before first H1 go to cover page
                current_title = "封面"
            current_items.append(item)

    # Don't forget the last chapter
    if current_title is not None and current_items:
        chapters.append((current_title, current_items))

    # ---- Build XHTML file for each chapter ----
    spine_items = []
    toc_entries = []
    image_count = 0

    # Create cover/title page as first chapter
    title_page_html = f"""    <div class="title-page">
        <h1>{BOOK_TITLE}</h1>
        <p class="subtitle">游艇行业新宠儿</p>
        <p style="margin-top: 2em;">作者：{BOOK_AUTHOR}</p>
        <hr style="margin: 2em 30%; border: none; border-top: 1px solid #ccc;"/>
        <p style="font-size: 0.9em; color: #666;">本书为免费读物，旨在传播游艇文化知识。</p>
        <p style="font-size: 0.9em; color: #666;">本电子书为纯文本版本，不含图片，以避免潜在版权纠纷。</p>
        <p style="font-size: 0.9em; color: #666;">如需阅读带插图的完整版本，请联系作者。</p>
        <p style="margin-top: 3em; font-size: 0.8em; color: #999;">{datetime.now().strftime('%Y年%m月')}</p>
    </div>"""

    cover_items = [('image_placeholder', title_page_html)]
    # The first chapter (before first H1) becomes the cover
    # Actually the very first items before first H1 should be merged into cover
    if chapters and chapters[0][0] == "封面":
        cover_title, cover_content = chapters[0]
        # We'll handle this separately

    for idx, (title, items) in enumerate(chapters):
        chapter_id = f"chapter_{idx + 1}"
        chapter_filename = f"text/{chapter_id}.xhtml"

        # Build body HTML
        body_parts = []

        # Add title page for the very first chapter (封面)
        if idx == 0:
            body_parts.append(title_page_html)

        for typ, data in items:
            if typ == 'empty':
                body_parts.append('<p class="no-indent">&#160;</p>')
            elif typ == 'image_placeholder' or typ == 'image_html':
                body_parts.append(data)
                if typ == 'image_placeholder':
                    image_count += 1
            elif typ.startswith('h'):
                # Recalculate heading level for this chapter context
                # All h1 in chapter become the chapter's main heading
                level = int(typ[1])
                # In a chapter, if the item IS the chapter title, use h1
                # Otherwise keep its level
                if data == title:
                    body_parts.append(f'<h1>{data}</h1>')
                else:
                    body_parts.append(f'<h{level}>{data}</h{level}>')
            elif typ == 'p':
                body_parts.append(f'<p>{data}</p>')

        body_html = '\n'.join(body_parts)

        # Full XHTML document
        xhtml = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN" lang="zh-CN">
<head>
    <meta charset="UTF-8"/>
    <title>{clean_heading_text(title)}</title>
    <link rel="stylesheet" type="text/css" href="../style/default.css"/>
</head>
<body>
{body_html}
</body>
</html>"""

        chapter_item = epub.EpubItem(
            uid=chapter_id,
            file_name=chapter_filename,
            media_type="application/xhtml+xml",
            content=xhtml.encode('utf-8'),
        )
        book.add_item(chapter_item)
        spine_items.append(chapter_item)

        # TOC entry
        toc_entry = epub.Link(chapter_filename, clean_heading_text(title), chapter_id)
        toc_entries.append(toc_entry)

    # ---- Book structure ----
    book.toc = toc_entries
    book.spine = ['nav'] + spine_items
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # ---- Write EPUB ----
    try:
        epub.write_epub(output_path, book, {})
        print(f"✅ EPUB created successfully: {output_path}")
        file_size = os.path.getsize(output_path) / (1024 * 1024)
        print(f"   File size: {file_size:.2f} MB")
        print(f"   Chapters: {len(chapters)}")
        print(f"   Image placeholders: {image_count}")
        return output_path
    except Exception as e:
        print(f"❌ Error writing EPUB: {e}")
        raise

    return output_path


if __name__ == '__main__':
    print("=" * 60)
    print("  探险游艇 EPUB 转换工具")
    print("=" * 60)
    print()

    print("📖 正在生成纯文本版本 (推荐用于Google Books上传)...")
    result = create_epub(DOCX_PATH, OUTPUT_DIR, include_images=INCLUDE_IMAGES)

    print()
    print("=" * 60)
    print("转换完成！")
    print(f"输出文件: {result}")
    print()
    print("📌 Google Books 上传注意事项:")
    print("  1. ✅ 纯文本版本不含任何图片，无版权风险")
    print("  2. 📷 如需封面，请使用原创或CC0授权的图片")
    print("  3. 💰 在Google Books中选择'免费'定价")
    print("  4. 📝 确保书籍描述准确反映内容")
    print("  5. 🔍 建议使用EPUBCheck验证后再上传")
    print("=" * 60)
