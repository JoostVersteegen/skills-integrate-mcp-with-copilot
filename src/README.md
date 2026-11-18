# Mergington High School Activities API

A simple FastAPI application that lets the public view extracurricular activities and teachers manage registrations.

## Features

- View all available extracurricular activities
- Sign up for activities as a teacher
- Unregister students as a teacher

## Getting Started

1. Install the dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Create the first teacher account:

   ```
   python -m src.manage_teachers
   ```

   Enter a teacher username and password when prompted. The password is stored as a salted hash in the local `src/teachers.json` file, which is excluded from Git.

3. Start the application from the repository root:

   ```
   uvicorn src.app:app --reload
   ```

4. Open your browser and go to:
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/auth/login`                                                     | Sign in as a teacher and start a session                            |
| GET    | `/auth/me`                                                        | Get the signed-in teacher                                           |
| POST   | `/auth/logout`                                                    | End the teacher session                                             |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity (teacher session required)                  |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister a student (teacher session required)                  |

Teacher sessions are held in memory and expire after eight hours. Restarting the server signs out all teachers. For deployment over HTTPS, set `COOKIE_SECURE=true`; do not expose teacher login over plain HTTP.

Activity and session data are stored in memory, so they reset when the server restarts.
