'use client';

import { useState } from 'react';

export default function TestAIPage() {
    const [githubUrl, setGithubUrl] = useState('');

    async function analyzeGithub() {
        console.log("Button Clicked");

        const response = await fetch("/api/github/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                githubUrl,
            }),
        });

        const data = await response.json();

        console.log(data);
    }
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-[500px] space-y-4">

                <h1 className="text-3xl font-bold">
                    GitHub AI Tester
                </h1>

                <input
                    className="border p-3 rounded w-full"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                />

                <button
                    onClick={analyzeGithub}
                    className="bg-blue-600 text-white px-4 py-3 rounded w-full"
                >
                    Analyze GitHub
                </button>


            </div>
        </div>
    );
}