LADS.Util.makeNamespace("LADS.Authoring.ButtonBar");
	


LADS.Authoring.ButtonGroup = function (itemData, options) {


    return new ButtonGroup(itemData, options);

    //expects array with fields: content (either text or image), function for onclick, boolean isImage
    //returns div of buttongroup
    function ButtonGroup(array, options) {
        var buttonGroup = $(document.createElement('div'));
        buttonGroup.css('height', '100%'); buttonGroup.css('width', '100%');
        var size = Math.round(100 / array.length) - 1; //-1 makes sure that there is not any overflow problems

        buttonGroup.selected = null;

        function handleSelected(event) {
            if (buttonGroup.selected) {
                buttonGroup.selected.removeClass(options.handleSelectedClass);
            }

            //Really hacky way to make sure entire div is selected
            if ($(event.target).hasClass("ButtonItem")) {

                buttonGroup.selected = $(event.target);
            } else {
                buttonGroup.selected = $(event.target).parent();
            }

            buttonGroup.selected.addClass(options.handleSelectedClass);
        }

        for (var i = 0; i < array.length; i++) {
            var item = new ButtonItem(array[i], options.isVertical);
            if (!options.isVertical) {
                item.css('height', '100%');
                item.css('width', size + '%');
            }
            else {
                item.css('width', '100%');
                //item.css('height', size + '%');
                item.css('padding', '3% 2%');
                item.css('margin-bottom', '2%');
            }
            if (array[i].onClickFunction) item.click(handleSelected);
            buttonGroup.append(item);
            if (array[i].selected) item.click();

        }
        return buttonGroup;
    }

    // expects string for content, function for onclick and boolean isImage
    //returns div of button item
    function ButtonItem(itemData, isVertical) {
        var buttonItem = $(document.createElement('div'));

        buttonItem.addClass("ButtonItem");

        if (itemData.isImage) {
            var image = $("<img src='" + itemData.content + "' </img>");
            image.css("max-width", "100%");
            image.css("max-height", "100%");
            buttonItem.html(image);
        } else {
            var text = $("<div>" + itemData.content + "</div>");
            text.css('width', '100%');
            text.addClass(itemData.contentClass);

            buttonItem.append(text);
        }

        buttonItem.click({ dataArray: itemData.onClickData }, itemData.onClickFunction);
        if (!isVertical) {
            buttonItem.css('float', 'left');
        }
        buttonItem.addClass(itemData.itemClass);
        buttonItem.css('text-align', 'center');

        return buttonItem;
    }
};
