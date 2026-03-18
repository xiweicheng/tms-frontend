import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogWriteDraw {

    @bindable title = '';

    attached() {

        $('.em-blog-write-draw').height($(window).height());

        $(window).resize((event) => {
            $('.em-blog-write-draw').height($(window).height());
        });

        this.messageHandler = (event) => {
            // debugger;
            let ifrm = $(`.em-blog-write-draw > iframe`)[0];
            // 确保消息来自draw.io iframe
            if (ifrm && event.source === ifrm.contentWindow) {
                try {
                    const data = JSON.parse(event.data);
                    console.log('Received message from draw.io:', data);

                    // 处理导出事件 - draw.io官方API
                    if (data.event === 'export') {
                        console.log('Draw.io export event:', data);
                        debugger;
                        if (data.xml) {
                            // 处理XML数据并保存
                            console.log('Draw.io export XML data:', data.xml);
                            this.blogXml = data.xml;
                            this.saveDiagram();
                        }
                    }
                    // 处理初始化事件
                    else if (data.event === 'init') {
                        console.log('Draw.io initialized successfully');
                        ifrm.contentWindow.postMessage(JSON.stringify(
                            { action: 'load', xml: '' }), '*');
                    }
                } catch (e) {
                    console.error('Error parsing draw.io message:', e);
                }
            }
        };

        window.addEventListener('message', this.messageHandler, false);

        // 绑定事件处理程序
        this.bindEvents();
    }

    bindEvents() {
        // 保存按钮点击事件
        $('.em-blog-write-draw').find('.save-btn').on('click', () => {
            this.saveHandler();
        });

        // 导入按钮点击事件
        $('.em-blog-write-draw').find('.import-btn').on('click', () => {
            this.importHandler();
        });

        // 标题输入事件
        $('.em-blog-write-draw').find('.title-input').on('input', (event) => {
            this.title = event.target.value;
        });
    }

    detached() {
        // 移除消息事件监听器
        window.removeEventListener('message', this.messageHandler);

        // 解绑事件处理程序
        $('.em-blog-write-draw').find('.save-btn').off('click');
        $('.em-blog-write-draw').find('.import-btn').off('click');
        $('.em-blog-write-draw').find('.title-input').off('input');
    }

    // 保存按钮点击处理
    saveHandler() {

        let ifrm = $(`.em-blog-write-draw > iframe`)[0];
        // 确保消息来自draw.io iframe
        if (ifrm) {
            // 使用draw.io官方推荐的保存方式
            // 先获取图表数据，然后再保存
            ifrm.contentWindow.postMessage(JSON.stringify({
                action: 'export',
                format: 'xml',
                xml: true
            }), '*');
        } else {
            console.log('drawio iframe 不存在');
        }
    }

    // 导入按钮点击处理
    importHandler() {
        console.log('导入图表');
        // 这里可以添加导入逻辑，例如打开文件选择对话框
        // 可以使用input[type="file"]来实现
    }

    // 保存图表数据
    saveDiagram() {
        console.log('保存图表，标题：', this.title);
        ea.publish(nsCons.EVENT_BLOG_SAVE, {
            title: this.title,
            content: this.blogXml ? this.blogXml : '',
            editor: 'Draw'
        });
    }
}
