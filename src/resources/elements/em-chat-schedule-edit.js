import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChatScheduleEdit {

    @bindable loginUser;

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

    attached() {
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

    show(calEvent) {
        this.event = _.clone(calEvent);
        $(this.popopRef).popup({
        	jitter: 200,
            position: 'bottom center',
            target: '.tms-schedule-edit-target',
        }).popup('show');
    }

    showHandler() {

        this.users = window.tmsUsers;
        _.defer(() => {
            if (this.event.start) {
                $(this.startRef).calendar('set date', this.event.start.toDate());
            } else {
                $(this.startRef).calendar('clear');
            }

            if (this.event.end) {
                $(this.endRef).calendar('set date', this.event.end.toDate());
            } else {
                $(this.endRef).calendar('clear');
            }
        });


    }

    approveHandler() {

    }
}
