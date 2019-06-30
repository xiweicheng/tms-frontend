import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogTplSelect {

    tpls = [];
    search = '';
    isSuper = nsCtx.isSuper;
    loginUser = nsCtx.loginUser;

    showHandler() {

        $.get('/admin/blog/tpl/list', (data) => {
            if (data.success) {
                this.tpls = data.data;
            } else {
                toastr.error(data.data);
            }
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

    }

    approveHandler(modal) {



    }

    show(blog) {

        this.emModal.show({
            hideOnApprove: true,
            autoDimmer: false
        });
    }

    createHandler(item) {
        if (item.editor == 'Html') {
            $('.em-blog-write-html > iframe').attr('src', utils.getResourceBase() + 'blog.html?id=' + item.id + '&copy' + '&_=' + new Date().getTime());
            $('a[href="#modaal-blog-write-html"]').click();
        } else if (!nsCtx.isModaalOpening) {
            ea.publish(nsCons.EVENT_BLOG_ACTION, { action: 'copy', id: item.id });
        }
        this.emModal.hide();
    }

    delHandler(item) {

        this.confirmMd.show({
            title: '删除确认',
            content: '确认要删除该博文模板吗?',
            onapprove: () => {
                $.post('/admin/blog/tpl/update', {
                    id: item.id,
                    tpl: 0,
                    desc: item.tplDesc
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        this.tpls = _.reject(this.tpls, { id: item.id });
                        toastr.success('删除博文模板成功！');
                    } else {
                        toastr.error(data.data);
                    }
                });
            }
        });

    }
}
