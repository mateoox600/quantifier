import { Outlet } from 'react-router-dom';
import NavBar from './components/NavBar/NavBar';

export default function Root() {

    return (
        <>
            <NavBar />
            <Outlet />
        </>
    );
}