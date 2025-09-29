# Dev Server Logging & Debugging Guide

## Dev Server Logs

-   **View last 100 lines of dev server log (recommended):**

    ``` bash
    tail -100 logs/dev-server.log
    ```

-   **View entire dev server log:**

    ``` bash
    cat logs/dev-server.log
    ```

-   **Manually rotate logs (archives old, cleans up 7+ days):**

    ``` bash
    ./scripts/rotate-dev-logs.sh
    ```

## Browser Console Integration

-   Next.js shows browser console logs in the dev server output (via the
    `browserDebugInfoInTerminal` experiment).
-   This includes:
    -   `console.log`
    -   `console.error`
    -   Other browser debugging output
-   **Check `logs/dev-server.log`** for both server-side and client-side
    debugging information.

> This feature consolidates all logs in one place, helping you debug
> faster.
