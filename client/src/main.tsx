import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './index.css';

import Root from './Root';
import Home from './pages/Home/Home';
import List from './pages/List/List';
import ProjectList from './pages/ProjectList/ProjectList';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={ <Root /> }>
          <Route index element={ <ProjectList /> } />
          <Route path=':uuid'>
            <Route index element={ <Home /> } />
            <Route path='list' element={ <List /> }></Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
