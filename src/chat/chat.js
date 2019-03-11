import { bindable, inject } from 'aurelia-framework';
import poll from "common/common-poll";
import {
    default as Clipboard
} from 'clipboard';
import {
    default as clipboard
} from 'clipboard-js';
import {
    default as Dropzone
} from 'dropzone';

import chatService from './chat-service';

import toastrOps from 'common/common-toastr';

export class Chat {

    offset = 0;

    first = true; // 第一页
    last = true; // 最后一页

    originalHref = wurl();

    loginUser;
    users = [];
    channels = [];
    chatTo = null;
    onlines = [];
    isLeftBarHide = true;
    delayMs = 0;

    /**
     * 构造函数
     */
    constructor() {

        Dropzone.autoDiscover = false;
        this.poll = poll;

        new Clipboard('.tms-chat .tms-clipboard')
            .on('success', function(e) {
                toastr.success('复制到剪贴板成功!');
            }).on('error', function(e) {
                toastr.error('复制到剪贴板失败!');
            });

        $(window).resize((event) => {
            this.doResize();
        });

        this.initSubscribeEvent();

    }

    _initSock() {
        // FYI: https://stomp-js.github.io/stomp-websocket/codo/class/Client.html
        // var socket = new SockJS('http://localhost:8080/ws');
        let socket = new SockJS('/ws');
        window.stompClient = Stomp.over(socket);
        // window.stompClient.debug = () => {};
        stompClient.debug = (msg) => { console.log(msg) };
        window.stompClient.connect({}, (frame) => {
            // 同步在线用户
            this.getOnlineUsers();
            // 注册发送消息
            stompClient.subscribe('/channel/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_CHANNEL_UPDATE, JSON.parse(msg.body));
            });
            stompClient.subscribe('/channel/online', (msg) => {
                let online = JSON.parse(msg.body);
                ea.publish(nsCons.EVENT_WS_CHANNEL_ONLINE, online);
                _.each(this.users, user => {
                    if (user.username == online.username) {
                        if (online.cmd == 'ON') {
                            user.onlineStatus = 'Online';
                            user.onlineDate = new Date().getTime();
                        } else if (online.cmd == 'OFF' && (user.username != this.loginUser.username)) {
                            delete user['onlineStatus'];
                            delete user['onlineDate'];
                        }
                        return false;
                    }
                });
                this.users = [...this.users];
                bs.signal('sg-users-refresh');
            });
            stompClient.subscribe('/user/direct/update', (msg) => {
                ea.publish(nsCons.EVENT_WS_DIRECT_UPDATE, JSON.parse(msg.body));
            });
            stompClient.subscribe('/user/channel/schedule', (msg) => {
                ea.publish(nsCons.EVENT_WS_SCHEDULE_UPDATE, JSON.parse(msg.body));
            });

            // 注册发送消息
            stompClient.subscribe('/blog/update', (msg) => {
                this._blogUpdateToastr(JSON.parse(msg.body));
            });
            stompClient.subscribe('/user/blog/update', (msg) => {
                this._blogUpdateToastr(JSON.parse(msg.body));
            });
        }, (err) => {
            utils.errorAutoTry(() => {
                this._initSock();
            });
        });
    }

    _blogUpdateToastr(payload) {
        if (payload.username != this.loginUser.username) {

            if (payload.cmd != 'U') {
                let alarm = utils.getAlarm();
                (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
            }

            if (payload.cmd == 'At') {
                toastr.info(`博文【${payload.title}】有提及到你，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id);
                    }
                }));
            } else if (payload.cmd == 'OU') {
                toastr.info(`您的博文【${payload.title}】有更新，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id);
                    }
                }));
            } else if (payload.cmd == 'F') {
                toastr.info(`您关注的博文【${payload.title}】有更新，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id);
                    }
                }));
            } else if (payload.cmd == 'CAt') {
                toastr.info(`博文【${payload.title}】有评论提及到你，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                    }
                }));
            } else if (payload.cmd == 'FCC') {
                toastr.info(`您关注的博文【${payload.title}】有新的评论，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                    }
                }));
            } else if (payload.cmd == 'FCU') {
                toastr.info(`您关注的博文【${payload.title}】评论有更新，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                    }
                }));
            } else if (payload.cmd == 'CC') {
                toastr.info(`您的博文【${payload.title}】有新的评论，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                    }
                }));
            } else if (payload.cmd == 'CU') {
                toastr.info(`您的博文【${payload.title}】评论有更新，点击可查看！`, null, _.extend(toastrOps, {
                    onclick: () => {
                        this._delBlogNews(payload.nid);
                        utils.openNewWin(utils.getBasePath() + '#/blog/' + payload.id + '?cid=' + payload.cid);
                    }
                }));
            }
        }
    }

    _delBlogNews(id) {

        if (!id) return;

        $.post('/admin/blog/news/delete', { id: id }, (data, textStatus, xhr) => {
            if (data.success) {
                ea.publish(nsCons.EVENT_WS_BLOG_NEWS_UPDATE, {});
            }
        });
    }

    getOnlineUsers() {
        $.get('/admin/user/online', (data) => {
            if (data.success) {
                this.onlines = data.data;
                _.each(this.users, user => {
                    let online = _.find(this.onlines, { username: user.username });
                    if (online || (user.username == this.loginUser.username)) {
                        user.onlineStatus = 'Online';
                        user.onlineDate = online.date;
                    } else {
                        delete user['onlineStatus'];
                        delete user['onlineDate'];
                    }
                });
                bs.signal('sg-users-refresh');
            }
        });
    }

    doResize() {
        if (nsCtx.isRightSidebarShow) {
            let wid = $(this.contentRef).width() - 392;
            $(this.contentBodyRef).width(wid);
            $(this.contentBodyRef).children('.scroll-wrapper').width(wid);
        } else {
            $(this.contentBodyRef).css('width', '100%');
            $(this.contentBodyRef).children('.scroll-wrapper').css('width', '100%');
        }
    }

    initSubscribeEvent() {

        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_MSG_SENDED, (payload) => {

            poll.reset();

            if (!this.first) { // 不是第一页
                if (this.isAt) {
                    this.listChatDirect(false);
                } else {
                    this.listChatChannel(false);
                }
            }
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_CHAT_SIDEBAR_TOGGLE, (payload) => {

            this.isRightSidebarShow = nsCtx.isRightSidebarShow = payload.isShow;
            this.doResize();
        });

        this.subscribe3 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_CREATED, (payload) => {
            // this.channels.splice(0, 0, payload.channel);
            this.channels.push(payload.channel);
        });

        this.subscribe4 = ea.subscribe(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, (payload) => {

            this.gotoChatItem(payload.chatItem);
        });

        this.subscribe5 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_DELETED, (payload) => {

            if (!this.isAt && (payload.channel.name == this.chatTo)) {
                window.location = wurl('path') + `#/chat/@${this.loginUser.username}`;
            }

            this.channels = [...this.channels];

        });

        this.subscribe6 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_JOINED, (payload) => {

            this.channels.splice(0, 0, payload.channel);

        });

        this.subscribe7 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_LEAVED, (payload) => {

            if (!this.isAt && (payload.channel.name == this.chatTo)) {
                window.location = wurl('path') + `#/chat/@${this.loginUser.username}`;
            }

            this.channels = _.reject(this.channels, { id: payload.channel.id });

        });

        this.subscribe8 = ea.subscribe(nsCons.EVENT_CHAT_LAST_ITEM_RENDERED, (payload) => {

            if (payload.item.__scroll) {
                this.replyId && ea.publish(nsCons.EVENT_CHAT_TOPIC_SHOW, {
                    chat: _.find(this.chats, { id: +this.markId }),
                    rid: this.replyId
                });
                this.scrollToAfterImgLoaded(this.markId ? this.markId : 'b');
                delete payload.item.__scroll;
                this.markId = null;
                this.replyId = null;

            }

        });

        this.subscribe9 = ea.subscribe(nsCons.EVENT_SCROLLBAR_SCROLL_TO_BOTTOM, (payload) => {

            if (this.scrollbarRef == payload.element) {
                poll.reset();
            }

        });

        this.subscribe10 = ea.subscribe(nsCons.EVENT_CHAT_CONTENT_SCROLL_TO, (payload) => {

            this.scrollTo(payload.target);

        });

        this.subscribe11 = ea.subscribe(nsCons.EVENT_CHAT_TOGGLE_LEFT_SIDEBAR, (payload) => {

            if (payload) {
                this.isLeftBarHide = payload;
            } else {
                this.isLeftBarHide = !this.isLeftBarHide;
            }

        });

        this.subscribe12 = ea.subscribe(nsCons.EVENT_CHAT_MSG_POLL_UPDATE, (payload) => {

            _.forEach(payload, (msg) => {
                let chat = _.find(this.chats, { id: msg.id });
                if (!chat) {
                    return;
                }

                let updater = utils.getUser(msg.username);
                let updaterName = updater ? (updater.name ? updater.name : updater.username) : '';

                if (msg.type == 'Content') {
                    if (msg.action == 'Delete') {
                        this.chats = _.reject(this.chats, { id: chat.id });
                    } else {
                        this.updateNotify(chat, msg, `【${updaterName}】更新了消息[#${chat.id}]的内容，可点击查看！`);
                    }
                } else if (msg.type == 'Label') {
                    this.updateNotify(chat, msg, (msg.action != 'Delete' ? `【${updaterName}】更新了消息[#${chat.id}]的表情标签，可点击查看！` : null));
                } else if (msg.type == 'Reply') {
                    this.updateNotify(chat, msg, (msg.action != 'Delete' ? `【${updaterName}】更新了消息[#${chat.id}]的话题回复，可点击查看！` : null));
                }
            });

        });

        this.subscribe13 = ea.subscribe(nsCons.EVENT_WS_CHANNEL_UPDATE, (payload) => {

            // 频道聊天
            if (payload.username != this.loginUser.username) {
                if (this.channel && (payload.id == this.channel.id)) {
                    if (payload.cmd == 'R') {
                        console.log('ws: poll reset');
                        poll.reset();
                    }
                } else {
                    if (payload.cmd == 'R') {
                        let channel = _.find(this.channels, { id: payload.id });
                        if (channel) {
                            channel.newMsgCnt = _.isNumber(channel.newMsgCnt) ? (channel.newMsgCnt + 1) : 1;
                            this.saveNewMsgCnt(channel.name, channel.newMsgCnt);

                            this.updateNotifyChannel(null, `【${channel.title ? channel.title : channel.name}】频道有消息更新，请注意关注！`, null);
                        }
                    }
                }
            }

        });

        this.subscribe14 = ea.subscribe(nsCons.EVENT_WS_DIRECT_UPDATE, (payload) => {

            let updater = utils.getUser(payload.username);
            let updaterName = updater ? (updater.name ? updater.name : updater.username) : '';

            // 私聊聊天
            if (this.user && ((this.user.username == payload.username) || (payload.username == this.loginUser.username))) {

                if (payload.username == this.loginUser.username) {
                    if (payload.cmd == 'U') { // url 摘要解析更新
                        $.get('/admin/chat/direct/get', { id: payload.id }, (data) => {
                            let chat = _.find(this.chats, { id: payload.id });
                            chat && (_.extend(chat, data.data));
                        });
                    }
                    return;
                }

                if (payload.cmd == 'C') {
                    console.log('ws: poll reset');
                    poll.reset();
                } else if (payload.cmd == 'U') {
                    $.get('/admin/chat/direct/get', { id: payload.id }, (data) => {
                        let chat = _.find(this.chats, { id: payload.id });
                        chat && (_.extend(chat, data.data));

                        this.updateNotifyDirect(chat, `【${updaterName}】更新了消息[#${payload.id}]的内容，可点击查看！`);
                    });
                } else if (payload.cmd == 'D') {
                    this.chats = _.reject(this.chats, { id: payload.id });
                }
            } else {
                let user = _.find(this.users, { username: payload.username });
                if (user) {
                    user.newMsgCnt = _.isNumber(user.newMsgCnt) ? (user.newMsgCnt + 1) : 1;
                    this.saveNewMsgCnt(`@${user.username}`, user.newMsgCnt);

                    this.updateNotifyDirect(null, `【${updaterName}】私聊有消息更新，请注意关注！`);
                }
            }

        });

        this.subscribe15 = ea.subscribe(nsCons.EVENT_CHAT_DO_MSG_FILTER, (payload) => {

            if (payload.action == 'clear') {
                this._doClearFilter();
                return;
            }

            this._doFilter(payload.filter);

        });

        this.subscribe16 = ea.subscribe(nsCons.EVENT_CHAT_TOPIC_SCROLL_TO, (payload) => {

            this.gotoChatItem(payload.chat);

        });

    }

    _doClearFilter() {
        this._filter = false;
        _.each(this.chats, item => {
            item._hidden = false;
            _.each(item.chatLabels, cl => { cl._filter = false; });
        });
        // bs.signal('sg-chatlabel-refresh');
    }

    _doFilter(filter) {

        if (this._filter) {
            this._doClearFilter();
        }

        this._filter = true;

        _.each(this.chats, item => {
            let v = _.some(item.chatLabels, cl => {
                let vv = (cl.name == filter) && (cl.voters && cl.voters.length > 0);
                cl._filter = vv;
                return vv;
            });
            item._hidden = !v;
        });
    }

    getNewMsgCnt() {
        if (!window.localStorage) return {};

        let item = localStorage.getItem(nsCons.KEY_CHAT_NEW_MSG_CNT);
        if (!item) return {};

        item = JSON.parse(item);

        if (!this.loginUser) return {};

        let loginItem = item[this.loginUser.username];
        if (!loginItem) return {};

        return loginItem;
    }

    saveNewMsgCnt(chatTo, cnt) {
        if (!window.localStorage) return;

        let item = localStorage.getItem(nsCons.KEY_CHAT_NEW_MSG_CNT);
        item = !item ? {} : JSON.parse(item);

        let loginItem = item[this.loginUser.username];
        loginItem = loginItem ? loginItem : {};
        item[this.loginUser.username] = loginItem;

        loginItem[chatTo] = cnt;
        localStorage.setItem(nsCons.KEY_CHAT_NEW_MSG_CNT, JSON.stringify(item));
    }

    clearNewMsgCnt(chatTo) {
        if (!window.localStorage) return;

        let item = localStorage.getItem(nsCons.KEY_CHAT_NEW_MSG_CNT);
        if (!item) return;

        item = JSON.parse(item);

        let loginItem = item[this.loginUser.username];
        if (!loginItem) return;

        delete loginItem[chatTo];

        localStorage.setItem(nsCons.KEY_CHAT_NEW_MSG_CNT, JSON.stringify(item));
    }

    updateNotifyDirect(chat, message) {

        let alarm = utils.getAlarm();

        if (!alarm.off && alarm.news) {

            toastr.info(message, null, _.extend(toastrOps, {
                onclick: () => {
                    chat && this.scrollToAfterImgLoaded(chat.id);
                }
            }));

            push.create('TMS沟通私聊消息通知', {
                body: _.replace(message, '可点击查看', '请注意关注'),
                icon: {
                    x16: 'img/tms-x16.ico',
                    x32: 'img/tms-x32.png'
                },
                timeout: 5000
            });

            (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
        }
    }

    updateNotifyChannel(chat, message, msgItem) {

        let alarm = utils.getAlarm();

        if (!alarm.off && alarm.news) {

            toastr.info(message, null, _.extend(toastrOps, {
                onclick: () => {
                    chat && this.scrollToAfterImgLoaded(chat.id);
                    // 不安全的判断方式
                    if (_.includes(message, '话题回复')) {
                        ea.publish(nsCons.EVENT_CHAT_TOPIC_SHOW, {
                            chat: chat,
                            rid: (msgItem ? msgItem.rid : null)
                        });
                    }
                }
            }));

            push.create(`TMS沟通频道消息通知`, {
                body: _.replace(message, '可点击查看', '请注意关注'),
                icon: {
                    x16: 'img/tms-x16.ico',
                    x32: 'img/tms-x32.png'
                },
                timeout: 5000
            });

            (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
        }
    }

    updateNotify(chat, msg, message) {
        
        if (chat.version != msg.version) {
            $.get('/admin/chat/channel/get', {
                id: chat.id
            }, (data) => {
                _.extend(chat, data.data);

                let isOwn = msg.username == this.loginUser.username;

                if (!isOwn && message) {
                    this.updateNotifyChannel(chat, message, msg);
                }
                // TODO 自动滚动定位到更新消息，或者显示更新图标，让用户手动触发定位到更新消息
            });
        }
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        this.subscribe4.dispose();
        this.subscribe5.dispose();
        this.subscribe6.dispose();
        this.subscribe7.dispose();
        this.subscribe8.dispose();
        this.subscribe9.dispose();
        this.subscribe10.dispose();
        this.subscribe11.dispose();
        this.subscribe12.dispose();
        this.subscribe13.dispose();
        this.subscribe14.dispose();
        this.subscribe15.dispose();
        this.subscribe16.dispose();

        clearInterval(this.timeagoTimer);
        poll.stop();
    }

    /**
     * 在视图模型(ViewModel)展示前执行一些自定义代码逻辑
     * @param  {[object]} params                参数
     * @param  {[object]} routeConfig           路由配置
     * @param  {[object]} navigationInstruction 导航指令
     * @return {[promise]}                      你可以可选的返回一个延迟许诺(promise), 告诉路由等待执行bind和attach视图(view), 直到你完成你的处理工作.
     */
    activate(params, routeConfig, navigationInstruction) {

        this._reset();

        this.markId = params.id;
        this.replyId = params.rid;
        this.routeConfig = routeConfig;

        if (this.chatId) {
            this.preChatId = this.chatId; // 记录切换前的沟通对象
        }
        this.chatId = nsCtx.chatId = params.username;

        localStorage && localStorage.setItem(nsCons.KEY_REMEMBER_LAST_CHAT_TO, this.chatId);

        this.isAt = nsCtx.isAt = _.startsWith(params.username, '@');
        this.chatTo = nsCtx.chatTo = utils.getChatName(params.username);

        if (this.markId) {
            history.replaceState(null, '', utils.removeUrlQuery('id'));
        }

        if (this.replyId) {
            history.replaceState(null, '', utils.removeUrlQuery('rid'));
        }

        let newMsgCntItem = localStorage ? localStorage.getItem(nsCons.KEY_CHAT_NEW_MSG_CNT) : {};

        return Promise.all([chatService.loginUser(true).then((user) => {
                this.loginUser = user;
                nsCtx.loginUser = user;
                nsCtx.isSuper = utils.isSuperUser(this.loginUser);
                nsCtx.isAdmin = utils.isAdminUser(this.loginUser);
            }),
            chatService.listUsers(true).then((users) => {
                this.users = users;
                nsCtx.users = users;
                window.tmsUsers = users;

                let newMsgCntItem = this.getNewMsgCnt();
                _.each(this.users, u => {
                    if (newMsgCntItem[`@${u.username}`]) {
                        u.newMsgCnt = newMsgCntItem[`@${u.username}`];
                    }
                });

                if (this.isAt) {
                    this.channel = null;
                    this.user = _.find(this.users, {
                        username: this.chatTo
                    });

                    if (this.user) {
                        let name = this.user ? (this.user.name ? this.user.name : this.user.username) : this.chatTo;
                        routeConfig.navModel.setTitle(`${(this.loginUser && (this.loginUser.username == this.user.username)) ? '我' : name} | 私聊 | TMS`);

                        this.user.newMsgCnt = 0;
                        this.clearNewMsgCnt(`@${this.user.username}`);

                        this.listChatDirect(true);
                    } else {
                        toastr.error(`聊天用户[${this.chatTo}]不存在或者没有权限访问!`);
                        if (this.preChatId) {
                            window.location = wurl('path') + `#/chat/${this.preChatId}`;
                        } else {
                            if (this.loginUser) {
                                window.location = wurl('path') + `#/chat/@${this.loginUser.username}`;
                            } else {
                                window.location = wurl('path') + `#/chat/all`;
                            }
                        }
                    }

                }
            }),
            chatService.listChannels(true).then((channels) => {
                this.channels = channels;
                nsCtx.channels = channels;

                let newMsgCntItem = this.getNewMsgCnt();
                _.each(this.channels, c => {
                    if (newMsgCntItem[`${c.name}`]) {
                        c.newMsgCnt = newMsgCntItem[`${c.name}`];
                    }
                });

                if (!this.isAt) {
                    this.user = null;
                    this.channel = _.find(this.channels, {
                        name: this.chatTo
                    });

                    if (this.channel) {
                        routeConfig.navModel.setTitle(`${this.channel.title} | 频道 | TMS`);

                        this.channel.newMsgCnt = 0;
                        this.clearNewMsgCnt(this.channel.name);

                        this.listChatChannel(true);
                    } else {
                        toastr.error(`聊天频道[${this.chatTo}]不存在或者没有权限访问!`);
                        if (this.preChatId) {
                            window.location = wurl('path') + `#/chat/${this.preChatId}`;
                        } else {
                            if (this.loginUser) {
                                window.location = wurl('path') + `#/chat/@${this.loginUser.username}`;
                            } else {
                                window.location = wurl('path') + `#/chat/all`;
                            }
                        }
                    }
                }
            }),
            chatService.listMyTags(true).then(tags => {
                this.myTags = tags;
                nsCtx.myTags = tags;
            })
        ]);

    }

    _reset() {
        this.progressWidth = 0;
        this.chats && (this.chats.splice(0, this.chats.length));
        // this.chats = null;
        this.first = true; // 第一页
        this.last = true; // 最后一页
        this._filter = false;
    }

    lastMoreHandler() { // 上面的老消息

        let start = _.first(this.chats).id;

        let url;
        let data;
        if (this.isAt) {
            url = `/admin/chat/direct/more`;
            data = {
                last: true,
                start: start,
                size: 20,
                chatTo: this.chatTo
            };
        } else {
            url = `/admin/chat/channel/more`;
            data = {
                last: true,
                start: start,
                size: 20,
                channelId: this.channel.id
            };
        }
        this.lastMoreP = $.get(url, data, (data) => {
            if (data.success) {
                this._stowAndPin(data.data);
                this.chats = _.unionBy(_.reverse(data.data), this.chats, 'id');
                this.last = (data.msgs[0] - data.data.length <= 0);
                !this.last && (this.lastCnt = data.msgs[0] - data.data.length);
                this.scrollToAfterImgLoaded(start);

                _.delay(() => { _.each(data.data, item => item._show = true) }, this.delayMs);
            } else {
                toastr.error(data.data, '获取更多消息失败!');
            }
        });
    }

    firstMoreHandler() { // 前面的新消息

        let start = _.last(this.chats).id;
        let url;
        let data;
        if (this.isAt) {
            url = `/admin/chat/direct/more`;
            data = {
                last: false,
                start: start,
                size: 20,
                chatTo: this.chatTo
            };
        } else {
            url = `/admin/chat/channel/more`;
            data = {
                last: false,
                start: start,
                size: 20,
                channelId: this.channel.id
            };
        }
        this.nextMoreP = $.get(url, data, (data) => {
            if (data.success) {
                this._stowAndPin(data.data);
                this.chats = _.unionBy(this.chats, data.data, 'id');
                this.first = (data.msgs[0] - data.data.length <= 0);
                !this.first && (this.firstCnt = data.msgs[0] - data.data.length);
                this.scrollToAfterImgLoaded(start);

                _.delay(() => { _.each(data.data, item => item._show = true) }, this.delayMs);
            } else {
                toastr.error(data.data, '获取更多消息失败!');
            }
        });
    }

    // 获取频道消息
    listChatChannel(isCareMarkId) {

        var data = {
            size: 20,
            channelId: this.channel.id
        };

        // 如果设定了获取消息界限
        if (this.markId && isCareMarkId) {
            data.id = this.markId;
        }

        $.get('/admin/chat/channel/listBy', data, (data) => {
            this.processChats(data);
            this._getStowsAndPins();
        });
    }

    // 获取私聊消息
    listChatDirect(isCareMarkId) {

        var data = {
            size: 20,
            chatTo: this.chatTo
        };

        // 如果设定了获取消息界限
        if (this.markId && isCareMarkId) {
            data.id = this.markId;
        }
        $.get('/admin/chat/direct/list', data, (data) => {
            this.processChats(data);
        });
    }

    // 共同返回消息处理
    processChats(data) {
        if (data.success) {
            // this.chats = _.reverse(data.data.content);
            let chats = _.reverse(data.data.content);
            if (_.isNil(this.chats)) {
                this.chats = [...chats];
            } else {
                this.chats.splice(0, this.chats.length, ...chats);
            }
            let lastChat = _.last(this.chats);
            lastChat && (lastChat.__scroll = true); // 标记消息列表渲染完成需要执行消息滚动定位.
            this.last = data.data.last;
            this.first = data.data.first;
            !this.last && (this.lastCnt = data.data.totalElements - data.data.numberOfElements);
            !this.first && (this.firstCnt = data.data.size * data.data.number);

            _.delay(() => { _.each(this.chats, item => item._show = true) }, this.delayMs);
        }
    }

    _scrollTo(to) {
        if (to === '' || to === null || _.isUndefined(to)) {
            return;
        }
        if (to == 'b') {
            $(this.commentsRef).parent().scrollTo('max');
        } else if (to == 't') {
            $(this.commentsRef).parent().scrollTo(0);
        } else {
            if (_.some(this.chats, { id: +to })) {
                $(this.commentsRef).parent().scrollTo(`.em-chat-content-item.comment[data-id="${to}"]`, {
                    offset: this.offset
                });
                $(this.commentsRef).find(`.comment[data-id]`).removeClass('active');
                $(this.commentsRef).find(`.comment[data-id=${to}]`).addClass('active');
            } else {
                $(this.commentsRef).parent().scrollTo('max');
                toastr.warning(`消息[${to}]不存在,可能已经被删除!`);
            }
        }
    }

    scrollToAfterImgLoaded(to) {
        _.defer(() => {
            new ImagesLoaded(this.commentsRef).always(() => {
                this._scrollTo(to);
            });

            this._scrollTo(to);
        });

    }

    doPoll() {
        poll.start((resetCb, stopCb) => {
            if (this._filter) return;
            this._pollChats(resetCb, stopCb);
            this._poll(resetCb, stopCb);
        });
    }

    _poll(resetCb, stopCb) {

        let lastChat = _.last(this.chats);

        if (this.pollOnGoing || this.isAt || !this.channel || !lastChat) {
            return;
        }

        this.pollOnGoing = true;

        $.get('/admin/chat/channel/poll', {
            channelId: this.channel.id,
            lastChatChannelId: lastChat.id,
            isAt: true
        }, (data) => {
            if (data.success) {

                let alarm = utils.getAlarm();

                if (this.countAt && (data.data.countAt > this.countAt) && !alarm.off && alarm.ats) {
                    push.create('TMS沟通@消息通知', {
                        body: `你有${data.data.countAt - this.countAt}条新的@消息!`,
                        icon: {
                            x16: 'img/tms-x16.ico',
                            x32: 'img/tms-x32.png'
                        },
                        timeout: 5000
                    });

                    (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
                }
                this.countAt = data.data.countAt;
                ea.publish(nsCons.EVENT_CHAT_POLL_UPDATE, {
                    countAt: data.data.countAt,
                    countMyRecentSchedule: data.data.countMyRecentSchedule
                });

                if (data.data.chatMsgItems && data.data.chatMsgItems.length > 0) {
                    ea.publish(nsCons.EVENT_CHAT_MSG_POLL_UPDATE, data.data.chatMsgItems);
                    poll.reset();
                }
            }
        }).always(() => {
            this.pollOnGoing = false;
        });
    }

    // 消息轮询处理
    _pollChats(resetCb, stopCb) {

        if (this.pollChatsOngoing || _.isEmpty(this.chats) || !this.first) {
            return;
        }

        let lastChat = _.last(this.chats);

        let url;
        let data;

        if (this.isAt) {
            url = `/admin/chat/direct/latest`;
            data = {
                id: lastChat ? lastChat.id : 0,
                chatTo: this.chatTo
            };
        } else {
            url = `/admin/chat/channel/latest`;
            data = {
                id: lastChat ? lastChat.id : 0,
                channelId: this.channel.id
            };
        }

        this.pollChatsOngoing = true;

        $.get(url, data, (data) => {
            if (data.success) {

                if (!this._checkPollResultOk(data)) {
                    return;
                }

                this._checkNeedNotify(data);

                this.chats = _.unionBy(this.chats, data.data, 'id');

                _.delay(() => { _.each(data.data, item => item._show = true) }, this.delayMs);

                let hasOwn = _.some(data.data, (item) => {
                    return item.creator.username == this.loginUser.username;
                });
                let alarm = utils.getAlarm();
                if (!alarm.off || hasOwn) this.scrollToAfterImgLoaded('b');
            } else {
                toastr.error(data.data, '轮询获取消息失败!');
            }
        }).fail((xhr, sts) => {
            stopCb();
            utils.errorAutoTry(() => {
                resetCb();
            });
        }).always(() => {
            this.pollChatsOngoing = false;
        });
    }

    _getStowsAndPins() {
        if (this.isAt) return;
        if (_.isEmpty(this.chats)) return;

        $.when(
            $.get(`/admin/chat/channel/stow/list`, {}, (data) => {
                this.stows = data.data;
            }),
            $.get(`/admin/channel/pin/listBy`, { id: this.channel.id }, (data) => {
                this.pins = data.data;
            })).done(() => this._stowAndPin(this.chats));
    }

    _stowAndPin(chats) {
        if (this.isAt) return;
        if (_.isEmpty(chats)) return;

        _.each(this.stows, item => {
            let chat = _.find(chats, { id: item[1] });
            if (chat != null) {
                chat._stowed = true;
                chat.stowId = item[0];
            }
        });

        _.each(this.pins, item => {
            let chat = _.find(chats, { id: item[1] });
            if (chat != null) {
                chat._pined = true;
                chat.pinId = item[0];
            }
        });
    }

    _checkNeedNotify(data) {

        if (data.data.length == 0) {
            return false;
        }

        let hasOwn = _.some(data.data, (item) => {
            return item.creator.username == this.loginUser.username;
        });

        let alarm = utils.getAlarm();
        if (!hasOwn && !alarm.off && alarm.news) {
            this.channel && (push.create('TMS沟通频道消息通知', {
                body: `频道[${this.channel.title}]有新消息了!`,
                icon: {
                    x16: 'img/tms-x16.ico',
                    x32: 'img/tms-x32.png'
                },
                timeout: 5000
            }));

            this.user && (push.create('TMS沟通私聊消息通知', {
                body: `用户[${this.user.name ? this.user.name : this.user.username}]有新消息了!`,
                icon: {
                    x16: 'img/tms-x16.ico',
                    x32: 'img/tms-x32.png'
                },
                timeout: 5000
            }));

            (!alarm.off && alarm.audio) && ea.publish(nsCons.EVENT_AUDIO_ALERT, {});
        }
    }

    _checkPollResultOk(data) {

        if (data.data.length == 0) {
            return false;
        }

        let chat = _.first(data.data);
        return this.isAt ? _.has(chat, 'chatTo') : _.has(chat, 'channel');
    }

    /**
     * 当数据绑定引擎绑定到视图时被调用
     * @param  {[object]} ctx 视图绑定上下文环境对象
     */
    bind(ctx) {

        this.doPoll();
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

        this._initSock();

        $(this.scrollbarRef).on('mouseenter', '.em-chat-content-item', (event) => {
            event.preventDefault();
            let $item = $(event.currentTarget);
            this.$hoveredItem = $item;
            this.isShowHead = !utils.isElementInViewport($item.children('.em-user-avatar'));
            let $next = $item.next('.em-chat-content-item');
            if ($next.size() === 1) {
                this.isShowFoot = !utils.isElementInViewport($next.children('.em-user-avatar'));
            } else {
                this.isShowFoot = false;
            }
        }).on('mouseleave', (event) => {
            event.preventDefault();
            this.isShowHead = false;
            this.isShowFoot = false;
        });

        $(this.commentsRef).on('click', '.cbutton', function(event) {
            event.preventDefault();
            let $btn = $(this);
            $btn.addClass('cbutton--click');
            setTimeout(function() {
                $btn.removeClass('cbutton--click');
            }, 500);
        });

        $(this.chatContainerRef).on('click', 'code[data-code]', function(event) {
            if (event.ctrlKey) {
                event.stopImmediatePropagation();
                event.preventDefault();
                clipboard.copy($(event.currentTarget).attr('data-code')).then(
                    () => { toastr.success('复制到剪贴板成功!'); },
                    (err) => { toastr.error('复制到剪贴板失败!'); }
                );
            }
        });

        $(this.chatContainerRef).on('click', '.pre-code-wrapper', function(event) {
            if (event.ctrlKey) {
                event.stopImmediatePropagation();
                event.preventDefault();
                clipboard.copy($(event.currentTarget).find('i[data-clipboard-text]').attr('data-clipboard-text')).then(
                    () => { toastr.success('复制到剪贴板成功!'); },
                    (err) => { toastr.error('复制到剪贴板失败!'); }
                );
            }
        });

        $(this.chatContainerRef).on('click', '.tms-chat-msg-code-trigger', function(event) {

            let $pre = $(this).parent().children('pre');
            $pre.toggleClass('fold');
            if ($pre.hasClass('fold')) {
                $(this).text('展开');
            } else {
                $(this).text('折叠');
            }
        });

        $(this.chatContainerRef).on('mouseenter', 'pre.fold', function(event) {

            let $pre = $(event.currentTarget);
            if ($pre.height() < 100) {
                $pre.parent().children('.tms-chat-msg-code-trigger').remove();
            }
        });

        $('.tms-comments-container[ref="scrollbarRef"]').scroll(_.throttle((event) => {
            try {
                let sHeight = $(event.currentTarget)[0].scrollHeight;
                let sTop = $(event.currentTarget)[0].scrollTop;

                let scale = sTop * 1.0 / (sHeight - $(event.currentTarget).outerHeight());
                this.progressWidth = $(event.currentTarget).outerWidth() * scale;
            } catch (err) { this.progressWidth = 0; }

        }, 10));

    }

    goHeadHandler() {
        this.scrollTo(this.$hoveredItem, 500, () => { this.isShowHead = false; });
    }

    goFootHandler() {
        this.scrollTo(this.$hoveredItem.next(), 500, () => { this.isShowFoot = false; });
    }

    initFocusedComment() {
        $(this.commentsRef).on('click', '.comment.item', (event) => {
            this.focusedComment = $(event.currentTarget);
        }).on('dblclick', '.comment.item', (event) => {
            if (event.ctrlKey) {
                let chatId = $(event.currentTarget).attr('data-id');
                let $t = $(event.currentTarget).find('.content > textarea');
                let item = _.find(this.chats, { id: Number.parseInt(chatId) });

                if (!item.openEdit && (item.creator.username != this.loginUser.username)) {
                    return;
                }

                $.get(`/admin/chat/${this.isAt ? 'direct' : 'channel'}/get`, {
                    id: item.id
                }, (data) => {
                    if (data.success) {
                        if (item.version != data.data.version) {
                            _.extend(item, data.data);
                        }
                        item.isEditing = true;
                        item.contentOld = item.content;
                        _.defer(() => {
                            $t.focus().select();
                            autosize.update($t.get(0));
                        });
                    } else {
                        toastr.error(data.data);
                    }

                });
            }
        });
    }

    getScrollTargetComment(isPrev) {
        if (isPrev) {
            if (this.focusedComment && this.focusedComment.size() === 1) {
                let $avatar = this.focusedComment.find('> a.em-user-avatar');
                if (utils.isElementInViewport($avatar)) {
                    let prev = this.focusedComment.prev('.comment.item');
                    (prev.size() === 1) && (this.focusedComment = prev);
                }
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
        this.markId = this.focusedComment ? this.focusedComment.attr('data-id') : null;
        return this.focusedComment;
    }

    scrollTo(target, duration = 0, onAfter) {
        this.focusedComment = target;
        if ((target instanceof jQuery) && target.is('.comment.item:first')) {
            this._scrollTo('t');
            return;
        } else if ((target instanceof jQuery) && target.is('.comment.item:last')) {
            this._scrollTo('b');
            return;
        }
        $(this.commentsRef).parent().scrollTo(target, duration, {
            offset: this.offset,
            onAfter: onAfter
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
        }).bind('keydown', 't', (event) => {
            event.preventDefault();
            this.scrollTo($(this.commentsRef).children('.comment.item:first'));
        }).bind('keydown', 'b', (event) => {
            event.preventDefault();
            this.scrollTo($(this.commentsRef).children('.comment.item:last'));
        });

    }

    gotoChatItem(item) {

        if (item.chatAt && item.chatAt.chatReply) {

            let chat = _.find(this.chats, c => _.some(c.chatReplies, { id: item.id }));

            if (chat) {
                this.scrollToAfterImgLoaded(chat.id);
                _.defer(() => ea.publish(nsCons.EVENT_CHAT_TOPIC_SHOW, {
                    chat: chat,
                    rid: item.id
                }));
            } else {
                let chatTo = item.chatAt.chatChannel.channel.name;

                if (this.chatTo == chatTo) { // 当前定位消息就在当前聊天对象里,只是没有获取显示出来
                    this.activate({
                        id: item.chatAt.chatChannel.id,
                        rid: item.id,
                        username: chatTo
                    }, this.routeConfig);
                } else { // 定位消息在非当前聊天对象中
                    window.location = wurl('path') + `#/chat/${chatTo}?id=${item.chatAt.chatChannel.id}&rid=${item.id}`;
                }
            }
            return;
        }

        if (item.chatStow && item.chatStow.chatReply) {

            let chat = _.find(this.chats, c => _.some(c.chatReplies, { id: item.id }));

            if (chat) {
                this.scrollToAfterImgLoaded(chat.id);
                _.defer(() => ea.publish(nsCons.EVENT_CHAT_TOPIC_SHOW, {
                    chat: chat,
                    rid: item.id
                }));
            } else {
                let chatTo = item.chatStow.chatChannel.channel.name;

                if (this.chatTo == chatTo) { // 当前定位消息就在当前聊天对象里,只是没有获取显示出来
                    this.activate({
                        id: item.chatStow.chatChannel.id,
                        rid: item.id,
                        username: chatTo
                    }, this.routeConfig);
                } else { // 定位消息在非当前聊天对象中
                    window.location = wurl('path') + `#/chat/${chatTo}?id=${item.chatStow.chatChannel.id}&rid=${item.id}`;
                }
            }
            return;
        }

        let chat = _.find(this.chats, { id: item.id });
        if (chat) {
            this.scrollToAfterImgLoaded(item.id);
        } else {

            let chatTo;
            let chatId;

            if (item.chatTo) {
                chatTo = item.chatTo.username;
                chatId = `@${chatTo}`;
            } else if (item.channel) {
                chatTo = item.channel.name;
                chatId = `${chatTo}`;
            }

            if (this.chatTo == chatTo) { // 当前定位消息就在当前聊天对象里,只是没有获取显示出来
                this.activate({
                    id: item.id,
                    username: chatId
                }, this.routeConfig);
            } else { // 定位消息在非当前聊天对象中
                window.location = wurl('path') + `#/chat/${chatId}?id=${item.id}`;
            }
        }

    }

    refreshLatestHandler(event) {
        event.stopImmediatePropagation();
        this.markId = null;
        if (this.isAt) {
            this.listChatDirect(false);
        } else {
            this.listChatChannel(false);
        }
    }

    dimmerHandler() {
        ea.publish(nsCons.EVENT_CHAT_TOGGLE_LEFT_SIDEBAR, true);
    }
}
