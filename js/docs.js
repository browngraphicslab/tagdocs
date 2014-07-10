$(document).ready(function(){

    var pingDivs,
        separators = $('[id^="nav_hr_"]'); // matches elements with id starting "nav_hr_"

    init();

    function init() {
        var i;
        for(i=0; i<separators.length; i++) {
            separators[i] = $(separators[i]);
        }
        initHandlers();
        pingDivs = $('.pingMessage');
        pingServers();
    }

    function initHandlers() {
        // smooth scrolling
        $('.separator_link').on('click', function() {
            var target; 
            target = $($(this).attr('dest'));
            $('body').animate({
                scrollTop: target.offset().top
            }, 700);
        });

        $('.toc_link').on('click', function() {
            var target = $($(this).attr('dest'));
            $('body').animate({
                scrollTop: target.offset().top - $('.menu').height() - 20
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
                    $('#nav_' + separators[i].attr('id').split('_')[2]).css({
                        display: 'inline', // setting this to inline-block fails with youtube embedding? WHAT?
                        height:  $(window).height() - $('#menu').height() - 20,
                        'overflow-y': 'scroll',
                        'overflow-x': 'hidden'
                    });
                    height = -100 * i;
                    break;
                }
            }
        });
    }

    function pingServers() {
        var serverDivs = $('.serverAddress'),
            statusList = $('.status'),
            i, ip, divText;
        for(i=0;i<serverDivs.length;i++) {
            divText = serverDivs[i].innerHTML;
            ip = (divText.match(/http/)) ? divText : 'http://'+divText+":8080";
            $.ajax({
                url: ip,
                dataType: 'text',
                cache: false,
                async: true,
                success: serverUp(ip, $(statusList[i]), i),
                error: serverDown(ip, $(statusList[i]), i)
            });
        }
    }

    function serverUp(ip, status, i) {
        return function() {
            console.log(ip+" is up");
            status.css('background-color', '#00ff00');
            pingDivs[i].innerHTML = 'running';
        }
    }

    function serverDown(ip, status, i) {
        return function() {
            console.log(ip+" is down");
            status.css('background-color', '#ff0000');
            pingDivs[i].innerHTML = 'down';
        }
    }
});