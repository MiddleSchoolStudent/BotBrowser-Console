# BotBrowserConsole

BotBrowserConsole is the desktop application for **[BotBrowser](https://github.com/MiddleSchoolStudent/BotBrowser)**, designed to simplify fingerprint configuration and multi-account management. Similar to products like **GoLogin** and **MultiLogin**, BotBrowserConsole offers powerful tools for managing multiple browser profiles and streamlining team collaboration. It also supports API-based secondary development to meet custom requirements.

<img width="600" alt="image" src="https://github.com/user-attachments/assets/3f632574-c8a3-4630-86ec-5730534db47b">

## Features

1. **Create Browser Profiles**

    Easily set up browser profiles for various accounts and use cases.

2. **Fingerprint Configuration**

    Choose from a library of fingerprint configuration files to ensure each profile is unique.

3. **Proxy Setup**

    Configure proxies for individual profiles to ensure secure and anonymous browsing.

4. **Add Fingerprint Noise**

    Customize fingerprint noise to make browser activity more indistinguishable from real users.

5. **Clone Configuration**

    Duplicate existing profiles for faster setup and configuration management.

6. **Run Multiple Isolated Browsers**

    Launch multiple independent browsers with complete data isolation.

7. **Preheat Fingerprint Browsers**

    Prewarm profiles by simulating browsing activity to create more realistic cookies.

8. **Import & Export Profiles**

    BotBrowserConsole allows you to export and import profiles, making it easier for teams to share configurations and maintain consistency across multiple devices and members.

9. **Group Configurations**

    Organize profiles and settings into groups for better management and accessibility.

10. **API Support for Developers**

    For advanced users, BotBrowserConsole provides **API-based secondary development**, enabling seamless integration into custom workflows and automation processes.

## How to Use the App

Follow these steps to set up and run BotBrowserConsole:

1. **Install Neutralino CLI**
   Install the Neutralino CLI globally.

    ```
    npm i -g @neutralinojs/neu
    ```

2. **Install Dependencies**
   Install the necessary project dependencies.

    ```
    npm ci
    ```

3. **Build the Application**
   Build the project.

    ```
    npm run build
    ```

4. **Run the Application**
   Start the application.

    ```
    npm run app
    ```

## Getting Started

1. Download and install BotBrowserConsole.
2. Create your first browser profile.
3. Configure fingerprints, proxies, and additional settings.
4. Start managing your accounts with ease!

## Contact

For support or inquiries, feel free to contact us at [middleschoolstudent@mail.ru](middleschoolstudent@mail.ru).

## Technical Details

-   **Frontend Framework**: [Angular 19](https://angular.dev)
-   **UI Components**: [Angular Material](https://material.angular.io)
-   **Application Runtime**: [Neutralino.js](https://neutralino.js.org)

### Why These Technologies?

#### Why Angular?

1. **Comprehensive API and One-Stop Solution**

    Angular provides a fully integrated solution with comprehensive APIs for routing, state management, forms handling, and dependency injection. This reduces the reliance on third-party libraries and ensures all necessary tools for developing a feature-rich application are available in one framework.

2. **Stability for Long-Term Projects**

    Angular is backed by Google and follows a predictable release schedule with long-term support (LTS). This makes it a reliable choice for projects that require stability, frequent updates, and long-term maintenance.

3. **Strong Focus on Code Organization**

    Angular enforces a highly structured approach with its modular architecture. This makes it easier to scale, debug, and maintain complex projects like BotBrowserConsole, where features such as profile management and API integrations are tightly coupled.

4. **Robust Ecosystem for Enterprise Development**

    With extensive documentation, a large community, and built-in TypeScript support, Angular is designed for large-scale applications. It is particularly well-suited for managing high-performance requirements while maintaining code quality and stability.

#### Why Neutralino.js?

1. **Lightweight and Efficient**

    Neutralino.js leverages the native WebView of the operating system, drastically reducing the application size compared to Electron, which bundles Chromium and Node.js. This lightweight approach ensures the application runs smoothly without overloading system resources.

2. **Optimized for Resource-Intensive Applications**

    BotBrowserConsole requires running multiple isolated browser instances, and Neutralino.js minimizes memory and CPU usage, making it ideal for this use case.

3. **Simplified Maintenance**

    Neutralino.js relies on system-level components rather than bundling its own runtime. This simplifies dependency management, reduces compatibility issues, and ensures the application works seamlessly across different platforms.

4. **Quick Development and Deployment**

    Its straightforward architecture allows for faster development and easier deployment, perfect for tools like BotBrowserConsole that need to be distributed and updated frequently.

---

**BotBrowserConsole** – Simplifying browser fingerprint management for professionals.
