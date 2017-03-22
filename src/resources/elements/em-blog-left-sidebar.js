import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogLeftSidebar {

    isHide = true;
    blogs = [];
    spaces = [];
    noSpaceBlogs = [];

    loginUser = nsCtx.loginUser;
    isSuper = nsCtx.isSuper;

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'created') {
                this.blogs = [payload.blog, ...this.blogs];
                this.calcTree();
            } else if (payload.action == 'updated') {
                _.extend(_.find(this.blogs, { id: payload.blog.id }), payload.blog);
                this.calcTree();
            }
        });
        this.subscribe4 = ea.subscribe(nsCons.EVENT_SPACE_CHANGED, (payload) => {
            if (payload.action == 'created') {
                this.spaces = [payload.space, ...this.spaces];
                this.calcTree();
            } else if (payload.action == 'updated') {
                _.extend(_.find(this.spaces, { id: payload.space.id }), payload.space);
                this.calcTree();
            }
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_SWITCH, (payload) => {
            this.blog = _.find(this.blogs, { id: +nsCtx.blogId });
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR, (payload) => {
            this.isHide = payload;
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        this.subscribe4.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.refresh();
        this._refreshSysLinks();
    }


    _refreshSysLinks() {
        $.get('/admin/link/listByApp', (data) => {
            if (data.success) {
                this.sysLinks = data.data;
            } else {
                this.sysLinks = [];
            }
        });
    }

    refresh() {
        $.when(this.getSpaces(), this.getBlogTree()).done(() => {
            this.calcTree();
        });
    }

    calcTree() {
        this.noSpaceBlogs = [];
        $.each(this.spaces, (index, space) => {
            space.blogs = [];
            $.each(this.blogs, (index, blog) => {
                if (blog.space) {
                    if (blog.space.id === space.id) {
                        space.blogs.push(blog);
                        if (nsCtx.blogId == blog.id) {
                            space.open = true;
                        }
                    }
                }
            });
        });

        this.noSpaceBlogs = _.filter(this.blogs, b => !b.space);
    }

    spaceToggleHandler(space) {
        space.open = !space.open;
    }

    getBlogTree() {
        return $.get('/admin/blog/listMy', (data) => {
            if (data.success) {
                this.blogs = data.data;
                this.blog = _.find(this.blogs, { id: +nsCtx.blogId });
            }
        });
    }

    getSpaces() {
        return $.get('/admin/space/listMy', {}, (data) => {
            if (data.success) {
                this.spaces = data.data;
            }
        });
    }

    editSpaceHandler(space) {
        this.spaceEditVm.show(space);
    }

    delSpaceHandler(space) {
        this.confirmMd.show({
            onapprove: () => {
                $.post('/admin/space/delete', {
                    id: space.id
                }, (data) => {
                    if (data.success) {
                        toastr.success('删除空间成功!');
                        this.spaces = _.reject(this.spaces, { id: space.id });
                    } else {
                        toastr.error(data.data, '删除空间失败!');
                    }
                });
            }
        });
    }

    authSpaceHandler(space) {
        this.blogSpaceAuthVm.show('space', space);
    }
}
