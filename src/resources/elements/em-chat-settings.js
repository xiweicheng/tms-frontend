import { bindable, containerless } from 'aurelia-framework';
import 'tinycolorpicker';
import {
    default as clipboard
} from 'clipboard-js';

@containerless
export class EmChatSettings {

    @bindable barHide = false;

    chatAlarm = {
        ats: 1,
        news: 1,
        audio: 0,
        off: 0,
    };

    defaultTheme = {
        bg: '#4d394b',
        color: '#4183c4'
    };

    plugin = {
        customBG: '#222',
        margin: '5px 0 0',
        doRender: 'div div',
        colorNames: {
            '191970': 'midnightblue',
            '696969': 'dimgrey',
            '708090': 'slategrey',
            '778899': 'lightslategrey',
            '800000': 'maroon',
            '800080': 'purple',
            '808000': 'olive',
            '808080': 'grey',
            'F0F8FF': 'aliceblue',
            'FAEBD7': 'antiquewhite',
            '00FFFF': 'cyan',
            '7FFFD4': 'aquamarine',
            'F0FFFF': 'azure',
            'F5F5DC': 'beige',
            'FFE4C4': 'bisque',
            '000000': 'black',
            'FFEBCD': 'blanchedalmond',
            '0000FF': 'blue',
            '8A2BE2': 'blueviolet',
            'A52A2A': 'brown',
            'DEB887': 'burlywood',
            '5F9EA0': 'cadetblue',
            '7FFF00': 'chartreuse',
            'D2691E': 'chocolate',
            'FF7F50': 'coral',
            '6495ED': 'cornflowerblue',
            'FFF8DC': 'cornsilk',
            'DC143C': 'crimson',
            '00008B': 'darkblue',
            '008B8B': 'darkcyan',
            'B8860B': 'darkgoldenrod',
            'A9A9A9': 'darkgrey',
            '006400': 'darkgreen',
            'BDB76B': 'darkkhaki',
            '8B008B': 'darkmagenta',
            '556B2F': 'darkolivegreen',
            'FF8C00': 'darkorange',
            '9932CC': 'darkorchid',
            '8B0000': 'darkred',
            'E9967A': 'darksalmon',
            '8FBC8F': 'darkseagreen',
            '483D8B': 'darkslateblue',
            '2F4F4F': 'darkslategrey',
            '00CED1': 'darkturquoise',
            '9400D3': 'darkviolet',
            'FF1493': 'deeppink',
            '00BFFF': 'deepskyblue',
            '1E90FF': 'dodgerblue',
            'B22222': 'firebrick',
            'FFFAF0': 'floralwhite',
            '228B22': 'forestgreen',
            'FF00FF': 'magenta',
            'DCDCDC': 'gainsboro',
            'F8F8FF': 'ghostwhite',
            'FFD700': 'gold',
            'DAA520': 'goldenrod',
            '008000': 'green',
            'ADFF2F': 'greenyellow',
            'F0FFF0': 'honeydew',
            'FF69B4': 'hotpink',
            'CD5C5C': 'indianred',
            '4B0082': 'indigo',
            'FFFFF0': 'ivory',
            'F0E68C': 'khaki',
            'E6E6FA': 'lavender',
            'FFF0F5': 'lavenderblush',
            '7CFC00': 'lawngreen',
            'FFFACD': 'lemonchiffon',
            'ADD8E6': 'lightblue',
            'F08080': 'lightcoral',
            'E0FFFF': 'lightcyan',
            'FAFAD2': 'lightgoldenrodyellow',
            'D3D3D3': 'lightgrey',
            '90EE90': 'lightgreen',
            'FFB6C1': 'lightpink',
            'FFA07A': 'lightsalmon',
            '20B2AA': 'lightseagreen',
            '87CEFA': 'lightskyblue',
            'B0C4DE': 'lightsteelblue',
            'FFFFE0': 'lightyellow',
            '00FF00': 'lime',
            '32CD32': 'limegreen',
            'FAF0E6': 'linen',
            '66CDAA': 'mediumaquamarine',
            '0000CD': 'mediumblue',
            'BA55D3': 'mediumorchid',
            '9370DB': 'mediumpurple',
            '3CB371': 'mediumseagreen',
            '7B68EE': 'mediumslateblue',
            '00FA9A': 'mediumspringgreen',
            '48D1CC': 'mediumturquoise',
            'C71585': 'mediumvioletred',
            'F5FFFA': 'mintcream',
            'FFE4E1': 'mistyrose',
            'FFE4B5': 'moccasin',
            'FFDEAD': 'navajowhite',
            '000080': 'navy',
            'FDF5E6': 'oldlace',
            '6B8E23': 'olivedrab',
            'FFA500': 'orange',
            'FF4500': 'orangered',
            'DA70D6': 'orchid',
            'EEE8AA': 'palegoldenrod',
            '98FB98': 'palegreen',
            'AFEEEE': 'paleturquoise',
            'DB7093': 'palevioletred',
            'FFEFD5': 'papayawhip',
            'FFDAB9': 'peachpuff',
            'CD853F': 'peru',
            'FFC0CB': 'pink',
            'DDA0DD': 'plum',
            'B0E0E6': 'powderblue',
            'FF0000': 'red',
            'BC8F8F': 'rosybrown',
            '4169E1': 'royalblue',
            '8B4513': 'saddlebrown',
            'FA8072': 'salmon',
            'F4A460': 'sandybrown',
            '2E8B57': 'seagreen',
            'FFF5EE': 'seashell',
            'A0522D': 'sienna',
            'C0C0C0': 'silver',
            '87CEEB': 'skyblue',
            '6A5ACD': 'slateblue',
            'FFFAFA': 'snow',
            '00FF7F': 'springgreen',
            '4682B4': 'steelblue',
            'D2B48C': 'tan',
            '008080': 'teal',
            'D8BFD8': 'thistle',
            'FF6347': 'tomato',
            '40E0D0': 'turquoise',
            'EE82EE': 'violet',
            'F5DEB3': 'wheat',
            'FFFFFF': 'white',
            'F5F5F5': 'whitesmoke',
            'FFFF00': 'yellow',
            '9ACD32': 'yellowgreen'
        },

        buildCallback: function($elm) {
            $elm.append('<div class="cp-patch"><div class="copy" title="点击复制颜色"></div></div><div class="cp-disp"></div>');
            $elm.find('.copy').click(function(event) {
                clipboard.copy($elm.find('.cp-disp').text()).then(
                    () => { toastr.success('复制颜色到剪贴板成功!'); },
                    (err) => { toastr.error('复制颜色到剪贴板失败!'); }
                );
            });
        },

        cssAddon: // could also be in a css file instead
            '.cp-patch{float:left; margin:9px 0 0;' +
            'height:24px; width: 24px; border:1px solid #aaa;}' +
            '.cp-patch{background-image: url(\'data:image/gif;base64,R0lGODlhDAAMAIABAMzMzP///yH5BAEAAAEALAAAAAAMAAwAAAIWhB+ph5ps3IMyQFBvzVRq3zmfGC5QAQA7\');}' +
            '.cp-patch div{height:24px; width: 24px;}' +
            '.cp-disp{padding:4px 0 4px 4px; margin-top:10px; font-size:12px;' +
            'height:16px; line-height:16px; color:#333;}' +
            '.cp-color-picker{border:1px solid #999; padding:8px; box-shadow:5px 5px 16px rgba(0,0,0,0.4);' +
            'background:#eee; overflow:visible; border-radius:3px;}' +
            '.cp-color-picker:after{content:""; display:block; ' +
            'position:absolute; top:-8px; left:8px; border:8px solid #eee; border-width: 0px 8px 8px;' +
            'border-color: transparent transparent #eee}' +
            // simulate border...
            '.cp-color-picker:before{content:""; display:block; ' +
            'position:absolute; top:-9px; left:8px; border:8px solid #eee; border-width: 0px 8px 8px;' +
            'border-color: transparent transparent #999}' +
            '.cp-xy-slider{border:1px solid #aaa; margin-bottom:10px; width:150px; height:150px;}' +
            '.cp-xy-slider:active {cursor:none;}' +
            '.cp-xy-cursor{width:12px; height:12px; margin:-6px}' +
            '.cp-z-slider{margin-left:8px; border:1px solid #aaa; height:150px; width:24px;}' +
            '.cp-z-cursor{border-width:5px; margin-top:-5px;}' +
            '.cp-color-picker .cp-alpha{width:152px; margin:10px 0 0; height:6px; border-radius:6px;' +
            'overflow:visible; border:1px solid #aaa; box-sizing:border-box;' +
            'background: linear-gradient(to right, rgba(238,238,238,1) 0%,rgba(238,238,238,0) 100%);}' +
            '.cp-alpha-cursor{background: #eee; border-radius: 100%;' +
            'width:14px; height:14px; margin:-5px -7px; border:1px solid #999!important;' +
            'box-shadow:inset -2px -4px 3px #ccc}' +
            '.cp-alpha:after{position:relative; content:"α"; color:#666; font-size:16px;' +
            'font-family:monospace; position:absolute; right:-26px; top:-8px}',

    }

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
        $(this.bgRef).colorPicker(_.extend({}, this.plugin, {
            color: this.theme.bg,
            renderCallback: function($elm, toggled) {

                var colors = this.color.colors,
                    rgb = colors.RND.rgb;

                $('.cp-patch div', this.$UI).css({ 'background-color': $elm[0].style.backgroundColor });
                $('.cp-disp', this.$UI).text(this.color.options.colorNames[colors.HEX] || $elm.val());
                if (toggled === true) {
                    $('.trigger').removeClass('active');
                    $elm.closest('.trigger').addClass('active');
                } else if (toggled === false) {
                    $elm.closest('.trigger').removeClass('active');
                }

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
            }
        }));
        $(this.colorRef).colorPicker(_.extend({}, this.plugin, {
            color: this.theme.color,
            renderCallback: function($elm, toggled) {
                var colors = this.color.colors,
                    rgb = colors.RND.rgb;
                $('.cp-patch div', this.$UI).css({ 'background-color': $elm[0].style.backgroundColor });
                $('.cp-disp', this.$UI).text(this.color.options.colorNames[colors.HEX] || $elm.val());
                if (toggled === true) {
                    $('.trigger').removeClass('active');
                    $elm.closest('.trigger').addClass('active');
                } else if (toggled === false) {
                    $elm.closest('.trigger').removeClass('active');
                }

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
        }));
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
