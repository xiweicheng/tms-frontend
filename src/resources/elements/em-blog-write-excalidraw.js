import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogWriteExcalidraw {

    attached() {

        $('.em-blog-write-excalidraw').height($(window).height());

        $(window).resize((event) => {
            $('.em-blog-write-excalidraw').height($(window).height());
        });

        // $(window).resize(_.debounce(() => $(this.cRef).height($(window).height() - 60), 120, { leading: true }));

    }
}