$(document).ready(function(){

    var separators = [
        $('#header_start'),
        $('#hr_setup'),
        $('#hr_dev'),
        $('#hr_links')
    ];

    // smooth scrolling
    $('.separator_link').on('click', function() {
        var target; 
        target = $($(this).attr('dest'));
        $('body').animate({
            scrollTop: target.offset().top
        }, 700);
    });
    
    // auto-change side navigation when section visible
    $(window).on('scroll', function() {
        var scrollTop    = $(this).scrollTop(),
            scrollBottom = scrollTop + $(window).height(),
            i,
            height;

        for(i=separators.length-1; i>=0; i--) {
            if(separators[i].offset().top < scrollBottom - 400) {
                $('.linkContain').css('display', 'none');
                $('#nav_' + separators[i].attr('id').split('_')[1]).css({
                    display: 'inline-block',
                    height:  $(window).height() - $('#menu').height() - 20,
                    'overflow-y': 'scroll',
                    'overflow-x': 'hidden'
                });
                height = -100 * i;
                break;
            }
        }
    });
});