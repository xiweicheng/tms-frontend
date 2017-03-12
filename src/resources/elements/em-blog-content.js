import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogContent {

    @bindable blog;

    blogChanged(newValue, oldValue) {

    }

    /**
     * 构造函数
     */
    constructor() {
        this.subscribe = ea.subscribe(nsCons.EVENT_BLOG_SWITCH, (payload) => {
            this.getBlog();
        });
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {
        this.subscribe.dispose();
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.getBlog();
    }

    getBlog() {
        if (!nsCtx.blogId) {
            return;
        }
        $.get('/admin/blog/get', {
            id: nsCtx.blogId
        }, (data) => {
            if (data.success) {
                this.blog = data.data;
            }
        });
    }
}
