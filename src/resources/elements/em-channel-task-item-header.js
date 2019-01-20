import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTaskItemHeader {

    @bindable taskItem;

    idHandler() {
        ea.publish(nsCons.EVENT_CLOSE_CHANNEL_TASKS_MODAL, {});
        ea.publish(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, { chatItem: this.taskItem });
        toastr.info("定位消息操作成功！");
    }
}
