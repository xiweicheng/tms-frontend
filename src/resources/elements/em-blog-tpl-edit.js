import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogTplEdit {

    blog;

    desc;

    showHandler() {

        let tpl = this.blog.tpl ? this.blog.tpl : 0;
        this.desc = this.blog.tplDesc;

        $(this.tplRef).find(`.ui.radio.checkbox[data-value="${tpl}"]`).checkbox('set checked');
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {

        $(this.tplRef).find('.ui.radio.checkbox').checkbox();
    }

    /**
     * 当数据绑定引擎从视图解除绑定时被调用
     */
    unbind() {

    }

    approveHandler(modal) {

        let tpl = 0;
        for (var i = 0; i <= 2; i++) {
            let $chk = $(this.tplRef).find(`.ui.radio.checkbox[data-value="${i}"]`);
            if ($chk.checkbox('is checked')) {
                tpl = i;
                break;
            }
        }

        $.post('/admin/blog/tpl/update', {
            id: this.blog.id,
            tpl: tpl,
            desc: this.desc
        }, (data, textStatus, xhr) => {
            if (data.success) {
                this.blog.tpl = tpl;
                this.blog.tplDesc = this.desc;
                toastr.success('博文模板属性更新成功！');
            } else {
                toastr.error(data.data);
            }
        });

    }

    show(blog) {

        this.blog = blog;

        this.emModal.show({
            hideOnApprove: true,
            autoDimmer: false
        });
    }
}
