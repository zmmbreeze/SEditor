
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false, Util:false */


/**
 * plugin for preview UBB
 * add options:
 *      {
 *          viewHtml: '<div class="seditor-view"></div>',
 *          viewWhenFocus: false,
 *          viewWidth: self.$text.width()
 *      }
 */
SEditor.usePlugin('preview', function() {
    'use strict';
    var showSign = false,
        hideSign = false,
        plugin;

    function updatePreview(editor) {
        if (editor.isPreviewing) {
            editor.$view.html(editor.parser.UBBtoHTML(editor.val()));
        }
    }

    function updateHeight(editor) {
        var $view = editor.$view,
            otherHeight = $view.outerHeight() - $view.height();
        $view.height(editor.$text.outerHeight() - otherHeight);
    }


    function updateWidth(editor, width) {
        if (editor.isFullscreen) {
            var $text = editor.$text,
                $view = editor.$view,
                useableWidth = width - Util.cssToPx($text, ['padding-left', 'border-left-width', 'border-right-width']),
                textWidth = useableWidth / 2;
            $text
                .css('padding-right', textWidth)
                .width(textWidth);
            $view
                .width(textWidth - Util.cssToPx($view, ['padding-left', 'padding-right', 'border-left-width', 'border-right-width']))
                .css({
                    'left': getViewLeft(editor),
                    'z-index': 3
                });
        }
    }

    function getViewLeft(editor) {
        var left,
            $text = editor.$text;

        if (editor.isFullscreen) {
            left = Util.cssToPx($text, ['padding-left', 'margin-left', 'border-left-width']) + $text.width();
        } else {
            left = $text.outerWidth();
        }
        return left;
    }

    function showPreview(editor) {
        if (showSign === true) {
            return;
        }
        showSign = true;
        editor.isPreviewing = true;

        var left = getViewLeft(editor),
            $view = editor.$view;

        // show view
        $view.show();
        updateHeight(editor);
        updatePreview(editor);
        $view.css('left', left);
        // update button
        changeButtonState(plugin.$button, true, SEditor.i18n.unpreview);
        showSign = false;
    }

    function hidePreview(editor) {
        if (hideSign === true) {
            return;
        }
        hideSign = true;
        editor.isPreviewing = false;

        // hide menu
        editor.$view
            .hide()
            .css('left', 0);
        // update button
        changeButtonState(plugin.$button, false, SEditor.i18n.preview);
        hideSign = false;
    }

    function changeButtonState($button, useCurrent, title) {
        if ($button) {
            $button
                [useCurrent ? 'addClass' : 'removeClass']('current')
                .text(title)
                .attr('title', title);
        }
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
                    .css('width', option.viewWidth || 400),
                $win = $(window);
            $text.after(editor.$view);

            // bind events
            editor.on('textChange', updatePreview, editor);

            editor.on('heightChange', function(height, textHeight) {
                updateHeight(editor);
            });

            editor.on('widthChange', function(width, textWidth) {
                updateWidth(editor, width);
            });

            editor.on('enterFullscreen', function() {
                updateWidth(editor, $win.width());
            });

            editor.on('leaveFullscreen', function() {
                
            });

            // setup viewWhenFocus
            //      default is true
            if (!option.viewWhenFocus) {
                $text.focus(function() {
                    showPreview(editor);
                });
            }
        },
        click: function(editor) {
            // this is dom
            if (editor.isPreviewing) {
                hidePreview(editor, $(this));
            } else {
                showPreview(editor, $(this));
            }
        }
    };

    return plugin;
});

