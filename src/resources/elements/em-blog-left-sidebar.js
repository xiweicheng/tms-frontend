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

    baseRes = utils.getResourceBase();

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

    sortObjs = [];

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'created') {

                this._recentUpdateSave(payload.blog);

                nsCtx.blogId = payload.blog.id;

                if (payload.blog.pid) {
                    this._fixBlogSync(payload.blog.pid).then(blog => {
                        if (blog) {
                            if (blog._childs) {
                                blog._childs.push(payload.blog);
                            } else {
                                blog._childs = [payload.blog];
                            }

                            this._fixChildParent([], +payload.blog.id, (ids) => {
                                if (ids.length) {
                                    _.reverse(ids);
                                    this._openChildParent(ids, 0, true);
                                } else {
                                    _.delay(() => this._scrollTo(payload.blog.id), 1000);
                                }
                            });
                        }
                    });
                } else {
                    if (!_.find(this.blogs, {
                            id: payload.blog.id
                        })) {
                        this.blogs = [payload.blog, ...this.blogs];
                    }
                    this.calcTree();
                }

                ea.publish(nsCons.EVENT_APP_ROUTER_NAVIGATE, {
                    to: `#/blog/${payload.blog.id}`
                });

            } else if (payload.action == 'updated') {

                this._recentUpdateSave(payload.blog);

                this._fixBlogSync(+payload.blog.id).then(blog => {

                    if (blog) {

                        _.extend(blog, payload.blog);

                        if (!payload.blog.dir) blog.dir = null;
                        if (!payload.blog.space) blog.space = null;
                        if (!payload.blog.pid) blog.pid = null;

                        // 同步更新收藏博文
                        let bs = _.find(this.blogStows, item => item.blog.id === payload.blog.id);
                        if (bs) {
                            if (!payload.blog.dir) bs.blog.dir = null;
                            _.extend(bs.blog, payload.blog);
                        }

                        !payload.unCalcDir && this.calcTree();
                    }
                });
            } else if (payload.action == 'deleted') {
                this.blogStows = _.reject(this.blogStows, bs => bs.blog.id == payload.blog.id);
                this.blogs = this._delBlog(null, this.blogs, +payload.blog.id);
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
            this._fixBlogSync(+nsCtx.blogId).then(b => {
                if (b) {
                    this.blog = b;
                    payload.anchor && this.calcTree(); // TODO 这里存在bug,拖拽后重新计划目录，博文目录定位错乱，原因不明？？？
                    // payload.anchor && this.refresh(); // TODO 这里存在bug,拖拽后重新计划目录，博文目录定位错乱，原因不明？？？

                    if (!this.blog.pid) {
                        !payload.anchor && (this.blog && _.delay(() => this._scrollTo(this.blog.id), 1000));
                    } else {
                        this._fixChildParent([], this.blog.id, (ids) => {
                            if (ids.length) {
                                _.reverse(ids);
                                this._openChildParent(ids, 0, true);
                            } else {
                                _.delay(() => this._scrollTo(this.blog.id), 1000);
                            }
                        });
                    }

                }
            });
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
            !this.folded && $(this.leftBarRef).css('left', 0);
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

        this._initSplit();
    }

    /**
     * 当视图从DOM中分离时被调用
     */
    detached() {

        window.__debug && console.log('EmBlogLeftSidebar--detached');

        this.splitRef.onmousedown = null;
    }

    _initSplit() {

        this.splitRef.onmousedown = (e) => {
            // 记录下初始位置的值
            let disX = e.clientX;
            let lw = $('.em-blog-left-sidebar').width();
            let hw = $('.em-blog-content-wrapper').width();
            let isRightBarShow = $('.tms-blog').hasClass('right-sidebar-show');

            document.onmousemove = function (e) {
                let moveX = e.clientX - disX; // 鼠标拖动的偏移距离
                let lwNew = lw + moveX;
                let lrNew = hw - lwNew;

                if (lwNew < 200) return false;
                if (lrNew < 500) return false;

                $('.em-blog-left-sidebar').width(lwNew);
                $('.em-blog-content').css({
                    'left': `${lwNew}px`,
                    'width': `${isRightBarShow ? lrNew - nsCons.WIDTH_RIGHT_BAR : lrNew}px`
                })

                $('.em-blog-left-sidebar.ui.left.sidebar .tms-body .ui.space.list > .item > .content').css({
                    'width': lwNew - 55,
                    'max-width': lwNew - 55
                });
                $('.em-blog-left-sidebar.ui.left.sidebar .tms-body .ui.space.list > .item > .content > .dirs > .list.dir > .content').css({
                    'width': lwNew - 75,
                    'max-width': lwNew - 75
                });
                $('.em-blog-left-sidebar.ui.left.sidebar .tms-footer .ui.menu > .item.tms-search').css({
                    'width': lwNew - 93
                });

                return false;
            };

            // 鼠标放开的时候取消操作
            document.onmouseup = function () {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        };
    }

    _initSortObjs() {

        _.delay(() => {

            // blogs sort
            $('.tms-sortable-elem-blogs').each((i, e) => {

                // console.log(`blogs sortable elements index: ${i}`);

                let space = _.find(this.spaces, {
                    id: +$(e).attr('data-id')
                });

                let bid = $(e).closest('.blog-item').attr('data-id');
                let blog = this._fixBlogFromLocal(this.blogs, bid, true);

                // 父博文创建者 || 空间创建者 || 系统管理员
                if ((blog && blog.creator.username == this.loginUser.username) || (space && (space.creator.username == this.loginUser.username)) || this.isSuper) {

                    let sortObj = Sortable.create(e, {
                        group: {
                            name: 'blog'
                        },
                        onEnd: (evt) => {

                            // console.log(evt);

                            $(evt.item).css('transform', 'none');

                            if (evt.from === evt.to) {

                                if (evt.newIndex === evt.oldIndex) return;

                                this._sortBlogs($(evt.from).children('.blog-item'));

                            } else {

                                let blogId = $(evt.item).attr('data-id');
                                let pid = $(evt.to).closest('.blog-item').attr('data-id');
                                let spaceIdT = $(evt.to).attr('data-id');

                                let $dir = $(evt.item).closest('.dir-item');
                                let dirId = $dir ? $dir.attr('data-id') : null;

                                $.post('/admin/blog/space/update', {
                                    id: blogId,
                                    pid: pid,
                                    sid: spaceIdT,
                                    did: dirId
                                }, (data, textStatus, xhr) => {
                                    if (data.success) {
                                        if (!data.data.space) {
                                            data.data.space = null; // 确保_.extend(oldBlog, blog)更新空间属性
                                        }

                                        data.data.sort = evt.newIndex;

                                        if ($(evt.from).children('.blog-item').size() == 0) {
                                            let pidO = $(evt.from).closest('.blog-item').attr('data-id');
                                            if (!pidO) return;
                                            let b = this._fixBlogFromLocal(this.blogs, pidO, true);
                                            if (b) {
                                                b.hasChild = false;
                                            }
                                            $.post('/admin/blog/hasChild/update', {
                                                id: pidO
                                            }, (data, textStatus, xhr) => {
                                                if (data.success) {
                                                    // do nothings.
                                                }
                                            });
                                        }

                                        ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                                            action: 'updated',
                                            blog: data.data,
                                            unCalcDir: true
                                        });

                                        // sort blogs
                                        this._sortBlogs($(evt.to).children('.blog-item'));

                                    } else {
                                        toastr.error(data.data);
                                    }
                                });
                            }
                        },
                    });

                    this.sortObjs.push(sortObj);
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
                    let sortObj = Sortable.create(e, {
                        // group: {
                        //     name: 'dir'
                        // },
                        onEnd: (evt) => {

                            $(evt.item).css('transform', 'none');

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

                    this.sortObjs.push(sortObj);
                }

            });

            // spaces sort
            // 系统管理员
            if (this.isSuper) {

                $('.tms-sortable-elem-spaces').each((i, e) => {

                    // console.log(`spaces sortable elements index: ${i}`);

                    let sortObj = Sortable.create(e, {
                        // group: {
                        //     name: 'space'
                        // },
                        draggable: '.space-item',
                        onEnd: (evt) => {

                            $(evt.item).css('transform', 'none');

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

                    this.sortObjs.push(sortObj);

                });
            }

        }, 2000);
    }

    _sortBlogs($all) {
        var items = [];
        $all.each((i, e) => {
            let bid = $(e).attr('data-id');
            items.push({
                id: bid,
                sort: i
            });

            $(e).attr('data-sort', i);

            // update blog sort value
            let blog = _.find(this.blogs, {
                id: +bid
            });
            blog && (blog.sort = i);

        })

        $.post("/admin/blog/sort", {
            items: JSON.stringify(items)
        }, (data) => {
            if (!data.success) {
                toastr.error(data.data);
            }
        });
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

            // 删除标记删除的
            _.remove(recentOpenBlogs, ['_deleted']);

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

            this._getBlogs(blog.id).then(blog2 => {
                if (blog2) {
                    blog2._openTime = blog._openTime ? blog._openTime : new Date().getTime();
                    bs.signal('sg-recent-open-refresh');
                }
            });
        }
    }

    _recentOpenHandle(blogs) {
        if (localStorage) {
            let robs = localStorage.getItem(`tms-blog-recent-open`);
            if (robs) {
                let recentOpenBlogs = JSON.parse(robs);

                _.each(recentOpenBlogs, (b, index) => {
                    this._getBlogs(+b.id, blogs).then(blog => {
                        if (blog) {
                            blog._openTime = b.openTime;
                        } else {
                            // TODO 如果不存在（可能被删除了）
                            b._deleted = true;
                        }
                        // console.log(index, index == recentOpenBlogs.length);
                        if (index == recentOpenBlogs.length - 1) {
                            this.blogs = [...this.blogs];
                        }
                    });
                });
            }
        }
    }

    _recentUpdateSave(blog) {
        // 记忆更新博文
        if (localStorage) {
            let recentUpdateBlogs = [];
            let rubs = localStorage.getItem(`tms-blog-recent-update`);
            if (rubs) {
                recentUpdateBlogs = JSON.parse(rubs);
            }

            // 删除已经删除的
            if (this.blogs && this.blogs.length > 0) {
                _.remove(recentUpdateBlogs, item => !_.some(this.blogs, {
                    id: item.id
                }));
            }

            // 删除标记删除的
            _.remove(recentUpdateBlogs, ['_deleted']);

            // 删除可能已经存在的
            _.remove(recentUpdateBlogs, {
                id: blog.id
            });

            // 头部追加新打开的
            recentUpdateBlogs.unshift({
                id: blog.id
            });

            if (recentUpdateBlogs.length > 20) { // 只记忆最新打开的20个
                recentUpdateBlogs.splice(20, recentUpdateBlogs.length - 20);
            }

            localStorage.setItem(`tms-blog-recent-update`, JSON.stringify(recentUpdateBlogs));

            this._getBlogs(blog.id).then(blog2 => {
                if (blog2) {
                    _.extend(blog2, blog);
                    // this.blogs = [...this.blogs];
                    bs.signal('sg-recent-update-refresh');
                }
            });
        }
    }

    _recentUpdateHandle(blogs) {
        if (localStorage) {
            let rubs = localStorage.getItem(`tms-blog-recent-update`);
            if (rubs) {
                let recentUpdateBlogs = JSON.parse(rubs);

                _.each(recentUpdateBlogs, (b, index) => {
                    this._getBlogs(+b.id, blogs).then(blog => {
                        if (!blog) {
                            // 如果不存在（可能被删除了）
                            b._deleted = true;
                        }
                        if (index == recentUpdateBlogs.length - 1) {
                            // this.blogs = [...this.blogs];
                            bs.signal('sg-recent-update-refresh');
                        }
                    });
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
            let size = $(`.blog-item[data-id="${to}"]`).length;
            if (size == 1) {
                $(this.treeRef).parent().scrollTo(`.blog-item[data-id="${to}"]`, {
                    offset: 0
                });
            } else if (size > 1) {
                $(this.treeRef).parent().scrollTo($(`.blog-item[data-id="${to}"]`).get(size - 1), {
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

                // 只处理this.blogs中没有父博文的blog
                if (!blog.pid && blog.space) {
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

        this.noSpaceBlogs = _.filter(this.blogs, b => (!b.pid && !b.space));

        this._fixChildParent([], +nsCtx.blogId, (ids) => {
            if (ids.length) {
                _.reverse(ids);
                this._openChildParent(ids, 0, true, () => {
                    this._reInitSortObjs();
                });
            } else {
                this._reInitSortObjs();
                _.delay(() => this._scrollTo(+nsCtx.blogId), 1000);
            }
        });
    }

    _reInitSortObjs() {
        if (this.sortObjs.length > 0) {
            _.each(this.sortObjs, sortObj => sortObj.destroy());
            this.sortObjs = [];
        }
        this._initSortObjs();
    }

    // 展开父博文层级定位到blog
    _openChildParent(ids, index, useLocal, callback) {

        // console.log(ids, index);

        if (index >= ids.length) return;

        let blog = this._fixBlogFromLocal(this.blogs, ids[index], true);

        if (blog) {
            if (!blog._open) {
                blog._open = true;
                blog.hasChild = true;
            }

            if (useLocal && blog._childs) {
                if (index == ids.length - 1) {
                    _.each(this.spaces, space => {
                        if (blog.space && blog.space.id == space.id) {
                            space.open = true;
                            _.each(space.dirs, dir => {
                                if (blog.dir && blog.dir.id == dir.id) {
                                    dir.open = true;
                                }
                            });
                        }
                    });
                    callback && callback();
                    _.delay(() => this._scrollTo(+nsCtx.blogId), 1000);
                }
                this._openChildParent(ids, index + 1, useLocal, callback);
            } else {
                $.get('/admin/blog/list/by/pid', {
                    pid: blog.id
                }, (data) => {
                    if (data.success) {
                        blog._childs = data.data;
                        if (index == ids.length - 1) {
                            _.each(this.spaces, space => {
                                if (blog.space && blog.space.id == space.id) {
                                    space.open = true;
                                    _.each(space.dirs, dir => {
                                        if (blog.dir && blog.dir.id == dir.id) {
                                            dir.open = true;
                                        }
                                    });
                                }
                            });
                            callback && callback();
                            _.delay(() => this._scrollTo(+nsCtx.blogId), 1000);
                        }
                        this._openChildParent(ids, index + 1, useLocal, callback);
                    } else {
                        toastr.error(data.data);
                    }
                });
            }

        } else {
            console.log('_openChildParent !blog case.');
        }
    }

    // 定位到博文的父级层级关系
    _fixChildParent(ids, id, callback) {

        this._fixBlogSync(id).then(blog => {
            if (blog) {
                let pid = blog.pid;
                if (!pid) {
                    callback && callback(ids);
                    return;
                }
                ids.push(pid);

                this._fixChildParent(ids, pid, callback);
            } else {
                console.log('_fixChildParent !blog case.');
            }
        });
    }

    spaceToggleHandler(space) {
        space.open = !space.open;
    }

    dirToggleHandler(dir) {
        dir.open = !dir.open;
    }

    _delBlog(pblog, blogs, bid) {

        let bs = _.reject(blogs, {
            id: +bid
        });

        if (pblog != null) {
            pblog._childs = bs;
            pblog.hasChild = bs && bs.length > 0;
        }
        _.each(bs, blog => {
            this._delBlog(blog, blog._childs, bid);
        });

        if (pblog == null) {
            return bs;
        }
    }

    // 从this.blogs和blog._childs中定位查找到指定id的blog
    // this.blogs中放置的都是不含pid的blog，子级放在_childs中
    _fixBlogFromLocal(blogs, bid, isTop) {

        let _blog = null;
        _.each(blogs, blog => {
            if (isTop) {
                if (!blog.pid && blog.id == bid) {
                    _blog = blog;
                    return false;
                }
            } else {
                if (blog.pid && blog.id == bid) {
                    _blog = blog;
                    return false;
                }
            }
            _blog = this._fixBlogFromLocal(blog._childs, bid, false);
            if (_blog) {
                return false;
            }
        });

        return _blog;
    }

    // 定位查找blog，本地没有就从服务端获取，不会添加到this.blogs中
    async _fixBlogSync(id) {

        this.blogs = this.blogs ? this.blogs : [];

        let blog = this._fixBlogFromLocal(this.blogs, id, true);

        if (blog) return blog;

        await this._getBlogs(id).then(b => {
            if (b) {
                blog = b;
            }
        });

        return blog;
    }

    // 异步从服务端获取blog
    async _getBlog(id) {
        let blog = null;
        if (id) {
            await $.get('/admin/blog/get', {
                id: id
            }, (data) => {
                if (data.success) {
                    blog = data.data;
                } else {
                    console.warn(data.data);
                }
            });
        }

        return blog;
    }

    // 从本地查找blog，没找到从远端获取，并且添加到this.blogs中
    async _getBlogs(id, blogs) {
        this.blogs = blogs ? blogs : (this.blogs ? this.blogs : []);
        let blog = _.find(this.blogs, {
            id: +id
        });
        if (blog) return blog;

        await this._getBlog(+id).then(b => {
            if (b) {
                blog = _.find(this.blogs, {
                    id: +id
                });
                if (!blog) {
                    blog = b;
                    this.blogs.push(blog);
                } else {
                    console.log('_getBlogs blog case.');
                }
            }
        });

        return blog;
    }

    getBlogTree() {
        return $.get('/admin/blog/listMy', (data) => {
            if (data.success) {

                this.blogs = data.data;

                this._fixBlogSync(+nsCtx.blogId).then(b => {
                    this.blog = b;
                    // 最近打开博文处理
                    this._recentOpenHandle(this.blogs);
                    this._recentUpdateHandle(this.blogs);
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

    _doChildsFilter(blogs) {
        let hide = true;
        _.each(blogs, b => {
            if (!_.includes(_.toLower(b.title), _.toLower(this.filter))) {
                if (b._childs) {
                    b._hidden = this._doChildsFilter(b._childs);
                    if (!b._hidden) {
                        hide = false;
                    }
                } else {
                    b._hidden = true;
                }
            } else {
                b._hidden = false;
                hide = false;
            }
        });

        return hide;
    }

    _doFiler() {

        this._doChildsFilter(this.blogs);

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
                    d.open = !!this.filter;

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
        this.folded && $(this.leftBarRef).css('left', -$(this.leftBarRef).width());
    }

    createHandler(space, dir, blog) {
        if (!nsCtx.isModaalOpening) {
            nsCtx.newBlogSpace = space;
            nsCtx.newBlogDir = dir;
            nsCtx.newBlogBlog = blog;
            $('a[href="#modaal-blog-write"]').click();
        }
    }

    createHtmlHandler(space, dir, blog) {
        $('.em-blog-write-html > iframe').attr('src', this.baseRes + 'blog.html' + '?_=' + new Date().getTime() + '&spaceId=' + (space ? space.id : '') + '&dirId=' + (dir ? dir.id : '') + '&pid=' + (blog ? blog.id : ''));
        $('a[href="#modaal-blog-write-html"]').click();
        return false;
    }

    createMindHandler(space, dir, blog) {
        $('.em-blog-write-mind > iframe').attr('src', this.baseRes + 'mind.html' + '?_=' + new Date().getTime() + '&spaceId=' + (space ? space.id : '') + '&dirId=' + (dir ? dir.id : '') + '&pid=' + (blog ? blog.id : ''));
        $('a[href="#modaal-blog-write-mind"]').click();
        return false;
    }

    createExcelHandler(space, dir, blog) {
        $('.em-blog-write-excel > iframe').attr('src', this.baseRes + 'excel.html' + '?_=' + new Date().getTime() + '&spaceId=' + (space ? space.id : '') + '&dirId=' + (dir ? dir.id : '') + '&pid=' + (blog ? blog.id : ''));
        $('a[href="#modaal-blog-write-excel"]').click();
        return false;
    }

    createSheetHandler(space, dir, blog) {
        $('.em-blog-write-sheet > iframe').attr('src', this.baseRes + 'sheet.html' + '?_=' + new Date().getTime() + '&spaceId=' + (space ? space.id : '') + '&dirId=' + (dir ? dir.id : '') + '&pid=' + (blog ? blog.id : ''));
        $('a[href="#modaal-blog-write-sheet"]').click();
        return false;
    }

    selectTplHandler(space, dir, blog) {
        this.blogTplSelectMd.show(space, dir, blog);
    }

    loadChildBlogs(blog) {

        if (!blog.hasChild) return;

        blog._open = !blog._open;
        if (blog._open && !blog._childs) {
            $.get('/admin/blog/list/by/pid', {
                pid: blog.id
            }, (data) => {
                if (data.success) {
                    blog._childs = data.data;
                    blog.hasChild = blog._childs.length > 0;
                    _.delay(() => {
                        this._reInitSortObjs();
                    }, 1000);
                } else {
                    toastr.error(data.data);
                }
            });
        }
    }

    delBlogHandler(blog) {
        if (this.isSuper || blog.creator.username == this.loginUser.username) {
            this.confirmMd.show({
                title: '删除确认',
                content: '确认要删除该博文吗?',
                onapprove: () => {
                    $.post("/admin/blog/delete", {
                        id: blog.id
                    }, (data, textStatus, xhr) => {
                        if (data.success) {
                            toastr.success('删除博文成功!');
                            ea.publish(nsCons.EVENT_BLOG_CHANGED, {
                                action: 'deleted',
                                blog: blog
                            });
                            ea.publish(nsCons.EVENT_APP_ROUTER_NAVIGATE, {
                                to: '#/blog'
                            });
                        } else {
                            toastr.error(data.data, '删除博文失败!');
                        }
                    });
                }
            });
        }
    }
}
