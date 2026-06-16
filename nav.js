// 全局导航 — 左侧滑出抽屉菜单
(function() {
  'use strict';

  function initNav() {
    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.querySelector('.main-nav');
    var overlay = document.querySelector('.nav-overlay');
    var navLinks = document.querySelector('.nav-links');

    if (!menuBtn || !nav) return;

    // 打开菜单
    function openMenu() {
      menuBtn.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      if (navLinks) navLinks.classList.add('active');
      if (overlay) overlay.classList.add('active');
      document.body.classList.add('no-scroll');
    }

    // 关闭菜单
    function closeMenu() {
      menuBtn.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      if (navLinks) navLinks.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
      // 收起展开的子菜单
      var openDd = nav.querySelectorAll('.dropdown.open');
      for (var i = 0; i < openDd.length; i++) {
        openDd[i].classList.remove('open');
      }
    }

    // 触发 1：点击汉堡图标
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = navLinks && navLinks.classList.contains('active');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // 触发 2：点击遮罩
    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // 触发 3：点击导航条目（收起菜单）
    if (navLinks) {
      navLinks.addEventListener('click', function(e) {
        var link = e.target.closest('a');
        // 如果是下拉菜单的父级（带箭头），不收起，而是展开子菜单
        if (link && link.parentElement && link.parentElement.classList.contains('dropdown')) {
          e.preventDefault();
          link.parentElement.classList.toggle('open');
          return;
        }
        // 点击普通链接 → 关闭菜单（让浏览器继续导航）
        if (link && !link.closest('.dropdown')) {
          closeMenu();
        }
      });
    }

    // 下拉悬停（仅桌面端）
    var dropdowns = nav.querySelectorAll('.dropdown');
    for (var i = 0; i < dropdowns.length; i++) {
      (function(dd) {
        dd.addEventListener('mouseenter', function() {
          if (window.innerWidth > 768) {
            dd.classList.add('open');
          }
        });
        dd.addEventListener('mouseleave', function() {
          if (window.innerWidth > 768) {
            dd.classList.remove('open');
          }
        });
      })(dropdowns[i]);
    }

    // 窗口 resize 恢复
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }

  // ── 折叠式页脚（移动端） ──
  var footerToggle = document.getElementById('footerToggle');
  var footerMain = document.getElementById('footerMain');
  if (footerToggle && footerMain) {
    footerToggle.addEventListener('click', function() {
      var expanded = footerMain.classList.contains('expanded');
      if (expanded) {
        footerMain.classList.remove('expanded');
        footerToggle.classList.remove('expanded');
        footerToggle.querySelector('span:first-child').textContent = '查看更多';
      } else {
        footerMain.classList.add('expanded');
        footerToggle.classList.add('expanded');
        footerToggle.querySelector('span:first-child').textContent = '收起';
      }
    });
  }
})();
