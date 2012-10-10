

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Event:true, $:false */

var SEditor = (function() {
    'use strict';
    //@import "core/Proto.js";
    //@import "core/Util.js";
    //@import "core/Event.js";

    var UUID = 0,
        Klass = Event.$extend(function(selector, option) {
            this.$text = $(selector);
            this.option = option || {};
            this._loadHtml();
            this._loadAllPlugin();
        });

    Klass.$methods('remove', function(supr) {
        this.fire('seditorRemove');
        this.$text = null;
        this.$view = null;
        this.$all = null;
        this.$links = null;
        this.option = null;
    });

    Klass.$methods('_loadHtml', function(supr) {
        this._UUID();
        var wrapHtml = this.option.wraphtml || '<div id="{id}" class="gui-seditor"></div>',
            viewHtml = this.option.viewHtml || '<div class="gui-seditor-view"></div>',
            linkHtml = this.option.linkHtml || '<div class="gui-seditor-links"></div>';
        this.$text.wrap(wrapHtml);
        this.$all = this.$text.parent();
        this.$links = $(viewHtml);
        this.$text.before(this.$links);
        this.$view = $(viewHtml);
        this.$text.after(this.$view);
        this.$text.change(function() {
            
        });
    });

    Klass.$methods('_UUID', function(supr) {
        this.id = 'seditor' + (UUID++);
        return this;
    });

    Klass.$methods('_loadAllPlugin', function(supr) {
        var plugins = this.constructor.plugins,
            pluginsOrder = this.constructor.pluginsOrder,
            i, l, plugin, name;
        for (i=0,l=pluginsOrder.length; i<l; i++) {
            name = pluginsOrder[i];
            plugin = plugins[name];
            this._loadPlugin(plugin);
        }
    });

    Klass.$methods('_loadPlugin', function(supr, plugin) {
        plugin.init(this, this.option);
    });

    Klass.$statics('usePlugin', function(supr, name, plugin) {
        if (!this.plugins) {
            this.plugins = {};
            this.pluginsOrder = [];
        }
        this.plugins[name] = plugin;
        this.pluginsOrder.push(name);
        return this;
    });

    Klass.$statics('removePlugin', function(supr, name) {
        if (this.plugins) {
            delete this.plugins[name];
        }
        return this;
    });

    return Klass;
})();

