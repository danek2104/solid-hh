# Migrant App Backend

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Database:**
    *   Ensure you have PostgreSQL installed and running.
    *   Create a database (e.g., `migrant_db`).
    *   Run the schema script to create tables:
        ```bash
        psql -U your_db_user -d migrant_db -f schema.sql
        ```

3.  **Configuration:**
    *   Copy `.env` and update the values with your database credentials.
    
4.  **Run:**
    ```bash
    node server.js
    # or with nodemon if installed:
    # npx nodemon server.js
    ```

## API Endpoints

*   **Users:**
    *   `POST /api/users/register` - Register new user
    *   `GET /api/users/:id` - Get user profile
*   **Jobs:**
    *   `GET /api/jobs` - List all jobs
    *   `POST /api/jobs` - Create a job
    *   `GET /api/jobs/:id` - Get job details
*   **Applications:**
    *   `POST /api/applications` - Apply for a job
    *   `GET /api/applications/user/:userId` - Get user's applications
