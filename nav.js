// 全局导航 - 移动端菜单控制
document.addEventListener('DOMContentLoaded', function() {
    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.querySelector('.main-nav');
    var overlay = document.querySelector('.nav-overlay');

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function() {
            var expanded = this.getAttribute('aria-expanded') === 'true' ? false : true;
            this.setAttribute('aria-expanded', expanded);
            nav.classList.toggle('nav-open');
            document.body.classList.toggle('no-scroll');
            if (overlay) overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            nav.classList.remove('nav-open');
            document.body.classList.remove('no-scroll');
            overlay.classList.remove('active');
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
        });
    }

    // 下拉菜单
    var dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(function(dd) {
        dd.addEventListener('mouseenter', function() {
            var menu = this.querySelector('.dropdown-menu');
            if (menu) menu.style.display = 'block';
        });
        dd.addEventListener('mouseleave', function() {
            var menu = this.querySelector('.dropdown-menu');
            if (menu) menu.style.display = '';
        });
    });
});
