
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false, Util:false */


/**
 * plugin for preview UBB
 * add options:
 *      {
 *          viewHtml: '<div class="seditor-view"></div>',
 *          viewWhenFirstFocus: false,
 *          viewWidth: self.$text.width(),
 *          selectionClass: 'selection',
 *          selectionSingleClass: 'selection-single',
 *      }
 */
SEditor.usePlugin('preview', function() {
    'use strict';
    var showSign = false,
        hideSign = false,
        originalWidth,
        plugin,
        $win = $(window);

    function updatePreview(editor) {
        if (editor.isPreviewing) {
            editor.$view.html(editor.parser.UBBtoHTML(editor.val(), editor.textApi.selection));
            editor.fire('previewUpdate', editor.$view);
            var option = editor.option,
                $selections = $('.' + option.selectionClass),
                num = $selections.length;
            switch(num) {
            case 1:
                if ($selections.text() === '') {
                    $selections.addClass(option.selectionSingleClass);
                }
                break;
            case 0:
                break;
            default:
                $selections.removeClass(option.selectionSingleClass);
                break;
            }
        }
    }

    function updatePreviewPos(editor, width) {
        var left = editor.$text.outerWidth();
        if (editor.isPreviewing) {
            editor.$view
                .css('left', left)
                .width(width);
        } else {
            editor.$view
                .hide()
                .css('left', 0);
        }
    }

    function updateHeight(editor) {
        var $view = editor.$view,
            otherHeight = $view.outerHeight() - $view.height();
        $view.height(editor.$text.outerHeight() - otherHeight);
    }

    function updateWidth(editor, width) {
        if (editor.isPreviewing) {
            var $text = editor.$text,
                $view = editor.$view;
            if (editor.isFullscreen) {
                var useableWidth = width / 2,
                    textWidth = useableWidth - ($text.outerWidth() - $text.width()),
                    viewWidth = useableWidth - ($view.outerWidth() - $view.width());
                $text.width(textWidth);
                updatePreviewPos(editor, viewWidth);
            } else {
                updatePreviewPos(editor, originalWidth);
            }
        }
    }

    function showPreview(editor) {
        if (editor.isPreviewing) {
            return;
        }
        editor.isPreviewing = true;

        // show view
        editor.$view.show();
        updateHeight(editor);
        updatePreview(editor);
        updateWidth(editor, $win.width());
        // update button
        changeButtonState(plugin.$button, true, SEditor.i18n.unpreview);
    }

    function hidePreview(editor) {
        if (!editor.isPreviewing) {
            return;
        }
        editor.isPreviewing = false;

        if (editor.isFullscreen) {
            editor.width($win.width());
        }
        updatePreviewPos(editor);
        // update button
        changeButtonState(plugin.$button, false, SEditor.i18n.preview);
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
            option.selectionClass = option.selectionClass || 'selection';
            option.selectionSingleClass = option.selectionSingleClass || 'selection-single';
            // wrap textarea & setup z-index
            editor.$text
                // data-preview for mark
                .wrap('<div style="position:relative;" data-preview-wrap="true"></div>')
                .css({
                    position: 'relative',
                    zIndex: 2
                });
            originalWidth = option.viewWidth || 400;

            // setup view div
            var viewHtml = editor.option.viewHtml || '<div class="seditor-view"><div></div></div>',
                $text = editor.$text,
                $view = editor.$view = $(viewHtml)
                    .css('width', originalWidth);
            $text.after(editor.$view);

            // bind events
            editor.textApi.detectSelectionChangeEvent();
            editor.on('remove', function() {
                this.textApi.cancelSelectionChangeEvent();
            }, editor);
            editor.on('selectionChange', function() {
                updatePreview(this);
            }, editor);

            editor.on('heightChange', function(height, textHeight) {
                updateHeight(editor);
            });

            editor.on('widthChange', function(width, textWidth) {
                updateWidth(editor, width);
            });

            // setup viewWhenFirstFocus
            //      default is true
            if (!option.viewWhenFirstFocus) {
                $text.one('focus', function() {
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

