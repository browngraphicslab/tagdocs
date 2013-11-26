#!/bin/bash
BUILD_OUTPUT=./build/
REMOVE_BOM=\'"1 s/^\xEF\xBB\xBF//"\'

# Build JS Math.
JSMATH_OUTPUT=$BUILD_OUTPUT/jsmath.js
JSMATH_MIN_OUTPUT=$BUILD_OUTPUT/jsmath.js
rm -rf $JSMATH_MIN_OUTPUT
rm -rf $JSMATH_OUTPUT

for file in `find src/math/ -name *.js -type f`
do
    echo "cat $file | sed -e '1 s/^\xEF\xBB\xBF//' >> $JSMATH_OUTPUT"
    cat $file | sed -e '1 s/^\xEF\xBB\xBF//' >> $JSMATH_OUTPUT
done
#Run closure compiler.
#java -jar ./tools/closurecompiler/compiler.jar --warning_level=VERBOSE --js $JSMATH_OUTPUT --js_output_file $JSMATH_MIN_OUTPUT

# Build 3D library - TODO refactor.
#JS3D_OUTPUT = .\build\js3d.js
#rm -rf $JS3D_OUTPUT
#for %%f in (.\src\application\*.js) do type "%%f" >> .\build\js3d.js
#for %%f in (.\src\common\*.js) do type "%%f" >> .\build\js3d.js
#for %%f in (.\src\content\*.js) do type "%%f" >> .\build\js3d.js
#for %%f in (.\src\graphics\*.js) do type "%%f" >> .\build\js3d.js
#for %%f in (.\src\platform\css3d\*.js) do type "%%f" >> .\build\js3d.js
#for %%f in (.\src\platform\webgl\*.js) do type "%%f" >> .\build\js3d.js
#for %%f in (.\src\platform\flash\*.js) do type "%%f" >> .\build\js3d.js
#java -jar .\tools\closurecompiler\compiler.jar --warning_level=VERBOSE --js .\build\js3d.js --externs .\tools\closurecompiler\externs\jsmath_externs.js --externs .\tools\closurecompiler\externs\webkit_console.js --externs .\tools\closurecompiler\externs\jquery-1.4.4.externs.js --js_output_file .\build\js3d.min.js
#
# Build streetside JS file.
STREETSIDE_OUTPUT=$BUILD_OUTPUT/jsstreetsideviewer.js
rm -rf  $STREETSIDE_OUTPUT
cat "./build/jsmath.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/ConvexPolygonClipper.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/renderer/Renderer.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/renderer/RendererUtils.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/common/Utils.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/common/PolyScan.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/renderer/RendererCSS3D.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/renderer/RendererWebGL.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/graphics/Viewport.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/graphics/PerspectiveCamera.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./src/common/ClassicSpring.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/RMLStore.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/StreetsideCameraController.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/TiledImagePyramid.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/TiledImagePyramidCoverageMap.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/StreetsideCubeFaceTileSource.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/StreetsideRml.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/Panorama.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/StreetsidePanorama.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/MemoryCache.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/PriorityNetworkDownloader.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/TilePriorityCalculator.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
cat "./examples/viewer/app.js" | sed '1 s/^\xEF\xBB\xBF//' >> $STREETSIDE_OUTPUT
