// 定制改造页面 JavaScript - 轮播与交互
document.addEventListener('DOMContentLoaded', function() {
    // Hero 轮播
    var slides = document.querySelectorAll('.slide');
    var dots = document.querySelectorAll('.slider-dot');
    var currentSlide = 0;
    var autoPlayTimer = null;

    window.goToSlide = function(index) {
        if (index === currentSlide) return;
        slides.forEach(function(s, i) {
            s.classList.toggle('active', i === index);
        });
        dots.forEach(function(d, i) {
            d.classList.toggle('active', i === index);
        });
        currentSlide = index;
    };

    // 自动轮播
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayTimer = setInterval(function() {
            var next = (currentSlide + 1) % slides.length;
            goToSlide(next);
        }, 5000);
    }

    function stopAutoPlay() {
        if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
        }
    }

    if (slides.length > 1) {
        startAutoPlay();
        // 鼠标悬停暂停
        document.querySelector('.hero-section').addEventListener('mouseenter', stopAutoPlay);
        document.querySelector('.hero-section').addEventListener('mouseleave', startAutoPlay);
    }

    // 平滑滚动
    window.scrollToSection = function(sectionId) {
        var section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };
});
