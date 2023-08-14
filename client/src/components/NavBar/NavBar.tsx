import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import styles from './NavBar.module.scss';

import HomeIcon from '../../assets/home.svg';

export default function NavBar() {

    const navigate = useNavigate();

    const location = useLocation();

    const [ connected, setConnected ] = useState(false);

    useEffect(() => {
        fetch('/api/user/check').then((res) => {
            if(res.status !== 200) return setConnected(false);
            return setConnected(true);
        }).catch((err) => console.error(err));
    }, [ location ]);

    const disconnect = () => {
        fetch('/api/user/disconnect').then(() => {
            navigate('/login');
        }).catch((err) => console.error(err));
    }

    return (
        <nav className={ styles.nav }>
            { /* Because of flex-direction we need to put the last element at the start */ }
            {
                connected ? (
                    <>
                        <button className={ styles['nav-element'] } onClick={ disconnect }>Disconnect</button>
                        <Link to={ '/' } className={ styles['nav-element'] }>
                            <img src={ HomeIcon } alt="Home" />
                        </Link>
                    </>
                ) : (
                    <>
                        <div>
                            <Link to={ '/register' } className={ styles['nav-element'] }>Register</Link>
                            <Link to={ '/login' } className={ styles['nav-element'] }>Login</Link>
                        </div>
                    </>
                )
            }
        </nav>
    );
}