

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
        this.UBB.addTag(name, plugin.parser);
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
        this.$text.focus();
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

    Klass.$methods('remove', function(supr) {
        // fire event for plugins
        this.fire('seditorRemove', this);
        // reset html
        this.$text.detach();
        this.$all.replaceWith(this.$text);
        // release
        this.$text = null;
        this.$view = null;
        this.$all = null;
        this.$links = null;
        this.option = null;
        this.parser = null;
        this.textApi = null;
    });

    Klass.$methods('_loadHtml', function(supr) {
        var self = this,
            wrapHtml, viewHtml, linkHtml;
        self._UUID();
        // load html
        wrapHtml = self.option.wrapHtml || '<div id="{v}" class="gui-seditor"></div>',
        viewHtml = self.option.viewHtml || '<div class="gui-seditor-view"></div>',
        linkHtml = self.option.linkHtml || '<div class="gui-seditor-links"></div>';
        self.$text.wrap(Util.format(wrapHtml, self.id));
        self.$all = self.$text.parent();
        self.$links = $(viewHtml);
        self.$text.before(self.$links);
        self.$view = $(viewHtml);
        self.$text.after(self.$view);
        // bind events
        self.$links.delegate('a[data-operation]', 'click', function(e) {
            var $this = $(this),
                pluginName = $this.data('operation').slice(7),
                plugin = self.constructor.plugins[pluginName];
            if (plugin && plugin.click) {
                plugin.click.call(this, self, e);
            }
        });
        self._bindTextChangeEvent();
        self.on('seditorChange', function() {
            this._changeView();
        }, self);
    });

    Klass.$methods('_bindTextChangeEvent', function() {
        var self = this,
            fireChange = Util.buffer(function() {
                self.fire('seditorChange', self);
            }, self.option.changeTimeout || 250);

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

    Klass.$methods('_changeView', function() {
        // TODO use start & end
        this.$view.html(this.parser.UBBtoHTML(this.val()));
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

//@import "plugin/bold.js";
//@import "plugin/italic.js";

