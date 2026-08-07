const { useState, useEffect } = React;

function App() {
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Wait for firebase to load
        const checkAuth = setInterval(() => {
            if (window.firebaseAuth && window.firebaseAuthMethods) {
                clearInterval(checkAuth);
                window.firebaseAuthMethods.onAuthStateChanged(window.firebaseAuth, (user) => {
                    setUser(user);
                });
            }
        }, 100);
        return () => clearInterval(checkAuth);
    }, []);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await window.firebaseAuthMethods.signInWithEmailAndPassword(window.firebaseAuth, email, password);
            } else {
                await window.firebaseAuthMethods.createUserWithEmailAndPassword(window.firebaseAuth, email, password);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        try {
            await window.firebaseAuthMethods.signOut(window.firebaseAuth);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Readwise Killer</h1>
                <p>Your personal knowledge base and spaced repetition system.</p>
                {user && <button onClick={handleLogout} style={{marginTop: '10px'}}>Logout</button>}
            </header>
            <main>
                {user ? (
                    <div>
                        <h2>Welcome back, {user.email}!</h2>
                        <p>Your highlights will appear here.</p>
                    </div>
                ) : (
                    <div className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto'}}>
                        <h2>{isLogin ? 'Log In' : 'Sign Up'}</h2>
                        {error && <p style={{color: 'red', fontSize: '0.9em'}}>{error}</p>}
                        <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                style={{padding: '8px'}}
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                style={{padding: '8px'}}
                            />
                            <button type="submit" style={{padding: '10px', cursor: 'pointer'}}>{isLogin ? 'Log In' : 'Sign Up'}</button>
                        </form>
                        <p onClick={() => setIsLogin(!isLogin)} style={{cursor: 'pointer', color: 'blue', textAlign: 'center', fontSize: '0.9em'}}>
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);