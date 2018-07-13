import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatTopMenu {

    @bindable loginUser;
    @bindable chatUser;
    @bindable users;
    @bindable channels;
    @bindable channel;
    @bindable chatId;
    @bindable chatTo;
    @bindable isAt;
    @bindable onlines;
    isRightSidebarShow = false;
    activeType = ''; // 触发激活的操作类型: search | stow | at | attach

    ACTION_TYPE_SEARCH = nsCons.ACTION_TYPE_SEARCH;
    ACTION_TYPE_STOW = nsCons.ACTION_TYPE_STOW;
    ACTION_TYPE_PIN = nsCons.ACTION_TYPE_PIN;
    ACTION_TYPE_AT = nsCons.ACTION_TYPE_AT;
    ACTION_TYPE_DIR = nsCons.ACTION_TYPE_DIR;
    ACTION_TYPE_ATTACH = nsCons.ACTION_TYPE_ATTACH;
    ACTION_TYPE_SCHEDULE = nsCons.ACTION_TYPE_SCHEDULE;
    ACTION_TYPE_TODO = nsCons.ACTION_TYPE_TODO;

    countAt = null;
    newAtCnt = 0;

    channelLinks = [];

    loginUserChanged() {
        if (this.loginUser) {
            this.isSuper = utils.isSuperUser(this.loginUser);
        }
    }

    // chatToChanged() {
    //     $(this.chatToDropdownRef).dropdown('set selected', this.chatId).dropdown('hide');
    //     _.delay(() => $(this.chatToDropdownRef).dropdown('set selected', this.chatId).dropdown('hide'), 1000); // 解决在线状态没有显示问题
    // }

    channelChanged() {
        this._refreshChannelLinks();
    }

    _refreshChannelLinks() {
        if (this.channel) {
            $.get('/admin/link/listBy', {
                channelId: this.channel.id
            }, (data) => {
                if (data.success) {
                    this.channelLinks = data.data;
                } else {
                    this.channelLinks = [];
                }
            });
        }
    }

    savePollUpdate(newAtCnt) {
        if (!window.localStorage) return;

        let item = localStorage.getItem(nsCons.KEY_CHAT_NEW_AT_MSG_CNT);
        if (!item) {
            item = {}
        } else {
            item = JSON.parse(item);
        }

        let my = item[this.loginUser.username];

        if (!my) item[this.loginUser.username] = my = {};

        if (newAtCnt) my.newAtCnt = newAtCnt;

        localStorage.setItem(nsCons.KEY_CHAT_NEW_AT_MSG_CNT, JSON.stringify(item));
    }

    clearPollUpdate() {
        if (!window.localStorage) return;

        let item = localStorage.getItem(nsCons.KEY_CHAT_NEW_AT_MSG_CNT);
        if (!item) return;

        item = JSON.parse(item);
        let my = item[this.loginUser.username];

        if (!my) return;

        delete my['newAtCnt'];

        localStorage.setItem(nsCons.KEY_CHAT_NEW_AT_MSG_CNT, JSON.stringify(item));
    }

    getPollUpdate() {
        if (!window.localStorage) return {};

        let item = localStorage.getItem(nsCons.KEY_CHAT_NEW_AT_MSG_CNT);
        if (!item) return {};

        item = JSON.parse(item);
        let my = item[this.loginUser.username];

        if (!my) return {};

        return my;
    }

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_MSG_WIKI_DIR, (payload) => {
            this.dir = payload.dir;

            if ((this.activeType == this.ACTION_TYPE_DIR) && this.isRightSidebarShow) {
                ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
                    action: this.activeType,
                    result: this.dir
                });
            }
        });

        this.subscribe1 = ea.subscribe(nsCons.EVENT_CHAT_POLL_UPDATE, (payload) => {
            if (this.countAt !== null && this.newAtCnt <= 0) {
                this.newAtCnt = payload.countAt - this.countAt;
                this.savePollUpdate(this.newAtCnt);
            }
            this.countAt = payload.countAt;
            this.countMyRecentSchedule = payload.countMyRecentSchedule;
        });

        // this.subscribe2 = ea.subscribe(nsCons.EVENT_SWITCH_CHAT_TO, (payload) => {
        //     $(this.chatToDropdownRef).dropdown('toggle');
        // });

        this.subscribe3 = ea.subscribe(nsCons.EVENT_CHANNEL_LINKS_REFRESH, (payload) => {
            this._refreshChannelLinks();
        });

        this.subscribe4 = ea.subscribe(nsCons.EVENT_CHAT_TOPIC_SHOW, (payload) => {
            this.showTopicHandler(payload);
        });

        this.subscribe5 = ea.subscribe(nsCons.EVENT_CHAT_TOGGLE_RIGHT_SIDEBAR, (payload) => {
            this.toggleRightSidebar();
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
        this.subscribe5.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.initHotkeys();
        this.initSearch();

        // 还原记忆的新@消息数量
        let pollData = this.getPollUpdate();
        pollData.newAtCnt && (this.newAtCnt = pollData.newAtCnt);

        // $(this.channelLinksDdRef).dropdown({
        //     fullTextSearch: true
        // });
    }

    initSearch() {
        var source = [];
        if (localStorage) {
            var v = localStorage.getItem('tms/chat-direct:search');
            source = v ? $.parseJSON(v) : [];
        }
        this.searchSource = source;
        $(this.searchRef).search({
            source: source,
            onSelect: (result, response) => {
                this.searchHandler();
            },
            onResults: () => {
                $(this.searchRef).search('hide results');
            }
        });

    }

    searchHandler() {

        $(this.searchRef).search('hide results');

        let search = $(this.searchInputRef).val();

        if (!search || search.length < 2) {
            toastr.error('检索条件至少需要两个字符!');
            return;
        }

        this.search = search;

        // 保存检索值
        var isExists = false;
        $.each(this.searchSource, function(index, val) {
            if (val.title == search) {
                isExists = true;
                return false;
            }
        });
        if (!isExists) {
            this.searchSource.splice(0, 0, {
                title: search
            });
            $(this.searchRef).search({
                source: _.clone(this.searchSource)
            });
        }
        localStorage && localStorage.setItem('tms/chat-direct:search', JSON.stringify(this.searchSource));

        let url;
        let data;
        if (this.isAt) {
            url = `/admin/chat/direct/search`;
            data = {
                search: this.search,
                size: 20,
                page: 0
            };
        } else {
            url = `/admin/chat/channel/search`;
            data = {
                search: this.search,
                channelId: this.channel.id,
                size: 20,
                page: 0
            };
        }

        this.searchingP = $.get(url, data, (data) => {
            if (data.success) {
                this.toggleRightSidebar(true);

                ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
                    action: this.activeType,
                    result: data.data,
                    search: this.search
                });
            }
        });
    }

    initHotkeys() {
        $(document).bind('keydown', 's', (event) => { // sidebar
            event.preventDefault();
            this.toggleRightSidebar();
        }).bind('keydown', 'ctrl+k', (event) => {
            event.preventDefault();
            // $(this.chatToDropdownRef).dropdown('toggle');
        });

        $(this.filterChatToUser).bind('keydown', 'ctrl+k', (event) => {
            event.preventDefault();
            // $(this.chatToDropdownRef).dropdown('toggle');
        });
    }

    // initChatToDropdownHandler(last) {
    //     if (last) {
    //         _.defer(() => {
    //             $(this.chatToDropdownRef).dropdown().dropdown('set selected', this.chatId).dropdown({
    //                 onChange: (value, text, $choice) => {
    //                     window.location = wurl('path') + `#/chat/${$choice.attr('data-id')}`;
    //                 }
    //             });
    //             $(this.chatToDropdownRef).off('focus'); // fix 点击展示模态框，当模特框关闭后，其获取焦点后，自动展示下拉菜单问题
    //         });
    //     }
    // }

    searchFocusHandler() {
        $(this.searchInputRef).css('width', 'auto');
        $(this.searchRemoveRef).show();
        this.isActiveSearch = true;
    }

    searchBlurHandler() {
        if (!$(this.searchInputRef).val()) {
            $(this.searchInputRef).css('width', '95px');
            $(this.searchRemoveRef).hide();
            this.isActiveSearch = false;
        }
    }

    sibebarRightHandler(event) {
        this.toggleRightSidebar();
    }

    toggleRightSidebar(asShow) {
        if (_.isUndefined(asShow)) {
            this.isRightSidebarShow = nsCtx.isRightSidebarShow = !this.isRightSidebarShow;
        } else {
            this.isRightSidebarShow = nsCtx.isRightSidebarShow = asShow;
        }

        ea.publish(nsCons.EVENT_CHAT_SIDEBAR_TOGGLE, {
            isShow: this.isRightSidebarShow
        });
    }

    searchKeyupHandler(evt) {
        if (evt.keyCode === 13) {
            this.activeType = nsCons.ACTION_TYPE_SEARCH;
            this.searchHandler();
        } else if (evt.keyCode === 27) {
            this.clearSearchHandler();
        }
        return true;
    }

    clearSearchHandler() {
        $(this.searchInputRef).val('').focus();
    }

    showStowHandler(event) {

        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_STOW) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.activeType = nsCons.ACTION_TYPE_STOW;
        this.ajaxStow = $.get('/admin/chat/channel/getStows', (data) => {
            if (data.success) {
                let stowChats = _.map(data.data, (item) => {
                    if (item.chatReply) {
                        let chat = item.chatReply;
                        chat.chatStow = item;
                        return chat;
                    }
                    let chatChannel = item.chatChannel;
                    chatChannel.chatStow = item;
                    return chatChannel;
                });
                ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
                    action: this.activeType,
                    result: _.reverse(stowChats)
                });
                this.toggleRightSidebar(true);
            } else {
                toastr.error(data.data, '获取收藏消息失败!');
            }
        });
    }

    showAtHandler(event) {

        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_AT) && (this.newAtCnt == 0) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.clearPollUpdate(); // 清除记忆的新@消息数量

        this.activeType = nsCons.ACTION_TYPE_AT;
        this.newAtCnt = 0;
        this.ajaxAt = $.get('/admin/chat/channel/getAts', {
            page: 0,
            size: 20
        }, (data) => {
            if (data.success) {
                ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
                    action: this.activeType,
                    result: data.data
                });
                this.toggleRightSidebar(true);
            } else {
                toastr.error(data.data, '获取@消息失败!');
            }
        });
    }

    logoutHandler() {
        window.stompClient.disconnect(() => {});
        $.post('/admin/logout').always(() => {
            utils.redirect2Login();
            window.location.reload();
        });
    }

    showWikiDirHandler(event) {

        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_DIR) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.activeType = nsCons.ACTION_TYPE_DIR;
        ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
            action: this.activeType,
            result: this.dir
        });
        this.toggleRightSidebar(true);
    }

    showAttachHandler(event) {

        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_ATTACH) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.activeType = nsCons.ACTION_TYPE_ATTACH;
        ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
            action: this.activeType
        });
        this.toggleRightSidebar(true);
    }

    showScheduleHandler(event) {

        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_SCHEDULE) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.activeType = nsCons.ACTION_TYPE_SCHEDULE;
        ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
            action: this.activeType
        });
        this.toggleRightSidebar(true);
    }

    showTodoHandler(event) {

        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_TODO) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.activeType = nsCons.ACTION_TYPE_TODO;
        ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
            action: this.activeType
        });
        this.toggleRightSidebar(true);
    }

    userEditHandler() {
        this.userEditMd.show();
    }

    membersShowHandler(item, event) {
        event.stopImmediatePropagation();
        ea.publish(nsCons.EVENT_CHANNEL_ACTIONS, {
            action: 'membersShowHandler',
            item: item
        });
    }

    leaveHandler(item, event) {
        event.stopImmediatePropagation();
        ea.publish(nsCons.EVENT_CHANNEL_ACTIONS, {
            action: 'leaveHandler',
            item: item
        });
    }

    membersMgrHandler(item, event) {
        event.stopImmediatePropagation();
        ea.publish(nsCons.EVENT_CHANNEL_ACTIONS, {
            action: 'membersMgrHandler',
            item: item
        });
    }

    editHandler(item, event) {
        event.stopImmediatePropagation();
        ea.publish(nsCons.EVENT_CHANNEL_ACTIONS, {
            action: 'editHandler',
            item: item
        });
    }

    delHandler(item, event) {
        event.stopImmediatePropagation();
        ea.publish(nsCons.EVENT_CHANNEL_ACTIONS, {
            action: 'delHandler',
            item: item
        });
    }

    viewOrMgrUsersHandler(event) {

        if (this.channel.owner.username == this.loginUser.username) {
            this.membersMgrHandler(this.channel, event);
        } else {
            this.membersShowHandler(this.channel, event);
        }
    }

    channelInfoHandler(event) {

        if (this.channel.owner.username == this.loginUser.username) {
            this.editHandler(this.channel, event);
        } else {
            event.stopImmediatePropagation();
        }
    }

    userInfoHandler(event) {
        event.stopImmediatePropagation();
    }

    stopImmediatePropagationHandler(event) {
        event.stopImmediatePropagation();
    }

    mailToHandler(event) {
        // event.stopImmediatePropagation();
        window.location = `mailto:${this.chatUser.mails}`;
    }

    initChannelLinksHandler(last) {
        if (last) {
            _.defer(() => {
                $(this.channelLinksDdRef).dropdown({
                    // action: 'hide',
                    fullTextSearch: true
                });
            });
        }
    }

    addChannelLinkHandler(event) {
        this.channelLinkMgrVm.show();
    }

    openChannelLinkHandler(event, item) {
        $(this.channelLinksDdRef).dropdown('hide');
        utils.openNewWin(item.href);
        $.post('/admin/link/count/inc', { id: item.id });
    }

    showPinHandler(event) {
        if (this.isRightSidebarShow && (this.activeType == nsCons.ACTION_TYPE_PIN) && !event.ctrlKey) {
            this.toggleRightSidebar();
            return;
        }

        this.activeType = nsCons.ACTION_TYPE_PIN;

        this.ajaxPin = $.get('/admin/chat/channel/pin/list', {
            cid: this.channel.id
        }, (data) => {
            if (data.success) {
                let pinChats = _.map(data.data, (item) => {
                    let chatChannel = item.chatChannel;
                    chatChannel.chatPin = item;
                    return chatChannel;
                });
                ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
                    action: this.activeType,
                    result: _.reverse(pinChats)
                });
                this.toggleRightSidebar(true);
            } else {
                toastr.error(data.data, '获取频道固定消息失败!');
            }
        });
    }

    showTopicHandler(item) {

        this.activeType = nsCons.ACTION_TYPE_TOPIC;

        ea.publish(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_TOGGLE, {
            action: this.activeType,
            result: item
        });

        this.toggleRightSidebar(true);

    }

    toggleLeftBarHandler() {
        ea.publish(nsCons.EVENT_CHAT_TOGGLE_LEFT_SIDEBAR, null);
    }

    isSubscribed(item) {
        return _.some(item.subscriber, { username: this.loginUser.username });
    }

    subscribeHandler(item) {

        let isSub = this.isSubscribed(item);

        $.post(`/admin/channel/${isSub ? 'unsubscribe' : 'subscribe'}`, {
            id: item.id
        }, (data) => {
            if (data.success) {
                item.subscriber = data.data.subscriber;
                toastr.success(`${isSub ? '取消订阅' : '订阅频道'}成功!`);
                item.isSubscribed = !isSub;
            } else {
                toastr.error(data.data, `${isSub ? '取消订阅' : '订阅频道'}失败!`);
            }
        });
    }
}
