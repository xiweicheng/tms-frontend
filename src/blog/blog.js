import {
    bindable,
    inject
} from 'aurelia-framework';
import chatService from 'chat/chat-service';
import {
    default as Clipboard
} from 'clipboard';

export class Blog {

    rightSidebarShow = false;
    isHide = true;
    isHidePc = false;

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_VIEW_CHANGED, (payload) => {
            this.routeConfig && this.routeConfig.navModel.setTitle(`${payload.title} | 博文 | TMS`);
        });
        this.subscribe1 = ea.subscribe(nsCons.EVENT_BLOG_RIGHT_SIDEBAR_TOGGLE, (payload) => {
            if (payload.justRefresh) {
                return;
            }

            let rightSidebarShowOld = this.rightSidebarShow;

            if (payload && !_.isUndefined(payload.isHide)) {
                this.rightSidebarShow = !payload.isHide;
            } else {
                this.rightSidebarShow = !this.rightSidebarShow;
            }

            if (this.rightSidebarShow == rightSidebarShowOld) return;

            this.rightSidebarShow ? $('.em-blog-content').width($('.em-blog-content').width() - nsCons.WIDTH_RIGHT_BAR) : $('.em-blog-content').width($('.em-blog-content').width() + nsCons.WIDTH_RIGHT_BAR);
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR, (payload) => {
            this.isHide = payload;
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR_PC, (payload) => {
            this.isHidePc = payload;

            let hw = $('.em-blog-content-wrapper').width();

            this.isHidePc && $('.em-blog-content').css({
                'left': 0,
                'width': this.rightSidebarShow ? hw - nsCons.WIDTH_RIGHT_BAR : hw
            });
        });
        this.subscribe4 = ea.subscribe(nsCons.EVENT_BLOG_IS_UPDATED_ACK, (payload) => {
            if (payload.updated) {

                // console.log('ss', payload)

                var content = '页面存在未保存内容，确认要关闭吗?';
                    if(payload.item.name == 'write-sheet') {
                        content = '页面可能存在未保存内容，确认要关闭吗?';
                    }

                this.emConfirmModal.show({
                    title: '关闭确认',
                    content: content,
                    onapprove: () => {
                        $(`a[href="#modaal-blog-${payload.item.name}"]`).modaal('close');
                    }
                });
            } else {
                $(`a[href="#modaal-blog-${payload.item.name}"]`).modaal('close');
            }
        });

        this.tmsClipboard = new Clipboard('.tms-clipboard')
            .on('success', function (e) {
                toastr.success('复制到剪贴板成功!');
            }).on('error', function (e) {
                toastr.error('复制到剪贴板失败!');
            });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe1.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        this.subscribe4.dispose();

        this.tmsClipboard.destroy();

        clearInterval(this.timeagoTimer);
    }

    _initSock() {
        // FYI: https://stomp-js.github.io/stomp-websocket/codo/class/Client.html
        // var socket = new SockJS('http://localhost:8080/ws');
        let socket = new SockJS('/ws');
        window.stompClient = Stomp.over(socket);
        window.stompClient.debug = () => {};
        // stompClient.debug = (msg) => { console.log(msg) };
        window.stompClient.connect({}, (frame) => {
            // 注册发送消息
            stompClient.subscribe('/blog/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_BLOG_UPDATE, JSON.parse(msg.body));
            });
            stompClient.subscribe('/user/blog/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_BLOG_UPDATE, JSON.parse(msg.body));
                ea.publish(nsCons.EVENT_WS_BLOG_NEWS_UPDATE, {});
            });
            stompClient.subscribe('/user/blog/toastr', (msg) => {
                let msgBody = JSON.parse(msg.body);
                // $(`[data-id="${msgBody.id}"]`).remove();
                toastr.clear($(`[data-id="${msgBody.id}"]`));
                ea.publish(nsCons.EVENT_WS_BLOG_NEWS_UPDATE, {});
            });
            stompClient.subscribe('/blog/comment/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_BLOG_COMMENT_UPDATE, JSON.parse(msg.body));
            });
            stompClient.subscribe('/blog/lock', (msg) => {
                ea.publish(nsCons.EVENT_WS_BLOG_LOCK, JSON.parse(msg.body));
            });
        }, (err) => {
            utils.errorAutoTry(() => {
                this._initSock();
            });
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        let tg = timeago();
        this.timeagoTimer = setInterval(() => {
            $(this.blogContainerRef).find('[data-timeago]').each((index, el) => {
                $(el).text(tg.format($(el).attr('data-timeago'), 'zh_CN'));
            });
        }, 5000);

        this.avatarClickHander = (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_BLOG_COMMENT_MSG_INSERT, {
                content: `{~${$(event.currentTarget).attr('data-value')}} `
            });
        };

        this.atGroupClickHander = (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_BLOG_COMMENT_MSG_INSERT, {
                content: `{!~${$(event.currentTarget).attr('data-value')}} `
            });
        };

        this.codeTriggerClickHandler = function (event) {

            let $pre = $(this).parent().children('pre');
            $pre.toggleClass('fold');
            if ($pre.hasClass('fold')) {
                $(this).text('展开');
            } else {
                $(this).text('折叠');
            }
        };

        this.preFoldMeHandler = function (event) {

            let $pre = $(event.currentTarget);
            if ($pre.height() < 100) {
                $pre.parent().children('.tms-chat-msg-code-trigger').remove();
            }
        };

        this.modaalCloseClickHandler = function (event) {

            event.stopPropagation();
            // event.stopImmediatePropagation();

            let modaalClasses = [{
                id: 'create',
                name: 'write'
            }, {
                id: 'create-html',
                name: 'write-html'
            }, {
                id: 'create-mind',
                name: 'write-mind'
            }, {
                id: 'create-excel',
                name: 'write-excel'
            }, {
                id: 'create-sheet',
                name: 'write-sheet'
            }];

            var $modaal = $(event.currentTarget).closest('.modaal-wrapper');

            _.each(modaalClasses, item => {
                if ($modaal.hasClass(`blog-${item.id}`)) {

                    var ifrm = $modaal.find('iframe')[0];
                    if (ifrm) {
                        (ifrm.contentWindow.postMessage) && (ifrm.contentWindow
                            .postMessage({
                                action: 'isUpdated',
                                source: 'blogClose',
                                item: item
                            }, window.location.origin));
                    } else {
                        ea.publish(nsCons.EVENT_BLOG_IS_UPDATED, {
                            item: item
                        });
                    }

                    // $(`a[href="#modaal-blog-${item.name}"]`).modaal('close');
                }
            });

        };

        this.messageHandler = (evt) => {

            if (evt.origin != window.location.origin) return;

            if (evt.data.source != 'blogCloseAck') return;

            if (evt.data.action == 'isUpdated') {

                if (evt.data.updated) {

                    // console.log('s', evt.data)

                    var content = '页面存在未保存内容，确认要关闭吗?';
                    if(evt.data.item.name == 'write-sheet') {
                        content = '页面可能存在未保存内容，确认要关闭吗?';
                    }

                    this.emConfirmModal.show({
                        title: '关闭确认',
                        content: content,
                        onapprove: () => {
                            $(`a[href="#modaal-blog-${evt.data.item.name}"]`).modaal('close');
                            $(`.em-blog-${evt.data.item.name} > iframe`).attr('src', ``);
                        }
                    });
                } else {
                    $(`a[href="#modaal-blog-${evt.data.item.name}"]`).modaal('close');
                    $(`.em-blog-${evt.data.item.name} > iframe`).attr('src', ``);
                }
            }

        };

        $('.tms-blog .em-blog-content').on('click', 'a.avatar[data-value], a.author[data-value], .at-user[data-value]', this.avatarClickHander);

        $('.tms-blog .em-blog-content').on('click', '.at-group[data-value]', this.atGroupClickHander);

        $('.tms-blog').on('click', '.tms-chat-msg-code-trigger', this.codeTriggerClickHandler);

        $('.tms-blog').on('mouseenter', 'pre.fold', this.preFoldMeHandler);

        // modaal-close
        $('body').on('click', '#modaal-close', this.modaalCloseClickHandler);

        window.addEventListener && window.addEventListener('message', this.messageHandler, false);

        this._initSock();

    }

    foldHandler() {
        this.isHidePc = !this.isHidePc;
        ea.publish(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR_PC, this.isHidePc);

        let lw = $('.em-blog-left-sidebar').width();
        let hw = $('.em-blog-content-wrapper').width();

        !this.isHidePc && $('.em-blog-content').css({
            left: lw,
            'width': this.rightSidebarShow ? hw - lw - nsCons.WIDTH_RIGHT_BAR : hw - lw
        });
    }

    /**
     * 当视图从DOM中分离时被调用
     */
    detached() {

        window.__debug && console.log('Blog--detached');

        $('.tms-blog .em-blog-content').off('click', 'a.avatar[data-value], a.author[data-value], .at-user[data-value]', this.avatarClickHander);

        $('.tms-blog .em-blog-content').off('click', '.at-group[data-value]', this.atGroupClickHander);

        $('.tms-blog').off('click', '.tms-chat-msg-code-trigger', this.codeTriggerClickHandler);

        $('.tms-blog').off('mouseenter', 'pre.fold', this.preFoldMeHandler);

        // modaal-close
        $('body').off('click', '#modaal-close', this.modaalCloseClickHandler);

        window.removeEventListener && window.removeEventListener('message', this.messageHandler, false);
    }

    /**
     * 在视图模型(ViewModel)展示前执行一些自定义代码逻辑
     * @param  {[object]} params                参数
     * @param  {[object]} routeConfig           路由配置
     * @param  {[object]} navigationInstruction 导航指令
     * @return {[promise]}                      你可以可选的返回一个延迟许诺(promise), 告诉路由等待执行bind和attach视图(view), 直到你完成你的处理工作.
     */
    activate(params, routeConfig, navigationInstruction) {

        this.routeConfig = routeConfig;
        nsCtx.blogId = params.id;

        ea.publish(nsCons.EVENT_BLOG_SWITCH, {
            id: params.id,
            anchor: params.anchor
        });

        return Promise.all([chatService.loginUser().then((user) => {
                nsCtx.loginUser = user;
                nsCtx.isSuper = utils.isSuperUser(user);
                nsCtx.isAdmin = utils.isAdminUser(user);
            }),
            chatService.listUsers(true).then((users) => {
                nsCtx.users = users;
                window.tmsUsers = users;
            }),
            chatService.sysConf(true).then((sysConf) => {
                nsCtx.sysConf = sysConf;
            })
        ]);
    }
}
