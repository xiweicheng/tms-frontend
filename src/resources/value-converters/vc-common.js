import 'jquery-format';
import 'timeago';
import {
    default as ColorHash
} from 'color-hash';
import tags from 'common/common-tags';
import {
    default as UA
}
from 'ua-device';

let tg = timeago();

/**
 * 该文件用于定义值的过滤转换器
 *
 */
// ============================================================
/**
 * 转换为大写形式
 * eg: <p>${name | upper}</p>
 */
export class UpperValueConverter {
    toView(value) {
        return value && value.toUpperCase();
    }
}

/**
 * 转换为小写形式
 * eg: <p>${name | lower}</p>
 */
export class LowerValueConverter {
    toView(value) {
        return value && value.toLowerCase();
    }
}

/**
 * 时间格式化值转换器, using as: 4234234234 | dateFormat
 * doc: https://www.npmjs.com/package/jquery-format
 */
export class DateValueConverter {
    toView(value, format = 'yyyy-MM-dd hh:mm:ss') {
        return _.isInteger(_.toNumber(value)) ? $.format.date(new Date(value), format) : (value ? value : '');
    }
}

/**
 * 数值格式化值转换器, using as: 4234234234 | numberFormat
 * doc: https://www.npmjs.com/package/jquery-format
 */
export class NumberValueConverter {
    toView(value, format = '#,##0.00') {
        return _.isNumber(_.toNumber(value)) ? $.format.number(value, format) : (value ? value : '');
    }
}

/**
 * 日期timeago值转换器
 * doc: 
 * https://www.npmjs.com/package/better-timeago
 * https://www.npmjs.com/package/better-timeago-locale-zh-cn
 */
export class TimeagoValueConverter {
    toView(value) {
        return value ? tg.format(value, 'zh_CN') : '';
    }
}

/**
 * markdown内容解析处理
 */
export class ParseMdValueConverter {
    toView(value, channel = null, item = null) {
        if (item && item.editor == 'Html') {
            return value ? value : '';
        }
        let html = value ? marked(utils.preParse(value, channel)) : '';

        // 检查是否包含 mermaid 图表相关的 HTML 结构
        const hasMermaid = /<div[^>]*class="[^"]*mermaid[^"]*"[^>]*>|<pre[^>]*>.*?<code[^>]*class="[^"]*language-mermaid[^"]*"[^>]*>/.test(html);
        if (!hasMermaid) {
            console.log('No mermaid diagrams found.');
            return html;
        }
        
        // 延迟渲染 mermaid 图表（因为需要在 DOM 插入后才能渲染）
        _.delay(() => {
            if (window.mermaid) {
                try {
                    // 初始化 mermaid（如果还没初始化）
                    if (!window.mermaidInitialized) {
                        console.log('Mermaid version:', window.mermaid.version);
                        // 基本配置
                        window.mermaid.initialize({
                            flowchart: {
                                useMaxWidth: true
                            },
                            startOnLoad: false,          // 关闭自动渲染
                            securityLevel: 'loose',      // 宽松模式，兼容特殊字符
                            suppressErrorRendering: true,// 不渲染错误图表
                            suppressErrorDiagrams: true, // 隐藏报错红框
                            logLevel: 'warn',            // 减少日志
                            theme: 'neutral'             // 自然主题
                        });
                        window.mermaidInitialized = true;
                        console.log('Mermaid initialized');
                    }
                   
                    // 渲染 mermaid 图表
                    console.log('Render mermaid diagrams...');
                    const selector = item && item.id ? `.markdown-body[data-id="${item.id}"] .mermaid:not(:has(svg))` : '.markdown-body .mermaid:not(:has(svg))';
                    window.mermaid.run({
                        nodes: document.querySelectorAll(selector),
                        suppressErrors: true  // 关键：语法错也不炸
                    });
                    
                    // 备用渲染：延迟 200ms 后只对未渲染的图表进行二次渲染
                    setTimeout(() => {
                        window.mermaid.run({
                            nodes: document.querySelectorAll(selector),
                            suppressErrors: true  // 关键：语法错也不炸
                        });
                        // window.mermaid.init(undefined, document.querySelectorAll(selector));
                    }, 5000);
                    
                    // 为渲染后的图表添加工具栏
                    setTimeout(() => {
                        this.addMermaidToolbar();
                    }, 500);
                    
                } catch (error) {
                    console.error('Mermaid rendering error:', error);
                }
            }
        }, 0);
        
        return html;
    }
    
    // 为 mermaid 图表添加自定义工具栏
    addMermaidToolbar() {
        // 为每个 mermaid 图表添加工具栏
        document.querySelectorAll('.markdown-body .mermaid').forEach(mermaidElement => {
            // 检查是否已经添加了工具栏
            if (!mermaidElement.querySelector('.mermaid-toolbar')) {
                // 设置 mermaid 元素为相对定位和溢出隐藏，防止图表超出
                mermaidElement.style.position = 'relative';
                mermaidElement.style.overflow = 'hidden';
                
                // 设置 SVG 容器样式，支持拖拽
                const svg = mermaidElement.querySelector('svg');
                if (svg) {
                    // 存储当前的缩放和偏移状态
                    svg.dataset.scale = '1';
                    svg.dataset.translateX = '0';
                    svg.dataset.translateY = '0';
                    
                    // 设置 SVG 样式，支持拖拽
                    svg.style.cursor = 'grab';
                    svg.style.display = 'block';
                }
                
                // 创建工具栏容器
                const toolbar = document.createElement('div');
                toolbar.className = 'mermaid-toolbar';
                toolbar.style.cssText = `
                    position: absolute;
                    top: 4px;
                    right: 4px;
                    z-index: 100;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s, visibility 0.3s;
                `;
                
                // 使用 Semantic UI 小按钮组
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'ui icon buttons small';
                buttonGroup.style.cssText = 'box-shadow: 0 2px 8px rgba(0,0,0,0.1); background: white; border: 1px solid #e0e0e0; border-radius: 4px;';
                
                // 下载按钮（包含下拉菜单）
                const downloadButton = this.createDownloadButton(mermaidElement);
                buttonGroup.appendChild(downloadButton);
                
                // 添加其他工具按钮
                const buttons = [
                    { icon: 'zoom out', title: '缩小', action: this.zoomOut.bind(this, mermaidElement) },
                    { icon: 'zoom in', title: '放大', action: this.zoomIn.bind(this, mermaidElement) },
                    { icon: 'square outline', title: '适应页面', action: this.fitToPage.bind(this, mermaidElement) },
                    { icon: 'expand', title: '全屏查看', action: this.fullscreen.bind(this, mermaidElement) },
                    { icon: 'code', title: '查看代码', action: this.showMermaidSource.bind(this, mermaidElement) }
                ];
                
                const self = this; // 保存 this 引用
                buttons.forEach(button => {
                    const btn = document.createElement('button');
                    btn.className = 'ui button';
                    btn.style.backgroundColor = 'white';
                    btn.innerHTML = `<i class="icon ${button.icon}"></i>`;
                    btn.dataset.tooltipText = button.title;
                    // 添加自定义 tooltip 事件
                    btn.addEventListener('mouseenter', (e) => {
                        btn.style.backgroundColor = '#f0f0f0';
                        self.showCustomTooltip(e.target, button.title);
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.backgroundColor = 'white';
                        self.hideCustomTooltip();
                    });
                    btn.addEventListener('click', button.action);
                    buttonGroup.appendChild(btn);
                });
                
                toolbar.appendChild(buttonGroup);
                
                // 添加工具栏到 mermaid 元素
                mermaidElement.appendChild(toolbar);
                
                // 添加鼠标悬停事件
                mermaidElement.addEventListener('mouseenter', function() {
                    const toolbar = this.querySelector('.mermaid-toolbar');
                    if (toolbar) {
                        toolbar.style.opacity = '1';
                        toolbar.style.visibility = 'visible';
                    }
                });
                
                mermaidElement.addEventListener('mouseleave', function() {
                    const toolbar = this.querySelector('.mermaid-toolbar');
                    if (toolbar) {
                        // 检查鼠标是否在工具栏上
                        const toolbarRect = toolbar.getBoundingClientRect();
                        const mouseX = event.clientX;
                        const mouseY = event.clientY;
                        
                        if (!(mouseX >= toolbarRect.left && mouseX <= toolbarRect.right && 
                              mouseY >= toolbarRect.top && mouseY <= toolbarRect.bottom)) {
                            toolbar.style.opacity = '0';
                            toolbar.style.visibility = 'hidden';
                        }
                    }
                });
                
                // 工具栏本身的鼠标事件
                toolbar.addEventListener('mouseenter', function() {
                    this.style.opacity = '1';
                    this.style.visibility = 'visible';
                });
                
                toolbar.addEventListener('mouseleave', function() {
                    this.style.opacity = '0';
                    this.style.visibility = 'hidden';
                });
                
                // 初始化拖拽功能
                this.initDragFunctionality(mermaidElement);
            }
        });
    }
    
    // 初始化拖拽功能
    initDragFunctionality(element) {
        const svg = element.querySelector('svg');
        if (!svg) return;
        
        let isDragging = false;
        let startX, startY, startTranslateX, startTranslateY;
        let originalWidth, originalHeight;
        
        // 获取 SVG 原始尺寸
        const getSvgOriginalSize = () => {
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(' ');
                return { width: parseFloat(parts[2]), height: parseFloat(parts[3]) };
            }
            const bbox = svg.getBBox();
            return { width: bbox.width + bbox.x, height: bbox.height + bbox.y };
        };
        
        svg.addEventListener('mousedown', (e) => {
            const scale = parseFloat(svg.dataset.scale) || 1;
            // 只有放大时才允许拖拽
            if (scale > 1) {
                isDragging = true;
                svg.style.cursor = 'grabbing';
                startX = e.clientX;
                startY = e.clientY;
                startTranslateX = parseFloat(svg.dataset.translateX) || 0;
                startTranslateY = parseFloat(svg.dataset.translateY) || 0;
                
                // 保存原始尺寸
                const size = getSvgOriginalSize();
                originalWidth = size.width;
                originalHeight = size.height;
                
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                let newTranslateX = startTranslateX + dx;
                let newTranslateY = startTranslateY + dy;
                
                // 限制拖拽范围
                const scale = parseFloat(svg.dataset.scale) || 1;
                const maxTranslateX = (originalWidth * (scale - 1)) / 2;
                const maxTranslateY = (originalHeight * (scale - 1)) / 2;
                
                newTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
                newTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
                
                svg.dataset.translateX = newTranslateX;
                svg.dataset.translateY = newTranslateY;
                
                this.updateTransform(svg, scale, newTranslateX, newTranslateY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                svg.style.cursor = 'grab';
            }
        });
        
        // 鼠标滚轮缩放支持
        svg.addEventListener('wheel', (e) => {
            // 检查是否处于全屏模式
            const isFullscreen = document.fullscreenElement === element || 
                               document.mozFullScreenElement === element || 
                               document.webkitFullscreenElement === element || 
                               document.msFullscreenElement === element;
            
            // 全屏模式下直接缩放，非全屏模式需要按下 Ctrl 键或 Cmd 键
            if (isFullscreen || e.ctrlKey || e.metaKey) {
                e.preventDefault();
                
                // 根据滚轮滚动量计算缩放比例
                const delta = e.deltaY;
                const zoomFactor = 0.1; // 缩放灵敏度
                const scaleChange = 1 + (delta < 0 ? zoomFactor : -zoomFactor);
                
                const svgElement = element.querySelector('svg');
                if (svgElement) {
                    let scale = parseFloat(svgElement.dataset.scale) || 1;
                    let translateX = parseFloat(svgElement.dataset.translateX) || 0;
                    let translateY = parseFloat(svgElement.dataset.translateY) || 0;
                    
                    scale *= scaleChange;
                    scale = Math.max(0.5, Math.min(5, scale)); // 限制缩放范围
                    
                    // 如果缩小到 1 以下，重置偏移
                    if (scale <= 1) {
                        translateX = 0;
                        translateY = 0;
                        svgElement.dataset.translateX = 0;
                        svgElement.dataset.translateY = 0;
                    }
                    
                    svgElement.dataset.scale = scale;
                    this.updateTransform(svgElement, scale, translateX, translateY);
                }
            }
        }, { passive: false });
        
        // 触摸事件支持
        svg.addEventListener('touchstart', (e) => {
            const scale = parseFloat(svg.dataset.scale) || 1;
            if (scale > 1 && e.touches.length === 1) {
                isDragging = true;
                svg.style.cursor = 'grabbing';
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startTranslateX = parseFloat(svg.dataset.translateX) || 0;
                startTranslateY = parseFloat(svg.dataset.translateY) || 0;
                
                // 保存原始尺寸
                const size = getSvgOriginalSize();
                originalWidth = size.width;
                originalHeight = size.height;
                
                e.preventDefault();
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;
                
                let newTranslateX = startTranslateX + dx;
                let newTranslateY = startTranslateY + dy;
                
                const scale = parseFloat(svg.dataset.scale) || 1;
                const maxTranslateX = (originalWidth * (scale - 1)) / 2;
                const maxTranslateY = (originalHeight * (scale - 1)) / 2;
                
                newTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
                newTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));
                
                svg.dataset.translateX = newTranslateX;
                svg.dataset.translateY = newTranslateY;
                
                this.updateTransform(svg, scale, newTranslateX, newTranslateY);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                svg.style.cursor = 'grab';
            }
        });
    }
    
    // 更新 SVG transform
    updateTransform(svg, scale, translateX, translateY) {
        svg.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
        svg.style.transformOrigin = 'center center';
    }
    
    // 放大
    zoomIn(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            let scale = parseFloat(svg.dataset.scale) || 1;
            const translateX = parseFloat(svg.dataset.translateX) || 0;
            const translateY = parseFloat(svg.dataset.translateY) || 0;
            
            scale = Math.min(scale * 1.2, 5); // 最大放大到 5 倍
            svg.dataset.scale = scale;
            
            this.updateTransform(svg, scale, translateX, translateY);
        }
    }
    
    // 缩小
    zoomOut(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            let scale = parseFloat(svg.dataset.scale) || 1;
            let translateX = parseFloat(svg.dataset.translateX) || 0;
            let translateY = parseFloat(svg.dataset.translateY) || 0;
            
            scale = Math.max(scale / 1.2, 0.5); // 最小缩小到 0.5 倍
            
            // 如果缩小到 1 以下，重置偏移
            if (scale <= 1) {
                translateX = 0;
                translateY = 0;
                svg.dataset.translateX = 0;
                svg.dataset.translateY = 0;
            }
            
            svg.dataset.scale = scale;
            
            this.updateTransform(svg, scale, translateX, translateY);
        }
    }
    
    // 适应页面
    fitToPage(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            svg.dataset.scale = 1;
            svg.dataset.translateX = 0;
            svg.dataset.translateY = 0;
            this.updateTransform(svg, 1, 0, 0);
        }
    }
    
    // 创建下载按钮（包含下拉菜单）
    createDownloadButton(element) {
        const downloadButton = document.createElement('div');
        downloadButton.className = 'ui button';
        downloadButton.style.cssText = 'position: relative; background: white;';
        // 添加鼠标悬停效果
        downloadButton.addEventListener('mouseenter', () => {
            downloadButton.style.backgroundColor = '#f0f0f0';
        });
        downloadButton.addEventListener('mouseleave', () => {
            downloadButton.style.backgroundColor = 'white';
        });
        
        const btn = document.createElement('i');
        btn.className = 'icon download';
        
        // 下拉菜单
        const dropdown = document.createElement('div');
        dropdown.className = 'mermaid-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 8px 0;
            margin-top: 4px;
            z-index: 101;
            display: none;
            min-width: 120px;
        `;
        
        // 下载图片选项
        const downloadOption = document.createElement('div');
        downloadOption.textContent = '下载图片';
        downloadOption.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 400;
        `;
        downloadOption.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f5f5';
        });
        downloadOption.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        downloadOption.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = 'none';
            this.downloadMermaid(element);
        });
        dropdown.appendChild(downloadOption);
        
        // 复制图片选项
        const copyOption = document.createElement('div');
        copyOption.textContent = '复制图片';
        copyOption.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 400;
        `;
        copyOption.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f5f5';
        });
        copyOption.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        copyOption.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = 'none';
            this.copyMermaid(element);
        });
        dropdown.appendChild(copyOption);
        
        downloadButton.appendChild(btn);
        downloadButton.appendChild(dropdown);
        
        // 存储下拉菜单的显示状态
        let dropdownTimeout;
        
        // 鼠标悬停效果
        downloadButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f0f0f0';
            // 清除之前的定时器
            clearTimeout(dropdownTimeout);
            // 鼠标悬停时显示下拉菜单
            dropdown.style.display = 'block';
        });
        downloadButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'white';
            // 延迟隐藏下拉菜单，给鼠标时间移动到下拉菜单
            dropdownTimeout = setTimeout(function() {
                dropdown.style.display = 'none';
            }, 200);
        });
        
        // 下拉菜单本身的鼠标事件
        dropdown.addEventListener('mouseenter', function() {
            // 清除定时器，保持下拉菜单显示
            clearTimeout(dropdownTimeout);
            this.style.display = 'block';
        });
        dropdown.addEventListener('mouseleave', function() {
            // 鼠标离开下拉菜单时隐藏
            this.style.display = 'none';
        });
        
        return downloadButton;
    }
    
    // 获取 SVG 尺寸
    getSvgDimensions(svg) {
        const bbox = svg.getBBox();
        const viewBox = svg.getAttribute('viewBox');
        
        let width, height;
        
        if (viewBox) {
            const parts = viewBox.split(' ');
            width = parseFloat(parts[2]);
            height = parseFloat(parts[3]);
        } else {
            width = parseFloat(svg.getAttribute('width')) || bbox.width + bbox.x;
            height = parseFloat(svg.getAttribute('height')) || bbox.height + bbox.y;
        }
        
        return {
            width: Math.max(width, bbox.width + bbox.x),
            height: Math.max(height, bbox.height + bbox.y),
            bbox: bbox
        };
    }
    
    // 导出 SVG 为图片
    exportSvgToImage(svg, scale, callback, errorCallback) {
        // 复制 SVG 以避免修改原始元素
        const svgCopy = svg.cloneNode(true);
        
        // 保存原始的 transform 样式
        const originalTransform = svg.style.transform;
        const originalTransformOrigin = svg.style.transformOrigin;
        
        // 临时移除 transform 以获取完整的 SVG 内容尺寸
        svgCopy.style.transform = '';
        svgCopy.style.transformOrigin = '';
        
        // 获取 SVG 尺寸
        const dims = this.getSvgDimensions(svg);
        
        // 设置 SVG 的宽度和高度
        svgCopy.setAttribute('width', dims.width);
        svgCopy.setAttribute('height', dims.height);
        
        // 确保 viewBox 正确
        if (!svgCopy.getAttribute('viewBox')) {
            svgCopy.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);
        }
        
        // 为 SVG 添加白色背景
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'white');
        svgCopy.insertBefore(rect, svgCopy.firstChild);
        
        // 获取 SVG 数据并转换为 base64
        const svgData = new XMLSerializer().serializeToString(svgCopy);
        const base64 = btoa(unescape(encodeURIComponent(svgData)));
        const dataUrl = `data:image/svg+xml;base64,${base64}`;
        
        const img = new Image();
        
        img.onload = () => {
            try {
                // 创建画布
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 设置高分辨率
                const scaledWidth = dims.width * scale;
                const scaledHeight = dims.height * scale;
                
                canvas.width = scaledWidth;
                canvas.height = scaledHeight;
                
                // 填充白色背景
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, scaledWidth, scaledHeight);
                
                // 绘制 SVG
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);
                
                // 回调
                callback(canvas);
            } catch (e) {
                console.error('Canvas export error:', e);
                toastr.error('图片导出失败');
            }
        };
        
        img.onerror = () => {
            console.error('Failed to load SVG');
            if (errorCallback) errorCallback();
        };
        
        img.src = dataUrl;
    }
    
    // 下载图片
    downloadMermaid(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            this.exportSvgToImage(svg, 4, (canvas) => {
                const pngData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'mermaid-chart.png';
                link.href = pngData;
                link.click();
            }, () => {
                toastr.error('图片导出失败');
            });
        }
    }
    
    // 复制图片
    copyMermaid(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            // 使用 4x 缩放提高清晰度
            this.exportSvgToImage(svg, 4, (canvas) => {
                try {
                    canvas.toBlob((blob) => {
                        if (blob) {
                            navigator.clipboard.write([new ClipboardItem({
                                'image/png': blob
                            })]).then(() => {
                                toastr.success('图片已复制到剪贴板');
                            }).catch((err) => {
                                console.error('复制失败:', err);
                                toastr.error('复制图片失败');
                            });
                        }
                    });
                } catch (e) {
                    console.error('复制图片失败:', e);
                    toastr.error('复制图片失败');
                }
            }, () => {
                toastr.error('复制图片失败，请尝试下载');
            });
        }
    }
    
    // 全屏
    fullscreen(element) {
        // 设置全屏时的背景色
        element.style.backgroundColor = 'white';
        // 设置全屏时的居中样式
        element.style.display = 'flex';
        element.style.justifyContent = 'center';
        element.style.alignItems = 'center';
        element.style.height = '100vh';
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
        
        // 监听全屏变化
        this.handleFullscreenChange(element);
    }
    
    // 处理全屏状态变化
    handleFullscreenChange(element) {
        const onFullscreenChange = () => {
            if (!document.fullscreenElement && !document.mozFullScreenElement &&
                !document.webkitFullscreenElement && !document.msFullscreenElement) {
                // 退出全屏时恢复背景色和样式
                element.style.backgroundColor = '';
                element.style.display = '';
                element.style.justifyContent = '';
                element.style.alignItems = '';
                element.style.height = '';
                this.updateFullscreenButton(element, false);
            } else {
                // 进入全屏时更新图标
                this.updateFullscreenButton(element, true);
            }
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('mozfullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('MSFullscreenChange', onFullscreenChange);
    }
    
    // 更新全屏按钮状态
    updateFullscreenButton(element, isFullscreen) {
        const buttonGroup = element.querySelector('.mermaid-toolbar .ui.buttons');
        if (!buttonGroup) return;
        
        const buttons = buttonGroup.querySelectorAll('button.ui.button');
        const fullscreenBtn = buttons[buttons.length - 1]; // 全屏按钮在最后一个位置
        
        if (fullscreenBtn) {
            if (isFullscreen) {
                // 全屏状态，显示退出图标
                fullscreenBtn.innerHTML = '<i class="icon compress"></i>';
                fullscreenBtn.dataset.tooltipText = '退出全屏';
                fullscreenBtn.title = '退出全屏';
            } else {
                // 非全屏状态，显示全屏图标
                fullscreenBtn.innerHTML = '<i class="icon expand"></i>';
                fullscreenBtn.dataset.tooltipText = '全屏查看';
                fullscreenBtn.title = '全屏查看';
            }
        }
    }
    
    // 退出全屏
    exitFullscreen(element) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        // 恢复背景色
        element.style.backgroundColor = '';

        // 恢复图标
        this.updateFullscreenButton(element, false);
    }
    
    // 显示 mermaid 源代码（在原区域显示）
    showMermaidSource(element) {
        // 检查是否已经在查看源代码模式
        if (element.dataset.sourceMode === 'true') {
            return;
        }
        
        // 获取源代码
        const sourceCode = element.getAttribute('data-source') || '';
        
        // 获取并保存工具栏
        const toolbar = element.querySelector('.mermaid-toolbar');
        const svg = element.querySelector('svg');
        
        // 保存原状态
        element.dataset.sourceMode = 'true';
        if (svg) {
            element.dataset.originalSvgDisplay = svg.style.display;
        }
        
        // 临时移除 overflow: hidden，确保源码能显示
        if (!element.dataset.originalOverflow) {
            element.dataset.originalOverflow = element.style.overflow;
            element.style.overflow = 'visible';
        }
        
        // 隐藏原图表
        if (svg) {
            svg.style.display = 'none';
        }
        
        // 隐藏原工具栏
        if (toolbar) {
            toolbar.style.display = 'none';
        }
        
        // 检查是否已经有源代码容器
        let sourceContainer = element.querySelector('.mermaid-source-container');
        if (!sourceContainer) {
            // 创建源代码容器
            sourceContainer = document.createElement('div');
            sourceContainer.className = 'mermaid-source-container';
            sourceContainer.style.cssText = `
                width: 100%;
                min-height: 200px;
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 16px;
                overflow: auto;
                position: relative;
                z-index: 1;
            `;
            
            // 创建代码显示
            const codeElement = document.createElement('pre');
            codeElement.style.cssText = `
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 13px;
                line-height: 1.6;
                color: #374151;
            `;
            codeElement.textContent = sourceCode;
            
            sourceContainer.appendChild(codeElement);
            element.insertBefore(sourceContainer, svg);
        } else {
            // 显示已存在的源代码容器
            sourceContainer.style.display = 'block';
        }
        
        // 创建临时工具栏
        this.createTempToolbar(element, sourceCode);
    }
    
    // 创建临时工具栏
    createTempToolbar(element, sourceCode) {
        // 移除已存在的临时工具栏
        const existingTempToolbar = element.querySelector('.mermaid-temp-toolbar');
        if (existingTempToolbar) {
            existingTempToolbar.remove();
        }
        
        // 创建临时工具栏 - 立即显示
        const tempToolbar = document.createElement('div');
        tempToolbar.className = 'mermaid-temp-toolbar';
        tempToolbar.style.cssText = `
            position: absolute;
            top: 4px;
            right: 4px;
            z-index: 100;
            opacity: 1;
            visibility: visible;
            transition: opacity 0.3s, visibility 0.3s;
        `;
        
        // 标记是否已经进入悬停模式
        let hoverMode = false;
        
        // 保存事件监听器的引用，方便后续移除
        const showTempToolbar = function() {
            if (element.dataset.sourceMode === 'true') {
                tempToolbar.style.opacity = '1';
                tempToolbar.style.visibility = 'visible';
            }
        };
        
        const hideTempToolbar = function() {
            if (element.dataset.sourceMode === 'true' && hoverMode) {
                tempToolbar.style.opacity = '0';
                tempToolbar.style.visibility = 'hidden';
            }
        };
        
        const keepToolbarVisible = function() {
            tempToolbar.style.opacity = '1';
            tempToolbar.style.visibility = 'visible';
        };
        
        const checkToolbarHover = function() {
            const isStillHovering = element.matches(':hover');
            if (!isStillHovering && hoverMode) {
                tempToolbar.style.opacity = '0';
                tempToolbar.style.visibility = 'hidden';
            }
        };
        
        // 保存监听器引用到元素上
        element._mermaidShowHandler = showTempToolbar;
        element._mermaidHideHandler = hideTempToolbar;
        tempToolbar._mermaidKeepVisible = keepToolbarVisible;
        tempToolbar._mermaidCheckHover = checkToolbarHover;
        
        // 2秒后自动隐藏工具栏，进入悬停模式
        setTimeout(() => {
            if (element.dataset.sourceMode === 'true') {
                hoverMode = true;
                const isHovering = element.matches(':hover');
                if (!isHovering) {
                    tempToolbar.style.opacity = '0';
                    tempToolbar.style.visibility = 'hidden';
                }
            }
        }, 2000);
        
        // 鼠标悬停显示工具栏
        element.addEventListener('mouseenter', showTempToolbar);
        
        // 鼠标离开隐藏工具栏
        element.addEventListener('mouseleave', hideTempToolbar);
        
        // 鼠标悬停在工具栏上也要保持显示
        tempToolbar.addEventListener('mouseenter', keepToolbarVisible);
        
        tempToolbar.addEventListener('mouseleave', checkToolbarHover);
        
        // 创建新的按钮组
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'ui icon buttons small';
        buttonGroup.style.cssText = 'box-shadow: 0 2px 8px rgba(0,0,0,0.1); background: white; border: 1px solid #e0e0e0; border-radius: 4px;';
        
        // 复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'ui button';
        copyBtn.style.backgroundColor = 'white';
        copyBtn.innerHTML = '<i class="icon copy"></i>';
        copyBtn.dataset.tooltipText = '复制代码';
        copyBtn.addEventListener('mouseenter', (e) => {
            copyBtn.style.backgroundColor = '#f0f0f0';
            this.showCustomTooltip(e.target, '复制代码');
        });
        copyBtn.addEventListener('mouseleave', () => {
            copyBtn.style.backgroundColor = 'white';
            this.hideCustomTooltip();
        });
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyMermaidSourceInline(sourceCode, copyBtn);
        });
        
        // 预览按钮
        const previewBtn = document.createElement('button');
        previewBtn.className = 'ui button';
        previewBtn.style.backgroundColor = 'white';
        previewBtn.innerHTML = '<i class="icon eye"></i>';
        previewBtn.dataset.tooltipText = '预览图表';
        previewBtn.addEventListener('mouseenter', (e) => {
            previewBtn.style.backgroundColor = '#f0f0f0';
            this.showCustomTooltip(e.target, '预览图表');
        });
        previewBtn.addEventListener('mouseleave', () => {
            previewBtn.style.backgroundColor = 'white';
            this.hideCustomTooltip();
        });
        previewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideMermaidSource(element);
        });
        
        buttonGroup.appendChild(copyBtn);
        buttonGroup.appendChild(previewBtn);
        tempToolbar.appendChild(buttonGroup);
        element.appendChild(tempToolbar);
    }
    
    // 隐藏 mermaid 源代码，恢复图表
    hideMermaidSource(element) {
        if (element.dataset.sourceMode !== 'true') {
            return;
        }
        
        // 隐藏源代码容器
        const sourceContainer = element.querySelector('.mermaid-source-container');
        if (sourceContainer) {
            sourceContainer.style.display = 'none';
        }
        
        // 移除临时工具栏和事件监听器
        const tempToolbar = element.querySelector('.mermaid-temp-toolbar');
        if (tempToolbar) {
            // 移除事件监听器
            if (element._mermaidShowHandler) {
                element.removeEventListener('mouseenter', element._mermaidShowHandler);
                delete element._mermaidShowHandler;
            }
            if (element._mermaidHideHandler) {
                element.removeEventListener('mouseleave', element._mermaidHideHandler);
                delete element._mermaidHideHandler;
            }
            if (tempToolbar._mermaidKeepVisible) {
                tempToolbar.removeEventListener('mouseenter', tempToolbar._mermaidKeepVisible);
                delete tempToolbar._mermaidKeepVisible;
            }
            if (tempToolbar._mermaidCheckHover) {
                tempToolbar.removeEventListener('mouseleave', tempToolbar._mermaidCheckHover);
                delete tempToolbar._mermaidCheckHover;
            }
            tempToolbar.remove();
        }
        
        // 恢复 overflow
        if (element.dataset.originalOverflow !== undefined) {
            element.style.overflow = element.dataset.originalOverflow;
        }
        
        // 恢复原图表
        const svg = element.querySelector('svg');
        if (svg && element.dataset.originalSvgDisplay) {
            svg.style.display = element.dataset.originalSvgDisplay;
        } else if (svg) {
            svg.style.display = 'block';
        }
        
        // 恢复原工具栏
        const toolbar = element.querySelector('.mermaid-toolbar');
        if (toolbar) {
            toolbar.style.display = '';
            // 临时显示工具栏，让用户看到
            toolbar.style.opacity = '1';
            toolbar.style.visibility = 'visible';
            // 2秒后恢复原来的悬停显示效果
            setTimeout(() => {
                toolbar.style.opacity = '';
                toolbar.style.visibility = '';
            }, 2000);
        }
        
        // 清除状态
        element.dataset.sourceMode = 'false';
        delete element.dataset.originalSvgDisplay;
        delete element.dataset.originalOverflow;
        
        // 重新初始化拖拽功能
        this.initDragFunctionality(element);
    }
    
    // 复制 mermaid 源代码（内联模式）
    copyMermaidSourceInline(sourceCode, button) {
        const originalHTML = button.innerHTML;
        
        // 使用 Clipboard API 复制
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sourceCode)
                .then(() => {
                    button.innerHTML = '<i class="icon checkmark"></i>';
                    button.dataset.tooltipText = '已复制';
                    // 如果 tooltip 当前正在显示，立即更新文本
                    if (this.customTooltip) {
                        this.customTooltip.textContent = '已复制';
                    }
                    setTimeout(() => {
                        button.innerHTML = originalHTML;
                        button.dataset.tooltipText = '复制代码';
                    }, 2000);
                })
                .catch(() => {
                    this.copyFallbackInline(sourceCode, button, originalHTML);
                });
        } else {
            // 降级方案
            this.copyFallbackInline(sourceCode, button, originalHTML);
        }
    }
    
    // 复制降级方案（内联模式）
    copyFallbackInline(sourceCode, button, originalHTML) {
        const textArea = document.createElement('textarea');
        textArea.value = sourceCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                button.innerHTML = '<i class="icon checkmark"></i>';
                button.dataset.tooltipText = '已复制';
                // 如果 tooltip 当前正在显示，立即更新文本
                if (this.customTooltip) {
                    this.customTooltip.textContent = '已复制';
                }
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.dataset.tooltipText = '复制代码';
                }, 2000);
            } else {
                toastr.error('复制失败，请手动复制');
            }
        } catch (err) {
            toastr.error('复制失败，请手动复制');
        }
        
        document.body.removeChild(textArea);
    }
    
    // 自定义 tooltip 元素
    customTooltip = null;
    
    // 显示自定义 tooltip
    showCustomTooltip(element, text) {
        // 如果已有 tooltip，先移除
        this.hideCustomTooltip();
        
        // 确保 element 可能是内部的 icon 元素，需要获取按钮元素
        let buttonElement = element;
        while (buttonElement) {
            if (buttonElement.classList && 
                (buttonElement.classList.contains('ui') || buttonElement.classList.contains('button'))) {
                break;
            }
            buttonElement = buttonElement.parentElement;
        }
        if (!buttonElement) {
            buttonElement = element;
        }
        
        // 创建 tooltip 元素
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-mermaid-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: #1b1c1d;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 9999;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            visibility: hidden;
        `;
        tooltip.textContent = text;
        
        // 添加小箭头
        const arrow = document.createElement('div');
        arrow.style.cssText = `
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #1b1c1d;
        `;
        tooltip.appendChild(arrow);
        
        // 添加 tooltip 到 body
        document.body.appendChild(tooltip);
        this.customTooltip = tooltip;
        
        // 计算并设置 tooltip 位置
        const rect = buttonElement.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // 计算水平居中位置
        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // 计算垂直位置（在元素上方）
        const top = rect.top - tooltipRect.height - 8;
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.visibility = 'visible';
    }
    
    // 隐藏自定义 tooltip
    hideCustomTooltip() {
        if (this.customTooltip) {
            this.customTooltip.remove();
            this.customTooltip = null;
        }
    }
}

/**
 * 在线状态值转换器
 */
export class OnlineValueConverter {
    toView(value, onlines) {
        if (!value || !onlines) return '';
        return _.some(onlines, { username: value.username }) ? '(在线)' : '';
    }
}

export class SortValueConverter {
    toView(value, prop, reverse = false) {
        return _.isArray(value) ? (!reverse ? _.sortBy(value, prop) : _.reverse(_.sortBy(value, prop))) : value;
    }
}

export class SortBlogValueConverter {
    toView(value, prop = 'title') {

        if (!_.isArray(value) || value.length == 0) return value;

        if (_.some(value, item => !_.isNil(item.sort))) { // 数组中任意一个元素包含sort值，表示排过序
            return _.sortBy(value, ['sort', prop]);
        }

        return _.sortBy(value, prop);
    }
}

export class SortTodoValueConverter {
    toView(value, prop = "createDate") {
        if (_.isArray(value)) {
            return _.sortBy(value, ['sortIndex', function (o) {
                return -o[prop];
            }]);
        }
        return value;
    }
}

export class HasPropValueConverter {
    toView(value, prop) {
        return _.filter(value, item => !_.isNil(item[prop]));
    }
}

export class TakeValueConverter {
    toView(value, count, tail = false) {
        return _.isArray(value) ? (!tail ? _.take(value, count) : _.takeRight(value, count)) : value;
    }
}

export class SortUsersValueConverter {
    toView(value, username) {
        if (_.isArray(value) && username) {
            let user = _.find(value, { username: username });
            if (user) {
                return [user, ..._.sortBy(_.reject(value, { username: username }), ['onlineStatus', 'name'])];
            }
        }
        return value;
    }
}

export class SortUsers2ValueConverter {
    toView(value, username) {
        if (_.isArray(value) && username) {
            let user = _.find(value, { username: username });
            let users = _.filter(value, item => {
                return (item.newMsgCnt > 0) && (item.username != username);
            });
            users = _.reverse(_.sortBy(users, 'newMsgCnt'));
            if (user) {
                users = [user, ...users];
            }
            if (users && users.length > 0) {
                return [...users, ..._.sortBy(_.reject(value, item => {
                    return ((item.username == username) || (item.newMsgCnt > 0));
                }), ['onlineStatus', 'name'])];
            }
        }
        return value;
    }
}

export class SortUsernamesValueConverter {
    toView(value, username) {
        if (_.isArray(value) && username) {
            if (_.includes(value, username)) {
                return [username, ..._.without(value, username)];
            }
        }
        return value;
    }
}

export class SortChannelsValueConverter {
    toView(value) {
        if (_.isArray(value)) {
            let channelAll = _.find(value, { name: 'all' });
            if (channelAll) {
                return [channelAll, ..._.reject(value, { name: 'all' })]
            }
        }
        return value;
    }
}

export class UserNameValueConverter {
    toView(value) {
        let user = _.find(window.tmsUsers, { username: value });
        if (user) {
            return user.name;
        }
        return value;
    }
}

export class EmojiValueConverter {
    toView(value, mkbodyDom) {
        if (emojify) {
            _.defer(() => {
                emojify.run(mkbodyDom);
            });
        }
        return value;
    }
}

export class EmojiReplValueConverter {
    toView(value) {
        return emojify.replace(value);
    }
}

export class ChatLabelExistValueConverter {
    toView(chatLabels, type) {
        if (chatLabels && chatLabels.length != 0) {
            if (_.some(chatLabels, cl => (type ? cl.type == type : true) && cl.voters.length != 0)) {
                return '';
            }
        }
        return 'none';
    }
}

export class ChatLabelTipValueConverter {
    toView(chatLabel) {
        let vs = _.map(chatLabel.voters, v => v.name ? v.name : v.username);
        return `${_.join(vs, ',')}${vs.length}人${chatLabel.type == 'Emoji' ? '表示了' : '标记了'} [${chatLabel.type == 'Emoji' ? chatLabel.description : chatLabel.name}]`
    }
}

export class ChatLabelFilterValueConverter {
    toView(chatLabels, type = 'Emoji') {
        return _.filter(chatLabels, { type: type });
    }
}

export class FilterValueConverter {
    toView(items, search, prop = null) {
        let _search = _.toUpper(search);
        return _.filter(items, (item) => {
            if (!prop) {
                return _.includes(_.toUpper(item), _search);
            } else {
                return _.includes(_.toUpper(item[prop]), _search);
            }
        });
    }
}

export class CountValueConverter {
    toView(items, search, prop = null) {
        return _.size(_.filter(items, (item) => {
            if (!prop) {
                return _.includes(item, search);
            } else {
                return _.includes(item[prop], search);
            }
        }));
    }
}

export class LabelColorValueConverter {

    toView(chatLabel) {
        let tag = _.find(tags, { value: chatLabel.name });
        return tag ? tag.color : '';
    }
}

export class LabelCssValueConverter {

    toView(chatLabel) {
        let cs = colorHash.rgb(chatLabel.name);
        let bgColor = `rgba(${cs[0]}, ${cs[1]}, ${cs[2]}, 0.6)`;
        let color = `rgba(${255 - cs[0]}, ${255 - cs[1]}, ${255 - cs[2]}, 1)`;

        let tag = _.find(tags, { value: chatLabel.name });
        return !tag ? { "background-color": bgColor, "color": color } : '';
    }
}

export class Nl2brValueConverter {
    toView(value) {
        if (value) {
            return _.replace(value, /\n/g, '<br/>');
        }
        return value;
    }
}

export class DiffHtmlValueConverter {
    toView(value, allowedTags, allowedAttributes) {
        if (value) {
            return utils.diffHtml(value);
        }
        return '';
    }
}

export class UaValueConverter {
    toView(value) {
        if (value) {

            var ua = new UA(value);
            let type = ua.device.type;
            if (type === 'mobile') {
                return 'mobile';
            } else if (type === 'tablet') {
                return 'tablet';
            } else if (type === 'desktop') {
                return 'laptop';
            }
        }
        return 'laptop';
    }
}

export class Ua2ValueConverter {
    toView(value) {

        let s = '';
        if (value) {

            var ua = new UA(value);
            let type = ua.device.type;
            if (type === 'mobile') {
                s = `手机`;
            } else if (type === 'tablet') {
                s = '平板';
            } else if (type === 'desktop') {
                s = '电脑';
            }
        }
        return `${s} (${ua.device.manufacturer ? ua.device.manufacturer + ' ' : ''}${ua.device.model ? ua.device.model + ' ' : ''}${ua.os.name} ${ua.browser.name}[${ua.engine.name}])`;
    }
}

export class CanDelLblValueConverter {
    toView(item, loginUser) {
        let hasMe = _.some(item.voters, { username: loginUser.username });

        return hasMe;
    }
}

export class CanDelLblClsValueConverter {
    toView(item, loginUser) {
        let hasMe = _.some(item.voters, { username: loginUser.username });

        return hasMe ? 'can-del' : 'can-not-del';
    }
}