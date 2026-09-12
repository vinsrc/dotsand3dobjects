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