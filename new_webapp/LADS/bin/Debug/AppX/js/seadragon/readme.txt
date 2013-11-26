These files are meant to be included in the top level of the zip that we create
and distribute publicly. Ideally, our build script would do this, but we don't
have that logic there yet, so we need to zip up our tree manually and add these
files to the top level of that zip manually.

The structure of the zip should look something like this:
+ doc/
+ img/
+ logo_files/
+ src/
+ build.py
+ jsmin.py
+ license.txt
+ logo.dzi
+ sample.html
+ seadragon-dev.js