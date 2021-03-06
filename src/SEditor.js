

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Event:true, $:false, TextApi:false, UBB:false, Util:false, Menu:false */

var SEditor = (function() {
    'use strict';
    //@import "core/UBB.js";
    //@import "core/TextApi.js";
    //@import "core/Proto.js";
    //@import "core/Util.js";
    //@import "core/Event.js";
    //@import "ui/Menu.js";

    var UUID = 0,
        /**
         * new SEditor();
         *
         * @param {string} selector textarea's jquery selector
         * @param {object} option
         *                      changeTimeout
         *                      wrapHtml => '<div id="{v}" class="seditor"></div>'
         *                      buttonsHtml => '<div class="seditor-buttons"></div>'
         *                      tipHtml => '<div class="seditor-tip"></div>'
         *                      width   => default is parent's width
         *                      selectionPrefix => default is '<span class="selection">'
         *                      selectionSuffix => default is '</span>'
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
            this.parser = new this.constructor.UBB({
                selectionPrefix: this.option.selectionPrefix || '<span class="selection">',
                selectionSuffix: this.option.selectionSuffix || '</span>'
            });
            this.textApi = new TextApi(this.$text[0], this);
            this._loadAllPlugin();
        });

    Klass.UBB = UBB;
    Klass.Util = Util;
    Klass.Menu = Menu;

    Klass.$statics('usePlugin', function(supr, name, plugin, parser) {
        if (!this.plugins) {
            this.plugins = {};
            this.pluginsOrder = [];
        }
        this.plugins[name] = plugin;
        this.pluginsOrder.push(name);
        if (parser) {
            this.UBB.addTag(name, parser);
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
            return this.$text.outerWidth();
        } else {
            var $text = this.$text,
                $buttons = this.$buttons,
                $tip = this.$tip,
                textWidth = width - ($text.outerWidth() - $text.width());
            // calculate (outerWidth - width) first
            $buttons.width(width - ($buttons.outerWidth() - $buttons.width()));
            $text.width(textWidth);
            $tip.width(width - ($tip.outerWidth() - $tip.width()));
            // fire event
            this.fire('widthChange', width, textWidth);
            return this;
        }
    });

    Klass.$methods('height', function(supr, height) {
        if (height == null) {
            return this.$all.height();
        } else {
            var otherHeight = this.$all.height() - this.$text.height(),
                textHeight = height - otherHeight;
            this.$text.height(textHeight);
            // fire event
            this.fire('heightChange', height, textHeight);
            return this;
        }
    });

    Klass.$methods('tip', function(supr, tipMsg, clickCallBack) {
        if (tipMsg) {
            var self = this;
            self.$tip.html(tipMsg);
            self.$tip.unbind('click.seditor');
            if (clickCallBack) {
                self.$tip.one('click.seditor', function(e) {
                    clickCallBack.call(this, self, e);
                    self.$tip.html('');
                });
            }
            return this;
        } else {
            return this.$tip.html();
        }
    });

    Klass.$methods('remove', function(supr) {
        // fire event for plugins
        this.fire('remove', this);
        // reset html
        this.$text.detach();
        this.$all.replaceWith(this.$text);
        if (this._recover.resize !== 'none') {
            this.$text.css('resize', this._recover.resize);
        }
        // release menu
        if (this.buttonMenu) {
            this.buttonMenu.remove();
        }
        // release
        this.$text = null;
        this.$view = null;
        this.$all = null;
        this.$buttons = null;
        this.option = null;
        this.parser = null;
        this.textApi = null;
        this._recover = null;
        this.buttonMenu = null;
    });

    Klass.$methods('_loadHtml', function(supr) {
        var self = this,
            option = self.option,
            wrapHtml, buttonsHtml, tipHtml, w;
        self._UUID();

        // load html
        wrapHtml = option.wrapHtml || '<div id="{v}" class="seditor"></div>',
        buttonsHtml = option.buttonsHtml || '<div class="seditor-buttons"></div>';
        tipHtml = option.tipHtml || '<div class="seditor-tip"></div>';
        self.$text.wrap(Util.format(wrapHtml, self.id));
        self.$all = self.$text.parent();
        self.$all.css('position', 'relative');
        self.$buttons = $(buttonsHtml);
        self.$text.before(self.$buttons);
        self.$tip = $(tipHtml);
        self.$tip.appendTo(self.$all);
        // wrap textarea & setup z-index
        self.$text
            // data-preview for mark
            .wrap('<div style="position:relative;" data-preview-wrap="true"></div>')
            .css({
                position: 'relative',
                zIndex: 2
            });

        // setup width
        w = option.width || self.$all.parent().width();
        self.width(w);

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
                self.fire('textChange', self);
            }, self.option.changeTimeout || 250);   // default change timeout is 250

        // bind link events
        self.$buttons.delegate('a[data-operation]', 'click', function(e) {
            var $this = $(this),
                pluginName = $this.data('operation').slice(7),
                plugin = self.plugins[pluginName];
            if (plugin && plugin.click) {
                if (plugin.menu) {
                    var buttonPos = $this.position(),
                        buttonHeight = $this.height();
                    self.buttonMenu.$menu
                        .css({
                            top: buttonPos.top,
                            left: buttonPos.left
                        });
                    self.buttonMenu
                        .setMenuTmpl(plugin.menuTmpl)
                        .data(plugin.menu)
                        .update()
                        .focus()
                        .done(function(data, index) {
                            plugin.click.call(this, self, data, index);
                        });
                } else {
                    plugin.click.call(this, self);
                }
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
            this.plugins = {};
            for (i=0,l=pluginsOrder.length; i<l; i++) {
                name = pluginsOrder[i];
                plugin = plugins[name];
                this._loadPlugin(name, plugin);
            }
        }
    });

    Klass.$methods('_initButtonMenu', function(supr) {
        var self = this;
        if (self._initedButtonMenu) {
            return;
        }
        self._initedButtonMenu = true;
        self.$buttons.css({
            'position': 'relative',
            'z-index': '9999'
        });
        self.buttonMenu = new Menu(this.$buttons);
        // setup hide
        self.$all.click(function(e) {
            if (!$.contains(self.$buttons[0], e.target)) {
                self.buttonMenu.hide();
            }
        });
    });

    Klass.$methods('_loadPlugin', function(supr, name, plugin) {
        // generate plugin
        var p = plugin();

        // call init function
        if (p.init) {
            p.init.call(this, this, this.option);
        }

        // setup button
        if (p.hasButton) {
            var buttonHtml = '<a href="javascript:void 0;" title="{title}" data-operation="seditor{name}" class="seditor-buttons-{name}">{title}</a>',
                $button;
            buttonHtml = Util.format(buttonHtml, {name: name, title: p.title});
            $button = $(buttonHtml);
            this.$buttons.append($button);
            p.$button = $button;

            // setup menu
            if (p.menu) {
                this._initButtonMenu();
            }
        }

        // set this.plugins
        this.plugins[name] = p;
    });

    return Klass;
})();

//@import "i18n/zh_CN.js";
//@import "plugin/bold.js";
//@import "plugin/italic.js";
//@import "plugin/font.js";
//@import "plugin/color.js";
//@import "plugin/ul.js";
//@import "plugin/ol.js";
//@import "plugin/autoComplete.js";
//@import "plugin/preview.js";
//@import "plugin/fullscreen.js";

