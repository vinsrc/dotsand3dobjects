import * as THREE from "three";

export class ViewportGrid {
  public static createGrid(
    gridSize: number = 100,
    gridDivisions: number = 100,
    centerLineColor: string | number,
    gridLineColor: string | number
  ): THREE.LineSegments {
    const primaryCenterColor = new THREE.Color(centerLineColor);
    const standardGridColor = new THREE.Color(gridLineColor);

    const halfSize = gridSize / 2;
    const stepSize = gridSize / gridDivisions;
    const centerDivisionIndex = Math.round(gridDivisions / 2);

    const lineVertices: number[] = [];
    const lineColors: number[] = [];

    for (
      let divisionIndex = 0;
      divisionIndex <= gridDivisions;
      divisionIndex += 1
    ) {
      const fixedCoordinate = -halfSize + divisionIndex * stepSize;
      const activeColor =
        divisionIndex === centerDivisionIndex
          ? primaryCenterColor
          : standardGridColor;

      // Lines along X axis, segmented into 1-step increments to prevent WebGL line-clipping drops
      for (
        let segmentStart = -halfSize;
        segmentStart < halfSize;
        segmentStart += stepSize
      ) {
        lineVertices.push(
          segmentStart,
          0,
          fixedCoordinate,
          segmentStart + stepSize,
          0,
          fixedCoordinate
        );
        lineColors.push(
          activeColor.r,
          activeColor.g,
          activeColor.b,
          activeColor.r,
          activeColor.g,
          activeColor.b
        );
      }

      // Lines along Z axis, segmented into 1-step increments
      for (
        let segmentStart = -halfSize;
        segmentStart < halfSize;
        segmentStart += stepSize
      ) {
        lineVertices.push(
          fixedCoordinate,
          0,
          segmentStart,
          fixedCoordinate,
          0,
          segmentStart + stepSize
        );
        lineColors.push(
          activeColor.r,
          activeColor.g,
          activeColor.b,
          activeColor.r,
          activeColor.g,
          activeColor.b
        );
      }
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(lineVertices, 3)
    );
    gridGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(lineColors, 3)
    );

    const gridMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      toneMapped: false,
    });

    const gridLineSegments = new THREE.LineSegments(gridGeometry, gridMaterial);
    gridLineSegments.name = "ViewportGrid";
    return gridLineSegments;
  }
}
