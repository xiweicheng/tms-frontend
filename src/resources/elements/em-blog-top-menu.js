import { bindable, containerless } from 'aurelia-framework';
import 'timeago';
let tg = timeago();
import search from 'common/common-search';

@containerless
export class EmBlogTopMenu {

    isHide = true;

    loginUser = nsCtx.loginUser;

    basePath = utils.getBasePath();

    baseRes = utils.getResourceBase();

    recentSearchs = {
        blogs: [],
        comments: []
    };

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_SWITCH, (payload) => {
            this.toggleHandler(true);
        });
        this.subscribe2 = ea.subscribe(nsCons.EVENT_BLOG_LEFT_SIDEBAR_TOGGLE, (payload) => {
            this.toggleHandler(payload.isHide);
        });
        this.subscribe3 = ea.subscribe(nsCons.EVENT_WS_BLOG_NEWS_UPDATE, (payload) => {
            this._getNews();
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
        this.subscribe3.dispose();
    }

    _getNews() {
        $.get('/admin/blog/news/list', {
            page: 0,
            size: 20
        }, (data) => {
            if (data.success) {
                this.news = data.data.content;
                this.totalNews = data.data.totalElements;
            }
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        $(this.logoRef).on('mouseenter', (event) => {
            $(this.logoRef).animateCss('flip');
        });

        $(this.searchRef)
            .search({
                type: 'category',
                minCharacters: 2,
                selectFirstResult: true,
                // showNoResults: true,
                onSelect: (result, response) => {
                    $(this.searchRef).search('hide results');
                    _.defer(() => {
                        $(this.searchRef).find('input').blur();
                        ea.publish(nsCons.EVENT_APP_ROUTER_NAVIGATE, { to: result.url });
                    });
                    search.add(result);
                    return false;
                },
                apiSettings: {
                    onResponse: function(resp) {
                        var response = {
                            results: {
                                blogs: {
                                    name: `博文 (${resp.data.blogs.length})`,
                                    results: []
                                },
                                comments: {
                                    name: `评论 (${resp.data.comments.length})`,
                                    results: []
                                }
                            }
                        };
                        $.each(resp.data.blogs, (index, item) => {

                            let desc = `<i class="wait icon"></i>${item.creator.name} 创建于 ${tg.format(item.createDate, 'zh_CN')}`;
                            if (item.space && item.space.name) {
                                desc = desc + `<br/><i class="world icon"></i>${item.space ? item.space.name : ''}`;
                            }
                            if (item.dir && item.dir.name) {
                                desc = desc + ` / <i class="folder outline icon"></i>${item.dir ? item.dir.name : ''}`;
                            }

                            response.results.blogs.results.push({
                                type: 'blog',
                                id: item.id,
                                title: item.title,
                                // description: utils.abbreviate(item.content, 65),
                                description: desc,
                                url: `#/blog/${item.id}`
                            });
                        });
                        $.each(resp.data.comments, (index, item) => {
                            response.results.comments.results.push({
                                type: 'comment',
                                id: item.id,
                                title: `#/blog/${item.targetId}?cid=${item.id}`,
                                // description: item.content,
                                description: `<i class="wait icon"></i>${item.creator.name} 创建于 ${tg.format(item.createDate, 'zh_CN')}<br/>${utils.encodeHtml(item.content)}`,
                                url: `#/blog/${item.targetId}?cid=${item.id}`
                            });
                        });
                        return response;
                    },
                    url: '/admin/blog/search?search={query}&comment=true&ellipsis=60'
                }
            });

        this._refreshSysLinks();

        if (nsCtx.blogId == 'create') {
            _.defer(() => { $('a[href="#modaal-blog-write"]').click(); });
        }

        $(this.newsRef).popup({
            inline: true,
            hoverable: true,
            distanceAway: -10,
            position: 'bottom left',
            delay: {
                show: 200,
                hide: 300
            }
        });

        this._getNews();
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

    searchBlurHandler() {
        this.isSearchFocus = false;
    }

    searchFocusHandler() {
        this.isSearchFocus = true;
        this.showRecentSearchResults();
    }

    showRecentSearchResults() {
        let v = $(this.searchRef).find('input').val();
        if (!v) {
            let resp = {
                results: {
                    blogs: {
                        name: `博文 (${search.blogs.size()})`,
                        results: _.reverse([...search.blogs.list()])
                    },
                    comments: {
                        name: `评论 (${search.comments.size()})`,
                        results: _.reverse([...search.comments.list()])
                    }
                }
            };
            let html = $(this.searchRef).search('generate results', resp);
            _.defer(() => $(this.searchRef).search('add results', html));
        }
    }

    toggleHandler(isHide) {
        if (this.isHide === isHide) {
            return;
        }
        this.isHide = isHide ? isHide : !this.isHide;
        ea.publish(nsCons.EVENT_BLOG_TOGGLE_SIDEBAR, this.isHide);
    }

    userEditHandler() {
        this.userEditMd.show();
    }

    logoutHandler() {
        $.post('/admin/logout').always(() => {
            utils.redirect2Login();
        });
    }

    searchKeyupHandler(event) {
        if (event.keyCode == 27) {
            $(this.searchRef).search('set value', '');
        }
        this.showRecentSearchResults();
    }

    newsHandler(item) {
        $.post('/admin/blog/news/delete', { id: item.id }, (data, textStatus, xhr) => {
            if (data.success) {
                // this._getNews();
            }
        });
        return true;
    }

    newsDelHandler(item, event) {
        event.stopPropagation();
        this.newsHandler(item);
    }

    newsRefreshHandler() {
        this._getNews();
    }

    createHandler() {
        if (!nsCtx.isModaalOpening) {
            $('a[href="#modaal-blog-write"]').click();
        }
    }

    htmlCreateHandler() {
        $('.em-blog-write-html > iframe').attr('src', this.baseRes + 'blog.html' + '?_=' + new Date().getTime());
        $('a[href="#modaal-blog-write-html"]').click();
        return false;
    }
}
