import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatChannelMembersShow {

    @bindable channel;
    loginUser = nsCtx.loginUser;

    showHandler() {

    }

    approveHandler(modal) {

    }

    show() {
        this.emModal.show({
            hideOnApprove: true,
            autoDimmer: false
        });
    }

    countChannelGroups(channel) {
        if (!channel) return 0;
        return _.reject(channel.channelGroups, { status: 'Deleted' }).length;
    }

    leaveHandler(item) {
        this.confirmMd.show({
            onapprove: () => {
                this.emModal.showDimmer();
                $.post('/admin/channel/group/leave', { id: item.id }, (data, textStatus, xhr) => {
                    if (data.success) {
                        item.members = data.data.members;
                        toastr.success('离开频道组成功!');
                    } else {
                        toastr.error(data.data, '离开频道组失败!');
                    }
                }).always(() => {
                    this.emModal.hideDimmer();
                });
            }
        });
    }
}
