import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatSettings {

	@bindable barHide = false;

    chatAlarm = {
        ats: 1,
        news: 1,
        off: 0,
    };

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        if (localStorage) {
            let alarm = localStorage.getItem(nsCons.KEY_CHAT_ALARM);
            if (alarm) {
                _.extend(this.chatAlarm, JSON.parse(alarm));
            }
        }
    }

    alarmHandler(type) {
        this.chatAlarm[type] = Math.abs(1 - this.chatAlarm[type]);
        localStorage && localStorage.setItem(nsCons.KEY_CHAT_ALARM, JSON.stringify(this.chatAlarm));
    }
}
