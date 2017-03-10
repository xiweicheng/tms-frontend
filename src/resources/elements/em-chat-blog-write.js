import { bindable, containerless } from 'aurelia-framework';
import {
    default as SimpleMDE
} from 'simplemde';

@containerless
export class EmChatBlogWrite {

    @bindable value;

    valueChanged(newValue, oldValue) {

    }

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

        this.simplemde.value("This text will appear in the editor");

    }

    destroy() {
        this.simplemde.toTextArea();
        this.simplemde = null;
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {}
}
