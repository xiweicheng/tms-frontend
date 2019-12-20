import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTaskItemHeader {

    @bindable taskItem;
    @bindable channel;
    basePath = utils.getBasePath();
    loginUser = nsCtx.loginUser;

    idHandler() {
        ea.publish(nsCons.EVENT_CLOSE_CHANNEL_TASKS_MODAL, {});
        ea.publish(nsCons.EVENT_CHAT_SEARCH_GOTO_CHAT_ITEM, { chatItem: this.taskItem });
        toastr.info("定位消息操作成功！");
    }

    talkHandler() {
        ea.publish(nsCons.EVENT_CHANNEL_TASK_TALK_SHOW, this.taskItem);
    }

    editHandler() {
        ea.publish(nsCons.EVENT_CHANNEL_TASK_EDIT, this.taskItem);
    }

    stowHandler() {

        if (!this.taskItem._stowed) {
            $.post('/admin/chat/channel/stow', {
                id: this.taskItem.id
            }, (data, textStatus, xhr) => {
                this.taskItem._stowed = true;
                if (data.success) {
                    this.taskItem.stowId = data.data.id;
                } else {
                    this.taskItem.stowId = (data.msgs && data.msgs.length > 0) ? data.msgs[0].id : '';
                }
                toastr.success('收藏任务成功!');
            });
        } else {
            this.unstowHandler();
        }
    }

    unstowHandler() {

        if (this.taskItem._stowed) {
            $.post('/admin/chat/channel/removeStow', {
                id: this.taskItem.stowId
            }, (data, textStatus, xhr) => {
                this.taskItem.stowId = '';
                this.taskItem._stowed = false;
                toastr.success('取消收藏任务成功!');
            });
        }
    }
}
