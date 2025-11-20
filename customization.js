// 探险游艇定制与改造中心页面交互脚本

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initHeroSlider();
    initGalleryFilters();
    initScrollEffects();
    initMobileMenu();
});

// Hero 轮播图功能
function initHeroSlider() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    let slideInterval;

    // 显示指定幻灯片
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    // 下一张幻灯片
    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        showSlide(nextIndex);
    }

    // 自动播放
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    // 停止自动播放
    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    // 点击切换
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoSlide();
            startAutoSlide();
        });
    });

    // 鼠标悬停暂停
    const heroSection = document.querySelector('.hero-section');
    heroSection.addEventListener('mouseenter', stopAutoSlide);
    heroSection.addEventListener('mouseleave', startAutoSlide);

    // 开始自动播放
    startAutoSlide();
}

// 切换到指定幻灯片（全局函数）
function goToSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.slider-dot');
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

// 图库筛选功能
function initGalleryFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            
            // 更新按钮状态
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 筛选图片
            galleryItems.forEach(item => {
                const categories = item.className.split(' ').filter(cls => cls !== 'gallery-item');
                
                if (filter === 'all' || categories.includes(filter)) {
                    item.style.display = 'block';
                    // 添加动画效果
                    item.style.animation = 'fadeIn 0.5s ease-in-out';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// 滚动效果
function initScrollEffects() {
    // AOS 动画库初始化（如果已加载）
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
    }

    // 滚动时显示/隐藏顶部导航
    const topBar = document.querySelector('.top-bar');
    const homeTab = document.querySelector('.home-tab');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            topBar.classList.add('hidden');
            homeTab.classList.add('hidden');
        } else {
            topBar.classList.remove('hidden');
            homeTab.classList.remove('hidden');
        }
        
        lastScrollY = currentScrollY;
    });

    // 平滑滚动到指定区域
    window.scrollToSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    };
}

// 移动端菜单
function initMobileMenu() {
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.dropdown');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuBtn.classList.toggle('active');
            menuBtn.textContent = menuBtn.classList.contains('active') ? 'CLOSE' : 'MENU';
        });

        // 下拉菜单
        dropdowns.forEach(dropdown => {
            const link = dropdown.querySelector('a');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (link && menu) {
                link.addEventListener('click', (e) => {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        menu.classList.toggle('active');
                    }
                });
            }
        });
    }
}

// 表单处理
function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // 表单验证
    if (!data.name || !data.phone || !data.approach) {
        showNotification('请填写必填字段', 'error');
        return;
    }

    // 构建邮件内容
    const subject = encodeURIComponent('探险游艇定制咨询');
    const body = encodeURIComponent(`
姓名：${data.name}
电话：${data.phone}
邮箱：${data.email || '未提供'}
意向途径：${getApproachText(data.approach)}
简要需求：${data.requirements || '未提供'}

---
此邮件来自探险游艇定制与改造中心官网
时间：${new Date().toLocaleString('zh-CN')}
    `);
    
    // 发送邮件
    window.location.href = `mailto:Build@xinyouting.com?subject=${subject}&body=${body}`;
    
    // 显示成功提示
    showNotification('咨询申请已提交，我们将尽快与您联系！', 'success');
}

// 获取意向途径文本
function getApproachText(approach) {
    const approachMap = {
        'new-build': '全新定制',
        'conversion': '二手改造',
        'both': '都想了解'
    };
    return approachMap[approach] || approach;
}

// 通知提示功能
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease-in-out;
        font-weight: 500;
        max-width: 300px;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 图片懒加载优化
function lazyLoadImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// 添加淡入动画
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .gallery-item {
        animation: fadeIn 0.5s ease-in-out;
    }
    
    img.loaded {
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// 初始化懒加载
lazyLoadImages();

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('页面错误:', e.error);
    showNotification('页面出现错误，请刷新重试', 'error');
});

// 性能监控
window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`页面加载完成，耗时 ${Math.round(loadTime)}ms`);
});

// 图片错误处理
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            console.warn('图片加载失败:', this.src);
            // 使用备用图片
            this.src = 'https://images.unsplash.com/photo-1540202403930-083db6f33713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80';
            this.onerror = null; // 防止无限循环
        });
    });
});

// 导出全局函数
window.goToSlide = goToSlide;
window.scrollToSection = function(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
};
window.handleSubmit = handleSubmit;