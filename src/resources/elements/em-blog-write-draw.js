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
        // 将importDrawioHandler函数暴露到全局作用域，以便HTML中的onchange事件调用
        window.importDrawioHandler = this.importDrawioHandler.bind(this);

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
                            let id = $('.em-blog-write-draw').attr('data-id');
                            if (id) {
                                this.blogXml = $('.em-blog-write-draw').attr('data-content');
                                // $('.em-blog-write-draw').find('.title-input').val($('.em-blog-write-draw').attr('data-title') + ' (副本)');
                            } else {
                                $('.em-blog-write-draw').find('.title-input').val('');
                                this.blogXml = '';
                            }
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
    }

    detached() {
        // 移除消息事件监听器
        window.removeEventListener('message', this.messageHandler);

        // 解绑事件处理程序
        $('.em-blog-write-draw').find('.save-btn').off('click');
        
        // 取消所有订阅
        this.subscriptions.forEach(subscription => {
            subscription.dispose();
        });
        this.subscriptions = [];
        
        // 从全局作用域中移除importDrawioHandler函数
        delete window.importDrawioHandler;
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

    // 处理draw.io文件导入
    importDrawioHandler() {
        const fileInput = document.getElementById('drawio-files');
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            console.log('Importing draw.io file:', file.name);
            
            // 读取文件内容
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    let xmlData = content;

                    // 设置标题为文件名，移除扩展名
                    $('.em-blog-write-draw').find('.title-input').val(file.name.replace('.draw', ''));
                    
                    // 将XML数据加载到draw.io编辑器
                    this.loadDiagramFromXml(xmlData);
                    
                    // 重置文件输入
                    fileInput.value = '';
                } catch (error) {
                    console.error('Error importing draw.io file:', error);
                    alert('导入文件失败：' + error.message);
                }
            };
            
            reader.onerror = (error) => {
                console.error('Error reading draw.io file:', error);
                alert('读取文件失败：' + error.message);
            };
            
            // 读取文件内容
            reader.readAsText(file);
        }
    }

    // 从XML数据加载图表
    loadDiagramFromXml(xmlData) {
        const ifrm = $(`.em-blog-write-draw > iframe`)[0];
        if (ifrm && ifrm.contentWindow) {
            console.log('Loading diagram from XML data...');
            ifrm.contentWindow.postMessage(JSON.stringify({
                action: 'load',
                xml: xmlData,
                autosave: 1,
                modified: 1 // 标记为已修改
            }), '*');
        }
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

            if (event.ctrlKey || nsCtx.newBlogSpace || nsCtx.newBlogBlog) {
                // 给消息体增加uuid
                nsCtx.b_uuid = nsCtx.b_uuid || utils.uuid();
                $.post(`/admin/blog/create`, {
                    url: utils.getBasePath(),
                    usernames: utils.parseUsernames(this.blogXml ? this.blogXml : '', [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])]).join(','),
                    title: title,
                    content: this.blogXml ? this.blogXml : '',
                    editor: 'Draw',
                    spaceId: nsCtx.newBlogSpace ? nsCtx.newBlogSpace.id : '',
                    dirId: nsCtx.newBlogDir ? nsCtx.newBlogDir.id : '',
                    pid: nsCtx.newBlogBlog ? nsCtx.newBlogBlog.id : '',
                    privated: false,
                    uuid: nsCtx.b_uuid,
                    contentHtml: utils.md2html(this.blogXml ? this.blogXml : '', true)
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        nsCtx.b_uuid = utils.uuid();
                        this.blogXml = data.data.content;
                        toastr.success('博文保存成功!');
                        ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                            action: 'created',
                            blog: data.data
                        });
                        $('a[href="#modaal-blog-write-draw"]').modaal('close');
                    } else {
                        toastr.error(data.data, '博文保存失败!');
                    }
                });
            } else {
                ea.publish(nsCons.EVENT_BLOG_SAVE, {
                    title: title,
                    content: this.blogXml ? this.blogXml : '',
                    editor: 'Draw'
                });
            }

        }
    }
}
