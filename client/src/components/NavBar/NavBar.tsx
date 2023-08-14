import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../../utils/User';

import styles from './NavBar.module.scss';

export default function NavBar() {

    const navigate = useNavigate();

    const location = useLocation();

    const [ user, setUser ] = useState<User | null>(null);

    useEffect(() => {
        fetch('/api/user/').then((res) => res.json())
            .then((user) => setUser(user))
            .catch((err) => console.error(err));
    }, [ location ]);

    const disconnect = () => {
        fetch('/api/user/disconnect').then(() => {
            navigate('/login');
        }).catch((err) => console.error(err));
    }

    return (
        <nav className={ styles.nav }>
            {
                user ? (
                    <button className={ styles['nav-element'] } onClick={ disconnect }>Disconnect</button>
                ) : (
                    <>
                        <Link to={ '/login' } className={ styles['nav-element'] }>Login</Link>
                        <Link to={ '/register' } className={ styles['nav-element'] }>Register</Link>
                    </>
                )
            }
        </nav>
    );
}