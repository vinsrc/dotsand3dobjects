* face fill is not a submode of fill mode anymore. show it always. just enable it when there are more than 3 vertices selected.
Move the face fill button below fill button.

* if two vertices are selected , then on entering draw edge it should connect them with an edge
* change short cut for multiselection, when shift key is pressed in the desktop,  it turns on Multi selection, when shift key is released , its toggled off

* Add a transform button in side tool bar , that shows rotate, scale, in the boundary of the mesh. and translate handle in the middle of the mesh.  use the same for Decal plane. Remove rotate and scale button. then rename translate button to Move Vertex. remove decal translate function from Move vertex button. 

* add a short cut , V - Equivalent to double clicking the view to move to the closest orthographic view. if a face is selected, then pressing V will move to face orthographic view.

* Ability to select an Edge. on clicking an edge , it should be selected. Multi selection allows multiple edge to be selected at the same time. then, add a Edge Delete button to side tool bar, its enabled when Edge is selected. on clicking the button, the Edge only is deleted. the vertices are left in place.

* add a Face delete button to side tool bar, its enabled when face is selected. on clicking the button, the face only is deleted. the edges are left in place. if there is a decal plane as child, then raise an alert saying "Decal plane should be deleted before deleting Face"

* Provide the ability to select edges (single click and multi-select), highlight selected edges in the viewport, and add a Delete Edge button grouped with Delete Vertex and Delete Face in the side toolbar.
Edge Deletion Constraint: If an edge is part of a face, deletion is disallowed and raises an error via ERROR_OCCURRED: "Face should be deleted before deleting Edge". Only standalone edges (e.g. created with Draw Edge or remaining after a face is deleted) can be deleted. Vertices remain intact.

* the UI Customization settings are lost every time i refresh the page.  persist it

* if i move a vertex to a point where there is another vertex, merge the current vertex with existing one.  plan first

* Show sub grid lines. 1/4. snapping to snap to 1/4 lines. the grid unit is still 1. this is to make sure finer move vertex with grid snapping on.

* Grid Snapping - it should snap to the near grid. now its just jumping one unit during move vertex or other translations. not really a snap.

* Add a button to Top tool called, Show Orthographic View - this button does the orienting to nearest orthographic view, the V shortcut or double clicking provides this functionality. More clearer for tablet users. Remove the double click or double tap to orthographic view. its causing selections to go away. Desktop users can use V key instead.

* Move the following buttons to top tool bar - Undo,Redo, Multi Selection, Clear Selection, Grid Snap . They are no specific to the mesh. global functionalities.