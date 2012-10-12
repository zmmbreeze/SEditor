
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false */


/**
 * plugin for preview UBB
 * add options:
 *      {
 *          viewHtml: '<div class="gui-seditor-view"></div>',
 *          viewWhenFocus: false,
 *      }
 *
 *
 *
 *
 */
SEditor.usePlugin('preview', {
    title: SEditor.i18n.preview,      // option
    hasButton: true,    // option
    init: function(editor, option) {
        // wrap textarea & setup z-index
        editor.$text
            // data-preview for mark
            .wrap('<div style="position:relative;float:left;" data-preview-wrap="true"></div>')
            .css({
                position: 'relative',
                zIndex: 2
            });
        // setup view div
        var viewHtml = editor.option.viewHtml || '<div class="gui-seditor-view"><div></div><span>&gt;</span></div>',
            $text = editor.$text,
            $viewContent;
        editor.$view = $(viewHtml)
            .css({
                fontSize: $text.css('font-size'),
                lineHeight: $text.css('line-height'),
                height: $text.outerHeight(),
                width: $text.outerWidth()
            });
        $viewContent = editor.$view.children(':first');
        $text.after(editor.$view);

        // bind events
        editor.on('seditorChange', function() {
            // TODO use start & end
            if (this.isPreviewing) {
                $viewContent.html(this.parser.UBBtoHTML(this.val()));
            }
        }, editor);

        editor.on('seditorHeightChange', function(height) {
            if (this.isPreviewing) {
                this.$view.height(height);
            }
        }, editor);

        editor.on('seditorWidthChange', function(width) {
            if (this.isPreviewing) {
                this.$view.css('left', width);
            }
        }, editor);
    },
    click: function(editor, event) {
        // this is dom
        event.preventDefault();
        var self = this;
        if (self.sign === true) {
            return;
        }
        self.sign = true;

        if (editor.isPreviewing) {
            editor.isPreviewing = false;
            editor.$view.animate({left: 0}, 100, function() {
                $(self)
                    .removeClass('current')
                    .text(SEditor.i18n.preview);
                self.sign = false;
            });
        } else {
            editor.isPreviewing = true;
            editor.fire('seditorChange');
            editor.$view.animate({left: editor.$text.outerWidth()}, 100, function() {
                $(self)
                    .addClass('current')
                    .text(SEditor.i18n.unpreview);
                self.sign = false;
            });
        }
    }
});
