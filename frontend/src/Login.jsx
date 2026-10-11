import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Login({ onLogin, onSignup }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError(
                "Please enter email and password."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Login failed."
                );
            }

            localStorage.setItem(
                "cloudDataToken",
                data.token
            );

            localStorage.setItem(
                "cloudDataUser",
                JSON.stringify({
                    email: data.email,
                })
            );

            onLogin();

        } catch (err) {
            setError(
                err.message ||
                "Unable to connect to server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-logo">
                    ☁
                </div>

                <h1>
                    Cloud Data Management
                </h1>

                <p className="login-subtitle">
                    B+ Tree Indexed Storage
                </p>

                <h2>
                    Welcome Back
                </h2>

                <p className="login-description">
                    Sign in to access your cloud
                    data dashboard.
                </p>

                {error && (
                    <div className="login-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Login"}
                    </button>

                </form>

                <p className="login-footer">
                    Don't have an account?
                </p>

                <button
                    type="button"
                    className="back-login-button"
                    onClick={onSignup}
                >
                    Create Account
                </button>

                <p className="login-security">
                    Secure authentication powered by JWT
                </p>

            </div>

        </div>
    );
}

export default Login;