import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogLeftSidebar {

    @bindable value;

    valueChanged(newValue, oldValue) {

    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        this.getBlogTree();

    }

    getBlogTree() {
        $.get('/admin/blog/list', {
            page: 0,
            size: 10
        }, (data) => {
            if (data.success) {
                this.blogs = data.data.content;
                this.blog = _.find(this.blogs, { id: nsCtx.blogId });
            }
        });
    }
}
