import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogSpaceUpdate {

    blog;

    loginUser = nsCtx.loginUser;
    isSuper = nsCtx.isSuper;
    spaces = [];
    space;

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {}

    show(blog) {
        this.blog = blog;
        this.emModal.show({
            hideOnApprove: false,
            autoDimmer: true
        });
    }

    showHandler() {
        $.get('/admin/space/listMy', (data) => {
            if (data.success) {
                this.spaces = data.data;
            }
        });
    }

    approveHandler(modal) {
        let sid = $(this.spacesRef).dropdown('get value');
        let did = $(this.dirsRef).dropdown('get value');

        $.post('/admin/blog/space/update', {
            id: this.blog.id,
            sid: sid ? sid : null,
            did: did ? did : null
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('博文空间更新成功!');
                if (!data.data.space) {
                    data.data.space = null; // 确保_.extend(oldBlog, blog)更新空间属性
                }
                ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                    action: 'updated',
                    pid: this.blog.pid,
                    blog: data.data
                });
                modal.hide();
            } else {
                toastr.error(data.data, '博文空间更新失败!');
            }
        });
    }

    initSpacesHandler(last) {
        if (last) {
            _.defer(() => {
                $(this.spacesRef).dropdown('clear').dropdown({
                    onChange: (value, text, $choice) => {
                        if (!!value) {
                            this.space = _.find(this.spaces, {
                                id: +value
                            });
                        } else {
                            this.space = null;
                        }
                        $(this.dirsRef).dropdown('clear');
                    }
                }).dropdown('set selected', this.blog.space ? this.blog.space.id + '' : '');
            });
        }
    }

    initDirsHandler(last) {
        if (last) {
            _.defer(() => {
                $(this.dirsRef).dropdown('clear').dropdown({
                    onChange: (value, text, $choice) => {}
                }).dropdown('set selected', this.blog.dir ? this.blog.dir.id + '' : '');
            });
        }
    }
}
