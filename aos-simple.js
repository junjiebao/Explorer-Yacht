// 简化版 AOS (Animate On Scroll) 动画库
// 专为探险游艇定制页面设计

(function() {
    'use strict';

    // 配置选项
    const defaultConfig = {
        duration: 1000,
        once: true,
        offset: 100,
        delay: 0
    };

    // AOS 对象
    window.AOS = {
        init: function(userConfig = {}) {
            const config = Object.assign({}, defaultConfig, userConfig);
            const elements = document.querySelectorAll('[data-aos]');
            
            // 创建观察器
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const aosType = element.getAttribute('data-aos');
                        const aosDelay = element.getAttribute('data-aos-delay') || config.delay;
                        
                        // 应用动画
                        setTimeout(() => {
                            element.style.opacity = '1';
                            element.style.transform = 'translateY(0)';
                            element.style.transition = `all ${config.duration}ms ease-out`;
                            
                            // 根据动画类型添加特定效果
                            switch(aosType) {
                                case 'fade-up':
                                    element.style.transform = 'translateY(0)';
                                    break;
                                case 'fade-down':
                                    element.style.transform = 'translateY(0)';
                                    break;
                                case 'fade-left':
                                    element.style.transform = 'translateX(0)';
                                    break;
                                case 'fade-right':
                                    element.style.transform = 'translateX(0)';
                                    break;
                                case 'zoom-in':
                                    element.style.transform = 'scale(1)';
                                    break;
                                case 'zoom-out':
                                    element.style.transform = 'scale(1)';
                                    break;
                                default:
                                    element.style.transform = 'translateY(0)';
                            }
                        }, aosDelay);
                        
                        // 如果只触发一次，则停止观察
                        if (config.once) {
                            observer.unobserve(element);
                        }
                    }
                });
            }, {
                rootMargin: `-${config.offset}px 0px -${config.offset}px 0px`
            });
            
            // 初始化元素状态
            elements.forEach(element => {
                const aosType = element.getAttribute('data-aos');
                
                // 设置初始状态
                element.style.opacity = '0';
                element.style.transition = `all ${config.duration}ms ease-out`;
                
                // 根据动画类型设置初始状态
                switch(aosType) {
                    case 'fade-up':
                        element.style.transform = 'translateY(30px)';
                        break;
                    case 'fade-down':
                        element.style.transform = 'translateY(-30px)';
                        break;
                    case 'fade-left':
                        element.style.transform = 'translateX(-30px)';
                        break;
                    case 'fade-right':
                        element.style.transform = 'translateX(30px)';
                        break;
                    case 'zoom-in':
                        element.style.transform = 'scale(0.8)';
                        break;
                    case 'zoom-out':
                        element.style.transform = 'scale(1.2)';
                        break;
                    default:
                        element.style.transform = 'translateY(30px)';
                }
                
                // 开始观察
                observer.observe(element);
            });
        },
        
        refresh: function() {
            // 重新初始化所有动画
            this.init();
        }
    };

    // 自动初始化（如果需要）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // 默认不自动初始化，让用户手动调用
        });
    }
})();