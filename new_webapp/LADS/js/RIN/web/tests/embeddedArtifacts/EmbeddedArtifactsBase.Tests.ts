//
// Basic unit tests AND common code for Embedded Artifacts testing
//
// Copyright (C) 2013 Microsoft Research 
//
/// <reference path="../../../src/embededArtifacts/embeddedArtifactTypes.d.ts"/>
/// <reference path="qunit.d.ts"/>



module rin.embeddedArtifactTests {


    interface TestDataItem extends DataItem {
        id: string;
        collectionId?: string; //    ID of the grid from which it came, if any. 
        iRow?: number; // For Grid-generated items, the row #
        iCol?: number; // For Grid-generated items, the col #
        //expandStart: number;
        //expandEnd: number;
    }


    export function runTests() {
        //debug.log("test0...");
        embeddedArtifactTests.test0();
        //debug.log("test1...");
        embeddedArtifactTests.test1();
    }

    export function generateSimpleExperience() {
        return {
            defaultKeyframe: { offset: 0, state: { value: 0 } },
            experienceStreams: {
                "E1": { // Experience E1
                    duration: 20,
                    keyframes: [
                        { offset: 0, state: { value: 0 } },
                        { offset: 10, state: { value: 10 } }
                    ]
                }
            }
        }
    }

    //
    // Create n "Artifact Host" - it will just validate the operation of the Layout Engine for the
    // given test data.
    //
    var lastArtifactList: WorkingArtifactList = null; // Bit of a hack - testHost saves the last artifact list it was called to render here... used for validation
    var testHost = {


        update: function (workingList: WorkingArtifactList) {
            var id;
            for (id in workingList) {
                if (workingList.hasOwnProperty(id)) {
                    var item = workingList[id];
                    //debug.log("item(%s)", id, item);
                }
            }
            lastArtifactList = workingList;
        },

        checkOverlap: function (a1, a2) { return false; }

    }

    //
    // Create a proxy to the provider. This emulates a 2D provider, whose coordinate system is
    // CARTESIAN (grows upwards and rightwards), and is centered at (0,0).
    // At zoom=1.0, both x and y range from -0.5 to 0.5. 
    //
    var testProvider = {

        getScreenDimensions: function (r: Region): void {
            r.center.x = r.center.y = 0.5;
            r.span.x = r.span.y = 1.0;
        },

        currentNormalizedZoom: function (): number {
            return this._zoom;
        },

        convertPointToScreen2D: function (inPoint: Point2D, outPoint: Point2D): bool {
            outPoint.x = 0.5 + (inPoint.x - this._center.x) * this._zoom;
            outPoint.y = 0.5 - (inPoint.y - this._center.y) * this._zoom;
            return true;
        },

        convertPointToWorld2D: function (inPoint: Point2D, outPoint: Point2D): bool {
            outPoint.x = (inPoint.x - 0.5) / this._zoom + this._center.x; // NaN if zoom===0
            outPoint.y = (-inPoint.y + 0.5) / this._zoom + this._center.y; // NaN if zoom===0
            return true;
        },

        isRegionVisible: function (region): bool {
            return true;
        },

        // currentLinearParameter: function (): number {
        //     return 0.0;
        // },


        //
        // "Internal state".
        //  Cente is the world coordinates of the center of the viewport.
        //  Zoom is the zoom/magnification.
        //
        _center: { x: 0.0, y: 0.0 },
        _zoom: 1.0,

        //
        // Utilities to modify internal state, emulating user/player activity.
        //
        setCenter: function (x, y) { this._center.x = x; this._center.y = y; },
        setZoom: function (zoom) { this._zoom = zoom; },

    };

    var testOrchestrator = {


        isPlaying: function (): bool {
            return this._isPlaying;
        },

        _isPlaying: false,
        play: function () { this._isPlaying = true; },
        pause: function () { this._isPlaying = false; }

    };

    // 
    // Create a layout engine instance...
    //
    var testEngineHelper = {

        //
        // We add a  group policy called "test-group-policy" on top of the built-in group policies...
        //
        newGroupPolicy: function (policyId: string, collection: DataCollection, provider: ProviderProxy) {

            if (policyId === "test-group-policy") {

                return {
                    evaluate: function (workingList: WorkingArtifactList, experienceSmallState: SmallState): void {
                        // Modify working artifacts list here...
                    }
                }

            } else {
                return rin.embeddedArtifacts.newDefaultGroupPolicy(policyId, collection, provider, testOrchestrator);
            }
        },

        /* FUTURE?
        //
        // We add an item policy called "test-item-policy" on top of the built-in item policies...
        //
        newItemPolicy: function (policyId: string, collection: DataCollection, provider: ProviderProxy) {

            if (policyId === "test-item-policy") {

                return {
                    evaluate: function (workingItem: WorkingArtifact, eaSmallState: SmallState):void {
                        // modify working item here...
                        return;
                    }
                }

            } else {
                return rin.ext.EmbeddedArtifacts.newDefaultItemPolicy(policyId, collection, provider, orchestrator);
            }
        }
        */
    };

    export function test0() {

        //
        // Create some test data
        //
        var eaList: TestDataItem[] = [
            {
                id: "1.0",
                region: { center: { x: 1.0, y: 2.0 }, span: { x: 3.0, y: 4.0 } },
                zoomRange: { from: 0.5, to: 1.5 },
                parameterRange: { from: 5, to: 10 }
            }
        ];

        //
        // Create a data collection from the above array
        //
        var testCollection = createDataCollection(eaList, "test-collection");


        //
        // Create n "Artifact Host" - it will just validate the operation of the Layout Engine for the
        // given test data.
        //
        var host: ArtifactHost = testHost;

        //
        // Create a proxy to the provider. This emulates a 2D provider, whose coordinate system is
        // CARTESIAN (grows upwards and rightwards), and is centered at (0,0).
        // At zoom=1.0, both x and y range from -0.5 to 0.5. 
        //

        var provider: ProviderProxy = testProvider;

        //
        // Create a proxy to the orchestratory.
        //
        var orchestrator: OrchestratorProxy = testOrchestrator;


        // 
        // Create a layout engine instance...
        //
        var le = rin.embeddedArtifacts.newLayoutEngine(testEngineHelper, orchestrator);


        //
        // Add a pipeline
        //
        le.addPipeline(testCollection, ["base2DGroupPolicy", "test-group-policy"], /*["zoom2DItemPolicy", "test-item-policy"], */ provider, host);

        //
        // Render after simulating changes in experience state.
        //
        var keyFrameState = null; // TODO
        testProvider.setCenter(0.0, 0.0);
        testProvider.setZoom(1.0);
        testOrchestrator.pause();
        le.render(keyFrameState);

        testProvider.setCenter(0.5, 0.5);
        testProvider.setZoom(2.0);
        testOrchestrator.play();
        le.render(keyFrameState);

        //
        // Cleanup (optional)
        //
        le.deletePipeline(testCollection.collectionId);

        ok(true, "tautology :-)"); // QUnit expects at least one assertion check, so giving it one :-)

    }

    export function test1() {

        //
        // Create a Grid of artifacts
        //
        var gridRegion = { center: { x: 0.5, y: 0.5 }, span: { x: 1, y: 1 } };
        var nRows = 2, nCols = 2;
        var fractionalSize = 0.5;
        var zoomRange: Interval = { from: 0, to: 100 };
        //var parameterRange: Interval = { from: 0, to: 10};
        var grid = new Grid("G1", gridRegion, nRows, nCols, fractionalSize, zoomRange/*, parameterRange*/);

        //
        // Create a data collection from the above array
        //
        var testCollection = grid.dataCollection;


        //
        // Create n "Artifact Host" - it will just validate the operation of the Layout Engine for the
        // given test data.
        //
        var host: ArtifactHost = testHost;

        //
        // Create a proxy to the provider. This emulates a 2D provider, whose coordinate system is
        // CARTESIAN (grows upwards and rightwards), and is centered at (0,0).
        // At zoom=1.0, both x and y range from -0.5 to 0.5. 
        //

        var provider: ProviderProxy = testProvider;

        //
        // Create a proxy to the orchestratory.
        //
        var orchestrator: OrchestratorProxy = testOrchestrator;


        // 
        // Create a layout engine instance...
        //
        var le = rin.embeddedArtifacts.newLayoutEngine(testEngineHelper, orchestrator);


        //
        // Add a pipeline
        //
        le.addPipeline(testCollection, ["base2DGroupPolicy", "test-group-policy"], /*["zoom2DItemPolicy", "test-item-policy"], */ provider, host);

        //
        // Render after simulating changes in experience state.
        //
        var keyFrameState = null; // TODO
        /*testProvider.setCenter(0.5, 0.5);
        testProvider.setZoom(1.0);
        testOrchestrator.pause();
        le.render(keyFrameState);
        grid.validateWorkingList(lastArtifactList, testProvider, testHost);
        */

        testProvider.setCenter(0.0, 0.0);
        testProvider.setZoom(3.0);
        testOrchestrator.play();
        le.render(keyFrameState);
        grid.validateWorkingList(lastArtifactList, testProvider, testHost);
        //
        // Cleanup (optional)
        //
        le.deletePipeline(testCollection.collectionId);

    }


    export function test2() {

        //
        // Create n "Artifact Host" - it will just validate the operation of the Layout Engine for the
        // given test data.
        //
        var host: ArtifactHost = testHost;

        //
        // Create a proxy to the provider. This emulates a 2D provider, whose coordinate system is
        // CARTESIAN (grows upwards and rightwards), and is centered at (0,0).
        // At zoom=1.0, both x and y range from -0.5 to 0.5. 
        //

        var provider: ProviderProxy = testProvider;

        //
        // Create a proxy to the orchestratory.
        //
        var orchestrator: OrchestratorProxy = testOrchestrator;


        // 
        // Create a layout engine instance...
        //
        var le = rin.embeddedArtifacts.newLayoutEngine(testEngineHelper, orchestrator);

        //
        // Create a hybrid grid
        //
        var hybridGrid = newHybridGrid("H1", provider, host);

        //
        // Create a Grid of artifacts
        //
        var gridRegion = { center: { x: 0.5, y: 0.5 }, span: { x: 1, y: 1 } };
        var fractionalSize = 0.5;
        var zoomRange: Interval = { from: 0, to: 100 };
        hybridGrid.addGrid({
            gridId: "G0",
            region: gridRegion,
            nRows: 0,
            nCols:0,
            fractionalSize:fractionalSize,
            zoomRange: zoomRange,
            itemInitializer: function(item: DataItem, options: GridOptions): void {
                var itemEx = <any>item;
                itemEx.arbitraryValue = 1.0;
            }
        });
        hybridGrid.addGrid({
            gridId: "G1x1",
            region: gridRegion,
            nRows: 1,
            nCols:1,
            fractionalSize:fractionalSize,
            zoomRange: zoomRange,
            itemInitializer: function(item: DataItem, options: GridOptions): void {
                var itemEx = <any>item;
                itemEx.arbitraryValue = 1.0;
            }
        });
        hybridGrid.addGrid({
            gridId: "G2x2",
            region: gridRegion,
            nRows: 2,
            nCols: 2,
            fractionalSize: fractionalSize,
            zoomRange: zoomRange,
            itemInitializer: function (item: DataItem, options: GridOptions): void {
                var itemEx = <any>item;
                itemEx.arbitraryValue = 1.0;
            }
         });
         hybridGrid.addGrid({
            gridId: "G10x10",
            region: gridRegion,
            nRows: 10,
            nCols:10,
            fractionalSize:fractionalSize,
            zoomRange: zoomRange,
            itemInitializer: function (item: DataItem, options: GridOptions): void {
                var itemEx = <any>item;
                itemEx.arbitraryValue = 1.0;
            }
        });

        //
        // Create a data collection from the above array
        //
        var testCollection = hybridGrid.dataCollection;


        //
        // Add a pipeline
        //
        le.addPipeline(testCollection, ["base2DGroupPolicy", "test-group-policy"], /*["zoom2DItemPolicy", "test-item-policy"], */ provider, host);

        //
        // Render after simulating changes in experience state.
        //
        var keyFrameState = null; // TODO
        /*testProvider.setCenter(0.5, 0.5);
        testProvider.setZoom(1.0);
        testOrchestrator.pause();
        le.render(keyFrameState);
        grid.validateWorkingList(lastArtifactList, testProvider, testHost);
        */

        testProvider.setCenter(0.0, 0.0);
        testProvider.setZoom(3.0);
        testOrchestrator.play();
        le.render(keyFrameState);
        hybridGrid.validateWorkingList(lastArtifactList);

        //
        // Cleanup (optional)
        //
        le.deletePipeline(testCollection.collectionId);

    }

    //
    // This test helper function creates a DataCollection object with the specified collection Id. This collection enumerates
    // over the items in the input array.
    //
    function createDataCollection(a: any[], id: string): DataCollection {
        var collection = {
            collectionId: id,
            forEach: function (func: (item: DataItem, id: string, collection?: DataCollection) => void ): void {
                a.forEach(function (val, index) {
                    func(val, val["id"], collection);
                })
            }
        };
        return collection;
    }

    function samePoint(p1: Point2D, p2: Point2D): bool {
        return (Math.abs((p1.x - p2.x)) + Math.abs((p1.y - p2.y))) < 1.0e-10; // somewhat arbitrary definition of "close enough".
    }

    function inInterval(v: number, i: Interval): bool {
        return (v >= i.from) && (v <= i.to);
    }

    //
    // Represents a data collection whose elements lie on an nRowsXnCols grid. All these items have the same zoom range and parameter range.
    //
    class Grid {

        dataCollection: DataCollection;
        getVisbleRange: (viewport: Region) => { rowRange: Interval; colRange: Interval; };

        constructor(collectionId: string, region: Region, nRows: number, nCols: number, public fractionalSize: number,
             public zoomRange: Interval, public parameterRange?: Interval) {

            this.dataCollection = {
                collectionId: collectionId,
                forEach: (func: (item: DataItem, id: string, collection?: DataCollection) => void ): void => { // FAT ARROW func - this -> _this
                    var row, col;
                    var item: DataItem;
                    var id;
                    var dx = nCols && region.span.x / nCols;
                    var dy = nRows && region.span.y / nRows;
                    var transX = region.center.x - region.span.x / 2; // location of left edge
                    var transY = region.center.y + region.span.y / 2; // location of top edge

                    for (row = 0; row < nRows; row++) {
                        for (col = 0; col < nCols; col++) {
                            id = collectionId + "[" + row + "," + col + "]";
                            item = {
                                id: id,
                                collectionId: collectionId,
                                iRow: row,
                                iCol: col,
                                region: {
                                    center: {
                                        x: transX + dx * (col + 0.5),
                                        y: transY - dy * (row + 0.5)
                                    },
                                    span: { x: dx * fractionalSize, y: dy * fractionalSize }
                                },
                                zoomRange: zoomRange, // Referenced, not copied - referenced 
                                parameterRange: parameterRange // Referenced, not copied
                            };
                            func(item, id, this.dataCollection); // this === _this as this is fat arrow  lambda function
                        }
                    }
                }
            };

            this.getVisbleRange = function (viewport: Region): { rowRange: Interval; colRange: Interval; } {

                // return the range in row-col indexes that represent the region of the grid that is visible.
                if (!nCols || !nRows) {
                    return null;  // { rowRange: { from: NaN, to: NaN }, colRange: { from: NaN, to: NaN } };
                }

                function calcRange(dim: string): Interval {
                    var n = (dim === "x") ? nCols : nRows;
                    var cellSize = region.span[dim] / n;


                    var centerVal = viewport.center[dim];
                    // Express the center relative to orgin of *grid*
                    var gridOrigin = region.center.x - region.span.x / 2 + 0.5 * cellSize;
                    centerVal -= gridOrigin;

                    var range: Interval = {
                        from: (centerVal - viewport.span[dim] / 2),
                        to: (centerVal + viewport.span[dim] / 2)
                    };

                    // Expand viewport region by the size of each item (in world coordinates).
                    // This is a trick to account for the fact that each item is a rectangle, not a point. By expanding the vewport region
                    // we can now treat each item as a point.
                    range.from -= cellSize * fractionalSize * 0.5;
                    range.to += cellSize * fractionalSize * 0.5;


                    // Compute the grid coordinates...
                    var colFrom = range.from / cellSize;
                    var colTo = range.to / cellSize;
                    colFrom = (colFrom >= 0) ? colFrom : 0;
                    colTo = (colTo < n) ? colTo : n - 1;
                    colFrom = Math.ceil(colFrom);
                    colTo = Math.floor(colTo);
                    if (colFrom > colTo) return null; // out of visible range

                    // Final correction - the "y" dimension grid is measured fromm upper right increasing *downwards*!
                    if (dim === "y") {
                        var to = n - 1 - colFrom;
                        colFrom = n - 1 - colTo;
                        colTo = to;
                    }
                    return { from: colFrom, to: colTo };

                }

                var colRange = calcRange("x");
                var rowRange = calcRange("y");

                return (rowRange && colRange) ? { rowRange: rowRange, colRange: colRange } : null;
            }

        };

        validateWorkingList(workingItems: WorkingArtifactList, proxy: ProviderProxy, host: ArtifactHost): void {
            var checkZoom = this.zoomRange && !!proxy.currentNormalizedZoom;
            var checkParameter = this.parameterRange && !!proxy.currentLinearParameter;
            var inZoomRange = !checkZoom || inInterval(proxy.currentNormalizedZoom(), this.zoomRange);
            var inParameterRange = !checkParameter || inInterval(proxy.currentLinearParameter(), this.parameterRange);

            //
            // Find the exact range of items that are expected to be visible.
            //
            var screenRegion = {
                center: { x: 0, y: 0 },
                span: { x: 0, y: 0 }
            };

            var viewPort: Region = {
                center: { x: 0, y: 0 },
                span: { x: 0, y: 0 }
            }
            proxy.getScreenDimensions(screenRegion);
            proxy.convertPointToWorld2D(screenRegion.center, viewPort.center);
            proxy.convertPointToWorld2D({
                x: screenRegion.center.x - screenRegion.span.x / 2,
                y: screenRegion.center.y - screenRegion.span.y / 2
            }, viewPort.span);
            viewPort.span.x = Math.abs(viewPort.span.x - viewPort.center.x) * 2;
            viewPort.span.y = Math.abs(viewPort.span.y - viewPort.center.y) * 2;

            var visibleRange = this.getVisbleRange(viewPort);
            var visibleCount = 0;
            //
            // Verify that all items (from this grid) in the working list are correctly mapped ...
            //           
            workingItems.forEach((workingItem: WorkingArtifact, id) => {

                var sourceItem: TestDataItem = <TestDataItem>workingItem.sourceItem;

                if (workingItem.active && sourceItem.collectionId === this.dataCollection.collectionId) {

                    ok(inInterval(sourceItem.iRow, visibleRange.rowRange), "Active item in visible rows range");
                    ok(inInterval(sourceItem.iCol, visibleRange.colRange), "Active item in visible cols range");
                    visibleCount++;
                    //
                    // Check that each working item is where it should be...
                    //
                    var worldPoint: Point2D = { x: 0, y: 0 };
                    var screenPoint = workingItem.state.display.position.center;

                    proxy.convertPointToWorld2D(workingItem.state.display.position.center, worldPoint);
                    ok(samePoint(worldPoint, workingItem.sourceItem.region.center), "Working artifact center correct");
                    ok(samePoint(worldPoint, workingItem.sourceItem.region.center), "Working artifact center correct");
                }
            });

            // check we have exactly the number of visible items we expect...
            if (visibleCount == 0) {
                ok(!visibleRange || !inZoomRange || !inParameterRange, "No items as expected!");
            }
            if (visibleCount > 0) {

                ok(!!visibleRange, "Nonzero active items when some are within viewport");
                ok(inZoomRange, "Nonzero active items with visible zoom range");
                ok(inParameterRange, "Nonzero active items with visible parameter range");

                var expectedCount = (1 + (visibleRange.colRange.to - visibleRange.colRange.from))
                * (1 + (visibleRange.rowRange.to - visibleRange.rowRange.from));
                ok(visibleCount === expectedCount, "VisibleCount equals expected count!");

            }
        }

    };


    export interface ZoomRangeDictionary {};

    //export interface ItemInitializer any;

    export interface GridOptions {
        gridId: string;
        region: Region;
        nRows: number;
        nCols: number;
        fractionalSize: number; // to get fractional size;
        zoomRange: Interval; // to get zoom range;
        itemInitializer(item: DataItem, options: GridOptions): void;
    };


    export interface HybridGrid {
        addGrid: (options: GridOptions) => void;
        dataCollection: DataCollection;
        validateWorkingList: (workingItems: WorkingArtifactList) => void;
    }


    export function newHybridGrid(hybridId:string, proxy: ProviderProxy, host: ArtifactHost): HybridGrid {

        var grids: Grid[] = [];
        return {

            // WARNING: Do not modify options *after* calling addGrid, because the hybridGrid keeps a reference to options!
            addGrid: function (options: GridOptions): void {
                var grid = new Grid(options.gridId, options.region, options.nRows, options.nCols, options.fractionalSize, options.zoomRange);
                var gridEx = <any>grid;
                gridEx.initOptions = options; // We squirrel away the entire options structure for later use.
                grids.push(grid);
            },

            dataCollection: {
                collectionId: hybridId,
                forEach: function (func: (item: DataItem, id: string, collection?: DataCollection) => void ): void {
                    grids.forEach(function (grid, index) {
                        var gridEx = <any> grid;
                        var options: GridOptions = gridEx.initOptions;
                        grid.dataCollection.forEach(function (item:DataItem, id:string, collection?:DataCollection) {   
                            // For now we re-initialize EACH TIME we enumerate. This is also because
                            // the current grid implementation creates fresh Item instances each time it is enumerated!
                            // TODO: consider switching to cached arrays of items.                        
                            options.itemInitializer(item, options);
                            func(item, id, collection);
                         });
                        
                    });
                }
            },

            validateWorkingList: function (workingItems: WorkingArtifactList) {
                grids.forEach(function (grid, index) {
                        var gridEx = <any> grid;
                        var options: GridOptions = gridEx.initOptions;
                        grid.validateWorkingList(workingItems, proxy, host);                      
                    });
            }
        };
    }
}


// OBSOLETE now we're using qunit. 
//rin.embeddedArtifactTests.runTests();


//
// Register tests with QUnit
//
(function () {
    this.module("Embedded Artifact Tests");

    test("Simple Test", function () {
        rin.embeddedArtifactTests.test0();
    });

    test("Grid Test", function () {
        rin.embeddedArtifactTests.test1();
    });

    test("Hybrid Grid Test", function () {
        rin.embeddedArtifactTests.test2();
    });

    
})();