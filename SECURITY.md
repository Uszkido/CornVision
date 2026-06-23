# Security Policy

## Supported Versions

The following versions of CornVision AI are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| < v1.0  | :x:                |

## Reporting a Vulnerability

We take the security of CornVision AI seriously. If you find a security vulnerability, please do NOT open a public issue. Instead, follow these steps:

1. Send an email to **Usamaado36@gmail.com** with the subject `SECURITY VULNERABILITY - CornVision`.
2. Include a detailed description of the vulnerability, steps to reproduce, and any potential impact.
3. We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Security Controls

CornVision AI implements the following security measures:
- **JWT Authentication**: All sensitive API endpoints require a valid JSON Web Token.
- **Password Hashing**: Bcrypt encryption is used for all stored credentials.
- **Input Validation**: Rigid Pydantic schemas prevent SQL injection and malformed data.
