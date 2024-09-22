"use client";

import { useState, useRef } from 'react';
import axios from 'axios';
import { BiShow, BiHide } from 'react-icons/bi';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState({ username: '', password: '' });
    const router = useRouter();
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Function to handle user login
    // Sends a POST request with username and password to the login endpoint.
    // On success, redirects to the task list; on failure, sets error messages.
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError({ username: '', password: '' });

        try {
            console.log(process.env.NEXT_PUBLIC_API_BASE_URL);
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`, { username, password }, {
                withCredentials: true
            });

            if (response.status === 200) {

                router.push('/tasklist');
            }
        } catch (error) {
            console.error('Login failed:', error);

            if (axios.isAxiosError(error) && error.response) {
                const errors = error.response.data.errors;

                // Checks for specific Axios errors and updates the error state
                // Displays validation messages for username and password based on the server response.
                setError({
                    username: errors.username || '',
                    password: errors.password || '',
                });
            } else {
                setError({ username: '', password: 'An unexpected error occurred. Please try again.' });
            }
        }
    };

    // Toggles the visibility of the password field
    const handleShowPassword = () => {
        setShowPassword(!showPassword);
        passwordInputRef.current?.blur();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-center text-white">Login</h2>
                {error.username && <p className="mb-4 text-red-400">{error.username}</p>}
                {error.password && <p className="mb-4 text-red-400">{error.password}</p>}

                <div className="mb-4">
                    <label htmlFor="username" className="block mb-2 text-sm text-gray-300 font-bold">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="block mb-2 text-sm text-gray-300 font-bold">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            ref={passwordInputRef}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                            required
                        />
                        <span
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleShowPassword}
                        >
                            {showPassword ? <BiHide size={24} color="gray" /> : <BiShow size={24} color="gray" />}
                        </span>
                    </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">Login</Button>
            </form>
            <p className="mt-4 text-gray-300">
                Don't have an account?{' '}
                <Button variant="link" onClick={() => router.push('/signup')} className="text-blue-400">Sign Up</Button>
            </p>
        </div>
    );
}
