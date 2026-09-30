
# Add Pan using gestures

Add Pan using double finger drag. Add a tool bar button , Center Object - which will reset the pan and bring the object to the center of the view.

# UI Modes:

The UI has different modes to keep the workflow streamlined.

* Single Vertex Select Mode - Select single vertex by tapping on it. This is the default mode and has no button to toggle it. its always enabled. 
* Multi Select Mode - The user can select multiple vertices. 


* Add Mode - The user can place vertices. Vertices always snap to the nearest grid point. Add a Auto Connect Toggle button in the tool bar. Switching on will automatically connect vertices with an edge as the user places them.

* Translate Mode - User can translate selected vertices in orthographic view by dragging them. if its showing the view from X axis , and when user moves a vertex, then it should translate only in YZ plane. 
* Insert Mode - when the user touches an edge, a new Vertex should be added in the middle of the edge.
* Fill Mode -  The user selects a vertex, and when the user selects another vertex, it should connect them with an edge and so on. Keep the last tapped vertex selected so that the user can continue to connect all the vertices as desired.

* Add a button in the tool bar to enter each of the above modes. When the user has entered a mode, add a Finish button in the tool bar that allows the user to exit back to default mode.

* Add,Translate Modes are  restricted to orthographic view. show alert message saying "Switch to an Orthographic view" if the user is not in orthographic view.