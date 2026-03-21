import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogWriteDraw {

    constructor() {
        this.subscriptions = [];
        this.autoSaveXml = '';
    }

    attached() {

        $('.em-blog-write-draw').height($(window).height());

        $(window).resize((event) => {
            $('.em-blog-write-draw').height($(window).height());
        });

        this.messageHandler = (event) => {
            let ifrm = $(`.em-blog-write-draw > iframe`)[0];
            // 确保消息来自draw.io iframe
            if (ifrm && event.source === ifrm.contentWindow) {
                console.log('Received message from draw.io:', event.data);
                this.mode = $('.em-blog-write-draw').attr('data-mode');
                try {
                    const data = JSON.parse(event.data);

                    // 处理初始化事件
                    if (data.event === 'init') {

                        // 加载初始数据
                        if (this.mode == 'edit') {
                            $('.em-blog-write-draw').find('.title-input').val($('.em-blog-write-draw').attr('data-title'));
                            this.blogXml = $('.em-blog-write-draw').attr('data-content');
                            ifrm.contentWindow.postMessage(JSON.stringify(
                                { action: 'load', xml: this.blogXml, modified: 0, autosave: 1 }), '*');
                        } else {
                            $('.em-blog-write-draw').find('.title-input').val('');
                            this.blogXml = '';
                            ifrm.contentWindow.postMessage(JSON.stringify(
                                { action: 'load', xml: this.blogXml, modified: 0, autosave: 1 }), '*');
                        }
                    }
                    // 处理导出事件
                    else if (data.event === 'export') {
                        if (data.xml) {
                            this.blogXml = data.xml;
                            this.saveDiagram();
                        }
                    } else if (data.event === 'autosave') {
                        this.autoSaveXml = data.xml;
                    } else if (data.event === 'load') {
                        this.autoSaveXml = data.xml;
                    }
                } catch (e) {
                    // 忽略解析错误，可能是draw.io发送的非JSON消息
                    console.error('Error parsing draw.io message:', e);
                }
            }
        };

        // 绑定组件的messageHandler
        window.addEventListener('message', this.messageHandler, false);
        // 绑定事件处理程序
        this.bindEvents();

        // EVENT_BLOG_IS_UPDATED 事件处理
        this.subscriptions.push(ea.subscribe(nsCons.EVENT_BLOG_IS_UPDATED, (data) => {
            if (data.item && data.item.id == 'create-draw') {

                // 判断标题是否有更新
                let title = $('.em-blog-write-draw').find('.title-input').val();
                let titleUpdated = title !== $('.em-blog-write-draw').attr('data-title');

                let isUpdated = this.autoSaveXml && this.autoSaveXml !== this.blogXml;

                console.log('isUpdated', this.autoSaveXml, this.blogXml, isUpdated, titleUpdated);

                ea.publish(nsCons.EVENT_BLOG_IS_UPDATED_ACK, {
                    item: data.item,
                    updated: isUpdated || titleUpdated
                });
            }
        }));

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

    }

    detached() {
        // 移除消息事件监听器
        window.removeEventListener('message', this.messageHandler);

        // 解绑事件处理程序
        $('.em-blog-write-draw').find('.save-btn').off('click');
        $('.em-blog-write-draw').find('.import-btn').off('click');

        // 取消所有订阅
        this.subscriptions.forEach(subscription => {
            subscription.dispose();
        });
        this.subscriptions = [];
    }

    // 保存按钮点击处理
    saveHandler() {

        $('.em-blog-write-draw').attr('data-title', $('.em-blog-write-draw').find('.title-input').val());

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

    // 保存成功后通知draw.io移除modified标志
    saveSuccessHandler() {
        let ifrm = $(`.em-blog-write-draw > iframe`)[0];
        if (ifrm) {
            setTimeout(() => {
                ifrm.contentWindow.postMessage(JSON.stringify({
                    action: 'load',
                    modified: 0,
                    autosave: 1,
                    xml: this.blogXml
                }), '*');
            }, 100);
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
        if (this.mode == 'edit') {
            console.log('更新图表', $('.em-blog-write-draw').find('.title-input').val());
            $.post('/admin/blog/update', {
                url: utils.getBasePath(),
                id: $('.em-blog-write-draw').attr('data-id'),
                version: $('.em-blog-write-draw').attr('data-version'),
                title: $('.em-blog-write-draw').find('.title-input').val(),
                content: this.blogXml ? this.blogXml : ''
            }, (data, textStatus, xhr) => {
                if (data.success) {
                    toastr.success('博文更新成功!');
                    $('.em-blog-write-draw').attr('data-version', data.data.version);
                    $('.em-blog-write-draw').attr('data-content', this.blogXml ? this.blogXml : '');
                    ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                        action: 'updated',
                        autoFollow: true,
                        blog: data.data
                    });
                    this.saveSuccessHandler();
                } else {
                    toastr.error(data.data, '博文更新失败!');
                }
            }).always(() => {
            });
        } else {
            let title = $('.em-blog-write-draw').find('.title-input').val();
            console.log('保存图表，标题：', title);
            ea.publish(nsCons.EVENT_BLOG_SAVE, {
                title: title,
                content: this.blogXml ? this.blogXml : '',
                editor: 'Draw'
            });
        }
    }
}
