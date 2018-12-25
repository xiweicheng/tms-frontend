import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatGantt {

    attached() {

        $('.em-chat-gantt').height($(window).height());

        $(window).resize((event) => {
            $('.em-chat-gantt').height($(window).height());
        });

    }
}
