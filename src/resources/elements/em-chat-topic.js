import { bindable, containerless } from 'aurelia-framework';

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
        });
    }

    unbind() {
        this.subscribe.dispose();
    }

    activedChanged(newValue, oldValue) {
        if (!newValue || this.actived.payload.action != nsCons.ACTION_TYPE_TOPIC) {
            return;
        }

        this.chat = this.actived.payload.result;

        // this.ajaxTopic = $.get('/admin/chat/channel/reply/list', {
        //     id: this.chat.id
        // }, (data) => {
        //     if (data.success) {
        //         this.replies = data.data;
        //     } else {
        //         toastr.error(data.data);
        //     }
        // });
    }
}
