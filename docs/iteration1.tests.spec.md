# Iteration 1 Functional Test Specification

## 1. Pan Gestures & Center Object
- **Requirement**: Add Pan using double finger drag. Add a toolbar button "Center Object" which will reset the pan and bring the object to the center of the view.
- **Test Case 1.1**: Toolbar displays "Center Object" button.
- **Test Case 1.2**: Clicking "Center Object" resets pan and recenters object in the viewport.

## 2. Toolbar & UI Mode Controls
- **Requirement**: Add a button in the toolbar to enter each mode (Add, Multi Select, Translate, Insert, Fill). When in an active mode, a "Finish" button appears in the toolbar to exit back to default mode.
- **Test Case 2.1**: Toolbar renders buttons for Add, Multi Select, Translate, Insert, and Fill modes. Finish button is hidden in default mode.
- **Test Case 2.2**: Entering any active mode reveals the Finish button; clicking Finish exits the mode and returns to default mode.

## 3. Orthographic View Restrictions
- **Requirement**: Add and Translate modes are restricted to orthographic views. If entered while in perspective view, display alert message "Switch to an Orthographic view".
- **Test Case 3.1**: Triggering Add Mode in perspective view shows alert modal with "Switch to an Orthographic view" and dismiss button.
- **Test Case 3.2**: Triggering Translate Mode in perspective view shows alert modal with "Switch to an Orthographic view" and dismiss button.

## 4. Single Vertex Select Mode (Default Mode)
- **Requirement**: Select single vertex by tapping on it. Default mode, always enabled with no toggle button.
- **Test Case 4.1**: Clicking a vertex in default mode selects it. Clicking empty viewport space deselects it.

## 5. Add Mode & Auto Connect
- **Requirement**: In orthographic view, user places vertices snapping to nearest grid point. Auto Connect toggle button in toolbar automatically connects placed vertices with edges.
- **Test Case 5.1**: In orthographic view, entering Add Mode shows Auto Connect toggle and Finish button.
- **Test Case 5.2**: Toggling Auto Connect switches between OFF and ON. Placing vertices on the canvas successfully adds vertices / edges to geometry.

## 6. Multi Select Mode
- **Requirement**: User can select multiple vertices in the viewport.
- **Test Case 6.1**: Entering Multi Select Mode allows selecting multiple vertices consecutively without losing prior selections until Finish is clicked.

## 7. Translate Mode
- **Requirement**: User can translate selected vertices in orthographic view by dragging them, restricted to the active view plane (e.g., in X view, translates only in YZ plane).
- **Test Case 7.1**: In orthographic view, dragging on canvas in Translate Mode translates selected vertices along the active plane constraints.

## 8. Insert Mode
- **Requirement**: Touching an edge inserts a new vertex in the middle of the edge.
- **Test Case 8.1**: Clicking near an edge in Insert Mode splits the edge with a midpoint vertex.

## 9. Fill Mode
- **Requirement**: Selecting a vertex and then another vertex connects them with an edge, keeping the last tapped vertex selected for continuous edge creation.
- **Test Case 9.1**: Clicking vertices sequentially in Fill Mode connects them with edges. Clicking Finish exits back to default mode.
