import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogWriteDraw {

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

    }

    detached() {
        // 移除消息事件监听器
        window.removeEventListener('message', this.handleMessage);
    }

}
