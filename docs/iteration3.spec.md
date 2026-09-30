# Iteration 3 - Export as Zip File

New Functionality:

* Add a new File Menu menu item called "Export as Zip".
* Clicking "Export as Zip" compresses the Wavefront OBJ file, the OBJ PBR
  material (.mtl) file, and all texture image files used by the materials
  into a single Zip archive and downloads it as `<modelName>.zip`
  (default `model.zip`).

Requirements:

* The zip archive always contains the Wavefront OBJ file (`<baseName>.obj`).
* The zip archive contains the material file (`<baseName>.mtl`) when at least
  one material exists in the Material Library.
* The zip archive contains the texture image files referenced by image
  materials. Only images whose data is available in the app (data URLs) are
  bundled. Texture references in the MTL that point to external files the app
  does not hold data for (e.g. files referenced in a loaded `.mtl`) are
  preserved verbatim for round-tripping (see Import Improvements), but the
  texture bytes are not bundled into the archive.
* Texture entries whose name contains path separators or `..`, whose name
  collides with the reserved `.obj` / `.mtl` entry names, or whose data URL
  cannot be decoded are skipped from the archive. The `.obj` / `.mtl` entries
  are always authoritative.
* OBJ PBR extension references (mtllib, map_Kd) remain intact and match the
  bundled file names so the exported package loads in external tools
  (e.g. Blender).
* The entry `data-testid="export-zip-button"` is used for functional testing.