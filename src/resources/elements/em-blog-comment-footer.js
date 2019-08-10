import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogCommentFooter {

    @bindable comment;

    name;

    loginUser = nsCtx.loginUser;

    attached() {
        $([this.addTagRef])
            .popup({
                inline: true,
                hoverable: true,
                delay: {
                    show: 500,
                    hide: 300
                }
            });
    }

    addHandler() {

        this.toggleHandler({ name: this.name, creator: this.loginUser.username });
    }

    toggleHandler(tag) {

        if (!_.trim(tag.name)) return;

        let has = _.some(this.comment.labels, { name: tag.name, creator: this.loginUser.username });

        if (has && (tag.creator != this.loginUser.username)) { // 标签已经存在，但是点击的不是自己的
            return;
        }

        $.post('/admin/blog/comment/label/toggle', {
            cid: this.comment.id,
            name: _.trim(tag.name)
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.name = '';
                this.comment.labels = data.data.labels;
            } else {
                toastr.error(data.data);
            }
        });
    }

}
