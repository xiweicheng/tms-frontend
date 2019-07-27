import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogSpaceChannelEdit {

    space;

    channels;

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {}

    show(space) {
        this.space = space;

        $.get('/admin/channel/listMy', (data) => {
            if (data.success) {
                this.channels = data.data;
            } else {
                toastr.error(data.data);
            }
        });

        this.emModal.show({ hideOnApprove: false, autoDimmer: false });
    }

    showHandler() {}

    approveHandler(modal) {

        this.emModal.showDimmer();

        let cid = $(this.channelsRef).dropdown('get value');

        $.post('/admin/space/channel/update', {
            id: this.space.id,
            cid: cid
        }, (data, textStatus, xhr) => {
            this.emModal.hideDimmer();
            if (data.success) {
                this.space.channel = data.data.channel;
                toastr.success('关联频道成功!');
                modal.hide();
            } else {
                toastr.error(data.data, '关联频道失败!');
            }
        });
    }

    initChannelsHandler(last) {
        if (last) {
            _.defer(() => {
                $(this.channelsRef).dropdown('clear').dropdown({
                    onChange: (value, text, $choice) => {}
                }).dropdown('set selected', this.space.channel ? this.space.channel.id + '' : '');
            });
        }
    }
}
