# Grid Snapping
Add a Grid Snap toggle button to the tool bar.

if its on, then grid snapping is enabled for add new vertex and translate vertex
if its off, then user can place the vertex or translate anywhere

# Clear material button
on selecting a face,  add a clear material button to the top tool bar. its a context sensitive button thats visible  only when face is selected.  it should remove material assignment to the face.

# Add Decal plane
* When a face is selected,  a new context sensitive button called Add Decal plane needs to be added to the top tool bar, docked to the right side. on clicking the Add Decal Plane button,  it adds a plane to the current face, like a sticker,  provide a different color in theme to indicate that its a decal plane.  a transparent light green effect.

The user can tap any decal plane and select it. also, double tap the decal plane to switch to the face orthographic view of the decal plane. the user use rotate mode, translate mode to adjust the decal plane.  he cannot use insert mode, fill mode, delete vertex, center object.  the user can assign a material to a decal plane, this is most likely an image material but we will allow any material.


# Delete Decal Button

Add a Delete Decal Plane Button when a decal is selected. on clicking it, the decal needs to be deleted.  another change is ,  Decal plane can be selected only in the face orthographic view of its parent face.  if a decal plane is touched or double tapped, always select the face or switch to face orthographic view. this reinforces the idea that the decal plane is conceptually a sticker on the face ( a child of the face). refactor code if needed to establish the parent child relationship in the code base.

# Material Library
Add a new top tool bar button called Material Library (use icon). Update the Help screen.

On clicking the button, the Material Library Panel will be shown. On Toggling the button off, Material Library Panel will be hidden.

the 3d view port will show the Material Library Panel on the left side of the 3d view port by default. The user can drag it to the right side by using UI customization button. if both Side Tool bar and Material Library are docked to the same side, the side tool bar will be on left or right most place followed by Material Library Panel.

## Material Library Panel Design:

The Material Library Panel has two sub views, stacked vertically.

### Material list view:
Shows the list of materials used. there are two buttons, + (Add) and X (delete ) in the top most row of the list . clicking + will add a new material, generate name automatically as "Material #" . autogenerate number. on clicking "X" button, it will delete the currently selected material. Disable delete (X) button when no material is selected. show a confirmation dialog for deletion.

### Material detail view:
On selecting the material on the Material list view, the detail view will show the details of the material and allows the user to modify the material. The detail view below the Material List view. the 4 properties shown are Material Name, Base Color (Albedo), Roughness, Metal ness. Any modification is saved automatically. On editing the Material name, it should change in the list view also. The Material detail view has an image file property. the user can set an image to it. A material with image cannot have Base Color, Roughness and Metalness. so disable them if image is set. Enable them if image is unset. Provide a X (Clear) button to clear the image.

## Assigning Material To Faces
The user will be able to select a face by tapping the face, once a face is selected, the material library panel will be shown if its not toggled already. Clicking the multiselect mode will allow the user to select more than one face and assign same material to all of them.

When assigning a material with image, the image is applied on the face using a decal plane i.e. Use a plane to simulate a decal. The user will have to enter the face orthographic view to resize or rotate the decal plane.

## Export To Obj Files
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

# 3d View button 
Add a "'3d View" button to the top most place in the side tool bar. this is the default view.  when user is in translate mode or any other mode, he can click the 3d view button to return to default view.  

# Scale button

Add scale button to the side tool bar. For the main mesh, the scale button provides scale functionality. it will always scale equally in all axis.  add a handle to the four boundary corners like rotate for scaling.   this is just a way to make mesh larger or smaller . not sheer or skew it.  if decal plane is selected, this should scale the decal plane.  

# Export as Zip
add a new file menu item, Export as Zip. it should compress the wavefront obj file , material file and other texture files using in the material into one zip file and save it.

# Import Zip file

add a new file menu item, Import as Zip. the zip file will have the obj, mtl and texture files.

# Confusing Vertex Selection In Insert Mode

In insert mode, adding a new vertex when another vertex is already selected , adds the new vertex in the same plane as the already selected vertex. this is an existing functionality. but in orthographic view,  if there is vertex right behind the point where the new vertex is going to be added, the vertex in the background is getting selected instead.  this stops user from adding vertex in the desired plane.   so if a vertex is already selected, show only the vertices in the currently selected plane. 

for example, if im looking at XZ plane,  looking thru Y axis. if i want to add a vertex at X=3,Z=4, and if  a vertex is selected which is at Y=5,  then current functionality adds the new vertex at X=3,Z=4, Y=5. it takes Y from selected vertex.  but lets say there is a vertex at X=3,Z=4, Y=10.  this directly aligns with the new vertex position in orthographic view. if i click at X=3,Z=4, the vertex at  Y=10 gets selected instead of adding a new vertex at Y=5.  To avoid this issue,  when an vertex is selected, all vertices in planes behind or before gets hidden Y <> 5, only the Y=5 plane and its vertices are shown. then the user can add new vertices in XZ plane without accidentally clicking other vertices directly behind or infront of it.

## Breakdown of the Issue

1. **Orthographic Projection & Coincident Screen Coordinates**:
   - In an orthographic view (e.g., looking along the **Y** axis onto the **XZ** plane), 3D points project flatly: two vertices with the same \((X, Z)\) coordinates but different depth values (e.g., \(Y = 5\) vs. \(Y = 10\)) collapse onto the **exact same 2D screen position**.
   - When a vertex at \(Y = 5\) is selected, the placement plane is anchored at \(Y = 5\) so any new vertex placed in empty space is correctly assigned \(Y = 5\).

2. **The Raycasting Conflict**:
   - When the user clicks at \((X = 3, Z = 4)\) intending to place a new vertex at \((3, 5, 4)\), the viewport raycaster / hit-tester checks against *all* vertices in the model.
   - Because a vertex already exists at \((3, 10, 4)\) (or any other \(Y \neq 5\)), it directly aligns with the cursor position. The raycaster detects this existing vertex and selects it (or connects to it) rather than registering the click as empty space on the \(Y = 5\) plane.

3. **The Solution**:
   - When in an **orthographic view** and a **vertex is selected**:
     - Identify the view axis (e.g., **Y** axis for top/bottom views, **X** for left/right, **Z** for front/back).
     - Retrieve the selected vertex's coordinate along that axis (e.g., \(Y_{\text{selected}} = 5\)).
     - **Active plane vertices**: Vertices on the active plane (\(Y = 5\)) remain fully visible (solid points) and interactable.
     - **Inactive plane vertices**: Instead of hiding vertices on other planes (\(Y \neq 5\)), render them with a low-opacity outline (`opacity: 0.35`). This visually indicates to the user that those vertices reside on an inactive background plane without jarringly making geometry disappear.
     - **Stop selection on inactive planes**: Inactive vertices are strictly excluded from raycasting and hit testing across all modes (`DEFAULT`, `MULTI_SELECT`, `INSERT`, `FILL`), preventing background vertices from intercepting clicks or getting accidentally selected.
   - When no vertex is selected (or in perspective view), all vertices are active, solid, and interactable as usual.

# Pan

Add support for pan.  Two finger drag for panning the 3d view port in orthographic or perspective.  for desktop, right click and drag

# Orient Orthographic view  closest to camera angle.

When switching to an orthographic view (via canvas double-click, 3D gizmo, or face double-click):
1. **Preserve Orientation in the Plane**:
   - The view direction aligns with the target normal/axis (e.g. looking straight down $+Y$ or perpendicular to the face).
   - The camera's **up vector** on that plane must be chosen to be **closest to the user's current screen-up direction** instead of a hardcoded default.
2. **For Standard Principal Views (e.g. $+Y$ / $-Y$ / $\pm X$ / $\pm Z$)**:
   - For an orthographic plane like **XZ**, the valid axis-aligned orientations are $+Z, -Z, +X, -X$.
   - Select the candidate axis that has the greatest dot product with the current camera up vector (or current azimuth), so that:
     - If the user was viewing with $-Z$ up, $-Z$ stays up.
     - If the user was viewing with $+Z$ up, $+Z$ stays up.
     - If viewing sideways ($+X$ or $-X$ up), that rotation is retained without flipping the image upside down.
3. **For Face Orthographic Views**:
   - Project the active camera's current `upDirection` onto the face's plane:
     $$\vec{U}_{\text{projected}} = \vec{U}_{\text{current}} - (\vec{U}_{\text{current}} \cdot \vec{N})\vec{N}$$
   - Pass this projected up vector (or the closest principal in-plane axis if snapping is desired) to [`FaceOrthographicViewStrategy`]rather than falling back to $(0, 0, -1)$.
4. **Synchronize Angles**:
   - Keep `azimuthRadians` and `elevationRadians` in [`CameraStateService`] aligned with the selected up vector so subsequent orbit interactions remain smooth and continuous.