import { bindable, containerless } from 'aurelia-framework';
import {
    default as clipboard
} from 'clipboard-js';
import {
    default as Clipboard
} from 'clipboard';

@containerless
export class EmBlogContent {

    @bindable blog;

    blogChanged(newValue, oldValue) {

    }

    loginUser = nsCtx.loginUser;
    isSuper = nsCtx.isSuper;
    isAdmin = nsCtx.isAdmin;

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_SWITCH, (payload) => {
            this.getBlog();
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'updated') {
                _.extend(this.blog, payload.blog);
            }
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.getBlog();

        new Clipboard('.em-blog-content .tms-clipboard')
            .on('success', function(e) {
                toastr.success('复制到剪贴板成功!');
            }).on('error', function(e) {
                toastr.error('复制到剪贴板失败!');
            });

        $(this.mkbodyRef).on('click', 'code[data-code]', function(event) {
            if (event.ctrlKey) {
                event.stopImmediatePropagation();
                event.preventDefault();
                clipboard.copy($(event.currentTarget).attr('data-code')).then(
                    () => { toastr.success('复制到剪贴板成功!'); },
                    (err) => { toastr.error('复制到剪贴板失败!'); }
                );
            }
        });

        $(this.mkbodyRef).on('click', '.pre-code-wrapper', function(event) {
            if (event.ctrlKey) {
                event.stopImmediatePropagation();
                event.preventDefault();
                clipboard.copy($(event.currentTarget).find('i[data-clipboard-text]').attr('data-clipboard-text')).then(
                    () => { toastr.success('复制到剪贴板成功!'); },
                    (err) => { toastr.error('复制到剪贴板失败!'); }
                );
            }
        });
    }

    getBlog() {
        if (!nsCtx.blogId) {
            return;
        }
        return $.get('/admin/blog/get', {
            id: nsCtx.blogId
        }, (data) => {
            if (data.success) {
                this.blog = data.data;
                ea.publish(nsCons.EVENT_BLOG_VIEW_CHANGED, this.blog);
            }
        });
    }

    editHandler() {
        ea.publish(nsCons.EVENT_BLOG_ACTION, { action: 'edit', id: this.blog.id });
    }

    deleteHandler() {

        this.emConfirmModal.show({
            onapprove: () => {
                $.post("/admin/blog/delete", {
                    id: this.blog.id
                }, (data, textStatus, xhr) => {
                    if (data.success) {
                        toastr.success('删除博文成功!');
                        window.location.href = "#/blog";
                        window.location.reload();
                    } else {
                        toastr.error(data.data, '删除博文失败!');
                    }
                });
            }
        });

    }

    createHandler() {
        $('a[href="#modaal-blog-write"]').click();
    }

    updateSpaceHandler() {
        this.blogSpaceUpdateVm.show(this.blog);
    }

    updatePrivatedHandler() {
        $.post('/admin/blog/privated/update', {
            id: this.blog.id,
            privated: !this.blog.privated
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.blog.privated = data.data.privated;
                toastr.success('更新博文可见性成功!');
            } else {
                toastr.error(data.data, '更新博文可见性失败!');
            }
        });
    }

    isZanDone() {
        let voteZan = this.blog.voteZan;
        if (!voteZan) {
            return false;
        }

        return voteZan.split(',').includes(this.loginUser.username);
    }

    rateHandler() {
        $.post('/admin/blog/vote', {
            id: this.blog.id,
            url: utils.getBasePath(),
            contentHtml: utils.md2html(this.blog.content),
            type: this.isZanDone() ? 'Cai' : 'Zan'
        }, (data, textStatus, xhr) => {
            if (data.success) {
                _.extend(this.blog, data.data);
            } else {
                toastr.error(data.data, '博文投票失败!');
            }
        });
    }

    openEditHandler() {
        $.post('/admin/blog/openEdit', {
            id: this.blog.id,
            open: !this.blog.openEdit
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.blog.openEdit = !this.blog.openEdit;
                toastr.success(this.blog.openEdit ? '开放协作编辑成功!' : '关闭协作编辑成功!');
            } else {
                toastr.error(data.data, '协作编辑操作失败!');
            }
        });
    }

    refreshHandler() {
        let p = this.getBlog();
        p && p.done(() => { toastr.success('刷新操作成功!'); });
    }
}
