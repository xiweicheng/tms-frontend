import 'jquery-format';
import 'timeago';
import {
    default as ColorHash
} from 'color-hash';
import tags from 'common/common-tags';
import {
    default as UA
}
from 'ua-device';

let tg = timeago();

/**
 * 该文件用于定义值的过滤转换器
 *
 */
// ============================================================
/**
 * 转换为大写形式
 * eg: <p>${name | upper}</p>
 */
export class UpperValueConverter {
    toView(value) {
        return value && value.toUpperCase();
    }
}

/**
 * 转换为小写形式
 * eg: <p>${name | lower}</p>
 */
export class LowerValueConverter {
    toView(value) {
        return value && value.toLowerCase();
    }
}

/**
 * 时间格式化值转换器, using as: 4234234234 | dateFormat
 * doc: https://www.npmjs.com/package/jquery-format
 */
export class DateValueConverter {
    toView(value, format = 'yyyy-MM-dd hh:mm:ss') {
        return _.isInteger(_.toNumber(value)) ? $.format.date(new Date(value), format) : (value ? value : '');
    }
}

/**
 * 数值格式化值转换器, using as: 4234234234 | numberFormat
 * doc: https://www.npmjs.com/package/jquery-format
 */
export class NumberValueConverter {
    toView(value, format = '#,##0.00') {
        return _.isNumber(_.toNumber(value)) ? $.format.number(value, format) : (value ? value : '');
    }
}

/**
 * 日期timeago值转换器
 * doc: 
 * https://www.npmjs.com/package/better-timeago
 * https://www.npmjs.com/package/better-timeago-locale-zh-cn
 */
export class TimeagoValueConverter {
    toView(value) {
        return value ? tg.format(value, 'zh_CN') : '';
    }
}

/**
 * markdown内容解析处理
 */
export class ParseMdValueConverter {
    toView(value) {
        return value ? marked(utils.preParse(value)) : '';
    }
}

export class SortValueConverter {
    toView(value, prop, reverse = false) {
        return _.isArray(value) ? (!reverse ? _.sortBy(value, prop) : _.reverse(_.sortBy(value, prop))) : value;
    }
}

export class SortTodoValueConverter {
    toView(value) {
        if (_.isArray(value)) {
            let sorts = _.reverse(_.sortBy(_.filter(value, { sortIndex: 1 }), 'updateDate'));
            let unSorts = _.reverse(_.sortBy(_.reject(value, { sortIndex: 1 }), 'id'));
            return [...sorts, ...unSorts];
        }
        return value;
    }
}

export class TakeValueConverter {
    toView(value, count, tail = false) {
        return _.isArray(value) ? (!tail ? _.take(value, count) : _.takeRight(value, count)) : value;
    }
}

export class SortUsersValueConverter {
    toView(value, username) {
        if (_.isArray(value) && username) {
            let user = _.find(value, { username: username });
            if (user) {
                return [user, ..._.reject(value, { username: username })];
            }
        }
        return value;
    }
}

export class SortUsernamesValueConverter {
    toView(value, username) {
        if (_.isArray(value) && username) {
            if (_.includes(value, username)) {
                return [username, ..._.without(value, username)];
            }
        }
        return value;
    }
}

export class SortChannelsValueConverter {
    toView(value) {
        if (_.isArray(value)) {
            let channelAll = _.find(value, { name: 'all' });
            if (channelAll) {
                return [channelAll, ..._.reject(value, { name: 'all' })]
            }
        }
        return value;
    }
}

export class UserNameValueConverter {
    toView(value) {
        let user = _.find(window.tmsUsers, { username: value });
        if (user) {
            return user.name;
        }
        return value;
    }
}

export class EmojiValueConverter {
    toView(value, mkbodyDom) {
        if (emojify) {
            _.defer(() => {
                emojify.run(mkbodyDom);
            });
        }
        return value;
    }
}

export class EmojiReplValueConverter {
    toView(value) {
        return emojify.replace(value);
    }
}

export class ChatLabelExistValueConverter {
    toView(chatLabels, type) {
        if (chatLabels && chatLabels.length != 0) {
            if (_.some(chatLabels, cl => (type ? cl.type == type : true) && cl.voters.length != 0)) {
                return '';
            }
        }
        return 'none';
    }
}

export class ChatLabelTipValueConverter {
    toView(chatLabel) {
        let vs = _.map(chatLabel.voters, v => v.name ? v.name : v.username);
        return `${_.join(vs, ',')}${vs.length}人${chatLabel.type == 'Emoji' ? '表示了' : '标记了'} [${chatLabel.type == 'Emoji' ? chatLabel.description : chatLabel.name}]`
    }
}

export class ChatLabelFilterValueConverter {
    toView(chatLabels, type = 'Emoji') {
        return _.filter(chatLabels, { type: type });
    }
}

export class FilterValueConverter {
    toView(items, search, prop = null) {
        return _.filter(items, (item) => {
            if (!prop) {
                return _.includes(item, search);
            } else {
                return _.includes(item[prop], search);
            }
        });
    }
}

export class CountValueConverter {
    toView(items, search, prop = null) {
        return _.size(_.filter(items, (item) => {
            if (!prop) {
                return _.includes(item, search);
            } else {
                return _.includes(item[prop], search);
            }
        }));
    }
}

export class LabelColorValueConverter {

    toView(chatLabel) {
        let tag = _.find(tags, { value: chatLabel.name });
        return tag ? tag.color : '';
    }
}

export class LabelCssValueConverter {

    toView(chatLabel) {
        let cs = colorHash.rgb(chatLabel.name);
        let bgColor = `rgba(${cs[0]}, ${cs[1]}, ${cs[2]}, 0.6)`;
        let color = `rgba(${255 - cs[0]}, ${255 - cs[1]}, ${255 - cs[2]}, 1)`;

        let tag = _.find(tags, { value: chatLabel.name });
        return !tag ? { "background-color": bgColor, "color": color } : '';
    }
}

export class Nl2brValueConverter {
    toView(value) {
        if (value) {
            return _.replace(value, /\n/g, '<br/>');
        }
        return value;
    }
}

export class DiffHtmlValueConverter {
    toView(value, allowedTags, allowedAttributes) {
        if (value) {
            return utils.diffHtml(value);
        }
        return value;
    }
}

export class UaValueConverter {
    toView(value) {
        if (value) {

            var ua = new UA(value);
            let type = ua.device.type;
            if (type === 'mobile') {
                return 'mobile';
            } else if (type === 'tablet') {
                return 'tablet';
            } else if (type === 'desktop') {
                return 'laptop';
            }
        }
        return 'laptop';
    }
}

export class Ua2ValueConverter {
    toView(value) {

        let s = '';
        if (value) {

            var ua = new UA(value);
            let type = ua.device.type;
            if (type === 'mobile') {
                s = `手机`;
            } else if (type === 'tablet') {
                s = '平板';
            } else if (type === 'desktop') {
                s = '电脑';
            }
        }
        return `${s} (${ua.device.manufacturer ? ua.device.manufacturer + ' ' : ''}${ua.device.model ? ua.device.model + ' ' : ''}${ua.os.name} ${ua.browser.name}[${ua.engine.name}])`;
    }
}
