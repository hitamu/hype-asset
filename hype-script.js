function sh_documentReady(hypeDocument, element, event) {
    sh_accessibility(hypeDocument, element, event);
}

if ("HYPE_eventListeners" in window === false) {
    window.HYPE_eventListeners = Array();
}
window.HYPE_eventListeners.push({ "type": "HypeSceneLoad", "callback": sh_documentReady });

function sh_initCourseContent(hypeDocument, element, event) {
    var resourcesFolder = hypeDocument.resourcesFolderURL();
    var $textBlocks = $('.HYPE_element u');
    // Apply responsive styling (done here because it breaks Hype's UI)
    $('.mainContentContainer').addClass('mainContent');
    $('.HYPE_document,.HYPE_scene')
        .css('position', 'static')
        .css('overflow', 'inherit');
    var renderers = {
        divider: function(params) {
            return '<hr class=\"rule\" />';
        },
        bullet: function(params) {
            var text = params[0];
            return '<li class=\"\">' + text + '</li>';
        },
        bulletGroup: function(params) {
            var listItems = params.map(param => '<li class="bullet">' + param + '</li>');
            return '<ul class="bulletGroup">' + listItems.join('') + '</ul>';
        },
        numberBulletGroup: function(params) {
            var listItems = params.map(param => '<li class="bullet">' + param + '</li>');
            return '<ol class="bulletGroup">' + listItems.join('') + '</ol>';
        },
        checkbox: function(params) {
            var label = params[0];
            var name = params[1];
            var checked = params[2] ? "checked" : ""
            return `<input type="checkbox" ${checked} name="${name}"><label for="vehicle1">${label}</label>`
        },
        superscript: function(params) {
            var text = params[0];
            return '<sup class=\"superscript\">' + text + '</sup>';
        },
        textarea: function(params) {
            var id = params[0];
            var placeholder = params[1];
            return '<textarea class=\"textarea\" data-id=\"' + id + '\" placeholder=\"' + placeholder + '\"></textarea><button class=\"textarea-button\">Save</button>';
        },
        video: function(params) {
            var videoFile = params[0];
            var videoSource = resourcesFolder + '/' + videoFile;
            return (
                '<video playsinline controls><source src=\"' +
                videoSource +
                '\" type=\"video/mp4\" /></video>'
            );
        },
        youtube: function(params) {
            var embedUrl = params[0];
            return (
                '<iframe allowfullscreen=\"\" frameborder=\"0\" height=\"400\" width=\"100%\" src=\"' +
                embedUrl +
                '\"></iframe>'
            );
        },
        image: function(params) {
            var height = params[0];
            var imageName = params[1];
            var imageSizing = params[2] || 'fill';
            var imageSource = resourcesFolder + '/' + imageName;
            return (
                '<div class=\"bg-image bg-' +
                imageSizing +
                '\" style=\"height:' +
                height +
                ';background-image:url(' +
                imageSource +
                ');\"></div>'
            );
        },
        accordion: function(params) {
            var title = params[0];
            var description = params[1];
            var imgDiv = "";
            if (params[2]) {
                var imageName = params[2];
                var imageSource = resourcesFolder + '/' + imageName;
                var imageStyle = [
                    "background-size: contain;",
                    "background-repeat: no-repeat;",
                    "width: 100%;",
                    "height: 0;",
                    "padding-top: 20%;"
                ].join("");
                imgDiv = `<div class="bg-image bg-fill" style="${imageStyle} background-image:url(${imageSource})"></div>`
            }

            return (
                `<div class="accordion">
                   <div class="accordion-title">
                        <span>${title}</span>
                        <i class="fa fa-plus"></i>
                   </div>
                   <div class="accordion-detail" style="display:none">
                        <div>${description}</div>
                        ${imgDiv}
                   </div>
                </div>`
            );
        },
        sortableGroup: function(params){
            var listItems = params.map(param => {
                return (
                    `<li class="sortableItem"><span>${param}</span><i class="fa fa-bars"></i></li>`
                );
            });
            return (
                `<ul class="sortableGroup"><div class="top-label">Top Label</div>${listItems.join('')}<div class="bottom-label">Bottom Label</div></ul>`
            );
        }
    };

    function render(tags) {
        var typeName = tags.shift();
        var renderTemplate = renderers[typeName];
        if (renderTemplate) {
            return renderTemplate(tags);
        } else {
            return '-';
        }
    }

    function extractTags(text) {
        var curlies = text.match(/\{[^\}^\{]+\}/g); // -> ['{image|200px|string.jpg}']
        return !!curlies && curlies[0].match(/([^\|^\}\{]+)/g); // -> ['image', '200px', 'string.jpg']
    }

    function extractTagsAndRender(i, node) {
        var $el = $(node);
        var tags = extractTags($el.text())
        if (!!tags === true) {
            $el.replaceWith(render(tags));
        }
    }
    // Textarea
    $('.textarea').each(function() {
        var localstorageId = 'schoolhub-field-' + $(this).attr('data-id');
        var storedText = localStorage.getItem(localstorageId);
        $(this).val(storedText)
    });
    $('.textarea').on('keyup', function() {
        var localstorageId = 'schoolhub-field-' + $(this).attr('data-id');
        localStorage.setItem(localstorageId, $(this).val());
        $(this).next().removeClass('textarea-button--saved')
        $(this).next().text('Save')
    });
    $('.textarea-button').click(function() {
        $(this).addClass('textarea-button--saved');
        $(this).text('Saved');
    });
    $textBlocks.each(extractTagsAndRender);
}

function sh_initAudioTemplate(hypeDocument, element, event) {
    // Attach audio element to document
    var trackLocation = $('#play-pause-button').attr('data-track-name');
    var $track = $('<audio id=\"track\" preload=\"auto\"><source src=\"' + trackLocation + '\" type=\"audio/mpeg\"></source></audio>');
    $('#' + hypeDocument.documentId()).append($track);
    // assign audio as global var
    audioTrack = hypeDocument.getElementById('track');
    audioTrack.onended = function() {
        pauseTrack()
    };
    // play pause
    var fadeDuration = 200;
    playTrack = function() {
        $('#pause-icon').fadeIn(200);
        $('#play-icon').fadeOut(200);
        audioTrack.play();
    }
    pauseTrack = function() {
        $('#pause-icon').fadeOut(200);
        $('#play-icon').fadeIn(200);
        audioTrack.pause();
    }
    $('#pause-icon').hide();
}

function sh_audioDurationCheck(hypeDocument, element, event) {
    var sliderOffset = 10; // so that the slider starts as a circle
    var sliderMaxWidth = $('#slider-bar-bg').width() - sliderOffset;
    // adds a loading indicator to the back of the slider
    updateLoader = function(e) {
        if (typeof audioTrack == 'undefined') return
        var range = 0;
        var bf = audioTrack.buffered;
        var time = audioTrack.currentTime;
        var fullWidth = sliderMaxWidth + sliderOffset;
        try {
            while (!(bf.start(range) <= time && time <= bf.end(range))) {
                range += 1;
            }
            var loadStartPercentage = bf.start(range) / audioTrack.duration;
            var loadEndPercentage = bf.end(range) / audioTrack.duration;
            var loadPercentage = loadEndPercentage - loadStartPercentage;
            var setWidth = loadPercentage * fullWidth;
            $('#slider-loaded').css('width', setWidth);
            if (loadPercentage == 1) {
                clearInterval(loadInterval)
            }
        } catch (error) {}
    }
    // check current time / duration and position slider
    updateSlider = function() {
        if (typeof audioTrack == 'undefined') return
        var curTime = audioTrack.currentTime;
        var duration = audioTrack.duration;
        var currentSliderWidth = (curTime / duration) * sliderMaxWidth;
        $('#slider-bar').css('width', currentSliderWidth + sliderOffset);
    }
    window.setInterval(updateSlider, 100);
    loadInterval = window.setInterval(updateLoader, 100);
}

function sh_audioDurationSet(hypeDocument, element, event) { // Determine clicked spot on scrubber bar as a percentage of duration
    var timelineWidth = element.offsetWidth;
    var clickedTime = event.offsetX;
    var duration = audioTrack.duration;
    var selectedDuration = clickedTime / timelineWidth * duration;
    audioTrack.currentTime = selectedDuration;
    playTrack()
    updateSlider();
}

function sh_audioTogglePlay(hypeDocument, element, event) {
    (audioTrack.paused) ? playTrack(): pauseTrack();
}

function sh_initFileDownload(hypeDocument, element, event) {
    var downloadHref = element.attributes.getNamedItem('download').value
    var linkHtml = '<a href=\"' + downloadHref + '\" type=\"application/octet-stream\" download class=\"downloadLink\"></a>'
    $(element).prepend(linkHtml)
}

// School Hub Scripts added here

function getScrollHeight () {
    console.log(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    )
    return Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    )
}

// Called from sh-app through `iframe.contentWindow.postMessage`
function postHeight(event) {
    if (event.data === 'sendHeight') {
        // TODO: set origin from env vars
        // Do we trust the sender of this message?
        // if (event.origin !== "http://example.com:8080") return;

        // Assuming you've verified the origin of the received message (which
        // you must do in any case), a convenient idiom for replying to a
        // message is to call postMessage on event.source and provide
        // event.origin as the targetOrigin.

        // postMessage if window resizes
        window.addEventListener('resize', () => {
            console.log(`resized ${getScrollHeight()}`)
            event.source.postMessage(
                getScrollHeight(),
                event.origin
            );
        })

        event.source.postMessage(
            getScrollHeight(),
            event.origin
        );
    }
}

function sh_accessibility(hypeDocument, element, event) {
    // Need a role element for the hype content
    $('.HYPE_document').attr('role', 'application')

    // Applies accessible attributes to meditation play/pause button
    $('#play-pause-button').attr('tabindex', 0)
        .attr('aria-label', 'Play or Pause this meditation')
        .attr('role', 'button');

    // Applies accessible attributes to download button
    $('.dl-button').attr('tabindex', 0)
        .attr('aria-label', 'Download this file')
        .attr('role', 'button');

    // Replaces headings with H tags based on font size
    $('span').each(function(i, el){
        const fontSize = el.style['font-size'];
        let tag;
        if(fontSize === "40px") {
            tag = 'h3';
        } else if(fontSize === "26px" || fontSize === "20px") {
            tag = 'h4';
        }

        if(tag && el.textContent !== '') {
            const newHtml = "<" + el.parentNode.outerHTML.replace(/(^<\w+|\w+>$)/g, tag) + ">"
            $(el.parentNode).replaceWith(newHtml)
        }
    })


    // Replaces headings with H tags based on font size
    $('font').each(function(i, el){
        let tag;
        if(el.size === "5") {
            tag = 'h3';
        }

        if(tag && el.textContent !== '') {
            const newHtml = "<" + el.outerHTML.replace(/(^<\w+|\w+>$)/g, tag) + ">"
            $(el).replaceWith(newHtml)
        }
    })
}

window.addEventListener("message", postHeight, false);
