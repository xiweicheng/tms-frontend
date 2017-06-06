import { bindable, containerless } from 'aurelia-framework';
import poll from "common/common-poll2";

@containerless
export class EmChatTopic {

    @bindable actived;
    @bindable channel;

    chat = null;
    replies = [];

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_TOPIC_MSG_SENDED, (payload) => {
            this.chat.chatReplies.push(payload.data);
            poll.reset();
        });
    }

    unbind() {
        this.subscribe.dispose();
        poll.stop();
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
}
