import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTaskItemFooter {

    @bindable taskItem;

    @bindable channel;
    @bindable loginUser;
    @bindable col;

    delLabelHandler(item, event) {
        if (!this.canDelLabel(item)) {
            toastr.error('删除权限不足！');
            return;
        }

        $.post('/admin/channel/task/label/remove', {
            cid: this.channel.id,
            id: item.id
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('删除操作成功！');
                item.voters = _.reject(item.voters, { username: this.loginUser.username });

                bs.signal('sg-chatlabel-refresh');

                if (_.isEmpty(item.voters)) {
                    ea.publish(nsCons.EVENT_CHANNEL_TASK_COL_REFRESH, { name: this.col.name });
                }

                if (item.name != this.col.name) {
                    ea.publish(nsCons.EVENT_CHANNEL_TASK_COL_REFRESH, { name: item.name });
                }

                ea.publish(nsCons.EVENT_CHANNEL_TASK_LABELS_REFRESH, { col: this.col, label: item, task: this.taskItem });
            }
        });
    }

    attached() {

    }

    canDelLabel(item) {
        let hasMe = _.some(item.voters, { username: this.loginUser.username });

        return hasMe;
    }

    addTagHandler() {
        let tag = _.trim(window.prompt(`输入标签内容（不能超过15个字符）：`));
        if (!tag) return;

        $.post(`/admin/chat/channel/label/toggle`, {
            url: nsCtx.isAt ? utils.getBasePath() : utils.getUrl(),
            meta: tag,
            type: 'Tag',
            contentHtml: utils.md2html(this.taskItem.content, true),
            name: tag,
            desc: tag,
            id: this.taskItem.id,
        }, (data, textStatus, xhr) => {
            if (data.success) {
                let cl = _.find(this.taskItem.chatLabels, { id: data.data.id });
                if (cl) {
                    cl.voters = data.data.voters;
                } else {
                    this.taskItem.chatLabels = [...this.taskItem.chatLabels, data.data];
                }
                bs.signal('sg-chatlabel-refresh');

                ea.publish(nsCons.EVENT_CHANNEL_TASK_LABELS_REFRESH, { col: this.col, label: data.data, task: this.taskItem });

            } else {
                toastr.error(data.data);
            }
        });
    }

}
