import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmChatMsg {

    last = true;
    @bindable loginUser;
    @bindable isAt;
    @bindable channel;

    @bindable chats;
    @bindable actived;

    basePath = utils.getBasePath();

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.initHotkeys();
    }

    detached() {
        window.__debug && console.log('EmChatMsg--detached');

        $(document).unbind('keydown', this.openKeydownHandler);

        this.openKeydownHandler = null;
        this.loginUser = null;
        this.channel = null;
        this.chats = null;
        this.actived = null;

    }

    initHotkeys() {

        this.openKeydownHandler = (event) => {
            event.preventDefault();
            let item = _.find(this.chats, {
                isHover: true
            });
            item && (item.isOpen = !item.isOpen);
        };

        $(document).bind('keydown', 'o', this.openKeydownHandler);

    }

    activedChanged() {
        if (!this.actived) {
            return;
        }

        let payload = this.actived.payload;
        let result = payload.result;

        if (this.actived.payload.action == nsCons.ACTION_TYPE_AT) {
            this.page = result;
            this.chats = _.map(result.content, (item) => {
                if (item.chatReply) {
                    let chat = item.chatReply;
                    chat.chatAt = item;
                    return chat;
                }
                let chatChannel = item.chatChannel;
                chatChannel.chatAt = item;
                return chatChannel;
            });
            this.last = result.last;
            this.moreCnt = result.totalElements - (result.number + 1) * result.size;
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_STOW) {
            this.page = result;
            this.chats = _.map(result.content, (item) => {
                if (item.chatReply) {
                    let chat = item.chatReply;
                    chat.chatStow = item;
                    return chat;
                }

                if (item.chatChannel) {
                    item.chatChannel.chatStow = item;
                    return item.chatChannel;
                } else if (item.chatDirect) {
                    item.chatDirect.chatStow = item;
                    return item.chatDirect;
                }

            });
            this.last = result.last;
            this.moreCnt = result.totalElements - (result.number + 1) * result.size;
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_PIN) {
            this.page = result;
            this.chats = _.map(result.content, (item) => {
                let chatChannel = item.chatChannel;
                chatChannel.chatPin = item;
                return chatChannel;
            });
            this.last = result.last;
            this.moreCnt = result.totalElements - (result.number + 1) * result.size;
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_SEARCH) {
            this.search = payload.search;
            this.page = result;
            this.chats = result.content;
            this.last = result.last;
            this.moreCnt = result.totalElements - (result.number + 1) * result.size;
        }
    }

    searchItemMouseleaveHandler(item) {
        item.isOpen = false;
        item.isHover = false;
    }

    searchItemMouseenterHandler(item) {
        item.isHover = true;
    }

    gotoChatHandler(item, event) {
        ea.publish(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, {
            chatItem: item
        });

        if ((this.actived.payload.action == nsCons.ACTION_TYPE_AT) && (event.shiftKey)) {
            event.stopImmediatePropagation();
            event.preventDefault();
            this.removeAtHandler(item);
        }
    }

    gotoChatReplyParentHandler(item) {
        ea.publish(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, {
            chatItem: item.chatAt.chatChannel
        });
    }

    openSearchItemHandler(item) {
        item.isOpen = !item.isOpen;
    }

    searchMoreHandler() {

        if (this.actived.payload.action == nsCons.ACTION_TYPE_SEARCH) {
            this.searchMoreP = $.get(`/admin/chat/${nsCtx.isAt ? 'direct' : 'channel'}/search`, {
                search: this.search,
                size: this.page.size,
                page: this.page.number + 1,
                channelId: !nsCtx.isAt ? this.channel.id : null,
            }, (data) => {
                if (data.success) {
                    this.chats = _.concat(this.chats, data.data.content);

                    this.page = data.data;
                    this.last = data.data.last;
                    this.moreCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
                }
            });
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_PIN) {
            this.searchMoreP = $.get(`/admin/chat/channel/pin/list`, {
                cid: !nsCtx.isAt ? this.channel.id : null,
                size: this.page.size,
                page: this.page.number + 1
            }, (data) => {
                if (data.success) {
                    this.chats = _.concat(this.chats, _.map(data.data.content, (item) => {
                        let chatChannel = item.chatChannel;
                        chatChannel.chatPin = item;
                        return chatChannel;
                    }));

                    this.page = data.data;
                    this.last = data.data.last;
                    this.moreCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
                }
            });
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_STOW) {
            this.searchMoreP = $.get('/admin/chat/channel/getStows', {
                size: this.page.size,
                page: this.page.number + 1
            }, (data) => {
                if (data.success) {
                    this.chats = _.concat(this.chats, _.map(data.data.content, (item) => {
                        if (item.chatReply) {
                            let chat = item.chatReply;
                            chat.chatStow = item;
                            return chat;
                        }
                        if (item.chatChannel) {
                            item.chatChannel.chatStow = item;
                            return item.chatChannel;
                        } else if (item.chatDirect) {
                            item.chatDirect.chatStow = item;
                            return item.chatDirect;
                        }

                    }));

                    this.page = data.data;
                    this.last = data.data.last;
                    this.moreCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
                }
            });
        } else {
            this.searchMoreP = $.get('/admin/chat/channel/getAts', {
                size: this.page.size,
                page: this.page.number + 1
            }, (data) => {
                if (data.success) {
                    this.chats = _.concat(this.chats, _.map(data.data.content, (item) => {
                        let chatChannel = item.chatChannel;
                        chatChannel.chatAt = item;
                        return chatChannel;
                    }));

                    this.page = data.data;
                    this.last = data.data.last;
                    this.moreCnt = data.data.totalElements - (data.data.number + 1) * data.data.size;
                }
            });
        }
    }

    removePinHandler(item) {
        $.post('/admin/chat/channel/pin/toggle', {
            id: item.id,
            cid: this.channel.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.chats = _.reject(this.chats, {
                    id: item.id
                });
                toastr.success('移除固定消息成功!');
            } else {
                toastr.error(data.data, '移除固定消息失败!');
            }
        });
    }

    removeStowHandler(item) {
        $.post('/admin/chat/channel/removeStow', {
            id: item.chatStow.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.chats = _.reject(this.chats, {
                    id: item.id
                });
                toastr.success('移除收藏消息成功!');
            } else {
                toastr.error(data.data, '移除收藏消息失败!');
            }
        });
    }

    removeAtHandler(item) {
        $.post('/admin/chat/channel/markAsReaded', {
            chatAtId: item.chatAt.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.chats = _.reject(this.chats, {
                    id: item.id
                });
            } else {
                toastr.error(data.data, '移除@消息失败!');
            }
        });
    }

    dateDblclickHandler(item) {

        let offset = parseInt((new Date().getTime() - item.createDate) / 1000 / 60 / 60);

        let offsetD = parseInt(offset / 24);

        if (offsetD > 1) {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, {
                search: `date:${offsetD - 1}d ${offsetD + 1}d`
            });
            return;
        } else if (offsetD > 0) {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, {
                search: `date:2d`
            });
            return;
        }

        if (offset < 2) {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, {
                search: `date:2h`
            });
        } else {
            ea.publish(nsCons.EVENT_CHAT_DO_MSG_SEARCH, {
                search: `date:${offset - 1}h ${offset + 1}h`
            });
        }
    }
}
