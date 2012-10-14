
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false */

SEditor.usePlugin(
    'color',
    function() {
        var menuHtml = '<a class="seditor-menu-color" style="background:{value};" href="javascript:void 0;" title="{title}" data-color="{value}">{title}</a>';
        return {
            title: SEditor.i18n.color,
            hasButton: true,
            menu: [
                {value: 'blue', title: SEditor.i18n.blue},
                {value: 'red', title: SEditor.i18n.red},
                {value: 'yellow', title: SEditor.i18n.yellow},
                {value: 'green', title: SEditor.i18n.green}
            ],
            menuTmpl: function(data, index) {
                return SEditor.Util.format(menuHtml, data);
            },
            click: function(editor, menuData) {
                // this is dom
                var color = $(this).children('a').data('color');
                editor.textApi.surroundSelectedText('[color=' + color + ']', '[/color]');
                editor.fire('seditorChange');
                editor.buttonMenu.hide();
            }
        };
    },
    // [option] ubb tag parser
    {
        parseUBB: function(node, sonString, setting) {
            if (node.attr) {
                return '<span style="color:' + node.attr.slice(1) + ';">' + sonString + '</span>';
            } else {
                return sonString;
            }
        },
        canContains: 'bold,italic,color,font,url,image',
        canWrap: 0,
        isBlock: 0
    });
