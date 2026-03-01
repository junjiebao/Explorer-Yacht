document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    const menuBtn = nav.querySelector('.menu-btn');
    const navLinks = nav.querySelector('.nav-links');
    if (!menuBtn || !navLinks) return;

    // ── 确保按钮为三横线结构 ──────────────────────────────
    if (!menuBtn.querySelector('.bar')) {
        menuBtn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
    }
    menuBtn.setAttribute('aria-label', '打开导航菜单');
    menuBtn.setAttribute('aria-expanded', 'false');

    // ── 获取或创建遮罩层 ──────────────────────────────────
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
    }

    // ── 开关菜单 ──────────────────────────────────────────
    function openMenu() {
        navLinks.classList.add('active');
        menuBtn.classList.add('open');
        overlay.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        navLinks.classList.remove('active');
        menuBtn.classList.remove('open');
        overlay.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        // 收起所有下拉
        nav.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
    }

    menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        navLinks.classList.contains('active') ? closeMenu() : openMenu();
    });

    // 点击遮罩关闭
    overlay.addEventListener('click', closeMenu);

    // ── 移动端下拉菜单点击展开 ────────────────────────────
    nav.querySelectorAll('.dropdown > a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            if (window.innerWidth > 768) return;
            e.preventDefault();
            const dropdown = link.parentElement;
            const isOpen = dropdown.classList.contains('open');
            // 关闭其他
            nav.querySelectorAll('.dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open', !isOpen);
        });
    });

    // ── 点击子菜单链接后关闭菜单 ─────────────────────────
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            // 下拉父级由上面的 listener 处理，这里跳过
            if (link.closest('.dropdown') && !link.closest('.dropdown-menu')) return;

            const href = link.getAttribute('href');

            // 页内锚点：平滑滚动
            if (href && href.startsWith('#')) {
                e.preventDefault();
                closeMenu();
                const target = document.querySelector(href);
                if (target) {
                    setTimeout(function () {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                }
                return;
            }

            // 普通页面链接：先关闭菜单视觉效果，再让浏览器正常跳转
            // 不调用 e.preventDefault()，让 href 自然生效
            navLinks.classList.remove('active');
            menuBtn.classList.remove('open');
            overlay.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // ── ESC 关闭 ──────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeMenu();
    });

    // ── 滚动时固定导航背景 ───────────────────────────────
    let scrollTimer;
    window.addEventListener('scroll', function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
            if ((window.pageYOffset || document.documentElement.scrollTop) > 60) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        }, 60);
    }, { passive: true });
});
