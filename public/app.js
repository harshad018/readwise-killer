const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Wait for firebaseAuthMethods to be available on window
        const checkAuth = setInterval(() => {
            if (window.firebaseAuth && window.firebaseAuthMethods) {
                clearInterval(checkAuth);
                const { onAuthStateChanged } = window.firebaseAuthMethods;
                const unsubscribe = onAuthStateChanged(window.firebaseAuth, (currentUser) => {
                    setUser(currentUser);
                });
                return () => unsubscribe();
            }
        }, 100);
        return () => clearInterval(checkAuth);
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = window.firebaseAuthMethods;
        
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(window.firebaseAuth, email, password);
            } else {
                await createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            }
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        const { signOut } = window.firebaseAuthMethods;
        try {
            await signOut(window.firebaseAuth);
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Readwise Killer</h1>
                <p>Your personal knowledge base and spaced repetition system.</p>
            </header>
            <main>
                {user ? (
                    <div>
                        <h2>Welcome back, {user.email}!</h2>
                        <button onClick={handleLogout}>Log Out</button>
                        <p>Your highlights will appear here.</p>
                    </div>
                ) : (
                    <div className="auth-container">
                        <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
                        {error && <p className="error" style={{color: 'red'}}>{error}</p>}
                        <form onSubmit={handleAuth}>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                            <button type="submit">{isLogin ? 'Log In' : 'Sign Up'}</button>
                        </form>
                        <p>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button className="link-button" onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </button>
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
