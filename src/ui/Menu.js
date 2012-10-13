
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global G:false, $:false, Proto:false */

var Menu = (function() {
    'use strict';
    var menuTmpl = '<div class="seditor-menu">\
                        <a href="#" tabindex="0" hidefocus="true" class="seditor-menu-focus">&nbsp;</a>\
                        <ul class="gui-menu-list">\
                        </ul>\
                    </div>',
        /**
         * Menu
         *
         * @param {string} container
         * @param {object} option
         */
        Klass = Proto.$extend(function(supr, container, done, option) {
            this.$menu = $(menuTmpl);
            this.done = done;
            this._data = [];
            this._$content = this.$menu.children(':eq(1)');
            this._option = option;
            this._selected = -1;
            $(container).append(this.$menu);
            this._bindEvent();
        });

    Klass.$methods('_bindEvent', function(supr) {
        var self = this;
        self.$menu
            .delegate('li', 'mouseenter', function() {
                var n = self._$list.index(this);
                if (self._selected === n) {
                    return;
                }
                self.select(n);
            })
            .delegate('li', 'click', function() {
                var n = self._$list.index(this);
                self._selected = n;
                self.done();
            })
            .mouseleave(function() {
                self.select(-1);
            });

        // focus link
        var $focus = self.$menu.children('a');
        $focus.keydown(function(e) {
            e.preventDefault();
            switch(e.which) {
                // enter
                case 13:
                    self.done();
                    break;
                // esc
                case 27:
                    self.hide();
                    break;
                // down
                case 40:
                    self.down();
                    break;
                // up
                case 38:
                    self.up();
                    break;
            }
        }).focus(function() {
            self.show();
            if (self._selected === -1) {
                self.select(0);
            }
        });
    });

    Klass.$methods('_update', function(supr) {
        var html = [],
            tmpl = this._option.tmpl,
            i, l;
        for (i=0,l=this._data.length; i<l; i++) {
            html.push('<li>');
            html.push(tmpl ? tmpl(this._data[i]) : this.list[i]);
            html.push('</li>');
        }
        this._$content.html(html.join(''));
        this._$list = this._$content.children();
        // reset select
        this.select(this._selected);
    });

    Klass.$methods('data', function(supr, data) {
        if (data == null) {
            return this._data;
        } else {
            this._data = data;
            this._update();
            return this;
        }
    });

    Klass.$methods('select', function(supr, num) {
        if (num == null) {
            return this._data[this._selected];
        }
        if (num < -1 || num >= this._data.length) {
            num = -1;
        }
        this._selected = num;
        this._$list.removeClass('selected');
        if (this._selected !== -1) {
            $(this._$list[this._selected]).addClass('selected');
        }
        return this;
    });

    Klass.$methods('done', function(supr) {
        if (this._doneCallBack) {
            this._doneCallBack.call(this, this._data[this._selected], this._selected);
        }
        return this;
    });

    Klass.$methods('remove', function() {
        if (this.$menu) {
            this.$menu.remove();
        }
        this.$menu = null;
        this._$content = null;
        this._$list = null;
        this._option = null;
        this._data = null;
        this._doneCallBack = null;
    });

    Klass.$methods('show', function() {
        this.$menu.show();
        return this;
    });

    Klass.$methods('hide', function() {
        this.$menu.hide();
        return this;
    });

    return Klass;
})();
