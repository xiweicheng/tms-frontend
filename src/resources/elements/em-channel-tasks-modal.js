import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTasksModal {

    @bindable channel;
    @bindable loginUser;
    @bindable isAt;

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

        // 监听窗口大小变化，重新计算高度
        this.resizeHandler = () => {
            this.updateHeight();
        };
        $(window).on('resize', this.resizeHandler);
    }

    detached() {
        this.channel = null;
        this.loginUser = null;
        this.isAt = null;
        
        // 移除窗口大小变化监听
        if (this.resizeHandler) {
            $(window).off('resize', this.resizeHandler);
        }
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

        this.subscribe.dispose();
        
        // 移除窗口大小变化监听
        if (this.resizeHandler) {
            $(window).off('resize', this.resizeHandler);
        }
    }

    /**
     * 更新模态框高度
     */
    updateHeight() {
        let height = $(window).height() - 100;
        $('.em-channel-tasks-modal').height(height);
        $('.tms-dd-container').height(height - 110);
    }

    approveHandler(modal) {


    }

    show() {
        this.updateHeight();

        this.emModal.show({
            hideOnApprove: true,
            autoDimmer: false
        });
    }
}
