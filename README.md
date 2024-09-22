# Task Management Application

A simple task management application built with Next.js, React, and Axios for handling user authentication and task management.

## Features

- **User Authentication**: Sign up and log in functionality.
- **Task Management**: View, create, and manage tasks.
- **Responsive Design**: Designed to work on various screen sizes.
- **Password Visibility Toggle**: Users can toggle password visibility on the login and signup forms.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Axios
- **UI Components**: ShadCN
- **Icons**: React Icons
- **Environment**: Node.js/Express

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and add your API base URL:
   ```plaintext
   NEXT_PUBLIC_API_BASE_URL=<your_api_base_url>
   ```

### Running the Application

To start the development server, run:

```bash
npm run dev
# or
yarn dev
```

Navigate to `http://localhost:3000` in your browser to view the application.

## Code Overview

### Authentication

- **Login**: Users can log in with their username and password. On successful login, users are redirected to the task list.
- **Signup**: New users can create an account. The application checks for matching passwords and displays error messages if validation fails.

### API Hook

- **useApi**: A custom hook for making API requests with Axios. It automatically redirects to the login page if a 401 Unauthorized error is encountered.

### Task Management

- **Task Component**: Fetches and displays tasks from the API.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any features, improvements, or bug fixes.