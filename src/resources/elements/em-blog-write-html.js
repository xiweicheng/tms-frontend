import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmBlogWriteHtml {

    @bindable value;

    valueChanged(newValue, oldValue) {

    }

    attached() {

        $('.em-blog-write-html').height($(window).height() - 3);

        $(window).resize((event) => {
            $('.em-blog-write-html').height($(window).height() - 3);
        });

        // $(window).resize(_.debounce(() => $(this.cRef).height($(window).height() - 60), 120, { leading: true }));

    }
}
