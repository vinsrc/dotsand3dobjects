
New Functionality:

* Clear Selection Tool bar button - clears the current selection of vertices.
* Tapping again on a selected vertex should clear the selection. 
* Translate mode should allow the user to select different vertices and move them. Right now only one vertice can be selected. it doesnt allow another vertex to be selected.
* Add undo and redo functionality for selection, translation, fill, insert, add operations.
* Delete Vertex Tool bar button - The user can select vertices and use this button to delete the vertices.
* Remove Finish button. The modes can be freely selected. Selecting a new mode, finishes the existing mode.
* In any other mode other than Multi Select mode, tapping on a vertex should clear the multiple vertex selections and only select the current vertex.
* Remove Add mode.  Add that functionality in Insert Mode.  Insert Mode will now allow the user to places vertices and if taps on an edge, it places the vertex in the middle of the edge.

Issues:

* In the shaded mode, the vertices are behind the model, make sure they are fully visible and are infront of the model.
* In fill mode, on selecting the new vertex and after the edge is connected, the old selection should be unselected.