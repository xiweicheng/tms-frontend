import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogLeftSidebar {

    isHide = true;
    blogs = [];
    spaces = [];
    noSpaceBlogs = [];

    loginUser = nsCtx.loginUser;
    isSuper = nsCtx.isSuper;

    filter = ''; // 过滤查找条件

    spaceStow = {
        name: '我的收藏',
        open: false
    };

    spaceRecent = {
        name: '最近更新',
        open: false
    };

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'created') {
                this.blogs = [payload.blog, ...this.blogs];
                nsCtx.blogId = payload.blog.id;
                this.calcTree();
                _.delay(() => this._scrollTo(payload.blog.id), 1000);
                ea.publish(nsCons.EVENT_APP_ROUTER_NAVIGATE, { to: `#/blog/${payload.blog.id}` });
            } else if (payload.action == 'updated') {
                _.extend(_.find(this.blogs, { id: payload.blog.id }), payload.blog);
                // 同步更新收藏博文
                let bs = _.find(this.blogStows, item => item.blog.id === payload.blog.id);
                if (bs) {
                    _.extend(bs.blog, payload.blog);
                }
                this.calcTree();
            } else if (payload.action == 'deleted') {
                this.blogStows = _.reject(this.blogStows, bs => bs.blog.id == payload.blog.id);
                this.blogs = _.reject(this.blogs, { id: payload.blog.id });
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
        this.subscribe6 = ea.subscribe(nsCons.EVENT_SPACE_DIR_CHANGED, (payload) => {
            if (payload.action == 'created') {
                this.calcTree();
            } else if (payload.action == 'updated') {
                // this.calcTree();
            }
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_SWITCH, (payload) => {
            this.blog = _.find(this.blogs, { id: +nsCtx.blogId });
            this.blog && _.delay(() => this._scrollTo(this.blog.id), 1000);
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR, (payload) => {
            this.isHide = payload;
        });
        this.subscribe5 = ea.subscribe(nsCons.EVENT_BLOG_STOW_CHANGED, (payload) => {
            this._refreshBlogStows();
        });

        this._doFilerDebounce = _.debounce(() => this._doFiler(), 120, { leading: true });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
        this.subscribe4.dispose();
        this.subscribe5.dispose();
        this.subscribe6.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.refresh();
        // this._refreshSysLinks();
        this._refreshBlogStows();
    }

    _scrollTo(to) {
        if (!utils.isElementInViewport($(`.blog-item[data-id="${to}"]`))) {
            $(this.treeRef).parent().scrollTo(`.blog-item[data-id="${to}"]`, {
                offset: 0
            });
        }
    }

    // _refreshSysLinks() {
    //     $.get('/admin/link/listByApp', (data) => {
    //         if (data.success) {
    //             this.sysLinks = data.data;
    //         } else {
    //             this.sysLinks = [];
    //         }
    //     });
    // }

    _refreshBlogStows() {
        $.get('/admin/blog/stow/listMy', (data) => {
            if (data.success) {
                this.blogStows = data.data;
            } else {
                toastr.error(data.data);
            }
        });
    }

    refresh() {
        $.when(this.getSpaces(), this.getBlogTree()).done(() => {
            this.calcTree();
            this.blog && _.delay(() => this._scrollTo(this.blog.id), 1000);
        });
    }

    calcTree() {
        this.noSpaceBlogs = [];
        $.each(this.spaces, (index, space) => {
            space.blogs = [];
            $.each(space.dirs, (index, dir) => {
                dir.blogs = [];
            });
            $.each(this.blogs, (index, blog) => {
                if (blog.space) {
                    if (blog.space.id === space.id) {
                        if (nsCtx.blogId == blog.id) {
                            space.open = true;
                        }
                        let dirs = space.dirs;
                        if (blog.dir) {
                            let dir = _.find(dirs, { id: blog.dir.id });
                            if (dir && dir.status != 'Deleted') {
                                dir.blogs.push(blog);
                                if (nsCtx.blogId == blog.id) {
                                    dir.open = true;
                                }
                                return;
                            }
                        }
                        space.blogs.push(blog);
                    }
                }
            });
        });

        this.noSpaceBlogs = _.filter(this.blogs, b => !b.space);
    }

    spaceToggleHandler(space) {
        space.open = !space.open;
    }

    dirToggleHandler(dir) {
        dir.open = !dir.open;
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
                        this.calcTree();
                    } else {
                        toastr.error(data.data, '删除空间失败!');
                    }
                });
            }
        });
    }

    delDirHandler(dir, space) {
        this.confirmMd.show({
            onapprove: () => {
                $.post('/admin/space/dir/delete', {
                    id: dir.id
                }, (data) => {
                    if (data.success) {
                        toastr.success('删除分类成功!');
                        space.dirs = _.reject(space.dirs, { id: dir.id });
                        this.calcTree();
                    } else {
                        toastr.error(data.data, '删除分类失败!');
                    }
                });
            }
        });
    }

    authSpaceHandler(space) {
        this.blogSpaceAuthVm.show('space', space);
    }

    clearFilterHandler() {
        this.filter = '';
        $(this.filterInputRef).focus();
        this._doFilerDebounce();
    }

    filterKeyupHandler(event) {
        this._doFilerDebounce();
    }

    _doFiler() {
        _.each(this.blogs, b => {
            if (!_.includes(_.toLower(b.title), _.toLower(this.filter))) {
                b._hidden = true;
            } else {
                b._hidden = false;
            }
        });

        _.each(this.spaces, s => {
            if (!_.some(s.blogs, b => !b._hidden)) {
                s._hidden = true;
            } else {
                s._hidden = false;
                s.open = true;
            }

            _.each(s.dirs, d => {
                if (!_.some(d.blogs, b => !b._hidden)) {
                    s._hidden = true;
                    d._hidden = true;
                } else {
                    s._hidden = false;
                    s.open = true;
                    d._hidden = false;
                    d.open = true;
                }
            });
        });

        _.each(this.blogStows, bs => {
            if (!_.includes(_.toLower(bs.blog.title), _.toLower(this.filter))) {
                bs._hidden = true;
            } else {
                bs._hidden = false;
            }
        });

        if (!_.some(this.blogStows, bs => !bs._hidden)) {
            this.spaceStow.open = false;
        } else {
            this.spaceStow.open = true;
        }

        // 最近20条过滤目录展开控制
        let recent20 = _.takeRight(_.sortBy(this.blogs, 'updateDate'), 20);

        if (!_.some(recent20, b => !b._hidden)) {
            this.spaceRecent.open = false;
        } else {
            this.spaceRecent.open = true;
        }

        if (!this.filter) {
            _.each(this.spaces, s => {
                if (_.find(s.blogs, { id: +nsCtx.blogId })) {
                    s.open = true;
                } else {
                    s.open = false;
                }
            });
            this.spaceStow.open = false;
            this.spaceRecent.open = false;
        }

    }

    createDirHandler(space) {
        this.spaceDirCreateVm.show(space);
    }

    editDirHandler(dir, space) {
        this.spaceDirEditVm.show(dir);
    }

    // sysLinkHandler(item) {
    //     $.post('/admin/link/count/inc', { id: item.id });
    //     return true;
    // }
}
