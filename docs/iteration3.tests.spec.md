# Iteration 3 Functional Test Specification

## 1. Export as Zip Menu Item
- **Requirement**: Add a "Export as Zip" item to the File menu.
- **Test Case 1.1**: The File menu dropdown displays "Export as Zip"
  (`data-testid="export-zip-button"`).

## 2. Zip Archive Contents with Materials and Texture
- **Requirement**: Clicking "Export as Zip" compresses the OBJ, the MTL, and the
  material textures into a single zip archive and downloads it as `model.zip`.
- **Test Case 2.1**: With an image material assigned to a face, "Export as Zip"
  downloads a single `model.zip` file.
- **Test Case 2.2**: The downloaded file is a valid ZIP archive (starts with the
  `PK` signature) and contains exactly `model.obj`, `model.mtl`, and the
  texture file name (e.g. `cool_decal.png`).
- **Test Case 2.3**: The `model.obj` entry references `mtllib model.mtl` and the
  assigned material (`usemtl StickerMat`).
- **Test Case 2.4**: The `model.mtl` entry references the texture via
  `map_Kd <texture name>` and does not contain base64 image data.
- **Test Case 2.5**: The bundled texture bytes match the original image (PNG
  signature).

## 3. Zip Archive Contents Without Materials
- **Requirement**: The archive always contains the Wavefront OBJ file.
- **Test Case 3.1**: With no materials created, "Export as Zip" downloads
  `model.zip` containing only `model.obj`, whose content contains vertex and
  face lines.

## 4. Unit Test Coverage Requirements
- **Requirement**: Application layer unit tests cover the zip export feature and
  meet the coverage thresholds in `AGENTS.md` (>= 80% overall, 100% on
  behavioral functions of the new classes).
- **Test Case 4.1**: `ZipExportService.buildZip` is covered by round-trip unit
  tests (empty and multi-file cases).
- **Test Case 4.2**: `DataUrlConverter.toUint8Array` behavior is covered
  (base64, PNG signature, percent-encoded text, plain text, url-safe base64,
  uppercase BASE64 header, invalid base64, malformed percent encoding).
- **Test Case 4.3**: `AppController.exportModelAsZip` is covered for OBJ-only,
  OBJ+MTL+texture, non-data URL exclusion, reserved-name collision skip, unsafe
  path segment skip, and undecodable data-URL skip.

## 5. Standalone Offline Bundling
- **Requirement**: The app bundles into a single offline HTML file.
- **Test Case 5.1**: `bun run build` completes without errors and produces a
  single `dist/index.html` with all dependencies (including the compression
  library) inlined.