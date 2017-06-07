import { bindable, containerless } from 'aurelia-framework';
import poll from "common/common-poll2";

@containerless
export class EmChatTopic {

    @bindable actived;
    @bindable channel;
    isSuper = nsCtx.isSuper;
    loginUser = nsCtx.loginUser;
    members = [];

    chat = null;

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_TOPIC_MSG_SENDED, (payload) => {
            if (!_.some(this.chat.chatReplies, { id: payload.data.id })) {
                this.chat.chatReplies.push(payload.data);
            }

            poll.reset();
        });
        this.subscribe1 = ea.subscribe(nsCons.EVENT_CHAT_CHANNEL_MEMBER_ADD_OR_REMOVE, (payload) => {
            this.members = [nsCtx.memberAll, ...payload.members];
        });
    }

    attached() {
        $(this.commentsRef).on('dblclick', '.comment.tms-reply', (event) => {
            if (event.ctrlKey) {
                let chatId = $(event.currentTarget).attr('data-id');
                let $t = $(event.currentTarget).find('.content > textarea');
                let item = _.find(this.chat.chatReplies, { id: Number.parseInt(chatId) });

                if (!this.isSuper && (item.creator.username != this.loginUser.username)) {
                    return;
                }

                item.isEditing = true;
                item.contentOld = item.content;
                _.defer(() => {
                    $t.focus().select();
                    autosize.update($t.get(0));
                });
            }
        });
    }

    unbind() {
        this.subscribe.dispose();
        this.subscribe1.dispose();
        poll.stop();
    }

    channelChanged() {

        if (this.channel) {
            this.members = [nsCtx.memberAll, ...this.channel.members];
        } else {
            this.members = [];
        }
    }

    _poll() {
        poll.start((resetCb, stopCb) => {
            if (!nsCtx.isRightSidebarShow) {
                stopCb();
            }
            let cr = _.last(this.chat.chatReplies);
            this.ajaxTopic = $.get('/admin/chat/channel/reply/poll', {
                id: this.chat.id,
                rid: cr ? cr.id : null
            }, (data) => {
                if (data.success) {
                    if (data.data.length > 0) {
                        this.chat.chatReplies = _.unionBy(this.chat.chatReplies, data.data, 'id');
                        resetCb();
                    }
                } else {
                    toastr.error(data.data);
                    stopCb();
                }
            });
        });
    }

    activedChanged(newValue, oldValue) {
        if (!newValue || this.actived.payload.action != nsCons.ACTION_TYPE_TOPIC) {
            poll.stop();
            return;
        }

        this.chat = this.actived.payload.result;
        this._poll();
    }

    removeHandler(item) {
        $.post('/admin/chat/channel/reply/remove', { rid: item.id }, (data, textStatus, xhr) => {
            if (data.success) {
                this.chat.chatReplies = _.reject(this.chat.chatReplies, { id: data.data });
            } else {
                toastr.error(data.data);
            }
        });
    }

    editHandler(item, editTxtRef) {

        item.isEditing = true;
        item.contentOld = item.content;
        _.defer(() => {
            $(editTxtRef).focus().select();
            autosize.update(editTxtRef);
        });
    }

    eidtKeydownHandler(evt, item, txtRef) {

        if (this.sending) {
            return false;
        }

        if (evt.ctrlKey && evt.keyCode === 13) {

            this.editSave(item, txtRef);

            return false;
        } else if (evt.ctrlKey && evt.keyCode === 85) {
            $(txtRef).next('.tms-edit-actions').find('.upload').click();
            return false;
        } else if (evt.keyCode === 27) {
            this.editCancelHandler(evt, item, txtRef);
        }

        return true;
    }

    editSave(item, txtRef) {

        this.sending = true;

        item.content = $(txtRef).val();

        var html = utils.md2html(item.content);
        var htmlOld = utils.md2html(item.contentOld);

        $.post(`/admin/chat/channel/reply/update`, {
            url: utils.getUrl(),
            rid: item.id,
            version: item.version,
            usernames: utils.parseUsernames(item.content, this.members).join(','),
            content: item.content,
            diff: utils.diffS(item.contentOld, item.content),
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('更新消息成功!');
                item.isEditing = false;
                item.version = data.data.version;
            } else {
                toastr.error(data.data, '更新消息失败!');
            }
        }).always(() => {
            this.sending = false;
        });
    }

    editOkHandler(evt, item, txtRef) {
        this.editSave(item, txtRef);
        item.isEditing = false;
    }

    editCancelHandler(evt, item, txtRef) {
        item.content = item.contentOld;
        $(txtRef).val(item.content);
        item.isEditing = false;
    }
}
