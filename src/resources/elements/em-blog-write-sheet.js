import {
    bindable,
    containerless
} from 'aurelia-framework';

@containerless
export class EmBlogWriteSheet {

    attached() {

        $('.em-blog-write-sheet').height($(window).height());

        $(window).resize((event) => {
            $('.em-blog-write-sheet').height($(window).height());
        });

        // $(window).resize(_.debounce(() => $(this.cRef).height($(window).height() - 60), 120, { leading: true }));

    }
}
