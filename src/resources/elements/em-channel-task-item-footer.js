import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTaskItemFooter {

    @bindable taskItem;

    @bindable channel;
    @bindable loginUser;

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
            }
        });
    }

    canDelLabel(item) {
        let hasMe = _.some(item.voters, { username: this.loginUser.username });

        return hasMe;
    }

}
