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
    toView(value, channel = null, editor = null) {
        if (editor == 'Html') {
            return value ? value : '';
        }
        let html = value ? marked(utils.preParse(value, channel)) : '';
        
        // 延迟渲染 mermaid 图表（因为需要在 DOM 插入后才能渲染）
        _.defer(() => {
            if (window.mermaid) {
                try {
                    // 初始化 mermaid（如果还没初始化）
                    if (!window.mermaidInitialized) {
                        console.log('Mermaid version:', window.mermaid.version);
                        // 基本配置
                        window.mermaid.initialize({
                            startOnLoad: false,
                            theme: 'neutral',
                            securityLevel: 'loose',
                            flowchart: {
                                useMaxWidth: true
                            }
                        });
                        window.mermaidInitialized = true;
                        console.log('Mermaid initialized');
                    }
                    
                    // 只处理尚未渲染的 mermaid 元素
                    const mermaidElements = document.querySelectorAll('.markdown-body .mermaid');
                    console.log('Found mermaid elements:', mermaidElements.length);
                    
                    mermaidElements.forEach(element => {
                        // 检查是否已经渲染（有 SVG 子元素）
                        if (!element.querySelector('svg')) {
                            console.log('Processing mermaid element:', element);
                            // 清理 HTML 标签
                            const text = element.textContent;
                            element.textContent = text;
                        }
                    });
                    
                    // 渲染 mermaid 图表
                    if (window.mermaid.run) {
                        console.log('Using mermaid.run()');
                        window.mermaid.run();
                    } else if (window.mermaid.init) {
                        console.log('Using mermaid.init()');
                        window.mermaid.init(undefined, '.markdown-body .mermaid');
                    }
                    
                    // 为渲染后的图表添加工具栏
                    setTimeout(() => {
                        this.addMermaidToolbar();
                    }, 100);
                    
                } catch (error) {
                    console.error('Mermaid rendering error:', error);
                }
            }
        });
        
        return html;
    }
    
    // 为 mermaid 图表添加自定义工具栏
    addMermaidToolbar() {
        // 为每个 mermaid 图表添加工具栏
        document.querySelectorAll('.markdown-body .mermaid').forEach(mermaidElement => {
            // 检查是否已经添加了工具栏
            if (!mermaidElement.querySelector('.mermaid-toolbar')) {
                // 设置 mermaid 元素为相对定位
                mermaidElement.style.position = 'relative';
                
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
                
                // 使用 Semantic UI 按钮组
                const buttonGroup = document.createElement('div');
                buttonGroup.className = 'ui small icon buttons';
                buttonGroup.style.cssText = 'box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                
                // 下载按钮（包含下拉菜单）
                const downloadButton = this.createDownloadButton(mermaidElement);
                buttonGroup.appendChild(downloadButton);
                
                // 添加其他工具按钮
                const buttons = [
                    { icon: 'zoom out', title: '缩小', action: this.zoomOut.bind(this, mermaidElement) },
                    { icon: 'zoom in', title: '放大', action: this.zoomIn.bind(this, mermaidElement) },
                    { icon: 'compress', title: '适应页面', action: this.fitToPage.bind(this, mermaidElement) },
                    { icon: 'expand', title: '全屏', action: this.fullscreen.bind(this, mermaidElement) }
                ];
                
                buttons.forEach(button => {
                    const btn = document.createElement('button');
                    btn.className = 'ui button';
                    btn.innerHTML = `<i class="icon ${button.icon}"></i>`;
                    btn.title = button.title;
                    btn.addEventListener('click', button.action);
                    buttonGroup.appendChild(btn);
                });
                
                // 查看代码按钮
                const viewCodeBtn = document.createElement('button');
                viewCodeBtn.className = 'ui button';
                viewCodeBtn.innerHTML = '<i class="icon code"></i> 代码';
                viewCodeBtn.title = '查看代码';
                viewCodeBtn.addEventListener('click', this.viewCode.bind(this, mermaidElement));
                buttonGroup.appendChild(viewCodeBtn);
                
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
            }
        });
    }
    
    // 创建下载按钮（包含下拉菜单）
    createDownloadButton(element) {
        const downloadButton = document.createElement('div');
        downloadButton.className = 'ui button';
        downloadButton.style.cssText = 'position: relative;';
        
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
            padding: 6px 16px;
            cursor: pointer;
            font-size: 14px;
        `;
        downloadOption.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f5f5';
        });
        downloadOption.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        downloadOption.addEventListener('click', this.downloadMermaid.bind(this, element));
        dropdown.appendChild(downloadOption);
        
        // 复制图片选项
        const copyOption = document.createElement('div');
        copyOption.textContent = '复制图片';
        copyOption.style.cssText = `
            padding: 6px 16px;
            cursor: pointer;
            font-size: 14px;
        `;
        copyOption.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f5f5';
        });
        copyOption.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        copyOption.addEventListener('click', this.copyMermaid.bind(this, element));
        dropdown.appendChild(copyOption);
        
        downloadButton.appendChild(btn);
        downloadButton.appendChild(dropdown);
        
        // 点击按钮显示/隐藏下拉菜单
        downloadButton.addEventListener('click', function(e) {
            e.stopPropagation();
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                dropdown.style.display = 'block';
            }
        });
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', function() {
            const dropdowns = document.querySelectorAll('.mermaid-dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
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
        
        // 使用 getBoundingClientRect 获取渲染后的实际尺寸
        const rect = svg.getBoundingClientRect();
        
        return {
            width: Math.max(width, bbox.width + bbox.x, rect.width),
            height: Math.max(height, bbox.height + bbox.y, rect.height),
            bbox: bbox
        };
    }
    
    // 导出 SVG 为图片
    exportSvgToImage(svg, scale, callback) {
        // 复制 SVG 以避免修改原始元素
        const svgCopy = svg.cloneNode(true);
        
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
        
        // 获取 SVG 数据
        const svgData = new XMLSerializer().serializeToString(svgCopy);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
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
            
            // 清理
            URL.revokeObjectURL(svgUrl);
            
            // 回调
            callback(canvas);
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            console.error('Failed to load SVG');
        };
        
        img.src = svgUrl;
    }
    
    // 下载图片
    downloadMermaid(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            // 使用 4x 缩放提高清晰度
            this.exportSvgToImage(svg, 4, (canvas) => {
                const pngData = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'mermaid-chart.png';
                link.href = pngData;
                link.click();
            });
        }
    }
    
    // 复制图片
    copyMermaid(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            // 使用 4x 缩放提高清晰度
            this.exportSvgToImage(svg, 4, (canvas) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        navigator.clipboard.write([new ClipboardItem({
                            'image/png': blob
                        })]).then(() => {
                            // 复制成功提示
                            const notification = document.createElement('div');
                            notification.textContent = '图片已复制到剪贴板';
                            notification.style.cssText = `
                                position: fixed;
                                top: 20px;
                                right: 20px;
                                background: #28a745;
                                color: white;
                                padding: 10px 16px;
                                border-radius: 4px;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                z-index: 9999;
                                font-size: 14px;
                            `;
                            document.body.appendChild(notification);
                            
                            setTimeout(() => {
                                notification.style.opacity = '0';
                                notification.style.transition = 'opacity 0.3s';
                                setTimeout(() => {
                                    document.body.removeChild(notification);
                                }, 300);
                            }, 2000);
                        }).catch((err) => {
                            console.error('复制失败:', err);
                        });
                    }
                });
            });
        }
    }
    
    // 放大
    zoomIn(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            const currentTransform = svg.style.transform || 'scale(1)';
            const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)[1]) || 1;
            const newScale = currentScale * 1.2;
            svg.style.transform = `scale(${newScale})`;
            svg.style.transformOrigin = 'center center';
        }
    }
    
    // 缩小
    zoomOut(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            const currentTransform = svg.style.transform || 'scale(1)';
            const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)[1]) || 1;
            const newScale = Math.max(0.5, currentScale / 1.2);
            svg.style.transform = `scale(${newScale})`;
            svg.style.transformOrigin = 'center center';
        }
    }
    
    // 适应页面
    fitToPage(element) {
        const svg = element.querySelector('svg');
        if (svg) {
            svg.style.transform = 'scale(1)';
            svg.style.transformOrigin = 'center center';
        }
    }
    
    // 全屏
    fullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    
    // 查看代码
    viewCode(element) {
        const originalCode = element.textContent;
        const codeElement = document.createElement('pre');
        codeElement.style.cssText = `
            background: #f5f5f5;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin: 10px 0;
            white-space: pre-wrap;
            font-family: monospace;
        `;
        codeElement.textContent = originalCode;
        
        // 替换内容为代码
        const originalContent = element.innerHTML;
        element.innerHTML = '';
        element.appendChild(codeElement);
        
        // 添加关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ui button';
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', () => {
            element.innerHTML = originalContent;
        });
        element.appendChild(closeBtn);
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