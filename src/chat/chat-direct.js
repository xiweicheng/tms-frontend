import { bindable, inject } from 'aurelia-framework';
import poll from "common/common-poll";
import {
    default as Clipboard
} from 'clipboard';
import {
    default as Dropzone
} from 'dropzone';

export class ChatDirect {

    @bindable content = '';

    offset = 0;

    first = true;
    last = true;

    originalHref = wurl();

    chatTo = null;

    /**
     * 构造函数
     */
    constructor(ea) {

        Dropzone.autoDiscover = false;
        this.poll = poll;

        new Clipboard('.tms-chat-direct .tms-clipboard')
            .on('success', function(e) {
                toastr.success('复制到剪贴板成功!');
            }).on('error', function(e) {
                toastr.error('复制到剪贴板成功!');
            });

        this.initSubscribeEvent();
    }

    initSubscribeEvent() {

        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_MSG_SENDED, (payload) => {

            if (!this.first) {
                this._init(false);
            }
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_CHAT_SIDEBAR_TOGGLE, (payload) => {

            this.isRightSidebarShow = payload.isShow;
            if (this.isRightSidebarShow) {
                $(this.contentBodyRef).width($(this.contentRef).width() - 392);
            }
        });

        this.subscribe4 = ea.subscribe(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, (payload) => {

            this.gotoChatItem(payload.chatItem);
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe4.dispose();

        clearInterval(this.timeagoTimer);
        poll.stop();
    }

    convertMd(chats) {
        _.each(chats, (item) => {
            item.contentMd = marked(item.content);
        });
        return chats;
    }

    getChatName(name) {
        if (_.startsWith(name, '@')) {
            return name.substr(1);
        } else {
            return name;
        }
    }

    /**
     * 在视图模型(ViewModel)展示前执行一些自定义代码逻辑
     * @param  {[object]} params                参数
     * @param  {[object]} routeConfig           路由配置
     * @param  {[object]} navigationInstruction 导航指令
     * @return {[promise]}                      你可以可选的返回一个延迟许诺(promise), 告诉路由等待执行bind和attach视图(view), 直到你完成你的处理工作.
     */
    activate(params, routeConfig, navigationInstruction) {

        this.markId = params.id;
        this.routeConfig = routeConfig;

        this.isAt = _.startsWith(params.username, '@');
        this.chatName = this.getChatName(params.username);

        this.user = _.find(this.users, {
            username: this.chatName
        });

        let name = this.user ? this.user.name : this.chatName;
        routeConfig.navModel.setTitle(`${name} | 私聊 | TMS`);

        this.init(this.chatName);

        if (this.markId) {
            if ('pushState' in history) {
                history.replaceState(null, '', utils.removeUrlQuery('id'));
            } else {
                window.location.href = utils.removeUrlQuery('id');
            }
        }

    }

    lastMoreHandler() {

        let start = _.first(this.chats).id;
        this.lastMoreP = $.get('/admin/chat/direct/more', {
            last: true,
            start: start,
            size: 20,
            chatTo: this.chatTo
        }, (data) => {
            if (data.success) {
                this.chats = _.unionBy(_.reverse(this.convertMd(data.data)), this.chats);
                this.last = (data.msgs[0] - data.data.length <= 0);
                !this.last && (this.lastCnt = data.msgs[0] - data.data.length);
                _.defer(() => {
                    $(this.commentsRef).scrollTo(`.comment[data-id=${start}]`, {
                        offset: this.offset
                    });
                });
            } else {
                toastr.error(data.data, '获取更多消息失败!');
            }
        });
    }

    firstMoreHandler() {

        let start = _.last(this.chats).id;
        this.nextMoreP = $.get('/admin/chat/direct/more', {
            last: false,
            start: start,
            size: 20,
            chatTo: this.chatTo
        }, (data) => {
            if (data.success) {
                this.chats = _.unionBy(this.chats, this.convertMd(data.data));
                this.first = (data.msgs[0] - data.data.length <= 0);
                !this.first && (this.firstCnt = data.msgs[0] - data.data.length);
                _.defer(() => {
                    $(this.commentsRef).scrollTo(`.comment[data-id=${start}]`, {
                        offset: this.offset
                    });
                });
            } else {
                toastr.error(data.data, '获取更多消息失败!');
            }
        });
    }

    _init(isCareMarkId) {

        if (!this.chatTo) {
            toastr.error('聊天对象未指定!');
            return;
        }

        var data = {
            size: 20,
            chatTo: this.chatTo
        };

        if (this.markId && isCareMarkId) {
            data.id = this.markId;
        }

        $.get('/admin/chat/direct/list', data, (data) => {
            if (data.success) {
                this.chats = _.reverse(this.convertMd(data.data.content));
                this.last = data.data.last;
                this.first = data.data.first;
                !this.last && (this.lastCnt = data.data.totalElements - data.data.numberOfElements);
                !this.first && (this.firstCnt = data.data.size * data.data.number);

                _.defer(() => {

                    utils.imgLoaded($(this.commentsRef).find('.comment img'), () => {
                        if (this.markId) {
                            $(this.commentsRef).scrollTo(`.comment[data-id=${this.markId}]`, {
                                offset: this.offset
                            });
                        } else {
                            $(this.commentsRef).scrollTo('max');
                        }
                    });

                });
            } else {
                toastr.error(data.data, '获取消息失败!');
                utils.redirect2Login(this.originalHref);
            }
        }).always((xhr, sts, error) => {
            if (sts == 'error') { // for loal dev & debug.
                utils.redirect2Login(this.originalHref);
            }
        });
    }

    init(chatTo) {

        this.chatTo = chatTo;
        this._init(true);
    }

    /**
     * 当数据绑定引擎绑定到视图时被调用
     * @param  {[object]} ctx 视图绑定上下文环境对象
     */
    bind(ctx) {

        $.get('/admin/user/loginUser', (data) => {
            if (data.success) {
                this.loginUser = data.data;
            } else {
                toastr.error(data.data, '获取当前登录用户失败!');
            }
        });

        $.get('/admin/user/all', {
            enabled: true
        }, (data) => {
            if (data.success) {
                this.users = data.data;
                this.user = _.find(this.users, {
                    username: this.chatTo
                });
                this.user && this.routeConfig.navModel.setTitle(`${this.user.name} | 私聊 | TMS`);
            } else {
                toastr.error(data.data, '获取全部用户失败!');
            }
        });

        poll.start((resetCb, stopCb) => {

            if (!this.chats || !this.first) {
                return;
            }

            let lastChat = _.last(this.chats);

            $.get('/admin/chat/direct/latest', {
                id: lastChat ? lastChat.id : 0,
                chatTo: this.chatTo
            }, (data) => {
                if (data.success) {
                    if (data.data.length == 0) {
                        return;
                    }
                    this.chats = _.unionBy(this.chats, this.convertMd(data.data), 'id');
                    _.defer(() => {
                        $(this.commentsRef).scrollTo('max');
                    });
                } else {
                    toastr.error(data.data, '轮询获取消息失败!');
                }
            }).fail((xhr, sts) => {
                stopCb();
                if (xhr && xhr.status == 401) {
                    utils.redirect2Login(this.originalHref);
                } else {
                    utils.errorAutoTry(() => {
                        resetCb();
                    });
                }
            });
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        let tg = timeago();
        this.timeagoTimer = setInterval(() => {
            $(this.chatContainerRef).find('[data-timeago]').each((index, el) => {
                $(el).text(tg.format($(el).attr('data-timeago'), 'zh_CN'));
            });
        }, 5000);

        this.initHotkeys();
        this.initFocusedComment();

    }

    initFocusedComment() {
        $(this.commentsRef).on('click', '.comment.item', (event) => {
            this.focusedComment = $(event.currentTarget);
        }).on('dblclick', '.comment.item', (event) => {
            if (event.ctrlKey) {
                let chatId = $(event.currentTarget).attr('data-id');
                let $t = $(event.currentTarget).find('.content > textarea');
                let item = _.find(this.chats, { id: Number.parseInt(chatId) });

                item.isEditing = true;
                item.contentOld = item.content;
                _.defer(() => {
                    $t.focus().select();
                    autosize.update($t.get(0));
                });
            }
        });
    }

    getScrollTargetComment(isPrev) {
        if (isPrev) {
            if (this.focusedComment && this.focusedComment.size() === 1) {
                let prev = this.focusedComment.prev('.comment.item');
                (prev.size() === 1) && (this.focusedComment = prev);
            } else {
                this.focusedComment = $(this.commentsRef).children('.comment.item:first');
            }
        } else {
            if (this.focusedComment && this.focusedComment.size() === 1) {
                let next = this.focusedComment.next('.comment.item');
                (next.size() === 1) && (this.focusedComment = next);
            } else {
                this.focusedComment = $(this.commentsRef).children('.comment.item:last');
            }
        }
        return this.focusedComment;
    }

    scrollTo(target) {
        $(this.commentsRef).scrollTo(target, {
            offset: this.offset
        });
    }

    initHotkeys() {
        $(document).bind('keydown', 'ctrl+u', (evt) => {
            evt.preventDefault();
            $(this.emChatInputRef.btnItemUploadRef).find('.content').click();
        }).bind('keydown', 'ctrl+/', (evt) => {
            evt.preventDefault();
            this.emChatInputRef.emHotkeysModal.show();
        }).bind('keydown', 'alt+up', (evt) => {
            evt.preventDefault();
            this.scrollTo(this.getScrollTargetComment(true));
        }).bind('keydown', 'alt+down', (evt) => {
            evt.preventDefault();
            this.scrollTo(this.getScrollTargetComment());
        }).bind('keydown', 'alt+ctrl+up', () => {
            event.preventDefault();
            this.scrollTo($(this.commentsRef).children('.comment.item:first'));
        }).bind('keydown', 'alt+ctrl+down', () => {
            event.preventDefault();
            this.scrollTo($(this.commentsRef).children('.comment.item:last'));
        }).bind('keydown', 'ctrl+i', () => {
            event.preventDefault();
            ea.publish(nsCons.HOTKEY, {
                key: 'ctrl+i'
            });
        });

    }

    gotoChatItem(item) {

        let chat = _.find(this.chats, { id: item.id });
        if (chat) {
            $(this.commentsRef).find(`.comment[data-id]`).removeClass('active');
            $(this.commentsRef).find(`.comment[data-id=${item.id}]`).addClass('active');
            $(this.commentsRef).scrollTo(`.comment[data-id=${item.id}]`, {
                offset: this.offset
            });
        } else {

            if (this.chatTo == item.chatTo.username) {
                this.activate({
                    id: item.id,
                    username: `@${item.chatTo.username}`
                }, this.routeConfig);
            } else {
                window.location = wurl('path') + `#/chat/@${item.chatTo.username}?id=${item.id}`;
            }

        }

    }

}
