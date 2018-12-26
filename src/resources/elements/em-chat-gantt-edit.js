import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatGanttEdit {

    gantt = {};

    show(gantt) {
        _.extend(this.gantt, gantt);

        let chkSet = this.gantt.privated ? 'set checked' : 'set unchecked';
        $(this.chk).checkbox(chkSet);

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
        $(this.chk).checkbox();
    }

    approveHandler(modal) {

        $.post('/admin/gantt/update', {
            id: this.gantt.id,
            title: this.gantt.title,
            privated: $(this.chk).checkbox('is checked')
        }, (data) => {
            modal.hide();
            if (data.success) {
                toastr.success('更新甘特图成功!');
                ea.publish(nsCons.EVENT_CHANNEL_GANTTS_REFRESH, data.data);
            } else {
                toastr.error(data.data, '更新甘特图失败!');
            }
        });

    }
}
