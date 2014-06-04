$(document).ready(function(){

    var separators = [
        $('#header_start'),
        $('#hr_setup'),
        $('#hr_links'),
        $('#hr_misc')
    ];

    // moves side navigation up
    function moveNav(top) {
        $(".allPages").css({"top": top}); 
    } 

    // smooth scrolling
    $('a[href*=#]:not([href=#])').on('click', function() {
        var target;
        if (location.pathname.replace(/^\//,'') === this.pathname.replace(/^\//,'') && location.hostname === this.hostname) {
            target = $(this.hash);
            target = target.length ? target : $('[name=' + this.hash.slice(1) +']');  
            if (target.length) {
                $('body').animate({
                    scrollTop: target.offset().top
                }, 700);
                return false;
            }
        }
    });
    
    // auto-change side navigation when section visible
    $(window).on('scroll', function() {
        var scrollTop    = $(this).scrollTop(),
            scrollBottom = scrollTop + $(window).height(),
            i,
            height;

        for(i=separators.length - 1; i>=0; i--) {
            if(separators[i].offset().top < scrollBottom - 400) {
                $('.linkContain').css('display', 'none');
                $('#nav_' + separators[i].attr('id')split('_')[1]).css({
                    display: 'inline-block',
                    height:  Math.min($(window).height(), 400),
                    'overflow-y': 'scroll',
                    'overflow-x': 'hidden'
                });
                height = -100 * i;
                moveNav(height + '%');
                break;
            }
        }
    });
});