# Grid Snapping
Add a Grid Snap toggle button to the tool bar.

if its on, then grid snapping is enabled for add new vertex and translate vertex
if its off, then user can place the vertex or translate anywhere

# Clear material button
on selecting a face,  add a clear material button to the top tool bar. its a context sensitive button thats visible  only when face is selected.  it should remove material assignment to the face.

# Add Decal plane
* When a face is selected,  a new context sensitive button called Add Decal plane needs to be added to the top tool bar, docked to the right side. on clicking the Add Decal Plane button,  it adds a plane to the current face, like a sticker,  provide a different color in theme to indicate that its a decal plane.  a transparent light green effect.

The user can tap any decal plane and select it. also, double tap the decal plane to switch to the face orthographic view of the decal plane. the user use rotate mode, translate mode to adjust the decal plane.  he cannot use insert mode, fill mode, delete vertex, center object.  the user can assign a material to a decal plane, this is most likely an image material but we will allow any material.

# Material Library
Add a new top tool bar button called Material Library (use icon). Update the Help screen.

On clicking the button, the Material Library Panel will be shown. On Toggling the button off, Material Library Panel will be hidden.

the 3d view port will show the Material Library Panel on the left side of the 3d view port by default. The user can drag it to the right side by using UI customization button. if both Side Tool bar and Material Library are docked to the same side, the side tool bar will be on left or right most place followed by Material Library Panel.

Material Library Panel Design:

The Material Library Panel has two sub views, stacked vertically.

Material list view:
Shows the list of materials used. there are two buttons, + (Add) and X (delete ) in the top most row of the list . clicking + will add a new material, generate name automatically as "Material #" . autogenerate number. on clicking "X" button, it will delete the currently selected material. Disable delete (X) button when no material is selected. show a confirmation dialog for deletion.

Material detail view:
On selecting the material on the Material list view, the detail view will show the details of the material and allows the user to modify the material. The detail view below the Material List view. the 4 properties shown are Material Name, Base Color (Albedo), Roughness, Metal ness. Any modification is saved automatically. On editing the Material name, it should change in the list view also. The Material detail view has an image file property. the user can set an image to it. A material with image cannot have Base Color, Roughness and Metalness. so disable them if image is set. Enable them if image is unset. Provide a X (Clear) button to clear the image.

Assigning Material To Faces
The user will be able to select a face by tapping the face, once a face is selected, the material library panel will be shown if its not toggled already. Clicking the multiselect mode will allow the user to select more than one face and assign same material to all of them.

When assigning a material with image, the image is applied on the face using a decal plane i.e. Use a plane to simulate a decal. The user will have to enter the face orthographic view to resize or rotate the decal plane.

Export To Obj Files
Use Obj PBR extensions to export PBR materials.

* Show X,Y,Z axis in the view. use same colors are 3d gizmo

# Fill Face Mode: 

This is a sub mode of Fill. when fill mode is selected, a new button called Face Fill will be shown in the tool bar. The button will be enabled only when 3 or 4 vertices are selected. when user selects 3 vertices or 4 vertices, and presses Face Fill button, it should create a face with the selected vertices, forming a triangle or a quad face.

^ In Insert mode, placing new vertices seems add the vertex at 0 of the axis through which we looking at. For example, if im looking at XZ plane, the new vertices is placed with Y=0. this requirement is if a vertex is already selected, then placing new vertices will add the vertex with same value of the selected vertex for the axis thru which we are looking at. For example, if orthographic projection is from Z axis, then the value of Z will be same as selected vertex. XY will be wherever the user is placing the vertex.

# Rotate Mode:

add a Rotate mode to the app. add a Rotate button in the side tool bar. when the user enters rotate mode, show four rotate icons at each corner of the boundary of the mesh. the rotate mode needs a orthographic view. follow same implementation like translate.

# File Menu
Add a file menu in the top tool bar that has the Load .obj, Export .obj. Move export and load obj functionality from Top tool bar buttons into the File menu

# Side Tool Bar

Add a new tool bar to the right hand, vertically placed buttons, docked to the right edge of the view. This is called the Side Tool bar.

Undo, Redo, Center Object, Multi selection, Clear selection, Delete vertex, Insert, Translate, Fill, Grid Snap toggle - These buttons should the part of the Side tool bar.

Clear selection button is only enabled when at least one vertex is selected.
Delete vertex button is only enabled when at least one vertex is selected.

Mode Specific Buttons:

The Mode sensitive buttons that are only shown in its applicable mode when certain conditions are fulfilled, Right align, horizontally stack the Mode Specific buttons.

make the below as Mode specific buttons specific.

Face Fill button - Only shown in fill mode. enabled only when at least 3 vertices are selected.
Auto Connect On/Off button - Only shown in insert mode.

# Direct 3D View Port Rotation

The user will be able to drag his mouse or finger across the 3d view port, and rotate the view like rotating the 3d axis gizmo. The 3d axis gizmo should reflect the rotation.

The user will be able to double tap or double click the 3d view port and the view port switches to the closest orthographic projection view.

The 3d view port rotation, and projection should be always in sync with the 3d Axis gizmo

# Face Orthographic View

The user shall be able to select a face by taping on a face of the mesh.

On double tapping on the face, the 3d View port rotates to an orthographic view of the face. this is considered an orthographic view and the user is allowed to perform operations that are restricted to an orthographic view like insert, translate.

# Import Improvements

the workflow is the current app to blender. refine in blender and back to the app. using obj file as the intermediary.

the user might have modified material properties in blender, when importing into the app, retain the properties that are not visible to the user. so that when exporting back to blender, those properties are intact. For example, in blender the user might have set a normal map and exported the obj file. but our application doesnt support setting normal maps, but our application should retain the property so that when the user exports from our application to blender, the properties are still present.

# UI Customization

Under the file Menu, add a menu item called "Customize UI", it should show a dialog , with two form fields. the form has a Save and Close button.

Side Tool Bar: Left Side toggle button Right Side
Material Library: Left Side toggle button Right Side

if side tool bar is toggled on, then the side tool bar is docked on the right side of the 3d view port else its docked to the left side.
if Material Library is toggled on, then the Material Library is docked on the right side of the 3d view port else its docked to the left side.

if both side tool bar and Material library are docked to the same side, then side tool bar and Material library are horizontally stacked. with side tool bar being at the left or right most item.

# Set Face Normal

in a face orthographic view, add a button to the top tool bar called set front. if user clicks on the set front button, then the current orthographic view is set as the front side of the face. re-order vertices for the face to reflect the front side.

# UX Improvements

in insert mode, if a vertice is already selected and if another existing vertex is selected and auto connect is ON, then both vertices should connect. and the last selected vertex remains selected. this is like filling the polygon.

if two vertices are already and selected and the user enters fill mode, these vertices should be automatically connected with an edge. this is like capturing the intent of the user better. he enters fill mode to start connecting vertices.