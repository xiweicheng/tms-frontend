import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatChannelCreate {

    @bindable trigger;

    triggerChanged(newValue, oldValue) {
        $(this.trigger).click(() => {
            this.emModal.show({
                hideOnApprove: false,
                autoDimmer: true
            });
        });
    }

    showHandler() {

    }

    approveHandler(modal) {

        $.post('/admin/channel/create', {
            name: this.name,
            title: this.title,
            desc: this.desc
        }, (data) => {
            modal.hide();
            if (data.success) {
                toastr.success('创建频道成功!');
                ea.publish(nsCons.EVENT_CHAT_CHANNEL_CREATED, {
                	channel: data.data
                });
            } else {
                toastr.error(data.data, '创建频道失败!');
            }
        });

    }
}
