```mermaid
flowchart LR
    %% Actors
    cam[📷 Traffic Camera]
    ai[🤖 AI Engine]
    officer[👮 Traffic Officer]
    admin[🛠️ Admin]
    viewer[👁️ Viewer]
    db[(🗄️ Database)]

    %% System Boundary and Use Cases
    subgraph System [AI Traffic Cop Pro]
        direction TB
        UC1([Monitor Live Video])
        UC2([Detect Violations])
        UC3([Extract Number Plate])
        UC4([Generate Alerts])
        UC5([Log Violation Event])
        UC6([Search Violations])
        UC7([Manage Violations])
        UC8([View Evidence Logs])
        UC9([Generate E-Challan])
        UC10([View Analytics])
        UC11([Manage Users])
        UC12([Configure Settings])
    end

    %% Actor to Use Case Connections
    cam --> UC1
    
    ai --> UC1
    ai --> UC2
    ai --> UC3
    ai --> UC4
    ai --> UC5

    officer --> UC6
    officer --> UC7
    officer --> UC8
    officer --> UC9
    officer --> UC10

    admin --> UC11
    admin --> UC12
    admin --> UC10
    
    viewer --> UC10

    %% Use Case to Database Connections
    UC5 --> db
    UC6 --> db
    UC7 --> db
    UC9 --> db
    UC10 --> db
    UC11 --> db
    UC12 --> db
