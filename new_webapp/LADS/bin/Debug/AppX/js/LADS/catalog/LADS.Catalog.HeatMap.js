LADS.Util.makeNamespace("LADS.Catalog.HeatMap");

LADS.Catalog.HeatMap = function (elt, startFolder) {
    "use strict";

    this.setFolder = function (f1) {
        folder = f1;
    };

    this.setDisplayTag = function (sortBy) {
        currentSort = sortBy;
        refreshData();
    };

    /**called in Layout.Catalog when initiate the heatMap*/
    this.addPickedHandler = function (handler) {
        pickedHandlers.push(handler);
    };

    this.removePickedHandler = function (handler) {
        var idx = pickedHandlers.indexOf(handler);
        if (idx != -1) pickedHandlers.splice(idx, 1);
    };

    /*not idea what is this functino doing**/
    function pickedLocation(res) {
        var evt = { type: currentSort, value: res };
        for (var i = 0; i < pickedHandlers.length; i++) {
            pickedHandlers[i](evt);
        }
    }

    var folder = startFolder;
    var currentSort = LADS.Layout.Catalog.default_options.tag;
    var pickedHandlers = [];
    var root = null;
    var dataSet = [];
    var bins = {};
    var binQuantity = {};
    var binlist = [];
    var dataToRender = [];
    var heatMap = null;
    var maxBarHeight = 84;
    var minTopBorder = 6;
    var datasize = null;
    var datadelta = null;
    init();

    /**initiates the heat Map*/
    function init() {
        root = elt;
        if (!elt)
            root = $(document.createElement('div'));
        if (!root.parent())
            $('body').append(root);

        heatMap = d3.select(root[0])
            .append('svg:svg')
            .attr('width', '100%')
            .attr('height', '100%');
    }

    refreshData();

    /**get the value of the data passed in.
    *@param:data
    *@return: the number/first letter of the data
    **/
    function getVal(d) {
        var parseNum = Number(d);
        if (isNaN(parseNum) || currentSort === "Artist" || currentSort === "Title")
            return d.charAt(0).toUpperCase();
        else
            return Number(d);
    }

    /***
    *get the total number of each bin.
    **/
    function binValues() {
        if (dataSet.length === 0) return;
        bins = {};
        binQuantity = {};
        switch (typeof getVal(dataSet[0])) {
            case 'string'://if the type of the data is string, sort them according to their first letter in alphabetic order.
                for (var i = 0; i < LADS.Util.alphabet.length; i++) {
                    bins[LADS.Util.alphabet[i]] = 0;
                    binQuantity[LADS.Util.alphabet[i]] = 0;
                }
                break;
            default://sort the years.
                var min = getVal(d3.min(dataSet));
                var max = getVal(d3.max(dataSet));
                var step = Math.round((max - min) / 10);
                if (step === 0) { step = 1; }
                //if max is part of range, it will be excluded in d3.range method
                var range = d3.range(min, max + 1, step);
                //checks if max is part of range
                if ((max - min) % step === 0) {
                    range = d3.range(min, max + step, step);
                }
                if (max == min) {
                    range = [];
                    range[0] = min;
                }
                for (var j = 0; j < range.length; j++) {
                    bins[range[j]] = 0;
                    binQuantity[range[j]] = 0;
                }
        }
        binlist = [];
        for (var bin in bins) {
            binlist.push(bin);
        }

        for (var k = 0; k < dataSet.length; k++) {
            putInBin(getVal(dataSet[k]));
        }
        var sum = 0;
        var max = 0;
        for (var m in bins) {
            binQuantity[m] = Number(bins[m]);
            bins[m] = Math.log(bins[m] + 1);
            sum += bins[m];
            max = Math.max(max, bins[m]);
        }
        max /= sum;
        for (var n in bins) {
            bins[n] /= sum;
            bins[n] /= max;
        }
    }

    /**
    *put the value into the bin(certain number or letter)
    *@param: val    a value (number or letter)
    */
    function putInBin(val) {
        if (typeof val === "number") {
            for (var i = 0; i < (binlist.length) ; i++) {
                var start = getVal(binlist[i]);
                if (binlist.length === 1) {
                    bins[start] += 1;
                    return;
                }
                //when length >1
                if (i === binlist.length - 1)
                    return bins[end] += 1;
                var end = getVal(binlist[i + 1]);

                if (val >= start && val < end) {
                    bins[start] += 1;
                    return i;
                }
            }
        }
        if (typeof val === "string") {
            var j = getVal(val);
            if (bins[j] !== undefined) {
                bins[getVal(val)] += 1;
            } else { bins['#'] += 1; }
        }
    }
    /**convert the bins to data after gather the stats of each bin*/
    function convertBinsToData() {
        dataToRender = [];
        for (var i in bins) {
            dataToRender.push({ key: i, value: bins[i], quantity: binQuantity[i] });
        }
    }

    /**
    *refresh the data, "Title" tag as default, or show the current selected tag.
    **/
    function refreshData() {
        dataSet = [];
        $.each(folder.artworks, function (i, doq) {
            var value;
            switch (currentSort) {
                case "Title":
                    value = doq.Name;
                    break;
                case "Origin":
                    break;
                default:
                    value = doq.Metadata[currentSort];
            }
            if (value)
                dataSet.push(value);
        });
        binValues();
        convertBinsToData();
        draw();
    }

    /**
    *draw the map.
    */
    function draw() {
        datasize = dataToRender.length;
        datadelta = 100 / datasize;
        //console.log("datadelta: " + datadelta);
        //$(heatMap.node().childNodes).remove();

        var renderelements = heatMap.selectAll('svg');
        renderelements = renderelements
        .data(dataToRender);

        renderelements.exit().remove();

        renderelements.each(function (d, i) { LADS.Util.applyD3DataRec(this); });


        renderelements.selectAll('.text1')
            .attr('x', function () { return datadelta / 2 + "%"; })
            .text(function (d) {
                return d.key;
            });
        renderelements.selectAll('.text2')
            .transition()
            .duration(1000)
            .attr('x', function () { return datadelta / 2 + "%"; })
            .attr('y', function (d, i) {
                if (d.value > 0) {
                    return (maxBarHeight - (d.value * maxBarHeight)) + 12 + "%";
                } else {
                    return '80%';
                }
            })
            .attr('style', 'fill:white')
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return (d.quantity > 0) ? d.quantity : "";
            });
        renderelements
            .transition()
            .duration(1000)
            .attr('x', function (d, i) { return i * datadelta + "%"; });
        renderelements.selectAll('.background')
            .transition()
            .attr('width', function () { return datadelta + 0.1 + "%"; });
        renderelements.selectAll('.rect1')
            .transition()
            .duration(1000)
            .attr('x', function (d, i) { return 0.5 + "%"; })
            .attr('width', function () { return datadelta - 1 + "%"; })
            .attr('y', function (d, i) { return (maxBarHeight - (d.value * maxBarHeight)) + 15 + "%"; })
            .attr('height', function (d, i) { return d.value * maxBarHeight - 15 + "%"; });
        renderelements.selectAll('.rect2')
            .transition()
            .duration(1000)
            .attr('y', function (d, i) {
                if (d.value > 0.05)
                    return (maxBarHeight - (1 * maxBarHeight)) + 9 + "%";
                else return (
                    maxBarHeight - (d.value * maxBarHeight)) + 9 + "%";
            })
            .attr('width', function () { return datadelta + "%"; })
            .attr('height', function (d, i) { return 1 * maxBarHeight - 10 + "%"; });

        var entering = renderelements.enter().append('svg:svg');

        entering
            .append('svg:rect')
            .attr("class", "background")
            .attr('width', datadelta + 0.1 + "%")
            .attr('height', '92%')
            .attr('style', 'fill: gray');
        entering
            .attr('x', function (d, i) { return i * datadelta + "%"; })
            .attr('class', 'svgcont');
        entering //visible rectange -- fills only as much as number of elements
            .append('svg:rect')
            .attr('class', 'rect1')
            .attr('x', function (d, i) { return 0.5 + "%"; })
            .attr('y', function (d, i) {
                return (maxBarHeight - (d.value * maxBarHeight)) + 15 + "%";
            })
            .attr('width', datadelta - 1 + "%")
            .attr('height', function (d, i) { return d.value * maxBarHeight - 15 + "%"; })
            .attr('style', 'fill:white; stroke:white');
        entering //selectable rectangle -- fills full vertical column
            .append('svg:rect')
            .attr('class', 'rect2')
            .attr('y', function (d, i) {
                if (d.value > 0.05)
                    return (maxBarHeight - (1 * maxBarHeight)) + 9 + "%";
                else return (maxBarHeight - (d.value * maxBarHeight)) + 9 + "%";
            })
            .attr('width', datadelta + "%")
            .attr('height', function (d, i) { return 1 * maxBarHeight - 10 + "%"; })
            .attr('style', 'fill:rgba(0,0,0,0);')
            .on('click', function (d, i) {
                pickedLocation(getVal(d.key));//???what is this for, no differences if comment it out??????????
            });
        entering
            .append('svg:rect')
            .attr('class', 'background')

            .attr('x', '0%')
            .attr('y', maxBarHeight + '%')
            .attr('width', datadelta + 0.2 + "%")
            .attr('height', 100 - maxBarHeight + '%')
            .attr('style', 'black');
        entering
            .append('svg:text')
            .attr('class', 'text1')
            .attr('y', "96%")
            .attr('text-anchor', 'middle')
            .attr('x', datadelta / 2 + "%")
            .attr('style', 'fill:#FFF')
            .text(function (d) { return d.key; });

        entering
            .append('svg:text')
            .attr("class", "text2")
            .attr('x', datadelta / 2 + "%")
            .attr('y', function (d, i) {
                if (d.value > 0) {
                    return (maxBarHeight - (d.value * maxBarHeight)) + 12 + "%";
                } else {
                    return '80%';
                }
            })
            .attr('style', 'fill:white')
            .attr('text-anchor', 'middle')
            .text(function (d) {
                return (d.quantity > 0) ? d.quantity : "";
            });

        heatMap
            .append('svg:line')
            .attr('x1', "0%")
            .attr('x2', "100%")
            .attr('y1', maxBarHeight + "%")
            .attr('y2', maxBarHeight + "%")
            .attr('style', 'stroke:white;stroke-width: 2px');

    }

};