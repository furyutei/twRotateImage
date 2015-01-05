// ==UserScript==
// @name            twRotateImage
// @namespace       http://d.hatena.ne.jp/furyu-tei
// @author          furyu
// @version         0.1.0.1
// @include         http://twitter.com/*
// @include         https://twitter.com/*
// @exclude         https://twitter.com/i/*
// @description     Rotate image on Twitter.
// ==/UserScript==
/*
The MIT License (MIT)

Copyright (c) 2014 furyu <furyutei@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

(function(w, d){

var main = function(w, d){

    //{ user parameters
    
    var KEYCODE_ROTATE_CLOCKWISE = 114; // 'r': 時計回りキー
    var KEYCODE_ROTATE_ANTICLOCKWISE = 82; // 'R': 反時計回りキー
    
    //}
    
    
    //{ global variables
    
    var NAME_SCRIPT = 'twRotateImage';
    var $=w.$;
    if (w[NAME_SCRIPT+'_touched']) return;
    if (!$) {
        var main = arguments.callee; setTimeout(function(){main(w,d);}, 100); return;
    }
    w[NAME_SCRIPT+'_touched'] = true;
    
    var CLASS_TOUCHED = NAME_SCRIPT+'_touched';
    var CLASS_ROTATION_TARGET = NAME_SCRIPT+'_rotation_target';
    var ATTRNAME_DEGREE = NAME_SCRIPT+'_deg';
    
    var clockwise_pattern = {0:90, 90:180, 180:270, 270:0}, anticlockwise_pattern = {};
    for (var key in clockwise_pattern) anticlockwise_pattern[clockwise_pattern[key]] = key;
    var jq_tgt_img = null;
    
    //}
    
    
    //{ functions
    
    var check_parent_container = function(jq_parent){
        return (jq_parent.hasClass('Gallery-media') || (jq_parent.get(0).nodeName == 'DIV' && !jq_parent.attr('class')));
    };  //  end of check_parent_container()
    
    var rotate_image = function(jq_img, anticlockwise){
        if (!jq_img) jq_img = jq_tgt_img;
        if (!jq_img || !jq_img.hasClass(CLASS_ROTATION_TARGET)) return;
        
        var pattern = (anticlockwise) ? anticlockwise_pattern : clockwise_pattern, deg = pattern[jq_img.attr(ATTRNAME_DEGREE)];
        if (!deg) deg = 0;
        
        var width = jq_img.attr('data-width'), height = jq_img.attr('data-height'), swap = (deg/90) % 2;
        
        for (;;) {
            if (!jq_img.parent().hasClass('Gallery-media')) break;
            var jq_gallery = jq_img.parents('div.Gallery-content:first');
            if (jq_gallery.size() < 1) break;
            
            jq_img.width(swap ? height : width).height(swap ? width : height);
            
            using("app/utils/image/image_resizer", function(imageResizer) {
                imageResizer.resizeMedia(jq_img, jq_gallery, !1, '.GalleryTweet', !0);
                width = jq_img.width();
                height = jq_img.height();
                jq_img.width(swap ? height : width).height(swap ? width : height);
                var margin_top = jq_img.css('margin-top'), margin_bottom = jq_img.css('margin-bottom');
                jq_img.css('margin-top','0').css('margin-bottom','0');  // TODO: margin の適切な設定方法がわからない
            });
            break;
        }
        jq_img.parent().each(function(){
            var jq_parent = $(this);
            if (!check_parent_container(jq_parent)) return;
            var width = jq_img.width(), height = jq_img.height(), tmp_value = width;
            if (swap) {
                width = height;
                height = tmp_value;
            }
            var text_align = 'center', origin_x = width / 2, origin_y = height / 2;
            if (swap) {
                if (deg == 90) {
                    origin_y = origin_x;
                }
                else {
                    origin_x = origin_y;
                }
                if (height < width) text_align = 'left';
            }
            //jq_parent.width(width).height(height).css('text-align', text_align);
            //jq_parent.height(height).css('text-align', text_align);
            jq_parent.height(height).css('text-align', 'left'); // TODO: 'center' のままにしたいが、親要素からずれてしまうことがある
            jq_img.css('transform-origin', origin_x+'px '+origin_y+'px');
        });
        jq_img.css('transform', 'rotate('+deg+'deg)');
        jq_img.attr(ATTRNAME_DEGREE, deg);
    };  //  end of rotate_image()
    
    var set_event_img = function(jq_img){
        if (typeof jq_img.attr(ATTRNAME_DEGREE) !== 'undefined') return;
        jq_img.attr(ATTRNAME_DEGREE, 0);
        jq_img.mouseenter(function(){
            jq_tgt_img = jq_img;
            jq_img.addClass(CLASS_ROTATION_TARGET);
        });
        jq_img.mouseleave(function(){
            jq_img.removeClass(CLASS_ROTATION_TARGET);
        });
        jq_img.parent().each(function(){
            var jq_parent = $(this);
            if (check_parent_container(jq_parent)) {
                jq_parent.css('width', '').css('height', '').css('text-align','');
            }
        });
    };  //  end of set_event_img()
    
    //}
    
    
    //{ main procedure
    
    $('img').each(function(){set_event_img($(this))});
    
    $(d).bind('DOMNodeInserted', function(e){
        var jq_target = $(e.target);
        ((jq_target.get(0).nodeName==='IMG')?jq_target:jq_target.find('img')).each(function(){set_event_img($(this))});
    });
    
    $(d).keypress(function(e){
        var keycode = e.which;
        $('div.Gallery-content').each(function(){
            var jq_gallery = $(this);
            if (jq_gallery.is(':visible')) {
                var jq_img = jq_gallery.find('img.media-image:first');
                jq_tgt_img = jq_img;
                jq_img.addClass(CLASS_ROTATION_TARGET);
            }
            else {
                jq_gallery.find('img.media-image').removeClass(CLASS_ROTATION_TARGET);
            }
        });
        if (!jq_tgt_img || !jq_tgt_img.hasClass(CLASS_ROTATION_TARGET)) return;
        switch (keycode) {
            case    KEYCODE_ROTATE_CLOCKWISE:
                rotate_image(jq_tgt_img);
                return false;
            case    KEYCODE_ROTATE_ANTICLOCKWISE:
                rotate_image(jq_tgt_img, true);
                return false;
        }
    });
    
    //}

}   //  end of main()


if (typeof w.$ == 'function') {
    main(w, d);
}
else {
    var container = d.documentElement;
    var script = d.createElement('script');
    script.textContent = '('+main.toString()+')(window, document);';
    container.appendChild(script);
}

})(window, document);

// ■ end of file
