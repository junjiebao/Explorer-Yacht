#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Generate an online reader HTML page with full book content.
Single-file, self-contained, good for reading on any device.
"""

import re, os, json
from datetime import datetime
from docx import Document

DOCX_PATH = r"D:\下载目录\探险游艇——游艇行业新宠儿.docx"
OUTPUT_PATH = r"d:\GitHub works\Explorer-Yacht\book-reader.html"
SITE_ROOT = "https://www.tanxianyouting.com"
BOOK_TITLE = "探险游艇——游艇行业新宠儿"
BOOK_AUTHOR = "Joey 鲍俊杰"

def clean_heading_text(text):
    text = text.strip()
    text = re.sub(r'^[：:：\s]+', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def clean_text(text):
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return text

def has_image(para):
    element = para._element
    drawings = element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}drawing')
    picts = element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pict')
    return len(drawings) > 0 or len(picts) > 0

def generate_book_html():
    doc = Document(DOCX_PATH)

    # Parse content into structured items
    all_items = []

    for i, para in enumerate(doc.paragraphs):
        style_name = para.style.name if para.style else 'Normal'
        text = para.text.strip() if para.text else ''

        if has_image(para):
            all_items.append(('image', ''))
            continue

        if not text:
            all_items.append(('empty', ''))
            continue

        is_heading = False
        heading_level = 0
        if style_name and 'Heading' in style_name:
            is_heading = True
            match = re.search(r'Heading\s*(\d)', style_name)
            if match:
                heading_level = int(match.group(1))

        # Skip main title (first paragraph)
        if i == 0 and style_name == 'MainTitle':
            continue

        if is_heading and heading_level >= 1:
            clean_title = clean_heading_text(text)
            if clean_title:
                all_items.append((f'h{heading_level}', clean_title))
        else:
            all_items.append(('p', clean_text(text)))

    # Group into chapters on H1
    chapters = []
    current_items = []
    current_title = "封面"

    for item in all_items:
        typ = item[0]
        if typ == 'h1':
            if current_items:
                chapters.append((current_title, current_items))
            current_title = item[1]
            current_items = [item]
        else:
            current_items.append(item)

    if current_items:
        chapters.append((current_title, current_items))

    # ---- Build HTML content for each chapter ----
    all_chapter_html = []
    toc_items = []

    img_counter = 0

    for ch_idx, (ch_title, ch_items) in enumerate(chapters):
        chapter_id = f"ch{ch_idx + 1}"
        chapter_slug = re.sub(r'[^\w一-鿿]+', '-', ch_title).strip('-')[:40]

        toc_items.append({
            'id': chapter_id,
            'title': ch_title,
            'level': 1
        })

        body_parts = []

        # Special: chapter 0 (封面) gets a title page
        if ch_idx == 0:
            body_parts.append(f'''<div class="title-page">
                <h1>{BOOK_TITLE}</h1>
                <p class="subtitle">游艇行业新宠儿</p>
                <p class="author-line">著 | {BOOK_AUTHOR}</p>
                <p class="note-line">本书为免费读物 · 纯文本版本</p>
            </div>''')

        # Track sub-headings for nested TOC
        sub_toc_levels = []

        for typ, data in ch_items:
            if typ == 'empty':
                body_parts.append('<p class="spacer"></p>')
            elif typ == 'image':
                img_counter += 1
                body_parts.append(f'<div class="img-placeholder">[ 图片 {img_counter} — 此免费版本未收录图片 ]</div>')
            elif typ.startswith('h'):
                level = int(typ[1])
                tag = f'h{level}' if level <= 6 else 'h6'
                # Add chapter title H1
                if data == ch_title:
                    body_parts.append(f'<h1 class="chapter-title">{data}</h1>')
                else:
                    body_parts.append(f'<{tag}>{data}</{tag}>')

                # Track for sub-TOC
                if level >= 2 and level <= 4:
                    sub_slug = re.sub(r'[^\w一-鿿]+', '-', data).strip('-')[:30]
                    if level not in [s['level'] for s in sub_toc_levels[-3:]] or True:
                        pass  # We don't add sub-toc for now
            elif typ == 'p':
                body_parts.append(f'<p>{data}</p>')

        chapter_html = '\n'.join(body_parts)
        all_chapter_html.append(f'<section id="{chapter_id}" class="chapter" data-chapter="{ch_idx + 1}">\n{chapter_html}\n</section>')

    # ---- Build full HTML page ----
    toc_json = json.dumps(toc_items, ensure_ascii=False)

    full_html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{BOOK_TITLE} — 在线阅读 | {BOOK_AUTHOR} 著</title>
    <meta name="description" content="{BOOK_TITLE} 完整版在线阅读。华人市场首部探险游艇全景指南，{BOOK_AUTHOR}著。">
    <link rel="canonical" href="{SITE_ROOT}/book-reader.html">
    <meta property="og:title" content="{BOOK_TITLE} — 在线阅读">
    <meta property="og:description" content="华人市场首部探险游艇全景指南，{len(chapters)}章系统覆盖。">
    <meta property="og:url" content="{SITE_ROOT}/book-reader.html">
    <meta property="og:type" content="book">
    <link rel="icon" href="https://cdn.boatinternational.com/convert/bi_prd/bi/library_images/FaUrHK5kTmy8gpEoSKW4_oceanxplorer-sea-trials.jpg/r%5Bwidth%5D=32&r%5Bheight%5D=32/FaUrHK5kTmy8gpEoSKW4_oceanxplorer-sea-trials.webp">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Noto+Serif+SC:wght@300;400;500;600&family=Noto+Sans+SC:wght@300;400;500&family=Montserrat:wght@200;300;400;500&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #f7f4ee;
            --text: #2c2416;
            --text-light: #6b5e4a;
            --gold: #b8943e;
            --navy: #1a2f3a;
            --accent: #1a5f7a;
            --border: #e0d8c8;
            --card-bg: #fffef9;
            --sidebar-bg: #1a2f3a;
            --sidebar-text: #c4bfb3;
            --sidebar-active: #d4c89a;
        }}

        * {{ margin: 0; padding: 0; box-sizing: border-box; }}

        body {{
            font-family: 'Noto Serif SC', 'SimSun', 'Songti SC', serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.9;
            font-size: 17px;
            display: flex;
            min-height: 100vh;
        }}

        /* === SIDEBAR TOC === */
        .sidebar {{
            width: 300px;
            min-width: 300px;
            background: var(--sidebar-bg);
            color: var(--sidebar-text);
            height: 100vh;
            position: sticky;
            top: 0;
            overflow-y: auto;
            padding: 30px 24px;
            z-index: 100;
            transition: transform 0.3s;
        }}

        .sidebar-header {{
            margin-bottom: 28px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }}

        .sidebar-header h3 {{
            font-family: 'Noto Serif SC', serif;
            font-size: 18px;
            font-weight: 500;
            color: #f0ece4;
            margin-bottom: 4px;
        }}

        .sidebar-header .author-sm {{
            font-size: 12px;
            color: rgba(255,255,255,0.45);
            font-family: 'Montserrat', sans-serif;
        }}

        .toc-list {{
            list-style: none;
        }}

        .toc-list li {{
            margin-bottom: 2px;
        }}

        .toc-list li a {{
            display: block;
            padding: 9px 12px;
            color: rgba(255,255,255,0.6);
            text-decoration: none;
            font-size: 14px;
            border-radius: 6px;
            transition: all 0.2s;
            font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        }}

        .toc-list li a:hover {{
            background: rgba(255,255,255,0.06);
            color: rgba(255,255,255,0.85);
        }}

        .toc-list li a.active {{
            background: rgba(212,200,154,0.12);
            color: var(--sidebar-active);
            font-weight: 500;
        }}

        .sidebar-footer {{
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            font-size: 12px;
            color: rgba(255,255,255,0.3);
        }}

        .sidebar-footer a {{
            color: rgba(255,255,255,0.4);
            text-decoration: none;
        }}

        .sidebar-footer a:hover {{ color: rgba(255,255,255,0.7); }}

        /* === MOBILE TOGGLE === */
        .sidebar-toggle {{
            display: none;
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 200;
            background: var(--navy);
            color: #fff;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }}

        /* === MAIN CONTENT === */
        .main {{
            flex: 1;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 48px 120px;
        }}

        .reader-header {{
            text-align: center;
            padding: 20px 0 40px;
            border-bottom: 1px solid var(--border);
            margin-bottom: 40px;
        }}

        .reader-header .back-link {{
            font-family: 'Montserrat', 'Noto Sans SC', sans-serif;
            font-size: 12px;
            letter-spacing: 0.5px;
            color: var(--accent);
            text-decoration: none;
            text-transform: uppercase;
        }}

        .reader-header .back-link:hover {{ color: var(--gold); }}

        /* === TITLE PAGE === */
        .title-page {{
            text-align: center;
            padding: 60px 20px;
            margin-bottom: 40px;
        }}

        .title-page h1 {{
            font-size: 32px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 12px;
            font-family: 'Noto Serif SC', serif;
            line-height: 1.4;
        }}

        .title-page .subtitle {{
            font-size: 18px;
            color: var(--text-light);
            margin-bottom: 24px;
            font-family: 'Noto Serif SC', serif;
        }}

        .title-page .author-line {{
            font-size: 15px;
            color: var(--gold);
            font-family: 'Noto Sans SC', sans-serif;
        }}

        .title-page .note-line {{
            font-size: 13px;
            color: #aaa;
            margin-top: 30px;
        }}

        /* === CHAPTER CONTENT === */
        .chapter {{
            padding-top: 10px;
        }}

        .chapter-title {{
            font-size: 26px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 50px 0 30px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--gold);
            font-family: 'Noto Serif SC', serif;
        }}

        h2 {{
            font-size: 22px;
            font-weight: 600;
            color: #2a2a2a;
            margin: 40px 0 18px;
            font-family: 'Noto Serif SC', serif;
        }}

        h3 {{
            font-size: 19px;
            font-weight: 600;
            color: #3a3a3a;
            margin: 32px 0 14px;
        }}

        h4 {{
            font-size: 17px;
            font-weight: 600;
            color: #4a4a4a;
            margin: 24px 0 10px;
        }}

        h5 {{
            font-size: 16px;
            font-weight: 600;
            color: #555;
            margin: 20px 0 8px;
        }}

        h6 {{
            font-size: 15px;
            font-weight: 600;
            color: #666;
            margin: 16px 0 6px;
        }}

        p {{
            text-indent: 2em;
            margin: 8px 0;
            text-align: justify;
        }}

        p.spacer {{
            text-indent: 0;
            height: 8px;
        }}

        .img-placeholder {{
            border: 1px dashed var(--border);
            padding: 12px 16px;
            margin: 16px 0;
            text-align: center;
            color: #aaa;
            font-size: 13px;
            font-style: italic;
            background: var(--card-bg);
            border-radius: 4px;
            font-family: 'Noto Sans SC', sans-serif;
            text-indent: 0;
        }}

        /* === CHAPTER NAV === */
        .chapter-nav {{
            display: flex;
            justify-content: space-between;
            margin: 60px 0 30px;
            padding-top: 30px;
            border-top: 1px solid var(--border);
        }}

        .chapter-nav a {{
            font-family: 'Noto Sans SC', sans-serif;
            font-size: 14px;
            color: var(--accent);
            text-decoration: none;
            padding: 8px 16px;
            border: 1px solid var(--border);
            border-radius: 20px;
            transition: all 0.2s;
        }}

        .chapter-nav a:hover {{
            border-color: var(--accent);
            background: rgba(26,95,122,0.04);
        }}

        /* === PROGRESS BAR === */
        .progress-bar {{
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent), var(--gold));
            z-index: 300;
            transition: width 0.1s;
        }}

        /* === SCROLL TO TOP === */
        .scroll-top {{
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--navy);
            color: #fff;
            border: none;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 150;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }}

        .scroll-top.visible {{ opacity: 1; }}

        /* === RESPONSIVE === */
        @media (max-width: 900px) {{
            body {{ flex-direction: column; }}
            .sidebar {{
                position: fixed;
                left: 0;
                top: 0;
                transform: translateX(-100%);
                z-index: 150;
                width: 280px;
            }}
            .sidebar.open {{ transform: translateX(0); }}
            .sidebar-toggle {{ display: flex; align-items: center; justify-content: center; }}
            .main {{
                padding: 60px 20px 80px;
                max-width: 100%;
            }}
            .title-page h1 {{ font-size: 26px; }}
        }}

        @media (max-width: 480px) {{
            .main {{ padding: 50px 16px 60px; }}
            .chapter-title {{ font-size: 22px; }}
            h2 {{ font-size: 19px; }}
            h3 {{ font-size: 17px; }}
            p {{ font-size: 15px; }}
        }}

        /* Print */
        @media print {{
            .sidebar, .sidebar-toggle, .progress-bar, .scroll-top, .chapter-nav {{ display: none !important; }}
            body {{ display: block; background: #fff; }}
            .main {{ max-width: 100%; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="progress-bar" id="progressBar"></div>

    <button class="sidebar-toggle" id="sidebarToggle" aria-label="目录">☰</button>

    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <h3>{BOOK_TITLE}</h3>
            <div class="author-sm">{BOOK_AUTHOR} 著 · {len(chapters)}章</div>
        </div>
        <ul class="toc-list" id="tocList">
            {''.join(f'<li><a href="#{item["id"]}" data-target="{item["id"]}">{item["title"]}</a></li>' for item in toc_items)}
        </ul>
        <div class="sidebar-footer">
            <p>© 2024-2026 {BOOK_AUTHOR}</p>
            <p><a href="{SITE_ROOT}/ebook.html">← 返回电子书页面</a></p>
        </div>
    </aside>

    <div class="sidebar-overlay" id="sidebarOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:140;"></div>

    <main class="main" id="mainContent">
        <div class="reader-header">
            <a href="{SITE_ROOT}/ebook.html" class="back-link">← 返回电子书页面</a>
        </div>

        {''.join(all_chapter_html)}

        <div class="chapter-nav" id="chapterNav">
            <a href="#" id="prevChapter">← 上一章</a>
            <a href="{SITE_ROOT}/ebook.html">返回电子书页面</a>
            <a href="#" id="nextChapter">下一章 →</a>
        </div>
    </main>

    <button class="scroll-top" id="scrollTop" aria-label="返回顶部" style="font-family:sans-serif;">↑</button>

    <script>
    (function() {{
        var sidebar = document.getElementById('sidebar');
        var toggleBtn = document.getElementById('sidebarToggle');
        var overlay = document.getElementById('sidebarOverlay');
        var progressBar = document.getElementById('progressBar');
        var scrollTopBtn = document.getElementById('scrollTop');
        var tocLinks = document.querySelectorAll('#tocList a');
        var chapters = document.querySelectorAll('.chapter');

        // Sidebar toggle
        function openSidebar() {{ sidebar.classList.add('open'); overlay.style.display = 'block'; }}
        function closeSidebar() {{ sidebar.classList.remove('open'); overlay.style.display = 'none'; }}

        toggleBtn.addEventListener('click', function() {{
            sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        }});
        overlay.addEventListener('click', closeSidebar);

        // Close sidebar on link click (mobile)
        tocLinks.forEach(function(link) {{
            link.addEventListener('click', function() {{
                if (window.innerWidth <= 900) closeSidebar();
            }});
        }});

        // Scroll progress
        window.addEventListener('scroll', function() {{
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            progressBar.style.width = progress + '%';

            // Scroll-to-top button
            scrollTopBtn.classList.toggle('visible', scrollTop > 400);
        }});

        scrollTopBtn.addEventListener('click', function() {{
            window.scrollTo({{ top: 0, behavior: 'smooth' }});
        }});

        // Active TOC link
        function updateActiveLink() {{
            var scrollPos = window.pageYOffset + 120;
            var activeId = null;

            chapters.forEach(function(ch) {{
                var top = ch.offsetTop;
                if (scrollPos >= top) {{
                    activeId = ch.id;
                }}
            }});

            tocLinks.forEach(function(link) {{
                link.classList.toggle('active', link.getAttribute('data-target') === activeId);
            }});
        }}

        window.addEventListener('scroll', updateActiveLink);
        updateActiveLink();

        // Chapter navigation
        function getCurrentChapterIndex() {{
            var scrollPos = window.pageYOffset + 200;
            var currentIdx = 0;
            chapters.forEach(function(ch, i) {{
                if (scrollPos >= ch.offsetTop) currentIdx = i;
            }});
            return currentIdx;
        }}

        function scrollToChapter(idx) {{
            if (idx >= 0 && idx < chapters.length) {{
                chapters[idx].scrollIntoView({{ behavior: 'smooth', block: 'start' }});
            }}
        }}

        document.getElementById('prevChapter').addEventListener('click', function(e) {{
            e.preventDefault();
            scrollToChapter(getCurrentChapterIndex() - 1);
        }});

        document.getElementById('nextChapter').addEventListener('click', function(e) {{
            e.preventDefault();
            scrollToChapter(getCurrentChapterIndex() + 1);
        }});

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {{
            if (e.key === 'ArrowLeft') {{ scrollToChapter(getCurrentChapterIndex() - 1); }}
            if (e.key === 'ArrowRight') {{ scrollToChapter(getCurrentChapterIndex() + 1); }}
        }});

        // Smooth scroll for TOC links
        tocLinks.forEach(function(link) {{
            link.addEventListener('click', function(e) {{
                e.preventDefault();
                var target = document.getElementById(this.getAttribute('data-target'));
                if (target) {{
                    target.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
                }}
            }});
        }});
    }})();
    </script>
</body>
</html>'''

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(full_html)

    file_size = os.path.getsize(OUTPUT_PATH) / 1024
    print(f'✅ Online reader created: {OUTPUT_PATH}')
    print(f'   Size: {file_size:.0f} KB')
    print(f'   Chapters: {len(chapters)}')
    print(f'   Images skipped: {img_counter}')

if __name__ == '__main__':
    generate_book_html()
