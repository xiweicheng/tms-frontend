import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogDraw {

    @bindable blog;
    @bindable comment;

    baseRes = utils.getResourceBase();

    blogChanged(newValue, oldValue) {
        newValue && this.initBlog(newValue);
    }

    commentChanged(newValue, oldValue) {
        newValue && this.initComment(newValue);
    }

    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'updated') {
                (payload.blog.editor == 'Draw') && this.initBlog(payload.blog);
            }
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_COMMENT_CHANGED, (payload) => {
            if (payload.action == 'updated') {
                (payload.comment.editor == 'Draw') && this.initComment(payload.comment);
            }
        });
    }

    initBlog(blog) {
        _.defer(() => {
            if (blog.editor == 'Draw') {
                const iframe = $(`.em-blog-draw[data-id="${blog.id}"] > iframe`);
                if (iframe.length > 0) {
                    this.loadDiagram(iframe[0], blog.content);
                }
            }
        });
    }

    initComment(comment) {
        _.defer(() => {
            if (comment.editor == 'Draw') {
                const iframe = $(`.em-blog-draw[data-cid="${comment.id}"] > iframe`);
                if (iframe.length > 0) {
                    this.loadDiagram(iframe[0], comment.content);
                }
            }
        });
    }

    attached() {
        // 初始化iframe
        this.initIframe();
    }

    initIframe() {
        const iframe = $(this.cRef).find('iframe');
        // 设置iframe的src为drawio
        iframe.attr('src', `${this.baseRes}cdn/drawio/index.html?embed=1&lightbox=1&proto=json&lang=zh`);

        // 添加消息事件监听器，处理来自draw.io iframe的消息
        this.messageHandler = (event) => {
            let ifrm = $(this.cRef).find('iframe')[0];
            // 确保消息来自draw.io iframe
            if (ifrm && event.source === ifrm.contentWindow) {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received message from draw.io:', data);

                    // 处理初始化事件
                    if (data.event === 'init') {
                        console.log('Draw.io initialized successfully');
                        // 初始化完成后，加载图表数据
                        this.loadDiagramFromProps();
                    } else if (data.event === 'export') {
                        console.log('Draw.io export request:', data);
                        // 处理导出请求
                        this.handleExportRequest(data);
                    }
                } catch (e) {
                    console.error('Error parsing draw.io message:', e);
                }
            }
        };

        window.addEventListener('message', this.messageHandler, false);
    }

    loadDiagramFromProps() {
        if (this.blog) {
            this.initBlog(this.blog);
        } else if (this.comment) {
            this.initComment(this.comment);
        }
    }

    loadDiagram(iframe, xmlData) {
        if (iframe && iframe.contentWindow && xmlData) {
            // 发送消息到draw.io iframe，加载图表数据
            iframe.contentWindow.postMessage(JSON.stringify({
                action: 'load',
                xml: xmlData
            }), '*');
        }
    }

    detached() {
        // 移除消息事件监听器
        window.removeEventListener('message', this.messageHandler);
        // 释放订阅
        this.subscribe.dispose();
        this.subscribe2.dispose();
    }

    handleExportRequest(data) {
        if (data.event === 'export' && data.format === 'png' && data.data) {
            // 处理PNG导出响应
            console.log('PNG export response received:', data);
            // 下载PNG文件
            this.downloadPng(data.data);
        }
    }

    downloadPng(pngData) {
        // 创建下载链接
        const link = document.createElement('a');
        // 设置文件名
        const fileName = this.blog ? `${this.blog.title}.png` : `diagram.png`;
        
        // 处理base64数据
        if (pngData.startsWith('data:image/png;base64,')) {
            // 直接使用base64数据
            link.href = pngData;
        } else {
            // 如果是原始base64字符串，添加前缀
            link.href = `data:image/png;base64,${pngData}`;
        }
        
        link.download = fileName;
        link.target = '_blank';
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}