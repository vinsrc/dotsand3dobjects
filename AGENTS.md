# Overview and Vision of the product: 
The goal of the application is to provide a very basic hard surface 3d modelling app, that keeps it simple and focused by allowing very few restricted functionality. just designing wireframes only and a basic default material for flat shaded preview. No smooth shading. The approach of the application is to constrain the workflow into a simple error free approach. Try to stick to this vision and flag any requirements that complicates the modeling workflow. 

For example, the translation of vertices is allowed only in orthographic views. this stops the user from making translation errors into another axis. 

# Tech Stack:

Offline web app that can be bundled into a single HTML file.
React JS
Three JS (Direct Three.js for 3D Viewport)
Typescript with strict typing.
Vitest for unit testing.
Playwright for Functional testing.
Vite bundler
Bun runtime for build and serving files.

# Design Guidelines:

Use a layered architecture. The core architecture is - UI uses controllers that orchestrates multiple services to provide domain functionality. controllers and services are provided by the
application layer.

Follow OOP.  Follow Single Responsibility, Dependency Injection (Constructor Injection only) principes.  SRP is mandatory. Decompose large functionality into classes.
classes should not have more than 10 functions that define behaviors in classes, i.e. excluding constructor, intialization, clean up and other infra functions. The exception to this rule are core primitive classes that provide fine grained operations like a Vector3 class that provides add,subtract, intersect and many more operations. Another exception is manager or facade classes that hides a very complex system. 

Use GOF design patterns whenever possible to decompose complex functionality. For Example, Factory for complex construction of classes with a hierarchy. Strategy pattern for behavioral decomposition.

## Layer Design

UI layer - all classes related to UI. Avoid application logic in UI layer.
Application - classes that have no dependency on UI related code. Application logic.
UI layer depends on Application layer . Never the other way around. 

──UI
   ├── Common - classes shared across UI components.  utilities and shared data models are here.
    No hard rule for the rest of the directory. stick with whatever design guidelines of the UI framework mentioned in the Tech Stack.

Create a separate folder for each service. and group related classes into it. Avoid decomposing into sub folders based on technical design. Exception to this are top level application layer folders (Common,Controllers,Services). For Example, Don't call a folder Factories and place all Factory classes into it. instead group them under a folder name that describes their core function. Below is an example folder structure for Application layer.

├── Application 
│   ├── Common - classes shared across services.
│   ├── Controllers
│   │   ├── AppController.ts
│   ├── Services
│   │   ├── ExampleService1
│   │   │   ├── ExampleService1.ts
│   │   │   ├── Strategy1.ts
│   │   │   ├── Strategy2.ts
│   │   │   ├── StrategyFactory.ts
│   │  ├──ExampleService2 
│   ├── Global classes that help in bootstrapping Services. For example, Config.ts, Route.ts etc.


# Coding Guidelines:

Follow typescript standard.  Name files with pascal case.
if statements should not have more than 4 levels of nesting.
variable names should reflect their purpose, dont name them with single letters.

# Unit Tests :

Write unit tests for all application layer classes. 
Overall 80% code coverage in application layer. but 100% code coverage for functions that define behaviors in classes. 

# Rules:

Dont fetch git repository or push to git repository ever.

# Iteration Delivery :

Read  @docs/workflows/local-iteration-workflow.md and Follow the Iteration Delivery Workflow to deliver the iteration backlog.

