# Iteration 2 Functional Test Specification

## 1. Clear Selection Toolbar Button
- **Requirement**: Add a "Clear Selection" toolbar button that clears the current selection of vertices.
- **Test Case 1.1**: Toolbar displays "Clear Selection" button (`data-testid="clear-selection-button"`).
- **Test Case 1.2**: Clicking "Clear Selection" with selected vertices clears all active and multi-selected vertices.

## 2. Vertex Deselection on Second Tap
- **Requirement**: Tapping again on an already-selected single vertex deselects it.
- **Test Case 2.1**: Tapping an unselected vertex selects it. Tapping the same vertex again immediately deselects it.

## 3. Translate Mode Vertex Selection and Dragging
- **Requirement**: Translate mode allows the user to select different vertices and move them. Supports single and multi-selection dragging.
- **Test Case 3.1**: In orthographic view, user can click unselected vertices to select them for translation without switching modes.
- **Test Case 3.2**: Dragging in Translate Mode moves all currently selected vertices along the active orthographic plane.

## 4. Undo and Redo Functionality
- **Requirement**: Add Undo and Redo buttons in the toolbar for selection, translation, fill, insert, add operations, and vertex deletions.
- **Test Case 4.1**: Toolbar renders "Undo" (`data-testid="undo-button"`) and "Redo" (`data-testid="redo-button"`) buttons, initially disabled.
- **Test Case 4.2**: Performing a selection, vertex insertion/addition, edge fill, translation, or deletion enables Undo.
- **Test Case 4.3**: Clicking Undo reverts the mesh geometry and vertex selection to the prior snapshot, and enables Redo.
- **Test Case 4.4**: Clicking Redo re-applies the undone changes.

## 5. Delete Vertex Toolbar Button
- **Requirement**: Add a "Delete Vertex" toolbar button. The user can select vertices and click this button to delete the selected vertices and remap all edges and faces.
- **Test Case 5.1**: Toolbar renders "Delete Vertex" button (`data-testid="delete-vertex-button"`).
- **Test Case 5.2**: Selecting vertices and clicking "Delete Vertex" removes the vertices, cleans up connected edges and faces, remaps remaining indices, and clears selection.

## 6. Removal of Finish Button & Free Mode Switching
- **Requirement**: Remove Finish button. Modes can be freely switched at any time. Selecting a new mode finishes the existing mode.
- **Test Case 6.1**: Toolbar does NOT display a Finish button (`data-testid="mode-finish-button"` is absent).
- **Test Case 6.2**: Clicking any mode button switches to that mode directly; clicking an active mode button or selecting another mode terminates the prior mode.

## 7. Single Vertex Selection Isolation in Non-Multi-Select Modes
- **Requirement**: In any mode other than Multi Select mode, tapping on a vertex clears multi-selection and only selects that vertex.
- **Test Case 7.1**: Having multiple vertices selected from Multi Select mode, switching to Default, Translate, Insert, or Fill mode and clicking a vertex clears multi-selection and isolates selection solely to that clicked vertex.

## 8. Unified Insert Mode (Merged Add Mode)
- **Requirement**: Remove Add mode. Insert Mode handles both placing vertices on the grid in open space (with Auto Connect toggle) and splitting edges at their midpoint when tapping on an edge.
- **Test Case 8.1**: Toolbar does NOT display "Add Mode" button (`data-testid="mode-add-button"` is absent).
- **Test Case 8.2**: In Insert Mode, tapping an edge inserts a midpoint vertex.
- **Test Case 8.3**: In Insert Mode, tapping open space in orthographic view places a grid-snapped vertex (with Auto Connect if enabled). Tapping open space in perspective view alerts "Switch to an Orthographic view".

## 9. In-Front Vertex Visibility in Shaded Mode
- **Requirement**: In shaded mode, vertices must be fully visible and rendered in front of the model without occlusion.
- **Test Case 9.1**: In Shaded View, vertex points and selection handles render with `depthTest = false` and elevated render order, remaining visible even when behind or coplanar with shaded faces.

## 10. Fill Mode Selection Transition
- **Requirement**: In fill mode, on selecting the new vertex and after the edge is connected, the old selection is unselected and only the newly connected vertex remains selected.
- **Test Case 10.1**: In Fill Mode, tapping vertex A and then vertex B connects them with an edge, clears selection on A, and selects only B.
