import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelChatTaskTalkModal {

    @bindable channel;
    @bindable task;

    show(task) {
        this.task = task;
        this.actived = {
            show: 'topic',
            payload: {
                action: nsCons.ACTION_TYPE_TOPIC,
                result: { chat: this.task }
            }
        };
        this.emModal.show({
            hideOnApprove: false,
            autoDimmer: true
        });
    }

    showHandler() {}

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.subscribe = ea.subscribe(nsCons.EVENT_CHAT_RIGHT_SIDEBAR_SCROLL_TO, (payload) => {
            $('.em-channel-chat-task-talk-modal').scrollTo(payload, { axis: 'y' }, 120);
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
    }

    approveHandler(modal) {
        this.emModal.hide();
    }
}
