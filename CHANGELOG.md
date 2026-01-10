2.0.0 January, 10, 2026
 - **BREAKING**: Replaced direct GitHub GraphQL HTTP API with GitHub CLI (`gh`) for improved reliability
 - **BREAKING**: Requires GitHub CLI (`gh`) v2.0+ to be installed and authenticated
 - **NEW**: Authentication is now managed by GitHub CLI (`gh auth login`) instead of environment variables
 - **IMPROVED**: Significantly improved reliability - eliminated timeout issues with the deprecated GraphQL API
 - **IMPROVED**: Built-in rate limit handling via GitHub CLI
 - **IMPROVED**: Better error messages and automatic error handling
 - **IMPROVED**: Comprehensive unit tests
 - **REMOVED**: `GAT` environment variable is no longer used or required
 - **REMOVED**: Direct HTTP/GraphQL implementation code
 - Dependencies: Added RSpec for testing (development only)
 - Internal refactor: Updated `GithubClient` to use subprocess execution via `Open3`
 - Documentation: Updated README with new prerequisites and troubleshooting guide

1.2.1 June, 21, 2022
 - Make specified user more visible in aggregated view.

1.2.0 June, 21, 2022
 - Use `github.com` url for requests by default. Removed config option for
   enterprise URL.

1.1.1 September, 16, 2020
 - Bug fix with defaults not being used properly
 - Bug fix when --users option not specified

1.1.0: September, 14, 2020
 - Finalized the basic features
 - Refactored to improve readability and make contributions easier
 - Created a basic UI
 - Made serious speed improvements (with --cached)
