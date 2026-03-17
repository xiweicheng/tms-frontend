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

                    // 处理保存事件 - draw.io官方API
                    if (data.event === 'save' && data.xml) {
                        console.log('Draw.io save event with XML data:', data.xml);
                        // 保存XML数据到文件
                        this.saveDiagram(data.xml);
                        // saveDataToFile(data.xml, 'diagram.xml', 'application/xml');
                    }
                    // 处理导出事件 - draw.io官方API
                    else if (data.event === 'export') {
                        console.log('Draw.io export event:', data);
                        if (data.data) {
                            // 处理base64编码的PNG数据
                            const base64Data = data.data.split(',')[1];
                            const binaryData = atob(base64Data);
                            const arrayBuffer = new ArrayBuffer(binaryData.length);
                            const uint8Array = new Uint8Array(arrayBuffer);
                            for (let i = 0; i < binaryData.length; i++) {
                                uint8Array[i] = binaryData.charCodeAt(i);
                            }
                            // saveDataToFile(arrayBuffer, 'diagram.png', 'image/png');
                        } else if (data.xml) {
                            // 处理XML数据
                            // saveDataToFile(data.xml, 'diagram.xml', 'application/xml');
                        }
                    }
                    // 处理初始化事件
                    else if (data.event === 'init') {
                        console.log('Draw.io initialized successfully');
                        ifrm.contentWindow.postMessage(JSON.stringify(
                            { action: 'load', xml: '' }), '*');
                        // setIsReady(true);
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

        // 关闭按钮点击事件
        $('.em-blog-write-draw').find('.close-btn').on('click', () => {
            this.closeHandler();
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
        $('.em-blog-write-draw').find('.close-btn').off('click');
        $('.em-blog-write-draw').find('.title-input').off('input');
    }

    // 保存按钮点击处理
    saveHandler() {

        let ifrm = $(`.em-blog-write-draw > iframe`)[0];
        // 确保消息来自draw.io iframe
        if (ifrm) {
            ifrm.contentWindow.postMessage(JSON.stringify({
                action: 'save',
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
    saveDiagram(xml) {
        console.log('保存图表，标题：', this.title, xml);
        ea.publish(nsCons.EVENT_BLOG_SAVE, {
            title: this.title,
            content: xml,
            editor: 'Draw'
        });
    }
}
