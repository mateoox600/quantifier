
import { FormEvent, useState } from 'react';
import styles from './Register.module.scss';
import { useNavigate } from 'react-router-dom';

export default function Register() {

    const navigate = useNavigate();

    const [ error, setError ] = useState('');

    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ passwordConfirm, setPasswordConfirm ] = useState('');

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();

        fetch('/api/user/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email, password, passwordConfirm
            })
        }).then(async (response) => {
            const statusText = await response.text();

            if(statusText === 'password != passwordConfirm') return setError('Password and password confirm must be the same.');
            else if(statusText === 'email format not valid') return setError('Email is not valid.');
            else if(statusText === 'username format not valid') return setError('Username is not valid');
            else if(statusText === 'password format not valid') return setError('Password must be at least 8 charaters long, and it must contains no whitespaces.');
            else if(statusText === 'email is already taken') return setError('Email is already used on another account');

            navigate('/login');
        }).catch((err) => console.error(err));
    };

    return (
        <div className={ styles['register'] }>
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
                <input
                    type="password"
                    placeholder="Password Confirm"
                    className={ styles['form-field'] }
                    value={ passwordConfirm }
                    onChange={ (e) => setPasswordConfirm(e.target.value) }
                />
                <p>
                    { error }
                </p>
                <button type="submit">
                    Create Account
                </button>
            </form>
        </div>
    );
}