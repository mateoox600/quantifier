
import { FormEvent, useState } from 'react';
import styles from './Login.module.scss';
import { useNavigate } from 'react-router-dom';

export default function Login() {

    const navigate = useNavigate();

    const [ error, setError ] = useState('');

    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        fetch('/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email, password
            })
        }).then(async (response) => {
            const statusText = await response.text();

            if(statusText === 'Already logged-in') return setError('Critical error: you cannot login while still being logged in.');
            else if(response.status == 404) return setError('Email or password not valid.');

            navigate('/');
        }).catch((err) => console.error(err));
    };

    return (
        <div className={ styles['login'] }>
            <form onSubmit={ onSubmit }>
                <input
                    type="email"
                    placeholder="Email"
                    className={ styles['form-field'] }
                    value={ email }
                    onChange={ (e) => setEmail(e.target.value) }
                />
                <input
                    type="password"
                    placeholder="Password"
                    className={ styles['form-field'] }
                    value={ password }
                    onChange={ (e) => setPassword(e.target.value) }
                />
                <p>
                    { error }
                </p>
                <button type="submit">
                    Login
                </button>
            </form>
        </div>
    );
}