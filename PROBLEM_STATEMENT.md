# Problem Statement Mapping

This repository directly addresses the requirements of the "Build a Carbon Tracking Companion" challenge.

## The Challenge
The core problem asks for an application where users can log their daily trips and immediately understand their environmental impact. This is not just a standard carbon calculator—it requires a companion character whose mood visually reacts to the user's rolling carbon footprint trend. Furthermore, the application must integrate a client-side call to the Gemini API to provide educational, persona-tailored "fact cards" after each logged trip. The solution must feature a secure authentication system without managing raw passwords and be deployed robustly to Google Cloud Run.

## How 3040 Self Addresses It
- **Mood-Reactive Companion**: Our pure CSS mascot companion dynamically changes expressions (happy, sad, angry) based on the user's 3-day carbon rolling average, calculated deterministically from Firestore data.
- **Trip Logging & Math**: The application collects trip parameters (transport mode, distance). Pure functions map these parameters to fixed, published emission coefficients to accurately compute CO2 impact.
- **Client-Side Gemini Fact Card**: After every trip, the frontend calls the Gemini 1.5 Flash API directly from the client to generate an educational insight tailored to the user's chosen persona (kid/friend/elder). It handles potential failures gracefully with context-aware, hardcoded mock fallbacks.
- **Secure Authentication**: We utilize Firebase Authentication with Passwordless Email Links (Magic Links). This securely authenticates users while shifting the burden of password management entirely to Firebase, minimizing security risks.
- **Robust Deployment**: The application is containerized via a production-grade multi-stage Dockerfile and deployed reliably to Google Cloud Run.
