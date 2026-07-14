# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities through [GitHub private vulnerability reporting](https://github.com/tre-systems/rgou-cloudflare/security/advisories/new). Do not open a public issue for an undisclosed vulnerability.

Include the affected URL or component, reproduction steps, impact, and any suggested mitigation. Please allow time for investigation and a coordinated fix before public disclosure.

## Scope

The supported version is the release currently deployed at [gameofur.org](https://gameofur.org/). Security updates are applied to `main` and deployed from the repository's validated release workflow.

Gameplay and personal statistics stay in browser storage. The application has no account system or database; its only application-owned server-side write is the validated anonymous usage endpoint described in [the architecture](./docs/ARCHITECTURE.md#persistence-and-analytics). Production error reports are privacy-filtered before being sent to Sentry.
