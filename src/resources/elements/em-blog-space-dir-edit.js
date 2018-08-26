import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogSpaceDirEdit {

    dir;
    name;

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {}

    show(dir) {
        this.dir = dir;
        this.name = dir.name;
        this.emModal.show({ hideOnApprove: false, autoDimmer: false });
    }

    showHandler() {}

    approveHandler(modal) {
        if (!this.name) {
            toastr.error('分类名称不能为空！');
            return;
        }

        this.emModal.showDimmer();
        $.post('/admin/space/dir/update', {
            id: this.dir.id,
            name: this.name
        }, (data, textStatus, xhr) => {
            this.emModal.hideDimmer();
            if (data.success) {
                toastr.success('更新空间分类成功!');
                ea.publish(nsCons.EVENT_SPACE_DIR_CHANGED, {
                    action: 'updated',
                    dir: data.data
                });
                this.dir.name = data.data.name;
                modal.hide();
            } else {
                toastr.error(data.data, '更新空间分类失败!');
            }
        });
    }
}
