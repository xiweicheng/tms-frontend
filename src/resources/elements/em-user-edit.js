import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmUserEdit {

    @bindable user;

    show() {
        this.emModal.show({
            hideOnApprove: false,
            autoDimmer: true
        });
    }

    showHandler() {}

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.frm)
            .form({
                on: 'blur',
                inline: true,
                fields: {
                    name: 'empty',
                    mail: ['empty', 'email'],
                    // password: ['minLength[8]'],
                }
            });
        $(this.frm2)
            .form({
                on: 'blur',
                inline: true
            });
    }

    _chkOk() {
        let pwd = this.user.password;
        if (pwd && pwd.length < 8) {
            toastr.error('密码长度不能少于8位字符!');
            return false;
        }

        return true;
    }

    approveHandler(modal) {

        var active = $(this.tabRef).children('a.active').attr('data-tab');

        if (active == 'user-basic-info') {

            if (this._chkOk() && $(this.frm).form('is valid')) {
                $.post('/admin/user/update2', {
                    username: this.user.username,
                    password: this.user.password,
                    name: this.user.name,
                    mail: this.user.mails
                }, (data) => {
                    modal.hide();
                    this.user.password = '';
                    if (data.success) {
                        toastr.success('更新个人信息成功!');
                    } else {
                        toastr.error(data.data, '更新个人信息失败!');
                    }
                });
            } else {
                modal.hideDimmer();
            }
        } else if (active == 'user-extra-info') {

            $.post('/admin/user/extra/update', {
                username: this.user.username,
                phone: this.user.phone,
                mobile: this.user.mobile,
                place: this.user.place,
                level: this.user.level,
                hobby: this.user.hobby,
                introduce: this.user.introduce
            }, (data) => {
                modal.hide();
                if (data.success) {
                    toastr.success('更新个人扩展信息成功!');
                } else {
                    toastr.error(data.data, '更新个人扩展信息失败!');
                }
            });
        }
    }
}
