import { bindable, containerless } from 'aurelia-framework';
import {
    default as SimpleMDE
} from 'simplemde';

@containerless
export class EmChatBlogWrite {

    @bindable members;

    init() {

        this.simplemde = new SimpleMDE({
            element: $('#txt-blog-write')[0],
            spellChecker: false,
            // status: false,
            autofocus: true,
            // toolbar: false,
            forceSync: true,
            // autoDownloadFontAwesome: false,
            insertTexts: {
                table: ["", "\n\n| 列1 | 列2 | 列3 |\n| ------ | ------ | ------ |\n| 文本 | 文本 | 文本 |\n\n"],
            },
            previewRender: (plainText, preview) => { // Async method
                return this.simplemde.markdown(utils.preParse(plainText));
            },
        });

        $(this.stickyRef).sticky('refresh');

    }

    destroy() {
        this.simplemde.toTextArea();
        this.simplemde = null;
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        $(this.stickyRef).sticky({ silent: true });
        $('#blog-save-btn').click((event) => {
            this.save();
        });
    }

    save() {

        let title = $('#blog-title-input').val();
        let content = this.simplemde.value();

        if (!$.trim(title)) {
            $('#blog-title-input').val('');
            toastr.error('标题不能为空!');
            return;
        }

        if (!$.trim(content)) {
            this.simplemde.value('');
            toastr.error('内容不能为空!');
            return;
        }

        if (this.sending) {
            return;
        }

        this.sending = true;

        var html = utils.md2html(content);

        $.post(`/admin/blog/save`, {
            url: utils.getBasePath(),
            usernames: utils.parseUsernames(content, [nsCtx.memberAll, ...(window.tmsUsers ? tmsUsers : [])]).join(','),
            title: title,
            content: content,
            contentHtml: html
        }, (data, textStatus, xhr) => {
            if (data.success) {
                toastr.success('博文保存成功!');
            } else {
                toastr.error(data.data, '博文保存失败!');
            }
        }).always(() => {
            this.sending = false;
        });
    }

}

// TODO
// 保存,更新,版本控制,分享,查看,目录,标签
