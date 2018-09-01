import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogSpaceDirCreate {

    space;
    dir = {
        name: ''
    };

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {}

    show(space) {
        this.space = space;
        this.emModal.show({ hideOnApprove: false, autoDimmer: false });
    }

    showHandler() {}

    approveHandler(modal) {
        if (!this.dir.name) {
            toastr.error('分类名称不能为空！');
            return;
        }

        this.emModal.showDimmer();
        $.post('/admin/space/dir/create', {
            sid: this.space.id,
            name: this.dir.name
        }, (data, textStatus, xhr) => {
            this.emModal.hideDimmer();
            if (data.success) {
                this.dir.name = '';
                toastr.success('创建空间分类成功!');
                ea.publish(nsCons.EVENT_SPACE_DIR_CHANGED, {
                    action: 'created',
                    dir: data.data,
                    space: this.space
                });
                this.space.dirs.push(data.data);
                modal.hide();
            } else {
                toastr.error(data.data, '创建空间分类失败!');
            }
        });
    }

    keyupHandler() {
        this.approveHandler(this.emModal);
        return false;
    }
}
