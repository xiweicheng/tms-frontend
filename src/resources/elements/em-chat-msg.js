import { bindable, containerless } from 'aurelia-framework';

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

    initHotkeys() {
        $(document).bind('keydown', 'o', (event) => {
            event.preventDefault();
            let item = _.find(this.chats, { isHover: true });
            item && (item.isOpen = !item.isOpen);
        });

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
                let chatChannel = item.chatChannel;
                chatChannel.chatAt = item;
                return chatChannel;
            });
            this.last = result.last;
            this.moreCnt = result.totalElements - (result.number + 1) * result.size;
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_STOW) {
            this.chats = payload.result;
            this.last = true;
        } else if (this.actived.payload.action == nsCons.ACTION_TYPE_PIN) {
            this.chats = payload.result;
            this.last = true;
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

    gotoChatHandler(item) {
        ea.publish(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, { chatItem: item });
    }

    openSearchItemHandler(item) {
        item.isOpen = !item.isOpen;
    }

    searchMoreHandler() {

        if (this.actived.payload.action == nsCons.ACTION_TYPE_SEARCH) {
            this.searchMoreP = $.get('/admin/chat/direct/search', {
                search: this.search,
                size: this.page.size,
                page: this.page.number + 1
            }, (data) => {
                if (data.success) {
                    this.chats = _.concat(this.chats, data.data.content);

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
}
