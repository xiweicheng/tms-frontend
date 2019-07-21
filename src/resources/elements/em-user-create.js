import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmUserCreate {

    @bindable loginUser;
    @bindable trigger;
    isSuper = nsCtx.isSuper;
    isAdmin = nsCtx.isAdmin;

    triggerChanged(newValue, oldValue) {
        $(this.trigger).click(() => {
            this.emModal.show({
                hideOnApprove: false,
                autoDimmer: true
            });
        });
    }

    showHandler() {
        this._reset();
    }

    _reset() {
        // $(this.frm).form('reset');
        this.username = null;
        this.password = '88888888';
        this.name = null;
        this.mails = null;
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this._reset();
        $(this.frm)
            .form({
                on: 'blur',
                inline: true,
                fields: {
                    username: {
                        identifier: 'username',
                        rules: [{
                            type: 'empty'
                        }, {
                            type: 'minLength[3]'
                        }, {
                            type: 'regExp',
                            value: /^[a-z]+[a-z0-9\.\-_]*[a-z0-9]+$/,
                            prompt: '小写字母数字.-_组合,字母开头,字母数字结尾'
                        }]
                    },
                    password: {
                        identifier: 'password',
                        rules: [{
                            type: 'empty'
                        }, {
                            type: 'minLength[8]'
                        }]
                    },
                    name: {
                        identifier: 'name',
                        rules: [{
                            type: 'empty'
                        }, {
                            type: 'maxLength[20]'
                        }]
                    },
                    mail: {
                        identifier: 'mail',
                        rules: [{
                            type: 'empty'
                        }, {
                            type: 'email'
                        }]
                    }
                }
            });
    }

    approveHandler(modal) {

        if (!this.isAdmin && !this.isSuper) return;

        if ($(this.frm).form('is valid')) {

            let baseURL = utils.getBaseUrl();
            baseURL = _.endsWith(baseURL, '/') ? baseURL : baseURL + '/';
            $.post('/admin/user/save', {
                username: this.username,
                password: this.password,
                name: this.name,
                mail: this.mails,
                enabled: true,
                role: $(this.frm).find('input:radio:checked').val(),
                baseURL: baseURL
            }, (data) => {
                $(this.frm).form('reset');
                modal.hide();
                if (data.success) {
                    toastr.success('创建用户成功!');
                } else {
                    toastr.error(data.data, '创建用户失败!');
                }
            });
        } else {
            modal.hideDimmer();
        }

    }
}
