// Global click handler
$(window).click(function (event) {
    
    var target = $(event.target);

    if (target.is(".app-array > *")) return ZenX.gotoApp(target.attr('data-module-namespace'));

    if (target.is(":not(.user-block .user-img)")) $('.user-menu').addClass('out');

    if (target.is(".zenx-window .window-head .x")) ZenX.closeWindow(target);

    if (target.is(".desktop,.dock")) {

        var circle = $('<div>');
        circle.addClass('circle').css({top:event.pageY,left:event.pageX});
        $('.desktop').append(circle);
        $('.x-focus').removeClass('x-focus');
        setTimeout(function () { circle.remove(); },1500);

    }

    if (target.is(".zenx-window .window-head .fs")) {

        if (target.parents(".zenx-window").hasClass('fs')) {

            target.parents(".zenx-window").removeClass('fs');
            target.parents(".zenx-window").animate({
                width:  target.parents(".zenx-window").css('min-width'),
                height: target.parents(".zenx-window").css('min-height'),
                top:    window.innerHeight / 2 - target.parents(".zenx-window").css('min-height').split('px')[0] / 2,
                left:   window.innerWidth  / 2 - target.parents(".zenx-window").css('min-width') .split('px')[0] / 2
            },500,'swing');

        } else {

            var win = target.parents('.zenx-window');

            win.animate({
                top: '10px',
                left: '10px',
                width: (window.innerWidth - 22) + 'px',
                height: (window.innerHeight - 100) + 'px'
            }, 300, 'swing').addClass('fs');

        }

    }

});

// Mousedown handler
$(window).bind("mousedown", function (event) {

    var target = $(event.target);

    if (target.is(".zenx-window:not(.x-focus) *")) {
        ZenX.focus(target.parents('.zenx-window'));
    }

    if (target.is(".zenx-window > .resizer")) {
        
        $('html').addClass('resizing');
        ZenX.RESIZING = target.parents('.zenx-window');
        ZenX.RESIZING_START = {
            x: event.pageX,
            y: event.pageY,
            eW: ZenX.RESIZING.width() + 2,
            eH: ZenX.RESIZING.height() + 2
        }

    }

    if (target.is(".zenx-window .window-head, .zenx-window .window-head .title")) {

        ZenX.DRAGGING = target.parents('.zenx-window');
        ZenX.DRAGGING_START = {
            x: event.pageX,
            y: event.pageY,
            eX: ZenX.DRAGGING.offset().left,
            eY: ZenX.DRAGGING.offset().top
        }

    }

});

// Mouseup handler
$(window).bind("mouseup", function () {
    
    ZenX.DRAGGING = null;
    ZenX.RESIZING = null;
    $('html.resizing').removeClass('resizing');

});

// Mousemove handler
$(window).bind("mousemove", function (e) {

    if (ZenX.DRAGGING) {

        var win = ZenX.DRAGGING,
            c = ZenX.DRAGGING_START,
            top = (+c.eY + (e.pageY - c.y)),
            left = (+c.eX + (e.pageX - c.x)),
            css = {
                top: top + 'px',
                left: left + 'px'
            };

        top < 0 && (css.top = '0px');
        left < 0 && (css.left = '0px');

        top + win.height() + 2 > window.innerHeight && (css.top = (window.innerHeight - win.height() - 2) + 'px');
        left + win.width() + 2 > window.innerWidth && (css.left = (window.innerWidth - win.width() - 2) + 'px');

        win.css(css);

    }

    if (ZenX.RESIZING) {

        var win = ZenX.RESIZING,
            c = ZenX.RESIZING_START,
            width = (+c.eW + (e.pageX - c.x)),
            height = (+c.eH + (e.pageY - c.y)),
            css = {
                width: width + 'px',
                height: height + 'px'
            };

        width + win.offset().left > window.innerWidth && (css.width = (window.innerWidth - win.offset().left) + 'px');
        height + win.offset().top > window.innerHeight && (css.height = (window.innerHeight - win.offset().top) + 'px');

        win.css(css).removeClass('fs');

    }

});



// To avoid overflow scrolling
$(document).bind('touchstart touchend touchmove', function (e) {
    e.preventDefault();
    e.stopPropagation(); 
    return false;
});

// Toggle loading state of zenx window
ZenX.winLoading = function (window, toggle) {
        
    if (toggle) {

        $(window).find('.win-spinner.out').removeClass('out');

    } else $(window).find('.win-spinner:not(.out)').addClass('out');

}