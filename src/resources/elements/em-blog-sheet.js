import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogSheet {

    @bindable blog;
    @bindable comment;

    baseRes = utils.getResourceBase();

    blogChanged(newValue, oldValue) {
        newValue && this.initBlog(newValue);
    }

    commentChanged(newValue, oldValue) {
        newValue && this.initComment(newValue);
    }

    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'updated') {

                (payload.blog.editor == 'Sheet') && this.initBlog(payload.blog);
            }
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_COMMENT_CHANGED, (payload) => {
            if (payload.action == 'updated') {

                (payload.comment.editor == 'Sheet') && this.initComment(payload.comment);
            }
        });
    }

    initBlog(blog) {
        _.defer(() => {
            if (blog.editor == 'Sheet') {
                $(`.em-blog-sheet[data-id="${blog.id}"] > iframe`).attr('src', `${this.baseRes}sheet.html?id=${blog.id}&readonly&_=${new Date().getTime()}`);
            }
        });
    }

    initComment(comment) {
        _.defer(() => {
            if (comment.editor == 'Sheet') {
                $(`.em-blog-sheet[data-cid="${comment.id}"] > iframe`).attr('src', `${this.baseRes}sheet.html?comment&id=${comment.targetId}&cid=${comment.id}&readonly&_=${new Date().getTime()}`);
            }
        });
    }

    attached() {

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
        this.subscribe2.dispose();
    }
}
