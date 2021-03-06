import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSidebarLeft {

    @bindable users;
    @bindable loginUser;
    @bindable channels;
    @bindable chatTo;
    @bindable isAt;
    @bindable onlines;
    filter = '';
    isSuper = nsCtx.isSuper;
    isAdmin = nsCtx.isAdmin;
    isMobile = utils.isMobile();
    isLeftBarHide = true;

    usersChanged() {
        this._filter();
    }

    channelsChanged() {
        this._filter();
    }

    loginUserChanged() {
        if (this.loginUser) {
            this.isSuper = utils.isSuperUser(this.loginUser);
            this.isAdmin = utils.isAdminUser(this.loginUser);
        }
    }

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHANNEL_ACTIONS, (payload) => {
            this[payload.action](payload.item);
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_CHAT_TOGGLE_LEFT_SIDEBAR, (payload) => {
            if (payload) {
                this.isLeftBarHide = payload;
            } else {
                this.isLeftBarHide = !this.isLeftBarHide;
            }
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
    }

    detached() {
        window.__debug && console.log('EmChatSidebarLeft--detached');

        $(this.logoRef).off('mouseenter', this.logoMeHandler);

        this.logoMeHandler = null;
        this.users = null;
        this.loginUser = null;
        this.channels = null;
        this.onlines = null;

    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.logoMeHandler = (event) => {
            $(this.logoRef).animateCss('flip');
        };

        $(this.logoRef).on('mouseenter', this.logoMeHandler);
    }

    _filter() {

        _.each(this.users, (item) => {
            item.hidden = item.username.indexOf(this.filter) == -1;
        });

        _.each(this.channels, (item) => {
            item.hidden = item.name.indexOf(this.filter) == -1;
        });
    }

    chatToUserFilerKeyupHanlder(evt) {
        this._filter();

        if (evt.keyCode === 13) {
            let user = _.find(this.users, {
                hidden: false
            });

            if (user) {
                window.location = wurl('path') + `#/chat/@${user.username}`;
                return;
            }

            let channel = _.find(this.channels, {
                hidden: false
            });

            if (channel) {
                window.location = wurl('path') + `#/chat/${channel.name}`;
                return;
            }
        }
    }

    clearFilterHandler() {
        this.filter = '';
        _.each(this.users, (item) => {
            item.hidden = item.username.indexOf(this.filter) == -1;
        });
        _.each(this.channels, (item) => {
            item.hidden = item.name.indexOf(this.filter) == -1;
        });
    }

    editHandler(item) {
        this.selectedChannel = item;
        this.channelEditMd.show();
    }

    delHandler(item) {
        this.confirmMd.show({
            onapprove: () => {
                $.post('/admin/channel/delete', {
                    id: item.id
                }, (data) => {
                    if (data.success) {
                        toastr.success('删除频道成功!');
                        _.remove(this.channels, { id: item.id });
                        ea.publish(nsCons.EVENT_CHAT_CHANNEL_DELETED, { channel: item });
                    } else {
                        toastr.error(data.data, '删除频道失败!');
                    }
                });
            }
        });
    }

    membersMgrHandler(item) {
        this.selectedChannel = item;
        this.channelMembersMgrMd.show();
    }

    membersShowHandler(item) {
        this.selectedChannel = item;
        this.channelMembersShowMd.show();
    }

    leaveHandler(item) {
        this.confirmMd.show({
            content: `确定要离开频道<code class="nx">${item.title}</code>吗?`,
            onapprove: () => {
                $.post('/admin/channel/leave', {
                    id: item.id
                }, (data) => {
                    if (data.success) {
                        toastr.success('离开频道成功!');
                        ea.publish(nsCons.EVENT_CHAT_CHANNEL_LEAVED, { channel: data.data });
                    } else {
                        toastr.error(data.data, '离开频道失败!');
                    }
                });
            }
        });
    }

    // switchHandler() {
    //     ea.publish(nsCons.EVENT_SWITCH_CHAT_TO, {});
    //  }

    isSubscribed(item) {
        return _.some(item.subscriber, { username: this.loginUser ? this.loginUser.username : '' });
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

    channelHandler() {
        ea.publish(nsCons.EVENT_CHAT_TOGGLE_LEFT_SIDEBAR, true); // 移动端,切换沟通对象时,隐藏左侧边栏
        return true;
    }

    userHandler() {
        ea.publish(nsCons.EVENT_CHAT_TOGGLE_LEFT_SIDEBAR, true); // 移动端,切换沟通对象时,隐藏左侧边栏
        return true;
    }

    editUserHandler(item) {
        this.userEditVm.show(item);
    }

    disableHandler(item) {
        this.confirmVm.show({
            content: `确定要停用该用户吗?`,
            onapprove: () => {
                $.post('/admin/user/update', {
                    username: item.username,
                    enabled: false
                }, (data) => {
                    if (data.success) {
                        item.enabled = false;
                        toastr.success('停用用户成功!');
                    } else {
                        toastr.error(data.data, '停用用户失败!');
                    }
                });
            }
        });
    }

    enableHandler(item) {
        this.confirmVm.show({
            content: `确定要启用该用户吗?`,
            onapprove: () => {
                $.post('/admin/user/update', {
                    username: item.username,
                    enabled: true
                }, (data) => {
                    if (data.success) {
                        item.enabled = true;
                        toastr.success('启用用户成功!');
                    } else {
                        toastr.error(data.data, '启用用户失败!');
                    }
                });
            }
        });
    }

}
