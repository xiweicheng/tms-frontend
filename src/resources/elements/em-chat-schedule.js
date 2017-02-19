import { bindable, containerless } from 'aurelia-framework';
import {
    default as moment
} from 'moment';
import 'fullcalendar';
import 'fullcalendar/dist/locale/zh-cn';

@containerless
export class EmChatSchedule {

    @bindable loginUser;

    show() {
        this.users = window.tmsUsers;
        _.defer(() => {
            $(this.scheduleRef).fullCalendar('today');
            // $(this.scheduleRef).fullCalendar('changeView', 'agendaWeek');
        });
    }

    /**
     * 构造函数
     */
    constructor() {
        this.actorsOpts = {
            onAdd: (addedValue, addedText, $addedChoice) => {},
            onLabelRemove: (removedValue) => {
                if (this.loginUser.username == removedValue) {
                    return false;
                }
            }
        };
    }

    _fetchEvents() {
        var todayDate = moment().startOf('day');
        var YM = todayDate.format('YYYY-MM');
        var YESTERDAY = todayDate.clone().subtract(1, 'day').format('YYYY-MM-DD');
        var TODAY = todayDate.format('YYYY-MM-DD');
        var TOMORROW = todayDate.clone().add(1, 'day').format('YYYY-MM-DD');

        this.events = [{
            title: 'All Day Event',
            start: YM + '-01'
        }, {
            title: 'Long Event',
            start: YM + '-07',
            end: YM + '-10'
        }, {
            id: 999,
            title: 'Repeating Event',
            start: YM + '-09T16:00:00'
        }, {
            id: 999,
            title: 'Repeating Event',
            start: YM + '-16T16:00:00'
        }, {
            title: 'Conference',
            start: YESTERDAY,
            end: TOMORROW
        }, {
            title: 'Meeting',
            start: TODAY + 'T10:30:00',
            end: TODAY + 'T12:30:00'
        }, {
            title: 'Lunch',
            start: TODAY + 'T12:00:00'
        }, {
            title: 'Meeting',
            start: TODAY + 'T14:30:00'
        }, {
            title: 'Happy Hour',
            start: TODAY + 'T17:30:00'
        }, {
            title: 'Dinner',
            start: TODAY + 'T20:00:00'
        }, {
            title: 'Birthday Party',
            start: TOMORROW + 'T07:00:00'
        }, {
            title: 'Click for Google',
            url: 'http://google.com/',
            start: YM + '-28'
        }];
    }

    attached() {

        this._fetchEvents();

        $(this.scheduleRef).fullCalendar({
            header: {
                left: 'prev,next today',
                center: 'title',
                right: 'month,agendaWeek,agendaDay,listWeek'
            },
            height: $(window).height() - 60,
            defaultDate: new Date(),
            // defaultView: 'agendaWeek',
            editable: true,
            eventLimit: true, // allow "more" link when too many events
            navLinks: true,
            dayClick: function(date, jsEvent, view) {

                // alert('Clicked on: ' + date.format());

                // alert('Coordinates: ' + jsEvent.pageX + ',' + jsEvent.pageY);

                // alert('Current view: ' + view.name);

                // // change the day's background color just for fun
                // $(this).css('background-color', 'red');

            },
            eventClick: function(calEvent, jsEvent, view) {

                // alert('Event: ' + calEvent.title);
                // alert('Coordinates: ' + jsEvent.pageX + ',' + jsEvent.pageY);
                // alert('View: ' + view.name);

                // // change the border color just for fun
                // $(this).css('border-color', 'red');

            },
            eventMouseover: function(event, jsEvent, view) {},
            eventMouseout: function(event, jsEvent, view) {},
            events: this.events
        });

        $(this.addRef)
            .popup({
                on: 'click',
                inline: true,
                hoverable: true,
                silent: true,
                // movePopup: false,
                jitter: 300,
                position: 'bottom center',
                delay: {
                    show: 300,
                    hide: 300
                }
            });

        $(this.startRef).calendar({
            today: true,
            endCalendar: $(this.endRef)
        });
        $(this.endRef).calendar({
            today: true,
            startCalendar: $(this.startRef)
        });
    }

    initMembersUI(last) {
        if (last) {
            _.defer(() => {
                $(this.actorsRef).dropdown().dropdown('clear').dropdown('set selected', [this.loginUser.username]).dropdown(this.actorsOpts);
            });
        }
    }

    clearStartDateHandler() {
        $(this.startRef).calendar('clear');
    }

    clearEndDateHandler() {
        $(this.endRef).calendar('clear');
    }

    addHandler() {
        console.log({
            title: this.title,
            startDate: $(this.startRef).calendar('get date'),
            endDate: $(this.endRef).calendar('get date'),
            actors: $(this.actorsRef).dropdown('get value')
        });
        $.post('/admin/schedule/create', {
            title: this.title,
            startDate: $(this.startRef).calendar('get date'),
            endDate: $(this.endRef).calendar('get date'),
            actors: $(this.actorsRef).dropdown('get value')
        }, (data, textStatus, xhr) => {
            /*optional stuff to do after success */
        });
    }
}
