import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogLeftSidebar {

    isHide = true;
    blogs = [];
    spaces = [];
    noSpaceBlogs = [];

    loginUser = nsCtx.loginUser;
    isSuper = nsCtx.isSuper;

    filter = ''; // 过滤查找条件
    folded = false;

    spaceStow = {
        name: '我的收藏',
        open: false
    };

    spaceRecent = {
        name: '最近更新',
        open: false
    };

    spaceRecentOpen = {
        name: '最近访问',
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
                ea.publish(nsCons.EVENT_APP_ROUTER_NAVIGATE, {
                    to: `#/blog/${payload.blog.id}`
                });
            } else if (payload.action == 'updated') {
                let blog = _.find(this.blogs, {
                    id: payload.blog.id
                });
                if (!payload.blog.dir) blog.dir = null;
                _.extend(blog, payload.blog);
                // 同步更新收藏博文
                let bs = _.find(this.blogStows, item => item.blog.id === payload.blog.id);
                if (bs) {
                    if (!payload.blog.dir) bs.blog.dir = null;
                    _.extend(bs.blog, payload.blog);
                }
                !payload.unCalcDir && this.calcTree();
            } else if (payload.action == 'deleted') {
                this.blogStows = _.reject(this.blogStows, bs => bs.blog.id == payload.blog.id);
                this.blogs = _.reject(this.blogs, {
                    id: payload.blog.id
                });
                this.calcTree();
            }
        });
        this.subscribe4 = ea.subscribe(nsCons.EVENT_SPACE_CHANGED, (payload) => {
            if (payload.action == 'created') {
                this.spaces = [payload.space, ...this.spaces];
                this.calcTree();
            } else if (payload.action == 'updated') {
                _.extend(_.find(this.spaces, {
                    id: payload.space.id
                }), payload.space);
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
            this.blog = _.find(this.blogs, {
                id: +nsCtx.blogId
            });
            this.calcTree();
            this.blog && _.delay(() => this._scrollTo(this.blog.id), 1000);
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR, (payload) => {
            this.isHide = payload;
        });
        this.subscribe5 = ea.subscribe(nsCons.EVENT_BLOG_STOW_CHANGED, (payload) => {
            this._refreshBlogStows();
        });

        this.subscribe7 = ea.subscribe(nsCons.EVENT_BLOG_VIEW_CHANGED, (payload) => {
            this._recentOpenSave(payload);
        });
        this.subscribe8 = ea.subscribe(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR_PC, (payload) => {
            this.folded = payload;
        });

        this._doFilerDebounce = _.debounce(() => this._doFiler(), 120, {
            leading: true
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
        this.subscribe5.dispose();
        this.subscribe6.dispose();
        this.subscribe7.dispose();
        this.subscribe8.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.refresh();
        // this._refreshSysLinks();
        this._refreshBlogStows();
    }

    initSpaceHandler(last) {
        if (last) {
            _.delay(() => {

                // blogs sort
                $('.tms-sortable-elem-blogs').each((i, e) => {

                    // console.log(`blogs sortable elements index: ${i}`);

                    let space = _.find(this.spaces, {
                        id: +$(e).attr('data-id')
                    });

                    // 没有从属空间 || 空间创建者 || 系统管理员
                    if ((space && (space.creator.username == this.loginUser.username)) || this.isSuper) {

                        Sortable.create(e, {
                            group: {
                                name: 'blog'
                            },
                            onEnd: function (evt) {

                                if (evt.from === evt.to) {
                                    // console.log('from === to');
                                    if (evt.newIndex === evt.oldIndex) return;

                                    var $all = $(evt.from).children('.blog-item');

                                    var items = [];
                                    $all.each((i, e) => {
                                        items.push({
                                            id: $(e).attr('data-id'),
                                            sort: i
                                        });
                                    })

                                    $.post("/admin/blog/sort", {
                                        items: JSON.stringify(items)
                                    }, (data) => {
                                        if (!data.success) {
                                            toastr.error(data.data);
                                        }
                                    });
                                } else {
                                    // console.log('from !== to');
                                    let blogId = $(evt.item).attr('data-id');
                                    let spaceIdF = $(evt.from).attr('data-id');
                                    let spaceIdT = $(evt.to).attr('data-id');

                                    let $dir = $(evt.item).closest('.dir-item');
                                    let dirId = $dir ? $dir.attr('data-id') : null;

                                    // console.log(`spaceF: ${spaceIdF} spaceT: ${spaceIdT} dir: ${dirId}`);

                                    $.post('/admin/blog/space/update', {
                                        id: blogId,
                                        sid: spaceIdT,
                                        did: dirId
                                    }, (data, textStatus, xhr) => {
                                        if (data.success) {
                                            if (!data.data.space) {
                                                data.data.space = null; // 确保_.extend(oldBlog, blog)更新空间属性
                                            }
                                            ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                                                action: 'updated',
                                                blog: data.data,
                                                unCalcDir: true
                                            });
                                        } else {
                                            toastr.error(data.data);
                                        }
                                    });

                                    // sort blogs
                                    var $all = $(evt.to).children('.blog-item');

                                    var items = [];
                                    $all.each((i, e) => {
                                        items.push({
                                            id: $(e).attr('data-id'),
                                            sort: i
                                        });
                                    })

                                    $.post("/admin/blog/sort", {
                                        items: JSON.stringify(items)
                                    }, (data) => {
                                        if (!data.success) {
                                            toastr.error(data.data);
                                        }
                                    });

                                }
                            },
                        });
                    }
                });

                // dirs sort
                $('.tms-sortable-elem-dirs').each((i, e) => {

                    // console.log(`dirs sortable elements index: ${i}`);

                    let space = _.find(this.spaces, {
                        id: +$(e).attr('data-id')
                    });

                    // 空间创建者 || 系统管理员
                    if ((space && (space.creator.username == this.loginUser.username)) || this.isSuper) {
                        Sortable.create(e, {
                            // group: {
                            //     name: 'dir'
                            // },
                            onEnd: function (evt) {

                                if (evt.newIndex === evt.oldIndex) return;

                                var $all = $(evt.from).children('.dir-item');

                                var items = [];
                                $all.each((i, e) => {
                                    items.push({
                                        id: $(e).attr('data-id'),
                                        sort: i
                                    });
                                })

                                $.post("/admin/blog/dir/sort", {
                                    items: JSON.stringify(items)
                                }, (data) => {
                                    if (!data.success) {
                                        toastr.error(data.data);
                                    }
                                });

                            },
                        });
                    }

                });

                // spaces sort
                // 系统管理员
                if (this.isSuper) {

                    $('.tms-sortable-elem-spaces').each((i, e) => {

                        // console.log(`spaces sortable elements index: ${i}`);

                        Sortable.create(e, {
                            // group: {
                            //     name: 'space'
                            // },
                            draggable: '.space-item',
                            onEnd: function (evt) {

                                if (evt.newIndex === evt.oldIndex) return;

                                var $all = $(evt.from).children('.space-item');

                                var items = [];
                                $all.each((i, e) => {
                                    items.push({
                                        id: $(e).attr('data-id'),
                                        sort: i
                                    });
                                })

                                $.post("/admin/blog/space/sort", {
                                    items: JSON.stringify(items)
                                }, (data) => {
                                    if (!data.success) {
                                        toastr.error(data.data);
                                    }
                                });

                            },
                        });
                    });
                }

            }, 2000);
        }
    }

    _recentOpenSave(blog) {
        // 记忆打开博文
        if (localStorage) {
            let recentOpenBlogs = [];
            let robs = localStorage.getItem(`tms-blog-recent-open`);
            if (robs) {
                recentOpenBlogs = JSON.parse(robs);
            }

            // 删除已经删除的
            if (this.blogs && this.blogs.length > 0) {
                _.remove(recentOpenBlogs, item => !_.some(this.blogs, {
                    id: item.id
                }));
            }

            // 删除可能已经存在的
            _.remove(recentOpenBlogs, {
                id: blog.id
            });

            // 头部追加新打开的
            recentOpenBlogs.unshift({
                id: blog.id,
                openTime: blog._openTime
            });

            if (recentOpenBlogs.length > 15) { // 只记忆最新打开的十个
                recentOpenBlogs.splice(15, recentOpenBlogs.length - 15);
            }

            localStorage.setItem(`tms-blog-recent-open`, JSON.stringify(recentOpenBlogs));

            let b = _.find(this.blogs, {
                id: blog.id
            });
            if (b) {
                b._openTime = blog._openTime;
                bs.signal('sg-recent-open-refresh');
            }

        }
    }

    _recentOpenHandle(blogs) {
        if (localStorage) {
            let robs = localStorage.getItem(`tms-blog-recent-open`);
            if (robs) {
                let recentOpenBlogs = JSON.parse(robs);

                _.each(recentOpenBlogs, b => {
                    let blog = _.find(blogs, {
                        id: b.id
                    });
                    if (blog) {
                        blog._openTime = b.openTime;
                    } else {
                        // TODO 如果不存在（可能被删除了）
                        b._deleted = true;
                    }
                });

            }
        }

    }

    _isBlogInView(id) {
        let isInView = false;
        $(`.blog-item[data-id="${id}"]`).each(function (item) {
            let _isInView = utils.isElementInViewport($(this));
            if (_isInView) {
                isInView = true;
                return false;
            }
        });
        return isInView;
    }

    _scrollTo(to) {
        if (!this._isBlogInView(to)) {
            if ($(`.blog-item[data-id="${to}"]`).length == 1) {
                $(this.treeRef).parent().scrollTo(`.blog-item[data-id="${to}"]`, {
                    offset: 0
                });
            } else if ($(`.blog-item[data-id="${to}"]`).length > 1) {
                $(this.treeRef).parent().scrollTo($(`.blog-item[data-id="${to}"]`).get(1), {
                    offset: 0
                });
            }
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
                            let dir = _.find(dirs, {
                                id: blog.dir.id
                            });
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

                // 最近打开博文处理
                this._recentOpenHandle(data.data);

                this.blogs = data.data;
                this.blog = _.find(this.blogs, {
                    id: +nsCtx.blogId
                });
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
                        this.spaces = _.reject(this.spaces, {
                            id: space.id
                        });
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
                        space.dirs = _.reject(space.dirs, {
                            id: dir.id
                        });
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

            let spaceHidden = true;
            _.each(s.dirs, d => {
                if (!_.some(d.blogs, b => !b._hidden)) {
                    d._hidden = true;
                } else {
                    s.open = true;
                    d._hidden = false;
                    d.open = true;
                    spaceHidden = false;
                }
            });

            if (_.some(s.blogs, b => !b._hidden)) spaceHidden = false;

            s._hidden = spaceHidden;
            s.open = !spaceHidden;


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

        // 最近打开15条过滤目录展开控制
        let recentOpen15 = _.takeRight(_.sortBy(_.filter(this.blogs, item => !_.isNil(item['_openTime'])), '_openTime'), 15);

        if (!_.some(recentOpen15, b => !b._hidden)) {
            this.spaceRecentOpen.open = false;
        } else {
            this.spaceRecentOpen.open = true;
        }

        if (!this.filter) {
            _.each(this.spaces, s => {
                if (_.find(s.blogs, {
                        id: +nsCtx.blogId
                    })) {
                    s.open = true;
                } else {
                    s.open = false;
                }
            });
            this.spaceStow.open = false;
            this.spaceRecent.open = false;
            this.spaceRecentOpen.open = false;
        }

    }

    createDirHandler(space) {
        this.spaceDirCreateVm.show(space);
    }

    updateChannelHandler(space) {
        this.spaceChannelEditVm.show(space);
    }

    editDirHandler(dir, space) {
        this.spaceDirEditVm.show(dir);
    }

    foldHandler() {
        this.folded = !this.folded;
        ea.publish(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR_PC, this.folded);
    }

    // sysLinkHandler(item) {
    //     $.post('/admin/link/count/inc', { id: item.id });
    //     return true;
    // }
}
