import { bindable, containerless } from 'aurelia-framework';
import 'tinycolorpicker';

@containerless
export class EmChatSettings {

    @bindable barHide = false;

    chatAlarm = {
        ats: 1,
        news: 1,
        off: 0,
    };

    defaultTheme = {
        bg: '#4d394b',
        color: '#4183c4'
    };

    _setTheme() {
        $('.tms-left-sidebar').css({
            backgroundColor: this.theme.bg
        });
        $('.tms-left-sidebar, .em-chat-settings').find('.my-theme').css({
            color: this.theme.color
        });
    }

    /**
     * 当视图被附加到DOM中时被调用
     */
    attached() {
        this.theme = _.extend({}, this.defaultTheme);
        if (localStorage) {
            let alarm = localStorage.getItem(nsCons.KEY_CHAT_ALARM);
            if (alarm) {
                _.extend(this.chatAlarm, JSON.parse(alarm));
            }
            let theme = localStorage.getItem(nsCons.KEY_CHAT_SIDEBAR_THEME);
            if (theme) {
                this.theme = _.extend({}, this.theme, JSON.parse(theme));
                this._setTheme();
            }
        }

        $(this.themeRef).popup({
            inline: true,
            on: 'click',
            position: 'bottom right',
            hoverable: true,
            closable: false,
            boundary: '.tms-left-sidebar',
            delay: {
                show: 300,
                hide: 300
            }
        });

        let _this = this;
        $(this.bgRef).colorPicker({
            color: this.theme.bg,
            doRender: false,
            renderCallback: function($elm, toggled) {
                if (_.isUndefined(toggled)) {
                    let c = this.color.colors;
                    let bg = `rgba(${c.RND.rgb.r}, ${c.RND.rgb.g}, ${c.RND.rgb.b}, ${c.alpha})`;
                    $('.tms-left-sidebar').css({
                        backgroundColor: bg,
                    });
                    _this.theme = _.extend({}, _this.theme ? _this.theme : this.defaultTheme, {
                        bg: bg
                    });
                    localStorage && localStorage.setItem(nsCons.KEY_CHAT_SIDEBAR_THEME, JSON.stringify(_this.theme));
                }
            },
        });
        $(this.colorRef).colorPicker({
            color: this.theme.color,
            doRender: false,
            renderCallback: function($elm, toggled) {
                if (_.isUndefined(toggled)) {
                    let c = this.color.colors;
                    let color = `rgba(${c.RND.rgb.r}, ${c.RND.rgb.g}, ${c.RND.rgb.b}, ${c.alpha})`;
                    $('.tms-left-sidebar, .em-chat-settings').find('.my-theme').css({
                        color: color
                    });
                    _this.theme = _.extend({}, _this.theme ? _this.theme : this.defaultTheme, {
                        color: color
                    });
                    localStorage && localStorage.setItem(nsCons.KEY_CHAT_SIDEBAR_THEME, JSON.stringify(_this.theme));
                }
            },
        });
    }

    alarmHandler(type) {
        this.chatAlarm[type] = Math.abs(1 - this.chatAlarm[type]);
        localStorage && localStorage.setItem(nsCons.KEY_CHAT_ALARM, JSON.stringify(this.chatAlarm));
    }

    clearThemeHandler() {
        this.theme = _.extend({}, this.defaultTheme);
        this._setTheme();
        localStorage && localStorage.removeItem(nsCons.KEY_CHAT_SIDEBAR_THEME);
    }
}
