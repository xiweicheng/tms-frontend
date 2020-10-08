import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogExcel {

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

                (payload.blog.editor == 'Excel') && this.initBlog(payload.blog);
            }
        });

        this.subscribe2 = ea.subscribe(nsCons.EVENT_COMMENT_CHANGED, (payload) => {
            if (payload.action == 'updated') {

                (payload.comment.editor == 'Excel') && this.initComment(payload.comment);
            }
        });
    }

    initBlog(blog) {
        _.defer(() => {
            if (blog.editor == 'Excel') {
                $(`.em-blog-excel[data-id="${blog.id}"] > iframe`).attr('src', `${this.baseRes}excel.html?id=${blog.id}&readonly&_=${new Date().getTime()}`);
            }
        });
    }

    initComment(comment) {
        _.defer(() => {
            if (comment.editor == 'Excel') {
                // $(`.em-blog-excel[data-cid="${comment.id}"] > iframe`).attr('src', `${this.baseRes}excel.html?comment&id=${comment.targetId}&cid=${comment.id}&readonly`);
                $(`.em-blog-excel[data-cid="${comment.id}"] > iframe`).attr('src', `${this.baseRes}excel.html?comment&id=${comment.targetId}&cid=${comment.id}&readonly&_=${new Date().getTime()}`);
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
