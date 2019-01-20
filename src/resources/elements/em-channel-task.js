import { bindable, containerless } from 'aurelia-framework';

@containerless
export class EmChannelTask {

    @bindable value;

    todo = {};
    doing = {};
    done = {};
    verified = {};
    cid = 3;
    size = 10;

    valueChanged(newValue, oldValue) {

    }

    async _getTasks(label, page) {
        let pageTask = {};
        await $.get('/admin/channel/task/listBy', {
            page: page,
            size: this.size,
            cid: this.cid,
            label: label
        }, (data) => {
            if (data.success) {
                pageTask = data.data;
            }
        });

        return pageTask;
    }

    _getTodo() {
        this._getTasks('待处理', 0).then(data => this.todo = data);
    }

    _getDoing() {
        this._getTasks('进行中', 0).then(data => this.doing = data);
    }

    _getDone() {
        this._getTasks('已完成', 0).then(data => this.done = data);
    }

    _getVerified() {
        this._getTasks('已验收', 0).then(data => this.verified = data);
    }

    bind(ctx) {

        this._getTodo();
        this._getDoing();
        this._getDone();
        this._getVerified();


    }

    attached() {
        dragula($(this.containerRef).find('.tms-dd-container').toArray(), {
            // isContainer: function(el) {
            //     return true; // only elements in drake.containers will be taken into account
            // },
            // moves: function(el, source, handle, sibling) {
            //     return true; // elements are always draggable by default
            // },
            // accepts: function(el, target, source, sibling) {
            //     return true; // elements can be dropped in any of the `containers` by default
            // },
            // invalid: function(el, handle) {
            //     return false; // don't prevent any drags from initiating by default
            // },
            // direction: 'vertical', // Y axis is considered when determining where an element would be dropped
            // copy: false, // elements are moved by default, not copied
            // copySortSource: false, // elements in copy-source containers can be reordered
            // revertOnSpill: false, // spilling will put the element back where it was dragged from, if this is true
            // removeOnSpill: false, // spilling will `.remove` the element, if this is true
            // mirrorContainer: document.body, // set the element that gets mirror elements appended
            // ignoreInputTextSelection: true // allows users to select input text, see details below
        });
    }
}
