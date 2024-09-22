"use client";

import { useState } from 'react';
import axios from 'axios';
import { BiShow, BiHide } from 'react-icons/bi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Function to handle user signup
    // Validates password confirmation and sends a POST request to the signup endpoint.
    // On success, redirects to the task list; on failure, sets error messages.
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Checks if the password and confirm password fields match
        // If they do not match, sets an error message and exits the function early.
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/signup`, { username, email, password }, {
                withCredentials: true
            });

            if (response.status === 201) {
                router.push('/tasklist');
            }
        } catch (error) {
            console.error('Signup failed:', error);

            if (axios.isAxiosError(error) && error.response) {
                const errors = error.response.data.errors;


                const errorMessages = [];
                if (errors.username) errorMessages.push(errors.username);
                if (errors.email) errorMessages.push(errors.email);
                if (errors.password) errorMessages.push(errors.password);

                // Checks for specific Axios errors and updates the error state
                // Collects and joins error messages for username, email, and password from the server response.
                setError(errorMessages.join(', '));
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        }
    };

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
            <form onSubmit={handleSignup} className="p-8 bg-gray-800 rounded shadow-md">
                <h2 className="mb-6 text-2xl font-bold text-center text-white">Sign Up</h2>
                {error && <p className="mb-4 text-red-400">{error}</p>}

                <div className="mb-4">
                    <label htmlFor="username" className="block mb-2 text-sm font-bold text-gray-300">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className="block mb-2 text-sm font-bold text-gray-300">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="password" className="block mb-2 text-sm font-bold text-gray-300">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                            required
                        />
                        <span
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer select-none"
                            onClick={handleShowPassword}
                        >
                            {showPassword ? <BiHide size={24} color="gray" /> : <BiShow size={24} color="gray" />}
                        </span>
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block mb-2 text-sm font-bold text-gray-300">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 text-gray-200"
                            required
                        />
                        <span
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer select-none"
                            onClick={handleShowConfirmPassword}
                        >
                            {showConfirmPassword ? <BiHide size={24} color="gray" /> : <BiShow size={24} color="gray" />}
                        </span>
                    </div>
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white">Sign Up</Button>
            </form>
            <p className="mt-4 text-gray-300">
                Already have an account?{' '}
                <Button variant="link" onClick={() => router.push('/login')} className="text-blue-400">Login</Button>
            </p>
        </div>
    );
}
