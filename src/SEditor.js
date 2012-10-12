

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Event:true, $:false, TextApi:false, UBB:false, Util:false */

var SEditor = (function() {
    'use strict';
    //@import "core/UBB.js";
    //@import "core/TextApi.js";
    //@import "core/Proto.js";
    //@import "core/Util.js";
    //@import "core/Event.js";

    var UUID = 0,
        /**
         * new SEditor();
         *
         * @param {string} selector textarea's jquery selector
         * @param {object} option
         *                      changeTimeout
         *                      wrapHtml
         *                      viewHtml
         *                      linkHtml
         *
         */
        Klass = Event.$extend(function(supr, selector, option) {
            this.$text = $(selector);
            if (!this.$text[0]) {
                throw new Error('new SEditor(): Textarea not found.');
            }
            this.option = option || {};
            this._loadHtml();
            this._bindEvents();
            this._loadAllPlugin();
            this.parser = new this.constructor.UBB();
            this.textApi = new TextApi(this.$text[0]);
        });

    Klass.UBB = UBB;

    Klass.$statics('usePlugin', function(supr, name, plugin) {
        if (!this.plugins) {
            this.plugins = {};
            this.pluginsOrder = [];
        }
        this.plugins[name] = plugin;
        this.pluginsOrder.push(name);
        if (plugin.parser) {
            this.UBB.addTag(name, plugin.parser);
        }
        return this;
    });

    Klass.$statics('removePlugin', function(supr, name) {
        if (this.plugins) {
            delete this.plugins[name];
            var pluginsOrder = this.pluginsOrder;
            for (var i=0,l=pluginsOrder.length; i<l; i++) {
                if (pluginsOrder[i] === name) {
                    pluginsOrder.splice(i, 1);
                }
            }
            this.UBB.removeTag(name);
        }
        return this;
    });

    Klass.$methods('focus', function(supr) {
        this.textApi.insertCaret();
        return this;
    });

    Klass.$methods('val', function(supr, text) {
        if (text == null) {
            return this.parser.fixUBB(this.$text.val());
        } else {
            this.$text.val(text);
            return this;
        }
    });

    Klass.$methods('width', function(supr, width) {
        if (width == null) {
            return this.$text.width();
        } else {
            this.fire('seditorWidthChange', width);
            this.$text.width(width);
            return this;
        }
    });

    Klass.$methods('height', function(supr, height) {
        if (height == null) {
            return this.$text.height();
        } else {
            this.fire('seditorHeightChange', height);
            this.$text.height(height);
            return this;
        }
    });

    Klass.$methods('remove', function(supr) {
        // fire event for plugins
        this.fire('seditorRemove', this);
        // reset html
        this.$text.detach();
        this.$all.replaceWith(this.$text);
        if (this._recover.resize !== 'none') {
            this.$text.css('resize', this._recover.resize);
        }
        // release
        this.$text = null;
        this.$view = null;
        this.$all = null;
        this.$links = null;
        this.option = null;
        this.parser = null;
        this.textApi = null;
        this._recover = null;
    });

    Klass.$methods('_loadHtml', function(supr) {
        var self = this,
            option = self.option,
            wrapHtml, linkHtml;
        self._UUID();

        // load html
        wrapHtml = option.wrapHtml || '<div id="{v}" class="gui-seditor"></div>',
        linkHtml = option.linkHtml || '<div class="gui-seditor-links"></div>';
        self.$text.wrap(Util.format(wrapHtml, self.id));
        self.$all = self.$text.parent();
        self.$all.css('position', 'relative');
        self.$links = $(linkHtml);
        self.$text.before(self.$links);

        // change resize for textarea
        self._recover = {};
        self._recover.resize = self.$text.css('resize');
        if (self._recover.resize !== 'none') {
            self.$text.css('resize', 'none');
        }
    });

    Klass.$methods('_bindEvents', function() {
        var self = this,
            fireChange = Util.buffer(function() {
                self.fire('seditorChange', self);
            }, self.option.changeTimeout || 250);   // default change timeout is 250

        // bind link events
        self.$links.delegate('a[data-operation]', 'click', function(e) {
            var $this = $(this),
                pluginName = $this.data('operation').slice(7),
                plugin = self.constructor.plugins[pluginName];
            if (plugin && plugin.click) {
                plugin.click.call(this, self, e);
            }
        });

        // bind text change event
        if (window.addEventListener) {
            self.$text[0].addEventListener('input', fireChange, false);
        } else if (window.attachEvent) {
            self.$text[0].attachEvent('onpropertychange', function() {
                if (window.event.propertyName == 'value') {
                    fireChange();
                }
            });
        }
    });

    Klass.$methods('_UUID', function(supr) {
        this.id = 'seditor' + (UUID++);
    });

    Klass.$methods('_loadAllPlugin', function(supr) {
        var plugins = this.constructor.plugins,
            pluginsOrder = this.constructor.pluginsOrder,
            i, l, plugin, name;
        if (plugins && pluginsOrder) {
            for (i=0,l=pluginsOrder.length; i<l; i++) {
                name = pluginsOrder[i];
                plugin = plugins[name];
                this._loadPlugin(name, plugin);
            }
        }
    });

    Klass.$methods('_loadPlugin', function(supr, name, plugin) {
        if (plugin.hasButton) {
            var linkHtml = '<a href="javascript:void 0;" title="{title}" data-operation="seditor{name}" class="gui-seditor-links-{name}">{title}</a>';
            linkHtml = Util.format(linkHtml, {name: name, title: plugin.title});
            this.$links.append($(linkHtml));
        }
        plugin.init.call(this, this, this.option);
    });

    return Klass;
})();

//@import "i18n/zh_CN.js";
//@import "plugin/bold.js";
//@import "plugin/italic.js";
//@import "plugin/preview.js";

