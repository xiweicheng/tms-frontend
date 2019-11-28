import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTasksModal {

    @bindable channel;
    @bindable loginUser;

    showHandler() {
        this.channelTaskVm.init();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.subscribe = ea.subscribe(nsCons.EVENT_CLOSE_CHANNEL_TASKS_MODAL, (payload) => {
            this.emModal.hide();
        });
    }

    detached() {
        this.channel = null;
        this.loginUser = null;
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
    }

    approveHandler(modal) {


    }

    show() {
        let height = $(window).height() - 270;
        $('.em-channel-tasks-modal').height(height);
        $('.tms-dd-container').height(height - 110);

        this.emModal.show({
            hideOnApprove: true,
            autoDimmer: false
        });
    }
}
