del /Q .\build\jsmath.js
for %%f in (.\src\math\*.js) do .\tools\concat.exe "%%f" >> .\build\jsmath.js
java -jar .\tools\closurecompiler\compiler.jar --warning_level=VERBOSE --js .\build\jsmath.js --js_output_file .\build\jsmath.min.js

del /Q .\build\js3d.js
for %%f in (.\src\common\*.js) do .\tools\concat.exe "%%f" >> .\build\js3d.js
for %%f in (.\src\content\*.js) do .\tools\concat.exe "%%f" >> .\build\js3d.js
for %%f in (.\src\graphics\*.js) do .\tools\concat.exe "%%f" >> .\build\js3d.js
for %%f in (.\src\platform\css3d\*.js) do .\tools\concat.exe "%%f" >> .\build\js3d.js
for %%f in (.\src\platform\webgl\*.js) do .\tools\concat.exe "%%f" >> .\build\js3d.js
for %%f in (.\src\platform\flash\*.js) do .\tools\concat.exe "%%f" >> .\build\js3d.js
java -jar .\tools\closurecompiler\compiler.jar --warning_level=VERBOSE --js .\build\js3d.js --externs .\tools\closurecompiler\externs\jsmath_externs.js --externs .\tools\closurecompiler\externs\webkit_console.js --externs .\tools\closurecompiler\externs\jquery-1.4.4.externs.js --js_output_file .\build\js3d.min.js

del /Q .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\build\jsmath.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\common\Config.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\common\Utils.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\renderer\Renderer.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\renderer\RendererUtils.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\common\MemoryCache.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\common\PriorityNetworkDownloader.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\common\FloodFill.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\renderer\Quirks.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\renderer\RendererCSS3D.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\renderer\RendererWebGL.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\graphics\Viewport.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\graphics\PerspectiveCamera.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\src\common\ClassicSpring.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\RMLStore.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\StreetsideCameraController.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\TiledImagePyramid.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\TiledImagePyramidCoverageMap.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\TiledImagePyramidCuller.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\StreetsideCubeFaceTileSource.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\StreetsideRml.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\Panorama.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\StreetsidePanorama.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\GestureHelper.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\QueuedGestureHelper.js" >> .\build\jsstreetsideviewer.js
.\tools\concat.exe ".\examples\viewer\RWWViewer.js" >> .\build\jsstreetsideviewer.js


del /Q .\build\jspanoviewer.js
.\tools\concat.exe ".\build\jsmath.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\common\Config.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\common\Utils.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\renderer\Renderer.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\renderer\RendererUtils.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\common\MemoryCache.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\common\PriorityNetworkDownloader.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\common\FloodFill.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\renderer\Quirks.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\renderer\RendererCSS3D.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\renderer\RendererWebGL.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\graphics\Viewport.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\graphics\PerspectiveCamera.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\src\common\ClassicSpring.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\RMLStore.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\RotationalFixedPositionCameraController.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\TiledImagePyramid.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\TiledImagePyramidCoverageMap.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\TiledImagePyramidCuller.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\PhotosynthRml.js" >> .\build\jspanoviewer.js
REM Note we don't include streetside stuff.
.\tools\concat.exe ".\examples\viewer\Panorama.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\AttributionControlNoJQuery.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\GestureHelper.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\QueuedGestureHelper.js" >> .\build\jspanoviewer.js
.\tools\concat.exe ".\examples\viewer\RWWViewer.js" >> .\build\jspanoviewer.js

REM drop CSS into the build dir
copy /y ".\examples\viewer\style.css" ".\build\style.css"
