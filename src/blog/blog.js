import { bindable, inject } from 'aurelia-framework';
import chatService from 'chat/chat-service';

export class Blog {

    rightSidebarShow = false;
    isHide = true;

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
            if (payload && !_.isUndefined(payload.isHide)) {
                this.rightSidebarShow = !payload.isHide;
            } else {
                this.rightSidebarShow = !this.rightSidebarShow;
            }
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR, (payload) => {
            this.isHide = payload;
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe1.dispose();
        this.subscribe2.dispose();

        clearInterval(this.timeagoTimer);
    }

    _initSock() {
        // FYI: https://stomp-js.github.io/stomp-websocket/codo/class/Client.html
        // var socket = new SockJS('http://localhost:8080/ws');
        let socket = new SockJS('/ws');
        window.stompClient = Stomp.over(socket);
        // window.stompClient.debug = () => {};
        stompClient.debug = (msg) => { console.log(msg) };
        window.stompClient.connect({}, (frame) => {
            // 注册发送消息
            stompClient.subscribe('/blog/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_BLOG_UPDATE, JSON.parse(msg.body));
            });
            stompClient.subscribe('/user/blog/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_BLOG_UPDATE, JSON.parse(msg.body));
                ea.publish(nsCons.EVENT_WS_BLOG_NEWS_UPDATE, {});
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

        // 用户信息popup
        $('.tms-blog').on('mouseenter', 'span[data-value].at-user:not(.pp-not),a[data-value].author:not(.pp-not)', (event) => {
            event.preventDefault();
            let target = event.currentTarget;

            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === target) {
                    return;
                } else {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }
            this.hoverUserTarget = target;

            this.hoverTimeoutRef = setTimeout(() => {
                ea.publish(nsCons.EVENT_CHAT_MEMBER_POPUP_SHOW, {
                    username: $(target).attr('data-value'),
                    target: target
                });
                this.hoverTimeoutRef = null;
            }, 500);
        });

        // 用户信息popup
        $('.tms-blog').on('mouseleave', 'span[data-value].at-user:not(.pp-not),a[data-value].author:not(.pp-not)', (event) => {
            event.preventDefault();
            if (this.hoverTimeoutRef) {
                if (this.hoverUserTarget === event.currentTarget) {
                    clearTimeout(this.hoverTimeoutRef);
                    this.hoverTimeoutRef = null;
                }
            }
        });

        $('.tms-blog .em-blog-content').on('click', 'a.avatar[data-value], a.author[data-value], .at-user[data-value]', (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_BLOG_COMMENT_MSG_INSERT, {
                content: `{~${$(event.currentTarget).attr('data-value')}} `
            });
        });

        $('.tms-blog .em-blog-content').on('click', '.at-group[data-value]', (event) => {
            event.preventDefault();
            ea.publish(nsCons.EVENT_BLOG_COMMENT_MSG_INSERT, {
                content: `{!~${$(event.currentTarget).attr('data-value')}} `
            });
        });

        $('.tms-blog').on('click', '.tms-chat-msg-code-trigger', function(event) {

            let $pre = $(this).parent().children('pre');
            $pre.toggleClass('fold');
            if ($pre.hasClass('fold')) {
                $(this).text('展开');
            } else {
                $(this).text('折叠');
            }
        });

        $('.tms-blog').on('mouseenter', 'pre.fold', function(event) {

            let $pre = $(event.currentTarget);
            if ($pre.height() < 100) {
                $pre.parent().children('.tms-chat-msg-code-trigger').remove();
            }
        });

        this._initSock();

    }

    /**
     * 当视图从DOM中分离时被调用
     */
    detached() {

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

        ea.publish(nsCons.EVENT_BLOG_SWITCH, { id: params.id });

        return Promise.all([chatService.loginUser().then((user) => {
                nsCtx.loginUser = user;
                nsCtx.isSuper = utils.isSuperUser(user);
                nsCtx.isAdmin = utils.isAdminUser(user);
            }),
            chatService.listUsers(true).then((users) => {
                nsCtx.users = users;
                window.tmsUsers = users;
            })
        ]);
    }
}
