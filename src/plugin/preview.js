
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false */


/**
 * plugin for preview UBB
 * add options:
 *      {
 *          viewHtml: '<div class="seditor-view"></div>',
 *          viewWhenFocus: false,
 *          viewWidth: self.$text.width()
 *      }
 *
 *
 *
 *
 */
SEditor.usePlugin('preview', function() {
    var showSign = false,
        hideSign = false,
        plugin;

    function showPreview(editor) {
        if (showSign === true) {
            return;
        }
        showSign = true;

        // prevent frequce call
        setTimeout(function() {
            if (hideSign) {
                return;
            }
            editor.isPreviewing = true;
            editor.fire('seditorChange');
            editor.$view
                .show()
                .animate({left: editor.$text.outerWidth()}, 250, function() {
                    plugin.$button
                        .addClass('current')
                        .text(SEditor.i18n.unpreview);
                    showSign = false;
                });
        }, 100);
    }

    function hidePreview(editor) {
        if (hideSign === true) {
            return;
        }
        hideSign = true;

        setTimeout(function() {
            if (hideSign) {
                return;
            }
            editor.isPreviewing = false;
            editor.$view
                .hide()
                .animate({left: 0}, 250, function() {
                    plugin.$button
                        .removeClass('current')
                        .text(SEditor.i18n.preview);
                    hideSign = false;
                });
        }, 100);
    }

    plugin = {
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
            var viewHtml = editor.option.viewHtml || '<div class="seditor-view"><div></div></div>',
                $text = editor.$text,
                $view = editor.$view = $(viewHtml)
                    .css({
                        fontSize: $text.css('font-size'),
                        lineHeight: $text.css('line-height'),
                        height: $text.height(),
                        width: option.viewWidth || 400
                    });
            $text.after(editor.$view);

            // bind events
            editor.on('seditorChange', function() {
                // TODO use start & end
                if (this.isPreviewing) {
                    $view.html(this.parser.UBBtoHTML(this.val()));
                }
            }, editor);

            editor.on('seditorHeightChange', function(height) {
                if (this.isPreviewing) {
                    this.$view.height(height);
                }
            }, editor);

            // setup viewWhenFocus
            if (option.viewWhenFocus) {
                $text
                    .focus(function() {
                        showPreview(editor);
                    })
                    .blur(function() {
                        hidePreview(editor);
                    });
            }
        },
        click: function(editor, event) {
            // this is dom
            event.preventDefault();
            if (editor.isPreviewing) {
                hidePreview(editor, $(this));
            } else {
                showPreview(editor, $(this));
            }
        }
    };

    return plugin;
});

