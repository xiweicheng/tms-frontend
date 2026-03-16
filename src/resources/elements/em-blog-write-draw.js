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
        $(this.cRef).find('.save-btn').on('click', () => {
            this.saveHandler();
        });

        // 导入按钮点击事件
        $(this.cRef).find('.import-btn').on('click', () => {
            this.importHandler();
        });

        // 关闭按钮点击事件
        $(this.cRef).find('.close-btn').on('click', () => {
            this.closeHandler();
        });

        // 标题输入事件
        $(this.cRef).find('.title-input').on('input', (event) => {
            this.title = event.target.value;
        });
    }

    detached() {
        // 移除消息事件监听器
        window.removeEventListener('message', this.messageHandler);

        // 解绑事件处理程序
        $(this.cRef).find('.save-btn').off('click');
        $(this.cRef).find('.import-btn').off('click');
        $(this.cRef).find('.close-btn').off('click');
        $(this.cRef).find('.title-input').off('input');
    }

    // 保存按钮点击处理
    saveHandler() {
        console.log('保存图表，标题：', this.title);
        // 这里可以添加保存逻辑，例如获取图表数据并发送到服务器
        this.saveDiagram();
        toastr.success('图表保存成功！', '', {
            positionClass: 'toast-top-center'
        });
    }

    // 导入按钮点击处理
    importHandler() {
        console.log('导入图表');
        // 这里可以添加导入逻辑，例如打开文件选择对话框
        // 可以使用input[type="file"]来实现
    }

    // 关闭按钮点击处理
    closeHandler() {
        console.log('关闭图表编辑器');
        // 这里可以添加关闭逻辑，例如关闭模态框
        // 可以通过发布事件或调用父组件的方法来实现
        $.modal.close();
    }

    // 发送消息到draw.io iframe
    sendMessageToDrawio(action, data) {
        let ifrm = $(this.cRef).find('iframe')[0];
        if (ifrm && ifrm.contentWindow) {
            ifrm.contentWindow.postMessage(JSON.stringify({
                action: action,
                data: data
            }), '*');
        }
    }

    // 导出draw.io图表
    exportDiagram(format = 'png') {
        this.sendMessageToDrawio('export', {
            format: format,
            mimeType: 'image/png',
            quality: 1.0,
            scale: 1
        });
    }

    // 加载图表数据
    loadDiagram(data) {
        this.sendMessageToDrawio('load', data);
    }

    // 保存图表数据
    saveDiagram() {
        this.sendMessageToDrawio('save', {});
    }
}
