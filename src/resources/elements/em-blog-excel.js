import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogExcel {

    @bindable blog;

    baseRes = utils.getResourceBase();

    blogChanged(newValue, oldValue) {
        newValue && this.init(newValue);
    }

    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_CHANGED, (payload) => {
            if (payload.action == 'updated') {

                (payload.blog.editor == 'Excel') && this.init(payload.blog);
            }
        });
    }

    init(blog) {
        if (blog.editor == 'Excel') {
            $('.em-blog-excel > iframe').attr('src', `${this.baseRes}excel.html?id=${blog.id}&readonly&_=${new Date().getTime()}`);
        }
    }

    attached() {

    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
    }
}

